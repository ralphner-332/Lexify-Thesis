import { prisma } from '../lib/prisma';
import { SessionDTO } from '../dto/session.dto';
import { AuditService } from './audit.service';
import { EvaluationService } from './evaluation.service';
import { ModelConfigService } from './model-config.service';
import { AgentVersionService } from './agent-version.service';
import { EvaluationJobService } from './evaluation-job.service';

export class AssessmentSessionService {
  /**
   * Retrieves active session or latest submitted session.
   * If neither exists, initializes a new session.
   */
  static async getOrCreateActiveSession(studentId: string, isDemo: boolean = true, testSet?: string) {
    // 1. Fetch current published test set statuses from system settings
    const systemSettings = await ModelConfigService.getSystemSettings();
    const activeSets = Object.entries(systemSettings.testSetStatuses || {})
      .filter(([_, status]) => status === 'ACTIVE')
      .map(([setKey]) => setKey);

    const currentActiveTestSet = testSet || (activeSets.length > 0 ? activeSets[0] : 'TEST_1');

    // 2. Check for active IN_PROGRESS session matching targetTestSet
    const inProgressSessions = await prisma.assessmentSession.findMany({
      where: {
        studentId,
        status: 'IN_PROGRESS',
      },
      include: {
        drafts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const inProgress = inProgressSessions.find((sess) => {
      const qSnap: any[] = safeParseJson(sess.questionsSnapshot, []);
      const sessTestSet = qSnap[0]?.testSet ||
        (qSnap[0]?.code?.startsWith('TEST2') ? 'TEST_2' :
         qSnap[0]?.code?.startsWith('TEST3') ? 'TEST_3' :
         qSnap[0]?.code?.startsWith('TEST4') ? 'TEST_4' : 'TEST_1');
      return sessTestSet === currentActiveTestSet;
    });

    if (inProgress) {
      const draftsMap: Record<string, string> = {};
      let hasNonEmptyAnswers = false;
      for (const d of inProgress.drafts) {
        draftsMap[d.questionId] = d.answerText;
        if (d.answerText && d.answerText.trim().length > 0) {
          hasNonEmptyAnswers = true;
        }
      }

      // Live Question Bank Synchronization for un-answered sessions:
      // If student has saved ZERO meaningful answers, refresh questionsSnapshot from current Question bank
      if (!hasNonEmptyAnswers) {
        const freshQuestions = await prisma.question.findMany({
          where: {
            isActive: true,
            testSet: currentActiveTestSet,
          },
          orderBy: { orderIndex: 'asc' },
        });

        if (freshQuestions.length > 0) {
          const freshSnapshot = freshQuestions.map((q) => ({
            id: q.id,
            code: q.code,
            title: q.title,
            scenario: q.scenario,
            modelAnswer: q.modelAnswer,
            testSet: q.testSet || currentActiveTestSet,
            statutoryElements: safeParseJson(q.statutoryElements, []),
            relevantProvisions: safeParseJson(q.relevantProvisions, []),
            conceptVariations: safeParseJson(q.conceptVariations, []),
            orderIndex: q.orderIndex,
          }));

          await prisma.assessmentSession.update({
            where: { id: inProgress.id },
            data: { questionsSnapshot: JSON.stringify(freshSnapshot) },
          });
          inProgress.questionsSnapshot = JSON.stringify(freshSnapshot);
        }
      }

      return SessionDTO.toStudentDTO(inProgress, draftsMap);
    }

    // 3. Check for SUBMITTED session matching the target test set
    const submittedSessions = await prisma.assessmentSession.findMany({
      where: {
        studentId,
        status: 'SUBMITTED',
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        drafts: true,
      },
    });

    const submittedForActiveSet = submittedSessions.find((sess) => {
      const qSnap: any[] = safeParseJson(sess.questionsSnapshot, []);
      const sessTestSet = qSnap[0]?.testSet ||
        (qSnap[0]?.code?.startsWith('TEST2') ? 'TEST_2' :
         qSnap[0]?.code?.startsWith('TEST3') ? 'TEST_3' :
         qSnap[0]?.code?.startsWith('TEST4') ? 'TEST_4' : 'TEST_1');
      return sessTestSet === currentActiveTestSet;
    });

    if (submittedForActiveSet) {
      const draftsMap: Record<string, string> = {};
      for (const d of submittedForActiveSet.drafts) {
        draftsMap[d.questionId] = d.answerText;
      }
      return SessionDTO.toStudentDTO(submittedForActiveSet, draftsMap);
    }

    // 4. No session for target test set: create new session for the target test set
    return this.createAssessmentSession(studentId, isDemo, currentActiveTestSet);
  }

  /**
   * Creates a new assessment session.
   * Enforces single-attempt protocol for research participants (isDemo: false).
   * Permits multi-attempt testing for demo users (isDemo: true).
   */
  static async createAssessmentSession(studentId: string, isDemo: boolean = true, testSet?: string) {
    // Determine target test set from parameter or active testSetStatuses
    const systemSettings = await ModelConfigService.getSystemSettings();
    const activeSets = Object.entries(systemSettings.testSetStatuses || {})
      .filter(([_, status]) => status === 'ACTIVE')
      .map(([setKey]) => setKey);

    const targetTestSet = testSet || (activeSets.length > 0 ? activeSets[0] : 'TEST_1');

    // If an IN_PROGRESS session already exists for this test set, return it
    const inProgressSessions = await prisma.assessmentSession.findMany({
      where: {
        studentId,
        status: 'IN_PROGRESS',
      },
      include: {
        drafts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const existingInProgress = inProgressSessions.find((sess) => {
      const qSnap: any[] = safeParseJson(sess.questionsSnapshot, []);
      const sessTestSet = qSnap[0]?.testSet ||
        (qSnap[0]?.code?.startsWith('TEST2') ? 'TEST_2' :
         qSnap[0]?.code?.startsWith('TEST3') ? 'TEST_3' :
         qSnap[0]?.code?.startsWith('TEST4') ? 'TEST_4' : 'TEST_1');
      return sessTestSet === targetTestSet;
    });

    if (existingInProgress) {
      const draftsMap: Record<string, string> = {};
      let hasNonEmptyAnswers = false;
      for (const d of existingInProgress.drafts) {
        draftsMap[d.questionId] = d.answerText;
        if (d.answerText && d.answerText.trim().length > 0) {
          hasNonEmptyAnswers = true;
        }
      }

      // If no answers saved yet, sync with latest questions
      if (!hasNonEmptyAnswers) {
        const freshQuestions = await prisma.question.findMany({
          where: {
            isActive: true,
            testSet: targetTestSet,
          },
          orderBy: { orderIndex: 'asc' },
        });

        if (freshQuestions.length > 0) {
          const freshSnapshot = freshQuestions.map((q) => ({
            id: q.id,
            code: q.code,
            title: q.title,
            scenario: q.scenario,
            modelAnswer: q.modelAnswer,
            testSet: q.testSet || targetTestSet,
            statutoryElements: safeParseJson(q.statutoryElements, []),
            relevantProvisions: safeParseJson(q.relevantProvisions, []),
            conceptVariations: safeParseJson(q.conceptVariations, []),
            orderIndex: q.orderIndex,
          }));

          await prisma.assessmentSession.update({
            where: { id: existingInProgress.id },
            data: { questionsSnapshot: JSON.stringify(freshSnapshot) },
          });
          existingInProgress.questionsSnapshot = JSON.stringify(freshSnapshot);
        }
      }

      return SessionDTO.toStudentDTO(existingInProgress, draftsMap);
    }

    // Single-Attempt Research Protocol Enforcement:
    // Real research participants (isDemo: false) with an existing submitted session for this test set cannot create a new attempt
    if (!isDemo) {
      const existingSubmitted = await prisma.assessmentSession.findMany({
        where: {
          studentId,
          status: 'SUBMITTED',
        },
      });

      const alreadySubmittedTarget = existingSubmitted.some((sess) => {
        const qSnap: any[] = safeParseJson(sess.questionsSnapshot, []);
        return qSnap.some(
          (q) =>
            q.testSet === targetTestSet ||
            (q.code && q.code.startsWith(targetTestSet.replace('_', '')))
        );
      });

      if (alreadySubmittedTarget) {
        throw new Error(
          `Research study protocol error: Participants are permitted exactly one immutable assessment attempt per test set (${targetTestSet}).`
        );
      }
    }

    // Capture fresh questions snapshot for the active/selected test set
    let activeQuestions = await prisma.question.findMany({
      where: {
        isActive: true,
        testSet: targetTestSet,
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Fallback if specific set has no questions
    if (activeQuestions.length === 0) {
      activeQuestions = await prisma.question.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
        take: 10,
      });
    }

    if (activeQuestions.length === 0) {
      throw new Error('No active Commercial Law questions available for assessment.');
    }

    const fullQuestionsSnapshot = activeQuestions.map((q) => ({
      id: q.id,
      code: q.code,
      title: q.title,
      scenario: q.scenario,
      modelAnswer: q.modelAnswer,
      testSet: q.testSet || targetTestSet,
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
    let hasNonEmptyAnswers = false;
    for (const d of session.drafts) {
      draftsMap[d.questionId] = d.answerText;
      if (d.answerText && d.answerText.trim().length > 0) {
        hasNonEmptyAnswers = true;
      }
    }

    // If session is IN_PROGRESS and student has NOT saved any answers yet, refresh questionsSnapshot from current Question bank
    if (session.status === 'IN_PROGRESS' && !hasNonEmptyAnswers) {
      const qSnap: any[] = safeParseJson(session.questionsSnapshot, []);
      const sessionTestSet = qSnap[0]?.testSet ||
        (qSnap[0]?.code?.startsWith('TEST2') ? 'TEST_2' :
         qSnap[0]?.code?.startsWith('TEST3') ? 'TEST_3' :
         qSnap[0]?.code?.startsWith('TEST4') ? 'TEST_4' : 'TEST_1');

      const freshQuestions = await prisma.question.findMany({
        where: {
          isActive: true,
          testSet: sessionTestSet,
        },
        orderBy: { orderIndex: 'asc' },
      });

      if (freshQuestions.length > 0) {
        const freshSnapshot = freshQuestions.map((q) => ({
          id: q.id,
          code: q.code,
          title: q.title,
          scenario: q.scenario,
          modelAnswer: q.modelAnswer,
          testSet: q.testSet || sessionTestSet,
          statutoryElements: safeParseJson(q.statutoryElements, []),
          relevantProvisions: safeParseJson(q.relevantProvisions, []),
          conceptVariations: safeParseJson(q.conceptVariations, []),
          orderIndex: q.orderIndex,
        }));

        await prisma.assessmentSession.update({
          where: { id: session.id },
          data: { questionsSnapshot: JSON.stringify(freshSnapshot) },
        });
        session.questionsSnapshot = JSON.stringify(freshSnapshot);
      }
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

  private static inFlightReuses = new Set<string>();

  /**
   * Spawns an asynchronous background worker to evaluate session submissions across 3 models.
   * Non-blocking, updates EvaluationJob in database at each step.
   */
  private static launchBackgroundEvaluation(
    session: any,
    jobId: string,
    sourceSessionId: string
  ): void {
    const targetSessionId = session.id;

    if (this.inFlightReuses.has(targetSessionId)) {
      console.log(`[BACKGROUND EVAL] Runner already active for session ${targetSessionId}.`);
      return;
    }

    this.inFlightReuses.add(targetSessionId);
    this.inFlightReuses.add(sourceSessionId);

    // Run asynchronously in background without blocking caller
    (async () => {
      try {
        console.log(`[BACKGROUND EVAL START] Session ${targetSessionId} (Job: ${jobId})`);
        const initialCount = await prisma.evaluation.count({
          where: { sessionId: targetSessionId },
        });

        await EvaluationJobService.updateProgress(jobId, {
          completedEvaluations: initialCount,
          status: 'PROCESSING',
        });

        await EvaluationService.evaluateSessionSubmissions(
          session,
          async (progress) => {
            const modelLabel = `${progress.modelName} (${progress.modelSlot})`;
            await EvaluationJobService.updateProgress(jobId, {
              completedEvaluations: progress.completed,
              currentModel: modelLabel,
              currentQuestionCode: progress.questionCode,
              status: progress.completed >= progress.total ? 'COMPLETED' : 'PROCESSING',
            });
          }
        );

        const finalCount = await prisma.evaluation.count({
          where: { sessionId: targetSessionId },
        });

        await EvaluationJobService.completeJob(jobId, finalCount);
        console.log(`[BACKGROUND EVAL SUCCESS] Session ${targetSessionId} completed with ${finalCount} evaluations.`);
      } catch (err: any) {
        console.error(`[BACKGROUND EVAL ERROR] Session ${targetSessionId} failed:`, err);
        await EvaluationJobService.failJob(jobId, err.message || 'Unknown evaluation error');
      } finally {
        AssessmentSessionService.inFlightReuses.delete(targetSessionId);
        AssessmentSessionService.inFlightReuses.delete(sourceSessionId);
      }
    })();
  }

  /**
   * Safe Admin-Only: Reuses submitted answers from an explicitly verified historical mockup session
   * to test the active Agent Version V4.
   *
   * Asynchronous Architecture:
   * 1. Returns a fast JSON response with jobId.
   * 2. Background worker evaluates 3 models sequentially.
   * 3. Reconciles and resumes partial evaluations (< 30) without duplicating answers or evaluations.
   * 4. Fully protected against timeouts and server restarts.
   */
  static async reuseMockupForV4Testing(
    sourceSessionId: string,
    adminUser: { id: string; email?: string },
    confirmedMockupClassification: boolean
  ) {
    if (!confirmedMockupClassification) {
      throw new Error(
        'Explicit administrator confirmation of verified mockup classification is required before reuse.'
      );
    }

    // 1. Fetch source session
    const sourceSession = await prisma.assessmentSession.findUnique({
      where: { id: sourceSessionId },
      include: {
        drafts: true,
      },
    });

    if (!sourceSession) {
      throw new Error(`Source assessment session ${sourceSessionId} not found.`);
    }

    if (sourceSession.status !== 'SUBMITTED') {
      throw new Error(
        `Assessment session ${sourceSessionId} is not SUBMITTED. Only submitted sessions can be reused.`
      );
    }

    // Verify all 10 questions have non-empty submitted answers
    const fullQuestions: any[] = safeParseJson(sourceSession.questionsSnapshot, []);
    if (fullQuestions.length === 0) {
      throw new Error(`Source session ${sourceSessionId} contains an empty questions snapshot.`);
    }

    const draftsMap: Record<string, string> = {};
    for (const d of sourceSession.drafts) {
      draftsMap[d.questionId] = d.answerText;
    }

    const missingQuestions = fullQuestions.filter(
      (q: any) => !draftsMap[q.id] || draftsMap[q.id].trim().length === 0
    );

    if (missingQuestions.length > 0) {
      const missingCodes = missingQuestions.map((q: any) => q.code).join(', ');
      throw new Error(`Source session has missing answers for: ${missingCodes}. Cannot reuse incomplete session.`);
    }

    // 2. Fetch active Agent Version (must be V2 Official)
    const activeAgentVersion = await AgentVersionService.getActiveVersion();
    if (!activeAgentVersion) {
      throw new Error('No active Agent Version found for V2 evaluation.');
    }

    // 3. Persistent duplicate and partial evaluation check across restarts
    const existingAudit = await prisma.auditLog.findFirst({
      where: {
        action: { in: ['REUSE_MOCKUP_FOR_V2_OFFICIAL', 'REUSE_MOCKUP_FOR_V4_TESTING'] },
        details: { contains: `"sourceSessionId":"${sourceSessionId}"` },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingAudit && existingAudit.details) {
      try {
        const details = JSON.parse(existingAudit.details);
        if (details.targetSessionId) {
          const existingTarget = await prisma.assessmentSession.findUnique({
            where: { id: details.targetSessionId },
            include: { drafts: true, evaluations: true },
          });

          if (existingTarget) {
            const currentEvalCount = existingTarget.evaluations.length;

            // CASE A: Already fully evaluated (all 30 evaluations exist)
            if (currentEvalCount >= 30) {
              const targetVersion = (details.targetAgentVersion === 'V4' ? 'V2' : details.targetAgentVersion) || 'V2';
              return {
                success: true,
                alreadyReused: true,
                isComplete: true,
                status: 'COMPLETED',
                message: 'This mockup session has already been completely evaluated under V2 Official.',
                originalSessionId: sourceSessionId,
                newSessionId: existingTarget.id,
                sourceAgentVersion: details.sourceAgentVersion || 'V1',
                targetAgentVersion: targetVersion,
                evaluationsCount: currentEvalCount,
                session: existingTarget,
              };
            }

            // CASE B: Partial evaluation (< 30 evaluations exist) -> RESUME MISSING EVALUATIONS
            console.log(
              `[RESUME V2] Session ${existingTarget.id} has partial evaluations (${currentEvalCount}/30). Resuming missing evaluations...`
            );

            let job = await EvaluationJobService.getJobByTargetSession(existingTarget.id);
            if (!job) {
              job = await EvaluationJobService.createJob({
                sourceSessionId,
                targetSessionId: existingTarget.id,
                totalEvaluations: 30,
                completedEvaluations: currentEvalCount,
                status: 'PROCESSING',
                isDemo: true,
              });
            } else {
              await EvaluationJobService.updateProgress(job.id, {
                completedEvaluations: currentEvalCount,
                status: 'PROCESSING',
              });
            }

            // Trigger background runner if not already running
            this.launchBackgroundEvaluation(existingTarget, job.id, sourceSessionId);

            const targetVersion = (details.targetAgentVersion === 'V4' ? 'V2' : details.targetAgentVersion) || 'V2';
            return {
              success: true,
              jobId: job.id,
              resuming: true,
              alreadyReused: false,
              isComplete: false,
              status: 'PROCESSING',
              message: `Resuming missing evaluations for V2 demonstration session (${currentEvalCount}/30 completed).`,
              originalSessionId: sourceSessionId,
              newSessionId: existingTarget.id,
              sourceAgentVersion: details.sourceAgentVersion || 'V1',
              targetAgentVersion: targetVersion,
              completedEvaluations: currentEvalCount,
              totalEvaluations: 30,
              session: existingTarget,
            };
          }
        }
      } catch (parseErr) {
        console.error('[REUSE V2] Error inspecting existing audit log details:', parseErr);
      }
    }

    // 4. Concurrency lock to prevent duplicate session creation
    if (AssessmentSessionService.inFlightReuses.has(sourceSessionId)) {
      const activeJob = await EvaluationJobService.getJobBySourceSession(sourceSessionId);
      return {
        success: true,
        jobId: activeJob?.id,
        status: activeJob?.status || 'PROCESSING',
        alreadyReused: false,
        isComplete: false,
        message: 'Reuse and V2 Official evaluation is currently in progress.',
        originalSessionId: sourceSessionId,
        newSessionId: activeJob?.targetSessionId,
        completedEvaluations: activeJob?.completedEvaluations || 0,
        totalEvaluations: 30,
      };
    }

    // 5. Create completely separate demonstration assessment session (isDemo: true)
    const newSession = await prisma.assessmentSession.create({
      data: {
        studentId: sourceSession.studentId,
        status: 'IN_PROGRESS',
        questionsSnapshot: sourceSession.questionsSnapshot,
        isDemo: true, // Strictly marked as demonstration
      },
    });

    // 6. Copy student answer drafts verbatim for the snapshot questions
    const snapshotQuestionIds = new Set(fullQuestions.map((q: any) => q.id));
    for (const draft of sourceSession.drafts) {
      if (snapshotQuestionIds.has(draft.questionId)) {
        await prisma.studentAnswerDraft.create({
          data: {
            sessionId: newSession.id,
            questionId: draft.questionId,
            answerText: draft.answerText,
          },
        });
      }
    }

    // 7. Lock session as SUBMITTED
    const updatedSession = await prisma.assessmentSession.update({
      where: { id: newSession.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: { drafts: true },
    });

    // 8. Record audit log with source-session provenance and verified mockup classification
    await AuditService.logAction({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'REUSE_MOCKUP_FOR_V2_OFFICIAL',
      entityType: 'ASSESSMENT_SESSION',
      entityId: updatedSession.id,
      details: {
        sourceSessionId: sourceSession.id,
        targetSessionId: updatedSession.id,
        sourceStudentId: sourceSession.studentId,
        sourceAgentVersion: 'V1',
        targetAgentVersion: activeAgentVersion.versionTag,
        targetAgentVersionId: activeAgentVersion.id,
        questionCount: fullQuestions.length,
        verifiedMockupClassification: true,
        adminUserId: adminUser.id,
        adminUserEmail: adminUser.email,
      },
      isDemo: true,
    });

    // 9. Create persistent EvaluationJob record in database
    const job = await EvaluationJobService.createJob({
      sourceSessionId: sourceSession.id,
      targetSessionId: updatedSession.id,
      totalEvaluations: 30,
      completedEvaluations: 0,
      status: 'PROCESSING',
      isDemo: true,
    });

    // 10. Launch asynchronous background evaluation across 3 local models
    this.launchBackgroundEvaluation(updatedSession, job.id, sourceSessionId);

    // Return immediately to client with valid JSON response
    return {
      success: true,
      jobId: job.id,
      resuming: false,
      alreadyReused: false,
      isComplete: false,
      status: 'PROCESSING',
      message: 'Mockup answers copied. V2 Official demonstration evaluation job started in the background.',
      originalSessionId: sourceSession.id,
      newSessionId: updatedSession.id,
      sourceAgentVersion: 'V1',
      targetAgentVersion: activeAgentVersion.versionTag,
      completedEvaluations: 0,
      totalEvaluations: 30,
      session: updatedSession,
    };
  }

  /**
   * Status endpoint to check progress of an active or completed evaluation job.
   */
  static async getReuseJobStatus(jobIdOrSessionId: string) {
    let job = await EvaluationJobService.getJob(jobIdOrSessionId);
    if (!job) {
      job = await EvaluationJobService.getJobBySourceSession(jobIdOrSessionId);
    }
    if (!job) {
      job = await EvaluationJobService.getJobByTargetSession(jobIdOrSessionId);
    }

    if (!job) {
      // Fallback check in AuditLog if job was completed before jobs table existed
      const audit = await prisma.auditLog.findFirst({
        where: {
          action: 'REUSE_MOCKUP_FOR_V4_TESTING',
          details: { contains: jobIdOrSessionId },
        },
      });

      if (audit && audit.details) {
        try {
          const d = JSON.parse(audit.details);
          const evalCount = await prisma.evaluation.count({
            where: { sessionId: d.targetSessionId },
          });

          return {
            success: true,
            data: {
              id: 'legacy-job',
              sourceSessionId: d.sourceSessionId,
              targetSessionId: d.targetSessionId,
              status: evalCount >= 30 ? 'COMPLETED' : 'FAILED',
              totalEvaluations: 30,
              completedEvaluations: evalCount,
              currentModel: null,
              currentQuestionCode: null,
              errorMessage: evalCount < 30 ? 'Job interrupted. Ready to resume.' : null,
              isDemo: true,
              evaluationsCount: evalCount,
              isComplete: evalCount >= 30,
              isRunning: AssessmentSessionService.inFlightReuses.has(d.targetSessionId),
            },
          };
        } catch {}
      }

      throw new Error(`Evaluation job or session ${jobIdOrSessionId} not found.`);
    }

    // Reconcile with actual evaluations in database
    const actualCount = await prisma.evaluation.count({
      where: { sessionId: job.targetSessionId },
    });

    const isRunning = AssessmentSessionService.inFlightReuses.has(job.targetSessionId);

    // If job shows PROCESSING but no runner is active and count < 30 (e.g. server was restarted),
    // mark errorMessage as paused/interrupted so user can resume
    let status = job.status;
    let errorMessage = job.errorMessage;
    if (status === 'PROCESSING' && !isRunning && actualCount < 30) {
      status = 'FAILED';
      errorMessage = 'Evaluation was interrupted by a server restart or timeout. Ready to resume.';
    } else if (actualCount >= 30) {
      status = 'COMPLETED';
    }

    const total = job.totalEvaluations || 30;
    const displayCount = status === 'COMPLETED' ? total : Math.max(job.completedEvaluations, actualCount);
    const progressPercentage = total > 0 ? Math.min(100, Math.round((displayCount / total) * 100)) : 0;

    return {
      success: true,
      data: {
        ...job,
        status,
        completedEvaluations: displayCount,
        evaluationsCount: displayCount,
        totalEvaluations: total,
        progressPercentage,
        isComplete: status === 'COMPLETED' || displayCount >= 30,
        isRunning,
        errorMessage,
      },
    };
  }

  /**
   * Retrieves map of source sessions that have already been reused for V2 Official (and legacy V4) testing,
   * including live evaluation counts and completeness flags.
   */
  static async getReusedSessionsMap() {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['REUSE_MOCKUP_FOR_V2_OFFICIAL', 'REUSE_MOCKUP_FOR_V4_TESTING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const map: Record<
      string,
      {
        targetSessionId: string;
        targetAgentVersion: string;
        createdAt: Date;
        evaluationsCount: number;
        isComplete: boolean;
      }
    > = {};

    for (const log of logs) {
      if (log.details) {
        try {
          const d = JSON.parse(log.details);
          if (d.sourceSessionId && d.targetSessionId && !map[d.sourceSessionId]) {
            const evalCount = await prisma.evaluation.count({
              where: { sessionId: d.targetSessionId },
            });

            const version = d.targetAgentVersion === 'V4' ? 'V2' : (d.targetAgentVersion || 'V2');

            map[d.sourceSessionId] = {
              targetSessionId: d.targetSessionId,
              targetAgentVersion: version,
              createdAt: log.createdAt,
              evaluationsCount: evalCount,
              isComplete: evalCount >= 30,
            };
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return map;
  }

  /**
   * Alias for reuseMockupForV4Testing pointing to V2 Official Evaluator
   */
  static async reuseMockupForV2Testing(
    sourceSessionId: string,
    adminUser: { id: string; email?: string },
    confirmedMockupClassification: boolean
  ) {
    return this.reuseMockupForV4Testing(sourceSessionId, adminUser, confirmedMockupClassification);
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
