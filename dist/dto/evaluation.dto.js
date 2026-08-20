"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationDTO = void 0;
class EvaluationDTO {
    /**
     * Strictly sanitizes Evaluation for student diagnostic feedback.
     * Strips model reference answers, statutory keys, system prompts, and internal review flags.
     */
    static toStudentDTO(evalRecord) {
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
    static toAdminDTO(evalRecord) {
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
exports.EvaluationDTO = EvaluationDTO;
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
