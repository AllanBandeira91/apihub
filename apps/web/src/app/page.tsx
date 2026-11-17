import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { DashboardPreview } from '../features/dashboard/DashboardPreview';
import { Layers, ShieldCheck, Activity, BookOpen, Key, Sparkles, Terminal, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Em Desenvolvimento • Acesso Antecipado
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Gerencie, documente e teste suas <span className="text-blue-500">APIs</span> com precisão.
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg">
            CloudAPI é uma plataforma completa para catalogar endpoints, exportar especificações OpenAPI automáticas, executar testes protegidos contra SSRF e monitorar métricas em tempo real.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-md shadow-blue-500/20"
            >
              Criar Conta Gratuita
            </Link>
            <Link
              href="/login"
              className="border border-[var(--border)] bg-[var(--card)] hover:opacity-80 px-6 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              Entrar na Plataforma
            </Link>
            <a
              href="https://discord.gg/wBTznxGeWd"
              target="_blank"
              rel="noreferrer"
              className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-md shadow-[#5865F2]/20 flex items-center gap-2"
            >
              Comunidade Discord
            </a>
          </div>
        </div>

        {/* Live Interactive Preview */}
        <section id="tester" className="space-y-4">
          <DashboardPreview />
        </section>

        {/* Feature Grid */}
        <section id="features" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Funcionalidades do CloudAPI</h2>
            <p className="text-sm text-zinc-400">Desenvolvido com foco em segurança, padronização e custo zero.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Workspaces & Projetos</h3>
              <p className="text-sm text-zinc-400">
                Separação multi-tenant por workspace com controle granular de papéis (Owner, Admin, Editor e Viewer).
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">OpenAPI & Swagger UI</h3>
              <p className="text-sm text-zinc-400">
                Geração dinâmica de especificação OpenAPI 3.0 em JSON para todos os endpoints cadastrados, pronta para consumo e documentação.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Blindagem Anti-SSRF</h3>
              <p className="text-sm text-zinc-400">
                O API Tester bloqueia ativamente loopback (127.0.0.1), redes privadas (RFC 1918) e metadados de nuvem (169.254) antes de disparar requisições.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">API Keys Seguras</h3>
              <p className="text-sm text-zinc-400">
                Chaves de API internas com hash criptográfico SHA-256 e exibição única de segredos, ideais para pipelines e integrações.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Métricas Reais</h3>
              <p className="text-sm text-zinc-400">
                Distribuição de códigos de status HTTP, latência média e contadores derivados de logs reais, sem simulação artificial.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Backend Fastify Moderno</h3>
              <p className="text-sm text-zinc-400">
                Arquitetura de alto desempenho em TypeScript com schemas Zod, Prisma ORM e suíte automatizada de testes com Vitest.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-10 bg-[var(--card)]/40 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p>CloudAPI • Em Desenvolvimento • Acesso Antecipado</p>
            <p className="text-[11px] text-zinc-500">
              Suporte oficial: <a href="mailto:apihubsupport@gmail.com" className="text-zinc-400 hover:text-white underline">apihubsupport@gmail.com</a> • <a href="https://discord.gg/wBTznxGeWd" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Discord da Comunidade</a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-zinc-400 font-medium">
            <Link href="/privacidade" className="hover:text-foreground transition">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-foreground transition">
              Termos de Uso
            </Link>
            <Link href="/canal-titular" className="hover:text-foreground transition flex items-center gap-1 text-emerald-400">
              Canal do Titular (LGPD)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
