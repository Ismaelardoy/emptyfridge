import { AuthScene } from '@/features/auth/AuthScene';
import { useMe, useRecoverIdentity, useRedeemTransfer } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import {
  RECOVERY_CODE_REGEX,
  TRANSFER_CODE_REGEX,
  normalizeRecoveryCode,
  normalizeTransferCode,
} from '@emptyfridge/contracts';
import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

type OpenMode = 'transfer' | 'recovery';

/**
 * Abre una identidad ya existente en otro dispositivo.
 * - `transfer`: vale temporal de 10 min y un solo uso (móvil a mano).
 * - `recovery`: código de recuperación de larga duración (móvil perdido).
 * En ningún caso crea cuenta ni identidad nueva.
 */
export function TransferPage({ mode = 'transfer' }: { mode?: OpenMode }) {
  const me = useMe();
  const transfer = useRedeemTransfer();
  const recovery = useRecoverIdentity();
  const redeem = mode === 'transfer' ? transfer : recovery;
  const navigate = useNavigate();
  const params = useParams<{ code?: string }>();
  const started = useRef(false);
  const { mutate } = redeem;

  const code = params.code
    ? mode === 'transfer'
      ? normalizeTransferCode(params.code)
      : normalizeRecoveryCode(params.code)
    : '';
  const looksLikeCode = (mode === 'transfer' ? TRANSFER_CODE_REGEX : RECOVERY_CODE_REGEX).test(
    code,
  );

  useEffect(() => {
    if (me.isLoading || me.data?.household || !looksLikeCode || started.current) {
      return;
    }
    started.current = true;
    mutate(
      { code },
      {
        onSuccess: () => navigate('/', { replace: true }),
      },
    );
  }, [me.isLoading, me.data?.household, looksLikeCode, code, mutate, navigate]);

  if (me.isLoading) {
    return (
      <AuthScene>
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </AuthScene>
    );
  }

  if (me.data?.household) {
    return <Navigate to="/" replace />;
  }

  const failed = !looksLikeCode || redeem.isError;

  return (
    <AuthScene>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
        <p className="auth-rise text-center text-[10px] font-bold tracking-[0.34em] text-stone-600 uppercase">
          erfrigovacio
        </p>
        {failed ? (
          <>
            <h1 className="auth-rise text-center text-[1.9rem] font-black tracking-[-0.04em] text-stone-900">
              No se pudo abrir
            </h1>
            <p className="auth-rise mt-2 text-center text-sm leading-6 text-stone-600">
              {looksLikeCode && redeem.isError
                ? redeem.error.message
                : mode === 'transfer'
                  ? 'Este enlace no es válido. Pide otro en el móvil que ya tiene la lista.'
                  : 'Este código no es válido. Revisa que esté completo.'}
            </p>
            <div className="mt-6 space-y-3">
              <Button
                size="lg"
                className="w-full shadow-[0_12px_28px_-14px_rgba(5,150,105,0.75)]"
                onClick={() => navigate('/join', { replace: true })}
              >
                Probar con otro código
              </Button>
              <button
                type="button"
                onClick={() => navigate('/onboarding', { replace: true })}
                className="mx-auto block rounded-xl px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-stone-800"
              >
                Crear una lista nueva
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-rise text-center text-[1.9rem] font-black tracking-[-0.04em] text-stone-900">
              Abriendo tu lista…
            </h1>
            <p className="auth-rise mt-2 text-center text-sm leading-6 text-stone-600">
              Un momento, estamos trayendo tu identidad a este móvil.
            </p>
            <Spinner className="py-4" label="" />
          </>
        )}
      </main>
    </AuthScene>
  );
}
