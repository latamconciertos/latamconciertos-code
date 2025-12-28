-- Create enum for ad campaign status
CREATE TYPE ad_campaign_status AS ENUM ('active', 'paused', 'finished');

-- Create enum for ad format
CREATE TYPE ad_format AS ENUM ('banner', 'rectangle');

-- Create enum for ad position
CREATE TYPE ad_position AS ENUM ('sidebar-left', 'sidebar-right', 'content', 'footer');

-- Create ad_campaigns table
CREATE TABLE public.ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status ad_campaign_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_items table
CREATE TABLE public.ad_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL, -- homepage, blog, concerts, artists, etc
  format ad_format NOT NULL DEFAULT 'banner',
  image_url TEXT NOT NULL,
  link_url TEXT,
  position ad_position NOT NULL DEFAULT 'sidebar-right',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_campaigns
CREATE POLICY "Public can view active campaigns"
  ON public.ad_campaigns
  FOR SELECT
  USING (status = 'active' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can do everything with campaigns"
  ON public.ad_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for ad_items
CREATE POLICY "Public can view active ads"
  ON public.ad_items
  FOR SELECT
  USING (
    active = true 
    AND EXISTS (
      SELECT 1 FROM public.ad_campaigns 
      WHERE id = ad_items.campaign_id 
      AND status = 'active'
      AND (start_date IS NULL OR start_date <= now())
      AND (end_date IS NULL OR end_date >= now())
    )
  );

CREATE POLICY "Admins can do everything with ads"
  ON public.ad_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_ad_items_location ON public.ad_items(location);
CREATE INDEX idx_ad_items_position ON public.ad_items(position);
CREATE INDEX idx_ad_items_active ON public.ad_items(active);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);

-- Create update triggers
CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_ad_items_updated_at
  BEFORE UPDATE ON public.ad_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();