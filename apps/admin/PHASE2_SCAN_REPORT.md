# 🔍 PHASE 2 - Safety Scan Report

## Call Sites Identifiés

### ✅ Aucun appel GAS direct depuis le client
- Tous les appels passent par des API routes server-side ✅
- Pas d'exposition de `GAS_KEY` ou `GAS_WEBAPP_URL` au client ✅

### API Routes qui appellent GAS/Sheets:

1. **`app/api/events/route.ts`**
   - GET: `readEventsFromSheets()` → `gasRequest("readSheet", { sheetName: "Clients" })`
   - POST: `writeEventToSheets()` → `gasRequest("updateRowByEventId", ...)`
   - PATCH: `writeEventToSheets()` → `gasRequest("updateRowByEventId", ...)`
   - DELETE: `deleteRowFromSheet("Clients", id)` → `gasRequest("deleteRow", ...)`

2. **`app/api/events/recalculate/route.ts`**
   - POST: `readEventsFromSheets()` + `writeEventToSheets()`

3. **`app/api/events/update-finance/route.ts`** ⚠️ À SUPPRIMER
   - PATCH: Écrit dans Supabase (obsolète)

4. **`app/api/stats/monthly/route.ts`**
   - GET: `readMonthlyStatsFromSheets()` → `readSheet("Stats")`
   - POST/PATCH: `writeMonthlyStatsToSheets()` → `updateRowByCompositeKey("Stats", ...)`

5. **`app/api/stats/students/route.ts`**
   - GET: `readStudentStatsFromSheets()` → `readSheet("Students")`
   - POST: `writeStudentStatsToSheets()` → `updateRowByCompositeKey("Students", ...)`

6. **`app/api/stats/commercial/route.ts`**
   - GET: `readCommercialStatsFromSheets()` → `readSheet("Commercial")`
   - POST: `writeCommercialStatsToSheets()` → `updateRowByCompositeKey("Commercial", ...)`

7. **`app/api/stats/google-sheets/route.ts`**
   - GET: `readMonthlyStatsFromSheets()` → `readSheet("Stats")`

8. **`app/api/sync/google-sheets/route.ts`** ⚠️ À SUPPRIMER
   - GET: Lit depuis Supabase, écrit dans Sheets (obsolète si Sheets = source unique)

### Pages Server-Side qui appellent directement:

9. **`app/page.tsx`** (dashboard)
   - `readMonthlyStatsFromSheets()` → `readSheet("Stats")`

10. **`app/commercial/page.tsx`**
    - `readCommercialStatsFromSheets()` → `readSheet("Commercial")`

11. **`app/etudiant/page.tsx`**
    - `readStudentStatsFromSheets()` → `readSheet("Students")`

12. **`app/students/page.tsx`**
    - `readEventsFromSheets()` → `readSheet("Clients")`

13. **`lib/adminData.ts`** (getAdminSnapshot)
    - `readEventsFromSheets()` → `readSheet("Clients")`

### Composants Client qui appellent les API routes:

14. **`components/EventsSheet.tsx`**
    - `/api/events` (PATCH, DELETE)
    - `/api/events/recalculate` (POST)

15. **`components/EventModal.tsx`**
    - `/api/events` (POST, PATCH)
    - `/api/events/recalculate` (POST)

16. **`components/CrmModal.tsx`**
    - `/api/events` (POST, PATCH)

17. **`components/StatsModal.tsx`**
    - `/api/stats/monthly` (PATCH)

18. **`components/StudentModal.tsx`**
    - `/api/stats/students` (POST)

19. **`components/CommercialModal.tsx`**
    - `/api/stats/commercial` (POST)

20. **`components/StudentsView.tsx`**
    - `/api/events/update-finance` (PATCH) ⚠️ Route obsolète

21. **`components/EventAddressEditor.tsx`**
    - `/api/events/recalculate` (POST)

---

## Stratégie de Migration

**Option B (préférée):** Migrer les composants vers `/api/gas` directement et supprimer les routes intermédiaires.

**Exceptions:**
- `/api/events/recalculate` reste (logique métier spécifique: Google Maps API)
- Les routes `/api/stats/*` peuvent devenir des proxies minces vers `/api/gas`
