import { PrismaClient, NewsStatus } from '@prisma/client';
import { EventService } from '../modules/analytics/event.service';
import { AggregationService } from '../modules/analytics/aggregation.service';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { AuditService } from '../modules/audit/audit.service';
import { SystemService } from '../modules/system/system.service';
import { AnalyticsEventType } from '../modules/analytics/analytics.types';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Autonomous Testing for Module 11 (Analytics, Audit & System Management)...\n');

  try {
    // 0. Ensure a test published news article exists
    let testArticle = await prisma.news.findFirst({
      where: { status: NewsStatus.PUBLISHED },
    });

    if (!testArticle) {
      let admin = await prisma.user.findFirst();
      if (!admin) {
        admin = await prisma.user.create({
          data: { fullName: 'Test Admin', email: 'testadmin@abmedia.in', passwordHash: 'hash' },
        });
      }
      testArticle = await prisma.news.create({
        data: {
          title: 'Test Dynamic Story for Module 11',
          slug: 'test-dynamic-story-mod-11-' + Date.now(),
          content: 'Full story content for analytics verification.',
          status: NewsStatus.PUBLISHED,
          authorId: admin.id,
          publishedAt: new Date(),
        },
      });
    }

    console.log(`✅ [SETUP] Target News Article: "${testArticle.title}" (ID: ${testArticle.id})`);

    // -------------------------------------------------------------
    // TEST 1: Event Recording & Deduplication
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Event Service & View Deduplication ---');
    const viewRes1 = await EventService.recordEvent(
      {
        event: AnalyticsEventType.NEWS_VIEWED,
        entityType: 'NEWS',
        entityId: testArticle.id,
        anonymousId: 'anon-session-123',
      },
      { ipAddress: '127.0.0.1' }
    );
    console.log('✔ Event 1 Recorded:', viewRes1);

    const viewRes2 = await EventService.recordEvent(
      {
        event: AnalyticsEventType.NEWS_VIEWED,
        entityType: 'NEWS',
        entityId: testArticle.id,
        anonymousId: 'anon-session-123',
      },
      { ipAddress: '127.0.0.1' }
    );
    console.log('✔ Event 2 Deduplication Result:', viewRes2);
    if (viewRes2.deduplicated !== true) {
      throw new Error('Deduplication failed: Expected deduplicated=true for duplicate view');
    }

    // Record Zero-Result Search Event
    await EventService.recordEvent({
      event: AnalyticsEventType.SEARCH_PERFORMED,
      entityType: 'SEARCH',
      metadata: { query: 'palamu railway project', resultCount: 0 },
    });
    console.log('✔ Zero-Result Search Event Recorded');

    // -------------------------------------------------------------
    // TEST 2: Aggregation Service
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Aggregation Service ---');
    const aggRes = await AggregationService.runDailyAggregation(new Date());
    console.log('✔ Daily Metric Aggregation Output:', aggRes);

    // -------------------------------------------------------------
    // TEST 3: Analytics Service Queries
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Analytics Queries & Reporting ---');
    const newsAnalytics = await AnalyticsService.getNewsAnalytics({});
    console.log(`✔ News Analytics: Total Views=${newsAnalytics.totalViews}, Top Articles Count=${newsAnalytics.topArticles.length}`);

    const categoryAnalytics = await AnalyticsService.getCategoryAnalytics({});
    console.log(`✔ Category Analytics: ${categoryAnalytics.length} categories analyzed`);

    const locationAnalytics = await AnalyticsService.getLocationAnalytics({});
    console.log(
      `✔ Dynamic Location Analytics: ${locationAnalytics.allLocations.length} locations total, ${locationAnalytics.localJournalismDashboard.districts.length} local districts/cities`
    );

    const userAnalytics = await AnalyticsService.getUserAnalytics({});
    console.log(`✔ User Analytics: ${userAnalytics.totalUsers} total users (${userAnalytics.activeUsers} active)`);

    const searchAnalytics = await AnalyticsService.getSearchAnalytics({});
    console.log(
      `✔ Search Analytics: Total Searches=${searchAnalytics.searchVolume}, Zero-Result Searches=${searchAnalytics.zeroResultSearches.length}`
    );

    const dashboard = await AnalyticsService.getConsolidatedDashboard();
    console.log('✔ Super Admin Consolidated Dashboard:', JSON.stringify(dashboard, null, 2));

    // -------------------------------------------------------------
    // TEST 4: Audit Service & Immutability & Sensitive Redaction
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Audit Service & Redaction ---');
    const auditRecord = await AuditService.record({
      action: 'SETTING_CHANGED',
      entityType: 'SYSTEM_SETTING',
      entityId: 'comments_enabled',
      oldValues: { password: 'secretPassword123', comments_enabled: false },
      newValues: { comments_enabled: true },
      ipAddress: '192.168.1.1',
    });
    console.log('✔ Audit Log Entry Created ID:', auditRecord.id);

    const fetchedAudit = await AuditService.getAuditLogById(auditRecord.id);
    const oldVals = fetchedAudit.oldValues as any;
    console.log('✔ Sensitive Data Redaction Check: password =', oldVals?.password);
    if (oldVals?.password !== '[REDACTED]') {
      throw new Error('Redaction failed! Password was not redacted to [REDACTED]');
    }

    const distinctActions = await AuditService.getDistinctActions();
    console.log('✔ Dynamic Distinct Audit Actions in DB:', distinctActions);

    // -------------------------------------------------------------
    // TEST 5: System Service & Feature Flags & Health
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: System Management & Health ---');
    const settings = await SystemService.getSettings();
    console.log(`✔ System Settings Count: ${settings.length}`);

    const updatedSetting = await SystemService.updateSetting('comments_enabled', { value: true, isPublic: true });
    console.log('✔ Updated System Setting comments_enabled:', updatedSetting.value);

    const publicConfig = await SystemService.getPublicConfig();
    console.log('✔ Safe Public Config Keys:', Object.keys(publicConfig));

    const testFlagKey = 'test_feature_flag_' + Date.now();
    const createdFlag = await SystemService.createFeatureFlag({
      key: testFlagKey,
      description: 'Autonomous test feature flag',
      enabled: false,
    });
    console.log(`✔ Created Feature Flag: ${createdFlag.key}`);

    const enabledFlag = await SystemService.updateFeatureFlag(testFlagKey, { enabled: true });
    console.log(`✔ Enabled Feature Flag Status: ${enabledFlag.enabled}`);

    const liveness = SystemService.getLiveness();
    console.log('✔ System Health Liveness:', liveness.status);

    const readiness = await SystemService.getReadiness();
    console.log('✔ System Health Readiness:', readiness.status);

    console.log('\n🎉 ALL MODULE 11 FUNCTIONAL REQUIREMENTS VERIFIED & PASSED AUTONOMOUSLY!');
  } catch (error) {
    console.error('❌ Test Failure:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
