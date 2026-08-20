"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const export_controller_1 = require("../controllers/export.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Admin-only research export and reporting endpoints
router.get('/json', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), export_controller_1.ExportController.getBundleJSON);
router.get('/csv', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), export_controller_1.ExportController.getDatasetsCSV);
router.get('/academic-report', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), export_controller_1.ExportController.getAcademicReport);
exports.default = router;
