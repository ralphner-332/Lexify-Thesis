export interface ResearchExportBundleDTO {
  metadata: {
    title: string;
    version: string;
    exportedAt: string;
    isDemo: boolean;
    disclaimer: string;
    recordCounts: Record<string, number>;
  };
  datasets: {
    submissions: any[];
    aiEvaluations: any[];
    expertEvaluations: any[];
    comparisons: any[];
    refinementLogs: any[];
    agentVersions: any[];
    finalV3Reviews: any[];
    studentSurveys: any[];
    expertSurveys: any[];
    dataDictionary: any[];
  };
}

export interface AcademicReportDTO {
  title: string;
  subtitle: string;
  institution: string;
  courseSubject: string;
  generatedAt: string;
  isDemo: boolean;
  disclaimer: string;
  executiveSummary: string;
  datasetSummary: {
    totalStudents: number;
    totalSubmissions: number;
    totalAiEvaluations: number;
    totalExpertEvaluations: number;
    totalPairedComparisons: number;
    totalRefinementLogs: number;
    totalPostV3Reviews: number;
    totalStudentSurveys: number;
    totalExpertSurveys: number;
  };
  questionScenarios: Array<{
    code: string;
    title: string;
    scenario: string;
    modelAnswer: string;
    statutoryElements: string[];
    relevantProvisions: string[];
  }>;
  iterationProgression: {
    iterations: any[];
    criterionProgression: any[];
    progressionNarrative: string;
  };
  postV3AgreementFindings: any;
  refinementAuditTrail: any[];
  surveyFindings: {
    studentUsability: any;
    expertCapability: any;
  };
  methodologyAndLimitations: string[];
  dataDictionary: Array<{ field: string; type: string; description: string }>;
}
