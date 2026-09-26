import { Router } from 'express';
import { ModelConfigController } from '../controllers/model-config.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Researcher Admin endpoints for Model A, B, C configuration
router.get('/', authenticateToken, requireRole('ADMIN'), ModelConfigController.getAll);
router.get('/:slot', authenticateToken, requireRole('ADMIN'), ModelConfigController.getBySlot);
router.put('/:slot', authenticateToken, requireRole('ADMIN'), ModelConfigController.update);
router.post('/lock', authenticateToken, requireRole('ADMIN'), ModelConfigController.setResearchLock);

export default router;
