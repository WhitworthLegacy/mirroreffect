# 📋 SHEETS_CONTRACT - Contrat des Feuilles Google Sheets

## Vue d'Ensemble

Le projet utilise **4 feuilles Google Sheets** comme source de vérité unique:

1. **Clients** - Events + Finance (tous les champs)
2. **Stats** - Statistiques mensuelles (KPIs, marges, cashflow)
3. **Students** - Stats mensuelles par étudiant
4. **Commercial** - Stats mensuelles par commercial

**⚠️ IMPORTANT:** Les noms de colonnes sont **sensibles à la casse** et doivent correspondre **exactement** à ceux définis ci-dessous.

---

## Feuille "Clients"

### Usage
Source de vérité pour tous les events. Chaque ligne = 1 event.

### Colonne Clé
- **`Event ID`** (obligatoire, unique) - Identifiant de l'event (UUID ou format custom)

### Headers Requis (Ordre Recommandé)

```
Event ID | Date Event | Type Event | Language | Nom | Email | Phone | Lieu Event | Pack | Pack (€) | Total | Transport (€) | Supplément | Supplément (h) | Supplément (€) | Date acompte payé | Acompte | Solde Restant | Etudiant | Heures Etudiant | Etudiant €/Event | KM (Aller) | KM (Total) | Coût Essence | Commercial | Comm Commercial | Marge Brut (Event) | Lien Invoice | Lien Galerie | Lien ZIP | Sync Status | Review Status | Annual Offer Status | Acompte Facture | Solde Facture | Invités
```

### Headers Principaux (Minimal Requis)

| Header | Type | Format | Exemple | Notes |
|--------|------|--------|---------|-------|
| `Event ID` | string | UUID ou custom | `event-1234567890-abc` | **OBLIGATOIRE**, unique |
| `Date Event` | date | `YYYY-MM-DD` ou `DD/MM/YYYY` | `2025-01-15` | Date de l'event |
| `Type Event` | string | - | `Mariage`, `B2B` | Type d'event |
| `Language` | string | `fr` ou `nl` | `fr` | Langue |
| `Nom` | string | - | `John Doe` | Nom client |
| `Email` | string | email | `john@example.com` | Email client |
| `Phone` | string | - | `+32 123 45 67 89` | Téléphone client |
| `Lieu Event` | string | - | `123 Rue Example, Bruxelles` | Adresse |
| `Pack` | string | - | `Premium`, `Essentiel` | Pack sélectionné |
| `Total` | number | Format européen `"1.234,56"` | `"700,00"` | **Source de vérité** (pas `Pack (€)`) |
| `Transport (€)` | number | Format européen | `"50,00"` | Frais transport |
| `Acompte` | number | Format européen | `"180,00"` | Acompte payé |
| `Solde Restant` | number | Format européen | `"520,00"` | **Source de vérité** |
| `Etudiant` | string | - | `Abdel` | Nom étudiant assigné |
| `Heures Etudiant` | number | Format européen | `"4,5"` | Heures travaillées |
| `Etudiant €/Event` | number | Format européen | `"70,00"` | **Source de vérité** (taux) |
| `KM (Aller)` | number | Format européen | `"65,0"` | KM aller |
| `KM (Total)` | number | Format européen | `"260,0"` | KM total |
| `Coût Essence` | number | Format européen | `"39,00"` | Coût essence |
| `Commercial` | string | - | `Jean Dupont` | Nom commercial |
| `Comm Commercial` | number | Format européen | `"0,00"` | Commission |
| `Marge Brut (Event)` | number | Format européen | `"342,00"` | **Source de vérité** (pas de calcul) |
| `Acompte Facture` | string | - | `2025_0001` | Référence facture acompte |
| `Solde Facture` | string | - | `2025_0002` | Référence facture solde |
| `Invités` | number | - | `150` | Nombre d'invités |

### Format des Nombres

**⚠️ CRITIQUE:** Les nombres doivent être au **format européen**:
- **Décimal:** Virgule (`,`)
- **Milliers:** Point (`.`)
- **Exemples:**
  - `"700,00"` = 700 euros
  - `"1.234,56"` = 1234.56 euros
  - `"4,5"` = 4.5 heures

**Conversion dans le code:**
- Lecture: `"1.234,56"` → `123456` centimes (dans TypeScript)
- Écriture: `123456` centimes → `"1.234,56"` (dans Sheets)

### Mapping TypeScript

**Type:** `EventRow` (défini dans `apps/admin/lib/adminData.ts`)

**Mapping fichier:** `apps/admin/lib/googleSheets.ts` - `mapClientsRowToEventRow()` (ligne ~960)

**⚠️ DUPLICATION:** Ce mapping existe aussi dans:
- `apps/admin/lib/clientsStore.ts:10`
- `apps/admin/lib/sheetsStore.ts:12`

**Recommandation:** Centraliser dans `googleSheets.ts` uniquement.

---

## Feuille "Stats"

### Usage
Statistiques mensuelles agrégées (KPIs, marges, cashflow).

### Colonne Clé
- **`Date`** (obligatoire, format `YYYY-MM-01`) - Premier jour du mois

### Headers Recommandés (Exemple)

