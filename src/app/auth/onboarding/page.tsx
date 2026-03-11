"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check } from "lucide-react";

type UserRole = "buyer" | "supplier";
type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

const PROCESSES = [
  { value: "cnc_milling",              label: "CNC Milling" },
  { value: "cnc_turning",              label: "CNC Turning" },
  { value: "sheet_metal_fabrication",  label: "Sheet Metal Fabrication" },
  { value: "injection_molding",        label: "Injection Molding" },
  { value: "casting",                  label: "Casting" },
  { value: "forging",                  label: "Forging" },
  { value: "additive_3d_printing",     label: "3D Printing / Additive" },
  { value: "welding_fabrication",      label: "Welding / Fabrication" },
  { value: "stamping",                 label: "Stamping" },
  { value: "laser_cutting",            label: "Laser Cutting" },
  { value: "waterjet_cutting",         label: "Waterjet Cutting" },
  { value: "pcb_assembly",             label: "PCB Assembly" },
  { value: "grinding",                 label: "Grinding" },
  { value: "edm",                      label: "EDM" },
  { value: "other",                    label: "Other" },
];

const COMPANY_SIZES: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+"];

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

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "buyer";

  const totalSteps = role === "supplier" ? 3 : 2;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [materials, setMaterials] = useState("");
  const [tagline, setTagline] = useState("");
  const [leadTime, setLeadTime] = useState("");

  function toggleProcess(value: string) {
    setSelectedProcesses(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    try {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName, type: role,
          website: companyWebsite || null, size: companySize || null,
          city: companyCity || null, state_region: companyState || null,
        })
        .select().single();
      if (companyError) throw companyError;

      const { error: memberError } = await supabase
        .from("company_members")
        .insert({ company_id: company.id, profile_id: user.id, is_admin: true });
      if (memberError) throw memberError;

      if (role === "supplier") {
        const materialList = materials.split(",").map(m => m.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean);
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

      await supabase.from("profiles")
        .update({ onboarding: "complete", full_name: user.user_metadata?.full_name })
        .eq("id", user.id);

      router.push(role === "supplier" ? "/dashboard/supplier" : "/dashboard/buyer");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : JSON.stringify(err));
      setLoading(false);
    }
  }

  const stepTitle = () => {
    if (step === 1) return "Tell us about your company";
    if (step === 2 && role === "supplier") return "What can you make?";
    if (step === 2 && role === "buyer") return "You\u2019re all set!";
    return "A few more details";
  };

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>

        {/* Logo + header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-full-white.svg" alt="SupplyMesh" style={{ height: "50px", width: "auto" }} />
          </Link>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "5px" }}>
            {stepTitle()}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Step {step} of {totalSteps}</p>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              height: "3px", flex: 1,
              backgroundColor: i < step ? "var(--brand)" : "var(--border2)",
              transition: "background-color 0.2s",
            }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "28px" }}>

          {/* Step 1 — Company info */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={fieldLabel}>Company name *</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Acme Manufacturing Co." style={fieldInput} />
              </div>
              <div>
                <label style={fieldLabel}>Website</label>
                <input type="url" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)}
                  placeholder="https://acme.com" style={fieldInput} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={fieldLabel}>City</label>
                  <input type="text" value={companyCity} onChange={e => setCompanyCity(e.target.value)}
                    placeholder="Detroit" style={fieldInput} />
                </div>
                <div>
                  <label style={fieldLabel}>State</label>
                  <input type="text" value={companyState} onChange={e => setCompanyState(e.target.value)}
                    placeholder="MI" maxLength={2} style={fieldInput} />
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Company size</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {COMPANY_SIZES.map(size => (
                    <button key={size} type="button" onClick={() => setCompanySize(size)} style={{
                      padding: "5px 12px", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer",
                      border: companySize === size ? "1px solid var(--brand)" : "1px solid var(--border2)",
                      backgroundColor: companySize === size ? "rgba(37,99,235,0.1)" : "var(--surface2)",
                      color: companySize === size ? "var(--brand)" : "var(--text-muted)",
                    }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 (Supplier) — Processes */}
          {step === 2 && role === "supplier" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={fieldLabel}>Processes you offer *</label>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "10px" }}>Select all that apply</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {PROCESSES.map(p => {
                    const selected = selectedProcesses.includes(p.value);
                    return (
                      <button key={p.value} type="button" onClick={() => toggleProcess(p.value)} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "7px 10px", fontSize: "0.8125rem", cursor: "pointer", textAlign: "left",
                        border: selected ? "1px solid var(--brand)" : "1px solid var(--border2)",
                        backgroundColor: selected ? "rgba(37,99,235,0.1)" : "var(--surface2)",
                        color: selected ? "var(--brand)" : "var(--text-muted)",
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
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Materials (comma-separated)</label>
                <input type="text" value={materials} onChange={e => setMaterials(e.target.value)}
                  placeholder="Aluminum 6061, Stainless 304, ABS" style={fieldInput} />
              </div>
            </div>
          )}

          {/* Step 3 (Supplier) — Extra details */}
          {step === 3 && role === "supplier" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={fieldLabel}>Shop tagline</label>
                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                  placeholder="Precision CNC machining for aerospace and medical"
                  maxLength={120} style={fieldInput} />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Max 120 characters</p>
              </div>
              <div>
                <label style={fieldLabel}>Typical lead time (days)</label>
                <input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)}
                  placeholder="14" min={1} style={fieldInput} />
              </div>
            </div>
          )}

          {/* Step 2 (Buyer) — Done */}
          {step === 2 && role === "buyer" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: "48px", height: "48px",
                backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid var(--green)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}>
                <Check style={{ width: "1.5rem", height: "1.5rem", color: "var(--green)" }} />
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                Your account is ready. You can now create RFQs and discover qualified suppliers.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: "16px", padding: "10px 12px", fontSize: "0.875rem",
              backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--red)",
            }}>
              {error}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{
            display: "flex", gap: "10px", marginTop: "24px",
            paddingTop: "16px", borderTop: "1px solid var(--border)",
          }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => (s - 1) as 1 | 2)} style={{
                padding: "8px 16px", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
                backgroundColor: "transparent", color: "var(--text-muted)",
                border: "1px solid var(--border2)",
              }}>
                Back
              </button>
            )}
            {step < totalSteps ? (
              <button type="button" onClick={() => setStep(s => (s + 1) as 2 | 3)}
                disabled={step === 1 && !companyName}
                style={{
                  marginLeft: "auto", padding: "8px 20px", fontSize: "0.875rem", fontWeight: 600,
                  color: "white", backgroundColor: "var(--brand)", border: "none",
                  cursor: step === 1 && !companyName ? "not-allowed" : "pointer",
                  opacity: step === 1 && !companyName ? 0.5 : 1,
                }}>
                Continue
              </button>
            ) : (
              <button type="button" onClick={handleFinish} disabled={loading} style={{
                marginLeft: "auto", padding: "8px 20px", fontSize: "0.875rem", fontWeight: 600,
                color: "white", backgroundColor: "var(--brand)", border: "none",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                {loading
                  ? <><Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" /> Setting up...</>
                  : "Go to dashboard \u2192"
                }
              </button>
            )}
          </div>
        </div>

        <p style={{ marginTop: "16px", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--brand)", fontWeight: 500, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
