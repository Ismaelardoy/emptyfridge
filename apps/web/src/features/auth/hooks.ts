import { queryKeys } from '@/shared/lib/query-keys';
import type { AuthResultDto, UserDto } from '@emptyfridge/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createHousehold,
  createRecoveryCode,
  createTransferTicket,
  getMe,
  joinHousehold,
  logout,
  recoverIdentity,
  redeemTransfer,
  revokeOtherSessions,
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

/** Enlace temporal para abrir esta identidad en otro dispositivo. */
export function useCreateTransferTicket() {
  return useMutation({ mutationFn: createTransferTicket });
}

export function useRedeemTransfer() {
  const onSuccess = useAuthSuccessHandler();
  return useMutation({ mutationFn: redeemTransfer, onSuccess });
}

/** Genera un código de recuperación nuevo; invalida el anterior. */
export function useCreateRecoveryCode() {
  return useMutation({ mutationFn: createRecoveryCode });
}

export function useRecoverIdentity() {
  const onSuccess = useAuthSuccessHandler();
  return useMutation({ mutationFn: recoverIdentity, onSuccess });
}

/** Cierra la sesión en el resto de dispositivos, conservando la actual. */
export function useRevokeOtherSessions() {
  return useMutation({ mutationFn: revokeOtherSessions });
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
