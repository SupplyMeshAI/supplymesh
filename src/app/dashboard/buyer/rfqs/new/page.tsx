// src/app/dashboard/buyer/rfqs/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, AlertCircle, Upload, X, Lock, Star } from "lucide-react";
import type { Rfq, RequirementFlag } from "@/lib/rfqs/types";

// ============================================================================
// Shared option lists (mirror supplier_profiles values)
// ============================================================================
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

// ============================================================================
// Component
// ============================================================================
export default function NewRfqPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rfqId, setRfqId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Step 1: Part overview
  const [projectName, setProjectName] = useState("");
  const [partName, setPartName] = useState("");
  const [partDescription, setPartDescription] = useState("");

  // Step 2: Process & material
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [processFlags, setProcessFlags] = useState<Record<string, RequirementFlag>>({});
  const [materialPrimary, setMaterialPrimary] = useState("");
  const [materialRequired, setMaterialRequired] = useState(true);
  const [secondaryOps, setSecondaryOps] = useState("");

  // Step 3: Specs & quantity
  const [toleranceGeneral, setToleranceGeneral] = useState("");
  const [toleranceTight, setToleranceTight] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [annualVolume, setAnnualVolume] = useState("");
  const [numParts, setNumParts] = useState("1");

  // Step 4: Requirements
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [certFlags, setCertFlags] = useState<Record<string, RequirementFlag>>({});
  const [itarRequired, setItarRequired] = useState(false);
  const [industry, setIndustry] = useState("");
  const [additionalReqs, setAdditionalReqs] = useState("");

  // Step 5: Location, timeline & budget
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "standard" | "urgent">("standard");
  const [neededBy, setNeededBy] = useState("");
  const [productionStart, setProductionStart] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [notes, setNotes] = useState("");

  // ============================================================================
  // Init: get company_id and create draft RFQ
  // ============================================================================
  useEffect(() => {
    async function init() {
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
      setCompanyId(membership.company_id);

      // Create draft RFQ immediately
      const { data: rfq, error: rfqError } = await supabase
        .from("rfqs")
        .insert({
          company_id: membership.company_id,
          created_by: user.id,
          status: "draft",
          current_step: 1,
        })
        .select()
        .single();

      if (rfqError) { setError(rfqError.message); return; }
      setRfqId(rfq.id);
    }
    init();
  }, [router]);

  // ============================================================================
  // Auto-save on step change
  // ============================================================================
  async function saveCurrentStep() {
    if (!rfqId) return;
    setSaving(true);

    const supabase = createClient();
    const processReqFlags = selectedProcesses.map(p => processFlags[p] || "preferred");
    const certReqFlags = selectedCerts.map(c => certFlags[c] || "preferred");

    const { error: saveError } = await supabase
      .from("rfqs")
      .update({
        current_step: step,
        project_name: projectName || null,
        part_name: partName || null,
        part_description: partDescription || null,
        processes_required: selectedProcesses,
        processes_required_flags: processReqFlags,
        material_primary: materialPrimary || null,
        material_is_required: materialRequired,
        secondary_operations: secondaryOps || null,
        tolerance_general: toleranceGeneral || null,
        tolerance_tight: toleranceTight || null,
        lot_size: lotSize || null,
        annual_volume: annualVolume || null,
        num_unique_parts: parseInt(numParts) || 1,
        certifications_required: selectedCerts,
        certifications_required_flags: certReqFlags,
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

    if (saveError) setError(saveError.message);
    setSaving(false);
  }

  async function handleNext() {
    await saveCurrentStep();
    setStep(s => s + 1);
  }

  async function handleBack() {
    await saveCurrentStep();
    setStep(s => s - 1);
  }

  // ============================================================================
  // Submit RFQ
  // ============================================================================
  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const processReqFlags = selectedProcesses.map(p => processFlags[p] || "preferred");
    const certReqFlags = selectedCerts.map(c => certFlags[c] || "preferred");

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
        processes_required_flags: processReqFlags,
        material_primary: materialPrimary || null,
        material_is_required: materialRequired,
        secondary_operations: secondaryOps || null,
        tolerance_general: toleranceGeneral || null,
        tolerance_tight: toleranceTight || null,
        lot_size: lotSize || null,
        annual_volume: annualVolume || null,
        num_unique_parts: parseInt(numParts) || 1,
        certifications_required: selectedCerts,
        certifications_required_flags: certReqFlags,
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

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/buyer/rfqs");
  }

  // ============================================================================
  // Toggle helpers
  // ============================================================================
  function toggleProcess(value: string) {
    setSelectedProcesses(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
    if (!processFlags[value]) {
      setProcessFlags(prev => ({ ...prev, [value]: "preferred" }));
    }
  }

  function toggleProcessFlag(value: string) {
    setProcessFlags(prev => ({
      ...prev,
      [value]: prev[value] === "required" ? "preferred" : "required",
    }));
  }

  function toggleCert(value: string) {
    setSelectedCerts(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
    if (!certFlags[value]) {
      setCertFlags(prev => ({ ...prev, [value]: "preferred" }));
    }
  }

  function toggleCertFlag(value: string) {
    setCertFlags(prev => ({
      ...prev,
      [value]: prev[value] === "required" ? "preferred" : "required",
    }));
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
  // Render
  // ============================================================================
  if (!rfqId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f0f4f8" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/dashboard/buyer" className="inline-flex items-center justify-center mb-4">
            <Image
              src="/brand/logo-full-dark.svg"
              alt="SupplyMesh"
              width={180}
              height={42}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {STEP_LABELS[step - 1]}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Step {step} of {TOTAL_STEPS}
            {saving && <span className="ml-2 text-emerald-600">· Saving...</span>}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "6px",
                flex: 1,
                borderRadius: "9999px",
                backgroundColor: i < step ? "var(--brand)" : "#e2e8f0",
                transition: "background-color 0.2s",
              }}
            />
          ))}
        </div>

        <div className="card p-6">

          {/* ============ STEP 1: Part Overview ============ */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Project name *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="input"
                  placeholder="e.g. Q3 Brake Housing Sourcing"
                />
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                  Internal reference — suppliers won&apos;t see this
                </p>
              </div>
              <div>
                <label className="label">Part name *</label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={e => setPartName(e.target.value)}
                  className="input"
                  placeholder="e.g. Brake caliper housing"
                />
              </div>
              <div>
                <label className="label">Part description</label>
                <textarea
                  value={partDescription}
                  onChange={e => setPartDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Describe the part, application, and any special requirements..."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {/* ============ STEP 2: Process & Material ============ */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Required processes *</label>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                  Select all that apply. Click the <Lock style={{ width: "0.65rem", height: "0.65rem", display: "inline" }} /> icon to mark as non-negotiable.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {PROCESSES.map(p => {
                    const selected = selectedProcesses.includes(p.value);
                    const isRequired = processFlags[p.value] === "required";
                    return (
                      <div key={p.value} style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          onClick={() => toggleProcess(p.value)}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                            border: selected ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                            backgroundColor: selected ? "var(--brand-light)" : "white",
                            color: selected ? "var(--brand)" : "#4b5563",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{
                            width: "1rem", height: "1rem", borderRadius: "0.25rem", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            backgroundColor: selected ? "var(--brand)" : "transparent",
                            border: selected ? "none" : "1px solid #d1d5db",
                          }}>
                            {selected && <Check style={{ width: "0.75rem", height: "0.75rem", color: "white" }} />}
                          </div>
                          {p.label}
                        </button>
                        {selected && (
                          <button
                            type="button"
                            onClick={() => toggleProcessFlag(p.value)}
                            title={isRequired ? "Non-negotiable" : "Preferred (click to make required)"}
                            style={{
                              width: "2rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "0.5rem",
                              border: isRequired ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                              backgroundColor: isRequired ? "var(--brand)" : "white",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {isRequired
                              ? <Lock style={{ width: "0.8rem", height: "0.8rem", color: "white" }} />
                              : <Star style={{ width: "0.8rem", height: "0.8rem", color: "#9ca3af" }} />
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">Primary material</label>
                <input
                  type="text"
                  value={materialPrimary}
                  onChange={e => setMaterialPrimary(e.target.value)}
                  className="input"
                  placeholder="e.g. Aluminum 6061-T6"
                />
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.85rem", color: "#4b5563", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={materialRequired}
                    onChange={e => setMaterialRequired(e.target.checked)}
                    style={{ accentColor: "var(--brand)" }}
                  />
                  Material is non-negotiable
                </label>
              </div>
              <div>
                <label className="label">Secondary operations</label>
                <input
                  type="text"
                  value={secondaryOps}
                  onChange={e => setSecondaryOps(e.target.value)}
                  className="input"
                  placeholder="e.g. Anodizing, heat treatment, assembly"
                />
              </div>
            </div>
          )}

          {/* ============ STEP 3: Specs & Quantity ============ */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">General tolerance</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {TOLERANCES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setToleranceGeneral(t)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        border: toleranceGeneral === t ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                        backgroundColor: toleranceGeneral === t ? "var(--brand-light)" : "white",
                        color: toleranceGeneral === t ? "var(--brand)" : "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Tightest tolerance (if different)</label>
                <input
                  type="text"
                  value={toleranceTight}
                  onChange={e => setToleranceTight(e.target.value)}
                  className="input"
                  placeholder='e.g. ±0.0002" on bore ID'
                />
              </div>
              <div>
                <label className="label">Lot size</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {LOT_SIZES.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setLotSize(size)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        border: lotSize === size ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                        backgroundColor: lotSize === size ? "var(--brand-light)" : "white",
                        color: lotSize === size ? "var(--brand)" : "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Annual volume</label>
                  <input
                    type="text"
                    value={annualVolume}
                    onChange={e => setAnnualVolume(e.target.value)}
                    className="input"
                    placeholder="e.g. 5,000 units/year"
                  />
                </div>
                <div>
                  <label className="label">Unique parts in this RFQ</label>
                  <input
                    type="number"
                    value={numParts}
                    onChange={e => setNumParts(e.target.value)}
                    className="input"
                    placeholder="1"
                    min={1}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============ STEP 4: Requirements ============ */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Certifications</label>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                  Click <Lock style={{ width: "0.65rem", height: "0.65rem", display: "inline" }} /> to mark as non-negotiable.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {CERTIFICATIONS.map(c => {
                    const selected = selectedCerts.includes(c.value);
                    const isRequired = certFlags[c.value] === "required";
                    return (
                      <div key={c.value} style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          onClick={() => toggleCert(c.value)}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                            border: selected ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                            backgroundColor: selected ? "var(--brand-light)" : "white",
                            color: selected ? "var(--brand)" : "#4b5563",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{
                            width: "1rem", height: "1rem", borderRadius: "0.25rem", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            backgroundColor: selected ? "var(--brand)" : "transparent",
                            border: selected ? "none" : "1px solid #d1d5db",
                          }}>
                            {selected && <Check style={{ width: "0.75rem", height: "0.75rem", color: "white" }} />}
                          </div>
                          {c.label}
                        </button>
                        {selected && (
                          <button
                            type="button"
                            onClick={() => toggleCertFlag(c.value)}
                            title={isRequired ? "Non-negotiable" : "Preferred"}
                            style={{
                              width: "2rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "0.5rem",
                              border: isRequired ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                              backgroundColor: isRequired ? "var(--brand)" : "white",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {isRequired
                              ? <Lock style={{ width: "0.8rem", height: "0.8rem", color: "white" }} />
                              : <Star style={{ width: "0.8rem", height: "0.8rem", color: "#9ca3af" }} />
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#4b5563", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={itarRequired}
                  onChange={e => setItarRequired(e.target.checked)}
                  style={{ accentColor: "var(--brand)" }}
                />
                ITAR registration required
              </label>
              <div>
                <label className="label">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="input"
                  placeholder="e.g. Automotive, Aerospace, Medical"
                />
              </div>
              <div>
                <label className="label">Additional requirements</label>
                <textarea
                  value={additionalReqs}
                  onChange={e => setAdditionalReqs(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Any other requirements or notes for suppliers..."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {/* ============ STEP 5: Location, Timeline & Budget ============ */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Preferred supplier region</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {REGIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRegion(r)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        border: preferredRegions.includes(r) ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                        backgroundColor: preferredRegions.includes(r) ? "var(--brand-light)" : "white",
                        color: preferredRegions.includes(r) ? "var(--brand)" : "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Priority</label>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {(["low", "standard", "urgent"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        border: priority === p ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                        backgroundColor: priority === p ? "var(--brand-light)" : "white",
                        color: priority === p ? "var(--brand)" : "#4b5563",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Quotes needed by</label>
                  <input
                    type="date"
                    value={neededBy}
                    onChange={e => setNeededBy(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Production start</label>
                  <input
                    type="date"
                    value={productionStart}
                    onChange={e => setProductionStart(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Target price per unit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    className="input"
                    placeholder="$0.00"
                  />
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                    Private — suppliers won&apos;t see this
                  </p>
                </div>
                <div>
                  <label className="label">Budget range</label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={e => setBudgetRange(e.target.value)}
                    className="input"
                    placeholder="e.g. $5-10 per unit"
                  />
                </div>
              </div>
              <div>
                <label className="label">Notes for suppliers</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Any additional context, shipping requirements, etc."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {/* ============ STEP 6: Review & Submit ============ */}
          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Part Overview */}
              <ReviewSection title="Part Overview" onEdit={() => setStep(1)}>
                <ReviewRow label="Project" value={projectName} />
                <ReviewRow label="Part name" value={partName} />
                <ReviewRow label="Description" value={partDescription} />
              </ReviewSection>

              {/* Process & Material */}
              <ReviewSection title="Process & Material" onEdit={() => setStep(2)}>
                <ReviewRow
                  label="Processes"
                  value={selectedProcesses.map(p => {
                    const label = PROCESSES.find(x => x.value === p)?.label || p;
                    const flag = processFlags[p] === "required" ? " 🔒" : "";
                    return label + flag;
                  }).join(", ")}
                />
                <ReviewRow label="Material" value={materialPrimary ? `${materialPrimary}${materialRequired ? " 🔒" : ""}` : null} />
                <ReviewRow label="Secondary ops" value={secondaryOps} />
              </ReviewSection>

              {/* Specs */}
              <ReviewSection title="Specs & Quantity" onEdit={() => setStep(3)}>
                <ReviewRow label="Tolerance" value={toleranceGeneral} />
                <ReviewRow label="Tight tolerance" value={toleranceTight} />
                <ReviewRow label="Lot size" value={lotSize} />
                <ReviewRow label="Annual volume" value={annualVolume} />
                <ReviewRow label="Unique parts" value={numParts} />
              </ReviewSection>

              {/* Requirements */}
              <ReviewSection title="Requirements" onEdit={() => setStep(4)}>
                <ReviewRow
                  label="Certifications"
                  value={selectedCerts.map(c => {
                    const label = CERTIFICATIONS.find(x => x.value === c)?.label || c;
                    const flag = certFlags[c] === "required" ? " 🔒" : "";
                    return label + flag;
                  }).join(", ")}
                />
                <ReviewRow label="ITAR required" value={itarRequired ? "Yes" : "No"} />
                <ReviewRow label="Industry" value={industry} />
              </ReviewSection>

              {/* Location, Timeline, Budget */}
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

          {/* Error display */}
          {error && (
            <div style={{ marginTop: "1rem" }} className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle style={{ width: "1rem", height: "1rem", display: "inline", marginRight: "0.4rem", verticalAlign: "text-bottom" }} />
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "1.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid #f1f5f9",
          }}>
            {step > 1 && (
              <button type="button" onClick={handleBack} className="btn-secondary">
                Back
              </button>
            )}

            <Link
              href="/dashboard/buyer/rfqs"
              style={{
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                color: "#9ca3af",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              Save draft & exit
            </Link>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 1 && !partName}
                className="btn-primary"
                style={{ marginLeft: "auto" }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
                style={{ marginLeft: "auto" }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  : "Submit RFQ →"
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Review step helper components
// ============================================================================
function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          style={{ fontSize: "0.8rem", color: "var(--brand)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}
        >
          Edit
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {children}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, privacy }: { label: string; value: string | number | null | undefined; privacy?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ color: "#1e293b", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
        {privacy && <Lock style={{ width: "0.7rem", height: "0.7rem", display: "inline", marginRight: "0.3rem", color: "#9ca3af" }} />}
        {value}
      </span>
    </div>
  );
}
