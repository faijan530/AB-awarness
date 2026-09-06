import { NewsStatus, LocationType, Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { AppError } from '../../../middlewares/error.middleware';
import {
  CreateLocationPayload,
  UpdateLocationPayload,
  LocationDTO,
  LocationTreeNode,
} from './location.types';

export class LocationService {
  /**
   * Helper: Generate unique slug for location
   */
  public static async generateUniqueSlug(name: string, currentId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug || 'location';
    let counter = 1;

    while (true) {
      const existing = await prisma.location.findUnique({ where: { slug } });
      if (!existing || (currentId && existing.id === currentId)) {
        return slug;
      }
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Helper: Validate against circular parent hierarchy for locations
   */
  private static async validateParentHierarchy(locationId: string | null, parentId: string | null): Promise<void> {
    if (!parentId) return;

    if (locationId && locationId === parentId) {
      throw new AppError('A location cannot be its own parent', 400, 'LOCATION_CIRCULAR_REFERENCE');
    }

    const parent = await prisma.location.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new AppError('Parent location not found', 404, 'LOCATION_PARENT_INVALID');
    }

    let currentParentId: string | null = parent.parentId;
    while (currentParentId) {
      if (locationId && currentParentId === locationId) {
        throw new AppError('Circular parent location relationship detected', 400, 'LOCATION_CIRCULAR_REFERENCE');
      }
      const ancestor = await prisma.location.findUnique({ where: { id: currentParentId } });
      currentParentId = ancestor?.parentId || null;
    }
  }

  /**
   * List all locations (Optionally filtered by type and active status)
   */
  public static async getLocations(onlyActive = true, type?: LocationType): Promise<LocationDTO[]> {
    const where: any = {};
    if (onlyActive) where.isActive = true;
    if (type) where.type = type;

    const locations = await prisma.location.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    });

    return locations.map((loc) => ({
      ...loc,
      latitude: loc.latitude ? Number(loc.latitude) : null,
      longitude: loc.longitude ? Number(loc.longitude) : null,
    }));
  }

  /**
   * Build hierarchical location tree
   */
  public static async getLocationTree(onlyActive = true): Promise<LocationTreeNode[]> {
    const locations = await prisma.location.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: [{ name: 'asc' }],
    });

    const locationMap = new Map<string, LocationTreeNode>();
    locations.forEach((loc) => {
      locationMap.set(loc.id, {
        ...loc,
        latitude: loc.latitude ? Number(loc.latitude) : null,
        longitude: loc.longitude ? Number(loc.longitude) : null,
        children: [],
      });
    });

    const tree: LocationTreeNode[] = [];

    locations.forEach((loc) => {
      const node = locationMap.get(loc.id)!;
      if (loc.parentId && locationMap.has(loc.parentId)) {
        locationMap.get(loc.parentId)!.children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  /**
   * Search locations by keyword / prefix matching
   */
  public static async searchLocations(query: string, limit = 15): Promise<LocationDTO[]> {
    if (!query || !query.trim()) return [];

    const q = query.trim();

    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return locations.map((loc) => ({
      ...loc,
      latitude: loc.latitude ? Number(loc.latitude) : null,
      longitude: loc.longitude ? Number(loc.longitude) : null,
    }));
  }

  /**
   * Get location details by slug
   */
  public static async getLocationBySlug(slug: string): Promise<LocationDTO> {
    const location = await prisma.location.findUnique({ where: { slug } });
    if (!location) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }
    return {
      ...location,
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
    };
  }

  /**
   * Get news by location slug with geographic inheritance
   */
  public static async getNewsByLocationSlug(slug: string, page = 1, limit = 10): Promise<any> {
    const normalizedSlug = slug.trim().toLowerCase();
    const location = await prisma.location.findFirst({
      where: {
        OR: [
          { slug: normalizedSlug },
          { name: { equals: slug.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (!location) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }

    // Collect location and its descendant child location IDs for geographic inheritance
    const childLocations = await prisma.location.findMany({
      where: { parentId: location.id },
      select: { id: true },
    });

    const targetLocationIds = [location.id, ...childLocations.map((c) => c.id)];

    const skip = (page - 1) * limit;

    const whereClause: Prisma.NewsWhereInput = {
      status: NewsStatus.PUBLISHED,
      locations: {
        some: {
          locationId: { in: targetLocationIds },
        },
      },
    };

    const [newsItems, total] = await Promise.all([
      prisma.news.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          categories: { include: { category: true } },
          locations: { include: { location: true } },
          author: true,
          featuredImage: true,
        },
      }),
      prisma.news.count({ where: whereClause }),
    ]);

    const articles = newsItems.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.shortDescription,
      content: item.content,
      coverImageUrl: item.featuredImage?.url || null,
      status: item.status,
      viewCount: Number(item.viewCount),
      isFeatured: item.isFeatured,
      isBreaking: item.isBreaking,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      category: item.categories.find((c) => c.isPrimary)?.category || item.categories[0]?.category || null,
      location: item.locations.find((l) => l.isPrimary)?.location || item.locations[0]?.location || null,
      author: item.author
        ? { id: item.author.id, fullName: item.author.fullName, avatarUrl: item.author.avatarUrl }
        : null,
    }));

    return {
      location: {
        ...location,
        latitude: location.latitude ? Number(location.latitude) : null,
        longitude: location.longitude ? Number(location.longitude) : null,
      },
      articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Create Location
   */
  public static async createLocation(payload: CreateLocationPayload): Promise<LocationDTO> {
    if (!payload.name || !payload.name.trim()) {
      throw new AppError('Location name is required', 400, 'LOCATION_NAME_REQUIRED');
    }
    if (!payload.type) {
      throw new AppError('Location type is required', 400, 'LOCATION_TYPE_REQUIRED');
    }

    await this.validateParentHierarchy(null, payload.parentId || null);

    const slug = await this.generateUniqueSlug(payload.name);

    const location = await prisma.location.create({
      data: {
        name: payload.name.trim(),
        slug,
        type: payload.type,
        parentId: payload.parentId || null,
        stateCode: payload.stateCode ? payload.stateCode.trim() : null,
        districtCode: payload.districtCode ? payload.districtCode.trim() : null,
        latitude: payload.latitude !== undefined ? payload.latitude : null,
        longitude: payload.longitude !== undefined ? payload.longitude : null,
        isActive: payload.isActive ?? true,
      },
    });

    return {
      ...location,
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
    };
  }

  /**
   * Admin: Update Location
   */
  public static async updateLocation(id: string, payload: UpdateLocationPayload): Promise<LocationDTO> {
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }

    if (payload.parentId !== undefined) {
      await this.validateParentHierarchy(id, payload.parentId);
    }

    let slug = existing.slug;
    if (payload.name && payload.name.trim() !== existing.name) {
      slug = await this.generateUniqueSlug(payload.name, id);
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        name: payload.name ? payload.name.trim() : undefined,
        slug,
        type: payload.type !== undefined ? payload.type : undefined,
        parentId: payload.parentId !== undefined ? payload.parentId : undefined,
        stateCode: payload.stateCode !== undefined ? (payload.stateCode ? payload.stateCode.trim() : null) : undefined,
        districtCode: payload.districtCode !== undefined ? (payload.districtCode ? payload.districtCode.trim() : null) : undefined,
        latitude: payload.latitude !== undefined ? payload.latitude : undefined,
        longitude: payload.longitude !== undefined ? payload.longitude : undefined,
        isActive: payload.isActive !== undefined ? payload.isActive : undefined,
      },
    });

    return {
      ...updated,
      latitude: updated.latitude ? Number(updated.latitude) : null,
      longitude: updated.longitude ? Number(updated.longitude) : null,
    };
  }

  /**
   * Admin: Toggle Active Location
   */
  public static async toggleActive(id: string, isActive: boolean): Promise<LocationDTO> {
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }

    const updated = await prisma.location.update({
      where: { id },
      data: { isActive },
    });

    return {
      ...updated,
      latitude: updated.latitude ? Number(updated.latitude) : null,
      longitude: updated.longitude ? Number(updated.longitude) : null,
    };
  }

  /**
   * Admin: Delete Location (Deactivates if associated content exists)
   */
  public static async deleteLocation(id: string): Promise<LocationDTO> {
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }

    const linkedCount = await prisma.newsLocation.count({ where: { locationId: id } });

    if (linkedCount > 0) {
      const deactivated = await prisma.location.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        ...deactivated,
        latitude: deactivated.latitude ? Number(deactivated.latitude) : null,
        longitude: deactivated.longitude ? Number(deactivated.longitude) : null,
      };
    }

    const deleted = await prisma.location.delete({ where: { id } });
    return {
      ...deleted,
      latitude: deleted.latitude ? Number(deleted.latitude) : null,
      longitude: deleted.longitude ? Number(deleted.longitude) : null,
    };
  }
}
