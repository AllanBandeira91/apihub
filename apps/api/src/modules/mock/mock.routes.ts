import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

function matchPathPattern(pattern: string, actualPath: string): boolean {
  const normPattern = '/' + pattern.replace(/^\/+|\/+$/g, '');
  const normActual = '/' + actualPath.replace(/^\/+|\/+$/g, '');
  if (normPattern === normActual) return true;

  const pSegs = normPattern.split('/');
  const aSegs = normActual.split('/');
  if (pSegs.length !== aSegs.length) return false;

  for (let i = 0; i < pSegs.length; i++) {
    const p = pSegs[i];
    const a = aSegs[i];
    if (p.startsWith(':') || (p.startsWith('{') && p.endsWith('}'))) {
      if (!a) return false;
      continue;
    }
    if (p !== a) return false;
  }
  return true;
}

export async function mockRoutes(app: FastifyInstance) {
  app.all('/mock/:workspaceSlug/*', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', '*');
    reply.header('X-Powered-By', 'CloudAPI-MockServer');

    if (request.method === 'OPTIONS') {
      return reply.status(204).send();
    }

    const params = request.params as { workspaceSlug: string; '*': string };
    const workspaceSlug = params.workspaceSlug;
    const requestedPath = '/' + (params['*'] || '').replace(/^\/+/, '');
    const method = request.method.toUpperCase();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      include: {
        projects: {
          include: {
            apis: {
              include: {
                endpoints: {
                  include: {
                    responseExamples: {
                      orderBy: { statusCode: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return reply.status(404).send({
        mock: true,
        error: 'Workspace não encontrado para este Mock Server.',
      });
    }

    const allEndpoints = workspace.projects.flatMap(p =>
      p.apis.flatMap(a => a.endpoints.map(ep => ({ ...ep, apiName: a.name })))
    );

    const matched = allEndpoints.find(
      ep => ep.method === method && matchPathPattern(ep.path, requestedPath)
    );

    if (!matched) {
      return reply.status(404).send({
        mock: true,
        error: `Nenhuma rota ${method} ${requestedPath} cadastrada no workspace "${workspace.name}".`,
      });
    }

    const preferredExample =
      matched.responseExamples.find(r => r.statusCode >= 200 && r.statusCode < 300) ||
      matched.responseExamples[0];

    if (preferredExample) {
      const code = preferredExample.statusCode || 200;
      if (!preferredExample.body) {
        return reply.status(code).send({
          mock: true,
          status: code,
          description: preferredExample.description || matched.summary,
        });
      }
      try {
        const parsed = JSON.parse(preferredExample.body);
        return reply.status(code).send(parsed);
      } catch {
        return reply.status(code).type('text/plain').send(preferredExample.body);
      }
    }

    return reply.status(200).send({
      mock: true,
      service: 'CloudAPI Mock Server',
      api: matched.apiName,
      method: matched.method,
      path: matched.path,
      summary: matched.summary,
      timestamp: new Date().toISOString(),
    });
  });
}
