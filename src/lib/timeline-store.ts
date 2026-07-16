import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface StoreShape {
  timelines: Timeline[];
  loaded: boolean;
  userId: string | null;
}

let cache: StoreShape = { timelines: [], loaded: false, userId: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function setCache(next: StoreShape) {
  cache = next;
  emit();
}

function localId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function loadFromDb(userId: string) {
  const [tlRes, evRes] = await Promise.all([
    supabase
      .from("timelines")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    supabase.from("timeline_events").select("*"),
  ]);
  const byTimeline = new Map<string, TimelineEvent[]>();
  (evRes.data ?? []).forEach((e) => {
    const arr = byTimeline.get(e.timeline_id) ?? [];
    arr.push({
      id: e.id,
      title: e.title,
      description: e.description ?? "",
      date: e.date,
      category: e.category as EventCategory,
      tags: e.tags ?? [],
      color: (e.color === "violet" ? "violet" : "mint") as "mint" | "violet",
    });
    byTimeline.set(e.timeline_id, arr);
  });
  const timelines: Timeline[] = (tlRes.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description ?? "",
    favorite: !!t.favorite,
    createdAt: new Date(t.created_at).getTime(),
    updatedAt: new Date(t.updated_at).getTime(),
    events: byTimeline.get(t.id) ?? [],
  }));
  setCache({ timelines, loaded: true, userId });
}

let bootstrapped = false;
function ensureBootstrap() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  supabase.auth.getUser().then(({ data }) => {
    const uid = data.user?.id ?? null;
    if (uid) void loadFromDb(uid);
    else setCache({ timelines: [], loaded: true, userId: null });
  });
  supabase.auth.onAuthStateChange((_evt, session) => {
    const uid = session?.user?.id ?? null;
    if (uid === cache.userId) return;
    if (uid) void loadFromDb(uid);
    else setCache({ timelines: [], loaded: true, userId: null });
  });
}

const EMPTY: Timeline[] = [];

