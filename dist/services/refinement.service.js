"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefinementService = void 0;
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("./audit.service");
const refinement_dto_1 = require("../dto/refinement.dto");
class RefinementService {
    /**
     * Creates a structured refinement log entry linked to AI and expert comparison evidence.
     */
    static async createRefinementLog(data) {
        let gapId = data.gapId;
        if (!gapId) {
            const count = await prisma_1.prisma.refinementLog.count();
            gapId = `GAP-${String(count + 1).padStart(3, '0')}`;
        }
        const log = await prisma_1.prisma.refinementLog.create({
            data: {
                gapId,
                questionId: data.questionId,
                sessionId: data.sessionId,
                aiEvaluationId: data.aiEvaluationId,
                expertEvaluationId: data.expertEvaluationId,
                agentVersionId: data.agentVersionId,
                targetComponent: data.targetComponent,
                gapCategory: data.gapCategory,
                discrepancyDescription: data.discrepancyDescription,
                aiPosition: data.aiPosition || '',
                expertPosition: data.expertPosition || '',
                expertRationale: data.expertRationale || '',
                rootCauseAnalysis: data.rootCauseAnalysis || '',
                proposedRefinement: data.proposedRefinement,
                status: data.status || 'DRAFT',
                approvedDecision: data.approvedDecision || '',
                researcherNotes: data.researcherNotes || '',
                isDemo: data.isDemo ?? true,
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: data.userId,
            action: 'CREATE_REFINEMENT_LOG',
            entityType: 'REFINEMENT_LOG',
            entityId: log.id,
            details: {
                gapId: log.gapId,
                agentVersionId: log.agentVersionId,
                targetComponent: log.targetComponent,
                gapCategory: log.gapCategory,
            },
            isDemo: log.isDemo,
        });
        return refinement_dto_1.RefinementDTO.toDTO(log);
    }
    /**
     * Retrieves refinement logs with optional filters.
     */
    static async getRefinementLogs(filter) {
        const where = {};
        if (filter?.agentVersionId)
            where.agentVersionId = filter.agentVersionId;
        if (filter?.targetComponent)
            where.targetComponent = filter.targetComponent;
        if (filter?.gapCategory)
            where.gapCategory = filter.gapCategory;
        if (filter?.status)
            where.status = filter.status;
        if (filter?.isDemo !== undefined)
            where.isDemo = filter.isDemo;
        const logs = await prisma_1.prisma.refinementLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return logs.map((l) => refinement_dto_1.RefinementDTO.toDTO(l));
    }
    /**
     * Updates refinement log approval status and researcher notes.
     */
    static async updateRefinementStatus(id, data) {
        const updated = await prisma_1.prisma.refinementLog.update({
            where: { id },
            data: {
                status: data.status,
                approvedDecision: data.approvedDecision,
                researcherNotes: data.researcherNotes,
                resultingAgentVersionId: data.resultingAgentVersionId,
                proposedRefinement: data.proposedRefinement,
                rootCauseAnalysis: data.rootCauseAnalysis,
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: data.userId,
            action: 'UPDATE_REFINEMENT_STATUS',
            entityType: 'REFINEMENT_LOG',
            entityId: updated.id,
            details: {
                gapId: updated.gapId,
                status: updated.status,
                approvedDecision: updated.approvedDecision,
                resultingAgentVersionId: updated.resultingAgentVersionId,
            },
            isDemo: updated.isDemo,
        });
        return refinement_dto_1.RefinementDTO.toDTO(updated);
    }
}
exports.RefinementService = RefinementService;
