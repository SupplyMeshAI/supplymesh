 import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  if (profile.onboarding === "pending") {
    redirect(`/auth/onboarding?role=${profile.role}`);
  }

  if (profile.role === "supplier") redirect("/dashboard/supplier");
  if (profile.role === "buyer") redirect("/dashboard/buyer");

  redirect("/auth/login");
}