import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { testerService } from '../tester/tester.service';
import { recordAuditLog } from '../../lib/audit';

export interface AssertionResult {
  rule: string;
  passed: boolean;
  detail: string;
}

export class RunnerService {
  private async ensureProjectAccess(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: { where: { userId } },
          },
        },
      },
    });
    if (!project || project.workspace.members.length === 0) {
      throw new AppError('Projeto não encontrado ou acesso negado.', 403, 'FORBIDDEN');
    }
    return project;
  }

  async listByProject(projectId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    return prisma.testCase.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    projectId: string,
    userId: string,
    input: {
      name: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      url: string;
      headers?: Record<string, string>;
      body?: string | null;
      expectedStatus?: number;
      maxLatencyMs?: number | null;
      bodyContains?: string | null;
    }
  ) {
    const project = await this.ensureProjectAccess(projectId, userId);
    await testerService.validateUrlSecurity(input.url.trim());

    const created = await prisma.testCase.create({
      data: {
        projectId,
        name: input.name.trim(),
        method: input.method,
        url: input.url.trim(),
        headers: (input.headers || {}) as any,
        body: input.body?.trim() || null,
        expectedStatus: input.expectedStatus || 200,
        maxLatencyMs: input.maxLatencyMs || null,
        bodyContains: input.bodyContains?.trim() || null,
      },
    });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'CREATE_TEST_CASE',
      entity: 'TestCase',
      entityId: created.id,
      metadata: { name: created.name, method: created.method, url: created.url },
    });

    return created;
  }

  async delete(testCaseId: string, userId: string) {
    const tc = await prisma.testCase.findUnique({ where: { id: testCaseId } });
    if (!tc) throw new AppError('Caso de teste não encontrado.', 404, 'NOT_FOUND');
    const project = await this.ensureProjectAccess(tc.projectId, userId);

    await prisma.testCase.delete({ where: { id: testCaseId } });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'DELETE_TEST_CASE',
      entity: 'TestCase',
      entityId: testCaseId,
      metadata: { name: tc.name },
    });

    return { message: 'Caso de teste removido.' };
  }

  async executeTestCase(tc: {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    headers: any;
    body: string | null;
    expectedStatus: number;
    maxLatencyMs: number | null;
    bodyContains: string | null;
  }) {
    const startTime = Date.now();
    let statusCode = 0;
    let responseBody = '';
    let networkError: string | null = null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      await testerService.validateUrlSecurity(tc.url);

      const sanitizedHeaders: Record<string, string> = {
        'User-Agent': 'CloudAPI-TestRunner/1.0',
      };
      if (tc.headers && typeof tc.headers === 'object') {
        for (const [k, v] of Object.entries(tc.headers)) {
          const ck = String(k).replace(/[\r\n\0]/g, '').trim();
          const cv = String(v).replace(/[\r\n\0]/g, '').trim();
          if (ck && !['host', 'connection', 'content-length'].includes(ck.toLowerCase())) {
            sanitizedHeaders[ck] = cv;
          }
        }
      }

      const hasBody = ['POST', 'PUT', 'PATCH'].includes(tc.method) && tc.body;
      if (hasBody && !Object.keys(sanitizedHeaders).some(k => k.toLowerCase() === 'content-type')) {
        sanitizedHeaders['Content-Type'] = 'application/json';
      }

      const res = await fetch(tc.url, {
        method: tc.method,
        headers: sanitizedHeaders,
        body: hasBody ? tc.body! : undefined,
        signal: controller.signal,
        redirect: 'manual',
      });

      statusCode = res.status;
      responseBody = (await res.text()).slice(0, 200000);
    } catch (err: any) {
      networkError = err?.name === 'AbortError' ? 'Timeout após 10s' : err?.message || 'Erro de rede';
    } finally {
      clearTimeout(timeout);
    }

    const latencyMs = Date.now() - startTime;
    const assertions: AssertionResult[] = [];

    if (networkError) {
      assertions.push({
        rule: 'Conexão HTTP',
        passed: false,
        detail: networkError,
      });
    } else {
      const statusOk = statusCode === tc.expectedStatus;
      assertions.push({
        rule: `Status HTTP == ${tc.expectedStatus}`,
        passed: statusOk,
        detail: statusOk ? `Recebido ${statusCode}` : `Esperado ${tc.expectedStatus}, recebido ${statusCode}`,
      });

      if (tc.maxLatencyMs) {
        const latencyOk = latencyMs <= tc.maxLatencyMs;
        assertions.push({
          rule: `Latência <= ${tc.maxLatencyMs}ms`,
          passed: latencyOk,
          detail: `${latencyMs}ms`,
        });
      }

      if (tc.bodyContains) {
        const containsOk = responseBody.includes(tc.bodyContains);
        assertions.push({
          rule: `Corpo contém "${tc.bodyContains}"`,
          passed: containsOk,
          detail: containsOk ? 'Encontrado na resposta' : 'Texto não encontrado no corpo da resposta',
        });
      }
    }

    const allPassed = assertions.every(a => a.passed);
    const failedSummary = assertions
      .filter(a => !a.passed)
      .map(a => `${a.rule}: ${a.detail}`)
      .join(' | ');

    const updated = await prisma.testCase.update({
      where: { id: tc.id },
      data: {
        lastPassed: allPassed,
        lastStatusCode: statusCode,
        lastLatencyMs: latencyMs,
        lastError: failedSummary || null,
        lastRunAt: new Date(),
      },
    });

    return {
      testCase: updated,
      passed: allPassed,
      statusCode,
      latencyMs,
      assertions,
    };
  }

  async runSingle(testCaseId: string, userId: string) {
    const tc = await prisma.testCase.findUnique({ where: { id: testCaseId } });
    if (!tc) throw new AppError('Caso de teste não encontrado.', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(tc.projectId, userId);
    return this.executeTestCase(tc);
  }

  async runAllByProject(projectId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    const cases = await prisma.testCase.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    const results = [];
    for (const tc of cases) {
      results.push(await this.executeTestCase(tc));
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;

    return {
      total: results.length,
      passed,
      failed,
      allPassed: failed === 0,
      results,
    };
  }

  async runAllByWorkspace(workspaceId: string) {
    const cases = await prisma.testCase.findMany({
      where: { project: { workspaceId } },
      orderBy: { createdAt: 'asc' },
    });

    const results = [];
    for (const tc of cases) {
      results.push(await this.executeTestCase(tc));
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;

    return {
      total: results.length,
      passed,
      failed,
      allPassed: failed === 0,
      results: results.map(r => ({
        id: r.testCase.id,
        name: r.testCase.name,
        method: r.testCase.method,
        url: r.testCase.url,
        passed: r.passed,
        statusCode: r.statusCode,
        latencyMs: r.latencyMs,
        assertions: r.assertions,
      })),
    };
  }
}

export const runnerService = new RunnerService();
