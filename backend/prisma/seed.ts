import { PrismaClient, RoleName, LocationType, UserStatus, NewsStatus } from '@prisma/client';
import dotenv from 'dotenv';
import { PasswordService } from '../src/services/password.service';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting idempotent database seeding for Platform...');

  // 1. Seed Roles
  console.log('...Seeding Roles');
  const userRole = await prisma.role.upsert({
    where: { name: RoleName.USER },
    update: {},
    create: {
      name: RoleName.USER,
      description: 'Standard end-user citizen account',
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: RoleName.SUPER_ADMIN },
    update: {},
    create: {
      name: RoleName.SUPER_ADMIN,
      description: 'Super Admin Editorial & Governance Authority',
    },
  });

  // 2. Seed Permissions
  console.log('...Seeding Permissions');
  const permissionsList = [
    { code: 'NEWS_READ', module: 'NEWS', description: 'Read published news stories' },
    { code: 'NEWS_CREATE', module: 'NEWS', description: 'Create draft news stories' },
    { code: 'NEWS_UPDATE', module: 'NEWS', description: 'Edit news stories' },
    { code: 'NEWS_DELETE', module: 'NEWS', description: 'Delete or soft-delete news stories' },
    { code: 'NEWS_PUBLISH', module: 'NEWS', description: 'Publish news stories live' },
    { code: 'NEWS_VERIFY', module: 'NEWS', description: 'Verify & fact-check stories' },
    { code: 'USER_READ', module: 'USERS', description: 'View user profiles & roles' },
    { code: 'USER_UPDATE', module: 'USERS', description: 'Update user profiles & roles' },
    { code: 'MEDIA_MANAGE', module: 'MEDIA', description: 'Manage media uploads' },
    { code: 'COMMENT_MODERATE', module: 'COMMENTS', description: 'Moderate comments' },
    { code: 'REPORT_MANAGE', module: 'REPORTS', description: 'Manage user report tickets' },
    { code: 'ADVERTISEMENT_MANAGE', module: 'ADS', description: 'Manage ads and placements' },
    { code: 'ANALYTICS_READ', module: 'ANALYTICS', description: 'View analytics dashboards' },
    { code: 'SYSTEM_SETTINGS_MANAGE', module: 'SETTINGS', description: 'Manage system settings' },
  ];

  const createdPermissions = [];
  for (const perm of permissionsList) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
    createdPermissions.push(p);
  }

  // 3. Seed RolePermissions
  console.log('...Seeding RolePermissions');
  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  const newsReadPerm = createdPermissions.find((p) => p.code === 'NEWS_READ');
  if (newsReadPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: newsReadPerm.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: newsReadPerm.id,
      },
    });
  }

  // 4. Seed Categories
  console.log('...Seeding Categories');
  const categoriesMap: Record<string, any> = {};
  const categoriesList = [
    { name: 'Local News', slug: 'local-news', description: 'Grassroots regional news', displayOrder: 1 },
    { name: 'Jharkhand', slug: 'jharkhand', description: 'Statewide Jharkhand news', displayOrder: 2 },
    { name: 'Politics', slug: 'politics', description: 'Governance and civic policy', displayOrder: 3 },
    { name: 'Sports', slug: 'sports', description: 'Local and national athletics', displayOrder: 4 },
    { name: 'National', slug: 'national', description: 'India national news', displayOrder: 5 },
    { name: 'International', slug: 'international', description: 'Global developments', displayOrder: 6 },
  ];

  for (const cat of categoriesList) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, displayOrder: cat.displayOrder },
      create: cat,
    });
    categoriesMap[cat.slug] = c;
  }

  // 5. Seed Locations Hierarchy (India -> Jharkhand -> Palamu/Garhwa/Latehar)
  console.log('...Seeding Locations');
  const locationsMap: Record<string, any> = {};
  const india = await prisma.location.upsert({
    where: { slug: 'india' },
    update: {},
    create: {
      name: 'India',
      slug: 'india',
      type: LocationType.COUNTRY,
      stateCode: 'IN',
    },
  });

  const jharkhand = await prisma.location.upsert({
    where: { slug: 'jharkhand' },
    update: {},
    create: {
      name: 'Jharkhand',
      slug: 'jharkhand',
      type: LocationType.STATE,
      parentId: india.id,
      stateCode: 'JH',
    },
  });
  locationsMap['jharkhand'] = jharkhand;

  const districts = [
    { name: 'Palamu', slug: 'palamu', districtCode: 'PLM' },
    { name: 'Garhwa', slug: 'garhwa', districtCode: 'GRH' },
    { name: 'Latehar', slug: 'latehar', districtCode: 'LTH' },
  ];

  for (const dist of districts) {
    const d = await prisma.location.upsert({
      where: { slug: dist.slug },
      update: {},
      create: {
        name: dist.name,
        slug: dist.slug,
        type: LocationType.DISTRICT,
        parentId: jharkhand.id,
        stateCode: 'JH',
        districtCode: dist.districtCode,
      },
    });
    locationsMap[dist.slug] = d;
  }

  // 6. Seed System Settings
  console.log('...Seeding System Settings');
  const settingsList = [
    { key: 'site_name', value: 'Abhishek Bhardwaj Media', isPublic: true, description: 'Platform brand name' },
    { key: 'site_description', value: 'Dynamic Digital Journalism Ecosystem', isPublic: true, description: 'Platform tagline' },
    { key: 'breaking_news_enabled', value: true, isPublic: true, description: 'Toggle live breaking news ticker' },
    { key: 'comments_enabled', value: true, isPublic: true, description: 'Toggle user comments' },
    { key: 'maintenance_mode', value: false, isPublic: true, description: 'System maintenance mode toggle' },
    { key: 'default_page_size', value: 20, isPublic: false, description: 'Default API pagination size' },
  ];

  for (const s of settingsList) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, isPublic: s.isPublic, description: s.description },
      create: s,
    });
  }

  // 7. Seed Default Super Admin Account
  console.log('...Seeding Default Super Admin Account');
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@abmedia.in';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'AdminPassword123!';
  const adminPasswordHash = await PasswordService.hashPassword(adminPassword);

  let superAdminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!superAdminUser) {
    superAdminUser = await prisma.user.create({
      data: {
        fullName: 'Super Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }

  // 8. Seed Initial Published News Articles
  console.log('...Seeding Initial Published News Articles');
  console.log('✅ Idempotent database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
