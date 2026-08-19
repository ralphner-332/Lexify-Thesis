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
      const res = await this.request<{ success: boolean; data: { token: string; user: User } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: credentials.email, passwordHash: credentials.password || 'password123' }),
      });
      return res.data;
    },

    quickLogin: async (role: string) => {
      const res = await this.request<{ success: boolean; data: { token: string; user: User } }>('/auth/quick-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      return res.data;
    },

    me: async () => {
      const res = await this.request<{ success: boolean; data: User }>('/auth/me');
      return { user: res.data };
    },

    acceptDisclaimer: async () => {
      const res = await this.request<{ success: boolean; data: { disclaimerAcceptedAt: string } }>(
        '/auth/accept-disclaimer',
        { method: 'POST' }
      );
      return res.data;
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
}

export const api = new ApiClient();
