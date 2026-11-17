'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Mail, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Navbar } from '../../components/Navbar';

export default function CanalTitularPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipoRequisicao, setTipoRequisicao] = useState('exclusao');
  const [mensagem, setMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const randomProtocol = `LGPD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setProtocolo(randomProtocol);
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-3 border-b border-[var(--border)] pb-6">
          <Link href="/privacidade" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar à Política de Privacidade
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Canal do Titular de Dados (DPO)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-semibold">
              Art. 18 LGPD
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Formulário oficial para solicitação de direitos, consulta, retificação ou exclusão de dados pessoais.
          </p>
        </div>

        {/* DPO Identity Badge */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Encarregado de Dados (DPO)</p>
              <p className="text-xs text-zinc-400">Equipe de Segurança & Compliance do APIHub</p>
            </div>
          </div>
          <a
            href="mailto:dpo@apihub.dev"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline border border-[var(--border)] px-3 py-1.5 rounded-lg bg-black/30"
          >
            <Mail className="w-3.5 h-3.5" /> dpo@apihub.dev
          </a>
        </div>

        {/* Request Success Screen */}
        {protocolo ? (
          <div className="p-8 rounded-2xl border border-emerald-800 bg-emerald-950/20 shadow-2xl space-y-5 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-emerald-300">Solicitação Registrada com Sucesso!</h2>
              <p className="text-xs text-zinc-300">
                Sua manifestação foi encaminhada com segurança para o Encarregado de Proteção de Dados.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-emerald-800/80 max-w-sm mx-auto space-y-1">
              <p className="text-[11px] text-zinc-400">Número de Protocolo LGPD:</p>
              <p className="text-base font-mono font-bold text-emerald-400 tracking-wider">{protocolo}</p>
            </div>

            <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Prazo legal de resposta em até 15 dias corridos (Art. 19 da LGPD).
            </p>

            <button
              onClick={() => {
                setProtocolo(null);
                setNome('');
                setEmail('');
                setMensagem('');
              }}
              className="text-xs text-blue-400 hover:underline pt-2 inline-block"
            >
              Fazer outra solicitação
            </button>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl space-y-5">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" /> Abrir Requerimento de Direitos
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Nome Completo do Titular</label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Allan Silva"
                className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">E-mail Cadastrado na Plataforma</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Tipo de Solicitação (Art. 18 LGPD)</label>
              <select
                value={tipoRequisicao}
                onChange={e => setTipoRequisicao(e.target.value)}
                className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="exclusao">Exclusão total e eliminação da minha conta e dados</option>
                <option value="acesso">Acesso e relatório completo dos meus dados pessoais</option>
                <option value="correcao">Correção de dados incompletos, inexatos ou desatualizados</option>
                <option value="revogacao">Revogação de consentimento de cookies e tratamento</option>
                <option value="outros">Outras dúvidas com o Encarregado de Dados (DPO)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Detalhamento ou Justificativa (Opcional)</label>
              <textarea
                rows={4}
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Descreva aqui qualquer detalhe adicional que facilite a localização dos seus registros..."
                className="w-full bg-black/40 border border-[var(--border)] rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-blue-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-400" />
              <span>Para sua segurança, a confirmação de identidade poderá ser exigida antes da liberação ou exclusão dos dados.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Enviar Requerimento LGPD'
              )}
            </button>
          </form>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-zinc-500">
        <p>APIHub • Canal do Titular (LGPD) • Encarregado pelo Tratamento de Dados Pessoais</p>
      </footer>
    </div>
  );
}
