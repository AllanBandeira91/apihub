import { FastifyInstance } from 'fastify';
import { CreateProjectSchema } from '@apihub/shared';
import { projectsService } from './projects.service';
import { authenticate, requireWorkspaceRole } from '../../middleware/auth';

export async function projectsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/workspaces/:workspaceId/projects', async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const projects = await projectsService.listByWorkspace(workspaceId);
    return reply.send({
      success: true,
      data: { projects },
    });
  });

  app.post(
    '/workspaces/:workspaceId/projects',
    { preHandler: [requireWorkspaceRole(['OWNER', 'ADMIN', 'EDITOR'])] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const input = CreateProjectSchema.parse(request.body);
      const project = await projectsService.create(workspaceId, input);
      return reply.status(201).send({
        success: true,
        data: { project },
      });
    }
  );

  app.get('/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = await projectsService.getById(projectId, request.user!.id);
    return reply.send({
      success: true,
      data: { project },
    });
  });

  app.patch('/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const input = CreateProjectSchema.partial().parse(request.body);
    const project = await projectsService.update(projectId, request.user!.id, input);
    return reply.send({
      success: true,
      data: { project },
    });
  });

  app.delete('/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const result = await projectsService.delete(projectId, request.user!.id);
    return reply.send({
      success: true,
      data: result,
    });
  });
}
