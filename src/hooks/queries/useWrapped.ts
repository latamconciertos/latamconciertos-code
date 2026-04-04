import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WrappedData } from '@/types/wrapped';

export function useWrappedData(year: number, enabled = true) {
  return useQuery({
    queryKey: ['wrapped', year],
    queryFn: async (): Promise<WrappedData> => {
      const { data, error } = await supabase.functions.invoke('generate-wrapped-data', {
        body: { year },
      });

      if (error) throw new Error(error.message || 'Error generando tu Wrapped');
      if (!data?.data && !data?.year) throw new Error('No se pudo generar tu Wrapped');

      return (data.data ?? data) as WrappedData;
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 min cache
    retry: 1,
  });
}

export function useRegenerateWrapped() {
  const regenerate = async (year: number): Promise<WrappedData> => {
    const { data, error } = await supabase.functions.invoke('generate-wrapped-data', {
      body: { year, forceRegenerate: true },
    });

    if (error) throw new Error(error.message || 'Error regenerando tu Wrapped');
    return (data.data ?? data) as WrappedData;
  };

  return { regenerate };
}
