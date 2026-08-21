import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useSpace } from "@/lib/space-store";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [{ title: "Inbox — ChronoFlow" }],
  }),
  component: InboxPage,
});

function InboxPage() {
  const space = useSpace();
  const inWorkspace = !!space.currentWorkspaceId;

  return (
    <AppShell title="Inbox">
      <div className="mx-auto max-w-2xl px-8 py-20 text-center">
        <Inbox className="mx-auto mb-6 size-8 text-coral" strokeWidth={1.4} />
        <h1 className="font-serif text-3xl tracking-tight">Handoff inbox</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {inWorkspace
            ? "When a stage sends a project here, it will wait for approval before it lands in your active queue. That flow is next."
            : "Switch to a team workspace to receive handoffs from other stages."}
        </p>
      </div>
    </AppShell>
  );
}
