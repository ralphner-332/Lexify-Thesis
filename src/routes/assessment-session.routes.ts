import { Router } from 'express';
import { AssessmentSessionController } from '../controllers/assessment-session.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Student-accessible assessment session routes
router.get('/active', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.getActiveSession);
router.post('/new', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.createSession);
router.get('/history', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.listStudentSessions);
router.post('/draft', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.saveDraft);
router.get('/reused-v2-map', authenticateToken, requireRole('ADMIN'), AssessmentSessionController.getReusedSessions);
router.get('/reused-v4-map', authenticateToken, requireRole('ADMIN'), AssessmentSessionController.getReusedSessions);
router.get('/jobs/:jobId', authenticateToken, requireRole('ADMIN'), AssessmentSessionController.getReuseJobStatus);
router.get('/:id/reuse-v2-status', authenticateToken, requireRole('ADMIN'), AssessmentSessionController.getReuseJobStatus);
router.get('/:id/reuse-v4-status', authenticateToken, requireRole('ADMIN'), AssessmentSessionController.getReuseJobStatus);
router.get('/:id/review', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.getReview);
router.post('/:id/submit', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.submit);
router.post('/:id/reuse-v2', authenticateToken, requireRole('ADMIN'), AssessmentSessionController.reuseMockupForV2);
router.post('/:id/reuse-v4', authenticateToken, requireRole('ADMIN'), AssessmentSessionController.reuseMockupForV4);
router.get('/:id', authenticateToken, requireRole('STUDENT', 'ADMIN'), AssessmentSessionController.getSessionById);

export default router;

