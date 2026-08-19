import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';
import { RefinementDTO } from '../dto/refinement.dto';

export class RefinementService {
  /**
   * Creates a structured refinement log entry linked to AI and expert comparison evidence.
   */
  static async createRefinementLog(data: {
    gapId?: string;
    questionId?: string;
    sessionId?: string;
    aiEvaluationId?: string;
    expertEvaluationId?: string;
    agentVersionId: string;
    targetComponent: string;
    gapCategory: string;
    discrepancyDescription: string;
    aiPosition?: string;
    expertPosition?: string;
    expertRationale?: string;
    rootCauseAnalysis?: string;
    proposedRefinement: string;
    status?: string;
    approvedDecision?: string;
    researcherNotes?: string;
    isDemo?: boolean;
    userId?: string;
  }) {
    let gapId = data.gapId;
    if (!gapId) {
      const count = await prisma.refinementLog.count();
      gapId = `GAP-${String(count + 1).padStart(3, '0')}`;
    }

    const log = await prisma.refinementLog.create({
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

    await AuditService.logAction({
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

    return RefinementDTO.toDTO(log);
  }

  /**
   * Retrieves refinement logs with optional filters.
   */
  static async getRefinementLogs(filter?: {
    agentVersionId?: string;
    targetComponent?: string;
    gapCategory?: string;
    status?: string;
    isDemo?: boolean;
  }) {
    const where: any = {};
    if (filter?.agentVersionId) where.agentVersionId = filter.agentVersionId;
    if (filter?.targetComponent) where.targetComponent = filter.targetComponent;
    if (filter?.gapCategory) where.gapCategory = filter.gapCategory;
    if (filter?.status) where.status = filter.status;
    if (filter?.isDemo !== undefined) where.isDemo = filter.isDemo;

    const logs = await prisma.refinementLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((l) => RefinementDTO.toDTO(l));
  }

  /**
   * Updates refinement log approval status and researcher notes.
   */
  static async updateRefinementStatus(
    id: string,
    data: {
      status?: string;
      approvedDecision?: string;
      researcherNotes?: string;
      resultingAgentVersionId?: string;
      proposedRefinement?: string;
      rootCauseAnalysis?: string;
      userId?: string;
    }
  ) {
    const updated = await prisma.refinementLog.update({
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

    await AuditService.logAction({
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

    return RefinementDTO.toDTO(updated);
  }
}
