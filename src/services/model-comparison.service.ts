import { prisma } from '../lib/prisma';

export interface ModelComparisonCriterionMeans {
  form: number;
  answer: number;
  rule: number;
  application: number;
  conclusion: number;
}

export interface ModelSummaryStats {
  modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  researchName: string;
  exactModelId: string;
  modelFamily: string;
  evaluationsCount: number;
  studentCount: number;
  meanForm: number;
  meanAnswer: number;
  meanRule: number;
  meanApplication: number;
  meanConclusion: number;
  meanRawTotal: number;
  meanRoundedTotal: number;
  meanOverallScore50?: number;
  completeSessionsCount?: number;
  incompleteSessionsCount?: number;
  scoreDistribution: {
    0: number;
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface QuestionLevelComparisonResult {
  question: {
    id: string;
    code: string;
    title: string;
    testSet: string;
    orderIndex: number;
    prompt: string;
    modelAnswer: string;
  };
  filterMeta: {
    selectedTestSet: string;
    selectedAgentVersionTag: string;
    isDemo: boolean;
    matchedOnly: boolean;
  };
  sampleSize: number; // unique students evaluated
  matchedSampleSize: number; // students evaluated by all 3 models
  availableQuestions: Array<{ id: string; code: string; title: string; orderIndex: number; testSet: string }>;
  availableVersions: Array<{ id: string; versionTag: string; label: string; evaluationCount: number }>;
  models: {
    MODEL_A: ModelSummaryStats;
    MODEL_B: ModelSummaryStats;
    MODEL_C: ModelSummaryStats;
  };
  studentBreakdown: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    sessionId: string;
    submittedAt: string;
    studentAnswer: string;
    modelA?: {
      numericalScore: number;
      roundedScore: number;
      formScore: number;
      answerScore: number;
      ruleScore: number;
      applicationScore: number;
      conclusionScore: number;
      scoringBasis: string;
      reviewFlags: string[];
    };
    modelB?: {
      numericalScore: number;
      roundedScore: number;
      formScore: number;
      answerScore: number;
      ruleScore: number;
      applicationScore: number;
      conclusionScore: number;
      scoringBasis: string;
      reviewFlags: string[];
    };
    modelC?: {
      numericalScore: number;
      roundedScore: number;
      formScore: number;
      answerScore: number;
      ruleScore: number;
      applicationScore: number;
      conclusionScore: number;
      scoringBasis: string;
      reviewFlags: string[];
    };
  }>;
}

export interface SummativeModelComparisonResult {
  filterMeta: {
    selectedTestSet: string;
    selectedAgentVersionTag: string;
    isDemo: boolean;
    matchedOnly: boolean;
  };
  totalEligibleEvaluations: number;
  totalUniqueStudents: number;
  completeSessionsCount: number;
  incompleteSessionsCount: number;
  availableVersions: Array<{ id: string; versionTag: string; label: string; evaluationCount: number }>;
  availableTestSets: string[];
  models: {
    MODEL_A: ModelSummaryStats;
    MODEL_B: ModelSummaryStats;
    MODEL_C: ModelSummaryStats;
  };
  questionPerformance: Array<{
    questionId: string;
    questionCode: string;
    questionTitle: string;
    orderIndex: number;
    testSet: string;
    modelA: { meanRoundedTotal: number; meanRawTotal: number; count: number };
    modelB: { meanRoundedTotal: number; meanRawTotal: number; count: number };
    modelC: { meanRoundedTotal: number; meanRawTotal: number; count: number };
  }>;
  matchedSampleSummary?: {
    matchedSampleSize: number;
    models: {
      MODEL_A: { meanRawTotal: number; meanRoundedTotal: number };
      MODEL_B: { meanRawTotal: number; meanRoundedTotal: number };
      MODEL_C: { meanRawTotal: number; meanRoundedTotal: number };
    };
  };
}

export class ModelComparisonService {
  /**
   * Helper to compute custom rounding for 5-point scale:
   * <= 0.50 -> round down
   * > 0.50 -> round up
   * exactly 0.50 -> round down
   */
  static customRoundFivePoint(grade: number): number {
    const clamped = Math.max(0, Math.min(5, grade));
    const integerPart = Math.floor(clamped);
    const fractionalPart = clamped - integerPart;
    if (fractionalPart > 0.50 + 1e-12) {
      return Math.min(5, integerPart + 1);
    }
    return integerPart;
  }

  /**
   * Helper to compute custom-rounded 5-point grade from raw percentage (0-100)
   */
  static percentageToRoundedFivePoint(percentage: number): number {
    const raw5Pt = (percentage / 100) * 5;
    return ModelComparisonService.customRoundFivePoint(raw5Pt);
  }

  /**
   * Extract criterion score from parsed JSON array
   */
  static extractCriterionScore(crits: any[], name: string): number {
    if (!Array.isArray(crits)) return 0;
    const item = crits.find((c) => c.criterionName?.toLowerCase().includes(name.toLowerCase()));
    return typeof item?.score === 'number' ? item.score : 0;
  }

