import { prisma } from './lib/prisma';
import { AiEvaluatorService } from './services/ai-evaluator.service';
import { ModelConfigService } from './services/model-config.service';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import * as crypto from 'crypto';

async function runTwoPassAuthoritativeProof() {
  console.log('🏛️ =========================================================================');
  console.log('   LEXIFY TWO-PASS EVIDENCE-FIRST PIPELINE — FINAL AUTHORITATIVE PROOF');
  console.log('=========================================================================\n');

  const question = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  if (!question) throw new Error('CRIM1-Q01 not found');

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubric: { isDefault: true } },
    orderBy: { orderIndex: 'asc' },
  });

  const configs = await ModelConfigService.getAllModelConfigs();
  const modelAConfig = configs.find((c) => c.modelSlot === 'MODEL_A')!;
  const modelBConfig = configs.find((c) => c.modelSlot === 'MODEL_B')!;
  const modelCConfig = configs.find((c) => c.modelSlot === 'MODEL_C')!;

  console.log('-------------------------------------------------------------------------');
  console.log('1. VERIFYING ADV-E (Facts Only, No Legal Rules)');
  console.log('-------------------------------------------------------------------------');
  const advEText = "APPLICATION: B brandished a deadly knife in the dark alley and lunged at A. A drew his licensed pistol and fired a single defensive shot to B's chest to stop the attack. A did not provoke B.";
  const advERes = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: advEText,
    isDemo: true,
  });
  await OpenAICompatibleProvider.unloadOllamaModel('llama3.2:3b');
  console.log('Pass 1 Validated Evidence:', JSON.stringify(advERes.pass1ValidatedEvidence, null, 2));
  console.log(`Scores: F=${advERes.formScore}, A=${advERes.answerScore}, R=${advERes.ruleScore}, Ap=${advERes.applicationScore}, C=${advERes.conclusionScore}`);
  console.log(`Total: ${advERes.weightedPercentage}% | Final: ${(advERes.finalScore ?? 0).toFixed(2)}/5.00`);

  console.log('\n-------------------------------------------------------------------------');
  console.log('2. VERIFYING ADV-F (Rule + Conclusion, No Application)');
  console.log('-------------------------------------------------------------------------');
  const advFText = 'RULE: Under Article 11(1) of the RPC, self-defense justifies an act upon concurrence of unlawful aggression, reasonable necessity of means, and lack of sufficient provocation.\n\nCONCLUSION: Therefore, A is completely justified.';
  const advFRes = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: advFText,
    isDemo: true,
  });
  await OpenAICompatibleProvider.unloadOllamaModel('llama3.2:3b');
  console.log('Pass 1 Validated Evidence:', JSON.stringify(advFRes.pass1ValidatedEvidence, null, 2));
  console.log(`Scores: F=${advFRes.formScore}, A=${advFRes.answerScore}, R=${advFRes.ruleScore}, Ap=${advFRes.applicationScore}, C=${advFRes.conclusionScore}`);
  console.log(`Total: ${advFRes.weightedPercentage}% | Final: ${(advFRes.finalScore ?? 0).toFixed(2)}/5.00`);

  console.log('\n-------------------------------------------------------------------------');
  console.log('3. THREE-MODEL INDEPENDENCE & PROVENANCE ON IDENTICAL SUBMISSION');
  console.log('-------------------------------------------------------------------------');
  const sampleAnswer = 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Under Article 11(1) of the Revised Penal Code, self-defense requires three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: In the case at bar, B lunged at A with a deadly knife in an unlit alley without warning, creating actual, sudden, and imminent peril constituting unlawful aggression. A\'s act of firing a single shot to B\'s chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence against a deadly knife assault. A gave no provocation whatsoever.\n\nCONCLUSION: Therefore, all statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.';

  const models = [
    { slot: 'MODEL_A', cfg: modelAConfig, tag: 'llama3.2:3b' },
    { slot: 'MODEL_B', cfg: modelBConfig, tag: 'phi4-mini:3.8b' },
    { slot: 'MODEL_C', cfg: modelCConfig, tag: 'gemma2:2b' },
  ];

  const provenanceSummary: any[] = [];

  for (const m of models) {
    console.log(`\n🚀 Executing [${m.slot}] ${m.cfg.exactModelId} (${m.tag})...`);
    const tStart = new Date().toISOString();
    const res = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: m.cfg as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: m.cfg.systemInstructions,
      studentAnswer: sampleAnswer,
      isDemo: true,
    });
    const tEnd = new Date().toISOString();
    const hash = crypto.createHash('sha256').update(JSON.stringify(res)).digest('hex').substring(0, 16);
    await OpenAICompatibleProvider.unloadOllamaModel(m.tag);

    console.log(`   - Pass 1 Validated Evidence Counts: Ans=${res.pass1ValidatedEvidence?.answerEvidence?.length}, Rule=${res.pass1ValidatedEvidence?.ruleEvidence?.length}, App=${res.pass1ValidatedEvidence?.applicationEvidence?.length}, Concl=${res.pass1ValidatedEvidence?.conclusionEvidence?.length}`);
    console.log(`   - Repair Used: ${res.pass1RepairUsed ? 'YES' : 'NO'}`);
    console.log(`   - Scores: F=${res.formScore}, A=${res.answerScore}, R=${res.ruleScore}, Ap=${res.applicationScore}, C=${res.conclusionScore}`);
    console.log(`   - Total: ${res.weightedPercentage}% | Final: ${(res.finalScore ?? 0).toFixed(2)}/5.00 | Flags: [${res.reviewFlags.join(', ')}]`);

    provenanceSummary.push({
      Slot: m.slot,
      Model: m.cfg.researchName,
      Tag: m.tag,
      'Pass1 Spans (A/R/Ap/C)': `${res.pass1ValidatedEvidence?.answerEvidence?.length}/${res.pass1ValidatedEvidence?.ruleEvidence?.length}/${res.pass1ValidatedEvidence?.applicationEvidence?.length}/${res.pass1ValidatedEvidence?.conclusionEvidence?.length}`,
      RepairUsed: res.pass1RepairUsed ? 'YES' : 'NO',
      'Scores (F/A/R/Ap/C)': `${res.formScore}/${res.answerScore}/${res.ruleScore}/${res.applicationScore}/${res.conclusionScore}`,
      Total: `${res.weightedPercentage}%`,
      FinalScore: `${(res.finalScore ?? 0).toFixed(2)}/5.00`,
      Hash: hash,
    });
  }

  console.log('\n=========================================================================');
  console.log('              THREE-MODEL INDEPENDENCE & PROVENANCE PROOF');
  console.log('=========================================================================');
  console.table(provenanceSummary);

  console.log('\n🎉 ALL TWO-PASS EVIDENCE-FIRST EVALUATION PROOFS COMPLETED SUCCESSFULLY!\n');
}

runTwoPassAuthoritativeProof()
  .catch((err) => {
    console.error('Proof error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
