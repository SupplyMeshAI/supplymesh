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

type BuyerCompany = { id: string; name: string };

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
  sheet_metal_fabrication: "Sheet Metal Fab", injection_molding: "Injection Molding",
  casting: "Casting", forging: "Forging", additive_3d_printing: "3D Printing",
  welding_fabrication: "Welding", stamping: "Stamping", laser_cutting: "Laser Cutting",
  waterjet_cutting: "Waterjet", pcb_assembly: "PCB Assembly",
  grinding: "Grinding", edm: "EDM",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Shared label style
const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: "0.6875rem", fontWeight: 500,
  color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.07em", marginBottom: "6px",
  fontFamily: "var(--font-mono)",
};

const fieldInput: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  border: "1px solid var(--border2)", backgroundColor: "var(--surface2)",
  color: "var(--text)", fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box" as const,
};

function ProcessPill({ value, flag }: { value: string; flag: string }) {
  const isRequired = flag === "required";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "0.75rem", fontWeight: 500, padding: "3px 8px",
      backgroundColor: isRequired ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.1)",
      color: isRequired ? "var(--amber)" : "var(--green)",
      border: `1px solid ${isRequired ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)"}`,
      fontFamily: "var(--font-mono)",
    }}>
      {isRequired ? "🔒" : "⭐"} {PROCESS_LABELS[value] ?? value}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "18px 20px" }}>
      <p style={{
        fontSize: "0.6875rem", fontWeight: 500, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px",
        fontFamily: "var(--font-mono)",
      }}>
        {title}
      </p>
      {children}
    </div>
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

      const { data: membership } = await supabase
        .from("company_members").select("company_id").eq("profile_id", user.id).single();
      if (!membership) { router.push("/auth/onboarding"); return; }

      const { data: sp } = await supabase
        .from("supplier_profiles").select("id").eq("company_id", membership.company_id).single();
      if (!sp) { setLoading(false); return; }

      setSupplierProfileId(sp.id);
      setSupplierCompanyId(membership.company_id);

      const { data: rfqData } = await supabase
        .from("rfqs")
        .select("id, part_name, project_name, part_description, lot_size, annual_volume, priority, needed_by_date, production_start, processes_required, processes_required_flags, certifications_required, certifications_required_flags, material_primary, industry, itar_required, target_price, preferred_regions, additional_requirements, special_instructions, submitted_at, company_id")
        .eq("id", rfqId).single();
      if (!rfqData) { setLoading(false); return; }
      setRfq(rfqData as RfqDetail);

      const { data: matchData } = await supabase
        .from("rfq_matches").select("id, match_score, match_details, status")
        .eq("rfq_id", rfqId).eq("supplier_id", sp.id).maybeSingle();
      setMatch(matchData as MatchDetail ?? null);

      const { data: company } = await supabase
        .from("companies").select("id, name").eq("id", rfqData.company_id).single();
      setBuyerCompany(company as BuyerCompany ?? null);

      const { data: quoteData } = await supabase
        .from("quotes").select("id, unit_price, lot_size, lead_time_days, valid_until, notes, status, created_at")
        .eq("rfq_id", rfqId).eq("supplier_id", sp.id).maybeSingle();
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
      rfq_id: rfq.id, supplier_id: supplierProfileId,
      company_id: supplierCompanyId, match_id: match.id,
      unit_price: parseFloat(unitPrice), lot_size: parseInt(quoteLotSize),
      lead_time_days: parseInt(leadTimeDays),
      valid_until: validUntil || null, notes: notes || null, status: "submitted",
    };
    let quoteError;
    if (existingQuote) {
      ({ error: quoteError } = await supabase.from("quotes").update(payload).eq("id", existingQuote.id));
    } else {
      ({ error: quoteError } = await supabase.from("quotes").insert(payload));
    }
    if (quoteError) { setError(quoteError.message); setSubmitting(false); return; }
    await supabase.from("rfq_matches").update({ status: "quoted" }).eq("id", match.id);
    setSubmitted(true);
    setSubmitting(false);
  }

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
    </div>
  );

  if (!rfq) return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>
      <Link href="/dashboard/supplier/rfqs" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", marginBottom: "20px" }}>
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Back to inbox
      </Link>
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "48px", textAlign: "center" }}>
        <AlertCircle style={{ width: "2rem", height: "2rem", color: "var(--text-subtle)", margin: "0 auto 12px" }} />
        <p style={{ fontWeight: 600, color: "var(--text)" }}>RFQ not found</p>
      </div>
    </div>
  );

  const priority   = rfq.priority ? (PRIORITY_CONFIG[rfq.priority] ?? PRIORITY_CONFIG.standard) : PRIORITY_CONFIG.standard;
  const scoreColor = match
    ? match.match_score >= 75 ? "var(--green)" : match.match_score >= 50 ? "var(--amber)" : "var(--text-subtle)"
    : "var(--text-subtle)";

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto" }}>

      {/* Back link */}
      <Link href="/dashboard/supplier/rfqs" style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", marginBottom: "20px",
      }}>
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Back to inbox
      </Link>

      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>
              {rfq.part_name || rfq.project_name || "Untitled RFQ"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
              {buyerCompany?.name && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                  <Building2 style={{ width: "0.875rem", height: "0.875rem" }} />
                  {buyerCompany.name}
                </span>
              )}
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px",
                color: priority.color, backgroundColor: priority.bg,
                fontFamily: "var(--font-mono)",
              }}>
                {priority.label}
              </span>
              {match?.status === "shortlisted" && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  fontSize: "0.75rem", fontWeight: 600, color: "var(--brand)",
                  backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid var(--brand)",
                  padding: "2px 8px",
                }}>
                  <Star style={{ width: "0.7rem", height: "0.7rem" }} /> Shortlisted
                </span>
              )}
            </div>
          </div>

          {/* Match score badge */}
          {match && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "12px 16px", backgroundColor: "var(--surface)", border: "1px solid var(--border)",
            }}>
              <div style={{
                width: "3.5rem", height: "3.5rem",
                border: `2px solid ${scoreColor}`, backgroundColor: `${scoreColor}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: scoreColor, fontFamily: "var(--font-mono)" }}>
                  {match.match_score}
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "5px" }}>Match score</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Left — RFQ details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Quick stats */}
          <SectionCard title="RFQ Details">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {rfq.lot_size && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                  <Package style={{ width: "0.875rem", height: "0.875rem", color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)" }}>Lot size:</span>
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>{rfq.lot_size}</span>
                </div>
              )}
              {rfq.annual_volume && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                  <Package style={{ width: "0.875rem", height: "0.875rem", color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)" }}>Annual volume:</span>
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>{rfq.annual_volume}</span>
                </div>
              )}
              {rfq.needed_by_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                  <Calendar style={{ width: "0.875rem", height: "0.875rem", color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)" }}>Needed by:</span>
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>{formatDate(rfq.needed_by_date)}</span>
                </div>
              )}
              {rfq.target_price && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                  <DollarSign style={{ width: "0.875rem", height: "0.875rem", color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)" }}>Target price:</span>
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>${rfq.target_price}/unit</span>
                </div>
              )}
              {rfq.material_primary && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                  <FileText style={{ width: "0.875rem", height: "0.875rem", color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-muted)" }}>Material:</span>
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>{rfq.material_primary}</span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Processes */}
          {rfq.processes_required?.length > 0 && (
            <SectionCard title="Processes">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {rfq.processes_required.map((p, i) => (
                  <ProcessPill key={p} value={p} flag={rfq.processes_required_flags?.[i] ?? "preferred"} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Certifications */}
          {rfq.certifications_required?.length > 0 && (
            <SectionCard title="Certifications">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {rfq.certifications_required.map((c, i) => {
                  const isRequired = rfq.certifications_required_flags?.[i] === "required";
                  return (
                    <span key={c} style={{
                      fontSize: "0.75rem", fontWeight: 600, padding: "3px 8px",
                      backgroundColor: isRequired ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.1)",
                      color: isRequired ? "var(--amber)" : "var(--green)",
                      border: `1px solid ${isRequired ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)"}`,
                      fontFamily: "var(--font-mono)",
                    }}>
                      {isRequired ? "🔒" : "⭐"} {c.toUpperCase()}
                    </span>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Buyer notes */}
          {(rfq.part_description || rfq.additional_requirements || rfq.special_instructions) && (
            <SectionCard title="Notes from buyer">
              {rfq.part_description && <p style={{ fontSize: "0.875rem", color: "var(--text)", marginBottom: "6px" }}>{rfq.part_description}</p>}
              {rfq.additional_requirements && <p style={{ fontSize: "0.875rem", color: "var(--text)", marginBottom: "6px" }}>{rfq.additional_requirements}</p>}
              {rfq.special_instructions && <p style={{ fontSize: "0.875rem", color: "var(--text)" }}>{rfq.special_instructions}</p>}
            </SectionCard>
          )}

          {/* Match reasons */}
          {(match?.match_details ?? []).length > 0 && (
            <SectionCard title="Why you were matched">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {match!.match_details!.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem", color: "var(--text)" }}>
                    <CheckCircle2 style={{ width: "14px", height: "14px", color: "var(--green)", flexShrink: 0, marginTop: "2px" }} />
                    {r}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right — Quote form */}
        <div>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "20px", position: "sticky", top: "5rem" }}>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{
                  width: "48px", height: "48px",
                  backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid var(--green)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                }}>
                  <CheckCircle2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--green)" }} />
                </div>
                <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "5px" }}>Quote submitted!</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  The buyer has been notified and can review your quote.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{ fontSize: "0.875rem", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Edit quote
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: "18px", fontSize: "0.9375rem" }}>
                  {existingQuote ? "Update your quote" : "Submit a quote"}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                  {/* Unit price */}
                  <div>
                    <label style={fieldLabel}>Unit price (USD) *</label>
                    <div style={{ position: "relative" }}>
                      <DollarSign style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
                      <input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
                        placeholder="0.00" style={{ ...fieldInput, paddingLeft: "30px" }} />
                    </div>
                    {rfq.target_price && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        Buyer target: ${rfq.target_price}/unit
                      </p>
                    )}
                  </div>

                  {/* Lot size */}
                  <div>
                    <label style={fieldLabel}>Lot size (units) *</label>
                    <input type="number" min="1" value={quoteLotSize} onChange={e => setQuoteLotSize(e.target.value)}
                      placeholder="100" style={fieldInput} />
                    {rfq.lot_size && (
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        Requested: {rfq.lot_size}
                      </p>
                    )}
                  </div>

                  {/* Lead time */}
                  <div>
                    <label style={fieldLabel}>Lead time (days) *</label>
                    <div style={{ position: "relative" }}>
                      <Clock style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
                      <input type="number" min="1" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)}
                        placeholder="30" style={{ ...fieldInput, paddingLeft: "30px" }} />
                    </div>
                  </div>

                  {/* Valid until */}
                  <div>
                    <label style={fieldLabel}>Quote valid until</label>
                    <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                      style={fieldInput} min={new Date().toISOString().split("T")[0]} />
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={fieldLabel}>Notes to buyer</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Add any relevant details about your capabilities, past experience, or questions about the RFQ..."
                      rows={4} style={{ ...fieldInput, resize: "vertical", minHeight: "96px" }} />
                  </div>

                  {error && (
                    <div style={{
                      padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)", fontSize: "0.875rem", color: "var(--red)",
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitQuote}
                    disabled={submitting || !unitPrice || !quoteLotSize || !leadTimeDays}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      padding: "9px 16px", fontSize: "0.875rem", fontWeight: 600,
                      color: "white", backgroundColor: "var(--brand)", border: "none",
                      cursor: submitting || !unitPrice || !quoteLotSize || !leadTimeDays ? "not-allowed" : "pointer",
                      opacity: submitting || !unitPrice || !quoteLotSize || !leadTimeDays ? 0.5 : 1,
                      width: "100%",
                    }}
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
