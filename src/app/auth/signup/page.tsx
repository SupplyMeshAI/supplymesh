"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Building2, ShoppingCart } from "lucide-react";

type UserRole = "buyer" | "supplier";

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
      options: {
        data: { role, full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/auth/onboarding?role=${role}`);
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image
              src="/brand/logo-full-dark.svg"
              alt="SupplyMesh"
              width={180}
              height={42}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <p className="mt-3 text-sm text-slate-500">
            {step === 1 ? "How will you use SupplyMesh?" : "Create your account"}
          </p>
        </div>

        {/* Step 1 — Role selection */}
        {step === 1 && (
          <div className="space-y-3">
            <button
              onClick={() => { setRole("buyer"); setStep(2); }}
              className="w-full card p-4 text-left hover:border-[#173650]/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#eef1f5] group-hover:bg-[#e5ebf0] transition-colors">
                  <ShoppingCart className="w-5 h-5 text-[#173650]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">I am a Buyer</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    I source manufactured parts and need qualified suppliers
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setRole("supplier"); setStep(2); }}
              className="w-full card p-4 text-left hover:border-[#173650]/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#eef1f5] group-hover:bg-[#e5ebf0] transition-colors">
                  <Building2 className="w-5 h-5 text-[#173650]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">I am a Supplier</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    I manufacture parts and want to win more RFQs
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step 2 — Account details */}
        {step === 2 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <span className="inline-flex items-center rounded-md bg-[#eef1f5] px-2 py-1 text-xs font-medium text-[#173650] ring-1 ring-inset ring-[#173650]/20">
                {role === "buyer" ? "Buyer account" : "Supplier account"}
              </span>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="label">Work email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Min. 8 characters"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                  : "Create account"
                }
              </button>
            </form>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#173650] font-medium hover:text-[#142f46]">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
