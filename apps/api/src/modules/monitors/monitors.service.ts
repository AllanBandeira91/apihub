import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { testerService } from '../tester/tester.service';
import { validateRealEmail } from '../auth/email-validator';
import { sendUptimeAlertEmail } from '../auth/mailer';
import { recordAuditLog } from '../../lib/audit';

export class MonitorsService {
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

    const monitors = await prisma.uptimeMonitor.findMany({
      where: { projectId },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 24,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return monitors.map(m => ({
      ...m,
      uptimePercent: m.totalChecks > 0 ? Number(((m.upChecks / m.totalChecks) * 100).toFixed(2)) : 100,
    }));
  }

  async create(
    projectId: string,
    userId: string,
    input: {
      name: string;
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      intervalMinutes?: number;
      expectedStatus?: number;
      alertEmail: string;
    }
  ) {
    const project = await this.ensureProjectAccess(projectId, userId);

    // 1. Validate URL against SSRF
    await testerService.validateUrlSecurity(input.url.trim());

    // 2. Validate real alert email
    const validEmail = await validateRealEmail(input.alertEmail);

    const monitor = await prisma.uptimeMonitor.create({
      data: {
        projectId,
        name: input.name.trim(),
        url: input.url.trim(),
        method: input.method || 'GET',
        intervalMinutes: input.intervalMinutes || 5,
        expectedStatus: input.expectedStatus || 200,
        alertEmail: validEmail,
        isActive: true,
        lastStatus: 'PENDING',
      },
    });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'CREATE_MONITOR',
      entity: 'UptimeMonitor',
      entityId: monitor.id,
      metadata: { name: monitor.name, url: monitor.url, intervalMinutes: monitor.intervalMinutes },
    });

    // Run immediate initial check
    return this.runCheckById(monitor.id);
  }

  async runCheckById(monitorId: string) {
    const monitor = await prisma.uptimeMonitor.findUnique({
      where: { id: monitorId },
    });
    if (!monitor) {
      throw new AppError('Monitor não encontrado.', 404, 'NOT_FOUND');
    }

    const startTime = Date.now();
    let statusCode = 0;
    let isUp = false;
    let errorMsg: string | null = null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      await testerService.validateUrlSecurity(monitor.url);
      const res = await fetch(monitor.url, {
        method: monitor.method,
        headers: { 'User-Agent': 'CloudAPI-UptimeMonitor/1.0' },
        signal: controller.signal,
        redirect: 'manual',
      });
      statusCode = res.status;
      isUp = statusCode === monitor.expectedStatus || (monitor.expectedStatus === 200 && statusCode >= 200 && statusCode < 300);
      if (!isUp) {
        errorMsg = `Esperado HTTP ${monitor.expectedStatus}, recebido HTTP ${statusCode}`;
      }
    } catch (err: any) {
      errorMsg = err?.name === 'AbortError' ? 'Timeout após 10 segundos' : err?.message || 'Erro de rede';
      isUp = false;
    } finally {
      clearTimeout(timeout);
    }

    const latencyMs = Date.now() - startTime;
    const newStatus: 'UP' | 'DOWN' = isUp ? 'UP' : 'DOWN';
    const previousStatus = monitor.lastStatus;

    await prisma.uptimeCheck.create({
      data: {
        monitorId: monitor.id,
        status: newStatus,
        statusCode,
        latencyMs,
        error: errorMsg,
      },
    });

    const updated = await prisma.uptimeMonitor.update({
      where: { id: monitor.id },
      data: {
        lastStatus: newStatus,
        lastStatusCode: statusCode,
        lastLatencyMs: latencyMs,
        lastCheckedAt: new Date(),
        totalChecks: { increment: 1 },
        upChecks: isUp ? { increment: 1 } : undefined,
      },
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 24,
        },
      },
    });

    // Send real email alert on status transition (PENDING->DOWN, UP->DOWN, DOWN->UP)
    const shouldAlertDown = newStatus === 'DOWN' && previousStatus !== 'DOWN';
    const shouldAlertRecovered = newStatus === 'UP' && previousStatus === 'DOWN';

    if (shouldAlertDown || shouldAlertRecovered) {
      await sendUptimeAlertEmail({
        to: monitor.alertEmail,
        monitorName: monitor.name,
        url: monitor.url,
        status: newStatus,
        statusCode,
        latencyMs,
        error: errorMsg,
      });
    }

    return {
      ...updated,
      uptimePercent:
        updated.totalChecks > 0
          ? Number(((updated.upChecks / updated.totalChecks) * 100).toFixed(2))
          : 100,
    };
  }

  async triggerCheckForUser(monitorId: string, userId: string) {
    const monitor = await prisma.uptimeMonitor.findUnique({ where: { id: monitorId } });
    if (!monitor) throw new AppError('Monitor não encontrado.', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(monitor.projectId, userId);
    return this.runCheckById(monitorId);
  }

  async toggleActive(monitorId: string, userId: string, isActive: boolean) {
    const monitor = await prisma.uptimeMonitor.findUnique({ where: { id: monitorId } });
    if (!monitor) throw new AppError('Monitor não encontrado.', 404, 'NOT_FOUND');
    await this.ensureProjectAccess(monitor.projectId, userId);

    const updated = await prisma.uptimeMonitor.update({
      where: { id: monitorId },
      data: { isActive },
      include: {
        checks: { orderBy: { checkedAt: 'desc' }, take: 24 },
      },
    });

    return {
      ...updated,
      uptimePercent:
        updated.totalChecks > 0
          ? Number(((updated.upChecks / updated.totalChecks) * 100).toFixed(2))
          : 100,
    };
  }

  async delete(monitorId: string, userId: string) {
    const monitor = await prisma.uptimeMonitor.findUnique({ where: { id: monitorId } });
    if (!monitor) throw new AppError('Monitor não encontrado.', 404, 'NOT_FOUND');
    const project = await this.ensureProjectAccess(monitor.projectId, userId);

    await prisma.uptimeMonitor.delete({ where: { id: monitorId } });

    await recordAuditLog({
      workspaceId: project.workspaceId,
      userId,
      action: 'DELETE_MONITOR',
      entity: 'UptimeMonitor',
      entityId: monitorId,
      metadata: { name: monitor.name, url: monitor.url },
    });

    return { message: 'Monitor removido com sucesso.' };
  }

  async runDueMonitors() {
    try {
      const activeMonitors = await prisma.uptimeMonitor.findMany({
        where: { isActive: true },
      });

      const now = Date.now();
      for (const m of activeMonitors) {
        const lastMs = m.lastCheckedAt ? m.lastCheckedAt.getTime() : 0;
        const intervalMs = m.intervalMinutes * 60 * 1000;
        if (now - lastMs >= intervalMs) {
          await this.runCheckById(m.id).catch(() => {});
        }
      }
    } catch {
      // Scheduler tick errors are non-fatal
    }
  }
}

export const monitorsService = new MonitorsService();

let schedulerTimer: NodeJS.Timeout | null = null;
export function startMonitorScheduler() {
  if (schedulerTimer || process.env.NODE_ENV === 'test') return;
  schedulerTimer = setInterval(() => {
    monitorsService.runDueMonitors();
  }, 60 * 1000);
}
