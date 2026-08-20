"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalEvaluationDTO = void 0;
class FinalEvaluationDTO {
    static toQueueItem(evaluation, anonymizedIndex, existingReview) {
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
    static toDetailDTO(evaluation, anonymizedIndex, existingReview) {
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
    static toRecordDTO(record, anonymizedIndex) {
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
exports.FinalEvaluationDTO = FinalEvaluationDTO;
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
