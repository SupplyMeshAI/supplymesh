"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Building2, Users, Zap, Award, ChevronRight } from "lucide-react";

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
  { value: "wire_harness", label: "Wire Harness" },
  { value: "surface_finishing", label: "Surface Finishing / Coatings" },
  { value: "heat_treat", label: "Heat Treat (in-house)" },
  { value: "testing", label: "Testing (in-house)" },
  { value: "assembly", label: "Assembly / Integration" },
  { value: "grinding", label: "Grinding" },
  { value: "edm", label: "EDM" },
  { value: "other", label: "Other" },
];

const MATERIALS = [
  "Aluminum", "Stainless Steel", "Carbon Steel", "Titanium",
  "Nickel Alloys (Inconel etc)", "Copper / Brass", "Plastics (ABS/PC/PA/PEEK)",
  "Composites", "Other",
];

const CERTIFICATIONS = ["ISO 9001", "AS9100", "IATF 16949", "ISO 13485", "NADCAP", "Other"];

const PAYMENT_TERMS = [
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "prepay", label: "Prepay" },
];

const INDUSTRIES = [
  "Aerospace", "Medical / Life Sciences", "Automotive", "Defense / Military",
  "Consumer Products", "Industrial Equipment", "Electronics",
  "Energy / Oil & Gas", "Marine", "Construction",
];

const COMPANY_SIZES = ["1-25", "26-100", "101-500", "500+"];
const YEARS_IN_BUSINESS = ["0-2", "3-5", "6-10", "10+"];

type Section = "company" | "contact" | "capabilities" | "quality" | "capacity";

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    padding: "0.375rem 0.75rem",
    borderRadius: "2px",
    fontSize: "0.8125rem",
    fontWeight: 500,
    border: selected ? "1px solid var(--brand)" : "1px solid var(--border2)",
    backgroundColor: selected ? "rgba(37,99,235,0.15)" : "var(--surface2)",
    color: selected ? "var(--brand)" : "var(--text-muted)",
    cursor: "pointer",
  };
}

function blockChipStyle(selected: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "0.625rem",
    borderRadius: "2px",
    fontSize: "0.8125rem",
    fontWeight: 500,
    border: selected ? "1px solid var(--brand)" : "1px solid var(--border2)",
    backgroundColor: selected ? "rgba(37,99,235,0.15)" : "var(--surface2)",
    color: selected ? "var(--brand)" : "var(--text-muted)",
    cursor: "pointer",
    textAlign: "center" as const,
  };
}

