'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Download, Code, Check, Copy, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react';

interface DocEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tag: string;
  parameters: { name: string; in: string; required: boolean; description: string }[];
  responses: { code: number; description: string; example: any }[];
}

export default function DocsPage() {
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
  const [copied, setCopied] = useState(false);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>('GET-/v1/users');

  const initialDocs: DocEndpoint[] = [
    {
      method: 'GET',
      path: '/v1/users',
      summary: 'Lista usuários cadastrados',
      description: 'Retorna a listagem paginada de todos os usuários com filtros opcionais por status.',
      tag: 'Usuários',
      parameters: [
        { name: 'page', in: 'query', required: false, description: 'Número da página (padrão 1)' },
        { name: 'limit', in: 'query', required: false, description: 'Quantidade de registros por página (máx 100)' },
      ],
      responses: [
        {
          code: 200,
          description: 'Lista de usuários recuperada com sucesso',
          example: {
            success: true,
            data: [
              { id: 'usr_8123', name: 'Allan Silva', email: 'allan@apihub.dev', createdAt: '2026-11-17T03:00:00Z' }
            ],
            pagination: { page: 1, limit: 10, total: 1 }
          }
        }
      ]
    },
    {
      method: 'POST',
      path: '/v1/users',
      summary: 'Cria um novo usuário',
      description: 'Cadastra uma nova conta na plataforma e gera o workspace pessoal associado.',
      tag: 'Usuários',
      parameters: [
        { name: 'Content-Type', in: 'header', required: true, description: 'application/json' }
      ],
      responses: [
        {
          code: 201,
          description: 'Usuário criado com sucesso',
          example: {
            success: true,
            data: { id: 'usr_9912', name: 'Novo Desenvolvedor', email: 'dev@apihub.dev' }
          }
        }
      ]
    },
    {
      method: 'GET',
      path: '/v1/products',
      summary: 'Catálogo de produtos',
      description: 'Retorna os produtos disponíveis para venda no catálogo.',
      tag: 'Catálogo',
      parameters: [
        { name: 'category', in: 'query', required: false, description: 'Filtrar por slug da categoria' }
      ],
      responses: [
        {
          code: 200,
          description: 'Produtos listados com sucesso',
          example: {
            success: true,
            products: [{ id: 'prod_1', title: 'Teclado Mecânico RGB', price: 299.90 }]
          }
        }
      ]
    }
  ];

  const [docEndpoints, setDocEndpoints] = useState<DocEndpoint[]>(initialDocs);

  useEffect(() => {
    const saved = localStorage.getItem('apihub-endpoints');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: DocEndpoint[] = parsed.map((ep: any) => ({
            method: ep.method,
            path: ep.path,
            summary: ep.summary || `Endpoint ${ep.path}`,
            description: `Documentação do endpoint ${ep.method} ${ep.path}`,
            tag: ep.tags?.[0] || 'Geral',
            parameters: [
              { name: 'Authorization', in: 'header', required: false, description: 'Bearer token ou API Key' }
            ],
            responses: [
              {
                code: ep.method === 'POST' ? 201 : 200,
                description: 'Operação executada com sucesso',
                example: { success: true, message: `Resposta do endpoint ${ep.path}` }
              }
            ]
          }));
          setDocEndpoints(mapped);
          if (mapped[0]) {
            setExpandedEndpoint(`${mapped[0].method}-${mapped[0].path}`);
          }
        }
      } catch {}
    }
  }, []);

  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'APIHub Managed APIs',
      description: 'Especificação OpenAPI gerada automaticamente pelo APIHub',
      version: '1.0.0',
    },
    servers: [{ url: 'https://api.apihub.dev/v1', description: 'Servidor Principal' }],
    paths: docEndpoints.reduce((acc, ep) => {
      const method = ep.method.toLowerCase();
      if (!acc[ep.path]) acc[ep.path] = {};
      acc[ep.path][method] = {
        summary: ep.summary,
        description: ep.description,
        tags: [ep.tag],
        parameters: ep.parameters.map(p => ({
          name: p.name,
          in: p.in,
          required: p.required,
          description: p.description,
          schema: { type: 'string' }
        })),
        responses: ep.responses.reduce((rAcc, r) => ({
          ...rAcc,
          [r.code]: {
            description: r.description,
            content: { 'application/json': { example: r.example } }
          }
        }), {})
      };
      return acc;
    }, {} as any)
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(openApiSpec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSpec = () => {
    const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi-apihub.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Documentação OpenAPI</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Visualizador interativo gerado em tempo real conforme as especificações OpenAPI 3.0.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--border)] bg-black/40 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('ui')}
              className={`px-3 py-1.5 rounded-md transition ${viewMode === 'ui' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Navegador
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1.5 rounded-md transition ${viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              JSON OpenAPI
            </button>
          </div>

          <button
            onClick={handleCopySpec}
            className="border border-[var(--border)] bg-[var(--card)] hover:opacity-80 p-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-zinc-300"
            title="Copiar JSON"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownloadSpec}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" /> Exportar JSON
          </button>
        </div>
      </div>

      {viewMode === 'json' ? (
        <div className="rounded-xl border border-[var(--border)] bg-black/70 p-5 shadow-2xl">
          <pre className="text-xs font-mono text-emerald-400 overflow-x-auto max-h-[600px]">
            {JSON.stringify(openApiSpec, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-4">
          {docEndpoints.map(ep => {
            const key = `${ep.method}-${ep.path}`;
            const isExpanded = expandedEndpoint === key;

            return (
              <div
                key={key}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-lg transition"
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
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono font-bold text-sm text-zinc-100">{ep.path}</span>
                    <span className="text-xs text-zinc-400 hidden sm:inline">• {ep.summary}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {ep.tag}
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-[var(--border)] bg-black/30 space-y-5 text-xs">
                    <p className="text-zinc-300">{ep.description}</p>

                    {/* Parameters */}
                    {ep.parameters.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-zinc-200">Parâmetros</h4>
                        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-black/40 text-zinc-400 border-b border-[var(--border)]">
                              <tr>
                                <th className="p-2.5 font-semibold">Nome</th>
                                <th className="p-2.5 font-semibold">Tipo / Origem</th>
                                <th className="p-2.5 font-semibold">Obrigatório</th>
                                <th className="p-2.5 font-semibold">Descrição</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] font-mono text-[11px]">
                              {ep.parameters.map(p => (
                                <tr key={p.name}>
                                  <td className="p-2.5 text-zinc-200 font-bold">{p.name}</td>
                                  <td className="p-2.5 text-zinc-400">{p.in}</td>
                                  <td className="p-2.5">{p.required ? <span className="text-rose-400 font-bold">Sim</span> : <span className="text-zinc-500">Não</span>}</td>
                                  <td className="p-2.5 text-zinc-300 font-sans">{p.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Responses */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-zinc-200">Respostas de Exemplo (Responses)</h4>
                      {ep.responses.map(r => (
                        <div key={r.code} className="rounded-lg border border-[var(--border)] bg-black/50 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 text-[11px]">
                              {r.code}
                            </span>
                            <span className="text-zinc-300 text-xs">{r.description}</span>
                          </div>
                          <pre className="text-[11px] font-mono text-zinc-300 bg-black/60 p-2.5 rounded border border-zinc-900 overflow-x-auto">
                            {JSON.stringify(r.example, null, 2)}
                          </pre>
                        </div>
                      ))}
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
