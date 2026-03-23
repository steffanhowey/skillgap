ALTER TABLE fp_learning_paths
  ADD COLUMN IF NOT EXISTS mission_topic_slug TEXT NULL,
  ADD COLUMN IF NOT EXISTS mission_family TEXT NULL,
  ADD COLUMN IF NOT EXISTS mission_launch_domain TEXT NULL,
  ADD COLUMN IF NOT EXISTS mission_lane_key TEXT NULL;

CREATE INDEX IF NOT EXISTS fp_learning_paths_generation_lane_cached_idx
  ON fp_learning_paths(generation_engine, mission_lane_key, is_cached);
