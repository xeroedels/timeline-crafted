import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Home, Star, Plus, Search, LogOut, Inbox, Users } from "lucide-react";
import { actions, useTimelines } from "@/lib/timeline-store";
import { spaceActions, useSpace } from "@/lib/space-store";
import { supabase } from "@/integrations/supabase/client";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const timelines = useTimelines();
  const space = useSpace();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const currentWorkspace = space.workspaces.find((w) => w.id === space.currentWorkspaceId);
  const inWorkspace = !!currentWorkspace;

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
    <div className="flex h-screen w-full overflow-hidden bg-[#f4f1eb] text-[#25231f]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#25231f]/10 bg-[#ebe6de]/70 p-5 backdrop-blur-xl md:flex">
        <Link to="/dashboard" className="group mb-8 flex items-center gap-3 px-2">
          <div className="logo-mark grid size-9 place-items-center rounded-full bg-[#25231f]">
            <div className="size-2 rounded-full bg-[#c86b4d]" />
          </div>
          <span className="font-serif text-lg tracking-tight">ChronoFlow</span>
        </Link>

        <div className="mb-8 space-y-1">
          <button
            onClick={() => spaceActions.setSpace(null)}
            className={
              "flex w-full items-center border-l-2 px-3 py-2 text-left text-sm transition-all " +
              (!inWorkspace
                ? "border-[#c86b4d] bg-[#f4f1eb]/70 font-medium text-[#25231f]"
                : "border-transparent text-[#777169] hover:border-[#c86b4d]/50 hover:bg-[#f4f1eb]/50 hover:text-[#25231f]")
            }
          >
            Personal
          </button>
          {space.workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => spaceActions.setSpace(ws.id)}
              className={
                "flex w-full items-center border-l-2 px-3 py-2 text-left text-sm transition-all " +
                (space.currentWorkspaceId === ws.id
                  ? "border-[#c86b4d] bg-[#f4f1eb]/70 font-medium text-[#25231f]"
                  : "border-transparent text-[#777169] hover:border-[#c86b4d]/50 hover:bg-[#f4f1eb]/50 hover:text-[#25231f]")
              }
            >
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex w-full items-center gap-1 px-3 py-2 text-left text-xs text-[#777169] hover:text-[#25231f]"
          >
            <Plus className="size-3" />
            Create workspace
          </button>
        </div>

        <nav className="space-y-2">
          <NavLink to="/dashboard" label="Home" icon={Home} active={pathname === "/dashboard"} />
          {inWorkspace && (
            <>
              <NavLink to="/inbox" label="Inbox" icon={Inbox} active={pathname === "/inbox"} />
              <NavLink
                to="/members"
                label="Members"
                icon={Users}
                active={pathname === "/members"}
              />
            </>
          )}
          <Link
            to="/dashboard"
            hash="favorites"
            className={
              "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-all " +
              (pathname === "/dashboard"
                ? "border-transparent text-[#777169] hover:border-[#c86b4d]/50 hover:bg-[#f4f1eb]/50 hover:text-[#25231f]"
                : "border-transparent text-[#777169] hover:border-[#c86b4d]/50 hover:bg-[#f4f1eb]/50 hover:text-[#25231f]")
            }
          >
            <Star className="size-4" />
            Favorites
          </Link>
        </nav>

        <div className="mt-7">
          <div className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#777169]">
            Recent
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {timelines.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                to="/timeline/$id"
                params={{ id: t.id }}
                className={
                  "flex items-center gap-2 px-3 py-2 text-xs transition-colors " +
                  (pathname === `/timeline/${t.id}`
                    ? "bg-[#f4f1eb]/70 text-[#25231f]"
                    : "text-[#777169] hover:bg-[#f4f1eb]/50 hover:text-[#25231f]")
                }
              >
                <span className="size-1.5 shrink-0 rounded-full bg-[#c86b4d]" />
                <span className="truncate">{t.name}</span>
              </Link>
            ))}

            {timelines.length === 0 && (
              <div className="px-3 py-2 text-xs text-[#777169]/60">Nothing yet</div>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="border-t border-[#c86b4d]/40 bg-[#c86b4d]/10 p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#c86b4d]">
              {inWorkspace ? currentWorkspace.name : "Personal space"}
            </p>
            <p className="text-xs leading-6 text-[#777169]">
              {inWorkspace
                ? "Shared with your team. Switch to Personal anytime."
                : "Private to you. Create a workspace to work with others."}
            </p>
          </div>

          {email && (
            <div className="flex items-center justify-between gap-2 border-t border-[#25231f]/15 px-3 py-3">
              <span className="truncate text-xs text-[#777169]">{email}</span>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="p-1 text-[#777169] transition-colors hover:text-[#c86b4d]"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#25231f]/10 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/dashboard" className="font-serif text-lg tracking-tight md:hidden">
              ChronoFlow
            </Link>
            {title && (
              <div className="hidden truncate font-serif text-lg text-[#777169] md:block">
                {title}
              </div>
            )}
          </div>

          <div className="hidden max-w-md flex-1 sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#777169]" />
              <input
                type="text"
                placeholder="Search timelines..."
                className="w-full border-b border-[#25231f]/20 bg-transparent py-2 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-[#777169] focus:border-[#c86b4d]"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 bg-[#25231f] px-4 py-2.5 text-xs font-medium text-[#f4f1eb] transition-transform hover:-translate-y-0.5"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">{inWorkspace ? "New project" : "New Timeline"}</span>
            <span className="sm:hidden">New</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      <CreateWorkspaceDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: "/dashboard" | "/inbox" | "/members";
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-all " +
        (active
          ? "border-[#c86b4d] bg-[#f4f1eb]/70 font-medium text-[#25231f]"
          : "border-transparent text-[#777169] hover:border-[#c86b4d]/50 hover:bg-[#f4f1eb]/50 hover:text-[#25231f]")
      }
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
