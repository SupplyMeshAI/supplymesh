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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleSignup(selectedRole: UserRole) {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/onboarding?role=${selectedRole}`,
        queryParams: { role: selectedRole },
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
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

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>OR</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            </div>

            {/* Google — role picker appears after click */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Continue with Google as:
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleGoogleSignup("buyer")}
                  disabled={googleLoading}
                  style={{
                    flex: 1, padding: "9px 12px",
                    fontSize: "0.8125rem", fontWeight: 600,
                    color: "var(--text)", backgroundColor: "var(--surface2)",
                    border: "1px solid var(--border2)",
                    cursor: googleLoading ? "not-allowed" : "pointer",
                    opacity: googleLoading ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  {googleLoading ? (
                    <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Buyer
                </button>
                <button
                  type="button"
                  onClick={() => handleGoogleSignup("supplier")}
                  disabled={googleLoading}
                  style={{
                    flex: 1, padding: "9px 12px",
                    fontSize: "0.8125rem", fontWeight: 600,
                    color: "var(--text)", backgroundColor: "var(--surface2)",
                    border: "1px solid var(--border2)",
                    cursor: googleLoading ? "not-allowed" : "pointer",
                    opacity: googleLoading ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  {googleLoading ? (
                    <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Supplier
                </button>
              </div>
            </div>

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