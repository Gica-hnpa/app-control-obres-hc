# APP Control d’Obres — guia per a Claude

> Idioma: parla amb l’usuari (Héctor, arquitecte tècnic de Girona) **en català**. Tota la
> interfície de l’app és en català. Explicacions curtes, pas a pas, sense jerga.
>
> **Norma: escriu SEMPRE en català**: respostes, preguntes, resums i també les notes curtes mentre
> treballes («Ara provo…», «Miro…»). Mai en anglès ni en castellà, encara que l’Héctor escrigui en
> castellà o que un missatge del sistema arribi en anglès.

## Què és

Aplicació web de **gestió d’obres i expedients** per al despatx tècnic de l’Héctor, que s’està
convertint en un producte per a altres professionals:

- **Tècnics** (arquitectes tècnics, project managers): expedients, pressupostos, certificacions,
  honoraris, gestió del temps, agenda, factures als clients.
- **Constructors / contractistes**: obres, pressupostos, control d’obra amb rendiments,
  albarans de material, hores.
- **Clients / promotors**: portal de consulta de les seves obres (mòdul 2, encara intern).
- **Autònoms i operaris**: previstos al pla de producte, **encara no implementats**.

Prova pilot en curs (octubre 2026): 2 constructores (Brava Construccions, Socoterm / Vertical Trek)
i 2 tècnics (Oriol Borràs, Martí Sais), cadascun amb el seu compte al núvol.

## Tecnologia

- **React 19 + Vite 8** (rolldown). Tot el codi de pantalles és en un sol fitxer gran:
  `src/App.jsx` (~12.500 línies). Dependències fixades: lucide-react, pdfjs-dist, xlsx.
- **Dades al navegador**: `src/bigStore.js` substitueix el `localStorage` (5 MB) per **IndexedDB**
  (base `aco_app_storage`) amb la mateixa interfície. Claus `aco_v8782__<usuari>__<clau>`.
- **Desat a l’ordinador** (només l’Héctor): `vite.config.js` (plugin `/__dades-locals`) +
  `src/localDiskSync.js` → `..\DADES\app-control-obres-DADES-LOCALS.json`, còpia diària a
  `DADES\COPIES_AUTOMATIQUES`.
- **Núvol: Supabase** (`src/cloudSync.js`, configuració a `src/cloudConfig.js`).
  - Projecte: `https://bdjendguvbevyowghzfh.supabase.co` (pla gratuït; es pausa si fa 7 dies que no s’usa).
  - Auth amb correu i contrasenya. Els comptes d’empresa entren amb un usuari curt que es converteix en
    `<usuari>@usuaris.controlobres.app`.
  - Taula `aco_kv` (una fila per clau; `aco_odata` es parteix en una fila per obra) amb RLS per usuari.
  - Taula `aco_shared` (obres compartides entre comptes: lectors / editors).
  - Taula antiga `aco_user_state` (V87.121): tancada (sense regles ni permisos des de la V87.262.1), dades velles de juliol.
  - **Permisos (V87.262.1, `supabase/aco_permisos_v87262_1.sql`)**: `anon` sense accés a cap taula; `authenticated` i
    `service_role` només select/insert/update/delete; una regla RLS per acció amb `(select auth.uid())`. Les taules noves
    a `public` ja **no tenen permisos automàtics** (canvi de Supabase del 30/10/2026): **cada SQL nou ha de fer `grant`**.
    Per recrear-ho tot, executar en ordre: `aco_nuvol_v87257`, `aco_compartits_v87259`, `aco_copies_v87260`,
    `aco_fitxers_v87262`, `aco_permisos_v87262_1`.
  - **Arxius (V87.262)**: espai privat de Supabase Storage `aco-fitxers` (`supabase/aco_fitxers_v87262.sql`), carpeta
    `<compte propietari>/<obra>/<arxiu>`. Propietari: tot; obres compartides: lectors veuen, editors afegeixen; només
    el propietari esborra; compte de còpies llegeix tot. L’identificador d’una obra compartida ja no es pot canviar
    i el correu del propietari el posa el servidor.
  - Edge Function `verifactu` (V87.285, `supabase/functions/verifactu/index.ts`) i SQL `aco_verifactu_v87285.sql`:
    factures amb VeriFactu. **Encara no instal·lades** (vegeu `docs/verifactu-pla.md`).
  - Edge Function `llegir-albara` (codi a `supabase/functions/llegir-albara/index.ts`) per llegir albarans
    amb Claude (Anthropic, model Haiku 4.5). **Encara no desplegada.**
  - Funció `aco_espai()` (V87.263, `supabase/aco_espai_v87263.sql`): mida de la base de dades i dels arxius per a
    Configuració → «Espai al núvol» (només l’Héctor; els comptes d’empresa reben null). És «security definer»: el
    Security Advisor la marca com a avís, i és d’esperar.
- **Publicació**: Git a l’ordinador → GitHub `https://github.com/Gica-hnpa/app-control-obres-hc`
  (privat, branca `main`) → **Render** `https://app-control-obres-hc.onrender.com`, que compila sol
  (`npm run build`) a cada pujada. El `dist` no es puja.
  Git és a `C:\Program Files\Git\cmd\git.exe` (si l’ordre `git` no es troba, fer servir la ruta sencera).
- **Còpies del núvol** (V87.260, `tools/copies/`, instruccions a `tools/copies/LLEGEIX-ME.md`): `copia-nuvol.mjs`
  entra amb el compte `copies@usuaris.controlobres.app` (només llegir, regla `supabase/aco_copies_v87260.sql`) i desa
  cada dia a les 13:00 un `.json.gz` per compte a `DADES\COPIES_NUVOL\AAAA-MM-DD` i a
  `C:\Users\Hector\Documents\COPIES_NUVOL\AAAA-MM-DD` (30 dies + dia 1 de cada mes, 12 mesos); els arxius del núvol (V87.262) es copien a
  `COPIES_NUVOL/arxius/<compte>/<obra>/` (només els nous; no se n’esborra cap). Contrasenya xifrada
  amb Windows a `%USERPROFILE%\.aco-copies\config.json` (fora del projecte). `restaurar-compte.mjs` restaura UN compte
  (prova per defecte; `--de-debo` demana la clau secreta, que no es desa). El compte de còpies no s’ha de fer servir
  mai per entrar a l’app.

## Estructura de carpetes

```
D:\00_CUBERO\00_FEINA\PROGRAMES\APP GESTIO OBRES\
├─ app-control-obres\                  ← CARPETA PRINCIPAL (repositori Git), des de la V87.259.2
│  ├─ src\App.jsx                      ← tota l’app
│  ├─ src\main.jsx                     ← ordre d’arrencada: bigStore → localDiskSync → cloudSync → App
│  ├─ src\bigStore.js · localDiskSync.js · cloudSync.js · cloudConfig.js
│  ├─ src\theme-v87249.css … theme-v87257.css   ← estils (el número de versió visible és al 249)
│  ├─ supabase\*.sql · supabase\functions\llegir-albara\
│  ├─ tools\proves\                    ← proves automàtiques (NO pujar a GitHub: hi ha contrasenyes)
│  ├─ docs\estado-actual.md
│  ├─ .gitignore                       ← el que no es puja mai (node_modules, dist, tools\proves, .bat…)
│  └─ OBRIR_APP.bat · OBRIR_APP_MOBIL.bat   ← només a l’ordinador
├─ app-control-obres-v87-XXX-nom\      ← carpetes de versions antigues (arxiu, ja no s’hi treballa)
├─ DADES\                              ← dades reals de l’Héctor (NO tocar en proves)
├─ GUIES_USUARIS\                      ← PDF de benvinguda per a cada empresa (amb contrasenyes)
└─ CAPTURES\                           ← captures que l’Héctor desa per ensenyar-les
```

## Rols i què veu cadascú

| Compte | Com entra | Què veu |
|---|---|---|
| **Héctor** (propietari) | núvol amb el seu correu; en un aparell seu entra sol a `hector` (sense contrasenya local, des de la V87.260) | Tot: expedients, pressupost, certificacions, factures, temps, agenda, albarans, configuració, compartir obres. Les seves dades també es desen a `DADES`. |
| Portal client intern (`client_socoterm`, mòdul 2) | pantalla interna, amb la contrasenya que l’Héctor tria a Configuració (desada xifrada) | Només les obres del seu client i les pestanyes permeses (`allowedTabs`). Lectura, amb edició limitada de pressupost i certificacions. |
| **Comptes d’empresa del núvol** (`brava`, `socoterm`, `oriol`, `marti`) | usuari curt + contrasenya | Espai propi buit (`aco_v8782__emp_<usuari>__…`), administrador del seu espai. La primera vegada trien nom i perfil **Constructor** o **Tècnic**. Albarans per a tots dos perfils. Veuen les obres que algú els ha compartit, amb l’etiqueta «Compartida per…». |

## Decisions importants (no desfer sense parlar-ne)

- **Git en lloc d’una carpeta per versió** (des d’octubre 2026): es treballa sempre a `app-control-obres`;
  cada versió és un commit «V87.XXX – què canvia». Res es puja a GitHub sense el sí de l’Héctor
  (cada pujada es publica a Render). El número es manté a `App.jsx` (`app_version` i `APP_VERSION878264`, que es veu al menú i a Configuració), `package.json`,
  `theme-v87249.css` (`content:"V87.XXX"`), `cloudSync.js`/`localDiskSync.js` (`VERSION`) i els `.bat`.
- **Comptes de prova al navegador**: provar `oriol`, `brava`… en una finestra InPrivate. Si el navegador
  queda amb la sessió del núvol d’una empresa, l’app obre l’espai buit d’aquella empresa (va passar el
  10/10/2026; les dades no es van perdre: «Sortir» i tornar a entrar amb el correu de l’Héctor).
- **Domini `controlobres.app`** (DonDominio, registrat el 13/10/2026): és el domini dels comptes d'empresa
  (`<usuari>@usuaris.controlobres.app`). **Renovar abans del 13/10/2027** (ara la renovació és manual) i **no
  deixar-lo caducar mai**: qui el comprés rebria els correus de canvi de contrasenya de totes les empreses.
- **Registre de comptes tancat a Supabase** (des del 13/10/2026). Els comptes nous es creen al panell:
  Authentication → Users → Add user → Create new user, amb «Auto Confirm User». **Mai esborrar un usuari**:
  s'esborrarien totes les seves dades (`on delete cascade`).
- **Inici sense dades econòmiques** (l’Héctor té clients diversos); l’econòmic va dins de l’obra.
- Interfície **«menys és més»**: res repetit, botons clars, pensat també per a tercers i per al mòbil.
- **Mai tocar el fitxer real de `DADES`** en proves: fer servir còpies i `ACO_DADES_DIR`.
- **Sincronització**: es puja només el que canvia; **si una peça ha canviat al núvol des d’un altre aparell,
  guanya el núvol** (només si la peça és de debò nova al núvol: des de la V87.261 es compara amb la versió coneguda;
  abans, els últims 5 s es tornaven a llegir i podien trepitjar canvis fets aquí); **fre de seguretat** si un aparell vol esborrar o buidar 3+ obres; la primera connexió
  només es dona per bona si acaba sencera. Restauració forçada: marca `forcarNuvol: true` al fitxer DADES.
- **Edició alhora** (V87.266, `cloudSync.js`): si la mateixa peça (una obra, la llista d’expedients…) s’ha canviat aquí
  i també en un altre aparell o compte, **es pregunta** «Quedar-me la meva / la de l’altre» (abans guanyava el núvol en
  silenci). L’altra es guarda com a peça pròpia `aco_versio_v878266_<id>` (es puja; les 50 últimes, 90 dies) i es
  pot recuperar o descarregar a Configuració → «Versions guardades». Cada desat comprova que al núvol hi ha la versió
  que l’aparell coneixia (`PATCH … updated_at=eq.`, `meta.at`), així dos desats gairebé alhora no es trepitgen.
  Mentre hi ha una finestra (`Modal`) o una acta a mig fer oberta, o es dicta, no es pregunta ni es recarrega
  (`__acoCloud.hold`); el rètol diu «Canvis d’un altre aparell» i es pregunta en tancar-la. Obres compartides: igual.
  **En obrir una obra, l’app hi posa sola `updatedAt`, `lastOpenedAt` i `lastWorkedAt`** (a la llista i a les dades de
  l’obra): aquestes dates no compten com a feina (`contentHash`, `meta.kc`/`sm.kc` = contingut conegut sense dates).
  Si només difereixen les dates, o en un lloc només s’ha obert l’obra, es decideix sense preguntar (es queda la feina).
  **Fusió per apartats (V87.293, `src/merge3.js`)**: abans de preguntar, s’ajunten les dues versions a partir de la
  darrera versió comuna (la que l’aparell sabia que hi havia al núvol; es desa a l’aparell a `nuvol-base__<usuari>__<peça>`,
  i per a les obres compartides a `nuvol-base-sh__<usuari>__<obra>`; no es pugen ni van al DADES). Les llistes amb `id`
  (partides, actes, notes, certificacions, obres…) s’ajunten element per element; les llistes de valors (assistents),
  com a conjunts. **Només es pregunta si tots dos han canviat el mateix camp del mateix element** (o un l’ha esborrat i
  l’altre l’ha canviat), i la pregunta ho diu: «Tots dos heu canviat: Pressupost › 01.02 › preu»; la resta de canvis es
  queda igualment i la tria només decideix això. Les dates d’obrir i `activeBudgetIdObra` mai no són conflicte. Una
  peça ajuntada s’aplica com un canvi d’un altre aparell (quan no s’escriu ni hi ha cap finestra oberta) i després es
  puja. Sense versió comuna (p. ex. la primera vegada després d’actualitzar) es pregunta com abans. Va igual entre
  aparells del mateix compte i entre comptes d’una obra compartida. Des de la V87.293, obrir una obra ja no hi posa sol el
  número del «pressupost per al client» (l’efecte `autoBudgetNumber878194` d’`Obra`, de la V87.194): es posa en obrir aquell
  apartat.
- **Comptes separats al mateix navegador** per prefix `emp_`; les dades d’empresa no entren mai al fitxer DADES.
- **Fotos, croquis i documents de les actes** (V87.261, `src/fileStore.js`): el desat de les obres en treu les
  imatges per pes; cada fitxer es desa a part en l’aparell (IndexedDB `aco_fitxers`, clau `<espai>::<id>`) i es torna
  a posar en obrir l’app. **Des de la V87.262 es pugen al núvol** (`aco-fitxers`) amb una cua desada a l’aparell: al
  moment si hi ha cobertura, si no en tornar-n’hi (Safari pot esborrar dades d’una web poc oberta). En obrir una obra,
  es baixen els que falten. Els Documents de l’obra fan el mateix camí. Rètol «X arxius pendents de pujar». Les 11 fotos de
  l’acta del 13/10 de «Projecte piscina av. Rosello 10» es van perdre abans d’aquest arranjament.
  **V87.265**: a l’acta (Fotos) cada foto té 🗑 (la treu de l’obra i de totes les actes; l’arxiu del núvol no s’esborra)
  i «Treure les N fotos sense imatge». Una foto sense imatge només es treu si es comprova al núvol que no hi és (sense
  connexió no es treu res). **V87.267**: la paperera només la té el propietari de l’obra (ni els editors ni els de
  consulta d’una obra compartida, ni el portal de client).
- **Fotos d’obra i albarans en claus pròpies** (`aco_obra_foto_v878259_<id>`, `aco_albara_foto_…`,
  `aco_albara_pdf_…`), reduïdes; abans es treien per pes i no es desaven.
- **Obres compartides**: no es copien a l’espai de l’altre compte; viuen a `aco_shared`.
- Lectura d’albarans: 1) IA directa (si la funció existeix) → 2) text del PDF → 3) ChatGPT copiar/enganxar.
- **Dictat a les actes** (V87.263): botó «Dictar» a Observacions amb el reconeixement de veu del navegador (Chrome/Edge,
  Safari a iPhone/iPad; gratuït, necessita connexió; sense connexió, el micròfon del teclat del mòbil). Català o castellà,
  recordat per aparell. Sense redacció amb IA (l’Héctor no vol funcions de pagament ni més botons). Mentre es dicta, la
  sincronització no recarrega l’app (`__acoCloud.hold`).
- **Espai** (V87.263): fotos reduïdes a 1600 px / JPEG 82 %; si el navegador no les pot reduir i fan >1,5 MB, es
  pregunta. Croquis: el més petit entre PNG i JPEG 92 % (línies → PNG; sobre foto → JPEG). Documents: avís >10 MB,
  bloqueig >50 MB (límit del pla).
