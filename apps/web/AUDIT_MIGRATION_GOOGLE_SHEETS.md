# 📊 AUDIT MIGRATION GOOGLE SHEETS - Application Web

**Date:** 2026-01-12  
**Objectif:** Migrer l'application `apps/web` de Supabase vers Google Sheets

---

## 🔍 RÉSUMÉ EXÉCUTIF

L'application `apps/web` utilise actuellement **Supabase** pour toutes ses opérations de base de données. Cette migration permettra d'aligner l'application avec `apps/admin` qui utilise déjà Google Sheets, garantissant une source de vérité unique.

### Tables Supabase Utilisées

| Table | Usage | Opérations |
|-------|-------|------------|
| `events` | CRUD complet | CREATE, READ, UPDATE |
| `payments` | CRUD complet | CREATE, READ, UPDATE |
| `inventory_items` | Lecture uniquement | READ |
| `event_resources` | Lecture/Écriture | CREATE, READ |
| `notification_queue` | Écriture/Suppression | CREATE, DELETE |
| `message_templates` | Lecture uniquement | READ |

---

## 📁 INVENTAIRE DÉTAILLÉ

### 1. Routes API Utilisant Supabase

#### `/api/public/availability` (GET)
**Fichier:** `app/api/public/availability/route.ts`

**Opérations Supabase:**
- ✅ READ `inventory_items` (ligne 21-25) - Compter miroirs disponibles
- ✅ READ `event_resources` + JOIN `events` (ligne 31-37) - Compter miroirs réservés

**Données manipulées:**
- Date de l'event
- Nombre total de miroirs
- Nombre de miroirs réservés
- Calcul: `remaining = total - reserved`

**Action Migration:**
- ➡️ **Option A:** Créer une feuille "Inventory" avec colonnes `item_id`, `type`, `status`
- ➡️ **Option B:** Calculer depuis feuille "Clients" (compter events avec même `Date Event` et status actif)
- ➡️ **Option C:** Hardcoder le nombre de miroirs disponibles (solution MVP)

**⚠️ RECOMMANDATION:** Option B pour MVP (calcul depuis "Clients"), puis Option A pour production.

---

#### `/api/public/checkout` (POST)
**Fichier:** `app/api/public/checkout/route.ts`

**Opérations Supabase:**
- ✅ CREATE/UPDATE `events` (ligne 50-95)
- ✅ DELETE `notification_queue` (ligne 97-102)
- ✅ CREATE `payments` (ligne 144-151)

- **Données manipulées:**
- Event complet (comme `/api/public/leads` via `persistLeadToLeads`)
- Payment Mollie (acompte 180€)
- Suppression des notifications promo en attente

**Action Migration:**
- ➡️ CREATE/UPDATE event dans feuille "Clients" (via `updateRowInSheet()`)
- ➡️ Créer une feuille "Payments" avec colonnes: `payment_id`, `event_id`, `provider`, `amount_cents`, `status`, `paid_at`
- ➡️ Gérer `notification_queue` dans une nouvelle feuille "Notifications" OU directement dans feuille "Clients" (colonne dédiée)

---

#### `/api/public/booking-status` (GET)
**Fichier:** `app/api/public/booking-status/route.ts`

**Opérations Supabase:**
- ✅ READ `events` (ligne 20-24)
- ✅ READ `payments` (ligne 30-34)

**Données retournées:**
```typescript
{
  event_id: string,
  client_name: string,
  event_date: string,
  total_cents: number,
  status: string,
  deposit_paid: boolean,
  payment_status: string
}
```

**Action Migration:**
- ➡️ READ event depuis feuille "Clients" (via `readSheet()` + filtre par `Event ID`)
- ➡️ READ payment depuis feuille "Payments" (via `readSheet()` + filtre par `event_id`)
- ➡️ Calculer `deposit_paid` (vérifier payment avec `amount_cents === 18000` et `status === "paid"`)

---

#### `/api/webhooks/mollie` (POST)
**Fichier:** `app/api/webhooks/mollie/route.ts`

**Opérations Supabase:**
- ✅ READ `payments` (ligne 25-30) - Vérifier idempotence
- ✅ UPDATE `payments` (ligne 44, 117-122)
- ✅ CREATE `payments` (ligne 124-131)
- ✅ READ `events` (ligne 61-65)
- ✅ READ `event_resources` (ligne 69-74)
- ✅ READ `inventory_items` (ligne 80-84)
- ✅ READ `event_resources` + JOIN `events` (ligne 88-94)
- ✅ CREATE `event_resources` (ligne 107-112)
- ✅ CREATE `notification_queue` (ligne 135-138)

