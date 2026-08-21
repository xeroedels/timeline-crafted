import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { spaceActions } from "@/lib/space-store";
import { BookOpen, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding/")({
  head: () => ({
    meta: [
      { title: "Get started — ChronoFlow" },
      {
        name: "description",
        content: "Choose a personal space or a team workspace to start planning in ChronoFlow.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const choosePersonal = async () => {
    setBusy(true);
    try {
      await spaceActions.completeOnboarding(null);
      navigate({ to: "/dashboard", replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-6 py-16 text-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora-drift absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-coral/10 blur-3xl" />
        <div
          className="aurora-drift absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-violet/10 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <div className="relative w-full max-w-3xl">
        <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-coral">
          One account. Many rooms.
        </p>
        <h1 className="text-center font-serif text-4xl leading-tight tracking-tight md:text-6xl">
          Where do you want to start?
        </h1>
        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-7 text-muted-foreground">
          You can keep a private space and join team workspaces with the same email. This is just
          your first room.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <button
            disabled={busy}
            onClick={choosePersonal}
            className="group border-t border-ink/20 bg-tint/80 p-8 text-left shadow-[0_14px_35px_rgba(37,35,31,0.08)] transition-all hover:-translate-y-1 hover:border-coral"
          >
            <BookOpen className="mb-8 size-6 text-coral" strokeWidth={1.5} />
            <div className="font-serif text-2xl">Personal</div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Novels, travel, life timelines — just for you. You can create a workspace later.
            </p>
          </button>

          <button
            disabled={busy}
            onClick={() => navigate({ to: "/onboarding/workspace" })}
            className="group border-t border-ink/20 bg-tint/80 p-8 text-left shadow-[0_14px_35px_rgba(37,35,31,0.08)] transition-all hover:-translate-y-1 hover:border-coral"
          >
            <Building2 className="mb-8 size-6 text-violet" strokeWidth={1.5} />
            <div className="font-serif text-2xl">Team / company</div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              A shared workspace. Invite people with their own emails, then hand work across stages.
            </p>
          </button>
        </div>

        <div className="mt-10 text-center">
          <button
            disabled={busy}
            onClick={choosePersonal}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
