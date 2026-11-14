import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import type { ItemDto } from '@emptyfridge/contracts';
import { Check, Trash2 } from 'lucide-react';
import { memo } from 'react';

export interface ItemRowProps {
  item: ItemDto;
  onToggle: (variables: { id: string; checked: boolean }) => void;
  onRemove: (item: ItemDto) => void;
}

/**
 * Fila de la lista. Va memoizada y recibe las acciones desde `ListPage`:
 * así un cambio en un producto (o el sondeo cada 3 s) no vuelve a renderizar
 * las demás filas, que es lo que hacía lento el teclado en listas largas.
 */
export const ItemRow = memo(function ItemRow({ item, onToggle, onRemove }: ItemRowProps) {
  const quantityLabel = formatQuantity(item.quantity, item.unit);

  return (
    <li
      className={cn(
        'item-row flex items-center gap-1 rounded-2xl bg-white px-2 py-1 shadow-sm ring-1 ring-stone-200/60 transition-opacity',
        item.checked && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle({ id: item.id, checked: !item.checked })}
        aria-pressed={item.checked}
        aria-label={item.checked ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left"
      >
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            item.checked
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-stone-300 text-transparent',
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>

        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className={cn(
              'min-w-0 truncate text-[15px] font-medium text-stone-800',
              item.checked && 'line-through',
            )}
          >
            {item.name}
          </span>
          {quantityLabel ? (
            <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
              {quantityLabel}
            </span>
          ) : null}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Eliminar ${item.name}`}
        className="shrink-0 rounded-xl p-2 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
});
