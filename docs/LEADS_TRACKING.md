# Documentation: Tracking des Leads et CTAs

## Vue d'ensemble

Ce document décrit le système de tracking des leads et des CTAs (Call To Action) pour le flux de réservation. Le système capture les données à chaque étape du parcours utilisateur et enregistre les interactions avec les boutons CTA dans Google Sheets (sheet "Leads").

## Architecture

### Source de vérité
- **Google Sheets "Leads"** : Stockage principal de tous les leads
- **sessionStorage** : Stockage temporaire côté client pour `lead_id` et paramètres UTM

### Flux de données

```
┌─────────────────────┐
│  ReservationFlow    │ (Client)
│  - trackLeadStep()  │
│  - trackCTA()       │
└──────────┬──────────┘
           │ POST /api/public/leads
           ▼
┌─────────────────────┐
│ /api/public/leads   │ (Next.js API Route)
│  - Normalise dates  │
│  - Gère update/     │
│    create           │
└──────────┬──────────┘
           │ POST GAS
           ▼
┌─────────────────────┐
│  GAS WebApp         │ (Google Apps Script)
│  - appendRow        │
│  - updateRowByLeadId│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Google Sheets      │
│  Sheet "Leads"      │
└─────────────────────┘
```

## Composants

### 1. Helper de tracking (`lib/tracking.ts`)

#### `captureUTMParams()`
- **Usage**: À appeler au premier chargement de la page
- **Action**: Capture les paramètres UTM depuis l'URL et les stocke dans `sessionStorage`
- **Paramètres capturés**: `utm_source`, `utm_medium`, `utm_campaign`

#### `trackLeadStep(stepNumber, status, partialPayload)`
- **Usage**: Track une étape du parcours utilisateur
- **Action**:
  - Si `lead_id` existe dans `sessionStorage`, met à jour la ligne existante
  - Sinon, crée une nouvelle ligne dans "Leads"
  - Normalise les dates DD/MM/YYYY → YYYY-MM-DD
  - Injecte automatiquement les UTM parameters
- **Retour**: `lead_id` (string | null)

