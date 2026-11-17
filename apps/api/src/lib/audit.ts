import { prisma } from '../lib/prisma';

export async function recordAuditLog(params: {
  workspaceId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        metadata: params.metadata || undefined,
      },
    });
  } catch {
    // Audit logging should never crash the primary user action
  }
}
