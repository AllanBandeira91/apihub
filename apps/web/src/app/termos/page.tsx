'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert, CheckCircle, Scale } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export default function TermosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">
        <div className="space-y-3 border-b border-[var(--border)] pb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Termos de Uso e Condições</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800 font-semibold flex items-center gap-1">
              <Scale className="w-3 h-3" /> Termos Gerais
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Última atualização: 17 de Novembro de 2026 • Termos reguladores do serviço CloudAPI (Em Desenvolvimento • Acesso Antecipado)
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar a plataforma <strong>CloudAPI</strong>, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição aqui estabelecida, solicitamos que não continue a utilizar os nossos serviços.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Objeto e Natureza do Serviço</h2>
            <p>
              O CloudAPI é uma plataforma web para catalogação, documentação, gestão de chaves e testes de APIs. Na sua versão atual:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>O serviço atua como catalogador e organizador de rotas de APIs preexistentes.</li>
              <li>O CloudAPI <strong>não é um serviço de hospedagem de servidores ou gateways de produção</strong>.</li>
              <li>A ferramenta de testes faz chamadas HTTP sob solicitação direta e exclusiva do usuário autenticado.</li>
            </ul>
          </section>

          <section className="p-5 rounded-2xl border border-red-900/50 bg-red-950/20 space-y-3">
            <h2 className="text-base font-bold text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" /> 3. Política de Uso Ético e Aceitável do API Tester
            </h2>
            <p className="text-xs text-zinc-300">
              O API Tester foi concebido para auxiliar desenvolvedores a inspecionar requisições e respostas de seus próprios sistemas ou de APIs públicas autorizadas. É terminantemente proibido:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-red-200">
              <li>Executar ataques de negação de serviço (DoS/DDoS) contra qualquer serviço.</li>
              <li>Tentar contornar as proteções anti-SSRF (Server-Side Request Forgery) para atingir redes privadas ou recursos de nuvem interna.</li>
              <li>Testar ou escanear vulnerabilidades em servidores de terceiros sem a expressa e documentada autorização dos mesmos.</li>
              <li>Utilizar a ferramenta para envio massivo de requisições maliciosas ou spam.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Contas, Senhas e Segurança de Chaves</h2>
            <p>
              Você é o único responsável pela custódia e confidencialidade das suas credenciais de login e das API Keys geradas. Caso identifique qualquer atividade suspeita ou vazamento de suas chaves, você deve revogá-las imediatamente pelo painel de controle.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Propriedade Intelectual e Modelo de Contribuição</h2>
            <p>
              O CloudAPI é um software em desenvolvimento ativo com modelo de código disponível para acesso antecipado e colaboração com a comunidade (não é open-source irrestrito). Desenvolvedores e parceiros podem acessar a plataforma em desenvolvimento, reportar melhorias e submeter contribuições técnicas sujeitas à revisão e incorporação pela equipe oficial do CloudAPI.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">6. Limitação de Responsabilidade</h2>
            <p>
              O serviço é fornecido "no estado em que se encontra" (as is), sem garantias implícitas ou explícitas de disponibilidade ininterrupta. Os mantenedores do projeto não se responsabilizam por eventuais instabilidades, indisponibilidade de serviços de terceiros testados pelo usuário ou perdas de dados decorrentes de falhas de rede.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">7. Contato, Suporte e Comunidade</h2>
            <p>
              Para dúvidas sobre estes Termos de Uso, colaborações ou reporte de vulnerabilidades de segurança, entre em contato através do e-mail oficial: <a href="mailto:apihubsupport@gmail.com" className="text-blue-400 underline">apihubsupport@gmail.com</a> ou junte-se à nossa comunidade no <a href="https://discord.gg/wBTznxGeWd" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Discord Oficial</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-zinc-500">
        <p>CloudAPI • Termos e Condições de Uso • 2026</p>
      </footer>
    </div>
  );
}
