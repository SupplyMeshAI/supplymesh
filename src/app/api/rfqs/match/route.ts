// src/app/api/rfqs/match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMatching } from "@/lib/rfqs/matchSuppliers";
import type { Rfq } from "@/lib/rfqs/types";
import type { SupplierCompany } from "@/lib/suppliers/types";

// Statuses that should not be reset to "matching" when re-running
const PROGRESSED_STATUSES = ["matched", "shortlisted", "closed"];

export async function POST(req: NextRequest) {
  try {
    const { rfq_id } = await req.json();

    if (!rfq_id) {
      return NextResponse.json({ error: "rfq_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // ── Auth check ────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Load the RFQ ──────────────────────────────────────────────────────
    const { data: rfq, error: rfqError } = await supabase
      .from("rfqs")
      .select("*")
      .eq("id", rfq_id)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }

    // Verify the requesting user belongs to the RFQ's company
    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("profile_id", user.id)
      .single();

    if (!membership || membership.company_id !== rfq.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Set status to "matching" only if not already further along ────────
    // This prevents wiping "matched" / "shortlisted" state when re-running
    // from the detail page's "Re-run matching" button
    if (!PROGRESSED_STATUSES.includes(rfq.status)) {
      await supabase
        .from("rfqs")
        .update({ status: "matching" })
        .eq("id", rfq_id);
    }

    // ── Load all active suppliers ─────────────────────────────────────────
    const { data: suppliers, error: suppliersError } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        city,
        state_region,
        website,
        supplier_profiles (
          id,
          tagline,
          description,
          processes,
          materials,
          certifications,
          industries_served,
          typical_lead_time_days,
          itar_registered,
          profile_status
        )
      `)
      .eq("type", "supplier");

    if (suppliersError) {
      console.error("Suppliers error:", JSON.stringify(suppliersError));
      return NextResponse.json({
        error: "Failed to load suppliers",
        detail: suppliersError.message,
      }, { status: 500 });
    }

    const activeSuppliers = ((suppliers ?? []) as SupplierCompany[]).filter(
      s => s.supplier_profiles?.[0] != null
    );

    // ── Run matching algorithm ────────────────────────────────────────────
    const matches = runMatching(rfq as Rfq, activeSuppliers);

    if (matches.length === 0) {
      // No matches — still advance to "matched" so polling stops
      await supabase
        .from("rfqs")
        .update({ status: "matched" })
        .eq("id", rfq_id);

      return NextResponse.json({
        matched: 0,
        message: "No suppliers matched this RFQ's requirements",
      });
    }

    // ── Delete previous matches and write new ones ────────────────────────
    await supabase
      .from("rfq_matches")
      .delete()
      .eq("rfq_id", rfq_id);

    const matchRows = matches.map(m => ({
      rfq_id: m.rfq_id,
      supplier_id: m.supplier_id,
      company_id: m.company_id,
      match_score: m.match_score,
      match_details: m.match_reasons,
      matched_required: m.match_reasons.filter(r => r.toLowerCase().includes("required")).length,
      total_required:
        (rfq.processes_required || []).filter((_: string, i: number) => rfq.processes_required_flags?.[i] === "required").length +
        (rfq.certifications_required || []).filter((_: string, i: number) => rfq.certifications_required_flags?.[i] === "required").length,
      matched_preferred: m.match_reasons.filter(r => r.toLowerCase().includes("preferred")).length,
      total_preferred:
        (rfq.processes_required || []).filter((_: string, i: number) => rfq.processes_required_flags?.[i] !== "required").length +
        (rfq.certifications_required || []).filter((_: string, i: number) => rfq.certifications_required_flags?.[i] !== "required").length,
      status: "matched",
    }));

    const { error: insertError } = await supabase
      .from("rfq_matches")
      .insert(matchRows);

    if (insertError) {
      console.error("Insert error:", JSON.stringify(insertError));
      return NextResponse.json({
        error: "Failed to save matches",
        detail: insertError.message,
        code: insertError.code,
      }, { status: 500 });
    }

    // ── Delay before writing "matched" so the UI progress bar has time to run ──
    // Matches are already written above — this just controls when the poll resolves.
    await new Promise(r => setTimeout(r, 15000));

    // ── Always set final status to "matched" — this is what the page polls for
    const { error: updateError } = await supabase
      .from("rfqs")
      .update({ status: "matched" })
      .eq("id", rfq_id);

    if (updateError) {
      console.error("CRITICAL: Failed to update rfq status to matched:", JSON.stringify(updateError));
    }

    return NextResponse.json({
      matched: matches.length,
      top_score: matches[0]?.match_score,
      message: `Matched ${matches.length} suppliers`,
      ...(updateError ? { warning: "Status update failed: " + updateError.message } : {}),
    });

  } catch (err) {
    console.error("Matching error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}