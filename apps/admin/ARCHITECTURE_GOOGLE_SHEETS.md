# 🏗️ Architecture - Google Sheets comme source unique

## 📊 Sources de données

### ✅ Google Sheets (Source unique pour les données métier)

#### Feuille "Clients"
- **Contenu :** Tous les événements (events)
- **Colonne clé :** "Event ID"
- **Lecture :** `readEventsFromSheets()` dans `lib/googleSheets.ts`
- **Écriture :** `writeEventToSheets()` dans `lib/googleSheets.ts`
- **Utilisé par :**
  - `/events` (liste des événements)
  - `/students` (événements avec étudiants)
  - `/api/events` (CRUD des événements)
  - `getAdminSnapshot()` (snapshot admin)

#### Feuille "Stats"
- **Contenu :** Statistiques mensuelles (revenus, coûts, marges, marketing)
- **Colonne clé :** "month"
- **Lecture :** `readMonthlyStatsFromSheets()` dans `lib/googleSheets.ts`
- **Écriture :** `writeMonthlyStatsToSheets()` dans `lib/googleSheets.ts`
- **Utilisé par :**
  - `/` (dashboard principal)
  - `/api/stats/monthly` (API pour modifier les stats)

#### Feuille "Students"
- **Contenu :** Statistiques mensuelles par étudiant
- **Colonnes clés :** "month" + "student_name"
- **Lecture :** `readStudentStatsFromSheets()` dans `lib/googleSheets.ts`
- **Écriture :** `writeStudentStatsToSheets()` dans `lib/googleSheets.ts`
- **Utilisé par :**
  - `/students` (page étudiants)
  - `/api/stats/students` (API pour modifier les stats étudiant)

#### Feuille "Commercial"
- **Contenu :** Statistiques mensuelles par commercial
- **Colonnes clés :** "month" + "commercial_name"
- **Lecture :** `readCommercialStatsFromSheets()` dans `lib/googleSheets.ts`
- **Écriture :** `writeCommercialStatsToSheets()` dans `lib/googleSheets.ts`
- **Utilisé par :**
  - `/commercial` (page commercial)
  - `/api/stats/commercial` (API pour modifier les stats commercial)

### 🔐 Supabase (Uniquement pour l'authentification et les packs)

#### Table `packs`
- **Contenu :** Définition des packs (prix, impressions, etc.)
- **Lecture :** Via `createSupabaseServerClient()` dans `lib/adminData.ts`
- **Utilisé par :**
  - `getAdminSnapshot()` (pour les packs)
  - Dropdowns dans les modals (EventModal, etc.)

**Note :** Les packs pourraient être migrés vers Google Sheets plus tard, mais pour l'instant ils restent dans Supabase car ils changent rarement.

#### Authentification
- **Utilisé par :**
  - `/login` (page de connexion)
  - `admin-guard.tsx` (protection des routes admin)
  - Variables : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔄 Flux de données

### Lecture des Events
```
Frontend (/events, /students, etc.)
  ↓
getAdminSnapshot() ou readEventsFromSheets()
  ↓
lib/googleSheets.ts
  ↓
GAS (si GAS_WEBAPP_URL configuré) OU Google Sheets API directe
  ↓
Google Sheets (feuille "Clients")
```

### Écriture d'un Event
```
Frontend (EventModal, EventsSheet)
  ↓
/api/events (POST/PATCH)
  ↓
writeEventToSheets()
  ↓
GAS updateRowByEventId (si GAS_WEBAPP_URL configuré)
  ↓
Google Sheets (feuille "Clients")
```

### Lecture des Stats
```
Frontend (/)
  ↓
readMonthlyStatsFromSheets()
  ↓
GAS readSheet (si GAS_WEBAPP_URL configuré)
  ↓
Google Sheets (feuille "Stats")
```

### Écriture des Stats
```
Frontend (StatsModal)
  ↓
/api/stats/monthly (PATCH)
  ↓
writeMonthlyStatsToSheets()
  ↓
GAS updateRowByCompositeKey (si GAS_WEBAPP_URL configuré)
  ↓
Google Sheets (feuille "Stats")
```

---

## 🚫 Ce qui a été supprimé

### Fallbacks Supabase
- ❌ **Plus de fallback** vers Supabase pour les events
- ❌ **Plus de fallback** vers Supabase pour les stats
- ✅ **Google Sheets est la source unique** - si ça échoue, on affiche une erreur

### Anciennes routes
- ❌ `/api/events/update-finance` (remplacé par `/api/events` PATCH)
- ❌ `/api/sync/google-sheets` (plus nécessaire - Google Sheets est la source)

---

## 🔧 Configuration requise

Voir `VERCEL_ENV_VARIABLES.md` pour la liste complète des variables d'environnement.

**Minimum requis :**
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GAS_WEBAPP_URL` (recommandé)
- `GAS_KEY` (recommandé)
- `GOOGLE_MAPS_API_KEY` (pour `/api/events/recalculate`)
- Variables Supabase (pour login et packs)

---

## 📝 Notes importantes

1. **Feuille "Clients" vs "Events" :** 
   - L'application lit/écrit dans la feuille **"Clients"** (pas "Events")
   - Le nom "Events" dans le code est un legacy - tout est dans "Clients"

2. **Mapping des colonnes :**
   - Les colonnes Google Sheets sont mappées par **nom** (pas par position)
   - Voir `mapEventRowToClientsValues()` dans `lib/googleSheets.ts`

3. **GAS vs API directe :**
   - Si `GAS_WEBAPP_URL` est configuré, on utilise GAS (plus simple, plus rapide)
   - Sinon, on utilise l'API Google Sheets directement (OAuth 2.0 ou Service Account)

4. **Format des données :**
   - Les montants sont stockés en **centimes** dans le code TypeScript
   - Ils sont convertis en **euros avec virgule** (format européen) dans Google Sheets
   - Exemple : `1400` centimes → `"14,00"` euros dans Sheets
