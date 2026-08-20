"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyService = void 0;
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("./audit.service");
const survey_dto_1 = require("../dto/survey.dto");
class SurveyService {
    /**
     * Retrieves active survey questionnaire for a role (STUDENT or EXPERT).
     */
    static async getActiveQuestionnaire(targetRole, isDemo) {
        const where = {
            targetRole,
            isActive: true,
        };
        if (isDemo !== undefined)
            where.isDemo = isDemo;
        const questionnaire = await prisma_1.prisma.surveyQuestionnaire.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!questionnaire) {
            throw new Error(`No active ${targetRole.toLowerCase()} survey questionnaire found.`);
        }
        return survey_dto_1.SurveyDTO.toQuestionnaireDTO(questionnaire);
    }
    /**
     * Submits a completed survey questionnaire response.
     * Preserves exact question snapshot at response time.
     */
    static async submitSurveyResponse(respondentId, respondentRole, questionnaireId, answers, qualitativeNotes, isDemo) {
        const questionnaire = await prisma_1.prisma.surveyQuestionnaire.findUnique({
            where: { id: questionnaireId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!questionnaire) {
            throw new Error('Survey questionnaire not found.');
        }
        const created = await prisma_1.prisma.surveyResponse.create({
            data: {
                questionnaireId,
                respondentId,
                respondentRole,
                questionnaireSnapshot: JSON.stringify(questionnaire.questions),
                answers: JSON.stringify(answers),
                qualitativeNotes: qualitativeNotes || '',
                isDemo: isDemo !== undefined ? isDemo : questionnaire.isDemo,
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: respondentId,
            action: 'SUBMIT_SURVEY_RESPONSE',
            entityType: 'SURVEY_RESPONSE',
            entityId: created.id,
            details: {
                questionnaireId,
                respondentRole,
                isDemo: created.isDemo,
            },
            isDemo: created.isDemo,
        });
        return {
            success: true,
            message: 'Survey feedback submitted successfully and recorded as research evidence.',
            response: survey_dto_1.SurveyDTO.toResponseDTO(created),
        };
    }
    /**
     * Lists survey responses for researcher analysis.
     * Server default: isDemo = false
     */
    static async getSurveyResponses(filter) {
        const where = {
            isDemo: filter?.isDemo !== undefined ? filter.isDemo : false,
        };
        if (filter?.questionnaireId)
            where.questionnaireId = filter.questionnaireId;
        if (filter?.respondentRole)
            where.respondentRole = filter.respondentRole;
        const responses = await prisma_1.prisma.surveyResponse.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                respondent: true,
                questionnaire: true,
            },
        });
        return responses.map((r) => survey_dto_1.SurveyDTO.toResponseDTO(r));
    }
    /**
     * Computes descriptive summary metrics (mean Likert scores, counts) for a questionnaire.
     * Server default: isDemo = false
     */
    static async getSurveySummaryMetrics(questionnaireId, isDemo) {
        const isDemoFilter = isDemo !== undefined ? isDemo : false;
        const questionnaire = await prisma_1.prisma.surveyQuestionnaire.findUnique({
            where: { id: questionnaireId },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!questionnaire) {
            throw new Error('Questionnaire not found');
        }
        const responses = await prisma_1.prisma.surveyResponse.findMany({
            where: {
                questionnaireId,
                isDemo: isDemoFilter,
            },
        });
        const totalResponses = responses.length;
        const openFeedbackNotes = [];
        // Analyze each question
        const questionAverages = questionnaire.questions.map((q) => {
            let sumScore = 0;
            let ratedCount = 0;
            const responseCounts = {};
            responses.forEach((res) => {
                const answers = safeParseJson(res.answers, {});
                const answerVal = answers[q.id] ?? answers[q.code];
                if (answerVal !== undefined && answerVal !== null && answerVal !== '') {
                    const valStr = String(answerVal);
                    responseCounts[valStr] = (responseCounts[valStr] || 0) + 1;
                    if (q.questionType === 'LIKERT_5') {
                        const numVal = typeof answerVal === 'number' ? answerVal : parseInt(valStr.charAt(0), 10);
                        if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
                            sumScore += numVal;
                            ratedCount++;
                        }
                    }
                    else if (q.questionType === 'OPEN_TEXT' && valStr.trim().length > 0) {
                        openFeedbackNotes.push(valStr.trim());
                    }
                }
            });
            const meanScore = ratedCount > 0 ? Math.round((sumScore / ratedCount) * 100) / 100 : undefined;
            return {
                questionCode: q.code,
                prompt: q.prompt,
                questionType: q.questionType,
                meanScore,
                responseCounts,
            };
        });
        // Also collect general qualitative notes from response records
        responses.forEach((res) => {
            if (res.qualitativeNotes && res.qualitativeNotes.trim().length > 0) {
                openFeedbackNotes.push(res.qualitativeNotes.trim());
            }
        });
        return {
            questionnaireId: questionnaire.id,
            title: questionnaire.title,
            targetRole: questionnaire.targetRole,
            version: questionnaire.version,
            totalResponses,
            questionAverages,
            openFeedbackNotes,
        };
    }
    /**
     * Admin: Lists all questionnaires.
     */
    static async listQuestionnaires(isDemo) {
        const where = {};
        if (isDemo !== undefined)
            where.isDemo = isDemo;
        const questionnaires = await prisma_1.prisma.surveyQuestionnaire.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            include: {
                questions: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        return questionnaires.map((q) => survey_dto_1.SurveyDTO.toQuestionnaireDTO(q));
    }
}
exports.SurveyService = SurveyService;
function safeParseJson(str, fallback = {}) {
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
