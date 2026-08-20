"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const final_evaluation_controller_1 = require("../controllers/final-evaluation.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Expert unblinded review queue & submission
router.get('/queue', auth_1.authenticateToken, (0, rbac_1.requireRole)('EXPERT', 'ADMIN'), final_evaluation_controller_1.FinalEvaluationController.getQueue);
router.get('/evaluation/:evaluationId', auth_1.authenticateToken, (0, rbac_1.requireRole)('EXPERT', 'ADMIN'), final_evaluation_controller_1.FinalEvaluationController.getEvaluationForReview);
router.post('/evaluation/:evaluationId', auth_1.authenticateToken, (0, rbac_1.requireRole)('EXPERT', 'ADMIN'), final_evaluation_controller_1.FinalEvaluationController.submitReview);
// Researcher query endpoint
router.get('/reviews', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), final_evaluation_controller_1.FinalEvaluationController.listReviews);
exports.default = router;
