# BLUEPRINT MIRROREFFECT
**Version:** 2.1
**Date:** 2026-01-18
**Auteur:** Principal Engineer + Solution Architect

---

## 1. EXECUTIVE SUMMARY

MirrorEffect est une plateforme SaaS de réservation de photobooth miroir pour événements (mariages, B2B).

**Architecture:** Monorepo Turborepo avec 2 apps Next.js 14 (web + admin) et packages partagés (core, ui).

**Stack:** Next.js 14 App Router, TypeScript, Zod, Tailwind, Supabase (auth), Mollie (paiements), Google Sheets (source de vérité via GAS WebApp).

**Flow principal:** Lead capture → Checkout → Mollie payment → Webhook → Google Sheets → Email notifications.

**Langues:** FR/NL (i18n intégré).

**Déploiement:** Vercel (2 projets séparés), GAS WebApp (Google).

---

## 2. ARCHITECTURE DU MONOREPO

### Arborescence

```
mirroreffect/
├── apps/
│   ├── web/                    # Site client (réservation, checkout)
│   │   ├── app/               # Next.js App Router
│   │   │   ├── (seo)/[...slug]/ # Pages SEO dynamiques
│   │   │   ├── api/
│   │   │   │   ├── public/    # APIs publiques (checkout, leads, availability)
│   │   │   │   ├── webhooks/  # Webhook Mollie
│   │   │   │   └── debug/     # Debug (dev only)
│   │   │   ├── booking/       # Pages success/failed
│   │   │   ├── reservation/   # Page réservation
│   │   │   └── nl/            # Homepage NL
│   │   ├── components/home/   # ReservationFlow, BookingSuccess, etc.
│   │   ├── content/seo/       # 55+ fichiers SEO (blog, régions, legal)
│   │   ├── lib/               # Utilitaires (gas.ts, leads.ts, mollie.ts)
│   │   └── public/images/     # Assets
│   │
│   └── admin/                  # Dashboard admin
│       ├── app/               # Next.js App Router
│       │   ├── api/           # APIs admin (events, gas, stats)
│       │   ├── events/        # CRUD events
│       │   ├── crm/           # Leads management
│       │   ├── availability/  # Calendrier
│       │   ├── students/      # Stats étudiants
│       │   ├── commercial/    # Stats commerciaux
│       │   ├── notifications/ # Logs emails
│       │   ├── inventory/     # Stock
│       │   └── health/        # Health check
│       ├── components/        # UI admin
│       ├── lib/               # googleSheets.ts, sheetsStore.ts
│       └── CODE_A_COPIER_COLLER.gs # Template GAS
│
├── packages/
│   ├── core/                   # Zod schemas partagés
│   │   └── src/
│   │       ├── availability.ts
│   │       ├── booking.ts
│   │       ├── events.ts
│   │       ├── payments.ts
│   │       ├── webhooks.ts
│   │       ├── crmB2b.ts
│   │       ├── stock.ts
│   │       └── admin.ts
│   ├── ui/                     # (placeholder)
│   └── supabase/               # Migrations
│
├── docs/                       # Documentation technique
├── files/csv/                  # Templates CSV de référence
├── turbo.json                  # Config Turborepo
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Responsabilités

| App/Package | Responsabilité |
|-------------|---------------|
| `apps/web` | Site public, réservation, checkout Mollie, webhook, SEO |
| `apps/admin` | Dashboard, CRUD events, stats, CRM, notifications |
| `packages/core` | Schemas Zod partagés (validation I/O) |
| `packages/ui` | Composants UI réutilisables (placeholder) |

---

## 3. ENVIRONNEMENTS & DÉPLOIEMENT

### Vercel Projects

| Projet | Domaine | Branch | Root |
|--------|---------|--------|------|
| `mirroreffect-web` | `mirroreffect.co` | `main` | `apps/web` |
| `mirroreffect-admin` | `admin.mirroreffect.co` | `main` | `apps/admin` |

### Branches

```
main        → Production (auto-deploy)
develop     → Preview (auto-deploy)
feature/*   → Preview branches
```

### Preview vs Production

| Aspect | Preview | Production |
|--------|---------|------------|
| Mollie | `test_xxx` | `live_xxx` |
| APP_URL | `https://preview-xxx.vercel.app` | `https://mirroreffect.co` |
| GAS | Même URL (test data) | Même URL (prod data) |
| Sheets | Test sheet | Production sheet |

### Commandes Build

```bash
# Local dev (concurrent)
pnpm dev

# Build all
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

---

## 4. VARIABLES D'ENVIRONNEMENT

### Table Complète

| Variable | Scope | Required | Exemple | Impact si manquant |
|----------|-------|----------|---------|-------------------|
| `APP_URL` | Web | **OUI** | `https://mirroreffect.co` | **CRITIQUE**: webhookUrl=null, paiements non traités |
| `GAS_WEBAPP_URL` | Web + Admin | **OUI** | `https://script.google.com/macros/s/xxx/exec` | Toutes les écritures Sheets échouent |
| `GAS_KEY` | Web + Admin | **OUI** | `p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7` | GAS refuse les requêtes |
| `MOLLIE_API_KEY` | Web | **OUI** | `live_xxx` ou `test_xxx` | Checkout impossible |
| `MOLLIE_WEBHOOK_SECRET` | Web | Non (documenté mais non utilisé) | `secret_xxx` | - |
| `NEXT_PUBLIC_SUPABASE_URL` | Web + Admin | **OUI** | `https://xxx.supabase.co` | Auth broken |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web + Admin | **OUI** | `eyJxxx...` | Auth broken |
| `SUPABASE_URL` | Web + Admin | **OUI** | `https://xxx.supabase.co` | Server auth broken |
| `SUPABASE_SERVICE_ROLE_KEY` | Web + Admin | **OUI** | `eyJxxx...` | Server auth broken |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Admin | **OUI** | `1xxx...xxx` | Admin non fonctionnel |
| `GOOGLE_MAPS_API_KEY` | Admin | Optionnel | `AIzaSyxxx...` | Recalculate KM broken |

### Template .env.local

```bash
# === WEB APP ===
APP_URL=https://mirroreffect.co
MOLLIE_API_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxx
GAS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_ID/exec
GAS_KEY=your-secret-key

# === ADMIN APP ===
GOOGLE_SHEETS_SPREADSHEET_ID=1xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GAS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_ID/exec
GAS_KEY=your-secret-key
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx

# === SHARED (Supabase) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxx
```

---

## 5. MODULES WEB (Features + Composants)

### Features

| Feature | Fichiers | Description |
|---------|----------|-------------|
| **Reservation Flow** | `components/home/ReservationFlow.tsx` | Wizard 7 étapes, capture leads, checkout |
| **Availability Check** | `api/public/availability/route.ts` | Vérifie miroirs dispos par date |
| **Checkout Mollie** | `api/public/checkout/route.ts` | Crée payment, redirect Mollie |
| **Webhook Mollie** | `api/webhooks/mollie/route.ts` | Traite paiements paid |
| **Lead Tracking** | `api/public/leads/route.ts` | Persist leads vers Sheets |
| **Promo Intent** | `api/public/promo-intent/route.ts` | Queue email promo 48h |
| **Booking Status** | `api/public/booking-status/route.ts` | Status post-paiement |
| **SEO Pages** | `(seo)/[...slug]/page.tsx` | 55+ pages SEO dynamiques |
| **i18n** | `copy` object in components | FR/NL inline |

### Composants Clés

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ReservationFlow` | `components/home/ReservationFlow.tsx` | Wizard principal (1200+ lignes) |
| `BookingSuccess` | `components/home/BookingSuccess.tsx` | Page confirmation |
| `BookingFailed` | `components/home/BookingFailed.tsx` | Page échec |
| `LeadModal` | `components/home/LeadModal.tsx` | Modal capture lead |
| `ModeSwitch` | `components/home/ModeSwitch.tsx` | Toggle langue |
| `MotionReveal` | `components/home/MotionReveal.tsx` | Animations Framer |

---

## 6. MODULES ADMIN (Features + Pages)

### Pages

| Page | Route | Composant | Description |
|------|-------|-----------|-------------|
| Dashboard | `/` | `DashboardPageClient.tsx` | KPIs, charts, overview |
| Events | `/events` | `EventsPageClient.tsx` | CRUD events |
| Availability | `/availability` | `AvailabilityPageClient.tsx` | Calendrier |
| CRM | `/crm` | `CrmPageClient.tsx` | Leads management |
| Students | `/students` | `StudentsPageClient.tsx` | Stats étudiants |
| Commercial | `/commercial` | `CommercialPageClient.tsx` | Stats commerciaux |
| Notifications | `/notifications` | `NotificationsPageClient.tsx` | Logs emails |
| Inventory | `/inventory` | `InventoryPageClient.tsx` | Stock miroirs |
| Health | `/health` | - | Health check GAS/Sheets |
| Login | `/login` | - | Auth Supabase |

### Features Admin

| Feature | Description |
|---------|-------------|
| **Events CRUD** | Create, Read, Update, Delete events avec calcul finances |
| **Finance Recalculate** | Recalcul marges, KM, coûts via Google Maps API |
| **Stats Aggregation** | Stats mensuelles (leads, CA, marges, cashflow) |
| **Student/Commercial Stats** | Stats par personne/mois |
| **Notification Logs** | Historique emails envoyés |
| **CRM Pipeline** | Suivi leads par status |

---

## 7. API MAP COMPLÈTE

### Public APIs (`/api/public/*`)

| Route | Méthode | Auth | Input Schema | Output Schema | Side Effects |
|-------|---------|------|--------------|---------------|--------------|
| `/api/public/checkout` | POST | None | `CheckoutBodySchema` | `{ ok, checkout_url, event_id, mollie_payment_id }` | Mollie payment créé, Payments sheet append |
| `/api/public/availability` | GET | None | `PublicAvailabilityQuerySchema` | `PublicAvailabilityResponseSchema` | None |
| `/api/public/leads` | POST | None | `LeadPayloadSchema` | `{ ok, lead_id, created? }` | Leads sheet append/update (avec `is_new_lead` flag pour upsert) |
| `/api/public/booking-status` | GET | None | `{ event_id: string }` | `{ ok, event_id, deposit_paid, payment_status }` | None |
| `/api/public/promo-intent` | POST | None | `PromoIntentSchema` | `{ queued: true, lead_id? }` | Notifications sheet append + Leads sheet append (non-blocking) |

### Webhook API (`/api/webhooks/*`)

| Route | Méthode | Auth | Input | Output | Side Effects |
|-------|---------|------|-------|--------|--------------|
| `/api/webhooks/mollie` | POST | Re-fetch Mollie (no secret) | `id=tr_xxx` (form-urlencoded) | `{ ok, received, eventId }` | Clients append, Payments update, Notifications append, Leads update |

### Schemas Input Détaillés

**CheckoutBodySchema:**
```typescript
{
  language: "fr" | "nl",
  client_name: string,        // min 2
  client_email: string,       // email
  client_phone: string,       // min 6
  event_date: string,         // YYYY-MM-DD
  address?: string,
  venue?: string,
  lieuEvent?: string,
  lead_id?: string,
  zone_code: "BE" | "FR_NORD",
  pack_code: "DISCOVERY" | "ESSENTIAL" | "PREMIUM",
  options: string[],
  event_id?: string
}
```

**LeadPayloadSchema:**
```typescript
{
  event: "button_click" | "lead_progress" | "cta_update",
  step?: string,
  leadId?: string,
  lead_id?: string,
  is_new_lead?: boolean,        // Flag pour créer directement sans essayer update
  language?: string,
  client_name?: string,
  client_email?: string,        // email
  client_phone?: string,
  event_date?: string,
  address?: string,
  pack_code?: string,
  guests?: string,
  utm_source?: string,
  utm_campaign?: string,
  utm_medium?: string,
  status?: string
}
```

**PromoIntentSchema:**
```typescript
{
  email: string,              // email
  locale: "fr" | "nl",
  payload?: {
    email?: string,
    first_name?: string,
    last_name?: string,
    phone?: string,
    date?: string,
    location?: string,
    guests?: string,
    theme?: string,
    priority?: string
  }
}
```

**Note:** `promo-intent` écrit également dans la sheet Leads (non-blocking) en plus de Notifications.

---

## 8. FLOWS END-TO-END

### Flow 1: Reservation → Checkout → Payment → Confirmation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RESERVATION FLOW (7 étapes)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Step 1-4: Capture données (date, lieu, ambiance, invités)                      │
│     │                                                                           │
│     ↓ localStorage: me_reservation_draft                                        │
│                                                                                 │
│  Step 5: Contact (email, phone)                                                 │
│     │                                                                           │
│     ├──→ POST /api/public/leads (lead_progress)                                 │
│     │       └──→ GAS appendRow → Leads sheet                                    │
│     │                                                                           │
│     └──→ POST /api/public/promo-intent (queue B2C_PROMO_48H)                    │
│             └──→ GAS appendRow → Notifications sheet                            │
│                                                                                 │
│  Step 6: Pack selection (DISCOVERY/ESSENTIAL/PREMIUM)                           │
│     │                                                                           │
│     ↓ localStorage update                                                       │
│                                                                                 │
│  Step 7: Checkout                                                               │
│     │                                                                           │
│     └──→ POST /api/public/checkout                                              │
│             │                                                                   │
│             ├── Validate Zod                                                    │
│             ├── Generate eventId: EVT-{timestamp}-{random}                      │
│             ├── Create Mollie payment (metadata = all data)                     │
│             ├── GAS appendRow → Payments sheet (status=open)                    │
│             └── Return { checkout_url }                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MOLLIE CHECKOUT                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  User redirected → Mollie hosted page → Payment (Bancontact, card, etc.)        │
│                                                                                 │
│  Success → Redirect to /booking/success?event_id=xxx&lang=fr                    │
│  Failed  → Redirect to /booking/failed                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                            (async, ~1-30s later)
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MOLLIE WEBHOOK (POST)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Body: id=tr_xxx (form-urlencoded)                                              │
│                                                                                 │
│  1. Parse payment ID                                                            │
│  2. Check idempotence: readSheet Payments → if status="paid" → skip             │
│  3. Fetch payment from Mollie API → get real status                             │
│  4. If status !== "paid" → update Payments status only → return                 │
│  5. If status === "paid":                                                       │
│     │                                                                           │
│     ├── Validate amount === 18000 (180€)                                        │
│     ├── Extract metadata (event_id, client_email, etc.)                         │
│     │                                                                           │
│     ├── findRowByEmail(Leads) → get leadId                                      │
│     ├── updateRowByLeadId(Leads) → Status=converted                             │
│     │                                                                           │
│     ├── appendRow(Clients) → Create event row                                   │
│     │                                                                           │
│     ├── updateRow(Payments) → status=paid, paidAt                               │
│     │                                                                           │
│     └── appendRow(Notifications) x2:                                            │
│           - B2C_BOOKING_CONFIRMED                                               │
│           - B2C_EVENT_RECAP                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Flow 2: Availability Computation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AVAILABILITY CHECK                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  GET /api/public/availability?date=2026-02-15                                   │
│     │                                                                           │
│     ├── Validate date (YYYY-MM-DD or DD/MM/YYYY)                                │
│     │                                                                           │
│     ├── GAS readSheet(Clients)                                                  │
│     │                                                                           │
│     ├── For each row:                                                           │
│     │     - Skip if no Event ID (comme admin)                                   │
│     │     - Normalize "Date Event" to ISO                                       │
│     │     - If date matches → count++                                           │
│     │                                                                           │
│     ├── Calculate:                                                              │
│     │     TOTAL_MIRRORS = 4                                                     │
│     │     reserved = count                                                      │
│     │     remaining = max(0, TOTAL - reserved)                                  │
│     │     available = remaining > 0                                             │
│     │                                                                           │
│     └── Return { date, total_mirrors, reserved_mirrors, remaining_mirrors,      │
│                  available }                                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Source of Truth: Clients sheet (events avec Event ID = confirmés/payés)
```

---

## 9. GOOGLE SHEETS SCHEMA

### Onglets Requis

| Onglet | Usage | Clé Primaire |
|--------|-------|--------------|
| `Clients` | Events confirmés (B2C + B2B) | `Event ID` |
| `Leads` | Leads en cours | `Lead ID` |
| `Payments` | Paiements Mollie | `Payment ID` |
| `Notifications` | Queue emails | (Event ID, Template) |
| `Stats` | KPIs mensuels | `Date` (YYYY-MM-01) |
| `Students` | Stats étudiants | (`month`, `student_name`) |
| `Commercial` | Stats commerciaux | (`month`, `commercial_name`) |

### Clients Sheet - Colonnes

```
Event ID | Date Event | Type Event | Language | Nom | Email | Phone |
Lieu Event | Pack | Pack (€) | Total | Transport (€) | Supplément |
Supplément (h) | Supplément (€) | Date acompte payé | Acompte |
Solde Restant | Etudiant | Heures Etudiant | Etudiant €/Event |
KM (Aller) | KM (Total) | Coût Essence | Commercial | Comm Commercial |
Marge Brut (Event) | Lien Invoice | Lien Galerie | Lien ZIP |
Sync Status | Review Status | Annual Offer Status | Acompte Facture |
Solde Facture | Invités | Created At
```

**Format nombres:** Européen (`,` décimal, `.` milliers)
**Format dates:** `YYYY-MM-DD` ou `DD/MM/YYYY`

### Leads Sheet - Colonnes

```
Lead ID | Created At | Step | Status | Nom | Email | Phone | Language |
Date Event | Lieu Event | Pack | Invités | Transport (€) | Total | Acompte |
UTM Source | UTM Campaign | UTM Medium | Event ID | Converted At | Updated At
```

### Payments Sheet - Colonnes

```
Payment ID | Event ID | Lead ID | Provider | Amount | Status | Created At |
Paid At | Updated At | Provider Payment ID
```

### Notifications Sheet - Colonnes

```
Template | Email | Event ID | Locale | Payload | Send After | Status | Created At
```

### Règles d'Idempotence (CRITIQUE)

| Sheet | Vérification Actuelle | Risque |
|-------|----------------------|--------|
| Payments | Check `status=paid` avant traitement | Race condition si 2 webhooks simultanés |
| Clients | **AUCUNE** | **CRITIQUE**: Doublons possibles |
| Notifications | **AUCUNE** | **CRITIQUE**: Emails dupliqués |
| Leads | Dedup frontend 3s | Partiel |

---

## 10. GAS WEBAPP

### Configuration

| Paramètre | Valeur |
|-----------|--------|
| URL | `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec` |
| Auth | Query param `key` = `GAS_KEY` |
| Method | POST (JSON body) + GET (redirect follow) |
| Execute as | Me (owner) |
| Access | Anyone |

### Actions Supportées

| Action | Sheet | Input | Output |
|--------|-------|-------|--------|
| `readSheet` | All | `{ sheetName }` | `{ values: [[...], [...]] }` |
| `appendRow` | All | `{ sheetName, values: {...} }` | `{ success: true }` |
| `updateRow` | All | `{ sheetName, id, values }` | `{ success: true, action }` |
| `updateRowByEventId` | Clients | `{ eventId, values }` | `{ success: true, action }` |
| `updateRowByCompositeKey` | Stats/Students/Commercial | `{ sheetName, key1, key1Value, key2, key2Value, values }` | `{ success: true, action }` |
| `updateRowByLeadId` | Leads | `{ sheetName, leadId, values }` | `{ success: true, action }` |
| `deleteRow` | All | `{ sheetName, id }` | `{ success: true, action }` |

### Payload Exemples

**readSheet:**
```json
{
  "action": "readSheet",
  "key": "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7",
  "data": { "sheetName": "Clients" }
}
```

**appendRow:**
```json
{
  "action": "appendRow",
  "key": "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7",
  "data": {
    "sheetName": "Clients",
    "values": {
      "Event ID": "EVT-1234567890-ABC",
      "Nom": "John Doe",
      "Email": "john@example.com",
      "Date Event": "2026-02-15",
      "Pack": "ESSENTIAL",
      "Total": "480,00"
    }
  }
}
```

**updateRowByLeadId:**
```json
{
  "action": "updateRowByLeadId",
  "key": "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7",
  "data": {
    "sheetName": "Leads",
    "leadId": "LEAD-1234567890-XYZ",
    "values": {
      "Status": "converted",
      "Converted At": "2026-01-17T10:30:00Z",
      "Event ID": "EVT-1234567890-ABC"
    }
  }
}
```

### Gestion des Redirects (CRITIQUE)

GAS retourne 302 après POST vers `googleusercontent.com`. Le problème: `fetch` avec `redirect: "follow"` convertit le POST en GET, perdant le body JSON.

**Solution implémentée dans `lib/gas.ts`:**

```typescript
// 1. Essayer d'abord avec redirect: "follow" (fonctionne pour readSheet)
let response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
  redirect: "follow",
});

let text = await response.text();

// 2. Si HTML détecté (redirect a converti POST → GET), réessayer avec gestion manuelle
if (text.trim().startsWith("<") || contentType.includes("text/html")) {
  console.log(`[GAS] HTML detected, retrying with manual redirect handling`);

  // Réessayer avec redirect manuel
  response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "manual",
  });

  // Suivre le redirect manuellement en préservant le POST + body
  if (response.status === 302) {
    const redirectUrl = response.headers.get("location");
    if (redirectUrl) {
      const absoluteUrl = redirectUrl.startsWith("http")
        ? redirectUrl
        : new URL(redirectUrl, url).toString();

      response = await fetch(absoluteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        redirect: "follow",
      });
    }
  }

  text = await response.text();
}
```

**Pourquoi cette approche:**
- `readSheet` fonctionne avec `redirect: "follow"` (le body n'est pas nécessaire après redirect)
- `appendRow`/`updateRow` nécessitent le body, donc gestion manuelle du redirect
- On essaie d'abord la méthode simple, puis fallback si HTML détecté

### Idempotence GAS

**Actuel:** Aucune protection native.
**Recommandé:** LockService (non implémenté).

```javascript
// À ajouter dans GAS pour idempotence
const lock = LockService.getScriptLock();
if (!lock.tryLock(10000)) {
  return { error: 'Resource busy, try again' };
}
try {
  // ... operation
} finally {
  lock.releaseLock();
}
```

---

## 11. SÉCURITÉ

### Webhook Validation

**Mollie Webhook:**
- `MOLLIE_WEBHOOK_SECRET` documenté mais **NON UTILISÉ**
- Sécurité par **re-fetch** depuis Mollie API avec `MOLLIE_API_KEY`
- Un attaquant ne peut pas forger un paiement "paid"
- Peut trigger des logs/erreurs en spammant (DoS partiel)

### Anti-Spam

| Protection | Implémenté |
|------------|------------|
| Rate limiting | Non |
| CAPTCHA | Non |
| Lead dedup (frontend 3s) | Oui |
| Webhook idempotence (Payments) | Partiel |

### Key Management

| Secret | Stockage | Rotation |
|--------|----------|----------|
| `GAS_KEY` | Vercel env | Changer dans GAS + Vercel simultanément |
| `MOLLIE_API_KEY` | Vercel env | Mollie dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env | Supabase dashboard |

### CORS

Next.js defaults (pas de CORS explicite). APIs server-side only.

---

## 12. OBSERVABILITÉ

### RequestId Pattern

Chaque API génère un `requestId` (UUID) pour traçabilité:

```typescript
const requestId = crypto.randomUUID();
console.log(`[mollie-webhook] Processing:`, { requestId, paymentId });
```

### Log Format

```
[{module}] {message}: { requestId, ...context }
```

**Exemples:**
```
[checkout] Mollie payment config (uuid): { eventId, webhookUrlConfigured: true }
[mollie-webhook] Payment fetched: { requestId, status: "paid", hasMetadata: true }
[GAS] Redirect detected: 302 -> https://script.google.com/...
```

### APIs avec RequestId

| API | RequestId |
|-----|-----------|
| `/api/webhooks/mollie` | Oui |
| `/api/public/checkout` | Oui |
| `/api/public/leads` | Oui |
| `/api/public/availability` | Non (à ajouter) |
| `/api/public/booking-status` | Non (à ajouter) |

### Debugging Runbook

**1. Trouver les logs d'un paiement:**
```bash
# Vercel logs (production)
vercel logs --prod | grep "tr_xxx"

# Ou via Vercel Dashboard → Logs → Filter: "tr_xxx"
```

**2. Vérifier le statut GAS:**
```bash
curl -X POST "$GAS_WEBAPP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"readSheet","key":"'$GAS_KEY'","data":{"sheetName":"Payments"}}'
```

---

## 13. RUNBOOKS

### Runbook 1: "Paiement payé mais pas de client"

**Symptôme:** Mollie montre "paid" mais Clients sheet vide.

**Investigation:**
```bash
# 1. Vérifier Payments sheet
curl -X POST "$GAS_WEBAPP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"readSheet","key":"'$GAS_KEY'","data":{"sheetName":"Payments"}}' \
  | jq '.values[] | select(.[0] == "tr_xxx")'

# 2. Vérifier logs Vercel
vercel logs --prod | grep "tr_xxx"

# 3. Re-trigger webhook manuellement (test)
curl -X POST "https://mirroreffect.co/api/webhooks/mollie" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "id=tr_xxx"
```

**Causes possibles:**
- `client_email` manquant dans metadata → webhook skip
- GAS error (timeout, quota)
- APP_URL manquant (webhook non configuré)

### Runbook 2: "Doublons clients/notifs"

**Symptôme:** Plusieurs lignes avec même Event ID.

**Investigation:**
```bash
# Compter doublons
curl -X POST "$GAS_WEBAPP_URL" ... | jq '[.values[] | .[0]] | group_by(.) | map(select(length > 1))'
```

**Cause:** Mollie retry + pas d'idempotence sur appendRow Clients.

**Fix temporaire:**
```bash
# Supprimer doublons manuellement dans Sheets
# Garder la ligne avec Created At le plus ancien
```

**Fix permanent:** Implémenter idempotence (check Event ID exists avant append).

### Runbook 3: "GAS 302 redirect / HTML au lieu de JSON"

**Symptôme:** Erreur "GAS returned HTML instead of JSON" ou "Page introuvable".

**Causes possibles:**
1. URL GAS mal formée ou deployment ID incorrect
2. Redirect 302 perd le body POST (problème résolu dans gas.ts v2.1)
3. Permissions GAS incorrectes ("Anyone" requis)

**Diagnostic:**
```bash
# 1. Test GET (doGet) - doit retourner JSON
curl -L "https://script.google.com/macros/s/YOUR_ID/exec"
# Expected: {"status":"ok"}

# 2. Test POST avec --post302 (curl suit redirect en gardant POST)
curl -L --post302 -X POST "$GAS_WEBAPP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"readSheet","key":"'$GAS_KEY'","data":{"sheetName":"Clients"}}'

# Si GET fonctionne mais POST retourne HTML → problème de redirect
```

**Fix (si problème de redirect):**
Le code `lib/gas.ts` gère maintenant automatiquement:
1. Essaie avec `redirect: "follow"`
2. Si HTML détecté, réessaie avec `redirect: "manual"` puis suit le redirect manuellement en préservant le POST body

**Fix (si problème de permissions GAS):**
1. GAS → Deploy → Manage deployments
2. Edit → Who has access: **Anyone** (pas "Anyone with Google account")
3. Version: **New version**
4. Deploy → Copier nouvelle URL → Mettre à jour Vercel

### Runbook 4: "Domain/DNS/Vercel"

**Symptôme:** Site inaccessible.

**Checklist:**
1. Vercel Dashboard → Domains → Check status
2. DNS propagation: `dig mirroreffect.co`
3. SSL: `curl -vI https://mirroreffect.co`
4. Vercel status: https://www.vercel-status.com/

---

## 14. TESTS

### Checklist Manuelle

#### Pre-Deployment
- [ ] `pnpm build` passe sans erreur
- [ ] `pnpm typecheck` passe
- [ ] Variables env configurées sur Vercel

#### Reservation Flow
- [ ] Step 1-4: Données sauvées dans localStorage
- [ ] Step 5: Lead créé dans Sheets
- [ ] Step 5: Promo intent créé
- [ ] Step 7: Checkout redirect vers Mollie
- [ ] Payment success: Redirect vers /booking/success
- [ ] Webhook: Client créé dans Sheets
- [ ] Webhook: Notifications créées

#### Availability
- [ ] Date libre: `available: true`, `remaining_mirrors: 4`
- [ ] Date avec 1 event: `remaining_mirrors: 3`
- [ ] Date complète: `available: false`, `remaining_mirrors: 0`

#### Admin
- [ ] Login fonctionne
- [ ] Dashboard charge les stats
- [ ] Events CRUD fonctionne
- [ ] Sync Google Sheets fonctionne

### Scripts Curl

**Test Availability:**
```bash
curl "https://mirroreffect.co/api/public/availability?date=2026-02-15&debug=1" | jq
```

**Test Booking Status:**
```bash
curl "https://mirroreffect.co/api/public/booking-status?event_id=EVT-xxx" | jq
```

**Test GAS Connection:**
```bash
curl -X POST "$GAS_WEBAPP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"readSheet","key":"'$GAS_KEY'","data":{"sheetName":"Clients"}}' | jq '.values | length'
```

**Test Checkout (Mock):**
```bash
curl -X POST "https://mirroreffect.co/api/public/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "fr",
    "client_name": "Test User",
    "client_email": "test@example.com",
    "client_phone": "+32123456789",
    "event_date": "2026-03-15",
    "address": "Bruxelles",
    "zone_code": "BE",
    "pack_code": "ESSENTIAL",
    "options": []
  }' | jq
```

**Test Webhook (Mock - dev only):**
```bash
curl -X POST "http://localhost:3000/api/webhooks/mollie" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "id=tr_test123"
```

**Test Lead Create:**
```bash
curl -X POST "https://mirroreffect.co/api/public/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "lead_progress",
    "step": "5",
    "client_email": "test@example.com",
    "client_name": "Test User",
    "event_date": "2026-03-15",
    "status": "step_5_completed"
  }' | jq
```

---

## 15. GO LIVE CHECKLIST

### Infrastructure

- [ ] **Vercel Web** déployé avec toutes les env vars
- [ ] **Vercel Admin** déployé avec toutes les env vars
- [ ] **DNS** configuré (mirroreffect.co, admin.mirroreffect.co)
- [ ] **SSL** actif (auto via Vercel)
- [ ] **GAS WebApp** déployé et accessible

### Configuration

- [ ] `APP_URL` = `https://mirroreffect.co` (pas de trailing slash)
- [ ] `MOLLIE_API_KEY` = `live_xxx` (pas test_)
- [ ] `GAS_KEY` identique entre Web et Admin
- [ ] Google Sheets partagé avec le compte GAS
- [ ] Supabase project en mode production

### Fonctionnel

- [ ] Homepage FR charge
- [ ] Homepage NL charge
- [ ] Reservation flow complet (step 1-7)
- [ ] Checkout Mollie fonctionne
- [ ] Webhook reçu et traité
- [ ] Client créé dans Sheets
- [ ] Email confirmation reçu
- [ ] Admin login fonctionne
- [ ] Admin dashboard charge

### Monitoring

- [ ] Vercel logs accessibles
- [ ] Alertes configurées (optionnel)
- [ ] Error tracking (Sentry - optionnel)

### Backup

- [ ] Google Sheets backup automatique (version history)
- [ ] Export CSV récent dans `/files/csv/`

---

## 16. ROADMAP V1.1 / V2

### V1.1 - Hotfixes Prioritaires

| Item | Impact | Effort |
|------|--------|--------|
| **Idempotence Clients** (check Event ID avant append) | CRITIQUE | 2h |
| **Idempotence Notifications** (check Event ID + Template) | CRITIQUE | 2h |
| **APP_URL validation** (fail early si manquant) | HIGH | 30min |
| **Données perdues** (guests, theme, vibe dans metadata) | MEDIUM | 1h |
| **RequestId** availability + booking-status | LOW | 30min |
| **GAS updateRowByLeadId** (vérifier déploiement) | MEDIUM | 1h |

### V1.2 - Améliorations

| Item | Description |
|------|-------------|
| Rate limiting | Protect /api/public/* |
| Timeout GAS | AbortController avec 30s timeout |
| Retry GAS | Exponential backoff (3 retries) |
| Webhook secret | Valider MOLLIE_WEBHOOK_SECRET (optionnel) |
| Error reporting | Intégration Sentry |

### V2 - Features

| Item | Description |
|------|-------------|
| **Email service** | Remplacer Notifications sheet par vrai email service |
| **B2B flow** | Checkout adapté pour B2B (devis, facturation) |
| **Multi-tenant** | Support plusieurs clients MirrorEffect |
| **Analytics dashboard** | Graphiques temps réel |
| **Mobile app** | App React Native pour étudiants |

---

## 17. QUICK START

### Setup Local

```bash
# 1. Clone
git clone git@github.com:your-org/mirroreffect.git
cd mirroreffect

# 2. Install
pnpm install

# 3. Env vars (copier et remplir)
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# 4. Dev
pnpm dev

# 5. Open
# Web:   http://localhost:3000
# Admin: http://localhost:3001
```

### Commandes Utiles

```bash
# Dev (tous les apps)
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Dev web only
pnpm --filter web dev

# Dev admin only
pnpm --filter admin dev

# Add dependency to web
pnpm --filter web add axios

# Add shared dependency
pnpm add -w typescript
```

### Deploy

```bash
# Via Git (auto-deploy)
git push origin main

# Via Vercel CLI
vercel --prod
```

---

## ANNEXE A: CODE GAS COMPLET

Fichier: `apps/admin/CODE_A_COPIER_COLLER.gs`

```javascript
/**
 * Actions pour l'intégration Next.js / Admin
 * Supporte: readSheet, appendRow, updateRow, updateRowByEventId,
 *           updateRowByCompositeKey, updateRowByLeadId, deleteRow
 */
