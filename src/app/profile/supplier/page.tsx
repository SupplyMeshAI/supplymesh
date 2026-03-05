"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Building2, Users, Zap, Award, ChevronDown } from "lucide-react";

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

const CERTIFICATIONS = [
  "ISO 9001", "AS9100", "IATF 16949", "ISO 13485", "NADCAP", "Other",
];

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

export default function SupplierProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("company");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Company fields
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

  // Contact fields
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Capability fields
  const [processes, setProcesses] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [leadTime, setLeadTime] = useState("");

  // Quality fields
  const [certifications, setCertifications] = useState<string[]>([]);
  const [itarStatus, setItarStatus] = useState("no");

  // Capacity fields
  const [workStatus, setWorkStatus] = useState("accepting");

  // Load existing data
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: member } = await supabase
        .from("company_members")
        .select("company_id, company:companies(id, name, website, city, state_region)")
        .eq("profile_id", user.id)
        .single();

      if (!member) { setLoading(false); return; }

      const company = (Array.isArray(member.company) ? member.company[0] : member.company) as { id: string; name: string; website: string; city: string; state_region: string } | null;
      setCompanyId(member.company_id);
      if (company) {
        setCompanyName(company.name || "");
        setWebsite(company.website || "");
        setCity(company.city || "");
        setState(company.state_region || "");
      }

      const { data: sp } = await supabase
        .from("supplier_profiles")
        .select("*")
        .eq("company_id", member.company_id)
        .single();

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

    // Update company
    if (companyId) {
      await supabase.from("companies").update({
        name: companyName,
        website: website || null,
        city: city || null,
        state_region: state || null,
      }).eq("id", companyId);
    }

    // Upsert supplier profile
    const profileData = {
      company_id: companyId!,
      dba_name: dbaName || null,
      tagline: tagline || null,
      description: description || null,
      company_size: companySize || null,
      years_in_business: yearsInBusiness || null,
      visibility,
      industries_served: industriesServed,
      primary_contact_name: contactName || null,
      primary_contact_title: contactTitle || null,
      primary_contact_email: contactEmail || null,
      primary_contact_phone: contactPhone || null,
      processes,
      materials,
      typical_lead_time_days: leadTime ? parseInt(leadTime) : null,
      certifications,
      itar_status: itarStatus,
      work_status: workStatus,
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "#0d9488" }} className="animate-spin" />
    </div>
  );

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "company", label: "Company", icon: <Building2 style={{ width: "1rem", height: "1rem" }} /> },
    { id: "contact", label: "Contact", icon: <Users style={{ width: "1rem", height: "1rem" }} /> },
    { id: "capabilities", label: "Capabilities", icon: <Zap style={{ width: "1rem", height: "1rem" }} /> },
    { id: "quality", label: "Quality", icon: <Award style={{ width: "1rem", height: "1rem" }} /> },
    { id: "capacity", label: "Capacity", icon: <ChevronDown style={{ width: "1rem", height: "1rem" }} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>

      {/* Nav */}
      <header style={{
        backgroundColor: "white", borderBottom: "1px solid #e5e7eb",
        padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", backgroundColor: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>S</span>
          </div>
          <span style={{ fontWeight: "bold", color: "#111827" }}>SupplyMesh</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => router.push("/dashboard/supplier")}
            style={{ fontSize: "0.875rem", color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
          >
            ← Dashboard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem",
              fontWeight: 600, color: "white", backgroundColor: saved ? "#059669" : "#0d9488",
              border: "none", cursor: "pointer", transition: "background-color 0.2s",
            }}
          >
            {saving ? <><Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" /> Saving...</>
              : saved ? <><Check style={{ width: "0.875rem", height: "0.875rem" }} /> Saved!</>
              : "Save profile"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem" }}>

        {/* Sidebar nav */}
        <aside>
          <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 500,
                  background: activeSection === s.id ? "#f0fdfa" : "none",
                  color: activeSection === s.id ? "#0d9488" : "#6b7280",
                  border: "none", borderLeft: activeSection === s.id ? "2px solid #0d9488" : "2px solid transparent",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
              >
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main>
          <div style={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb", padding: "1.5rem" }}>

            {/* COMPANY SECTION */}
            {activeSection === "company" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Company Information</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="label">Company legal name *</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input" placeholder="Acme Manufacturing Co." />
                    </div>
                    <div>
                      <label className="label">DBA / Trade name</label>
                      <input type="text" value={dbaName} onChange={e => setDbaName(e.target.value)} className="input" placeholder="Optional" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="input" placeholder="https://acme.com" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="label">City</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="Detroit" />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input type="text" value={state} onChange={e => setState(e.target.value)} className="input" placeholder="MI" maxLength={2} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Tagline</label>
                    <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="input" placeholder="Precision CNC machining for aerospace and medical" maxLength={120} />
                  </div>
                  <div>
                    <label className="label">About your shop</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="input"
                      placeholder="Tell buyers what makes your shop unique..."
                      rows={4}
                      style={{ resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="label">Company size</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                        {COMPANY_SIZES.map(s => (
                          <button key={s} type="button" onClick={() => setCompanySize(s)} style={{
                            padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                            border: companySize === s ? "1px solid #0d9488" : "1px solid #e5e7eb",
                            backgroundColor: companySize === s ? "#f0fdfa" : "white",
                            color: companySize === s ? "#0f766e" : "#4b5563", cursor: "pointer",
                          }}>{s} employees</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Years in business</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                        {YEARS_IN_BUSINESS.map(y => (
                          <button key={y} type="button" onClick={() => setYearsInBusiness(y)} style={{
                            padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                            border: yearsInBusiness === y ? "1px solid #0d9488" : "1px solid #e5e7eb",
                            backgroundColor: yearsInBusiness === y ? "#f0fdfa" : "white",
                            color: yearsInBusiness === y ? "#0f766e" : "#4b5563", cursor: "pointer",
                          }}>{y} years</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Profile visibility</label>
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                      {[
                        { value: "public", label: "Public", desc: "Anyone can find you" },
                        { value: "private", label: "Private", desc: "Match-only, no browse" },
                        { value: "stealth", label: "Stealth", desc: "Anonymous until NDA" },
                      ].map(v => (
                        <button key={v.value} type="button" onClick={() => setVisibility(v.value)} style={{
                          flex: 1, padding: "0.625rem", borderRadius: "0.5rem", fontSize: "0.8rem",
                          border: visibility === v.value ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: visibility === v.value ? "#f0fdfa" : "white",
                          color: visibility === v.value ? "#0f766e" : "#4b5563", cursor: "pointer", textAlign: "center",
                        }}>
                          <div style={{ fontWeight: 600 }}>{v.label}</div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "0.2rem" }}>{v.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Industries served</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {INDUSTRIES.map(ind => (
                        <button key={ind} type="button" onClick={() => toggle(industriesServed, setIndustriesServed, ind)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: industriesServed.includes(ind) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: industriesServed.includes(ind) ? "#f0fdfa" : "white",
                          color: industriesServed.includes(ind) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{ind}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Payment terms</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {PAYMENT_TERMS.map(p => (
                        <button key={p.value} type="button" onClick={() => setPaymentTerms(p.value)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                          border: paymentTerms === p.value ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: paymentTerms === p.value ? "#f0fdfa" : "white",
                          color: paymentTerms === p.value ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{p.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTACT SECTION */}
            {activeSection === "contact" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Primary Contact</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="label">Full name *</label>
                      <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="input" placeholder="Jane Smith" />
                    </div>
                    <div>
                      <label className="label">Title / Role</label>
                      <input type="text" value={contactTitle} onChange={e => setContactTitle(e.target.value)} className="input" placeholder="VP of Sales" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="label">Email *</label>
                      <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input" placeholder="jane@acme.com" />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CAPABILITIES SECTION */}
            {activeSection === "capabilities" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Capabilities</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label className="label">Manufacturing processes *</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {PROCESSES.map(p => {
                        const selected = processes.includes(p.value);
                        return (
                          <button key={p.value} type="button" onClick={() => toggle(processes, setProcesses, p.value)} style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.5rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem",
                            border: selected ? "1px solid #0d9488" : "1px solid #e5e7eb",
                            backgroundColor: selected ? "#f0fdfa" : "white",
                            color: selected ? "#0f766e" : "#4b5563", cursor: "pointer", textAlign: "left",
                          }}>
                            <div style={{
                              width: "1rem", height: "1rem", borderRadius: "0.25rem", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              backgroundColor: selected ? "#0d9488" : "transparent",
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
                    <label className="label">Materials</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {MATERIALS.map(m => (
                        <button key={m} type="button" onClick={() => toggle(materials, setMaterials, m)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: materials.includes(m) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: materials.includes(m) ? "#f0fdfa" : "white",
                          color: materials.includes(m) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Typical lead time (days)</label>
                    <input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)} className="input" placeholder="14" min={1} style={{ maxWidth: "200px" }} />
                  </div>
                </div>
              </div>
            )}

            {/* QUALITY SECTION */}
            {activeSection === "quality" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Quality & Compliance</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label className="label">Certifications</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {CERTIFICATIONS.map(c => (
                        <button key={c} type="button" onClick={() => toggle(certifications, setCertifications, c)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: certifications.includes(c) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: certifications.includes(c) ? "#f0fdfa" : "white",
                          color: certifications.includes(c) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">ITAR status</label>
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                      {[
                        { value: "yes", label: "ITAR registered" },
                        { value: "no", label: "Not ITAR" },
                        { value: "in_progress", label: "In progress" },
                      ].map(v => (
                        <button key={v.value} type="button" onClick={() => setItarStatus(v.value)} style={{
                          padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                          border: itarStatus === v.value ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: itarStatus === v.value ? "#f0fdfa" : "white",
                          color: itarStatus === v.value ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CAPACITY SECTION */}
            {activeSection === "capacity" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Capacity & Availability</h2>
                <div>
                  <label className="label">Currently accepting new work?</label>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                    {[
                      { value: "accepting", label: "✅ Yes, accepting" },
                      { value: "limited", label: "⚠️ Limited capacity" },
                      { value: "not_accepting", label: "❌ Not currently" },
                    ].map(v => (
                      <button key={v.value} type="button" onClick={() => setWorkStatus(v.value)} style={{
                        flex: 1, padding: "0.625rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                        border: workStatus === v.value ? "1px solid #0d9488" : "1px solid #e5e7eb",
                        backgroundColor: workStatus === v.value ? "#f0fdfa" : "white",
                        color: workStatus === v.value ? "#0f766e" : "#4b5563", cursor: "pointer", textAlign: "center",
                      }}>{v.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}