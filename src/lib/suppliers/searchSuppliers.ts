import { createClient } from "@/lib/supabase/server";
import type { SupplierCompany } from "./types";

export type SearchSuppliersParams = {
  q?: string;
  process?: string;
  certification?: string;
  itar?: string;
  material?: string;
  industry?: string;
  state_region?: string;
  maxLeadTime?: string | number;
};

type SupplierProfileRow = {
  id: string;
  tagline: string | null;
  description: string | null;
  processes: string[] | null;
  materials: string[] | null;
  certifications: string[] | null;
  industries_served: string[] | null;
  typical_lead_time_days: number | null;
  itar_registered: boolean | null;
  profile_status: string | null;
  companies: {
    id: string;
    name: string;
    city: string | null;
    state_region: string | null;
    website: string | null;
  } | {
    id: string;
    name: string;
    city: string | null;
    state_region: string | null;
    website: string | null;
  }[] | null;
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function tokenMatch(filterValue: string, storedValue: string): boolean {
  const filterTokens = tokenize(filterValue);
  const storedTokens = tokenize(storedValue);
  // Match if ANY filter token appears in the stored value's tokens
  return filterTokens.some((ft) => storedTokens.includes(ft));
}

function arrayMatchesFilter(
  values: string[] | null | undefined,
  target: string | undefined
): boolean {
  if (!target) return true;
  if (!values || values.length === 0) return false;
  return values.some((v) => tokenMatch(target, v));
}

export async function searchSuppliers(
  params: SearchSuppliersParams = {}
): Promise<SupplierCompany[]> {
  const supabase = await createClient();

  let query = supabase
    .from("supplier_profiles")
    .select(`
      id,
      tagline,
      description,
      processes,
      materials,
      certifications,
      industries_served,
      typical_lead_time_days,
      itar_registered,
      profile_status,
      companies (
        id,
        name,
        city,
        state_region,
        website
      )
    `);

  // Only lead time goes to DB — everything else is JS-side due to mixed formats
  const maxLeadTime =
    params.maxLeadTime !== undefined && params.maxLeadTime !== ""
      ? Number(params.maxLeadTime)
      : null;

  if (maxLeadTime !== null) {
    query = query.lte("typical_lead_time_days", maxLeadTime);
  }

  const { data, error } = await query.order("typical_lead_time_days", {
    ascending: true,
    nullsFirst: false,
  });

  if (error) {
    console.error("[searchSuppliers] Supabase error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch suppliers: ${error.message}`);
  }

  let results = (data ?? []).map((profile: SupplierProfileRow) => {
    const company = Array.isArray(profile.companies)
      ? profile.companies[0]
      : profile.companies;

    return {
      id: company?.id,
      name: company?.name,
      city: company?.city,
      state_region: company?.state_region,
      website: company?.website,
      supplier_profiles: [
        {
          tagline: profile.tagline,
          description: profile.description,
          processes: profile.processes,
          materials: profile.materials,
          certifications: profile.certifications,
          industries_served: profile.industries_served,
          typical_lead_time_days: profile.typical_lead_time_days,
          itar_registered: profile.itar_registered,
          profile_status: profile.profile_status,
        },
      ],
    } as SupplierCompany;
  });

  // Array filters — JS-side with token matching to handle snake_case vs human-readable
  if (params.process) {
    results = results.filter((s) =>
      arrayMatchesFilter(s.supplier_profiles?.[0]?.processes, params.process)
    );
  }

  if (params.material) {
    results = results.filter((s) =>
      arrayMatchesFilter(s.supplier_profiles?.[0]?.materials, params.material)
    );
  }

  if (params.certification) {
    results = results.filter((s) =>
      arrayMatchesFilter(s.supplier_profiles?.[0]?.certifications, params.certification)
    );
  }

  if (params.industry) {
    results = results.filter((s) =>
      arrayMatchesFilter(s.supplier_profiles?.[0]?.industries_served, params.industry)
    );
  }

  if (params.itar !== undefined && params.itar !== "") {
    const itarBool = params.itar === "true";
    results = results.filter((s) =>
      s.supplier_profiles?.[0]?.itar_registered === itarBool
    );
  }
  
  if (params.state_region) {
    const stateTarget = params.state_region.trim().toLowerCase();
    results = results.filter((s) =>
      s.state_region?.toLowerCase().includes(stateTarget)
    );
  }

  // Keyword search across all text fields
  const keyword = params.q?.trim().toLowerCase();
  if (keyword) {
    results = results.filter((supplier) => {
      const profile = supplier.supplier_profiles?.[0];
      return (
        supplier.name?.toLowerCase().includes(keyword) ||
        supplier.city?.toLowerCase().includes(keyword) ||
        supplier.state_region?.toLowerCase().includes(keyword) ||
        profile?.tagline?.toLowerCase().includes(keyword) ||
        profile?.description?.toLowerCase().includes(keyword) ||
        profile?.processes?.some((p) =>
          p.toLowerCase().replace(/_/g, " ").includes(keyword)
        ) ||
        profile?.materials?.some((m) => m.toLowerCase().includes(keyword)) ||
        profile?.certifications?.some((c) => c.toLowerCase().includes(keyword)) ||
        profile?.industries_served?.some((i) => i.toLowerCase().includes(keyword))
      );
    });
  }

  return results;
}