  /**
   * Retrieve available filter options for comparison dashboards
   */
  static async getAvailableFilters() {
    const [agentVersions, questions, modelConfigs] = await Promise.all([
      prisma.agentVersion.findMany({
        select: {
          id: true,
          versionTag: true,
          label: true,
          isActive: true,
          isLocked: true,
          _count: { select: { evaluations: true } },
        },
        orderBy: { versionTag: 'asc' },
      }),
      prisma.question.findMany({
        select: { id: true, code: true, title: true, testSet: true, orderIndex: true },
        orderBy: [{ testSet: 'asc' }, { orderIndex: 'asc' }],
      }),
      prisma.modelConfigSetting.findMany({
        orderBy: { modelSlot: 'asc' },
      }),
    ]);

    const testSets = Array.from(new Set(questions.map((q) => q.testSet).filter(Boolean)));

    return {
      agentVersions: agentVersions.map((v) => ({
        id: v.id,
        versionTag: v.versionTag,
        label: v.label,
        isActive: v.isActive,
        isLocked: v.isLocked,
        evaluationCount: v._count.evaluations,
      })),
      testSets,
      questions,
      models: modelConfigs.map((m) => ({
        slot: m.modelSlot,
        researchName: m.researchName,
        exactModelId: m.exactModelId,
        family: m.modelFamily,
      })),
    };
  }

