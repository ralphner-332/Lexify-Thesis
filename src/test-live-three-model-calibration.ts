import { prisma } from './lib/prisma';
import { AiEvaluatorService } from './services/ai-evaluator.service';
import { ModelConfigService } from './services/model-config.service';

async function runLiveThreeModelAudit() {
  console.log('🤖 =========================================================================');
  console.log('   LEXIFY LIVE THREE-MODEL INDEPENDENT CALIBRATION AUDIT');
  console.log('   (MODEL_A: Llama 3.2 3B | MODEL_B: Phi-4-mini 3.8B | MODEL_C: Gemma 2 2B)');
  console.log('=========================================================================\n');

  const q1 = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  if (!q1) throw new Error('Question CRIM1-Q01 not found');

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubric: { isDefault: true } },
    orderBy: { orderIndex: 'asc' },
  });

  const configs = await ModelConfigService.getAllModelConfigs();
  const modelSlots = ['MODEL_A', 'MODEL_B', 'MODEL_C'] as const;

  const testAnswer =
    'ANSWER: A is justified under Article 11, paragraph 1 of the Revised Penal Code because he acted in complete self-defense.\n\n' +
    'RULE: Complete self-defense requires three concurring statutory elements: (1) Unlawful aggression; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the defender.\n\n' +
    'APPLICATION: Unlawful aggression existed when B attacked A with a deadly knife. A\'s single gunshot was reasonably necessary under rational equivalence because A had no other weapon in the dark alley. A gave no provocation.\n\n' +
    'CONCLUSION: Therefore, A is completely justified and incurs no criminal liability.';

  console.log('Evaluating controlled student answer across all 3 model slots sequentially:\n');

  for (const slot of modelSlots) {
    const config = configs.find((c) => c.modelSlot === slot)!;
    console.log(`📌 Evaluating on ${config.modelSlot} (${config.researchName} / ${config.exactModelId})...`);

    const result = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: q1,
      modelConfigSnapshot: config as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: config.systemInstructions,
      studentAnswer: testAnswer,
      isDemo: true,
    });

    console.log(`   [OUTPUT] Slot: ${slot} | Model: ${config.exactModelId}`);
    console.log(`   [CRITERIA] Form: ${result.formScore}/15 | Ans: ${result.answerScore}/15 | Rule: ${result.ruleScore}/30 | App: ${result.applicationScore}/30 | Concl: ${result.conclusionScore}/10`);
    console.log(`   [TOTALS] Computed Raw: ${result.rawPercentage}% | Numerical: ${result.numericalScore} | 10-Pt: ${result.rawTenPointGrade}/10 | Final Grade: ${result.finalRoundedGrade}/10`);
    console.log(`   [PROVENANCE] Review Flags: [${result.reviewFlags.join(', ')}] | Scoring Basis: "${result.scoringBasis.slice(0, 80)}..."`);
    console.log('   -------------------------------------------------------------------------');
  }

  console.log('\n🎉 ALL THREE MODELS EVALUATED SUCCESSFULLY UNDER THE AUTHORITATIVE ATTORNEY MATRIX!\n');
}

runLiveThreeModelAudit()
  .catch((err) => {
    console.error('Three-model audit failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
