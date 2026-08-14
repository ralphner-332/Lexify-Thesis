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
