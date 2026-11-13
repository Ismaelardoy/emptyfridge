import { useMe } from '@/features/auth/hooks';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { LogoMark } from '@/shared/ui/Logo';
import { Spinner } from '@/shared/ui/Spinner';
import type { UserDto } from '@emptyfridge/contracts';
import { CheckCheck, Flame, ListChecks, Users } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';

export interface AppOutletContext {
  user: UserDto;
  setCanFinish: (value: boolean) => void;
  registerFinishHandler: (handler: (() => void) | null) => void;
}

const NAV_ITEMS = [
  { to: '/', label: 'Lista', icon: ListChecks, end: true },
  { to: '/most-used', label: 'Más usados', icon: Flame, end: false },
  { to: '/household', label: 'Hogar', icon: Users, end: false },
] as const;

// En móvil la lista va en el centro, con un botón elevado y más grande.
const MOBILE_NAV_ITEMS = [NAV_ITEMS[1], NAV_ITEMS[0], NAV_ITEMS[2]] as const;

export function ProtectedLayout() {
  const me = useMe();
  const location = useLocation();
  const isListPage = location.pathname === '/';
  const [canFinish, setCanFinish] = useState(false);
  const finishHandler = useRef<(() => void) | null>(null);

  const requestFinish = useCallback(() => {
    finishHandler.current?.();
  }, []);

  const registerFinishHandler = useCallback((handler: (() => void) | null) => {
    finishHandler.current = handler;
  }, []);

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

        <div className="mt-auto space-y-2">
          {isListPage && canFinish ? (
            <Button className="w-full" onClick={requestFinish}>
              <CheckCheck className="h-4 w-4" />
              Finalizar compra
            </Button>
          ) : null}

          <div className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200/60">
            <p className="truncate text-sm font-semibold text-stone-800">{user.displayName}</p>
            <p className="text-[11px] text-stone-400">
              {user.household.role === 'owner' ? 'Propietario' : 'Miembro'}
            </p>
          </div>
        </div>
      </aside>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-stone-50 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[2rem] sm:shadow-xl sm:ring-1 sm:ring-stone-200/70 md:max-w-2xl lg:my-0 lg:min-h-dvh lg:max-w-none lg:flex-1 lg:rounded-none lg:shadow-none lg:ring-0">
        <div aria-hidden className="app-wash" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-44 overflow-hidden rounded-t-[2rem] app-hero lg:hidden"
        >
          <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -right-16 -top-10 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl" />

          <LogoMark className="absolute -left-8 top-9 h-40 w-40 -rotate-12 opacity-[0.06]" />

          <p className="absolute right-2 top-8 max-w-[78%] truncate text-4xl font-black tracking-tighter text-stone-900/[0.04]">
            {user.household.name}
          </p>

          <div className="absolute right-4 top-3 flex items-center justify-end gap-1.5 opacity-55">
            <LogoMark className="h-6 w-6" />
            <div className="min-w-0 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                ErFrigovacio
              </p>
              <p className="max-w-[9rem] truncate text-[10px] font-medium text-stone-400">
                {user.household.name}
              </p>
            </div>
          </div>
        </div>

        <main className="relative z-10 flex-1 lg:px-8 lg:py-6">
          <div className="mx-auto w-full lg:max-w-4xl">
            <Outlet context={{ user, setCanFinish, registerFinishHandler }} />
          </div>
        </main>

        <nav className="sticky bottom-0 z-20 px-3 pb-safe pt-2 lg:hidden">
          <div className="mx-auto w-full max-w-lg md:max-w-2xl">
            <div className="rounded-[1.75rem] border border-stone-200/70 bg-white/90 p-1.5 shadow-[0_10px_32px_rgba(28,25,23,0.14)] backdrop-blur-xl">
              <div className="grid grid-cols-3 items-center gap-1 px-1.5">
                {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon, end }, index) => {
                  const center = index === 1;

                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className="flex flex-col items-center gap-0.5"
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex h-10 items-center justify-center">
                            {center ? (
                              <span
                                className={cn(
                                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                                  isActive
                                    ? 'bg-emerald-600 text-white shadow-[0_6px_16px_-8px_rgba(5,150,105,0.8)]'
                                    : 'bg-emerald-50 text-emerald-700',
                                )}
                              >
                                <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden />
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                                  isActive ? 'bg-emerald-100 text-emerald-700' : 'text-stone-400',
                                )}
                              >
                                <Icon className="h-[18px] w-[18px]" aria-hidden />
                              </span>
                            )}
                          </span>

                          <span
                            className={cn(
                              'text-[10px]',
                              center ? 'font-semibold' : 'font-medium',
                              isActive
                                ? 'text-emerald-700'
                                : center
                                  ? 'text-stone-500'
                                  : 'text-stone-400',
                            )}
                          >
                            {label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
