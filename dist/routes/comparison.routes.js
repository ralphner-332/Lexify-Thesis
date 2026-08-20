"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comparison_controller_1 = require("../controllers/comparison.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Researcher comparison matrix endpoint
router.get('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), comparison_controller_1.ComparisonController.getComparisons);
exports.default = router;
