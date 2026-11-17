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
  CheckCircle2,
  Pencil,
  Globe,
  Lock,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { api, API_BASE_URL, EndpointItem, ApiSummaryItem } from '../../../lib/api';

export type { EndpointItem };

export default function ApisPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [copiedMockId, setCopiedMockId] = useState<string | null>(null);
  const [apis, setApis] = useState<ApiSummaryItem[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

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

  // Edit Endpoint Modal (full editing: description, body, params, response examples)
  const [editingEp, setEditingEp] = useState<EndpointItem | null>(null);
  const [editMethod, setEditMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [editPath, setEditPath] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editReqBody, setEditReqBody] = useState('');
  const [editParams, setEditParams] = useState<
    { name: string; in: 'query' | 'path' | 'header'; required: boolean; description: string }[]
  >([]);
  const [editResponses, setEditResponses] = useState<
    { statusCode: number; description: string; body: string }[]
  >([]);
  const [savingEdit, setSavingEdit] = useState(false);

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
      setWorkspaceSlug(boot.workspace.slug);
      const [epList, apiList] = await Promise.all([
        api.endpoints.list(boot.project.id),
        api.apis.listByProject(boot.project.id),
      ]);
      setEndpoints(epList);
      setApis(apiList);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar endpoints do Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublic = async (apiItem: ApiSummaryItem) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await api.apis.setVisibility(apiItem.id, !apiItem.isPublic);
      setApis(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      setSuccessMsg(
        updated.isPublic
          ? `Portal público ativado para "${updated.name}" em /p/${updated.publicSlug}`
          : `"${updated.name}" voltou para modo privado.`
      );
    } catch (err: any) {
      setError(err?.message || 'Erro ao alterar visibilidade da API.');
    }
  };

  const handleCopyPublicLink = (slug: string) => {
    const fullLink = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

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
      const apiList = await api.apis.listByProject(projectId);
      setApis(apiList);
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

  const openEditModal = (ep: EndpointItem) => {
    setEditingEp(ep);
    setEditMethod(ep.method);
    setEditPath(ep.path);
    setEditSummary(ep.summary);
    setEditDesc(ep.description || '');
    setEditReqBody(ep.requestBody || '');
    setEditParams(
      (ep.parameters || []).map(p => ({
        name: p.name,
        in: p.in,
        required: p.required,
        description: p.description || '',
      }))
    );
    setEditResponses(
      (ep.responseExamples || []).map(r => ({
        statusCode: r.statusCode,
        description: r.description || '',
        body: r.body || '',
      }))
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEp) return;
    setSavingEdit(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await api.endpoints.updateFull(editingEp.id, {
        method: editMethod,
        path: editPath.trim(),
        summary: editSummary.trim(),
        description: editDesc.trim() || null,
        requestBody: editReqBody.trim() || null,
        parameters: editParams.filter(p => p.name.trim()),
        responseExamples: editResponses,
      });
      setEndpoints(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      setEditingEp(null);
      setSuccessMsg('Endpoint atualizado com sucesso no Supabase!');
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar endpoint.');
    } finally {
      setSavingEdit(false);
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
        throw new Error('O conteúdo informado não é um JSON válido.');
      }

      const res = await api.endpoints.importOpenApi(projectId, parsedSpec);
      await loadData();
      setIsImportModalOpen(false);
      setImportJsonText('');
      setSuccessMsg(`${res.importedCount} endpoint(s) importado(s) para "${res.api.name}"!`);
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
            Cadastre, edite, importe OpenAPI/Swagger JSON e publique portais de documentação compartilháveis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setError(null);
              setIsImportModalOpen(true);
            }}
            className="border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-zinc-200 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> Importar Swagger
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

      {/* Public Shareable Portal Cards */}
      {apis.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" /> Portais Públicos de Documentação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {apis.map(a => (
              <div
                key={a.id}
                className="p-3 rounded-lg border border-[var(--border)] bg-black/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-zinc-100 truncate">{a.name}</p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {a._count?.endpoints ?? 0} endpoint(s) •{' '}
                    {a.isPublic && a.publicSlug ? `/p/${a.publicSlug}` : 'Privada'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {a.isPublic && a.publicSlug && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyPublicLink(a.publicSlug!)}
                        className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1"
                        title="Copiar link público"
                      >
                        {copiedSlug === a.publicSlug ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <Link
                        href={`/p/${a.publicSlug}`}
                        target="_blank"
                        className="px-2.5 py-1 rounded-md border border-emerald-800 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950 flex items-center gap-1"
                        title="Abrir portal público"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTogglePublic(a)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition ${a.isPublic
                      ? 'bg-emerald-600/20 border-emerald-600/40 text-emerald-300 hover:bg-emerald-600/30'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                  >
                    {a.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {a.isPublic ? 'Pública' : 'Publicar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${selectedMethod === method
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
                ? 'Cadastre manualmente ou importe um Swagger/OpenAPI JSON.'
                : 'Nenhum endpoint corresponde aos filtros selecionados.'}
            </p>
          </div>
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
                  className={`font-mono font-bold px-2.5 py-1 rounded-md text-xs flex-shrink-0 ${ep.method === 'GET'
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
                    {ep.parametersCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/50 text-purple-300 border border-purple-900">
                        {ep.parametersCount} param(s)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{ep.summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 flex-wrap">
                {workspaceSlug && (
                  <button
                    type="button"
                    onClick={() => {
                      const mockUrl = `${API_BASE_URL}/mock/${workspaceSlug}${ep.path}`;
                      navigator.clipboard.writeText(mockUrl);
                      setCopiedMockId(ep.id);
                      setTimeout(() => setCopiedMockId(null), 2000);
                    }}
                    title="Copiar URL do Mock Server Instantâneo"
                    className="px-2.5 py-1.5 rounded-lg border border-purple-800/70 bg-purple-950/30 hover:bg-purple-950/60 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiedMockId === ep.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedMockId === ep.id ? 'Mock Copiado!' : 'Mock URL'}
                  </button>
                )}

                <button
                  onClick={() => openEditModal(ep)}
                  title="Editar endpoint, parâmetros e respostas"
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-black/40 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-400" /> Editar
                </button>

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
          <div className="max-w-lg w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" /> Novo Endpoint
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
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
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs font-mono font-bold"
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
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono"
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
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">URL Base da API (Opcional)</label>
                <input
                  type="url"
                  value={newBaseUrl}
                  onChange={e => setNewBaseUrl(e.target.value)}
                  placeholder="https://api.seusistema.com"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Nome da API</label>
                  <input
                    type="text"
                    value={newApiName}
                    onChange={e => setNewApiName(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Tag / Módulo</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Ex: Clientes"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Edit Endpoint Modal */}
      {editingEp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" /> Editar Endpoint Completo
              </h3>
              <button onClick={() => setEditingEp(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={editMethod}
                  onChange={e => setEditMethod(e.target.value as any)}
                  className="bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 font-mono font-bold"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  required
                  value={editPath}
                  onChange={e => setEditPath(e.target.value)}
                  className="col-span-2 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Resumo</label>
                <input
                  type="text"
                  required
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Descrição Detalhada</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Corpo da Requisição (JSON)</label>
                <textarea
                  rows={3}
                  value={editReqBody}
                  onChange={e => setEditReqBody(e.target.value)}
                  placeholder='{"campo": "exemplo"}'
                  className="w-full bg-black/50 border border-[var(--border)] rounded-lg p-2.5 font-mono"
                />
              </div>

              {/* Parameters */}
              <div className="space-y-2 border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Parâmetros (query / path / header)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditParams(p => [...p, { name: '', in: 'query', required: false, description: '' }])
                    }
                    className="text-blue-400 hover:underline font-semibold"
                  >
                    + Adicionar Parâmetro
                  </button>
                </div>
                {editParams.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={p.name}
                      onChange={e =>
                        setEditParams(prev => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                      }
                      className="col-span-3 bg-black/40 border border-[var(--border)] rounded px-2 py-1.5 font-mono"
                    />
                    <select
                      value={p.in}
                      onChange={e =>
                        setEditParams(prev =>
                          prev.map((x, i) => (i === idx ? { ...x, in: e.target.value as any } : x))
                        )
                      }
                      className="col-span-2 bg-black/40 border border-[var(--border)] rounded px-2 py-1.5"
                    >
                      <option value="query">query</option>
                      <option value="path">path</option>
                      <option value="header">header</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={p.description}
                      onChange={e =>
                        setEditParams(prev =>
                          prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                        )
                      }
                      className="col-span-5 bg-black/40 border border-[var(--border)] rounded px-2 py-1.5"
                    />
                    <label className="col-span-1 flex justify-center" title="Obrigatório">
                      <input
                        type="checkbox"
                        checked={p.required}
                        onChange={e =>
                          setEditParams(prev =>
                            prev.map((x, i) => (i === idx ? { ...x, required: e.target.checked } : x))
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditParams(prev => prev.filter((_, i) => i !== idx))}
                      className="col-span-1 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Response Examples */}
              <div className="space-y-2 border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Exemplos de Resposta (200 / 400 / 404)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditResponses(r => [...r, { statusCode: 200, description: 'Sucesso', body: '{}' }])
                    }
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    + Adicionar Resposta
                  </button>
                </div>
                {editResponses.map((r, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-black/40 border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={r.statusCode}
                        onChange={e =>
                          setEditResponses(prev =>
                            prev.map((x, i) => (i === idx ? { ...x, statusCode: Number(e.target.value) } : x))
                          )
                        }
                        className="w-20 bg-black/50 border border-[var(--border)] rounded px-2 py-1 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Descrição (ex: Criado com sucesso)"
                        value={r.description}
                        onChange={e =>
                          setEditResponses(prev =>
                            prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                          )
                        }
                        className="flex-1 bg-black/50 border border-[var(--border)] rounded px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => setEditResponses(prev => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder='{"ok": true}'
                      value={r.body}
                      onChange={e =>
                        setEditResponses(prev =>
                          prev.map((x, i) => (i === idx ? { ...x, body: e.target.value } : x))
                        )
                      }
                      className="w-full bg-black/50 border border-[var(--border)] rounded p-2 font-mono text-[11px]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingEp(null)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-semibold"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import OpenAPI / Swagger JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" /> Importar OpenAPI 3.0 / Swagger 2.0 (JSON)
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
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
                  className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importJsonText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold"
                >
                  {isImporting ? 'Importando...' : 'Importar Endpoints'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
