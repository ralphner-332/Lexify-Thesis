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
      recordCounts[key] = (datasets as any)[key].length;
    });

    return {
      metadata: {
        title: 'YAWA Academic Research Dataset Export Bundle',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        isDemo: isDemoFilter,
        disclaimer:
          'ACADEMIC RESEARCH PROTOTYPE — Evaluates student written essay answers for research on iterative AI agent refinement. Not an official legal exam, bar review grading system, or legal advice.',
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
    csvMap['02_ai_evaluations.csv'] = this.arrayToCSV(datasets.aiEvaluations);
    csvMap['03_expert_evaluations.csv'] = this.arrayToCSV(datasets.expertEvaluations);
    csvMap['04_paired_comparisons.csv'] = this.arrayToCSV(datasets.comparisons);
    csvMap['05_refinement_logs.csv'] = this.arrayToCSV(datasets.refinementLogs);
    csvMap['06_agent_versions.csv'] = this.arrayToCSV(datasets.agentVersions);
    csvMap['07_final_v3_expert_reviews.csv'] = this.arrayToCSV(datasets.finalV3Reviews);
    csvMap['08_student_usability_surveys.csv'] = this.arrayToCSV(datasets.studentSurveys);
    csvMap['09_expert_capability_surveys.csv'] = this.arrayToCSV(datasets.expertSurveys);
    csvMap['10_research_data_dictionary.csv'] = this.arrayToCSV(datasets.dataDictionary);

    return csvMap;
  }

  /**
   * Compiles structured data for the printable/downloadable Thesis-Ready Academic Research Report.
   * Server default: isDemo = false.
   */
  static async generateAcademicReportData(options?: { isDemo?: boolean }): Promise<AcademicReportDTO> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const datasets = await this.fetchAllDatasets(isDemoFilter);
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
      title: 'YAWA: Yet Another Written-Answer AI Agent',
      subtitle:
        'An Empirical Study on Developing and Iteratively Refining an AI Agent for Evaluating Written Essay Answers of Law Students in Criminal Law I',
      institution: 'FSUU College of Law / Graduate Legal Studies',
      courseSubject: 'Criminal Law I (Revised Penal Code — Book One)',
      generatedAt: new Date().toISOString(),
      isDemo: isDemoFilter,
      disclaimer:
        'ACADEMIC RESEARCH PROTOTYPE DISCLAIMER: This system is developed strictly as an academic research prototype to investigate iterative refinement of AI-assisted legal essay evaluations. It is not an official law school grading system, formal examination instrument, or legal advice platform.',
      executiveSummary:
        'This research report compiles the empirical results of evaluating student legal essay answers in Criminal Law I across three iterative AI Agent versions (V1 baseline → V2 refined → V3 optimized). Evaluations produced by the AI Agent were paired with independent double-blind expert assessments, analyzed using a structured refinement framework, and finalized through post-V3 expert validation and student usability testing.',
      datasetSummary: {
        totalStudents: new Set(datasets.submissions.map((s) => s.studentId)).size,
        totalSubmissions: datasets.submissions.length,
        totalAiEvaluations: datasets.aiEvaluations.length,
        totalExpertEvaluations: datasets.expertEvaluations.length,
        totalPairedComparisons: datasets.comparisons.length,
        totalRefinementLogs: datasets.refinementLogs.length,
        totalPostV3Reviews: datasets.finalV3Reviews.length,
        totalStudentSurveys: datasets.studentSurveys.length,
        totalExpertSurveys: datasets.expertSurveys.length,
      },
      questionScenarios,
      iterationProgression: {
        iterations: progressionStats.iterations,
        criterionProgression: progressionStats.criterionProgression,
        progressionNarrative:
          'Observed descriptive progression across iterative evaluation cycles demonstrates changes in mean absolute score deltas between AI and expert assessments.',
      },
      postV3AgreementFindings: progressionStats.postV3Summary,
      refinementAuditTrail: datasets.refinementLogs,
      surveyFindings: {
        studentUsability: datasets.studentSurveys,
        expertCapability: datasets.expertSurveys,
      },
      methodologyAndLimitations: [
        'Sample size (n) is determined by participating cohort submissions in Criminal Law I.',
        'Independent expert evaluations were conducted under double-blind protocol with student anonymity and zero AI score exposure during iterations 1–3.',
        'Post-V3 evaluation was conducted unblinded to evaluate final reasoning correctness and agreement.',
        'Descriptive metrics report observed means, deltas, and standard deviations; inferential hypothesis tests should be conducted independently.',
        'Data isolation: Filtered to reflect isDemo = false research records exclusively.',
      ],
      dataDictionary: [
        { field: 'sessionId', type: 'UUID', description: 'Unique identifier for student assessment session' },
        { field: 'evaluationId', type: 'UUID', description: 'Unique identifier for AI evaluation record' },
        { field: 'expertEvaluationId', type: 'UUID', description: 'Unique identifier for expert evaluation' },
        { field: 'agentVersionTag', type: 'String', description: 'Tag of Agent Version (V1, V2, V3)' },
        { field: 'scoreDelta', type: 'Float', description: 'Score difference: Expert Score - AI Score' },
        { field: 'absoluteDelta', type: 'Float', description: 'Absolute difference: |Expert Score - AI Score|' },
        { field: 'gapId', type: 'String', description: 'Identifier for structured refinement log (GAP-XXX)' },
        { field: 'finalVerdict', type: 'Enum', description: 'Post-V3 expert assessment verdict' },
        { field: 'isDemo', type: 'Boolean', description: 'Flag distinguishing test/demo records from research data' },
      ],
    };
  }

  private static async fetchAllDatasets(isDemo: boolean) {
    const [
      sessions,
      aiEvaluations,
      expertEvaluations,
      refinementLogs,
      agentVersions,
      finalV3Reviews,
      surveyResponses,
    ] = await Promise.all([
      prisma.assessmentSession.findMany({
        where: { isDemo, status: 'SUBMITTED' },
        include: { drafts: true },
      }),
      prisma.evaluation.findMany({
        where: { isDemo },
        include: { agentVersion: true },
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
    ]);

    // Format Submissions
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

    // Format AI Evaluations
    const formattedAiEvals = aiEvaluations.map((e) => ({
      id: e.id,
      sessionId: e.sessionId,
      questionId: e.questionId,
      agentVersionTag: e.agentVersion?.versionTag || 'V1',
      numericalScore: e.numericalScore,
      maxScore: e.maxScore,
      scoringBasis: e.scoringBasis,
      criterionScores: e.criterionScores,
      confidenceScore: e.confidenceScore,
      isDemo: e.isDemo,
      createdAt: e.createdAt.toISOString(),
    }));

    // Format Expert Evaluations
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

    // Format Paired Comparisons
    const comparisons: any[] = [];
    expertEvaluations.forEach((ee) => {
      const matchingAi = aiEvaluations.find(
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
          agentVersionTag: matchingAi.agentVersion?.versionTag || 'V1',
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

    // Format Refinement Logs
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
      isDemo: r.isDemo,
      createdAt: r.createdAt.toISOString(),
    }));

    // Format Agent Versions
    const formattedVersions = agentVersions.map((v) => ({
      id: v.id,
      versionTag: v.versionTag,
      label: v.label,
      description: v.description,
      parentVersionId: v.parentVersionId || '',
      isLocked: v.isLocked,
      isActive: v.isActive,
      changelog: v.changelog,
      createdAt: v.createdAt.toISOString(),
    }));

    // Format Final V3 Reviews
    const formattedFinalReviews = finalV3Reviews.map((fr) => ({
      id: fr.id,
      expertId: fr.expertId,
      evaluationId: fr.evaluationId,
      sessionId: fr.sessionId,
      questionId: fr.questionId,
      agreementRating: fr.agreementRating,
      reasoningCorrectnessRating: fr.reasoningCorrectnessRating,
      statutoryGroundingRating: fr.statutoryGroundingRating,
      recommendedScore: fr.recommendedScore,
      aiScore: fr.aiScore,
      scoreDelta: fr.scoreDelta,
      errorTags: fr.errorTags,
      qualitativeComments: fr.qualitativeComments,
      finalVerdict: fr.finalVerdict,
      isDemo: fr.isDemo,
      createdAt: fr.createdAt.toISOString(),
    }));

    // Format Surveys
    const studentSurveys = surveyResponses
      .filter((s) => s.respondentRole === 'STUDENT')
      .map((s) => ({
        id: s.id,
        questionnaireTitle: s.questionnaire?.title || 'Student Usability',
        answers: s.answers,
        qualitativeNotes: s.qualitativeNotes,
        isDemo: s.isDemo,
        createdAt: s.createdAt.toISOString(),
      }));

    const expertSurveys = surveyResponses
      .filter((s) => s.respondentRole === 'EXPERT')
      .map((s) => ({
        id: s.id,
        questionnaireTitle: s.questionnaire?.title || 'Expert Capability',
        answers: s.answers,
        qualitativeNotes: s.qualitativeNotes,
        isDemo: s.isDemo,
        createdAt: s.createdAt.toISOString(),
      }));

    const dataDictionary = [
      { fieldName: 'sessionId', dataType: 'UUID', description: 'Unique identifier for student assessment session' },
      { fieldName: 'studentAnonymizedCode', dataType: 'String', description: 'Anonymized research identifier (Student-XX)' },
      { fieldName: 'evaluationId', dataType: 'UUID', description: 'Unique identifier for AI evaluation' },
      { fieldName: 'expertEvaluationId', dataType: 'UUID', description: 'Unique identifier for expert evaluation' },
      { fieldName: 'agentVersionTag', dataType: 'Enum', description: 'Iteration version tag (V1, V2, V3)' },
      { fieldName: 'numericalScore', dataType: 'Float', description: 'Assigned score from active rubric' },
      { fieldName: 'scoreDelta', dataType: 'Float', description: 'Calculated delta: Expert - AI' },
      { fieldName: 'absoluteDelta', dataType: 'Float', description: 'Calculated absolute delta: |Expert - AI|' },
      { fieldName: 'gapId', dataType: 'String', description: 'Structured Refinement gap ID (GAP-XXX)' },
      { fieldName: 'finalVerdict', dataType: 'Enum', description: 'Post-V3 expert review judgment' },
      { fieldName: 'isDemo', dataType: 'Boolean', description: 'Research vs. Demo data partition flag' },
    ];

    return {
      submissions,
      aiEvaluations: formattedAiEvals,
      expertEvaluations: formattedExpertEvals,
      comparisons,
      refinementLogs: formattedRefinements,
      agentVersions: formattedVersions,
      finalV3Reviews: formattedFinalReviews,
      studentSurveys,
      expertSurveys,
      dataDictionary,
    };
  }

  private static arrayToCSV(arr: any[]): string {
    if (!arr || arr.length === 0) {
      return 'No data available\n';
    }

    const headers = Object.keys(arr[0]);
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.join(',');
    const rows = arr.map((row) => headers.map((h) => escapeCsv(row[h])).join(','));

    return [headerLine, ...rows].join('\n') + '\n';
  }
}

function safeParseJson(str: any, fallback: any = []): any {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
