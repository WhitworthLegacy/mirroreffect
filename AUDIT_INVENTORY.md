# 📊 AUDIT INVENTORY - Inventaire Détaillé

## Routes API - Admin App

| Route | Method | Handler | Sheet Used | Action GAS | Status | Notes |
|-------|--------|---------|------------|------------|--------|-------|
| `/api/gas` | POST | `app/api/gas/route.ts` | Toutes | Toutes actions | ✅ Active | Gateway unique |
| `/api/gas/debug` | GET | `app/api/gas/debug/route.ts` | - | - | ✅ Active | Debug env vars |
| `/api/events` | GET | `app/api/events/route.ts:54` | Clients | readSheet | ✅ Active | Liste events |
| `/api/events` | POST | `app/api/events/route.ts:66` | Clients | updateRowByEventId | ✅ Active | Créer event |
| `/api/events` | PATCH | `app/api/events/route.ts:131` | Clients | updateRowByEventId | ✅ Active | Mettre à jour |
| `/api/events` | DELETE | `app/api/events/route.ts:215` | Clients | deleteRow | ✅ Active | Supprimer |
| `/api/events/recalculate` | POST | `app/api/events/recalculate/route.ts` | Clients | updateRowByEventId | ✅ Active | Calcul KM/heures |
| `/api/stats/google-sheets` | GET | `app/api/stats/google-sheets/route.ts` | Stats | readSheet | ✅ Active | Stats brutes |
| `/api/stats/monthly` | GET | `app/api/stats/monthly/route.ts` | Stats | readSheet | ✅ Active | Stats formatées |
| `/api/stats/commercial` | GET | `app/api/stats/commercial/route.ts` | Commercial | readSheet | ✅ Active | Stats par commercial |
| `/api/stats/students` | GET | `app/api/stats/students/route.ts` | Students | readSheet | ✅ Active | Stats par étudiant |

**Total routes admin actives:** 11

---

## Routes API - Web App

### Public Routes

| Route | Method | Handler | Data Source | Status | Notes |
|-------|--------|---------|-------------|--------|-------|
| `/api/public/leads` | POST | `app/api/public/leads/route.ts` | GAS custom | ✅ Active | Proxy pour GAS leads |
| `/api/public/availability` | GET | `app/api/public/availability/route.ts` | Supabase | ✅ Active | Vérifie stock mirrors |
| `/api/public/booking-status` | GET | `app/api/public/booking-status/route.ts` | Supabase | ✅ Active | Status réservation |
| `/api/public/checkout` | POST | `app/api/public/checkout/route.ts` | Supabase + Mollie | ✅ Active | Crée paiement |
| `/api/public/promo-intent` | POST | `app/api/public/promo-intent/route.ts` | Supabase | ✅ Active | Intent promo code |

### Webhooks

| Route | Method | Handler | Data Source | Status | Notes |
|-------|--------|---------|-------------|--------|-------|
| `/api/webhooks/mollie` | POST | `app/api/webhooks/mollie/route.ts` | Supabase + Mollie | ✅ Active | Webhook paiement |

### Debug Routes

| Route | Method | Handler | Purpose | Status |
|-------|--------|---------|---------|--------|
| `/api/debug/env` | GET | `app/api/debug/env/route.ts` | Liste env vars | ✅ Active |
| `/api/debug/health` | GET | `app/api/debug/health/route.ts` | Health check Supabase | ✅ Active |

**Total routes web actives:** 8

### Routes Désactivées (`_disabled/`)

| Dossier | Routes | Raison |
|---------|--------|--------|
| `/api/_disabled/admin/*` | 9 routes | Migrées vers `/apps/admin` |
| `/api/_disabled/booking/*` | 2 routes | Remplacées par `/api/public/checkout` |
| `/api/_disabled/events/*` | 1 route | Migrée vers `/apps/admin` |
| `/api/_disabled/stock/*` | 1 route | Non migré (Supabase) |
| `/api/_disabled/cron/*` | 1 route | Cron emails (Supabase) |
| `/api/_disabled/payments/*` | 1 route | Intégré dans checkout |
| `/api/_disabled/crm-b2b/*` | 1 route | Migré vers `/apps/admin` |
| `/api/_disabled/webhooks/zenfacture/*` | 1 route | Obsolète |

**Total routes désactivées:** ~17 (à supprimer si confirmé obsolète)

---

## Pages - Admin App

