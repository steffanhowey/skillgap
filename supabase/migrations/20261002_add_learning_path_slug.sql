-- Stable key for role-path files. Existing generated paths leave this null.
-- Postgres unique allows many nulls, so generated paths are unaffected.

ALTER TABLE public.fp_learning_paths
  ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE public.fp_learning_paths
  DROP CONSTRAINT IF EXISTS fp_learning_paths_slug_key;

ALTER TABLE public.fp_learning_paths
  ADD CONSTRAINT fp_learning_paths_slug_key UNIQUE (slug);

NOTIFY pgrst, 'reload schema';
