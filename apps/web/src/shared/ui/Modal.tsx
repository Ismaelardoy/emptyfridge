import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      onClose={onClose}
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0"
    >
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar el diálogo"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-stone-950/40 backdrop-blur-sm"
        />

        <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-lg font-bold text-stone-900">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </dialog>
  );
}
