/**
 * Google Apps Script — Sync "Clients" sheet → Supabase via webhook
 *
 * Installation :
 * 1. Ouvrir le Google Sheet → Extensions → Apps Script
 * 2. Coller ce code
 * 3. Ajouter les propriétés du script :
 *    - WEBHOOK_URL = https://mirroreffect.co/api/webhooks/sheets  (ou localhost pour dev)
 *    - WEBHOOK_SECRET = (même valeur que SHEETS_WEBHOOK_SECRET dans .env)
 * 4. Ajouter un trigger : onEdit ou onChange sur la feuille "Clients"
 *    → Exécuter > Déclencheurs > Ajouter > onSheetEdit > À la modification
 */

// ─── Config ──────────────────────────────────────────────────────────────────

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    webhookUrl: props.getProperty("WEBHOOK_URL"),
    secret: props.getProperty("WEBHOOK_SECRET"),
    sheetName: "Clients"
  };
}

// ─── Trigger principal ──────────────────────────────────────────────────────

/**
 * Se déclenche à chaque modification du sheet.
 * Envoie la ligne modifiée vers le webhook Supabase.
 */
function onSheetEdit(e) {
  var config = getConfig();

  if (!config.webhookUrl || !config.secret) {
    Logger.log("WEBHOOK_URL ou WEBHOOK_SECRET non configuré. Aller dans Propriétés du script.");
    return;
  }

  var sheet = e.source.getActiveSheet();

  // Ignorer les modifications hors de la feuille "Clients"
  if (sheet.getName() !== config.sheetName) return;

  var range = e.range;
  var row = range.getRow();

  // Ignorer la ligne d'en-tête
  if (row <= 1) return;

  // Récupérer les headers (ligne 1)
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Construire l'objet clé-valeur
  var rowObj = {};
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString().trim();
    if (header) {
      var value = rowData[i];
      // Convertir les dates en string
      if (value instanceof Date) {
        var d = value;
        var day = ("0" + d.getDate()).slice(-2);
        var month = ("0" + (d.getMonth() + 1)).slice(-2);
        var year = d.getFullYear();
        value = day + "/" + month + "/" + year;
      }
      rowObj[header] = value !== null && value !== undefined ? value.toString() : "";
    }
  }

  // Vérifier qu'il y a au moins un nom ou email (pas une ligne vide)
  if (!rowObj["Nom"] && !rowObj["Email"]) {
    Logger.log("Ligne " + row + " ignorée : pas de Nom ni Email");
    return;
  }

  // Envoyer au webhook
  var payload = JSON.stringify({
    secret: config.secret,
    row: rowObj,
    sheetRow: row
  });

  var options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(config.webhookUrl, options);
    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code === 200) {
      Logger.log("✓ Ligne " + row + " sync OK: " + body);
    } else {
      Logger.log("✗ Ligne " + row + " erreur " + code + ": " + body);
    }
  } catch (err) {
    Logger.log("✗ Ligne " + row + " exception: " + err.toString());
  }
}

// ─── Sync manuelle (toutes les lignes) ──────────────────────────────────────

/**
 * Sync toutes les lignes de "Clients" vers Supabase.
 * Utile pour un import initial ou resync complet.
 * Exécuter manuellement depuis Apps Script.
 */
function syncAllRows() {
  var config = getConfig();

  if (!config.webhookUrl || !config.secret) {
    Logger.log("WEBHOOK_URL ou WEBHOOK_SECRET non configuré.");
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheetName);
  if (!sheet) {
    Logger.log("Feuille '" + config.sheetName + "' introuvable.");
    return;
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  var success = 0;
  var errors = 0;

  for (var r = 0; r < data.length; r++) {
    var rowObj = {};
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i].toString().trim();
      if (header) {
        var value = data[r][i];
        if (value instanceof Date) {
          var d = value;
          var day = ("0" + d.getDate()).slice(-2);
          var month = ("0" + (d.getMonth() + 1)).slice(-2);
          var year = d.getFullYear();
          value = day + "/" + month + "/" + year;
        }
        rowObj[header] = value !== null && value !== undefined ? value.toString() : "";
      }
    }

    // Ignorer les lignes vides
    if (!rowObj["Nom"] && !rowObj["Email"]) continue;

    var payload = JSON.stringify({
      secret: config.secret,
      row: rowObj,
      sheetRow: r + 2
    });

    try {
      var response = UrlFetchApp.fetch(config.webhookUrl, {
        method: "post",
        contentType: "application/json",
        payload: payload,
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        success++;
      } else {
        errors++;
        Logger.log("Erreur ligne " + (r + 2) + ": " + response.getContentText());
      }
    } catch (err) {
      errors++;
      Logger.log("Exception ligne " + (r + 2) + ": " + err.toString());
    }

    // Pause 200ms pour éviter rate limiting
    Utilities.sleep(200);
  }

  Logger.log("Sync terminée: " + success + " OK, " + errors + " erreurs sur " + data.length + " lignes.");
}
