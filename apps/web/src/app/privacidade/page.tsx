'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">
        <div className="space-y-3 border-b border-[var(--border)] pb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidade</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-semibold">
              LGPD Compliant
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Última atualização: 17 de Novembro de 2026 • Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              1. Visão Geral e Compromisso com a Privacidade
            </h2>
            <p>
              O <strong>APIHub</strong> valoriza a segurança e a transparência no tratamento dos dados pessoais de seus desenvolvedores e usuários. Esta Política de Privacidade descreve com clareza quais dados coletamos, por que os coletamos, como os protegemos e como você pode exercer seus direitos fundamentais assegurados pela Lei Geral de Proteção de Dados Pessoais (LGPD).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Dados Pessoais Coletados</h2>
            <p>Coletamos apenas os dados estritamente necessários para o funcionamento e a segurança da plataforma:</p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Dados Cadastrais:</strong> Nome completo, endereço de e-mail profissional e senha protegida por hash criptográfico forte (bcrypt com salt).
              </li>
              <li>
                <strong className="text-zinc-200">Dados Técnicos e de Navegação:</strong> Endereço IP anonimizado, tipo de navegador (User-Agent), timestamps de acesso e logs operacionais.
              </li>
              <li>
                <strong className="text-zinc-200">Dados de Execução do API Tester:</strong> Método HTTP, URL de destino, headers customizados, código de status e duração em milissegundos das requisições disparadas. Segredos e senhas de autorização de destino não são mantidos em texto puro.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. Finalidade e Base Legal do Tratamento</h2>
            <p>Seus dados são tratados com base nas seguintes hipóteses legais previstas no art. 7º da LGPD:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-1">
                <h3 className="font-semibold text-white text-xs">Execução de Contrato (Art. 7º, V)</h3>
                <p className="text-xs text-zinc-400">
                  Autenticar sua sessão, manter seus workspaces e permitir a documentação e execução de testes de suas APIs.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-1">
                <h3 className="font-semibold text-white text-xs">Legítimo Interesse & Segurança (Art. 7º, IX)</h3>
                <p className="text-xs text-zinc-400">
                  Prevenção de ataques cibernéticos, controle de taxa (rate limiting) e blindagem contra requisições maliciosas (anti-SSRF).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Não Compartilhamento com Terceiros</h2>
            <p>
              O APIHub <strong>não comercializa, não aluga e não compartilha</strong> dados pessoais com corretores de dados (data brokers) ou redes de publicidade direcionada. Informações só poderão ser compartilhadas caso haja obrigação legal ou ordem judicial expressa de autoridade competente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Armazenamento, Segurança e Retenção</h2>
            <p>
              Adotamos práticas técnicas e organizacionais avançadas para salvaguardar seus dados:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Senhas são salvas exclusivamente em hash irreversível (bcrypt).</li>
              <li>API Keys emitidas são criptografadas em SHA-256 e exibidas uma única vez para o criador.</li>
              <li>Comunicações são protegidas por protocolos TLS/HTTPS criptografados.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">6. Seus Direitos como Titular de Dados (Art. 18 da LGPD)</h2>
            <p>Você pode, a qualquer momento e gratuitamente, exercer os seguintes direitos:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-[var(--border)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Confirmação da existência de tratamento</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-[var(--border)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Acesso facilitado aos seus dados</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-[var(--border)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Correção de dados incompletos ou inexatos</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-[var(--border)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Exclusão definitiva da conta e dados associados</span>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl border border-blue-900/50 bg-blue-950/20 space-y-3">
            <h2 className="text-lg font-bold text-blue-300 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" /> 7. Canal do Titular (DPO / Encarregado de Dados)
            </h2>
            <p className="text-xs text-zinc-300">
              Para exercer qualquer um dos seus direitos da LGPD, tirar dúvidas ou solicitar a exclusão total do seu cadastro, acesse diretamente o nosso Canal do Titular ou envie mensagem para o nosso Encarregado de Proteção de Dados:
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/canal-titular"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                Acessar Formulário do Titular
              </Link>
              <a
                href="mailto:dpo@apihub.dev"
                className="border border-[var(--border)] bg-[var(--card)] hover:opacity-80 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-300 transition"
              >
                E-mail: dpo@apihub.dev
              </a>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-zinc-500">
        <p>APIHub • Proteção de Dados Pessoais & Conformidade LGPD • 2026</p>
      </footer>
    </div>
  );
}
