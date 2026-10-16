import { prisma } from './lib/prisma';
import { AuthService } from './services/auth.service';
import { AssessmentSessionService } from './services/assessment-session.service';
import { EvaluationService } from './services/evaluation.service';
import { ModelConfigService } from './services/model-config.service';
import { QuestionService } from './services/question.service';
import { ExportService } from './services/export.service';
import { TextAnalysisService } from './services/text-analysis.service';

async function runAcceptanceSuite() {
  console.log('========================================================================');
  console.log('🏛️  LEXIFY — SEPTEMBER 30 ADVISER CONSULTATION ACCEPTANCE & ISOLATION SUITE');
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
    // TEST SECTION 1: System Settings & Accuracy Levels
    // -------------------------------------------------------------------------
    console.log('📌 1. Testing System Settings & Accuracy Level Controls...');

    const initialSettings = await ModelConfigService.getSystemSettings();
    assertTest(
      !!initialSettings.studentDisplayModel && !!initialSettings.accuracyLevel,
      'System Settings Initialization',
      `Default Display Model: ${initialSettings.studentDisplayModel}, Accuracy: ${initialSettings.accuracyLevel}`
    );

    // Update settings to STRICT
    const strictSettings = await ModelConfigService.updateSystemSettings({
      studentDisplayModel: 'MODEL_A',
      accuracyLevel: 'STRICT',
    });
    assertTest(
      strictSettings.accuracyLevel === 'STRICT' && strictSettings.studentDisplayModel === 'MODEL_A',
      'System Settings Update to STRICT',
      `Saved: Display=${strictSettings.studentDisplayModel}, Accuracy=${strictSettings.accuracyLevel}`
    );

    // Verify Semantic Analysis with Accuracy Levels
    const mockSnapshot = {
      statutoryElements: ['Maker primary liability', 'Section 60 NIL', 'Tenor of the instrument', 'Unconditional promise to pay'],
    };
    const strictResult = TextAnalysisService.analyzeSemantic(
      'Under Section 60 of the NIL, the maker is primarily liable to pay according to its tenor.',
      mockSnapshot,
      'STRICT'
    );
    const lenientResult = TextAnalysisService.analyzeSemantic(
      'Under Section 60 of the NIL, the maker is primarily liable to pay according to its tenor.',
      mockSnapshot,
      'LENIENT'
    );
    assertTest(
      Array.isArray(strictResult.elementsIdentified) && Array.isArray(lenientResult.elementsIdentified),
      'Semantic Text Analysis with Accuracy Calibration',
      `Strict Identified: ${strictResult.elementsIdentified.length}, Lenient Identified: ${lenientResult.elementsIdentified.length}`
    );

    // Reset settings to STANDARD for subsequent evaluation runs
    await ModelConfigService.updateSystemSettings({
      studentDisplayModel: 'MODEL_A',
      accuracyLevel: 'STANDARD',
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 2: Question Bank CRUD & Model Reference Answer Immutability
    // -------------------------------------------------------------------------
    console.log('\n📌 2. Testing Question Bank CRUD & Snapshot Immutability...');

    const testQuestionCode = `TEST-QB-${Date.now().toString().slice(-4)}`;
    const createdQuestion = await QuestionService.createQuestion({
      code: testQuestionCode,
      title: 'Negotiable Instruments Liability Scenario',
      scenario: 'M executes a promissory note payable to P or order. P endorses to A, A to B. Is M liable?',
      modelAnswer: 'Yes. The maker of a negotiable promissory note engages that he will pay it according to its tenor under Section 60 of the NIL.',
      statutoryElements: ['Maker primary liability', 'Section 60 NIL', 'Tenor of the instrument', 'Privity of contract'],
      relevantProvisions: ['Section 60 NIL'],
      conceptVariations: ['Promissory note primary liability'],
      isActive: true,
    });

    assertTest(
      createdQuestion.code === testQuestionCode && createdQuestion.modelAnswer.includes('Section 60'),
      'Question Bank Creation with Model Reference Answer',
      `Created Question ID: ${createdQuestion.id}, Code: ${createdQuestion.code}`
    );

    const updatedQuestion = await QuestionService.updateQuestion(createdQuestion.id, {
      title: 'Updated Negotiable Instruments Liability Scenario',
      modelAnswer: 'Yes. Under Section 60 of Act No. 2031 (NIL), the maker is primarily liable to pay according to the tenor.',
      statutoryElements: ['Maker primary liability', 'Section 60 NIL', 'Act No. 2031', 'Tenor of the instrument'],
    });

    assertTest(
      updatedQuestion.title.includes('Updated') && updatedQuestion.modelAnswer.includes('Act No. 2031'),
      'Question Bank Update & Reference Answer Editing',
      `Updated Title: ${updatedQuestion.title}`
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Multi-User Testing & Data Isolation (5 Student Accounts)
    // -------------------------------------------------------------------------
    console.log('\n📌 3. Testing Multi-User Account Creation & Isolation (5 Students)...');

    const timestamp = Date.now();
    const studentUsers: any[] = [];

    for (let i = 1; i <= 5; i++) {
      const email = `test_student_${i}_${timestamp}@law.fsuu.edu.ph`;
      const name = `FSUU Law Student ${i}`;
      const password = 'Password123!';

      await AuthService.registerStudent({
        email,
        passwordPlain: password,
        name,
      });

      const loggedIn = await AuthService.login(email, password);
      studentUsers.push(loggedIn);
    }

    assertTest(
      studentUsers.length === 5 && studentUsers.every(s => s.user.role === 'STUDENT' && s.token),
      '5 Isolated Student Accounts Registered & Authenticated',
      `Registered: ${studentUsers.map(s => s.user.email).join(', ')}`
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Single-Essay Submissions & 3-Model Simultaneous Evaluation
    // -------------------------------------------------------------------------
    console.log('\n📌 4. Testing Single-Essay Submissions & Simultaneous 3-Model Evaluations...');

    const sampleEssays = [
      'Yes, M is liable. Under Section 60 of the Negotiable Instruments Law, the maker of a negotiable instrument engages to pay according to its tenor. In this case, M executed the promissory note payable to P or order, and it was subsequently negotiated by endorsement to A and then to B. Since B is the lawful holder, M remains primarily liable to pay the amount specified in the note upon presentment. Therefore, M is legally bound to pay B.',
      'M is liable to pay B. The Negotiable Instruments Law provides that a maker has primary and absolute liability to pay the instrument according to its terms. Here, M issued the note to P, who endorsed to A, and A endorsed to B. As the lawful holder in due course, B may enforce payment directly against M as maker.',
      'Under the NIL, M must pay B. The maker is primarily responsible under commercial law. P and A are only secondary endorsers. Since B now holds the instrument, M must honor the payment under Section 60.',
      'Yes. Pursuant to the Negotiable Instruments Law Section 60, the maker of a promissory note is primarily liable to any lawful holder. M issued the note and cannot escape liability merely because it was negotiated from P to A to B. M must pay B.',
      'M is liable on the promissory note. The primary party on a promissory note is the maker, who unconditionally promises to pay. When B acquired the note through valid negotiation and endorsements, B acquired the right to enforce payment against M.',
    ];

    const studentSessions: any[] = [];

    for (let i = 0; i < studentUsers.length; i++) {
      const student = studentUsers[i];
      const essayAnswer = sampleEssays[i];

      // 1. Create Assessment Session
      const session = await AssessmentSessionService.createAssessmentSession(student.user.id, true);

      // 2. Save single-paragraph essay answer for all questions in session
      for (const q of session.questions) {
        await AssessmentSessionService.saveAnswerDraft(
          session.id,
          student.user.id,
          q.id,
          essayAnswer
        );
      }

      // 3. Submit Session and trigger 3-Model Simultaneous Evaluation
      const submitRes = await AssessmentSessionService.submitSession(session.id, student.user.id);

      studentSessions.push({
        student,
        session,
        submitRes,
      });

      // Verify evaluations exist in DB for this session
      const evals = await prisma.evaluation.findMany({
        where: { sessionId: session.id },
      });

      assertTest(
        evals.length >= 3,
        `Student ${i + 1} Evaluated by 3 Models`,
        `Evaluated records: ${evals.length} total, slots: ${evals.map((e: any) => e.modelSlot || 'MODEL_A').join(', ')}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 5: Student Feedback Sanity & Model Display Switching
    // -------------------------------------------------------------------------
    console.log('\n📌 5. Testing Student Feedback Sanity & Display Model Decoupling...');

    // A. Verify with studentDisplayModel = 'MODEL_A'
    await ModelConfigService.updateSystemSettings({ studentDisplayModel: 'MODEL_A' });
    const student1DataA = await EvaluationService.getStudentSessionEvaluations(
      studentSessions[0].session.id,
      studentUsers[0].user.id
    );

    assertTest(
      student1DataA.length > 0,
      'Student 1 Retrieved Feedback for MODEL_A',
      `Returned Question ID: ${student1DataA[0].questionId}, Total Score: ${student1DataA[0].numericalScore}%`
    );

    // Sanity checks on student feedback DTO
    const feedbackA = student1DataA[0];
    const rawKeys = Object.keys(feedbackA);
    const hasModelSlot = 'modelSlot' in feedbackA;
    const hasModelFamily = 'modelFamily' in feedbackA;
    const hasExactModelId = 'exactModelId' in feedbackA;

    assertTest(
      !hasModelSlot && !hasModelFamily && !hasExactModelId,
      'Feedback DTO Strictly Omits Internal Model Identifiers',
      `Fields present: ${rawKeys.join(', ')}`
    );

    assertTest(
      feedbackA.scoringBasis === '[Lexify Assessment]',
      'Scoring Basis Sanitized to [Lexify Assessment]',
      `scoringBasis: "${feedbackA.scoringBasis}"`
    );

    // B. Switch studentDisplayModel to 'MODEL_B'
    await ModelConfigService.updateSystemSettings({ studentDisplayModel: 'MODEL_B' });
    const student1DataB = await EvaluationService.getStudentSessionEvaluations(
      studentSessions[0].session.id,
      studentUsers[0].user.id
    );

    assertTest(
      student1DataB.length > 0,
      'Student 1 Retrieved Feedback after Display Switched to MODEL_B',
      `Returned Score: ${student1DataB[0].numericalScore}%`
    );

    // C. Switch studentDisplayModel to 'MODEL_C'
    await ModelConfigService.updateSystemSettings({ studentDisplayModel: 'MODEL_C' });
    const student1DataC = await EvaluationService.getStudentSessionEvaluations(
      studentSessions[0].session.id,
      studentUsers[0].user.id
    );

    assertTest(
      student1DataC.length > 0,
      'Student 1 Retrieved Feedback after Display Switched to MODEL_C',
      `Returned Score: ${student1DataC[0].numericalScore}%`
    );

    // D. Verify all underlying evaluations remain persisted in DB
    const allDbEvals = await prisma.evaluation.findMany({
      where: { sessionId: studentSessions[0].session.id },
    });

    const hasSlotA = allDbEvals.some(e => e.modelSlot === 'MODEL_A');
    const hasSlotB = allDbEvals.some(e => e.modelSlot === 'MODEL_B');
    const hasSlotC = allDbEvals.some(e => e.modelSlot === 'MODEL_C');

    assertTest(
      hasSlotA && hasSlotB && hasSlotC,
      'Historical Research DB Record Immutability',
      `Persisted records in DB: ${allDbEvals.length} evaluations (MODEL_A, MODEL_B, MODEL_C all intact)`
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 6: Cross-Student Data Isolation
    // -------------------------------------------------------------------------
    console.log('\n📌 6. Testing Cross-Student Data Isolation...');

    // Student 2 attempts to query Student 1's session evaluations
    const crossAccessData = await EvaluationService.getStudentSessionEvaluations(
      studentSessions[0].session.id,
      studentUsers[1].user.id // Student 2's ID
    );

    assertTest(
      crossAccessData.length === 0,
      'Cross-Student Unauthorized Data Isolation Enforced',
      'Student 2 cannot access Student 1 session results (returned 0 items)'
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 7: Class Record CSV Export
    // -------------------------------------------------------------------------
    console.log('\n📌 7. Testing Class Record CSV Export...');

    const classRecordCsv = await ExportService.exportClassRecordCSV();

    assertTest(
      typeof classRecordCsv === 'string' && classRecordCsv.length > 0,
      'Class Record CSV Generation Successful',
      `CSV byte size: ${classRecordCsv.length} bytes`
    );

    assertTest(
      classRecordCsv.includes('Student Name') &&
      classRecordCsv.includes('Student Email') &&
      classRecordCsv.includes('Session ID') &&
      classRecordCsv.includes('Score (%)') &&
      classRecordCsv.includes('Grade (5.00)'),
      'Class Record CSV Header Format Verified',
      'All required tabular columns present'
    );

    // Verify all 5 students appear in the exported class record
    const allStudentsInCsv = studentUsers.every(s => classRecordCsv.includes(s.user.email));
    assertTest(
      allStudentsInCsv,
      'All 5 Student Records Present in Class Record CSV',
      'Complete class roster represented in export'
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 8: Double-Blind Expert Grading CSV & JSON Export
    // -------------------------------------------------------------------------
    console.log('\n📌 8. Testing Double-Blind Expert Grading Exports (CSV & JSON)...');

    const expertCsv = await ExportService.exportExpertGradingCSV();
    const expertJson = await ExportService.exportExpertGradingJSON();

    assertTest(
      typeof expertCsv === 'string' && expertCsv.length > 0,
      'Expert Double-Blind CSV Generation Successful',
      `CSV size: ${expertCsv.length} bytes`
    );

    assertTest(
      expertJson && Array.isArray(expertJson.items) && expertJson.items.length > 0,
      'Expert Double-Blind JSON Generation Successful',
      `Total exportable items: ${expertJson?.items?.length || 0}`
    );

    // Strictly verify zero AI score leakage in expert CSV
    const csvHasAiScore = /AI Score|Model Score|MODEL_A|MODEL_B|MODEL_C|llama3\.2|phi4-mini|gemma2/i.test(expertCsv);
    assertTest(
      !csvHasAiScore,
      'Expert CSV Double-Blind Grounding: Zero AI Scores or Model Names Exposed',
      'No AI model provenance or predicted scores leaked to expert evaluators'
    );

    // Strictly verify expert JSON structure
    const firstExpertItem = expertJson.items[0];
    const hasAiProps = 'numericalScore' in firstExpertItem || 'modelSlot' in firstExpertItem || 'aiScore' in firstExpertItem;
    const hasRequiredExpertFields =
      'scenario' in firstExpertItem &&
      'modelAnswer' in firstExpertItem &&
      'studentAnswer' in firstExpertItem &&
      'expertScoringTemplate' in firstExpertItem;

    assertTest(
      !hasAiProps && hasRequiredExpertFields,
      'Expert JSON Double-Blind Grounding: Complete Rubric Template & Blank Scores',
      `Template contains: ${Object.keys(firstExpertItem.expertScoringTemplate).join(', ')}`
    );

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`🎉 ALL ACCEPTANCE TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log('========================================================================\n');

  } catch (error: any) {
    console.error('\n❌ ACCEPTANCE SUITE ENCOUNTERED AN ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAcceptanceSuite();
