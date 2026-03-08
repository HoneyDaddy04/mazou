-- Mazou Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  plan text not null default 'free' check (plan in ('free', 'growth', 'enterprise')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiles (linked to auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz default now()
);

-- API Keys
create table api_keys (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  total_calls bigint default 0,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- BYOK Keys (encrypted provider keys)
create table byok_keys (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  provider text not null,
  key_encrypted text not null,
  label text not null,
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'error')),
  created_at timestamptz default now()
);

-- Usage Logs
create table usage_logs (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  api_key_id uuid references api_keys(id),
  model text not null,
  provider text not null,
  feature_tag text,
  agent_id uuid,
  input_tokens integer default 0,
  output_tokens integer default 0,
  cost_naira numeric(12,4) default 0,
  latency_ms integer default 0,
  routed_from text,
  routed_to text,
  routing_reason text,
  savings_naira numeric(12,4) default 0,
  cached boolean default false,
  created_at timestamptz default now()
);

-- Create index for fast usage queries
create index idx_usage_logs_org_created on usage_logs(org_id, created_at desc);
create index idx_usage_logs_feature_tag on usage_logs(org_id, feature_tag);
create index idx_usage_logs_model on usage_logs(org_id, model);

-- Agents
create table agents (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  status text not null default 'idle' check (status in ('live', 'idle', 'stopped')),
  models text[] default '{}',
  config jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Routing Rules
create table routing_rules (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  description text not null,
  condition jsonb not null default '{}',
  action jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused')),
  triggers_count integer default 0,
  created_at timestamptz default now()
);

-- Wallets
create table wallets (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  currency text not null check (currency in ('NGN', 'USDT')),
  balance numeric(15,2) default 0,
  auto_fund_threshold numeric(15,2),
  updated_at timestamptz default now(),
  unique(org_id, currency)
);

-- Transactions
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  wallet_id uuid references wallets(id) not null,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(15,2) not null,
  currency text not null check (currency in ('NGN', 'USDT')),
  description text not null,
  reference text,
  paystack_ref text,
  created_at timestamptz default now()
);

create index idx_transactions_org_created on transactions(org_id, created_at desc);

-- Recommendations
create table recommendations (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  type text not null check (type in ('save', 'swap', 'cache', 'batch')),
  title text not null,
  description text not null,
  savings_naira numeric(12,2) default 0,
  impact text not null default 'medium' check (impact in ('high', 'medium', 'low')),
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed')),
  created_at timestamptz default now()
);

-- Row Level Security
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table api_keys enable row level security;
alter table byok_keys enable row level security;
alter table usage_logs enable row level security;
alter table agents enable row level security;
alter table routing_rules enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table recommendations enable row level security;

-- RLS Policies
create policy "Users can view their own org" on organizations
  for select using (id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view profiles in their org" on profiles
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view their org's API keys" on api_keys
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Admins can manage API keys" on api_keys
  for all using (org_id in (select org_id from profiles where id = auth.uid() and role in ('owner', 'admin')));

create policy "Users can view their org's usage" on usage_logs
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view their org's agents" on agents
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view their org's wallets" on wallets
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view their org's transactions" on transactions
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view their org's recommendations" on recommendations
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view their org's routing rules" on routing_rules
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "Users can view their org's BYOK keys" on byok_keys
  for select using (org_id in (select org_id from profiles where id = auth.uid()));

-- Function to deduct from wallet
create or replace function deduct_wallet(p_org_id uuid, p_amount numeric)
returns void as $$
begin
  update wallets
  set balance = balance - p_amount, updated_at = now()
  where org_id = p_org_id and currency = 'NGN' and balance >= p_amount;
end;
$$ language plpgsql security definer;

-- Function to auto-create org + profile on signup
create or replace function handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
  org_name text;
begin
  org_name := coalesce(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 2));

  insert into organizations (name, slug)
  values (org_name, lower(replace(org_name, ' ', '-')) || '-' || substr(gen_random_uuid()::text, 1, 8))
  returning id into new_org_id;

  insert into profiles (id, org_id, email, full_name, role)
  values (new.id, new_org_id, new.email, new.raw_user_meta_data->>'full_name', 'owner');

  -- Create default NGN wallet
  insert into wallets (org_id, currency, balance, auto_fund_threshold)
  values (new_org_id, 'NGN', 0, 500000);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable realtime for usage_logs (for live routing feed)
alter publication supabase_realtime add table usage_logs;
