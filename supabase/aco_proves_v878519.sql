-- APP CONTROL D'OBRES · V87.519 · Comptes de prova amb data de fi
-- Executar a Supabase > SQL Editor > New query > Run. Es pot tornar a executar.
--
-- Un compte que comença per «prova-» (p. ex. prova-garcia-constru@usuaris.controlobres.app) rep, la primera vegada que entra,
-- els dies de prova (de sèrie 15) i les lectures d'IA (de sèrie 100). Passat el dia de fi, ja no pot llegir ni desar res al núvol
-- (ni les dades, ni les obres compartides, ni els arxius), però no s'esborra res: l'Héctor l'allarga o el passa a client des
-- d'Ajustos › Comptes de prova. Els altres comptes no canvien (no tenen fila a aco_proves).
-- Qui ho gestiona: el compte de l'Héctor, l'únic que no és @usuaris.controlobres.app (la mateixa regla que aco_espai()).
-- Si no s'executa, l'app funciona com abans (sense data de fi).

create table if not exists public.aco_proves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fins date not null,                          -- l'últim dia que pot entrar
  client boolean not null default false,       -- ja és client: no caduca
  creat timestamptz not null default now()
);
alter table public.aco_proves enable row level security;

create table if not exists public.aco_proves_config (
  id smallint primary key default 1 check (id = 1),
  dies integer not null default 15 check (dies between 1 and 120),
  lectures integer not null default 100 check (lectures between 0 and 5000),
  contacte text not null default ''            -- el que veu el compte quan s'acaba la prova (telèfon, correu…)
);
alter table public.aco_proves_config enable row level security;
insert into public.aco_proves_config (id) values (1) on conflict (id) do nothing;

-- Les taules noves ja no tenen permisos automàtics (canvi de Supabase del 30/10/2026).
revoke all on table public.aco_proves, public.aco_proves_config from public, anon;
grant select on table public.aco_proves to authenticated;
grant select, update on table public.aco_proves_config to authenticated;
grant select, insert, update, delete on table public.aco_proves, public.aco_proves_config to service_role;

-- És el compte de l'Héctor?
create or replace function public.aco_es_admin() returns boolean
language sql stable set search_path = ''
as $$ select coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app' $$;

-- Avui, a Catalunya
create or replace function public.aco_avui() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'Europe/Madrid')::date $$;

drop policy if exists aco_proves_veure on public.aco_proves;
create policy aco_proves_veure on public.aco_proves for select to authenticated
  using (user_id = (select auth.uid()) or (select public.aco_es_admin()));
drop policy if exists aco_proves_config_veure on public.aco_proves_config;
drop policy if exists aco_proves_config_canviar on public.aco_proves_config;
create policy aco_proves_config_veure on public.aco_proves_config for select to authenticated using (true);
create policy aco_proves_config_canviar on public.aco_proves_config for update to authenticated
  using ((select public.aco_es_admin())) with check ((select public.aco_es_admin()));

-- El compte que fa la petició pot fer servir el núvol? (sense fila, sí; client, sí; prova, fins al dia de fi inclòs)
create or replace function public.aco_prova_activa() returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (select 1 from public.aco_proves p
    where p.user_id = (select auth.uid()) and not p.client and p.fins < public.aco_avui())
$$;

-- L'estat de la prova del compte connectat. Un compte «prova-» que encara no en té, la comença ara (dies i lectures de sèrie).
create or replace function public.aco_prova() returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  u uuid := (select auth.uid());
  e text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  c public.aco_proves_config;
  p public.aco_proves;
begin
  if u is null then return jsonb_build_object('prova', false); end if;
  select * into c from public.aco_proves_config where id = 1;
  select * into p from public.aco_proves where user_id = u;
  if p.user_id is null then
    if e not like 'prova-%@usuaris.controlobres.app' then return jsonb_build_object('prova', false); end if;
    insert into public.aco_proves (user_id, fins) values (u, public.aco_avui() + coalesce(c.dies, 15) - 1)
      on conflict (user_id) do nothing;
    insert into public.aco_ia_comptes (user_id, lectures_mes) values (u, coalesce(c.lectures, 100))
      on conflict (user_id) do nothing;
    select * into p from public.aco_proves where user_id = u;
  end if;
  return jsonb_build_object('prova', not p.client, 'client', p.client, 'fins', p.fins,
    'queden', greatest(p.fins - public.aco_avui() + 1, 0), 'acabada', not p.client and p.fins < public.aco_avui(),
    'contacte', coalesce(c.contacte, ''));
end $$;

