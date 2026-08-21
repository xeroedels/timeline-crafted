import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reloadTimelines, setTimelineSpace } from "@/lib/timeline-store";

export type Workspace = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
};

export type WorkspaceInvite = {
  id: string;
  email: string;
  acceptedAt: string | null;
  createdAt: string;
};

type SpaceCache = {
  loaded: boolean;
  userId: string | null;
  onboardingCompleted: boolean;
  currentWorkspaceId: string | null;
  workspaces: Workspace[];
  invites: WorkspaceInvite[];
  memberCount: number;
};

const EMPTY: SpaceCache = {
  loaded: false,
  userId: null,
  onboardingCompleted: false,
  currentWorkspaceId: null,
  workspaces: [],
  invites: [],
  memberCount: 0,
};

let cache: SpaceCache = { ...EMPTY };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setCache(next: SpaceCache) {
  cache = next;
  setTimelineSpace(next.currentWorkspaceId);
  emit();
}

async function ensureProfile(userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (data) return data;
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .single();
  if (error) {
    console.error("[space-store] profile", error);
    return null;
  }
  return created;
}

async function loadWorkspaces(userId: string) {
  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[space-store] memberships", error);
    return [] as Workspace[];
  }

  const ids = [...new Set((memberships ?? []).map((m) => m.workspace_id))];
  if (!ids.length) return [];

  const [{ data: workspaceRows, error: wsError }, { data: allMembers }] = await Promise.all([
    supabase.from("workspaces").select("*").in("id", ids),
    supabase.from("workspace_members").select("workspace_id").in("workspace_id", ids),
  ]);

  if (wsError) {
    console.error("[space-store] workspaces", wsError);
    return [];
  }

  const counts = new Map<string, number>();
  (allMembers ?? []).forEach((row) => {
    counts.set(row.workspace_id, (counts.get(row.workspace_id) ?? 0) + 1);
  });

  return (workspaceRows ?? []).map(
    (row) =>
      ({
        id: row.id,
        name: row.name,
        createdBy: row.created_by,
        createdAt: row.created_at,
        memberCount: counts.get(row.id) ?? 1,
      }) satisfies Workspace,
  );
}

async function loadInvites(workspaceId: string | null) {
  if (!workspaceId) return [] as WorkspaceInvite[];
  const { data, error } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[space-store] invites", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }));
}

async function loadSpace(userId: string) {
  const profile = await ensureProfile(userId);
  const workspaces = await loadWorkspaces(userId);
  let currentWorkspaceId = profile?.last_workspace_id ?? null;
  if (currentWorkspaceId && !workspaces.some((w) => w.id === currentWorkspaceId)) {
    currentWorkspaceId = null;
  }
  const invites = await loadInvites(currentWorkspaceId);
  const current = workspaces.find((w) => w.id === currentWorkspaceId);
  setCache({
    loaded: true,
    userId,
    onboardingCompleted: !!profile?.onboarding_completed,
    currentWorkspaceId,
    workspaces,
    invites,
    memberCount: current?.memberCount ?? 0,
  });
}

let bootstrapped = false;
function ensureBootstrap() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  supabase.auth.getUser().then(({ data }) => {
    const uid = data.user?.id ?? null;
    if (uid) void loadSpace(uid);
    else setCache({ ...EMPTY, loaded: true });
  });
  supabase.auth.onAuthStateChange((_evt, session) => {
    const uid = session?.user?.id ?? null;
    if (uid === cache.userId && cache.loaded) return;
    if (uid) void loadSpace(uid);
    else setCache({ ...EMPTY, loaded: true });
  });
}

export function useSpace(): SpaceCache {
  return useSyncExternalStore(
    (l) => {
      ensureBootstrap();
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => cache,
    () => EMPTY,
  );
}

async function requireUserId() {
  if (cache.userId) return cache.userId;
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Not signed in");
  await loadSpace(uid);
  return uid;
}

export const spaceActions = {
  async completeOnboarding(currentWorkspaceId: string | null) {
    const userId = await requireUserId();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      onboarding_completed: true,
      last_workspace_id: currentWorkspaceId,
    });
    if (error) {
      console.error("[space-store] completeOnboarding", error);
      throw error;
    }
    const invites = await loadInvites(currentWorkspaceId);
    const current = cache.workspaces.find((w) => w.id === currentWorkspaceId);
    setCache({
      ...cache,
      onboardingCompleted: true,
      currentWorkspaceId,
      invites,
      memberCount: current?.memberCount ?? 0,
    });
    reloadTimelines();
  },

  async setSpace(workspaceId: string | null) {
    const userId = await requireUserId();
    const invites = await loadInvites(workspaceId);
    const current = cache.workspaces.find((w) => w.id === workspaceId);
    setCache({
      ...cache,
      currentWorkspaceId: workspaceId,
      invites,
      memberCount: current?.memberCount ?? 0,
    });
    void supabase
      .from("profiles")
      .update({ last_workspace_id: workspaceId })
      .eq("id", userId);
    reloadTimelines();
  },

  async createWorkspace(name: string, inviteEmails: string[] = []): Promise<Workspace> {
    const userId = await requireUserId();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Workspace name is required");

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({ id, name: trimmed, created_by: userId })
      .select("*")
      .single();
    if (error || !workspace) {
      console.error("[space-store] createWorkspace", error);
      throw error ?? new Error("Could not create workspace");
    }

    const { error: memberError } = await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "owner",
    });
    if (memberError) {
      console.error("[space-store] owner member", memberError);
      throw memberError;
    }

    const emails = inviteEmails
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    if (emails.length) {
      const { error: inviteError } = await supabase.from("workspace_invites").insert(
        emails.map((email) => ({
          workspace_id: workspace.id,
          email,
          invited_by: userId,
        })),
      );
      if (inviteError) console.error("[space-store] invites", inviteError);
      else {
        await Promise.all(
          emails.map((email) =>
            supabase.rpc("claim_workspace_invites_for_email", { _email: email }),
          ),
        );
      }
    }

    const created: Workspace = {
      id: workspace.id,
      name: workspace.name,
      createdBy: workspace.created_by,
      createdAt: workspace.created_at,
      memberCount: 1,
    };
    const invites = await loadInvites(workspace.id);
    setCache({
      ...cache,
      workspaces: [created, ...cache.workspaces],
      currentWorkspaceId: workspace.id,
      invites,
      memberCount: 1,
    });
    reloadTimelines();
    return created;
  },

  async inviteEmails(emails: string[]) {
    const userId = await requireUserId();
    if (!cache.currentWorkspaceId) return;
    const cleaned = emails
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    if (!cleaned.length) return;
    const { error } = await supabase.from("workspace_invites").insert(
      cleaned.map((email) => ({
        workspace_id: cache.currentWorkspaceId!,
        email,
        invited_by: userId,
      })),
    );
    if (error) {
      console.error("[space-store] invite", error);
      throw error;
    }
    await Promise.all(
      cleaned.map((email) => supabase.rpc("claim_workspace_invites_for_email", { _email: email })),
    );
    const invites = await loadInvites(cache.currentWorkspaceId);
    setCache({ ...cache, invites });
  },
};
