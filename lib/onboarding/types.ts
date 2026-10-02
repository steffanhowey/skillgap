/** Professional function — the user's primary domain. */
export type ProfessionalFunction =
  | "engineering"
  | "marketing"
  | "design"
  | "product"
  | "data_analytics"
  | "sales_revenue"
  | "operations";

/** AI fluency level — self-assessed during onboarding. */
export type FluencyLevel =
  | "exploring"
  | "practicing"
  | "proficient"
  | "advanced";

/** Metadata for a single function card in the selection grid. */
export interface FunctionOption {
  value: ProfessionalFunction;
  label: string;
  icon: string;
}

/** Metadata for a single fluency card. */
export interface FluencyOption {
  value: FluencyLevel;
  label: string;
  anchor: string;
}

/** An editorial pick from fp_onboarding_picks — drives Step 3 recommendations. */
export interface OnboardingPick {
  id: string;
  /** Real learning-path UUID. Required before routing to /missions/[id]. */
  path_id: string | null;
  function: string;
  fluency_level: string;
  path_topic: string;
  display_title: string;
  display_description: string;
  time_estimate_min: number;
  module_count: number;
  tool_names: string[];
  sort_order: number;
}

/** Launch function that currently has a published catalog. */
export const LIVE_ONBOARDING_FUNCTION: ProfessionalFunction = "marketing";

/** Canonical function options for the selection grid. */
export const FUNCTION_OPTIONS: FunctionOption[] = [
  { value: "engineering", label: "Engineering", icon: "code-2" },
  { value: "marketing", label: "Marketing", icon: "megaphone" },
  { value: "design", label: "Design", icon: "pen-tool" },
  { value: "product", label: "Product", icon: "layers" },
  { value: "data_analytics", label: "Data & Analytics", icon: "bar-chart-3" },
  { value: "sales_revenue", label: "Sales & Revenue", icon: "handshake" },
  { value: "operations", label: "Operations", icon: "settings" },
];

/** Canonical fluency options. Onboarding shows `anchor` only; `label` is the stored enum name. */
export const FLUENCY_OPTIONS: FluencyOption[] = [
  {
    value: "exploring",
    label: "Exploring",
    anchor: "I've tried ChatGPT a few times",
  },
  {
    value: "practicing",
    label: "Practicing",
    anchor: "I use it for a draft when I'm stuck",
  },
  {
    value: "proficient",
    label: "Proficient",
    anchor: "I use it most days for real work",
  },
  {
    value: "advanced",
    label: "Advanced",
    anchor: "I build workflows with it weekly",
  },
];

/** What takes most of the week. Stored on fp_profiles.focus_areas. */
export type FocusArea =
  | "content"
  | "email_campaigns"
  | "social"
  | "paid"
  | "seo"
  | "reporting"
  | "research"
  | "brand"
  | "launches"
  | "sales_enablement";

export interface FocusOption {
  value: FocusArea;
  label: string;
}

export const FOCUS_OPTIONS: FocusOption[] = [
  { value: "content", label: "Content" },
  { value: "email_campaigns", label: "Email and campaigns" },
  { value: "social", label: "Social" },
  { value: "paid", label: "Paid" },
  { value: "seo", label: "SEO" },
  { value: "reporting", label: "Reporting and analytics" },
  { value: "research", label: "Research" },
  { value: "brand", label: "Brand and creative" },
  { value: "launches", label: "Launches and product marketing" },
  { value: "sales_enablement", label: "Sales enablement" },
];

export const FOCUS_LIMIT = 3;

/**
 * Keep at most three known focus areas, in first-seen order.
 */
export function normalizeFocusAreas(values: readonly string[]): FocusArea[] {
  const allowed = new Set(FOCUS_OPTIONS.map((option) => option.value));
  const next: FocusArea[] = [];
  for (const value of values) {
    if (!allowed.has(value as FocusArea)) continue;
    const area = value as FocusArea;
    if (next.includes(area)) continue;
    next.push(area);
    if (next.length === FOCUS_LIMIT) break;
  }
  return next;
}
