import { useJoinHousehold, useLogout, useMe } from '@/features/auth/hooks';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { LogoMark } from '@/shared/ui/Logo';
import { Spinner } from '@/shared/ui/Spinner';
import {
  INVITE_CODE_REGEX,
  RECOVERY_CODE_REGEX,
  TRANSFER_CODE_REGEX,
  normalizeAccessCode,
} from '@emptyfridge/contracts';
import { ArrowLeft } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
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

      <p className="mt-5 text-sm leading-6 text-stone-500">
        Pega el enlace o el código de tu hogar. Sin cuenta ni contraseña.
      </p>

      <form onSubmit={submitAccess} className="mt-5 space-y-4">
        <Field
          label="Enlace o código"
          placeholder="Enlace o código"
          value={accessInput}
          onChange={(event) => setAccessInput(event.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="font-mono tracking-[0.12em]"
          autoFocus
          required
        />
        <Button type="submit" size="lg" className="w-full" disabled={!access}>
          Entrar en la lista
        </Button>
      </form>

      <Link
        to="/onboarding"
        className="mt-4 inline-flex items-center justify-center gap-1 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Crear una lista nueva
      </Link>
    </div>
  );
}
