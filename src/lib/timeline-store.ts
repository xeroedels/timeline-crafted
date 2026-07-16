import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type EventCategory = "milestone" | "quarterly" | "review" | "launch" | "note";

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO YYYY-MM-DD
  category: EventCategory;
  tags: string[];
  color: "mint" | "violet";
}

export interface Timeline {
  id: string;
  name: string;
  description: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  events: TimelineEvent[];
}

const STORAGE_KEY = "timeline-studio:v1";

// --- persistence ---------------------------------------------------------

interface StoreShape {
  timelines: Timeline[];
}

function seed(): Timeline[] {
  const now = Date.now();
  return [
    {
      id: cryptoId(),
      name: "Global Strategy 2025",
      description: "Company-wide roadmap for the coming year.",
      favorite: true,
      createdAt: now - 86400000 * 4,
      updatedAt: now - 3600 * 1000,
      events: [
        {
          id: cryptoId(),
          title: "Project Genesis: Phase Alpha",
          description:
            "Initial rollout of the unified design system and core component library architecture.",
          date: "2025-01-12",
          category: "quarterly",
          tags: ["design", "alpha"],
          color: "mint",
        },
        {
          id: cryptoId(),
          title: "Infrastructure Migration",
          description:
            "Finalizing the move to edge-computed data nodes for global synchronization.",
          date: "2025-02-04",
          category: "milestone",
          tags: ["ops"],
          color: "violet",
        },
        {
          id: cryptoId(),
          title: "Beta Launch",
          description: "Open the platform to the first cohort of 500 users.",
          date: "2025-04-18",
          category: "launch",
          tags: ["growth"],
          color: "mint",
        },
      ],
    },
    {
      id: cryptoId(),
      name: "Novel · The Wintering",
      description: "Chapter outline and revisions timeline.",
      favorite: false,
      createdAt: now - 86400000 * 12,
      updatedAt: now - 86400000 * 2,
      events: [
        {
          id: cryptoId(),
          title: "First draft complete",
          description: "Rough draft of all 24 chapters.",
          date: "2024-11-02",
          category: "milestone",
          tags: ["draft"],
          color: "violet",
        },
        {
          id: cryptoId(),
          title: "Editor review",
          description: "Full manuscript review with dev editor.",
          date: "2025-01-20",
          category: "review",
          tags: [],
          color: "mint",
        },
      ],
    },
  ];
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load(): StoreShape {
  if (typeof window === "undefined") return { timelines: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = { timelines: seed() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { timelines: [] };
  }
}

function save(store: StoreShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// --- pub/sub -------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: StoreShape | null = null;

function getStore(): StoreShape {
  if (!cache) cache = load();
  return cache;
}

function setStore(next: StoreShape) {
  cache = next;
  save(next);
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// --- hooks ---------------------------------------------------------------

const EMPTY: Timeline[] = [];

export function useTimelines(): Timeline[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => getStore().timelines,
    () => EMPTY,
  );
}

export function useTimeline(id: string | undefined): Timeline | undefined {
  const timelines = useTimelines();
  return timelines.find((t) => t.id === id);
}

/**
 * True after the client has mounted. Use to avoid rendering "empty state"
 * UI during SSR / initial hydration when the store snapshot is still empty.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

// --- actions -------------------------------------------------------------

export const actions = {
  createTimeline(name = "Untitled Timeline"): Timeline {
    const now = Date.now();
    const t: Timeline = {
      id: cryptoId(),
      name,
      description: "",
      favorite: false,
      createdAt: now,
      updatedAt: now,
      events: [],
    };
    setStore({ timelines: [t, ...getStore().timelines] });
    return t;
  },

  renameTimeline(id: string, name: string) {
    setStore({
      timelines: getStore().timelines.map((t) =>
        t.id === id ? { ...t, name, updatedAt: Date.now() } : t,
      ),
    });
  },

  deleteTimeline(id: string) {
    setStore({ timelines: getStore().timelines.filter((t) => t.id !== id) });
  },

  duplicateTimeline(id: string): Timeline | undefined {
    const src = getStore().timelines.find((t) => t.id === id);
    if (!src) return;
    const now = Date.now();
    const copy: Timeline = {
      ...src,
      id: cryptoId(),
      name: `${src.name} (copy)`,
      favorite: false,
      createdAt: now,
      updatedAt: now,
      events: src.events.map((e) => ({ ...e, id: cryptoId() })),
    };
    setStore({ timelines: [copy, ...getStore().timelines] });
    return copy;
  },

  toggleFavorite(id: string) {
    setStore({
      timelines: getStore().timelines.map((t) =>
        t.id === id ? { ...t, favorite: !t.favorite } : t,
      ),
    });
  },

  addEvent(timelineId: string, partial?: Partial<TimelineEvent>): TimelineEvent {
    const event: TimelineEvent = {
      id: cryptoId(),
      title: partial?.title ?? "New event",
      description: partial?.description ?? "",
      date: partial?.date ?? new Date().toISOString().slice(0, 10),
      category: partial?.category ?? "milestone",
      tags: partial?.tags ?? [],
      color: partial?.color ?? "mint",
    };
    setStore({
      timelines: getStore().timelines.map((t) =>
        t.id === timelineId
          ? { ...t, events: [...t.events, event], updatedAt: Date.now() }
          : t,
      ),
    });
    return event;
  },

  updateEvent(timelineId: string, eventId: string, patch: Partial<TimelineEvent>) {
    setStore({
      timelines: getStore().timelines.map((t) =>
        t.id === timelineId
          ? {
              ...t,
              updatedAt: Date.now(),
              events: t.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
            }
          : t,
      ),
    });
  },

  deleteEvent(timelineId: string, eventId: string) {
    setStore({
      timelines: getStore().timelines.map((t) =>
        t.id === timelineId
          ? { ...t, events: t.events.filter((e) => e.id !== eventId), updatedAt: Date.now() }
          : t,
      ),
    });
  },

  duplicateEvent(timelineId: string, eventId: string) {
    setStore({
      timelines: getStore().timelines.map((t) => {
        if (t.id !== timelineId) return t;
        const src = t.events.find((e) => e.id === eventId);
        if (!src) return t;
        return {
          ...t,
          updatedAt: Date.now(),
          events: [...t.events, { ...src, id: cryptoId(), title: `${src.title} (copy)` }],
        };
      }),
    });
  },

  exportJSON(id: string): string {
    const t = getStore().timelines.find((x) => x.id === id);
    return JSON.stringify(t, null, 2);
  },

  importJSON(json: string): Timeline | undefined {
    try {
      const parsed = JSON.parse(json) as Timeline;
      const now = Date.now();
      const t: Timeline = {
        ...parsed,
        id: cryptoId(),
        createdAt: now,
        updatedAt: now,
        events: (parsed.events ?? []).map((e) => ({ ...e, id: cryptoId() })),
      };
      setStore({ timelines: [t, ...getStore().timelines] });
      return t;
    } catch {
      return undefined;
    }
  },
};

export function useAction<T extends (...args: never[]) => unknown>(fn: T): T {
  return useCallback(fn, [fn]) as T;
}

export function sortedEvents(t: Timeline): TimelineEvent[] {
  return [...t.events].sort((a, b) => a.date.localeCompare(b.date));
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