| Route | Page File | Client Component | Data Source | Store Used |
|-------|-----------|------------------|-------------|------------|
| `/` | `app/page.tsx` | `DashboardPageClient` | `/api/stats/monthly` | - |
| `/events` | `app/events/page.tsx` | `EventsPageClient` | `clientsStore` | `useClientsStore` |
| `/crm` | `app/crm/page.tsx` | `CrmPageClient` | `clientsStore` | `useClientsStore` |
| `/students` | `app/students/page.tsx` | `StudentsPageClient` | `/api/stats/students` | - |
| `/commercial` | `app/commercial/page.tsx` | `CommercialPageClient` | `/api/stats/commercial` | - |
| `/availability` | `app/availability/page.tsx` | `AvailabilityPageClient` | Supabase | - |
| `/inventory` | `app/inventory/page.tsx` | `InventoryPageClient` | Supabase | - |
| `/notifications` | `app/notifications/page.tsx` | `NotificationsPageClient` | Supabase | - |
| `/etudiant` | `app/etudiant/page.tsx` | `StudentsView` | `/api/stats/students` | - |
| `/login` | `app/login/page.tsx` | - | Supabase Auth | - |
| `/health` | `app/health/page.tsx` | - | - | - |

**Total pages admin:** 11

---

## Pages - Web App

| Route | Page File | Client Component | Data Source |
|-------|-----------|------------------|-------------|
| `/` | `app/page.tsx` | `ReservationFlow` | Supabase (availability) |
| `/booking/success` | `app/booking/success/page.tsx` | `BookingSuccess` | Query params |
| `/booking/failed` | `app/booking/failed/page.tsx` | `BookingFailed` | Query params |
| `/reservation` | `app/reservation/page.tsx` | `ReservationFlow` | Supabase |
| `/nl` | `app/nl/page.tsx` | - | Contenu statique |
| `/(seo)/[...slug]` | `app/(seo)/[...slug]/page.tsx` | - | `/content/seo/*` |
| `/debug/styles` | `app/debug/styles/page.tsx` | - | Debug |

**Total pages web:** 7+ (SEO dynamique)

---

## Composants - Admin App

| Composant | Fichier | Usage | Props |
|-----------|---------|-------|-------|
| `AdminDataLoader` | `components/AdminDataLoader.tsx` | Wrapper chargement données | - |
| `AvailabilityCalendar` | `components/AvailabilityCalendar.tsx` | Calendrier disponibilité | - |
| `AvailabilityPageClient` | `components/AvailabilityPageClient.tsx` | Client availability page | - |
| `CommercialModal` | `components/CommercialModal.tsx` | Modal stats commercial | - |
| `CrmList` | `components/CrmList.tsx` | Liste CRM | - |
| `CrmModal` | `components/CrmModal.tsx` | Modal CRM | - |
| `CrmPageClient` | `components/CrmPageClient.tsx` | Client CRM page | - |
| `DashboardCharts` | `components/DashboardCharts.tsx` | Graphiques dashboard | - |
| `DashboardPageClient` | `components/DashboardPageClient.tsx` | Client dashboard | - |
| `EventAddressEditor` | `components/EventAddressEditor.tsx` | Éditeur adresse | - |
| `EventModal` | `components/EventModal.tsx` | Modal event | - |
| `EventsList` | `components/EventsList.tsx` | Liste events | - |
| `EventsPageClient` | `components/EventsPageClient.tsx` | Client events page | - |
| `EventsSheet` | `components/EventsSheet.tsx` | Table events | - |
| `InventoryPageClient` | `components/InventoryPageClient.tsx` | Client inventory | - |
| `NotificationsPageClient` | `components/NotificationsPageClient.tsx` | Client notifications | - |
| `StatsModal` | `components/StatsModal.tsx` | Modal stats | - |
| `StudentModal` | `components/StudentModal.tsx` | Modal étudiant | - |
| `StudentsList` | `components/StudentsList.tsx` | Liste étudiants | - |
| `StudentsPageClient` | `components/StudentsPageClient.tsx` | Client students | - |
| `StudentsView` | `components/StudentsView.tsx` | Vue étudiants alternative | - |

**Total composants admin:** 22

---

## Stores Zustand

| Store | Fichier | State | Actions | Usage |
|-------|---------|-------|---------|-------|
| `clientsStore` | `lib/clientsStore.ts` | rows, headers, loading, dirtyByEventId | loadClients, refreshClients, updateLocal, saveEvent | Events, CRM |
| `sheetsStore` | `lib/sheetsStore.ts` | clientsRows, statsRows, studentsRows, events | loadAll, refresh, updateLocal, saveEvent | Unifié (alternatif) |

