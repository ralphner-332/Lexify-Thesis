import { Request, Response } from 'express';
import { ComparisonService } from '../services/comparison.service';

export class ComparisonController {
  static async getComparisons(req: Request, res: Response) {
    try {
      const {
        agentVersionId,
        sessionId,
        questionId,
        isDemo,
        thresholdPercent,
        hasConflictOnly,
      } = req.query;

      const result = await ComparisonService.getComparisonList({
        agentVersionId: agentVersionId ? String(agentVersionId) : undefined,
        sessionId: sessionId ? String(sessionId) : undefined,
        questionId: questionId ? String(questionId) : undefined,
        isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
        thresholdPercent: thresholdPercent ? parseInt(String(thresholdPercent), 10) : undefined,
        hasConflictOnly: hasConflictOnly === 'true',
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch comparison matrix' });
    }
  }
}
