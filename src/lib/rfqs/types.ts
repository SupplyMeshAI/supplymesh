// src/lib/rfqs/types.ts

export type RfqStatus = "draft" | "submitted" | "matched" |"matching" | "shortlisted" | "closed" | "cancelled";
export type RfqPriority = "low" | "standard" | "urgent";
export type MatchStatus = "matched" | "shortlisted" | "intro_sent" | "quoted" | "declined" | "awarded";
export type RequirementFlag = "required" | "preferred";

export type Rfq = {
  id: string;
  company_id: string;
  created_by: string;
  status: RfqStatus;
  current_step: number;

  // Step 1
  project_name: string | null;
  part_name: string | null;
  part_description: string | null;

  // Step 2
  processes_required: string[];
  processes_required_flags: RequirementFlag[];
  material_primary: string | null;
  material_is_required: boolean;
  secondary_operations: string | null;

  // Step 3
  tolerance_general: string | null;
  tolerance_tight: string | null;
  lot_size: string | null;
  annual_volume: string | null;
  num_unique_parts: number;

  // Step 4
  certifications_required: string[];
  certifications_required_flags: RequirementFlag[];
  itar_required: boolean;
  industry: string | null;
  additional_requirements: string | null;

  // Step 5
  preferred_regions: string[];
  max_distance_miles: number | null;
  priority: RfqPriority;
  needed_by_date: string | null;
  production_start: string | null;
  target_price: number | null;
  budget_notes: string | null;
  special_instructions: string | null;

  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RfqAttachment = {
  id: string;
  rfq_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

export type RfqMatch = {
  id: string;
  rfq_id: string;
  supplier_id: string;
  company_id: string;
  match_score: number;
  match_reasons: string[];
  status: MatchStatus;
  buyer_notes: string | null;
  created_at: string;
  updated_at: string;
};
