# 🔍 PHASE 1 - Audit Complet du Monorepo

**Date:** 2026-01-12  
**Scope:** Audit read-only de `apps/web` et `apps/admin`  
**Objectif:** Identifier les problèmes de fiabilité des données et préparer le nettoyage

---

## 📊 A. Structure du Monorepo

### Apps identifiées:
- **`apps/admin`** - Application Next.js pour l'administration (App Router)
- **`apps/web`** - Application Next.js publique (App Router)

### Packages partagés:
- **`packages/core`** - Logique métier partagée (admin, availability, booking, crmB2b, events, payments, stock, webhooks)
- **`packages/ui`** - Composants UI partagés (vide actuellement)

### Source de données principale:
- **Google Sheets** - Feuille **"Clients"** (exact casing) = source unique pour les events
- **Google Sheets** - Feuilles secondaires: "Stats", "Students", "Commercial" (pour statistiques)
- **Supabase** - Utilisé uniquement pour:
  - Authentification admin (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - Packs (temporaire, peut être migré vers Sheets)

---

## 🚨 B. Audit Summary - 10 Points Critiques

### 1. **Route API obsolète utilise encore Supabase pour events**
**Fichier:** `apps/admin/app/api/events/update-finance/route.ts`  
**Problème:** Cette route écrit directement dans Supabase au lieu de Google Sheets  
**Impact:** Données désynchronisées, modifications perdues  
**Action:** Supprimer ou migrer vers Google Sheets

### 2. **Route de sync Supabase → Sheets (potentiellement inutile)**
**Fichier:** `apps/admin/app/api/sync/google-sheets/route.ts`  
**Problème:** Lit depuis Supabase et écrit dans Sheets - si Sheets est la source unique, cette route est obsolète  
**Impact:** Confusion sur la source de vérité  
**Action:** Supprimer si Supabase n'est plus utilisé pour events

### 3. **Fichier backup non supprimé**
**Fichier:** `apps/admin/components/EventModal.tsx.backup`  
**Problème:** Fichier backup laissé dans le repo  
**Impact:** Pollution du codebase  
**Action:** Supprimer

### 4. **Documentation dupliquée/obsolète**
**Fichiers:**
- `apps/admin/RESUME_CONFIGURATION.md`
- `apps/admin/ARCHITECTURE_GOOGLE_SHEETS.md`
- `apps/admin/RECAP_INTEGRATION.md`
- `apps/admin/VERIFICATION_SHEETS.md`
- `apps/admin/GAS_DEPLOYMENT_FIX.md`
- `apps/admin/VERCEL_ENV_VARIABLES.md`
- `apps/admin/CODE_A_COPIER_COLLER.gs`
- `apps/admin/App.gs_CORRECTED.txt`

**Problème:** 8 fichiers de documentation avec chevauchements  
**Impact:** Confusion, maintenance difficile  
**Action:** Consolider en 1-2 fichiers essentiels

### 5. **Gestion des redirects GAS déjà implémentée mais pas centralisée**
**Fichier:** `apps/admin/lib/gas.ts`  
**Statut:** ✅ Déjà robuste (redirect: manual, détection HTML, cache: no-store)  
**Problème:** Mais `lib/googleSheets.ts` utilise `gasRequest()` qui appelle `gasPostAdmin()` - pas de gateway API unique  
**Impact:** Pas de point d'entrée unique pour le frontend  
**Action:** Créer `/api/gas` comme gateway unique

### 6. **Pas de gateway API centralisé pour GAS**
**Problème:** Les composants appellent directement `/api/events`, `/api/stats/*` qui appellent `gasRequest()`  
**Impact:** Pas de contrôle centralisé, pas de logging uniforme, pas de retry logic  
**Action:** Créer `/api/gas` qui accepte `{ action, data }` et injecte `key` server-side

### 7. **Variables d'environnement - Confirmation**
**✅ SÉCURISÉ:**
- `GAS_WEBAPP_URL` - Server-side uniquement ✅
- `GAS_KEY` - Server-side uniquement ✅
- `GOOGLE_SHEETS_SPREADSHEET_ID` - Server-side uniquement ✅

**⚠️ À VÉRIFIER:**
- `NEXT_PUBLIC_SUPABASE_URL` - Exposé au client (nécessaire pour auth) ✅ OK
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Exposé au client (nécessaire pour auth) ✅ OK

### 8. **Apps/web - Audit (READ ONLY)**
**✅ FONCTIONNE:**
- LeadModal utilise `/api/public/leads` (proxy server-side) ✅
- Pas d'appels directs GAS depuis le client ✅
- Variables d'env sécurisées (pas de secrets exposés) ✅

**⚠️ À AMÉLIORER PLUS TARD:**
- Beaucoup de routes dans `app/api/_disabled/` (à nettoyer plus tard)
- Pas de validation centralisée des env vars
- Pas de logging structuré

### 9. **Mapping colonnes Sheets → TypeScript fragile**
**Fichier:** `apps/admin/lib/googleSheets.ts` (lignes 465-535, 833-1109)  
**Problème:** Mapping hardcodé des noms de colonnes ("Event ID", "Date Event", etc.)  
**Impact:** Si les colonnes changent dans Sheets, le code casse  
**Action:** Documenter le contrat de colonnes, ajouter validation

### 10. **Pas de gestion d'erreur structurée pour HTML/redirects**
**Fichier:** `apps/admin/lib/gas.ts`  
**Statut:** ✅ Détection HTML implémentée avec logs  
**Problème:** Mais pas de requestId pour tracer les erreurs, pas de retry automatique  
**Impact:** Debug difficile en production  
**Action:** Ajouter requestId, logging structuré, retry logic optionnel

---

## 🧹 C. Cleanup Plan

### Fichiers à SUPPRIMER (sûrs):

1. **`apps/admin/components/EventModal.tsx.backup`**
   - Fichier backup, non utilisé

2. **`apps/admin/app/api/events/update-finance/route.ts`**
   - Écrit dans Supabase au lieu de Sheets
   - Remplacé par PATCH `/api/events` qui utilise Sheets

3. **`apps/admin/app/api/sync/google-sheets/route.ts`**
   - Sync Supabase → Sheets obsolète si Sheets est la source unique
   - **CONFIRMER AVANT SUPPRESSION:** Est-ce que Supabase est encore utilisé pour events?

### Fichiers à CONSOLIDER (documentation):

4. **Documentation à fusionner:**
   - Garder: `VERCEL_ENV_VARIABLES.md` (référence des env vars)
   - Garder: `RESUME_CONFIGURATION.md` (résumé de config)
   - **Supprimer:**
     - `ARCHITECTURE_GOOGLE_SHEETS.md` (info dans RESUME_CONFIGURATION)
     - `RECAP_INTEGRATION.md` (dupliqué)
     - `VERIFICATION_SHEETS.md` (info dans RESUME_CONFIGURATION)
     - `GAS_DEPLOYMENT_FIX.md` (info dans RESUME_CONFIGURATION)
     - `App.gs_CORRECTED.txt` (dupliqué de CODE_A_COPIER_COLLER.gs)

5. **Fichiers GAS:**
   - Garder: `CODE_A_COPIER_COLLER.gs` (source de vérité)
   - Supprimer: `App.gs_CORRECTED.txt` (dupliqué)

### Fichiers à CRÉER/MODIFIER (Phase 2):

6. **Créer:** `apps/admin/app/api/gas/route.ts`
   - Gateway unique pour tous les appels GAS
   - Accepte `{ action, data }`
   - Injecte `key: GAS_KEY` server-side
   - Retourne JSON GAS

7. **Modifier:** Tous les composants admin
   - Remplacer appels `/api/events`, `/api/stats/*` par `/api/gas` avec `action` appropriée
   - OU garder les routes existantes mais les faire appeler `/api/gas` en interne

8. **Améliorer:** `apps/admin/lib/gas.ts`
   - Ajouter requestId pour traçabilité
   - Ajouter retry logic optionnel
   - Améliorer logging structuré

---

## 🏗️ D. Target Architecture (Proposition)

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN UI (Client Components)               │
│  EventsSheet, EventModal, StatsModal, StudentModal, etc.     │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           │ fetch('/api/gas', { action, data })
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway: /api/gas (route.ts)               │
│  - Valide action + data                                      │
│  - Injecte key: GAS_KEY (server-side)                        │
│  - Appelle gasPostAdmin(action, data)                        │
│  - Retourne JSON GAS                                         │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           │ gasPostAdmin(action, data)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              lib/gas.ts (gasPostAdmin)                       │
│  - Valide env vars (GAS_WEBAPP_URL, GAS_KEY)                │
│  - POST avec redirect: "manual", cache: "no-store"          │
│  - Gère 302/303 (re-POST vers Location)                     │
│  - Détecte HTML (commence par "<")                           │
│  - Parse JSON et retourne                                    │
│  - Logging structuré (requestId, status, preview)           │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           │ POST GAS_WEBAPP_URL
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           Google Apps Script WebApp                          │
│  - doPost({ action, key, data })                             │
│  - Actions: readSheet, appendRow, updateRow,                 │
│             updateRowByEventId, updateRowByCompositeKey,     │
│             deleteRow                                         │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           │ SpreadsheetApp API
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           Google Sheets - Feuille "Clients"                  │
│  (Source unique pour events)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Flux de données:

1. **READ (List):**
   - UI → `/api/gas` { action: "readSheet", data: { sheetName: "Clients" } }
   - → GAS retourne { values: [[headers], [row1], [row2], ...] }
   - → Mapping vers EventRow[] dans `lib/googleSheets.ts`
   - → Retour à UI

2. **READ (Single):**
   - UI → `/api/gas` { action: "readSheet", data: { sheetName: "Clients" } }
   - → Filtre côté client par Event ID

3. **UPDATE:**
   - UI → `/api/gas` { action: "updateRowByEventId", data: { eventId, values: {...} } }
   - → GAS met à jour la ligne dans Sheets
   - → Retour success

4. **CREATE:**
   - UI → `/api/gas` { action: "appendRow", data: { sheetName: "Clients", values: [...] } }
   - → GAS ajoute la ligne dans Sheets
   - → Retour success

5. **DELETE:**
   - UI → `/api/gas` { action: "deleteRow", data: { sheetName: "Clients", id } }
   - → GAS supprime la ligne dans Sheets
   - → Retour success

---

## 📋 E. Data Contract Proposal

### Request Format (Admin → GAS via /api/gas):

```typescript
POST /api/gas
Content-Type: application/json

{
  "action": "readSheet" | "appendRow" | "updateRow" | "updateRowByEventId" | "updateRowByCompositeKey" | "deleteRow",
  "data": {
    // Pour readSheet
    sheetName?: "Clients" | "Stats" | "Students" | "Commercial",
    
    // Pour appendRow
    values?: unknown[],
    
    // Pour updateRow
    id?: string,
    
    // Pour updateRowByEventId
    eventId?: string,
    values?: Record<string, unknown>, // Mapping colonne → valeur
    
    // Pour updateRowByCompositeKey
    key1?: string,
    key1Value?: string,
    key2?: string,
    key2Value?: string,
    
    // Pour deleteRow
    id?: string
  }
}
```

### Response Format (GAS → Admin):

```typescript
// Success
{
  "data": {
    // Pour readSheet
    "values": [[headers], [row1], [row2], ...],
    
    // Pour autres actions
    "success": true
  }
}

// Error
{
  "error": "Invalid key" | "Sheet not found" | "Row not found" | "Unknown action" | ...
}
```

### Error Schema (Server-side):

```typescript
{
  "requestId": "uuid-v4",
  "timestamp": "ISO-8601",
  "action": "readSheet",
  "status": 200 | 302 | 303 | 400 | 500,
  "contentType": "application/json" | "text/html",
  "error": {
    "type": "HTML_RESPONSE" | "REDIRECT_FAILED" | "JSON_PARSE_ERROR" | "GAS_ERROR",
    "message": "Human-readable error",
    "preview": "First 500 chars of response if HTML",
    "location": "Redirect URL if 302/303"
  }
}
```

### Logging Schema:

```typescript
// Console log format
[GAS] {requestId} {action} → {status} ({duration}ms)
[GAS] {requestId} HTML detected: {preview}
[GAS] {requestId} Redirect: {status} → {location}
```

---

## ✅ F. Checklist Avant Phase 2

- [ ] Confirmer que Supabase n'est plus utilisé pour events (vérifier `/api/sync/google-sheets`)
- [ ] Confirmer le nom exact de la feuille Sheets: "Clients" (avec majuscule)
- [ ] Valider que toutes les colonnes attendues existent dans Sheets
- [ ] Confirmer les actions GAS nécessaires (actuellement 6 actions)
- [ ] Approuver le plan de suppression des fichiers
- [ ] Approuver l'architecture cible (gateway `/api/gas`)

---

## 🎯 Prochaines Étapes (Phase 2)

Une fois l'approbation reçue:

1. **Supprimer les fichiers obsolètes** (backup, routes Supabase)
2. **Consolider la documentation** (fusionner les MD)
3. **Créer `/api/gas` gateway** (point d'entrée unique)
4. **Migrer les composants** vers `/api/gas` (ou garder routes existantes mais proxy vers `/api/gas`)
5. **Améliorer `lib/gas.ts`** (requestId, retry, logging)
6. **Tester la fiabilité** (redirects, HTML, erreurs)
7. **Documenter le contrat** (colonnes Sheets, actions GAS)

---

**FIN DU RAPPORT PHASE 1**
