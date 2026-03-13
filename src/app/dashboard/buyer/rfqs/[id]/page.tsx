// src/app/dashboard/buyer/rfqs/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, ArrowLeft, FileText, Send, Search, CheckCircle2, XCircle,
  Lock, Star, Calendar, MapPin, Zap, Package, Settings, Award,
  DollarSign, StickyNote, CheckCheck, Building2, TrendingUp,
  ChevronDown, ChevronUp, RefreshCw, Clock, MessageSquare, Sparkles,
} from "lucide-react";
import type { Rfq, RfqMatch } from "@/lib/rfqs/types";

// ── NOTE: add "matched" to your RfqStatus union in lib/rfqs/types.ts:
//   export type RfqStatus = "draft" | "submitted" | "matching" | "matched" | "shortlisted" | "closed" | "cancelled";
// ── In Supabase run:
//   alter type rfq_status add value 'matched';

// ============================================================================
// Constants
// ============================================================================
const PROCESSES: Record<string, string> = {
  cnc_milling: "CNC Milling", cnc_turning: "CNC Turning",
  sheet_metal_fabrication: "Sheet Metal Fabrication", injection_molding: "Injection Molding",
  casting: "Casting", forging: "Forging", additive_3d_printing: "3D Printing / Additive",
  welding_fabrication: "Welding / Fabrication", stamping: "Stamping",
  laser_cutting: "Laser Cutting", waterjet_cutting: "Waterjet Cutting",
  pcb_assembly: "PCB Assembly", grinding: "Grinding", edm: "EDM", other: "Other",
};

const CERTIFICATIONS: Record<string, string> = {
  iso_9001: "ISO 9001", iatf_16949: "IATF 16949", as9100: "AS9100",
  iso_13485: "ISO 13485", nadcap: "NADCAP", iso_14001: "ISO 14001",
  itar_registered: "ITAR Registered", mil_spec: "Mil-Spec Capable",
  ul_listed: "UL Listed", rohs: "RoHS Compliant",
};

type StatusCfg = { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description: string; };

const STATUS_CONFIG: Record<string, StatusCfg> = {
  draft:       { label: "Draft",                  color: "var(--text-muted)",  bg: "var(--surface2)",           border: "var(--border2)",            icon: <FileText style={{ width: "1rem", height: "1rem" }} />,      description: "This RFQ has not been submitted yet." },
  submitted:   { label: "Submitted",              color: "#60a5fa",            bg: "rgba(37,99,235,0.08)",      border: "rgba(37,99,235,0.25)",      icon: <Send style={{ width: "1rem", height: "1rem" }} />,          description: "Your RFQ has been submitted and is being reviewed." },
  matching:    { label: "Matching in Progress",   color: "var(--amber)",       bg: "rgba(245,158,11,0.08)",     border: "rgba(245,158,11,0.25)",     icon: <Search style={{ width: "1rem", height: "1rem" }} />,        description: "Finding the best suppliers for your requirements…" },
  matched:     { label: "Matching Complete",      color: "var(--green)",       bg: "rgba(34,197,94,0.08)",      border: "rgba(34,197,94,0.25)",      icon: <Sparkles style={{ width: "1rem", height: "1rem" }} />,      description: "Suppliers matched. Review results and shortlist the ones you want to hear from." },
  shortlisted: { label: "Suppliers Shortlisted",  color: "var(--purple)",      bg: "rgba(139,92,246,0.08)",     border: "rgba(139,92,246,0.25)",     icon: <CheckCircle2 style={{ width: "1rem", height: "1rem" }} />,  description: "Shortlisted suppliers have been notified and can submit quotes." },
  closed:      { label: "Closed",                 color: "var(--green)",       bg: "rgba(34,197,94,0.08)",      border: "rgba(34,197,94,0.25)",      icon: <CheckCheck style={{ width: "1rem", height: "1rem" }} />,    description: "This RFQ has been successfully closed." },
  cancelled:   { label: "Cancelled",              color: "var(--red)",         bg: "rgba(239,68,68,0.08)",      border: "rgba(239,68,68,0.25)",      icon: <XCircle style={{ width: "1rem", height: "1rem" }} />,       description: "This RFQ has been cancelled." },
};

