-- Tag the published launch catalog so mission completion can issue receipts.
INSERT INTO fp_skill_tags (path_id, skill_id, relevance)
SELECT p.id, s.id, mapping.relevance
FROM (
  VALUES
    ('prompt-engineering:research-insight', 'prompt-engineering', 'primary'),
    ('prompt-engineering:research-insight', 'research-synthesis', 'secondary'),
    ('prompt-engineering:positioning-messaging', 'prompt-engineering', 'primary'),
    ('prompt-engineering:positioning-messaging', 'messaging-optimization', 'secondary'),
    ('prompt-engineering:positioning-messaging', 'ai-assisted-writing', 'secondary'),
    ('claude-code:research-insight', 'vendor-evaluation', 'primary'),
    ('claude-code:research-insight', 'research-synthesis', 'secondary'),
    ('claude-code:positioning-messaging', 'messaging-optimization', 'primary'),
    ('claude-code:positioning-messaging', 'ai-sales-messaging', 'secondary'),
    ('github-copilot:research-insight', 'vendor-evaluation', 'primary'),
    ('github-copilot:research-insight', 'research-synthesis', 'secondary')
) AS mapping(lane_key, skill_slug, relevance)
JOIN fp_learning_paths p
  ON p.mission_lane_key = mapping.lane_key
 AND p.generation_engine = 'mission_projection'
 AND p.is_cached = true
JOIN fp_skills s
  ON s.slug = mapping.skill_slug
ON CONFLICT (path_id, skill_id) DO NOTHING;
