import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server';
import { testerService } from '../src/modules/tester/tester.service';
import { validateRealEmail } from '../src/modules/auth/email-validator';

describe('CloudAPI Pre-Launch Security Audit', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('HTTP Security Headers', () => {
    it('sets anti-sniffing, anti-clickjacking, referrer, and permissions headers', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['permissions-policy']).toContain('camera=()');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Authentication & Access Control (Zero Unauthenticated Leakage)', () => {
    const protectedEndpoints: { method: 'GET' | 'POST' | 'DELETE'; url: string }[] = [
      { method: 'GET', url: '/api/v1/workspaces' },
      { method: 'GET', url: '/api/v1/workspaces/fake-ws-id/keys' },
      { method: 'GET', url: '/api/v1/workspaces/fake-ws-id/projects' },
      { method: 'GET', url: '/api/v1/workspaces/fake-ws-id/webhooks' },
      { method: 'GET', url: '/api/v1/workspaces/fake-ws-id/incidents' },
      { method: 'GET', url: '/api/v1/projects/fake-proj-id/apis' },
      { method: 'GET', url: '/api/v1/projects/fake-proj-id/endpoints' },
      { method: 'GET', url: '/api/v1/projects/fake-proj-id/monitors' },
      { method: 'GET', url: '/api/v1/projects/fake-proj-id/environments' },
      { method: 'GET', url: '/api/v1/projects/fake-proj-id/test-cases' },
      { method: 'POST', url: '/api/v1/projects/fake-proj-id/tester/execute' },
      { method: 'POST', url: '/api/v1/projects/fake-proj-id/benchmark' },
      { method: 'DELETE', url: '/api/v1/endpoints/fake-ep-id' },
      { method: 'DELETE', url: '/api/v1/apis/fake-api-id' },
    ];

    it.each(protectedEndpoints)('blocks unauthenticated $method $url with 401', async ({ method, url }) => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });

    it('rejects forged / tampered JWT Bearer tokens with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFkbWluIn0.invalid_signature',
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('blocks External CI/CD API without valid x-api-key', async () => {
      const resMissing = await app.inject({ method: 'GET', url: '/api/v1/external/status' });
      expect(resMissing.statusCode).toBe(401);

      const resInvalid = await app.inject({
        method: 'GET',
        url: '/api/v1/external/status',
        headers: { 'x-api-key': 'invalid_key_format_attempt' },
      });
      expect(resInvalid.statusCode).toBe(401);
    });
  });

  describe('Advanced SSRF & Injection Hardening', () => {
    it('blocks IPv6 loopback, 0.0.0.0, 172.16.x.x private subnet, and javascript: protocol', async () => {
      await expect(testerService.validateUrlSecurity('http://[::1]:3333/health')).rejects.toThrow();
      await expect(testerService.validateUrlSecurity('http://0.0.0.0:3333/health')).rejects.toThrow();
      await expect(testerService.validateUrlSecurity('http://172.16.0.1/internal')).rejects.toThrow();
      await expect(testerService.validateUrlSecurity('javascript:alert(1)')).rejects.toThrow();
    });

    it('rejects disposable temporary email domains and malformed addresses', async () => {
      await expect(validateRealEmail('attacker@mailinator.com')).rejects.toThrow();
      await expect(validateRealEmail('bot@10minutemail.com')).rejects.toThrow();
      await expect(validateRealEmail('not-an-email')).rejects.toThrow();
    });
  });
});
