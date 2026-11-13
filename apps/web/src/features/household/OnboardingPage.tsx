import { AuthScene } from '@/features/auth/AuthScene';
import { useCreateHousehold, useMe } from '@/features/auth/hooks';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Spinner } from '@/shared/ui/Spinner';
import { type FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ONBOARDING_COPY } from './onboarding-copy';

export function OnboardingPage() {
  const me = useMe();
  const create = useCreateHousehold();
  const navigate = useNavigate();
  const [name, setName] = useState('Mi casa');
  const [copyIndex, setCopyIndex] = useState(0);
  const [copyVisible, setCopyVisible] = useState(true);

  // Las frases se turnan despacio: primero se desvanecen y luego entra la
  // siguiente. Con movimiento reducido se queda la primera.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let fadeTimer = 0;
    const id = window.setInterval(() => {
      setCopyVisible(false);
      fadeTimer = window.setTimeout(() => {
        setCopyIndex((index) => (index + 1) % ONBOARDING_COPY.length);
        setCopyVisible(true);
      }, 700);
    }, 13_000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fadeTimer);
    };
  }, []);

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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const householdName = name.trim();
    if (!householdName) {
      return;
    }

    create.mutate(
      { name: householdName },
      {
        onSuccess: () => navigate('/', { replace: true }),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <AuthScene>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
        <p
          className="auth-rise text-center text-[12px] font-bold tracking-[0.32em] text-stone-600 uppercase"
          style={{ animationDelay: '40ms' }}
        >
          erfrigovacio
        </p>
        <div className="auth-rise mt-3 grid" style={{ animationDelay: '70ms' }}>
          {ONBOARDING_COPY.map((copy, index) => {
            const active = index === copyIndex;

            return (
              <div
                key={copy.title}
                aria-hidden={!active}
                className={cn(
                  'col-start-1 row-start-1 transition-opacity ease-in-out',
                  copyVisible ? 'duration-1000' : 'duration-700',
                  active && copyVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
              >
                <h1 className="text-center text-[2rem] leading-[1.1] font-black tracking-[-0.04em] text-stone-900 sm:text-[2.6rem]">
                  {copy.title}
                </h1>
                <p className="mx-auto mt-2 max-w-[23rem] text-center text-base leading-6 text-stone-600 sm:text-[17px]">
                  {copy.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={submit}
          className="auth-rise mt-8 space-y-3"
          style={{ animationDelay: '170ms' }}
        >
          <Field
            label="Nombre de la lista"
            placeholder="Mi casa"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            autoComplete="organization"
            autoFocus
            required
          />
          <Button
            type="submit"
            size="lg"
            className="w-full shadow-[0_12px_28px_-14px_rgba(5,150,105,0.75)]"
            loading={create.isPending}
          >
            Crear mi lista
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/join')}
          className="auth-rise mx-auto mt-6 rounded-xl px-2 py-1.5 text-base font-medium text-stone-600 transition-colors hover:text-stone-800"
          style={{ animationDelay: '220ms' }}
        >
          Ya tengo una lista
        </button>
      </main>
    </AuthScene>
  );
}
