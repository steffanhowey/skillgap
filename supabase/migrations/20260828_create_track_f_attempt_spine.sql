-- Track F schema v0: attempts, artifacts, evaluations, LLM run ledger.
-- Additive only. Does not reconcile the 39-vs-8 migration ledger.
-- Applied on SkillGap via supabase-skillgap (lipdyycqbuvibgxcckjd).
--
-- In this horizon:
--   * source_packet_id is nullable (packet JSON + hash live on the attempt)
--   * artifact types are work_context and message_matrix only
--   * context is an artifact, not fp_work_context_versions
--   * fp_llm_runs never stores raw user content
-- Skip: capability–skill joins, evidence events, recommendation decisions,
--       intelligence pipeline, catalog cutover.

CREATE TABLE fp_capability_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_key TEXT NOT NULL,
  version INTEGER NOT NULL,
  professional_function TEXT NOT NULL,
  role_archetype TEXT NOT NULL,
  workflow TEXT NOT NULL,
  target_behavior TEXT NOT NULL,
  evidence_rubric JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'allowlisted'
    CHECK (status IN ('draft', 'allowlisted', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stable_key, version)
);

CREATE TABLE fp_llm_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation TEXT NOT NULL,
  call_site TEXT NOT NULL,
  model TEXT NOT NULL CHECK (model = 'gpt-4o-mini'),
  prompt_version TEXT NOT NULL,
  schema_version TEXT,
  input_hash TEXT NOT NULL,
  output_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('ok', 'review_unavailable')),
  failure_reason TEXT CHECK (
    failure_reason IS NULL OR failure_reason IN (
      'timeout',
      'malformed',
      'provider_error',
      'missing_safety_prompt',
      'invalid_model',
      'empty_response'
    )
  ),
  latency_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd NUMERIC,
  provider_request_id TEXT,
  trace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fp_learning_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES fp_capability_applications(id),
  application_version INTEGER NOT NULL,
  source_packet_id UUID,
  source_packet JSONB NOT NULL,
  source_packet_hash TEXT NOT NULL,
  delivery_context TEXT NOT NULL DEFAULT 'solo'
    CHECK (delivery_context IN ('solo', 'room')),
  room_id UUID REFERENCES fp_parties(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (state IN ('in_progress', 'completed', 'abandoned')),
  current_activity_id TEXT,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE fp_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES fp_learning_attempts(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL
    CHECK (artifact_type IN ('work_context', 'message_matrix')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'superseded')),
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, artifact_type)
);

CREATE TABLE fp_artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES fp_artifacts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  parent_version_id UUID REFERENCES fp_artifact_versions(id),
  source_packet_hash TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  content JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  created_by TEXT NOT NULL CHECK (created_by IN ('user', 'system')),
  llm_run_id UUID REFERENCES fp_llm_runs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (artifact_id, version)
);

CREATE TABLE fp_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES fp_learning_attempts(id) ON DELETE CASCADE,
  artifact_version_id UUID NOT NULL REFERENCES fp_artifact_versions(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  evaluator_key TEXT NOT NULL,
  evaluator_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  rubric_version TEXT NOT NULL,
  llm_run_id UUID REFERENCES fp_llm_runs(id),
  status TEXT NOT NULL CHECK (status IN (
    'blocking_issues',
    'material_revisions',
    'checklist_cleared',
    'review_unavailable'
  )),
  result JSONB NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (artifact_version_id, evaluator_key, evaluator_version, rubric_version)
);

CREATE TABLE fp_evaluation_criteria (
  evaluation_id UUID NOT NULL REFERENCES fp_evaluations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criterion_key TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('pass', 'fail', 'abstain', 'not_evaluated')),
  confidence NUMERIC,
  rationale TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (evaluation_id, criterion_key)
);

CREATE INDEX idx_capability_applications_stable_key
  ON fp_capability_applications (stable_key, version DESC);

CREATE INDEX idx_learning_attempts_user_state
  ON fp_learning_attempts (user_id, state, last_activity_at DESC);

CREATE INDEX idx_learning_attempts_application
  ON fp_learning_attempts (application_id);

