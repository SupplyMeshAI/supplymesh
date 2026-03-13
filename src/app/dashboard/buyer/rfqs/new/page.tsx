// src/app/dashboard/buyer/rfqs/new/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, AlertCircle, Lock, Star } from "lucide-react";
import type { Rfq, RequirementFlag } from "@/lib/rfqs/types";

const PROCESSES = [
  { value: "cnc_milling", label: "CNC Milling" },
  { value: "cnc_turning", label: "CNC Turning" },
  { value: "sheet_metal_fabrication", label: "Sheet Metal Fabrication" },
  { value: "injection_molding", label: "Injection Molding" },
  { value: "casting", label: "Casting" },
  { value: "forging", label: "Forging" },
  { value: "additive_3d_printing", label: "3D Printing / Additive" },
  { value: "welding_fabrication", label: "Welding / Fabrication" },
  { value: "stamping", label: "Stamping" },
  { value: "laser_cutting", label: "Laser Cutting" },
  { value: "waterjet_cutting", label: "Waterjet Cutting" },
  { value: "pcb_assembly", label: "PCB Assembly" },
  { value: "grinding", label: "Grinding" },
  { value: "edm", label: "EDM" },
  { value: "other", label: "Other" },
];

const CERTIFICATIONS = [
  { value: "iso_9001", label: "ISO 9001" },
  { value: "iatf_16949", label: "IATF 16949" },
  { value: "as9100", label: "AS9100" },
  { value: "iso_13485", label: "ISO 13485" },
  { value: "nadcap", label: "NADCAP" },
  { value: "iso_14001", label: "ISO 14001" },
  { value: "itar_registered", label: "ITAR Registered" },
  { value: "mil_spec", label: "Mil-Spec Capable" },
  { value: "ul_listed", label: "UL Listed" },
  { value: "rohs", label: "RoHS Compliant" },
];

const LOT_SIZES = [
  "Prototype (1-10)",
  "Low (10-100)",
  "Medium (100-1,000)",
  "High (1,000-10,000)",
  "Very High (10,000+)",
];

const TOLERANCES = [
  "±0.010\" or looser",
  "±0.005\"",
  "±0.002\"",
  "±0.001\"",
  "±0.0005\" or tighter",
];

const REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Southwest",
  "West Coast",
  "No preference",
];

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Part Overview",
  "Process & Material",
  "Specs & Quantity",
  "Requirements",
  "Location, Timeline & Budget",
  "Review & Submit",
];

// ── Shared style tokens ───────────────────────────────────────────────────────

const unselectedBtn = {
  border: "1px solid var(--border2)",
  backgroundColor: "var(--surface2)",
  color: "var(--text-muted)",
};

