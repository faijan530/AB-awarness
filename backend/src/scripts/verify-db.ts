import { prisma } from '../config/database';
import { UserStatus, RoleName } from '@prisma/client';
import assert from 'assert';

async function verifyDatabaseModule02() {
  console.log('🔍 Starting Module 02 Database Integrity Verification...');

  // 1. Verify Roles
  const roles = await prisma.role.findMany();
  console.log(`✓ Found ${roles.length} seeded roles`);
  assert(roles.length >= 2, 'Must have at least 2 roles');
  const roleNames = roles.map((r) => r.name);
  assert(roleNames.includes(RoleName.USER), 'USER role must exist');
  assert(roleNames.includes(RoleName.SUPER_ADMIN), 'SUPER_ADMIN role must exist');

  // 2. Verify Categories
  const categories = await prisma.category.findMany();
  console.log(`✓ Found ${categories.length} seeded categories`);
  assert(categories.length >= 6, 'Must have at least 6 categories');

  // 3. Verify Locations
  const india = await prisma.location.findUnique({ where: { slug: 'india' } });
  assert(india !== null, 'India country location must exist');
  const jharkhand = await prisma.location.findUnique({ where: { slug: 'jharkhand' } });
  assert(jharkhand !== null, 'Jharkhand state location must exist');
  assert(jharkhand.parentId === india.id, 'Jharkhand parent must be India');

  // 4. Verify System Settings
  const settings = await prisma.systemSetting.findMany();
  console.log(`✓ Found ${settings.length} seeded system settings`);
  assert(settings.length >= 6, 'Must have at least 6 system settings');

  // 5. Verify Unique Email Constraint Enforcement
  const testEmail = `verify_db_${Date.now()}@abmedia.in`;
  const u1 = await prisma.user.create({
    data: {
      fullName: 'Verification User 1',
      email: testEmail,
    },
  });

  let duplicateCaught = false;
  try {
    await prisma.user.create({
      data: {
        fullName: 'Verification User 2',
        email: testEmail,
      },
    });
  } catch (err) {
    duplicateCaught = true;
  }
  assert(duplicateCaught, 'Unique email constraint must reject duplicates');

  // Cleanup test user
  await prisma.user.delete({ where: { id: u1.id } });

  console.log('✅ All Module 02 Database Integrity & Schema Verifications PASSED!');
}

verifyDatabaseModule02()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
