# 🔷 BLUEPRINT MIRROREFFECT - Documentation Complète

## 📋 Résumé Exécutif

**Monorepo TypeScript** utilisant **Turborepo + pnpm** avec 2 applications Next.js et packages partagés.

**Architecture principale:**
- ✅ **Google Sheets** = Source de vérité unique (Clients, Stats, Students, Commercial)
- ✅ **Google Apps Script (GAS)** = Gateway server-side pour Sheets (via `/api/gas`)
- ⚠️ **Supabase** = Uniquement pour **auth admin** et **packs** (temporaire, migrable)
- ✅ **Zustand** = State management client-side (stores pour Sheets)
- ✅ **Next.js 14** = App Router (server components + API routes)

**Points critiques pour duplication:**
1. **4 feuilles Google Sheets** requises: `Clients`, `Stats`, `Students`, `Commercial`
2. **Headers de colonnes** doivent être exacts (mapping strict dans le code)
3. **GAS WebApp** doit être déployé avec 6 actions: `readSheet`, `appendRow`, `updateRow`, `updateRowByEventId`, `updateRowByCompositeKey`, `deleteRow`
4. **Supabase auth** peut être remplacé si désiré (actuellement requis pour login admin)
5. **12+ routes API** actives dans admin, 7+ routes publiques dans web
6. **Mollie** = Intégration paiement (optionnel, utilisé pour checkout web)

---

## ✅ 0. Quick Start (15 minutes)

**Objectif :** dupliquer MirrorEffect sans réfléchir.

### 1. Google Sheets

- Crée un nouveau Google Spreadsheet
- Crée 4 onglets : `Clients`, `Stats`, `Students`, `Commercial`
- Colle les headers exacts (ligne 1) dans chaque onglet (voir `SHEETS_CONTRACT.md` ou `files/csv/*.csv`)

### 2. Google Apps Script (GAS)

- Crée un nouveau projet Apps Script lié au Sheet
- Copie `apps/admin/CODE_A_COPIER_COLLER.gs` dans `App.gs`
- Mets à jour :
  - `SS_ID` = l'ID du nouveau Spreadsheet
  - `ADMIN_KEY` = une clé secrète (nouvelle)
- Déploie en Web App :
  - Execute as: `Me`
  - Who has access: `Anyone`

### 3. Vercel (Admin)

- Ajoute env vars :
  - `GAS_WEBAPP_URL` (URL du GAS déployé)
  - `GAS_KEY` (clé secrète configurée dans GAS)
  - `GOOGLE_SHEETS_SPREADSHEET_ID`
- Redeploy

### 4. Smoke test

- Ouvre `GET /api/gas/debug`
  - Attendu : `{ ok: true, rowCount: ... }`
- Ouvre `/events` → les événements s'affichent

---

## ✅ 0.1 Source of Truth (Règle d'or)

### Admin = Google Sheets (100%)

- Toute lecture/écriture d'events/finance/stats côté admin vient **uniquement** de Sheets (`Clients`, `Stats`, etc.)

### Web = (temporairement) Supabase

- Incohérence assumée pour l'instant
- **Roadmap :** migrer Web → Sheets (ou isoler clairement les responsabilités)

### ⚠️ Interdit

- Avoir une route admin qui écrit ailleurs que Sheets (ex: Supabase).

---

## ✅ 0.2 Contrat des colonnes = 1 seule source (anti-casse)

**Problème actuel :** mappings dupliqués (3x) → bugs silencieux.

**Règle :**
- Un seul mapping officiel : `apps/admin/lib/googleSheets.ts`
- Tous les stores (`clientsStore`, `sheetsStore`) importent ce mapping
- Toute nouvelle colonne = ajout uniquement dans `googleSheets.ts`

**But :** un changement de header ne casse pas "en cachette" ailleurs.

---

## ✅ 0.3 Performance — Option A (Load Once + Refresh + Dirty Push)

**Objectif :** éviter les 3–5s à chaque onglet.

### Stratégie

- **Load Once** au boot admin (ou première visite) :
  - `readSheet("Clients")`, `readSheet("Stats")` (si nécessaire)
- **Stockage en Zustand :**
  - `headers`, `rows`, `lastSyncAt`, `loading`
  - `dirtyByEventId: Record<string, Partial<RowUpdate>>`
