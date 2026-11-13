import type { AppOutletContext } from '@/app/ProtectedLayout';
import { Button } from '@/shared/ui/Button';
import { LogoMark } from '@/shared/ui/Logo';
import { Spinner } from '@/shared/ui/Spinner';
import type { ItemDto } from '@emptyfridge/contracts';
import { CheckCheck, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AddItemForm } from './AddItemForm';
import { FinishDialog } from './FinishDialog';
import { ItemRow } from './ItemRow';
import { useCurrentList, useFinishList, useReopenList } from './hooks';

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
  const { user, setCanFinish, registerFinishHandler } = useOutletContext<AppOutletContext>();
  const current = useCurrentList();
  const finish = useFinishList();
  const reopen = useReopenList();
  const [finishOpen, setFinishOpen] = useState(false);

  const items = current.data?.list?.items ?? [];
  const lastFinished = current.data?.lastFinished ?? null;
  const pending = items.filter((item) => !item.checked);
  const checked = items.filter((item) => item.checked);
  const canFinish = items.length > 0 && !current.isLoading && !current.isError;

  useEffect(() => {
    setCanFinish(canFinish);
    return () => setCanFinish(false);
  }, [canFinish, setCanFinish]);

  useEffect(() => {
    registerFinishHandler(() => setFinishOpen(true));
    return () => registerFinishHandler(null);
  }, [registerFinishHandler]);

  return (
    <div className="px-4">
      <div className="list-add-bar sticky top-0 z-10 -mx-4 bg-stone-50/85 px-4 pb-2 pt-2 backdrop-blur-xl lg:top-0">
        <AddItemForm />
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
        lastFinished ? (
          <div className="mt-4 flex flex-col items-center rounded-3xl border border-emerald-200 bg-emerald-50/60 px-6 py-8 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
              <CheckCheck className="h-7 w-7" />
            </span>
            <p className="text-base font-semibold text-stone-800">Compra finalizada</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              {lastFinished.closedBy
                ? lastFinished.closedBy.id === user.id
                  ? 'La has finalizado tú.'
                  : `La finalizó ${lastFinished.closedBy.displayName}.`
                : 'La compra se ha cerrado.'}
              {lastFinished.itemCount > 0
                ? ` ${lastFinished.itemCount} ${
                    lastFinished.itemCount === 1 ? 'producto' : 'productos'
                  }.`
                : ''}
            </p>
            <p className="mt-1 text-xs text-stone-400">Si ha sido un error, puedes recuperarla.</p>

            <Button
              size="lg"
              variant="secondary"
              className="mt-4 w-full"
              loading={reopen.isPending}
              onClick={() => reopen.mutate(lastFinished.id)}
            >
              <Undo2 className="h-5 w-5" />
              Revertir compra
            </Button>
            <p className="mt-2 text-[10px] text-stone-300">Solo durante 30 minutos.</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-stone-200 bg-white/60 px-6 py-10 text-center">
            <LogoMark className="mb-3 h-14 w-14 opacity-80" />
            <p className="text-sm font-semibold text-stone-700">
              La lista está vacía, {user.displayName}
            </p>
            <p className="mt-1 text-xs text-stone-400">Añade lo que falta y aparecerá aquí.</p>
          </div>
        )
      ) : (
        <div className="list-bottom-space pt-2">
          {pending.length === 0 ? (
            <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
              Todo comprado. Pulsa «Finalizar».
            </div>
          ) : null}

          <ItemSection title="Pendientes" items={pending} />
          <ItemSection title="En el carrito" items={checked} />
        </div>
      )}

      {canFinish ? (
        <div className="finish-action fixed inset-x-0 z-20 px-3 lg:hidden">
          <div className="mx-auto w-full max-w-lg md:max-w-2xl">
            <button
              type="button"
              onClick={() => setFinishOpen(true)}
              aria-label="Finalizar compra"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.7)] transition-colors hover:bg-emerald-700 active:bg-emerald-800"
            >
              <CheckCheck className="h-5 w-5" />
              Finalizar compra
            </button>
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
