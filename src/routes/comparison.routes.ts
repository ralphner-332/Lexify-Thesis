import { Router } from 'express';
import { ComparisonController } from '../controllers/comparison.controller';
import { ModelComparisonController } from '../controllers/model-comparison.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Multi-Level Model Comparison Endpoints
router.get('/filters', authenticateToken, requireRole('ADMIN'), ModelComparisonController.getFilters);
router.get('/question-level', authenticateToken, requireRole('ADMIN'), ModelComparisonController.getQuestionLevel);
router.get('/summative', authenticateToken, requireRole('ADMIN'), ModelComparisonController.getSummative);
router.get('/export-csv', authenticateToken, requireRole('ADMIN'), ModelComparisonController.exportCsv);

// Existing AI vs. Expert comparison matrix endpoint
router.get('/', authenticateToken, requireRole('ADMIN'), ComparisonController.getComparisons);

export default router;