- **Idiomes** (V87.268, `src/i18n.js` + diccionari `src/i18n-es.js`): els textos s’escriuen en català dins del codi amb
  `t("…")` (el català fa de clau; `t("Hola {nom}",{nom})` per a variables); si un text no és al diccionari, surt en
  català. L’idioma és **de cada usuari** (clau `aco_v8782__<usuari>__aco_idioma_v878268`, viatja amb el seu compte) i de
  l’aparell (`idioma-app-control-obres`, per a les pantalles d’abans d’entrar). Es tria a Configuració → Idioma
  (recarrega l’app). No toca mai les dades. Les pantalles es tradueixen **a mesura que es modernitzen** (V87.268: menú,
  navegació i núvol; V87.269: Obra; V87.270: Expedients i la capçalera de l’Inici; V87.272: Agenda, Gestió temps i Factures; V87.273: Pressupost i Certificacions; V87.274: Inici, Clients, Agents,
  Configuració, entrada, compartir i benvinguda d’empresa; V87.279: Albarans; V87.281: l’interior de l’obra —Actes, Dades,
  Tasques, Documents, Gantt, seguiment econòmic, honoraris i factures de l’obra—; V87.282: Llibreria de partides, Honoraris,
  Traça i pressupost amb IA; V87.287: vista exacta dels documents, Excel original i avisos d’impressió). Ja només queden
  `CertPreviewV8772`, `PressupostObraPreview878153` i `ProformaPrintV81`, que no surten mai (sempre hi ha la vista exacta). **L’Héctor vol que en canviar d’idioma canviï TOT menys
  les dades** (16/10/2026); el que queda: `node tools/proves/i18n-falta.mjs` (només compta les pantalles que es fan
  servir). Els valors desats en català
  (tipus de cita, estats de factura, tipologies, rols…) **no es canvien**: es tradueixen només en mostrar-los
  (`i18nT(t.k)`), i les dates surten en l’idioma de l’usuari amb `loc878272()`. **Llistes desplegables** (V87.274):
  `<option key={v} value={v}>{i18nT(v)}</option>`: sempre amb `value`, si no es desaria el text traduït.
  `i18n-llistes.mjs` diu quins valors de llistes fixes no són al diccionari. **Compte**: dins d’una funció on hi hagi una variable `t` (p. ex.
  `x.map(t=>…)`, o `const t = …` encara que sigui més avall), `t("…")` no és la traducció i pot petar («Cannot access
  't' before initialization»: va passar a `cloudSync.js` amb la resposta del núvol i l’avís de sense connexió no sortia). `tools/proves/i18ntest.mjs` avisa dels textos sense traduir;
  `i18nscope.mjs`, dels `t("…")` tapats. Eines: `i18n-wrap.mjs` (posa `t(…)` als textos d’un component) i `i18n-afegir.mjs`
  (afegeix traduccions al diccionari sense repetir-les). `residualtest.mjs` busca frases en català a les pantalles en
  castellà. **Compte amb `i18n-wrap`**: si un atribut (`label`, `title`…) és també una **clau de dades**, no s’ha de
  traduir. Va passar a la V87.281 amb `<ExpedientSection8769 label="…">`: el `label` és la clau de les notes i arxius
  de l’apartat (`sectionConfig8769`); en castellà s’haurien desat en una altra clau. Arreglat a la V87.282 (no s’havia pujat).
  Des de la V87.287 `i18n-wrap` se’ls salta sols (`DATA_KEY_LABELS`): si n’hi ha de nous, afegir-los-hi.
  **Documents en l’idioma de l’obra** (V87.283): a Dades de l’obra, «Idioma dels documents» (`obra.idiomaDocs`: buit = el de
  cada usuari, `ca`, `es`). `docLang878283(obra)` el dona; dins de les plantilles (pressupost d’obra, certificacions —a origen
  i «només aquesta»—, proforma, pressupost i factura d’honoraris, acta) els textos van amb `D("…")` = `tl(idioma,…)` de
  `i18n.js`, no amb `t()`. Els títols que fa l’app en català («CERTIFICACIÓ 3 · GENERAL A ORIGEN») es tradueixen tros a
  tros amb `docTitle878283`. Les dades (partides, capítols, descripcions, observacions) **no es tradueixen** (això serà la
  «Traducció amb IA, desada i editable», pendent: cal la clau d’Anthropic). Els conceptes per defecte que es desen en
  català («Honoraris tècnics», «Factura tècnica»…) es mostren traduïts (`i18nT(f.concepte)`), com els estats.
  `window.__acoDocs878283` dona les plantilles a les proves. `i18ntest.mjs` també mira els `D("…")`.
- **Navegació al mòbil i l’iPad** (V87.268, `src/theme-v878268.css`, ≤1280 px o pantalla tàctil): capçalera fixa
  d’una línia amb «Tornar» i el títol (`AppHead878268`) i barra fixa a baix (`BottomNav878268`: Inici · Obres · Agenda
  · Temps — Albarans per als constructors — · Més, que obre el menú de sempre). El rètol del núvol és un punt a dalt a
  la dreta; «Desat a l’ordinador» només a l’ordinador. **`overflow-x:clip`** (no `hidden`) a html, body, #root i .main:
  amb `hidden` les capçaleres fixes (sticky) no funcionaven. Una sola lletra per a tot (també els codis).
- **Pantalla d’Obra** (V87.269, `ObraBar878269`, `src/theme-v878269.css`): una sola barra. A dalt: codi curt · client ·
  tipus, l’estat (es canvia aquí) i un menú ⋯ (crear/editar pressupost, modificar fitxa, eliminar expedient); a
  l’ordinador també el nom i «← Expedients» (al mòbil van a la capçalera fixa). A sota, els apartats en una tira que es
  pot lliscar i es queda fixa en baixar, amb «Més» per a la resta (agrupats). **Abans** hi havia «Apartats de l’obra» i
  «Accions» per separat i cada apartat s’obria en una finestra a sobre («Editant l’expedient», amb un altre selector):
  ara s’obre a la mateixa pàgina (`.obra-edit-overlay-v878242` passa a `position:static` i se n’amaga la capçalera).
  La barra vella d’apartats (`.obra-side-tabs-v87105`) s’amaga amb un selector molt específic perquè theme-v87253.css
  la tornava a mostrar a l’ordinador. Al «Resum» ja no es repeteixen nom, codi, estat ni tipus.
- **Menú de l’obra en tres blocs** (V87.299, `OBRA_BLOCS878299`, `obraBlocs878299`, `src/theme-v878299.css`; decisió de
  l’Héctor del 18/10/2026, `docs/proposta-moduls-preus.md` §7):
  - **Els blocs:** a la barra de l’obra, en aquest ordre, **Fitxa · Seguiment · Econòmic**:
    - **Fitxa:** Resum, Dades, Agents, Documents i Entrega, i els apartats de documentació d’alguns treballs.
    - **Seguiment:** Actes, Notes, Agenda, Tasques i Planning.
    - **Econòmic:** Pressupost, Certificacions, Facturació, Despeses, Rendiment, Seguiment econòmic, Honoraris i Hores.
    - Un apartat que no és a cap bloc va a Fitxa.
  - **Ordinador i iPad** (≥768 px): la fila del bloc es queda oberta a sota. Tocar un bloc obre el seu últim apartat, o
    el primer.
  - **Mòbil:** el bloc obre un quadre amb els seus apartats, que es tanca en triar; el bloc actiu diu l’apartat.
  - Ja **no hi ha tira que es llisca ni «Més»**. En obrir una obra, sempre el Resum.
  - **Noms nous dins de l’obra** (`tabLabel878269`): Gantt → Planning, Albarans → Despeses, Tancament / Entrega →
    Entrega, Gestió temps → Hores. Només canvia el que es veu: les claus de les pestanyes no canvien.
  - **Per a les proves:** `data-apartats` a `.obra-blocs-v878299` dona la llista per blocs.
  - **Fet després:** el botó ＋ (V87.302), els noms nous del menú (V87.300), els apartats ajuntats (V87.308: Dades i agents,
    Agenda amb tasques, Honoraris amb les hores, Rendiment) i Visites (V87.309).
- **Colors de l’estat dels expedients** (V87.299, `estatTone878299`): a la llista (etiqueta, desplegable de la taula i
  targetes del mòbil) i a la barra de l’obra.
  - **Verd:** En procés i En curs / Actiu.
  - **Negre:** Tancat.
  - **La resta:** blau (Pressupostat), taronja (Pendent de resposta), verd blavós (Acceptat), lila (En revisió), vermell
    (No acceptat) i gris (Anul·lat).
- **Noms nous del menú principal** (V87.300, decisió de l’Héctor del 17-18/10/2026):
  - **Menú i capçalera:** Obres (abans Treballs / Expedients), Preus (Llibreria), Facturació (Factures), Hores (Gestió
    temps), Despeses (Albarans), Agenda (Agenda / Calendari) i Ajustos (Configuració). També el títol de la capçalera del
    mòbil (`SCREEN_TITLE878268`).
  - **Barra de baix:** Hores i Despeses.
  - **Llista d’obres:** «Obres» i «Nova obra»; «← Obres» a la barra de l’obra.
  - **Despeses:** «Despeses d’aquesta obra».
  - **Només canvia el que es veu:** les claus de pantalla (`nav("Treballs / Expedients")`, `"Traça"`, `"Configuració"`…)
    no canvien.
  - **Proves:** naveguen pels noms nous. Compte: «Configuración» → «Ajustes» (no «Ajustosn»).
  - **Guies de benvinguda** (`tools/proves/guies.js`): textos posats al dia el 20/10/2026 (Obres/Expedients, Despeses, Hores,
    Facturació, Ajustos, l’edició alhora). Els PDF de `GUIES_USUARIS` no s’han tornat a fer (porten les contrasenyes: quan ho
    digui l’Héctor).
- **Agents** (V87.301, encàrrec de l’Héctor del 18/10/2026; `src/theme-v878301.css`):
  - **La mateixa persona surt una sola vegada.** Cada obra en desa una còpia amb un id propi, i abans la llista general en
    comptava cada còpia (88 entrades per a 26 persones). `agentPersona878301` reconeix la persona pel nom (i, a la
    biblioteca, també pel NIF); `agentsLibrary878301` ajunta les dades.
  - **Grups:** Tècnics · Constructors · Industrials · Promotors / propietat · Administració · Altres (`agentGroup878301`).
    «do» / «deo» compten com a paraula sencera: abans «CP EDIFICI COMODORO» sortia com a tècnic.
  - **Pantalla Agents:** «Editar» (abans «Gestionar») i **«Treure de la llista»** (abans «Eliminar» / «Amagar d’Agents»).
    Treure’l només l’amaga de la llista i del selector; no l’esborra de cap obra ni de cap acta. Es desa a la clau pròpia
    `aco_agents_amagats_v878301` (amb el nom). La llista vella `hiddenAgentIdentities878192` de la pseudo-obra
    `__global_agents_878188` no funcionava: les claus «data:…» es buidaven en desar (`stripHeavy878185`).
    Cada agent diu a quantes obres surt.
  - **Pestanya Agents de l’obra:** només els seus; sense cap, «encara no té agents».
    - «+ Afegir agent» obre `AgentPicker878301`: grups, cercador i caselles; «Ja hi és» per als que ja hi són; «Crear un
      agent nou». La llista és la mateixa que la de la pantalla Agents (`agentsLib878301`).
    - Amb 10 o més agents, o amb repetits, surt un avís amb «Ajuntar els repetits» (una fitxa per persona, amb totes les
      dades) i «Triar quins treure».
  - **Causa de les obres amb 22-24 agents:** les actes (`Actes8761`) copiaven a l’obra tots els agents de la llista en
    obrir-ne o fer-ne una i en desar-la. Ara l’obra guarda només els que surten a l’acta en desar-la i els que s’hi afegeixen.
    Les dades d’abans no s’han tocat: l’Héctor les pot ajuntar o treure des de l’avís.
  - **Botó «A dalt»** (`BackTop878301`): surt en baixar més de 700 px, a baix al mig (al mòbil, per sobre de la barra de baix).
- **Botó ＋ dins de l’obra** (V87.302, `ObraPlus878302`, `src/theme-v878302.css`; decisió de l’Héctor del 18/10/2026):
  - **On:** només al mòbil i l’iPad, a baix a la dreta, per sobre del comptador de temps i de la barra de baix.
  - **Opcions:**
    - **Foto:** obre la càmera i fa una nota nova amb la foto.
    - **Nota:** nota nova.
    - **Acta:** acta nova.
    - **Hores:** porta a Econòmic › Hores de l’obra.
  - **Com funciona:** l’Obra passa `start={tab,token,files}` a `Notes878278` i `Actes8761`. Un `useRef` fa que cada toc faci
    una sola cosa: en desenvolupament React executa dues vegades els efectes, i es feien dues actes.
  - **Apartats ajuntats:** fet a les V87.308 i V87.309 (vegeu més avall).
- **Menús desplegables visibles i barres fixes a l’ordinador** (V87.303, `src/theme-v878303.css`; avís de l’Héctor del
  19/10/2026: «Accions» del pressupost quedava sota el pressupost):
  - **Causes:**
    - al mòbil, la capçalera del pressupost era `position:static`, amb `backdrop-filter`, i el menú quedava sota les línies;
    - el menú (520 px) sortia de la pantalla i quedava sota la barra de baix, el comptador de temps (capa 6000) o el ＋.
  - **Arreglament:**
    - la capçalera té capa pròpia, i mentre el menú és obert passa per sobre (`:has(details[open])`, capa 95);
    - un sol codi a l’`App` (event `toggle`, en captura) ajusta qualsevol menú `details` amb panell absolut. Primer
      l’escurça amb `max-height !important` fins a sobre de l’obstacle i, només si hi queden menys de 240 px, puja una
      mica la pàgina. Si es puja la pàgina abans d’escurçar-lo, la pàgina torna enrere sola: el menú obert la feia més llarga.
  - **Barres fixes a l’ordinador:** `overflow-x:hidden` a html, body, #root i .main impedia que res es quedés fix en baixar.
    Ara és `clip`, com al mòbil des de la V87.268. La barra de l’obra i la capçalera del pressupost es queden a la vista.
  - **Posició:** la capçalera fixa del pressupost es col·loca just sota la barra de l’obra (`--obra-bar-h`, la posa
    `ObraBar878269` amb un `ResizeObserver`).
- **Revisió de tota l’app** (`tools/proves/auditoria.mjs`, «clients virtuals»):
  - **Qui:** l’Héctor (còpia del DADES) a l’ordinador, l’iPad i el mòbil; constructora (brava) i tècnic (oriol) a
    l’ordinador i el mòbil, amb una obra de prova.
  - **On:** totes les pantalles del menú i tots els apartats de 4 obres.
  - **Què mira:** errors de JavaScript, «Mode segur», coses que surten per la dreta, pantalla buida, menús tapats.
  - **Resultat:** informe i captures a `D:\aco-tmp\auditoria`. `menustest.mjs` prova «Accions» i «Imprimir».
  - Els menús es miren com una persona: es porta el botó a la vista i s’espera que l’app ajusti el menú. Abans marcava el
    «⋯» de l’obra tapat «per res» perquè el clicava quan ja havia marxat amunt (la primera línia de la barra no es queda fixa).
  - L’etiqueta de l’estat ara surt traduïda.
- **Sessió del núvol amb l’app en dues pestanyes** (V87.303, `cloudSync.js`; el 19/10/2026 l’Héctor va haver de tornar a
  entrar i no recordava la contrasenya):
  - **Causa:** la sessió es desava al localStorage de bigStore (IndexedDB), que cada pestanya llegeix només en obrir-se. Cada
    hora una pestanya renovava el permís; l’altra ho provava amb el vell, el núvol el rebutjava (i anul·lava la sessió) i la
    pestanya esborrava l’entrada de totes dues.
  - **Ara:** la sessió va al localStorage de debò (`window.__acoStore.real`, el veuen totes les pestanyes al moment); abans de
    fer servir el permís es mira si una altra pestanya ja l’ha renovat (`adoptNewer`); només en renova una alhora
    (`navigator.locks`, «aco-nuvol-sessio»); si el núvol el rebutja però n’hi ha un de més nou desat, es fa servir aquest.
    Es llegeixen tots dos llocs i es queda la sessió renovada més tard (les sessions d’abans eren a bigStore).
  - **Prova:** `sessiotest.mjs`. El Supabase de proves renova el permís com el de debò amb `MOCK_ROTA=1` (`MOCK_EXPIRES`,
    `MOCK_REUSE_MS`; `GET /__auth` dona els comptadors). Amb la V87.302 reprodueix l’error (4 de 11); amb la V87.303, 11 de 11.
  - **Si torna a passar:** a Ajustos › «Usuaris, clients i permisos» › «Canviar la meva contrasenya del núvol» (des d’un
    aparell encara connectat; no demana la vella).
