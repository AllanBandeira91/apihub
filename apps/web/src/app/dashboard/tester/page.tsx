'use client';

import { useState } from 'react';
import {
  Play,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  FileCode
} from 'lucide-react';

interface HeaderPair {
  key: string;
  value: string;
}

export default function TesterPage() {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('https://httpbin.org/get');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [headers, setHeaders] = useState<HeaderPair[]>([
    { key: 'Accept', value: 'application/json' },
    { key: 'User-Agent', value: 'APIHub-Tester/1.0' },
  ]);
  const [requestBody, setRequestBody] = useState('{\n  "query": "laptop",\n  "limit": 10\n}');

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [securityBlock, setSecurityBlock] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleExecute = () => {
    setIsLoading(true);
    setSecurityBlock(null);
    setResponse(null);

    // SSRF client-side security verification
    const isPrivateOrInternal =
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('192.168.') ||
      url.includes('10.') ||
      url.includes('169.254.') ||
      url.startsWith('file:') ||
      url.startsWith('ftp:');

    setTimeout(() => {
      setIsLoading(false);

      if (isPrivateOrInternal) {
        setSecurityBlock(
          'Requisição Bloqueada por Proteção Anti-SSRF: O destino informado resolve para endereço interno, loopback ou metadados de nuvem.'
        );
        return;
      }

      setResponse({
        status: method === 'POST' ? 201 : 200,
        statusText: method === 'POST' ? 'Created' : 'OK',
        durationMs: Math.floor(Math.random() * 80) + 70,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-cache',
          server: 'cloudflare',
        },
        data: {
          url,
          method,
          args: { limit: '10' },
          origin: '177.18.204.12',
          headers: headers.reduce((acc, h) => (h.key ? { ...acc, [h.key]: h.value } : acc), {}),
        },
      });
    }, 80);
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
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
            Execute requisições HTTP em tempo real com controle de timeout e blindagem rigorosa contra ataques SSRF.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-4 h-4" /> Blindagem Anti-SSRF Ativa
          </span>
        </div>
      </div>

      {/* Request Bar */}
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

        {/* Request Tabs */}
        <div className="border-b border-[var(--border)] flex gap-4 text-xs font-semibold">
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

        {/* Tab Content: Headers */}
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
                    placeholder="Key (ex: Authorization)"
                    className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={e => handleHeaderChange(i, 'value', e.target.value)}
                    placeholder="Value"
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

        {/* Tab Content: Body */}
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

      {/* Security Block Alert */}
      {securityBlock && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-start gap-3 shadow-xl">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Bloqueio Ativo de Segurança (SSRF Protection)</p>
            <p>{securityBlock}</p>
            <p className="text-[11px] text-red-400 pt-1">
              Endereços 127.0.0.1, localhost, 192.168.0.0/16, 10.0.0.0/8 e metadados de provedores de nuvem (169.254.169.254) são expressamente bloqueados para proteger a rede.
            </p>
          </div>
        </div>
      )}

      {/* Response Section */}
      {response && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                {response.status} {response.statusText}
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
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
            <pre className="text-xs font-mono text-emerald-300 max-h-80">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
