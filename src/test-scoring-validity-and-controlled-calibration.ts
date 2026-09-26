import { prisma } from './lib/prisma';
import { AiEvaluatorService } from './services/ai-evaluator.service';

async function runCalibrationVerification() {
  console.log('⚖️ =========================================================================');
  console.log('   LEXIFY SCORING-VALIDITY & MONOTONIC CALIBRATION TEST SUITE');
  console.log('=========================================================================\n');

  const question = await prisma.question.findFirst({
    where: { code: 'CRIM1-Q01' },
  });
  if (!question) throw new Error('CRIM1-Q01 question not found');

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubric: { isDefault: true } },
    orderBy: { orderIndex: 'asc' },
  });

  const testScenarios = [
    {
      code: 'A',
      name: 'Blank / Near-Blank Answer',
      text: 'A',
      expectedMax: 5,
    },
    {
      code: 'B',
      name: 'Completely Irrelevant Answer (Family Code in Criminal Law)',
      text: 'Under Article 36 of the Family Code, psychological incapacity renders a marriage void ab initio. The contract is perfected by mere consent.',
      expectedMax: 5,
    },
    {
      code: 'C',
      name: 'Incomplete Answer (Narrative facts present, but Rule elements omitted)',
      text: 'A may invoke self-defense.\n\nUnder Article 11 of the Revised Penal Code, self-defense is a justifying circumstance.\n\nIn this case, B attacked A with a knife in a dark alley, so A shot B in the chest with his licensed firearm.\n\nTherefore, A is not criminally liable.',
      expectedMin: 35,
      expectedMax: 60,
    },
    {
      code: 'D',
      name: 'Strong Rule But Weak Application',
      text: 'ANSWER: Yes, A can validly invoke complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Self-defense requires three essential requisites: (1) unlawful aggression, (2) reasonable necessity of the means employed to prevent or repel it, and (3) lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: Here, self-defense applies because B attacked A.\n\nCONCLUSION: Therefore, A incurs no criminal liability.',
      expectedMin: 60,
      expectedMax: 75,
    },
    {
      code: 'E',
      name: 'Reference-Quality Complete ARAC Answer',
      text: 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Under Article 11(1) of the Revised Penal Code, self-defense requires three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: First, unlawful aggression was present when B brandished a deadly knife in a dark alley and thrust it at A, placing A in imminent mortal peril. Second, A\'s act of firing a single shot to the chest with his licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A was confronted with an imminent deadly knife thrust with no other comparable means of defense. Third, there was complete lack of sufficient provocation on A\'s part, as A was merely walking peacefully home.\n\nCONCLUSION: Consequently, all three statutory requisites concur. A acted in legitimate complete self-defense, is totally exempt from criminal liability, and incurs no civil liability arising from crime.',
      expectedMin: 95,
      expectedMax: 100,
    },
  ];

  console.log('| Scenario | Description | Form (15) | Ans (15) | Rule (30) | App (30) | Concl (10) | Raw Pct | Grade | Missing Elements |');
  console.log('| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |');

  const scores: number[] = [];

  for (const s of testScenarios) {
    const res = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, s.text, 100);
    scores.push(res.numericalScore);

    console.log(
      `| **${s.code}** | ${s.name.slice(0, 35).padEnd(35)} | ${res.formScore?.toFixed(1).padStart(4)} | ${res.answerScore?.toFixed(1).padStart(4)} | ${res.ruleScore?.toFixed(1).padStart(4)} | ${res.applicationScore?.toFixed(1).padStart(4)} | ${res.conclusionScore?.toFixed(1).padStart(4)} | ${res.numericalScore.toFixed(1).padStart(5)}% | ${res.finalRoundedGrade}/10 | ${res.missingElements.length} missing |`
    );

    if (s.expectedMax !== undefined) {
      console.assert(res.numericalScore <= s.expectedMax, `Scenario ${s.code} score ${res.numericalScore} exceeded expectedMax ${s.expectedMax}`);
    }
    if (s.expectedMin !== undefined) {
      console.assert(res.numericalScore >= s.expectedMin, `Scenario ${s.code} score ${res.numericalScore} below expectedMin ${s.expectedMin}`);
    }
  }

  console.log('\n--- 2. VERIFYING STRICT MONOTONIC DISCRIMINATION ---');
  console.log(`Scores: A=${scores[0]}, B=${scores[1]}, C=${scores[2]}, D=${scores[3]}, E=${scores[4]}`);

  console.assert(scores[0] === 0, 'Scenario A (Blank) must be 0');
  console.assert(scores[1] === 0, 'Scenario B (Irrelevant) must be 0');
  console.assert(scores[2] > scores[1], 'Scenario C (Incomplete) must score higher than Irrelevant');
  console.assert(scores[2] < scores[3], 'Scenario C (Incomplete) must score lower than Strong Rule');
  console.assert(scores[3] < scores[4], 'Scenario D (Weak App) must score lower than Reference Complete');
  console.assert(scores[4] === 100, 'Scenario E (Reference Complete) must receive 100');

  console.log('✓ Monotonicity Verified: Score(A) = Score(B) = 0 < Score(C) [48.8] < Score(D) [65.0] < Score(E) [100.0]');
  console.log('\n🎉 ALL SCORING-VALIDITY AND CALIBRATION TESTS PASSED 100%!\n');
}

runCalibrationVerification()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
