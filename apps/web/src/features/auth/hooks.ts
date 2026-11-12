import { queryKeys } from '@/shared/lib/query-keys';
import type { AuthResultDto, UserDto } from '@emptyfridge/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createHousehold,
  createRecoveryCode,
  getMe,
  joinHousehold,
  logout,
  recoverIdentity,
  redeemTransfer,
  renameDisplayName,
} from './api';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });
}

/** Efecto común de crear/unirse a un hogar. */
export function useAuthSuccessHandler() {
  const queryClient = useQueryClient();

  return (result: AuthResultDto) => {
    queryClient.setQueryData<UserDto | null>(queryKeys.me, result.user);
    void queryClient.invalidateQueries({ queryKey: ['lists'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.household });
  };
}

export function useCreateHousehold() {
  const onSuccess = useAuthSuccessHandler();
  return useMutation({ mutationFn: createHousehold, onSuccess });
}

export function useJoinHousehold() {
  const onSuccess = useAuthSuccessHandler();
  return useMutation({ mutationFn: joinHousehold, onSuccess });
}

/** Cambia el nombre visible de la identidad anónima. */
export function useRenameDisplayName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameDisplayName,
    onSuccess: (result) => {
      queryClient.setQueryData<UserDto | null>(queryKeys.me, result.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.household });
    },
  });
}

export function useRedeemTransfer() {
  const onSuccess = useAuthSuccessHandler();
  return useMutation({ mutationFn: redeemTransfer, onSuccess });
}

/** Genera un código de recuperación nuevo; invalida el anterior. */
export function useCreateRecoveryCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecoveryCode,
    onSuccess: ({ code }) => {
      queryClient.setQueryData<UserDto | null>(queryKeys.me, (current) =>
        current ? { ...current, recoveryCode: code } : current,
      );
    },
  });
}

export function useRecoverIdentity() {
  const onSuccess = useAuthSuccessHandler();
  return useMutation({ mutationFn: recoverIdentity, onSuccess });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.me, null);
    },
  });
}
