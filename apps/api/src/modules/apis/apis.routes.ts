import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CreateApiDefinitionSchema, CreateEndpointSchema } from '@apihub/shared';
import { apisService } from './apis.service';
import { authenticate } from '../../middleware/auth';

export async function apisRoutes(app: FastifyInstance) {
  // Public or token-optional OpenAPI export
  app.get('/apis/:apiId/openapi.json', async (request, reply) => {
    const { apiId } = request.params as { apiId: string };
    const spec = await apisService.generateOpenApiSpec(apiId);
    return reply.send(spec);
  });

  // Protected endpoints
  app.register(async protectedScope => {
    protectedScope.addHook('preHandler', authenticate);

    protectedScope.get('/projects/:projectId/apis', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const apis = await apisService.listByProject(projectId);
      return reply.send({
        success: true,
        data: { apis },
      });
    });

    protectedScope.get('/projects/:projectId/endpoints', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const endpoints = await apisService.listEndpointsByProject(projectId, request.user!.id);
      return reply.send({
        success: true,
        data: { endpoints },
      });
    });

    protectedScope.post('/projects/:projectId/endpoints/quick', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const input = z
        .object({
          method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
          path: z.string().min(1),
          summary: z.string().min(1),
          description: z.string().optional(),
          tags: z.array(z.string()).optional(),
          apiName: z.string().optional(),
          baseUrl: z.string().optional(),
        })
        .parse(request.body);
      const endpoint = await apisService.quickCreateEndpoint(projectId, request.user!.id, input);
      return reply.status(201).send({
        success: true,
        data: { endpoint },
      });
    });

    protectedScope.post('/projects/:projectId/import-openapi', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const result = await apisService.importOpenApi(projectId, request.user!.id, request.body);
      return reply.status(201).send({
        success: true,
        data: result,
      });
    });

    protectedScope.post('/projects/:projectId/apis', async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const input = CreateApiDefinitionSchema.parse(request.body);
      const api = await apisService.createApi(projectId, input);
      return reply.status(201).send({
        success: true,
        data: { api },
      });
    });

    protectedScope.get('/apis/:apiId', async (request, reply) => {
      const { apiId } = request.params as { apiId: string };
      const api = await apisService.getApiById(apiId);
      return reply.send({
        success: true,
        data: { api },
      });
    });

    protectedScope.patch('/apis/:apiId', async (request, reply) => {
      const { apiId } = request.params as { apiId: string };
      const input = CreateApiDefinitionSchema.partial().parse(request.body);
      const api = await apisService.updateApi(apiId, input);
      return reply.send({
        success: true,
        data: { api },
      });
    });

    protectedScope.delete('/apis/:apiId', async (request, reply) => {
      const { apiId } = request.params as { apiId: string };
      const result = await apisService.deleteApi(apiId);
      return reply.send({
        success: true,
        data: result,
      });
    });

    protectedScope.post('/apis/:apiId/endpoints', async (request, reply) => {
      const { apiId } = request.params as { apiId: string };
      const input = CreateEndpointSchema.parse(request.body);
      const endpoint = await apisService.createEndpoint(apiId, input);
      return reply.status(201).send({
        success: true,
        data: { endpoint },
      });
    });

    protectedScope.patch('/endpoints/:endpointId', async (request, reply) => {
      const { endpointId } = request.params as { endpointId: string };
      const input = CreateEndpointSchema.partial().parse(request.body);
      const endpoint = await apisService.updateEndpoint(endpointId, input);
      return reply.send({
        success: true,
        data: { endpoint },
      });
    });

    protectedScope.delete('/endpoints/:endpointId', async (request, reply) => {
      const { endpointId } = request.params as { endpointId: string };
      const result = await apisService.deleteEndpoint(endpointId);
      return reply.send({
        success: true,
        data: result,
      });
    });
  });
}
