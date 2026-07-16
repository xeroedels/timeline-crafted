import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { actions, formatDate, useHydrated, useTimelines } from "@/lib/timeline-store";
import { Star, Plus, MoreHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Timeline Studio" },
      {
        name: "description",
        content:
          "Your Timeline Studio workspace. Browse recent timelines, favorites, and templates.",
      },
    ],
  }),
  component: DashboardPage,
});

const TEMPLATES = [
  { name: "Novel writing", accent: "mint", blurb: "Chapters, drafts, revisions." },
  { name: "Game development", accent: "violet", blurb: "Sprints, alpha, launch." },
  { name: "Company roadmap", accent: "mint", blurb: "Quarters and milestones." },
  { name: "Relationship timeline", accent: "violet", blurb: "Moments that mattered." },
  { name: "Family tree", accent: "mint", blurb: "Generations and events." },
  { name: "Project management", accent: "violet", blurb: "Phases and reviews." },
  { name: "Historical timeline", accent: "mint", blurb: "Eras and turning points." },
  { name: "Travel journal", accent: "violet", blurb: "Trips, cities, memories." },
  { name: "Life milestones", accent: "mint", blurb: "The years so far." },
];

function DashboardPage() {
  const timelines = useTimelines();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

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

  const createFromTemplate = (name: string) => {
    const t = actions.createTimeline(name);
    navigate({ to: "/timeline/$id", params: { id: t.id } });
  };

  return (
    <AppShell>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-mint/20 blur-3xl aurora-drift" />
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-violet/20 blur-3xl aurora-drift" style={{ animationDelay: "-6s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto p-6 md:p-10 space-y-12">
          <section className="animate-reveal">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Workspace
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">
              Craft time,{" "}
              <span className="bg-gradient-to-r from-mint to-violet bg-clip-text text-transparent">
                beautifully.
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground leading-relaxed">
              Design interactive timelines for novels, roadmaps, journeys, and lives — with
              a luminous, keyboard-first editor.
            </p>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard label="Active Timelines" value={String(stats.total)} accent="mint" />
            <StatCard label="Total Events" value={String(stats.events)} accent="violet" />
            <StatCard label="Favorites" value={String(stats.favorites)} accent="mint" />
          </section>

          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-xl tracking-tight">Recent timelines</h2>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter..."
                className="w-40 bg-surface border border-border rounded-md py-1 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-mint/50"
              />
            </div>

            {!hydrated ? (
              <TimelineGridSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState onCreate={() => {
                const t = actions.createTimeline();
                navigate({ to: "/timeline/$id", params: { id: t.id } });
              }} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((t, i) => (
                  <TimelineCard key={t.id} timeline={t} index={i} />
                ))}
              </div>
            )}
          </section>

          {!hydrated ? (
            <section>
              <h2 className="font-display text-xl tracking-tight mb-4">Favorites</h2>
              <FavoritesSkeleton />
            </section>
          ) : favorites.length > 0 ? (
            <section>
              <h2 className="font-display text-xl tracking-tight mb-4">Favorites</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                {favorites.map((t) => (
                  <Link
                    key={t.id}
                    to="/timeline/$id"
                    params={{ id: t.id }}
                    className="shrink-0 w-64 p-4 bg-surface border border-border rounded-2xl hover:border-mint/40 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="size-3.5 fill-mint text-mint" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Pinned
                      </span>
                    </div>
                    <div className="font-display text-base truncate group-hover:text-mint transition-colors">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t.events.length} events
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-4 text-violet" />
              <h2 className="font-display text-xl tracking-tight">Start from a template</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => createFromTemplate(tpl.name)}
                  className="text-left p-5 rounded-2xl bg-surface/50 border border-border hover:border-violet/40 hover:bg-surface transition-all group"
                >
                  <div
                    className={
                      "size-8 rounded-lg mb-3 " +
                      (tpl.accent === "mint"
                        ? "bg-mint/15 border border-mint/30"
                        : "bg-violet/15 border border-violet/30")
                    }
                  />
                  <div className="font-display text-sm font-medium">{tpl.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{tpl.blurb}</div>
                </button>
              ))}
            </div>
          </section>

          <footer className="pt-8 pb-4 text-xs text-muted-foreground/70 text-center">
            Timeline Studio · Synced to your account
          </footer>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "mint" | "violet" }) {
  return (
    <div className="relative p-5 bg-surface rounded-2xl border border-border overflow-hidden">
      <div
        className={
          "absolute -top-4 -right-4 w-24 h-24 blur-3xl " +
          (accent === "mint" ? "bg-mint/20" : "bg-violet/20")
        }
      />
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className="text-3xl font-display font-semibold">{value}</p>
    </div>
  );
}

function TimelineCard({ timeline, index }: { timeline: ReturnType<typeof useTimelines>[number]; index: number }) {
  return (
    <Link
      to="/timeline/$id"
      params={{ id: timeline.id }}
      className="group animate-reveal block p-5 bg-surface/60 border border-border rounded-2xl hover:border-mint/50 hover:bg-surface transition-all"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="font-display text-base font-medium truncate group-hover:text-mint transition-colors">
            {timeline.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Updated {formatDate(new Date(timeline.updatedAt).toISOString().slice(0, 10))}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            actions.toggleFavorite(timeline.id);
          }}
          className="p-1 rounded hover:bg-white/5 transition-colors"
          aria-label="Toggle favorite"
        >
          <Star
            className={
              "size-4 transition-colors " +
              (timeline.favorite ? "fill-mint text-mint" : "text-muted-foreground")
            }
          />
        </button>
      </div>

      <div className="relative h-14 rounded-lg bg-background/50 border border-border overflow-hidden p-3">
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-mint via-violet to-transparent opacity-50 ml-3" />
        <div className="flex items-center gap-3 h-full pl-1">
          {timeline.events.slice(0, 5).map((e, idx) => (
            <div
              key={e.id}
              className={
                "size-2 rounded-full " +
                (e.color === "mint" ? "bg-mint" : "bg-violet") +
                " shadow-[0_0_8px_currentColor]"
              }
              style={{ opacity: 1 - idx * 0.12 }}
            />
          ))}
          {timeline.events.length === 0 && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Empty
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-muted-foreground">{timeline.events.length} events</span>
        <MoreHorizontal className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-12 rounded-2xl border border-dashed border-border text-center">
      <div className="mx-auto size-12 rounded-xl bg-gradient-to-br from-mint/30 to-violet/30 grid place-items-center mb-4">
        <Plus className="size-5" />
      </div>
      <div className="font-display text-lg mb-1">No timelines yet</div>
      <div className="text-sm text-muted-foreground mb-4">
        Create your first timeline to get started.
      </div>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-mint text-mint-foreground rounded-md text-sm font-semibold hover:brightness-110"
      >
        <Plus className="size-4" /> New timeline
      </button>
    </div>
  );
}

function TimelineGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-5 bg-surface/40 border border-border rounded-2xl animate-pulse">
          <div className="h-4 w-2/3 rounded bg-white/5 mb-3" />
          <div className="h-3 w-1/3 rounded bg-white/5 mb-5" />
          <div className="h-14 rounded-lg bg-background/40 border border-border" />
          <div className="h-3 w-1/4 rounded bg-white/5 mt-4" />
        </div>
      ))}
    </div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-hidden pb-2 -mx-1 px-1" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="shrink-0 w-64 p-4 bg-surface/40 border border-border rounded-2xl animate-pulse">
          <div className="h-3 w-16 rounded bg-white/5 mb-4" />
          <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
          <div className="h-3 w-1/3 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
