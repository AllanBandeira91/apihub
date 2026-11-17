// API Client for APIHub Frontend (100% Real Backend + Supabase)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
}

export interface BootstrapData {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  };
  project: {
    id: string;
    name: string;
    slug: string;
  };
  stats: {
    apisCount: number;
    endpointsCount: number;
    keysCount: number;
    totalRequests: number;
    avgLatencyMs: number;
  };
  recentLogs: RequestLogItem[];
}

export interface ApiSummaryItem {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  baseUrl: string;
  version: string;
  isPublic: boolean;
  publicSlug?: string | null;
  _count?: { endpoints: number };
}

export interface EndpointItem {
  id: string;
  apiId: string;
  apiName: string;
  baseUrl: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description?: string | null;
  tags: string[];
  requestBody?: string | null;
  parametersCount: number;
  parameters?: {
    id?: string;
    name: string;
    in: 'query' | 'path' | 'header';
    required: boolean;
    description?: string | null;
    example?: string | null;
  }[];
  responseExamples?: {
    id?: string;
    statusCode: number;
    description?: string | null;
    body?: string | null;
  }[];
  createdAt?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: string;
  revokedAt: string | null;
}

export interface RequestLogItem {
  id: string;
  projectId: string;
  endpointId?: string | null;
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  error?: string | null;
  createdAt: string;
}

