import { formatRelativeTime } from '@/shared/lib/format';
import type { RecentAdditionDto } from '@emptyfridge/contracts';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { useState } from 'react';

const COLLAPSED_COUNT = 4;

/**
 * Historial flotante de quién ha añadido cada producto. Cada alta es una
 * pieza suelta, sin marco contenedor, y entra con una animación suave.
 */
export function RecentAdditions({ entries }: { entries: RecentAdditionDto[] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return null;
  }

  const visible = expanded ? entries : entries.slice(0, COLLAPSED_COUNT);
  const hidden = entries.length - visible.length;

  return (
    <section className="mt-7 px-1">
      <h2 className="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
        <History className="h-3 w-3" aria-hidden />
        Quién añadió qué
        <span className="relative ml-0.5 flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      </h2>

      <div className="mt-2.5 space-y-2">
        {visible.map((entry, index) => (
          <div
            key={entry.id}
            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            className="history-float flex items-center gap-2.5 rounded-2xl bg-white/90 px-3 py-2 shadow-[0_10px_24px_-16px_rgba(28,25,23,0.45)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">
              {(entry.addedBy?.displayName ?? '?').charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-stone-400">
              <span className="font-semibold text-stone-700">
                {entry.addedBy?.displayName ?? 'Alguien'}
              </span>{' '}
              añadió <span className="font-medium text-stone-500">{entry.itemName}</span>
            </span>
            <span className="shrink-0 text-[10px] text-stone-300">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-500 shadow-sm transition-all hover:-translate-y-0.5 hover:text-stone-700"
        >
          <ChevronDown className="h-3 w-3" />
          Ver {hidden} más
        </button>
      ) : expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-500 shadow-sm transition-all hover:-translate-y-0.5 hover:text-stone-700"
        >
          <ChevronUp className="h-3 w-3" />
          Ver menos
        </button>
      ) : null}
    </section>
  );
}
