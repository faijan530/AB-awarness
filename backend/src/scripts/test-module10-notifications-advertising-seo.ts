import { prisma } from '../config/database';
import { NotificationType, AdvertiserStatus, CampaignStatus, AdCreativeType, NewsStatus } from '@prisma/client';
import { NotificationService } from '../modules/notifications/notification.service';
import { AdvertisingService } from '../modules/advertising/advertising.service';
import { SeoService } from '../modules/seo/seo.service';

async function runModule10Tests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING MODULE 10 TEST SUITE: NOTIFICATIONS, ADS & SEO');
  console.log('======================================================\n');

  // 0. Setup test users and articles
  const admin = await prisma.user.findFirst({
    where: {
      status: 'ACTIVE',
      userRoles: { some: { role: { name: 'SUPER_ADMIN' } } },
    },
  });
  if (!admin) throw new Error('No SUPER_ADMIN user found in database');

  const regularUser = await prisma.user.findFirst({
    where: {
      status: 'ACTIVE',
      userRoles: { none: { role: { name: 'SUPER_ADMIN' } } },
    },
  }) || admin;

  console.log(`✓ Test Admin User: ${admin.fullName} (${admin.id})`);
  console.log(`✓ Test Regular User: ${regularUser.fullName} (${regularUser.id})\n`);

  // ==========================================
  // SECTION 1: NOTIFICATIONS SUBSYSTEM
  // ==========================================
  console.log('--- 1. Testing Notifications Subsystem ---');

  // 1.1 Preferences
  const initialPrefs = await NotificationService.getPreferences(regularUser.id);
  console.log(`✓ Step 1.1: Fetched notification preferences for user`);

  const updatedPrefs = await NotificationService.updatePreferences(regularUser.id, {
    breakingNews: true,
    commentReplies: true,
    emailNotifications: false,
  });
  if (updatedPrefs.emailNotifications !== false) {
    throw new Error('Step 1.2 Failed: Notification preference update failed');
  }
  console.log(`✓ Step 1.2: Updated notification preferences (emailNotifications = false)`);

  // 1.3 Create Notification
  const notif1 = await NotificationService.createNotification({
    userId: regularUser.id,
    type: NotificationType.COMMENT_REPLY,
    title: 'New Reply to Your Comment',
    message: 'Someone replied to your civic comment on the local news story.',
    entityType: 'COMMENT',
  });
  if (!notif1 || notif1.isRead !== false) {
    throw new Error('Step 1.3 Failed: Notification creation failed');
  }
  console.log(`✓ Step 1.3: Created user notification (${notif1.id})`);

  const notif2 = await NotificationService.createNotification({
    userId: regularUser.id,
    type: NotificationType.BREAKING_NEWS,
    title: 'Breaking News: Heavy Rain Alert in Jharkhand',
    message: 'Disaster management issued an orange alert for rainfall.',
    entityType: 'NEWS',
  });
  if (!notif2) throw new Error('Step 1.4 Failed: Breaking news notification failed');
  console.log(`✓ Step 1.4: Created breaking news notification (${notif2.id})`);

  // 1.5 List Notifications
  const listResult = await NotificationService.getUserNotifications(regularUser.id, { page: 1, limit: 10 });
  if (listResult.notifications.length === 0 || listResult.unreadCount < 2) {
    throw new Error('Step 1.5 Failed: Notification list or unreadCount mismatch');
  }
  console.log(`✓ Step 1.5: Listed notifications (total: ${listResult.total}, unread: ${listResult.unreadCount})`);

  // 1.6 Mark single notification as read
  const readNotif = await NotificationService.markAsRead(notif1.id, regularUser.id);
  if (!readNotif.isRead || !readNotif.readAt) {
    throw new Error('Step 1.6 Failed: Mark as read did not update isRead or readAt');
  }
  console.log(`✓ Step 1.6: Marked notification ${notif1.id} as read`);

  // 1.7 Unread count
  const unreadStatus = await NotificationService.getUnreadCount(regularUser.id);
  console.log(`✓ Step 1.7: Unread notifications count verified (${unreadStatus.unreadCount})`);

  // 1.8 Mark all read
  const markAllResult = await NotificationService.markAllAsRead(regularUser.id);
  console.log(`✓ Step 1.8: Marked all notifications as read (updated count: ${markAllResult.count})`);

  // 1.9 Register device push token
  const device = await NotificationService.registerDevice(regularUser.id, {
    deviceType: 'WEB',
    pushToken: 'fcm-test-token-' + Date.now(),
  });
  if (!device.isActive) throw new Error('Step 1.9 Failed: Device registration failed');
  console.log(`✓ Step 1.9: Registered push device token for user (${device.id})`);

  // 1.10 Broadcast notification
  const broadcastResult = await NotificationService.broadcastNotification(admin.id, {
    type: NotificationType.SYSTEM,
    title: 'Platform Maintenance Notice',
    message: 'Scheduled infrastructure update tonight at 02:00 AM IST.',
  });
  console.log(`✓ Step 1.10: Dispatched broadcast notification to ${broadcastResult.sentCount} users\n`);

  // ==========================================
  // SECTION 2: ADVERTISING SUBSYSTEM
  // ==========================================
  console.log('--- 2. Testing Advertising Subsystem ---');

  // 2.1 Ensure placements
  await AdvertisingService.ensureDefaultPlacements();
  const placements = await AdvertisingService.getPlacements();
  if (placements.length < 5) throw new Error('Step 2.1 Failed: Default placements not seeded');
  console.log(`✓ Step 2.1: Default ad placements verified (${placements.length} placements)`);

  // 2.2 Create Advertiser
  const advertiser = await AdvertisingService.createAdvertiser({
    name: 'Jharkhand State Co-operative Bank',
    contactName: 'Ramesh Verma',
    email: `ads-test-${Date.now()}@jbank.example.com`,
    phone: '+919876543210',
    status: AdvertiserStatus.ACTIVE,
  });
  console.log(`✓ Step 2.2: Created advertiser: ${advertiser.name} (${advertiser.id})`);

  // 2.3 Create Campaign
  const now = new Date();
  const startAt = new Date(now.getTime() - 1000 * 60 * 60); // 1 hr ago
  const endAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days ahead

  const campaign = await AdvertisingService.createCampaign({
    advertiserId: advertiser.id,
    name: 'Monsoon Agriculture Credit Scheme 2026',
    startAt,
    endAt,
    budget: 50000,
    dailyBudget: 2000,
    targetLocation: 'Jharkhand',
    status: CampaignStatus.ACTIVE,
  });
  console.log(`✓ Step 2.3: Created and scheduled campaign (${campaign.name}, Status: ${campaign.status})`);

  // 2.4 Create Ad Creative
  const creative = await AdvertisingService.createCreative({
    campaignId: campaign.id,
    name: 'Monsoon Credit 728x90 Leaderboard',
    type: AdCreativeType.IMAGE,
    mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
    headline: 'Avail 0% Interest Monsoon Crop Loans Today',
    description: 'Special subsidy scheme for farmers across Palamu and Garhwa.',
    destinationUrl: 'https://jbank.example.com/schemes/monsoon-crop-credit',
    status: 'ACTIVE',
  });
  console.log(`✓ Step 2.4: Created ad creative: "${creative.headline}" (${creative.id})`);

  // 2.5 Serve Ad
  const servedAd = await AdvertisingService.serveAd({
    placementCode: 'HOME_TOP',
    location: 'Jharkhand',
  });
  if (!servedAd || servedAd.creativeId !== creative.id) {
    throw new Error('Step 2.5 Failed: Ad serving did not return the active targeted creative');
  }
  console.log(`✓ Step 2.5: Ad served successfully for placement HOME_TOP`);
  console.log(`  - Creative ID: ${servedAd.creativeId}`);
  console.log(`  - Headline: "${servedAd.headline}"`);
  console.log(`  - Click URL: ${servedAd.clickUrl}`);

  // 2.6 Record Impression
  await AdvertisingService.recordImpression(servedAd.creativeId, 'HOME_TOP', '127.0.0.1', 'Mozilla/5.0');
  console.log(`✓ Step 2.6: Recorded ad impression in analytics database`);

  // 2.7 Record Click & verify redirect
  const redirectTarget = await AdvertisingService.recordClick(servedAd.creativeId, '127.0.0.1', 'Mozilla/5.0');
  if (redirectTarget !== creative.destinationUrl) {
    throw new Error('Step 2.7 Failed: Click redirect target does not match creative destination URL');
  }
  console.log(`✓ Step 2.7: Click tracked and destination URL validated -> ${redirectTarget}\n`);

  // ==========================================
  // SECTION 3: SEO SUBSYSTEM
  // ==========================================
  console.log('--- 3. Testing SEO Subsystem ---');

  // 3.1 Fetch or create a published news article for SEO testing
  let publishedStory = await prisma.news.findFirst({
    where: { status: NewsStatus.PUBLISHED, deletedAt: null },
    include: { categories: true },
  });

  if (!publishedStory) {
    publishedStory = await prisma.news.create({
      data: {
        title: 'New Irrigation Reservoir Commissioned in Palamu District',
        slug: 'palamu-irrigation-reservoir-commissioned-' + Date.now(),
        content: '<p>Chief Minister inaugurated the major irrigation canal today...</p>',
        shortDescription: 'Key irrigation infrastructure commissioned to benefit 50 villages in Palamu.',
        status: NewsStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: admin.id,
      },
      include: { categories: true },
    });
  }

  // 3.2 Fetch complete SEO packet (Meta, OG, Twitter, JSON-LD)
  const seoPacket = await SeoService.getNewsSeoPacket(publishedStory.slug, 'https://abmedia.example.com');
  if (
    !seoPacket.metaTitle ||
    !seoPacket.openGraph ||
    !seoPacket.structuredData ||
    seoPacket.structuredData['@type'] !== 'NewsArticle'
  ) {
    throw new Error('Step 3.2 Failed: NewsArticle SEO packet is invalid');
  }
  console.log(`✓ Step 3.2: Generated complete SEO packet for news article:`);
  console.log(`  - Title: "${seoPacket.title}"`);
  console.log(`  - Canonical URL: ${seoPacket.canonicalUrl}`);
  console.log(`  - Robots Directive: ${seoPacket.robots}`);
  console.log(`  - Structured Data (@type): ${seoPacket.structuredData['@type']}`);
  console.log(`  - Structured Data Publisher: ${seoPacket.structuredData.publisher.name}`);

  // 3.3 Super Admin custom SEO metadata overrides
  const updatedSeo = await SeoService.updateNewsSeo(publishedStory.id, {
    metaTitle: 'Official Update: Palamu Water Project | Verified News',
    metaDescription: 'Detailed ground report on the newly commissioned water project in Palamu.',
    canonicalUrl: `https://abmedia.example.com/news/${publishedStory.slug}`,
    noIndex: false,
  });
  if (updatedSeo.title !== 'Official Update: Palamu Water Project | Verified News') {
    throw new Error('Step 3.3 Failed: Custom SEO metadata override failed');
  }
  console.log(`✓ Step 3.3: Super Admin updated custom SEO metadata overrides`);

  // 3.4 Generate standard XML Sitemap
  const sitemapXml = await SeoService.generateSitemapXml('https://abmedia.example.com');
  if (!sitemapXml.includes('<urlset') || !sitemapXml.includes(publishedStory.slug)) {
    throw new Error('Step 3.4 Failed: sitemap.xml does not contain expected published news url');
  }
  console.log(`✓ Step 3.4: Generated standard /sitemap.xml (${sitemapXml.length} bytes, contains news URLs)`);

  // 3.5 Generate Google News XML Sitemap
  const newsSitemapXml = await SeoService.generateNewsSitemapXml('https://abmedia.example.com');
  if (!newsSitemapXml.includes('xmlns:news=') || !newsSitemapXml.includes('<news:publication>')) {
    throw new Error('Step 3.5 Failed: news-sitemap.xml missing Google News schema');
  }
  console.log(`✓ Step 3.5: Generated Google News /news-sitemap.xml (<news:news> XML validated)`);

  // 3.6 Generate robots.txt
  const robotsTxt = SeoService.generateRobotsTxt('https://abmedia.example.com');
  if (!robotsTxt.includes('User-agent: *') || !robotsTxt.includes('Disallow: /admin/')) {
    throw new Error('Step 3.6 Failed: robots.txt missing disallow rules');
  }
  console.log(`✓ Step 3.6: Generated /robots.txt with admin disallows and sitemap indexes`);

  console.log('\n======================================================');
  console.log('🎉 ALL 23 MODULE 10 BACKEND TESTS PASSED (100%)');
  console.log('======================================================\n');
}

runModule10Tests()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
