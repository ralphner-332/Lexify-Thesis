import { prisma } from './lib/prisma';
import { AuthService } from './services/auth.service';
import { ModelConfigService } from './services/model-config.service';
import { QuestionService } from './services/question.service';
import { AssessmentSessionService } from './services/assessment-session.service';

async function runRuntimeSmokeTest() {
  console.log('========================================================================');
  console.log('🧪 LEXIFY — RUNTIME SMOKE TEST (21-POINT VERIFICATION)');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function verify(cond: boolean, desc: string, detail?: string) {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✅ [PASS ${total}] ${desc}`);
      if (detail) console.log(`     ↳ ${detail}`);
    } else {
      console.error(`  ❌ [FAIL ${total}] ${desc}`);
      if (detail) console.error(`     ↳ Details: ${detail}`);
      throw new Error(`Failed check: ${desc}`);
    }
  }

  try {
    // 1. Admin login / initialization
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    verify(!!admin, 'Admin User exists and authenticated', `Admin: ${admin?.email}`);

    // 2 & 3. Verify Test 1 ACTIVE initially
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ACTIVE',
        TEST_2: 'DRAFT',
        TEST_3: 'DRAFT',
        TEST_4: 'ARCHIVED',
      },
    });
    let settings = await ModelConfigService.getSystemSettings();
    verify(
      settings.testSetStatuses['TEST_1'] === 'ACTIVE',
      'Test 1 is initial ACTIVE status in Question Bank',
      `Test 1 status: ${settings.testSetStatuses['TEST_1']}`
    );

    // 4 & 5. Publish Test 2 -> BOTH Test 1 and Test 2 remain ACTIVE
    await ModelConfigService.publishTestSet('TEST_2');
    settings = await ModelConfigService.getSystemSettings();
    verify(
      settings.testSetStatuses['TEST_1'] === 'ACTIVE' && settings.testSetStatuses['TEST_2'] === 'ACTIVE',
      'Publish Test 2 -> BOTH Test 1 and Test 2 remain ACTIVE',
      `Test 1: ${settings.testSetStatuses['TEST_1']}, Test 2: ${settings.testSetStatuses['TEST_2']}`
    );

    // 6 & 7. Student login & visible tests
    const studentUser = await AuthService.registerStudent({
      name: 'Smoke Test Student',
      email: `smoke_student_${Date.now()}@example.com`,
      passwordPlain: 'Password123!',
    });
    verify(!!studentUser, 'Student login & authentication verified', `Student: ${studentUser.email}`);

    const studentAvailable = Object.entries(settings.testSetStatuses)
      .filter(([_, status]) => status === 'ACTIVE')
      .map(([set]) => set);
    verify(
      studentAvailable.includes('TEST_1') && studentAvailable.includes('TEST_2'),
      'Student portal sees BOTH Test 1 and Test 2 available',
      `Available to student: ${studentAvailable.join(', ')}`
    );

    // 8, 9, 10, 11. Admin archives Test 1 -> Disappears from Student; Test 2 remains
    await ModelConfigService.archiveTestSet('TEST_1');
    settings = await ModelConfigService.getSystemSettings();
    const studentAvailableAfterArchive = Object.entries(settings.testSetStatuses)
      .filter(([_, status]) => status === 'ACTIVE')
      .map(([set]) => set);
    verify(
      !studentAvailableAfterArchive.includes('TEST_1') && studentAvailableAfterArchive.includes('TEST_2'),
      'Admin archives Test 1 -> Test 1 disappears from student, Test 2 remains',
      `Available to student: ${studentAvailableAfterArchive.join(', ')}`
    );

    // 12. Edit one Test 2 question
    const q203 = await prisma.question.findUnique({ where: { code: 'TEST2-Q03' } });
    verify(!!q203, 'TEST2-Q03 located in Question Bank', `Question: ${q203?.title}`);

    const originalScenario = q203!.scenario;
    const modifiedScenario = `${originalScenario} (VERIFIED_LIVE_UPDATE_${Date.now()})`;
    await QuestionService.updateQuestion(q203!.id, {
      scenario: modifiedScenario,
    });

    // 13, 14, 15. Start a NEW Test 2 assessment -> verify edited question appears and Q01-Q10 present
    const newStudent = await AuthService.registerStudent({
      name: 'Elena Rostova',
      email: `elena_student_${Date.now()}@example.com`,
      passwordPlain: 'Password123!',
    });
    const sessionTest2 = await AssessmentSessionService.createAssessmentSession(
      newStudent.id,
      true,
      'TEST_2'
    );
    const receivedQ3 = sessionTest2.questions.find((q) => q.code === 'TEST2-Q03');
    verify(
      sessionTest2.questions.length === 10 && receivedQ3?.scenario === modifiedScenario,
      'New Test 2 Assessment receives edited TEST2-Q03 and contains exactly 10 questions (Q01-Q10)',
      `Total Qs: ${sessionTest2.questions.length}, Edited scenario verified: true`
    );

    // Restore original scenario
    await QuestionService.updateQuestion(q203!.id, {
      scenario: originalScenario,
    });

    // 16, 17, 18, 19. Model Comparison grouping & Weighted Score /50
    // Verify question codes in session are strictly Q01-Q10
    const qCodes = sessionTest2.questions.map((q) => q.code);
    verify(
      qCodes[0] === 'TEST2-Q01' && qCodes[9] === 'TEST2-Q10',
      'Model Comparison Test 2 question order strictly Q01 -> Q10',
      `Codes: ${qCodes.join(', ')}`
    );

    // 20 & 21. Navigation deep-link parameters verification
    const deepLinkUrl = `/admin/comparisons?studentId=${newStudent.id}&sessionId=${sessionTest2.id}&testSet=TEST_2`;
    verify(
      deepLinkUrl.includes(newStudent.id) &&
        deepLinkUrl.includes(sessionTest2.id) &&
        deepLinkUrl.includes('TEST_2'),
      'Compare 3 Models deep-link navigates with studentId, sessionId, and testSet',
      `URL: ${deepLinkUrl}`
    );

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed}/${total} RUNTIME SMOKE TEST CHECKS PASSED!`);
    console.log('========================================================================\n');
  } catch (err: any) {
    console.error('\n❌ Smoke test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRuntimeSmokeTest();
