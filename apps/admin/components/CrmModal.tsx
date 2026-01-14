"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventRow, PackRow } from "@/lib/adminData";

type Props = {
  event: EventRow | null;
  packs: PackRow[];
  onClose: () => void;
  onSaved: (event: EventRow) => void;
};

const PACK_OPTIONS = ["Découverte", "Essentiel", "Premium"];
const CRM_STATUSES = ["new", "devis envoyé", "won", "lost"];

function centsToInput(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  const euros = value / 100;
  return Number.isFinite(euros) ? euros.toString() : "";
}

function inputToCents(value: string) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}

function toDateInput(value: string | null) {
  return value ?? "";
}

export default function CrmModal({ event, packs, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<EventRow | null>(event);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(event);
    setError(null);
  }, [event]);

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

  if (!event || !draft) return null;

  const updateField = <K extends keyof EventRow>(key: K, value: EventRow[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lead ?")) return;

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
    setIsSaving(true);
    setError(null);
    try {
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
        on_site_contact: draft.on_site_contact
      };

      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [{ id: draft.id, event: payload }] })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur sauvegarde");
      }

      onSaved(draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPackName = draft.pack_id ? packMap.get(draft.pack_id) : "";

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{draft.client_name || "Lead"}</h2>
            <p className="admin-muted">{draft.status || "nouveau"}</p>
          </div>
          <button type="button" className="admin-chip" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Statut CRM</span>
              <select
                value={draft.status ?? "new"}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {CRM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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
              <input
                type="text"
                value={draft.language ?? ""}
                onChange={(e) => updateField("language", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Date Formulaire</span>
              <input
                type="date"
                value={toDateInput(draft.created_at)}
                onChange={(e) => updateField("created_at", e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Type d'événement</span>
              <input
                type="text"
                value={draft.event_type ?? ""}
                onChange={(e) => updateField("event_type", e.target.value)}
              />
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
              <span>Nombre d'invités</span>
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
            <label className="admin-field">
              <span>Pack</span>
              <select
                value={selectedPackName ?? ""}
                onChange={(e) => {
                  const packId = e.target.value ? reversePackMap.get(e.target.value) : null;
                  updateField("pack_id", packId ?? null);
                }}
              >
                <option value="">—</option>
                {PACK_OPTIONS.map((packName) => (
                  <option key={packName} value={packName}>
                    {packName}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Pack (€)</span>
              <input
                type="text"
                value={centsToInput(draft.total_cents)}
                onChange={(e) => updateField("total_cents", inputToCents(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Transport (€)</span>
              <input
                type="text"
                value={centsToInput(draft.transport_fee_cents)}
                onChange={(e) => updateField("transport_fee_cents", inputToCents(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Extra (€)</span>
              <input
                type="text"
                value=""
                onChange={() => {}}
                placeholder="0"
              />
            </label>
            <label className="admin-field">
              <span>TOTAL (€)</span>
              <input
                type="text"
                value={centsToInput(draft.total_cents)}
                onChange={(e) => updateField("total_cents", inputToCents(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Acompte (€)</span>
              <input
                type="text"
                value={centsToInput(draft.deposit_cents)}
                onChange={(e) => updateField("deposit_cents", inputToCents(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Solde (€)</span>
              <input
                type="text"
                value={centsToInput(draft.balance_due_cents)}
                onChange={(e) => updateField("balance_due_cents", inputToCents(e.target.value))}
              />
            </label>
            <label className="admin-field" style={{ gridColumn: 'span 2' }}>
              <span>Lien Mollie</span>
              <input
                type="text"
                value=""
                onChange={() => {}}
                placeholder="URL Mollie"
              />
            </label>
          </div>
          {error && <p className="admin-muted" style={{ color: 'red', marginTop: 16 }}>{error}</p>}
        </div>
        <div className="admin-modal-footer">
          <button
            type="button"
            className="admin-chip"
            onClick={handleDelete}
            disabled={isSaving}
            style={{ marginRight: 'auto', backgroundColor: '#ef4444', color: 'white' }}
          >
            Supprimer
          </button>
          <button type="button" className="admin-chip" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="admin-chip primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
