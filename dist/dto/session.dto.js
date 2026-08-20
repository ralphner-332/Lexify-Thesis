"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionDTO = void 0;
class SessionDTO {
    /**
     * Strictly sanitizes AssessmentSession and full questionsSnapshot for student response.
     * Model answer, statutory elements, provisions, variations, and keys are completely stripped on the server side.
     */
    static toStudentDTO(session, draftsMap) {
        let fullQuestions = [];
        try {
            fullQuestions = JSON.parse(session.questionsSnapshot || '[]');
        }
        catch {
            fullQuestions = [];
        }
        const sanitizedQuestions = fullQuestions.map((q) => {
            const draft = draftsMap[q.id] || '';
            return {
                id: q.id,
                code: q.code,
                title: q.title,
                scenario: q.scenario,
                orderIndex: q.orderIndex,
                draftAnswer: draft,
                isAnswered: draft.trim().length > 0,
            };
        });
        return {
            id: session.id,
            studentId: session.studentId,
            status: session.status,
            startedAt: session.startedAt,
            submittedAt: session.submittedAt,
            questions: sanitizedQuestions,
        };
    }
}
exports.SessionDTO = SessionDTO;
