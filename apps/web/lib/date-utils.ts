export function normalizeToISO(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (str.includes("T")) {
    const date = new Date(str);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const dd = match[1].padStart(2, "0");
    const mm = match[2].padStart(2, "0");
    const yyyy = match[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

export function normalizeToFR(value: unknown): string | null {
  const iso = normalizeToISO(value);
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function sameDate(a: unknown, b: unknown): boolean {
  const isoA = normalizeToISO(a);
  const isoB = normalizeToISO(b);
  return !!isoA && isoA === isoB;
}

export function formatEuros(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function generateLeadId(): string {
  return `LEAD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
