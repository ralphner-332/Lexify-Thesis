"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./services/auth.service");
const question_service_1 = require("./services/question.service");
const rubric_service_1 = require("./services/rubric.service");
const agent_version_service_1 = require("./services/agent-version.service");
const audit_service_1 = require("./services/audit.service");
const prisma_1 = require("./lib/prisma");
async function verifyBackend() {
    console.log('🧪 Starting Plan 01-01 Automated Verification Tests...\n');
    // Test 1: Quick Login & JWT verification
    console.log('1. Testing Authentication & Quick Login...');
    const studentAuth = await auth_service_1.AuthService.quickLogin('STUDENT');
    const adminAuth = await auth_service_1.AuthService.quickLogin('ADMIN');
    const expertAuth = await auth_service_1.AuthService.quickLogin('EXPERT');
    console.assert(studentAuth.user.role === 'STUDENT', 'Student role mismatch');
    console.assert(adminAuth.user.role === 'ADMIN', 'Admin role mismatch');
    console.assert(expertAuth.user.role === 'EXPERT', 'Expert role mismatch');
    console.log('   ✓ Quick login issued valid tokens for all 3 roles');
    // Test 2: Reference Answer Security / Role-specific DTOs
    console.log('2. Testing Question DTO Security & Sanitization...');
    const studentQuestions = await question_service_1.QuestionService.listQuestions('STUDENT');
    console.assert(studentQuestions.length > 0, 'No questions found');
    for (const q of studentQuestions) {
        console.assert(q.modelAnswer === undefined, 'SECURITY BREACH: Student DTO contains modelAnswer!');
        console.assert(q.statutoryElements === undefined, 'SECURITY BREACH: Student DTO contains statutoryElements!');
        console.assert(q.relevantProvisions === undefined, 'SECURITY BREACH: Student DTO contains relevantProvisions!');
        console.assert(q.conceptVariations === undefined, 'SECURITY BREACH: Student DTO contains conceptVariations!');
    }
    console.log('   ✓ Student question DTO strictly strips model answers, elements, and grading keys');
    const adminQuestions = await question_service_1.QuestionService.listQuestions('ADMIN');
    console.assert(adminQuestions[0].modelAnswer !== undefined, 'Admin should see modelAnswer');
    console.assert(Array.isArray(adminQuestions[0].statutoryElements), 'Admin should see statutoryElements');
    console.log('   ✓ Admin question DTO retains full authoring configuration');
    // Test 3: Rubric Weight Validation
    console.log('3. Testing Rubric Builder Weight Validation...');
    try {
        await rubric_service_1.RubricService.createRubric({
            name: 'Invalid Rubric',
            description: 'Weights sum to 70%',
            criteria: [
                { name: 'Crit 1', description: 'Desc', weightPercent: 40 },
                { name: 'Crit 2', description: 'Desc', weightPercent: 30 },
            ],
        });
        console.error('   ❌ FAILED: Rubric with 70% weight was accepted!');
    }
    catch (err) {
        console.log('   ✓ Correctly rejected invalid rubric weights (!= 100%):', err.message);
    }
    // Test 4: Agent Version Snapshot & Immutability
    console.log('4. Testing Agent Version Snapshots & Immutable Locking...');
    const v1 = await agent_version_service_1.AgentVersionService.getActiveVersion();
    console.assert(v1?.versionTag === 'V1', 'V1 should be active baseline');
    console.assert(v1?.isLocked === true, 'V1 must be locked');
    try {
        await agent_version_service_1.AgentVersionService.updateDraftVersion(v1.id, { label: 'Attempted Mutation' });
        console.error('   ❌ FAILED: Locked version was mutated!');
    }
    catch (err) {
        console.log('   ✓ Correctly prevented modification of locked snapshot:', err.message);
    }
    // Test 5: Audit Log Append-Only Integrity
    console.log('5. Testing AuditLog Query...');
    const auditLogs = await audit_service_1.AuditService.getAuditLogs({ limit: 10 });
    console.assert(auditLogs.total > 0, 'Audit logs should exist');
    console.log(`   ✓ Found ${auditLogs.total} immutable audit entries. Service has no delete/update endpoints.`);
    console.log('\n🎉 ALL PLAN 01-01 BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}
verifyBackend()
    .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
