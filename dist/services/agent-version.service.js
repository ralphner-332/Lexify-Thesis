"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentVersionService = void 0;
const prisma_1 = require("../lib/prisma");
const audit_service_1 = require("./audit.service");
class AgentVersionService {
    static async listVersions() {
        const versions = await prisma_1.prisma.agentVersion.findMany({
            orderBy: { createdAt: 'asc' },
        });
        return versions.map(this.deserializeVersion);
    }
    static async getVersionById(id) {
        const version = await prisma_1.prisma.agentVersion.findUnique({
            where: { id },
        });
        if (!version) {
            throw new Error('Agent version not found');
        }
        return this.deserializeVersion(version);
    }
    static async getActiveVersion() {
        const version = await prisma_1.prisma.agentVersion.findFirst({
            where: { isActive: true },
        });
        if (!version) {
            // Fallback to V1
            const v1 = await prisma_1.prisma.agentVersion.findFirst({
                where: { versionTag: 'V1' },
            });
            return v1 ? this.deserializeVersion(v1) : null;
        }
        return this.deserializeVersion(version);
    }
    static async createDraftVersion(input, user) {
        const existing = await prisma_1.prisma.agentVersion.findUnique({
            where: { versionTag: input.versionTag.toUpperCase() },
        });
        if (existing) {
            throw new Error(`Version tag ${input.versionTag} already exists`);
        }
        const created = await prisma_1.prisma.agentVersion.create({
            data: {
                versionTag: input.versionTag.trim().toUpperCase(),
                label: input.label.trim(),
                description: input.description.trim(),
                systemInstructions: input.systemInstructions.trim(),
                skillsDefinition: JSON.stringify(input.skillsDefinition || {}),
                rubricSnapshot: JSON.stringify(input.rubricSnapshot || {}),
                evaluationPatterns: JSON.stringify(input.evaluationPatterns || {}),
                modelConfig: JSON.stringify(input.modelConfig || {
                    provider: 'google',
                    modelId: 'gemini-2.0-flash',
                    temperature: 0.2,
                    topP: 0.95,
                }),
                parentVersionId: input.parentVersionId || null,
                changelog: JSON.stringify(input.changelog || []),
                isLocked: false,
                isActive: false,
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'CREATE_AGENT_VERSION_DRAFT',
            entityType: 'AGENT_VERSION',
            entityId: created.id,
            details: { versionTag: created.versionTag, label: created.label },
            isDemo: true,
        });
        return this.deserializeVersion(created);
    }
    /**
     * Branches a new version (e.g. V1 -> V2, V2 -> V3) from an existing parent version,
     * preserving parent reference and appending structured changelog entries.
     */
    static async branchNextVersion(input, user) {
        const parentVersion = await prisma_1.prisma.agentVersion.findUnique({
            where: { versionTag: input.parentVersionTag.toUpperCase() },
        });
        if (!parentVersion) {
            throw new Error(`Parent version ${input.parentVersionTag} not found.`);
        }
        const existingTarget = await prisma_1.prisma.agentVersion.findUnique({
            where: { versionTag: input.newVersionTag.toUpperCase() },
        });
        if (existingTarget) {
            throw new Error(`Target version tag ${input.newVersionTag} already exists.`);
        }
        // Clone parent components with overrides
        const systemInstructions = input.systemInstructions ?? parentVersion.systemInstructions;
        const skillsDefinition = input.skillsDefinition
            ? JSON.stringify(input.skillsDefinition)
            : parentVersion.skillsDefinition;
        const rubricSnapshot = input.rubricSnapshot
            ? JSON.stringify(input.rubricSnapshot)
            : parentVersion.rubricSnapshot;
        const evaluationPatterns = input.evaluationPatterns
            ? JSON.stringify(input.evaluationPatterns)
            : parentVersion.evaluationPatterns;
        const modelConfig = input.modelConfig
            ? JSON.stringify(input.modelConfig)
            : parentVersion.modelConfig;
        const parentChangelog = safeParseJson(parentVersion.changelog, []);
        const newChangelogEntry = {
            ...input.changelogEntry,
            approverId: user?.id || 'admin',
            approverEmail: user?.email || 'admin@yawa.local',
            timestamp: new Date().toISOString(),
        };
        const combinedChangelog = [...parentChangelog, newChangelogEntry];
        const created = await prisma_1.prisma.agentVersion.create({
            data: {
                versionTag: input.newVersionTag.trim().toUpperCase(),
                label: input.label.trim(),
                description: input.description.trim(),
                systemInstructions,
                skillsDefinition,
                rubricSnapshot,
                evaluationPatterns,
                modelConfig,
                parentVersionId: parentVersion.id,
                changelog: JSON.stringify(combinedChangelog),
                isLocked: false,
                isActive: false,
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'BRANCH_AGENT_VERSION',
            entityType: 'AGENT_VERSION',
            entityId: created.id,
            details: {
                parentVersionTag: input.parentVersionTag,
                newVersionTag: created.versionTag,
                changelogEntry: newChangelogEntry,
            },
            isDemo: true,
        });
        return this.deserializeVersion(created);
    }
    static async updateDraftVersion(id, input, user) {
        const existing = await prisma_1.prisma.agentVersion.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Agent version not found');
        }
        if (existing.isLocked) {
            throw new Error(`Version ${existing.versionTag} is locked as an immutable research snapshot and cannot be modified.`);
        }
        const data = {};
        if (input.label !== undefined)
            data.label = input.label.trim();
        if (input.description !== undefined)
            data.description = input.description.trim();
        if (input.systemInstructions !== undefined)
            data.systemInstructions = input.systemInstructions.trim();
        if (input.skillsDefinition !== undefined)
            data.skillsDefinition = JSON.stringify(input.skillsDefinition);
        if (input.rubricSnapshot !== undefined)
            data.rubricSnapshot = JSON.stringify(input.rubricSnapshot);
        if (input.evaluationPatterns !== undefined)
            data.evaluationPatterns = JSON.stringify(input.evaluationPatterns);
        if (input.modelConfig !== undefined)
            data.modelConfig = JSON.stringify(input.modelConfig);
        const updated = await prisma_1.prisma.agentVersion.update({
            where: { id },
            data,
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'UPDATE_AGENT_VERSION_DRAFT',
            entityType: 'AGENT_VERSION',
            entityId: updated.id,
            details: { versionTag: updated.versionTag, updatedFields: Object.keys(data) },
            isDemo: true,
        });
        return this.deserializeVersion(updated);
    }
    static async lockVersion(id, user) {
        const existing = await prisma_1.prisma.agentVersion.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Agent version not found');
        }
        if (existing.isLocked) {
            return this.deserializeVersion(existing);
        }
        const locked = await prisma_1.prisma.agentVersion.update({
            where: { id },
            data: {
                isLocked: true,
                lockedAt: new Date(),
            },
        });
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'LOCK_AGENT_VERSION_SNAPSHOT',
            entityType: 'AGENT_VERSION',
            entityId: locked.id,
            details: { versionTag: locked.versionTag, lockedAt: locked.lockedAt },
            isDemo: true,
        });
        return this.deserializeVersion(locked);
    }
    static async activateVersion(id, user) {
        const target = await prisma_1.prisma.agentVersion.findUnique({ where: { id } });
        if (!target) {
            throw new Error('Agent version not found');
        }
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.agentVersion.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            }),
            prisma_1.prisma.agentVersion.update({
                where: { id },
                data: { isActive: true },
            }),
        ]);
        await audit_service_1.AuditService.logAction({
            userId: user?.id,
            userEmail: user?.email,
            action: 'ACTIVATE_AGENT_VERSION',
            entityType: 'AGENT_VERSION',
            entityId: target.id,
            details: { versionTag: target.versionTag },
            isDemo: true,
        });
        const active = await prisma_1.prisma.agentVersion.findUnique({ where: { id } });
        return this.deserializeVersion(active);
    }
    static async compareVersions(versionIdA, versionIdB) {
        const [vA, vB] = await Promise.all([
            this.getVersionById(versionIdA),
            this.getVersionById(versionIdB),
        ]);
        return {
            versionA: vA,
            versionB: vB,
            differences: {
                systemInstructionsDiff: vA.systemInstructions !== vB.systemInstructions,
                skillsDiff: JSON.stringify(vA.skillsDefinition) !== JSON.stringify(vB.skillsDefinition),
                rubricSnapshotDiff: JSON.stringify(vA.rubricSnapshot) !== JSON.stringify(vB.rubricSnapshot),
                evaluationPatternsDiff: JSON.stringify(vA.evaluationPatterns) !== JSON.stringify(vB.evaluationPatterns),
                modelConfigDiff: JSON.stringify(vA.modelConfig) !== JSON.stringify(vB.modelConfig),
            },
        };
    }
    static deserializeVersion(v) {
        return {
            ...v,
            skillsDefinition: safeParseJson(v.skillsDefinition, {}),
            rubricSnapshot: safeParseJson(v.rubricSnapshot, {}),
            evaluationPatterns: safeParseJson(v.evaluationPatterns, {}),
            modelConfig: safeParseJson(v.modelConfig, {}),
            changelog: safeParseJson(v.changelog, []),
        };
    }
}
exports.AgentVersionService = AgentVersionService;
function safeParseJson(str, fallback = {}) {
    if (!str)
        return fallback;
    if (typeof str === 'object')
        return str;
    try {
        return JSON.parse(str);
    }
    catch {
        return fallback;
    }
}
