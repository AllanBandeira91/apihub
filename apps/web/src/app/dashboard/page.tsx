'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Terminal,
  BookOpen,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { api, BootstrapData } from '../../lib/api';

export default function DashboardHomePage() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.workspaces
      .bootstrap()
      .then(res => {
        setData(res);
      })
      .catch(err => {
        setError(err?.message || 'Não foi possível carregar os dados do painel.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const stats = [
    {
      label: 'APIs Registradas',
      value: String(data?.stats.apisCount ?? 0),
      change: (data?.stats.apisCount ?? 0) > 0 ? 'Sincronizadas no Supabase' : 'Nenhuma API criada',
      icon: FolderGit2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Endpoints Mapeados',
      value: String(data?.stats.endpointsCount ?? 0),
      change: (data?.stats.endpointsCount ?? 0) > 0 ? 'Rotas na nuvem' : 'Aguardando endpoints',
      icon: BookOpen,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Testes Executados',
      value: String(data?.stats.totalRequests ?? 0),
      change: (data?.stats.totalRequests ?? 0) > 0 ? 'Logs gravados no banco' : 'Sem histórico',
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Latência Média',
      value: `${data?.stats.avgLatencyMs ?? 0} ms`,
      change: (data?.stats.totalRequests ?? 0) > 0 ? 'Medição real do servidor' : 'Sem medições',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Painel de Controle</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visão consolidada em tempo real sincronizada com o banco de dados na nuvem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/apis"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Novo Endpoint
          </Link>
          <Link
            href="/dashboard/tester"
            className="border border-[var(--border)] bg-[var(--card)] hover:opacity-80 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" /> Abrir Tester
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{s.label}</span>
                <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight">
                  {isLoading ? '—' : s.value}
                </p>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> {s.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Real Activity & Quick OpenAPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Test History */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Atividade Recente de Testes
            </h2>
            <Link href="/dashboard/tester" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              Abrir Tester <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {!isLoading && (!data?.recentLogs || data.recentLogs.length === 0) ? (
            <div className="py-10 text-center space-y-3 text-zinc-500">
              <Inbox className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs">Nenhum teste executado ainda.</p>
              <Link
                href="/dashboard/tester"
                className="text-xs text-blue-400 hover:underline inline-block font-semibold"
              >
                Disparar primeira requisição no API Tester →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {(data?.recentLogs || []).slice(0, 6).map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] flex-shrink-0 ${
                        item.method === 'GET'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : item.method === 'POST'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.method}
                    </span>
                    <span className="font-mono font-semibold text-zinc-200 truncate">{item.url}</span>
                  </div>

                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <span
                        className={`font-bold ${
                          item.statusCode >= 200 && item.statusCode < 300
                            ? 'text-emerald-400'
                            : item.statusCode >= 400 || item.statusCode === 0
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {item.statusCode || 'ERR'}
                      </span>
                      <p className="text-[10px] text-zinc-500">{item.durationMs}ms</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OpenAPI Export Snapshot */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
          <h2 className="font-bold text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Exportação OpenAPI 3.0
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            A especificação OpenAPI 3.0 e os snippets de código são gerados automaticamente a partir dos endpoints salvos no Supabase.
          </p>

          <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Status da Spec:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pronta para Exportação
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Rotas na Nuvem:</span>
              <span className="font-mono font-bold text-white">
                {data?.stats.endpointsCount ?? 0} rota(s)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Chaves Ativas:</span>
              <span className="font-mono font-bold text-white">
                {data?.stats.keysCount ?? 0} chave(s)
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/docs"
            className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            Visualizar Documentação
          </Link>
        </div>
      </div>
    </div>
  );
}
