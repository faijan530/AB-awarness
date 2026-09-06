import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sampleSlugs = [
    'infrastructure-expansion-palamu',
    'palamu-expressway-bridge',
    'betla-monsoon-patrol',
    'garhwa-agri-scheme',
    'jharkhand-rural-policy',
  ];

  console.log('🧹 Cleaning hardcoded sample news articles from database...');

  const deletedRevisions = await prisma.newsRevision.deleteMany({
    where: { news: { slug: { in: sampleSlugs } } },
  });

  const deletedActions = await prisma.editorialAction.deleteMany({
    where: { news: { slug: { in: sampleSlugs } } },
  });

  const deletedCategories = await prisma.newsCategory.deleteMany({
    where: { news: { slug: { in: sampleSlugs } } },
  });

  const deletedLocations = await prisma.newsLocation.deleteMany({
    where: { news: { slug: { in: sampleSlugs } } },
  });

  const deletedNews = await prisma.news.deleteMany({
    where: { slug: { in: sampleSlugs } },
  });

  console.log(`✅ Deleted ${deletedNews.count} hardcoded sample news articles from database!`);
}

main()
  .catch((e) => {
    console.error('Error cleaning sample news:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
