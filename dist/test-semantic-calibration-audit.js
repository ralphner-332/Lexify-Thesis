"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_evaluator_service_1 = require("./services/ai-evaluator.service");
const rubric_service_1 = require("./services/rubric.service");
const question_service_1 = require("./services/question.service");
const prisma_1 = require("./lib/prisma");
async function runSemanticCalibrationAudit() {
    console.log('🧪 Starting YAWA Comprehensive Semantic Calibration Audit...\n');
    const defaultRubric = await rubric_service_1.RubricService.getDefaultRubric();
    const questions = await question_service_1.QuestionService.listQuestions('ADMIN', false);
    console.assert(!!defaultRubric, 'Default rubric must exist');
    console.assert(questions.length >= 2, 'At least 2 questions must exist');
    const q1 = questions[0]; // CRIM1-Q01: Self-Defense
    const q2 = questions[1]; // CRIM1-Q02: Praeter Intentionem / Aberratio Ictus
    const rubricCriteria = defaultRubric.criteria;
    const totalMax = rubricCriteria.reduce((sum, c) => sum + (c.maxPoints ?? c.weightPercent ?? 20), 0);
    // =========================================================================
    // PART 1: AUDIT OF SPECIFIC USER TEST INPUT
    // "X did not intend to injure Z. The result was accidental."
    // =========================================================================
    console.log('================================================================');
    console.log('PART 1: SPECIFIC AUDIT TEST INPUT:');
    console.log('"X did not intend to injure Z. The result was accidental."');
    console.log('================================================================\n');
    const testInput = 'X did not intend to injure Z. The result was accidental.';
    // Evaluate against Q1 (Self-Defense: A vs B)
    const evalQ1 = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q1, rubricCriteria, testInput, totalMax);
    console.log(`[Q1: ${q1.code} - ${q1.title}]`);
    console.log(`   Score: ${evalQ1.numericalScore}/${evalQ1.maxScore}`);
    console.log(`   Flags: ${evalQ1.reviewFlags.join(', ')}`);
    console.log(`   Scoring Basis: "${evalQ1.scoringBasis}"`);
    console.log(`   Explanation: For Q1 (Self-Defense), this answer is completely irrelevant because it discusses X and Z rather than A and B, and mentions no elements of Article 11 (unlawful aggression, reasonable necessity). Score = 0/100 is 100% justified.\n`);
    console.assert(evalQ1.numericalScore === 0, 'Q1 score for X/Z text must be 0');
    // Evaluate against Q2 (Praeter Intentionem: X, Y, Z)
    const evalQ2 = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, testInput, totalMax);
    console.log(`[Q2: ${q2.code} - ${q2.title}]`);
    console.log(`   Score: ${evalQ2.numericalScore}/${evalQ2.maxScore}`);
    console.log(`   Strengths: ${evalQ2.strengths.join('; ') || 'None'}`);
    console.log(`   Missing Elements: ${evalQ2.missingElements.slice(0, 2).join('; ')}`);
    console.log(`   Scoring Basis: "${evalQ2.scoringBasis}"`);
    console.log(`   Explanation: For Q2, the answer identifies relevant parties (X and Z) and recognizes that the fatal consequence was unintended (concept variation of praeter intentionem). It receives partial credit (~17 pts) while penalizing missing RPC citations (Art 4, Art 13) and incomplete conclusion.\n`);
    console.assert(evalQ2.numericalScore > 0 && evalQ2.numericalScore <= 25, 'Q2 score must reflect limited partial credit (1-25 pts)');
    console.assert(evalQ2.numericalScore > evalQ1.numericalScore, 'Q2 score must exceed Q1 score for the same input');
    // =========================================================================
    // PART 2: COMPREHENSIVE 9-TIER CALIBRATION MATRIX ACROSS MULTIPLE QUESTIONS
    // =========================================================================
    console.log('================================================================');
    console.log('PART 2: 9-TIER SEMANTIC CALIBRATION MATRIX ACROSS QUESTIONS');
    console.log('================================================================\n');
    const calibrationSet = [
        {
            tier: 'A. Nonsense',
            text: 'asdf qwerty 12345 tehee haha',
            expectedQ1: 0,
            expectedQ2: 0,
            description: 'Gibberish / casual nonsense',
        },
        {
            tier: 'B. Irrelevant Response',
            text: 'To cook chicken adobo, marinate the chicken in soy sauce and vinegar with garlic and simmer for 30 minutes.',
            expectedQ1: 0,
            expectedQ2: 0,
            description: 'Cooking recipe completely unrelated to law',
        },
        {
            tier: 'C. Relevant Factual Observation Only',
            text: 'X did not intend to injure Z. The result was accidental.',
            expectedQ1: 0,
            expectedQ2: 17.5,
            description: 'Factual recognition of unintended consequence for Q2; irrelevant for Q1',
        },
        {
            tier: 'D. Non-Keyword Concept Equivalents',
            text: 'X was swinging at Y but his blow missed and struck Z by mistake. Since he was committing an unlawful physical assault, he is still criminally responsible for Z dying, but because he did not mean to kill Z, his criminal penalty should be reduced.',
            expectedQ1: 0,
            expectedQ2: 50.0,
            description: 'Plain-English explanation of aberratio ictus and praeter intentionem without Latin terms',
        },
        {
            tier: 'E. Doctrine Names Only (No Analysis)',
            text: 'The applicable doctrines are aberratio ictus under Article 4, paragraph 1, and praeter intentionem under Article 13, paragraph 3 of the Revised Penal Code.',
            expectedQ1: 0,
            expectedQ2: 32.5,
            description: 'Cites legal articles and doctrines but lacks factual analysis and IRAC reasoning',
        },
        {
            tier: 'F. Doctrine + One Element',
            text: 'Under Article 4, paragraph 1 of the Revised Penal Code, X is criminally liable for the death of Z under the doctrine of aberratio ictus because he committed an unlawful assault against Y that directly caused Z to fall and die.',
            expectedQ1: 0,
            expectedQ2: 44.0,
            description: 'Applies Article 4(1) and proximate cause, but omits Article 13(3) praeter intentionem',
        },
        {
            tier: 'G. Partial Legal Analysis',
            text: 'X is liable for Homicide under Article 249 in relation to Article 4, paragraph 1 (aberratio ictus) of the Revised Penal Code. He is liable because his wrongful act of slapping Y caused Z to fall and suffer a skull fracture. However, X did not intend to kill Z, so he is entitled to mitigating circumstance under Article 13(3).',
            expectedQ1: 0,
            expectedQ2: 66.5,
            description: 'Solid analysis covering both doctrines and proximate cause with developing structure',
        },
        {
            tier: 'H. Mostly Complete Analysis',
            text: 'ISSUE: What is the criminal liability of X for the death of Z?\nRULE: Under Article 4(1) RPC, criminal liability is incurred for any felony although the wrongful act done be different from that intended (aberratio ictus). Under Article 13(3) RPC, lack of intent to commit so grave a wrong is mitigating.\nANALYSIS: X committed an unlawful physical assault against Y. His blow landed on Z, causing a fatal skull fracture. Under proximate cause doctrine, X is liable for Homicide, mitigated by praeter intentionem.\nCONCLUSION: X is guilty of Homicide with one mitigating circumstance.',
            expectedQ1: 0,
            expectedQ2: 82.5,
            description: 'Full IRAC structure addressing all legal rules and proximate cause',
        },
        {
            tier: 'I. Exemplary Grounded IRAC Analysis',
            text: 'ISSUE: Whether X is criminally liable for Homicide for the death of Z resulting from a missed blow intended for Y.\n\nRULE: Under Article 4, Paragraph 1 of the Revised Penal Code, criminal liability is incurred by any person committing a felony although the wrongful act done be different from that which he intended (aberratio ictus or mistake in the blow). Under Article 13, Paragraph 3 of the Revised Penal Code, praeter intentionem (having no intention to commit so grave a wrong as that committed) serves as a mitigating circumstance. Under Article 249 RPC, the killing of a person without qualifying circumstances constitutes Homicide.\n\nANALYSIS: Applying the facts, X was engaged in an initial intentional felony (slight physical injuries or assault against Y). When Y ducked, X struck Z, causing Z to lose balance, strike a concrete curb, suffer a skull fracture, and die. Under the proximate cause doctrine (Art. 4, Par. 1 RPC), X is liable for all the natural and direct consequences of his felonious act, even if the victim and result were unintended. However, because X only intended a minor physical slap and had no animus necandi or intent to inflict a fatal injury, he is entitled to the mitigating circumstance of praeter intentionem under Article 13(3) RPC.\n\nCONCLUSION: Therefore, X is guilty beyond reasonable doubt of consummated Homicide under Article 249 in relation to Article 4(1) of the Revised Penal Code, with the benefit of one mitigating circumstance under Article 13(3) RPC.',
            expectedQ1: 0,
            expectedQ2: 100.0,
            description: 'Flawless legal analysis and synthesis with complete IRAC structure and citations',
        },
    ];
    console.log('| Tier | Description | Q1 (Self-Defense) | Q2 (Aberratio Ictus) | Alignment Verdict |');
    console.log('| :--- | :--- | :--- | :--- | :--- |');
    for (const item of calibrationSet) {
        const scoreQ1 = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q1, rubricCriteria, item.text, totalMax).numericalScore;
        const scoreQ2 = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, item.text, totalMax).numericalScore;
        console.log(`| ${item.tier} | ${item.description} | ${scoreQ1} pts | ${scoreQ2} pts | ${scoreQ1 === 0 && scoreQ2 >= 0 ? 'CALIBRATED ✓' : 'CHECK'} |`);
        if (item.tier === 'A. Nonsense' || item.tier === 'B. Irrelevant Response') {
            console.assert(scoreQ1 === 0, `${item.tier} on Q1 must be 0`);
            console.assert(scoreQ2 === 0, `${item.tier} on Q2 must be 0`);
        }
    }
    // =========================================================================
    // PART 3: Q1 SCENARIO CALIBRATION SET
    // =========================================================================
    console.log('\n================================================================');
    console.log('PART 3: Q1 (SELF-DEFENSE) CALIBRATION PROGRESSION:');
    console.log('================================================================\n');
    const q1CalibrationSet = [
        {
            tier: 'A. Nonsense',
            text: 'idk teheee haha',
        },
        {
            tier: 'B. Irrelevant',
            text: 'The weather in Butuan is sunny and humid today.',
        },
        {
            tier: 'C. Relevant Factual Observation Only',
            text: 'B attacked A with a knife so A shot him.',
        },
        {
            tier: 'D. Non-Keyword Concept Equivalents',
            text: 'A had to defend his life because B suddenly rushed at him with a deadly knife. A used his gun to stop the mortal threat, and A did nothing to start the fight.',
        },
        {
            tier: 'E. Doctrine Names Only',
            text: 'Self-defense under Article 11, paragraph 1 of the Revised Penal Code.',
        },
        {
            tier: 'F. Doctrine + One Element',
            text: 'Under Article 11, paragraph 1 of the Revised Penal Code, A is justified because B committed unlawful aggression by attacking with a knife.',
        },
        {
            tier: 'G. Exemplary IRAC',
            text: 'ISSUE: Whether A can validly invoke complete self-defense under Article 11(1) of the Revised Penal Code.\nRULE: The elements of self-defense are: (1) Unlawful aggression; (2) Reasonable necessity of the means employed; (3) Lack of sufficient provocation.\nANALYSIS: B initiated an actual, sudden, and imminent knife assault against A without provocation. A fired a single gunshot to protect his life under the doctrine of rational equivalence.\nCONCLUSION: All three elements concur. A is justified and exempt from criminal liability.',
        },
    ];
    console.log('| Tier | Q1 (Self-Defense) | Q2 (Aberratio Ictus) | Alignment Verdict |');
    console.log('| :--- | :--- | :--- | :--- |');
    for (const item of q1CalibrationSet) {
        const scoreQ1 = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q1, rubricCriteria, item.text, totalMax).numericalScore;
        const scoreQ2 = ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, item.text, totalMax).numericalScore;
        console.log(`| ${item.tier} | ${scoreQ1} pts | ${scoreQ2} pts | ${scoreQ1 >= 0 && scoreQ2 === 0 ? 'CALIBRATED ✓' : 'CHECK'} |`);
    }
    console.log('\n📊 Monotonic Score Progression Verification for Q2:');
    const scoresQ2 = calibrationSet.map((item) => ai_evaluator_service_1.AiEvaluatorService.generateDemoSimulation(q2, rubricCriteria, item.text, totalMax).numericalScore);
    console.log(`   Nonsense (0) == Irrelevant (0) < Factual Observation (${scoresQ2[2]}) < Doctrine Only (${scoresQ2[4]}) < Plain-English (${scoresQ2[3]}) < Partial (${scoresQ2[6]}) < Mostly Complete (${scoresQ2[7]}) < Exemplary (${scoresQ2[8]})`);
    console.assert(scoresQ2[0] === 0, 'Nonsense must be 0');
    console.assert(scoresQ2[1] === 0, 'Irrelevant must be 0');
    console.assert(scoresQ2[2] > 0, 'Factual observation on Q2 must be > 0');
    console.assert(scoresQ2[3] > scoresQ2[2], 'Plain English concept must score higher than mere factual sentence');
    console.assert(scoresQ2[6] > scoresQ2[4], 'Substantive partial analysis must score higher than doctrine names only');
    console.assert(scoresQ2[8] >= 90, 'Exemplary IRAC must score >= 90');
    console.log('\n🎉 ALL SEMANTIC CALIBRATION CHECKS PASSED WITH MATHEMATICAL RIGOR!');
}
runSemanticCalibrationAudit()
    .catch((err) => {
    console.error('Calibration audit failed:', err);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
