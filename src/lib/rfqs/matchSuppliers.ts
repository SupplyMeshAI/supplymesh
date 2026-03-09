// src/lib/rfqs/matchSuppliers.ts
import type { Rfq } from "./types";
import type { SupplierCompany } from "@/lib/suppliers/types";

// ============================================================================
// Scoring constants
// ============================================================================
const SCORE = {
  PROCESS_REQUIRED: 25,   // per process — hard fail if missing
  PROCESS_PREFERRED: 12,  // per process — soft bonus
  CERT_REQUIRED: 20,      // per cert — hard fail if missing
  CERT_PREFERRED: 8,      // per cert — soft bonus
  REGION_MATCH: 10,       // any preferred region overlaps supplier state
  INDUSTRY_MATCH: 5,      // supplier serves the RFQ industry
} as const;

// ============================================================================
// Result type
// ============================================================================
export type MatchResult = {
  supplier_id: string;        // supplier_profiles.id (FK in rfq_matches.supplier_id)
  company_id: string;         // rfq.company_id (buyer)
  rfq_id: string;
  match_score: number;        // 0–100 normalised
  match_reasons: string[];    // human-readable explanation bullets (stored as match_details in DB)
  disqualified: boolean;      // hard-fail — do NOT write to rfq_matches
  disqualify_reasons: string[];
};

// ============================================================================
// Region helpers
// Maps RFQ preferred_regions strings to US state abbreviations / substrings
// ============================================================================
const REGION_STATES: Record<string, string[]> = {
  "Northeast": ["ME","NH","VT","MA","RI","CT","NY","NJ","PA"],
  "Southeast": ["MD","DE","DC","VA","WV","NC","SC","GA","FL","AL","MS","TN","KY","AR"],
  "Midwest":   ["OH","MI","IN","IL","WI","MN","IA","MO","ND","SD","NE","KS"],
  "Southwest": ["TX","OK","NM","AZ"],
  "West Coast":["CA","OR","WA","NV","ID"],
};

