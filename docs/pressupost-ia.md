# Pressupost automàtic amb IA (V87.368)

Encàrrec de l’Héctor (24/10/2026): «fer el pressupost automàticament amb IA un cop entrats els amidaments (Excel i BC3, que no
fallen; el PDF si no hi ha més remei, revisant-lo bé); els preus de la construcció de Girona; si una partida no la sap interpretar,
que la IA busqui el preu amb el descompost en el format del BC3; tenir en compte l’adreça, els accessos, els permisos i la logística,
que poden abaratir o encarir el pressupost; i després els plànols per saber com és realment l’obra».

## Com funciona ara (sense pagar res)

A l’obra › Econòmic › **Amidaments**:

1. **Llegir PDF, Excel o BC3.** Els preus es posen sols, en aquest ordre:
   1. **Arxiu**: el preu que porta l’arxiu. D’un BC3, també el descompost.
   2. **Preus**: la llibreria pròpia, primer pel codi i després per una partida semblant.
   3. **Banc**: el banc de preus BC3 importat, pel mateix codi o per una partida semblant amb la mateixa unitat.
   4. Les **semblants** surten marcades per revisar.
   Des de la V87.462 la pantalla d’Amidaments no ensenya preus: els passos 2 i 3 són a la finestra «Passar-ho a pressupost».
2. **Obra, logística i marges** (plegat):
   - les dades de l’obra: adreça amb «Veure el lloc» (Google Maps), accés del camió, carrer, runes, planta i ascensor, elevació
     de materials, tràmit, setmanes, abocador, tall de carrer, horari i habitatge ocupat;
   - «Afegir les partides de logística» fa el capítol **00 Implantació, logística i permisos**: contenidors segons la runa dels
     enderrocs i excavacions, permís de via pública, llicència o comunicació prèvia, muntacàrregues o grua, pujada manual a
     planta, transport intern, protecció de l’habitatge ocupat i neteja final;
   - un accés difícil compta un **% de mà d’obra de més** (es pot treure en passar-ho a pressupost).
3. **Preus amb IA** (per a les que queden sense preu, i si es vol també les semblants):
   - Ara mateix es fa amb **Claude o ChatGPT** (gratuït): «Copiar i obrir Claude», enganxar la resposta i «Posar els preus».
   - Les instruccions porten l’adreça, l’accés, la logística i les partides.
   - La IA respon en **BC3**, amb el descompost en mà d’obra, maquinària i materials, i diu d’on surt cada preu.
   - Al xat s’hi poden adjuntar els plànols.
4. **Passar-ho a pressupost**: cada partida porta el seu descompost, el preu i d’on surt. La fitxa de la partida diu «Preu: Banc ·
   E2225223 · …».

El **banc de preus** (Preus › Banc de preus, o dins dels Amidaments) s’importa d’un BC3: per exemple, el de «Preus de la construcció»
de Girona o un export del BEDEC / TCQ. Es desa al compte (també al núvol). Fins a uns 12 MB; si és més gran, cal exportar-ne
només els capítols que es fan servir.

## La IA dins de l’app (V87.458)

La funció del servidor és `supabase/functions/aco-ia/index.ts`. **És escrita però no instal·lada.** Mentre no ho estigui, l’app fa
com abans: llegeix el que pot sola i, per a la resta, copiar i enganxar a ChatGPT o Claude. En instal·lar-la no cal tocar res de l’app.

**Què fa:** llegeix albarans, factures i tiquets (foto o PDF), llegeix pressupostos i amidaments en PDF quan l’app no se’n surt, fa les
partides d’un pressupost a partir d’un text, un dictat o uns arxius, i busca el preu amb el descompost de les que no en tenen.

**On es fa servir (V87.459):** al pressupost buit, «Fer el pressupost amb IA»; a «Afegir» o «Accions», «Pressupost amb IA». Es diu o s’escriu què s’ha de
fer, s’hi poden adjuntar amidaments, plànols o fotos, i l’app ensenya les partides amb els preus per revisar-les abans d’afegir-les. Primer es mira Preus, el banc i les
obres anteriors; la IA només posa el preu de les que queden.

