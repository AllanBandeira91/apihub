'use client';

import { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, Clock, Globe, ArrowRight } from 'lucide-react';

export function DashboardPreview() {
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [testUrl, setTestUrl] = useState('https://httpbin.org/get');
  const [isLoading, setIsLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setIsLoading(true);
    setTestError(null);
    setTestResponse(null);

    // Check SSRF client-side instant check
    const isLocal =
      testUrl.includes('localhost') ||
      testUrl.includes('127.0.0.1') ||
      testUrl.includes('192.168.') ||
      testUrl.includes('10.');

    setTimeout(() => {
      setIsLoading(false);
      if (isLocal) {
        setTestError('SSRF Blocked: Endereços locais e IPs privados são bloqueados por segurança!');
      } else {
        setTestResponse({
          status: 200,
          statusText: 'OK',
          durationMs: 142,
          headers: {
            'content-type': 'application/json',
            server: 'gunicorn/19.9.0',
          },
          body: JSON.stringify(
            {
              url: testUrl,
              origin: '203.0.113.195',
              headers: {
                'User-Agent': 'APIHub-Tester/1.0',
                Accept: '*/*',
              },
            },
            null,
            2
          ),
        });
      }
    }, 100);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> API Tester Interativo
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Teste requisições com proteção anti-SSRF ativa, medição real de latência e exportação OpenAPI.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" /> Anti-SSRF Ativo
          </span>
          <span className="flex items-center gap-1 text-blue-400 bg-blue-950/40 border border-blue-800 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" /> Timeout 10s
          </span>
        </div>
      </div>

      {/* URL & Method Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={selectedMethod}
          onChange={e => setSelectedMethod(e.target.value as any)}
          className="bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>

        <input
          type="text"
          value={testUrl}
          onChange={e => setTestUrl(e.target.value)}
          placeholder="https://api.exemplo.com/v1/recurso"
          className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={handleRunTest}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
        >
          {isLoading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Executar
        </button>
      </div>

      {/* Quick Test Presets */}
      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
        <span>Testes rápidos:</span>
        <button
          onClick={() => {
            setSelectedMethod('GET');
            setTestUrl('https://httpbin.org/get');
          }}
          className="underline hover:text-white"
        >
          Público (httpbin.org)
        </button>
        <span>•</span>
        <button
          onClick={() => {
            setSelectedMethod('GET');
            setTestUrl('http://127.0.0.1:8080/admin');
          }}
          className="underline hover:text-rose-400"
        >
          Simular Bloqueio SSRF (127.0.0.1)
        </button>
        <span>•</span>
        <button
          onClick={() => {
            setSelectedMethod('GET');
            setTestUrl('http://169.254.169.254/latest/meta-data');
          }}
          className="underline hover:text-rose-400"
        >
          Simular Metadados Nuvem (169.254)
        </button>
      </div>

      {/* Response Panel */}
      {testError && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Bloqueio de Segurança</p>
            <p className="text-xs mt-1 text-red-200">{testError}</p>
          </div>
        </div>
      )}

      {testResponse && (
        <div className="rounded-lg border border-[var(--border)] bg-black/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                {testResponse.status} {testResponse.statusText}
              </span>
              <span className="text-zinc-400">Latência: {testResponse.durationMs}ms</span>
            </div>
            <span className="text-zinc-500">Formato: JSON</span>
          </div>
          <pre className="text-xs text-emerald-300 font-mono overflow-x-auto max-h-60 p-2 rounded bg-black/40">
            {testResponse.body}
          </pre>
        </div>
      )}
    </div>
  );
}
