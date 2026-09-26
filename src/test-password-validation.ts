import { validatePasswordComplexity, AuthService } from './services/auth.service';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function runPasswordTestSuite() {
  console.log('============================================================');
  console.log('LEXIFY PASSWORD VALIDATION & AUTHENTICATION TEST SUITE');
  console.log('============================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` -> ${detail}` : ''}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      failCount++;
    }
  }

  // -------------------------------------------------------------
  // 1. UNIT TESTS: PASSWORD COMPLEXITY VALIDATOR
  // -------------------------------------------------------------
  console.log('--- 1. PASSWORD COMPLEXITY UNIT TESTS ---');

  const failCases = [
    { pwd: 'password', expectedErrors: ['uppercase', 'number', 'special'] },
    { pwd: 'password1', expectedErrors: ['uppercase', 'special'] },
    { pwd: 'Password', expectedErrors: ['number', 'special'] },
    { pwd: 'Password1', expectedErrors: ['special'] },
    { pwd: 'Pass1!', expectedErrors: ['at least 8 characters'] },
    { pwd: '12345678', expectedErrors: ['uppercase', 'lowercase', 'special'] },
    { pwd: 'Lexify123', expectedErrors: ['special'] },
  ];

  for (const tc of failCases) {
    const res = validatePasswordComplexity(tc.pwd);
    assert(
      !res.isValid && res.errors.length > 0,
      `Reject Weak Password: "${tc.pwd}"`,
      `Errors: [${res.errors.join(', ')}]`
    );
  }

  const passCases = ['Lexify123!', 'Student1@', 'ValidPass#2026', 'StrongP@ssw0rd!'];

  for (const pwd of passCases) {
    const res = validatePasswordComplexity(pwd);
    assert(
      res.isValid && res.errors.length === 0,
      `Accept Compliant Password: "${pwd}"`,
      `Valid: ${res.isValid}`
    );
  }

  // -------------------------------------------------------------
  // 2. BACKEND REGISTRATION POLICY & INTEGRATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. BACKEND REGISTRATION INTEGRATION TESTS ---');

  const testEmail = `test.pw.${Date.now()}@urios.edu.ph`;

  // Test 2.1: Reject Weak Password at AuthService level
  try {
    await AuthService.registerStudent({
      name: 'Test Student',
      email: testEmail,
      passwordPlain: 'Lexify123', // missing special char
    });
    assert(false, 'AuthService.registerStudent weak password rejection');
  } catch (err: any) {
    assert(
      err.message.includes('special character'),
      'AuthService.registerStudent weak password rejection',
      `Error: "${err.message}"`
    );
  }

  // Test 2.2: Accept Valid Compliant Password
  let createdUser: any = null;
  try {
    createdUser = await AuthService.registerStudent({
      name: 'Test Student',
      email: testEmail,
      passwordPlain: 'Lexify123!',
    });
    assert(
      createdUser && createdUser.email === testEmail,
      'AuthService.registerStudent valid registration',
      `Created user: ${createdUser.email}`
    );
  } catch (err: any) {
    assert(false, 'AuthService.registerStudent valid registration', err.message);
  }

  // Test 2.3: Verify Password is not stored in plaintext and is bcrypt hashed
  if (createdUser) {
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    const isBcrypt = dbUser?.passwordHash.startsWith('$2') || false;
    const isPlaintextLeak = dbUser?.passwordHash.includes('Lexify123!') || false;
    const isPasswordVerifiable = await bcrypt.compare('Lexify123!', dbUser?.passwordHash || '');

    assert(
      isBcrypt && !isPlaintextLeak && isPasswordVerifiable,
      'Password Secure Storage & Bcrypt Hashing',
      `Bcrypt prefix: ${isBcrypt}, Plaintext leak: ${isPlaintextLeak}, Bcrypt match: ${isPasswordVerifiable}`
    );
  }

  // Test 2.4: Duplicate email rejection
  try {
    await AuthService.registerStudent({
      name: 'Duplicate Student',
      email: testEmail,
      passwordPlain: 'Lexify123!',
    });
    assert(false, 'Duplicate Email Rejection');
  } catch (err: any) {
    assert(
      err.message.includes('already exists'),
      'Duplicate Email Rejection',
      `Error: "${err.message}"`
    );
  }

  // Test 2.5: Login with newly created password
  try {
    const loginResult = await AuthService.login(testEmail, 'Lexify123!');
    assert(
      loginResult && loginResult.token.length > 0 && loginResult.user.role === 'STUDENT',
      'Student Login with New Password',
      `User authenticated: ${loginResult.user.name} (${loginResult.user.role})`
    );
  } catch (err: any) {
    assert(false, 'Student Login with New Password', err.message);
  }

  // Test 2.6: Login with incorrect password
  try {
    await AuthService.login(testEmail, 'WrongPassword123!');
    assert(false, 'Invalid Login Password Rejection');
  } catch (err: any) {
    assert(
      err.message.includes('Invalid email or password'),
      'Invalid Login Password Rejection',
      `Error: "${err.message}"`
    );
  }

  // Test 2.7: Existing Admin Login unaffected
  try {
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Password123!';
    const adminLogin = await AuthService.login('admin@lexify.local', adminPassword);
    assert(
      adminLogin && adminLogin.user.role === 'ADMIN',
      'Existing Admin Login Unaffected',
      `Admin authenticated: ${adminLogin.user.email} (${adminLogin.user.role})`
    );
  } catch (err: any) {
    assert(false, 'Existing Admin Login Unaffected', err.message);
  }

  // -------------------------------------------------------------
  // CLEANUP TEST USER
  // -------------------------------------------------------------
  if (createdUser) {
    await prisma.auditLog.deleteMany({ where: { userId: createdUser.id } });
    await prisma.user.delete({ where: { id: createdUser.id } });
    console.log('\n✓ Cleaned up temporary test user.');
  }

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passCount} PASS, ${failCount} FAIL`);
  console.log('============================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runPasswordTestSuite();
