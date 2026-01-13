export function formatCurrency(cents: number | null | undefined) {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("fr-BE");
}
