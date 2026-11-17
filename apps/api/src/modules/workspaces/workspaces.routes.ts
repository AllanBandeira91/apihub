import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CreateWorkspaceSchema } from '@apihub/shared';
import { workspacesService } from './workspaces.service';
import { authenticate, requireWorkspaceRole } from '../../middleware/auth';

export async function workspacesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/bootstrap', async (request, reply) => {
    const query = z.object({ workspaceId: z.string().optional() }).parse(request.query);
    const data = await workspacesService.bootstrap(request.user!.id, query.workspaceId);
    return reply.send({
      success: true,
      data,
    });
  });

  app.get('/', async (request, reply) => {
    const workspaces = await workspacesService.listForUser(request.user!.id);
    return reply.send({
      success: true,
      data: { workspaces },
    });
  });

  app.post('/', async (request, reply) => {
    const input = CreateWorkspaceSchema.parse(request.body);
    const workspace = await workspacesService.create(request.user!.id, input);
    return reply.status(201).send({
      success: true,
      data: { workspace },
    });
  });

  app.get('/:workspaceId', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const workspace = await workspacesService.getById(workspaceId, request.user!.id);
    return reply.send({
      success: true,
      data: { workspace },
    });
  });

  app.patch(
    '/:workspaceId',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN'])] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const input = CreateWorkspaceSchema.partial().parse(request.body);
      const workspace = await workspacesService.update(workspaceId, input, request.user!.id);
      return reply.send({
        success: true,
        data: { workspace },
      });
    }
  );

  app.get('/:workspaceId/audit-logs', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const query = z.object({ limit: z.coerce.number().optional() }).parse(request.query);
    const logs = await workspacesService.listAuditLogs(workspaceId, request.user!.id, query.limit);
    return reply.send({
      success: true,
      data: { logs },
    });
  });

  app.get('/:workspaceId/members', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const members = await workspacesService.listMembers(workspaceId, request.user!.id);
    return reply.send({
      success: true,
      data: { members },
    });
  });

  app.post(
    '/:workspaceId/members',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN'])] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const input = z
        .object({
          email: z.string().email('Informe um e-mail válido'),
          role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
        })
        .parse(request.body);
      const result = await workspacesService.addMember(
        workspaceId,
        request.user!.id,
        input.email,
        input.role
      );
      return reply.status(201).send({
        success: true,
        data: result,
      });
    }
  );

  app.delete(
    '/:workspaceId/members/:memberId',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN'])] },
    async (request, reply) => {
      const { workspaceId, memberId } = request.params as { workspaceId: string; memberId: string };
      const result = await workspacesService.removeMember(workspaceId, memberId);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );
}
