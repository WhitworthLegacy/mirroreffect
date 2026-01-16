# ✅ Vérification des feuilles Google Sheets utilisées

## Confirmation des sources de données

### 1. **Events** → Feuille "Clients" ✅

**Fonction :** `readEventsFromSheets()` dans `lib/googleSheets.ts`
- **Ligne 1062** : `const rows = await readSheet("Clients");`
- **Utilisée par :**
  - `/app/events/page.tsx` → via `getAdminSnapshot()`
  - `/app/students/page.tsx` → directement
  - `/app/api/events/route.ts` → GET, PATCH, DELETE
  - `/app/api/events/recalculate/route.ts` → pour recalculer

**Logs ajoutés :**
```typescript
console.log("[Google Sheets] Reading events from sheet: 'Clients'");
console.log(`[Google Sheets] Found ${rows.length - 1} rows in sheet 'Clients'`);
```

**Indication visuelle :** Page `/events` affiche : "📊 Données lues depuis Google Sheets (feuille "Clients")"

### 2. **Dashboard Stats** → Feuille "Stats" ✅

**Fonction :** `readMonthlyStatsFromSheets()` dans `lib/googleSheets.ts`
- **Ligne 650** : `const rows = await readSheet("Stats");`
- **Utilisée par :**
  - `/app/page.tsx` (Dashboard) → ligne 63
  - `/app/api/stats/google-sheets/route.ts` → GET

**Logs ajoutés :**
```typescript
console.log("[Google Sheets] Reading monthly stats from sheet: 'Stats'");
console.log(`[Google Sheets] Found ${rows.length - 1} rows in sheet 'Stats'`);
```

**Indication visuelle :** Dashboard affiche : "📊 Données lues depuis Google Sheets (feuille "Stats")"

### 3. **Students Stats** → Feuille "Students" ✅

**Fonction :** `readStudentStatsFromSheets()` dans `lib/googleSheets.ts`
- **Ligne 693** : `const rows = await readSheet("Students");`
- **Utilisée par :**
  - `/app/etudiant/page.tsx` → ligne 11

### 4. **Commercial Stats** → Feuille "Commercial" ✅

**Fonction :** `readCommercialStatsFromSheets()` dans `lib/googleSheets.ts`
- **Ligne 698** : `const rows = await readSheet("Commercial");`
- **Utilisée par :**
  - `/app/commercial/page.tsx` → ligne 11

## Comment vérifier dans les logs

Quand vous chargez une page, vous verrez dans les logs serveur (Vercel ou local) :

```
[Google Sheets] Reading events from sheet: 'Clients'
[Google Sheets] Found X rows in sheet 'Clients' (excluding header)
[getAdminSnapshot] Loading events from Google Sheets (sheet: 'Clients')
[getAdminSnapshot] Loaded X events from Google Sheets
```

Pour le dashboard :
```
[Dashboard] Loading stats from Google Sheets (sheet: 'Stats')
[Google Sheets] Reading monthly stats from sheet: 'Stats'
[Google Sheets] Found X rows in sheet 'Stats' (excluding header)
[Dashboard] Loaded X stats from Google Sheets
```

## Résumé

| Page/Route | Feuille Google Sheets | Fonction |
|------------|----------------------|----------|
| `/events` | **Clients** | `readEventsFromSheets()` |
| `/dashboard` | **Stats** | `readMonthlyStatsFromSheets()` |
| `/etudiant` | **Students** | `readStudentStatsFromSheets()` |
| `/commercial` | **Commercial** | `readCommercialStatsFromSheets()` |

✅ **Tout est bien connecté !**
