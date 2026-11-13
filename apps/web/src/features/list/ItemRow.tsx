import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import type { ItemDto } from '@emptyfridge/contracts';
import { Check, Trash2 } from 'lucide-react';
import { useDeleteItem, useToggleItem } from './hooks';

export function ItemRow({ item }: { item: ItemDto }) {
  const toggle = useToggleItem();
  const remove = useDeleteItem();
  const quantityLabel = formatQuantity(item.quantity, item.unit);

  return (
    <li
      className={cn(
        'flex items-center gap-1 rounded-2xl bg-white px-2 py-1 shadow-sm ring-1 ring-stone-200/60 transition-opacity',
        item.checked && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={() => toggle.mutate({ id: item.id, checked: !item.checked })}
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
        onClick={() => remove.mutate(item)}
        aria-label={`Eliminar ${item.name}`}
        className="shrink-0 rounded-xl p-2 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
