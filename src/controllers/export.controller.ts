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

  static async getClassRecordExcel(req: Request, res: Response) {
    try {
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined;
      const testSet = (req.query.testSet as string) || 'TEST_1';
      const buffer = await ExportService.exportClassRecordExcel({ isDemo, testSet });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename =
        testSet.toUpperCase() === 'ALL'
          ? `Lexify_CLASS_RECORD_ALL_TESTS_${dateStr}.xlsx`
          : `Lexify_CLASS_RECORD_${testSet.toUpperCase()}_${dateStr}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export class record Excel' });
    }
  }

  static async getClassRecordCSV(req: Request, res: Response) {
    try {
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined;
      const csv = await ExportService.exportClassRecordCSV(isDemo !== undefined ? { isDemo } : undefined);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="lexify_class_record.csv"');
      return res.status(200).send(csv);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export class record CSV' });
    }
  }

  static async getStudentQnAPDF(req: Request, res: Response) {
    try {
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined;
      const testSet = (req.query.testSet as string) || 'TEST_1';
      const pdfBuffer = await ExportService.exportStudentQnAPDF({ isDemo, testSet });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Lexify_STUDENT_QUESTIONS_AND_ANSWERS_${testSet.toUpperCase()}_${dateStr}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export student Q&A PDF' });
    }
  }

  static async getStudentQnAExport(req: Request, res: Response) {
    try {
      if (req.query.format === 'pdf') {
        return await ExportController.getStudentQnAPDF(req, res);
      }
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined;
      const testSet = (req.query.testSet as string) || 'TEST_1';
      const text = await ExportService.exportStudentQnAResponses({ isDemo, testSet });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Lexify_STUDENT_QUESTIONS_AND_ANSWERS_${testSet.toUpperCase()}_${dateStr}.txt`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(text);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export student Q&A responses' });
    }
  }

  static async getExpertGradingCSV(req: Request, res: Response) {
    try {
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined;
      const testSet = (req.query.testSet as string) || 'TEST_1';
      // Serve the student Q&A responses format requested
      const text = await ExportService.exportStudentQnAResponses({ isDemo, testSet });
      const dateStr = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Lexify_STUDENT_QUESTIONS_AND_ANSWERS_${testSet.toUpperCase()}_${dateStr}.txt"`);
      return res.status(200).send(text);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export expert grading responses' });
    }
  }

  static async getExpertGradingJSON(req: Request, res: Response) {
    try {
      const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined;
      const data = await ExportService.exportExpertGradingJSON(isDemo !== undefined ? { isDemo } : undefined);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export expert grading JSON' });
    }
  }

  static async getStudentAnswersPDF(req: Request, res: Response) {
    try {
      const testSet = ((req.query.testSet as string) || 'TEST_1').toUpperCase() as 'TEST_1' | 'TEST_2';
      const studentId = req.query.studentId as string | undefined;
      const sessionId = req.query.sessionId as string | undefined;

      const pdfBuffer = await ExportService.exportStudentAnswersPDF({
        testSet,
        studentId,
        sessionId,
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const studentSuffix = studentId ? `_STUDENT_${studentId.slice(0, 8)}` : (sessionId ? `_SESSION_${sessionId.slice(0, 8)}` : '_ALL_STUDENTS');
      const filename = `Lexify_STUDENT_ANSWERS_${testSet}${studentSuffix}_${dateStr}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to export student answers PDF' });
    }
  }
}

