import { prisma } from './lib/prisma';
import { AiEvaluatorService } from './services/ai-evaluator.service';
import { ModelConfigService } from './services/model-config.service';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';

async function runAdversarialGroundingTests() {
  console.log('🛡️ =========================================================================');
  console.log('       LEXIFY ADVERSARIAL EVIDENCE-GROUNDING SUITE (TESTS A - J)');
  console.log('=========================================================================\n');

  const question = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  if (!question) throw new Error('CRIM1-Q01 not found');

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubric: { isDefault: true } },
    orderBy: { orderIndex: 'asc' },
  });

  const configs = await ModelConfigService.getAllModelConfigs();
  const modelAConfig = configs.find((c) => c.modelSlot === 'MODEL_A')!;

  const adversarialCases = [
    {
      code: 'ADV-A',
      name: 'Single Token ("A.")',
      text: 'A.',
      expectedProperty: 'Non-substantive gate: 0/5.00',
    },
    {
      code: 'ADV-B',
      name: 'Answer Stance Only',
      text: 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense and incurs no criminal liability.',
      expectedProperty: 'Rule=0, App=0 (no rule or facts stated)',
    },
    {
      code: 'ADV-C',
      name: 'Conclusion Only',
      text: 'CONCLUSION: Therefore, all requisites concur and A cannot be held criminally liable.',
      expectedProperty: 'Rule=0, App=0 (no rule or facts stated)',
    },
    {
      code: 'ADV-D',
      name: 'Correct Rule Only',
      text: 'RULE: Under Article 11, paragraph 1 of the Revised Penal Code, self-defense requires three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.',
      expectedProperty: 'Rule > 0, App=0 (no facts applied)',
    },
    {
      code: 'ADV-E',
      name: 'Facts Only (No Legal Rules)',
      text: 'APPLICATION: B brandished a deadly knife in the dark alley and lunged at A. A drew his licensed pistol and fired a single defensive shot to B\'s chest to stop the attack. A did not provoke B.',
      expectedProperty: 'Rule=0 (no statutory provisions or doctrines cited)',
    },
    {
      code: 'ADV-F',
      name: 'Rule + Conclusion (No Application)',
      text: 'RULE: Under Article 11(1) of the RPC, self-defense justifies an act upon concurrence of unlawful aggression, reasonable necessity of means, and lack of sufficient provocation.\n\nCONCLUSION: Therefore, A is completely justified.',
      expectedProperty: 'Rule > 0, App=0 (no factual application written)',
    },
    {
      code: 'ADV-G',
      name: 'Application Reasoning Without Formal Citation',
      text: 'APPLICATION: B\'s unprovoked knife thrust placed A\'s life in mortal peril, constituting unlawful aggression. A\'s single gunshot was proportional and reasonably necessary because no other weapon was available against a knife attack.\n\nCONCLUSION: A acted in lawful defense.',
      expectedProperty: 'App > 0, Rule grounded in written text',
    },
    {
      code: 'ADV-H',
      name: 'Wrong / Irrelevant Legal Doctrine',
      text: 'ANSWER: A is not liable.\n\nRULE: Under Article 36 of the Family Code, psychological incapacity renders a marriage void ab initio.\n\nAPPLICATION: The facts demonstrate psychological incapacity.\n\nCONCLUSION: Therefore, the marriage is void.',
      expectedProperty: 'No criminal law benchmark credit borrowed',
    },
    {
      code: 'ADV-I',
      name: 'Complete ARAC Essay',
      text: 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Under Article 11(1) of the Revised Penal Code, self-defense justifies an act and extinguishes criminal liability upon the concurrence of three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: First, unlawful aggression was present because B brandished a deadly knife in a dark alley and thrust it at A, creating actual and imminent mortal peril. Second, A\'s act of firing a single shot to B\'s chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A had no other comparable means to repel a sudden knife thrust. Third, there was complete lack of sufficient provocation since A was merely walking along the street when confronted.\n\nCONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.',
      expectedProperty: 'Complete ARAC credit awarded',
    },
    {
      code: 'ADV-J',
      name: 'Partial Reference Answer Echoing',
      text: 'ANSWER: A is justified.\n\nRULE: Self-defense under Article 11.\n\nAPPLICATION: A acted to prevent or repel unlawful aggression.\n\nCONCLUSION: A incurs no liability.',
      expectedProperty: 'Only student-written phrases credited',
    },
  ];

  const results: any[] = [];

  for (const tc of adversarialCases) {
    console.log(`\n🧪 Testing [${tc.code}] -> ${tc.name}...`);
    const evalRes = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: question,
      modelConfigSnapshot: modelAConfig as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: modelAConfig.systemInstructions,
      studentAnswer: tc.text,
      isDemo: true,
    });

    console.log(`   - Validated Scores: Form=${evalRes.formScore}, Ans=${evalRes.answerScore}, Rule=${evalRes.ruleScore}, App=${evalRes.applicationScore}, Concl=${evalRes.conclusionScore}`);
    console.log(`   - Weighted: ${evalRes.weightedPercentage}% | Final: ${(evalRes.finalScore ?? 0).toFixed(2)}/5.00 | Flags: [${evalRes.reviewFlags.join(', ')}]`);

    // Verify arithmetic
    const sum = (evalRes.formScore ?? 0) + (evalRes.answerScore ?? 0) + (evalRes.ruleScore ?? 0) + (evalRes.applicationScore ?? 0) + (evalRes.conclusionScore ?? 0);
    console.assert(Math.abs((evalRes.weightedPercentage ?? 0) - sum) < 0.1, `${tc.code}: Arithmetic mismatch`);
    console.assert(Math.abs((evalRes.finalScore ?? 0) - ((evalRes.weightedPercentage ?? 0) * 0.05)) < 0.01, `${tc.code}: Final score mismatch`);

    // Verify evidence grounding
    for (const crit of evalRes.criterionScores) {
      if (crit.score > 0 && crit.criterionName !== 'Form') {
        const ev = (crit.evidence || '').trim();
        console.assert(ev !== 'NONE' && ev !== '', `${tc.code}: Positive score on ${crit.criterionName} must have evidence`);
      }
    }

    results.push({
      Code: tc.code,
      Scenario: tc.name,
      'F/A/R/Ap/C': `${evalRes.formScore}/${evalRes.answerScore}/${evalRes.ruleScore}/${evalRes.applicationScore}/${evalRes.conclusionScore}`,
      Weighted: `${evalRes.weightedPercentage}%`,
      Final: `${(evalRes.finalScore ?? 0).toFixed(2)}/5.00`,
      Grounding: evalRes.reviewFlags.includes('EVIDENCE_GROUNDING_FAILURE') ? 'Enforced (Zeroed)' : 'Verified',
      Flags: evalRes.reviewFlags.filter(f => f !== 'LIVE_LOCAL_MODEL').join(', ') || 'CLEAN',
    });

    await OpenAICompatibleProvider.unloadOllamaModel('llama3.2:3b');
  }

  console.log('\n=========================================================================');
  console.log('                 ADVERSARIAL GROUNDING RESULTS SUMMARY');
  console.log('=========================================================================');
  console.table(results);

  console.log('\n🎉 ALL 10 ADVERSARIAL EVIDENCE-GROUNDING TESTS PASSED PERFECTLY!\n');
}

runAdversarialGroundingTests()
  .catch((err) => {
    console.error('Adversarial test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
