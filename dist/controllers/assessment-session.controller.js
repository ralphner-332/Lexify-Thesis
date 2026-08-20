"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentSessionController = void 0;
const assessment_session_service_1 = require("../services/assessment-session.service");
class AssessmentSessionController {
    static async getActiveSession(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const session = await assessment_session_service_1.AssessmentSessionService.getOrCreateActiveSession(req.user.id, req.user.isDemo);
            return res.status(200).json({ success: true, data: session });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch session' });
        }
    }
    static async createSession(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const session = await assessment_session_service_1.AssessmentSessionService.createAssessmentSession(req.user.id, req.user.isDemo);
            return res.status(201).json({ success: true, data: session });
        }
        catch (error) {
            return res.status(403).json({ success: false, error: error.message || 'Failed to create assessment session' });
        }
    }
    static async listStudentSessions(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const sessions = await assessment_session_service_1.AssessmentSessionService.getStudentSessionHistory(req.user.id);
            return res.status(200).json({ success: true, data: sessions });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list sessions' });
        }
    }
    static async getSessionById(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const session = await assessment_session_service_1.AssessmentSessionService.getSessionById(req.params.id, req.user.id);
            return res.status(200).json({ success: true, data: session });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to fetch session' });
        }
    }
    static async saveDraft(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const { sessionId, questionId, answerText } = req.body;
            if (!sessionId || !questionId || answerText === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'sessionId, questionId, and answerText are required',
                });
            }
            const draft = await assessment_session_service_1.AssessmentSessionService.saveAnswerDraft(sessionId, req.user.id, questionId, answerText);
            return res.status(200).json({ success: true, data: draft });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to save draft' });
        }
    }
    static async getReview(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const review = await assessment_session_service_1.AssessmentSessionService.getSessionReview(req.params.id, req.user.id);
            return res.status(200).json({ success: true, data: review });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to get review' });
        }
    }
    static async submit(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }
            const result = await assessment_session_service_1.AssessmentSessionService.submitSession(req.params.id, req.user.id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Submission failed' });
        }
    }
}
exports.AssessmentSessionController = AssessmentSessionController;
