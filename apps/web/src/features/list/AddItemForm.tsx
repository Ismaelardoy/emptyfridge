import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import type { Unit } from '@emptyfridge/contracts';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useAddItem } from './hooks';

// Solo en la primera entrada de la sesión: al abrir la app con la lista dentro,
// el teclado aparece listo para escribir sin robar el foco en cada navegación.
let autofocusAttempted = false;

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'ud', label: 'ud' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'L', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'paquete', label: 'paquete' },
];

export function AddItemForm() {
  const mutation = useAddItem();
  const inputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit | ''>('');
  const [showDetails, setShowDetails] = useState(false);
  const [detailsAutoOpened, setDetailsAutoOpened] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);

    if (value.trim() === '') {
      setShowDetails(false);
      setDetailsAutoOpened(false);
    } else if (!detailsAutoOpened) {
      setShowDetails(true);
      setDetailsAutoOpened(true);
    }
  };

  useEffect(() => {
    if (autofocusAttempted) {
      return;
    }
    autofocusAttempted = true;

    // Sin cleanup: en StrictMode el primer montaje se desmonta y el ref vuelve
    // a apuntar al input del segundo montaje, así que el foco sigue llegando.
    const focus = () => {
      if (document.activeElement === document.body) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };
    focus();
    window.setTimeout(focus, 180);
  }, []);

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
    setDetailsAutoOpened(false);
    inputRef.current?.focus();
  };

  const hasDetails = quantity.trim() !== '' || unit !== '';

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-200/70">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Añadir producto…"
          aria-label="Producto"
          autoComplete="off"
          maxLength={80}
          className="h-10 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-2 text-base text-stone-900 outline-none placeholder:text-stone-400"
        />

        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          aria-label="Cantidad y unidad"
          aria-expanded={showDetails}
          title="Cantidad y unidad"
          className={cn(
            'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
            showDetails || hasDetails
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasDetails && !showDetails ? (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          ) : null}
        </button>

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
