"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventRow, PackRow } from "@/lib/adminData";
import { useClientsStore } from "@/lib/clientsStore";

type Props = {
  event: EventRow | null;
  packs: PackRow[];
  onClose: () => void;
  onSaved: (event: EventRow) => void;
  isNew?: boolean;
};

const EVENT_TYPES: Record<string, string> = {
  wedding: "Mariage",
  corporate: "Entreprise",
  birthday: "Anniversaire",
  baptism: "Baptême",
  babyshower: "Baby Shower",
  other: "Autre",
};

const EVENT_TYPES_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(EVENT_TYPES).map(([k, v]) => [v, k])
);

function formatEuro(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const euros = cents / 100;
  return euros.toFixed(2).replace(".", ",");
}

function parseEuro(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}

function toDateInput(value: string | null) {
  if (!value) return "";
  // Handle ISO date strings
  if (value.includes("T")) {
    return value.split("T")[0];
  }
  return value;
}

export default function EventModal({ event, packs, onClose, onSaved, isNew = false }: Props) {
  const { getLocalEvent, updateLocal, saveEvent, isDirty, loading: storeLoading } = useClientsStore();
  
  // Pour les nouveaux events, utiliser un state local
  // Pour les events existants, lire depuis le store (mais garder un draft local pour éviter les problèmes de sync)
  const localEvent = isNew ? null : (event?.id ? getLocalEvent(event.id) : null);
  const [draft, setDraft] = useState<EventRow | null>(localEvent || event);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = !isNew && event?.id ? isDirty(event.id) : false;

  // Synchroniser draft avec le store quand localEvent change (mais seulement pour events existants)
  useEffect(() => {
    if (!isNew && localEvent) {
      setDraft(localEvent);
    } else if (isNew) {
      setDraft(event);
    }
    setError(null);
  }, [localEvent, event, isNew]);

  const packMap = useMemo(() => {
    const map = new Map<string, string>();
    packs.forEach((pack) => {
      if (!pack.id) return;
      map.set(pack.id, pack.name_fr || pack.code || "Pack");
    });
    return map;
  }, [packs]);

  const reversePackMap = useMemo(() => {
    const map = new Map<string, string>();
    packs.forEach((pack) => {
      const name = pack.name_fr || pack.code || "Pack";
      if (pack.id) map.set(name, pack.id);
    });
    return map;
  }, [packs]);

  const packPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    packs.forEach((pack) => {
      if (!pack.id) return;
      map.set(pack.id, pack.price_current_cents || 0);
    });
    return map;
  }, [packs]);

  const packOptions = useMemo(() => {
    return packs
      .filter((pack) => pack.id)
      .map((pack) => ({
        id: pack.id!,
        name: pack.name_fr || pack.code || "Pack"
      }));
  }, [packs]);

  if (!event || !draft) return null;

  const updateField = <K extends keyof EventRow>(key: K, value: EventRow[K]) => {
    // Mettre à jour le draft local (pour l'affichage immédiat)
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    
    // Pour les events existants, mettre à jour aussi le store
    if (!isNew && event?.id) {
      updateLocal(event.id, { [key]: value } as Record<string, unknown>);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      // Si des modifications non sauvegardées, demander confirmation
      if (dirty && !window.confirm("Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?")) {
        return;
      }
      onClose();
    }
  };

  // Auto-calculate commercial commission (10% of pack price)
  const calculateCommission = () => {
    const packPrice = draft.total_cents || 0;
    return Math.round(packPrice * 0.10);
  };

  const handleRecalculate = async () => {
    if (!draft?.address) {
      setError("Veuillez entrer une adresse pour recalculer");
      return;
    }

    setIsRecalculating(true);
    setError(null);
    try {
      const res = await fetch("/api/events/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: draft.id, address: draft.address })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur recalcul");
      }
      const data = await res.json();
      const patch = {
        km_one_way: data.km_one_way,
        km_total: data.km_total,
        fuel_cost_cents: data.fuel_cost_cents,
        student_hours: data.student_hours,
        student_rate_cents: data.student_rate_cents,
        commercial_commission_cents: calculateCommission()
      };
      // Mettre à jour le draft local
      setDraft((prev) => prev ? { ...prev, ...patch } : prev);
      // Update via le store avec les valeurs recalculées
      if (!isNew && draft?.id) {
        updateLocal(draft.id, patch);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur recalcul");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draft.id })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur suppression");
      }
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur suppression");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    
    // Pour les events existants avec des modifications, utiliser le store
    if (!isNew && event?.id && dirty) {
      setIsSaving(true);
      setError(null);
      try {
        await saveEvent(event.id);
        onSaved(draft);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur sauvegarde");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Pour les nouveaux events ou les events sans modifications, utiliser l'ancienne API
    setIsSaving(true);
    setError(null);
    try {
      // All fields in single payload (no more separate finance)
      const payload: Record<string, unknown> = {
        event_date: draft.event_date || null,
        event_type: draft.event_type,
        language: draft.language,
        client_name: draft.client_name,
        client_email: draft.client_email,
        client_phone: draft.client_phone,
        zone_id: draft.zone_id,
        status: draft.status,
        total_cents: draft.total_cents,
        transport_fee_cents: draft.transport_fee_cents,
        deposit_cents: draft.deposit_cents,
        balance_due_cents: draft.balance_due_cents,
        balance_status: draft.balance_status,
        pack_id: draft.pack_id,
        address: draft.address,
        on_site_contact: draft.on_site_contact,
        guest_count: draft.guest_count,
        // Finance fields (now in same table)
        student_name: draft.student_name || null,
        student_hours: draft.student_hours || null,
        student_rate_cents: draft.student_rate_cents || null,
        km_one_way: draft.km_one_way || null,
        km_total: draft.km_total || null,
        fuel_cost_cents: draft.fuel_cost_cents || null,
        commercial_name: draft.commercial_name || null,
        commercial_commission_cents: draft.commercial_commission_cents || calculateCommission(),
        // Invoice refs
        deposit_invoice_ref: draft.deposit_invoice_ref || null,
        balance_invoice_ref: draft.balance_invoice_ref || null,
        invoice_deposit_paid: draft.invoice_deposit_paid || false,
        invoice_balance_paid: draft.invoice_balance_paid || false,
        closing_date: draft.closing_date || null,
      };

      if (isNew) {
        // Create new event
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Erreur création");
        }
        const data = await res.json();
        const updatedEvent = { ...draft, id: data.item.id };
        onSaved(updatedEvent);
      } else {
        // Update existing event (fallback si pas de modifications via store)
        const res = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: [{
              id: draft.id,
              event: payload
            }]
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Erreur sauvegarde");
        }
        onSaved(draft);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const eventTypeFr = draft.event_type ? (EVENT_TYPES[draft.event_type] || draft.event_type) : "";

  // Calculate gross margin (finance fields now directly in draft)
  const totalRevenue = (draft.total_cents || 0) + (draft.transport_fee_cents || 0);
  const studentCost = (draft.student_hours || 0) * (draft.student_rate_cents || 1400);
  const fuelCost = draft.fuel_cost_cents || 0;
  const commercialCost = draft.commercial_commission_cents || calculateCommission();
  const calculatedMargin = totalRevenue - studentCost - fuelCost - commercialCost;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{isNew ? "Nouvel événement" : (draft.client_name || "Event")}</h2>
            <p className="admin-muted">{draft.event_date || "Date à définir"}</p>
            {dirty && (
              <p style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: 4 }}>
                ⚠️ Modifications non sauvegardées
              </p>
            )}
          </div>
          <button type="button" className="admin-chip" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="admin-modal-body">
          {/* Section Client */}
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Nom client</span>
              <input
                type="text"
                value={draft.client_name ?? ""}
                onChange={(e) => updateField("client_name", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                value={draft.client_email ?? ""}
                onChange={(e) => updateField("client_email", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Téléphone</span>
              <input
                type="text"
                value={draft.client_phone ?? ""}
                onChange={(e) => updateField("client_phone", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Langue</span>
              <select
                value={draft.language ?? "fr"}
                onChange={(e) => updateField("language", e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="nl">Néerlandais</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Type d&apos;événement</span>
              <select
                value={eventTypeFr}
                onChange={(e) => {
                  const key = EVENT_TYPES_REVERSE[e.target.value] || e.target.value;
                  updateField("event_type", key);
                }}
              >
                <option value="">—</option>
                {Object.values(EVENT_TYPES).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Date événement</span>
              <input
                type="date"
                value={toDateInput(draft.event_date)}
                onChange={(e) => updateField("event_date", e.target.value)}
              />
            </label>
            <label className="admin-field" style={{ gridColumn: 'span 2' }}>
              <span>Adresse</span>
              <input
                type="text"
                value={draft.address ?? ""}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Nombre d&apos;invités</span>
              <input
                type="number"
                value={draft.guest_count ?? ""}
                onChange={(e) => updateField("guest_count", e.target.value ? parseInt(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>Contact sur place</span>
              <input
                type="text"
                value={draft.on_site_contact ?? ""}
                onChange={(e) => updateField("on_site_contact", e.target.value)}
              />
            </label>
            <label className="admin-field" style={{ gridColumn: 'span 2' }}>
              <span>Commentaires</span>
              <textarea
                rows={3}
                value={draft.zone_id ?? ""}
                onChange={(e) => updateField("zone_id", e.target.value)}
              />
            </label>
          </div>

          {/* Section Tarification */}
          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Tarification</h3>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Pack</span>
              <select
                value={draft.pack_id ?? ""}
                onChange={(e) => {
                  const packId = e.target.value || null;
                  updateField("pack_id", packId);
                  // Auto-set pack price
                  if (packId) {
                    const price = packPriceMap.get(packId);
                    if (price) updateField("total_cents", price);
                  }
                }}
              >
                <option value="">—</option>
                {packOptions.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Pack (€)</span>
              <input
                type="text"
                value={formatEuro(draft.total_cents)}
                onChange={(e) => updateField("total_cents", parseEuro(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Transport (€)</span>
              <input
                type="text"
                value={formatEuro(draft.transport_fee_cents)}
                onChange={(e) => updateField("transport_fee_cents", parseEuro(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Acompte (€)</span>
              <input
                type="text"
                value={formatEuro(draft.deposit_cents)}
                onChange={(e) => updateField("deposit_cents", parseEuro(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Solde (€)</span>
              <input
                type="text"
                value={formatEuro(draft.balance_due_cents)}
                onChange={(e) => updateField("balance_due_cents", parseEuro(e.target.value))}
              />
            </label>
          </div>

          {/* Section Finance & Logistique */}
          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 12 }}>
            Finance & Logistique
            <button
              type="button"
              className="admin-chip"
              onClick={handleRecalculate}
              disabled={isRecalculating || !draft.address || isNew}
              style={{ fontSize: 12, padding: '4px 8px' }}
            >
              {isRecalculating ? "Calcul..." : "Recalculer"}
            </button>
          </h3>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>KM aller</span>
              <input
                type="number"
                step="0.1"
                value={draft.km_one_way ?? ""}
                onChange={(e) => updateField("km_one_way", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>KM total</span>
              <input
                type="number"
                step="0.1"
                value={draft.km_total ?? ""}
                onChange={(e) => updateField("km_total", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>Coût essence (€)</span>
              <input
                type="text"
                value={formatEuro(draft.fuel_cost_cents)}
                onChange={(e) => updateField("fuel_cost_cents", parseEuro(e.target.value))}
              />
            </label>
            <div style={{ gridColumn: 'span 1' }} />

            <label className="admin-field">
              <span>Étudiant</span>
              <input
                type="text"
                value={draft.student_name ?? ""}
                onChange={(e) => updateField("student_name", e.target.value || null)}
                placeholder="Nom de l'étudiant"
              />
            </label>
            <label className="admin-field">
              <span>Heures</span>
              <input
                type="number"
                step="0.5"
                value={draft.student_hours ?? ""}
                onChange={(e) => updateField("student_hours", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>Taux horaire (€)</span>
              <input
                type="text"
                value={formatEuro(draft.student_rate_cents)}
                onChange={(e) => updateField("student_rate_cents", parseEuro(e.target.value))}
                placeholder="14,00"
              />
            </label>
            <label className="admin-field">
              <span>Total étudiant (€)</span>
              <input
                type="text"
                value={formatEuro(studentCost)}
                disabled
                style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.7 }}
              />
            </label>

            <label className="admin-field">
              <span>Commercial</span>
              <input
                type="text"
                value={draft.commercial_name ?? ""}
                onChange={(e) => updateField("commercial_name", e.target.value || null)}
                placeholder="Nom du commercial"
              />
            </label>
            <label className="admin-field">
              <span>Commission 10% (€)</span>
              <input
                type="text"
                value={formatEuro(draft.commercial_commission_cents ?? calculateCommission())}
                onChange={(e) => updateField("commercial_commission_cents", parseEuro(e.target.value))}
              />
            </label>
            <label className="admin-field" style={{ gridColumn: 'span 2' }}>
              <span>Marge brute (€)</span>
              <input
                type="text"
                value={formatEuro(calculatedMargin)}
                disabled
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  fontWeight: 700,
                  color: calculatedMargin >= 0 ? 'var(--success)' : 'var(--danger)'
                }}
              />
            </label>
          </div>

          {error && <p style={{ color: 'var(--danger)', marginTop: 16 }}>{error}</p>}
        </div>
        <div className="admin-modal-footer">
          {!isNew && (
            <button
              type="button"
              className="admin-chip danger"
              onClick={handleDelete}
              disabled={isSaving}
              style={{ marginRight: 'auto' }}
            >
              Supprimer
            </button>
          )}
          <button type="button" className="admin-chip" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="admin-chip primary"
            onClick={handleSave}
            disabled={isSaving || storeLoading || (!isNew && !dirty)}
          >
            {isSaving || storeLoading ? "Sauvegarde..." : (isNew ? "Créer" : "Sauvegarder")}
          </button>
        </div>
      </div>
    </div>
  );
}
