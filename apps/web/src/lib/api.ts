// API Client for APIHub Frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1';

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

export function getStoredUser(): { id: string; name: string; email: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('apihub-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: { id: string; name: string; email: string } | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('apihub-user', JSON.stringify(user));
  } else {
    localStorage.removeItem('apihub-user');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
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
    credentials: 'include',
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
      return res;
    },

    async resetPassword(data: { email: string; code: string; newPassword: string }) {
      return request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async register(data: { name: string; email: string; password: string }) {
      const res = await request<{ user: any; token: string; defaultWorkspace: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) setStoredToken(res.token);
      if (res.user) setStoredUser(res.user);
      return res;
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
    },

    async getMe() {
      const res = await request<{ user: any }>('/auth/me', {
        method: 'GET',
      });
      if (res.user) setStoredUser(res.user);
      return res.user;
    },
  },

  tester: {
    async execute(payload: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: string;
    }) {
      return request<any>('/tester/execute', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  workspaces: {
    async list() {
      return request<any[]>('/workspaces', { method: 'GET' });
    },
    async create(data: { name: string; description?: string }) {
      return request<any>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
