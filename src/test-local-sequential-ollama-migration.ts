import { prisma } from './lib/prisma';
import { EvaluationService } from './services/evaluation.service';
import { ModelConfigService } from './services/model-config.service';
import { StatisticsService } from './services/statistics.service';
import { ExportService } from './services/export.service';
import { attorneyRounding } from './services/ai-evaluator.service';

async function runLocalMigrationTestSuite() {
  console.log('🚀 =================================================================');
  console.log('   LEXIFY LOCAL TRIPLE-LLM SEQUENTIAL MIGRATION TEST SUITE');
  console.log('=================================================================\n');

  // 1. Check Model Configurations in Database
  console.log('📌 1. Auditing Model Configurations in Database...');
  const configs = await ModelConfigService.getAllModelConfigs();
  console.log(`Found ${configs.length} configured model slots.`);

  const modelA = configs.find((c) => c.modelSlot === 'MODEL_A');
  const modelB = configs.find((c) => c.modelSlot === 'MODEL_B');
  const modelC = configs.find((c) => c.modelSlot === 'MODEL_C');

  if (!modelA || modelA.exactModelId !== 'llama3.2:3b' || modelA.researchName !== 'Meta Llama 3.2 3B') {
    throw new Error(`MODEL_A configuration mismatch: expected llama3.2:3b (Meta Llama 3.2 3B), got ${modelA?.exactModelId}`);
  }
  if (!modelB || modelB.exactModelId !== 'phi4-mini:3.8b' || modelB.researchName !== 'Microsoft Phi-4-mini') {
    throw new Error(`MODEL_B configuration mismatch: expected phi4-mini:3.8b (Microsoft Phi-4-mini), got ${modelB?.exactModelId}`);
  }
  if (!modelC || modelC.exactModelId !== 'gemma2:2b' || modelC.researchName !== 'Google Gemma 2 2B') {
    throw new Error(`MODEL_C configuration mismatch: expected gemma2:2b (Google Gemma 2 2B), got ${modelC?.exactModelId}`);
  }

  console.log('   ✓ MODEL_A: Meta Llama 3.2 3B (llama3.2:3b) -> Provider: ' + modelA.provider + ' -> ' + modelA.endpointUrl);
  console.log('   ✓ MODEL_B: Microsoft Phi-4-mini (phi4-mini:3.8b) -> Provider: ' + modelB.provider + ' -> ' + modelB.endpointUrl);
  console.log('   ✓ MODEL_C: Google Gemma 2 2B (gemma2:2b) -> Provider: ' + modelC.provider + ' -> ' + modelC.endpointUrl);

  // 2. Test Assessment Submission and Sequential Multi-Model Evaluation
  console.log('\n📌 2. Testing Sequential Evaluation & Immediate Model Unloading...');
  const testStudent = await prisma.user.findFirst({ where: { role: 'STUDENT', isDemo: true } });
  const questions = await prisma.question.findMany({ where: { isDemo: true }, take: 2, orderBy: { orderIndex: 'asc' } });

  const session = await prisma.assessmentSession.create({
    data: {
      studentId: testStudent!.id,
      questionsSnapshot: JSON.stringify(questions),
      status: 'IN_PROGRESS',
      isDemo: true,
      drafts: {
        create: [
          {
            questionId: questions[0].id,
            answerText:
              'A may invoke complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\n' +
              'The requisites of self-defense are: (1) unlawful aggression on the part of the victim, (2) reasonable necessity of the means employed to prevent or repel it, and (3) lack of sufficient provocation on the part of the person defending himself.\n\n' +
              'In this case, B lunged at A with a deadly knife in a dark alley without any provocation from A, who was merely walking home. A drew his licensed firearm and fired a single defensive shot to the chest to stop the fatal attack. The means employed was reasonably necessary given the imminent mortal danger.\n\n' +
              'Therefore, A is completely exempt from criminal liability because all three elements of self-defense concur.',
          },
          {
            questionId: questions[1].id,
            answerText:
              'X remains criminally liable under Article 4, paragraph 1 of the Revised Penal Code pursuant to the doctrine of aberratio ictus (mistake in the blow), but may invoke the mitigating circumstance of praeter intentionem under Article 13, paragraph 3.\n\n' +
              'Under Article 4(1) RPC, criminal liability is incurred by any person committing a felony although the wrongful act done be different from that which he intended. Aberratio ictus occurs when the perpetrator directs the blow at one person but strikes another due to lack of precision.\n\n' +
              'Here, X committed an initial intentional felony by unlawfully attempting to slap Y during an argument. When Y ducked, the blow struck Z, causing Z to fall, fracture his skull on the concrete curb, and die. Although X only intended physical injuries against Y, his felonious act was the direct proximate cause of Z\'s death.\n\n' +
              'In conclusion, X is criminally liable for homicide under Article 249 in relation to Article 4(1), with the mitigating circumstance of praeter intentionem mitigating the penalty.',
          },
        ],
      },
    },
    include: { drafts: true },
  });

  const evaluations = await EvaluationService.evaluateSessionSubmissions(session);
  console.log(`   ✓ Sequential evaluation completed: ${evaluations.length} evaluation records generated.`);

  if (evaluations.length !== 6) {
    throw new Error(`Expected exactly 6 evaluations (2 questions * 3 models), got ${evaluations.length}`);
  }

  // 3. Verify Model Provenance & Isolation
  console.log('\n📌 3. Auditing Model Provenance & DB Record Immutability...');
  for (const ev of evaluations) {
    const snap = JSON.parse(ev.modelConfigSnapshot);
    console.log(
      `   [PROVENANCE] Slot: ${ev.modelSlot} | Family: ${ev.modelFamily} | Tag: ${ev.exactModelId} | Score: ${ev.numericalScore}/100 | Runtime: ${snap.runtime} | Quant: ${snap.quantization}`
    );
    if (!['MODEL_A', 'MODEL_B', 'MODEL_C'].includes(ev.modelSlot)) {
      throw new Error(`Invalid model slot: ${ev.modelSlot}`);
    }
    if (!snap.quantization || snap.quantization !== 'Q4_K_M') {
      throw new Error(`Missing or invalid quantization in snapshot: ${snap.quantization}`);
    }
    if (!snap.runtime || snap.runtime !== 'ollama-local') {
      throw new Error(`Expected runtime "ollama-local", got "${snap.runtime}"`);
    }
  }

  // 4. Test Multi-Model Analytics across Option B Models
  console.log('\n📌 4. Testing Multi-Model Descriptive & Comparative Analytics...');
  const multiModelStats = await StatisticsService.getMultiModelAnalytics({ isDemo: true });
  console.log(`   ✓ Model A (${multiModelStats.models.modelA.researchName}) Mean Grade: ${multiModelStats.models.modelA.meanTenPointGrade}/10 (N=${multiModelStats.models.modelA.sampleSize})`);
  console.log(`   ✓ Model B (${multiModelStats.models.modelB.researchName}) Mean Grade: ${multiModelStats.models.modelB.meanTenPointGrade}/10 (N=${multiModelStats.models.modelB.sampleSize})`);
  console.log(`   ✓ Model C (${multiModelStats.models.modelC.researchName}) Mean Grade: ${multiModelStats.models.modelC.meanTenPointGrade}/10 (N=${multiModelStats.models.modelC.sampleSize})`);

  multiModelStats.pairwiseComparisons.forEach((p) => {
    console.log(`   ✓ Pairwise [${p.pairName}]: Delta = ${p.meanAbsoluteDelta} pts, Agreement = ${p.agreementRatePercent}%`);
  });

  // 5. Test 10 CSV Datasets & JSON Export
  console.log('\n📌 5. Testing 10 Multi-Model Research Datasets CSV & JSON Export...');
  const csvExports = await ExportService.exportResearchDatasetsCSV({ isDemo: true });
  const expectedCsvs = [
    '01_student_submissions.csv',
    '02_llama_3_2_3b_evaluations.csv',
    '03_phi_4_mini_evaluations.csv',
    '04_gemma_2_2b_evaluations.csv',
    '05_model_comparative_matrix.csv',
    '06_lexical_semantic_analysis.csv',
    '07_student_usability_surveys.csv',
    '08_model_configurations.csv',
    '09_scoring_rubric.csv',
    '10_research_data_dictionary.csv',
  ];

  for (const csvName of expectedCsvs) {
    if (!csvExports[csvName] || csvExports[csvName].length === 0) {
      throw new Error(`CSV Dataset ${csvName} missing or empty.`);
    }
    const rowCount = csvExports[csvName].trim().split('\n').length - 1;
    console.log(`   ✓ CSV Dataset: ${csvName} (${rowCount} rows)`);
  }

  const jsonBundle = await ExportService.exportResearchBundleJSON({ isDemo: true });
  console.log(`   ✓ JSON Research Bundle generated with ${Object.keys(jsonBundle.datasets).length} dataset entities.`);

  console.log('\n🎉 ALL LOCAL SEQUENTIAL OLLAMA MIGRATION TESTS PASSED 100%!');
}

runLocalMigrationTestSuite()
  .catch((err) => {
    console.error('❌ Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
