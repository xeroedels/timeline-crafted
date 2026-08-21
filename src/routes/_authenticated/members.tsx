import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { spaceActions, useSpace } from "@/lib/space-store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [{ title: "Members — ChronoFlow" }],
  }),
  component: MembersPage,
});

function MembersPage() {
  const space = useSpace();
  const navigate = useNavigate();
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const workspace = space.workspaces.find((w) => w.id === space.currentWorkspaceId);

  useEffect(() => {
    if (space.loaded && !space.currentWorkspaceId) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [space.loaded, space.currentWorkspaceId, navigate]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await spaceActions.inviteEmails(emails.split(/[\s,;]+/));
      setEmails("");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not send invites");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Members">
      <div className="mx-auto max-w-2xl space-y-10 p-8 md:p-16">
        <section>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-coral">
            {workspace?.name ?? "Workspace"}
          </p>
          <h1 className="font-serif text-4xl tracking-tight">Members</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {space.memberCount} member{space.memberCount === 1 ? "" : "s"} · pending invites wait
            until that email signs up.
          </p>
        </section>

        <form onSubmit={invite} className="border-t border-ink/20 bg-tint/70 p-6">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Invite by email
          </label>
          <input
            type="text"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="name@email.com"
            className="mt-3 h-12 w-full border-b border-ink/25 bg-transparent px-1 text-sm outline-none focus:border-coral"
          />
          {err && <p className="mt-3 text-xs text-coral">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-60"
          >
            {busy ? "Saving…" : "Add invite"}
          </button>
        </form>

        <section>
          <h2 className="mb-4 font-serif text-2xl">Pending invites</h2>
          {space.invites.filter((i) => !i.acceptedAt).length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invites.</p>
          ) : (
            <ul className="space-y-3">
              {space.invites
                .filter((i) => !i.acceptedAt)
                .map((inviteRow) => (
                  <li
                    key={inviteRow.id}
                    className="border-t border-ink/15 bg-tint/60 px-4 py-3 text-sm"
                  >
                    {inviteRow.email}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
