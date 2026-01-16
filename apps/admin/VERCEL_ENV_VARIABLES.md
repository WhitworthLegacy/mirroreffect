# 🔑 Variables d'environnement Vercel - Admin

## ✅ Variables OBLIGATOIRES pour Google Sheets

### 1. Google Sheets - Configuration de base
```
GOOGLE_SHEETS_SPREADSHEET_ID=12X9G62lKRzJSYHZfGQ6jCTMwgOCfdMtkTD6A-GbuwqQ
```

### 2. Google Apps Script (RECOMMANDÉ - Méthode la plus simple)
```
GAS_WEBAPP_URL=https://script.google.com/macros/s/AKfycbxRn8rubKlfUp6NUHBxoFOTiIcMtFmYqyXZBp3ohUBQ55oZLFqL23COAhAm2VQC0Lv8/exec
GAS_KEY=p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7
```

**Note :** Si vous utilisez GAS, vous n'avez PAS besoin des variables OAuth 2.0 ou Service Account ci-dessous.

---

## 🔐 Variables pour l'authentification (si vous n'utilisez PAS GAS)

### Option A : OAuth 2.0 avec Refresh Token
```
GOOGLE_SHEETS_CLIENT_ID=votre_client_id
GOOGLE_SHEETS_CLIENT_SECRET=votre_client_secret
GOOGLE_SHEETS_REFRESH_TOKEN=votre_refresh_token
```

### Option B : Service Account (si autorisé par votre organisation)
```
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=votre-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### Option C : API Key (lecture seule uniquement)
```
GOOGLE_SHEETS_API_KEY=votre_api_key
```

---

## 🗺️ Google Maps API (pour le calcul des KM)

```
GOOGLE_MAPS_API_KEY=votre_google_maps_api_key
```

**Utilisé par :** `/api/events/recalculate` pour calculer les distances et les heures étudiant.

---

## 🔒 Variables Supabase (UNIQUEMENT pour l'authentification et les packs)

### Pour l'authentification admin (login)
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

### Pour les packs (lecture uniquement)
```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Note :** Les events, stats, students et commercial sont maintenant 100% dans Google Sheets. Supabase n'est utilisé QUE pour :
- L'authentification (login/admin-guard)
- La lecture des packs (table `packs`)

---

## 📋 Checklist Vercel

### Variables Google Sheets (OBLIGATOIRE)
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID`
- [ ] `GAS_WEBAPP_URL` (si vous utilisez GAS - RECOMMANDÉ)
- [ ] `GAS_KEY` (si vous utilisez GAS)

### Variables Google Maps (OBLIGATOIRE pour recalculate)
- [ ] `GOOGLE_MAPS_API_KEY`

### Variables Supabase (OBLIGATOIRE pour login et packs)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎯 Résumé

**Source de données :**
- ✅ **Events** → Google Sheets (feuille "Clients")
- ✅ **Stats** → Google Sheets (feuille "Stats")
- ✅ **Students** → Google Sheets (feuille "Students")
- ✅ **Commercial** → Google Sheets (feuille "Commercial")
- ✅ **Packs** → Supabase (table `packs`) - **Temporaire, peut être migré vers Google Sheets plus tard**

**Authentification :**
- ✅ **Login/Admin Guard** → Supabase Auth

**Calculs :**
- ✅ **KM/Heures étudiant** → Google Maps API (via `/api/events/recalculate`)
