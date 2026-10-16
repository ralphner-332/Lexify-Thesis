import { Router } from 'express';
import { ModelConfigController } from '../controllers/model-config.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Global System Settings (Student Display Model & Accuracy Level)
router.get('/settings/system', authenticateToken, requireRole('ADMIN', 'STUDENT'), ModelConfigController.getSettings);
router.put('/settings/system', authenticateToken, requireRole('ADMIN'), ModelConfigController.updateSettings);
router.post('/settings/publish-test-set', authenticateToken, requireRole('ADMIN'), ModelConfigController.publishTestSet);
router.post('/settings/archive-test-set', authenticateToken, requireRole('ADMIN'), ModelConfigController.archiveTestSet);
router.post('/settings/draft-test-set', authenticateToken, requireRole('ADMIN'), ModelConfigController.draftTestSet);

// Researcher Admin endpoints for Model A, B, C configuration
router.get('/', authenticateToken, requireRole('ADMIN'), ModelConfigController.getAll);
router.get('/:slot', authenticateToken, requireRole('ADMIN'), ModelConfigController.getBySlot);
router.put('/:slot', authenticateToken, requireRole('ADMIN'), ModelConfigController.update);
router.post('/lock', authenticateToken, requireRole('ADMIN'), ModelConfigController.setResearchLock);

export default router;