```
Date | # Leads META | Spent META | CPL META | # closing META | Conversion (%) META | CPA META | # Leads Total | CPL Total | # closing Total | Conversion (%) total | CPA G | # C.Découverte | # C.Essentiel | # C.Premium | Acomptes (payés) | # Events | # E.Découverte | # E.Essentiel | # E.Premium | Total (event) | Acomptes (event) | Restants (event) | CA (Acomptes + Restants) | CA généré (Event + Transport) | € transport (Ev. Réalisés) | Coût packs (Ev. Réalisés) | Heures étudiants | Coût staff étudiants | Essence | Comm Commerciaux | Charges fixes mensuelles | Marge brute opé. (Events) | Marge nette opé. (Events) | Cashflow Brut (mensuel) | Cashflow Net (mensuel)
```

### Headers Principaux

| Header | Type | Format | Notes |
|--------|------|--------|-------|
| `Date` | date | `YYYY-MM-01` | **OBLIGATOIRE**, format `2025-01-01` |
| `# Events` | number | - | Nombre d'events du mois |
| `Total (event)` | number | Format européen | CA total events |
| `Marge brute opé. (Events)` | number | Format européen | Marge brute |
| `Cashflow Net (mensuel)` | number | Format européen | Cashflow net |

### Actions GAS

- **Lecture:** `readSheet` - Retourne toutes les lignes
- **Écriture:** `updateRowByCompositeKey` - Clé: `Date` + (optionnel)

---

## Feuille "Students"

### Usage
Statistiques mensuelles par étudiant (heures, coûts, etc.).

### Colonnes Clés (Composite)
- **`month`** (obligatoire) - Mois au format `YYYY-MM`
- **`student_name`** (obligatoire) - Nom de l'étudiant

### Headers Recommandés

```
month | student_name | hours | cost_cents | events_count | ...
```

### Actions GAS

- **Lecture:** `readSheet` - Retourne toutes les lignes
- **Écriture:** `updateRowByCompositeKey` - Clé: `month` + `student_name`

---

## Feuille "Commercial"

### Usage
Statistiques mensuelles par commercial (commission, leads, etc.).

### Colonnes Clés (Composite)
- **`month`** (obligatoire) - Mois au format `YYYY-MM`
- **`commercial_name`** (obligatoire) - Nom du commercial

### Headers Recommandés

```
month | commercial_name | leads | closings | commission_cents | ...
```

### Actions GAS

- **Lecture:** `readSheet` - Retourne toutes les lignes
- **Écriture:** `updateRowByCompositeKey` - Clé: `month` + `commercial_name`

---

## Validation des Headers

### Script de Vérification

Pour vérifier que vos headers correspondent au contrat:

1. **Exporter la première ligne** de chaque feuille
2. **Comparer avec** les headers listés ci-dessus
3. **Vérifier la casse** (ex: `Event ID` pas `event id` ou `EventId`)
4. **Vérifier les espaces** (ex: `KM (Aller)` pas `KM(Aller)`)

### Exemple CSV de Référence

Des exemples de structure sont disponibles dans:
- `files/csv/clients.csv` - Structure Clients
- `files/csv/stats.csv` - Structure Stats
- `files/csv/students.csv` - Structure Students
- `files/csv/commercial.csv` - Structure Commercial

---

## Modifications des Headers

### ⚠️ Changement Risqué

Si vous modifiez un header dans Sheets:

1. **Mettre à jour le mapping** dans `apps/admin/lib/googleSheets.ts` - `mapClientsRowToEventRow()`
2. **Mettre à jour** `apps/admin/lib/clientsStore.ts` - `mapClientsRowToEventRow()` (si utilisé)
3. **Mettre à jour** `apps/admin/lib/sheetsStore.ts` - `mapClientsRowToEventRow()` (si utilisé)
4. **Mettre à jour** `apps/admin/lib/googleSheets.ts` - `mapEventRowToClientsValues()` (écriture)
5. **Tester** toutes les opérations CRUD

### ✅ Recommandation

**Ne PAS modifier les headers existants.** Si besoin de nouveaux champs:
- Ajouter des colonnes à droite
- Ne pas supprimer/renommer les colonnes existantes
- Mettre à jour uniquement le mapping pour les nouvelles colonnes

---

## Exemple de Données

### Clients (Ligne Complète)

```
event-123 | 2025-01-15 | Mariage | fr | John Doe | john@example.com | +32 123 45 67 89 | 123 Rue Example, Bruxelles | Premium | 700,00 | 700,00 | 50,00 | | | | | 180,00 | 520,00 | Abdel | 4,5 | 70,00 | 65,0 | 260,0 | 39,00 | Jean Dupont | 0,00 | 342,00 | | | | OK | | | 2025_0001 | 2025_0002 | 150
```

### Stats (Ligne Complète)

```
2025-01-01 | 10 | 750,00 | 75,00 | 4 | 40 | 187,50 | 10 | 75,00 | 4 | 40 | 187,50 | 1 | 1 | 2 | 4 | 4 | 1 | 1 | 2 | 2320,00 | 0,00 | 2320,00 | 2320,00 | 2400,00 | 80,00 | 254,37 | 19 | 280,00 | 168,60 | 0,00 | 441,64 | 1537,03 | 1697,03 | 505,39
```

---

**Dernière mise à jour:** 2026-01-12  
**Version Contrat:** 1.0