const selectedBtn = {
  border: "1px solid var(--brand)",
  backgroundColor: "var(--brand-light)",
  color: "var(--brand)",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewRfqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  // ── FIX: guard against React Strict Mode double-invoke ──────────────────────
  // useRef persists across the double-mount; the boolean prevents the second
  // execution of init() from creating a second draft row.
  const initRan = useRef(false);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rfqId, setRfqId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Step 1
  const [projectName, setProjectName] = useState("");
  const [partName, setPartName] = useState("");
  const [partDescription, setPartDescription] = useState("");

  // Step 2
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [processFlags, setProcessFlags] = useState<Record<string, RequirementFlag>>({});
  const [materialPrimary, setMaterialPrimary] = useState("");
  const [materialRequired, setMaterialRequired] = useState(true);
  const [secondaryOps, setSecondaryOps] = useState("");

  // Step 3
  const [toleranceGeneral, setToleranceGeneral] = useState("");
  const [toleranceTight, setToleranceTight] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [annualVolume, setAnnualVolume] = useState("");
  const [numParts, setNumParts] = useState("1");

  // Step 4
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [certFlags, setCertFlags] = useState<Record<string, RequirementFlag>>({});
  const [itarRequired, setItarRequired] = useState(false);
  const [industry, setIndustry] = useState("");
  const [additionalReqs, setAdditionalReqs] = useState("");

  // Step 5
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "standard" | "urgent">("standard");
  const [neededBy, setNeededBy] = useState("");
  const [productionStart, setProductionStart] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [notes, setNotes] = useState("");

  // ============================================================================
  // Init: load existing draft OR just resolve companyId (no auto-create)
  // Draft row is only created when user explicitly saves (handleSaveAndExit)
  // or advances a step (handleNext). This prevents phantom drafts from
  // React Strict Mode double-invoke and from users who abandon the page.
  // ============================================================================
  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;

    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("profile_id", user.id)
        .single();

      if (!membership) { router.push("/auth/onboarding"); return; }
      setCompanyId(membership.company_id);

      // ── Resume existing draft if ?draft=id is in URL ──────────────
      if (draftId) {
        const { data: rfq, error: fetchError } = await supabase
          .from("rfqs")
          .select("*")
          .eq("id", draftId)
          .eq("company_id", membership.company_id)
          .eq("status", "draft")
          .single();

        if (!fetchError && rfq) {
          setRfqId(rfq.id);
          setStep(rfq.current_step || 1);
          setProjectName(rfq.project_name || "");
          setPartName(rfq.part_name || "");
          setPartDescription(rfq.part_description || "");
          setSelectedProcesses(rfq.processes_required || []);
          const pFlags: Record<string, RequirementFlag> = {};
          (rfq.processes_required || []).forEach((p: string, i: number) => {
            pFlags[p] = rfq.processes_required_flags?.[i] || "preferred";
          });
          setProcessFlags(pFlags);
          setMaterialPrimary(rfq.material_primary || "");
          setMaterialRequired(rfq.material_is_required ?? true);
          setSecondaryOps(rfq.secondary_operations || "");
          setToleranceGeneral(rfq.tolerance_general || "");
          setToleranceTight(rfq.tolerance_tight || "");
          setLotSize(rfq.lot_size || "");
          setAnnualVolume(rfq.annual_volume || "");
          setNumParts(String(rfq.num_unique_parts || 1));
          setSelectedCerts(rfq.certifications_required || []);
          const cFlags: Record<string, RequirementFlag> = {};
          (rfq.certifications_required || []).forEach((c: string, i: number) => {
            cFlags[c] = rfq.certifications_required_flags?.[i] || "preferred";
          });
          setCertFlags(cFlags);
          setItarRequired(rfq.itar_required || false);
          setIndustry(rfq.industry || "");
          setAdditionalReqs(rfq.additional_requirements || "");
          setPreferredRegions(rfq.preferred_regions || []);
          setPriority(rfq.priority || "standard");
          setNeededBy(rfq.needed_by_date || "");
          setProductionStart(rfq.production_start || "");
          setTargetPrice(rfq.target_price ? String(rfq.target_price) : "");
          setBudgetRange(rfq.budget_notes || "");
          setNotes(rfq.special_instructions || "");
        } else {
          console.warn("Draft not found or access denied, starting fresh");
        }
      }

      // No draft creation here — happens lazily on first save
      setInitializing(false);
    }

    init();
  }, [router, draftId]);

  // ============================================================================
  // Ensure a draft row exists before saving (lazy creation)
  // Returns the rfqId to use — either existing or newly created
  // ============================================================================
  async function ensureDraft(): Promise<string | null> {
    if (rfqId) return rfqId;
    if (!companyId) return null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: rfq, error } = await supabase
      .from("rfqs")
      .insert({
        company_id: companyId,
        created_by: user.id,
        status: "draft",
        current_step: step,
      })
      .select()
      .single();

    if (error) { setError(error.message); return null; }
    setRfqId(rfq.id);
    return rfq.id;
  }

  // ============================================================================
  // Auto-save
  // ============================================================================
  async function saveCurrentStep() {
    const id = await ensureDraft();
    if (!id) return;
    setSaving(true);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("rfqs")
      .update({
        current_step: step,
        project_name: projectName || null,
        part_name: partName || null,
        part_description: partDescription || null,
        processes_required: selectedProcesses,
        processes_required_flags: selectedProcesses.map(p => processFlags[p] || "preferred"),
        material_primary: materialPrimary || null,
        material_is_required: materialRequired,
        secondary_operations: secondaryOps || null,
        tolerance_general: toleranceGeneral || null,
        tolerance_tight: toleranceTight || null,
        lot_size: lotSize || null,
        annual_volume: annualVolume || null,
        num_unique_parts: parseInt(numParts) || 1,
        certifications_required: selectedCerts,
        certifications_required_flags: selectedCerts.map(c => certFlags[c] || "preferred"),
        itar_required: itarRequired,
        industry: industry || null,
        additional_requirements: additionalReqs || null,
        preferred_regions: preferredRegions,
        priority,
        needed_by_date: neededBy || null,
        production_start: productionStart || null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        budget_notes: budgetRange || null,
        special_instructions: notes || null,
      })
      .eq("id", id);
    if (saveError) setError(saveError.message);
    setSaving(false);
  }

  async function handleSaveAndExit() {
    // Only save if the user has typed something worth keeping
    if (partName || projectName) {
      await saveCurrentStep();
    }
    router.push("/dashboard/buyer/rfqs");
  }

  async function handleNext() {
    await saveCurrentStep();
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleBack() {
    await saveCurrentStep();
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ============================================================================
  // Submit
  // ============================================================================
  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: submitError } = await supabase
      .from("rfqs")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        current_step: TOTAL_STEPS,
        project_name: projectName || null,
        part_name: partName || null,
        part_description: partDescription || null,
        processes_required: selectedProcesses,
        processes_required_flags: selectedProcesses.map(p => processFlags[p] || "preferred"),
        material_primary: materialPrimary || null,
        material_is_required: materialRequired,
        secondary_operations: secondaryOps || null,
        tolerance_general: toleranceGeneral || null,
        tolerance_tight: toleranceTight || null,
        lot_size: lotSize || null,
        annual_volume: annualVolume || null,
        num_unique_parts: parseInt(numParts) || 1,
        certifications_required: selectedCerts,
        certifications_required_flags: selectedCerts.map(c => certFlags[c] || "preferred"),
        itar_required: itarRequired,
        industry: industry || null,
        additional_requirements: additionalReqs || null,
        preferred_regions: preferredRegions,
        priority,
        needed_by_date: neededBy || null,
        production_start: productionStart || null,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        budget_notes: budgetRange || null,
        special_instructions: notes || null,
      })
      .eq("id", rfqId);

    if (submitError) { setError(submitError.message); setLoading(false); return; }

    // Fire match API without awaiting — the route sets status to "matching"
    // immediately, then delays "matched" by ~15s so the progress bar has time to run.
    // We redirect right away so the user sees the animated detail page.
    fetch("/api/rfqs/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfq_id: rfqId }),
    }).catch(err => console.error("Matching error:", err));

    // Small pause so the route has time to write "matching" before we navigate
    await new Promise(r => setTimeout(r, 600));

    router.push(`/dashboard/buyer/rfqs/${rfqId}?submitted=true`);
  }

  // ============================================================================
  // Toggle helpers
  // ============================================================================
  function toggleProcess(value: string) {
    setSelectedProcesses(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
    if (!processFlags[value]) setProcessFlags(prev => ({ ...prev, [value]: "preferred" }));
  }
  function toggleProcessFlag(value: string) {
    setProcessFlags(prev => ({ ...prev, [value]: prev[value] === "required" ? "preferred" : "required" }));
  }
  function toggleCert(value: string) {
    setSelectedCerts(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
    if (!certFlags[value]) setCertFlags(prev => ({ ...prev, [value]: "preferred" }));
  }
  function toggleCertFlag(value: string) {
    setCertFlags(prev => ({ ...prev, [value]: prev[value] === "required" ? "preferred" : "required" }));
  }
  function toggleRegion(value: string) {
    if (value === "No preference") {
      setPreferredRegions(prev => prev.includes(value) ? [] : [value]);
      return;
    }
    setPreferredRegions(prev => {
      const without = prev.filter(x => x !== "No preference");
      return without.includes(value) ? without.filter(x => x !== value) : [...without, value];
    });
  }

  // ============================================================================
  // Loading state
  // ============================================================================
  if (initializing) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--brand)", margin: "0 auto" }} className="animate-spin" />
          <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {draftId ? "Loading draft..." : "Creating RFQ..."}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 0 64px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px", textAlign: "center" }}>
        <h1 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
          {STEP_LABELS[step - 1]}
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Step {step} of {TOTAL_STEPS}
          {saving && <span style={{ marginLeft: "8px", color: "var(--green)" }}>· Saving...</span>}
          {draftId && !saving && <span style={{ marginLeft: "8px" }}>· Draft</span>}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            height: "3px",
            flex: 1,
            backgroundColor: i < step ? "var(--brand)" : "var(--border2)",
            transition: "background-color 0.2s",
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        padding: "24px",
      }}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="label">Project name *</label>
              <input type="text" required value={projectName} onChange={e => setProjectName(e.target.value)} className="input" placeholder="e.g. Q3 Brake Housing Sourcing" />
              <p style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "4px" }}>Internal reference — suppliers won&apos;t see this</p>
            </div>
            <div>
              <label className="label">Part name *</label>
              <input type="text" required value={partName} onChange={e => setPartName(e.target.value)} className="input" placeholder="e.g. Brake caliper housing" />
            </div>
            <div>
              <label className="label">Part description</label>
              <textarea value={partDescription} onChange={e => setPartDescription(e.target.value)} className="input" rows={3} placeholder="Describe the part, application, and any special requirements..." style={{ resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="label">Required processes *</label>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Select all that apply. Click <Lock style={{ width: "10px", height: "10px", display: "inline" }} /> to mark as non-negotiable.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {PROCESSES.map(p => {
                  const selected = selectedProcesses.includes(p.value);
                  const isRequired = processFlags[p.value] === "required";
                  return (
                    <div key={p.value} style={{ display: "flex", gap: "4px" }}>
                      <button type="button" onClick={() => toggleProcess(p.value)} style={{
                        flex: 1, display: "flex", alignItems: "center", gap: "8px",
                        padding: "7px 10px", fontSize: "12px", cursor: "pointer", textAlign: "left",
                        ...(selected ? selectedBtn : unselectedBtn),
                      }}>
                        <div style={{
                          width: "14px", height: "14px", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          backgroundColor: selected ? "var(--brand)" : "transparent",
                          border: selected ? "none" : "1px solid var(--border2)",
                        }}>
                          {selected && <Check style={{ width: "10px", height: "10px", color: "white" }} />}
                        </div>
                        {p.label}
                      </button>
                      {selected && (
                        <button type="button" onClick={() => toggleProcessFlag(p.value)} title={isRequired ? "Non-negotiable" : "Preferred"} style={{
                          width: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                          ...(isRequired ? selectedBtn : unselectedBtn),
                        }}>
                          {isRequired
                            ? <Lock style={{ width: "11px", height: "11px", color: "var(--brand)" }} />
                            : <Star style={{ width: "11px", height: "11px", color: "var(--text-muted)" }} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">Primary material</label>
              <input type="text" value={materialPrimary} onChange={e => setMaterialPrimary(e.target.value)} className="input" placeholder="e.g. Aluminum 6061-T6" />
              <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                <input type="checkbox" checked={materialRequired} onChange={e => setMaterialRequired(e.target.checked)} style={{ accentColor: "var(--brand)" }} />
                Material is non-negotiable
              </label>
            </div>
            <div>
              <label className="label">Secondary operations</label>
              <input type="text" value={secondaryOps} onChange={e => setSecondaryOps(e.target.value)} className="input" placeholder="e.g. Anodizing, heat treatment, assembly" />
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="label">General tolerance</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                {TOLERANCES.map(t => (
                  <button key={t} type="button" onClick={() => setToleranceGeneral(t)} style={{
                    padding: "5px 10px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                    ...(toleranceGeneral === t ? selectedBtn : unselectedBtn),
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Tightest tolerance (if different)</label>
              <input type="text" value={toleranceTight} onChange={e => setToleranceTight(e.target.value)} className="input" placeholder='e.g. ±0.0002" on bore ID' />
            </div>
            <div>
              <label className="label">Lot size</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                {LOT_SIZES.map(size => (
                  <button key={size} type="button" onClick={() => setLotSize(size)} style={{
                    padding: "5px 10px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                    ...(lotSize === size ? selectedBtn : unselectedBtn),
                  }}>{size}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="label">Annual volume</label>
                <input type="text" value={annualVolume} onChange={e => setAnnualVolume(e.target.value)} className="input" placeholder="e.g. 5,000 units/year" />
              </div>
              <div>
                <label className="label">Unique parts</label>
                <input type="number" value={numParts} onChange={e => setNumParts(e.target.value)} className="input" placeholder="1" min={1} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="label">Certifications</label>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Click <Lock style={{ width: "10px", height: "10px", display: "inline" }} /> to mark as non-negotiable.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {CERTIFICATIONS.map(c => {
                  const selected = selectedCerts.includes(c.value);
                  const isRequired = certFlags[c.value] === "required";
                  return (
                    <div key={c.value} style={{ display: "flex", gap: "4px" }}>
                      <button type="button" onClick={() => toggleCert(c.value)} style={{
                        flex: 1, display: "flex", alignItems: "center", gap: "8px",
                        padding: "7px 10px", fontSize: "12px", cursor: "pointer", textAlign: "left",
                        ...(selected ? selectedBtn : unselectedBtn),
                      }}>
                        <div style={{
                          width: "14px", height: "14px", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          backgroundColor: selected ? "var(--brand)" : "transparent",
                          border: selected ? "none" : "1px solid var(--border2)",
                        }}>
                          {selected && <Check style={{ width: "10px", height: "10px", color: "white" }} />}
                        </div>
                        {c.label}
                      </button>
                      {selected && (
                        <button type="button" onClick={() => toggleCertFlag(c.value)} style={{
                          width: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                          ...(isRequired ? selectedBtn : unselectedBtn),
                        }}>
                          {isRequired
                            ? <Lock style={{ width: "11px", height: "11px", color: "var(--brand)" }} />
                            : <Star style={{ width: "11px", height: "11px", color: "var(--text-muted)" }} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
              <input type="checkbox" checked={itarRequired} onChange={e => setItarRequired(e.target.checked)} style={{ accentColor: "var(--brand)" }} />
              ITAR registration required
            </label>
            <div>
              <label className="label">Industry</label>
              <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} className="input" placeholder="e.g. Automotive, Aerospace, Medical" />
            </div>
            <div>
              <label className="label">Additional requirements</label>
              <textarea value={additionalReqs} onChange={e => setAdditionalReqs(e.target.value)} className="input" rows={2} placeholder="Any other requirements or notes for suppliers..." style={{ resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* ── STEP 5 ── */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="label">Preferred supplier region</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                {REGIONS.map(r => (
                  <button key={r} type="button" onClick={() => toggleRegion(r)} style={{
                    padding: "5px 10px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                    ...(preferredRegions.includes(r) ? selectedBtn : unselectedBtn),
                  }}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Priority</label>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                {(["low", "standard", "urgent"] as const).map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)} style={{
                    padding: "5px 10px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textTransform: "capitalize",
                    ...(priority === p ? selectedBtn : unselectedBtn),
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="label">Quotes needed by</label>
                <input type="date" value={neededBy} onChange={e => setNeededBy(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Production start</label>
                <input type="date" value={productionStart} onChange={e => setProductionStart(e.target.value)} className="input" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="label">Target price per unit</label>
                <input type="number" step="0.01" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} className="input" placeholder="$0.00" />
                <p style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "4px" }}>Private — suppliers won&apos;t see this</p>
              </div>
              <div>
                <label className="label">Budget range</label>
                <input type="text" value={budgetRange} onChange={e => setBudgetRange(e.target.value)} className="input" placeholder="e.g. $5-10 per unit" />
              </div>
            </div>
            <div>
              <label className="label">Notes for suppliers</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} placeholder="Any additional context, shipping requirements, etc." style={{ resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* ── STEP 6: Review ── */}
        {step === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <ReviewSection title="Part Overview" onEdit={() => setStep(1)}>
              <ReviewRow label="Project" value={projectName} />
              <ReviewRow label="Part name" value={partName} />
              <ReviewRow label="Description" value={partDescription} />
            </ReviewSection>
            <ReviewSection title="Process & Material" onEdit={() => setStep(2)}>
              <ReviewRow label="Processes" value={selectedProcesses.map(p => {
                const label = PROCESSES.find(x => x.value === p)?.label || p;
                return label + (processFlags[p] === "required" ? " 🔒" : "");
              }).join(", ")} />
              <ReviewRow label="Material" value={materialPrimary ? `${materialPrimary}${materialRequired ? " 🔒" : ""}` : null} />
              <ReviewRow label="Secondary ops" value={secondaryOps} />
            </ReviewSection>
            <ReviewSection title="Specs & Quantity" onEdit={() => setStep(3)}>
              <ReviewRow label="Tolerance" value={toleranceGeneral} />
              <ReviewRow label="Tight tolerance" value={toleranceTight} />
              <ReviewRow label="Lot size" value={lotSize} />
              <ReviewRow label="Annual volume" value={annualVolume} />
              <ReviewRow label="Unique parts" value={numParts} />
            </ReviewSection>
            <ReviewSection title="Requirements" onEdit={() => setStep(4)}>
              <ReviewRow label="Certifications" value={selectedCerts.map(c => {
                const label = CERTIFICATIONS.find(x => x.value === c)?.label || c;
                return label + (certFlags[c] === "required" ? " 🔒" : "");
              }).join(", ")} />
              <ReviewRow label="ITAR required" value={itarRequired ? "Yes" : "No"} />
              <ReviewRow label="Industry" value={industry} />
            </ReviewSection>
            <ReviewSection title="Location, Timeline & Budget" onEdit={() => setStep(5)}>
              <ReviewRow label="Regions" value={preferredRegions.join(", ")} />
              <ReviewRow label="Priority" value={priority} />
              <ReviewRow label="Quotes needed by" value={neededBy} />
              <ReviewRow label="Production start" value={productionStart} />
              <ReviewRow label="Target price" value={targetPrice ? `$${targetPrice}` : null} privacy />
              <ReviewRow label="Budget range" value={budgetRange} />
            </ReviewSection>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: "16px", padding: "10px 12px", fontSize: "12px",
            backgroundColor: "var(--red-dim)", border: "1px solid #ef444430", color: "var(--red)",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <AlertCircle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: "flex", gap: "8px", marginTop: "24px", paddingTop: "16px",
          borderTop: "1px solid var(--border)",
        }}>
          {step > 1 && (
            <button type="button" onClick={handleBack} className="btn-secondary">Back</button>
          )}
          <button
            type="button"
            onClick={handleSaveAndExit}
            style={{
              padding: "7px 12px", fontSize: "12px", color: "var(--text-muted)",
              background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
            }}
          >
            Save & exit
          </button>
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={handleNext} disabled={step === 1 && !partName} className="btn-primary" style={{ marginLeft: "auto" }}>
              Continue →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ marginLeft: "auto" }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Submitting...</> : "Submit RFQ →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Review helpers ────────────────────────────────────────────────────────────

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h3 style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
          {title}
        </h3>
        <button type="button" onClick={onEdit} style={{ fontSize: "11px", color: "var(--brand)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>
          Edit
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, privacy }: { label: string; value: string | number | null | undefined; privacy?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
        {privacy && <Lock style={{ width: "10px", height: "10px", display: "inline", marginRight: "4px", color: "var(--text-muted)" }} />}
        {value}
      </span>
    </div>
  );
}
