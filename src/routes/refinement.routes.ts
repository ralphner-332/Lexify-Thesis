import { Router } from 'express';
import { RefinementController } from '../controllers/refinement.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Admin-only refinement workflow routes
router.get('/', authenticateToken, requireRole('ADMIN'), RefinementController.list);
router.post('/', authenticateToken, requireRole('ADMIN'), RefinementController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), RefinementController.update);

export default router;
