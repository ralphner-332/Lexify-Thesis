import { prisma } from '../lib/prisma';
import { ProgressionAnalyticsDTO, IterationMetricSummary, CriterionDeltaSummary, PostV3Summary } from '../dto/statistics.dto';

export interface ModelDistributionStats {
  modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  researchName: string;
  modelFamily: string;
  parameterClass: string;
  sampleSize: number;
  meanRawPercentage: number;
  meanFinalScore: number;
  medianFinalScore: number;
  minFinalScore: number;
  maxFinalScore: number;
  meanTenPointGrade: number;
  medianGrade: number;
  stdDev: number;
  minGrade: number;
  maxGrade: number;
  criterionMeans: {
    form: number;
    answer: number;
    rule: number;
    application: number;
    conclusion: number;
  };
}

export interface PairwiseModelComparison {
  pairName: string;
  model1: string;
  model2: string;
  sampleSize: number;
  meanAbsoluteDelta: number;
  meanSignedDelta: number;
  agreementRatePercent: number; // percentage where difference is <= 1.0 on 10-pt scale
}

export interface MultiModelAnalyticsDTO {
  isDemo: boolean;
  totalSubmissions: number;
  totalEvaluations: number;
  models: {
    modelA: ModelDistributionStats;
    modelB: ModelDistributionStats;
    modelC: ModelDistributionStats;
  };
  pairwiseComparisons: PairwiseModelComparison[];
  studentSurveysSummary: {
    totalResponses: number;
    averageLikertScore: number;
  };
}

