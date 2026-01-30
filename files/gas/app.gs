/***** MirrorEffect_Clients – WebApp (doGet/doPost) *****
 * Gestion des Clients, Logistique, Agenda et Post-Event.
 ********************************************************/

const SHEET_NAME = 'Clients';
const TIMEZONE   = 'Europe/Brussels';

// ✅ ADRESSE DE DÉPART FIXE (l'entrepôt pour le calcul des KM) 
const BASE_ADDRESS = "Boulevard Edmond Machtens 119, 1080 Bruxelles, Belgique";

// !!! Les libellés doivent correspondre EXACTEMENT à ta feuille Google Sheets
const COLS = {
  nom:               'Nom',
  email:             'Email',
  phone:             'Phone',
  language:          'Language',
  
  // --- DATES & HEURES ---
  dateForm:          'Date Formulaire',
  dateEvent:         'Date Event',
  heureDebut:        'Heure Début',
  heureFin:          'Heure Fin',
  
  // --- EVENT DETAILS ---
  lieu:              'Lieu Event',       // 👈 Déclencheur du calcul KM
  typeEvent:         'Type Event',
  invites:           'Invités',
  pack:              'Pack',
  
  // --- FINANCIER CLIENT ---
  prixPack:          'Pack (€)',
  transport:         'Transport (€)',    // ⚠️ Facturé au client (fixe)
  supplement:        'Supplément',
  supplementH:       'Supplément (h)',
  supplementEur:     'Supplément (€)',
  dateAcompte:       'Date acompte payé',
  acompte:           'Acompte',
  total:             'Total',
  soldeRestant:      'Solde Restant',
  
  // --- CALCULS INTERNES & RH ---
  etudiant:          'Etudiant',
  heuresEtudiant:    'Heures Etudiant',  // 👈 Calculé : (Temps Aller x 4) + 1h -> Arrondi 0.5 sup
  etudiantEur:       'Etudiant €/Event',
  kmAller:           'KM (Aller)',       // 👈 Calculé via Maps
  kmTotal:           'KM (Total)',       // 👈 Calculé : Aller x 4
  coutEssence:       'Coût Essence',     // 👈 Calculé : KM Total x 0.15
  commercial:        'Commercial',
  commCommercial:    'Comm Commercial',
  margeBrute:        'Marge Brut (Event)',

  // --- LOGISTIQUE (Horaires) ---
  dateLiv:           'Date Liv',
  heureLiv:          'Heure Liv',
  dateRecup:         'Date Recup',
  heureRecup:        'Heure Recup',
  
  // --- SYNC & LIENS ---
  lienInvoice:       'Lien Invoice',
  lienGalerie:       'Lien Galerie',
  lienZip:           'Lien ZIP',
  eventId:           'Event ID',
  syncStatus:        'Sync Status',
  
  // --- INFOS GOODBARBER / SYNC ---
  livId:             'Liv ID',
  syncStatusLiv:     'Sync Status Livraison',
  recupId:           'Recup ID',
  syncStatusRecup:   'Sync Status Récupération',
  
  // --- SUIVI POST-EVENT ---
  reviewStatus:      'Review Status',        // Sent, Reminder Sent, Done
  annualOfferStatus: 'Annual Offer Status',   // Sent

  // --- SUIVI FACTURES ---
  AcompteFacture:    'Acompte Facture',
  SoldeFacture:      'Solde Facture',

  paymentId: 'Payment ID',

  dateEventDate: 'Date Event (Date)',



};

const LOG_SHEET_NAME = "GAS_LOGS";
const LEGACY_SHEETS = ["Clients", "Leads", "Payments", "Notifications", "Stats", "Students", "Commercial"];

function _getProp_(k){ return PropertiesService.getScriptProperties().getProperty(k) || ""; }
function _setProp_(k,v){ PropertiesService.getScriptProperties().setProperty(k, String(v)); }

function _hash_(s){
  s = String(s || "");
  let h = 0;
  for (let i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}

function _json_(o){
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function _getOrCreateLogSheet_(){
  const ss = SpreadsheetApp.openById(SS_ID);
  let sh = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sh){
    sh = ss.insertSheet(LOG_SHEET_NAME);
    sh.appendRow(["ts","endpoint","ok","reason","params_compact","fingerprint","countKey"]);
  }
  return sh;
}



function _rateLimit_(bucketKey, limit, windowSec){
  const cache = CacheService.getScriptCache();
  const raw = cache.get(bucketKey);
  let count = raw ? Number(raw) : 0;
  count++;
  cache.put(bucketKey, String(count), windowSec);
  return count <= limit;
}

// Cache JSON string
function _cacheGet_(k){
  return CacheService.getScriptCache().get(k);
}
function _cachePut_(k, v, ttlSec){
  CacheService.getScriptCache().put(k, v, ttlSec);
}

function _getSheetByName_(name){
  const ss = SpreadsheetApp.openById(SS_ID);
  return ss.getSheetByName(name);
}

/* ==========================================================================
   UTILITAIRES DE BASE
   ========================================================================== */
const SS_ID = '12X9G62lKRzJSYHZfGQ6jCTMwgOCfdMtkTD6A-GbuwqQ'; // ← l’ID de ton fichier Sheets

function _sheet(){
  return SpreadsheetApp.openById(SS_ID).getSheetByName(SHEET_NAME);
}
function _json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function _headIdx(head, label){ return head.findIndex(h => String(h).trim() === String(label).trim()); }

function _normDateStr(s){ 
  if(!s)return ''; 
  s=String(s).trim(); 
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s; 
  const m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/); 
  if(m)return `${m[3]}-${('0'+m[2]).slice(-2)}-${('0'+m[1]).slice(-2)}`; 
  return s; 
}

function _normHM(v){ 
  if(!v&&v!==0)return ''; 
  if(Object.prototype.toString.call(v)==='[object Date]'){ 
    return Utilities.formatDate(v, TIMEZONE, 'HH:mm'); 
  } 
  const s=String(v).trim(); 
  const m=s.match(/^(\d{1,2}):([0-5]\d)$/); 
  return m?`${('0'+m[1]).slice(-2)}:${m[2]}`:''; 
}

function _findRowByEmail(email, head, vals){ 
  const i=_headIdx(head, COLS.email); 
  if(i<0)return -1; 
  for(let r=0;r<vals.length;r++){ 
    if(String(vals[r][i]).trim().toLowerCase()===email)return r+2; 
  } 
  return -1; 
}

function _getBudgetObj(head, row){
  const idx = l => _headIdx(head, l);
  const gv  = (label) => {
    const i = idx(label);
    return i>=0 ? row[i] : '';
  };
  return {
    typeEvent:      gv(COLS.typeEvent) || '',
    invites:        gv(COLS.invites)   || '',
    prixPack:       gv(COLS.prixPack)  || '',
    fraisTransport: gv(COLS.transport) || '',
    prixSupplement: gv(COLS.supplementEur) || '',
    acompte:        gv(COLS.acompte)   || '',
    total:          gv(COLS.total)     || '',
    soldeRestant:   gv(COLS.soldeRestant) || ''
  };
}


function _isPlainObject_(v){
  return v && typeof v === 'object' && !Array.isArray(v);
}

