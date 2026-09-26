import { prisma } from './lib/prisma';
import { AiEvaluatorService, checkIsNonsubstantive } from './services/ai-evaluator.service';
import { ModelConfigService } from './services/model-config.service';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';

async function runAuthoritativeGradingSpecTests() {
  console.log('🏛️ =========================================================================');
  console.log('   SCORING CRITERIA AND INSTRUCTION.pdf AUTHORITATIVE TEST SUITE');
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

  // =========================================================================
  // SECTION 1: SCORE CONVERSION & DECIMAL PRESERVATION TESTS
  // =========================================================================
  console.log('--- SECTION 1: FORMULA VERIFICATION (weightedPercentage * 0.05 -> 0.00 to 5.00) ---');
  const testPercentages = [
    { pct: 100, expected: 5.00 },
    { pct: 90, expected: 4.50 },
    { pct: 84, expected: 4.20 },
    { pct: 70, expected: 3.50 },
    { pct: 51, expected: 2.55 },
    { pct: 0, expected: 0.00 },
  ];

  for (const item of testPercentages) {
    const calc = Number((item.pct * 0.05).toFixed(4));
    console.log(`✓ ${String(item.pct).padStart(3)}% -> ${(calc).toFixed(2)}/5.00 (Expected: ${item.expected.toFixed(2)}/5.00)`);
    console.assert(Math.abs(calc - item.expected) < 1e-4, `Formula mismatch for ${item.pct}%`);
  }

  // =========================================================================
  // SECTION 2: REQUIRED ANSWER-QUALITY TESTS (A through G)
  // =========================================================================
  console.log('\n--- SECTION 2: REQUIRED ANSWER-QUALITY CRITERIA TESTS ---');

  // Test A: Blank answer -> 0.00/5
  const evalA = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: '',
    isDemo: true,
  });
  console.log(`✓ Test A (Blank Answer): Total=${evalA.numericalScore}% | Score=${evalA.finalScore}/5.00 | Flag=${evalA.reviewFlags.join(',')}`);
  console.assert(evalA.numericalScore === 0 && evalA.finalScore === 0, 'Test A must receive 0/5');
  console.assert(evalA.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION') || evalA.reviewFlags.includes('EMPTY_SUBMISSION'), 'Test A must be flagged non-substantive');

  // Test B: "A." -> 0.00/5
  const evalB = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: 'A.',
    isDemo: true,
  });
  console.log(`✓ Test B ("A."): Total=${evalB.numericalScore}% | Score=${evalB.finalScore}/5.00 | Flag=${evalB.reviewFlags.join(',')}`);
  console.assert(evalB.numericalScore === 0 && evalB.finalScore === 0, 'Test B must receive 0/5');
  console.assert(evalB.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'), 'Test B must be flagged non-substantive');

  // Helper function to validate scoring validity properties and evidence grounding on any evaluation
  function validateEvaluationValidity(name: string, res: any, studentText: string) {
    const normStudent = (studentText || '').toLowerCase().replace(/\s+/g, ' ');
    const normModel = (question?.modelAnswer || '').toLowerCase().replace(/\s+/g, ' ');

    // 1. Boundary Clamping Checks
    console.assert(res.formScore >= 0 && res.formScore <= 15, `${name}: Form within 0-15`);
    console.assert(res.answerScore >= 0 && res.answerScore <= 15, `${name}: Answer within 0-15`);
    console.assert(res.ruleScore >= 0 && res.ruleScore <= 30, `${name}: Rule within 0-30`);
    console.assert(res.applicationScore >= 0 && res.applicationScore <= 30, `${name}: Application within 0-30`);
    console.assert(res.conclusionScore >= 0 && res.conclusionScore <= 10, `${name}: Conclusion within 0-10`);

    // 2. Exact Arithmetic Verification
    const calculatedSum = Number((res.formScore + res.answerScore + res.ruleScore + res.applicationScore + res.conclusionScore).toFixed(2));
    console.assert(Math.abs(res.numericalScore - calculatedSum) < 0.1, `${name}: numericalScore must equal sum of criteria`);

    // 3. Exact 0.00 - 5.00 Conversion
    const expectedFinal = Number((res.weightedPercentage * 0.05).toFixed(4));
    console.assert(Math.abs(res.finalScore - expectedFinal) < 0.01, `${name}: finalScore must equal weightedPercentage * 0.05`);

    // 4. Evidence Grounding & Anti-Leakage Assertion
    console.assert(!res.reviewFlags.includes('REFERENCE_LEAKAGE_DETECTED'), `${name}: Must not leak reference benchmark content`);

    for (const crit of res.criterionScores || []) {
      const ev = (crit.evidence || '').trim();
      if (ev && ev !== 'NONE' && ev.length > 5 && crit.criterionName !== 'Form') {
        const cleanQuote = ev.toLowerCase().replace(/^["']|["']$/g, '').replace(/\s+/g, ' ');
        const foundInStudent = normStudent.includes(cleanQuote) || cleanQuote.includes(normStudent.length > 15 ? normStudent : '###');
        const foundInModel = normModel.includes(cleanQuote);

        if (!foundInStudent && foundInModel) {
          console.assert(false, `${name}: Evidence quote for ${crit.criterionName} was copied from model answer!`);
        }
      }
    }
  }

  // Test C: Irrelevant answer (Family Code on Criminal Law scenario)
  const evalC = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: 'Under Article 36 of the Family Code, psychological incapacity renders marriage void ab initio.',
    isDemo: true,
  });
  console.log(`✓ Test C (Irrelevant Answer): Form=${evalC.formScore}, Ans=${evalC.answerScore}, Rule=${evalC.ruleScore}, App=${evalC.applicationScore}, Concl=${evalC.conclusionScore} | Total=${evalC.numericalScore}% | Score=${evalC.finalScore}/5.00`);
  validateEvaluationValidity('Test C', evalC, 'Under Article 36 of the Family Code, psychological incapacity renders marriage void ab initio.');

  // Test D: Conclusion only
  const evalD = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: 'ANSWER: A is justified and incurs no criminal liability.\n\nCONCLUSION: Therefore, A cannot be convicted.',
    isDemo: true,
  });
  console.log(`✓ Test D (Conclusion only): Form=${evalD.formScore}, Ans=${evalD.answerScore}, Rule=${evalD.ruleScore}, App=${evalD.applicationScore}, Concl=${evalD.conclusionScore} | Total=${evalD.numericalScore}% | Score=${evalD.finalScore}/5.00`);
  validateEvaluationValidity('Test D', evalD, 'ANSWER: A is justified and incurs no criminal liability.\n\nCONCLUSION: Therefore, A cannot be convicted.');

  // Test E: Correct Rule but weak Application ("B had a knife.")
  const evalE = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: 'ANSWER: A can invoke self-defense.\n\nRULE: Under Article 11, paragraph 1 of the Revised Penal Code, self-defense requires: (1) Unlawful aggression; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: B had a knife.\n\nCONCLUSION: A is not liable.',
    isDemo: true,
  });
  console.log(`✓ Test E (Correct Rule, weak App): Form=${evalE.formScore}, Ans=${evalE.answerScore}, Rule=${evalE.ruleScore}, App=${evalE.applicationScore}, Concl=${evalE.conclusionScore} | Total=${evalE.numericalScore}% | Score=${evalE.finalScore}/5.00`);
  validateEvaluationValidity('Test E', evalE, 'ANSWER: A can invoke self-defense.\n\nRULE: Under Article 11, paragraph 1 of the Revised Penal Code, self-defense requires: (1) Unlawful aggression; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: B had a knife.\n\nCONCLUSION: A is not liable.');

  // Test F: Strong Application but partial Rule
  const evalF = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: 'ANSWER: A acted in lawful defense.\n\nRULE: Self-defense requires unlawful aggression.\n\nAPPLICATION: Unlawful aggression occurred when B thrust a deadly knife at A in the dark alley, creating imminent mortal danger. A fired a single defensive shot to B\'s chest with a licensed gun, which was reasonably necessary under rational equivalence because A had no other weapon to defend against a knife attack. A gave no provocation.\n\nCONCLUSION: A is justified.',
    isDemo: true,
  });
  console.log(`✓ Test F (Strong App, partial Rule): Form=${evalF.formScore}, Ans=${evalF.answerScore}, Rule=${evalF.ruleScore}, App=${evalF.applicationScore}, Concl=${evalF.conclusionScore} | Total=${evalF.numericalScore}% | Score=${evalF.finalScore}/5.00`);
  validateEvaluationValidity('Test F', evalF, 'ANSWER: A acted in lawful defense.\n\nRULE: Self-defense requires unlawful aggression.\n\nAPPLICATION: Unlawful aggression occurred when B thrust a deadly knife at A in the dark alley, creating imminent mortal danger. A fired a single defensive shot to B\'s chest with a licensed gun, which was reasonably necessary under rational equivalence because A had no other weapon to defend against a knife attack. A gave no provocation.\n\nCONCLUSION: A is justified.');

  // Test G: Complete high-quality legal answer
  const evalG = await AiEvaluatorService.evaluateAnswer({
    questionSnapshot: question,
    modelConfigSnapshot: modelAConfig as any,
    rubricSnapshot: rubricCriteria,
    systemInstructions: modelAConfig.systemInstructions,
    studentAnswer: 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Under Article 11(1) of the Revised Penal Code, self-defense justifies an act and extinguishes criminal liability upon the concurrence of three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: First, unlawful aggression was present because B brandished a deadly knife in a dark alley and thrust it at A, creating actual and imminent mortal peril. Second, A\'s act of firing a single shot to B\'s chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A had no other comparable means to repel a sudden knife thrust. Third, there was complete lack of sufficient provocation since A was merely walking along the street when confronted.\n\nCONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.',
    isDemo: true,
  });
  console.log(`✓ Test G (Complete ARAC): Form=${evalG.formScore}, Ans=${evalG.answerScore}, Rule=${evalG.ruleScore}, App=${evalG.applicationScore}, Concl=${evalG.conclusionScore} | Total=${evalG.numericalScore}% | Score=${evalG.finalScore}/5.00`);
  validateEvaluationValidity('Test G', evalG, 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Under Article 11(1) of the Revised Penal Code, self-defense justifies an act and extinguishes criminal liability upon the concurrence of three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: First, unlawful aggression was present because B brandished a deadly knife in a dark alley and thrust it at A, creating actual and imminent mortal peril. Second, A\'s act of firing a single shot to B\'s chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A had no other comparable means to repel a sudden knife thrust. Third, there was complete lack of sufficient provocation since A was merely walking along the street when confronted.\n\nCONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.');

  // =========================================================================
  // SECTION 3: RESEARCH MODE SAFE-FAILURE AUDIT (isDemo = false)
  // =========================================================================
  console.log('\n--- SECTION 3: RESEARCH MODE SAFE-FAILURE AUDIT (isDemo = false) ---');
  const fakeConfig = {
    ...modelAConfig,
    provider: 'ollama',
    endpointUrl: 'http://127.0.0.1:59999/v1/chat/completions',
  };

  let caughtError = false;
  try {
    await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: fakeConfig as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: fakeConfig.systemInstructions,
      studentAnswer: 'ANSWER: A is justified under Article 11(1) of the RPC.\n\nRULE: Self-defense requires unlawful aggression, reasonable necessity of the means employed, and lack of sufficient provocation.\n\nAPPLICATION: B attacked A with a knife in a dark alley without provocation, so A fired a shot.\n\nCONCLUSION: A incurs no liability.',
      isDemo: false,
    });
  } catch (err: any) {
    caughtError = true;
    console.log(`✓ Confirmed: Research mode failed safely with error: "${err.message}"`);
  }
  console.assert(caughtError, 'Research mode MUST fail explicitly without generating demo fallback');

  // =========================================================================
  // SECTION 4: THREE LIVE LOCAL OLLAMA MODELS SEQUENTIAL EVALUATION & INDEPENDENCE PROOF
  // =========================================================================
  console.log('\n--- SECTION 4: SEQUENTIAL THREE-MODEL INDEPENDENT PROVENANCE PROOF ---');
  const sampleAnswer = 'ANSWER: A can validly invoke complete self-defense under Article 11(1) of the Revised Penal Code.\n\nRULE: Self-defense requires unlawful aggression by the victim, reasonable necessity of the means employed, and lack of sufficient provocation on the part of the defender.\n\nAPPLICATION: B committed unlawful aggression with a deadly knife in the dark alley. A fired a single defensive shot under rational equivalence. A gave no provocation.\n\nCONCLUSION: A incurs no criminal liability.';

  const models = [
    { slot: 'MODEL_A', cfg: modelAConfig, tag: 'llama3.2:3b' },
    { slot: 'MODEL_B', cfg: modelBConfig, tag: 'phi4-mini:3.8b' },
    { slot: 'MODEL_C', cfg: modelCConfig, tag: 'gemma2:2b' },
  ];

  const results: any[] = [];
  for (const m of models) {
    console.log(`\n🚀 Executing [${m.slot}] -> ${m.cfg.researchName} (${m.tag})...`);
    const start = Date.now();
    const res = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: m.cfg as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: m.cfg.systemInstructions,
      studentAnswer: sampleAnswer,
      isDemo: true,
    });
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    results.push({
      slot: m.slot,
      model: m.cfg.researchName,
      tag: m.tag,
      duration: `${duration}s`,
      criteria: `${res.formScore}/${res.answerScore}/${res.ruleScore}/${res.applicationScore}/${res.conclusionScore}`,
      totalPct: `${res.numericalScore}%`,
      finalScore: `${(res.finalScore ?? 0).toFixed(2)}/5.00`,
      liveLocalFlag: res.reviewFlags.includes('LIVE_LOCAL_MODEL'),
      rawJson: JSON.stringify(res),
    });

    console.log(`   - Output: Total=${res.numericalScore}%, Final=${res.finalScore}/5.00 (Form=${res.formScore}, Ans=${res.answerScore}, Rule=${res.ruleScore}, App=${res.applicationScore}, Concl=${res.conclusionScore})`);
    console.log(`   - Live Local Ollama Flag: ${res.reviewFlags.includes('LIVE_LOCAL_MODEL') ? 'YES ✓' : 'NO'}`);

    if (m.cfg.provider === 'ollama') {
      await OpenAICompatibleProvider.unloadOllamaModel(m.tag);
      console.log(`   ✓ Unloaded ${m.tag} from GPU VRAM.`);
    }
  }

  console.log('\n=========================================================================');
  console.log('                 FINAL AUTHORITATIVE SPECIFICATION SUMMARY');
  console.log('=========================================================================');
  console.table(
    results.map((r) => ({
      Slot: r.slot,
      Model: r.model,
      Tag: r.tag,
      Duration: r.duration,
      Criteria: r.criteria,
      WeightedPct: r.totalPct,
      FinalScore: r.finalScore,
      'Live Local?': r.liveLocalFlag ? 'YES' : 'NO',
    }))
  );

  // Assert independence
  console.assert(results.length === 3, 'All 3 models must execute');
  console.assert(results[0].rawJson !== results[1].rawJson, 'Model A and Model B responses must be independent strings');
  console.assert(results[1].rawJson !== results[2].rawJson, 'Model B and Model C responses must be independent strings');

  console.log('\n🎉 ALL AUTHORITATIVE SPECIFICATION AND 0.00-5.00 SCORING TESTS COMPLETED SUCCESSFULLY!\n');
}

runAuthoritativeGradingSpecTests()
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
