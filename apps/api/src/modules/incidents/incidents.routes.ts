import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { authenticate, requireWorkspaceRole } from '../../middleware/auth';
import { recordAuditLog } from '../../lib/audit';

const CreateIncidentSchema = z.object({
  title: z.string().min(3).max(120),
  message: z.string().min(3).max(1000),
  type: z.enum(['INCIDENT', 'MAINTENANCE']).default('INCIDENT'),
  status: z.enum(['INVESTIGATING', 'IDENTIFIED', 'MAINTENANCE', 'RESOLVED']).default('INVESTIGATING'),
});

const UpdateIncidentSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  message: z.string().min(3).max(1000).optional(),
  status: z.enum(['INVESTIGATING', 'IDENTIFIED', 'MAINTENANCE', 'RESOLVED']).optional(),
});

async function notifyWorkspaceDiscordWebhooks(
  workspaceId: string,
  incident: { title: string; message: string; type: string; status: string }
) {
  try {
    const monitors = await prisma.uptimeMonitor.findMany({
      where: {
        project: { workspaceId },
        discordWebhookUrl: { not: null },
      },
      select: { discordWebhookUrl: true },
    });

    const uniqueWebhooks = Array.from(
      new Set(monitors.map(m => m.discordWebhookUrl).filter(Boolean) as string[])
    );

    const isResolved = incident.status === 'RESOLVED';
    const isMaintenance = incident.type === 'MAINTENANCE' || incident.status === 'MAINTENANCE';
    const color = isResolved ? 0x16a34a : isMaintenance ? 0x2563eb : 0xd97706;
    const prefix = isResolved ? '✅ RESOLVIDO' : isMaintenance ? '🔧 MANUTENÇÃO' : '⚠️ INCIDENTE';

    for (const url of uniqueWebhooks) {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'CloudAPI Status',
          embeds: [
            {
              title: `${prefix} — ${incident.title}`,
              description: incident.message,
              color,
              fields: [{ name: 'Status Atual', value: `\`${incident.status}\``, inline: true }],
              footer: { text: 'CloudAPI Página de Status' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }).catch(() => {});
    }
  } catch {
    // Non-fatal
  }
}

export async function incidentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/workspaces/:workspaceId/incidents', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: request.user!.id } },
    });
    if (!member) {
      throw new AppError('Acesso negado a este workspace.', 403, 'FORBIDDEN');
    }

    const incidents = await prisma.statusIncident.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return reply.send({ success: true, data: { incidents } });
  });

  app.post(
    '/workspaces/:workspaceId/incidents',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR'])] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const input = CreateIncidentSchema.parse(request.body);

      const incident = await prisma.statusIncident.create({
        data: {
          workspaceId,
          title: input.title.trim(),
          message: input.message.trim(),
          type: input.type,
          status: input.type === 'MAINTENANCE' ? 'MAINTENANCE' : input.status,
        },
      });

      await recordAuditLog({
        workspaceId,
        userId: request.user!.id,
        action: 'CREATE_INCIDENT',
        entity: 'StatusIncident',
        entityId: incident.id,
        metadata: { title: incident.title, type: incident.type, status: incident.status },
      });

      await notifyWorkspaceDiscordWebhooks(workspaceId, incident);

      return reply.status(201).send({ success: true, data: { incident } });
    }
  );

  app.patch(
    '/workspaces/:workspaceId/incidents/:incidentId',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR'])] },
    async (request, reply) => {
      const { workspaceId, incidentId } = request.params as { workspaceId: string; incidentId: string };
      const input = UpdateIncidentSchema.parse(request.body);

      const existing = await prisma.statusIncident.findFirst({
        where: { id: incidentId, workspaceId },
      });
      if (!existing) {
        throw new AppError('Comunicado não encontrado.', 404, 'NOT_FOUND');
      }

      const incident = await prisma.statusIncident.update({
        where: { id: incidentId },
        data: {
          title: input.title?.trim(),
          message: input.message?.trim(),
          status: input.status,
        },
      });

      await recordAuditLog({
        workspaceId,
        userId: request.user!.id,
        action: 'UPDATE_INCIDENT',
        entity: 'StatusIncident',
        entityId: incident.id,
        metadata: { title: incident.title, status: incident.status },
      });

      if (input.status && input.status !== existing.status) {
        await notifyWorkspaceDiscordWebhooks(workspaceId, incident);
      }

      return reply.send({ success: true, data: { incident } });
    }
  );

  app.delete(
    '/workspaces/:workspaceId/incidents/:incidentId',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN'])] },
    async (request, reply) => {
      const { workspaceId, incidentId } = request.params as { workspaceId: string; incidentId: string };
      await prisma.statusIncident.deleteMany({
        where: { id: incidentId, workspaceId },
      });
      return reply.send({ success: true, data: { message: 'Comunicado removido.' } });
    }
  );
}
