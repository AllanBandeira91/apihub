import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { testerService } from '../tester/tester.service';
import { validateRealEmail } from '../auth/email-validator';
import { sendUptimeAlertEmail } from '../auth/mailer';
import { recordAuditLog } from '../../lib/audit';

function validateDiscordWebhookUrl(url?: string | null): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  const isValid =
    /^https:\/\/(discord\.com|discordapp\.com|ptb\.discord\.com|canary\.discord\.com)\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/.test(
      trimmed
    );
  if (!isValid) {
    throw new AppError(
      'URL de Webhook do Discord inválida. Use o formato https://discord.com/api/webhooks/{id}/{token}',
      400,
      'INVALID_DISCORD_WEBHOOK'
    );
  }
  return trimmed;
}

async function sendDiscordWebhookAlert(
  webhookUrl: string,
  params: {
    monitorName: string;
    url: string;
    status: 'UP' | 'DOWN';
    statusCode: number;
    latencyMs: number;
    error?: string | null;
  }
) {
  const isDown = params.status === 'DOWN';
  const embed = {
    title: isDown
      ? `🔴 ALERTA CRÍTICO — ${params.monitorName} está OFFLINE`
      : `🟢 RECUPERADO — ${params.monitorName} voltou ao normal`,
    color: isDown ? 0xdc2626 : 0x16a34a,
    fields: [
      { name: 'URL Monitorada', value: `\`${params.url}\``, inline: false },
      { name: 'Status HTTP', value: params.statusCode ? `\`HTTP ${params.statusCode}\`` : '`Sem resposta`', inline: true },
      { name: 'Latência', value: `\`${params.latencyMs} ms\``, inline: true },
      ...(params.error ? [{ name: 'Detalhe', value: params.error.slice(0, 500), inline: false }] : []),
    ],
    footer: { text: 'CloudAPI Monitoramento 24/7' },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'CloudAPI Monitor',
        embeds: [embed],
      }),
    });
  } catch {
    // Non-fatal
  }
}

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
      discordWebhookUrl?: string | null;
    }
  ) {
    const project = await this.ensureProjectAccess(projectId, userId);

    // 1. Validate URL against SSRF
    await testerService.validateUrlSecurity(input.url.trim());

    // 2. Validate real alert email
    const validEmail = await validateRealEmail(input.alertEmail);

    // 3. Validate optional Discord webhook URL
    const validDiscordWebhook = validateDiscordWebhookUrl(input.discordWebhookUrl);

    const monitor = await prisma.uptimeMonitor.create({
      data: {
        projectId,
        name: input.name.trim(),
        url: input.url.trim(),
        method: input.method || 'GET',
        intervalMinutes: input.intervalMinutes || 5,
        expectedStatus: input.expectedStatus || 200,
        alertEmail: validEmail,
        discordWebhookUrl: validDiscordWebhook,
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

      if (monitor.discordWebhookUrl) {
        await sendDiscordWebhookAlert(monitor.discordWebhookUrl, {
          monitorName: monitor.name,
          url: monitor.url,
          status: newStatus,
          statusCode,
          latencyMs,
          error: errorMsg,
        });
      }
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

  async getPublicStatusByWorkspaceSlug(workspaceSlug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    if (!workspace) {
      throw new AppError('Página de status não encontrada.', 404, 'NOT_FOUND');
    }

    const monitors = await prisma.uptimeMonitor.findMany({
      where: {
        project: { workspaceId: workspace.id },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        method: true,
        intervalMinutes: true,
        lastStatus: true,
        lastStatusCode: true,
        lastLatencyMs: true,
        lastCheckedAt: true,
        totalChecks: true,
        upChecks: true,
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 24,
          select: {
            id: true,
            status: true,
            statusCode: true,
            latencyMs: true,
            checkedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = monitors.map(m => ({
      ...m,
      uptimePercent: m.totalChecks > 0 ? Number(((m.upChecks / m.totalChecks) * 100).toFixed(2)) : 100,
    }));

    const downCount = formatted.filter(m => m.lastStatus === 'DOWN').length;
    const overallStatus =
      formatted.length === 0
        ? 'OPERATIONAL'
        : downCount === formatted.length
        ? 'OUTAGE'
        : downCount > 0
        ? 'DEGRADED'
        : 'OPERATIONAL';

    const avgUptime =
      formatted.length > 0
        ? Number((formatted.reduce((acc, m) => acc + m.uptimePercent, 0) / formatted.length).toFixed(2))
        : 100;

    return {
      workspace,
      overallStatus,
      avgUptime,
      updatedAt: new Date().toISOString(),
      monitors: formatted,
    };
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
