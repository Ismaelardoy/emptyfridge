import { queryKeys } from '@/shared/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getHousehold, removeMember, renameHousehold, transferOwnership } from './api';

export function useHousehold() {
  return useQuery({
    queryKey: queryKeys.household,
    queryFn: getHousehold,
    staleTime: 60_000,
  });
}

export function useRenameHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameHousehold,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.household });
      // El nombre también vive en el DTO del usuario que pinta la cabecera.
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      toast.success('Nombre del hogar actualizado');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.household });
      toast.success('Miembro expulsado del hogar');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transferOwnership,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.household });
      // El rol vive en el DTO del usuario: hay que refrescar la sesión cacheada.
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      toast.success('Propiedad del hogar cedida');
    },
    onError: (error) => toast.error(error.message),
  });
}