export interface WorkspaceMemberItem {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EnvVariableItem {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface EnvironmentItem {
  id: string;
  projectId: string;
  name: string;
  variables: EnvVariableItem[];
  isDefault: boolean;
  createdAt: string;
}

export interface UptimeCheckItem {
  id: string;
  status: 'UP' | 'DOWN';
  statusCode: number;
  latencyMs: number;
  error?: string | null;
  checkedAt: string;
}

export interface UptimeMonitorItem {
  id: string;
  projectId: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  intervalMinutes: number;
  expectedStatus: number;
  alertEmail: string;
  isActive: boolean;
  lastStatus: 'PENDING' | 'UP' | 'DOWN';
  lastStatusCode?: number | null;
  lastLatencyMs?: number | null;
  lastCheckedAt?: string | null;
  totalChecks: number;
  upChecks: number;
  uptimePercent: number;
  checks: UptimeCheckItem[];
}

export interface AuditLogItem {
  id: string;
  workspaceId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface MetricsData {
  totalRequests: number;
  avgDurationMs: number;
  statusDistribution: { statusCode: number; count: number }[];
  recentLatencySeries: { timestamp: string; durationMs: number; status: number }[];
}

export function interpolateVariables(text: string, variables: EnvVariableItem[]): string {
  if (!text || !variables || variables.length === 0) return text;
  let result = text;
  for (const v of variables) {
    if (!v.key) continue;
    const pattern = new RegExp(`\\{\\{\\s*${v.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, v.value ?? '');
  }
  return result;
}

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('apihub-active-workspace');
}

export function setActiveWorkspaceId(workspaceId: string | null) {
  if (typeof window === 'undefined') return;
  if (workspaceId) {
    localStorage.setItem('apihub-active-workspace', workspaceId);
  } else {
    localStorage.removeItem('apihub-active-workspace');
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('apihub-token');
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('apihub-token', token);
  } else {
    localStorage.removeItem('apihub-token');
  }
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('apihub-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('apihub-user', JSON.stringify(user));
  } else {
    localStorage.removeItem('apihub-user');
  }
}

async function request<T>(path: string, options: RequestInit = {}, skipAuth = false): Promise<T> {
  const token = skipAuth ? null : getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: skipAuth ? 'omit' : 'include',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = json?.error?.message || json?.message || 'Falha na requisição';
    throw new Error(errorMsg);
  }

  return json?.data ?? json;
}

export const api = {
  auth: {
    async sendVerification(email: string, type: 'REGISTER' | 'PASSWORD_RESET' = 'REGISTER') {
      return request<{ email: string; type: string; expiresInMinutes: number }>('/auth/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email, type }),
      });
    },

    async registerWithCode(data: { name: string; email: string; password: string; code: string }) {
      const res = await request<{ user: any; token: string; defaultWorkspace: any }>('/auth/register-with-code', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) setStoredToken(res.token);
      if (res.user) setStoredUser(res.user);
      if (res.defaultWorkspace?.id) setActiveWorkspaceId(res.defaultWorkspace.id);
      return res;
    },

    async resetPassword(data: { email: string; code: string; newPassword: string }) {
      return request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async login(data: { email: string; password: string }) {
      const res = await request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) setStoredToken(res.token);
      if (res.user) setStoredUser(res.user);
      return res;
    },

    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch {}
      setStoredToken(null);
      setStoredUser(null);
      setActiveWorkspaceId(null);
    },

    async getMe() {
      const res = await request<{ user: any }>('/auth/me', { method: 'GET' });
      if (res.user) setStoredUser({ id: res.user.id, name: res.user.name, email: res.user.email });
      return res.user;
    },

    async updateProfile(name: string) {
      const res = await request<{ user: StoredUser }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      if (res.user) setStoredUser(res.user);
      return res.user;
    },

    async changePassword(data: { currentPassword: string; newPassword: string }) {
      return request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteAccount(password: string) {
      const res = await request<{ message: string }>('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
      setStoredToken(null);
      setStoredUser(null);
      setActiveWorkspaceId(null);
      return res;
    },
  },

  workspaces: {
    async bootstrap(explicitWorkspaceId?: string) {
      const wsId = explicitWorkspaceId || getActiveWorkspaceId();
      const query = wsId ? `?workspaceId=${encodeURIComponent(wsId)}` : '';
      const data = await request<BootstrapData>(`/workspaces/bootstrap${query}`, { method: 'GET' });
      if (data.workspace?.id) {
        setActiveWorkspaceId(data.workspace.id);
      }
      return data;
    },
    async list() {
      const res = await request<{ workspaces: any[] }>('/workspaces', { method: 'GET' });
      return res.workspaces;
    },
    async create(data: { name: string; slug: string; description?: string }) {
      const res = await request<{ workspace: any }>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.workspace;
    },
    async update(workspaceId: string, data: { name?: string; description?: string }) {
      return request<{ workspace: any }>(`/workspaces/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    async listMembers(workspaceId: string) {
      return request<{ members: WorkspaceMemberItem[] }>(`/workspaces/${workspaceId}/members`, {
        method: 'GET',
      });
    },
    async addMember(workspaceId: string, data: { email: string; role: 'ADMIN' | 'EDITOR' | 'VIEWER' }) {
      return request<{ status: 'ADDED' | 'INVITE_SENT'; message: string; member?: WorkspaceMemberItem }>(
        `/workspaces/${workspaceId}/members`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },
    async removeMember(workspaceId: string, memberId: string) {
      return request<{ message: string }>(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });
    },
    async auditLogs(workspaceId: string, limit = 50) {
      const res = await request<{ logs: AuditLogItem[] }>(
        `/workspaces/${workspaceId}/audit-logs?limit=${limit}`,
        { method: 'GET' }
      );
      return res.logs;
    },
  },

  apis: {
    async listByProject(projectId: string) {
      const res = await request<{ apis: ApiSummaryItem[] }>(`/projects/${projectId}/apis`, {
        method: 'GET',
      });
      return res.apis;
    },
    async setVisibility(apiId: string, isPublic: boolean) {
      const res = await request<{ api: ApiSummaryItem }>(`/apis/${apiId}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic }),
      });
      return res.api;
    },
    async getPublicDocs(slug: string) {
      const res = await request<{ api: any }>(`/public/docs/${encodeURIComponent(slug)}`, { method: 'GET' }, true);
      return res.api;
    },
  },

  endpoints: {
    async list(projectId: string) {
      const res = await request<{ endpoints: EndpointItem[] }>(`/projects/${projectId}/endpoints`, {
        method: 'GET',
      });
      return res.endpoints;
    },
    async quickCreate(
      projectId: string,
      data: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path: string;
        summary: string;
        description?: string;
        tags?: string[];
        apiName?: string;
        baseUrl?: string;
      }
    ) {
      const res = await request<{ endpoint: EndpointItem }>(`/projects/${projectId}/endpoints/quick`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.endpoint;
    },
    async updateFull(
      endpointId: string,
      data: {
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path?: string;
        summary?: string;
        description?: string | null;
        tags?: string[];
        requestBody?: string | null;
        parameters?: {
          name: string;
          in: 'query' | 'path' | 'header';
          required?: boolean;
          description?: string | null;
          example?: string | null;
        }[];
        responseExamples?: {
          statusCode: number;
          description?: string | null;
          body?: string | null;
        }[];
      }
    ) {
      const res = await request<{ endpoint: EndpointItem }>(`/endpoints/${endpointId}/full`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.endpoint;
    },
    async delete(endpointId: string) {
      return request<{ message: string }>(`/endpoints/${endpointId}`, {
        method: 'DELETE',
      });
    },
    async importOpenApi(projectId: string, spec: any) {
      return request<{ api: any; importedCount: number }>(`/projects/${projectId}/import-openapi`, {
        method: 'POST',
        body: JSON.stringify(spec),
      });
    },
  },

  environments: {
    async list(projectId: string) {
      const res = await request<{ environments: EnvironmentItem[] }>(`/projects/${projectId}/environments`, {
        method: 'GET',
      });
      return res.environments;
    },
    async create(projectId: string, data: { name: string; variables: EnvVariableItem[]; isDefault?: boolean }) {
      const res = await request<{ environment: EnvironmentItem }>(`/projects/${projectId}/environments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.environment;
    },
    async update(envId: string, data: { name?: string; variables?: EnvVariableItem[]; isDefault?: boolean }) {
      const res = await request<{ environment: EnvironmentItem }>(`/environments/${envId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.environment;
    },
    async delete(envId: string) {
      return request<{ message: string }>(`/environments/${envId}`, {
        method: 'DELETE',
      });
    },
  },

  monitors: {
    async list(projectId: string) {
      const res = await request<{ monitors: UptimeMonitorItem[] }>(`/projects/${projectId}/monitors`, {
        method: 'GET',
      });
      return res.monitors;
    },
    async create(
      projectId: string,
      data: {
        name: string;
        url: string;
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        intervalMinutes?: number;
        expectedStatus?: number;
        alertEmail: string;
      }
    ) {
      const res = await request<{ monitor: UptimeMonitorItem }>(`/projects/${projectId}/monitors`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.monitor;
    },
    async checkNow(monitorId: string) {
      const res = await request<{ monitor: UptimeMonitorItem }>(`/monitors/${monitorId}/check`, {
        method: 'POST',
      });
      return res.monitor;
    },
    async toggleActive(monitorId: string, isActive: boolean) {
      const res = await request<{ monitor: UptimeMonitorItem }>(`/monitors/${monitorId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      return res.monitor;
    },
    async delete(monitorId: string) {
      return request<{ message: string }>(`/monitors/${monitorId}`, {
        method: 'DELETE',
      });
    },
  },

  keys: {
    async list(workspaceId: string) {
      const res = await request<{ keys: ApiKeyItem[] }>(`/workspaces/${workspaceId}/keys`, {
        method: 'GET',
      });
      return res.keys;
    },
    async create(workspaceId: string, name: string, permissions: string[] = ['read', 'write']) {
      return request<{ apiKey: ApiKeyItem; secretKey: string }>(`/workspaces/${workspaceId}/keys`, {
        method: 'POST',
        body: JSON.stringify({ name, permissions }),
      });
    },
    async revoke(workspaceId: string, keyId: string) {
      return request<{ message: string }>(`/workspaces/${workspaceId}/keys/${keyId}`, {
        method: 'DELETE',
      });
    },
  },

  tester: {
    async execute(
      projectId: string,
      payload: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        url: string;
        headers?: Record<string, string>;
        body?: string;
        endpointId?: string;
      }
    ) {
      return request<{
        statusCode: number;
        durationMs: number;
        headers: Record<string, string>;
        body: string;
        error: string | null;
      }>(`/projects/${projectId}/tester/execute`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async logs(projectId: string, limit = 30) {
      const res = await request<{ logs: RequestLogItem[] }>(
        `/projects/${projectId}/tester/logs?limit=${limit}`,
        { method: 'GET' }
      );
      return res.logs;
    },
    async clearLogs(projectId: string) {
      return request<{ message: string }>(`/projects/${projectId}/tester/logs`, {
        method: 'DELETE',
      });
    },
    async metrics(projectId: string) {
      const res = await request<{ metrics: MetricsData }>(`/projects/${projectId}/metrics`, {
        method: 'GET',
      });
      return res.metrics;
    },
  },
};
