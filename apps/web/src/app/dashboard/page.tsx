'use client';

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
  Plus
} from 'lucide-react';

export default function DashboardHomePage() {
  const stats = [
    { label: 'APIs Registradas', value: '4', change: '+2 este mês', icon: FolderGit2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Endpoints Mapeados', value: '18', change: '100% documentados', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Testes Executados', value: '142', change: '98.5% sucesso', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Latência Média', value: '115 ms', change: '-12ms que semana passada', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const recentEndpoints = [
    { method: 'GET', path: '/v1/users/profile', api: 'Auth & Accounts API', status: 200, latency: '48ms', time: 'Há 5 minutos' },
    { method: 'POST', path: '/v1/products/create', api: 'E-commerce Catalog', status: 201, latency: '124ms', time: 'Há 18 minutos' },
    { method: 'GET', path: '/v1/orders/summary', api: 'Orders & Payments', status: 200, latency: '92ms', time: 'Há 1 hora' },
    { method: 'DELETE', path: '/v1/keys/:keyId', api: 'APIHub Internal Gateway', status: 204, latency: '65ms', time: 'Há 3 horas' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Painel de Controle</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visão consolidada das suas APIs, saúde dos endpoints e métricas em tempo real.
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

      {/* Main Grid: Recent Activity & Quick Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Endpoints / Activity */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Atividade Recente de Testes
            </h2>
            <Link href="/dashboard/tester" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              Ver histórico completo <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {recentEndpoints.map((item, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
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
                  <div>
                    <p className="font-mono font-semibold text-zinc-200">{item.path}</p>
                    <p className="text-[10px] text-zinc-500">{item.api}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="font-bold text-emerald-400">{item.status} OK</span>
                    <p className="text-[10px] text-zinc-500">{item.latency}</p>
                  </div>
                  <span className="text-zinc-600 hidden sm:inline">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OpenAPI & Security Snapshot */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
          <h2 className="font-bold text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Exportação OpenAPI
          </h2>
          <p className="text-xs text-zinc-400">
            A especificação OpenAPI 3.0 é gerada dinamicamente com base nas rotas cadastradas.
          </p>

          <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Status da Spec:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Válida (OpenAPI 3.0.3)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Rotas Exportáveis:</span>
              <span className="font-mono font-bold">18 caminhos</span>
            </div>
          </div>

          <Link
            href="/dashboard/docs"
            className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            Abrir Visualizador de Documentação
          </Link>
        </div>
      </div>
    </div>
  );
}
