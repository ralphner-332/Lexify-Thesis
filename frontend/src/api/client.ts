const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('yawa_token');
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Network request failed', response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password?: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    quickLogin: (role: 'STUDENT' | 'EXPERT' | 'ADMIN') =>
      request<{ success: boolean; token: string; user: any }>('/auth/quick-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    me: () => request<{ success: boolean; user: any }>('/auth/me'),
    acceptDisclaimer: () =>
      request<{ success: boolean; disclaimerAcceptedAt: string }>('/auth/accept-disclaimer', {
        method: 'POST',
      }),
  },

  // Questions
  questions: {
    list: (includeInactive = false) =>
      request<{ success: boolean; data: any[] }>(`/questions${includeInactive ? '?includeInactive=true' : ''}`),
    getById: (id: string) => request<{ success: boolean; data: any }>(`/questions/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/questions/${id}`, {
        method: 'DELETE',
      }),
  },

  // Rubrics
  rubrics: {
    list: () => request<{ success: boolean; data: any[] }>('/rubrics'),
    getDefault: () => request<{ success: boolean; data: any }>('/rubrics/default'),
    getById: (id: string) => request<{ success: boolean; data: any }>(`/rubrics/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/rubrics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/rubrics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/rubrics/${id}`, {
        method: 'DELETE',
      }),
  },

  // Agent Versions
  agentVersions: {
    list: () => request<{ success: boolean; data: any[] }>('/agent-versions'),
    getActive: () => request<{ success: boolean; data: any }>('/agent-versions/active'),
    getById: (id: string) => request<{ success: boolean; data: any }>(`/agent-versions/${id}`),
    createDraft: (data: any) =>
      request<{ success: boolean; data: any }>('/agent-versions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateDraft: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/agent-versions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    lock: (id: string) =>
      request<{ success: boolean; message: string; data: any }>(`/agent-versions/${id}/lock`, {
        method: 'POST',
      }),
    activate: (id: string) =>
      request<{ success: boolean; message: string; data: any }>(`/agent-versions/${id}/activate`, {
        method: 'POST',
      }),
    compare: (vA: string, vB: string) =>
      request<{ success: boolean; data: any }>(`/agent-versions/compare?vA=${vA}&vB=${vB}`),
  },

  // Audit Logs
  audit: {
    list: (params: { entityType?: string; limit?: number; offset?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.entityType) query.set('entityType', params.entityType);
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      return request<{ success: boolean; data: { total: number; logs: any[] } }>(
        `/audit-logs?${query.toString()}`
      );
    },
  },
};
