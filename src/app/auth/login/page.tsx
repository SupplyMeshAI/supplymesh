"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Logo */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-full-white.svg"
              alt="SupplyMesh"
              style={{ height: "50px", width: "auto" }}
            />
          </Link>
          <p style={{ marginTop: "10px", fontSize: "0.9375rem", color: "var(--text-muted)" }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "28px",
        }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Email */}
            <div>
              <label style={{
                display: "block", fontSize: "0.6875rem", fontWeight: 500,
                color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: "0.07em", marginBottom: "6px",
                fontFamily: "var(--font-mono)",
              }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: "100%", padding: "8px 10px",
                  border: "1px solid var(--border2)", backgroundColor: "var(--surface2)",
                  color: "var(--text)", fontSize: "0.875rem", outline: "none",
                  boxSizing: "border-box" as const,
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{
                  fontSize: "0.6875rem", fontWeight: 500,
                  color: "var(--text-muted)", textTransform: "uppercase",
                  letterSpacing: "0.07em", fontFamily: "var(--font-mono)",
                }}>
                  Password
                </label>
                <Link href="#" style={{ fontSize: "0.75rem", color: "var(--brand)", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "8px 10px",
                  border: "1px solid var(--border2)", backgroundColor: "var(--surface2)",
                  color: "var(--text)", fontSize: "0.875rem", outline: "none",
                  boxSizing: "border-box" as const,
                }}
              />
            </div>

            {/* Error */}
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

            {/* Submit */}
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
                ? <><Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" /> Signing in...</>
                : "Sign in"
              }
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p style={{ marginTop: "16px", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" style={{ color: "var(--brand)", fontWeight: 500, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}
