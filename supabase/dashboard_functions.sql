-- ============================================================================
-- Mazou PostgreSQL functions for Supabase RPC
-- Run this in Supabase SQL Editor to create all required functions.
-- ============================================================================

-- ── Wallet atomic operations ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION wallet_atomic_debit(p_org_id TEXT, p_amount BIGINT)
RETURNS JSON AS $$
DECLARE
  v_wallet_id TEXT;
  v_new_balance BIGINT;
BEGIN
  UPDATE wallets
  SET balance_kobo = balance_kobo - p_amount,
      updated_at = NOW()
  WHERE org_id = p_org_id
    AND currency = 'NGN'
    AND balance_kobo >= p_amount
  RETURNING id, balance_kobo INTO v_wallet_id, v_new_balance;

  IF v_wallet_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object('wallet_id', v_wallet_id, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION wallet_atomic_credit(p_org_id TEXT, p_amount BIGINT)
RETURNS JSON AS $$
DECLARE
  v_wallet_id TEXT;
  v_new_balance BIGINT;
BEGIN
  UPDATE wallets
  SET balance_kobo = balance_kobo + p_amount,
      updated_at = NOW()
  WHERE org_id = p_org_id
    AND currency = 'NGN'
  RETURNING id, balance_kobo INTO v_wallet_id, v_new_balance;

  IF v_wallet_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object('wallet_id', v_wallet_id, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;


-- ── Dashboard aggregation functions ───────────────────────────────────────

CREATE OR REPLACE FUNCTION dashboard_stats(p_org_id TEXT, p_since TIMESTAMPTZ)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_cost', COALESCE(SUM(cost_kobo), 0),
    'total_calls', COUNT(*),
    'active_models', COUNT(DISTINCT model),
    'total_savings', COALESCE(SUM(savings_kobo), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND is_test = false;
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION dashboard_prev_cost(p_org_id TEXT, p_since TIMESTAMPTZ, p_until TIMESTAMPTZ)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_cost', COALESCE(SUM(cost_kobo), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND created_at < p_until
    AND is_test = false;
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION dashboard_features(p_org_id TEXT, p_since TIMESTAMPTZ)
RETURNS SETOF JSON AS $$
  SELECT json_build_object(
    'feature_tag', feature_tag,
    'calls', COUNT(*),
    'cost', COALESCE(SUM(cost_kobo), 0),
    'savings', COALESCE(SUM(savings_kobo), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND is_test = false
  GROUP BY feature_tag
  ORDER BY SUM(cost_kobo) DESC NULLS LAST
  LIMIT 20;
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION dashboard_models(p_org_id TEXT, p_since TIMESTAMPTZ)
RETURNS SETOF JSON AS $$
  SELECT json_build_object(
    'model', model,
    'provider', provider,
    'calls', COUNT(*),
    'cost', COALESCE(SUM(cost_kobo), 0),
    'input_tokens', COALESCE(SUM(input_tokens), 0),
    'output_tokens', COALESCE(SUM(output_tokens), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND is_test = false
  GROUP BY model, provider
  ORDER BY SUM(cost_kobo) DESC NULLS LAST
  LIMIT 20;
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION dashboard_usage_timeseries(
  p_org_id TEXT,
  p_since TIMESTAMPTZ,
  p_model TEXT DEFAULT NULL,
  p_tag TEXT DEFAULT NULL,
  p_group_by TEXT DEFAULT 'day'
)
RETURNS SETOF JSON AS $$
BEGIN
  IF p_group_by = 'model' THEN
    RETURN QUERY
    SELECT json_build_object(
      'date', created_at::date,
      'calls', COUNT(*),
      'cost_kobo', COALESCE(SUM(cost_kobo), 0),
      'input_tokens', COALESCE(SUM(input_tokens), 0),
      'output_tokens', COALESCE(SUM(output_tokens), 0),
      'model', model
    )
    FROM usage_logs
    WHERE org_id = p_org_id
      AND created_at >= p_since
      AND is_test = false
      AND (p_model IS NULL OR model = p_model)
      AND (p_tag IS NULL OR feature_tag = p_tag)
    GROUP BY created_at::date, model
    ORDER BY created_at::date;
  ELSIF p_group_by = 'tag' THEN
    RETURN QUERY
    SELECT json_build_object(
      'date', created_at::date,
      'calls', COUNT(*),
      'cost_kobo', COALESCE(SUM(cost_kobo), 0),
      'input_tokens', COALESCE(SUM(input_tokens), 0),
      'output_tokens', COALESCE(SUM(output_tokens), 0),
      'feature_tag', feature_tag
    )
    FROM usage_logs
    WHERE org_id = p_org_id
      AND created_at >= p_since
      AND is_test = false
      AND (p_model IS NULL OR model = p_model)
      AND (p_tag IS NULL OR feature_tag = p_tag)
    GROUP BY created_at::date, feature_tag
    ORDER BY created_at::date;
  ELSE
    RETURN QUERY
    SELECT json_build_object(
      'date', created_at::date,
      'calls', COUNT(*),
      'cost_kobo', COALESCE(SUM(cost_kobo), 0),
      'input_tokens', COALESCE(SUM(input_tokens), 0),
      'output_tokens', COALESCE(SUM(output_tokens), 0)
    )
    FROM usage_logs
    WHERE org_id = p_org_id
      AND created_at >= p_since
      AND is_test = false
      AND (p_model IS NULL OR model = p_model)
      AND (p_tag IS NULL OR feature_tag = p_tag)
    GROUP BY created_at::date
    ORDER BY created_at::date;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;


-- ── Usage summary functions (public API) ──────────────────────────────────

CREATE OR REPLACE FUNCTION usage_summary(p_org_id TEXT, p_since TIMESTAMPTZ)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_calls', COUNT(*),
    'total_cost_kobo', COALESCE(SUM(cost_kobo), 0),
    'total_savings_kobo', COALESCE(SUM(savings_kobo), 0),
    'total_input_tokens', COALESCE(SUM(input_tokens), 0),
    'total_output_tokens', COALESCE(SUM(output_tokens), 0),
    'avg_latency_ms', COALESCE(AVG(latency_ms), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND is_test = false;
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION usage_summary_by_model(p_org_id TEXT, p_since TIMESTAMPTZ)
RETURNS SETOF JSON AS $$
  SELECT json_build_object(
    'model', model,
    'calls', COUNT(*),
    'cost_kobo', COALESCE(SUM(cost_kobo), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND is_test = false
  GROUP BY model
  ORDER BY SUM(cost_kobo) DESC NULLS LAST;
$$ LANGUAGE sql STABLE;


-- ── Token bundle operations ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION bundle_atomic_debit(p_bundle_id TEXT, p_tokens BIGINT)
RETURNS JSON AS $$
DECLARE
  v_remaining BIGINT;
BEGIN
  UPDATE token_bundles
  SET remaining_tokens = remaining_tokens - p_tokens
  WHERE id = p_bundle_id
    AND status = 'active'
    AND remaining_tokens >= p_tokens
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING remaining_tokens INTO v_remaining;

  IF v_remaining IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object('bundle_id', p_bundle_id, 'remaining_tokens', v_remaining);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_active_bundle(p_org_id TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', id,
    'name', name,
    'total_tokens', total_tokens,
    'remaining_tokens', remaining_tokens,
    'price_kobo', price_kobo,
    'rate_per_million_kobo', rate_per_million_kobo,
    'expires_at', expires_at
  )
  FROM token_bundles
  WHERE org_id = p_org_id
    AND status = 'active'
    AND remaining_tokens > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE;


-- ── Agent tag (department) breakdown ────────────────────────────────────

CREATE OR REPLACE FUNCTION dashboard_agent_tags(p_org_id TEXT, p_since TIMESTAMPTZ)
RETURNS SETOF JSON AS $$
  SELECT json_build_object(
    'agent_tag', agent_tag,
    'calls', COUNT(*),
    'cost', COALESCE(SUM(cost_kobo), 0),
    'savings', COALESCE(SUM(savings_kobo), 0),
    'input_tokens', COALESCE(SUM(input_tokens), 0),
    'output_tokens', COALESCE(SUM(output_tokens), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND is_test = false
  GROUP BY agent_tag
  ORDER BY SUM(cost_kobo) DESC NULLS LAST
  LIMIT 20;
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION usage_summary_by_tag(p_org_id TEXT, p_since TIMESTAMPTZ)
RETURNS SETOF JSON AS $$
  SELECT json_build_object(
    'tag', COALESCE(agent_tag, 'untagged'),
    'calls', COUNT(*),
    'cost_kobo', COALESCE(SUM(cost_kobo), 0),
    'input_tokens', COALESCE(SUM(input_tokens), 0),
    'output_tokens', COALESCE(SUM(output_tokens), 0)
  )
  FROM usage_logs
  WHERE org_id = p_org_id
    AND created_at >= p_since
    AND is_test = false
  GROUP BY agent_tag
  ORDER BY SUM(cost_kobo) DESC NULLS LAST;
$$ LANGUAGE sql STABLE;


-- ── Admin platform functions ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_platform_stats()
RETURNS JSON AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_week_start TIMESTAMPTZ;
  v_month_start TIMESTAMPTZ;
BEGIN
  v_today_start := date_trunc('day', NOW());
  v_week_start := date_trunc('week', NOW());
  v_month_start := date_trunc('month', NOW());

  RETURN (
    SELECT json_build_object(
      'total_orgs', (SELECT COUNT(*) FROM organizations),
      'total_users', (SELECT COUNT(*) FROM profiles),
      'total_api_keys', (SELECT COUNT(*) FROM api_keys WHERE status = 'active'),
      'total_gmv_kobo', (SELECT COALESCE(SUM(amount_kobo), 0) FROM wallet_transactions WHERE type = 'credit'),
      'total_provider_cost_kobo', (SELECT COALESCE(SUM(cost_kobo), 0) FROM usage_logs),
      'net_revenue_kobo', (
        (SELECT COALESCE(SUM(amount_kobo), 0) FROM wallet_transactions WHERE type = 'credit')
        - (SELECT COALESCE(SUM(cost_kobo), 0) FROM usage_logs)
      ),
      'requests_today', (SELECT COUNT(*) FROM usage_logs WHERE created_at >= v_today_start),
      'requests_week', (SELECT COUNT(*) FROM usage_logs WHERE created_at >= v_week_start),
      'requests_month', (SELECT COUNT(*) FROM usage_logs WHERE created_at >= v_month_start)
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION admin_list_orgs(p_limit INT, p_offset INT, p_search TEXT DEFAULT '')
RETURNS SETOF JSON AS $$
  SELECT json_build_object(
    'id', o.id,
    'name', o.name,
    'slug', o.slug,
    'plan', o.plan,
    'status', o.status,
    'created_at', o.created_at,
    'wallet_balance_kobo', COALESCE((SELECT SUM(w.balance_kobo) FROM wallets w WHERE w.org_id = o.id), 0),
    'total_spend_kobo', COALESCE((SELECT SUM(u.cost_kobo) FROM usage_logs u WHERE u.org_id = o.id), 0),
    'total_calls', COALESCE((SELECT COUNT(*) FROM usage_logs u WHERE u.org_id = o.id), 0)
  )
  FROM organizations o
  WHERE (p_search = '' OR o.name ILIKE '%' || p_search || '%')
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION admin_count_orgs(p_search TEXT DEFAULT '')
RETURNS JSON AS $$
  SELECT json_build_object(
    'total', COUNT(*)
  )
  FROM organizations
  WHERE (p_search = '' OR name ILIKE '%' || p_search || '%');
$$ LANGUAGE sql STABLE;


CREATE OR REPLACE FUNCTION admin_platform_usage(p_since TIMESTAMPTZ, p_group_by TEXT DEFAULT 'provider')
RETURNS SETOF JSON AS $$
BEGIN
  IF p_group_by = 'model' THEN
    RETURN QUERY
    SELECT json_build_object(
      'group_name', model,
      'total_requests', COUNT(*),
      'total_cost_kobo', COALESCE(SUM(cost_kobo), 0)
    )
    FROM usage_logs
    WHERE created_at >= p_since
    GROUP BY model
    ORDER BY SUM(cost_kobo) DESC NULLS LAST;
  ELSE
    RETURN QUERY
    SELECT json_build_object(
      'group_name', provider,
      'total_requests', COUNT(*),
      'total_cost_kobo', COALESCE(SUM(cost_kobo), 0)
    )
    FROM usage_logs
    WHERE created_at >= p_since
    GROUP BY provider
    ORDER BY SUM(cost_kobo) DESC NULLS LAST;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION admin_top_orgs(p_since TIMESTAMPTZ)
RETURNS SETOF JSON AS $$
  SELECT json_build_object(
    'org_id', u.org_id,
    'org_name', o.name,
    'total_spend_kobo', COALESCE(SUM(u.cost_kobo), 0),
    'total_calls', COUNT(*)
  )
  FROM usage_logs u
  JOIN organizations o ON o.id = u.org_id
  WHERE u.created_at >= p_since
  GROUP BY u.org_id, o.name
  ORDER BY SUM(u.cost_kobo) DESC NULLS LAST
  LIMIT 10;
$$ LANGUAGE sql STABLE;
