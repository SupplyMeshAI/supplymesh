// src/app/dashboard/buyer/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Plus, Search, FileText, TrendingUp, DollarSign, Building2, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

type RfqRow = {
  id: string; part_name: string | null; project_name: string | null;
  status: string; created_at: string; submitted_at: string | null; priority: string;
};
type SupplierCompany = { name: string; city: string | null; state_region: string | null };
type SupplierProfileJoin = { company_id: string; companies: SupplierCompany | null };
type MatchRow = { id: string; rfq_id: string; match_score: number; status: string; supplier_profiles: SupplierProfileJoin | null; rfq_part_name?: string };
type RawMatchRow = { id: string; rfq_id: string; match_score: number; status: string; supplier_profiles: SupplierProfileJoin | null };
type RawQuoteRow = { id: string; rfq_id: string; supplier_id: string; unit_price: number; lot_size: number; lead_time_days: number; created_at: string };
type RawSpRow = { id: string; company_id: string };
type RawCompanyRow = { id: string; name: string };
type QuoteRow = { id: string; rfq_id: string; unit_price: number; lot_size: number; lead_time_days: number; created_at: string; supplier_company_name?: string; rfq_part_name?: string };

const STATUS_META: Record<string, { label: string; dot: string }> = {
  draft:       { label: "Draft",       dot: "#64748b" },
  submitted:   { label: "Submitted",   dot: "#3b82f6" },
  matching:    { label: "Matching",    dot: "#f59e0b" },
  shortlisted: { label: "Shortlisted", dot: "#8b5cf6" },
  closed:      { label: "Closed",      dot: "#22c55e" },
  cancelled:   { label: "Cancelled",   dot: "#ef4444" },
};
const PRIORITY_COLOR: Record<string, string> = { low: "#8b95a1", standard: "#3b82f6", urgent: "#ef4444" };

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string }) {
  return (
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

function EmptyState({ icon, title, sub, cta, href }: { icon: React.ReactNode; title: string; sub: string; cta?: string; href?: string }) {
  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: "36px", height: "36px", backgroundColor: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      </div>
      <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9375rem", marginBottom: "6px" }}>{title}</p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "22rem", margin: "0 auto" }}>{sub}</p>
      {cta && href && (
        <Link href={href} style={{ display: "inline-flex", marginTop: "20px", padding: "8px 20px", backgroundColor: "var(--brand)", color: "white", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
          {cta}
        </Link>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#8b95a1";
  return (
    <div style={{ width: "36px", height: "36px", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: `${color}12` }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{score}</span>
    </div>
  );
}

export default async function BuyerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: memberData } = await supabase.from("company_members").select("company_id, company:companies(id, name, city, state_region)").eq("profile_id", user.id).single();
  const company = (Array.isArray(memberData?.company) ? memberData.company[0] : memberData?.company) as { id: string; name: string; city: string; state_region: string } | null;
  const companyId = company?.id ?? memberData?.company_id;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  if (!companyId) return <p style={{ color: "var(--red)" }}>Company not found.</p>;

  const { data: rfqs } = await supabase.from("rfqs").select("id, part_name, project_name, status, created_at, submitted_at, priority").eq("company_id", companyId).not("status", "eq", "cancelled").order("created_at", { ascending: false }).limit(20);
  const allRfqs: RfqRow[] = (rfqs ?? []) as RfqRow[];
  const activeRfqs = allRfqs.filter(r => !["closed", "cancelled", "draft"].includes(r.status));
  const rfqIds = allRfqs.map(r => r.id);

  const { data: matchesRaw } = rfqIds.length > 0
    ? await supabase.from("rfq_matches").select(`id, rfq_id, match_score, status, supplier_profiles!rfq_matches_supplier_id_fkey(company_id, companies(name, city, state_region))`).in("rfq_id", rfqIds).not("status", "in", '("declined")').order("match_score", { ascending: false })
    : { data: [] };

  const allMatches: MatchRow[] = (matchesRaw as RawMatchRow[] ?? []).map(m => ({ ...m, rfq_part_name: allRfqs.find(r => r.id === m.rfq_id)?.part_name ?? undefined }));

  const matchCountByRfq: Record<string, { total: number; quoted: number; shortlisted: number }> = {};
  for (const m of allMatches) {
    if (!matchCountByRfq[m.rfq_id]) matchCountByRfq[m.rfq_id] = { total: 0, quoted: 0, shortlisted: 0 };
    matchCountByRfq[m.rfq_id].total++;
    if (m.status === "quoted") matchCountByRfq[m.rfq_id].quoted++;
    if (m.status === "shortlisted") matchCountByRfq[m.rfq_id].shortlisted++;
  }
  const topMatches = allMatches.filter(m => m.status !== "declined").slice(0, 5);

  const { data: quotesRaw } = rfqIds.length > 0
    ? await supabase.from("quotes").select("id, rfq_id, supplier_id, unit_price, lot_size, lead_time_days, created_at").in("rfq_id", rfqIds).eq("status", "submitted").order("created_at", { ascending: false }).limit(10)
    : { data: [] };

  const rawQuotes = quotesRaw ?? [];
  const quoteSupplierIds = [...new Set((rawQuotes as RawQuoteRow[]).map(q => q.supplier_id))];
  const { data: spRows } = quoteSupplierIds.length > 0 ? await supabase.from("supplier_profiles").select("id, company_id").in("id", quoteSupplierIds) : { data: [] };
  const spCompanyIds = [...new Set((spRows as RawSpRow[] ?? []).map(s => s.company_id))];
  const { data: spCompanies } = spCompanyIds.length > 0 ? await supabase.from("companies").select("id, name").in("id", spCompanyIds) : { data: [] };
  const spMap = Object.fromEntries((spRows as RawSpRow[] ?? []).map(s => [s.id, s.company_id]));
  const companyNameMap = Object.fromEntries((spCompanies as RawCompanyRow[] ?? []).map(c => [c.id, c.name]));
  const allQuotes: QuoteRow[] = (rawQuotes as RawQuoteRow[]).map(q => ({
    ...q,
    supplier_company_name: companyNameMap[spMap[q.supplier_id]] ?? "Unknown Supplier",
    rfq_part_name: allRfqs.find(r => r.id === q.rfq_id)?.part_name ?? "—",
  }));

  const totalMatches = allMatches.length;
  const totalQuotes = allQuotes.length;
  const shortlistedTotal = allMatches.filter(m => m.status === "shortlisted").length;

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

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "28px" }}>
        {[
          { icon: <Plus style={{ width: "1.1rem", height: "1.1rem" }} />, label: "New RFQ", sub: "Submit a sourcing request", href: "/dashboard/buyer/rfqs/new" },
          { icon: <Search style={{ width: "1.1rem", height: "1.1rem" }} />, label: "Find Suppliers", sub: "Search supplier database", href: "/dashboard/buyer/suppliers" },
          { icon: <FileText style={{ width: "1.1rem", height: "1.1rem" }} />, label: "All RFQs", sub: "View and manage your RFQs", href: "/dashboard/buyer/rfqs" },
        ].map(({ icon, label, sub, href }) => (
          <Link key={label} href={href} style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "18px 20px", textDecoration: "none", display: "block" }}>
            <div style={{ width: "32px", height: "32px", backgroundColor: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", color: "var(--brand)" }}>
              {icon}
            </div>
            <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem" }}>{label}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</p>
          </Link>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "32px" }}>
        <StatCard label="Active RFQs"      value={activeRfqs.length} icon={<FileText style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#3b82f6" />
        <StatCard label="Supplier Matches" value={totalMatches} sub={shortlistedTotal > 0 ? `${shortlistedTotal} shortlisted` : undefined} icon={<Building2 style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#8b5cf6" />
        <StatCard label="Quotes Received"  value={totalQuotes} icon={<DollarSign style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#22c55e" />
        <StatCard label="Total RFQs"       value={allRfqs.length} icon={<TrendingUp style={{ width: "1.1rem", height: "1.1rem" }} />} accent="#f59e0b" />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* Open RFQs */}
          <div>
            <SectionHeader title="Open RFQs" href="/dashboard/buyer/rfqs" count={activeRfqs.length} />
            {activeRfqs.length === 0 ? (
              <EmptyState icon={<FileText style={{ width: "1.25rem", height: "1.25rem" }} />} title="No active RFQs" sub="Submit your first RFQ to start getting matched with suppliers." cta="Create RFQ" href="/dashboard/buyer/rfqs/new" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {activeRfqs.slice(0, 6).map(rfq => {
                  const meta = STATUS_META[rfq.status] ?? STATUS_META.submitted;
                  const counts = matchCountByRfq[rfq.id];
                  return (
                    <Link key={rfq.id} href={`/dashboard/buyer/rfqs/${rfq.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "8px", height: "8px", backgroundColor: meta.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rfq.part_name || rfq.project_name || "Untitled RFQ"}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{meta.label}</span>
                            {rfq.priority !== "standard" && (
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: PRIORITY_COLOR[rfq.priority], textTransform: "uppercase", letterSpacing: "0.04em" }}>{rfq.priority}</span>
                            )}
                          </div>
                        </div>
                        {counts && (
                          <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
                            {counts.total > 0 && (
                              <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{counts.total}</p>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>matched</p>
                              </div>
                            )}
                            {counts.quoted > 0 && (
                              <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--green)", fontFamily: "var(--font-mono)" }}>{counts.quoted}</p>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>quoted</p>
                              </div>
                            )}
                          </div>
                        )}
                        <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quotes */}
          <div>
            <SectionHeader title="Quotes Received" href="/dashboard/buyer/rfqs" count={allQuotes.length} />
            {allQuotes.length === 0 ? (
              <EmptyState icon={<DollarSign style={{ width: "1.25rem", height: "1.25rem" }} />} title="No quotes yet" sub="Shortlist suppliers on your matched RFQs and they'll be able to submit quotes." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {allQuotes.slice(0, 5).map(q => (
                  <Link key={q.id} href={`/dashboard/buyer/rfqs/${q.rfq_id}?tab=quotes`} style={{ textDecoration: "none" }}>
                    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)" }}>{q.supplier_company_name}</p>
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>{q.rfq_part_name} · {formatRelative(q.created_at)}</p>
                      </div>
                      <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text)", fontFamily: "var(--font-mono)" }}>${q.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>per unit</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text)", fontFamily: "var(--font-mono)" }}>{q.lead_time_days}d</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>lead time</p>
                        </div>
                      </div>
                      <ChevronRight style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          <SectionHeader title="Top Supplier Matches" count={topMatches.length} />
          {topMatches.length === 0 ? (
            <EmptyState icon={<Building2 style={{ width: "1.25rem", height: "1.25rem" }} />} title="No matches yet" sub="Submit and run matching on an RFQ to see suppliers here." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {topMatches.map(m => {
                const co = m.supplier_profiles?.companies;
                const name = co?.name ?? "Unknown Supplier";
                const location = co?.city ? `${co.city}${co.state_region ? `, ${co.state_region}` : ""}` : null;
                return (
                  <Link key={m.id} href={`/dashboard/buyer/rfqs/${m.rfq_id}`} style={{ textDecoration: "none" }}>
                    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <ScoreRing score={m.match_score} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                        {location && (
                          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <MapPin style={{ width: "10px", height: "10px" }} />{location}
                            {m.rfq_part_name && <span style={{ marginLeft: "4px" }}>→ {m.rfq_part_name}</span>}
                          </p>
                        )}
                      </div>
                      {m.status === "quoted" && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--green)", backgroundColor: "var(--green-dim)", border: "1px solid #22c55e30", padding: "2px 7px", flexShrink: 0 }}>Quoted</span>
                      )}
                      {m.status === "shortlisted" && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--brand)", backgroundColor: "var(--brand-light)", border: "1px solid var(--brand-mid)", padding: "2px 7px", flexShrink: 0 }}>Shortlisted</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {allRfqs.some(r => r.status === "draft") && (
            <div style={{ marginTop: "24px" }}>
              <SectionHeader title="Drafts" count={allRfqs.filter(r => r.status === "draft").length} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {allRfqs.filter(r => r.status === "draft").slice(0, 3).map(rfq => (
                  <Link key={rfq.id} href={`/dashboard/buyer/rfqs/new?draft=${rfq.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ backgroundColor: "var(--surface2)", border: "1px dashed var(--border2)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
                      <p style={{ flex: 1, fontSize: "0.875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {rfq.part_name || rfq.project_name || "Untitled draft"}
                      </p>
                      <span style={{ fontSize: "0.8125rem", color: "var(--brand)", fontWeight: 500, flexShrink: 0 }}>Continue →</span>
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
