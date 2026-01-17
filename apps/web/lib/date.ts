export const ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DDMMYYYY_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function normalizeDateToISO(value: unknown): string | null {
  if (!value) return null;
  const input = String(value).trim();
  if (!input) return null;

  if (ISO_REGEX.test(input)) {
    return input;
  }

  const matches = input.match(DDMMYYYY_REGEX);
  if (!matches) return null;

  const day = matches[1].padStart(2, "0");
  const month = matches[2].padStart(2, "0");
  const year = matches[3];

  return `${year}-${month}-${day}`;
}

export function formatISOToDDMMYYYY(iso: string): string | null {
  if (!ISO_REGEX.test(iso)) return null;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
