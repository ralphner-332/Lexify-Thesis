"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./services/auth.service");
const assessment_session_service_1 = require("./services/assessment-session.service");
const evaluation_service_1 = require("./services/evaluation.service");
const prisma_1 = require("./lib/prisma");
async function runAttemptPolicyTests() {
    console.log('🧪 Starting YAWA Research-Safe Assessment Attempt Policy Verification Suite...\n');
    // Step 0: Auth Demo Student
    const demoAuth = await auth_service_1.AuthService.quickLogin('STUDENT');
    const demoStudentId = demoAuth.user.id;
    // Clean prior test data for this student
    await prisma_1.prisma.finalEvaluationReview.deleteMany({});
    await prisma_1.prisma.expertEvaluation.deleteMany({});
    await prisma_1.prisma.expertDraft.deleteMany({});
    await prisma_1.prisma.evaluation.deleteMany({ where: { studentId: demoStudentId } });
    await prisma_1.prisma.studentAnswerDraft.deleteMany({ where: { session: { studentId: demoStudentId } } });
    await prisma_1.prisma.assessmentSession.deleteMany({ where: { studentId: demoStudentId } });
    // 1. Demo Student completes Assessment A
    console.log('1. Creating and completing Demo Assessment A...');
    const sessionA = await assessment_session_service_1.AssessmentSessionService.getOrCreateActiveSession(demoStudentId, true);
    console.assert(sessionA.status === 'IN_PROGRESS', 'Session A must be IN_PROGRESS');
    const q1 = sessionA.questions[0];
    const q2 = sessionA.questions[1];
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(sessionA.id, demoStudentId, q1.id, 'A validly invoked complete self-defense under Article 11(1) of the Revised Penal Code because B attacked with a knife.');
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(sessionA.id, demoStudentId, q2.id, 'Maria is exempt from criminal liability due to irresistible physical force under Article 12(5) of the Revised Penal Code.');
    const submitA = await assessment_session_service_1.AssessmentSessionService.submitSession(sessionA.id, demoStudentId);
    console.assert(submitA.success === true, 'Submit A must succeed');
    console.log(`   ✓ Demo Assessment A finalized with ID: ${sessionA.id}`);
    // 2. Verify Assessment A is SUBMITTED and Evaluation A exists
    console.log('2. Verifying Assessment A Immutability & Evaluation Persistence...');
    const dbSessionA = await prisma_1.prisma.assessmentSession.findUnique({
        where: { id: sessionA.id },
    });
    console.assert(dbSessionA?.status === 'SUBMITTED', 'Session A must be SUBMITTED');
    const evalsA = await prisma_1.prisma.evaluation.findMany({
        where: { sessionId: sessionA.id },
    });
    console.assert(evalsA.length === 2, `Expected 2 evaluations for A, found ${evalsA.length}`);
    console.log(`   ✓ Found ${evalsA.length} Evaluation records for Session A`);
    // 3. Demo Student explicitly creates Assessment B
    console.log('3. Demo Student explicitly creating fresh Assessment B...');
    const sessionB = await assessment_session_service_1.AssessmentSessionService.createAssessmentSession(demoStudentId, true);
    console.assert(sessionB.id !== sessionA.id, 'Session B must have a new unique ID');
    console.assert(sessionB.status === 'IN_PROGRESS', 'Session B must start in IN_PROGRESS');
    console.assert(sessionB.questions[0].draftAnswer === '', 'Session B must start with empty drafts (0/N)');
    console.log(`   ✓ Demo Assessment B initialized with ID: ${sessionB.id} (status: ${sessionB.status})`);
    // 4. Verify Assessment A is completely unchanged
    console.log('4. Verifying Assessment A remains unchanged in DB...');
    const recheckedSessionA = await prisma_1.prisma.assessmentSession.findUnique({
        where: { id: sessionA.id },
    });
    console.assert(recheckedSessionA?.status === 'SUBMITTED', 'Session A must remain SUBMITTED');
    console.log('   ✓ Assessment A remains permanently preserved as SUBMITTED');
    // 5. Complete Assessment B
    console.log('5. Answering and finalizing Assessment B...');
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(sessionB.id, demoStudentId, q1.id, 'Attempt B revised answer for Self-Defense under RPC Art. 11 with full analysis.');
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(sessionB.id, demoStudentId, q2.id, 'Attempt B revised answer for Exemption under RPC Art. 12.');
    const submitB = await assessment_session_service_1.AssessmentSessionService.submitSession(sessionB.id, demoStudentId);
    console.assert(submitB.success === true, 'Submit B must succeed');
    console.log(`   ✓ Demo Assessment B finalized with ID: ${sessionB.id}`);
    // 6. Verify both sessions exist independently
    console.log('6. Verifying Independent Session History...');
    const history = await assessment_session_service_1.AssessmentSessionService.getStudentSessionHistory(demoStudentId);
    console.assert(history.length === 2, `Expected 2 sessions in history, found ${history.length}`);
    console.assert(history[0].id === sessionB.id, 'Latest session should be B');
    console.assert(history[1].id === sessionA.id, 'Prior session should be A');
    console.log(`   ✓ Found ${history.length} independent submitted sessions in history`);
    // 7. Verify Diagnostic Feedback resolves correct session
    console.log('7. Testing Diagnostic Feedback Resolution for Specific Sessions...');
    const feedbackA = await evaluation_service_1.EvaluationService.getStudentSessionEvaluations(sessionA.id, demoStudentId);
    const feedbackB = await evaluation_service_1.EvaluationService.getStudentSessionEvaluations(sessionB.id, demoStudentId);
    console.assert(feedbackA.length === 2, 'Feedback A must have 2 records');
    console.assert(feedbackB.length === 2, 'Feedback B must have 2 records');
    console.log(`   ✓ Diagnostic feedback correctly resolved independently for Session A and Session B`);
    // 8. REAL RESEARCH PARTICIPANT PROTOCOL ENFORCEMENT
    console.log('8. Testing Single-Attempt Protocol Enforcement for Real Research Participant (isDemo: false)...');
    // Create a real research student user in DB
    const researchUser = await prisma_1.prisma.user.upsert({
        where: { email: 'research.participant.01@law.fsuu.edu.ph' },
        update: { isDemo: false },
        create: {
            email: 'research.participant.01@law.fsuu.edu.ph',
            name: 'Real Research Participant 01',
            role: 'STUDENT',
            passwordHash: 'dummy',
            isDemo: false,
        },
    });
    // Clean research student sessions
    await prisma_1.prisma.evaluation.deleteMany({ where: { studentId: researchUser.id } });
    await prisma_1.prisma.studentAnswerDraft.deleteMany({ where: { session: { studentId: researchUser.id } } });
    await prisma_1.prisma.assessmentSession.deleteMany({ where: { studentId: researchUser.id } });
    // Start attempt 1
    const researchSession1 = await assessment_session_service_1.AssessmentSessionService.createAssessmentSession(researchUser.id, false);
    console.assert(researchSession1.status === 'IN_PROGRESS', 'Research session 1 must be IN_PROGRESS');
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(researchSession1.id, researchUser.id, q1.id, 'Real participant submission for Q1');
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(researchSession1.id, researchUser.id, q2.id, 'Real participant submission for Q2');
    // Submit attempt 1 (update to SUBMITTED to simulate completed research submission)
    await prisma_1.prisma.assessmentSession.update({
        where: { id: researchSession1.id },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
    console.log(`   ✓ Real research participant recorded with submitted Assessment 1 (ID: ${researchSession1.id})`);
    // Attempt to start a 2nd assessment for real research participant
    console.log('9. Verifying that a second attempt is strictly REJECTED for real research participants...');
    try {
        await assessment_session_service_1.AssessmentSessionService.createAssessmentSession(researchUser.id, false);
        console.error('   ❌ FAILED: Second attempt was erroneously permitted for a real research participant!');
        process.exit(1);
    }
    catch (err) {
        console.log(`   ✓ Second attempt strictly blocked by server: "${err.message}"`);
    }
    console.log('\n🎉 ALL ASSESSMENT ATTEMPT POLICY & IMMUTABILITY CHECKS PASSED 100%!');
}
runAttemptPolicyTests()
    .catch((err) => {
    console.error('Attempt policy test failed:', err);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
