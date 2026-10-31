-- APP CONTROL D'OBRES · V87.458 · Comptador de la IA per compte i mes (per a la funció «aco-ia»).
-- Sense aquesta taula la funció continua funcionant, però sense límit. Es pot executar més d'una vegada.
create table if not exists public.aco_ia_us (
  user_id uuid not null references auth.users(id) on delete cascade,
  mes text not null,
  n integer not null default 0,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  primary key (user_id, mes)
);
alter table public.aco_ia_us enable row level security;

-- Cada compte veu el que ha gastat; només la funció del servidor escriu.
drop policy if exists aco_ia_us_veure on public.aco_ia_us;
create policy aco_ia_us_veure on public.aco_ia_us for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.aco_ia_us from anon, authenticated;
grant select on public.aco_ia_us to authenticated;
grant select, insert, update on public.aco_ia_us to service_role;

create or replace function public.aco_ia_compta(p_user uuid, p_mes text, p_in bigint, p_out bigint)
returns void language sql security invoker set search_path = '' as $$
  insert into public.aco_ia_us (user_id, mes, n, tokens_in, tokens_out)
  values (p_user, p_mes, 1, p_in, p_out)
  on conflict (user_id, mes) do update
    set n = public.aco_ia_us.n + 1,
        tokens_in = public.aco_ia_us.tokens_in + excluded.tokens_in,
        tokens_out = public.aco_ia_us.tokens_out + excluded.tokens_out;
$$;
revoke all on function public.aco_ia_compta(uuid, text, bigint, bigint) from public, anon, authenticated;
grant execute on function public.aco_ia_compta(uuid, text, bigint, bigint) to service_role;
