import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Admin descriptive research statistics
router.get('/progression', authenticateToken, requireRole('ADMIN'), StatisticsController.getProgression);

export default router;
