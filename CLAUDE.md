# APP Control d’Obres — guia per a Claude

> Idioma: parla amb l’usuari (Héctor, arquitecte tècnic de Girona) **en català**. Tota la
> interfície de l’app és en català. Explicacions curtes, pas a pas, sense jerga.

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
  - Taula antiga `aco_user_state` (V87.121): ja sense accés anònim, dades velles de juliol.
  - Edge Function `llegir-albara` (codi a `supabase/functions/llegir-albara/index.ts`) per llegir albarans
    amb Claude (Anthropic, model Haiku 4.5). **Encara no desplegada.**
- **Publicació**: Git a l’ordinador → GitHub `https://github.com/Gica-hnpa/app-control-obres-hc`
  (privat, branca `main`) → **Render** `https://app-control-obres-hc.onrender.com`, que compila sol
  (`npm run build`) a cada pujada. El `dist` no es puja.
  Git és a `C:\Program Files\Git\cmd\git.exe` (si l’ordre `git` no es troba, fer servir la ruta sencera).

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
| **Héctor** (propietari) | núvol amb el seu correu + app `hector` | Tot: expedients, pressupost, certificacions, factures, temps, agenda, albarans, configuració, compartir obres. Les seves dades també es desen a `DADES`. |
| `pol` | intern (prova) | Administrador de prova, espai buit. |
| Portal client intern (`socoterm` intern, mòdul 2) | pantalla interna | Només les obres del seu client i les pestanyes permeses (`allowedTabs`). Lectura, amb edició limitada de pressupost i certificacions. |
| **Comptes d’empresa del núvol** (`brava`, `socoterm`, `oriol`, `marti`) | usuari curt + contrasenya | Espai propi buit (`aco_v8782__emp_<usuari>__…`), administrador del seu espai. La primera vegada trien nom i perfil **Constructor** o **Tècnic**. Albarans per a tots dos perfils. Veuen les obres que algú els ha compartit, amb l’etiqueta «Compartida per…». |

## Decisions importants (no desfer sense parlar-ne)

- **Git en lloc d’una carpeta per versió** (des d’octubre 2026): es treballa sempre a `app-control-obres`;
  cada versió és un commit «V87.XXX – què canvia». Res es puja a GitHub sense el sí de l’Héctor
  (cada pujada es publica a Render). El número es manté a `App.jsx` (`app_version`), `package.json`,
  `theme-v87249.css` (`content:"V87.XXX"`), `cloudSync.js`/`localDiskSync.js` (`VERSION`) i els `.bat`.
- **Comptes de prova al navegador**: provar `oriol`, `brava`… en una finestra InPrivate. Si el navegador
  queda amb la sessió del núvol d’una empresa, l’app obre l’espai buit d’aquella empresa (va passar el
  10/10/2026; les dades no es van perdre: «Sortir» i tornar a entrar amb el correu de l’Héctor).
- **Inici sense dades econòmiques** (l’Héctor té clients diversos); l’econòmic va dins de l’obra.
- Interfície **«menys és més»**: res repetit, botons clars, pensat també per a tercers i per al mòbil.
- **Mai tocar el fitxer real de `DADES`** en proves: fer servir còpies i `ACO_DADES_DIR`.
- **Sincronització**: es puja només el que canvia; **si una peça ha canviat al núvol des d’un altre aparell,
  guanya el núvol**; **fre de seguretat** si un aparell vol esborrar o buidar 3+ obres; la primera connexió
  només es dona per bona si acaba sencera. Restauració forçada: marca `forcarNuvol: true` al fitxer DADES.
- **Comptes separats al mateix navegador** per prefix `emp_`; les dades d’empresa no entren mai al fitxer DADES.
- **Fotos d’obra i albarans en claus pròpies** (`aco_obra_foto_v878259_<id>`, `aco_albara_foto_…`,
  `aco_albara_pdf_…`), reduïdes; abans es treien per pes i no es desaven.
- **Obres compartides**: no es copien a l’espai de l’altre compte; viuen a `aco_shared`.
- Lectura d’albarans: 1) IA directa (si la funció existeix) → 2) text del PDF → 3) ChatGPT copiar/enganxar.

## Pendent o a mitges

- **Esborrar de l’historial de GitHub la còpia de dades de juliol**
  (`DADES_REPARADES/app-control-obres-hector-backup-reparat-v87-211-2026-07-22.json`, dades reals de clients).
  Es va treure del repositori a la V87.259.2, però continua als commits antics. Cal reescriure l’historial
  (git filter-repo o BFG) i forçar la pujada; fer-ho amb calma i amb còpia abans.
- **Lectura d’albarans amb IA directa**: falta clau d’Anthropic + desplegar la funció
  (`INSTRUCCIONS_LECTURA_ALBARANS_IA.txt`).
- **Hores per treballador** (constructors) i mòduls per a **autònoms / operaris / promotors**.
- **Portal de client amb compte de núvol propi** (avui els clients només tenen el portal intern).
- Obres compartides: hores, agenda i albarans no es comparteixen; «només consulta» no es bloqueja a la pantalla.
- Seguretat: contrasenyes internes escrites al codi (comptes `hector`, `pol`, `socoterm`); polítiques antigues
  de Supabase Storage (documents) encara anònimes; considerar Supabase Pro en comercialitzar.
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
  - `node mocksupabase.mjs 5490 dump.json` → Supabase de proves (auth, `aco_kv`, `aco_shared`, funció d’albarans).
  - Servidor A (ordinador): `set ACO_DADES_DIR=<còpia>&& set VITE_CLOUD_URL=http://localhost:5490&& npx vite --port 5196`
  - Servidor B (com Render, sense disc): `set ACO_SENSE_DISC=1&& set VITE_CLOUD_URL=http://localhost:5490&& npx vite --port 5198`
  - Proves amb Edge headless + CDP: `cloudtest*.mjs`, `sharetest.mjs`, `emptest.mjs`, `pdftest.mjs`, `fototest.mjs`…
    (perfil del navegador en una ruta curta, si no IndexedDB falla).
  - `compare.js` + `extractor.js`: comparar pressupostos i certificacions entre dues còpies.
- Abans de llançar dos servidors de la mateixa carpeta, deixar arrencar el primer (memòria cau de Vite).
