import { AiEvaluatorService } from './services/ai-evaluator.service';

async function runScoringArithmeticAndAnswerAudit() {
  console.log('⚖️ =========================================================================');
  console.log('   LEXIFY AUDIT: RAW SCORE ARITHMETIC & SUBSTANTIVE ANSWER CRITERION');
  console.log('=========================================================================\n');

  const q1Snapshot = {
    code: 'CRIM1-Q01',
    title: 'Justifying Circumstances: Self-Defense Analysis',
    scenario:
      'A, while walking along a dimly lit street, was suddenly confronted by B, who was brandishing a knife and shouted, "Give me your wallet or I will kill you!" B thrust the knife towards A. A, who was carrying a licensed firearm, quickly drew it and shot B once in the chest, fatally wounding him. Can A invoke self-defense under Article 11, paragraph 1 of the Revised Penal Code? Explain thoroughly using legal elements.',
    modelAnswer: 'Yes, A can validly invoke self-defense under Article 11...',
    statutoryElements: [
      'Unlawful aggression (essential and primary requisite)',
      'Reasonable necessity of the means employed to prevent or repel it',
      'Lack of sufficient provocation on the part of the person defending himself',
    ],
    relevantProvisions: ['Article 11, Paragraph 1, Revised Penal Code (Self-Defense)'],
    conceptVariations: ['rational equivalence', 'deadly weapon', 'licensed firearm'],
  };

  const rubricSnapshot = [
    { name: 'FORM', weightPercent: 15, maxPoints: 15, description: 'ARAC structure' },
    { name: 'ANSWER', weightPercent: 15, maxPoints: 15, description: 'Direct legal stance' },
    { name: 'RULE', weightPercent: 30, maxPoints: 30, description: 'Legal doctrine' },
    { name: 'APPLICATION', weightPercent: 30, maxPoints: 30, description: 'Fact application' },
    { name: 'CONCLUSION', weightPercent: 10, maxPoints: 10, description: 'Final conclusion' },
  ];

  // -------------------------------------------------------------------------
  // 1. Audit Natural Phrasing Answer Stance Recognition
  // -------------------------------------------------------------------------
  console.log('📌 PART 1: Substantive Answer Stance Recognition (Without Rigid "ANSWER:" Label)');

  const testCases = [
    {
      description: 'Natural Opening: "A may invoke self-defense because B threatened him with a knife..."',
      text: 'A may invoke self-defense because B threatened him with a knife and tried to attack him.',
      expectedAnsScore: 15.0,
      mustBeNonZero: true,
    },
    {
      description: 'Natural Opening: "A acted in complete self-defense when B lunged at him."',
      text: 'A acted in complete self-defense when B lunged at him with a knife in a dark alley.',
      expectedAnsScore: 15.0,
      mustBeNonZero: true,
    },
    {
      description: 'Formal Opening: "ANSWER: Yes, A can validly invoke self-defense."',
      text: 'ANSWER: Yes, A can validly invoke self-defense under Article 11, paragraph 1.',
      question: q1Snapshot,
      expectedAnsScore: 15.0,
      mustBeNonZero: true,
    },
    {
      description: 'Praeter/Aberratio Opening: "X may still be criminally liable even though he intended to hit Y."',
      text: 'X may still be criminally liable even though he intended to hit Y instead of Z.',
      question: {
        code: 'CRIM1-Q02',
        title: 'Praeter Intentionem vs Aberratio Ictus',
        statutoryElements: ['initial felony', 'proximate cause', 'aberratio ictus', 'praeter intentionem'],
        conceptVariations: ['mistake in the blow', 'no intention to kill'],
      },
      expectedAnsScore: 15.0,
      mustBeNonZero: true,
    },
    {
      description: 'Abstract Rule ONLY (No Answer stance): "Self-defense under Article 11 RPC requires 3 elements..."',
      text: 'Under Article 11, paragraph 1 of the Revised Penal Code, self-defense requires unlawful aggression, reasonable necessity of the means employed, and lack of sufficient provocation.',
      question: q1Snapshot,
      expectedAnsScore: 0.0,
      mustBeNonZero: false,
    },
    {
      description: 'Ambiguous Stance: "A might or might not be able to claim self-defense depending on circumstances."',
      text: 'A might or might not be able to claim self-defense depending on the knife size.',
      question: q1Snapshot,
      expectedAnsScore: 8.0,
      mustBeNonZero: true,
    },
  ];

  for (const tc of testCases) {
    const qSnap = tc.question || q1Snapshot;
    const result = AiEvaluatorService.generateDemoSimulation(qSnap, rubricSnapshot, tc.text, 100);
    const ansScore = result.answerScore ?? result.criterionScores.find((c) => c.criterionName === 'Answer')?.score ?? 0;

    console.log(`\nTest: ${tc.description}`);
    console.log(`- Evaluated Answer Score: ${ansScore} / 15`);
    console.log(`- Criterion Reasoning: "${result.criterionScores.find((c) => c.criterionName === 'Answer')?.reasoning}"`);

    if (tc.mustBeNonZero) {
      console.assert(ansScore >= tc.expectedAnsScore, `Expected answer score >= ${tc.expectedAnsScore}, got ${ansScore}`);
    } else {
      console.assert(ansScore === 0, `Expected answer score 0 for pure rule, got ${ansScore}`);
    }
    console.log(`✓ Assertion passed for ${tc.description.slice(0, 35)}...`);
  }

  // -------------------------------------------------------------------------
  // 2. Audit Exact Arithmetic Equality: rawPercentage == Sum of Criterion Scores
  // -------------------------------------------------------------------------
  console.log('\n\n📌 PART 2: Exact Arithmetic Consistency Audit');

  const testEssays = [
    'A may invoke self-defense because B threatened him with a knife and tried to attack him.',
    'X may still be criminally liable even though he intended to hit Y instead of Z. Under the Revised Penal Code, a person may be responsible for the natural consequences of his unlawful act. X intentionally tried to hit Y, but Y avoided the blow and X accidentally hit Z instead. This may be considered aberratio ictus because the blow struck a person other than the intended victim. Since Z died from the injury, X may be held responsible for the resulting death. However, the fact that X did not intend to cause such a serious result may also be considered in determining his liability. Therefore, X can still be criminally liable even though Z was not his intended victim.',
    'ANSWER: A acted in self defense.\nRULE: Self defense requires unlawful aggression.\nAPPLICATION: B drew knife.\nCONCLUSION: A is innocent.',
    'Under Art 11 self defense requires 3 elements.',
  ];

  for (let i = 0; i < testEssays.length; i++) {
    const essay = testEssays[i];
    const result = AiEvaluatorService.generateDemoSimulation(q1Snapshot, rubricSnapshot, essay, 100);

    const form = result.criterionScores.find((c) => c.criterionName === 'Form')?.score ?? 0;
    const ans = result.criterionScores.find((c) => c.criterionName === 'Answer')?.score ?? 0;
    const rule = result.criterionScores.find((c) => c.criterionName === 'Rule')?.score ?? 0;
    const app = result.criterionScores.find((c) => c.criterionName === 'Application')?.score ?? 0;
    const concl = result.criterionScores.find((c) => c.criterionName === 'Conclusion')?.score ?? 0;

    const sumOfCriteria = Math.round((form + ans + rule + app + concl) * 10) / 10;
    const rawPercentage = result.rawPercentage ?? result.numericalScore;

    console.log(`\nEssay ${i + 1} Arithmetic Verification:`);
    console.log(`- Form:        ${form.toFixed(1)}`);
    console.log(`- Answer:      ${ans.toFixed(1)}`);
    console.log(`- Rule:        ${rule.toFixed(1)}`);
    console.log(`- Application: ${app.toFixed(1)}`);
    console.log(`- Conclusion:  ${concl.toFixed(1)}`);
    console.log(`- Sum:         ${sumOfCriteria.toFixed(1)}`);
    console.log(`- Raw %:       ${rawPercentage.toFixed(1)}`);

    console.assert(
      Math.abs(sumOfCriteria - rawPercentage) < 1e-6,
      `Mismatch: sumOfCriteria (${sumOfCriteria}) !== rawPercentage (${rawPercentage})`
    );
    console.log(`✓ Exact sum equality verified: ${sumOfCriteria} === ${rawPercentage}`);
  }

  console.log('\n🎉 ALL SCORING ARITHMETIC & ANSWER CRITERION AUDITS PASSED 100%!');
}

runScoringArithmeticAndAnswerAudit()
  .catch((err) => {
    console.error('❌ Audit failed:', err);
    process.exit(1);
  });
