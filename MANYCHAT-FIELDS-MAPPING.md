# Mapping des Custom Fields Manychat → Supabase

## 📊 Analyse de tes custom fields

### ✅ Fields bien capturés

| Manychat Field | Field ID | Colonne Supabase | Endpoint | Notes |
|----------------|----------|------------------|----------|-------|
| `event_city` | 14085994 | `leads.event_location` | `/lead` | Ville de l'événement |
| `event_date` | 14086100 | `leads.event_date` | `/lead` | Date de l'événement (format DATE) |
| `event_date_text` | 14086245 | - | - | Pas nécessaire (doublon de `event_date`) |
| `event_guests` | 14085996 | `leads.guest_count` | `/lead` | Nombre d'invités (INTEGER) |
| `event_type` | 14087197 | `leads.event_type` | `/lead` | Type: mariage, anniversaire, etc. |
| `pack_choice` | 14086139 | `leads.pack_id` | `/checkout` | Converti en pack_id via lookup |

### 🔄 Fields de réponse API (non stockés)

Ces fields sont des **outputs** de l'API, pas des inputs à stocker :

| Manychat Field | Field ID | Source | Usage |
|----------------|----------|--------|-------|
| `me_available` | 14086256 | `/availability` response | Boolean: date disponible ? |
| `me_booked` | 14086093 | `/availability` response | Nombre de miroirs réservés |
| `me_message` | 14086088 | `/availability` response | Message à afficher |
| `me_remaining` | 14086090 | `/availability` response | Places restantes |
| `cf_deposit_link` | 14086196 | `/checkout` response | URL de paiement Mollie |

### ❌ Fields NON capturés actuellement

| Manychat Field | Field ID | Recommandation |
|----------------|----------|----------------|
| `decision_timing` | 14086026 | À ajouter si utile pour segmentation |
| `interest_level` | 14086023 | À ajouter si utile pour scoring |
| `promo_50_active` | 14096598 | À ajouter si promo active |
| `promo_50_start` | 14096599 | À ajouter si promo active |

---

## 🗂️ Structure des tables Supabase

### Table `leads` (capture initiale)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  lead_id TEXT UNIQUE,                 -- Généré automatiquement
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  -- Contact
  client_name TEXT,                    -- {{first_name}} {{last_name}}
  client_email TEXT,                   -- {{email}}
  client_phone TEXT,                   -- {{phone}}
  language TEXT DEFAULT 'fr',          -- 'fr' ou 'nl'

  -- Événement
  event_date DATE,                     -- {{event_date}}
  event_type TEXT,                     -- {{event_type}}
  event_location TEXT,                 -- {{event_city}}
  guest_count INTEGER,                 -- {{event_guests}}

  -- Pack & Pricing
  pack_id UUID,                        -- Lookup depuis {{pack_choice}}
  zone TEXT,                           -- 'BE' ou 'FR_NORD'
  transport_fee_cents INTEGER,
  total_cents INTEGER,
  deposit_cents INTEGER,

  -- Tracking
  utm_source TEXT DEFAULT 'manychat',
  utm_medium TEXT DEFAULT 'messenger',
  utm_campaign TEXT DEFAULT 'chatbot',

  -- Progression
  step INTEGER DEFAULT 5,
  status TEXT DEFAULT 'progress',      -- 'progress', 'converted', 'abandoned'
  converted_event_id TEXT              -- Rempli après paiement
);
```

### Table `events` (après paiement)

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE,                -- Généré par /checkout
  payment_id TEXT,                     -- Mollie tr_xxx
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  -- Client (copié depuis metadata Mollie)
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  language TEXT DEFAULT 'fr',

  -- Événement (copié depuis metadata Mollie)
  event_date DATE,
  event_type TEXT,
  address TEXT,
  guest_count INTEGER,

  -- Pack & Prix
  pack_id TEXT,
  total_cents INTEGER,
  transport_fee_cents INTEGER,
  deposit_cents INTEGER,
  balance_due_cents INTEGER,
  balance_status TEXT DEFAULT 'pending',

  -- Status
  status TEXT DEFAULT 'active',        -- 'active', 'cancelled', 'completed'

  -- Assignation (Google Sheets)
  closing_date DATE,
  student_name TEXT,
  commercial_name TEXT
);
```

---

## 🔄 Flux de données

### 1️⃣ Capture initiale (avant paiement)

