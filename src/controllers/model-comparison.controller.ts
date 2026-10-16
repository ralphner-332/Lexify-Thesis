import { Request, Response } from 'express';
import { ModelComparisonService } from '../services/model-comparison.service';

export class ModelComparisonController {
  static async getFilters(req: Request, res: Response) {
    try {
      const filters = await ModelComparisonService.getAvailableFilters();
      return res.status(200).json({ success: true, data: filters });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch comparison filters' });
    }
  }

  static async getQuestionLevel(req: Request, res: Response) {
    try {
      const { testSet, questionId, questionCode, agentVersionTag, isDemo, matchedOnly } = req.query;

      const result = await ModelComparisonService.getQuestionLevelComparison({
        testSet: testSet ? String(testSet) : undefined,
        questionId: questionId ? String(questionId) : undefined,
        questionCode: questionCode ? String(questionCode) : undefined,
        agentVersionTag: agentVersionTag ? String(agentVersionTag) : undefined,
        isDemo: isDemo !== undefined ? isDemo === 'true' : false,
        matchedOnly: matchedOnly === 'true',
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch question-level comparison' });
    }
  }

  static async getSummative(req: Request, res: Response) {
    try {
      const { testSet, agentVersionTag, isDemo, matchedOnly } = req.query;

      const result = await ModelComparisonService.getSummativeModelComparison({
        testSet: testSet ? String(testSet) : undefined,
        agentVersionTag: agentVersionTag ? String(agentVersionTag) : undefined,
        isDemo: isDemo !== undefined ? isDemo === 'true' : false,
        matchedOnly: matchedOnly === 'true',
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch summative model comparison' });
    }
  }

  static async exportCsv(req: Request, res: Response) {
    try {
      const { type, testSet, agentVersionTag, isDemo } = req.query;
      const exportType = type ? String(type) : 'summative-criteria';

      const csvContent = await ModelComparisonService.generateCsvExport(exportType, {
        testSet: testSet ? String(testSet) : undefined,
        agentVersionTag: agentVersionTag ? String(agentVersionTag) : undefined,
        isDemo: isDemo !== undefined ? isDemo === 'true' : false,
      });

      const filename = `Lexify_${exportType.toUpperCase().replace(/-/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to generate comparison CSV' });
    }
  }
}
