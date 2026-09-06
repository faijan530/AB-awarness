import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { AdvertiserStatus, CampaignStatus, AdCreativeType } from '@prisma/client';
import {
  CreateAdvertiserDTO,
  UpdateAdvertiserDTO,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  CreateCreativeDTO,
  UpdateCreativeDTO,
  UpdatePlacementDTO,
  AdServeQuery,
  ServedAdResponse,
} from './advertising.types';

export class AdvertisingService {
  /**
   * Ensure default placements exist
   */
  public static async ensureDefaultPlacements(): Promise<void> {
    const defaults = [
      { name: 'Homepage Top Leaderboard', code: 'HOME_TOP', dimensions: '728x90', priority: 10 },
      { name: 'Homepage Middle Feed', code: 'HOME_MIDDLE', dimensions: '300x250', priority: 5 },
      { name: 'News Top Leaderboard', code: 'NEWS_TOP', dimensions: '728x90', priority: 8 },
      { name: 'News In-Article', code: 'NEWS_MIDDLE', dimensions: '300x250', priority: 7 },
      { name: 'News Bottom Anchor', code: 'NEWS_BOTTOM', dimensions: '728x90', priority: 6 },
      { name: 'Category Header', code: 'CATEGORY_TOP', dimensions: '728x90', priority: 4 },
      { name: 'Desktop Sidebar Banner', code: 'SIDEBAR', dimensions: '300x600', priority: 9 },
    ];

    for (const p of defaults) {
      await prisma.adPlacement.upsert({
        where: { code: p.code },
        update: {},
        create: {
          name: p.name,
          code: p.code,
          dimensions: p.dimensions,
          priority: p.priority,
          isActive: true,
        },
      });
    }
  }

  // ==========================================
  // ADVERTISERS
  // ==========================================

  public static async createAdvertiser(dto: CreateAdvertiserDTO) {
    if (!dto.name || !dto.email) {
      throw new AppError('Advertiser name and email are required', 400, 'BAD_REQUEST');
    }

    return prisma.advertiser.create({
      data: {
        name: dto.name,
        contactName: dto.contactName || null,
        email: dto.email,
        phone: dto.phone || null,
        status: dto.status || AdvertiserStatus.ACTIVE,
      },
    });
  }

