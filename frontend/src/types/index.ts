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
}

export interface StudentEvaluationFeedback {
  id: string;
  questionId: string;
  numericalScore: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: CriterionScore[];
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
}

export interface AdminEvaluation {
  id: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  questionId: string;
  agentVersionId: string;
  questionSnapshot: any;
  modelConfigSnapshot: any;
  rubricSnapshot: any;
  studentAnswer: string;
  numericalScore: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: CriterionScore[];
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
  confidenceScore: number;
  reviewFlags: string[];
  isDemo: boolean;
  createdAt: string;
}

// --- Phase 3 Expert, Comparison & Refinement Types ---

export interface ExpertQueueItem {
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string; // e.g. "Student-01"
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
  gapId: string; // e.g. "GAP-001"
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
