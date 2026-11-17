'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Plus,
  RefreshCw,
  Trash2,
  Pause,
  Play,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  X,
  Globe,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { api, UptimeMonitorItem, getStoredUser } from '../../../lib/api';

export default function MonitorsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [copiedStatusLink, setCopiedStatusLink] = useState(false);
  const [monitors, setMonitors] = useState<UptimeMonitorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [alertEmail, setAlertEmail] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.email) setAlertEmail(user.email);

    api.workspaces
      .bootstrap()
      .then(async boot => {
        setProjectId(boot.project.id);
        setWorkspaceSlug(boot.workspace.slug);
        const list = await api.monitors.list(boot.project.id);
        setMonitors(list);
      })
      .catch(err => setError(err?.message || 'Erro ao carregar monitores.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await api.monitors.create(projectId, {
        name: name.trim(),
        url: url.trim(),
        method,
        intervalMinutes,
        expectedStatus,
        alertEmail: alertEmail.trim(),
        discordWebhookUrl: discordWebhookUrl.trim() || null,
      });
      setMonitors(prev => [created, ...prev]);
      setIsModalOpen(false);
      setName('');
      setUrl('');
      setDiscordWebhookUrl('');
      setSuccess(`Monitor "${created.name}" criado e primeira checagem executada!`);
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar monitor.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyStatusUrl = () => {
    if (!workspaceSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/status/${workspaceSlug}`);
    setCopiedStatusLink(true);
    setTimeout(() => setCopiedStatusLink(false), 2000);
  };

  const handleCheckNow = async (id: string) => {
    setCheckingId(id);
    setError(null);
    try {
      const updated = await api.monitors.checkNow(id);
      setMonitors(prev => prev.map(m => (m.id === id ? updated : m)));
    } catch (err: any) {
      setError(err?.message || 'Erro ao executar checagem.');
    } finally {
      setCheckingId(null);
    }
  };

  const handleToggle = async (m: UptimeMonitorItem) => {
    try {
      const updated = await api.monitors.toggleActive(m.id, !m.isActive);
      setMonitors(prev => prev.map(item => (item.id === m.id ? updated : item)));
    } catch (err: any) {
      setError(err?.message || 'Erro ao alterar estado do monitor.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.monitors.delete(id);
      setMonitors(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover monitor.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Monitoramento de Uptime</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Checagens automáticas com alerta real por e-mail (<code className="text-blue-400">apihubsupport@gmail.com</code>) se sua API sair do ar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {workspaceSlug && (
            <>
              <button
                onClick={handleCopyStatusUrl}
                className="border border-[var(--border)] bg-[var(--card)] hover:bg-zinc-800 text-zinc-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedStatusLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {copiedStatusLink ? 'Link Copiado!' : 'Link StatusPage'}
              </button>
              <Link
                href={`/status/${workspaceSlug}`}
                target="_blank"
                className="border border-emerald-800 bg-emerald-950/30 hover:bg-emerald-950/60 text-emerald-300 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Globe className="w-3.5 h-3.5" /> Ver Status Público <ExternalLink className="w-3 h-3" />
              </Link>
            </>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Novo Monitor
          </button>
        </div>
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

      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-xs text-zinc-400">
          Carregando monitores...
        </div>
      ) : monitors.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-white">Nenhum monitor configurado</h3>
            <p className="text-xs text-zinc-400">
              Adicione URLs críticas da sua infraestrutura para monitorar uptime 24/7 e receber alertas instantâneos por e-mail em caso de queda.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Primeiro Monitor
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {monitors.map(m => {
            const isUp = m.lastStatus === 'UP';
            const isDown = m.lastStatus === 'DOWN';

            return (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isUp
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : isDown
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {isUp ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isDown ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {isUp ? 'ONLINE' : isDown ? 'OFFLINE' : 'PENDENTE'}
                      </span>

                      <h3 className="font-bold text-base text-white truncate">{m.name}</h3>
                      {!m.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800">
                          PAUSADO
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-zinc-400 truncate">{m.url}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" /> Uptime: <strong className="text-zinc-200">{m.uptimePercent}%</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" /> Latência: <strong className="text-zinc-200">{m.lastLatencyMs ?? 0}ms</strong>
                      </span>
                      <span>A cada {m.intervalMinutes} min</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Alertas: {m.alertEmail}
                      </span>
                      {m.discordWebhookUrl && (
                        <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800 font-semibold text-[10px]">
                          Discord Webhook Ativo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCheckNow(m.id)}
                      disabled={checkingId === m.id}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-black/40 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${checkingId === m.id ? 'animate-spin' : ''}`} />
                      Testar Agora
                    </button>

                    <button
                      onClick={() => handleToggle(m)}
                      title={m.isActive ? 'Pausar' : 'Retomar'}
                      className="p-2 rounded-lg border border-[var(--border)] bg-black/40 hover:bg-zinc-800 text-zinc-300 transition"
                    >
                      {m.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      title="Excluir monitor"
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 24-Bar Mini Uptime Status Timeline */}
                {m.checks && m.checks.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>Últimas {m.checks.length} checagens</span>
                      <span>Total: {m.totalChecks} verificação(ões)</span>
                    </div>
                    <div className="flex items-center gap-1 h-6">
                      {[...m.checks].reverse().map(c => (
                        <div
                          key={c.id}
                          title={`${c.status} • HTTP ${c.statusCode || 'ERR'} • ${c.latencyMs}ms • ${new Date(c.checkedAt).toLocaleString('pt-BR')}`}
                          className={`flex-1 h-full rounded-sm transition hover:opacity-80 ${
                            c.status === 'UP' ? 'bg-emerald-500/80' : 'bg-rose-500/90'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Monitor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" /> Novo Monitor de Uptime
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: API de Pagamentos (Health)"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">URL Pública (HTTPS)</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.seusistema.com/health"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Método</label>
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value as any)}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs font-mono"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Intervalo</label>
                  <select
                    value={intervalMinutes}
                    onChange={e => setIntervalMinutes(Number(e.target.value))}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs"
                  >
                    <option value={1}>1 minuto</option>
                    <option value={5}>5 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={60}>1 hora</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">HTTP Esperado</label>
                  <input
                    type="number"
                    value={expectedStatus}
                    onChange={e => setExpectedStatus(Number(e.target.value))}
                    className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">E-mail para Alertas de Queda</label>
                <input
                  type="email"
                  required
                  value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)}
                  placeholder="seu.email@gmail.com"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Webhook do Discord para Alertas em Tempo Real (Opcional)
                </label>
                <input
                  type="url"
                  value={discordWebhookUrl}
                  onChange={e => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
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
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold"
                >
                  {creating ? 'Criando e testando...' : 'Criar Monitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
