import { Router } from 'express';
import { AssessmentSessionController } from '../controllers/assessment-session.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Student-accessible assessment session routes
router.get('/active', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.getActiveSession);
router.post('/draft', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.saveDraft);
router.get('/:id/review', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.getReview);
router.post('/:id/submit', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.submit);

export default router;
