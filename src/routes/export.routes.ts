import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Admin-only research export and reporting endpoints
router.get('/json', authenticateToken, requireRole('ADMIN'), ExportController.getBundleJSON);
router.get('/csv', authenticateToken, requireRole('ADMIN'), ExportController.getDatasetsCSV);
router.get('/class-record-excel', authenticateToken, requireRole('ADMIN'), ExportController.getClassRecordExcel);
router.get('/class-record-csv', authenticateToken, requireRole('ADMIN'), ExportController.getClassRecordCSV);
router.get('/student-qna-pdf', authenticateToken, requireRole('ADMIN'), ExportController.getStudentQnAPDF);
router.get('/student-answers-pdf', authenticateToken, requireRole('ADMIN'), ExportController.getStudentAnswersPDF);
router.get('/student-qna-export', authenticateToken, requireRole('ADMIN'), ExportController.getStudentQnAExport);
router.get('/expert-grading-csv', authenticateToken, requireRole('ADMIN'), ExportController.getExpertGradingCSV);
router.get('/expert-grading-json', authenticateToken, requireRole('ADMIN'), ExportController.getExpertGradingJSON);
router.get('/academic-report', authenticateToken, requireRole('ADMIN'), ExportController.getAcademicReport);

export default router;

