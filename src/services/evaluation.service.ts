import { prisma } from '../lib/prisma';
import { AiEvaluatorService } from './ai-evaluator.service';
import { RubricService } from './rubric.service';
import { AgentVersionService } from './agent-version.service';
import { AuditService } from './audit.service';
import { EvaluationDTO } from '../dto/evaluation.dto';

export class EvaluationService {
  /**
   * Evaluates all submitted answers in a session using the session's questionsSnapshot directly.
   * Never re-queries mutable Question tables, preserving complete historical reproducibility.
   */
  static async evaluateSessionSubmissions(session: any) {
    const fullQuestions: any[] = safeParseJson(session.questionsSnapshot, []);
    const drafts = session.drafts || [];

    // Fetch active Agent Version (e.g. V1) and active Rubric
    const [activeAgentVersion, activeRubric] = await Promise.all([
      AgentVersionService.getActiveVersion(),
      RubricService.getDefaultRubric(),
    ]);

    if (!activeAgentVersion) {
      throw new Error('No active Agent Version found for evaluation.');
    }

    if (!activeRubric) {
      throw new Error('No active Rubric found for evaluation.');
    }

    const modelConfigSnapshot = activeAgentVersion.modelConfig;
    const rubricSnapshot = activeRubric.criteria;
    const systemInstructions = activeAgentVersion.systemInstructions;

    const evaluationPromises = drafts.map(async (draft: any) => {
      const questionSnapshot = fullQuestions.find((q: any) => q.id === draft.questionId);
      if (!questionSnapshot) {
        throw new Error(`Question ${draft.questionId} not found in session snapshot.`);
      }

      // Execute grounded semantic AI evaluation
      const evalResult = await AiEvaluatorService.evaluateAnswer({
        questionSnapshot,
        modelConfigSnapshot,
        rubricSnapshot,
        systemInstructions,
        studentAnswer: draft.answerText,
        isDemo: session.isDemo,
      });

      // Persist immutable Evaluation record
      const createdEval = await prisma.evaluation.create({
        data: {
          sessionId: session.id,
          studentId: session.studentId,
          questionId: draft.questionId,
          agentVersionId: activeAgentVersion.id,
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
          agentVersionTag: activeAgentVersion.versionTag,
          score: createdEval.numericalScore,
          maxScore: createdEval.maxScore,
          isDemo: session.isDemo,
        },
        isDemo: session.isDemo,
      });

      return createdEval;
    });

    return Promise.all(evaluationPromises);
  }

  /**
   * Retrieves student diagnostic feedback for a submitted session.
   * Strips all confidential answer keys and internal review prompts.
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
      orderBy: { createdAt: 'asc' },
    });

    return evaluations.map((e) => EvaluationDTO.toStudentDTO(e));
  }

  /**
   * Researcher Admin query to inspect all evaluation records with snapshots and filters.
   */
  static async getAdminEvaluations(filter?: {
    agentVersionId?: string;
    sessionId?: string;
    questionId?: string;
    isDemo?: boolean;
    hasReviewFlags?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
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
        take: filter?.limit || 100,
        skip: filter?.offset || 0,
      }),
    ]);

    let results = evaluations.map((e) => EvaluationDTO.toAdminDTO(e));

    if (filter?.hasReviewFlags) {
      results = results.filter((e) => e.reviewFlags && e.reviewFlags.length > 0);
    }

    return {
      total,
      evaluations: results,
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
