import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Goal = {
  color: string | null;
  created_at: string;
  deadline: string | null;
  description: string | null;
  icon: string | null;
  id: string;
  priority: string;
  status: string;
  timeline_id: string;
  title: string;
  updated_at: string;
};

type GoalListener = () => void;

let goals: Goal[] = [];
const listeners = new Set<GoalListener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const goalActions = {
  async createGoal(data: {
    title: string;
    description?: string;
    timeline_id: string;
  }): Promise<Goal> {
    const { data: newGoal, error } = await supabase
      .from("goals")
      .insert({
        title: data.title,
        description: data.description ?? null,
        timeline_id: data.timeline_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
    goals = [newGoal, ...goals];
    notify();
    return newGoal;
  },

  async updateGoal(id: string, changes: Partial<Omit<Goal, "id" | "created_at">>) {
    goals = goals.map((goal) => (goal.id === id ? { ...goal, ...changes } : goal));
    notify();
    const { error } = await supabase.from("goals").update(changes).eq("id", id);
    if (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  },

  async deleteGoal(id: string) {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
    goals = goals.filter((goal) => goal.id !== id);
    notify();
  },

  async toggleGoal(id: string) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    let newStatus = goal.status;

    if (goal.status === "not_started") newStatus = "done";
    else if (goal.status === "done") {
      newStatus = "not_started";
    }
    await goalActions.updateGoal(id, { status: newStatus });
  },
};

export function subscribeGoals(listener: GoalListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGoals() {
  return goals;
}

export async function loadGoals() {
  const { data, error } = await supabase.from("goals").select("*");
  if (error) {
    console.error("Error loading goals:", error);
    return;
  }
  goals = data.map((goal) => ({
    ...goal,
    created_at: goal.created_at,
  }));
  notify();
}

supabase.auth.onAuthStateChange((_event, _session) => {
  loadGoals();
});

export function useGoals() {
  useEffect(() => {
    loadGoals();
  }, []);
  return useSyncExternalStore(subscribeGoals, getGoals);
}
