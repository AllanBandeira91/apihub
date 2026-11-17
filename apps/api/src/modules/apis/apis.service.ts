import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { CreateApiDefinitionInput, CreateEndpointInput } from '@apihub/shared';
import { recordAuditLog } from '../../lib/audit';

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

  async importPostman(projectId: string, userId: string, collection: any) {
    const project = await this.ensureProjectAccess(projectId, userId);

    if (!collection || typeof collection !== 'object' || !Array.isArray(collection.item)) {
      throw new AppError(
        'Coleção Postman inválida. Exporte no formato "Collection v2.1 (recommended)" contendo o array "item".',
        400,
        'INVALID_POSTMAN_COLLECTION'
      );
    }

    const title = String(collection.info?.name || 'Coleção Postman').slice(0, 100);
    const description = collection.info?.description ? String(collection.info.description).slice(0, 500) : null;

    const flattened: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      path: string;
      baseUrl: string;
      summary: string;
      description: string | null;
      tag: string;
      requestBody: string | null;
    }[] = [];

    const validMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

    const walkItems = (items: any[], folderTag: string) => {
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        if (Array.isArray(item.item)) {
          walkItems(item.item, String(item.name || folderTag).slice(0, 40));
          continue;
        }
        const req = item.request;
        if (!req) continue;
        const method = String(req.method || 'GET').toUpperCase();
        if (!validMethods.has(method)) continue;

        let rawUrl = '';
        if (typeof req.url === 'string') {
          rawUrl = req.url;
        } else if (req.url && typeof req.url === 'object') {
          rawUrl = req.url.raw || '';
        }

        let baseUrl = 'https://api.exemplo.com';
        let pathStr = '/';
        try {
          const parsed = new URL(rawUrl.replace(/\{\{[^}]+\}\}/g, 'https://api.exemplo.com'));
          baseUrl = `${parsed.protocol}//${parsed.host}`;
          pathStr = parsed.pathname || '/';
        } catch {
          if (req.url && Array.isArray(req.url.path)) {
            pathStr = '/' + req.url.path.join('/');
          } else if (rawUrl) {
            const idx = rawUrl.indexOf('/');
            pathStr = idx >= 0 ? rawUrl.slice(idx) : '/' + rawUrl;
          }
        }

        const bodyRaw = req.body?.mode === 'raw' && req.body?.raw ? String(req.body.raw).slice(0, 10000) : null;

        flattened.push({
          method: method as any,
          path: pathStr.startsWith('/') ? pathStr : '/' + pathStr,
          baseUrl,
          summary: String(item.name || `${method} ${pathStr}`).slice(0, 200),
          description: req.description ? String(req.description).slice(0, 1000) : null,
          tag: folderTag,
          requestBody: bodyRaw,
        });
      }
    };

    walkItems(collection.item, 'Postman');

    if (flattened.length === 0) {
      throw new AppError('Nenhuma requisição HTTP válida encontrada na coleção Postman.', 400, 'NO_ENDPOINTS_FOUND');
    }

    let apiDef = await prisma.apiDefinition.findFirst({ where: { projectId, name: title } });
    if (!apiDef) {
      apiDef = await prisma.apiDefinition.create({
        data: {
          projectId,
          name: title,
          description,
          baseUrl: flattened[0].baseUrl,
          version: 'v1.0.0',
        },
      });
    }

    for (const ep of flattened.slice(0, 150)) {
      await prisma.endpoint.create({
        data: {
          apiId: apiDef.id,
          method: ep.method,
          path: ep.path,
          summary: ep.summary,
          description: ep.description,
          tags: [ep.tag],
          requestBody: ep.requestBody,
        },
      });
    }

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'IMPORT_POSTMAN',
      entity: 'ApiDefinition',
      entityId: apiDef.id,
      metadata: { title, importedCount: Math.min(flattened.length, 150) },
    });

    return {
      api: apiDef,
      importedCount: Math.min(flattened.length, 150),
    };
  }

  async setApiVisibility(apiId: string, userId: string, isPublic: boolean) {
    const apiDef = await prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: { project: true },
    });
    if (!apiDef) {
      throw new AppError('API não encontrada.', 404, 'NOT_FOUND');
    }
    const project = await this.ensureProjectAccess(apiDef.projectId, userId);

    let publicSlug = apiDef.publicSlug;
    if (isPublic && !publicSlug) {
      const base = apiDef.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'api';
      publicSlug = `${base}-${apiDef.id.slice(0, 6)}`;
    }

    const updated = await prisma.apiDefinition.update({
      where: { id: apiId },
      data: { isPublic, publicSlug },
      include: { _count: { select: { endpoints: true } } },
    });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: isPublic ? 'PUBLISH_API_DOCS' : 'UNPUBLISH_API_DOCS',
      entity: 'ApiDefinition',
      entityId: apiId,
      metadata: { name: updated.name, publicSlug: updated.publicSlug },
    });

    return updated;
  }

  async getPublicDocsBySlug(slug: string) {
    const apiDef = await prisma.apiDefinition.findUnique({
      where: { publicSlug: slug },
      include: {
        endpoints: {
          include: {
            parameters: true,
            responseExamples: true,
          },
          orderBy: [{ path: 'asc' }, { method: 'asc' }],
        },
      },
    });

    if (!apiDef || !apiDef.isPublic) {
      throw new AppError('Documentação pública não encontrada ou privada.', 404, 'NOT_FOUND');
    }

    return {
      id: apiDef.id,
      name: apiDef.name,
      description: apiDef.description,
      baseUrl: apiDef.baseUrl,
      version: apiDef.version,
      publicSlug: apiDef.publicSlug,
      updatedAt: apiDef.updatedAt,
      endpoints: apiDef.endpoints,
    };
  }

  async updateEndpointFull(
    endpointId: string,
    userId: string,
    input: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      path?: string;
      summary?: string;
      description?: string | null;
      tags?: string[];
      requestBody?: string | null;
      parameters?: {
        name: string;
        in: string;
        required?: boolean;
        description?: string | null;
        example?: string | null;
      }[];
      responseExamples?: {
        statusCode: number;
        description?: string | null;
        body?: string | null;
      }[];
    }
  ) {
    const existing = await prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: { api: { include: { project: true } } },
    });
    if (!existing) {
      throw new AppError('Endpoint não encontrado.', 404, 'NOT_FOUND');
    }
    const project = await this.ensureProjectAccess(existing.api.projectId, userId);

    const formattedPath = input.path
      ? input.path.startsWith('/')
        ? input.path
        : `/${input.path}`
      : undefined;

    if (input.parameters) {
      await prisma.parameter.deleteMany({ where: { endpointId } });
    }
    if (input.responseExamples) {
      await prisma.responseExample.deleteMany({ where: { endpointId } });
    }

    const ep = await prisma.endpoint.update({
      where: { id: endpointId },
      data: {
        method: input.method,
        path: formattedPath,
        summary: input.summary,
        description: input.description,
        tags: input.tags,
        requestBody: input.requestBody,
        parameters: input.parameters
          ? {
              create: input.parameters
                .filter(p => p.name && p.name.trim())
                .map(p => ({
                  name: p.name.trim(),
                  in: p.in || 'query',
                  required: Boolean(p.required),
                  description: p.description || null,
                  example: p.example || null,
                })),
            }
          : undefined,
        responseExamples: input.responseExamples
          ? {
              create: input.responseExamples.map(r => ({
                statusCode: Number(r.statusCode) || 200,
                description: r.description || null,
                body: r.body || null,
              })),
            }
          : undefined,
      },
      include: {
        api: { select: { id: true, name: true, baseUrl: true } },
        parameters: true,
        responseExamples: true,
      },
    });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'UPDATE_ENDPOINT',
      entity: 'Endpoint',
      entityId: ep.id,
      metadata: { method: ep.method, path: ep.path },
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
      requestBody: ep.requestBody,
      parametersCount: ep.parameters.length,
      parameters: ep.parameters,
      responseExamples: ep.responseExamples,
      createdAt: ep.createdAt,
    };
  }

  async listByProject(projectId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
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

  async createApi(projectId: string, userId: string, input: CreateApiDefinitionInput) {
    await this.ensureProjectAccess(projectId, userId);
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

  async getApiById(apiId: string, userId?: string) {
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

    if (userId) {
      await this.ensureProjectAccess(api.projectId, userId);
    } else if (!api.isPublic) {
      throw new AppError('Acesso negado a esta especificação privada', 403, 'FORBIDDEN');
    }

    return api;
  }

  async updateApi(apiId: string, userId: string, input: Partial<CreateApiDefinitionInput>) {
    const existing = await prisma.apiDefinition.findUnique({ where: { id: apiId } });
    if (!existing) throw new AppError('API Definition not found', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(existing.projectId, userId);

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

  async deleteApi(apiId: string, userId: string) {
    const existing = await prisma.apiDefinition.findUnique({ where: { id: apiId } });
    if (!existing) throw new AppError('API Definition not found', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(existing.projectId, userId);

    await prisma.apiDefinition.delete({
      where: { id: apiId },
    });
    return { message: 'API definition deleted successfully' };
  }

  async createEndpoint(apiId: string, userId: string, input: CreateEndpointInput) {
    const existing = await prisma.apiDefinition.findUnique({ where: { id: apiId } });
    if (!existing) throw new AppError('API Definition not found', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(existing.projectId, userId);

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

  async updateEndpoint(endpointId: string, userId: string, input: Partial<CreateEndpointInput>) {
    const existing = await prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: { api: true },
    });
    if (!existing) throw new AppError('Endpoint não encontrado', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(existing.api.projectId, userId);

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

  async deleteEndpoint(endpointId: string, userId: string) {
    const existing = await prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: { api: true },
    });
    if (!existing) throw new AppError('Endpoint não encontrado', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(existing.api.projectId, userId);

    await prisma.endpoint.delete({
      where: { id: endpointId },
    });
    return { message: 'Endpoint deleted successfully' };
  }

  async generateOpenApiSpec(apiId: string, userId?: string) {
    const api = await this.getApiById(apiId, userId);

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
