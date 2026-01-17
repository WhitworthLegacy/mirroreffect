# Flow Checkout → Paiement → Clients Sheet

## Vue d'ensemble

Quand un utilisateur complète le checkout, voici le flow complet :

```
1. ReservationFlow → handleCheckout()
   ↓
2. POST /api/public/checkout
   ↓ (crée payment Mollie + stocke metadata)
3. Redirection vers Mollie checkout
   ↓ (utilisateur paie)
4. Webhook Mollie → POST /api/webhooks/mollie
   ↓ (si status = "paid")
5. Écriture dans Google Sheets "Clients"
```

## 1. Checkout (`/api/public/checkout`)

### Payload envoyé depuis ReservationFlow

```typescript
{
  language: "fr" | "nl",
  client_name: string,        // firstName + lastName
  client_email: string,
  client_phone: string,
  event_date: string,          // YYYY-MM-DD
  address: string,              // Lieu event (normalisé depuis location/lieuEvent)
  zone_code: "BE" | "FR_NORD",
  pack_code: "DISCOVERY" | "ESSENTIAL" | "PREMIUM",
  options: string[],            // ["RED_CARPET", "STANCHIONS_GOLD", ...]
  lead_id?: string
}
```

### Ce que fait `/api/public/checkout`

1. **Valide le payload** (Zod schema)
2. **Normalise `address`** depuis plusieurs sources :
   - `address` (priorité)
   - `venue` (fallback)
   - `lieuEvent` (fallback)
3. **Calcule les prix** :
   - `transport_fee_cents` : 9000 (BE) ou 11000 (FR_NORD)
   - `pack_total_cents` : 39000 (DISCOVERY), 44000 (ESSENTIAL), 49000 (PREMIUM)
   - `total_cents` = transport + pack
   - `balance_due_cents` = total - 18000 (dépôt)
4. **Génère `eventId`** : `EVT-{timestamp}-{random}`
5. **Crée payment Mollie** avec metadata complète :
   ```typescript
   metadata: {
     event_id: eventId,
     lead_id: lead_id,
     event_date: event_date,
     client_name: client_name,
     client_email: client_email,
     client_phone: client_phone,
     address: address,              // ✅ Normalisé
     language: language,
     pack_code: pack_code,
     zone_code: zone_code,
     options: options.join(","),
     transport_fee_cents: transport_fee_cents,
     total_cents: total_cents,
     deposit_cents: 18000,
     balance_due_cents: balance_due_cents
   }
   ```
6. **Log dans Payments sheet** (status="open")
7. **Retourne** `{ checkout_url: mollie._links.checkout.href }`

## 2. Webhook Mollie (`/api/webhooks/mollie`)

### Quand est-il appelé ?

- Quand le paiement change de statut (paid, failed, cancelled, etc.)
- Mollie envoie `id=tr_...` (form-urlencoded)

### Protection

- Vérifie `x-webhook-secret` header (MOLLIE_WEBHOOK_SECRET)

### Idempotence

- Vérifie si payment déjà traité dans "Payments" sheet
- Si status="paid" déjà → retourne `{ received: true }` (skip)

### Traitement si `status === "paid"`

1. **Valide acompte** : doit être 18000 centimes (180€)
2. **Récupère metadata** depuis `payment.metadata`
3. **Écrit dans "Clients" sheet** (voir section suivante)
4. **Update "Payments" sheet** : status="paid", "Paid At"=paidAt
5. **Crée notifications** :
   - `B2C_BOOKING_CONFIRMED`
   - `B2C_EVENT_RECAP`
6. **Update "Leads" sheet** (si `lead_id` existe) :
   - Status = "converted"
   - Converted At = now
   - Event ID = eventId

## 3. Écriture dans "Clients" Sheet

### Colonnes écrites par le webhook

```typescript
{
  "Event ID": eventId,                    // ✅ Obligatoire, unique
  "Lead ID": meta.lead_id || "",          // ⚠️ Optionnel (peut ne pas exister)
  "Type Event": "b2c",                    // ✅ Toujours "b2c" pour web
  "Language": meta.language || "fr",      // ✅ "fr" ou "nl"
  "Nom": meta.client_name || "",          // ✅ Nom complet
  "Email": meta.client_email || "",       // ✅ Email
  "Phone": meta.client_phone || "",       // ✅ Téléphone
  "Date Event": meta.event_date || "",    // ✅ YYYY-MM-DD
  "Lieu Event": meta.address || "",       // ✅ Adresse (normalisée)
  "Pack": meta.pack_code || "",          // ✅ "DISCOVERY", "ESSENTIAL", "PREMIUM"
  "Transport (€)": "90,00",               // ✅ Format européen (centsToEuros)
  "Total": "480,00",                      // ✅ Format européen
  "Acompte": "180,00",                    // ✅ Format européen
  "Solde Restant": "300,00",              // ✅ Format européen
  "Date Acompte Payé": paidAt,           // ⚠️ ISO datetime (à vérifier format exact)
  "Created At": new Date().toISOString()  // ⚠️ ISO datetime
}
```

