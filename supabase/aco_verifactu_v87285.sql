-- APP CONTROL D'OBRES · V87.285 · VeriFactu: comptes que poden facturar, numeració i registre de factures
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run (després dels SQL anteriors). No esborra cap dada.
-- Les taules noves no tenen permisos automàtics (canvi de Supabase del 30/10/2026): aquí es donen un per un.
--
-- Com funciona:
--  · aco_verifactu_comptes: quins comptes poden emetre factures amb VeriFactu i amb quin NIF. NOMÉS l'Héctor
--    l'omple, des del panell (Table Editor). Cada compte només pot llegir la seva fila.
--  · aco_series + aco_seguent_numero(): el número de cada factura el dona el servidor (correlatiu per compte,
--    sèrie i any). Dos aparells no poden fer mai el mateix número. Només la funció «verifactu» la pot fer servir.
--  · aco_verifactu_registres: còpia al servidor de cada factura emesa. L'app la pot llegir però no la pot canviar
--    ni esborrar (només la funció «verifactu», amb la clau del servidor).
--  · aco_reservar_factura() (V87.313): reserva el número i desa la factura en un sol pas. Dos aparells alhora amb la
--    mateixa certificació reben la mateixa factura (no se'n fan dues ni es perd cap número), i les línies queden desades
--    (`entrada`) per poder-la tornar a enviar encara que l'enviament s'aturi a mig camí.

-- 1) Comptes que poden facturar amb VeriFactu
create table if not exists public.aco_verifactu_comptes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  actiu      boolean not null default false,
  entorn     text not null default 'test' check (entorn in ('test', 'prod')),
  nif        text not null default '',
  nom        text not null default '',          -- raó social de qui emet les factures
  adreca     text not null default '',
  cp         text not null default '',
  poblacio   text not null default '',
  serie      text not null default 'F',          -- les factures seran F2027-0001, F2027-0002…
  updated_at timestamptz not null default now()
);
alter table public.aco_verifactu_comptes enable row level security;
revoke all on public.aco_verifactu_comptes from anon, authenticated;
grant select on public.aco_verifactu_comptes to authenticated;
grant select, insert, update, delete on public.aco_verifactu_comptes to service_role;
drop policy if exists "aco_verifactu_comptes llegir el meu" on public.aco_verifactu_comptes;
create policy "aco_verifactu_comptes llegir el meu" on public.aco_verifactu_comptes
  for select to authenticated
  using ((select auth.uid()) = user_id or (select auth.jwt() ->> 'email') = 'copies@usuaris.controlobres.app');

-- 2) Comptador de números (només el servidor)
create table if not exists public.aco_series (
  user_id  uuid not null references auth.users(id) on delete cascade,
  serie    text not null,
  exercici int  not null,
  ultim    int  not null default 0,
  primary key (user_id, serie, exercici)
);
alter table public.aco_series enable row level security;
revoke all on public.aco_series from anon, authenticated;
grant select, insert, update on public.aco_series to service_role;

create or replace function public.aco_seguent_numero(p_user uuid, p_serie text, p_exercici int)
returns int
language sql
security invoker
set search_path = public
as $$
  insert into public.aco_series (user_id, serie, exercici, ultim)
  values (p_user, p_serie, p_exercici, 1)
  on conflict (user_id, serie, exercici) do update set ultim = public.aco_series.ultim + 1
  returning ultim;
$$;
revoke all on function public.aco_seguent_numero(uuid, text, int) from public, anon, authenticated;
grant execute on function public.aco_seguent_numero(uuid, text, int) to service_role;

