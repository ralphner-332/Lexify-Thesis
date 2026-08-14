import { prisma } from '../lib/prisma';
import { QuestionDTO } from '../dto/question.dto';
import { AuditService } from './audit.service';

export interface CreateQuestionInput {
  code: string;
  title: string;
  scenario: string;
  modelAnswer: string;
  statutoryElements: string[];
  relevantProvisions: string[];
  conceptVariations: string[];
  orderIndex?: number;
  isActive?: boolean;
  isDemo?: boolean;
}

export class QuestionService {
  static async listQuestions(role?: string, includeInactive: boolean = false) {
    const where: any = {};
    if (!includeInactive && role === 'STUDENT') {
      where.isActive = true;
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });

    return questions.map((q) => QuestionDTO.serializeByRole(q, role));
  }

  static async getQuestionById(id: string, role?: string) {
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return QuestionDTO.serializeByRole(question, role);
  }

  static async createQuestion(input: CreateQuestionInput, user?: { id: string; email: string }) {
    const existing = await prisma.question.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new Error(`Question with code ${input.code} already exists`);
    }

    const created = await prisma.question.create({
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

    await AuditService.logAction({
      userId: user?.id,
      userEmail: user?.email,
      action: 'CREATE_QUESTION',
      entityType: 'QUESTION',
      entityId: created.id,
      details: { code: created.code, title: created.title },
      isDemo: created.isDemo,
    });

    return QuestionDTO.toAdminDTO(created);
  }

  static async updateQuestion(
    id: string,
    input: Partial<CreateQuestionInput>,
    user?: { id: string; email: string }
  ) {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Question not found');
    }

    const data: any = {};
    if (input.code !== undefined) data.code = input.code.trim().toUpperCase();
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.scenario !== undefined) data.scenario = input.scenario.trim();
    if (input.modelAnswer !== undefined) data.modelAnswer = input.modelAnswer.trim();
    if (input.statutoryElements !== undefined)
      data.statutoryElements = JSON.stringify(input.statutoryElements);
    if (input.relevantProvisions !== undefined)
      data.relevantProvisions = JSON.stringify(input.relevantProvisions);
    if (input.conceptVariations !== undefined)
      data.conceptVariations = JSON.stringify(input.conceptVariations);
    if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.isDemo !== undefined) data.isDemo = input.isDemo;

    const updated = await prisma.question.update({
      where: { id },
      data,
    });

    await AuditService.logAction({
      userId: user?.id,
      userEmail: user?.email,
      action: 'UPDATE_QUESTION',
      entityType: 'QUESTION',
      entityId: updated.id,
      details: { code: updated.code, changes: Object.keys(data) },
      isDemo: updated.isDemo,
    });

    return QuestionDTO.toAdminDTO(updated);
  }

  static async deleteQuestion(id: string, user?: { id: string; email: string }) {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Question not found');
    }

    await prisma.question.delete({ where: { id } });

    await AuditService.logAction({
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
