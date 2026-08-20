export interface IterationMetricSummary {
  versionTag: string;
  versionLabel: string;
  sampleSize: number; // n
  meanAbsoluteDelta: number; // Mean(|AI - Expert|)
  meanSignedDelta: number; // Mean(AI - Expert)
  aiMeanScore: number;
  aiScoreStdDev: number;
  expertMeanScore: number;
  expertScoreStdDev: number;
  minAbsoluteDelta: number;
  maxAbsoluteDelta: number;
  agreementRate: number; // % within conflict threshold
  conflictCount: number;
}

export interface CriterionDeltaSummary {
  criterionName: string;
  maxPoints: number;
  v1MeanAbsoluteDelta?: number;
  v2MeanAbsoluteDelta?: number;
  v3MeanAbsoluteDelta?: number;
}

export interface PostV3Summary {
  totalReviews: number; // n
  meanAgreementRating: number;
  meanReasoningCorrectness: number;
  meanStatutoryGrounding: number;
  meanRecommendedScore: number;
  meanScoreDelta: number;
  verdictCounts: {
    ACCEPTABLE: number;
    ACCEPTABLE_WITH_MINOR_ISSUES: number;
    REQUIRES_IMPROVEMENT: number;
    [key: string]: number;
  };
  errorTagCounts: Record<string, number>;
}

export interface ProgressionAnalyticsDTO {
  isDemo: boolean;
  generatedAt: Date;
  iterations: IterationMetricSummary[];
  criterionProgression: CriterionDeltaSummary[];
  postV3Summary: PostV3Summary;
  methodologyNotes: string[];
}
