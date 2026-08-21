import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { spaceActions } from "@/lib/space-store";

export const Route = createFileRoute("/_authenticated/onboarding/workspace")({
  head: () => ({
    meta: [{ title: "Create a workspace — ChronoFlow" }],
  }),
  component: OnboardingWorkspacePage,
});

function OnboardingWorkspacePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"name" | "invite">("name");
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async (inviteList: string[]) => {
    setBusy(true);
    setErr(null);
    try {
      const workspace = await spaceActions.createWorkspace(name, inviteList);
      await spaceActions.completeOnboarding(workspace.id);
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not create workspace");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-6 py-16 text-ink">
      <div className="relative w-full max-w-md">
        <Link
          to="/onboarding"
          className="mb-8 inline-block text-xs text-muted-foreground hover:text-ink"
        >
          ← Back
        </Link>

        {step === "name" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setStep("invite");
            }}
            className="border-t border-ink/20 bg-tint/80 p-8 shadow-[0_24px_70px_rgba(37,35,31,0.12)]"
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-coral">
              Team / company
            </p>
            <h1 className="font-serif text-3xl tracking-tight">Name this workspace</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              You become the owner. People you invite log in with their own email — same as Trello.
            </p>

            <label className="mt-8 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Workspace name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Studio"
              className="mt-2 h-12 w-full border-b border-ink/25 bg-transparent px-1 text-sm outline-none focus:border-coral"
            />

            <button type="submit" className="mt-8 w-full bg-ink py-3 text-sm font-medium text-paper">
              Continue
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const list = emails
                .split(/[\s,;]+/)
                .map((s) => s.trim())
                .filter(Boolean);
              void create(list);
            }}
            className="border-t border-ink/20 bg-tint/80 p-8 shadow-[0_24px_70px_rgba(37,35,31,0.12)]"
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-coral">
              Optional
            </p>
            <h1 className="font-serif text-3xl tracking-tight">Invite by email</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              They join this workspace automatically when they sign up with that email. You can skip
              and invite later.
            </p>

            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={4}
              placeholder="sari@email.com&#10;budi@email.com"
              className="mt-8 w-full resize-none border-b border-ink/25 bg-transparent px-1 py-2 text-sm outline-none focus:border-coral"
            />

            {err && <p className="mt-4 text-xs text-coral">{err}</p>}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void create([])}
                className="flex-1 border border-ink/20 py-3 text-sm"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-ink py-3 text-sm font-medium text-paper disabled:opacity-60"
              >
                {busy ? "Creating…" : "Create workspace"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
