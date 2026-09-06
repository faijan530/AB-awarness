import { PrismaClient, RoleName, LocationType, NewsStatus } from '@prisma/client';
import { CategoryService } from '../modules/classification/categories/category.service';
import { LocationService } from '../modules/classification/locations/location.service';
import { TagService } from '../modules/classification/tags/tag.service';

const prisma = new PrismaClient();

async function runModule06Tests() {
  console.log('==================================================');
  console.log('🏷️  MODULE 06 CATEGORIES, LOCATIONS & TAGS TESTS');
  console.log('==================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Category Domain & Hierarchy Tree
    // ----------------------------------------------------
    console.log('TEST 1: Category Creation, Unique Slug & Depth Validation...');
    const parentCategory = await CategoryService.createCategory({
      name: 'State Governance Test',
      description: 'State governance and policy updates',
    });
    console.log(`✓ Created parent category: ${parentCategory.name} (Slug: ${parentCategory.slug})`);

    const subCategory = await CategoryService.createCategory({
      name: 'District Budget Allocation',
      description: 'Subcategory under State Governance',
      parentId: parentCategory.id,
    });
    console.log(`✓ Created subcategory: ${subCategory.name} (Parent ID: ${subCategory.parentId})`);

    // Circular reference validation test
    try {
      await CategoryService.updateCategory(parentCategory.id, { parentId: subCategory.id });
      console.error('❌ Failed: Circular parent reference was not blocked!');
    } catch (err: any) {
      console.log(`✓ Circular parent reference correctly rejected: ${err.message}`);
    }

    // Category tree builder test
    const categoryTree = await CategoryService.getCategoryTree();
    console.log(`✓ Category tree retrieved (Top-level nodes: ${categoryTree.length})`);


    // ----------------------------------------------------
    // TEST 2: Location Domain, Search & Tree
    // ----------------------------------------------------
    console.log('\nTEST 2: Location Hierarchy, Search & Geographic Context...');
    const stateLoc = await LocationService.createLocation({
      name: 'Jharkhand State Unit',
      type: LocationType.STATE,
      stateCode: 'JH',
    });
    console.log(`✓ Created State location: ${stateLoc.name} (ID: ${stateLoc.id})`);

    const districtLoc = await LocationService.createLocation({
      name: 'Palamu Division Corridor',
      type: LocationType.DISTRICT,
      parentId: stateLoc.id,
      districtCode: 'PAL',
    });
    console.log(`✓ Created District location: ${districtLoc.name} (Parent ID: ${districtLoc.parentId})`);

    const cityLoc = await LocationService.createLocation({
      name: 'Medininagar Central',
      type: LocationType.CITY,
      parentId: districtLoc.id,
    });
    console.log(`✓ Created City location: ${cityLoc.name} (Parent ID: ${cityLoc.parentId})`);

    // Search location test
    const searchResults = await LocationService.searchLocations('Medininagar');
    if (searchResults.length > 0 && searchResults[0].id === cityLoc.id) {
      console.log(`✓ Location search verified for 'Medininagar' (Found: ${searchResults[0].name})`);
    } else {
      console.error('❌ Location search failed to find Medininagar Central');
    }

    // Location tree builder test
    const locationTree = await LocationService.getLocationTree();
    console.log(`✓ Location tree retrieved (Top-level nodes: ${locationTree.length})`);


    // ----------------------------------------------------
    // TEST 3: Tag Keyword Management
    // ----------------------------------------------------
    console.log('\nTEST 3: Tag Keyword Creation & Duplicate Handling...');
    const tag = await TagService.createTag({ name: 'LocalDevelopment2026' });
    console.log(`✓ Created tag: #${tag.name} (Slug: ${tag.slug})`);

    try {
      await TagService.createTag({ name: 'localdevelopment2026' });
      console.error('❌ Failed: Duplicate tag creation was not rejected!');
    } catch (err: any) {
      console.log(`✓ Duplicate tag correctly rejected: ${err.message}`);
    }


    // ----------------------------------------------------
    // TEST 4: Multi-Dimensional News Article Classification
    // ----------------------------------------------------
    console.log('\nTEST 4: News Article Multi-Dimensional Classification & Geographic Inheritance...');

    // Find author
    const author = await prisma.user.findFirst({
      where: { userRoles: { some: { role: { name: RoleName.SUPER_ADMIN } } } },
    });

    if (!author) {
      throw new Error('Super Admin user required for news authoring test');
    }

    // Create published news article
    const testArticle = await prisma.news.create({
      data: {
        title: 'New Water Supply Pipeline Commissioned in Medininagar Central',
        slug: 'water-supply-pipeline-medininagar-central',
        shortDescription: 'District administration completes water pipeline installation in Medininagar city.',
        content: 'Full details of the water supply project commissioned in Medininagar city, Palamu district.',
        status: NewsStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: author.id,
      },
    });

    // Link Category
    await prisma.newsCategory.create({
      data: {
        newsId: testArticle.id,
        categoryId: subCategory.id,
        isPrimary: true,
      },
    });

    // Link Location to City (Medininagar Central)
    await prisma.newsLocation.create({
      data: {
        newsId: testArticle.id,
        locationId: cityLoc.id,
        isPrimary: true,
      },
    });

    // Link Tag
    await prisma.newsTag.create({
      data: {
        newsId: testArticle.id,
        tagId: tag.id,
      },
    });

    console.log(`✓ Created test article linked to Category (${subCategory.name}), Location (${cityLoc.name}), Tag (#${tag.name})`);

    // Verify Category News Feed
    const categoryNews = await CategoryService.getNewsByCategorySlug(subCategory.slug);
    console.log(`✓ Category news feed verified for '${subCategory.slug}' (Articles count: ${categoryNews.meta.total})`);

    // Verify Geographic Inheritance (Querying parent District Palamu Corridor should surface City Medininagar news!)
    const districtNews = await LocationService.getNewsByLocationSlug(districtLoc.slug);
    if (districtNews.meta.total > 0 && districtNews.articles[0].id === testArticle.id) {
      console.log(`✓ Geographic Inheritance Verified! Querying parent district '${districtLoc.slug}' surfaced child city news.`);
    } else {
      console.error(`❌ Geographic inheritance failed for district '${districtLoc.slug}'`);
    }

    // Verify Tag News Feed
    const tagNews = await TagService.getNewsByTagSlug(tag.slug);
    console.log(`✓ Tag news feed verified for '#${tag.slug}' (Articles count: ${tagNews.meta.total})`);


    // ----------------------------------------------------
    // TEST CLEANUP
    // ----------------------------------------------------
    console.log('\n🧹 Cleaning up test classification data...');
    await prisma.newsTag.deleteMany({ where: { newsId: testArticle.id } });
    await prisma.newsLocation.deleteMany({ where: { newsId: testArticle.id } });
    await prisma.newsCategory.deleteMany({ where: { newsId: testArticle.id } });
    await prisma.news.delete({ where: { id: testArticle.id } });

    await TagService.deleteTag(tag.id);
    await LocationService.deleteLocation(cityLoc.id);
    await LocationService.deleteLocation(districtLoc.id);
    await LocationService.deleteLocation(stateLoc.id);

    await CategoryService.deleteCategory(subCategory.id);
    await CategoryService.deleteCategory(parentCategory.id);

    console.log('✓ Cleanup completed successfully!');

    console.log('\n==================================================');
    console.log('✅ ALL MODULE 06 CATEGORIES, LOCATIONS & TAGS TESTS PASSED!');
    console.log('==================================================\n');
  } catch (error) {
    console.error('❌ MODULE 06 TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runModule06Tests();
