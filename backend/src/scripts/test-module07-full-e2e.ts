import { prisma } from '../config/database';
import { VerificationService } from '../modules/verification/verification.service';
import { OriginalityEngine } from '../modules/verification/originality.engine';
import { FactCheckEngine } from '../modules/verification/fact-check.engine';
import { ModerationService } from '../modules/verification/moderation.service';
import { MediaService } from '../modules/media/media.service';
import { SourceService } from '../modules/sources/source.service';
import { NewsStatus, RoleName, SourceType, CredibilityStatus } from '@prisma/client';

async function runSelfTestingSuite() {
  console.log('===============================================================');
  console.log(' MODULE 7: FULL SELF-TESTING SUITE (MEDIA, SOURCES & FACT VERIFICATION)');
  console.log('===============================================================\n');

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

  // -------------------------------------------------------------------------
  // TEST 1: Originality & Duplicate Detection Engine
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Testing Originality Engine & Token Shingles ---');
  const baseStory =
    'The district administration of Palamu announced a massive rural road construction project connecting 45 villages with state highways today.';
  const copiedStory =
    'The district administration of Palamu announced a massive rural road construction project connecting 45 villages with state highways today.';
  const uniqueStory =
    'Heavy monsoon rains triggered minor flash floods across Garhwa agricultural belts damaging standing paddy crops.';

  const identicalComparison = OriginalityEngine.compareTwoArticles(baseStory, copiedStory);
  assert(
    identicalComparison.jaccardSimilarity >= 0.9,
    'Algorithmic Duplicate Detection: Identical text triggers near 1.0 Jaccard similarity',
    `Similarity: ${(identicalComparison.jaccardSimilarity * 100).toFixed(1)}%, Classification: ${identicalComparison.classification}`
  );

  const uniqueComparison = OriginalityEngine.compareTwoArticles(baseStory, uniqueStory);
  assert(
    uniqueComparison.jaccardSimilarity < 0.3,
    'Algorithmic Originality Detection: Distinct stories yield low similarity',
    `Similarity: ${(uniqueComparison.jaccardSimilarity * 100).toFixed(1)}%, Classification: ${uniqueComparison.classification}`
  );

  // -------------------------------------------------------------------------
  // TEST 2: Fact Checking & Claim Extraction Engine
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Fact-Checking & Claim Extraction Engine ---');
  const articleWithClaims =
    'According to Deputy Commissioner Shashi Ranjan, the Rs 450 crore bypass corridor will open on 15 August 2026. Official police reports confirmed zero casualties.';
  const extractedClaims = FactCheckEngine.extractClaims(articleWithClaims);

  assert(
    extractedClaims.length >= 2,
    'Claim Extraction Engine: Automatically extracts verifiable statements, figures, and dates',
    `Identified ${extractedClaims.length} verifiable assertions from news body.`
  );

  // -------------------------------------------------------------------------
  // TEST 3: Sources Management & Credibility Registry
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Official Sources Registry ---');
  const sources = await SourceService.listSources();
  assert(
    sources.items.length >= 5,
    'Sources Registry: Verified official platform sources populated',
    `Found ${sources.items.length} registered sources (PIB, Jharkhand Govt, Palamu DC, Garhwa Admin, PTI).`
  );

  const testSource = await SourceService.createSource({
    name: 'District Police Control Room Palamu',
    sourceType: SourceType.GOVERNMENT,
    url: 'https://jhpolice.gov.in/palamu',
    description: 'Direct press releases regarding law and order and road safety alerts.',
    credibilityStatus: CredibilityStatus.VERIFIED,
  });

  assert(
    testSource.id && testSource.credibilityStatus === 'VERIFIED',
    'Sources Creation: Created new official police source record with VERIFIED credibility status',
    `Source ID: ${testSource.id}`
  );

  // -------------------------------------------------------------------------
  // TEST 4: Media Object Storage & Quarantine Controls
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Media Management & Quarantine Controls ---');
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@abmedia.in' },
  });
  if (!adminUser) throw new Error('Admin user required for test');

  // Seed sample media asset in storage
  const sampleMedia = await prisma.media.create({
    data: {
      uploadedBy: adminUser.id,
      type: 'IMAGE',
      originalName: 'palamu_bridge_inspection.jpg',
      storageKey: 'media/2026/08/30/palamu_bridge_inspection.jpg',
      url: '/uploads/media/2026/08/30/palamu_bridge_inspection.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: BigInt(1420500),
      status: 'READY',
    },
  });

  assert(
    sampleMedia.id && sampleMedia.status === 'READY',
    'Media Storage: Registered media asset in platform object storage pipeline',
    `Media ID: ${sampleMedia.id}`
  );

  const quarantined = await MediaService.quarantineMedia(sampleMedia.id);
  assert(
    quarantined.status === 'QUARANTINED',
    'Media Quarantine: Super Admin successfully quarantined suspicious media asset',
    `Status: ${quarantined.status}`
  );

  const restored = await MediaService.restoreMedia(sampleMedia.id);
  assert(
    restored.status === 'READY',
    'Media Restore: Super Admin restored quarantined asset back to READY status',
    `Status: ${restored.status}`
  );

  // -------------------------------------------------------------------------
  // TEST 5: Verification Lifecycle & Editorial Decision
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Verification Lifecycle & Editorial Decision ---');
  const testStory = await prisma.news.create({
    data: {
      title: 'Rural Electrification Milestone Achieved in 30 Palamu Villages',
      slug: `rural-electrification-milestone-${Date.now()}`,
      content:
        'State power department confirmed electrification of 30 remote villages under the Mukhyamantri Ujjwal Yojana on 28 August 2026. The executive engineer verified grid connectivity.',
      status: NewsStatus.SUBMITTED,
      authorId: adminUser.id,
      featuredImageId: sampleMedia.id,
    },
  });

  // Attach official source to news
  await SourceService.attachSourceToNews(
    testStory.id,
    testSource.id,
    'https://jharkhand.gov.in/power/orders/102.pdf',
    'Formal power dispatch notification certified by executive engineer.'
  );

  // Request Verification
  const verification = await VerificationService.requestVerification(testStory.id, adminUser.id);
  assert(
    verification.record.id && verification.originalityReport.duplicateClassification === 'ORIGINAL',
    'Verification Execution: Generated composite originality & factual claim analysis',
    `Score: ${verification.originalityReport.compositeOriginalityScore}/100, Claims: ${verification.claimsReport.claims.length}`
  );

  // Override claim status
  const claimId = verification.claimsReport.claims[0].claimId;
  const claimOverride = await VerificationService.reviewClaim(
    verification.record.id,
    claimId,
    { status: 'VERIFIED', sourceEvidence: 'Cross-checked with state power department gazette release.' },
    adminUser.id
  );
  assert(
    claimOverride.claims[0].status === 'VERIFIED',
    'Super Admin Claim Review: Successfully verified individual factual claim',
    `Claim: "${claimOverride.claims[0].statement.slice(0, 45)}..." -> VERIFIED`
  );

  // Super Admin Decision: Approve
  const finalDecision = await VerificationService.makeEditorialDecision(
    verification.record.id,
    {
      decision: 'APPROVE',
      rationale: 'Primary evidence certified by state power board; originality score 100%.',
    },
    adminUser.id
  );
  assert(
    finalDecision.verificationStatus === 'VERIFIED',
    'Editorial Decision: Super Admin approved verification record',
    `News Status: ${finalDecision.newsStatus}, Verification: ${finalDecision.verificationStatus}`
  );

  // -------------------------------------------------------------------------
  // TEST 6: Public Reader Verification & Citations Display
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Testing Public Reader Verification & Citations Display ---');
  const publicSummary = await VerificationService.getPublicVerificationSummary(testStory.id);
  assert(
    publicSummary.isVerified === true && publicSummary.badgeText.includes('Verified Story'),
    'Public Reader Badge: Formatted compliant verification indicator per Section 46',
    `Badge: "${publicSummary.badgeText}"`
  );

  // Cleanup temporary test records
  await prisma.verificationRecord.deleteMany({ where: { newsId: testStory.id } });
  await prisma.newsSource.deleteMany({ where: { newsId: testStory.id } });
  await prisma.news.delete({ where: { id: testStory.id } });
  await prisma.media.delete({ where: { id: sampleMedia.id } });
  await SourceService.deleteSource(testSource.id);

  console.log('\n===============================================================');
  console.log(` RESULT: ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY (100% SUCCESS RATE)`);
  console.log(' MODULE 7 MEDIA, SOURCES & FACT VERIFICATION FULLY OPERATIONAL');
  console.log('===============================================================\n');
}

runSelfTestingSuite()
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
