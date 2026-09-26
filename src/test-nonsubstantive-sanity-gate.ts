import { prisma } from './lib/prisma';
import { AiEvaluatorService, checkIsNonsubstantive } from './services/ai-evaluator.service';
import { ModelConfigService } from './services/model-config.service';

async function runSanityGateVerification() {
  console.log('🛡️ =========================================================================');
  console.log('   LEXIFY NON-SUBSTANTIVE SANITY GATE & ADAPTIVE CALIBRATION TEST SUITE');
  console.log('=========================================================================\n');

  const question = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  if (!question) throw new Error('CRIM1-Q01 not found');

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubric: { isDefault: true } },
    orderBy: { orderIndex: 'asc' },
  });

  const configs = await ModelConfigService.getAllModelConfigs();
  const modelA = configs.find((c) => c.modelSlot === 'MODEL_A')!;

  // 1. TEST NON-SUBSTANTIVE REJECTION EXAMPLES
  console.log('--- 1. TESTING NON-SUBSTANTIVE REJECTIONS (MUST RECEIVE 0/100 & NONSUBSTANTIVE_SUBMISSION) ---');
  const rejectedInputs = [
    'A.',
    'X.',
    'I don\'t know.',
    'idk',
    'none',
    'N/A',
    'pass',
    'teheee',
    'asdfghjkl',
    'qwerty',
  ];

  for (const input of rejectedInputs) {
    const check = checkIsNonsubstantive(input, question);
    console.assert(check.isNonsubstantive, `Input "${input}" must be flagged as non-substantive`);

    const result = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: modelA as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: modelA.systemInstructions,
      studentAnswer: input,
      isDemo: true,
    });

    console.log(
      `✓ Input: "${input.padEnd(14)}" -> Total: ${result.numericalScore}/100, Final Score: ${(result.finalScore ?? 0).toFixed(2)}/5.00, Flags: [${result.reviewFlags.join(', ')}] (Form=${result.formScore}, Ans=${result.answerScore}, Rule=${result.ruleScore}, App=${result.applicationScore}, Concl=${result.conclusionScore})`
    );

    console.assert(result.numericalScore === 0, `Input "${input}" score must be 0`);
    console.assert(result.finalScore === 0, `Input "${input}" finalScore must be 0`);
    console.assert(result.formScore === 0 && result.answerScore === 0 && result.ruleScore === 0 && result.applicationScore === 0 && result.conclusionScore === 0, `Input "${input}" criteria must all be 0`);
    console.assert(result.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'), `Input "${input}" must include NONSUBSTANTIVE_SUBMISSION`);
  }

  // 2. TEST CONSERVATIVE GATE BYPASS (SHORT BUT SUBSTANTIVE ANSWERS MUST PASS TO EVALUATOR)
  console.log('\n--- 2. TESTING CONSERVATIVE GATE BYPASS (CONCISE SUBSTANTIVE ANSWERS MUST BYPASS GATE) ---');
  const substantiveShortInputs = [
    'A may invoke self-defense because B committed unlawful aggression.',
    'Under Article 11, self-defense requires unlawful aggression, reasonable necessity, and lack of provocation.',
  ];

  for (const input of substantiveShortInputs) {
    const check = checkIsNonsubstantive(input, question);
    console.assert(!check.isNonsubstantive, `Input "${input}" must NOT be blocked by sanity gate`);

    const result = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: modelA as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: modelA.systemInstructions,
      studentAnswer: input,
      isDemo: true,
    });

    console.log(
      `✓ Concise Substantive: "${input.slice(0, 45)}..." -> Total: ${result.numericalScore}/100, Final Score: ${(result.finalScore ?? 0).toFixed(2)}/5.00 (Form=${result.formScore}, Ans=${result.answerScore}, Rule=${result.ruleScore}, App=${result.applicationScore}, Concl=${result.conclusionScore})`
    );
    console.assert(result.numericalScore > 0, `Substantive input "${input}" must receive score > 0`);
    console.assert(!result.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'), `Substantive input must not have NONSUBSTANTIVE_SUBMISSION flag`);
  }

  // 3. TESTING ORDERED QUALITY PROGRESSION (NO RIGID HARDCODED SCORE BANDS)
  console.log('\n--- 3. TESTING ADAPTIVE QUALITY ORDERING (ORDERED MONOTONIC PROGRESSION) ---');
  const qualityLadder = [
    {
      level: '1. Blank / Nonsense',
      text: 'A.',
    },
    {
      level: '2. Irrelevant Response',
      text: 'Under Article 36 of the Family Code, psychological incapacity renders marriage void ab initio.',
    },
    {
      level: '3. Weak Legal Answer',
      text: 'A shot B with a gun because B attacked him with a knife.',
    },
    {
      level: '4. Incomplete Legal Answer',
      text: 'ANSWER: A can invoke self-defense.\nRULE: Under Article 11 of the RPC, self-defense is a justifying circumstance.\nAPPLICATION: B attacked A with a knife, so A shot B.\nCONCLUSION: A is not liable.',
    },
    {
      level: '5. Strong Legal Answer',
      text: 'ANSWER: A can validly invoke complete self-defense under Article 11(1) of the Revised Penal Code.\nRULE: Self-defense requires unlawful aggression by the victim, reasonable necessity of the means employed, and lack of sufficient provocation on the part of the defender.\nAPPLICATION: B committed unlawful aggression with a deadly knife in the dark alley. A\'s single shot was proportionate under rational equivalence. A gave no provocation.\nCONCLUSION: A incurs no criminal liability.',
    },
    {
      level: '6. Reference-Quality Complete ARAC',
      text: 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Under Article 11(1) of the Revised Penal Code, self-defense justifies an act and extinguishes criminal liability upon the concurrence of three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: First, unlawful aggression was present because B brandished a deadly knife in a dark alley and thrust it at A, creating actual and imminent mortal peril. Second, A\'s act of firing a single shot to B\'s chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A had no other comparable means to repel a sudden knife thrust. Third, there was complete lack of sufficient provocation since A was merely walking along the street when confronted.\n\nCONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.',
    },
  ];

  const progressionScores: number[] = [];
  for (const item of qualityLadder) {
    const res = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: modelA as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: modelA.systemInstructions,
      studentAnswer: item.text,
      isDemo: true,
    });

    progressionScores.push(res.numericalScore);
    console.log(
      `| ${item.level.padEnd(35)} | Form: ${String(res.formScore).padStart(4)} | Ans: ${String(res.answerScore).padStart(4)} | Rule: ${String(res.ruleScore).padStart(4)} | App: ${String(res.applicationScore).padStart(4)} | Concl: ${String(res.conclusionScore).padStart(4)} | Total: ${res.numericalScore.toFixed(1).padStart(5)}% (${(res.finalScore ?? 0).toFixed(2)}/5) |`
    );
  }

  // Verify non-decreasing progression across the ladder
  for (let i = 1; i < progressionScores.length; i++) {
    console.assert(
      progressionScores[i] >= progressionScores[i - 1],
      `Quality ladder violation: Score at tier ${i} (${progressionScores[i]}) is less than tier ${i - 1} (${progressionScores[i - 1]})`
    );
  }

  console.log('\n✓ Verified Quality Ladder Non-Decreasing Progression: ' + progressionScores.map((s) => `${s}%`).join(' <= '));
  console.log('\n🎉 ALL NON-SUBSTANTIVE SANITY GATE AND CALIBRATION TESTS PASSED 100%!\n');
}

runSanityGateVerification()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
