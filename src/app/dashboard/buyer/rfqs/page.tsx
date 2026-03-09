// src/app/dashboard/buyer/rfqs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  XCircle,
  Search,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type { Rfq, RfqStatus } from "@/lib/rfqs/types";

// ============================================================================
// Status config
// ============================================================================
const STATUS_CONFIG: Record<RfqStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: {
    label: "Draft",
    color: "#94a3b8",
    bg: "#f1f5f9",
    icon: <FileText style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  submitted: {
    label: "Submitted",
    color: "#3b82f6",
    bg: "#eff6ff",
    icon: <Send style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  matching: {
    label: "Matching",
    color: "#f59e0b",
    bg: "#fffbeb",
    icon: <Search style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  shortlisted: {
    label: "Shortlisted",
    color: "var(--brand)",
    bg: "var(--brand-light)",
    icon: <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  closed: {
    label: "Closed",
    color: "#10b981",
    bg: "#ecfdf5",
    icon: <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem" }} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "#fef2f2",
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

      // Get user's company
      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("profile_id", user.id)
        .single();

      if (!membership) { router.push("/auth/onboarding"); return; }

      // Fetch all RFQs for this company
      const { data, error } = await supabase
        .from("rfqs")
        .select("*")
        .eq("company_id", membership.company_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading RFQs:", error);
      } else {
        setRfqs(data || []);
      }
      setLoading(false);
    }
    loadRfqs();
  }, [router]);

  // ============================================================================
  // Filter & search
  // ============================================================================
  const filtered = rfqs.filter(rfq => {
    if (filter !== "all" && rfq.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesProject = rfq.project_name?.toLowerCase().includes(q);
      const matchesPart = rfq.part_name?.toLowerCase().includes(q);
      if (!matchesProject && !matchesPart) return false;
    }
    return true;
  });

  // Count by status for filter badges
  const counts: Record<string, number> = { all: rfqs.length };
  rfqs.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });

  // ============================================================================
  // Delete draft
  // ============================================================================
  async function deleteDraft(rfqId: string) {
    if (!confirm("Delete this draft? This can't be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("rfqs").delete().eq("id", rfqId);
    if (!error) {
      setRfqs(prev => prev.filter(r => r.id !== rfqId));
    }
  }

  // ============================================================================
  // Render
  // ============================================================================
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
            Your RFQs
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
            {rfqs.length} total · {counts["draft"] || 0} drafts · {counts["submitted"] || 0} submitted
          </p>
        </div>
        <Link href="/dashboard/buyer/rfqs/new" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}>
          <Plus style={{ width: "1rem", height: "1rem" }} />
          New RFQ
        </Link>
      </div>

      {/* Search & Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#94a3b8" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input"
            placeholder="Search by project or part name..."
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>

        {/* Status filter tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["all", "draft", "submitted", "matching", "shortlisted", "closed"] as FilterStatus[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.8rem",
                fontWeight: 500,
                border: filter === s ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                backgroundColor: filter === s ? "var(--brand-light)" : "white",
                color: filter === s ? "var(--brand)" : "#64748b",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s === "all" ? "All" : s} {counts[s] ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <FileText style={{ width: "2.5rem", height: "2.5rem", color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
          {rfqs.length === 0 ? (
            <>
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>No RFQs yet</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
                Create your first RFQ to start finding matched suppliers.
              </p>
              <Link href="/dashboard/buyer/rfqs/new" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}>
                <Plus style={{ width: "1rem", height: "1rem" }} />
                Create RFQ
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>No matching RFQs</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                Try a different filter or search term.
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(rfq => {
            const config = STATUS_CONFIG[rfq.status];
            const isDraft = rfq.status === "draft";
            const processCount = rfq.processes_required?.length || 0;
            const certCount = rfq.certifications_required?.length || 0;

            return (
              <div
                key={rfq.id}
                className="card"
                style={{
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
                onClick={() => {
                  if (isDraft) {
                    router.push(`/dashboard/buyer/rfqs/new?draft=${rfq.id}`);
                  } else {
                    router.push(`/dashboard/buyer/rfqs/${rfq.id}`);
                  }
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {rfq.part_name || rfq.project_name || "Untitled RFQ"}
                    </span>
                    {/* Status badge */}
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: config.color,
                      backgroundColor: config.bg,
                      flexShrink: 0,
                    }}>
                      {config.icon}
                      {config.label}
                    </span>
                  </div>

                  {/* Subtitle row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                    {rfq.project_name && rfq.part_name && (
                      <span>{rfq.project_name}</span>
                    )}
                    {processCount > 0 && (
                      <span>{processCount} process{processCount !== 1 ? "es" : ""}</span>
                    )}
                    {certCount > 0 && (
                      <span>{certCount} cert{certCount !== 1 ? "s" : ""}</span>
                    )}
                    {rfq.lot_size && (
                      <span>{rfq.lot_size}</span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock style={{ width: "0.7rem", height: "0.7rem" }} />
                      {formatDate(isDraft ? rfq.updated_at : rfq.submitted_at || rfq.created_at)}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  {isDraft && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); deleteDraft(rfq.id); }}
                      style={{
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.75rem",
                        color: "#ef4444",
                        background: "none",
                        border: "1px solid #fecaca",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <ChevronRight style={{ width: "1rem", height: "1rem", color: "#cbd5e1" }} />
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
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}