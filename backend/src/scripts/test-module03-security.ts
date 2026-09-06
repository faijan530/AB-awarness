import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../config/database';
import { AuthService } from '../modules/auth/auth.service';
import { PasswordService } from '../services/password.service';
import { RoleName, UserStatus, VerificationTokenType } from '@prisma/client';

async function testModule03Security() {
  console.log('==================================================');
  console.log('🛡️ MODULE 03 AUTHENTICATION, AUTHORIZATION & SECURITY TESTS');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // TEST 1: PASSWORD POLICY & REGISTRATION VALIDATION
  // ----------------------------------------------------
  console.log('TEST 1: Password Policy & Registration Security...');
  const weakEmail = `weak_${Date.now()}@abmedia.in`;
  let weakPasswordCaught = false;
  try {
    await AuthService.register({
      fullName: 'Weak Password User',
      email: weakEmail,
      password: '123', // Fails policy
    });
  } catch (err: any) {
    if (err.code === 'WEAK_PASSWORD' && err.statusCode === 400) {
      weakPasswordCaught = true;
    }
  }
  assert(weakPasswordCaught, 'Weak password MUST be rejected with HTTP 400 WEAK_PASSWORD');
  console.log('✓ Password policy enforced (weak passwords rejected)');

  const testEmail = `mod03_sec_${Date.now()}@abmedia.in`;
  const rawPassword = 'StrongP@ssword2026!';
  const regResult = await AuthService.register({
    fullName: 'Module 03 Security User',
    email: testEmail,
    password: rawPassword,
  });

  assert(regResult.user.id, 'User registration must return user ID');
  console.log('✓ Strong password user registered successfully');

  // ----------------------------------------------------
  // TEST 2: BRUTE-FORCE LOCKOUT & ANTI-ENUMERATION
  // ----------------------------------------------------
  console.log('\nTEST 2: Testing Brute-Force Protection & Account Lockout...');
  const badAttemptsEmail = `brute_${Date.now()}@abmedia.in`;
  const bruteUser = await AuthService.register({
    fullName: 'Brute Force Target User',
    email: badAttemptsEmail,
    password: rawPassword,
  });

  // Perform 5 consecutive failed login attempts
  for (let i = 1; i <= 5; i++) {
    try {
      await AuthService.login({ email: badAttemptsEmail, password: 'WrongPassword!' });
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 401, 'Failed login must return HTTP 401');
      assert.strictEqual(err.message, 'Invalid email or password', 'Anti-enumeration generic message required');
    }
  }

  // 6th attempt must trigger account lockout (HTTP 423)
  let lockoutTriggered = false;
  try {
    await AuthService.login({ email: badAttemptsEmail, password: rawPassword });
  } catch (err: any) {
    if (err.statusCode === 423 && err.code === 'ACCOUNT_LOCKED') {
      lockoutTriggered = true;
    }
  }
  assert(lockoutTriggered, '5 failed attempts MUST trigger 15-minute temporary account lockout (HTTP 423)');
  console.log('✓ Brute-force protection verified (5 failed attempts triggered temporary account lockout)');

  // ----------------------------------------------------
  // TEST 3: REFRESH TOKEN ROTATION & REPLAY DETECTION
  // ----------------------------------------------------
  console.log('\nTEST 3: Testing Refresh Token Rotation & Replay Attack Detection...');
  const initialRefresh = regResult.refreshToken;

  // Refresh token rotation (Token 1 -> Token 2)
  const rotatedResult = await AuthService.refresh(initialRefresh);
  assert(rotatedResult.accessToken, 'Token rotation must return new access token');
  assert(rotatedResult.refreshToken, 'Token rotation must return new refresh token');
  assert.notStrictEqual(initialRefresh, rotatedResult.refreshToken, 'Rotated refresh token MUST be different from initial token');
  console.log('✓ Refresh token rotation successful');

  // Attempt to REUSE initial revoked refresh token (Replay Attack)
  let replayAttackDetected = false;
  try {
    await AuthService.refresh(initialRefresh);
  } catch (err: any) {
    if (err.code === 'TOKEN_REUSE_DETECTED' && err.statusCode === 401) {
      replayAttackDetected = true;
    }
  }
  assert(replayAttackDetected, 'Reusing a revoked refresh token MUST trigger replay attack detection & HTTP 401');

  // Verify all sessions for this user were revoked due to replay attack
  const activeSessionsAfterReplay = await AuthService.getSessions(regResult.user.id);
  assert.strictEqual(activeSessionsAfterReplay.length, 0, 'Replay attack detection MUST revoke all active sessions for the user family');
  console.log('✓ Replay attack detection verified (revoked token reuse detected and all sessions invalidated)');

  // ----------------------------------------------------
  // TEST 4: PASSWORD RESET FLOW & TOKEN EXPIRATION/SINGLE-USE
  // ----------------------------------------------------
  console.log('\nTEST 4: Testing Password Reset & Single-Use Tokens...');
  const forgotResult = await AuthService.forgotPassword(testEmail);
  assert(forgotResult.message, 'Forgot password must return response message');
  assert(forgotResult.devToken, 'Dev reset token generated');

  const newPassword = 'NewP@ssword2026!Secured';
  const resetResult = await AuthService.resetPassword(forgotResult.devToken!, newPassword);
  assert(resetResult.message.includes('Password reset successfully'), 'Password reset must succeed');
  console.log('✓ Password reset completed');

  // Reusing the same reset token MUST fail
  let resetReuseBlocked = false;
  try {
    await AuthService.resetPassword(forgotResult.devToken!, 'AnotherP@ssword2026!');
  } catch (err: any) {
    if (err.code === 'INVALID_RESET_TOKEN') {
      resetReuseBlocked = true;
    }
  }
  assert(resetReuseBlocked, 'Reset token MUST be single-use only');
  console.log('✓ Reset token single-use enforcement verified');

  // Login with new password
  const newLogin = await AuthService.login({ email: testEmail, password: newPassword });
  assert(newLogin.accessToken, 'Login with new password must succeed');
  console.log('✓ Login with new password verified');

  // ----------------------------------------------------
  // TEST 5: EMAIL VERIFICATION FLOW
  // ----------------------------------------------------
  console.log('\nTEST 5: Testing Email Verification Flow...');
  const verificationTokenRecord = await prisma.verificationToken.findFirst({
    where: { userId: regResult.user.id, type: VerificationTokenType.EMAIL_VERIFICATION, usedAt: null },
  });
  assert(verificationTokenRecord, 'Email verification record should exist for registered user');

  // Re-send verification
  const resendResult = await AuthService.resendVerification(regResult.user.id);
  assert(resendResult.devToken, 'Resend verification token generated');

  const verifyEmailResult = await AuthService.verifyEmail(resendResult.devToken!);
  assert(verifyEmailResult.message.includes('verified'), 'Email verification must succeed');

  const verifiedUser = await AuthService.getProfile(regResult.user.id);
  assert.strictEqual(verifiedUser.emailVerified, true, 'User emailVerified in database MUST be true');
  console.log('✓ Email verification flow verified (emailVerified marked true in DB)');

  // ----------------------------------------------------
  // TEST 6: SESSION LISTING & INDIVIDUAL REVOCATION
  // ----------------------------------------------------
  console.log('\nTEST 6: Testing Active Session Listing & Revocation...');
  const sessions = await AuthService.getSessions(regResult.user.id);
  assert(sessions.length > 0, 'Active sessions list must return current session');
  const targetSessionId = sessions[0].id;

  await AuthService.revokeSession(regResult.user.id, targetSessionId);
  const remainingSessions = await AuthService.getSessions(regResult.user.id);
  assert.strictEqual(remainingSessions.length, sessions.length - 1, 'Target session must be revoked');
  console.log('✓ Session management verified (individual session revocation succeeded)');

  // ----------------------------------------------------
  // TEST 7: SECURITY AUDIT EVENTS LOGGING
  // ----------------------------------------------------
  console.log('\nTEST 7: Testing Security Audit Event Logging...');
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'SECURITY' },
  });
  assert(auditLogs.length > 0, 'Security audit events MUST be logged to audit_logs table');
  console.log(`✓ Security audit logging verified (${auditLogs.length} security audit events recorded in DB)`);

  // Cleanup test users
  await prisma.verificationToken.deleteMany({ where: { userId: { in: [regResult.user.id, bruteUser.user.id] } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: [regResult.user.id, bruteUser.user.id] } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: [regResult.user.id, bruteUser.user.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [regResult.user.id, bruteUser.user.id] } } });

  console.log('\n==================================================');
  console.log('✅ ALL MODULE 03 SECURITY & AUTHENTICATION TESTS PASSED!');
  console.log('==================================================');
}

testModule03Security()
  .catch((err) => {
    console.error('❌ Module 03 Security Test Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
