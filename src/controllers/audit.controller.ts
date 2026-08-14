import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';

export class AuditController {
  static async list(req: Request, res: Response) {
    try {
      const { entityType, userId, isDemo, limit, offset } = req.query;

      const result = await AuditService.getAuditLogs({
        entityType: entityType ? String(entityType) : undefined,
        userId: userId ? String(userId) : undefined,
        isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
        limit: limit ? parseInt(String(limit), 10) : 100,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit logs' });
    }
  }
}
