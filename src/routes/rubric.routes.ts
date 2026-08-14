import { Router } from 'express';
import { RubricController } from '../controllers/rubric.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', authenticateToken, RubricController.list);
router.get('/default', authenticateToken, RubricController.getDefault);
router.get('/:id', authenticateToken, RubricController.getById);

// Admin-only mutations
router.post('/', authenticateToken, requireRole('ADMIN'), RubricController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), RubricController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), RubricController.delete);

export default router;
