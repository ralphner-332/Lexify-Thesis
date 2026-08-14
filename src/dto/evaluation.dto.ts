export interface StudentEvaluationFeedbackDTO {
  id: string;
  questionId: string;
  numericalScore: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: Array<{
    criterionName: string;
    score: number;
    maxPoints: number;
    reasoning: string;
  }>;
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
}

export interface AdminEvaluationDTO {
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
  criterionScores: any[];
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
  confidenceScore: number;
  reviewFlags: string[];
  isDemo: boolean;
  createdAt: Date;
}

export class EvaluationDTO {
  /**
   * Strictly sanitizes Evaluation for student diagnostic feedback.
   * Strips model reference answers, statutory keys, system prompts, and internal review flags.
   */
  static toStudentDTO(evalRecord: any): StudentEvaluationFeedbackDTO {
    return {
      id: evalRecord.id,
      questionId: evalRecord.questionId,
      numericalScore: evalRecord.numericalScore,
      maxScore: evalRecord.maxScore,
      scoringBasis: evalRecord.scoringBasis,
      criterionScores: safeParseJson(evalRecord.criterionScores, []),
      strengths: safeParseJson(evalRecord.strengths, []),
      missingElements: safeParseJson(evalRecord.missingElements, []),
      areasForImprovement: safeParseJson(evalRecord.areasForImprovement, []),
    };
  }

  /**
   * Formats Evaluation for researcher admin inspection.
   */
  static toAdminDTO(evalRecord: any): AdminEvaluationDTO {
    return {
      id: evalRecord.id,
      sessionId: evalRecord.sessionId,
      studentId: evalRecord.studentId,
      studentName: evalRecord.student?.name,
      studentEmail: evalRecord.student?.email,
      questionId: evalRecord.questionId,
      agentVersionId: evalRecord.agentVersionId,
      questionSnapshot: safeParseJson(evalRecord.questionSnapshot, {}),
      modelConfigSnapshot: safeParseJson(evalRecord.modelConfigSnapshot, {}),
      rubricSnapshot: safeParseJson(evalRecord.rubricSnapshot, []),
      studentAnswer: evalRecord.studentAnswer,
      numericalScore: evalRecord.numericalScore,
      maxScore: evalRecord.maxScore,
      scoringBasis: evalRecord.scoringBasis,
      criterionScores: safeParseJson(evalRecord.criterionScores, []),
      strengths: safeParseJson(evalRecord.strengths, []),
      missingElements: safeParseJson(evalRecord.missingElements, []),
      areasForImprovement: safeParseJson(evalRecord.areasForImprovement, []),
      confidenceScore: evalRecord.confidenceScore,
      reviewFlags: safeParseJson(evalRecord.reviewFlags, []),
      isDemo: evalRecord.isDemo,
      createdAt: evalRecord.createdAt,
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
