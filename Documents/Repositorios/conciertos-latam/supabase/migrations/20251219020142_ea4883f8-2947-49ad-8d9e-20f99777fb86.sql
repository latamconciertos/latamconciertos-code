-- Drop the restrictive policy and create a permissive one for public read access
DROP POLICY IF EXISTS "Everyone can view promoters" ON public.promoters;

-- Create a new PERMISSIVE policy for public read access (PERMISSIVE is the default)
CREATE POLICY "Public can view promoters" 
ON public.promoters 
FOR SELECT 
USING (true);