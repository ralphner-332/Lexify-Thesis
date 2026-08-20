import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Student / Expert active survey routes
router.get('/active', authenticateToken, SurveyController.getActive);
router.post('/response', authenticateToken, SurveyController.submitResponse);

// Admin analytics & management routes
router.get('/questionnaires', authenticateToken, requireRole('ADMIN'), SurveyController.listQuestionnaires);
router.get('/responses', authenticateToken, requireRole('ADMIN'), SurveyController.getResponses);
router.get('/summary/:questionnaireId', authenticateToken, requireRole('ADMIN'), SurveyController.getSummaryMetrics);

export default router;
