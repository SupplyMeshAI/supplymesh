import { redirect } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export default async function BuyerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link
            href="/dashboard/buyer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "#0d9488",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                }}
              >
                S
              </span>
            </div>
            <span
              style={{
                fontWeight: "bold",
                color: "#111827",
                letterSpacing: "-0.025em",
              }}
            >
              SupplyMesh
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.875rem",
              color: "#6b7280",
              textDecoration: "none",
            }}
          >
            <User style={{ width: "1rem", height: "1rem" }} />
            Profile
          </Link>

          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#6b7280",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}