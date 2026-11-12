import { cn } from '@/shared/lib/cn';

/**
 * Logo oficial de ErFrigovacio: la nevera vacía con la puerta abierta.
 * Se usa como marca cuadrada en cabeceras, onboarding y estados vacíos.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/icons/icon-192.png"
      alt=""
      aria-hidden="true"
      className={cn('shrink-0 rounded-[22%] object-cover ring-1 ring-stone-900/5', className)}
    />
  );
}
