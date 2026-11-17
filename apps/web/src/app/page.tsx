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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> 100% Gratuito & Open-Source
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Gerencie, documente e teste suas <span className="text-blue-500">APIs</span> com precisão.
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg">
            APIHub é uma plataforma completa para catalogar endpoints, exportar especificações OpenAPI automáticas, executar testes protegidos contra SSRF e monitorar métricas em tempo real.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#tester"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-md shadow-blue-500/20"
            >
              Experimentar API Tester
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="border border-[var(--border)] bg-[var(--card)] hover:opacity-80 px-6 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              Ver no GitHub
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
            <h2 className="text-2xl sm:text-3xl font-bold">Funcionalidades do APIHub</h2>
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

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-zinc-500">
        <p>APIHub • Desenvolvido sob licença MIT • Custo zero & código aberto</p>
      </footer>
    </div>
  );
}
