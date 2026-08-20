"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyController = void 0;
const survey_service_1 = require("../services/survey.service");
class SurveyController {
    static async getActive(req, res) {
        try {
            const role = req.query.role || req.user?.role || 'STUDENT';
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : req.user?.isDemo;
            const questionnaire = await survey_service_1.SurveyService.getActiveQuestionnaire(role, isDemo);
            return res.status(200).json({ success: true, data: questionnaire });
        }
        catch (error) {
            return res.status(404).json({ success: false, error: error.message || 'Survey questionnaire not found' });
        }
    }
    static async submitResponse(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const { questionnaireId, answers, qualitativeNotes, isDemo } = req.body;
            if (!questionnaireId || !answers) {
                return res.status(400).json({ success: false, error: 'questionnaireId and answers are required.' });
            }
            const role = req.user.role || 'STUDENT';
            const isDemoFlag = isDemo !== undefined ? isDemo : req.user.isDemo;
            const result = await survey_service_1.SurveyService.submitSurveyResponse(req.user.id, role, questionnaireId, answers, qualitativeNotes, isDemoFlag);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to submit survey response' });
        }
    }
    static async getResponses(req, res) {
        try {
            // Default: isDemo=false on server
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
            const questionnaireId = req.query.questionnaireId ? String(req.query.questionnaireId) : undefined;
            const respondentRole = req.query.respondentRole ? String(req.query.respondentRole) : undefined;
            const responses = await survey_service_1.SurveyService.getSurveyResponses({
                questionnaireId,
                respondentRole,
                isDemo,
            });
            return res.status(200).json({ success: true, data: responses });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list survey responses' });
        }
    }
    static async getSummaryMetrics(req, res) {
        try {
            const { questionnaireId } = req.params;
            // Default: isDemo=false on server
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
            const metrics = await survey_service_1.SurveyService.getSurveySummaryMetrics(questionnaireId, isDemo);
            return res.status(200).json({ success: true, data: metrics });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to compute survey summary metrics' });
        }
    }
    static async listQuestionnaires(req, res) {
        try {
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined;
            const list = await survey_service_1.SurveyService.listQuestionnaires(isDemo);
            return res.status(200).json({ success: true, data: list });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list questionnaires' });
        }
    }
}
exports.SurveyController = SurveyController;
