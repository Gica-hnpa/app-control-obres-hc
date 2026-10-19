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
  - **Pendent:**
    - ajuntar Actes + Notes («Visites»), Dades + Agents, Agenda + Tasques, Rendiment + Seguiment econòmic, i les hores
      dins d’Honoraris o de Rendiment;
    - el botó ＋ dins de l’obra;
    - els noms nous del menú principal.
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
  - **Pendent:** les guies de benvinguda (`tools/proves/guies.js`) encara diuen «Treballs / Expedients».
  - L’etiqueta de l’estat ara surt traduïda.
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
- **Temps a facturar** (V87.291, decisió de l’Héctor del 17/10/2026): **fraccions de 15’ amb un mínim de 30’ per registre**
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
- **Proposta de Despeses, Facturació, menús per perfil i noms**: `docs/proposta-global.md` apartat 10, esperant la seva
  revisió (no canviar res fins que digui sí).
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
- **Abans de tocar `src/`, tancar `OBRIR_APP.bat`**: el servidor de Vite aplica els canvis a l’app oberta amb les
  dades reals (va passar el 13/10/2026 amb la V87.260: es van posar al dia els comptes de l’Héctor abans d’hora).
- Abans de llançar dos servidors de la mateixa carpeta, deixar arrencar el primer (memòria cau de Vite).
