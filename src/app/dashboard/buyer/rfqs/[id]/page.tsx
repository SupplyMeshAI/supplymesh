// src/app/dashboard/buyer/rfqs/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Send,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Star,
  Calendar,
  MapPin,
  Zap,
  Package,
  Settings,
  Award,
  DollarSign,
  StickyNote,
  CheckCheck,
  Building2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import type { Rfq, RfqStatus, RfqMatch } from "@/lib/rfqs/types";

// ============================================================================
// Constants
// ============================================================================
const PROCESSES: Record<string, string> = {
  cnc_milling: "CNC Milling",
  cnc_turning: "CNC Turning",
  sheet_metal_fabrication: "Sheet Metal Fabrication",
  injection_molding: "Injection Molding",
  casting: "Casting",
  forging: "Forging",
  additive_3d_printing: "3D Printing / Additive",
  welding_fabrication: "Welding / Fabrication",
  stamping: "Stamping",
  laser_cutting: "Laser Cutting",
  waterjet_cutting: "Waterjet Cutting",
  pcb_assembly: "PCB Assembly",
  grinding: "Grinding",
  edm: "EDM",
  other: "Other",
};

const CERTIFICATIONS: Record<string, string> = {
  iso_9001: "ISO 9001",
  iatf_16949: "IATF 16949",
  as9100: "AS9100",
  iso_13485: "ISO 13485",
  nadcap: "NADCAP",
  iso_14001: "ISO 14001",
  itar_registered: "ITAR Registered",
  mil_spec: "Mil-Spec Capable",
  ul_listed: "UL Listed",
  rohs: "RoHS Compliant",
};