function handleAdminActions_(body) {
  const action = body.action;
  const data = body.data || {};
  const key = body.key;

  const ADMIN_KEY = 'p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7';
  if (!key || key !== ADMIN_KEY) {
    return { error: 'Invalid key' };
  }

  const sh = _sheet();
  const range = sh.getDataRange();
  const vals = range.getValues();
  const head = vals.shift().map(h => String(h).trim());

  switch (action) {
    case 'readSheet':
      return readSheetForAdmin_(sh, head, vals, data.sheetName);
    case 'appendRow':
      return appendRowForAdmin_(sh, head, data.sheetName, data.values);
    case 'updateRow':
      return updateRowForAdmin_(sh, head, data.sheetName, data.id, data.values);
    case 'updateRowByEventId':
      return updateRowByEventIdForAdmin_(sh, head, data.eventId, data.values);
    case 'updateRowByCompositeKey':
      return updateRowByCompositeKeyForAdmin_(sh, head, data.sheetName,
        data.key1, data.key1Value, data.key2, data.key2Value, data.values);
    case 'updateRowByLeadId':
      return updateRowByLeadIdForAdmin_(sh, head, data.sheetName,
        data.leadId, data.values);
    case 'deleteRow':
      return deleteRowForAdmin_(sh, head, data.sheetName, data.id);
    default:
      return { error: 'Unknown action: ' + action };
  }
}
```

---

## ANNEXE B: PRICING HARDCODÉ

```typescript
// apps/web/app/api/public/checkout/route.ts

