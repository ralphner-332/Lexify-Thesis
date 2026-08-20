import { Router } from 'express';
import { FinalEvaluationController } from '../controllers/final-evaluation.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Expert unblinded review queue & submission
router.get('/queue', authenticateToken, requireRole('EXPERT', 'ADMIN'), FinalEvaluationController.getQueue);
router.get('/evaluation/:evaluationId', authenticateToken, requireRole('EXPERT', 'ADMIN'), FinalEvaluationController.getEvaluationForReview);
router.post('/evaluation/:evaluationId', authenticateToken, requireRole('EXPERT', 'ADMIN'), FinalEvaluationController.submitReview);

// Researcher query endpoint
router.get('/reviews', authenticateToken, requireRole('ADMIN'), FinalEvaluationController.listReviews);

export default router;
