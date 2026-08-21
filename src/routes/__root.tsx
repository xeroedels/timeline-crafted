import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="motion-reveal flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 text-ink">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 grid size-10 place-items-center rounded-full bg-ink shadow-[0_12px_28px_rgba(37,35,31,0.16)]">
          <div className="size-2 rounded-full bg-coral" />
        </div>

        <h1 className="font-serif text-8xl leading-none tracking-[-0.06em] text-ink">404</h1>

        <h2 className="mt-6 font-serif text-3xl leading-tight text-ink">Page not found</h2>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8">
          <Link
            to="/"
            className="group inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
          >
            Go home
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="motion-reveal flex min-h-screen items-center justify-center overflow-hidden bg-paper px-4 text-ink">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 grid size-10 place-items-center rounded-full bg-ink shadow-[0_12px_28px_rgba(37,35,31,0.16)]">
          <div className="size-2 rounded-full bg-coral" />
        </div>

        <h1 className="font-serif text-3xl leading-tight tracking-tight text-ink">
          This page didn&apos;t load
        </h1>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="group inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
          >
            Try again
            <span className="transition-transform group-hover:rotate-90">↻</span>
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center border border-ink/20 bg-tint px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-tint-strong"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ChronoFlow — Plan Visually. Track Effortlessly." },
      {
        name: "description",
        content:
          "Plan projects, study schedules, events, roadmaps, travel, and more with ChronoFlow — the visual planning platform for everyone.",
      },
      { name: "author", content: "ChronoFlow" },
      { property: "og:title", content: "ChronoFlow" },
      {
        property: "og:description",
        content:
          "Visual planning made simple. Create timelines, roadmaps, study plans, events, and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Figtree:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    let mounted = false;
    // Use a dynamic import to avoid pulling supabase into SSR bundle unnecessarily
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      if (!mounted) mounted = true;
      return () => sub.subscription.unsubscribe();
    });
    return () => {
      mounted = false;
    };
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
