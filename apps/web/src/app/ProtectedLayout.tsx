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
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-stone-50 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[2rem] sm:shadow-xl sm:ring-1 sm:ring-stone-200/70">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-stone-200/70 bg-stone-50/90 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <LogoMark className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-stone-900">ErFrigovacio</p>
            <p className="truncate text-xs text-stone-500">{user.household.name}</p>
          </div>
        </div>
        <NavLink
          to="/household"
          aria-label="Tu hogar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200"
        >
          {user.displayName.charAt(0).toUpperCase()}
        </NavLink>
      </header>

      <main className="flex-1">
        <Outlet context={{ user }} />
      </main>

      <nav className="sticky bottom-0 z-20 border-t border-stone-200/70 bg-white/90 pb-safe backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3">
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
  );
}
