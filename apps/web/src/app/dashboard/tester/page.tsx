'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  Plus,
  Trash2,
  History,
  RotateCcw,
  AlertCircle,
  Server
} from 'lucide-react';
import { api, RequestLogItem } from '../../../lib/api';
import { CodeSnippetBox } from '../../../components/CodeSnippetBox';

interface HeaderPair {
  key: string;
  value: string;
}

export default function TesterPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'params' | 'body' | 'code'>('params');
  const [headers, setHeaders] = useState<HeaderPair[]>([
    { key: 'Accept', value: 'application/json' },
  ]);
  const [requestBody, setRequestBody] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    durationMs: number;
    headers: Record<string, string>;
    data: any;
  } | null>(null);
  const [securityBlock, setSecurityBlock] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<RequestLogItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qUrl = params.get('url');
      const qMethod = params.get('method');
      if (qUrl) setUrl(qUrl);
      if (qMethod && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(qMethod)) {
        setMethod(qMethod as any);
      }
    }

    api.workspaces
      .bootstrap()
      .then(async boot => {
        setProjectId(boot.project.id);
        const logs = await api.tester.logs(boot.project.id, 25);
        setHistory(logs);
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  }, []);

  const buildHeaderMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    headers.forEach(h => {
      const cleanKey = h.key.replace(/[\r\n\0]/g, '').trim();
      const cleanVal = h.value.replace(/[\r\n\0]/g, '').trim();
      if (cleanKey) map[cleanKey] = cleanVal;
    });
    return map;
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...headers];
    updated[index][field] = val;
    setHeaders(updated);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleExecute = async () => {
    setSecurityBlock(null);
    setErrorMessage(null);
    setResponse(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorMessage('Por favor, informe a URL completa da API (ex: https://api.seudominio.com/v1/recurso).');
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setErrorMessage('A URL deve começar com http:// ou https://');
      return;
    }

    if (!projectId) {
      setErrorMessage('Workspace ainda carregando. Aguarde um instante e tente novamente.');
      return;
    }

    setIsLoading(true);

    try {
      const headerObj = buildHeaderMap();
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim().length > 0;

      // Execute via Backend Proxy (Zero CORS + Real Server-Side DNS Anti-SSRF + Supabase RequestLog)
      const res = await api.tester.execute(projectId, {
        method,
        url: trimmedUrl,
        headers: headerObj,
        body: hasBody ? requestBody : undefined,
      });

      if (res.error) {
        setErrorMessage(`Erro na requisição remota: ${res.error}`);
      }

      let parsedData: any = res.body;
      try {
        parsedData = JSON.parse(res.body);
      } catch {}

      setResponse({
        status: res.statusCode,
        durationMs: res.durationMs,
        headers: res.headers || {},
        data: parsedData,
      });

      // Refresh logs from Supabase
      const updatedLogs = await api.tester.logs(projectId, 25);
      setHistory(updatedLogs);
    } catch (err: any) {
      const msg = err?.message || 'Erro ao executar requisição pelo servidor.';
      if (msg.toLowerCase().includes('ssrf') || msg.toLowerCase().includes('private') || msg.toLowerCase().includes('blocked')) {
        setSecurityBlock(msg);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!projectId) return;
    try {
      await api.tester.clearLogs(projectId);
      setHistory([]);
    } catch {}
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">API Tester Seguro</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Disparo real via Proxy do Servidor (sem bloqueios de CORS), blindagem anti-SSRF via DNS e logs no Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-800">
            <Server className="w-4 h-4" /> Proxy Backend (Sem CORS)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-4 h-4" /> Anti-SSRF Real (DNS)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tester Box */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                className="bg-black/50 border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleExecute()}
                placeholder="https://api.seusistema.com/v1/recurso"
                className="flex-1 bg-black/50 border border-[var(--border)] rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/20"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Executar
              </button>
            </div>

            {/* Request Tabs */}
            <div className="border-b border-[var(--border)] flex gap-4 text-xs font-semibold pt-2">
              <button
                onClick={() => setActiveTab('params')}
                className={`pb-2 border-b-2 transition ${
                  activeTab === 'params' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Headers
              </button>
              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <button
                  onClick={() => setActiveTab('body')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'body' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Body (JSON)
                </button>
              )}
              <button
                onClick={() => setActiveTab('code')}
                className={`pb-2 border-b-2 transition ${
                  activeTab === 'code' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Código (cURL / fetch / Python)
              </button>
            </div>

            {/* Headers Tab */}
            {activeTab === 'params' && (
              <div className="space-y-2">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={h.key}
                      onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
                      placeholder="Header (ex: Authorization)"
                      className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
                      placeholder="Valor"
                      className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveHeader(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddHeader}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Header
                </button>
              </div>
            )}

            {/* Body Tab */}
            {activeTab === 'body' && (
              <textarea
                rows={7}
                value={requestBody}
                onChange={e => setRequestBody(e.target.value)}
                placeholder='{"chave": "valor"}'
                className="w-full bg-black/50 border border-[var(--border)] rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            )}

            {/* Code Generator Tab */}
            {activeTab === 'code' && (
              <CodeSnippetBox
                request={{
                  method,
                  url: url.trim(),
                  headers: buildHeaderMap(),
                  body: requestBody,
                }}
              />
            )}
          </div>

          {/* Security Block Banner */}
          {securityBlock && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-red-300">Bloqueio de Segurança Anti-SSRF (Servidor)</p>
                <p>{securityBlock}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800 text-amber-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Response Viewer */}
          {response && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold px-2.5 py-0.5 rounded border ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        : response.status >= 400 || response.status === 0
                        ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                        : 'bg-amber-950/60 text-amber-400 border-amber-800'
                    }`}
                  >
                    HTTP {response.status || 'ERR'}
                  </span>
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {response.durationMs} ms
                  </span>
                </div>

                <button
                  onClick={handleCopyResponse}
                  className="px-2.5 py-1 rounded border border-[var(--border)] bg-black/40 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Resposta'}
                </button>
              </div>

              <pre className="bg-black/60 border border-[var(--border)] rounded-lg p-3 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96">
                {typeof response.data === 'string'
                  ? response.data || '(Resposta vazia)'
                  : JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Real Supabase History Sidebar */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" /> Histórico na Nuvem
            </h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          {isLoadingHistory ? (
            <p className="text-xs text-zinc-500 text-center py-6">Carregando histórico...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">
              Nenhuma requisição executada ainda.
            </p>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMethod(item.method as any);
                    setUrl(item.url);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-[var(--border)] bg-black/30 hover:border-zinc-700 transition space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-blue-400">{item.method}</span>
                    <span
                      className={`font-mono font-bold ${
                        item.statusCode >= 200 && item.statusCode < 300
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.statusCode || 'ERR'} • {item.durationMs}ms
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-300 truncate">{item.url}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
