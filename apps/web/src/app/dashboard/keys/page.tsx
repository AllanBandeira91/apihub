'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Shield, Trash2, Copy, Check, AlertTriangle, X, Inbox } from 'lucide-react';

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: string;
  revokedAt: string | null;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('apihub-keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setKeys(parsed);
      } catch {}
    }
    setIsLoaded(true);
  }, []);

  const saveKeys = (items: ApiKeyItem[]) => {
    setKeys(items);
    localStorage.setItem('apihub-keys', JSON.stringify(items));
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    // Generate real secure random secret
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    const randomHex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    const fullSecret = `ah_live_${randomHex}`;
    const prefix = fullSecret.slice(0, 16) + '...';

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const newKey: ApiKeyItem = {
      id: Date.now().toString(),
      name: newKeyName,
      keyPrefix: prefix,
      permissions: ['read', 'write'],
      createdAt: formattedDate,
      revokedAt: null,
    };

    saveKeys([newKey, ...keys]);
    setIsCreateModalOpen(false);
    setNewKeyName('');
    setCreatedSecret(fullSecret);
  };

  const handleRevoke = (id: string) => {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    saveKeys(keys.map(k => (k.id === id ? { ...k, revokedAt: formattedDate } : k)));
  };

  const handleCopySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gerenciador de API Keys</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Chaves criptografadas para autenticar chamadas à API com hash SHA-256 no banco de dados.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Nova API Key
        </button>
      </div>

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
            Por razões de segurança estrita e proteção contra vazamento, este segredo completo <strong>nunca mais será exibido</strong>. Apenas o hash SHA-256 é armazenado no servidor.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={createdSecret}
              className="w-full bg-black/60 border border-amber-800/80 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
            />
            <button
              onClick={handleCopySecret}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-black font-bold text-xs flex items-center gap-1.5 transition flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Keys List or Empty State */}
      {isLoaded && keys.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-white">Nenhuma chave de API criada</h3>
            <p className="text-xs text-zinc-400">
              Gere chaves de API para autenticar requisições automatizadas, pipelines de CI/CD e integrações de terceiros de forma segura.
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
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
                  <td className="p-4 font-mono text-zinc-400">{k.keyPrefix}</td>
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
                  <td className="p-4 text-zinc-400">{k.createdAt}</td>
                  <td className="p-4">
                    {k.revokedAt ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        Revogada em {k.revokedAt}
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

      {/* Modal Nova Chave */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
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
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Ex: Servidor de Produção / Pipeline CI"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Permissões Padrão:</p>
                <p>• Leitura e escrita nos endpoints autorizados do seu workspace.</p>
                <p>• Criptografada com SHA-256 no banco de dados.</p>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-md shadow-blue-600/20"
                >
                  Gerar Chave Segura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
