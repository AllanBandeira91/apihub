import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { authenticate } from '../../middleware/auth';
import { testerService } from '../tester/tester.service';

const BenchmarkSchema = z.object({
  url: z.string().url('Informe uma URL HTTP/HTTPS válida'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional().default({}),
  body: z.string().nullable().optional(),
  totalRequests: z.coerce.number().int().min(1).max(30).default(10),
  concurrency: z.coerce.number().int().min(1).max(5).default(3),
});

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export async function benchmarkRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post(
    '/projects/:projectId/benchmark',
    {
      config: {
        rateLimit: {
          max: 6,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          workspace: {
            include: { members: { where: { userId: request.user!.id } } },
          },
        },
      });
      if (!project || project.workspace.members.length === 0) {
        throw new AppError('Projeto não encontrado ou acesso negado.', 403, 'FORBIDDEN');
      }

      const input = BenchmarkSchema.parse(request.body);
      const targetUrl = input.url.trim();

      // Strict server-side Anti-SSRF validation before any request
      await testerService.validateUrlSecurity(targetUrl);

      // Sanitize headers against CRLF / request splitting
      const safeHeaders: Record<string, string> = {
        'User-Agent': 'CloudAPI-Benchmark/1.0',
      };
      for (const [k, v] of Object.entries(input.headers || {})) {
        const ck = String(k).replace(/[\r\n\0]/g, '').trim();
        const cv = String(v).replace(/[\r\n\0]/g, '').trim();
        if (ck && !['host', 'connection', 'content-length', 'transfer-encoding'].includes(ck.toLowerCase())) {
          safeHeaders[ck] = cv;
        }
      }

      const hasBody = ['POST', 'PUT', 'PATCH'].includes(input.method) && input.body?.trim();
      if (hasBody && !Object.keys(safeHeaders).some(k => k.toLowerCase() === 'content-type')) {
        safeHeaders['Content-Type'] = 'application/json';
      }

      const latencies: number[] = [];
      const statusCounts: Record<string, number> = {};
      let successCount = 0;
      let errorCount = 0;

      const benchStart = Date.now();
      let remaining = input.totalRequests;

      const runOne = async () => {
        const start = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(targetUrl, {
            method: input.method,
            headers: safeHeaders,
            body: hasBody ? input.body! : undefined,
            signal: controller.signal,
            redirect: 'manual',
          });
          await res.text().catch(() => '');
          const ms = Date.now() - start;
          latencies.push(ms);
          const key = String(res.status);
          statusCounts[key] = (statusCounts[key] || 0) + 1;
          if (res.status >= 200 && res.status < 400) successCount++;
          else errorCount++;
        } catch {
          const ms = Date.now() - start;
          latencies.push(ms);
          statusCounts['ERR'] = (statusCounts['ERR'] || 0) + 1;
          errorCount++;
        } finally {
          clearTimeout(timeout);
        }
      };

      const worker = async () => {
        while (remaining > 0) {
          remaining--;
          await runOne();
        }
      };

      const workers = Array.from({ length: Math.min(input.concurrency, input.totalRequests) }, () => worker());
      await Promise.all(workers);

      const totalDurationMs = Math.max(1, Date.now() - benchStart);
      const sorted = [...latencies].sort((a, b) => a - b);
      const avgMs =
        sorted.length > 0 ? Math.round(sorted.reduce((sum, n) => sum + n, 0) / sorted.length) : 0;
      const rps = Number(((input.totalRequests / totalDurationMs) * 1000).toFixed(2));

      return reply.send({
        success: true,
        data: {
          url: targetUrl,
          method: input.method,
          totalRequests: input.totalRequests,
          concurrency: input.concurrency,
          totalDurationMs,
          rps,
          successCount,
          errorCount,
          successRate: Number(((successCount / input.totalRequests) * 100).toFixed(1)),
          minMs: sorted[0] ?? 0,
          avgMs,
          p50Ms: percentile(sorted, 50),
          p95Ms: percentile(sorted, 95),
          p99Ms: percentile(sorted, 99),
          maxMs: sorted[sorted.length - 1] ?? 0,
          statusCounts,
          latencies,
        },
      });
    }
  );
}
