import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';

export interface ModelConfigDTO {
  id: string;
  modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  researchName: string;
  modelFamily: string;
  parameterClass: string;
  provider: string;
  exactModelId: string;
  endpointUrl?: string | null;
  apiKeyEnvVar: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemInstructions: string;
  isLocked: boolean;
  isDemo: boolean;
  hasApiKeyConfigured: boolean;
}

export class ModelConfigService {
  /**
   * Retrieves all 3 locked experimental model configurations.
   */
  static async getAllModelConfigs(): Promise<ModelConfigDTO[]> {
    const configs = await prisma.modelConfigSetting.findMany({
      orderBy: { modelSlot: 'asc' },
    });

    return configs.map((c) => ({
      id: c.id,
      modelSlot: c.modelSlot as any,
      researchName: c.researchName,
      modelFamily: c.modelFamily,
      parameterClass: c.parameterClass,
      provider: c.provider,
      exactModelId: c.exactModelId,
      endpointUrl: c.endpointUrl,
      apiKeyEnvVar: c.apiKeyEnvVar,
      temperature: c.temperature,
      topP: c.topP,
      maxTokens: c.maxTokens,
      systemInstructions: c.systemInstructions,
      isLocked: c.isLocked,
      isDemo: c.isDemo,
      hasApiKeyConfigured: Boolean(process.env[c.apiKeyEnvVar]),
    }));
  }

  /**
   * Retrieves a specific model configuration by slot (MODEL_A, MODEL_B, or MODEL_C).
   */
  static async getModelConfigBySlot(modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C'): Promise<ModelConfigDTO | null> {
    const config = await prisma.modelConfigSetting.findUnique({
      where: { modelSlot },
    });

    if (!config) return null;

    return {
      id: config.id,
      modelSlot: config.modelSlot as any,
      researchName: config.researchName,
      modelFamily: config.modelFamily,
      parameterClass: config.parameterClass,
      provider: config.provider,
      exactModelId: config.exactModelId,
      endpointUrl: config.endpointUrl,
      apiKeyEnvVar: config.apiKeyEnvVar,
      temperature: config.temperature,
      topP: config.topP,
      maxTokens: config.maxTokens,
      systemInstructions: config.systemInstructions,
      isLocked: config.isLocked,
      isDemo: config.isDemo,
      hasApiKeyConfigured: Boolean(process.env[config.apiKeyEnvVar]),
    };
  }

  /**
   * Updates an experimental model configuration unless locked for official research.
   */
  static async updateModelConfig(
    modelSlot: 'MODEL_A' | 'MODEL_B' | 'MODEL_C',
    data: {
      provider?: string;
      exactModelId?: string;
      endpointUrl?: string;
      apiKeyEnvVar?: string;
      temperature?: number;
      topP?: number;
      maxTokens?: number;
      systemInstructions?: string;
      isLocked?: boolean;
    },
    adminUserId?: string
  ) {
    const existing = await prisma.modelConfigSetting.findUnique({
      where: { modelSlot },
    });

    if (!existing) {
      throw new Error(`Model configuration for slot ${modelSlot} not found.`);
    }

    if (existing.isLocked && data.isLocked !== false) {
      throw new Error(
        `Cannot modify ${existing.researchName} (${modelSlot}): Model configuration is locked for active research data collection.`
      );
    }

    const updated = await prisma.modelConfigSetting.update({
      where: { modelSlot },
      data: {
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.exactModelId !== undefined && { exactModelId: data.exactModelId }),
        ...(data.endpointUrl !== undefined && { endpointUrl: data.endpointUrl }),
        ...(data.apiKeyEnvVar !== undefined && { apiKeyEnvVar: data.apiKeyEnvVar }),
        ...(data.temperature !== undefined && { temperature: data.temperature }),
        ...(data.topP !== undefined && { topP: data.topP }),
        ...(data.maxTokens !== undefined && { maxTokens: data.maxTokens }),
        ...(data.systemInstructions !== undefined && { systemInstructions: data.systemInstructions }),
        ...(data.isLocked !== undefined && { isLocked: data.isLocked }),
      },
    });

    await AuditService.logAction({
      userId: adminUserId || 'system',
      action: 'UPDATE_MODEL_CONFIG',
      entityType: 'MODEL_CONFIG',
      entityId: updated.id,
      details: {
        modelSlot,
        researchName: updated.researchName,
        exactModelId: updated.exactModelId,
        provider: updated.provider,
        isLocked: updated.isLocked,
      },
      isDemo: updated.isDemo,
    });

    return updated;
  }

  /**
   * Toggles the global research lock for all 3 experimental models.
   */
  static async setGlobalResearchLock(isLocked: boolean, adminUserId?: string) {
    await prisma.modelConfigSetting.updateMany({
      data: { isLocked },
    });

    await AuditService.logAction({
      userId: adminUserId || 'system',
      action: isLocked ? 'LOCK_RESEARCH_MODELS' : 'UNLOCK_RESEARCH_MODELS',
      entityType: 'MODEL_CONFIG',
      entityId: 'all-slots',
      details: { isLocked },
      isDemo: true,
    });

    return this.getAllModelConfigs();
  }
}
