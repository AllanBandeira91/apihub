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
  AlertCircle
} from 'lucide-react';

interface HeaderPair {
  key: string;
  value: string;
}

interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

export default function TesterPage() {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('https://httpbin.org/get');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [headers, setHeaders] = useState<HeaderPair[]>([
    { key: 'Accept', value: 'application/json' },
  ]);
  const [requestBody, setRequestBody] = useState('{\n  "name": "Novo Produto",\n  "price": 99.9\n}');

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [securityBlock, setSecurityBlock] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('apihub-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveToHistory = (item: HistoryItem) => {
    const updated = [item, ...history.slice(0, 19)];
    setHistory(updated);
    localStorage.setItem('apihub-history', JSON.stringify(updated));
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
    setIsLoading(true);
    setSecurityBlock(null);
    setErrorMessage(null);
    setResponse(null);

    // 1. SSRF Client-side Security Validation
    const isPrivateOrInternal =
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('192.168.') ||
      url.includes('10.') ||
      url.includes('172.16.') ||
      url.includes('169.254.') ||
      url.startsWith('file:') ||
      url.startsWith('ftp:');

    if (isPrivateOrInternal) {
      setIsLoading(false);
      setSecurityBlock(
        'Requisição Bloqueada por Proteção Anti-SSRF: O destino informado resolve para endereço interno, loopback ou metadados de nuvem.'
      );
      return;
    }

    // 2. Prepare real headers
    const headerObj: Record<string, string> = {};
    headers.forEach(h => {
      if (h.key.trim()) {
        headerObj[h.key.trim()] = h.value.trim();
      }
    });

    const startTime = performance.now();

    try {
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && requestBody;
      const res = await fetch(url, {
        method,
        headers: {
          ...headerObj,
          ...(hasBody && !headerObj['Content-Type'] && !headerObj['content-type']
            ? { 'Content-Type': 'application/json' }
            : {}),
        },
        body: hasBody ? requestBody : undefined,
      });

      const durationMs = Math.round(performance.now() - startTime);
      const text = await res.text();
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch {
        parsedData = text;
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      const responsePayload = {
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? 'OK' : 'Response'),
        durationMs,
        headers: resHeaders,
        data: parsedData,
      };

      setResponse(responsePayload);

      saveToHistory({
        id: Date.now().toString(),
        method,
        url,
        status: res.status,
        durationMs,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      setErrorMessage(
        err.message?.includes('Failed to fetch')
          ? 'Falha na requisição (Possível bloqueio de CORS pelo servidor de destino ou URL inacessível).'
          : err.message || 'Erro de rede ao disparar requisição.'
      );

      saveToHistory({
        id: Date.now().toString(),
        method,
        url,
        status: 0,
        durationMs,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">API Tester Seguro</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Execute requisições HTTP reais com medição exata de latência, headers e proteção ativa contra SSRF.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-4 h-4" /> Blindagem Anti-SSRF Ativa
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tester Box (2 Cols) */}
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
                placeholder="https://api.exemplo.com/v1/recurso"
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

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 text-xs text-zinc-400 pt-1">
              <span className="text-zinc-500">Exemplos reais:</span>
              <button
                onClick={() => {
                  setMethod('GET');
                  setUrl('https://httpbin.org/get');
                }}
                className="text-blue-400 hover:underline"
              >
                httpbin.org (GET)
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setMethod('GET');
                  setUrl('https://jsonplaceholder.typicode.com/posts/1');
                }}
                className="text-blue-400 hover:underline"
              >
                JSONPlaceholder (Post #1)
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setMethod('GET');
                  setUrl('http://127.0.0.1:8080/admin');
                }}
                className="text-red-400 hover:underline"
              >
                Bloqueio SSRF (127.0.0.1)
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
                Headers & Parâmetros
              </button>
              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <button
                  onClick={() => setActiveTab('body')}
                  className={`pb-2 border-b-2 transition ${
                    activeTab === 'body' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Corpo JSON (Body)
                </button>
              )}
            </div>

            {/* Tab: Headers */}
            {activeTab === 'params' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Cabeçalhos HTTP (Headers)</span>
                  <button
                    onClick={handleAddHeader}
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Cabeçalho
                  </button>
                </div>

                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={h.key}
                        onChange={e => handleHeaderChange(i, 'key', e.target.value)}
                        placeholder="Chave (ex: Authorization)"
                        className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={h.value}
                        onChange={e => handleHeaderChange(i, 'value', e.target.value)}
                        placeholder="Valor"
                        className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono"
                      />
                      <button
                        onClick={() => handleRemoveHeader(i)}
                        className="p-2 text-zinc-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Body */}
            {activeTab === 'body' && (
              <div className="pt-2">
                <textarea
                  rows={5}
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Security Alert */}
          {securityBlock && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-start gap-3 shadow-xl">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Bloqueio Ativo de Segurança (Anti-SSRF)</p>
                <p>{securityBlock}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-start gap-3 shadow-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Alerta de Comunicação</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Response Viewer */}
          {response && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold px-2.5 py-1 rounded border ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        : 'bg-red-950/80 text-red-300 border-red-700'
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-zinc-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" /> {response.durationMs} ms
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border)] text-zinc-400 hover:text-white transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Resposta'}</span>
                </button>
              </div>

              <div className="rounded-lg bg-black/60 border border-[var(--border)] p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-emerald-300 max-h-96">
                  {typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Request History */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" /> Histórico Recente
              </h2>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('apihub-history');
                  }}
                  className="text-[11px] text-zinc-500 hover:text-red-400 transition"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">
                  Nenhum teste executado ainda. Suas requisições aparecerão aqui em tempo real.
                </p>
              ) : (
                history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMethod(item.method as any);
                      setUrl(item.url);
                    }}
                    className="p-3 rounded-lg border border-[var(--border)] bg-black/30 hover:border-zinc-700 cursor-pointer transition space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[10px] text-blue-400">{item.method}</span>
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          item.status >= 200 && item.status < 300
                            ? 'text-emerald-400'
                            : item.status === 0
                            ? 'text-zinc-500'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.status === 0 ? 'ERR' : item.status}
                      </span>
                    </div>
                    <p className="font-mono text-zinc-300 truncate text-[11px]">{item.url}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                      <span>{item.durationMs}ms</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
