"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventRow, PackRow, EventFinanceRow } from "@/lib/adminData";

type Props = {
  event: EventRow | null;
  packs: PackRow[];
  onClose: () => void;
  onSaved: (event: EventRow) => void;
  isNew?: boolean;
};

const PACK_OPTIONS = ["Découverte", "Essentiel", "Premium"];

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

function getFinance(event: EventRow | null): EventFinanceRow {
  if (!event?.event_finance) return {};
  if (Array.isArray(event.event_finance)) {
    return event.event_finance[0] || {};
  }
  return event.event_finance;
}

export default function EventModal({ event, packs, onClose, onSaved, isNew = false }: Props) {
  const [draft, setDraft] = useState<EventRow | null>(event);
  const [finance, setFinance] = useState<EventFinanceRow>(() => getFinance(event));
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(event);
    setFinance(getFinance(event));
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

  const packPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    packs.forEach((pack) => {
      if (!pack.id) return;
      map.set(pack.id, pack.price_current_cents || 0);
    });
    return map;
  }, [packs]);

  if (!event || !draft) return null;

  const updateField = <K extends keyof EventRow>(key: K, value: EventRow[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateFinance = <K extends keyof EventFinanceRow>(key: K, value: EventFinanceRow[K]) => {
    setFinance((prev) => ({ ...prev, [key]: value }));
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
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
      // Update finance with recalculated values + auto commission
      setFinance((prev) => ({
        ...prev,
        km_one_way: data.km_one_way,
        km_total: data.km_total,
        fuel_cost_cents: data.fuel_cost_cents,
        student_hours: data.student_hours,
        student_rate_cents: data.student_rate_cents,
        commercial_commission_cents: calculateCommission()
      }));
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
    setIsSaving(true);
    setError(null);
    try {
      const eventPayload: Record<string, unknown> = {
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
      };

      const financePayload: Record<string, unknown> = {
        student_name: finance.student_name || null,
        student_hours: finance.student_hours || null,
        student_rate_cents: finance.student_rate_cents || null,
        km_one_way: finance.km_one_way || null,
        km_total: finance.km_total || null,
        fuel_cost_cents: finance.fuel_cost_cents || null,
        commercial_name: finance.commercial_name || null,
        commercial_commission_cents: finance.commercial_commission_cents || calculateCommission(),
        gross_margin_cents: finance.gross_margin_cents || null
      };

      if (isNew) {
        // Create new event
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: eventPayload,
            finance: financePayload
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Erreur création");
        }
        const data = await res.json();
        const updatedEvent = { ...draft, id: data.id, event_finance: finance };
        onSaved(updatedEvent);
      } else {
        // Update existing event
        const res = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: [{
              id: draft.id,
              event: eventPayload,
              finance: financePayload
            }]
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Erreur sauvegarde");
        }
        const updatedEvent = { ...draft, event_finance: finance };
        onSaved(updatedEvent);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPackName = draft.pack_id ? packMap.get(draft.pack_id) : "";
  const eventTypeFr = draft.event_type ? (EVENT_TYPES[draft.event_type] || draft.event_type) : "";

  // Calculate gross margin
  const totalRevenue = (draft.total_cents || 0) + (draft.transport_fee_cents || 0);
  const studentCost = (finance.student_hours || 0) * (finance.student_rate_cents || 1400);
  const fuelCost = finance.fuel_cost_cents || 0;
  const commercialCost = finance.commercial_commission_cents || calculateCommission();
  const calculatedMargin = totalRevenue - studentCost - fuelCost - commercialCost;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{isNew ? "Nouvel événement" : (draft.client_name || "Event")}</h2>
            <p className="admin-muted">{draft.event_date || "Date à définir"}</p>
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
                value={selectedPackName ?? ""}
                onChange={(e) => {
                  const packId = e.target.value ? reversePackMap.get(e.target.value) : null;
                  updateField("pack_id", packId ?? null);
                  // Auto-set pack price
                  if (packId) {
                    const price = packPriceMap.get(packId);
                    if (price) updateField("total_cents", price);
                  }
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
                value={finance.km_one_way ?? ""}
                onChange={(e) => updateFinance("km_one_way", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>KM total</span>
              <input
                type="number"
                step="0.1"
                value={finance.km_total ?? ""}
                onChange={(e) => updateFinance("km_total", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>Coût essence (€)</span>
              <input
                type="text"
                value={formatEuro(finance.fuel_cost_cents)}
                onChange={(e) => updateFinance("fuel_cost_cents", parseEuro(e.target.value))}
              />
            </label>
            <div style={{ gridColumn: 'span 1' }} />

            <label className="admin-field">
              <span>Étudiant</span>
              <input
                type="text"
                value={finance.student_name ?? ""}
                onChange={(e) => updateFinance("student_name", e.target.value || null)}
                placeholder="Nom de l'étudiant"
              />
            </label>
            <label className="admin-field">
              <span>Heures</span>
              <input
                type="number"
                step="0.5"
                value={finance.student_hours ?? ""}
                onChange={(e) => updateFinance("student_hours", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </label>
            <label className="admin-field">
              <span>Taux horaire (€)</span>
              <input
                type="text"
                value={formatEuro(finance.student_rate_cents)}
                onChange={(e) => updateFinance("student_rate_cents", parseEuro(e.target.value))}
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
                value={finance.commercial_name ?? ""}
                onChange={(e) => updateFinance("commercial_name", e.target.value || null)}
                placeholder="Nom du commercial"
              />
            </label>
            <label className="admin-field">
              <span>Commission 10% (€)</span>
              <input
                type="text"
                value={formatEuro(finance.commercial_commission_cents ?? calculateCommission())}
                onChange={(e) => updateFinance("commercial_commission_cents", parseEuro(e.target.value))}
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
            disabled={isSaving}
          >
            {isSaving ? "Sauvegarde..." : (isNew ? "Créer" : "Sauvegarder")}
          </button>
        </div>
      </div>
    </div>
  );
}
