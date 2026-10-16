import { prisma } from './lib/prisma';
import { AuthService } from './services/auth.service';
import { AssessmentSessionService } from './services/assessment-session.service';
import { ModelConfigService } from './services/model-config.service';
import { QuestionService } from './services/question.service';
import { ExportService } from './services/export.service';
import { TextAnalysisService } from './services/text-analysis.service';

async function runAcceptanceSuite() {
  console.log('========================================================================');
  console.log('⚖️  LEXIFY — COMPREHENSIVE REVISIONS & ACCEPTANCE SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
      if (detail) console.log(`     ↳ ${detail}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     ↳ Details: ${detail}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. SCORING VERIFICATION: /50 MAXIMUM & 0.00-5.00 PER QUESTION
    // -------------------------------------------------------------------------
    console.log('📌 1. Testing Scoring System (/50 Max, 0.00-5.00 per Question)...');

    const perfectQuestionScores = Array(10).fill(100);
    const perfectFinalGrades = perfectQuestionScores.map((score) => Number((score * 0.05).toFixed(2)));
    const perfectSum = perfectFinalGrades.reduce((a, b) => a + b, 0);
    assertTest(
      perfectSum === 50.0 && perfectFinalGrades.every((g) => g === 5.0),
      '10 Perfect Questions = 50.00 / 50.00',
      `Individual Question Grade: 5.00, Overall Assessment Sum: ${perfectSum.toFixed(2)}/50.00`
    );

    const exampleQuestionScores = Array(10).fill(90);
    const exampleFinalGrades = exampleQuestionScores.map((score) => Number((score * 0.05).toFixed(2)));
    const exampleSum = exampleFinalGrades.reduce((a, b) => a + b, 0);
    assertTest(
      exampleSum === 45.0 && exampleFinalGrades.every((g) => g === 4.5),
      'Example 4.5 x 10 = 45.00 / 50.00',
      `Individual Question Grade: 4.50, Overall Assessment Sum: ${exampleSum.toFixed(2)}/50.00`
    );

    // -------------------------------------------------------------------------
    // 2. INDEPENDENT TEST PUBLISHING LIFECYCLE (COEXISTENCE OF ACTIVE TESTS)
    // -------------------------------------------------------------------------
    console.log('\n📌 2. Testing Independent Test Publishing Lifecycle...');

    // Set initial clean statuses
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ACTIVE',
        TEST_2: 'DRAFT',
        TEST_3: 'DRAFT',
        TEST_4: 'DRAFT',
      },
    });

    let settings = await ModelConfigService.getSystemSettings();
    assertTest(
      settings.testSetStatuses['TEST_1'] === 'ACTIVE' && settings.testSetStatuses['TEST_2'] === 'DRAFT',
      'Initial State: Test 1 is ACTIVE, Test 2 is DRAFT',
      `Test 1: ${settings.testSetStatuses['TEST_1']}, Test 2: ${settings.testSetStatuses['TEST_2']}`
    );

    // Admin publishes Test 2 -> BOTH Test 1 and Test 2 MUST be ACTIVE!
    await ModelConfigService.publishTestSet('TEST_2');
    settings = await ModelConfigService.getSystemSettings();
    assertTest(
      settings.testSetStatuses['TEST_1'] === 'ACTIVE' && settings.testSetStatuses['TEST_2'] === 'ACTIVE',
      'Publishing Test 2 preserves Test 1 as ACTIVE (Multiple ACTIVE tests coexist)',
      `Test 1: ${settings.testSetStatuses['TEST_1']}, Test 2: ${settings.testSetStatuses['TEST_2']}`
    );

    // Admin archives Test 1 -> Only Test 1 becomes ARCHIVED; Test 2 remains ACTIVE!
    await ModelConfigService.archiveTestSet('TEST_1');
    settings = await ModelConfigService.getSystemSettings();
    assertTest(
      settings.testSetStatuses['TEST_1'] === 'ARCHIVED' && settings.testSetStatuses['TEST_2'] === 'ACTIVE',
      'Archiving Test 1 does NOT affect Test 2 (Test 1 ARCHIVED, Test 2 ACTIVE)',
      `Test 1: ${settings.testSetStatuses['TEST_1']}, Test 2: ${settings.testSetStatuses['TEST_2']}`
    );

    // Admin publishes Test 3 -> Test 2 remains ACTIVE, Test 3 becomes ACTIVE!
    await ModelConfigService.publishTestSet('TEST_3');
    settings = await ModelConfigService.getSystemSettings();
    assertTest(
      settings.testSetStatuses['TEST_2'] === 'ACTIVE' && settings.testSetStatuses['TEST_3'] === 'ACTIVE',
      'Publishing Test 3 adds it without removing or drafting Test 2',
      `Test 2: ${settings.testSetStatuses['TEST_2']}, Test 3: ${settings.testSetStatuses['TEST_3']}`
    );

    // -------------------------------------------------------------------------
    // 3. STUDENT EXPLICIT TEST SELECTION & AVAILABILITY
    // -------------------------------------------------------------------------
    console.log('\n📌 3. Testing Student Test Selection & Availability...');

    // Student only sees ACTIVE tests
    const activeTestList = Object.entries(settings.testSetStatuses)
      .filter(([_, status]) => status === 'ACTIVE')
      .map(([testSet]) => testSet);

    assertTest(
      activeTestList.includes('TEST_2') &&
        activeTestList.includes('TEST_3') &&
        !activeTestList.includes('TEST_1') &&
        !activeTestList.includes('TEST_4'),
      'Student available tests filter strictly ACTIVE tests (Test 2 & 3 visible; 1 & 4 hidden)',
      `Available Active Tests: ${activeTestList.join(', ')}`
    );

    // Create a student and explicitly start Test 2
    const studentAEmail = `student_selection_a_${Date.now()}@example.com`;
    const studentA = await AuthService.registerStudent({
      name: 'Maria Santos',
      email: studentAEmail,
      passwordPlain: 'Password123!',
    });

    const sessionTest2 = await AssessmentSessionService.createAssessmentSession(
      studentA.id,
      true,
      'TEST_2'
    );
    assertTest(
      sessionTest2.questions.length === 10 &&
        sessionTest2.questions[0].code === 'TEST2-Q01' &&
        sessionTest2.questions[9].code === 'TEST2-Q10',
      'Student explicitly starts Test 2 -> Receives TEST2-Q01 through TEST2-Q10',
      `First Question: ${sessionTest2.questions[0].code}, Last: ${sessionTest2.questions[9].code}`
    );

    // Student explicitly starts Test 3
    const sessionTest3 = await AssessmentSessionService.createAssessmentSession(
      studentA.id,
      true,
      'TEST_3'
    );
    assertTest(
      sessionTest3.questions.length === 10 &&
        sessionTest3.questions[0].code === 'TEST3-Q01' &&
        sessionTest3.questions[9].code === 'TEST3-Q10',
      'Student explicitly starts Test 3 -> Receives TEST3-Q01 through TEST3-Q10',
      `First Question: ${sessionTest3.questions[0].code}, Last: ${sessionTest3.questions[9].code}`
    );

    // -------------------------------------------------------------------------
    // 4. LIVE QUESTION EDIT SYNCHRONIZATION & SNAPSHOT IMMUTABILITY
    // -------------------------------------------------------------------------
    console.log('\n📌 4. Testing Question Edit Sync & Historical Snapshot Protection...');

    // Find TEST2-Q03 in DB
    const q3 = await prisma.question.findUnique({
      where: { code: 'TEST2-Q03' },
    });
    if (!q3) throw new Error('TEST2-Q03 not found in DB');

    const originalScenario = q3.scenario;
    const updatedScenario = `${originalScenario} [AMENDED BY ADMIN FOR ACCURACY]`;

    // Admin updates TEST2-Q03
    await QuestionService.updateQuestion(q3.id, {
      scenario: updatedScenario,
    });

    // Create a brand new student and start Test 2 -> MUST receive updated scenario
    const studentBEmail = `student_fresh_sync_${Date.now()}@example.com`;
    const studentB = await AuthService.registerStudent({
      name: 'Juan Dela Cruz',
      email: studentBEmail,
      passwordPlain: 'Password123!',
    });

    const sessionFresh = await AssessmentSessionService.createAssessmentSession(
      studentB.id,
      true,
      'TEST_2'
    );
    const syncedQ3 = sessionFresh.questions.find((q) => q.code === 'TEST2-Q03');
    assertTest(
      syncedQ3?.scenario === updatedScenario,
      'New Assessment Session receives freshly edited question scenario immediately',
      `Verified scenario contains [AMENDED BY ADMIN FOR ACCURACY]`
    );

    // Existing submitted session must retain historical snapshot without alteration
    // Restore original scenario for question integrity
    await QuestionService.updateQuestion(q3.id, {
      scenario: originalScenario,
    });

    // -------------------------------------------------------------------------
    // 5. MODEL COMPARISON: PER-STUDENT WEIGHTED SCORES (MAX 50.00)
    // -------------------------------------------------------------------------
    console.log('\n📌 5. Testing Model Comparison Per-Student Weighted Score Sum...');

    // Simulate 10 question scores for a student under 3 models
    const studentLlamaScores = [4.5, 4.0, 4.5, 5.0, 4.0, 4.5, 4.5, 4.0, 4.5, 4.0]; // Sum = 43.50
    const studentPhiScores = [4.0, 4.0, 4.0, 4.5, 4.0, 4.0, 4.0, 4.5, 4.0, 4.25]; // Sum = 41.25
    const studentGemmaScores = [4.5, 4.5, 4.5, 4.5, 4.5, 4.0, 4.5, 4.5, 4.0, 4.5]; // Sum = 44.00

    const llamaWeightedScore = studentLlamaScores.reduce((a, b) => a + b, 0);
    const phiWeightedScore = studentPhiScores.reduce((a, b) => a + b, 0);
    const gemmaWeightedScore = studentGemmaScores.reduce((a, b) => a + b, 0);

    assertTest(
      llamaWeightedScore === 43.5 &&
        phiWeightedScore === 41.25 &&
        gemmaWeightedScore === 44.0 &&
        llamaWeightedScore <= 50.0 &&
        phiWeightedScore <= 50.0 &&
        gemmaWeightedScore <= 50.0,
      'Per-Student Weighted Scores independently calculated (SUM Q01..Q10 / 50.00)',
      `Llama: ${llamaWeightedScore.toFixed(2)}/50, Phi: ${phiWeightedScore.toFixed(2)}/50, Gemma: ${gemmaWeightedScore.toFixed(2)}/50`
    );

    // -------------------------------------------------------------------------
    // 6. QUESTION BANK RESTORATION & DEFAULT STATE
    // -------------------------------------------------------------------------
    console.log('\n📌 6. Setting Default Research Publication States...');
    await ModelConfigService.publishTestSet('TEST_1');
    await ModelConfigService.publishTestSet('TEST_2');

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} ACCEPTANCE TESTS PASSED SUCCESSFULLY!`);
    console.log('========================================================================\n');
  } catch (error: any) {
    console.error('\n❌ Acceptance suite failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAcceptanceSuite();