function _toRow1DForSheet_(targetSheet, values){
  const headers = targetSheet.getRange(1,1,1,targetSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

  let row;

  // values = [[...]]
  if (Array.isArray(values) && Array.isArray(values[0])) {
    row = values[0];

  // values = [...]
  } else if (Array.isArray(values)) {
    row = values;

  // values = { "Col": value, ... }
  } else if (_isPlainObject_(values)) {
    row = headers.map(h => (values[h] !== undefined && values[h] !== null) ? values[h] : '');

  } else {
    throw new Error('Invalid values type for appendRow: ' + (typeof values));
  }

  // Pad / slice à la longueur headers
  if (row.length < headers.length) {
    row = row.concat(new Array(headers.length - row.length).fill(''));
  } else if (row.length > headers.length) {
    row = row.slice(0, headers.length);
  }

  return { headers, row };
}

function _appendRowSafe_(targetSheet, row){
  const last = Math.max(targetSheet.getLastRow(), 1);
  targetSheet.getRange(last + 1, 1, 1, row.length).setValues([row]);
}


function _findRowByPaymentId_(paymentId, head, vals){
  const i = _headIdx(head, 'Payment ID');
  if (i < 0) return -1;
  const target = String(paymentId || '').trim();
  if (!target) return -1;
  for (let r = 0; r < vals.length; r++){
    if (String(vals[r][i]).trim() === target) return r + 2; // row number in sheet
  }
  return -1;
}

/**
 * Dédupe générique : renvoie {rowNum, deduped} si on trouve Payment ID
 */
function _dedupeByPaymentIdIfPresent_(targetSheet, paymentId){
  const data = targetSheet.getDataRange().getValues();
  const head = data.shift().map(h => String(h).trim());
  const vals = data;
  const rowNum = _findRowByPaymentId_(paymentId, head, vals);
  if (rowNum > 0) return { deduped:true, rowNum };
  return { deduped:false, rowNum:-1 };
}

function formatDateForClientEmail_(v) {
  if (!v) return '';

  // Date Google Sheets
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, TIMEZONE, 'dd/MM/yyyy');
  }

  const s = String(v).trim();

  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }

  // Déjà bon
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    return s;
  }

  return s; // fallback safe
}

/* ==========================================================================
   LOGIQUE MAPS & CALCULS LOGISTIQUES
   ========================================================================== */

/**
 * Récupère distance (KM) et durée (Minutes) via Google Maps API.
 */
function getRouteDetails(destination) {
  if (!destination || String(destination).trim().length < 5) return null;
  try {
    const directions = Maps.newDirectionFinder()
      .setOrigin(BASE_ADDRESS)
      .setDestination(destination)
      .setMode(Maps.DirectionFinder.Mode.DRIVING)
      .getDirections();
      
    if (directions.routes && directions.routes.length > 0) {
      const leg = directions.routes[0].legs[0];
      return {
        km: Math.ceil(leg.distance.value / 1000),      // Distance en KM
        minutes: Math.ceil(leg.duration.value / 60)    // Durée en Minutes (sans trafic)
      };
    }
  } catch (e) {
    Logger.log(`Erreur Maps : ${e}`);
  }
  return null;
}

/**
 * ✅ FONCTION CENTRALE DE CALCUL
 * Appelé par doPost (App) OU onEdit (Sheets manuel).
 * Met à jour KM, Coût Essence et Heures Étudiant avec des VIRGULES.
 */
function calculateAndSetLogistics_(sh, row, colsMap, venue) {
  if (!venue) return;
  
  Logger.log(`Calcul logistique pour : ${venue}`);
  const route = getRouteDetails(venue);
  
  if (!route) {
    Logger.log("Maps n'a pas trouvé la route.");
    return;
  }

  // 1. Calcul KM
  const kmAller = route.km;
  const kmTotal = kmAller * 4; // 👈 Modification demandée : KM Aller * 4
  
  // 2. Calcul Coût Essence (0.15€ / km total)
  const coutEssence = kmTotal * 0.15;
  // Conversion en String avec Virgule pour Sheets (ex: "28,80")
  const coutEssenceStr = coutEssence.toFixed(2).replace('.', ',');
  
  // 3. Calcul Heures Étudiant
  // Formule : (Temps Aller * 4) + 60 min d'installation
  const minutesTotal = (route.minutes * 4) + 60; 
  const heuresReelles = minutesTotal / 60;
  
  // ✅ ARRINDI AU 0.5 SUPÉRIEUR (Demi-heure supérieure)
  // Ex: 5.1 -> 5.5 | 5.6 -> 6.0
  const heuresArrondies = Math.ceil(heuresReelles * 2) / 2;
  
  // Conversion en String avec Virgule (ex: "5,50")
  const heuresEtudiantStr = heuresArrondies.toFixed(2).replace('.', ',');

  // Écriture dans le Sheet
  if (colsMap[COLS.kmAller])        sh.getRange(row, colsMap[COLS.kmAller]).setValue(kmAller);
  if (colsMap[COLS.kmTotal])        sh.getRange(row, colsMap[COLS.kmTotal]).setValue(kmTotal);
  if (colsMap[COLS.coutEssence])    sh.getRange(row, colsMap[COLS.coutEssence]).setValue(coutEssenceStr);
  if (colsMap[COLS.heuresEtudiant]) sh.getRange(row, colsMap[COLS.heuresEtudiant]).setValue(heuresEtudiantStr);

  Logger.log(`Mise à jour Ligne ${row}: ${kmTotal}km totaux, Coût ${coutEssenceStr}€, Étudiant ${heuresEtudiantStr}h.`);
}

/**
 * Fonction de test pour forcer l'activation de l'API Maps.
 * À exécuter manuellement une fois.
 */
function ME_forceMapsAuthAndTest() {
  const destinationTest = "Grand-Place, 1000 Bruxelles, Belgique";
  try {
    const route = getRouteDetails(destinationTest);
    if (route) {
      SpreadsheetApp.getUi().alert(`SUCCÈS : Maps API active.\nTest vers Grand-Place : ${route.km} KM / ${route.minutes} min.`);
    } else {
      SpreadsheetApp.getUi().alert("ÉCHEC : Maps n'a trouvé aucune route.");
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert(`ERREUR CRITIQUE : ${e.message}`);
  }
}

// === DSLRBOOTH TRIGGERS (GET) =============================================

// ====== AVAILABILITY (Clients = Confirmed) ======
function ME_getMirrorCapacity_(){
  const v = PropertiesService.getScriptProperties().getProperty('ME_MIRROR_CAPACITY');
  const n = Number(v || 0);
  return (n && n > 0) ? n : 4; // fallback
}

function ME_checkAvailabilityClientsConfirmed_(dateStr){
  const sh  = _sheet();                 // SHEET_NAME = 'Clients'
  const cap = ME_getMirrorCapacity_();

  const norm = _normDateStr(dateStr);   // accepte dd/mm/yyyy -> yyyy-mm-dd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(norm)) {
    return { ok:false, error:"Invalid date. Use YYYY-MM-DD or DD/MM/YYYY", date:norm };
  }

  const data = sh.getDataRange().getValues();
  const head = data.shift().map(h => String(h).trim());
  const idxDateEvent = _headIdx(head, COLS.dateEvent);
  if (idxDateEvent < 0) return { ok:false, error:"Col 'Date Event' not found" };

  const toISO = (v)=>{
    if (!v) return '';
    if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
      return Utilities.formatDate(v, TIMEZONE, 'yyyy-MM-dd');
    }
    return _normDateStr(v);
  };

  let booked = 0;
  for (let r=0; r<data.length; r++){
    const rowDate = toISO(data[r][idxDateEvent]);
    if (rowDate === norm) booked++;
  }

  const available = booked < cap;
  const [Y,M,D] = norm.split('-').map(Number);
  const dt = new Date(Y, M-1, D);

  return {
    ok: true,
    date: norm,
    capacity: cap,
    booked,
    available,
    remaining: Math.max(0, cap - booked),
    message: available
      ? `✅ Votre date est bien disponible le ${Utilities.formatDate(dt, TIMEZONE, 'dd/MM/yyyy')} (reste ${Math.max(0, cap-booked)}).`
      : `❌ Désolé, on est complet le ${Utilities.formatDate(dt, TIMEZONE, 'dd/MM/yyyy')}.`
  };
}

/* ==========================================================================
   WEB APP : doGet & doPost
   ========================================================================== */

