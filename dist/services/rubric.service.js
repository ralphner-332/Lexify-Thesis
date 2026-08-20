"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RubricService = void 0;
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("./audit.service");
class RubricService {
    static async listRubrics() {
        return prisma_1.prisma.rubric.findMany({
            include: {
                criteria: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async getRubricById(id) {
        const rubric = await prisma_1.prisma.rubric.findUnique({
            where: { id },
            include: {
                criteria: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!rubric) {
            throw new Error('Rubric not found');
        }
        return rubric;
    }
    static async getDefaultRubric() {
        let rubric = await prisma_1.prisma.rubric.findFirst({
            where: { isDefault: true },
            include: {
                criteria: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!rubric) {
            rubric = await prisma_1.prisma.rubric.findFirst({
                include: {
                    criteria: {
                        orderBy: { orderIndex: 'asc' },
                    },
                },
            });
        }
        return rubric;
    }
    static async createRubric(input, user) {
        if (!input.criteria || input.criteria.length === 0) {
            throw new Error('Rubric must contain at least one criterion');
        }
        // Validate weights sum to 100% (allow tolerance of 0.01 for rounding)
        const totalWeight = input.criteria.reduce((sum, c) => sum + (c.weightPercent || 0), 0);
        if (Math.abs(totalWeight - 100) > 0.1) {
            throw new Error(`Total criteria weight must equal 100%. Current sum: ${totalWeight}%`);
        }
        // If marked as default, unset other defaults
        if (input.isDefault) {
            await prisma_1.prisma.rubric.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }
        const created = await prisma_1.prisma.rubric.create({
            data: {
                name: input.name.trim(),
                description: input.description.trim(),
                isDefault: input.isDefault ?? false,
                isDemo: input.isDemo ?? true,
                criteria: {
                    create: input.criteria.map((c, idx) => ({
                        name: c.name.trim(),
                        description: c.description.trim(),
                        weightPercent: c.weightPercent,
                        maxPoints: c.maxPoints ?? c.weightPercent,
                        orderIndex: c.orderIndex ?? idx + 1,
                    })),
                },
            },
            include: {
                criteria: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'CREATE_RUBRIC',
            entityType: 'RUBRIC',
            entityId: created.id,
            details: { name: created.name, criteriaCount: created.criteria.length },
            isDemo: created.isDemo,
        });
        return created;
    }
    static async updateRubric(id, input, user) {
        const existing = await prisma_1.prisma.rubric.findUnique({
            where: { id },
            include: { criteria: true },
        });
        if (!existing) {
            throw new Error('Rubric not found');
        }
        if (input.criteria) {
            const totalWeight = input.criteria.reduce((sum, c) => sum + (c.weightPercent || 0), 0);
            if (Math.abs(totalWeight - 100) > 0.1) {
                throw new Error(`Total criteria weight must equal 100%. Current sum: ${totalWeight}%`);
            }
        }
        if (input.isDefault) {
            await prisma_1.prisma.rubric.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }
        // Update basic fields
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            const rubric = await tx.rubric.update({
                where: { id },
                data: {
                    name: input.name !== undefined ? input.name.trim() : undefined,
                    description: input.description !== undefined ? input.description.trim() : undefined,
                    isDefault: input.isDefault !== undefined ? input.isDefault : undefined,
                    isDemo: input.isDemo !== undefined ? input.isDemo : undefined,
                },
            });
            if (input.criteria) {
                // Replace criteria
                await tx.rubricCriterion.deleteMany({ where: { rubricId: id } });
                await tx.rubricCriterion.createMany({
                    data: input.criteria.map((c, idx) => ({
                        rubricId: id,
                        name: c.name.trim(),
                        description: c.description.trim(),
                        weightPercent: c.weightPercent,
                        maxPoints: c.maxPoints ?? c.weightPercent,
                        orderIndex: c.orderIndex ?? idx + 1,
                    })),
                });
            }
            return tx.rubric.findUnique({
                where: { id },
                include: { criteria: { orderBy: { orderIndex: 'asc' } } },
            });
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'UPDATE_RUBRIC',
            entityType: 'RUBRIC',
            entityId: id,
            details: { name: updated?.name, isDefault: updated?.isDefault },
            isDemo: updated?.isDemo,
        });
        return updated;
    }
    static async deleteRubric(id, user) {
        const existing = await prisma_1.prisma.rubric.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Rubric not found');
        }
        await prisma_1.prisma.rubric.delete({ where: { id } });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'DELETE_RUBRIC',
            entityType: 'RUBRIC',
            entityId: id,
            details: { name: existing.name },
            isDemo: existing.isDemo,
        });
        return { success: true, message: `Rubric "${existing.name}" deleted successfully` };
    }
}
exports.RubricService = RubricService;
