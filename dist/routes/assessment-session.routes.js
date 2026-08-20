"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assessment_session_controller_1 = require("../controllers/assessment-session.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Student-accessible assessment session routes
router.get('/active', auth_1.authenticateToken, (0, rbac_1.requireRole)('STUDENT', 'ADMIN'), assessment_session_controller_1.AssessmentSessionController.getActiveSession);
router.post('/draft', auth_1.authenticateToken, (0, rbac_1.requireRole)('STUDENT', 'ADMIN'), assessment_session_controller_1.AssessmentSessionController.saveDraft);
router.get('/:id/review', auth_1.authenticateToken, (0, rbac_1.requireRole)('STUDENT', 'ADMIN'), assessment_session_controller_1.AssessmentSessionController.getReview);
router.post('/:id/submit', auth_1.authenticateToken, (0, rbac_1.requireRole)('STUDENT', 'ADMIN'), assessment_session_controller_1.AssessmentSessionController.submit);
router.get('/:id', auth_1.authenticateToken, (0, rbac_1.requireRole)('STUDENT', 'ADMIN'), assessment_session_controller_1.AssessmentSessionController.getSessionById);
exports.default = router;
