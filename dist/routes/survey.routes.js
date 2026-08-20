"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const survey_controller_1 = require("../controllers/survey.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Student / Expert active survey routes
router.get('/active', auth_1.authenticateToken, survey_controller_1.SurveyController.getActive);
router.post('/response', auth_1.authenticateToken, survey_controller_1.SurveyController.submitResponse);
// Admin analytics & management routes
router.get('/questionnaires', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), survey_controller_1.SurveyController.listQuestionnaires);
router.get('/responses', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), survey_controller_1.SurveyController.getResponses);
router.get('/summary/:questionnaireId', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), survey_controller_1.SurveyController.getSummaryMetrics);
exports.default = router;
