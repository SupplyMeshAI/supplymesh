"use client";

import {
  ArrowRight, CheckCircle2, ShoppingCart, Building2,
  Zap, ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--text)" }}>

      {/* Nav */}
      <header style={{
        height: "52px", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", paddingLeft: "32px", paddingRight: "32px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full-white.svg" alt="SupplyMesh" style={{ height: "50px", width: "auto" }} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/auth/login" style={{
            fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none",
            padding: "6px 14px", border: "1px solid var(--border2)",
          }}>
            Sign in
          </Link>
          <Link href="/auth/signup" style={{
            fontSize: "0.875rem", fontWeight: 600, color: "white", textDecoration: "none",
            padding: "6px 14px", backgroundColor: "var(--brand)",
            display: "inline-flex", alignItems: "center", gap: "6px",
          }}>
            Get early access <ArrowRight style={{ width: "14px", height: "14px" }} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        borderBottom: "1px solid var(--border)",
        padding: "96px 32px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(var(--border2) 1px, transparent 1px), linear-gradient(90deg, var(--border2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: "860px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--brand)",
            backgroundColor: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)",
            padding: "4px 12px", marginBottom: "32px",
            fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            <Zap style={{ width: "12px", height: "12px" }} />
            Now in early access
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800,
            lineHeight: 1.0, letterSpacing: "-0.03em",
            color: "var(--text)", marginBottom: "24px",
          }}>
            The right work goes to<br />
            <span style={{ color: "#60a5fa" }}>the right suppliers</span>
          </h1>

          <p style={{
            fontSize: "1.125rem", color: "var(--text-muted)", lineHeight: 1.7,
            maxWidth: "600px", margin: "0 auto 40px",
          }}>
            SupplyMesh is the intelligent matching layer for manufacturing sourcing.
            We connect buyers with suppliers based on actual capabilities — not who
            is loudest, closest, or already in the spreadsheet.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/auth/signup" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 24px", fontSize: "0.9375rem", fontWeight: 700,
              color: "white", backgroundColor: "var(--brand)", textDecoration: "none",
            }}>
              Get early access <ArrowRight style={{ width: "16px", height: "16px" }} />
            </Link>
            <Link href="/auth/login" style={{
              display: "inline-flex", alignItems: "center",
              padding: "11px 24px", fontSize: "0.9375rem", fontWeight: 500,
              color: "var(--text-muted)", textDecoration: "none",
              border: "1px solid var(--border2)", backgroundColor: "var(--surface)",
            }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderBottom: "1px solid var(--border)", padding: "56px 32px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", backgroundColor: "var(--border)" }}>
          {[
            { num: "Up to 80%", label: "of supplier quotes go nowhere on traditional channels" },
            { num: "40–60%",    label: "reduction in wasted quoting time with matched opportunities" },
            { num: "70%+",      label: "of manufacturers expected to adopt AI-enabled sourcing workflows" },
          ].map(({ num, label }) => (
            <div key={num} style={{
              backgroundColor: "var(--surface)", padding: "40px 32px", textAlign: "center",
            }}>
              <div style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800,
                color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "10px",
                fontFamily: "var(--font-mono)",
              }}>
                {num}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "220px", margin: "0 auto" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "80px 32px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px" }}>
            <p style={{
              fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px",
              fontFamily: "var(--font-mono)",
            }}>The Problem</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              Manufacturing sourcing is broken on both sides
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", backgroundColor: "var(--border)" }}>
            {[
              {
                icon: <ShoppingCart style={{ width: "1.25rem", height: "1.25rem", color: "#60a5fa" }} />,
                title: "Buyer Pain",
                accent: "rgba(37,99,235,0.08)",
                accentBorder: "rgba(37,99,235,0.2)",
                iconBg: "rgba(37,99,235,0.12)",
                items: [
                  { title: "Stale supplier Rolodex", desc: "Teams rely on the same 10–20 shops. New supplier discovery takes weeks." },
                  { title: "RFQ chaos via email", desc: "Inconsistent formats, missing info, endless back-and-forth." },
                  { title: "Zero cost intelligence", desc: "No visibility into whether prices are competitive." },
                ],
              },
              {
                icon: <Building2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--amber)" }} />,
                title: "Supplier Pain",
                accent: "rgba(245,158,11,0.06)",
                accentBorder: "rgba(245,158,11,0.2)",
                iconBg: "rgba(245,158,11,0.12)",
                items: [
                  { title: "60–80% of quotes go nowhere", desc: "Shops invest hours quoting work they were never going to win." },
                  { title: "Poor-fit RFQs flood inboxes", desc: "No way to filter by actual capabilities. Wrong process, wrong volume." },
                  { title: "Invisible without a sales team", desc: "Great suppliers lose to loud marketing. Excellence does not equal visibility." },
                ],
              },
            ].map(({ icon, title, accent, accentBorder, iconBg, items }) => (
              <div key={title} style={{ backgroundColor: "var(--surface)", padding: "36px 32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                  <div style={{ padding: "10px", backgroundColor: iconBg, border: `1px solid ${accentBorder}` }}>
                    {icon}
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)" }}>{title}</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {items.map(({ title: t, desc }) => (
                    <div key={t} style={{
                      paddingLeft: "14px", borderLeft: `2px solid ${accentBorder}`,
                    }}>
                      <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "4px", fontSize: "0.9375rem" }}>{t}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 32px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px" }}>
            <p style={{
              fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px",
              fontFamily: "var(--font-mono)",
            }}>How It Works</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              A simple loop that gets smarter with every RFQ
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "var(--border)" }}>
            {[
              { num: "01", title: "Suppliers build profiles", desc: "Structured capability data — processes, materials, certifications, tolerances, and capacity. Not a marketing brochure." },
              { num: "02", title: "Buyers create sourcing requests", desc: "Clean, structured requests with complete specs. No more email chaos or missing information." },
              { num: "03", title: "The engine matches and ranks", desc: "SupplyMesh connects requests with qualified suppliers based on actual capabilities. The right work goes to the right shops." },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{
                display: "flex", gap: "28px", padding: "28px 32px",
                backgroundColor: "var(--bg)", alignItems: "flex-start",
              }}>
                <div style={{
                  fontSize: "2rem", fontWeight: 800, color: "var(--text-subtle)",
                  fontFamily: "var(--font-mono)", minWidth: "56px", lineHeight: 1,
                }}>
                  {num}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>{title}</h3>
                  <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Both sides win */}
      <section style={{ padding: "80px 32px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px" }}>
            <p style={{
              fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px",
              fontFamily: "var(--font-mono)",
            }}>Both Sides Win</p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              Built for the entire sourcing relationship
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", backgroundColor: "var(--border)" }}>
            {[
              {
                title: "For Buyers",
                color: "#60a5fa",
                items: [
                  "Discover qualified suppliers in minutes, not weeks",
                  "Run clean, structured sourcing workflows",
                  "Compare suppliers on actual capabilities",
                  "Reduce wasted time chasing poor-fit options",
                ],
              },
              {
                title: "For Suppliers",
                color: "var(--amber)",
                items: [
                  "Get discovered for what you actually do well",
                  "Receive better-fit opportunities over time",
                  "Compete on fit, not who has the biggest sales team",
                  "Build a profile designed for modern sourcing teams",
                ],
              },
            ].map(({ title, color, items }) => (
              <div key={title} style={{ backgroundColor: "var(--surface)", padding: "36px 32px" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>{title}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <CheckCircle2 style={{ width: "1rem", height: "1rem", color, flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 32px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{
            backgroundColor: "var(--surface)", border: "1px solid var(--border)",
            padding: "64px 48px", textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Subtle brand tint */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "2px",
              backgroundColor: "var(--brand)",
            }} />
            <h2 style={{
              fontSize: "clamp(1.75rem, 3vw, 2.75rem)", fontWeight: 800,
              letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "16px",
            }}>
              Be first in line when we launch
            </h2>
            <p style={{
              fontSize: "1.0625rem", color: "var(--text-muted)", lineHeight: 1.7,
              maxWidth: "480px", margin: "0 auto 36px",
            }}>
              We&apos;re onboarding a small group of buyers and suppliers for the initial rollout.
            </p>
            <Link href="/auth/signup" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 28px", fontSize: "1rem", fontWeight: 700,
              color: "white", backgroundColor: "var(--brand)", textDecoration: "none",
            }}>
              Get early access <ChevronRight style={{ width: "16px", height: "16px" }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "24px 32px", textAlign: "center",
        fontSize: "0.8125rem", color: "var(--text-subtle)",
        fontFamily: "var(--font-mono)",
      }}>
        © 2026 SupplyMesh. All rights reserved.
      </footer>

    </div>
  );
}
