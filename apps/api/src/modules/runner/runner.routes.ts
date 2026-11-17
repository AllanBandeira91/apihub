import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { runnerService } from './runner.service';
import { authenticate } from '../../middleware/auth';

const CreateTestCaseSchema = z.object({
  name: z.string().min(2).max(100),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  url: z.string().url('Informe uma URL HTTP/HTTPS válida'),
  headers: z.record(z.string()).optional().default({}),
  body: z.string().nullable().optional(),
  expectedStatus: z.coerce.number().int().min(100).max(599).default(200),
  maxLatencyMs: z.coerce.number().int().min(10).max(30000).nullable().optional(),
  bodyContains: z.string().max(200).nullable().optional(),
});

export async function runnerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/projects/:projectId/test-cases', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const testCases = await runnerService.listByProject(projectId, request.user!.id);
    return reply.send({ success: true, data: { testCases } });
  });

  app.post('/projects/:projectId/test-cases', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const input = CreateTestCaseSchema.parse(request.body);
    const testCase = await runnerService.create(projectId, request.user!.id, input);
    return reply.status(201).send({ success: true, data: { testCase } });
  });

  app.delete('/test-cases/:testCaseId', async (request, reply) => {
    const { testCaseId } = request.params as { testCaseId: string };
    const result = await runnerService.delete(testCaseId, request.user!.id);
    return reply.send({ success: true, data: result });
  });

  app.post('/test-cases/:testCaseId/run', async (request, reply) => {
    const { testCaseId } = request.params as { testCaseId: string };
    const result = await runnerService.runSingle(testCaseId, request.user!.id);
    return reply.send({ success: true, data: result });
  });

  app.post('/projects/:projectId/test-cases/run-all', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const report = await runnerService.runAllByProject(projectId, request.user!.id);
    return reply.send({ success: true, data: report });
  });
}