- **Fre de seguretat del núvol sense avisos falsos** (V87.303, `massChange` de `cloudSync.js`; el 19/10/2026 a l’Héctor li va
  sortir «Aturat per seguretat… 16 expedients (n’hi havia 19)» en un navegador que feia dies que no es connectava):
  - Les obres esborrades expressament («Eliminar expedient» crida `__acoCloud.esborrada(id)`) no compten. Abans, esborrar 3
    obres d’una tirada (p. ex. les de prova) quedava aturat i no arribava al núvol. Es recorden al localStorage de debò
    (`nuvol-aco-esborrades`) fins que l’esborrat arriba al núvol: també si s’esborren sense connexió i es tanca l’app.
  - «Deixar el núvol amb N expedients» només es mira si l’aparell puja de debò la llista d’obres, i abans d’aturar-se es
    pregunta al núvol quantes n’hi ha ara (el número que l’aparell recordava, `meta.obres`, podia ser de dies abans).
  - Un aparell amb dades velles que deixaria el núvol amb 3 obres menys continua aturat.
  - **Prova:** `fretest.mjs` (V87.302: 5 de 8; V87.303: 10 de 10, amb el cas d’esborrar sense connexió i tornar a obrir).
- **«Canvis alhora» diu què és diferent** (V87.303, `diffLabels` de `merge3.js`): sense versió comuna (un aparell que feia dies
  que no es connectava) abans només deia el nom de la peça. Ara diu «Aquest aparell i el núvol tenen dues versions diferents
  de:» i «Què és diferent: Actes › núm. 3 › només en aquest aparell · Pressupost › 01.02 › preu». Si l’ha desat el mateix
  compte, «Al núvol: Tu mateix, des d’un altre aparell o pestanya». Prova: el cas 1b de `fusiotest.mjs`.
- **Agents: buidar les obres i afegir o eliminar sempre** (V87.303, encàrrec de l’Héctor del 19/10/2026; les obres tenien agents
  posats per error o per provar, i els vol tornar a posar ell a cada obra des de la llista):
  - **Pantalla Agents:** avís «Agents posats a les obres» amb «Treure els agents de totes les obres»
    (`buidarAgentsObres878303`). Abans de buidar-les:
    - cada acta es guarda dins seu (`acta.agents`) les dades dels seus assistents (les actes els busquen pel número a l’obra;
      si no, en desar-les es perdrien);
    - tothom passa a la llista principal (`__global_agents_878188`);
    - còpia de seguretat a `aco_agents_obres_copia_v878303`.
    Les obres compartides per altres comptes no es toquen. Amb les dades de l’Héctor: 87 agents de 12 obres, i la llista
    continua amb les 23 persones.
  - **Llista principal:** «Eliminar» a la vista de cada agent (el treu de la biblioteca i de la llista; les obres i les actes on
    ja hi és el conserven). Si es torna a crear o a afegir, torna a sortir (`unhideAgent878303`; abans quedava amagat per sempre).
  - **Obra:** «Treure» a cada agent sense obrir-lo (`agent-treure-v878303`); qui es treu d’una obra continua a la llista
    principal (`guardarALaLlista878303`, si no és que s’havia eliminat de la llista expressament).
  - **Actes:** en desar una acta, a l’obra només s’hi afegeixen els assistents nous d’aquella edició (`orig878303`), no tots
    els d’una acta antiga.
  - **Prova:** `agents303test.mjs`.
- **Dades de l’obra: el que s’està escrivint no es perd** (V87.303, `FitxaDadesTab8769`; 19/10/2026: «el promotor no es desa,
  em torna a posar Socoterm»): cada desat de l’obra en canvia la data (`setD` posa `updatedAt` a la llista d’obres) i el
  formulari es tornava a omplir amb el que hi havia desat. Triar el promotor l’afegeix als agents de l’obra (un desat), i
  tornava enrere abans de «Guardar dades». Ara, si s’ha començat a canviar el formulari (`editant878303`), no es torna a omplir
  fins a «Guardar dades» o fins que s’obre una altra obra. Prova: `dadestest.mjs` (V87.302: 4 de 8; V87.303: 8 de 8).
- **Comptador de temps sense tornar a dibuixar l’app** (V87.304, `TimerClock878304`; 19/10/2026: «no aguanta el desplegable» de
  la constructora). L’App posava al dia el temps del comptador a l’estat cada 500 ms: dins d’una obra (on el comptador sempre
  corre) es tornava a dibuixar tota l’app dues vegades per segon, i els desplegables definits dins d’un altre component
  (`AgentPicker` de Dades, `NewExpAgentPicker878159`) es tornaven a crear i es tancaven sols. Ara el rellotge es posa al dia ell
  sol, i aquells desplegables es criden com a funció (`{AgentPicker({...})}`), no com a component. **Compte**: un component
  definit dins d’un altre (`function X(){…}` dins del cos d’un component) es torna a crear a cada dibuix; no fer-ne amb camps.
- **Població i codi postal automàtics a tot Catalunya** (V87.304, `src/poblacions-cat.js`): 1.412 codis postals dels 947
  municipis (dades obertes de la Generalitat, «Codis postals per municipis de Catalunya», conjunt tp8v-a58g, baixat el
  19/10/2026 amb el sí de l’Héctor; es pot reutilitzar citant la font). Primer van els de la llista feta a mà
  (`CP_MUNICIPIS8773`, amb nuclis com S’Agaró, Platja d’Aro, l’Estartit, Calella, Llafranc, Tamariu) i els que ha escrit l’usuari.
  El codi principal de cada municipi va primer (capitals: el més baix; la resta: els propis del municipi, i el que acaba en 0).
  `cpRows8775` es calcula una sola vegada (abans es repassava tota la llista a cada lletra).
- **Obra nova més ràpida** (V87.304, `QuickExpedientForm878254`, `promotorObra878304`): client nou amb totes les dades (NIF,
  telèfon, correu, adreça, codi postal i població automàtics); «El promotor és el mateix client» marcat de sèrie (si no, nom i
  NIF del promotor); l’adreça de l’obra a la vista amb «La mateixa adreça que el client». El promotor-client porta el NIF,
  l’adreça i el contacte del client (abans un promotor diferent sense NIF es quedava el del client).
  **Agents d’una obra nova** (`agentsObraNova878304`): només els de debò (el promotor, i la constructora i els tècnics escrits).
  Abans n’hi anaven sempre tres: l’Héctor (escrit al codi, amb un correu inventat, també a les obres de les empreses), el
  promotor i una «constructora» que, si no se n’escrivia cap, era el client. La DEO de sèrie («Héctor Cubero») només al compte de
  l’Héctor i en obres que no són una feina tècnica senzilla.
- **Dades de l’obra en pestanyes** (V87.304, encàrrec de l’Héctor del 19/10/2026; `FitxaDadesTab8769`, `src/theme-v878304.css`):
  - **Pestanyes:** Obra · Client · Promotor · Constructora · Direcció d’obra · Direcció d’execució · Coordinació S+S · Industrials
    (punt verd a les que tenen algú). En una feina tècnica senzilla (cèdula, certificat…) només Obra, Client i Promotor (i les
    que ja tenen algú), amb «+ Altres agents». Tot es desa amb «Guardar dades» (a dalt i a baix).
  - **Fitxa de persona** (`FitxaPersona878304`, també a la pestanya Agents de l’obra i a la llista principal d’Agents): nom
    complet o raó social, NIF, telèfon (de l’empresa o del despatx), mòbil, correu, **persona de contacte amb el seu mòbil**
    (`contacte`, `contacteMobil`), i **l’adreça separada** (`CampsAdreca878304`: carrer, codi postal, població, província; el codi
    postal omple la població i al revés). Tècnics: titulació, núm. de col·legiat, despatx. Industrials: ofici.
  - **Adreça:** es desen les parts (`carrer`, `codiPostal`, `poblacio`, `provincia`) i també `adreca` sencera («Carrer, 17230
    Palamós»), que és la que fan servir els documents. Les fitxes d’abans amb l’adreça tota junta es separen soles
    (`partsAdreca878304`). Promotor: `carrerPropietat`, `cpPropietat`, `poblacioPropietat`, `contactePropietat`,
    `mobilPropietat`… i `adrecaPropietat` sencera.
  - **Client:** és la fitxa de Clients (`clientPersona878304` ↔ `clientDeFitxa878304`): canviar-la aquí la canvia a Clients.
  - **Promotor:** «El promotor és el mateix client» (copia les dades del client en desar) o un altre (triat de la llista o nou).
  - **Constructora i tècnics** (`ROLS878304`): un per paper, triat de la llista d’agents o nou; el nom va a l’obra
    (`constructor`, `do`, `deo`, `css`) i la fitxa als agents de l’obra (`desaAgentsDades878304`). **Industrials:** diversos.
  - Ja no hi ha a dalt el codi de carpeta (és dins d’«Obra») ni «Agents principals» (és a la pestanya Agents).
  - **Prova:** `fitxestest.mjs` (30 de 30). `dadestest.mjs` adaptada a les pestanyes.
- **Resum de l’obra: contacte** (V87.304, `ContacteObra878304`): adreça de l’obra i contacte del client (telèfon i correu que es
  poden tocar); si el promotor és un altre, el seu nom en **negreta** (`promotorDiferent878304`), també a la barra de l’obra.
- **«Accions» del pressupost en 4 grups** (V87.304): Editar · Crear o importar · Compartir i imprimir · Aquest pressupost.
  «Com ha de ser l’Excel» ja no és al menú: «Importar Excel…» ensenya l’ajuda amb «Triar l’Excel».
- **V87.304.1** (19/10/2026, avisos de l’Héctor amb la V87.304 publicada):
  - **Espais als camps nous:** els camps de les fitxes mostraven el valor retallat (`netV878304`) i l’espai entre paraules
    desapareixia en escriure’l. Ara es mostra sense retallar (`rawV878304`); es retalla en desar.
  - **Agents:** l’avís «Agents posats a les obres» només surt si no s’ha fet mai la neteja i hi ha agents d’abans posats sols (els
    tres de cada obra nova d’abans, o una obra amb 10 o més); abans sortia sempre que una obra tenia algun agent. Fora la nota
    «Biblioteca general d’agents». **L’Héctor no vol a l’app textos que expliquin l’app o la feina feta.**
  - **«Expedients» per al perfil tècnic** (`PERFIL878304`, `etObres878304`, `etNovaObra878304`; l’Héctor: «hi ha molts treballs
    tècnics que no són obres»): menú, barra de baix, capçalera, títol de la llista («Nou expedient») i tornar de l’obra. Els
    constructors continuen amb «Obres» / «Nova obra». L’Héctor (sense perfil d’empresa) és tècnic. Les proves naveguen per
    `^(Obres|Expedients)$`.
- **Llegir un pressupost en PDF** (V87.305, `src/pressupostPdf.js`, `PdfPressupost878305`, `importPdfBudget878305`; encàrrec de
  l’Héctor del 19/10/2026). Sense IA. «Accions» › «Llegir un pressupost en PDF…»:
  - `liniesPdf` llegeix el text del PDF per línies (pdf.js, com els albarans); `llegirPressupostPdf` hi reconeix capítols («01
    ENDERROCS», «CAPÍTOL 2 …», «C02 …»), partides (codi de punts 01.02 o del BEDEC «1 E2225223 m3 …», unitat, text de diverses
    línies, quantitat, preu, import), totals (no compten) i el total del PDF. Cada partida es comprova (quantitat × preu =
    import) i es busca la combinació que quadra; als pressupostos amb amidaments (Presto), les línies de mides valen fins que
    n’arriba una de només números o «TOTAL PARTIDA». Les que no quadren o no tenen números queden per revisar.
  - La finestra ensenya les partides per capítols (es poden desmarcar i corregir: unitat, concepte, quantitat, preu) i el total
    triat comparat amb el del PDF. Un PDF escanejat (sense text) no es pot llegir: ho diu.
  - En desar: si el pressupost actiu ja té partides, se’n crea un de nou («PDF · <nom del fitxer>») i no es toca res; si és buit,
    s’hi posen. Partides `tipus:"Import PDF"`. El PDF original va a Documents (com l’Excel, `persistImportedExcelDocument878245`).
    La finestra arriba a la funció de l’App per `window.__acoImportPdf878305` (el pressupost surt a molts llocs).
  - Proves: `pdfpressupostunit.mjs` (sense navegador: formats de números, l’app, Presto, descripcions llargues, TCQ, avisos) i
    `pdfpressuposttest.mjs` (el navegador fa els PDF i es llegeixen des d’una obra; mòbil).
- **V87.305.1** (19/10/2026; l’Héctor: el PDF de Socoterm no es llegia, «o he de fer com els albarans amb ChatGPT?»):
  - **Sense codis, com una factura** (Socoterm: «Nº · Descripción · Cant · PU sin IVA · IVA · PVP sin IVA»; `llegirSenseCodis`): cada
    línia amb text i quantitat × preu = import és una partida; el títol en majúscules d’abans és el capítol; l’IVA (`10%`), «€» i
    «Total sin IVA» no compten com a partida. **Honoraris** («Concepte · Import»): una partida de 1 pa × l’import.
  - **Apartats que no són el pressupost** (provat amb `Pressupost_Llafranc.pdf` de Baixades, 135 pàg.: Pressupost, Amidaments i
    Descomposats amb les mateixes partides, que es comptaven tres vegades): un títol «AMIDAMENTS», «MEDICIONES», «DESCOMPOSATS»,
    «CUADRO DE PRECIOS»… (en majúscules o amb «Pàgina N» al peu) atura la lectura fins a «PRESSUPOST»; una partida repetida amb el
    mateix codi i nom no es torna a comptar; «8.00 8.00» no és una partida.
  - **Codis sense punts** («13001 u Finestra… 1.00 666.92 € 666.92 €», amb unitat i números que quadren) i **codis que no són del
    capítol** (`080.15` dins de «09 PAVIMENTS»: es queda al capítol del títol; només es passa a un capítol nou pel codi si és el
    següent amb les mateixes xifres). «13.020 mm de longitud…» dins d’una descripció no és un codi. Llafranc: 104 partides, 27
    capítols, el total quadra al cèntim amb el PEM (132.816,84 €).
  - **«Llegir-lo amb ChatGPT o Claude»** (`iaPdfPrompt878305`, `rowsDeIa878305`), com els albarans: surt destacat si l’app no hi troba
    cap partida (també un PDF escanejat) i a la revisió. Copia les instruccions amb el text del PDF (si passa de 50.000 lletres, diu
    que s’adjunti el PDF al xat), obre ChatGPT o Claude, s’enganxa la resposta (pot venir en diverses parts, «CONTINUARÀ») i les
    partides passen a la mateixa revisió (lector de taules del «Pressupost amb IA», `parseAiBudget878256`). Res de pagament.
  - `copyText878256`: si el navegador no deixa copiar, ja no queda un error sense recollir.
  - **L’Héctor el va provar al mòbil (19/10/2026):** el PDF de Socoterm encara no es llegia bé (el PDF no és a l’ordinador: cal
    que el passi). La via ChatGPT/Claude li sembla **mala solució** per a usuaris que no en saben («li has de dir com és cada
    columna»); proposta: lectura amb IA directa a la funció del servidor (com la dels albarans), pendent del seu sí i de la clau
    d’Anthropic.
- **V87.305.2 · Eliminar qualsevol pressupost de l’obra** (19/10/2026; l’Héctor en va crear un de més amb el PDF i no el podia
  treure): abans només s’eliminaven els annexos, mai el principal (ni sortia l’opció). Ara «Eliminar aquest pressupost» surt
  sempre que n’hi ha més d’un (`potEliminarPressupost878305`, `treuPressupost878305`): si s’elimina el principal, el següent passa
  a ser-ho (`principalBudgetName` = el seu nom, les seves partides, certificacions i factures passen a `budgetId` principal). No
  si és l’únic (diu que es buidi) ni si alguna certificació té factura (`vfTeFactura878285`). La pestanya interna «Pressupost
  obra» (portal i plantilles) tampoc tenia la tira de pressupostos (`BudgetBar878273`), «Pressupost nou», «Canviar el nom» ni
  «Eliminar»: ara sí (`addDirectBudget878305`, `renameDirectBudget878305`, `deleteDirectBudget878305`), no al portal de client.
  Proves: `pdfpressuposttest.mjs` (eliminar el nou i després el principal) i `pressuposttest.mjs`.
