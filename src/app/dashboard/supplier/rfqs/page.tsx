// src/app/dashboard/supplier/rfqs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Building2,
  Package,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Star,
  Inbox,
  TrendingUp,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================
type InboxMatch = {
  id: string;
  rfq_id: string;
  match_score: number;
  match_details: string[] | null;
  status: string;
  created_at: string;
  rfq: {
    id: string;
    part_name: string | null;
    project_name: string | null;
    lot_size: string | null;
    priority: "low" | "standard" | "urgent";
    needed_by_date: string | null;
    processes_required: string[];
    certifications_required: string[];
    submitted_at: string | null;
    company: {
      name: string;
    } | null;
  } | null;
};

const PRIORITY_CONFIG = {
  low:      { label: "Low",      color: "#64748b", bg: "#f1f5f9" },
  standard: { label: "Standard", color: "#3b82f6", bg: "#eff6ff" },
  urgent:   { label: "Urgent",   color: "#ef4444", bg: "#fef2f2" },
};

const PROCESS_LABELS: Record<string, string> = {
  cnc_milling: "CNC Milling", cnc_turning: "CNC Turning",
  sheet_metal_fabrication: "Sheet Metal Fab", injection_molding: "Injection Molding",
  casting: "Casting", forging: "Forging", additive_3d_printing: "3D Printing",
  welding_fabrication: "Welding", stamping: "Stamping", laser_cutting: "Laser Cutting",
  waterjet_cutting: "Waterjet", pcb_assembly: "PCB Assembly",
  grinding: "Grinding", edm: "EDM", other: "Other",
};

