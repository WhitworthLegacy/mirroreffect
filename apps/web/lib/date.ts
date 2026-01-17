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
