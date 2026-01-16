/**
 * ==========================================================================
 * FONCTIONS À AJOUTER DANS VOTRE App.gs EXISTANT
 * ==========================================================================
 * 
 * Ajoutez ces fonctions dans votre fichier App.gs existant
 * pour permettre l'intégration avec votre application Next.js
 */

/**
 * Actions pour l'intégration Next.js / Admin
 * Supporte: readSheet, appendRow, updateRow, deleteRow
 */
function handleAdminActions_(body) {
  const action = body.action;
  const data = body.data || {};
  const key = body.key;

  // ✅ Vérification de la clé secrète (utilisez votre clé existante)
  const ADMIN_KEY = 'p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7'; // Votre clé existante
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
      
    case 'updateRowByEventId':
      // Nouvelle action pour mettre à jour par Event ID avec mapping de colonnes
      return updateRowByEventIdForAdmin_(sh, head, data.eventId, data.values);
      
    case 'updateRowByCompositeKey':
      // Nouvelle action pour mettre à jour par clé composite (month + name)
      return updateRowByCompositeKeyForAdmin_(sh, head, data.sheetName, data.key1, data.key1Value, data.key2, data.key2Value, data.values);
      
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
  // Support pour "Events" (nouvelle feuille) ou "Clients" (feuille existante)
  if (sheetName === 'Events') {
    // Si vous créez une nouvelle feuille "Events", utilisez-la
    const ss = SpreadsheetApp.openById(SS_ID);
    const eventsSheet = ss.getSheetByName('Events');
    if (!eventsSheet) {
      return { error: 'Sheet "Events" not found. Please create it first.' };
    }
    const eventsVals = eventsSheet.getDataRange().getValues();
    const eventsHead = eventsVals.shift().map(h => String(h).trim());
    return { values: [eventsHead, ...eventsVals] };
  }
  
  // Sinon, utilisez la feuille "Clients" existante
  if (sheetName !== 'Clients') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  // Retourne toutes les lignes (y compris l'en-tête)
  return { values: [head, ...vals] };
}

/**
 * Ajoute une ligne à la fin
 */
function appendRowForAdmin_(sh, head, sheetName, values) {
  if (sheetName === 'Events') {
    const ss = SpreadsheetApp.openById(SS_ID);
    let eventsSheet = ss.getSheetByName('Events');
    if (!eventsSheet) {
      // Créer la feuille si elle n'existe pas
      eventsSheet = ss.insertSheet('Events');
      // Ajouter les en-têtes (vous devrez adapter selon votre structure)
      eventsSheet.appendRow(['ID', 'Date Event', 'Type Event', 'Langue', 'Nom Client', 'Email Client', 'Téléphone Client', 'Adresse', 'Pack ID', 'Total (€)', 'Transport (€)', 'Acompte (€)', 'Solde (€)', 'Statut', 'Étudiant', 'Heures Étudiant', 'Taux Étudiant (€/h)', 'KM Aller', 'KM Total', 'Coût Essence (€)', 'Commercial', 'Commission Commerciale (€)', 'Marge Brute (€)', 'Ref Facture Acompte', 'Ref Facture Solde', 'Acompte Payé', 'Solde Payé', 'Date Closing']);
    }
    eventsSheet.appendRow(values);
    return { success: true };
  }
  
  if (sheetName !== 'Clients') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  sh.appendRow(values);
  return { success: true };
}

/**
 * Met à jour une ligne par ID (colonne A ou Event ID pour Clients)
 */
function updateRowForAdmin_(sh, head, sheetName, id, values) {
  let targetSheet = sh;
  
  if (sheetName === 'Events') {
    const ss = SpreadsheetApp.openById(SS_ID);
    targetSheet = ss.getSheetByName('Events');
    if (!targetSheet) {
      return { error: 'Sheet "Events" not found' };
    }
  } else if (sheetName !== 'Clients') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  const vals = targetSheet.getDataRange().getValues();
  const headRow = vals.shift().map(String);
  const dataRows = vals;
  
  // Pour "Clients", chercher par "Event ID" au lieu de la première colonne
  let rowIndex = -1;
  if (sheetName === 'Clients') {
    const eventIdIdx = headRow.findIndex(h => h === 'Event ID');
    if (eventIdIdx >= 0) {
      rowIndex = dataRows.findIndex(row => String(row[eventIdIdx]) === String(id));
    }
  } else {
    // Pour "Events", chercher dans la première colonne
    rowIndex = dataRows.findIndex(row => String(row[0]) === String(id));
  }
  
  if (rowIndex === -1) {
    // Ligne non trouvée, on l'ajoute
    targetSheet.appendRow([id, ...values]);
    return { success: true, action: 'appended' };
  }
  
  // Mettre à jour la ligne (rowIndex + 2 car on a enlevé l'en-tête et Sheets est 1-indexed)
  const rowNum = rowIndex + 2;
  const range = targetSheet.getRange(rowNum, 1, 1, values.length + 1);
  range.setValues([[id, ...values]]);
  
  return { success: true, action: 'updated' };
}

/**
 * Met à jour une ligne de "Clients" par Event ID avec un objet de valeurs
 * (Les colonnes sont mappées par nom, pas par position)
 */
