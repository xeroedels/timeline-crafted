export type TemplateKind = "personal" | "team";
export type TemplateAccent = "mint" | "violet";
export type DefaultView = "vertical" | "horizontal" | "kanban" | "tree";

export type TemplateStage = {
  name: string;
  requiresApproval: boolean;
};

export type TimelineTemplate = {
  id: string;
  name: string;
  kind: TemplateKind;
  accent: TemplateAccent;
  blurb: string;
  defaultView: DefaultView;
  stages: TemplateStage[];
};

export const TEMPLATES: TimelineTemplate[] = [
  {
    id: "novel-writing",
    name: "Novel writing",
    kind: "personal",
    accent: "mint",
    blurb: "Chapters, drafts, revisions.",
    defaultView: "vertical",
    stages: [
      { name: "Outline", requiresApproval: false },
      { name: "Draft", requiresApproval: false },
      { name: "Revision", requiresApproval: false },
      { name: "Publish", requiresApproval: false },
    ],
  },
  {
    id: "game-development",
    name: "Game development",
    kind: "team",
    accent: "violet",
    blurb: "Sprints, alpha, launch.",
    defaultView: "kanban",
    stages: [
      { name: "Concept", requiresApproval: true },
      { name: "Production", requiresApproval: true },
      { name: "Alpha", requiresApproval: true },
      { name: "Launch", requiresApproval: true },
    ],
  },
  {
    id: "company-roadmap",
    name: "Company roadmap",
    kind: "team",
    accent: "mint",
    blurb: "Quarters and milestones.",
    defaultView: "horizontal",
    stages: [
      { name: "Q1", requiresApproval: true },
      { name: "Q2", requiresApproval: true },
      { name: "Q3", requiresApproval: true },
      { name: "Q4", requiresApproval: true },
    ],
  },
  {
    id: "relationship-timeline",
    name: "Relationship timeline",
    kind: "personal",
    accent: "violet",
    blurb: "Moments that mattered.",
    defaultView: "horizontal",
    stages: [
      { name: "Beginning", requiresApproval: false },
      { name: "Together", requiresApproval: false },
      { name: "Milestones", requiresApproval: false },
    ],
  },
  {
    id: "family-tree",
    name: "Family tree",
    kind: "personal",
    accent: "mint",
    blurb: "Generations and events.",
    defaultView: "tree",
    stages: [
      { name: "Roots", requiresApproval: false },
      { name: "Generations", requiresApproval: false },
      { name: "Today", requiresApproval: false },
    ],
  },
  {
    id: "project-management",
    name: "Project management",
    kind: "team",
    accent: "violet",
    blurb: "Phases and reviews.",
    defaultView: "kanban",
    stages: [
      { name: "Discovery", requiresApproval: true },
      { name: "Design", requiresApproval: true },
      { name: "Build", requiresApproval: true },
      { name: "QA", requiresApproval: true },
      { name: "Launch", requiresApproval: true },
    ],
  },
  {
    id: "historical-timeline",
    name: "Historical timeline",
    kind: "personal",
    accent: "mint",
    blurb: "Eras and turning points.",
    defaultView: "horizontal",
    stages: [
      { name: "Era I", requiresApproval: false },
      { name: "Era II", requiresApproval: false },
      { name: "Era III", requiresApproval: false },
    ],
  },
  {
    id: "travel-journal",
    name: "Travel journal",
    kind: "personal",
    accent: "violet",
    blurb: "Trips, cities, memories.",
    defaultView: "vertical",
    stages: [
      { name: "Planning", requiresApproval: false },
      { name: "Trip", requiresApproval: false },
      { name: "Memories", requiresApproval: false },
    ],
  },
  {
    id: "life-milestones",
    name: "Life milestones",
    kind: "personal",
    accent: "mint",
    blurb: "The years so far.",
    defaultView: "horizontal",
    stages: [
      { name: "Early years", requiresApproval: false },
      { name: "Now", requiresApproval: false },
      { name: "Ahead", requiresApproval: false },
    ],
  },
];

export function getTemplate(id: string): TimelineTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function templatesForSpace(kind: TemplateKind): TimelineTemplate[] {
  const preferred = TEMPLATES.filter((t) => t.kind === kind);
  const rest = TEMPLATES.filter((t) => t.kind !== kind);
  return [...preferred, ...rest];
}
