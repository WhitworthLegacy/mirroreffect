export const ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// Accepter slash OU tiret comme séparateur (comme l'admin formatDate ligne 1063)
const DDMMYYYY_REGEX = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;

function pad(value: string): string {
  return value.padStart(2, "0");
}

function formatFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = pad(String(date.getMonth() + 1));
  const day = pad(String(date.getDate()));
  return `${year}-${month}-${day}`;
}

export function normalizeDateToISO(value: unknown): string | null {
  if (!value) {
    return null;
  }

  // Gérer les objets Date (Google Sheets peut renvoyer des Date objects)
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return formatFromDate(value);
  }

  // Convertir en string
  const input = typeof value === "string" ? value.trim() : String(value).trim();
  if (!input) {
    return null;
  }

  // Si déjà au format ISO (YYYY-MM-DD)
  if (ISO_REGEX.test(input)) {
    return input;
  }

  // Si format ISO avec heure (YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DDTHH:mm:ss.000Z)
  // ⚠️ IMPORTANT: Extraire directement YYYY-MM-DD de la chaîne pour éviter les problèmes de timezone
  // Sinon "2026-01-24T23:00:00.000Z" peut devenir "2026-01-25" selon le timezone local
  if (input.includes("T")) {
    // Extraire directement la partie date (avant le "T")
    const datePart = input.split("T")[0];
    if (ISO_REGEX.test(datePart)) {
      return datePart; // Retourner directement YYYY-MM-DD sans conversion Date
    }
    // Fallback: essayer Date si le format n'est pas standard
    const date = new Date(input);
    if (!Number.isNaN(date.getTime())) {
      return formatFromDate(date);
    }
  }

  // Format DD/MM/YYYY
  const matches = input.match(DDMMYYYY_REGEX);
  if (matches) {
    const day = pad(matches[1]);
    const month = pad(matches[2]);
    const year = matches[3];
    return `${year}-${month}-${day}`;
  }

  // Tentative avec Date constructor (fallback pour formats variés)
  const dateFromString = new Date(input);
  if (!Number.isNaN(dateFromString.getTime())) {
    // Vérifier que ce n'est pas une date invalide qui a été interprétée
    // (Date peut parser des choses bizarres, donc on vérifie)
    const parsed = dateFromString.toISOString().split("T")[0];
    if (ISO_REGEX.test(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function formatISOToDDMMYYYY(iso: string): string | null {
  if (!ISO_REGEX.test(iso)) return null;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Convertit n'importe quel format de date en "DD/MM/YYYY" (texte pour Google Sheets)
 * Accepte: YYYY-MM-DD, DD/MM/YYYY, Date object, ISO datetime
 * Retourne toujours "DD/MM/YYYY" ou null si invalide
 */
export function toDDMMYYYY(input: unknown): string | null {
  if (!input) {
    return null;
  }

  // Si déjà au format DD/MM/YYYY
  const ddmm = typeof input === "string" ? input.trim() : String(input).trim();
  const ddmmMatch = ddmm.match(DDMMYYYY_REGEX);
  if (ddmmMatch) {
    const day = pad(ddmmMatch[1]);
    const month = pad(ddmmMatch[2]);
    const year = ddmmMatch[3];
    return `${day}/${month}/${year}`;
  }

  // Convertir en ISO d'abord, puis en DD/MM/YYYY
  const iso = normalizeDateToISO(input);
  if (!iso) {
    return null;
  }

  return formatISOToDDMMYYYY(iso);
}

/**
 * Convertit une date/heure en format "DD/MM/YYYY HH:mm" (texte pour Google Sheets)
 * Accepte: ISO datetime, Date object
 */
export function toDDMMYYYYHHmm(input: unknown): string | null {
  if (!input) {
    return null;
  }

  let date: Date | null = null;

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return null;
    }
    date = input;
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    // Si c'est déjà un format ISO datetime
    if (trimmed.includes("T")) {
      date = new Date(trimmed);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
    } else {
      // Sinon, essayer de normaliser comme date seule
      const iso = normalizeDateToISO(input);
      if (iso) {
        date = new Date(`${iso}T00:00:00`);
      }
    }
  }

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  const day = pad(String(date.getDate()));
  const month = pad(String(date.getMonth() + 1));
  const year = date.getFullYear();
  const hours = pad(String(date.getHours()));
  const minutes = pad(String(date.getMinutes()));

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
