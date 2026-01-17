# Webhook Mollie - Flow Complet

## Vue d'ensemble

Le webhook Mollie est appelé automatiquement par Mollie quand le statut d'un paiement change. Il met à jour Google Sheets et déclenche les notifications.

## Flow End-to-End

```
1. Checkout (/api/public/checkout)
   ↓
   - Crée payment Mollie avec metadata complète
   - Append ligne dans Payments (Status="open")
   ↓
2. Utilisateur paie sur Mollie
   ↓
3. Webhook Mollie (/api/webhooks/mollie)
   ↓
   - Vérifie idempotence (déjà traité ?)
   - Fetch payment depuis Mollie API
   - Si status="paid":
     a) Cherche lead dans Leads par email
     b) Update Leads (Status="converted")
     c) Append Clients
     d) Update Payments (Status="paid", Paid At=now)
     e) Crée notifications
   ↓
4. booking-success page
   ↓
   - Poll /api/public/booking-status?event_id=xxx
   - Affiche statut (paid/pending/failed)
```

## Authentification Webhook

### Problème initial
- Le code vérifiait `x-webhook-secret` header
- **Mollie n'envoie PAS ce header nativement**
- Résultat: 401 Unauthorized

### Solution implémentée
Le webhook accepte maintenant **3 méthodes** (backward compatible):

1. **Header `x-webhook-secret`** (si défini dans env)
2. **Query param `?key=xxx`** (recommandé pour Mollie)
3. **Aucun secret** (validation via Mollie API uniquement - moins sécurisé)

**Configuration recommandée:**
- Définir `MOLLIE_WEBHOOK_SECRET` dans Vercel env
- Configurer webhook URL dans Mollie: `https://yourdomain.com/api/webhooks/mollie?key=YOUR_SECRET`

## Structure Sheets

### Payments Sheet
Colonnes:
- `Payment ID` (clé primaire) = `tr_xxx` (Mollie payment ID)
- `Event ID`
- `Provider` = "mollie"
- `Provider Payment ID` = `tr_xxx` (dupliqué pour référence)
- `Amount Cents` = 18000 (dépôt)
- `Status` = "open" | "paid" | "failed" | "canceled" | "expired"
- `Paid At` = ISO datetime (si paid)
- `Created At` = ISO datetime
- `Updated At` = ISO datetime

### Clients Sheet
- Une ligne est ajoutée **uniquement** quand `status="paid"`
- Contient toutes les données de l'event (depuis metadata Mollie)

## Logs Structurés

Tous les logs incluent:
- `requestId`: UUID unique pour traçabilité
- `paymentId`: `tr_xxx` de Mollie
- `timestamp`: ISO datetime
- `email`: Email client (si disponible)
- `eventId`: Event ID
- `leadIdFound`: boolean
- `updatePaymentsSuccess`: boolean
- `appendClientsSuccess`: boolean
- `duration`: Temps d'exécution en ms

**Exemple:**
```json
{
  "requestId": "abc-123",
  "paymentId": "tr_xyz789",
  "email": "client@example.com",
  "eventId": "EVT-1234567890-ABC",
  "leadIdFound": true,
  "updatePaymentsSuccess": true,
  "appendClientsSuccess": true,
  "duration": "245ms"
}
```

## API booking-status

### Endpoint
`GET /api/public/booking-status?event_id=EVT-xxx`

### Réponse

**200 OK:**
```json
{
  "ok": true,
  "event_id": "EVT-1234567890-ABC",
  "client_name": "John Doe",
  "event_date": "2025-01-15",
  "total_cents": 48000,
  "status": "active",
  "deposit_paid": true,
  "payment_status": "paid",
  "paid_at": "2025-01-10T14:30:00.000Z"
}
```

**404 Not Found:**
```json
{
  "ok": false,
  "error": "not_found"
}
```

**400 Bad Request:**
```json
{
  "ok": false,
  "error": "invalid_query",
  "issues": { ... }
}
```

