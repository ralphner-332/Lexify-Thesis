"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const export_service_1 = require("../services/export.service");
class ExportController {
    static async getBundleJSON(req, res) {
        try {
            // Default: isDemo = false on server
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
            const bundle = await export_service_1.ExportService.exportResearchBundleJSON({ isDemo });
            return res.status(200).json({ success: true, data: bundle });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to export research bundle' });
        }
    }
    static async getDatasetsCSV(req, res) {
        try {
            // Default: isDemo = false on server
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
            const csvDatasets = await export_service_1.ExportService.exportResearchDatasetsCSV({ isDemo });
            return res.status(200).json({ success: true, data: csvDatasets });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to export CSV datasets' });
        }
    }
    static async getAcademicReport(req, res) {
        try {
            // Default: isDemo = false on server
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
            const report = await export_service_1.ExportService.generateAcademicReportData({ isDemo });
            return res.status(200).json({ success: true, data: report });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to generate academic report' });
        }
    }
}
exports.ExportController = ExportController;
