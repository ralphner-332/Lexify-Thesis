import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const result = await AuthService.login(email, password);
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(401).json({ success: false, error: error.message || 'Login failed' });
    }
  }

  static async quickLogin(req: Request, res: Response) {
    try {
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ success: false, error: 'Role is required for quick login' });
      }

      const result = await AuthService.quickLogin(role);
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(403).json({ success: false, error: error.message || 'Quick login failed' });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      return res.status(200).json({ success: true, user: req.user });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch profile' });
    }
  }

  static async acceptDisclaimer(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }
      const user = await AuthService.acceptDisclaimer(req.user.id);
      return res.status(200).json({
        success: true,
        disclaimerAcceptedAt: user.disclaimerAcceptedAt,
        message: 'Academic research disclaimer accepted',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to accept disclaimer' });
    }
  }
}
