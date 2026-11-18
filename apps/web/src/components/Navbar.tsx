'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Layers, Terminal, BookOpen, User, Menu, X } from 'lucide-react';
import { getStoredUser } from '../lib/api';

export function Navbar() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
            λ
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight">CloudAPI</span>
          <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Em Desenvolvimento
          </span>
        </Link>

        {/* Desktop Nav */}
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

        {/* Desktop Actions + Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition items-center gap-1.5 shadow-sm shadow-blue-600/20"
            >
              <User className="w-4 h-4" /> Painel
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="text-zinc-300 hover:text-white px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm shadow-blue-600/20"
              >
                Criar Conta
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Abrir menu de navegação"
            className="md:hidden p-2 rounded-lg border border-[var(--border)] text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm text-zinc-300">
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/30"
            >
              <Layers className="w-4 h-4 text-blue-400" /> Workspaces
            </a>
            <a
              href="/dashboard/tester"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/30"
            >
              <Terminal className="w-4 h-4 text-emerald-400" /> API Tester
            </a>
            <a
              href="/dashboard/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/30"
            >
              <BookOpen className="w-4 h-4 text-amber-400" /> OpenAPI
            </a>
            <a
              href="https://discord.gg/wBTznxGeWd"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/30 text-indigo-400 font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-[#5865F2]" /> Discord da Comunidade
            </a>
          </nav>

          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" /> Acessar Painel
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center border border-[var(--border)] py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
