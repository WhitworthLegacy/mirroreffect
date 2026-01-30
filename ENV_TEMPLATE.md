# 🔑 ENV_TEMPLATE - Variables d'Environnement

## Template pour Local (.env.local)

```bash
# ==============================================================================
# GOOGLE SHEETS (OBLIGATOIRE - Admin)
# ==============================================================================

# ID du Google Spreadsheet (trouvable dans l'URL)
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-here

# Google Apps Script WebApp URL (déployée comme Web App)
GAS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Clé secrète pour sécuriser les appels GAS (doit correspondre à ADMIN_KEY dans GAS)
GAS_KEY=your-secret-key-here


# ==============================================================================
# GOOGLE MAPS (OBLIGATOIRE si /api/events/recalculate utilisé - Admin)
# ==============================================================================

GOOGLE_MAPS_API_KEY=your-google-maps-api-key


# ==============================================================================
# SUPABASE (OBLIGATOIRE - Auth Admin + Packs + Web App)
# ==============================================================================

# Public (exposé au client browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Server-only (privé)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here


# ==============================================================================
# MOLLIE (OBLIGATOIRE si checkout web utilisé - Web App)
# ==============================================================================

MOLLIE_API_KEY=live_xxxxxxxxxxxxx_or_test_xxxxxxxxxxxxx
MOLLIE_WEBHOOK_SECRET=your-webhook-secret-here


# ==============================================================================
# APP URL (OBLIGATOIRE pour webhooks - Web App)
# ==============================================================================

APP_URL=https://your-domain.com


# ==============================================================================
# OPTIONNEL - Google Sheets OAuth (si GAS non utilisé)
# ==============================================================================
# Utiliser UNIQUEMENT si GAS_WEBAPP_URL n'est pas configuré

# GOOGLE_SHEETS_CLIENT_ID=your-client-id
# GOOGLE_SHEETS_CLIENT_SECRET=your-client-secret
# GOOGLE_SHEETS_REFRESH_TOKEN=your-refresh-token


# ==============================================================================
# OPTIONNEL - Google Sheets Service Account (si GAS non utilisé)
# ==============================================================================
# Utiliser UNIQUEMENT si GAS_WEBAPP_URL n'est pas configuré

# GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
# GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"


# ==============================================================================
# OPTIONNEL - SMTP Email (si emails custom)
# ==============================================================================

# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

---

## Template pour Vercel (Admin App)

```bash
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GAS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_ID/exec
GAS_KEY=your-secret-key

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note Vercel Admin:**
- Toutes les variables sont **server-only** sauf `NEXT_PUBLIC_*`
- Ajouter dans **Settings → Environment Variables** pour production/preview/development

---

## Template pour Vercel (Web App)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mollie
MOLLIE_API_KEY=live_xxxxxxxxxxxxx_or_test_xxxxxxxxxxxxx
MOLLIE_WEBHOOK_SECRET=your-webhook-secret

# App URL
APP_URL=https://your-domain.com

# GAS (pour leads uniquement - peut être différent de admin)
GAS_WEBAPP_URL=https://script.google.com/macros/s/YOUR_LEADS_GAS_ID/exec
```

**Note Vercel Web:**
- `APP_URL` doit être l'URL publique finale (sans trailing slash)
- `MOLLIE_WEBHOOK_SECRET` doit correspondre au secret configuré dans dashboard Mollie
- `GAS_WEBAPP_URL` pour leads peut être un GAS différent de celui utilisé par admin

---

## Checklist Variables Requises

### Admin App
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID`
- [ ] `GAS_WEBAPP_URL`
- [ ] `GAS_KEY`
- [ ] `GOOGLE_MAPS_API_KEY` (si recalculate utilisé)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Web App
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `MOLLIE_API_KEY` (si checkout)
- [ ] `MOLLIE_WEBHOOK_SECRET` (si checkout)
- [ ] `APP_URL` (si webhooks)
- [ ] `GAS_WEBAPP_URL` (si leads)

---

## Variables Publiques vs Server-Only

### Public (`NEXT_PUBLIC_*`)
- **Exposé au client browser** (visible dans `window`, source code)
- ✅ OK pour Supabase anon key (par design)
- ⚠️ **NE JAMAIS** exposer `GAS_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MOLLIE_API_KEY`

### Server-Only
- **Uniquement accessible dans API routes / Server Components**
- Sécurisé côté serveur Vercel
- ✅ Toutes les autres variables (sans `NEXT_PUBLIC_`)

---

## Sécurité

### ⚠️ Ne JAMAIS commiter dans Git
- Ajouter `.env.local` dans `.gitignore` (déjà fait normalement)
- Vercel gère les secrets via dashboard

### 🔒 Rotation des Clés
- `GAS_KEY`: Changer dans GAS + Vercel simultanément
- `MOLLIE_WEBHOOK_SECRET`: Changer dans Mollie dashboard + Vercel simultanément
- `SUPABASE_SERVICE_ROLE_KEY`: Régénérer dans Supabase si compromise

---

**Dernière mise à jour:** 2026-01-12
