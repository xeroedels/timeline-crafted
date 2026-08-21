import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, Star, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChronoFlow — Beautiful interactive timelines" },
      {
        name: "description",
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
  const [showSplash, setShowSplash] = useState(true);
  const splashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      if (splashRef.current) {
        splashRef.current.style.opacity = "0";
        splashRef.current.style.transform =
          "perspective(1200px) scale(1.12) rotateX(-10deg) translateY(-18px)";
        splashRef.current.style.filter = "blur(8px)";
      }

      const removeTimer = window.setTimeout(() => {
        setShowSplash(false);
      }, 950);

      return () => window.clearTimeout(removeTimer);
    }, 2300);

    return () => window.clearTimeout(exitTimer);
  }, []);
  return (
    <div className="min-h-screen overflow-hidden bg-paper text-ink">
      {showSplash && (
        <div
          ref={splashRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            background: "var(--paper)",
            pointerEvents: "none",
            perspective: "1200px",
            opacity: 1,
            transform: "perspective(1200px) scale(1) rotateX(0deg)",
            filter: "blur(0)",
            transition:
              "opacity 950ms cubic-bezier(0.76, 0, 0.24, 1), transform 950ms cubic-bezier(0.76, 0, 0.24, 1), filter 950ms ease",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              transformStyle: "preserve-3d",
              animation: "splash-content-in 1500ms cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            <span
              style={{
                display: "grid",
                width: "56px",
                height: "56px",
                placeItems: "center",
                borderRadius: "999px",
                background: "var(--ink)",
                boxShadow: "0 24px 55px rgba(37, 35, 31, 0.22)",
                transformStyle: "preserve-3d",
                animation: "splash-mark-3d 1500ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "999px",
                  background: "var(--coral)",
                  boxShadow: "0 0 18px rgba(200, 107, 77, 0.7)",
                }}
              />
            </span>

            <span
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                letterSpacing: "-0.06em",
                animation: "splash-name-in 1100ms 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              ChronoFlow
            </span>

            <span
              style={{
                width: "72px",
                height: "1px",
                background: "var(--coral)",
                transformOrigin: "center",
                animation: "splash-rule-in 800ms 520ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            />

            <span
              style={{
                color: "var(--muted-foreground)",
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "10px",
                letterSpacing: "0.18em",
                textAlign: "center",
                textTransform: "uppercase",
                animation: "splash-caption-in 900ms 650ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              Visual planning, track your schedule, collaborate
            </span>
          </div>
        </div>
      )}
      <header className="motion-reveal motion-delay-1 mx-auto flex max-w-7xl items-center justify-between px-8 py-10 md:px-16 lg:px-24">
        <Link to="/" className="group flex items-center gap-4">
          <div className="logo-mark grid size-10 place-items-center rounded-full bg-ink">
            <div className="size-2 rounded-full bg-coral" />
          </div>
          <span className="font-serif text-xl tracking-tight">ChronoFlow</span>
        </Link>

        <div className="flex items-center gap-6">
          {signedIn ? (
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper"
            >
              Dashboard
            </button>
          ) : (
            <>
              <Link to="/auth" className="hidden text-sm text-muted-foreground sm:block">
                Sign in
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper"
              >
                Start for free
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="motion-reveal motion-delay-2 mx-auto grid max-w-7xl gap-16 px-8 pb-32 pt-20 md:grid-cols-[1.5fr_1fr] md:items-end md:px-16 lg:px-24 lg:pb-44">
        <div>
          <div className="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-coral">
            <span className="h-px w-10 bg-coral" />
            Cloud sync · Google sign-in
          </div>

          <h1 className="hero-title max-w-4xl font-serif text-6xl leading-[0.92] tracking-[-0.045em] md:text-8xl lg:text-[9rem]">
            Plan visually.
            <br />
            <em className="text-coral">Stay on track.</em>
          </h1>
        </div>

        <div className="max-w-sm md:justify-self-end">
          <p className="text-lg leading-8 text-muted-foreground">
            ChronoFlow helps you organize projects, study plans, events, roadmaps, travel
            itineraries, and more.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              to={primaryHref}
              className="group inline-flex items-center gap-2 border-b border-ink pb-2 text-sm font-medium"
            >
              {primaryLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a href="#features" className="text-sm text-muted-foreground">
              See features
            </a>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="motion-reveal motion-delay-3 bg-tint px-8 py-28 md:px-16 lg:px-24 lg:py-40"
      >
        <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-[0.7fr_1.3fr] lg:gap-28">
          <div className="max-w-xs">
            <p className="font-serif text-3xl leading-tight">
              Less dashboard.
              <br />
              More direction.
            </p>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
              A thoughtful workspace for the moments that deserve more than a checklist.
            </p>
          </div>

          <div className="grid gap-14 sm:grid-cols-3 sm:gap-8">
            {[
              {
                icon: Sparkles,
                title: "Visual Planning",
                body: "Plan projects, events, study schedules and more.",
              },
              {
                icon: Zap,
                title: "Cloud Sync",
                body: "Your timelines are available anywhere.",
              },
              {
                icon: Star,
                title: "Collaboration",
                body: "Invite teammates and collaborate together.",
              },
            ].map((f) => {
              const Icon = f.icon;

              return (
                <div key={f.title} className="feature-item border-t border-ink/20 pt-6">
                  <Icon className="mb-12 size-6 text-coral" strokeWidth={1.5} />
                  <div className="font-serif text-2xl leading-tight">{f.title}</div>
                  <div className="mt-3 text-sm leading-7 text-muted-foreground">{f.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl justify-between px-8 py-12 text-xs text-muted-foreground md:px-16 lg:px-24">
        <span className="font-serif text-base text-ink">ChronoFlow</span>
        <span>© 2026 ChronoFlow. Visual planning made simple.</span>
      </footer>
    </div>
  );
}
