-- Billing columns on fp_profiles. Additive.
-- Own-row reads already exist ("Users can read all profiles",
-- "Anyone can view profiles"). These columns are not user-writable.

ALTER TABLE public.fp_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status text,
  ADD COLUMN IF NOT EXISTS plan_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS is_founding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_id uuid;

ALTER TABLE public.fp_profiles
  DROP CONSTRAINT IF EXISTS fp_profiles_plan_valid;

ALTER TABLE public.fp_profiles
  ADD CONSTRAINT fp_profiles_plan_valid
  CHECK (plan IN ('free', 'individual', 'founding', 'team'));

CREATE INDEX IF NOT EXISTS idx_fp_profiles_stripe_customer_id
  ON public.fp_profiles (stripe_customer_id);

CREATE OR REPLACE FUNCTION public.fp_profiles_guard_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin')
     OR coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_status IS DISTINCT FROM OLD.plan_status
     OR NEW.plan_period_end IS DISTINCT FROM OLD.plan_period_end
     OR NEW.is_founding IS DISTINCT FROM OLD.is_founding
     OR NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    RAISE EXCEPTION 'billing columns are writable only by the service role'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fp_profiles_guard_billing_columns ON public.fp_profiles;

CREATE TRIGGER fp_profiles_guard_billing_columns
  BEFORE UPDATE ON public.fp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fp_profiles_guard_billing_columns();

NOTIFY pgrst, 'reload schema';