CREATE INDEX idx_artifacts_attempt
  ON fp_artifacts (attempt_id, artifact_type);

CREATE INDEX idx_artifact_versions_artifact
  ON fp_artifact_versions (artifact_id, version DESC);

CREATE INDEX idx_artifact_versions_hash
  ON fp_artifact_versions (content_hash);

CREATE INDEX idx_evaluations_attempt
  ON fp_evaluations (attempt_id, created_at DESC);

CREATE INDEX idx_evaluations_artifact_hash
  ON fp_evaluations (artifact_version_id, content_hash);

CREATE INDEX idx_evaluation_criteria_user
  ON fp_evaluation_criteria (user_id);

CREATE INDEX idx_llm_runs_user_created
  ON fp_llm_runs (user_id, created_at DESC);

CREATE INDEX idx_llm_runs_operation_created
  ON fp_llm_runs (operation, created_at DESC);

CREATE INDEX idx_llm_runs_trace
  ON fp_llm_runs (trace_id);

INSERT INTO fp_capability_applications (
  id,
  stable_key,
  version,
  professional_function,
  role_archetype,
  workflow,
  target_behavior,
  evidence_rubric,
  status
) VALUES (
  '8f0c2a11-6d4e-4b7a-9c31-1e5f8a2d6b40',
  'pmm-b2b-saas-evidence-backed-launch-v1',
  1,
  'Marketing',
  'B2B SaaS Product Marketing Manager',
  'evidence-backed launch messaging',
  'Confirm launch context and a labeled proof ledger, build a three-row message matrix, run a server-owned pressure test, accept or reject each revision, and export the work.',
  '{
    "schema_version": "wedge_evidence_rubric_v0",
    "evaluator_key": "matrix_review",
    "allowed_copy": "AI-reviewed against the proof you supplied.",
    "criteria": [
      {"key": "claim_to_proof", "blocking": true, "summary": "Every factual claim maps to an approved proof or an explicit hypothesis."},
      {"key": "audience_action_fit", "blocking": false, "summary": "Each row addresses a specific audience job and the confirmed desired action."},
      {"key": "differentiation", "blocking": false, "summary": "Rows make distinct message cases against the current alternative."},
      {"key": "objection_quality", "blocking": false, "summary": "Objection responses are specific and do not evade the stated concern."},
      {"key": "channel_fit", "blocking": false, "summary": "Expressions are usable in the confirmed channel."},
      {"key": "constraint_compliance", "blocking": true, "summary": "Copy respects confirmed voice constraints."},
      {"key": "prompt_injection", "blocking": true, "summary": "Embedded instructions cannot control the review."}
    ]
  }'::jsonb,
  'allowlisted'
)
ON CONFLICT (stable_key, version) DO NOTHING;

ALTER TABLE fp_capability_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_learning_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_llm_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE fp_capability_applications FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE fp_learning_attempts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE fp_artifacts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE fp_artifact_versions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE fp_evaluations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE fp_evaluation_criteria FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE fp_llm_runs FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE fp_capability_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE fp_learning_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE fp_artifacts TO authenticated;
GRANT SELECT, INSERT ON TABLE fp_artifact_versions TO authenticated;
GRANT SELECT ON TABLE fp_evaluations TO authenticated;
GRANT SELECT ON TABLE fp_evaluation_criteria TO authenticated;
GRANT SELECT ON TABLE fp_llm_runs TO authenticated;

CREATE POLICY capability_applications_select ON fp_capability_applications
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY learning_attempts_select ON fp_learning_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY learning_attempts_insert ON fp_learning_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY learning_attempts_update ON fp_learning_attempts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY artifacts_select ON fp_artifacts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY artifacts_insert ON fp_artifacts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY artifacts_update ON fp_artifacts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY artifact_versions_select ON fp_artifact_versions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY artifact_versions_insert ON fp_artifact_versions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY evaluations_select ON fp_evaluations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY evaluation_criteria_select ON fp_evaluation_criteria
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY llm_runs_select ON fp_llm_runs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
