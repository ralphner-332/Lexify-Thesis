"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expert_evaluation_controller_1 = require("../controllers/expert-evaluation.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Expert endpoints
router.get('/queue', auth_1.authenticateToken, (0, rbac_1.requireRole)('EXPERT', 'ADMIN'), expert_evaluation_controller_1.ExpertEvaluationController.getQueue);
router.get('/submission/:sessionId/:questionId', auth_1.authenticateToken, (0, rbac_1.requireRole)('EXPERT', 'ADMIN'), expert_evaluation_controller_1.ExpertEvaluationController.getSubmission);
router.post('/draft', auth_1.authenticateToken, (0, rbac_1.requireRole)('EXPERT', 'ADMIN'), expert_evaluation_controller_1.ExpertEvaluationController.saveDraft);
router.post('/submit', auth_1.authenticateToken, (0, rbac_1.requireRole)('EXPERT', 'ADMIN'), expert_evaluation_controller_1.ExpertEvaluationController.submitEvaluation);
// Researcher admin query endpoint
router.get('/evaluations', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), expert_evaluation_controller_1.ExpertEvaluationController.getEvaluations);
exports.default = router;