- **V87.305.3 · El PDF de Socoterm de debò** (l’Héctor el va passar el 19/10/2026: `D:\fotos de google\SÀBAT MOLÍ DE VENT II -
  REPARACIÓN DE GRIETA EN FACHADA (1).pdf`; dades d’un client, no copiar-lo a les proves): el text de la partida i els números van
  en **línies diferents** («Reparación de grieta… mediante» i a sota «1 989,00 € 10% 989,00 €»). `llegirSenseCodis`: després de la
  capçalera de la taula, el text espera (`pendent`) fins que arriba una línia només de números que quadren, i en fa la partida; el
  text de sota és la descripció. Entre dues partides, la nova comença a l’última frase abans dels seus números. «Pago por…» i
  «Leído y aprobado» tanquen la descripció. Resultat: 1 partida de 989,00 € al capítol «01 REPARACIÓN DE GRIETA EN FACHADA».
  Prova: cas 6b de `pdfpressupostunit.mjs` (45).
- **Mòdul tècnic, versió 1** (V87.305, `src/encarrecsTecnics.js`; `docs/proposta-perfil-tecnic.md`):
  - **Passos de l’encàrrec** (`PassosEncarrec878305`, al Resum de l’obra) per a la cèdula d’habitabilitat, el certificat
    energètic i la inspecció d’edifici (`encarrecDe` pel tipus de feina): Encàrrec · Documentació · Visita · Oficina · Tràmit ·
    Lliurament, cada un amb la llista de comprovació; el pas actual és el primer que no té tots els punts fets. A cada pas es
    poden afegir punts propis. Es desa a l’obra (`data.passos878305 = {fets, propis}`). Les dades de normativa (anys de validesa)
    no hi són: pendents de confirmar amb l’Héctor.
  - **Inici:** «Encàrrecs tècnics» oberts agrupats pel pas en què són (`EncarrecsInici878305`).
  - **Enllaços de l’obra** (`EnllacosObra878305`, al Resum): el **Cadastre** amb la referència cadastral (adreça comprovada:
    `OVCListaBienes.aspx?rc1=<7>&rc2=<7>`); cèdula → tràmit de segona ocupació (tramits.gencat.cat, comprovat); certificat
    energètic → ICAEN i el cercador de certificats (comprovats). A **Ajustos › Enllaços de les obres** l’usuari hi afegeix els
    seus (`aco_enllacos_v878305`; `{rc}`, `{rc1}`, `{rc2}`, `{poblacio}`, `{adreca}`), amb un botó per a l’oficina virtual del
    CATGI (l’adreça no s’ha trobat: l’ha de posar l’Héctor; no s’hi pot entrar per ell).
  - Prova: `tecnictest.mjs` (14).
- **Mòdul tècnic, versió 2** (V87.306, decisió de l’Héctor del 20/10/2026 provant la cèdula de Jaume I: els passos que s’havien
  de marcar per avançar no l’ajudaven a la visita). `EncarrecTecnic878306` (substitueix `PassosEncarrec878305`, al Resum):
  - **Documents per presentar** (`TRAMITS` i `estatDocs` de `src/encarrecsTecnics.js`): llista **proposada** per a la cèdula (9),
    el certificat energètic (6, amb el PDF i l’XML del CE3X) i la ITE (6); l’Héctor l’ha de corregir. Cada document es puja aquí
    i va a Documents de l’obra (carpeta `01_TRAMITS_AJUNTAMENT`, camp `tramit878306` = la clau), o es marca «No cal»
    (`passos878305.docsNoCal`); se n’hi afegeixen de propis (`docsPropis`). Xip «Falten N de M» / «Tot a punt» / «Presentat el…».
    Botó del tràmit (cèdula: tramits.gencat.cat; certificat: ICAEN; ITE sense enllaç, no s’ha trobat cap adreça que funcioni),
    destacat quan tot és a punt, i «Marcar com a presentat» (`passos878305.presentat`).
  - **Llista per no oblidar res:** els 6 apartats de sempre plegables («Visita» oberta), per consultar; marcar no fa avançar res.
  - **Inici:** «Falten documents» · «A punt per presentar» · «Presentats» (abans, pel pas).
  - **Enllaços:** MagicPlan (`https://cloud.magicplan.app/`) a la cèdula; els tràmits ja no hi són (són el botó de l’apartat).
    CE3X: programa d’ordinador, sense enllaç possible. Llegir el plànol de MagicPlan: quan l’Héctor en pugi un a la bústia.
  - Estils: `src/theme-v878306.css`. Prova: `tecnictest.mjs` (23).
- **Menú del tècnic** (V87.307, proposta 10.9 acceptada per l’Héctor el 20/10/2026):
  - **Hores reals:** fora les fraccions de 15’ i el mínim de 30’ de la V87.291 («si he fet 10’ no em posis 30’, no queda bé de
    cares al client»). `billHours878291` torna el temps real (la funció es queda perquè la fan servir molts llocs); fora el text
    de la regla. La quota fixa del client es queda.
  - **Facturació › Pendent de facturar:** a dalt, els **honoraris acceptats** que falten per facturar (`honorarisPendents878307`:
    pressupostos d’honoraris «Acceptat»/«Facturat» menys les factures amb `pressupostId`), amb «Fer factura» que obre l’obra a
    Honoraris; a sota, les hores com abans. Fora l’explicació de la capçalera.
  - **Despeses (menú principal) del tècnic** (`PERFIL878304!=="constructor"`): només les seves (`meva:true`, «Les meves
    despeses»); l’expedient és opcional («Sense expedient»). Les d’una obra (costos del client) només surten dins de l’obra
    («Despeses d’aquesta obra», `!a.meva`). El constructor ho veu tot com abans.
  - **Bloc Econòmic de l’obra (tècnic):** primer el de l’obra (Pressupost, Certificacions, Facturació, Despeses, Rendiment…) i
    després, amb el títol «El meu encàrrec», Honoraris, Hores i els pressupostos i factures d’honoraris
    (`ENCARREC_TABS878307`, `esEncarrec878307`). Estils: `src/theme-v878307.css`.
  - Proves: `menutecnictest.mjs` (13) i `tempstest.mjs` (14, adaptada al temps real).
- **Apartats de l’obra ajuntats** (V87.308, decisions de l’Héctor del 18/10/2026 i 10.9): en lloc de canviar claus, **àlies**
  (`ALIAS878308` a `Obra`): la clau vella porta a la nova (Inici, el ＋, Facturació… continuen funcionant). No al portal de client.
  - **Dades i agents:** «Agents» → «Dades» (sota la fitxa, la llista d’agents de l’obra, sense el quadre d’agents principals).
  - **Agenda:** «Tasques» → «Agenda / Avisos» (les tasques sota les cites).
  - **Tècnic:** «Gestió temps» i «Rendiment» → «Honoraris» (honoraris, les seves hores i el rendiment de l’encàrrec); el
    seguiment econòmic de l’obra es diu «Rendiment» (a la part de l’obra).
  - **Constructor:** «Rendiment» → «Seguiment econòmic» (que es diu «Rendiment»); les hores, a part.
  - Noms a `tabLabel878269` («Dades i agents»; «Seguiment econòmic» → «Rendiment» quan no hi ha «Rendiment»). El ＋ rep les
    claus d’abans (`tabsAmbAlies878308`).
  - **Agents principals:** «Direcció d’obra» i «Direcció d’execució» (els rols que posa Dades) ja hi surten
    (`agentRoleOrder878134`).
  - Proves: les ajudes `tab()` de 27 proves accepten «Dades i agents» quan demanen «Dades» o «Agents»; `obratest`, `plustest`,
    `tempstest`, `graficatest` i `menutecnictest` adaptades.
- **Visites** (V87.309, decisió de l’Héctor del 18/10/2026: «Actes + Notes → Visites»): àlies «Notes» → «Actes» (la clau es
  queda; el nom és «Visites»). `Visites878309`: una sola llista per data (la més nova a dalt) amb les actes («Acta N», títol,
  assistents, fotos, documents) i les notes («Nota N», primera línia), i «+ Nota» / «+ Acta»; cada una manté la seva numeració.
  En tocar-ne una s’obre la seva fitxa de sempre (`Actes8761` / `Notes878278` amb `nomesFitxa` i `start.obrir`) i, en
  desar-la, cancel·lar-la, tancar-la o eliminar-la, es torna a la llista (`onTancar`). L’acta oberta ocupa tota l’amplada (sense
  la llista d’actes al costat). El ＋ de l’obra (Foto, Nota, Acta) hi arriba amb `start`. Portal de client: com abans (només
  Actes). Estils: `src/theme-v878309.css`. Prova: `visitestest.mjs`; adaptades `notestest`, `plustest`, `obratest`,
  `agents303test`, les de fotos i documents (busquen «Visites» i fan servir «+ Acta»), i `nuvoltest` (l’Oriol és constructor:
  el seu menú diu «Obres»).
- **V87.310 · «Fer factura» d’honoraris es queda a Honoraris** (trobat per `clientsvirtuals.mjs`): `facturarPressupostTecnic8742`
  fa `setTab("Factures")`, i molts expedients no tenen aquest apartat: s’acabava al Resum. Ara, si l’expedient no té «Factures»
  o «Pressupostos», porten a «Honoraris» (`ALIAS878308`). `clientsvirtuals.mjs` també apunta hores a mà i factura els honoraris
  (25 proves).
- **Despeses** (V87.311, proposta 10.1 del `docs/proposta-global.md`, decisions de l’Héctor del 18/10/2026; `src/theme-v878311.css`):
  - **Tipus** (`tipus`): Albarà · Material («Factura de material») · Subcontracta. Les d’abans sense tipus són «Albarà»
    (`tipusDespesa878311`); les despeses pròpies del tècnic (`meva`) no en tenen. Les dades són a la mateixa clau de sempre
    (`aco_albarans_v878259`).
  - **Capítol o partida** (opcional) del pressupost actiu de l’obra (`partidesObra878311`): `capitol`, `partidaId`,
    `partidaCodi`, `partidaNom`. Les partides d’abans no tenen `id`: l’identificador és `codi:<codi>` (o `pos:<n>:<codi>`
    si el codi es repeteix).
  - **Base / IVA / Total**: si no s’escriu el total, es calcula en desar. Subcontracta amb **ISP** (`isp`): IVA 0 i total = base;
    a la llista l’IVA diu «ISP». A l’ordinador, columnes Base · IVA · Total; a sota, «Total base» i «Total amb IVA».
  - **Albarà ↔ factura**: una factura (Material o Subcontracta) marca els albarans de la mateixa obra que inclou (`cobreix`);
    aquests surten ratllats amb «Inclòs a la factura…» i **no compten** (`cobertsPer878311`); si es treuen de la factura,
    tornen a comptar.
  - «Ja facturat o repercutit al client» → **«Repercutida al client»** / «Per repercutir». Filtres per tipus i proveïdor. Fora
    els textos que explicaven la pantalla. Botons: «Fer foto», «Adjuntar PDF o imatge», «Entrar a mà»; l’editor: «Nova despesa»,
    «Desar». Un PDF que diu «factura» (i no «albarà») es marca sol com a «Factura de material».
  - Prova: `despesestest.mjs`. Adaptades: `albaranstest`, `emptest`, `pdftest`, `menutecnictest`, `clientsvirtuals`.
- **Rendiment de l’obra amb el cost real** (V87.312, proposta 10.1.5; `CostRealObra878312`, `src/theme-v878312.css`): a dalt de
  «Rendiment» (el Seguiment econòmic, `GlobalRendibilitat8789`), quan l’obra té despeses: pressupost vigent, certificat a
  origen, cost real sense IVA (els albarans inclosos en una factura no compten) i «Certificat − cost» / «Pressupost − cost».
  Taula per capítol (Pressupost · Cost real · Diferència · %) amb les partides que tenen cost a sota i «Sense capítol» per a
  les despeses només de l’obra. Fora el text «Aquesta pantalla no calcula rendibilitat empresarial». Falta: les hores × cost
  per hora (mòdul 3). Prova: a `despesestest.mjs`.
- **V87.313 · VeriFactu i «Fer factura» reforçats** (20/10/2026, encàrrec de l’Héctor «reforçar verifactu, albarans i factures»;
  **res instal·lat al servidor**, VeriFactu continua aturat):
  - **Funció `verifactu` i SQL**: el número i la factura es fan en un sol pas (`aco_reservar_factura`, amb bloqueig per
    certificació i una regla d’una sola F1 vigent per certificació): dues peticions alhora ja no poden fer dues factures. Les
    línies es desen amb la factura (`entrada`) i «Tornar a enviar» refà la petició (abans, si s’aturava entre reservar i desar,
    quedava sense poder-se enviar). El servidor no deixa anul·lar una factura «No enviada». Detall a `docs/verifactu-pla.md`.
  - **Prova de la funció de debò**: `tools/proves/verifactufunciotest.mjs` (17) executa `supabase/functions/verifactu/index.ts`
    amb Node (`--experimental-transform-types`, la prova s’hi torna a llançar sola) i un Supabase i un Verifacti simulats.
  - **«Fer factura» amb la sèrie del client** (`facturesSerieClient878313`): el número proposat i la comprovació de repetits
    miren totes les obres del client, no només la d’ara (si la fitxa s’havia quedat enrere, es repetia). Prova: `factclienttest`.
  - Proves: l’ajuda per anar al menú espera fins a 12 s (després de recarregar, l’app pot trigar més de 4 s a ensenyar-lo i
    `menutecnictest` fallava).
