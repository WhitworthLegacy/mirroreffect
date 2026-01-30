# Endpoints Manychat - Guide Complet

## 📋 Vue d'ensemble

Trois endpoints disponibles pour intégrer Manychat avec ton backend :

1. **`/api/manychat/availability`** - Vérifier la disponibilité d'une date
2. **`/api/manychat/lead`** - Capturer un lead
3. **`/api/manychat/checkout`** - Générer un lien de paiement Mollie

---

## 1️⃣ Vérifier la disponibilité (`/availability`)

### URL
```
https://www.mirroreffect.co/api/manychat/availability
```

### Request
**Method**: `POST`
**Headers**: `Content-Type: application/json`
**Body**:
```json
{
  "date": "15/06/2026"
}
```

Formats acceptés : `YYYY-MM-DD` ou `DD/MM/YYYY`

### Response

**Si disponible** :
```json
{
  "ok": true,
  "date": "2026-06-15",
  "capacity": 4,
  "booked": 0,
  "available": true,
  "remaining": 4,
  "message": "✅ Votre date est bien disponible le 15/06/2026 (reste 4 places).",
  "requestId": "..."
}
```

**Si complet** :
```json
{
  "ok": true,
  "date": "2026-08-22",
  "capacity": 4,
  "booked": 4,
  "available": false,
  "remaining": 0,
  "message": "❌ Désolé, on est complet le 22/08/2026.",
  "requestId": "..."
}
```

### Configuration Manychat

**Body (JSON)** :
```json
{
  "date": "{{date}}"
}
```

**Response Mapping** :
- `response.available` → custom field `is_available`
- `response.message` → custom field `availability_message`
- `response.remaining` → custom field `remaining_spots`

**Condition** :
```
IF {{is_available}} == true
  → Afficher: {{availability_message}}
  → Continuer le flow
ELSE
  → Afficher: {{availability_message}}
  → Proposer une autre date
```

---

## 2️⃣ Capturer un lead (`/lead`)

### URL
```
https://www.mirroreffect.co/api/manychat/lead
```

### Request
**Method**: `POST`
**Headers**: `Content-Type: application/json`
**Body**:
```json
{
  "subscriber_id": "{{subscriber_id}}",
  "email": "{{email}}",
  "first_name": "{{first_name}}",
  "last_name": "{{last_name}}",
  "phone": "{{phone}}",
  "event_date": "{{event_date}}",
  "event_type": "{{event_type}}",
  "address": "{{address}}",
  "guest_count": "{{guest_count}}"
}
```

**Champs requis** :
- `subscriber_id` (Manychat ID)
- `email`

**Champs optionnels** :
- `first_name`, `last_name`
- `phone`
- `event_date` (format YYYY-MM-DD ou DD/MM/YYYY)
- `event_type` (mariage, anniversaire, bapteme, corporate, etc.)
- `address`
- `guest_count` (nombre ou string)

### Response

**Si créé** :
```json
{
  "ok": true,
  "requestId": "...",
  "lead_id": "L-2026-XXXXX",
  "created": true,
  "message": "Lead créé avec succès"
}
```

**Si mis à jour** :
```json
{
  "ok": true,
  "requestId": "...",
  "lead_id": "L-2026-XXXXX",
  "updated": true,
  "message": "Lead mis à jour avec succès"
}
```

### Configuration Manychat

Place cet External Request **après avoir collecté l'email** de l'utilisateur.

**Body (JSON)** :
```json
{
  "subscriber_id": "{{subscriber_id}}",
  "email": "{{email}}",
  "first_name": "{{first_name}}",
  "last_name": "{{last_name}}",
  "phone": "{{phone}}",
  "event_date": "{{event_date}}",
  "event_type": "{{event_type}}",
  "address": "{{address}}",
  "guest_count": "{{guest_count}}"
}
```

**Response Mapping** :
- `response.lead_id` → custom field `lead_id`
- `response.message` → custom field `lead_message`

**Message suivant** :
```
✅ {{lead_message}}

Maintenant, parlons de ton événement...
```

---

## 3️⃣ Générer un lien de paiement (`/checkout`)

### URL
```
https://www.mirroreffect.co/api/manychat/checkout
```

### Request
**Method**: `POST`
**Headers**: `Content-Type: application/json`
**Body**:
```json
{
  "email": "{{email}}",
  "name": "{{name}}",
  "phone": "{{phone}}",
  "event_date": "{{event_date}}",
  "event_type": "{{event_type}}",
  "address": "{{address}}",
  "pack_code": "ESSENTIAL",
  "zone_code": "BE",
  "guest_count": "{{guest_count}}",
  "language": "fr",
  "lead_id": "{{lead_id}}"
}
```

**Champs requis** :
- `email`
- `event_date` (format YYYY-MM-DD)

**Champs optionnels** :
- `name`, `phone`, `address`
- `pack_code` : `DISCOVERY` (450€), `ESSENTIAL` (500€), `PREMIUM` (550€) - défaut: `ESSENTIAL`
- `zone_code` : `BE` (+100€) ou `FR_NORD` (+150€) - défaut: `BE`
- `event_type` : mariage, anniversaire, etc.
- `guest_count` : nombre d'invités
- `language` : `fr` ou `nl` - défaut: `fr`
- `lead_id` : si déjà créé via `/lead`