**⚠️ DUPLICATION:** 2 stores avec logique similaire.

---

## Packages Partagés

### `packages/core`

| Module | Export | Usage |
|--------|--------|-------|
| `booking.ts` | Schemas Zod | Validation booking (non utilisé actuellement) |
| `availability.ts` | Schemas Zod | Validation availability (non utilisé actuellement) |
| `events.ts` | Schemas Zod | Validation events (non utilisé actuellement) |
| `crmB2b.ts` | Schemas Zod | Validation CRM (non utilisé actuellement) |
| `stock.ts` | Schemas Zod | Validation stock (non utilisé actuellement) |
| `payments.ts` | Schemas Zod | Validation payments (non utilisé actuellement) |
| `webhooks.ts` | Schemas Zod | Validation webhooks (non utilisé actuellement) |
| `admin.ts` | Schemas Zod | Validation admin (non utilisé actuellement) |

**⚠️ PROBLÈME:** Schemas Zod existent mais ne sont pas utilisés dans les API routes.

### `packages/ui`

**État:** Vide (pas de composants exportés)

---

## Dépendances Supabase

### Utilisé Pour

| App | Usage | Fichiers | Env Vars |
|-----|-------|----------|----------|
| **Admin** | Auth (login) | `lib/supabaseBrowser.ts`, `lib/supabaseServer.ts`, `app/admin-guard.tsx`, `app/login/page.tsx` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Admin** | Packs (lecture) | `lib/adminData.ts:93` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Web** | Events (CRUD) | `app/api/public/leads/route.ts`, `app/api/public/booking-status/route.ts` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Web** | Payments (CRUD) | `app/api/public/checkout/route.ts`, `app/api/webhooks/mollie/route.ts` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Web** | Stock (lecture) | `app/api/public/availability/route.ts` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Web** | Notifications | `app/api/public/leads/route.ts`, `app/api/public/promo-intent/route.ts` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

### Tables Supabase Requises (Web App)

| Table | Usage | Colonnes clés |
|-------|-------|---------------|
| `events` | Events créés via web | id, event_date, client_name, status, etc. |
| `payments` | Paiements Mollie | id, event_id, provider, provider_payment_id, status |
| `notification_queue` | Queue notifications | id, event_id, template_id, status |
| `stock_mirrors` | Inventaire miroirs | id, name, status |
| `reservations` | Réservations miroirs | id, mirror_id, event_id, date |

### Tables Supabase Requises (Admin)

| Table | Usage | Colonnes clés |
|-------|-------|---------------|
| `packs` | Packs tarifs | id, name, price_cents, etc. |
| `auth.users` | Authentification | (géré par Supabase Auth) |

**⚠️ INCOHÉRENCE:** Admin utilise Sheets pour events, Web utilise Supabase pour events.

---

## Duplications Identifiées

### Code Dupliqué

| Élément | Fichiers | Lignes | Risque |
|---------|----------|--------|--------|
| `mapClientsRowToEventRow()` | `lib/googleSheets.ts:960`, `lib/clientsStore.ts:10`, `lib/sheetsStore.ts:12` | ~150 lignes × 3 | 🔴 Élevé |
| `eventRowToSheetValues()` | `lib/googleSheets.ts:468`, `lib/clientsStore.ts:138`, `lib/sheetsStore.ts:347` | ~70 lignes × 3 | 🔴 Élevé |
| Store logique | `clientsStore.ts`, `sheetsStore.ts` | ~500 lignes × 2 | 🟡 Moyen |
| GAS client | `lib/gas.ts` (admin), `lib/gas.ts` (web) | ~275 lignes × 2 | 🟢 Faible (différences) |

### Fichiers Obsolètes

| Fichier | Raison | Action |
|---------|--------|--------|
| `scripts/cleanup-old-tables.sql` | Supabase obsolète | 🗑️ Supprimer |
| `scripts/create-tables.sql` | Supabase obsolète | 🗑️ Supprimer |
| `scripts/create-monthly-stats-view.sql` | Supabase obsolète | 🗑️ Supprimer |
| `scripts/migrate-*.sql` | Migrations obsolètes | 🗑️ Supprimer |
| `app/api/_disabled/**` | Routes désactivées | 🗑️ Supprimer ou archiver |

---

**Dernière mise à jour:** 2026-01-12
