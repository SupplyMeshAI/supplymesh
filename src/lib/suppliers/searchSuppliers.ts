import { createClient } from "@/lib/supabase/server";
import type { SupplierCompany } from "./types";

export type SearchSuppliersParams = {
  q?: string;
  process?: string;
  certification?: string;
  material?: string;
  industry?: string;
  state_region?: string;
  maxLeadTime?: string | number;
};

function arrayIncludesPartial(
  values: string[] | null | undefined,
  target?: string
) {
  if (!target) return true;
  if (!values || values.length === 0) return false;

  const normalizedTarget = target.trim().toLowerCase();

  return values.some((value) =>
    value.toLowerCase().includes(normalizedTarget)
  );
}

function textIncludes(value: string | null | undefined, query?: string) {
  if (!query) return true;
  if (!value) return false;

  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export async function searchSuppliers(
  params: SearchSuppliersParams = {}
): Promise<SupplierCompany[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select(`
      id,
      name,
      city,
      state_region,
      website,
      supplier_profiles (
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

  if (error) {
    throw new Error(`Failed to fetch suppliers: ${error.message}`);
  }

  const suppliers = ((data ?? []) as SupplierCompany[]).filter((supplier) => {
    const profile = supplier.supplier_profiles?.[0];
    if (!profile) return false;

    const keyword = params.q?.trim().toLowerCase();

    const matchesKeyword =
      !keyword ||
      textIncludes(supplier.name, keyword) ||
      textIncludes(supplier.city, keyword) ||
      textIncludes(supplier.state_region, keyword) ||
      textIncludes(profile.tagline, keyword) ||
      textIncludes(profile.description, keyword) ||
      (profile.processes ?? []).some((process) =>
        process.toLowerCase().includes(keyword)
      ) ||
      (profile.materials ?? []).some((material) =>
        material.toLowerCase().includes(keyword)
      ) ||
      (profile.certifications ?? []).some((certification) =>
        certification.toLowerCase().includes(keyword)
      ) ||
      (profile.industries_served ?? []).some((industry) =>
        industry.toLowerCase().includes(keyword)
      );

    const matchesProcess = arrayIncludesPartial(
      profile.processes,
      params.process
    );

    const matchesMaterial = arrayIncludesPartial(
      profile.materials,
      params.material
    );

    const matchesCertification = arrayIncludesPartial(
      profile.certifications,
      params.certification
    );

    const matchesIndustry = arrayIncludesPartial(
      profile.industries_served,
      params.industry
    );

    const matchesStateRegion =
      !params.state_region ||
      supplier.state_region?.toLowerCase().includes(
        params.state_region.trim().toLowerCase()
      );

    const maxLeadTime =
      params.maxLeadTime !== undefined && params.maxLeadTime !== ""
        ? Number(params.maxLeadTime)
        : null;

    const matchesLeadTime =
      maxLeadTime === null ||
      profile.typical_lead_time_days === null ||
      profile.typical_lead_time_days <= maxLeadTime;

    return (
      matchesKeyword &&
      matchesProcess &&
      matchesMaterial &&
      matchesCertification &&
      matchesIndustry &&
      matchesStateRegion &&
      matchesLeadTime
    );
  });

  return suppliers.sort((a, b) => {
    const aProfile = a.supplier_profiles?.[0];
    const bProfile = b.supplier_profiles?.[0];

    const aLeadTime = aProfile?.typical_lead_time_days ?? Number.MAX_SAFE_INTEGER;
    const bLeadTime = bProfile?.typical_lead_time_days ?? Number.MAX_SAFE_INTEGER;

    return aLeadTime - bLeadTime;
  });
}