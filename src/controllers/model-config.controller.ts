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
}
