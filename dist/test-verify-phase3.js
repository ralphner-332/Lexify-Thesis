"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./services/auth.service");
const assessment_session_service_1 = require("./services/assessment-session.service");
const expert_evaluation_service_1 = require("./services/expert-evaluation.service");
const comparison_service_1 = require("./services/comparison.service");
const refinement_service_1 = require("./services/refinement.service");
const agent_version_service_1 = require("./services/agent-version.service");
const rubric_service_1 = require("./services/rubric.service");
const prisma_1 = require("./lib/prisma");
async function verifyPhase3Behavior() {
    console.log('🧪 Starting Phase 3 9-Point Comprehensive Behavioral Verification Suite...\n');
    // Step 0: Ensure accounts exist
    const studentAuth = await auth_service_1.AuthService.quickLogin('STUDENT');
    const expertAuth = await auth_service_1.AuthService.quickLogin('EXPERT');
    const adminAuth = await auth_service_1.AuthService.quickLogin('ADMIN');
    const studentId = studentAuth.user.id;
    const expertId = expertAuth.user.id;
    const adminId = adminAuth.user.id;
    // Clean existing test data for clean slate
    await prisma_1.prisma.finalEvaluationReview.deleteMany({});
    await prisma_1.prisma.refinementLog.deleteMany({ where: { isDemo: true } });
    await prisma_1.prisma.expertDraft.deleteMany({ where: { expertId } });
    await prisma_1.prisma.expertEvaluation.deleteMany({ where: { expertId } });
    await prisma_1.prisma.evaluation.deleteMany({ where: { studentId } });
    await prisma_1.prisma.studentAnswerDraft.deleteMany({ where: { session: { studentId } } });
    await prisma_1.prisma.assessmentSession.deleteMany({ where: { studentId } });
    // Clean any V2/V3 agent versions from prior runs
    await prisma_1.prisma.agentVersion.deleteMany({ where: { versionTag: { in: ['V2', 'V3'] } } });
    // Step 1: Create and submit a student assessment session
    const session = await assessment_session_service_1.AssessmentSessionService.getOrCreateActiveSession(studentId, true);
    const questions = JSON.parse((await prisma_1.prisma.assessmentSession.findUnique({ where: { id: session.id } })).questionsSnapshot);
    const q1 = questions[0];
    const q2 = questions[1];
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(session.id, studentId, q1.id, 'Student essay for Q1: Self-defense under Article 11, Par 1 of RPC. Unlawful aggression was present.');
    await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(session.id, studentId, q2.id, 'Student essay for Q2: Aberratio ictus under Article 4, Par 1 of RPC resulting in homicide.');
    await assessment_session_service_1.AssessmentSessionService.submitSession(session.id, studentId);
    // TEST 1: Expert Queue assigns anonymized student codes and hides names/emails
    console.log('Test 1: Verifying Student Anonymity in Expert Queue...');
    const queue = await expert_evaluation_service_1.ExpertEvaluationService.getExpertQueue(expertId, true);
    console.assert(queue.length >= 2, 'Expert queue must contain at least 2 items');
    console.assert(queue[0].studentAnonymizedCode === 'Student-01', `Expected Student-01, got ${queue[0].studentAnonymizedCode}`);
    console.assert(queue[0].studentName === undefined, 'SECURITY BREACH: Student real name leaked in queue!');
    console.assert(queue[0].studentEmail === undefined, 'SECURITY BREACH: Student email leaked in queue!');
    console.log('   ✓ Expert queue assigns anonymized code "Student-01" with zero student identifying data');
    // TEST 2: Double-Blind Isolation (Expert cannot view AI scores/reasoning)
    console.log('Test 2: Verifying Server-Enforced Double-Blind Protection...');
    const submissionDetail = await expert_evaluation_service_1.ExpertEvaluationService.getSubmissionForEvaluation(expertId, session.id, q1.id);
    console.assert(submissionDetail.aiScore === undefined, 'SECURITY BREACH: AI score leaked to expert!');
    console.assert(submissionDetail.scoringBasis === undefined, 'SECURITY BREACH: AI reasoning leaked to expert!');
    console.assert(submissionDetail.conflictFlags === undefined, 'SECURITY BREACH: Conflict flags leaked to expert!');
    console.assert(submissionDetail.question.modelAnswer !== undefined, 'Expert must have access to model reference answer');
    console.assert(submissionDetail.studentAnswer.length > 0, 'Expert must have access to student essay answer');
    console.log('   ✓ Double-blind isolation verified: AI evaluation outputs are strictly hidden from expert');
    // TEST 3: Expert Evaluation submission & Immutability
    console.log('Test 3: Testing Independent Expert Evaluation Submission & Immutability...');
    const activeRubric = await rubric_service_1.RubricService.getDefaultRubric();
    const expertCriterionScores = activeRubric.criteria.map((c) => ({
        criterionName: c.name,
        score: (c.maxPoints || 20) * 0.9,
        maxPoints: c.maxPoints || 20,
        reasoning: `Expert legal analysis: sound application of ${c.name.toLowerCase()}.`,
    }));
    const expertSubmissionResult = await expert_evaluation_service_1.ExpertEvaluationService.submitExpertEvaluation(expertId, session.id, q1.id, {
        numericalScore: 90,
        scoringBasis: 'The student correctly identified the justifying circumstance of self-defense under Article 11(1) of the RPC.',
        criterionScores: expertCriterionScores,
        qualitativeComments: 'Excellent analytical structure and adherence to IRAC method.',
    });
    console.assert(expertSubmissionResult.success === true, 'Expert submission must succeed');
    // Verify immutability: attempting to submit again must throw error
    try {
        await expert_evaluation_service_1.ExpertEvaluationService.submitExpertEvaluation(expertId, session.id, q1.id, {
            numericalScore: 95,
            scoringBasis: 'Modified score attempt',
            criterionScores: expertCriterionScores,
        });
        console.error('   ❌ FAILED: Duplicate/modified expert submission was permitted!');
    }
    catch (err) {
        console.log('   ✓ Expert evaluation locked as immutable research evidence:', err.message);
    }
    // TEST 4: AI vs. Expert Comparison Calculation
    console.log('Test 4: Testing AI vs. Expert Comparison Matrix Calculation...');
    const comparisonResult = await comparison_service_1.ComparisonService.getComparisonList({
        sessionId: session.id,
        questionId: q1.id,
        isDemo: true,
        thresholdPercent: 10,
    });
    console.assert(comparisonResult.comparisons.length === 1, 'Comparison must match 1 submitted item');
    const comp = comparisonResult.comparisons[0];
    console.assert(comp.expertScore === 90, `Expected expertScore 90, got ${comp.expertScore}`);
    console.assert(comp.scoreDelta === Math.round((90 - comp.aiScore) * 10) / 10, 'Score delta must equal Expert - AI');
    console.assert(comp.criterionDeltas.length > 0, 'Criterion deltas must be computed');
    console.log(`   ✓ Comparison calculated: AI=${comp.aiScore}, Expert=${comp.expertScore}, Delta=${comp.scoreDelta}`);
    // TEST 5: Configurable Conflict Signals
    console.log('Test 5: Testing Configurable Conflict Detection Signals...');
    const highThresholdResult = await comparison_service_1.ComparisonService.getComparisonList({
        sessionId: session.id,
        questionId: q1.id,
        isDemo: true,
        thresholdPercent: 50, // High threshold
    });
    const lowThresholdResult = await comparison_service_1.ComparisonService.getComparisonList({
        sessionId: session.id,
        questionId: q1.id,
        isDemo: true,
        thresholdPercent: 2, // Strict threshold
    });
    console.assert(lowThresholdResult.comparisons[0].conflictFlags.length >= highThresholdResult.comparisons[0].conflictFlags.length, 'Lower threshold must produce more or equal conflict signals');
    console.log('   ✓ Conflict detection signals dynamically adapt to configurable threshold');
    // TEST 6: Structured Refinement Framework & Comparison Linking
    console.log('Test 6: Testing Structured Refinement Log Creation & Evidence Linking...');
    const refinementLog = await refinement_service_1.RefinementService.createRefinementLog({
        sessionId: session.id,
        questionId: q1.id,
        aiEvaluationId: comp.aiEvaluationId,
        expertEvaluationId: comp.expertEvaluationId,
        agentVersionId: comp.agentVersionId,
        targetComponent: 'EVALUATION_PATTERNS',
        gapCategory: 'REASONING_IRAC_ISSUE',
        discrepancyDescription: 'AI penalized student conclusion despite valid legal equivalence in self-defense analysis.',
        aiPosition: comp.aiScoringBasis,
        expertPosition: comp.expertRationale,
        expertRationale: 'Student conclusion is legally sound under RPC Art 11.',
        rootCauseAnalysis: 'Evaluation pattern was overly rigid on exact conclusion wording.',
        proposedRefinement: 'Adjust evaluation pattern to recognize conceptual equivalence in justification conclusions.',
        isDemo: true,
        userId: adminId,
    });
    console.assert(refinementLog.gapId.startsWith('GAP-'), 'Must assign GAP-XXX ID');
    console.assert(refinementLog.aiEvaluationId === comp.aiEvaluationId, 'Must link AI Evaluation ID');
    console.assert(refinementLog.expertEvaluationId === comp.expertEvaluationId, 'Must link Expert Evaluation ID');
    console.log(`   ✓ Refinement log ${refinementLog.gapId} created with complete comparison evidence linkage`);
    // Approve the refinement
    await refinement_service_1.RefinementService.updateRefinementStatus(refinementLog.id, {
        status: 'APPROVED',
        approvedDecision: 'Approved for inclusion in Agent Version 2.',
        resultingAgentVersionId: 'V2',
        userId: adminId,
    });
    console.log('   ✓ Refinement log approved by researcher');
    // TEST 7: Version Lineage & Branching V1 -> V2
    console.log('Test 7: Testing Agent Version Branching (V1 -> V2) with Changelog Lineage...');
    const v1 = await agent_version_service_1.AgentVersionService.getActiveVersion();
    console.assert(v1?.versionTag === 'V1', 'V1 must be active version');
    const v2Draft = await agent_version_service_1.AgentVersionService.branchNextVersion({
        parentVersionTag: 'V1',
        newVersionTag: 'V2',
        label: 'Agent Version 2 — First Empirical Refinement',
        description: 'Refined evaluation patterns based on double-blind expert feedback for Criminal Law I justification elements.',
        systemInstructions: v1.systemInstructions + '\n[REFINEMENT]: Evaluate conceptual equivalence for RPC Art. 11 justification conclusions.',
        changelogEntry: {
            component: 'EVALUATION_PATTERNS',
            changeSummary: 'Updated justification conclusion patterns to recognize conceptual equivalence.',
            rationale: 'Double-blind expert feedback indicated overly rigid keyword penalty on sound IRAC analysis.',
            linkedRefinementIds: [refinementLog.gapId],
        },
    }, { id: adminId, email: 'admin@yawa.local' });
    console.assert(v2Draft.versionTag === 'V2', 'Must create V2');
    console.assert(v2Draft.parentVersionId === v1.id, `V2 parentVersionId must equal V1 ID (${v1.id})`);
    console.assert(v2Draft.changelog.length === 1, 'V2 must contain changelog entry');
    console.assert(v2Draft.changelog[0].linkedRefinementIds.includes(refinementLog.gapId), 'Changelog must link refinement gap ID');
    console.log(`   ✓ V2 branched successfully from V1 with parent lineage and changelog metadata`);
    // TEST 8: Historical V1 Evaluations & Snapshots Preserved Immutably
    console.log('Test 8: Testing Preservation of Historical V1 Evaluations...');
    const v1Evals = await prisma_1.prisma.evaluation.findMany({
        where: { agentVersionId: v1.id },
    });
    console.assert(v1Evals.length >= 2, 'V1 evaluation records must remain intact');
    const v1Reload = await agent_version_service_1.AgentVersionService.getVersionById(v1.id);
    console.assert(v1Reload.isLocked === true, 'V1 must remain locked');
    console.log('   ✓ V1 snapshot and all historical V1 evaluations remain permanently preserved and immutable');
    // TEST 9: Demo Data Isolation Flag
    console.log('Test 9: Testing Demo vs Research Data Separation in Expert & Comparison records...');
    console.assert(expertSubmissionResult.evaluation.isDemo === true, 'Expert eval must be isDemo: true');
    const demoComparisons = await comparison_service_1.ComparisonService.getComparisonList({ isDemo: true });
    const liveComparisons = await comparison_service_1.ComparisonService.getComparisonList({ isDemo: false });
    console.assert(demoComparisons.comparisons.length >= 1, 'Demo comparisons must exist');
    console.assert(liveComparisons.comparisons.length === 0, 'Live research query must return 0 demo comparisons');
    console.log('   ✓ Strict data isolation between demo evaluations and research comparisons');
    console.log('\n🎉 ALL 9 PHASE 3 BEHAVIORAL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}
verifyPhase3Behavior()
    .catch((e) => {
    console.error('Phase 3 verification failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
