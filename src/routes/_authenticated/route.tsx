import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const user = data.user;
    const { data: profileRes, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[auth] profiles", profileError);
      return { user };
    }

    let profile = profileRes;

    if (!profile) {
      await supabase.from("profiles").insert({ id: user.id });
      const created = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      profile = created.data;
    }

    const onOnboarding = location.pathname.startsWith("/onboarding");

    if (profile && !profile.onboarding_completed) {
      const { count } = await supabase
        .from("timelines")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) > 0) {
        await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
        profile = { ...profile, onboarding_completed: true };
      }
    }

    if (profile && !profile.onboarding_completed && !onOnboarding) {
      throw redirect({ to: "/onboarding" });
    }

    if (profile?.onboarding_completed && onOnboarding) {
      throw redirect({ to: "/dashboard" });
    }

    return { user };
  },
  component: () => <Outlet />,
});