- **Revisió del mòdul tècnic pestanya per pestanya** (l’Héctor, 20/10/2026: «anem per pams… pestanya per pestanya en el mòdul tècnic,
  després la resta de mòduls»). Ell diu què canviar amb l’app oberta; s’apunta a `docs/revisio-modul-tecnic.md` i es fa per
  tandes. **Tanda 1 (V87.314–316):**
  - **Inici** (V87.314): quatre requadres que porten a la llista d’Expedients filtrada (`obrirPaquet` de l’App: Total · Oberts ·
    En execució · Esperant resposta; el gràfic, per estat). A l’esquerra «Pròximes cites» i a sota «Feines pendents» amb quant
    falta i color (`diesTasca878314`, `diesFins878314`: vermell si ha passat, taronja si en falten 3 o menys, verd la resta;
    els dies es compten per dia de calendari: abans en sortia un de més). Fora «Treballs oberts del mes» i els textos d’explicació.
  - **Expedients** (V87.314): paquets a dalt (`PAQUETS878314`, `paquetOk878314`, estat `opk` de l’App; per defecte «Oberts»;
    en buscar o triar un estat als filtres es mira a tots). Fora «Filtres avançats i resum» (repetia). **Núm. del client**
    (`obra.refClient`, Dades › Obra): a la barra de l’obra i a la columna «Núm. client» (si no n’hi ha, el P-xxx d’abans).
  - **Contactes** (V87.315, `Contactes878315`, decisió de l’Héctor: un sol directori): menú «Contactes» en lloc de Clients i
    Agents (la pantalla Agents ja no surt; les claus de pantalla `Clients`/`Agents` porten aquí). Llista = `agentsLibrary878301`
    + clients; grups plegats (Promotors · Constructores / contractistes · Tècnics · Industrials · Immobiliàries / agències ·
    Altres; `grupContacte878315`), un d’obert alhora. Cercador pel nom (paraules que comencen així), persones de contacte, NIF i
    telèfons (`coincideix878315`; abans «br» trobava «obra» a les observacions). Fora els noms de farciment («Pendent»,
    «Particular»). Un client s’obre a la seva fitxa (`FitxaClient`, ara amb «Eliminar», persones de contacte i telèfons per
    tocar); un agent, a `EditorContacte878315` (es desa a totes les seves còpies, `updateAgentLibrary878191`). «Nou contacte»
    es desa com a client (tipologia nova «Immobiliària / agència»). **Persones de contacte** (`contactes:[{nom,mobil,email}]`, la
    primera també a `contacte`/`contacteMobil`). **Telèfons** amb `tel:`. **Logos a part** (`aco_logos_contactes_v878315`:
    `client:<id>` o la persona): dins de la llista de clients **no es desaven mai** (`stripHeavy878185` els treia); els documents
    els agafen d’aquí (`logoClient878315`, `issuerLogoHtml87100`). L’eina «Treure els agents de totes les obres» és a Contactes.
  - **Pressupostos** (V87.316, `HonorarisGeneral`): primer la llista (per any i número; a l’ordinador una taula amb el número
    curt, que en tocar-la obre «Gestionar»; al mòbil targetes), filtres plegats, i a sota «Resum» en pestanyes (Totals ·
    Estats · Comparativa; nous: facturat i acceptat sense facturar). El client és el de l’expedient (abans, el promotor). Fora el
    quadre d’explicació de la calculadora.
  **Tanda 2 (V87.317)**, després de veure la 316 publicada:
  - **Menú del tècnic:** sense «Preus» (només dins d’un pressupost d’obra; el constructor el manté) i «Hores» abans de «Facturació».
  - **Pressupostos (segona volta):** requadres de colors que filtren (Tots · Pendents · Acceptats · No acceptats · Facturats,
    `estatPres878317`), l’any en curs per defecte amb «Altres anys» i «Tots els anys», la llista com a principal (taula
    només a partir de 1180 px; a l’iPad i al mòbil, targetes amb «PDF» i «Obrir l’expedient»; a la taula, «PDF» i «⋯»), «Més
    filtres» plegat a sota i **«Informes i gràfics» plegat** (Totals · Estats · Per anys i mesos · Gràfica lineal
    `IngressosChart878292`), que no es dibuixa fins que s’obre. Fora «Lectura ràpida» (de `FinanceReports87110`).
  - **Hores** (`GestioTemps878255`): per defecte **expedients oberts i tot el temps**; cada apunt té estat **Pendent ·
    Facturat · No es factura** (`EstatFact878317`, camp `noFactura`; no compta com a pendent enlloc, també a Facturació ›
    Pendent i a la pestanya d’hores de l’expedient); a cada expedient «Facturat en part» o «Tot resolt» i, si tot és resolt,
    **«Tancar l’expedient»** (`updateStatus`). Les **despeses pròpies** (`meva`) de l’expedient hi surten com un apunt més
    (`despesesComApunts878317`). La gràfica i l’anàlisi d’honoraris, plegades a sota.
  - **Despeses pròpies amb tipus** (`tipusMeva`, `TIPUS_MEVA878317`): desplaçament (km × 0,26 €/km per defecte, sense IVA),
    dietes, aparcament, peatges, material, taxes de visat, taxes i llicències, fotocòpies, missatgeria, altres.
  - `Kpi` tradueix el títol (abans sortia sempre en català).
  - Prova: `revisio2test.mjs` (26). Adaptades `revisio1test`, `tempstest` i `pantallestest`.
  **Tanda 3 (V87.318) · Despeses del tècnic en una sola pantalla** (l’Héctor: «on les entro? … no podria entrar-les aquí i
  assignar-li una obra o expedient?»):
  - Al menú, **totes** les seves despeses: les meves (`meva`) i les de les obres (albarans, material, subcontractes); la V87.307
    només hi posava les meves i el seu albarà de KMAG només es veia dins de l’obra. Dins de l’obra, com abans (només les de l’obra).
  - «+ Nova despesa» (principal), «Fer foto», «Adjuntar PDF o imatge» (fora «Entrar a mà» per al tècnic; el constructor el manté).
  - Editor (`AlbaraEditor878259`, `triaQui`): a dalt **«Meva / De l’obra»** i just a sota **l’expedient** (`label.exp-v878318`; abans
    era dins de la graella, després de la foto). Per a les meves: primer les dades i després el tiquet, sense «ChatGPT» ni línies si
    no hi ha foto. «De l’obra» demana l’expedient («Tria l’expedient on s’imputa la despesa.»). Es pot passar d’un a l’altre.
  - «Totes · Les meves · De les obres» (només si n’hi ha de tots dos) i **«Per data / Per expedient»** (al constructor «Per obra»):
    un grup per expedient amb el total, «Per repercutir» i «Obrir l’expedient». Fora els 3 requadres per obra; sense despeses,
    sense requadres a 0 ni filtres.
  - Desar i eliminar en funcions comunes (`desaDespesa878318`, `eliminaDespesa878318`, `novaDespesa878318`): **Hores i despeses**
    té «+ Despesa» a dalt i a cada expedient (amb l’expedient ja triat).
  - Estils: `src/theme-v878318.css`. Prova: `despeses318test.mjs` (29). Adaptades `menutecnictest`, `albaranstest`,
    `clientsvirtuals`, `revisio2test`, `emptest` i `pdftest` (el selector de l’obra ja no és dins de `.grid`).
  **Tanda 4 (V87.319–322) · dins de l’expedient, començant per la gestió integral** (l’Héctor, 20/10/2026 a la tarda):
  - **Fitxa (V87.319):** «Entrega» ja no surt (àlies `ALIAS878308["Tancament / Entrega"]="Documents"`, llevat que hi hagi notes o
    arxius a `sectionDocs.tancament`): és el paquet **«08 · Final d’obra»** de Documents (id `08_DOCUMENTACIO_FINAL`). Dades › Obra
    sense «Direcció / criteri de l’obra» (`direccioObraText`, text de plantilla) ni «Observacions internes» (només si n’hi ha),
    codificació plegada i fora els textos que expliquen. **Agents de l’obra plegats** (`AgentsObraCard plegat`,
    `details.agents-plegat-v878319`): títol, quants i els primers noms, «Afegir agent». Prova: `fitxa319test.mjs` (10).
  - **Pressupost (V87.320):** capítols **plegats** en obrir-lo; el «Capítol principal» només si agrupa més d’un capítol
    (`nCapsMain878320`; si n’amaga un amb un altre nom, surt petit sota el capítol) i com a títol de grup; **avisos a baix**
    (`avisosPressupost878320`, `AvisosPressupost878320`) amb el comptador «⚠ N» a dalt que hi porta: certificat a origen per
    sobre del pressupost, despeses de l’obra ≥90 % o per sobre (només amb un sol pressupost), certificades per sobre, sense preu,
    sense amidament, sense concepte, codis repetits, capítols a 0 €. **Capçalera** (`budget-eines-v878320`): «Editar» (o
    «Guardar canvis» / «Cancel·lar») i «PDF» a la vista; menús «Afegir» (a aquest pressupost / un pressupost nou al costat) i «⋯»
    (compartir, eines, aquest pressupost). **En editar:** cada partida només «Editar»; oberta, `partida-eines-v878320` (∑
    Amidaments, Cost / descompost, Desar a la llibreria, Moure a…, Eliminar); caselles només amb «Seleccionar diverses partides»
    (`seleccio878320`); el capítol, un «⋯» curt. «Pressupost per al client» → **«Ajustos del pressupost»**. Prova:
    `pressupost320test.mjs` (23, amb Verbania). Adaptades `pressuposttest`, `pdfpressuposttest`, `clientsvirtuals`,
    `habitualstest`, `menustest` (prova «Afegir» i «⋯» i obre els capítols abans de baixar), `documentstest` i `docmobiltest`
    (botó «PDF»).
  - **Seguiment (V87.321):** les tasques de l’expedient es diuen **«Feines pendents»** (són les de l’Inici) amb quant falta i el
    color (`taskDeadlineTone878140`, `diesTasca878314`), ordenades i les fetes al final. **Planning de l’obra**: columna dels
    capítols de 300 px a l’iPad i 150 px al mòbil, i **«Pantalla completa»** (mòbil i iPad; `requestFullscreen` i
    `screen.orientation.lock("landscape")` si l’aparell ho deixa; si no, una capa fixa). Prova: `seguiment321test.mjs` (15).
  - **V87.322:** al mòbil, la tira dels pressupostos en dues columnes (fora «Cada pressupost va a part…»), cada capítol en una línia
    (nom i total) i «Ajustos del pressupost» compacte.
  **Tanda 5 (V87.323–324)** (l’Héctor, 21/10/2026):
  - **Les meves despeses (V87.323)**: la V87.318 (despeses del tècnic «totes», amb «Meva / De l’obra») **es va desfer**: «em surt una
    que és d’un client meu i no és meva com a tècnic». Al menú, el tècnic només veu les seves (`meva`); les de l’obra, dins de
    l’obra. A dalt, **Quilometratge · Dietes · Taxes · Material · Altres** (`GRUPS_MEVA878323`, `grupMeva878323`): en tocar-ne un,
    una despesa nova d’aquell tipus (IVA de sèrie `ivaMeva878323`: 0 % quilometratge i taxes, 10 % dietes); cada requadre diu els
    km i l’import. Editor: tipus com a botons (`tipus-meva-v878323`); quilometratge amb «Trajecte (d’on a on)», km, €/km i
    «Import (€)», sense IVA, total ni número; dietes amb «Lloc». La clau desada continua sent «Desplaçament (km)» (es veu
    «Quilometratge», `etiquetaMeva878323`). Prova: `despeses323test.mjs` (22; substitueix `despeses318test`). `menutecnictest`
    espera el núvol abans d’obrir Despeses (després de recarregar, l’app pot tornar sola a l’Inici en posar-se al dia).
  - **Amiant (V87.324)**: tipus de feina «Amiant (localització i diagnosi)» (codi AMI) i encàrrec `amiant` a
    `src/encarrecsTecnics.js`: 8 documents per entregar, llista en 6 apartats (encàrrec, documentació, visita, oficina, retirada i
    ajuts, lliurament; UNE 171370-2:2021) i el botó dels ajuts de l’Agència de Residus. Enllaços (comprovats el 21/10/2026):
    `residus.gencat.cat/…/subvencions/amiant/`, preguntes freqüents de l’ARC i el tràmit del RERA. **amiant.cat ja no és de la
    Generalitat** (redirigeix a una empresa): no posar-lo. Prova: `amiant324test.mjs` (10).
  - **MagicPlan**: la bústia era buida el 21/10/2026 i a l’ordinador només hi ha la factura de la subscripció; per llegir-ne els
    plànols cal un plànol exportat (PDF i, si en surt, l’Excel o CSV de les estances).
  - **V87.325:** a les cèdules, enllaç al **cercador de cèdules de l’Agència de l’Habitatge** amb la referència cadastral (en obrir-lo
    queda copiada per enganxar-la; la pàgina no es pot omplir des de fora). El 21/10/2026 el servei de la Generalitat responia
    amb error (400) i la pàgina deia «0 resultats»: no vol dir que no hi hagi cèdula.
- **Perfils, treballador i comptes de prova (V87.326, l’Héctor 21/10/2026: «una versió amb un usuari i contrasenya inventat per
  cadascun dels perfils segons els mòduls: tècnic normal, constructor, gestió total i treballador d’empresa»):**
  - **Perfils** (`PERFILS878326`, `moduls878326`, `teModul878326`, `esTreballador878326`, `diuObra878326`), al camp `perfil` de
    `aco_empresa_v878259`: `tecnic` (mòdul Tècnic) · `constructor` (Obra + Empresa) · `complet` («Gestió total», els tres) ·
    `treballador` (operari). **El compte de l’Héctor (sense perfil d’empresa) ho té tot, com fins ara.** `hasModule2Access8747`: als
    comptes d’empresa, el mòdul Obra el dona el perfil (abans, els comptes nous el tenien bloquejat sense poder-lo activar).
  - **Menú** (taula 10.4): tècnic sense Preus; constructora i gestió total amb Preus; Despeses de totes les obres per a constructora
    i gestió total, «Les meves despeses» per al tècnic; **treballador: Inici · Obres · Hores · Agenda · Ajustos**. Barra de baix:
    constructora Inici · Obres · Despeses · Agenda; treballador Inici · Obres · Hores · Agenda; la resta Inici · Obres · Agenda · Hores.
  - **Pestanyes de l’obra** (`tabsPerfil878326`, aplicat després de `tabsForWork8737`): sense mòdul Obra, fora Pressupost,
    Certificacions, Facturació, Seguiment econòmic i Planning; Despeses amb Obra o Empresa; Honoraris/Factures/Pressupostos/Rendiment
    (encàrrec) només amb Tècnic. Treballador: Resum, Documents (consulta), Notes, Agenda (tasques), Planning (consulta, sense imports:
    `gantt-treb-v878328`), Despeses (foto) i Hores.
  - **Treballador** (decisions del 18/10/2026, 10.8): `IniciTreballador878327` («La feina d’avui»: hores d’avui i de la setmana, cites
    d’avui, feines pendents amb color, les seves obres); `HoresTreballador878327` (per obra i dia, sense imports; files amb
    `treballador:true`, les pot treure); `DespesaTreballador878327` (foto o PDF + nota; `deTreballador`, `perRevisar` fins que
    l’oficina la desa); notes sense esborrar; tasques: només l’estat; no crea obres ni en canvia l’estat ni les elimina; Ajustos sense
    mòduls, enllaços ni configuració general; sense comptador automàtic.
  - **Ajustos › «Perfil i mòduls»** (`PerfilModuls878326`, substitueix el «Pla i mòduls» de mostra): perfil, mòduls inclosos i
    «Canviar el perfil» (comptes d’empresa; recarrega l’app; les dades no canvien).
  - **Comptes de prova** `demo-tecnic`, `demo-constructor`, `demo-gestio`, `demo-treballador` (`<usuari>@usuaris.controlobres.app`;
    contrasenyes a `GUIES_USUARIS\COMPTES_DE_PROVA.txt`, fora del repositori; **els ha de crear l’Héctor al panell de Supabase**).
    La benvinguda ve amb el perfil triat (`perfilDemo878326`) i «Omplir-lo amb dades d’exemple»: la marca `exemplePendent` fa que
    `omplenaDemoSiCal878328` (primera línia de l’App, abans de llegir res) ompli el compte amb `src/dadesDemo.js` (tot inventat; si
    s’omplia abans de recarregar, l’app ho podia trepitjar). Al Supabase de proves hi ha els quatre (contrasenya `prova2026`).
  - **V87.327:** per als perfils que diuen «obra» (`diuObra878326`), `etPaquet878327` i `etNExp878327` canvien «Expedients oberts»,
    «Total expedients», «Tots els expedients» i «N expedients» per «Obres obertes», «Total d’obres», «Totes les obres» i «N obres»
    (llista d’obres, Inici, Hores i filtres). «Pressupostos» (d’honoraris) només amb el mòdul Tècnic: la constructora no el té.
  - Prova: `perfils326test.mjs` (36).
- **Amidaments abans del pressupost** (V87.328, encàrrec de l’Héctor del 21/10/2026: «una pestanya prèvia dins el paquet que digui
  amidaments, que l’app pugui llegir en tots els formats (PDF, Excel i BC3), amb una opció que digui passar-ho a pressupost»):
  - **Pestanya «Amidaments»** (clau `Amidaments obra`, per no topar amb la secció vella `Amidaments` d’`ExpedientSection8769`): al
    bloc Econòmic, just abans de «Pressupost», a totes les obres que tenen Pressupost (`tabsForWork8737`); amb el mòdul Obra
    (`tabsPerfil878326`). `Amidaments878328`; es desa a l’obra: `data.amidaments878328 = {font, linies, passat, avisos}`.
  - **Lectors** (funcions pures): `src/amidaments.js` — **BC3** (`textBc3`: ~V diu el joc de caràcters, ANSI = Windows-1252, 850 i
    437 de l’MS-DOS amb taules pròpies; `llegirBc3`: ~C, ~D, ~T, ~M; capítols amb «#», l’arrel «##», subcapítols amb
    `capPrincipal`; la quantitat és el total del ~M o el rendiment del ~D; els descompostos no són partides) i **Excel/CSV**
    (`llegirExcelAmidaments`: capçalera amb descripció i quantitat; capítols per la columna «Nat», un codi curt en majúscules o
    «CAPÍTOL…»; línies de mides a sota o una fila per línia amb el mateix codi, com l’Excel que fa l’app). **PDF**:
    `llegirAmidamentsPdf` a `src/pressupostPdf.js` (Presto: mides «Cocina 1 4,50 3,20 14,40» i la quantitat sola a sota; TCQ: «1
    Fonaments 4,000 … C#*D#*E#*F#» i «TOTAL AMIDAMENT»; deixa de llegir al PRESSUPOST / RESUM de després; si no hi troba res, prova
    `llegirPressupostPdf`). Mides: `{concepte, unitats, llargada, amplada, alcada, parcial}`.
  - **Pantalla:** «Llegir PDF, Excel o BC3» (l’original va a Documents); si ja n’hi ha, «Substituir les d’ara» o «Afegir-les a les
    d’ara». Per capítols (plegables), quantitat editable, ∑ amb les línies de mides i la suma, avís si la quantitat no és la suma
    («Posar-hi la suma»), treure una partida, «Buidar els amidaments».
  - **«Passar-ho a pressupost»** (`PassarPressupost878328`): si el pressupost actiu ja té partides, «Un pressupost nou: «Amidaments ·
    arxiu»» o «Afegir-les a «…»»; si és buit, s’hi posen. Preus: els de l’arxiu; si no, els de Preus pel codi o per la mateixa
    partida (es pot desmarcar); la resta a 0 (surten als avisos del pressupost). Fa servir `importPdfBudget878305` (ara amb
    `meta.prefix`, `afegir`, `tipusPartida`, `estat`; passa `capPrincipal` i `pressupostMesures` si les mides sumen la quantitat).
    Després obre el Pressupost; als Amidaments queda «Passat al pressupost «…» el …».
  - Tocar el bloc «Econòmic» obre el Pressupost si l’obra encara no té amidaments (`teAmid` d’`ObraBar878269`); si en té, els Amidaments.