  public static async getAdvertisers(params?: { search?: string; status?: AdvertiserStatus }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return prisma.advertiser.findMany({
      where,
      include: {
        _count: { select: { campaigns: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getAdvertiserById(id: string) {
    const advertiser = await prisma.advertiser.findUnique({
      where: { id },
      include: { campaigns: true },
    });
    if (!advertiser) throw new AppError('Advertiser not found', 404, 'ADVERTISER_NOT_FOUND');
    return advertiser;
  }

  public static async updateAdvertiser(id: string, dto: UpdateAdvertiserDTO) {
    await this.getAdvertiserById(id);
    return prisma.advertiser.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.contactName !== undefined && { contactName: dto.contactName }),
        ...(dto.email && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  // ==========================================
  // CAMPAIGNS
  // ==========================================

  public static async createCampaign(dto: CreateCampaignDTO) {
    const advertiser = await this.getAdvertiserById(dto.advertiserId);

    const start = new Date(dto.startAt);
    let end = new Date(dto.endAt);
    if (typeof dto.endAt === 'string' && dto.endAt.length === 10) {
      end = new Date(`${dto.endAt}T23:59:59.999Z`);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      throw new AppError('Invalid campaign start and end date schedule', 400, 'CAMPAIGN_DATE_INVALID');
    }

    const campaignStatus = dto.status || CampaignStatus.ACTIVE;

    const campaign = await prisma.campaign.create({
      data: {
        advertiserId: dto.advertiserId,
        name: dto.name,
        startAt: start,
        endAt: end,
        budget: dto.budget !== undefined ? dto.budget : null,
        dailyBudget: dto.dailyBudget !== undefined ? dto.dailyBudget : null,
        targetLocation: dto.targetLocation || null,
        targetCategory: dto.targetCategory || null,
        status: campaignStatus,
      },
    });

    // Auto-create initial active creative so campaign is immediately servable on public portal
    const headline = dto.headline?.trim() || dto.name;
    const destinationUrl = dto.destinationUrl?.trim() || 'https://abawareness.in';
    const mediaUrl = dto.mediaUrl?.trim() || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44';
    const description = dto.description?.trim() || `${dto.name} — Sponsored by ${advertiser.name}`;

    try {
      new URL(destinationUrl);
    } catch {
      throw new AppError('Invalid destination URL format', 400, 'CREATIVE_INVALID');
    }

    await prisma.adCreative.create({
      data: {
        campaignId: campaign.id,
        name: `${dto.name} Banner Creative`,
        type: dto.creativeType || AdCreativeType.IMAGE,
        mediaUrl,
        headline,
        description,
        destinationUrl,
        status: 'ACTIVE',
      },
    });

    return this.getCampaignById(campaign.id);
  }

  public static async getCampaigns(params?: { advertiserId?: string; status?: CampaignStatus }) {
    const where: any = {};
    if (params?.advertiserId) where.advertiserId = params.advertiserId;
    if (params?.status) where.status = params.status;

    return prisma.campaign.findMany({
      where,
      include: {
        advertiser: { select: { id: true, name: true } },
        _count: { select: { creatives: true, metrics: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getCampaignById(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        advertiser: true,
        creatives: true,
      },
    });
    if (!campaign) throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    return campaign;
  }

  public static async updateCampaign(id: string, dto: UpdateCampaignDTO) {
    await this.getCampaignById(id);

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.startAt) data.startAt = new Date(dto.startAt);
    if (dto.endAt) {
      let end = new Date(dto.endAt);
      if (typeof dto.endAt === 'string' && dto.endAt.length === 10) {
        end = new Date(`${dto.endAt}T23:59:59.999Z`);
      }
      data.endAt = end;
    }
    if (dto.budget !== undefined) data.budget = dto.budget;
    if (dto.dailyBudget !== undefined) data.dailyBudget = dto.dailyBudget;
    if (dto.targetLocation !== undefined) data.targetLocation = dto.targetLocation;
    if (dto.targetCategory !== undefined) data.targetCategory = dto.targetCategory;
    if (dto.status) data.status = dto.status;

    return prisma.campaign.update({
      where: { id },
      data,
    });
  }

  public static async activateCampaign(id: string) {
    const campaign = await this.getCampaignById(id);
    const now = new Date();
    const updateData: any = { status: CampaignStatus.ACTIVE };

    // Auto-extend expiration if campaign end date is in the past
    if (campaign.endAt < now) {
      updateData.endAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    // Check if campaign has active creatives; auto-create starter creative if none exists
    const activeCreativesCount = await prisma.adCreative.count({
      where: { campaignId: id, status: 'ACTIVE' },
    });

    if (activeCreativesCount === 0) {
      await prisma.adCreative.create({
        data: {
          campaignId: id,
          name: `${campaign.name} Banner Creative`,
          type: AdCreativeType.IMAGE,
          mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
          headline: campaign.name,
          description: `Active campaign sponsorship: ${campaign.name}`,
          destinationUrl: 'https://abawareness.in',
          status: 'ACTIVE',
        },
      });
    }

    return this.getCampaignById(id);
  }

  public static async pauseCampaign(id: string) {
    return this.updateCampaign(id, { status: CampaignStatus.PAUSED });
  }

  public static async deleteCampaign(id: string) {
    await this.getCampaignById(id);
    await prisma.adMetric.deleteMany({ where: { campaignId: id } });
    await prisma.adCreative.deleteMany({ where: { campaignId: id } });
    return prisma.campaign.delete({ where: { id } });
  }

  // ==========================================
  // AD CREATIVES
  // ==========================================

  public static async createCreative(dto: CreateCreativeDTO) {
    await this.getCampaignById(dto.campaignId);

    if (!dto.headline || !dto.destinationUrl) {
      throw new AppError('Headline and destinationUrl are required', 400, 'BAD_REQUEST');
    }

    try {
      new URL(dto.destinationUrl);
    } catch {
      throw new AppError('Invalid destination URL format', 400, 'CREATIVE_INVALID');
    }

    return prisma.adCreative.create({
      data: {
        campaignId: dto.campaignId,
        name: dto.name,
        type: dto.type || AdCreativeType.IMAGE,
        mediaUrl: dto.mediaUrl || null,
        headline: dto.headline,
        description: dto.description || null,
        destinationUrl: dto.destinationUrl,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  public static async getCreatives(params?: { campaignId?: string }) {
    const where: any = {};
    if (params?.campaignId) where.campaignId = params.campaignId;

    return prisma.adCreative.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getCreativeById(id: string) {
    const creative = await prisma.adCreative.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!creative) throw new AppError('Creative not found', 404, 'CREATIVE_NOT_FOUND');
    return creative;
  }

  public static async updateCreative(id: string, dto: UpdateCreativeDTO) {
    await this.getCreativeById(id);

    if (dto.destinationUrl) {
      try {
        new URL(dto.destinationUrl);
      } catch {
        throw new AppError('Invalid destination URL format', 400, 'CREATIVE_INVALID');
      }
    }

    return prisma.adCreative.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.mediaUrl !== undefined && { mediaUrl: dto.mediaUrl }),
        ...(dto.headline && { headline: dto.headline }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.destinationUrl && { destinationUrl: dto.destinationUrl }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  // ==========================================
  // PLACEMENTS
  // ==========================================

  public static async getPlacements() {
    await this.ensureDefaultPlacements();
    return prisma.adPlacement.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  public static async updatePlacement(id: string, dto: UpdatePlacementDTO) {
    return prisma.adPlacement.update({
      where: { id },
      data: dto,
    });
  }

  // ==========================================
  // AD SERVING & METRICS
  // ==========================================

  public static async serveAd(query: AdServeQuery): Promise<ServedAdResponse | null> {
    await this.ensureDefaultPlacements();

    const placement = await prisma.adPlacement.findUnique({
      where: { code: query.placementCode },
    });

    if (!placement || !placement.isActive) {
      return null;
    }

    const now = new Date();

    // Query active campaigns covering the current date
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        creatives: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (campaigns.length === 0) return null;

    // Filter matching location/category targeting if present
    const eligibleCreatives: { creative: any; campaign: any }[] = [];
    for (const c of campaigns) {
      if (c.targetLocation && query.location && !query.location.toLowerCase().includes(c.targetLocation.toLowerCase())) {
        continue;
      }
      if (c.targetCategory && query.category && !query.category.toLowerCase().includes(c.targetCategory.toLowerCase())) {
        continue;
      }
      for (const cr of c.creatives) {
        eligibleCreatives.push({ creative: cr, campaign: c });
      }
    }

    // If strict location/category filtered out all creatives, fallback to any active creative of active campaigns
    if (eligibleCreatives.length === 0) {
      for (const c of campaigns) {
        for (const cr of c.creatives) {
          eligibleCreatives.push({ creative: cr, campaign: c });
        }
      }
    }

    if (eligibleCreatives.length === 0) return null;

    // Pick random eligible creative
    const selected = eligibleCreatives[Math.floor(Math.random() * eligibleCreatives.length)];

    const all = eligibleCreatives.map((item) => ({
      creativeId: item.creative.id,
      campaignId: item.campaign.id,
      placementCode: query.placementCode,
      name: item.creative.name,
      type: item.creative.type,
      headline: item.creative.headline,
      description: item.creative.description,
      mediaUrl: item.creative.mediaUrl,
      clickUrl: `/api/v1/ads/${item.creative.id}/click`,
      impressionUrl: `/api/v1/ads/${item.creative.id}/impression`,
    }));

    return {
      creativeId: selected.creative.id,
      campaignId: selected.campaign.id,
      placementCode: query.placementCode,
      name: selected.creative.name,
      type: selected.creative.type,
      headline: selected.creative.headline,
      description: selected.creative.description,
      mediaUrl: selected.creative.mediaUrl,
      clickUrl: `/api/v1/ads/${selected.creative.id}/click`,
      impressionUrl: `/api/v1/ads/${selected.creative.id}/impression`,
      allAds: all,
    };
  }

  public static async recordImpression(
    creativeId: string,
    placementCode: string,
    ipHash?: string,
    userAgent?: string
  ): Promise<void> {
    const creative = await prisma.adCreative.findUnique({
      where: { id: creativeId },
    });
    if (!creative) return;

    await prisma.adMetric.create({
      data: {
        creativeId,
        campaignId: creative.campaignId,
        placementCode: placementCode || 'UNKNOWN',
        eventType: 'IMPRESSION',
        ipHash: ipHash || null,
        userAgent: userAgent || null,
      },
    });
  }

  public static async recordClick(creativeId: string, ipHash?: string, userAgent?: string): Promise<string> {
    const creative = await prisma.adCreative.findUnique({
      where: { id: creativeId },
    });
    if (!creative) {
      throw new AppError('Ad creative not found', 404, 'CREATIVE_NOT_FOUND');
    }

    await prisma.adMetric.create({
      data: {
        creativeId,
        campaignId: creative.campaignId,
        placementCode: 'CLICK',
        eventType: 'CLICK',
        ipHash: ipHash || null,
        userAgent: userAgent || null,
      },
    });

    return creative.destinationUrl;
  }
}