// Nouveau token - l'ancien ne marchera plus
const DSLRBOOTH_TOKEN = "NOUVEAU_TOKEN_SECURISE_2024";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: "ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ==========================================================================
 * ADMIN ACTIONS — Next.js / Admin (CRUD multi-feuilles)
 * ==========================================================================
 * Supporte: readSheet, appendRow, updateRow, updateRowByEventId, updateRowByCompositeKey, deleteRow
 *
 * IMPORTANT:
 * - Utilise SS_ID et _sheet() déjà présents dans ton code
 * - La clé est la même que celle que tu utilises déjà (ADMIN_KEY)
 */

// ✅ Remplace ta fonction handleAdminActions_ existante par celle-ci
function handleAdminActions_(body) {
  const action = body.action;
  const data = body.data || {};
  const key = body.key;

const GAS_KEY = "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7";
  if (!key || key !== GAS_KEY) {
    return {
      error:
        'Invalid key. Expected: ' +
        GAS_KEY.substring(0, 10) +
        '... Received: ' +
        (key ? key.substring(0, 10) + '...' : 'undefined'),
    };
  }

  const sh = _sheet(); // feuille "Clients" via ton helper existant
  const range = sh.getDataRange();
  const vals = range.getValues();
  const head = vals.shift().map((h) => String(h).trim());

  switch (action) {
    case 'readSheet':
      return readSheetForAdmin_(sh, head, vals, data.sheetName);

    case 'appendRow':
      return appendRowForAdmin_(sh, head, data.sheetName, data.values);

    case 'updateRow':
      return updateRowForAdmin_(sh, head, data.sheetName, data.id, data.values);

    case 'updateRowByEventId':
      return updateRowByEventIdForAdmin_(sh, head, data.eventId, data.values);

    case 'updateRowByCompositeKey':
      return updateRowByCompositeKeyForAdmin_(
        sh,
        head,
        data.sheetName,
        data.key1,
        data.key1Value,
        data.key2,
        data.key2Value,
        data.values
      );

    case 'deleteRow':
      return deleteRowForAdmin_(sh, head, data.sheetName, data.id);

    default:
      return { error: 'Unknown action: ' + action };
  }
}

// ✅ Remplace ta fonction readSheetForAdmin_ existante par celle-ci
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
  const targetHead = targetVals.shift().map((h) => String(h).trim());
  const targetData = targetVals;

  return { values: [targetHead, ...targetData] };
}






function appendRowForAdmin_(sh, head, sheetName, values) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // 15s

  try {
  const ss = SpreadsheetApp.openById(SS_ID);

  const targetSheet = (sheetName === 'Clients')
    ? sh
    : ss.getSheetByName(sheetName);

  if (!targetSheet) {
    return { error: 'Sheet "' + sheetName + '" not found' };
  }

  // ✅ Coerce values (array ou object)
  const conv = _toRow1DForSheet_(targetSheet, values);
  const row = conv.row;

  if (!row || row.length === 0) {
    return { error: 'appendRow: invalid values (expected array or object)' };
  }

    // ✅ DEDUPE Clients (multi-stratégies) — uniquement ici, jamais en global
  if (sheetName === 'Clients') {
    const headers = targetSheet
      .getRange(1, 1, 1, targetSheet.getLastColumn())
      .getValues()[0]
      .map(h => String(h).trim());

    const idxPid   = headers.indexOf('Payment ID');
    const idxEvent = headers.indexOf('Event ID');
    const idxEmail = headers.indexOf('Email');
    const idxDate  = headers.indexOf('Date Event');

    const paymentId = (idxPid >= 0) ? String(row[idxPid] || '').trim() : '';
    const eventId   = (idxEvent >= 0) ? String(row[idxEvent] || '').trim() : '';
    const email     = (idxEmail >= 0) ? String(row[idxEmail] || '').trim().toLowerCase() : '';
    const dateIso   = (idxDate >= 0) ? _normDateStr(row[idxDate]) : '';

    // 1) Payment ID
    if (paymentId) {
      const d = _dedupeByPaymentIdIfPresent_(targetSheet, paymentId); // ⚠️ assure-toi que cette fonction existe
      if (d && d.deduped) return { success:true, deduped:true, rowNum:d.rowNum, reason:'client_payment_exists', paymentId };
    }

    // 2) Event ID
    if (eventId && _clientExistsByEventId_(eventId)) {
      return { success:true, deduped:true, reason:'client_event_exists', eventId };
    }

    // 3) Email + Date Event
    if (email && dateIso && _clientExistsByEmailAndDate_(email, dateIso)) {
      return { success:true, deduped:true, reason:'client_email_date_exists', email, dateIso };
    }

    // 4) Anti-retry 60s même payload
    const fp = _fingerprintRow_(row);
    if (_idempotencyHit_('CLIENTS_' + fp, 60)) {
      return { success:true, deduped:true, reason:'idempotency_cache', fingerprint: fp };
    }
  }

    // ✅ DEDUPE Notifications par (Event ID + Template Key)
    if (sheetName === 'Notifications') {
      const headers = targetSheet.getRange(1,1,1,targetSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      const eIdx = headers.indexOf('Event ID');
      const tIdx = headers.indexOf('Template Key');

      const eventId = (eIdx >= 0) ? String(row[eIdx] || '').trim() : '';
      const tplKey  = (tIdx >= 0) ? String(row[tIdx] || '').trim() : '';

      if (eventId && tplKey && _notifExistsByEventAndTemplateKey_(eventId, tplKey)) {
        return { success:true, deduped:true, reason:'notif_exists', eventId, tplKey };
      }
    }

  targetSheet.appendRow(row);
  const rowNum = targetSheet.getLastRow();



  return { success: true, rowNum, deduped:false, coerced: !Array.isArray(values), cols: row.length };

    } finally {
    lock.releaseLock();
  }
}

// (Tu peux garder ta version existante si elle est identique; sinon remplace)
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

  // Pour "Clients", chercher par "Event ID"
  let rowIndex = -1;
  if (sheetName === 'Clients') {
    const eventIdIdx = headRow.findIndex((h) => String(h).trim() === 'Event ID');
    if (eventIdIdx >= 0) {
      rowIndex = dataRows.findIndex((row) => String(row[eventIdIdx]) === String(id));
    }
  } else {
    rowIndex = dataRows.findIndex((row) => String(row[0]) === String(id));
  }

  if (rowIndex === -1) {
    // Ligne non trouvée, on l'ajoute
    targetSheet.appendRow([id, ...values]);
    return { success: true, action: 'appended' };
  }

  const rowNum = rowIndex + 2;
  const range = targetSheet.getRange(rowNum, 1, 1, values.length + 1);
  range.setValues([[id, ...values]]);

  return { success: true, action: 'updated' };
}

/**
 * ✅ NOUVELLE FONCTION
 * Met à jour une ligne de "Clients" par Event ID avec un objet { "Nom Colonne": valeur }
 * (mapping par nom de colonne, pas par position)
 */
function updateRowByEventIdForAdmin_(sh, head, eventId, values) {
  const vals = sh.getDataRange().getValues();
  const headRow = vals.shift().map(String);
  const dataRows = vals;

  const eventIdIdx = headRow.findIndex((h) => String(h).trim() === 'Event ID');
  if (eventIdIdx < 0) {
    return { error: 'Column "Event ID" not found' };
  }

  const rowIndex = dataRows.findIndex((row) => String(row[eventIdIdx]) === String(eventId));
  if (rowIndex === -1) {
    return { error: 'Event ID not found: ' + eventId };
  }

  const rowNum = rowIndex + 2;

  // Sécurité: values doit être un objet
  if (!values || typeof values !== 'object') {
    return { error: 'values must be an object { "Column": value }' };
  }

  for (const k in values) {
    const colName = k;
    const value = values[k];
    const colIdx = headRow.findIndex((h) => String(h).trim() === String(colName).trim());
    if (colIdx >= 0) {
      sh.getRange(rowNum, colIdx + 1).setValue(value);
    }
  }

  return { success: true, action: 'updated' };
}

