// src/app/dashboard/supplier/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Award, TrendingUp, Settings, CheckCircle2, AlertCircle, Inbox } from "lucide-react";
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

  // Count all active matches: matched + shortlisted + quoted
  const activeStatuses = ["matched", "shortlisted", "quoted"];
  const matchCounts = supplierProfile
    ? await Promise.all(
        activeStatuses.map(status =>
          supabase
            .from("rfq_matches")
            .select("id", { count: "exact", head: true })
            .eq("supplier_id", supplierProfile.id)
            .eq("status", status)
        )
      )
    : [];

  const matchCount = matchCounts.reduce((sum, r) => sum + (r.count ?? 0), 0);

  const shortlistedCount = supplierProfile
    ? (await supabase
        .from("rfq_matches")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", supplierProfile.id)
        .eq("status", "shortlisted")).count ?? 0
    : 0;

  const quotedCount = supplierProfile
    ? (await supabase
        .from("rfq_matches")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", supplierProfile.id)
        .eq("status", "quoted")).count ?? 0
    : 0;

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

  const ctaSubtext = quotedCount > 0
    ? `${quotedCount} quote${quotedCount !== 1 ? "s" : ""} submitted`
    : shortlistedCount > 0
    ? `${shortlistedCount} shortlisted by buyers`
    : "Review your matches and get ready to quote";

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a" }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            {company?.name} · {company?.city}, {company?.state_region}
          </p>
        </div>

        {/* RFQ Inbox CTA */}
        {matchCount > 0 && (
          <Link href="/dashboard/supplier/rfqs" style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "var(--brand)", borderRadius: "0.75rem",
              padding: "1rem 1.5rem", marginBottom: "1.5rem",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "0.5rem", borderRadius: "0.5rem" }}>
                  <Inbox style={{ width: "1.25rem", height: "1.25rem", color: "white" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>
                    You have {matchCount} active RFQ{matchCount !== 1 ? "s" : ""}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginTop: "0.1rem" }}>
                    {ctaSubtext}
                  </p>
                </div>
              </div>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "1.25rem" }}>→</span>
            </div>
          </Link>
        )}

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
              <Link href="/profile/supplier" style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.5rem 1rem", borderRadius: "0.5rem",
                fontSize: "0.875rem", fontWeight: 600,
                color: "white", backgroundColor: "var(--brand)", textDecoration: "none",
              }}>
                Edit profile →
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <Link href="/dashboard/supplier/rfqs" style={{ textDecoration: "none" }}>
              <div style={{
                backgroundColor: "white", borderRadius: "0.75rem",
                border: "1px solid #e2e8f0", padding: "1.25rem", cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                  <div style={{ padding: "0.375rem", borderRadius: "0.5rem", backgroundColor: "var(--brand-light)" }}>
                    <Award style={{ width: "1rem", height: "1rem", color: "var(--brand)" }} />
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Active RFQs</span>
                </div>
                <div style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#0f172a", marginTop: "0.5rem" }}>
                  {matchCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--brand)", marginTop: "0.15rem" }}>
                  View inbox →
                </div>
              </div>
            </Link>

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
    </div>
  );
}
