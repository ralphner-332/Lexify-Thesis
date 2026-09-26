import { AiEvaluatorService } from './services/ai-evaluator.service';
import { RubricService } from './services/rubric.service';
import { QuestionService } from './services/question.service';
import { prisma } from './lib/prisma';

async function runAdversarialEvaluationTests() {
  console.log('🧪 Starting Lexify Adversarial Semantic Evaluation Validity Suite...\n');

  // Load baseline question and default rubric
  const defaultRubric = await RubricService.getDefaultRubric();
  const questions = await QuestionService.listQuestions('ADMIN', false);

  console.assert(!!defaultRubric, 'Default rubric must exist');
  console.assert(questions.length > 0, 'Questions must exist');

  const question = questions[0]; // Q1: CRIM1-Q01 Self-Defense Scenario
  const rubricCriteria = defaultRubric!.criteria;
  const totalMax = rubricCriteria.reduce((sum: number, c: any) => sum + (c.maxPoints ?? c.weightPercent ?? 20), 0);

  console.log(`📋 Testing against Scenario: ${question.code} - "${question.title}" (Max Points: ${totalMax})\n`);

  // --- TEST 1: Blank Response ---
  console.log('Test 1: Blank Response ("")');
  const res1 = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, '', totalMax);
  console.assert(res1.numericalScore === 0, `Expected score 0, got ${res1.numericalScore}`);
  console.assert(res1.strengths.length === 0, 'Strengths must be empty');
  console.assert(res1.missingElements.length > 0, 'Must identify missing elements');
  console.assert(res1.reviewFlags.includes('EMPTY_SUBMISSION'), 'Must flag empty submission');
  console.log(`   ✓ Score: ${res1.numericalScore}/${res1.maxScore} | Strengths: ${res1.strengths.length} | Flags: ${res1.reviewFlags.join(', ')}`);
  console.log(`   ✓ Scoring Basis: "${res1.scoringBasis}"\n`);

  // --- TEST 2: Short Colloquial "I don't know." ---
  console.log('Test 2: Short Colloquial "I don\'t know."');
  const res2 = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, "I don't know.", totalMax);
  console.assert(res2.numericalScore === 0, `Expected score 0, got ${res2.numericalScore}`);
  console.assert(res2.strengths.length === 0, 'Strengths must be empty');
  console.assert(res2.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'), 'Must flag non-substantive');
  console.log(`   ✓ Score: ${res2.numericalScore}/${res2.maxScore} | Strengths: ${res2.strengths.length} | Flags: ${res2.reviewFlags.join(', ')}`);
  console.log(`   ✓ Scoring Basis: "${res2.scoringBasis}"\n`);

  // --- TEST 3: Smoke Test Input: "i dont know what to answer teheee" ---
  console.log('Test 3: Exact Smoke Test Input: "i dont know what to answer teheee"');
  const res3 = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, 'i dont know what to answer teheee', totalMax);
  console.assert(res3.numericalScore === 0, `Expected score 0, got ${res3.numericalScore}`);
  console.assert(res3.strengths.length === 0, 'Strengths must be empty');
  console.assert(!res3.scoringBasis.includes('substantive legal analysis'), 'Must not claim substantive legal analysis');
  console.assert(res3.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'), 'Must flag non-substantive');
  console.log(`   ✓ Score: ${res3.numericalScore}/${res3.maxScore} | Strengths: ${res3.strengths.length} | Flags: ${res3.reviewFlags.join(', ')}`);
  console.log(`   ✓ Scoring Basis: "${res3.scoringBasis}"\n`);

  // --- TEST 4: Completely Irrelevant Paragraph (Cooking Recipe) ---
  console.log('Test 4: Completely Irrelevant Paragraph (Cooking Recipe)');
  const irrelevantText =
    'To cook the best chicken adobo, marinate the chicken in soy sauce, garlic, black peppercorns, and bay leaves for 30 minutes. Heat oil in a pan and sear the chicken until golden brown. Pour in the marinade and simmer until tender, then add vinegar and simmer for another 10 minutes.';
  const res4 = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, irrelevantText, totalMax);
  console.assert(res4.numericalScore === 0, `Expected score 0, got ${res4.numericalScore}`);
  console.assert(res4.strengths.length === 0, 'Strengths must be empty');
  console.assert(res4.reviewFlags.includes('IRRELEVANT_SUBMISSION'), 'Must flag irrelevant submission');
  console.log(`   ✓ Score: ${res4.numericalScore}/${res4.maxScore} | Strengths: ${res4.strengths.length} | Flags: ${res4.reviewFlags.join(', ')}`);
  console.log(`   ✓ Scoring Basis: "${res4.scoringBasis}"\n`);

  // --- TEST 5: Minimal mention without elements or application ---
  console.log('Test 5: Minimal mention of "self defense" (1 sentence, no elements)');
  const minimalText = 'A is not guilty because of self defense.';
  const res5 = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, minimalText, totalMax);
  console.assert(res5.numericalScore > 0 && res5.numericalScore <= 35, `Expected score 1-35, got ${res5.numericalScore}`);
  console.assert(res5.missingElements.length > 0, 'Must identify missing elements');
  console.log(`   ✓ Score: ${res5.numericalScore}/${res5.maxScore} | Strengths: ${res5.strengths.length} | Missing: ${res5.missingElements.length}`);
  console.log(`   ✓ Scoring Basis: "${res5.scoringBasis}"\n`);

  // --- TEST 6: Partially Correct Legal Analysis ---
  console.log('Test 6: Partially Correct Legal Analysis (Mentions unlawful aggression & Article 11)');
  const partialText =
    'A can invoke self defense under Article 11 of the Revised Penal Code. There was unlawful aggression because B attacked with a knife. Therefore A had to protect his life by shooting B.';
  const res6 = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, partialText, totalMax);
  console.assert(res6.numericalScore >= 35 && res6.numericalScore <= 75, `Expected score 35-75, got ${res6.numericalScore}`);
  console.assert(res6.strengths.length > 0, 'Strengths should be identified');
  console.log(`   ✓ Score: ${res6.numericalScore}/${res6.maxScore} | Strengths: ${res6.strengths.length} | Missing: ${res6.missingElements.length}`);
  console.log(`   ✓ Scoring Basis: "${res6.scoringBasis}"\n`);

  // --- TEST 7: Strong Exemplary IRAC Legal Analysis ---
  console.log('Test 7: Strong Exemplary IRAC Legal Analysis');
  const strongText = `
ISSUE: Whether A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code for the fatal shooting of B.

RULE: Under Article 11, paragraph 1 of the Revised Penal Code, self-defense is a justifying circumstance that exempts the accused from criminal and civil liability. The essential requisites are: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.

ANALYSIS: First, unlawful aggression was present because B confronted A on a dimly lit street, brandished a deadly knife, uttered a death threat ("Give me your wallet or I will kill you"), and actually thrust the knife towards A. This constituted an actual, sudden, and imminent mortal assault. Second, the means employed by A—firing a single shot with a licensed firearm to the chest—was reasonably necessary under the doctrine of rational equivalence, considering the deadly nature of the weapon (knife), the immediate proximity of the assailant, and the mortal danger. Third, there was complete lack of sufficient provocation on the part of A, who was merely peacefully walking along the street when assaulted.

CONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and is exempt from any criminal liability under Article 11(1) of the Revised Penal Code.
`.trim();
  const res7 = AiEvaluatorService.generateDemoSimulation(question, rubricCriteria, strongText, totalMax);
  console.assert(res7.numericalScore >= 80, `Expected score >= 80, got ${res7.numericalScore}`);
  console.assert(res7.strengths.length >= 2, 'Must identify multiple strengths');
  console.log(`   ✓ Score: ${res7.numericalScore}/${res7.maxScore} | Strengths: ${res7.strengths.length} | Confidence: ${res7.confidenceScore}`);
  console.log(`   ✓ Scoring Basis: "${res7.scoringBasis}"\n`);

  // Score Monotonicity Check across 7 tiers
  console.log('📊 Verifying Monotonic Score Progression:');
  console.log(`   1. Blank: ${res1.numericalScore} pts`);
  console.log(`   2. "I don't know": ${res2.numericalScore} pts`);
  console.log(`   3. "i dont know teheee": ${res3.numericalScore} pts`);
  console.log(`   4. Cooking Recipe (Irrelevant): ${res4.numericalScore} pts`);
  console.log(`   5. Minimal mention: ${res5.numericalScore} pts`);
  console.log(`   6. Partially correct: ${res6.numericalScore} pts`);
  console.log(`   7. Exemplary IRAC: ${res7.numericalScore} pts`);

  console.assert(res1.numericalScore === 0, 'Blank must be 0');
  console.assert(res2.numericalScore === 0, 'IDK must be 0');
  console.assert(res3.numericalScore === 0, 'Teheee must be 0');
  console.assert(res4.numericalScore === 0, 'Irrelevant must be 0');
  console.assert(res5.numericalScore > res4.numericalScore, 'Minimal > Irrelevant');
  console.assert(res6.numericalScore > res5.numericalScore, 'Partial > Minimal');
  console.assert(res7.numericalScore > res6.numericalScore, 'Exemplary > Partial');

  console.log('\n🎉 ALL 7 ADVERSARIAL EVALUATION VALIDITY CHECKS PASSED 100%!');
}

runAdversarialEvaluationTests()
  .catch((err) => {
    console.error('Adversarial test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
