export interface RefinementLogDTO {
  id: string;
  gapId: string;
  questionId?: string | null;
  sessionId?: string | null;
  aiEvaluationId?: string | null;
  expertEvaluationId?: string | null;
  agentVersionId: string;
  targetComponent: string;
  gapCategory: string;
  discrepancyDescription: string;
  aiPosition: string;
  expertPosition: string;
  expertRationale: string;
  rootCauseAnalysis: string;
  proposedRefinement: string;
  status: string;
  approvedDecision: string;
  resultingAgentVersionId?: string | null;
  researcherNotes: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RefinementDTO {
  static toDTO(log: any): RefinementLogDTO {
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
