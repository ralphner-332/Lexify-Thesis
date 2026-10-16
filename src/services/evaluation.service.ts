import { prisma } from '../lib/prisma';
import { AiEvaluatorService } from './ai-evaluator.service';
import { RubricService } from './rubric.service';
import { AgentVersionService } from './agent-version.service';
import { ModelConfigService, ModelConfigDTO } from './model-config.service';
import { AuditService } from './audit.service';
import { EvaluationDTO } from '../dto/evaluation.dto';
import { OpenAICompatibleProvider } from '../providers/openai-compatible.provider';

export class EvaluationService {
  /**
   * Evaluates all submitted answers in a session sequentially across the 3 locked experimental models:
   * 1. MODEL_A: Meta Llama 3.2 3B (llama3.2:3b)
   * 2. MODEL_B: Microsoft Phi-4-mini (phi4-mini:3.8b)
   * 3. MODEL_C: Google Gemma 2 2B (gemma2:2b)
   *
   * Sequential execution pipeline:
   * MODEL_A -> evaluate -> persist -> unload
   * MODEL_B -> evaluate -> persist -> unload
   * MODEL_C -> evaluate -> persist -> unload
   */
  static async evaluateSessionSubmissions(
    session: any,
    onProgress?: (progress: {
      completed: number;
      total: number;
      modelSlot: string;
      modelName: string;
      questionCode: string;
      status: 'PROCESSING' | 'COMPLETED';
    }) => Promise<void>
  ) {
    const fullQuestions: any[] = safeParseJson(session.questionsSnapshot, []);
    const drafts = session.drafts || [];

    // Fetch active Rubric, baseline AgentVersion, all 3 locked Model Configurations, and System Settings
    const [activeRubric, activeAgentVersion, modelConfigs, systemSettings] = await Promise.all([
      RubricService.getDefaultRubric(),
      AgentVersionService.getActiveVersion(),
      ModelConfigService.getAllModelConfigs(),
      ModelConfigService.getSystemSettings(),
    ]);

    if (!activeRubric) {
      throw new Error('No active Rubric found for evaluation.');
    }

    if (!activeAgentVersion) {
      throw new Error('No active Agent Version found for evaluation baseline.');
    }

    // Default fallback configurations if not seeded in DB
    const modelsToEvaluate: ModelConfigDTO[] =
      modelConfigs.length >= 3
        ? modelConfigs
        : [
            {
              id: 'model-a',
              modelSlot: 'MODEL_A',
              researchName: 'Meta Llama 3.2 3B',
              modelFamily: 'Llama 3.2',
              parameterClass: '3.2B',
              provider: 'ollama',
              exactModelId: 'llama3.2:3b',
              endpointUrl: 'http://localhost:11434/v1/chat/completions',
              apiKeyEnvVar: 'LOCAL_INFERENCE',
              temperature: 0.2,
              topP: 0.95,
              maxTokens: 2048,
              systemInstructions: activeAgentVersion.systemInstructions,
              isLocked: false,
              isDemo: true,
              hasApiKeyConfigured: true,
            },
            {
              id: 'model-b',
              modelSlot: 'MODEL_B',
              researchName: 'Microsoft Phi-4-mini',
              modelFamily: 'Phi-4',
              parameterClass: '3.8B',
              provider: 'ollama',
              exactModelId: 'phi4-mini:3.8b',
              endpointUrl: 'http://localhost:11434/v1/chat/completions',
              apiKeyEnvVar: 'LOCAL_INFERENCE',
              temperature: 0.2,
              topP: 0.95,
              maxTokens: 2048,
              systemInstructions: activeAgentVersion.systemInstructions,
              isLocked: false,
              isDemo: true,
              hasApiKeyConfigured: true,
            },
            {
              id: 'model-c',
              modelSlot: 'MODEL_C',
              researchName: 'Google Gemma 2 2B',
              modelFamily: 'Gemma 2',
              parameterClass: '2.6B',
              provider: 'ollama',
              exactModelId: 'gemma2:2b',
              endpointUrl: 'http://localhost:11434/v1/chat/completions',
              apiKeyEnvVar: 'LOCAL_INFERENCE',
              temperature: 0.2,
              topP: 0.95,
              maxTokens: 2048,
              systemInstructions: activeAgentVersion.systemInstructions,
              isLocked: false,
              isDemo: true,
              hasApiKeyConfigured: true,
            },
          ];

    const rubricSnapshot = activeRubric.criteria;
    const createdEvaluations: any[] = [];
    const totalEvaluations = modelsToEvaluate.length * fullQuestions.length;
    let completedEvaluations = 0;

    // Model-Sequential Execution Pipeline:
    // MODEL_A -> evaluate all questions -> unload
    // MODEL_B -> evaluate all questions -> unload
    // MODEL_C -> evaluate all questions -> unload
    for (const modelConfig of modelsToEvaluate) {
      console.log(`[MODEL PIPELINE] Starting batch evaluation for ${modelConfig.modelSlot} (${modelConfig.researchName})...`);

      for (const questionSnapshot of fullQuestions) {
        const draft = drafts.find((d: any) => d.questionId === questionSnapshot.id);
        const answerText = draft?.answerText || '';

        // Check if this model evaluation already exists for this session + question
        const existingEval = await prisma.evaluation.findFirst({
          where: {
            sessionId: session.id,
            questionId: questionSnapshot.id,
            modelSlot: modelConfig.modelSlot,
          },
        });

        if (existingEval) {
          createdEvaluations.push(existingEval);
          completedEvaluations++;
          if (onProgress) {
            await onProgress({
              completed: completedEvaluations,
              total: totalEvaluations,
              modelSlot: modelConfig.modelSlot,
              modelName: modelConfig.researchName,
              questionCode: questionSnapshot.code,
              status: completedEvaluations >= totalEvaluations ? 'COMPLETED' : 'PROCESSING',
            });
          }
          continue;
        }

        // Notify that this question evaluation is starting
        if (onProgress) {
          await onProgress({
            completed: completedEvaluations,
            total: totalEvaluations,
            modelSlot: modelConfig.modelSlot,
            modelName: modelConfig.researchName,
            questionCode: questionSnapshot.code,
            status: 'PROCESSING',
          });
        }

        const modelConfigSnapshot = {
          modelSlot: modelConfig.modelSlot,
          researchName: modelConfig.researchName,
          modelFamily: modelConfig.modelFamily,
          parameterClass: modelConfig.parameterClass,
          provider: modelConfig.provider,
          modelId: modelConfig.exactModelId,
          exactModelId: modelConfig.exactModelId,
          quantization: 'Q4_K_M',
          runtime: modelConfig.provider === 'ollama' ? 'ollama-local' : `${modelConfig.provider}-api`,
          endpointUrl: modelConfig.endpointUrl || 'http://localhost:11434/v1/chat/completions',
          temperature: modelConfig.temperature,
          topP: modelConfig.topP,
          maxTokens: modelConfig.maxTokens,
          apiKeyEnvVar: modelConfig.apiKeyEnvVar,
          accuracyLevel: systemSettings.accuracyLevel,
        };

        try {
          const evalResult = await AiEvaluatorService.evaluateAnswer({
            questionSnapshot,
            modelConfigSnapshot,
            rubricSnapshot,
            systemInstructions: modelConfig.systemInstructions || activeAgentVersion.systemInstructions,
            studentAnswer: answerText,
            isDemo: session.isDemo,
            accuracyLevel: systemSettings.accuracyLevel,
          });

          const createdEval = await prisma.evaluation.create({
            data: {
              sessionId: session.id,
              studentId: session.studentId,
              questionId: questionSnapshot.id,
              agentVersionId: activeAgentVersion.id,
              modelSlot: modelConfig.modelSlot,
              modelFamily: modelConfig.modelFamily,
              exactModelId: modelConfig.exactModelId,
              questionSnapshot: JSON.stringify(questionSnapshot),
              modelConfigSnapshot: JSON.stringify(modelConfigSnapshot),
              rubricSnapshot: JSON.stringify(rubricSnapshot),
              studentAnswer: answerText,
              numericalScore: evalResult.numericalScore,
              maxScore: evalResult.maxScore,
              scoringBasis: evalResult.scoringBasis,
              criterionScores: JSON.stringify(evalResult.criterionScores),
              strengths: JSON.stringify(evalResult.strengths),
              missingElements: JSON.stringify(evalResult.missingElements),
              areasForImprovement: JSON.stringify(evalResult.areasForImprovement),
              lexicalAnalysis: JSON.stringify(evalResult.lexicalAnalysis || {}),
              semanticAnalysis: JSON.stringify(evalResult.semanticAnalysis || {}),
              confidenceScore: evalResult.confidenceScore,
              reviewFlags: JSON.stringify(evalResult.reviewFlags),
              isDemo: session.isDemo,
            },
          });

          await AuditService.logAction({
            userId: session.studentId,
            action: 'CREATE_AI_EVALUATION',
            entityType: 'EVALUATION',
            entityId: createdEval.id,
            details: {
              sessionId: session.id,
              questionCode: questionSnapshot.code,
              modelSlot: modelConfig.modelSlot,
              researchName: modelConfig.researchName,
              exactModelId: modelConfig.exactModelId,
              score: createdEval.numericalScore,
              maxScore: createdEval.maxScore,
              accuracyLevel: systemSettings.accuracyLevel,
            },
            isDemo: session.isDemo,
          });

          console.log(
            `[EVALUATION PROVENANCE] ${questionSnapshot.code} -> ${modelConfig.modelSlot} (${modelConfig.researchName}) -> ${modelConfig.exactModelId} -> ${createdEval.id} -> Raw Score: ${createdEval.numericalScore} (Accuracy: ${systemSettings.accuracyLevel})`
          );

          createdEvaluations.push(createdEval);
          completedEvaluations++;

          if (onProgress) {
            await onProgress({
              completed: completedEvaluations,
              total: totalEvaluations,
              modelSlot: modelConfig.modelSlot,
              modelName: modelConfig.researchName,
              questionCode: questionSnapshot.code,
              status: completedEvaluations >= totalEvaluations ? 'COMPLETED' : 'PROCESSING',
            });
          }
        } catch (evalErr: any) {
          console.error(
            `⚠️ Error evaluating ${questionSnapshot.code} with ${modelConfig.modelSlot}:`,
            evalErr.message
          );
        }
      }

      // Model Unload: Release VRAM/RAM after completing all questions for this model
      if (modelConfig.provider === 'ollama') {
        await OpenAICompatibleProvider.unloadOllamaModel(
          modelConfig.exactModelId,
          modelConfig.endpointUrl || undefined
        );
        console.log(`[MODEL PIPELINE] Unloaded ${modelConfig.exactModelId} from VRAM.`);
      }
    }

    return createdEvaluations;
  }

