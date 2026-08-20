"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyDTO = void 0;
class SurveyDTO {
    static toQuestionDTO(q) {
        return {
            id: q.id,
            code: q.code,
            prompt: q.prompt,
            questionType: q.questionType,
            options: safeParseJson(q.options, []),
            orderIndex: q.orderIndex,
            isRequired: q.isRequired,
        };
    }
    static toQuestionnaireDTO(qnr) {
        return {
            id: qnr.id,
            title: qnr.title,
            description: qnr.description,
            targetRole: qnr.targetRole,
            version: qnr.version,
            isActive: qnr.isActive,
            isDemo: qnr.isDemo,
            questions: (qnr.questions || []).map(this.toQuestionDTO),
            createdAt: qnr.createdAt,
        };
    }
    static toResponseDTO(res) {
        return {
            id: res.id,
            questionnaireId: res.questionnaireId,
            respondentId: res.respondentId,
            respondentRole: res.respondentRole,
            answers: safeParseJson(res.answers, {}),
            qualitativeNotes: res.qualitativeNotes,
            isDemo: res.isDemo,
            createdAt: res.createdAt,
        };
    }
}
exports.SurveyDTO = SurveyDTO;
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
