import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../config/database';
import { NewsService } from '../modules/news/news.service';
import { NewsStatus } from '@prisma/client';

async function testModule05Editorial() {
  console.log('==================================================');
  console.log('📰 MODULE 05 NEWS EDITORIAL & PUBLISHING TESTS');
  console.log('==================================================\n');

  // Find or create Super Admin User
  const admin = await prisma.user.findFirst({ where: { email: 'admin@abmedia.in' } });
  assert(admin, 'Super Admin user must exist in database');

  // ----------------------------------------------------
  // TEST 1: CREATE DRAFT & UNIQUE SLUG GENERATION
  // ----------------------------------------------------
  console.log('TEST 1: Author Draft Creation & Unique Slug Generation...');
  const draftPayload = {
    title: 'Monsoon Flooding Risk Evaluated in North Karanpura Basin',
    shortDescription: 'State irrigation department assesses river embankments across Daltonganj and Latehar.',
    content: 'State irrigation department engineers evaluate river embankments across Daltonganj and Latehar ahead of seasonal rain surges.',
  };

  const draft = await NewsService.createNews(admin.id, draftPayload);
  assert.strictEqual(draft.status, NewsStatus.DRAFT);
  assert.strictEqual(draft.title, draftPayload.title);
  assert(draft.slug.includes('monsoon-flooding-risk-evaluated'), 'Slug must be derived from headline title');
  console.log(`✓ Draft created successfully (ID: ${draft.id}, Slug: ${draft.slug})`);

  // Test slug collision handling
  const duplicateDraft = await NewsService.createNews(admin.id, draftPayload);
  assert(duplicateDraft.slug !== draft.slug, 'Slug collision must produce unique suffix');
  console.log(`✓ Unique slug collision resolution verified (New Slug: ${duplicateDraft.slug})`);

  // ----------------------------------------------------
  // TEST 2: REVISION TRACKING ON UPDATE
  // ----------------------------------------------------
  console.log('\nTEST 2: Article Revision Tracking on Content Updates...');
  const updated = await NewsService.updateNews(draft.id, admin.id, true, {
    title: 'Monsoon Flooding Risk Evaluated in North Karanpura Basin (Updated)',
    content: 'Updated content with additional disaster management team deployments.',
    changeSummary: 'Added emergency response team numbers',
  });

  const revisions = await NewsService.getRevisions(draft.id);
  assert(revisions.length >= 2, 'Article update must record new revision version');
  assert.strictEqual(revisions[0].versionNumber, 2);
  console.log(`✓ Revision snapshot created (Total versions logged: ${revisions.length})`);

  // ----------------------------------------------------
  // TEST 3: EDITORIAL STATE MACHINE (SUBMIT → REVIEW → REJECT WITH REMARKS)
  // ----------------------------------------------------
  console.log('\nTEST 3: State Machine — Submit → Review → Reject Workflow...');
  const submitted = await NewsService.submitForReview(draft.id, admin.id);
  assert.strictEqual(submitted.status, NewsStatus.SUBMITTED);

  const underReview = await NewsService.startReview(draft.id, admin.id);
  assert.strictEqual(underReview.status, NewsStatus.UNDER_REVIEW);

  const rejected = await NewsService.rejectNews(draft.id, admin.id, 'Needs secondary source confirmation from irrigation chief engineer');
  assert.strictEqual(rejected.status, NewsStatus.REJECTED);

  const history = await NewsService.getEditorialHistory(draft.id);
  assert(history.length >= 3, 'Editorial actions must log SUBMITTED, REVIEWED, and REJECTED events');
  assert(history[0].remarks?.includes('secondary source'), 'Rejection remarks must be logged in editorial_actions');
  console.log(`✓ Rejection workflow & editorial action remarks verified`);

  // ----------------------------------------------------
  // TEST 4: EDITORIAL STATE MACHINE (RESUBMIT → APPROVE → PUBLISH)
  // ----------------------------------------------------
  console.log('\nTEST 4: State Machine — Resubmit → Approve → Publish Workflow...');
  await NewsService.submitForReview(draft.id, admin.id);
  await NewsService.startReview(draft.id, admin.id);
  const approved = await NewsService.approveNews(draft.id, admin.id);
  assert.strictEqual(approved.status, NewsStatus.APPROVED);

  const published = await NewsService.publishNews(draft.id, admin.id);
  assert.strictEqual(published.status, NewsStatus.PUBLISHED);
  assert(published.publishedAt, 'Published story must have non-null publishedAt timestamp');
  console.log(`✓ Publication workflow verified (Published At: ${published.publishedAt})`);

  // ----------------------------------------------------
  // TEST 5: BREAKING & FEATURED TOGGLES
  // ----------------------------------------------------
  console.log('\nTEST 5: Super Admin Breaking & Featured Status Toggles...');
  const breakingStory = await NewsService.toggleBreaking(draft.id, admin.id, true);
  assert.strictEqual(breakingStory.isBreaking, true);

  const featuredStory = await NewsService.toggleFeatured(draft.id, admin.id, true);
  assert.strictEqual(featuredStory.isFeatured, true);
  console.log(`✓ Breaking news & Featured toggles verified`);

  // Clean up duplicate draft
  await prisma.news.delete({ where: { id: duplicateDraft.id } });

  console.log('\n==================================================');
  console.log('✅ ALL MODULE 05 NEWS EDITORIAL & PUBLISHING TESTS PASSED!');
  console.log('==================================================\n');
}

testModule05Editorial()
  .catch((err) => {
    console.error('❌ Module 05 Editorial Test Failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
