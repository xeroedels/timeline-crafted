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

export const Route = createFileRoute("/_authenticated/timeline/$id")({
  head: () => ({
    meta: [
      { title: "Editor — Timeline Studio" },
      { name: "description", content: "Edit your timeline in Timeline Studio." },
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

  const events = useMemo(
    () => (timeline ? sortedEvents(timeline) : []),
    [timeline],
  );

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
    if (!selectedId && events.length > 0) setSelectedId(events[0].id);
  }, [events, selectedId]);

  const selected = events.find((e) => e.id === selectedId) ?? null;

  if (!timeline) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-24 text-center">
          <h2 className="font-display text-2xl mb-2">Timeline not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            It may have been deleted, or the link is broken.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-mint text-mint-foreground rounded-md text-sm font-semibold hover:brightness-110"
          >
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleAddEvent = () => {
    const e = actions.addEvent(timeline.id);
    setSelectedId(e.id);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${timeline.name}"? This cannot be undone.`)) {
      actions.deleteTimeline(timeline.id);
      navigate({ to: "/" });
    }
  };

  const handleDuplicate = () => {
    const copy = actions.duplicateTimeline(timeline.id);
    if (copy) navigate({ to: "/timeline/$id", params: { id: copy.id } });
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
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-mint/15 blur-3xl aurora-drift" />
          <div
            className="absolute -top-16 right-1/4 h-64 w-64 rounded-full bg-violet/15 blur-3xl aurora-drift"
            style={{ animationDelay: "-7s" }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto p-6 md:p-10">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Workspace
                </Link>
                <span>/</span>
                <span className="text-foreground">Timeline</span>
              </div>
              <input
                value={timeline.name}
                onChange={(e) => actions.renameTimeline(timeline.id, e.target.value)}
                className="w-full bg-transparent font-display text-2xl md:text-3xl font-semibold tracking-tight focus:outline-none focus:ring-0 border-b border-transparent hover:border-border focus:border-mint/50 transition-colors py-1"
              />
              <div className="text-xs text-muted-foreground mt-1 font-mono">
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
              <div className="w-px h-5 bg-border mx-1" />
              <IconBtn label="Favorite" onClick={() => actions.toggleFavorite(timeline.id)}>
                <Star
                  className={
                    "size-3.5 " +
                    (timeline.favorite ? "fill-mint text-mint" : "text-muted-foreground")
                  }
                />
              </IconBtn>
              <IconBtn label="Duplicate" onClick={handleDuplicate}>
                <Copy className="size-3.5" />
              </IconBtn>
              <IconBtn label="Export JSON" onClick={handleExport}>
                <Download className="size-3.5" />
              </IconBtn>
              <IconBtn label="Import" onClick={() => document.getElementById("import-json")?.click()}>
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
                  if (t) navigate({ to: "/timeline/$id", params: { id: t.id } });
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
                className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-mint text-mint-foreground rounded-md text-xs font-semibold hover:brightness-110"
              >
                <Plus className="size-3.5" />
                Event
              </button>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-12 gap-6 md:gap-8">
            {/* Timeline spine */}
            <div className="col-span-12 lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex bg-surface p-1 rounded-lg border border-border">
                  <button className="px-3 py-1 text-xs rounded-md bg-white/5">Vertical</button>
                  <button className="px-3 py-1 text-xs rounded-md text-muted-foreground opacity-60 cursor-not-allowed">
                    Horizontal
                  </button>
                  <button className="px-3 py-1 text-xs rounded-md text-muted-foreground opacity-60 cursor-not-allowed">
                    Calendar
                  </button>
                  <button className="px-3 py-1 text-xs rounded-md text-muted-foreground opacity-60 cursor-not-allowed">
                    List
                  </button>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter events..."
                  className="w-40 bg-surface border border-border rounded-md py-1 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-mint/50"
                />
              </div>

              {events.length === 0 ? (
                <div className="p-12 rounded-2xl border border-dashed border-border text-center">
                  <div className="font-display text-lg mb-1">No events yet</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Add your first event to start the timeline.
                  </div>
                  <button
                    onClick={handleAddEvent}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-mint text-mint-foreground rounded-md text-sm font-semibold hover:brightness-110"
                  >
                    <Plus className="size-4" /> Add event
                  </button>
                </div>
              ) : (
                <div className="relative pl-12">
                  <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-mint via-violet to-transparent opacity-50" />

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
                      className="relative w-full group animate-reveal"
                      style={{ animationDelay: `${filtered.length * 60}ms` }}
                    >
                      <div className="absolute -left-[38px] top-4 size-4 rounded-full bg-background border-2 border-border" />
                      <div className="bg-surface/20 border border-dashed border-border rounded-2xl p-5 flex items-center justify-center cursor-pointer hover:bg-surface/40 hover:border-mint/40 transition-all">
                        <span className="text-sm text-muted-foreground group-hover:text-mint transition-colors">
                          + Add event
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inspector */}
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
  children,
  onClick,
  label,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={
        "size-8 grid place-items-center rounded-md border border-border bg-surface hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed " +
        (destructive ? "hover:border-destructive/40 hover:text-destructive" : "")
      }
    >
      {children}
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
    event.color === "mint"
      ? "border-mint ring-mint/20"
      : "border-violet ring-violet/20";
  const hoverBorder = event.color === "mint" ? "hover:border-mint/50" : "hover:border-violet/50";
  const badgeClass =
    event.color === "mint"
      ? "bg-mint/10 text-mint"
      : "bg-violet/10 text-violet";

  return (
    <div
      className="relative group animate-reveal"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className={
          "absolute -left-[38px] top-4 size-4 rounded-full bg-background border-2 ring-4 transition-all " +
          colorClass +
          (selected ? " scale-125" : "")
        }
      />
      <button
        onClick={onSelect}
        className={
          "w-full text-left bg-surface/50 border border-border rounded-2xl p-5 transition-all " +
          hoverBorder +
          (selected ? " border-mint/60 bg-surface" : "")
        }
      >
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span
            className={
              "px-2 py-0.5 rounded text-[10px] font-mono uppercase " + badgeClass
            }
          >
            {event.category}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {formatDate(event.date)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.deleteEvent(timelineId, event.id);
            }}
            className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-opacity"
            aria-label="Delete event"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <h3 className="text-lg font-display font-medium mb-2">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[55ch]">
            {event.description}
          </p>
        )}
        {event.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-1 bg-white/5 rounded text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </button>
    </div>
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
      <div className="bg-surface border border-border rounded-2xl p-6 text-center">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Inspector
        </div>
        <p className="text-sm text-muted-foreground">
          Select an event to edit its details.
        </p>
      </div>
    );
  }

  const update = (patch: Partial<TimelineEvent>) =>
    actions.updateEvent(timelineId, event.id, patch);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border bg-white/5">
        <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Inspector
        </h4>
      </div>
      <div className="p-5 space-y-5">
        <Field label="Title">
          <input
            value={event.title}
            onChange={(e) => update({ title: e.target.value })}
            className="w-full bg-background border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-mint/50"
          />
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={event.date}
            onChange={(e) => update({ date: e.target.value })}
            className="w-full bg-background border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-mint/50 [color-scheme:dark]"
          />
        </Field>

        <Field label="Category">
          <select
            value={event.category}
            onChange={(e) =>
              update({ category: e.target.value as TimelineEvent["category"] })
            }
            className="w-full bg-background border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-mint/50"
          >
            <option value="milestone">Milestone</option>
            <option value="quarterly">Quarterly</option>
            <option value="review">Review</option>
            <option value="launch">Launch</option>
            <option value="note">Note</option>
          </select>
        </Field>

        <Field label="Description">
          <textarea
            value={event.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={4}
            className="w-full bg-background border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-mint/50 resize-none"
          />
        </Field>

        <Field label="Tags (comma separated)">
          <input
            value={event.tags.join(", ")}
            onChange={(e) =>
              update({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="w-full bg-background border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-mint/50"
          />
        </Field>

        <Field label="Accent color">
          <div className="flex gap-2">
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

        <div className="pt-4 border-t border-border flex gap-2">
          <button
            onClick={onDuplicate}
            className="flex-1 py-2 bg-surface-2 border border-border rounded-md text-xs hover:bg-white/10 transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={onDelete}
            className="flex-1 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs hover:bg-destructive/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
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
        "size-8 rounded-full transition-all " +
        (color === "mint" ? "bg-mint" : "bg-violet") +
        (active
          ? " ring-2 ring-offset-2 ring-offset-surface ring-white/40"
          : " opacity-60 hover:opacity-100")
      }
      aria-label={color}
    />
  );
}
