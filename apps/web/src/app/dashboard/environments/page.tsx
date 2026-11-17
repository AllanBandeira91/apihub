'use client';

import { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Star,
  Inbox
} from 'lucide-react';
import { api, EnvironmentItem, EnvVariableItem } from '../../../lib/api';

export default function EnvironmentsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [envName, setEnvName] = useState('');
  const [variables, setVariables] = useState<EnvVariableItem[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<number, boolean>>({});

  // Create new env
  const [newEnvName, setNewEnvName] = useState('');
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectEnv = (env: EnvironmentItem) => {
    setSelectedId(env.id);
    setEnvName(env.name);
    setVariables(Array.isArray(env.variables) ? env.variables : []);
    setIsDefault(env.isDefault);
    setRevealedKeys({});
  };

  useEffect(() => {
    api.workspaces
      .bootstrap()
      .then(async boot => {
        setProjectId(boot.project.id);
        const list = await api.environments.list(boot.project.id);
        setEnvironments(list);
        if (list.length > 0) {
          selectEnv(list[0]);
        }
      })
      .catch(err => setError(err?.message || 'Erro ao carregar ambientes.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newEnvName.trim()) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await api.environments.create(projectId, {
        name: newEnvName.trim(),
        variables: [{ key: 'BASE_URL', value: '', isSecret: false }],
        isDefault: environments.length === 0,
      });
      setEnvironments(prev => [...prev, created]);
      selectEnv(created);
      setNewEnvName('');
      setSuccess(`Ambiente "${created.name}" criado no Supabase!`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar ambiente.');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEnv = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.environments.update(selectedId, {
        name: envName.trim(),
        variables,
        isDefault,
      });
      setEnvironments(prev =>
        prev.map(item => {
          if (item.id === updated.id) return updated;
          return isDefault ? { ...item, isDefault: false } : item;
        })
      );
      setSuccess('Variáveis de ambiente salvas no Supabase!');
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar ambiente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnv = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.environments.delete(id);
      const remaining = environments.filter(e => e.id !== id);
      setEnvironments(remaining);
      if (remaining.length > 0) {
        selectEnv(remaining[0]);
      } else {
        setSelectedId(null);
        setEnvName('');
        setVariables([]);
      }
      setSuccess('Ambiente excluído.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir ambiente.');
    }
  };

  const handleAddVar = () => {
    setVariables(prev => [...prev, { key: '', value: '', isSecret: false }]);
  };

  const handleVarChange = (idx: number, field: keyof EnvVariableItem, val: any) => {
    setVariables(prev => prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  };

  const handleRemoveVar = (idx: number) => {
    setVariables(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ambientes & Variáveis</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure variáveis como <code className="text-blue-400">{'{{BASE_URL}}'}</code> e{' '}
          <code className="text-blue-400">{'{{TOKEN}}'}</code> para usar automaticamente no API Tester.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Environment List + Quick Create */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4 h-fit">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" /> Seus Ambientes
          </h2>

          <form onSubmit={handleCreateEnv} className="flex gap-2">
            <input
              type="text"
              required
              value={newEnvName}
              onChange={e => setNewEnvName(e.target.value)}
              placeholder="Ex: Produção, Staging..."
              className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Criar
            </button>
          </form>

          {isLoading ? (
            <p className="text-xs text-zinc-500 text-center py-6">Carregando...</p>
          ) : environments.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">
              Nenhum ambiente criado ainda. Crie "Desenvolvimento" ou "Produção" acima.
            </p>
          ) : (
            <div className="space-y-1.5">
              {environments.map(env => (
                <div
                  key={env.id}
                  onClick={() => selectEnv(env)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between gap-2 transition ${
                    selectedId === env.id
                      ? 'border-blue-500 bg-blue-600/15 text-white'
                      : 'border-[var(--border)] bg-black/30 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                      {env.name}
                      {env.isDefault && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {Array.isArray(env.variables) ? env.variables.length : 0} variável(is)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteEnv(env.id);
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 transition"
                    title="Excluir ambiente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Variable Editor */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
          {!selectedId ? (
            <div className="py-12 text-center space-y-2 text-zinc-500">
              <Inbox className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs">Selecione ou crie um ambiente ao lado para configurar suas variáveis.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={envName}
                    onChange={e => setEnvName(e.target.value)}
                    className="bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 w-full sm:w-64"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={e => setIsDefault(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    Ambiente Padrão
                  </label>

                  <button
                    onClick={handleSaveEnv}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-zinc-400 px-1">
                  <span className="col-span-4">Nome da Variável</span>
                  <span className="col-span-6">Valor</span>
                  <span className="col-span-2 text-right">Ações</span>
                </div>

                {variables.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={v.key}
                      onChange={e => handleVarChange(idx, 'key', e.target.value)}
                      placeholder="BASE_URL"
                      className="col-span-4 bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                    />

                    <input
                      type={v.isSecret && !revealedKeys[idx] ? 'password' : 'text'}
                      value={v.value}
                      onChange={e => handleVarChange(idx, 'value', e.target.value)}
                      placeholder="https://api.seusistema.com"
                      className="col-span-6 bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />

                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleVarChange(idx, 'isSecret', !v.isSecret)}
                        title={v.isSecret ? 'Marcar como público' : 'Ocultar como segredo'}
                        className={`p-1.5 rounded-lg border text-[10px] transition ${
                          v.isSecret
                            ? 'border-amber-700 bg-amber-950/40 text-amber-400'
                            : 'border-[var(--border)] text-zinc-500 hover:text-white'
                        }`}
                      >
                        {v.isSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {v.isSecret && (
                        <button
                          type="button"
                          onClick={() => setRevealedKeys(p => ({ ...p, [idx]: !p[idx] }))}
                          title="Revelar temporariamente"
                          className="p-1.5 text-zinc-400 hover:text-white text-[10px]"
                        >
                          {revealedKeys[idx] ? 'Ocultar' : 'Ver'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveVar(idx)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddVar}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 pt-2 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Variável
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
