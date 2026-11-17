'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Mail, User, ShieldCheck, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await api.auth.sendVerification(email, 'REGISTER');
      setInfoMessage(`Código de 6 dígitos enviado para ${res.email}. Verifique sua caixa de entrada (ou spam).`);
      setStep('verify');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível validar ou enviar o e-mail informado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.auth.registerWithCode({ name, email, password, code });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Código inválido ou expirado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Início
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full mx-auto my-auto p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
            λ
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 'form' ? 'Criar Conta no APIHub' : 'Verificar E-mail'}
          </h1>
          <p className="text-xs text-zinc-400">
            {step === 'form'
              ? 'Verificamos seu e-mail em tempo real para manter a plataforma segura.'
              : 'Digite o código de verificação de 6 dígitos enviado para o seu endereço.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Seu Nome</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Allan Silva"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">E-mail Real e Válido</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@gmail.com"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Senha Segura</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-blue-300 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Verificação ativa de domínio MX: e-mails falsos ou descartáveis são bloqueados automaticamente.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Enviar Código de Verificação'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
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
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg pl-9 pr-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] font-bold focus:outline-none focus:border-blue-500 transition"
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
                'Confirmar Código e Criar Conta'
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError(null);
                  setInfoMessage(null);
                  setCode('');
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                ← Alterar e-mail
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading}
                className="text-blue-400 hover:underline transition"
              >
                Reenviar código
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs text-zinc-400">
          Já possui cadastro?{' '}
          <Link href="/login" className="text-blue-400 font-semibold hover:underline">
            Entrar
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-zinc-500 py-2">
        APIHub • Plataforma de Gestão de APIs • Em Desenvolvimento
      </div>
    </div>
  );
}
