import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';
import { FinalEvaluationDTO } from '../dto/final-evaluation.dto';

export class FinalEvaluationService {
  /**
   * Lists all V3 evaluations available for post-V3 expert review.
   * Default: research data (isDemo: false), unless isDemo is explicitly specified.
   */
  static async getV3ReviewQueue(expertId: string, isDemo?: boolean) {
    const isDemoFilter = isDemo !== undefined ? isDemo : false;

    // Find V3 AgentVersion or fallback to latest version
    const v3Version = await prisma.agentVersion.findFirst({
      where: { versionTag: 'V3' },
    });

    const versionId = v3Version?.id;
    const where: any = { isDemo: isDemoFilter };
    if (versionId) {
      where.agentVersionId = versionId;
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agentVersion: true,
        finalReviews: {
          where: { expertId },
        },
      },
    });

    // Map deterministic student anonymized code
    const allSessions = await prisma.assessmentSession.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const sessionIndexMap: Record<string, number> = {};
    allSessions.forEach((s, idx) => {
      sessionIndexMap[s.id] = idx + 1;
    });

    return evaluations.map((evaluation) => {
      const anonymizedIndex = sessionIndexMap[evaluation.sessionId] || 1;
      const existingReview = evaluation.finalReviews[0];
      return FinalEvaluationDTO.toQueueItem(evaluation, anonymizedIndex, existingReview);
    });
  }

  /**
   * Retrieves single evaluation details for unblinded post-V3 final review.
   */
  static async getV3EvaluationForReview(expertId: string, evaluationId: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        agentVersion: true,
        finalReviews: {
          where: { expertId },
        },
      },
    });

    if (!evaluation) {
      throw new Error('Evaluation record not found');
    }

    const allSessions = await prisma.assessmentSession.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const sessionIndex = allSessions.findIndex((s) => s.id === evaluation.sessionId);
    const anonymizedIndex = sessionIndex >= 0 ? sessionIndex + 1 : 1;

    const existingReview = evaluation.finalReviews[0];
    return FinalEvaluationDTO.toDetailDTO(evaluation, anonymizedIndex, existingReview);
  }

  /**
   * Submits post-V3 expert review as immutable research evidence.
   */
  static async submitFinalReview(
    expertId: string,
    evaluationId: string,
    reviewData: {
      agreementRating: number;
      reasoningCorrectnessRating: number;
      statutoryGroundingRating: number;
      recommendedScore: number;
      errorTags: string[];
      qualitativeComments?: string;
      improvementSuggestions?: string;
      finalVerdict: 'ACCEPTABLE' | 'ACCEPTABLE_WITH_MINOR_ISSUES' | 'REQUIRES_IMPROVEMENT' | string;
    }
  ) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error('Evaluation record not found');
    }

    const existing = await prisma.finalEvaluationReview.findUnique({
      where: {
        expertId_evaluationId: {
          expertId,
          evaluationId,
        },
      },
    });

    if (existing) {
      throw new Error('Final evaluation review for this evaluation has already been submitted and locked.');
    }

    // Validate rating ranges (1-5)
    if (
      reviewData.agreementRating < 1 ||
      reviewData.agreementRating > 5 ||
      reviewData.reasoningCorrectnessRating < 1 ||
      reviewData.reasoningCorrectnessRating > 5 ||
      reviewData.statutoryGroundingRating < 1 ||
      reviewData.statutoryGroundingRating > 5
    ) {
      throw new Error('Likert evaluation ratings must be between 1 and 5.');
    }

    const scoreDelta = Math.round((reviewData.recommendedScore - evaluation.numericalScore) * 10) / 10;

    const created = await prisma.finalEvaluationReview.create({
      data: {
        expertId,
        evaluationId,
        sessionId: evaluation.sessionId,
        questionId: evaluation.questionId,
        agentVersionId: evaluation.agentVersionId,
        agreementRating: reviewData.agreementRating,
        reasoningCorrectnessRating: reviewData.reasoningCorrectnessRating,
        statutoryGroundingRating: reviewData.statutoryGroundingRating,
        recommendedScore: reviewData.recommendedScore,
        aiScore: evaluation.numericalScore,
        scoreDelta,
        errorTags: JSON.stringify(reviewData.errorTags || []),
        qualitativeComments: reviewData.qualitativeComments || '',
        improvementSuggestions: reviewData.improvementSuggestions || '',
        finalVerdict: reviewData.finalVerdict || 'ACCEPTABLE',
        questionSnapshot: evaluation.questionSnapshot,
        studentAnswer: evaluation.studentAnswer,
        isDemo: evaluation.isDemo,
      },
    });

    await AuditService.logAction({
      userId: expertId,
      action: 'SUBMIT_POST_V3_REVIEW',
      entityType: 'FINAL_EVALUATION_REVIEW',
      entityId: created.id,
      details: {
        evaluationId,
        agreementRating: created.agreementRating,
        finalVerdict: created.finalVerdict,
        scoreDelta,
      },
      isDemo: evaluation.isDemo,
    });

    return {
      success: true,
      message: 'Post-V3 final review submitted and committed as immutable research evidence.',
      review: created,
    };
  }

  /**
   * Retrieves final reviews for researcher analysis.
   * Server default: isDemo = false
   */
  static async getFinalReviews(filter?: {
    isDemo?: boolean;
    finalVerdict?: string;
    agentVersionId?: string;
  }) {
    const where: any = {
      isDemo: filter?.isDemo !== undefined ? filter.isDemo : false,
    };

    if (filter?.finalVerdict) where.finalVerdict = filter.finalVerdict;
    if (filter?.agentVersionId) where.agentVersionId = filter.agentVersionId;

    return prisma.finalEvaluationReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        expert: true,
        evaluation: true,
      },
    });
  }
}
