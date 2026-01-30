/**
 * Script pour obtenir un refresh token Google OAuth 2.0
 * 
 * Usage:
 * 1. Installer: npm install googleapis
 * 2. Modifier CLIENT_ID et CLIENT_SECRET ci-dessous
 * 3. Exécuter: node scripts/get-google-refresh-token.js
 */

const { google } = require('googleapis');
const readline = require('readline');

// ⚠️ REMPLACER PAR VOS VRAIES VALEURS
const CLIENT_ID = 'VOTRE_CLIENT_ID.apps.googleusercontent.com';
const CLIENT_SECRET = 'VOTRE_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Important pour obtenir un refresh token
  scope: SCOPES,
  prompt: 'consent', // Force la demande de consentement pour obtenir le refresh token
});

console.log('\n🔗 Autorisez cette application en visitant cette URL:\n');
console.log(authUrl);
console.log('\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('📋 Entrez le code depuis cette page (après autorisation): ', (code) => {
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error('❌ Erreur lors de la récupération du token:', err.message);
      rl.close();
      return;
    }
    
    console.log('\n✅ Succès! Voici vos tokens:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('REFRESH TOKEN (à copier dans vos variables d\'environnement):');
    console.log(token.refresh_token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (token.access_token) {
      console.log('Access Token (valide 1h, sera régénéré automatiquement):');
      console.log(token.access_token.substring(0, 50) + '...');
      console.log('');
    }
    
    console.log('📝 Ajoutez ces variables dans votre .env.local ou Vercel:');
    console.log(`GOOGLE_SHEETS_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_SHEETS_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_SHEETS_REFRESH_TOKEN=${token.refresh_token}`);
    console.log('');
    
    rl.close();
  });
});
