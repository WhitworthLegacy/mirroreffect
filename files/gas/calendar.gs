// calendar.gs

/** ====== Calendar sync (MirrorEffect) ====== */
const CAL_ID = 'c_b59f8305b685f95a024e18354cba3a5d1c1d5ff537ab76ea5e8f4a49b1943984@group.calendar.google.com';

function ME_upsertCalendarForRow_(sh, row, cols) {
  const get = (label) => cols[label] ? sh.getRange(row, cols[label]).getValue() : '';

  const nom       = String(get(COLS.nom)||'').trim();
  const typeEvt   = String(get(COLS.typeEvent)||'').trim();
  const title     = [nom, typeEvt].filter(Boolean).join(' — ') || 'MirrorEffect — Événement';
  const venue     = String(get(COLS.lieu)||'').trim();
  const oldIdRaw  = String(get(COLS.eventId)||'').trim();
  const dateEvent = get(COLS.dateEvent);

  // Heures par défaut
  const hStartVal = get(COLS.heureDebut) || '18:00';
  const hEndVal   = get(COLS.heureFin)   || '00:00';

  if (!dateEvent) return { ok:false, message:'Date Event manquante' };

  // Helpers de formatage (internes à la fonction pour l'isolement)
  const TIMEZONE = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const toHM = (v)=>{
    if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, TIMEZONE, 'HH:mm');
    const s = String(v||'').trim(); const m = s.match(/^(\d{1,2}):([0-5]\d)(?::\d{2})?$/);
    return m ? (('0'+m[1]).slice(-2)+':'+m[2]) : '';
  };
  const toISO = (v)=>{
    if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, TIMEZONE, 'yyyy-MM-dd');
    const s = String(v||'').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    return m ? `${m[3]}-${('0'+m[2]).slice(-2)}-${('0'+m[1]).slice(-2)}` : s;
  };

  const [Y,M,D]   = toISO(dateEvent).split('-').map(Number);
  const [shh,smm] = toHM(hStartVal).split(':').map(Number);
  const [ehh,emm] = toHM(hEndVal).split(':').map(Number);

  const start = new Date(Y, M-1, D, shh, smm);
  let   end   = new Date(Y, M-1, D, ehh, emm);
  if (end <= start) end = new Date(Y, M-1, D+1, ehh, emm); 

  const cal = CalendarApp.getCalendarById(CAL_ID);
  if (!cal) throw new Error('CAL_ID invalide');

  // Suppression doublons
  if (oldIdRaw) { try { cal.getEventById(oldIdRaw)?.deleteEvent(); } catch(_){} }

  // ---- Create fresh event description ---------------------
  const descLines = [
    venue ? '' : '', // Ligne vide pour aérer après le lieu (automatique via Google Calendar location)
    
    (String(get(COLS.pack)||'').trim() ? `Pack: ${String(get(COLS.pack)||'').trim()}` : ''),
    (get(COLS.invites) ? `Invités: ${get(COLS.invites)}` : ''),
    (nom || get(COLS.email) || get(COLS.phone)) ? `Contact: ${nom||''} — ${get(COLS.email)||''} — ${get(COLS.phone)||''}`.replace(/ — $/,'') : '',
    
    '------------------', // Séparateur visuel
    
    (get(COLS.prixPack)       ? `Prix pack: ${get(COLS.prixPack)}` : ''),
    (get(COLS.transport)      ? `Frais transport (Client): ${get(COLS.transport)}` : ''),
    (get(COLS.supplement)     ? `Supplément: ${get(COLS.supplement)}` : ''),
    (get(COLS.supplementEur) ? `Prix supplément: ${get(COLS.supplementEur)}` : ''),
    (get(COLS.acompte)        ? `Acompte: ${get(COLS.acompte)}` : ''),
    (get(COLS.total)          ? `Total: ${get(COLS.total)}` : ''),
    (get(COLS.soldeRestant)  ? `Solde restant: ${get(COLS.soldeRestant)}` : ''),

    '------------------', // Séparateur Logistique
    
    (get(COLS.kmAller)        ? `🚗 KM Aller: ${get(COLS.kmAller)} km` : ''),
    (get(COLS.kmTotal)        ? `⛽ KM Total: ${get(COLS.kmTotal)} km` : ''),
    (get(COLS.coutEssence)    ? `Coût Essence (Est.): ${get(COLS.coutEssence)} €` : ''),
    (get(COLS.heuresEtudiant) ? `⏱️ Heures Étudiant: ${get(COLS.heuresEtudiant)} h` : ''),
    
  ].filter(Boolean);

  const ev = cal.createEvent(title, start, end, {
    location: venue || null,
    description: descLines.join('\n')
  });

  // Mise à jour ID et Statut
  if (cols[COLS.eventId])    sh.getRange(row, cols[COLS.eventId]).setValue(ev.getId());
  if (cols[COLS.syncStatus]) sh.getRange(row, cols[COLS.syncStatus]).setValue('OK ' + Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm'));

  return { ok:true, message:'Agenda recréé', id: ev.getId() };
}

/**
 * WATCHDOG : Vérifie si le lieu a changé dans l'Agenda par rapport au Sheet.
 * Si oui -> Met à jour le Sheet -> Recalcule les KM -> Met à jour la description Agenda.
 */
function checkCalendarUpdates_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sh.getDataRange().getValues();
  const head = data.shift().map(String); // Enlever l'en-tête
  
  // Map des colonnes
  const cols = {}; 
  head.forEach((h, i) => cols[h] = i + 1);

  const idxEventId = cols[COLS.eventId] - 1;
  const idxLieu    = cols[COLS.lieu] - 1;
  const idxDate    = cols[COLS.dateEvent] - 1;

  // On parcourt les lignes
  data.forEach((row, i) => {
    const rowNum = i + 2;
    const eventId = row[idxEventId];
    const sheetLieu = String(row[idxLieu] || '').trim();
    const eventDate = row[idxDate];

    // On ne vérifie que si on a un ID d'événement et une date future (optimisation)
    if (eventId && eventDate && new Date(eventDate) >= new Date().setHours(0,0,0,0)) {
      try {
        const ev = CalendarApp.getEventById(eventId);
        if (ev) {
          const calLieu = String(ev.getLocation() || '').trim();

          // ⚡ DÉTECTION DU CHANGEMENT (Agenda différent du Sheet)
          if (calLieu && calLieu !== sheetLieu) {
            Logger.log(`🔄 Changement détecté depuis l'Agenda (Ligne ${rowNum}) : "${sheetLieu}" devient "${calLieu}"`);

            // 1. Mettre à jour le Sheet avec le nouveau lieu
            sh.getRange(rowNum, idxLieu + 1).setValue(calLieu);

            // 2. Lancer le calcul logistique (KM, Coûts, Heures)
            // (Fonction définie dans app.gs)
            calculateAndSetLogistics_(sh, rowNum, cols, calLieu);

            // 3. Mettre à jour la description de l'agenda avec les nouveaux calculs
            ME_upsertCalendarForRow_(sh, rowNum, cols);
          }
        }
      } catch (e) {
        Logger.log(`Erreur checkCalendarUpdates ligne ${rowNum}: ${e.message}`);
      }
    }
  });
}