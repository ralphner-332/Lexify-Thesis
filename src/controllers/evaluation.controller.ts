import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluation.service';

export class EvaluationController {
  static async getStudentSessionEvaluations(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const evaluations = await EvaluationService.getStudentSessionEvaluations(
        req.params.sessionId,
        req.user.id
      );

      return res.status(200).json({ success: true, data: evaluations });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to fetch evaluations' });
    }
  }

  static async getAdminEvaluations(req: Request, res: Response) {
    try {
      const { agentVersionId, sessionId, questionId, isDemo, hasReviewFlags, limit, offset } = req.query;

      const result = await EvaluationService.getAdminEvaluations({
        agentVersionId: agentVersionId ? String(agentVersionId) : undefined,
        sessionId: sessionId ? String(sessionId) : undefined,
        questionId: questionId ? String(questionId) : undefined,
        isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
        hasReviewFlags: hasReviewFlags === 'true',
        limit: limit ? parseInt(String(limit), 10) : 100,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch admin evaluations' });
    }
  }
}
