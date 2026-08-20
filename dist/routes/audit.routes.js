"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("../controllers/audit.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Admin-only read-only audit log inspection
router.get('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), audit_controller_1.AuditController.list);
exports.default = router;
