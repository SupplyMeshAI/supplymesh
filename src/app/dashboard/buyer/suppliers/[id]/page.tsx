// src/app/dashboard/buyer/suppliers/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, MapPin, Globe, Clock, Shield, CheckCircle2, Building2, Mail, Phone } from "lucide-react";

// ============================================================================
// Types
// ============================================================================
type PageProps = { params: Promise<{ id: string }> };

type SupplierProfile = {
  id: string;
  tagline: string | null;
  description: string | null;
  dba_name: string | null;
  profile_status: string | null;
  is_active: boolean | null;
  visibility: string | null;
  itar_registered: boolean | null;
  itar_status: string | null;
  typical_lead_time_days: number | null;
  min_order_value: number | null;
  max_order_value: number | null;
  moq: number | null;
  company_size: string | null;
  years_in_business: number | null;
  work_status: string | null;
  completeness_score: number | null;
  website: string | null;
  country: string | null;
  primary_contact_name: string | null;
  primary_contact_title: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  secondary_contact_name: string | null;
  secondary_contact_title: string | null;
  secondary_contact_email: string | null;
  processes: unknown;
  materials: unknown;
  certifications: unknown;
  industries_served: unknown;
  industries_excluded: unknown;
  special_processes: unknown;
  special_processes_via_partners: unknown;
  inspection_capabilities: unknown;
  order_qty_ranges: unknown;
  proto_production_focus: string | null;
  complexity_comfort: string | null;
  npi_milestones: unknown;
  ppap_experience: boolean | null;
  traceability: string | null;
  ear_experience: boolean | null;
  incoterms: unknown;
  payment_terms: unknown;
  contract_readiness: string | null;
  references_allowed: boolean | null;
  rush_orders: boolean | null;
};

// ============================================================================
// Helpers
// ============================================================================
function ensureArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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

function StatRow({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem" }}>
      {icon && <span style={{ color: "var(--text-muted)", marginTop: "1px" }}>{icon}</span>}
      <span style={{ color: "var(--text-muted)", minWidth: "100px", flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: 500, color: "var(--text)" }}>{children}</span>
    </div>
  );
}

