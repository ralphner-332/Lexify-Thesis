import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden. Required role(s): ${allowedRoles.join(', ')}. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}
