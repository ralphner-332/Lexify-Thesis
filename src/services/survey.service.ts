import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';
import { SurveyDTO, SurveySummaryMetricsDTO } from '../dto/survey.dto';

export class SurveyService {
  /**
   * Retrieves active survey questionnaire for a role (STUDENT or EXPERT).
   */
  static async getActiveQuestionnaire(targetRole: 'STUDENT' | 'EXPERT', isDemo?: boolean) {
    const where: any = {
      targetRole,
      isActive: true,
    };
    if (isDemo !== undefined) where.isDemo = isDemo;

    const questionnaire = await prisma.surveyQuestionnaire.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!questionnaire) {
      throw new Error(`No active ${targetRole.toLowerCase()} survey questionnaire found.`);
    }

    return SurveyDTO.toQuestionnaireDTO(questionnaire);
  }

  /**
   * Submits a completed survey questionnaire response.
   * Preserves exact question snapshot at response time.
   */
  static async submitSurveyResponse(
    respondentId: string,
    respondentRole: 'STUDENT' | 'EXPERT',
    questionnaireId: string,
    answers: Record<string, any>,
    qualitativeNotes?: string,
    isDemo?: boolean
  ) {
    const questionnaire = await prisma.surveyQuestionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!questionnaire) {
      throw new Error('Survey questionnaire not found.');
    }

    const created = await prisma.surveyResponse.create({
      data: {
        questionnaireId,
        respondentId,
        respondentRole,
        questionnaireSnapshot: JSON.stringify(questionnaire.questions),
        answers: JSON.stringify(answers),
        qualitativeNotes: qualitativeNotes || '',
        isDemo: isDemo !== undefined ? isDemo : questionnaire.isDemo,
      },
    });

    await AuditService.logAction({
      userId: respondentId,
      action: 'SUBMIT_SURVEY_RESPONSE',
      entityType: 'SURVEY_RESPONSE',
      entityId: created.id,
      details: {
        questionnaireId,
        respondentRole,
        isDemo: created.isDemo,
      },
      isDemo: created.isDemo,
    });

    return {
      success: true,
      message: 'Survey feedback submitted successfully and recorded as research evidence.',
      response: SurveyDTO.toResponseDTO(created),
    };
  }

  /**
   * Lists survey responses for researcher analysis.
   * Server default: isDemo = false
   */
  static async getSurveyResponses(filter?: {
    questionnaireId?: string;
    respondentRole?: string;
    isDemo?: boolean;
  }) {
    const where: any = {
      isDemo: filter?.isDemo !== undefined ? filter.isDemo : false,
    };

    if (filter?.questionnaireId) where.questionnaireId = filter.questionnaireId;
    if (filter?.respondentRole) where.respondentRole = filter.respondentRole;

    const responses = await prisma.surveyResponse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        respondent: true,
        questionnaire: true,
      },
    });

    return responses.map((r) => SurveyDTO.toResponseDTO(r));
  }

  /**
   * Computes descriptive summary metrics (mean Likert scores, counts) for a questionnaire.
   * Server default: isDemo = false
   */
  static async getSurveySummaryMetrics(
    questionnaireId: string,
    isDemo?: boolean
  ): Promise<SurveySummaryMetricsDTO> {
    const isDemoFilter = isDemo !== undefined ? isDemo : false;

    const questionnaire = await prisma.surveyQuestionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!questionnaire) {
      throw new Error('Questionnaire not found');
    }

    const responses = await prisma.surveyResponse.findMany({
      where: {
        questionnaireId,
        isDemo: isDemoFilter,
      },
    });

    const totalResponses = responses.length;
    const openFeedbackNotes: string[] = [];

    // Analyze each question
    const questionAverages = questionnaire.questions.map((q) => {
      let sumScore = 0;
      let ratedCount = 0;
      const responseCounts: Record<string, number> = {};

      responses.forEach((res) => {
        const answers = safeParseJson(res.answers, {});
        const answerVal = answers[q.id] ?? answers[q.code];

        if (answerVal !== undefined && answerVal !== null && answerVal !== '') {
          const valStr = String(answerVal);
          responseCounts[valStr] = (responseCounts[valStr] || 0) + 1;

          if (q.questionType === 'LIKERT_5') {
            const numVal = typeof answerVal === 'number' ? answerVal : parseInt(valStr.charAt(0), 10);
            if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
              sumScore += numVal;
              ratedCount++;
            }
          } else if (q.questionType === 'OPEN_TEXT' && valStr.trim().length > 0) {
            openFeedbackNotes.push(valStr.trim());
          }
        }
      });

      const meanScore = ratedCount > 0 ? Math.round((sumScore / ratedCount) * 100) / 100 : undefined;

      return {
        questionCode: q.code,
        prompt: q.prompt,
        questionType: q.questionType,
        meanScore,
        responseCounts,
      };
    });

    // Also collect general qualitative notes from response records
    responses.forEach((res) => {
      if (res.qualitativeNotes && res.qualitativeNotes.trim().length > 0) {
        openFeedbackNotes.push(res.qualitativeNotes.trim());
      }
    });

    return {
      questionnaireId: questionnaire.id,
      title: questionnaire.title,
      targetRole: questionnaire.targetRole,
      version: questionnaire.version,
      totalResponses,
      questionAverages,
      openFeedbackNotes,
    };
  }

  /**
   * Admin: Lists all questionnaires.
   */
  static async listQuestionnaires(isDemo?: boolean) {
    const where: any = {};
    if (isDemo !== undefined) where.isDemo = isDemo;

    const questionnaires = await prisma.surveyQuestionnaire.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return questionnaires.map((q) => SurveyDTO.toQuestionnaireDTO(q));
  }
}

function safeParseJson(str: any, fallback: any = {}): any {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
