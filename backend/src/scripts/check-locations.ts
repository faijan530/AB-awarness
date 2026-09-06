import { prisma } from '../config/database';

async function main() {
  const locations = await prisma.location.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      parentId: true,
      newsLocations: {
        include: {
          news: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  console.log(`TOTAL LOCATIONS IN DB: ${locations.length}\n`);
  locations.forEach((loc) => {
    console.log(`- [${loc.type}] ${loc.name} (Slug: '${loc.slug}')`);
    if (loc.newsLocations.length > 0) {
      loc.newsLocations.forEach((nl) => {
        console.log(`    ↳ News: [${nl.news.status}] "${nl.news.title}"`);
      });
    } else {
      console.log('    ↳ (No news linked)');
    }
  });

  await prisma.$disconnect();
}

main();
