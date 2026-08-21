import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ChronoFlow" },
      {
        name: "description",
        content: "Sign in to ChronoFlow to sync your interactive timelines to the cloud.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/onboarding", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/onboarding", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });

        console.log("DATA", JSON.stringify(data, null, 2));
        console.log("ERROR", error);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      setErr(error.message);
    }

    setBusy(false);
  };
  return (
    <div className="motion-reveal relative grid min-h-screen place-items-center overflow-hidden bg-paper px-6 text-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora-drift absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-coral/10 blur-3xl" />

        <div
          className="aurora-drift absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-violet/10 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="group mb-8 flex items-center justify-center gap-4">
          <div className="logo-mark grid size-10 place-items-center rounded-full bg-ink shadow-[0_12px_28px_rgba(37,35,31,0.16)]">
            <div className="size-2 rounded-full bg-coral" />
          </div>

          <span className="font-serif text-xl tracking-tight">ChronoFlow</span>
        </Link>

        <div className="border-t border-ink/20 bg-tint/80 p-8 shadow-[0_24px_70px_rgba(37,35,31,0.12)] backdrop-blur-xl sm:p-10">
          <h1 className="mb-1 font-serif text-3xl leading-tight tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>

          <p className="mb-7 text-sm leading-7 text-muted-foreground">
            {mode === "signin"
              ? "Sign in to sync your timelines."
              : "Start crafting timelines that live in the cloud."}
          </p>

          <button
            onClick={google}
            className="flex h-12 w-full items-center justify-center gap-3 border border-ink/20 bg-paper text-sm font-medium transition-colors hover:bg-tint-strong"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-ink/15" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-ink/15" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 w-full border-b border-ink/25 bg-transparent px-1 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-coral"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Password
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-12 w-full border-b border-ink/25 bg-transparent px-1 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-coral"
                placeholder="••••••••"
              />
            </div>

            {err && (
              <div className="border border-coral/40 bg-coral/10 p-3 text-xs leading-5 text-coral">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-ink py-3 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-7 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-coral underline-offset-4 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-coral underline-offset-4 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          <Link to="/" className="transition-colors hover:text-ink">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
