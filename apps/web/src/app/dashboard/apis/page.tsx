'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Terminal,
  Trash2,
  X,
  Inbox,
  Upload,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { api, EndpointItem } from '../../../lib/api';

export type { EndpointItem };

export default function ApisPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');

  // Create Endpoint Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMethod, setNewMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [newPath, setNewPath] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newApiName, setNewApiName] = useState('API Principal');
  const [newBaseUrl, setNewBaseUrl] = useState('');

  // Import OpenAPI / Swagger JSON Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const boot = await api.workspaces.bootstrap();
      setProjectId(boot.project.id);
      const list = await api.endpoints.list(boot.project.id);
      setEndpoints(list);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar endpoints do Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath || !projectId) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const created = await api.endpoints.quickCreate(projectId, {
        method: newMethod,
        path: newPath.trim(),
        summary: newSummary.trim() || `Endpoint ${newPath.trim()}`,
        tags: newTag.trim() ? [newTag.trim()] : ['Geral'],
        apiName: newApiName.trim() || 'API Principal',
        baseUrl: newBaseUrl.trim() || undefined,
      });

      setEndpoints(prev => [created, ...prev]);
      setIsModalOpen(false);
      setNewPath('');
      setNewSummary('');
      setNewTag('');
      setNewBaseUrl('');
      setSuccessMsg('Endpoint salvo no Supabase com sucesso!');
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar endpoint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await api.endpoints.delete(id);
      setEndpoints(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir endpoint.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportJsonText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleImportOpenApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !importJsonText.trim()) return;

    setIsImporting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let parsedSpec;
      try {
        parsedSpec = JSON.parse(importJsonText);
      } catch {
        throw new Error('O conteúdo informado não é um JSON válido. Verifique a sintaxe do arquivo OpenAPI/Swagger.');
      }

      const res = await api.endpoints.importOpenApi(projectId, parsedSpec);
      const updatedList = await api.endpoints.list(projectId);
      setEndpoints(updatedList);
      setIsImportModalOpen(false);
      setImportJsonText('');
      setSuccessMsg(`${res.importedCount} endpoint(s) importado(s) com sucesso para "${res.api.name}"!`);
    } catch (err: any) {
      setError(err?.message || 'Falha ao importar especificação OpenAPI.');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesSearch =
      ep.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.apiName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = selectedMethod === 'ALL' || ep.method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const buildTesterUrl = (ep: EndpointItem) => {
    const base = ep.baseUrl && !ep.baseUrl.includes('exemplo.com') ? ep.baseUrl.replace(/\/$/, '') : '';
    const fullTarget = base ? `${base}${ep.path}` : ep.path;
    return `/dashboard/tester?url=${encodeURIComponent(fullTarget)}&method=${ep.method}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Catálogo de APIs & Endpoints</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Cadastre rotas manualmente ou importe arquivos OpenAPI/Swagger JSON direto para o Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setError(null);
              setIsImportModalOpen(true);
            }}
            className="border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-zinc-200 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> Importar Swagger / OpenAPI
          </button>

          <button
            onClick={() => {
              setError(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Novo Endpoint
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por rota, descrição ou nome da API..."
            className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                selectedMethod === method
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[var(--card)] border-[var(--border)] text-zinc-400 hover:text-white'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Empty / List */}
      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Carregando endpoints da nuvem...</p>
        </div>
      ) : filteredEndpoints.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-white">Nenhum endpoint cadastrado</h3>
            <p className="text-xs text-zinc-400">
              {endpoints.length === 0
                ? 'Seu catálogo está limpo e sincronizado com o Supabase. Cadastre manualmente ou importe um Swagger/OpenAPI JSON.'
                : 'Nenhum endpoint corresponde aos filtros selecionados.'}
            </p>
          </div>
          {endpoints.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                <Plus className="w-4 h-4" /> Cadastrar Primeiro Endpoint
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="border border-[var(--border)] bg-black/40 hover:bg-zinc-800 text-zinc-200 px-5 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Importar Swagger JSON
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredEndpoints.map(ep => (
            <div
              key={ep.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-zinc-700 transition shadow-sm"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <span
                  className={`font-mono font-bold px-2.5 py-1 rounded-md text-xs flex-shrink-0 ${
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-zinc-100 break-all">{ep.path}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {ep.apiName}
                    </span>
                    {ep.tags?.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/40 text-blue-300 border border-blue-900/50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{ep.summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <Link
                  href={buildTesterUrl(ep)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-black/40 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-400" /> Testar
                </Link>

                <button
                  onClick={() => handleDelete(ep.id)}
                  title="Excluir endpoint"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Endpoint Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" /> Novo Endpoint
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Método HTTP</label>
                  <select
                    value={newMethod}
                    onChange={e => setNewMethod(e.target.value as any)}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Caminho da Rota</label>
                  <input
                    type="text"
                    required
                    value={newPath}
                    onChange={e => setNewPath(e.target.value)}
                    placeholder="/v1/recurso"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Descrição / Resumo</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Ex: Retorna listagem paginada de clientes"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">URL Base da API (Opcional)</label>
                <input
                  type="url"
                  value={newBaseUrl}
                  onChange={e => setNewBaseUrl(e.target.value)}
                  placeholder="https://api.seusistema.com"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Nome da API</label>
                  <input
                    type="text"
                    value={newApiName}
                    onChange={e => setNewApiName(e.target.value)}
                    placeholder="API Principal"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Tag / Módulo</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Ex: Clientes"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import OpenAPI / Swagger JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" /> Importar OpenAPI 3.0 / Swagger 2.0 (JSON)
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportOpenApi} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Selecionar arquivo `.json` (ou colar abaixo)
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Conteúdo JSON OpenAPI / Swagger</label>
                <textarea
                  rows={10}
                  required
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder='{"openapi": "3.0.3", "info": {"title": "Minha API", "version": "1.0.0"}, "paths": { ... }}'
                  className="w-full bg-black/60 border border-[var(--border)] rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importJsonText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-600/20"
                >
                  {isImporting ? 'Importando...' : 'Importar Endpoints para o Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
