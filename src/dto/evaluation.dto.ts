import { percentageToCustomFivePoint } from '../utils/scoring';

export interface StudentEvaluationFeedbackDTO {
  id: string;
  questionId: string;
  numericalScore: number;
  weightedPercentage: number;
  finalScore: number;
  roundedScore: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: Array<{
    criterionName: string;
    score: number;
    maxPoints: number;
    reasoning: string;
    evidence?: string;
    deficiencies?: string;
  }>;
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
  formScore?: number;
  answerScore?: number;
  ruleScore?: number;
  applicationScore?: number;
  conclusionScore?: number;
  rawPercentage: number;
  rawTenPointGrade?: number;
  finalRoundedGrade?: number;
  reviewFlags?: string[];
}

export interface AdminEvaluationDTO {
  id: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  questionId: string;
  agentVersionId?: string;
  agentVersionTag?: string;
  modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C' | string;
  modelFamily: string;
  exactModelId: string;
  questionSnapshot: any;
  modelConfigSnapshot: any;
  rubricSnapshot: any;
  studentAnswer: string;
  numericalScore: number;
  weightedPercentage: number;
  finalScore: number;
  roundedScore: number;
  maxScore: number;
  scoringBasis: string;
  criterionScores: any[];
  strengths: string[];
  missingElements: string[];
  areasForImprovement: string[];
  lexicalAnalysis: any;
  semanticAnalysis: any;
  confidenceScore: number;
  reviewFlags: string[];
  isDemo: boolean;
  createdAt: Date;
  formScore?: number;
  answerScore?: number;
  ruleScore?: number;
  applicationScore?: number;
  conclusionScore?: number;
  rawPercentage: number;
  rawTenPointGrade?: number;
  finalRoundedGrade?: number;
}

export class EvaluationDTO {
  /**
   * Strictly sanitizes Evaluation for student diagnostic feedback.
   * Strips model names, LLM identifiers, reference answers, and system prompts.
   * Presents evaluations purely as Lexify Legal Assessment.
   */
  static toStudentDTO(evalRecord: any): StudentEvaluationFeedbackDTO {
    const weightedPercentage = evalRecord.numericalScore ?? 0;
    const finalScore = Number((weightedPercentage * 0.05).toFixed(4));
    const roundedScore = percentageToCustomFivePoint(weightedPercentage);
    const criteria: any[] = safeParseJson(evalRecord.criterionScores, []);

    const formScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'form')?.score;
    const answerScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'answer')?.score;
    const ruleScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'rule')?.score;
    const applicationScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'application')?.score;
    const conclusionScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'conclusion')?.score;

    // Clean model provenance prefixes from scoringBasis for student presentation
    let cleanScoringBasis = evalRecord.scoringBasis || '';
    cleanScoringBasis = cleanScoringBasis
      .replace(/^\[(Meta Llama|Llama|Microsoft Phi|Phi|Google Gemma|Gemma|MODEL_[ABC])[^\]]*\]\s*/i, '[Lexify Assessment] ')
      .trim();

    return {
      id: evalRecord.id,
      questionId: evalRecord.questionId,
      numericalScore: weightedPercentage,
      weightedPercentage,
      finalScore,
      roundedScore,
      maxScore: evalRecord.maxScore ?? 100,
      scoringBasis: cleanScoringBasis,
      criterionScores: criteria,
      strengths: safeParseJson(evalRecord.strengths, []),
      missingElements: safeParseJson(evalRecord.missingElements, []),
      areasForImprovement: safeParseJson(evalRecord.areasForImprovement, []),
      reviewFlags: safeParseJson(evalRecord.reviewFlags, []),
      formScore,
      answerScore,
      ruleScore,
      applicationScore,
      conclusionScore,
      rawPercentage: weightedPercentage,
      rawTenPointGrade: Number((weightedPercentage / 10).toFixed(4)),
      finalRoundedGrade: Math.round(weightedPercentage / 10),
    };
  }


  /**
   * Formats Evaluation for researcher admin inspection.
   */
  static toAdminDTO(evalRecord: any): AdminEvaluationDTO {
    const weightedPercentage = evalRecord.numericalScore ?? 0;
    const finalScore = Number((weightedPercentage * 0.05).toFixed(4));
    const roundedScore = percentageToCustomFivePoint(weightedPercentage);
    const criteria: any[] = safeParseJson(evalRecord.criterionScores, []);

    const formScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'form')?.score;
    const answerScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'answer')?.score;
    const ruleScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'rule')?.score;
    const applicationScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'application')?.score;
    const conclusionScore = criteria.find((c) => c.criterionName?.toLowerCase() === 'conclusion')?.score;

    return {
      id: evalRecord.id,
      sessionId: evalRecord.sessionId,
      studentId: evalRecord.studentId,
      studentName: evalRecord.student?.name,
      studentEmail: evalRecord.student?.email,
      questionId: evalRecord.questionId,
      agentVersionId: evalRecord.agentVersionId,
      agentVersionTag: evalRecord.agentVersion?.versionTag,
      modelSlot: evalRecord.modelSlot || 'MODEL_A',
      modelFamily: evalRecord.modelFamily || 'Llama 3.1',
      exactModelId: evalRecord.exactModelId || 'meta-llama/llama-3.1-8b-instruct',
      questionSnapshot: safeParseJson(evalRecord.questionSnapshot, {}),
      modelConfigSnapshot: safeParseJson(evalRecord.modelConfigSnapshot, {}),
      rubricSnapshot: safeParseJson(evalRecord.rubricSnapshot, []),
      studentAnswer: evalRecord.studentAnswer,
      numericalScore: weightedPercentage,
      weightedPercentage,
      finalScore,
      roundedScore,
      maxScore: evalRecord.maxScore ?? 100,
      scoringBasis: evalRecord.scoringBasis,
      criterionScores: criteria,
      strengths: safeParseJson(evalRecord.strengths, []),
      missingElements: safeParseJson(evalRecord.missingElements, []),
      areasForImprovement: safeParseJson(evalRecord.areasForImprovement, []),
      lexicalAnalysis: safeParseJson(evalRecord.lexicalAnalysis, {}),
      semanticAnalysis: safeParseJson(evalRecord.semanticAnalysis, {}),
      confidenceScore: evalRecord.confidenceScore,
      reviewFlags: safeParseJson(evalRecord.reviewFlags, []),
      isDemo: evalRecord.isDemo,
      createdAt: evalRecord.createdAt,
      formScore,
      answerScore,
      ruleScore,
      applicationScore,
      conclusionScore,
      rawPercentage: weightedPercentage,
      rawTenPointGrade: Number((weightedPercentage / 10).toFixed(4)),
      finalRoundedGrade: Math.round(weightedPercentage / 10),
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
