'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Code, Check, Copy, ChevronRight, ChevronDown, Inbox, Plus, AlertCircle } from 'lucide-react';
import { api, EndpointItem } from '../../../lib/api';
import { CodeSnippetBox } from '../../../components/CodeSnippetBox';

export default function DocsPage() {
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
  const [copied, setCopied] = useState(false);
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([]);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.workspaces
      .bootstrap()
      .then(boot => api.endpoints.list(boot.project.id))
      .then(list => {
        setEndpoints(list);
        if (list.length > 0) {
          setExpandedEndpoint(list[0].id);
        }
      })
      .catch(err => setError(err?.message || 'Erro ao carregar endpoints do Supabase.'))
      .finally(() => setIsLoading(false));
  }, []);

  // Dynamically generate real OpenAPI 3.0.3 Spec from Supabase endpoints
  const pathsObject: Record<string, any> = {};
  endpoints.forEach(ep => {
    const methodLower = ep.method.toLowerCase();
    if (!pathsObject[ep.path]) {
      pathsObject[ep.path] = {};
    }
    pathsObject[ep.path][methodLower] = {
      summary: ep.summary,
      tags: ep.tags,
      description: ep.description || `Operação ${ep.method} para o recurso ${ep.path} (${ep.apiName}).`,
      parameters: (ep.parameters || []).map(p => ({
        name: p.name,
        in: p.in,
        required: p.required,
        description: p.description || undefined,
        schema: { type: 'string', example: p.example || undefined },
      })),
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
      title: 'CloudAPI — Especificação OpenAPI',
      version: '1.0.0',
      description: 'Documentação gerada dinamicamente a partir das rotas sincronizadas no Supabase.',
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
    a.download = `cloudapi-openapi-spec.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPostman = () => {
    const postmanCollection = {
      info: {
        name: 'CloudAPI — Coleção Exportada',
        description: 'Coleção Postman v2.1 gerada automaticamente pelo CloudAPI.',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: endpoints.map(ep => {
        const full = resolveFullUrl(ep);
        return {
          name: ep.summary || `${ep.method} ${ep.path}`,
          request: {
            method: ep.method,
            header: [{ key: 'Accept', value: 'application/json', type: 'text' }],
            body: ep.requestBody
              ? { mode: 'raw', raw: ep.requestBody, options: { raw: { language: 'json' } } }
              : undefined,
            url: {
              raw: full,
              path: ep.path.replace(/^\//, '').split('/'),
            },
            description: ep.description || undefined,
          },
        };
      }),
    };
    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloudapi-postman-v2.1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const lines: string[] = [
      '# Documentação da API — CloudAPI',
      '',
      `Gerado automaticamente em ${new Date().toLocaleString('pt-BR')} com ${endpoints.length} endpoint(s).`,
      '',
    ];
    for (const ep of endpoints) {
      const full = resolveFullUrl(ep);
      lines.push(`## \`${ep.method}\` ${ep.path}`);
      lines.push('');
      lines.push(`**Resumo:** ${ep.summary}  `);
      lines.push(`**API:** ${ep.apiName}  `);
      lines.push(`**URL:** \`${full}\``);
      if (ep.description) {
        lines.push('', ep.description);
      }
      if (ep.parameters && ep.parameters.length > 0) {
        lines.push('', '### Parâmetros', '', '| Nome | Local | Obrigatório | Descrição |', '| --- | --- | --- | --- |');
        for (const p of ep.parameters) {
          lines.push(`| \`${p.name}\` | ${p.in} | ${p.required ? 'Sim' : 'Não'} | ${p.description || '-'} |`);
        }
      }
      if (ep.requestBody) {
        lines.push('', '### Corpo da Requisição', '', '```json', ep.requestBody, '```');
      }
      lines.push('', '### Exemplo cURL', '', '```bash', `curl -X ${ep.method} "${full}" -H "Accept: application/json"`, '```', '', '---', '');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'API_DOCS.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolveFullUrl = (ep: EndpointItem) => {
    const base = ep.baseUrl ? ep.baseUrl.replace(/\/$/, '') : 'https://api.seusistema.com';
    return `${base}${ep.path}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Documentação OpenAPI 3.0</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visualizador interativo com gerador automático de `cURL`, `fetch` e `Python`, sincronizado com o Supabase.
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
            <div className="flex flex-wrap items-center gap-2">
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
                <Download className="w-3.5 h-3.5" /> OpenAPI (.json)
              </button>

              <button
                onClick={handleDownloadPostman}
                className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Postman v2.1
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" /> Markdown (.md)
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Gerando documentação a partir do banco...</p>
        </div>
      ) : endpoints.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-white">Nenhum endpoint documentado</h3>
            <p className="text-xs text-zinc-400">
              Cadastre manualmente ou importe um Swagger/OpenAPI JSON na aba APIs & Endpoints para gerar a documentação automaticamente.
            </p>
          </div>
          <Link
            href="/dashboard/apis"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar ou Importar Endpoints
          </Link>
        </div>
      ) : viewMode === 'json' ? (
        <div className="rounded-xl border border-[var(--border)] bg-black/80 p-4 font-mono text-xs overflow-x-auto text-zinc-300 shadow-2xl">
          <pre>{jsonString}</pre>
        </div>
      ) : (
        <div className="space-y-4">
          {endpoints.map(ep => {
            const isExpanded = expandedEndpoint === ep.id;
            const fullUrl = resolveFullUrl(ep);

            return (
              <div
                key={ep.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setExpandedEndpoint(isExpanded ? null : ep.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-black/20 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-mono font-bold px-2.5 py-1 rounded text-xs flex-shrink-0 ${
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
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-sm text-zinc-100 break-all">{ep.path}</span>
                      <p className="text-xs text-zinc-400 mt-0.5">{ep.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
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
                    {ep.description && (
                      <div className="space-y-1">
                        <h4 className="font-semibold text-zinc-300">Descrição:</h4>
                        <p className="text-zinc-400">{ep.description}</p>
                      </div>
                    )}

                    {ep.parameters && ep.parameters.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-zinc-300">Parâmetros:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ep.parameters.map(p => (
                            <div key={p.id} className="p-2.5 rounded-lg bg-black/40 border border-[var(--border)]">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-300">{p.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                                  {p.in}
                                </span>
                                {p.required && (
                                  <span className="text-[10px] text-rose-400 font-semibold">obrigatório</span>
                                )}
                              </div>
                              {p.description && <p className="text-[11px] text-zinc-400 mt-1">{p.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <CodeSnippetBox
                      title="Exemplo de Chamada"
                      request={{
                        method: ep.method,
                        url: fullUrl,
                        headers: { Accept: 'application/json' },
                      }}
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/dashboard/tester?url=${encodeURIComponent(fullUrl)}&method=${ep.method}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        Testar no API Tester
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
