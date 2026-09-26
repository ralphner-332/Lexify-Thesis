export type UserRole = 'STUDENT' | 'EXPERT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isDemo: boolean;
  disclaimerAcceptedAt?: string | null;
}

export interface Question {
  id: string;
  code: string;
  title: string;
  scenario: string;
  modelAnswer?: string; // Optional for students (stripped on server)
  statutoryElements?: string[];
  relevantProvisions?: string[];
  conceptVariations?: string[];
  orderIndex: number;
  isActive: boolean;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RubricCriterion {
  id?: string;
  rubricId?: string;
  name: string;
  description: string;
  weightPercent: number;
  maxPoints?: number;
  orderIndex?: number;
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isDemo: boolean;
  createdAt?: string;
  updatedAt?: string;
  criteria: RubricCriterion[];
}

export interface ModelConfig {
  provider: 'google' | 'anthropic' | 'openai' | 'custom' | string;
  modelId: string;
  temperature: number;
  topP: number;
  maxOutputTokens?: number;
  [key: string]: any;
}

export interface VersionChangelogEntry {
  component: string;
  changeSummary: string;
  rationale: string;
  linkedRefinementIds: string[];
  approverId?: string;
  approverEmail?: string;
  timestamp: string;
}

export interface AgentVersion {
  id: string;
  versionTag: string; // "V1", "V2", "V3"
  label: string;
  description: string;
  systemInstructions: string;
  skillsDefinition: Record<string, any>;
  rubricSnapshot: RubricCriterion[] | Record<string, any>;
  evaluationPatterns: Record<string, any>;
  modelConfig: ModelConfig;
  parentVersionId?: string | null;
  changelog?: VersionChangelogEntry[];
  isLocked: boolean;
  isActive: boolean;
  createdAt: string;
  lockedAt?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  isDemo: boolean;
  createdAt: string;
}

// --- Phase 2 Session & Evaluation Types ---

export interface StudentQuestionItem {
  id: string;
  code: string;
  title: string;
  scenario: string;
  orderIndex: number;
  draftAnswer: string;
  isAnswered: boolean;
}

export interface AssessmentSession {
  id: string;
  studentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  startedAt: string;
  submittedAt?: string | null;
  questions: StudentQuestionItem[];
}

export interface SessionReviewChecklist {
  session: AssessmentSession;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  allAnswered: boolean;
}

export interface CriterionScore {
  criterionName: string;
  score: number;
  maxPoints: number;
  reasoning: string;
  evidence?: string;
  deficiencies?: string;
}

export interface ModelConfigSetting {
  id: string;
  modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  researchName: string;
  modelFamily: string;
  parameterClass: string;
  provider: string;
  exactModelId: string;
  endpointUrl?: string | null;
  apiKeyEnvVar: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemInstructions: string;
  isLocked: boolean;
  isDemo: boolean;
  hasApiKeyConfigured: boolean;
}

export interface StudentEvaluationFeedback {
  id: string;
  questionId: string;
  modelSlot?: string;
  modelFamily?: string;
  exactModelId?: string;
  numericalScore: number;
  weightedPercentage?: number;
  finalScore?: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: CriterionScore[];
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
  reviewFlags?: string[];
  formScore?: number;
  answerScore?: number;
  ruleScore?: number;
  applicationScore?: number;
  conclusionScore?: number;
  rawPercentage?: number;
  rawTenPointGrade?: number;
  finalRoundedGrade?: number;
}

export interface AdminEvaluation {
  id: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  questionId: string;
  agentVersionId?: string;
  modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C' | string;
  modelFamily: string;
  exactModelId: string;
  questionSnapshot: any;
  modelConfigSnapshot: any;
  rubricSnapshot: any;
  studentAnswer: string;
  numericalScore: number;
  weightedPercentage?: number;
  finalScore?: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: CriterionScore[];
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
  lexicalAnalysis?: any;
  semanticAnalysis?: any;
  confidenceScore: number;
  reviewFlags: string[];
  isDemo: boolean;
  createdAt: string;
  formScore?: number;
  answerScore?: number;
  ruleScore?: number;
  applicationScore?: number;
  conclusionScore?: number;
  rawPercentage?: number;
  rawTenPointGrade?: number;
  finalRoundedGrade?: number;
}

// --- Phase 3 Expert, Comparison & Refinement Types ---

export interface ExpertQueueItem {
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string;
  questionCode: string;
  questionTitle: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';
  submittedAt: string | null;
  expertEvaluationId?: string;
}

export interface ExpertSubmissionDetail {
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string;
  studentAnswer: string;
  question: {
    code: string;
    title: string;
    scenario: string;
    modelAnswer: string;
    statutoryElements: string[];
    relevantProvisions: string[];
    conceptVariations: string[];
  };
  rubricCriteria: Array<{
    name: string;
    description: string;
    weightPercent: number;
    maxPoints: number;
  }>;
  draft?: {
    numericalScore: number;
    scoringBasis: string;
    criterionScores: Array<{
      criterionName: string;
      score: number;
      maxPoints: number;
      reasoning?: string;
    }>;
    qualitativeComments: string;
  } | null;
  isSubmitted: boolean;
}

export interface CriterionDelta {
  criterionName: string;
  aiScore: number;
  expertScore: number;
  delta: number; // Expert - AI
  maxPoints: number;
  reasoningAi: string;
  reasoningExpert: string;
}

export interface ComparisonItem {
  id: string;
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string;
  questionCode: string;
  questionTitle: string;
  agentVersionId: string;
  agentVersionTag: string;
  aiEvaluationId: string;
  expertEvaluationId: string;
  aiScore: number;
  expertScore: number;
  scoreDelta: number; // Expert - AI
  absoluteDelta: number; // |Expert - AI|
  maxScore: number;
  percentageDelta: number;
  aiScoringBasis: string;
  expertRationale: string;
  expertQualitativeComments: string;
  aiStrengths: string[];
  aiMissingElements: string[];
  aiImprovements: string[];
  criterionDeltas: CriterionDelta[];
  conflictFlags: string[];
  isDemo: boolean;
  createdAt: string;
}

export interface ComparisonSummary {
  totalCompared: number;
  meanAbsoluteDelta: number;
  meanSignedDelta: number;
  flaggedConflictsCount: number;
  agreementRate: number;
  configuredThresholdPercent: number;
}

export interface RefinementLog {
  id: string;
  gapId: string;
  questionId?: string | null;
  sessionId?: string | null;
  aiEvaluationId?: string | null;
  expertEvaluationId?: string | null;
  agentVersionId: string;
  targetComponent: string;
  gapCategory: string;
  discrepancyDescription: string;
  aiPosition: string;
  expertPosition: string;
  expertRationale: string;
  rootCauseAnalysis: string;
  proposedRefinement: string;
  status: 'DRAFT' | 'APPROVED' | 'APPLIED' | 'REJECTED';
  approvedDecision: string;
  resultingAgentVersionId?: string | null;
  researcherNotes: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Phase 4 Post-V3 Review, Survey, Statistics & Export Types ---

export interface V3ReviewQueueItem {
  evaluationId: string;
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string;
  questionCode: string;
  questionTitle: string;
  v3AiScore: number;
  maxScore: number;
  reviewStatus: 'PENDING' | 'COMPLETED';
  reviewId?: string;
  finalVerdict?: string;
  createdAt: string;
}

export interface V3EvaluationReviewDetail {
  evaluationId: string;
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string;
  question: {
    code: string;
    title: string;
    scenario: string;
    modelAnswer: string;
    statutoryElements: string[];
    relevantProvisions: string[];
  };
  studentAnswer: string;
  v3AiScore: number;
  v3MaxScore: number;
  v3ScoringBasis: string;
  v3CriterionScores: Array<{
    criterionName: string;
    score: number;
    maxPoints: number;
    reasoning: string;
  }>;
  v3Strengths: string[];
  v3MissingElements: string[];
  existingReview?: {
    id: string;
    agreementRating: number;
    reasoningCorrectnessRating: number;
    statutoryGroundingRating: number;
    recommendedScore: number;
    scoreDelta: number;
    errorTags: string[];
    qualitativeComments: string;
    improvementSuggestions: string;
    finalVerdict: string;
    createdAt: string;
  } | null;
}

export interface FinalEvaluationRecord {
  id: string;
  expertId: string;
  evaluationId: string;
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string;
  agreementRating: number;
  reasoningCorrectnessRating: number;
  statutoryGroundingRating: number;
  recommendedScore: number;
  aiScore: number;
  scoreDelta: number;
  errorTags: string[];
  qualitativeComments: string;
  improvementSuggestions: string;
  finalVerdict: string;
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  code: string;
  prompt: string;
  questionType: 'LIKERT_5' | 'OPEN_TEXT' | 'MULTIPLE_CHOICE' | string;
  options: string[];
  orderIndex: number;
  isRequired: boolean;
}

export interface SurveyQuestionnaire {
  id: string;
  title: string;
  description: string;
  targetRole: 'STUDENT' | 'EXPERT';
  version: string;
  isActive: boolean;
  isDemo: boolean;
  questions: SurveyQuestion[];
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  questionnaireId: string;
  respondentId: string;
  respondentRole: string;
  answers: Record<string, any>;
  qualitativeNotes: string;
  isDemo: boolean;
  createdAt: string;
}

export interface SurveySummaryMetrics {
  questionnaireId: string;
  title: string;
  targetRole: string;
  version: string;
  totalResponses: number;
  questionAverages: Array<{
    questionCode: string;
    prompt: string;
    questionType: string;
    meanScore?: number;
    responseCounts: Record<string, number>;
  }>;
  openFeedbackNotes: string[];
}

export interface IterationMetricSummary {
  versionTag: string;
  versionLabel: string;
  sampleSize: number;
  meanAbsoluteDelta: number;
  meanSignedDelta: number;
  aiMeanScore: number;
  aiScoreStdDev: number;
  expertMeanScore: number;
  expertScoreStdDev: number;
  minAbsoluteDelta: number;
  maxAbsoluteDelta: number;
  agreementRate: number;
  conflictCount: number;
}

export interface CriterionDeltaSummary {
  criterionName: string;
  maxPoints: number;
  v1MeanAbsoluteDelta?: number;
  v2MeanAbsoluteDelta?: number;
  v3MeanAbsoluteDelta?: number;
}

export interface PostV3Summary {
  totalReviews: number;
  meanAgreementRating: number;
  meanReasoningCorrectness: number;
  meanStatutoryGrounding: number;
  meanRecommendedScore: number;
  meanScoreDelta: number;
  verdictCounts: {
    ACCEPTABLE: number;
    ACCEPTABLE_WITH_MINOR_ISSUES: number;
    REQUIRES_IMPROVEMENT: number;
    [key: string]: number;
  };
  errorTagCounts: Record<string, number>;
}

export interface ProgressionAnalytics {
  isDemo: boolean;
  generatedAt: string;
  iterations: IterationMetricSummary[];
  criterionProgression: CriterionDeltaSummary[];
  postV3Summary: PostV3Summary;
  methodologyNotes: string[];
}

export interface AcademicReportData {
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
    iterations: IterationMetricSummary[];
    criterionProgression: CriterionDeltaSummary[];
    progressionNarrative: string;
  };
  postV3AgreementFindings: PostV3Summary;
  refinementAuditTrail: any[];
  surveyFindings: {
    studentUsability: any[];
    expertCapability: any[];
  };
  methodologyAndLimitations: string[];
  dataDictionary: Array<{ field: string; type: string; description: string }>;
}
