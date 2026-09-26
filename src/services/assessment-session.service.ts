import { prisma } from '../lib/prisma';
import { SessionDTO } from '../dto/session.dto';
import { AuditService } from './audit.service';
import { EvaluationService } from './evaluation.service';

export class AssessmentSessionService {
  /**
   * Retrieves active session or latest submitted session.
   * If neither exists, initializes a new session.
   */
  static async getOrCreateActiveSession(studentId: string, isDemo: boolean = true) {
    // 1. Check for active IN_PROGRESS session
    const inProgress = await prisma.assessmentSession.findFirst({
      where: {
        studentId,
        status: 'IN_PROGRESS',
      },
      include: {
        drafts: true,
      },
    });

    if (inProgress) {
      const draftsMap: Record<string, string> = {};
      for (const d of inProgress.drafts) {
        draftsMap[d.questionId] = d.answerText;
      }
      return SessionDTO.toStudentDTO(inProgress, draftsMap);
    }

    // 2. Check for latest SUBMITTED session
    const latestSubmitted = await prisma.assessmentSession.findFirst({
      where: {
        studentId,
        status: 'SUBMITTED',
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        drafts: true,
      },
    });

    if (latestSubmitted) {
      const draftsMap: Record<string, string> = {};
      for (const d of latestSubmitted.drafts) {
        draftsMap[d.questionId] = d.answerText;
      }
      return SessionDTO.toStudentDTO(latestSubmitted, draftsMap);
    }

    // 3. Neither exists: create initial session
    return this.createAssessmentSession(studentId, isDemo);
  }

  /**
   * Creates a new assessment session.
   * Enforces single-attempt protocol for research participants (isDemo: false).
   * Permits multi-attempt testing for demo users (isDemo: true).
   */
  static async createAssessmentSession(studentId: string, isDemo: boolean = true) {
    // If an IN_PROGRESS session already exists, return it
    const existingInProgress = await prisma.assessmentSession.findFirst({
      where: {
        studentId,
        status: 'IN_PROGRESS',
      },
      include: {
        drafts: true,
      },
    });

    if (existingInProgress) {
      const draftsMap: Record<string, string> = {};
      for (const d of existingInProgress.drafts) {
        draftsMap[d.questionId] = d.answerText;
      }
      return SessionDTO.toStudentDTO(existingInProgress, draftsMap);
    }

    // Single-Attempt Research Protocol Enforcement:
    // Real research participants (isDemo: false) with an existing submitted session cannot create a new attempt
    if (!isDemo) {
      const existingSubmitted = await prisma.assessmentSession.findFirst({
        where: {
          studentId,
          status: 'SUBMITTED',
        },
      });

      if (existingSubmitted) {
        throw new Error(
          'Research study protocol error: Participants are permitted exactly one immutable assessment attempt.'
        );
      }
    }

    // Capture full questions snapshot from currently active questions
    const activeQuestions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    if (activeQuestions.length === 0) {
      throw new Error('No active Commercial Law questions available for assessment.');
    }

    const fullQuestionsSnapshot = activeQuestions.map((q) => ({
      id: q.id,
      code: q.code,
      title: q.title,
      scenario: q.scenario,
      modelAnswer: q.modelAnswer,
      statutoryElements: safeParseJson(q.statutoryElements, []),
      relevantProvisions: safeParseJson(q.relevantProvisions, []),
      conceptVariations: safeParseJson(q.conceptVariations, []),
      orderIndex: q.orderIndex,
    }));

    const session = await prisma.assessmentSession.create({
      data: {
        studentId,
        status: 'IN_PROGRESS',
        questionsSnapshot: JSON.stringify(fullQuestionsSnapshot),
        isDemo,
      },
      include: {
        drafts: true,
      },
    });

    await AuditService.logAction({
      userId: studentId,
      action: 'START_ASSESSMENT_SESSION',
      entityType: 'ASSESSMENT_SESSION',
      entityId: session.id,
      details: { questionCount: fullQuestionsSnapshot.length, isDemo },
      isDemo,
    });

    return SessionDTO.toStudentDTO(session, {});
  }

