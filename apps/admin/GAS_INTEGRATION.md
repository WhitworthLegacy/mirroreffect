# Intégration avec votre Google Apps Script existant

Votre GAS existant gère déjà beaucoup de choses. On va ajouter les fonctions nécessaires pour notre intégration.

## Actions à ajouter dans votre App.gs

Ajoutez ces fonctions dans votre fichier `App.gs` :

```javascript
/**
 * Actions pour l'intégration Next.js / Admin
 * Supporte: readSheet, appendRow, updateRow, deleteRow
 */
function handleAdminActions_(body) {
  const action = body.action;
  const data = body.data || {};
  const key = body.key;

  // ✅ Vérification de la clé secrète
  const ADMIN_KEY = 'p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7'; // Utilisez la même clé que votre doPost existant
  if (key !== ADMIN_KEY) {
    return { error: 'Unauthorized' };
  }

  const sh = _sheet(); // Votre fonction existante qui retourne la feuille "Clients"
  const range = sh.getDataRange();
  const vals = range.getValues();
  const head = vals.shift().map(h => String(h).trim());

  switch (action) {
    case 'readSheet':
      return readSheetForAdmin_(sh, head, vals, data.sheetName);
      
    case 'appendRow':
      return appendRowForAdmin_(sh, head, data.sheetName, data.values);
      
    case 'updateRow':
      return updateRowForAdmin_(sh, head, data.sheetName, data.id, data.values);
      
    case 'deleteRow':
      return deleteRowForAdmin_(sh, head, data.sheetName, data.id);
      
    default:
      return { error: 'Unknown action: ' + action };
  }
}

/**
 * Lit toutes les lignes d'une feuille
 */
function readSheetForAdmin_(sh, head, vals, sheetName) {
  // Votre sheet s'appelle "Clients", on vérifie si c'est bien ça
  if (sheetName !== 'Clients' && sheetName !== 'Events') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  // Retourne toutes les lignes (y compris l'en-tête)
  return { values: [head, ...vals] };
}

/**
 * Ajoute une ligne à la fin
 */
function appendRowForAdmin_(sh, head, sheetName, values) {
  if (sheetName !== 'Clients' && sheetName !== 'Events') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  sh.appendRow(values);
  return { success: true };
}

/**
 * Met à jour une ligne par ID (colonne A)
 */
function updateRowForAdmin_(sh, head, sheetName, id, values) {
  if (sheetName !== 'Clients' && sheetName !== 'Events') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  const vals = sh.getDataRange().getValues();
  const headRow = vals.shift().map(String);
  const dataRows = vals;
  
  // Chercher la ligne par ID (première colonne)
  const rowIndex = dataRows.findIndex(row => String(row[0]) === String(id));
  
  if (rowIndex === -1) {
    // Ligne non trouvée, on l'ajoute
    sh.appendRow([id, ...values]);
    return { success: true, action: 'appended' };
  }
  
  // Mettre à jour la ligne (rowIndex + 2 car on a enlevé l'en-tête et Sheets est 1-indexed)
  const rowNum = rowIndex + 2;
  const range = sh.getRange(rowNum, 1, 1, values.length + 1);
  range.setValues([[id, ...values]]);
  
  return { success: true, action: 'updated' };
}

/**
 * Supprime une ligne par ID
 */
function deleteRowForAdmin_(sh, head, sheetName, id) {
  if (sheetName !== 'Clients' && sheetName !== 'Events') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  const vals = sh.getDataRange().getValues();
  const dataRows = vals.slice(1); // Enlever l'en-tête
  
  const rowIndex = dataRows.findIndex(row => String(row[0]) === String(id));
  
  if (rowIndex === -1) {
    return { success: true, action: 'not_found' };
  }
  
  // Supprimer la ligne (rowIndex + 2 car Sheets est 1-indexed et on a l'en-tête)
  const rowNum = rowIndex + 2;
  sh.deleteRow(rowNum);
  
  return { success: true, action: 'deleted' };
}
```

## Modifier votre doPost existant

Ajoutez ceci au début de votre `doPost` :

```javascript
function doPost(e){
  try {
    // 🔹 1. Parse JSON si présent
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch(_) {}
    }

    // ✅ NOUVEAU : Actions Admin (Next.js)
    if (body.action && (body.action === 'readSheet' || body.action === 'appendRow' || 
        body.action === 'updateRow' || body.action === 'deleteRow')) {
      const result = handleAdminActions_(body);
      return _json(result.error ? { error: result.error } : { data: result });
    }

    // 🔹 2. MANYCHAT — CHECK DATE AVAILABILITY (votre code existant)
    if (body.action === "availability" && body.date) {
      return _json(ME_checkAvailabilityClientsConfirmed_(body.date));
    }

    // 🔹 3. LOGIQUE EXISTANTE (votre code actuel)
    // ... reste de votre code doPost ...
    
  } catch(err){
    return _json({ ok:false, error:String(err) });
  }
}
```

## Mapping des colonnes

Votre feuille "Clients" a des colonnes différentes de ce que notre app attend. Il faut créer une feuille "Events" séparée OU mapper les colonnes.

**Option 1 : Créer une feuille "Events" séparée** (recommandé)
- Créez une nouvelle feuille dans votre Google Sheet appelée "Events"
- Avec les colonnes dans l'ordre attendu (voir GOOGLE_APPS_SCRIPT_SETUP.md)

**Option 2 : Mapper les colonnes de "Clients" vers le format "Events"**
- On adaptera le code pour mapper vos colonnes existantes

Quelle option préférez-vous ?
