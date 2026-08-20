"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefinementDTO = void 0;
class RefinementDTO {
    static toDTO(log) {
        return {
            id: log.id,
            gapId: log.gapId,
            questionId: log.questionId,
            sessionId: log.sessionId,
            aiEvaluationId: log.aiEvaluationId,
            expertEvaluationId: log.expertEvaluationId,
            agentVersionId: log.agentVersionId,
            targetComponent: log.targetComponent,
            gapCategory: log.gapCategory,
            discrepancyDescription: log.discrepancyDescription,
            aiPosition: log.aiPosition || '',
            expertPosition: log.expertPosition || '',
            expertRationale: log.expertRationale || '',
            rootCauseAnalysis: log.rootCauseAnalysis || '',
            proposedRefinement: log.proposedRefinement,
            status: log.status,
            approvedDecision: log.approvedDecision || '',
            resultingAgentVersionId: log.resultingAgentVersionId,
            researcherNotes: log.researcherNotes || '',
            isDemo: log.isDemo,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
        };
    }
}
exports.RefinementDTO = RefinementDTO;
