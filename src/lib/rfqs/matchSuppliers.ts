// src/lib/rfqs/matchSuppliers.ts
import type { Rfq } from "./types";
import type { SupplierCompany } from "@/lib/suppliers/types";

// ============================================================================
// Scoring weights
// ============================================================================
const SCORE = {
  PROCESS_REQUIRED:       30,  // per required process — not a hard fail
  PROCESS_PREFERRED:      10,
  CERT_REQUIRED_EXACT:    15,  // exact cert match
  CERT_REQUIRED_IMPLIED:  10,  // implied by higher/equivalent cert
  CERT_PREFERRED_EXACT:    6,
  CERT_PREFERRED_IMPLIED:  4,
  MATERIAL_EXACT:         12,  // exact material match
  MATERIAL_FAMILY:         8,  // same material family
  REGION_MATCH:            8,
  INDUSTRY_MATCH:          5,
} as const;

const MIN_SCORE = 20; // out of 100

// ============================================================================
// Result type
// ============================================================================
export type MatchResult = {
  supplier_id: string;
  company_id: string;
  rfq_id: string;
  match_score: number;
  match_reasons: string[];
  disqualified: boolean;
  disqualify_reasons: string[];
};

// ============================================================================
// Certification equivalence map
// ============================================================================
const CERT_EQUIVALENTS: Record<string, string[]> = {
  iso_9001:    ["iatf_16949", "as9100", "iso_13485", "as9003"],
  iatf_16949:  ["iso_9001"],
  as9100:      ["iso_9001", "nadcap"],
  iso_13485:   ["iso_9001"],
  nadcap:      ["as9100"],
  as9003:      ["as9100", "iso_9001"],
};

// ============================================================================
// Material family map
// ============================================================================
const MATERIAL_FAMILIES: Record<string, string[]> = {
  aluminum:        ["aluminium", "al", "aluminum_alloy", "6061", "7075", "5052", "2024", "6063", "cast_aluminum"],
  steel:           ["carbon_steel", "mild_steel", "4140", "4130", "1018", "1045", "a36", "tool_steel", "alloy_steel"],
  stainless_steel: ["stainless", "ss", "304", "316", "17_4", "15_5", "303", "410", "duplex"],
  titanium:        ["ti", "ti_6al_4v", "grade_5", "grade_2", "ti64"],
  copper:          ["cu", "beryllium_copper", "brass", "bronze", "c110", "c260"],
  inconel:         ["nickel_alloy", "nickel", "hastelloy", "waspaloy", "superalloy"],
  plastic:         ["abs", "nylon", "peek", "polycarbonate", "pvc", "ptfe", "delrin", "acetal", "hdpe", "pp", "polymer"],
  composite:       ["carbon_fiber", "fiberglass", "kevlar", "frp", "cfrp", "gfrp"],
};

// ============================================================================
// Region helpers
// ============================================================================
const REGION_STATES: Record<string, string[]> = {
  "Northeast":  ["ME","NH","VT","MA","RI","CT","NY","NJ","PA"],
  "Southeast":  ["MD","DE","DC","VA","WV","NC","SC","GA","FL","AL","MS","TN","KY","AR"],
  "Midwest":    ["OH","MI","IN","IL","WI","MN","IA","MO","ND","SD","NE","KS"],
  "Southwest":  ["TX","OK","NM","AZ"],
  "West Coast": ["CA","OR","WA","NV","ID"],
  "Mountain":   ["CO","UT","MT","WY"],
};

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
// Normalization helpers
// ============================================================================
function normalize(str: string): string {
  return str.toLowerCase().replace(/[\s_-]+/g, "_").replace(/[^a-z0-9_]/g, "").trim();
}

function valuesMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function humanize(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// Cert scoring
// ============================================================================
function scoreCert(
  required: string,
  supplierCerts: string[],
  exactPoints: number,
  impliedPoints: number,
  reasons: string[],
  label: string
): number {
  const exact = supplierCerts.some(sc => valuesMatch(required, sc));
  if (exact) {
    reasons.push(`Holds ${label} certification: ${required.toUpperCase()}`);
    return exactPoints;
  }
  const equivalents = CERT_EQUIVALENTS[normalize(required)] ?? [];
  const matchedEquiv = equivalents.find(eq => supplierCerts.some(sc => valuesMatch(eq, sc)));
  if (matchedEquiv) {
    reasons.push(`Holds ${matchedEquiv.toUpperCase()} which covers ${label} ${required.toUpperCase()}`);
    return impliedPoints;
  }
  return 0;
}

// ============================================================================
// Material scoring
// ============================================================================
function scoreMaterial(
  required: string,
  supplierMaterials: string[],
  reasons: string[]
): number {
  if (!required) return 0;
  const exact = supplierMaterials.some(sm => valuesMatch(required, sm));
  if (exact) {
    reasons.push(`Works with required material: ${humanize(required)}`);
    return SCORE.MATERIAL_EXACT;
  }
  const normalizedRequired = normalize(required);
  for (const [familyKey, familyMembers] of Object.entries(MATERIAL_FAMILIES)) {
    const isRequiredInFamily =
      normalize(familyKey) === normalizedRequired ||
      familyMembers.map(normalize).includes(normalizedRequired);
    if (isRequiredInFamily) {
      const allFamilyMembers = [familyKey, ...familyMembers].map(normalize);
      const supplierHasFamilyMember = supplierMaterials.some(sm =>
        allFamilyMembers.some(fm => valuesMatch(fm, sm))
      );
      if (supplierHasFamilyMember) {
        reasons.push(`Works with ${humanize(familyKey)} family (covers ${humanize(required)})`);
        return SCORE.MATERIAL_FAMILY;
      }
    }
  }
  return 0;
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

  // ── ITAR — only remaining hard disqualifier ───────────────────────────────
  if (rfq.itar_required && profile?.itar_registered === false) {
    disqualifyReasons.push("ITAR registration required but supplier is not ITAR registered");
  }
  if (rfq.itar_required && profile?.itar_registered === true) {
    reasons.push("ITAR registered — meets compliance requirement");
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
    if (supplierProcesses.some(sp => valuesMatch(proc, sp))) {
      rawScore += SCORE.PROCESS_REQUIRED;
      reasons.push(`Offers required process: ${humanize(proc)}`);
    }
  }
  for (const proc of preferredProcesses) {
    maxPossible += SCORE.PROCESS_PREFERRED;
    if (supplierProcesses.some(sp => valuesMatch(proc, sp))) {
      rawScore += SCORE.PROCESS_PREFERRED;
      reasons.push(`Offers preferred process: ${humanize(proc)}`);
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
    maxPossible += SCORE.CERT_REQUIRED_EXACT;
    rawScore += scoreCert(cert, supplierCerts, SCORE.CERT_REQUIRED_EXACT, SCORE.CERT_REQUIRED_IMPLIED, reasons, "required");
  }
  for (const cert of preferredCerts) {
    maxPossible += SCORE.CERT_PREFERRED_EXACT;
    rawScore += scoreCert(cert, supplierCerts, SCORE.CERT_PREFERRED_EXACT, SCORE.CERT_PREFERRED_IMPLIED, reasons, "preferred");
  }

  // ── Material ──────────────────────────────────────────────────────────────
  if (rfq.material_primary) {
    maxPossible += SCORE.MATERIAL_EXACT;
    rawScore += scoreMaterial(rfq.material_primary, profile?.materials || [], reasons);
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

  // ── Normalize to 0–100 ────────────────────────────────────────────────────
  const normalised = maxPossible > 0
    ? Math.round((rawScore / maxPossible) * 100)
    : 0;

  const supplierProfileId = (supplier.supplier_profiles?.[0] as { id?: string } | undefined)?.id ?? supplier.id;

  return {
    supplier_id: supplierProfileId,
    company_id: rfq.company_id,
    rfq_id: rfq.id,
    match_score: normalised,
    match_reasons: reasons.length > 0 ? reasons : ["Partial capability match"],
    disqualified: disqualifyReasons.length > 0,
    disqualify_reasons: disqualifyReasons,
  };
}

// ============================================================================
// Run matching
// ============================================================================
export function runMatching(rfq: Rfq, suppliers: SupplierCompany[]): MatchResult[] {
  return suppliers
    .map(supplier => scoreSupplier(rfq, supplier))
    .filter(result => !result.disqualified)
    .filter(result => result.match_score >= MIN_SCORE)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 25);
}