import { Router } from 'express';
import { ComparisonController } from '../controllers/comparison.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Researcher comparison matrix endpoint
router.get('/', authenticateToken, requireRole('ADMIN'), ComparisonController.getComparisons);

export default router;
