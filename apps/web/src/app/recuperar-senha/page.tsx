'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { api } from '../../lib/api';

export default function RecuperarSenhaPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await api.auth.sendVerification(email, 'PASSWORD_RESET');
      setPreviewCode(res.previewCode || null);
      setInfoMessage(`Código de recuperação enviado para ${res.email}.`);
      setStep('reset');
    } catch (err: any) {
      setError(err?.message || 'Erro ao solicitar código de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.resetPassword({ email, code, newPassword });
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível redefinir a senha. Verifique o código informado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Login
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full mx-auto my-auto p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
            λ
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 'email' && 'Recuperar Senha'}
            {step === 'reset' && 'Definir Nova Senha'}
            {step === 'done' && 'Senha Alterada!'}
          </h1>
          <p className="text-xs text-zinc-400">
            {step === 'email' && 'Informe seu e-mail cadastrado para receber um código de recuperação de 6 dígitos.'}
            {step === 'reset' && 'Informe o código recebido e crie uma nova senha segura.'}
            {step === 'done' && 'Sua senha foi atualizada com segurança no banco de dados.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && step === 'reset' && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/80 text-emerald-300 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{infoMessage}</span>
            </div>
            {previewCode && (
              <div className="p-2 rounded bg-black/50 border border-emerald-900 font-mono text-center text-sm tracking-[0.25em] text-emerald-400 font-bold">
                Código: {previewCode}
              </div>
            )}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Enviar Código de Recuperação'
              )}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Código de 6 Dígitos</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  minLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-center font-mono text-lg tracking-[0.4em] font-bold focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Confirmar Nova Senha'
              )}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-5 py-2 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Sua senha foi redefinida com sucesso. Agora você pode acessar sua conta com as novas credenciais.
            </p>
            <Link
              href="/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center shadow-lg shadow-blue-600/20"
            >
              Ir para o Login
            </Link>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-zinc-500 py-2">
        APIHub • Plataforma de Gestão de APIs • Em Desenvolvimento
      </div>
    </div>
  );
}
