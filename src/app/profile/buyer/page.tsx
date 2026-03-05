"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Building2, Users, ShoppingCart, Award, FileText } from "lucide-react";

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
  { value: "assembly", label: "Assembly / Integration" },
  { value: "other", label: "Other" },
];

const INDUSTRIES = [
  "Aerospace", "Medical / Life Sciences", "Automotive", "Defense / Military",
  "Consumer Products", "Industrial Equipment", "Electronics",
  "Energy / Oil & Gas", "Marine", "Construction",
];

const CERTIFICATIONS = [
  "ISO 9001", "AS9100", "IATF 16949", "ISO 13485", "NADCAP", "ITAR", "Other",
];

const VOLUME_RANGES = [
  { value: "1-10", label: "1–10 units" },
  { value: "10-100", label: "10–100 units" },
  { value: "100-1k", label: "100–1,000 units" },
  { value: "1k-10k", label: "1,000–10,000 units" },
  { value: "10k+", label: "10,000+ units" },
];

const SPEND_RANGES = [
  "Under $100k", "$100k–$500k", "$500k–$2M", "$2M–$10M", "$10M+",
];

const PAYMENT_TERMS = [
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "prepay", label: "Prepay" },
];

const BUYER_TYPES = [
  { value: "oem", label: "OEM" },
  { value: "contract_manufacturer", label: "Contract Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "startup", label: "Startup" },
  { value: "other", label: "Other" },
];

const ENGAGEMENT_TYPES = [
  { value: "npi_only", label: "NPI only" },
  { value: "npi_to_production", label: "NPI → Production" },
  { value: "production_only", label: "Production only" },
  { value: "balanced", label: "Balanced" },
];

const TRACEABILITY = [
  "Material certs", "Lot traceability", "Serial traceability", "FAI/FAIR", "CoC",
];

const DOCUMENTATION = [
  "CoC + certs", "FAIR", "Material certs", "PPAP", "Test reports",
];

type Section = "company" | "contact" | "sourcing" | "requirements" | "commercial";

export default function BuyerProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("company");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buyerProfileId, setBuyerProfileId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [dbaName, setDbaName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [industriesBuyingFor, setIndustriesBuyingFor] = useState<string[]>([]);
  const [annualSpend, setAnnualSpend] = useState("");

  // Contact fields
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [secondaryName, setSecondaryName] = useState("");
  const [secondaryTitle, setSecondaryTitle] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");

  // Sourcing fields
  const [processesSourced, setProcessesSourced] = useState<string[]>([]);
  const [volumeRanges, setVolumeRanges] = useState<string[]>([]);
  const [engagementType, setEngagementType] = useState("");
  const [quoteTurnaround, setQuoteTurnaround] = useState("");
  const [awardTimeline, setAwardTimeline] = useState("");

  // Requirements fields
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [traceability, setTraceability] = useState<string[]>([]);
  const [documentation, setDocumentation] = useState<string[]>([]);
  const [ndaRequired, setNdaRequired] = useState(false);
  const [ppapRequirements, setPpapRequirements] = useState("");

  // Commercial fields
  const [paymentTerms, setPaymentTerms] = useState("");
  const [incoterms, setIncoterms] = useState<string[]>([]);

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

      const { data: bp } = await supabase
        .from("buyer_profiles")
        .select("*")
        .eq("company_id", member.company_id)
        .single();

      if (bp) {
        setBuyerProfileId(bp.id);
        setDbaName(bp.dba_name || "");
        setTagline(bp.tagline || "");
        setDescription(bp.description || "");
        setBuyerType(bp.buyer_type || "");
        setVisibility(bp.visibility || "public");
        setIndustriesBuyingFor(bp.industries_buying_for || []);
        setAnnualSpend(bp.annual_spend_range || "");
        setContactName(bp.primary_contact_name || "");
        setContactTitle(bp.primary_contact_title || "");
        setContactEmail(bp.primary_contact_email || "");
        setContactPhone(bp.primary_contact_phone || "");
        setSecondaryName(bp.secondary_contact_name || "");
        setSecondaryTitle(bp.secondary_contact_title || "");
        setSecondaryEmail(bp.secondary_contact_email || "");
        setProcessesSourced(bp.processes_sourced || []);
        setVolumeRanges(bp.volume_ranges || []);
        setEngagementType(bp.engagement_type || "");
        setQuoteTurnaround(bp.quote_turnaround_days?.toString() || "");
        setAwardTimeline(bp.award_timeline || "");
        setRequiredCerts(bp.required_certifications || []);
        setTraceability(bp.traceability_requirements || []);
        setDocumentation(bp.documentation_requirements || []);
        setNdaRequired(bp.nda_required || false);
        setPpapRequirements(bp.ppap_requirements || "");
        setPaymentTerms(bp.payment_terms || "");
        setIncoterms(bp.incoterms || []);
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
        name: companyName,
        website: website || null,
        city: city || null,
        state_region: state || null,
      }).eq("id", companyId);
    }

    const profileData = {
      company_id: companyId!,
      dba_name: dbaName || null,
      tagline: tagline || null,
      description: description || null,
      buyer_type: buyerType || null,
      visibility,
      industries_buying_for: industriesBuyingFor,
      annual_spend_range: annualSpend || null,
      primary_contact_name: contactName || null,
      primary_contact_title: contactTitle || null,
      primary_contact_email: contactEmail || null,
      primary_contact_phone: contactPhone || null,
      secondary_contact_name: secondaryName || null,
      secondary_contact_title: secondaryTitle || null,
      secondary_contact_email: secondaryEmail || null,
      processes_sourced: processesSourced,
      volume_ranges: volumeRanges,
      engagement_type: engagementType || null,
      quote_turnaround_days: quoteTurnaround ? parseInt(quoteTurnaround) : null,
      award_timeline: awardTimeline || null,
      required_certifications: requiredCerts,
      traceability_requirements: traceability,
      documentation_requirements: documentation,
      nda_required: ndaRequired,
      ppap_requirements: ppapRequirements || null,
      payment_terms: paymentTerms || null,
      incoterms,
    };

    if (buyerProfileId) {
      await supabase.from("buyer_profiles").update(profileData).eq("id", buyerProfileId);
    } else {
      const { data } = await supabase.from("buyer_profiles").insert(profileData).select().single();
      if (data) setBuyerProfileId(data.id);
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
    { id: "contact", label: "Contacts", icon: <Users style={{ width: "1rem", height: "1rem" }} /> },
    { id: "sourcing", label: "Sourcing", icon: <ShoppingCart style={{ width: "1rem", height: "1rem" }} /> },
    { id: "requirements", label: "Requirements", icon: <Award style={{ width: "1rem", height: "1rem" }} /> },
    { id: "commercial", label: "Commercial", icon: <FileText style={{ width: "1rem", height: "1rem" }} /> },
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
            onClick={() => router.push("/dashboard/buyer")}
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

        {/* Sidebar */}
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

            {/* COMPANY */}
            {activeSection === "company" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Company Information</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="label">Company legal name *</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input" placeholder="Acme Robotics Inc." />
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
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="Irvine" />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input type="text" value={state} onChange={e => setState(e.target.value)} className="input" placeholder="CA" maxLength={2} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Tagline</label>
                    <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="input" placeholder="Building next-gen robots. Looking for production-ready suppliers." maxLength={120} />
                  </div>
                  <div>
                    <label className="label">About your company</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="input"
                      placeholder="Tell suppliers who you are, how you work, and what makes you a great customer..."
                      rows={4}
                      style={{ resize: "vertical" }}
                    />
                  </div>
                  <div>
                    <label className="label">Buyer type</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {BUYER_TYPES.map(t => (
                        <button key={t.value} type="button" onClick={() => setBuyerType(t.value)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                          border: buyerType === t.value ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: buyerType === t.value ? "#f0fdfa" : "white",
                          color: buyerType === t.value ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Profile visibility</label>
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                      {[
                        { value: "public", label: "Public", desc: "Suppliers can find you" },
                        { value: "private", label: "Private", desc: "Match-only" },
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
                    <label className="label">Industries you buy for</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {INDUSTRIES.map(ind => (
                        <button key={ind} type="button" onClick={() => toggle(industriesBuyingFor, setIndustriesBuyingFor, ind)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: industriesBuyingFor.includes(ind) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: industriesBuyingFor.includes(ind) ? "#f0fdfa" : "white",
                          color: industriesBuyingFor.includes(ind) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{ind}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Annual manufacturing spend</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {SPEND_RANGES.map(s => (
                        <button key={s} type="button" onClick={() => setAnnualSpend(s)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                          border: annualSpend === s ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: annualSpend === s ? "#f0fdfa" : "white",
                          color: annualSpend === s ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTACTS */}
            {activeSection === "contact" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Contacts</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Primary Contact</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label className="label">Full name</label>
                          <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="input" placeholder="Alex Morgan" />
                        </div>
                        <div>
                          <label className="label">Title</label>
                          <input type="text" value={contactTitle} onChange={e => setContactTitle(e.target.value)} className="input" placeholder="Supply Chain Manager" />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label className="label">Email</label>
                          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input" placeholder="alex@acme.com" />
                        </div>
                        <div>
                          <label className="label">Phone</label>
                          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="input" placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1.25rem" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Secondary Contact (optional)</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label className="label">Full name</label>
                          <input type="text" value={secondaryName} onChange={e => setSecondaryName(e.target.value)} className="input" placeholder="Taylor Chen" />
                        </div>
                        <div>
                          <label className="label">Title</label>
                          <input type="text" value={secondaryTitle} onChange={e => setSecondaryTitle(e.target.value)} className="input" placeholder="Supplier Quality Engineer" />
                        </div>
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input type="email" value={secondaryEmail} onChange={e => setSecondaryEmail(e.target.value)} className="input" placeholder="taylor@acme.com" style={{ maxWidth: "300px" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SOURCING */}
            {activeSection === "sourcing" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Sourcing Profile</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label className="label">Processes you source</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {PROCESSES.map(p => {
                        const selected = processesSourced.includes(p.value);
                        return (
                          <button key={p.value} type="button" onClick={() => toggle(processesSourced, setProcessesSourced, p.value)} style={{
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
                    <label className="label">Typical order volumes</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {VOLUME_RANGES.map(v => (
                        <button key={v.value} type="button" onClick={() => toggle(volumeRanges, setVolumeRanges, v.value)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: volumeRanges.includes(v.value) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: volumeRanges.includes(v.value) ? "#f0fdfa" : "white",
                          color: volumeRanges.includes(v.value) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Preferred engagement type</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {ENGAGEMENT_TYPES.map(e => (
                        <button key={e.value} type="button" onClick={() => setEngagementType(e.value)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                          border: engagementType === e.value ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: engagementType === e.value ? "#f0fdfa" : "white",
                          color: engagementType === e.value ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{e.label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="label">Quote turnaround (business days)</label>
                      <input type="number" value={quoteTurnaround} onChange={e => setQuoteTurnaround(e.target.value)} className="input" placeholder="5" min={1} />
                    </div>
                    <div>
                      <label className="label">Typical award timeline</label>
                      <input type="text" value={awardTimeline} onChange={e => setAwardTimeline(e.target.value)} className="input" placeholder="2–4 weeks" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REQUIREMENTS */}
            {activeSection === "requirements" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Supplier Requirements</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label className="label">Required certifications</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {CERTIFICATIONS.map(c => (
                        <button key={c} type="button" onClick={() => toggle(requiredCerts, setRequiredCerts, c)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: requiredCerts.includes(c) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: requiredCerts.includes(c) ? "#f0fdfa" : "white",
                          color: requiredCerts.includes(c) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Traceability requirements</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {TRACEABILITY.map(t => (
                        <button key={t} type="button" onClick={() => toggle(traceability, setTraceability, t)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: traceability.includes(t) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: traceability.includes(t) ? "#f0fdfa" : "white",
                          color: traceability.includes(t) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Required documentation</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {DOCUMENTATION.map(d => (
                        <button key={d} type="button" onClick={() => toggle(documentation, setDocumentation, d)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500,
                          border: documentation.includes(d) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: documentation.includes(d) ? "#f0fdfa" : "white",
                          color: documentation.includes(d) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">PPAP requirements</label>
                    <input type="text" value={ppapRequirements} onChange={e => setPpapRequirements(e.target.value)} className="input" placeholder="e.g. Level 3 typical for production programs" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setNdaRequired(!ndaRequired)}
                      style={{
                        width: "1.25rem", height: "1.25rem", borderRadius: "0.25rem", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: ndaRequired ? "#0d9488" : "transparent",
                        border: ndaRequired ? "none" : "1px solid #d1d5db", cursor: "pointer",
                      }}
                    >
                      {ndaRequired && <Check style={{ width: "0.875rem", height: "0.875rem", color: "white" }} />}
                    </button>
                    <label className="label" style={{ marginBottom: 0, cursor: "pointer" }} onClick={() => setNdaRequired(!ndaRequired)}>
                      NDA required before sharing drawings
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* COMMERCIAL */}
            {activeSection === "commercial" && (
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "1.25rem" }}>Commercial Terms</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                  <div>
                    <label className="label">Incoterms</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {["EXW", "FOB", "FCA", "DDP", "Other"].map(t => (
                        <button key={t} type="button" onClick={() => toggle(incoterms, setIncoterms, t)} style={{
                          padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 500,
                          border: incoterms.includes(t) ? "1px solid #0d9488" : "1px solid #e5e7eb",
                          backgroundColor: incoterms.includes(t) ? "#f0fdfa" : "white",
                          color: incoterms.includes(t) ? "#0f766e" : "#4b5563", cursor: "pointer",
                        }}>{t}</button>
                      ))}
                    </div>
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