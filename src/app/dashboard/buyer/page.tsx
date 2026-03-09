import { createClient } from "@/lib/supabase/server";
import { Plus, Search, FileText, Clock } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

export default async function BuyerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: memberData } = await supabase
    .from("company_members")
    .select("company:companies(id, name, city, state_region)")
    .eq("profile_id", user.id)
    .single();

  const company = (
    Array.isArray(memberData?.company)
      ? memberData.company[0]
      : memberData?.company
  ) as {
    id: string;
    name: string;
    city: string;
    state_region: string;
  } | null;

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a" }}>
          Welcome back, {firstName}
        </h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.875rem" }}>
          {company?.name} · {company?.city}, {company?.state_region}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {[
          {
            icon: Plus,
            label: "New RFQ",
            sub: "Submit a sourcing request",
            href: "/dashboard/buyer/rfqs/new",
          },
          {
            icon: Search,
            label: "Find Suppliers",
            sub: "Search supplier database",
            href: "/dashboard/buyer/suppliers",
          },
          {
            icon: FileText,
            label: "My RFQs",
            sub: "View and manage your RFQs",
            href: "/dashboard/buyer/rfqs",
          },
        ].map(({ icon: Icon, label, sub, href }) => {
          const cardStyles: CSSProperties = {
            backgroundColor: "white",
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            padding: "1.25rem",
            textDecoration: "none",
            display: "block",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            cursor: "pointer",
          };

          const content = (
            <>
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "var(--brand-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <Icon
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    color: "var(--brand)",
                  }}
                />
              </div>

              <div
                style={{
                  fontWeight: 600,
                  color: "#0f172a",
                  fontSize: "0.875rem",
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  marginTop: "0.25rem",
                }}
              >
                {sub}
              </div>
            </>
          );

          return (
            <Link key={label} href={href} style={cardStyles}>
              {content}
            </Link>
          );
        })}
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
          padding: "3rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "9999px",
            backgroundColor: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <Clock style={{ width: "1.5rem", height: "1.5rem", color: "#94a3b8" }} />
        </div>

        <h2 style={{ fontWeight: 600, color: "#0f172a", marginBottom: "0.5rem" }}>
          Supplier matching coming soon
        </h2>

        <p
          style={{
            fontSize: "0.875rem",
            color: "#64748b",
            maxWidth: "28rem",
            margin: "0 auto",
          }}
        >
          Submit an RFQ and we&apos;ll automatically match you with qualified suppliers
          based on processes, certifications, and location.
        </p>
      </div>
    </>
  );
}