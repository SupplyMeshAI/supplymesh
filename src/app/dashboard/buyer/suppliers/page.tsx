// src/app/dashboard/buyer/suppliers/page.tsx
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { searchSuppliers } from "@/lib/suppliers/searchSuppliers";
import {
  PROCESS_OPTIONS,
  MATERIAL_OPTIONS,
  CERTIFICATION_OPTIONS,
  INDUSTRY_OPTIONS,
  STATE_REGION_OPTIONS,
} from "@/lib/suppliers/filterOptions";

type BuyerSuppliersPageProps = {
  searchParams?: Promise<{
    q?: string;
    process?: string;
    certification?: string;
    material?: string;
    industry?: string;
    state_region?: string;
    maxLeadTime?: string;
  }>;
};

export default async function BuyerSuppliersPage({ searchParams }: BuyerSuppliersPageProps) {
  const params = (await searchParams) ?? {};

  const suppliers = await searchSuppliers({
    q: params.q,
    process: params.process,
    certification: params.certification,
    material: params.material,
    industry: params.industry,
    state_region: params.state_region,
    maxLeadTime: params.maxLeadTime,
  });

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <Link href="/dashboard/buyer" style={{ color: "var(--brand)", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 500 }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", marginTop: "12px" }}>
          Supplier Database
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "5px", fontSize: "0.9375rem" }}>
          Search and filter suppliers by process, material, certifications, industry, location, and lead time.
        </p>
      </div>

      {/* Filters */}
      <form method="GET" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "18px 20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "12px" }}>
          <input type="text" name="q" defaultValue={params.q ?? ""} placeholder="Keyword search" style={inputStyle} />
          <select name="process" defaultValue={params.process ?? ""} style={inputStyle}>
            <option value="">All Processes</option>
            {PROCESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select name="material" defaultValue={params.material ?? ""} style={inputStyle}>
            <option value="">All Materials</option>
            {MATERIAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select name="certification" defaultValue={params.certification ?? ""} style={inputStyle}>
            <option value="">All Certifications</option>
            {CERTIFICATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select name="industry" defaultValue={params.industry ?? ""} style={inputStyle}>
            <option value="">All Industries</option>
            {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select name="state_region" defaultValue={params.state_region ?? ""} style={inputStyle}>
            <option value="">All States / Regions</option>
            {STATE_REGION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" name="maxLeadTime" defaultValue={params.maxLeadTime ?? ""} placeholder="Max lead time (days)" style={inputStyle} min={0} />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button type="submit" style={primaryButtonStyle}>Search</button>
          <Link href="/dashboard/buyer/suppliers" style={secondaryLinkStyle}>Reset</Link>
        </div>
      </form>

      {/* Result count */}
      <div style={{ marginBottom: "12px", color: "var(--text-muted)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>
        {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"} found
      </div>

      {/* Results */}
      {suppliers.length === 0 ? (
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "40px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
            No suppliers matched your filters
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Try broadening your search or clearing one of the filters.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                <TableHeader>Supplier</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader>Processes</TableHeader>
                <TableHeader>Materials</TableHeader>
                <TableHeader>Certifications</TableHeader>
                <TableHeader>Industries</TableHeader>
                <TableHeader>Lead Time</TableHeader>
                <TableHeader>ITAR</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Website</TableHeader>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => {
                const profile = supplier.supplier_profiles?.[0];
                return (
                  <tr key={supplier.id} style={{ borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                    <TableCell>
                      <Link href={`/dashboard/buyer/suppliers/${supplier.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ fontWeight: 600, color: "var(--brand)", fontSize: "0.9375rem" }}>
                          {supplier.name}
                        </div>
                        {profile?.tagline && (
                          <div style={{ marginTop: "4px", fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                            {profile.tagline}
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>{formatLocation(supplier.city, supplier.state_region)}</TableCell>
                    <TableCell><CompactTagList values={profile?.processes} /></TableCell>
                    <TableCell><CompactTagList values={profile?.materials} /></TableCell>
                    <TableCell><CompactTagList values={profile?.certifications} /></TableCell>
                    <TableCell><CompactTagList values={profile?.industries_served} /></TableCell>
                    <TableCell>
                      {profile?.typical_lead_time_days != null ? `${profile.typical_lead_time_days}d` : "—"}
                    </TableCell>
                    <TableCell>{profile?.itar_registered ? "Yes" : "No"}</TableCell>
                    <TableCell>{profile?.profile_status ?? "—"}</TableCell>
                    <TableCell>
                      {supplier.website ? (
                        <a href={supplier.website} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", textDecoration: "none", fontSize: "0.875rem" }}>
                          Visit →
                        </a>
                      ) : "—"}
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th style={{
      textAlign: "left", padding: "10px 16px",
      fontSize: "0.6875rem", fontWeight: 500, color: "var(--text-muted)",
      textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
      fontFamily: "var(--font-mono)",
    }}>
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return (
    <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
      {children}
    </td>
  );
}

function CompactTagList({ values }: { values: string[] | null | undefined }) {
  if (!values || values.length === 0) return <span style={{ color: "var(--text-subtle)" }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {values.map(value => (
        <span key={value} style={{
          fontSize: "0.75rem", padding: "2px 7px",
          backgroundColor: "var(--surface2)", color: "var(--text-muted)",
          border: "1px solid var(--border2)", whiteSpace: "nowrap",
          fontFamily: "var(--font-mono)",
        }}>
          {value}
        </span>
      ))}
    </div>
  );
}

function formatLocation(city: string | null, stateRegion: string | null) {
  if (city && stateRegion) return `${city}, ${stateRegion}`;
  if (city) return city;
  if (stateRegion) return stateRegion;
  return "—";
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--border2)",
  fontSize: "0.875rem",
  backgroundColor: "var(--surface2)",
  color: "var(--text)",
  outline: "none",
};

const primaryButtonStyle: CSSProperties = {
  padding: "8px 16px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.875rem",
};

const secondaryLinkStyle: CSSProperties = {
  padding: "8px 16px",
  border: "1px solid var(--border2)",
  backgroundColor: "transparent",
  color: "var(--text-muted)",
  fontWeight: 500,
  textDecoration: "none",
  fontSize: "0.875rem",
};
