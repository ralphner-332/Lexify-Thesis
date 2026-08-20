import { Request, Response } from 'express';
import { FinalEvaluationService } from '../services/final-evaluation.service';

export class FinalEvaluationController {
  static async getQueue(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      // Default: isDemo=false on server, unless requested
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : req.user.isDemo;

      const queue = await FinalEvaluationService.getV3ReviewQueue(req.user.id, isDemo);
      return res.status(200).json({ success: true, data: queue });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch review queue' });
    }
  }

  static async getEvaluationForReview(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { evaluationId } = req.params;
      const detail = await FinalEvaluationService.getV3EvaluationForReview(req.user.id, evaluationId);
      return res.status(200).json({ success: true, data: detail });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to fetch evaluation detail' });
    }
  }

  static async submitReview(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { evaluationId } = req.params;
      const {
        agreementRating,
        reasoningCorrectnessRating,
        statutoryGroundingRating,
        recommendedScore,
        errorTags,
        qualitativeComments,
        improvementSuggestions,
        finalVerdict,
      } = req.body;

      if (!agreementRating || !recommendedScore || !finalVerdict) {
        return res.status(400).json({
          success: false,
          error: 'agreementRating, recommendedScore, and finalVerdict are required.',
        });
      }

      const result = await FinalEvaluationService.submitFinalReview(req.user.id, evaluationId, {
        agreementRating: Number(agreementRating),
        reasoningCorrectnessRating: Number(reasoningCorrectnessRating || agreementRating),
        statutoryGroundingRating: Number(statutoryGroundingRating || agreementRating),
        recommendedScore: Number(recommendedScore),
        errorTags: errorTags || [],
        qualitativeComments,
        improvementSuggestions,
        finalVerdict,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to submit review' });
    }
  }

  static async listReviews(req: Request, res: Response) {
    try {
      // Default: isDemo=false on server
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
      const finalVerdict = req.query.finalVerdict ? String(req.query.finalVerdict) : undefined;
      const agentVersionId = req.query.agentVersionId ? String(req.query.agentVersionId) : undefined;

      const reviews = await FinalEvaluationService.getFinalReviews({
        isDemo,
        finalVerdict,
        agentVersionId,
      });

      return res.status(200).json({ success: true, data: reviews });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to list final reviews' });
    }
  }
}
