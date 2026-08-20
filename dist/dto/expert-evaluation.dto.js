"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpertEvaluationDTO = void 0;
class ExpertEvaluationDTO {
    /**
     * Serializes a single expert queue item with anonymized student tag.
     */
    static toQueueItem(session, question, anonymizedIndex, evalStatus, expertEvaluationId) {
        const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
        return {
            sessionId: session.id,
            questionId: question.id,
            studentAnonymizedCode: studentCode,
            questionCode: question.code,
            questionTitle: question.title,
            status: evalStatus,
            submittedAt: session.submittedAt,
            expertEvaluationId,
        };
    }
    /**
     * Formats submission detail for double-blind expert grading.
     * Strictly EXCLUDES AI scores, AI reasoning, and other expert scores.
     */
    static toSubmissionDetail(session, questionSnapshot, studentAnswer, rubricCriteria, anonymizedIndex, draft, isSubmitted = false) {
        const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
        let parsedDraft = null;
        if (draft) {
            parsedDraft = {
                numericalScore: draft.numericalScore || 0,
                scoringBasis: draft.scoringBasis || '',
                criterionScores: safeParseJson(draft.criterionScores, []),
                qualitativeComments: draft.qualitativeComments || '',
            };
        }
        return {
            sessionId: session.id,
            questionId: questionSnapshot.id,
            studentAnonymizedCode: studentCode,
            studentAnswer,
            question: {
                code: questionSnapshot.code,
                title: questionSnapshot.title,
                scenario: questionSnapshot.scenario,
                modelAnswer: questionSnapshot.modelAnswer,
                statutoryElements: safeParseJson(questionSnapshot.statutoryElements, []),
                relevantProvisions: safeParseJson(questionSnapshot.relevantProvisions, []),
                conceptVariations: safeParseJson(questionSnapshot.conceptVariations, []),
            },
            rubricCriteria: rubricCriteria.map((c) => ({
                name: c.name,
                description: c.description,
                weightPercent: c.weightPercent,
                maxPoints: c.maxPoints ?? c.weightPercent ?? 20,
            })),
            draft: parsedDraft,
            isSubmitted,
        };
    }
    /**
     * Formats completed expert evaluation record.
     */
    static toRecordDTO(record, anonymizedIndex) {
        const studentCode = `Student-${String(anonymizedIndex).padStart(2, '0')}`;
        return {
            id: record.id,
            expertId: record.expertId,
            sessionId: record.sessionId,
            questionId: record.questionId,
            studentAnonymizedCode: studentCode,
            numericalScore: record.numericalScore,
            maxScore: record.maxScore,
            scoringBasis: record.scoringBasis,
            criterionScores: safeParseJson(record.criterionScores, []),
            qualitativeComments: record.qualitativeComments,
            createdAt: record.createdAt,
        };
    }
}
exports.ExpertEvaluationDTO = ExpertEvaluationDTO;
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
