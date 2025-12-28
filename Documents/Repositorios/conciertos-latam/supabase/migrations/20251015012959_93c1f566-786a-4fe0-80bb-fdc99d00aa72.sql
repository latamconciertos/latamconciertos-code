-- Create advertising_requests table
CREATE TABLE public.advertising_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website TEXT,
  ad_type VARCHAR(100) NOT NULL,
  budget_range VARCHAR(100),
  campaign_duration VARCHAR(100),
  target_audience TEXT,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertising_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert advertising requests
CREATE POLICY "Anyone can submit advertising requests"
ON public.advertising_requests
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Only admins can view all advertising requests
CREATE POLICY "Admins can view all advertising requests"
ON public.advertising_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Only admins can update advertising requests
CREATE POLICY "Admins can update advertising requests"
ON public.advertising_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Only admins can delete advertising requests
CREATE POLICY "Admins can delete advertising requests"
ON public.advertising_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for updated_at
CREATE TRIGGER update_advertising_requests_updated_at
BEFORE UPDATE ON public.advertising_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();