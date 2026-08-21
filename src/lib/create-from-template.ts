import { actions } from "@/lib/timeline-store";
import type { TimelineTemplate } from "@/lib/templates";

export function createFromTemplate(template: TimelineTemplate, options?: { asPersonal?: boolean }) {
  const asPersonal = options?.asPersonal ?? false;
  return actions.createTimeline({
    name: template.name,
    templateId: template.id,
    mode: asPersonal ? "personal" : template.kind,
    stages: template.stages.map((s) => ({
      name: s.name,
      requiresApproval: asPersonal ? false : s.requiresApproval,
    })),
  });
}
