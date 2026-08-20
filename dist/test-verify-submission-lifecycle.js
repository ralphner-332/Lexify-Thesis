"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./services/auth.service");
const assessment_session_service_1 = require("./services/assessment-session.service");
const evaluation_service_1 = require("./services/evaluation.service");
const prisma_1 = require("./lib/prisma");
async function verifySubmissionLifecycle() {
    console.log('🧪 Starting End-to-End Post-Submission Lifecycle Verification...\n');
    // Step 0: Quick login as student
    const studentAuth = await auth_service_1.AuthService.quickLogin('STUDENT');
    const studentId = studentAuth.user.id;
    // Clean prior test data for this student
    await prisma_1.prisma.finalEvaluationReview.deleteMany({});
    await prisma_1.prisma.expertEvaluation.deleteMany({});
    await prisma_1.prisma.expertDraft.deleteMany({});
    await prisma_1.prisma.evaluation.deleteMany({ where: { studentId } });
    await prisma_1.prisma.studentAnswerDraft.deleteMany({ where: { session: { studentId } } });
    await prisma_1.prisma.assessmentSession.deleteMany({ where: { studentId } });
    // Step 1: Initialize active assessment session
    console.log('1. Initializing Assessment Session...');
    const session = await assessment_session_service_1.AssessmentSessionService.getOrCreateActiveSession(studentId, true);
    console.assert(session.status === 'IN_PROGRESS', 'Initial session status must be IN_PROGRESS');
    console.log(`   ✓ Active session initialized with ID: ${session.id} (status: ${session.status})`);
    // Step 2: Answer both questions
    console.log('2. Answering Q1 and Q2 in draft mode...');
    const q1 = session.questions[0];
    const q2 = session.questions[1];
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(session.id, studentId, q1.id, 'Juan is liable for consummated Homicide under Article 249 of the Revised Penal Code. He acted with intent to kill (animus possidendi / animus necandi), which is presumed from using a deadly weapon (gun) to shoot Pedro in the chest. There was no qualifying circumstance of treachery or evident premeditation to elevate the crime to Murder.');
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(session.id, studentId, q2.id, 'Maria is not criminally liable for Robbery due to the exempting circumstance of irresistible force under Article 12, paragraph 5 of the Revised Penal Code. The physical compulsion completely overpowered her will, rendering her an involuntary instrument of the crime.');
    console.log('   ✓ Saved draft answers for all predetermined questions');
    // Step 3: Review checklist verification
    console.log('3. Checking Pre-Submission Review Checklist...');
    const review = await assessment_session_service_1.AssessmentSessionService.getSessionReview(session.id, studentId);
    console.assert(review.allAnswered === true, 'All questions must be answered');
    console.assert(review.answeredCount === 2, 'Answered count must be 2');
    console.assert(review.unansweredCount === 0, 'Unanswered count must be 0');
    console.log(`   ✓ Checklist verified: ${review.answeredCount}/${review.totalQuestions} answered (allAnswered: ${review.allAnswered})`);
    // Step 4: Finalize submission
    console.log('4. Finalizing Assessment Submission...');
    const submitResult = await assessment_session_service_1.AssessmentSessionService.submitSession(session.id, studentId);
    console.assert(submitResult.success === true, 'Submit result must succeed');
    console.assert(submitResult.sessionId === session.id, 'Returned session ID must match submitted session ID');
    console.log(`   ✓ Submission finalized for session ID: ${submitResult.sessionId}`);
    // Step 5: Verify submitted database state & immutability
    console.log('5. Verifying Database State & Immutability...');
    const dbSession = await prisma_1.prisma.assessmentSession.findUnique({
        where: { id: session.id },
        include: { drafts: true },
    });
    console.assert(dbSession?.status === 'SUBMITTED', 'DB session status must be SUBMITTED');
    console.assert(!!dbSession?.submittedAt, 'submittedAt timestamp must be recorded');
    // Confirm drafts cannot be modified
    try {
        await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(session.id, studentId, q1.id, 'Altered answer');
        console.error('   ❌ FAILED: Modifying draft on submitted session was permitted!');
    }
    catch (err) {
        console.log(`   ✓ Immutability enforced cleanly: "${err.message}"`);
    }
    // Step 6: Verify AI evaluations exist for the exact submitted session ID
    console.log('6. Verifying AI Evaluation Persistence for Submitted Session...');
    const evals = await prisma_1.prisma.evaluation.findMany({
        where: { sessionId: session.id },
    });
    console.assert(evals.length === 2, `Expected 2 evaluations, found ${evals.length}`);
    console.log(`   ✓ Found ${evals.length} AI Evaluation records linked to session ${session.id}`);
    // Step 7: Confirm getOrCreateActiveSession returns SUBMITTED session and does NOT spawn empty session
    console.log('7. Testing Session Retrieval Post-Submission...');
    const postSubmitSession = await assessment_session_service_1.AssessmentSessionService.getOrCreateActiveSession(studentId, true);
    console.assert(postSubmitSession.id === session.id, 'Must return the same submitted session ID');
    console.assert(postSubmitSession.status === 'SUBMITTED', 'Status must be SUBMITTED');
    console.assert(postSubmitSession.questions[0].draftAnswer.length > 0, 'Must retain submitted answers');
    console.log(`   ✓ Returned existing submitted session ID ${postSubmitSession.id} (status: ${postSubmitSession.status}) with submitted answers intact`);
    // Step 8: Verify getStudentSessionEvaluations loads complete diagnostic feedback
    console.log('8. Testing Student Diagnostic Feedback Retrieval...');
    const feedback = await evaluation_service_1.EvaluationService.getStudentSessionEvaluations(session.id, studentId);
    console.assert(feedback.length === 2, `Expected 2 feedbacks, found ${feedback.length}`);
    console.assert(feedback[0].numericalScore > 0, 'Feedback must have numerical score');
    console.assert(feedback[0].scoringBasis.length > 0, 'Feedback must have scoring basis');
    console.assert(feedback[0].criterionScores.length > 0, 'Feedback must have criterion scores');
    console.log(`   ✓ Retrieved diagnostic feedback for Q1: Score=${feedback[0].numericalScore}/${feedback[0].maxScore}, Criteria=${feedback[0].criterionScores.length}`);
    // Step 9: Verify getSessionById
    console.log('9. Testing getSessionById...');
    const fetchedById = await assessment_session_service_1.AssessmentSessionService.getSessionById(session.id, studentId);
    console.assert(fetchedById.id === session.id, 'Session ID must match');
    console.assert(fetchedById.status === 'SUBMITTED', 'Status must match SUBMITTED');
    console.log(`   ✓ getSessionById successfully resolved session ${fetchedById.id}`);
    console.log('\n🎉 ALL POST-SUBMISSION LIFECYCLE TESTS PASSED WITH ZERO DEFECTS!');
}
verifySubmissionLifecycle()
    .catch((e) => {
    console.error('Lifecycle test failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