- **Refresh Button :**
  - re-fetch Sheets et remplace le store
- **Save Button / Auto-save optionnel :**
  - push uniquement ce qui est "dirty" via `updateRowByEventId`

### UX

- Afficher "Dernière sync: hh:mm"
- Bouton Rafraîchir
- Bouton Sauvegarder (désactivé si rien à push)

**Note :** Les stores `clientsStore.ts` et `sheetsStore.ts` supportent déjà cette architecture (`loadOnce()`, `refreshClients()`, `dirtyByEventId`).

---

## ✅ 0.4 Vercel Duplication Checklist (2 projets)

### Setup recommandé

- **2 projets Vercel :**
  1. `mirroreffect-admin` → root = `apps/admin`
  2. `mirroreffect-web` → root = `apps/web`

### Points critiques

- `GAS_KEY` server-only (jamais `NEXT_PUBLIC_*`)
- Vérifier Node version cohérente (18+ / 20 recommandé)
- Rebuild après changement env vars

---

## ✅ 0.5 Smoke Tests (obligatoires avant prod)

1. `GET /api/gas/debug` → `ok: true`, `rowCount > 0`
2. `GET /api/events` → renvoie une liste
3. Modifier un event (marge/km/etc.) → save → refresh → valeur persistée dans Sheets
4. Dashboard :
   - CA / marges / cashflow = valeurs provenant de l'onglet `Stats` (sur le bon mois)
5. Navigation :
   - changer d'onglet ne doit pas re-fetch systématiquement si store déjà chargé (Option A)

---

## 1. Repo Overview

### Structure Monorepo

```
mirroreffect/
├── apps/
│   ├── admin/          # Application admin (Next.js 14)
│   └── web/            # Application publique (Next.js 14)
├── packages/
│   ├── core/           # Types Zod + logique partagée
│   └── ui/             # Composants partagés (vide actuellement)
├── files/csv/          # Exemples de structure de sheets (référence)
├── tooling/            # Scripts utilitaires
├── package.json        # Root workspace
├── pnpm-workspace.yaml # Configuration workspace
└── turbo.json          # Configuration Turborepo
```

### Applications

#### `apps/admin`
**Rôle:** Interface d'administration complète pour gérer events, stats, étudiants, commerciaux, disponibilité, inventaire, notifications, CRM.

**Tech stack:**
- Next.js 14.2.5 (App Router)
- React 18.3.1
- Zustand 4.5.2 (state management)
- Supabase JS 2.45.1 (auth uniquement)
- Tailwind CSS (via globals.css)
- TypeScript 5.4.5

**Pages principales:**
- `/` - Dashboard avec stats mensuelles
- `/events` - Gestion des events (CRUD)
- `/crm` - CRM B2B
- `/students` - Gestion étudiants
- `/commercial` - Stats commerciaux
- `/availability` - Calendrier disponibilité
- `/inventory` - Gestion stock
- `/notifications` - Queue notifications
- `/etudiant` - Vue alternative étudiants
- `/login` - Authentification

#### `apps/web`
**Rôle:** Site public avec réservation, checkout Mollie, leads capture, SEO pages.

**Tech stack:**
- Next.js 14.2.5 (App Router)
- React 18.3.1
- Framer Motion 11.0.0 (animations)
- Supabase JS 2.45.1 (lecture events/payments, auth notifications)
- Nodemailer 6.9.14 (emails)
- Tailwind CSS
- TypeScript 5.4.5

**Pages principales:**
- `/` - Homepage avec flow de réservation
- `/booking/*` - Pages de confirmation/erreur
- `/reservation` - Flow réservation
- `/nl` - Version néerlandaise
- `/(seo)/[...slug]` - Pages SEO dynamiques (blog, pages locales, etc.)

### Packages

#### `packages/core`
**Exports:** Types Zod, validation schemas pour booking, availability, events, crmB2b, stock, payments, webhooks, admin.

#### `packages/ui`
**État:** Vide (package.json présent mais pas de composants exportés).

---

## 2. Data Architecture (Google Sheets as DB)

### Source de Vérité: 4 Feuilles Google Sheets

