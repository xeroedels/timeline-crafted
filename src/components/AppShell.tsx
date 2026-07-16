import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Home, Star, Plus, Search, LogOut } from "lucide-react";
import { actions, useTimelines } from "@/lib/timeline-store";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, exact: true },
  { to: "/dashboard#favorites", label: "Favorites", icon: Star },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const timelines = useTimelines();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleCreate = () => {
    const t = actions.createTimeline();
    navigate({ to: "/timeline/$id", params: { id: t.id } });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl p-4">
        <Link to="/dashboard" className="flex items-center gap-3 px-2 mb-8">
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
            const active = pathname === "/dashboard" && item.to.startsWith("/dashboard");
            return (
              <Link
                key={item.to}
                to="/dashboard"
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
            {timelines.length === 0 && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground/60">
                Nothing yet
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <div className="p-3 bg-mint/10 rounded-xl border border-mint/20">
            <p className="text-[11px] font-mono text-mint uppercase tracking-wider mb-2">
              Cloud sync
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your timelines are saved to your account and available on any device.
            </p>
          </div>
          {email && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-surface/40">
              <span className="text-xs text-muted-foreground truncate">{email}</span>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4 md:px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="md:hidden font-display font-semibold">
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
