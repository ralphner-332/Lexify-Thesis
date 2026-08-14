import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Student, Expert, Admin can list & view (results filtered by role-specific DTO)
router.get('/', authenticateToken, QuestionController.list);
router.get('/:id', authenticateToken, QuestionController.getById);

// Admin-only mutation routes
router.post('/', authenticateToken, requireRole('ADMIN'), QuestionController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), QuestionController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), QuestionController.delete);

export default router;
