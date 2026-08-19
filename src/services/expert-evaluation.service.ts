import { prisma } from '../lib/prisma';
import { RubricService } from './rubric.service';
import { AuditService } from './audit.service';
import { ExpertEvaluationDTO } from '../dto/expert-evaluation.dto';

export class ExpertEvaluationService {
  /**
   * Generates anonymized expert review queue for all submitted student sessions.
   * Student names, emails, and identifying metadata are strictly excluded.
   */
  static async getExpertQueue(expertId: string, isDemo?: boolean) {
    const where: any = { status: 'SUBMITTED' };
    if (isDemo !== undefined) where.isDemo = isDemo;

    const submittedSessions = await prisma.assessmentSession.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        drafts: true,
        expertEvaluations: {
          where: { expertId },
        },
        expertDrafts: {
          where: { expertId },
        },
      },
    });

    const queueItems: any[] = [];

    submittedSessions.forEach((session, sessionIdx) => {
      const anonymizedIndex = sessionIdx + 1;
      const questions = safeParseJson(session.questionsSnapshot, []);

      questions.forEach((q: any) => {
        const existingEval = session.expertEvaluations.find((e) => e.questionId === q.id);
        const existingDraft = session.expertDrafts.find((d) => d.questionId === q.id);

        let status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' = 'NOT_STARTED';
        let evalId: string | undefined = undefined;

        if (existingEval) {
          status = 'SUBMITTED';
          evalId = existingEval.id;
        } else if (existingDraft) {
          status = 'DRAFT';
        }

        queueItems.push(
          ExpertEvaluationDTO.toQueueItem(session, q, anonymizedIndex, status, evalId)
        );
      });
    });

    return queueItems;
  }

  /**
   * Retrieves single submission for double-blind expert grading.
   * Strictly never returns AI scores, AI reasoning, or other experts' scores.
   */
  static async getSubmissionForEvaluation(expertId: string, sessionId: string, questionId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        drafts: true,
        expertEvaluations: {
          where: { expertId, questionId },
        },
        expertDrafts: {
          where: { expertId, questionId },
        },
      },
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    if (session.status !== 'SUBMITTED') {
      throw new Error('Assessment session has not been submitted by the student yet.');
    }

    // Determine deterministic anonymized student index
    const allSessions = await prisma.assessmentSession.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const sessionIndex = allSessions.findIndex((s) => s.id === sessionId);
    const anonymizedIndex = sessionIndex >= 0 ? sessionIndex + 1 : 1;

    const fullQuestions = safeParseJson(session.questionsSnapshot, []);
    const questionSnapshot = fullQuestions.find((q: any) => q.id === questionId);

    if (!questionSnapshot) {
      throw new Error(`Question ${questionId} not found in session snapshot.`);
    }

    const studentDraft = session.drafts.find((d) => d.questionId === questionId);
    const studentAnswer = studentDraft?.answerText || '';

    // Load active rubric criteria
    const activeRubric = await RubricService.getDefaultRubric();
    const rubricCriteria = activeRubric?.criteria || [];

    const existingEval = session.expertEvaluations[0];
    const existingDraft = session.expertDrafts[0];

    return ExpertEvaluationDTO.toSubmissionDetail(
      session,
      questionSnapshot,
      studentAnswer,
      rubricCriteria,
      anonymizedIndex,
      existingDraft || existingEval,
      !!existingEval
    );
  }

  /**
   * Saves an expert evaluation draft server-side.
   * Rejects if the evaluation has already been submitted.
   */
  static async saveExpertDraft(
    expertId: string,
    sessionId: string,
    questionId: string,
    draftData: {
      numericalScore?: number;
      scoringBasis?: string;
      criterionScores?: any[];
      qualitativeComments?: string;
    }
  ) {
    const existingEval = await prisma.expertEvaluation.findUnique({
      where: {
        expertId_sessionId_questionId: {
          expertId,
          sessionId,
          questionId,
        },
      },
    });

    if (existingEval) {
      throw new Error('Cannot modify draft: Expert evaluation has already been submitted and locked as research evidence.');
    }

    const draft = await prisma.expertDraft.upsert({
      where: {
        expertId_sessionId_questionId: {
          expertId,
          sessionId,
          questionId,
        },
      },
      update: {
        numericalScore: draftData.numericalScore ?? 0,
        scoringBasis: draftData.scoringBasis ?? '',
        criterionScores: JSON.stringify(draftData.criterionScores ?? []),
        qualitativeComments: draftData.qualitativeComments ?? '',
      },
      create: {
        expertId,
        sessionId,
        questionId,
        numericalScore: draftData.numericalScore ?? 0,
        scoringBasis: draftData.scoringBasis ?? '',
        criterionScores: JSON.stringify(draftData.criterionScores ?? []),
        qualitativeComments: draftData.qualitativeComments ?? '',
      },
    });

    return {
      success: true,
      message: 'Expert draft saved successfully',
      draft,
    };
  }

  /**
   * Commits independent expert evaluation as immutable research evidence.
   */
  static async submitExpertEvaluation(
    expertId: string,
    sessionId: string,
    questionId: string,
    evalData: {
      numericalScore: number;
      scoringBasis: string;
      criterionScores: Array<{
        criterionName: string;
        score: number;
        maxPoints: number;
        reasoning?: string;
      }>;
      qualitativeComments?: string;
    }
  ) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { drafts: true },
    });

    if (!session || session.status !== 'SUBMITTED') {
      throw new Error('Assessment session not found or not submitted.');
    }

    const existingEval = await prisma.expertEvaluation.findUnique({
      where: {
        expertId_sessionId_questionId: {
          expertId,
          sessionId,
          questionId,
        },
      },
    });

    if (existingEval) {
      throw new Error('Expert evaluation for this question has already been submitted.');
    }

    const fullQuestions = safeParseJson(session.questionsSnapshot, []);
    const questionSnapshot = fullQuestions.find((q: any) => q.id === questionId);

    if (!questionSnapshot) {
      throw new Error('Question not found in session snapshot.');
    }

    const studentDraft = session.drafts.find((d) => d.questionId === questionId);
    const studentAnswer = studentDraft?.answerText || '';

    const activeRubric = await RubricService.getDefaultRubric();
    const rubricSnapshot = activeRubric?.criteria || [];
    const maxScore = rubricSnapshot.reduce(
      (sum, c) => sum + (c.maxPoints ?? c.weightPercent ?? 20),
      0
    );

    // Persist immutable ExpertEvaluation record
    const createdEvaluation = await prisma.expertEvaluation.create({
      data: {
        expertId,
        sessionId,
        questionId,
        studentAnswer,
        numericalScore: evalData.numericalScore,
        maxScore,
        scoringBasis: evalData.scoringBasis,
        criterionScores: JSON.stringify(evalData.criterionScores),
        qualitativeComments: evalData.qualitativeComments || '',
        questionSnapshot: JSON.stringify(questionSnapshot),
        rubricSnapshot: JSON.stringify(rubricSnapshot),
        isDemo: session.isDemo,
      },
    });

    // Clean up temporary draft if present
    await prisma.expertDraft.deleteMany({
      where: { expertId, sessionId, questionId },
    });

    await AuditService.logAction({
      userId: expertId,
      action: 'SUBMIT_EXPERT_EVALUATION',
      entityType: 'EXPERT_EVALUATION',
      entityId: createdEvaluation.id,
      details: {
        sessionId,
        questionCode: questionSnapshot.code,
        numericalScore: createdEvaluation.numericalScore,
        maxScore,
        isDemo: session.isDemo,
      },
      isDemo: session.isDemo,
    });

    return {
      success: true,
      message: 'Independent expert evaluation submitted successfully.',
      evaluation: createdEvaluation,
    };
  }

  /**
   * Retrieves all expert evaluations for researcher inspection.
   */
  static async getExpertEvaluations(filter?: {
    expertId?: string;
    sessionId?: string;
    questionId?: string;
    isDemo?: boolean;
  }) {
    const where: any = {};
    if (filter?.expertId) where.expertId = filter.expertId;
    if (filter?.sessionId) where.sessionId = filter.sessionId;
    if (filter?.questionId) where.questionId = filter.questionId;
    if (filter?.isDemo !== undefined) where.isDemo = filter.isDemo;

    return prisma.expertEvaluation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        expert: true,
      },
    });
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
