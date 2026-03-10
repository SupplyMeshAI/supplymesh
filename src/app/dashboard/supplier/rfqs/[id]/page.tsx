// src/app/dashboard/supplier/rfqs/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, ArrowLeft, Building2, Package, Calendar,
  CheckCircle2, Star, DollarSign, Clock, Send, FileText,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================
type RfqDetail = {
  id: string;
  part_name: string | null;
  project_name: string | null;
  part_description: string | null;
  lot_size: string | null;
  annual_volume: string | null;
  priority: string | null;
  needed_by_date: string | null;
  production_start: string | null;
  processes_required: string[];
  processes_required_flags: string[];
  certifications_required: string[];
  certifications_required_flags: string[];
  material_primary: string | null;
  industry: string | null;
  itar_required: boolean;
  target_price: number | null;
  preferred_regions: string[];
  additional_requirements: string | null;
  special_instructions: string | null;
  submitted_at: string | null;
  company_id: string;
};

type MatchDetail = {
  id: string;
  match_score: number;
  match_details: string[] | null;
  status: string;
};

type ExistingQuote = {
  id: string;
  unit_price: number;
  lot_size: number;
  lead_time_days: number;
  valid_until: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type BuyerCompany = {
  id: string;
  name: string;
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
  sheet_metal_fabrication: "Sheet Metal Fab", injection_molding: "Injection Molding",
  casting: "Casting", forging: "Forging", additive_3d_printing: "3D Printing",
  welding_fabrication: "Welding", stamping: "Stamping", laser_cutting: "Laser Cutting",
  waterjet_cutting: "Waterjet", pcb_assembly: "PCB Assembly",
  grinding: "Grinding", edm: "EDM",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ProcessPill({ value, flag }: { value: string; flag: string }) {
  const isRequired = flag === "required";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "0.75rem", fontWeight: 500, padding: "0.2rem 0.6rem",
      borderRadius: "9999px",
      backgroundColor: isRequired ? "#fef3c7" : "#f0fdf4",
      color: isRequired ? "#92400e" : "#166534",
      border: `1px solid ${isRequired ? "#fde68a" : "#bbf7d0"}`,
    }}>
      {isRequired ? "🔒" : "⭐"} {PROCESS_LABELS[value] ?? value}
    </span>
  );
}

