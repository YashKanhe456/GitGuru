create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  repo_url text not null,
  repo_name text not null,
  status text not null default 'completed',
  tech_stack jsonb not null default '[]'::jsonb,
  report jsonb not null,
  created_at timestamptz not null default now()
);
