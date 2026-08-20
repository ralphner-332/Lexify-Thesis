import { Request, Response } from 'express';
import { AssessmentSessionService } from '../services/assessment-session.service';

export class AssessmentSessionController {
  static async getActiveSession(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const session = await AssessmentSessionService.getOrCreateActiveSession(
        req.user.id,
        req.user.isDemo
      );
      return res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch session' });
    }
  }

  static async getSessionById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const session = await AssessmentSessionService.getSessionById(
        req.params.id,
        req.user.id
      );
      return res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to fetch session' });
    }
  }

  static async saveDraft(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { sessionId, questionId, answerText } = req.body;
      if (!sessionId || !questionId || answerText === undefined) {
        return res.status(400).json({
          success: false,
          error: 'sessionId, questionId, and answerText are required',
        });
      }

      const draft = await AssessmentSessionService.saveAnswerDraft(
        sessionId,
        req.user.id,
        questionId,
        answerText
      );

      return res.status(200).json({ success: true, data: draft });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to save draft' });
    }
  }

  static async getReview(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const review = await AssessmentSessionService.getSessionReview(
        req.params.id,
        req.user.id
      );

      return res.status(200).json({ success: true, data: review });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to get review' });
    }
  }

  static async submit(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const result = await AssessmentSessionService.submitSession(
        req.params.id,
        req.user.id
      );

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Submission failed' });
    }
  }
}
