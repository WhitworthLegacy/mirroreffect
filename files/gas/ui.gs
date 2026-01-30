// ui.gs

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('MirrorEffect')
    .addItem('Pousser ligne courante → Agenda', 'ME_pushActiveRow')
    .addItem('Resynchroniser TOUT', 'ME_resyncAll')
    .addItem('Installer/Reset triggers', 'ME_installTriggers')
    .addItem('▶ Traiter toutes les factures (batch)', 'ME_processInvoicesBatchMenu')
    .addSeparator()
    .addItem('✉️ Envoyer mail confirmation (ligne sélectionnée)', 'ME_sendConfirmationActiveRow')
    .addToUi();
}

function ME_getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function ME_getHeaderIndexMap_() {
  const sh = ME_getSheet_();
  const head = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  const map = {};
  head.forEach((h,i)=> map[h] = i+1);
  return map;
}

function ME_getActiveRowOrNull_() {
  const range = SpreadsheetApp.getActiveRange();
  return (range && range.getRow() >= 2) ? range.getRow() : null;
}

function ME_pushActiveRow() {
  const ui = SpreadsheetApp.getUi();
  const row = ME_getActiveRowOrNull_();
  if (!row) { ui.alert('Sélectionnez une ligne.'); return; }
  
  try {
    const res = ME_upsertCalendarForRow_(ME_getSheet_(), row, ME_getHeaderIndexMap_());
    ui.alert(res?.message || 'OK');
  } catch (e) { ui.alert('Erreur: ' + e); }
}

function ME_resyncAll() {
  const sh = ME_getSheet_();
  const cols = ME_getHeaderIndexMap_();
  const last = sh.getLastRow();
  let ok=0;
  for(let r=2; r<=last; r++){
    try { if(ME_upsertCalendarForRow_(sh, r, cols)?.ok) ok++; } catch(e){}
  }
  SpreadsheetApp.getUi().alert(`Terminé. ${ok} lignes traitées.`);
}

// --- TRIGGERS ---
function ME_installTriggers(){
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('ME_onEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('ME_onChange').forSpreadsheet(SpreadsheetApp.getActive()).onChange().create();
  
  // Trigger toutes les 15 min pour synchro agenda
  ScriptApp.newTrigger('ME_periodicSync_').timeBased().everyMinutes(15).create();
  
  // Trigger quotidien (9h) pour les emails post-event
  ScriptApp.newTrigger('checkPostEventTriggers').timeBased().everyDays(1).atHour(9).create();

  SpreadsheetApp.getUi().alert('Tous les triggers ont été installés.');
}



function ME_onEdit(e){
  try{
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    // Vérifications de sécurité
    if (!sh || !e || !e.range || e.range.getSheet().getName() !== SHEET_NAME) return;

    // Map colonnes (1-based)
    const head = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    const cols = {}; head.forEach((h,i)=> cols[h] = i+1);

    const editedCol = e.range.getColumn();
    const row = e.range.getRow();
    if (row < 2) return; // En-tête

    // 1. Si on modifie le LIEU -> Recalculer KM + Coût + Heures
    if (editedCol === cols[COLS.lieu]) {
       const newVenue = e.range.getValue();
       if (newVenue) {
         // Appel à la fonction centrale dans app.gs
         calculateAndSetLogistics_(sh, row, cols, newVenue);
       }
    }

    // 2. Ensuite, on lance la synchro Agenda (comme avant)
    // On vérifie si on a les infos minimales
    const hasAll = sh.getRange(row, cols[COLS.dateEvent]).getValue();
    
    if (hasAll) {
      try{
        const res = ME_upsertCalendarForRow_(sh, row, cols);
        if (res?.ok && cols[COLS.syncStatus]) {
          sh.getRange(row, cols[COLS.syncStatus]).setValue(
            'OK ' + Utilities.formatDate(new Date(), 'Europe/Brussels', 'yyyy-MM-dd HH:mm')
          );
        }
      } catch(err){
        Logger.log(`Row ${row} sync fail: ${err}`);
      }
    }

  } catch(err){
    Logger.log('ME_onEdit error: ' + err);
  }
}


function ME_onChange(e){
  // Sur import/changement de structure, on peut lancer une synchro globale légère
  // ou laisser le periodicSync gérer. Ici on laisse vide pour éviter les timeouts.
}

// ui.gs

function ME_periodicSync_() {
  // 1. D'abord, on vérifie si l'Agenda a été modifié (Synchro INVERSE)
  try {
    checkCalendarUpdates_(); // Fonction dans calendar.gs
  } catch (e) {
    Logger.log("Erreur lors de la vérification Agenda -> Sheet : " + e);
  }

  // 2. Ensuite, on fait la synchro classique (Sheet -> Agenda pour les manquants)
  const sh = ME_getSheet_();
  const cols = ME_getHeaderIndexMap_();
  const last = sh.getLastRow();
  const syncColIdx = cols[COLS.syncStatus];
  
  for(let r=2; r<=last; r++){
    const status = sh.getRange(r, syncColIdx).getValue();
    // Si jamais synchro ou erreur, on force
    if (!String(status).startsWith('OK')) {
       ME_upsertCalendarForRow_(sh, r, cols);
    }
  }
  
  // 3. On lance aussi les triggers Post-Event (mails J+1, M+9...)
  // (Optionnel ici si tu as déjà un trigger dédié à 9h du matin, sinon tu peux l'appeler ici)
  // checkPostEventTriggers(); 
}



function ME_sendConfirmationActiveRow(){
  const ui = SpreadsheetApp.getUi();
  const row = ME_getActiveRowOrNull_();
  if (!row) { ui.alert('Sélectionne une ligne client (>=2).'); return; }

  try {
    sendClientConfirmationForRow_(row);
    ui.alert('✅ Mail de confirmation envoyé (ou déjà envoyé).');
  } catch (e) {
    ui.alert('❌ Erreur: ' + e);
  }
}