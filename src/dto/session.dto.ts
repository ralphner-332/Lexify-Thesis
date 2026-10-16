export interface StudentQuestionItemDTO {
  id: string;
  code: string;
  title: string;
  testSet: string;
  scenario: string;
  orderIndex: number;
  draftAnswer: string;
  isAnswered: boolean;
}

export interface StudentSessionDTO {
  id: string;
  studentId: string;
  testSet: string;
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

    const firstQ = fullQuestions[0];
    const sessionTestSet = firstQ?.testSet ||
      (firstQ?.code?.startsWith('TEST2') ? 'TEST_2' :
       firstQ?.code?.startsWith('TEST3') ? 'TEST_3' :
       firstQ?.code?.startsWith('TEST4') ? 'TEST_4' : 'TEST_1');

    const sanitizedQuestions: StudentQuestionItemDTO[] = fullQuestions.map((q: any) => {
      const draft = draftsMap[q.id] || '';
      const qTestSet = q.testSet ||
        (q.code?.startsWith('TEST2') ? 'TEST_2' :
         q.code?.startsWith('TEST3') ? 'TEST_3' :
         q.code?.startsWith('TEST4') ? 'TEST_4' : 'TEST_1');

      return {
        id: q.id,
        code: q.code,
        title: q.title,
        testSet: qTestSet,
        scenario: q.scenario,
        orderIndex: q.orderIndex,
        draftAnswer: draft,
        isAnswered: draft.trim().length > 0,
      };
    });

    return {
      id: session.id,
      studentId: session.studentId,
      testSet: sessionTestSet,
      status: session.status,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      questions: sanitizedQuestions,
    };
  }
}
