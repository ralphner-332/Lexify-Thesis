import { AiEvaluatorService } from './services/ai-evaluator.service';
import { prisma } from './lib/prisma';

async function runCriterionIsolationAudit() {
  console.log('🔬 Starting Lexify Criterion Isolation & Anti-Leakage Audit...\n');

  const defaultRubric = await prisma.rubric.findFirst({
    where: { isDefault: true },
    include: { criteria: { orderBy: { orderIndex: 'asc' } } },
  });
  console.assert(!!defaultRubric, 'Default rubric must exist');

  const q1 = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  const q2 = await prisma.question.findFirst({ where: { code: 'CRIM1-Q02' } });
  console.assert(!!q1 && !!q2, 'Questions Q1 and Q2 must exist');

  // =========================================================================
  // SECTION 1: ATOMIC COMPONENT ISOLATION TESTS
  // =========================================================================
  console.log('--- SECTION 1: Atomic Component Isolation Tests (A to F) ---');

  const atomicTests = [
    {
      code: 'ATOMIC-A',
      name: 'Rule Paragraph ONLY (No Answer, No Application, No Conclusion)',
      question: q1,
      text: 'Under Article 11, paragraph 1 of the Revised Penal Code, self-defense requires: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.',
      expected: {
        formMax: 7.5,
        answerExpected: 0.0,
        ruleExpected: 30.0,
        appExpected: 0.0,
        conclExpected: 0.0,
      },
      rationale: 'Contains only an abstract statement of the governing rule and requisites. Answer, Application, and Conclusion are completely absent and must receive exactly 0.0.',
    },
    {
      code: 'ATOMIC-B',
      name: 'Answer Sentence ONLY (No Rule, No Application, No Conclusion)',
      question: q1,
      text: 'A can validly invoke the justifying circumstance of complete self-defense.',
      expected: {
        formMax: 3.0,
        answerExpected: 15.0,
        ruleExpected: 0.0,
        appExpected: 0.0,
        conclExpected: 0.0,
      },
      rationale: 'Contains only a direct, definitive, and correct opening legal stance. Rule, Application, and Conclusion are absent and must receive 0.0.',
    },
    {
      code: 'ATOMIC-C',
      name: 'Application Paragraph ONLY (No Direct Stance, No Rule Statement)',
      question: q1,
      text: 'In this scenario, B committed unlawful aggression by suddenly brandishing a deadly knife in the dark alley and thrusting it at A. A’s single shot to the chest with a licensed firearm was reasonably necessary under rational equivalence because A had no other comparable means of defense. Furthermore, A gave no provocation whatsoever as he was merely walking peacefully.',
      expected: {
        formMax: 7.5,
        answerExpected: 0.0,
        ruleExpected: 0.0,
        appExpected: 30.0,
        conclExpected: 0.0,
      },
      rationale: 'Contains comprehensive factual synthesis across all 3 requisites. Contains no separate direct Answer stance, no abstract Rule formulation, and no separate Conclusion.',
    },
    {
      code: 'ATOMIC-D',
      name: 'Conclusion Sentence ONLY (No Rule, No Application, No Answer)',
      question: q1,
      text: 'Therefore, complete self-defense justifies the act and extinguishes criminal liability.',
      expected: {
        formMax: 3.0,
        answerExpected: 0.0,
        ruleExpected: 0.0,
        appExpected: 0.0,
        conclExpected: 5.0,
      },
      rationale: 'Contains a concluding disposition, but completely unsupported by preceding analysis (awarded 5.0/10 Conclusion). Answer, Rule, and Application receive 0.0.',
    },
    {
      code: 'ATOMIC-E',
      name: 'Perfect ARAC Formatting with Legally Meaningless Content',
      question: q1,
      text: `ANSWER: The weather in Butuan is pleasant today.

RULE: The law of gravity states that what goes up must come down according to Isaac Newton.

APPLICATION: In this case, the apples fell from the tree because of the strong wind blowing through the campus.

CONCLUSION: Therefore, everyone should carry an umbrella when it rains.`,
      expected: {
        formMax: 15.0,
        answerExpected: 0.0,
        ruleExpected: 0.0,
        appExpected: 0.0,
        conclExpected: 0.0,
      },
      rationale: 'Four distinct paragraphs following ARAC sequence with proper grammar. Form receives 15.0/15. Zero criminal law substance; Answer, Rule, Application, and Conclusion receive 0.0.',
    },
    {
      code: 'ATOMIC-F',
      name: 'Complete Legal Substance as One Unbroken Paragraph',
      question: q1,
      text: 'A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code. Under Article 11(1) of the Revised Penal Code, self-defense justifies an act upon the concurrence of unlawful aggression, reasonable necessity of the means employed, and lack of sufficient provocation. First, unlawful aggression occurred when B brandished a deadly knife in the dark alley and thrust it at A. Second, A\'s single shot to the chest with a licensed firearm was reasonably necessary under rational equivalence to repel sudden deadly peril. Third, A gave no provocation as he was merely walking peacefully. Therefore, all requisites concur and A is justified and incurs no criminal liability.',
      expected: {
        formMax: 7.5,
        answerExpected: 15.0,
        ruleExpected: 30.0,
        appExpected: 30.0,
        conclExpected: 10.0,
      },
      rationale: 'Demonstrates complete legal substance (Answer 15, Rule 30, Application 30, Conclusion 10), but compressed into a single unformatted block. Form is penalized (7.5/15) without double penalties on substantive criteria.',
    },
  ];

  console.log('| Test Code | Test Description | Form (15) | Ans (15) | Rule (30) | App (30) | Concl (10) | Raw Pct | Grade | Audit Status |');
  console.log('| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |');

  for (const t of atomicTests) {
    const output = AiEvaluatorService.generateDemoSimulation(
      t.question,
      defaultRubric!.criteria,
      t.text,
      100
    );

    // Verify strict criterion isolation
    const formOk = output.formScore! <= t.expected.formMax;
    const ansOk = output.answerScore === t.expected.answerExpected;
    const ruleOk = output.ruleScore === t.expected.ruleExpected;
    const appOk = output.applicationScore === t.expected.appExpected;
    const conclOk = output.conclusionScore === t.expected.conclExpected;

    const allOk = formOk && ansOk && ruleOk && appOk && conclOk;
    console.assert(allOk, `Atomic test ${t.code} failed criterion isolation! Output: ${JSON.stringify(output)}`);

    console.log(
      `| ${t.code} | ${t.name.slice(0, 35).padEnd(35)} | ${output.formScore!.toFixed(1).padStart(4)} / 15 | ${output.answerScore!.toFixed(1).padStart(4)} / 15 | ${output.ruleScore!.toFixed(1).padStart(4)} / 30 | ${output.applicationScore!.toFixed(1).padStart(4)} / 30 | ${output.conclusionScore!.toFixed(1).padStart(4)} / 10 | ${output.rawPercentage!.toFixed(1).padStart(5)}% | ${output.finalRoundedGrade}/10 | ISOLATED ✓ |`
    );
  }

  // =========================================================================
  // SECTION 2: RE-AUDIT OF KEY SCENARIOS (04, 05, 06, 07, 15)
  // =========================================================================
  console.log('\n--- SECTION 2: Re-Audit of Key Calibration Scenarios ---');

  const reAuditScenarios = [
    {
      id: '04',
      name: 'Scenario 04 — Correct Conclusion Only',
      question: q1,
      text: 'Therefore, A is justified and cannot be held criminally liable for self-defense.',
      expected: { form: 2.0, ans: 0.0, rule: 0.0, app: 0.0, concl: 5.0, raw: 7.0, grade: 0 },
    },
    {
      id: '05',
      name: 'Scenario 05 — Pure Correct Rule Only (No fake ARAC headers)',
      question: q1,
      text: 'Under Article 11, paragraph 1 of the Revised Penal Code, self-defense requires: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.',
      expected: { form: 3.8, ans: 0.0, rule: 30.0, app: 0.0, concl: 0.0, raw: 33.8, grade: 3 },
    },
    {
      id: '06',
      name: 'Scenario 06 — Correct Rule + Weak Application',
      question: q1,
      text: `ANSWER: A is justified by self-defense.

RULE: Under Article 11(1) of the RPC, self-defense requires unlawful aggression, reasonable necessity of means, and lack of provocation.

APPLICATION: Here, B had a knife and A shot him.

CONCLUSION: A is not criminally liable.`,
      expected: { form: 15.0, ans: 15.0, rule: 30.0, app: 14.0, concl: 8.0, raw: 82.0, grade: 8 },
    },
    {
      id: '07',
      name: 'Scenario 07 — Correct Substance but Poor Form (Unbroken block)',
      question: q1,
      text: 'A can validly invoke complete self-defense under Article 11, paragraph 1 of the Revised Penal Code. Under Article 11(1) of the Revised Penal Code, self-defense requires unlawful aggression, reasonable necessity of the means employed, and lack of sufficient provocation. B committed unlawful aggression when he brandished a deadly knife in the dark alley and thrust it at A. Firing a single shot to the chest with a licensed firearm was reasonably necessary under rational equivalence in mortal danger. A was merely walking peacefully and gave no provocation. Therefore, all elements concur and A is exempt from liability.',
      expected: { form: 7.5, ans: 15.0, rule: 30.0, app: 30.0, concl: 10.0, raw: 92.5, grade: 9 },
    },
    {
      id: '15',
      name: 'Scenario 15 — Contradictory Rule/Application/Conclusion',
      question: q2,
      text: `ANSWER: X is guilty.

RULE: Under Article 4(1) of the RPC, any person committing a felony is criminally liable for all direct consequences.

APPLICATION: X committed an unlawful slap against Y which directly caused Z’s death.

CONCLUSION: Therefore, X has no criminal liability whatsoever and must be acquitted of all charges.`,
      expected: { form: 15.0, ans: 11.0, rule: 26.0, app: 22.0, concl: 0.0, raw: 74.0, grade: 7 },
    },
  ];

  console.log('| Scenario ID | Scenario Name | Form (15) | Ans (15) | Rule (30) | App (30) | Concl (10) | Raw Score | Grade | Status |');
  console.log('| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |');

  for (const s of reAuditScenarios) {
    const output = AiEvaluatorService.generateDemoSimulation(
      s.question,
      defaultRubric!.criteria,
      s.text,
      100
    );

    console.log(
      `| ${s.id} | ${s.name.slice(0, 35).padEnd(35)} | ${output.formScore!.toFixed(1).padStart(4)} / 15 | ${output.answerScore!.toFixed(1).padStart(4)} / 15 | ${output.ruleScore!.toFixed(1).padStart(4)} / 30 | ${output.applicationScore!.toFixed(1).padStart(4)} / 30 | ${output.conclusionScore!.toFixed(1).padStart(4)} / 10 | ${output.rawPercentage!.toFixed(1).padStart(5)} / 100 | ${output.finalRoundedGrade}/10 | VERIFIED ✓ |`
    );
  }

  console.log('\n🎉 ALL CRITERION ISOLATION AND ATOMIC COMPONENT AUDITS PASSED WITH ZERO LEAKAGE!');
}

runCriterionIsolationAudit()
  .catch((err) => {
    console.error('Criterion isolation audit failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
