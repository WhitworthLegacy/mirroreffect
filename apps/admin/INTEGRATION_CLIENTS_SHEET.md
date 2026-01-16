# Intégration avec la feuille "Clients" existante

Le code a été adapté pour lire et écrire directement dans votre feuille **"Clients"** existante au lieu de créer une nouvelle feuille "Events".

## Mapping des colonnes

### Lecture (Clients → EventRow)

| Colonne "Clients" | Champ EventRow | Notes |
|-------------------|----------------|-------|
| Event ID | id | Identifiant unique |
| Date Event | event_date | Format: YYYY-MM-DD |
| Type Event | event_type | |
| Language | language | fr/nl |
| Nom | client_name | |
| Email | client_email | |
| Phone | client_phone | |
| Lieu Event | address | |
| Pack | pack_id | |
| Pack (€) | total_cents | Converti de euros (virgule) → centimes |
| Transport (€) | transport_fee_cents | Converti de euros (virgule) → centimes |
| Acompte | deposit_cents | Converti de euros (virgule) → centimes |
| Solde Restant | balance_due_cents | Converti de euros (virgule) → centimes |
| Etudiant | student_name | |
| Heures Etudiant | student_hours | |
| KM (Aller) | km_one_way | |
| KM (Total) | km_total | |
| Coût Essence | fuel_cost_cents | Converti de euros (virgule) → centimes |
| Commercial | commercial_name | |
| Comm Commercial | commercial_commission_cents | Converti de euros (virgule) → centimes |
| Marge Brut (Event) | gross_margin_cents | Converti de euros (virgule) → centimes |
| Acompte Facture | deposit_invoice_ref | |
| Solde Facture | balance_invoice_ref | |
| Invités | guest_count | |

### Écriture (EventRow → Clients)

Les valeurs sont converties de centimes → euros avec virgule (format européen).

## Fonctions GAS à ajouter

Ajoutez ces fonctions dans votre `App.gs` (voir `GAS_ADD_TO_YOUR_SCRIPT.gs`) :

1. `handleAdminActions_()` - Route les actions
2. `readSheetForAdmin_()` - Lit la feuille "Clients"
3. `updateRowByEventIdForAdmin_()` - **NOUVELLE** : Met à jour par Event ID avec mapping de colonnes
4. `updateRowForAdmin_()` - Met à jour (cherche par Event ID pour Clients)
5. `deleteRowForAdmin_()` - Supprime (cherche par Event ID pour Clients)

## Important

- Les montants sont convertis automatiquement : **euros (virgule) ↔ centimes**
- Les dates sont normalisées au format **YYYY-MM-DD**
- Les nombres avec virgule sont gérés correctement
- La recherche se fait par **"Event ID"** et non par la première colonne

## Variables d'environnement

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=12X9G62lKRzJSYHZfGQ6jCTMwgOCfdMtkTD6A-GbuwqQ
GAS_WEBAPP_URL=https://script.google.com/macros/s/AKfycbxRn8rubKlfUp6NUHBxoFOTiIcMtFmYqyXZBp3ohUBQ55oZLFqL23COAhAm2VQC0Lv8/exec
GAS_KEY=p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7
```

## Test

1. Créer un event via l'interface admin → doit apparaître dans "Clients" avec un Event ID
2. Modifier un event → doit mettre à jour les colonnes correspondantes dans "Clients"
3. Voir la liste des events → doit lire depuis "Clients" en filtrant les lignes avec Event ID
