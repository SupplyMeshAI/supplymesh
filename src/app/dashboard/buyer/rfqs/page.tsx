// src/app/dashboard/buyer/rfqs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Plus, FileText, Clock, CheckCircle2,
  Send, XCircle, Search, ChevronRight,
} from "lucide-react";
import type { Rfq, RfqStatus } from "@/lib/rfqs/types";

// ============================================================================
// Status config
// ============================================================================
const STATUS_CONFIG: Record<RfqStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: {
    label: "Draft",
    color: "var(--text-muted)",
    bg: "var(--surface2)",
    icon: <FileText style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  submitted: {
    label: "Submitted",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.12)",
    icon: <Send style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  matching: {
    label: "Matching",
    color: "var(--amber)",
    bg: "rgba(245,158,11,0.12)",
    icon: <Search style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  shortlisted: {
    label: "Shortlisted",
    color: "var(--brand)",
    bg: "rgba(37,99,235,0.12)",
    icon: <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  closed: {
    label: "Closed",
    color: "var(--green)",
    bg: "rgba(34,197,94,0.1)",
    icon: <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--red)",
    bg: "rgba(239,68,68,0.12)",
    icon: <XCircle style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
};

type FilterStatus = "all" | RfqStatus;

// ============================================================================
// Component
// ============================================================================
export default function RfqListPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadRfqs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: membership } = await supabase
        .from("company_members").select("company_id").eq("profile_id", user.id).single();
      if (!membership) { router.push("/auth/onboarding"); return; }

      const { data, error } = await supabase
        .from("rfqs").select("*").eq("company_id", membership.company_id)
        .order("created_at", { ascending: false });

      if (!error) setRfqs(data || []);
      setLoading(false);
    }
    loadRfqs();
  }, [router]);

  const filtered = rfqs.filter(rfq => {
    if (filter !== "all" && rfq.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!rfq.project_name?.toLowerCase().includes(q) && !rfq.part_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts: Record<string, number> = { all: rfqs.length };
  rfqs.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });

  async function deleteDraft(rfqId: string) {
    if (!confirm("Delete this draft? This can't be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("rfqs").delete().eq("id", rfqId);
    if (!error) setRfqs(prev => prev.filter(r => r.id !== rfqId));
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
    </div>
  );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>Your RFQs</h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "5px" }}>
            {rfqs.length} total · {counts["draft"] || 0} drafts · {counts["submitted"] || 0} submitted
          </p>
        </div>
        <Link href="/dashboard/buyer/rfqs/new" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 16px", fontSize: "0.875rem", fontWeight: 600,
          color: "white", backgroundColor: "var(--brand)", textDecoration: "none",
        }}>
          <Plus style={{ width: "1rem", height: "1rem" }} />
          New RFQ
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "10px" }}>
        <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by project or part name..."
          style={{
            width: "100%", padding: "8px 10px 8px 34px",
            border: "1px solid var(--border2)", backgroundColor: "var(--surface2)",
            color: "var(--text)", fontSize: "0.875rem", outline: "none",
            boxSizing: "border-box" as const,
          }}
        />
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {(["all", "draft", "submitted", "matching", "shortlisted", "closed"] as FilterStatus[]).map(s => {
          const active = filter === s;
          return (
            <button key={s} type="button" onClick={() => setFilter(s)} style={{
              padding: "5px 12px", fontSize: "0.8125rem", fontWeight: 500,
              border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
              backgroundColor: active ? "rgba(37,99,235,0.1)" : "var(--surface)",
              color: active ? "var(--brand)" : "var(--text-muted)",
              cursor: "pointer", textTransform: "capitalize",
            }}>
              {s === "all" ? "All" : s}{counts[s] ? ` (${counts[s]})` : ""}
            </button>
          );
        })}
      </div>

      {/* RFQ list */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "48px 24px", textAlign: "center" }}>
          <FileText style={{ width: "2.5rem", height: "2.5rem", color: "var(--text-subtle)", margin: "0 auto 12px" }} />
          {rfqs.length === 0 ? (
            <>
              <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>No RFQs yet</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Create your first RFQ to start finding matched suppliers.
              </p>
              <Link href="/dashboard/buyer/rfqs/new" style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 16px", fontSize: "0.875rem", fontWeight: 600,
                color: "white", backgroundColor: "var(--brand)", textDecoration: "none",
              }}>
                <Plus style={{ width: "1rem", height: "1rem" }} /> Create RFQ
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>No matching RFQs</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Try a different filter or search term.</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filtered.map(rfq => {
            const config  = STATUS_CONFIG[rfq.status];
            const isDraft = rfq.status === "draft";
            const processCount = rfq.processes_required?.length || 0;
            const certCount    = rfq.certifications_required?.length || 0;

            return (
              <div
                key={rfq.id}
                onClick={() => router.push(isDraft ? `/dashboard/buyer/rfqs/new?draft=${rfq.id}` : `/dashboard/buyer/rfqs/${rfq.id}`)}
                style={{
                  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
                  padding: "14px 18px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "14px",
                  transition: "border-color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
              >
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {rfq.part_name || rfq.project_name || "Untitled RFQ"}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "2px 7px", fontSize: "0.75rem", fontWeight: 600,
                      color: config.color, backgroundColor: config.bg,
                      flexShrink: 0, fontFamily: "var(--font-mono)",
                    }}>
                      {config.icon}{config.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {rfq.project_name && rfq.part_name && <span>{rfq.project_name}</span>}
                    {processCount > 0 && <span>{processCount} process{processCount !== 1 ? "es" : ""}</span>}
                    {certCount > 0 && <span>{certCount} cert{certCount !== 1 ? "s" : ""}</span>}
                    {rfq.lot_size && <span>{rfq.lot_size}</span>}
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock style={{ width: "0.7rem", height: "0.7rem" }} />
                      {formatDate(isDraft ? rfq.updated_at : rfq.submitted_at || rfq.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {isDraft && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); deleteDraft(rfq.id); }}
                      style={{
                        padding: "3px 8px", fontSize: "0.75rem",
                        color: "var(--red)", background: "none",
                        border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <ChevronRight style={{ width: "1rem", height: "1rem", color: "var(--text-subtle)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
