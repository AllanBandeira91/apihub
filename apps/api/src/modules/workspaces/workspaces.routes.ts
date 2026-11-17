import { FastifyInstance } from 'fastify';
import { CreateWorkspaceSchema } from '@apihub/shared';
import { workspacesService } from './workspaces.service';
import { authenticate, requireWorkspaceRole } from '../../middleware/auth';

export async function workspacesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

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
      const workspace = await workspacesService.update(workspaceId, input);
      return reply.send({
        success: true,
        data: { workspace },
      });
    }
  );
}