const STATUS_CONFIG: Record<RfqStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  description: string;
}> = {
  draft: {
    label: "Draft",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    icon: <FileText style={{ width: "1rem", height: "1rem" }} />,
    description: "This RFQ has not been submitted yet.",
  },
  submitted: {
    label: "Submitted",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: <Send style={{ width: "1rem", height: "1rem" }} />,
    description: "Your RFQ has been submitted and is being reviewed.",
  },
  matching: {
    label: "Matching in Progress",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <Search style={{ width: "1rem", height: "1rem" }} />,
    description: "We&apos;re finding the best suppliers for your requirements.",
  },
  shortlisted: {
    label: "Suppliers Shortlisted",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: <CheckCircle2 style={{ width: "1rem", height: "1rem" }} />,
    description: "Matched suppliers have been shortlisted and notified.",
  },
  closed: {
    label: "Closed",
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    icon: <CheckCheck style={{ width: "1rem", height: "1rem" }} />,
    description: "This RFQ has been successfully closed.",
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: <XCircle style={{ width: "1rem", height: "1rem" }} />,
    description: "This RFQ has been cancelled.",
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#64748b", bg: "#f1f5f9" },
  standard: { label: "Standard", color: "#3b82f6", bg: "#eff6ff" },
  urgent: { label: "Urgent", color: "#ef4444", bg: "#fef2f2" },
};

// ============================================================================
// Types
// ============================================================================
// Extended match type — supplier_id FK points to supplier_profiles, then joins companies
type MatchWithCompany = Omit<RfqMatch, "match_reasons"> & {
  match_details: string[];
  supplier: {
    company_id: string;
    company: {
      id: string;
      name: string;
      city: string | null;
      state_region: string | null;
      website: string | null;
    } | null;
  } | null;
};

// Helper to extract company from nested join
function getCompany(match: MatchWithCompany) {
  return match.supplier?.company ?? null;
}

// ============================================================================
// Score ring
// ============================================================================
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#94a3b8";
  return (
    <div style={{
      width: "3rem", height: "3rem", borderRadius: "9999px",
      border: `3px solid ${color}`, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, backgroundColor: `${color}18`,
    }}>
      <span style={{ fontSize: "0.8rem", fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

// ============================================================================
// Match card
// ============================================================================
function MatchCard({ match, onShortlist, shortlisting }: {
  match: MatchWithCompany;
  onShortlist: (matchId: string) => void;
  shortlisting: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isShortlisted = match.status === "shortlisted";
  const company = getCompany(match);

  return (
    <div className="card" style={{
      padding: "1rem 1.25rem",
      border: isShortlisted ? "1px solid var(--brand)" : "1px solid #e2e8f0",
      backgroundColor: isShortlisted ? "var(--brand-light)" : "white",
      transition: "all 0.15s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <ScoreRing score={match.match_score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#0f172a" }}>
              {company?.name || "Unknown Supplier"}
            </span>
            {isShortlisted && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 600, color: "var(--brand)",
                backgroundColor: "white", border: "1px solid var(--brand)",
                padding: "0.1rem 0.5rem", borderRadius: "9999px",
              }}>
                Shortlisted
              </span>
            )}
          </div>
          {company?.city && (
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <MapPin style={{ width: "0.7rem", height: "0.7rem" }} />
              {company.city}{company.state_region ? `, ${company.state_region}` : ""}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {!isShortlisted && (
            <button
              type="button"
              onClick={() => onShortlist(match.id)}
              disabled={shortlisting === match.id}
              style={{
                padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 500,
                color: "var(--brand)", background: "white", border: "1px solid var(--brand)",
                borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem",
              }}
            >
              {shortlisting === match.id
                ? <Loader2 style={{ width: "0.75rem", height: "0.75rem" }} className="animate-spin" />
                : <Star style={{ width: "0.75rem", height: "0.75rem" }} />
              }
              Shortlist
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0.25rem" }}
          >
            {expanded
              ? <ChevronUp style={{ width: "1rem", height: "1rem" }} />
              : <ChevronDown style={{ width: "1rem", height: "1rem" }} />
            }
          </button>
        </div>
      </div>

      {expanded && match.match_details?.length > 0 && (
        <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid #f1f5f9" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Why this match
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {match.match_details.map((reason, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.825rem", color: "#334155" }}>
                <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem", color: "#10b981", flexShrink: 0, marginTop: "0.1rem" }} />
                {reason}
              </div>
            ))}
          </div>
          {company?.website && (
            <a
              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--brand)", textDecoration: "none" }}
            >
              Visit website →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================
export default function RfqDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rfqId = params.id as string;
  const justSubmitted = searchParams.get("submitted") === "true";

  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [matches, setMatches] = useState<MatchWithCompany[]>([]);
  const [loadingRfq, setLoadingRfq] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [shortlisting, setShortlisting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSubmittedBanner, setShowSubmittedBanner] = useState(justSubmitted);

  // Load RFQ
  useEffect(() => {
    async function loadRfq() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("profile_id", user.id)
        .single();

      if (!membership) { router.push("/auth/onboarding"); return; }

      const { data, error: fetchError } = await supabase
        .from("rfqs")
        .select("*")
        .eq("id", rfqId)
        .eq("company_id", membership.company_id)
        .single();

      if (fetchError || !data) {
        setError("RFQ not found or you don't have access.");
      } else {
        setRfq(data);
        // Load matches inline — avoids cascading setState across effects
        if (["matching", "shortlisted", "closed"].includes(data.status)) {
          setLoadingMatches(true);
          const { data: matchData, error: matchError } = await supabase
            .from("rfq_matches")
            .select(`
              *,
              supplier:supplier_profiles!rfq_matches_supplier_id_fkey (
                company_id,
                company:companies!supplier_profiles_company_id_fkey (
                  id,
                  name,
                  city,
                  state_region,
                  website
                )
              )
            `)
            .eq("rfq_id", rfqId)
            .order("match_score", { ascending: false });

          if (!matchError && matchData) {
            setMatches(matchData as MatchWithCompany[]);
          }
          setLoadingMatches(false);
        }
      }
      setLoadingRfq(false);
    }
    loadRfq();
  }, [rfqId, router]);

  // loadMatches — used by re-run button and shortlist refresh
  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    const supabase = createClient();
    const { data, error: matchError } = await supabase
      .from("rfq_matches")
      .select(`
        *,
        supplier:supplier_profiles!rfq_matches_supplier_id_fkey (
          company_id,
          company:companies!supplier_profiles_company_id_fkey (
            id,
            name,
            city,
            state_region,
            website
          )
        )
      `)
      .eq("rfq_id", rfqId)
      .order("match_score", { ascending: false });

    if (!matchError && data) {
      setMatches(data as MatchWithCompany[]);
    }
    setLoadingMatches(false);
  }, [rfqId]);

  // Auto-hide banner
  useEffect(() => {
    if (!showSubmittedBanner) return;
    const t = setTimeout(() => setShowSubmittedBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showSubmittedBanner]);

  async function handleCancel() {
    if (!rfq) return;
    if (!confirm("Cancel this RFQ? This action cannot be undone.")) return;
    setCancelling(true);
    const supabase = createClient();
    const { error: cancelError } = await supabase
      .from("rfqs").update({ status: "cancelled" }).eq("id", rfq.id);
    if (cancelError) {
      setError(cancelError.message);
    } else {
      setRfq(prev => prev ? { ...prev, status: "cancelled" } : prev);
    }
    setCancelling(false);
  }

  async function handleRerunMatching() {
    if (!rfq) return;
    setRerunning(true);
    try {
      const res = await fetch("/api/rfqs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfq_id: rfq.id }),
      });
      const json = await res.json();
      if (res.ok) {
        await loadMatches();
        setRfq(prev => prev ? { ...prev, status: "matching" } : prev);
      } else {
        setError(json.error || "Matching failed");
      }
    } catch {
      setError("Matching request failed");
    }
    setRerunning(false);
  }

  async function handleShortlist(matchId: string) {
    setShortlisting(matchId);
    const supabase = createClient();
    const { error: shortlistError } = await supabase
      .from("rfq_matches").update({ status: "shortlisted" }).eq("id", matchId);

    if (!shortlistError) {
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: "shortlisted" as const } : m));
      if (rfq?.status === "matching") {
        const supabase2 = createClient();
        await supabase2.from("rfqs").update({ status: "shortlisted" }).eq("id", rfq.id);
        setRfq(prev => prev ? { ...prev, status: "shortlisted" } : prev);
      }
    }
    setShortlisting(null);
  }

  if (loadingRfq) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div style={{ maxWidth: "700px", margin: "4rem auto", padding: "0 1rem", textAlign: "center" }}>
        <p style={{ color: "#ef4444", marginBottom: "1rem" }}>{error || "RFQ not found."}</p>
        <Link href="/dashboard/buyer/rfqs" className="btn-secondary">← Back to RFQs</Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[rfq.status];
  const priorityCfg = PRIORITY_CONFIG[rfq.priority];
  const isDraft = rfq.status === "draft";
  const isCancellable = ["submitted", "matching", "shortlisted"].includes(rfq.status);
  const showMatches = ["matching", "shortlisted", "closed"].includes(rfq.status);
  const shortlistedCount = matches.filter(m => m.status === "shortlisted").length;

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "2rem 1rem" }}>

      {/* Success banner */}
      {showSubmittedBanner && (
        <div style={{
          marginBottom: "1.5rem", padding: "0.875rem 1.25rem", borderRadius: "0.75rem",
          backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0",
          display: "flex", alignItems: "center", gap: "0.75rem",
          color: "#065f46", fontSize: "0.9rem", fontWeight: 500,
        }}>
          <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem", color: "#10b981", flexShrink: 0 }} />
          RFQ submitted successfully! We&apos;ll begin matching you with suppliers shortly.
        </div>
      )}

      {/* Back nav */}
      <Link href="/dashboard/buyer/rfqs" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", color: "#64748b", textDecoration: "none", marginBottom: "1.25rem" }}>
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
        Back to RFQs
      </Link>

      {/* Header card */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
              {rfq.part_name || rfq.project_name || "Untitled RFQ"}
            </h1>
            {rfq.project_name && rfq.part_name && (
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>{rfq.project_name}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
            {isDraft && (
              <Link href={`/dashboard/buyer/rfqs/new?draft=${rfq.id}`} className="btn-primary" style={{ textDecoration: "none", fontSize: "0.875rem" }}>
                Continue Editing
              </Link>
            )}
            {isCancellable && (
              <button type="button" onClick={handleCancel} disabled={cancelling}
                style={{ padding: "0.4rem 0.875rem", fontSize: "0.8rem", color: "#ef4444", background: "white", border: "1px solid #fecaca", borderRadius: "0.5rem", cursor: "pointer" }}>
                {cancelling ? "Cancelling..." : "Cancel RFQ"}
              </button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div style={{ marginTop: "1.25rem", padding: "0.875rem 1rem", borderRadius: "0.625rem", backgroundColor: statusCfg.bg, border: `1px solid ${statusCfg.border}`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: statusCfg.color }}>{statusCfg.icon}</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.9rem", color: statusCfg.color }}>{statusCfg.label}</p>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.1rem" }}>{statusCfg.description}</p>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right", fontSize: "0.8rem", color: "#94a3b8" }}>
            {rfq.submitted_at
              ? <><p>Submitted</p><p style={{ fontWeight: 500, color: "#64748b" }}>{formatDate(rfq.submitted_at)}</p></>
              : <><p>Created</p><p style={{ fontWeight: 500, color: "#64748b" }}>{formatDate(rfq.created_at)}</p></>
            }
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          <QuickStat icon={<Settings style={{ width: "0.85rem", height: "0.85rem" }} />} label="Processes" value={rfq.processes_required?.length ? `${rfq.processes_required.length} selected` : "None"} />
          <QuickStat icon={<Award style={{ width: "0.85rem", height: "0.85rem" }} />} label="Certifications" value={rfq.certifications_required?.length ? `${rfq.certifications_required.length} required` : "None"} />
          <QuickStat icon={<Package style={{ width: "0.85rem", height: "0.85rem" }} />} label="Lot size" value={rfq.lot_size || "Not specified"} />
          <QuickStat
            icon={<Zap style={{ width: "0.85rem", height: "0.85rem" }} />}
            label="Priority"
            value={<span style={{ color: priorityCfg.color, backgroundColor: priorityCfg.bg, padding: "0.1rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 }}>{priorityCfg.label}</span>}
          />
          {showMatches && (
            <QuickStat
              icon={<Building2 style={{ width: "0.85rem", height: "0.85rem" }} />}
              label="Matches"
              value={loadingMatches ? "..." : `${matches.length} found${shortlistedCount > 0 ? ` · ${shortlistedCount} shortlisted` : ""}`}
            />
          )}
        </div>
      </div>

      {/* Matches panel */}
      {showMatches && (
        <div className="card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#334155" }}>
              <TrendingUp style={{ width: "1rem", height: "1rem" }} />
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                Matched Suppliers
                {!loadingMatches && matches.length > 0 && (
                  <span style={{ marginLeft: "0.4rem", fontSize: "0.8rem", fontWeight: 400, color: "#94a3b8" }}>
                    ({matches.length} results, sorted by fit score)
                  </span>
                )}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRerunMatching}
              disabled={rerunning}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "0.3rem 0.65rem", cursor: "pointer" }}
            >
              <RefreshCw style={{ width: "0.75rem", height: "0.75rem" }} className={rerunning ? "animate-spin" : ""} />
              {rerunning ? "Running..." : "Re-run"}
            </button>
          </div>

          {loadingMatches ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
              <Loader2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--brand)" }} className="animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <Building2 style={{ width: "2rem", height: "2rem", color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
              <p style={{ fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>No matches yet</p>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
                No suppliers currently match your requirements. Try re-running or adjusting your RFQ criteria.
              </p>
              <button type="button" onClick={handleRerunMatching} disabled={rerunning} className="btn-primary" style={{ fontSize: "0.875rem" }}>
                {rerunning ? "Running..." : "Run Matching Now"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
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
              {matches.map(match => (
                <MatchCard key={match.id} match={match} onShortlist={handleShortlist} shortlisting={shortlisting} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <DetailSection title="Part Overview" icon={<FileText style={{ width: "1rem", height: "1rem" }} />}>
          <DetailRow label="Project name" value={rfq.project_name} note="Internal — not shown to suppliers" />
          <DetailRow label="Part name" value={rfq.part_name} />
          <DetailRow label="Description" value={rfq.part_description} wide />
        </DetailSection>

        <DetailSection title="Process & Material" icon={<Settings style={{ width: "1rem", height: "1rem" }} />}>
          {rfq.processes_required?.length > 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={labelStyle}>Processes required</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                {rfq.processes_required.map((p, i) => {
                  const isRequired = rfq.processes_required_flags?.[i] === "required";
                  return (
                    <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500, backgroundColor: isRequired ? "var(--brand-light)" : "#f1f5f9", color: isRequired ? "var(--brand)" : "#475569", border: isRequired ? "1px solid var(--brand)" : "1px solid #e2e8f0" }}>
                      {isRequired ? <Lock style={{ width: "0.65rem", height: "0.65rem" }} /> : <Star style={{ width: "0.65rem", height: "0.65rem", color: "#94a3b8" }} />}
                      {PROCESSES[p] || p}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <DetailRow label="Primary material" value={rfq.material_primary ? `${rfq.material_primary}${rfq.material_is_required ? " (non-negotiable)" : ""}` : null} />
          <DetailRow label="Secondary operations" value={rfq.secondary_operations} />
        </DetailSection>

        <DetailSection title="Specs & Quantity" icon={<Package style={{ width: "1rem", height: "1rem" }} />}>
          <DetailRow label="General tolerance" value={rfq.tolerance_general} />
          <DetailRow label="Tightest tolerance" value={rfq.tolerance_tight} />
          <DetailRow label="Lot size" value={rfq.lot_size} />
          <DetailRow label="Annual volume" value={rfq.annual_volume} />
          <DetailRow label="Unique parts" value={rfq.num_unique_parts ? String(rfq.num_unique_parts) : null} />
        </DetailSection>

        <DetailSection title="Requirements" icon={<Award style={{ width: "1rem", height: "1rem" }} />}>
          {rfq.certifications_required?.length > 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={labelStyle}>Certifications</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                {rfq.certifications_required.map((c, i) => {
                  const isRequired = rfq.certifications_required_flags?.[i] === "required";
                  return (
                    <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500, backgroundColor: isRequired ? "var(--brand-light)" : "#f1f5f9", color: isRequired ? "var(--brand)" : "#475569", border: isRequired ? "1px solid var(--brand)" : "1px solid #e2e8f0" }}>
                      {isRequired ? <Lock style={{ width: "0.65rem", height: "0.65rem" }} /> : <Star style={{ width: "0.65rem", height: "0.65rem", color: "#94a3b8" }} />}
                      {CERTIFICATIONS[c] || c}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <DetailRow label="ITAR required" value={rfq.itar_required ? "Yes" : "No"} />
          <DetailRow label="Industry" value={rfq.industry} />
          <DetailRow label="Additional requirements" value={rfq.additional_requirements} wide />
        </DetailSection>

        <DetailSection title="Location, Timeline & Budget" icon={<MapPin style={{ width: "1rem", height: "1rem" }} />}>
          {rfq.preferred_regions?.length > 0 && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={labelStyle}>Preferred regions</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                {rfq.preferred_regions.map(r => (
                  <span key={r} style={{ padding: "0.25rem 0.625rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500, backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>{r}</span>
                ))}
              </div>
            </div>
          )}
          <DetailRow label="Quotes needed by" value={rfq.needed_by_date ? formatDateShort(rfq.needed_by_date) : null} icon={<Calendar style={{ width: "0.75rem", height: "0.75rem" }} />} />
          <DetailRow label="Production start" value={rfq.production_start ? formatDateShort(rfq.production_start) : null} icon={<Calendar style={{ width: "0.75rem", height: "0.75rem" }} />} />
          <DetailRow label="Budget range" value={(rfq as Rfq & { budget_notes?: string }).budget_notes} icon={<DollarSign style={{ width: "0.75rem", height: "0.75rem" }} />} />
          <DetailRow label="Notes for suppliers" value={(rfq as Rfq & { special_instructions?: string }).special_instructions} wide icon={<StickyNote style={{ width: "0.75rem", height: "0.75rem" }} />} />
        </DetailSection>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1.25rem", fontSize: "0.75rem", color: "#94a3b8" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <Lock style={{ width: "0.65rem", height: "0.65rem" }} /> Non-negotiable
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <Star style={{ width: "0.65rem", height: "0.65rem" }} /> Preferred
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================
const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.05em",
};

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#334155" }}>
        {icon}
        <h2 style={{ fontSize: "0.9rem", fontWeight: 600 }}>{title}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1.5rem" }}>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, note, wide, icon }: {
  label: string; value: string | number | null | undefined;
  note?: string; wide?: boolean; icon?: React.ReactNode;
}) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : "auto" }}>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: 500, marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
        {icon && <span style={{ color: "#94a3b8" }}>{icon}</span>}
        {value}
      </p>
      {note && <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.1rem" }}>{note}</p>}
    </div>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
      <span style={{ color: "#94a3b8" }}>{icon}</span>
      <span style={{ color: "#64748b" }}>{label}:</span>
      <span style={{ fontWeight: 600, color: "#334155" }}>{value}</span>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