/**
 * ✅ NOUVELLE FONCTION
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

  const key1Idx = headRow.findIndex((h) => String(h).trim() === String(key1).trim());
  const key2Idx = headRow.findIndex((h) => String(h).trim() === String(key2).trim());

  if (key1Idx < 0 || key2Idx < 0) {
    return { error: 'Keys not found: ' + key1 + ' or ' + key2 };
  }

  const rowIndex = dataRows.findIndex(
    (row) => String(row[key1Idx]) === String(key1Value) && String(row[key2Idx]) === String(key2Value)
  );

  // Construire valuesArray dans l'ordre des colonnes
  const valuesArray = headRow.map((header) => {
    const h = String(header).trim();
    if (h === String(key1).trim()) return key1Value;
    if (h === String(key2).trim()) return key2Value;
    return values && values[h] !== undefined ? values[h] : '';
  });

  if (rowIndex === -1) {
    targetSheet.appendRow(valuesArray);
    return { success: true, action: 'appended' };
  }

  const rowNum = rowIndex + 2;
  targetSheet.getRange(rowNum, 1, 1, headRow.length).setValues([valuesArray]);
  return { success: true, action: 'updated' };
}

// (Tu peux garder ta version existante si elle est identique; sinon remplace)
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

  let rowIndex = -1;
  if (sheetName === 'Clients') {
    const eventIdIdx = headRow.findIndex((h) => String(h).trim() === 'Event ID');
    if (eventIdIdx >= 0) {
      rowIndex = dataRows.findIndex((row) => String(row[eventIdIdx]) === String(id));
    }
  } else {
    rowIndex = dataRows.findIndex((row) => String(row[0]) === String(id));
  }

  if (rowIndex === -1) return { success: true, action: 'not_found' };

  const rowNum = rowIndex + 2;
  targetSheet.deleteRow(rowNum);
  return { success: true, action: 'deleted' };
}

function doPost(e){
  try {

    // 🔹 1. Parse JSON si présent (ManyChat / Mollie)
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch(_) {}
    }

    // ✅ NOUVEAU : Actions Admin (Next.js)
    if (body.action && (
      body.action === 'readSheet' ||
      body.action === 'appendRow' ||
      body.action === 'updateRow' ||
      body.action === 'updateRowByEventId' ||        // ✅ NEW
      body.action === 'updateRowByCompositeKey' ||    // ✅ NEW
      body.action === 'deleteRow'
    )) {
      const result = handleAdminActions_(body);
      return _json(result); // ✅ plus simple
    }

    // ==================================================
    // 🔹 2. MANYCHAT — CHECK DATE AVAILABILITY
    // ==================================================
    if (body.action === "availability" && body.date) {
      return _json(
        ME_checkAvailabilityClientsConfirmed_(body.date)
      );
    }

    // ==================================================
    // 🔹 3. LOGIQUE EXISTANTE (update client / agenda)
    // ==================================================
    const p = e.parameter || {};
    const key = String(p.key || '');
    if (key !== 'p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7') {
      return _json({ ok:false, error:'Invalid key' });
    }

    const email = String((p.email||'')).trim().toLowerCase();
    if (!email) return _json({ ok:false, error:'Missing email' });

    const sh   = _sheet();
    const vals = sh.getDataRange().getValues();
    const head = vals.shift().map(String);
    const r    = _findRowByEmail(email, head, vals);
    if (r < 0) return _json({ ok:false, error:'Email not found in sheet' });

    // Map colonnes
    const headRow = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    const colsMap = {}; headRow.forEach((h,i)=> colsMap[h] = i+1);

    const setIf = (label, val, fn) => { 
      if(val){
        const i=_headIdx(head,label);
        if(i>=0) sh.getRange(r, i+1).setValue(fn?fn(val):val);
      }
    };

    setIf(COLS.dateEvent, p.eventDate, _normDateStr);
    setIf(COLS.heureDebut, p.startTime, _normHM);
    setIf(COLS.heureFin, p.endTime, _normHM);
    setIf(COLS.dateLiv, p.deliveryDate, _normDateStr);
    setIf(COLS.heureLiv, p.deliveryTime, _normHM);
    setIf(COLS.dateRecup, p.pickupDate, _normDateStr);
    setIf(COLS.heureRecup, p.pickupTime, _normHM);
    setIf(COLS.lieu, p.venue);

    SpreadsheetApp.flush();

    if (p.venue) {
      calculateAndSetLogistics_(sh, r, colsMap, p.venue);
    }

    const res = ME_upsertCalendarForRow_(sh, r, colsMap);

    if (colsMap[COLS.syncStatus]) {
      sh.getRange(r, colsMap[COLS.syncStatus]).setValue(
        (res?.ok ? 'OK ' : 'ERR ') +
        Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm')
      );
    }

    return _json({ ok:true, calendar:(res?.ok||false), msg: res?.message||'' });

  } catch(err){
    return _json({ ok:false, error:String(err) });
  }
}

/* ==========================================================================
   AUTOMATISATION POST-EVENT (J+1, J+3, M+9)
   ========================================================================== */

/**
 * Vérifie quotidiennement les actions Post-Event.
 */
function checkPostEventTriggers() {
  const sh = _sheet();
  const range = sh.getDataRange();
  const vals = range.getValues();
  const headers = vals.shift().map(String);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const idx = label => _headIdx(headers, label);
  const indices = {
    dateEvent: idx(COLS.dateEvent),
    email: idx(COLS.email),
    reviewStatus: idx(COLS.reviewStatus),
    annualOfferStatus: idx(COLS.annualOfferStatus),
    nom: idx(COLS.nom),
    total: idx(COLS.total),
    language: idx(COLS.language)
  };

  for (const key in indices) {
    if (indices[key] < 0) {
      Logger.log(`ERREUR CRITIQUE: Colonne '${key}' manquante. Arrêt.`);
      return;
    }
  }

  for (let i = 0; i < vals.length; i++) {
    const rowNum = i + 2; 
    const row = vals[i];
    
    const rowData = {
      email: row[indices.email],
      eventDate: row[indices.dateEvent],
      reviewStatus: row[indices.reviewStatus] || '',
      annualOfferStatus: row[indices.annualOfferStatus] || '',
      nom: row[indices.nom] || 'Client',
      total: row[indices.total] || 0,
      language: (row[indices.language] || 'FR').toUpperCase()
    };
    
    if (typeof rowData.eventDate !== 'object' || isNaN(rowData.eventDate.getTime())) continue;

    const eventDate = new Date(rowData.eventDate);
    eventDate.setHours(0, 0, 0, 0);

    const daysSinceEvent = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const needsJ1 = (daysSinceEvent === 1);
    const needsJ3 = (daysSinceEvent === 3);
    const needsM9 = (daysSinceEvent === 275); // ~9 mois

    // --- J+1 : Avis Google (sans galerie) ---
    if (needsJ1 && rowData.reviewStatus === '') {
      sendPostEventEmail(rowData, 'J+1');
      sh.getRange(rowNum, indices.reviewStatus + 1).setValue('Sent');
    }
    
    // --- J+3 : Relance (si pas encore fait) ---
    else if (needsJ3 && rowData.reviewStatus === 'Sent') {
      sendPostEventEmail(rowData, 'J+3');
      sh.getRange(rowNum, indices.reviewStatus + 1).setValue('Reminder Sent');
    }
    
    // --- M+9 : Anniversaire ---
    else if (needsM9 && rowData.annualOfferStatus === '' && rowData.total > 0) {
      sendPostEventEmail(rowData, 'M+9');
      sh.getRange(rowNum, indices.annualOfferStatus + 1).setValue('Sent');
    }
  }
}

