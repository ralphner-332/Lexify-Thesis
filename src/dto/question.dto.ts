import { Question } from '@prisma/client';

export interface StudentQuestionDTO {
  id: string;
  code: string;
  title: string;
  scenario: string;
  orderIndex: number;
  isActive: boolean;
}

export interface ExpertQuestionDTO {
  id: string;
  code: string;
  title: string;
  scenario: string;
  modelAnswer: string;
  statutoryElements: string[];
  relevantProvisions: string[];
  conceptVariations: string[];
  orderIndex: number;
  isActive: boolean;
}

export interface AdminQuestionDTO {
  id: string;
  code: string;
  title: string;
  scenario: string;
  modelAnswer: string;
  statutoryElements: string[];
  relevantProvisions: string[];
  conceptVariations: string[];
  orderIndex: number;
  isActive: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class QuestionDTO {
  /**
   * Strictly sanitizes Question for student consumption.
   * Model answer, grading elements, statutory keys, and variations are completely stripped.
   */
  static toStudentDTO(q: Question): StudentQuestionDTO {
    return {
      id: q.id,
      code: q.code,
      title: q.title,
      scenario: q.scenario,
      orderIndex: q.orderIndex,
      isActive: q.isActive,
    };
  }

  /**
   * Serializes Question for expert evaluation.
   * Provides reference answer and statutory provisions for independent evaluation,
   * but omits AI evaluations and admin audit metadata.
   */
  static toExpertDTO(q: Question): ExpertQuestionDTO {
    return {
      id: q.id,
      code: q.code,
      title: q.title,
      scenario: q.scenario,
      modelAnswer: q.modelAnswer,
      statutoryElements: safeParseJsonArray(q.statutoryElements),
      relevantProvisions: safeParseJsonArray(q.relevantProvisions),
      conceptVariations: safeParseJsonArray(q.conceptVariations),
      orderIndex: q.orderIndex,
      isActive: q.isActive,
    };
  }

  /**
   * Serializes full question for researcher administration.
   */
  static toAdminDTO(q: Question): AdminQuestionDTO {
    return {
      id: q.id,
      code: q.code,
      title: q.title,
      scenario: q.scenario,
      modelAnswer: q.modelAnswer,
      statutoryElements: safeParseJsonArray(q.statutoryElements),
      relevantProvisions: safeParseJsonArray(q.relevantProvisions),
      conceptVariations: safeParseJsonArray(q.conceptVariations),
      orderIndex: q.orderIndex,
      isActive: q.isActive,
      isDemo: q.isDemo,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    };
  }

  /**
   * Applies role-specific serialization based on user role string.
   */
  static serializeByRole(q: Question, role?: string) {
    if (role === 'ADMIN') {
      return this.toAdminDTO(q);
    }
    if (role === 'EXPERT') {
      return this.toExpertDTO(q);
    }
    // Default fallback is student-safe
    return this.toStudentDTO(q);
  }
}

function safeParseJsonArray(val: string): string[] {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
