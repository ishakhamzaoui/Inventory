export function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatCurrency(value: number, currency: string): string {
  return `${formatNumber(value, 0)} ${currency}`;
}
