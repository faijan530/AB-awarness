import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging ALL news articles from database...');

  await prisma.newsRevision.deleteMany({});
  await prisma.editorialAction.deleteMany({});
  await prisma.newsCategory.deleteMany({});
  await prisma.newsLocation.deleteMany({});
  await prisma.newsTag.deleteMany({});

  const deleted = await prisma.news.deleteMany({});

  console.log(`✅ ALL news articles deleted from database! Count: ${deleted.count}`);
}

main()
  .catch((e) => {
    console.error('Error wiping news:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
