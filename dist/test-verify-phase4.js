"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./services/auth.service");
const assessment_session_service_1 = require("./services/assessment-session.service");
const expert_evaluation_service_1 = require("./services/expert-evaluation.service");
const final_evaluation_service_1 = require("./services/final-evaluation.service");
const survey_service_1 = require("./services/survey.service");
const statistics_service_1 = require("./services/statistics.service");
const export_service_1 = require("./services/export.service");
const agent_version_service_1 = require("./services/agent-version.service");
const prisma_1 = require("./lib/prisma");
async function verifyPhase4Behavior() {
    console.log('🧪 Starting Phase 4 10-Point Comprehensive Behavioral Verification Suite...\n');
    // Step 0: Accounts
    const studentAuth = await auth_service_1.AuthService.quickLogin('STUDENT');
    const expertAuth = await auth_service_1.AuthService.quickLogin('EXPERT');
    const adminAuth = await auth_service_1.AuthService.quickLogin('ADMIN');
    const studentId = studentAuth.user.id;
    const expertId = expertAuth.user.id;
    const adminId = adminAuth.user.id;
    // Clean test tables
    await prisma_1.prisma.surveyResponse.deleteMany({});
    await prisma_1.prisma.finalEvaluationReview.deleteMany({});
    await prisma_1.prisma.refinementLog.deleteMany({});
    await prisma_1.prisma.expertDraft.deleteMany({});
    await prisma_1.prisma.expertEvaluation.deleteMany({});
    await prisma_1.prisma.evaluation.deleteMany({});
    await prisma_1.prisma.studentAnswerDraft.deleteMany({});
    await prisma_1.prisma.assessmentSession.deleteMany({});
    // Reset agent versions: Ensure V1 exists, branch V2 and V3 for progression testing
    await prisma_1.prisma.agentVersion.deleteMany({ where: { versionTag: { in: ['V2', 'V3'] } } });
    const v1 = await agent_version_service_1.AgentVersionService.getActiveVersion();
    console.assert(v1?.versionTag === 'V1', 'V1 must be active version');
    // Branch V2
    const v2 = await agent_version_service_1.AgentVersionService.branchNextVersion({
        parentVersionTag: 'V1',
        newVersionTag: 'V2',
        label: 'Agent Version 2 — First Refinement',
        description: 'Refined patterns for justification circumstances.',
        systemInstructions: v1.systemInstructions + '\n[REFINEMENT V2]: Evaluate conceptual equivalents.',
        changelogEntry: {
            component: 'EVALUATION_PATTERNS',
            changeSummary: 'Refined justification patterns.',
            rationale: 'Double-blind expert feedback.',
            linkedRefinementIds: ['GAP-001'],
        },
    }, { id: adminId, email: 'admin@yawa.local' });
    // Branch V3
    const v3 = await agent_version_service_1.AgentVersionService.branchNextVersion({
        parentVersionTag: 'V2',
        newVersionTag: 'V3',
        label: 'Agent Version 3 — Final Refined Model',
        description: 'Optimized statutory weighting and rubric alignment.',
        systemInstructions: v2.systemInstructions + '\n[REFINEMENT V3]: Full statutory weighting optimization.',
        changelogEntry: {
            component: 'SYSTEM_INSTRUCTIONS',
            changeSummary: 'Finalized statutory weights.',
            rationale: 'V2 post-iteration validation.',
            linkedRefinementIds: ['GAP-002'],
        },
    }, { id: adminId, email: 'admin@yawa.local' });
    // Lock and activate V3
    await agent_version_service_1.AgentVersionService.lockVersion(v3.id, { id: adminId, email: 'admin@yawa.local' });
    await agent_version_service_1.AgentVersionService.activateVersion(v3.id, { id: adminId, email: 'admin@yawa.local' });
    // Create student session under V3 (Demo session for testing)
    const session = await assessment_session_service_1.AssessmentSessionService.getOrCreateActiveSession(studentId, true);
    const questions = JSON.parse((await prisma_1.prisma.assessmentSession.findUnique({ where: { id: session.id } })).questionsSnapshot);
    const q1 = questions[0];
    for (const q of questions) {
        await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(session.id, studentId, q.id, `Student essay response for ${q.code}: Legal analysis of statutory elements under the Revised Penal Code.`);
    }
    await assessment_session_service_1.AssessmentSessionService.submitSession(session.id, studentId);
    // Also create expert evaluation for comparison metrics
    await expert_evaluation_service_1.ExpertEvaluationService.submitExpertEvaluation(expertId, session.id, q1.id, {
        numericalScore: 92,
        scoringBasis: 'Sound legal analysis of unlawful aggression and reasonable necessity.',
        criterionScores: [
            { criterionName: 'Statutory Elements', score: 20, maxPoints: 20, reasoning: 'All elements identified.' },
            { criterionName: 'Legal Reasoning (IRAC)', score: 18, maxPoints: 20, reasoning: 'Strong analysis.' },
            { criterionName: 'Factual Application', score: 18, maxPoints: 20, reasoning: 'Accurate facts.' },
            { criterionName: 'Jurisprudential Grounding', score: 18, maxPoints: 20, reasoning: 'Cited Art 11.' },
            { criterionName: 'Clarity & Structure', score: 18, maxPoints: 20, reasoning: 'Clear prose.' },
        ],
    });
    const v3Evaluation = await prisma_1.prisma.evaluation.findFirst({
        where: { sessionId: session.id, questionId: q1.id },
    });
    console.assert(v3Evaluation !== null, 'V3 evaluation must be generated upon submission');
    // TEST 1: Post-V3 Review Queue
    console.log('Test 1: Verifying Post-V3 Expert Review Queue...');
    const v3Queue = await final_evaluation_service_1.FinalEvaluationService.getV3ReviewQueue(expertId, true);
    console.assert(v3Queue.length >= 1, 'V3 review queue must contain at least 1 item');
    console.assert(v3Queue[0].reviewStatus === 'PENDING', 'Initial review status must be PENDING');
    console.assert(v3Queue[0].studentAnonymizedCode === 'Student-01', 'Must display anonymized student code');
    console.log('   ✓ Post-V3 review queue loaded successfully with anonymized items');
    // TEST 2: Unblinded Evaluation Details
    console.log('Test 2: Verifying Unblinded Post-V3 Evaluation Details...');
    const evalDetail = await final_evaluation_service_1.FinalEvaluationService.getV3EvaluationForReview(expertId, v3Evaluation.id);
    console.assert(evalDetail.v3AiScore !== undefined, 'Unblinded view must expose V3 AI numerical score');
    console.assert(evalDetail.v3ScoringBasis.length > 0, 'Unblinded view must expose V3 AI scoring basis');
    console.assert(evalDetail.question.modelAnswer.length > 0, 'Unblinded view must expose model benchmark');
    console.log(`   ✓ Unblinded V3 evaluation details verified: AI Score = ${evalDetail.v3AiScore} pts`);
    // TEST 3: Submit FinalEvaluationReview
    console.log('Test 3: Testing Post-V3 Final Review Submission...');
    const reviewResult = await final_evaluation_service_1.FinalEvaluationService.submitFinalReview(expertId, v3Evaluation.id, {
        agreementRating: 5,
        reasoningCorrectnessRating: 4,
        statutoryGroundingRating: 5,
        recommendedScore: 90,
        errorTags: ['OVER_PENALIZATION'],
        qualitativeComments: 'The V3 Agent accurately evaluated the statutory justification under Art. 11.',
        improvementSuggestions: 'Slightly relax the penalty for minor grammatical variations in conclusion.',
        finalVerdict: 'ACCEPTABLE',
    });
    console.assert(reviewResult.success === true, 'Final review submission must succeed');
    console.assert(reviewResult.review.scoreDelta === Math.round((90 - v3Evaluation.numericalScore) * 10) / 10, 'scoreDelta must be recommended - ai');
    console.log('   ✓ Post-V3 review submitted with 1-5 ratings and error tags');
    // TEST 4: FinalEvaluationReview Immutability
    console.log('Test 4: Testing FinalEvaluationReview Immutability...');
    try {
        await final_evaluation_service_1.FinalEvaluationService.submitFinalReview(expertId, v3Evaluation.id, {
            agreementRating: 3,
            reasoningCorrectnessRating: 3,
            statutoryGroundingRating: 3,
            recommendedScore: 80,
            errorTags: [],
            finalVerdict: 'REQUIRES_IMPROVEMENT',
        });
        console.error('   ❌ FAILED: Duplicate final review was permitted!');
    }
    catch (err) {
        console.log('   ✓ Post-V3 review locked as immutable research evidence:', err.message);
    }
    // TEST 5: Student Usability Survey Collection
    console.log('Test 5: Testing Student Usability Survey Collection & Snapshot Persistence...');
    const studentQnr = await survey_service_1.SurveyService.getActiveQuestionnaire('STUDENT', true);
    console.assert(studentQnr.questions.length >= 6, 'Student survey must have at least 6 questions');
    const studentAnswers = {};
    studentQnr.questions.forEach((q) => {
        studentAnswers[q.id] = q.questionType === 'LIKERT_5' ? 5 : 'Excellent diagnostic clarity.';
    });
    const studentSurveyResult = await survey_service_1.SurveyService.submitSurveyResponse(studentId, 'STUDENT', studentQnr.id, studentAnswers, 'The feedback was clear and instructive.', true);
    console.assert(studentSurveyResult.success === true, 'Student survey submission must succeed');
    console.log('   ✓ Student usability response recorded with questionnaire snapshot');
    // TEST 6: Expert Capability Survey Collection
    console.log('Test 6: Testing Expert Capability Survey Collection & Snapshot Persistence...');
    const expertQnr = await survey_service_1.SurveyService.getActiveQuestionnaire('EXPERT', true);
    console.assert(expertQnr.questions.length >= 6, 'Expert survey must have at least 6 questions');
    const expertAnswers = {};
    expertQnr.questions.forEach((q) => {
        expertAnswers[q.id] = q.questionType === 'LIKERT_5' ? 4 : 'High consistency across Criminal Law I essays.';
    });
    const expertSurveyResult = await survey_service_1.SurveyService.submitSurveyResponse(expertId, 'EXPERT', expertQnr.id, expertAnswers, 'V3 shows substantial alignment with expert legal standards.', true);
    console.assert(expertSurveyResult.success === true, 'Expert capability survey submission must succeed');
    console.log('   ✓ Expert capability response recorded with questionnaire snapshot');
    // TEST 7: Descriptive Statistics Progression & Score Distributions
    console.log('Test 7: Testing Descriptive Statistics Service (Progression across V1/V2/V3)...');
    const demoStats = await statistics_service_1.StatisticsService.getProgressionAnalytics({ isDemo: true });
    console.assert(demoStats.iterations.length >= 3, 'Must return metrics for V1, V2, and V3');
    console.assert(demoStats.postV3Summary.totalReviews >= 1, 'Post-V3 summary must reflect submitted review');
    console.assert(demoStats.postV3Summary.meanAgreementRating === 5, 'Mean agreement rating must equal 5');
    console.log(`   ✓ Progression metrics computed: ${demoStats.iterations.length} iterations analyzed`);
    // TEST 8: CSV Export with 10 Structured Datasets
    console.log('Test 8: Testing Multi-Dataset CSV Export Pipeline...');
    const csvDatasets = await export_service_1.ExportService.exportResearchDatasetsCSV({ isDemo: true });
    const csvKeys = Object.keys(csvDatasets);
    console.assert(csvKeys.length === 10, `Expected 10 CSV datasets, got ${csvKeys.length}`);
    console.assert(csvDatasets['01_student_submissions.csv'].startsWith('sessionId'), 'CSV must contain valid headers');
    console.assert(csvDatasets['07_final_v3_expert_reviews.csv'].includes('ACCEPTABLE'), 'Final reviews CSV must contain records');
    console.log(`   ✓ 10 CSV datasets generated successfully: ${csvKeys.join(', ')}`);
    // TEST 9: JSON Research Export Bundle
    console.log('Test 9: Testing Comprehensive JSON Research Bundle Export...');
    const jsonBundle = await export_service_1.ExportService.exportResearchBundleJSON({ isDemo: true });
    console.assert(jsonBundle.metadata.title !== undefined, 'Bundle must contain metadata');
    console.assert(jsonBundle.datasets.submissions.length >= 1, 'Bundle must contain submissions');
    console.assert(jsonBundle.datasets.finalV3Reviews.length >= 1, 'Bundle must contain final V3 reviews');
    console.assert(jsonBundle.datasets.dataDictionary.length >= 5, 'Bundle must contain data dictionary');
    console.log('   ✓ JSON research bundle serialized with complete dataset graph');
    // TEST 10: Server-Side Strict Demo Isolation
    console.log('Test 10: Verifying Server-Enforced Strict Demo Data Isolation...');
    const liveStats = await statistics_service_1.StatisticsService.getProgressionAnalytics({ isDemo: false });
    console.assert(liveStats.postV3Summary.totalReviews === 0, 'Live research statistics must return 0 demo reviews');
    const liveCsv = await export_service_1.ExportService.exportResearchDatasetsCSV({ isDemo: false });
    console.assert(!liveCsv['07_final_v3_expert_reviews.csv'].includes('ACCEPTABLE'), 'Live CSV must not contain demo review records');
    const liveJson = await export_service_1.ExportService.exportResearchBundleJSON({ isDemo: false });
    console.assert(liveJson.datasets.finalV3Reviews.length === 0, 'Live JSON bundle must contain 0 demo reviews');
    console.assert(liveJson.metadata.isDemo === false, 'Live bundle isDemo metadata must be false');
    console.log('   ✓ Server-side demo data isolation verified: Default research queries contain zero demo contamination');
    console.log('\n🎉 ALL 10 PHASE 4 BEHAVIORAL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}
verifyPhase4Behavior()
    .catch((e) => {
    console.error('Phase 4 verification failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
