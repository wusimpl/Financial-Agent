export function formatCurrency(value?: number | null, digits = 2) {
  if (value === null || value === undefined) return '—';
  return `$${value.toFixed(digits)}`;
}

export function formatNumber(value?: number | null, digits = 2) {
  if (value === null || value === undefined) return '—';
  return value.toFixed(digits);
}

export function formatWholeNumber(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString();
}

export function formatMoneyAmount(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return `$${value.toLocaleString()}`;
}

export function hasNumber(value?: number | null): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}
