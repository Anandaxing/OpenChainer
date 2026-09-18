-- =============================================================================
-- Migration: 7-Day Automated Data Retention & Cache Pruning Policy
-- Target: Supabase PostgreSQL (analyses table)
-- Issue: https://github.com/Anandaxing/OpenChainer/issues/24
-- =============================================================================

-- 1. Ensure created_at column exists with default timestamp
alter table analyses 
  add column if not exists created_at timestamptz not null default now();

-- 2. Create B-Tree index on created_at to accelerate range deletions and TTL queries
create index if not exists idx_analyses_created_at 
  on analyses (created_at);

-- 3. Tune autovacuum specifically for the analyses table to reclaim deleted space rapidly
alter table analyses set (
  autovacuum_vacuum_scale_factor = 0.05,  -- Trigger autovacuum after 5% dead rows
  autovacuum_vacuum_cost_limit = 500,     -- Allocate higher I/O budget for cleanup
  autovacuum_vacuum_threshold = 100       -- Minimum dead row count before vacuum triggers
);

-- 4. Enable pg_cron extension (available natively in Supabase)
create extension if not exists pg_cron;

-- 5. Grant cron schema execution rights to postgres maintenance role
grant usage on schema cron to postgres;

-- 6. Unschedule pre-existing cleanup job if previously registered
select cron.unschedule('purge-analyses-7-days') 
where exists (
  select 1 from cron.job where jobname = 'purge-analyses-7-days'
);

-- 7. Schedule automated 7-day retention purge daily at 03:00 AM UTC
select cron.schedule(
  'purge-analyses-7-days',                -- Job name
  '0 3 * * *',                            -- Schedule: Daily at 03:00 UTC
  $$
    delete from public.analyses 
    where created_at < now() - interval '7 days';
  $$
);
