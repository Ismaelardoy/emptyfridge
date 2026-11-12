import { Button } from '@/shared/ui/Button';
import type { Unit } from '@emptyfridge/contracts';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { useAddItem } from './hooks';

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'ud', label: 'ud' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'L', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'paquete', label: 'paquete' },
];

export function AddItemForm({ suggestions }: { suggestions: string[] }) {
  const mutation = useAddItem();
  const inputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit | ''>('');
  const [showDetails, setShowDetails] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const rawQuantity = quantity.trim().replace(',', '.');
    const parsedQuantity = rawQuantity === '' ? undefined : Number(rawQuantity);

    try {
      await mutation.mutateAsync({
        name: trimmed,
        quantity:
          parsedQuantity !== undefined && Number.isFinite(parsedQuantity)
            ? parsedQuantity
            : undefined,
        unit: unit === '' ? undefined : unit,
      });
    } catch {
      // El hook ya muestra el error; conservamos lo escrito para reintentar.
      return;
    }

    setName('');
    setQuantity('');
    setUnit('');
    setShowDetails(false);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-stone-200/70">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Añadir producto…"
          aria-label="Producto"
          list="item-suggestions"
          autoComplete="off"
          maxLength={80}
          className="h-11 min-w-0 flex-1 rounded-2xl border-0 bg-transparent px-2 text-base text-stone-900 outline-none placeholder:text-stone-400"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Añadir producto"
          disabled={!name.trim()}
          className="shrink-0 rounded-full"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <datalist id="item-suggestions">
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      <div className="mt-1 flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showDetails ? 'Ocultar' : 'Cantidad y unidad'}
        </button>
        {name.trim() ? (
          <span className="hidden text-[11px] text-stone-300 sm:block">Enter para añadir</span>
        ) : null}
      </div>

      {showDetails ? (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-stone-100 pt-2">
          <label className="text-xs font-medium text-stone-500">
            Unidad
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value as Unit | '')}
              className="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-white px-2 text-sm text-stone-800 outline-none focus:border-emerald-500"
            >
              <option value="">Sin unidad</option>
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-stone-500">
            Cantidad
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="1"
              className="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none placeholder:text-stone-300 focus:border-emerald-500"
            />
          </label>
        </div>
      ) : null}
    </form>
  );
}
