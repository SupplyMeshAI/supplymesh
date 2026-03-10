// src/app/dashboard/buyer/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Plus, Search, FileText, TrendingUp, DollarSign, Building2, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────
type RfqRow = {
  id: string;
  part_name: string | null;
  project_name: string | null;
  status: string;
  created_at: string;
  submitted_at: string | null;
  priority: string;
};

type SupplierCompany = { name: string; city: string | null; state_region: string | null };
type SupplierProfileJoin = { company_id: string; companies: SupplierCompany | null };

type MatchRow = {
  id: string;
  rfq_id: string;
  match_score: number;
  status: string;
  supplier_profiles: SupplierProfileJoin | null;
  rfq_part_name?: string;
};

type RawMatchRow = {
  id: string;
  rfq_id: string;
  match_score: number;
  status: string;
  supplier_profiles: SupplierProfileJoin | null;
};

type RawQuoteRow = {
  id: string;
  rfq_id: string;
  supplier_id: string;
  unit_price: number;
  lot_size: number;
  lead_time_days: number;
  created_at: string;
};

type RawSpRow = { id: string; company_id: string };
type RawCompanyRow = { id: string; name: string };

type QuoteRow = {
  id: string;
  rfq_id: string;
  unit_price: number;
  lot_size: number;
  lead_time_days: number;
  created_at: string;
  supplier_company_name?: string;
  rfq_part_name?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; dot: string }> = {
  draft:       { label: "Draft",       dot: "#94a3b8" },
  submitted:   { label: "Submitted",   dot: "#3b82f6" },
  matching:    { label: "Matching",    dot: "#f59e0b" },
  shortlisted: { label: "Shortlisted", dot: "#8b5cf6" },
  closed:      { label: "Closed",      dot: "#10b981" },
  cancelled:   { label: "Cancelled",   dot: "#ef4444" },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "#94a3b8", standard: "#3b82f6", urgent: "#ef4444",
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "0.875rem", border: "1px solid #e2e8f0", padding: "1.25rem 1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem", backgroundColor: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>{label}</p>
        {sub && <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.1rem" }}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, href, count }: { title: string; href?: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {title}
        {count !== undefined && (
          <span style={{ fontSize: "0.72rem", fontWeight: 600, backgroundColor: "#f1f5f9", color: "#64748b", padding: "0.1rem 0.45rem", borderRadius: "9999px" }}>
            {count}
          </span>
        )}
      </h2>
      {href && (
        <Link href={href} style={{ fontSize: "0.78rem", color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.2rem" }}>
          View all <ChevronRight style={{ width: "0.75rem", height: "0.75rem" }} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub, cta, href }: { icon: React.ReactNode; title: string; sub: string; cta?: string; href?: string }) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "0.875rem", border: "1px solid #e2e8f0", padding: "2.5rem 1.5rem", textAlign: "center" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "9999px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.875rem" }}>
        <span style={{ color: "#94a3b8" }}>{icon}</span>
      </div>
      <p style={{ fontWeight: 600, color: "#334155", fontSize: "0.875rem", marginBottom: "0.35rem" }}>{title}</p>
      <p style={{ fontSize: "0.8rem", color: "#94a3b8", maxWidth: "22rem", margin: "0 auto" }}>{sub}</p>
      {cta && href && (
        <Link href={href} style={{ display: "inline-flex", marginTop: "1.25rem", padding: "0.5rem 1.25rem", backgroundColor: "var(--brand)", color: "white", borderRadius: "0.5rem", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
          {cta}
        </Link>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#94a3b8";
  return (
    <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "9999px", border: `2.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: `${color}12` }}>
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function BuyerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Profile + company
  const { data: profile } = await supabase
    .from("profiles").select("full_name").eq("id", user.id).single();

  const { data: memberData } = await supabase
    .from("company_members")
    .select("company_id, company:companies(id, name, city, state_region)")
    .eq("profile_id", user.id).single();

  const company = (Array.isArray(memberData?.company) ? memberData.company[0] : memberData?.company) as
    { id: string; name: string; city: string; state_region: string } | null;

  const companyId = company?.id ?? memberData?.company_id;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  if (!companyId) {
    return <p style={{ color: "#ef4444" }}>Company not found.</p>;
  }

  // ── Fetch RFQs ──────────────────────────────────────────────────────────────
  const { data: rfqs } = await supabase
    .from("rfqs")
    .select("id, part_name, project_name, status, created_at, submitted_at, priority")
    .eq("company_id", companyId)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false })
    .limit(20);

  const allRfqs: RfqRow[] = (rfqs ?? []) as RfqRow[];
  const activeRfqs = allRfqs.filter(r => !["closed", "cancelled", "draft"].includes(r.status));
  const rfqIds = allRfqs.map(r => r.id);

  // ── Fetch matches ───────────────────────────────────────────────────────────
  const { data: matchesRaw } = rfqIds.length > 0
    ? await supabase
        .from("rfq_matches")
        .select(`id, rfq_id, match_score, status, supplier_profiles!rfq_matches_supplier_id_fkey(company_id, companies(name, city, state_region))`)
        .in("rfq_id", rfqIds)
        .not("status", "in", '("declined")')
        .order("match_score", { ascending: false })
    : { data: [] };

  const allMatches: MatchRow[] = (matchesRaw as RawMatchRow[] ?? []).map((m) => ({
    id: m.id,
    rfq_id: m.rfq_id,
    match_score: m.match_score,
    status: m.status,
    supplier_profiles: m.supplier_profiles,
    rfq_part_name: allRfqs.find(r => r.id === m.rfq_id)?.part_name ?? undefined,
  }));

  // Matches per RFQ (for display in RFQ rows)
  const matchCountByRfq: Record<string, { total: number; quoted: number; shortlisted: number }> = {};
  for (const m of allMatches) {
    if (!matchCountByRfq[m.rfq_id]) matchCountByRfq[m.rfq_id] = { total: 0, quoted: 0, shortlisted: 0 };
    matchCountByRfq[m.rfq_id].total++;
    if (m.status === "quoted") matchCountByRfq[m.rfq_id].quoted++;
    if (m.status === "shortlisted") matchCountByRfq[m.rfq_id].shortlisted++;
  }

  // Top matches (unique by supplier, top 5)
  const topMatches = allMatches
    .filter(m => m.status !== "declined")
    .slice(0, 5);

  // ── Fetch quotes ────────────────────────────────────────────────────────────
  const { data: quotesRaw } = rfqIds.length > 0
    ? await supabase
        .from("quotes")
        .select("id, rfq_id, supplier_id, unit_price, lot_size, lead_time_days, created_at")
        .in("rfq_id", rfqIds)
        .eq("status", "submitted")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const rawQuotes = quotesRaw ?? [];

  // Resolve supplier names for quotes
  const quoteSupplierIds = [...new Set((rawQuotes as RawQuoteRow[]).map((q) => q.supplier_id))];
  const { data: spRows } = quoteSupplierIds.length > 0
    ? await supabase.from("supplier_profiles").select("id, company_id").in("id", quoteSupplierIds)
    : { data: [] };

  const spCompanyIds = [...new Set((spRows as RawSpRow[] ?? []).map((s) => s.company_id))];
  const { data: spCompanies } = spCompanyIds.length > 0
    ? await supabase.from("companies").select("id, name").in("id", spCompanyIds)
    : { data: [] };

  const spMap = Object.fromEntries((spRows as RawSpRow[] ?? []).map((s) => [s.id, s.company_id]));
  const companyNameMap = Object.fromEntries((spCompanies as RawCompanyRow[] ?? []).map((c) => [c.id, c.name]));

  const allQuotes: QuoteRow[] = (rawQuotes as RawQuoteRow[]).map((q) => ({
    id: q.id,
    rfq_id: q.rfq_id,
    unit_price: q.unit_price,
    lot_size: q.lot_size,
    lead_time_days: q.lead_time_days,
    created_at: q.created_at,
    supplier_company_name: companyNameMap[spMap[q.supplier_id]] ?? "Unknown Supplier",
    rfq_part_name: allRfqs.find(r => r.id === q.rfq_id)?.part_name ?? "—",
  }));

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalMatches = allMatches.length;
  const totalQuotes = allQuotes.length;
  const shortlistedTotal = allMatches.filter(m => m.status === "shortlisted").length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>

      {/* Greeting */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
          Welcome back, {firstName}
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.875rem" }}>
          {company?.name}{company?.city ? ` · ${company.city}, ${company.state_region}` : ""}
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
        {[
          { icon: <Plus style={{ width: "1.1rem", height: "1.1rem" }} />, label: "New RFQ", sub: "Submit a sourcing request", href: "/dashboard/buyer/rfqs/new" },
          { icon: <Search style={{ width: "1.1rem", height: "1.1rem" }} />, label: "Find Suppliers", sub: "Search supplier database", href: "/dashboard/buyer/suppliers" },
          { icon: <FileText style={{ width: "1.1rem", height: "1.1rem" }} />, label: "All RFQs", sub: "View and manage your RFQs", href: "/dashboard/buyer/rfqs" },
        ].map(({ icon, label, sub, href }) => (
          <Link key={label} href={href} style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.1rem 1.25rem", textDecoration: "none", display: "block" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.625rem", color: "var(--brand)" }}>
              {icon}
            </div>
            <p style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{label}</p>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>{sub}</p>
          </Link>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
        <StatCard label="Active RFQs" value={activeRfqs.length} icon={<FileText style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#3b82f6" />
        <StatCard label="Supplier Matches" value={totalMatches} sub={shortlistedTotal > 0 ? `${shortlistedTotal} shortlisted` : undefined} icon={<Building2 style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#8b5cf6" />
        <StatCard label="Quotes Received" value={totalQuotes} icon={<DollarSign style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#10b981" />
        <StatCard label="Total RFQs" value={allRfqs.length} icon={<TrendingUp style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#f59e0b" />
      </div>

      {/* Main two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Open RFQs */}
          <div>
            <SectionHeader title="Open RFQs" href="/dashboard/buyer/rfqs" count={activeRfqs.length} />
            {activeRfqs.length === 0 ? (
              <EmptyState
                icon={<FileText style={{ width: "1.25rem", height: "1.25rem" }} />}
                title="No active RFQs"
                sub="Submit your first RFQ to start getting matched with suppliers."
                cta="Create RFQ"
                href="/dashboard/buyer/rfqs/new"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {activeRfqs.slice(0, 6).map(rfq => {
                  const meta = STATUS_META[rfq.status] ?? STATUS_META.submitted;
                  const counts = matchCountByRfq[rfq.id];
                  return (
                    <Link key={rfq.id} href={`/dashboard/buyer/rfqs/${rfq.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "0.875rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem", transition: "border-color 0.15s", cursor: "pointer" }}>
                        {/* Status dot */}
                        <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", backgroundColor: meta.dot, flexShrink: 0 }} />

                        {/* Part name + project */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rfq.part_name || rfq.project_name || "Untitled RFQ"}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{meta.label}</span>
                            {rfq.priority !== "standard" && (
                              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: PRIORITY_COLOR[rfq.priority], textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {rfq.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Counts */}
                        {counts && (
                          <div style={{ display: "flex", gap: "0.875rem", flexShrink: 0 }}>
                            {counts.total > 0 && (
                              <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{counts.total}</p>
                                <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>matched</p>
                              </div>
                            )}
                            {counts.quoted > 0 && (
                              <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10b981" }}>{counts.quoted}</p>
                                <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>quoted</p>
                              </div>
                            )}
                          </div>
                        )}

                        <ChevronRight style={{ width: "0.875rem", height: "0.875rem", color: "#cbd5e1", flexShrink: 0 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent quotes */}
          <div>
            <SectionHeader title="Quotes Received" href="/dashboard/buyer/rfqs" count={allQuotes.length} />
            {allQuotes.length === 0 ? (
              <EmptyState
                icon={<DollarSign style={{ width: "1.25rem", height: "1.25rem" }} />}
                title="No quotes yet"
                sub="Shortlist suppliers on your matched RFQs and they'll be able to submit quotes."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allQuotes.slice(0, 5).map(q => (
                  <Link key={q.id} href={`/dashboard/buyer/rfqs/${q.rfq_id}?tab=quotes`} style={{ textDecoration: "none" }}>
                    <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "0.875rem 1.125rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>{q.supplier_company_name}</p>
                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                          {q.rfq_part_name} · {formatRelative(q.created_at)}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "1.25rem", flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                            ${q.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>per unit</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{q.lead_time_days}d</p>
                          <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>lead time</p>
                        </div>
                      </div>
                      <ChevronRight style={{ width: "0.875rem", height: "0.875rem", color: "#cbd5e1", flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — top supplier matches */}
        <div>
          <SectionHeader title="Top Supplier Matches" count={topMatches.length} />
          {topMatches.length === 0 ? (
            <EmptyState
              icon={<Building2 style={{ width: "1.25rem", height: "1.25rem" }} />}
              title="No matches yet"
              sub="Submit and run matching on an RFQ to see suppliers here."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {topMatches.map(m => {
                const co = m.supplier_profiles?.companies;
                const name = co?.name ?? "Unknown Supplier";
                const location = co?.city ? `${co.city}${co.state_region ? `, ${co.state_region}` : ""}` : null;
                const rfqName = m.rfq_part_name;
                return (
                  <Link key={m.id} href={`/dashboard/buyer/rfqs/${m.rfq_id}`} style={{ textDecoration: "none" }}>
                    <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
                      <ScoreRing score={m.match_score} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                        <div style={{ display: "flex", flex: "column", gap: "0.25rem", marginTop: "0.15rem" }}>
                          {location && (
                            <p style={{ fontSize: "0.72rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                              <MapPin style={{ width: "0.6rem", height: "0.6rem" }} />{location}
                            </p>
                          )}
                          {rfqName && (
                            <p style={{ fontSize: "0.72rem", color: "#94a3b8" }}>→ {rfqName}</p>
                          )}
                        </div>
                      </div>
                      {m.status === "quoted" && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.1rem 0.4rem", borderRadius: "9999px", flexShrink: 0 }}>
                          Quoted
                        </span>
                      )}
                      {m.status === "shortlisted" && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--brand)", backgroundColor: "var(--brand-light)", border: "1px solid var(--brand)", padding: "0.1rem 0.4rem", borderRadius: "9999px", flexShrink: 0 }}>
                          Shortlisted
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Draft RFQs nudge */}
          {allRfqs.some(r => r.status === "draft") && (
            <div style={{ marginTop: "1.5rem" }}>
              <SectionHeader title="Drafts" count={allRfqs.filter(r => r.status === "draft").length} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allRfqs.filter(r => r.status === "draft").slice(0, 3).map(rfq => (
                  <Link key={rfq.id} href={`/dashboard/buyer/rfqs/new?draft=${rfq.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ backgroundColor: "#fafafa", borderRadius: "0.75rem", border: "1px dashed #cbd5e1", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <FileText style={{ width: "0.875rem", height: "0.875rem", color: "#94a3b8", flexShrink: 0 }} />
                      <p style={{ flex: 1, fontSize: "0.82rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {rfq.part_name || rfq.project_name || "Untitled draft"}
                      </p>
                      <span style={{ fontSize: "0.72rem", color: "var(--brand)", fontWeight: 500, flexShrink: 0 }}>Continue →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
