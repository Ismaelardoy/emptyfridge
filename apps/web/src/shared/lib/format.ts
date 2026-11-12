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
