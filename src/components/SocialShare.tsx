import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { socialIconMap } from './SocialIcons';

interface SocialNetwork {
  id: string;
  name: string;
  icon_name: string;
  url_template: string;
  display_order: number;
}

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveNetworks();
  }, []);

  const fetchActiveNetworks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_networks')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      console.error('Error fetching social networks:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShareUrl = (template: string) => {
    return template
      .replace('{url}', encodeURIComponent(url))
      .replace('{title}', encodeURIComponent(title));
  };

  if (loading) return null;

  return (
    <div className="flex items-center gap-2">
      {networks.map((network) => {
        const IconComponent = socialIconMap[network.icon_name];
        if (!IconComponent) return null;

        const shareUrl = generateShareUrl(network.url_template);

        return (
          <Button
            key={network.id}
            variant="outline"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={() => window.open(shareUrl, '_blank', 'width=600,height=400')}
            title={`Compartir en ${network.name}`}
          >
            <IconComponent size={18} />
          </Button>
        );
      })}
    </div>
  );
}