export default function SupplierProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("company");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [dbaName, setDbaName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [industriesServed, setIndustriesServed] = useState<string[]>([]);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [processes, setProcesses] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [leadTime, setLeadTime] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [itarStatus, setItarStatus] = useState("no");
  const [workStatus, setWorkStatus] = useState("accepting");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: member } = await supabase
        .from("company_members")
        .select("company_id, company:companies(id, name, website, city, state_region)")
        .eq("profile_id", user.id).single();

      if (!member) { setLoading(false); return; }

      const company = (Array.isArray(member.company) ? member.company[0] : member.company) as
        { id: string; name: string; website: string; city: string; state_region: string } | null;
      setCompanyId(member.company_id);
      if (company) {
        setCompanyName(company.name || "");
        setWebsite(company.website || "");
        setCity(company.city || "");
        setState(company.state_region || "");
      }

      const { data: sp } = await supabase
        .from("supplier_profiles").select("*").eq("company_id", member.company_id).single();

      if (sp) {
        setSupplierId(sp.id);
        setDbaName(sp.dba_name || "");
        setTagline(sp.tagline || "");
        setDescription(sp.description || "");
        setCompanySize(sp.company_size || "");
        setYearsInBusiness(sp.years_in_business || "");
        setVisibility(sp.visibility || "public");
        setIndustriesServed(sp.industries_served || []);
        setContactName(sp.primary_contact_name || "");
        setContactTitle(sp.primary_contact_title || "");
        setContactEmail(sp.primary_contact_email || "");
        setContactPhone(sp.primary_contact_phone || "");
        setProcesses(sp.processes || []);
        setMaterials(sp.materials || []);
        setLeadTime(sp.typical_lead_time_days?.toString() || "");
        setCertifications(sp.certifications || []);
        setItarStatus(sp.itar_status || "no");
        setPaymentTerms(sp.payment_terms || "");
        setWorkStatus(sp.work_status || "accepting");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  function toggle(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    if (companyId) {
      await supabase.from("companies").update({
        name: companyName, website: website || null,
        city: city || null, state_region: state || null,
      }).eq("id", companyId);
    }
    const profileData = {
      company_id: companyId!,
      dba_name: dbaName || null, tagline: tagline || null,
      description: description || null, company_size: companySize || null,
      years_in_business: yearsInBusiness || null, visibility,
      industries_served: industriesServed,
      primary_contact_name: contactName || null, primary_contact_title: contactTitle || null,
      primary_contact_email: contactEmail || null, primary_contact_phone: contactPhone || null,
      processes, materials,
      typical_lead_time_days: leadTime ? parseInt(leadTime) : null,
      certifications, itar_status: itarStatus, work_status: workStatus,
      payment_terms: paymentTerms || null,
    };
    if (supplierId) {
      await supabase.from("supplier_profiles").update(profileData).eq("id", supplierId);
    } else {
      const { data } = await supabase.from("supplier_profiles").insert(profileData).select().single();
      if (data) setSupplierId(data.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px" }}>
      <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--brand)" }} className="animate-spin" />
    </div>
  );

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "company",      label: "Company",      icon: <Building2   style={{ width: "1rem", height: "1rem" }} /> },
    { id: "contact",      label: "Contact",      icon: <Users       style={{ width: "1rem", height: "1rem" }} /> },
    { id: "capabilities", label: "Capabilities", icon: <Zap         style={{ width: "1rem", height: "1rem" }} /> },
    { id: "quality",      label: "Quality",      icon: <Award       style={{ width: "1rem", height: "1rem" }} /> },
    { id: "capacity",     label: "Capacity",     icon: <ChevronRight style={{ width: "1rem", height: "1rem" }} /> },
  ];

  const fieldInput: React.CSSProperties = {
    width: "100%", padding: "8px 10px",
    border: "1px solid var(--border2)", backgroundColor: "var(--surface2)",
    color: "var(--text)", fontSize: "0.875rem", outline: "none",
    boxSizing: "border-box" as const,
  };
  const fieldLabel: React.CSSProperties = {
    display: "block", fontSize: "0.6875rem", fontWeight: 500,
    color: "var(--text-muted)", textTransform: "uppercase" as const,
    letterSpacing: "0.07em", marginBottom: "6px",
    fontFamily: "var(--font-mono)",
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)", marginBottom: "20px",
  };
  const fieldGroup: React.CSSProperties = {
    display: "flex", flexDirection: "column" as const, gap: "16px",
  };

  return (
    <>
      {/* Save bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "7px 20px", fontSize: "0.875rem", fontWeight: 600,
            color: "white", border: "none", cursor: "pointer",
            backgroundColor: saved ? "var(--green)" : "var(--brand)",
            transition: "background-color 0.2s",
          }}
        >
          {saving
            ? <><Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" /> Saving...</>
            : saved
            ? <><Check style={{ width: "14px", height: "14px" }} /> Saved!</>
            : "Save profile"}
        </button>
      </div>

      {/* Sidebar + content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "20px" }}>

        {/* Sidebar */}
        <aside>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "8px",
                  padding: "11px 14px", fontSize: "0.875rem", fontWeight: 500,
                  background: activeSection === s.id ? "rgba(37,99,235,0.1)" : "none",
                  color: activeSection === s.id ? "var(--brand)" : "var(--text-muted)",
                  border: "none",
                  borderLeft: activeSection === s.id ? "2px solid var(--brand)" : "2px solid transparent",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main panel */}
        <main>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "24px" }}>

            {/* ── COMPANY ── */}
            {activeSection === "company" && (
              <div style={fieldGroup}>
                <h2 style={sectionTitle}>Company Information</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={fieldLabel}>Company legal name *</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={fieldInput} placeholder="Acme Manufacturing Co." />
                  </div>
                  <div>
                    <label style={fieldLabel}>DBA / Trade name</label>
                    <input type="text" value={dbaName} onChange={e => setDbaName(e.target.value)} style={fieldInput} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Website</label>
                  <input type="url" value={website} onChange={e => setWebsite(e.target.value)} style={fieldInput} placeholder="https://acme.com" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={fieldLabel}>City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} style={fieldInput} placeholder="Detroit" />
                  </div>
                  <div>
                    <label style={fieldLabel}>State</label>
                    <input type="text" value={state} onChange={e => setState(e.target.value)} style={fieldInput} placeholder="MI" maxLength={2} />
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Tagline</label>
                  <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} style={fieldInput} placeholder="Precision CNC machining for aerospace and medical" maxLength={120} />
                </div>
                <div>
                  <label style={fieldLabel}>About your shop</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    style={{ ...fieldInput, resize: "vertical" }} placeholder="Tell buyers what makes your shop unique..." rows={4} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={fieldLabel}>Company size</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                      {COMPANY_SIZES.map(s => (
                        <button key={s} type="button" onClick={() => setCompanySize(s)} style={chipStyle(companySize === s)}>
                          {s} employees
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={fieldLabel}>Years in business</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                      {YEARS_IN_BUSINESS.map(y => (
                        <button key={y} type="button" onClick={() => setYearsInBusiness(y)} style={chipStyle(yearsInBusiness === y)}>
                          {y} years
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Profile visibility</label>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    {[
                      { value: "public",  label: "Public",  desc: "Anyone can find you" },
                      { value: "private", label: "Private", desc: "Match-only, no browse" },
                      { value: "stealth", label: "Stealth", desc: "Anonymous until NDA" },
                    ].map(v => (
                      <button key={v.value} type="button" onClick={() => setVisibility(v.value)} style={blockChipStyle(visibility === v.value)}>
                        <div style={{ fontWeight: 600 }}>{v.label}</div>
                        <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "2px" }}>{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Industries served</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {INDUSTRIES.map(ind => (
                      <button key={ind} type="button" onClick={() => toggle(industriesServed, setIndustriesServed, ind)} style={chipStyle(industriesServed.includes(ind))}>
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Payment terms</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {PAYMENT_TERMS.map(p => (
                      <button key={p.value} type="button" onClick={() => setPaymentTerms(p.value)} style={chipStyle(paymentTerms === p.value)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── CONTACT ── */}
            {activeSection === "contact" && (
              <div style={fieldGroup}>
                <h2 style={sectionTitle}>Primary Contact</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={fieldLabel}>Full name *</label>
                    <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} style={fieldInput} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label style={fieldLabel}>Title / Role</label>
                    <input type="text" value={contactTitle} onChange={e => setContactTitle(e.target.value)} style={fieldInput} placeholder="VP of Sales" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={fieldLabel}>Email *</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={fieldInput} placeholder="jane@acme.com" />
                  </div>
                  <div>
                    <label style={fieldLabel}>Phone</label>
                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={fieldInput} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </div>
            )}

            {/* ── CAPABILITIES ── */}
            {activeSection === "capabilities" && (
              <div style={fieldGroup}>
                <h2 style={sectionTitle}>Capabilities</h2>
                <div>
                  <label style={fieldLabel}>Manufacturing processes *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "6px" }}>
                    {PROCESSES.map(p => {
                      const selected = processes.includes(p.value);
                      return (
                        <button key={p.value} type="button" onClick={() => toggle(processes, setProcesses, p.value)}
                          style={{
                            display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                            border: selected ? "1px solid var(--brand)" : "1px solid var(--border2)",
                            backgroundColor: selected ? "rgba(37,99,235,0.15)" : "var(--surface2)",
                            color: selected ? "var(--brand)" : "var(--text-muted)",
                            cursor: "pointer", textAlign: "left", fontSize: "0.8125rem",
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
                  <label style={fieldLabel}>Materials</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {MATERIALS.map(m => (
                      <button key={m} type="button" onClick={() => toggle(materials, setMaterials, m)} style={chipStyle(materials.includes(m))}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Typical lead time (days)</label>
                  <input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)}
                    style={{ ...fieldInput, maxWidth: "200px" }} placeholder="14" min={1} />
                </div>
              </div>
            )}

            {/* ── QUALITY ── */}
            {activeSection === "quality" && (
              <div style={fieldGroup}>
                <h2 style={sectionTitle}>Quality & Compliance</h2>
                <div>
                  <label style={fieldLabel}>Certifications</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {CERTIFICATIONS.map(c => (
                      <button key={c} type="button" onClick={() => toggle(certifications, setCertifications, c)} style={chipStyle(certifications.includes(c))}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>ITAR status</label>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    {[
                      { value: "yes",         label: "ITAR registered" },
                      { value: "no",          label: "Not ITAR" },
                      { value: "in_progress", label: "In progress" },
                    ].map(v => (
                      <button key={v.value} type="button" onClick={() => setItarStatus(v.value)} style={chipStyle(itarStatus === v.value)}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── CAPACITY ── */}
            {activeSection === "capacity" && (
              <div style={fieldGroup}>
                <h2 style={sectionTitle}>Capacity & Availability</h2>
                <div>
                  <label style={fieldLabel}>Currently accepting new work?</label>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    {[
                      { value: "accepting",     label: "✅ Yes, accepting" },
                      { value: "limited",       label: "⚠️ Limited capacity" },
                      { value: "not_accepting", label: "❌ Not currently" },
                    ].map(v => (
                      <button key={v.value} type="button" onClick={() => setWorkStatus(v.value)} style={blockChipStyle(workStatus === v.value)}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
