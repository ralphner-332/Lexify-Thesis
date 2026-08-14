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
