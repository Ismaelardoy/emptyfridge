import { cn } from '@/shared/lib/cn';
import { type InputHTMLAttributes, useId } from 'react';

export function Field({
  label,
  hint,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-[15px] font-medium text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          'h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          className,
        )}
        {...props}
      />
      {hint ? (
        <span id={hintId} className="block text-xs text-stone-500">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
