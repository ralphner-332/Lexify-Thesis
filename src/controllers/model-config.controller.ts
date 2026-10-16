import { Request, Response } from 'express';
import { ModelConfigService } from '../services/model-config.service';

export class ModelConfigController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const configs = await ModelConfigService.getAllModelConfigs();
      res.json({ success: true, data: configs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getBySlot(req: Request, res: Response): Promise<void> {
    try {
      const { slot } = req.params;
      const config = await ModelConfigService.getModelConfigBySlot(slot as any);
      if (!config) {
        res.status(404).json({ success: false, message: `Model slot ${slot} not found.` });
        return;
      }
      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { slot } = req.params;
      const adminUserId = (req as any).user?.id;
      const updated = await ModelConfigService.updateModelConfig(slot as any, req.body, adminUserId);
      res.json({ success: true, message: 'Model configuration updated.', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async setResearchLock(req: Request, res: Response): Promise<void> {
    try {
      const { isLocked } = req.body;
      const adminUserId = (req as any).user?.id;
      const updated = await ModelConfigService.setGlobalResearchLock(Boolean(isLocked), adminUserId);
      res.json({
        success: true,
        message: isLocked ? 'Research models locked for data collection.' : 'Research models unlocked.',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await ModelConfigService.getSystemSettings();
      res.json({ success: true, data: settings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const adminUserId = (req as any).user?.id;
      const updated = await ModelConfigService.updateSystemSettings(req.body, adminUserId);
      res.json({ success: true, message: 'System settings updated.', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async publishTestSet(req: Request, res: Response): Promise<void> {
    try {
      const { testSet } = req.body;
      const adminUserId = (req as any).user?.id;
      const updated = await ModelConfigService.publishTestSet(testSet, adminUserId);
      res.json({ success: true, message: `Test set ${testSet} published successfully.`, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async archiveTestSet(req: Request, res: Response): Promise<void> {
    try {
      const { testSet } = req.body;
      const adminUserId = (req as any).user?.id;
      const updated = await ModelConfigService.archiveTestSet(testSet, adminUserId);
      res.json({ success: true, message: `Test set ${testSet} archived successfully.`, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async draftTestSet(req: Request, res: Response): Promise<void> {
    try {
      const { testSet } = req.body;
      const adminUserId = (req as any).user?.id;
      const updated = await ModelConfigService.draftTestSet(testSet, adminUserId);
      res.json({ success: true, message: `Test set ${testSet} marked as draft.`, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