- **Les meves despeses, segona volta** (V87.329, l’Héctor 21/10/2026: «vull que pugui posar nova despesa; quan entro selecciono l’obra
  o l’expedient i a partir d’aquí entro segons la tipologia; a fora, els apartats, que es poden llistar per obra i en grup per any»):
  - **«+ Nova despesa»** (l’únic botó de dalt per al tècnic; la foto del tiquet és a dins): l’editor (`AlbaraEditor878259`, estat `pas`)
    demana **1 · Expedient** (cercador, els oberts primer, «Sense expedient (despesa general)»), **2 · Tipus** (Quilometratge · Dietes ·
    Taxes · Material · Altres, `GRUPS_MEVA878323` amb `desc`) i llavors **els camps d’aquell tipus** (quilometratge: trajecte, km, €/km i
    import; taxes: visat o llicències, organisme, número i import, sense IVA, `SENSE_IVA878329`; dietes: lloc; material i altres: el
    subtipus, proveïdor, base, IVA i total, i el tiquet). A dalt, l’expedient i el tipus triats amb «Canviar». Una despesa desada s’obre
    directament als camps. Marca temporal `__exp` (no es desa). «Hores i despeses › + Despesa» fa el mateix.
  - **A fora:** els cinc apartats ja no creen res: **filtren la llista** (tornar-hi a tocar, totes) i diuen quantes n’hi ha, els km i
    l’import; amb un apartat triat, la nova despesa ja ve d’aquell tipus. Vista nova **«Per any»** (de sèrie): cada any amb el total i,
    a dins, per expedient. També «Per data» i «Per expedient».
  - Estils: `src/theme-v878329.css`. Prova: `despeses329test.mjs` (30; substitueix `despeses323test`). Adaptades `menutecnictest`,
    `revisio2test`, `clientsvirtuals` i `albaranstest`.
- **Nota de veu a l’agenda** (V87.330, l’Héctor 21/10/2026: «una nota de veu que el dia, l’hora i el motiu de la nota o la visita es
  posi directament a l’agenda sincronitzada… i un accés ràpid a l’Inici»):
  - `VeuCita878294` es diu «Nota de veu a l’agenda», ensenya també el **motiu** (`titol` de `parseCita`) i té **«Posar-ho a
    l’agenda»** (`onDirecte`): l’Agenda la desa sense passar per la fitxa (`saveFromVoice` → `save`), s’hi posa el dia i surt l’avís
    `veu-fet-v878330` («A l’agenda: … · Obrir»). «Revisar i desar» continua obrint la fitxa. El botó de l’Agenda es diu «Nota de veu».
  - **Inici** (i Inici del treballador): botó «Nota de veu a l’agenda» a la capçalera; posa `window.__acoVeuAgenda878330` i obre
    l’Agenda, que obre sola la finestra.
  - **Google Calendar al moment:** `gcSoon` cridava el `gcSync` d’abans de desar (amb l’`odata` vell): una cita nova d’una obra no
    arribava al Google fins a la sincronització següent. Ara el temporitzador crida el `gcSync` de l’últim dibuix (`gcSyncRef`).
  - Estils: `src/theme-v878330.css`. Prova: `veuagenda330test.mjs` (17, amb el Google simulat). `veutest` adaptada al nom nou.
- **V87.331 · Google Calendar es torna a connectar sol i menús que es pleguen sols** (l’Héctor, 21/10/2026):
  - **Google** (`src/googleCal.js`): el permís (1 h) es desa per usuari de l’app a l’aparell (`google-cal-token__<usuari>`, localStorage;
    abans sessionStorage: en tancar l’app s’havia de tornar a connectar) i es recorda que ja s’ha connectat (`google-cal-connectat__<usuari>`;
    també si el compte té `aco_google_cal_v878295.calendarId`). Aquestes claus no comencen per `aco_`: no van al núvol ni al DADES.
    Quan el permís caduca, el **primer toc a l’Agenda** (o «Nota de veu a l’agenda» de l’Inici) el torna a demanar (`potReconnectar`,
    `prepara` carrega Google abans perquè la finestra no quedi bloquejada); en arribar (`aco-google-connectat`) se sincronitza.
    `connect()` no en fa dues alhora; `gcSync` tampoc (si se’n demana una mentre corre, es fa just després amb les dades noves:
    `gcSync0Ref`; abans, dues alhora feien dos calendaris «Control d’Obres»). Si el navegador bloqueja la finestra, surt el botó.
  - **Menús** (`details` amb panell absolut: Accions, ⋯, Afegir, Imprimir…; un `useEffect` de l’App): es tanquen en tocar fora o amb
    Esc (Esc ja no porta també al Resum de l’obra si hi ha un menú obert); amb ratolí (`(hover:hover) and (pointer:fine)`), s’obren en
    passar-hi per sobre (220 ms) i es pleguen en marxar-ne (380 ms); el clic just després no el torna a tancar (`__hover878331`).
  - Prova: `v331test.mjs` (14). `gcaltest` i `veuagenda330test` adaptades.
- **V87.332 · Encàrrecs tècnics: honoraris i despeses a l’Econòmic; calculadora amb el CEE i les despeses de l’encàrrec** (l’Héctor,
  21/10/2026, fent un CEE: «és un treball eminentment meu: a l’econòmic, el meu pressupost d’honoraris i el control de les despeses»):
  - `TECNIC_PUR878332` (cèdula, CEE, ITE, amiant, informes, plànols, render, tràmits, postobra; `esTecnicPur878332`): sense «Gestió obra»
    (Pressupost, Amidaments…) llevat que ja tinguin pressupost; sempre «Despeses» (`Albarans`). Bloc Econòmic: **Honoraris · Despeses**,
    sense el títol «El meu encàrrec» (`obraBlocs878299(all,pur)`, `esEncarrec878307(x,pur)`, `ObraBar878269 pur`). Les despeses
    d’aquests expedients són **les meves** (`Albarans878259 meves`, «Despeses de l’expedient»; «+ Nova despesa» comença pel tipus).
  - **Honoraris de l’expedient** (`HonorarisExpedient8778`): «Pressupostos d’honoraris · Calcular honoraris · Factures honoraris»; sense
    cap pressupost, s’obre la calculadora; en crear-lo, torna a la llista. `PressupostTecnic8738` té «Calcular honoraris». Fora les notes
    que expliquen.
  - **Calculadora** (`HonorarisCalculator8790`): a Pressupostos, l’expedient comença buit («Tria l’expedient…», obligatori; abans quedava
    el primer de la llista i el pressupost anava a un altre expedient) i triar-lo posa el tipus de feina (`treballDe878332`). Treball nou
    **CEE** (`cee`: tipus d’immoble i **preu propi** + €/m² per sobre de 100 m²; es recorden a `aco_preus_cee_v878332`; de sèrie 150/200/450 €,
    per posar els seus). Només els camps que fa servir cada feina (sense PEM ni Ca al CEE). **Despeses de l’encàrrec**: km per viatge ×
    viatges × €/km (`aco_preu_km_v878332`), taxes (incloses o a part → `taxesIncloses`) i altres; total sense IVA i amb IVA. El pressupost
    es crea amb la base total i un text per al client (abans hi anava la fórmula).
  - Estils: `src/theme-v878332.css`. Prova: `honoraris332test.mjs` (18). `clientsvirtuals` adaptada (Honoraris s’obre a la calculadora).
- **V87.333 · Encàrrec tècnic més ordenat, enllaços de cada tràmit i ajuda amb IA** (l’Héctor, 21/10/2026: «millor estructurat, amb
  títols en negreta i que en apretar surti la resta»; «pujar o no cal no em serveix: un checklist i enllaços»; «el CE3X i l’ICAEN»;
  «MagicPlan, CATGI i gencat per entrar-ho a Habitatge»; «fer algun tràmit amb ajuda de la IA, com un CEE»):
  - `EncarrecTecnic878306` reescrit (classe `encarrec-v878333`): xip «N de M fets» / «A punt per presentar» / «Presentat el…», barra de
    progrés i **els 6 passos plegables** (número o ✓, títol en negreta, «fet/total»; obert, el primer que falta). **Els documents per
    presentar van dins del pas «Tràmit»**: es marquen (`passos878305.docsFets`) i, si es vol, s’hi adjunta l’arxiu (va a Documents, com
    abans); fora «Pujar» i «No cal» (els «No cal» d’abans compten com a fets: `estatDocs`). El botó del tràmit i «Marcar com a presentat»
    són al mateix pas.
  - **Enllaços del tràmit** (`ENLLACOS_TRAMIT878333`, comprovats el 21/10/2026): cèdula → tràmit de segona ocupació, **oficina virtual
    del CATGI** (`catgi.cat/index.php/oficina-virtual`), MagicPlan i el cercador de cèdules (copia la RC); CEE → **CE3X** (pàgina del
    Ministeri, `miteco.gob.es/…/procedimientos-certificacion-proyecto-terminados.html`; és per a Windows), registre de l’ICAEN i el cercador
    de certificats; amiant → ajuts, preguntes freqüents i RERA. Al Resum (a dalt) ja només hi ha el Cadastre i els enllaços propis; a
    Ajustos ja no hi ha el botó «Oficina virtual del CATGI». La frase «encara no té pressupost d’obra» no surt als encàrrecs tècnics.
  - **«Preparar-lo amb IA»** (CEE): copia unes instruccions amb les dades de l’immoble (adreça, població, RC) i obre ChatGPT o Claude
    (`iaCeePrompt878333`; gratuït, com els albarans). La IA directa dins de l’app necessitaria la clau d’Anthropic (de pagament).
  - **No fet:** avisar si un plànol compleix els mínims de la cèdula (cal que l’Héctor confirmi els mínims del Decret 141/2012 que vol
    fer servir i passi un plànol exportat de MagicPlan).
  - Estils: `src/theme-v878333.css`. Prova: `encarrec333test.mjs` (19; substitueix `tecnictest.mjs`). Adaptades `amiant324test` i
    `clientsvirtuals`.
