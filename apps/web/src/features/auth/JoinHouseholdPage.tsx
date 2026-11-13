import { AuthScene } from '@/features/auth/AuthScene';
import { useJoinHousehold, useLogout, useMe } from '@/features/auth/hooks';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Spinner } from '@/shared/ui/Spinner';
import {
  INVITE_CODE_REGEX,
  RECOVERY_CODE_REGEX,
  TRANSFER_CODE_REGEX,
  normalizeAccessCode,
} from '@emptyfridge/contracts';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

type AccessKind = 'invite' | 'transfer' | 'recovery';

/**
 * Un único campo para todo: invitación del hogar, código de recuperación o
 * vale antiguo. El tipo se deduce del contenido, así no hay dos formularios
 * que parezcan lo mismo.
 */
function resolveAccessInput(value: string): { kind: AccessKind; code: string } | null {
  const urlMatch = value.trim().match(/\/(join|transfer|recover)\/([A-Za-z0-9-]+)/i);
  if (urlMatch) {
    const kind = urlMatch[1]?.toLowerCase();
    const code = normalizeAccessCode(urlMatch[2] ?? '');

    if (kind === 'invite' && INVITE_CODE_REGEX.test(code)) {
      return { kind, code };
    }
    if (kind === 'transfer' && TRANSFER_CODE_REGEX.test(code)) {
      return { kind, code };
    }
    if (kind === 'recovery' && RECOVERY_CODE_REGEX.test(code)) {
      return { kind, code };
    }
    return null;
  }

  const code = normalizeAccessCode(value);
  if (RECOVERY_CODE_REGEX.test(code)) {
    return { kind: 'recovery', code };
  }
  if (TRANSFER_CODE_REGEX.test(code)) {
    return { kind: 'transfer', code };
  }
  if (INVITE_CODE_REGEX.test(code)) {
    return { kind: 'invite', code };
  }
  return null;
}

export function JoinHouseholdPage() {
  const me = useMe();
  const join = useJoinHousehold();
  const logout = useLogout();
  const navigate = useNavigate();
  const params = useParams<{ code?: string }>();

  const [accessInput, setAccessInput] = useState(params.code ?? '');
  const routeCode = (params.code ?? '').trim().toUpperCase();
  // Solo se entra sola al abrir un enlace (/join/CODE). Escribir a mano no
  // dispara la petición: los códigos pueden tener más de 6 caracteres.
  const joiningFromLink = params.code !== undefined && INVITE_CODE_REGEX.test(routeCode);
  const access = resolveAccessInput(accessInput);
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
      <AuthScene>
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </AuthScene>
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
      <AuthScene>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
          <p className="auth-rise text-center text-[10px] font-bold tracking-[0.34em] text-stone-600 uppercase">
            erfrigovacio
          </p>
          {join.isError ? (
            <>
              <h1 className="auth-rise text-center text-2xl font-black tracking-[-0.03em] text-stone-900">
                {alreadyInHousehold ? 'Ya estás en otra lista' : 'No se pudo entrar'}
              </h1>
              <p className="auth-rise mt-2 text-center text-sm leading-6 text-stone-600">
                {alreadyInHousehold
                  ? 'Este móvil ya está en otra lista. Si quieres entrar en esta, sal de la actual. La otra lista no se borra.'
                  : join.error.message}
              </p>
              <div className="mt-6 space-y-3">
                {alreadyInHousehold ? (
                  <>
                    <Button
                      size="lg"
                      className="w-full shadow-[0_12px_28px_-14px_rgba(5,150,105,0.75)]"
                      loading={logout.isPending}
                      onClick={switchHousehold}
                    >
                      Salir de la otra lista y entrar en esta
                    </Button>
                    <button
                      type="button"
                      onClick={() => navigate('/', { replace: true })}
                      className="mx-auto block rounded-xl px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-stone-800"
                    >
                      Volver a mi lista
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="w-full shadow-[0_12px_28px_-14px_rgba(5,150,105,0.75)]"
                      onClick={() => navigate('/onboarding', { replace: true })}
                    >
                      Crear mi lista
                    </Button>
                    <button
                      type="button"
                      onClick={() => navigate('/onboarding', { replace: true })}
                      className="mx-auto block rounded-xl px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-stone-800"
                    >
                      Volver
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-rise text-center text-2xl font-black tracking-[-0.03em] text-stone-900">
                Entrando en la lista…
              </h1>
              <p className="auth-rise mt-2 text-center text-sm leading-6 text-stone-600">
                Un momento, te estamos metiendo en la lista del hogar.
              </p>
              <Spinner className="py-4" label="" />
            </>
          )}
        </main>
      </AuthScene>
    );
  }

  const submitAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!access) {
      return;
    }

    if (access.kind === 'invite') {
      navigate(`/join/${encodeURIComponent(access.code)}`);
    } else if (access.kind === 'transfer') {
      navigate(`/transfer/${access.code}`);
    } else {
      navigate(`/recover/${access.code}`);
    }
  };

  return (
    <AuthScene>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
        <p className="auth-rise text-center text-[10px] font-bold tracking-[0.34em] text-stone-600 uppercase">
          erfrigovacio
        </p>
        <h1
          className="auth-rise text-center text-[1.9rem] font-black tracking-[-0.04em] text-stone-900 sm:text-[2.4rem]"
          style={{ animationDelay: '70ms' }}
        >
          Entrar en la lista
        </h1>
        <p
          className="auth-rise mx-auto mt-2 max-w-[19rem] text-center text-sm leading-6 text-stone-600"
          style={{ animationDelay: '120ms' }}
        >
          Pega el enlace o el código que te hayan pasado.
        </p>

        <form
          onSubmit={submitAccess}
          className="auth-rise mt-7 space-y-3"
          autoComplete="on"
          style={{ animationDelay: '170ms' }}
        >
          {/* Campo oculto para que los gestores de contraseñas asocien el
              código guardado con este formulario y lo autorrellenen. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            defaultValue="erfrigovacio"
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
          />
          <Field
            label="Enlace o código"
            placeholder="Enlace o código"
            name="access"
            value={accessInput}
            onChange={(event) => setAccessInput(event.target.value)}
            autoCapitalize="characters"
            autoComplete="current-password"
            spellCheck={false}
            className="font-mono tracking-[0.1em]"
            autoFocus
            required
          />
          <Button
            type="submit"
            size="lg"
            className="w-full shadow-[0_12px_28px_-14px_rgba(5,150,105,0.75)] disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
            disabled={!access}
          >
            Entrar en la lista
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="auth-rise mx-auto mt-5 rounded-xl px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-stone-800"
          style={{ animationDelay: '220ms' }}
        >
          Crear una lista nueva
        </button>
      </main>
    </AuthScene>
  );
}
