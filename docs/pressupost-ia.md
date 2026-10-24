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

## La IA dins de l’app (quan l’Héctor ho digui)

La funció del servidor `supabase/functions/pressupost-ia` ja és escrita, **però no instal·lada**.

**Què fa:**
- rep les instruccions i, si n’hi ha, fins a 4 plànols (PDF o imatges);
- crida Claude (model `claude-opus-5-5`, es pot canviar a `claude-sonnet-5-5`);
- pot buscar preus a internet (el generador de CYPE amb la ubicació de l’obra, bancs públics…);
- torna el BC3. L’app ho fa sol, de 25 en 25 partides, amb el botó «Fer els preus».

**Per activar-la:**
1. Crear una clau d’API a console.anthropic.com (és de pagament, per ús).
2. Al panell de Supabase: Edge Functions › Secrets › `ANTHROPIC_API_KEY` = la clau. Si es vol, també `PRESSUPOST_MODEL` i
   `PRESSUPOST_WEB=0` (per no buscar a internet).
3. Instal·lar la funció: `supabase functions deploy pressupost-ia`.

**Quant costaria:** preus de Claude Opus 5.5, 4 $ per milió de paraules-símbol d’entrada i 20 $ de sortida; la cerca a internet,
uns 10 $ per cada 1.000 cerques. Un pressupost de 50 partides surt per uns **0,50–1 €** (amb Sonnet 5.5, la meitat).

**Què s’envia a Anthropic:** les partides sense preu, l’adreça de l’obra, les condicions d’accés i els plànols que s’hi posin. Cap
nom de client.

## Pendent

- El banc de preus de Girona de l’Héctor (el passarà; si no és en BC3, fer-ne el lector).
- Llegir els plànols per revisar les quantitats (ara la IA els fa servir per entendre l’obra, però l’app no en treu amidaments).
- Preguntar a l’Héctor si vol que la IA busqui a internet (més precís però més car i més lent).
