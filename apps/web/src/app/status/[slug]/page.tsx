'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  ExternalLink,
  Megaphone,
  Wrench
} from 'lucide-react';
import { api } from '../../../lib/api';
import { ThemeToggle } from '../../../components/ThemeToggle';

export default function PublicStatusPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (silent = false) => {
    if (!slug) return;
    if (silent) setRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await api.monitors.getPublicStatus(slug);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Página de status não encontrada.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus(false);
  }, [slug]);

  const overall = data?.overallStatus;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              λ
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight truncate">CloudAPI Status</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Verificando status dos serviços...</p>
          </div>
        ) : error || !data ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center space-y-4">
            <XCircle className="w-10 h-10 text-zinc-500 mx-auto" />
            <h1 className="text-xl font-bold">Página de Status Indisponível</h1>
            <p className="text-xs text-zinc-400">{error}</p>
            <Link href="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
              Ir para o CloudAPI
            </Link>
          </div>
        ) : (
          <>
            {/* Overall Health Banner */}
            <div
              className={`rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
                overall === 'OPERATIONAL'
                  ? 'bg-emerald-950/25 border-emerald-800/80'
                  : overall === 'DEGRADED'
                  ? 'bg-amber-950/25 border-amber-800/80'
                  : 'bg-rose-950/25 border-rose-800/80'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    overall === 'OPERATIONAL'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : overall === 'DEGRADED'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {overall === 'OPERATIONAL' ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : overall === 'DEGRADED' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {data.workspace.name}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                    {overall === 'OPERATIONAL'
                      ? 'Todos os Sistemas Operacionais'
                      : overall === 'DEGRADED'
                      ? 'Degradação Parcial Detectada'
                      : 'Indisponibilidade Crítica'}
                  </h1>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-2xl font-mono font-extrabold text-emerald-400">{data.avgUptime}%</p>
                <p className="text-[11px] text-zinc-400">Uptime Médio Global</p>
              </div>
            </div>

            {/* Active & Recent Incidents / Maintenance */}
            {Array.isArray(data.incidents) && data.incidents.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Megaphone className="w-3.5 h-3.5 text-amber-400" /> Comunicados, Incidentes &amp; Manutenções
                </h2>
                <div className="space-y-3">
                  {data.incidents.map((inc: any) => {
                    const isResolved = inc.status === 'RESOLVED';
                    const isMaint = inc.type === 'MAINTENANCE' || inc.status === 'MAINTENANCE';
                    return (
                      <div
                        key={inc.id}
                        className={`rounded-xl border p-4 space-y-1.5 ${
                          isResolved
                            ? 'border-emerald-900/60 bg-emerald-950/15'
                            : isMaint
                            ? 'border-blue-800/70 bg-blue-950/20'
                            : 'border-amber-800/80 bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {isMaint ? (
                              <Wrench className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            ) : isResolved ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            )}
                            <h3 className="font-bold text-sm text-white">{inc.title}</h3>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isResolved
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : isMaint
                                ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                                : 'bg-amber-950/60 text-amber-300 border-amber-800'
                            }`}
                          >
                            {isResolved
                              ? 'Resolvido'
                              : isMaint
                              ? 'Manutenção Programada'
                              : inc.status === 'IDENTIFIED'
                              ? 'Causa Identificada'
                              : 'Investigando'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{inc.message}</p>
                        <p className="text-[10px] text-zinc-500">
                          Atualizado em {new Date(inc.updatedAt || inc.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Services List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-bold uppercase tracking-wider">Serviços Monitorados ({data.monitors.length})</span>
                <span>Atualizado: {new Date(data.updatedAt).toLocaleTimeString('pt-BR')}</span>
              </div>

              {data.monitors.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-xs text-zinc-400">
                  Nenhum monitor ativo configurado neste workspace ainda.
                </div>
              ) : (
                data.monitors.map((m: any) => {
                  const isUp = m.lastStatus === 'UP';
                  const isDown = m.lastStatus === 'DOWN';

                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              isUp ? 'bg-emerald-400' : isDown ? 'bg-rose-500 animate-pulse' : 'bg-zinc-500'
                            }`}
                          />
                          <h2 className="font-bold text-sm text-white truncate">{m.name}</h2>
                        </div>

                        <div className="flex items-center gap-4 text-xs flex-shrink-0">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {m.lastLatencyMs ?? 0}ms
                          </span>
                          <span className="font-mono font-bold text-emerald-400">{m.uptimePercent}%</span>
                          <span
                            className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                              isUp
                                ? 'bg-emerald-950/60 text-emerald-400'
                                : isDown
                                ? 'bg-rose-950/60 text-rose-400'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {isUp ? 'Operacional' : isDown ? 'Fora do ar' : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      {m.checks && m.checks.length > 0 && (
                        <div className="flex items-center gap-1 h-7 pt-1">
                          {[...m.checks].reverse().map((c: any) => (
                            <div
                              key={c.id}
                              title={`${c.status} • HTTP ${c.statusCode || 'ERR'} • ${c.latencyMs}ms • ${new Date(c.checkedAt).toLocaleString('pt-BR')}`}
                              className={`flex-1 h-full rounded-sm ${
                                c.status === 'UP' ? 'bg-emerald-500/80' : 'bg-rose-500/90'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-zinc-500">
        Monitorado 24/7 por{' '}
        <Link href="/" className="text-blue-400 hover:underline font-semibold inline-flex items-center gap-1">
          <Activity className="w-3 h-3" /> CloudAPI <ExternalLink className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
}
