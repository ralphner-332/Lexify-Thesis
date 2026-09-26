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
  static async evaluateSessionSubmissions(session: any) {
    const fullQuestions: any[] = safeParseJson(session.questionsSnapshot, []);
    const drafts = session.drafts || [];

    // Fetch active Rubric, baseline AgentVersion, and all 3 locked Model Configurations
    const [activeRubric, activeAgentVersion, modelConfigs] = await Promise.all([
      RubricService.getDefaultRubric(),
      AgentVersionService.getActiveVersion(),
      ModelConfigService.getAllModelConfigs(),
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

    for (const draft of drafts) {
      const questionSnapshot = fullQuestions.find((q: any) => q.id === draft.questionId);
      if (!questionSnapshot) {
        throw new Error(`Question ${draft.questionId} not found in session snapshot.`);
      }

      // Sequential Execution: MODEL_A -> MODEL_B -> MODEL_C
      for (const modelConfig of modelsToEvaluate) {
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
        };

        const evalResult = await AiEvaluatorService.evaluateAnswer({
          questionSnapshot,
          modelConfigSnapshot,
          rubricSnapshot,
          systemInstructions: modelConfig.systemInstructions || activeAgentVersion.systemInstructions,
          studentAnswer: draft.answerText,
          isDemo: session.isDemo,
        });

        const createdEval = await prisma.evaluation.create({
          data: {
            sessionId: session.id,
            studentId: session.studentId,
            questionId: draft.questionId,
            agentVersionId: activeAgentVersion.id,
            modelSlot: modelConfig.modelSlot,
            modelFamily: modelConfig.modelFamily,
            exactModelId: modelConfig.exactModelId,
            questionSnapshot: JSON.stringify(questionSnapshot),
            modelConfigSnapshot: JSON.stringify(modelConfigSnapshot),
            rubricSnapshot: JSON.stringify(rubricSnapshot),
            studentAnswer: draft.answerText,
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
          },
          isDemo: session.isDemo,
        });

        console.log(
          `[EVALUATION PROVENANCE] ${questionSnapshot.code} -> ${modelConfig.modelSlot} (${modelConfig.researchName}) -> ${modelConfig.exactModelId} -> ${createdEval.id} -> Raw Score: ${createdEval.numericalScore}`
        );

        // Immediate Model Unload: Release VRAM/RAM before invoking the next model
        if (modelConfig.provider === 'ollama') {
          await OpenAICompatibleProvider.unloadOllamaModel(
            modelConfig.exactModelId,
            modelConfig.endpointUrl || undefined
          );
        }

        createdEvaluations.push(createdEval);
      }
    }

    return createdEvaluations;
  }

  /**
   * Retrieves student diagnostic feedback for a submitted session.
   * - For Demo Mode (isDemo: true): returns full evaluations for interactive testing.
   * - For Official Research (isDemo: false): unblinded comparative triple-model research scores
   *   are kept for researcher/admin analysis; returns clean student feedback format.
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

    const evaluations = await prisma.evaluation.findMany({
      where: { sessionId },
    });

    const questionsSnapshot = safeParseJson(session.questionsSnapshot, []);
    const qOrderMap = new Map<string, number>();
    questionsSnapshot.forEach((q: any, idx: number) => {
      qOrderMap.set(q.id, idx);
    });

    evaluations.sort((a, b) => {
      const orderA = qOrderMap.get(a.questionId) ?? 999;
      const orderB = qOrderMap.get(b.questionId) ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.modelSlot || '').localeCompare(b.modelSlot || '');
    });

    // Return full evaluations across all three models for student feedback
    return evaluations.map((e) => EvaluationDTO.toStudentDTO(e));
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
