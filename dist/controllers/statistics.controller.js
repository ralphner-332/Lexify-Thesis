"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsController = void 0;
const statistics_service_1 = require("../services/statistics.service");
class StatisticsController {
    static async getProgression(req, res) {
        try {
            // Default: isDemo = false on server unless explicitly authorized
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
            const thresholdPercent = req.query.thresholdPercent
                ? parseInt(String(req.query.thresholdPercent), 10)
                : 10;
            const analytics = await statistics_service_1.StatisticsService.getProgressionAnalytics({
                isDemo,
                thresholdPercent,
            });
            return res.status(200).json({ success: true, data: analytics });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to compute descriptive statistics' });
        }
    }
}
exports.StatisticsController = StatisticsController;
