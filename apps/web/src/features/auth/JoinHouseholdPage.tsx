import { useJoinHousehold, useLogout, useMe } from '@/features/auth/hooks';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { LogoMark } from '@/shared/ui/Logo';
import { Spinner } from '@/shared/ui/Spinner';
import {
  INVITE_CODE_REGEX,
  MAX_INVITE_CODE_LENGTH,
  RECOVERY_CODE_REGEX,
  TRANSFER_CODE_REGEX,
  normalizeAccessCode,
} from '@emptyfridge/contracts';
import { ArrowLeft } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

type JoinMode = 'invite' | 'transfer';

export function JoinHouseholdPage() {
  const me = useMe();
  const join = useJoinHousehold();
  const logout = useLogout();
  const navigate = useNavigate();
  const params = useParams<{ code?: string }>();

  const [mode, setMode] = useState<JoinMode>('invite');
  const [inviteCode, setInviteCode] = useState((params.code ?? '').toUpperCase());
  const [accessInput, setAccessInput] = useState('');
  const code = inviteCode.trim().toUpperCase();
  const looksLikeCode = INVITE_CODE_REGEX.test(code);
  const routeCode = (params.code ?? '').trim().toUpperCase();
  // Solo se entra sola al abrir un enlace (/join/CODE). Escribir a mano no
  // dispara la petición: los códigos pueden tener más de 6 caracteres.
  const joiningFromLink = params.code !== undefined && INVITE_CODE_REGEX.test(routeCode);
  const accessCode = normalizeAccessCode(accessInput);
  const isTransferCode = TRANSFER_CODE_REGEX.test(accessCode);
  const isRecoveryCode = RECOVERY_CODE_REGEX.test(accessCode);
  const looksLikeAccess = isTransferCode || isRecoveryCode;
  const started = useRef(false);
  const { mutate: joinHousehold } = join;
  const alreadyInHousehold =
    join.error instanceof ApiError && join.error.code === 'ALREADY_IN_HOUSEHOLD';

  useEffect(() => {
    if (me.isLoading || !joiningFromLink || started.current) {
      return;
    }
    started.current = true;
    joinHousehold(
      { inviteCode: routeCode },
      {
        onSuccess: () => navigate('/', { replace: true }),
        onError: (error) => {
          if (!(error instanceof ApiError && error.code === 'ALREADY_IN_HOUSEHOLD')) {
            toast.error(error.message);
          }
        },
      },
    );
  }, [me.isLoading, joiningFromLink, routeCode, joinHousehold, navigate]);

  if (me.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (me.data?.household && !joiningFromLink) {
    return <Navigate to="/" replace />;
  }

  /**
   * Si este móvil ya está en otra lista, salimos de esa identidad y entramos
   * en la invitada. La lista anterior no se borra: solo dejamos de usarla aquí.
   */
  const switchHousehold = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        joinHousehold(
          { inviteCode: routeCode },
          {
            onSuccess: () => navigate('/', { replace: true }),
            onError: (error) => toast.error(error.message),
          },
        );
      },
      onError: (error) => toast.error(error.message),
    });
  };

  if (joiningFromLink) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-stone-50 px-5 py-10 sm:max-w-xl sm:px-8">
        <div className="flex items-start gap-3">
          <LogoMark className="h-14 w-14" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              ErFrigovacio
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              {join.isError
                ? alreadyInHousehold
                  ? 'Ya estás en otra lista'
                  : 'No se pudo entrar'
                : 'Entrando en la lista…'}
            </h1>
          </div>
        </div>

        {join.isError ? (
          <>
            <p className="mt-4 text-sm leading-6 text-stone-500">
              {alreadyInHousehold
                ? 'Este móvil ya está en otra lista. Si quieres entrar en esta, sal de la actual. La otra lista no se borra.'
                : join.error.message}
            </p>
            {alreadyInHousehold ? (
              <>
                <Button
                  className="mt-6 w-full"
                  loading={logout.isPending}
                  onClick={switchHousehold}
                >
                  Salir de la otra lista y entrar en esta
                </Button>
                <Link
                  to="/"
                  className="mt-3 inline-flex items-center justify-center gap-1 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a mi lista
                </Link>
              </>
            ) : (
              <>
                <Button
                  className="mt-6 w-full"
                  onClick={() => navigate('/onboarding', { replace: true })}
                >
                  Crear mi lista
                </Button>
                <Link
                  to="/onboarding"
                  className="mt-3 inline-flex items-center justify-center gap-1 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-stone-500">
              Un momento, te estamos metiendo en la lista del hogar.
            </p>
            <div className="mt-8 flex justify-center">
              <Spinner />
            </div>
          </>
        )}
      </div>
    );
  }

  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (looksLikeCode) {
      navigate(`/join/${encodeURIComponent(code)}`);
    }
  };

  const submitAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isTransferCode) {
      navigate(`/transfer/${accessCode}`);
    } else if (isRecoveryCode) {
      navigate(`/recover/${accessCode}`);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center bg-stone-50 px-5 py-10">
      <div className="flex items-start gap-3">
        <LogoMark className="h-14 w-14" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            erfrigovacio
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            Entrar en la lista
          </h1>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Cómo quieres entrar"
        className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-stone-200/60 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'invite'}
          onClick={() => setMode('invite')}
          className={cn(
            'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'invite'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700',
          )}
        >
          Me han invitado
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'transfer'}
          onClick={() => setMode('transfer')}
          className={cn(
            'rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'transfer'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700',
          )}
        >
          Ya usaba esta lista
        </button>
      </div>

      {mode === 'invite' ? (
        <div role="tabpanel" aria-label="Me han invitado">
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Pega el código o abre el enlace que te han mandado. Entrarás en su lista sin crear
            cuenta.
          </p>

          <form onSubmit={submitInvite} className="mt-6 space-y-4">
            <Field
              label="Código de invitación"
              placeholder="K7M2QX"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              maxLength={MAX_INVITE_CODE_LENGTH}
              autoCapitalize="characters"
              autoComplete="off"
              className="font-mono tracking-[0.2em]"
              autoFocus
              required
            />
            <Button type="submit" size="lg" className="w-full" disabled={!looksLikeCode}>
              Entrar en la lista
            </Button>
          </form>
        </div>
      ) : (
        <div role="tabpanel" aria-label="Ya usaba esta lista">
          <p className="mt-4 text-sm leading-6 text-stone-500">
            Si ya usabas esta lista y cambiaste de móvil o borraste los datos del navegador, pásala
            a este: en el móvil viejo abre <strong>Hogar</strong> y toca{' '}
            <strong>Iniciar sesión en otro dispositivo</strong>. Si ya no lo tienes, pide el enlace
            o el código a otra persona de la lista.
          </p>

          <form onSubmit={submitAccess} className="mt-6 space-y-4">
            <Field
              label="Enlace o código"
              placeholder="Pega aquí el enlace o el código"
              value={accessInput}
              onChange={(event) => setAccessInput(event.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="font-mono tracking-[0.12em]"
              hint="Vale el enlace de 10 minutos o el código que te hayan pasado."
              autoFocus
              required
            />
            <Button type="submit" size="lg" className="w-full" disabled={!looksLikeAccess}>
              Abrir mi lista aquí
            </Button>
          </form>
        </div>
      )}

      <Link
        to="/onboarding"
        className="mt-4 inline-flex items-center justify-center gap-1 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
    </div>
  );
}
