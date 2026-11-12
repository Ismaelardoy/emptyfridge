import { cn } from '@/shared/lib/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70', className)}
      {...props}
    />
  );
}
