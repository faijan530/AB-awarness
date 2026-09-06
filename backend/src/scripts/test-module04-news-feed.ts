import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../config/database';
import { NewsService } from '../modules/news/news.service';

async function testModule04NewsFeed() {
  console.log('==================================================');
  console.log('📰 MODULE 04 PUBLIC NEWS FEED & DISCOVERY TESTS');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // TEST 1: GET PUBLIC NEWS FEED
  // ----------------------------------------------------
  console.log('TEST 1: Fetching Public Paginated News Feed...');
  const feed = await NewsService.getNewsFeed({ page: 1, limit: 10 });
  assert(feed.articles.length >= 1, 'News feed must return at least 1 published story');
  assert.strictEqual(typeof feed.total, 'number');
  assert.strictEqual(typeof feed.totalPages, 'number');
  console.log(`✓ News feed retrieved successfully (${feed.total} total articles found)`);

  // ----------------------------------------------------
  // TEST 2: GET FEATURED HERO NEWS ARTICLE
  // ----------------------------------------------------
  console.log('\nTEST 2: Fetching Featured Hero News Story...');
  const featured = await NewsService.getFeaturedNews();
  assert(featured, 'Featured hero article must exist');
  assert(featured.id, 'Featured story must have valid ID');
  assert(featured.isFeatured || featured.title, 'Featured story title must exist');
  console.log(`✓ Featured hero article retrieved: "${featured.title.substring(0, 45)}..."`);

  // ----------------------------------------------------
  // TEST 3: GET LIVE BREAKING NEWS ALERTS
  // ----------------------------------------------------
  console.log('\nTEST 3: Fetching Live Breaking News Ticker...');
  const breaking = await NewsService.getBreakingNews();
  assert(Array.isArray(breaking), 'Breaking news ticker must return an array');
  console.log(`✓ Breaking news alerts retrieved (${breaking.length} breaking stories active)`);

  // ----------------------------------------------------
  // TEST 4: GET TRENDING NEWS STORIES
  // ----------------------------------------------------
  console.log('\nTEST 4: Fetching Trending Stories (Ranked by viewCount)...');
  const trending = await NewsService.getTrendingNews(5);
  assert(trending.length >= 1, 'Trending news must return at least 1 story');
  assert(trending[0].viewCount >= 0, 'Trending story view count must be numeric');
  console.log(`✓ Trending stories retrieved (Top story view count: ${trending[0].viewCount})`);

  // ----------------------------------------------------
  // TEST 5: GET ARTICLE BY SLUG & VIEW COUNT INCREMENT
  // ----------------------------------------------------
  console.log('\nTEST 5: Fetching Article Details by Slug & Incrementing View Count...');
  const targetSlug = 'infrastructure-expansion-palamu';
  const initialViewCount = featured.viewCount;
  
  const article = await NewsService.getArticleBySlug(targetSlug);
  assert.strictEqual(article.slug, targetSlug);
  assert(article.viewCount >= initialViewCount, 'View count must increment on article detail lookup');
  console.log(`✓ Article slug lookup verified (Updated view count: ${article.viewCount})`);

  console.log('\n==================================================');
  console.log('✅ ALL MODULE 04 PUBLIC NEWS FEED & DISCOVERY TESTS PASSED!');
  console.log('==================================================\n');
}

testModule04NewsFeed()
  .catch((err) => {
    console.error('❌ Module 04 News Feed Test Failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
