"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonDTO = void 0;
class ComparisonDTO {
    static toItemDTO(aiEval, expertEval, anonymizedIndex, thresholdPercent = 10) {
        const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
        const questionSnapshot = safeParseJson(aiEval.questionSnapshot, {});
        const aiCriteria = safeParseJson(aiEval.criterionScores, []);
        const expertCriteria = safeParseJson(expertEval.criterionScores, []);
        const scoreDelta = Math.round((expertEval.numericalScore - aiEval.numericalScore) * 10) / 10;
        const absoluteDelta = Math.round(Math.abs(expertEval.numericalScore - aiEval.numericalScore) * 10) / 10;
        const maxScore = aiEval.maxScore || 100;
        const percentageDelta = maxScore > 0 ? Math.round((absoluteDelta / maxScore) * 100) : 0;
        // Map criterion deltas
        const criterionDeltas = expertCriteria.map((ec) => {
            const matchingAi = aiCriteria.find((ac) => ac.criterionName?.toLowerCase() === ec.criterionName?.toLowerCase());
            const aiCritScore = matchingAi ? matchingAi.score : 0;
            const cDelta = Math.round((ec.score - aiCritScore) * 10) / 10;
            return {
                criterionName: ec.criterionName,
                aiScore: aiCritScore,
                expertScore: ec.score,
                delta: cDelta,
                maxPoints: ec.maxPoints || 20,
                reasoningAi: matchingAi ? matchingAi.reasoning || '' : '',
                reasoningExpert: ec.reasoning || '',
            };
        });
        // Detect automated conflict signals (review signals only)
        const conflictFlags = [];
        if (percentageDelta >= thresholdPercent) {
            conflictFlags.push(`HIGH_SCORE_DELTA (${percentageDelta}% divergence)`);
        }
        const highCriterionDivergence = criterionDeltas.some((cd) => Math.abs(cd.delta) >= (cd.maxPoints * 0.25));
        if (highCriterionDivergence) {
            conflictFlags.push('CRITERION_DIVERGENCE');
        }
        if (expertEval.qualitativeComments && expertEval.qualitativeComments.length > 50) {
            conflictFlags.push('EXPERT_QUALITATIVE_NOTE');
        }
        return {
            id: `${aiEval.id}_${expertEval.id}`,
            sessionId: aiEval.sessionId,
            questionId: aiEval.questionId,
            studentAnonymizedCode: studentCode,
            questionCode: questionSnapshot.code || 'Q',
            questionTitle: questionSnapshot.title || 'Question',
            agentVersionId: aiEval.agentVersionId,
            agentVersionTag: aiEval.agentVersion?.versionTag || 'V1',
            aiEvaluationId: aiEval.id,
            expertEvaluationId: expertEval.id,
            aiScore: aiEval.numericalScore,
            expertScore: expertEval.numericalScore,
            scoreDelta,
            absoluteDelta,
            maxScore,
            percentageDelta,
            aiScoringBasis: aiEval.scoringBasis,
            expertRationale: expertEval.scoringBasis,
            expertQualitativeComments: expertEval.qualitativeComments || '',
            aiStrengths: safeParseJson(aiEval.strengths, []),
            aiMissingElements: safeParseJson(aiEval.missingElements, []),
            aiImprovements: safeParseJson(aiEval.areasForImprovement, []),
            criterionDeltas,
            conflictFlags,
            isDemo: aiEval.isDemo,
            createdAt: expertEval.createdAt,
        };
    }
}
exports.ComparisonDTO = ComparisonDTO;
function safeParseJson(str, fallback) {
    if (!str)
        return fallback;
    if (typeof str === 'object')
        return str;
    try {
        return JSON.parse(str);
    }
    catch {
        return fallback;
    }
}
