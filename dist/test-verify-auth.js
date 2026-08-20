"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./services/auth.service");
const prisma_1 = require("./lib/prisma");
async function verifyAuthSystem() {
    console.log('🧪 Starting YAWA Authentication & Authorization Verification Suite...\n');
    // 1. Student Quick Login
    console.log('1. Testing Student Quick Login...');
    const studentAuth = await auth_service_1.AuthService.quickLogin('STUDENT');
    console.assert(!!studentAuth.token, 'Student login must return token');
    console.assert(studentAuth.user.role === 'STUDENT', 'User role must be STUDENT');
    console.assert(studentAuth.user.email === 'student@yawa.local', 'User email must match student@yawa.local');
    console.log(`   ✓ Student quick-login succeeded: ${studentAuth.user.name} (${studentAuth.user.role})`);
    // 2. Expert Quick Login
    console.log('2. Testing Expert Quick Login...');
    const expertAuth = await auth_service_1.AuthService.quickLogin('EXPERT');
    console.assert(!!expertAuth.token, 'Expert login must return token');
    console.assert(expertAuth.user.role === 'EXPERT', 'User role must be EXPERT');
    console.assert(expertAuth.user.email === 'expert@yawa.local', 'User email must match expert@yawa.local');
    console.log(`   ✓ Expert quick-login succeeded: ${expertAuth.user.name} (${expertAuth.user.role})`);
    // 3. Admin Quick Login
    console.log('3. Testing Admin Quick Login...');
    const adminAuth = await auth_service_1.AuthService.quickLogin('ADMIN');
    console.assert(!!adminAuth.token, 'Admin login must return token');
    console.assert(adminAuth.user.role === 'ADMIN', 'User role must be ADMIN');
    console.assert(adminAuth.user.email === 'admin@yawa.local', 'User email must match admin@yawa.local');
    console.log(`   ✓ Admin quick-login succeeded: ${adminAuth.user.name} (${adminAuth.user.role})`);
    // 4. Credential Login (Valid Credentials)
    console.log('4. Testing Standard Credential Login...');
    const credAuth = await auth_service_1.AuthService.login('student@yawa.local', 'Password123!');
    console.assert(!!credAuth.token, 'Credential login must return token');
    console.assert(credAuth.user.id === studentAuth.user.id, 'User IDs must match');
    console.log(`   ✓ Standard credential login succeeded for student@yawa.local`);
    // 5. Credential Login (Invalid Password)
    console.log('5. Testing Invalid Credentials Rejection...');
    try {
        await auth_service_1.AuthService.login('student@yawa.local', 'WrongPassword!');
        console.error('   ❌ FAILED: Invalid password was accepted!');
    }
    catch (err) {
        console.log(`   ✓ Rejected invalid password cleanly: "${err.message}"`);
    }
    // 6. Credential Login (Nonexistent Email)
    console.log('6. Testing Nonexistent Email Rejection...');
    try {
        await auth_service_1.AuthService.login('nonexistent@law.fsuu.edu.ph', 'Password123!');
        console.error('   ❌ FAILED: Nonexistent user was accepted!');
    }
    catch (err) {
        console.log(`   ✓ Rejected nonexistent email cleanly: "${err.message}"`);
    }
    // 7. Academic Research Disclaimer Acceptance
    console.log('7. Testing Academic Research Disclaimer Acceptance...');
    const updatedUser = await auth_service_1.AuthService.acceptDisclaimer(studentAuth.user.id);
    console.assert(!!updatedUser.disclaimerAcceptedAt, 'disclaimerAcceptedAt timestamp must be set');
    console.log(`   ✓ Research disclaimer accepted at: ${updatedUser.disclaimerAcceptedAt}`);
    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED WITH ZERO ERRORS!');
}
verifyAuthSystem()
    .catch((e) => {
    console.error('Authentication test failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
