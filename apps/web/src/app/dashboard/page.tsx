'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Terminal,
  BookOpen,
  Key,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Inbox
} from 'lucide-react';
import { EndpointItem } from './apis/page';

export default function DashboardHomePage() {
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [avgLatency, setAvgLatency] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Load Real Endpoints
    const savedEp = localStorage.getItem('apihub-endpoints');
    let epList: EndpointItem[] = [];
    if (savedEp) {
      try {
        const parsed = JSON.parse(savedEp);
        if (Array.isArray(parsed)) {
          epList = parsed;
          setEndpoints(parsed);
        }
      } catch {}
    }

    // 2. Load Real Test History
    const savedHist = localStorage.getItem('apihub-history');
    if (savedHist) {
      try {
        const parsedHist = JSON.parse(savedHist);
        if (Array.isArray(parsedHist)) {
          setHistory(parsedHist);
          if (parsedHist.length > 0) {
            const totalMs = parsedHist.reduce((acc: number, item: any) => acc + (item.durationMs || 0), 0);
            setAvgLatency(Math.round(totalMs / parsedHist.length));
          }
        }
      } catch {}
    }

    setIsLoaded(true);
  }, []);

  const uniqueApis = new Set(endpoints.map(e => e.apiName)).size;

  const stats = [
    {
      label: 'APIs Registradas',
      value: String(uniqueApis),
      change: uniqueApis > 0 ? `${uniqueApis} agrupamento(s)` : 'Nenhuma API criada',
      icon: FolderGit2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Endpoints Mapeados',
      value: String(endpoints.length),
      change: endpoints.length > 0 ? 'Rotas documentadas' : 'Aguardando endpoints',
      icon: BookOpen,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Testes Executados',
      value: String(history.length),
      change: history.length > 0 ? 'Requisições registradas' : 'Sem histórico',
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    {
      label: 'Latência Média',
      value: avgLatency > 0 ? `${avgLatency} ms` : '0 ms',
      change: history.length > 0 ? 'Tempo de resposta médio' : 'Sem medições',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Painel de Controle</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visão consolidada das suas APIs, endpoints mapeados e métricas reais de teste.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/apis"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Novo Endpoint
          </Link>
          <Link
            href="/dashboard/tester"
            className="border border-[var(--border)] bg-[var(--card)] hover:opacity-80 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" /> Abrir Tester
          </Link>
        </div>
      </div>

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
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
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

          {isLoaded && history.length === 0 ? (
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
              {history.slice(0, 5).map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
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
                          item.status >= 200 && item.status < 300
                            ? 'text-emerald-400'
                            : item.status >= 400
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {item.status}
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
            A especificação OpenAPI 3.0 é gerada dinamicamente a partir dos endpoints cadastrados.
          </p>

          <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Status da Spec:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pronta para Exportação
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Rotas Exportáveis:</span>
              <span className="font-mono font-bold text-white">
                {endpoints.length} rota(s)
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