**Flow Manychat** → **`POST /api/manychat/lead`** → **Table `leads`**

```json
{
  "subscriber_id": "{{subscriber_id}}",
  "email": "{{email}}",
  "first_name": "{{first_name}}",
  "last_name": "{{last_name}}",
  "phone": "{{phone}}",
  "event_date": "{{event_date}}",
  "event_type": "{{event_type}}",
  "address": "{{event_city}}",
  "guest_count": "{{event_guests}}"
}
```

**Colonnes remplies** :
- ✅ `client_name`, `client_email`, `client_phone`
- ✅ `event_date`, `event_type`, `event_location`, `guest_count`
- ✅ `utm_source='manychat'`, `utm_medium='messenger'`, `utm_campaign='chatbot'`
- ✅ `status='progress'`, `step=5`

### 2️⃣ Génération du lien de paiement

**Flow Manychat** → **`POST /api/manychat/checkout`** → **Mollie payment** → **Table `payments`**

```json
{
  "email": "{{email}}",
  "name": "{{first_name}} {{last_name}}",
  "phone": "{{phone}}",
  "event_date": "{{event_date}}",
  "event_type": "{{event_type}}",
  "address": "{{event_city}}",
  "pack_code": "{{pack_choice}}",
  "zone_code": "BE",
  "guest_count": "{{event_guests}}",
  "language": "fr",
  "lead_id": "{{lead_id}}"
}
```

**Ce qui se passe** :
1. Crée un paiement Mollie avec metadata
2. Insère dans `payments` table avec `status='open'`
3. Retourne `checkout_url` à Manychat
4. Manychat stocke dans `cf_deposit_link` (field 14086196)

### 3️⃣ Après le paiement (webhook Mollie)

**Mollie** → **`POST /api/webhooks/mollie`** → **Tables `events` + `leads`**

**Ce qui se passe** :
1. Mollie envoie `payment_id` au webhook
2. Webhook fetch les metadata depuis Mollie
3. Crée un `event` dans la table `events` avec toutes les infos
4. Met à jour le `lead` : `status='converted'`, `converted_event_id=event_id`
5. Envoie notification de confirmation

**Metadata Mollie** (passées depuis `/checkout`) :
```javascript
{
  event_id: "EVT-2026-XXXXX",
  lead_id: "L-2026-XXXXX",
  client_name: "Jean Dupont",
  client_email: "jean@example.com",
  client_phone: "+32123456789",
  event_date: "2026-06-15",
  event_type: "mariage",
  address: "Bruxelles",
  guest_count: 50,
  pack_code: "ESSENTIAL",
  zone_code: "BE",
  language: "fr",
  // Prix calculés
  total_cents: 600000,
  deposit_cents: 200000,
  transport_fee_cents: 100000,
  balance_due_cents: 400000
}
```

---

## ✅ Vérification : Tes fields sont-ils bien capturés ?

| Field Manychat | Stocké dans `leads` ? | Stocké dans `events` ? | Via quel endpoint ? |
|----------------|----------------------|------------------------|---------------------|
| `event_city` | ✅ `event_location` | ✅ `address` | `/lead` + `/checkout` |
| `event_date` | ✅ `event_date` | ✅ `event_date` | `/lead` + `/checkout` |
| `event_guests` | ✅ `guest_count` | ✅ `guest_count` | `/lead` + `/checkout` |
| `event_type` | ✅ `event_type` | ✅ `event_type` | `/lead` + `/checkout` |
| `pack_choice` | ✅ `pack_id` (via lookup) | ✅ `pack_id` | `/checkout` |
| Email | ✅ `client_email` | ✅ `client_email` | `/lead` + `/checkout` |
| Nom | ✅ `client_name` | ✅ `client_name` | `/lead` + `/checkout` |
| Téléphone | ✅ `client_phone` | ✅ `client_phone` | `/lead` + `/checkout` |

**Conclusion** : ✅ **Toutes les données essentielles sont bien capturées !**

---

## 🚨 Fields manquants (optionnels)

### 1. `decision_timing` (14086026)

**Usage** : Savoir si le client décide vite ou lentement
**Suggestion** : Ajouter à `leads` si tu veux segmenter par urgence

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS decision_timing TEXT;
```

Puis dans `/lead` :
```typescript
if (payload.decision_timing) {
  updates.decision_timing = payload.decision_timing;
}
```

### 2. `interest_level` (14086023)

**Usage** : Scorer l'intérêt du lead (hot/warm/cold)
**Suggestion** : Ajouter à `leads` pour prioriser le suivi

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_level TEXT;
```

