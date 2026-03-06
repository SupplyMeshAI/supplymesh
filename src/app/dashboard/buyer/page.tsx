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
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>
          Welcome back, {firstName} 👋
        </h1>
        <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
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
          { icon: Plus, label: "New RFQ", sub: "Coming in Phase 2" },
          {
            icon: Search,
            label: "Find Suppliers",
            sub: "Search supplier database",
            href: "/dashboard/buyer/suppliers",
          },
          { icon: FileText, label: "My RFQs", sub: "Coming in Phase 2" },
        ].map(({ icon: Icon, label, sub, href }) => {
          const cardStyles: CSSProperties = {
            backgroundColor: "white",
            borderRadius: "0.75rem",
            border: "1px solid #e5e7eb",
            padding: "1.25rem",
            textDecoration: "none",
            display: "block",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            opacity: href ? 1 : 0.6,
            cursor: href ? "pointer" : "default",
          };

          const content = (
            <>
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f0fdfa",
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
                    color: "#0d9488",
                  }}
                />
              </div>

              <div
                style={{
                  fontWeight: 600,
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "0.25rem",
                }}
              >
                {sub}
              </div>
            </>
          );

          return href ? (
            <Link key={label} href={href} style={cardStyles}>
              {content}
            </Link>
          ) : (
            <div key={label} style={cardStyles}>
              {content}
            </div>
          );
        })}
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
          padding: "3rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "9999px",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <Clock style={{ width: "1.5rem", height: "1.5rem", color: "#9ca3af" }} />
        </div>

        <h2 style={{ fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
          Supplier search is now live
        </h2>

        <p
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            maxWidth: "28rem",
            margin: "0 auto",
          }}
        >
          You can now browse the supplier database. Structured sourcing requests
          and supplier shortlists are coming next.
        </p>
      </div>
    </>
  );
}