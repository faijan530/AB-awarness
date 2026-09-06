import { prisma } from '../config/database';
import { NewsService } from '../modules/news/news.service';
import { NewsStatus, EditorialActionType } from '@prisma/client';

async function runSubmissionsTest() {
  console.log('==================================================');
  console.log('✍️  MODULE 06 CONTRIBUTOR & SUBMISSIONS WORKFLOW TESTS');
  console.log('==================================================\n');

  try {
    // 1. Get or create a contributor user
    let user = await prisma.user.findFirst({ where: { email: 'contributor.test@abmedia.in' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'contributor.test@abmedia.in',
          passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
          fullName: 'Sita Soren Reporter',
          phone: '+919876543219',
          status: 'ACTIVE',
        },
      });
    }

    // 2. Get category & location for submission
    let category = await prisma.category.findFirst();
    let location = await prisma.location.findFirst();

    console.log('TEST 1: Contributor Draft Creation...');
    const draft = await NewsService.createNews(user.id, {
      title: 'Jharkhand Solar Irrigation Pump Subsidy Announced',
      shortDescription: 'State agriculture department rolls out 80% capital subsidy for farmers in Garhwa and Palamu.',
      content: 'Full article text detailing the solar irrigation scheme guidelines, beneficiary criteria, and subsidy disbursal timelines.',
      categoryIds: category ? [category.id] : [],
      locationIds: location ? [location.id] : [],
    });
    console.log(`✓ Draft created successfully! (ID: ${draft.id}, Status: ${draft.status})`);

    console.log('\nTEST 2: Contributor Draft Update...');
    const updatedDraft = await NewsService.updateNews(draft.id, user.id, false, {
      title: 'Jharkhand Solar Irrigation Pump Subsidy Announced — Phase 2 Details',
      content: 'Updated content with revised subsidy rates and regional application office addresses.',
    });
    console.log(`✓ Draft updated successfully! (Title: ${updatedDraft.title})`);

    console.log('\nTEST 3: Contributor Submit for Review...');
    const submitted = await NewsService.submitForReview(draft.id, user.id);
    console.log(`✓ Story submitted for review! (Status: ${submitted.status})`);

    console.log('\nTEST 4: Contributor My Submissions Retrieval...');
    const mySubmissions = await NewsService.getMySubmissions(user.id, undefined, 1, 10);
    console.log(`✓ Retrieved ${mySubmissions.articles.length} submission(s) for contributor!`);
    const found = mySubmissions.articles.find((a: any) => a.id === draft.id);
    if (!found) {
      throw new Error('Created submission not found in getMySubmissions response');
    }
    console.log(`✓ Verified created story is in submissions list with status '${found.status}'`);

    console.log('\nTEST 5: Super Admin Request Revision & Contributor Resubmission...');
    // Simulate Super Admin request revision
    await prisma.editorialAction.create({
      data: {
        newsId: draft.id,
        performedBy: user.id,
        action: EditorialActionType.REJECTED,
        remarks: 'Please add quotes from the Agriculture Secretary and verify installation timeline.',
      },
    });
    await prisma.news.update({
      where: { id: draft.id },
      data: { status: NewsStatus.REJECTED },
    });
    console.log(`✓ Simulated Editor revision request with remarks logged.`);

    // Contributor resubmits
    const resubmitted = await NewsService.submitForReview(draft.id, user.id);
    console.log(`✓ Story successfully resubmitted by contributor! (New Status: ${resubmitted.status})`);

    console.log('\n🧹 Cleaning up test contributor data...');
    await prisma.newsCategory.deleteMany({ where: { newsId: draft.id } });
    await prisma.newsLocation.deleteMany({ where: { newsId: draft.id } });
    await prisma.newsRevision.deleteMany({ where: { newsId: draft.id } });
    await prisma.editorialAction.deleteMany({ where: { newsId: draft.id } });
    await prisma.news.delete({ where: { id: draft.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✓ Cleanup completed successfully!');

    console.log('\n==================================================');
    console.log('✅ ALL MODULE 06 CONTRIBUTOR WORKFLOW TESTS PASSED!');
    console.log('==================================================\n');
  } catch (error: any) {
    console.error('❌ Submissions test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSubmissionsTest();