function TagList({ values, color }: { values: string[]; color?: "brand" | "red" }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
      {values.map(v => (
        <span key={v} style={{
          fontSize: "0.75rem", padding: "3px 8px",
          backgroundColor: color === "brand" ? "rgba(37,99,235,0.1)" : color === "red" ? "rgba(239,68,68,0.1)" : "var(--surface2)",
          color: color === "brand" ? "#60a5fa" : color === "red" ? "var(--red)" : "var(--text-muted)",
          border: `1px solid ${color === "brand" ? "rgba(37,99,235,0.3)" : color === "red" ? "rgba(239,68,68,0.3)" : "var(--border2)"}`,
          fontFamily: "var(--font-mono)", whiteSpace: "nowrap" as const,
        }}>
          {v}
        </span>
      ))}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================
export default async function BuyerSupplierProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select(`
      id, name, website, city, state_region, country,
      supplier_profiles (
        id, tagline, description, dba_name, profile_status, is_active, visibility,
        itar_registered, itar_status, typical_lead_time_days,
        min_order_value, max_order_value, moq, company_size, years_in_business,
        work_status, completeness_score, website, country,
        primary_contact_name, primary_contact_title, primary_contact_email, primary_contact_phone,
        secondary_contact_name, secondary_contact_title, secondary_contact_email,
        processes, materials, certifications, industries_served, industries_excluded,
        special_processes, special_processes_via_partners, inspection_capabilities,
        order_qty_ranges, proto_production_focus, complexity_comfort,
        npi_milestones, ppap_experience, traceability, ear_experience,
        incoterms, payment_terms, contract_readiness, references_allowed, rush_orders
      )
    `)
    .eq("id", id)
    .single();

  if (!company) notFound();

  const profile = (company.supplier_profiles as unknown as SupplierProfile[])?.[0] ?? null;
  const isActive = profile?.is_active ?? false;

  const processes = ensureArray(profile?.processes);
  const materials = ensureArray(profile?.materials);
  const certifications = ensureArray(profile?.certifications);
  const industriesServed = ensureArray(profile?.industries_served);
  const industriesExcluded = ensureArray(profile?.industries_excluded);
  const specialProcesses = ensureArray(profile?.special_processes);
  const specialProcessesViaPartners = ensureArray(profile?.special_processes_via_partners);
  const inspectionCapabilities = ensureArray(profile?.inspection_capabilities);
  const orderQtyRanges = ensureArray(profile?.order_qty_ranges);
  const npiMilestones = ensureArray(profile?.npi_milestones);
  const incoterms = ensureArray(profile?.incoterms);
  const paymentTerms = ensureArray(profile?.payment_terms);

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>

      {/* Back */}
      <Link href="/dashboard/buyer/suppliers" style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", marginBottom: "20px",
      }}>
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Back to Supplier Database
      </Link>

      {/* Header card */}
      <div style={{
        backgroundColor: "var(--surface)", border: "1px solid var(--border)",
        padding: "24px 28px", marginBottom: "16px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{company.name}</h1>
            {profile?.dba_name && (
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>dba {profile.dba_name}</span>
            )}
          </div>
          {profile?.tagline && (
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginBottom: "14px" }}>{profile.tagline}</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {(company.city || company.state_region) && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <MapPin style={{ width: "0.875rem", height: "0.875rem" }} />
                {[company.city, company.state_region, company.country].filter(Boolean).join(", ")}
              </span>
            )}
            {(profile?.website || company.website) && (
              <a href={profile?.website ?? company.website!} target="_blank" rel="noreferrer" style={{
                display: "flex", alignItems: "center", gap: "5px", color: "var(--brand)", textDecoration: "none",
              }}>
                <Globe style={{ width: "0.875rem", height: "0.875rem" }} />
                {(profile?.website ?? company.website!).replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile?.typical_lead_time_days != null && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Clock style={{ width: "0.875rem", height: "0.875rem" }} />
                {profile.typical_lead_time_days}d lead time
              </span>
            )}
            {profile?.itar_registered && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--amber)" }}>
                <Shield style={{ width: "0.875rem", height: "0.875rem" }} /> ITAR Registered
              </span>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <span style={{
            fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px",
            backgroundColor: isActive ? "rgba(34,197,94,0.1)" : "var(--surface2)",
            color: isActive ? "var(--green)" : "var(--text-muted)",
            border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "var(--border2)"}`,
            fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.07em",
          }}>
            {isActive ? "Active" : "Inactive"}
          </span>
          {profile?.work_status && (
            <span style={{
              fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px",
              backgroundColor: "rgba(37,99,235,0.1)", color: "#60a5fa",
              border: "1px solid rgba(37,99,235,0.3)",
              fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.07em",
            }}>
              {profile.work_status}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {profile?.description && (
            <Section title="About">
              <p style={{ fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.7 }}>{profile.description}</p>
            </Section>
          )}

          {processes.length > 0 && (
            <Section title="Processes">
              <TagList values={processes} color="brand" />
            </Section>
          )}

          {specialProcesses.length > 0 && (
            <Section title="Special Processes">
              <TagList values={specialProcesses} />
            </Section>
          )}

          {specialProcessesViaPartners.length > 0 && (
            <Section title="Via Partners">
              <TagList values={specialProcessesViaPartners} />
            </Section>
          )}

          {materials.length > 0 && (
            <Section title="Materials">
              <TagList values={materials} />
            </Section>
          )}

          {inspectionCapabilities.length > 0 && (
            <Section title="Inspection Capabilities">
              <TagList values={inspectionCapabilities} />
            </Section>
          )}

          {industriesServed.length > 0 && (
            <Section title="Industries Served">
              <TagList values={industriesServed} />
            </Section>
          )}

          {industriesExcluded.length > 0 && (
            <Section title="Industries Excluded">
              <TagList values={industriesExcluded} color="red" />
            </Section>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <Section title="Company Details">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <StatRow icon={<Building2 style={{ width: "0.875rem", height: "0.875rem" }} />} label="Company">{company.name}</StatRow>
              {profile?.years_in_business && <StatRow label="In Business">{profile.years_in_business} years</StatRow>}
              {profile?.company_size && <StatRow label="Size">{profile.company_size}</StatRow>}
              {profile?.typical_lead_time_days != null && <StatRow label="Lead Time">{profile.typical_lead_time_days} days</StatRow>}
              {profile?.moq != null && <StatRow label="MOQ">{profile.moq} units</StatRow>}
              {(profile?.min_order_value != null || profile?.max_order_value != null) && (
                <StatRow label="Order Range">
                  {profile.min_order_value != null && profile.max_order_value != null
                    ? `$${profile.min_order_value.toLocaleString()} – $${profile.max_order_value.toLocaleString()}`
                    : profile.min_order_value != null
                    ? `From $${profile.min_order_value.toLocaleString()}`
                    : `Up to $${profile.max_order_value!.toLocaleString()}`}
                </StatRow>
              )}
              {profile?.proto_production_focus && <StatRow label="Focus">{profile.proto_production_focus}</StatRow>}
              {profile?.complexity_comfort && <StatRow label="Complexity">{profile.complexity_comfort}</StatRow>}
              {profile?.itar_status && <StatRow label="ITAR">{profile.itar_status}</StatRow>}
              {profile?.rush_orders != null && <StatRow label="Rush Orders">{profile.rush_orders ? "Available" : "Not available"}</StatRow>}
              {profile?.references_allowed != null && <StatRow label="References">{profile.references_allowed ? "Available on request" : "Not available"}</StatRow>}
              {profile?.ppap_experience != null && <StatRow label="PPAP">{profile.ppap_experience ? "Experienced" : "No experience"}</StatRow>}
              {profile?.ear_experience != null && <StatRow label="EAR">{profile.ear_experience ? "Experienced" : "No experience"}</StatRow>}
              {profile?.traceability && <StatRow label="Traceability">{profile.traceability}</StatRow>}
              {profile?.contract_readiness && <StatRow label="Contract">{profile.contract_readiness}</StatRow>}
            </div>
          </Section>

          {certifications.length > 0 && (
            <Section title="Certifications">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {certifications.map((c: string) => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "var(--text)" }}>
                    <CheckCircle2 style={{ width: "0.875rem", height: "0.875rem", color: "var(--green)", flexShrink: 0 }} />
                    {c}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(orderQtyRanges.length > 0 || incoterms.length > 0 || paymentTerms.length > 0) && (
            <Section title="Commercial Terms">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {orderQtyRanges.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "5px", fontFamily: "var(--font-mono)" }}>Order Quantities</p>
                    <TagList values={orderQtyRanges} />
                  </div>
                )}
                {incoterms.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "5px", fontFamily: "var(--font-mono)" }}>Incoterms</p>
                    <TagList values={incoterms} />
                  </div>
                )}
                {paymentTerms.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "5px", fontFamily: "var(--font-mono)" }}>Payment Terms</p>
                    <TagList values={paymentTerms} />
                  </div>
                )}
              </div>
            </Section>
          )}

          {npiMilestones.length > 0 && (
            <Section title="NPI Milestones">
              <TagList values={npiMilestones} />
            </Section>
          )}

          {profile?.primary_contact_name && (
            <Section title="Primary Contact">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                  {profile.primary_contact_name}
                  {profile.primary_contact_title && (
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "6px" }}>{profile.primary_contact_title}</span>
                  )}
                </p>
                {profile.primary_contact_email && (
                  <a href={`mailto:${profile.primary_contact_email}`} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--brand)", textDecoration: "none" }}>
                    <Mail style={{ width: "0.875rem", height: "0.875rem" }} />{profile.primary_contact_email}
                  </a>
                )}
                {profile.primary_contact_phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    <Phone style={{ width: "0.875rem", height: "0.875rem" }} />{profile.primary_contact_phone}
                  </span>
                )}
              </div>
            </Section>
          )}

          {profile?.secondary_contact_name && (
            <Section title="Secondary Contact">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                  {profile.secondary_contact_name}
                  {profile.secondary_contact_title && (
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "6px" }}>{profile.secondary_contact_title}</span>
                  )}
                </p>
                {profile.secondary_contact_email && (
                  <a href={`mailto:${profile.secondary_contact_email}`} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--brand)", textDecoration: "none" }}>
                    <Mail style={{ width: "0.875rem", height: "0.875rem" }} />{profile.secondary_contact_email}
                  </a>
                )}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}