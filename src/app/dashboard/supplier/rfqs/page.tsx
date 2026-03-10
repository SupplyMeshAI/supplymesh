// src/app/dashboard/supplier/rfqs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Building2, Package, ChevronDown, ChevronUp,
  CheckCircle2, Star, Inbox, TrendingUp,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================
type MatchRow = {
  id: string;
  rfq_id: string;
  match_score: number;
  match_details: string[] | null;
  status: string;
  created_at: string;
};

type RfqRow = {
  id: string;
  part_name: string | null;
  project_name: string | null;
  lot_size: string | null;
  priority: string | null;
  needed_by_date: string | null;
  processes_required: string[] | null;
  certifications_required: string[] | null;
  submitted_at: string | null;
  company_id: string;
};

type CompanyRow = {
  id: string;
  name: string;
};

type InboxItem = MatchRow & {
  rfq: RfqRow | null;
  buyer_company: CompanyRow | null;
};

// ============================================================================
// Helpers
// ============================================================================
const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "#64748b", bg: "#f1f5f9" },
  standard: { label: "Standard", color: "#3b82f6", bg: "#eff6ff" },
  urgent:   { label: "Urgent",   color: "#ef4444", bg: "#fef2f2" },
};

const PROCESS_LABELS: Record<string, string> = {
  cnc_milling: "CNC Milling", cnc_turning: "CNC Turning",
  sheet_metal_fabrication: "Sheet Metal", injection_molding: "Injection Molding",
  casting: "Casting", forging: "Forging", additive_3d_printing: "3D Printing",
  welding_fabrication: "Welding", stamping: "Stamping", laser_cutting: "Laser Cutting",
  waterjet_cutting: "Waterjet", pcb_assembly: "PCB Assembly",
  grinding: "Grinding", edm: "EDM",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

// ============================================================================
// Score ring
// ============================================================================
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#94a3b8";
  return (
    <div style={{
      width: "3.25rem", height: "3.25rem", borderRadius: "9999px", flexShrink: 0,
      border: `3px solid ${color}`, backgroundColor: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

// ============================================================================
// Match card
// ============================================================================
function MatchCard({ item }: { item: InboxItem }) {
  const [expanded, setExpanded] = useState(false);
  const { rfq, buyer_company } = item;
  const isShortlisted = item.status === "shortlisted";
  const isQuoted = item.status === "quoted";
  const priority = rfq?.priority
    ? (PRIORITY_CONFIG[rfq.priority] ?? PRIORITY_CONFIG.standard)
    : PRIORITY_CONFIG.standard;
  const processes = rfq?.processes_required?.slice(0, 3) ?? [];
  const extraProcesses = Math.max(0, (rfq?.processes_required?.length ?? 0) - 3);

  return (
    <div style={{
      backgroundColor: isShortlisted ? "var(--brand-light)" : isQuoted ? "#f0fdf4" : "white",
      border: `1px solid ${isShortlisted ? "var(--brand)" : isQuoted ? "#bbf7d0" : "#e2e8f0"}`,
      borderRadius: "0.75rem", padding: "1.25rem 1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <ScoreRing score={item.match_score} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link
                  href={`/dashboard/supplier/rfqs/${rfq?.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <h3 style={{ fontWeight: 600, fontSize: "0.975rem", color: "#0f172a", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--brand)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#0f172a")}
                  >
                    {rfq?.part_name || rfq?.project_name || "Untitled RFQ"}
                  </h3>
                </Link>
                {isShortlisted && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    fontSize: "0.7rem", fontWeight: 600, color: "var(--brand)",
                    backgroundColor: "white", border: "1px solid var(--brand)",
                    padding: "0.1rem 0.5rem", borderRadius: "9999px",
                  }}>
                    <Star style={{ width: "0.6rem", height: "0.6rem" }} />
                    Shortlisted
                  </span>
                )}
                {isQuoted && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    fontSize: "0.7rem", fontWeight: 600, color: "#16a34a",
                    backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                    padding: "0.1rem 0.5rem", borderRadius: "9999px",
                  }}>
                    ✓ Quote submitted
                  </span>
                )}
              </div>
              {buyer_company?.name && (
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Building2 style={{ width: "0.7rem", height: "0.7rem" }} />
                  {buyer_company.name}
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
              <span style={{
                fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px",
                color: priority.color, backgroundColor: priority.bg,
              }}>
                {priority.label}
              </span>
              {rfq?.needed_by_date && (
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Due {formatDate(rfq.needed_by_date)}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {rfq?.lot_size && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "#475569" }}>
                <Package style={{ width: "0.75rem", height: "0.75rem", color: "#94a3b8" }} />
                {rfq.lot_size}
              </span>
            )}
            {processes.length > 0 && (
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                {processes.map(p => (
                  <span key={p} style={{
                    fontSize: "0.72rem", fontWeight: 500, padding: "0.15rem 0.5rem",
                    borderRadius: "9999px", backgroundColor: "#f1f5f9", color: "#475569",
                    border: "1px solid #e2e8f0",
                  }}>
                    {PROCESS_LABELS[p] ?? p}
                  </span>
                ))}
                {extraProcesses > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>+{extraProcesses} more</span>
                )}
              </div>
            )}
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "auto" }}>
              {formatRelative(item.created_at)}
            </span>
          </div>
        </div>

        {/* Expand */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0.25rem", flexShrink: 0 }}
        >
          {expanded
            ? <ChevronUp style={{ width: "1rem", height: "1rem" }} />
            : <ChevronDown style={{ width: "1rem", height: "1rem" }} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
          {(item.match_details ?? []).length > 0 && (
            <>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Why you were matched
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.75rem" }}>
                {item.match_details!.map((reason, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.825rem", color: "#334155" }}>
                    <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem", color: "#10b981", flexShrink: 0, marginTop: "0.1rem" }} />
                    {reason}
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ marginBottom: "0.75rem" }}>
              <Link
                href={`/dashboard/supplier/rfqs/${rfq?.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 1rem", borderRadius: "0.5rem",
                  fontSize: "0.875rem", fontWeight: 600, color: "white",
                  backgroundColor: "var(--brand)", textDecoration: "none",
                }}
              >
                View details & quote →
              </Link>
            </div>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8rem" }}>
            {(rfq?.certifications_required ?? []).length > 0 && (
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Certs required
                </p>
                <p style={{ color: "#334155", fontWeight: 500 }}>{rfq!.certifications_required!.join(", ")}</p>
              </div>
            )}
            {rfq?.submitted_at && (
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Submitted
                </p>
                <p style={{ color: "#334155", fontWeight: 500 }}>{formatDate(rfq.submitted_at)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================
export default function SupplierRfqInboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "shortlisted">("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // 1. Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // 2. Company
      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("profile_id", user.id)
        .single();
      if (!membership) { router.push("/auth/onboarding"); return; }

      // 3. Supplier profile id
      const { data: sp } = await supabase
        .from("supplier_profiles")
        .select("id")
        .eq("company_id", membership.company_id)
        .single();
      if (!sp) { setLoading(false); return; }

      // 4 & 5. Two separate queries — one per status (avoids enum filter 500)
      const [{ data: matched }, { data: shortlisted }, { data: quoted }] = await Promise.all([
        supabase
          .from("rfq_matches")
          .select("id, rfq_id, match_score, match_details, status, created_at")
          .eq("supplier_id", sp.id)
          .eq("status", "matched"),
        supabase
          .from("rfq_matches")
          .select("id, rfq_id, match_score, match_details, status, created_at")
          .eq("supplier_id", sp.id)
          .eq("status", "shortlisted"),
        supabase
          .from("rfq_matches")
          .select("id, rfq_id, match_score, match_details, status, created_at")
          .eq("supplier_id", sp.id)
          .eq("status", "quoted"),
      ]);

      const allMatches: MatchRow[] = [
        ...((matched ?? []) as MatchRow[]),
        ...((shortlisted ?? []) as MatchRow[]),
        ...((quoted ?? []) as MatchRow[]),
      ].sort((a, b) => b.match_score - a.match_score);

      if (allMatches.length === 0) { setLoading(false); return; }

      // 6. RFQs
      const { data: rfqs } = await supabase
        .from("rfqs")
        .select("id, part_name, project_name, lot_size, priority, needed_by_date, processes_required, certifications_required, submitted_at, company_id")
        .in("id", allMatches.map(m => m.rfq_id));

      // 7. Buyer companies
      const companyIds = [...new Set((rfqs ?? []).map(r => r.company_id).filter(Boolean))];
      const { data: companies } = companyIds.length > 0
        ? await supabase.from("companies").select("id, name").in("id", companyIds)
        : { data: [] as CompanyRow[] };

      // 8. Assemble
      const rfqMap = Object.fromEntries((rfqs ?? []).map(r => [r.id, r as RfqRow]));
      const companyMap = Object.fromEntries((companies ?? []).map(c => [c.id, c as CompanyRow]));

      setItems(allMatches.map(m => ({
        ...m,
        rfq: rfqMap[m.rfq_id] ?? null,
        buyer_company: rfqMap[m.rfq_id] ? (companyMap[rfqMap[m.rfq_id].company_id] ?? null) : null,
      })));

      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = activeTab === "shortlisted" ? items.filter(i => i.status === "shortlisted" || i.status === "quoted") : items;
  const shortlistedCount = items.filter(i => i.status === "shortlisted" || i.status === "quoted").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>RFQ Inbox</h1>
        <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
          {items.length} active · {shortlistedCount} shortlisted or quoted
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {(["all", "shortlisted"] as const).map(tab => {
          const count = tab === "all" ? items.length : shortlistedCount;
          const active = activeTab === tab;
          return (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
              padding: "0.375rem 0.875rem", borderRadius: "0.5rem", fontSize: "0.85rem",
              fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
              border: active ? "1px solid var(--brand)" : "1px solid #e2e8f0",
              backgroundColor: active ? "var(--brand-light)" : "white",
              color: active ? "var(--brand)" : "#64748b",
            }}>
              {tab === "all" ? "All Matches" : "Shortlisted & Quoted"}
              {count > 0 && (
                <span style={{
                  fontSize: "0.72rem", fontWeight: 600, padding: "0.05rem 0.4rem", borderRadius: "9999px",
                  backgroundColor: active ? "var(--brand)" : "#e2e8f0",
                  color: active ? "white" : "#64748b",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Score legend */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.875rem" }}>
          {[["#10b981", "75–100 Strong"], ["#f59e0b", "50–74 Good"], ["#94a3b8", "<50 Partial"]].map(([color, label]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "9999px", backgroundColor: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* List or empty state */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          {activeTab === "shortlisted" ? (
            <>
              <Star style={{ width: "2.5rem", height: "2.5rem", color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>No shortlisted RFQs yet</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                Buyers will shortlist you when your profile matches their needs.
              </p>
            </>
          ) : (
            <>
              <Inbox style={{ width: "2.5rem", height: "2.5rem", color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>No matched RFQs yet</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "24rem", margin: "0.25rem auto 0" }}>
                Complete your supplier profile to start getting matched with buyer RFQs.
              </p>
              <a href="/profile/supplier" style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "0.5rem",
                fontSize: "0.875rem", fontWeight: 600, color: "white",
                backgroundColor: "var(--brand)", textDecoration: "none",
              }}>
                <TrendingUp style={{ width: "1rem", height: "1rem" }} />
                Complete your profile
              </a>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map(item => <MatchCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
