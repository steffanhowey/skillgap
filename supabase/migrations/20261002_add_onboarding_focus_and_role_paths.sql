-- Onboarding focus areas, and role-path / review columns on learning paths.
-- Existing paths default to approved so the live catalog stays out of the draft queue.
-- Generated paths set status and review_status explicitly (draft → approved),
-- the same pair fp_room_blueprints uses.

ALTER TABLE public.fp_profiles
  ADD COLUMN IF NOT EXISTS focus_areas text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.fp_profiles
  DROP CONSTRAINT IF EXISTS fp_profiles_focus_areas_valid;

ALTER TABLE public.fp_profiles
  ADD CONSTRAINT fp_profiles_focus_areas_valid
  CHECK (
    cardinality(focus_areas) <= 3
    AND focus_areas <@ ARRAY[
      'content',
      'email_campaigns',
      'social',
      'paid',
      'seo',
      'reporting',
      'research',
      'brand',
      'launches',
      'sales_enablement'
    ]::text[]
  );

ALTER TABLE public.fp_learning_paths
  ADD COLUMN IF NOT EXISTS is_role_path boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role_function text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS generation_source text,
  ADD COLUMN IF NOT EXISTS review_notes text;

ALTER TABLE public.fp_learning_paths
  DROP CONSTRAINT IF EXISTS fp_learning_paths_status_valid;

ALTER TABLE public.fp_learning_paths
  ADD CONSTRAINT fp_learning_paths_status_valid
  CHECK (status IN ('draft', 'approved', 'rejected'));

ALTER TABLE public.fp_learning_paths
  DROP CONSTRAINT IF EXISTS fp_learning_paths_review_status_valid;

ALTER TABLE public.fp_learning_paths
  ADD CONSTRAINT fp_learning_paths_review_status_valid
  CHECK (review_status IN ('pending', 'approved', 'rejected', 'expired'));

ALTER TABLE public.fp_learning_paths
  DROP CONSTRAINT IF EXISTS fp_learning_paths_role_function_valid;

ALTER TABLE public.fp_learning_paths
  ADD CONSTRAINT fp_learning_paths_role_function_valid
  CHECK (
    role_function IS NULL
    OR role_function IN (
      'engineering', 'marketing', 'design', 'product',
      'data_analytics', 'sales_revenue', 'operations'
    )
  );

CREATE INDEX IF NOT EXISTS idx_fp_learning_paths_role_function
  ON public.fp_learning_paths (role_function)
  WHERE is_role_path = true;

CREATE INDEX IF NOT EXISTS idx_fp_learning_paths_review_status
  ON public.fp_learning_paths (review_status)
  WHERE review_status = 'pending';

NOTIFY pgrst, 'reload schema';
