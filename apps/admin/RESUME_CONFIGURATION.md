# 📋 Résumé de la configuration - Admin

## ✅ Ce qui a été fait

### 1. Suppression des fallbacks Supabase
- ❌ **Plus de fallback** vers Supabase pour les events
- ❌ **Plus de fallback** vers Supabase pour les stats
- ✅ **Google Sheets est maintenant la source unique** pour :
  - Events (feuille "Clients")
  - Stats (feuille "Stats")
  - Students (feuille "Students")
  - Commercial (feuille "Commercial")

### 2. Architecture claire
- ✅ **Google Sheets** = Source unique pour toutes les données métier
- ✅ **Supabase** = Uniquement pour l'authentification et les packs (temporaire)

### 3. Documentation créée
- ✅ `VERCEL_ENV_VARIABLES.md` - Liste complète des variables d'environnement
- ✅ `ARCHITECTURE_GOOGLE_SHEETS.md` - Architecture détaillée
- ✅ `CODE_A_COPIER_COLLER.gs` - Code GAS complet

---

## 🔑 Variables Vercel à configurer

### OBLIGATOIRE

```bash
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=12X9G62lKRzJSYHZfGQ6jCTMwgOCfdMtkTD6A-GbuwqQ

# Google Apps Script (RECOMMANDÉ)
GAS_WEBAPP_URL=https://script.google.com/macros/s/AKfycbxRn8rubKlfUp6NUHBxoFOTiIcMtFmYqyXZBp3ohUBQ55oZLFqL23COAhAm2VQC0Lv8/exec
GAS_KEY=p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7

# Google Maps (pour /api/events/recalculate)
GOOGLE_MAPS_API_KEY=votre_google_maps_api_key

# Supabase (pour login et packs)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

---

## 📊 Comment l'admin lit Google Sheets

### Events (feuille "Clients")
1. **Frontend** appelle `getAdminSnapshot()` ou `readEventsFromSheets()`
2. **Backend** (`lib/googleSheets.ts`) :
   - Si `GAS_WEBAPP_URL` est configuré → Appelle GAS `readSheet` avec `sheetName: "Clients"`
   - Sinon → Utilise Google Sheets API directe
3. **GAS** (si configuré) lit la feuille "Clients" et retourne toutes les lignes
4. **Mapping** : Les colonnes Google Sheets sont mappées vers `EventRow` TypeScript
5. **Retour** : Tableau d'events au format TypeScript

### Stats (feuille "Stats")
1. **Frontend** (`app/page.tsx`) appelle `readMonthlyStatsFromSheets()`
2. **Backend** (`lib/googleSheets.ts`) :
   - Si `GAS_WEBAPP_URL` est configuré → Appelle GAS `readSheet` avec `sheetName: "Stats"`
   - Sinon → Utilise Google Sheets API directe
3. **GAS** lit la feuille "Stats" et retourne toutes les lignes
4. **Mapping** : Conversion euros → centimes, formatage des dates
5. **Retour** : Tableau de stats au format `MonthlyStats`

---

## 🔄 Flux d'écriture

### Créer/Modifier un Event
1. **Frontend** (EventModal) → `/api/events` (POST/PATCH)
2. **Backend** (`app/api/events/route.ts`) :
   - Convertit l'event TypeScript en format Google Sheets
   - Appelle `writeEventToSheets()`
3. **GAS** (si configuré) :
   - Reçoit `updateRowByEventId` avec `eventId` et `values` (objet avec noms de colonnes)
   - Trouve la ligne par "Event ID"
   - Met à jour les colonnes spécifiées
4. **Google Sheets** : La ligne est mise à jour dans la feuille "Clients"

### Modifier des Stats
1. **Frontend** (StatsModal) → `/api/stats/monthly` (PATCH)
2. **Backend** (`app/api/stats/monthly/route.ts`) :
   - Appelle `writeMonthlyStatsToSheets()`
3. **GAS** (si configuré) :
   - Reçoit `updateRowByCompositeKey` avec `month` + autres valeurs
   - Trouve la ligne par "month"
   - Met à jour la ligne complète
4. **Google Sheets** : La ligne est mise à jour dans la feuille "Stats"

---

## 🚨 Points d'attention

### 1. Feuille "Clients" (pas "Events")
- ✅ L'application lit/écrit dans la feuille **"Clients"**
- ❌ Ne pas créer une feuille "Events" - tout est dans "Clients"

### 2. Colonne "Event ID"
- ✅ La colonne **"Event ID"** doit exister dans la feuille "Clients"
- ✅ C'est cette colonne qui sert de clé primaire pour identifier les events

### 3. Format des montants
- **Dans le code TypeScript :** Centimes (ex: `1400` = 14€)
- **Dans Google Sheets :** Euros avec virgule (ex: `"14,00"`)
- **Conversion automatique** dans `mapEventRowToClientsValues()`

### 4. GAS doit être à jour
- ✅ Vérifiez que votre GAS contient toutes les fonctions de `CODE_A_COPIER_COLLER.gs`
- ✅ Vérifiez que `doPost` inclut les 6 actions (readSheet, appendRow, updateRow, updateRowByEventId, updateRowByCompositeKey, deleteRow)
- ✅ Redéployez le GAS après modification

---

## ✅ Checklist finale

### Configuration Vercel
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` configuré
- [ ] `GAS_WEBAPP_URL` configuré
- [ ] `GAS_KEY` configuré
- [ ] `GOOGLE_MAPS_API_KEY` configuré
- [ ] Variables Supabase configurées (pour login et packs)

### Google Apps Script
- [ ] Toutes les fonctions de `CODE_A_COPIER_COLLER.gs` sont dans votre GAS
- [ ] `doPost` inclut les 6 actions
- [ ] GAS redéployé avec nouvelle version

### Google Sheets
- [ ] Feuille "Clients" existe avec colonne "Event ID"
- [ ] Feuille "Stats" existe
- [ ] Feuille "Students" existe (si utilisée)
- [ ] Feuille "Commercial" existe (si utilisée)

### Test
- [ ] `/events` charge les events depuis Google Sheets
- [ ] `/` (dashboard) charge les stats depuis Google Sheets
- [ ] Créer un event fonctionne
- [ ] Modifier un event fonctionne
- [ ] Supprimer un event fonctionne
- [ ] Modifier des stats fonctionne

---

## 🆘 En cas d'erreur "Invalid key"

1. Vérifiez que `GAS_KEY` dans Vercel = `p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7`
2. Vérifiez que `ADMIN_KEY` dans votre GAS = `p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7`
3. Vérifiez que le GAS est bien redéployé
4. Vérifiez les logs Vercel pour voir l'erreur exacte

---

## 📚 Documentation complète

- `VERCEL_ENV_VARIABLES.md` - Variables d'environnement détaillées
- `ARCHITECTURE_GOOGLE_SHEETS.md` - Architecture complète
- `CODE_A_COPIER_COLLER.gs` - Code GAS à copier
