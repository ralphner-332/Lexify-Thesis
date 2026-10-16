import { Request, Response } from 'express';
import { AssessmentSessionService } from '../services/assessment-session.service';

export class AssessmentSessionController {
  static async getActiveSession(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const testSet = typeof req.query.testSet === 'string' ? req.query.testSet : undefined;
      const session = await AssessmentSessionService.getOrCreateActiveSession(
        req.user.id,
        req.user.isDemo,
        testSet
      );
      return res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch session' });
    }
  }

  static async createSession(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const testSet = req.body?.testSet || (typeof req.query.testSet === 'string' ? req.query.testSet : undefined);
      const session = await AssessmentSessionService.createAssessmentSession(
        req.user.id,
        req.user.isDemo,
        testSet
      );
      return res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      return res.status(403).json({ success: false, error: error.message || 'Failed to create assessment session' });
    }
  }

  static async listStudentSessions(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const sessions = await AssessmentSessionService.getStudentSessionHistory(req.user.id);
      return res.status(200).json({ success: true, data: sessions });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to list sessions' });
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

  static async reuseMockupForV2(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { confirmedMockupClassification } = req.body || {};
      const result = await AssessmentSessionService.reuseMockupForV4Testing(
        req.params.id,
        { id: req.user.id, email: req.user.email },
        confirmedMockupClassification === true
      );

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to reuse mockup answers for V2 Official testing',
      });
    }
  }

  // Alias for backward compatibility
  static reuseMockupForV4 = AssessmentSessionController.reuseMockupForV2;

  static async getReusedSessions(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const mapping = await AssessmentSessionService.getReusedSessionsMap();
      return res.status(200).json({ success: true, data: mapping });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch reused sessions map',
      });
    }
  }

  static async getReuseJobStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const jobIdOrSessionId = req.params.jobId || req.params.id;
      const status = await AssessmentSessionService.getReuseJobStatus(jobIdOrSessionId);
      return res.status(200).json(status);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch evaluation job status',
      });
    }
  }
}

