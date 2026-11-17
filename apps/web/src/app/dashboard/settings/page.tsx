'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Layers,
  Lock,
  Users,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Shield
} from 'lucide-react';
import { api, getStoredUser, WorkspaceMemberItem } from '../../../lib/api';

export default function SettingsPage() {
  const router = useRouter();

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [isLoading, setIsLoading] = useState(true);

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Workspace form
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsSaving, setWsSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Team members
  const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [inviting, setInviting] = useState(false);

  // Delete account (LGPD)
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setError(null);
    setSuccess(msg);
  };

  const showError = (msg: string) => {
    setSuccess(null);
    setError(msg);
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setName(stored.name);
      setEmail(stored.email);
    }

    api.workspaces
      .bootstrap()
      .then(async boot => {
        setWorkspaceId(boot.workspace.id);
        setUserRole(boot.workspace.role);
        setWsName(boot.workspace.name);
        setWsDesc(boot.workspace.description || '');
        const res = await api.workspaces.listMembers(boot.workspace.id);
        setMembers(res.members);
      })
      .catch(err => showError(err?.message || 'Erro ao carregar configurações.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.auth.updateProfile(name);
      showSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      showError(err?.message || 'Erro ao atualizar perfil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setWsSaving(true);
    try {
      await api.workspaces.update(workspaceId, { name: wsName, description: wsDesc });
      showSuccess('Configurações do workspace salvas no Supabase!');
    } catch (err: any) {
      showError(err?.message || 'Erro ao atualizar workspace.');
    } finally {
      setWsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('A nova senha e a confirmação não coincidem.');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess(res.message);
    } catch (err: any) {
      showError(err?.message || 'Erro ao alterar senha.');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.workspaces.addMember(workspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      if (res.member) {
        setMembers(prev => [...prev, res.member!]);
      }
      setInviteEmail('');
      showSuccess(res.message);
    } catch (err: any) {
      showError(err?.message || 'Erro ao convidar membro.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceId) return;
    try {
      await api.workspaces.removeMember(workspaceId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      showSuccess('Membro removido do workspace.');
    } catch (err: any) {
      showError(err?.message || 'Erro ao remover membro.');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'EXCLUIR') {
      showError('Digite exatamente EXCLUIR para confirmar a eliminação permanente da sua conta.');
      return;
    }
    setDeleting(true);
    try {
      await api.auth.deleteAccount(deletePassword);
      router.push('/');
    } catch (err: any) {
      showError(err?.message || 'Não foi possível excluir a conta. Verifique sua senha.');
      setDeleting(false);
    }
  };

  const canManageWorkspace = userRole === 'OWNER' || userRole === 'ADMIN';

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Configurações da Conta & Workspace</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Gerencie seu perfil, senha, equipe do workspace e direitos de privacidade (LGPD).
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Carregando configurações...</div>
      ) : (
        <>
          {/* 1. Profile & Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form
              onSubmit={handleSaveProfile}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4"
            >
              <h2 className="font-bold text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" /> Meu Perfil
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nome</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">E-mail Verificado</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-black/20 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                {profileSaving ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </form>

            <form
              onSubmit={handleSaveWorkspace}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4"
            >
              <h2 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Workspace Atual
              </h2>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nome do Workspace</label>
                <input
                  type="text"
                  required
                  disabled={!canManageWorkspace}
                  value={wsName}
                  onChange={e => setWsName(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Descrição (Opcional)</label>
                <input
                  type="text"
                  disabled={!canManageWorkspace}
                  value={wsDesc}
                  onChange={e => setWsDesc(e.target.value)}
                  placeholder="Ex: APIs da equipe de engenharia"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {canManageWorkspace && (
                <button
                  type="submit"
                  disabled={wsSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                >
                  {wsSaving ? 'Salvando...' : 'Salvar Workspace'}
                </button>
              )}
            </form>
          </div>

          {/* 2. Team & Members */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Equipe & Membros do Workspace
              </h2>
              <span className="text-xs text-zinc-400">{members.length} membro(s)</span>
            </div>

            {canManageWorkspace && (
              <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="E-mail real do colaborador (ex: dev@gmail.com)"
                  className="flex-1 bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="ADMIN">ADMIN (Gerenciar tudo)</option>
                  <option value="EDITOR">EDITOR (Criar e editar APIs)</option>
                  <option value="VIEWER">VIEWER (Apenas leitura)</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {inviting ? 'Enviando...' : 'Convidar'}
                </button>
              </form>
            )}

            <div className="divide-y divide-[var(--border)]">
              {members.map(m => (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-200 truncate">{m.user.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{m.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono font-bold text-blue-300 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {m.role}
                    </span>
                    {canManageWorkspace && m.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-zinc-500 hover:text-red-400 transition p-1"
                        title="Remover membro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Change Password */}
          <form
            onSubmit={handleChangePassword}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4"
          >
            <h2 className="font-bold text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" /> Alterar Senha
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Senha Atual</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nova Senha (mín. 8)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwdSaving}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-xs font-bold transition"
            >
              {pwdSaving ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>

          {/* 4. Danger Zone — LGPD Art. 18 Account Deletion */}
          <form
            onSubmit={handleDeleteAccount}
            className="rounded-xl border border-red-900/60 bg-red-950/15 p-6 space-y-4"
          >
            <h2 className="font-bold text-base text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Zona de Perigo — Exclusão Definitiva (LGPD Art. 18)
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Esta ação apaga permanentemente sua conta, seus workspaces próprios, endpoints, chaves de API e logs de requisição do banco de dados no Supabase. <strong>Não pode ser desfeita.</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Confirme sua Senha</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full bg-black/50 border border-red-900/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Digite EXCLUIR para confirmar</label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full bg-black/50 border border-red-900/50 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={deleting || deleteConfirmText !== 'EXCLUIR'}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Excluindo conta...' : 'Excluir Minha Conta Permanentemente'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
