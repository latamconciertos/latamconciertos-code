import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdSpaceProps {
  position: 'sidebar-left' | 'sidebar-right' | 'content' | 'footer';
  page: 'homepage' | 'blog' | 'concerts' | 'artists';
}

interface AdItem {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  format: 'banner' | 'rectangle';
  impressions: number;
}

export const AdSpace = ({ position, page }: AdSpaceProps) => {
  const [ad, setAd] = useState<AdItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAd();
  }, [position, page]);

  const fetchAd = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_items')
        .select('*')
        .eq('location', page)
        .eq('position', position)
        .eq('active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setAd(data);
        // Track impression
        await trackImpression(data.id);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (adId: string) => {
    try {
      const { data: currentAd } = await supabase
        .from('ad_items')
        .select('impressions')
        .eq('id', adId)
        .single();

      if (currentAd) {
        await supabase
          .from('ad_items')
          .update({ impressions: currentAd.impressions + 1 })
          .eq('id', adId);
      }
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async () => {
    if (!ad) return;

    try {
      const { data: currentAd } = await supabase
        .from('ad_items')
        .select('clicks')
        .eq('id', ad.id)
        .single();

      if (currentAd) {
        await supabase
          .from('ad_items')
          .update({ clicks: currentAd.clicks + 1 })
          .eq('id', ad.id);
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleClick = () => {
    trackClick();
    if (ad?.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  // Don't render anything if there's no ad
  if (!ad || loading) return null;

  const aspectRatio = ad.format === 'banner' ? 'aspect-[728/90]' : 'aspect-[300/250]';
  const sizeClass = position === 'sidebar-left' || position === 'sidebar-right' 
    ? 'w-full max-w-[300px]' 
    : 'w-full max-w-[728px] mx-auto';

  return (
    <div className="bg-muted/30 rounded-lg p-4 text-center border">
      <p className="text-xs text-muted-foreground mb-2">Publicidad</p>
      <div 
        className={`${sizeClass} ${aspectRatio} rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={handleClick}
      >
        <img 
          src={ad.image_url} 
          alt={ad.name}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};
