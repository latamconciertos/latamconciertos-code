import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConcertSearchResult {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  artist_id: string | null;
  artists: { id: string; name: string; slug: string } | null;
  venues: { name: string; cities: { name: string } | null } | null;
}

export function useConcertSearch(query: string, limit = 8) {
  return useQuery({
    queryKey: ['concerts', 'admin-search', query],
    enabled: query.trim().length >= 2,
    queryFn: async (): Promise<ConcertSearchResult[]> => {
      const term = query.trim();
      const { data, error } = await supabase
        .from('concerts')
        .select(`
          id, title, slug, date, artist_id,
          artists:artist_id (id, name, slug),
          venues:venue_id (name, cities:city_id (name))
        `)
        .or(`title.ilike.%${term}%,slug.ilike.%${term}%`)
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as ConcertSearchResult[];
    },
    staleTime: 30 * 1000,
  });
}

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  url: string | null;
  concert_id: string | null;
  audience: { type: string; countryId?: string; artistId?: string };
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface PushCampaignInput {
  title: string;
  body: string;
  url?: string | null;
  concert_id?: string | null;
  audience: { type: 'all' } | { type: 'country'; countryId: string } | { type: 'artist'; artistId: string };
}

const KEYS = {
  all: ['push_campaigns'] as const,
  list: () => [...KEYS.all, 'list'] as const,
};

export function usePushCampaigns() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async (): Promise<PushCampaign[]> => {
      const { data, error } = await supabase
        .from('push_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as PushCampaign[];
    },
  });
}

export function useCreateAndSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PushCampaignInput) => {
      const { data: campaign, error } = await supabase
        .from('push_campaigns')
        .insert({
          title: input.title,
          body: input.body,
          url: input.url ?? null,
          concert_id: input.concert_id ?? null,
          audience: input.audience,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;

      const { data: sendResult, error: sendError } = await supabase.functions.invoke('push-broadcast', {
        body: { campaignId: campaign.id },
      });
      if (sendError) throw sendError;

      return { campaign, result: sendResult as { recipientCount: number; sent: number; failed: number } };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
