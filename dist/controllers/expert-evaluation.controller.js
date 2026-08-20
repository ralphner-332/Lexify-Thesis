"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpertEvaluationController = void 0;
const expert_evaluation_service_1 = require("../services/expert-evaluation.service");
class ExpertEvaluationController {
    static async getQueue(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const queue = await expert_evaluation_service_1.ExpertEvaluationService.getExpertQueue(req.user.id, req.query.isDemo !== undefined ? req.query.isDemo === 'true' : req.user.isDemo);
            return res.status(200).json({ success: true, data: queue });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch expert queue' });
        }
    }
    static async getSubmission(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const { sessionId, questionId } = req.params;
            const submission = await expert_evaluation_service_1.ExpertEvaluationService.getSubmissionForEvaluation(req.user.id, sessionId, questionId);
            return res.status(200).json({ success: true, data: submission });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to fetch submission' });
        }
    }
    static async saveDraft(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const { sessionId, questionId, numericalScore, scoringBasis, criterionScores, qualitativeComments } = req.body;
            if (!sessionId || !questionId) {
                return res.status(400).json({ success: false, error: 'sessionId and questionId are required' });
            }
            const result = await expert_evaluation_service_1.ExpertEvaluationService.saveExpertDraft(req.user.id, sessionId, questionId, {
                numericalScore,
                scoringBasis,
                criterionScores,
                qualitativeComments,
            });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to save draft' });
        }
    }
    static async submitEvaluation(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const { sessionId, questionId, numericalScore, scoringBasis, criterionScores, qualitativeComments } = req.body;
            if (!sessionId || !questionId || numericalScore === undefined || !scoringBasis) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId, questionId, numericalScore, and scoringBasis are required',
                });
            }
            const result = await expert_evaluation_service_1.ExpertEvaluationService.submitExpertEvaluation(req.user.id, sessionId, questionId, {
                numericalScore,
                scoringBasis,
                criterionScores: criterionScores || [],
                qualitativeComments,
            });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Submission failed' });
        }
    }
    static async getEvaluations(req, res) {
        try {
            const { expertId, sessionId, questionId, isDemo } = req.query;
            const evaluations = await expert_evaluation_service_1.ExpertEvaluationService.getExpertEvaluations({
                expertId: expertId ? String(expertId) : undefined,
                sessionId: sessionId ? String(sessionId) : undefined,
                questionId: questionId ? String(questionId) : undefined,
                isDemo: isDemo !== undefined ? isDemo === 'true' : undefined,
            });
            return res.status(200).json({ success: true, data: evaluations });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch expert evaluations' });
        }
    }
}
exports.ExpertEvaluationController = ExpertEvaluationController;
