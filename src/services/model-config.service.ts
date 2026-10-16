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

  /**
   * Retrieves global system settings (student display model, accuracy level, active test set).
   */
  static async getSystemSettings(): Promise<{
    studentDisplayModel: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
    accuracyLevel: 'STRICT' | 'STANDARD' | 'LENIENT';
    activeTestSet: string;
    testSetStatuses: Record<'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4', 'DRAFT' | 'ACTIVE' | 'ARCHIVED'>;
  }> {
    let setting = await prisma.systemSetting.findUnique({
      where: { id: 'global' },
    });

    const defaultStatuses: Record<'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4', 'DRAFT' | 'ACTIVE' | 'ARCHIVED'> = {
      TEST_1: 'ACTIVE',
      TEST_2: 'DRAFT',
      TEST_3: 'DRAFT',
      TEST_4: 'DRAFT',
    };

    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: {
          id: 'global',
          studentDisplayModel: 'MODEL_A',
          accuracyLevel: 'STANDARD',
          activeTestSet: 'TEST_1',
          testSetStatuses: JSON.stringify(defaultStatuses),
        },
      });
    }

    let parsedStatuses = defaultStatuses;
    if (setting.testSetStatuses) {
      try {
        parsedStatuses = { ...defaultStatuses, ...JSON.parse(setting.testSetStatuses) };
      } catch {
        parsedStatuses = defaultStatuses;
      }
    }

    return {
      studentDisplayModel: (setting.studentDisplayModel as any) || 'MODEL_A',
      accuracyLevel: (setting.accuracyLevel as any) || 'STANDARD',
      activeTestSet: setting.activeTestSet || 'TEST_1',
      testSetStatuses: parsedStatuses,
    };
  }

  /**
   * Updates global system settings without modifying stored evaluation records.
   */
  static async updateSystemSettings(
    data: {
      studentDisplayModel?: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
      accuracyLevel?: 'STRICT' | 'STANDARD' | 'LENIENT';
      activeTestSet?: string;
      testSetStatuses?: Record<string, 'DRAFT' | 'ACTIVE' | 'ARCHIVED'>;
    },
    adminUserId?: string
  ) {
    const validSlots = ['MODEL_A', 'MODEL_B', 'MODEL_C'];
    const validLevels = ['STRICT', 'STANDARD', 'LENIENT'];
    const validSets = ['TEST_1', 'TEST_2', 'TEST_3', 'TEST_4'];

    if (data.studentDisplayModel && !validSlots.includes(data.studentDisplayModel)) {
      throw new Error(`Invalid student display model slot: ${data.studentDisplayModel}`);
    }

    if (data.accuracyLevel && !validLevels.includes(data.accuracyLevel)) {
      throw new Error(`Invalid accuracy level: ${data.accuracyLevel}`);
    }

    if (data.activeTestSet && !validSets.includes(data.activeTestSet)) {
      throw new Error(`Invalid active test set: ${data.activeTestSet}`);
    }

    const current = await this.getSystemSettings();
    let updatedStatuses = current.testSetStatuses;

    if (data.testSetStatuses) {
      updatedStatuses = {
        ...current.testSetStatuses,
        ...data.testSetStatuses,
      };
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: {
        ...(data.studentDisplayModel && { studentDisplayModel: data.studentDisplayModel }),
        ...(data.accuracyLevel && { accuracyLevel: data.accuracyLevel }),
        ...(data.activeTestSet && { activeTestSet: data.activeTestSet }),
        testSetStatuses: JSON.stringify(updatedStatuses),
      },
      create: {
        id: 'global',
        studentDisplayModel: data.studentDisplayModel || 'MODEL_A',
        accuracyLevel: data.accuracyLevel || 'STANDARD',
        activeTestSet: data.activeTestSet || 'TEST_1',
        testSetStatuses: JSON.stringify(updatedStatuses),
      },
    });

    await AuditService.logAction({
      userId: adminUserId || 'system',
      action: 'UPDATE_SYSTEM_SETTINGS',
      entityType: 'SYSTEM_SETTINGS',
      entityId: 'global',
      details: {
        studentDisplayModel: updated.studentDisplayModel,
        accuracyLevel: updated.accuracyLevel,
        activeTestSet: updated.activeTestSet,
        testSetStatuses: updatedStatuses,
      },
      isDemo: true,
    });

    return {
      studentDisplayModel: updated.studentDisplayModel as 'MODEL_A' | 'MODEL_B' | 'MODEL_C',
      accuracyLevel: updated.accuracyLevel as 'STRICT' | 'STANDARD' | 'LENIENT',
      activeTestSet: updated.activeTestSet,
      testSetStatuses: updatedStatuses,
    };
  }

  /**
   * Publishes a test set making it ACTIVE for student assessment sessions.
   * Modifies ONLY the target test without modifying any other tests.
   */
  static async publishTestSet(testSet: 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4', adminUserId?: string) {
    const current = await this.getSystemSettings();
    const newStatuses = { ...current.testSetStatuses };

    // Set ONLY target to ACTIVE
    newStatuses[testSet] = 'ACTIVE';

    return this.updateSystemSettings(
      {
        testSetStatuses: newStatuses,
      },
      adminUserId
    );
  }

  /**
   * Archives a test set, hiding it from student assessment while preserving historical records.
   * Modifies ONLY the target test without modifying any other tests.
   */
  static async archiveTestSet(testSet: 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4', adminUserId?: string) {
    const current = await this.getSystemSettings();
    const newStatuses = { ...current.testSetStatuses };

    // Set ONLY target to ARCHIVED
    newStatuses[testSet] = 'ARCHIVED';

    return this.updateSystemSettings(
      {
        testSetStatuses: newStatuses,
      },
      adminUserId
    );
  }

  /**
   * Sets a test set status to DRAFT.
   * Modifies ONLY the target test without modifying any other tests.
   */
  static async draftTestSet(testSet: 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4', adminUserId?: string) {
    const current = await this.getSystemSettings();
    const newStatuses = { ...current.testSetStatuses };

    // Set ONLY target to DRAFT
    newStatuses[testSet] = 'DRAFT';

    return this.updateSystemSettings(
      {
        testSetStatuses: newStatuses,
      },
      adminUserId
    );
  }
}

