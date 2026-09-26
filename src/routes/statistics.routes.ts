import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Multi-Model Analytics (Meta Llama 3.1 8B vs Mistral 7B vs Gemma 2 9B)
router.get('/', authenticateToken, requireRole('ADMIN'), StatisticsController.getMultiModel);
router.get('/multi-model', authenticateToken, requireRole('ADMIN'), StatisticsController.getMultiModel);

// Backward-compatible route
router.get('/progression', authenticateToken, requireRole('ADMIN'), StatisticsController.getProgression);

export default router;
