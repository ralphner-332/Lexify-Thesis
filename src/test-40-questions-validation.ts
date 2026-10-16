import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runValidation() {
  console.log('🔍 Running Official 40-Question Assessment Validation...\n');

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  const failures: string[] = [];
  const passes: string[] = [];

  // Check 1: Exactly 40 active official questions exist
  if (questions.length === 40) {
    passes.push(`Check 1: Exactly 40 active official questions exist (Found: ${questions.length})`);
  } else {
    failures.push(`Check 1 FAILED: Expected 40 active official questions, found ${questions.length}`);
  }

  // Check 2: Exactly 10 belong to each test set
  const test1 = questions.filter((q) => q.testSet === 'TEST_1');
  const test2 = questions.filter((q) => q.testSet === 'TEST_2');
  const test3 = questions.filter((q) => q.testSet === 'TEST_3');
  const test4 = questions.filter((q) => q.testSet === 'TEST_4');

  if (test1.length === 10 && test2.length === 10 && test3.length === 10 && test4.length === 10) {
    passes.push(
      `Check 2: Exactly 10 belong to each test (Test 1: ${test1.length}, Test 2: ${test2.length}, Test 3: ${test3.length}, Test 4: ${test4.length})`
    );
  } else {
    failures.push(
      `Check 2 FAILED: Expected 10 per test set. Found Test 1: ${test1.length}, Test 2: ${test2.length}, Test 3: ${test3.length}, Test 4: ${test4.length}`
    );
  }

  // Check 3: Question numbers (orderIndex) 1–40 occur exactly once
  const orderIndices = questions.map((q) => q.orderIndex).sort((a, b) => a - b);
  const expectedIndices = Array.from({ length: 40 }, (_, i) => i + 1);
  const indicesMatch = JSON.stringify(orderIndices) === JSON.stringify(expectedIndices);
  if (indicesMatch) {
    passes.push('Check 3: Question order indices 1–40 occur exactly once without gaps');
  } else {
    failures.push(`Check 3 FAILED: Order indices mismatch. Found: ${JSON.stringify(orderIndices)}`);
  }

  // Check 4: No duplicate active question codes
  const codes = questions.map((q) => q.code);
  const uniqueCodes = new Set(codes);
  if (codes.length === uniqueCodes.size) {
    passes.push(`Check 4: All ${codes.length} active question codes are unique`);
  } else {
    failures.push(`Check 4 FAILED: Duplicate codes found in active set`);
  }

  // Check 5 to 10: Content checks for every question (Scenario, Answer, Rule, Application, Conclusion, Elements & Provisions)
  let allHaveScenario = true;
  let allHaveAnswer = true;
  let allHaveRule = true;
  let allHaveApp = true;
  let allHaveConcl = true;
  let allHaveStatutoryMaterials = true;

  for (const q of questions) {
    if (!q.scenario || q.scenario.trim().length === 0) {
      allHaveScenario = false;
      failures.push(`Check 5 FAILED: Question ${q.code} has empty scenario`);
    }

    const modelAns = q.modelAnswer || '';
    if (!modelAns.includes('Answer:')) {
      allHaveAnswer = false;
      failures.push(`Check 6 FAILED: Question ${q.code} missing 'Answer:' section in model answer`);
    }
    if (!modelAns.includes('Rule:')) {
      allHaveRule = false;
      failures.push(`Check 7 FAILED: Question ${q.code} missing 'Rule:' section in model answer`);
    }
    if (!modelAns.includes('Application:')) {
      allHaveApp = false;
      failures.push(`Check 8 FAILED: Question ${q.code} missing 'Application:' section in model answer`);
    }
    if (!modelAns.includes('Conclusion:')) {
      allHaveConcl = false;
      failures.push(`Check 9 FAILED: Question ${q.code} missing 'Conclusion:' section in model answer`);
    }

    let elements: string[] = [];
    try {
      elements = typeof q.statutoryElements === 'string' ? JSON.parse(q.statutoryElements) : (q.statutoryElements as any) || [];
    } catch {
      elements = [];
    }

    let provisions: string[] = [];
    try {
      provisions = typeof q.relevantProvisions === 'string' ? JSON.parse(q.relevantProvisions) : (q.relevantProvisions as any) || [];
    } catch {
      provisions = [];
    }

    if (elements.length === 0 || provisions.length === 0) {
      allHaveStatutoryMaterials = false;
      failures.push(`Check 10 FAILED: Question ${q.code} missing statutory elements or relevant provisions`);
    }
  }

  if (allHaveScenario) passes.push('Check 5: Every question has a non-empty factual scenario');
  if (allHaveAnswer) passes.push("Check 6: Every question contains the official 'Answer' component");
  if (allHaveRule) passes.push("Check 7: Every question contains the official 'Rule' component");
  if (allHaveApp) passes.push("Check 8: Every question contains the official 'Application' component");
  if (allHaveConcl) passes.push("Check 9: Every question contains the official 'Conclusion' component");
  if (allHaveStatutoryMaterials) passes.push('Check 10: Every question has required statutory elements and legal provisions');

  // Check 11: isDemo = false for all 40
  const nonDemoCount = questions.filter((q) => q.isDemo === false).length;
  if (nonDemoCount === 40) {
    passes.push('Check 11: isDemo = false for all 40 official research questions');
  } else {
    failures.push(`Check 11 FAILED: Expected all 40 questions to have isDemo = false, found ${nonDemoCount}`);
  }

  // Check 12: Test 1 contains only Q1–Q10
  const t1Indices = test1.map((q) => q.orderIndex).sort((a, b) => a - b);
  const t1Expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (JSON.stringify(t1Indices) === JSON.stringify(t1Expected)) {
    passes.push('Check 12: Test 1 contains exactly Questions 1–10');
  } else {
    failures.push(`Check 12 FAILED: Test 1 expected [1..10], found ${JSON.stringify(t1Indices)}`);
  }

  // Check 13: Test 2 contains only Q11–Q20
  const t2Indices = test2.map((q) => q.orderIndex).sort((a, b) => a - b);
  const t2Expected = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  if (JSON.stringify(t2Indices) === JSON.stringify(t2Expected)) {
    passes.push('Check 13: Test 2 contains exactly Questions 11–20');
  } else {
    failures.push(`Check 13 FAILED: Test 2 expected [11..20], found ${JSON.stringify(t2Indices)}`);
  }

  // Check 14: Test 3 contains only Q21–Q30
  const t3Indices = test3.map((q) => q.orderIndex).sort((a, b) => a - b);
  const t3Expected = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  if (JSON.stringify(t3Indices) === JSON.stringify(t3Expected)) {
    passes.push('Check 14: Test 3 contains exactly Questions 21–30');
  } else {
    failures.push(`Check 14 FAILED: Test 3 expected [21..30], found ${JSON.stringify(t3Indices)}`);
  }

  // Check 15: Test 4 contains only Q31–Q40
  const t4Indices = test4.map((q) => q.orderIndex).sort((a, b) => a - b);
  const t4Expected = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40];
  if (JSON.stringify(t4Indices) === JSON.stringify(t4Expected)) {
    passes.push('Check 15: Test 4 contains exactly Questions 31–40');
  } else {
    failures.push(`Check 15 FAILED: Test 4 expected [31..40], found ${JSON.stringify(t4Indices)}`);
  }

  console.log('====================================================');
  console.log('VALIDATION RESULTS:');
  console.log('====================================================');
  passes.forEach((p) => console.log(`✓ ${p}`));
  if (failures.length > 0) {
    console.log('\n❌ FAILURES:');
    failures.forEach((f) => console.log(`  ${f}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 15 VALIDATION CHECKS PASSED PERFECTLY!\n');
  }

  // Check System Settings
  const settings = await prisma.systemSetting.findFirst();
  console.log(`Current Active System Test Set: ${settings?.activeTestSet || 'TEST_1'}`);
  console.log(`Current Student Display Model: ${settings?.studentDisplayModel || 'MODEL_A'}`);
  console.log(`Current Accuracy Level: ${settings?.accuracyLevel || 'STANDARD'}`);

  await prisma.$disconnect();
}

runValidation().catch((err) => {
  console.error('Validation script execution error:', err);
  process.exit(1);
});
