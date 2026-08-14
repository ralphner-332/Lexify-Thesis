import { Router } from 'express';
import { AgentVersionController } from '../controllers/agent-version.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read active version / list (authenticated)
router.get('/', authenticateToken, AgentVersionController.list);
router.get('/active', authenticateToken, AgentVersionController.getActive);
router.get('/compare', authenticateToken, requireRole('ADMIN'), AgentVersionController.compare);
router.get('/:id', authenticateToken, AgentVersionController.getById);

// Admin-only snapshot management
router.post('/', authenticateToken, requireRole('ADMIN'), AgentVersionController.createDraft);
router.put('/:id', authenticateToken, requireRole('ADMIN'), AgentVersionController.updateDraft);
router.post('/:id/lock', authenticateToken, requireRole('ADMIN'), AgentVersionController.lockVersion);
router.post('/:id/activate', authenticateToken, requireRole('ADMIN'), AgentVersionController.activateVersion);

export default router;
