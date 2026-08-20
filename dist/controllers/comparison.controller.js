"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonController = void 0;
const comparison_service_1 = require("../services/comparison.service");
class ComparisonController {
    static async getComparisons(req, res) {
        try {
            const { agentVersionId, sessionId, questionId, isDemo, thresholdPercent, hasConflictOnly, } = req.query;
            const result = await comparison_service_1.ComparisonService.getComparisonList({
                agentVersionId: agentVersionId ? String(agentVersionId) : undefined,
                sessionId: sessionId ? String(sessionId) : undefined,
                questionId: questionId ? String(questionId) : undefined,
                isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
                thresholdPercent: thresholdPercent ? parseInt(String(thresholdPercent), 10) : undefined,
                hasConflictOnly: hasConflictOnly === 'true',
            });
            return res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch comparison matrix' });
        }
    }
}
exports.ComparisonController = ComparisonController;
