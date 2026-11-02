-- APP CONTROL D'OBRES · V87.458, V87.469 · Lectures de la IA per compte i mes, i el cost de debò de cada crida (per a la funció «aco-ia»).
-- Sense aquest SQL la funció no treballa. Es pot executar més d'una vegada. Només hi entra la funció del servidor: els comptes veuen
-- les seves lectures a través d'ella, i el cost no el veu ningú des de l'app.

-- Les lectures i el cost de cada compte, mes a mes
create table if not exists public.aco_ia_us (
  user_id uuid not null references auth.users(id) on delete cascade,
  mes text not null,
  n integer not null default 0,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  primary key (user_id, mes)
);
alter table public.aco_ia_us add column if not exists lectures integer not null default 0;
alter table public.aco_ia_us add column if not exists cerques integer not null default 0;
alter table public.aco_ia_us add column if not exists cost_usd numeric(12,5) not null default 0;
alter table public.aco_ia_us enable row level security;
drop policy if exists aco_ia_us_veure on public.aco_ia_us;

-- Una fila per crida, sense res del document: per saber què costa de debò cada feina
create table if not exists public.aco_ia_crides (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  accio text not null,
  model text not null,
  ok boolean not null,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  cerques integer not null default 0,
  cost_usd numeric(10,5) not null default 0,
  lectures integer not null default 0
);
create index if not exists aco_ia_crides_user_idx on public.aco_ia_crides (user_id, created_at desc);
alter table public.aco_ia_crides enable row level security;

-- Un paquet diferent per a un compte; si no en té, el del seu perfil
create table if not exists public.aco_ia_comptes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lectures_mes integer not null
);
alter table public.aco_ia_comptes enable row level security;

revoke all on public.aco_ia_us, public.aco_ia_crides, public.aco_ia_comptes from anon, authenticated;
grant select, insert, update on public.aco_ia_us to service_role;
grant select, insert on public.aco_ia_crides to service_role;
grant select on public.aco_ia_comptes to service_role;

drop function if exists public.aco_ia_compta(uuid, text, bigint, bigint);
create or replace function public.aco_ia_compta(p_user uuid, p_mes text, p_accio text, p_model text, p_ok boolean, p_in bigint, p_out bigint, p_cerques integer, p_cost numeric, p_lectures integer)
returns void language sql security invoker set search_path = '' as $$
  insert into public.aco_ia_crides (user_id, accio, model, ok, tokens_in, tokens_out, cerques, cost_usd, lectures)
  values (p_user, p_accio, p_model, p_ok, p_in, p_out, p_cerques, p_cost, p_lectures);
  insert into public.aco_ia_us (user_id, mes, n, lectures, tokens_in, tokens_out, cerques, cost_usd)
  values (p_user, p_mes, 1, p_lectures, p_in, p_out, p_cerques, p_cost)
  on conflict (user_id, mes) do update
    set n = public.aco_ia_us.n + 1,
        lectures = public.aco_ia_us.lectures + excluded.lectures,
        tokens_in = public.aco_ia_us.tokens_in + excluded.tokens_in,
        tokens_out = public.aco_ia_us.tokens_out + excluded.tokens_out,
        cerques = public.aco_ia_us.cerques + excluded.cerques,
        cost_usd = public.aco_ia_us.cost_usd + excluded.cost_usd;
$$;
revoke all on function public.aco_ia_compta(uuid, text, text, text, boolean, bigint, bigint, integer, numeric, integer) from public, anon, authenticated;
grant execute on function public.aco_ia_compta(uuid, text, text, text, boolean, bigint, bigint, integer, numeric, integer) to service_role;
