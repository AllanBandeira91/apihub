import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { CreateProjectInput } from '@apihub/shared';

export class ProjectsService {
  async listByWorkspace(workspaceId: string) {
    return prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: {
            apis: true,
            requestLogs: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(workspaceId: string, input: CreateProjectInput) {
    const existing = await prisma.project.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug: input.slug,
        },
      },
    });

    if (existing) {
      throw new AppError('A project with this slug already exists in this workspace', 409, 'SLUG_ALREADY_EXISTS');
    }

    return prisma.project.create({
      data: {
        workspaceId,
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
    });
  }

  async getById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
        apis: {
          include: {
            _count: {
              select: { endpoints: true },
            },
          },
        },
      },
    });

    if (!project || project.workspace.members.length === 0) {
      throw new AppError('Project not found or access denied', 404, 'NOT_FOUND');
    }

    return project;
  }

  async update(projectId: string, userId: string, input: Partial<CreateProjectInput>) {
    await this.getById(projectId, userId);

    return prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }

  async delete(projectId: string, userId: string) {
    const project = await this.getById(projectId, userId);

    // Only OWNER or ADMIN can delete projects
    const userRole = project.workspace.members[0]?.role;
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      throw new AppError('Only workspace owners and admins can delete projects', 403, 'FORBIDDEN');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted successfully' };
  }
}

export const projectsService = new ProjectsService();
