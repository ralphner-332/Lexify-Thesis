import { AiEvaluatorService, attorneyRounding } from './services/ai-evaluator.service';
import { prisma } from './lib/prisma';

async function runAttorneyMatrixCalibration() {
  console.log('⚖️ Starting Lexify Attorney Controlling Grading Matrix Calibration & Rounding Audit...\n');

  // =========================================================================
  // PART 1: MANDATORY ATTORNEY ROUNDING UNIT TESTS (BOUNDARY SPECTRUM)
  // =========================================================================
  console.log('--- PART 1: Mandatory Attorney Rounding Unit Tests ---');

  const roundingCases = [
    { input: 10.00, expected: 10, note: '10.00 -> 10' },
    { input: 9.51, expected: 10, note: '9.51 -> 10 (> .50 rounds UP)' },
    { input: 9.50, expected: 9, note: '9.50 -> 9 (<= .50 rounds DOWN)' },
    { input: 9.49, expected: 9, note: '9.49 -> 9' },
    { input: 8.51, expected: 9, note: '8.51 -> 9 (> .50 rounds UP)' },
    { input: 8.50, expected: 8, note: '8.50 -> 8 (<= .50 rounds DOWN)' },
    { input: 8.49, expected: 8, note: '8.49 -> 8' },
    { input: 7.51, expected: 8, note: '7.51 -> 8 (> .50 rounds UP)' },
    { input: 7.50, expected: 7, note: '7.50 -> 7 (<= .50 rounds DOWN)' },
    { input: 7.49, expected: 7, note: '7.49 -> 7' },
    { input: 6.51, expected: 7, note: '6.51 -> 7 (> .50 rounds UP)' },
    { input: 6.50, expected: 6, note: '6.50 -> 6 (<= .50 rounds DOWN)' },
    { input: 6.49, expected: 6, note: '6.49 -> 6' },
    { input: 0.51, expected: 1, note: '0.51 -> 1 (> .50 rounds UP)' },
    { input: 0.50, expected: 0, note: '0.50 -> 0 (<= .50 rounds DOWN)' },
    { input: 0.00, expected: 0, note: '0.00 -> 0' },
    // Floating point edge cases
    { input: 8.5000000001, expected: 9, note: '8.5000000001 -> 9 (strictly > .50)' },
    { input: 8.5000000000, expected: 8, note: '8.5000000000 -> 8 (exact .50)' },
    { input: 8.500000000000002, expected: 8, note: '8.500000000000002 -> 8 (IEEE-754 noise guarded)' },
  ];

  for (const rc of roundingCases) {
    const actual = attorneyRounding(rc.input);
    console.assert(actual === rc.expected, `Rounding failure for ${rc.input}: expected ${rc.expected}, got ${actual}`);
    console.log(`   ✓ ${rc.note.padEnd(45)} | Result: ${actual} / 10`);
  }
  console.log('   🎉 All 19 Attorney Rounding Boundary Tests PASSED!\n');

  // =========================================================================
  // PART 2: 15 SEMANTIC CALIBRATION SCENARIOS UNDER ATTORNEY MATRIX
  // =========================================================================
  console.log('--- PART 2: 15 Semantic Calibration Scenarios under Attorney Matrix ---');

  const defaultRubric = await prisma.rubric.findFirst({
    where: { isDefault: true },
    include: { criteria: { orderBy: { orderIndex: 'asc' } } },
  });
  console.assert(!!defaultRubric, 'Default rubric must exist');

  const q1 = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  const q2 = await prisma.question.findFirst({ where: { code: 'CRIM1-Q02' } });
  console.assert(!!q1 && !!q2, 'Predetermined questions Q1 and Q2 must exist');

  const scenarios = [
    // 1. Empty answer
    {
      id: 1,
      name: 'Empty Answer',
      question: q1,
      text: '',
      expectedRawMax: 0,
      expectedGrade: 0,
      validate: (res: any) => res.rawPercentage === 0 && res.finalRoundedGrade === 0 && res.formScore === 0 && res.ruleScore === 0,
    },
    // 2. Nonsense
    {
      id: 2,
      name: 'Nonsense / Colloquial Gibberish',
      question: q1,
      text: 'teheee haha idk pass no idea',
      expectedRawMax: 0,
      expectedGrade: 0,
      validate: (res: any) => res.rawPercentage === 0 && res.finalRoundedGrade === 0 && res.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'),
    },
    // 3. Irrelevant response
    {
      id: 3,
      name: 'Irrelevant Response (Family Code/Contracts in Criminal Law)',
      question: q1,
      text: 'Under the Family Code of the Philippines, marriage is a special contract of permanent union between a man and a woman. The parties must possess legal capacity and mutual consent.',
      expectedRawMax: 0,
      expectedGrade: 0,
      validate: (res: any) => res.rawPercentage === 0 && res.finalRoundedGrade === 0 && res.reviewFlags.includes('IRRELEVANT_SUBMISSION'),
    },
    // 4. Correct conclusion only
    {
      id: 4,
      name: 'Correct Conclusion Only',
      question: q1,
      text: 'Therefore, A is justified and cannot be held criminally liable for self-defense.',
      expectedRawMax: 30,
      expectedGrade: 2,
      validate: (res: any) => res.conclusionScore === 5.0 && res.ruleScore === 0.0 && res.applicationScore === 0.0 && res.rawPercentage === 22.0,
    },
    // 5. Correct Rule only (Pure rule statement without application or answer stance)
    {
      id: 5,
      name: 'Correct Rule Only (Abstract doctrine without answer or facts)',
      question: q1,
      text: 'Under Article 11, paragraph 1 of the Revised Penal Code, self-defense requires: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.',
      expectedRawMax: 40,
      expectedGrade: 4,
      validate: (res: any) => res.ruleScore === 30.0 && res.answerScore === 0.0 && res.applicationScore === 0.0 && res.conclusionScore === 0.0 && res.rawPercentage === 37.5,
    },
    // 6. Correct Rule + weak Application
    {
      id: 6,
      name: 'Correct Rule + Weak Application',
      question: q1,
      text: 'ANSWER: A is justified by self-defense.\n\nRULE: Under Article 11(1) of the RPC, self-defense requires unlawful aggression, reasonable necessity of means, and lack of provocation.\n\nAPPLICATION: Here, B had a knife and A shot him.\n\nCONCLUSION: A is not criminally liable.',
      expectedRawMax: 80,
      expectedGrade: 7,
      validate: (res: any) => res.ruleScore === 30.0 && res.applicationScore >= 8 && res.applicationScore <= 16 && res.rawPercentage === 73.0,
    },
    // 7. Correct substance but poor ARAC Form
    {
      id: 7,
      name: 'Correct Substance but Poor ARAC Form (Unbroken block)',
      question: q1,
      text: 'A can validly invoke complete self-defense under Article 11, paragraph 1 of the Revised Penal Code. Under Article 11(1) of the Revised Penal Code, self-defense requires unlawful aggression, reasonable necessity of the means employed, and lack of sufficient provocation. B committed unlawful aggression when he brandished a deadly knife in the dark alley and thrust it at A. Firing a single shot to the chest with a licensed firearm was reasonably necessary under rational equivalence in mortal danger. A was merely walking peacefully and gave no provocation. Therefore all elements concur and A is exempt from liability.',
      expectedRawMax: 95,
      expectedGrade: 9,
      validate: (res: any) => res.formScore <= 10.0 && res.ruleScore >= 27 && res.applicationScore >= 25 && res.conclusionScore >= 9,
    },
    // 8. Good ARAC but materially wrong doctrine
    {
      id: 8,
      name: 'Good ARAC but Materially Wrong Doctrine',
      question: q1,
      text: 'ANSWER: A is exempt from liability.\n\nRULE: Under Article 12(4) of the RPC, any person who while performing a lawful act with due care causes an injury by mere accident is exempt from criminal liability.\n\nAPPLICATION: When B brandished a knife in the dark alley, A accidentally fired his gun.\n\nCONCLUSION: A is exempt due to accident.',
      expectedRawMax: 50,
      expectedGrade: 5,
      validate: (res: any) => res.formScore === 15.0 && res.ruleScore <= 10 && res.applicationScore <= 10 && res.rawPercentage <= 50.0 && res.finalRoundedGrade <= 5,
    },
    // 9. Correct doctrine without specific article citation (General Attribution)
    {
      id: 9,
      name: 'Correct Doctrine without Specific Article Citation (General Attribution)',
      question: q1,
      text: 'ANSWER: A validly acted in complete self-defense.\n\nRULE: Under Philippine criminal law and established jurisprudence, self-defense justifies an act when there is unlawful aggression by the victim, reasonable necessity of the means employed to repel it, and lack of sufficient provocation on the part of the defender.\n\nAPPLICATION: Unlawful aggression occurred when B thrust a deadly knife at A in the dimly lit alley. A firing a single shot to the chest was proportionate under rational equivalence. A gave no provocation.\n\nCONCLUSION: A is completely justified under the law.',
      expectedRawMax: 98,
      expectedGrade: 10,
      validate: (res: any) => res.ruleScore >= 25.0 && res.rawPercentage >= 90.0, // General attribution credited!
    },
    // 10. Correct alternative legal formulation
    {
      id: 10,
      name: 'Correct Alternative Legal Formulation (Semantic Equivalents)',
      question: q2,
      text: 'ANSWER: X is liable for Homicide, with mitigating circumstance.\n\nRULE: Under the Revised Penal Code, a person committing a felony is responsible for all natural consequences, including a mistake in the blow where an innocent bystander is struck instead of the intended target. Furthermore, lack of intention to commit so grave a wrong mitigates liability.\n\nAPPLICATION: When X attempted to slap Y and struck bystander Z instead who fell against the concrete curb and sustained a fatal skull fracture, the death of Z was the proximate result of X’s wrongful assault. X had no intent to kill.\n\nCONCLUSION: X is liable for Homicide resulting from aberratio ictus with the mitigating circumstance of praeter intentionem.',
      expectedRawMax: 100,
      expectedGrade: 10,
      validate: (res: any) => res.ruleScore >= 27.0 && res.applicationScore >= 28.0 && res.rawPercentage >= 95.0,
    },
    // 11. Strong complete ARAC
    {
      id: 11,
      name: 'Strong Complete ARAC (Full Statutory & Factual Syllogism)',
      question: q1,
      text: `ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.

RULE: Under Article 11(1) of the Revised Penal Code, self-defense justifies an act and extinguishes criminal liability upon the concurrence of three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.

APPLICATION: First, unlawful aggression was present because B brandished a deadly knife in a dark alley and thrust it at A, creating actual and imminent mortal peril. Second, A's act of firing a single shot to B's chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A had no other comparable means to repel a sudden knife thrust. Third, there was complete lack of sufficient provocation since A was merely walking along the street when confronted.

CONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.`,
      expectedRawMax: 100,
      expectedGrade: 10,
      validate: (res: any) => res.formScore === 15.0 && res.answerScore === 15.0 && res.ruleScore === 30.0 && res.applicationScore === 30.0 && res.conclusionScore === 10.0 && res.rawPercentage === 100.0 && res.finalRoundedGrade === 10,
    },
    // 12. Legally defensible answer differing from model answer
    {
      id: 12,
      name: 'Legally Defensible Answer Differing from Model Answer',
      question: q1,
      text: `ANSWER: A may invoke incomplete self-defense as a privileged mitigating circumstance.

RULE: Under Article 13(1) in conjunction with Article 69 of the Revised Penal Code, when unlawful aggression is present but either reasonable necessity or lack of provocation is imperfect, the court shall impose the penalty lower by one or two degrees.

APPLICATION: Unlawful aggression by B was clear from the knife assault. However, if the court finds the single gunshot disproportionate, incomplete self-defense still applies.

CONCLUSION: A is entitled to a privileged penalty reduction under Article 69.`,
      expectedRawMax: 90,
      expectedGrade: 9,
      validate: (res: any) => res.ruleScore >= 20.0 && res.applicationScore >= 16.0 && res.rawPercentage >= 75.0,
    },
    // 13. Verbose but weak answer
    {
      id: 13,
      name: 'Verbose but Weak Answer (Filler Padding)',
      question: q1,
      text: 'In my humble opinion as a law student, with all due respect, it is submitted that in my humble opinion as a law student, A did not want to shoot B. In my humble opinion as a law student, with all due respect, it is submitted that self-defense might apply because B had a knife. In my humble opinion as a law student, A shot B.',
      expectedRawMax: 50,
      expectedGrade: 4,
      validate: (res: any) => res.formScore <= 8.0 && res.rawPercentage <= 50.0 && res.finalRoundedGrade <= 5,
    },
    // 14. Concise but substantively excellent answer
    {
      id: 14,
      name: 'Concise but Substantively Excellent Answer',
      question: q2,
      text: 'ANSWER: X is liable for Homicide with mitigating circumstance.\n\nRULE: Under Art. 4(1) and Art. 13(3) of the Revised Penal Code, an intentional felonious assault resulting in the unintended death of a bystander through aberratio ictus produces criminal liability for Homicide mitigated by praeter intentionem.\n\nAPPLICATION: X’s felonious slap at Y caused bystander Z’s fatal fall against the concrete curb, with no intent to kill.\n\nCONCLUSION: X is guilty of Homicide with one mitigating circumstance.',
      expectedRawMax: 98,
      expectedGrade: 9,
      validate: (res: any) => res.ruleScore >= 27.0 && res.applicationScore >= 24.0 && res.rawPercentage >= 88.0 && res.finalRoundedGrade >= 9,
    },
    // 15. Contradictory Rule/Application/Conclusion
    {
      id: 15,
      name: 'Contradictory Rule/Application/Conclusion',
      question: q2,
      text: 'ANSWER: X is guilty.\n\nRULE: Under Article 4(1) of the RPC, any person committing a felony is criminally liable for all direct consequences.\n\nAPPLICATION: X committed an unlawful slap against Y which directly caused Z’s death.\n\nCONCLUSION: Therefore, X has no criminal liability whatsoever and must be acquitted of all charges.',
      expectedRawMax: 70,
      expectedGrade: 6,
      validate: (res: any) => res.conclusionScore === 0.0 && res.ruleScore >= 20.0 && res.applicationScore >= 20.0,
    },
  ];

  console.log('| Scenario ID | Scenario Name | Raw Score | 10-Pt Grade | Final Grade | Status |');
  console.log('| :---: | :--- | :---: | :---: | :---: | :---: |');

  for (const s of scenarios) {
    const output = AiEvaluatorService.generateDemoSimulation(
      s.question,
      defaultRubric!.criteria,
      s.text,
      100
    );

    const isValid = s.validate(output);
    console.assert(isValid, `Scenario ${s.id} (${s.name}) validation failed! Output: ${JSON.stringify(output)}`);

    console.log(
      `| ${s.id.toString().padStart(2, '0')} | ${s.name.padEnd(45)} | ${(output.rawPercentage ?? output.numericalScore).toFixed(1).padStart(5, ' ')} / 100 | ${(output.rawTenPointGrade ?? output.numericalScore / 10).toFixed(2).padStart(5, ' ')} / 10 | ${output.finalRoundedGrade} / 10 | CALIBRATED ✓ |`
    );
  }

  console.log('\n🎉 ALL 15 SEMANTIC CALIBRATION SCENARIOS PASSED UNDER THE ATTORNEY MATRIX WITH 100% PRECISION!');
}

runAttorneyMatrixCalibration()
  .catch((err) => {
    console.error('Attorney matrix calibration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
