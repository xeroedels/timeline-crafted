import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

import {
  actions,
  formatDate,
  sortedEvents,
  useTimeline,
  type TimelineEvent,
} from "@/lib/timeline-store";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Star,
  Trash2,
  Copy,
  Download,
  Upload,
  Share2,
  Undo2,
  Redo2,
  ArrowLeft,
} from "lucide-react";
import { Goal, goalActions, useGoals } from "@/lib/goal-store";

export const Route = createFileRoute("/_authenticated/timeline/$id")({
  head: () => ({
    meta: [
      { title: "Editor — ChronoFlow" },
      { name: "description", content: "Edit your timeline in ChronoFlow." },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  const timeline = useTimeline(id);
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const goals = useGoals();
  const goalsForThisTimeline = goals.filter((goal) => goal.timeline_id === id);
  const events = useMemo(() => (timeline ? sortedEvents(timeline) : []), [timeline]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = goalsForThisTimeline.find((g) => g.id === selectedGoalId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;

    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [events, query]);

  useEffect(() => {
    if (!selectedId && events.length > 0) {
      setSelectedId(events[0].id);
    }
  }, [events, selectedId]);

  const selected = events.find((e) => e.id === selectedId) ?? null;

  if (!timeline) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md py-24 text-center">
          <h2 className="mb-2 font-display text-2xl">Timeline not found</h2>

          <p className="mb-6 text-sm text-muted-foreground">
            It may have been deleted, or the link is broken.
          </p>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-mint px-4 py-2 text-sm font-semibold text-mint-foreground hover:brightness-110"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleAddEvent = () => {
    const e = actions.addEvent(timeline.id);
    setSelectedId(e.id);
  };

  const handleAddGoal = async () => {
    const newGoal = await goalActions.createGoal({
      title: "",
      timeline_id: timeline.id,
    });

    setSelectedGoalId(newGoal.id);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${timeline.name}"? This cannot be undone.`)) {
      actions.deleteTimeline(timeline.id);
      navigate({ to: "/dashboard" });
    }
  };

  const handleDuplicate = () => {
    const copy = actions.duplicateTimeline(timeline.id);

    if (copy) {
      navigate({
        to: "/timeline/$id",
        params: { id: copy.id },
      });
    }
  };

  const handleExport = () => {
    const json = actions.exportJSON(timeline.id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${timeline.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  return (
    <AppShell title={timeline.name}>
      <div className="relative overflow-hidden bg-paper text-ink">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
          <div className="aurora-drift absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-coral/10 blur-3xl" />

          <div
            className="aurora-drift absolute -top-16 right-1/4 h-64 w-64 rounded-full bg-violet/10 blur-3xl"
            style={{ animationDelay: "-7s" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl p-8 md:p-16">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Link to="/dashboard" className="transition-colors hover:text-ink">
                  Workspace
                </Link>

                <span>/</span>
                <span className="text-ink">Timeline</span>
              </div>

              <input
                value={timeline.name}
                onChange={(e) => actions.renameTimeline(timeline.id, e.target.value)}
                className="w-full border-b border-transparent bg-transparent py-1 font-serif text-3xl tracking-tight outline-none transition-colors hover:border-ink/20 focus:border-coral md:text-4xl"
              />

              <div className="mt-2 font-mono text-xs text-muted-foreground">
                Autosaved · {events.length} events
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <IconBtn label="Undo" onClick={() => {}} disabled>
                <Undo2 className="size-3.5" />
              </IconBtn>

              <IconBtn label="Redo" onClick={() => {}} disabled>
                <Redo2 className="size-3.5" />
              </IconBtn>

              <div className="mx-1 h-5 w-px bg-ink/15" />

              <IconBtn label="Favorite" onClick={() => actions.toggleFavorite(timeline.id)}>
                <Star
                  className={
                    "size-3.5 " +
                    (timeline.favorite ? "fill-coral text-coral" : "text-muted-foreground")
                  }
                />
              </IconBtn>

              <IconBtn label="Duplicate" onClick={handleDuplicate}>
                <Copy className="size-3.5" />
              </IconBtn>

              <IconBtn label="Export JSON" onClick={handleExport}>
                <Download className="size-3.5" />
              </IconBtn>

              <IconBtn
                label="Import"
                onClick={() => document.getElementById("import-json")?.click()}
              >
                <Upload className="size-3.5" />
              </IconBtn>

              <input
                id="import-json"
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const text = await file.text();
                  const t = actions.importJSON(text);

                  if (t) {
                    navigate({
                      to: "/timeline/$id",
                      params: { id: t.id },
                    });
                  }
                }}
              />

              <IconBtn label="Share" onClick={handleShare}>
                <Share2 className="size-3.5" />
              </IconBtn>

              <IconBtn label="Delete" onClick={handleDelete} destructive>
                <Trash2 className="size-3.5" />
              </IconBtn>

              <button
                onClick={handleAddEvent}
                className="ml-1 inline-flex items-center gap-1.5 bg-ink px-4 py-2.5 text-xs font-medium text-paper transition-transform hover:-translate-y-0.5"
              >
                <Plus className="size-3.5" />
                Event
              </button>
            </div>
          </div>

          <div className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Goals · {goalsForThisTimeline.length}
              </h3>

              <button
                onClick={handleAddGoal}
                className="inline-flex items-center gap-1.5 border border-violet/40 bg-violet/10 px-4 py-2.5 text-xs font-medium text-violet transition-colors hover:bg-violet/20"
              >
                <Plus className="size-3.5" />
                Goal
              </button>
            </div>

            {goalsForThisTimeline.length === 0 ? (
              <div className="border-t border-dashed border-ink/25 bg-tint/60 p-6 text-center text-sm text-muted-foreground">
                No goals yet for this timeline.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {goalsForThisTimeline.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    selected={selectedGoalId === goal.id}
                    onSelect={() => setSelectedGoalId(goal.id)}
                  />
                ))}
              </div>
            )}

            {selectedGoal && (
              <div className="mt-6">
                <GoalInspector goal={selectedGoal} onClose={() => setSelectedGoalId(null)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-8 md:gap-12">
            <div className="col-span-12 lg:col-span-8">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-serif text-2xl text-ink">Event stream</h3>

                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {filtered.length}
                      {query ? ` of ${events.length}` : ""} events
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {query
                      ? `Showing results for “${query}”.`
                      : "Capture the moments that move this timeline forward."}
                  </p>
                </div>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter events..."
                  aria-label="Filter timeline events"
                  className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-coral sm:w-40"
                />
              </div>

              {events.length === 0 ? (
                <div className="border-t border-dashed border-ink/25 bg-tint/60 p-12 text-center shadow-[0_14px_35px_rgba(37,35,31,0.06)]">
                  <div className="mb-1 font-serif text-2xl">No events yet</div>

                  <div className="mb-6 text-sm leading-7 text-muted-foreground">
                    Add your first event to start the timeline.
                  </div>

                  <button
                    onClick={handleAddEvent}
                    className="inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
                  >
                    <Plus className="size-4" />
                    Add event
                  </button>
                </div>
              ) : (
                <div className="relative pl-12">
                  <div className="timeline-spine absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-coral via-violet to-transparent opacity-50" />

                  <div className="space-y-6">
                    {filtered.map((event, i) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        index={i}
                        selected={selectedId === event.id}
                        onSelect={() => setSelectedId(event.id)}
                        timelineId={timeline.id}
                      />
                    ))}

                    <button
                      onClick={handleAddEvent}
                      className="group relative w-full animate-reveal"
                      style={{ animationDelay: `${filtered.length * 60}ms` }}
                    >
                      <div className="absolute -left-[38px] top-4 size-4 rounded-full border-2 border-ink/20 bg-paper" />

                      <div className="flex cursor-pointer items-center justify-center border-t border-dashed border-ink/25 bg-tint/50 p-5 transition-all hover:border-coral hover:bg-tint">
                        <span className="text-sm text-muted-foreground transition-colors group-hover:text-coral">
                          + Add event
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-12 lg:col-span-4">
              <div className="sticky top-4">
                <Inspector
                  timelineId={timeline.id}
                  event={selected}
                  onDelete={() => {
                    if (!selected) return;
                    actions.deleteEvent(timeline.id, selected.id);
                    setSelectedId(null);
                  }}
                  onDuplicate={() => {
                    if (!selected) return;
                    actions.duplicateEvent(timeline.id, selected.id);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={
        "group grid size-9 place-items-center border border-ink/15 bg-tint/70 text-muted-foreground shadow-[0_8px_20px_rgba(37,35,31,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-coral hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 " +
        (destructive ? "hover:border-coral/50 hover:text-coral" : "")
      }
    >
      <span className="transition-transform duration-300 group-hover:scale-110">{children}</span>
    </button>
  );
}

function EventCard({
  event,
  index,
  selected,
  onSelect,
  timelineId,
}: {
  event: TimelineEvent;
  index: number;
  selected: boolean;
  onSelect: () => void;
  timelineId: string;
}) {
  const colorClass =
    event.color === "mint" ? "border-coral text-coral" : "border-violet text-violet";

  const hoverBorder = event.category === "milestone" ? "hover:border-coral" : "hover:border-violet";

  return (
    <article className="event-reveal group relative" style={{ animationDelay: `${index * 60}ms` }}>
      <div
        className={
          "event-marker absolute -left-[38px] top-5 size-4 rounded-full border-2 bg-paper ring-4 ring-paper transition-transform " +
          colorClass +
          (selected ? " scale-125" : "")
        }
        style={{ animationDelay: `${index * 60 + 180}ms` }}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onSelect}
        aria-label={`Edit event: ${event.title || "Untitled event"}`}
        className={
          "w-full border-t p-5 text-left shadow-[0_14px_35px_rgba(37,35,31,0.08)] transition-all duration-300 hover:-translate-y-1 hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-4 focus-visible:ring-offset-paper " +
          hoverBorder +
          (selected
            ? " border-coral bg-tint shadow-[0_16px_38px_rgba(200,107,77,0.12)]"
            : " border-ink/20 bg-tint/70")
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={
              "px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] " +
              (event.category === "milestone"
                ? "bg-coral/15 text-coral"
                : "bg-violet/15 text-violet")
            }
          >
            {event.category}
          </span>

          <time
            dateTime={event.date}
            className="font-mono text-xs tracking-wide text-muted-foreground"
          >
            {formatDate(event.date)}
          </time>

          <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-coral opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            Edit
          </span>
        </div>

        <h3 className="max-w-[26ch] font-serif text-[clamp(1.5rem,3vw,2rem)] leading-[1.08] text-ink">
          {event.title || "Untitled event"}
        </h3>

        {event.description && (
          <p className="mt-4 max-w-[58ch] text-[0.9375rem] leading-7 text-muted-foreground">
            {event.description}
          </p>
        )}

        {event.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="border border-ink/10 bg-paper/80 px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </button>
    </article>
  );
}

function Inspector({
  timelineId,
  event,
  onDelete,
  onDuplicate,
}: {
  timelineId: string;
  event: TimelineEvent | null;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  if (!event) {
    return (
      <section
        aria-label="Event inspector"
        className="border-t border-ink/20 bg-tint/70 p-6 shadow-[0_14px_35px_rgba(37,35,31,0.08)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Inspector
          </h4>

          <span className="size-2 rounded-full bg-violet/50" />
        </div>

        <p className="text-sm leading-7 text-muted-foreground">
          Select an event from the timeline to edit its details.
        </p>
      </section>
    );
  }

  const update = (patch: Partial<TimelineEvent>) =>
    actions.updateEvent(timelineId, event.id, patch);

  return (
    <section
      aria-label={`Editing event: ${event.title || "Untitled event"}`}
      className="overflow-hidden border-t border-coral/60 bg-tint/80 shadow-[0_18px_45px_rgba(37,35,31,0.1)]"
    >
      <header className="border-b border-ink/10 bg-paper/70 p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-coral">
            Editing event
          </span>

          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {event.category}
          </span>
        </div>

        <h4 className="font-serif text-2xl leading-tight text-ink">
          {event.title || "Untitled event"}
        </h4>
      </header>

      <div className="space-y-7 p-6">
        <section>
          <h5 className="mb-4 border-b border-ink/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Core details
          </h5>

          <div className="space-y-5">
            <Field label="Title">
              <input
                value={event.title}
                onChange={(e) => update({ title: e.target.value })}
                className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm text-ink outline-none transition-colors focus:border-coral"
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  value={event.date}
                  onChange={(e) => update({ date: e.target.value })}
                  className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm text-ink outline-none transition-colors focus:border-coral"
                />
              </Field>

              <Field label="Category">
                <select
                  value={event.category}
                  onChange={(e) =>
                    update({
                      category: e.target.value as TimelineEvent["category"],
                    })
                  }
                  className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm text-ink outline-none transition-colors focus:border-coral"
                >
                  <option value="milestone">Milestone</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="review">Review</option>
                  <option value="launch">Launch</option>
                  <option value="note">Note</option>
                </select>
              </Field>
            </div>
          </div>
        </section>

        <section>
          <h5 className="mb-4 border-b border-ink/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Content
          </h5>

          <Field label="Description">
            <textarea
              value={event.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={4}
              className="w-full resize-none border-b border-ink/25 bg-transparent px-1 py-2 text-sm leading-6 text-ink outline-none transition-colors focus:border-coral"
            />
          </Field>
        </section>

        <section>
          <h5 className="mb-4 border-b border-ink/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Metadata
          </h5>

          <div className="space-y-5">
            <Field label="Tags (comma separated)">
              <input
                value={event.tags.join(", ")}
                onChange={(e) =>
                  update({
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm text-ink outline-none transition-colors focus:border-coral"
              />
            </Field>

            <Field label="Accent color">
              <div className="flex gap-3">
                <ColorSwatch
                  color="mint"
                  active={event.color === "mint"}
                  onClick={() => update({ color: "mint" })}
                />
                <ColorSwatch
                  color="violet"
                  active={event.color === "violet"}
                  onClick={() => update({ color: "violet" })}
                />
              </div>
            </Field>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 border-t border-ink/10 pt-6">
          <button
            onClick={onDuplicate}
            className="border border-ink/15 bg-paper/60 py-2.5 text-xs text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          >
            Duplicate
          </button>

          <button
            onClick={onDelete}
            className="border border-coral/30 bg-coral/10 py-2.5 text-xs text-coral transition-colors hover:bg-coral/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          >
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>

      {children}
    </div>
  );
}

function ColorSwatch({
  color,
  active,
  onClick,
}: {
  color: "mint" | "violet";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "size-9 rounded-full border-2 transition-all duration-300 " +
        (color === "mint" ? "border-coral bg-coral" : "border-violet bg-violet") +
        (active
          ? " scale-110 ring-2 ring-coral/40 ring-offset-2 ring-offset-tint"
          : " opacity-60 hover:scale-105 hover:opacity-100")
      }
      aria-label={color}
    />
  );
}

function GoalCard({
  goal,
  selected,
  onSelect,
}: {
  goal: Goal;
  selected: boolean;
  onSelect: () => void;
}) {
  const statusStyles: Record<string, string> = {
    not_started: "bg-ink/5 text-muted-foreground",
    in_progress: "bg-violet/15 text-violet",
    done: "bg-coral/15 text-coral",
  };

  const statusLabel: Record<string, string> = {
    not_started: "Not started",
    in_progress: "In progress",
    done: "Done",
  };

  return (
    <div
      className={
        "group relative cursor-pointer border-t p-5 shadow-[0_14px_35px_rgba(37,35,31,0.08)] transition-all duration-300 " +
        (selected
          ? "border-coral bg-tint"
          : "border-ink/20 bg-tint/70 hover:-translate-y-1 hover:border-coral")
      }
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          goalActions.deleteGoal(goal.id);
        }}
        className="absolute right-4 top-4 p-1 text-muted-foreground opacity-0 transition-all hover:text-coral group-hover:opacity-100"
        aria-label="Delete goal"
      >
        <Trash2 className="size-3.5" />
      </button>

      <span
        onClick={(e) => {
          e.stopPropagation();
          goalActions.toggleGoal(goal.id);
        }}
        className={
          "mb-4 inline-block cursor-pointer px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors " +
          (statusStyles[goal.status] ?? statusStyles.not_started)
        }
      >
        {statusLabel[goal.status] ?? goal.status}
      </span>

      <h4 className="pr-6 font-serif text-xl leading-tight text-ink">
        {goal.title || "Untitled goal"}
      </h4>

      {goal.description && (
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{goal.description}</p>
      )}
    </div>
  );
}

function GoalInspector({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const update = (changes: Partial<Omit<Goal, "id" | "created_at">>) =>
    goalActions.updateGoal(goal.id, changes);

  return (
    <section className="overflow-hidden border-t border-coral/60 bg-tint/80 shadow-[0_18px_45px_rgba(37,35,31,0.1)]">
      <header className="flex items-center justify-between border-b border-ink/10 bg-paper/60 p-5">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-coral">
            Goal inspector
          </span>

          <h4 className="mt-2 font-serif text-2xl leading-tight text-ink">
            {goal.title || "Untitled goal"}
          </h4>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-muted-foreground transition-colors hover:text-ink"
        >
          Close
        </button>
      </header>

      <div className="space-y-7 p-6">
        <section>
          <h5 className="mb-4 border-b border-ink/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Goal details
          </h5>

          <div className="space-y-5">
            <Field label="Title">
              <input
                value={goal.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Goal title"
                className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-coral"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={goal.description ?? ""}
                onChange={(e) => update({ description: e.target.value || null })}
                rows={3}
                className="w-full resize-none border-b border-ink/25 bg-transparent px-1 py-2 text-sm leading-6 outline-none transition-colors focus:border-coral"
              />
            </Field>
          </div>
        </section>

        <section>
          <h5 className="mb-4 border-b border-ink/10 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Status and planning
          </h5>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Field label="Status">
              <select
                value={goal.status}
                onChange={(e) => update({ status: e.target.value })}
                className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-coral"
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </Field>

            <Field label="Priority">
              <select
                value={goal.priority}
                onChange={(e) => update({ priority: e.target.value })}
                className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-coral"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>

            <Field label="Deadline">
              <input
                type="date"
                value={goal.deadline ? goal.deadline.slice(0, 10) : ""}
                onChange={(e) => update({ deadline: e.target.value || null })}
                className="w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-coral"
              />
            </Field>
          </div>
        </section>
      </div>
    </section>
  );
}
