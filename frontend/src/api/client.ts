import {
  User,
  Question,
  Rubric,
  AgentVersion,
  AuditLog,
  AssessmentSession,
  SessionReviewChecklist,
  StudentEvaluationFeedback,
  AdminEvaluation,
  ExpertQueueItem,
  ExpertSubmissionDetail,
  ComparisonItem,
  ComparisonSummary,
  RefinementLog,
  V3ReviewQueueItem,
  V3EvaluationReviewDetail,
  FinalEvaluationRecord,
  SurveyQuestionnaire,
  SurveyResponse,
  SurveySummaryMetrics,
  ProgressionAnalytics,
  AcademicReportData,
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('yawa_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  }

  // --- Auth APIs ---
  auth = {
    login: async (credentials: { email: string; password?: string }) => {
      const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password || 'Password123!',
        }),
      });
      if (!res || !res.token || !res.user) {
        throw new Error('Invalid authentication response from server.');
      }
      return { token: res.token, user: res.user };
    },

    quickLogin: async (role: string) => {
      const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/quick-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (!res || !res.token || !res.user) {
        throw new Error('Invalid quick-login response from server.');
      }
      return { token: res.token, user: res.user };
    },

    me: async () => {
      const res = await this.request<{ success: boolean; user: User }>('/auth/me');
      if (!res || !res.user) {
        throw new Error('Failed to retrieve user profile.');
      }
      return { user: res.user };
    },

    acceptDisclaimer: async () => {
      const res = await this.request<{ success: boolean; disclaimerAcceptedAt: string; message: string }>(
        '/auth/accept-disclaimer',
        { method: 'POST' }
      );
      return { disclaimerAcceptedAt: res.disclaimerAcceptedAt };
    },
  };

  // --- Questions APIs ---
  questions = {
    list: async (activeOnly?: boolean) => {
      const endpoint = activeOnly ? '/questions?active=true' : '/questions';
      return this.request<{ success: boolean; data: Question[] }>(endpoint);
    },

    getAll: async () => {
      return this.request<{ success: boolean; data: Question[] }>('/questions');
    },

    getById: async (id: string) => {
      return this.request<{ success: boolean; data: Question }>(`/questions/${id}`);
    },

    create: async (data: Partial<Question>) => {
      return this.request<{ success: boolean; data: Question }>('/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Question>) => {
      return this.request<{ success: boolean; data: Question }>(`/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return this.request<{ success: boolean; message: string }>(`/questions/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // --- Rubrics APIs ---
  rubrics = {
    list: async () => {
      return this.request<{ success: boolean; data: Rubric[] }>('/rubrics');
    },

    getAll: async () => {
      return this.request<{ success: boolean; data: Rubric[] }>('/rubrics');
    },

    getDefault: async () => {
      return this.request<{ success: boolean; data: Rubric }>('/rubrics/default');
    },

    save: async (data: { name: string; description: string; criteria: any[] }) => {
      return this.request<{ success: boolean; data: Rubric }>('/rubrics', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    create: async (data: { name: string; description: string; criteria: any[] }) => {
      return this.request<{ success: boolean; data: Rubric }>('/rubrics', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: { name: string; description: string; criteria: any[] }) => {
      return this.request<{ success: boolean; data: Rubric }>(`/rubrics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  };

  // --- Agent Version APIs ---
  agentVersions = {
    list: async () => {
      return this.request<{ success: boolean; data: AgentVersion[] }>('/agent-versions');
    },

    getAll: async () => {
      return this.request<{ success: boolean; data: AgentVersion[] }>('/agent-versions');
    },

    getActive: async () => {
      return this.request<{ success: boolean; data: AgentVersion }>('/agent-versions/active');
    },

    create: async (data: Partial<AgentVersion>) => {
      return this.request<{ success: boolean; data: AgentVersion }>('/agent-versions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    branch: async (data: {
      parentVersionTag: string;
      newVersionTag: string;
      label: string;
      description: string;
      systemInstructions?: string;
      skillsDefinition?: Record<string, any>;
      rubricSnapshot?: Record<string, any>;
      evaluationPatterns?: Record<string, any>;
      modelConfig?: any;
      changelogEntry: {
        component: string;
        changeSummary: string;
        rationale: string;
        linkedRefinementIds: string[];
      };
    }) => {
      return this.request<{ success: boolean; message: string; data: AgentVersion }>(
        '/agent-versions/branch',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },

    lock: async (id: string) => {
      return this.request<{ success: boolean; data: AgentVersion; message?: string }>(
        `/agent-versions/${id}/lock`,
        { method: 'POST' }
      );
    },

    activate: async (id: string) => {
      return this.request<{ success: boolean; data: AgentVersion; message?: string }>(
        `/agent-versions/${id}/activate`,
        { method: 'POST' }
      );
    },

    compare: async (v1: string, v2: string) => {
      return this.request<{ success: boolean; data: any }>(`/agent-versions/compare?v1=${v1}&v2=${v2}`);
    },
  };

  // --- Audit Logs APIs ---
  audit = {
    list: async (filter?: { limit?: number; offset?: number; isDemo?: boolean; entityType?: string }) => {
      const query = new URLSearchParams();
      if (filter?.limit) query.append('limit', String(filter.limit));
      if (filter?.offset) query.append('offset', String(filter.offset));
      if (filter?.isDemo !== undefined) query.append('isDemo', String(filter.isDemo));
      if (filter?.entityType) query.append('entityType', filter.entityType);
      return this.request<{ success: boolean; data: { total: number; logs: AuditLog[] } }>(
        `/audit-logs?${query.toString()}`
      );
    },
  };

  auditLogs = {
    getAll: async (filter?: { limit?: number; offset?: number; isDemo?: boolean; entityType?: string }) => {
      return this.audit.list(filter);
    },
  };

  // --- Phase 2: Assessment Session APIs ---
  sessions = {
    getActive: async () => {
      return this.request<{ success: boolean; data: AssessmentSession }>('/sessions/active');
    },

    create: async () => {
      return this.request<{ success: boolean; data: AssessmentSession }>('/sessions/new', {
        method: 'POST',
      });
    },

    getHistory: async () => {
      return this.request<{ success: boolean; data: AssessmentSession[] }>('/sessions/history');
    },

    saveDraft: async (sessionId: string, questionId: string, answerText: string) => {
      return this.request<{ success: boolean; data: { questionId: string; answerText: string } }>(
        '/sessions/draft',
        {
          method: 'POST',
          body: JSON.stringify({ sessionId, questionId, answerText }),
        }
      );
    },

    getReview: async (sessionId: string) => {
      return this.request<{ success: boolean; data: SessionReviewChecklist }>(
        `/sessions/${sessionId}/review`
      );
    },

    getById: async (sessionId: string) => {
      return this.request<{ success: boolean; data: AssessmentSession }>(`/sessions/${sessionId}`);
    },

    submit: async (sessionId: string) => {
      return this.request<{ success: boolean; message: string; sessionId: string; submittedAt: string }>(
        `/sessions/${sessionId}/submit`,
        {
          method: 'POST',
        }
      );
    },
  };

  // --- Phase 2: Evaluation APIs ---
  evaluations = {
    getSessionFeedback: async (sessionId: string) => {
      return this.request<{ success: boolean; data: StudentEvaluationFeedback[] }>(
        `/evaluations/session/${sessionId}`
      );
    },

    getAdminList: async (filter?: {
      agentVersionId?: string;
      sessionId?: string;
      questionId?: string;
      isDemo?: boolean;
      hasReviewFlags?: boolean;
    }) => {
      const query = new URLSearchParams();
      if (filter?.agentVersionId) query.append('agentVersionId', filter.agentVersionId);
      if (filter?.sessionId) query.append('sessionId', filter.sessionId);
      if (filter?.questionId) query.append('questionId', filter.questionId);
      if (filter?.isDemo !== undefined) query.append('isDemo', String(filter.isDemo));
      if (filter?.hasReviewFlags) query.append('hasReviewFlags', 'true');
      return this.request<{ success: boolean; data: { total: number; evaluations: AdminEvaluation[] } }>(
        `/evaluations?${query.toString()}`
      );
    },
  };

  // --- Phase 3: Double-Blind Expert APIs ---
  expert = {
    getQueue: async (isDemo?: boolean) => {
      const query = new URLSearchParams();
      if (isDemo !== undefined) query.append('isDemo', String(isDemo));
      return this.request<{ success: boolean; data: ExpertQueueItem[] }>(
        `/expert/queue?${query.toString()}`
      );
    },

    getSubmission: async (sessionId: string, questionId: string) => {
      return this.request<{ success: boolean; data: ExpertSubmissionDetail }>(
        `/expert/submission/${sessionId}/${questionId}`
      );
    },

    saveDraft: async (
      sessionId: string,
      questionId: string,
      draftData: {
        numericalScore?: number;
        scoringBasis?: string;
        criterionScores?: any[];
        qualitativeComments?: string;
      }
    ) => {
      return this.request<{ success: boolean; message: string; draft: any }>('/expert/draft', {
        method: 'POST',
        body: JSON.stringify({ sessionId, questionId, ...draftData }),
      });
    },

    submitEvaluation: async (
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
    ) => {
      return this.request<{ success: boolean; message: string; evaluation: any }>('/expert/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, questionId, ...evalData }),
      });
    },
  };

  // --- Phase 3: AI vs Expert Comparison APIs ---
  comparisons = {
    getList: async (filter?: {
      agentVersionId?: string;
      sessionId?: string;
      questionId?: string;
      isDemo?: boolean;
      thresholdPercent?: number;
      hasConflictOnly?: boolean;
    }) => {
      const query = new URLSearchParams();
      if (filter?.agentVersionId) query.append('agentVersionId', filter.agentVersionId);
      if (filter?.sessionId) query.append('sessionId', filter.sessionId);
      if (filter?.questionId) query.append('questionId', filter.questionId);
      if (filter?.isDemo !== undefined) query.append('isDemo', String(filter.isDemo));
      if (filter?.thresholdPercent !== undefined)
        query.append('thresholdPercent', String(filter.thresholdPercent));
      if (filter?.hasConflictOnly) query.append('hasConflictOnly', 'true');

      return this.request<{
        success: boolean;
        data: { summary: ComparisonSummary; comparisons: ComparisonItem[] };
      }>(`/comparisons?${query.toString()}`);
    },
  };

  // --- Phase 3: Structured Refinement Log APIs ---
  refinements = {
    getList: async (filter?: {
      agentVersionId?: string;
      targetComponent?: string;
      gapCategory?: string;
      status?: string;
      isDemo?: boolean;
    }) => {
      const query = new URLSearchParams();
      if (filter?.agentVersionId) query.append('agentVersionId', filter.agentVersionId);
      if (filter?.targetComponent) query.append('targetComponent', filter.targetComponent);
      if (filter?.gapCategory) query.append('gapCategory', filter.gapCategory);
      if (filter?.status) query.append('status', filter.status);
      if (filter?.isDemo !== undefined) query.append('isDemo', String(filter.isDemo));

      return this.request<{ success: boolean; data: RefinementLog[] }>(
        `/refinements?${query.toString()}`
      );
    },

    create: async (data: Partial<RefinementLog>) => {
      return this.request<{ success: boolean; data: RefinementLog }>('/refinements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<RefinementLog>) => {
      return this.request<{ success: boolean; data: RefinementLog }>(`/refinements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  };

  // --- Phase 4: Post-V3 Final Expert Review APIs ---
  finalReviews = {
    getQueue: async (isDemo?: boolean) => {
      const query = new URLSearchParams();
      if (isDemo !== undefined) query.append('isDemo', String(isDemo));
      return this.request<{ success: boolean; data: V3ReviewQueueItem[] }>(
        `/final-reviews/queue?${query.toString()}`
      );
    },

    getEvaluation: async (evaluationId: string) => {
      return this.request<{ success: boolean; data: V3EvaluationReviewDetail }>(
        `/final-reviews/evaluation/${evaluationId}`
      );
    },

    submitReview: async (
      evaluationId: string,
      reviewData: {
        agreementRating: number;
        reasoningCorrectnessRating?: number;
        statutoryGroundingRating?: number;
        recommendedScore: number;
        errorTags: string[];
        qualitativeComments?: string;
        improvementSuggestions?: string;
        finalVerdict: string;
      }
    ) => {
      return this.request<{ success: boolean; message: string; review: any }>(
        `/final-reviews/evaluation/${evaluationId}`,
        {
          method: 'POST',
          body: JSON.stringify(reviewData),
        }
      );
    },

    getList: async (filter?: { isDemo?: boolean; finalVerdict?: string; agentVersionId?: string }) => {
      const query = new URLSearchParams();
      if (filter?.isDemo !== undefined) query.append('isDemo', String(filter.isDemo));
      if (filter?.finalVerdict) query.append('finalVerdict', filter.finalVerdict);
      if (filter?.agentVersionId) query.append('agentVersionId', filter.agentVersionId);

      return this.request<{ success: boolean; data: FinalEvaluationRecord[] }>(
        `/final-reviews/reviews?${query.toString()}`
      );
    },
  };

  // --- Phase 4: Configurable Survey APIs ---
  surveys = {
    getActive: async (role?: 'STUDENT' | 'EXPERT', isDemo?: boolean) => {
      const query = new URLSearchParams();
      if (role) query.append('role', role);
      if (isDemo !== undefined) query.append('isDemo', String(isDemo));
      return this.request<{ success: boolean; data: SurveyQuestionnaire }>(
        `/surveys/active?${query.toString()}`
      );
    },

    submitResponse: async (data: {
      questionnaireId: string;
      answers: Record<string, any>;
      qualitativeNotes?: string;
      isDemo?: boolean;
    }) => {
      return this.request<{ success: boolean; message: string; response: SurveyResponse }>(
        '/surveys/response',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },

    getResponses: async (filter?: { questionnaireId?: string; respondentRole?: string; isDemo?: boolean }) => {
      const query = new URLSearchParams();
      if (filter?.questionnaireId) query.append('questionnaireId', filter.questionnaireId);
      if (filter?.respondentRole) query.append('respondentRole', filter.respondentRole);
      if (filter?.isDemo !== undefined) query.append('isDemo', String(filter.isDemo));

      return this.request<{ success: boolean; data: SurveyResponse[] }>(
        `/surveys/responses?${query.toString()}`
      );
    },

    getSummary: async (questionnaireId: string, isDemo?: boolean) => {
      const query = new URLSearchParams();
      if (isDemo !== undefined) query.append('isDemo', String(isDemo));
      return this.request<{ success: boolean; data: SurveySummaryMetrics }>(
        `/surveys/summary/${questionnaireId}?${query.toString()}`
      );
    },

    getQuestionnaires: async (isDemo?: boolean) => {
      const query = new URLSearchParams();
      if (isDemo !== undefined) query.append('isDemo', String(isDemo));
      return this.request<{ success: boolean; data: SurveyQuestionnaire[] }>(
        `/surveys/questionnaires?${query.toString()}`
      );
    },
  };

  // --- Phase 4: Descriptive Statistics APIs ---
  statistics = {
    getProgression: async (options?: { isDemo?: boolean; thresholdPercent?: number }) => {
      const query = new URLSearchParams();
      if (options?.isDemo !== undefined) query.append('isDemo', String(options.isDemo));
      if (options?.thresholdPercent !== undefined)
        query.append('thresholdPercent', String(options.thresholdPercent));

      return this.request<{ success: boolean; data: ProgressionAnalytics }>(
        `/statistics/progression?${query.toString()}`
      );
    },
  };

  // --- Phase 4: Research Export & Academic Report APIs ---
  exports = {
    getBundleJSON: async (options?: { isDemo?: boolean }) => {
      const query = new URLSearchParams();
      if (options?.isDemo !== undefined) query.append('isDemo', String(options.isDemo));
      return this.request<{ success: boolean; data: any }>(`/exports/json?${query.toString()}`);
    },

    getDatasetsCSV: async (options?: { isDemo?: boolean }) => {
      const query = new URLSearchParams();
      if (options?.isDemo !== undefined) query.append('isDemo', String(options.isDemo));
      return this.request<{ success: boolean; data: Record<string, string> }>(
        `/exports/csv?${query.toString()}`
      );
    },

    getAcademicReport: async (options?: { isDemo?: boolean }) => {
      const query = new URLSearchParams();
      if (options?.isDemo !== undefined) query.append('isDemo', String(options.isDemo));
      return this.request<{ success: boolean; data: AcademicReportData }>(
        `/exports/academic-report?${query.toString()}`
      );
    },
  };
}

export const api = new ApiClient();
