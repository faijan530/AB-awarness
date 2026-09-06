import assert from 'assert';
import argon2 from 'argon2';
import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../config/database';
import { AuthService } from '../modules/auth/auth.service';
import { RoleName, UserStatus } from '@prisma/client';

async function testModule02E2E() {
  console.log('==================================================');
  console.log('🚀 MODULE 02 END-TO-END INTEGRATION & DB VERIFICATION');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // TEST 1: DATABASE SEED & SCHEMA VERIFICATION
  // ----------------------------------------------------
  console.log('TEST 1: Database Seed & Schema Verification...');
  const userRoleRecord = await prisma.role.findUnique({ where: { name: RoleName.USER } });
  const superAdminRoleRecord = await prisma.role.findUnique({ where: { name: RoleName.SUPER_ADMIN } });

  assert(userRoleRecord !== null, 'USER role must exist in PostgreSQL database');
  assert(superAdminRoleRecord !== null, 'SUPER_ADMIN role must exist in PostgreSQL database');
  console.log('✓ Roles verified: USER & SUPER_ADMIN exist in DB');

  // ----------------------------------------------------
  // TEST 2: USER REGISTRATION & DATABASE PERSISTENCE
  // ----------------------------------------------------
  console.log('\nTEST 2: Testing User Registration & PostgreSQL Persistence...');
  const testEmail = `qa_user_${Date.now()}@abmedia.in`;
  const rawPassword = 'SecurePassword123!';
  const testFullName = 'QA Test Reporter';

  const regResult = await AuthService.register({
    fullName: testFullName,
    email: testEmail,
    password: rawPassword,
  });

  assert(regResult.user.id, 'User ID (UUID) must be returned on registration');
  assert(regResult.accessToken, 'Access token must be returned on registration');
  assert(regResult.refreshToken, 'Refresh token must be returned on registration');
  console.log(`✓ Registration API returned User UUID: ${regResult.user.id}`);

  // DIRECT POSTGRESQL VERIFICATION
  console.log('...Performing direct PostgreSQL database verification for newly created user');
  const dbUser = await prisma.user.findUnique({
    where: { id: regResult.user.id },
    include: {
      userRoles: {
        include: { role: true },
      },
      refreshTokens: true,
    },
  });

  assert(dbUser !== null, 'User record MUST exist in PostgreSQL database');
  assert.strictEqual(dbUser.email, testEmail, 'Database email must match registered email');
  assert.strictEqual(dbUser.fullName, testFullName, 'Database fullName must match input');
  assert.strictEqual(dbUser.status, UserStatus.ACTIVE, 'Database status must be ACTIVE');
  assert(dbUser.passwordHash !== null, 'Password hash MUST be present');
  assert.notStrictEqual(dbUser.passwordHash, rawPassword, 'SECURITY CRITICAL: Password must NEVER be stored in plaintext');

  const isHashValid = await argon2.verify(dbUser.passwordHash, rawPassword);
  assert(isHashValid, 'Stored password hash must be verifiable against original raw password with Argon2');
  console.log('✓ PostgreSQL User Record Verified: UUID, Email, Argon2 Password Hash intact');

  // VERIFY USER_ROLES ASSIGNMENT IN POSTGRESQL
  assert.strictEqual(dbUser.userRoles.length, 1, 'User must have exactly 1 default role assigned');
  assert.strictEqual(dbUser.userRoles[0].role.name, RoleName.USER, 'Default role assigned MUST be USER');
  console.log('✓ PostgreSQL User Role Verified: Default role USER correctly linked in user_roles table');

  // VERIFY REFRESH_TOKENS PERSISTENCE
  assert(dbUser.refreshTokens.length > 0, 'Refresh token metadata record MUST exist in refresh_tokens table');
  assert.notStrictEqual(
    dbUser.refreshTokens[0].tokenHash,
    regResult.refreshToken,
    'SECURITY CRITICAL: RAW refresh token must NOT be stored in database'
  );
  console.log('✓ PostgreSQL Refresh Token Verified: Hashed refresh token stored in refresh_tokens table');

  // ----------------------------------------------------
  // TEST 3: DUPLICATE EMAIL PREVENTION
  // ----------------------------------------------------
  console.log('\nTEST 3: Testing Duplicate Email Prevention...');
  let duplicatePrevented = false;
  try {
    await AuthService.register({
      fullName: 'Duplicate User',
      email: testEmail,
      password: rawPassword,
    });
  } catch (err: any) {
    if (err.code === 'DUPLICATE_EMAIL' && err.statusCode === 409) {
      duplicatePrevented = true;
    }
  }
  assert(duplicatePrevented, 'Duplicate email registration MUST be rejected with HTTP 409 DUPLICATE_EMAIL');
  console.log('✓ Duplicate email registration correctly prevented with HTTP 409 Conflict');

  // ----------------------------------------------------
  // TEST 4: USER LOGIN & LAST_LOGIN_AT UPDATE
  // ----------------------------------------------------
  console.log('\nTEST 4: Testing User Login & DB Last Login Update...');
  const loginResult = await AuthService.login({
    email: testEmail,
    password: rawPassword,
  });

  assert(loginResult.accessToken, 'Login must issue valid access token');
  assert.strictEqual(loginResult.user.email, testEmail, 'Login profile email must match');
  console.log('✓ Login successful with correct credentials');

  // Check PostgreSQL last_login_at
  const updatedDbUser = await prisma.user.findUnique({ where: { id: dbUser.id } });
  assert(updatedDbUser?.lastLoginAt !== null, 'last_login_at timestamp in PostgreSQL must be updated on login');
  console.log(`✓ PostgreSQL last_login_at updated: ${updatedDbUser?.lastLoginAt?.toISOString()}`);

  // Test invalid login
  let invalidLoginCaught = false;
  try {
    await AuthService.login({
      email: testEmail,
      password: 'WrongPassword!',
    });
  } catch (err: any) {
    if (err.statusCode === 401) {
      invalidLoginCaught = true;
    }
  }
  assert(invalidLoginCaught, 'Invalid password MUST be rejected with HTTP 401 Unauthorized');
  console.log('✓ Invalid password correctly rejected with HTTP 401');

  // ----------------------------------------------------
  // TEST 5: SUPER ADMIN CREATION & ROLE-BASED AUTHORIZATION
  // ----------------------------------------------------
  console.log('\nTEST 5: Testing Super Admin Role & Authorization...');
  const adminEmail = `super_admin_${Date.now()}@abmedia.in`;
  const adminPasswordHash = await argon2.hash('SuperAdminPassword123!');

  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Super Admin Governance',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: superAdminRoleRecord.id,
    },
  });

  const adminProfile = await AuthService.getProfile(adminUser.id);
  assert(adminProfile.roles.includes('SUPER_ADMIN'), 'Super Admin user profile MUST include SUPER_ADMIN role');
  console.log('✓ Super Admin user created & roles verified');

  // ----------------------------------------------------
  // TEST 6: LOGOUT & TOKEN REVOCATION
  // ----------------------------------------------------
  console.log('\nTEST 6: Testing Logout & Token Revocation...');
  await AuthService.logout(dbUser.id);

  const activeTokensCount = await prisma.refreshToken.count({
    where: { userId: dbUser.id, revokedAt: null },
  });
  assert.strictEqual(activeTokensCount, 0, 'Logout MUST mark active refresh tokens as revoked in PostgreSQL');
  console.log('✓ Logout successfully revoked refresh tokens in PostgreSQL');

  // Clean up test records
  await prisma.refreshToken.deleteMany({ where: { userId: { in: [dbUser.id, adminUser.id] } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: [dbUser.id, adminUser.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [dbUser.id, adminUser.id] } } });

  console.log('\n==================================================');
  console.log('✅ ALL MODULE 02 END-TO-END INTEGRATION & DATABASE TESTS PASSED!');
  console.log('==================================================');
}

testModule02E2E()
  .catch((err) => {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
