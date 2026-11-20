-- APP CONTROL D'OBRES · V87.653 · Paquets de cada compte
-- Executar a Supabase > SQL Editor > New query > Run. Es pot tornar a executar.
--
-- Cada compte d'empresa (@usuaris.controlobres.app) té un perfil (Tècnic, Constructora, Administrador de finques) i uns paquets
-- (document «Perfils i paquets de l'app», 20/11/2026): honoraris, pressupost (Pressupost i certificacions / Direcció d'obra),
-- encarrecs (Encàrrecs tècnics), hores (Hores i rendiment), control (Control d'obra), personal (Personal i fitxatge) i
-- factures (Factures i comptabilitat). «Obres i seguiment» hi és sempre.
-- Els posa només el compte de l'Héctor, des d'Ajustos › Comptes del núvol › Paquets. Un compte sense fila té tots els paquets
-- del seu perfil (com fins ara). Treure un paquet no esborra cap dada: només amaga els menús i les pestanyes.
-- Si no s'executa, l'app funciona com abans (tots els paquets).

create table if not exists public.aco_paquets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  perfil text check (perfil is null or perfil in ('tecnic', 'constructor', 'finques', 'treballador')),
  paquets text[] not null default '{}',
  canviat timestamptz not null default now()
);
alter table public.aco_paquets enable row level security;
-- Ningú hi entra directament: només amb les funcions de sota (les taules noves ja no tenen permisos automàtics).
revoke all on table public.aco_paquets from public, anon, authenticated;
grant select, insert, update, delete on table public.aco_paquets to service_role;

-- És el compte de l'Héctor? (el mateix que aco_seguretat_v878645.sql; es poden executar en qualsevol ordre)
create table if not exists public.aco_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creat timestamptz not null default now()
);
alter table public.aco_admins enable row level security;
revoke all on table public.aco_admins from public, anon, authenticated;
grant select, insert, update, delete on table public.aco_admins to service_role;
insert into public.aco_admins (user_id)
  select id from auth.users where email is not null and email not like '%@usuaris.controlobres.app'
    and not exists (select 1 from public.aco_admins)
  on conflict (user_id) do nothing;
create or replace function public.aco_es_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.aco_admins a where a.user_id = (select auth.uid())) $$;
revoke all on function public.aco_es_admin() from public, anon;
grant execute on function public.aco_es_admin() to authenticated, service_role;

-- Un camp d'un text JSON (el perfil que el compte va triar a la benvinguda); si el text no és JSON, null
create or replace function public.aco_json_camp(p text, k text) returns text
language plpgsql immutable set search_path = ''
as $$ begin return (p::jsonb) ->> k; exception when others then return null; end $$;
revoke all on function public.aco_json_camp(text, text) from public, anon, authenticated;

-- Els paquets del compte connectat: {perfil, paquets} o null (sense fila: tots els del seu perfil)
create or replace function public.aco_paquets_meus() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('perfil', p.perfil, 'paquets', to_jsonb(p.paquets))
  from public.aco_paquets p where p.user_id = (select auth.uid())
$$;
revoke all on function public.aco_paquets_meus() from public, anon;
grant execute on function public.aco_paquets_meus() to authenticated, service_role;

-- ── Només el compte de l'Héctor ────────────────────────────────────────────────────────────────────────────────────────────
-- Tots els comptes d'empresa, amb el perfil que van triar a l'app i els paquets (si l'Héctor els hi ha posat)
create or replace function public.aco_paquets_llista()
returns table (email text, creat timestamptz, darrera timestamptz, perfil_triat text, perfil text, paquets text[], definit boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.aco_es_admin() then raise exception 'Només el compte principal' using errcode = '42501'; end if;
  return query
    select u.email::text, u.created_at, u.last_sign_in_at,
      (select public.aco_json_camp(k.value, 'perfil') from public.aco_kv k
        where k.user_id = u.id and k.key like '%\_\_aco_empresa_v878259' and not k.deleted limit 1),
      p.perfil, p.paquets, p.user_id is not null
    from auth.users u left join public.aco_paquets p on p.user_id = u.id
    where u.email like '%@usuaris.controlobres.app' and u.email <> 'copies@usuaris.controlobres.app'
    order by u.email;
end $$;
revoke all on function public.aco_paquets_llista() from public, anon;
grant execute on function public.aco_paquets_llista() to authenticated, service_role;

-- Posar el perfil i els paquets d'un compte (els que no es coneixen no es desen)
create or replace function public.aco_paquets_posa(p_email text, p_perfil text, p_paquets text[]) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  u uuid;
  l text[];
begin
  if not public.aco_es_admin() then raise exception 'Només el compte principal' using errcode = '42501'; end if;
  select id into u from auth.users
    where lower(email) = lower(trim(p_email)) and email like '%@usuaris.controlobres.app' and email <> 'copies@usuaris.controlobres.app';
  if u is null then return jsonb_build_object('ok', false, 'error', 'compte'); end if;
  if p_perfil is not null and p_perfil not in ('tecnic', 'constructor', 'finques', 'treballador') then
    return jsonb_build_object('ok', false, 'error', 'perfil');
  end if;
  select coalesce(array_agg(distinct x order by x), '{}') into l from unnest(coalesce(p_paquets, '{}'::text[])) x
    where x in ('honoraris', 'pressupost', 'encarrecs', 'hores', 'control', 'personal', 'factures');
  insert into public.aco_paquets (user_id, perfil, paquets, canviat) values (u, p_perfil, l, now())
    on conflict (user_id) do update set perfil = excluded.perfil, paquets = excluded.paquets, canviat = now();
  return jsonb_build_object('ok', true, 'perfil', p_perfil, 'paquets', to_jsonb(l));
end $$;
revoke all on function public.aco_paquets_posa(text, text, text[]) from public, anon;
grant execute on function public.aco_paquets_posa(text, text, text[]) to authenticated, service_role;

-- Tornar un compte a «tots els paquets del seu perfil» (treu la fila)
create or replace function public.aco_paquets_treu(p_email text) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.aco_es_admin() then raise exception 'Només el compte principal' using errcode = '42501'; end if;
  delete from public.aco_paquets p using auth.users u
    where p.user_id = u.id and lower(u.email) = lower(trim(p_email));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.aco_paquets_treu(text) from public, anon;
grant execute on function public.aco_paquets_treu(text) to authenticated, service_role;
