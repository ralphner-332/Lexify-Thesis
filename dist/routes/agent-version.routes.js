"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_version_controller_1 = require("../controllers/agent-version.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Read active version / list (authenticated)
router.get('/', auth_1.authenticateToken, agent_version_controller_1.AgentVersionController.list);
router.get('/active', auth_1.authenticateToken, agent_version_controller_1.AgentVersionController.getActive);
router.get('/compare', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), agent_version_controller_1.AgentVersionController.compare);
router.get('/:id', auth_1.authenticateToken, agent_version_controller_1.AgentVersionController.getById);
// Admin-only snapshot management
router.post('/branch', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), agent_version_controller_1.AgentVersionController.branchVersion);
router.post('/', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), agent_version_controller_1.AgentVersionController.createDraft);
router.put('/:id', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), agent_version_controller_1.AgentVersionController.updateDraft);
router.post('/:id/lock', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), agent_version_controller_1.AgentVersionController.lockVersion);
router.post('/:id/activate', auth_1.authenticateToken, (0, rbac_1.requireRole)('ADMIN'), agent_version_controller_1.AgentVersionController.activateVersion);
exports.default = router;
