import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.post('/quick-login', AuthController.quickLogin);
router.get('/me', authenticateToken, AuthController.me);
router.post('/accept-disclaimer', authenticateToken, AuthController.acceptDisclaimer);

export default router;
