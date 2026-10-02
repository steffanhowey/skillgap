-- One row per finished mission (a module). Private fields stay on this table.
-- fp_practice_activity is the shareable slice for a later team view.

CREATE TABLE IF NOT EXISTS public.fp_practice_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES public.fp_learning_paths(id) ON DELETE CASCADE,
  module_index integer NOT NULL,
  mission_title text NOT NULL,
  practices text NOT NULL DEFAULT '',
  skill_tags text[] NOT NULL DEFAULT '{}',
  tool text,
  artifact_url text,
  self_check text,
  check_score integer,
  reflection text,
  seconds_spent integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fp_practice_log_self_check_valid
    CHECK (self_check IS NULL OR self_check IN ('yes', 'partly', 'not_yet')),
  CONSTRAINT fp_practice_log_user_path_module_key
    UNIQUE (user_id, path_id, module_index)
);

CREATE INDEX IF NOT EXISTS idx_fp_practice_log_user_path
  ON public.fp_practice_log (user_id, path_id);

ALTER TABLE public.fp_practice_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fp_practice_log_select_own ON public.fp_practice_log;
CREATE POLICY fp_practice_log_select_own
  ON public.fp_practice_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS fp_practice_log_insert_own ON public.fp_practice_log;
CREATE POLICY fp_practice_log_insert_own
  ON public.fp_practice_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS fp_practice_log_update_own ON public.fp_practice_log;
CREATE POLICY fp_practice_log_update_own
  ON public.fp_practice_log
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.fp_practice_activity
WITH (security_invoker = true) AS
SELECT
  user_id,
  path_id,
  module_index,
  mission_title,
  practices,
  skill_tags,
  tool,
  completed_at
FROM public.fp_practice_log;

GRANT SELECT ON public.fp_practice_activity TO authenticated;

NOTIFY pgrst, 'reload schema';
