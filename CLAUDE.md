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
    Facturació, Ajustos, l’edició alhora) i el 24/10/2026 (constructora: Importar, Empresa, Amidaments i Preus i marges, Partes, hores
    del personal i fitxatge, Agenda › Equip, Rendiment; tècnic: Contactes, el comptador que ja no s’engega sol, Rendiment). Els PDF de
    `GUIES_USUARIS` no s’han tornat a fer (porten les contrasenyes: quan ho digui l’Héctor).
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
- **V87.335 · El micròfon torna a funcionar al mòbil** (l’Héctor, 21/10/2026: «em demana permís pel micròfon i no em deixa dictar»):
  la reconnexió automàtica del Google (V87.331) obria la finestra de Google en el mateix toc de «Nota de veu» / «Dictar», i el navegador
  ja no deixava engegar el micròfon. Ara només es fa **a l’ordinador** (`(hover:hover) and (pointer:fine)`), un sol cop per vegada i mai
  dins d’una finestra ni en tocar «Nota de veu»; el botó «Nota de veu a l’agenda» de l’Inici ja no la fa. Al mòbil i a l’iPad, el botó
  «Connectar amb Google Calendar» (un toc). `v331test` (17, amb el mòbil tàctil i el dictat simulat).
  - Una «nota» que surt al calendari de l’iPhone amb un **cercle blau** i només l’hora d’inici (que en tocar-la obre Recordatoris) és un
    **recordatori d’Apple** (Siri o el teclat), no una cita de l’app: les de l’app van al calendari «Control d’Obres» amb inici i final.
  - **Compte en editar proves amb `String.replace`:** si el text nou porta `$'` (p. ex. `'^Desar$'`), JavaScript hi copia la resta del
    fitxer (va passar el 21/10/2026 amb `clientsvirtuals.mjs`). Fer servir `split/join` o una funció com a substitució.
