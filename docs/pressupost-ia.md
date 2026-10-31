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
2. **Obra i logística** (plegat):
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

1. **Clau d’Anthropic:** a console.anthropic.com, crear un compte de pagament, posar-hi un **límit de despesa mensual** i crear una clau.
   La clau només es posa a Supabase: no s’escriu mai enlloc més.
2. **Secret a Supabase:** panell del projecte › Edge Functions › Secrets › `ANTHROPIC_API_KEY` = la clau.
3. **Límit per compte:** SQL Editor › enganxar `supabase/aco_ia_v878458.sql` › Run.
4. **Instal·lar la funció:** Edge Functions › Deploy a new function › Via Editor › nom `aco-ia` › enganxar `supabase/functions/aco-ia/index.ts` › Deploy.
5. **Provar-ho:** a l’app, Despeses › Fer foto d’un albarà: s’ha d’omplir sol.

**Es pot canviar sense tocar el codi** (Edge Functions › Secrets): `IA_LIMIT_MES` (peticions per compte i mes; de sèrie 300; 0 = sense
límit), `IA_MODEL_DOC` (de sèrie `claude-sonnet-5-5`), `IA_MODEL_PRES` (de sèrie `claude-opus-5-5`), `IA_WEB=0` (no buscar preus a internet).

**Abans d’obrir-ho als clients:** les fotos, les factures i les adreces de les obres s’envien a Anthropic per llegir-les. S’ha de dir a
les condicions del servei; cal parlar-ho amb la gestoria.
