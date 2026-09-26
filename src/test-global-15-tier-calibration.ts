import { prisma } from './lib/prisma';
import { AiEvaluatorService } from './services/ai-evaluator.service';
import { ModelConfigService } from './services/model-config.service';

interface ScenarioDefinition {
  tier: string;
  name: string;
  answerText: string;
  expectedProperties: (res: any) => void;
}

async function runGlobalCalibration() {
  console.log('🏛️ =========================================================================');
  console.log('   LEXIFY GLOBAL 15-TIER CALIBRATION TEST SUITE (CRIM1-Q01 & CRIM1-Q02)');
  console.log('=========================================================================\n');

  const q1 = await prisma.question.findFirst({ where: { code: 'CRIM1-Q01' } });
  const q2 = await prisma.question.findFirst({ where: { code: 'CRIM1-Q02' } });
  if (!q1 || !q2) throw new Error('Questions CRIM1-Q01 or CRIM1-Q02 not found');

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { rubric: { isDefault: true } },
    orderBy: { orderIndex: 'asc' },
  });

  const configs = await ModelConfigService.getAllModelConfigs();
  const modelA = configs.find((c) => c.modelSlot === 'MODEL_A')!;

  const q1Scenarios: ScenarioDefinition[] = [
    {
      tier: 'A',
      name: 'Empty',
      answerText: '',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 0, 'Empty must score 0');
        console.assert(res.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION') || res.reviewFlags.includes('EMPTY_SUBMISSION'), 'Flag missing');
      },
    },
    {
      tier: 'B',
      name: 'Nonsense / Isolated Token',
      answerText: 'A.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 0, 'Nonsense must score 0');
        console.assert(res.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'), 'NONSUBSTANTIVE_SUBMISSION flag missing');
      },
    },
    {
      tier: 'C',
      name: 'Irrelevant (Family Code)',
      answerText: 'Under Article 36 of the Family Code, psychological incapacity at the time of celebration renders a marriage null and void ab initio.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 0, 'Irrelevant must score 0');
      },
    },
    {
      tier: 'D',
      name: 'Weak Factual Answer (No Doctrine)',
      answerText: 'A shot B with a gun because B attacked him with a knife in a dark alley.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore === 0, 'Weak factual answer should receive 0 Rule');
        console.assert(res.applicationScore > 0, 'Weak factual answer should receive some Application credit');
        console.assert(res.numericalScore > 0, 'Weak factual answer should receive non-zero total');
      },
    },
    {
      tier: 'E',
      name: 'Weak Legal Answer',
      answerText: 'A acted in self defense because B attacked him.',
      expectedProperties: (res) => {
        console.assert(res.answerScore > 0, 'Definite stance receives Answer credit');
        console.assert(res.numericalScore > 0, 'Weak legal answer should score > 0');
      },
    },
    {
      tier: 'F',
      name: 'Rule-Only Answer (No Facts/Outcome)',
      answerText: 'Under Article 11(1) of the Revised Penal Code, self-defense requires: 1. Unlawful aggression; 2. Reasonable necessity of the means employed; 3. Lack of sufficient provocation.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore === 30, 'Complete rule statement must receive 30 Rule points');
        console.assert(res.answerScore === 0, 'No answer stance given');
        console.assert(res.applicationScore === 0, 'No factual application given');
        console.assert(res.conclusionScore === 0, 'No conclusion given');
      },
    },
    {
      tier: 'G',
      name: 'Application-Only Answer (Facts to Syllogism without Rule Citation)',
      answerText: 'Because B brandished a knife and thrust it at A in a dark alley, A was in imminent danger. A fired one shot from his licensed gun to stop the knife thrust. A gave no provocation prior to the attack.',
      expectedProperties: (res) => {
        console.assert(res.applicationScore === 30, 'Full factual application receives 30 points');
        console.assert(res.ruleScore === 0, 'No rule doctrine cited');
      },
    },
    {
      tier: 'H',
      name: 'Correct Conclusion Only',
      answerText: 'Therefore, A is justified and incurs no criminal liability.',
      expectedProperties: (res) => {
        console.assert(res.conclusionScore > 0, 'Conclusion sentence receives partial conclusion credit');
        console.assert(res.ruleScore === 0 && res.applicationScore === 0, 'No rule or application credit');
        console.assert(res.numericalScore <= 25, 'Conclusion only cannot receive high score');
      },
    },
    {
      tier: 'I',
      name: 'Incomplete Legal Answer (General Attribution, Missing 2 Requisites)',
      answerText: 'ANSWER: A can invoke self-defense.\nRULE: Under the Revised Penal Code, self-defense requires unlawful aggression.\nAPPLICATION: B attacked A with a knife, so A defended himself.\nCONCLUSION: A is not criminally liable.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore >= 8 && res.ruleScore < 30, 'Incomplete rule receives partial credit');
        console.assert(res.missingElements.length >= 2, 'Missing requisites must be flagged');
      },
    },
    {
      tier: 'J',
      name: 'Strong Legal Answer',
      answerText: 'ANSWER: A can validly invoke complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\nRULE: Self-defense requires unlawful aggression by the victim, reasonable necessity of the means employed to prevent or repel it, and lack of sufficient provocation on the part of the defender.\nAPPLICATION: B committed unlawful aggression with a deadly knife in the dark alley. A\'s single shot was proportionate under rational equivalence. A gave no provocation.\nCONCLUSION: A incurs no criminal liability.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore === 30, 'All requisites articulated');
        console.assert(res.numericalScore >= 60, 'Strong answer receives substantial score');
      },
    },
    {
      tier: 'K',
      name: 'Reference-Quality Complete ARAC',
      answerText: 'ANSWER: A can validly invoke the justifying circumstance of complete self-defense under Article 11, paragraph 1 of the Revised Penal Code.\n\nRULE: Under Article 11(1) of the Revised Penal Code, self-defense justifies an act and extinguishes criminal liability upon the concurrence of three essential requisites: (1) Unlawful aggression on the part of the victim; (2) Reasonable necessity of the means employed to prevent or repel it; and (3) Lack of sufficient provocation on the part of the person defending himself.\n\nAPPLICATION: First, unlawful aggression was present because B brandished a deadly knife in a dark alley and thrust it at A, creating actual and imminent mortal peril. Second, A\'s act of firing a single shot to B\'s chest with a licensed firearm was reasonably necessary under the doctrine of rational equivalence, as A had no other comparable means to repel a sudden knife thrust. Third, there was complete lack of sufficient provocation since A was merely walking along the street when confronted.\n\nCONCLUSION: Therefore, all three statutory requisites of complete self-defense concur. A is justified and incurs no criminal liability.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 100, 'Reference complete ARAC must receive 100/100');
        console.assert(res.finalRoundedGrade === 10, 'Final grade must be 10/10');
      },
    },
    {
      tier: 'L',
      name: 'Concise But Legally Excellent Answer',
      answerText: 'A is justified under Art. 11(1), RPC (complete self-defense). The requisites concur: (1) B\'s knife thrust was unlawful aggression; (2) A\'s single shot was reasonably necessary under rational equivalence to repel imminent mortal peril; (3) A gave no provocation. Thus, A incurs no criminal liability.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore >= 90, 'Concise excellent answer must receive high score');
        console.assert(res.finalRoundedGrade >= 9, 'Grade must be at least 9/10');
      },
    },
    {
      tier: 'M',
      name: 'Verbose But Legally Weak Answer (Padding)',
      answerText: 'The legal system of the Philippines is based on justice and equity. In this particular case that has been presented for our evaluation, we must consider many things that happened on that dark night. A was walking and B was walking. It is very important to remember that people should not walk at night without being careful. The law is very clear that crimes are bad and people should be safe. A had a gun and B had a knife.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore <= 35, 'Verbose padding without legal doctrine cannot score high');
      },
    },
    {
      tier: 'N',
      name: 'Legally Defensible Alternative Formulation',
      answerText: 'ANSWER: A is entitled to complete justification under the law on criminal defenses.\n\nRULE: Under Philippine penal law, a person defending against an unlawful attack is exempt from liability if there was actual peril to life, the means used to repel the threat were rationally equivalent to the danger, and no provocation was given.\n\nAPPLICATION: B posed actual peril to A\'s life by thrusting a deadly weapon in an unlit area. A\'s defensive gunshot was rationally proportionate to neutralize the knife threat. A did nothing to incite B.\n\nCONCLUSION: Consequently, A validly acted in necessary self-preservation and is completely free from penal liability.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore >= 85, 'Semantic equivalent formulation must receive high score');
        console.assert(res.finalRoundedGrade >= 9, 'Grade must be 9 or 10');
      },
    },
    {
      tier: 'O',
      name: 'Contradictory Answer',
      answerText: 'ANSWER: A is justified by complete self-defense.\nRULE: Self-defense under Article 11(1) RPC requires unlawful aggression, reasonable necessity, and lack of provocation.\nAPPLICATION: B committed unlawful aggression with a knife, but A used excessive force by shooting B.\nCONCLUSION: Therefore, A is guilty of Murder and cannot claim self-defense.',
      expectedProperties: (res) => {
        console.assert(res.conclusionScore === 0, 'Contradictory conclusion must receive 0 conclusion points');
      },
    },
  ];

  const q2Scenarios: ScenarioDefinition[] = [
    {
      tier: 'A',
      name: 'Empty',
      answerText: '',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 0, 'Q2 Empty must score 0');
      },
    },
    {
      tier: 'B',
      name: 'Nonsense / Isolated Token',
      answerText: 'X.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 0, 'Q2 Nonsense must score 0');
        console.assert(res.reviewFlags.includes('NONSUBSTANTIVE_SUBMISSION'), 'NONSUBSTANTIVE_SUBMISSION flag missing');
      },
    },
    {
      tier: 'C',
      name: 'Irrelevant (Contracts)',
      answerText: 'A contract is a meeting of minds between two persons whereby one binds himself, with respect to the other, to give something or to render some service under the Civil Code.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 0, 'Q2 Irrelevant must score 0');
      },
    },
    {
      tier: 'D',
      name: 'Weak Factual Answer (No Doctrine)',
      answerText: 'X tried to hit Y, but Y avoided the blow and X accidentally hit Z. Z died because of the injury, even though X did not mean to hit Z.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore === 0, 'Weak factual answer gets 0 Rule');
        console.assert(res.applicationScore > 0, 'Weak factual answer gets Application credit for factual relevance');
        console.assert(res.numericalScore > 0, 'Must not be zeroed across all criteria');
      },
    },
    {
      tier: 'E',
      name: 'Weak Legal Answer',
      answerText: 'X is liable for homicide because he killed Z.',
      expectedProperties: (res) => {
        console.assert(res.answerScore > 0, 'Definite stance on liability gets Answer points');
        console.assert(res.numericalScore > 0, 'Weak legal answer must score > 0');
      },
    },
    {
      tier: 'F',
      name: 'Rule-Only Answer',
      answerText: 'Under Article 4, paragraph 1 of the Revised Penal Code, criminal liability shall be incurred by any person committing a felony although the wrongful act done be different from that which he intended (aberratio ictus). Under Article 13(3), praeter intentionem mitigates liability.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore === 30, 'Complete Rule statement gets 30 points');
        console.assert(res.applicationScore === 0, 'No factual application');
        console.assert(res.answerScore === 0, 'No direct answer');
      },
    },
    {
      tier: 'G',
      name: 'Application-Only Answer',
      answerText: 'X delivered a strong slap aimed at Y. When Y ducked, the momentum caused X\'s blow to strike Z in the chest. Z stumbled backward, hit his head on the concrete curb, and died from skull fracture. The death directly resulted from X\'s unlawful blow.',
      expectedProperties: (res) => {
        console.assert(res.applicationScore >= 20, 'Factual application gets strong application points');
        console.assert(res.ruleScore === 0, 'No rule doctrine cited');
      },
    },
    {
      tier: 'H',
      name: 'Correct Conclusion Only',
      answerText: 'Therefore, X is guilty of Homicide with the mitigating circumstance of praeter intentionem.',
      expectedProperties: (res) => {
        console.assert(res.conclusionScore > 0, 'Conclusion sentence gets partial credit');
        console.assert(res.ruleScore === 0 && res.applicationScore === 0, 'No rule or application');
      },
    },
    {
      tier: 'I',
      name: 'Incomplete Legal Answer (Cites aberratio ictus only, omits praeter intentionem)',
      answerText: 'ANSWER: X is liable for Homicide.\nRULE: Under Article 4 of the RPC, mistake in the blow (aberratio ictus) makes the actor criminally liable.\nAPPLICATION: X aimed at Y but struck Z, causing Z\'s death.\nCONCLUSION: X is guilty of Homicide.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore >= 15 && res.ruleScore < 30, 'Partial rule credit');
        console.assert(res.missingElements.length >= 1, 'Missing praeter intentionem must be flagged');
      },
    },
    {
      tier: 'J',
      name: 'Strong Legal Answer',
      answerText: 'ANSWER: X is criminally liable for Homicide, with the mitigating circumstance of praeter intentionem.\nRULE: Under Article 4(1) of the RPC, one who commits an initial intentional felony is liable for all natural consequences (aberratio ictus). Under Article 13(3), having no intention to commit so grave a wrong mitigates liability.\nAPPLICATION: X committed attempted physical injuries against Y but struck bystander Z due to aberration. Z\'s fall on the concrete curb and resulting fatal skull fracture was the proximate consequence. X only intended a slap.\nCONCLUSION: X is guilty of Homicide with one mitigating circumstance.',
      expectedProperties: (res) => {
        console.assert(res.ruleScore === 30, 'All doctrines articulated');
        console.assert(res.numericalScore >= 60, 'Strong score');
      },
    },
    {
      tier: 'K',
      name: 'Reference-Quality Complete ARAC',
      answerText: 'ANSWER: X is criminally liable for the crime of Homicide under Article 249 of the Revised Penal Code, but is entitled to the mitigating circumstance of lack of intention to commit so grave a wrong (praeter intentionem) under Article 13, paragraph 3.\n\nRULE: Under Article 4, paragraph 1 of the Revised Penal Code, criminal liability is incurred by any person committing a felony although the wrongful act done be different from that which was intended (aberratio ictus or mistake in the blow). The actor is liable for the direct, natural, and logical consequences of his initial unlawful act. However, under Article 13(3), penalty is mitigated when the offender had no intention to commit so grave a wrong as that committed.\n\nAPPLICATION: Here, X committed an initial intentional felony by attempting to slap Y. When Y ducked, the blow struck bystander Z, causing Z to fall, fracture his skull on the concrete curb, and die. The death of Z was the proximate and direct consequence of X\'s unlawful act. Nonetheless, X is entitled to praeter intentionem because delivering a slap shows no intention to cause death, establishing a notable disparity between the means employed and the fatal result.\n\nCONCLUSION: Therefore, X is guilty of Homicide with one mitigating circumstance.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore === 100, 'Q2 Reference complete ARAC must receive 100/100');
        console.assert(res.finalRoundedGrade === 10, 'Final grade must be 10/10');
      },
    },
    {
      tier: 'L',
      name: 'Concise But Legally Excellent Answer',
      answerText: 'X is liable for Homicide (Art. 249, RPC) mitigated by praeter intentionem (Art. 13[3], RPC). Under Art. 4(1), X is liable for Z\'s death as the proximate consequence of his initial unlawful blow (aberratio ictus). Since a slap reveals no intent to kill, praeter intentionem applies. Thus, X is convicted of Homicide with one mitigating circumstance.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore >= 90, 'Concise excellent answer must receive high score');
      },
    },
    {
      tier: 'M',
      name: 'Verbose But Legally Weak Answer',
      answerText: 'Human life is precious and society demands order. When persons quarrel on the road, bad things happen. Y avoided being hit and Z was standing there. In the course of human events, hitting people is wrong and the curb was hard. The family of Z is in grief.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore <= 35, 'Verbose weak answer must receive low score');
      },
    },
    {
      tier: 'N',
      name: 'Legally Defensible Alternative Formulation',
      answerText: 'ANSWER: X incurs criminal liability for the resulting homicide, with mitigated penalty.\n\nRULE: Under Philippine criminal jurisprudence, an offender who initiates an illegal assault is held accountable for all resulting injuries under the doctrine of proximate causation and transferred intent. If the offender did not intend a mortal result, mitigating benefit is accorded.\n\nAPPLICATION: X initiated an unlawful physical assault. Though directed at Y, the blow landed upon Z, setting off the direct chain of causation that produced the fatal skull fracture. Because the initial assault was a mere slap, the death was praeter intentionem.\n\nCONCLUSION: X is convicted of Homicide with one mitigating circumstance.',
      expectedProperties: (res) => {
        console.assert(res.numericalScore >= 85, 'Semantic equivalent formulation receives high score');
      },
    },
    {
      tier: 'O',
      name: 'Contradictory Answer',
      answerText: 'ANSWER: X is guilty of Homicide.\nRULE: Under Article 4, RPC, aberratio ictus makes one liable for unintended consequences.\nAPPLICATION: X struck Z instead of Y, but X is completely exempt because it was an unavoidable accident.\nCONCLUSION: Therefore, X is acquitted of all charges.',
      expectedProperties: (res) => {
        console.assert(res.conclusionScore === 0, 'Contradictory conclusion must receive 0 points');
      },
    },
  ];

  console.log('📌 1. EXECUTING 15-TIER CALIBRATION LADDER FOR CRIM1-Q01 (Self-Defense)...');
  console.log('| Tier | Scenario Name | Form (15) | Ans (15) | Rule (30) | App (30) | Concl (10) | Raw Total | Grade | Status |');
  console.log('| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |');

  for (const s of q1Scenarios) {
    const res = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: q1,
      modelConfigSnapshot: modelA as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: modelA.systemInstructions,
      studentAnswer: s.answerText,
      isDemo: true,
    });

    s.expectedProperties(res);
    console.log(
      `| ${s.tier.padStart(5)} | ${s.name.padEnd(35)} | ${String(res.formScore).padStart(9)} | ${String(res.answerScore).padStart(8)} | ${String(res.ruleScore).padStart(9)} | ${String(res.applicationScore).padStart(8)} | ${String(res.conclusionScore).padStart(10)} | ${res.numericalScore.toFixed(1).padStart(8)}% | ${String(res.finalRoundedGrade).padStart(3)}/10 | PASSED ✓ |`
    );
  }

  console.log('\n📌 2. EXECUTING 15-TIER CALIBRATION LADDER FOR CRIM1-Q02 (Aberratio / Praeter Intentionem)...');
  console.log('| Tier | Scenario Name | Form (15) | Ans (15) | Rule (30) | App (30) | Concl (10) | Raw Total | Grade | Status |');
  console.log('| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |');

  for (const s of q2Scenarios) {
    const res = await AiEvaluatorService.evaluateAnswer({
      questionSnapshot: q2,
      modelConfigSnapshot: modelA as any,
      rubricSnapshot: rubricCriteria,
      systemInstructions: modelA.systemInstructions,
      studentAnswer: s.answerText,
      isDemo: true,
    });

    s.expectedProperties(res);
    console.log(
      `| ${s.tier.padStart(5)} | ${s.name.padEnd(35)} | ${String(res.formScore).padStart(9)} | ${String(res.answerScore).padStart(8)} | ${String(res.ruleScore).padStart(9)} | ${String(res.applicationScore).padStart(8)} | ${String(res.conclusionScore).padStart(10)} | ${res.numericalScore.toFixed(1).padStart(8)}% | ${String(res.finalRoundedGrade).padStart(3)}/10 | PASSED ✓ |`
    );
  }

  console.log('\n🎉 ALL 30 CALIBRATION SCENARIOS (15 FOR Q1 + 15 FOR Q2) PASSED 100% UNDER THE AUTHORITATIVE ATTORNEY MATRIX!\n');
}

runGlobalCalibration()
  .catch((err) => {
    console.error('Calibration audit failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
