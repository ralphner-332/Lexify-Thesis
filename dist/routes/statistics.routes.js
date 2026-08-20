"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statistics_controller_1 = require("../controllers/statistics.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Admin descriptive research statistics
router.get('/progression', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), statistics_controller_1.StatisticsController.getProgression);
exports.default = router;
