 import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Award, TrendingUp, Settings, CheckCircle2, AlertCircle, User } from "lucide-react";
import Link from "next/link";

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
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>

      {/* Nav */}
      <header style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem",
            backgroundColor: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>S</span>
          </div>
          <span style={{ fontWeight: "bold", color: "#111827", letterSpacing: "-0.025em" }}>SupplyMesh</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "#6b7280", textDecoration: "none" }}>
            <User style={{ width: "1rem", height: "1rem" }} />
            Profile
          </Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" style={{
              padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem",
              fontWeight: 500, color: "#6b7280", background: "none", border: "none", cursor: "pointer",
            }}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: "64rem", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>
            Welcome back, {firstName} 👋
          </h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            {company?.name} · {company?.city}, {company?.state_region}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>

          {/* Profile completeness */}
          <div style={{
            backgroundColor: "white", borderRadius: "0.75rem",
            border: "1px solid #e5e7eb", padding: "1.5rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontWeight: 600, color: "#111827" }}>Profile completeness</h2>
              <span style={{
                fontSize: "1.5rem", fontWeight: "bold",
                color: completeness >= 70 ? "#0d9488" : "#d97706",
              }}>
                {completeness}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: "0.5rem", backgroundColor: "#f3f4f6", borderRadius: "9999px", marginBottom: "1.25rem", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "9999px",
                backgroundColor: completeness >= 70 ? "#0d9488" : "#f59e0b",
                width: `${completeness}%`, transition: "width 0.3s",
              }} />
            </div>

            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              Complete your profile to get matched with more RFQs
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem" }}>
                  {tip.done
                    ? <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "#0d9488", flexShrink: 0 }} />
                    : <AlertCircle style={{ width: "1rem", height: "1rem", color: "#d1d5db", flexShrink: 0 }} />
                  }
                  <span style={{ color: tip.done ? "#9ca3af" : "#374151", textDecoration: tip.done ? "line-through" : "none" }}>
                    {tip.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "#f0fdfa" }}>
                  <Award style={{ width: "1rem", height: "1rem", color: "#0d9488" }} />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>RFQ Matches</span>
              </div>
              <div style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#111827", marginTop: "0.5rem" }}>—</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Coming in Phase 3</div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "#f0fdfa" }}>
                  <TrendingUp style={{ width: "1rem", height: "1rem", color: "#0d9488" }} />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Win Rate</span>
              </div>
              <div style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#111827", marginTop: "0.5rem" }}>—</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Coming in Phase 5</div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "#f0fdfa" }}>
                  <Settings style={{ width: "1rem", height: "1rem", color: "#0d9488" }} />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Processes</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {(supplierProfile?.processes ?? []).length > 0
                  ? supplierProfile?.processes.slice(0, 4).map((p: string) => (
                      <span key={p} style={{
                        display: "inline-flex", alignItems: "center", borderRadius: "0.375rem",
                        padding: "0.125rem 0.5rem", fontSize: "0.75rem", fontWeight: 500,
                        backgroundColor: "#f0fdfa", color: "#0f766e",
                        border: "1px solid rgba(13,148,136,0.2)",
                      }}>
                        {p.replace(/_/g, " ")}
                      </span>
                    ))
                  : <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>None added yet</span>
                }
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}