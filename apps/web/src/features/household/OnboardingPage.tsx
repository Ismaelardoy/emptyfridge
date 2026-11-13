import { useCreateHousehold, useMe } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Spinner } from '@/shared/ui/Spinner';
import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function OnboardingPage() {
  const me = useMe();
  const create = useCreateHousehold();
  const navigate = useNavigate();
  const [name, setName] = useState('Mi casa');

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
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between bg-stone-50 px-5 py-10 sm:max-w-xl lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10 lg:py-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center lg:flex-none lg:items-start lg:text-left">
        <img
          src="/brand/logo-oficial.webp"
          alt="ErFrigovacio"
          className="mb-6 w-full max-w-sm rounded-3xl shadow-sm ring-1 ring-stone-200/60 lg:max-w-md"
        />
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          ¿Otra vez no queda leche?
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500 sm:text-base">
          Apunta lo que falta, compártelo con los tuyos y que nadie vuelva a comprar tres paquetes
          de arroz.
        </p>
      </div>

      <div className="w-full space-y-3 lg:max-w-md lg:justify-self-end">
        <form onSubmit={submit} className="space-y-3">
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
          <Button type="submit" size="lg" className="w-full" loading={create.isPending}>
            Crear lista y empezar
          </Button>
        </form>

        <Button size="lg" variant="secondary" className="w-full" onClick={() => navigate('/join')}>
          Ya tengo una lista
        </Button>
      </div>
    </div>
  );
}
