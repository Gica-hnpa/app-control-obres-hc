-- APP CONTROL D'OBRES · V87.533 · Banc de preus comú, comprimit i amb «qui el veu»
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run. Substitueix aco_banc_comu_v878460.sql (no cal executar aquell):
-- si ja s'havia executat, aquest hi afegeix les columnes noves i canvia la regla de llegir.
--
-- Una sola fila amb el banc de preus que l'Héctor comparteix des del seu compte (Ajustos › Preus i marges › banc de preus).
--   · dades_gz: les partides i els capítols, comprimits (gzip en base64): uns 2-3 MB. Cada aparell la baixa un sol cop i la guarda dins
--     seu; només la torna a baixar quan canvia «versio».
--   · comptes: qui el veu. null = tots els comptes. Una llista de patrons (com «like») = només aquests, p. ex.
--     {'demo-%@usuaris.controlobres.app'} = els comptes de demostració. El compte de l'Héctor el veu sempre.
-- Només el pot posar, canviar o treure el compte de l'Héctor: l'únic que no és @usuaris.controlobres.app (el registre de comptes és tancat),
-- la mateixa regla que aco_espai(). Si no s'executa, l'app funciona igual: cada compte amb el seu banc, com fins ara.
create table if not exists public.aco_banc_comu (
  id smallint primary key default 1 check (id = 1),
  nom text not null default '',
  any_preus integer,
  pct numeric(6,2) not null default 0,   -- % escrit a mà; 0 = l'app hi posa sola l'IPC de l'INE des de l'any del banc
  n integer not null default 0,
  dades jsonb not null default '[]'::jsonb,
  versio timestamptz not null default now(),   -- canvia quan canvien les partides: els aparells només les tornen a baixar llavors
  updated_at timestamptz not null default now()
);
alter table public.aco_banc_comu add column if not exists dades_gz text;
alter table public.aco_banc_comu add column if not exists comptes text[];

alter table public.aco_banc_comu enable row level security;

-- Les taules noves ja no tenen permisos automàtics (canvi de Supabase del 30/10/2026).
revoke all on table public.aco_banc_comu from public, anon;
grant select, insert, update, delete on table public.aco_banc_comu to authenticated;
grant select, insert, update, delete on table public.aco_banc_comu to service_role;

drop policy if exists aco_banc_comu_llegir on public.aco_banc_comu;
drop policy if exists aco_banc_comu_afegir on public.aco_banc_comu;
drop policy if exists aco_banc_comu_canviar on public.aco_banc_comu;
drop policy if exists aco_banc_comu_treure on public.aco_banc_comu;

create policy aco_banc_comu_llegir on public.aco_banc_comu for select to authenticated
  using (
    comptes is null
    or coalesce((select auth.jwt() ->> 'email'), '') like any (comptes)
    or coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app'
  );
create policy aco_banc_comu_afegir on public.aco_banc_comu for insert to authenticated
  with check (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app');
create policy aco_banc_comu_canviar on public.aco_banc_comu for update to authenticated
  using (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app')
  with check (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app');
create policy aco_banc_comu_treure on public.aco_banc_comu for delete to authenticated
  using (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app');