// ============================================================================
// Score ring
// ============================================================================
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#94a3b8";
  return (
    <div style={{
      width: "3.25rem", height: "3.25rem", borderRadius: "9999px",
      border: `3px solid ${color}`, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, backgroundColor: `${color}18`,
    }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

// ============================================================================
// Match card
// ============================================================================
function MatchCard({ match }: { match: InboxMatch }) {
  const [expanded, setExpanded] = useState(false);
  const rfq = match.rfq;
  if (!rfq) return null;

  const isShortlisted = match.status === "shortlisted";
  const priority = rfq.priority ? PRIORITY_CONFIG[rfq.priority] : PRIORITY_CONFIG.standard;
  const processes = rfq.processes_required?.slice(0, 3) || [];
  const extraProcesses = (rfq.processes_required?.length || 0) - 3;

  return (
    <div
      className="card"
      style={{
        padding: "1.25rem 1.5rem",
        border: isShortlisted ? "1px solid var(--brand)" : "1px solid #e2e8f0",
        backgroundColor: isShortlisted ? "var(--brand-light)" : "white",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => {
        if (!isShortlisted) (e.currentTarget as HTMLElement).style.borderColor = "#94a3b8";
      }}
      onMouseLeave={e => {
        if (!isShortlisted) (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>

        {/* Score */}
        <ScoreRing score={match.match_score} />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Top row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <h3 style={{ fontWeight: 600, fontSize: "0.975rem", color: "#0f172a" }}>
                  {rfq.part_name || rfq.project_name || "Untitled RFQ"}
                </h3>
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
              </div>
              {rfq.company?.name && (
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Building2 style={{ width: "0.7rem", height: "0.7rem" }} />
                  {rfq.company.name}
                </p>
              )}
            </div>

            {/* Priority + date */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
              <span style={{
                fontSize: "0.7rem", fontWeight: 600,
                color: priority.color, backgroundColor: priority.bg,
                padding: "0.15rem 0.5rem", borderRadius: "9999px",
              }}>
                {priority.label}
              </span>
              {rfq.needed_by_date && (
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Due {formatDateShort(rfq.needed_by_date)}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {rfq.lot_size && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "#475569" }}>
                <Package style={{ width: "0.75rem", height: "0.75rem", color: "#94a3b8" }} />
                {rfq.lot_size}
              </span>
            )}
            {processes.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                {processes.map(p => (
                  <span key={p} style={{
                    fontSize: "0.72rem", fontWeight: 500,
                    padding: "0.15rem 0.5rem", borderRadius: "9999px",
                    backgroundColor: "#f1f5f9", color: "#475569",
                    border: "1px solid #e2e8f0",
                  }}>
                    {PROCESS_LABELS[p] || p}
                  </span>
                ))}
                {extraProcesses > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    +{extraProcesses} more
                  </span>
                )}
              </div>
            )}
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "auto" }}>
              {formatRelativeDate(match.created_at)}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0.25rem", flexShrink: 0 }}
        >
          {expanded
            ? <ChevronUp style={{ width: "1rem", height: "1rem" }} />
            : <ChevronDown style={{ width: "1rem", height: "1rem" }} />
          }
        </button>
      </div>

      {/* Expanded: match reasons */}
      {expanded && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
          {match.match_details && match.match_details.length > 0 && (
            <>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Why you were matched
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.75rem" }}>
                {match.match_details.map((reason, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.825rem", color: "#334155" }}>
                    <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem", color: "#10b981", flexShrink: 0, marginTop: "0.1rem" }} />
                    {reason}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Extra RFQ details */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8rem" }}>
            {rfq.certifications_required?.length > 0 && (
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Certs required
                </p>
                <p style={{ color: "#334155", fontWeight: 500 }}>
                  {rfq.certifications_required.join(", ")}
                </p>
              </div>
            )}
            {rfq.submitted_at && (
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
                  Submitted
                </p>
                <p style={{ color: "#334155", fontWeight: 500 }}>
                  {formatDateShort(rfq.submitted_at)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
export default function SupplierRfqInboxPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<InboxMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "shortlisted">("all");

  useEffect(() => {
    async function loadMatches() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Get supplier's company
      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("profile_id", user.id)
        .single();

      if (!membership) { router.push("/auth/onboarding"); return; }

      // Get supplier profile id
      const { data: supplierProfile } = await supabase
        .from("supplier_profiles")
        .select("id")
        .eq("company_id", membership.company_id)
        .single();

      if (!supplierProfile) {
        setLoading(false);
        return;
      }

      // Fetch all matches for this supplier profile
      const { data, error } = await supabase
        .from("rfq_matches")
        .select(`
          id,
          rfq_id,
          match_score,
          match_details,
          status,
          created_at,
          rfq:rfqs (
            id,
            part_name,
            project_name,
            lot_size,
            priority,
            needed_by_date,
            processes_required,
            certifications_required,
            submitted_at,
            company:companies!rfqs_company_id_fkey (
              name
            )
          )
        `)
        .eq("supplier_id", supplierProfile.id)
        .in("status", ["matched", "shortlisted"])
        .order("match_score", { ascending: false });

      if (!error && data) {
        // Supabase returns nested relations as arrays — normalize to single objects
        const normalized = (data as unknown[]).map((row: unknown) => {
          const m = row as Record<string, unknown>;
          const rfqArr = m.rfq as Record<string, unknown>[] | null;
          const rfqRaw = Array.isArray(rfqArr) ? rfqArr[0] : rfqArr;
          const companyArr = rfqRaw?.company as Record<string, unknown>[] | null;
          const company = Array.isArray(companyArr) ? companyArr[0] : companyArr;
          return {
            ...m,
            rfq: rfqRaw ? { ...rfqRaw, company: company ?? null } : null,
          } as InboxMatch;
        });
        setMatches(normalized);
      }
      setLoading(false);
    }
    loadMatches();
  }, [router]);

  const filtered = activeTab === "shortlisted"
    ? matches.filter(m => m.status === "shortlisted")
    : matches;

  const shortlistedCount = matches.filter(m => m.status === "shortlisted").length;

  // ── Render ────────────────────────────────────────────────────────────────
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>RFQ Inbox</h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
            {matches.length} matched · {shortlistedCount} shortlisted
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {([
          { key: "all",         label: "All Matches",  count: matches.length },
          { key: "shortlisted", label: "Shortlisted",  count: shortlistedCount },
        ] as const).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              border: activeTab === tab.key ? "1px solid var(--brand)" : "1px solid #e2e8f0",
              backgroundColor: activeTab === tab.key ? "var(--brand-light)" : "white",
              color: activeTab === tab.key ? "var(--brand)" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                fontSize: "0.72rem", fontWeight: 600,
                backgroundColor: activeTab === tab.key ? "var(--brand)" : "#e2e8f0",
                color: activeTab === tab.key ? "white" : "#64748b",
                padding: "0.05rem 0.4rem", borderRadius: "9999px",
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Score legend */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.875rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "9999px", backgroundColor: "#10b981", display: "inline-block" }} /> 75–100 Strong
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "9999px", backgroundColor: "#f59e0b", display: "inline-block" }} /> 50–74 Good
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "9999px", backgroundColor: "#94a3b8", display: "inline-block" }} /> &lt;50 Partial
          </span>
        </div>
      )}

      {/* Match list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          {activeTab === "shortlisted" ? (
            <>
              <Star style={{ width: "2.5rem", height: "2.5rem", color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>No shortlisted RFQs yet</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                Buyers will shortlist you when your profile matches their requirements.
              </p>
            </>
          ) : (
            <>
              <Inbox style={{ width: "2.5rem", height: "2.5rem", color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>No matched RFQs yet</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "24rem", margin: "0.25rem auto 0" }}>
                Complete your supplier profile to start getting matched with buyer RFQs.
              </p>
              <a
                href="/profile/supplier"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "0.5rem",
                  fontSize: "0.875rem", fontWeight: 600, color: "white",
                  backgroundColor: "var(--brand)", textDecoration: "none",
                }}
              >
                <TrendingUp style={{ width: "1rem", height: "1rem" }} />
                Complete your profile
              </a>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateShort(dateStr);
}