  /**
   * Retrieves student diagnostic feedback for a submitted session.
   * Filters by the Admin-configured Student Display Model (MODEL_A, MODEL_B, or MODEL_C)
   * while keeping all three model evaluations stored in the research database.
   */
  static async getStudentSessionEvaluations(sessionId: string, studentId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    if (session.status !== 'SUBMITTED') {
      throw new Error('Evaluation feedback is only available after submitting the assessment.');
    }

    const [evaluations, systemSettings] = await Promise.all([
      prisma.evaluation.findMany({
        where: { sessionId },
      }),
      ModelConfigService.getSystemSettings(),
    ]);

    const questionsSnapshot = safeParseJson(session.questionsSnapshot, []);
    const displaySlot = systemSettings.studentDisplayModel || 'MODEL_A';
    const selectedEvaluations: any[] = [];

    for (const q of questionsSnapshot) {
      const qEvals = evaluations.filter((e) => e.questionId === q.id);
      // Select evaluation for the configured student display model slot, or fallback to first available
      const chosen = qEvals.find((e) => e.modelSlot === displaySlot) || qEvals[0];
      if (chosen) {
        selectedEvaluations.push(chosen);
      }
    }

    // Return sanitized evaluation objects (model identities and internal prompts stripped)
    return selectedEvaluations.map((e) => EvaluationDTO.toStudentDTO(e));
  }


  /**
   * Researcher Admin query to inspect all evaluation records with snapshots and filters.
   */
  static async getAdminEvaluations(filter?: {
    modelSlot?: string;
    agentVersionId?: string;
    sessionId?: string;
    questionId?: string;
    isDemo?: boolean;
    hasReviewFlags?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filter?.modelSlot) where.modelSlot = filter.modelSlot;
    if (filter?.agentVersionId) where.agentVersionId = filter.agentVersionId;
    if (filter?.sessionId) where.sessionId = filter.sessionId;
    if (filter?.questionId) where.questionId = filter.questionId;
    if (filter?.isDemo !== undefined) where.isDemo = filter.isDemo;

    const [total, evaluations] = await Promise.all([
      prisma.evaluation.count({ where }),
      prisma.evaluation.findMany({
        where,
        include: {
          student: true,
          agentVersion: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filter?.limit ?? 100,
        skip: filter?.offset ?? 0,
      }),
    ]);

    return {
      total,
      evaluations: evaluations.map((e) => EvaluationDTO.toAdminDTO(e)),
    };
  }
}

function safeParseJson(str: any, fallback: any): any {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
