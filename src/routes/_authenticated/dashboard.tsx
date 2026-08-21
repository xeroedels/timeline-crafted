import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { actions, formatDate, useHydrated, useTimelines } from "@/lib/timeline-store";
import { createFromTemplate } from "@/lib/create-from-template";
import { templatesForSpace, type TimelineTemplate } from "@/lib/templates";
import { useSpace } from "@/lib/space-store";
import { Star, Plus, MoreHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ChronoFlow" },
      {
        name: "description",
        content: "Your ChronoFlow workspace. Browse recent timelines, favorites, and templates.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const timelines = useTimelines();
  const hydrated = useHydrated();
  const space = useSpace();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [teamTemplate, setTeamTemplate] = useState<TimelineTemplate | null>(null);
  const navigate = useNavigate();

  const inWorkspace = !!space.currentWorkspaceId;
  const workspace = space.workspaces.find((w) => w.id === space.currentWorkspaceId);
  const templates = templatesForSpace(inWorkspace ? "team" : "personal");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return timelines;
    return timelines.filter((t) => t.name.toLowerCase().includes(q));
  }, [timelines, query]);

  const favorites = timelines.filter((t) => t.favorite);

  const stats = {
    total: timelines.length,
    events: timelines.reduce((n, t) => n + t.events.length, 0),
    favorites: favorites.length,
  };

  const startTemplate = (tpl: TimelineTemplate, asPersonal = false) => {
    if (tpl.kind === "team" && !inWorkspace && !asPersonal) {
      setTeamTemplate(tpl);
      return;
    }
    const t = createFromTemplate(tpl, {
      asPersonal: asPersonal || (!inWorkspace && tpl.kind === "personal"),
    });
    navigate({ to: "/timeline/$id", params: { id: t.id } });
  };

  return (
    <AppShell>
      <div className="relative overflow-hidden bg-paper text-ink">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
          <div className="aurora-drift absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
          <div
            className="aurora-drift absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-violet/10 blur-3xl"
            style={{ animationDelay: "-6s" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-16 p-8 md:p-16">
          <section className="motion-reveal max-w-3xl">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-coral">
              {inWorkspace ? workspace?.name ?? "Workspace" : "Personal"}
            </p>

            <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.045em] md:text-7xl">
              {inWorkspace ? (
                <>
                  Work across <span className="text-coral">teams.</span>
                </>
              ) : (
                <>
                  Craft time, <span className="text-coral">beautifully.</span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
              {inWorkspace
                ? "Projects in this workspace are shared with members. Stages are ready — handoff approval comes next."
                : "Design interactive timelines for novels, roadmaps, journeys, and lives. Same email can also join team workspaces."}
            </p>
          </section>

          {!inWorkspace && hydrated && timelines.length === 0 && (
            <section className="grid gap-6 md:grid-cols-2">
              <button
                onClick={() => {
                  const t = actions.createTimeline();
                  navigate({ to: "/timeline/$id", params: { id: t.id } });
                }}
                className="border-t border-ink/20 bg-tint/70 p-8 text-left transition-all hover:-translate-y-1 hover:border-coral"
              >
                <div className="font-serif text-2xl">Start on your own</div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Personal templates for novels, travel, and life — private to this account.
                </p>
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="border-t border-ink/20 bg-tint/70 p-8 text-left transition-all hover:-translate-y-1 hover:border-coral"
              >
                <div className="font-serif text-2xl">Create a workspace</div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Invite people by email. One company room, many logins — like Trello.
                </p>
              </button>
            </section>
          )}

          {inWorkspace && (
            <p className="text-sm text-muted-foreground">
              {space.memberCount} member{space.memberCount === 1 ? "" : "s"}
              {space.invites.filter((i) => !i.acceptedAt).length
                ? ` · ${space.invites.filter((i) => !i.acceptedAt).length} pending invite(s)`
                : ""}
            </p>
          )}

          <section className="grid grid-cols-2 gap-8 md:grid-cols-3">
            <StatCard
              label={inWorkspace ? "Active projects" : "Active Timelines"}
              value={String(stats.total)}
              accent="mint"
            />
            <StatCard label="Total Events" value={String(stats.events)} accent="violet" />
            <StatCard
              label={inWorkspace ? "Pending approval" : "Favorites"}
              value={inWorkspace ? "0" : String(stats.favorites)}
              accent="mint"
            />
          </section>

          <section>
            <div className="mb-6 flex items-end justify-between gap-6">
              <h2 className="font-serif text-3xl tracking-tight">
                {inWorkspace ? "Recent projects" : "Recent timelines"}
              </h2>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter..."
                className="w-40 border-b border-ink/25 bg-transparent px-1 py-2 text-xs text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-coral"
              />
            </div>

            {!hydrated ? (
              <TimelineGridSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                onCreate={() => {
                  const t = actions.createTimeline();
                  navigate({ to: "/timeline/$id", params: { id: t.id } });
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((t, i) => (
                  <TimelineCard key={t.id} timeline={t} index={i} />
                ))}
              </div>
            )}
          </section>

          {!hydrated ? (
            <section>
              <h2 className="mb-6 font-serif text-3xl tracking-tight">Favorites</h2>
              <FavoritesSkeleton />
            </section>
          ) : favorites.length > 0 ? (
            <section>
              <h2 className="mb-6 font-serif text-3xl tracking-tight">Favorites</h2>

              <div className="-mx-1 flex gap-6 overflow-x-auto px-1 pb-3">
                {favorites.map((t) => (
                  <Link
                    key={t.id}
                    to="/timeline/$id"
                    params={{ id: t.id }}
                    className="group w-64 shrink-0 border-t border-ink/20 bg-tint/70 p-5 shadow-[0_14px_35px_rgba(37,35,31,0.08)] transition-all hover:-translate-y-1 hover:border-coral"
                  >
                    <div className="mb-8 flex items-center gap-2">
                      <Star className="size-3.5 fill-coral text-coral" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Pinned
                      </span>
                    </div>

                    <div className="truncate font-serif text-xl transition-colors group-hover:text-coral">
                      {t.name}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      {t.events.length} events
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="size-4 text-coral" />
              <h2 className="font-serif text-3xl tracking-tight">Start from a template</h2>
            </div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => startTemplate(tpl)}
                  className="group border-t border-ink/20 bg-tint/60 p-6 text-left transition-all hover:-translate-y-1 hover:border-coral hover:bg-tint"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div
                      className={
                        "size-8 rounded-full " +
                        (tpl.accent === "mint" ? "bg-coral/20" : "bg-violet/20")
                      }
                    />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {tpl.kind === "team" ? "Team" : "Personal"}
                    </span>
                  </div>

                  <div className="font-serif text-xl transition-colors group-hover:text-coral">
                    {tpl.name}
                  </div>

                  <div className="mt-2 text-xs leading-6 text-muted-foreground">{tpl.blurb}</div>
                </button>
              ))}
            </div>
          </section>

          <footer className="border-t border-ink/10 pt-10 text-center text-xs text-muted-foreground">
            {inWorkspace
              ? `${workspace?.name} · Synced for everyone in this workspace`
              : "ChronoFlow · Synced to your account"}
          </footer>
        </div>
      </div>

      <CreateWorkspaceDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {teamTemplate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <button
            className="absolute inset-0"
            onClick={() => setTeamTemplate(null)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-md border-t border-ink/20 bg-paper p-8">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-coral">
              Team template
            </p>
            <h2 className="font-serif text-2xl">{teamTemplate.name}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              This template is built for a shared workspace. Create one, or use the stages here as a
              personal outline.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => {
                  setTeamTemplate(null);
                  setCreateOpen(true);
                }}
                className="bg-ink py-3 text-sm font-medium text-paper"
              >
                Create a workspace
              </button>
              <button
                onClick={() => {
                  const tpl = teamTemplate;
                  setTeamTemplate(null);
                  startTemplate(tpl, true);
                }}
                className="border border-ink/20 py-3 text-sm"
              >
                Use as personal phases
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "mint" | "violet";
}) {
  return (
    <div className="stat-card relative overflow-hidden border-t border-ink/20 bg-tint/70 p-6 shadow-[0_14px_35px_rgba(37,35,31,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-coral">
      <div
        className={
          "pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-3xl " +
          (accent === "mint" ? "bg-coral/15" : "bg-violet/15")
        }
      />

      <p className="relative mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>

      <p className="relative font-serif text-4xl leading-none tracking-tight text-ink">{value}</p>
    </div>
  );
}

function TimelineCard({
  timeline,
  index,
}: {
  timeline: ReturnType<typeof useTimelines>[number];
  index: number;
}) {
  return (
    <Link
      to="/timeline/$id"
      params={{ id: timeline.id }}
      className="group animate-reveal block border-t border-ink/20 bg-tint/70 p-6 shadow-[0_14px_35px_rgba(37,35,31,0.08)] transition-all hover:-translate-y-1 hover:border-coral hover:bg-tint"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-xl leading-tight transition-colors group-hover:text-coral">
            {timeline.name}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {timeline.stages.length
              ? timeline.stages.map((s) => s.name).join(" → ")
              : `Updated ${formatDate(new Date(timeline.updatedAt).toISOString().slice(0, 10))}`}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            actions.toggleFavorite(timeline.id);
          }}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-paper hover:text-coral"
          aria-label="Toggle favorite"
        >
          <Star
            className={
              "size-4 transition-colors " +
              (timeline.favorite ? "fill-coral text-coral" : "text-muted-foreground")
            }
          />
        </button>
      </div>

      <div className="relative h-14 overflow-hidden border-y border-ink/10 bg-paper/70 px-3 py-3">
        <div className="absolute inset-y-0 left-0 ml-3 w-px bg-gradient-to-b from-coral via-violet to-transparent opacity-60" />

        <div className="flex h-full items-center gap-3 pl-1">
          {timeline.events.slice(0, 5).map((e, idx) => (
            <div
              key={e.id}
              className={
                "size-2 rounded-full shadow-[0_0_8px_currentColor] " +
                (e.color === "mint" ? "bg-coral" : "bg-violet")
              }
              style={{ opacity: 1 - idx * 0.12 }}
            />
          ))}

          {timeline.events.length === 0 && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Empty
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{timeline.events.length} events</span>

        <MoreHorizontal className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border-t border-dashed border-ink/25 bg-tint/60 p-12 text-center shadow-[0_14px_35px_rgba(37,35,31,0.06)]">
      <div className="mx-auto mb-6 grid size-12 place-items-center rounded-full bg-coral/15 text-coral">
        <Plus className="size-5" />
      </div>

      <div className="font-serif text-2xl text-ink">No timelines yet</div>

      <div className="mx-auto mb-6 mt-3 max-w-xs text-sm leading-7 text-muted-foreground">
        Create your first timeline to get started.
      </div>

      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
      >
        <Plus className="size-4" />
        New timeline
      </button>
    </div>
  );
}

function TimelineGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse border-t border-ink/15 bg-tint/60 p-6 shadow-[0_14px_35px_rgba(37,35,31,0.06)]"
        >
          <div className="mb-4 h-4 w-2/3 rounded bg-ink/10" />
          <div className="mb-6 h-3 w-1/3 rounded bg-ink/10" />
          <div className="h-14 border-y border-ink/10 bg-paper/60" />
          <div className="mt-5 h-3 w-1/4 rounded bg-ink/10" />
        </div>
      ))}
    </div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="-mx-1 flex gap-6 overflow-x-hidden px-1 pb-2" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-64 shrink-0 animate-pulse border-t border-ink/15 bg-tint/60 p-5 shadow-[0_14px_35px_rgba(37,35,31,0.06)]"
        >
          <div className="mb-5 h-3 w-16 rounded bg-ink/10" />
          <div className="mb-3 h-4 w-3/4 rounded bg-ink/10" />
          <div className="h-3 w-1/3 rounded bg-ink/10" />
        </div>
      ))}
    </div>
  );
}
