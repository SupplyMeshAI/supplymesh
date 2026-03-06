export type SupplierProfile = {
  tagline: string | null;
  description: string | null;
  processes: string[] | null;
  materials: string[] | null;
  certifications: string[] | null;
  industries_served: string[] | null;
  typical_lead_time_days: number | null;
  itar_registered: boolean | null;
  profile_status: string | null;
};

export type SupplierCompany = {
  id: string;
  name: string;
  city: string | null;
  state_region: string | null;
  website: string | null;
  supplier_profiles: SupplierProfile[] | null;
};