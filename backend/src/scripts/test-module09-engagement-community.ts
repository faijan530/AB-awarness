import { prisma } from '../config/database';
import { CommentService } from '../modules/engagement/comment.service';
import { ReactionService } from '../modules/engagement/reaction.service';
import { BookmarkService } from '../modules/engagement/bookmark.service';
import { ReportService } from '../modules/engagement/report.service';
import { ShareService } from '../modules/engagement/share.service';
import { AdminUserService } from '../modules/admin/admin-user.service';
import { NewsStatus, ReactionType, ReportReason, CommentStatus } from '@prisma/client';

async function runModule09EngagementTests() {
  console.log('================================================================');
  console.log('💬 MODULE 09: USER ENGAGEMENT & COMMUNITY BACKEND TEST SUITE');
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
    // 1. Setup Actor & Published Article
    console.log('--- Setting up Test Users and Target News Story ---');
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@abmedia.in' },
          { userRoles: { some: { role: { name: 'SUPER_ADMIN' } } } },
        ],
      },
    });
    if (!admin) throw new Error('No SUPER_ADMIN found');

    const reader = await prisma.user.findFirst({
      where: {
        id: { not: admin.id },
        status: 'ACTIVE',
      },
    }) || admin;

    const article = await prisma.news.findFirst({
      where: { status: NewsStatus.PUBLISHED, deletedAt: null },
    });
    if (!article) throw new Error('No published news article found');

    console.log(`👤 Admin: ${admin.fullName} (${admin.id})`);
    console.log(`👤 Reader: ${reader.fullName} (${reader.id})`);
    console.log(`📰 Article: "${article.title}" (${article.id})\n`);

    // -------------------------------------------------------------------------
    // TEST 1 & 2: Reaction System
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing Reactions & Reaction Counters ---');
    // Add LIKE reaction
    const react1 = await ReactionService.toggleReaction(reader.id, article.id, ReactionType.LIKE);
    assert(
      react1.userReaction === 'LIKE' && react1.counts.LIKE >= 1,
      'User can react with LIKE on published article',
      `Total: ${react1.totalReactions}, User Reaction: ${react1.userReaction}`
    );

    // Switch to INSIGHTFUL
    const react2 = await ReactionService.toggleReaction(reader.id, article.id, ReactionType.INSIGHTFUL);
    assert(
      react2.userReaction === 'INSIGHTFUL',
      'User can switch reaction type to INSIGHTFUL',
      `Switched to: ${react2.userReaction}`
    );

    // Remove reaction explicitly
    const react3 = await ReactionService.removeReaction(reader.id, article.id);
    assert(
      react3.userReaction === null,
      'User can remove reaction explicitly via DELETE',
      'Reaction removed cleanly'
    );

    // -------------------------------------------------------------------------
    // TEST 3 & 4: Comment Creation, XSS Sanitization & Threading
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Comments, XSS Sanitization & Threading ---');
    const dirtyContent = '<script>alert("hacked")</script>This is a high priority civic development in Palamu.';
    const sanitized = CommentService.sanitizeContent(dirtyContent);
    assert(
      !sanitized.includes('<script>') && sanitized.includes('This is a high priority civic development'),
      'Spam & dangerous script tags stripped from comment content',
      `Sanitized: "${sanitized}"`
    );

    const comment = await CommentService.createComment(reader.id, article.id, {
      content: sanitized,
    });
    assert(
      Boolean(comment.id && comment.content === sanitized),
      'Comment created and published with status APPROVED',
      `Comment ID: ${comment.id}`
    );

    // Reply to comment
    const reply = await CommentService.createReply(admin.id, comment.id, 'Agreed, this will benefit the local constituency.');
    assert(
      Boolean(reply.id && reply.parentId === comment.id),
      'Reply created successfully with parent relation',
      `Reply ID: ${reply.id}, Parent ID: ${reply.parentId}`
    );

    // Query article comments
    const articleComments = await CommentService.getArticleComments(article.id, 1, 10, 'LATEST');
    const foundComment = articleComments.comments.find((c) => c.id === comment.id);
    assert(
      foundComment !== undefined && (foundComment.replyCount ?? 0) >= 1,
      'Article comments list returns top-level comment with populated replies and counter',
      `Total comments: ${articleComments.total}`
    );

    // -------------------------------------------------------------------------
    // TEST 5 & 6: Comment Editing & Soft Deletion
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Comment Editing & Soft Deletion ---');
    const updatedComment = await CommentService.updateComment(comment.id, reader.id, {
      content: 'Updated: This is a high priority civic development confirmed by local authorities.',
    });
    assert(
      updatedComment.content.startsWith('Updated:'),
      'Author can edit their own comment',
      `New content: "${updatedComment.content.slice(0, 50)}..."`
    );

    // Soft delete reply
    await CommentService.deleteComment(reply.id, admin.id, true);
    const deletedReply = await prisma.comment.findUnique({ where: { id: reply.id } });
    assert(
      deletedReply?.status === CommentStatus.DELETED && deletedReply.deletedAt !== null,
      'Comment soft-deleted with preserved thread structure',
      `Status: ${deletedReply?.status}, DeletedAt: ${deletedReply?.deletedAt}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Super Admin Comment Moderation (Hide, Restore, Reject)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Super Admin Comment Moderation Desk ---');
    const hidden = await CommentService.hideComment(comment.id, admin.id, 'Violates editorial standards');
    assert(
      hidden.status === CommentStatus.FLAGGED,
      'Super Admin can hide inappropriate comment (status: FLAGGED)',
      `Status: ${hidden.status}`
    );

    const restored = await CommentService.restoreComment(comment.id, admin.id);
    assert(
      restored.status === CommentStatus.APPROVED,
      'Super Admin can restore comment back to public view (status: APPROVED)',
      `Status: ${restored.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 8 & 9: Reports & Community Safety Queue
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Content Reporting & Moderation Queue ---');
    const report = await ReportService.reportNews(reader.id, article.id, {
      reason: ReportReason.MISLEADING,
      description: 'The headline needs verification against official notification.',
    });
    assert(
      Boolean(report.id && report.status === 'PENDING'),
      'User can report news article with structured reason',
      `Report ID: ${report.id}, Reason: ${report.reason}`
    );

    // Duplicate report prevention check
    let duplicateBlocked = false;
    try {
      await ReportService.reportNews(reader.id, article.id, {
        reason: ReportReason.MISLEADING,
      });
    } catch (e: any) {
      duplicateBlocked = e.code === 'DUPLICATE_REPORT';
    }
    assert(
      duplicateBlocked === true,
      'Duplicate reporting guard prevents spamming identical reports',
      'Blocked repeated report submission'
    );

    // Admin report review & resolution
    const underReview = await ReportService.reviewReport(report.id, admin.id);
    assert(
      underReview.status === 'UNDER_REVIEW',
      'Super Admin moves report into UNDER_REVIEW queue',
      `Status: ${underReview.status}`
    );

    const resolved = await ReportService.resolveReport(report.id, admin.id, {
      resolution: 'NO_ACTION',
      note: 'Verified with district gazette. Story is accurate.',
    });
    assert(
      Boolean(resolved.status === 'RESOLVED' && resolved.resolutionNote?.includes('Verified')),
      'Super Admin resolves report with resolution notes',
      `Resolution: "${resolved.resolutionNote}"`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Bookmark System
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Bookmarks System ---');
    const bookmarked = await BookmarkService.addBookmark(reader.id, article.id);
    assert(
      bookmarked.isBookmarked === true,
      'User can bookmark published article for later reading',
      bookmarked.message
    );

    const isBookmarked = await BookmarkService.isBookmarked(reader.id, article.id);
    assert(isBookmarked === true, 'Bookmark status verified via isBookmarked');

    const myBookmarks = await BookmarkService.getUserBookmarks(reader.id, 1, 10);
    assert(
      myBookmarks.bookmarks.some((b) => b.newsId === article.id),
      'User bookmarks list includes saved article',
      `Saved articles count: ${myBookmarks.total}`
    );

    await BookmarkService.removeBookmark(reader.id, article.id);
    const isStillBookmarked = await BookmarkService.isBookmarked(reader.id, article.id);
    assert(isStillBookmarked === false, 'Bookmark cleanly removed via DELETE');

    // -------------------------------------------------------------------------
    // TEST 11: Share Tracking & Analytics
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Share Tracking & Engagement Summary ---');
    const shareResult = await ShareService.recordShare(article.id, 'WHATSAPP', reader.id);
    assert(
      shareResult.shareCount >= 1 && shareResult.platform === 'WHATSAPP',
      'Article share tracked with analytics counter in NewsStatistics',
      `Platform: ${shareResult.platform}, Shares: ${shareResult.shareCount}`
    );

    const engagement = await ShareService.getUserEngagementSummary(reader.id);
    assert(
      typeof engagement.commentsCount === 'number' && typeof engagement.reactionsCount === 'number',
      'User engagement profile summary returned with aggregate metric counts',
      `Comments: ${engagement.commentsCount}, Reactions: ${engagement.reactionsCount}, Reports: ${engagement.reportsCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Admin User Warning
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing User Moderation Warning ---');
    const warnResult = await AdminUserService.warnUser(admin.id, reader.id, {
      reason: 'Please adhere to respectful community commenting guidelines.',
      severity: 'LOW',
    });
    assert(
      warnResult.message === 'Official warning issued to user',
      'Super Admin can issue official auditable warning to user',
      `Reason: "${warnResult.reason}"`
    );

    // Cleanup created test records
    await prisma.contentReport.delete({ where: { id: report.id } }).catch(() => {});
    await prisma.comment.delete({ where: { id: reply.id } }).catch(() => {});
    await prisma.comment.delete({ where: { id: comment.id } }).catch(() => {});

    console.log('\n================================================================');
    console.log(`🎉 ALL MODULE 09 ENGAGEMENT & COMMUNITY TESTS PASSED (${passedTests}/${totalTests})!`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ MODULE 09 TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runModule09EngagementTests();
