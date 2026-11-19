-- APP CONTROL D'OBRES · V87.646 · Vigilància
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run, DESPRÉS de aco_seguretat_v878645.sql (fa servir aco_es_admin()).
-- Es pot tornar a executar: no esborra res.
--
-- 1. aco_errors: els errors de l'app de cada compte (el missatge tècnic, la versió i l'aparell) per poder-los corregir. Cada compte només
--    hi pot afegir els seus; no en pot llegir cap (ni els seus). El mateix error del mateix compte en 24 h només suma una vegada; com a
--    molt 30 de nous per hora i compte; els de fa més de 90 dies s'esborren sols.
-- 2. aco_estat_nuvol(): el que ensenya Ajustos › «Estat del núvol» (només l'administrador; els altres reben null): l'espai, cada compte
--    (últim canvi desat, última entrada, IA del mes i errors de 7 dies), els errors dels últims 30 dies i l'última còpia del núvol (l'última
--    entrada del compte de còpies, que entra un cop cada vegada que fa la còpia).
-- 3. aco_ping(): respon «ok» sense entrar (amb la clau pública). Serveix perquè un servei de vigilància de fora (UptimeRobot) comprovi cada
--    5 minuts que la base de dades respon i avisi per correu si no. No llegeix ni torna cap dada.
--
-- «security definer» a aco_estat_nuvol i a l'activador: el Security Advisor els marcarà com a avís informatiu, i és d'esperar (com aco_espai).

-- ── 1. Errors de l'app ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.aco_errors (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creat timestamptz not null default now(),
  darrer timestamptz not null default now(),
  vegades integer not null default 1,
  versio text not null default '' check (char_length(versio) <= 40),
  missatge text not null check (char_length(missatge) between 1 and 500),
  lloc text not null default '' check (char_length(lloc) <= 2000),
  pantalla text not null default '' check (char_length(pantalla) <= 200),
  aparell text not null default '' check (char_length(aparell) <= 200)
);
create index if not exists aco_errors_user_idx on public.aco_errors (user_id, darrer desc);
create index if not exists aco_errors_darrer_idx on public.aco_errors (darrer desc);
alter table public.aco_errors enable row level security;

-- Les taules noves ja no tenen permisos automàtics (Supabase, 30/10/2026): cada compte connectat només hi pot afegir.
revoke all on public.aco_errors from public, anon, authenticated;
grant insert on public.aco_errors to authenticated;
grant select, insert, update, delete on public.aco_errors to service_role;
drop policy if exists aco_errors_desar on public.aco_errors;
create policy aco_errors_desar on public.aco_errors for insert to authenticated with check (user_id = (select auth.uid()));

-- Abans de desar un error: el compte és sempre qui l'envia; si el mateix compte ja l'ha enviat en les últimes 24 h, només se suma una
-- vegada; més de 30 de nous en una hora es descarten sense error; i s'esborren els de fa més de 90 dies.
create or replace function public.aco_errors_abans() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  new.user_id := (select auth.uid());
  if new.user_id is null then return null; end if;
  new.creat := now(); new.darrer := now(); new.vegades := 1;
  select e.id into v_id from public.aco_errors e
    where e.user_id = new.user_id and e.missatge = new.missatge and e.darrer > now() - interval '24 hours'
    order by e.darrer desc limit 1;
  if v_id is not null then
    update public.aco_errors set vegades = vegades + 1, darrer = now(), versio = new.versio, aparell = new.aparell where id = v_id;
    return null;
  end if;
  if (select count(*) from public.aco_errors e where e.user_id = new.user_id and e.creat > now() - interval '1 hour') >= 30 then
    return null;
  end if;
  delete from public.aco_errors where darrer < now() - interval '90 days';
  return new;
end $$;
revoke all on function public.aco_errors_abans() from public, anon, authenticated;
drop trigger if exists aco_errors_abans on public.aco_errors;
create trigger aco_errors_abans before insert on public.aco_errors for each row execute function public.aco_errors_abans();

-- ── 2. Estat del núvol (Ajustos, només l'administrador) ────────────────────────────────────────────────────────────────────────────────
create or replace function public.aco_estat_nuvol() returns json
language plpgsql stable security definer set search_path = '' as $$
declare v_mes text := to_char(now() at time zone 'utc', 'YYYY-MM');
begin
  if not coalesce((select public.aco_es_admin()), false) then return null; end if;
  return json_build_object(
    'ara', now(),
    'mes', v_mes,
    'base_dades', pg_catalog.pg_database_size(pg_catalog.current_database()),
    'arxius', (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) from storage.objects o where o.bucket_id = 'aco-fitxers'),
    'arxius_n', (select count(*) from storage.objects o where o.bucket_id = 'aco-fitxers'),
    'copia', (select u.last_sign_in_at from auth.users u where u.email = 'copies@usuaris.controlobres.app'),
    'comptes', (select coalesce(json_agg(c order by c.ultim_canvi desc nulls last), '[]'::json) from (
        select u.email, u.created_at as creat, u.last_sign_in_at as ultima_entrada,
          (select max(k.updated_at) from public.aco_kv k where k.user_id = u.id) as ultim_canvi,
          coalesce(i.lectures, 0) as lectures, coalesce(i.cost_usd, 0) as cost, coalesce(i.n, 0) as crides,
          p.lectures_mes as paquet,
          (select count(*) from public.aco_errors e where e.user_id = u.id and e.darrer > now() - interval '7 days') as errors
        from auth.users u
        left join public.aco_ia_us i on i.user_id = u.id and i.mes = v_mes
        left join public.aco_ia_comptes p on p.user_id = u.id
        where u.email is distinct from 'copies@usuaris.controlobres.app') c),
    'errors', (select coalesce(json_agg(e order by e.darrer desc), '[]'::json) from (
        select x.darrer, x.creat, x.vegades, u.email, x.versio, x.missatge, left(x.lloc, 400) as lloc, x.pantalla, x.aparell
        from public.aco_errors x left join auth.users u on u.id = x.user_id
        where x.darrer > now() - interval '30 days' order by x.darrer desc limit 40) e)
  );
end $$;
revoke all on function public.aco_estat_nuvol() from public, anon, authenticated;
grant execute on function public.aco_estat_nuvol() to authenticated;

-- ── 3. Ping per a la vigilància de fora ────────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.aco_ping() returns text
language sql stable set search_path = '' as $$ select 'ok'::text $$;
revoke all on function public.aco_ping() from public;
grant execute on function public.aco_ping() to anon, authenticated, service_role;

-- ── Comprovació: ha de sortir «ok» i la llista de comptes (amb el teu) ────────────────────────────────────────────────────────────────
select public.aco_ping() as ping, (select count(*) from auth.users) as comptes;
