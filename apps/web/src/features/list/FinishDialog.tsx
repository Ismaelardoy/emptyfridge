import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

export function FinishDialog({
  open,
  onClose,
  pendingCount,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  pendingCount: number;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Finalizar compra">
      <p className="text-sm leading-6 text-stone-600">
        La compra se cerrará y los productos contarán para vuestros más usados.
        {pendingCount > 0
          ? ` Quedan ${pendingCount} productos sin marcar; al finalizar se marcarán todos como comprados.`
          : ' ¡Está todo marcado!'}
      </p>

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={onConfirm} loading={isPending}>
          Finalizar
        </Button>
      </div>
    </Modal>
  );
}
