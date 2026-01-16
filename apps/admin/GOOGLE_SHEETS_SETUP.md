# Configuration Google Sheets

**Google Sheets est maintenant la source principale de données pour les events.** 

Cette application utilise Google Sheets comme base de données principale pour tous les events. Supabase n'est plus utilisé pour stocker les events (seulement pour les packs et l'authentification).

## Configuration

### 1. Choisir une méthode d'authentification

**Si votre organisation bloque les service account keys** (erreur `iam.disableServiceAccountKeyCreation`), utilisez **OAuth 2.0** (voir [GOOGLE_SHEETS_OAUTH_SETUP.md](./GOOGLE_SHEETS_OAUTH_SETUP.md)).

Sinon, vous pouvez utiliser un **Service Account** :

#### Option A: Service Account (si autorisé)

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google Sheets :
   - Aller dans "APIs & Services" > "Library"
   - Rechercher "Google Sheets API"
   - Cliquer sur "Enable"
4. Créer un Service Account :
   - Aller dans "APIs & Services" > "Credentials"
   - Cliquer sur "Create Credentials" > "Service Account"
   - Donner un nom au service account
   - Cliquer sur "Create and Continue"
   - Rôle : "Editor" (ou un rôle personnalisé avec accès à Google Sheets)
   - Cliquer sur "Done"
5. Générer une clé JSON :
   - Cliquer sur le service account créé
   - Aller dans l'onglet "Keys"
   - Cliquer sur "Add Key" > "Create new key"
   - Choisir "JSON"
   - Télécharger le fichier JSON

#### Option B: OAuth 2.0 (RECOMMANDÉ si service account bloqué)

Voir le guide détaillé : [GOOGLE_SHEETS_OAUTH_SETUP.md](./GOOGLE_SHEETS_OAUTH_SETUP.md)

### 2. Partager le Google Sheet

1. Ouvrir votre Google Sheet
2. Cliquer sur "Share" (Partager)
3. Ajouter :
   - **Service Account** : l'email du service account (trouvable dans le fichier JSON, champ `client_email`)
   - **OAuth 2.0** : l'email du compte Google utilisé pour obtenir le refresh token
4. Donner les permissions "Editor"

### 3. Configurer les variables d'environnement

#### Pour Service Account :

```bash
# ID du Google Sheet (trouvable dans l'URL : https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)
GOOGLE_SHEETS_SPREADSHEET_ID=votre_spreadsheet_id

# Depuis le fichier JSON du service account
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=votre-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important** : Pour `GOOGLE_SHEETS_PRIVATE_KEY`, copier tout le contenu du champ `private_key` du fichier JSON, y compris les `\n`.

#### Pour OAuth 2.0 :

```bash
# ID du Google Sheet
GOOGLE_SHEETS_SPREADSHEET_ID=votre_spreadsheet_id

# OAuth 2.0 Credentials
GOOGLE_SHEETS_CLIENT_ID=votre_client_id
GOOGLE_SHEETS_CLIENT_SECRET=votre_client_secret
GOOGLE_SHEETS_REFRESH_TOKEN=votre_refresh_token
```

### 4. Structure du Google Sheet

Le Google Sheet doit avoir deux feuilles :

#### Feuille "Events"
Cette feuille contient tous les events. Les colonnes sont :
- ID (colonne A)
- Date Event
- Type Event
- Langue
- Nom Client
- Email Client
- Téléphone Client
- Adresse
- Pack ID
- Total (€)
- Transport (€)
- Acompte (€)
- Solde (€)
- Statut
- Étudiant
- Heures Étudiant
- Taux Étudiant (€/h)
- KM Aller
- KM Total
- Coût Essence (€)
- Commercial
- Commission Commerciale (€)
- Marge Brute (€)
- Ref Facture Acompte
- Ref Facture Solde
- Acompte Payé
- Solde Payé
- Date Closing

#### Feuille "Stats"
Cette feuille contient les statistiques mensuelles. Les colonnes doivent correspondre aux champs de `MonthlyStats` :
- month
- closing_total
- closing_decouverte
- closing_essentiel
- closing_premium
- deposits_signed_cents
- events_count
- events_decouverte
- events_essentiel
- events_premium
- total_event_cents
- deposits_event_cents
- remaining_event_cents
- transport_cents
- ca_total_cents
- student_hours
- student_cost_cents
- fuel_cost_cents
- commercial_commission_cents
- pack_cost_cents
- gross_margin_cents
- cashflow_gross_cents
- leads_meta
- spent_meta_cents

### 5. Configuration Vercel Cron (optionnel)

Pour synchroniser automatiquement toutes les 15 minutes, ajouter dans `vercel.json` à la racine du projet :

```json
{
  "crons": [
    {
      "path": "/api/sync/google-sheets",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Et ajouter une variable d'environnement `CRON_SECRET` dans Vercel pour sécuriser l'endpoint.

### 6. Installation des dépendances

Si vous utilisez le service account (recommandé), installer `jsonwebtoken` :

```bash
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

## Fonctionnement

1. **Création d'Event** : Quand un event est créé via l'API `/api/events` (POST), il est écrit directement dans Google Sheets (feuille "Events")

2. **Modification d'Event** : Quand un event est modifié via l'API `/api/events` (PATCH), il est mis à jour directement dans Google Sheets

3. **Suppression d'Event** : Quand un event est supprimé via l'API `/api/events` (DELETE), la ligne est supprimée de Google Sheets

4. **Lecture des Events** : Tous les events sont lus depuis Google Sheets (feuille "Events"). Le dashboard et toutes les pages utilisent Google Sheets comme source principale.

5. **Lecture des stats** : Le dashboard lit les statistiques mensuelles depuis Google Sheets (feuille "Stats"). Si Google Sheets n'est pas disponible, il fait un fallback vers Supabase (pour les stats uniquement).

6. **Synchronisation** : La route `/api/sync/google-sheets` peut être utilisée pour synchroniser, mais n'est plus nécessaire puisque Google Sheets est la source principale.

## Dépannage

- **Erreur "Unauthorized"** : Vérifier que le service account a bien accès au Google Sheet
- **Erreur "Spreadsheet not found"** : Vérifier que `GOOGLE_SHEETS_SPREADSHEET_ID` est correct
- **Erreur "Invalid credentials"** : Vérifier que `GOOGLE_SHEETS_PRIVATE_KEY` contient bien les `\n` et les guillemets
