'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.auth.login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'E-mail ou senha incorretos.');
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

      <div className="max-w-md w-full mx-auto my-auto p-5 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
            λ
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Entrar no CloudAPI</h1>
          <p className="text-xs text-zinc-400">
            Acesse seus workspaces, documentações e ferramentas de teste
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">E-mail</label>
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Senha</label>
              <Link href="/recuperar-senha" className="text-xs text-blue-400 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              'Acessar Plataforma'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-blue-400 font-semibold hover:underline">
            Criar conta gratuita
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-zinc-500 py-2">
        CloudAPI • Plataforma de Gestão de APIs • Em Desenvolvimento
      </div>
    </div>
  );
}