  /**
   * Retrieves all assessment sessions for a student.
   */
  static async getStudentSessionHistory(studentId: string) {
    const sessions = await prisma.assessmentSession.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: { drafts: true },
    });

    return sessions.map((s) => {
      const draftsMap: Record<string, string> = {};
      for (const d of s.drafts) {
        draftsMap[d.questionId] = d.answerText;
      }
      return SessionDTO.toStudentDTO(s, draftsMap);
    });
  }

  /**
   * Retrieves a specific session by ID with security checks.
   */
  static async getSessionById(sessionId: string, studentId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { drafts: true },
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized: Session does not belong to the requesting student');
    }

    const draftsMap: Record<string, string> = {};
    for (const d of session.drafts) {
      draftsMap[d.questionId] = d.answerText;
    }

    return SessionDTO.toStudentDTO(session, draftsMap);
  }

  /**
   * Saves a draft answer. Rejected if session is already SUBMITTED.
   */
  static async saveAnswerDraft(
    sessionId: string,
    studentId: string,
    questionId: string,
    answerText: string
  ) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized: Session does not belong to the requesting student');
    }

    if (session.status === 'SUBMITTED') {
      throw new Error('Cannot modify draft: Assessment session is already submitted and locked as research evidence.');
    }

    const draft = await prisma.studentAnswerDraft.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId,
        },
      },
      update: {
        answerText,
      },
      create: {
        sessionId,
        questionId,
        answerText,
      },
    });

    return {
      success: true,
      questionId: draft.questionId,
      answerText: draft.answerText,
      updatedAt: draft.updatedAt,
    };
  }

  /**
   * Returns review checklist verifying answering status for all questions in the snapshot.
   */
  static async getSessionReview(sessionId: string, studentId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { drafts: true },
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    const draftsMap: Record<string, string> = {};
    for (const d of session.drafts) {
      draftsMap[d.questionId] = d.answerText;
    }

    const sanitizedSession = SessionDTO.toStudentDTO(session, draftsMap);

    const unansweredCount = sanitizedSession.questions.filter((q) => !q.isAnswered).length;
    const allAnswered = unansweredCount === 0;

    return {
      session: sanitizedSession,
      totalQuestions: sanitizedSession.questions.length,
      answeredCount: sanitizedSession.questions.length - unansweredCount,
      unansweredCount,
      allAnswered,
    };
  }

  /**
   * Finalizes submission, locks session immutably, and triggers grounded AI evaluation.
   */
  static async submitSession(sessionId: string, studentId: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { drafts: true },
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    if (session.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    if (session.status === 'SUBMITTED') {
      throw new Error('Assessment session has already been submitted.');
    }

    // Parse full questions snapshot to verify all questions have non-empty answers
    const fullQuestions = safeParseJson(session.questionsSnapshot, []);
    const draftsMap: Record<string, string> = {};
    for (const d of session.drafts) {
      draftsMap[d.questionId] = d.answerText;
    }

    const missingQuestions = fullQuestions.filter(
      (q: any) => !draftsMap[q.id] || draftsMap[q.id].trim().length === 0
    );

    if (missingQuestions.length > 0) {
      const missingCodes = missingQuestions.map((q: any) => q.code).join(', ');
      throw new Error(
        `All questions are mandatory before submission. Missing response for: ${missingCodes}`
      );
    }

    // Lock session as SUBMITTED
    const updatedSession = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: { drafts: true },
    });

    await AuditService.logAction({
      userId: studentId,
      action: 'SUBMIT_ASSESSMENT_SESSION',
      entityType: 'ASSESSMENT_SESSION',
      entityId: sessionId,
      details: { questionCount: fullQuestions.length, submittedAt: updatedSession.submittedAt },
      isDemo: session.isDemo,
    });

    // Trigger AI evaluation pipeline using the session snapshot directly
    await EvaluationService.evaluateSessionSubmissions(updatedSession);

    return {
      success: true,
      message: 'Assessment session submitted successfully. AI evaluation complete.',
      sessionId: updatedSession.id,
      submittedAt: updatedSession.submittedAt,
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
