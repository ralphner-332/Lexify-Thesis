export interface V3ReviewQueueItemDTO {
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
  createdAt: Date;
}

export interface V3EvaluationDetailDTO {
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
    createdAt: Date;
  } | null;
}

export interface FinalEvaluationRecordDTO {
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
  createdAt: Date;
}

export class FinalEvaluationDTO {
  static toQueueItem(
    evaluation: any,
    anonymizedIndex: number,
    existingReview?: any
  ): V3ReviewQueueItemDTO {
    const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
    const questionSnapshot = safeParseJson(evaluation.questionSnapshot, {});

    return {
      evaluationId: evaluation.id,
      sessionId: evaluation.sessionId,
      questionId: evaluation.questionId,
      studentAnonymizedCode: studentCode,
      questionCode: questionSnapshot.code || 'Q',
      questionTitle: questionSnapshot.title || 'Question',
      v3AiScore: evaluation.numericalScore,
      maxScore: evaluation.maxScore,
      reviewStatus: existingReview ? 'COMPLETED' : 'PENDING',
      reviewId: existingReview?.id,
      finalVerdict: existingReview?.finalVerdict,
      createdAt: evaluation.createdAt,
    };
  }

  static toDetailDTO(
    evaluation: any,
    anonymizedIndex: number,
    existingReview?: any
  ): V3EvaluationDetailDTO {
    const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
    const questionSnapshot = safeParseJson(evaluation.questionSnapshot, {});

    return {
      evaluationId: evaluation.id,
      sessionId: evaluation.sessionId,
      questionId: evaluation.questionId,
      studentAnonymizedCode: studentCode,
      question: {
        code: questionSnapshot.code || '',
        title: questionSnapshot.title || '',
        scenario: questionSnapshot.scenario || '',
        modelAnswer: questionSnapshot.modelAnswer || '',
        statutoryElements: safeParseJson(questionSnapshot.statutoryElements, []),
        relevantProvisions: safeParseJson(questionSnapshot.relevantProvisions, []),
      },
      studentAnswer: evaluation.studentAnswer,
      v3AiScore: evaluation.numericalScore,
      v3MaxScore: evaluation.maxScore,
      v3ScoringBasis: evaluation.scoringBasis,
      v3CriterionScores: safeParseJson(evaluation.criterionScores, []),
      v3Strengths: safeParseJson(evaluation.strengths, []),
      v3MissingElements: safeParseJson(evaluation.missingElements, []),
      existingReview: existingReview
        ? {
            id: existingReview.id,
            agreementRating: existingReview.agreementRating,
            reasoningCorrectnessRating: existingReview.reasoningCorrectnessRating,
            statutoryGroundingRating: existingReview.statutoryGroundingRating,
            recommendedScore: existingReview.recommendedScore,
            scoreDelta: existingReview.scoreDelta,
            errorTags: safeParseJson(existingReview.errorTags, []),
            qualitativeComments: existingReview.qualitativeComments,
            improvementSuggestions: existingReview.improvementSuggestions,
            finalVerdict: existingReview.finalVerdict,
            createdAt: existingReview.createdAt,
          }
        : null,
    };
  }

  static toRecordDTO(record: any, anonymizedIndex: number): FinalEvaluationRecordDTO {
    const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
    return {
      id: record.id,
      expertId: record.expertId,
      evaluationId: record.evaluationId,
      sessionId: record.sessionId,
      questionId: record.questionId,
      studentAnonymizedCode: studentCode,
      agreementRating: record.agreementRating,
      reasoningCorrectnessRating: record.reasoningCorrectnessRating,
      statutoryGroundingRating: record.statutoryGroundingRating,
      recommendedScore: record.recommendedScore,
      aiScore: record.aiScore,
      scoreDelta: record.scoreDelta,
      errorTags: safeParseJson(record.errorTags, []),
      qualitativeComments: record.qualitativeComments,
      improvementSuggestions: record.improvementSuggestions,
      finalVerdict: record.finalVerdict,
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
