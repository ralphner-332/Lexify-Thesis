export interface StudentQuestionItemDTO {
  id: string;
  code: string;
  title: string;
  scenario: string;
  orderIndex: number;
  draftAnswer: string;
  isAnswered: boolean;
}

export interface StudentSessionDTO {
  id: string;
  studentId: string;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  questions: StudentQuestionItemDTO[];
}

export class SessionDTO {
  /**
   * Strictly sanitizes AssessmentSession and full questionsSnapshot for student response.
   * Model answer, statutory elements, provisions, variations, and keys are completely stripped on the server side.
   */
  static toStudentDTO(session: any, draftsMap: Record<string, string>): StudentSessionDTO {
    let fullQuestions: any[] = [];
    try {
      fullQuestions = JSON.parse(session.questionsSnapshot || '[]');
    } catch {
      fullQuestions = [];
    }

    const sanitizedQuestions: StudentQuestionItemDTO[] = fullQuestions.map((q: any) => {
      const draft = draftsMap[q.id] || '';
      return {
        id: q.id,
        code: q.code,
        title: q.title,
        scenario: q.scenario,
        orderIndex: q.orderIndex,
        draftAnswer: draft,
        isAnswered: draft.trim().length > 0,
      };
    });

    return {
      id: session.id,
      studentId: session.studentId,
      status: session.status,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      questions: sanitizedQuestions,
    };
  }
}
