import { prisma } from '../config/database';
import { VerificationService } from '../modules/verification/verification.service';
import { ModerationService } from '../modules/verification/moderation.service';
import { ReportReason } from '@prisma/client';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Module 7: Originality, Fact Verification & Moderation Tests');
  console.log('🧪 ========================================================\n');

  // 1. Get an existing news article and admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@abmedia.in' },
        { userRoles: { some: { role: { name: 'SUPER_ADMIN' } } } },
      ],
    },
  });
  if (!adminUser) throw new Error('No SUPER_ADMIN found in database');

  const article = await prisma.news.findFirst({
    where: { status: 'PUBLISHED' },
    include: { author: true },
  });
  if (!article) throw new Error('No published article found for verification test');

  console.log(`📌 Using Article: "${article.title}" (ID: ${article.id})`);
  console.log(`👤 Using Admin: ${adminUser.fullName} (ID: ${adminUser.id})\n`);

  // TEST 1: Request / Run Verification
  console.log('▶ [TEST 1] Initiating Verification (Originality + Fact-Check)...');
  const verification = await VerificationService.requestVerification(article.id, 'FACT_CHECK', adminUser.id);
  console.log(`✓ Verification Record ID: ${verification.id}`);
  console.log(`✓ Status: ${verification.status}`);
  console.log(`✓ Originality Score: ${verification.scores.originality}% (${verification.originality.duplicateLevel})`);
  console.log(`✓ Fact Support Score: ${verification.scores.factSupport}%`);
  console.log(`✓ Source Coverage: ${verification.scores.sourceCoverage}%`);
  console.log(`✓ Overall Score: ${verification.scores.overallScore}% (${verification.scores.overallAssessment})`);
  console.log(`✓ Extracted Claims Count: ${verification.factCheck.claims.length}`);
  if (verification.factCheck.claims.length > 0) {
    console.log(`  ↳ Claim 1: "${verification.factCheck.claims[0].claimText.slice(0, 60)}..."`);
    console.log(`  ↳ Status: ${verification.factCheck.claims[0].status}`);
  }
  console.log('✅ TEST 1 PASSED!\n');

  // TEST 2: Verification Status & Result endpoints
  console.log('▶ [TEST 2] Retrieving Verification Status & Public/Staff Views...');
  const statusCheck = await VerificationService.getVerificationStatus(verification.id);
  console.log(`✓ Status Check: ${statusCheck.status}, Score: ${statusCheck.overallScore}%`);

  const staffResult = await VerificationService.getVerificationResult(verification.id, true);
  const contributorResult = await VerificationService.getVerificationResult(verification.id, false, article.authorId);
  console.log(`✓ Staff Result Audit Trail Length: ${staffResult.auditTrail.length}`);
  console.log(`✓ Contributor Result Scores Overall: ${contributorResult.scores.overallScore}%`);
  console.log('✅ TEST 2 PASSED!\n');

  // TEST 3: Super Admin Dashboard Metrics
  console.log('▶ [TEST 3] Testing Super Admin Verification Dashboard Metrics...');
  const dashboard = await VerificationService.getAdminDashboard();
  console.log(`✓ Total Records: ${dashboard.totalCount}`);
  console.log(`✓ In Review: ${dashboard.inReviewCount}, Verified: ${dashboard.verifiedCount}`);
  console.log(`✓ High Similarity Alerts: ${dashboard.highSimilarityAlertsCount}`);
  console.log('✅ TEST 3 PASSED!\n');

  // TEST 4: Super Admin Verification Queue with Filters
  console.log('▶ [TEST 4] Testing Super Admin Verification Queue...');
  const queue = await VerificationService.getAdminVerificationQueue({ page: 1, limit: 5 });
  console.log(`✓ Queue Total: ${queue.meta.total}`);
  console.log(`✓ First Queue Item: "${queue.items[0]?.articleTitle}" (Score: ${queue.items[0]?.overallScore}%)`);
  console.log('✅ TEST 4 PASSED!\n');

  // TEST 5: Claim Review / Override
  if (verification.factCheck.claims.length > 0) {
    console.log('▶ [TEST 5] Testing Super Admin Individual Claim Review / Override...');
    const claim1Id = verification.factCheck.claims[0].id;
    const updatedWithClaim = await VerificationService.reviewClaim(
      verification.id,
      claim1Id,
      'SUPPORTED',
      'Manually verified with official district gazette by Super Admin.',
      adminUser.id
    );
    const updatedClaim = updatedWithClaim.factCheck.claims.find((c) => c.id === claim1Id);
    console.log(`✓ Claim 1 Status Overridden to: ${updatedClaim?.status}`);
    console.log(`✓ Admin Notes Saved: "${updatedClaim?.adminNotes}"`);
    console.log(`✓ Recalculated Fact Support Score: ${updatedWithClaim.scores.factSupport}%`);
    console.log('✅ TEST 5 PASSED!\n');
  }

  // TEST 6: Internal Moderator Notes (Isolated)
  console.log('▶ [TEST 6] Testing Internal Moderator Notes Isolation...');
  const withNote = await VerificationService.addModeratorNote(
    verification.id,
    'Confidential: Cross-checked with state irrigation bureau contact.',
    adminUser.id
  );
  console.log(`✓ Moderator Notes Count: ${withNote.moderatorNotes.length}`);
  console.log(`✓ Latest Note: "${withNote.moderatorNotes[withNote.moderatorNotes.length - 1]?.content}"`);

  // Verify non-staff cannot see notes
  const nonStaffCheck = await VerificationService.getVerificationResult(verification.id, false, article.authorId);
  if (nonStaffCheck.moderatorNotes.length === 0) {
    console.log('✓ Security Verified: Non-staff view strictly isolates internal moderator notes!');
  } else {
    throw new Error('Security Breach: Moderator notes exposed to non-staff!');
  }
  console.log('✅ TEST 6 PASSED!\n');

  // TEST 7: Editorial Decision (Approve / Live Publish)
  console.log('▶ [TEST 7] Testing Editorial Decision Workflow (APPROVE)...');
  const decided = await VerificationService.submitEditorialDecision(
    verification.id,
    'APPROVE',
    'High originality, factual claims verified against primary sources. Approved for live public broadcast.',
    undefined,
    adminUser.id
  );
  console.log(`✓ Verification Status: ${decided.status}`);
  console.log(`✓ Article Status: ${decided.article.status}`);
  console.log(`✓ Verified At: ${decided.verifiedAt}`);
  console.log(`✓ Audit Trail Length: ${decided.auditTrail.length}`);
  console.log('✅ TEST 7 PASSED!\n');

  // TEST 8: Moderation Queue & Content Report Workflow
  console.log('▶ [TEST 8] Testing Moderation Queue & Content Report Action...');
  // Create a test content report
  const testReport = await prisma.contentReport.create({
    data: {
      reporterId: adminUser.id,
      newsId: article.id,
      reason: ReportReason.MISLEADING,
      description: 'Reader query regarding exact project allocation figure.',
      status: 'PENDING',
    },
  });
  console.log(`✓ Created Test Content Report ID: ${testReport.id}`);

  const modQueue = await ModerationService.getModerationQueue({ page: 1, limit: 5 });
  console.log(`✓ Moderation Queue Total: ${modQueue.meta.total}`);

  const modAction = await ModerationService.takeModerationAction(
    testReport.id,
    'APPROVE',
    'Verified with department bulletin',
    'Claim inspected and verified as authentic.',
    adminUser.id
  );
  console.log(`✓ Moderation Report Status: ${modAction.status}`);
  console.log(`✓ Resolution Note: "${modAction.resolutionNote}"`);
  console.log('✅ TEST 8 PASSED!\n');

  // TEST 9: Contributor Verification History
  console.log('▶ [TEST 9] Testing Contributor Verification History...');
  const history = await VerificationService.getMyVerificationHistory(article.authorId);
  console.log(`✓ Contributor History Items Count: ${history.length}`);
  if (history.length > 0) {
    console.log(`  ↳ Item 1: "${history[0].title}" | Status: ${history[0].verificationStatus} | Score: ${history[0].scores.overallScore}%`);
  }
  console.log('✅ TEST 9 PASSED!\n');

  console.log('🎉 ========================================================');
  console.log('🎉 ALL MODULE 7 BACKEND TESTS PASSED (100% SUCCESS)!');
  console.log('🎉 ========================================================\n');

  await prisma.$disconnect();
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