| Feuille | Usage | Colonne Clé | Actions |
|---------|-------|-------------|---------|
| **Clients** | Events (tous les champs event + finance) | `Event ID` | readSheet, updateRowByEventId, appendRow, deleteRow |
| **Stats** | Stats mensuelles (KPIs, marges, cashflow) | `Date` | readSheet, updateRowByCompositeKey |
| **Students** | Stats mensuelles par étudiant | `month` + `student_name` | readSheet, updateRowByCompositeKey |
| **Commercial** | Stats mensuelles par commercial | `month` + `commercial_name` | readSheet, updateRowByCompositeKey |

### Flux de Données

```
┌─────────────────┐
│  UI Component   │ (Client)
└────────┬────────┘
         │ POST /api/gas
         ▼
┌─────────────────┐
│ /api/gas/route  │ (Next.js API Route - Admin)
│ lib/gas.ts      │ (gasPostAdmin)
└────────┬────────┘
         │ POST GAS_WEBAPP_URL
         │ { action, key: GAS_KEY, data }
         ▼
┌─────────────────┐
│  GAS WebApp     │ (Google Apps Script)
│  doPost()       │
│  handleAdminActions_()
└────────┬────────┘
         │ SpreadsheetApp API
         ▼
┌─────────────────┐
│  Google Sheets  │ (Source de vérité)
└─────────────────┘
```

### Actions GAS Supportées

| Action | Payload | Usage |
|--------|---------|-------|
| `readSheet` | `{ sheetName: "Clients" \| "Stats" \| "Students" \| "Commercial" }` | Lecture complète |
| `appendRow` | `{ sheetName, values: [...] }` | Ajouter une ligne |
| `updateRow` | `{ sheetName, id, values: [...] }` | Mettre à jour par ID (colonne A) |
| `updateRowByEventId` | `{ eventId, values: { "Nom": "...", "Total": "..." } }` | Mise à jour Clients par Event ID avec mapping colonnes |
| `updateRowByCompositeKey` | `{ sheetName, key1, key1Value, key2, key2Value, values: {...} }` | Mise à jour Stats/Students/Commercial par clé composite |
| `deleteRow` | `{ sheetName, id }` | Supprimer une ligne |

**Fichier GAS:** `apps/admin/CODE_A_COPIER_COLLER.gs` contient le code complet à copier dans App.gs.

### Mapping Colonnes Sheets → Types TypeScript

**Localisation:** 
- `apps/admin/lib/googleSheets.ts` - `mapClientsRowToEventRow()` (ligne ~960)
- `apps/admin/lib/clientsStore.ts` - `mapClientsRowToEventRow()` (ligne ~10) - **DUPLIQUÉ**
- `apps/admin/lib/sheetsStore.ts` - `mapClientsRowToEventRow()` (ligne ~12) - **DUPLIQUÉ**

**Format de données:**
- **Euros:** Format européen avec virgule (`"1.234,56"` → `123456` centimes)
- **Dates:** Format `YYYY-MM-DD` ou parsing flexible (`DD/MM/YYYY`)
- **Booléens:** `"true"/"false"`, `"1"/"0"`, `"oui"/"non"`

**Headers Clients (exacts, sensibles à la casse):**
```
Event ID | Date Event | Type Event | Language | Nom | Email | Phone | Lieu Event | Pack | Pack (€) | Total | Transport (€) | Acompte | Solde Restant | Etudiant | Heures Etudiant | Etudiant €/Event | KM (Aller) | KM (Total) | Coût Essence | Commercial | Comm Commercial | Marge Brut (Event) | Acompte Facture | Solde Facture | Invités
```

**⚠️ RISQUE:** Les mappings sont dupliqués dans 3 fichiers. Si vous changez un header, il faut modifier les 3 fonctions.

**✅ RECOMMANDATION:** Centraliser le mapping dans `googleSheets.ts` et importer dans les stores.

---

## 3. Auth & Roles (admin)

### Authentification Actuelle

**Méthode:** Supabase Auth (session-based)

**Fichiers:**
- `apps/admin/lib/supabaseBrowser.ts` - Client browser (login)
- `apps/admin/lib/supabaseServer.ts` - Client server (lecture packs)
- `apps/admin/app/admin-guard.tsx` - Guard protection routes
- `apps/admin/app/login/page.tsx` - Page login