  /**
   * QUESTION-LEVEL COMPARISON
   * Aggregates evaluations for a specific question across all students who answered it.
   */
  static async getQuestionLevelComparison(params: {
    testSet?: string;
    questionId?: string;
    questionCode?: string;
    agentVersionTag?: string;
    isDemo?: boolean;
    matchedOnly?: boolean;
  }): Promise<QuestionLevelComparisonResult> {
    const isDemo = params.isDemo ?? false;
    const testSet = params.testSet || 'TEST_1';
    const rawTag = params.agentVersionTag || (isDemo ? 'V2' : 'V1');
    const versionTag = rawTag === 'V4' ? 'V2' : rawTag;
    const matchedOnly = params.matchedOnly ?? false;

    // 1. Fetch questions for this testSet (or all if ALL)
    const whereQuestions: any = {};
    if (testSet && testSet !== 'ALL') {
      whereQuestions.testSet = testSet;
    }
    const allQuestionsInTest = await prisma.question.findMany({
      where: whereQuestions,
      orderBy: [{ testSet: 'asc' }, { orderIndex: 'asc' }],
    });

    if (allQuestionsInTest.length === 0) {
      throw new Error(`No questions found for test set: ${testSet}`);
    }

    // 2. Select target question
    let targetQuestion = allQuestionsInTest[0];
    if (params.questionId) {
      const match = allQuestionsInTest.find((q) => q.id === params.questionId);
      if (match) targetQuestion = match;
    } else if (params.questionCode) {
      const match = allQuestionsInTest.find((q) => q.code === params.questionCode);
      if (match) targetQuestion = match;
    }

    // 3. Fetch agent versions for dropdown (scoped to current isDemo dataset)
    const availableVersionsRaw = await prisma.agentVersion.findMany({
      select: {
        id: true,
        versionTag: true,
        label: true,
        _count: { select: { evaluations: { where: { isDemo } } } },
      },
      orderBy: { versionTag: 'asc' },
    });
    const availableVersions = availableVersionsRaw.map((v) => ({
      id: v.id,
      versionTag: v.versionTag,
      label: v.label,
      evaluationCount: v._count.evaluations,
    }));

    // Find agentVersionId corresponding to versionTag
    const selectedVersion = availableVersionsRaw.find((v) => v.versionTag === versionTag);

    // 4. Fetch all evaluations for this question matching filters
    const whereClause: any = {
      isDemo,
      questionId: targetQuestion.id,
    };
    if (selectedVersion) {
      whereClause.agentVersionId = selectedVersion.id;
    }

    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, name: true, email: true } },
        session: { select: { id: true, submittedAt: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 5. Group by Student to analyze completeness & matched samples
    const studentSubmissionMap = new Map<string, {
      studentId: string;
      studentName: string;
      studentEmail: string;
      sessionId: string;
      submittedAt: string;
      studentAnswer: string;
      evals: Record<string, any>;
    }>();

    evaluations.forEach((e) => {
      const studentKey = e.studentId;
      if (!studentSubmissionMap.has(studentKey)) {
        studentSubmissionMap.set(studentKey, {
          studentId: e.studentId,
          studentName: e.student?.name || 'Anonymous Student',
          studentEmail: e.student?.email || '',
          sessionId: e.sessionId,
          submittedAt: e.session?.submittedAt?.toISOString() || e.createdAt.toISOString(),
          studentAnswer: e.studentAnswer || '',
          evals: {},
        });
      }

      const st = studentSubmissionMap.get(studentKey)!;
      if (e.modelSlot) {
        st.evals[e.modelSlot] = e;
      }
    });

    // Calculate matched sample (students who have evaluations from MODEL_A, MODEL_B, and MODEL_C)
    const allStudents = Array.from(studentSubmissionMap.values());
    const matchedStudents = allStudents.filter(
      (st) => st.evals['MODEL_A'] && st.evals['MODEL_B'] && st.evals['MODEL_C']
    );

    const activeStudentList = matchedOnly ? matchedStudents : allStudents;

    // Helper to calculate statistics for a specific model slot
    const computeModelSummary = (
      slot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C',
      defaultName: string,
      defaultId: string,
      defaultFamily: string
    ): ModelSummaryStats => {
      const relevantEvals: any[] = [];
      activeStudentList.forEach((st) => {
        if (st.evals[slot]) relevantEvals.push(st.evals[slot]);
      });

      const count = relevantEvals.length;
      if (count === 0) {
        return {
          modelSlot: slot,
          researchName: defaultName,
          exactModelId: defaultId,
          modelFamily: defaultFamily,
          evaluationsCount: 0,
          studentCount: 0,
          meanForm: 0,
          meanAnswer: 0,
          meanRule: 0,
          meanApplication: 0,
          meanConclusion: 0,
          meanRawTotal: 0,
          meanRoundedTotal: 0,
          scoreDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const firstEval = relevantEvals[0];
      let researchName = defaultName;
      let exactModelId = firstEval.exactModelId || defaultId;
      let modelFamily = firstEval.modelFamily || defaultFamily;
      try {
        const mSnap = JSON.parse(firstEval.modelConfigSnapshot || '{}');
        if (mSnap.researchName) researchName = mSnap.researchName;
      } catch {}

      let sumForm = 0;
      let sumAns = 0;
      let sumRule = 0;
      let sumApp = 0;
      let sumConcl = 0;
      let sumRaw = 0;
      let sumRounded = 0;
      const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      relevantEvals.forEach((ev) => {
        let crits: any[] = [];
        try {
          crits = JSON.parse(ev.criterionScores || '[]');
        } catch {}

        const form = ModelComparisonService.extractCriterionScore(crits, 'Form');
        const ans = ModelComparisonService.extractCriterionScore(crits, 'Answer');
        const rule = ModelComparisonService.extractCriterionScore(crits, 'Rule');
        const app = ModelComparisonService.extractCriterionScore(crits, 'Application');
        const concl = ModelComparisonService.extractCriterionScore(crits, 'Conclusion');

        sumForm += form;
        sumAns += ans;
        sumRule += rule;
        sumApp += app;
        sumConcl += concl;

        const raw = ev.numericalScore ?? 0;
        sumRaw += raw;

        const rounded = (ev as any).roundedScore ?? ModelComparisonService.percentageToRoundedFivePoint(raw);
        sumRounded += rounded;

        const clampedRnd = Math.max(0, Math.min(5, Math.round(rounded)));
        dist[clampedRnd] = (dist[clampedRnd] || 0) + 1;
      });

      return {
        modelSlot: slot,
        researchName,
        exactModelId,
        modelFamily,
        evaluationsCount: count,
        studentCount: count,
        meanForm: Math.round((sumForm / count) * 100) / 100,
        meanAnswer: Math.round((sumAns / count) * 100) / 100,
        meanRule: Math.round((sumRule / count) * 100) / 100,
        meanApplication: Math.round((sumApp / count) * 100) / 100,
        meanConclusion: Math.round((sumConcl / count) * 100) / 100,
        meanRawTotal: Math.round((sumRaw / count) * 100) / 100,
        meanRoundedTotal: Math.round((sumRounded / count) * 100) / 100,
        scoreDistribution: dist as any,
      };
    };

    const modelAStats = computeModelSummary('MODEL_A', 'Meta Llama 3.2 3B', 'llama3.2:3b', 'Llama 3.2');
    const modelBStats = computeModelSummary('MODEL_B', 'Microsoft Phi-4-mini', 'phi4-mini:3.8b', 'Phi-4');
    const modelCStats = computeModelSummary('MODEL_C', 'Google Gemma 2 2B', 'gemma2:2b', 'Gemma 2');

    // Build row-by-row student breakdown
    const studentBreakdown = activeStudentList.map((st) => {
      const formatEval = (ev?: any) => {
        if (!ev) return undefined;
        let crits: any[] = [];
        try {
          crits = JSON.parse(ev.criterionScores || '[]');
        } catch {}

        let flags: string[] = [];
        try {
          flags = JSON.parse(ev.reviewFlags || '[]');
        } catch {}

        const raw = ev.numericalScore ?? 0;
        const rounded = ev.roundedScore ?? ModelComparisonService.percentageToRoundedFivePoint(raw);

        return {
          numericalScore: raw,
          roundedScore: rounded,
          formScore: ModelComparisonService.extractCriterionScore(crits, 'Form'),
          answerScore: ModelComparisonService.extractCriterionScore(crits, 'Answer'),
          ruleScore: ModelComparisonService.extractCriterionScore(crits, 'Rule'),
          applicationScore: ModelComparisonService.extractCriterionScore(crits, 'Application'),
          conclusionScore: ModelComparisonService.extractCriterionScore(crits, 'Conclusion'),
          scoringBasis: ev.scoringBasis || '',
          reviewFlags: flags,
        };
      };

      return {
        studentId: st.studentId,
        studentName: st.studentName,
        studentEmail: st.studentEmail,
        sessionId: st.sessionId,
        submittedAt: st.submittedAt,
        studentAnswer: st.studentAnswer,
        modelA: formatEval(st.evals['MODEL_A']),
        modelB: formatEval(st.evals['MODEL_B']),
        modelC: formatEval(st.evals['MODEL_C']),
      };
    });

    // Sort students alphabetically
    studentBreakdown.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return {
      question: {
        id: targetQuestion.id,
        code: targetQuestion.code,
        title: targetQuestion.title,
        testSet: targetQuestion.testSet || testSet,
        orderIndex: targetQuestion.orderIndex,
        prompt: targetQuestion.scenario,
        modelAnswer: targetQuestion.modelAnswer,
      },
      filterMeta: {
        selectedTestSet: testSet,
        selectedAgentVersionTag: versionTag,
        isDemo,
        matchedOnly,
      },
      sampleSize: allStudents.length,
      matchedSampleSize: matchedStudents.length,
      availableQuestions: allQuestionsInTest.map((q) => ({
        id: q.id,
        code: q.code,
        title: q.title,
        orderIndex: q.orderIndex,
        testSet: q.testSet || testSet,
      })),
      availableVersions,
      models: {
        MODEL_A: modelAStats,
        MODEL_B: modelBStats,
        MODEL_C: modelCStats,
      },
      studentBreakdown,
    };
  }

  /**
   * SUMMATIVE MODEL COMPARISON
   * Aggregates overall performance of all three models across all questions in the dataset.
   * Handles Overall Score /50 strictly for complete sessions containing all 10 questions.
   */
  static async getSummativeModelComparison(params: {
    testSet?: string;
    agentVersionTag?: string;
    isDemo?: boolean;
    matchedOnly?: boolean;
  }): Promise<SummativeModelComparisonResult> {
    const isDemo = params.isDemo ?? false;
    const testSet = params.testSet || 'ALL';
    const rawTag = params.agentVersionTag || (isDemo ? 'V2' : 'V1');
    const versionTag = rawTag === 'V4' ? 'V2' : rawTag;
    const matchedOnly = params.matchedOnly ?? false;

    // 1. Fetch available versions and testSets (scoped to current isDemo dataset)
    const [availableVersionsRaw, allQuestions] = await Promise.all([
      prisma.agentVersion.findMany({
        select: {
          id: true,
          versionTag: true,
          label: true,
          _count: { select: { evaluations: { where: { isDemo } } } },
        },
        orderBy: { versionTag: 'asc' },
      }),
      prisma.question.findMany({
        select: { id: true, code: true, title: true, testSet: true, orderIndex: true },
        orderBy: [{ testSet: 'asc' }, { orderIndex: 'asc' }],
      }),
    ]);

    const availableVersions = availableVersionsRaw.map((v) => ({
      id: v.id,
      versionTag: v.versionTag,
      label: v.label,
      evaluationCount: v._count.evaluations,
    }));
    const availableTestSets: string[] = Array.from(
      new Set(allQuestions.map((q) => q.testSet).filter((t): t is string => Boolean(t)))
    );

    const selectedVersion = availableVersionsRaw.find((v) => v.versionTag === versionTag);

    // 2. Build where filter for evaluations
    const whereClause: any = { isDemo };
    if (selectedVersion) {
      whereClause.agentVersionId = selectedVersion.id;
    }

    // Filter by testSet if specified and not 'ALL'
    if (testSet !== 'ALL') {
      const questionIdsForTestSet = allQuestions.filter((q) => q.testSet === testSet).map((q) => q.id);
      whereClause.questionId = { in: questionIdsForTestSet };
    }

    // 3. Fetch all eligible evaluations with session details
    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        session: { select: { id: true, status: true, submittedAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Session Completeness & Overall Score /50 calculation
    // Group evaluations by (sessionId, modelSlot)
    const sessionModelMap = new Map<string, any[]>();
    evaluations.forEach((e) => {
      const key = `${e.sessionId}__${e.modelSlot}`;
      if (!sessionModelMap.has(key)) sessionModelMap.set(key, []);
      sessionModelMap.get(key)!.push(e);
    });

    // Fetch all submitted sessions in scope to know total expected
    const submittedSessions = await prisma.assessmentSession.findMany({
      where: {
        isDemo,
        status: 'SUBMITTED',
      },
      select: { id: true, questionsSnapshot: true },
    });

    const filteredSubmittedSessions = submittedSessions.filter((s) => {
      if (testSet === 'ALL') return true;
      try {
        const snaps = JSON.parse(s.questionsSnapshot || '[]');
        return snaps[0]?.testSet === testSet;
      } catch {
        return false;
      }
    });
    const submittedSessionIds = new Set(filteredSubmittedSessions.map((s) => s.id));

    // Calculate /50 per model
    const sessionStatsByModel: Record<string, { sums50: number[]; completeCount: number; incompleteCount: number }> = {
      MODEL_A: { sums50: [], completeCount: 0, incompleteCount: 0 },
      MODEL_B: { sums50: [], completeCount: 0, incompleteCount: 0 },
      MODEL_C: { sums50: [], completeCount: 0, incompleteCount: 0 },
    };

    submittedSessionIds.forEach((sId) => {
      ['MODEL_A', 'MODEL_B', 'MODEL_C'].forEach((slot) => {
        const evals = sessionModelMap.get(`${sId}__${slot}`) || [];
        // Check if all 10 expected questions exist for this session and model
        const distinctQuestions = new Set(evals.map((e) => e.questionId));
        if (distinctQuestions.size === 10) {
          // Complete session: sum the 10 custom-rounded /5 grades
          let sessionSum50 = 0;
          evals.forEach((e) => {
            const raw = e.numericalScore ?? 0;
            const rnd = ModelComparisonService.percentageToRoundedFivePoint(raw);
            sessionSum50 += rnd;
          });
          sessionStatsByModel[slot].sums50.push(sessionSum50);
          sessionStatsByModel[slot].completeCount++;
        } else {
          sessionStatsByModel[slot].incompleteCount++;
        }
      });
    });

    // 5. Matched-sample identification: group by (sessionId, questionId)
    const questionSubmissionsMap = new Map<string, Record<string, any>>();
    evaluations.forEach((e) => {
      const key = `${e.sessionId}__${e.questionId}`;
      if (!questionSubmissionsMap.has(key)) questionSubmissionsMap.set(key, {});
      questionSubmissionsMap.get(key)![e.modelSlot] = e;
    });

    const allSubmissionPairs = Array.from(questionSubmissionsMap.values());
    const matchedSubmissionPairs = allSubmissionPairs.filter(
      (pair) => pair['MODEL_A'] && pair['MODEL_B'] && pair['MODEL_C']
    );

    // Filter evaluations if matchedOnly requested
    let effectiveEvaluations = evaluations;
    if (matchedOnly) {
      const matchedEvalIds = new Set<string>();
      matchedSubmissionPairs.forEach((pair) => {
        if (pair['MODEL_A']) matchedEvalIds.add(pair['MODEL_A'].id);
        if (pair['MODEL_B']) matchedEvalIds.add(pair['MODEL_B'].id);
        if (pair['MODEL_C']) matchedEvalIds.add(pair['MODEL_C'].id);
      });
      effectiveEvaluations = evaluations.filter((e) => matchedEvalIds.has(e.id));
    }

    // 6. Aggregate metrics for each model
    const computeSummativeModelStats = (
      slot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C',
      defaultName: string,
      defaultId: string,
      defaultFamily: string
    ): ModelSummaryStats => {
      const modelEvals = effectiveEvaluations.filter((e) => e.modelSlot === slot);
      const count = modelEvals.length;
      const uniqueStudents = new Set(modelEvals.map((e) => e.studentId)).size;

      if (count === 0) {
        return {
          modelSlot: slot,
          researchName: defaultName,
          exactModelId: defaultId,
          modelFamily: defaultFamily,
          evaluationsCount: 0,
          studentCount: 0,
          meanForm: 0,
          meanAnswer: 0,
          meanRule: 0,
          meanApplication: 0,
          meanConclusion: 0,
          meanRawTotal: 0,
          meanRoundedTotal: 0,
          meanOverallScore50: 0,
          completeSessionsCount: 0,
          incompleteSessionsCount: sessionStatsByModel[slot].incompleteCount,
          scoreDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const firstEval = modelEvals[0];
      let researchName = defaultName;
      let exactModelId = firstEval.exactModelId || defaultId;
      let modelFamily = firstEval.modelFamily || defaultFamily;
      try {
        const mSnap = JSON.parse(firstEval.modelConfigSnapshot || '{}');
        if (mSnap.researchName) researchName = mSnap.researchName;
      } catch {}

      let sumForm = 0;
      let sumAns = 0;
      let sumRule = 0;
      let sumApp = 0;
      let sumConcl = 0;
      let sumRaw = 0;
      let sumRounded = 0;
      const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      modelEvals.forEach((ev) => {
        let crits: any[] = [];
        try {
          crits = JSON.parse(ev.criterionScores || '[]');
        } catch {}

        sumForm += ModelComparisonService.extractCriterionScore(crits, 'Form');
        sumAns += ModelComparisonService.extractCriterionScore(crits, 'Answer');
        sumRule += ModelComparisonService.extractCriterionScore(crits, 'Rule');
        sumApp += ModelComparisonService.extractCriterionScore(crits, 'Application');
        sumConcl += ModelComparisonService.extractCriterionScore(crits, 'Conclusion');

        const raw = ev.numericalScore ?? 0;
        sumRaw += raw;

        const rounded = ModelComparisonService.percentageToRoundedFivePoint(raw);
        sumRounded += rounded;

        const clampedRnd = Math.max(0, Math.min(5, Math.round(rounded)));
        dist[clampedRnd] = (dist[clampedRnd] || 0) + 1;
      });

      // Calculate mean /50 across eligible complete sessions
      const sums50 = sessionStatsByModel[slot].sums50;
      const meanOverall50 = sums50.length > 0 ? Math.round((sums50.reduce((a, b) => a + b, 0) / sums50.length) * 100) / 100 : 0;

      return {
        modelSlot: slot,
        researchName,
        exactModelId,
        modelFamily,
        evaluationsCount: count,
        studentCount: uniqueStudents,
        meanForm: Math.round((sumForm / count) * 100) / 100,
        meanAnswer: Math.round((sumAns / count) * 100) / 100,
        meanRule: Math.round((sumRule / count) * 100) / 100,
        meanApplication: Math.round((sumApp / count) * 100) / 100,
        meanConclusion: Math.round((sumConcl / count) * 100) / 100,
        meanRawTotal: Math.round((sumRaw / count) * 100) / 100,
        meanRoundedTotal: Math.round((sumRounded / count) * 100) / 100,
        meanOverallScore50: meanOverall50,
        completeSessionsCount: sessionStatsByModel[slot].completeCount,
        incompleteSessionsCount: sessionStatsByModel[slot].incompleteCount,
        scoreDistribution: dist as any,
      };
    };

    const modelAStats = computeSummativeModelStats('MODEL_A', 'Meta Llama 3.2 3B', 'llama3.2:3b', 'Llama 3.2');
    const modelBStats = computeSummativeModelStats('MODEL_B', 'Microsoft Phi-4-mini', 'phi4-mini:3.8b', 'Phi-4');
    const modelCStats = computeSummativeModelStats('MODEL_C', 'Google Gemma 2 2B', 'gemma2:2b', 'Gemma 2');

    // 7. Question-Level Performance Breakdown across the active questions (Q01-Q10)
    const targetQuestions = testSet === 'ALL' ? allQuestions : allQuestions.filter((q) => q.testSet === testSet);
    // Sort Q01 to Q10 by orderIndex
    targetQuestions.sort((a, b) => a.orderIndex - b.orderIndex);

    const questionPerformance = targetQuestions.map((q) => {
      const qEvals = effectiveEvaluations.filter((e) => e.questionId === q.id);

      const getModelQStats = (slot: string) => {
        const evals = qEvals.filter((e) => e.modelSlot === slot);
        const count = evals.length;
        if (count === 0) return { meanRoundedTotal: 0, meanRawTotal: 0, count: 0 };

        const sumRaw = evals.reduce((acc, e) => acc + (e.numericalScore ?? 0), 0);
        const sumRnd = evals.reduce(
          (acc, e) => acc + ModelComparisonService.percentageToRoundedFivePoint(e.numericalScore ?? 0),
          0
        );
        return {
          meanRawTotal: Math.round((sumRaw / count) * 100) / 100,
          meanRoundedTotal: Math.round((sumRnd / count) * 100) / 100,
          count,
        };
      };

      return {
        questionId: q.id,
        questionCode: q.code,
        questionTitle: q.title,
        orderIndex: q.orderIndex,
        testSet: q.testSet || testSet,
        modelA: getModelQStats('MODEL_A'),
        modelB: getModelQStats('MODEL_B'),
        modelC: getModelQStats('MODEL_C'),
      };
    });

    // 8. Matched sample overall summary
    let matchedSampleSummary: any = undefined;
    if (matchedSubmissionPairs.length > 0) {
      const calcMatchedModel = (slot: string) => {
        let sumRaw = 0;
        let sumRnd = 0;
        matchedSubmissionPairs.forEach((pair) => {
          const ev = pair[slot];
          const raw = ev?.numericalScore ?? 0;
          sumRaw += raw;
          sumRnd += ev?.roundedScore ?? ModelComparisonService.percentageToRoundedFivePoint(raw);
        });
        const n = matchedSubmissionPairs.length;
        return {
          meanRawTotal: Math.round((sumRaw / n) * 100) / 100,
          meanRoundedTotal: Math.round((sumRnd / n) * 100) / 100,
        };
      };

      matchedSampleSummary = {
        matchedSampleSize: matchedSubmissionPairs.length,
        models: {
          MODEL_A: calcMatchedModel('MODEL_A'),
          MODEL_B: calcMatchedModel('MODEL_B'),
          MODEL_C: calcMatchedModel('MODEL_C'),
        },
      };
    }

    const uniqueStudentsOverall = new Set(effectiveEvaluations.map((e) => e.studentId)).size;

    return {
      filterMeta: {
        selectedTestSet: testSet,
        selectedAgentVersionTag: versionTag,
        isDemo,
        matchedOnly,
      },
      totalEligibleEvaluations: effectiveEvaluations.length,
      totalUniqueStudents: uniqueStudentsOverall,
      completeSessionsCount: sessionStatsByModel['MODEL_A'].completeCount,
      incompleteSessionsCount: sessionStatsByModel['MODEL_A'].incompleteCount,
      availableVersions,
      availableTestSets,
      models: {
        MODEL_A: modelAStats,
        MODEL_B: modelBStats,
        MODEL_C: modelCStats,
      },
      questionPerformance,
      matchedSampleSummary,
    };
  }

  /**
   * RESEARCH CSV EXPORT GENERATOR
   * Supports all 5 required export types with full numeric precision:
   * 1. question-level
   * 2. summative-criteria
   * 3. score-distributions
   * 4. complete-sessions-50
   * 5. matched-sample
   *
   * Includes strict student privacy (anonymized participant IDs by default)
   * and spreadsheet formula injection neutralization (=, +, -, @).
   */
  static async generateCsvExport(
    type: string,
    options: { testSet?: string; agentVersionTag?: string; isDemo?: boolean; includePersonalData?: boolean }
  ) {
    const isDemo = options.isDemo ?? false;
    const testSet = options.testSet || 'TEST_1';
    const rawTag = options.agentVersionTag || (isDemo ? 'V2' : 'V1');
    const versionTag = rawTag === 'V4' ? 'V2' : rawTag;
    const includePersonalData = options.includePersonalData ?? false;

    // Spreadsheet formula injection guard
    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Prepend single quote if string begins with =, +, -, @, tab, or CR
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    if (type === 'question-level') {
      const qRes = await ModelComparisonService.getQuestionLevelComparison({
        testSet,
        agentVersionTag: versionTag,
        isDemo,
      });

      // Deterministic anonymization mapping for student privacy
      const uniqueStudentIds = Array.from(new Set(qRes.studentBreakdown.map((s) => s.studentId))).sort();
      const participantMap = new Map<string, string>();
      uniqueStudentIds.forEach((sId, idx) => {
        participantMap.set(sId, `Participant_${String(idx + 1).padStart(2, '0')}`);
      });

      const rows: string[] = [];
      if (includePersonalData) {
        rows.push('TestSet,QuestionCode,QuestionTitle,AgentVersion,StudentName,StudentEmail,ModelSlot,ModelName,Form_15,Answer_15,Rule_30,Application_30,Conclusion_10,RawTotal_100,RoundedTotal_5');
      } else {
        rows.push('TestSet,QuestionCode,QuestionTitle,AgentVersion,ParticipantId,ModelSlot,ModelName,Form_15,Answer_15,Rule_30,Application_30,Conclusion_10,RawTotal_100,RoundedTotal_5');
      }

      qRes.studentBreakdown.forEach((st) => {
        const participantId = participantMap.get(st.studentId) || 'Participant_Unknown';
        const addRow = (slot: string, modelName: string, m?: any) => {
          if (!m) return;
          const identityCols = includePersonalData
            ? [escapeCsv(st.studentName), escapeCsv(st.studentEmail)]
            : [escapeCsv(participantId)];

          rows.push(
            [
              escapeCsv(qRes.question.testSet),
              escapeCsv(qRes.question.code),
              escapeCsv(qRes.question.title),
              escapeCsv(versionTag),
              ...identityCols,
              escapeCsv(slot),
              escapeCsv(modelName),
              m.formScore,
              m.answerScore,
              m.ruleScore,
              m.applicationScore,
              m.conclusionScore,
              m.numericalScore,
              m.roundedScore,
            ].join(',')
          );
        };

        addRow('MODEL_A', qRes.models.MODEL_A.researchName, st.modelA);
        addRow('MODEL_B', qRes.models.MODEL_B.researchName, st.modelB);
        addRow('MODEL_C', qRes.models.MODEL_C.researchName, st.modelC);
      });

      return rows.join('\n');
    }

    if (type === 'summative-criteria') {
      const sRes = await ModelComparisonService.getSummativeModelComparison({
        testSet,
        agentVersionTag: versionTag,
        isDemo,
      });

      const rows: string[] = [];
      rows.push('TestSet,AgentVersion,ModelSlot,ModelName,SampleEvaluations_N,UniqueStudents_N,MeanForm_15,MeanAnswer_15,MeanRule_30,MeanApplication_30,MeanConclusion_10,MeanRawTotal_100,MeanRoundedTotal_5,MeanOverallScore_50,CompleteSessions_N,IncompleteSessions_N');

      const addSummaryRow = (m: ModelSummaryStats) => {
        rows.push(
          [
            escapeCsv(testSet),
            escapeCsv(versionTag),
            escapeCsv(m.modelSlot),
            escapeCsv(m.researchName),
            m.evaluationsCount,
            m.studentCount,
            m.meanForm,
            m.meanAnswer,
            m.meanRule,
            m.meanApplication,
            m.meanConclusion,
            m.meanRawTotal,
            m.meanRoundedTotal,
            m.meanOverallScore50 ?? '',
            m.completeSessionsCount ?? '',
            m.incompleteSessionsCount ?? '',
          ].join(',')
        );
      };

      addSummaryRow(sRes.models.MODEL_A);
      addSummaryRow(sRes.models.MODEL_B);
      addSummaryRow(sRes.models.MODEL_C);

      return rows.join('\n');
    }

    if (type === 'score-distributions') {
      const sRes = await ModelComparisonService.getSummativeModelComparison({
        testSet,
        agentVersionTag: versionTag,
        isDemo,
      });

      const rows: string[] = [];
      rows.push('TestSet,AgentVersion,ModelSlot,ModelName,Grade_0,Grade_1,Grade_2,Grade_3,Grade_4,Grade_5,TotalEvaluations');

      const addDistRow = (m: ModelSummaryStats) => {
        rows.push(
          [
            escapeCsv(testSet),
            escapeCsv(versionTag),
            escapeCsv(m.modelSlot),
            escapeCsv(m.researchName),
            m.scoreDistribution[0],
            m.scoreDistribution[1],
            m.scoreDistribution[2],
            m.scoreDistribution[3],
            m.scoreDistribution[4],
            m.scoreDistribution[5],
            m.evaluationsCount,
          ].join(',')
        );
      };

      addDistRow(sRes.models.MODEL_A);
      addDistRow(sRes.models.MODEL_B);
      addDistRow(sRes.models.MODEL_C);

      return rows.join('\n');
    }

    if (type === 'complete-sessions-50') {
      const selectedVersion = await prisma.agentVersion.findFirst({
        where: { versionTag },
      });

      const submittedSessions = await prisma.assessmentSession.findMany({
        where: {
          isDemo,
          status: 'SUBMITTED',
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          evaluations: {
            where: {
              ...(selectedVersion ? { agentVersionId: selectedVersion.id } : {}),
            },
            select: { modelSlot: true, numericalScore: true, questionId: true },
          },
        },
        orderBy: { id: 'asc' },
      });

      // Deterministic anonymization mapping for student privacy
      const uniqueStudentIds = Array.from(new Set(submittedSessions.map((s) => s.student?.id || s.studentId))).sort();
      const participantMap = new Map<string, string>();
      uniqueStudentIds.forEach((sId, idx) => {
        participantMap.set(sId, `Participant_${String(idx + 1).padStart(2, '0')}`);
      });

      const rows: string[] = [];
      if (includePersonalData) {
        rows.push('SessionId,StudentName,StudentEmail,TestSet,AgentVersion,ModelSlot,CompletedQuestions_N,OverallScore_50,IsEligibleCompleteSession');
      } else {
        rows.push('SessionId,ParticipantId,TestSet,AgentVersion,ModelSlot,CompletedQuestions_N,OverallScore_50,IsEligibleCompleteSession');
      }

      submittedSessions.forEach((s) => {
        let sessionTestSet = testSet;
        try {
          const snaps = JSON.parse(s.questionsSnapshot || '[]');
          if (snaps[0]?.testSet) sessionTestSet = snaps[0].testSet;
        } catch {}

        if (testSet !== 'ALL' && sessionTestSet !== testSet) return;

        const participantId = participantMap.get(s.student?.id || s.studentId) || 'Participant_Unknown';

        ['MODEL_A', 'MODEL_B', 'MODEL_C'].forEach((slot) => {
          const evals = s.evaluations.filter((e) => e.modelSlot === slot);
          const distinctQ = new Set(evals.map((e) => e.questionId)).size;
          const isComplete = distinctQ === 10;
          let sum50 = 0;
          if (isComplete) {
            evals.forEach((e) => {
              sum50 += ModelComparisonService.percentageToRoundedFivePoint(e.numericalScore);
            });
          }

          const identityCols = includePersonalData
            ? [escapeCsv(s.student?.name || 'Student'), escapeCsv(s.student?.email || '')]
            : [escapeCsv(participantId)];

          rows.push(
            [
              escapeCsv(s.id),
              ...identityCols,
              escapeCsv(sessionTestSet),
              escapeCsv(versionTag),
              escapeCsv(slot),
              distinctQ,
              isComplete ? sum50 : '',
              isComplete ? 'TRUE' : 'FALSE',
            ].join(',')
          );
        });
      });

      return rows.join('\n');
    }

    if (type === 'matched-sample') {
      const sRes = await ModelComparisonService.getSummativeModelComparison({
        testSet,
        agentVersionTag: versionTag,
        isDemo,
        matchedOnly: true,
      });

      const rows: string[] = [];
      rows.push('TestSet,AgentVersion,ModelSlot,ModelName,MatchedSampleSize_N,MeanRawTotal_100,MeanRoundedTotal_5,MeanForm_15,MeanAnswer_15,MeanRule_30,MeanApplication_30,MeanConclusion_10');

      const addMatchedRow = (m: ModelSummaryStats) => {
        rows.push(
          [
            escapeCsv(testSet),
            escapeCsv(versionTag),
            escapeCsv(m.modelSlot),
            escapeCsv(m.researchName),
            m.evaluationsCount,
            m.meanRawTotal,
            m.meanRoundedTotal,
            m.meanForm,
            m.meanAnswer,
            m.meanRule,
            m.meanApplication,
            m.meanConclusion,
          ].join(',')
        );
      };

      addMatchedRow(sRes.models.MODEL_A);
      addMatchedRow(sRes.models.MODEL_B);
      addMatchedRow(sRes.models.MODEL_C);

      return rows.join('\n');
    }

    throw new Error(`Unsupported export type: ${type}`);
  }
}