-- 3) Registre de les factures emeses
create table if not exists public.aco_verifactu_registres (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  obra_id          text not null default '',
  cert_id          text not null default '',
  tipus            text not null default 'F1',   -- F1 factura · R1…R5 rectificatives
  serie            text not null,
  numero           text not null,
  exercici         int  not null,
  data_expedicio   date not null,
  nif_destinatari  text not null default '',
  nom_destinatari  text not null default '',
  base             numeric(14,2) not null default 0,
  quota            numeric(14,2) not null default 0,
  total            numeric(14,2) not null default 0,
  estat            text not null default 'reservada',  -- reservada · error · Pendiente · Correcto · … · Anulada
  uuid_intermediari text,
  url_qr           text,
  peticio          jsonb,
  resposta         jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, serie, numero)
);
create index if not exists aco_verifactu_registres_obra on public.aco_verifactu_registres (user_id, obra_id, cert_id);
alter table public.aco_verifactu_registres enable row level security;
revoke all on public.aco_verifactu_registres from anon, authenticated;
grant select on public.aco_verifactu_registres to authenticated;
grant select, insert, update on public.aco_verifactu_registres to service_role;
drop policy if exists "aco_verifactu_registres llegir els meus" on public.aco_verifactu_registres;
create policy "aco_verifactu_registres llegir els meus" on public.aco_verifactu_registres
  for select to authenticated
  using ((select auth.uid()) = user_id or (select auth.jwt() ->> 'email') = 'copies@usuaris.controlobres.app');

-- 4) (V87.313) Línies i descripció de cada factura, i una sola factura vigent per certificació
alter table public.aco_verifactu_registres add column if not exists entrada jsonb;
create unique index if not exists aco_verifactu_registres_una_per_cert on public.aco_verifactu_registres (user_id, obra_id, cert_id)
  where estat <> 'Anulada' and tipus = 'F1' and cert_id <> '';

-- 5) (V87.313) Reservar el número i desar la factura en un sol pas (només el servidor)
create or replace function public.aco_reservar_factura(
  p_user uuid, p_obra text, p_cert text, p_serie text, p_exercici int, p_data date,
  p_nif text, p_nom text, p_base numeric, p_quota numeric, p_total numeric, p_entrada jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  r public.aco_verifactu_registres;
  n int;
begin
  -- dos peticions alhora per a la mateixa certificació: la segona espera que acabi la primera
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || '|' || p_obra || '|' || p_cert, 0));
  select * into r from public.aco_verifactu_registres
   where user_id = p_user and obra_id = p_obra and cert_id = p_cert and tipus = 'F1' and estat <> 'Anulada'
   order by created_at limit 1;
  if found then
    return to_jsonb(r) || jsonb_build_object('ja_existia', true);
  end if;
  n := public.aco_seguent_numero(p_user, p_serie, p_exercici);
  insert into public.aco_verifactu_registres (user_id, obra_id, cert_id, tipus, serie, numero, exercici, data_expedicio,
    nif_destinatari, nom_destinatari, base, quota, total, estat, entrada)
  values (p_user, p_obra, p_cert, 'F1', p_serie, case when n < 10000 then lpad(n::text, 4, '0') else n::text end, p_exercici, p_data,
    p_nif, p_nom, p_base, p_quota, p_total, 'reservada', p_entrada)
  returning * into r;
  return to_jsonb(r) || jsonb_build_object('ja_existia', false);
end;
$$;
revoke all on function public.aco_reservar_factura(uuid, text, text, text, int, date, text, text, numeric, numeric, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.aco_reservar_factura(uuid, text, text, text, int, date, text, text, numeric, numeric, numeric, jsonb) to service_role;

-- Per activar un compte (ho fa l'Héctor, al Table Editor o aquí):
--   insert into public.aco_verifactu_comptes (user_id, actiu, entorn, nif, nom, adreca, cp, poblacio)
--   select id, true, 'test', 'B00000000', 'NOM DE L''EMPRESA SL', 'Carrer…', '17000', 'Girona'
--   from auth.users where email = 'brava@usuaris.controlobres.app'
--   on conflict (user_id) do update set actiu = excluded.actiu, entorn = excluded.entorn, nif = excluded.nif,
--     nom = excluded.nom, adreca = excluded.adreca, cp = excluded.cp, poblacio = excluded.poblacio, updated_at = now();
