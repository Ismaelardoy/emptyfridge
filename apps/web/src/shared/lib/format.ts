export function formatQuantity(quantity: number | null, unit: string | null): string | null {
  if (quantity === null && !unit) {
    return null;
  }
  const value = quantity ?? 1;
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted} ${unit ?? 'ud'}`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

const relativeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const shortDateFormatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

/** "hace 5 minutos", "ayer" o "12 nov" para el historial de la lista. */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60_000);
  if (Math.abs(diffMinutes) < 1) {
    return 'ahora';
  }
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return relativeFormatter.format(diffDays, 'day');
  }

  return shortDateFormatter.format(date);
}
