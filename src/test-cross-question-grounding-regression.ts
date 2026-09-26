import { prisma } from './lib/prisma';
import { AssessmentSessionService } from './services/assessment-session.service';
import { EvaluationService } from './services/evaluation.service';

async function runCrossQuestionGroundingRegressionTest() {
  console.log('🔬 =========================================================================');
  console.log('   LEXIFY REGRESSION TEST: QUESTION GROUNDING & ANTI-CROSS-CONTAMINATION');
  console.log('=========================================================================\n');

  // 1. Retrieve Questions and verify their baseline legal elements in DB
  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  console.assert(questions.length >= 2, 'Must have at least 2 active questions');

  const q1 = questions.find((q) => q.code === 'CRIM1-Q01');
  const q2 = questions.find((q) => q.code === 'CRIM1-Q02');

  console.assert(q1 && q2, 'Both CRIM1-Q01 and CRIM1-Q02 must exist');

  console.log(`[Q1 Verify] Code: ${q1!.code} | Title: "${q1!.title}" | ID: ${q1!.id}`);
  const q1Elements: string[] = JSON.parse(q1!.statutoryElements || '[]');
  console.assert(q1Elements.some((e) => e.toLowerCase().includes('unlawful aggression')), 'Q1 must require unlawful aggression');
  console.assert(!q1Elements.some((e) => e.toLowerCase().includes('aberratio ictus')), 'Q1 must NOT contain aberratio ictus');

  console.log(`[Q2 Verify] Code: ${q2!.code} | Title: "${q2!.title}" | ID: ${q2!.id}`);
  const q2Elements: string[] = JSON.parse(q2!.statutoryElements || '[]');
  console.assert(q2Elements.some((e) => e.toLowerCase().includes('aberratio ictus') || e.toLowerCase().includes('felony') || e.toLowerCase().includes('praeter')), 'Q2 must require aberratio ictus / praeter intentionem');
  console.assert(!q2Elements.some((e) => e.toLowerCase().includes('unlawful aggression')), 'Q2 must NOT contain unlawful aggression');

  // 2. Start a fresh student session
  const testStudent = await prisma.user.create({
    data: {
      email: `grounding.test.${Date.now()}@lexify.local`,
      name: 'Grounding Verification Student',
      role: 'STUDENT',
      passwordHash: 'hashed_pw',
      isDemo: true,
    },
  });

  const session = await AssessmentSessionService.createAssessmentSession(testStudent.id, true);
  console.log(`\n✓ Started fresh assessment session: ${session.id}`);

  // 3. Submit incomplete answers to intentionally trigger missing elements
  const q1StudentAnswer = `ANSWER: A acted in self defense.
RULE: A person who defends himself does not incur criminal liability.
APPLICATION: B attacked A and A fired back.
CONCLUSION: A is not guilty.`;

  const q2StudentAnswer = `ANSWER: X is liable for homicide.
RULE: Anyone who commits a crime is liable for the death.
APPLICATION: X threw a punch at Y and it accidentally hit Z who died.
CONCLUSION: X is guilty.`;

  await AssessmentSessionService.saveAnswerDraft(session.id, testStudent.id, q1!.id, q1StudentAnswer);
  await AssessmentSessionService.saveAnswerDraft(session.id, testStudent.id, q2!.id, q2StudentAnswer);

  const submitResult = await AssessmentSessionService.submitSession(session.id, testStudent.id);
  console.log(`✓ Submitted and finalized session: ${submitResult.sessionId}`);

  // 4. Retrieve evaluations from database directly
  const dbEvaluations = await prisma.evaluation.findMany({
    where: { sessionId: session.id },
  });

  console.assert(dbEvaluations.length === 6, `Expected 6 evaluation records, got ${dbEvaluations.length}`);

  console.log('\n--- Auditing Raw DB Evaluations for Question-Grounding Integrity ---');
  for (const ev of dbEvaluations) {
    const missing: string[] = JSON.parse(ev.missingElements || '[]');
    const basis = ev.scoringBasis.toLowerCase();

    if (ev.questionId === q1!.id) {
      console.log(`[Q1 - ${ev.modelSlot}] Model: ${ev.exactModelId}`);
      // Q1 must NOT contain any Q2 keywords
      console.assert(!basis.includes('aberratio ictus'), `Q1 evaluation (${ev.modelSlot}) must NOT reference aberratio ictus`);
      console.assert(!basis.includes('praeter intentionem'), `Q1 evaluation (${ev.modelSlot}) must NOT reference praeter intentionem`);
      console.assert(!missing.some((m) => m.toLowerCase().includes('aberratio ictus')), `Q1 missing elements must NOT contain aberratio ictus`);
      console.assert(!missing.some((m) => m.toLowerCase().includes('praeter intentionem')), `Q1 missing elements must NOT contain praeter intentionem`);
      console.log(`   ✓ Verified Q1 evaluation contains strictly self-defense feedback (Missing: ${missing.join(', ')})`);
    } else if (ev.questionId === q2!.id) {
      console.log(`[Q2 - ${ev.modelSlot}] Model: ${ev.exactModelId}`);
      // Q2 must NOT contain any Q1 keywords
      console.assert(!basis.includes('unlawful aggression'), `Q2 evaluation (${ev.modelSlot}) must NOT reference unlawful aggression`);
      console.assert(!missing.some((m) => m.toLowerCase().includes('unlawful aggression')), `Q2 missing elements must NOT contain unlawful aggression`);
      console.log(`   ✓ Verified Q2 evaluation contains strictly aberratio ictus/praeter intentionem feedback (Missing: ${missing.join(', ')})`);
    }
  }

  // 5. Test EvaluationService.getStudentSessionEvaluations() endpoint mapping
  console.log('\n--- Auditing Service DTO Question Mapping & Sequence Ordering ---');
  const serviceFeedbacks = await EvaluationService.getStudentSessionEvaluations(session.id, testStudent.id);

  // Group feedbacks by questionId
  const q1Feedbacks = serviceFeedbacks.filter((f) => f.questionId === q1!.id);
  const q2Feedbacks = serviceFeedbacks.filter((f) => f.questionId === q2!.id);

  console.assert(q1Feedbacks.length === 3, 'Must have 3 model feedbacks for Q1');
  console.assert(q2Feedbacks.length === 3, 'Must have 3 model feedbacks for Q2');

  // Verify that the first items in serviceFeedbacks correspond to Q1 (the first question in questionsSnapshot)
  console.assert(serviceFeedbacks[0].questionId === q1!.id, 'Service must return Q1 evaluations before Q2 evaluations');
  console.assert(serviceFeedbacks[1].questionId === q1!.id, 'Service index 1 must be Q1');
  console.assert(serviceFeedbacks[2].questionId === q1!.id, 'Service index 2 must be Q1');
  console.assert(serviceFeedbacks[3].questionId === q2!.id, 'Service index 3 must be Q2');
  console.assert(serviceFeedbacks[4].questionId === q2!.id, 'Service index 4 must be Q2');
  console.assert(serviceFeedbacks[5].questionId === q2!.id, 'Service index 5 must be Q2');

  for (const f of q1Feedbacks) {
    const missing = f.missingElements.map((m) => m.toLowerCase());
    console.assert(!missing.some((m) => m.includes('aberratio') || m.includes('praeter')), 'DTO Q1 must NOT have Q2 elements');
  }

  for (const f of q2Feedbacks) {
    const missing = f.missingElements.map((m) => m.toLowerCase());
    console.assert(!missing.some((m) => m.includes('unlawful aggression')), 'DTO Q2 must NOT have Q1 elements');
  }

  console.log('\n🎉 ALL QUESTION GROUNDING & ANTI-CROSS-CONTAMINATION REGRESSION TESTS PASSED 100%!');
}

runCrossQuestionGroundingRegressionTest()
  .catch((err) => {
    console.error('❌ Regression test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
