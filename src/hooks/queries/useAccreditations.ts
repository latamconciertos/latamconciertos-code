import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  AccreditationWithTeam,
  AccreditationInsert,
  AccreditationUpdate,
  TeamAssignmentInsert,
} from '@/types/entities';
import { toast } from 'sonner';

const KEYS = {
  all: ['accreditations'] as const,
  list: () => [...KEYS.all, 'list'] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
  dashboard: () => [...KEYS.all, 'dashboard'] as const,
};

export const useAccreditations = () =>
  useQuery({
    queryKey: KEYS.list(),
    queryFn: async (): Promise<AccreditationWithTeam[]> => {
      const { data: accreditations, error } = await supabase
        .from('accreditations')
        .select('*')
        .order('deadline', { ascending: true });
      if (error) throw error;
      if (!accreditations?.length) return [];

      const ids = accreditations.map((a) => a.id);

      const { data: assignments } = await supabase
        .from('event_team_assignments')
        .select('*')
        .in('accreditation_id', ids);

      const userIds = [...new Set((assignments ?? []).map((a) => a.user_id))];
      let profilesMap: Record<string, { username: string | null; first_name: string | null; last_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name')
          .in('id', userIds);
        for (const p of profiles ?? []) {
          profilesMap[p.id] = { username: p.username, first_name: p.first_name, last_name: p.last_name };
        }
      }

      const concertIds = accreditations.map((a) => a.concert_id).filter(Boolean) as string[];
      let concertsMap: Record<string, { title: string; date: string | null; promoter_id: string | null; promoter_name: string | null }> = {};
      if (concertIds.length > 0) {
        const { data: concertsData } = await supabase
          .from('concerts')
          .select('id, title, date, promoter_id, promoters ( name )')
          .in('id', concertIds);
        for (const c of concertsData ?? []) {
          const promoter = (c as any).promoters;
          concertsMap[c.id] = {
            title: c.title,
            date: c.date,
            promoter_id: c.promoter_id,
            promoter_name: promoter?.name ?? null,
          };
        }
      }

      const festivalIds = accreditations.map((a: any) => a.festival_id).filter(Boolean) as string[];
      let festivalsMap: Record<string, { title: string; date: string | null; promoter_id: string | null; promoter_name: string | null }> = {};
      if (festivalIds.length > 0) {
        const { data: festivalsData } = await supabase
          .from('festivals')
          .select('id, name, start_date, promoter_id, promoters ( name )')
          .in('id', festivalIds);
        for (const f of festivalsData ?? []) {
          const promoter = (f as any).promoters;
          festivalsMap[f.id] = {
            title: f.name,
            date: f.start_date,
            promoter_id: f.promoter_id,
            promoter_name: promoter?.name ?? null,
          };
        }
      }

      return accreditations.map((a: any) => {
        const concertData = a.concert_id ? concertsMap[a.concert_id] ?? null : null;
        const festivalData = a.festival_id ? festivalsMap[a.festival_id] ?? null : null;
        return {
          ...a,
          concerts: concertData ?? festivalData,
          event_team_assignments: (assignments ?? [])
            .filter((t) => t.accreditation_id === a.id)
            .map((t) => ({ ...t, profiles: profilesMap[t.user_id] ?? null })),
        };
      }) as AccreditationWithTeam[];
    },
  });

export const useAccreditation = (id: string) =>
  useQuery({
    queryKey: KEYS.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<AccreditationWithTeam> => {
      const { data, error } = await supabase
        .from('accreditations')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as AccreditationWithTeam;
    },
  });

export const useCreateAccreditation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccreditationInsert) => {
      const { data: result, error } = await supabase
        .from('accreditations')
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Acreditación creada');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};

export const useUpdateAccreditation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AccreditationUpdate }) => {
      const { data: result, error } = await supabase
        .from('accreditations')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Acreditación actualizada');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};

export const useDeleteAccreditation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accreditations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Acreditación eliminada');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};

export const useAddTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TeamAssignmentInsert) => {
      const { data: result, error } = await supabase
        .from('event_team_assignments')
        .insert(data as any)
        .select('*')
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Miembro asignado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};

export const useRemoveTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_team_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Miembro removido');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};

export const useToggleTeamConfirmation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, confirmed }: { id: string; confirmed: boolean }) => {
      const { error } = await supabase
        .from('event_team_assignments')
        .update({ confirmed } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
};
