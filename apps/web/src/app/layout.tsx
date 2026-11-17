import '../styles/globals.css';
import type { Metadata } from 'next';
import { CookieConsentBanner } from '../components/CookieConsentBanner';

export const metadata: Metadata = {
  title: 'CloudAPI — Plataforma de Gestão, Testes e Monitoramento de APIs',
  description: 'Gerencie workspaces, documente endpoints OpenAPI, monitore uptime 24/7 e teste requisições com proteção anti-SSRF.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col antialiased">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
