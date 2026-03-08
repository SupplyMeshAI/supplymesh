import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Award, TrendingUp, Settings, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AppNavbar } from "@/components/ui/app-navbar";

export default async function SupplierDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: memberData } = await supabase
    .from("company_members")
    .select("company:companies(id, name, city, state_region), company_id")
    .eq("profile_id", user.id)
    .single();

  const company = (Array.isArray(memberData?.company) ? memberData.company[0] : memberData?.company) as { id: string; name: string; city: string; state_region: string } | null;

  const { data: supplierProfile } = company
    ? await supabase
        .from("supplier_profiles")
        .select("*")
        .eq("company_id", company.id)
        .single()
    : { data: null };

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const completeness = supplierProfile?.completeness_score ?? 0;

  const tips = [
    { done: (supplierProfile?.processes?.length ?? 0) > 0, label: "Add your manufacturing processes" },
    { done: (supplierProfile?.materials?.length ?? 0) > 0, label: "List your materials" },
    { done: (supplierProfile?.certifications?.length ?? 0) > 0, label: "Add certifications" },
    { done: supplierProfile?.typical_lead_time_days != null, label: "Set your typical lead time" },
    { done: supplierProfile?.tagline != null, label: "Write a shop tagline" },
    { done: supplierProfile?.description != null, label: "Add a shop description" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }}>
      <AppNavbar />

      <main style={{ maxWidth: "64rem", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a" }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            {company?.name} · {company?.city}, {company?.state_region}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>

          {/* Profile completeness */}
          <div style={{
            backgroundColor: "white", borderRadius: "0.75rem",
            border: "1px solid #e2e8f0", padding: "1.5rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontWeight: 600, color: "#0f172a" }}>Profile completeness</h2>
              <span style={{
                fontSize: "1.5rem", fontWeight: "bold",
                color: completeness >= 70 ? "var(--brand)" : "#d97706",
              }}>
                {completeness}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: "0.5rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", marginBottom: "1.25rem", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "9999px",
                backgroundColor: completeness >= 70 ? "var(--brand)" : "#f59e0b",
                width: `${completeness}%`, transition: "width 0.3s",
              }} />
            </div>

            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              Complete your profile to get matched with more RFQs
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem" }}>
                  {tip.done
                    ? <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "var(--brand)", flexShrink: 0 }} />
                    : <AlertCircle style={{ width: "1rem", height: "1rem", color: "#d1d5db", flexShrink: 0 }} />
                  }
                  <span style={{ color: tip.done ? "#94a3b8" : "#374151", textDecoration: tip.done ? "line-through" : "none" }}>
                    {tip.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <Link
                href="/profile/supplier"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "white",
                  backgroundColor: "var(--brand)",
                  textDecoration: "none",
                }}
              >
                Edit profile →
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "var(--brand-light)" }}>
                  <Award style={{ width: "1rem", height: "1rem", color: "var(--brand)" }} />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>RFQ Matches</span>
              </div>
              <div style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#0f172a", marginTop: "0.5rem" }}>—</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Coming in Phase 3</div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "var(--brand-light)" }}>
                  <TrendingUp style={{ width: "1rem", height: "1rem", color: "var(--brand)" }} />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Win Rate</span>
              </div>
              <div style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#0f172a", marginTop: "0.5rem" }}>—</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Coming in Phase 5</div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "var(--brand-light)" }}>
                  <Settings style={{ width: "1rem", height: "1rem", color: "var(--brand)" }} />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Processes</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {(supplierProfile?.processes ?? []).length > 0
                  ? supplierProfile?.processes.slice(0, 4).map((p: string) => (
                      <span key={p} style={{
                        display: "inline-flex", alignItems: "center", borderRadius: "0.375rem",
                        padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 500,
                        backgroundColor: "var(--brand-light)", color: "var(--brand)",
                        border: "1px solid rgba(23,54,80,0.15)",
                      }}>
                        {p.replace(/_/g, " ")}
                      </span>
                    ))
                  : <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>None added yet</span>
                }
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
