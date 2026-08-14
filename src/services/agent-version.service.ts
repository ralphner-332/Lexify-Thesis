import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';

export interface ModelConfigInput {
  provider: 'google' | 'anthropic' | 'openai' | 'custom' | string;
  modelId: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  [key: string]: any;
}

export interface CreateAgentVersionInput {
  versionTag: string; // e.g. "V1", "V2", "V3"
  label: string;
  description: string;
  systemInstructions: string;
  skillsDefinition?: Record<string, any>;
  rubricSnapshot?: Record<string, any>;
  evaluationPatterns?: Record<string, any>;
  modelConfig?: ModelConfigInput;
}

export class AgentVersionService {
  static async listVersions() {
    const versions = await prisma.agentVersion.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return versions.map(this.deserializeVersion);
  }

  static async getVersionById(id: string) {
    const version = await prisma.agentVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new Error('Agent version not found');
    }

    return this.deserializeVersion(version);
  }

  static async getActiveVersion() {
    const version = await prisma.agentVersion.findFirst({
      where: { isActive: true },
    });

    if (!version) {
      // Fallback to V1
      const v1 = await prisma.agentVersion.findFirst({
        where: { versionTag: 'V1' },
      });
      return v1 ? this.deserializeVersion(v1) : null;
    }

    return this.deserializeVersion(version);
  }

  static async createDraftVersion(input: CreateAgentVersionInput, user?: { id: string; email: string }) {
    const existing = await prisma.agentVersion.findUnique({
      where: { versionTag: input.versionTag.toUpperCase() },
    });

    if (existing) {
      throw new Error(`Version tag ${input.versionTag} already exists`);
    }

    const created = await prisma.agentVersion.create({
      data: {
        versionTag: input.versionTag.trim().toUpperCase(),
        label: input.label.trim(),
        description: input.description.trim(),
        systemInstructions: input.systemInstructions.trim(),
        skillsDefinition: JSON.stringify(input.skillsDefinition || {}),
        rubricSnapshot: JSON.stringify(input.rubricSnapshot || {}),
        evaluationPatterns: JSON.stringify(input.evaluationPatterns || {}),
        modelConfig: JSON.stringify(
          input.modelConfig || {
            provider: 'google',
            modelId: 'gemini-2.0-flash',
            temperature: 0.2,
            topP: 0.95,
          }
        ),
        isLocked: false,
        isActive: false,
      },
    });

    await AuditService.logAction({
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

  static async updateDraftVersion(
    id: string,
    input: Partial<CreateAgentVersionInput>,
    user?: { id: string; email: string }
  ) {
    const existing = await prisma.agentVersion.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Agent version not found');
    }

    if (existing.isLocked) {
      throw new Error(
        `Version ${existing.versionTag} is locked as an immutable research snapshot and cannot be modified.`
      );
    }

    const data: any = {};
    if (input.label !== undefined) data.label = input.label.trim();
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.systemInstructions !== undefined) data.systemInstructions = input.systemInstructions.trim();
    if (input.skillsDefinition !== undefined)
      data.skillsDefinition = JSON.stringify(input.skillsDefinition);
    if (input.rubricSnapshot !== undefined) data.rubricSnapshot = JSON.stringify(input.rubricSnapshot);
    if (input.evaluationPatterns !== undefined)
      data.evaluationPatterns = JSON.stringify(input.evaluationPatterns);
    if (input.modelConfig !== undefined) data.modelConfig = JSON.stringify(input.modelConfig);

    const updated = await prisma.agentVersion.update({
      where: { id },
      data,
    });

    await AuditService.logAction({
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

  static async lockVersion(id: string, user?: { id: string; email: string }) {
    const existing = await prisma.agentVersion.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Agent version not found');
    }

    if (existing.isLocked) {
      return this.deserializeVersion(existing);
    }

    const locked = await prisma.agentVersion.update({
      where: { id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
      },
    });

    await AuditService.logAction({
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

  static async activateVersion(id: string, user?: { id: string; email: string }) {
    const target = await prisma.agentVersion.findUnique({ where: { id } });
    if (!target) {
      throw new Error('Agent version not found');
    }

    await prisma.$transaction([
      prisma.agentVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      prisma.agentVersion.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    await AuditService.logAction({
      userId: user?.id,
      userEmail: user?.email,
      action: 'ACTIVATE_AGENT_VERSION',
      entityType: 'AGENT_VERSION',
      entityId: target.id,
      details: { versionTag: target.versionTag },
      isDemo: true,
    });

    const active = await prisma.agentVersion.findUnique({ where: { id } });
    return this.deserializeVersion(active!);
  }

  static async compareVersions(versionIdA: string, versionIdB: string) {
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
        evaluationPatternsDiff:
          JSON.stringify(vA.evaluationPatterns) !== JSON.stringify(vB.evaluationPatterns),
        modelConfigDiff: JSON.stringify(vA.modelConfig) !== JSON.stringify(vB.modelConfig),
      },
    };
  }

  private static deserializeVersion(v: any) {
    return {
      ...v,
      skillsDefinition: safeParseJson(v.skillsDefinition),
      rubricSnapshot: safeParseJson(v.rubricSnapshot),
      evaluationPatterns: safeParseJson(v.evaluationPatterns),
      modelConfig: safeParseJson(v.modelConfig),
    };
  }
}

function safeParseJson(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
