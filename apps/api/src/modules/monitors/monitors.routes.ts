import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { monitorsService } from './monitors.service';
import { authenticate } from '../../middleware/auth';

const CreateMonitorSchema = z.object({
  name: z.string().min(2).max(80),
  url: z.string().url('Informe uma URL HTTP/HTTPS válida'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  intervalMinutes: z.coerce.number().int().min(1).max(1440).default(5),
  expectedStatus: z.coerce.number().int().min(100).max(599).default(200),
  alertEmail: z.string().email('Informe um e-mail válido para alertas'),
  discordWebhookUrl: z.string().nullable().optional(),
});

export async function monitorsRoutes(app: FastifyInstance) {
  // Public shareable Status Page (no auth required)
  app.get('/public/status/:workspaceSlug', async (request, reply) => {
    const { workspaceSlug } = request.params as { workspaceSlug: string };
    const status = await monitorsService.getPublicStatusByWorkspaceSlug(workspaceSlug);
    return reply.send({ success: true, data: status });
  });

  app.register(async protectedScope => {
    protectedScope.addHook('preHandler', authenticate);

    protectedScope.get('/projects/:projectId/monitors', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const monitors = await monitorsService.listByProject(projectId, request.user!.id);
      return reply.send({ success: true, data: { monitors } });
    });

    protectedScope.post('/projects/:projectId/monitors', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const input = CreateMonitorSchema.parse(request.body);
      const monitor = await monitorsService.create(projectId, request.user!.id, input);
      return reply.status(201).send({ success: true, data: { monitor } });
    });

    protectedScope.post('/monitors/:monitorId/check', async (request, reply) => {
      const { monitorId } = request.params as { monitorId: string };
      const monitor = await monitorsService.triggerCheckForUser(monitorId, request.user!.id);
      return reply.send({ success: true, data: { monitor } });
    });

    protectedScope.patch('/monitors/:monitorId', async (request, reply) => {
      const { monitorId } = request.params as { monitorId: string };
      const input = z.object({ isActive: z.boolean() }).parse(request.body);
      const monitor = await monitorsService.toggleActive(monitorId, request.user!.id, input.isActive);
      return reply.send({ success: true, data: { monitor } });
    });

    protectedScope.delete('/monitors/:monitorId', async (request, reply) => {
      const { monitorId } = request.params as { monitorId: string };
      const result = await monitorsService.delete(monitorId, request.user!.id);
      return reply.send({ success: true, data: result });
    });
  });
}
