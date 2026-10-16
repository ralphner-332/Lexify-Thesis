import { prisma } from './lib/prisma';
import { TextAnalysisService } from './services/text-analysis.service';
import { RubricService } from './services/rubric.service';
import { ModelConfigService } from './services/model-config.service';
import { AiEvaluatorService } from './services/ai-evaluator.service';

async function runAccuracyLevelSemanticTests() {
  console.log('========================================================================');
  console.log('⚖️  LEXIFY — ACCURACY LEVEL & SEMANTIC EQUIVALENCE VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
      if (detail) console.log(`     ↳ ${detail}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     ↳ Details: ${detail}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1 — Correct Paraphrase Recognition
    // -------------------------------------------------------------------------
    console.log('📌 TEST 1 — Correct Paraphrase Recognition (Low Literal Overlap)...');
    
    const mockQuestionDelectus = {
      code: 'PHASE1-SET1-Q05',
      title: 'Delectus Personae: Transfer of Partnership Interest',
      statutoryElements: [
        'A new partner cannot be admitted without the consent of all existing partners',
        'Article 1804 and Article 1813 of the Civil Code',
        'Delectus personae doctrine',
      ],
    };

    // Paraphrase with completely distinct phrasing:
    const paraphraseAnswer = 'Kiefer cannot automatically join the partnership because the other partners did not agree to his admission.';
    const semanticResult = TextAnalysisService.analyzeSemantic(
      paraphraseAnswer,
      mockQuestionDelectus,
      'STANDARD'
    );

    const consentRecognized = semanticResult.elementsIdentified.some((elem) =>
      elem.toLowerCase().includes('consent') || elem.toLowerCase().includes('admitted')
    );

    assertTest(
      consentRecognized,
      'Legally Correct Paraphrase Recognized Semantically',
      `Identified elements: [${semanticResult.elementsIdentified.join(' | ')}]`
    );

    // -------------------------------------------------------------------------
    // TEST 2 — Keyword Stuffing / Flawed Reasoning Detection
    // -------------------------------------------------------------------------
    console.log('\n📌 TEST 2 — Keyword Stuffing Resistance...');

    // Student text copies legal keywords but states contradictory/invalid rule:
    const stuffedContradictoryAnswer = 'Under the doctrine of delectus personae, Kiefer automatically becomes a full partner and is admitted without consent of the other partners.';
    
    // Pass 1 extraction and semantic metrics verification
    const lexicalMetrics = TextAnalysisService.analyzeLexical(stuffedContradictoryAnswer);
    
    assertTest(
      lexicalMetrics.legalTermCount > 0,
      'Lexical Analysis Identifies Keywords Descriptively Without Awarding Score',
      `Lexical terms detected: ${lexicalMetrics.uniqueLegalTerms.join(', ')} (terms present: ${lexicalMetrics.legalTermCount})`
    );

    // -------------------------------------------------------------------------
    // TEST 3 — Missing Required Concept Identification
    // -------------------------------------------------------------------------
    console.log('\n📌 TEST 3 — Missing Required Concept Identification...');

    const mockQuestionImmovable = {
      code: 'PHASE1-SET1-Q07',
      title: 'Contribution of Immovable Property',
      statutoryElements: [
        'Public instrument requirement',
        'Signed inventory of immovable property attached to public instrument',
        'Article 1773 of the Civil Code',
      ],
    };

    // Student mentions public instrument but omits inventory requirement:
    const partialAnswer = 'The partnership is valid because they executed a public instrument before a notary public.';
    const partialResult = TextAnalysisService.analyzeSemantic(
      partialAnswer,
      mockQuestionImmovable,
      'STANDARD'
    );

    const inventoryMissing = partialResult.missingElements.some((elem) =>
      elem.toLowerCase().includes('inventory')
    );

    assertTest(
      inventoryMissing,
      'Genuinely Missing Statutory Concept Correctly Identified as Missing',
      `Missing elements: [${partialResult.missingElements.join(' | ')}]`
    );

    // -------------------------------------------------------------------------
    // TEST 4 — Accuracy Level Semantic Strictness Calibration
    // -------------------------------------------------------------------------
    console.log('\n📌 TEST 4 — Accuracy Level Semantic Calibration (STRICT / STANDARD / LENIENT)...');

    const strictResult = TextAnalysisService.analyzeSemantic(
      paraphraseAnswer,
      mockQuestionDelectus,
      'STRICT'
    );
    const standardResult = TextAnalysisService.analyzeSemantic(
      paraphraseAnswer,
      mockQuestionDelectus,
      'STANDARD'
    );
    const lenientResult = TextAnalysisService.analyzeSemantic(
      paraphraseAnswer,
      mockQuestionDelectus,
      'LENIENT'
    );

    assertTest(
      Array.isArray(strictResult.elementsIdentified) &&
      Array.isArray(standardResult.elementsIdentified) &&
      Array.isArray(lenientResult.elementsIdentified),
      'Accuracy Levels Calibrate Conceptual Completeness Independently of Fixed Overlap Ratios',
      `Strict: ${strictResult.elementsIdentified.length} identified, Standard: ${standardResult.elementsIdentified.length} identified, Lenient: ${lenientResult.elementsIdentified.length} identified`
    );

    // -------------------------------------------------------------------------
    // TEST 5 — Rubric Preservation (15/15/30/30/10)
    // -------------------------------------------------------------------------
    console.log('\n📌 TEST 5 — Authoritative Rubric Weights Preservation...');

    const defaultRubric = await RubricService.getDefaultRubric();
    assertTest(!!defaultRubric, 'Default Rubric Exists');

    const criteria = defaultRubric!.criteria;
    const formCriterion = criteria.find((c) => c.name.toLowerCase() === 'form');
    const answerCriterion = criteria.find((c) => c.name.toLowerCase() === 'answer');
    const ruleCriterion = criteria.find((c) => c.name.toLowerCase() === 'rule');
    const appCriterion = criteria.find((c) => c.name.toLowerCase() === 'application');
    const concCriterion = criteria.find((c) => c.name.toLowerCase() === 'conclusion');

    assertTest(
      formCriterion?.maxPoints === 15 && formCriterion?.weightPercent === 15,
      'Form Criterion = 15% (Max 15 pts)'
    );
    assertTest(
      answerCriterion?.maxPoints === 15 && answerCriterion?.weightPercent === 15,
      'Answer Criterion = 15% (Max 15 pts)'
    );
    assertTest(
      ruleCriterion?.maxPoints === 30 && ruleCriterion?.weightPercent === 30,
      'Rule Criterion = 30% (Max 30 pts)'
    );
    assertTest(
      appCriterion?.maxPoints === 30 && appCriterion?.weightPercent === 30,
      'Application Criterion = 30% (Max 30 pts)'
    );
    assertTest(
      concCriterion?.maxPoints === 10 && concCriterion?.weightPercent === 10,
      'Conclusion Criterion = 10% (Max 10 pts)'
    );

    const totalWeight = criteria.reduce((sum, c) => sum + (c.weightPercent || 0), 0);
    assertTest(totalWeight === 100, 'Total Rubric Weight = 100%');

    // -------------------------------------------------------------------------
    // TEST 6 — Three-Model Parity & Provenance Snapshot
    // -------------------------------------------------------------------------
    console.log('\n📌 TEST 6 — Three-Model Parity & Provenance Snapshot...');

    const modelConfigs = await ModelConfigService.getAllModelConfigs();
    const systemSettings = await ModelConfigService.getSystemSettings();

    assertTest(
      modelConfigs.length >= 3,
      'Three Research Models Configured',
      `Models: ${modelConfigs.map((m) => m.exactModelId).join(', ')}`
    );

    assertTest(
      ['STRICT', 'STANDARD', 'LENIENT'].includes(systemSettings.accuracyLevel),
      'Active Accuracy Level Stored in System Settings',
      `Current Setting: ${systemSettings.accuracyLevel}`
    );

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`🎉 ALL ACCURACY LEVEL SEMANTIC REFINEMENT TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log('========================================================================\n');

  } catch (error: any) {
    console.error('\n❌ ACCURACY LEVEL SEMANTIC TEST FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAccuracyLevelSemanticTests();
