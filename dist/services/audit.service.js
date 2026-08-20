"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = require("../lib/prisma");
class AuditService {
    /**
     * Append-only audit logger.
     * Records cannot be updated or deleted through this service or any API endpoint.
     */
    static async logAction(params) {
        try {
            return await prisma_1.prisma.auditLog.create({
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
        }
        catch (error) {
            console.error('⚠️ Failed to write audit log:', error);
            // Non-blocking in dev, but logged
            return null;
        }
    }
    /**
     * Read-only query for audit logs (Admin only).
     */
    static async getAuditLogs(filter) {
        const where = {};
        if (filter?.entityType)
            where.entityType = filter.entityType;
        if (filter?.userId)
            where.userId = filter.userId;
        if (filter?.isDemo !== undefined)
            where.isDemo = filter.isDemo;
        const [total, logs] = await Promise.all([
            prisma_1.prisma.auditLog.count({ where }),
            prisma_1.prisma.auditLog.findMany({
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
exports.AuditService = AuditService;
