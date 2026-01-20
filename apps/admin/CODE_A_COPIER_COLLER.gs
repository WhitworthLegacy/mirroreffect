/**
 * ==========================================================================
 * CODE COMPLET À COPIER-COLLER DANS VOTRE App.gs
 * ==========================================================================
 * 
 * 1. Remplacez votre fonction handleAdminActions_ existante par celle-ci
 * 2. Remplacez votre fonction readSheetForAdmin_ existante par celle-ci
 * 3. Ajoutez les 2 nouvelles fonctions : updateRowByEventIdForAdmin_ et updateRowByCompositeKeyForAdmin_
 * 4. Modifiez votre doPost pour inclure les 2 nouvelles actions (voir en bas)
 *

/**
 * Actions pour l'intégration Next.js / Admin
 * Supporte: readSheet, appendRow, updateRow, updateRowByEventId, updateRowByCompositeKey, deleteRow
 */
function handleAdminActions_(body) {
  const action = body.action;
  const data = body.data || {};
  const key = body.key;

  // ✅ Vérification de la clé secrète (utilisez votre clé existante)
  const ADMIN_KEY = 'p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7'; // Votre clé existante
  if (!key || key !== ADMIN_KEY) {
    return { error: 'Invalid key. Expected: ' + ADMIN_KEY.substring(0, 10) + '... Received: ' + (key ? key.substring(0, 10) + '...' : 'undefined') };
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
 * Supporte: Clients, Stats, Students, Commercial
 */
function readSheetForAdmin_(sh, head, vals, sheetName) {
  const ss = SpreadsheetApp.openById(SS_ID);
  
  // Si c'est "Clients", utiliser la feuille existante
  if (sheetName === 'Clients') {
    return { values: [head, ...vals] };
  }
  
  // Pour les autres feuilles (Stats, Students, Commercial)
  const targetSheet = ss.getSheetByName(sheetName);
  if (!targetSheet) {
    return { error: 'Sheet "' + sheetName + '" not found' };
  }
  
  const targetVals = targetSheet.getDataRange().getValues();
  const targetHead = targetVals.shift().map(h => String(h).trim());
  const targetData = targetVals;
  
  return { values: [targetHead, ...targetData] };
}

/**
 * Ajoute une ligne à la fin
 * Supporte values comme objet {header: value} ou comme array
 */
function appendRowForAdmin_(sh, head, sheetName, values) {
  const ss = SpreadsheetApp.openById(SS_ID);

  // Déterminer la feuille cible
  let targetSheet;
  if (sheetName === 'Clients') {
    targetSheet = sh;
  } else {
    targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      return { error: 'Sheet "' + sheetName + '" not found' };
    }
  }

  // Lire les headers de la feuille cible
  const targetHeaders = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

  // Idempotency checks pour Payments, Clients, Notifications
  if (sheetName === 'Payments' || sheetName === 'Clients' || sheetName === 'Notifications') {
    const existingData = targetSheet.getDataRange().getValues();
    const existingHeaders = existingData[0].map(h => String(h).trim());
    const existingRows = existingData.slice(1);

    if (sheetName === 'Payments') {
      // Check if Payment ID already exists
      const paymentIdIdx = existingHeaders.indexOf('Payment ID');
      if (paymentIdIdx >= 0) {
        const incomingPaymentId = typeof values === 'object' && !Array.isArray(values)
          ? values['Payment ID']
          : (Array.isArray(values) ? values[paymentIdIdx] : null);
        if (incomingPaymentId) {
          const exists = existingRows.some(row => String(row[paymentIdIdx]).trim() === String(incomingPaymentId).trim());
          if (exists) {
            return { success: true, action: 'skipped', reason: 'Payment ID already exists: ' + incomingPaymentId };
          }
        }
      }
    }

    if (sheetName === 'Clients') {
      // Check if Event ID already exists
      const eventIdIdx = existingHeaders.indexOf('Event ID');
      if (eventIdIdx >= 0) {
        const incomingEventId = typeof values === 'object' && !Array.isArray(values)
          ? values['Event ID']
          : (Array.isArray(values) ? values[eventIdIdx] : null);
        if (incomingEventId) {
          const exists = existingRows.some(row => String(row[eventIdIdx]).trim() === String(incomingEventId).trim());
          if (exists) {
            return { success: true, action: 'skipped', reason: 'Event ID already exists: ' + incomingEventId };
          }
        }
      }
    }

    if (sheetName === 'Notifications') {
      // Check if (Event ID, Template) pair already exists
      const eventIdIdx = existingHeaders.indexOf('Event ID');
      const templateIdx = existingHeaders.indexOf('Template');
      if (eventIdIdx >= 0 && templateIdx >= 0) {
        const incomingEventId = typeof values === 'object' && !Array.isArray(values)
          ? values['Event ID']
          : (Array.isArray(values) ? values[eventIdIdx] : null);
        const incomingTemplate = typeof values === 'object' && !Array.isArray(values)
          ? values['Template']
          : (Array.isArray(values) ? values[templateIdx] : null);
        if (incomingEventId && incomingTemplate) {
          const exists = existingRows.some(row =>
            String(row[eventIdIdx]).trim() === String(incomingEventId).trim() &&
            String(row[templateIdx]).trim() === String(incomingTemplate).trim()
          );
          if (exists) {
            return { success: true, action: 'skipped', reason: 'Notification already exists: ' + incomingEventId + ' / ' + incomingTemplate };
          }
        }
      }
    }
  }

  // Si values est un objet (keyed by headers), le convertir en array
  let rowArray;
  if (typeof values === 'object' && !Array.isArray(values)) {
    // Map object keys to column positions based on target sheet headers
    rowArray = targetHeaders.map(header => {
      return values[header] !== undefined ? values[header] : '';
    });
  } else if (Array.isArray(values)) {
    rowArray = values;
  } else {
    return { error: 'Invalid values format: expected object or array' };
  }

  targetSheet.appendRow(rowArray);
  return { success: true, action: 'appended' };
}

/**
 * Met à jour une ligne par ID (colonne A ou Event ID pour Clients)
 */
function updateRowForAdmin_(sh, head, sheetName, id, values) {
  const ss = SpreadsheetApp.openById(SS_ID);
  let targetSheet = sh;
  
  if (sheetName !== 'Clients') {
    targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      return { error: 'Sheet "' + sheetName + '" not found' };
    }
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
    // Pour les autres feuilles, chercher dans la première colonne
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
 * Supporte: Stats, Students, Commercial
 */
function updateRowByCompositeKeyForAdmin_(sh, head, sheetName, key1, key1Value, key2, key2Value, values) {
  const ss = SpreadsheetApp.openById(SS_ID);
  let targetSheet = sh;
  
  if (sheetName === 'Students' || sheetName === 'Commercial' || sheetName === 'Stats') {
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
  const ss = SpreadsheetApp.openById(SS_ID);
  let targetSheet = sh;
  
  if (sheetName !== 'Clients') {
    targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      return { error: 'Sheet "' + sheetName + '" not found' };
    }
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
    // Pour les autres feuilles, chercher dans la première colonne
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
 * MODIFICATION DE VOTRE doPost
 * ==========================================================================
 * 
 * Dans votre fonction doPost existante (ligne ~500), remplacez cette partie :
 * 
 * AVANT :
 * if (body.action && (body.action === 'readSheet' || body.action === 'appendRow' || 
 *     body.action === 'updateRow' || body.action === 'deleteRow')) {
 * 
 * APRÈS :
 * if (body.action && (body.action === 'readSheet' || body.action === 'appendRow' || 
 *     body.action === 'updateRow' || body.action === 'updateRowByEventId' || 
 *     body.action === 'updateRowByCompositeKey' || body.action === 'deleteRow')) {
 * 
 * C'est tout ! Le reste de votre doPost reste identique.
 */