function sendPostEventEmail(rowData, type) {
  const lang = (String(rowData.language || '').toUpperCase() === 'NL') ? 'NL' : 'FR';

  const fallbackName = (lang === 'NL') ? 'Beste klant' : 'Cher client';
  const nomClient = String(rowData.nom || '').trim() || fallbackName;

  // ⚠️ URLS À VÉRIFIER
  const GOOGLE_REVIEW_LINK = "https://maps.app.goo.gl/afn2PAZsTvfFPWdY9";
  const VIP_REDUCTION = (lang === 'NL') ? "Transportkosten gratis!" : "Frais de Transport offerts !";

  let subject, templateBaseName;

  if (type === 'J+1') {
    subject = (lang === 'NL') ? "✨ Bedankt! Laat een Google review achter?" : "✨ Merci ! Un petit avis Google ?";
    templateBaseName = 'AVIS_GOOGLE';
  } else if (type === 'J+3') {
    subject = (lang === 'NL') ? "Vriendelijke herinnering: uw Google review" : "Petit rappel : votre avis Google";
    templateBaseName = 'RELANCE_AVIS';
  } else if (type === 'M+9') {
    subject = (lang === 'NL') ? "Speciale Verjaardagsaanbieding MirrorEffect!" : "Offre Spéciale Anniversaire MirrorEffect !";
    templateBaseName = 'EVENTM9';
  } else {
    Logger.log('Type email inconnu: ' + type);
    return;
  }

  const templateFile = `${templateBaseName}_${lang}`;

  try {
    const template = HtmlService.createTemplateFromFile(templateFile);
    template.clientName = nomClient;
    template.reviewLink = GOOGLE_REVIEW_LINK;
    template.vipReduction = VIP_REDUCTION;
    template.buttonLabel = (lang === 'NL') ? "Schrijf een review op Google" : "Laisser un avis Google";

    const htmlBody = template.evaluate().getContent();

    GmailApp.sendEmail(rowData.email, subject, "", {
      htmlBody: htmlBody,
      name: 'MirrorEffect',
      replyTo: 'jonathan@mirroreffect.co',
      charset: 'UTF-8'
    });

    Logger.log(`Email ${type} (${lang}) envoyé à ${rowData.email}`);

  } catch (e) {
    Logger.log(`ERREUR Email ${type} (${lang}) : ${e.message}`);
  }
}

/**
 * Fonction de rattrapage : parcourt le tableau pour synchroniser
 * les lignes qui ont une date mais pas d'Event ID (ou pas mis à jour).
 * À mettre sur un Trigger 15 min.
 */
function ME_scheduleCalendarSync() {
  const sh   = _sheet();
  const vals = sh.getDataRange().getValues();
  const head = vals.shift().map(String);
  
  const colsMap = {}; 
  head.forEach((h,i)=> colsMap[h] = i+1);

  const idxDateEvent = _headIdx(head, COLS.dateEvent);
  const idxEventId   = _headIdx(head, COLS.eventId);
  
  if (idxDateEvent < 0) return;
  
  vals.forEach((rowVals, i) => {
    const row = i + 2; 
    const dateEvent = rowVals[idxDateEvent];
    const eventId   = rowVals[idxEventId];

    // Si date présente mais pas d'ID, on force la synchro
    if (dateEvent && !eventId) {
      try {
        ME_upsertCalendarForRow_(sh, row, colsMap); 
      } catch (e) {}
    }
  });
}


/* ========= ZENFACTURE — UTILITAIRES API ========= */

// Récupère le token ZenFacture stocké dans les Propriétés du script
function getZenToken_() {
  const token = PropertiesService.getScriptProperties().getProperty('ZENFACTURE_TOKEN');
  if (!token) {
    throw new Error('ZENFACTURE_TOKEN non défini dans les Propriétés du script.');
  }
  return token;
}

/**
 * Crée une facture simple dans ZenFacture (API v2)
 * @param {Object} data - { name, email, phone, language, amount, description, date, payment_term }
 */
