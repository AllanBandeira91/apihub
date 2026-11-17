'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  Terminal,
  BookOpen,
  Key,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Shield,
  FolderGit2
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string }>({ name: 'Allan', email: 'allan@apihub.dev' });
  const [currentWorkspace, setCurrentWorkspace] = useState('Allan Workspace');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('apihub-user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('apihub-user');
    router.push('/login');
  };

  const navItems = [
    { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
    { label: 'APIs & Endpoints', href: '/dashboard/apis', icon: FolderGit2 },
    { label: 'API Tester Seguro', href: '/dashboard/tester', icon: Terminal },
    { label: 'Documentação OpenAPI', href: '/dashboard/docs', icon: BookOpen },
    { label: 'Gerenciador de Chaves', href: '/dashboard/keys', icon: Key },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--border)] bg-[var(--card)] p-4 justify-between sticky top-0 h-screen">
        <div className="space-y-6">
          {/* Logo & Workspace Selector */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                λ
              </div>
              <span className="font-bold text-lg tracking-tight">APIHub</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800">
                PRO
              </span>
            </Link>

            <div className="pt-2">
              <div className="p-2.5 rounded-xl border border-[var(--border)] bg-black/30 flex items-center justify-between text-xs cursor-pointer hover:border-zinc-700 transition">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold">
                    W
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-zinc-200 truncate">{currentWorkspace}</p>
                    <p className="text-[10px] text-zinc-500">Proprietário (Owner)</p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-zinc-400 hover:text-foreground hover:bg-black/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="space-y-3 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-black/20 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-[var(--border)]"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Workspace</span>
              <span className="text-zinc-600">/</span>
              <span className="font-semibold">{currentWorkspace}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-foreground transition border border-[var(--border)] px-3 py-1.5 rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Portal Público
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-black/30"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
