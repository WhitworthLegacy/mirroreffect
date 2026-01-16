# 📋 Récapitulatif de l'intégration Google Sheets

## ✅ Ce qui est connecté

### 1. **Lecture depuis Google Sheets (feuille "Clients")**
- ✅ `getAdminSnapshot()` lit depuis Google Sheets (feuille "Clients")
- ✅ Toutes les pages admin lisent depuis Google Sheets
- ✅ Le dashboard lit les stats depuis Google Sheets (feuille "Stats")
- ✅ Fallback vers Supabase si Google Sheets échoue (sécurité)

### 2. **Écriture dans Google Sheets**
- ✅ **POST `/api/events`** → Crée un event dans Google Sheets (feuille "Clients")
- ✅ **PATCH `/api/events`** → Met à jour un event dans Google Sheets
- ✅ **DELETE `/api/events`** → Supprime un event de Google Sheets
- ✅ Toutes les modifications depuis l'interface admin écrivent directement dans Google Sheets

### 3. **Automatisations GAS préservées**
Vos automatisations GAS existantes continuent de fonctionner normalement :

- ✅ **`calculateAndSetLogistics_()`** - Calcul automatique KM, Coût Essence, Heures Étudiant quand le lieu change
- ✅ **`ME_upsertCalendarForRow_()`** - Synchronisation avec Google Calendar
- ✅ **`checkPostEventTriggers()`** - Emails post-event (J+1, J+3, M+9)
- ✅ **`ME_processInvoicesBatchCore_()`** - Création automatique de factures ZenFacture
- ✅ **`ME_onEdit()`** - Trigger onEdit pour recalculer quand lieu modifié
- ✅ **`ME_periodicSync_()`** - Synchronisation périodique (toutes les 15 min)
- ✅ **`checkCalendarUpdates_()`** - Synchronisation inverse Agenda → Sheet
- ✅ **`_handleDslrBoothTrigger_()`** - Intégration DSLR Booth
- ✅ **`ME_checkAvailabilityClientsConfirmed_()`** - Vérification disponibilité (ManyChat)

**Aucune de ces fonctions n'a été modifiée !** Seules des fonctions d'admin ont été ajoutées.

### 4. **Mapping automatique**
- ✅ Conversion euros (virgule) ↔ centimes automatique
- ✅ Mapping des colonnes "Clients" → EventRow
- ✅ Recherche par "Event ID" (pas la première colonne)

## ⚠️ Points d'attention

### Routes API qui utilisent encore Supabase (pour events)
Ces routes doivent être adaptées si vous voulez qu'elles utilisent aussi Google Sheets :

- `/api/events/recalculate` - Utilise encore Supabase pour lire l'event
- `/api/public/checkout` (web app) - Crée des events dans Supabase
- `/api/public/event-intent` (web app) - Crée/modifie des events dans Supabase

**Note** : Ces routes peuvent continuer à utiliser Supabase si vous préférez, ou on peut les adapter pour Google Sheets aussi.

### Packs
- Les packs sont toujours lus depuis Supabase (pas encore migré vers Google Sheets)
- Si vous voulez, on peut aussi les mettre dans Google Sheets

## 🔄 Flux de données

```
┌─────────────────┐
│  Admin Frontend │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  /api/events    │────▶│  Google Sheets   │
│  (POST/PATCH)   │     │  (Feuille Clients)│
└─────────────────┘     └──────────────────┘
                                │
                                │ (Automatisations GAS)
                                ▼
                    ┌──────────────────────────┐
                    │  - Calcul KM/Essence     │
                    │  - Sync Google Calendar │
                    │  - Emails post-event    │
                    │  - Factures ZenFacture  │
                    └──────────────────────────┘
```

## ✅ Checklist finale

- [x] Admin lit depuis Google Sheets (feuille "Clients")
- [x] Modifications admin écrivent dans Google Sheets
- [x] Automatisations GAS préservées et fonctionnelles
- [x] Mapping des colonnes "Clients" → EventRow
- [x] Conversion euros ↔ centimes automatique
- [x] Dashboard lit depuis Google Sheets (feuille "Stats")
- [x] Fallback Supabase si Google Sheets échoue

## 🚀 Prochaines étapes (optionnel)

1. Adapter `/api/events/recalculate` pour lire depuis Google Sheets
2. Adapter les routes web app (`/api/public/checkout`, `/api/public/event-intent`) pour écrire dans Google Sheets
3. Migrer les packs vers Google Sheets (ou les garder dans Supabase)

Tout est prêt ! 🎉