function createInvoiceInZenfacture_(data) {
  const token = getZenToken_();
  const url = 'https://app.cashaca.be/api/v2/invoices.json?token=' + encodeURIComponent(token);

  // Sécurité basique
  if (!data.name || !data.email || !data.amount || !data.date) {
    throw new Error('Données incomplètes pour créer la facture.');
  }

  const isoDate = Utilities.formatDate(new Date(data.date), TIMEZONE, 'yyyy-MM-dd');
  const lang = (data.language || 'fr').toLowerCase().startsWith('nl') ? 'nl' :
               (data.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

  const vatRate      = 21; // TVA 21 %
  const grossAmount  = Number(data.amount);          // Montant TTC que tu as dans le sheet (ex: 150)
  const netAmount    = grossAmount / (1 + vatRate/100); // Montant HT calculé
  const unitPriceStr = netAmount.toFixed(2);         // ex: 123.97
  const paymentTerm  = (typeof data.payment_term === 'number') ? data.payment_term : 0;
  const description  = data.description || 'Prestation MirrorEffect';

  // Payload au format attendu par l’API v2
  const payload = {
    client: {
      type_id: 0,              // 0 = particulier belge
      name: data.name,
      email: data.email,
      tel: data.phone || null,
      language: lang           // 'fr', 'nl' ou 'en'
    },
    invoice: {
      date: isoDate,           // Date de facture
      delivery_date: isoDate,  // Date de livraison (on met la même)
      payment_term: paymentTerm, // Délai de paiement en jours
      vat_percentage: 21,      // TVA 21%
      sales_type_id: 2,        // 2 = services
      custom_text_top: description,
      pay_message: 1,
      commercial_document_lines_attributes: [
        {
          description: description,
          number_skus: '1',
          unit_price: unitPriceStr,  // HTVA
          vat_percentage: vatRate
        }
      ]
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const res  = UrlFetchApp.fetch(url, options);
  const code = res.getResponseCode();
  const body = res.getContentText();
  Logger.log('ZenFacture response (' + code + '): ' + body);

  if (code < 200 || code >= 300) {
    throw new Error('Erreur ZenFacture: ' + code + ' - ' + body);
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch (e) {
    return { raw: body };
  }

  // 🧾 On essaie de récupérer le numéro comme dans l'interface ZenFacture
  const number =
    json.number ||
    (json.invoice && (json.invoice.number || json.invoice.serial_number)) ||
    json.serial_number ||
    null;

  const id =
    json.id ||
    (json.invoice && json.invoice.id) ||
    null;

  return {
    id: id,
    number: number, // ex: 2025_0108
    raw: json
  };
}


/**
 * Cœur du traitement de facturation (AUCUN accès UI)
 * - Utilisée par le trigger automatique
 * - Retourne le nombre de factures créées
 */
function ME_processInvoicesBatchCore_() {
  const sh = _sheet(); // "Clients"
  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    Logger.log('Aucune donnée dans la feuille Clients.');
    return 0;
  }

  const lastCol = sh.getLastColumn();
  const values  = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(String);

  const idx = (label) => _headIdx(headers, label);

  const colNom           = idx(COLS.nom);
  const colEmail         = idx(COLS.email);
  const colPhone         = idx(COLS.phone);
  const colLang          = idx(COLS.language);
  const colDateAcompte   = idx(COLS.dateAcompte);
  const colAcompte       = idx(COLS.acompte);
  const colDateEvent = idx(COLS.dateEventDate);
  const colDateEventTxt  = idx(COLS.dateEvent);     // legacy texte
  const colSolde         = idx(COLS.soldeRestant);
  const colEventId       = idx(COLS.eventId);
  const colAcompteFact   = idx(COLS.AcompteFacture);
  const colSoldeFact     = idx(COLS.SoldeFacture);

  if (colNom < 0 || colEmail < 0 || colAcompte < 0 || colSolde < 0) {
    throw new Error('Colonnes essentielles manquantes (Nom / Email / Acompte / Solde).');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = [];

  // 1️⃣ Collecte de toutes les factures à créer
  for (let r = 2; r <= lastRow; r++) {
    const rowIdx = r - 1;
    const row    = values[rowIdx];

    const rawDate =
    (colDateEvent >= 0 && row[colDateEventTxt])
      ? row[colDateEvent]
      : row[colDateEventTxt];

    const dateEventVal =
    (rawDate instanceof Date && !isNaN(rawDate))
      ? rawDate
      : null;

    const fullName = String(row[colNom]   || '').trim();
    const email    = String(row[colEmail] || '').trim();
    const phone    = colPhone >= 0 ? String(row[colPhone] || '').trim() : '';
    const lang     = colLang  >= 0 ? String(row[colLang]  || 'FR').trim() : 'FR';
    const eventId  = colEventId >= 0 ? String(row[colEventId] || '').trim() : '';

    if (!fullName || !email) continue;

    const nameParts  = fullName.split(/\s+/);
    const prenom     = nameParts[0];
    const nomFamille = nameParts.slice(1).join(' ') || '';

    // ----- ACOMPTE -----
    if (colDateAcompte >= 0 && colAcompteFact >= 0) {
      const dateAccVal   = row[colDateAcompte];
      const acompteVal   = Number(row[colAcompte] || 0);
      const acompteFlag  = String(row[colAcompteFact] || '').trim();

      if (dateAccVal instanceof Date && acompteVal > 0 && !acompteFlag) {
        pending.push({
          row: r,
          type: 'ACOMPTE',
          date: new Date(dateAccVal),
          amount: acompteVal,
          fullName,
          email,
          phone,
          lang,
          eventId,
          prenom,
          nomFamille
        });
      }
    }

    // ----- SOLDE -----
    if (colDateEvent >= 0 && colSoldeFact >= 0) {
      const dateEventVal = row[colDateEvent];
      const soldeVal     = Number(row[colSolde] || 0);
      const soldeFlag    = String(row[colSoldeFact] || '').trim();

      if (dateEventVal && soldeVal > 0 && !soldeFlag) {
        const eventDateMid = new Date(dateEventVal);
        eventDateMid.setHours(0, 0, 0, 0);

        if (eventDateMid <= today) {
          pending.push({
            row: r,
            type: 'SOLDE',
            date: eventDateMid,
            amount: soldeVal,
            fullName,
            email,
            phone,
            lang,
            eventId,
            prenom,
            nomFamille
          });
        }
      }
    }
  }

  if (pending.length === 0) {
    Logger.log('Aucune nouvelle facture à créer (acompte ou solde).');
    return 0;
  }

  // 2️⃣ Tri chronologique
  pending.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 3️⃣ Création des factures dans l'ordre
  let createdCount = 0;

  for (const inv of pending) {
    try {
      const desc = (inv.type === 'ACOMPTE')
        ? `Acompte événement MirrorEffect Location Photobooth ${inv.eventId ? '(' + inv.eventId + ')' : '(' + inv.prenom + ' ' + inv.nomFamille + ')'}`
        : `Solde événement MirrorEffect Location Photobooth ${inv.eventId ? '(' + inv.eventId + ')' : '(' + inv.prenom + ' ' + inv.nomFamille + ')'}`;

      const res = createInvoiceInZenfacture_({
        name: inv.fullName,
        email: inv.email,
        phone: inv.phone,
        language: inv.lang,
        amount: inv.amount,    // TTC
        description: desc,
        date: inv.date,
        payment_term: 0        // déjà payé
      });

      const label = res.number || ('ID ' + (res.id || ''));

      if (inv.type === 'ACOMPTE' && colAcompteFact >= 0) {
        sh.getRange(inv.row, colAcompteFact + 1).setValue(label);
      } else if (inv.type === 'SOLDE' && colSoldeFact >= 0) {
        sh.getRange(inv.row, colSoldeFact + 1).setValue(label);
      }

      createdCount++;

    } catch (e) {
      Logger.log('Erreur facture ' + inv.type + ' ligne ' + inv.row + ' : ' + e);
    }
  }

  Logger.log(createdCount + ' facture(s) ZenFacture créée(s) automatiquement (ordre chronologique).');
  return createdCount;
}

/**
 * Version utilisée par le TRIGGER (aucun UI)
 */
function ME_processInvoicesBatch() {
  ME_processInvoicesBatchCore_();
}

/**
 * Version utilisée par le MENU (avec popup)
 */
function ME_processInvoicesBatchMenu() {
  const createdCount = ME_processInvoicesBatchCore_();
  SpreadsheetApp.getUi().alert(
    createdCount > 0
      ? `${createdCount} facture(s) ZenFacture créée(s) automatiquement (ordre chronologique).`
      : `Aucune nouvelle facture à créer (acompte ou solde).`
  );
}

function ME_testReviewEmail() {
  sendPostEventEmail({
    email: "ton.email@gmail.com",
    nom: "Jonathan",
    language: "FR",
    total: 500
  }, "J+1");
}

function normalizeDateToISO_(s) {
  if (!s) return "";
  s = String(s).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY
  var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3] + "-" + m[2] + "-" + m[1];

  // Date object from Sheets
  if (Object.prototype.toString.call(s) === "[object Date]" && !isNaN(s)) {
    var yyyy = s.getFullYear();
    var mm = String(s.getMonth() + 1).padStart(2, "0");
    var dd = String(s.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  return ""; // invalid
}


function TEST_appendRowLeads_object() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const leads = ss.getSheetByName('Leads');

  const payload = {
    "Lead ID": "LEAD-TEST-1",
    "Created At": "17/01/2026 12:00",
    "Step": 6,
    "Status": "progress",
    "Nom": "Test",
    "Email": "test@example.com"
  };

  const conv = _toRow1DForSheet_(leads, payload);
  _appendRowSafe_(leads, conv.row);
}


/**************************************************************
 * CLIENTS — EMAIL DE CONFIRMATION (ANTI-DOUBLON)
 **************************************************************/
const CONFIRMATION_TEMPLATE_FR = 'CONFIRMATION_MAIL_FR'; // ⚠️ sans .html
const CONFIRMATION_TEMPLATE_NL = 'CONFIRMATION_MAIL_NL';
const CLIENTS_CONFIRMATION_COL = 'Confirmation mail';

function sendClientConfirmationForRow_(rowNum) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName('Clients');
  if (!sh) throw new Error('Clients sheet introuvable');

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(h => String(h || '').trim());

  const col = {};
  headers.forEach((h, i) => col[h] = i + 1);

  if (!col['Email']) return;
  if (!col[CLIENTS_CONFIRMATION_COL]) return;

  const row = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];

  // ⛔ Anti-doublon
  if (row[col[CLIENTS_CONFIRMATION_COL] - 1]) return;

  const email = String(row[col['Email'] - 1] || '').trim();
  if (!email || !email.includes('@')) return;

  const nom  = col['Nom'] ? String(row[col['Nom'] - 1] || '').trim() : '';
  const lieu = col['Lieu Event'] ? String(row[col['Lieu Event'] - 1] || '').trim() : '';
  const pack = col['Pack'] ? String(row[col['Pack'] - 1] || '').trim() : '';
  const dateEvent = col['Date Event'] ? row[col['Date Event'] - 1] : '';

  // === MONTANTS FINANCIERS ===
  const packPriceRaw      = col['Pack (€)']        ? row[col['Pack (€)'] - 1]        : '';
  const transportRaw      = col['Transport (€)']   ? row[col['Transport (€)'] - 1]   : '';
  const acompteRaw        = col['Acompte']          ? row[col['Acompte'] - 1]          : '';
  const totalRaw          = col['Total']            ? row[col['Total'] - 1]            : '';
  const soldeRestantRaw   = col['Solde Restant']    ? row[col['Solde Restant'] - 1]    : '';


  // --- Template HTML ---
  const lang = col['Language'] ? String(row[col['Language'] - 1] || 'FR').trim().toUpperCase() : 'FR';
  const templateName = (lang === 'NL') ? CONFIRMATION_TEMPLATE_NL : CONFIRMATION_TEMPLATE_FR;

  const tpl = HtmlService.createTemplateFromFile(templateName);

  tpl.clientName = nom || '👋';
  tpl.eventPlace = lieu || '';
  tpl.packName  = pack || '';
  tpl.eventDate = formatDateForClientEmail_(dateEvent);

  // === Injection dans le template HTML ===
  tpl.packPrice     = formatEuro_(packPriceRaw);
  tpl.transportPrice= formatEuro_(transportRaw);
  tpl.depositAmount = formatEuro_(acompteRaw);
  tpl.totalAmount   = formatEuro_(totalRaw);
  tpl.balanceAmount = formatEuro_(soldeRestantRaw);



  const htmlBody = tpl.evaluate().getContent();

  const subject = (lang === 'NL')
  ? `✅ Bevestiging van uw reservatie — MirrorEffect`
  : `✅ Confirmation de votre réservation — MirrorEffect`;

  GmailApp.sendEmail(email, subject, '', {
    htmlBody,
    name: 'MirrorEffect',
    replyTo: 'jonathan@mirroreffect.co',
    charset: 'UTF-8'
  });

  // ✅ Marque comme envoyé
  sh.getRange(rowNum, col[CLIENTS_CONFIRMATION_COL]).setValue(new Date());
  SpreadsheetApp.flush();
}

function ME_testConfirmationEmail_row() {
  const rowNum = 150; // 👈 mets ici la ligne du client à tester (ex: 150)
  sendClientConfirmationForRow_(rowNum);
  Logger.log('✅ Confirmation test sent for row ' + rowNum);
}


function formatEuro_(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(String(v).replace(',', '.'));
  if (isNaN(n)) return '';
  return n.toFixed(2).replace('.', ',') + ' €';
}

function formatDateForClientEmail_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, TIMEZONE, 'dd/MM/yyyy');
  }
  return String(v);
}

