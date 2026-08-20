"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionService = void 0;
const prisma_1 = require("../lib/prisma");
const question_dto_1 = require("../dto/question.dto");
const audit_service_1 = require("./audit.service");
class QuestionService {
    static async listQuestions(role, includeInactive = false) {
        const where = {};
        if (!includeInactive && role === 'STUDENT') {
            where.isActive = true;
        }
        const questions = await prisma_1.prisma.question.findMany({
            where,
            orderBy: { orderIndex: 'asc' },
        });
        return questions.map((q) => question_dto_1.QuestionDTO.serializeByRole(q, role));
    }
    static async getQuestionById(id, role) {
        const question = await prisma_1.prisma.question.findUnique({
            where: { id },
        });
        if (!question) {
            throw new Error('Question not found');
        }
        return question_dto_1.QuestionDTO.serializeByRole(question, role);
    }
    static async createQuestion(input, user) {
        const existing = await prisma_1.prisma.question.findUnique({
            where: { code: input.code },
        });
        if (existing) {
            throw new Error(`Question with code ${input.code} already exists`);
        }
        const created = await prisma_1.prisma.question.create({
            data: {
                code: input.code.trim().toUpperCase(),
                title: input.title.trim(),
                scenario: input.scenario.trim(),
                modelAnswer: input.modelAnswer.trim(),
                statutoryElements: JSON.stringify(input.statutoryElements || []),
                relevantProvisions: JSON.stringify(input.relevantProvisions || []),
                conceptVariations: JSON.stringify(input.conceptVariations || []),
                orderIndex: input.orderIndex ?? 0,
                isActive: input.isActive ?? true,
                isDemo: input.isDemo ?? true,
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'CREATE_QUESTION',
            entityType: 'QUESTION',
            entityId: created.id,
            details: { code: created.code, title: created.title },
            isDemo: created.isDemo,
        });
        return question_dto_1.QuestionDTO.toAdminDTO(created);
    }
    static async updateQuestion(id, input, user) {
        const existing = await prisma_1.prisma.question.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Question not found');
        }
        const data = {};
        if (input.code !== undefined)
            data.code = input.code.trim().toUpperCase();
        if (input.title !== undefined)
            data.title = input.title.trim();
        if (input.scenario !== undefined)
            data.scenario = input.scenario.trim();
        if (input.modelAnswer !== undefined)
            data.modelAnswer = input.modelAnswer.trim();
        if (input.statutoryElements !== undefined)
            data.statutoryElements = JSON.stringify(input.statutoryElements);
        if (input.relevantProvisions !== undefined)
            data.relevantProvisions = JSON.stringify(input.relevantProvisions);
        if (input.conceptVariations !== undefined)
            data.conceptVariations = JSON.stringify(input.conceptVariations);
        if (input.orderIndex !== undefined)
            data.orderIndex = input.orderIndex;
        if (input.isActive !== undefined)
            data.isActive = input.isActive;
        if (input.isDemo !== undefined)
            data.isDemo = input.isDemo;
        const updated = await prisma_1.prisma.question.update({
            where: { id },
            data,
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'UPDATE_QUESTION',
            entityType: 'QUESTION',
            entityId: updated.id,
            details: { code: updated.code, changes: Object.keys(data) },
            isDemo: updated.isDemo,
        });
        return question_dto_1.QuestionDTO.toAdminDTO(updated);
    }
    static async deleteQuestion(id, user) {
        const existing = await prisma_1.prisma.question.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Question not found');
        }
        await prisma_1.prisma.question.delete({ where: { id } });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'DELETE_QUESTION',
            entityType: 'QUESTION',
            entityId: id,
            details: { code: existing.code, title: existing.title },
            isDemo: existing.isDemo,
        });
        return { success: true, message: `Question ${existing.code} deleted successfully` };
    }
}
exports.QuestionService = QuestionService;
