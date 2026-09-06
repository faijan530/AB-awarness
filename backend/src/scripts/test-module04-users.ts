import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../config/database';
import { AuthService } from '../modules/auth/auth.service';
import { UserService } from '../modules/users/user.service';
import { AdminUserService } from '../modules/admin/admin-user.service';
import { RoleName, UserStatus } from '@prisma/client';

async function testModule04UserManagement() {
  console.log('==================================================');
  console.log('👤 MODULE 04 USER & SUPER ADMIN MANAGEMENT TESTS');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // TEST 1: USER SELF-SERVICE PROFILE & ACTIVITY
  // ----------------------------------------------------
  console.log('TEST 1: User Self-Service Profile & Activity...');
  const testEmail = `mod04_user_${Date.now()}@abmedia.in`;
  const regResult = await AuthService.register({
    fullName: 'Module 04 Test User',
    email: testEmail,
    password: 'StrongP@ssword2026!',
  });
  const userId = regResult.user.id;

  const profile = await UserService.getProfile(userId);
  assert.strictEqual(profile.fullName, 'Module 04 Test User');
  assert.strictEqual(profile.status, UserStatus.ACTIVE);
  console.log('✓ Profile retrieved successfully');

  const updatedProfile = await UserService.updateProfile(userId, {
    fullName: 'Module 04 Updated Name',
    bio: 'Digital Journalist in Palamu',
  });
  assert.strictEqual(updatedProfile.fullName, 'Module 04 Updated Name');
  assert.strictEqual(updatedProfile.bio, 'Digital Journalist in Palamu');
  console.log('✓ Profile update (name, bio) verified');

  const activity = await UserService.getUserActivity(userId);
  assert.strictEqual(typeof activity.commentsCount, 'number');
  assert.strictEqual(typeof activity.activeSessionsCount, 'number');
  console.log('✓ User activity summary verified');

  // ----------------------------------------------------
  // TEST 2: SUPER ADMIN USER LISTING, SEARCH & STATS
  // ----------------------------------------------------
  console.log('\nTEST 2: Super Admin User Search, Filtering & Statistics...');
  const listResult = await AdminUserService.getUsers({
    search: 'Module 04 Updated Name',
    page: 1,
    limit: 10,
  });
  assert(listResult.users.length >= 1, 'Search query must find the newly registered user');
  assert.strictEqual(listResult.users[0].fullName, 'Module 04 Updated Name');
  console.log('✓ Super Admin parameterized search verified');

  const stats = await AdminUserService.getUserStatistics();
  assert(stats.totalUsers >= 1, 'Total users count must be >= 1');
  assert(stats.activeUsers >= 1, 'Active users count must be >= 1');
  console.log('✓ Super Admin user statistics aggregation verified');

  // ----------------------------------------------------
  // TEST 3: SUSPEND & UNSUSPEND USER WORKFLOW
  // ----------------------------------------------------
  console.log('\nTEST 3: User Suspension & Unsuspension Workflow...');
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@abmedia.in' },
  });
  assert(adminUser, 'Default SuperAdmin account must exist in DB');

  const suspended = await AdminUserService.suspendUser(adminUser.id, userId, {
    reason: 'Policy Violation Test',
  });
  assert.strictEqual(suspended.status, UserStatus.SUSPENDED);
  console.log('✓ User suspended & active sessions revoked');

  const unsuspended = await AdminUserService.unsuspendUser(adminUser.id, userId);
  assert.strictEqual(unsuspended.status, UserStatus.ACTIVE);
  console.log('✓ User unsuspended back to ACTIVE status');

  // ----------------------------------------------------
  // TEST 4: BLOCK & UNBLOCK USER WORKFLOW
  // ----------------------------------------------------
  console.log('\nTEST 4: User Blocking & Unblocking Workflow...');
  const blocked = await AdminUserService.blockUser(adminUser.id, userId, {
    reason: 'Severe Violation Test',
  });
  assert.strictEqual(blocked.status, UserStatus.BLOCKED);
  console.log('✓ User blocked & active sessions revoked');

  const unblocked = await AdminUserService.unblockUser(adminUser.id, userId);
  assert.strictEqual(unblocked.status, UserStatus.ACTIVE);
  console.log('✓ User unblocked back to ACTIVE status');

  // ----------------------------------------------------
  // TEST 5: ROLE ASSIGNMENT & LAST SUPER ADMIN PROTECTION
  // ----------------------------------------------------
  console.log('\nTEST 5: Role Assignment & Last Super Admin Protection...');
  const assigned = await AdminUserService.assignRole(adminUser.id, userId, RoleName.SUPER_ADMIN);
  assert(assigned.roles.includes(RoleName.SUPER_ADMIN), 'Target user must now have SUPER_ADMIN role');
  console.log('✓ Role assignment (SUPER_ADMIN) verified');

  // Remove role back
  const roleRemoved = await AdminUserService.removeRole(adminUser.id, userId, RoleName.SUPER_ADMIN);
  assert(!roleRemoved.roles.includes(RoleName.SUPER_ADMIN), 'SUPER_ADMIN role removed');
  console.log('✓ Role removal verified');

  // Attempting to suspend or remove role from the main Super Admin (adminUser.id) MUST fail
  let lastAdminProtected = false;
  try {
    await AdminUserService.suspendUser(userId, adminUser.id, { reason: 'Malicious attempt' });
  } catch (err: any) {
    if (err.code === 'LAST_SUPER_ADMIN_PROTECTED') {
      lastAdminProtected = true;
    }
  }
  assert(lastAdminProtected, 'Suspending the last active Super Admin MUST be rejected with LAST_SUPER_ADMIN_PROTECTED');
  console.log('✓ Last Super Admin protection verified (suspension rejected)');

  // Clean up test user
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  console.log('✓ Cleaned up test user');

  console.log('\n==================================================');
  console.log('✅ ALL MODULE 04 USER & SUPER ADMIN MANAGEMENT TESTS PASSED!');
  console.log('==================================================\n');
}

testModule04UserManagement()
  .catch((err) => {
    console.error('❌ Module 04 Test Failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
