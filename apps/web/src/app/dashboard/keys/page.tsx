'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Check, AlertTriangle, X, Inbox, AlertCircle } from 'lucide-react';
import { api, API_BASE_URL, ApiKeyItem } from '../../../lib/api';

export default function KeysPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const boot = await api.workspaces.bootstrap();
      setWorkspaceId(boot.workspace.id);
      const list = await api.keys.list(boot.workspace.id);
      setKeys(list);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar chaves do banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !workspaceId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.keys.create(workspaceId, newKeyName.trim(), ['read', 'write']);
      setKeys(prev => [res.apiKey, ...prev]);
      setIsCreateModalOpen(false);
      setNewKeyName('');
      setCreatedSecret(res.secretKey);
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar chave de API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!workspaceId) return;
    setError(null);
    try {
      await api.keys.revoke(workspaceId, id);
      setKeys(prev =>
        prev.map(k => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k))
      );
    } catch (err: any) {
      setError(err?.message || 'Erro ao revogar chave.');
    }
  };

  const handleCopySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gerenciador de API Keys</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Chaves geradas no servidor com hash SHA-256 gravado no Supabase e exibição única.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Nova API Key
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Secret Display Banner (shown only once upon creation) */}
      {createdSecret && (
        <div className="p-5 rounded-2xl border border-amber-600/50 bg-amber-950/20 space-y-3 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> Copie sua Chave de API Agora
            </span>
            <button
              onClick={() => setCreatedSecret(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Por razões de segurança estrita, este segredo completo <strong>nunca mais será exibido</strong>. Apenas o hash criptográfico SHA-256 foi salvo no Supabase.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={createdSecret}
              className="w-full bg-black/60 border border-amber-800/80 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
            />
            <button
              onClick={handleCopySecret}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Loading / Empty / Table */}
      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Carregando chaves do Supabase...</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-white">Nenhuma chave de API criada</h3>
            <p className="text-xs text-zinc-400">
              Gere chaves de API criptografadas com SHA-256 para autenticar integrações e pipelines de forma segura.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Criar Minha Primeira Chave
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-black/30 border-b border-[var(--border)] text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Identificação / Nome</th>
                <th className="p-4">Prefixo Público</th>
                <th className="p-4">Permissões</th>
                <th className="p-4">Criada em</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-zinc-300">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-black/20 transition">
                  <td className="p-4 font-semibold text-white">{k.name}</td>
                  <td className="p-4 font-mono text-zinc-400">{k.keyPrefix}...</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {k.permissions.map(p => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] uppercase font-mono"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400">{formatDate(k.createdAt)}</td>
                  <td className="p-4">
                    {k.revokedAt ? (
                      <span className="text-rose-400 font-semibold">
                        Revogada em {formatDate(k.revokedAt)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Ativa
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {!k.revokedAt && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="text-xs text-rose-400 hover:underline hover:text-rose-300 font-medium"
                      >
                        Revogar Chave
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CI/CD External API Integration Guide */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div>
          <h2 className="font-bold text-base text-white">Usando suas API Keys no CI/CD (GitHub Actions / Scripts)</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Envie sua chave no header <code className="text-blue-400">x-api-key</code> para consultar status de monitores, listar rotas ou disparar sua bateria de testes automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] font-mono">
          <div className="p-3.5 rounded-lg bg-black/60 border border-[var(--border)] space-y-1.5 overflow-x-auto">
            <p className="text-zinc-400 font-sans font-semibold text-xs">1. Checar Uptime / Status do Workspace</p>
            <pre className="text-emerald-300">{`curl -H "x-api-key: ah_live_SUA_CHAVE" \\\n  ${API_BASE_URL}/external/status`}</pre>
          </div>

          <div className="p-3.5 rounded-lg bg-black/60 border border-[var(--border)] space-y-1.5 overflow-x-auto">
            <p className="text-zinc-400 font-sans font-semibold text-xs">2. Rodar Bateria de Testes no CI/CD</p>
            <pre className="text-emerald-300">{`curl -X POST -H "x-api-key: ah_live_SUA_CHAVE" \\\n  ${API_BASE_URL}/external/run-tests`}</pre>
          </div>
        </div>
      </div>

      {/* Modal Nova Chave */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-400" /> Nova API Key
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nome ou Finalidade da Chave</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Ex: Servidor de Produção / Pipeline CI"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Segurança Criptográfica:</p>
                <p>• Gerada no servidor com entropia segura (`crypto.randomBytes`).</p>
                <p>• Armazenada exclusivamente como hash SHA-256 no Supabase.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? 'Gerando...' : 'Gerar Chave Segura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
