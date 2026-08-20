"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const evaluation_controller_1 = require("../controllers/evaluation.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Student feedback for own submitted session
router.get('/session/:sessionId', auth_1.authenticateToken, (0, rbac_1.requireRole)('STUDENT', 'ADMIN'), evaluation_controller_1.EvaluationController.getStudentSessionEvaluations);
// Researcher admin evaluation explorer
router.get('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), evaluation_controller_1.EvaluationController.getAdminEvaluations);
exports.default = router;
