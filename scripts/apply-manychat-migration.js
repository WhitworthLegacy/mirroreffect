#!/usr/bin/env node

const https = require('https');

const SUPABASE_URL = 'https://mjvykjbmykbjhrgsyhxz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdnlramJteWtiamhyZ3N5aHh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE1MDg1NCwiZXhwIjoyMDgzNzI2ODU0fQ.7lXKBuS6l4PwqjJrz6ecy72xr6pVz2tJao5VrK6uLLs';

const SQL_MIGRATION = `
-- Migration: Add ManyChat support
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS manychat_subscriber_id TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_manychat_subscriber
  ON public.leads(manychat_subscriber_id)
  WHERE manychat_subscriber_id IS NOT NULL;

COMMENT ON COLUMN public.leads.manychat_subscriber_id IS 'ManyChat subscriber ID for linking to Messenger conversations';

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_manychat_subscriber_unique
  ON public.leads(manychat_subscriber_id)
  WHERE manychat_subscriber_id IS NOT NULL AND manychat_subscriber_id != '';
`;

const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

const data = JSON.stringify({
  query: SQL_MIGRATION
});

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': data.length
  }
};

console.log('Applying Manychat migration to Supabase...');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', responseData);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration applied successfully!');
    } else {
      console.error('❌ Migration failed');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
