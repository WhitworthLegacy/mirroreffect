# Configuration Google Apps Script (GAS)

**Méthode la plus simple** : Utiliser Google Apps Script comme proxy pour accéder à Google Sheets. Pas besoin de gérer OAuth, Service Account, ou API keys !

## Avantages

- ✅ Pas besoin de credentials complexes (OAuth, Service Account, etc.)
- ✅ Le script GAS a déjà accès au Google Sheet
- ✅ Plus simple à configurer
- ✅ Pas de problèmes d'authentification

## Étape 1: Créer le Google Apps Script

1. Ouvrir votre Google Sheet
2. Aller dans **Extensions** > **Apps Script**
3. Coller ce code :

```javascript
// Configuration
const SECRET_KEY = 'VOTRE_CLE_SECRETE'; // Changez cette valeur !
const SPREADSHEET_ID = 'VOTRE_SPREADSHEET_ID'; // Optionnel si le script est lié au sheet

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    
    // Vérification de la clé secrète
    if (request.key !== SECRET_KEY) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Unauthorized'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = request.action;
    const data = request.data || {};
    
    // Ouvrir le spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
    
    let result;
    
    switch (action) {
      case 'readSheet':
        result = readSheet(ss, data.sheetName);
        break;
        
      case 'appendRow':
        result = appendRow(ss, data.sheetName, data.values);
        break;
        
      case 'updateRow':
        result = updateRow(ss, data.sheetName, data.id, data.values);
        break;
        
      case 'deleteRow':
        result = deleteRow(ss, data.sheetName, data.id);
        break;
        
      default:
        throw new Error('Unknown action: ' + action);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function readSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  return { values: data };
}

function appendRow(ss, sheetName, values) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  sheet.appendRow(values);
  return { success: true };
}

function updateRow(ss, sheetName, id, values) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === id);
  
  if (rowIndex === -1) {
    // Row not found, append it
    sheet.appendRow([id, ...values]);
    return { success: true, action: 'appended' };
  }
  
  // Update the row (rowIndex + 1 because Sheets is 1-indexed)
  const rowNum = rowIndex + 1;
  const range = sheet.getRange(rowNum, 1, 1, values.length + 1);
  range.setValues([[id, ...values]]);
  
  return { success: true, action: 'updated' };
}

function deleteRow(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === id);
  
  if (rowIndex === -1) {
    return { success: true, action: 'not_found' };
  }
  
  // Delete the row (rowIndex + 1 because Sheets is 1-indexed, +1 to skip header)
  const rowNum = rowIndex + 1;
  sheet.deleteRow(rowNum);
  
  return { success: true, action: 'deleted' };
}
```

4. **Modifier `SECRET_KEY`** avec une clé secrète de votre choix (ex: `mon-super-secret-2024`)
5. Si le script n'est pas lié au Google Sheet, modifier `SPREADSHEET_ID` avec l'ID de votre sheet

## Étape 2: Déployer comme Web App

1. Cliquer sur **Deploy** > **New deployment**
2. Cliquer sur l'icône ⚙️ à côté de "Select type"
3. Choisir **Web app**
4. Configuration :
   - **Description** : "Mirror Effect Google Sheets API"
   - **Execute as** : "Me" (votre compte)
   - **Who has access** : "Anyone" (le script vérifie la clé secrète)
5. Cliquer sur **Deploy**
6. **Autoriser les permissions** quand demandé
7. **Copier l'URL du Web App** (ex: `https://script.google.com/macros/s/.../exec`)

## Étape 3: Configurer les variables d'environnement

Ajouter dans Vercel :

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=votre_spreadsheet_id
GAS_WEBAPP_URL=https://script.google.com/macros/s/VOTRE_SCRIPT_ID/exec
GAS_KEY=mon-super-secret-2024
```

## Structure du Google Sheet

Votre Google Sheet doit avoir une feuille **"Events"** avec ces colonnes (dans l'ordre) :
1. ID (colonne A)
2. Date Event
3. Type Event
4. Langue
5. Nom Client
6. Email Client
7. Téléphone Client
8. Adresse
9. Pack ID
10. Total (€)
11. Transport (€)
12. Acompte (€)
13. Solde (€)
14. Statut
15. Étudiant
16. Heures Étudiant
17. Taux Étudiant (€/h)
18. KM Aller
19. KM Total
20. Coût Essence (€)
21. Commercial
22. Commission Commerciale (€)
23. Marge Brute (€)
24. Ref Facture Acompte
25. Ref Facture Solde
26. Acompte Payé (TRUE/FALSE)
27. Solde Payé (TRUE/FALSE)
28. Date Closing

Et une feuille **"Stats"** pour les statistiques mensuelles.

## Test

Une fois configuré, testez en créant un event via l'interface admin. Il devrait apparaître dans votre Google Sheet !
