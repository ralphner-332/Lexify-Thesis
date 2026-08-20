"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefinementController = void 0;
const refinement_service_1 = require("../services/refinement.service");
class RefinementController {
    static async list(req, res) {
        try {
            const { agentVersionId, targetComponent, gapCategory, status, isDemo } = req.query;
            const logs = await refinement_service_1.RefinementService.getRefinementLogs({
                agentVersionId: agentVersionId ? String(agentVersionId) : undefined,
                targetComponent: targetComponent ? String(targetComponent) : undefined,
                gapCategory: gapCategory ? String(gapCategory) : undefined,
                status: status ? String(status) : undefined,
                isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
            });
            return res.status(200).json({ success: true, data: logs });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list refinement logs' });
        }
    }
    static async create(req, res) {
        try {
            const { gapId, questionId, sessionId, aiEvaluationId, expertEvaluationId, agentVersionId, targetComponent, gapCategory, discrepancyDescription, aiPosition, expertPosition, expertRationale, rootCauseAnalysis, proposedRefinement, status, approvedDecision, researcherNotes, isDemo, } = req.body;
            if (!agentVersionId || !targetComponent || !gapCategory || !discrepancyDescription || !proposedRefinement) {
                return res.status(400).json({
                    success: false,
                    error: 'agentVersionId, targetComponent, gapCategory, discrepancyDescription, and proposedRefinement are required',
                });
            }
            const log = await refinement_service_1.RefinementService.createRefinementLog({
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
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to create refinement log' });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { status, approvedDecision, researcherNotes, resultingAgentVersionId, proposedRefinement, rootCauseAnalysis, } = req.body;
            const updated = await refinement_service_1.RefinementService.updateRefinementStatus(id, {
                status,
                approvedDecision,
                researcherNotes,
                resultingAgentVersionId,
                proposedRefinement,
                rootCauseAnalysis,
                userId: req.user?.id,
            });
            return res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to update refinement log' });
        }
    }
}
exports.RefinementController = RefinementController;