### 3. Champs promo (14096598, 14096599)

**Usage** : Tracker les promos actives
**Suggestion** : Ajouter à `leads` si tu veux analyser l'impact des promos

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS promo_applied_at TIMESTAMPTZ;
```

---

## 🧪 Comment tester ?

### Test 1 : Créer un lead via Manychat

1. Envoie un message dans ton flow Manychat
2. Remplis tous les champs (email, date, ville, etc.)
3. Le flow doit appeler `/api/manychat/lead`
4. Vérifie dans Supabase :

```sql
SELECT
  lead_id,
  client_email,
  event_date,
  event_type,
  event_location,
  guest_count,
  created_at
FROM leads
WHERE utm_source = 'manychat'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 2 : Générer un lien de paiement

1. Continue le flow jusqu'au choix du pack
2. Le flow doit appeler `/api/manychat/checkout`
3. Tu reçois `checkout_url` dans `cf_deposit_link`
4. Vérifie dans Supabase :

```sql
SELECT
  payment_id,
  event_id,
  amount_cents,
  status
FROM payments
ORDER BY created_at DESC
LIMIT 1;
```

### Test 3 : Payer l'acompte

1. Clique sur le lien de paiement
2. Complète le paiement Mollie (utilise une carte de test)
3. Mollie déclenche le webhook `/api/webhooks/mollie`
4. Vérifie dans Supabase :

```sql
-- L'event doit être créé
SELECT
  event_id,
  client_email,
  event_date,
  pack_id,
  total_cents,
  deposit_cents
FROM events
ORDER BY created_at DESC
LIMIT 1;

-- Le lead doit être marqué 'converted'
SELECT
  lead_id,
  status,
  converted_event_id
FROM leads
WHERE client_email = 'ton_email@test.com';

-- Le payment doit être 'paid'
SELECT
  payment_id,
  status,
  paid_at
FROM payments
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🎯 Recommandations

### ✅ Ce qui fonctionne déjà

1. **Capture des données essentielles** : email, date, type, ville, invités ✅
2. **Génération des liens Mollie** : pack, zone, prix ✅
3. **Création d'events après paiement** : toutes les infos passent ✅
4. **Tracking UTM** : source=manychat, medium=messenger ✅

### 🔧 Améliorations optionnelles

1. **Ajouter `decision_timing`** si tu veux prioriser les leads urgents
2. **Ajouter `interest_level`** si tu veux scorer l'engagement
3. **Ajouter champs promo** si tu fais des campagnes avec codes promo
4. **Ajouter `zone`** dans le `/lead` endpoint pour pré-calculer le transport

### 📊 Monitoring recommandé

**Dashboard Supabase** :
```sql
-- Leads créés via Manychat (dernières 24h)
SELECT COUNT(*) as total_leads
FROM leads
WHERE utm_source = 'manychat'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Taux de conversion (leads → events)
SELECT
  COUNT(DISTINCT l.lead_id) as leads_total,
  COUNT(DISTINCT l.converted_event_id) as leads_converted,
  ROUND(100.0 * COUNT(DISTINCT l.converted_event_id) / COUNT(DISTINCT l.lead_id), 2) as conversion_rate
FROM leads l
WHERE l.utm_source = 'manychat';

-- Revenu généré via Manychat
SELECT
  SUM(e.total_cents) / 100.0 as revenue_euros
FROM events e
JOIN leads l ON l.converted_event_id = e.event_id
WHERE l.utm_source = 'manychat';
```

---

## 📝 Checklist finale

- [ ] `/api/manychat/availability` configuré et testé
- [ ] `/api/manychat/lead` configuré et testé
- [ ] `/api/manychat/checkout` configuré et testé
- [ ] Custom fields Manychat mappés correctement
- [ ] Test end-to-end : flow → lead → checkout → paiement → event créé
- [ ] Vérifier dans Supabase que les données sont complètes
- [ ] Monitoring dashboard créé pour suivre les conversions

---

**Besoin d'aide ?** Si tu veux que j'ajoute les colonnes manquantes ou que je modifie les endpoints, dis-moi !
