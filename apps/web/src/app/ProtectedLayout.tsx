import { useMe } from '@/features/auth/hooks';
import { cn } from '@/shared/lib/cn';
import { LogoMark } from '@/shared/ui/Logo';
import { Spinner } from '@/shared/ui/Spinner';
import type { UserDto } from '@emptyfridge/contracts';
import { Flame, ListChecks, Users } from 'lucide-react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';

export interface AppOutletContext {
  user: UserDto;
}

const NAV_ITEMS = [
  { to: '/', label: 'Lista', icon: ListChecks, end: true },
  { to: '/most-used', label: 'Más usados', icon: Flame, end: false },
  { to: '/household', label: 'Hogar', icon: Users, end: false },
] as const;

export function ProtectedLayout() {
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-semibold text-stone-700">No se pudo conectar con el servidor</p>
        <p className="text-xs text-stone-500">{me.error.message}</p>
        <button
          type="button"
          onClick={() => void me.refetch()}
          className="mt-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!me.data) {
    return <Navigate to="/onboarding" replace />;
  }

  const user = me.data;
  if (!user.household) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="lg:flex lg:min-h-dvh">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-stone-200/70 lg:bg-white/80 lg:px-4 lg:py-6">
        <div className="flex items-center gap-2.5 px-2">
          <LogoMark className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-stone-900">ErFrigovacio</p>
            <p className="truncate text-xs text-stone-500">{user.household.name}</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200/60">
          <p className="truncate text-sm font-semibold text-stone-800">{user.displayName}</p>
          <p className="text-[11px] text-stone-400">
            {user.household.role === 'owner' ? 'Propietario' : 'Miembro'}
          </p>
        </div>
      </aside>

      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-stone-50 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[2rem] sm:shadow-xl sm:ring-1 sm:ring-stone-200/70 md:max-w-2xl lg:my-0 lg:min-h-dvh lg:max-w-none lg:flex-1 lg:rounded-none lg:shadow-none lg:ring-0">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-stone-200/70 bg-stone-50/90 px-4 backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <LogoMark className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-stone-900">
                ErFrigovacio
              </p>
              <p className="truncate text-xs text-stone-500">{user.household.name}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 lg:px-8 lg:py-6">
          <div className="mx-auto w-full lg:max-w-4xl">
            <Outlet context={{ user }} />
          </div>
        </main>

        <nav className="sticky bottom-0 z-20 border-t border-stone-200/70 bg-white/90 pb-safe backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-3 md:max-w-2xl">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                    isActive ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600',
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
