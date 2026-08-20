"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalEvaluationController = void 0;
const final_evaluation_service_1 = require("../services/final-evaluation.service");
class FinalEvaluationController {
    static async getQueue(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            // Default: isDemo=false on server, unless requested
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : req.user.isDemo;
            const queue = await final_evaluation_service_1.FinalEvaluationService.getV3ReviewQueue(req.user.id, isDemo);
            return res.status(200).json({ success: true, data: queue });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch review queue' });
        }
    }
    static async getEvaluationForReview(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const { evaluationId } = req.params;
            const detail = await final_evaluation_service_1.FinalEvaluationService.getV3EvaluationForReview(req.user.id, evaluationId);
            return res.status(200).json({ success: true, data: detail });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to fetch evaluation detail' });
        }
    }
    static async submitReview(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const { evaluationId } = req.params;
            const { agreementRating, reasoningCorrectnessRating, statutoryGroundingRating, recommendedScore, errorTags, qualitativeComments, improvementSuggestions, finalVerdict, } = req.body;
            if (!agreementRating || !recommendedScore || !finalVerdict) {
                return res.status(400).json({
                    success: false,
                    error: 'agreementRating, recommendedScore, and finalVerdict are required.',
                });
            }
            const result = await final_evaluation_service_1.FinalEvaluationService.submitFinalReview(req.user.id, evaluationId, {
                agreementRating: Number(agreementRating),
                reasoningCorrectnessRating: Number(reasoningCorrectnessRating || agreementRating),
                statutoryGroundingRating: Number(statutoryGroundingRating || agreementRating),
                recommendedScore: Number(recommendedScore),
                errorTags: errorTags || [],
                qualitativeComments,
                improvementSuggestions,
                finalVerdict,
            });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to submit review' });
        }
    }
    static async listReviews(req, res) {
        try {
            // Default: isDemo=false on server
            const isDemo = req.query.isDemo !== undefined ? req.query.isDemo === 'true' : false;
            const finalVerdict = req.query.finalVerdict ? String(req.query.finalVerdict) : undefined;
            const agentVersionId = req.query.agentVersionId ? String(req.query.agentVersionId) : undefined;
            const reviews = await final_evaluation_service_1.FinalEvaluationService.getFinalReviews({
                isDemo,
                finalVerdict,
                agentVersionId,
            });
            return res.status(200).json({ success: true, data: reviews });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list final reviews' });
        }
    }
}
exports.FinalEvaluationController = FinalEvaluationController;
