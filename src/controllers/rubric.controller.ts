import { Request, Response } from 'express';
import { RubricService } from '../services/rubric.service';

export class RubricController {
  static async list(req: Request, res: Response) {
    try {
      const rubrics = await RubricService.listRubrics();
      return res.status(200).json({ success: true, data: rubrics });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to list rubrics' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const rubric = await RubricService.getRubricById(req.params.id);
      return res.status(200).json({ success: true, data: rubric });
    } catch (error: any) {
      return res.status(404).json({ success: false, error: error.message || 'Rubric not found' });
    }
  }

  static async getDefault(req: Request, res: Response) {
    try {
      const rubric = await RubricService.getDefaultRubric();
      return res.status(200).json({ success: true, data: rubric });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch default rubric' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, description, isDefault, isDemo, criteria } = req.body;
      if (!name || !description || !criteria) {
        return res.status(400).json({
          success: false,
          error: 'Name, description, and criteria array are required',
        });
      }

      const created = await RubricService.createRubric(
        { name, description, isDefault, isDemo, criteria },
        req.user
      );

      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to create rubric' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await RubricService.updateRubric(req.params.id, req.body, req.user);
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to update rubric' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const result = await RubricService.deleteRubric(req.params.id, req.user);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message || 'Failed to delete rubric' });
    }
  }
}