**Données manipulées:**
- Payment Mollie (webhook)
- Event (mise à jour date/reservations)
- Resource (assignation miroir)
- Notifications (emails de confirmation)

**Action Migration:**
- ➡️ Lire/mettre à jour payment dans feuille "Payments"
- ➡️ Lire/mettre à jour event dans feuille "Clients"
- ➡️ Gérer `event_resources` dans feuille "Clients" (colonnes `Miroir Assigné`, `Date Réservation`)
- ➡️ Créer notifications dans feuille "Notifications" OU colonne dédiée dans "Clients"

**⚠️ COMPLEXITÉ:** Route la plus complexe - nécessite plusieurs feuilles synchronisées.

---

#### `/api/public/promo-intent` (POST)
**Fichier:** `app/api/public/promo-intent/route.ts`

**Opérations Supabase:**
- ✅ CREATE `notification_queue` (ligne 23-30)

**Données manipulées:**
```typescript
{
  email: string,
  locale: 'fr' | 'nl',
  payload?: Record<string, string>,
  template_key: 'B2C_PROMO_48H',
  send_after: ISO date (+48h)
}
```

**Action Migration:**
- ➡️ Créer feuille "Notifications" avec colonnes: `notification_id`, `template_key`, `to_email`, `locale`, `payload`, `send_after`, `status`
- ➡️ Utiliser `appendRowToSheet()` sur feuille "Notifications"

---

#### `/api/debug/health` (GET)
**Fichier:** `app/api/debug/health/route.ts`

**Opérations Supabase:**
- ✅ READ `inventory_items` (ligne 6-9) - Compter miroirs

**Action Migration:**
- ➡️ Même solution que `/api/public/availability` (Option B ou C)

---

### 2. Fichiers Utilitaires

#### `lib/notifications/renderTemplate.ts`
**Fichier:** `lib/notifications/renderTemplate.ts`

**Opérations Supabase:**
- ✅ READ `message_templates` (ligne 25-30, 39-44)

**Données manipulées:**
- Templates d'emails (subject + html)
- Locale: `fr` ou `nl`

**Action Migration:**
- ➡️ **Option A:** Créer feuille "Templates" avec colonnes: `key`, `locale`, `subject`, `html`
- ➡️ **Option B:** Garder en dur dans le code (si peu de templates)
- ➡️ **Option C:** Fichier JSON/TypeScript (recommandé pour templates)

**⚠️ RECOMMANDATION:** Option C (fichier TypeScript) pour les templates - plus simple et performant.

---

## 🗂️ STRUCTURE GOOGLE SHEETS REQUISE

### Feuille "Clients" (Existant - SHEETS_CONTRACT.md)
✅ **Déjà définie** dans `SHEETS_CONTRACT.md`

**Colonnes utilisées par Web App:**
- `Event ID` (clé primaire)
- `Date Event`
- `Type Event`
- `Language`
- `Nom`
- `Email`
- `Phone`
- `Lieu Event`
- `Pack`
- `Total`
- `Transport (€)`
- `Acompte`
- `Solde Restant`

**Colonnes à ajouter (si absentes):**
- `Status` (ex: `active`, `cancelled`)
- `Miroir Assigné` (ID du miroir assigné)
- `Date Réservation` (date de réservation du miroir)

---

### Feuille "Payments" (NOUVELLE)
**Usage:** Tous les paiements (Mollie, autres providers)

**Headers Requis:**
```
Payment ID | Event ID | Provider | Provider Payment ID | Amount Cents | Status | Paid At | Created At
```

**Exemples:**
- `Payment ID`: `payment-1234567890-abc` (UUID ou custom)
- `Provider`: `mollie`
- `Provider Payment ID`: `tr_ABC123DEF456` (ID Mollie)
- `Amount Cents`: `18000` (format nombre)
- `Status`: `open`, `paid`, `cancelled`, `expired`
- `Paid At`: `2025-01-15T10:30:00Z` (format ISO)

**Mapping:**
```typescript
interface PaymentRow {
  "Payment ID": string;
  "Event ID": string;
  "Provider": "mollie" | string;
  "Provider Payment ID": string;
  "Amount Cents": number;
  "Status": "open" | "paid" | "cancelled" | "expired";
  "Paid At": string | null;
  "Created At": string;
}
```

---

### Feuille "Notifications" (NOUVELLE)
**Usage:** Queue d'emails à envoyer