// ============================================================================
// Page
// ============================================================================
export default function SupplierRfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rfqId } = use(params);
  const router = useRouter();

  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [buyerCompany, setBuyerCompany] = useState<BuyerCompany | null>(null);
  const [existingQuote, setExistingQuote] = useState<ExistingQuote | null>(null);
  const [supplierProfileId, setSupplierProfileId] = useState<string | null>(null);
  const [supplierCompanyId, setSupplierCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quote form state
  const [unitPrice, setUnitPrice] = useState("");
  const [quoteLotSize, setQuoteLotSize] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Get membership + supplier profile
      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("profile_id", user.id)
        .single();
      if (!membership) { router.push("/auth/onboarding"); return; }

      const { data: sp } = await supabase
        .from("supplier_profiles")
        .select("id")
        .eq("company_id", membership.company_id)
        .single();
      if (!sp) { setLoading(false); return; }

      setSupplierProfileId(sp.id);
      setSupplierCompanyId(membership.company_id);

      // Load RFQ
      const { data: rfqData } = await supabase
        .from("rfqs")
        .select("id, part_name, project_name, part_description, lot_size, annual_volume, priority, needed_by_date, production_start, processes_required, processes_required_flags, certifications_required, certifications_required_flags, material_primary, industry, itar_required, target_price, preferred_regions, additional_requirements, special_instructions, submitted_at, company_id")
        .eq("id", rfqId)
        .single();

      if (!rfqData) { setLoading(false); return; }
      setRfq(rfqData as RfqDetail);

      // Load match
      const { data: matchData } = await supabase
        .from("rfq_matches")
        .select("id, match_score, match_details, status")
        .eq("rfq_id", rfqId)
        .eq("supplier_id", sp.id)
        .maybeSingle();
      setMatch(matchData as MatchDetail ?? null);

      // Load buyer company
      const { data: company } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", rfqData.company_id)
        .single();
      setBuyerCompany(company as BuyerCompany ?? null);

      // Load existing quote if any
      const { data: quoteData } = await supabase
        .from("quotes")
        .select("id, unit_price, lot_size, lead_time_days, valid_until, notes, status, created_at")
        .eq("rfq_id", rfqId)
        .eq("supplier_id", sp.id)
        .maybeSingle();

      if (quoteData) {
        setExistingQuote(quoteData as ExistingQuote);
        setUnitPrice(String(quoteData.unit_price));
        setQuoteLotSize(String(quoteData.lot_size));
        setLeadTimeDays(String(quoteData.lead_time_days));
        setValidUntil(quoteData.valid_until ?? "");
        setNotes(quoteData.notes ?? "");
        if (quoteData.status === "submitted") setSubmitted(true);
      }

      setLoading(false);
    }
    load();
  }, [rfqId, router]);

  async function handleSubmitQuote() {
    if (!rfq || !supplierProfileId || !supplierCompanyId || !match) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      rfq_id: rfq.id,
      supplier_id: supplierProfileId,
      company_id: supplierCompanyId,
      match_id: match.id,
      unit_price: parseFloat(unitPrice),
      lot_size: parseInt(quoteLotSize),
      lead_time_days: parseInt(leadTimeDays),
      valid_until: validUntil || null,
      notes: notes || null,
      status: "submitted",
    };

    let quoteError;
    if (existingQuote) {
      ({ error: quoteError } = await supabase
        .from("quotes")
        .update(payload)
        .eq("id", existingQuote.id));
    } else {
      ({ error: quoteError } = await supabase
        .from("quotes")
        .insert(payload));
    }

    if (quoteError) {
      setError(quoteError.message);
      setSubmitting(false);
      return;
    }

    // Update match status to quoted
    await supabase
      .from("rfq_matches")
      .update({ status: "quoted" })
      .eq("id", match.id);

    setSubmitted(true);
    setSubmitting(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>
        <Link href="/dashboard/supplier/rfqs" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", color: "#64748b", textDecoration: "none", marginBottom: "1.5rem" }}>
          <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Back to inbox
        </Link>
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <AlertCircle style={{ width: "2rem", height: "2rem", color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
          <p style={{ fontWeight: 600, color: "#334155" }}>RFQ not found</p>
        </div>
      </div>
    );
  }

  const priority = rfq.priority ? (PRIORITY_CONFIG[rfq.priority] ?? PRIORITY_CONFIG.standard) : PRIORITY_CONFIG.standard;
  const scoreColor = match ? (match.match_score >= 75 ? "#10b981" : match.match_score >= 50 ? "#f59e0b" : "#94a3b8") : "#94a3b8";

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>

      {/* Back link */}
      <Link href="/dashboard/supplier/rfqs" style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        fontSize: "0.875rem", color: "#64748b", textDecoration: "none", marginBottom: "1.5rem",
      }}>
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Back to inbox
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
              {rfq.part_name || rfq.project_name || "Untitled RFQ"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
              {buyerCompany?.name && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <Building2 style={{ width: "0.875rem", height: "0.875rem" }} />
                  {buyerCompany.name}
                </span>
              )}
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.6rem", borderRadius: "9999px",
                color: priority.color, backgroundColor: priority.bg,
              }}>
                {priority.label}
              </span>
              {match?.status === "shortlisted" && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                  fontSize: "0.75rem", fontWeight: 600, color: "var(--brand)",
                  backgroundColor: "var(--brand-light)", border: "1px solid var(--brand)",
                  padding: "0.15rem 0.6rem", borderRadius: "9999px",
                }}>
                  <Star style={{ width: "0.7rem", height: "0.7rem" }} /> Shortlisted
                </span>
              )}
            </div>
          </div>

          {/* Match score */}
          {match && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "0.75rem 1rem", borderRadius: "0.75rem",
              backgroundColor: "white", border: "1px solid #e2e8f0",
            }}>
              <div style={{
                width: "3.5rem", height: "3.5rem", borderRadius: "9999px",
                border: `3px solid ${scoreColor}`, backgroundColor: `${scoreColor}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: scoreColor }}>{match.match_score}</span>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.3rem" }}>Match score</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

        {/* Left col — RFQ details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Quick stats */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.875rem" }}>
              RFQ Details
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {rfq.lot_size && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <Package style={{ width: "0.875rem", height: "0.875rem", color: "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "#64748b" }}>Lot size:</span>
                  <span style={{ fontWeight: 500, color: "#0f172a" }}>{rfq.lot_size}</span>
                </div>
              )}
              {rfq.annual_volume && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <Package style={{ width: "0.875rem", height: "0.875rem", color: "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "#64748b" }}>Annual volume:</span>
                  <span style={{ fontWeight: 500, color: "#0f172a" }}>{rfq.annual_volume}</span>
                </div>
              )}
              {rfq.needed_by_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <Calendar style={{ width: "0.875rem", height: "0.875rem", color: "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "#64748b" }}>Needed by:</span>
                  <span style={{ fontWeight: 500, color: "#0f172a" }}>{formatDate(rfq.needed_by_date)}</span>
                </div>
              )}
              {rfq.target_price && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <DollarSign style={{ width: "0.875rem", height: "0.875rem", color: "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "#64748b" }}>Target price:</span>
                  <span style={{ fontWeight: 500, color: "#0f172a" }}>${rfq.target_price}/unit</span>
                </div>
              )}
              {rfq.material_primary && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <FileText style={{ width: "0.875rem", height: "0.875rem", color: "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "#64748b" }}>Material:</span>
                  <span style={{ fontWeight: 500, color: "#0f172a" }}>{rfq.material_primary}</span>
                </div>
              )}
            </div>
          </div>

          {/* Processes */}
          {rfq.processes_required?.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Processes
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {rfq.processes_required.map((p, i) => (
                  <ProcessPill key={p} value={p} flag={rfq.processes_required_flags?.[i] ?? "preferred"} />
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {rfq.certifications_required?.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Certifications
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {rfq.certifications_required.map((c, i) => (
                  <span key={c} style={{
                    fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    backgroundColor: rfq.certifications_required_flags?.[i] === "required" ? "#fef3c7" : "#f0fdf4",
                    color: rfq.certifications_required_flags?.[i] === "required" ? "#92400e" : "#166534",
                    border: `1px solid ${rfq.certifications_required_flags?.[i] === "required" ? "#fde68a" : "#bbf7d0"}`,
                  }}>
                    {rfq.certifications_required_flags?.[i] === "required" ? "🔒" : "⭐"} {c.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(rfq.part_description || rfq.additional_requirements || rfq.special_instructions) && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Notes from buyer
              </p>
              {rfq.part_description && <p style={{ fontSize: "0.875rem", color: "#334155", marginBottom: "0.5rem" }}>{rfq.part_description}</p>}
              {rfq.additional_requirements && <p style={{ fontSize: "0.875rem", color: "#334155", marginBottom: "0.5rem" }}>{rfq.additional_requirements}</p>}
              {rfq.special_instructions && <p style={{ fontSize: "0.875rem", color: "#334155" }}>{rfq.special_instructions}</p>}
            </div>
          )}

          {/* Match reasons */}
          {(match?.match_details ?? []).length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Why you were matched
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {match!.match_details!.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.825rem", color: "#334155" }}>
                    <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem", color: "#10b981", flexShrink: 0, marginTop: "0.1rem" }} />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right col — Quote form */}
        <div>
          <div className="card" style={{ padding: "1.5rem", position: "sticky", top: "5rem" }}>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{
                  width: "3rem", height: "3rem", borderRadius: "9999px",
                  backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 0.75rem",
                }}>
                  <CheckCircle2 style={{ width: "1.5rem", height: "1.5rem", color: "#10b981" }} />
                </div>
                <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: "0.25rem" }}>Quote submitted!</p>
                <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem" }}>
                  The buyer has been notified and can review your quote.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{
                    fontSize: "0.875rem", color: "var(--brand)", background: "none",
                    border: "none", cursor: "pointer", textDecoration: "underline",
                  }}
                >
                  Edit quote
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: "1.25rem", fontSize: "1rem" }}>
                  {existingQuote ? "Update your quote" : "Submit a quote"}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Unit price */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>
                      Unit price (USD) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <DollarSign style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "0.875rem", height: "0.875rem", color: "#94a3b8" }} />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={e => setUnitPrice(e.target.value)}
                        placeholder="0.00"
                        className="input"
                        style={{ paddingLeft: "2rem" }}
                      />
                    </div>
                    {rfq.target_price && (
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                        Buyer target: ${rfq.target_price}/unit
                      </p>
                    )}
                  </div>

                  {/* Lot size */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>
                      Lot size (units) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quoteLotSize}
                      onChange={e => setQuoteLotSize(e.target.value)}
                      placeholder="100"
                      className="input"
                    />
                    {rfq.lot_size && (
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                        Requested: {rfq.lot_size}
                      </p>
                    )}
                  </div>

                  {/* Lead time */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>
                      Lead time (days) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <Clock style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "0.875rem", height: "0.875rem", color: "#94a3b8" }} />
                      <input
                        type="number"
                        min="1"
                        value={leadTimeDays}
                        onChange={e => setLeadTimeDays(e.target.value)}
                        placeholder="30"
                        className="input"
                        style={{ paddingLeft: "2rem" }}
                      />
                    </div>
                  </div>

                  {/* Valid until */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>
                      Quote valid until
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="input"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "0.375rem" }}>
                      Notes to buyer
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add any relevant details about your capabilities, past experience, or questions about the RFQ..."
                      rows={4}
                      className="input"
                      style={{ resize: "vertical", minHeight: "6rem" }}
                    />
                  </div>

                  {error && (
                    <div style={{ padding: "0.75rem", borderRadius: "0.5rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", fontSize: "0.875rem", color: "#dc2626" }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitQuote}
                    disabled={submitting || !unitPrice || !quoteLotSize || !leadTimeDays}
                    className="btn-primary"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    {submitting
                      ? <><Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" /> Submitting...</>
                      : <><Send style={{ width: "1rem", height: "1rem" }} /> {existingQuote ? "Update quote" : "Submit quote"}</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
