import { prisma } from '../config/database';
import { MediaService } from '../modules/media/media.service';
import { MediaType, MediaRole, NewsStatus } from '@prisma/client';

async function runModule08MultimediaTests() {
  console.log('================================================================');
  console.log('📸 MODULE 08: MULTIMEDIA, CDN MEDIA & ATTACHMENTS TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS ${totalTests}] ${testName}`);
      if (detail) console.log(`   ↳ ${detail}`);
    } else {
      console.error(`❌ [FAIL ${totalTests}] ${testName}`);
      if (detail) console.error(`   ↳ ${detail}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // 1. Setup Admin Actor and Target Article
    console.log('--- Setting up Admin and Published Story ---');
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@abmedia.in' },
          { userRoles: { some: { role: { name: 'SUPER_ADMIN' } } } },
        ],
      },
    });
    if (!admin) throw new Error('No SUPER_ADMIN found in database');

    const article = await prisma.news.findFirst({
      where: { status: NewsStatus.PUBLISHED, deletedAt: null },
    });
    if (!article) throw new Error('No published news article found.');

    console.log(`👤 Admin: ${admin.fullName} (${admin.id})`);
    console.log(`📰 Article: "${article.title}" (${article.id})\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Create Simulated Upload Media
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing Media Creation / Upload ---');
    const testMedia = await prisma.media.create({
      data: {
        uploadedBy: admin.id,
        type: MediaType.IMAGE,
        originalName: 'palamu_health_camp_2026.jpg',
        storageKey: 'images/2026/08/palamu_health_camp_2026.jpg',
        url: '/uploads/images/2026/08/palamu_health_camp_2026.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: BigInt(2457600), // 2.4 MB
        width: 1920,
        height: 1080,
        status: 'READY',
      },
    });

    assert(
      Boolean(testMedia.id && testMedia.status === 'READY'),
      'Media asset registered with status READY',
      `Media ID: ${testMedia.id}, File: ${testMedia.originalName}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Retrieve Media Detail
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Media Retrieval & Format Serialization ---');
    const retrieved = await MediaService.getMediaById(testMedia.id);
    assert(
      retrieved.id === testMedia.id && typeof retrieved.sizeBytes === 'number',
      'Media details fetched with BigInt sizeBytes serialized to number',
      `Size: ${(retrieved.sizeBytes / (1024 * 1024)).toFixed(2)} MB, Dimensions: ${retrieved.width}x${retrieved.height}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Super Admin Media Metadata Edit
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Media Metadata Edit ---');
    const updatedMeta = await MediaService.updateMediaMetadata(testMedia.id, {
      originalName: 'palamu_health_camp_official_highres.jpg',
    });
    assert(
      updatedMeta.originalName === 'palamu_health_camp_official_highres.jpg',
      'Media metadata updated successfully',
      `New Name: ${updatedMeta.originalName}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Attach Media to News Article as GALLERY and FEATURED
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing News Media Attachments ---');
    const attachedGallery = await MediaService.attachMediaToNews(
      article.id,
      testMedia.id,
      'GALLERY',
      'Photo of the inaugural mobile health unit in Medininagar',
      1
    );

    assert(
      Boolean(attachedGallery && attachedGallery.mediaRole === 'GALLERY'),
      'Media attached to news story as GALLERY photo with caption',
      `Caption: "${attachedGallery.caption}"`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Query Article Media
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Article Media Listing ---');
    const newsMediaList = await MediaService.getNewsMedia(article.id);
    const foundAttached = newsMediaList.find((nm) => nm.mediaId === testMedia.id);

    assert(
      foundAttached !== undefined && foundAttached.media?.url === testMedia.url,
      'Article media items query returns attached photo with populated Media record',
      `Attached count: ${newsMediaList.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Media Usage Inspection
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Media Usage Inspection ---');
    const usage = await MediaService.getMediaUsage(testMedia.id);
    assert(
      usage.totalUsage >= 1 && usage.articles.some((a) => a.id === article.id),
      'Usage inspection identifies that media is attached to target article',
      `Total articles using this media: ${usage.totalUsage}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Quarantine & Restore Flow
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Quarantine & Restore Security Workflow ---');
    const quarantined = await MediaService.quarantineMedia(testMedia.id);
    assert(
      quarantined.status === 'QUARANTINED',
      'Media placed into QUARANTINED security state',
      `Status: ${quarantined.status}`
    );

    const restored = await MediaService.restoreMedia(testMedia.id);
    assert(
      restored.status === 'READY',
      'Media restored back to READY state',
      `Status: ${restored.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Safe Deletion Guard & Cleanup
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Deletion Guard & Detach Cleanup ---');
    let deletionBlocked = false;
    try {
      await MediaService.deleteMedia(testMedia.id, admin.id, true);
    } catch (e: any) {
      deletionBlocked = e.code === 'MEDIA_IN_USE';
    }

    assert(
      deletionBlocked === true,
      'Safe deletion guard prevents deleting media currently attached to active news',
      'Prevented accidental broken image references'
    );

    // Detach media first
    await MediaService.detachMediaFromNews(article.id, testMedia.id);

    // Now delete succeeds
    await MediaService.deleteMedia(testMedia.id, admin.id, true);
    const deletedInDb = await prisma.media.findUnique({ where: { id: testMedia.id } });

    assert(
      deletedInDb?.status === 'DELETED' && deletedInDb.deletedAt !== null,
      'Media successfully soft-deleted after detaching from article'
    );

    // Final purge of test record
    await prisma.media.delete({ where: { id: testMedia.id } }).catch(() => {});

    console.log('\n================================================================');
    console.log(`🎉 ALL MODULE 08 MULTIMEDIA TESTS PASSED (${passedTests}/${totalTests})!`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ MODULE 08 TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runModule08MultimediaTests();
