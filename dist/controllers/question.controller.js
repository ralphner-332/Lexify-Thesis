"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionController = void 0;
const question_service_1 = require("../services/question.service");
class QuestionController {
    static async list(req, res) {
        try {
            const role = req.user?.role || 'STUDENT';
            const includeInactive = req.query.includeInactive === 'true' && role === 'ADMIN';
            const questions = await question_service_1.QuestionService.listQuestions(role, includeInactive);
            return res.status(200).json({ success: true, data: questions });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list questions' });
        }
    }
    static async getById(req, res) {
        try {
            const role = req.user?.role || 'STUDENT';
            const question = await question_service_1.QuestionService.getQuestionById(req.params.id, role);
            return res.status(200).json({ success: true, data: question });
        }
        catch (error) {
            return res.status(404).json({ success: false, error: error.message || 'Question not found' });
        }
    }
    static async create(req, res) {
        try {
            const { code, title, scenario, modelAnswer, statutoryElements, relevantProvisions, conceptVariations, orderIndex, isActive, isDemo } = req.body;
            if (!code || !title || !scenario || !modelAnswer) {
                return res.status(400).json({
                    success: false,
                    error: 'Code, title, scenario, and model reference answer are required',
                });
            }
            const created = await question_service_1.QuestionService.createQuestion({
                code,
                title,
                scenario,
                modelAnswer,
                statutoryElements: statutoryElements || [],
                relevantProvisions: relevantProvisions || [],
                conceptVariations: conceptVariations || [],
                orderIndex,
                isActive,
                isDemo,
            }, req.user);
            return res.status(201).json({ success: true, data: created });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to create question' });
        }
    }
    static async update(req, res) {
        try {
            const updated = await question_service_1.QuestionService.updateQuestion(req.params.id, req.body, req.user);
            return res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to update question' });
        }
    }
    static async delete(req, res) {
        try {
            const result = await question_service_1.QuestionService.deleteQuestion(req.params.id, req.user);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to delete question' });
        }
    }
}
exports.QuestionController = QuestionController;