**Passos (només cal fer-los una vegada):**

1. **Clau d’Anthropic:** a console.anthropic.com, crear un compte de pagament, comprar 50 $ de saldo, posar-hi un **límit de despesa mensual** de 50 $, deixar la **recàrrega automàtica apagada** i crear una clau.
   La clau només es posa a Supabase: no s’escriu mai enlloc més.
2. **Secret a Supabase:** panell del projecte › Edge Functions › Secrets › `ANTHROPIC_API_KEY` = la clau.
3. **Comptador de lectures:** SQL Editor › enganxar `supabase/aco_ia_v878458.sql` › Run. **Sense aquest pas la funció no treballa**: l’app fa com si no hi hagués IA, perquè no es pugui gastar sense comptar.
4. **Instal·lar la funció:** Edge Functions › Deploy a new function › Via Editor › nom `aco-ia` › enganxar `supabase/functions/aco-ia/index.ts` › Deploy.
5. **Provar-ho:** a l’app, Despeses › Fer foto d’un albarà: s’ha d’omplir sol. Després, a Ajustos › Perfil i mòduls ha de sortir «Lectures amb IA aquest mes: 1 de 500».

**Es pot canviar sense tocar el codi** (Edge Functions › Secrets): `IA_LIMIT_TECNIC` i `IA_LIMIT_EMPRESA` (lectures al mes; de sèrie 150 i 500; 0 = sense
límit), `IA_MODEL_DOC` (de sèrie `claude-sonnet-5-5`), `IA_MODEL_PRES` (de sèrie `claude-opus-5-5`), `IA_WEB=0` (no buscar preus a internet).

**Abans d’obrir-ho als clients:** les fotos, les factures i les adreces de les obres s’envien a Anthropic per llegir-les. S’ha de dir a
les condicions del servei; cal parlar-ho amb la gestoria.

## Quant costa (estimació del 2/11/2026)

**Són estimacions:** la IA encara no s’ha fet servir mai de debò. Els tokens surten del que fa la funció (`aco-ia`) i de les mides de les fotos i els PDF; els preus, de la pàgina oficial d’Anthropic del 2/11/2026 (Sonnet 5.5: 2 $ / 10 $ per milió de tokens; Opus 5.5: 4 $ / 20 $; Haiku 5.5: 0,10 $ / 0,50 $; cerca a internet: 10 $ per 1.000 cerques). Canvi fet servir: 1 $ ≈ 0,87 € (mitjan 2026).

| Feina | Cost normal | Cost alt |
|---|---|---|
| Foto d’un albarà o tiquet (Sonnet) | 0,02 $ | 0,04 $ |
| Factura en PDF (Sonnet) | 0,05 $ | 0,08 $ |
| El mateix amb Haiku (per provar la qualitat) | 0,001–0,002 $ | |
| Pressupost en PDF que l’app no sap llegir | 0,17 $ | 0,52 $ |
| Fer les partides (Opus) | 0,22 $ | 0,54 $ |
| Preus de 15 partides, sense internet | 0,17 $ | 0,25 $ |
| Preus de 15 partides, amb internet | 0,46 $ | 0,98 $ |
| Pressupost sencer amb IA (partides + 2 tandes de preus) | 0,57 $ sense internet · 1,14 $ amb internet | 2,50 $ |

**Amb 50 comptes** (30 constructores i 20 tècnics), al mes:

| Ús | Constructora | Tècnic | Total |
|---|---|---|---|
| Prudent: 30 / 8 despeses, 1 / 0,5 pressupostos, sense internet | 1,60 $ | 0,60 $ | 60 $ ≈ 52 € |
| Normal: 60 / 15 despeses, 3 / 1 pressupostos | 5,51 $ | 1,75 $ | 200 $ ≈ 174 € |
| Molt d’ús: 150 / 30 despeses, 8 / 3 pressupostos | 30,52 $ | 10,02 $ | 1.116 $ ≈ 971 € |
| Normal, llegint amb Haiku i sense internet | | | 79 $ ≈ 69 € |

