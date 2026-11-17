'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Download, Code, Check, Copy, ExternalLink, ChevronRight, ChevronDown, Inbox, Plus } from 'lucide-react';
import { EndpointItem } from '../apis/page';

export default function DocsPage() {
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
  const [copied, setCopied] = useState(false);
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([]);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('apihub-endpoints');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEndpoints(parsed);
          if (parsed.length > 0) {
            setExpandedEndpoint(`${parsed[0].method}-${parsed[0].path}`);
          }
        }
      } catch {}
    }
    setIsLoaded(true);
  }, []);

  // Dynamically generate real OpenAPI 3.0.3 Spec
  const pathsObject: Record<string, any> = {};
  endpoints.forEach(ep => {
    const methodLower = ep.method.toLowerCase();
    if (!pathsObject[ep.path]) {
      pathsObject[ep.path] = {};
    }
    pathsObject[ep.path][methodLower] = {
      summary: ep.summary,
      tags: ep.tags,
      description: `Operação ${ep.method} para o recurso ${ep.path} gerenciado pelo APIHub.`,
      responses: {
        '200': {
          description: 'Operação executada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
      },
    };
  });

  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'APIHub - Documentação Unificada',
      version: '1.0.0',
      description: 'Especificação OpenAPI 3.0 gerada dinamicamente pelo catálogo de APIs do APIHub.',
    },
    paths: pathsObject,
  };

  const jsonString = JSON.stringify(openApiSpec, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apihub-openapi-spec.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Documentação OpenAPI 3.0</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visualizador interativo e exportação em JSON compatível com Swagger, Postman e Insomnia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[var(--border)] p-1 bg-black/40">
            <button
              onClick={() => setViewMode('ui')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'ui' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Visualização UI
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> JSON Spec
            </button>
          </div>

          {endpoints.length > 0 && (
            <>
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Baixar .json
              </button>
            </>
          )}
        </div>
      </div>

      {isLoaded && endpoints.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-white">Nenhum endpoint documentado</h3>
            <p className="text-xs text-zinc-400">
              A documentação e a especificação OpenAPI 3.0 são geradas automaticamente a partir dos endpoints cadastrados.
            </p>
          </div>
          <Link
            href="/dashboard/apis"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar Endpoints no Catálogo
          </Link>
        </div>
      ) : viewMode === 'json' ? (
        <div className="rounded-xl border border-[var(--border)] bg-black/80 p-4 font-mono text-xs overflow-x-auto text-zinc-300 shadow-2xl">
          <pre>{jsonString}</pre>
        </div>
      ) : (
        <div className="space-y-4">
          {endpoints.map(ep => {
            const key = `${ep.method}-${ep.path}`;
            const isExpanded = expandedEndpoint === key;

            return (
              <div
                key={ep.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setExpandedEndpoint(isExpanded ? null : key)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-black/20 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold px-2.5 py-1 rounded text-xs ${
                        ep.method === 'GET'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : ep.method === 'POST'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : ep.method === 'PUT' || ep.method === 'PATCH'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-sm text-zinc-100">{ep.path}</span>
                      <p className="text-xs text-zinc-400 mt-0.5">{ep.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {ep.apiName}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-[var(--border)] bg-black/30 space-y-4 text-xs">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-zinc-300">Descrição Técnica:</h4>
                      <p className="text-zinc-400">
                        {ep.summary}. Este endpoint está registrado sob o serviço <strong>{ep.apiName}</strong> e protegido pelas regras de segurança de tráfego do APIHub.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        href={`/dashboard/tester?url=${encodeURIComponent(ep.path)}&method=${ep.method}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        Abrir no Tester
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