- **V87.334 · L’hora de la nota de veu i l’Econòmic dels encàrrecs** (l’Héctor, 21/10/2026: «li dic les 8'30 del matí i em posa les
  00'30»; «al CEE surt pressupost, certificacions i rendiment, i amidaments: aquí no cal»):
  - `normHores` (`src/citaVeu.js`, abans de llegir la frase): «8'30», «8’30», «8.30», «8,30», «8:30h», «8 h 30», «8 i 30», «les 8 30»,
    «les 830» → «8:30», i «2/4 de 9» → «2 quarts de 9»; només després de «les», «a», «de», «sobre», «cap a» (no toca «el 22.10»). I una
    hora amb dos punts sense «a les» («dimarts 8:30») també compta. Abans, aquests formats perdien els minuts (o l’hora). No s’ha pogut
    reproduir exactament el «00:30»: amb el que escriu el dictat del mòbil, ara surt bé. `citaveutest` (32).
  - Els encàrrecs tècnics (`TECNIC_PUR878332`) **ja no tenen mai** el pressupost d’obra (Pressupost, Amidaments, Certificacions,
    Facturació d’obra, Rendiment d’obra, Planning), encara que tinguin partides (la V87.332 els el deixava si en tenien); les dades es
    queden. `honoraris332test` (20).
  - **Compte en editar proves amb `String.replace`:** si el text nou porta `$'` (p. ex. `'^Desar$'`), JavaScript hi copia la resta del
    fitxer (va passar el 21/10/2026 amb `clientsvirtuals.mjs`). Fer servir `split/join` o una funció com a substitució.
  - Estils: `src/theme-v878328.css`. Proves: `amidamentsunit.mjs` (26, sense navegador) i `amidaments328test.mjs` (27).
  - Proves: `revisio1test.mjs` (28). Adaptades a Contactes `agentstest` i `agents303test`. L’ajuda `__click` de les proves
    (15 fitxers) toca «Total expedients» si no troba una obra (per defecte només surten les obertes).
- **App sense cobertura** (V87.271): a la versió compilada (Render) l’app es guarda dins de l’aparell amb un
  «service worker» (`sw.js`, el genera `vite.config.js` en compilar a partir de `src/sw-template.js`, amb la llista
  d’arxius de la versió) i s’obre encara que no hi hagi cobertura ni servidor. Pàgina: primer la xarxa (3 s com a
  molt; també ajuda quan Render està adormit), si no, la guardada. Codi i estils: primer la còpia guardada. El núvol
  (Supabase) i `/__dades-locals` no hi passen. Es guarda també la versió anterior. **`caches.match(…, {ignoreVary:true})`**:
  sense això la còpia no es trobava (el servidor respon amb «Vary» i el navegador demana el codi amb «Origin») i l’app no
  arrencava. App instal·lable: `public/manifest.webmanifest` i icones. **No** a `OBRIR_APP.bat` (servidor de Vite).
- **Documents al mòbil i l’iPad** (V87.290, `FitFrame878290`, `FitBox878290`, `src/theme-v878290.css`; ≤1280 px o pantalla
  tàctil): la vista prèvia es dibuixa a mida A4 (794 px) i s’encongeix fins a l’amplada de la pantalla, sencera i sense
  desplaçament a dins (el marc fa l’alçada del document i té `pointer-events:none`): s’amplia amb dos dits, com
  qualsevol document. Val per als documents en marc (pressupost, certificacions, proformes, factures) i per a l’acta
  (amb la disposició d’A4, no la del mòbil). Només es mesura quan el document ja és carregat (si no, de vegades
  quedava a 100 px). A l’ordinador, com abans.
- **Temps a facturar** (V87.291, decisió de l’Héctor del 17/10/2026; **les fraccions es van treure a la V87.307**: ara es factura
  el temps real): **fraccions de 15’ amb un mínim de 30’ per registre**
  (10’→30’, 20’→30’, 40’→45’, 1 h 05’→1 h 15’; `billHours878291`, `timeBillImport878291`). Les hores reals es guarden igual
  (gràfiques, mitjanes, rendiment); l’import a facturar, el pendent, la factura de les hores i l’exportació fan servir les
  arrodonides. **Quota fixa mensual** a la fitxa del client (`client.quotaFixa`): les hores dels seus treballs compten però
  no surten com a pendents (Gestió del temps, Factures › Pendent de facturar, pestanya de temps de l’obra); amb el client
  filtrat i el mes, es diu si les hores valen més o menys que la quota. «Ja facturat» a Factures (sense fer factura) i
  casella «Facturat» + «Marcar tot com a facturat» a la pestanya de temps de l’obra.
- **Gràfica d’ingressos** (V87.292, `IngressosChart878292`, `src/theme-v878292.css`): base sense IVA de les factures per la
  data de la factura. «Per mesos» (gener–desembre, una línia per any, els 4 últims) i «Per anys» (total de cada any), amb
  «aquest any fins al mes d’ara» comparat amb el mateix període de l’any passat. A Factures (tot, amb els filtres de
  client/obra/tipologia però no el de període) i al Rendiment de cada obra (les seves factures d’honoraris). SVG propi,
  sense llibreries.
- **Cites per veu** (V87.294, `src/citaVeu.js`, `VeuCita878294`): a l’Agenda, «Per veu» al costat de «+ Nova cita». Es diu
  (dictat del navegador, `DictatActa878263`, que ara comença en l’idioma de l’usuari si l’aparell no en té cap de triat)
  o s’escriu la cita; «He entès» ensenya dia, hora, tipus i obra, i «Revisar i desar» obre la fitxa de la cita omplerta.
  Entén català i castellà: avui/demà/demà passat, dies de la setmana, «el 25 d’octubre», «d’aquí a 3 dies», «a les 10»,
  «i mitja», «dos quarts de deu», «de 10 a 12», «durant dues hores», «de la tarda»; sense dir-ho, d’1 a 7 és a la tarda.
  L’obra: la que té més paraules seves a la frase (també el client i els números); si dues empaten, cap. Sense IA.
- **Google Calendar** (V87.295, `src/googleCal.js`; decisió de l’Héctor del 17/10/2026: calendari propi «Control d’Obres» i
  en els dos sentits). Permís amb Google Identity Services des de l’Agenda (un toc; dura 1 h, `sessionStorage`), sense cap
  secret: només l’**ID de client OAuth** (públic) a `src/cloudConfig.js` (`GOOGLE_CLIENT_ID`; buit = no surt res). **Activat a la
  V87.298** (18/10/2026): projecte de Google Cloud «Control d'obres» de l’Héctor, sense prova gratuïta ni compte de pagament,
  pantalla de permís en mode **Prova** amb el seu Gmail d’usuari de prova; orígens autoritzats: Render i `localhost:5173`.
  Passos de l’Héctor: `docs/google-calendar.md`. Les cites pròpies (no tasques, ni automàtiques, ni d’obres compartides per
  altres) van a «Control d’Obres» amb id fix `aco`+hex(id) (dos aparells no dupliquen); el que es canvia o s’esborra a
  Google torna a l’app (guanya el canvi més nou: `editAt` de l’app vs `updated` de Google); les del calendari principal es
  veuen en gris, només consulta. Estat compartit `aco_google_cal_v878295` (calendari, `known` id app → id Google,
  `lastPull`); a cada cita `gId`, `gUpdated`, `gSynced` (empremta del que hi ha a Google). Es sincronitza en obrir
  l’Agenda (si hi ha permís), amb «Sincronitzar» i en desar, moure o esborrar una cita.
- **Codi d’expedient curt** (V87.270, `codiCurt878270`): a l’app es veu `2026-026` (any-número, `expedientBase`). El
  codi llarg (`codiExpedient`, p. ex. `2026-026-ALT-ALBA-PROJECTEPISC`, pensat per a les carpetes de l’ordinador) **no
  es toca**: surt a Dades com a «Codi de carpeta (arxiu)» amb «Copiar», i en passar per sobre del número a la taula.
- **Expedients** (V87.270, `src/theme-v878270.css`): al mòbil i l’iPad, targetes per any (codi curt · client, nom,
  tipus · població, estat) i un cercador sempre a la vista (fix en baixar); la resta de filtres a «Filtres». A
  l’ordinador, la taula sense la columna del codi llarg ni «Eliminar» a cada fila (és al menú ⋯ de l’obra).
- **VeriFactu ATURAT (17/10/2026, ordre de l'Héctor): no instal·lar res del servidor** (ni `aco_verifactu_v87285.sql` ni la
  funció `verifactu`, ni secrets, ni comptes de Verifacti) **fins que l'Héctor ho hagi parlat amb la gestoria**. L'app
  publicada (V87.287) no mostra «Emetre factura» mentre la funció no existeixi. Des de la V87.297, la nota de VeriFactu
  de Facturació obra només surt si el compte el té actiu.
- **Proforma i «Fer factura»** (V87.297, decisió de l’Héctor del 17/10/2026): **les proformes es diuen «Proforma»** (la
  V87.296 les canviava a «Factura»: desfeta amb `git revert`, no es va pujar mai). Al costat de cada proforma, **«Fer
  factura»** amb la numeració **del client** de l’obra, només si a la fitxa del client hi ha «Factures d’aquest client»
  activat (`client.facturacio878297` = `{actiu, prefix, proper, digits}`; l’Héctor ho posa als clients a qui fa les
  factures: de moment només Brava). Finestra `FerFactura878297`: número (prefix + número editable, per defecte `proper`),
  data (avui), destinatari (del promotor de l’obra, editable) i totals de la proforma. Es desa a l’obra a
  `data.facturesObra878297` (`certId`, `numero`, imports, `destinatari`…) i el client passa a `proper+1`. La proforma no
  canvia. Amb factura: «PDF factura» (el mateix document, títol «FACTURA {número}» i «Total factura»), IVA/retenció/
  deducció bloquejats i la certificació no es pot eliminar; «Eliminar factura» (pregunta; si era l’última de la sèrie,
  el número següent torna enrere). Sense VeriFactu: és una factura feta per l’app, no enviada a Hisenda.
- **VeriFactu** (decisions de l'Héctor, 16/10/2026): factura ell i també les constructores (S.L.: **obligatori des de
  l'1/1/2027**; autònoms 1/7/2027). Via **intermediari** (recomanat Verifacti, ~2,90 €/NIF/mes; alternativa fiskaly),
  **model A**: el compte és de l'Héctor i ho cobra dins la quota; interruptor per compte. Fabricant del programa:
  pendent (gestoria). **V87.276**: franja a Factures + `VerifactuDemo878276`, una **demostració** (dades inventades,
  empremta SHA-256 amb la fórmula de l'AEAT, enviament simulat, QR de l'entorn de proves amb la llibreria `qrcode`
  1.5.4); no envia ni desa res. La implementació de debò (emetre i bloquejar, numeració al servidor, Edge Function amb
  la clau de Verifacti en un secret, rectificatives) és la feina següent, a punt abans de desembre. Pla: `docs/verifactu-pla.md`.
  **V87.284**: l’IVA, la retenció i la deducció de cada proforma (Facturació obra, `Fact`) es desen **dins de l’obra**
  (`data.factParams`, per id de certificació). Abans anaven per número (`pf-1`…) a la clau del compte
  `aco_fact_params_v61`, i la PF-001 de totes les obres compartia l’IVA. Les proformes de certificacions d’abans del
  17/10/2026 sense valors propis continuen mostrant els de la clau vella (no canvia res en actualitzar); la clau vella
  ja no s’escriu. El portal de client no els pot canviar.
  **V87.285 · Emetre factures (encara sense instal·lar al servidor)**: a Facturació obra, «Emetre factura» per proforma
  si el compte és a `aco_verifactu_comptes` amb `actiu` (només ho activa l’Héctor, al panell). Funció del servidor
  `verifactu` (`supabase/functions/verifactu/index.ts`, accions compte/emetre/reenviar/estat/anular) i SQL
  `supabase/aco_verifactu_v87285.sql` (comptes, `aco_series` + `aco_seguent_numero`, registre
  `aco_verifactu_registres`). El número el dona el servidor; si l’intermediari falla, «Tornar a enviar» amb el mateix
  número; una factura per certificació. A l’obra: `data.facturesVF878285` (sense la imatge del QR: `stripHeavy878185`
  buida qualsevol `data:`; el QR es fa en obrir el PDF amb `urlQr`). Factura emesa → IVA bloquejat i certificació que
  no es pot eliminar (`vfTeFactura878285`). PDF: `facturaVFPrintHtml878285` (tipus de document `facturavf`).
  **V87.286**: «Anul·lar» (només per a factures fetes per error; després es pot tornar a emetre amb número nou) i
  Configuració → «Factures amb VERI*FACTU» (`VerifactuCompte878286`). Falta: comprovar l’API amb el compte de proves de
  Verifacti, rectificatives, honoraris.
  Detall i passos de l’Héctor a `docs/verifactu-pla.md`.
- **Filtres d'Expedients** (V87.275, `ExpFilters878275`, `src/theme-v878275.css`): un sol bloc «Filtres» igual a
  l'ordinador, l'iPad i el mòbil (abans: desplegables diferents a cada aparell; a l'ordinador l'any només tenia 2025/2026).
  Any, estat, tipus i client amb botons que s'encenen: **diversos valors per grup alhora**, desats com a `"a|b"` als
  mateixos estats de sempre (`oy`, `ost`, `ot`, `oc`; `sel878275` filtra). Només hi surten opcions amb expedients.
  **Foto petita de l'obra** a les targetes i a la taula (`ObraThumb878275`); sense foto, quadrat de color amb les
  inicials del client. Les targetes del mòbil també sortien a l'ordinador sota la taula (des de la V87.270): arreglat.
- **«Més» de l'obra** (V87.275): just després de l'última pestanya. Quedava tapat per la capçalera fixa del pressupost
  (una regla vella `.obra-page-overlay-open-v878244>.obra-edit-overlay-v878242{z-index:90}` encara donava capa pròpia
  a l'apartat).
- **Pestanyes de l'obra** (V87.277, `rapidMerged878277`): **una sola «Pressupost»**: si l'obra tenia també «Pressupost
  ràpid», aquest passa a l'apartat plegable «Pressupost per al client» (número, condicions, forma de pagament i el seu
  PDF; `PressupostRapid878150 headerOnly`). Només es carrega en obrir-lo (si no, posava sol un número de pressupost en
  obrir la pestanya). No s'aplica al portal de client (`readOnly`). **Actes a tots els tipus de treball.** Expedients a
  l'ordinador: amplades per a les 7 columnes d'ara (`theme-v878277.css`), data de creació només si n'hi ha, cercador
  abans dels filtres. **V87.289**: 8 columnes amb **«Promotor»** (`promotorNom878289`: `obra.propietat`, «—» si és el
  mateix client o pendent), que també ordena i es busca; número i data de creació sencers, nom del treball més
  estret (`theme-v878289.css`, selectors amb `.exp-table-v878289`).
- **Notes de visita** (V87.278, `Notes878278`, `src/theme-v878278.css`): pestanya «Notes» a totes les obres, just després
  d’Actes (no al portal de client). Cada nota: número correlatiu i data automàtics (si un altre aparell ja ha fet aquell
  número, en desar passa al següent), text o dictat (`DictatActa878263`), fotos i documents. Les fotos van a
  `notes[].fotos` (`src`) i els documents a `notes[].docs` (`url`): `fileStore.js` ja els desa a l’aparell i els puja al
  núvol com els de les actes. Només el propietari de l’obra pot eliminar una nota.
- **Albarans dins de l’obra** (V87.279, `Albarans878259 obraId`, `src/theme-v878279.css`): pestanya «Albarans» (a «Més», grup
  econòmic) a les obres en execució (gestió integral, direcció, control econòmic) o a qualsevol que ja en tingui; amb l’obra
  ja triada i sense filtres d’obra/client. Els albarans continuen a la mateixa llista de sempre (`aco_albarans_v878259`),
  i surten també a la pantalla general. Traduïts; icones en lloc d’emojis.
- **Partides habituals del client** (V87.280, `ClientHabituals878280`, `src/theme-v878280.css`): a la fitxa del client, les
  partides dels seus pressupostos classificades en 25 capítols estàndard d’obra (`CAPS_STD878280`, regles per paraules
  `CAP_RULES878280`; amb les dades de l’Héctor el 98 % cau en un capítol concret), amb el preu de l’última vegada i en
  quantes obres surt; com a màxim 8 per capítol. «Posar-les a la llibreria del client» les afegeix a la llibreria central
  vinculades al client (si ja hi eren, només s’hi vincula el client): surten al pressupost a «Afegir partides de la
  llibreria» → «Habituals de…». No és BEDEC ni CYPE (són de llicència): són les partides i els preus propis. La llibreria
  central de l’Héctor era buida (17/10/2026); les velles per client (`aco_partides_client_v87115_*`) ja no les fa servir cap pantalla.
- **Pressupost i Certificacions** (V87.273, `src/theme-v878273.css`): la capçalera del pressupost porta el nom del
  pressupost, el total i **un sol menú «Accions»** agrupat (editar · importar · pressupost nou · documents · aquest
  pressupost: canviar el nom, buidar, eliminar). **Abans** hi havia «Canviar nom del pressupost seleccionat»,
  «Guardar/fixar», «Renombrar amb finestra», tres botons «+ …» i el calaix «Origen, importació…» sempre a la vista
  (`fixarBudget8788` ja no té botó). La tira de pressupostos (`BudgetBar878273`) només surt si n'hi ha més d'un.
  «Vista del pressupost» → «Validar descompostos» dins d'Accions. Certificacions: llista curta (les 4 últimes i la
  triada, «Veure-les totes»), paperera petita, importar Excel dins de «Més»; al mòbil cada fila cap a la pantalla.
  Taula resum: el nom del capítol sencer i fix a l'esquerra. Pressupost ràpid: les accions de dalt (format del
  pressupost ràpid) es queden i dins d'Accions no es repeteixen; fora la franja de xifres. `Empty` tradueix el text.

## Pendent o a mitges

- **Encàrrecs de l’Héctor del 19/10/2026 pendents (Dades en pestanyes, pobles i «Accions»: fets a la V87.304):**
  - **Revisió amb clients inventats: primera versió feta el 20/10/2026** (`tools/proves/clientsvirtuals.mjs`, 25 proves):
    constructora (Brava: obra nova, pressupost d’un PDF, certificació, proforma, despesa, cita, nota, recarregar; mòbil) i tècnic
    (Oriol: cèdula, documents del tràmit, honoraris acceptats, pendent de facturar, despesa pròpia, acta, recarregar). Falta:
    el client particular i l’iPad (les hores, les factures d’honoraris i, des del 20/10, les de certificació —proforma de
    743 €, «Fer factura» amb la sèrie del client i el PDF, i VeriFactu simulat— ja hi són: 32 proves).
    **Troballa:** un compte d’empresa nou té **el Mòdul 2 bloquejat** (Pressupost, Certificacions i Facturació surten com
    «Aquesta funcionalitat forma part del Mòdul 2», `hasModule2Access8747`: `aco_config_v60.modul2Actiu` o `aco_modul2_actiu`)
    i a Ajustos no hi ha cap botó per activar-lo. Preguntar a l’Héctor si s’activa sol per als constructors (prova pilot).
    `auditoria.mjs` (20/10/2026): ja fa lliscar els menús llargs abans de mirar si una opció és tapada (amb 16-17 opcions,
    «Accions» del pressupost sortia com a tapat); 0 problemes a les 180 pantalles de l’Héctor ni a les de Brava i Oriol.
  - **Comptador automàtic de temps**: compta com a feina el temps que només es consulta una obra (l’Héctor, 19/10/2026: «no pot
    ser que entri a consultar i em compti com a feina executada»). Replantejar-lo a la versió següent (p. ex. que comenci quan
    s’escriu o es fa alguna cosa, o preguntar en sortir).
  - ~~Llegir un pressupost en PDF~~: fet a la V87.305. (Abans: d’un client i passar-lo a un pressupost de l’app; el text dels PDF
    ja es llegeix per files a `albaraFromPdf878259`).
  - **Google Drive dins de l’app** (botó «Des de Google Drive», Google Picker): cal que l’Héctor creï una clau d’API al seu
    projecte de Google. Mentrestant, a l’iPad: app Google Drive + app Fitxers › Navega › ⋯ › Edita › activar Drive.
  - **Mòdul tècnic** (`docs/proposta-perfil-tecnic.md`): passos, llistes de comprovació, fitxa de visita i PDF de la visita per a
    cèdules, certificats energètics i ITE. Preguntes pendents a l’Héctor: quants en fa i quin li fa perdre més temps; programa
    dels certificats (CE3X, HULC, CYPETHERM); un plànol exportat de **MagicPlan** (PDF i, si en surt, la taula de superfícies)
    per omplir sola la fitxa de la cèdula; **«Enllaços»** a cada obra (oficina virtual del CATGI —no s’hi pot entrar per ell—,
    Cadastre amb la referència cadastral de l’obra, ICAEN, Agència de l’Habitatge) i quins més vol.
  - ~~Agents principals sense la direcció d’obra triada a Dades~~: arreglat a la V87.308 (`agentRoleOrder878134`).
  - **Mòdul tècnic, respostes de l’Héctor (19/10/2026):** programa dels certificats energètics: **CE3X**. Provant la cèdula de
    Jaume I: els passos com a llista que s’ha de marcar per passar al següent **no l’ajuden gaire a la visita**. Prefereix una
    **llista de consulta** (per no oblidar res) i un **apartat per entrar els documents del tràmit** abans de l’enllaç amb
    Habitatge (cèdula) o Indústria (certificat energètic); MagicPlan: un enllaç i, si es pot, que l’app llegeixi el plànol
    exportat per treure’n dades. Els plànols i fotos de MagicPlan els pujarà a la **bústia privada**
    https://claude.ai/artifact/M1gGstHDmcNcuQQWvzA7zj (llegir-los amb l’eina Artifact: `list` amb `scope:"assets"` i la llista
    `fitxers` amb ArtifactData; porten dades de clients, no copiar-los a les proves).
  - **Menús segons el perfil:** nota de l’Héctor del 19/10/2026 a `docs/proposta-global.md` §10.9; respostes del 20/10 (temps
    real, despeses pròpies sí, pendent = honoraris acceptats − facturat) i feta la part del tècnic a la V87.307. Falta el
    mòdul contractista (menús de la taula del 10.4).
- **Ajuntar els canvis per apartats: fet a la V87.293** (vegeu «Edició alhora»). Falta provar-ho de debò amb dues persones.
- **Pantalles (nota de l’Héctor, 15/10/2026)**: a Expedients, «accions» i «apartats de l’obra» van per separat →
  ajuntar-les en una sola pestanya més simple. Simplificar les pestanyes de tota l’app i de tots els aparells: n’hi ha
  moltes que fan el mateix. Detall a `docs/proposta-global.md`.
- **Auditoria de seguretat (10/10/2026)**: `docs/auditoria-seguretat.md`, ordenada per urgència. Resolts el
  13/10/2026: domini `controlobres.app` registrat i registre de comptes tancat a Supabase. Còpies del núvol actives
  des del 13/10/2026. Contrasenyes `0000`/`1919`/`socoterm` fora del codi i compte `pol` esborrat a la V87.260.
- **App sense cobertura: fet a la V87.271**; provat per l’Héctor al mòbil i a l’iPad en mode avió el 16/10/2026 (falta el flux
  d’actualització quan es puja una versió nova a Render).
