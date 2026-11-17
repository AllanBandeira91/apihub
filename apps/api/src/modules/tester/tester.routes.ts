import { FastifyInstance } from 'fastify';
import { ExecuteTestRequestSchema } from '@apihub/shared';
import { testerService } from './tester.service';
import { authenticate } from '../../middleware/auth';
import { z } from 'zod';

export async function testerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/projects/:projectId/tester/execute', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const input = ExecuteTestRequestSchema.parse(request.body);
    const result = await testerService.executeRequest(projectId, input);
    return reply.send({
      success: true,
      data: result,
    });
  });

  app.get('/projects/:projectId/tester/logs', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const query = z.object({ limit: z.coerce.number().optional() }).parse(request.query);
    const logs = await testerService.getLogs(projectId, query.limit);
    return reply.send({
      success: true,
      data: { logs },
    });
  });

  app.get('/projects/:projectId/metrics', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const metrics = await testerService.getMetrics(projectId);
    return reply.send({
      success: true,
      data: { metrics },
    });
  });
}
