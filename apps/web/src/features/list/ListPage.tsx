import type { AppOutletContext } from '@/app/ProtectedLayout';
import { pluralize } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { LogoMark } from '@/shared/ui/Logo';
import { Spinner } from '@/shared/ui/Spinner';
import type { ItemDto } from '@emptyfridge/contracts';
import { CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AddItemForm } from './AddItemForm';
import { FinishDialog } from './FinishDialog';
import { ItemRow } from './ItemRow';
import { useCurrentList, useFinishList, useSuggestions } from './hooks';

function ItemSection({ title, items }: { title: string; items: ItemDto[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-5">
      <h2 className="mb-2 flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
        <span>{title}</span>
        <span>{items.length}</span>
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export function ListPage() {
  const { user } = useOutletContext<AppOutletContext>();
  const current = useCurrentList();
  const suggestions = useSuggestions();
  const finish = useFinishList();
  const [finishOpen, setFinishOpen] = useState(false);

  const items = current.data?.list?.items ?? [];
  const pending = items.filter((item) => !item.checked);
  const checked = items.filter((item) => item.checked);

  return (
    <div className="px-4">
      <div className="sticky top-14 z-10 -mx-4 bg-stone-50/95 px-4 pb-3 pt-4 backdrop-blur lg:top-0">
        <AddItemForm suggestions={suggestions.data?.suggestions ?? []} />
      </div>

      {current.isLoading ? (
        <Spinner />
      ) : current.isError ? (
        <div className="mt-4 rounded-3xl bg-white p-6 text-center ring-1 ring-stone-200/70">
          <p className="text-sm font-semibold text-stone-700">No se pudo cargar la lista</p>
          <p className="mt-1 text-xs text-stone-500">{current.error.message}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void current.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-stone-200 bg-white/60 px-6 py-10 text-center">
          <LogoMark className="mb-3 h-14 w-14 opacity-80" />
          <p className="text-sm font-semibold text-stone-700">
            La lista está vacía, {user.displayName}
          </p>
          <p className="mt-1 text-xs text-stone-400">Añade lo que falta y aparecerá aquí.</p>
        </div>
      ) : (
        <div className="pt-2 pb-40">
          {pending.length === 0 ? (
            <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
              Todo comprado. Pulsa «Finalizar compra».
            </div>
          ) : null}

          <ItemSection title="Pendientes" items={pending} />
          <ItemSection title="En el carrito" items={checked} />
        </div>
      )}

      {items.length > 0 && !current.isLoading && !current.isError ? (
        <div className="finish-dock fixed inset-x-0 z-20 flex justify-center px-4 lg:left-64">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200/70 bg-stone-50/95 p-3 shadow-lg backdrop-blur lg:max-w-2xl">
            <Button size="lg" className="w-full" onClick={() => setFinishOpen(true)}>
              <CheckCheck className="h-5 w-5" />
              Finalizar compra
            </Button>
            <p className="mt-1 text-center text-[11px] text-stone-400">
              {pending.length} {pluralize(pending.length, 'pendiente', 'pendientes')} ·{' '}
              {checked.length} en el carrito
            </p>
          </div>
        </div>
      ) : null}

      <FinishDialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        pendingCount={pending.length}
        isPending={finish.isPending}
        onConfirm={() => finish.mutate(undefined, { onSuccess: () => setFinishOpen(false) })}
      />
    </div>
  );
}
