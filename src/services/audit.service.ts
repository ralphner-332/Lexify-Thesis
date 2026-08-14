import { prisma } from '../lib/prisma';

export interface CreateAuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  isDemo?: boolean;
}

export class AuditService {
  /**
   * Append-only audit logger.
   * Records cannot be updated or deleted through this service or any API endpoint.
   */
  static async logAction(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          userEmail: params.userEmail || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          details: params.details ? JSON.stringify(params.details) : null,
          isDemo: params.isDemo !== undefined ? params.isDemo : true,
        },
      });
    } catch (error) {
      console.error('⚠️ Failed to write audit log:', error);
      // Non-blocking in dev, but logged
      return null;
    }
  }

  /**
   * Read-only query for audit logs (Admin only).
   */
  static async getAuditLogs(filter?: {
    entityType?: string;
    userId?: string;
    isDemo?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filter?.entityType) where.entityType = filter.entityType;
    if (filter?.userId) where.userId = filter.userId;
    if (filter?.isDemo !== undefined) where.isDemo = filter.isDemo;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter?.limit || 100,
        skip: filter?.offset || 0,
      }),
    ]);

    return {
      total,
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
    };
  }
}
