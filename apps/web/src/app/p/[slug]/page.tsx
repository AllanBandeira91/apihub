'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { api } from '../../../lib/api';
import { CodeSnippetBox } from '../../../components/CodeSnippetBox';
import { ThemeToggle } from '../../../components/ThemeToggle';

export default function PublicDocsPortalPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [doc, setDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.apis
      .getPublicDocs(slug)
      .then(data => {
        setDoc(data);
        if (data?.endpoints?.[0]?.id) {
          setExpandedId(data.endpoints[0].id);
        }
      })
      .catch(err => {
        setError(err?.message || 'Documentação pública não encontrada ou definida como privada.');
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const filteredEndpoints = (doc?.endpoints || []).filter((ep: any) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      ep.path.toLowerCase().includes(q) ||
      ep.summary.toLowerCase().includes(q) ||
      ep.method.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Public Bar */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              λ
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight truncate">CloudAPI Docs</span>
            <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-semibold items-center gap-1 flex-shrink-0">
              <Globe className="w-3 h-3" /> Público
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggle />
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-semibold transition"
            >
              Criar sua API
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Carregando documentação pública...</p>
          </div>
        ) : error || !doc ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">Documentação Indisponível</h1>
            <p className="text-xs text-zinc-400">{error}</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Voltar ao CloudAPI
            </Link>
          </div>
        ) : (
          <>
            {/* API Header */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{doc.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-800 text-blue-300 text-xs font-mono font-bold">
                  {doc.version}
                </span>
              </div>

              {doc.description && <p className="text-sm text-zinc-400 leading-relaxed">{doc.description}</p>}

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-black/50 border border-[var(--border)] font-mono text-zinc-300">
                  <span className="text-zinc-500 mr-2">Base URL:</span>
                  {doc.baseUrl}
                </div>
                <span className="text-zinc-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {doc.endpoints.length} endpoint(s)
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrar endpoints por caminho, método ou descrição..."
                className="w-full bg-black/40 border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Endpoints */}
            <div className="space-y-3">
              {filteredEndpoints.map((ep: any) => {
                const isExpanded = expandedId === ep.id;
                const fullUrl = `${(doc.baseUrl || '').replace(/\/$/, '')}${ep.path}`;

                return (
                  <div
                    key={ep.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-black/20 transition"
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
                          <p className="font-mono font-bold text-sm text-zinc-100 break-all">{ep.path}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{ep.summary}</p>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-5 border-t border-[var(--border)] bg-black/30 space-y-5 text-xs">
                        {ep.description && <p className="text-zinc-300 leading-relaxed">{ep.description}</p>}

                        {ep.parameters && ep.parameters.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="font-bold text-zinc-200 uppercase text-[11px] tracking-wider">Parâmetros</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ep.parameters.map((p: any) => (
                                <div key={p.id} className="p-3 rounded-lg bg-black/50 border border-[var(--border)]">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-blue-300">{p.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                                      {p.in}
                                    </span>
                                    {p.required && <span className="text-[10px] text-rose-400 font-semibold">obrigatório</span>}
                                  </div>
                                  {p.description && <p className="text-[11px] text-zinc-400 mt-1">{p.description}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ep.requestBody && (
                          <div className="space-y-2">
                            <h3 className="font-bold text-zinc-200 uppercase text-[11px] tracking-wider">
                              Corpo da Requisição (JSON)
                            </h3>
                            <pre className="p-3 rounded-lg bg-black/60 border border-[var(--border)] font-mono text-emerald-300 overflow-x-auto">
                              {ep.requestBody}
                            </pre>
                          </div>
                        )}

                        {ep.responseExamples && ep.responseExamples.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="font-bold text-zinc-200 uppercase text-[11px] tracking-wider">
                              Respostas Esperadas
                            </h3>
                            <div className="space-y-2">
                              {ep.responseExamples.map((r: any) => (
                                <div key={r.id} className="p-3 rounded-lg bg-black/50 border border-[var(--border)] space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                        r.statusCode >= 200 && r.statusCode < 300
                                          ? 'bg-emerald-950 text-emerald-400'
                                          : 'bg-rose-950 text-rose-400'
                                      }`}
                                    >
                                      HTTP {r.statusCode}
                                    </span>
                                    <span className="text-zinc-400">{r.description}</span>
                                  </div>
                                  {r.body && (
                                    <pre className="p-2.5 rounded bg-black/60 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                                      {r.body}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <CodeSnippetBox
                          title="Copiar Requisição"
                          request={{
                            method: ep.method,
                            url: fullUrl,
                            headers: { Accept: 'application/json' },
                            body: ep.requestBody || undefined,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-zinc-500">
        Documentação publicada via{' '}
        <Link href="/" className="text-blue-400 hover:underline font-semibold inline-flex items-center gap-1">
          CloudAPI <ExternalLink className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
}