#### `trackCTA(ctaId, label, step, extra)`
- **Usage**: Track un CTA (bouton d'action business)
- **Action**: Met à jour les champs "Last CTA", "Last CTA Label", "Last CTA Value", "Last CTA At" dans la ligne du lead
- **Prérequis**: Un `lead_id` doit exister dans `sessionStorage`

### 2. API Route (`app/api/public/leads/route.ts`)

#### POST `/api/public/leads`

**Schéma de validation (Zod)**:
- `lead_id` (optionnel): ID du lead existant
- `language`: "fr" | "nl"
- `client_name`, `client_email`, `client_phone`: Informations client
- `event_date`: Date de l'événement (normalisée automatiquement)
- `address`: Lieu de l'événement
- `pack_code`, `guests`, `transport_euros`, `total_euros`, `deposit_euros`: Informations de réservation
- `utm_source`, `utm_campaign`, `utm_medium`: Paramètres UTM
- `step`, `status`: Étape courante et statut
- `cta_id`, `cta_label`, `cta_value`, `updated_at`: Champs pour tracking CTA

**Logique**:
1. **Si `cta_id` + `lead_id` fournis**: Update uniquement les champs CTA
2. **Si `lead_id` fourni (sans `cta_id`)**: Update complet de la ligne du lead
3. **Sinon**: Création d'une nouvelle ligne

**Normalisation des dates**:
- Accepte les formats DD/MM/YYYY et YYYY-MM-DD
- Convertit toujours en YYYY-MM-DD avant écriture

## Étape 5 → 6: Point critique

### Problème résolu
Lors du clic sur "Continuer" à l'étape 5, le système:
1. Appelle `captureLeadIntent()` qui utilise `trackLeadStep(5, "step_5_completed", ...)`
2. `trackLeadStep` vérifie si un `lead_id` existe dans `sessionStorage`
3. Si oui: met à jour la ligne existante via `updateRowByLeadId`
4. Si non: crée une nouvelle ligne et stocke le `lead_id` retourné dans `sessionStorage`
5. Les données sont toujours écrites dans "Leads", jamais dans "Clients"

### Payload à l'étape 5

```typescript
{
  language: "fr" | "nl",
  client_name: string,
  client_email: string,
  client_phone: string,
  event_date: string, // Normalisé YYYY-MM-DD
  address: string,
  pack_code?: string,
  guests?: string,
  transport_euros?: string,
  total_euros?: string,
  deposit_euros?: string
}
```

## Tracking des CTAs

### CTAs trackés

Les vrais boutons CTA (pas navigation pure) sont trackés :

| Step | CTA ID | Label | Contexte |
|------|--------|-------|----------|
| 2 | `vibe_{id}` | Label du vibe | Sélection d'ambiance |
| 3 | `theme_{id}` | Label du thème | Sélection de couleur |
| 6 | `pack_{code}` | Nom du pack | Sélection de pack |
| 6 | `option_{code}` | Label de l'option | Sélection d'option (tapis rouge, album, etc.) |
| 6 | `option_stanchions` | Label stanchions | Activation stanchions |
| 6 | `option_stanchions_color` | Label avec couleur | Changement couleur stanchions |

### Champs "Leads" pour CTAs

- **Last CTA**: ID du dernier CTA (ex: `pack_PREMIUM`)
- **Last CTA Label**: Label humain (ex: "Premium")
- **Last CTA Value**: JSON stringifié avec données additionnelles (ex: `{"pack_code":"PREMIUM","price":490}`)
- **Last CTA At**: ISO datetime du dernier CTA

## Structure du sheet "Leads"

### Colonnes principales

| Colonne | Type | Description |
|---------|------|-------------|
| Lead ID | string | Identifiant unique du lead |
| Created At | ISO datetime | Date de création |
| Updated At | ISO datetime | Date de dernière mise à jour |
| Step | string | Numéro d'étape (1-7) |
| Status | string | Statut (ex: "step_5_completed", "intent") |
| Language | "fr" \| "nl" | Langue |
| Nom | string | Nom complet |
| Email | string | Email |
| Phone | string | Téléphone |
| Date Event | YYYY-MM-DD | Date de l'événement (toujours ISO) |
| Lieu Event | string | Adresse/lieu |
| Pack | string | Code du pack (DISCOVERY, ESSENTIAL, PREMIUM) |
| Invités | string | Nombre d'invités |
| Transport (€) | string | Frais transport formaté |
| Total | string | Total formaté |
| Acompte | string | Acompte formaté |
| UTM Source | string | Source UTM |
| UTM Campaign | string | Campaign UTM |
| UTM Medium | string | Medium UTM |
| Last CTA | string | ID du dernier CTA |
| Last CTA Label | string | Label du dernier CTA |
| Last CTA Value | string | Valeur JSON du dernier CTA |
| Last CTA At | ISO datetime | Timestamp du dernier CTA |

## Normalisation des dates

### Formats acceptés
- **DD/MM/YYYY** (ex: `24/01/2026`)
- **YYYY-MM-DD** (ex: `2026-01-24`)

### Format de stockage
Toujours **YYYY-MM-DD** dans Google Sheets

### Normalisation
- **Côté client** (`lib/tracking.ts`): `normalizeDateToISO()` convertit DD/MM/YYYY → YYYY-MM-DD
- **Côté serveur** (`app/api/public/leads/route.ts`): Utilise `normalizeDateToISO()` de `lib/date.ts` comme fallback

## Logs de développement

### Côté client
- `console.warn()` utilisé uniquement en mode développement
- Préfixe: `[tracking]` ou `[ReservationFlow]`

### Côté serveur
- `console.log()` / `console.warn()` utilisés uniquement si `NODE_ENV !== "production"`
- Préfixes: `[leads]`, `[event-intent]`, `[availability]`

## Plan de test manuel

### Test 1: Création lead étape 5
1. Ouvrir `/reservation?utm_source=meta&utm_medium=cpc&utm_campaign=test`
2. Remplir jusqu'à l'étape 5:
   - Step 1: Type événement, date, lieu → Vérifier disponibilité
   - Step 2: Sélectionner un vibe (tracked)
   - Step 3: Sélectionner un thème (tracked)
   - Step 4: Nombre d'invités, priorité
   - Step 5: Prénom, nom, email, téléphone
3. Cliquer "Continuer" (step 5 → 6)
4. **Vérifier dans Google Sheets "Leads"**:
   - Une nouvelle ligne est créée avec `Lead ID`, `Created At`, `Step: "5"`, `Status: "step_5_completed"`
   - Tous les champs sont remplis (Nom, Email, Phone, Date Event, Lieu Event, etc.)
   - UTM parameters sont présents

### Test 2: Update lead étape 6
1. Continuer le test précédent
2. À l'étape 6: Sélectionner un pack (tracked)
3. Cliquer "Continuer" (step 6 → 7)
4. **Vérifier dans Google Sheets "Leads"**:
   - La même ligne (même `Lead ID`) est mise à jour
   - `Step` devient `"6"` (si tracké), `Status` mis à jour
   - `Pack` est rempli

### Test 3: Tracking CTAs
1. Dans le même parcours, noter les CTAs trackés:
   - Sélection vibe → `Last CTA: "vibe_chic"` (exemple)
   - Sélection theme → `Last CTA: "theme_gold"` (exemple)
   - Sélection pack → `Last CTA: "pack_PREMIUM"`
   - Sélection option → `Last CTA: "option_RED_CARPET"`
2. **Vérifier dans Google Sheets "Leads"**:
   - `Last CTA`, `Last CTA Label`, `Last CTA Value`, `Last CTA At` sont mis à jour à chaque CTA
   - `Last CTA At` est une ISO datetime

### Test 4: Normalisation dates
1. Tester avec une date au format DD/MM/YYYY dans `eventDate` (si possible)
2. **Vérifier**: La date est stockée en YYYY-MM-DD dans "Leads"

### Test 5: Update via lead_id
1. Recharger la page après création d'un lead
2. `sessionStorage` doit contenir `mirroreffect_lead_id`
3. Compléter jusqu'à l'étape 5 et cliquer "Continuer"
4. **Vérifier**: La ligne existante est mise à jour, pas de nouvelle ligne créée

## Notes importantes

### Ne jamais écrire dans "Clients"
- Le tracking utilise uniquement le sheet "Leads"
- `/api/public/event-intent` peut écrire dans "Leads" (pas "Clients") si nécessaire

### Gestion des erreurs
- Si `trackLeadStep` échoue, retourne `null` mais n'interrompt pas le flux utilisateur
- Les logs en dev permettent de diagnostiquer les problèmes
- Les erreurs côté serveur retournent des codes HTTP appropriés (400, 500)

### SessionStorage
- Les données sont perdues à la fermeture de l'onglet
- Un nouvel onglet démarre avec un nouveau `lead_id`
- Cela permet de distinguer les sessions utilisateur

## Fichiers modifiés/créés

### Nouveaux fichiers
- `apps/web/lib/tracking.ts`: Helper de tracking
- `docs/LEADS_TRACKING.md`: Cette documentation

### Fichiers modifiés
- `apps/web/components/home/ReservationFlow.tsx`: Utilise `trackLeadStep` et `trackCTA`
- `apps/web/app/api/public/leads/route.ts`: Support update via `updateRowByLeadId`, support CTAs

### Fichiers non modifiés (contrainte)
- Backend GAS existant (sauf si nécessaire via `updateRowByLeadId` qui existe déjà)
