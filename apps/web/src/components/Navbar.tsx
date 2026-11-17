'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Layers, Terminal, BookOpen, User } from 'lucide-react';
import { getStoredUser } from '../lib/api';

export function Navbar() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            λ
          </div>
          <span className="font-bold text-xl tracking-tight">CloudAPI</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Em Desenvolvimento
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <a href="/#features" className="hover:text-foreground transition flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Workspaces
          </a>
          <a href="/dashboard/tester" className="hover:text-foreground transition flex items-center gap-1.5">
            <Terminal className="w-4 h-4" /> API Tester
          </a>
          <a href="/dashboard/docs" className="hover:text-foreground transition flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> OpenAPI
          </a>
          <a
            href="https://discord.gg/wBTznxGeWd"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#5865F2] transition flex items-center gap-1.5 text-zinc-300 font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-[#5865F2]" /> Discord
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
            >
              <User className="w-4 h-4" /> Acessar Painel
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-sm font-semibold transition"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm shadow-blue-600/20"
              >
                Criar Conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
