'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Terminal,
  Trash2,
  Check,
  X,
  ExternalLink,
  Code
} from 'lucide-react';

interface EndpointItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  tags: string[];
  apiName: string;
  parametersCount: number;
}

export default function ApisPage() {
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([
    { id: '1', method: 'GET', path: '/v1/users', summary: 'Lista todos os usuários com paginação', tags: ['Usuários'], apiName: 'Core Auth API', parametersCount: 2 },
    { id: '2', method: 'POST', path: '/v1/users', summary: 'Cadastra um novo usuário no sistema', tags: ['Usuários'], apiName: 'Core Auth API', parametersCount: 1 },
    { id: '3', method: 'GET', path: '/v1/products', summary: 'Busca catálogo de produtos ativos', tags: ['Catálogo'], apiName: 'Storefront API', parametersCount: 3 },
    { id: '4', method: 'POST', path: '/v1/orders', summary: 'Gera um pedido com itens no carrinho', tags: ['Vendas'], apiName: 'Storefront API', parametersCount: 1 },
    { id: '5', method: 'DELETE', path: '/v1/keys/:keyId', summary: 'Revoga chave de API permanentemente', tags: ['Segurança'], apiName: 'Core Auth API', parametersCount: 1 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New endpoint form state
  const [newMethod, setNewMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [newPath, setNewPath] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newApiName, setNewApiName] = useState('Core Auth API');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath) return;

    const formattedPath = newPath.startsWith('/') ? newPath : `/${newPath}`;
    const newEp: EndpointItem = {
      id: Date.now().toString(),
      method: newMethod,
      path: formattedPath,
      summary: newSummary || `Endpoint ${formattedPath}`,
      tags: newTag ? [newTag] : ['Geral'],
      apiName: newApiName,
      parametersCount: 0,
    };

    setEndpoints([newEp, ...endpoints]);
    setIsModalOpen(false);
    setNewPath('');
    setNewSummary('');
    setNewTag('');
  };

  const handleDelete = (id: string) => {
    setEndpoints(endpoints.filter(e => e.id !== id));
  };

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesSearch =
      ep.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.apiName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = selectedMethod === 'ALL' || ep.method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">APIs & Endpoints</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Cadastre rotas, documente parâmetros, responses e sincronize com a especificação OpenAPI.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Cadastrar Endpoint
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filtrar por rota, resumo ou API..."
            className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
            <button
              key={m}
              onClick={() => setSelectedMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                selectedMethod === m
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-[var(--card)] border-[var(--border)] text-zinc-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl">
        <div className="divide-y divide-[var(--border)]">
          {filteredEndpoints.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500">
              Nenhum endpoint encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredEndpoints.map(ep => (
              <div
                key={ep.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-black/20 transition"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono font-bold px-2.5 py-1 rounded text-xs ${
                      ep.method === 'GET'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : ep.method === 'POST'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : ep.method === 'DELETE'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {ep.method}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-sm text-zinc-100">{ep.path}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {ep.apiName}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{ep.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    {ep.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-black/40 border border-zinc-800 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/dashboard/tester?url=${encodeURIComponent(`https://api.exemplo.com${ep.path}`)}&method=${ep.method}`}
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-blue-600 hover:text-white transition text-zinc-400"
                    title="Testar requisição"
                  >
                    <Terminal className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(ep.id)}
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-600 hover:text-white transition text-zinc-400"
                    title="Excluir endpoint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Cadastrar Endpoint */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="font-bold text-lg">Novo Endpoint</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">Método HTTP</label>
                  <select
                    value={newMethod}
                    onChange={e => setNewMethod(e.target.value as any)}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2 font-mono font-bold"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-zinc-300 block mb-1">Caminho / Rota</label>
                  <input
                    type="text"
                    required
                    value={newPath}
                    onChange={e => setNewPath(e.target.value)}
                    placeholder="/v1/recurso"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Resumo / Descrição curta</label>
                <input
                  type="text"
                  required
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Ex: Retorna os dados do cliente por ID"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">Tag / Módulo</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Ex: Autenticação"
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">Vincular à API</label>
                  <select
                    value={newApiName}
                    onChange={e => setNewApiName(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2"
                  >
                    <option value="Core Auth API">Core Auth API</option>
                    <option value="Storefront API">Storefront API</option>
                    <option value="Payments Gateway">Payments Gateway</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-black/20 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
