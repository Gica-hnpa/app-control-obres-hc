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
  - Projecte: `https://bdjendguvbevyowghzfh.supabase.co` (projecte «app control de obras», regió **Frankfurt** `eu-central-1`; pla **Pro** des del 27/10/2026, Micro: ja no es pausa).
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
  - Edge Function `aco-ia` (V87.458, `supabase/functions/aco-ia/index.ts`): tota la IA de l’app (albarans, factures, PDF,
    pressupost i preus) amb Claude. **Instal·lada el 2/11/2026** (passos a `docs/pressupost-ia.md`).
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
│  ├─ supabase\*.sql · supabase\functions\aco-ia\
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

> **Les decisions de cada apartat i les notes de cada versió (V87.xxx) són a `docs/decisions-i-versions.md`.**
> No es carrega sol: abans era aquí i el CLAUDE.md va arribar a 528 KB (la conversa ja no cabia ni compactada).
> Abans de tocar un apartat, busca-hi amb Grep (p. ex. `V87.408`, `Sincronització`, `VeriFactu`) i llegeix només aquell tros.

Les que cal tenir sempre presents:

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
- **VeriFactu ATURAT (17/10/2026, ordre de l'Héctor): no instal·lar res del servidor** (ni `aco_verifactu_v87285.sql` ni la
  funció `verifactu`, ni secrets, ni comptes de Verifacti) **fins que l'Héctor ho hagi parlat amb la gestoria**. L'app
  publicada (V87.287) no mostra «Emetre factura» mentre la funció no existeixi. Des de la V87.297, la nota de VeriFactu
  de Facturació obra només surt si el compte el té actiu.

## En publicar una versió

- L'entrada «V87.XXX · …» va **al final de `docs/decisions-i-versions.md`** (a «Versions noves»), no aquí. Al CLAUDE.md
  només es posa al dia «Estat (publicada la V87.XXX a Render)» i, si cal, «Pendent o a mitges».
- `docs/decisions-i-versions.md` entra al `git add` de la versió quan canvia.
- **No copiar el CLAUDE.md a la carpeta de dalt** (`APP GESTIO OBRES\CLAUDE.md`): Claude carrega tots dos alhora i
  ocupaven el doble. El de dalt només diu on és aquest.
- Mantenir aquest fitxer per sota de 50 KB: el que sigui història va a `docs/decisions-i-versions.md`.

## Pendent o a mitges

### Per començar una sessió nova (28/10/2026, després de la V87.412)

> **Tot en català**: la conversa (també les notes curtes entre eina i eina) i els textos de l’app. El 25/10 se’n van escapar en anglès i
> l’Héctor s’hi va enfadar molt. Abans d’enviar qualsevol línia, comprovar que és en català.

**Supabase (27/10/2026, resolt):** pel correu de la transferència (11,56 GB de 5,5 GB), l’Héctor ha passat l’organització «Héctor» a **Pro**
(25 $ al mes, 250 GB, límit de despesa activat) i el projecte de l’app (**«app control de obras»**, bdjendguvbevyowghzfh) a **Micro** (inclòs).
El projecte vell **«app gestion de obras»** (de les primeres versions) és en una organització gratuïta, **pausat** (es pot reprendre fins a
l’1/12/2027 i se’n poden baixar les dades). La V87.408.1 treu la causa del consum (vegeu-la).
L’SQL de la **V87.409** (enllaç per signar) ja és executat (el 27/10 a la nit l’enllaç funcionava). **Gmail API:** el 28/10 a l’Héctor li
sortia «falta activar la Gmail API»: console.cloud.google.com/apis/library/gmail.googleapis.com › projecte «Control d’obres» › Habilitar.
**AutoFirma:** «No s’ha pogut obrir» era l’app que tallava la connexió (V87.411); falta que l’Héctor ho torni a provar.

**Estat (publicada la V87.580 a Render):**
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
- **Enviar i signar:** tots els documents s’envien des del Gmail amb el seu PDF (V87.405–407; l’Héctor ja ha enviat una acta així);
  l’acta, el pressupost i la certificació se signen amb certificat digital amb l’AutoFirma (V87.408; falta que l’Héctor ho provi amb el seu),
  també a distància amb un enllaç perquè tothom signi el mateix PDF (V87.409).
