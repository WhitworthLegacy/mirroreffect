export function formatEuros(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function generateLeadId(): string {
  return `LEAD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
