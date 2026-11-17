import { FastifyInstance } from 'fastify';
import { keysService } from './keys.service';
import { authenticate, requireWorkspaceRole } from '../../middleware/auth';
import { z } from 'zod';

const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(60),
  permissions: z.array(z.string()).default(['read', 'write']),
});

export async function keysRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/workspaces/:workspaceId/keys', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const keys = await keysService.listByWorkspace(workspaceId);
    return reply.send({
      success: true,
      data: { keys },
    });
  });

  app.post(
    '/workspaces/:workspaceId/keys',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN'])] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const input = CreateApiKeySchema.parse(request.body);
      const result = await keysService.create(workspaceId, input.name, input.permissions);
      return reply.status(201).send({
        success: true,
        data: result,
      });
    }
  );

  app.delete(
    '/workspaces/:workspaceId/keys/:keyId',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN'])] },
    async (request, reply) => {
      const { workspaceId, keyId } = request.params as { workspaceId: string; keyId: string };
      const result = await keysService.revoke(workspaceId, keyId);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );
}