- **Previst i imprevistos** (V87.410–413): pressupost original separat de les partides noves, «Pressupost inicial…» des de l’Excel original
  (Verbania: 55 iguals i 28 noves a la fase principal), dos PDF (original i imprevistos), resum amb totes les partides; les noves i les que
  pugen en taronja, «Marcar com a nova» a mà (V87.413; l’Héctor ha de marcar la 3.09 i la 3.10 de Verbania), i als imprevistos mai el que baixa;
  partides que no s’executaran (tota o en part) en vermell i el resum de l’obra amb gràfic als PDF de les certificacions (V87.423).
- **Compartir només el Pressupost i les Certificacions** (V87.424): l’altre compte (p. ex. el Martí) hi fa la seva certificació i tots dos la comparen.
- **Documents en fulls A4** (V87.425): la vista prèvia i el PDF, vertical o horitzontal segons la pàgina (el quadre a origen ja no surt tallat).
- **L’Econòmic de l’obra en targetes plegables iguals** (V87.426, Bloc 1): Pressupost, Certificacions, Facturació, Despeses i Rendiment;
  «Editar · Imprimir · Accions»; enviar una factura perquè la tornin signada.
  V87.427: el pressupost també és una targeta plegable, les partides noves i els imprevistos en una targeta a part i el número de les partides al mòbil.
  V87.428: «Tancar el pressupost» / «Reobrir-lo», un sol nom («Fora de pressupost»), les accions a la vista a l'ordinador i la gràfica del Rendiment a baix.
- **Dades de l’obra amb Contactes** (V87.414): els camps buits o de farciment s’omplen amb la fitxa de Contactes i es tria amb un cercador
  per blocs (sense repetits). **Següent (l’Héctor, 28/10/2026):** repàs usuari per usuari, pestanya per pestanya i subpestanya per
  subpestanya, fent servir l’app de debò (crear, triar, desar, recarregar, comprovar), i publicar una versió a cada tanda.
- **Repàs exhaustiu** (`tools/proves/repas411.mjs`, `WEBROOT=` per passar-lo sobre una còpia): 336 pantalles, PDF, Enviar i Signar.
- **IA instal·lada (2/11/2026):** albarans, factures, PDF, pressupost i preus amb la funció `aco-ia`; de debò només s’ha provat la lectura de despeses.
- **No fet:** perfils autònom i promotor amb compte propi, VeriFactu al servidor (ATURAT), fitxatge des del mòbil de cada treballador (fase 2), Google Drive dins de l’app.

**Què fer, per ordre:**
0. **Seguir `docs/full-de-ruta.md`** (l’Héctor, 28/10/2026: «marquem un camí… si no anem donant tombs d’una pantalla a l’altra»): un bloc
   alhora (el següent: constructora dins de l’obra), el patró de pantalla igual per a totes i els encàrrecs nous a la «Llista d’espera».
   Abans de començar un bloc, llistar-ne les pantalles i el que no segueix el patró, i esperar el sí de l’Héctor.
1. **Llista de l’Héctor (26/10/2026, «posa-ho en llista i continua»; publicar cada versió i dir-li-ho):**
   - ~~Propostes visuals~~ (V87.400): esperant que validi a https://claude.ai/artifact/1sPHEQWBTS529xEieexRDd (Sí / No / Canviar-la); les
     validades, per a tothom.
   - ~~Pressupost dictat~~ (V87.401). ~~WhatsApp i pressupost acceptat/rebutjat~~ (V87.402). ~~Signatura a la pantalla~~ (V87.403).
   - ~~Enviar amb el PDF (Gmail)~~ (V87.405–407). ~~Signatura amb certificat amb l’AutoFirma~~ (V87.408, l’Héctor 27/10/2026: «sempre amb
     certificat»). ~~Enllaç per signar a distància~~ (V87.409; l’Héctor ha d’executar `supabase/aco_signa_v878409.sql`). **Preguntar-li:** el
     «Conforme del client» del parte (encara a la pantalla: no hi ha document ni AutoFirma al mòbil).
   - ~~Comptes del Pol, manual d’ús i vídeos~~ (26/10/2026; vegeu la V87.404): **l’Héctor ha de crear els dos comptes al panell de
     Supabase** (`GUIES_USUARIS\COMPTES_POL.txt`) i compartir el manual i la pàgina dels vídeos amb el Pol.
   - Després: descompte al pressupost d’obra · obra nova en
     3 passos · revisor del pressupost · parte per veu · previsió de caixa. Estudi del mercat: https://claude.ai/artifact/67earcqHnbhfC3RQyj4nv6.
   - **Esperen (cost o servidor):** VeriFactu, bot de WhatsApp, banc, cobrament en línia, fitxatge fase 2.
