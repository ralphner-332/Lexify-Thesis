import { Request, Response } from 'express';
import { StatisticsService } from '../services/statistics.service';

export class StatisticsController {
  static async getProgression(req: Request, res: Response) {
    try {
      // Default: isDemo = false on server unless explicitly authorized
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
      const thresholdPercent = req.query.thresholdPercent
        ? parseInt(String(req.query.thresholdPercent), 10)
        : 10;

      const analytics = await StatisticsService.getProgressionAnalytics({
        isDemo,
        thresholdPercent,
      });

      return res.status(200).json({ success: true, data: analytics });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to compute descriptive statistics' });
    }
  }

  static async getMultiModel(req: Request, res: Response) {
    try {
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
      const analytics = await StatisticsService.getMultiModelAnalytics({ isDemo });
      return res.status(200).json({ success: true, data: analytics });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to compute multi-model statistics' });
    }
  }
}
