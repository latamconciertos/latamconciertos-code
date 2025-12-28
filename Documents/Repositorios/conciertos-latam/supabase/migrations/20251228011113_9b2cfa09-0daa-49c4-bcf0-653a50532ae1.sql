-- Remove the public INSERT policy on page_views
-- The edge function uses service_role_key which bypasses RLS
DROP POLICY IF EXISTS "Track analytics can insert page views" ON public.page_views;