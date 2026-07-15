import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Home,
  LayoutList,
  Star,
  LayoutTemplate,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import { actions, useTimelines } from "@/lib/timeline-store";
import { useNavigate } from "@tanstack/react-router";

const navItems = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/timelines", label: "All Timelines", icon: LayoutList },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/trash", label: "Trash", icon: Trash2 },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const timelines = useTimelines();
  const navigate = useNavigate();

  const handleCreate = () => {
    const t = actions.createTimeline();
    navigate({ to: "/timeline/$id", params: { id: t.id } });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl p-4">
        <Link to="/" className="flex items-center gap-3 px-2 mb-8">
          <div className="size-8 rounded-lg bg-gradient-to-br from-mint to-violet p-[1px]">
            <div className="size-full bg-background rounded-[7px] flex items-center justify-center">
              <div className="size-3 rounded-full bg-mint animate-pulse" />
            </div>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Timeline Studio
          </span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors " +
                  (active
                    ? "bg-white/5 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]")
                }
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Recent
          </div>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {timelines.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                to="/timeline/$id"
                params={{ id: t.id }}
                className={
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors " +
                  (pathname === `/timeline/${t.id}`
                    ? "bg-white/5 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]")
                }
              >
                <span className="size-1.5 rounded-full bg-mint/70 shrink-0" />
                <span className="truncate">{t.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="p-3 bg-violet/10 rounded-xl border border-violet/20">
            <p className="text-[11px] font-mono text-violet uppercase tracking-wider mb-2">
              Local mode
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Timelines are saved to this browser. Sync arrives in v2.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="md:hidden font-display font-semibold">
              Timeline Studio
            </Link>
            {title && (
              <div className="hidden md:block font-display text-sm text-muted-foreground truncate">
                {title}
              </div>
            )}
          </div>

          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search timelines..."
                className="w-full bg-surface border border-border rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-mint/50 transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mint text-mint-foreground rounded-md text-xs font-semibold hover:brightness-110 transition-all"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New Timeline</span>
            <span className="sm:hidden">New</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
