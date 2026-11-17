import crypto from 'crypto';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { runnerService } from '../runner/runner.service';

interface ApiKeyRequest extends FastifyRequest {
  apiKeyContext?: {
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string;
    keyId: string;
    permissions: string[];
  };
}

async function authenticateApiKey(request: ApiKeyRequest) {
  const rawKey =
    (request.headers['x-api-key'] as string | undefined) ||
    (request.headers.authorization?.startsWith('ApiKey ')
      ? request.headers.authorization.slice(7).trim()
      : undefined);

  if (!rawKey) {
    throw new AppError(
      'Header "x-api-key" obrigatório. Gere sua chave em /dashboard/keys.',
      401,
      'API_KEY_REQUIRED'
    );
  }

  const keyHash = crypto.createHash('sha256').update(rawKey.trim()).digest('hex');

  const keyRecord = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
    },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!keyRecord) {
    throw new AppError('API Key inválida ou revogada.', 401, 'INVALID_API_KEY');
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    throw new AppError('API Key expirada.', 401, 'EXPIRED_API_KEY');
  }

  request.apiKeyContext = {
    workspaceId: keyRecord.workspace.id,
    workspaceName: keyRecord.workspace.name,
    workspaceSlug: keyRecord.workspace.slug,
    keyId: keyRecord.id,
    permissions: keyRecord.permissions,
  };
}

export async function externalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticateApiKey);

  // CI/CD: Get workspace status & uptime monitors summary
  app.get('/external/status', async (request: ApiKeyRequest, reply) => {
    const ctx = request.apiKeyContext!;
    const monitors = await prisma.uptimeMonitor.findMany({
      where: { project: { workspaceId: ctx.workspaceId } },
      select: {
        id: true,
        name: true,
        url: true,
        lastStatus: true,
        lastStatusCode: true,
        lastLatencyMs: true,
        lastCheckedAt: true,
        totalChecks: true,
        upChecks: true,
        isActive: true,
      },
    });

    const formatted = monitors.map(m => ({
      ...m,
      uptimePercent: m.totalChecks > 0 ? Number(((m.upChecks / m.totalChecks) * 100).toFixed(2)) : 100,
    }));

    const hasDown = formatted.some(m => m.isActive && m.lastStatus === 'DOWN');

    return reply.send({
      success: true,
      data: {
        workspace: {
          id: ctx.workspaceId,
          name: ctx.workspaceName,
          slug: ctx.workspaceSlug,
        },
        overallStatus: hasDown ? 'DEGRADED' : 'OPERATIONAL',
        monitors: formatted,
      },
    });
  });

  // CI/CD: List all cataloged endpoints in workspace
  app.get('/external/endpoints', async (request: ApiKeyRequest, reply) => {
    const ctx = request.apiKeyContext!;
    const endpoints = await prisma.endpoint.findMany({
      where: { api: { project: { workspaceId: ctx.workspaceId } } },
      include: {
        api: { select: { name: true, baseUrl: true, version: true } },
      },
      orderBy: [{ path: 'asc' }, { method: 'asc' }],
    });

    return reply.send({
      success: true,
      data: {
        workspace: ctx.workspaceName,
        total: endpoints.length,
        endpoints: endpoints.map(e => ({
          id: e.id,
          api: e.api.name,
          baseUrl: e.api.baseUrl,
          method: e.method,
          path: e.path,
          summary: e.summary,
          tags: e.tags,
        })),
      },
    });
  });

  // CI/CD: Trigger automated Test Suite remotely
  app.post('/external/run-tests', async (request: ApiKeyRequest, reply) => {
    const ctx = request.apiKeyContext!;
    const report = await runnerService.runAllByWorkspace(ctx.workspaceId);

    return reply.status(report.allPassed ? 200 : 422).send({
      success: report.allPassed,
      data: report,
    });
  });
}
