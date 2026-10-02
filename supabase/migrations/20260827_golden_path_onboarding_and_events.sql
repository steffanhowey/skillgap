-- Golden path: link onboarding picks to real paths + first-party product events.
-- Applied on SkillGap via supabase-skillgap (lipdyycqbuvibgxcckjd).

ALTER TABLE fp_onboarding_picks
  ADD COLUMN IF NOT EXISTS path_id UUID REFERENCES fp_learning_paths(id);

CREATE INDEX IF NOT EXISTS idx_onboarding_picks_path_id
  ON fp_onboarding_picks(path_id);

CREATE TABLE IF NOT EXISTS fp_product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_events_user_created
  ON fp_product_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_event_created
  ON fp_product_events(event, created_at DESC);

ALTER TABLE fp_product_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_events_insert_own ON fp_product_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY product_events_insert_anon ON fp_product_events
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
