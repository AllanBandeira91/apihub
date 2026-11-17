import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { CreateWorkspaceInput } from '@apihub/shared';

export class WorkspacesService {
  async listForUser(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                projects: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map(m => ({
      ...m.workspace,
      userRole: m.role,
    }));
  }

  async create(userId: string, input: CreateWorkspaceInput) {
    const existing = await prisma.workspace.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new AppError('A workspace with this slug already exists', 409, 'SLUG_ALREADY_EXISTS');
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return workspace;
  }

  async getById(workspaceId: string, userId: string) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError('Workspace not found or access denied', 404, 'NOT_FOUND');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        projects: {
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: { apis: true },
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return {
      ...workspace,
      currentUserRole: membership.role,
    };
  }

  async update(workspaceId: string, input: Partial<CreateWorkspaceInput>) {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: input.name,
        description: input.description,
      },
    });

    return workspace;
  }
}

export const workspacesService = new WorkspacesService();
