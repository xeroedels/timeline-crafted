import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, Star, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Timeline Studio — Beautiful interactive timelines" },
      {
        name: "description",
        content:
          "A luminous, keyboard-first editor for interactive timelines — from novels and product roadmaps to travel journals and life milestones.",
      },
      { property: "og:title", content: "Timeline Studio" },
      {
        property: "og:description",
        content: "Craft beautiful interactive timelines that sync across your devices.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const primaryHref = signedIn ? "/dashboard" : "/auth";
  const primaryLabel = signedIn ? "Open workspace" : "Get started free";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Aurora */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-mint/15 blur-3xl aurora-drift" />
        <div
          className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-violet/20 blur-3xl aurora-drift"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      {/* Nav */}
      <header className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 md:px-10 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-gradient-to-br from-mint to-violet p-[1px]">
            <div className="size-full bg-background rounded-[7px] grid place-items-center">
              <div className="size-3 rounded-full bg-mint animate-pulse" />
            </div>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Timeline Studio
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="text-sm px-4 py-2 rounded-md bg-mint text-mint-foreground font-semibold hover:brightness-110 transition-all"
            >
              Dashboard
            </button>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                className="text-sm px-4 py-2 rounded-md bg-mint text-mint-foreground font-semibold hover:brightness-110 transition-all"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-16 md:pt-24 pb-20 animate-reveal">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
          <span className="size-1.5 rounded-full bg-mint animate-pulse" />
          Cloud sync · Google sign-in
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
          Craft time,{" "}
          <span className="bg-gradient-to-r from-mint via-mint to-violet bg-clip-text text-transparent">
            beautifully.
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A luminous, keyboard-first editor for interactive timelines — from novels and
          product roadmaps to travel journals and life milestones. Synced to your account,
          available everywhere.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={primaryHref}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-mint text-mint-foreground rounded-md text-sm font-semibold hover:brightness-110 transition-all"
          >
            {primaryLabel}
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            See features
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Sparkles,
            title: "Luminous editor",
            body: "Aurora-lit surfaces, keyboard shortcuts, and a distraction-free vertical spine.",
            accent: "mint",
          },
          {
            icon: Zap,
            title: "Instant sync",
            body: "Every change writes to the cloud. Pick up right where you left off, on any device.",
            accent: "violet",
          },
          {
            icon: Star,
            title: "Yours forever",
            body: "Export any timeline to JSON. Own your data — no lock-in, ever.",
            accent: "mint",
          },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-surface/50 border border-border hover:border-mint/40 transition-colors"
            >
              <div
                className={
                  "size-10 rounded-lg mb-4 grid place-items-center " +
                  (f.accent === "mint"
                    ? "bg-mint/15 border border-mint/30 text-mint"
                    : "bg-violet/15 border border-violet/30 text-violet")
                }
              >
                <Icon className="size-5" />
              </div>
              <div className="font-display text-lg font-medium mb-1">{f.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{f.body}</div>
            </div>
          );
        })}
      </section>

      <footer className="relative z-10 border-t border-border py-8 text-center text-xs text-muted-foreground/70">
        Timeline Studio · Built with care
      </footer>
    </div>
  );
}
