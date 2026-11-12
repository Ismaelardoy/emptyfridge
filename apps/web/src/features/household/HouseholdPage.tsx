import type { AppOutletContext } from '@/app/ProtectedLayout';
import {
  useCreateRecoveryCode,
  useCreateTransferTicket,
  useRevokeOtherSessions,
} from '@/features/auth/hooks';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Field } from '@/shared/ui/Field';
import { Modal } from '@/shared/ui/Modal';
import { Spinner } from '@/shared/ui/Spinner';
import type { HouseholdMemberDto, TransferTicketDto } from '@emptyfridge/contracts';
import {
  Copy,
  Crown,
  KeyRound,
  LogOut,
  MessageCircle,
  Pencil,
  Share2,
  Smartphone,
  UserMinus,
  Users,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useHousehold, useRemoveMember, useRenameHousehold, useTransferOwnership } from './hooks';

export function HouseholdPage() {
  const { user } = useOutletContext<AppOutletContext>();
  const household = useHousehold();
  const rename = useRenameHousehold();
  const removeMember = useRemoveMember();
  const transferOwnership = useTransferOwnership();

  const [renameOpen, setRenameOpen] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [removeTarget, setRemoveTarget] = useState<HouseholdMemberDto | null>(null);
  const [ownerTarget, setOwnerTarget] = useState<HouseholdMemberDto | null>(null);
  const [transferTicket, setTransferTicket] = useState<TransferTicketDto | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const createTransfer = useCreateTransferTicket();
  const createRecovery = useCreateRecoveryCode();
  const revokeOthers = useRevokeOtherSessions();

  if (household.isLoading) {
    return <Spinner />;
  }

  if (household.isError || !household.data) {
    return (
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight text-stone-900">Hogar</h1>
        <div className="mt-4 rounded-3xl bg-white p-6 text-center ring-1 ring-stone-200/70">
          <p className="text-sm font-semibold text-stone-700">No se pudo cargar el hogar</p>
          <p className="mt-1 text-xs text-stone-500">
            {household.error?.message ?? 'Inténtalo de nuevo.'}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => void household.refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const { household: home, members } = household.data;
  const isOwner = user.household?.role === 'owner';
  const inviteUrl = `${window.location.origin}/join/${home.inviteCode}`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const shareOnWhatsApp = () => {
    const message = `¡Únete a la lista de la compra de ${home.name} en erfrigovacio! ${inviteUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const shareInvite = async () => {
    try {
      await navigator.share({
        title: 'Únete a nuestro hogar',
        text: 'Únete a nuestra lista de la compra',
        url: inviteUrl,
      });
    } catch {
      // El usuario ha cancelado el diálogo de compartir.
    }
  };

  const openRename = () => {
    setHouseholdName(home.name);
    setRenameOpen(true);
  };

  const submitRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = householdName.trim();
    if (!name) {
      return;
    }
    rename.mutate(name, { onSuccess: () => setRenameOpen(false) });
  };

  const transferUrl = transferTicket
    ? `${window.location.origin}/transfer/${transferTicket.code}`
    : null;

  const generateTransfer = () => {
    createTransfer.mutate(undefined, {
      onSuccess: (ticket) => setTransferTicket(ticket),
      onError: (error) => toast.error(error.message),
    });
  };

  const copyTransfer = async () => {
    if (!transferUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(transferUrl);
      toast.success('Enlace temporal copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const shareTransfer = async () => {
    if (!transferUrl) {
      return;
    }
    try {
      await navigator.share({
        title: 'Tu lista en este móvil',
        text: 'Abre este enlace para usar tu misma identidad en otro dispositivo',
        url: transferUrl,
      });
    } catch {
      // El usuario ha cancelado el diálogo de compartir.
    }
  };

  const transferExpiresAt = transferTicket ? new Date(transferTicket.expiresAt) : null;
  const transferExpiresLabel = transferExpiresAt
    ? transferExpiresAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  const generateRecovery = () => {
    createRecovery.mutate(undefined, {
      onSuccess: ({ code }) => {
        setRecoveryCode(code);
        setRecoveryOpen(true);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const copyRecovery = async () => {
    if (!recoveryCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(recoveryCode);
      toast.success('Código copiado');
    } catch {
      toast.error('No se pudo copiar el código');
    }
  };

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold tracking-tight text-stone-900">Hogar</h1>
      <div className="mt-0.5 flex items-center gap-1.5">
        <p className="truncate text-xs text-stone-500">{home.name}</p>
        {isOwner ? (
          <button
            type="button"
            onClick={openRename}
            aria-label="Cambiar nombre del hogar"
            className="rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <Card className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
          Invitar a la familia
        </p>
        <p
          data-testid="invite-code"
          className="mt-2 font-mono text-2xl font-bold tracking-[0.25em] text-stone-900"
        >
          {home.inviteCode}
        </p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Comparte este enlace por WhatsApp. Quien lo abra entrará directamente en la lista, sin
          crear cuenta.
        </p>
        <div className="mt-4 space-y-2">
          <Button
            className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5b] active:bg-[#199e4b]"
            onClick={shareOnWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            Compartir por WhatsApp
          </Button>
          <div className="flex gap-2">
            <Button className="flex-1" variant="secondary" onClick={() => void copyInvite()}>
              <Copy className="h-4 w-4" />
              Copiar enlace
            </Button>
            {canShare ? (
              <Button variant="secondary" onClick={() => void shareInvite()}>
                <Share2 className="h-4 w-4" />
                Más opciones
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">Tú</p>
        <p className="mt-2 text-sm font-medium text-stone-800">{user.displayName}</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Te recordamos en este móvil. Sin cuenta ni contraseña.
        </p>
        <div className="mt-3 rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200/70">
          <p className="text-xs font-semibold text-stone-700">Si pierdes el móvil</p>
          <p className="mt-1 text-[11px] leading-5 text-stone-500">
            Crea un código para volver a esta misma lista desde otro dispositivo. Solo se muestra
            una vez: guárdalo. Si generas otro, el anterior deja de servir.
          </p>
          <Button
            className="mt-2 w-full"
            variant="secondary"
            size="sm"
            loading={createRecovery.isPending}
            onClick={generateRecovery}
          >
            <KeyRound className="h-4 w-4" />
            {recoveryCode ? 'Generar otro código' : 'Crear código para volver'}
          </Button>
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
          Pasar la lista a otro móvil
        </p>
        <p className="mt-2 text-sm font-medium text-stone-800">La misma lista, sin cuenta ni PIN</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Abre este enlace en el otro móvil y entrarás con tu nombre de siempre. Caduca en 10
          minutos y solo vale una vez.
        </p>

        {transferTicket ? (
          <div className="mt-4 space-y-2">
            <p
              data-testid="transfer-code"
              className="font-mono text-xl font-bold tracking-[0.2em] text-stone-900"
            >
              {transferTicket.code}
            </p>
            <p className="text-[11px] text-stone-400">
              Caduca a las {transferExpiresLabel} y solo se puede usar una vez.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" variant="secondary" onClick={() => void copyTransfer()}>
                <Copy className="h-4 w-4" />
                Copiar enlace
              </Button>
              {canShare ? (
                <Button variant="secondary" onClick={() => void shareTransfer()}>
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
              ) : null}
            </div>
            <Button
              className="w-full"
              variant="secondary"
              loading={createTransfer.isPending}
              onClick={generateTransfer}
            >
              Generar otro enlace
            </Button>
          </div>
        ) : (
          <Button
            className="mt-3 w-full"
            variant="secondary"
            loading={createTransfer.isPending}
            onClick={generateTransfer}
          >
            <Smartphone className="h-4 w-4" />
            Pasar a otro móvil
          </Button>
        )}
      </Card>

      <Card className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
          Otros móviles
        </p>
        <p className="mt-2 text-sm font-medium text-stone-800">Cerrar sesión donde ya no estás</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Si perdiste un móvil o lo vendiste, cierra allí la sesión. Este seguirá abierto.
        </p>
        <Button className="mt-3 w-full" variant="secondary" onClick={() => setRevokeOpen(true)}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión en los demás móviles
        </Button>
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
          <Users className="h-3.5 w-3.5" />
          Miembros ({members.length})
        </h2>
        <ul className="space-y-2">
          {members.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-200/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-600">
                {entry.displayName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-stone-800">
                  <span className="truncate">{entry.displayName}</span>
                  {entry.id === user.id ? (
                    <span className="text-xs font-normal text-stone-400">tú</span>
                  ) : null}
                </span>
                <span className="text-[11px] text-stone-400">
                  {entry.role === 'owner' ? 'Propietario' : 'Miembro'}
                </span>
              </span>
              {isOwner && entry.id !== user.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOwnerTarget(entry)}
                    aria-label={`Hacer owner a ${entry.displayName}`}
                    title="Ceder la propiedad del hogar"
                    className="shrink-0 rounded-xl p-2 text-stone-300 transition-colors hover:bg-amber-50 hover:text-amber-600"
                  >
                    <Crown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(entry)}
                    aria-label={`Expulsar a ${entry.displayName}`}
                    className="shrink-0 rounded-xl p-2 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <Modal
        open={recoveryOpen && recoveryCode !== null}
        onClose={() => setRecoveryOpen(false)}
        title="Código para volver a entrar"
      >
        <p className="text-sm leading-6 text-stone-600">
          Apúntalo o cópialo ahora. No lo volveremos a mostrar.
        </p>
        <p
          data-testid="recovery-code"
          className="mt-4 break-all rounded-2xl bg-stone-50 px-3 py-3 text-center font-mono text-lg font-bold tracking-[0.15em] text-stone-900 ring-1 ring-stone-200"
        >
          {recoveryCode}
        </p>
        <p className="mt-2 text-[11px] leading-5 text-stone-400">
          Sirve para abrir esta misma lista en otro móvil, aunque borres las cookies o pierdas el
          teléfono. Si generas otro, este dejará de funcionar.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => void copyRecovery()}>
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
          <Button className="flex-1" onClick={() => setRecoveryOpen(false)}>
            Hecho
          </Button>
        </div>
      </Modal>

      <Modal
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        title="Cerrar sesión en los demás móviles"
      >
        <p className="text-sm leading-6 text-stone-600">
          Se cerrará la sesión en todos los móviles menos en este. Para volver a entrar en ellos
          necesitarás tu código para volver.
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setRevokeOpen(false)}
            disabled={revokeOthers.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={revokeOthers.isPending}
            onClick={() => {
              revokeOthers.mutate(undefined, {
                onSuccess: () => {
                  setRevokeOpen(false);
                  toast.success('Sesión cerrada en los demás móviles');
                },
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            Cerrar las demás
          </Button>
        </div>
      </Modal>

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Nombre del hogar">
        <form onSubmit={submitRename} className="space-y-3">
          <Field
            label="Nombre del hogar"
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
            maxLength={60}
            autoFocus
            required
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setRenameOpen(false)}
              disabled={rename.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={rename.isPending}
              disabled={!householdName.trim()}
            >
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={ownerTarget !== null}
        onClose={() => setOwnerTarget(null)}
        title={ownerTarget ? `Ceder la propiedad a ${ownerTarget.displayName}` : 'Ceder propiedad'}
      >
        <p className="text-sm leading-6 text-stone-600">
          {ownerTarget?.displayName ?? 'Esa persona'} será el único propietario y tú pasarás a
          miembro. Solo los propietarios pueden renombrar el hogar y expulsar a otros.
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setOwnerTarget(null)}
            disabled={transferOwnership.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={transferOwnership.isPending}
            onClick={() => {
              if (!ownerTarget) {
                return;
              }
              transferOwnership.mutate(ownerTarget.id, {
                onSuccess: () => setOwnerTarget(null),
              });
            }}
          >
            Ceder propiedad
          </Button>
        </div>
      </Modal>

      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={removeTarget ? `Expulsar a ${removeTarget.displayName}` : 'Expulsar miembro'}
      >
        <p className="text-sm leading-6 text-stone-600">
          Dejará de tener acceso al hogar. Si vuelve a abrir el enlace de invitación, podrá entrar
          de nuevo.
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setRemoveTarget(null)}
            disabled={removeMember.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={removeMember.isPending}
            onClick={() => {
              if (!removeTarget) {
                return;
              }
              removeMember.mutate(removeTarget.id, {
                onSuccess: () => setRemoveTarget(null),
              });
            }}
          >
            Expulsar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
