'use client';

import { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Inbox,
  X
} from 'lucide-react';
import { api, TestCaseItem, TestExecutionResult } from '../../../lib/api';

export default function TestRunnerPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [runDetails, setRunDetails] = useState<Record<string, TestExecutionResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [maxLatencyMs, setMaxLatencyMs] = useState('1500');
  const [bodyContains, setBodyContains] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [summaryBanner, setSummaryBanner] = useState<{ total: number; passed: number; failed: number } | null>(null);

  useEffect(() => {
    api.workspaces
      .bootstrap()
      .then(async boot => {
        setProjectId(boot.project.id);
        const list = await api.runner.list(boot.project.id);
        setTestCases(list);
      })
      .catch(err => setError(err?.message || 'Erro ao carregar casos de teste.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.runner.create(projectId, {
        name: name.trim(),
        method,
        url: url.trim(),
        body: body.trim() || null,
        expectedStatus,
        maxLatencyMs: maxLatencyMs.trim() ? Number(maxLatencyMs) : null,
        bodyContains: bodyContains.trim() || null,
      });
      setTestCases(prev => [created, ...prev]);
      setIsModalOpen(false);
      setName('');
      setUrl('');
      setBody('');
      setBodyContains('');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar caso de teste.');
    } finally {
      setCreating(false);
    }
  };

  const handleRunAll = async () => {
    if (!projectId) return;
    setRunningAll(true);
    setError(null);
    try {
      const report = await api.runner.runAll(projectId);
      setSummaryBanner({ total: report.total, passed: report.passed, failed: report.failed });
      const detailsMap: Record<string, TestExecutionResult> = {};
      const updatedMap: Record<string, TestCaseItem> = {};
      report.results.forEach(r => {
        detailsMap[r.testCase.id] = r;
        updatedMap[r.testCase.id] = r.testCase;
      });
      setRunDetails(prev => ({ ...prev, ...detailsMap }));
      setTestCases(prev => prev.map(tc => updatedMap[tc.id] || tc));
    } catch (err: any) {
      setError(err?.message || 'Erro ao executar bateria de testes.');
    } finally {
      setRunningAll(false);
    }
  };

  const handleRunOne = async (id: string) => {
    setRunningId(id);
    setError(null);
    try {
      const res = await api.runner.runOne(id);
      setRunDetails(prev => ({ ...prev, [id]: res }));
      setTestCases(prev => prev.map(tc => (tc.id === id ? res.testCase : tc)));
    } catch (err: any) {
      setError(err?.message || 'Erro ao executar teste.');
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.runner.delete(id);
      setTestCases(prev => prev.filter(tc => tc.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir caso de teste.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Bateria de Testes (Assertions)</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Valide status HTTP, limite de latência e conteúdo da resposta em 1 clique — ou automatize via CI/CD (`x-api-key`).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {testCases.length > 0 && (
            <button
              onClick={handleRunAll}
              disabled={runningAll}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
            >
              <Play className="w-4 h-4" />
              {runningAll ? 'Executando Bateria...' : 'Executar Todos'}
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Novo Teste
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summaryBanner && (
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            summaryBanner.failed === 0
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/30 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {summaryBanner.failed === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>
              Resultado da Bateria: {summaryBanner.passed}/{summaryBanner.total} aprovado(s)
              {summaryBanner.failed > 0 ? ` • ${summaryBanner.failed} falhou(aram)` : ' • 100% Verde!'}
            </span>
          </div>
          <button onClick={() => setSummaryBanner(null)} className="text-zinc-400 hover:text-white">
            Fechar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-xs text-zinc-400">
          Carregando casos de teste...
        </div>
      ) : testCases.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-white">Nenhum teste automatizado criado</h3>
            <p className="text-xs text-zinc-400">
              Cadastre testes com validações de status HTTP, tempo máximo de resposta e conteúdo JSON para validar suas APIs em 1 clique.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Primeiro Teste
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {testCases.map(tc => {
            const detail = runDetails[tc.id];
            const passed = tc.lastPassed;

            return (
              <div
                key={tc.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {tc.method}
                      </span>
                      <h3 className="font-bold text-sm text-white truncate">{tc.name}</h3>
                      {passed === true && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> PASSOU
                        </span>
                      )}
                      {passed === false && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800">
                          <XCircle className="w-3 h-3" /> FALHOU
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-zinc-400 truncate">{tc.url}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                      <span>Status == <strong className="text-zinc-300">{tc.expectedStatus}</strong></span>
                      {tc.maxLatencyMs && (
                        <span>Latência &le; <strong className="text-zinc-300">{tc.maxLatencyMs}ms</strong></span>
                      )}
                      {tc.bodyContains && (
                        <span>Contém <strong className="text-zinc-300">&quot;{tc.bodyContains}&quot;</strong></span>
                      )}
                      {tc.lastLatencyMs !== null && tc.lastLatencyMs !== undefined && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <Clock className="w-3 h-3" /> Último: HTTP {tc.lastStatusCode} • {tc.lastLatencyMs}ms
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRunOne(tc.id)}
                      disabled={runningId === tc.id || runningAll}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-black/40 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      {runningId === tc.id ? 'Rodando...' : 'Rodar'}
                    </button>
                    <button
                      onClick={() => handleDelete(tc.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                      title="Excluir teste"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assertions breakdown */}
                {detail && detail.assertions.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {detail.assertions.map((a, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 ${
                          a.passed
                            ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                            : 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                        }`}
                      >
                        {a.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-400" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold">{a.rule}</p>
                          <p className="text-[10px] opacity-80 truncate">{a.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!detail && tc.lastError && (
                  <p className="text-[11px] text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded px-2.5 py-1.5">
                    Última falha: {tc.lastError}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Test Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-400" /> Novo Caso de Teste
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Nome do Teste</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Health Check deve responder 200 em menos de 1s"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as any)}
                  className="bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 font-mono font-bold"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.seusistema.com/health"
                  className="col-span-2 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 font-mono"
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Body JSON (Opcional)</label>
                  <textarea
                    rows={3}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder='{"chave": "valor"}'
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2.5 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Status HTTP Esperado</label>
                  <input
                    type="number"
                    required
                    value={expectedStatus}
                    onChange={e => setExpectedStatus(Number(e.target.value))}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Latência Máxima (ms)</label>
                  <input
                    type="number"
                    value={maxLatencyMs}
                    onChange={e => setMaxLatencyMs(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Corpo da Resposta deve conter (Opcional)</label>
                <input
                  type="text"
                  value={bodyContains}
                  onChange={e => setBodyContains(e.target.value)}
                  placeholder='Ex: "healthy" ou "success":true'
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-semibold"
                >
                  {creating ? 'Salvando...' : 'Salvar Teste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
