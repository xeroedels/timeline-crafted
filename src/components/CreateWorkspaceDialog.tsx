import { useState } from "react";
import { spaceActions } from "@/lib/space-store";

export function CreateWorkspaceDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const inviteEmails = emails
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const workspace = await spaceActions.createWorkspace(name, inviteEmails);
      await spaceActions.setSpace(workspace.id);
      setName("");
      setEmails("");
      onCreated?.();
      onClose();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not create workspace");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md border-t border-ink/20 bg-paper p-8 shadow-[0_24px_70px_rgba(37,35,31,0.16)]"
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-coral">Team space</p>
        <h2 className="font-serif text-3xl tracking-tight">Create a workspace</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          A shared room for one team. Invite people with their own emails.
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

        <label className="mt-6 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Invite emails (optional)
        </label>
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={3}
          placeholder="sari@email.com, budi@email.com"
          className="mt-2 w-full resize-none border-b border-ink/25 bg-transparent px-1 py-2 text-sm outline-none focus:border-coral"
        />

        {err && <p className="mt-4 text-xs text-coral">{err}</p>}

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="bg-ink px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}
