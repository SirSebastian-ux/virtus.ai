-- Allow paid Life Coach memberships without changing existing account tiers.
-- Apply only after backup and schema review in the Virtus AI Supabase project.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'life_coach', 'plus', 'premium'));
