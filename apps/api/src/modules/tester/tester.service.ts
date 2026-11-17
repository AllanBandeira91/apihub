import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { ExecuteTestRequestInput } from '@apihub/shared';

export class TesterService {
  async validateUrlSecurity(targetUrl: string): Promise<string> {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new AppError('Invalid URL provided', 400, 'INVALID_URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new AppError('Only HTTP and HTTPS protocols are allowed', 400, 'UNSUPPORTED_PROTOCOL');
    }

    if (env.TESTER_ALLOW_PRIVATE_IPS) {
      return targetUrl;
    }

    const hostname = parsed.hostname;

    // Resolve hostname to IP addresses
    let addresses: string[] = [];
    try {
      if (netIsIP(hostname)) {
        addresses = [hostname];
      } else {
        const lookups = await dns.lookup(hostname, { all: true });
        addresses = lookups.map(l => l.address);
      }
    } catch (err) {
      throw new AppError(`Could not resolve hostname '${hostname}'`, 400, 'DNS_RESOLUTION_FAILED');
    }

    if (addresses.length === 0) {
      throw new AppError(`No IP address found for host '${hostname}'`, 400, 'DNS_RESOLUTION_FAILED');
    }

    for (const ipStr of addresses) {
      if (this.isPrivateOrReservedIp(ipStr)) {
        throw new AppError(
          `Destination host '${hostname}' resolved to private/internal IP address (${ipStr}), which is blocked for security reasons (SSRF protection).`,
          403,
          'SSRF_TARGET_BLOCKED'
        );
      }
    }

    return targetUrl;
  }

  isPrivateOrReservedIp(ipString: string): boolean {
    try {
      const addr = ipaddr.parse(ipString);
      const range = addr.range();

      // Blocked ranges: loopback, private, linkLocal, carrierGradeNat, uniqueLocal, multicast, broadcast, reserved
      const blockedRanges = [
        'loopback',
        'private',
        'linkLocal',
        'carrierGradeNat',
        'uniqueLocal',
        'multicast',
        'broadcast',
        'reserved',
        'unspecified',
      ];

      return blockedRanges.includes(range);
    } catch {
      return true; // If IP cannot be parsed safely, treat as blocked
    }
  }

  async executeRequest(projectId: string, input: ExecuteTestRequestInput) {
    // 1. Build Full URL with Query Parameters
    const urlObj = new URL(input.url);
    if (input.queryParams) {
      for (const [key, val] of Object.entries(input.queryParams)) {
        urlObj.searchParams.append(key, String(val));
      }
    }
    const finalUrl = urlObj.toString();

    // 2. Validate URL against SSRF
    await this.validateUrlSecurity(finalUrl);

    // 3. Prepare headers (strip forbidden/internal headers & prevent CRLF / SSL Header injection)
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, val] of Object.entries(input.headers || {})) {
      // Clean CRLF characters to prevent HTTP request splitting / header injection
      const cleanKey = key.replace(/[\r\n\0]/g, '').trim();
      const cleanVal = String(val).replace(/[\r\n\0]/g, '').trim();

      const lowerKey = cleanKey.toLowerCase();
      if (cleanKey && !['host', 'connection', 'content-length', 'transfer-encoding'].includes(lowerKey)) {
        sanitizedHeaders[cleanKey] = cleanVal;
      }
    }

    // Default User-Agent
    if (!sanitizedHeaders['User-Agent'] && !sanitizedHeaders['user-agent']) {
      sanitizedHeaders['User-Agent'] = 'APIHub-Tester/1.0';
    }

    // 4. Execute fetch with timeout and size limits
    const startTime = Date.now();
    let statusCode = 0;
    let durationMs = 0;
    let responseHeaders: Record<string, string> = {};
    let responseBody = '';
    let errorMessage: string | null = null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.TESTER_TIMEOUT_MS);

    try {
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(input.method) && input.body;

      const res = await fetch(finalUrl, {
        method: input.method,
        headers: sanitizedHeaders,
        body: hasBody ? input.body : undefined,
        signal: controller.signal,
        redirect: 'manual', // Manual redirect handling avoids open redirect SSRF bypass
      });

      statusCode = res.status;
      durationMs = Date.now() - startTime;

      res.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      // Stream / read response within max limit
      const text = await res.text();
      if (text.length > env.TESTER_MAX_RESPONSE_BYTES) {
        responseBody = text.slice(0, env.TESTER_MAX_RESPONSE_BYTES) + '\n[...response truncated by size limit]';
      } else {
        responseBody = text;
      }
    } catch (err: any) {
      durationMs = Date.now() - startTime;
      errorMessage = err.name === 'AbortError' ? 'Request timed out' : err.message || 'Network error';
    } finally {
      clearTimeout(timeout);
    }

    // 5. Store in RequestLog
    try {
      await prisma.requestLog.create({
        data: {
          projectId,
          endpointId: input.endpointId || null,
          method: input.method,
          url: finalUrl,
          statusCode: statusCode || 0,
          durationMs,
          error: errorMessage,
        },
      });
    } catch (logErr) {
      // Don't fail the response if logging fails
    }

    return {
      statusCode,
      durationMs,
      headers: responseHeaders,
      body: responseBody,
      error: errorMessage,
    };
  }

  async getLogs(projectId: string, limit = 50) {
    return prisma.requestLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  async clearLogs(projectId: string) {
    await prisma.requestLog.deleteMany({
      where: { projectId },
    });
    return { message: 'Histórico de testes limpo com sucesso.' };
  }

  async getMetrics(projectId: string) {
    const totalRequests = await prisma.requestLog.count({
      where: { projectId },
    });

    const statusCounts = await prisma.requestLog.groupBy({
      by: ['statusCode'],
      where: { projectId },
      _count: { statusCode: true },
    });

    const recentLogs = await prisma.requestLog.findMany({
      where: { projectId },
      select: { durationMs: true, createdAt: true, statusCode: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const avgDuration =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((acc, log) => acc + log.durationMs, 0) / recentLogs.length)
        : 0;

    return {
      totalRequests,
      avgDurationMs: avgDuration,
      statusDistribution: statusCounts.map(s => ({
        statusCode: s.statusCode,
        count: s._count.statusCode,
      })),
      recentLatencySeries: recentLogs.slice(0, 30).map(l => ({
        timestamp: l.createdAt,
        durationMs: l.durationMs,
        status: l.statusCode,
      })),
    };
  }
}

function netIsIP(s: string): boolean {
  return ipaddr.isValid(s);
}

export const testerService = new TesterService();
