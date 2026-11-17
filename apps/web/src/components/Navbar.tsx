'use client';

import { ThemeToggle } from './ThemeToggle';
import { Layers, Terminal, BookOpen, Key, Activity } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            λ
          </div>
          <span className="font-bold text-xl tracking-tight">APIHub</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800">
            v1.0 (Open-Source)
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-foreground transition flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Workspaces
          </a>
          <a href="#tester" className="hover:text-foreground transition flex items-center gap-1.5">
            <Terminal className="w-4 h-4" /> API Tester
          </a>
          <a href="#openapi" className="hover:text-foreground transition flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Documentação OpenAPI
          </a>
          <a href="#keys" className="hover:text-foreground transition flex items-center gap-1.5">
            <Key className="w-4 h-4" /> API Keys
          </a>
          <a href="#metrics" className="hover:text-foreground transition flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Métricas
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            Entrar
          </button>
        </div>
      </div>
    </header>
  );
}
