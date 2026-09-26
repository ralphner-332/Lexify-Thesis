import { prisma } from '../lib/prisma';
import { ResearchExportBundleDTO, AcademicReportDTO } from '../dto/export.dto';
import { StatisticsService } from './statistics.service';

export class ExportService {
  /**
   * Generates a comprehensive JSON bundle containing all 10 research datasets.
   * Server default: isDemo = false (research data only).
   */
  static async exportResearchBundleJSON(options?: { isDemo?: boolean }): Promise<ResearchExportBundleDTO> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const datasets = await this.fetchAllDatasets(isDemoFilter);

    const recordCounts: Record<string, number> = {};
    Object.keys(datasets).forEach((key) => {
      recordCounts[key] = (datasets as any)[key]?.length || 0;
    });

    return {
      metadata: {
        title: 'Lexify Academic Research Dataset Export Bundle (Multi-LLM Comparative Study)',
        version: '3.0',
        exportedAt: new Date().toISOString(),
        isDemo: isDemoFilter,
        disclaimer:
          'ACADEMIC RESEARCH PROTOTYPE — Evaluates student written essay answers for comparative research on local LLMs (Meta Llama 3.2 3B, Microsoft Phi-4-mini 3.8B, Google Gemma 2 2B). Not an official legal exam, bar review grading system, or legal advice.',
        recordCounts,
      },
      datasets,
    };
  }

  /**
   * Generates a dictionary of CSV strings for all 10 research datasets.
   * Server default: isDemo = false.
   */
  static async exportResearchDatasetsCSV(options?: { isDemo?: boolean }): Promise<Record<string, string>> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const datasets = await this.fetchAllDatasets(isDemoFilter);

    const csvMap: Record<string, string> = {};

    csvMap['01_student_submissions.csv'] = this.arrayToCSV(datasets.submissions);
    csvMap['02_llama_3_2_3b_evaluations.csv'] = this.arrayToCSV(datasets.llamaEvaluations);
    csvMap['03_phi_4_mini_evaluations.csv'] = this.arrayToCSV(datasets.phi4Evaluations);
    csvMap['04_gemma_2_2b_evaluations.csv'] = this.arrayToCSV(datasets.gemma2Evaluations);
    csvMap['05_model_comparative_matrix.csv'] = this.arrayToCSV(datasets.comparativeMatrix);
    csvMap['06_lexical_semantic_analysis.csv'] = this.arrayToCSV(datasets.lexicalSemanticAnalysis);
    csvMap['07_student_usability_surveys.csv'] = this.arrayToCSV(datasets.studentSurveys);
    csvMap['08_model_configurations.csv'] = this.arrayToCSV(datasets.modelConfigs);
    csvMap['09_scoring_rubric.csv'] = this.arrayToCSV(datasets.scoringRubrics);
    csvMap['10_research_data_dictionary.csv'] = this.arrayToCSV(datasets.dataDictionary);

    // Keep model alias keys for backward compatibility
    csvMap['02_llama_3_1_8b_evaluations.csv'] = this.arrayToCSV(datasets.llamaEvaluations);
    csvMap['03_mistral_7b_evaluations.csv'] = this.arrayToCSV(datasets.phi4Evaluations);
    csvMap['04_gemma_2_9b_evaluations.csv'] = this.arrayToCSV(datasets.gemma2Evaluations);
    csvMap['02_ai_evaluations.csv'] = this.arrayToCSV(datasets.allAiEvaluations);
    csvMap['03_expert_evaluations.csv'] = this.arrayToCSV(datasets.expertEvaluations || []);
    csvMap['04_paired_comparisons.csv'] = this.arrayToCSV(datasets.comparisons || []);
    csvMap['05_refinement_logs.csv'] = this.arrayToCSV(datasets.refinementLogs || []);
    csvMap['06_agent_versions.csv'] = this.arrayToCSV(datasets.agentVersions || []);
    csvMap['07_final_v3_expert_reviews.csv'] = this.arrayToCSV(datasets.finalV3Reviews || []);
    csvMap['09_expert_capability_surveys.csv'] = this.arrayToCSV(datasets.expertSurveys || []);

    return csvMap;
  }

  /**
   * Compiles structured data for the printable/downloadable Thesis-Ready Academic Research Report.
   * Server default: isDemo = false.
   */
  static async generateAcademicReportData(options?: { isDemo?: boolean }): Promise<AcademicReportDTO> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const datasets = await this.fetchAllDatasets(isDemoFilter);
    const multiModelStats = await StatisticsService.getMultiModelAnalytics({ isDemo: isDemoFilter });
    const progressionStats = await StatisticsService.getProgressionAnalytics({ isDemo: isDemoFilter });

    const questions = await prisma.question.findMany({
      where: { isDemo: isDemoFilter },
      orderBy: { orderIndex: 'asc' },
    });

    const questionScenarios = questions.map((q) => ({
      code: q.code,
      title: q.title,
      scenario: q.scenario,
      modelAnswer: q.modelAnswer,
      statutoryElements: safeParseJson(q.statutoryElements, []),
      relevantProvisions: safeParseJson(q.relevantProvisions, []),
    }));

    return {
      title: 'Lexify: AI Legal Essay Assessment & Research Platform',
      subtitle:
        'An Empirical Comparative Study on Meta Llama 3.2 3B, Microsoft Phi-4-mini 3.8B, and Google Gemma 2 2B for Evaluating Written Essay Answers of Law Students in Criminal Law I',
      institution: 'FSUU College of Law / Graduate Legal Studies',
      courseSubject: 'Criminal Law I (Revised Penal Code — Book One)',
      generatedAt: new Date().toISOString(),
      isDemo: isDemoFilter,
      disclaimer:
        'ACADEMIC RESEARCH PROTOTYPE DISCLAIMER: This system is developed strictly as an academic research prototype to investigate comparative evaluation performance across open-weights LLMs under SCORING CRITERIA AND INSTRUCTION.pdf. It is not an official law school grading system, formal examination instrument, or legal advice platform.',
      executiveSummary:
        'This research report compiles empirical comparative results evaluating student legal essay answers in Criminal Law I across three independent experimental models: Model A (Meta Llama 3.2 3B), Model B (Microsoft Phi-4-mini 3.8B), and Model C (Google Gemma 2 2B). Each model independently evaluated identical student submissions using the authoritative grading rubric (Form 15%, Answer 15%, Rule 30%, Application 30%, Conclusion 10%) on a 0.00–5.00 scale.',
      datasetSummary: {
        totalStudents: new Set(datasets.submissions.map((s) => s.studentId)).size,
        totalSubmissions: datasets.submissions.length,
        totalAiEvaluations: datasets.allAiEvaluations.length,
        totalExpertEvaluations: datasets.expertEvaluations?.length || 0,
        totalPairedComparisons: datasets.comparisons?.length || 0,
        totalRefinementLogs: datasets.refinementLogs?.length || 0,
        totalPostV3Reviews: datasets.finalV3Reviews?.length || 0,
        totalStudentSurveys: datasets.studentSurveys.length,
        totalExpertSurveys: datasets.expertSurveys?.length || 0,
      },
      questionScenarios,
      iterationProgression: {
        iterations: progressionStats.iterations,
        criterionProgression: progressionStats.criterionProgression,
        progressionNarrative:
          'Observed descriptive statistics across Meta Llama 3.1 8B, Mistral 7B, and Gemma 2 9B demonstrate distribution patterns and inter-model agreement rates.',
      },
      postV3AgreementFindings: progressionStats.postV3Summary,
      refinementAuditTrail: datasets.refinementLogs || [],
      surveyFindings: {
        studentUsability: datasets.studentSurveys,
        expertCapability: datasets.expertSurveys || [],
      },
      methodologyAndLimitations: [
        'Sample size (n) is determined by participating cohort submissions in Criminal Law I.',
        'Independent model evaluations were conducted in parallel with identical question, student answer, reference grounding, and Attorney Rubric snapshots.',
        'All three experimental models were evaluated at target temperature 0.2 and top-p 0.95.',
        'Legal expert grading was conducted independently outside the AI pipeline.',
        'Descriptive statistics report observed means, standard deviations, and pairwise differences; inferential hypothesis tests should be conducted independently.',
      ],
      dataDictionary: datasets.dataDictionary,
    };
  }

  private static async fetchAllDatasets(isDemo: boolean) {
    const [
      sessions,
      evaluations,
      expertEvaluations,
      refinementLogs,
      agentVersions,
      finalV3Reviews,
      surveyResponses,
      modelConfigSettings,
      rubrics,
    ] = await Promise.all([
      prisma.assessmentSession.findMany({
        where: { isDemo, status: 'SUBMITTED' },
        include: { drafts: true },
      }),
      prisma.evaluation.findMany({
        where: { isDemo },
        include: { agentVersion: true, student: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.expertEvaluation.findMany({
        where: { isDemo },
      }),
      prisma.refinementLog.findMany({
        where: { isDemo },
      }),
      prisma.agentVersion.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.finalEvaluationReview.findMany({
        where: { isDemo },
      }),
      prisma.surveyResponse.findMany({
        where: { isDemo },
        include: { questionnaire: true },
      }),
      prisma.modelConfigSetting.findMany({
        orderBy: { modelSlot: 'asc' },
      }),
      prisma.rubric.findMany({
        include: { criteria: true },
      }),
    ]);

    // 01. Submissions
    const submissions = sessions.map((s, idx) => ({
      sessionId: s.id,
      studentId: s.studentId,
      studentAnonymizedCode: `Student-${String(idx + 1).padStart(2, '0')}`,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      submittedAt: s.submittedAt?.toISOString() || '',
      questionCount: safeParseJson(s.questionsSnapshot, []).length,
      answersSubmittedCount: s.drafts.length,
      isDemo: s.isDemo,
    }));

    // Helper for formatting model evaluations
    const formatModelEval = (e: any) => {
      const criteria: any[] = safeParseJson(e.criterionScores, []);
      const formScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'form')?.score || 0;
      const answerScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'answer')?.score || 0;
      const ruleScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'rule')?.score || 0;
      const applicationScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'application')?.score || 0;
      const conclusionScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'conclusion')?.score || 0;

      const weightedPercentage = e.numericalScore;
      const finalScore = Number((weightedPercentage * 0.05).toFixed(4));
      const rawTenPointGrade = Number((weightedPercentage / 10).toFixed(4));
      const finalRoundedGrade = Math.round(rawTenPointGrade);

      return {
        evaluationId: e.id,
        sessionId: e.sessionId,
        studentId: e.studentId,
        questionId: e.questionId,
        modelSlot: e.modelSlot || 'MODEL_A',
        modelFamily: e.modelFamily || 'Llama 3.2',
        exactModelId: e.exactModelId || 'llama3.2:3b',
        formScore,
        answerScore,
        ruleScore,
        applicationScore,
        conclusionScore,
        weightedPercentage,
        finalScore,
        rawPercentage: weightedPercentage,
        rawTenPointGrade,
        finalRoundedGrade,
        scoringBasis: e.scoringBasis,
        confidenceScore: e.confidenceScore,
        isDemo: e.isDemo,
        createdAt: e.createdAt.toISOString(),
      };
    };

    const llama31Evaluations = evaluations
      .filter((e) => e.modelSlot === 'MODEL_A' || (!e.modelSlot && e.agentVersionId))
      .map(formatModelEval);

    const mistral7bEvaluations = evaluations
      .filter((e) => e.modelSlot === 'MODEL_B')
      .map(formatModelEval);

    const gemma2Evaluations = evaluations
      .filter((e) => e.modelSlot === 'MODEL_C')
      .map(formatModelEval);

    const allAiEvaluations = evaluations.map(formatModelEval);

    // 05. Model Comparative Matrix (Llama 3.2 3B vs Phi-4-mini vs Gemma 2 2B)
    const comparativeMatrix: any[] = [];
    sessions.forEach((s) => {
      const qIds = Array.from(new Set(evaluations.filter((e) => e.sessionId === s.id).map((e) => e.questionId)));
      qIds.forEach((qId) => {
        const evalA = evaluations.find((e) => e.sessionId === s.id && e.questionId === qId && (e.modelSlot === 'MODEL_A' || !e.modelSlot));
        const evalB = evaluations.find((e) => e.sessionId === s.id && e.questionId === qId && e.modelSlot === 'MODEL_B');
        const evalC = evaluations.find((e) => e.sessionId === s.id && e.questionId === qId && e.modelSlot === 'MODEL_C');

        const scoreA = evalA ? Number((evalA.numericalScore * 0.05).toFixed(4)) : null;
        const scoreB = evalB ? Number((evalB.numericalScore * 0.05).toFixed(4)) : null;
        const scoreC = evalC ? Number((evalC.numericalScore * 0.05).toFixed(4)) : null;

        const scores = [scoreA, scoreB, scoreC].filter((g) => g !== null) as number[];
        const maxDelta = scores.length >= 2 ? Math.round((Math.max(...scores) - Math.min(...scores)) * 100) / 100 : 0;

        comparativeMatrix.push({
          sessionId: s.id,
          studentId: s.studentId,
          questionId: qId,
          model_a_score: scoreA !== null ? scoreA : 'N/A',
          model_b_score: scoreB !== null ? scoreB : 'N/A',
          model_c_score: scoreC !== null ? scoreC : 'N/A',
          maxDelta,
          delta_A_minus_B: scoreA !== null && scoreB !== null ? Math.round((scoreA - scoreB) * 100) / 100 : 'N/A',
          delta_B_minus_C: scoreB !== null && scoreC !== null ? Math.round((scoreB - scoreC) * 100) / 100 : 'N/A',
          delta_A_minus_C: scoreA !== null && scoreC !== null ? Math.round((scoreA - scoreC) * 100) / 100 : 'N/A',
          isDemo: s.isDemo,
        });
      });
    });

    // 06. Lexical & Semantic Analysis
    const lexicalSemanticAnalysis = evaluations.map((e) => {
      const lex = safeParseJson(e.lexicalAnalysis, {});
      const sem = safeParseJson(e.semanticAnalysis, {});

      return {
        evaluationId: e.id,
        sessionId: e.sessionId,
        studentId: e.studentId,
        questionId: e.questionId,
        modelSlot: e.modelSlot || 'MODEL_A',
        wordCount: lex.wordCount || 0,
        sentenceCount: lex.sentenceCount || 0,
        averageSentenceLength: lex.averageSentenceLength || 0,
        legalTermCount: lex.legalTermCount || 0,
        uniqueLegalTermsCount: (lex.uniqueLegalTerms || []).length,
        elementsIdentifiedCount: (sem.elementsIdentified || []).length,
        missingElementsCount: (sem.missingElements || []).length,
        hasDirectStance: sem.hasDirectStance ?? false,
        hasDoctrinalGrounding: sem.hasDoctrinalGrounding ?? false,
        hasFactSynthesis: sem.hasFactSynthesis ?? false,
        hasExplicitConclusion: sem.hasExplicitConclusion ?? false,
        syllogismStructureScore: sem.syllogismStructureScore || 0,
        isDemo: e.isDemo,
      };
    });

    // 07. Student Usability Surveys
    const studentSurveys = surveyResponses
      .filter((sr) => sr.respondentRole === 'STUDENT')
      .map((sr) => ({
        responseId: sr.id,
        respondentId: sr.respondentId,
        questionnaireTitle: sr.questionnaire?.title || 'Student Usability Questionnaire',
        answers: sr.answers,
        qualitativeNotes: sr.qualitativeNotes,
        isDemo: sr.isDemo,
        createdAt: sr.createdAt.toISOString(),
      }));

    // 08. Model Configurations
    const modelConfigs = modelConfigSettings.map((mc) => ({
      modelSlot: mc.modelSlot,
      researchName: mc.researchName,
      modelFamily: mc.modelFamily,
      parameterClass: mc.parameterClass,
      provider: mc.provider,
      exactModelId: mc.exactModelId,
      temperature: mc.temperature,
      topP: mc.topP,
      maxTokens: mc.maxTokens,
      isLocked: mc.isLocked,
    }));

    // 09. Scoring Rubric
    const scoringRubrics: any[] = [];
    rubrics.forEach((r) => {
      r.criteria.forEach((c) => {
        scoringRubrics.push({
          rubricName: r.name,
          criterionName: c.name,
          description: c.description,
          weightPercent: c.weightPercent,
          maxPoints: c.maxPoints,
          orderIndex: c.orderIndex,
        });
      });
    });

    // 10. Data Dictionary
    const dataDictionary = [
      { dataset: '01_student_submissions.csv', variable: 'studentAnonymizedCode', type: 'String', description: 'De-identified student participant code' },
      { dataset: '02_llama_3_1_8b_evaluations.csv', variable: 'rawPercentage', type: 'Float (0-100)', description: 'Raw sum of 5 Attorney Matrix criterion scores' },
      { dataset: '02_llama_3_1_8b_evaluations.csv', variable: 'finalRoundedGrade', type: 'Integer (0-10)', description: 'Final integer grade computed via custom Attorney Rounding' },
      { dataset: '03_mistral_7b_evaluations.csv', variable: 'rawPercentage', type: 'Float (0-100)', description: 'Mistral 7B raw score under identical rubric' },
      { dataset: '04_gemma_2_9b_evaluations.csv', variable: 'rawPercentage', type: 'Float (0-100)', description: 'Gemma 2 9B raw score under identical rubric' },
      { dataset: '05_model_comparative_matrix.csv', variable: 'maxDelta', type: 'Float', description: 'Maximum absolute grade difference across the 3 models for the same response' },
      { dataset: '06_lexical_semantic_analysis.csv', variable: 'legalTermCount', type: 'Integer', description: 'Frequency of validated criminal law terms' },
      { dataset: '07_student_usability_surveys.csv', variable: 'answers', type: 'JSON String', description: 'Student Likert responses (1-5 scale) on usability' },
      { dataset: '08_model_configurations.csv', variable: 'exactModelId', type: 'String', description: 'Exact API model identifier used during evaluation' },
      { dataset: '09_scoring_rubric.csv', variable: 'weightPercent', type: 'Float', description: 'Controlling percentage weight (Form:15, Answer:15, Rule:30, App:30, Concl:10)' },
    ];

    // Format Expert Evaluations / Refinements / PostV3 reviews for backward compatibility
    const formattedExpertEvals = expertEvaluations.map((e) => ({
      id: e.id,
      expertId: e.expertId,
      sessionId: e.sessionId,
      questionId: e.questionId,
      numericalScore: e.numericalScore,
      maxScore: e.maxScore,
      scoringBasis: e.scoringBasis,
      criterionScores: e.criterionScores,
      qualitativeComments: e.qualitativeComments,
      isDemo: e.isDemo,
      createdAt: e.createdAt.toISOString(),
    }));

    const comparisons: any[] = [];
    expertEvaluations.forEach((ee) => {
      const matchingAi = evaluations.find(
        (ae) => ae.sessionId === ee.sessionId && ae.questionId === ee.questionId
      );
      if (matchingAi) {
        const scoreDelta = Math.round((ee.numericalScore - matchingAi.numericalScore) * 10) / 10;
        const absoluteDelta = Math.round(Math.abs(ee.numericalScore - matchingAi.numericalScore) * 10) / 10;
        comparisons.push({
          aiEvaluationId: matchingAi.id,
          expertEvaluationId: ee.id,
          sessionId: ee.sessionId,
          questionId: ee.questionId,
          aiScore: matchingAi.numericalScore,
          expertScore: ee.numericalScore,
          maxScore: matchingAi.maxScore,
          scoreDelta,
          absoluteDelta,
          percentageDivergence: Math.round((absoluteDelta / (matchingAi.maxScore || 100)) * 100),
          isDemo: ee.isDemo,
        });
      }
    });

    const formattedRefinements = refinementLogs.map((r) => ({
      id: r.id,
      gapId: r.gapId,
      agentVersionId: r.agentVersionId,
      targetComponent: r.targetComponent,
      gapCategory: r.gapCategory,
      discrepancyDescription: r.discrepancyDescription,
      rootCauseAnalysis: r.rootCauseAnalysis,
      proposedRefinement: r.proposedRefinement,
      status: r.status,
      approvedDecision: r.approvedDecision,
      resultingAgentVersionId: r.resultingAgentVersionId,
      researcherNotes: r.researcherNotes,
      isDemo: r.isDemo,
      createdAt: r.createdAt.toISOString(),
    }));

    const formattedVersions = agentVersions.map((v) => ({
      id: v.id,
      versionTag: v.versionTag,
      label: v.label,
      description: v.description,
      parentVersionId: v.parentVersionId || '',
      isLocked: v.isLocked,
      isActive: v.isActive,
      lockedAt: v.lockedAt?.toISOString() || '',
      createdAt: v.createdAt.toISOString(),
    }));

    const formattedFinalReviews = finalV3Reviews.map((fr) => ({
      id: fr.id,
      expertId: fr.expertId,
      evaluationId: fr.evaluationId,
      sessionId: fr.sessionId,
      questionId: fr.questionId,
      agentVersionId: fr.agentVersionId,
      agreementRating: fr.agreementRating,
      reasoningCorrectnessRating: fr.reasoningCorrectnessRating,
      statutoryGroundingRating: fr.statutoryGroundingRating,
      recommendedScore: fr.recommendedScore,
      aiScore: fr.aiScore,
      scoreDelta: fr.scoreDelta,
      finalVerdict: fr.finalVerdict,
      isDemo: fr.isDemo,
      createdAt: fr.createdAt.toISOString(),
    }));

    const expertSurveys = surveyResponses
      .filter((sr) => sr.respondentRole === 'EXPERT')
      .map((sr) => ({
        responseId: sr.id,
        respondentId: sr.respondentId,
        questionnaireTitle: sr.questionnaire?.title || 'Expert Capability Questionnaire',
        answers: sr.answers,
        qualitativeNotes: sr.qualitativeNotes,
        isDemo: sr.isDemo,
        createdAt: sr.createdAt.toISOString(),
      }));

    return {
      submissions,
      llamaEvaluations: llama31Evaluations,
      phi4Evaluations: mistral7bEvaluations,
      llama31Evaluations,
      mistral7bEvaluations,
      gemma2Evaluations,
      aiEvaluations: allAiEvaluations,
      allAiEvaluations,
      comparativeMatrix,
      lexicalSemanticAnalysis,
      studentSurveys,
      modelConfigs,
      scoringRubrics,
      dataDictionary,
      expertEvaluations: formattedExpertEvals,
      comparisons,
      refinementLogs: formattedRefinements,
      agentVersions: formattedVersions,
      finalV3Reviews: formattedFinalReviews,
      expertSurveys,
    };
  }

  private static arrayToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        let val = row[header];
        if (val === null || val === undefined) {
          return '""';
        }
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

function safeParseJson(str: any, fallback: any): any {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
