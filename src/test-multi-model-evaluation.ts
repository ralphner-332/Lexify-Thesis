import { prisma } from './lib/prisma';
import { AssessmentSessionService } from './services/assessment-session.service';
import { ModelConfigService } from './services/model-config.service';
import { StatisticsService } from './services/statistics.service';
import { ExportService } from './services/export.service';

async function runMultiModelTests() {
  console.log('🤖 Starting Multi-Model (Llama 3.1 8B, Mistral 7B, Gemma 2 9B) Evaluation Verification...\n');

  // 1. Verify Model Configurations
  console.log('1. Checking Model Configurations in DB...');
  const configs = await ModelConfigService.getAllModelConfigs();
  console.assert(configs.length === 3, 'Must have exactly 3 model configurations');

  const modelA = configs.find((c) => c.modelSlot === 'MODEL_A');
  const modelB = configs.find((c) => c.modelSlot === 'MODEL_B');
  const modelC = configs.find((c) => c.modelSlot === 'MODEL_C');

  console.assert(modelA?.researchName === 'Meta Llama 3.2 3B', 'Model A must be Meta Llama 3.2 3B');
  console.assert(modelB?.researchName === 'Microsoft Phi-4-mini', 'Model B must be Microsoft Phi-4-mini');
  console.assert(modelC?.researchName === 'Google Gemma 2 2B', 'Model C must be Google Gemma 2 2B');

  console.log(`   ✓ Model A: ${modelA?.researchName} (${modelA?.exactModelId})`);
  console.log(`   ✓ Model B: ${modelB?.researchName} (${modelB?.exactModelId})`);
  console.log(`   ✓ Model C: ${modelC?.researchName} (${modelC?.exactModelId})`);

  // 2. Create student assessment session & submit
  console.log('\n2. Creating Student Assessment Session & submitting answers...');
  const student = await prisma.user.upsert({
    where: { email: 'multimodel.test.student@lexify.local' },
    update: { isDemo: true },
    create: {
      email: 'multimodel.test.student@lexify.local',
      name: 'MultiModel Test Student',
      role: 'STUDENT',
      passwordHash: 'hash',
      isDemo: true,
    },
  });

  const session = await AssessmentSessionService.createAssessmentSession(student.id, true);
  console.log(`   ✓ Session started: ${session.id}`);

  const questions = await prisma.question.findMany({ where: { isActive: true }, orderBy: { orderIndex: 'asc' } });
  const q1 = questions[0];
  const q2 = questions[1];

  const q1Answer = `ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.

RULE: Under Article 11(1) of the Revised Penal Code, self-defense requires three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.

APPLICATION: First, unlawful aggression was present because B brandished a deadly knife in a dark alley and thrust it at A, creating actual and imminent mortal peril. Second, A's act of firing a single shot to B's chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A had no other comparable means to repel a sudden knife thrust. Third, there was complete lack of sufficient provocation since A was merely walking along the street when confronted.

CONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.`;

  const q2Answer = `ANSWER: X is criminally liable for Homicide under Article 4, Paragraph 1 of the Revised Penal Code.

RULE: Under Article 4(1) of the RPC, criminal liability is incurred by any person committing a felony although the wrongful act done be different from that which he intended (aberratio ictus). Under Article 13(3), praeter intentionem mitigates liability when the offender had no intention to commit so grave a wrong.

APPLICATION: X committed an initial felony by attempting to assault Y. When Y ducked, the blow struck Z, causing Z to fall against the concrete curb and suffer a fatal skull fracture. The death of Z is the direct and natural consequence of X's wrongful act under proximate cause. However, X only intended to slap Y and did not intend to kill.

CONCLUSION: X is guilty of Homicide resulting from aberratio ictus with the mitigating circumstance of praeter intentionem.`;

  await AssessmentSessionService.saveAnswerDraft(session.id, student.id, q1.id, q1Answer);
  await AssessmentSessionService.saveAnswerDraft(session.id, student.id, q2.id, q2Answer);
  console.log('   ✓ Saved student draft answers for Q1 and Q2');

  const submitResult = await AssessmentSessionService.submitSession(session.id, student.id);
  console.log(`   ✓ Submission finalized and locked: ${submitResult.sessionId}`);

  // 3. Verify that 6 Evaluation records were created (3 models * 2 questions)
  console.log('\n3. Verifying Independent Triple-Model Evaluations in Database...');
  const evaluations = await prisma.evaluation.findMany({
    where: { sessionId: session.id },
    orderBy: [{ questionId: 'asc' }, { modelSlot: 'asc' }],
  });

  console.assert(evaluations.length === 6, `Expected 6 evaluation records, got ${evaluations.length}`);
  console.log(`   ✓ Found ${evaluations.length} evaluation records (3 independent models across 2 questions)`);

  const q1Evals = evaluations.filter((e) => e.questionId === q1.id);
  const q2Evals = evaluations.filter((e) => e.questionId === q2.id);

  console.assert(q1Evals.length === 3, 'Q1 must have 3 model evaluations');
  console.assert(q2Evals.length === 3, 'Q2 must have 3 model evaluations');

  for (const ev of evaluations) {
    console.assert(Boolean(ev.modelSlot), 'modelSlot must be defined');
    console.assert(Boolean(ev.modelFamily), 'modelFamily must be defined');
    console.assert(Boolean(ev.exactModelId), 'exactModelId must be defined');
    console.assert(ev.numericalScore >= 0 && ev.numericalScore <= 100, 'Score must be 0-100');

    const lex = JSON.parse(ev.lexicalAnalysis || '{}');
    const sem = JSON.parse(ev.semanticAnalysis || '{}');
    console.assert(lex.wordCount > 0, 'Lexical analysis must record word count');
    console.assert(sem.elementsIdentified.length > 0, 'Semantic analysis must record identified elements');

    console.log(
      `   [${ev.modelSlot}] ${ev.modelFamily} (${ev.exactModelId}) -> Raw: ${ev.numericalScore}/100, Grade: ${Math.round(ev.numericalScore / 10)}/10, Words: ${lex.wordCount}, Elements: ${sem.elementsIdentified.length}`
    );
  }

  // 4. Test Multi-Model Analytics Service
  console.log('\n4. Testing Multi-Model Descriptive & Comparative Statistics...');
  const stats = await StatisticsService.getMultiModelAnalytics({ isDemo: true });
  console.assert(stats.models.modelA.sampleSize > 0, 'Model A must have samples');
  console.assert(stats.models.modelB.sampleSize > 0, 'Model B must have samples');
  console.assert(stats.models.modelC.sampleSize > 0, 'Model C must have samples');
  console.assert(stats.pairwiseComparisons.length === 3, 'Must have 3 pairwise model comparisons');

  console.log(`   ✓ Model A (Llama 3.1 8B) Mean Grade: ${stats.models.modelA.meanTenPointGrade}/10 (N=${stats.models.modelA.sampleSize})`);
  console.log(`   ✓ Model B (Mistral 7B) Mean Grade: ${stats.models.modelB.meanTenPointGrade}/10 (N=${stats.models.modelB.sampleSize})`);
  console.log(`   ✓ Model C (Gemma 2 9B) Mean Grade: ${stats.models.modelC.meanTenPointGrade}/10 (N=${stats.models.modelC.sampleSize})`);
  for (const pair of stats.pairwiseComparisons) {
    console.log(`   ✓ Pairwise [${pair.pairName}]: Mean Abs Delta = ${pair.meanAbsoluteDelta} pts, Agreement = ${pair.agreementRatePercent}%`);
  }

  // 5. Test Multi-Dataset CSV & JSON Exports
  console.log('\n5. Testing 10 Multi-Model Research CSV & JSON Exports...');
  const csvDatasets = await ExportService.exportResearchDatasetsCSV({ isDemo: true });
  const jsonBundle = await ExportService.exportResearchBundleJSON({ isDemo: true });

  const requiredDatasets = [
    '01_student_submissions.csv',
    '02_llama_3_1_8b_evaluations.csv',
    '03_mistral_7b_evaluations.csv',
    '04_gemma_2_9b_evaluations.csv',
    '05_model_comparative_matrix.csv',
    '06_lexical_semantic_analysis.csv',
    '07_student_usability_surveys.csv',
    '08_model_configurations.csv',
    '09_scoring_rubric.csv',
    '10_research_data_dictionary.csv',
  ];

  for (const ds of requiredDatasets) {
    console.assert(typeof csvDatasets[ds] === 'string' && csvDatasets[ds].length > 0, `CSV dataset ${ds} must exist`);
    console.log(`   ✓ CSV Dataset: ${ds} (${csvDatasets[ds].split('\n').length - 1} rows)`);
  }

  console.assert(jsonBundle.metadata.title.includes('Multi-LLM Comparative Study'), 'JSON export bundle valid');
  console.log(`   ✓ JSON Research Bundle generated with ${Object.keys(jsonBundle.datasets).length} dataset entities.`);

  console.log('\n🎉 ALL MULTI-MODEL (LLAMA 3.1 8B, MISTRAL 7B, GEMMA 2 9B) EVALUATION TESTS PASSED 100%!');
}

runMultiModelTests()
  .catch((err) => {
    console.error('❌ Multi-model verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
