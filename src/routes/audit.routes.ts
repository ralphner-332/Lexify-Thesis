import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Admin-only read-only audit log inspection
router.get('/', authenticateToken, requireRole('ADMIN'), AuditController.list);

export default router;
