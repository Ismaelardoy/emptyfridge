import { pluralize } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import { Flame, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAddItem, useMostUsed } from './hooks';

export function MostUsedPage() {
  const mostUsed = useMostUsed();
  const add = useAddItem();
  const products = mostUsed.data?.products ?? [];

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold tracking-tight text-stone-900">Más usados</h1>

      {mostUsed.isLoading ? (
        <Spinner />
      ) : mostUsed.isError ? (
        <div className="mt-4 rounded-3xl bg-white p-6 text-center ring-1 ring-stone-200/70">
          <p className="text-sm font-semibold text-stone-700">
            No se pudieron cargar los más usados
          </p>
          <p className="mt-1 text-xs text-stone-500">{mostUsed.error.message}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void mostUsed.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-stone-200 bg-white/60 px-6 py-10 text-center">
          <Flame className="mb-3 h-8 w-8 text-stone-300" />
          <p className="text-sm font-semibold text-stone-700">
            Todavía no hay productos frecuentes
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Añade cosas a la lista y aparecerán aquí para repetirlas más rápido.
          </p>
          <Link
            to="/"
            className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Ir a la lista
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
          {products.map((product, index) => (
            <li
              key={product.name}
              data-testid="most-used-item"
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200/60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-stone-800">
                  {product.name}
                </span>
                <span className="text-[11px] text-stone-400">
                  {product.count} {pluralize(product.count, 'vez', 'veces')}
                </span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                aria-label={`Añadir ${product.name} a la lista`}
                loading={add.isPending && add.variables?.name === product.name}
                onClick={() => add.mutate({ name: product.name })}
              >
                <Plus className="h-4 w-4" />
                Añadir
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
