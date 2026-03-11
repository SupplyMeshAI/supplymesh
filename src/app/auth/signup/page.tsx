"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Building2, ShoppingCart } from "lucide-react";

type UserRole = "buyer" | "supplier";

const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: "0.6875rem", fontWeight: 500,
  color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.07em", marginBottom: "6px",
  fontFamily: "var(--font-mono)",
};

const fieldInput: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  border: "1px solid var(--border2)", backgroundColor: "var(--surface2)",
  color: "var(--text)", fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box" as const,
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/auth/onboarding?role=${role}`);
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* Logo */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-full-white.svg" alt="SupplyMesh" style={{ height: "50px", width: "auto" }} />
          </Link>
          <p style={{ marginTop: "10px", fontSize: "0.9375rem", color: "var(--text-muted)" }}>
            {step === 1 ? "How will you use SupplyMesh?" : "Create your account"}
          </p>
        </div>

        {/* Step 1 — Role selection */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                r: "buyer" as UserRole,
                icon: <ShoppingCart style={{ width: "1.25rem", height: "1.25rem", color: "#60a5fa" }} />,
                title: "I am a Buyer",
                desc: "I source manufactured parts and need qualified suppliers",
                accentBg: "rgba(37,99,235,0.1)",
                accentBorder: "rgba(37,99,235,0.35)",
              },
              {
                r: "supplier" as UserRole,
                icon: <Building2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--amber)" }} />,
                title: "I am a Supplier",
                desc: "I manufacture parts and want to win more RFQs",
                accentBg: "rgba(245,158,11,0.1)",
                accentBorder: "rgba(245,158,11,0.35)",
              },
            ].map(({ r, icon, title, desc, accentBg, accentBorder }) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setStep(2); }}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
                  padding: "16px 18px", transition: "border-color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = accentBorder}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{
                    padding: "8px", backgroundColor: accentBg,
                    border: `1px solid ${accentBorder}`, flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9375rem" }}>{title}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "3px" }}>{desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Account details */}
        {step === 2 && (
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "28px" }}>

            {/* Role indicator */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border)",
            }}>
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px",
                backgroundColor: role === "buyer" ? "rgba(37,99,235,0.1)" : "rgba(245,158,11,0.1)",
                color: role === "buyer" ? "#60a5fa" : "var(--amber)",
                border: `1px solid ${role === "buyer" ? "rgba(37,99,235,0.3)" : "rgba(245,158,11,0.3)"}`,
                fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.07em",
              }}>
                {role === "buyer" ? "Buyer account" : "Supplier account"}
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={fieldLabel}>Full name</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith" style={fieldInput} />
              </div>
              <div>
                <label style={fieldLabel}>Work email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" style={fieldInput} />
              </div>
              <div>
                <label style={fieldLabel}>Password</label>
                <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" style={fieldInput} />
              </div>

              {error && (
                <div style={{
                  padding: "10px 12px", fontSize: "0.875rem",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "var(--red)",
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "9px 16px",
                  fontSize: "0.875rem", fontWeight: 600,
                  color: "white", backgroundColor: "var(--brand)",
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
              >
                {loading
                  ? <><Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" /> Creating account...</>
                  : "Create account"
                }
              </button>
            </form>
          </div>
        )}

        <p style={{ marginTop: "16px", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--brand)", fontWeight: 500, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
