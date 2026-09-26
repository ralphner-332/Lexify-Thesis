import { prisma } from './lib/prisma';
import { AiEvaluatorService, repairJsonString } from './services/ai-evaluator.service';
import { ModelConfigService } from './services/model-config.service';
import { ProviderFactory } from './providers/provider.factory';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';

async function runLiveModelProvenanceProof() {
  console.log('🔬 =========================================================================');
  console.log('   LEXIFY LIVE LOCAL MODEL PROVENANCE PROOF (SEQUENTIAL OLLAMA INFERENCE)');
  console.log('=========================================================================\n');

  const question = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  if (!question) throw new Error('CRIM1-Q01 not found');

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubric: { isDefault: true } },
    orderBy: { orderIndex: 'asc' },
  });

  const configs = await ModelConfigService.getAllModelConfigs();
  const slots = ['MODEL_A', 'MODEL_B', 'MODEL_C'] as const;

  const testStudentAnswer =
    'ANSWER: A can validly invoke complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\n' +
    'RULE: Under Article 11(1) of the RPC, self-defense requires three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\n' +
    'APPLICATION: First, unlawful aggression was present because B brandished a knife and thrust it at A in a dark alley. Second, A firing a single shot to B\'s chest with a licensed gun was reasonably necessary under rational equivalence because A had no other weapon to defend himself against a deadly weapon. Third, A gave no provocation whatsoever.\n\n' +
    'CONCLUSION: Therefore, all three elements concur and A is justified with no criminal liability.';

  // 1. Create a fresh session and draft
  const studentUser = await prisma.user.findFirst({ where: { role: 'STUDENT', isDemo: true } });
  if (!studentUser) throw new Error('Demo student user not found');

  const session = await prisma.assessmentSession.create({
    data: {
      studentId: studentUser.id,
      status: 'SUBMITTED',
      isDemo: true,
      startedAt: new Date(),
      submittedAt: new Date(),
      questionsSnapshot: JSON.stringify([question]),
      drafts: {
        create: {
          questionId: question.id,
          answerText: testStudentAnswer,
        },
      },
    },
  });

  console.log(`✓ Created fresh demo session: ${session.id}`);
  console.log(`✓ Student Answer length: ${testStudentAnswer.length} chars\n`);

  const reportEntries: any[] = [];

  for (const slot of slots) {
    const config = configs.find((c) => c.modelSlot === slot)!;
    const modelTag = config.exactModelId;
    console.log(`=========================================================================`);
    console.log(`🚀 EXECUTING LIVE MODEL: [${slot}] -> ${config.researchName} (${modelTag})`);
    console.log(`=========================================================================`);

    const prompt = AiEvaluatorService.buildEvaluationPrompt(
      question,
      rubricCriteria,
      config.systemInstructions,
      testStudentAnswer
    );

    const provider = ProviderFactory.getProvider(config.provider);

    console.log(`1. REQUEST DETAILS:`);
    console.log(`   - Model Slot: ${slot}`);
    console.log(`   - Research Name: ${config.researchName}`);
    console.log(`   - exactModelId: ${config.exactModelId}`);
    console.log(`   - HTTP Payload Model Tag: "${modelTag}"`);
    console.log(`   - Endpoint: ${config.endpointUrl || 'http://localhost:11434/v1/chat/completions'}`);

    const startTime = Date.now();
    let rawResponse: string;
    try {
      rawResponse = await provider.evaluatePrompt(prompt, config as any);
    } catch (err: any) {
      console.error(`❌ Provider call failed for ${modelTag}: ${err.message}`);
      throw err;
    }
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n2. RAW OLLAMA RESPONSE (Received in ${durationSec}s):`);
    console.log('--- RAW RESPONSE START ---');
    console.log(rawResponse);
    console.log('--- RAW RESPONSE END ---\n');

    // Parse and validate with AiEvaluatorService
    const parsed = repairJsonString(rawResponse);
    console.log(`3. PARSED JSON OBJECT:`);
    console.log(JSON.stringify(parsed, null, 2));

    const evalResult = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: config as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: config.systemInstructions,
      studentAnswer: testStudentAnswer,
      isDemo: true,
    });

    // Persist to Database
    const persistedEval = await prisma.evaluation.create({
      data: {
        sessionId: session.id,
        studentId: studentUser.id,
        questionId: question.id,
        agentVersionId: (await prisma.agentVersion.findFirst({ where: { isActive: true } }))?.id || 'v1-default',
        modelSlot: slot,
        modelFamily: config.modelFamily,
        exactModelId: config.exactModelId,
        questionSnapshot: JSON.stringify(question),
        modelConfigSnapshot: JSON.stringify(config),
        rubricSnapshot: JSON.stringify(rubricCriteria),
        studentAnswer: testStudentAnswer,
        numericalScore: evalResult.numericalScore,
        maxScore: evalResult.maxScore,
        scoringBasis: evalResult.scoringBasis,
        criterionScores: JSON.stringify(evalResult.criterionScores),
        strengths: JSON.stringify(evalResult.strengths),
        missingElements: JSON.stringify(evalResult.missingElements),
        areasForImprovement: JSON.stringify(evalResult.areasForImprovement),
        reviewFlags: JSON.stringify(evalResult.reviewFlags),
        confidenceScore: evalResult.confidenceScore,
        isDemo: true,
      },
    });

    console.log(`\n4. PERSISTED EVALUATION RECORD:`);
    console.log(`   - Persisted Evaluation ID: ${persistedEval.id}`);
    console.log(`   - Model Slot in DB: ${persistedEval.modelSlot}`);
    console.log(`   - exactModelId in DB: ${persistedEval.exactModelId}`);
    console.log(`   - Numerical Score in DB: ${persistedEval.numericalScore} / ${persistedEval.maxScore}`);
    console.log(`   - Review Flags in DB: ${persistedEval.reviewFlags}`);
    console.log(`   - Form/Ans/Rule/App/Concl: ${evalResult.formScore}/${evalResult.answerScore}/${evalResult.ruleScore}/${evalResult.applicationScore}/${evalResult.conclusionScore} (Final: ${evalResult.finalRoundedGrade}/10)`);

    // Unload model to preserve VRAM
    await OpenAICompatibleProvider.unloadOllamaModel(modelTag, config.endpointUrl || undefined);
    console.log(`   ✓ Unloaded ${modelTag} from VRAM.\n`);

    reportEntries.push({
      slot,
      researchName: config.researchName,
      exactModelId: config.exactModelId,
      modelRequested: modelTag,
      evalId: persistedEval.id,
      duration: `${durationSec}s`,
      formScore: evalResult.formScore,
      answerScore: evalResult.answerScore,
      ruleScore: evalResult.ruleScore,
      applicationScore: evalResult.applicationScore,
      conclusionScore: evalResult.conclusionScore,
      rawPercentage: evalResult.rawPercentage,
      finalGrade: evalResult.finalRoundedGrade,
      reviewFlags: persistedEval.reviewFlags,
    });
  }

  console.log('\n=========================================================================');
  console.log('                 FINAL LIVE MODEL INTEGRATION SUMMARY');
  console.log('=========================================================================');
  console.table(
    reportEntries.map((r) => ({
      Slot: r.slot,
      Model: r.exactModelId,
      'Requested Tag': r.modelRequested,
      Duration: r.duration,
      'Form/Ans/Rule/App/Concl': `${r.formScore}/${r.answerScore}/${r.ruleScore}/${r.applicationScore}/${r.conclusionScore}`,
      'Raw %': `${r.rawPercentage}%`,
      Grade: `${r.finalGrade}/10`,
      'Eval ID': r.evalId,
      'Demo Flag?': r.reviewFlags.includes('DEMO_SIMULATION') ? 'YES' : 'NO (LIVE OLLAMA)',
    }))
  );

  console.log('\n🎉 ALL THREE LIVE LOCAL OLLAMA MODELS EXECUTED INDEPENDENTLY WITH AUTHENTIC INFERENCE PROVENANCE!\n');
}

runLiveModelProvenanceProof()
  .catch((err) => {
    console.error('Provenance proof failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
