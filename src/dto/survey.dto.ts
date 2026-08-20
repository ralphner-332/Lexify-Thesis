export interface QuestionDTO {
  id: string;
  code: string;
  prompt: string;
  questionType: 'LIKERT_5' | 'OPEN_TEXT' | 'MULTIPLE_CHOICE' | string;
  options: string[];
  orderIndex: number;
  isRequired: boolean;
}

export interface QuestionnaireDTO {
  id: string;
  title: string;
  description: string;
  targetRole: 'STUDENT' | 'EXPERT';
  version: string;
  isActive: boolean;
  isDemo: boolean;
  questions: QuestionDTO[];
  createdAt: Date;
}

export interface SurveyResponseDTO {
  id: string;
  questionnaireId: string;
  respondentId: string;
  respondentRole: string;
  answers: Record<string, any>;
  qualitativeNotes: string;
  isDemo: boolean;
  createdAt: Date;
}

export interface SurveySummaryMetricsDTO {
  questionnaireId: string;
  title: string;
  targetRole: string;
  version: string;
  totalResponses: number;
  questionAverages: Array<{
    questionCode: string;
    prompt: string;
    questionType: string;
    meanScore?: number;
    responseCounts: Record<string, number>;
  }>;
  openFeedbackNotes: string[];
}

export class SurveyDTO {
  static toQuestionDTO(q: any): QuestionDTO {
    return {
      id: q.id,
      code: q.code,
      prompt: q.prompt,
      questionType: q.questionType,
      options: safeParseJson(q.options, []),
      orderIndex: q.orderIndex,
      isRequired: q.isRequired,
    };
  }

  static toQuestionnaireDTO(qnr: any): QuestionnaireDTO {
    return {
      id: qnr.id,
      title: qnr.title,
      description: qnr.description,
      targetRole: qnr.targetRole,
      version: qnr.version,
      isActive: qnr.isActive,
      isDemo: qnr.isDemo,
      questions: (qnr.questions || []).map(this.toQuestionDTO),
      createdAt: qnr.createdAt,
    };
  }

  static toResponseDTO(res: any): SurveyResponseDTO {
    return {
      id: res.id,
      questionnaireId: res.questionnaireId,
      respondentId: res.respondentId,
      respondentRole: res.respondentRole,
      answers: safeParseJson(res.answers, {}),
      qualitativeNotes: res.qualitativeNotes,
      isDemo: res.isDemo,
      createdAt: res.createdAt,
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