2. **Comodoro:** fet a les V87.398–399 («Tornar a llegir els descompostos d’un Excel…»: 63 partides, 62 al cèntim); falta que l’Héctor hi triï l’Excel v07.
3. **Repàs complet de les proves: fet a la V87.399** (26/10/2026, `D:\aco-tmp\totes-wt.sh` a `D:\aco-tmp\wt379`, resultat a
   `D:\aco-tmp\totes-399.txt`): **111 proves, totes en verd**. A la tanda en van fallar 5 (honoraris332, pdfpressupost, seguiment321,
   perfils326 —penjada 3 hores— i primerobrir) i, passades soles, totes bé; `primerobrirtest` adaptada (accepta les descripcions netes de la
   V87.396). `contrasenyestest` (18 de 34) es va arreglar esborrant `D:/aco-tmp/vitecache-main`. Per tornar-lo a fer: posar `wt379` al
   commit d’ara (`git -C D:/aco-tmp/wt379 checkout --detach <commit>`) i **copiar-hi `tools/proves`** (no és al Git).
4. ~~Descompostos: el BI sobre el CD i la importació d’un sol descompost~~: fet a la V87.399.
5. Les guies PDF de benvinguda (`GUIES_USUARIS`, amb contrasenyes: **només quan ho digui l’Héctor**; els textos de `guies.js` ja són al dia
   fins a la V87.394; falta posar-hi Ajustos › Documents).
6. La resta de sota (VeriFactu ATURAT, fitxatge fase 2, Google Drive, perfils autònom/promotor…), sempre amb el sí de l’Héctor.

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
- **VeriFactu (1/1/2027 per a les S.L. segons el BOE; Hisenda ha anunciat l’octubre de 2028, encara sense norma: vegeu `docs/verifactu-pla.md`)**: **ATURAT fins que l’Héctor parli amb la gestoria** (no instal·lar res
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
- **Hores per treballador** (constructors) i mòduls per a **autònoms / operaris / promotors**.
- **Portal de client amb compte de núvol propi** (avui els clients només tenen el portal intern).
- Obres compartides: hores, agenda i albarans no es comparteixen; «només consulta» no es bloqueja a la pantalla (l'Héctor, 25/10/2026:
  «de moment no»: no en comparteix cap així; si cal, un mode propi, no el `readOnly` del portal, que també limita les pestanyes).
- Seguretat: Supabase ja és Pro des del 27/10/2026 (les regles antigues d’arxius anònimes es van esborrar a la V87.262).
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
    `--disable-component-update` i amb `TEMP`/`TMP` a `D:\aco-tmp`.
    **3/11/2026: el D: es va omplir (11 GB lliures):** amb el `TEMP` a `D:\aco-tmp`, cada Edge hi continuava deixant un `scoped_dir…` d’uns
    180 MB i en dues setmanes n’hi havia 2.304 (396 GB), més 1.452 perfils vells i 342 carpetes `aco-…` (uns 70 GB); els va esborrar l’Héctor.
    Ara el `TEMP` de cada Edge és **dins del seu perfil** (`path.join(profile,'temp')`), que s’esborra en tancar-lo, i `D:\aco-tmp\passa.sh` dona
    a cada prova una carpeta pròpia (`ACO_PROVES_TMP=D:/aco-tmp/t/<n>`) que s’esborra en acabar. **Una prova nova que obri l’Edge ha de
    fer el mateix** (si en surten de noves, mirar `D:\aco-tmp` de tant en tant).
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
