'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Webhook,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Inbox,
  AlertCircle,
  Clock,
  Globe,
  Code2,
  Play,
  Pause,
} from 'lucide-react';
import { api, API_BASE_URL, WebhookCaptureItem } from '../../../lib/api';

export default function WebhooksPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [captures, setCaptures] = useState<WebhookCaptureItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaptures = useCallback(async (wsId: string, silent = false) => {
    if (silent) setRefreshing(true);
    else setIsLoading(true);
    try {
      const list = await api.webhooks.list(wsId);
      setCaptures(list);
      setSelectedId(prev => {
        if (prev && list.some(c => c.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar webhooks capturados.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    api.workspaces
      .bootstrap()
      .then(boot => {
        setWorkspaceId(boot.workspace.id);
        setWorkspaceSlug(boot.workspace.slug);
        return fetchCaptures(boot.workspace.id, false);
      })
      .catch(err => {
        setError(err?.message || 'Erro ao inicializar workspace.');
        setIsLoading(false);
      });
  }, [fetchCaptures]);

  useEffect(() => {
    if (!autoRefresh || !workspaceId) return;
    const timer = setInterval(() => {
      fetchCaptures(workspaceId, true);
    }, 4000);
    return () => clearInterval(timer);
  }, [autoRefresh, workspaceId, fetchCaptures]);

  const hookUrl = workspaceSlug ? `${API_BASE_URL}/hook/${workspaceSlug}` : '';

  const handleCopy = () => {
    if (!hookUrl) return;
    navigator.clipboard.writeText(hookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearAll = async () => {
    if (!workspaceId) return;
    setError(null);
    try {
      await api.webhooks.clearAll(workspaceId);
      setCaptures([]);
      setSelectedId(null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao limpar capturas.');
    }
  };

  const handleDeleteOne = async (captureId: string) => {
    if (!workspaceId) return;
    setError(null);
    try {
      await api.webhooks.deleteOne(workspaceId, captureId);
      setCaptures(prev => {
        const next = prev.filter(c => c.id !== captureId);
        if (selectedId === captureId) {
          setSelectedId(next[0]?.id ?? null);
        }
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover captura.');
    }
  };

  const selected = captures.find(c => c.id === selectedId) || null;

  const methodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Webhook className="w-7 h-7 text-purple-400" /> Webhook Inspector
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Receba e inspecione payloads HTTP, headers e query strings de Stripe, Mercado Pago, GitHub ou qualquer serviço em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(prev => !prev)}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              autoRefresh
                ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300'
                : 'border-[var(--border)] bg-[var(--card)] text-zinc-400 hover:text-white'
            }`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {autoRefresh ? 'Auto-Refresh (4s)' : 'Auto-Refresh Pausado'}
          </button>

          <button
            type="button"
            onClick={() => workspaceId && fetchCaptures(workspaceId, true)}
            disabled={refreshing || !workspaceId}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          {captures.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 rounded-lg border border-rose-900/60 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {/* Unique Webhook Endpoint Card */}
      <div className="rounded-2xl border border-purple-800/40 bg-purple-950/15 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Sua URL Exclusiva de Captura (Qualquer Método ou Sub-Rota)
          </span>
          <span className="text-[11px] text-zinc-400">
            Aceita GET, POST, PUT, PATCH, DELETE • Limite 64KB por payload • Cookies removidos automaticamente
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <code className="flex-1 bg-black/50 border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs font-mono text-purple-200 break-all">
            {hookUrl || 'Carregando URL do workspace...'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hookUrl}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'URL Copiada!' : 'Copiar URL'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Split View */}
      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Carregando webhooks capturados...</p>
        </div>
      ) : captures.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-bold text-lg text-white">Aguardando primeiro webhook</h3>
            <p className="text-xs text-zinc-400">
              Envie qualquer requisição HTTP para a URL acima (via cURL, API Tester ou serviço externo). Ela aparecerá aqui automaticamente.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left list */}
          <div className="lg:col-span-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden flex flex-col max-h-[360px] lg:max-h-[650px]">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Requisições Recebidas ({captures.length})</span>
              {autoRefresh && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
            <div className="overflow-y-auto divide-y divide-[var(--border)]">
              {captures.map(c => {
                const isSelected = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full p-3.5 text-left transition flex items-start justify-between gap-2 ${
                      isSelected ? 'bg-purple-600/15' : 'hover:bg-black/25'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border ${methodBadge(c.method)}`}
                        >
                          {c.method}
                        </span>
                        <span className="font-mono text-xs text-zinc-200 truncate">{c.path}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(c.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right detail */}
          <div className="lg:col-span-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-5">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`font-mono font-bold text-xs px-2.5 py-1 rounded border ${methodBadge(selected.method)}`}
                    >
                      {selected.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-white break-all">{selected.path}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{new Date(selected.createdAt).toLocaleString('pt-BR')}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOne(selected.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      title="Excluir captura"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Query Params */}
                {selected.query && Object.keys(selected.query).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Query Parameters</h3>
                    <div className="rounded-xl border border-[var(--border)] bg-black/40 p-3 font-mono text-xs space-y-1">
                      {Object.entries(selected.query).map(([k, v]) => (
                        <div key={k} className="flex gap-2 break-all">
                          <span className="text-purple-400 font-semibold">{k}:</span>
                          <span className="text-zinc-300">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" /> Payload (Body)
                  </h3>
                  <pre className="rounded-xl border border-[var(--border)] bg-black/60 p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-72">
                    {selected.body || '(Corpo vazio)'}
                  </pre>
                </div>

                {/* Headers */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Headers HTTP ({Object.keys(selected.headers || {}).length})
                  </h3>
                  <div className="rounded-xl border border-[var(--border)] bg-black/40 divide-y divide-zinc-800/80 max-h-60 overflow-y-auto">
                    {Object.entries(selected.headers || {}).map(([k, v]) => (
                      <div key={k} className="px-3 py-2 text-xs font-mono grid grid-cols-12 gap-2">
                        <span className="col-span-4 text-blue-300 truncate" title={k}>
                          {k}
                        </span>
                        <span className="col-span-8 text-zinc-300 break-all">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-10">Selecione uma captura à esquerda para inspecionar.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
