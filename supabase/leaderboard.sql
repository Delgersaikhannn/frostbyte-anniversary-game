-- Frostbyte: Alien Defense leaderboard
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Only the Vercel function (/api/scores, using the service_role key) reads or writes these;
-- the public anon key gets no access at all.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  name       text        not null check (name ~ '^[A-Z0-9_]{1,15}$'),  -- stored uppercase
  score      integer     not null check (score between 0 and 10000000),
  wave       integer     not null check (wave between 1 and 999),
  play_secs  integer     not null check (play_secs between 0 and 86400),
  ip_hash    text,                      -- salted hash, only used for rate limiting
  hidden     boolean     not null default false,  -- tick in the table editor to hide a rude name
  created_at timestamptz not null default now()
);

create index if not exists scores_rank_idx on public.scores (score desc, created_at) where not hidden;
create index if not exists scores_name_idx on public.scores (name, score desc);
create index if not exists scores_ip_idx   on public.scores (ip_hash, created_at desc);

-- each name's best run, highest first
create or replace view public.leaderboard as
select name, score, wave, created_at
from (
  select distinct on (name) name, score, wave, created_at
  from public.scores
  where not hidden
  order by name, score desc, created_at asc
) best
order by score desc, created_at asc;

-- lock it down: RLS on, no policies, and no grants for the public roles
alter table public.scores enable row level security;
revoke all on public.scores, public.leaderboard from anon, authenticated;
