import { prisma } from './lib/prisma';
import { AssessmentSessionService } from './services/assessment-session.service';
import { ModelConfigService } from './services/model-config.service';
import bcrypt from 'bcryptjs';

async function runExistingStudentSyncTest() {
  console.log('===============================================================');
  console.log('LEXIFY — EXISTING STUDENT QUESTION SYNC & TEST PUBLISHING TEST');
  console.log('===============================================================\n');

  // Helper to query active published tests as StudentDashboard would
  const getVisibleTestsForStudent = (settings: any) => {
    const TEST_DEFINITIONS = [
      { id: 'TEST_1', title: 'Test 1' },
      { id: 'TEST_2', title: 'Test 2' },
      { id: 'TEST_3', title: 'Test 3' },
      { id: 'TEST_4', title: 'Test 4' },
    ];
    return TEST_DEFINITIONS.filter(
      (t) => settings.testSetStatuses?.[t.id] === 'ACTIVE'
    ).map((t) => t.id);
  };

  try {
    // 0. Clean up previous test users if any
    const testEmail = 'existing_student_sync_test@lexify.test';
    await prisma.studentAnswerDraft.deleteMany({
      where: { session: { student: { email: testEmail } } },
    });
    await prisma.evaluation.deleteMany({
      where: { session: { student: { email: testEmail } } },
    });
    await prisma.assessmentSession.deleteMany({
      where: { student: { email: testEmail } }
    });
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // 1. Create ONE EXISTING STUDENT ACCOUNT (simulating an old account)
    console.log('[STEP 1] Creating ONE existing student account created in the past...');
    const hashedPassword = await bcrypt.hash('Student123!', 10);
    const existingStudent = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Existing Student Juan Dela Cruz',
        passwordHash: hashedPassword,
        role: 'STUDENT',
        isDemo: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    });
    console.log(`✓ Existing student created with ID: ${existingStudent.id} (Age: 30 days ago)`);

    // 2. Set initial publication state: TEST_1=ACTIVE, TEST_2=DRAFT, TEST_3=DRAFT, TEST_4=ARCHIVED
    console.log('\n[STEP 2] Setting System Settings: TEST_1=ACTIVE, others DRAFT/ARCHIVED');
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ACTIVE',
        TEST_2: 'DRAFT',
        TEST_3: 'DRAFT',
        TEST_4: 'ARCHIVED',
      },
    });
    let settings = await ModelConfigService.getSystemSettings();
    let visibleTests = getVisibleTestsForStudent(settings);
    console.log(`✓ Student Dashboard sees tests: [${visibleTests.join(', ')}]`);
    if (visibleTests.length !== 1 || visibleTests[0] !== 'TEST_1') {
      throw new Error(`Expected only [TEST_1], got [${visibleTests.join(', ')}]`);
    }

    // 3. Admin edits TEST2-Q03 scenario in Question Bank
    console.log('\n[STEP 3] Admin edits TEST2-Q03 in Question Bank...');
    const originalQ2_3 = await prisma.question.findFirst({
      where: { code: 'TEST2-Q03' },
    });
    if (!originalQ2_3) throw new Error('TEST2-Q03 not found in Question Bank');

    const updatedScenarioTest2Q03 = 'UPDATED_TEST2_Q03_PROMISSORY_NOTE_LIABILITY_LEGAL_SCENARIO';
    await prisma.question.update({
      where: { id: originalQ2_3.id },
      data: { scenario: updatedScenarioTest2Q03 },
    });
    console.log(`✓ TEST2-Q03 scenario updated in SQLite DB.`);

    // 4. Admin archives TEST_1 and publishes TEST_2
    console.log('\n[STEP 4] Admin archives TEST_1 and publishes TEST_2...');
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ARCHIVED',
        TEST_2: 'ACTIVE',
        TEST_3: 'DRAFT',
        TEST_4: 'ARCHIVED',
      },
    });

    // 5. Existing student returns to dashboard -> fetch current state
    console.log('\n[STEP 5 & 6] SAME existing student queries dashboard / settings...');
    settings = await ModelConfigService.getSystemSettings();
    visibleTests = getVisibleTestsForStudent(settings);
    console.log(`✓ Student Dashboard now sees tests: [${visibleTests.join(', ')}]`);
    if (visibleTests.length !== 1 || visibleTests[0] !== 'TEST_2') {
      throw new Error(`Expected only [TEST_2], got [${visibleTests.join(', ')}]`);
    }
    console.log('✓ TEST_1 successfully disappeared and TEST_2 appeared for existing student!');

    // 6. Existing student starts Test 2
    console.log('\n[STEP 7] Existing student starts Test 2...');
    const test2Session = await AssessmentSessionService.getOrCreateActiveSession(
      existingStudent.id,
      existingStudent.isDemo,
      'TEST_2'
    );
    const q3InTest2 = test2Session.questions.find((q) => q.code === 'TEST2-Q03');
    if (!q3InTest2) throw new Error('TEST2-Q03 missing from session');
    console.log(`✓ Received TEST2-Q03 Scenario in session: "${q3InTest2.scenario}"`);
    if (q3InTest2.scenario !== updatedScenarioTest2Q03) {
      throw new Error(`Question sync failed! Expected updated scenario, got: ${q3InTest2.scenario}`);
    }
    console.log('✓ TEST2-Q03 contains the UPDATED question text!');

    // 7. Admin archives TEST_2
    console.log('\n[STEP 8 & 9] Admin archives TEST_2...');
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ARCHIVED',
        TEST_2: 'ARCHIVED',
        TEST_3: 'DRAFT',
        TEST_4: 'ARCHIVED',
      },
    });
    settings = await ModelConfigService.getSystemSettings();
    visibleTests = getVisibleTestsForStudent(settings);
    console.log(`✓ Student Dashboard sees tests: [${visibleTests.join(', ')}] (Length: ${visibleTests.length})`);
    if (visibleTests.length !== 0) {
      throw new Error(`Expected 0 visible tests, got [${visibleTests.join(', ')}]`);
    }
    console.log('✓ TEST_2 successfully disappeared after being archived!');

    // Restore TEST2-Q03
    await prisma.question.update({
      where: { id: originalQ2_3.id },
      data: { scenario: originalQ2_3.scenario },
    });

    // 8. EMPTY SESSION REFRESH REPRODUCTION
    console.log('\n[STEP 10] EMPTY SESSION REFRESH REPRODUCTION TEST...');
    // Publish Test 3
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ARCHIVED',
        TEST_2: 'ARCHIVED',
        TEST_3: 'ACTIVE',
        TEST_4: 'DRAFT',
      },
    });
    // Student opens Test 3 (creates session with 0 answers)
    const test3Session = await AssessmentSessionService.getOrCreateActiveSession(
      existingStudent.id,
      existingStudent.isDemo,
      'TEST_3'
    );
    console.log(`✓ Test 3 session opened (ID: ${test3Session.id}). Zero answers saved.`);

    // Admin edits TEST3-Q04 in Question Bank while session is open/empty
    const originalQ3_4 = await prisma.question.findFirst({
      where: { code: 'TEST3-Q04' },
    });
    if (!originalQ3_4) throw new Error('TEST3-Q04 not found');
    const updatedScenarioTest3Q04 = 'UPDATED_TEST3_Q04_PARTNERSHIP_MANAGEMENT_RULES';
    await prisma.question.update({
      where: { id: originalQ3_4.id },
      data: { scenario: updatedScenarioTest3Q04 },
    });
    console.log('✓ Admin edited TEST3-Q04 in Question Bank.');

    // Student re-opens / resumes Test 3 session
    const resumedTest3Session = await AssessmentSessionService.getOrCreateActiveSession(
      existingStudent.id,
      existingStudent.isDemo,
      'TEST_3'
    );
    const q4InTest3 = resumedTest3Session.questions.find((q) => q.code === 'TEST3-Q04');
    console.log(`✓ Resumed session TEST3-Q04 Scenario: "${q4InTest3?.scenario}"`);
    if (q4InTest3?.scenario !== updatedScenarioTest3Q04) {
      throw new Error('Empty session failed to refresh with updated question bank text!');
    }
    console.log('✓ Empty session successfully refreshed with latest Question Bank edits!');

    // Restore TEST3-Q04
    await prisma.question.update({
      where: { id: originalQ3_4.id },
      data: { scenario: originalQ3_4.scenario },
    });

    // 9. ANSWERED SESSION PROTECTION TEST
    console.log('\n[STEP 11] ANSWERED SESSION PROTECTION TEST...');
    // Student saves a meaningful answer to Q01 in Test 3
    const q1InTest3 = resumedTest3Session.questions.find((q) => q.code === 'TEST3-Q01');
    if (!q1InTest3) throw new Error('TEST3-Q01 not found in session');

    await AssessmentSessionService.saveAnswerDraft(
      resumedTest3Session.id,
      existingStudent.id,
      q1InTest3.id,
      'Under Article 1800 of the Civil Code of the Philippines, the partner appointed manager in the articles of partnership may execute all acts of administration despite opposition of other partners.'
    );
    console.log('✓ Meaningful answer saved for TEST3-Q01.');

    // Admin edits TEST3-Q01 in Question Bank
    const originalQ3_1 = await prisma.question.findFirst({
      where: { code: 'TEST3-Q01' },
    });
    if (!originalQ3_1) throw new Error('TEST3-Q01 not found');
    const alteredScenarioQ3_1 = 'ALTERED_BANK_QUESTION_SHOULD_NOT_OVERWRITE_ANSWERED_DRAFT';
    await prisma.question.update({
      where: { id: originalQ3_1.id },
      data: { scenario: alteredScenarioQ3_1 },
    });

    // Student re-opens answered Test 3 session
    const answeredSession = await AssessmentSessionService.getSessionById(
      resumedTest3Session.id,
      existingStudent.id
    );
    const preservedQ1 = answeredSession.questions.find((q) => q.code === 'TEST3-Q01');
    console.log(`✓ Answered session Q01 Scenario: "${preservedQ1?.scenario}"`);
    if (preservedQ1?.scenario === alteredScenarioQ3_1) {
      throw new Error('FAILED: Answered session was silently overwritten by Question Bank change!');
    }
    console.log('✓ Answered session question snapshot successfully preserved for attempt integrity!');

    // Restore TEST3-Q01
    await prisma.question.update({
      where: { id: originalQ3_1.id },
      data: { scenario: originalQ3_1.scenario },
    });

    // 10. SUBMITTED SESSION PROTECTION TEST
    console.log('\n[STEP 12] SUBMITTED SESSION PROTECTION TEST...');
    // Submit all remaining questions
    for (const q of answeredSession.questions) {
      if (q.id !== q1InTest3.id) {
        await AssessmentSessionService.saveAnswerDraft(
          resumedTest3Session.id,
          existingStudent.id,
          q.id,
          'Legal analysis answering the assigned partnership question in accordance with the Civil Code of the Philippines.'
        );
      }
    }
    await AssessmentSessionService.submitSession(resumedTest3Session.id, existingStudent.id);
    console.log('✓ Test 3 session submitted.');

    // Admin edits TEST3-Q02 in Question Bank
    const originalQ3_2 = await prisma.question.findFirst({
      where: { code: 'TEST3-Q02' },
    });
    if (!originalQ3_2) throw new Error('TEST3-Q02 not found');
    const alteredScenarioQ3_2 = 'ALTERED_AFTER_SUBMISSION_SCENARIO';
    await prisma.question.update({
      where: { id: originalQ3_2.id },
      data: { scenario: alteredScenarioQ3_2 },
    });

    // Verify submitted session
    const submittedSession = await AssessmentSessionService.getSessionById(
      resumedTest3Session.id,
      existingStudent.id
    );
    const submittedQ2 = submittedSession.questions.find((q) => q.code === 'TEST3-Q02');
    console.log(`✓ Submitted session Q02 Scenario: "${submittedQ2?.scenario}"`);
    if (submittedQ2?.scenario === alteredScenarioQ3_2) {
      throw new Error('FAILED: Submitted session was overwritten by Question Bank edit!');
    }
    console.log('✓ Submitted session permanently preserved as immutable historical record!');

    // Restore TEST3-Q02
    await prisma.question.update({
      where: { id: originalQ3_2.id },
      data: { scenario: originalQ3_2.scenario },
    });

    // 11. MULTIPLE ACTIVE TESTS VERIFICATION
    console.log('\n[STEP 13] MULTIPLE ACTIVE TESTS VERIFICATION...');
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ACTIVE',
        TEST_2: 'ACTIVE',
        TEST_3: 'DRAFT',
        TEST_4: 'ARCHIVED',
      },
    });
    settings = await ModelConfigService.getSystemSettings();
    visibleTests = getVisibleTestsForStudent(settings);
    console.log(`✓ Config [TEST_1: ACTIVE, TEST_2: ACTIVE] -> Visible: [${visibleTests.join(', ')}]`);
    if (visibleTests.length !== 2 || !visibleTests.includes('TEST_1') || !visibleTests.includes('TEST_2')) {
      throw new Error(`Expected [TEST_1, TEST_2], got [${visibleTests.join(', ')}]`);
    }

    // Archive TEST_1, publish TEST_3
    await ModelConfigService.updateSystemSettings({
      testSetStatuses: {
        TEST_1: 'ARCHIVED',
        TEST_2: 'ACTIVE',
        TEST_3: 'ACTIVE',
        TEST_4: 'ARCHIVED',
      },
    });
    settings = await ModelConfigService.getSystemSettings();
    visibleTests = getVisibleTestsForStudent(settings);
    console.log(`✓ Config [TEST_2: ACTIVE, TEST_3: ACTIVE] -> Visible: [${visibleTests.join(', ')}]`);
    if (visibleTests.length !== 2 || !visibleTests.includes('TEST_2') || !visibleTests.includes('TEST_3')) {
      throw new Error(`Expected [TEST_2, TEST_3], got [${visibleTests.join(', ')}]`);
    }

    // 12. Cross-Test Session Isolation Check
    console.log('\n[STEP 14] CROSS-TEST SESSION ISOLATION CHECK...');
    const test2SessionDirect = await AssessmentSessionService.getOrCreateActiveSession(
      existingStudent.id,
      existingStudent.isDemo,
      'TEST_2'
    );
    const firstQCode = test2SessionDirect.questions[0]?.code;
    console.log(`✓ Direct request for TEST_2 returned first question: ${firstQCode}`);
    if (!firstQCode?.startsWith('TEST2')) {
      throw new Error(`Explicit request for TEST_2 returned non-Test 2 question: ${firstQCode}`);
    }
    console.log('✓ Never returns old Test 1 / Test 3 session when Test 2 is explicitly requested!');

    // Clean up test user
    await prisma.studentAnswerDraft.deleteMany({
      where: { session: { student: { email: testEmail } } },
    });
    await prisma.evaluation.deleteMany({
      where: { session: { student: { email: testEmail } } },
    });
    await prisma.assessmentSession.deleteMany({
      where: { student: { email: testEmail } }
    });
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    console.log('\n===============================================================');
    console.log('✅ ALL EXISTING STUDENT SYNC & PUBLISHING TESTS PASSED!');
    console.log('===============================================================');
  } catch (err: any) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runExistingStudentSyncTest();
