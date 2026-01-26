"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventRow, PackRow } from "@/lib/adminData";
import { useSheetsStore } from "@/lib/sheetsStore";

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
  b2b: "B2B",
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
  if (value.includes("T")) {
    return value.split("T")[0];
  }
  return value;
}

export default function EventModal({ event, packs, onClose, onSaved, isNew = false }: Props) {
  const { getLocalEvent, updateLocal, saveEvent, isDirty, isLoading: storeLoading, applyEventPatch, applyEventReplace } = useSheetsStore();

  const localEvent = isNew ? null : (event?.id ? getLocalEvent(event.id) : null);
  const [draft, setDraft] = useState<EventRow | null>(localEvent || event);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = !isNew && event?.id ? isDirty(event.id) : false;

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
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

    if (!isNew && event?.id) {
      updateLocal(event.id, { [key]: value } as Record<string, unknown>);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (dirty && !window.confirm("Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?")) {
        return;
      }
      onClose();
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

    if (!isNew && event?.id && dirty) {
      setIsSaving(true);
      setError(null);
      try {
        await saveEvent(event.id);
        applyEventPatch(event.id, draft);
        onSaved(draft);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur sauvegarde");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Hard data only - no calculated fields
      const payload: Record<string, unknown> = {
        event_date: draft.event_date || null,
        event_type: draft.event_type,
        language: draft.language,
        client_name: draft.client_name,
        client_email: draft.client_email,
        client_phone: draft.client_phone,
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
        closing_date: draft.closing_date || null,
        // Keep these for sync to Google Sheets
        student_name: draft.student_name || null,
        commercial_name: draft.commercial_name || null,
      };

      if (isNew) {
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
        applyEventReplace(updatedEvent);
        onSaved(updatedEvent);
      } else {
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

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{isNew ? "Nouvel événement" : (draft.client_name || "Event")}</h2>
            <p className="admin-muted">{draft.event_date || "Date à définir"}</p>
            {dirty && (
              <p style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: 4 }}>
                Modifications non sauvegardées
              </p>
            )}
          </div>
          <button type="button" className="admin-chip" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="admin-modal-body">
          {/* Section Client */}
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Client</h3>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Nom</span>
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
          </div>

          {/* Section Event */}
          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Événement</h3>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Date</span>
              <input
                type="date"
                value={toDateInput(draft.event_date)}
                onChange={(e) => updateField("event_date", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Type</span>
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
              <span>Status</span>
              <select
                value={draft.status ?? "active"}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="active">Actif</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Invités</span>
              <input
                type="number"
                value={draft.guest_count ?? ""}
                onChange={(e) => updateField("guest_count", e.target.value ? parseInt(e.target.value) : null)}
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
              <span>Contact sur place</span>
              <input
                type="text"
                value={draft.on_site_contact ?? ""}
                onChange={(e) => updateField("on_site_contact", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Date closing</span>
              <input
                type="date"
                value={toDateInput(draft.closing_date ?? null)}
                onChange={(e) => updateField("closing_date", e.target.value || null)}
              />
            </label>
          </div>

          {/* Section Tarification - Hard data only */}
          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Tarification</h3>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Pack</span>
              <select
                value={draft.pack_id ?? ""}
                onChange={(e) => {
                  const packId = e.target.value || null;
                  updateField("pack_id", packId);
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
              <span>Total Pack (€)</span>
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
              <span>Solde dû (€)</span>
              <input
                type="text"
                value={formatEuro(draft.balance_due_cents)}
                onChange={(e) => updateField("balance_due_cents", parseEuro(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Solde payé?</span>
              <select
                value={draft.balance_status ?? "pending"}
                onChange={(e) => updateField("balance_status", e.target.value)}
              >
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
              </select>
            </label>
          </div>

          {/* Section Assignations (for reference, managed in Google Sheets) */}
          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Assignations</h3>
          <div className="admin-form-grid">
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
              <span>Commercial</span>
              <input
                type="text"
                value={draft.commercial_name ?? ""}
                onChange={(e) => updateField("commercial_name", e.target.value || null)}
                placeholder="Nom du commercial"
              />
            </label>
          </div>

          <p style={{ marginTop: 16, fontSize: "0.75rem", color: "var(--gray-muted)", fontStyle: "italic" }}>
            Les calculs (marge, KM, coûts) sont gérés dans Google Sheets.
          </p>

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
