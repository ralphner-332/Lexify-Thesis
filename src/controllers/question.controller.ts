import { Request, Response } from 'express';
import { QuestionService } from '../services/question.service';

export class QuestionController {
  static async list(req: Request, res: Response) {
    try {
      const role = req.user?.role || 'STUDENT';
      const includeInactive = req.query.includeInactive === 'true' && role === 'ADMIN';
      const questions = await QuestionService.listQuestions(role, includeInactive);
      return res.status(200).json({ success: true, data: questions });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to list questions' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const role = req.user?.role || 'STUDENT';
      const question = await QuestionService.getQuestionById(req.params.id, role);
      return res.status(200).json({ success: true, data: question });
    } catch (error: any) {
      return res.status(404).json({ success: false, error: error.message || 'Question not found' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { code, title, scenario, modelAnswer, statutoryElements, relevantProvisions, conceptVariations, orderIndex, isActive, isDemo } = req.body;
      if (!code || !title || !scenario || !modelAnswer) {
        return res.status(400).json({
          success: false,
          error: 'Code, title, scenario, and model reference answer are required',
        });
      }

      const created = await QuestionService.createQuestion(
        {
          code,
          title,
          scenario,
          modelAnswer,
          statutoryElements: statutoryElements || [],
          relevantProvisions: relevantProvisions || [],
          conceptVariations: conceptVariations || [],
          orderIndex,
          isActive,
          isDemo,
        },
        req.user
      );

      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to create question' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await QuestionService.updateQuestion(req.params.id, req.body, req.user);
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to update question' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const result = await QuestionService.deleteQuestion(req.params.id, req.user);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to delete question' });
    }
  }
}
