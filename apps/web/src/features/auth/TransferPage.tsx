import { useMe, useRecoverIdentity, useRedeemTransfer } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/Button';
import { LogoMark } from '@/shared/ui/Logo';
import { Spinner } from '@/shared/ui/Spinner';
import {
  RECOVERY_CODE_REGEX,
  TRANSFER_CODE_REGEX,
  normalizeRecoveryCode,
  normalizeTransferCode,
} from '@emptyfridge/contracts';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

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
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (me.data?.household) {
    return <Navigate to="/" replace />;
  }

  const failed = !looksLikeCode || redeem.isError;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-stone-50 px-5 py-10 sm:max-w-xl sm:px-8">
      <div className="flex items-start gap-3">
        <LogoMark className="h-14 w-14" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            ErFrigovacio
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            {failed ? 'No se pudo abrir' : 'Abriendo tu lista…'}
          </h1>
        </div>
      </div>

      {failed ? (
        <>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            {looksLikeCode && redeem.isError
              ? redeem.error.message
              : mode === 'transfer'
                ? 'Este enlace no es válido. Pide otro en el móvil que ya tiene la lista.'
                : 'Este código no es válido. Revisa que esté completo.'}
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/join', { replace: true })}>
            Probar con otro código
          </Button>
          <Link
            to="/onboarding"
            className="mt-3 inline-flex items-center justify-center gap-1 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Un momento, estamos trayendo tu identidad a este móvil.
          </p>
          <div className="mt-8 flex justify-center">
            <Spinner />
          </div>
        </>
      )}
    </div>
  );
}
