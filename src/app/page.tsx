import Link from "next/link";
import { ArrowRight, CheckCircle2, ShoppingCart, Building2, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #f3f4f6",
        padding: "0 1.5rem",
        height: "3.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "1.75rem", height: "1.75rem", borderRadius: "0.375rem",
            backgroundColor: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>S</span>
          </div>
          <span style={{ fontWeight: "700", color: "#111827", letterSpacing: "-0.025em" }}>SupplyMesh</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/auth/login" style={{
            padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem",
            fontWeight: 500, color: "#6b7280", textDecoration: "none",
          }}>
            Sign in
          </Link>
          <Link href="/auth/signup" style={{
            padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem",
            fontWeight: 600, color: "white", textDecoration: "none",
            backgroundColor: "#0d9488",
          }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: "5rem 1.5rem 4rem",
        textAlign: "center",
        background: "linear-gradient(to bottom, #f0fdfa, #ffffff)",
      }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            backgroundColor: "#f0fdfa", border: "1px solid #99f6e4",
            borderRadius: "9999px", padding: "0.25rem 0.875rem",
            fontSize: "0.8rem", fontWeight: 500, color: "#0f766e",
            marginBottom: "1.5rem",
          }}>
            <Zap style={{ width: "0.875rem", height: "0.875rem" }} />
            Now in early access
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800, color: "#111827",
            lineHeight: 1.1, letterSpacing: "-0.03em",
            marginBottom: "1.25rem",
          }}>
            The right work goes to<br />
            <span style={{ color: "#0d9488" }}>the right suppliers</span>
          </h1>

          <p style={{
            fontSize: "1.125rem", color: "#6b7280",
            lineHeight: 1.7, marginBottom: "2.5rem",
            maxWidth: "36rem", margin: "0 auto 2.5rem",
          }}>
            SupplyMesh is the intelligent matching layer for manufacturing sourcing.
            We connect buyers with suppliers based on actual capabilities — not who is loudest on Google.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/signup" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem", borderRadius: "0.625rem",
              backgroundColor: "#0d9488", color: "white",
              fontWeight: 600, fontSize: "0.9rem", textDecoration: "none",
            }}>
              Get early access <ArrowRight style={{ width: "1rem", height: "1rem" }} />
            </Link>
            <Link href="/auth/login" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem", borderRadius: "0.625rem",
              border: "1px solid #e5e7eb", backgroundColor: "white",
              color: "#374151", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none",
            }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "3rem 1.5rem", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{
          maxWidth: "48rem", margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem",
          textAlign: "center",
        }}>
          {[
            { num: "$250B+", label: "U.S. contract manufacturing annually" },
            { num: "60–80%", label: "of supplier quotes go nowhere" },
            { num: "15–20%", label: "CAGR for manufacturing procurement software" },
          ].map(({ num, label }) => (
            <div key={num}>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d9488", letterSpacing: "-0.03em" }}>{num}</div>
              <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.25rem", lineHeight: 1.4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              The Problem
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
              Manufacturing sourcing is broken on both sides
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            {/* Buyer pain */}
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "1rem", padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                <div style={{ padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: "#dbeafe" }}>
                  <ShoppingCart style={{ width: "1.125rem", height: "1.125rem", color: "#2563eb" }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#111827" }}>Buyer Pain</h3>
              </div>
              {[
                { title: "Stale supplier Rolodex", desc: "Teams rely on the same 10–20 shops. New supplier discovery takes weeks." },
                { title: "RFQ chaos via email", desc: "Inconsistent formats, missing info, endless back-and-forth." },
                { title: "Zero cost intelligence", desc: "No visibility into whether prices are competitive." },
              ].map(({ title, desc }) => (
                <div key={title} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{title}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "0.2rem", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Supplier pain */}
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "1rem", padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                <div style={{ padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: "#d1fae5" }}>
                  <Building2 style={{ width: "1.125rem", height: "1.125rem", color: "#059669" }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "#111827" }}>Supplier Pain</h3>
              </div>
              {[
                { title: "60–80% of quotes go nowhere", desc: "Shops invest hours quoting work they were never going to win." },
                { title: "Poor-fit RFQs flood inboxes", desc: "No way to filter by actual capabilities. Wrong process, wrong volume." },
                { title: "Invisible without a sales team", desc: "Great suppliers lose to loud marketing. Excellence does not equal visibility." },
              ].map(({ title, desc }) => (
                <div key={title} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{title}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "0.2rem", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "5rem 1.5rem", backgroundColor: "#f9fafb" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              How It Works
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
              A simple loop that gets smarter with every RFQ
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              { num: "01", title: "Suppliers build profiles", desc: "Structured capability data — processes, materials, certifications, tolerances, and capacity. Not a marketing brochure." },
              { num: "02", title: "Buyers create RFQs", desc: "Clean, structured requests with complete specs. No more email chaos or missing information." },
              { num: "03", title: "Engine matches and ranks", desc: "Our matching engine connects RFQs with qualified suppliers based on actual capabilities. The right work goes to the right shops." },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{
                display: "flex", gap: "1.25rem", alignItems: "flex-start",
                backgroundColor: "white", borderRadius: "0.875rem",
                border: "1px solid #e5e7eb", padding: "1.5rem",
              }}>
                <div style={{
                  fontSize: "1.25rem", fontWeight: 800, color: "#d1fae5",
                  minWidth: "2.5rem", lineHeight: 1,
                  WebkitTextStroke: "1px #0d9488",
                }}>
                  {num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#111827", marginBottom: "0.375rem" }}>{title}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Both sides win */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Both Sides Win
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em" }}>
              Built for the entire sourcing relationship
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            {[
              {
                title: "For Buyers",
                items: [
                  "Discover qualified suppliers in minutes, not weeks",
                  "Run clean, structured RFQs with complete info",
                  "Compare quotes side-by-side on equal terms",
                  "Access market-level cost benchmarks",
                ],
              },
              {
                title: "For Suppliers",
                items: [
                  "Only receive RFQs that match your capabilities",
                  "Quote faster with standardized requests",
                  "Compete on fit, not who has the biggest sales team",
                  "Win/loss analytics to improve conversion",
                ],
              },
            ].map(({ title, items }) => (
              <div key={title} style={{ backgroundColor: "#f9fafb", borderRadius: "1rem", padding: "1.75rem" }}>
                <h3 style={{ fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>{title}</h3>
                {items.map((item) => (
                  <div key={item} style={{ display: "flex", gap: "0.625rem", marginBottom: "0.75rem", alignItems: "flex-start" }}>
                    <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "#0d9488", flexShrink: 0, marginTop: "0.125rem" }} />
                    <span style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "5rem 1.5rem",
        background: "linear-gradient(to bottom right, #0d9488, #0f766e)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "36rem", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800,
            color: "white", letterSpacing: "-0.025em", marginBottom: "1rem",
          }}>
            Be first in line when we launch
          </h2>
          <p style={{ color: "#99f6e4", marginBottom: "2rem", lineHeight: 1.6 }}>
            We are onboarding a small group of buyers and suppliers for our initial rollout.
          </p>
          <Link href="/auth/signup" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.875rem 2rem", borderRadius: "0.625rem",
            backgroundColor: "white", color: "#0d9488",
            fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
          }}>
            Get early access <ArrowRight style={{ width: "1rem", height: "1rem" }} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "1.5rem",
        borderTop: "1px solid #f3f4f6",
        textAlign: "center",
        fontSize: "0.8rem",
        color: "#9ca3af",
      }}>
        © 2026 SupplyMesh. All rights reserved.
      </footer>

    </div>
  );
}