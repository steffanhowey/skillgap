-- Harden Track F grants. CREATE TABLE default privileges left authenticated
-- with TRUNCATE/DELETE on these tables; RLS does not apply to TRUNCATE.
-- Applied on SkillGap via supabase-skillgap (lipdyycqbuvibgxcckjd).

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
