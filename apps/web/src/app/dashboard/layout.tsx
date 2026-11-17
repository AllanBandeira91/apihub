'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Terminal,
  BookOpen,
  Key,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  FolderGit2,
  Settings,
  Sliders,
  Activity,
  BarChart3,
  Plus,
  Check,
  FlaskConical,
  Webhook,
  Gauge,
  Search
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { CommandPalette } from '../../components/CommandPalette';
import { api, getStoredUser, setActiveWorkspaceId, getActiveWorkspaceId } from '../../lib/api';

interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
  userRole?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceOption | null>(null);
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [isNewWsModalOpen, setIsNewWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push('/login');
      return;
    }

    setUser(stored);
    const firstName = (stored.name || '').trim().split(/\s+/)[0] || 'Meu';
    setActiveWorkspace({ id: getActiveWorkspaceId() || '', name: `${firstName}'s Workspace`, slug: '' });
    setIsCheckingAuth(false);

    Promise.all([api.workspaces.bootstrap(), api.workspaces.list()])
      .then(([boot, wsList]) => {
        setWorkspaces(wsList);
        setActiveWorkspace({
          id: boot.workspace.id,
          name: boot.workspace.name,
          slug: boot.workspace.slug,
          userRole: boot.workspace.role,
        });
      })
      .catch(() => {});

    api.auth
      .getMe()
      .then(remoteUser => {
        if (remoteUser) setUser(remoteUser);
      })
      .catch(() => {});
  }, [router]);

  const handleSelectWorkspace = (ws: WorkspaceOption) => {
    setActiveWorkspaceId(ws.id);
    setActiveWorkspace(ws);
    setIsWsDropdownOpen(false);
    window.location.reload();
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    setWsError(null);
    try {
      const slugBase =
        newWsName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 24) || 'workspace';
      const slug = `${slugBase}-${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await api.workspaces.create({
        name: newWsName.trim(),
        slug,
        description: newWsDesc.trim() || undefined,
      });
      setActiveWorkspaceId(created.id);
      setIsNewWsModalOpen(false);
      setNewWsName('');
      setNewWsDesc('');
      window.location.reload();
    } catch (err: any) {
      setWsError(err?.message || 'Erro ao criar workspace.');
    } finally {
      setCreatingWs(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
    { label: 'APIs & Endpoints', href: '/dashboard/apis', icon: FolderGit2 },
    { label: 'API Tester Seguro', href: '/dashboard/tester', icon: Terminal },
    { label: 'Bateria de Testes', href: '/dashboard/runner', icon: FlaskConical },
    { label: 'Benchmark de Carga', href: '/dashboard/benchmark', icon: Gauge },
    { label: 'Webhook Inspector', href: '/dashboard/webhooks', icon: Webhook },
    { label: 'Ambientes & Variáveis', href: '/dashboard/environments', icon: Sliders },
    { label: 'Monitoramento', href: '/dashboard/monitors', icon: Activity },
    { label: 'Métricas & Auditoria', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Documentação OpenAPI', href: '/dashboard/docs', icon: BookOpen },
    { label: 'Gerenciador de Chaves', href: '/dashboard/keys', icon: Key },
    { label: 'Configurações', href: '/dashboard/settings', icon: Settings },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400">Carregando workspace seguro...</p>
        </div>
      </div>
    );
  }

  const currentWorkspaceName = activeWorkspace?.name || 'Meu Workspace';
  const initialLetter = (currentWorkspaceName[0] || user?.name?.[0] || 'W').toUpperCase();
  const userInitial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--border)] bg-[var(--card)] p-4 justify-between sticky top-0 h-screen">
        <div className="space-y-5 overflow-y-auto pr-0.5">
          {/* Logo & Multi-Workspace Selector */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                λ
              </div>
              <span className="font-bold text-lg tracking-tight">CloudAPI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800">
                PRO
              </span>
            </Link>

            <div className="pt-1 relative">
              <button
                type="button"
                onClick={() => setIsWsDropdownOpen(prev => !prev)}
                className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-black/30 flex items-center justify-between gap-2 text-xs hover:border-zinc-700 transition overflow-hidden"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <div className="w-6 h-6 rounded bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {initialLetter}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden text-left">
                    <p className="font-semibold text-zinc-200 truncate text-xs" title={currentWorkspaceName}>
                      {currentWorkspaceName}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {activeWorkspace?.userRole || 'OWNER'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              </button>

              {isWsDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-zinc-950 shadow-2xl p-1.5 z-50 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">
                    Seus Workspaces
                  </p>
                  <div className="max-h-44 overflow-y-auto space-y-0.5">
                    {workspaces.map(ws => {
                      const isSelected = ws.id === activeWorkspace?.id;
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => handleSelectWorkspace(ws)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition text-left ${
                            isSelected
                              ? 'bg-blue-600/20 text-blue-300 font-semibold'
                              : 'text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          <span className="truncate">{ws.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-zinc-800 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsWsDropdownOpen(false);
                        setIsNewWsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-emerald-400 hover:bg-zinc-900 font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Criar Novo Workspace
                    </button>
                  </div>
                </div>
              )}
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-zinc-400 hover:text-foreground hover:bg-black/20'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-[var(--border)] overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300 flex-shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name || 'Desenvolvedor'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair da Conta"
              className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-black/20 transition flex-shrink-0"
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
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-[var(--border)] flex-shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 overflow-hidden">
              <span className="text-zinc-500 flex-shrink-0">Workspace</span>
              <span className="text-zinc-600 flex-shrink-0">/</span>
              <span className="font-semibold truncate max-w-[180px] sm:max-w-xs" title={currentWorkspaceName}>
                {currentWorkspaceName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 hover:text-foreground transition border border-[var(--border)] bg-black/20 px-3 py-1.5 rounded-lg"
              title="Busca rápida (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Ctrl K
              </kbd>
            </button>
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
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>

        <footer className="border-t border-[var(--border)] px-4 sm:px-8 py-4 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CloudAPI • Conformidade com a Lei Geral de Proteção de Dados (LGPD)</span>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/privacidade" className="hover:underline">Privacidade</Link>
            <Link href="/termos" className="hover:underline">Termos</Link>
            <Link href="/canal-titular" className="text-emerald-400 hover:underline">Canal DPO</Link>
          </div>
        </footer>
      </div>

      <CommandPalette open={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

      {/* Create Workspace Modal */}
      {isNewWsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Criar Novo Workspace
              </h3>
              <button onClick={() => setIsNewWsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {wsError && <p className="text-xs text-red-400">{wsError}</p>}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nome do Workspace</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  placeholder="Ex: Equipe Backend"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Descrição (Opcional)</label>
                <input
                  type="text"
                  value={newWsDesc}
                  onChange={e => setNewWsDesc(e.target.value)}
                  placeholder="APIs e monitoramento da equipe"
                  className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsNewWsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  {creatingWs ? 'Criando...' : 'Criar Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
