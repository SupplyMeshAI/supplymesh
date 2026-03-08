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

export default async function BuyerSuppliersPage({
  searchParams,
}: BuyerSuppliersPageProps) {
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
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/dashboard/buyer"
          style={{
            color: "var(--brand)",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          ← Back to Buyer Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "bold",
            color: "#111827",
          }}
        >
          Supplier Database
        </h1>
        <p
          style={{
            color: "#6b7280",
            marginTop: "0.5rem",
            fontSize: "0.95rem",
          }}
        >
          Search and filter suppliers by process, material, certifications,
          industry, location, and lead time.
        </p>
      </div>

      <form
        method="GET"
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "0.75rem",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Keyword search"
            style={inputStyle}
          />

          <select
            name="process"
            defaultValue={params.process ?? ""}
            style={inputStyle}
          >
            <option value="">All Processes</option>
            {PROCESS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            name="material"
            defaultValue={params.material ?? ""}
            style={inputStyle}
          >
            <option value="">All Materials</option>
            {MATERIAL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            name="certification"
            defaultValue={params.certification ?? ""}
            style={inputStyle}
          >
            <option value="">All Certifications</option>
            {CERTIFICATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            name="industry"
            defaultValue={params.industry ?? ""}
            style={inputStyle}
          >
            <option value="">All Industries</option>
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            name="state_region"
            defaultValue={params.state_region ?? ""}
            style={inputStyle}
          >
            <option value="">All States / Regions</option>
            {STATE_REGION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="maxLeadTime"
            defaultValue={params.maxLeadTime ?? ""}
            placeholder="Max lead time (days)"
            style={inputStyle}
            min={0}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button type="submit" style={primaryButtonStyle}>
            Search
          </button>

          <Link href="/dashboard/buyer/suppliers" style={secondaryLinkStyle}>
            Reset
          </Link>
        </div>
      </form>

      <div style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.9rem" }}>
        {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"} found
      </div>

      {suppliers.length === 0 ? (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827" }}>
            No suppliers matched your filters
          </h2>
          <p
            style={{
              marginTop: "0.5rem",
              color: "#6b7280",
              fontSize: "0.95rem",
            }}
          >
            Try broadening your search or clearing one of the filters.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1200px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
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
                <TableHeader>View</TableHeader>
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => {
                const profile = supplier.supplier_profiles?.[0];

                return (
                  <tr
                    key={supplier.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      verticalAlign: "top",
                    }}
                  >
                    <TableCell>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {supplier.name}
                      </div>
                      {profile?.tagline ? (
                        <div
                          style={{
                            marginTop: "0.35rem",
                            fontSize: "0.8rem",
                            color: "#6b7280",
                            lineHeight: 1.4,
                          }}
                        >
                          {profile.tagline}
                        </div>
                      ) : null}
                    </TableCell>

                    <TableCell>
                      {formatLocation(supplier.city, supplier.state_region)}
                    </TableCell>

                    <TableCell>
                      <CompactTagList values={profile?.processes} />
                    </TableCell>

                    <TableCell>
                      <CompactTagList values={profile?.materials} />
                    </TableCell>

                    <TableCell>
                      <CompactTagList values={profile?.certifications} />
                    </TableCell>

                    <TableCell>
                      <CompactTagList values={profile?.industries_served} />
                    </TableCell>

                    <TableCell>
                      {profile?.typical_lead_time_days != null
                        ? `${profile.typical_lead_time_days} days`
                        : "—"}
                    </TableCell>

                    <TableCell>{profile?.itar_registered ? "Yes" : "No"}</TableCell>

                    <TableCell>{profile?.profile_status ?? "Unknown"}</TableCell>

                    <TableCell>
                      {supplier.website ? (
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--brand)", textDecoration: "none" }}
                        >
                          Website
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/dashboard/buyer/suppliers/${supplier.id}`}
                        style={{
                          color: "var(--brand)",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        View
                      </Link>
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

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "0.85rem 1rem",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return (
    <td
      style={{
        padding: "0.9rem 1rem",
        fontSize: "0.875rem",
        color: "#374151",
        lineHeight: 1.5,
      }}
    >
      {children}
    </td>
  );
}

function CompactTagList({ values }: { values: string[] | null | undefined }) {
  if (!values || values.length === 0) {
    return <span style={{ color: "#9ca3af" }}>—</span>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
      {values.map((value) => (
        <span
          key={value}
          style={{
            fontSize: "0.72rem",
            padding: "0.2rem 0.45rem",
            borderRadius: "9999px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            whiteSpace: "nowrap",
          }}
        >
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
  return "Location not listed";
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.75rem 0.875rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
  backgroundColor: "white",
};

const primaryButtonStyle: CSSProperties = {
  padding: "0.7rem 1rem",
  borderRadius: "0.5rem",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryLinkStyle: CSSProperties = {
  padding: "0.7rem 1rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  backgroundColor: "white",
  color: "#374151",
  fontWeight: 500,
  textDecoration: "none",
};