export function useTimelines(): Timeline[] {
  return useSyncExternalStore(
    (l) => {
      ensureBootstrap();
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => cache.timelines,
    () => EMPTY,
  );
}

export function useTimeline(id: string | undefined): Timeline | undefined {
  const timelines = useTimelines();
  return timelines.find((t) => t.id === id);
}

/** True once the store has done its first load (from Supabase). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    ensureBootstrap();
    if (cache.loaded) {
      setHydrated(true);
      return;
    }
    const cb = () => {
      if (cache.loaded) setHydrated(true);
    };
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return hydrated;
}

function patchLocal(fn: (ts: Timeline[]) => Timeline[]) {
  setCache({ ...cache, timelines: fn(cache.timelines) });
}

function fireAndForget<T>(p: PromiseLike<T>) {
  Promise.resolve(p).then(
    () => {},
    (err) => console.error("[timeline-store]", err),
  );
}

export const actions = {
  createTimeline(name = "Untitled Timeline"): Timeline {
    const id = localId();
    const now = Date.now();
    const t: Timeline = {
      id,
      name,
      description: "",
      favorite: false,
      createdAt: now,
      updatedAt: now,
      events: [],
    };
    patchLocal((ts) => [t, ...ts]);
    if (cache.userId) {
      fireAndForget(
        supabase.from("timelines").insert({ id, user_id: cache.userId, name }),
      );
    }
    return t;
  },

  renameTimeline(id: string, name: string) {
    patchLocal((ts) =>
      ts.map((t) => (t.id === id ? { ...t, name, updatedAt: Date.now() } : t)),
    );
    fireAndForget(supabase.from("timelines").update({ name }).eq("id", id));
  },

  deleteTimeline(id: string) {
    patchLocal((ts) => ts.filter((t) => t.id !== id));
    fireAndForget(supabase.from("timelines").delete().eq("id", id));
  },

  duplicateTimeline(id: string): Timeline | undefined {
    const src = cache.timelines.find((t) => t.id === id);
    if (!src || !cache.userId) return;
    const newId = localId();
    const now = Date.now();
    const events = src.events.map((e) => ({ ...e, id: localId() }));
    const copy: Timeline = {
      ...src,
      id: newId,
      name: `${src.name} (copy)`,
      favorite: false,
      createdAt: now,
      updatedAt: now,
      events,
    };
    patchLocal((ts) => [copy, ...ts]);
    const userId = cache.userId;
    fireAndForget(
      (async () => {
        await supabase.from("timelines").insert({
          id: newId,
          user_id: userId,
          name: copy.name,
          description: copy.description,
        });
        if (events.length) {
          await supabase.from("timeline_events").insert(
            events.map((e) => ({
              id: e.id,
              timeline_id: newId,
              user_id: userId,
              title: e.title,
              description: e.description,
              date: e.date,
              category: e.category,
              tags: e.tags,
              color: e.color,
            })),
          );
        }
      })(),
    );
    return copy;
  },

  toggleFavorite(id: string) {
    const t = cache.timelines.find((x) => x.id === id);
    if (!t) return;
    const fav = !t.favorite;
    patchLocal((ts) => ts.map((x) => (x.id === id ? { ...x, favorite: fav } : x)));
    fireAndForget(supabase.from("timelines").update({ favorite: fav }).eq("id", id));
  },

  addEvent(timelineId: string, partial?: Partial<TimelineEvent>): TimelineEvent {
    const event: TimelineEvent = {
      id: localId(),
      title: partial?.title ?? "New event",
      description: partial?.description ?? "",
      date: partial?.date ?? new Date().toISOString().slice(0, 10),
      category: partial?.category ?? "milestone",
      tags: partial?.tags ?? [],
      color: partial?.color ?? "mint",
    };
    patchLocal((ts) =>
      ts.map((t) =>
        t.id === timelineId
          ? { ...t, events: [...t.events, event], updatedAt: Date.now() }
          : t,
      ),
    );
    if (cache.userId) {
      fireAndForget(
        supabase.from("timeline_events").insert({
          id: event.id,
          timeline_id: timelineId,
          user_id: cache.userId,
          title: event.title,
          description: event.description,
          date: event.date,
          category: event.category,
          tags: event.tags,
          color: event.color,
        }),
      );
    }
    return event;
  },

  updateEvent(timelineId: string, eventId: string, patch: Partial<TimelineEvent>) {
    patchLocal((ts) =>
      ts.map((t) =>
        t.id === timelineId
          ? {
              ...t,
              updatedAt: Date.now(),
              events: t.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
            }
          : t,
      ),
    );
    const dbPatch: {
      title?: string;
      description?: string;
      date?: string;
      category?: string;
      tags?: string[];
      color?: string;
    } = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    if (Object.keys(dbPatch).length) {
      fireAndForget(supabase.from("timeline_events").update(dbPatch).eq("id", eventId));
    }
  },

  deleteEvent(timelineId: string, eventId: string) {
    patchLocal((ts) =>
      ts.map((t) =>
        t.id === timelineId
          ? {
              ...t,
              events: t.events.filter((e) => e.id !== eventId),
              updatedAt: Date.now(),
            }
          : t,
      ),
    );
    fireAndForget(supabase.from("timeline_events").delete().eq("id", eventId));
  },

  duplicateEvent(timelineId: string, eventId: string) {
    const t = cache.timelines.find((x) => x.id === timelineId);
    const src = t?.events.find((e) => e.id === eventId);
    if (!t || !src || !cache.userId) return;
    const newEvent: TimelineEvent = {
      ...src,
      id: localId(),
      title: `${src.title} (copy)`,
    };
    patchLocal((ts) =>
      ts.map((x) =>
        x.id === timelineId
          ? { ...x, events: [...x.events, newEvent], updatedAt: Date.now() }
          : x,
      ),
    );
    fireAndForget(
      supabase.from("timeline_events").insert({
        id: newEvent.id,
        timeline_id: timelineId,
        user_id: cache.userId,
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        category: newEvent.category,
        tags: newEvent.tags,
        color: newEvent.color,
      }),
    );
  },

  exportJSON(id: string): string {
    const t = cache.timelines.find((x) => x.id === id);
    return JSON.stringify(t, null, 2);
  },

  importJSON(json: string): Timeline | undefined {
    try {
      const parsed = JSON.parse(json) as Timeline;
      if (!cache.userId) return;
      const newId = localId();
      const now = Date.now();
      const events = (parsed.events ?? []).map((e) => ({ ...e, id: localId() }));
      const t: Timeline = {
        ...parsed,
        id: newId,
        createdAt: now,
        updatedAt: now,
        events,
      };
      patchLocal((ts) => [t, ...ts]);
      const userId = cache.userId;
      fireAndForget(
        (async () => {
          await supabase.from("timelines").insert({
            id: newId,
            user_id: userId,
            name: t.name,
            description: t.description,
            favorite: t.favorite,
          });
          if (events.length) {
            await supabase.from("timeline_events").insert(
              events.map((e) => ({
                id: e.id,
                timeline_id: newId,
                user_id: userId,
                title: e.title,
                description: e.description,
                date: e.date,
                category: e.category,
                tags: e.tags,
                color: e.color,
              })),
            );
          }
        })(),
      );
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
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
