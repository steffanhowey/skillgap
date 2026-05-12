-- Harden public tables flagged by Supabase Advisors on 2026-05-11.
-- Most of these tables are read and written only by server-side service-role
-- code. Browser/session clients get only the narrow access paths below.

BEGIN;

ALTER TABLE IF EXISTS public.addon_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_customer_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_project_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_ui_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_website_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_article_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_auto_approval_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_auto_approval_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_break_content_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_content_lake ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_generation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_internal_demand_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_onboarding_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_scaffolding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_signal_collection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_topic_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fp_topic_taxonomy ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.addon_bundles,
  public.admin_audit_log,
  public.admin_customer_offers,
  public.admin_kanban_columns,
  public.admin_project_creations,
  public.admin_ui_preferences,
  public.admin_website_analysis,
  public.agent_activity_events,
  public.agent_approval_queue,
  public.agent_artifacts,
  public.agent_capabilities,
  public.agent_categories,
  public.agent_category_assignments,
  public.agent_handoffs,
  public.agent_pricing,
  public.fp_article_candidates,
  public.fp_auto_approval_config,
  public.fp_auto_approval_log,
  public.fp_break_content_transcripts,
  public.fp_content_lake,
  public.fp_creators,
  public.fp_generation_status,
  public.fp_internal_demand_events,
  public.fp_learning_paths,
  public.fp_onboarding_picks,
  public.fp_pipeline_events,
  public.fp_scaffolding_events,
  public.fp_signal_collection_runs,
  public.fp_signals,
  public.fp_topic_clusters,
  public.fp_topic_taxonomy
FROM anon, authenticated;

DROP POLICY IF EXISTS "Onboarding picks are public read-only" ON public.fp_onboarding_picks;
CREATE POLICY "Onboarding picks are public read-only"
  ON public.fp_onboarding_picks
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE public.fp_onboarding_picks TO anon, authenticated;

DROP POLICY IF EXISTS "Users can record their own scaffolding events" ON public.fp_scaffolding_events;
CREATE POLICY "Users can record their own scaffolding events"
  ON public.fp_scaffolding_events
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT INSERT ON TABLE public.fp_scaffolding_events TO authenticated;

COMMIT;
