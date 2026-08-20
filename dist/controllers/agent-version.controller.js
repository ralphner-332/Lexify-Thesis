"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentVersionController = void 0;
const agent_version_service_1 = require("../services/agent-version.service");
class AgentVersionController {
    static async list(req, res) {
        try {
            const versions = await agent_version_service_1.AgentVersionService.listVersions();
            return res.status(200).json({ success: true, data: versions });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to list agent versions' });
        }
    }
    static async getActive(req, res) {
        try {
            const version = await agent_version_service_1.AgentVersionService.getActiveVersion();
            return res.status(200).json({ success: true, data: version });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to fetch active version' });
        }
    }
    static async getById(req, res) {
        try {
            const version = await agent_version_service_1.AgentVersionService.getVersionById(req.params.id);
            return res.status(200).json({ success: true, data: version });
        }
        catch (error) {
            return res.status(404).json({ success: false, error: error.message || 'Agent version not found' });
        }
    }
    static async createDraft(req, res) {
        try {
            const { versionTag, label, description, systemInstructions, skillsDefinition, rubricSnapshot, evaluationPatterns, modelConfig } = req.body;
            if (!versionTag || !label || !description || !systemInstructions) {
                return res.status(400).json({
                    success: false,
                    error: 'Version tag, label, description, and system instructions are required',
                });
            }
            const created = await agent_version_service_1.AgentVersionService.createDraftVersion({
                versionTag,
                label,
                description,
                systemInstructions,
                skillsDefinition,
                rubricSnapshot,
                evaluationPatterns,
                modelConfig,
            }, req.user);
            return res.status(201).json({ success: true, data: created });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to create agent version draft' });
        }
    }
    static async updateDraft(req, res) {
        try {
            const updated = await agent_version_service_1.AgentVersionService.updateDraftVersion(req.params.id, req.body, req.user);
            return res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to update agent version draft' });
        }
    }
    static async lockVersion(req, res) {
        try {
            const locked = await agent_version_service_1.AgentVersionService.lockVersion(req.params.id, req.user);
            return res.status(200).json({
                success: true,
                message: `Version ${locked.versionTag} successfully locked as an immutable research snapshot.`,
                data: locked,
            });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to lock agent version' });
        }
    }
    static async activateVersion(req, res) {
        try {
            const active = await agent_version_service_1.AgentVersionService.activateVersion(req.params.id, req.user);
            return res.status(200).json({
                success: true,
                message: `Version ${active.versionTag} is now the active evaluation agent.`,
                data: active,
            });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to activate agent version' });
        }
    }
    static async compare(req, res) {
        try {
            const { vA, vB } = req.query;
            if (!vA || !vB) {
                return res.status(400).json({ success: false, error: 'Query parameters vA and vB are required' });
            }
            const comparison = await agent_version_service_1.AgentVersionService.compareVersions(String(vA), String(vB));
            return res.status(200).json({ success: true, data: comparison });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to compare versions' });
        }
    }
    static async branchVersion(req, res) {
        try {
            const { parentVersionTag, newVersionTag, label, description, systemInstructions, skillsDefinition, rubricSnapshot, evaluationPatterns, modelConfig, changelogEntry } = req.body;
            if (!parentVersionTag || !newVersionTag || !label || !description || !changelogEntry) {
                return res.status(400).json({
                    success: false,
                    error: 'parentVersionTag, newVersionTag, label, description, and changelogEntry are required',
                });
            }
            const branched = await agent_version_service_1.AgentVersionService.branchNextVersion({
                parentVersionTag,
                newVersionTag,
                label,
                description,
                systemInstructions,
                skillsDefinition,
                rubricSnapshot,
                evaluationPatterns,
                modelConfig,
                changelogEntry,
            }, req.user);
            return res.status(201).json({
                success: true,
                message: `Version ${branched.versionTag} branched successfully from ${parentVersionTag}.`,
                data: branched,
            });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message || 'Failed to branch agent version' });
        }
    }
}
exports.AgentVersionController = AgentVersionController;
