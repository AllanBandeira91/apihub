import '../styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'APIHub - Plataforma Open-Source de Gestão de APIs',
  description: 'Gerencie projetos, documente endpoints, teste requisições com segurança anti-SSRF e acompanhe métricas reais.',
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
      </body>
    </html>
  );
}