-- ── Només el compte de l'Héctor ────────────────────────────────────────────────────────────────────────────────────────────
-- Totes les proves: els comptes «prova-» (encara que no hagin entrat) i els que tenen data de fi
create or replace function public.aco_proves_llista()
returns table (email text, creat timestamptz, darrera timestamptz, fins date, client boolean, queden integer, lectures integer, limit_mes integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.aco_es_admin() then raise exception 'Només el compte principal' using errcode = '42501'; end if;
  return query
    select u.email::text, u.created_at, u.last_sign_in_at, p.fins, coalesce(p.client, false),
      case when p.fins is null then null else greatest(p.fins - public.aco_avui() + 1, 0) end,
      coalesce((select i.lectures from public.aco_ia_us i where i.user_id = u.id and i.mes = to_char(now(), 'YYYY-MM')), 0),
      (select k.lectures_mes from public.aco_ia_comptes k where k.user_id = u.id)
    from auth.users u left join public.aco_proves p on p.user_id = u.id
    where u.email like 'prova-%@usuaris.controlobres.app' or p.user_id is not null
    order by u.created_at desc;
end $$;

-- Posar o canviar el dia de fi (allargar, tancar ara, tornar a obrir). Si no tenia lectures de prova, les de sèrie.
create or replace function public.aco_prova_posa(p_email text, p_fins date) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare u uuid; c public.aco_proves_config;
begin
  if not public.aco_es_admin() then raise exception 'Només el compte principal' using errcode = '42501'; end if;
  select id into u from auth.users where email = lower(trim(p_email));
  if u is null then return jsonb_build_object('ok', false, 'error', 'usuari'); end if;
  if p_fins is null then return jsonb_build_object('ok', false, 'error', 'data'); end if;
  select * into c from public.aco_proves_config where id = 1;
  insert into public.aco_proves (user_id, fins, client) values (u, p_fins, false)
    on conflict (user_id) do update set fins = excluded.fins, client = false;
  insert into public.aco_ia_comptes (user_id, lectures_mes) values (u, coalesce(c.lectures, 100))
    on conflict (user_id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- Ja és client: no caduca i té les lectures del seu perfil
create or replace function public.aco_prova_client(p_email text) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare u uuid;
begin
  if not public.aco_es_admin() then raise exception 'Només el compte principal' using errcode = '42501'; end if;
  select id into u from auth.users where email = lower(trim(p_email));
  if u is null then return jsonb_build_object('ok', false, 'error', 'usuari'); end if;
  insert into public.aco_proves (user_id, fins, client) values (u, public.aco_avui(), true)
    on conflict (user_id) do update set client = true;
  delete from public.aco_ia_comptes where user_id = u;
  return jsonb_build_object('ok', true);
end $$;

-- Canviar les lectures d'IA d'una prova (al mes)
create or replace function public.aco_prova_lectures(p_email text, p_n integer) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare u uuid;
begin
  if not public.aco_es_admin() then raise exception 'Només el compte principal' using errcode = '42501'; end if;
  select id into u from auth.users where email = lower(trim(p_email));
  if u is null then return jsonb_build_object('ok', false, 'error', 'usuari'); end if;
  if p_n is null or p_n < 0 or p_n > 5000 then return jsonb_build_object('ok', false, 'error', 'numero'); end if;
  insert into public.aco_ia_comptes (user_id, lectures_mes) values (u, p_n)
    on conflict (user_id) do update set lectures_mes = excluded.lectures_mes;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.aco_es_admin(), public.aco_avui(), public.aco_prova_activa(), public.aco_prova(),
  public.aco_proves_llista(), public.aco_prova_posa(text, date), public.aco_prova_client(text), public.aco_prova_lectures(text, integer) from public, anon;
grant execute on function public.aco_es_admin(), public.aco_avui(), public.aco_prova_activa(), public.aco_prova(),
  public.aco_proves_llista(), public.aco_prova_posa(text, date), public.aco_prova_client(text), public.aco_prova_lectures(text, integer) to authenticated, service_role;

-- ── Passat el dia de fi, el compte de prova no llegeix ni desa res al núvol ─────────────────────────────────────────────────────
-- Regles «restrictive»: s'afegeixen a les que ja hi ha (cal complir-les totes). Les dades no s'esborren.
drop policy if exists "aco_kv prova activa" on public.aco_kv;
create policy "aco_kv prova activa" on public.aco_kv as restrictive for all to authenticated
  using ((select public.aco_prova_activa())) with check ((select public.aco_prova_activa()));
drop policy if exists "aco_shared prova activa" on public.aco_shared;
create policy "aco_shared prova activa" on public.aco_shared as restrictive for all to authenticated
  using ((select public.aco_prova_activa())) with check ((select public.aco_prova_activa()));
drop policy if exists "aco-fitxers prova activa" on storage.objects;
create policy "aco-fitxers prova activa" on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'aco-fitxers' or (select public.aco_prova_activa()))
  with check (bucket_id <> 'aco-fitxers' or (select public.aco_prova_activa()));
