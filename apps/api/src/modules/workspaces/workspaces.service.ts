import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { CreateWorkspaceInput } from '@apihub/shared';
import { validateRealEmail } from '../auth/email-validator';
import { sendWorkspaceInviteEmail } from '../auth/mailer';
import { recordAuditLog } from '../../lib/audit';

export class WorkspacesService {
  async bootstrap(userId: string, requestedWorkspaceId?: string) {
    let membership = requestedWorkspaceId
      ? await prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: requestedWorkspaceId, userId } },
          include: {
            workspace: {
              include: {
                projects: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        })
      : null;

    if (!membership) {
      membership = await prisma.workspaceMember.findFirst({
        where: { userId },
        include: {
          workspace: {
            include: {
              projects: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!membership) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
      }
      const firstName = user.name.trim().split(/\s+/)[0] || 'Meu';
      const slug = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'ws'}-${user.id.slice(0, 6)}`;
      const ws = await prisma.workspace.create({
        data: {
          name: `${firstName}'s Workspace`,
          slug,
          ownerId: user.id,
          members: { create: { userId: user.id, role: 'OWNER' } },
          projects: {
            create: {
              name: 'Projeto Principal',
              slug: 'principal',
              description: 'Projeto padrão do workspace',
            },
          },
        },
        include: { projects: true },
      });

      membership = {
        id: '',
        workspaceId: ws.id,
        userId: user.id,
        role: 'OWNER',
        createdAt: new Date(),
        workspace: ws,
      };
    }

    let project = membership.workspace.projects[0];
    if (!project) {
      project = await prisma.project.create({
        data: {
          workspaceId: membership.workspace.id,
          name: 'Projeto Principal',
          slug: 'principal',
          description: 'Projeto padrão do workspace',
        },
      });
    }

    const [apisCount, endpointsCount, keysCount, recentLogs, logAgg] = await Promise.all([
      prisma.apiDefinition.count({ where: { projectId: project.id } }),
      prisma.endpoint.count({ where: { api: { projectId: project.id } } }),
      prisma.apiKey.count({ where: { workspaceId: membership.workspace.id, revokedAt: null } }),
      prisma.requestLog.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.requestLog.aggregate({
        where: { projectId: project.id },
        _count: { id: true },
        _avg: { durationMs: true },
      }),
    ]);

    return {
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        description: membership.workspace.description,
        role: membership.role,
      },
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
      stats: {
        apisCount,
        endpointsCount,
        keysCount,
        totalRequests: logAgg._count.id || 0,
        avgLatencyMs: Math.round(logAgg._avg.durationMs || 0),
      },
      recentLogs,
    };
  }

  async listMembers(workspaceId: string, userId: string) {
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!membership) {
      throw new AppError('Acesso negado a este workspace', 403, 'FORBIDDEN');
    }

    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(
    workspaceId: string,
    inviterUserId: string,
    email: string,
    role: 'ADMIN' | 'EDITOR' | 'VIEWER'
  ) {
    const validEmail = await validateRealEmail(email);

    const [inviter, workspace] = await Promise.all([
      prisma.user.findUnique({ where: { id: inviterUserId } }),
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
    ]);

    if (!workspace || !inviter) {
      throw new AppError('Workspace não encontrado', 404, 'NOT_FOUND');
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: validEmail },
    });

    if (!targetUser) {
      await sendWorkspaceInviteEmail(validEmail, inviter.name, workspace.name, role, false);
      return {
        status: 'INVITE_SENT' as const,
        message: `Convite enviado para ${validEmail}! Quando essa pessoa criar uma conta no APIHub, adicione-a novamente ou confirme o acesso.`,
      };
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
    });

    if (existingMember) {
      throw new AppError('Este usuário já faz parte deste workspace.', 409, 'ALREADY_MEMBER');
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await sendWorkspaceInviteEmail(validEmail, inviter.name, workspace.name, role, true);

    await recordAuditLog({
      workspaceId,
      userId: inviterUserId,
      action: 'ADD_MEMBER',
      entity: 'WorkspaceMember',
      entityId: member.id,
      metadata: { email: validEmail, role },
    });

    return {
      status: 'ADDED' as const,
      member,
      message: `${targetUser.name} foi adicionado(a) ao workspace como ${role}!`,
    };
  }

  async removeMember(workspaceId: string, memberId: string) {
    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new AppError('Membro não encontrado neste workspace.', 404, 'NOT_FOUND');
    }

    if (member.role === 'OWNER') {
      throw new AppError('Não é possível remover o proprietário (OWNER) do workspace.', 400, 'CANNOT_REMOVE_OWNER');
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return { message: 'Membro removido do workspace.' };
  }

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
        projects: {
          create: {
            name: 'Projeto Principal',
            slug: 'principal',
            description: 'Projeto padrão do workspace',
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

    await recordAuditLog({
      workspaceId: workspace.id,
      userId,
      action: 'CREATE_WORKSPACE',
      entity: 'Workspace',
      entityId: workspace.id,
      metadata: { name: workspace.name },
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

  async update(workspaceId: string, input: Partial<CreateWorkspaceInput>, userId?: string) {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: input.name,
        description: input.description,
      },
    });

    await recordAuditLog({
      workspaceId,
      userId,
      action: 'UPDATE_WORKSPACE',
      entity: 'Workspace',
      entityId: workspaceId,
      metadata: { name: workspace.name },
    });

    return workspace;
  }

  async listAuditLogs(workspaceId: string, userId: string, limit = 50) {
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!membership) {
      throw new AppError('Acesso negado a este workspace', 403, 'FORBIDDEN');
    }

    return prisma.auditLog.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }
}

export const workspacesService = new WorkspacesService();
