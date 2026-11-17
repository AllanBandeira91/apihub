'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('apihub-cookie-consent');
    if (!consent) {
      // Delay slightly for smooth appearance
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('apihub-cookie-consent', 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('apihub-cookie-consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-2xl space-y-3 text-xs text-[var(--foreground)]">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              Privacidade & Cookies
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                LGPD
              </span>
            </h3>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Utilizamos cookies essenciais para manter você autenticado com segurança e salvar preferências de tema. Não vendemos seus dados nem usamos cookies de rastreamento invasivo.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1">
          <Link href="/privacidade" className="text-blue-400 hover:underline">
            Ler Política de Privacidade
          </Link>
          <Link href="/termos" className="text-zinc-400 hover:underline">
            Termos de Uso
          </Link>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
          <button
            onClick={handleAcceptEssential}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-black/30 font-semibold transition"
          >
            Apenas Essenciais
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-md shadow-blue-600/20"
          >
            Aceitar Todos
          </button>
        </div>
      </div>
    </div>
  );
}
