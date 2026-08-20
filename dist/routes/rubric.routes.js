"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rubric_controller_1 = require("../controllers/rubric.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, rubric_controller_1.RubricController.list);
router.get('/default', auth_1.authenticateToken, rubric_controller_1.RubricController.getDefault);
router.get('/:id', auth_1.authenticateToken, rubric_controller_1.RubricController.getById);
// Admin-only mutations
router.post('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), rubric_controller_1.RubricController.create);
router.put('/:id', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), rubric_controller_1.RubricController.update);
router.delete('/:id', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), rubric_controller_1.RubricController.delete);
exports.default = router;
