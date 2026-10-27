-- APP CONTROL D'OBRES · V87.409 · Signar a distància amb l'AutoFirma (un enllaç per document)
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run. Es pot tornar a executar: no esborra res.
--
-- Com va:
-- - Qui fa el document (des de l'app, amb el seu compte) crea una «petició de signatura» amb el PDF i rep un enllaç amb una clau
--   secreta (…/#signa=<clau>), que envia per correu a qui ha de signar.
-- - Qui obre l'enllaç (no cal compte) veu el document i el signa amb la seva AutoFirma. La signatura nova va a sobre de les
--   d'abans: tots signen el MATEIX PDF i en surt un de sol amb totes les signatures. L'app del propietari se'l baixa sola.
-- - La base de dades només accepta un PDF que COMENCI exactament per l'anterior (la signatura s'afegeix al final: el document no
--   es pot canviar) i només si ningú n'ha desat cap altre entremig (versió).
-- - Qui no té compte només pot fer servir dues funcions (veure i signar) i només amb la clau de l'enllaç; no veu cap taula.
--   Són «security definer»: el Security Advisor les marcarà com a avís, i és d'esperar.
-- - Els enllaços caduquen als 60 dies. Quan tothom ha signat, l'app esborra la petició del núvol (el PDF queda a Documents).

create table if not exists public.aco_signa (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  obra_id text not null,
  ref text not null,
  info jsonb not null default '{}'::jsonb,
  pdf bytea not null,
  versio integer not null default 1,
  signades jsonb not null default '[]'::jsonb,
  canvis integer not null default 0,
  estat text not null default 'obert',
  expira timestamptz not null default (now() + interval '60 days'),
  creat timestamptz not null default now(),
  actualitzat timestamptz not null default now()
);
create index if not exists aco_signa_owner_idx on public.aco_signa (owner);

-- La taula: només el propietari de cada petició (les taules noves ja no tenen permisos sols: s'han de donar)
alter table public.aco_signa enable row level security;
revoke all on table public.aco_signa from public, anon, authenticated;
grant select, insert, update, delete on table public.aco_signa to authenticated;
drop policy if exists aco_signa_select on public.aco_signa;
drop policy if exists aco_signa_insert on public.aco_signa;
drop policy if exists aco_signa_update on public.aco_signa;
drop policy if exists aco_signa_delete on public.aco_signa;
create policy aco_signa_select on public.aco_signa for select to authenticated using (owner = (select auth.uid()));
create policy aco_signa_insert on public.aco_signa for insert to authenticated with check (owner = (select auth.uid()));
create policy aco_signa_update on public.aco_signa for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy aco_signa_delete on public.aco_signa for delete to authenticated using (owner = (select auth.uid()));

-- ===== Les del propietari (amb el seu compte; les regles de la taula s'apliquen) =====

-- Crear una petició: torna l'id i la clau de l'enllaç
create or replace function public.aco_signa_crea(p_obra text, p_ref text, p_info jsonb, p_pdf text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_pdf bytea; v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if (select auth.uid()) is null then raise exception 'cal entrar'; end if;
  v_pdf := decode(p_pdf, 'base64');
  if octet_length(v_pdf) < 100 or octet_length(v_pdf) > 26214400 then raise exception 'mida del pdf'; end if;
  insert into public.aco_signa (token, owner, obra_id, ref, info, pdf)
  values (v_token, (select auth.uid()), left(coalesce(p_obra, ''), 200), left(coalesce(p_ref, ''), 200), coalesce(p_info, '{}'::jsonb), v_pdf)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'token', v_token, 'versio', 1, 'expira', now() + interval '60 days');
end $$;

-- Les peticions del compte (sense el PDF): per saber si algú ha signat
create or replace function public.aco_signa_llista() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'obra', s.obra_id, 'ref', s.ref, 'versio', s.versio, 'signades', s.signades,
    'estat', s.estat, 'expira', s.expira, 'actualitzat', s.actualitzat) order by s.creat), '[]'::jsonb)
  from public.aco_signa s where s.owner = (select auth.uid());
$$;