### Correspondance avec SHEETS_CONTRACT.md

| Colonne Webhook | Colonne SHEETS_CONTRACT | Statut |
|----------------|------------------------|--------|
| `Event ID` | `Event ID` | ✅ Correspond |
| `Lead ID` | *(non mentionné)* | ⚠️ Colonne optionnelle, peut ne pas exister |
| `Type Event` | `Type Event` | ✅ Correspond |
| `Language` | `Language` | ✅ Correspond |
| `Nom` | `Nom` | ✅ Correspond |
| `Email` | `Email` | ✅ Correspond |
| `Phone` | `Phone` | ✅ Correspond |
| `Date Event` | `Date Event` | ✅ Correspond |
| `Lieu Event` | `Lieu Event` | ✅ Correspond |
| `Pack` | `Pack` | ✅ Correspond |
| `Transport (€)` | `Transport (€)` | ✅ Correspond |
| `Total` | `Total` | ✅ Correspond |
| `Acompte` | `Acompte` | ✅ Correspond |
| `Solde Restant` | `Solde Restant` | ✅ Correspond |
| `Date Acompte Payé` | `Date acompte payé` | ⚠️ **CASSE DIFFÉRENTE** (majuscules vs minuscules) |
| `Created At` | *(non mentionné)* | ⚠️ Colonne optionnelle |

### Colonnes manquantes (non écrites par webhook)

Le webhook n'écrit **PAS** :
- `Invités` (nombre d'invités) - ⚠️ **MANQUANT**
- `Pack (€)` - Optionnel (calculé depuis Total)
- `Supplément`, `Supplément (h)`, `Supplément (€)` - Pour B2B
- `Etudiant`, `Heures Etudiant`, etc. - Rempli plus tard par admin
- `Commercial`, `Comm Commercial` - Rempli plus tard
- `Marge Brut (Event)` - Calculé plus tard
- `Acompte Facture`, `Solde Facture` - Rempli plus tard

## 4. Source des données

### D'où viennent les données dans le webhook ?

**Toutes les données viennent du `metadata` du payment Mollie**, qui a été stocké lors de la création du payment dans `/api/public/checkout`.

**Flow des données** :
```
ReservationFlow (state + draft)
  ↓
/api/public/checkout (metadata Mollie)
  ↓
Mollie API (stockage metadata)
  ↓
Webhook Mollie (récupère metadata)
  ↓
Google Sheets "Clients"
```

### Normalisation des données

- **Dates** : `event_date` est en `YYYY-MM-DD` (format ISO)
- **Montants** : Convertis de centimes → format européen (`"180,00"`)
- **Address** : Normalisé depuis `location` → `address` dans checkout

## 5. Problèmes potentiels

### ⚠️ Colonne "Date Acompte Payé" vs "Date acompte payé"

- **Webhook écrit** : `"Date Acompte Payé"` (majuscules)
- **SHEETS_CONTRACT mentionne** : `"Date acompte payé"` (minuscules)
- **Action** : Vérifier la vraie colonne dans le sheet Google Sheets

### ⚠️ Colonne "Invités" manquante

- Le webhook n'écrit **PAS** le nombre d'invités
- `meta.guests` ou `meta.invites` n'est pas dans le metadata Mollie
- **Action** : Ajouter `guests` dans le metadata checkout si disponible

### ⚠️ Colonne "Lead ID" optionnelle

- `Lead ID` est écrit mais peut être vide
- Si `lead_id` n'existe pas, colonne sera vide
- **OK** : C'est normal pour les clients directs sans lead tracking

## 6. Recommandations

### Pour garantir la correspondance des colonnes

1. **Vérifier la casse exacte** de "Date Acompte Payé" dans le sheet réel
2. **Ajouter `guests` dans metadata checkout** si disponible depuis state/draft
3. **Normaliser les dates** : "Date Acompte Payé" devrait être en format texte DD/MM/YYYY ou ISO selon convention
4. **Logs debug** : Ajouter logs pour voir quelles colonnes sont réellement écrites

### Pour améliorer le flow

1. **Ajouter `guests` dans metadata** lors du checkout
2. **Normaliser "Date Acompte Payé"** au format texte (comme "Date Event")
3. **Vérifier que toutes les colonnes obligatoires** sont présentes
