import { prisma } from '../lib/prisma';
import { ProgressionAnalyticsDTO, IterationMetricSummary, CriterionDeltaSummary, PostV3Summary } from '../dto/statistics.dto';

export class StatisticsService {
  /**
   * Computes transparent descriptive statistics across V1, V2, and V3 iterations.
   * Server default: isDemo = false (research data only).
   */
  static async getProgressionAnalytics(options?: {
    isDemo?: boolean;
    thresholdPercent?: number;
  }): Promise<ProgressionAnalyticsDTO> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;
    const threshold = options?.thresholdPercent ?? 10;

    const versions = await prisma.agentVersion.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const iterationMetrics: IterationMetricSummary[] = [];
    const criterionMap: Record<string, { maxPoints: number; deltasByVersion: Record<string, number[]> }> = {};

    for (const ver of versions) {
      // Find all AI evaluations for this agent version
      const aiEvals = await prisma.evaluation.findMany({
        where: {
          agentVersionId: ver.id,
          isDemo: isDemoFilter,
        },
      });

      // Find matching expert evaluations
      const pairedDeltas: Array<{
        aiScore: number;
        expertScore: number;
        signedDelta: number; // AI - Expert
        absDelta: number; // |AI - Expert|
        maxScore: number;
        isConflict: boolean;
      }> = [];

      for (const ai of aiEvals) {
        const expertEval = await prisma.expertEvaluation.findFirst({
          where: {
            sessionId: ai.sessionId,
            questionId: ai.questionId,
            isDemo: isDemoFilter,
          },
        });

        if (expertEval) {
          const aiScore = ai.numericalScore;
          const expertScore = expertEval.numericalScore;
          const maxScore = ai.maxScore || 100;
          const signedDelta = Math.round((aiScore - expertScore) * 10) / 10;
          const absDelta = Math.round(Math.abs(aiScore - expertScore) * 10) / 10;
          const percentageDivergence = maxScore > 0 ? (absDelta / maxScore) * 100 : 0;
          const isConflict = percentageDivergence >= threshold;

          pairedDeltas.push({
            aiScore,
            expertScore,
            signedDelta,
            absDelta,
            maxScore,
            isConflict,
          });

          // Criterion-level deltas
          const aiCriteria = safeParseJson(ai.criterionScores, []);
          const expertCriteria = safeParseJson(expertEval.criterionScores, []);

          expertCriteria.forEach((ec: any) => {
            const cName = ec.criterionName;
            if (!criterionMap[cName]) {
              criterionMap[cName] = {
                maxPoints: ec.maxPoints || 20,
                deltasByVersion: {},
              };
            }
            if (!criterionMap[cName].deltasByVersion[ver.versionTag]) {
              criterionMap[cName].deltasByVersion[ver.versionTag] = [];
            }

            const matchingAi = aiCriteria.find(
              (ac: any) => ac.criterionName?.toLowerCase() === cName?.toLowerCase()
            );
            const aiCritScore = matchingAi ? matchingAi.score : 0;
            const cAbsDelta = Math.abs(aiCritScore - ec.score);
            criterionMap[cName].deltasByVersion[ver.versionTag].push(cAbsDelta);
          });
        }
      }

      const sampleSize = pairedDeltas.length;
      if (sampleSize > 0) {
        const sumAbs = pairedDeltas.reduce((sum, d) => sum + d.absDelta, 0);
        const sumSigned = pairedDeltas.reduce((sum, d) => sum + d.signedDelta, 0);
        const meanAbsoluteDelta = Math.round((sumAbs / sampleSize) * 10) / 10;
        const meanSignedDelta = Math.round((sumSigned / sampleSize) * 10) / 10;

        const aiScores = pairedDeltas.map((d) => d.aiScore);
        const expertScores = pairedDeltas.map((d) => d.expertScore);
        const absDeltas = pairedDeltas.map((d) => d.absDelta);

        const aiMeanScore = Math.round((aiScores.reduce((a, b) => a + b, 0) / sampleSize) * 10) / 10;
        const expertMeanScore = Math.round((expertScores.reduce((a, b) => a + b, 0) / sampleSize) * 10) / 10;

        const aiScoreStdDev = calculateStdDev(aiScores, aiMeanScore);
        const expertScoreStdDev = calculateStdDev(expertScores, expertMeanScore);

        const minAbsoluteDelta = Math.min(...absDeltas);
        const maxAbsoluteDelta = Math.max(...absDeltas);

        const conflictCount = pairedDeltas.filter((d) => d.isConflict).length;
        const agreementRate = Math.round(((sampleSize - conflictCount) / sampleSize) * 100);

        iterationMetrics.push({
          versionTag: ver.versionTag,
          versionLabel: ver.label,
          sampleSize,
          meanAbsoluteDelta,
          meanSignedDelta,
          aiMeanScore,
          aiScoreStdDev,
          expertMeanScore,
          expertScoreStdDev,
          minAbsoluteDelta,
          maxAbsoluteDelta,
          agreementRate,
          conflictCount,
        });
      } else {
        iterationMetrics.push({
          versionTag: ver.versionTag,
          versionLabel: ver.label,
          sampleSize: 0,
          meanAbsoluteDelta: 0,
          meanSignedDelta: 0,
          aiMeanScore: 0,
          aiScoreStdDev: 0,
          expertMeanScore: 0,
          expertScoreStdDev: 0,
          minAbsoluteDelta: 0,
          maxAbsoluteDelta: 0,
          agreementRate: 100,
          conflictCount: 0,
        });
      }
    }