**Com es paga:** Anthropic no ven paquets per empresa. Hi ha un sol compte i una sola clau: es compra saldo per endavant (no es retorna i caduca al cap d’un any) i cada crida en descompta el que costa. Es pot posar un límit de despesa al mes; el primer nivell del compte (Start) en té un de màxim de 500 $. El «paquet per empresa» el fa l’app, amb un límit per compte.

## Lectures: el paquet de cada compte (V87.469)

**1 lectura = 3 cèntims de dòlar del que costa de debò.** Cada feina compta un mínim, perquè l’usuari sàpiga què gasta; si aquella crida ha costat més (un PDF molt llarg, moltes cerques), compta el que ha costat. Si una feina falla, no compta el mínim però sí el que s’hagi gastat.

| Feina | Mínim de lectures |
|---|---|
| Albarà, factura o tiquet | 1 (una factura llarga, 2 o 3) |
| Pressupost o amidaments en PDF que l’app no sap llegir | 6 per tros |
| Fer les partides d’un pressupost | 8 |
| Tanda de preus (15 partides) | 15 amb internet · 6 sense |
| Pressupost sencer (partides + 2 tandes de preus) | unes 40 |

| Compte | Lectures al mes | Cost màxim |
|---|---|---|
| Tècnic i treballador | 150 | 4,50 $ |
| Constructora, gestió total i compte principal | 500 | 15 $ |

Així, els 50 comptes (30 constructores i 20 tècnics) **no poden passar de 540 $ al mes** encara que tothom ho gasti tot, i el límit de despesa d’Anthropic ho talla abans. Amb l’ús normal de la taula d’abans, una constructora gasta unes 180 lectures i un tècnic unes 55. El perfil el llegeix el servidor de les dades del núvol; l’app no li pot dir quin és. Cada compte veu les seves a Ajustos › Perfil i mòduls; **el cost en dòlars no surt enlloc de l’app**.

**Posar un paquet diferent a un compte** (Supabase › SQL Editor, canviant el correu i el número):

```sql
insert into public.aco_ia_comptes (user_id, lectures_mes)
select id, 1000 from auth.users where email = 'brava@usuaris.controlobres.app'
on conflict (user_id) do update set lectures_mes = excluded.lectures_mes;
```

**Treure-li el paquet** (torna al del seu perfil):

```sql
delete from public.aco_ia_comptes
where user_id = (select id from auth.users where email = 'brava@usuaris.controlobres.app');
```

**Quant ha gastat cada compte:**

```sql
select u.email, i.mes, i.lectures, i.n as crides, i.cost_usd
from public.aco_ia_us i join auth.users u on u.id = i.user_id
order by i.mes desc, i.cost_usd desc;
```

**Què costa de debò cada feina** (per comparar-ho amb l’estimació d’aquí dalt i per veure si les 150 i 500 lectures són el número bo):

```sql
select accio, model, count(*) as crides, round(avg(cost_usd), 4) as cost_mitja, max(cost_usd) as cost_maxim, round(avg(lectures), 1) as lectures
from public.aco_ia_crides where ok
group by accio, model order by accio, model;
```

A les crides no es desa res del document: només quina feina era, el model, els tokens, les cerques, el cost i les lectures.

## Banc de preus comú (V87.460)

Perquè tots els comptes facin servir la base de preus de l’Héctor. **Abans:** comprovar que es té permís per repartir-la (si és d’un col·legi o d’una base amb llicència, n’ha de donar permís qui en té els drets).

1. **SQL:** Supabase › SQL Editor › enganxar `supabase/aco_banc_comu_v878460.sql` › Run.
2. **Importar la base:** a l’app, Ajustos › Preus i marges › Banc de preus › Importar BC3.
3. **Posar-la al dia:** «Preus de l’any» 2023 i «Actualització (%)» 13,4 (gener 2023 → setembre 2026, INE). «Calcular l’IPC (INE)» dona el número d’ara.
4. **Compartir-la:** «Compartir amb tots els comptes».

Quan es canvia el %, arriba sol a tots els comptes. Un compte que importi el seu banc fa servir el seu.
