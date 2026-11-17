import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { authenticate } from '../../middleware/auth';

const MAX_WEBHOOK_BODY_CHARS = 65536; // 64KB cap to prevent DB flooding
const MAX_CAPTURES_PER_WORKSPACE = 100;

async function ensureWorkspaceMember(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) {
    throw new AppError('Acesso negado a este workspace.', 403, 'FORBIDDEN');
  }
  return member;
}

async function handleIncomingHook(
  workspaceSlug: string,
  subPath: string,
  request: any,
  reply: any
) {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', '*');

  if (request.method === 'OPTIONS') {
    return reply.status(204).send();
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true },
  });

  if (!workspace) {
    return reply.status(404).send({
      received: false,
      error: 'Workspace Webhook Inspector não encontrado.',
    });
  }

  // Filter out sensitive/noisy internal headers
  const safeHeaders: Record<string, string> = {};
  for (const [key, val] of Object.entries(request.headers || {})) {
    const lk = key.toLowerCase();
    if (['cookie', 'set-cookie'].includes(lk)) continue;
    safeHeaders[key] = String(Array.isArray(val) ? val.join(', ') : val ?? '').slice(0, 1000);
  }

  let bodyStr: string | null = null;
  if (request.body !== undefined && request.body !== null) {
    bodyStr =
      typeof request.body === 'string'
        ? request.body.slice(0, MAX_WEBHOOK_BODY_CHARS)
        : JSON.stringify(request.body, null, 2).slice(0, MAX_WEBHOOK_BODY_CHARS);
  }

  const capture = await prisma.webhookCapture.create({
    data: {
      workspaceId: workspace.id,
      method: request.method.toUpperCase(),
      path: '/' + (subPath || '').replace(/^\/+/, ''),
      headers: safeHeaders as any,
      query: (request.query || {}) as any,
      body: bodyStr,
      ip: request.ip || null,
    },
  });

  // Trim old captures beyond cap (non-blocking)
  prisma.webhookCapture
    .findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      skip: MAX_CAPTURES_PER_WORKSPACE,
      select: { id: true },
    })
    .then(old => {
      if (old.length > 0) {
        return prisma.webhookCapture.deleteMany({
          where: { id: { in: old.map(o => o.id) } },
        });
      }
    })
    .catch(() => {});

  return reply.status(200).send({
    received: true,
    id: capture.id,
    workspace: workspace.name,
    timestamp: capture.createdAt,
  });
}

export async function webhooksRoutes(app: FastifyInstance) {
  // Public capture endpoints
  app.all('/hook/:workspaceSlug', async (request, reply) => {
    const { workspaceSlug } = request.params as { workspaceSlug: string };
    return handleIncomingHook(workspaceSlug, '', request, reply);
  });

  app.all('/hook/:workspaceSlug/*', async (request, reply) => {
    const params = request.params as { workspaceSlug: string; '*': string };
    return handleIncomingHook(params.workspaceSlug, params['*'] || '', request, reply);
  });

  // Protected inspection endpoints
  app.register(async protectedScope => {
    protectedScope.addHook('preHandler', authenticate);

    protectedScope.get('/workspaces/:workspaceId/webhooks', async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      await ensureWorkspaceMember(workspaceId, request.user!.id);

      const captures = await prisma.webhookCapture.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return reply.send({ success: true, data: { captures } });
    });

    protectedScope.delete('/workspaces/:workspaceId/webhooks', async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      await ensureWorkspaceMember(workspaceId, request.user!.id);

      await prisma.webhookCapture.deleteMany({ where: { workspaceId } });
      return reply.send({ success: true, data: { message: 'Webhooks capturados limpos.' } });
    });

    protectedScope.delete('/workspaces/:workspaceId/webhooks/:captureId', async (request, reply) => {
      const { workspaceId, captureId } = request.params as { workspaceId: string; captureId: string };
      await ensureWorkspaceMember(workspaceId, request.user!.id);

      await prisma.webhookCapture.deleteMany({
        where: { id: captureId, workspaceId },
      });
      return reply.send({ success: true, data: { message: 'Captura removida.' } });
    });
  });
}