**Variables requises:**
- `NEXT_PUBLIC_SUPABASE_URL` (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_URL` (server-only)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

**Protection:**
- Toutes les routes sauf `/login` et `/health` sont protégées par `AdminGuard`
- Vérification session via `supabase.auth.getSession()` (client-side)
- Redirection vers `/login` si non authentifié

### Rôles

**Actuellement:** Pas de système de rôles (session = accès admin complet).

**Comment changer:**
1. **Option A:** Garder Supabase Auth, ajouter des métadonnées utilisateur (rôle Admin/Sales)
2. **Option B:** Remplacer par NextAuth.js ou autre (nécessite modification `admin-guard.tsx` et `login/page.tsx`)
3. **Option C:** Auth simple avec JWT + cookie (nécessite création d'un système custom)

---

## 4. API Inventory

### Admin App (`/apps/admin/app/api/`)

#### ✅ Actives

| Route | Méthode | Purpose | Sheet/Action | Status |
|-------|---------|---------|--------------|--------|
| `/api/gas` | POST | Gateway unique vers GAS | Toutes actions | ✅ Active |
| `/api/gas/debug` | GET | Debug env vars GAS | - | ✅ Active |
| `/api/events` | GET/POST/PATCH/DELETE | CRUD events | Clients (via `/api/gas`) | ✅ Active |
| `/api/events/recalculate` | POST | Calcul KM/heures étudiant | Clients (updateRowByEventId) | ✅ Active |
| `/api/stats/google-sheets` | GET | Stats mensuelles | Stats (readSheet) | ✅ Active |
| `/api/stats/commercial` | GET | Stats commercial | Commercial (readSheet) | ✅ Active |
| `/api/stats/students` | GET | Stats étudiants | Students (readSheet) | ✅ Active |
| `/api/stats/monthly` | GET | Stats mensuelles (format dashboard) | Stats (readSheet) | ✅ Active |

#### ⚠️ Risques

- **Duplication:** 2 stores (`clientsStore.ts` + `sheetsStore.ts`) avec mapping dupliqué
- **Performance:** Chaque page charge Sheets via `/api/gas` - pas de cache partagé
- **Pas de validation:** Payloads events non validés avec Zod (utilisé uniquement dans `packages/core`)

### Web App (`/apps/web/app/api/`)

#### ✅ Actives (Public)

| Route | Méthode | Purpose | Sheet/Action | Status |
|-------|---------|---------|--------------|--------|
| `/api/public/leads` | POST | Capture leads | GAS custom (pas admin) | ✅ Active |
| `/api/public/availability` | GET | Vérifier disponibilité | Supabase (stock_mirrors) | ✅ Active (Supabase) |
| `/api/public/booking-status` | GET | Status réservation | Supabase (events, payments) | ✅ Active (Supabase) |
| `/api/public/checkout` | POST | Créer paiement Mollie | Supabase (payments) | ✅ Active (Supabase) |
| `/api/public/event-intent` | POST | Créer intent event | Supabase (events, notification_queue) | ✅ Active (Supabase) |
| `/api/public/promo-intent` | POST | Intent promo code | Supabase (notification_queue) | ✅ Active (Supabase) |

#### ✅ Actives (Webhooks)

| Route | Méthode | Purpose | Sheet/Action | Status |
|-------|---------|---------|--------------|--------|
| `/api/webhooks/mollie` | POST | Webhook paiement Mollie | Supabase (payments, events, event_resources, notification_queue) | ✅ Active (Supabase) |

#### 🗑️ Désactivées (`/api/_disabled/`)

Toutes les routes dans `_disabled/` sont **obsolètes** mais gardées pour référence:
- `/api/_disabled/admin/*` - Routes admin migrées vers `/apps/admin`
- `/api/_disabled/booking/*` - Booking remplacé par `/api/public/checkout`
- `/api/_disabled/events/*` - Events migrés vers `/apps/admin`
- `/api/_disabled/stock/*` - Stock géré via Supabase (pas migré vers Sheets)
- `/api/_disabled/cron/*` - Cron dispatch emails (Supabase)
- `/api/_disabled/payments/*` - Payments intégrés dans checkout
- `/api/_disabled/crm-b2b/*` - CRM migré vers `/apps/admin`

#### ⚠️ Risques

- **Supabase toujours utilisé:** Events/payments/stock dans web app utilisent Supabase
- **Incohérence:** Admin utilise Sheets, Web utilise Supabase pour events
- **Webhook Mollie:** Nécessite `MOLLIE_WEBHOOK_SECRET` dans env vars

### Debug Routes

| Route | App | Purpose |
|-------|-----|---------|
| `/api/debug/env` | web | Liste env vars présents (sans valeurs) |
| `/api/debug/health` | web | Health check Supabase |

---

## 5. Pages & Modules Inventory

### Admin App Pages

| Page | Composant | Data Source | Performance Issue |
|------|-----------|-------------|-------------------|
| `/` (Dashboard) | `DashboardPageClient` | `/api/stats/monthly` → Stats sheet | ⚠️ Charge Stats à chaque render |
| `/events` | `EventsPageClient` | `clientsStore` → `/api/gas` → Clients | ⚠️ Chargement complet à chaque visit |
| `/crm` | `CrmPageClient` | `clientsStore` (filtre B2B) | ⚠️ Dépend de clientsStore chargé |
| `/students` | `StudentsPageClient` | `/api/stats/students` → Students | ⚠️ Pas de cache |
| `/commercial` | `CommercialPageClient` | `/api/stats/commercial` → Commercial | ⚠️ Pas de cache |
| `/availability` | `AvailabilityPageClient` | Supabase (stock_mirrors, reservations) | ⚠️ Supabase, pas Sheets |
| `/inventory` | `InventoryPageClient` | Supabase (stock_mirrors) | ⚠️ Supabase, pas Sheets |
| `/notifications` | `NotificationsPageClient` | Supabase (notification_queue) | ⚠️ Supabase, pas Sheets |
| `/etudiant` | `StudentsView` | `/api/stats/students` + fallback Supabase | ⚠️ Fallback Supabase obsolète |

**Store Architecture:**
- `clientsStore.ts` - Store Zustand pour Clients (loadOnce, refresh, dirty tracking)
- `sheetsStore.ts` - Store unifié Clients + Stats + Students (loadAll, refresh)

**⚠️ DUPLICATION:** 2 stores avec logique similaire mais usage différent.

### Web App Pages

| Page | Composant | Data Source |
|------|-----------|-------------|
| `/` | `ReservationFlow` | Supabase (events pour disponibilité) |
| `/booking/success` | `BookingSuccess` | Query params (event_id, payment_id) |
| `/booking/failed` | `BookingFailed` | Query params |
| `/reservation` | `ReservationFlow` | Supabase |
| `/(seo)/[...slug]` | Contenu statique SEO | Fichiers `/content/seo/*` |

**⚠️ PROBLÈME:** Web app utilise Supabase pour events, alors que admin utilise Sheets. Incohérence architecturale.

---

## 6. Config & Deployment

### Variables d'Environnement

#### Admin App (Vercel)

**Google Sheets (OBLIGATOIRE):**
- `GOOGLE_SHEETS_SPREADSHEET_ID` (server-only)
- `GAS_WEBAPP_URL` (server-only)
- `GAS_KEY` (server-only)

**Google Maps (pour recalculate):**
- `GOOGLE_MAPS_API_KEY` (server-only)

**Supabase (auth + packs):**
- `NEXT_PUBLIC_SUPABASE_URL` (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_URL` (server-only)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

**Optionnel (OAuth/Service Account si pas GAS):**
- `GOOGLE_SHEETS_CLIENT_ID`
- `GOOGLE_SHEETS_CLIENT_SECRET`
- `GOOGLE_SHEETS_REFRESH_TOKEN`
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY`

#### Web App (Vercel)

**Supabase (OBLIGATOIRE):**
- `NEXT_PUBLIC_SUPABASE_URL` (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_URL` (server-only)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

**Mollie (paiement):**
- `MOLLIE_API_KEY` (server-only)
- `MOLLIE_WEBHOOK_SECRET` (server-only)

**App URL:**
- `APP_URL` (server-only) - URL publique pour webhooks

**GAS (pour leads):**
- `GAS_WEBAPP_URL` (server-only) - URL GAS custom (différente de admin)

**Email (Nodemailer):**
- `SMTP_*` vars (si emails custom)

### Build & Deploy

**Commandes:**
```bash
pnpm install          # Install dependencies
pnpm dev              # Dev (turbo run dev)
pnpm build            # Build (turbo run build)
pnpm lint             # Lint
pnpm typecheck        # Type check
```

**Vercel Setup:**
- **Framework Preset:** Next.js
- **Build Command:** `cd ../.. && pnpm build` (si apps séparés) ou `pnpm build` (si root)
- **Output Directory:** `.next`
- **Install Command:** `pnpm install`
- **Node Version:** 18+ (recommandé 20)

**Turborepo:**
- Cache activé pour `build`, `lint`, `typecheck`
- Pas de cache pour `dev`

### Cron / Webhooks

**Webhooks externes:**
- `/api/webhooks/mollie` - Configuré dans dashboard Mollie
  - Secret: `MOLLIE_WEBHOOK_SECRET`
  - URL: `https://votre-domaine.com/api/webhooks/mollie`

**Cron (obsolète):**
- `/api/_disabled/cron/dispatch-emails` - Désactivé (utilisait Supabase)

---

## 7. Cleanup & Duplication Plan

### 🗑️ Liste de Suppression (à confirmer avant)

**Fichiers obsolètes:**
- `apps/admin/scripts/cleanup-old-tables.sql` - SQL Supabase obsolète
- `apps/admin/scripts/create-tables.sql` - SQL Supabase obsolète
- `apps/admin/scripts/create-monthly-stats-view.sql` - SQL Supabase obsolète
- `apps/admin/scripts/migrate-*.sql` - Migrations Supabase obsolètes
- `apps/admin/AUDIT_PHASE1.md` - Ancien audit (garder pour référence?)
- `apps/admin/PHASE2_COMPLETE.md` - Phase complétée (garder?)
- `apps/admin/PHASE2_SCAN_REPORT.md` - Scan report (garder?)
- `apps/web/app/api/_disabled/**` - Routes désactivées (garder pour référence ou supprimer)

**Code dupliqué:**
- `clientsStore.ts` - Mapping `mapClientsRowToEventRow()` dupliqué 3x
- `sheetsStore.ts` - Store similaire à `clientsStore.ts` mais plus complet

**Dépendances inutiles:**
- `jsonwebtoken` dans admin (utilisé uniquement pour OAuth Service Account, optionnel)

### ✅ Liste de Conservation (Core)

**Admin:**
- `lib/googleSheets.ts` - **CORE** - Toutes les fonctions Sheets
- `lib/gas.ts` - **CORE** - Client GAS robuste
- `lib/clientsStore.ts` ou `lib/sheetsStore.ts` - **CHOISIR UN** (garder `sheetsStore.ts`?)
- `app/api/gas/route.ts` - **CORE** - Gateway GAS
- `app/api/events/route.ts` - **CORE** - CRUD events
- `components/*` - Tous les composants UI

**Web:**
- `lib/gas.ts` - Client GAS pour leads
- `app/api/public/*` - Routes publiques actives
- `app/api/webhooks/mollie/route.ts` - Webhook Mollie
- `components/home/*` - Composants homepage

**Packages:**
- `packages/core/*` - Types Zod partagés

**Config:**
- `CODE_A_COPIER_COLLER.gs` - **CORE** - Code GAS à copier
- `VERCEL_ENV_VARIABLES.md` - Référence env vars

### 📋 Checklist Duplication Projet

#### Étape 1: Setup Repo
- [ ] Clone le repo `mirroreffect`
- [ ] Renommer le workspace dans `package.json` (si désiré)
- [ ] Installer dépendances: `pnpm install`

#### Étape 2: Google Sheets
- [ ] Créer un nouveau Google Sheet avec 4 feuilles: `Clients`, `Stats`, `Students`, `Commercial`
- [ ] Copier les headers depuis `files/csv/*.csv` (première ligne)
- [ ] Copier `CODE_A_COPIER_COLLER.gs` dans votre App.gs
- [ ] Modifier `SS_ID` dans GAS = ID de votre Google Sheet
- [ ] Modifier `ADMIN_KEY` dans GAS = nouvelle clé secrète
- [ ] Déployer GAS comme Web App (Execute as: Me, Access: Anyone)
- [ ] Noter l'URL de déploiement GAS

#### Étape 3: Variables d'Environnement
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` = ID du nouveau Sheet
- [ ] `GAS_WEBAPP_URL` = URL du nouveau GAS WebApp
- [ ] `GAS_KEY` = Clé secrète configurée dans GAS
- [ ] `GOOGLE_MAPS_API_KEY` (si recalculate utilisé)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (auth)
- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server)
- [ ] `MOLLIE_API_KEY` + `MOLLIE_WEBHOOK_SECRET` (si checkout web utilisé)
- [ ] `APP_URL` = URL publique (pour webhooks)

#### Étape 4: Branding
- [ ] Rechercher/remplacer `mirroreffect` → nouveau nom (si désiré)
- [ ] Mettre à jour les titres dans `apps/web/content/seo/*`
- [ ] Mettre à jour les domaines dans `next.config.mjs` (si nécessaire)

#### Étape 5: Supabase (si gardé)
- [ ] Créer un nouveau projet Supabase
- [ ] Créer table `packs` (voir `apps/admin/lib/adminData.ts` ligne ~93)
- [ ] Créer tables pour web app: `events`, `payments`, `notification_queue`, `stock_mirrors`, `reservations` (si web app utilisé)
- [ ] Configurer auth providers dans Supabase

#### Étape 6: Tests Smoke
- [ ] Lancer `pnpm dev` localement
- [ ] Tester login admin (`/login`)
- [ ] Tester chargement events (`/events`)
- [ ] Tester création event (POST `/api/events`)
- [ ] Tester update event (PATCH `/api/events`)
- [ ] Tester chargement stats (`/`)
- [ ] Tester webhook Mollie (si utilisé)

#### Étape 7: Vercel Deploy
- [ ] Créer 2 projets Vercel (admin + web) ou utiliser monorepo
- [ ] Configurer env vars dans Vercel (voir `ENV_TEMPLATE.md`)
- [ ] Déployer admin app
- [ ] Déployer web app
- [ ] Tester en production

---

## 🚨 Risques & Recommandations

### Risques Majeurs

1. **Headers Sheets sensibles à la casse** - Si un header change, le mapping casse silencieusement
2. **Duplication mapping** - 3 fonctions `mapClientsRowToEventRow` (risque de désync)
3. **Incohérence Supabase/Sheets** - Admin = Sheets, Web = Supabase (pour events)
4. **Pas de validation Zod** - API routes n'utilisent pas les schemas de `packages/core`
5. **Pas de cache** - Chaque chargement refait un appel GAS (coûts/quota)
6. **GAS_KEY exposée** - Si logs/public, la clé peut être visible

### Recommandations "Quick Win"

1. **Centraliser mapping** - Créer `lib/sheetsMapping.ts` et importer partout
2. **Unifier stores** - Garder uniquement `sheetsStore.ts`, supprimer `clientsStore.ts`
3. **Ajouter validation Zod** - Valider payloads dans `/api/events` avec `packages/core`
4. **Implémenter cache** - Cache Next.js 14 (revalidate) sur routes stats
5. **Option A: Load Once + Refresh** - Stores supportent déjà `loadOnce()` + `refreshClients()`

### Changements Risqués (à planifier)

1. **Migrer Web App vers Sheets** - Remplacer Supabase events par Sheets dans web app
2. **Remplacer Supabase Auth** - Migrer vers NextAuth.js ou autre
3. **Migrer Packs vers Sheets** - Déplacer table `packs` vers feuille Sheets
4. **Supprimer routes _disabled** - Nettoyer `/api/_disabled/` si confirmé obsolète

---

## 📚 Références

- **GAS Code:** `apps/admin/CODE_A_COPIER_COLLER.gs`
- **Env Template:** `ENV_TEMPLATE.md` (à créer)
- **Sheets Contract:** `SHEETS_CONTRACT.md` (à créer)
- **API Inventory:** `AUDIT_INVENTORY.md` (à créer)

---

**Dernière mise à jour:** Audit complet effectué le 2026-01-12
**Version Blueprint:** 1.0
