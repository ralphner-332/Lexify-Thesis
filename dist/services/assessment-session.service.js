"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentSessionService = void 0;
const prisma_1 = require("../lib/prisma");
const session_dto_1 = require("../dto/session.dto");
const audit_service_1 = require("./audit.service");
const evaluation_service_1 = require("./evaluation.service");
class AssessmentSessionService {
    /**
     * Retrieves active session or latest submitted session.
     * If neither exists, initializes a new session capturing the full questionsSnapshot.
     */
    static async getOrCreateActiveSession(studentId, isDemo = true) {
        let session = await prisma_1.prisma.assessmentSession.findFirst({
            where: {
                studentId,
                status: 'IN_PROGRESS',
            },
            include: {
                drafts: true,
            },
        });
        if (!session) {
            // Check if student already has a submitted assessment session
            const latestSubmitted = await prisma_1.prisma.assessmentSession.findFirst({
                where: {
                    studentId,
                    status: 'SUBMITTED',
                },
                orderBy: { submittedAt: 'desc' },
                include: {
                    drafts: true,
                },
            });
            if (latestSubmitted) {
                const draftsMap = {};
                for (const d of latestSubmitted.drafts) {
                    draftsMap[d.questionId] = d.answerText;
                }
                return session_dto_1.SessionDTO.toStudentDTO(latestSubmitted, draftsMap);
            }
            // Capture full questions snapshot from currently active questions
            const activeQuestions = await prisma_1.prisma.question.findMany({
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
            });
            if (activeQuestions.length === 0) {
                throw new Error('No active Criminal Law I questions available for assessment.');
            }
            const fullQuestionsSnapshot = activeQuestions.map((q) => ({
                id: q.id,
                code: q.code,
                title: q.title,
                scenario: q.scenario,
                modelAnswer: q.modelAnswer,
                statutoryElements: safeParseJson(q.statutoryElements, []),
                relevantProvisions: safeParseJson(q.relevantProvisions, []),
                conceptVariations: safeParseJson(q.conceptVariations, []),
                orderIndex: q.orderIndex,
            }));
            session = await prisma_1.prisma.assessmentSession.create({
                data: {
                    studentId,
                    status: 'IN_PROGRESS',
                    questionsSnapshot: JSON.stringify(fullQuestionsSnapshot),
                    isDemo,
                },
                include: {
                    drafts: true,
                },
            });
            await audit_service_1.AuditService.logAction({
                userId: studentId,
                action: 'START_ASSESSMENT_SESSION',
                entityType: 'ASSESSMENT_SESSION',
                entityId: session.id,
                details: { questionCount: fullQuestionsSnapshot.length, isDemo },
                isDemo,
            });
        }
        const draftsMap = {};
        for (const d of session.drafts) {
            draftsMap[d.questionId] = d.answerText;
        }
        return session_dto_1.SessionDTO.toStudentDTO(session, draftsMap);
    }
    /**
     * Retrieves a specific session by ID with security checks.
     */
    static async getSessionById(sessionId, studentId) {
        const session = await prisma_1.prisma.assessmentSession.findUnique({
            where: { id: sessionId },
            include: { drafts: true },
        });
        if (!session) {
            throw new Error('Assessment session not found');
        }
        if (session.studentId !== studentId) {
            throw new Error('Unauthorized: Session does not belong to the requesting student');
        }
        const draftsMap = {};
        for (const d of session.drafts) {
            draftsMap[d.questionId] = d.answerText;
        }
        return session_dto_1.SessionDTO.toStudentDTO(session, draftsMap);
    }
    /**
     * Saves a draft answer. Rejected if session is already SUBMITTED.
     */
    static async saveAnswerDraft(sessionId, studentId, questionId, answerText) {
        const session = await prisma_1.prisma.assessmentSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            throw new Error('Assessment session not found');
        }
        if (session.studentId !== studentId) {
            throw new Error('Unauthorized: Session does not belong to the requesting student');
        }
        if (session.status === 'SUBMITTED') {
            throw new Error('Cannot modify draft: Assessment session is already submitted and locked as research evidence.');
        }
        const draft = await prisma_1.prisma.studentAnswerDraft.upsert({
            where: {
                sessionId_questionId: {
                    sessionId,
                    questionId,
                },
            },
            update: {
                answerText,
            },
            create: {
                sessionId,
                questionId,
                answerText,
            },
        });
        return {
            success: true,
            questionId: draft.questionId,
            answerText: draft.answerText,
            updatedAt: draft.updatedAt,
        };
    }
    /**
     * Returns review checklist verifying answering status for all questions in the snapshot.
     */
    static async getSessionReview(sessionId, studentId) {
        const session = await prisma_1.prisma.assessmentSession.findUnique({
            where: { id: sessionId },
            include: { drafts: true },
        });
        if (!session) {
            throw new Error('Assessment session not found');
        }
        if (session.studentId !== studentId) {
            throw new Error('Unauthorized');
        }
        const draftsMap = {};
        for (const d of session.drafts) {
            draftsMap[d.questionId] = d.answerText;
        }
        const sanitizedSession = session_dto_1.SessionDTO.toStudentDTO(session, draftsMap);
        const unansweredCount = sanitizedSession.questions.filter((q) => !q.isAnswered).length;
        const allAnswered = unansweredCount === 0;
        return {
            session: sanitizedSession,
            totalQuestions: sanitizedSession.questions.length,
            answeredCount: sanitizedSession.questions.length - unansweredCount,
            unansweredCount,
            allAnswered,
        };
    }
    /**
     * Finalizes submission, locks session immutably, and triggers grounded AI evaluation.
     */
    static async submitSession(sessionId, studentId) {
        const session = await prisma_1.prisma.assessmentSession.findUnique({
            where: { id: sessionId },
            include: { drafts: true },
        });
        if (!session) {
            throw new Error('Assessment session not found');
        }
        if (session.studentId !== studentId) {
            throw new Error('Unauthorized');
        }
        if (session.status === 'SUBMITTED') {
            throw new Error('Assessment session has already been submitted.');
        }
        // Parse full questions snapshot to verify all questions have non-empty answers
        const fullQuestions = safeParseJson(session.questionsSnapshot, []);
        const draftsMap = {};
        for (const d of session.drafts) {
            draftsMap[d.questionId] = d.answerText;
        }
        const missingQuestions = fullQuestions.filter((q) => !draftsMap[q.id] || draftsMap[q.id].trim().length === 0);
        if (missingQuestions.length > 0) {
            const missingCodes = missingQuestions.map((q) => q.code).join(', ');
            throw new Error(`All questions are mandatory before submission. Missing response for: ${missingCodes}`);
        }
        // Lock session as SUBMITTED
        const updatedSession = await prisma_1.prisma.assessmentSession.update({
            where: { id: sessionId },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
            },
            include: { drafts: true },
        });
        await audit_service_1.AuditService.logAction({
            userId: studentId,
            action: 'SUBMIT_ASSESSMENT_SESSION',
            entityType: 'ASSESSMENT_SESSION',
            entityId: sessionId,
            details: { questionCount: fullQuestions.length, submittedAt: updatedSession.submittedAt },
            isDemo: session.isDemo,
        });
        // Trigger AI evaluation pipeline using the session snapshot directly
        await evaluation_service_1.EvaluationService.evaluateSessionSubmissions(updatedSession);
        return {
            success: true,
            message: 'Assessment session submitted successfully. AI evaluation complete.',
            sessionId: updatedSession.id,
            submittedAt: updatedSession.submittedAt,
        };
    }
}
exports.AssessmentSessionService = AssessmentSessionService;
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
