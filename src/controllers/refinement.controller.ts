import { Request, Response } from 'express';
import { RefinementService } from '../services/refinement.service';

export class RefinementController {
  static async list(req: Request, res: Response) {
    try {
      const { agentVersionId, targetComponent, gapCategory, status, isDemo } = req.query;

      const logs = await RefinementService.getRefinementLogs({
        agentVersionId: agentVersionId ? String(agentVersionId) : undefined,
        targetComponent: targetComponent ? String(targetComponent) : undefined,
        gapCategory: gapCategory ? String(gapCategory) : undefined,
        status: status ? String(status) : undefined,
        isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
      });

      return res.status(200).json({ success: true, data: logs });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to list refinement logs' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const {
        gapId,
        questionId,
        sessionId,
        aiEvaluationId,
        expertEvaluationId,
        agentVersionId,
        targetComponent,
        gapCategory,
        discrepancyDescription,
        aiPosition,
        expertPosition,
        expertRationale,
        rootCauseAnalysis,
        proposedRefinement,
        status,
        approvedDecision,
        researcherNotes,
        isDemo,
      } = req.body;

      if (!agentVersionId || !targetComponent || !gapCategory || !discrepancyDescription || !proposedRefinement) {
        return res.status(400).json({
          success: false,
          error: 'agentVersionId, targetComponent, gapCategory, discrepancyDescription, and proposedRefinement are required',
        });
      }

      const log = await RefinementService.createRefinementLog({
        gapId,
        questionId,
        sessionId,
        aiEvaluationId,
        expertEvaluationId,
        agentVersionId,
        targetComponent,
        gapCategory,
        discrepancyDescription,
        aiPosition,
        expertPosition,
        expertRationale,
        rootCauseAnalysis,
        proposedRefinement,
        status,
        approvedDecision,
        researcherNotes,
        isDemo,
        userId: req.user?.id,
      });

      return res.status(201).json({ success: true, data: log });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to create refinement log' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        status,
        approvedDecision,
        researcherNotes,
        resultingAgentVersionId,
        proposedRefinement,
        rootCauseAnalysis,
      } = req.body;

      const updated = await RefinementService.updateRefinementStatus(id, {
        status,
        approvedDecision,
        researcherNotes,
        resultingAgentVersionId,
        proposedRefinement,
        rootCauseAnalysis,
        userId: req.user?.id,
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to update refinement log' });
    }
  }
}
