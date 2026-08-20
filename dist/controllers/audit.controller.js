"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const audit_service_1 = require("../services/audit.service");
class AuditController {
    static async list(req, res) {
        try {
            const { entityType, userId, isDemo, limit, offset } = req.query;
            const result = await audit_service_1.AuditService.getAuditLogs({
                entityType: entityType ? String(entityType) : undefined,
                userId: userId ? String(userId) : undefined,
                isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
                limit: limit ? parseInt(String(limit), 10) : 100,
                offset: offset ? parseInt(String(offset), 10) : 0,
            });
            return res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit logs' });
        }
    }
}
exports.AuditController = AuditController;