### Logique
1. Cherche dans **Clients** sheet (si trouvé → `deposit_paid=true`)
2. Sinon, cherche dans **Payments** sheet
   - `deposit_paid = (Status === "paid")`
   - `payment_status = Status`

## Checklist de Test End-to-End

### 1. Faire un paiement Mollie test
- [ ] Aller sur `/reservation`
- [ ] Remplir le formulaire jusqu'au checkout
- [ ] Cliquer "Payer l'acompte"
- [ ] Utiliser carte test Mollie: `4111111111111111`
- [ ] Vérifier redirection vers `/booking/success?event_id=EVT-xxx`

### 2. Vérifier Payments status open → paid
- [ ] Ouvrir Google Sheets "Payments"
- [ ] Trouver la ligne avec `Payment ID = tr_xxx`
- [ ] Vérifier `Status = "open"` initialement
- [ ] Attendre webhook Mollie (quelques secondes)
- [ ] Vérifier `Status = "paid"` après webhook
- [ ] Vérifier `Paid At` est rempli

### 3. Vérifier Clients append
- [ ] Ouvrir Google Sheets "Clients"
- [ ] Chercher ligne avec `Event ID = EVT-xxx`
- [ ] Vérifier que la ligne existe (ajoutée par webhook)
- [ ] Vérifier colonnes: Email, Nom, Date Event, Pack, Total, etc.

### 4. Vérifier /booking/success affiche paid
- [ ] Aller sur `/booking/success?event_id=EVT-xxx`
- [ ] Vérifier que la page charge
- [ ] Vérifier que `deposit_paid = true` s'affiche
- [ ] Vérifier que `payment_status = "paid"` s'affiche
- [ ] Vérifier logs Vercel pour `/api/public/booking-status` (200 OK)

### 5. Vérifier logs webhook
- [ ] Ouvrir Vercel logs
- [ ] Filtrer par `[mollie-webhook]`
- [ ] Vérifier logs structurés avec `requestId`, `paymentId`, `email`
- [ ] Vérifier `updatePaymentsSuccess: true`
- [ ] Vérifier `appendClientsSuccess: true`
- [ ] Vérifier pas d'erreur 401

## Troubleshooting

### 401 Unauthorized
**Cause:** Webhook secret manquant ou invalide
**Fix:**
1. Vérifier `MOLLIE_WEBHOOK_SECRET` dans Vercel env
2. Configurer webhook URL dans Mollie avec `?key=SECRET`
3. Ou supprimer la vérification (moins sécurisé)

### Payments reste en "open"
**Cause:** Webhook non appelé ou erreur lors de l'update
**Fix:**
1. Vérifier logs Vercel pour erreurs
2. Vérifier que `updatePaymentsSuccess: true` dans logs
3. Vérifier que l'action GAS `updateRow` fonctionne

### Clients non créé
**Cause:** Erreur lors de l'append ou `client_email` manquant
**Fix:**
1. Vérifier logs pour `appendClientsSuccess`
2. Vérifier que `metadata.client_email` est présent dans checkout
3. Vérifier que l'action GAS `appendRow` fonctionne

### booking-status retourne 404
**Cause:** Event ID non trouvé dans Clients ni Payments
**Fix:**
1. Vérifier que le webhook a bien créé la ligne Clients
2. Vérifier que Payments contient la ligne avec cet Event ID
3. Vérifier le format de l'Event ID (doit correspondre exactement)

## Ordre d'exécution (Source of Truth)

1. **Checkout** → `Payments(Status="open")`
2. **Webhook paid** → `Payments(Status="paid")` + `Clients(append)`
3. **booking-success** → Poll `booking-status` → Lit `Payments` + `Clients`

**Important:** 
- `Clients` est la source de vérité pour "acompte payé" (une ligne = acompte payé)
- `Payments` est la source de vérité pour le statut du paiement Mollie
- `booking-status` combine les deux pour déterminer `deposit_paid`