function testDoPost() {
  // Simule une requête POST
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "appendRow",
        key: "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7",
        data: {
          sheetName: "Leads",
          values: {
            "Lead ID": "TEST-123",
            "Created At": "18/01/2026 12:00",
            "Step": "5",
            "Status": "test",
            "Nom": "Test User",
            "Email": "test@example.com",
            "Phone": "",
            "Language": "fr",
            "Date Event": "",
            "Lieu Event": "",
            "Pack": "",
            "Invités": "",
            "Transport (€)": "",
            "Total": "",
            "Acompte": "",
            "UTM Source": "",
            "UTM Campaign": "",
            "UTM Medium": ""
          }
        }
      }),
      type: "application/json"
    }
  };
  
  var result = doPost(mockEvent);
  var content = result.getContent();
  
  Logger.log("Response: " + content);
  return content;
}

/**************************************************************
 * PROMO 72H — Leads -> Email promo si pas client & pas payé
 * Règle:
 * - Lead créé il y a >= 72h
 * - Email existe
 * - Pas dans Clients (par Email)
 * - Pas de paiement "paid" dans Payments (par Email)
 * - Anti-doublon: marque "Promo Sent At" dans Leads
 **************************************************************/

const PROMO72H_TEMPLATE_FR = "PROMO_72H_FR"; // ⚠️ sans .html
const PROMO72H_TEMPLATE_NL = "PROMO_72H_NL"; // si tu veux NL aussi (optionnel)
const PROMO72H_SUBJECT_FR  = "⏳ Dernières 72h — Réduction de 50€ sur votre solde (MirrorEffect)";
const PROMO72H_SUBJECT_NL  = "⏳ Laatste 72u — 50€ korting op uw saldo (MirrorEffect)";

// Mets ces colonnes dans Leads si pas déjà présent
const LEADS_PROMO_SENT_COL = "Promo Sent At";  // anti-doublon
const LEADS_CREATED_AT_COL = "Created At";
const LEADS_EMAIL_COL      = "Email";
const LEADS_NAME_COL       = "Nom";
const LEADS_LANG_COL       = "Language";
const LEADS_PACK_COL       = "Pack";
const LEADS_DATE_COL       = "Date Event";
const LEADS_PLACE_COL      = "Lieu Event";
const LEADS_TOTAL_COL      = "Total";
const LEADS_ACOMPTE_COL    = "Acompte";

function ME_installPromo72hTriggerDaily_(){
  // 1x/jour à 10:00 (heure du script)
  ScriptApp.newTrigger("ME_promo72hSweep")
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();
}

function ME_promo72hSweep() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const leadsSh = ss.getSheetByName("Leads");
  if (!leadsSh) throw new Error("Sheet Leads introuvable");

  const range = leadsSh.getDataRange();
  const data = range.getValues();
  if (data.length < 2) return;

  const head = data[0].map(h => String(h || "").trim());
  const rows = data.slice(1);

  const idx = (col) => head.indexOf(col);

  const iCreated = idx(LEADS_CREATED_AT_COL);
  const iEmail   = idx(LEADS_EMAIL_COL);
  const iName    = idx(LEADS_NAME_COL);
  const iLang    = idx(LEADS_LANG_COL);
  const iPack    = idx(LEADS_PACK_COL);
  const iDate    = idx(LEADS_DATE_COL);
  const iPlace   = idx(LEADS_PLACE_COL);
  const iTotal   = idx(LEADS_TOTAL_COL);
  const iAcompte = idx(LEADS_ACOMPTE_COL);

  let iPromoAt = idx(LEADS_PROMO_SENT_COL);

  // Crée la colonne "Promo Sent At" si absente
  if (iPromoAt < 0) {
    iPromoAt = head.length; // 0-based
    leadsSh.getRange(1, iPromoAt + 1).setValue(LEADS_PROMO_SENT_COL);
    // IMPORTANT: il faut aussi l'ajouter au head local pour cohérence
    head.push(LEADS_PROMO_SENT_COL);
    // Et padder les rows en mémoire (sinon row[iPromoAt] undefined -> ok mais on fait propre)
    for (let r = 0; r < rows.length; r++) rows[r][iPromoAt] = "";
  }

  // ✅ Build caches 1 seule fois
  const clientsEmailSet = _getClientsEmailSet_();
  const paidEmailSet    = _getPaidEmailSet_(); // <--- nouveau

  const now = new Date();
  const cutoffMs = 24 * 60 * 60 * 1000;

  let sent = 0;

  for (let r = 0; r < rows.length; r++) {
    const rowNum = r + 2;
    const row = rows[r];

    const email = (iEmail >= 0) ? String(row[iEmail] || "").trim().toLowerCase() : "";
    if (!email || !email.includes("@")) continue;

    // Anti-doublon: on lit depuis la data en mémoire
    const promoAlready = row[iPromoAt];
    if (promoAlready) continue;

    const createdAtVal = (iCreated >= 0) ? row[iCreated] : null;
    const createdAt = _parseLeadCreatedAt_(createdAtVal);
    if (!createdAt) continue;

    if ((now.getTime() - createdAt.getTime()) < cutoffMs) continue;

    // Pas client
    if (clientsEmailSet.has(email)) continue;

    // Pas payé (Payments.Status === paid)
    if (paidEmailSet.has(email)) continue;

    const lang = (iLang >= 0) ? String(row[iLang] || "FR").trim().toUpperCase() : "FR";
    const isNL = (lang === "NL");

    const clientName = (iName >= 0) ? String(row[iName] || "").trim() : "";
    const packName   = (iPack >= 0) ? String(row[iPack] || "").trim() : "";
    const eventPlace = (iPlace >= 0) ? String(row[iPlace] || "").trim() : "";
    const eventDate  = (iDate >= 0) ? row[iDate] : "";
    const totalRaw   = (iTotal >= 0) ? row[iTotal] : "";
    const acompteRaw = (iAcompte >= 0) ? row[iAcompte] : "";

    const tplName = isNL ? PROMO72H_TEMPLATE_NL : PROMO72H_TEMPLATE_FR;
    const subject = isNL ? PROMO72H_SUBJECT_NL  : PROMO72H_SUBJECT_FR;

    const tpl = HtmlService.createTemplateFromFile(tplName);
    tpl.clientName   = clientName || (isNL ? "Beste klant" : "Bonjour");
    tpl.packName     = packName;
    tpl.eventPlace   = eventPlace;
    tpl.eventDate    = formatDateForClientEmail_(eventDate);
    tpl.totalAmount  = formatEuro_(totalRaw);
    tpl.depositAmount= formatEuro_(acompteRaw);



    const htmlBody = tpl.evaluate().getContent();

    GmailApp.sendEmail(email, subject, "", {
      htmlBody,
      name: "MirrorEffect",
      replyTo: "jonathan@mirroreffect.co",
      charset: "UTF-8"
    });

    // Marquer envoyé (sheet + mémoire)
    const stamp = new Date();
    leadsSh.getRange(rowNum, iPromoAt + 1).setValue(stamp);
    row[iPromoAt] = stamp;

    sent++;
  }

  Logger.log(`✅ Promo72h: ${sent} email(s) envoyé(s).`);
}