### Response

```json
{
  "ok": true,
  "requestId": "...",
  "event_id": "EVT-2026-XXXXX",
  "lead_id": "L-2026-XXXXX",
  "payment_id": "tr_XXXXXXXXX",
  "checkout_url": "https://www.mollie.com/checkout/...",
  "deposit_amount": "200.00€",
  "total_amount": "600.00€",
  "message": "Votre lien de paiement est prêt ! Montant de l'acompte : 200.00€"
}
```

### Configuration Manychat

Place cet External Request **à la fin du flow**, quand tu as toutes les infos.

**Body (JSON)** :
```json
{
  "email": "{{email}}",
  "name": "{{first_name}} {{last_name}}",
  "phone": "{{phone}}",
  "event_date": "{{event_date}}",
  "event_type": "{{event_type}}",
  "address": "{{address}}",
  "pack_code": "{{pack_code}}",
  "zone_code": "BE",
  "guest_count": "{{guest_count}}",
  "language": "fr",
  "lead_id": "{{lead_id}}"
}
```

**Response Mapping** :
- `response.checkout_url` → custom field `payment_link`
- `response.message` → custom field `payment_message`
- `response.deposit_amount` → custom field `deposit_amount`
- `response.total_amount` → custom field `total_amount`

**Message suivant avec bouton** :
```
{{payment_message}}

Prix total : {{total_amount}}
(Frais de transport inclus)

Le solde de {{total_amount - deposit_amount}} sera à régler avant l'événement.
```

**Bouton** :
- Type : `URL`
- Caption : `💳 Payer l'acompte ({{deposit_amount}})`
- URL : `{{payment_link}}`

---

## 🧪 Tests

### Test 1 : Availability

```bash
curl -X POST https://www.mirroreffect.co/api/manychat/availability \
  -H "Content-Type: application/json" \
  -d '{"date": "15/06/2026"}'
```

### Test 2 : Lead

```bash
curl -X POST https://www.mirroreffect.co/api/manychat/lead \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "test_123",
    "email": "test@example.com",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "+32123456789",
    "event_date": "2026-06-15",
    "event_type": "mariage",
    "address": "Bruxelles",
    "guest_count": 50
  }'
```

### Test 3 : Checkout

```bash
curl -X POST https://www.mirroreffect.co/api/manychat/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Jean Dupont",
    "phone": "+32123456789",
    "event_date": "2026-06-15",
    "event_type": "mariage",
    "address": "Bruxelles",
    "pack_code": "ESSENTIAL",
    "zone_code": "BE",
    "guest_count": 50,
    "language": "fr"
  }'
```

---

## 🔄 Flow Manychat Recommandé

```
1. Message de bienvenue
   ↓
2. Demander la date
   ↓
3. External Request: /availability
   ↓
4. Si disponible → Continuer
   Si complet → Proposer autre date
   ↓
5. Demander email + infos (nom, tel, type événement, etc.)
   ↓
6. External Request: /lead (capturer le lead)
   ↓
7. Proposer les packs (DISCOVERY, ESSENTIAL, PREMIUM)
   ↓
8. Demander l'adresse de l'événement
   ↓
9. External Request: /checkout (générer lien de paiement)
   ↓
10. Afficher le bouton de paiement
    ↓
11. Confirmer et remercier
```

---

## 📊 Monitoring

### Logs Vercel

Tous les endpoints loggent avec un `requestId` unique :

```
[manychat-availability][requestId] Date: 2026-06-15, Booked: 2/4, Available: true
[manychat-lead][requestId] Lead créé: L-2026-XXXXX
[manychat-checkout][requestId] Checkout créé: EVT-2026-XXXXX
```

Pour voir les logs :
1. Dashboard Vercel → ton projet
2. Functions → Logs
3. Recherche par `[manychat-` pour filtrer

### Vérifier dans Supabase

**Leads créés via Manychat** :
```sql
SELECT * FROM leads
WHERE utm_source = 'manychat'
ORDER BY created_at DESC
LIMIT 10;
```

**Paiements en attente** :
```sql
SELECT * FROM payments
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Sécurité

- Tous les endpoints sont publics (pas d'auth) car appelés par Manychat
- Les emails sont normalisés en lowercase
- Les dates sont validées et normalisées
- Les erreurs sont loggées avec requestId pour debugging
- Les paiements Mollie utilisent des webhooks sécurisés

---

## 💡 Tips

1. **Toujours capturer le lead_id** après `/lead` pour le réutiliser dans `/checkout`
2. **Valider la date avant le checkout** avec `/availability`
3. **Afficher le message de disponibilité** directement (response.message)
4. **Tester en local** avant de déployer dans le flow Manychat
5. **Surveiller les logs Vercel** pour détecter les erreurs

---

## 🚀 Déploiement

Les endpoints sont déjà déployés en production sur :
```
https://www.mirroreffect.co/api/manychat/*
```

Tout commit sur `main` déclenche un déploiement automatique via Vercel.