**Headers Requis:**
```
Notification ID | Template Key | To Email | Locale | Payload | Send After | Status | Sent At
```

**Exemples:**
- `Notification ID`: `notif-1234567890-abc` (UUID ou custom)
- `Template Key`: `B2C_PROMO_48H`, `B2C_BOOKING_CONFIRMED`, `B2C_EVENT_RECAP`
- `To Email`: `john@example.com`
- `Locale`: `fr` ou `nl`
- `Payload`: `{"client_name":"John","event_date":"2025-01-15"}` (JSON string)
- `Send After`: `2025-01-17T10:30:00Z` (format ISO)
- `Status`: `queued`, `sent`, `failed`

**Mapping:**
```typescript
interface NotificationRow {
  "Notification ID": string;
  "Template Key": string;
  "To Email": string;
  "Locale": "fr" | "nl";
  "Payload": string; // JSON string
  "Send After": string; // ISO date
  "Status": "queued" | "sent" | "failed";
  "Sent At": string | null;
  "Event ID": string | null; // Optionnel, pour lien avec event
}
```

---

### Feuille "Inventory" (NOUVELLE - Optionnel)
**Usage:** Stock de miroirs et autres équipements

**Headers Requis:**
```
Item ID | Type | Status | Created At
```

**Exemples:**
- `Item ID`: `mirror-001`, `mirror-002`
- `Type`: `mirror`
- `Status`: `active`, `out_of_service`

**⚠️ NOTE:** Pour MVP, cette feuille peut être optionnelle si on hardcode le nombre de miroirs ou calcule depuis "Clients".

---

## 📋 PLAN DE MIGRATION

### Phase 1: Préparation (Jour 1)

#### 1.1 Créer les Feuilles Manquantes
- [ ] Créer feuille "Payments" dans Google Sheets
- [ ] Créer feuille "Notifications" dans Google Sheets
- [ ] Créer feuille "Inventory" (optionnel, si pas hardcodé)
- [ ] Vérifier colonnes manquantes dans feuille "Clients" (`Status`, `Miroir Assigné`, `Date Réservation`)

#### 1.2 Créer les Fonctions Google Sheets
- [ ] Créer `lib/googleSheets.ts` dans `apps/web` (copier depuis `apps/admin/lib/googleSheets.ts`)
- [ ] Adapter les fonctions pour les nouvelles feuilles :
  - `readPayments()` - Lire tous les payments
  - `createPayment()` - Créer un payment
  - `updatePayment()` - Mettre à jour un payment
  - `readNotifications()` - Lire notifications
  - `createNotification()` - Créer notification
  - `deleteNotification()` - Supprimer notification

#### 1.3 Créer les Types TypeScript
- [ ] Créer `lib/webData.ts` avec types:
  - `PaymentRow` (mapping feuille "Payments")
  - `NotificationRow` (mapping feuille "Notifications")
  - `EventRow` (réutiliser depuis admin ou redéfinir)

---

### Phase 2: Migration Routes Simples (Jour 2-3)

#### 2.1 `/api/public/promo-intent`
- [ ] Remplacer `supabase.from("notification_queue").insert()` par `createNotification()`
- [ ] Tester création notification

#### 2.2 `/api/public/booking-status`
- [ ] Remplacer lecture `events` par `readSheet("Clients")` + filtre
- [ ] Remplacer lecture `payments` par `readPayments()` + filtre
- [ ] Tester lecture booking status

#### 2.3 `/api/debug/health`
- [ ] Implémenter Option B (calcul depuis "Clients") ou Option C (hardcodé)
- [ ] Tester health check

---

### Phase 3: Migration Routes Complexes (Jour 4-5)

#### 3.2 `/api/public/checkout`
- [ ] Remplacer CREATE/UPDATE event (même logique que `/api/public/leads` via `persistLeadToLeads`)
- [ ] Remplacer DELETE notification par `deleteNotification()` (si implémenté)
- [ ] Remplacer CREATE payment par `createPayment()`
- [ ] Tester checkout complet (event + payment)

---

### Phase 4: Migration Routes Critiques (Jour 6-7)

#### 4.1 `/api/public/availability`
- [ ] Implémenter Option B (calcul depuis "Clients") :
  - Compter events avec même `Date Event`
  - Filtrer par `Status !== "cancelled"`
  - Filtrer par `Miroir Assigné` non vide (ou autre logique)
- [ ] OU implémenter Option C (hardcodé) :
  - Retourner nombre fixe de miroirs disponibles
