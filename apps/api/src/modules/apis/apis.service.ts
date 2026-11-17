import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { CreateApiDefinitionInput, CreateEndpointInput } from '@apihub/shared';

export class ApisService {
  async listByProject(projectId: string) {
    return prisma.apiDefinition.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { endpoints: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createApi(projectId: string, input: CreateApiDefinitionInput) {
    return prisma.apiDefinition.create({
      data: {
        projectId,
        name: input.name,
        description: input.description,
        baseUrl: input.baseUrl,
        version: input.version || 'v1.0.0',
        isPublic: input.isPublic || false,
      },
    });
  }

  async getApiById(apiId: string) {
    const api = await prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: {
        project: {
          include: {
            workspace: true,
          },
        },
        endpoints: {
          include: {
            parameters: true,
            responseExamples: true,
          },
          orderBy: [{ path: 'asc' }, { method: 'asc' }],
        },
      },
    });

    if (!api) {
      throw new AppError('API Definition not found', 404, 'NOT_FOUND');
    }

    return api;
  }

  async updateApi(apiId: string, input: Partial<CreateApiDefinitionInput>) {
    return prisma.apiDefinition.update({
      where: { id: apiId },
      data: {
        name: input.name,
        description: input.description,
        baseUrl: input.baseUrl,
        version: input.version,
        isPublic: input.isPublic,
      },
    });
  }

  async deleteApi(apiId: string) {
    await prisma.apiDefinition.delete({
      where: { id: apiId },
    });
    return { message: 'API definition deleted successfully' };
  }

  async createEndpoint(apiId: string, input: CreateEndpointInput) {
    return prisma.endpoint.create({
      data: {
        apiId,
        method: input.method,
        path: input.path,
        summary: input.summary,
        description: input.description,
        tags: input.tags,
        requestBody: input.requestBody,
        parameters: {
          create: input.parameters.map(p => ({
            name: p.name,
            in: p.in,
            required: p.required,
            description: p.description,
            example: p.example,
          })),
        },
        responseExamples: {
          create: input.responseExamples.map(r => ({
            statusCode: r.statusCode,
            description: r.description,
            body: r.body,
          })),
        },
      },
      include: {
        parameters: true,
        responseExamples: true,
      },
    });
  }

  async updateEndpoint(endpointId: string, input: Partial<CreateEndpointInput>) {
    return prisma.endpoint.update({
      where: { id: endpointId },
      data: {
        method: input.method,
        path: input.path,
        summary: input.summary,
        description: input.description,
        tags: input.tags,
        requestBody: input.requestBody,
      },
    });
  }

  async deleteEndpoint(endpointId: string) {
    await prisma.endpoint.delete({
      where: { id: endpointId },
    });
    return { message: 'Endpoint deleted successfully' };
  }

  async generateOpenApiSpec(apiId: string) {
    const api = await this.getApiById(apiId);

    const paths: Record<string, Record<string, unknown>> = {};

    for (const ep of api.endpoints) {
      if (!paths[ep.path]) {
        paths[ep.path] = {};
      }

      const method = ep.method.toLowerCase();
      const responses: Record<string, unknown> = {};

      if (ep.responseExamples.length === 0) {
        responses['200'] = {
          description: 'Successful response',
        };
      } else {
        for (const resp of ep.responseExamples) {
          responses[String(resp.statusCode)] = {
            description: resp.description || `HTTP ${resp.statusCode} response`,
            content: resp.body
              ? {
                  'application/json': {
                    example: (() => {
                      try {
                        return JSON.parse(resp.body);
                      } catch {
                        return resp.body;
                      }
                    })(),
                  },
                }
              : undefined,
          };
        }
      }

      paths[ep.path][method] = {
        summary: ep.summary,
        description: ep.description || undefined,
        tags: ep.tags.length > 0 ? ep.tags : ['Default'],
        parameters: ep.parameters.map(p => ({
          name: p.name,
          in: p.in,
          required: p.required,
          description: p.description || undefined,
          schema: { type: 'string' },
          example: p.example || undefined,
        })),
        requestBody: ep.requestBody
          ? {
              required: true,
              content: {
                'application/json': {
                  example: (() => {
                    try {
                      return JSON.parse(ep.requestBody);
                    } catch {
                      return ep.requestBody;
                    }
                  })(),
                },
              },
            }
          : undefined,
        responses,
      };
    }

    return {
      openapi: '3.0.3',
      info: {
        title: api.name,
        description: api.description || `API documentation for ${api.name}`,
        version: api.version,
      },
      servers: [
        {
          url: api.baseUrl,
          description: 'Base server URL',
        },
      ],
      paths,
    };
  }
}

export const apisService = new ApisService();
