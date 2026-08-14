import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluation.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Student feedback for own submitted session
router.get('/session/:sessionId', authenticateToken, requireRole('STUDENT', 'ADMIN'), EvaluationController.getStudentSessionEvaluations);

// Researcher admin evaluation explorer
router.get('/', authenticateToken, requireRole('ADMIN'), EvaluationController.getAdminEvaluations);

export default router;
