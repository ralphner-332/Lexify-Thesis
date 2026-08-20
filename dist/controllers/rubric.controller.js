"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RubricController = void 0;
const rubric_service_1 = require("../services/rubric.service");
class RubricController {
    static async list(req, res) {
        try {
            const rubrics = await rubric_service_1.RubricService.listRubrics();
            return res.status(200).json({ success: true, data: rubrics });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list rubrics' });
        }
    }
    static async getById(req, res) {
        try {
            const rubric = await rubric_service_1.RubricService.getRubricById(req.params.id);
            return res.status(200).json({ success: true, data: rubric });
        }
        catch (error) {
            return res.status(404).json({ success: false, error: error.message || 'Rubric not found' });
        }
    }
    static async getDefault(req, res) {
        try {
            const rubric = await rubric_service_1.RubricService.getDefaultRubric();
            return res.status(200).json({ success: true, data: rubric });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch default rubric' });
        }
    }
    static async create(req, res) {
        try {
            const { name, description, isDefault, isDemo, criteria } = req.body;
            if (!name || !description || !criteria) {
                return res.status(400).json({
                    success: false,
                    error: 'Name, description, and criteria array are required',
                });
            }
            const created = await rubric_service_1.RubricService.createRubric({ name, description, isDefault, isDemo, criteria }, req.user);
            return res.status(201).json({ success: true, data: created });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to create rubric' });
        }
    }
    static async update(req, res) {
        try {
            const updated = await rubric_service_1.RubricService.updateRubric(req.params.id, req.body, req.user);
            return res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to update rubric' });
        }
    }
    static async delete(req, res) {
        try {
            const result = await rubric_service_1.RubricService.deleteRubric(req.params.id, req.user);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to delete rubric' });
        }
    }
}
exports.RubricController = RubricController;