- **Revisió del mòdul de constructora** (l’Héctor, 21/10/2026 al vespre: «és el que m’interessa tancar abans per ensenyar-lo a
  clients»; ho prova amb el compte de debò de **Brava** al mòbil, i el que hi canviï ho veu Brava). Es fa per tandes a
  `docs/revisio-modul-constructor.md` (tanda 2: paquet «Empresa» amb treballadors i cost/hora; tanda 3: despeses del personal i
  rendiment = certificat − despeses; tanda 4: Planning amb vinculacions i colles).
  - **V87.336 (tanda 1):**
    - **Inici:** `ObresEnCurs878336` (constructora i gestió total, `diuObra878326`) en lloc de `HomeCharts878251`: % certificat
      (`certObra878336`: els pressupostos amb alguna certificació) i l’última certificació; al tècnic, sense columna
      (`sense-costat-v878336`).
    - **Contactes:** els promotors de les obres (`obra.propietat`…) hi surten encara que no siguin agents (`_dePromotor878336`; si
      se’n desa un, `addToLibrary878303`).
    - **Obres compartides:** les dades de l’obra són les de l’Héctor; el client (`obra.client`) és un id de la llista de **l’Héctor**
      (a les de Brava, `brava`), que no és a la llista de clients de l’altre compte. Un `<select>` amb un valor que no és a les
      opcions ensenya la primera (per això sortia «David Fuster»): a Dades › Client hi ha l’opció amb `clientNomCompartit` i, si
      `obra.compartida`, no es pot canviar. El promotor de debò és `propietat` (`quiObra878336`).
    - Documents: «00 · Despatx tècnic / honoraris» només amb el mòdul tècnic i mai en una obra compartida. Cadastre només amb el
      mòdul tècnic. Fora «Import per certificació» del Resum.
    - Pressupost: el capítol principal que agrupa capítols és una línia plegada (`grup-cap-v878336`, `grupObert878336`).
    - Agenda de l’obra (`AgendaExpedient8774`): «Nota de veu» (`VeuCita878294` amb `obraFixa`).
    - `omplenaDemo878328` ja no esborra les obres compartides que el compte ja tenia.
    - Estils: `src/theme-v878336.css`. Prova: `constructor336test.mjs` (24; l’obra compartida es posa amb un POST a `aco_shared`
      del Supabase de proves amb `Bearer tok-<id de l’Héctor>`).
  - **V87.337 (facturació):**
    - **Comptes d’empresa amb el mòdul Obra** (`esEmpresaFactura878337`): sèrie de factures de l’empresa
      (`aco_empresa_v878259.facturacio878337 = {prefix, auto, digits, propers:{[prefix]:n}}`; de sèrie `F<any>-`, que canvia sol
      d’any si no s’ha tocat) i l’empresa com a **emissora** de tots els documents (`emissorDoc878337` dins
      d’`issuerFiscalBlockHtml87100` i `issuerFiscalName87100`; sense logo no surt el requadre «LOGO»). Dades a Ajustos ›
      `DadesEmpresa878337` (`fiscal`, `nif`, `carrer`, `codiPostal`, `poblacio`, `provincia`, `telefon`, `email`, `iban`; logo a
      `aco_logos_contactes_v878315` amb la clau `client:empresa`). Amb IBAN, la factura diu la forma de pagament (`pagament878337`).
      El compte de l’Héctor continua amb la sèrie de cada client (V87.297).
    - `FerFactura878297` reescrit: sèrie de l’empresa (editable) o del client, IVA i retenció (es desen a `factParams` de la
      certificació), dades de l’empresa si falten; la factura porta `serieEmpresa`, `prefix`, `budgetId`. `facturesEmpresa878337`
      (totes les factures, també de les obres compartides) evita repetir números.
    - **Proformes per pressupost** (`proformesObra878337`, ara també a `Fact`): abans `Fact` calculava cada proforma amb les partides
      de tots els pressupostos de l’obra. `calcPf878337`, `paramsPf878337` (IVA/retenció de cada certificació, amb els d’abans del
      17/10), `docFactura878337` (el PDF de la factura).
    - `Cert` rep `obra`, `client`, `setClients`, `obraData`, `setObraData` (les factures són de l’obra sencera: el `setData` del
      pressupost triat, `mergeBudgetData8786`, **no desa** les claus que no són partides, certificacions…). Barra: «Editar
      certificació»; «PDF» (abans «Imprimir») · «Enviar» · «Fer factura» / «Factura F…» · «⋯» («+ Afegir feina» quan no s’edita).
    - **Facturació (menú) de l’empresa** (`FacturacioEmpresa878337`): «Factures» (ordre numèric; any, obra, cobrament; `cobrada`,
      `dataCobrament` a cada factura; Excel), «Per facturar» (`factParams[certId].fora` = facturada fora de l’app) i «Honoraris»
      (només amb el mòdul Tècnic: la pantalla d’abans). El compte de l’Héctor continua amb `FacturesGeneral8738`.
    - **Correu** (`EmailModal`, `draftCorreu878337`): client (i persones de contacte), promotor i agents de l’obra amb correu, o una
      adreça escrita; `mailto:` (correu de l’aparell) o Gmail. Pressupost: «Enviar» a la vista (fora de «⋯»).
    - Estils: `src/theme-v878337.css`. Prova: `facturacio337test.mjs` (30). `menustest` busca «PDF» a les certificacions.
  - **V87.338 (despeses i rendiment):** tipus de despesa `Empresa` (sense obra, `categoria` de `CATEGORIES_EMPRESA878338`;
    `ambEmpresa878338`), requadres `GRUPS_DESPESA878338` que filtren, noms `etTipusDespesa878338` («Factura d’industrial» és
    `Subcontracta`), Excel. **Rendiment:** `rendimentObra878339` / `RendimentObra878339` (a dalt del Rendiment de l’obra; certificat a
    origen − despeses = benefici; el facturat, a sota; % sobre ingressos i sobre cost) i `RendimentEmpresa878339`
    (Facturació › Rendiment, per any, amb les despeses de l’empresa i el resultat). `CostRealObra878312` es queda amb el cost per
    capítol. Prova: `despesesrend338test.mjs`.
  - **V87.339 (paquet «Empresa»):** pantalla `Empresa878339` (menú «Empresa» si `PERFIL878304` i el mòdul Empresa; `Briefcase`):
    Dades (`DadesEmpresa878337`, que surt d’Ajustos per a aquests comptes) · Treballadors (`aco_treballadors_v878339`: `{id, nom, ofici,
    costHora, dni, mobil, alta, actiu, docs}`; `costHora878339`) · Documentació (`aco_docs_empresa_v878339`) · Industrials (de
    `agentsLibrary878301` + clients del grup «industrial»; docs a `aco_docs_industrials_v878339` per persona; «Nou industrial» →
    `addToLibrary878303`). Documents `{id, tipus, venciment, fet, teArxiu, nomArxiu}` amb `DocsLlista878339`; l’arxiu, a
    `aco_empresa_arxiu_v878339_<id>` (imatges reduïdes; PDF fins a 8 MB). `estatDoc878339`: vigent / caduca aviat (≤30 dies) /
    caducat / falta. Estils: `src/theme-v878339.css`. Prova: `empresa339test.mjs` (21). `facturacio337test` adaptada.
  - **V87.340 (hores del personal):** files a part de les del tècnic (que són per facturar): `aco_personal_v878340_<obra>` =
    `[{id, data, treballadorId, treballadorNom, hores, costHora (el d’aquell dia), nota}]`; el cost per hora d’un treballador en una
    obra, `aco_costhora_obres_v878340` (`{[obraId]:{[treballadorId]:"20"}}`; és del compte, no de l’obra: en una obra compartida
    l’altre no el veu). `costHoraA878340` (obra → fila → empresa), `costPersonalObra878340(obraId, dins)`, event
    `aco-personal-changed`. **Menú Hores** dels comptes amb el mòdul Empresa (`ambEmpresa878338`): `HoresEmpresa878340` («Personal» =
    `PartHores878340`, part del dia; «Les meves hores» = `GestioTemps878255`). **Obra › Hores** («Gestió temps»):
    `PersonalObra878340` a sobre de `HonorarisTemps`; a la gestió total «Gestió temps» ja no s’ajunta amb Honoraris ni va a «El meu
    encàrrec». **Rendiment:** `rendimentObra878339(data, despeses, personal)` (`perTipus.Personal`) i `RendimentEmpresa878339`
    (per any, «Personal: …» a dalt). No va a Despeses ni a l’Excel. Estils: `src/theme-v878340.css`. Prova: `personal340test.mjs` (29).
  - **V87.341 (Planning amb vinculacions i qui hi treballa):** a cada capítol de `ganttConfig87217.capPlans`: `dep` (capítol
    d’abans), `lag` (dies laborables: 0 = l’endemà que acabi; −2 = 2 dies abans que acabi; +3 = 3 dies després) i `qui`
    (`[{k:"c:<colla>"|"t:<treballador>"|"i:<industrial>", nom}]`). `resolPlans878341` (dates de cada capítol seguint les vinculacions;
    els cicles s’ignoren; un inici en cap de setmana passa al dilluns), `moureDiesLab878341`, `quiPot878341`, `industrialsObra878341`,
    `coincidencies878341` (un treballador, o la seva colla, a dos capítols alhora). Finestra `EditaCapitol878341` (el «⋯» de cada fila a
    «Planificar»; al mòbil, les dates només són a la finestra). Fletxes: SVG dins de `.gt-scroll-v878253` (ara `position:relative`),
    mesurant les files (`data-cap`) amb `useLayoutEffect` i `geo878341` (X i amplada de l’escala). «Un capítol darrere l’altre» crea
    les vinculacions. Camp nou `colla` als treballadors. Dades d’exemple vinculades (el 3r capítol, 2 dies abans). Fora els textos que
    explicaven el Planning. Estils: `src/theme-v878341.css`. Prova: `planning341test.mjs` (17).
  - **V87.342–344 (fases, rendiment, despeses):** barra `FasesObra878342` a dalt de l’Econòmic (`ECON_FASES878342`; selecciona
    `activeBudgetIdObra`; «Tota l’obra» = estat `totaObra878342` de l’Obra; `GestioObra8746 senseBarra878342`). `faseDe878342` (la
    fase d’una despesa o d’unes hores: `budgetId`, la de la partida o capítol, o "" sense fase). Amidaments per fase
    (`amidDe878342`/`posaAmid878342`: la principal a `amidaments878328`, les altres a `amidamentsFases878342`). Rendiment
    (`GlobalRendibilitat8789` → `RendimentFases878342`, `rendimentFase878342`, `ResumFases878342`, `CapitolsFase878342`); DGE i BI
    previst a `data.rendiment878342` o `aco_empresa_v878259.dge878342`/`bi878342` (`cfgRend878342`). `senseHoresPropies878342`:
    constructora/treballador sense «Les meves hores» ni comptador. Menú «Rendiment» (`RendimentEmpresa878343`, pantalla «Rendiment
    empresa», `LiniesChart878343` amb la paleta validada de l’skill dataviz); Facturació ja no té la pestanya Rendiment.
    V87.344: `esConstructora878344` (totes les obres amb la plantilla de gestió integral; `TIPUS_CONSTR878344`), tipus de despesa
    `MaObra`, grups `GRUPS_DESP878344` (Materials = Material + Albarà; Mà d’obra; Industrials; Empresa) i `ImportarDespeses878344`
    (`llegirExcelDespeses878344`, totes les pestanyes; `importat` = nom de l’arxiu). Estils: `theme-v878342/343/344.css`. Proves:
    `fases342test` (27), `rendiment343test` (18), `despeses344test` (15); `personal340test` adaptada.
  - **V87.345 (Excel de control d'obra de Socoterm, «Les Moreres»):** la V87.344 ho posava tot a Materials (no entenia les pestanyes en
    castellà). `tipusDeNom878344`: Materiales → Material; Trabajadores/personal/horas → MaObra; Combustible/lloguer/maquinària/transport →
    **`Altres`** (tipus nou, «Altres despeses»); Comisión → **`Comissio`** (tipus nou); Facturado/emitidas/ingresos → «+» (**factures
    emeses**: van a `data.facturesObra878297` amb `importada:true`, sense certificació ni PDF —a Facturació, «Importada»— i compten com a
    facturat al Rendiment); Beneficio/Rendimiento/Resumen/Obra → «-» (desmarcades, «No són despeses»). Columnes noves: quantitat, unitat i
    preu (el concepte diu «Oficial 1º · 8 h × 25,48 €»); «Valor» és un import; files «Total…» i «Porcentaje…» no compten; sense data, l'última
    de l'Excel; sense IVA ni total, la mà d'obra 0 % i la resta 21 %. Cada despesa porta `importFull` (la pestanya). Grup **Altres**
    (`GRUPS_DESP878344`, Altres + Comissió) i files «Altres despeses» i «Comissions» al Rendiment. **L'Excel va a Documents › 99 · Altres**
    de cada obra on ha anat alguna fila (`persistImportedExcelDocument878245`, `folder:"99_ALTRES"`; prop `setObraData` d'`Albarans878259`,
    només obres pròpies). **Seleccionar** a la llista de despeses (`selMode878345`, `sel-barra-v878345`): totes, cap, tocar files, «Les d'un
    Excel…» (l'arxiu o cada pestanya), canviar el tipus, l'obra o la fase, repercutida, eliminar. Sense proveïdor, la fila diu el concepte.
    Amb l'Excel de l'Héctor, l'app dona el mateix benefici que el seu full (928,36 €). Estils: `src/theme-v878345.css`. Prova:
    `despeses345test.mjs` (28, amb un Excel inventat); adaptades `despeses344test`, `despesesrend338test` i `despesestest`.
  - **V87.346 · comissió amagada al pressupost** (l'Héctor, 22/10/2026: «un clic amb un espia per posar el %… és un tracte amb un tercer
    que no ha de saber mai el client final»): botó % amb un llum (`com-espia-v878346`, sense la paraula «comissió») a la capçalera del
    pressupost (no al portal de client ni en una obra compartida per un altre). Finestra: %, total sense comissió, amb comissió i la
    comissió. «Aplicar» puja totes les partides d'aquell pressupost (preu × (1 + %), arrodonit a cèntims) i en guarda l'original a la partida
    (`puOrig878346`, `com878346`); «Treure la comissió» torna exactament a l'original. Les partides noves d'un pressupost amb comissió també
    la porten. **Editar**: es treu mentre s'edita i es torna a aplicar en guardar o cancel·lar. A la **llibreria** (`savePartidaToLibrary87115`),
    a les partides habituals del client (`clientHabituals878280`) i a l'històric del client hi va el preu original. Els documents (PDF, Excel,
    certificacions) només veuen el preu amb la comissió. El % es recorda (`aco_comissio_pct_v878346`). Si l'agència cobra un % del total
    que paga el client, per quedar-se el mateix net cal posar-hi més (10 % → 11,11 %). Estils: `src/theme-v878346.css`. Prova:
    `comissio346test.mjs` (13).
  - **V87.347 · obres compartides, numeració pròpia i despeses més clares** (l'Héctor, 22/10/2026, amb Socoterm):
    - **Obra compartida que tornava** (2026-022 «ediifci CATALUNYA» és de l'Héctor, compartida amb Socoterm: «Eliminar» l'esborrava al
      navegador però tornava d'`aco_shared`). Ara una obra d'un altre compte no s'elimina: el ⋯ diu **«Treure de la meva llista»**
      (`deleteObra878112` → `aco_obres_amagades_v878347`, a l'espai del compte) i a sota de la llista «N obres compartides tretes de la
      llista · Tornar-les a mostrar». Només el propietari la pot eliminar.
    - **Client d'una obra compartida** (2026-017: la llista deia el promotor, Alberto; Dades deia «Socoterm», el client de l'Héctor, i el
      desplegable estava bloquejat): ara el client és el promotor fins que el compte en tria un de propi, que es desa a
      `aco_client_compartides_v878347` (no a l'obra de l'Héctor). `clientIdObra878347`, `nomClientObra878347` (llista, barra, Facturació,
      documents). En una obra compartida, triar client no toca el promotor (ni hi ha la casella «el mateix client»).
    - **Desplegable del client amb «Altres contactes»** (promotors i altres de Contactes que no són clients; clau estable `clauAg878347`): en
      desar, el contacte es fa client amb les seves dades.
    - **Numeració pròpia**: les obres compartides ja no compten per numerar ni es «reparen» (`assignMissingCodes8739` i
      `needsExpedientCodeRepair878191` se les salten: abans es podien renumerar i canviar el número de l'Héctor). Cada una rep un número
      propi del compte quan arriba (`aco_num_compartides_v878347`, `assignaNumComp878347`: quan el núvol ja s'ha posat al dia; si topa
      amb una obra pròpia es torna a donar) i el de qui la comparteix surt al costat: «2026-004 (Héctor Cubero 2026-017)»
      (`expPropietari878347`; llista i barra de l'obra).
    - **Facturat repetit al Rendiment** (Les Moreres: «sortia facturat prop de 6.400»: la factura feta a l'app + la de l'Excel): una
      factura importada amb la mateixa base que una de l'app no compta (`facturesObraValides878347`: rendiment de l'obra i de l'empresa,
      Facturació); en importar, una factura emesa amb la mateixa base (o número) que una de l'obra ja hi és; a Facturació, ⋯ › «Eliminar»
      d'una factura importada.
    - **Despeses**: a les constructores (perfil amb el mòdul Obra) ja no hi ha «Repercutida al client / Per repercutir» (`ambRep878347`);
      després d'una acció de la selecció, un avís diu on han anat (a una altra fase, a «Despeses de l'empresa», a una altra obra); dins de
      l'obra, la selecció no pot passar-les a «Despesa de l'empresa»; passar a una obra una despesa de l'empresa li torna el tipus de la
      seva pestanya; en importar, «Ja hi és · obra · tipus» diu on és.
    - Prova: `compartides347test.mjs` (28: obra pròpia esborrada que no torna en dos aparells, treure i tornar a mostrar la compartida,
      client propi sense tocar l'obra de l'Héctor, numeració pròpia, contacte que es fa client). Adaptades `constructor336test` i
      `despesesrend338test`.
  - **V87.348 · Despeses en columnes i per grups** (l'Héctor, 22/10/2026; als comptes d'empresa amb el mòdul Empresa —constructora i gestió total, `nova878348`—; el
    compte de l'Héctor i els tècnics, com abans):
    - **Per grups** (Materials · Mà d'obra · Industrials · Altres · Empresa), cada un amb el seu total (`llista878348` dins
      d'`Albarans878259`). Vistes **Tot · En execució · Per obra · Per any** (`vistaD878348`; per any: l'any i, a dins, les obres;
      paquets plegats llevat del primer any o si només n'hi ha un).
    - **Columnes**: Número · Data (de la factura) · Entrada (`dataEntrada`, nova: en importar, avui; en desar, si no en té, la de quan es
      va crear; `dataEntrada878348`) · Proveïdor · Base · IVA · Total, i l'ull per veure el document. **Factures de diverses línies**: les
      files amb el mateix número i proveïdor (d'un Excel) surten en una sola fila «N línies» i, en tocar-la, les línies; una despesa amb
      `linies` (llegida d'una foto) té la fletxa del desglossament.
    - **Mà d'obra per dies** (`dies`): el dia («N treballadors · X h», total) i a dins Treballador · Categoria · Hores · €/hora · Total,
      ordenats per categoria (`ordreCat878348`: encarregat, oficial 1a, oficial 2a, peó, aprenent). Camps nous a les despeses de mà d'obra:
      `treballador`, `categoria`, `hores`, `preuHora` (en importar; les d'abans es llegeixen de la nota, `maDe878348`). Editor de la mà
      d'obra: Treballador, Dia de feina, Categoria (`CATS_MA878348`), Hores i € per hora (la base es calcula, IVA 0), sense número.
    - **Document a la mateixa pantalla** (`VisorDespesa878348`): la foto o el PDF (amb «Obrir en una pestanya»).
    - **Filtres**: «Tots els proveïdors» ja no porta els treballadors (`provsF878348`); «Tots els treballadors» (`trebs878348`); cerca de
      material, concepte, número, proveïdor o obra (`cerca878348`). L'editor ja no ensenya «Repercutida al client» a les constructores.
    - Excel: data d'entrada, categoria i hores. Estils: `src/theme-v878348.css`. Prova: `despeses348test.mjs` (22).
  - **V87.349 · Partes d'obra** (decisions de l'Héctor del 22/10/2026 sobre `docs/proposta-parts-obra.md`: nom «Partes d'obra», a
    Seguiment, el fa l'encarregat o el cap; marcar «com està» i «què s'ha fet avui»; revisar, i amb «Està bé» directe a la propera
    certificació; la feina nova, «Fora de pressupost»). Pestanya `Partes obra` (obres amb Pressupost; mòdul Obra; també el perfil
    Treballador, sense preus) i «Parte d'avui» al ＋ del mòbil.
    - Dades a l'obra: `data.partes878349` (`{id, data, qui, nota, estat:"revisar"|"certificat", linies:[{pid, mode, val, mesures, feta}],
      noves:[…], cert:{[pressupost]:número}}`); `feta` = quantitat feta a origen després del parte. `pidsObra878349` (id de la partida o
      `codi:<pressupost>|<codi>` o la posició). Punt de partida (`previ878349`): el més gran entre els partes anteriors i el que ja estava
      certificat en certificacions que no ha fet cap parte (`baseCert878349`).
    - Editor (`ParteEditor878349`): dia, qui (els treballadors de l'empresa), nota, cercador; fases → capítols plegats («N de M fetes») →
      partides amb **Feta** i **Una part** (% fet amb 25/50/75 · Quantitat feta · Fet avui · Mesures amb `MedicioModal8780`), «Fet: 60 % (…) ·
      avui +…» i la barra. **Feina fora de pressupost** per capítol (`NovaFP878349`): què s'ha fet, quantitat i unitat; «Amb hores i
      material» (treballadors × hores × cost per hora i material: el cost); el preu per al client el posa l'oficina.
    - **«Està bé · a la propera certificació»** (`certificaParte878349`): les fora de pressupost passen al pressupost al seu capítol
      (`<cap>.FP<n>`, `tipus:"Fora de pressupost"`, `foraPressupost878349`, pu = preu / quantitat) i, per a cada pressupost (fase), la
      feina feta va a la certificació següent (`certsByNum[n]` = fet a origen − certificat abans); si l'última certificació la va fer un
      parte (`dePartes878349`) i no té factura, s'hi afegeix. «Desar» el deixa «Per revisar». Un parte certificat només es mira.
    - Llista: dia, qui, partides, import del dia (`importParte878349`), estat; a dalt, «Feina feta: X de Y» amb la barra.
    - **Despeses al mòbil** (l'Héctor: «apreto Altres i surten a baix»): en tocar un requadre o una vista, la pantalla baixa fins a la
      llista (`baixa878349`); els filtres, plegats darrere del botó «Filtres (n)».
    - Estils: `src/theme-v878349.css`.
  - **V87.350 · Partes més fàcils i tot plegat d'entrada** (l'Héctor, 22/10/2026: «ha de ser més pràctic i fàcil, sobretot al mòbil… les
    opcions han de ser clares… per defecte tot plegat… en tocar el dia, només el que hàgim fet»):
    - Llista **per mesos** (l'últim obert, «N per revisar»). Tocar un parte obre **el resum del dia** (`ParteResum878349`): només les
      partides marcades (per capítol, «+26 m2», l'import) i les fora de pressupost, «Total del dia», i els botons **Editar** i **Passar a la
      certificació · Ja està revisat** (Eliminar, petit). Un parte certificat: només «Tancar».
    - Editor: «+ Nota del dia» (plegada), filtre **Per fer** (de sèrie: sense les partides acabades) · **Marcades avui** · **Totes**;
      tocar la partida o «Una part» obre **una finestra amb dues preguntes** (`PartSheet878349`): «Com està ara?» (25 · 50 · 75 · 100 % o
      un altre %) i «O quant s'ha fet avui?» (amb «Amb línies de mesures…» i «Treure el que s'ha marcat avui»). «Feina fora de
      pressupost» a baix, demanant el capítol. Peu: «Avui: 3 partides · … €» i **Guardar · Per revisar** / **Passar a la certificació · Ja
      està revisat**; després de guardar o certificar, el resum del dia.
    - **Despeses: tot plegat d'entrada** (`grupsOberts878350`): cada grup és un botó; s'obre en tocar-lo o el seu requadre de dalt (o en
      buscar). Els dies de la mà d'obra i els anys, plegats.
    - Estils: `src/theme-v878350.css`. Prova: `partes350test.mjs` (30; substitueix `partes349test`). Adaptades `despeses348test` i
      `despeses345test` (obren els grups abans de mirar-los).
  - **V87.351 · La imatge de cada empresa** (l'Héctor, 22/10/2026): Ajustos › **«Imatge de l'empresa»** (`MarcaEmpresa878351`, no per al
    treballador): el logo (el de sempre, `client:empresa` d'`aco_logos_contactes_v878315`; ja no és a «Dades de l'empresa») i el **color**
    (paleta de 12 o «Un altre»; `aco_marca_v878351` = {color}, del compte). Amb logo, el menú diu el logo i el nom de l'empresa
    (`MarcaApp878351`) i la capçalera del mòbil, el logo en lloc de «CO» (`MarcaMobil878351`). El color: variables --co-accent i un
    `<style id="marca-v878351">` que `aplicaMarca878351` fa repassant tots els estils: **cada blau** (to 195-240°, amb prou color, i els
    blaus molt clars de `CLARS878351`) passa al to triat amb la mateixa claredat relativa (`blauAMarca878351`; #2563EB = el color exacte);
    els grisos blavosos i els colors dels estats (`NO_MARCA878351`) no es toquen. Documents: `marcaDoc878351` fa el mateix amb els colors
    de l'HTML (a `exactHtml878193` del `DocViewer`: pressupost, certificacions, proformes, factures). «Blau» torna a l'app de sempre.
    Estils: `src/theme-v878351.css`. Prova: `marca351test.mjs` (20).
  - **V87.352 · Partes amb hores i material, preus per hora de l'obra i partes que es tornen a editar** (l'Héctor, 22/10/2026: «he de
    poder modificar un parte… quan ho vulgui emplenar per hores de treballador i el material… hauria d'anar directe a despesa de mà d'obra
    d'aquella obra pel cost/h de l'empresa… i si s'emplena una fora de pressupost el cost hora és un altre, facturat, als ajustos de l'obra:
    un oficial ens pot costar 22 €/h però a facturar a 30»):
    - L'editor del parte té **Feina · Hores · Material** (`pe-secs-v878352`). Hores: una fila per treballador actiu (la categoria és el seu
      `ofici`) i «Una altra persona» (nom i categoria); a l'obra `parte.hores = [{id, treballadorId, nom, categoria, hores}]`. Material:
      `parte.material = [{id, concepte, q, ut, proveidor, import}]`.
    - En desar (i en certificar), les hores i el material, també els de la feina fora de pressupost, van a **Despeses de l'obra**
      (`sincronitzaDespesesParte878352`, `despesesParte878352`): mà d'obra (`MaObra`, hores × `costHoraA878340`: el de l'obra, si no
      el del treballador) i material (21 % d'IVA; sense import, `perRevisar`). Porten `parteId878352` i es refan a cada desat; eliminar
      el parte les treu. Sense cost/hora, `perRevisar`. No a les obres compartides per un altre compte.
    - **Preus per hora de l'obra** (botó a Partes d'obra, `PreusObra878352`): per categoria, «Ens costa» (mitjana del cost/hora dels
      treballadors) i «A facturar» (`data.preusVenda878352 = {cats, pctMat}`), i el % sobre el material. La feina fora de pressupost amb hores
      calcula sola el preu per al client (`preuFP878352`: hores × preu a facturar + material × (1 + %); `preuEf878352` = el preu escrit o
      aquest); si falta el preu d'una categoria, ho diu amb «Posar-lo».
    - **Editar un parte certificat** mentre la certificació no té factura (`parteBloquejat878352`): «Guardar canvis · I posar al dia la
      certificació». `certificaParte878349` reutilitza la certificació del parte (`part.cert`) i calcula cada certificació amb l'estat
      de l'obra a l'últim parte que hi va (així, editar-ne un d'abans no treu els d'després); les feines fora de pressupost ja creades es
      posen al dia (preu, quantitat) i les que es treuen surten del pressupost.
    - Resum del dia: «Feina feta del dia» (va a la certificació) i, a part, Hores, Material i «Cost del dia (a Despeses)».
    - Estils: `src/theme-v878352.css` (també els botons de text dels partes sense la vora del navegador). Prova: `partes352test.mjs` (24);
      adaptada `partes350test`.
  - **Auditoria de facilitat** (23/10/2026, `docs/auditoria-facilitat.md`; eina `tools/proves/auditoriaux.mjs`: 134 pantalles dels tres
    comptes de prova, ordinador i mòbil; botons, camps, lletra, textos repetits i explicacions; captures a `D:\aco-tmp\auditoriaux`).
    L'Héctor: «fes informe i fes versions del que ens falta durant la nit».
  - **V87.353 · primera neteja:** fora les frases que expliquen (Inici, Agenda, Preus, Ajustos › Idioma, Honoraris); el títol de Preus es
    llegeix (blanc sobre la franja fosca); marges a «Imatge de l'empresa» i «Enllaços de les obres»; «Afegir treballadors» a Hores ›
    Personal i Obra › Hores quan no n'hi ha (`anarTreballadors878353`: event `aco-nav` que escolta l'App, i Empresa s'obre a
    Treballadors amb `window.__acoEmpresaVista878353`); l'adreça de l'empresa en una línia; sense « · fitxa» a Dades. Estils
    `src/theme-v878353.css`. Prova: `neteja353test.mjs` (14).
  - **V87.354 · simplificacions:** Inici: la tasca vençuda només al requadre (a dalt, les cites). Resum de l'obra: sense foto, només el botó
    (`sense-foto-v878354`), fora «El mateix client» i el «0 € de …». Dades sense «Estat de l'expedient» (és a la barra). Certificacions sense
    cap: fora la «Certificació 1» buida (`cert-buida-v878354`). Documents: títol «Documents», la carpeta triada i les que tenen documents a la
    vista i la resta a «Altres carpetes (N)» (sense descripcions; la descripció és el `title`). Preus: un sol lloc per crear (a dalt), sense
    requadres a 0 ni «Com funciona?». Honoraris: «Calcular honoraris» només a la pestanya; el rendiment de l'encàrrec plegat
    (`rend-plegat-v878354`). **Ajustos en 4 grups** (`ajustos-grup-v878354`): La meva empresa · Idioma i enllaços · Usuaris i contrasenyes
    (oberts) · Còpies i núvol (plegat; «Supabase Storage» només al compte de l'Héctor). La demostració de VeriFactu passa de Facturació a
    Ajustos › Factures amb VERI*FACTU. Estils `src/theme-v878354.css`. Prova: `simple354test.mjs` (14). Adaptades `fitxestest`,
    `fitxa319test`, `graficatest`, `verifactudemotest` i `alhoratest`. **No fet:** amagar la barra de Fases amb una sola fase (és on es crea
    una fase nova) i deixar un sol número de versió (el de la cantonada serveix per saber si s'ha actualitzat).
  - **V87.355 · les hores del personal en un sol lloc:** les noves (Hores › Personal i Obra › Hores) es desen com a despeses de mà d'obra
    (`MaObra`, `deHores878355`, `treballadorId`; `despesaHores878355`), on ja van les del parte (que ara porten `treballadorId`). Les
    pantalles d'hores ensenyen totes (`horesDespeses878355`): les del parte, de consulta («Parte»). Les d'abans
    (`aco_personal_v878340_<obra>`) es continuen veient i comptant i, en tornar a desar aquell dia a Hores › Personal, passen a Despeses.
    Canviar el €/h d'un treballador a l'obra torna a calcular les seves hores (`recalculaCostHores878355`). Rendiment: «personal: N h»
    compta també les hores de la mà d'obra de Despeses. Prova: `horesunic355test.mjs`; adaptada `personal340test`.
  - **V87.356 · foto de la façana del Cadastre** (`fotoCadastre878356`): al Resum, sense foto i amb la referència cadastral (Dades ›
    Obra, `obra.rc`), «Foto del Cadastre» la baixa del servei públic `OVCFotoFachada` i la posa com a foto de l'obra; si no n'hi ha, ho diu.
  - **V87.357 · Fitxatge dels treballadors** (registre de jornada, **fase 1**: tot al compte de l'empresa, sense res nou al servidor):
    - **PIN** a la fitxa del treballador (Empresa › Treballadors, `EditorTreballador878339`): es desa xifrat (`pinHash878357`, `hashPin878357`:
      `sha:` amb SHA-256 o `sum:` si el navegador no en té; `verificaPin878357`). Mai es desa el PIN tal qual.
    - **Hores › Fitxatge** (`HoresEmpresa878340`: Personal · Fitxatge · Les meves hores; constructora sense «Les meves hores»,
      `senseMeves`). «Fitxar» (`FitxarKiosk878357`): el treballador es tria, posa el PIN i marca Entrada · Pausa · Tornar de la pausa ·
      Sortida; veu els seus fitxatges del mes.
    - Dades per mes: `aco_fitxatge_v878357_<AAAA-MM>` = `[{id, wid, nom, tipus, dia, hora, at, via, creat, anulat?, correccio?}]`.
    - **Registre** (`RegistreFitx878357`): per dies i per mesos; corregir (`CorregirFitx878357`) **no esborra mai**: anul·la (`anulat`
      amb el motiu) o afegeix un fitxatge (`correccio` amb el motiu). Excel i «per imprimir i signar» (`printHtmlInPlace878112`).
    - El part d'hores (`PartHores878340`) diu «Fitxat: X h» de cada treballador.
    - **Fase 2 pendent (cal el sí de l'Héctor i el servidor):** que cada treballador fitxi des del seu mòbil amb el seu compte.
    - Estils: `src/theme-v878357.css`. Prova: `fitxatge357test.mjs` (19). Adaptada `personal340test`.
  - **V87.358 · Importar obres i factures d'anys anteriors** (perquè l'empresa nova no comenci buida): a la llista d'obres, botó
    **«Importar»** al costat de «Nova obra» (`imp-obres-btn-v878358`, només qui administra; event `aco-importar-obres`).
    - Lector (`llegirExcelObres878358`, `COLS_OBRA878358`, `COLS_FACT878358`, `colsDe878358`): totes les pestanyes; una pestanya és
      d'obres si té la columna del nom de l'obra, i de factures si té la base o el total. Títols en català o castellà (any, núm., obra,
      client, adreça, població, tipus, estat, import, data · nº factura, fecha, cliente, obra, concepte, base, IVA, total). Les files
      «Total…» no compten. L'estat es tradueix (`estatDe878358`: «Acabada» → Tancat…).
    - Finestra (`ImportarObres878358`): l'arxiu, «Obres · N» amb «Estat de les que no en diuen» (de sèrie **Tancat**) i «Factures · N»,
      amb caselles. Les obres que ja hi són (mateix nom i any) i les factures amb un número que ja hi és surten «Ja hi és» i desmarcades.
    - En importar (`importaObresAnteriors878358` de l'App): clients nous pel nom (es reaprofiten els que ja hi són); cada obra amb el
      número del full si és lliure (si no, el següent de l'any), el tipus de la constructora (`TIPUS_CONSTR878344`) o el de sèrie,
      `importat878358` = l'arxiu. Les factures van a `facturesObra878297` de la seva obra (pel nom o el codi) amb `importada:true` i
      `cobrada:true`; sense obra, a una obra «Factures <any> · <client>» (Tancat). Una factura amb el mateix número a la mateixa obra
      no es torna a posar.
    - Estils: `src/theme-v878358.css`. Prova: `importobres358test.mjs` (18, amb un Excel inventat; ordinador i mòbil).
  - **V87.359 · Partes: despeses a les obres compartides, esborrar la certificació i treure un parte** (l'Héctor, 23/10/2026, provant-ho
    amb un client: «al emplenar el parte… hauria de sortir a despeses dins de mà d'obra i no ho fa»; «quan l'he volgut esborrar la
    certificació ho he de fer manual posant a 0 i després el parte… no es pot esborrar o modificar»; «al mòbil no surt el gràfic»):
    - **Despeses:** la V87.352 no feia les despeses del parte a les obres compartides (`!obra.compartida`), i les obres de Brava i de
      Socoterm són compartides per l'Héctor. Ara sí (`fanDespeses878359`: obra pròpia, o compartida amb el compte que porta l'obra —mòdul
      Obra o Empresa—), al compte de qui desa el parte. Els partes d'abans d'una obra compartida fan les seves despeses en obrir Partes
      d'obra, un sol cop per parte i compte (`aco_partes_despeses_v878359`; si després se n'esborren, no es tornen a fer).
    - **Esborrar una certificació** (`treuCert878359`, a les tres maneres: `deleteCertificacio8721`, `scopedDeleteCert`,
      `deleteDirectCert878214`): també en treu les quantitats de les partides d'aquell pressupost (`buidaNumCert878359`: `certsByNum`,
      `certAmountsByNum`, `certMesuresByNum`, `certAdmin…ByNum`, `certHiddenByNum`, `cert_<n>`; abans es quedaven i sortien a la
      certificació nova amb el mateix número), i els partes que hi anaven tornen a «Per revisar» (`parteARevisar878359`; les partides fora
      de pressupost que havien posat surten del pressupost, `treuFP878359`). La pregunta diu quants partes tornaran a revisar.
    - **Parte certificat** (si la certificació no té factura): «Editar», **«Treure de la certificació»** i **«Eliminar»**
      (`desfesParte878359`): la certificació es torna a calcular amb els altres partes que hi van (`certificaParte878349` de l'últim) o
      s'esborra si només era d'aquell. Eliminar-lo també en treu les despeses.
    - **Gràfiques** (`LiniesChart878343`, `IngressosChart878292`): el SVG porta `width`/`height` i `aspect-ratio` (a l'iPhone, Safari no
      sempre en calcula l'alçada amb `height:auto`). A l'Edge del mòbil ja sortia: si a l'iPhone continua sense sortir, cal una captura.
    - Estils: `src/theme-v878359.css`. Prova: `partes359test.mjs` (20, amb una obra compartida «de l'Héctor» al núvol de proves). Adaptada
      `partes352test`.
  - **Tanda 6** (l'Héctor, 23/10/2026 al migdia; llista a `docs/revisio-modul-constructor.md`).
  - **V87.360 · avisos, ordre dels llistats i número de versió:**
    - **Número de versió** només a la cantonada (fora del menú, `nav-version-v878264`, i d'Ajustos, `config-version-v878264`).
    - **Ordre d'entrada:** Facturació de l'empresa, l'última factura a dalt (per data i número; l'Excel continua en ordre numèric);
      Despeses per data d'entrada (`dataEntrada878348`), l'última a dalt. Les obres ja anaven per número (el propi a les compartides).
    - **Obres compartides:** a la columna «Núm. client», el número de qui la comparteix i el seu nom (`ref-prop-v878360`); ja no es
      repeteix sota el número propi (a les targetes del mòbil, sí). `codiCurtBase878347` tenia l'expressió sense barres (`/^d{4}-…/`).
    - **Avisos** (`AvisosInici878360` a l'Inici, a dalt de la columna principal; `AvisosObra878360` al Resum de l'obra): per obra,
      partes per revisar, despeses per revisar (`perRevisar`) i, a partir del dia 25, «Toca la certificació de {mes}» (obres en curs
      amb pressupost que ja tenen certificacions o partes i cap certificació aquest mes; mòdul Obra); als comptes amb el mòdul Empresa,
      els documents de l'empresa, dels treballadors i dels industrials caducats (vermell) o que caduquen d'aquí a 30 dies (taronja). En
      tocar-ne un, l'obra a l'apartat o Empresa a la vista dels documents. `window.__acoAra878360` fixa el dia a les proves.
    - Estils: `src/theme-v878360.css`. Prova: `avisos360test.mjs` (16). Adaptades `facturacio337test` (ordre i la factura que es marca
      com a cobrada), `compartides347test`, `mobiltest` (versió) i `constructor336test` (la «Foto del Cadastre» de la V87.356 no és
      l'enllaç del Cadastre).
  - **V87.361 · Afegir de la llibreria i la partida sencera:**
    - **«Afegir de la llibreria»** (`AfegirLlibreria878361`, `afegeixLlibreria878361`; el portal de client continua amb la finestra
      d'abans): abans s'obria als «Habituals del client» (sovint 0, amb un text que deia d'anar a l'altra pestanya), les partides anaven al
      primer capítol i el pressupost quedava en edició (si no es premia «Guardar canvis», es perdien). Ara una sola llista amb el cercador i
      els capítols de Preus (els habituals del client primer, «Habitual»; «Ja hi és» si ja és al pressupost); cada partida triada amb la
      quantitat i el capítol (el del mateix nom, `nomSenseNum878361`, o «Capítol nou: …», que es crea amb el número següent,
      `nouCap878361`); «Afegir N partides» les desa al moment (`persistBudgetCaps878179`) si no s'està editant.
    - **Fitxa de la partida** (`FitxaPartida878361`, en lloc de `PartidaReadingModal87208`): s'obre tocant la partida (el concepte a
      l'ordinador, la fila al mòbil) fora d'edició. Codi, quantitat, preu, import, descripció i «Com es fa el preu» amb les parts del
      descompost (`partsPartida878361`: mà d'obra —hores—, materials, maquinària i altres, industrials; CI, DGE, BI; preu unitari; avís si
      el preu de la partida no és el del descompost). Cada part es desplega amb les seves línies.
    - **Descompost senzill** (`DescompostSenzill878361`, `taulaSenzilla878361`): sense descompost, «Fer un descompost senzill» (posa el
      pressupost en edició): mà d'obra, material i altres per unitat i CI, DGE i BI % (de sèrie els de l'obra o de l'empresa,
      `defectesPreu878361`) → el preu, desat com un descompost de sempre (`descompostTable`). Els % s'apliquen en cadena
      (`recalculateBreakdownTableV87232`).
    - Estils: `src/theme-v878361.css`. Prova: `pressupost361test.mjs` (19). Adaptada `habitualstest`. **Proves antigues que fallen
      també amb la V87.360** (no les ha trencat aquesta versió): `menustest` (el menú «PDF» de Certificacions a ediifci CATALUNYA queda
      escurçat a 160 px) i `pdfpressuposttest` (busca la tira de pressupostos, que des de la V87.342 és la barra de fases).
  - **V87.362 · Resum del pressupost i Planning en taula al mòbil:**
    - **Resum del pressupost** (`ResumPressupost878362`, `resumPressupost878362`; plegat a sobre dels avisos, fora d'edició i no al
      portal): amb els descompostos (× la quantitat), mà d'obra (i les hores), materials, maquinària i altres, industrials, els % (CI, DGE,
      BI), «Sense descompost» i «Altres diferències de preu», cada un amb l'import i el %, i una barra de colors (`COLORS_RESUM878362`). A
      dins, els materials sumats (concepte, quantitat, import) i la mà d'obra per categories. Només surt si alguna partida té descompost.
    - **Planning al mòbil en taula** (`GanttObraVisual878253`, `vista878362`): «Taula · Gràfic» (es recorda a l'aparell,
      `aco_gantt_vista_v878362`; de sèrie taula si la pantalla fa ≤700 px). Cada capítol: pressupost i %, inici, final, dies, «Després de
      «…»» amb els dies de més o de menys i qui hi treballa; tocar-lo obre la finestra del capítol (`EditaCapitol878341`). A la taula no hi ha
      l'escala ni «Pantalla completa».
    - Estils: `src/theme-v878362.css`. Prova: `resum362test.mjs` (12). Adaptades `planning341test` i `seguiment321test` (al mòbil, la taula
      i després «Gràfic») i `fases342test` (Hores té pestanyes des del fitxatge). `seguiment321test` pot fallar a l'ordinador si l'app torna
      a l'Inici en posar-se al dia: tornar-la a passar.
  - **V87.363 · Dades de l'obra a la constructora** (l'Héctor, 23/10/2026: «en contractista no sé si calen entrar tantes dades; el que
    s'ha d'emplenar són pestanyes principals i la que apreto es desplega allò, i no haver de fer scroll interminable»):
    - **Al mòbil** (≤700 px, `useMobil878363`), Dades de l'obra (`FitxaDadesTab8769`) ja no té pestanyes: cada apartat (Obra, Client,
      Promotor…) és un botó que es desplega a sota (`dades-acc-v878363`, `acc878363`), un alhora, i en obrir-lo la pàgina hi va. El
      contingut és el mateix de les pestanyes (`cos878363`); a l'ordinador i l'iPad, les pestanyes com sempre.
    - **Constructora** (`constructoraPropia878363`: compte d'empresa sense el mòdul tècnic): sense l'apartat «Constructora» (és ella
      mateixa); a «Obra», el núm. del client, la referència cadastral, l'idioma dels documents, la definició, les observacions i el codi de
      carpeta van a «Més dades» (plegat). La gestió total i l'Héctor, com abans.
    - **Obra nova** (`QuickExpedientForm878254`): el títol diu «Nova obra» o «Nou expedient» segons el perfil, «Crear i obrir l'obra», fora el
      text «La resta (tècnics, constructors…)…» i, a la constructora, sense el camp «Constructora».
    - Estils: `src/theme-v878363.css`. Prova: `dades363test.mjs` (13).
  - **Tanda 7** (l'Héctor, 23/10/2026 al vespre, amb el compte de Socoterm i l'obra «CP EDEN PLAYA»; llista a
    `docs/revisio-modul-constructor.md`; termini: tot tancat i provat el 30/10/2026).
  - **V87.364 · Certificacions:**
    - **Error d'Eden Playa:** el parte va posar 0,25 de la 01.01 a la certificació 1 (4.487,50 €) i es va fer la factura F2026-056; després,
      el Σ de la casella en mode consulta obria l'edició (sense mirar la factura) i, en desar les línies buides, la partida va quedar a 0.
      La llista, el resum i la factura continuaven amb 4.487,50 € perquè feien servir l'import desat (`c.import`) quan les partides
      sumaven 0. Ara l'import surt sempre de les partides (`importCert878364`, `teQuantCert878364`): l'import desat només val si cap
      partida té quantitat d'aquella certificació (les importades d'un Excel només amb l'import). També a la barra de fases
      (`certRecordTotal8791`), les proformes (`proformesObra878337`), el document generat i la normalització de l'obra.
    - **Certificació amb factura = tancada** (`bloq878364`): sense «Editar», ni Σ, ni «Afegir feina», ni mesures o administració des de la
      fitxa de la partida, i la data no es pot canviar; la barra diu «Facturada». Si la factura no coincideix amb la certificació, el
      número surt en vermell (`mal`).
    - **Llista** (`cert-taula-v878364`): Certificació · Data · Import · **Factura** (número o «Pendent», si el compte fa factures) · «⋯»
      per fila (Fer factura, Veure la factura, Eliminar). Fora el «Més» (només hi havia «Importar Excel»).
    - **Barra** (`cert-barra-v878364`): Resum · Partides (abans un desplegable «Vista»), «Editar» i un sol desplegable **«Accions»** amb
      icona i paraula (PDF de la certificació, PDF a origen, administració, Enviar, Fer factura / Veure la factura, Afegir feina, partides
      retirades, Importar Excel). Fora el text «Editant la Certificació… Introdueix les quantitats…».
    - **Quantitat**: en consulta, cada quantitat és una casella (`cert-q-v878364`); tocar-la obre l'edició amb el cursor a la mateixa
      partida (`focus878364`, `data-codi`); el Σ només surt editant.
    - **Resum** (`CertResumV69`): les columnes de xifres de mida fixa (abans s'eixamplaven fins a tota la pantalla).
    - `ActionMenu87213` admet `fletxa={false}`, `className` i `titol`. `cloudSync.js`: els mòbils Android ja no es diuen «Linux».
    - **Menús desplegables a baix de la pantalla** (l'efecte de l'App de la V87.303): si a sota no hi caben sencers i a sobre hi ha més
      lloc, s'obren cap amunt (abans s'escurçaven fins a 160 px; `menustest` fallava des de la V87.360 amb «PDF» de les certificacions).
    - Estils: `src/theme-v878364.css`. Prova: `cert364test.mjs` (22, amb el cas d'Eden Playa). Adaptades `facturacio337test`,
      `partes352test`, `clientsvirtuals`, `pressuposttest` i `menustest`.
  - **V87.365 · Documents i Partes amb els grups a la vista, la gràfica del Rendiment i fora «Hores» de l'obra (constructora):**
    - **Documents** (`Documents`, `docs-md-v878365`): totes les carpetes en una columna (amb el número de documents; les buides més
      clares) i la triada al costat; al mòbil, la llista i, en tocar-ne una, els documents al seu lloc amb «‹ Carpetes» (`obert878365`).
      Fora «Altres carpetes» (V87.354) i els textos dels documents generats («generat automàticament…», «Obre el document amb el mateix
      format…»). Botons «Adjuntar» i «Enviar».
    - **Partes** (`ParteEditor878349`, `pe-md-v878365`): els capítols en una columna i les partides del triat al costat (a l'ordinador, el
      primer de sèrie); al mòbil, els capítols i, en tocar-ne un, les seves partides al seu lloc amb «‹ Capítols» (`capSel878365`).
      Buscant o amb «Marcades avui», com abans: tots els capítols oberts. «Feina fora de pressupost» obre el seu capítol.
    - **Rendiment de l'obra** (`EvolucioObra878366`, sota el compte): «Evolució de l'obra», acumulat mes a mes (com a molt 24 mesos):
      ingressos (certificat), costos (despeses, personal i DGE) i benefici, amb `LiniesChart878343` i `dadesRendEmpresa878343`.
    - **Constructora** (sense el mòdul tècnic, amb Empresa; no el treballador): dins de l'obra ja no hi ha «Hores» (àlies «Gestió temps» →
      «Albarans»: les hores són a Despeses › Mà d'obra) i el ＋ ja no té «Hores». La gestió total el conserva.
      El que hi havia (el cost per hora de cada treballador en aquesta obra, per dies i «+ Afegir hores», `PersonalObra878340`) és a dalt de
      Despeses de l'obra, plegat: «Hores del personal» (`pers-obra-plegat-v878365`).
    - **Icona i paraula** (opció B, triada per l'Héctor el 23/10/2026) a la capçalera del pressupost: ✎ Editar, 🖨 PDF, ✉ Enviar, ＋ Afegir.
    - **Revisió de les dades del núvol** (`tools/proves/revisionuvol.mjs`, només llegeix la còpia més nova de `DADES/COPIES_NUVOL`): import de cada
      certificació vs partides, factura vs certificació, partes certificats sense certificació, partides per sobre del 100 % i despeses
      d'obres que ja no hi són. L'informe (`tools/proves/revisionuvol-AAAA-MM-DD.txt`) porta noms de clients. El 23/10/2026: Eden Playa
      (Socoterm, 2 avisos), i al compte de l'Héctor 47 partides per sobre del 100 % i la certificació 1 de Cala Rovira amb l'import desat vell.
    - Estils: `src/theme-v878365.css`. Prova: `v365test.mjs` (20). Adaptades `personal340test`, `horesunic355test` i `fases342test` (Despeses › Hores del personal), `partes350test` (el primer capítol obert al costat),
      `simple354test` (sense «Altres carpetes»), `docmobiltest` i `documentstest` (el PDF a origen és dins d'«Accions»).
  - **V87.366 · Mòbil i iPad «tot recollit»** (l'Héctor, 23/10/2026 a la nit, amb captures de l'iPhone: «tot recollit i després es
    despleguen… genèric a tota l'app, que estic fart de dir-t'ho, com a mínim al mòbil i l'iPad»). Eina nova `tools/proves/llargues366.mjs`:
    mesura l'alçada de cada pantalla al mòbil (demo-constructor i demo-tecnic) i en fa captura de les de més de 2,2 pantalles.
    - **iPhone:** `html{-webkit-text-size-adjust:100%}` (el Safari engrandia sol la lletra dels blocs amples: els capítols 01-02 sortien més
      grossos que els 03-04); el «⋯» de les fases per sobre del pressupost (`.fases-v878342:has(details[open])`, capa 300).
    - **Pressupost:** «Editar» i un sol desplegable **«Accions»** (PDF del pressupost, Enviar, afegir, compartir, eines, aquest pressupost);
      editant, «Guardar canvis», «Cancel·lar» i «Afegir» (`pres-accions-v878366`).
    - **Certificació › Partides al mòbil:** una fitxa per partida (pressupost, aquesta certificació amb la casella, a origen; `data-l` a les
      cel·les i `grid-template-areas`), els capítols plegats d'entrada (`mobil878366`) i el total en tres línies.
    - **Rendiment › Per capítols al mòbil:** una línia per capítol (certificat i %, `m-res-v878366`); en tocar-la, les xifres i les partides.
    - **Ajustos:** cada apartat és una línia plegada (`ajustos-bloc-v878366`; Imatge de l'empresa, Dades de l'empresa, Perfil i mòduls,
      Factures amb VERI*FACTU, Idioma, Enllaços de les obres, Accessos ràpids, Usuaris i contrasenyes, Còpies i núvol) i se n'obre un alhora. Els altres es tanquen només quan es toca un títol
      (clic al `summary`), no quan s'obre un bloc per codi, i el títol tocat no es mou de la pantalla (`ajRef878366`).
    - **Versió al menú** (l'Héctor, 24/10/2026: «en el mòbil ja ni surt; abans sortia en el menú principal a sota i ja estava bé»): torna
      el `nav-version-v878264` a baix del menú (la V87.360 l'havia tret; la cantonada no es veu al mòbil).
    - **Accessos ràpids** (Ajustos, `AccessosRapids878366`): la barra de baix (fins a 4 de les opcions del menú, `opcionsBarra878366`; «Més»
      sempre) i el ＋ de l'obra (Foto, Nota, Acta, Parte d'avui, Hores i, noves, Despesa i Cita). Es desa al compte (`aco_barra_v878366`,
      `aco_mes_v878366`, event `aco-accessos-changed`); sense triar-ne, les de sempre (`barraDefecte878366`, `MES_DEFECTE878366`).
    - **Plegat:** Agenda de l'obra (el formulari només amb «+ Nova cita» o en tocar una cita), feines pendents de l'obra al mòbil (una línia
      amb el text i l'estat, «✎» per a la resta), Inici (les 5 primeres feines i «Veure-les totes»; al mòbil, sense el desplegable de cada
      targeta), Facturació del tècnic (filtres, «Gràfics» i «Ingressos i informes»), Honoraris (el resum i el comptador; el comptador obert
      si corre) i «Enllaços del tràmit».
    - **Proves:** l'ajuda `__click` (a `alhoratest.mjs`, la fan servir totes) obre els blocs plegats si el que busca hi és a dins.
      Prova nova: `v366test.mjs` (29).
  - **V87.367 · Icona i paraula a la resta de pantalles** (opció B de l'Héctor):
    - **Despeses** (`Albarans878259`): «Fer foto» i «Adjuntar» a la vista (amb icona) i un sol «Accions» (`accions-v878367`: Entrar a mà,
      Importar Excel, Exportar Excel); el tècnic, «＋ Nova despesa». Facturació: «PDF» i «Exportar Excel» amb icona. Resum del parte:
      «✎ Editar» i «✓✓ Passar a la certificació». A la barra de l'obra, la constructora diu «Eliminar l'obra».
    - Proves adaptades: `perfils326test`, `despeses329test`, `clientsvirtuals` (obre «Accions» abans d'«Entrar a mà»).
  - **V87.366 · proves**: adaptades als menús i blocs plegats `facturacio337test`, `graficatest`, `marca351test` (no mira els botons dels
    blocs tancats: Chrome en dona l'estil vell), `menustest`, `navtest`, `pdfpressuposttest` (la tira és la barra de fases), `pressupost320test`,
    `pressuposttest` (al mòbil, «Esta certificación» és l'etiqueta `data-l` de la fitxa), `simple354test`, `tempstest`, `traducciotest`,
    `verifactudemotest`, `vfemetretest`, `mobiltest` i `avisos360test` (la versió torna al menú). **`sessiotest` (cas 2) falla de vegades**
    (també el 20/10 amb la V87.310): les dues pestanyes renoven el permís, però cap fa servir un permís vell (`reuse: 0`) ni cal tornar a
    entrar; no és dels canvis d'aquests dies. Guió `D:\aco-tmp\repassa.sh` (torna a passar una llista de proves) i `D:\aco-tmp\versio.sh A B`
    (canvia el número de versió a tots els llocs).
  - **V87.368 · Pressupost automàtic a partir dels amidaments** (l'Héctor, 24/10/2026 a la nit: «fer-ho automàticament amb IA un cop
    entrats els amidaments en Excel o BC3 —el PDF si no hi ha més remei, revisant-lo bé—; els preus de la construcció de Girona; si una
    partida no la sap interpretar, que la IA busqui el preu amb el descompost en el format del BC3; tenir en compte l'adreça, els accessos,
    els permisos i la logística; i després els plànols»). Detall per a l'Héctor a `docs/pressupost-ia.md`.
    - **Funcions pures** a `src/preusAuto.js` (prova sense navegador `preusautounit.mjs`, 22): `llegirBancBc3` (un banc de preus BC3 amb el
      descompost: tipus 1 MO, 2 maquinària, 3 material, «%» percentatges; el preu del ~C mana), `taulaDescomp` (al format `descompostTable`
      de l'app; la diferència fins al preu del banc, una línia en %), `fesIndex`/`buscaPreu` (pel codi o per una partida semblant amb la
      mateixa unitat: mots sense accents, plurals i el final; nota «Semblant (NN %)»), `partidesLogistica` (capítol «00 Implantació,
      logística i permisos»: contenidors segons la runa dels enderrocs i excavacions × 1,3, permís de via pública, tall de carrer,
      llicència o comunicació prèvia, muntacàrregues o grua, pujada a planta sense ascensor, transport intern, habitatge ocupat, horari,
      neteja), `pctAcces` (+% de mà d'obra per l'accés), `resumCondicions`, `promptPreusIa` (respondre NOMÉS en BC3) i `respostaIa`.
    - **Banc de preus** (`BancPreus878368`, clau `aco_banc_preus_v878368`, fins a 12 MB): a Preus (a dalt) i als Amidaments.
    - **Amidaments** (`Amidaments878328`): en llegir l'arxiu, els preus es posen sols (`preusAmidaments878368`): arxiu (un BC3 porta
      també el descompost de cada partida) → Preus pel codi → banc pel codi → Preus semblant (0,6) → banc semblant (0,5). Cada línia:
      `font878368` (arxiu, llibreria, banc, ia, ma), `semblant878368`, `nota878368`, `descomp878368` / `taula878368`, `confirmar878368`.
      Dues línies plegades: **Preus** (xips Arxiu · Preus · Banc · IA · A mà · Semblants · Sense preu; banc, «Buscar preus», «Preus amb
      IA») i **Obra i logística** (`Logistica878368`, `data.condicions878368`, amb «Veure el lloc» a Google Maps i «Afegir les partides
      de logística»). Oberta, cada línia diu d'on surt el preu, el descompost i «Preu a mà» (0 el treu).
    - **Preus amb IA** (`PreusIa878368`): les sense preu (i, si es vol, les semblants), l'adreça i les condicions. Amb la funció del servidor
      `pressupost-ia` (`supabase/functions/pressupost-ia/index.ts`, **escrita però no instal·lada**: cal la clau d'Anthropic, de pagament,
      i el sí de l'Héctor; Opus 5.5, cerca a internet, de 25 en 25 partides, fins a 4 plànols) o, si no existeix (404 →
      `__acoIaPressupostOff878368`), «Copiar i obrir Claude / ChatGPT» i enganxar la resposta.
    - **Passar-ho a pressupost**: cada partida porta `descompostTable` i `origenPreu878368` (es veu a la fitxa de la partida: «Preu: Banc ·
      E2225223 · …»); amb +% d'accés (casella), la mà d'obra del descompost rendeix menys i el preu es torna a calcular.
    - Estils: `src/theme-v878368.css`. Prova: `pressupost368test.mjs` (28). El Supabase de proves té `/functions/v1/pressupost-ia` (10 € per
      partida) i `GET /__ia` (comptador i última petició).
  - **V87.369 · Mòbil «tot recollit», segona volta** (`tools/proves/llargues366.mjs` després de la 368: Inici del tècnic 2,9 pantalles,
    de la constructora 2,5, Rendiment de l'obra 2,4, Facturació del tècnic 2,4):
    - **`CardOPlega878369`** (al costat de `Card`): al mòbil (≤700 px, `useMobil878363`) la targeta és un `details` plegat amb el títol,
      un resum (quants i el primer) i, a dins, l'acció i el contingut; a l'ordinador, la `Card` de sempre. A l'Inici: Pròximes cites
      («3 · Visita… · 25/10/2026»), Feines pendents («7 feines · 1 vençuda», `nVenc878369`; s'obre sola si s'està afegint una tasca),
      Encàrrecs tècnics («Falten documents 4») i Obres en curs; al Rendiment de l'obra, «Evolució de l'obra» (ingressos i costos).
    - «1 tasca/ques» → «1 feina» / «N feines». «Veure-les totes» com un enllaç (abans, el botó gris del navegador).
    - **Facturació del tècnic** (`FacturesGeneral8738`, `HoursToInvoice878256`): «Pendent de facturar» al mòbil diu el total i «Veure-ho
      (N)» (la llista es desplega); el resum de les factures (xifres, estats i les vençudes) va a `details.resum-fact-v878369` («Resum · 2
      factures · total · ⚠ 2 vençudes»), plegat al mòbil i obert a l'ordinador; les factures emeses, en fitxes al mòbil (número · data ·
      total / expedient / estat · accions), sense el codi llarg.
    - Resultat: Inici 1,1 pantalles, Facturació 1,3. Estils: `src/theme-v878369.css`. Prova: `v369test.mjs` (17).
  - **V87.370 · Honoraris de l'expedient més curts al mòbil:** el comptador de temps, plegat sempre (dins de l'obra sempre corre: el
    temps ja es veu a la bombolla de baix; abans s'obria sol i ocupava mitja pantalla); fora el text «Obrir només quan cal introduir
    hores/despeses a mà»; sense registres, «Encara no hi ha registres.» en lloc d'una taula buida amb totes les capçaleres.
    `clientsvirtuals` adaptada (el títol del bloc i el botó es diuen igual: «Afegir registre manual»).
  - **V87.371 · Rendiment de l'empresa al mòbil:** la gràfica «Mes a mes» amb `CardOPlega878369` (resum: ingressos i benefici) i, a «Per
    obres», cada obra en una línia (nom, benefici i %, `nm-v878371`) que es desplega en tocar-la (`obertes878371`, `oberta-v878371`) amb
    la resta de xifres i «Obrir». Estils: `src/theme-v878371.css`. Prova: a `v369test.mjs` (21).
  - **V87.372 · Banc de preus amb l'any i l'IPC, i preus de les obres anteriors** (l'Héctor, 24/10/2026: el banc, opcional per a cada
    usuari —sobretot els tècnics—; «entraré el del 2023 i m'hauria de deixar actualitzar-lo a l'IPC vigent»; «que llegeixi els preus dels
    diferents pressupostos, desats o no a la llibreria, i si una partida semblant en dues obres tenia un preu diferent, que en calculi la
    mitjana»). Repartir un banc amb llicència (BEDEC, «Preus de la construcció») als altres usuaris no es pot: cadascú importa el seu.
    - **Banc**: `llegirBancBc3` torna `any` (el més repetit a les dates dels ~C; si no, el del ~V); al banc es desen `any` i `pct`
      (`BancPreus878368`: «Preus de l'any», «Actualització (%)» i «Calcular l'IPC (INE)» → https://www.ine.es/varipc/). En posar el preu,
      el preu i el descompost × (1 + pct) (`escalaDescomp`) i la nota diu «Banc 2023 +9 % · codi · …».
    - **Obres anteriors** (`partidesObres878372`: totes les partides amb preu de les altres obres del compte, de `aco_odata`; `preuObres`:
      la mateixa partida o una de molt semblant amb la mateixa unitat, una per obra, compta més que hi siguin totes les paraules
      buscades): la **mitjana** amb el mínim i el màxim («Mitjana de 3 obres: 32,10 € (28,00 € – 36,00 €)»), font `obres` (xip «Obres»),
      `semblant878368` si la puntuació és < 0,85, i el descompost de la més semblant escalat a la mitjana (`escalaTaula878372`).
    - Ordre: arxiu → Preus pel codi → banc pel codi → obres anteriors → Preus semblant → banc semblant → IA.
    - Estils: `src/theme-v878372.css`. Proves: `preusautounit.mjs` (28) i `pressupost372test.mjs` (10).
  - **V87.373 · Facturació del tècnic amb el format de les empreses** (l'Héctor, 24/10/2026, amb el seu compte —«tècnic total»—: «el
    resum a dalt per filtres ben visible i de seguida les factures… les gràfiques i els avisos, plegats… pensa sempre en el mòbil»):
    - `FacturesGeneral8738` reescrit amb les classes de `FacturacioEmpresa878337` (`fe-head`, `fe-filtres`, `fe-llista`, `fe-row`):
      capçalera «Facturació» + «Nova factura»; el «Pendent de facturar» (`HoursToInvoice878256`) **plegat a tots els aparells** (el total
      i «Veure-ho (N)»; abans, a l'ordinador, sempre obert); filtres d'any (l'actual de sèrie, «Tots»), client i expedient.
    - **Estats a dalt com a filtres** (`fe-estats-v878373`): Totes · Pendents de cobrar · Cobrades · Vençudes (més de 7 dies sense
      cobrar), cadascun amb l'import (total amb IVA) i quantes. Les anul·lades surten a «Totes» però no sumen.
    - **Les factures de seguida**, la més nova a dalt: número i data, expedient i client, base, IVA, total, el cobrament d'un toc
      (`cobra873`: «Cobrada dd/mm/aaaa» ↔ «Pendent de cobrar» / «Vençuda»; desa `estat` i `dataCobrament` a `facturesTecnic`), «PDF» i
      «⋯» (obrir a l'expedient, imprimir, marcar com a emesa, anul·lar / tornar a pendent). Al mòbil, fitxes.
    - A baix, plegat: **«Gràfics i informes»** (els tres donuts, `IngressosChart878292` i `FinanceReports87110`).
    - Dins de la pestanya «Honoraris» de la Facturació de la gestió total (`dins`), sense el títol «Facturació» repetit.
    - Estils: `src/theme-v878373.css`. Prova: `fact373test.mjs` (19). Adaptades `clientsvirtuals`, `menutecnictest`, `tempstest`
      (obren «Veure-ho»), `graficatest`, `pantallestest`, `v366test` i `v369test`.
  - **V87.374 · Res tallat per la dreta al mòbil** (l'Héctor, 24/10/2026, amb una captura de Preus a l'iPhone: «es continuen veient
    pantalles tallades»).
    - **Per què no ho vèiem:** l'app retalla el que surt per la dreta (`overflow-x:clip` a html, body, #root i .main), i les proves miraven
      `scrollWidth > innerWidth`, que amb el retall no passa mai.
    - **Eina nova** `tools/proves/tallades374.mjs`: mira cada element visible de cada pantalla del menú i de cada apartat d'unes obres,
      amb els comptes de prova i el de l'Héctor (còpia de DADES), primer tal com s'obre i després amb els blocs plegables oberts. Diu
      quins passen de la vora dreta, fora dels que són dins d'una zona que es pot lliscar. Opcions: `W=375`, `COMPTES=`, `WEBROOT=`, `OUT=`.
    - **Causa:** un desplegable amb una opció llarga eixamplava la columna d'una graella `1fr` fins a fora de la pantalla. Al mòbil (≤760
      px), els camps (`select`, `input`, `textarea`) porten `max-width:100%`: així s'encongeixen i no eixamplen la columna.
    - **Preus:** els filtres en una columna (fora «Resultats»). Amb la llibreria buida, ni filtres, ni «Capítols i partides», ni paperera
      buida. «Començar amb una llibreria neta» passa dins d'«Eines opcionals». La paperera només surt si hi ha alguna cosa.
    - **Inici** de la constructora i de la gestió total: les dues columnes una sota l'altra, sense passar de la pantalla (sortien 9 px).
      «1 tasca vençuda» → «1 feina vençuda», com la resta de l'Inici.
    - Estils: `src/theme-v878374.css`.
  - **V87.375 · Les meves despeses (tècnic i compte de l'Héctor) amb el format de les empreses** (l'Héctor, 24/10/2026), i **amidaments en
    Excel sense fila de títols**:
    - **Despeses** (`nouM878375 = meves && !treb`, `llistaMeva878375` dins d'`Albarans878259`): els cinc apartats de dalt filtren com
      abans; de seguida la llista per apartats (Quilometratge · Dietes · Taxes · Material · Altres), **plegats** (`grup-v878348 gm-<k>`),
      cada un amb quantes, els km i el total; a dins, columnes **Data · Concepte · Base · IVA · Total · Per repercutir · ull**
      (`taula-meva-v878375`; el concepte diu el proveïdor o el trajecte, i a sota els km, el número i l'expedient). Vistes **Tot · Per
      expedient · Per any** (`vistaD878348`; dins de cada apartat, paquets per expedient o per any i expedient). Cercador als filtres.
      Sense la franja de totals de dalt: el total base, el total amb IVA i «Per repercutir» (despeses amb expedient no repercutides), a baix.
      Dins d'un encàrrec tècnic (`meves` de l'expedient), igual però sense vistes.
    - **Amidaments en Excel** (l'Héctor, amb els de Cami Fondo, que no es llegien: «L'app no hi ha trobat cap partida»): l'Excel no tenia
      fila de títols. `capcaleraSenseTitols` (`src/amidaments.js`) reconeix les columnes pel contingut: el codi («1.4», `RE_CODI_P`), la
      unitat (`RE_UT_P`), la descripció (la columna de text més llarg), la quantitat (la columna amb números a les files de partida) i les
      de mides (números a les files sense codi; l'última és el parcial). Capítols a la columna del codi («1.- ENDERROCS» → «01 ENDERROCS»)
      i subcapítols («15.1.-SANEJAMENT» → «15.1 SANEJAMENT», amb `capPrincipal` «15 INSTAL.LACIONS»). Una descripció de més de 140 lletres
      fa un concepte curt i va sencera a la descripció. **Partides sense codi**: una fila amb descripció i unitat (i quantitat), o, si el full
      no té columna de codi, amb quantitat, és una partida; el codi el posa l'app (`01.01`, `codiApp`). Títols de quantitat amb més paraules
      («Quantitat (m2)»). Amb l'Excel de l'Héctor: 145 partides, 21 capítols; a la 2.6 i la 3.1 la quantitat de l'Excel no és la suma de les
      mides (és de l'arxiu; l'app ho avisa).
    - Estils: `src/theme-v878375.css`. Proves: `despeses329test.mjs` (35) i `amidamentsunit.mjs` (32, amb un Excel inventat de l'estil).
  - **V87.376 · Rendiment del tècnic al menú principal, el comptador de temps a mà i els amidaments plegats** (l'Héctor, 24/10/2026):
    - **Rendiment** (`RendimentTecnic878376`, pantalla «Rendiment tecnic», menú «Rendiment» per a qui té el mòdul tècnic i no el mòdul
      Empresa —el compte de l'Héctor i els tècnics—; no dins de l'expedient): `dadesRendTecnic878376` = base de les factures d'honoraris
      (`facturesTecnic`, sense les anul·lades), les meves despeses (base) i les hores (registre d'hores); les obres compartides per un altre
      compte no compten. A dalt, l'any (el d'ara de sèrie) i quatre xifres: Facturat (i l'any passat fins avui, amb el % de diferència),
      Despeses, Rendiment (% del facturat) i Hores (rendiment per hora). Gràfica (`LiniesChart878343`, plegada al mòbil): Dies (els 31
      últims) · Setmanes · Mesos (acumulat o no) · Entre anys (una línia per any, acumulat mes a mes, de facturat, despeses o rendiment).
      «Per anys» (taula) i «Per expedient · any» (plegat; tocar-ne un obre Honoraris de l'expedient). Estils `src/theme-v878376.css`.
    - **Comptador de temps** (l'Héctor: «vam quedar que no posàvem comptador automàtic»; la bombolla tapava «Passar-ho a pressupost»): ja
      no s'engega sol en obrir una obra (la preferència és `aco_auto_timer_v878376`, de sèrie apagada; la de la V87.254 ja no es mira). A la
      barra de l'obra, un rellotge (`crono-v878376`, prop `crono878376` d'`Obra` → `ObraBar878269 crono`) l'engega (`startTimer`, cronòmetre
      a mà); mentre compta, hi diu el temps i, tocant-lo, «Pausa i desa». La bombolla només surt quan compta i no s'és a la mateixa obra; amb
      la bombolla a la vista, la pàgina deixa 88 px a baix. Constructora i treballador, sense rellotge (com abans).
    - **Amidaments:** tots els capítols plegats d'entrada (abans, el primer obert o tots si n'hi havia 3 o menys).
    - Proves: `rendiment376test.mjs` (15). Adaptades `rendiment343test` (el tècnic té el seu Rendiment), `fitxestest`, `mobiltest` i
      `fases342test` (el comptador a la barra), `amidaments328test` i `pressupost368test` (obren els capítols plegats).
  - **V87.377 · Planning per partides** (l'Héctor, 24/10/2026: «en tocar el capítol, que surtin les partides; el capítol agafa el primer
    dia d'inici de la primera partida i acaba amb la finalització de l'última»):
    - Cada partida pot tenir el seu previst: `ganttConfig87217.partPlans[pid] = {cap, off, dur}` (`pidPlan878377`: l'id de la partida o
      `codi:<codi>:<posició>`), amb `off` = dies laborables des de l'inici del capítol i `dur` = dies laborables. Així, si el capítol va
      «després d'un altre», les seves partides es mouen amb ell.
    - `resolPlans878341(plans, parts)`: un capítol amb partides planificades va de la primera a l'última (`parts:true`); la seva durada
      ja no s'escriu (a la finestra del capítol i al gràfic, «La durada surt de les partides»). Sense partides, com abans.
    - **Taula (mòbil):** tocar el capítol el desplega (`cap-bloc-v878377`, `parts-v878377`) amb cada partida (inici, final, dies) i, a baix,
      «Planificar el capítol» (la finestra d'abans) i «Repartir les partides en ordre» (`repartir878377`: una darrere l'altra, amb els dies
      del capítol repartits segons l'import). Tocar una partida obre `EditaPartida878377` (comença, dies laborables, «Treure del planning»).
    - Una partida que comença abans que el capítol (no vinculat) mou l'inici del capítol a aquell dia i les altres partides no es mouen
      (`posaPartida878377`); si el capítol va després d'un altre, la partida no pot començar abans que ell.
    - **Gràfic:** les partides d'un capítol obert tenen la seva barra prevista i, planificant, la data i els dies.
    - Treure un capítol del planning o esborrar-lo tot també en treu les partides. Estils `src/theme-v878377.css`.
    - Prova: `planning377test.mjs` (17). Adaptades `planning341test` i `resum362test` (el capítol de la taula es desplega).
  - **V87.378 · Preus i marges** (decisions de l'Héctor del 24/10/2026: els preus d'un banc BC3 són de cost —PEM— i no porten DGE ni
    BI; la dificultat de l'obra i les partides petites, que es cobren gairebé com una fracció de jornada):
    - **Ajustos › «Preus i marges»** (`MargesAjustos878378`, comptes amb el mòdul Obra; no el treballador): la mà d'obra per dificultat
      (Obra nova 0 · Reforma +10 · Reforma exigent +20 %, `DIF878378`), CI · DGE · BI (de sèrie 0 · 13 · 6; la DGE i el BI, els de
      l'empresa si n'hi ha, `dge878342`/`bi878342`), **«Dins del preu de cada partida»** (de sèrie) o **«A part, al resum»**, i el
      **mínim de mà d'obra per partida** (de sèrie 4 h, mitja jornada). Es desa al compte (`aco_marges_v878378`).
    - **A cada obra** (`MargesObra878378`, `data.marges878378`, només el que canvia; `margesObra878378(d)` ho ajunta amb els d'Ajustos):
      als Amidaments dins d'«Obra, logística i marges» i al Pressupost a **«Preus i marges»** plegat (`details.marges-pres-v878378`, amb
      «Obra i logística» a sota). El resum diu el que s'aplicarà («Reforma +10 % de mà d'obra · DGE 13 % i BI 6 % dins del preu · mínim 4 h
      per partida», `resumMarges878378`).
    - **«Passar-ho a pressupost»**: casella «Marges: …» (`li.mg-v878378`, marcada) per a les partides amb preu del **banc, l'arxiu o la IA**
      (`FONTS_MARGES878378`); les d'obres anteriors i de Preus ja són preus de venda i no es toquen. Per partida: la mà d'obra × (1 + accés
      + dificultat) (`escalaMO878378`); si les hores de tota la partida (`horesMO878378` × quantitat) no arriben al mínim, es compten les
      del mínim; i, si és «dins del preu», el descompost porta la secció «MARGES D'EMPRESA» amb CI, DGE i BI en % abans del preu final
      (`ambMarges878378`). Sense descompost, el preu × el factor. `origenPreu878368` ho diu («+10 % MO (reforma) · mínim 4 h (0,66 h) · DGE
      13 % · BI 6 %»).
    - **«A part, al resum»**: els documents del pressupost (`margesDoc878378`, a `pressupostObraPrintHtml878153`) acaben amb PEM, Despeses
      generals (x %), Benefici industrial (x %) i **PRESSUPOST D'EXECUCIÓ PER CONTRACTE** (`totals-pec-v878378`).
    - Al mòbil, els camps d'«Obra i logística» (`.logis-cos-v878368 .camps`) s'encongeixen (una columna a ≤420 px).
    - Estils `src/theme-v878378.css`. Prova: `preus378test.mjs` (17). Adaptades `pressupost368test`, `pressupost372test` i
      `amidaments328test` (treuen la casella dels marges: els seus preus esperats són sense marges).
  - **V87.379 · «Treure el mínim» a la fitxa de la partida** (el pla de marges: «la fitxa diu per què i té un botó per treure-ho»): en
    passar-ho a pressupost, la partida que puja al mínim recorda `minim878378 = {f, h, minimH}` (factor aplicat a la mà d'obra, hores que
    en necessitava i el mínim). La fitxa (`FitxaPartida878361`) ho diu («Mínim de mà d'obra: 4 h (la partida en necessita 0,66 h)»,
    `minim-v878379`) i «Treure el mínim» divideix la mà d'obra pel factor, refà el preu, treu el «mínim …» de l'origen i esborra
    `minim878378` (fora d'edició, obre l'edició i ho fa; es desa amb «Guardar canvis»). Estils `src/theme-v878379.css`. Prova: a
    `preus378test.mjs` (20; l'excavació de 29,37 € torna a 18,69 €).
  - **V87.380 · Posar al dia els marges de les partides que ja són al pressupost**: fins ara els marges només s'aplicaven en passar els
    amidaments, i canviar a «A part, al resum» després hauria sumat la DGE i el BI dues vegades al PDF. Cada partida passada amb marges
    recorda el que se li va aplicar: `mg878378 = {pmo, acc, ambAcc, pd, dif, mode, fmin, ci, dge, bi, minim, minimH, tb, fM, noMin?}`.
    `margesAPosar878380` compara amb els marges d'ara (`normMg878380`; l'accés, si es va aplicar, amb el d'ara); `reaplicaMarges878380`
    treu la secció «MARGES D'EMPRESA», desfà la mà d'obra (÷ mínim ÷ (1 + accés + dificultat)) i ho torna a fer, refà el preu i
    l'origen (i la comissió, `puOrig878346`, si n'hi ha). Sense descompost, el preu ÷ el factor vell × el nou. «Treure el mínim» posa
    `noMin` (no torna). **Les partides certificades no es toquen** (`certificada878380`). Al Pressupost › «Preus i marges»: el títol
    plegat diu «N partides per posar al dia» (`mg-n-v878380`) i a dins «Posar-hi els d'ara» (`PosarMarges878380`), desactivat mentre
    s'edita el pressupost (`window.__acoEditPres878380`, event `aco-edit-pres-878380`). Estils `src/theme-v878380.css`. Prova: a
    `preus378test.mjs` (24: «al resum» → l'enderroc de 36,89 a 30,80 €; «Reforma exigent» → 33,60 €).
  - **V87.381 · Agenda › Equip** (pendent de la revisió de la constructora: «veure totes les obres alhora per treballador o colla, on és
    cadascú cada dia»): vista nova «Equip» a l'Agenda (`equipOk878381`: comptes amb el mòdul Empresa, no el treballador, amb algun
    treballador actiu). De dilluns a divendres (‹ › mou la setmana), una fila per treballador (els de colla primer) i, a sota, els
    industrials que surten al Planning; a cada dia, l'obra i el capítol (i la colla) segons `capPlans[cap].qui` de totes les obres i les
    dates de `resolPlans878341` (amb les partides, `partPlans`); una colla compta pels seus treballadors (`equipSetmana878381`). Algú a dues
    obres el mateix dia: requadre vermell (`doble`). Tocar una obra obre el seu Planning (`openObraTab(id,"Gantt")`; l'Agenda ara rep
    `openObraTab`). Al mòbil, els 5 dies a dalt i la llista del dia («Sense obra» si no té res). Colors per obra
    (`COLORS_EQUIP878381`). Estils `src/theme-v878381.css`. Prova: `equip381test.mjs` (13).
  - **V87.382 · El comptador d'Honoraris sap de quina obra és** (trobat repassant la V87.376): «Iniciar comptador» (`HonorarisTemps`) no
    hi posava l'`obraId`, i el rellotge de la barra no el veia ni el desava (`stopTimerFor878254` no desa sense obra). Ara engega amb el
    rellotge de la barra (prop `crono`, que desa abans el d'una altra obra) o, sense, amb l'`obraId`. Si compta una altra obra
    (`altra878382`), el bloc diu «En marxa en una altra obra» i només té «Desar l'altra i començar aquí» (abans «Aturar i guardar
    registre» hauria desat aquell temps en aquesta obra, i «Reiniciar» l'hauria perdut). Prova: `comptador382test.mjs` (6).
  - **V87.383 · Hores › Personal amb l'obra del Planning**: un dia sense hores apuntades porta, per a cada treballador, l'obra (o les
    obres) on el Planning el té aquell dia (`pla878383` de `PartHores878340`, amb `equipSetmana878381` d'un sol dia; només obres obertes);
    si no en té cap, l'última on ha treballat (com abans). Prova: a `equip381test.mjs` (14).
  - **V87.384 · Gràfica d'un sol mes, Rendiment plegat al mòbil i descompostos d'un Excel amb un bloc per partida** (l'Héctor, 24/10/2026,
    amb el compte de Brava i l'obra Llafranc: «no surt el gràfic»; «com moltes d'altres, al mòbil primer ha d'estar tancada i, si vols,
    l'obres»; «mira com surt un descomposat»; «he vist 3 coses en menys d'un minut… revisa bé les pantalles»):
    - **Gràfica:** amb un sol mes, `EvolucioObra878366` començava i acabava al mateix punt (tres punts solts). Ara la corba acumulada
      comença a zero el mes d'abans (`des0`); `LiniesChart878343` amb un sol mes dibuixa barres (`barres-v878384`) i sense noms al final;
      el benefici és discontinu (`dash`), perquè sense costos tapava els ingressos.
    - **Rendiment de l'obra al mòbil:** el compte («Rendiment · fase», resum «Certificat … · Benefici … (%)»), «Per fases» i «Per
      capítols» («N capítols · certificat … de …») amb `CardOPlega878369`, tancats; «Evolució de l'obra» ja ho era. A l'ordinador, com sempre.
    - **Descompostos d'un Excel amb un bloc per partida** (l'Excel de Brava de Llafranc: un full per capítol amb «14002 — Porta…», «↩ Tornar
      al PRESSUPOST · 14002», la taula i «PREU UNITARI FINAL»): abans tot el full era el descompost de la primera partida (235 línies), les
      altres sense; «BASE DESPRÉS DE CI» comptava com un cost; els % amb format de percentatge (0,02) eren 0,02 %. Ara
      `workbookDescompostsFromWorkbook878228` parteix el full en blocs (`bloc878384`, el codi del bloc tria la partida), llegeix els %
      pel text de la cel·la (`raw:false`: «2%» → 2) i `netejaFilesDescompost878384` treu el títol, «Tornar…», la capçalera, les bases i el
      que va després del preu final. **% sumats**: com a l'Excel, la DGE i el BI es poden aplicar sobre la mateixa base
      (`mateixaBase878384` a `breakdownRecalculationV87232.js`; una fila de base de l'Excel marca `nouGrup878384`); `triaBasePct878384` tria
      sumats o en cadena, el que doni el preu de la partida.
    - **Obres ja importades amb l'error:** en obrir l'obra (`Obra`, un sol cop), `reparaDescompostos878384` reparteix els blocs a les seves
      partides (si no en tenen), neteja i posa els % bé (fracció o no, el que s'acosti al preu) i marca la taula `net878384`; el d'abans va a
      `aco_descompostos_abans_v878384_<obra>`. Amb la còpia del 24/10 de Llafranc: 100 de 105 partides, 88 quadren al cèntim amb el preu i 12
      per pocs cèntims (rendiments arrodonits a l'Excel). A la fitxa, els % a zero («Administrador 0 %») ja no surten.
    - **Proves des de la carpeta principal mentre corren les de la còpia** (`D:/aco-tmp/wt379`, amb `node_modules` enllaçat): `vite.config.js`
      accepta `ACO_VITE_CACHE` (memòria cau pròpia); sense, les dues bandes refeien la mateixa i fallaven proves soltes.
    - Proves: `grafica384test.mjs` (7) i `descomp384unit.mjs` (9).
  - **V87.385 · Textos i detalls de la revisió de les pantalles** (l'Héctor, 24/10/2026: «revisa bé les pantalles, que els clients seran
    molt més exigents»; revisió amb `llargues366.mjs` `LIM=0` i fulls de captures, `D:/aco-tmp/fulls.mjs`):
    - «Tancades» (no «Tancats») als perfils que diuen «obra» (`etPaquet878327`); «Agenda / avisos de l'obra», «Dades de l'expedient» i
      «…cap visita en aquest expedient» segons el perfil (`diuObra878326`).
    - Inici sense «N cites properes» a la capçalera (ja és a «Pròximes cites»); Preus sense «LLIBRERIA VALIDADA», «Només les partides que
      tu decideixes guardar» ni «LLIBRERIA BUIDA» (el títol és «Preus»).
    - Resum de l'obra: «Feines pendents», «1 vençuda», sense «Crea la primera des d'Actes». Agenda: «Feina» i «Mostrar les feines».
    - Despeses de la gestió total: les meves (`meva`: quilometratge, taxes…) van al grup «Altres», no a Materials (`grupDespesa878344`).
    - Hores amb coma decimal (`hh878385`: «0,00 h»); a Hores, el codi curt de l'expedient (`codiCurt878270`); sense «· Creat: Data de
      creació no registrada» (pressupostos d'honoraris; fotos i actes només si hi ha data).
    - La fletxa dels menús «Accions» (`ActionMenu87213`) és un xebró CSS alineat (`fl-v878385`), no el caràcter «⌄».
    - «+ Altres agents» de Dades com un enllaç; les xifres i la llegenda del Planning (`.gantt-v878253`) amb el marge del títol; «1 partida»
      als capítols del pressupost.
    - **Compte amb les captures de pàgina sencera** (`captureBeyondViewport`): el menú lateral hi surt aixafat; a la pantalla és bé.
    - Estils `src/theme-v878385.css`. Adaptada `simple354test` (sense cites a la capçalera de l'Inici).
  - **V87.386 · Pantalles del mòbil de la revisió** (tot recollit i res tallat):
    - **Feines pendents de l'obra:** al mòbil, el text sencer (`txt-v878386`; la casella només amb «✎»); «+ Nova feina». **Feina vençuda**
      (Inici): sense el «Tancar» repetit (hi ha la creu); la fitxa de la feina, sense el text que explicava la cita vinculada i sense
      «Iniciar temps» als comptes sense hores pròpies (`senseHoresPropies878342`).
    - **Certificacions › Resum al mòbil** (`CertResumV69`, `cert-resum-m-v878386`): una línia per capítol (certificat i %) que es desplega
      amb el pressupost, cada certificació, el total i el pendent; el total a sota. A l'ordinador, la taula de sempre.
    - **Facturació de l'obra al mòbil** (`Fact`): els quatre requadres petits i iguals (fora el donut) i cada proforma en una fitxa
      (`c-pf`, `c-tot`, `data-l`), amb els botons en fila (abans una taula de 9 columnes tallada).
    - **Registres de temps** (`HonorarisTemps`): al mòbil, una fitxa per registre (data i import a dalt; editant, un camp per línia amb el
      nom, `edit-v878386`).
    - **Calculadora d'honoraris al mòbil:** els camps curts en dues columnes, els desplegables sencers; les xifres en dues columnes.
    - **Dades de l'empresa** (`DadesEmpresa878337`) per apartats (`de-sec-v878386`): Empresa · Contacte i adreça · Cobraments · Marges de les
      obres, plegats al mòbil amb un resum i oberts a l'ordinador (on el codi postal, la població i la província van en una línia).
    - **Plegat al mòbil:** «Per obres» del Rendiment de l'empresa i «Pes per capítol» del Resum de l'obra (`CardOPlega878369`).
    - Marges: «Nova cita» de l'obra i els apartats de Dades de l'empresa ja no toquen la vora.
    - Estils `src/theme-v878386.css`. Adaptada `pressuposttest` (el resum del mòbil és una llista).
  - **V87.387 · L'iPad i la segona volta del mòbil** (revisió de les 67 pantalles a 820 px amb `llargues366.mjs`, que ara accepta `W=`/`H=`):
    - **Entre 701 i 1100 px** (iPad i finestres estretes) moltes pantalles feien servir la disposició de l'ordinador: taules tallades i
      feines o requadres estirats. Ara hi van les fitxes del mòbil: feines pendents de l'obra (`theme-v878366`, `theme-v878386`), proformes
      i registres de temps, Rendiment › Per capítols (`m-res-v878366`) i Per obres (`theme-v878371`), les taules del rendiment
      (`rf-taula-v878342`) i el resum de certificacions (`useTauleta878387`, ≤1100 px). A l'iPad, els quatre requadres de Facturació de
      l'obra i els resultats de la calculadora d'honoraris en una fila; els camps de la calculadora en tres columnes.
    - **Preus** a l'iPad era una columna estreta al mig: `.library-page-v87196` té `margin:auto` dins del `main` flex i s'encongia; ara
      `width:100%`.
    - Al mòbil, els passos de l'encàrrec tècnic (cèdula, CEE…) surten tots tancats (`mobil878387`; a l'ordinador i l'iPad, obert el primer
      que falta).
    - Llista d'obres al mòbil: el número de l'any només si n'hi ha més d'un. Facturació del tècnic: el filtre de client del pendent només
      amb la llista oberta (n'hi havia dos de seguits) i els filtres de punta a punta al mòbil. Inici: «Feines pendents» i «+ Afegir feina».
    - Proformes: la cel·la dels botons tenia una amplada fixa de 118 px (regla antiga de `.fact-compact-v70`): els botons queien un sota
      l'altre; ara van en fila. `tools/proves/mira387b.mjs` (`TAB=`, `DUMP=`): obre un apartat d'una obra i dona el resultat d'una expressió.
    - Estils `src/theme-v878387.css`.
  - **V87.388 · Revisió a l'ordinador** (els tres comptes de prova i, amb `tools/proves/llargueshector.mjs`, una còpia de les dades de
    l'Héctor a `obra CALA ROVIRA 11`; el DADES real no es toca):
    - Fora els textos que expliquen: l'avís d'agents de Contactes diu només «N obres tenen agents posats (M en total)» amb el botó; al Resum,
      la pròxima cita buida ja no diu «Afegeix-ne una a l'agenda». Inici: «No tens feines pendents».
    - Despeses d'una obra sense cap despesa (`hiHa878388`): només els botons i «Encara no hi ha despeses» (abans, requadres a zero, «Total
      sense IVA 0,00 €» i filtres buits, perquè la llista de base tenia les despeses de totes les obres).
    - Pressupostos (ordinador): el número i la data en una sola línia.
    - Seleccionar despeses: si ja no en queda cap a l'obra (p. ex. després d'eliminar-les), la selecció es tanca sola.
    - Adaptada `despesestest` (des de la V87.384 els blocs del Rendiment surten tancats al mòbil: la prova els obre abans de llegir-los).
  - **V87.389 · Tot recollit amb les dades de debò i el capítol obert del Planning** (revisió del mòbil amb la còpia de les dades de
    l'Héctor; l'Héctor, 24/10/2026: «marca bé el capítol de les partides amb color, que no s'acaba de distingir bé un cop obert»):
    - **Planning:** el capítol obert amb fons blau i una franja a l'esquerra, i les seves partides a sota amb un fons més clar i una franja
      clara (taula del mòbil, `cap-bloc-v878377.obert`, i gràfic de l'ordinador, `gt-row-v878253.open` / `.part`). Els capítols i les
      partides sense planificar, en una línia amb «Sense planificar» (`sp-v878389`; abans, «Inici — Final — Dies —»).
    - **Facturació de l'obra al mòbil i l'iPad:** cada proforma és una línia (número, data i total; la factura, si n'hi ha, com una etiqueta)
      que s'obre en tocar-la (`obertes878389`, `obert-v878389`). Amb les 9 proformes de Cala Rovira feia 3,5 pantalles.
    - **Honoraris de l'expedient:** «Pressupostos d'honoraris · Calcular honoraris · Factures honoraris» en una fila (abans, tres botons
      apilats de punta a punta al mòbil).
    - Estils `src/theme-v878389.css`. Eina `mira387b.mjs` amb `SHOT=` (captura després de `DUMP`).
  - **V87.390 · Hores, Fitxatge i Facturació en llista que es desplega** (l'Héctor, 25/10/2026: «ho vull en una llista i després
    despleguem el treballador que ens interessi… utilitzem molts desplegables per simplificar pantalles principals»):
    - **Hores › Personal** (mòbil i iPad, `useTauleta878387`): una línia per treballador (`details.fila-m-v878390`: nom, categoria, l'obra
      i les hores del dia) que es desplega per apuntar-hi les hores; la setmana, plegada (`CardOPlega878369`). A l'ordinador, com abans.
    - **Hores › Fitxatge** (`RegistreFitx878357`): a dalt el dia, el mes i «Tots» (PDF i Excel del mes de tothom); a sota, una línia per
      treballador (`details.fitx-w-v878390`: com està ara, hores del dia i del mes) amb el dia (marques i «Corregir»), el mes dia per dia
      (`.mes-w`, «PDF del mes») i l'any mes per mes (`.any-w`, «PDF de l'any»). **Documents per a la Inspecció** (`docHtml`): empresa i NIF,
      domicili, treballador/a amb DNI i ofici, període, cada dia del mes (també els que no ha treballat; caps de setmana en gris) amb
      entrada, sortida, pauses i hores, el total, les dues signatures i el peu de l'art. 34.9 ET (es conserva 4 anys).
    - **Facturació de l'empresa** (`FacturacioEmpresa878337`): filtres d'any (l'actual de sèrie), **mes o trimestre** (`T1`…`T4`, `trimDe878390`,
      `nomPeriode878390`: l'IVA es declara per trimestres), **client**, obra i cobrament (al mòbil, de dos en dos); al mòbil i l'iPad cada factura és una línia (número i data, client i obra, total i «Pendent»/«Cobrada»,
      `plegable-v878390`, `est-v878390`) que es desplega amb la base, l'IVA, el cobrament i PDF · Enviar · ⋯; **el total a baix**
      (`fe-total-v878390`: període i filtres, base, IVA, retenció si n'hi ha, total i pendent de cobrar). **«Per a la gestoria»** (menú a
      dalt): «Exportar Excel» (les factures dels filtres), «Llistat en PDF» (llibre de factures emeses, per número) i «Compartir l'Excel…»
      (`navigator.share` amb el fitxer, si l'aparell ho deixa). A l'ordinador, columnes fixes (el cobrament i els botons alineats) i la
      columna «Client i obra». La Facturació del tècnic (`FacturesGeneral8738`) té el mateix: mes, files plegables i el total a baix.
    - Estils `src/theme-v878390.css`. Eina `mira390.mjs` (`PANT=`, `PRE0=` abans d'anar a la pantalla, `PRE=`, `SCR=`, `DUMP=`, `SHOT=`).
      Proves: `fitxatge357test` (20) i `facturacio337test` adaptades.
  - **V87.390.1 · La reparació dels descompostos no toca el que ja quadrava:** `reparaDescompostos878384` deixa el descompost d'abans si el
    seu total ja s'acostava al preu de la partida igual o millor que l'arreglat, i torna `null` si no ha canviat res. Amb la còpia de les
    dades de l'Héctor (COMODORO i dues obres més, importades d'un Excel de Socoterm amb el mateix error que Brava): de 123 descompostos,
    122 queden més a prop del preu i cap pitjor (molts sumaven el doble). Eina `D:/aco-tmp/desc390mod.mjs` (la fa l'script del
    `scratchpad`; només llegeix). `primerobrirtest` accepta els canvis de `descompost`/`descompostTable` de les obres reparades (hi ha la
    còpia `aco_descompostos_abans_v878384_<obra>`); `traducciotest` espera «Tareas pendientes».
    - **Proves des de la carpeta principal (25/10/2026):** `contrasenyestest` (16 de 34) i `honoraris332test` (4–19 de 20) hi fallaven i a
      `D:/aco-tmp/wt379` passaven totes amb el mateix codi: la memòria cau `D:/aco-tmp/vitecache-main` s'havia fet malbé (es va esborrar).
      I passar proves alhora (una tanda i una eina de captures) també en fa fallar per càrrega: una sola cosa alhora.
  - **V87.391 · Despeses «Per a la gestoria» i el període** (l'IVA es declara per trimestres; la gestoria també necessita les factures
    rebudes): a Filtres, el camp del mes passa a un desplegable **«Període»** (`PeriodeSelect878391`: «Tot el període» i, per a cada any amb
    despeses, l'any sencer, els trimestres i els mesos que en tenen; `perOk878391` filtra `AAAA`, `AAAA-T3` o `AAAA-MM`). A «Accions» de
    l'empresa (i, per al tècnic, el menú nou «Per a la gestoria» al costat de «Nova despesa»): «Exportar Excel», **«Llistat en PDF»**
    (`llistatPdf878391`: factures rebudes dels filtres sense la mà d'obra pròpia ni els albarans inclosos en una factura, per data, amb base,
    IVA —«ISP» si cal— i total) i «Compartir l'Excel…» (`navigator.share`). Proves: `despesesrend338test` (26) i `despeses329test` (35)
    adaptades. Eina nova `tools/proves/accessibilitat391.mjs` (botons sense nom, camps sense etiqueta, contrast, mida dels botons, lletra).
  - **V87.392 · Accessibilitat** (l'Héctor, 25/10/2026: «noves versions de millora i accessibilitat»; `accessibilitat391.mjs` a 390 px amb
    demo-constructor i demo-tecnic, totes les pantalles del menú i els apartats d'una obra, amb els blocs plegats oberts):
    - **Contrast:** el gris dels textos secundaris `--co-ink-3` #76878D (3,7:1 sobre blanc, 3,4:1 sobre el fons) passa a **#5F7075** (5,2:1 i
      4,8:1; el mínim és 4,5:1). Era el 99 % dels avisos (295 → 0).
    - **Lletra mínima de 12 px** als rètols petits (requadres, blocs de l'obra, xips, kpis…; n'hi havia de 10,5 i 11 px): 141 → 0.
    - **Botons per al dit:** al mòbil i l'iPad (`pointer:coarse` o ≤1100 px), botons i segments de 36 px d'alçada com a mínim; els
      plegadors dels capítols, 32 px; els telèfons de Contactes, més alts per tocar-los (82 → 0 de reals).
    - **Focus del teclat** sempre visible (`:focus-visible` amb `!important`: els botons amb `all:unset` el perdien).
    - **Etiquetes** als camps que no en tenien (estat i prioritat de les feines, el compte d'Ajustos, afegir punts i documents a l'encàrrec,
      accions del pressupost d'honoraris al mòbil). Botons sense nom i imatges sense text: 0.
    - Estils `src/theme-v878392.css`. `tallades374.mjs` (`COMPTES=demo-constructor,demo-tecnic`, separats per comes): 0 pantalles tallades.
  - **V87.393 · Empresa › Calendari** (l'Héctor, 25/10/2026: «ha de penjar-se també el calendari laboral de la construcció i el seu horari?»;
    art. 34.6 ET: l'empresa fa el calendari cada any i l'exposa en un lloc visible de cada centre de treball, també a l'obra):
    pestanya nova «Calendari» a Empresa (`CalendariEmpresa878393`; `Empresa878339` rep `obres`). Es desa a l'empresa
    (`aco_empresa_v878259.calendari878393 = {horari:[{id,dies,hores}], anys:{[any]:{jornada, festius:[{id,data,motiu}]}}}`): l'horari (val per a
    tots els anys), i per a cada any (‹ ›) la jornada anual i els festius i dies no laborables (ordenats per data). **«PDF per penjar»**
    (`fullCalendari878393`): per a l'oficina o una obra oberta (centre de treball amb l'adreça de l'obra), A4 amb l'empresa i el NIF, l'horari,
    la jornada, la llista de festius, els 12 mesos (caps de setmana en gris, festius en vermell) i la nota de l'art. 34.6. Els festius no
    s'omplen sols (cada empresa té els seus locals i els del conveni). Estils `src/theme-v878393.css`. Prova: `calendari393test.mjs` (12);
    `empresa339test` adaptada (la pestanya nova).
  - **V87.394 · Accessibilitat a l'ordinador** (`accessibilitat391.mjs` a 1440 px): etiquetes (`aria-label`) als camps que no en tenien
    (feines de l'obra —text, data, hora—, «Accions» de les feines de l'Inici, l'estat a la taula d'Expedients, IVA/retenció/deducció de les
    proformes, el cercador d'Honoraris): 41 → 0. La capçalera del resum de certificacions tenia text gris sobre fons fosc (una regla vella de
    `styles.css`, `.cert-resum-row-v8717.head .pres`…, guanyava la del tema): ara fons clar. Xips «Pendent» i «Acceptat» dels pressupostos
    d'honoraris més foscos (#B45309, #15803D). Lletra de 12 px a les capçaleres de les taules i als rètols petits (fora de la taula
    d'Expedients, on la data de creació no hi cabria) i a la setmana de l'Agenda; l'escala del Planning es queda més petita. Estils
    `src/theme-v878394.css`. Queda un sol avís (fals: «Avui» del Planning).
  - **V87.395 · «Per a la gestoria» a la Facturació del tècnic** (publicada dins de la V87.396): a `FacturesGeneral8738`, al costat de «Nova
    factura», el menú «Per a la gestoria» (`fe-head-acc-v878395`): Excel de les factures emeses del període triat (per número; base, IVA,
    retenció, total, estat i data de cobrament; `exporta395`, amb «Compartir l’Excel…» si l’aparell ho deixa) i «Llistat en PDF»
    (`llistatPdf395`). **Compte:** dins d’aquesta funció `t` no és la traducció (es fa servir `i18nT`); en canviar `t(` per `i18nT(` es va
    tornar `tot(` en `toi18nT(` i l’Excel petava («toi18nT is not defined»): ho va trobar `fact373test` (cas 6). Estils `src/theme-v878395.css`.
  - **V87.396 · Ajustos › Documents i els descompostos de Comodoro** (l’Héctor, 25/10/2026):
    - **Documents** (`DocsAjustos878396`, bloc «Documents» d’Ajustos, no per al treballador; es desa al compte a `aco_docs_v878396`): un sol
      encapçalament per a tots els documents (`capDoc878396`: pressupost d’obra, certificacions a origen i «només aquesta», proformes i
      factures de l’empresa, pressupostos i factures d’honoraris; no la factura VeriFactu) en **7 estils** (`ESTILS_DOC878396`: A Neta ·
      B Banda de color · C Dues columnes · D Franja lateral · E Centrada · F Compacta · G Logo a la dreta; l’Héctor els va veure amb
      captures del logo de Brava i va voler poder-los triar), amb el color de l’empresa (`colorDocs878396` = Imatge de l’empresa) i el
      **logo sencer a la seva alçada** (24 mm, sense el requadre de 31 × 17 mm que deixava espai en blanc). Vista prèvia a Ajustos.
      També: **peu** de tots els documents (`peuDoc878396`), **textos de sèrie dels pressupostos** (validesa, forma de pagament i
      condicions; `textosPres878396`: si el pressupost no en porta), **requadre d’acceptació** del client (nom, DNI, data i signatura;
      `signaturaDoc878396`, de sèrie sí) i, per als comptes sense «Dades de l’empresa» (el de l’Héctor), **les dades de l’emissor dels
      honoraris** (nom, NIF, col·legiat, adreça, telèfon, correu, IBAN; `emissorTecnic878396`). Fora «Observacions/Forma de pagament
      pendent d’indicar», «Signatura / conformitat» i «Document provisional pendent d’adaptar…». Les classes de dins de l’encapçalament
      porten el prefix `k3` (`.k3h`, `.k3box`…): les plantilles tenen les seves `.top`, `.box`… i xocaven (**compte en canviar noms amb
      una expressió: també tocava `o.meta` del codi**). Estils `src/theme-v878396.css`. Prova: `docs396test.mjs` (14, amb captures a
      `D:/aco-tmp/docs396`). Adaptades `documentstest` i `marca351test` (el logo és `img.k3lg`).
    - **Descompostos d’Excel** (l’Héctor amb una captura de la fitxa de la partida F-00.01.01 de Comodoro: «això què representa?»; Mà
      d’obra 0, Materials 1.173,32, Industrials 586,66, CI 0,03 %… i «El preu de la partida és 793,09 €»). L’Excel de Comodoro (fet amb
      l’eina de pressupostos de l’Héctor) té per a cada partida els recursos propis i l’oferta industrial amb fórmules «si és PROPI, q × p;
      si no, 0» (i al revés) i «SUMATORI COSTOS DIRECTES (CD)». L’app tornava a fer q × p de totes les línies i comptava el sumatori: el
      cost directe sortia triplicat i, en no quadrar, els % es llegien com a fraccions. A més, el títol de cada bloc porta «← PRESSUPOST» a
      la mateixa fila i l’app no hi veia blocs: només la primera partida de cada full tenia descompost (2 de 65).
      - En llegir: «← PRESSUPOST» marca un bloc (`esTornar878384`); el codi i el títol també en dues cel·les («02.01 | Enderroc…», l’altre
        Excel de Llafranc); si un full no dona cap bloc, es llegeix sencer com abans. Una línia amb **import 0 escrit a l’Excel** i quantitat
        és la manera no triada o un % que no s’aplica (`exclosa878396`, es treu). Els títols («MÀ D’OBRA», «OFERTA INDUSTRIAL /
        SUBCONTRACTA»…) són títols (`capSec878396`). «SUMATORI…» és un subtotal i «PREU UNITARI» sol és la fila final (també a
        `breakdownRecalculationV87232.js`). El rendiment i el preu de cada línia amb fins a 4 decimals (`qty4878396`; amb 2, uns cèntims de
        diferència). La fila de títols de la taula ja no pot ser una descripció llarga (cel·les de més de 40 lletres no compten).
      - Obres ja importades (`reparaDescompostos878384`, en obrir l’obra): si els propis i l’oferta industrial sumen cadascun el CD de
        l’Excel, només en compta un (`alternativaInd878396`: el que hi quadra; si quadren tots dos, l’oferta industrial), els % bé.
        Les descripcions de les partides ja no porten «SUBTOTAL — … CAPÍTOL →» ni el títol del capítol següent (`netejaDesc878396`, també
        en importar; a Comodoro n’hi havia 11).
      - La fitxa de la partida (`partsPartida878361`): el títol de l’apartat de l’Excel mana (la maquinària per hores ja no és mà d’obra) i
        no surten les línies a 0 sense quantitat.
      - Resultats: amb l’Excel de Comodoro, 65 de 65 partides amb descompost i 55 al cèntim (9 per cèntims o pocs euros: en algunes
        partides l’Excel calcula el BI sobre el CD i no sobre la base després del CI, i el càlcul de l’app només sap «en cadena» o
        «sumats»; la fitxa avisa de la diferència; la C-00.03.01 l’Excel mateix la té en PA a 2.784 € i a 13,80 €/m²). Amb l’Excel de
        Llafranc de Baixades (16/10), de 0 a 50 de 55. A la còpia del núvol del 25/10: Comodoro 2 de 2, i Llafranc (Brava i còpia de
        l’Héctor) 88 de 100 i la 2026-021 40 de 44, que s’arreglen soles en obrir-les (encara no s’havien obert des de la V87.384).
      - **A Comodoro les altres 63 partides no tenen descompost** (es va importar amb la versió d’abans): cal tornar a importar l’Excel.
      - Proves: `descomp396unit.mjs` (17, sense navegador, Excels inventats dels dos formats i la reparació). Eines: `descomp397sim.mjs`
        (simula la reparació amb una còpia de `COPIES_NUVOL`, sense escriure res) i `descompexcel.mjs` (importa un Excel real amb el codi
        de l’app i diu quantes partides quadren; `APPJS`/`BRKJS` per comparar amb una versió d’abans). `descomp384unit` adaptada (9).
  - **V87.397 · Gràfiques a Facturació** (l’Héctor, 25/10/2026: «gràfiques de barres o lineals per fer comparatius entre el mateix mes de
    diferents anys, per exemple, o l’evolució de l’any vigent»):
    - **On:** a la Facturació de l’empresa (`FacturacioEmpresa878337`, a sota del total) i a la del tècnic (`FacturesGeneral8738`, primer
      dins de «Gràfics i informes»), en un bloc plegat (`details.fe-informes-v878373`) que a la línia plegada diu «2026 fins avui: X · +N %
      respecte de 2025» (`resumFact878397`). La gràfica només es dibuixa quan s’obre (`inf397`).
    - **Dades:** base sense IVA per la data de la factura (`isoData878292`; sense data no compta), sense les anul·lades, amb els filtres de
      client i d’obra de la pantalla (no els del període); a l’empresa, també les factures importades d’anys anteriors. L’any el dona el
      filtre d’any de la pantalla (amb «Tots», l’actual).
    - **`GraficaFact878397`:** «Comparar anys» (`BarresAnys878397`: cada mes amb una barra per any —l’any triat i fins a 3 d’anteriors amb
      factures; al mòbil, 3—, o un sol període amb una barra per any i l’import a sobre: un mes, un trimestre, «De l’1 de gener a avui» o
      «L’any sencer») i «Evolució {any}» (`LiniesChart878343`: l’any i l’anterior discontinu, acumulat de sèrie). A dalt, l’any (o el
      període) fins avui i l’any passat fins al mateix dia, amb ▲/▼ i el % (`sumaFact878397` amb `cut`). «Xifres» plegat: mes × any, la
      diferència, «De l’1 de gener a avui» i «Total de l’any» (els mesos a 0, en gris).
    - **Colors:** cada any el seu, a totes les vistes, per la distància a l’any triat (`SERIES878343[any-y]`: blau, taronja, aqua, groc;
      validats amb el validador de l’skill `dataviz` sobre blanc; l’aqua i el groc tenen poc contrast i per això hi ha les xifres i l’import
      sobre les barres). Barres de 24 px com a molt, 2 px entre elles i 4 px arrodonits a dalt; la franja del mes en passar-hi per sobre o
      tocar-la (`onPointerMove`/`onPointerDown`), i amb el teclat (fletxes). **L’app no té mode fosc**: la gràfica tampoc.
    - **Fora**, a la Facturació del tècnic: la gràfica vella «Ingressos» (`IngressosChart878292`, que es queda als pressupostos d’honoraris i
      al Rendiment de l’obra) i «Resum / informes de factures» (`FinanceReports87110`); els tres gràfics rodons es queden.
    - Estils `src/theme-v878397.css`. Prova: `fact397test.mjs` (29; factures inventades de 4 anys als comptes `demo-tecnic` i
      `demo-constructor`; s’ha de passar de l’1 de març al 31 de desembre i a partir del dia 3 del mes). Adaptades `graficatest` (la gràfica
      nova i les seves xifres) i `v366test` (el títol del bloc plegat porta la línia del resum).
  - **V87.398 · Tornar a llegir els descompostos d’un Excel** (per a Comodoro, on 63 de 65 partides no en tenien perquè es va importar
    abans de la V87.396): al Pressupost, **Accions › Eines › «Tornar a llegir els descompostos d’un Excel…»**, fora del mode d’edició.
    - **Abans** hi havia «Adjuntar / actualitzar descompostos» (`importDescompostosMassius878176`), però només sortia editant, i des de la
      V87.366 el menú «Accions» no surt mentre s’edita: no es veia enlloc. A més, aparellava amb la manera vella (el primer codi que
      s’assemblés) i no triava els % sumats o en cadena.
    - **Ara** (`llegeixDesc398`, `aplicaDesc398` a `Pressupost`): llegeix l’Excel amb la lectura de la V87.384/396
      (`workbookDescompostsMassius878176`) i `planDescompostos878398` (funció pura, al costat d’`attachWorkbookDescompostos878228`) fa el
      mateix aparellament que en importar (pel codi, % triats pel preu de la partida). `attachWorkbookDescompostos878228` torna també
      `unmatchedCodes`.
    - **Finestra** (`.desc-v878398`): l’arxiu i quants descompostos ha llegit, quantes partides sense descompost el rebran, la casella
      «Substituir també els N que ja en tenen» (només si n’hi ha; de sèrie no), «X de N quadren amb el preu de la partida» amb les que no
      (descompost i preu), «Sense partida al pressupost: codis» i «Els preus i les quantitats no canvien». «Posar-los (N)» ho desa al moment
      (`persistBudgetCaps878179`). Els descompostos substituïts es guarden a `aco_descompostos_abans_v878398_<obra>`.
    - Estils `src/theme-v878398.css`. Prova: `desc398test.mjs` (14, compte `demo-constructor` i un Excel inventat amb un bloc per partida).
    - **Per a l’Héctor:** a Comodoro, Pressupost › Accions › «Tornar a llegir els descompostos d’un Excel…» i triar l’Excel v07.
  - **V87.399 · Descompostos més fins:**
    - **Un % sobre el cost directe** (`sobreCD878399` a `breakdownRecalculationV87232.js`: la base és la suma dels recursos). L’Excel de
      Comodoro calcula el BI d’algunes partides sobre el CD, i l’app només sabia «en cadena» o «sumats». Si cap de les dues no dona el preu
      de la partida, `triaBasePct878384` prova on va cada % (`basesPct878399`: en cadena, sobre la mateixa base que l’anterior o sobre el
      CD; com a molt 6 %) i es queda la combinació que hi arriba al cèntim amb menys canvis; si cap no hi arriba, no es força res.
    - **Importar un sol descompost** (des de la partida, `importDescompostExcel878161`, i des de Preus, `importLibraryItemDescompost87207`):
      `workbookDescompostFromFile878161(file,{codi,pu})` llegeix com la importació sencera (`workbookDescompostsFromWorkbook878228`: blocs,
      títols, línies a 0, % ben llegits) i tria el bloc de la partida pel codi (`decompTargetScore878228`); si no en surt cap, la lectura d’abans.
    - **Amb les dades de debò** (còpia del núvol del 25/10 i l’Excel v07, `sim398.mjs` del scratchpad, només llegeix): a Comodoro, «Tornar a
      llegir» posaria 63 descompostos i **62 quadren al cèntim** (abans 55); la C-00.03.01 no, perquè l’Excel mateix la té en PA a 2.784 € i
      a 13,80 €/m². 12 descompostos de l’Excel no tenen partida al pressupost de l’app. Llafranc i la 2026-021 no canvien (88 de 100 i 40 de 44:
      els que falten són per cèntims d’arrodoniment de l’Excel).
    - L’Excel v07 és a `D:\00_CUBERO\00_FEINA\00_HÉCTOR\09_SOCOTERM\2026\2026_008 obra CP COMODORO\` (dades d’un client: no copiar-lo a les proves).
    - Prova: `descomp399unit.mjs` (11, sense navegador). Passen `descomp396unit`, `descomp384unit`, `preusautounit`, `amidamentsunit`,
      `pressupost361test` i `preus378test`.
  - **V87.400 · «Visual nou» per validar** (l'Héctor, 26/10/2026: «com queden les visuals de les pantalles: accessos amb una icona i no tanta
    lletra… un pas endavant en la visual final, sobretot la versió mòbil, que és la que faran servir a peu d'obra, i l'iPad; amb ordinador pot
    anar diferent… fes-me propostes amb captures per validar si les fem o no»):
    - **Opció de prova de cada aparell:** Ajustos › **Aspecte** › «Visual nou (en proves)» (`AspecteAjustos878400`; només al compte de l'Héctor
      i als `demo-*`). Es desa al localStorage de debò del navegador (`visual-nou-878400`, `lsVisual878400`: si es desés a la memòria de l'app,
      es perdia en recarregar) i posa `html[data-visual="nou"]`. **Sense l'opció, l'app es veu com sempre.**
    - **Les propostes** (només al mòbil i l'iPad, `src/theme-v878400.css`): (1) Inici: salutació en una línia, sis accessos en icona
      (`AccessosInici878400`: Nova obra/Nou expedient, Nota de veu, Despesa, Hores, Agenda, Facturació) i les xifres en una fila; (2) menú
      «Més» com una graella d'icones que surt de baix (3 columnes al mòbil, 5 a l'iPad); (3) obra: els blocs més baixos al mòbil i cada
      apartat amb la seva icona (`TAB_ICON878400`, `iconaTab878400`), «Compartir» en una línia petita; (4) llista d'obres: sense el títol
      repetit i els paquets en una fila que es llisca; (5) Despeses: els grups en targetes petites amb icona (`ICONA_GRUP878400`).
    - Captures d'abans i després: `tools/proves/visual400.mjs` (`VISUAL=1`, `MIDES=mobil,ipad`, `COMPTES=`) → `D:\aco-tmp\visual400`.
      Document per validar a Claude Docs (vegeu «Per començar una sessió nova»). Les que validi, es posen per a tothom i es treu l'opció.
    - Prova: `visual400test.mjs` (11). Passen `navtest`, `obratest` i `v366test`.
  - **V87.401 · Pressupost dictat** (estudi del mercat, proposta 1; sense cost): Pressupost › Accions (i, editant, Afegir) › **«Dictar
    partides…»** (`DictarPartides878401`, `.dictat-v878401`).
    - Es dicta (`DictatActa878263` amb `separador="; "`: cada pausa del dictat separa una partida) o s'escriu: «enderroc de rajola de la
      cuina 12 metres quadrats; alicatat del bany 20 m2; sis punts de llum».
    - **`src/dictatPartides.js`** (`llegirDictat`, funció pura): quantitat i unitat (m2, m3, ml, m, u, pa, h, kg, t; dites o escrites),
      números en lletres fins a cent («vint i dos», «i mig», «12 coma 5»), català i castellà; separa per «;», punt, «i després», «també»,
      comes entre quantitats i, tot seguit, després de cada quantitat amb unitat. Un número en lletres sense unitat només compta al principi
      o just després d'una altra quantitat («radiador nou» no és 9). Límit conegut: «…6 punts de llum enderroc 4 m2» sense pausa s'enganxa.
    - **Preu** com als amidaments (`preusAmidaments878368`: Preus, banc amb l'IPC, obres anteriors) i, als preus del banc, els marges de
      l'obra (`margesLinia878378`, funció comuna nova que també fa servir «Passar-ho a pressupost»). **Capítol** pels estàndard
      (`capStd878280`, sense comptar el lloc —«del bany»—; alicatat = revestiments): el del pressupost que hi correspon o «Capítol nou: …»;
      sense capítol clar, «ALTRES».
    - Revisió: cada partida amb la casella, concepte, quantitat, unitat, preu (amb d'on surt: Preus, Banc, Obres, «A mà», «Sense preu»),
      capítol i import; total. «Afegir N partides» → `afegeixLlibreria878361` (desat al moment), `tipus:"Dictat"`, `origenPreu878368`
      «Dictat · …». Si el preu es canvia a mà, el descompost no s'hi posa.
    - Estils `src/theme-v878401.css`. Proves: `dictatunit.mjs` (14, sense navegador) i `dictat401test.mjs` (13). Passen `preus378test`,
      `pressupost368test` i `pressupost372test`.
  - **V87.402 · Enviar per WhatsApp i el pressupost acceptat o no** (estudi del mercat; sense cost: obre el WhatsApp de l'aparell, no hi ha
    cap bot):
    - **Finestra «Enviar»** (`EmailModal`, `draftCorreu878337`): els destinataris porten també el mòbil (client i persones de contacte,
      promotor —`mobilPropietat`—, agents); un contacte amb mòbil i sense correu també hi surt. Botons **WhatsApp** (`.wa-v878402`: obre
      `https://wa.me/34<mòbil>?text=<assumpte i missatge>` del primer marcat amb mòbil; 9 xifres → «34» davant) · Gmail · **«Obrir el
      correu»**. Al mòbil, en dues columnes (WhatsApp i el correu a dalt).
    - **Pressupost enviat** (`emailDraft` posa `onEnviat` quan el títol comença per «Pressupost»; `enviatPressupost878402` de l'App): l'obra
      desa `enviatPres878402 = {at, via: whatsapp|gmail|correu, a:[noms]}` (a la llista d'obres i a `odata[id].obra`; no a les obres
      compartides per un altre) i, si era «Pressupostat» o «En revisió», passa a **«Pendent de resposta»**.
    - Al Pressupost, mentre l'obra és «Pendent de resposta»: franja **«Enviat el … per WhatsApp»** (`.enviat-v878402`) amb **Acceptat** i **No
      acceptat**, que canvien l'estat de l'obra (event `aco-estat-obra` → `updateObraStatus878247`).
    - **Avís** (`avisosObra878360`, Inici i Resum de l'obra): «Pressupost enviat fa N dies, sense resposta» a partir de 7 dies; tocant-lo,
      el Pressupost de l'obra.
    - Estils `src/theme-v878402.css`. Prova: `whatsapp402test.mjs` (14). Passen `avisos360test`, `facturacio337test` i `pressuposttest`.
  - **V87.403 · Signatura a la pantalla** (estudi del mercat, proposta 3; sense cost: no és una signatura a distància ni certificada, és
    la imatge del traç amb el nom, el DNI i l'hora):
    - **`SignaturaPad878403`** (finestra: nom i cognoms, DNI, quadre per signar amb el dit o el ratolí —`canvas` amb «pointer events»,
      `touch-action:none`—, «Esborrar», «Desar la signatura») i **`SignaturaVista878403`** (imatge, nom, DNI i data; «Tornar a signar»,
      «Treure»). La imatge es retalla i es redueix (PNG, com a molt 600 × 220 px).
    - **On es desa:** llistes `signatures878403 = [{id, nom, dni, at, src, rol|tipus…}]`. A **`src/fileStore.js`** la llista és a `LISTS`
      (com `fotos`): la imatge es desa a l'aparell i es puja al núvol (`aco-fitxers`); el desat de les obres en treu `src`.
    - **Acta:** pestanya **«Signatures»** (amb el número de signatures) amb les quatre caselles del document (`ROLS_SIG878403`: DO, DEO,
      constructora, promotor; el nom proposat surt de les Dades de l'acta). Es desa al moment a l'esborrany i a l'acta desada, i l'acta
      passa a «Signada». La vista i el PDF de l'acta (`ActaFormalPreview8768`) porten la signatura a la seva casella.
    - **Pressupost:** Accions › **«Signatura del client…»** (o «Tornar a signar l'acceptació») i «Signar» a la franja d'enviat (V87.402):
      event `aco-estat-obra` amb `sig` → `sigRef878403` de l'App la desa a `odata[id].signatures878403` (`tipus:"pressupost"`, `budgetId`;
      una per pressupost) i, si l'obra encara no era acceptada, passa a «Acceptat». Franja verda **«Acceptat i signat»**
      (`.sig-pres-v878403`). Els documents del pressupost porten `signatura878403` (`sigPres878403`) i el requadre «Acceptat pel client»
      (`signaturaDoc878396`) s'omple amb el nom, el DNI, la data i la signatura (també si a Ajustos › Documents el requadre està tret).
    - **Parte amb feina fora de pressupost:** al resum del dia, **«Conforme del client»** amb «Signatura del client»
      (`part.signatures878403`, `rol:"client"`).
    - Estils `src/theme-v878403.css`. Prova: `signatura403test.mjs` (20, ordinador i mòbil, signa amb el ratolí simulat). Passen
      `visitestest`, `fitxerstest`, `partes350test` i `docs396test`.
  - **V87.404 · Dades d'exemple amb treballadors i equip** (per als vídeos i perquè el Pol estudiï l'app): `src/dadesDemo.js` porta tres
    treballadors inventats a la constructora i a la gestió total (`treballadors(perfil)`: Pere Prova, oficial 1a, 25 €/h, Colla 1; Joan
    Prova, peó, 18 €/h, Colla 1; Marc Prova, encarregat, 28 €/h) i el planning d'exemple diu qui hi treballa (`planning(…, qui)`: la Colla 1
    a la reforma, el Marc a la façana); `omplenaDemo878328` els desa a `aco_treballadors_v878339` si el compte no en té cap.
  - **V87.405 · Enviar des del Gmail amb el PDF adjunt i l'acta amb el model dels documents** (l'Héctor, 26/10/2026, enviant una acta a uns
    clients: «s'obre l'Outlook… vull que sigui per Gmail… separa amb coma i no és vàlid… no surt adjuntat el PDF de l'acta»):
    - **`src/pdfDoc.js`** (`htmlAPdf`, `paginesImatge`, `nomPdf`): l'HTML d'un document en un PDF de debò. Es dibuixa en un marc amagat de
      794 px, es talla en pàgines A4 sense partir cap línia, fila, foto ni signatura (`talls`; també `break-before:page`) i cada pàgina va
      al PDF com una imatge JPEG (html2canvas 1.4.1 i jsPDF 4.2.1, dependències noves amb la versió exacta, carregades només en fer el primer PDF).
    - **`src/googleMail.js`** (`connecta`, `envia`, `mime`): el correu surt del Gmail de l'usuari amb l'API de Gmail (permís «gmail.send»
      amb el mateix client de Google que el Calendar; només enviar, no llegir). Correu MIME amb el text i els adjunts. Si la «Gmail API»
      no està activada al projecte de Google, Google respon 403 i `e.noActiva`. **Per a l'Héctor:** Google Cloud › projecte «Control
      d'obres» › APIs › Biblioteca › «Gmail API» › Habilitar (una sola vegada).
    - **Finestra «Enviar»** (`EmailModal`, `.correu-v878405`): un sol botó «Enviar» (fora «Gmail» i «Obrir el correu»); a sota, «S'envia
      des del teu Gmail · Canviar» (Gmail o «Correu de l'aparell», es recorda per usuari a `aco_correu_v878405`). El PDF del document es
      prepara en obrir la finestra (`draft.pdf = {doc, obra, client}`, `htmlDoc878405`) i surt com a adjunt (es pot desmarcar). Gmail:
      permís (dins del toc) → PDF → enviat («Enviat des del teu Gmail a …»). Si falla, ho diu i ofereix «Obrir el Gmail amb el correu
      escrit i descarregar el PDF». Correu de l'aparell: `mailto:` amb «;» a Windows (l'Outlook no accepta la coma) i el PDF descarregat
      (al mòbil, «Compartir» amb el PDF). WhatsApp: al mòbil, «Compartir» amb el PDF; a l'ordinador, el xat i el PDF descarregat.
    - `emailDraft(title, {doc, assistents})` i `draftCorreu878337({…, primer})`: una acta va als seus assistents (marcats); si cap no té
      correu, el client com abans. L'assumpte ja no repeteix el nom de l'obra. «Enviar» de l'acta i «Enviar per correu» del visor de
      documents passen el document.
    - **L'acta com els altres documents** (`actaPrintHtml878405`): l'encapçalament i el color d'Ajustos › Documents (`capDoc878396`),
      l'emissor del compte (`emissorTecnic878396`; abans hi deia sempre «Héctor Cubero · Arquitecte tècnic»), els agents clau (sense els
      «Pendent»), assistents, text, croquis, fotos, documents, les quatre caselles de signatura i el peu. `htmlDoc878405` dona l'HTML exacte de
      qualsevol document (vista, impressió i PDF).
    - Supabase de proves: Gmail simulat (`POST /gmail/v1/users/me/messages/send`, `GET /__gmail` amb els correus descodificats, `POST
      /__gmail {noActiva}`). Estils `src/theme-v878405.css`. Prova: `enviar405test.mjs` (19). Adaptades `whatsapp402test` i `facturacio337test`.
  - **V87.406 · Els assistents de l'acta, de Contactes** (l'Héctor, 26/10/2026: «surtien per defecte un llistat immens de tots els
    contactes, molts repetits… ha de sortir el mateix que la pestanya Contactes i marques els que t'interessen de cada paquet… si algun no
    està creat m'ha de deixar crear-lo i s'incorpora a Contactes… de Héctor n'hi havia fins a 4»):
    - **Causa:** la llista de l'acta ajuntava els agents de totes les obres, la llista vella `aco_global_agents_v87102` (proves de versions
      d'abans) i tres agents fixos de `baseAgentsForObra8768` (un «Héctor Cubero» amb el correu inventat `hector@despatx.cat`).
    - **Ara** (`AssistentsActa878406`, pestanya «Agents» de l'acta): els paquets i les persones de Contactes (`filesContactes878406`, la
      mateixa funció que la pantalla Contactes; abans era dins del seu `useMemo`), plegats, amb casella; a dalt «Assistents d'aquesta acta
      (N)» amb una × per treure'n; cercador; «+ Nou contacte» (la fitxa de Contactes, `EditorContacte878315`): es desa a Contactes
      (`clientNou878406`, ara comú) i queda marcat. L'App dona la llista i el contacte nou per `window.__acoContactes878406` i
      `window.__acoNouContacte878406`.
    - **A l'acta:** `triaAss878406` (si la persona ja era un agent, el mateix id amb les dades del contacte; si no, un id nou) i
      `treuAss878406`; la còpia de cada assistent va a `acta.assistents878406` (així l'acta el troba encara que l'obra no el tingui;
      `agentsD878406`). Fora «Gestionar agents», la llista vella i «Agents utilitzats en actes anteriors».
    - **Tècnics:** titulació i número de col·legiat a la fitxa del contacte (`EditorContacte878315` i `FitxaClient`; camps `titulacio` i
      `collegiat`, com a la fitxa de l'agent de l'obra). `clientAsAgent878192` també porta el mòbil, la titulació i el col·legiat.
    - Estils `src/theme-v878406.css`. Prova: `assistents406test.mjs` (15). Adaptada `enviar405test`. Lliçó 12 (Visites) del manual i del vídeo
      posada al dia.
  - **V87.407 · «Enviar» amb el PDF a tots els documents** (l'Héctor, 27/10/2026: «a l'hora d'enviar pressupostos, certificacions i
    factures passa el mateix i no es pot»; l'acta ja l'enviava bé amb el Gmail): fins ara només l'acta i la vista d'un document passaven el
    document a la finestra «Enviar» (`emailDraft(title,{doc})`); la resta l'obria sense PDF.
    - **Ara porten el PDF:** el pressupost d'obra (Accions › Enviar, `budgetPrintDoc878179`), la certificació (la general a origen,
      `certPdfDoc878407`, separat d'`openCertPdf87216`), la factura de l'obra (`docFactura878337`), la factura VeriFactu
      (`enviaVF878407`), la proforma sense factura (botó nou, `docPf878407`), la Facturació de l'empresa (`docDe878407`, també des del seu
      PDF), el pressupost i la factura d'honoraris de l'expedient i la vista prèvia d'aquests (`QuotePreview8743`, que surt a Pressupostos i
      a Facturació del tècnic, ara amb «Enviar»), i la Facturació del tècnic (botó nou a cada factura). `docQuote878407(type,doc)`.
    - Des de qualsevol pantalla: `window.__acoEnviar878407({title, obra, doc|pdf})` (`enviaDoc878407` de l'App: els destinataris de
      l'obra que toca, no de l'oberta).
    - La finestra «Enviar» accepta també un PDF ja fet (`draft.pdf.blob`): s'adjunta tal com és (per als PDF signats de la V87.408).
    - Prova: `enviar407test.mjs` (23, Gmail simulat, constructora i tècnic). Adaptada `whatsapp402test` (amb el PDF, a l'ordinador el
      WhatsApp el descarrega i la finestra ho diu).
  - **Comptes del Pol** (26/10/2026, el fill de l'Héctor, per aprendre l'app, ensenyar-la als clients i treballar junts): `demo-pol-tecnic`
    i `demo-pol-constructor` (amb «demo-», la benvinguda proposa el perfil i les dades d'exemple). Contrasenyes i passos a
    `GUIES_USUARIS\COMPTES_POL.txt` (fora del Git); **els ha de crear l'Héctor al panell de Supabase**. Al Supabase de proves hi són amb
    `prova2026`. Prova: `pol403test.mjs` (6).
  - **Manual d'ús i vídeos** (26/10/2026, encàrrec de l'Héctor: «petits vídeos de 1-2 min per pestanya… i un document de manual d'ús per
    passar als clients»): manual a Claude Docs https://claude.ai/artifact/KUFR7yUTLeXtDsxJY1PqkU (doc `95927636-18fe-4ec4-aaa2-6ebaa1186029`,
    node `2ffb3169-a91a`) i 18 vídeos MP4 a `GUIES_USUARIS\VIDEOS\<NN>-<lliçó>.mp4` (01–03 per a tothom, 11–16 tècnic, 21–29 constructora).
    - **`tools/proves/guia404.mjs`** + **`guia404-llicons.mjs`** (les lliçons: per pas, títol, text, l'element on es toca i les accions):
      entra amb els comptes del Pol al Supabase de proves (núvol nou a cada lliçó, dades d'exemple), fa cada pas al mòbil (390 × 844) i en
      desa la captura i el text a `D:/aco-tmp/guia/<lliçó>/`; després fa el vídeo amb l'Edge (canvas 1280 × 720 + `MediaRecorder` MP4: el
      mòbil a l'esquerra, el text del pas a la dreta i un cercle taronja on es toca). `FASE=captures | video | fulla` (un full amb totes les
      captures per revisar-les) `| manual` (tres pantalles per lliçó en una imatge per al manual); `DUMP=1` llista els botons de cada pas.
    - **`tools/proves/remuxmp4.mjs`**: l'MP4 que grava l'Edge és «a trossos» i sense durada (al Windows o l'iPhone pot sortir 0:00); el
      converteix en un MP4 normal (moov al principi amb la durada). Sense dependències.
    - Quan canviï una pantalla, tornar a gravar la seva lliçó (`node tools/proves/guia404.mjs <lliçó>`) i actualitzar el manual.
    - **Pàgina dels vídeos** https://claude.ai/artifact/NVZiX9pdoePjWkwQotBgXQ (privada; els MP4 i les portades són «assets» de la
      pàgina). Eines a `tools/proves/videos-pagina/`: `portades.mjs` (fotograma del segon 14 de cada vídeo, `T=`), `fes.mjs` (omple
      `plantilla.html` amb `urls.json` i `posters.json`, les adreces `/_blob/…` que torna la pujada, i la durada de cada MP4). Per
      canviar-ne un: copiar els MP4 a `videos-pagina/mp4/`, pujar el nou com a asset de la pàgina, posar-ne l'adreça als JSON,
      `node fes.mjs` i tornar a publicar `videos-control-obres.html` amb la mateixa adreça (`url`).
    - Al manual, cada lliçó té una imatge amb tres pantalles (`FASE=manual`) a sota de «Vídeo: …».
  - **`revisionuvol.mjs` (24/10/2026):** les despeses d'obres compartides ja no surten com a «d'obres que ja no hi són» (el 24/10, 4 de
    Socoterm a «SATE Platja d'Aro», compartida) i revisa també les dades de les obres compartides que no són a cap compte
    (`_obres-compartides.json.gz`). El 24/10: Eden Playa ja quadra; queden les 47 partides de l'Héctor per sobre del 100 % i la
    certificació 1 de Cala Rovira amb l'import desat vell (l'app ja fa servir el de les partides).
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

### Per començar una sessió nova (27/10/2026, després de la V87.407)

> **Tot en català**: la conversa (també les notes curtes entre eina i eina) i els textos de l’app. El 25/10 se’n van escapar en anglès i
> l’Héctor s’hi va enfadar molt. Abans d’enviar qualsevol línia, comprovar que és en català.

**Estat (publicada la V87.406 a Render):**
- **Tècnic** (l’Héctor i `oriol`, `marti`): expedients amb paquets i filtres, encàrrecs tècnics (cèdula, CEE, ITE, amiant: passos, documents
  i enllaços), honoraris (calculadora, pressupostos i factures), Hores, Les meves despeses (per apartats, gestoria), Facturació (estats,
  cobraments, gestoria, gràfiques per comparar anys), Rendiment, Contactes, Agenda amb Google Calendar i nota de veu, Visites (actes i notes), Documents.
- **Constructora i gestió total** (`brava`, `socoterm`, comptes `demo-*`): obres, importar obres i factures d’anys anteriors, Amidaments
  (PDF, Excel, BC3) i pressupost automàtic (banc de preus amb IPC, obres anteriors, IA per copiar i enganxar), Preus i marges,
  Pressupost (fases, comissió amagada, resum, fitxa de la partida), Certificacions, Partes d’obra, Despeses (grups, columnes, mà d’obra
  per dies, importar Excel, gestoria), Hores del personal i Fitxatge, Empresa (dades, treballadors, documentació, industrials,
  Calendari laboral), Planning (vinculacions, partides, qui hi treballa) i Agenda › Equip, Rendiment de l’obra i de l’empresa,
  Facturació de l’empresa (sèrie pròpia, cobraments, gestoria, gràfiques per comparar anys).
- **Per a tothom:** mòbil i iPad «tot recollit», accessibilitat (contrast, 12 px, 36 px per al dit, focus), Ajustos per blocs
  (Imatge de l’empresa amb logo i color, Documents amb 7 estils d’encapçalament, accessos ràpids…), castellà, sense cobertura.
- **No fet:** perfils autònom i promotor amb compte propi, IA al servidor (albarans, pressupost-ia: cal la clau d’Anthropic i el sí de
  l’Héctor), VeriFactu al servidor (ATURAT), fitxatge des del mòbil de cada treballador (fase 2), Google Drive dins de l’app.

**Què fer, per ordre:**
1. **Llista de l’Héctor (26/10/2026, «posa-ho en llista i continua»; publicar cada versió i dir-li-ho):**
   - ~~Propostes visuals~~ (V87.400): esperant que validi a https://claude.ai/artifact/1sPHEQWBTS529xEieexRDd (Sí / No / Canviar-la); les
     validades, per a tothom.
   - ~~Pressupost dictat~~ (V87.401). ~~WhatsApp i pressupost acceptat/rebutjat~~ (V87.402). ~~Signatura a la pantalla~~ (V87.403).
   - ~~Comptes del Pol, manual d’ús i vídeos~~ (26/10/2026; vegeu la V87.404): **l’Héctor ha de crear els dos comptes al panell de
     Supabase** (`GUIES_USUARIS\COMPTES_POL.txt`) i compartir el manual i la pàgina dels vídeos amb el Pol.
   - Després: descompte al pressupost d’obra · obra nova en
     3 passos · revisor del pressupost · parte per veu · previsió de caixa. Estudi del mercat: https://claude.ai/artifact/67earcqHnbhfC3RQyj4nv6.
   - **Esperen (cost o servidor):** IA directa, VeriFactu, bot de WhatsApp, banc, cobrament en línia, signatura a distància, fitxatge fase 2.
2. **Comodoro:** fet a les V87.398–399 («Tornar a llegir els descompostos d’un Excel…»: 63 partides, 62 al cèntim); falta que l’Héctor hi triï l’Excel v07.
3. **Repàs complet de les proves: fet a la V87.399** (26/10/2026, `D:\aco-tmp\totes-wt.sh` a `D:\aco-tmp\wt379`, resultat a
   `D:\aco-tmp\totes-399.txt`): **111 proves, totes en verd**. A la tanda en van fallar 5 (honoraris332, pdfpressupost, seguiment321,
   perfils326 —penjada 3 hores— i primerobrir) i, passades soles, totes bé; `primerobrirtest` adaptada (accepta les descripcions netes de la
   V87.396). `contrasenyestest` (18 de 34) es va arreglar esborrant `D:/aco-tmp/vitecache-main`. Per tornar-lo a fer: posar `wt379` al
   commit d’ara (`git -C D:/aco-tmp/wt379 checkout --detach <commit>`) i **copiar-hi `tools/proves`** (no és al Git).
4. ~~Descompostos: el BI sobre el CD i la importació d’un sol descompost~~: fet a la V87.399.
5. Les guies PDF de benvinguda (`GUIES_USUARIS`, amb contrasenyes: **només quan ho digui l’Héctor**; els textos de `guies.js` ja són al dia
   fins a la V87.394; falta posar-hi Ajustos › Documents).
6. La resta de sota (VeriFactu ATURAT, IA al servidor, fitxatge fase 2, Google Drive, perfils autònom/promotor…), sempre amb el sí de l’Héctor.

**Problemes coneguts:**
- Les proves s’han de passar d’una en una o amb la màquina tranquil·la: amb dues alhora en fallen d’aleatòries (fitxatge, horesunic,
  importobres, contrasenyestest…). En aturar un repàs, el guió (`bash totes-wt.sh`) i els seus servidors poden quedar vius: tancar-los amb
  PowerShell (processos `node`/`bash`/`msedge` amb `aco-tmp` a la línia d’ordres). Les captures fetes a mà (`D:/aco-tmp/cap396`) també
  deixaven navegadors oberts.
- `sessiotest` (cas 2) i `contrasenyestest` fallen de vegades (memòria cau de Vite: esborrar `D:/aco-tmp/vitecache-main`).
- Al terminal (Git Bash), les barres inverses dels heredocs i de `node -e` es perden: per a pedaços amb expressions regulars, escriure
  el fitxer amb l’eina d’escriure fitxers.
- Dades de l’Héctor a revisar: 47 partides per sobre del 100 % i la certificació 1 de Cala Rovira amb l’import desat vell (`revisionuvol.mjs`).

### La resta

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
- Obres compartides: hores, agenda i albarans no es comparteixen; «només consulta» no es bloqueja a la pantalla (l'Héctor, 25/10/2026:
  «de moment no»: no en comparteix cap així; si cal, un mode propi, no el `readOnly` del portal, que també limita les pestanyes).
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
