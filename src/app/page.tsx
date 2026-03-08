"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import {
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  Building2,
  Zap,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="section-grid relative overflow-hidden py-24 md:py-32">
        {/* Subtle hero glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="mt-[-120px] h-[700px] w-[700px] rounded-full bg-white/6 blur-[140px]" />
        </div>

        {/* Faint top vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_35%)]" />

        <div className="container-shell relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-medium text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
              <Zap className="h-4 w-4" />
              Now in early access
            </div>

            <h1 className="mx-auto mb-6 max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              The right work goes to the{" "}
              <span className="text-gradient">right suppliers</span>
            </h1>

            <p className="mx-auto mb-10 max-w-3xl text-lg leading-8 text-white/72 md:text-xl">
              SupplyMesh is the intelligent matching layer for manufacturing
              sourcing. We connect buyers with suppliers based on actual
              capabilities — not who is loudest, closest, or already in the
              spreadsheet.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "gap-2 bg-white text-[#173650] hover:bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.22)] font-semibold",
                })}
              >
                Get early access
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/auth/login"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white",
                })}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/10 py-14 md:py-18">
        <div className="container-shell">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                num: "Up to 80%",
                label:
                  "of supplier quotes go nowhere on traditional channels",
              },
              {
                num: "40–60%",
                label:
                  "reduction in wasted quoting time with matched opportunities",
              },
              {
                num: "70%+",
                label:
                  "of manufacturers expected to adopt AI-enabled sourcing workflows",
              },
            ].map(({ num, label }) => (
              <div
                key={num}
                className="metric-tile rounded-[28px] border border-white/8 bg-[rgba(15,31,46,0.72)] px-8 py-10 text-center backdrop-blur-xl"
              >
                <div className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                  {num}
                </div>
                <div className="mx-auto mt-4 max-w-xs text-sm leading-6 text-white/68 md:text-base">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 md:py-28">
        <div className="container-shell">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/55">
              The Problem
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              Manufacturing sourcing is broken on both sides
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">
                    Buyer Pain
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    title: "Stale supplier Rolodex",
                    desc: "Teams rely on the same 10–20 shops. New supplier discovery takes weeks.",
                  },
                  {
                    title: "RFQ chaos via email",
                    desc: "Inconsistent formats, missing info, endless back-and-forth.",
                  },
                  {
                    title: "Zero cost intelligence",
                    desc: "No visibility into whether prices are competitive.",
                  },
                ].map(({ title, desc }) => (
                  <div key={title}>
                    <h4 className="text-lg font-semibold text-white">{title}</h4>
                    <p className="mt-1 text-white/70">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">
                    Supplier Pain
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    title: "60–80% of quotes go nowhere",
                    desc: "Shops invest hours quoting work they were never going to win.",
                  },
                  {
                    title: "Poor-fit RFQs flood inboxes",
                    desc: "No way to filter by actual capabilities. Wrong process, wrong volume.",
                  },
                  {
                    title: "Invisible without a sales team",
                    desc: "Great suppliers lose to loud marketing. Excellence does not equal visibility.",
                  },
                ].map(({ title, desc }) => (
                  <div key={title}>
                    <h4 className="text-lg font-semibold text-white">{title}</h4>
                    <p className="mt-1 text-white/70">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/8 bg-black/10 py-20 md:py-28">
        <div className="container-shell">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/55">
              How It Works
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              A simple loop that gets smarter with every RFQ
            </h2>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            {[
              {
                num: "01",
                title: "Suppliers build profiles",
                desc: "Structured capability data — processes, materials, certifications, tolerances, and capacity. Not a marketing brochure.",
              },
              {
                num: "02",
                title: "Buyers create sourcing requests",
                desc: "Clean, structured requests with complete specs. No more email chaos or missing information.",
              },
              {
                num: "03",
                title: "The engine matches and ranks",
                desc: "SupplyMesh connects requests with qualified suppliers based on actual capabilities. The right work goes to the right shops.",
              },
            ].map(({ num, title, desc }) => (
              <div
                key={num}
                className="panel flex flex-col gap-5 p-6 md:flex-row md:items-start"
              >
                <div className="min-w-[72px] text-4xl font-extrabold tracking-tight text-white/20">
                  {num}
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold text-white">{title}</h3>
                  <p className="text-white/70">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Both sides win */}
      <section className="py-20 md:py-28">
        <div className="container-shell">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/55">
              Both Sides Win
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              Built for the entire sourcing relationship
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: "For Buyers",
                items: [
                  "Discover qualified suppliers in minutes, not weeks",
                  "Run clean, structured sourcing workflows",
                  "Compare suppliers on actual capabilities",
                  "Reduce wasted time chasing poor-fit options",
                ],
              },
              {
                title: "For Suppliers",
                items: [
                  "Get discovered for what you actually do well",
                  "Receive better-fit opportunities over time",
                  "Compete on fit, not who has the biggest sales team",
                  "Build a profile designed for modern sourcing teams",
                ],
              },
            ].map(({ title, items }) => (
              <Card
                key={title}
                className="border-white/10 bg-white/5 backdrop-blur-md"
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-white">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/85" />
                        <span className="text-white/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container-shell">
          <div className="hero-glow rounded-3xl border border-white/12 bg-white/6 px-6 py-14 text-center backdrop-blur-xl md:px-12">
            <h2 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              Be first in line when we launch
            </h2>
            <p className="mx-auto mb-10 max-w-3xl text-xl text-white/75 md:text-2xl">
              We’re onboarding a small group of buyers and suppliers for the
              initial rollout.
            </p>

            <Link
              href="/auth/signup"
              className={buttonVariants({
                size: "lg",
                className:
                  "gap-2 bg-white text-[#173650] hover:bg-white/90 text-lg font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.22)]",
              })}
            >
              Get early access
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 text-center text-sm text-white/55">
        © 2026 SupplyMesh. All rights reserved.
      </footer>
    </div>
  );
}