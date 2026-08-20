"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const question_controller_1 = require("../controllers/question.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Student, Expert, Admin can list & view (results filtered by role-specific DTO)
router.get('/', auth_1.authenticateToken, question_controller_1.QuestionController.list);
router.get('/:id', auth_1.authenticateToken, question_controller_1.QuestionController.getById);
// Admin-only mutation routes
router.post('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), question_controller_1.QuestionController.create);
router.put('/:id', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), question_controller_1.QuestionController.update);
router.delete('/:id', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), question_controller_1.QuestionController.delete);
exports.default = router;
