import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Admin-only research export and reporting endpoints
router.get('/json', authenticateToken, requireRole('ADMIN'), ExportController.getBundleJSON);
router.get('/csv', authenticateToken, requireRole('ADMIN'), ExportController.getDatasetsCSV);
router.get('/academic-report', authenticateToken, requireRole('ADMIN'), ExportController.getAcademicReport);

export default router;
