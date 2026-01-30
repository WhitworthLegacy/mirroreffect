"use client";

import { useEffect, useRef } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";

/**
 * Composant qui charge les données "Clients" et "Stats" une seule fois au montage
 * Utilisé dans le layout pour garantir le chargement initial
 *
 * IMPORTANT: Uses ref guard to prevent multiple fetches in StrictMode
 * and on rapid remounts (e.g., AdminGuard state transitions)
 */
export default function AdminDataLoader() {
  const loadAll = useSheetsStore((state) => state.loadAll);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Guard: only fetch once per component lifecycle
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Charger une seule fois au montage (Clients + Stats en parallèle)
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ce composant ne rend rien
  return null;
}
