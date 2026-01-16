"use client";

import { useEffect } from "react";
import { useClientsStore } from "@/lib/clientsStore";

/**
 * Composant qui charge les données "Clients" une seule fois au montage
 * Utilisé dans le layout pour garantir le chargement initial
 */
export default function AdminDataLoader() {
  const { loadOnce } = useClientsStore();

  useEffect(() => {
    // Charger une seule fois au montage
    loadOnce();
  }, [loadOnce]);

  // Ce composant ne rend rien
  return null;
}