- [ ] Tester availability check

#### 4.2 `/api/webhooks/mollie` (CRITIQUE)
- [ ] Remplacer READ `payments` par `readPayments()` + filtre
- [ ] Remplacer UPDATE `payments` par `updatePayment()`
- [ ] Remplacer CREATE `payments` par `createPayment()`
- [ ] Remplacer READ `events` par `readSheet("Clients")` + filtre
- [ ] Remplacer READ `event_resources` par calcul depuis "Clients" (colonne `Miroir Assigné`)
- [ ] Remplacer READ `inventory_items` par Option B/C (comme availability)
- [ ] Remplacer CREATE `event_resources` par UPDATE event (colonne `Miroir Assigné`)
- [ ] Remplacer CREATE `notification_queue` par `createNotification()`
- [ ] Tester webhook Mollie complet (paiement → event → notification)

---

### Phase 5: Migration Utilitaires (Jour 8)

#### 5.1 `lib/notifications/renderTemplate.ts`
- [ ] **Option A:** Créer feuille "Templates" + fonction `readTemplate()`
- [ ] **Option B:** Garder en dur (si peu de templates)
- [ ] **Option C:** Migrer vers fichier TypeScript (recommandé)
- [ ] Tester rendu template

---

### Phase 6: Tests & Cleanup (Jour 9-10)

#### 6.1 Tests E2E
- [ ] Tester flow complet: availability → leads → checkout → webhook → booking-status
- [ ] Tester promo-intent → notification
- [ ] Tester health check

#### 6.2 Nettoyage
- [ ] Supprimer `lib/supabaseServer.ts` (si plus utilisé)
- [ ] Supprimer dépendance `@supabase/supabase-js` dans `package.json`
- [ ] Supprimer variables d'environnement Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Mettre à jour `turbo.json` (retirer variables Supabase)

#### 6.3 Documentation
- [ ] Mettre à jour `SHEETS_CONTRACT.md` (ajouter feuilles "Payments", "Notifications")
- [ ] Mettre à jour `ENV_TEMPLATE.md` (retirer Supabase, garder Google Sheets)
- [ ] Créer guide migration si nécessaire

---

## ⚠️ RISQUES & CONSIDÉRATIONS

### Performance
- **Google Sheets API:** Limites de rate (100 requêtes/seconde pour OAuth, 300 pour Service Account)
- **Solution:** Utiliser Google Apps Script (GAS) comme proxy (déjà configuré dans admin)
- **Impact:** Latence légèrement supérieure à Supabase (acceptable pour MVP)

### Transactions
- **Problème:** Google Sheets ne supporte pas les transactions multi-feuilles atomiques
- **Impact:** Risque d'incohérence si une opération échoue (ex: payment créé mais event non créé)
- **Solution:** Implémenter rollback manuel OU accepter l'incohérence temporaire (corrigée par webhooks/idempotence)

### Concurrent Access
- **Problème:** Plusieurs users peuvent modifier en même temps
- **Impact:** Risque de perte de données (last write wins)
- **Solution:** Utiliser versioning/locks dans GAS OU accepter le risque pour MVP

### Idempotence
- **Critique pour webhooks:** `/api/webhooks/mollie` doit être idempotent
- **Solution:** Vérifier `Payment ID` + `Status === "paid"` avant traitement
- **Implémentation:** Utiliser colonne `Payment ID` dans feuille "Payments" comme clé unique

---

## 📚 RESSOURCES

### Fichiers de Référence
- `apps/admin/lib/googleSheets.ts` - Implémentation Google Sheets (admin)
- `SHEETS_CONTRACT.md` - Contrat des feuilles Google Sheets
- `ENV_TEMPLATE.md` - Variables d'environnement requises

### Documentation Google Sheets API
- [Google Sheets API v4](https://developers.google.com/sheets/api)
- [Google Apps Script](https://developers.google.com/apps-script)

---

## ✅ CHECKLIST FINALE

### Avant Migration
- [ ] Backup complet de Supabase (export données)
- [ ] Backup Google Sheets actuel
- [ ] Tester accès Google Sheets depuis `apps/web`
- [ ] Vérifier configuration GAS (si utilisé)

### Après Migration
- [ ] Tous les tests E2E passent
- [ ] Monitoring en place (logs, erreurs)
- [ ] Documentation à jour
- [ ] Variables d'environnement nettoyées
- [ ] Code obsolète supprimé

---

**Dernière mise à jour:** 2026-01-12  
**Version:** 1.0