- **Esborrar de l’historial de GitHub la còpia de dades de juliol**
  (`DADES_REPARADES/app-control-obres-hector-backup-reparat-v87-211-2026-07-22.json`, dades reals de clients).
  Es va treure del repositori a la V87.259.2, però continua als commits antics. Cal reescriure l’historial
  (git filter-repo o BFG) i forçar la pujada; fer-ho amb calma i amb còpia abans.
- **VeriFactu (abans de l’1/1/2027 per a les S.L.)**: **ATURAT fins que l’Héctor parli amb la gestoria** (no instal·lar res
  del servidor). Fet a l’app i al simulador (V87.285). Falta instal·lar l’SQL i la
  funció `verifactu`, el compte de proves de Verifacti (comprovar l’API), rectificatives, honoraris, còpies del
  registre i la declaració responsable (fabricant: gestoria). Tot a `docs/verifactu-pla.md`.
- **Revisar l’IVA de les proformes de cada obra** (V87.284): de la PF-001 a la PF-008 de totes les obres surt un 10 %
  (el valor vell era compartit entre obres).
- **Google Calendar**: fet a la V87.295 i activat a la V87.298 (ID de client posat el 18/10/2026). Falta que l’Héctor el
  provi de debò (a l’ordinador i a l’iPhone, on el calendari nou s’ha d’activar a calendar.google.com/calendar/syncselect).
  Per a altres usuaris: afegir-los com a usuaris de prova (fins a 100) o demanar la verificació a Google.
- **Numeració de factures per client** (V87.297): l’Héctor ha d’activar-la a la fitxa de Brava (prefix i número
  següent). Preguntes a la gestoria: qui és l’emissor (a les proformes surt la constructora), números PF repetits entre
  obres, sèrie per client.
- **Revisió del mòdul tècnic, tandes següents** (`docs/revisio-modul-tecnic.md`): seguir pestanya per pestanya amb l’Héctor (Preus,
  Facturació, Hores, Despeses, Agenda, Ajustos i, dins de l’expedient, cada apartat); després, els altres mòduls.
- **Proposta de Despeses, Facturació, menús per perfil i noms** (`docs/proposta-global.md` apartat 10): noms (V87.300), menú del
  tècnic (V87.307), Despeses (V87.311) i cost real al Rendiment (V87.312) fets. Falta: menús segons el perfil i el mòdul (10.4) i
  els perfils Treballador i Autònom.
- **Lectura d’albarans amb IA directa**: falta clau d’Anthropic + desplegar la funció
  (`INSTRUCCIONS_LECTURA_ALBARANS_IA.txt`).
- **Hores per treballador** (constructors) i mòduls per a **autònoms / operaris / promotors**.
- **Portal de client amb compte de núvol propi** (avui els clients només tenen el portal intern).
- Obres compartides: hores, agenda i albarans no es comparteixen; «només consulta» no es bloqueja a la pantalla.
- Seguretat: considerar Supabase Pro en comercialitzar (les regles antigues d’arxius anònimes es van esborrar a la V87.262).
- Dades a revisar amb l’Héctor: partides certificades per sobre del 100 %, codis repetits
  (CALA ROVIRA 01.16, Verbania 04.01), dates desordenades a JAVI PUADO i MARICEL.
- La foto de COMODORO s’ha de tornar a posar (la vella no es va desar mai).
- Lligar amb l’altra app d’hores de l’Héctor (no s’ha mirat).
- Auditoria general del codi (`App.jsx` és molt gran i amb moltes capes de versions).

## Com arrencar i provar

- **Ordinador (Héctor)**: doble clic a `OBRIR_APP.bat` → `http://localhost:5173`. Amb `OBRIR_APP_MOBIL.bat`
  s’hi pot entrar des del mòbil a la mateixa wifi (cal xarxa «Privada» a Windows).
- **Compilar**: `npm run build`. **Publicar** (només amb el sí de l’Héctor): `git commit` + `git push` → Render.
- **Proves sense tocar dades reals** (`tools\proves`):
  - **Carpetes temporals i perfils del navegador de les proves a `D:\aco-tmp`** (des del 18/10/2026; `ACO_PROVES_TMP` per
    canviar-ho). El C: es va omplir (0,02 GB lliures) amb 86 carpetes que havien deixat proves aturades a mitges (2,96 GB).
    Si una prova s'atura, la carpeta pot quedar a `D:\aco-tmp`: es pot esborrar.
    **19/10/2026: el C: es va tornar a omplir** (6 GB lliures): l’Edge de cada prova deixava a `C:\Users\Hector\AppData\Local\Temp`
    una carpeta `scoped_dir…` de 0,39 GB (baixava components: llistes de seguretat i de bloqueig). N’hi havia 137 (uns 30 GB),
    moguts a `D:\aco-tmp\restes-edge-C` (no serveixen per a res: es poden esborrar). Ara totes les proves obren l’Edge amb
    `--disable-component-update` i amb `TEMP`/`TMP` a `D:\aco-tmp`: ja no en deixen cap. **Una prova nova que obri l’Edge ha de
    fer el mateix.**
  - **Les dades reals de l’Héctor canvien** (el 18/10/2026: ha tret les fotos perdudes de la piscina, ha connectat Google
    Calendar, ha posat contrasenya al portal de Socoterm, ha omplert la llibreria, ha esborrat les obres de prova i ha desat
    l’idioma «ca»). Les proves no han de dependre d’aquest estat:
    - `fitxerstest`/`esborrarfotostest` tornen a posar 11 fotos perdudes a la CÒPIA;
    - `gcaltest` en treu la connexió de Google;
    - les proves en castellà canvien l’idioma amb el botó d’Ajustos (com l’Héctor), no amb `saveLang`.
  - `node mocksupabase.mjs 5490 dump.json` → Supabase de proves (auth, `aco_kv`, `aco_shared`, funció d’albarans).
  - Servidor A (ordinador): `set ACO_DADES_DIR=<còpia>&& set VITE_CLOUD_URL=http://localhost:5490&& npx vite --port 5196`
  - Servidor B (com Render, sense disc): `set ACO_SENSE_DISC=1&& set VITE_CLOUD_URL=http://localhost:5490&& npx vite --port 5198`
  - Proves amb Edge headless + CDP: `cloudtest*.mjs`, `sharetest.mjs`, `emptest.mjs`, `pdftest.mjs`, `fototest.mjs`…
    (perfil del navegador en una ruta curta, si no IndexedDB falla).
  - `contrasenyestest.mjs`: entrar a l’app sense contrasenyes al codi (ordinador, mòbil, empresa, sense connexió,
    portal), amb una còpia de DADES; comprova que el DADES real no canvia.
  - `fitxerstest.mjs`: fotos/croquis/documents de les actes desats a l’aparell (ordinador i mòbil compilat).
  - `esborrarfotostest.mjs`: esborrar fotos de l’acta i treure les perdudes (ordinador, mòbil i iPad).
  - `nuvoltest.mjs`: arxius al núvol (ordinador → mòbil, sense connexió, fotos de la V87.261, obra compartida, permisos).
  - `dictattest.mjs`: dictat (reconeixement de veu simulat), croquis, fotos
    no reduïbles, documents grans i espai a Configuració; ordinador, mòbil compilat i compte d’empresa.
  - `navtest.mjs`: capçalera fixa, barra de baix, menú, finestres i idioma (mòbil, iPad, ordinador; català i castellà).
    `i18ntest.mjs`: tots els `t("…")` tenen traducció al castellà. `obratest.mjs`: pantalla d’Obra (barra, menú ⋯,
    estat i els seus colors, els tres blocs Fitxa · Seguiment · Econòmic —fila a l’ordinador i l’iPad, quadre al mòbil—, apartat a la mateixa
    pàgina, barra fixa en baixar, color de l’estat a la llista, castellà). `expedientstest.mjs`: llista en targetes,
    cercador fix, codi curt, codi de carpeta a Dades, Inici en castellà. `offlinetest.mjs`: l’app compilada s’obre
    amb el servidor i el núvol apagats, amb les dades de l’aparell, i en tornar la connexió es puja la feina.
    `pantallestest.mjs`: Agenda, Gestió temps i Factures (ordinador en català, mòbil en castellà, finestres de cita i
    d’hores, filtres que caben a la pantalla). `pressuposttest.mjs`: Pressupost i Certificacions (Accions agrupat,
    pressupost nou / canviar el nom / eliminar, llista curta de certificacions, taula resum, pressupost ràpid, castellà).
    `mirapress.mjs`: captures i llista de botons d’uns apartats de l’obra (`OBRA=`, `TABS=`), per estudiar pantalles.
    `traducciotest.mjs`: Inici, Clients, Agents, Configuració, compartir i benvinguda d’empresa en castellà; les llistes
    desen el valor en català. `mirapantalles.mjs`: captures i text de pantalles del menú en castellà (`PANTALLES=`).
    `expfiltrestest.mjs`: filtres d'Expedients (ordinador, iPad, mòbil; diversos anys i estats alhora), foto o
    inicials, «Més» de l'obra no tapat, portal en castellà. `revisiodades.mjs`: informe de dades a revisar de totes
    les obres (només llegeix el DADES; l'informe porta dades de clients: es deixa a `tools/proves`, que no es puja).
    `verifactudemotest.mjs`: demostració de VeriFactu a Factures (ordinador en català, mòbil compilat en castellà).
    `proformestest.mjs`: IVA/retenció de les proformes per obra (una obra no canvia l’altra; les d’abans es veuen igual).
    `vfemetretest.mjs`: emetre factures amb VeriFactu (simulat al Supabase de proves: `POST /__vf` activa un compte o fa
    fallar l’intermediari; `GET /__vf` dona el registre): número del servidor, bloqueig, PDF amb QR, error i «Tornar a
    enviar», una factura per certificació, no eliminar la certificació.
    `expcolstest.mjs`: columnes d’Expedients a 1440 i 1920 px (Promotor, número sencer, nom del treball, ordenar, buscar).
    `graficatest.mjs`: gràfica d’ingressos (factures de prova 2025 i 2026 a la còpia; ordinador i mòbil).
    `tempstest.mjs`: temps a facturar (15’ amb mínim 30’), quota fixa, «Ja facturat» i «Facturat» a l’obra.
    `gcaltest.mjs`: Agenda ↔ Google Calendar amb el Google simulat del Supabase de proves (`/gcal/calendar/v3`, `/__gcal`;
    `VITE_GOOGLE_API`, `VITE_GOOGLE_CLIENT_ID` i `window.__acoGoogleMock` per al permís).
    `citaveutest.mjs`: frases de cites en català i castellà (sense navegador). `veutest.mjs`: «Per veu» a l’Agenda (escrit,
    veu simulada, mòbil en castellà).
    `factclienttest.mjs`: «Fer factura» amb la numeració del client (fitxa de Brava, número i PDF, eliminar, certificació
    bloquejada, obra d’un altre client sense el botó).
    `merge3test.mjs`: el mòdul que ajunta versions (sense navegador). `fusiotest.mjs`: dos aparells i dos comptes treballant
    la mateixa obra (apartats diferents sense pregunta; el mateix camp → pregunta amb el detall; llista d’expedients).
    `docmobiltest.mjs`: documents al mòbil, l’iPad i l’ordinador (certificació, pressupost i acta).
    `primerobrirtest.mjs`: obre totes les obres amb una còpia del DADES sense canviar res i diu què s’ha escrit; fa la
    taula de proformes (`tools/proves/proformes-AAAA-MM-DD.csv`).
    `pestanyestest.mjs`: una sola pestanya «Pressupost» (el ràpid a dins, sense canviar dades en obrir), Actes a tots els
    treballs, taula d’Expedients proporcionada.
    `notestest.mjs`: Notes (numeració i data, text, foto i document, recarregar, mòbil amb la foto del núvol, eliminar).
    `agentstest.mjs`: agents (V87.301): llista sense repetits i amb grups, «Editar» i «Treure de la llista», obra amb molts
    agents (avís, ajuntar repetits, triar quins treure), obra sense agents i selector, una acta nova no copia agents,
    botó «A dalt» (ordinador i mòbil). `plustest.mjs`: botó ＋ de l’obra (mòbil i iPad; Foto, Nota, Acta, Hores; no a l’ordinador).
    `idiomapctest.mjs`: canviar l’idioma a l’ordinador des d’Ajustos (com l’Héctor).
    `menustest.mjs`: menús «Accions», «Imprimir» i «⋯» de l’obra visibles (ordinador, iPad, mòbil).
    `sessiotest.mjs`: sessió del núvol amb l’app en dues pestanyes (`MOCK_ROTA=1`). `fretest.mjs`: fre de seguretat del núvol.
    `agents303test.mjs`: buidar els agents de les obres, afegir i treure a l’obra, eliminar i tornar a crear a la llista.
    `dadestest.mjs`: Dades de l’obra (promotor triat que no torna enrere, el que s’escriu no es perd).
    `pdfpressupostunit.mjs` i `pdfpressuposttest.mjs`: llegir pressupostos en PDF. `tecnictest.mjs`: passos dels encàrrecs
    tècnics, Inici i enllaços de l’obra (Cadastre, tràmits, CATGI des d’Ajustos).
    `fitxestest.mjs`: obra nova amb el client i el promotor, Resum amb el contacte, Dades en pestanyes (client, promotor,
    constructora, direcció d’obra, industrials), adreça separada i automàtica, desplegable que no es tanca amb el comptador.
    Les proves que comparen amb una versió d’abans fan servir `WEBROOT=<carpeta>`: una còpia de la versió amb
    `git worktree add --detach D:/aco-tmp/wtXXX <commit>` i `node_modules` enllaçat (`New-Item -ItemType Junction`).
    `albaranstest.mjs`: Albarans dins de l’obra (obra ja triada), a la pantalla general, icones i castellà al mòbil.
    `residualtest.mjs`: amb l’app en castellà, busca frases del diccionari que encara surten en català (pantalles del
    menú i totes les pestanyes d’una obra). `i18n-on.mjs`: on surt un text sense `t(…)`. `i18n-docs.mjs` i
    `i18n-docwrap.mjs`: textos fixos dels documents (PDF) i eina per posar-los en l’idioma del document.
    `documentstest.mjs`: documents en l’idioma de l’obra (app en català i obra en castellà, i al revés; selector a Dades;
    pressupost, certificació i acta de debò; cap frase en català fora de les dades).
    `habitualstest.mjs`: partides habituals del client i pas a la llibreria. `habitualsdades.mjs`: classificació amb les dades
    reals (només llegeix el DADES; `MOSTRA=1` llista les que queden a «Altres»).
  - `synctest.mjs`: dos aparells; un canvi no es perd i, si es canvia el mateix als dos, es pregunta (`WEBROOT=` per comparar versions).
  - `alhoratest.mjs`: edició alhora (triar la meva / la de l’altre, sense cobertura, dos desats gairebé alhora,
    finestra oberta, versions guardades, obra compartida). `alhorarealtest.mjs`: amb una còpia de DADES, ordinador i
    mòbil mirant pantalles sense canviar res → cap pregunta. El Supabase de proves té `/__amaga` per simular dos desats alhora.
  - `copiatest.mjs`: 26 proves de `tools/copies` (còpia i restauració) amb el Supabase de proves i carpetes temporals.
  - `compare.js` + `extractor.js`: comparar pressupostos i certificacions entre dues còpies.
- **Totes les proves de cop** (20/10/2026, després de la V87.310): `D:\aco-tmp\totes-proves.sh` (resultat a
  `D:\aco-tmp\totes-20-10.txt`). 53 proves en verd. **No compten:** `bigtest`, `cloudtest*`, `emptest`, `fototest`, `migtest`,
  `pdftest`, `sharetest` (proves antigues que s’han de cridar a mà, amb adreces i carpetes; sense, s’aturen al moment) i
  `comptadortest.mjs` (escrita el 20/10 a la 1:00 per a un **comptador de temps nou que encara no existeix**: no compta en
  entrar, pregunta en començar a escriure, pausa si no es toca res, desa en sortir amb «Canviar» / «No era feina»; cal el sí de
  l’Héctor). `contrasenyestest` pot fallar la primera vegada si la memòria cau de Vite es refà (dos servidors alhora): tornar-la a
  passar. Les proves no s’han de passar mentre es toca `src/` (el servidor de Vite recarrega l’app a mitja prova).
- **Abans de tocar `src/`, tancar `OBRIR_APP.bat`**: el servidor de Vite aplica els canvis a l’app oberta amb les
  dades reals (va passar el 13/10/2026 amb la V87.260: es van posar al dia els comptes de l’Héctor abans d’hora).
- Abans de llançar dos servidors de la mateixa carpeta, deixar arrencar el primer (memòria cau de Vite).
