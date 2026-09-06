import { prisma } from '../config/database';
import { CommentService } from '../modules/engagement/comment.service';
import { ReactionService } from '../modules/engagement/reaction.service';
import { BookmarkService } from '../modules/engagement/bookmark.service';
import { CommentStatus, NewsStatus, ReactionType } from '@prisma/client';

async function runModule08EngagementTests() {
  console.log('===============================================================');
  console.log('💬 MODULE 08: USER ENGAGEMENT, REACTIONS & MODERATION TEST SUITE');
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

  try {
    // 1. Setup Test Actors (Admin + Reader 1 + Reader 2) and Article
    console.log('--- Setting up Test Actors and Target Article ---');
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@abmedia.in' },
          { userRoles: { some: { role: { name: 'SUPER_ADMIN' } } } },
        ],
      },
    });
    if (!admin) throw new Error('No SUPER_ADMIN found in database');

    let reader1 = await prisma.user.findFirst({ where: { email: 'reader1.test@abmedia.in' } });
    if (!reader1) {
      reader1 = await prisma.user.create({
        data: {
          email: 'reader1.test@abmedia.in',
          passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
          fullName: 'Ananya Sharma',
          phone: '+919876543231',
          status: 'ACTIVE',
        },
      });
    }

    let reader2 = await prisma.user.findFirst({ where: { email: 'reader2.test@abmedia.in' } });
    if (!reader2) {
      reader2 = await prisma.user.create({
        data: {
          email: 'reader2.test@abmedia.in',
          passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
          fullName: 'Ravi Kumar Mahto',
          phone: '+919876543232',
          status: 'ACTIVE',
        },
      });
    }

    let article = await prisma.news.findFirst({
      where: { status: NewsStatus.PUBLISHED, deletedAt: null },
    });
    if (!article) {
      throw new Error('No published news article found. Please seed or publish an article first.');
    }

    console.log(`👤 Admin: ${admin.fullName} (${admin.id})`);
    console.log(`👤 Reader 1: ${reader1.fullName} (${reader1.id})`);
    console.log(`👤 Reader 2: ${reader2.fullName} (${reader2.id})`);
    console.log(`📰 Article: "${article.title}" (${article.id})\n`);

    const initialCommentCount = article.commentCount;
    const initialReactionCount = article.reactionCount;
    const initialBookmarkCount = article.bookmarkCount;

    // -------------------------------------------------------------------------
    // TEST 1: Post Top-Level Public Comment
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing Comment Creation & News Counter Sync ---');
    const comment1 = await CommentService.createComment(reader1.id, article.id, {
      content: 'This is a very informative investigative report for Palamu district!',
    });

    assert(
      Boolean(comment1.id && comment1.content.includes('informative investigative report')),
      'Top-level comment created successfully',
      `Comment ID: ${comment1.id}, Author: ${comment1.user.fullName}`
    );

    const articleAfterComment1 = await prisma.news.findUnique({ where: { id: article.id } });
    assert(
      articleAfterComment1!.commentCount === initialCommentCount + 1,
      'News commentCount incremented atomically',
      `Previous: ${initialCommentCount}, Now: ${articleAfterComment1!.commentCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Threaded Nested Reply
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Threaded Nested Replies ---');
    const reply1 = await CommentService.createComment(reader2.id, article.id, {
      content: 'Agreed Ananya! The regional data is highly accurate.',
      parentId: comment1.id,
    });

    assert(
      reply1.parentId === comment1.id,
      'Threaded reply created with valid parent association',
      `Reply ID: ${reply1.id}, Parent ID: ${reply1.parentId}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Retrieve Article Comments (Tree Structure)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Public Comments Hierarchy Retrieval ---');
    const commentsList = await CommentService.getArticleComments(article.id);
    const parentInList = commentsList.comments.find((c) => c.id === comment1.id);

    assert(
      parentInList !== undefined && (parentInList.replies?.length ?? 0) >= 1,
      'Parent comment retrieved with nested replies array',
      `Parent replies count: ${parentInList?.replies?.length}`
    );

    const childInParent = parentInList?.replies?.find((r) => r.id === reply1.id);
    assert(
      childInParent !== undefined && childInParent.userId === reader2.id,
      'Nested reply matches expected author and content',
      `Reply author: ${childInParent?.user.fullName}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Author Comment Update
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Comment Editing ---');
    const updatedComment = await CommentService.updateComment(comment1.id, reader1.id, {
      content: 'This is an exceptionally informative investigative report for Palamu district! (Updated)',
    });

    assert(
      updatedComment.content.includes('(Updated)'),
      'Author successfully edited comment',
      `New content: "${updatedComment.content}"`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Reactions Engine (Toggle, Switch Type, Breakdown)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Reactions Engine ---');
    // Add LIKE from Reader 1
    const reaction1 = await ReactionService.toggleReaction(reader1.id, article.id, ReactionType.LIKE);
    assert(
      reaction1.userReaction === ReactionType.LIKE && reaction1.counts.LIKE >= 1,
      'Reader 1 added LIKE reaction',
      `LIKE count: ${reaction1.counts.LIKE}, Total: ${reaction1.totalReactions}`
    );

    // Switch Reader 1 to INSIGHTFUL
    const reaction2 = await ReactionService.toggleReaction(reader1.id, article.id, ReactionType.INSIGHTFUL);
    assert(
      reaction2.userReaction === ReactionType.INSIGHTFUL && reaction2.counts.INSIGHTFUL >= 1,
      'Reader 1 switched reaction from LIKE to INSIGHTFUL',
      `INSIGHTFUL count: ${reaction2.counts.INSIGHTFUL}, LIKE count: ${reaction2.counts.LIKE}`
    );

    // Reader 2 adds LOVE
    const reaction3 = await ReactionService.toggleReaction(reader2.id, article.id, ReactionType.LOVE);
    assert(
      reaction3.counts.LOVE >= 1,
      'Reader 2 added LOVE reaction',
      `LOVE count: ${reaction3.counts.LOVE}, Total: ${reaction3.totalReactions}`
    );

    // Toggle off Reader 1 reaction
    const reaction4 = await ReactionService.toggleReaction(reader1.id, article.id, ReactionType.INSIGHTFUL);
    assert(
      reaction4.userReaction === null,
      'Reader 1 toggled OFF reaction cleanly',
      `User Reaction: ${reaction4.userReaction}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Bookmarks Engine
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Bookmarks Engine ---');
    // Toggle Bookmark ON
    const bmAdd = await BookmarkService.toggleBookmark(reader1.id, article.id);
    assert(
      bmAdd.isBookmarked === true,
      'Story bookmarked by Reader 1',
      `Response message: "${bmAdd.message}"`
    );

    const isBm = await BookmarkService.isBookmarked(reader1.id, article.id);
    assert(isBm === true, 'isBookmarked status check returns true');

    const userBookmarks = await BookmarkService.getUserBookmarks(reader1.id);
    const foundBm = userBookmarks.bookmarks.find((b) => b.newsId === article.id);
    assert(
      foundBm !== undefined && foundBm.news?.title === article.title,
      'Bookmarked story appears in reader personal reading list',
      `Listed bookmark title: "${foundBm?.news?.title}"`
    );

    // Toggle Bookmark OFF
    const bmRemove = await BookmarkService.toggleBookmark(reader1.id, article.id);
    assert(
      bmRemove.isBookmarked === false,
      'Story unbookmarked cleanly',
      `Response message: "${bmRemove.message}"`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Super Admin Moderation Desk
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Super Admin Comments Moderation ---');
    const adminComments = await CommentService.adminGetComments({ newsId: article.id });
    assert(
      adminComments.total >= 1,
      'Super Admin lists comments across news story',
      `Admin retrieved ${adminComments.total} comments`
    );

    // Moderate reply to FLAGGED
    const moderated = await CommentService.adminModerateComment(reply1.id, admin.id, {
      status: CommentStatus.FLAGGED,
      moderationRemarks: 'Flagged for moderation check',
    });
    assert(
      moderated.status === CommentStatus.FLAGGED,
      'Super Admin updated comment status to FLAGGED',
      `Status: ${moderated.status}`
    );

    // Moderate back to APPROVED
    const reApproved = await CommentService.adminModerateComment(reply1.id, admin.id, {
      status: CommentStatus.APPROVED,
    });
    assert(
      reApproved.status === CommentStatus.APPROVED,
      'Super Admin restored comment status to APPROVED'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Comment Deletion & News Counter Decrement
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Comment Deletion & News Counter Sync ---');
    const deleteRes = await CommentService.deleteComment(comment1.id, reader1.id, false);
    assert(
      deleteRes.success === true,
      'Author soft-deleted comment',
      deleteRes.message
    );

    const deletedInDb = await prisma.comment.findUnique({ where: { id: comment1.id } });
    assert(
      deletedInDb?.status === CommentStatus.DELETED && deletedInDb.deletedAt !== null,
      'Comment status set to DELETED with timestamp in database'
    );

    // Cleanup Reader 2 reply and test records
    await prisma.comment.deleteMany({ where: { id: { in: [comment1.id, reply1.id] } } });
    await prisma.reaction.deleteMany({ where: { userId: { in: [reader1.id, reader2.id] }, newsId: article.id } });
    await prisma.bookmark.deleteMany({ where: { userId: reader1.id, newsId: article.id } });

    // Restore news comment count
    await prisma.news.update({
      where: { id: article.id },
      data: {
        commentCount: initialCommentCount,
        reactionCount: initialReactionCount,
        bookmarkCount: initialBookmarkCount,
      },
    });

    console.log('\n===============================================================');
    console.log(`🎉 ALL MODULE 8 ENGAGEMENT TESTS PASSED (${passedTests}/${totalTests})!`);
    console.log('===============================================================\n');
  } catch (error) {
    console.error('\n❌ MODULE 8 TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runModule08EngagementTests();