    // Build criterion progression summary
    const criterionProgression: CriterionDeltaSummary[] = Object.entries(criterionMap).map(
      ([criterionName, data]) => {
        const calcMean = (arr?: number[]) =>
          arr && arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : undefined;

        return {
          criterionName,
          maxPoints: data.maxPoints,
          v1MeanAbsoluteDelta: calcMean(data.deltasByVersion['V1']),
          v2MeanAbsoluteDelta: calcMean(data.deltasByVersion['V2']),
          v3MeanAbsoluteDelta: calcMean(data.deltasByVersion['V3']),
        };
      }
    );

    // Compute Post-V3 Final Review Summary
    const finalReviews = await prisma.finalEvaluationReview.findMany({
      where: { isDemo: isDemoFilter },
    });

    const totalReviews = finalReviews.length;
    let sumAgreement = 0;
    let sumReasoning = 0;
    let sumStatutory = 0;
    let sumRecScore = 0;
    let sumScoreDelta = 0;

    const verdictCounts: Record<string, number> = {
      ACCEPTABLE: 0,
      ACCEPTABLE_WITH_MINOR_ISSUES: 0,
      REQUIRES_IMPROVEMENT: 0,
    };
    const errorTagCounts: Record<string, number> = {};

    finalReviews.forEach((rev) => {
      sumAgreement += rev.agreementRating;
      sumReasoning += rev.reasoningCorrectnessRating;
      sumStatutory += rev.statutoryGroundingRating;
      sumRecScore += rev.recommendedScore;
      sumScoreDelta += rev.scoreDelta;

      verdictCounts[rev.finalVerdict] = (verdictCounts[rev.finalVerdict] || 0) + 1;

      const tags: string[] = safeParseJson(rev.errorTags, []);
      tags.forEach((tag) => {
        errorTagCounts[tag] = (errorTagCounts[tag] || 0) + 1;
      });
    });

    const postV3Summary: PostV3Summary = {
      totalReviews,
      meanAgreementRating: totalReviews > 0 ? Math.round((sumAgreement / totalReviews) * 100) / 100 : 0,
      meanReasoningCorrectness: totalReviews > 0 ? Math.round((sumReasoning / totalReviews) * 100) / 100 : 0,
      meanStatutoryGrounding: totalReviews > 0 ? Math.round((sumStatutory / totalReviews) * 100) / 100 : 0,
      meanRecommendedScore: totalReviews > 0 ? Math.round((sumRecScore / totalReviews) * 10) / 10 : 0,
      meanScoreDelta: totalReviews > 0 ? Math.round((sumScoreDelta / totalReviews) * 10) / 10 : 0,
      verdictCounts: {
        ACCEPTABLE: verdictCounts.ACCEPTABLE || 0,
        ACCEPTABLE_WITH_MINOR_ISSUES: verdictCounts.ACCEPTABLE_WITH_MINOR_ISSUES || 0,
        REQUIRES_IMPROVEMENT: verdictCounts.REQUIRES_IMPROVEMENT || 0,
      },
      errorTagCounts,
    };

    return {
      isDemo: isDemoFilter,
      generatedAt: new Date(),
      iterations: iterationMetrics,
      criterionProgression,
      postV3Summary,
      methodologyNotes: [
        'Descriptive metrics only: Mean Absolute Delta calculated as Mean(|AI Score - Expert Score|).',
        'Standard Deviation calculated using sample standard deviation formula with Bessel\'s correction.',
        'Data isolation enforced: All metrics reflect isDemo = false research records unless demo data explicitly requested.',
        'No inferential statistical claims or hypothesis testing conclusions are asserted automatically.',
      ],
    };
  }
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const sumSquaredDiff = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
  return Math.round(Math.sqrt(sumSquaredDiff / (values.length - 1)) * 10) / 10;
}

function safeParseJson(str: any, fallback: any = []): any {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