-- El PDF d'ara d'una petició
create or replace function public.aco_signa_baixa(p_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('id', s.id, 'versio', s.versio, 'signades', s.signades, 'estat', s.estat, 'pdf', encode(s.pdf, 'base64'))
  from public.aco_signa s where s.id = p_id and s.owner = (select auth.uid());
$$;

-- El propietari signa a l'app (o hi puja un PDF signat): el PDF nou passa al núvol si ningú ha signat entremig
create or replace function public.aco_signa_puja(p_id uuid, p_versio integer, p_pdf text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v integer; v_pdf bytea;
begin
  v_pdf := decode(p_pdf, 'base64');
  if octet_length(v_pdf) < 100 or octet_length(v_pdf) > 26214400 then return jsonb_build_object('ok', false, 'error', 'mida'); end if;
  update public.aco_signa set pdf = v_pdf, versio = versio + 1, actualitzat = now()
   where id = p_id and owner = (select auth.uid()) and versio = p_versio
   returning versio into v;
  if v is null then return jsonb_build_object('ok', false, 'error', 'versio'); end if;
  return jsonb_build_object('ok', true, 'versio', v);
end $$;

-- Tancar l'enllaç (quan tothom ha signat, o si es vol aturar)
create or replace function public.aco_signa_tanca(p_id uuid) returns void
language sql security invoker set search_path = '' as $$
  delete from public.aco_signa where id = p_id and owner = (select auth.uid());
$$;

-- ===== Les de qui obre l'enllaç (sense compte): només amb la clau =====

-- Veure el document (null si la clau no hi és, ha caducat o s'ha tancat)
create or replace function public.aco_signa_veure(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('info', s.info, 'versio', s.versio, 'signades', s.signades, 'expira', s.expira, 'pdf', encode(s.pdf, 'base64'))
  from public.aco_signa s
  where length(coalesce(p_token, '')) >= 40 and s.token = p_token and s.estat = 'obert' and s.expira > now();
$$;

-- Desar el PDF amb una signatura més
create or replace function public.aco_signa_signa(p_token text, p_versio integer, p_pdf text, p_qui jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.aco_signa%rowtype; v_nou bytea; v_qui jsonb;
begin
  if length(coalesce(p_token, '')) < 40 then return jsonb_build_object('ok', false, 'error', 'enllac'); end if;
  select * into r from public.aco_signa where token = p_token for update;
  if not found or r.estat <> 'obert' or r.expira <= now() then return jsonb_build_object('ok', false, 'error', 'enllac'); end if;
  if r.versio <> p_versio then return jsonb_build_object('ok', false, 'error', 'versio', 'versio', r.versio); end if;
  if r.canvis >= 30 then return jsonb_build_object('ok', false, 'error', 'massa'); end if;
  begin
    v_nou := decode(p_pdf, 'base64');
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'pdf');
  end;
  -- una signatura afegeix uns quants KB: res de documents nous ni de mides estranyes
  if octet_length(v_nou) <= octet_length(r.pdf) or octet_length(v_nou) > octet_length(r.pdf) + 5242880 or octet_length(v_nou) > 31457280 then
    return jsonb_build_object('ok', false, 'error', 'mida');
  end if;
  -- el document no ha canviat: el PDF nou comença exactament pel que hi havia
  if substring(v_nou from 1 for octet_length(r.pdf)) <> r.pdf then
    return jsonb_build_object('ok', false, 'error', 'document');
  end if;
  v_qui := jsonb_build_object('rol', left(coalesce(p_qui ->> 'rol', ''), 40), 'nom', left(coalesce(p_qui ->> 'nom', ''), 160),
    'nif', left(coalesce(p_qui ->> 'nif', ''), 20), 'org', left(coalesce(p_qui ->> 'org', ''), 160),
    'emissor', left(coalesce(p_qui ->> 'emissor', ''), 80), 'quan', now());
  update public.aco_signa set pdf = v_nou, versio = versio + 1, canvis = canvis + 1, signades = signades || jsonb_build_array(v_qui), actualitzat = now()
   where id = r.id;
  return jsonb_build_object('ok', true, 'versio', r.versio + 1);
end $$;

-- Qui pot cridar cada funció
revoke all on function public.aco_signa_crea(text, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.aco_signa_llista() from public, anon, authenticated;
revoke all on function public.aco_signa_baixa(uuid) from public, anon, authenticated;
revoke all on function public.aco_signa_puja(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.aco_signa_tanca(uuid) from public, anon, authenticated;
revoke all on function public.aco_signa_veure(text) from public, anon, authenticated;
revoke all on function public.aco_signa_signa(text, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.aco_signa_crea(text, text, jsonb, text) to authenticated;
grant execute on function public.aco_signa_llista() to authenticated;
grant execute on function public.aco_signa_baixa(uuid) to authenticated;
grant execute on function public.aco_signa_puja(uuid, integer, text) to authenticated;
grant execute on function public.aco_signa_tanca(uuid) to authenticated;
grant execute on function public.aco_signa_veure(text) to anon, authenticated;
grant execute on function public.aco_signa_signa(text, integer, text, jsonb) to anon, authenticated;

-- Les peticions caducades fa més de 30 dies s'esborren soles cada vegada que es crea una petició nova (per no omplir l'espai)
create or replace function public.aco_signa_neteja() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.aco_signa where expira < now() - interval '30 days';
  return new;
end $$;
revoke all on function public.aco_signa_neteja() from public, anon, authenticated;
drop trigger if exists aco_signa_neteja_trg on public.aco_signa;
create trigger aco_signa_neteja_trg after insert on public.aco_signa for each statement execute function public.aco_signa_neteja();
