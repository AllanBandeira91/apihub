'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  FolderGit2,
  Terminal,
  FlaskConical,
  Sliders,
  Activity,
  BarChart3,
  BookOpen,
  Key,
  Settings,
  Webhook,
  Gauge,
  ArrowRight,
  X,
} from 'lucide-react';
import { api, EndpointItem, UptimeMonitorItem } from '../lib/api';

interface CommandItem {
  id: string;
  label: string;
  subtitle: string;
  category: 'Navegação' | 'Endpoint' | 'Monitor';
  href: string;
  badge?: string;
}

const STATIC_NAV_COMMANDS: CommandItem[] = [
  { id: 'nav-home', label: 'Visão Geral', subtitle: 'Painel principal e estatísticas do workspace', category: 'Navegação', href: '/dashboard' },
  { id: 'nav-apis', label: 'APIs & Endpoints', subtitle: 'Gerenciar catálogo, OpenAPI, Postman e Mock URLs', category: 'Navegação', href: '/dashboard/apis' },
  { id: 'nav-tester', label: 'API Tester Seguro', subtitle: 'Testar APIs via proxy Anti-SSRF com variáveis', category: 'Navegação', href: '/dashboard/tester' },
  { id: 'nav-runner', label: 'Bateria de Testes', subtitle: 'Asserções automatizadas e relatórios', category: 'Navegação', href: '/dashboard/runner' },
  { id: 'nav-benchmark', label: 'Benchmark de Carga', subtitle: 'Latência p50/p95/p99 e requisições por segundo', category: 'Navegação', href: '/dashboard/benchmark' },
  { id: 'nav-webhooks', label: 'Webhook Inspector', subtitle: 'Capturar e inspecionar webhooks em tempo real', category: 'Navegação', href: '/dashboard/webhooks' },
  { id: 'nav-envs', label: 'Ambientes & Variáveis', subtitle: 'Gerenciar segredos e {{VAR}} por ambiente', category: 'Navegação', href: '/dashboard/environments' },
  { id: 'nav-monitors', label: 'Monitoramento & Incidentes', subtitle: 'Uptime 24/7, StatusPage e comunicados', category: 'Navegação', href: '/dashboard/monitors' },
  { id: 'nav-analytics', label: 'Métricas & Auditoria', subtitle: 'Gráficos de tráfego e logs de auditoria', category: 'Navegação', href: '/dashboard/analytics' },
  { id: 'nav-docs', label: 'Documentação OpenAPI', subtitle: 'Exportar OpenAPI, Postman v2.1 e Markdown', category: 'Navegação', href: '/dashboard/docs' },
  { id: 'nav-keys', label: 'Gerenciador de Chaves', subtitle: 'Chaves de API para automação CI/CD', category: 'Navegação', href: '/dashboard/keys' },
  { id: 'nav-settings', label: 'Configurações', subtitle: 'Perfil, senha, equipe e LGPD', category: 'Navegação', href: '/dashboard/settings' },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dynamicItems, setDynamicItems] = useState<CommandItem[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 30);

    if (!loadedOnce) {
      api.workspaces
        .bootstrap()
        .then(async boot => {
          const [endpoints, monitors] = await Promise.all([
            api.endpoints.list(boot.project.id).catch(() => [] as EndpointItem[]),
            api.monitors.list(boot.project.id).catch(() => [] as UptimeMonitorItem[]),
          ]);

          const epItems: CommandItem[] = endpoints.slice(0, 40).map(ep => {
            const base = ep.baseUrl && !ep.baseUrl.includes('exemplo.com') ? ep.baseUrl.replace(/\/$/, '') : '';
            const fullTarget = base ? `${base}${ep.path}` : ep.path;
            return {
              id: `ep-${ep.id}`,
              label: ep.path,
              subtitle: `${ep.summary} (${ep.apiName})`,
              category: 'Endpoint',
              badge: ep.method,
              href: `/dashboard/tester?url=${encodeURIComponent(fullTarget)}&method=${ep.method}`,
            };
          });

          const monItems: CommandItem[] = monitors.slice(0, 20).map(m => ({
            id: `mon-${m.id}`,
            label: m.name,
            subtitle: `${m.url} • Uptime ${m.uptimePercent}%`,
            category: 'Monitor',
            badge: m.lastStatus,
            href: '/dashboard/monitors',
          }));

          setDynamicItems([...epItems, ...monItems]);
          setLoadedOnce(true);
        })
        .catch(() => {});
    }
  }, [open, loadedOnce]);

  if (!open) return null;

  const allItems = [...STATIC_NAV_COMMANDS, ...dynamicItems];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? allItems.filter(
        item =>
          item.label.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      )
    : allItems.slice(0, 14);

  const safeIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  const navigateTo = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter' && filtered[safeIndex]) {
      e.preventDefault();
      navigateTo(filtered[safeIndex].href);
    }
  };

  const getIcon = (item: CommandItem) => {
    if (item.category === 'Endpoint') return <Terminal className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    if (item.category === 'Monitor') return <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    switch (item.href) {
      case '/dashboard':
        return <LayoutDashboard className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/apis':
        return <FolderGit2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/tester':
        return <Terminal className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/runner':
        return <FlaskConical className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/benchmark':
        return <Gauge className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/webhooks':
        return <Webhook className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/environments':
        return <Sliders className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/monitors':
        return <Activity className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/analytics':
        return <BarChart3 className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/docs':
        return <BookOpen className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      case '/dashboard/keys':
        return <Key className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
      default:
        return <Settings className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-6 sm:pt-[12vh] p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-w-xl w-full max-h-[88vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-[var(--border)] flex-shrink-0">
          <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar páginas, endpoints, monitores..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--foreground)] placeholder:text-zinc-500 focus:outline-none min-w-0"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 transition flex-shrink-0"
            aria-label="Fechar busca"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[60vh]">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === safeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => navigateTo(item.href)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                    isSelected ? 'bg-blue-600/20 text-white' : 'text-zinc-300 hover:bg-black/25'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {getIcon(item)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {item.badge && (
                          <span className="font-mono text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-blue-300 border border-zinc-700 flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-xs font-semibold truncate">{item.label}</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 hidden sm:inline">{item.category}</span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-3 sm:px-4 py-2 border-t border-[var(--border)] bg-black/20 flex items-center justify-between text-[10px] text-zinc-500 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Abrir</span>
            <span>ESC Fechar</span>
          </div>
          <span className="hidden sm:inline">CloudAPI Command Palette</span>
        </div>
      </div>
    </div>
  );
}