/** =========================
 * HELPERS
 * ========================= */

function _getClientsEmailSet_(){
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName("Clients");
  const set = new Set();
  if (!sh) return set;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return set;

  const head = data[0].map(h => String(h || "").trim());
  const idxEmail = head.indexOf("Email");
  if (idxEmail < 0) return set;

  for (let i = 1; i < data.length; i++) {
    const email = String(data[i][idxEmail] || "").trim().toLowerCase();
    if (email && email.includes("@")) set.add(email);
  }
  return set;
}

function _getPaidEmailSet_(){
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName("Payments");
  const set = new Set();
  if (!sh) return set;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return set;

  const head = data[0].map(h => String(h || "").trim());
  const idxEmail  = head.indexOf("Email");
  const idxStatus = head.indexOf("Status");
  if (idxEmail < 0 || idxStatus < 0) return set;

  for (let i = 1; i < data.length; i++) {
    const email  = String(data[i][idxEmail] || "").trim().toLowerCase();
    const status = String(data[i][idxStatus] || "").trim().toLowerCase();
    if (email && email.includes("@") && status === "paid") set.add(email);
  }
  return set;
}

/**
 * Created At dans Leads peut être:
 * - Date object
 * - "dd/MM/yyyy HH:mm"
 * - ISO "yyyy-mm-ddTHH:mm:ss..."
 */
function _parseLeadCreatedAt_(v){
  if (!v) return null;

  // Date object
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) {
    return v;
  }

  const s = String(v).trim();
  if (!s) return null;

  // ISO
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;

  // dd/MM/yyyy HH:mm
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (m) {
    const dd = Number(m[1]), mm = Number(m[2]), yyyy = Number(m[3]);
    const HH = Number(m[4] || "0"), Min = Number(m[5] || "0");
    const d = new Date(yyyy, mm - 1, dd, HH, Min, 0);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}


/** Test manuel (envoie à un lead précis) */
function ME_testPromo72hForLeadRow_(){
  const rowNum = 2; // <-- change
  const ss = SpreadsheetApp.openById(SS_ID);
  const leadsSh = ss.getSheetByName("Leads");
  const head = leadsSh.getRange(1,1,1,leadsSh.getLastColumn()).getValues()[0].map(h => String(h||"").trim());
  const row  = leadsSh.getRange(rowNum,1,1,head.length).getValues()[0];

  // Force: on appelle la sweep mais en trichant via "Created At" très ancien
  // (ou tu modifies la cellule Created At du lead en manuel)
  Logger.log("➡️ Pour tester: mets Created At du lead très ancien (ex: 01/01/2026 10:00) puis lance ME_promo72hSweep()");
}


/***********************
 * DEDUPE HELPERS
 ***********************/
function _clientExistsByPaymentId_(paymentId){
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName("Clients");
  if (!sh) return false;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return false;

  const head = data[0].map(h => String(h||"").trim());
  const idxPid = head.indexOf("Payment ID");
  if (idxPid < 0) return false;

  const target = String(paymentId||"").trim();
  if (!target) return false;

  for (let i=1;i<data.length;i++){
    if (String(data[i][idxPid]||"").trim() === target) return true;
  }
  return false;
}

function _notifExists_(eventId, notifType){
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName("Notifications");
  if (!sh) return false;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return false;

  const head = data[0].map(h => String(h||"").trim());
  const iEvent = head.indexOf("Event ID");
  const iType  = head.indexOf("Type"); // adapte si ton header s'appelle autrement
  if (iEvent < 0) return false;

  const target = String(eventId||"").trim();
  const ttype  = String(notifType||"").trim();

  for (let i=1;i<data.length;i++){
    const e = String(data[i][iEvent]||"").trim();
    const t = (iType>=0) ? String(data[i][iType]||"").trim() : "";
    if (e === target && (iType < 0 || t === ttype)) return true;
  }
  return false;
}


function _sheetHasValueByCol_(sheet, colName, value){
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  const head = data[0].map(h => String(h||"").trim());
  const idx = head.indexOf(String(colName).trim());
  if (idx < 0) return false;
  const target = String(value||"").trim();
  for (let i=1;i<data.length;i++){
    if (String(data[i][idx]||"").trim() === target) return true;
  }
  return false;
}

function _sheetHasCompositeInSheet_(sheet, colA, valA, colB, valB){
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  const head = data[0].map(h => String(h||"").trim());
  const iA = head.indexOf(String(colA).trim());
  const iB = head.indexOf(String(colB).trim());
  if (iA < 0 || iB < 0) return false;

  const a = String(valA||"").trim();
  const b = String(valB||"").trim();
  for (let i=1;i<data.length;i++){
    if (String(data[i][iA]||"").trim() === a && String(data[i][iB]||"").trim() === b) return true;
  }
  return false;
}

function _notifExistsByEventAndTemplateKey_(eventId, templateKey){
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName("Notifications");
  if (!sh) return false;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return false;

  const head = data[0].map(h => String(h || "").trim());
  const iEvent = head.indexOf("Event ID");
  const iTpl   = head.indexOf("Template Key");
  if (iEvent < 0 || iTpl < 0) return false;

  const e = String(eventId || "").trim();
  const t = String(templateKey || "").trim();
  if (!e || !t) return false;

  for (let i = 1; i < data.length; i++){
    if (
      String(data[i][iEvent] || "").trim() === e &&
      String(data[i][iTpl]   || "").trim() === t
    ) return true;
  }
  return false;
}


function _idempotencyHit_(key, ttlSec){
  const cache = CacheService.getScriptCache();
  const k = "IDEMP_" + key;
  if (cache.get(k)) return true;
  cache.put(k, "1", ttlSec || 60);
  return false;
}

function _fingerprintRow_(row){
  // fingerprint stable sans dépendre d'un ID
  const s = row.map(v => String(v ?? "").trim()).join("|");
  return _hash_(s);
}

function _clientExistsByEventId_(eventId){
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName("Clients");
  if (!sh) return false;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return false;

  const head = data[0].map(h => String(h||"").trim());
  const idx = head.indexOf("Event ID");
  if (idx < 0) return false;

  const target = String(eventId||"").trim();
  if (!target) return false;

  for (let i=1;i<data.length;i++){
    if (String(data[i][idx]||"").trim() === target) return true;
  }
  return false;
}

function _clientExistsByEmailAndDate_(email, dateIso){
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName("Clients");
  if (!sh) return false;

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return false;

  const head = data[0].map(h => String(h||"").trim());
  const iEmail = head.indexOf("Email");
  const iDate  = head.indexOf("Date Event");
  if (iEmail < 0 || iDate < 0) return false;

  const em = String(email||"").trim().toLowerCase();
  const dt = _normDateStr(dateIso);

  if (!em || !dt) return false;

  for (let i=1;i<data.length;i++){
    const e = String(data[i][iEmail]||"").trim().toLowerCase();
    const d = _normDateStr(data[i][iDate]);
    if (e === em && d === dt) return true;
  }
  return false;
}