-- APP CONTROL D'OBRES · V87.645 · Seguretat del núvol (revisió de seguretat del 18/11/2026)
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run. Es pot tornar a executar: no esborra cap dada.
-- Cal haver executat abans aco_banc_comu_v878533.sql, aco_espai_v87263.sql i aco_client_v878629.sql (ja ho estan).
--
-- 1. L'administrador amb nom i cognoms. Fins ara ho era «qualsevol compte que no sigui @usuaris.controlobres.app»: si un dia es creava
--    un compte amb un correu normal (un client, un treballador), tindria els permisos de l'Héctor (banc de preus comú, espai del núvol).
--    Ara és una llista (aco_admins) amb els comptes d'ara que no són de les empreses: avui, només el de l'Héctor. Al final, l'SQL ensenya
--    qui ha quedat a la llista: ha de sortir NOMÉS el correu de l'Héctor.
-- 2. L'enllaç per al client caduca: un any després de l'última vegada que s'hi ha publicat (cada «Publicar al client» el torna a allargar).
--    Caducat, el client veu «Aquest enllaç ja no funciona» (el mateix que quan es treu).
-- 3. Els arxius: només els tipus que fa servir l'app (fotos, PDF, documents d'Office, àudio, vídeo, text, ZIP i «binari» per als DWG, BC3…).
--    Pàgines web (HTML) i dibuixos SVG ja no es poden pujar com a tals: l'app els puja com a «binari» i el navegador no els obre com una web.

-- ── 1. Administrador ─────────────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.aco_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creat timestamptz not null default now()
);
alter table public.aco_admins enable row level security;
-- Ningú no la pot llegir ni canviar des de l'app; només el servidor (les taules noves ja no tenen permisos sols)
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

-- Banc de preus comú: llegir (els comptes triats o tots) i canviar-lo, només l'administrador
drop policy if exists aco_banc_comu_llegir on public.aco_banc_comu;
drop policy if exists aco_banc_comu_afegir on public.aco_banc_comu;
drop policy if exists aco_banc_comu_canviar on public.aco_banc_comu;
drop policy if exists aco_banc_comu_treure on public.aco_banc_comu;
create policy aco_banc_comu_llegir on public.aco_banc_comu for select to authenticated
  using (comptes is null or coalesce((select auth.jwt() ->> 'email'), '') like any (comptes) or (select public.aco_es_admin()));
create policy aco_banc_comu_afegir on public.aco_banc_comu for insert to authenticated with check ((select public.aco_es_admin()));
create policy aco_banc_comu_canviar on public.aco_banc_comu for update to authenticated
  using ((select public.aco_es_admin())) with check ((select public.aco_es_admin()));
create policy aco_banc_comu_treure on public.aco_banc_comu for delete to authenticated using ((select public.aco_es_admin()));

-- Espai al núvol (Ajustos): només l'administrador
create or replace function public.aco_espai() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.aco_es_admin() then return null; end if;
  return json_build_object(
    'base_dades', pg_catalog.pg_database_size(pg_catalog.current_database()),
    'arxius', (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) from storage.objects o where o.bucket_id = 'aco-fitxers'),
    'arxius_n', (select count(*) from storage.objects o where o.bucket_id = 'aco-fitxers')
  );
end $$;
revoke all on function public.aco_espai() from public, anon, authenticated;
grant execute on function public.aco_espai() to authenticated;

-- ── 2. Enllaç per al client amb data de fi ───────────────────────────────────────────────────────────────────────────────────
alter table public.aco_client add column if not exists caduca timestamptz;
update public.aco_client set caduca = now() + interval '365 days' where caduca is null;
alter table public.aco_client alter column caduca set default (now() + interval '365 days');

create or replace function public.aco_client_caduca() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.contingut is distinct from old.contingut then new.caduca := now() + interval '365 days'; end if;
  return new;
end $$;
revoke all on function public.aco_client_caduca() from public, anon, authenticated;
drop trigger if exists aco_client_caduca on public.aco_client;
create trigger aco_client_caduca before insert or update on public.aco_client for each row execute function public.aco_client_caduca();

create or replace function public.aco_client_veure(p_token text, p_codi text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.aco_client%rowtype;
begin
  if length(coalesce(p_token, '')) < 40 then return jsonb_build_object('ok', false, 'error', 'enllac'); end if;
  select * into r from public.aco_client where token = p_token for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'enllac'); end if;
  if r.caduca is not null and r.caduca < now() then return jsonb_build_object('ok', false, 'error', 'enllac'); end if;
  if r.intents >= 20 then return jsonb_build_object('ok', false, 'error', 'bloquejat'); end if;
  if coalesce(p_codi, '') <> r.codi then
    update public.aco_client set intents = intents + 1 where id = r.id;
    return jsonb_build_object('ok', false, 'error', 'codi', 'queden', greatest(0, 19 - r.intents));
  end if;
  update public.aco_client set obert = now(), obertures = obertures + 1 where id = r.id;
  return jsonb_build_object('ok', true, 'info', r.info, 'contingut', r.contingut, 'publicat', r.publicat);
end $$;
revoke all on function public.aco_client_veure(text, text) from public, anon, authenticated;
grant execute on function public.aco_client_veure(text, text) to anon, authenticated, service_role;

-- ── 3. Tipus d'arxius (la mateixa llista que l'app, src/cloudSync.js · TIPUS878645) ────────────────────────────────────────────
update storage.buckets set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff',
  'application/pdf', 'text/plain', 'text/csv', 'application/json', 'application/rtf',
  'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint', 'application/vnd.ms-outlook',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
  'application/zip', 'application/x-zip-compressed', 'message/rfc822',
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/x-m4a',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/octet-stream'
] where id = 'aco-fitxers';

-- ── Comprovació: qui és administrador (ha de sortir NOMÉS el correu de l'Héctor) ─────────────────────────────────────────────────
select u.email as administrador from public.aco_admins a join auth.users u on u.id = a.user_id;
