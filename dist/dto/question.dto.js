"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionDTO = void 0;
class QuestionDTO {
    /**
     * Strictly sanitizes Question for student consumption.
     * Model answer, grading elements, statutory keys, and variations are completely stripped.
     */
    static toStudentDTO(q) {
        return {
            id: q.id,
            code: q.code,
            title: q.title,
            scenario: q.scenario,
            orderIndex: q.orderIndex,
            isActive: q.isActive,
        };
    }
    /**
     * Serializes Question for expert evaluation.
     * Provides reference answer and statutory provisions for independent evaluation,
     * but omits AI evaluations and admin audit metadata.
     */
    static toExpertDTO(q) {
        return {
            id: q.id,
            code: q.code,
            title: q.title,
            scenario: q.scenario,
            modelAnswer: q.modelAnswer,
            statutoryElements: safeParseJsonArray(q.statutoryElements),
            relevantProvisions: safeParseJsonArray(q.relevantProvisions),
            conceptVariations: safeParseJsonArray(q.conceptVariations),
            orderIndex: q.orderIndex,
            isActive: q.isActive,
        };
    }
    /**
     * Serializes full question for researcher administration.
     */
    static toAdminDTO(q) {
        return {
            id: q.id,
            code: q.code,
            title: q.title,
            scenario: q.scenario,
            modelAnswer: q.modelAnswer,
            statutoryElements: safeParseJsonArray(q.statutoryElements),
            relevantProvisions: safeParseJsonArray(q.relevantProvisions),
            conceptVariations: safeParseJsonArray(q.conceptVariations),
            orderIndex: q.orderIndex,
            isActive: q.isActive,
            isDemo: q.isDemo,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
        };
    }
    /**
     * Applies role-specific serialization based on user role string.
     */
    static serializeByRole(q, role) {
        if (role === 'ADMIN') {
            return this.toAdminDTO(q);
        }
        if (role === 'EXPERT') {
            return this.toExpertDTO(q);
        }
        // Default fallback is student-safe
        return this.toStudentDTO(q);
    }
}
exports.QuestionDTO = QuestionDTO;
function safeParseJsonArray(val) {
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
