import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { CreateApiDefinitionInput, CreateEndpointInput } from '@apihub/shared';

export class ApisService {
  private async ensureProjectAccess(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: { where: { userId } },
          },
        },
      },
    });
    if (!project || project.workspace.members.length === 0) {
      throw new AppError('Projeto não encontrado ou acesso negado', 403, 'FORBIDDEN');
    }
    return project;
  }

  async listEndpointsByProject(projectId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);

    const endpoints = await prisma.endpoint.findMany({
      where: { api: { projectId } },
      include: {
        api: {
          select: { id: true, name: true, baseUrl: true, version: true },
        },
        parameters: true,
        responseExamples: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return endpoints.map(ep => ({
      id: ep.id,
      apiId: ep.api.id,
      apiName: ep.api.name,
      baseUrl: ep.api.baseUrl,
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
      description: ep.description,
      tags: ep.tags,
      requestBody: ep.requestBody,
      parametersCount: ep.parameters.length,
      parameters: ep.parameters,
      responseExamples: ep.responseExamples,
      createdAt: ep.createdAt,
    }));
  }

  async quickCreateEndpoint(
    projectId: string,
    userId: string,
    input: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      path: string;
      summary: string;
      description?: string;
      tags?: string[];
      apiName?: string;
      baseUrl?: string;
    }
  ) {
    await this.ensureProjectAccess(projectId, userId);

    const targetApiName = (input.apiName || 'API Principal').trim();
    let apiDef = await prisma.apiDefinition.findFirst({
      where: { projectId, name: targetApiName },
    });

    if (!apiDef) {
      apiDef = await prisma.apiDefinition.create({
        data: {
          projectId,
          name: targetApiName,
          baseUrl: (input.baseUrl || 'https://api.exemplo.com').trim(),
          version: 'v1.0.0',
        },
      });
    }

    const formattedPath = input.path.startsWith('/') ? input.path : `/${input.path}`;

    const ep = await prisma.endpoint.create({
      data: {
        apiId: apiDef.id,
        method: input.method,
        path: formattedPath,
        summary: input.summary || `Endpoint ${formattedPath}`,
        description: input.description || null,
        tags: input.tags && input.tags.length > 0 ? input.tags : ['Geral'],
      },
      include: {
        api: { select: { id: true, name: true, baseUrl: true } },
        parameters: true,
        responseExamples: true,
      },
    });

    return {
      id: ep.id,
      apiId: ep.api.id,
      apiName: ep.api.name,
      baseUrl: ep.api.baseUrl,
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
      description: ep.description,
      tags: ep.tags,
      parametersCount: ep.parameters.length,
      parameters: ep.parameters,
      responseExamples: ep.responseExamples,
      createdAt: ep.createdAt,
    };
  }

  async importOpenApi(projectId: string, userId: string, spec: any) {
    await this.ensureProjectAccess(projectId, userId);

    if (!spec || typeof spec !== 'object' || !spec.paths || typeof spec.paths !== 'object') {
      throw new AppError(
        'Especificação OpenAPI/Swagger inválida. Certifique-se de que o JSON contém o campo "paths".',
        400,
        'INVALID_OPENAPI_SPEC'
      );
    }

    const title = String(spec.info?.title || 'API Importada').slice(0, 100);
    const version = String(spec.info?.version || '1.0.0').slice(0, 30);
    const description = spec.info?.description ? String(spec.info.description).slice(0, 500) : null;

    let baseUrl = 'https://api.exemplo.com';
    if (Array.isArray(spec.servers) && spec.servers[0]?.url) {
      baseUrl = String(spec.servers[0].url);
    } else if (spec.host) {
      const scheme = Array.isArray(spec.schemes) && spec.schemes[0] ? spec.schemes[0] : 'https';
      baseUrl = `${scheme}://${spec.host}${spec.basePath || ''}`;
    }

    let apiDef = await prisma.apiDefinition.findFirst({
      where: { projectId, name: title },
    });

    if (!apiDef) {
      apiDef = await prisma.apiDefinition.create({
        data: {
          projectId,
          name: title,
          version,
          description,
          baseUrl,
        },
      });
    }

    const validMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    let importedCount = 0;

    for (const [rawPath, pathItem] of Object.entries<any>(spec.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [rawMethod, operation] of Object.entries<any>(pathItem)) {
        const method = rawMethod.toUpperCase();
        if (!validMethods.has(method) || !operation || typeof operation !== 'object') continue;

        const formattedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        const summary = String(operation.summary || operation.operationId || `${method} ${formattedPath}`).slice(0, 200);
        const opDesc = operation.description ? String(operation.description).slice(0, 1000) : null;
        const tags = Array.isArray(operation.tags) && operation.tags.length > 0
          ? operation.tags.map((t: any) => String(t).slice(0, 40)).slice(0, 5)
          : ['Importado'];

        const params = Array.isArray(operation.parameters)
          ? operation.parameters
              .filter((p: any) => p && p.name && ['query', 'path', 'header'].includes(String(p.in)))
              .slice(0, 20)
              .map((p: any) => ({
                name: String(p.name),
                in: String(p.in),
                required: Boolean(p.required),
                description: p.description ? String(p.description).slice(0, 300) : null,
                example: p.example !== undefined ? String(p.example).slice(0, 200) : null,
              }))
          : [];

        await prisma.endpoint.create({
          data: {
            apiId: apiDef.id,
            method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            path: formattedPath,
            summary,
            description: opDesc,
            tags,
            parameters: params.length > 0 ? { create: params } : undefined,
          },
        });
        importedCount++;
      }
    }

    if (importedCount === 0) {
      throw new AppError(
        'Nenhum endpoint HTTP válido (GET, POST, PUT, PATCH, DELETE) foi encontrado no campo "paths".',
        400,
        'NO_ENDPOINTS_FOUND'
      );
    }

    return {
      api: apiDef,
      importedCount,
    };
  }

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
