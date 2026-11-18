import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { CookieConsentBanner } from '../components/CookieConsentBanner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#09090b',
};

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
      <body className="min-h-screen flex flex-col antialiased overflow-x-hidden selection:bg-blue-500/20 selection:text-blue-400">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
