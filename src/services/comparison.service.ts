import { prisma } from '../lib/prisma';
import { ComparisonDTO, ComparisonItemDTO } from '../dto/comparison.dto';

export class ComparisonService {
  /**
   * Generates side-by-side AI vs. Expert comparison records for submitted expert evaluations.
   */
  static async getComparisonList(filter?: {
    agentVersionId?: string;
    sessionId?: string;
    questionId?: string;
    isDemo?: boolean;
    thresholdPercent?: number;
    hasConflictOnly?: boolean;
  }) {
    const threshold = filter?.thresholdPercent ?? 10;

    const whereExpert: any = {};
    if (filter?.sessionId) whereExpert.sessionId = filter.sessionId;
    if (filter?.questionId) whereExpert.questionId = filter.questionId;
    if (filter?.isDemo !== undefined) whereExpert.isDemo = filter.isDemo;

    const expertEvaluations = await prisma.expertEvaluation.findMany({
      where: whereExpert,
      orderBy: { createdAt: 'desc' },
      include: {
        expert: true,
      },
    });

    // Fetch all submitted sessions to compute deterministic anonymized student codes
    const allSessions = await prisma.assessmentSession.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const sessionIndexMap: Record<string, number> = {};
    allSessions.forEach((s, idx) => {
      sessionIndexMap[s.id] = idx + 1;
    });

    const comparisonItems: ComparisonItemDTO[] = [];

    for (const expertEval of expertEvaluations) {
      const whereAi: any = {
        sessionId: expertEval.sessionId,
        questionId: expertEval.questionId,
      };
      if (filter?.agentVersionId) whereAi.agentVersionId = filter.agentVersionId;

      const aiEval = await prisma.evaluation.findFirst({
        where: whereAi,
        include: {
          agentVersion: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (aiEval) {
        const anonymizedIndex = sessionIndexMap[expertEval.sessionId] || 1;
        const item = ComparisonDTO.toItemDTO(aiEval, expertEval, anonymizedIndex, threshold);

        if (!filter?.hasConflictOnly || item.conflictFlags.length > 0) {
          comparisonItems.push(item);
        }
      }
    }

    // Calculate descriptive summary metrics
    const totalCompared = comparisonItems.length;
    let sumAbsoluteDelta = 0;
    let sumSignedDelta = 0;
    let flaggedConflictsCount = 0;

    comparisonItems.forEach((c) => {
      sumAbsoluteDelta += c.absoluteDelta;
      sumSignedDelta += c.scoreDelta;
      if (c.conflictFlags.length > 0) {
        flaggedConflictsCount++;
      }
    });

    const meanAbsoluteDelta = totalCompared > 0 ? Math.round((sumAbsoluteDelta / totalCompared) * 10) / 10 : 0;
    const meanSignedDelta = totalCompared > 0 ? Math.round((sumSignedDelta / totalCompared) * 10) / 10 : 0;
    const agreementRate = totalCompared > 0 ? Math.round(((totalCompared - flaggedConflictsCount) / totalCompared) * 100) : 100;

    return {
      summary: {
        totalCompared,
        meanAbsoluteDelta,
        meanSignedDelta,
        flaggedConflictsCount,
        agreementRate,
        configuredThresholdPercent: threshold,
      },
      comparisons: comparisonItems,
    };
  }
}