const DEPOSIT_CENTS = 18000;  // 180€

const transport_fee_cents =
  zone_code === "BE" ? 9000 :   // 90€
  11000;                        // 110€

const pack_total_cents =
  pack_code === "DISCOVERY" ? 39000 :   // 390€
  pack_code === "ESSENTIAL" ? 44000 :   // 440€
  49000;                                 // 490€ (PREMIUM)

const total_cents = transport_fee_cents + pack_total_cents;
const balance_due_cents = total_cents - DEPOSIT_CENTS;
```

---

## ANNEXE C: DIAGRAMME SÉQUENCE SIMPLIFIÉ

```
User                Web                  Mollie              GAS/Sheets
 │                   │                     │                     │
 │─── Fill form ────>│                     │                     │
 │                   │─── POST /leads ────>│────────────────────>│
 │                   │                     │                     │ append Leads
 │                   │                     │                     │
 │─── Checkout ─────>│                     │                     │
 │                   │─── Create payment ─>│                     │
 │                   │<── checkout_url ────│                     │
 │                   │─────────────────────│────────────────────>│
 │                   │                     │                     │ append Payments
 │<── Redirect ──────│                     │                     │
 │                   │                     │                     │
 │─── Pay on Mollie ─│─────────────────────>                     │
 │                   │                     │                     │
 │                   │<── Webhook (paid) ──│                     │
 │                   │                     │                     │
 │                   │─── Fetch payment ──>│                     │
 │                   │<── status=paid ─────│                     │
 │                   │                     │                     │
 │                   │─────────────────────│────────────────────>│
 │                   │                     │   append Clients    │
 │                   │                     │   update Payments   │
 │                   │                     │   append Notifs x2  │
 │                   │                     │   update Leads      │
 │                   │                     │                     │
```

---

**Fin du Blueprint v2.1**

### Changelog v2.1 (2026-01-18)
- **Fix GAS redirect**: Gestion robuste des redirects 302 qui perdaient le body POST
- **Leads is_new_lead flag**: Nouveau flag pour créer directement sans essayer update (upsert pattern)
- **Promo-intent Leads**: Écrit maintenant dans Leads sheet en plus de Notifications (non-blocking)
- **Runbook amélioré**: Diagnostic détaillé pour les problèmes GAS/HTML

*Document mis à jour le 2026-01-18. Vérifier avec le code source pour les dernières modifications.*
