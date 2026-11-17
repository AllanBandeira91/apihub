import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { recordAuditLog } from '../../lib/audit';

export interface EnvVariableItem {
  key: string;
  value: string;
  isSecret?: boolean;
}

export class EnvironmentsService {
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
      throw new AppError('Projeto não encontrado ou acesso negado.', 403, 'FORBIDDEN');
    }
    return project;
  }

  async listByProject(projectId: string, userId: string) {
    await this.ensureProjectAccess(projectId, userId);
    return prisma.environment.findMany({
      where: { projectId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(
    projectId: string,
    userId: string,
    input: { name: string; variables: EnvVariableItem[]; isDefault?: boolean }
  ) {
    const project = await this.ensureProjectAccess(projectId, userId);
    const cleanName = input.name.trim();

    const existing = await prisma.environment.findUnique({
      where: { projectId_name: { projectId, name: cleanName } },
    });
    if (existing) {
      throw new AppError('Já existe um ambiente com este nome neste projeto.', 409, 'ENV_EXISTS');
    }

    if (input.isDefault) {
      await prisma.environment.updateMany({
        where: { projectId },
        data: { isDefault: false },
      });
    }

    const sanitizedVars = (input.variables || [])
      .filter(v => v.key && v.key.trim())
      .map(v => ({
        key: v.key.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
        value: String(v.value ?? ''),
        isSecret: Boolean(v.isSecret),
      }));

    const created = await prisma.environment.create({
      data: {
        projectId,
        name: cleanName,
        variables: sanitizedVars as any,
        isDefault: Boolean(input.isDefault),
      },
    });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'CREATE_ENVIRONMENT',
      entity: 'Environment',
      entityId: created.id,
      metadata: { name: created.name, variablesCount: sanitizedVars.length },
    });

    return created;
  }

  async update(
    envId: string,
    userId: string,
    input: { name?: string; variables?: EnvVariableItem[]; isDefault?: boolean }
  ) {
    const envRecord = await prisma.environment.findUnique({
      where: { id: envId },
      include: { project: true },
    });
    if (!envRecord) {
      throw new AppError('Ambiente não encontrado.', 404, 'NOT_FOUND');
    }
    const project = await this.ensureProjectAccess(envRecord.projectId, userId);

    if (input.isDefault) {
      await prisma.environment.updateMany({
        where: { projectId: envRecord.projectId },
        data: { isDefault: false },
      });
    }

    const sanitizedVars = input.variables
      ? input.variables
          .filter(v => v.key && v.key.trim())
          .map(v => ({
            key: v.key.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
            value: String(v.value ?? ''),
            isSecret: Boolean(v.isSecret),
          }))
      : undefined;

    const updated = await prisma.environment.update({
      where: { id: envId },
      data: {
        name: input.name ? input.name.trim() : undefined,
        variables: sanitizedVars !== undefined ? (sanitizedVars as any) : undefined,
        isDefault: input.isDefault,
      },
    });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'UPDATE_ENVIRONMENT',
      entity: 'Environment',
      entityId: updated.id,
      metadata: { name: updated.name },
    });

    return updated;
  }

  async delete(envId: string, userId: string) {
    const envRecord = await prisma.environment.findUnique({
      where: { id: envId },
      include: { project: true },
    });
    if (!envRecord) {
      throw new AppError('Ambiente não encontrado.', 404, 'NOT_FOUND');
    }
    const project = await this.ensureProjectAccess(envRecord.projectId, userId);

    await prisma.environment.delete({ where: { id: envId } });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'DELETE_ENVIRONMENT',
      entity: 'Environment',
      entityId: envId,
      metadata: { name: envRecord.name },
    });

    return { message: 'Ambiente removido com sucesso.' };
  }
}

export const environmentsService = new EnvironmentsService();
