-- Student Monthly Statistics
CREATE TABLE IF NOT EXISTS student_monthly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  student_name TEXT NOT NULL,
  hours_raw NUMERIC,
  hours_adjusted NUMERIC,
  remuneration_cents INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, student_name)
);

-- Commercial Monthly Statistics
CREATE TABLE IF NOT EXISTS commercial_monthly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  commercial_name TEXT NOT NULL,
  total_calls INTEGER,
  calls_under_30s INTEGER,
  calls_over_30s INTEGER,
  calls_over_1min INTEGER,
  calls_over_2min INTEGER,
  calls_over_5min INTEGER,
  calls_over_5min_pct NUMERIC,
  bonus_calls_cents INTEGER,
  calls_answered INTEGER,
  closed_deals INTEGER,
  conversion_pct NUMERIC,
  commissions_cents INTEGER,
  bonus_conversion_cents INTEGER,
  callbacks_scheduled INTEGER,
  callbacks_completed INTEGER,
  callbacks_completion_pct NUMERIC,
  bonus_callbacks_cents INTEGER,
  total_bonus_cents INTEGER,
  total_tvac_cents INTEGER,
  total_htva_cents INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, commercial_name)
);

-- Monthly Business Statistics
CREATE TABLE IF NOT EXISTS monthly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL UNIQUE,

  -- Marketing metrics
  leads_meta INTEGER,
  spent_meta_cents INTEGER,
  cpl_meta_cents INTEGER,
  closing_meta INTEGER,
  conversion_meta_pct NUMERIC,
  cpa_meta_cents INTEGER,
  leads_total INTEGER,
  cpl_total_cents INTEGER,
  closing_total INTEGER,
  conversion_total_pct NUMERIC,
  cpa_total_cents INTEGER,

  -- Closing by pack
  closing_decouverte INTEGER,
  closing_essentiel INTEGER,
  closing_premium INTEGER,
  deposits_paid_cents INTEGER,

  -- Events by pack
  events_count INTEGER,
  events_decouverte INTEGER,
  events_essentiel INTEGER,
  events_premium INTEGER,

  -- Revenue metrics
  total_event_cents INTEGER,
  deposits_event_cents INTEGER,
  remaining_event_cents INTEGER,
  ca_total_cents INTEGER,
  ca_generated_cents INTEGER,
  transport_cents INTEGER,

  -- Cost metrics
  pack_cost_cents INTEGER,
  student_hours NUMERIC,
  student_cost_cents INTEGER,
  fuel_cost_cents INTEGER,
  commercial_commission_cents INTEGER,
  fixed_charges_cents INTEGER,

  -- Margin & cashflow
  gross_margin_cents INTEGER,
  net_margin_cents INTEGER,
  cashflow_gross_cents INTEGER,
  cashflow_net_cents INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounting Transactions
CREATE TABLE IF NOT EXISTS accounting_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date DATE NOT NULL,
  counterparty TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  sent_to_accountant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_monthly_stats_month ON student_monthly_stats(month);
CREATE INDEX IF NOT EXISTS idx_student_monthly_stats_student ON student_monthly_stats(student_name);
CREATE INDEX IF NOT EXISTS idx_commercial_monthly_stats_month ON commercial_monthly_stats(month);
CREATE INDEX IF NOT EXISTS idx_commercial_monthly_stats_commercial ON commercial_monthly_stats(commercial_name);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_month ON monthly_stats(month);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_date ON accounting_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_counterparty ON accounting_transactions(counterparty);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_monthly_stats_updated_at BEFORE UPDATE ON student_monthly_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_monthly_stats_updated_at BEFORE UPDATE ON commercial_monthly_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_stats_updated_at BEFORE UPDATE ON monthly_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounting_transactions_updated_at BEFORE UPDATE ON accounting_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - optional, adjust as needed
ALTER TABLE student_monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access (adjust as needed for your auth setup)
CREATE POLICY "Enable all access for service role" ON student_monthly_stats FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON commercial_monthly_stats FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON monthly_stats FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON accounting_transactions FOR ALL USING (true);
