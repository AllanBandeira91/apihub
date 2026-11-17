'use client';

import { useState, useEffect } from 'react';
import { BarChart3, ShieldCheck, Clock, Activity, AlertCircle, Inbox } from 'lucide-react';
import { api, MetricsData, AuditLogItem } from '../../../lib/api';

const ACTION_LABELS: Record<string, string> = {
  CREATE_WORKSPACE: 'Workspace Criado',
  UPDATE_WORKSPACE: 'Workspace Atualizado',
  ADD_MEMBER: 'Membro Adicionado',
  CREATE_API_KEY: 'API Key Criada',
  REVOKE_API_KEY: 'API Key Revogada',
  PUBLISH_API_DOCS: 'Docs Publicadas',
  UNPUBLISH_API_DOCS: 'Docs Privadas',
  UPDATE_ENDPOINT: 'Endpoint Editado',
  CREATE_ENVIRONMENT: 'Ambiente Criado',
  UPDATE_ENVIRONMENT: 'Ambiente Atualizado',
  DELETE_ENVIRONMENT: 'Ambiente Removido',
  CREATE_MONITOR: 'Monitor Criado',
  DELETE_MONITOR: 'Monitor Removido',
};

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.workspaces
      .bootstrap()
      .then(async boot => {
        const [m, logs] = await Promise.all([
          api.tester.metrics(boot.project.id),
          api.workspaces.auditLogs(boot.workspace.id, 50),
        ]);
        setMetrics(m);
        setAuditLogs(logs);
      })
      .catch(err => setError(err?.message || 'Erro ao carregar métricas e auditoria.'))
      .finally(() => setIsLoading(false));
  }, []);

  const series = metrics ? [...metrics.recentLatencySeries].reverse() : [];
  const maxLatency = Math.max(...series.map(s => s.durationMs), 100);

  const groupedStatus = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, ERR: 0 };
  (metrics?.statusDistribution || []).forEach(item => {
    if (item.statusCode >= 200 && item.statusCode < 300) groupedStatus['2xx'] += item.count;
    else if (item.statusCode >= 300 && item.statusCode < 400) groupedStatus['3xx'] += item.count;
    else if (item.statusCode >= 400 && item.statusCode < 500) groupedStatus['4xx'] += item.count;
    else if (item.statusCode >= 500) groupedStatus['5xx'] += item.count;
    else groupedStatus['ERR'] += item.count;
  });

  const totalDist = Object.values(groupedStatus).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Métricas & Trilha de Auditoria</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Evolução real da latência, distribuição de status HTTP e log de auditoria de segurança do workspace.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Carregando gráficos e auditoria...</div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Latency Over Time Bar Chart */}
            <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Latência das Últimas Requisições (ms)
                </h2>
                <span className="text-xs text-zinc-400">
                  Média: <strong className="text-white">{metrics?.avgDurationMs ?? 0} ms</strong>
                </span>
              </div>

              {series.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                  <Inbox className="w-7 h-7 text-zinc-600" />
                  <span>Execute requisições no API Tester para alimentar o gráfico de latência.</span>
                </div>
              ) : (
                <div className="h-44 flex items-end gap-1.5 pt-4 border-b border-[var(--border)] pb-2">
                  {series.map((point, idx) => {
                    const heightPct = Math.max(8, Math.round((point.durationMs / maxLatency) * 100));
                    const color =
                      point.status >= 200 && point.status < 300
                        ? 'bg-emerald-500/80 hover:bg-emerald-400'
                        : point.status >= 400 || point.status === 0
                        ? 'bg-rose-500/80 hover:bg-rose-400'
                        : 'bg-amber-500/80 hover:bg-amber-400';

                    return (
                      <div
                        key={idx}
                        title={`HTTP ${point.status || 'ERR'} • ${point.durationMs}ms • ${new Date(point.timestamp).toLocaleTimeString('pt-BR')}`}
                        style={{ height: `${heightPct}%` }}
                        className={`flex-1 rounded-t-sm transition ${color}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" /> Distribuição HTTP
              </h2>

              <div className="space-y-3 text-xs">
                {(
                  [
                    { label: '2xx Sucesso', key: '2xx', color: 'bg-emerald-500', text: 'text-emerald-400' },
                    { label: '3xx Redirec.', key: '3xx', color: 'bg-blue-500', text: 'text-blue-400' },
                    { label: '4xx Cliente', key: '4xx', color: 'bg-amber-500', text: 'text-amber-400' },
                    { label: '5xx Servidor', key: '5xx', color: 'bg-rose-500', text: 'text-rose-400' },
                    { label: 'Erro de Rede', key: 'ERR', color: 'bg-zinc-500', text: 'text-zinc-400' },
                  ] as const
                ).map(row => {
                  const count = groupedStatus[row.key];
                  const pct = metrics?.totalRequests ? Math.round((count / totalDist) * 100) : 0;
                  return (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${row.text}`}>{row.label}</span>
                        <span className="font-mono text-zinc-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Trilha de Auditoria (Audit Logs)
              </h2>
              <span className="text-xs text-zinc-400">{auditLogs.length} evento(s)</span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-10 text-center text-xs text-zinc-500">
                Nenhum evento de auditoria registrado neste workspace ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/30 border-b border-[var(--border)] text-zinc-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Ação</th>
                      <th className="p-3.5">Entidade</th>
                      <th className="p-3.5">Autor</th>
                      <th className="p-3.5">Detalhes</th>
                      <th className="p-3.5 text-right">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-zinc-300">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-black/20">
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-blue-950/50 border border-blue-800 text-blue-300 font-semibold text-[11px]">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-zinc-400">{log.entity}</td>
                        <td className="p-3.5">{log.user?.name || 'Sistema'}</td>
                        <td className="p-3.5 font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                        <td className="p-3.5 text-right text-zinc-500">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