// ============================================================================
// Normalize process/cert values for comparison
// Handles snake_case RFQ values vs "Human Readable" supplier profile values
// e.g. "cnc_milling" matches "CNC Milling"
// ============================================================================
function normalize(str: string): string {
  return str.toLowerCase().replace(/_/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

function valuesMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function supplierInRegion(supplierState: string | null, preferredRegions: string[]): boolean {
  if (!supplierState || preferredRegions.length === 0) return false;
  if (preferredRegions.includes("No preference")) return true;

  const state = supplierState.trim().toUpperCase();
  return preferredRegions.some(region => {
    const states = REGION_STATES[region] || [];
    return states.includes(state) || state.toLowerCase().includes(region.toLowerCase());
  });
}

// ============================================================================
// Main scorer
// ============================================================================
export function scoreSupplier(rfq: Rfq, supplier: SupplierCompany): MatchResult {
  const profile = supplier.supplier_profiles?.[0];
  const reasons: string[] = [];
  const disqualifyReasons: string[] = [];
  let rawScore = 0;
  let maxPossible = 0;

  // ── ITAR hard check ───────────────────────────────────────────────────────
  if (rfq.itar_required && !profile?.itar_registered) {
    disqualifyReasons.push("ITAR registration required but supplier is not ITAR registered");
  }

  // ── Processes ─────────────────────────────────────────────────────────────
  const requiredProcesses = (rfq.processes_required || []).filter(
    (_, i) => rfq.processes_required_flags?.[i] === "required"
  );
  const preferredProcesses = (rfq.processes_required || []).filter(
    (_, i) => rfq.processes_required_flags?.[i] !== "required"
  );

  const supplierProcesses = profile?.processes || [];

  for (const proc of requiredProcesses) {
    maxPossible += SCORE.PROCESS_REQUIRED;
    const match = supplierProcesses.some(sp => valuesMatch(proc, sp));
    if (match) {
      rawScore += SCORE.PROCESS_REQUIRED;
      reasons.push(`Offers required process: ${normalize(proc).replace(/\b\w/g, c => c.toUpperCase())}`);
    } else {
      disqualifyReasons.push(`Missing required process: ${normalize(proc).replace(/\b\w/g, c => c.toUpperCase())}`);
    }
  }

  for (const proc of preferredProcesses) {
    maxPossible += SCORE.PROCESS_PREFERRED;
    const match = supplierProcesses.some(sp => valuesMatch(proc, sp));
    if (match) {
      rawScore += SCORE.PROCESS_PREFERRED;
      reasons.push(`Offers preferred process: ${normalize(proc).replace(/\b\w/g, c => c.toUpperCase())}`);
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────
  const requiredCerts = (rfq.certifications_required || []).filter(
    (_, i) => rfq.certifications_required_flags?.[i] === "required"
  );
  const preferredCerts = (rfq.certifications_required || []).filter(
    (_, i) => rfq.certifications_required_flags?.[i] !== "required"
  );

  const supplierCerts = profile?.certifications || [];

  for (const cert of requiredCerts) {
    maxPossible += SCORE.CERT_REQUIRED;
    const match = supplierCerts.some(sc => valuesMatch(cert, sc));
    if (match) {
      rawScore += SCORE.CERT_REQUIRED;
      reasons.push(`Holds required certification: ${cert.toUpperCase()}`);
    } else {
      disqualifyReasons.push(`Missing required certification: ${cert.toUpperCase()}`);
    }
  }

  for (const cert of preferredCerts) {
    maxPossible += SCORE.CERT_PREFERRED;
    const match = supplierCerts.some(sc => valuesMatch(cert, sc));
    if (match) {
      rawScore += SCORE.CERT_PREFERRED;
      reasons.push(`Holds preferred certification: ${cert.toUpperCase()}`);
    }
  }

  // ── Region ────────────────────────────────────────────────────────────────
  if (rfq.preferred_regions?.length > 0 && !rfq.preferred_regions.includes("No preference")) {
    maxPossible += SCORE.REGION_MATCH;
    if (supplierInRegion(supplier.state_region, rfq.preferred_regions)) {
      rawScore += SCORE.REGION_MATCH;
      reasons.push(`Located in preferred region: ${supplier.state_region}`);
    }
  }

  // ── Industry ──────────────────────────────────────────────────────────────
  if (rfq.industry) {
    maxPossible += SCORE.INDUSTRY_MATCH;
    const serves = (profile?.industries_served || []).some(ind =>
      ind.toLowerCase().includes(rfq.industry!.toLowerCase()) ||
      rfq.industry!.toLowerCase().includes(ind.toLowerCase())
    );
    if (serves) {
      rawScore += SCORE.INDUSTRY_MATCH;
      reasons.push(`Serves ${rfq.industry} industry`);
    }
  }

  // ── Normalise to 0–100 ────────────────────────────────────────────────────
  const normalised = maxPossible > 0
    ? Math.round((rawScore / maxPossible) * 100)
    : 0;

  // rfq_matches.supplier_id FK points to supplier_profiles, not companies
  // supplier_profiles don't expose their id in SupplierCompany type — we need to add it
  const supplierProfileId = (supplier.supplier_profiles?.[0] as { id?: string } | undefined)?.id ?? supplier.id;

  return {
    supplier_id: supplierProfileId,
    company_id: rfq.company_id,
    rfq_id: rfq.id,
    match_score: normalised,
    match_reasons: reasons.length > 0 ? reasons : ["General capability match"],
    disqualified: disqualifyReasons.length > 0,
    disqualify_reasons: disqualifyReasons,
  };
}

// ============================================================================
// Run matching across all suppliers and return ranked results
// ============================================================================
export function runMatching(rfq: Rfq, suppliers: SupplierCompany[]): MatchResult[] {
  return suppliers
    .map(supplier => scoreSupplier(rfq, supplier))
    .filter(result => !result.disqualified)        // drop hard fails
    .filter(result => result.match_score > 0)      // drop zero-score
    .sort((a, b) => b.match_score - a.match_score) // highest first
    .slice(0, 20);                                 // cap at 20 matches
}