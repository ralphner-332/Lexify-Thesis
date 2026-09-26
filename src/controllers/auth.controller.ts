import { Request, Response } from 'express';
import { AuthService, validatePasswordComplexity } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Full name, institutional email, and password are required.',
        });
      }

      if (confirmPassword !== undefined && password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match.',
        });
      }

      const validation = validatePasswordComplexity(password);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors[0],
          details: validation.errors,
        });
      }

      const user = await AuthService.registerStudent({
        name,
        email,
        passwordPlain: password,
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully. You can now sign in.',
        user,
      });
    } catch (error: any) {
      const message = error.message || 'Registration failed.';
      const statusCode = message.includes('already exists') ? 409 : 400;
      return res.status(statusCode).json({ success: false, error: message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password, passwordHash } = req.body;
      const plainPassword = password || passwordHash;
      if (!email || !plainPassword) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const result = await AuthService.login(email, plainPassword);
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