function updateRowByEventIdForAdmin_(sh, head, eventId, values) {
  const vals = sh.getDataRange().getValues();
  const headRow = vals.shift().map(String);
  const dataRows = vals;
  
  // Trouver la colonne "Event ID"
  const eventIdIdx = headRow.findIndex(h => h === 'Event ID');
  if (eventIdIdx < 0) {
    return { error: 'Column "Event ID" not found' };
  }
  
  // Trouver la ligne
  const rowIndex = dataRows.findIndex(row => String(row[eventIdIdx]) === String(eventId));
  if (rowIndex === -1) {
    return { error: 'Event ID not found: ' + eventId };
  }
  
  const rowNum = rowIndex + 2; // +2 car on a enlevé l'en-tête et Sheets est 1-indexed
  
  // Mettre à jour chaque colonne spécifiée
  for (const [colName, value] of Object.entries(values)) {
    const colIdx = headRow.findIndex(h => h === colName);
    if (colIdx >= 0) {
      sh.getRange(rowNum, colIdx + 1).setValue(value);
    }
  }
  
  return { success: true, action: 'updated' };
}

/**
 * Met à jour une ligne par clé composite (ex: month + student_name)
 */
function updateRowByCompositeKeyForAdmin_(sh, head, sheetName, key1, key1Value, key2, key2Value, values) {
  let targetSheet = sh;
  
  if (sheetName === 'Students' || sheetName === 'Commercial' || sheetName === 'Stats') {
    const ss = SpreadsheetApp.openById(SS_ID);
    targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      return { error: 'Sheet "' + sheetName + '" not found' };
    }
  } else if (sheetName !== 'Clients') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  const vals = targetSheet.getDataRange().getValues();
  const headRow = vals.shift().map(String);
  const dataRows = vals;
  
  // Trouver les indices des colonnes clés
  const key1Idx = headRow.findIndex(h => h === key1);
  const key2Idx = headRow.findIndex(h => h === key2);
  
  if (key1Idx < 0 || key2Idx < 0) {
    return { error: 'Keys not found: ' + key1 + ' or ' + key2 };
  }
  
  // Trouver la ligne
  const rowIndex = dataRows.findIndex(row => 
    String(row[key1Idx]) === String(key1Value) && String(row[key2Idx]) === String(key2Value)
  );
  
  // Construire le tableau de valeurs dans l'ordre des colonnes
  const valuesArray = headRow.map(header => {
    if (header === key1) return key1Value;
    if (header === key2) return key2Value;
    return values[header] !== undefined ? values[header] : '';
  });
  
  if (rowIndex === -1) {
    // Ligne non trouvée, on l'ajoute
    targetSheet.appendRow(valuesArray);
    return { success: true, action: 'appended' };
  }
  
  // Mettre à jour la ligne
  const rowNum = rowIndex + 2;
  const range = targetSheet.getRange(rowNum, 1, 1, headRow.length);
  range.setValues([valuesArray]);
  
  return { success: true, action: 'updated' };
}

/**
 * Supprime une ligne par ID (Event ID pour Clients)
 */
function deleteRowForAdmin_(sh, head, sheetName, id) {
  let targetSheet = sh;
  
  if (sheetName === 'Events') {
    const ss = SpreadsheetApp.openById(SS_ID);
    targetSheet = ss.getSheetByName('Events');
    if (!targetSheet) {
      return { error: 'Sheet "Events" not found' };
    }
  } else if (sheetName !== 'Clients') {
    return { error: 'Sheet not found: ' + sheetName };
  }
  
  const vals = targetSheet.getDataRange().getValues();
  const headRow = vals.shift().map(String);
  const dataRows = vals;
  
  // Pour "Clients", chercher par "Event ID"
  let rowIndex = -1;
  if (sheetName === 'Clients') {
    const eventIdIdx = headRow.findIndex(h => h === 'Event ID');
    if (eventIdIdx >= 0) {
      rowIndex = dataRows.findIndex(row => String(row[eventIdIdx]) === String(id));
    }
  } else {
    // Pour "Events", chercher dans la première colonne
    rowIndex = dataRows.findIndex(row => String(row[0]) === String(id));
  }
  
  if (rowIndex === -1) {
    return { success: true, action: 'not_found' };
  }
  
  // Supprimer la ligne (rowIndex + 2 car Sheets est 1-indexed et on a l'en-tête)
  const rowNum = rowIndex + 2;
  targetSheet.deleteRow(rowNum);
  
  return { success: true, action: 'deleted' };
}

/**
 * ==========================================================================
 * MODIFICATION DE VOTRE doPost EXISTANT
 * ==========================================================================
 * 
 * Ajoutez ceci AU DÉBUT de votre fonction doPost existante :
 */

/*
function doPost(e){
  try {
    // 🔹 1. Parse JSON si présent
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch(_) {}
    }

    // ✅ NOUVEAU : Actions Admin (Next.js) - AJOUTEZ CETTE SECTION
    if (body.action && (body.action === 'readSheet' || body.action === 'appendRow' || 
        body.action === 'updateRow' || body.action === 'updateRowByEventId' || 
        body.action === 'updateRowByCompositeKey' || body.action === 'deleteRow')) {
      const result = handleAdminActions_(body);
      return _json(result.error ? { error: result.error } : { data: result });
    }

    // 🔹 2. MANYCHAT — CHECK DATE AVAILABILITY (votre code existant)
    if (body.action === "availability" && body.date) {
      return _json(ME_checkAvailabilityClientsConfirmed_(body.date));
    }

    // 🔹 3. LOGIQUE EXISTANTE (le reste de votre code doPost actuel)
    const p = e.parameter || {};
    const key = String(p.key || '');
    // ... reste de votre code ...
    
  } catch(err){
    return _json({ ok:false, error:String(err) });
  }
}
*/
