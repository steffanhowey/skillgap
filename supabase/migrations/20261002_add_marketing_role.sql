-- Marketing role from onboarding question 1.
-- role_function on learning paths accepts these slugs plus the older function values.

ALTER TABLE public.fp_profiles
  ADD COLUMN IF NOT EXISTS marketing_role text;

ALTER TABLE public.fp_profiles
  DROP CONSTRAINT IF EXISTS fp_profiles_marketing_role_valid;

ALTER TABLE public.fp_profiles
  ADD CONSTRAINT fp_profiles_marketing_role_valid
  CHECK (
    marketing_role IS NULL
    OR marketing_role IN (
      'generalist',
      'content',
      'product_marketing',
      'demand_gen',
      'brand',
      'social',
      'agency',
      'not_marketing'
    )
  );

ALTER TABLE public.fp_learning_paths
  DROP CONSTRAINT IF EXISTS fp_learning_paths_role_function_valid;

ALTER TABLE public.fp_learning_paths
  ADD CONSTRAINT fp_learning_paths_role_function_valid
  CHECK (
    role_function IS NULL
    OR role_function IN (
      'engineering', 'marketing', 'design', 'product',
      'data_analytics', 'sales_revenue', 'operations',
      'generalist', 'content', 'product_marketing',
      'demand_gen', 'brand', 'social', 'agency'
    )
  );

NOTIFY pgrst, 'reload schema';
