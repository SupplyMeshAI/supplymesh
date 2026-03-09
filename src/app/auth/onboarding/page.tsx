"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check } from "lucide-react";

type UserRole = "buyer" | "supplier";
type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

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

const COMPANY_SIZES: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+"];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "buyer";

  const totalSteps = role === "supplier" ? 3 : 2;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");

  // Supplier fields
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [materials, setMaterials] = useState("");
  const [tagline, setTagline] = useState("");
  const [leadTime, setLeadTime] = useState("");

  function toggleProcess(value: string) {
    setSelectedProcesses((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    try {
      // 1. Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          website: companyWebsite || null,
          size: companySize || null,
          city: companyCity || null,
          state_region: companyState || null,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Link user to company
      const { error: memberError } = await supabase
        .from("company_members")
        .insert({ company_id: company.id, profile_id: user.id, is_admin: true });

      if (memberError) throw memberError;

      // 3. If supplier — create capability profile
      if (role === "supplier") {
        const materialList = materials
          .split(",")
          .map((m) => m.trim().toLowerCase().replace(/\s+/g, "_"))
          .filter(Boolean);

        const { error: supplierError } = await supabase
          .from("supplier_profiles")
          .insert({
            company_id: company.id,
            processes: selectedProcesses,
            materials: materialList,
            tagline: tagline || null,
            typical_lead_time_days: leadTime ? parseInt(leadTime) : null,
          });

        if (supplierError) throw supplierError;
      }

      // 4. Mark onboarding complete
      await supabase
        .from("profiles")
        .update({ onboarding: "complete", full_name: user.user_metadata?.full_name })
        .eq("id", user.id);

      router.push("/dashboard");

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : JSON.stringify(err));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center mb-4">
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
            {step === 1 && "Tell us about your company"}
            {step === 2 && role === "supplier" && "What can you make?"}
            {step === 2 && role === "buyer" && "You're all set!"}
            {step === 3 && "A few more details"}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">Step {step} of {totalSteps}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
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

          {/* Step 1 — Company info */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Company name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input"
                  placeholder="Acme Manufacturing Co."
                />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="input"
                  placeholder="https://acme.com"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    className="input"
                    placeholder="Detroit"
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    type="text"
                    value={companyState}
                    onChange={(e) => setCompanyState(e.target.value)}
                    className="input"
                    placeholder="MI"
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="label">Company size</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {COMPANY_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCompanySize(size)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        border: companySize === size ? "1px solid var(--brand)" : "1px solid #e2e8f0",
                        backgroundColor: companySize === size ? "var(--brand-light)" : "white",
                        color: companySize === size ? "var(--brand)" : "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      {size} employees
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 (Supplier) — Processes */}
          {step === 2 && role === "supplier" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">What processes do you offer? *</label>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                  Select all that apply
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {PROCESSES.map((p) => {
                    const selected = selectedProcesses.includes(p.value);
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => toggleProcess(p.value)}
                        style={{
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
                          width: "1rem",
                          height: "1rem",
                          borderRadius: "0.25rem",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selected ? "var(--brand)" : "transparent",
                          border: selected ? "none" : "1px solid #d1d5db",
                        }}>
                          {selected && <Check style={{ width: "0.75rem", height: "0.75rem", color: "white" }} />}
                        </div>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">Materials (comma-separated)</label>
                <input
                  type="text"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  className="input"
                  placeholder="Aluminum 6061, Stainless 304, ABS"
                />
              </div>
            </div>
          )}

          {/* Step 3 (Supplier) — Extra details */}
          {step === 3 && role === "supplier" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Shop tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="input"
                  placeholder="Precision CNC machining for aerospace and medical"
                  maxLength={120}
                />
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                  Max 120 characters
                </p>
              </div>
              <div>
                <label className="label">Typical lead time (days)</label>
                <input
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="input"
                  placeholder="14"
                  min={1}
                />
              </div>
            </div>
          )}

          {/* Step 2 (Buyer) — Done */}
          {step === 2 && role === "buyer" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "9999px",
                backgroundColor: "var(--brand-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.75rem",
              }}>
                <Check style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} />
              </div>
              <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>
                Your account is ready. You can now create RFQs and discover qualified suppliers.
              </p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: "1rem" }} className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
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
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="btn-secondary"
              >
                Back
              </button>
            )}
            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !companyName}
                className="btn-primary"
                style={{ marginLeft: "auto" }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="btn-primary"
                style={{ marginLeft: "auto" }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
                  : "Go to dashboard →"
                }
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f0f4f8" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
