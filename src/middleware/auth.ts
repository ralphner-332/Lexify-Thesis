import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  isDemo: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Bearer token.',
    });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token.',
    });
  }
}
