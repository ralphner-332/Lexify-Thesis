"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const refinement_controller_1 = require("../controllers/refinement.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Admin-only refinement workflow routes
router.get('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), refinement_controller_1.RefinementController.list);
router.post('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), refinement_controller_1.RefinementController.create);
router.put('/:id', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), refinement_controller_1.RefinementController.update);
exports.default = router;
