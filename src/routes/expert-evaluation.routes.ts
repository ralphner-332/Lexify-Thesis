import { Router } from 'express';
import { ExpertEvaluationController } from '../controllers/expert-evaluation.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Expert endpoints
router.get('/queue', authenticateToken, requireRole('EXPERT', 'ADMIN'), ExpertEvaluationController.getQueue);
router.get('/submission/:sessionId/:questionId', authenticateToken, requireRole('EXPERT', 'ADMIN'), ExpertEvaluationController.getSubmission);
router.post('/draft', authenticateToken, requireRole('EXPERT', 'ADMIN'), ExpertEvaluationController.saveDraft);
router.post('/submit', authenticateToken, requireRole('EXPERT', 'ADMIN'), ExpertEvaluationController.submitEvaluation);

// Researcher admin query endpoint
router.get('/evaluations', authenticateToken, requireRole('ADMIN'), ExpertEvaluationController.getEvaluations);

export default router;
