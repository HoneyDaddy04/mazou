-- Mazou Supabase Migration
-- Creates all 12 tables + RLS policies
-- Run in Supabase SQL Editor

-- ══════════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ══════════════════════════════════════════════════════════════════════

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supabase_uid UUID UNIQUE,  -- links to auth.users.id
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  is_superadmin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'live',
  last_used_at TIMESTAMPTZ,
  total_calls INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  rate_limit_rpm INTEGER NOT NULL DEFAULT 600,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL REFERENCES profiles(id)
);
CREATE INDEX IF NOT EXISTS ix_api_keys_hash ON api_keys(key_hash);

-- BYOK Keys
CREATE TABLE IF NOT EXISTS byok_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  key_encrypted TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'NGN',
  balance_kobo BIGINT NOT NULL DEFAULT 0,
  auto_fund_threshold_kobo BIGINT,
  auto_fund_amount_kobo BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_kobo BIGINT NOT NULL,
  balance_after_kobo BIGINT NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  paystack_ref TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Token Bundles (fixed-rate prepaid token packages)
CREATE TABLE IF NOT EXISTS token_bundles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_tokens BIGINT NOT NULL,
  remaining_tokens BIGINT NOT NULL,
  price_kobo BIGINT NOT NULL,
  rate_per_million_kobo BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_token_bundles_org ON token_bundles(org_id, status);

-- Usage Logs
CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  api_key_id TEXT NOT NULL REFERENCES api_keys(id),
  request_id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  feature_tag TEXT,
  agent_tag TEXT,
  agent_id TEXT,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_kobo BIGINT NOT NULL,
  latency_ms INTEGER NOT NULL,
  routed_from TEXT,
  routed_to TEXT,
  routing_reason TEXT,
  savings_kobo BIGINT NOT NULL DEFAULT 0,
  cached BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'success',
  is_test BOOLEAN NOT NULL DEFAULT false,
  bundle_id TEXT REFERENCES token_bundles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_usage_org_created ON usage_logs(org_id, created_at);
CREATE INDEX IF NOT EXISTS ix_usage_org_model ON usage_logs(org_id, model);
CREATE INDEX IF NOT EXISTS ix_usage_org_tag ON usage_logs(org_id, feature_tag);
CREATE INDEX IF NOT EXISTS ix_usage_org_agent_tag ON usage_logs(org_id, agent_tag);

-- Agents
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  models TEXT NOT NULL DEFAULT '[]',
  config TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Routing Rules
CREATE TABLE IF NOT EXISTS routing_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT '{}',
  action TEXT NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  triggers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  savings_kobo BIGINT NOT NULL,
  impact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_cost_kobo BIGINT NOT NULL,
  total_calls INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════

-- Helper: get org_id for current Supabase auth user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS TEXT AS $$
  SELECT org_id FROM profiles WHERE supabase_uid = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE byok_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Org-scoped read/write policies
-- Users can only access data belonging to their organization

CREATE POLICY "org_read" ON organizations FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "org_read" ON profiles FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON api_keys FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON byok_keys FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON wallets FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON wallet_transactions FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON usage_logs FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON agents FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON routing_rules FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON recommendations FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON token_bundles FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "org_read" ON invoices FOR SELECT USING (org_id = get_user_org_id());

-- Write policies (insert/update) for tables users can modify
CREATE POLICY "org_insert" ON api_keys FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "org_update" ON api_keys FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "org_insert" ON byok_keys FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "org_update" ON byok_keys FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "org_insert" ON agents FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "org_update" ON agents FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "org_insert" ON routing_rules FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "org_update" ON routing_rules FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "org_delete" ON routing_rules FOR DELETE USING (org_id = get_user_org_id());
CREATE POLICY "org_update" ON recommendations FOR UPDATE USING (org_id = get_user_org_id());

-- ══════════════════════════════════════════════════════════════════════
-- 3. AUTO-CREATE PROFILE ON SIGNUP (Supabase Auth trigger)
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id TEXT;
  org_name TEXT;
BEGIN
  org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || '-org');

  -- Create organization
  INSERT INTO organizations (name, slug, plan)
  VALUES (org_name, lower(replace(org_name, ' ', '-')), 'free')
  RETURNING id INTO new_org_id;

  -- Create profile linked to auth user
  INSERT INTO profiles (org_id, supabase_uid, email, full_name, role)
  VALUES (
    new_org_id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'owner'
  );

  -- Create NGN wallet
  INSERT INTO wallets (org_id, currency, balance_kobo)
  VALUES (new_org_id, 'NGN', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
