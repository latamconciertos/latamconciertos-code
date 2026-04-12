import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContactWithPromoter, ContactInsert, ContactUpdate } from '@/types/entities';
import { toast } from 'sonner';

const KEYS = {
  all: ['contacts'] as const,
  list: () => [...KEYS.all, 'list'] as const,
};

export const useContacts = () =>
  useQuery({
    queryKey: KEYS.list(),
    queryFn: async (): Promise<ContactWithPromoter[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, promoters ( name )')
        .order('name') as any;
      if (error) throw error;
      return data ?? [];
    },
  });

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContactInsert) => {
      const { data: result, error } = await supabase
        .from('contacts')
        .insert(data as any)
        .select('*, promoters ( name )')
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Contacto creado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContactUpdate }) => {
      const { data: result, error } = await supabase
        .from('contacts')
        .update(data as any)
        .eq('id', id)
        .select('*, promoters ( name )')
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Contacto actualizado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Contacto eliminado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};
