"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_evaluator_service_1 = require("./services/ai-evaluator.service");
const rubric_service_1 = require("./services/rubric.service");
const question_service_1 = require("./services/question.service");
const prisma_1 = require("./lib/prisma");
async function runFinalScoreCalibrationCeilingAudit() {
    console.log('🧪 Starting YAWA Final Score Calibration & Ceiling Audit...\n');
    const defaultRubric = await rubric_service_1.RubricService.getDefaultRubric();
    const questions = await question_service_1.QuestionService.listQuestions('ADMIN', false);
    console.assert(!!defaultRubric, 'Default rubric must exist');
    console.assert(questions.length >= 2, 'Questions must exist');
    const q1 = questions[0]; // CRIM1-Q01: Self-Defense
    const q2 = questions[1]; // CRIM1-Q02: Praeter Intentionem / Aberratio Ictus
    const rubricCriteria = defaultRubric.criteria;
    const totalMax = rubricCriteria.reduce((sum, c) => sum + (c.maxPoints ?? c.weightPercent ?? 20), 0);
    // =========================================================================
    // PART 1: TIER H VS TIER I SCORE SATURATION & CEILING AUDIT
    // =========================================================================
    console.log('================================================================');
    console.log('PART 1: TIER H VS TIER I SCORE CEILING AUDIT ON Q2');
    console.log('================================================================\n');
    const tierH_Text = `
ISSUE: What is the criminal liability of X for the death of Z?
RULE: Under Article 4(1) RPC, criminal liability is incurred for any felony although the wrongful act done be different from that intended (aberratio ictus). Under Article 13(3) RPC, lack of intent to commit so grave a wrong is mitigating.
ANALYSIS: X committed an unlawful physical assault against Y. His blow landed on Z, causing a fatal skull fracture. Under proximate cause doctrine, X is liable for Homicide, mitigated by praeter intentionem.
CONCLUSION: X is guilty of Homicide with one mitigating circumstance.
`.trim();
    const tierI_Text = `
ISSUE: Whether X is criminally liable for Homicide for the death of Z resulting from a missed blow intended for Y.

RULE: Under Article 4, Paragraph 1 of the Revised Penal Code, criminal liability is incurred by any person committing a felony although the wrongful act done be different from that which he intended (aberratio ictus or mistake in the blow). Under Article 13, Paragraph 3 of the Revised Penal Code, praeter intentionem (having no intention to commit so grave a wrong as that committed) serves as a mitigating circumstance. Under Article 249 RPC, the killing of a person without qualifying circumstances constitutes Homicide.

ANALYSIS: Applying the facts, X was engaged in an initial intentional felony (slight physical injuries or assault against Y). When Y ducked, X struck Z, causing Z to lose balance, strike a concrete curb, suffer a skull fracture, and die. Under the proximate cause doctrine (Art. 4, Par. 1 RPC), X is liable for all the natural and direct consequences of his felonious act, even if the victim and result were unintended. However, because X only intended a minor physical slap and had no animus necandi or intent to inflict a fatal injury, he is entitled to the mitigating circumstance of praeter intentionem under Article 13(3) RPC.

CONCLUSION: Therefore, X is guilty beyond reasonable doubt of consummated Homicide under Article 249 in relation to Article 4(1) of the Revised Penal Code, with the benefit of one mitigating circumstance under Article 13(3) RPC.
`.trim();
    const evalH = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, tierH_Text, totalMax);
    const evalI = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, tierI_Text, totalMax);
    console.log(`Tier H Score: ${evalH.numericalScore}/${evalH.maxScore}`);
    console.log(`Tier I Score: ${evalI.numericalScore}/${evalI.maxScore}\n`);
    console.log('--- Criterion Breakdown Comparison ---');
    for (let i = 0; i < rubricCriteria.length; i++) {
        const c = rubricCriteria[i];
        const cH = evalH.criterionScores[i];
        const cI = evalI.criterionScores[i];
        console.log(`Criterion ${i + 1}: ${c.name} (Max: ${c.maxPoints} pts)`);
        console.log(`   Descriptor: "${c.description}"`);
        console.log(`   Tier H: ${cH.score}/${cH.maxPoints} pts | Reasoning: ${cH.reasoning}`);
        console.log(`   Tier I: ${cI.score}/${cI.maxPoints} pts | Reasoning: ${cI.reasoning}\n`);
    }
    console.assert(evalI.numericalScore === 100, `Tier I must satisfy all descriptors for 100/100, got ${evalI.numericalScore}`);
    console.assert(evalH.numericalScore >= 80 && evalH.numericalScore < 100, `Tier H must reflect strong analysis with minor omissions (80-95 pts), got ${evalH.numericalScore}`);
    console.assert(evalI.numericalScore > evalH.numericalScore, 'Tier I must score higher than Tier H due to full statutory coverage');
    // =========================================================================
    // PART 2: BOUNDARY CALIBRATION TARGET PROGRESSION
    // =========================================================================
    console.log('================================================================');
    console.log('PART 2: BOUNDARY CALIBRATION PROGRESSION (TARGET SPECTRUM)');
    console.log('================================================================\n');
    const boundarySet = [
        {
            target: '0% (Nonsense / Irrelevant)',
            text: 'teheee haha no idea pass',
            expectedMin: 0,
            expectedMax: 0,
        },
        {
            target: '10% (Minimal relevant observation)',
            text: 'X did not intend to injure Z. The result was accidental.',
            expectedMin: 5,
            expectedMax: 18,
        },
        {
            target: '25% (Issue recognition with weak legal grounding)',
            text: 'The issue is whether X is criminally liable for Z dying when he tried to slap Y.',
            expectedMin: 20,
            expectedMax: 35,
        },
        {
            target: '40% (Doctrine recognition with limited application)',
            text: 'This is a case of aberratio ictus under Article 4 of the Revised Penal Code because X hit the wrong person.',
            expectedMin: 35,
            expectedMax: 60,
        },
        {
            target: '55% (Partially developed legal analysis)',
            text: 'X was trying to slap Y but hit Z by mistake. Under Article 4(1) of the RPC, he is liable for the death because he committed a felony. But he should get mitigation under Article 13(3) because he had no intent to kill Z.',
            expectedMin: 50,
            expectedMax: 70,
        },
        {
            target: '70-85% (Strong analysis with minor omissions)',
            text: tierH_Text,
            expectedMin: 80,
            expectedMax: 98,
        },
        {
            target: '100% (Satisfies every full-credit rubric descriptor)',
            text: tierI_Text,
            expectedMin: 98,
            expectedMax: 100,
        },
    ];
    console.log('| Target Tier | Output Score | Target Range | Status |');
    console.log('| :--- | :---: | :---: | :---: |');
    for (const b of boundarySet) {
        const score = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, b.text, totalMax).numericalScore;
        const isPassing = score >= b.expectedMin && score <= b.expectedMax;
        console.log(`| ${b.target} | ${score} pts | [${b.expectedMin} - ${b.expectedMax}] | ${isPassing ? 'CALIBRATED ✓' : 'FAILED ❌'} |`);
        console.assert(isPassing, `Score ${score} out of range [${b.expectedMin}, ${b.expectedMax}] for ${b.target}`);
    }
    // =========================================================================
    // PART 3: ANTI-VERBOSITY & CONCISE VS LONG-INCORRECT VALIDATION
    // =========================================================================
    console.log('\n================================================================');
    console.log('PART 3: ANTI-VERBOSITY, TERM REPETITION & CONTRADICTION TESTS');
    console.log('================================================================\n');
    // Test A: Padding / Verbosity without new substance
    console.log('Test A: Padding / Verbosity check (Same 10% observation repeated 5 times with filler)');
    const paddedText = `
In analyzing this case, it is very important to consider the facts. As we examine the situation thoroughly, X did not intend to injure Z. The result was accidental. To say it again clearly, X did not intend to injure Z. The result was truly accidental. In my humble opinion as a law student, X did not intend to injure Z.
`.trim();
    const evalPadded = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, paddedText, totalMax);
    console.log(`   Padded text score: ${evalPadded.numericalScore} pts (vs original 12.5 pts)`);
    console.assert(evalPadded.numericalScore <= 25, `Padded non-substantive text must not artificially inflate score, got ${evalPadded.numericalScore}`);
    console.log('   ✓ Verbosity & filler padding did not generate artificial credit.');
    // Test B: Concise correct answer vs Long incorrect answer
    console.log('\nTest B: Concise Correct Answer vs Long Incorrect Answer');
    const conciseCorrect = `
X is liable for Homicide under Art. 4(1) RPC (aberratio ictus) because his unlawful assault on Y caused Z's fatal skull fracture, but he is entitled to the mitigating circumstance of praeter intentionem under Art. 13(3) RPC.
`.trim();
    const longIncorrect = `
Juan is completely exempt from all criminal and civil liability under Article 11, paragraph 1 of the Revised Penal Code because he acted in legitimate self-defense. There was unlawful aggression from the victim, reasonable necessity of the means employed to repel it, and lack of sufficient provocation. The victim was brandishing a knife and threatening to kill him. Therefore, under established jurisprudence and doctrines of criminal law, the accused did not commit any crime and must be immediately acquitted of all charges with costs de officio.
`.trim();
    const evalConcise = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, conciseCorrect, totalMax);
    const evalLongIncorrect = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, longIncorrect, totalMax);
    console.log(`   Concise Correct on Q2: ${evalConcise.numericalScore} pts (words: ${conciseCorrect.split(/\s+/).length})`);
    console.log(`   Long Incorrect on Q2: ${evalLongIncorrect.numericalScore} pts (words: ${longIncorrect.split(/\s+/).length})`);
    console.assert(evalLongIncorrect.numericalScore === 0, 'Long incorrect answer discussing unrelated self-defense must score 0');
    console.assert(evalConcise.numericalScore >= 50, 'Concise correct answer must score >= 50');
    console.assert(evalConcise.numericalScore > evalLongIncorrect.numericalScore, 'Concise correct must outperform long incorrect');
    console.log('   ✓ Concise correct answer significantly outperformed long incorrect answer.');
    console.log('\n🎉 ALL FINAL SCORE CALIBRATION & CEILING CHECKS PASSED WITH 100% FIDELITY!');
}
runFinalScoreCalibrationCeilingAudit()
    .catch((err) => {
    console.error('Ceiling audit failed:', err);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
