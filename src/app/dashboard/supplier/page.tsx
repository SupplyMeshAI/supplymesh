// src/app/dashboard/supplier/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Award, TrendingUp, Settings, CheckCircle2, AlertCircle, Inbox, ChevronRight } from "lucide-react";
import Link from "next/link";

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string; href?: string;
}) {
  const inner = (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "18px 20px", display: "flex", gap: "14px", alignItems: "center" }}>
      <div style={{ width: "38px", height: "38px", backgroundColor: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text)", lineHeight: 1, fontFamily: "var(--font-mono)" }}>{value}</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "5px" }}>{label}</p>
        {sub && <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</p>}
      </div>
    </div>
  );
  return href
    ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>
    : inner;
}

function SectionHeader({ title, href, count }: { title: string; href?: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
      <h2 style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
        {title}
        {count !== undefined && (
          <span style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: "var(--surface2)", color: "var(--text-muted)", padding: "1px 7px", borderRadius: "2px", fontFamily: "var(--font-mono)" }}>
            {count}
          </span>
        )}
      </h2>
      {href && (
        <Link href={href} style={{ fontSize: "0.8125rem", color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}>
          View all <ChevronRight style={{ width: "13px", height: "13px" }} />
        </Link>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SupplierDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("full_name, email").eq("id", user.id).single();

  const { data: memberData } = await supabase
    .from("company_members")
    .select("company:companies(id, name, city, state_region), company_id")
    .eq("profile_id", user.id).single();

  const company = (Array.isArray(memberData?.company) ? memberData.company[0] : memberData?.company) as
    { id: string; name: string; city: string; state_region: string } | null;

  const { data: supplierProfile } = company
    ? await supabase.from("supplier_profiles").select("*").eq("company_id", company.id).single()
    : { data: null };

  const activeStatuses = ["matched", "shortlisted", "quoted"];
  const matchCounts = supplierProfile
    ? await Promise.all(activeStatuses.map(status =>
        supabase.from("rfq_matches").select("id", { count: "exact", head: true })
          .eq("supplier_id", supplierProfile.id).eq("status", status)
      ))
    : [];
  const matchCount = matchCounts.reduce((sum, r) => sum + (r.count ?? 0), 0);

  const shortlistedCount = supplierProfile
    ? (await supabase.from("rfq_matches").select("id", { count: "exact", head: true })
        .eq("supplier_id", supplierProfile.id).eq("status", "shortlisted")).count ?? 0
    : 0;

  const quotedCount = supplierProfile
    ? (await supabase.from("rfq_matches").select("id", { count: "exact", head: true })
        .eq("supplier_id", supplierProfile.id).eq("status", "quoted")).count ?? 0
    : 0;

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const completeness = supplierProfile?.completeness_score ?? 0;

  const tips = [
    { done: (supplierProfile?.processes?.length ?? 0) > 0,      label: "Add your manufacturing processes" },
    { done: (supplierProfile?.materials?.length ?? 0) > 0,      label: "List your materials" },
    { done: (supplierProfile?.certifications?.length ?? 0) > 0, label: "Add certifications" },
    { done: supplierProfile?.typical_lead_time_days != null,     label: "Set your typical lead time" },
    { done: supplierProfile?.tagline != null,                    label: "Write a shop tagline" },
    { done: supplierProfile?.description != null,                label: "Add a shop description" },
  ];

  const ctaSubtext = quotedCount > 0
    ? `${quotedCount} quote${quotedCount !== 1 ? "s" : ""} submitted`
    : shortlistedCount > 0
    ? `${shortlistedCount} invitation${shortlistedCount !== 1 ? "s" : ""} to quote`
    : "Review your matches and get ready to quote";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>

      {/* Greeting */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>
          Welcome back, {firstName}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "5px", fontSize: "0.9375rem" }}>
          {company?.name}{company?.city ? ` · ${company.city}, ${company.state_region}` : ""}
        </p>
      </div>

      {/* RFQ inbox CTA banner */}
      {matchCount > 0 && (
        <Link href="/dashboard/supplier/rfqs" style={{ textDecoration: "none" }}>
          <div style={{
            backgroundColor: "var(--brand)", padding: "16px 20px", marginBottom: "28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "8px" }}>
                <Inbox style={{ width: "1.25rem", height: "1.25rem", color: "white" }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "white", fontSize: "0.9375rem" }}>
                  You have {matchCount} active RFQ{matchCount !== 1 ? "s" : ""}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", marginTop: "3px" }}>
                  {ctaSubtext}
                </p>
              </div>
            </div>
            <ChevronRight style={{ width: "1.25rem", height: "1.25rem", color: "rgba(255,255,255,0.85)" }} />
          </div>
        </Link>
      )}

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "32px" }}>
        <StatCard
          label="Active RFQs" value={matchCount}
          sub={shortlistedCount > 0 ? `${shortlistedCount} invited to quote` : undefined}
          icon={<Award style={{ width: "1.1rem", height: "1.1rem" }} />}
          accent="#3b82f6" href="/dashboard/supplier/rfqs"
        />
        <StatCard
          label="Quotes Submitted" value={quotedCount}
          icon={<TrendingUp style={{ width: "1.1rem", height: "1.1rem" }} />}
          accent="#22c55e"
        />
        <StatCard
          label="Profile Complete" value={`${completeness}%`}
          icon={<Settings style={{ width: "1.1rem", height: "1.1rem" }} />}
          accent={completeness >= 70 ? "#22c55e" : "#f59e0b"}
          href="/profile/supplier"
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>

        {/* Left — Profile completeness */}
        <div>
          <SectionHeader title="Profile Completeness" href="/profile/supplier" />
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)" }}>
                {completeness >= 70 ? "Looking good!" : "Complete your profile to get more matches"}
              </p>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: completeness >= 70 ? "var(--green)" : "var(--amber)" }}>
                {completeness}%
              </span>
            </div>

            <div style={{ height: "4px", backgroundColor: "var(--surface2)", marginBottom: "20px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                backgroundColor: completeness >= 70 ? "var(--green)" : "var(--amber)",
                width: `${completeness}%`,
                transition: "width 0.3s",
              }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {tip.done
                    ? <CheckCircle2 style={{ width: "16px", height: "16px", color: "var(--green)", flexShrink: 0 }} />
                    : <AlertCircle style={{ width: "16px", height: "16px", color: "var(--text-subtle)", flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: "0.9375rem", color: tip.done ? "var(--text-muted)" : "var(--text)", textDecoration: tip.done ? "line-through" : "none" }}>
                    {tip.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px" }}>
              <Link href="/profile/supplier" className="btn-primary">
                Edit profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Right — Processes + quick links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div>
            <SectionHeader title="Your Processes" href="/profile/supplier" />
            <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "18px 20px" }}>
              {(supplierProfile?.processes ?? []).length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {supplierProfile?.processes.map((p: string) => (
                    <span key={p} style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "3px 9px", fontSize: "0.75rem", fontWeight: 500,
                      backgroundColor: "var(--brand-light)", color: "var(--brand)",
                      border: "1px solid var(--brand-mid)", fontFamily: "var(--font-mono)",
                    }}>
                      {p.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  No processes added yet.{" "}
                  <Link href="/profile/supplier" style={{ color: "var(--brand)", textDecoration: "none" }}>Add them →</Link>
                </p>
              )}
            </div>
          </div>

          <div>
            <SectionHeader title="Quick Links" />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { href: "/dashboard/supplier/rfqs", label: "RFQ Inbox",    sub: `${matchCount} active` },
                { href: "/profile/supplier",         label: "Edit Profile", sub: `${completeness}% complete` },
              ].map(({ href, label, sub }) => (
                <Link key={href} href={href} style={{ textDecoration: "none" }}>
                  <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)" }}>{label}</p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "3px" }}>{sub}</p>
                    </div>
                    <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
