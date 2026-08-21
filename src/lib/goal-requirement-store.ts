import { supabase } from "@/integrations/supabase/client";
import { useEffect, useSyncExternalStore } from "react";

export type GoalRequirement = {
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  description: string | null;
  goal_id: string;
  id: string;
  sort_order: number;
  title: string;
  updated_at: string;
};

type GoalRequirementListener = () => void;

let goalRequirements: GoalRequirement[] = [];
const listeners = new Set<GoalRequirementListener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const goalRequirementActions = {
  async deleteGoalRequirement(id: string) {
    const { error } = await supabase.from("goal_requirements").delete().eq("id", id);
    if (error) {
      console.error("Error deleting goal requirement:", error);
      throw error;
    }
    goalRequirements = goalRequirements.filter((gr) => gr.id !== id);
    notify();
  },

  async createRequirement(data: {
    goal_id: string;
    title: string;
    description?: string;
  }): Promise<GoalRequirement> {
    const existingSortOrders = goalRequirements
      .filter((r) => r.goal_id === data.goal_id)
      .map((r) => r.sort_order);
    const nextSortOrder = Math.max(-1, ...existingSortOrders) + 1;

    const { data: newRequirement, error } = await supabase
      .from("goal_requirements")
      .insert({
        goal_id: data.goal_id,
        title: data.title,
        description: data.description ?? null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating goal requirement:", error);
      throw error;
    }
    goalRequirements = [newRequirement, ...goalRequirements];
    notify();
    return newRequirement;
  },

  async updateRequirement(
    id: string,
    changes: Partial<Omit<GoalRequirement, "id" | "created_at">>,
  ) {
    goalRequirements = goalRequirements.map((gr) => (gr.id === id ? { ...gr, ...changes } : gr));
    notify();
    const { error } = await supabase.from("goal_requirements").update(changes).eq("id", id);
    if (error) {
      console.error("Error updating goal requirement:", error);
      throw error;
    }
  },
  async toggleRequirement(id: string) {
    const requirement = goalRequirements.find((gr) => gr.id === id);
    if (!requirement) {
      throw new Error("Goal requirement not found");
    }
    const completed = !requirement.completed;
    const completed_at = completed ? new Date().toISOString() : null;

    await goalRequirementActions.updateRequirement(id, { completed, completed_at });
  },
};

export function subscribeGoalRequirements(listener: GoalRequirementListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRequirements() {
  return goalRequirements;
}
export async function loadRequirements() {
  const { data, error } = await supabase.from("goal_requirements").select("*");
  if (error) {
    console.error("Error loading requirements:", error);
    return;
  }
  goalRequirements = data.map((requirement) => ({
    ...requirement,
    created_at: requirement.created_at,
  }));
  notify();
}

export function useGoalRequirements() {
  useEffect(() => {
    loadRequirements();
  }, []);
  return useSyncExternalStore(subscribeGoalRequirements, getRequirements);
}
