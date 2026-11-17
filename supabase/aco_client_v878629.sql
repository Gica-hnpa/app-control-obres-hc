-- APP CONTROL D'OBRES · V87.629 · L'enllaç per al client (fase 3 de compartir; l'Héctor, 17/11/2026: enllaç i codi de 4 xifres, només
-- veu el que es publica, fins que es tanca l'obra)
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run. Es pot tornar a executar: no esborra res.
--
-- Com va:
-- - Qui comparteix (des de l'app, amb el seu compte) crea l'enllaç d'una obra: una clau secreta llarga (…/#obra=<clau>) i un codi de 4
--   xifres, i hi desa el que el client pot veure (una còpia feta a l'app: només el que s'ha triat). Quan prem «Publicar al client», la
--   còpia es posa al dia. Res més de l'obra no surt del compte.
-- - El client (sense compte) obre l'enllaç, posa el codi i veu la còpia. Si s'equivoca 10 vegades seguides, l'enllaç es bloqueja (cal
--   tornar-lo a crear des de l'app).
-- - Qui no té compte només pot fer servir una funció (aco_client_veure) i només amb la clau i el codi; no veu cap taula. És «security
--   definer»: el Security Advisor la marcarà com a avís, i és d'esperar.
-- - L'app treu l'enllaç quan l'obra es tanca (o quan es prem «Treure l'enllaç»).

create table if not exists public.aco_client (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  codi text not null,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  obra_id text not null,
  info jsonb not null default '{}'::jsonb,
  contingut jsonb not null default '{}'::jsonb,
  publicat timestamptz not null default now(),
  obert timestamptz,
  obertures integer not null default 0,
  intents integer not null default 0,
  creat timestamptz not null default now(),
  constraint aco_client_token_llarg check (length(token) >= 40),
  constraint aco_client_codi_4 check (codi ~ '^[0-9]{4}$'),
  constraint aco_client_una_per_obra unique (owner, obra_id)
);

-- La taula: només el propietari de cada enllaç (les taules noves ja no tenen permisos sols: s'han de donar)
alter table public.aco_client enable row level security;
revoke all on table public.aco_client from public, anon, authenticated;
grant select, insert, update, delete on table public.aco_client to authenticated;
drop policy if exists aco_client_select on public.aco_client;
drop policy if exists aco_client_insert on public.aco_client;
drop policy if exists aco_client_update on public.aco_client;
drop policy if exists aco_client_delete on public.aco_client;
create policy aco_client_select on public.aco_client for select to authenticated using (owner = (select auth.uid()));
create policy aco_client_insert on public.aco_client for insert to authenticated with check (owner = (select auth.uid()));
create policy aco_client_update on public.aco_client for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy aco_client_delete on public.aco_client for delete to authenticated using (owner = (select auth.uid()));

-- El client (sense compte): amb la clau de l'enllaç i el codi, la còpia publicada
create or replace function public.aco_client_veure(p_token text, p_codi text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.aco_client%rowtype;
begin
  if length(coalesce(p_token, '')) < 40 then return jsonb_build_object('ok', false, 'error', 'enllac'); end if;
  select * into r from public.aco_client where token = p_token for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'enllac'); end if;
  if r.intents >= 10 then return jsonb_build_object('ok', false, 'error', 'bloquejat'); end if;
  if coalesce(p_codi, '') <> r.codi then
    update public.aco_client set intents = intents + 1 where id = r.id;
    return jsonb_build_object('ok', false, 'error', 'codi', 'queden', greatest(0, 9 - r.intents));
  end if;
  update public.aco_client set obert = now(), obertures = obertures + 1, intents = 0 where id = r.id;
  return jsonb_build_object('ok', true, 'info', r.info, 'contingut', r.contingut, 'publicat', r.publicat);
end $$;

revoke all on function public.aco_client_veure(text, text) from public, anon, authenticated;
grant execute on function public.aco_client_veure(text, text) to anon, authenticated;
