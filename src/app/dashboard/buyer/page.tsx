import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus, Search, FileText, Clock, User } from "lucide-react";
import Link from "next/link";

export default async function BuyerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

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

  const company = (Array.isArray(memberData?.company) ? memberData.company[0] : memberData?.company) as { id: string; name: string; city: string; state_region: string } | null;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>

      {/* Nav */}
      <header style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem",
            backgroundColor: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>S</span>
          </div>
          <span style={{ fontWeight: "bold", color: "#111827", letterSpacing: "-0.025em" }}>SupplyMesh</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "#6b7280", textDecoration: "none" }}>
            <User style={{ width: "1rem", height: "1rem" }} />
            Profile
          </Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" style={{
              padding: "0.375rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem",
              fontWeight: 500, color: "#6b7280", background: "none", border: "none", cursor: "pointer",
            }}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: "64rem", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>
            Welcome back, {firstName} 👋
          </h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem", fontSize: "0.875rem" }}>
            {company?.name} · {company?.city}, {company?.state_region}
          </p>
        </div>

        {/* Action cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
          {[
            { icon: Plus, label: "New RFQ", sub: "Coming in Phase 2" },
            { icon: Search, label: "Find Suppliers", sub: "Coming in Phase 3" },
            { icon: FileText, label: "My RFQs", sub: "Coming in Phase 2" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} style={{
              backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb",
              padding: "1.25rem", opacity: 0.6,
            }}>
              <div style={{
                width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                backgroundColor: "#f0fdfa", display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: "0.75rem",
              }}>
                <Icon style={{ width: "1.25rem", height: "1.25rem", color: "#0d9488" }} />
              </div>
              <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{label}</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div style={{
          backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e5e7eb",
          padding: "3rem", textAlign: "center",
        }}>
          <div style={{
            width: "3rem", height: "3rem", borderRadius: "9999px", backgroundColor: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
          }}>
            <Clock style={{ width: "1.5rem", height: "1.5rem", color: "#9ca3af" }} />
          </div>
          <h2 style={{ fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
            RFQ creation is coming soon
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", maxWidth: "24rem", margin: "0 auto" }}>
            We are building the RFQ engine in Phase 2. You will be able to create structured RFQs and get matched with qualified suppliers automatically.
          </p>
        </div>

      </main>
    </div>
  );
}