export class StatisticsService {
  /**
   * Computes descriptive and comparative analytics across Meta Llama 3.1 8B, Mistral 7B, and Gemma 2 9B.
   * Server default: isDemo = false (research data only).
   */
  static async getMultiModelAnalytics(options?: { isDemo?: boolean }): Promise<MultiModelAnalyticsDTO> {
    const isDemoFilter = options?.isDemo !== undefined ? options.isDemo : false;

    const [evaluations, surveyResponses, submissionsCount] = await Promise.all([
      prisma.evaluation.findMany({
        where: { isDemo: isDemoFilter },
        include: { student: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.surveyResponse.findMany({
        where: { isDemo: isDemoFilter },
      }),
      prisma.assessmentSession.count({
        where: { isDemo: isDemoFilter, status: 'SUBMITTED' },
      }),
    ]);

    const evalsBySlot: Record<string, any[]> = {
      MODEL_A: evaluations.filter((e) => e.modelSlot === 'MODEL_A' || (!e.modelSlot && e.agentVersionId)),
      MODEL_B: evaluations.filter((e) => e.modelSlot === 'MODEL_B'),
      MODEL_C: evaluations.filter((e) => e.modelSlot === 'MODEL_C'),
    };

    const calcModelStats = (
      slot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C',
      researchName: string,
      family: string,
      paramClass: string
    ): ModelDistributionStats => {
      const list = evalsBySlot[slot] || [];
      const n = list.length;
      if (n === 0) {
        return {
          modelSlot: slot,
          researchName,
          modelFamily: family,
          parameterClass: paramClass,
          sampleSize: 0,
          meanRawPercentage: 0,
          meanFinalScore: 0,
          medianFinalScore: 0,
          minFinalScore: 0,
          maxFinalScore: 0,
          meanTenPointGrade: 0,
          medianGrade: 0,
          stdDev: 0,
          minGrade: 0,
          maxGrade: 0,
          criterionMeans: { form: 0, answer: 0, rule: 0, application: 0, conclusion: 0 },
        };
      }

      const rawScores = list.map((e) => e.numericalScore).sort((a, b) => a - b);
      const finalScores = list.map((e) => Number((e.numericalScore * 0.05).toFixed(4))).sort((a, b) => a - b);
      const grades = list.map((e) => e.numericalScore / 10).sort((a, b) => a - b);
      const sumRaw = list.reduce((s, e) => s + e.numericalScore, 0);
      const meanRaw = Math.round((sumRaw / n) * 10) / 10;
      const meanFinal = Math.round((meanRaw * 0.05) * 100) / 100;
      const mean10Pt = Math.round((meanRaw / 10) * 100) / 100;

      const mid = Math.floor(n / 2);
      const medianRaw = n % 2 === 0 ? Math.round(((rawScores[mid - 1] + rawScores[mid]) / 2) * 10) / 10 : Math.round(rawScores[mid] * 10) / 10;
      const medianFinal = Math.round((medianRaw * 0.05) * 100) / 100;
      const median = n % 2 === 0 ? Math.round(((grades[mid - 1] + grades[mid]) / 2) * 10) / 10 : Math.round(grades[mid] * 10) / 10;

      const variance = list.reduce((s, e) => s + Math.pow(e.numericalScore * 0.05 - meanFinal, 2), 0) / n;
      const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

      // Criterion breakdown means
      let formSum = 0;
      let ansSum = 0;
      let ruleSum = 0;
      let appSum = 0;
      let conclSum = 0;

      list.forEach((e) => {
        const criteria = safeParseJson(e.criterionScores, []);
        formSum += criteria.find((c: any) => c.criterionName?.toLowerCase() === 'form')?.score || 0;
        ansSum += criteria.find((c: any) => c.criterionName?.toLowerCase() === 'answer')?.score || 0;
        ruleSum += criteria.find((c: any) => c.criterionName?.toLowerCase() === 'rule')?.score || 0;
        appSum += criteria.find((c: any) => c.criterionName?.toLowerCase() === 'application')?.score || 0;
        conclSum += criteria.find((c: any) => c.criterionName?.toLowerCase() === 'conclusion')?.score || 0;
      });

      return {
        modelSlot: slot,
        researchName,
        modelFamily: family,
        parameterClass: paramClass,
        sampleSize: n,
        meanRawPercentage: meanRaw,
        meanFinalScore: meanFinal,
        medianFinalScore: medianFinal,
        minFinalScore: Math.round(finalScores[0] * 100) / 100,
        maxFinalScore: Math.round(finalScores[n - 1] * 100) / 100,
        meanTenPointGrade: mean10Pt,
        medianGrade: median,
        stdDev,
        minGrade: Math.round(grades[0] * 10) / 10,
        maxGrade: Math.round(grades[n - 1] * 10) / 10,
        criterionMeans: {
          form: Math.round((formSum / n) * 10) / 10,
          answer: Math.round((ansSum / n) * 10) / 10,
          rule: Math.round((ruleSum / n) * 10) / 10,
          application: Math.round((appSum / n) * 10) / 10,
          conclusion: Math.round((conclSum / n) * 10) / 10,
        },
      };
    };

    const modelAStats = calcModelStats('MODEL_A', 'Meta Llama 3.2 3B', 'Llama 3.2', '3.2B');
    const modelBStats = calcModelStats('MODEL_B', 'Microsoft Phi-4-mini', 'Phi-4', '3.8B');
    const modelCStats = calcModelStats('MODEL_C', 'Google Gemma 2 2B', 'Gemma 2', '2.6B');

    // Pairwise comparisons across student submissions
    const calcPairwise = (
      pairName: string,
      slot1: string,
      name1: string,
      slot2: string,
      name2: string
    ): PairwiseModelComparison => {
      const list1 = evalsBySlot[slot1] || [];
      const list2 = evalsBySlot[slot2] || [];

      const paired: Array<{ g1: number; g2: number }> = [];
      list1.forEach((e1) => {
        const match = list2.find((e2) => e2.sessionId === e1.sessionId && e2.questionId === e1.questionId);
        if (match) {
          paired.push({ g1: e1.numericalScore / 10, g2: match.numericalScore / 10 });
        }
      });

      if (paired.length === 0) {
        return {
          pairName,
          model1: name1,
          model2: name2,
          sampleSize: 0,
          meanAbsoluteDelta: 0,
          meanSignedDelta: 0,
          agreementRatePercent: 0,
        };
      }

      let absSum = 0;
      let signedSum = 0;
      let agreementCount = 0;

      paired.forEach((p) => {
        const delta = p.g1 - p.g2;
        const absDelta = Math.abs(delta);
        absSum += absDelta;
        signedSum += delta;
        if (absDelta <= 1.0) agreementCount++;
      });

      return {
        pairName,
        model1: name1,
        model2: name2,
        sampleSize: paired.length,
        meanAbsoluteDelta: Math.round((absSum / paired.length) * 100) / 100,
        meanSignedDelta: Math.round((signedSum / paired.length) * 100) / 100,
        agreementRatePercent: Math.round((agreementCount / paired.length) * 1000) / 10,
      };
    };

    const pairwiseComparisons: PairwiseModelComparison[] = [
      calcPairwise('Llama 3.2 3B vs. Phi-4-mini', 'MODEL_A', 'Meta Llama 3.2 3B', 'MODEL_B', 'Microsoft Phi-4-mini'),
      calcPairwise('Phi-4-mini vs. Gemma 2 2B', 'MODEL_B', 'Microsoft Phi-4-mini', 'MODEL_C', 'Google Gemma 2 2B'),
      calcPairwise('Llama 3.2 3B vs. Gemma 2 2B', 'MODEL_A', 'Meta Llama 3.2 3B', 'MODEL_C', 'Google Gemma 2 2B'),
    ];

    // Student usability summary
    let likertSum = 0;
    let likertCount = 0;
    surveyResponses.forEach((sr) => {
      const ans = safeParseJson(sr.answers, {});
      Object.values(ans).forEach((val: any) => {
        if (typeof val === 'number') {
          likertSum += val;
          likertCount++;
        } else if (typeof val === 'string' && /^\d+/.test(val)) {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            likertSum += num;
            likertCount++;
          }
        }
      });
    });

    return {
      isDemo: isDemoFilter,
      totalSubmissions: submissionsCount,
      totalEvaluations: evaluations.length,
      models: {
        modelA: modelAStats,
        modelB: modelBStats,
        modelC: modelCStats,
      },
      pairwiseComparisons,
      studentSurveysSummary: {
        totalResponses: surveyResponses.length,
        averageLikertScore: likertCount > 0 ? Math.round((likertSum / likertCount) * 100) / 100 : 0,
      },
    };
  }

  /**
   * Backward-compatible helper for legacy test suites.
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
      const aiEvals = await prisma.evaluation.findMany({
        where: {
          agentVersionId: ver.id,
          isDemo: isDemoFilter,
        },
      });

      const pairedDeltas: Array<{
        aiScore: number;
        expertScore: number;
        signedDelta: number;
        absDelta: number;
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
        const conflictCount = pairedDeltas.filter((d) => d.isConflict).length;

        const scores = pairedDeltas.map((d) => d.aiScore).sort((a, b) => a - b);
        const mid = Math.floor(sampleSize / 2);
        const medianScore =
          sampleSize % 2 === 0
            ? Math.round(((scores[mid - 1] + scores[mid]) / 2) * 10) / 10
            : scores[mid];

        const meanScore =
          Math.round((pairedDeltas.reduce((sum, d) => sum + d.aiScore, 0) / sampleSize) * 10) / 10;
        const variance =
          pairedDeltas.reduce((sum, d) => sum + Math.pow(d.aiScore - meanScore, 2), 0) / sampleSize;
        const standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10;

        iterationMetrics.push({
          versionTag: ver.versionTag,
          versionLabel: ver.label,
          sampleSize,
          meanAbsoluteDelta,
          meanSignedDelta,
          aiMeanScore: meanScore,
          aiScoreStdDev: standardDeviation,
          expertMeanScore: Math.round((pairedDeltas.reduce((sum, d) => sum + d.expertScore, 0) / sampleSize) * 10) / 10,
          expertScoreStdDev: 0,
          minAbsoluteDelta: Math.min(...pairedDeltas.map((d) => d.absDelta)),
          maxAbsoluteDelta: Math.max(...pairedDeltas.map((d) => d.absDelta)),
          agreementRate: Math.round(((sampleSize - conflictCount) / sampleSize) * 1000) / 10,
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
          agreementRate: 0,
          conflictCount: 0,
        });
      }
    }

    const criterionProgression: CriterionDeltaSummary[] = Object.keys(criterionMap).map((name) => {
      const item = criterionMap[name];
      const getAvg = (tag: string) => {
        const deltas = item.deltasByVersion[tag];
        return deltas && deltas.length > 0 ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10 : undefined;
      };

      return {
        criterionName: name,
        maxPoints: item.maxPoints,
        v1MeanAbsoluteDelta: getAvg('V1'),
        v2MeanAbsoluteDelta: getAvg('V2'),
        v3MeanAbsoluteDelta: getAvg('V3'),
      };
    });

    const postV3Reviews = await prisma.finalEvaluationReview.findMany({
      where: { isDemo: isDemoFilter },
    });

    const n = postV3Reviews.length;
    let postV3Summary: PostV3Summary;

    if (n > 0) {
      const sumAgreement = postV3Reviews.reduce((sum, r) => sum + r.agreementRating, 0);
      const sumReasoning = postV3Reviews.reduce((sum, r) => sum + r.reasoningCorrectnessRating, 0);
      const sumGrounding = postV3Reviews.reduce((sum, r) => sum + r.statutoryGroundingRating, 0);
      const sumRecommended = postV3Reviews.reduce((sum, r) => sum + r.recommendedScore, 0);
      const sumScoreDelta = postV3Reviews.reduce((sum, r) => sum + r.scoreDelta, 0);

      const allTags = postV3Reviews.flatMap((r) => safeParseJson(r.errorTags, []));
      const errorTagCounts: Record<string, number> = {};
      allTags.forEach((t) => {
        errorTagCounts[t] = (errorTagCounts[t] || 0) + 1;
      });

      postV3Summary = {
        totalReviews: n,
        meanAgreementRating: Math.round((sumAgreement / n) * 10) / 10,
        meanReasoningCorrectness: Math.round((sumReasoning / n) * 10) / 10,
        meanStatutoryGrounding: Math.round((sumGrounding / n) * 10) / 10,
        meanRecommendedScore: Math.round((sumRecommended / n) * 10) / 10,
        meanScoreDelta: Math.round((sumScoreDelta / n) * 10) / 10,
        verdictCounts: {
          ACCEPTABLE: postV3Reviews.filter((r) => r.finalVerdict === 'ACCEPTABLE').length,
          ACCEPTABLE_WITH_MINOR_ISSUES: postV3Reviews.filter((r) => r.finalVerdict === 'ACCEPTABLE_WITH_MINOR_ISSUES').length,
          REQUIRES_IMPROVEMENT: postV3Reviews.filter((r) => r.finalVerdict === 'REQUIRES_IMPROVEMENT').length,
        },
        errorTagCounts,
      };
    } else {
      postV3Summary = {
        totalReviews: 0,
        meanAgreementRating: 0,
        meanReasoningCorrectness: 0,
        meanStatutoryGrounding: 0,
        meanRecommendedScore: 0,
        meanScoreDelta: 0,
        verdictCounts: {
          ACCEPTABLE: 0,
          ACCEPTABLE_WITH_MINOR_ISSUES: 0,
          REQUIRES_IMPROVEMENT: 0,
        },
        errorTagCounts: {},
      };
    }

    return {
      isDemo: isDemoFilter,
      generatedAt: new Date(),
      iterations: iterationMetrics,
      criterionProgression,
      postV3Summary,
      methodologyNotes: [
        'Sample size (n) is determined by participating cohort submissions.',
        'Evaluations were computed under double-blind isolation.',
      ],
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
