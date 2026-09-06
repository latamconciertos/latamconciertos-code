import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pollService } from '@/services/pollService';
import { queryKeys } from './queryKeys';
import type { PollInsert, PollUpdate, PollSubmission } from '@/types/entities/poll';

export const useActivePolls = () =>
  useQuery({
    queryKey: queryKeys.polls.active(),
    queryFn: () => pollService.getActivePolls(),
    staleTime: 5 * 60 * 1000,
  });

export const usePublicPoll = (slug: string | undefined) =>
  useQuery({
    queryKey: queryKeys.polls.detail(slug ?? ''),
    queryFn: () => pollService.getActivePollBySlug(slug!),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });

export const usePollsAdmin = () =>
  useQuery({
    queryKey: queryKeys.polls.admin(),
    queryFn: () => pollService.getAllForAdmin(),
  });

export const usePollResults = (token: string | undefined, refetchIntervalMs?: number) =>
  useQuery({
    queryKey: queryKeys.polls.results(token ?? ''),
    queryFn: () => pollService.getResults(token!),
    enabled: !!token,
    refetchInterval: refetchIntervalMs,
  });

export const useCreatePoll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PollInsert) => pollService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
      toast.success('Encuesta creada');
    },
    onError: (error: Error) => toast.error(`No se pudo crear la encuesta: ${error.message}`),
  });
};

export const useUpdatePoll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PollUpdate }) => pollService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
    },
    onError: (error: Error) => toast.error(`No se pudo actualizar la encuesta: ${error.message}`),
  });
};

export const useDeletePoll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pollService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
      toast.success('Encuesta eliminada');
    },
    onError: (error: Error) => toast.error(`No se pudo eliminar la encuesta: ${error.message}`),
  });
};

export const useSubmitPoll = () =>
  useMutation({
    mutationFn: (submission: PollSubmission) => pollService.submit(submission),
  });
