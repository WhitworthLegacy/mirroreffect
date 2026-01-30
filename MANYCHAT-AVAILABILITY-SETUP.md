# Configuration Manychat - Endpoint Availability

## 🎯 Objectif

Remplacer l'appel GAS (Google Apps Script) par un appel direct à ton backend Next.js qui interroge Supabase pour vérifier la disponibilité d'une date.

## ✅ Ce qui a été fait

1. **Endpoint créé** : `/api/manychat/availability`
   - Fichier : `apps/web/app/api/manychat/availability/route.ts`
   - Accepte POST avec `{"date": "2026-06-15"}` ou `{"date": "15/06/2026"}`
   - Retourne la disponibilité en interrogeant la table `events` de Supabase

2. **Capacité configurée** : 4 miroirs par jour
   - Défini dans `MIRROR_CAPACITY = 4`

3. **Script de test créé** : `test-availability.sh`
   - Teste les différents formats de date
   - Valide les cas d'erreur

## 📋 Étapes pour tester localement

### 1. Démarrer le serveur de développement

```bash
cd /Volumes/YaqubLegacy/Dev/clients/mirroreffect/apps/web
npm run dev
# ou
pnpm dev
# ou
yarn dev
```

Attendre que le serveur démarre sur `http://localhost:3000`

### 2. Lancer les tests

Dans un autre terminal :

```bash
cd /Volumes/YaqubLegacy/Dev/clients/mirroreffect
./test-availability.sh
```

### 3. Résultats attendus

**Test 1 & 2** (dates valides) :
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

**Test 3** (date invalide) :
```json
{
  "ok": false,
  "error": "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY",
  "date": "invalid-date",
  "requestId": "..."
}
```

**Test 4** (paramètre manquant) :
```json
{
  "ok": false,
  "error": "Missing date parameter",
  "requestId": "..."
}
```

## 🔧 Configuration du Flow Manychat

### Dans ton flow existant (Flow #1)

1. **Trouve l'action "External Request"** qui appelle actuellement GAS
   - C'est probablement après que l'utilisateur entre sa date

2. **Modifier la configuration** :

   **URL** (en développement) :
   ```
   http://localhost:3000/api/manychat/availability
   ```

   **URL** (en production, après déploiement) :
   ```
   https://ton-domaine.vercel.app/api/manychat/availability
   ```

   **Méthode** : `POST`

   **Headers** :
   ```
   Content-Type: application/json
   ```

   **Body (JSON)** :
   ```json
   {
     "date": "{{date}}"
   }
   ```

   Où `{{date}}` est la variable custom field qui contient la date saisie par l'utilisateur.

3. **Capturer la réponse** :

   Dans les "Response Mapping" ou "Custom Fields", mappe les valeurs suivantes :

   - `available` → custom field `is_available` (boolean)
   - `message` → custom field `availability_message` (text)
   - `remaining` → custom field `remaining_spots` (number)
   - `booked` → custom field `booked_count` (number)

4. **Ajouter la logique conditionnelle** :

   Après l'External Request, ajoute une condition :

   ```
   IF {{is_available}} == true
     → Message: {{availability_message}}
     → Continue le flow (demander autres infos)
   ELSE
     → Message: {{availability_message}}
     → Proposer une autre date
   ```

### Exemple de flow complet

```
[User Input: Date]
   ↓
[External Request: Check Availability]
   URL: https://ton-domaine.vercel.app/api/manychat/availability
   Body: {"date": "{{date}}"}
   ↓
[Store Response]
   is_available = {{response.available}}
   availability_message = {{response.message}}
   ↓
[Condition: is_available?]
   ↓                    ↓
  YES                  NO
   ↓                    ↓
[Show message]      [Show message]
Continue flow       Ask for another date
```

## 🚀 Déploiement en production

### 1. Vérifier les variables d'environnement sur Vercel

Dans ton dashboard Vercel → Settings → Environment Variables :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Toutes les autres variables nécessaires

### 2. Déployer

```bash
git add .
git commit -m "feat: add Manychat availability endpoint"
git push origin main
```

Vercel va automatiquement déployer.

### 3. Mettre à jour l'URL dans Manychat

Remplace `http://localhost:3000` par ton URL de production :
```
https://ton-domaine.vercel.app/api/manychat/availability
```

### 4. Tester en production

Utilise curl pour tester :

```bash
curl -X POST https://ton-domaine.vercel.app/api/manychat/availability \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-06-15"}'
```

## 📊 Monitoring

### Logs dans Vercel

- Aller dans ton projet Vercel → Functions
- Cliquer sur `/api/manychat/availability`
- Voir les logs en temps réel

Chaque requête log :
```
[manychat-availability][requestId] Date: 2026-06-15, Booked: 2/4, Available: true
```

### Vérification dans Supabase

Query pour voir les réservations par date :

```sql
SELECT
  event_date,
  COUNT(*) as booked_count,
  ARRAY_AGG(client_name) as clients
FROM events
WHERE event_date >= CURRENT_DATE
GROUP BY event_date
ORDER BY event_date;
```

## 🔍 Troubleshooting

### Erreur: "Database error"

- Vérifie que les credentials Supabase sont corrects dans `.env.local` ou Vercel
- Vérifie que la table `events` existe et contient la colonne `event_date`

### Erreur: "Invalid date format"

- La date doit être au format `YYYY-MM-DD` ou `DD/MM/YYYY`
- Vérifie le custom field dans Manychat qui capture la date

### Capacité incorrecte

- Modifie `MIRROR_CAPACITY` dans [route.ts:5](apps/web/app/api/manychat/availability/route.ts#L5)
- Redéployer

### Logs ne s'affichent pas

- Les logs sont dans Vercel Functions, pas dans le build log
- En local, ils s'affichent dans le terminal où `npm run dev` tourne

## 🎉 Avantages vs GAS

1. **Performance** : Accès direct à Supabase, pas de Google Sheets
2. **Fiabilité** : Moins de points de défaillance
3. **Maintenance** : Code TypeScript versionnéé avec Git
4. **Logs** : Meilleur debugging avec requestId
5. **Sécurité** : Pas besoin de rendre GAS public

## 📝 Notes

- L'endpoint ne nécessite pas d'authentification (c'est intentionnel pour Manychat)
- Chaque requête génère un `requestId` unique pour le debugging
- Les dates sont normalisées automatiquement (DD/MM → YYYY-MM-DD)
- Le message retourné est en français et prêt à être affiché à l'utilisateur
