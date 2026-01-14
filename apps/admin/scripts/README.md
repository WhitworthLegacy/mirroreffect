# Scripts d'import de données

Ce dossier contient tous les scripts nécessaires pour importer les données Excel dans Supabase.

## 📋 Vue d'ensemble

Le fichier Excel `CLIENTS (1).xlsx` contient 6 pages différentes:

1. **Clients** - Données clients et événements (147 lignes)
2. **Students** - Statistiques mensuelles des étudiants (3 lignes)
3. **Commercial** - Performance des commerciaux (6 lignes)
4. **Stats** - Statistiques business mensuelles (30 lignes)
5. **KPI** - Pricing et configuration (18 lignes)
6. **Compta** - Transactions comptables (237 lignes)

## 🗄️ Tables Supabase créées

### 1. `student_monthly_stats`
Statistiques mensuelles des étudiants/freelances
- `month`: Mois de référence
- `student_name`: Nom de l'étudiant
- `hours_raw`: Heures brutes
- `hours_adjusted`: Heures corrigées
- `remuneration_cents`: Rémunération en centimes

### 2. `commercial_monthly_stats`
Performance mensuelle des commerciaux
- `month`: Mois de référence
- `commercial_name`: Nom du commercial
- `total_calls`: Nombre total d'appels
- `calls_over_5min`: Appels > 5 min
- `conversion_pct`: Taux de conversion
- `commissions_cents`: Commissions en centimes
- `bonus_*`: Différents bonus
- etc.

### 3. `monthly_stats`
Statistiques business mensuelles complètes
- Métriques marketing (leads, CPL, CPA)
- Métriques événements (par pack)
- Métriques revenue (CA, marges)
- Métriques coûts (staff, transport, charges)
- Cashflow brut et net

### 4. `accounting_transactions`
Transactions comptables détaillées
- `transaction_date`: Date de la transaction
- `counterparty`: Contrepartie
- `amount_cents`: Montant en centimes
- `sent_to_accountant`: Envoyé au comptable (boolean)

## 🚀 Utilisation

### Étape 1: Extraire toutes les pages Excel en CSV

```bash
cd apps/admin
pnpm extract:sheets
```

Cela va créer 6 fichiers CSV dans `/files/csv/`:
- `clients.csv`
- `students.csv`
- `commercial.csv`
- `stats.csv`
- `kpi.csv`
- `compta.csv`

### Étape 2: Créer les tables dans Supabase

Option A - Via le dashboard Supabase (RECOMMANDÉ):
1. Ouvrir le dashboard Supabase
2. Aller dans SQL Editor
3. Copier/coller le contenu de `scripts/create-tables.sql`
4. Exécuter

Option B - Via psql:
```bash
psql <YOUR_DB_CONNECTION_STRING> -f scripts/create-tables.sql
```

Option C - Via le script (peut ne pas fonctionner selon les permissions):
```bash
pnpm db:migrate
```

### Étape 3: Importer toutes les données

```bash
pnpm import:all
```

Cela va importer:
- ✓ Statistiques des étudiants (3 entrées)
- ✓ Statistiques commerciales (6 entrées)
- ✓ Statistiques mensuelles business (30 entrées)
- ✓ Transactions comptables (237 entrées)

## 📝 Scripts disponibles

- `pnpm extract:sheets` - Extrait toutes les pages Excel en CSV
- `pnpm db:migrate` - Crée les tables Supabase
- `pnpm import:all` - Importe toutes les données
- `pnpm import:students` - Importe uniquement les données étudiants (ancien script pour event_finance)

## 🔧 Variables d'environnement requises

Assurez-vous d'avoir ces variables dans votre `.env.local`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📊 Utilisation dans l'admin

Une fois les données importées, vous pouvez les utiliser dans vos pages:

```typescript
// Exemple pour récupérer les stats mensuelles
const { data: monthlyStats } = await supabase
  .from("monthly_stats")
  .select("*")
  .order("month", { ascending: false })
  .limit(12);

// Exemple pour les stats commerciales
const { data: commercialStats } = await supabase
  .from("commercial_monthly_stats")
  .select("*")
  .order("month", { ascending: false });

// Exemple pour les transactions comptables
const { data: transactions } = await supabase
  .from("accounting_transactions")
  .select("*")
  .order("transaction_date", { ascending: false })
  .limit(100);
```

## ⚠️ Notes importantes

1. **Unicité**: Les tables utilisent des contraintes UNIQUE pour éviter les doublons:
   - `student_monthly_stats`: (month, student_name)
   - `commercial_monthly_stats`: (month, commercial_name)
   - `monthly_stats`: (month)

2. **Montants**: Tous les montants sont stockés en centimes pour éviter les problèmes d'arrondi

3. **Dates**: Toutes les dates sont au format ISO (YYYY-MM-DD)

4. **KPI sheet**: Non importée car c'est principalement de la configuration statique. Si besoin, créer une table séparée.

## 🔄 Mise à jour des données

Pour mettre à jour avec un nouveau fichier Excel:

1. Remplacer `/files/CLIENTS (1).xlsx`
2. Relancer `pnpm extract:sheets`
3. Relancer `pnpm import:all`

Les données seront mise à jour automatiquement grâce aux contraintes UPSERT.
