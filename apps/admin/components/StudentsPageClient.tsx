"use client";

import { useMemo } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";
import StudentsView from "@/components/StudentsView";

// Helper pour parser format européen
function parseEuropeanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  let num: number;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/\s/g, "");
    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      num = parseFloat(normalized);
    } else {
      num = parseFloat(cleaned);
    }
  } else {
    num = Number(value);
  }
  return Number.isNaN(num) ? null : num;
}

function parseEuropeanNumberToCents(value: unknown): number | null {
  const num = parseEuropeanNumber(value);
  return num === null ? null : Math.round(num * 100);
}

export default function StudentsPageClient() {
  const { studentsRows, studentsHeaders, isLoading, error } = useSheetsStore();

  // Mapper Students rows -> StudentEvent format
  // La feuille Students contient les données par événement avec étudiant
  const studentEvents = useMemo(() => {
    if (!studentsRows.length || !studentsHeaders.length) return [];

    // Helper pour parser une date
    const parseDate = (value: unknown): string | null => {
      if (!value) return null;
      const str = String(value).trim();
      if (!str) return null;
      // Format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      // Format YYYY-MM
      if (/^\d{4}-\d{2}$/.test(str)) return `${str}-01`;
      // Format MM-YYYY (ex: 10-2025) - convert to YYYY-MM-01
      const mmYYYY = str.match(/^(\d{1,2})-(\d{4})$/);
      if (mmYYYY) {
        const month = mmYYYY[1].padStart(2, "0");
        const year = mmYYYY[2];
        return `${year}-${month}-01`;
      }
      return str;
    };

    return studentsRows
      .map((row, rowIndex) => {
        const getRowCol = (headerName: string): unknown => {
          const idx = studentsHeaders.findIndex((h) => String(h).trim() === headerName);
          return idx >= 0 ? row[idx] : null;
        };

        // Mapper selon les headers de la feuille Students
        // Headers attendus: Date, Etudiant, Heures, Heures corrigés, Rémunération, Total
        const event_date = parseDate(
          getRowCol("Date") ||
          getRowCol("date") ||
          getRowCol("Date Event") ||
          getRowCol("event_date")
        );

        const student_name = getRowCol("Etudiant")
          ? String(getRowCol("Etudiant")).trim()
          : getRowCol("student_name")
            ? String(getRowCol("student_name")).trim()
            : null;

        // Si pas de student_name ou event_date, ignorer cette ligne
        if (!student_name || !event_date) return null;

        return {
          event_id: `student-${rowIndex}`,
          event_date: event_date,
          client_name: null, // Pas de colonne Nom dans ta feuille Students
          student_name: student_name,
          student_hours: parseEuropeanNumber(
            getRowCol("Heures") ||
            getRowCol("Heures corrigés") ||
            getRowCol("hours") ||
            getRowCol("Heures Etudiant")
          ),
          student_rate_cents: parseEuropeanNumberToCents(
            getRowCol("Rémunération") ||
            getRowCol("rate") ||
            getRowCol("Etudiant €/Event")
          ),
          total_cents: parseEuropeanNumberToCents(
            getRowCol("Total") ||
            getRowCol("total")
          ),
        };
      })
      .filter((event): event is NonNullable<typeof event> => event !== null && event.student_name !== null);
  }, [studentsRows, studentsHeaders]);

  return (
    <>
      {error && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}
      {isLoading && !studentEvents.length && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <p className="admin-muted">Chargement des événements...</p>
        </div>
      )}
      <StudentsView studentEvents={studentEvents} />
    </>
  );
}
