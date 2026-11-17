'use client';

import { useState } from 'react';
import { Key, Plus, Shield, Trash2, Copy, Check, AlertTriangle, X } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: string;
  revokedAt: string | null;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([
    {
      id: '1',
      name: 'CI/CD GitHub Actions Pipeline',
      keyPrefix: 'ah_live_89fa7b...',
      permissions: ['read', 'write'],
      createdAt: '15/11/2026',
      revokedAt: null,
    },
    {
      id: '2',
      name: 'Chave de Leitura Externa (Mobile App)',
      keyPrefix: 'ah_live_12bc4d...',
      permissions: ['read'],
      createdAt: '12/11/2026',
      revokedAt: '14/11/2026',
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    // Generate random secret simulation
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const fullSecret = `ah_live_${randomHex}`;
    const prefix = fullSecret.slice(0, 14) + '...';

    const newKey: ApiKeyItem = {
      id: Date.now().toString(),
      name: newKeyName,
      keyPrefix: prefix,
      permissions: ['read', 'write'],
      createdAt: 'Hoje',
      revokedAt: null,
    };

    setKeys([newKey, ...keys]);
    setIsCreateModalOpen(false);
    setNewKeyName('');
    setCreatedSecret(fullSecret);
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.map(k => (k.id === id ? { ...k, revokedAt: 'Hoje' } : k)));
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
            Chaves criptografadas para autenticar chamadas à API do APIHub com hash SHA-256 no banco de dados.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Nova API Key
        </button>
      </div>

      {/* Secret Key One-time Reveal Modal */}
      {createdSecret && (
        <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-800 text-amber-200 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-amber-300">Chave Criada com Sucesso!</h3>
              <p className="text-xs text-amber-200/90">
                Copie a chave abaixo agora. Por motivos de segurança estrita, <strong>ela nunca mais poderá ser visualizada</strong> após fechar este aviso (apenas o hash é armazenado).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/60 border border-amber-800/80 p-3 rounded-lg">
            <code className="text-xs font-mono text-emerald-400 flex-1 truncate">{createdSecret}</code>
            <button
              onClick={handleCopySecret}
              className="bg-amber-600 hover:bg-amber-700 text-black font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiada!' : 'Copiar Chave'}</span>
            </button>
          </div>

          <div className="text-right">
            <button
              onClick={() => setCreatedSecret(null)}
              className="text-xs underline text-amber-400 hover:text-white"
            >
              Já copiei e salvei a chave com segurança (Fechar)
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl">
        <div className="divide-y divide-[var(--border)]">
          {keys.map(k => (
            <div
              key={k.id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-black/20 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-zinc-100">{k.name}</p>
                    {k.revokedAt ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800">
                        Revogada
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                        Ativa
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">{k.keyPrefix}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400 self-end sm:self-center">
                <div className="flex items-center gap-1">
                  {k.permissions.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded bg-black/40 border border-zinc-800 text-[10px]">
                      {p}
                    </span>
                  ))}
                </div>

                <span>Criada: {k.createdAt}</span>

                {!k.revokedAt && (
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="p-1.5 rounded-lg border border-red-900/50 hover:bg-red-600 hover:text-white transition text-red-400"
                    title="Revogar chave"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Criar Chave */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="font-bold text-lg">Nova API Key</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Identificador / Nome da Chave</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Ex: Integração Backend Produção"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-black/20 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  Gerar Chave Criptografada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
