import { Request, Response } from 'express';
import { ExportService } from '../services/export.service';

export class ExportController {
  static async getBundleJSON(req: Request, res: Response) {
    try {
      // Default: isDemo = false on server
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
      const bundle = await ExportService.exportResearchBundleJSON({ isDemo });
      return res.status(200).json({ success: true, data: bundle });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export research bundle' });
    }
  }

  static async getDatasetsCSV(req: Request, res: Response) {
    try {
      // Default: isDemo = false on server
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
      const csvDatasets = await ExportService.exportResearchDatasetsCSV({ isDemo });
      return res.status(200).json({ success: true, data: csvDatasets });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export CSV datasets' });
    }
  }

  static async getAcademicReport(req: Request, res: Response) {
    try {
      // Default: isDemo = false on server
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
      const report = await ExportService.generateAcademicReportData({ isDemo });
      return res.status(200).json({ success: true, data: report });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to generate academic report' });
    }
  }
}
