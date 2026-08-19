export interface ExpertQueueItemDTO {
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string; // e.g. "Student-01"
  questionCode: string;
  questionTitle: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';
  submittedAt: Date | null;
  expertEvaluationId?: string;
}

export interface ExpertSubmissionDetailDTO {
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
      reasoning: string;
    }>;
    qualitativeComments: string;
  } | null;
  isSubmitted: boolean;
}

export interface ExpertEvaluationRecordDTO {
  id: string;
  expertId: string;
  sessionId: string;
  questionId: string;
  studentAnonymizedCode: string;
  numericalScore: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: any[];
  qualitativeComments: string;
  createdAt: Date;
}

export class ExpertEvaluationDTO {
  /**
   * Serializes a single expert queue item with anonymized student tag.
   */
  static toQueueItem(
    session: any,
    question: any,
    anonymizedIndex: number,
    evalStatus: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED',
    expertEvaluationId?: string
  ): ExpertQueueItemDTO {
    const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
    return {
      sessionId: session.id,
      questionId: question.id,
      studentAnonymizedCode: studentCode,
      questionCode: question.code,
      questionTitle: question.title,
      status: evalStatus,
      submittedAt: session.submittedAt,
      expertEvaluationId,
    };
  }

  /**
   * Formats submission detail for double-blind expert grading.
   * Strictly EXCLUDES AI scores, AI reasoning, and other expert scores.
   */
  static toSubmissionDetail(
    session: any,
    questionSnapshot: any,
    studentAnswer: string,
    rubricCriteria: any[],
    anonymizedIndex: number,
    draft?: any,
    isSubmitted: boolean = false
  ): ExpertSubmissionDetailDTO {
    const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;

    let parsedDraft = null;
    if (draft) {
      parsedDraft = {
        numericalScore: draft.numericalScore || 0,
        scoringBasis: draft.scoringBasis || '',
        criterionScores: safeParseJson(draft.criterionScores, []),
        qualitativeComments: draft.qualitativeComments || '',
      };
    }

    return {
      sessionId: session.id,
      questionId: questionSnapshot.id,
      studentAnonymizedCode: studentCode,
      studentAnswer,
      question: {
        code: questionSnapshot.code,
        title: questionSnapshot.title,
        scenario: questionSnapshot.scenario,
        modelAnswer: questionSnapshot.modelAnswer,
        statutoryElements: safeParseJson(questionSnapshot.statutoryElements, []),
        relevantProvisions: safeParseJson(questionSnapshot.relevantProvisions, []),
        conceptVariations: safeParseJson(questionSnapshot.conceptVariations, []),
      },
      rubricCriteria: rubricCriteria.map((c) => ({
        name: c.name,
        description: c.description,
        weightPercent: c.weightPercent,
        maxPoints: c.maxPoints ?? c.weightPercent ?? 20,
      })),
      draft: parsedDraft,
      isSubmitted,
    };
  }

  /**
   * Formats completed expert evaluation record.
   */
  static toRecordDTO(
    record: any,
    anonymizedIndex: number
  ): ExpertEvaluationRecordDTO {
    const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
    return {
      id: record.id,
      expertId: record.expertId,
      sessionId: record.sessionId,
      questionId: record.questionId,
      studentAnonymizedCode: studentCode,
      numericalScore: record.numericalScore,
      maxScore: record.maxScore,
      scoringBasis: record.scoringBasis,
      criterionScores: safeParseJson(record.criterionScores, []),
      qualitativeComments: record.qualitativeComments,
      createdAt: record.createdAt,
    };
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
