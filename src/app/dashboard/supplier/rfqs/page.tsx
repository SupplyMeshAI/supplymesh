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

type CompanyRow = { id: string; name: string };

type InboxItem = MatchRow & {
  rfq: RfqRow | null;
  buyer_company: CompanyRow | null;
};

// ============================================================================
// Helpers
// ============================================================================
const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "var(--text-muted)",  bg: "var(--surface2)" },
  standard: { label: "Standard", color: "#3b82f6",            bg: "rgba(59,130,246,0.12)" },
  urgent:   { label: "Urgent",   color: "var(--red)",         bg: "rgba(239,68,68,0.12)" },
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
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return formatDate(d);
}

// ============================================================================
// Score ring
// ============================================================================
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--text-subtle)";
  return (
    <div style={{
      width: "3.25rem", height: "3.25rem", flexShrink: 0,
      border: `2px solid ${color}`, backgroundColor: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: "0.875rem", fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>
        {score}
      </span>
    </div>
  );
}

// ============================================================================
// Match card
// ============================================================================
function MatchCard({ item }: { item: InboxItem }) {
  const [expanded, setExpanded] = useState(false);
  const { rfq, buyer_company } = item;
  const isInvited = item.status === "shortlisted";
  const isQuoted  = item.status === "quoted";
  const priority  = rfq?.priority
    ? (PRIORITY_CONFIG[rfq.priority] ?? PRIORITY_CONFIG.standard)
    : PRIORITY_CONFIG.standard;
  const processes      = rfq?.processes_required?.slice(0, 3) ?? [];
  const extraProcesses = Math.max(0, (rfq?.processes_required?.length ?? 0) - 3);

  const cardBorder = isInvited ? "1px solid var(--brand)"
    : isQuoted ? "1px solid var(--green)"
    : "1px solid var(--border)";
  const cardBg = isInvited ? "rgba(37,99,235,0.07)"
    : isQuoted ? "rgba(34,197,94,0.07)"
    : "var(--surface)";

  return (
    <div style={{ backgroundColor: cardBg, border: cardBorder, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <ScoreRing score={item.match_score} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <Link href={`/dashboard/supplier/rfqs/${rfq?.id}`} style={{ textDecoration: "none" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)" }}>
                    {rfq?.part_name || rfq?.project_name || "Untitled RFQ"}
                  </h3>
                </Link>
                {isInvited && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    fontSize: "0.6875rem", fontWeight: 600, color: "var(--brand)",
                    backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid var(--brand)",
                    padding: "1px 7px",
                  }}>
                    <Star style={{ width: "0.6rem", height: "0.6rem" }} /> Invited to Quote
                  </span>
                )}
                {isQuoted && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    fontSize: "0.6875rem", fontWeight: 600, color: "var(--green)",
                    backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid var(--green)",
                    padding: "1px 7px",
                  }}>
                    ✓ Quote submitted
                  </span>
                )}
              </div>
              {buyer_company?.name && (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Building2 style={{ width: "0.75rem", height: "0.75rem" }} />
                  {buyer_company.name}
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px",
                color: priority.color, backgroundColor: priority.bg,
                fontFamily: "var(--font-mono)",
              }}>
                {priority.label}
              </span>
              {rfq?.needed_by_date && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Due {formatDate(rfq.needed_by_date)}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
            {rfq?.lot_size && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                <Package style={{ width: "0.75rem", height: "0.75rem" }} />
                {rfq.lot_size}
              </span>
            )}
            {processes.length > 0 && (
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {processes.map(p => (
                  <span key={p} style={{
                    fontSize: "0.75rem", fontWeight: 500, padding: "2px 7px",
                    backgroundColor: "var(--surface2)", color: "var(--text-muted)",
                    border: "1px solid var(--border2)", fontFamily: "var(--font-mono)",
                  }}>
                    {PROCESS_LABELS[p] ?? p}
                  </span>
                ))}
                {extraProcesses > 0 && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+{extraProcesses} more</span>
                )}
              </div>
            )}
            <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginLeft: "auto" }}>
              {formatRelative(item.created_at)}
            </span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", flexShrink: 0 }}
        >
          {expanded
            ? <ChevronUp   style={{ width: "1rem", height: "1rem" }} />
            : <ChevronDown style={{ width: "1rem", height: "1rem" }} />}
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
          {(item.match_details ?? []).length > 0 && (
            <>
              <p style={{
                fontSize: "0.6875rem", fontWeight: 500, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px",
                fontFamily: "var(--font-mono)",
              }}>
                Why you were matched
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
                {item.match_details!.map((reason, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem", color: "var(--text)" }}>
                    <CheckCircle2 style={{ width: "14px", height: "14px", color: "var(--green)", flexShrink: 0, marginTop: "2px" }} />
                    {reason}
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginBottom: "14px" }}>
            <Link
              href={`/dashboard/supplier/rfqs/${rfq?.id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 16px", fontSize: "0.875rem", fontWeight: 600,
                color: "white", backgroundColor: "var(--brand)", textDecoration: "none",
              }}
            >
              View details & quote →
            </Link>
          </div>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {(rfq?.certifications_required ?? []).length > 0 && (
              <div>
                <p style={{
                  fontSize: "0.6875rem", fontWeight: 500, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px",
                  fontFamily: "var(--font-mono)",
                }}>
                  Certs required
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 500 }}>
                  {rfq!.certifications_required!.join(", ")}
                </p>
              </div>
            )}
            {rfq?.submitted_at && (
              <div>
                <p style={{
                  fontSize: "0.6875rem", fontWeight: 500, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px",
                  fontFamily: "var(--font-mono)",
                }}>
                  Submitted
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 500 }}>
                  {formatDate(rfq.submitted_at)}
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
// Page
// ============================================================================
export default function SupplierRfqInboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "invited" | "quoted">("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: membership } = await supabase
        .from("company_members").select("company_id").eq("profile_id", user.id).single();
      if (!membership) { router.push("/auth/onboarding"); return; }

      const { data: sp } = await supabase
        .from("supplier_profiles").select("id").eq("company_id", membership.company_id).single();
      if (!sp) { setLoading(false); return; }

      const [{ data: matched }, { data: shortlisted }, { data: quoted }] = await Promise.all([
        supabase.from("rfq_matches").select("id, rfq_id, match_score, match_details, status, created_at").eq("supplier_id", sp.id).eq("status", "matched"),
        supabase.from("rfq_matches").select("id, rfq_id, match_score, match_details, status, created_at").eq("supplier_id", sp.id).eq("status", "shortlisted"),
        supabase.from("rfq_matches").select("id, rfq_id, match_score, match_details, status, created_at").eq("supplier_id", sp.id).eq("status", "quoted"),
      ]);

      const allMatches: MatchRow[] = [
        ...((matched ?? []) as MatchRow[]),
        ...((shortlisted ?? []) as MatchRow[]),
        ...((quoted ?? []) as MatchRow[]),
      ].sort((a, b) => b.match_score - a.match_score);

      if (allMatches.length === 0) { setLoading(false); return; }

      const { data: rfqs } = await supabase
        .from("rfqs")
        .select("id, part_name, project_name, lot_size, priority, needed_by_date, processes_required, certifications_required, submitted_at, company_id")
        .in("id", allMatches.map(m => m.rfq_id));

      const companyIds = [...new Set((rfqs ?? []).map(r => r.company_id).filter(Boolean))];
      const { data: companies } = companyIds.length > 0
        ? await supabase.from("companies").select("id, name").in("id", companyIds)
        : { data: [] as CompanyRow[] };

      const rfqMap     = Object.fromEntries((rfqs ?? []).map(r => [r.id, r as RfqRow]));
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

  const invitedCount = items.filter(i => i.status === "shortlisted").length;
  const quotedCount  = items.filter(i => i.status === "quoted").length;

  const filtered =
    activeTab === "invited" ? items.filter(i => i.status === "shortlisted") :
    activeTab === "quoted"  ? items.filter(i => i.status === "quoted") :
    items;

  const TABS: { value: "all" | "invited" | "quoted"; label: string; count: number }[] = [
    { value: "all",     label: "All Matches",      count: items.length },
    { value: "invited", label: "Invited to Quote", count: invitedCount },
    { value: "quoted",  label: "Quotes Submitted", count: quotedCount },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
    </div>
  );

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>RFQ Inbox</h1>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "5px" }}>
          {items.length} matched · {invitedCount} invited to quote · {quotedCount} quotes submitted
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {TABS.map(({ value, label, count }) => {
          const active = activeTab === value;
          return (
            <button key={value} type="button" onClick={() => setActiveTab(value)} style={{
              padding: "6px 14px", fontSize: "0.875rem", fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
              border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
              backgroundColor: active ? "rgba(37,99,235,0.1)" : "var(--surface)",
              color: active ? "var(--brand)" : "var(--text-muted)",
            }}>
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: "0.75rem", fontWeight: 600, padding: "1px 6px",
                  backgroundColor: active ? "var(--brand)" : "var(--surface2)",
                  color: active ? "white" : "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
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
        <div style={{ display: "flex", gap: "14px", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "12px" }}>
          {[
            ["var(--green)",       "75–100 Strong"],
            ["var(--amber)",       "50–74 Good"],
            ["var(--text-subtle)", "<50 Partial"],
          ].map(([color, label]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* List or empty state */}
      {filtered.length === 0 ? (
        <div style={{
          backgroundColor: "var(--surface)", border: "1px solid var(--border)",
          padding: "48px 24px", textAlign: "center",
        }}>
          {activeTab === "invited" ? (
            <>
              <Star style={{ width: "2.5rem", height: "2.5rem", color: "var(--text-subtle)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>No invitations yet</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Buyers will invite you to quote when your profile matches their needs.
              </p>
            </>
          ) : activeTab === "quoted" ? (
            <>
              <CheckCircle2 style={{ width: "2.5rem", height: "2.5rem", color: "var(--text-subtle)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>No quotes submitted yet</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Quotes you submit will appear here.
              </p>
            </>
          ) : (
            <>
              <Inbox style={{ width: "2.5rem", height: "2.5rem", color: "var(--text-subtle)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>No matched RFQs yet</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "24rem", margin: "6px auto 0" }}>
                Complete your supplier profile to start getting matched with buyer RFQs.
              </p>
              <Link href="/profile/supplier" style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                marginTop: "16px", padding: "7px 16px",
                fontSize: "0.875rem", fontWeight: 600, color: "white",
                backgroundColor: "var(--brand)", textDecoration: "none",
              }}>
                <TrendingUp style={{ width: "1rem", height: "1rem" }} />
                Complete your profile
              </Link>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(item => <MatchCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
