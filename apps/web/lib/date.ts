export const ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DDMMYYYY_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function pad(value: string): string {
  return value.padStart(2, "0");
}

function formatFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = pad(String(date.getMonth() + 1));
  const day = pad(String(date.getDate()));
  return `${year}-${month}-${day}`;
}

export function normalizeDateToISO(value: unknown): string {
  if (!value) {
    throw new Error("Date value is empty");
  }
  const input = typeof value === "string" ? value.trim() : "";
  if (!input) {
    throw new Error("Date value is empty");
  }

  if (ISO_REGEX.test(input)) {
    return input;
  }

  if (input.includes("T")) {
    const date = new Date(input);
    if (!Number.isNaN(date.getTime())) {
      return formatFromDate(date);
    }
  }

  const matches = input.match(DDMMYYYY_REGEX);
  if (matches) {
    const day = pad(matches[1]);
    const month = pad(matches[2]);
    const year = matches[3];
    return `${year}-${month}-${day}`;
  }

  throw new Error(`Invalid date format: ${input}`);
}

export function formatISOToDDMMYYYY(iso: string): string | null {
  if (!ISO_REGEX.test(iso)) return null;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
