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
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      // Gérer format YYYY-MM si besoin
      if (/^\d{4}-\d{2}$/.test(str)) return `${str}-01`;
      return str;
    };

    return studentsRows
      .map((row, rowIndex) => {
        const getRowCol = (headerName: string): unknown => {
          const idx = studentsHeaders.findIndex((h) => String(h).trim() === headerName);
          return idx >= 0 ? row[idx] : null;
        };

        // Mapper selon les headers de la feuille Students (chercher plusieurs variantes)
        const event_date = parseDate(
          getRowCol("event_date") || 
          getRowCol("Date Event") || 
          getRowCol("Date") ||
          getRowCol("date")
        );
        
        const student_name = getRowCol("student_name") 
          ? String(getRowCol("student_name")).trim() 
          : getRowCol("Etudiant") 
            ? String(getRowCol("Etudiant")).trim() 
            : null;
        
        // Si pas de student_name ou event_date, ignorer cette ligne
        if (!student_name || !event_date) return null;

        return {
          event_id: getRowCol("event_id") || getRowCol("Event ID") 
            ? String(getRowCol("event_id") || getRowCol("Event ID")).trim() 
            : `student-${rowIndex}`,
          event_date: event_date,
          client_name: (getRowCol("client_name") || getRowCol("Nom")) 
            ? String(getRowCol("client_name") || getRowCol("Nom")).trim() 
            : null,
          student_name: student_name,
          student_hours: parseEuropeanNumber(
            getRowCol("hours") || 
            getRowCol("Heures Etudiant") || 
            getRowCol("Heures") ||
            getRowCol("student_hours")
          ),
          student_rate_cents: parseEuropeanNumberToCents(
            getRowCol("rate") || 
            getRowCol("Etudiant €/Event") || 
            getRowCol("Taux") ||
            getRowCol("student_rate_cents") ||
            getRowCol("avg_rate_cents")
          ),
          total_cents: parseEuropeanNumberToCents(
            getRowCol("total") || 
            getRowCol("Total") || 
            getRowCol("Total (€)") ||
            getRowCol("total_cents") ||
            getRowCol("remuneration_cents")
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