const PRIORITY_CONFIG = {
  low:      { label: "Low",      color: "var(--text-muted)", bg: "var(--surface2)",     border: "var(--border2)" },
  standard: { label: "Standard", color: "#60a5fa",           bg: "rgba(37,99,235,0.1)", border: "rgba(37,99,235,0.3)" },
  urgent:   { label: "Urgent",   color: "var(--red)",        bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
};

// ============================================================================
// Types
// ============================================================================
type MatchWithCompany = Omit<RfqMatch, "match_reasons"> & {
  match_details: string[];
  supplier: {
    company_id: string;
    company: { id: string; name: string; city: string | null; state_region: string | null; website: string | null; } | null;
  } | null;
};

type Quote = {
  id: string; rfq_id: string; supplier_id: string;
  unit_price: number; lot_size: number; lead_time_days: number;
  valid_until: string | null; notes: string | null;
  status: string; created_at: string;
  supplier_company_name?: string; supplier_location?: string;
};

// ============================================================================
// Animated progress bar
// ============================================================================
function MatchingProgressBar({ complete }: { complete: boolean }) {
  // animatedProgress tracks the fake ramp-up (0→84%)
  // The actual displayed progress is overridden to 100 when complete
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Only run the step timers while not yet complete
    if (complete) return;

    const steps: Array<[number, number]> = [
      [8, 400], [18, 2000], [30, 4000], [44, 6000], [57, 8000], [68, 10000], [78, 12000], [88, 14000],
    ];
    const timers = steps.map(([target, delay]) =>
      setTimeout(() => setAnimatedProgress(target), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [complete]);

  // Derive final display value from prop — no setState needed for the complete case
  const progress = complete ? 100 : animatedProgress;

  const barColor = complete ? "var(--green)" : "var(--amber)";
  const trackColor = complete ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)";

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ height: "4px", backgroundColor: trackColor, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          backgroundColor: barColor,
          transition: complete ? "width 0.4s ease-out" : "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Shimmer — only shown while still in progress */}
          {!complete && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
              animation: "shimmer 1.5s infinite",
            }} />
          )}
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
        <p style={{ fontSize: "0.6875rem", color: complete ? "var(--green)" : "var(--text-subtle)", fontFamily: "var(--font-mono)", transition: "color 0.3s ease" }}>
          {complete ? "Match complete — results ready below" : "Evaluating supplier capabilities, certifications & capacity…"}
        </p>
        <p style={{
          fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 700,
          color: complete ? "var(--green)" : "var(--text-subtle)",
          transition: "color 0.3s ease",
        }}>
          {progress}%
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Score ring
// ============================================================================
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--text-subtle)";
  const bg    = score >= 75 ? "rgba(34,197,94,0.1)" : score >= 50 ? "rgba(245,158,11,0.1)" : "var(--surface2)";
  return (
    <div style={{
      width: "3rem", height: "3rem", border: `2px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, backgroundColor: bg,
    }}>
      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{score}</span>
    </div>
  );
}

// ============================================================================
// Match card
// ============================================================================
function MatchCard({
  match, onShortlist, shortlisting,
}: {
  match: MatchWithCompany;
  onShortlist: (matchId: string) => void;
  shortlisting: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isShortlisted = match.status === "shortlisted";
  const isQuoted      = match.status === "quoted";
  const company       = match.supplier?.company ?? null;
  const isPending     = shortlisting === match.id;

  return (
    <div style={{
      padding: "1rem 1.25rem",
      border: isShortlisted
        ? "1px solid rgba(37,99,235,0.4)"
        : isQuoted ? "1px solid rgba(34,197,94,0.3)"
        : "1px solid var(--border)",
      backgroundColor: isShortlisted
        ? "rgba(37,99,235,0.06)"
        : isQuoted ? "rgba(34,197,94,0.06)"
        : "var(--surface)",
      transition: "border-color 0.2s ease, background-color 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <ScoreRing score={match.match_score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)" }}>
              {company?.name || "Unknown Supplier"}
            </span>
            {isShortlisted && (
              <span style={{
                fontSize: "0.6875rem", fontWeight: 600, color: "#60a5fa",
                backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)",
                padding: "0.1rem 0.5rem", fontFamily: "var(--font-mono)",
              }}>✓ Shortlisted</span>
            )}
            {isQuoted && (
              <span style={{
                fontSize: "0.6875rem", fontWeight: 600, color: "var(--green)",
                backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                padding: "0.1rem 0.5rem", fontFamily: "var(--font-mono)",
              }}>Quote submitted</span>
            )}
          </div>
          {company?.city && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <MapPin style={{ width: "0.7rem", height: "0.7rem" }} />
              {company.city}{company.state_region ? `, ${company.state_region}` : ""}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {!isShortlisted && !isQuoted && (
            <button
              type="button"
              onClick={() => onShortlist(match.id)}
              disabled={isPending}
              style={{
                padding: "0.4rem 0.875rem", fontSize: "0.75rem", fontWeight: 600,
                color: "#60a5fa", background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.3)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.35rem",
                opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s ease",
              }}
            >
              {isPending
                ? <Loader2 style={{ width: "0.75rem", height: "0.75rem" }} className="animate-spin" />
                : <Star style={{ width: "0.75rem", height: "0.75rem" }} />
              }
              {isPending ? "Shortlisting…" : "Shortlist"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
          >
            {expanded
              ? <ChevronUp style={{ width: "1rem", height: "1rem" }} />
              : <ChevronDown style={{ width: "1rem", height: "1rem" }} />
            }
          </button>
        </div>
      </div>

      {expanded && match.match_details?.length > 0 && (
        <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }}>
          <p style={sectionLabel}>Why this match</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {match.match_details.map((reason, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem", color: "var(--green)", flexShrink: 0, marginTop: "0.1rem" }} />
                {reason}
              </div>
            ))}
          </div>
          {company?.website && (
            <a
              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.75rem", fontSize: "0.75rem", color: "#60a5fa", textDecoration: "none" }}
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
// Quote card
// ============================================================================
function QuoteCard({ quote }: { quote: Quote }) {
  const isExpired = quote.valid_until ? new Date(quote.valid_until) < new Date() : false;
  const totalValue = quote.unit_price * quote.lot_size;

  return (
    <div style={{ padding: "1.25rem 1.5rem", border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)" }}>{quote.supplier_company_name || "Unknown Supplier"}</p>
          {quote.supplier_location && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <MapPin style={{ width: "0.7rem", height: "0.7rem" }} />{quote.supplier_location}
            </p>
          )}
        </div>
        {isExpired
          ? <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--red)", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "0.15rem 0.5rem", flexShrink: 0, fontFamily: "var(--font-mono)" }}>Expired</span>
          : quote.valid_until
          ? <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>Valid until {formatDateShort(quote.valid_until)}</span>
          : null
        }
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "1rem", padding: "1rem", backgroundColor: "var(--surface2)", border: "1px solid var(--border)" }}>
        {[
          { label: "Unit price", value: `$${quote.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: "per unit" },
          { label: "Lead time",  value: `${quote.lead_time_days}d`, sub: "days" },
          { label: "Lot size",   value: quote.lot_size.toLocaleString(), sub: "units" },
        ].map(({ label, value, sub }) => (
          <div key={label}>
            <p style={labelStyle}>{label}</p>
            <p style={{ fontWeight: 700, fontSize: "1.25rem", color: "var(--text)", marginTop: "0.2rem", fontFamily: "var(--font-mono)" }}>{value}</p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-subtle)" }}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Total order value:{" "}
          <span style={{ fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </p>
      </div>

      {quote.notes && (
        <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ ...labelStyle, marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <MessageSquare style={{ width: "0.75rem", height: "0.75rem" }} /> Supplier notes
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{quote.notes}</p>
        </div>
      )}
      <p style={{ fontSize: "0.6875rem", color: "var(--text-subtle)", marginTop: "0.875rem", fontFamily: "var(--font-mono)" }}>
        Received {formatRelative(quote.created_at)}
      </p>
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
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingRfq, setLoadingRfq] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [activePanel, setActivePanel] = useState<"matches" | "quotes">("matches");
  const [rerunning, setRerunning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [shortlisting, setShortlisting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSubmittedBanner, setShowSubmittedBanner] = useState(justSubmitted);
  // true only during the brief window when polling detects matching→matched
  const [matchingJustCompleted, setMatchingJustCompleted] = useState(false);
  // drives the progress bar to 100% before the UI transitions
  const [progressComplete, setProgressComplete] = useState(false);

  const loadMatches = useCallback(async () => {
    setLoadingMatches(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("rfq_matches")
      .select(`
        *,
        supplier:supplier_profiles!rfq_matches_supplier_id_fkey (
          company_id,
          company:companies!supplier_profiles_company_id_fkey (
            id, name, city, state_region, website
          )
        )
      `)
      .eq("rfq_id", rfqId)
      .order("match_score", { ascending: false });
    if (data) setMatches(data as MatchWithCompany[]);
    setLoadingMatches(false);
  }, [rfqId]);

  const loadQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    const supabase = createClient();
    const { data: quotesData } = await supabase
      .from("quotes")
      .select("id, rfq_id, supplier_id, unit_price, lot_size, lead_time_days, valid_until, notes, status, created_at")
      .eq("rfq_id", rfqId)
      .eq("status", "submitted")
      .order("created_at", { ascending: false });

    if (!quotesData?.length) { setQuotes([]); setLoadingQuotes(false); return; }

    const supplierIds = quotesData.map(q => q.supplier_id);
    const { data: spData } = await supabase.from("supplier_profiles").select("id, company_id").in("id", supplierIds);
    const companyIds = (spData ?? []).map(sp => sp.company_id);
    const { data: companiesData } = companyIds.length > 0
      ? await supabase.from("companies").select("id, name, city, state_region").in("id", companyIds)
      : { data: [] as { id: string; name: string; city: string | null; state_region: string | null }[] };

    const spMap = Object.fromEntries((spData ?? []).map(sp => [sp.id, sp.company_id]));
    const companyMap = Object.fromEntries((companiesData ?? []).map(c => [c.id, c]));

    setQuotes(quotesData.map(q => {
      const cid = spMap[q.supplier_id];
      const co = cid ? companyMap[cid] : null;
      return {
        ...q,
        supplier_company_name: co?.name ?? "Unknown Supplier",
        supplier_location: co?.city ? `${co.city}${co.state_region ? `, ${co.state_region}` : ""}` : undefined,
      };
    }));
    setLoadingQuotes(false);
  }, [rfqId]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: membership } = await supabase
        .from("company_members").select("company_id").eq("profile_id", user.id).single();
      if (!membership) { router.push("/auth/onboarding"); return; }

      const { data, error: fetchError } = await supabase
        .from("rfqs").select("*").eq("id", rfqId).eq("company_id", membership.company_id).single();

      if (fetchError || !data) {
        setError("RFQ not found or you don't have access.");
      } else {
        setRfq(data);
        if (["matched", "shortlisted", "closed"].includes(data.status)) {
          await loadMatches();
        }
      }
      setLoadingRfq(false);
    }
    load();
  }, [rfqId, router, loadMatches]);

  // ── Poll while status === "matching" ───────────────────────────────────────
  // Fires immediately on mount (catches races where DB is already "matched"),
  // then recurses every 4s until resolved.
  useEffect(() => {
    if (rfq?.status !== "matching") return;

    let cancelled = false;

    async function checkStatus() {
      const supabase = createClient();
      const { data } = await supabase
        .from("rfqs").select("status").eq("id", rfqId).single();

      if (cancelled) return;

      if (data && data.status !== "matching") {
        if (data.status === "matched") {
          setProgressComplete(true);
          await new Promise(r => setTimeout(r, 500));
          if (cancelled) return;
          await loadMatches();
          if (cancelled) return;
          setRfq(prev => prev ? { ...prev, status: "matched" } : prev);
          setMatchingJustCompleted(true);
        } else {
          setRfq(prev => prev ? { ...prev, status: data.status } : prev);
        }
        return; // resolved — stop recursing
      }

      // Still "matching" in DB — check again in 4s
      if (!cancelled) setTimeout(checkStatus, 4000);
    }

    checkStatus(); // immediate first check

    return () => { cancelled = true; };
  }, [rfq?.status, rfqId, loadMatches]);

  // ── Auto-hide submitted banner ─────────────────────────────────────────────
  useEffect(() => {
    if (!showSubmittedBanner) return;
    const t = setTimeout(() => setShowSubmittedBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showSubmittedBanner]);

  async function handleCancel() {
    if (!rfq || !confirm("Cancel this RFQ? This action cannot be undone.")) return;
    setCancelling(true);
    const supabase = createClient();
    const { error: e } = await supabase.from("rfqs").update({ status: "cancelled" }).eq("id", rfq.id);
    if (e) setError(e.message);
    else setRfq(prev => prev ? { ...prev, status: "cancelled" } : prev);
    setCancelling(false);
  }

  async function handleDelete() {
    if (!rfq || !confirm("Permanently delete this RFQ? This cannot be undone.")) return;
    const supabase = createClient();
    const { error: e } = await supabase.from("rfqs").delete().eq("id", rfq.id);
    if (e) setError(e.message);
    else router.push("/dashboard/buyer/rfqs");
  }

  async function handleRerunMatching() {
    if (!rfq) return;
    setRerunning(true);
    setMatchingJustCompleted(false);
    setProgressComplete(false);
    try {
      const res = await fetch("/api/rfqs/match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfq_id: rfq.id }),
      });
      const json = await res.json();
      if (res.ok) {
        await loadMatches();
        setRfq(prev => prev ? { ...prev, status: "matched" } : prev);
        setMatchingJustCompleted(true);
        setProgressComplete(true);
      } else {
        setError(json.error || "Matching failed");
      }
    } catch { setError("Matching request failed"); }
    setRerunning(false);
  }

  async function handleShortlist(matchId: string) {
    setShortlisting(matchId);
    const supabase = createClient();
    await supabase.from("rfq_matches").update({ status: "shortlisted" }).eq("id", matchId);
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: "shortlisted" as const } : m));
    // First shortlist action transitions RFQ to "shortlisted"
    if (rfq && rfq.status === "matched") {
      const supabase2 = createClient();
      await supabase2.from("rfqs").update({ status: "shortlisted" }).eq("id", rfq.id);
      setRfq(prev => prev ? { ...prev, status: "shortlisted" } : prev);
      setMatchingJustCompleted(false);
    }
    setShortlisting(null);
  }

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loadingRfq) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
    </div>
  );

  if (error || !rfq) return (
    <div style={{ maxWidth: "700px", margin: "4rem auto", padding: "0 1rem", textAlign: "center" }}>
      <p style={{ color: "var(--red)", marginBottom: "1rem" }}>{error || "RFQ not found."}</p>
      <Link href="/dashboard/buyer/rfqs" style={{ color: "var(--brand)", textDecoration: "none", fontSize: "0.875rem" }}>← Back to RFQs</Link>
    </div>
  );

  const statusCfg     = STATUS_CONFIG[rfq.status] ?? STATUS_CONFIG.submitted;
  const priorityCfg   = PRIORITY_CONFIG[rfq.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.standard;
  const isDraft       = rfq.status === "draft";
  const isMatching    = rfq.status === "matching";
  const isMatched     = rfq.status === "matched";
  const isCancellable = ["submitted", "matching", "matched", "shortlisted"].includes(rfq.status);
  const showMatchPanel = ["matched", "shortlisted", "closed"].includes(rfq.status);
  const shortlistedCount = matches.filter(m => m.status === "shortlisted").length;
  const quotedCount      = matches.filter(m => m.status === "quoted").length;

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Submitted banner */}
      {showSubmittedBanner && (
        <div style={{
          marginBottom: "1.5rem", padding: "0.875rem 1.25rem",
          backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)",
          display: "flex", alignItems: "center", gap: "0.75rem",
          color: "var(--green)", fontSize: "0.9rem", fontWeight: 500,
        }}>
          <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} />
          RFQ submitted successfully — matching will begin shortly.
        </div>
      )}

      {/* Matching complete banner — shown once when poll detects matched */}
      {matchingJustCompleted && (
        <div style={{
          marginBottom: "1.5rem", padding: "1rem 1.25rem",
          backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)",
          display: "flex", alignItems: "center", gap: "0.875rem",
        }}>
          <div style={{
            width: "2.25rem", height: "2.25rem", flexShrink: 0,
            backgroundColor: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles style={{ width: "1.1rem", height: "1.1rem", color: "var(--green)" }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "var(--green)", fontSize: "0.9375rem" }}>
              Matching complete — {matches.length} supplier{matches.length !== 1 ? "s" : ""} found
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              Review the matches below and click <strong style={{ color: "var(--text)" }}>Shortlist</strong> on suppliers you want to receive quotes from.
            </p>
          </div>
        </div>
      )}

      {/* Back nav */}
      <Link href="/dashboard/buyer/rfqs" style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", marginBottom: "1.25rem",
      }}>
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Back to RFQs
      </Link>

      {/* ── Header card ── */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.25rem" }}>
              {rfq.part_name || rfq.project_name || "Untitled RFQ"}
            </h1>
            {rfq.project_name && rfq.part_name && (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{rfq.project_name}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
            {isDraft && (
              <Link href={`/dashboard/buyer/rfqs/new?draft=${rfq.id}`} style={{
                display: "inline-flex", alignItems: "center", padding: "0.4rem 0.875rem",
                fontSize: "0.8125rem", fontWeight: 600, color: "white",
                backgroundColor: "var(--brand)", textDecoration: "none",
              }}>Continue Editing</Link>
            )}
            {isCancellable && (
              <button type="button" onClick={handleCancel} disabled={cancelling} style={{
                padding: "0.4rem 0.875rem", fontSize: "0.75rem", color: "var(--red)",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer",
              }}>
                {cancelling ? "Cancelling…" : "Cancel RFQ"}
              </button>
            )}
            {["cancelled", "draft", "closed"].includes(rfq.status) && (
              <button type="button" onClick={handleDelete} style={{
                padding: "0.4rem 0.875rem", fontSize: "0.75rem", color: "var(--red)",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer",
              }}>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Status banner */}
        <div style={{
          marginTop: "1.25rem", padding: "0.875rem 1rem",
          backgroundColor: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
            <span style={{ color: statusCfg.color, marginTop: "0.05rem", flexShrink: 0 }}>
              {isMatching
                ? <Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" />
                : statusCfg.icon
              }
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: statusCfg.color }}>{statusCfg.label}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{statusCfg.description}</p>
              {/* Progress bar — only rendered during matching, passes complete flag */}
              {isMatching && <MatchingProgressBar complete={progressComplete} />}
            </div>
            <div style={{ textAlign: "right", fontSize: "0.6875rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
              {rfq.submitted_at
                ? <><p>Submitted</p><p style={{ fontWeight: 500 }}>{formatDate(rfq.submitted_at)}</p></>
                : <><p>Created</p><p style={{ fontWeight: 500 }}>{formatDate(rfq.created_at)}</p></>
              }
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          <QuickStat icon={<Settings style={{ width: "0.85rem", height: "0.85rem" }} />} label="Processes"
            value={rfq.processes_required?.length ? `${rfq.processes_required.length} selected` : "None"} />
          <QuickStat icon={<Award style={{ width: "0.85rem", height: "0.85rem" }} />} label="Certifications"
            value={rfq.certifications_required?.length ? `${rfq.certifications_required.length} required` : "None"} />
          <QuickStat icon={<Package style={{ width: "0.85rem", height: "0.85rem" }} />} label="Lot size" value={rfq.lot_size || "Not specified"} />
          <QuickStat icon={<Zap style={{ width: "0.85rem", height: "0.85rem" }} />} label="Priority"
            value={
              <span style={{
                color: priorityCfg.color, backgroundColor: priorityCfg.bg,
                border: `1px solid ${priorityCfg.border}`,
                padding: "0.1rem 0.5rem", fontSize: "0.625rem", fontWeight: 600, fontFamily: "var(--font-mono)",
              }}>{priorityCfg.label}</span>
            }
          />
          {showMatchPanel && (
            <QuickStat icon={<Building2 style={{ width: "0.85rem", height: "0.85rem" }} />} label="Matches"
              value={loadingMatches ? "…" : `${matches.length}${shortlistedCount > 0 ? ` · ${shortlistedCount} shortlisted` : ""}${quotedCount > 0 ? ` · ${quotedCount} quoted` : ""}`}
            />
          )}
        </div>
      </div>

      {/* ── Matching in-progress placeholder ── */}
      {isMatching && (
        <div style={{
          backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderTop: "none",
          padding: "3rem 1.5rem", textAlign: "center", marginBottom: "1px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "3.5rem", height: "3.5rem",
              backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Search style={{ width: "1.5rem", height: "1.5rem", color: "var(--amber)" }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)", marginBottom: "0.4rem" }}>
                Finding your suppliers
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "380px", margin: "0 auto", lineHeight: 1.7 }}>
                Our AI is evaluating your requirements against supplier capabilities, certifications, and capacity. This usually takes 10–30 seconds. This page will update automatically.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
              <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" />
              Checking for results every 4 seconds…
            </div>
          </div>
        </div>
      )}

      {/* ── Match + Quote panel ── */}
      {showMatchPanel && (
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderTop: "none", padding: "1.25rem 1.5rem", marginBottom: "1px" }}>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", alignItems: "center" }}>
            {(["matches", "quotes"] as const).map(tab => {
              const count = tab === "matches" ? matches.length : quotedCount;
              const active = activePanel === tab;
              return (
                <button key={tab} type="button"
                  onClick={() => { setActivePanel(tab); if (tab === "quotes") loadQuotes(); }}
                  style={{
                    padding: "0.375rem 0.875rem", fontSize: "0.8125rem", fontWeight: 500,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
                    border: active ? "1px solid rgba(37,99,235,0.5)" : "1px solid var(--border)",
                    backgroundColor: active ? "rgba(37,99,235,0.1)" : "var(--surface2)",
                    color: active ? "#60a5fa" : "var(--text-muted)",
                    transition: "all 0.15s ease",
                  }}>
                  {tab === "matches"
                    ? <><TrendingUp style={{ width: "0.85rem", height: "0.85rem" }} /> Supplier Matches</>
                    : <><DollarSign style={{ width: "0.85rem", height: "0.85rem" }} /> Quotes Received</>
                  }
                  {count > 0 && (
                    <span style={{
                      fontSize: "0.6875rem", fontWeight: 600, padding: "0.05rem 0.4rem", fontFamily: "var(--font-mono)",
                      backgroundColor: active ? "rgba(37,99,235,0.3)" : "var(--border2)",
                      color: active ? "#93c5fd" : "var(--text-muted)",
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
            {activePanel === "matches" && (
              <button type="button" onClick={handleRerunMatching} disabled={rerunning}
                style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.35rem",
                  fontSize: "0.75rem", color: "var(--text-muted)",
                  background: "none", border: "1px solid var(--border)",
                  padding: "0.3rem 0.65rem", cursor: "pointer",
                }}>
                <RefreshCw style={{ width: "0.75rem", height: "0.75rem" }} className={rerunning ? "animate-spin" : ""} />
                {rerunning ? "Running…" : "Re-run matching"}
              </button>
            )}
          </div>

          {/* Shortlist callout */}
          {activePanel === "matches" && isMatched && shortlistedCount === 0 && matches.length > 0 && (
            <div style={{
              marginBottom: "1rem", padding: "0.875rem 1rem",
              backgroundColor: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)",
              display: "flex", alignItems: "center", gap: "0.75rem",
              fontSize: "0.875rem", color: "#93c5fd",
            }}>
              <Star style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
              Click <strong style={{ color: "var(--text)" }}>Shortlist</strong> on the suppliers you want to receive quotes from. They&apos;ll be notified by email.
            </div>
          )}

          {/* Matches list */}
          {activePanel === "matches" && (
            loadingMatches ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <Loader2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--brand)" }} className="animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <Building2 style={{ width: "2rem", height: "2rem", color: "var(--text-subtle)", margin: "0 auto 0.75rem" }} />
                <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.25rem" }}>No matches found</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  No suppliers currently match your requirements. Try broadening your criteria and re-running.
                </p>
                <button type="button" onClick={handleRerunMatching} disabled={rerunning}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "white", backgroundColor: "var(--brand)", border: "none", cursor: "pointer" }}>
                  {rerunning ? "Running…" : "Re-run Matching"}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.625rem", color: "var(--text-muted)", marginBottom: "0.75rem", fontFamily: "var(--font-mono)" }}>
                  {[["var(--green)", "75–100 Strong"], ["var(--amber)", "50–74 Good"], ["var(--text-subtle)", "< 50 Partial"]].map(([color, label]) => (
                    <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ width: "0.55rem", height: "0.55rem", backgroundColor: color, display: "inline-block" }} />
                      {label}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "var(--border)" }}>
                  {matches.map(match => (
                    <MatchCard key={match.id} match={match} onShortlist={handleShortlist} shortlisting={shortlisting} />
                  ))}
                </div>
              </>
            )
          )}

          {/* Quotes list */}
          {activePanel === "quotes" && (
            loadingQuotes ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <Loader2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--brand)" }} className="animate-spin" />
              </div>
            ) : quotes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <DollarSign style={{ width: "2rem", height: "2rem", color: "var(--text-subtle)", margin: "0 auto 0.75rem" }} />
                <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.25rem" }}>No quotes yet</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Shortlisted suppliers will be notified and can submit quotes here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "var(--border)" }}>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>
                  {quotes.length} quote{quotes.length !== 1 ? "s" : ""} received · sorted by most recent
                </p>
                {quotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)}
              </div>
            )
          )}
        </div>
      )}

      {/* ── Detail sections ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "var(--border)", marginTop: "1px" }}>

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
                {rfq.processes_required.map((p: string, i: number) => {
                  const req = rfq.processes_required_flags?.[i] === "required";
                  return (
                    <span key={p} style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      padding: "0.25rem 0.625rem", fontSize: "0.6875rem", fontWeight: 500,
                      backgroundColor: req ? "rgba(37,99,235,0.1)" : "var(--surface2)",
                      color: req ? "#60a5fa" : "var(--text-muted)",
                      border: req ? "1px solid rgba(37,99,235,0.3)" : "1px solid var(--border2)",
                    }}>
                      {req ? <Lock style={{ width: "0.65rem", height: "0.65rem" }} /> : <Star style={{ width: "0.65rem", height: "0.65rem" }} />}
                      {PROCESSES[p] || p}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <DetailRow label="Primary material"
            value={rfq.material_primary ? `${rfq.material_primary}${rfq.material_is_required ? " (non-negotiable)" : ""}` : null} />
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
                {rfq.certifications_required.map((c: string, i: number) => {
                  const req = rfq.certifications_required_flags?.[i] === "required";
                  return (
                    <span key={c} style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      padding: "0.25rem 0.625rem", fontSize: "0.6875rem", fontWeight: 500,
                      backgroundColor: req ? "rgba(37,99,235,0.1)" : "var(--surface2)",
                      color: req ? "#60a5fa" : "var(--text-muted)",
                      border: req ? "1px solid rgba(37,99,235,0.3)" : "1px solid var(--border2)",
                    }}>
                      {req ? <Lock style={{ width: "0.65rem", height: "0.65rem" }} /> : <Star style={{ width: "0.65rem", height: "0.65rem" }} />}
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
                {rfq.preferred_regions.map((r: string) => (
                  <span key={r} style={{ padding: "0.25rem 0.625rem", fontSize: "0.6875rem", fontWeight: 500, backgroundColor: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border2)" }}>{r}</span>
                ))}
              </div>
            </div>
          )}
          <DetailRow label="Quotes needed by" value={rfq.needed_by_date ? formatDateShort(rfq.needed_by_date) : null}
            icon={<Calendar style={{ width: "0.75rem", height: "0.75rem" }} />} />
          <DetailRow label="Production start" value={rfq.production_start ? formatDateShort(rfq.production_start) : null}
            icon={<Calendar style={{ width: "0.75rem", height: "0.75rem" }} />} />
          <DetailRow label="Budget range" value={(rfq as Rfq & { budget_notes?: string }).budget_notes}
            icon={<DollarSign style={{ width: "0.75rem", height: "0.75rem" }} />} />
          <DetailRow label="Notes for suppliers" value={(rfq as Rfq & { special_instructions?: string }).special_instructions}
            wide icon={<StickyNote style={{ width: "0.75rem", height: "0.75rem" }} />} />
        </DetailSection>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1.25rem", fontSize: "0.625rem", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Lock style={{ width: "0.65rem", height: "0.65rem" }} /> Non-negotiable</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Star style={{ width: "0.65rem", height: "0.65rem" }} /> Preferred</span>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================
const labelStyle: React.CSSProperties = {
  fontSize: "0.625rem", fontWeight: 600, color: "var(--text-muted)",
  textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "var(--font-mono)",
};
const sectionLabel: React.CSSProperties = { ...labelStyle, marginBottom: "0.5rem" };

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "var(--surface)", padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--text-muted)" }}>
        {icon}
        <h2 style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          {title}
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1.5rem" }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value, note, wide, icon }: {
  label: string; value: string | number | null | undefined; note?: string; wide?: boolean; icon?: React.ReactNode;
}) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : "auto" }}>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: "0.9375rem", color: "var(--text)", fontWeight: 500, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
        {icon && <span style={{ color: "var(--text-muted)" }}>{icon}</span>}{value}
      </p>
      {note && <p style={{ fontSize: "0.7rem", color: "var(--text-subtle)", marginTop: "0.1rem" }}>{note}</p>}
    </div>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.6875rem" }}>
      <span style={{ color: "var(--text-subtle)" }}>{icon}</span>
      <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}:</span>
      <span style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return formatDateShort(dateStr);
}
