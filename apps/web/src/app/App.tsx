import { ListPage } from '@/features/list/ListPage';
import { InstallAppProvider } from '@/features/pwa/InstallAppProvider';
import { Spinner } from '@/shared/ui/Spinner';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedLayout } from './ProtectedLayout';
import { queryClient } from './query-client';

// Las pantallas de entrada y las secundarias van en chunks aparte: así el
// arranque de la lista no carga zod ni el resto de páginas (ver AGENTS.md).
const OnboardingPage = lazy(() =>
  import('@/features/household/OnboardingPage').then((module) => ({
    default: module.OnboardingPage,
  })),
);
const JoinHouseholdPage = lazy(() =>
  import('@/features/auth/JoinHouseholdPage').then((module) => ({
    default: module.JoinHouseholdPage,
  })),
);
const TransferPage = lazy(() =>
  import('@/features/auth/TransferPage').then((module) => ({ default: module.TransferPage })),
);
const HouseholdPage = lazy(() =>
  import('@/features/household/HouseholdPage').then((module) => ({
    default: module.HouseholdPage,
  })),
);
const MostUsedPage = lazy(() =>
  import('@/features/list/MostUsedPage').then((module) => ({ default: module.MostUsedPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <InstallAppProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/join" element={<JoinHouseholdPage />} />
              <Route path="/join/:code" element={<JoinHouseholdPage />} />
              <Route path="/transfer/:code" element={<TransferPage />} />
              <Route path="/recover/:code" element={<TransferPage mode="recovery" />} />

              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<ListPage />} />
                <Route path="/most-used" element={<MostUsedPage />} />
                <Route path="/household" element={<HouseholdPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </InstallAppProvider>
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
