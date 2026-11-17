'use client';

import { useState, useEffect } from 'react';
import {
  Gauge,
  Play,
  ShieldCheck,
  AlertCircle,
  Zap,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import { api, BenchmarkResult } from '../../../lib/api';

export default function BenchmarkPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('');
  const [totalRequests, setTotalRequests] = useState(15);
  const [concurrency, setConcurrency] = useState(3);
  const [body, setBody] = useState('');
  const [headersJson, setHeadersJson] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  useEffect(() => {
    api.workspaces
      .bootstrap()
      .then(boot => setProjectId(boot.project.id))
      .catch(err => setError(err?.message || 'Erro ao inicializar projeto.'));
  }, []);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !url.trim()) return;
    setRunning(true);
    setError(null);

    try {
      let parsedHeaders: Record<string, string> = {};
      if (headersJson.trim()) {
        try {
          parsedHeaders = JSON.parse(headersJson);
        } catch {
          throw new Error('Headers customizados devem estar em formato JSON válido (ex: {"Authorization": "Bearer ..."}).');
        }
      }

      const res = await api.benchmark.run(projectId, {
        url: url.trim(),
        method,
        headers: parsedHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(method) && body.trim() ? body : null,
        totalRequests,
        concurrency,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Falha ao executar benchmark.');
    } finally {
      setRunning(false);
    }
  };

  const maxBarLatency = result && result.latencies.length > 0 ? Math.max(...result.latencies, 1) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Gauge className="w-7 h-7 text-amber-400" /> Benchmark de Carga Seguro
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Meça a performance real da sua API com percentis <code className="text-amber-300">p50 / p95 / p99</code>, vazão (RPS) e taxa de sucesso.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-300 font-semibold self-start">
          <ShieldCheck className="w-4 h-4" /> Anti-SSRF & Limite Anti-Abuso Ativo
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleRun}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Método</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-mono font-bold"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="text-xs font-semibold text-zinc-400 block mb-1">URL Pública Alvo (HTTPS)</label>
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://api.seusistema.com/v1/health"
              className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Requisições (1–30)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={totalRequests}
              onChange={e => setTotalRequests(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Concorrência (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={concurrency}
              onChange={e => setConcurrency(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Headers JSON (Opcional)</label>
            <textarea
              rows={2}
              value={headersJson}
              onChange={e => setHeadersJson(e.target.value)}
              placeholder='{"Authorization": "Bearer seu_token"}'
              className="w-full bg-black/40 border border-[var(--border)] rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Payload JSON (para POST / PUT / PATCH)
            </label>
            <textarea
              rows={2}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder='{"ping": true}'
              disabled={!['POST', 'PUT', 'PATCH'].includes(method)}
              className="w-full bg-black/40 border border-[var(--border)] rounded-xl p-2.5 text-xs font-mono disabled:opacity-40 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <p className="text-[11px] text-zinc-500">
            Limite de segurança: até 30 requisições, concorrência máxima 5, timeout 8s e rate limit de 6 execuções/min.
          </p>
          <button
            type="submit"
            disabled={running || !projectId}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-amber-600/20"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? 'Executando Benchmark...' : 'Iniciar Benchmark'}
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Vazão (RPS)
              </p>
              <p className="text-2xl font-mono font-extrabold text-white mt-1">{result.rps}</p>
              <p className="text-[10px] text-zinc-500">req/seg • {result.totalDurationMs}ms total</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Taxa de Sucesso
              </p>
              <p className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">{result.successRate}%</p>
              <p className="text-[10px] text-zinc-500">
                {result.successCount} ok / {result.errorCount} erro(s)
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Mediana (p50)
              </p>
              <p className="text-2xl font-mono font-extrabold text-blue-400 mt-1">{result.p50Ms}ms</p>
              <p className="text-[10px] text-zinc-500">Mín: {result.minMs}ms • Média: {result.avgMs}ms</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> Percentil p95
              </p>
              <p className="text-2xl font-mono font-extrabold text-purple-400 mt-1">{result.p95Ms}ms</p>
              <p className="text-[10px] text-zinc-500">95% abaixo deste tempo</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-rose-400" /> Percentil p99
              </p>
              <p className="text-2xl font-mono font-extrabold text-rose-400 mt-1">{result.p99Ms}ms</p>
              <p className="text-[10px] text-zinc-500">Máximo: {result.maxMs}ms</p>
            </div>
          </div>

          {/* Latency Distribution Bars + Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">Latência por Requisição (ms)</span>
                <span className="text-zinc-500 font-mono">
                  {result.method} {result.url}
                </span>
              </div>
              <div className="flex items-end gap-1.5 h-40 pt-4">
                {result.latencies.map((ms, idx) => {
                  const pct = Math.max(8, Math.round((ms / maxBarLatency) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div
                        style={{ height: `${pct}%` }}
                        title={`Req #${idx + 1}: ${ms}ms`}
                        className={`w-full rounded-t transition ${
                          ms > result.p95Ms ? 'bg-rose-500/85' : ms > result.p50Ms ? 'bg-amber-500/80' : 'bg-blue-500/80'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Req #1</span>
                <span>Req #{result.latencies.length}</span>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Distribuição HTTP</h3>
              <div className="space-y-2">
                {Object.entries(result.statusCounts).map(([code, count]) => {
                  const is2xx = code.startsWith('2') || code.startsWith('3');
                  return (
                    <div
                      key={code}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-[var(--border)] text-xs font-mono"
                    >
                      <span className={is2xx ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        HTTP {code}
                      </span>
                      <span className="text-zinc-300">
                        {count} ({Math.round((count / result.totalRequests) * 100)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
