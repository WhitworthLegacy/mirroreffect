# Configuration Google Sheets avec OAuth 2.0

Si votre organisation bloque la création de clés de compte de service, utilisez OAuth 2.0 avec un refresh token.

## Étape 1: Créer un projet OAuth 2.0

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google Sheets :
   - Aller dans "APIs & Services" > "Library"
   - Rechercher "Google Sheets API"
   - Cliquer sur "Enable"

## Étape 2: Créer les identifiants OAuth 2.0

1. Aller dans "APIs & Services" > "Credentials"
2. Cliquer sur "Create Credentials" > "OAuth client ID"
3. Si c'est la première fois, configurer l'écran de consentement OAuth :
   - Choisir "External" (ou "Internal" si vous avez Google Workspace)
   - Remplir les informations requises
   - Ajouter votre email comme test user
   - Sauvegarder
4. Créer l'OAuth client ID :
   - Type d'application : "Web application"
   - Nom : "Mirror Effect Admin"
   - URI de redirection autorisés : 
     - Pour développement local : `http://localhost:3000/api/auth/google/callback`
     - Pour production : `https://votre-domaine.com/api/auth/google/callback`
   - Cliquer sur "Create"
5. **Copier le Client ID et Client Secret** (vous en aurez besoin)

## Étape 3: Obtenir le Refresh Token

### Option A: Utiliser le script fourni (recommandé)

Créer un fichier `get-refresh-token.js` à la racine du projet :

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'VOTRE_CLIENT_ID';
const CLIENT_SECRET = 'VOTRE_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
});

console.log('Autorisez cette application en visitant cette URL:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Entrez le code depuis cette page: ', (code) => {
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Erreur lors de la récupération du token', err);
    console.log('Refresh Token:', token.refresh_token);
    rl.close();
  });
});
```

Exécuter :
```bash
npm install googleapis
node get-refresh-token.js
```

### Option B: Utiliser Google OAuth Playground (plus simple)

1. Aller sur [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Cliquer sur l'icône ⚙️ (Settings) en haut à droite
3. Cocher "Use your own OAuth credentials"
4. Entrer votre Client ID et Client Secret
5. Dans la liste de gauche, trouver "Google Sheets API v4"
6. Sélectionner `https://www.googleapis.com/auth/spreadsheets`
7. Cliquer sur "Authorize APIs"
8. Se connecter avec votre compte Google
9. Cliquer sur "Exchange authorization code for tokens"
10. **Copier le Refresh Token** (vous en aurez besoin)

## Étape 4: Partager le Google Sheet

1. Ouvrir votre Google Sheet
2. Cliquer sur "Share" (Partager)
3. Ajouter l'email du compte Google que vous avez utilisé pour obtenir le refresh token
4. Donner les permissions "Editor"

## Étape 5: Configurer les variables d'environnement

Ajouter dans `.env.local` ou dans les variables d'environnement Vercel :

```bash
# ID du Google Sheet (trouvable dans l'URL)
GOOGLE_SHEETS_SPREADSHEET_ID=votre_spreadsheet_id

# OAuth 2.0 Credentials
GOOGLE_SHEETS_CLIENT_ID=votre_client_id
GOOGLE_SHEETS_CLIENT_SECRET=votre_client_secret
GOOGLE_SHEETS_REFRESH_TOKEN=votre_refresh_token
```

## Avantages de OAuth 2.0

- ✅ Pas besoin de service account keys (plus sécurisé)
- ✅ Fonctionne même si votre organisation bloque les service account keys
- ✅ Plus facile à révoquer (via Google Cloud Console)
- ✅ Meilleur pour les environnements avec restrictions de sécurité

## Dépannage

- **Erreur "invalid_grant"** : Le refresh token a expiré ou été révoqué. Obtenir un nouveau refresh token.
- **Erreur "access_denied"** : Vérifier que le compte Google a bien accès au Google Sheet.
- **Erreur "insufficient permissions"** : Vérifier que le scope `https://www.googleapis.com/auth/spreadsheets` est bien configuré.
