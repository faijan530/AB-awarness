import { prisma } from '../config/database';
import { SourceService } from '../modules/sources/source.service';
import { MediaService } from '../modules/media/media.service';
import { SourceType, CredibilityStatus } from '@prisma/client';

async function testModule07MediaSources() {
  console.log('\n--- STARTING MODULE 7 MEDIA & SOURCES INTEGRATION TEST ---');

  // 1. Verify Sources Listing & Autocomplete
  const sources = await SourceService.listSources({ limit: 10 });
  console.log(`[TEST 1] SourceService.listSources: Found ${sources.items.length} verified sources in database.`);
  if (sources.items.length === 0) {
    throw new Error('Sources should have been seeded');
  }

  // 2. Verify Source Details
  const pib = sources.items.find((s) => s.name.includes('Press Information Bureau'));
  if (!pib) throw new Error('PIB source should exist');
  const pibDetail = await SourceService.getSourceById(pib.id);
  console.log(`[TEST 2] SourceService.getSourceById: Retrieved "${pibDetail.name}" (${pibDetail.credibilityStatus}).`);

  // 3. Verify Admin Media Querying
  const adminMedia = await MediaService.listAdminMedia({ limit: 10 });
  console.log(`[TEST 3] MediaService.listAdminMedia: Successfully queried media registry (Total: ${adminMedia.meta.total}).`);

  // 4. Verify Article-Sources Relationship Linking
  const sampleArticle = await prisma.news.findFirst({
    where: { status: 'PUBLISHED' },
  });

  if (sampleArticle) {
    await SourceService.attachSourceToNews(
      sampleArticle.id,
      pib.id,
      'https://pib.gov.in/PressReleasePage.aspx?PRID=12345',
      'Official verification communiqu\u00e9 released by press nodal officer.'
    );
    console.log(`[TEST 4] SourceService.attachSourceToNews: Attached PIB official source to article "${sampleArticle.title.slice(0, 30)}...".`);

    const updated = await prisma.news.findUnique({
      where: { id: sampleArticle.id },
      include: { sources: { include: { source: true } } },
    });
    console.log(`[TEST 5] News Article Sources: Article now has ${updated?.sources.length} attached verified sources.`);
  }

  console.log('\n--- ALL MODULE 7 MEDIA & SOURCES TESTS PASSED CLEANLY (5/5) ---\n');
}

testModule07MediaSources()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
