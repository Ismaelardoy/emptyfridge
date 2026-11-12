import { JoinHouseholdPage } from '@/features/auth/JoinHouseholdPage';
import { TransferPage } from '@/features/auth/TransferPage';
import { HouseholdPage } from '@/features/household/HouseholdPage';
import { OnboardingPage } from '@/features/household/OnboardingPage';
import { ListPage } from '@/features/list/ListPage';
import { MostUsedPage } from '@/features/list/MostUsedPage';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedLayout } from './ProtectedLayout';
import { queryClient } from './query-client';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
