"use client";

import { useEffect } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";

/**
 * Composant qui charge les données "Clients" et "Stats" une seule fois au montage
 * Utilisé dans le layout pour garantir le chargement initial
 */
export default function AdminDataLoader() {
  const { loadAll } = useSheetsStore();

  useEffect(() => {
    // Charger une seule fois au montage (Clients + Stats en parallèle)
    loadAll();
  }, [loadAll]);

  // Ce composant ne rend rien
  return null;
}
