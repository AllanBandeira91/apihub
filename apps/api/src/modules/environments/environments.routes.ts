import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { environmentsService } from './environments.service';
import { authenticate } from '../../middleware/auth';

const VariableSchema = z.object({
  key: z.string().min(1).max(60),
  value: z.string().max(2000),
  isSecret: z.boolean().optional().default(false),
});

const CreateEnvSchema = z.object({
  name: z.string().min(1).max(60),
  variables: z.array(VariableSchema).default([]),
  isDefault: z.boolean().optional().default(false),
});

export async function environmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/projects/:projectId/environments', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const environments = await environmentsService.listByProject(projectId, request.user!.id);
    return reply.send({ success: true, data: { environments } });
  });

  app.post('/projects/:projectId/environments', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const input = CreateEnvSchema.parse(request.body);
    const environment = await environmentsService.create(projectId, request.user!.id, input);
    return reply.status(201).send({ success: true, data: { environment } });
  });

  app.patch('/environments/:envId', async (request, reply) => {
    const { envId } = request.params as { envId: string };
    const input = CreateEnvSchema.partial().parse(request.body);
    const environment = await environmentsService.update(envId, request.user!.id, input);
    return reply.send({ success: true, data: { environment } });
  });

  app.delete('/environments/:envId', async (request, reply) => {
    const { envId } = request.params as { envId: string };
    const result = await environmentsService.delete(envId, request.user!.id);
    return reply.send({ success: true, data: result });
  });
}
