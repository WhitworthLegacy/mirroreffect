"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventRow, PackRow } from "@/lib/adminData";

type Props = {
  event: EventRow | null;
  packs: PackRow[];
  onClose: () => void;
  onSaved: (event: EventRow) => void;
};

const EVENT_TYPES = [
  { value: "mariage", label: "Mariage" },
  { value: "anniversaire", label: "Anniversaire" },
  { value: "bapteme", label: "Baptême" },
  { value: "B2B", label: "B2B" }
];

const LANGUAGES = [
  { value: "fr", label: "FR" },
  { value: "nl", label: "NL" }
];

const BALANCE_STATUSES = [
  { value: "due", label: "Dû" },
  { value: "partial", label: "Partiel" },
  { value: "paid", label: "Payé" }
];

const STATUSES = [
  { value: "active", label: "Actif" },
  { value: "hold", label: "Hold" },
  { value: "cancelled", label: "Annulé" }
];

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

export default function EventModal({ event, packs, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<EventRow | null>(event);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(event);
    setError(null);
  }, [event]);

  const packOptions = useMemo(
    () =>
      packs.map((pack) => ({
        value: pack.id,
        label: pack.name_fr || pack.code || "Pack"
      })),
    [packs]
  );

  if (!event || !draft) return null;

  const updateField = <K extends keyof EventRow>(key: K, value: EventRow[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
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

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div>
            <h2>{draft.client_name || "Event"}</h2>
            <p className="admin-muted">{draft.event_date || "Date a definir"}</p>
          </div>
          <button type="button" className="admin-chip" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Date event</span>
              <input
                type="date"
                value={toDateInput(draft.event_date)}
                onChange={(eventInput) => updateField("event_date", eventInput.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Nom client</span>
              <input
                type="text"
                value={draft.client_name ?? ""}
                onChange={(eventInput) => updateField("client_name", eventInput.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Pack choisi</span>
              <select
                value={draft.pack_id ?? ""}
                onChange={(eventInput) => updateField("pack_id", eventInput.target.value || null)}
              >
                <option value="">—</option>
                {packOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Type event</span>
              <select
                value={draft.event_type ?? ""}
                onChange={(eventInput) => updateField("event_type", eventInput.target.value || null)}
              >
                <option value="">—</option>
                {EVENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Langue</span>
              <select
                value={draft.language ?? ""}
                onChange={(eventInput) => updateField("language", eventInput.target.value || null)}
              >
                <option value="">—</option>
                {LANGUAGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Statut</span>
              <select
                value={draft.status ?? ""}
                onChange={(eventInput) => updateField("status", eventInput.target.value || null)}
              >
                <option value="">—</option>
                {STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Email client</span>
              <input
                type="email"
                value={draft.client_email ?? ""}
                onChange={(eventInput) => updateField("client_email", eventInput.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Téléphone client</span>
              <input
                type="text"
                value={draft.client_phone ?? ""}
                onChange={(eventInput) => updateField("client_phone", eventInput.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Adresse</span>
              <input
                type="text"
                value={draft.address ?? ""}
                onChange={(eventInput) => updateField("address", eventInput.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Contact sur place</span>
              <input
                type="text"
                value={draft.on_site_contact ?? ""}
                onChange={(eventInput) => updateField("on_site_contact", eventInput.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Solde (€)</span>
              <input
                type="text"
                value={centsToInput(draft.balance_due_cents)}
                onChange={(eventInput) =>
                  updateField("balance_due_cents", inputToCents(eventInput.target.value))
                }
              />
            </label>
            <label className="admin-field">
              <span>Statut solde</span>
              <select
                value={draft.balance_status ?? ""}
                onChange={(eventInput) => updateField("balance_status", eventInput.target.value || null)}
              >
                <option value="">—</option>
                {BALANCE_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Total (€)</span>
              <input
                type="text"
                value={centsToInput(draft.total_cents)}
                onChange={(eventInput) =>
                  updateField("total_cents", inputToCents(eventInput.target.value))
                }
              />
            </label>
            <label className="admin-field">
              <span>Acompte (€)</span>
              <input
                type="text"
                value={centsToInput(draft.deposit_cents)}
                onChange={(eventInput) =>
                  updateField("deposit_cents", inputToCents(eventInput.target.value))
                }
              />
            </label>
            <label className="admin-field">
              <span>Transport (€)</span>
              <input
                type="text"
                value={centsToInput(draft.transport_fee_cents)}
                onChange={(eventInput) =>
                  updateField("transport_fee_cents", inputToCents(eventInput.target.value))
                }
              />
            </label>
          </div>
          {error && <p className="admin-muted">{error}</p>}
        </div>
        <div className="admin-modal-footer">
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
