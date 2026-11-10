# Decisions i notes de cada versió

> Abans era dins de `CLAUDE.md`, que va arribar a 528 KB i ja no cabia a la conversa (ni compactant).
> Aquest fitxer no es carrega sol: busca-hi amb Grep (`V87.408`, `Sincronització`, `VeriFactu`…) i llegeix només aquell tros.
> Les versions noves s'afegeixen al final, a «Versions noves».

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
      `demo-constructor`; s’ha de passar de l’1 de març al 31 de desembre). Adaptades `graficatest` (la gràfica
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
  - **V87.408 · Signatura amb certificat digital amb l'AutoFirma** (l'Héctor, 27/10/2026: «ha de ser signatures amb certificat digital
    sempre… que es faci amb AutoFirma com fan els col·legis d'arquitectes»; abans, V87.403, el client signava amb el dit a la pantalla):
    - **Com parla amb l'AutoFirma** (`src/autofirma.js`, protocol v4 del Cliente @firma, el mateix que `autoscript.js` del Ministeri):
      `obre()` (dins del toc: `afirma://websocket?ports=P1,P2,P3&v=4&jvc=4&idsession=<20>`; el navegador pregunta «Obrir Autofirma?») i
      `signaPdf(bytes,{ses,props})`: WebSocket segur `wss://127.0.0.1:<port>` (el certificat local el posa l'instal·lador), eco
      `echo=-idsession=…@EOF` → «OK», `afirma://sign?op=sign&idsession&algorithm=SHA256&format=PAdES&properties=<b64>&sticky=false&dat=<b64>`
      (base64 «url segura»), «#wait» → `getresult?idsession=…` cada 2 s, i `<certificat>|<PDF signat>`. «CANCEL»/«err-11» = cancel·lat;
      `err-XX:= CODI - text`. Propietats en format Java (`propietats()`: els accents com a \uXXXX). Només a l'ordinador (`potSignar`).
      **Comprovat amb l'AutoFirma 1.9 de l'ordinador de l'Héctor (D:\Autofirma)**: l'eco respon «OK» i, amb un algorisme fals, el registre
      (`%USERPROFILE%\.afirma\AUTOFIRMA.afirma.log.xml*`) diu «operación de firma… contenido Base64… Algoritmo de firma no soportado»:
      entén el missatge. **Compte:** l'AutoFirma ensenya els errors en una finestra («Error») i no respon fins que es tanca; i el procés
      d'una prova que només fa l'eco es queda obert (tancar-lo, `javaw.exe` amb «afirma://websocket» a la línia d'ordres).
    - **Llegir les signatures d'un PDF** (`src/signaturesPdf.js`, sense llibreries): cada `/ByteRange` + `/Contents` (CMS SignedData en
      DER), el certificat de qui signa (nom: GN+SN o el CN sense el NIF ni «(R: …)»; NIF del `serialNumber` «IDCES-…»; entitat: FNMT-RCM,
      Consorci AOC (idCAT), DNIe, Firmaprofesional…), la data (`signingTime` o `/M`), el resum del document contra `messageDigest` i la
      signatura (WebCrypto: RSA PKCS#1 i ECDSA; RSA-PSS no es comprova). No es comprova la cadena ni la revocació. `marcaDe`: la marca de l'app.
    - **El PDF per signar** (`htmlAPdfPerSignar` de `pdfDoc.js`): els requadres `[data-signa="rol"]` donen la pàgina i el lloc (mm) on
      l'AutoFirma posa la signatura visible («Signat digitalment per $SUBJECTCN$ i la data», `propsSig878408`, en punts del PDF), i les
      paraules clau porten `aco878408:<tipus>-<ref>:<resum>`. Plantilles amb `perSignar878408`: l'acta (`.sgi` de les 4 caselles, sense
      «Estat»), el pressupost (`signaturaDoc878396(…, cert)` → `caixesSig878408`: Emissor · Acceptat pel client) i la certificació general a
      origen (Direcció facultativa · Constructora · Promotor, `ROLS_CERT878408`). Amb `certSig878408`, la vista diu qui ha signat.
    - **`SignaturaCert878408`** (a l'acta, pestanya «Signatures»; al pressupost i la certificació, Accions › «Signar amb certificat…»): cada
      qui ha de signar amb «Signar amb AutoFirma» (o qui ha signat, nom, NIF, data i entitat), «Enviar per signar» (el PDF d'ara i un missatge
      que demana signar-lo amb el certificat i tornar-lo), «Pujar el PDF signat» (llegeix les signatures; rebutja un PDF sense signatures,
      d'un altre document o amb menys signatures; les noves s'assignen pel NIF o el nom, si no «De qui és?») i el PDF. Cada signatura va a
      sobre de les d'abans: un sol PDF per a tothom. Si el document canvia després de signar-lo (`hash` del contingut), ho diu i «Fer un PDF
      nou per signar» (el d'abans queda a Documents com a «anterior»).
    - **On es desa:** un document de l'obra (`data.documents`, carpeta d'actes, pressupost o certificacions, `carpetaDe878408`) amb
      `linkedType:"signat878408"` i `signat878408:{tipus, ref, titol, hash, signes, signatures:[{rol, nom, nif, org, emissor, quan, valida,
      via}]}`; l'arxiu amb `saveDocFile` (aparell i núvol), un de nou per versió. L'App: `window.__acoSignats878408(obraId)` i
      `window.__acoDesaSignat878408(obraId, rec, {anterior})`.
    - **Enviar** (acta, pressupost, certificació): si n'hi ha de signat, s'adjunta aquest tal com és (`pdf.carrega` a la finestra «Enviar»).
      L'acta signada passa a «Signada»; el pressupost signat pel client (signatura bona) passa l'obra a «Acceptat».
    - **Fora la signatura a la pantalla** a l'acta i al pressupost (les d'abans es veuen i es poden treure). **Es queda** al parte (feina fora
      de pressupost, «Conforme del client»): no hi ha cap document per signar i al mòbil no hi ha AutoFirma. Preguntar-ho a l'Héctor.
    - Estils `src/theme-v878408.css`. Proves: `signatures408unit.mjs` (14, sense navegador, certificats inventats amb openssl:
      `tools/proves/signapdf.mjs` fa certificats i signa PDF com l'AutoFirma) i `signatura408test.mjs` (28: un «AutoFirma» de prova, servidor
      WebSocket segur que parla el protocol i signa; acta, segona signatura pujada, PDF d'un altre document, Enviar amb el signat, cancel·lar,
      sense AutoFirma, pressupost, certificació, mòbil). L'Edge de la prova s'obre amb `--ignore-certificate-errors`; l'app agafa els ports i
      el llançament de `window.__acoAfirmaPorts878408`, `__acoAfirmaObre878408` i `__acoAfirmaEspera878408`. Adaptada `signatura403test`
      (7: ara només el parte i que el pressupost té «Signar amb certificat…»).
  - **V87.408.1 · Menys transferència del núvol** (27/10/2026, correu urgent de Supabase: 11,56 GB de transferència d'un màxim de 5,5 GB al
    pla gratuït; a partir del 28/10, si no es fa res, el núvol respon amb errors 402 fins al cicle de facturació següent o fins a passar a
    Pro; rebaixar el consum no esborra el ja gastat):
    - **Causa:** cada aparell amb l'app oberta, cada 20 s, baixava senceres totes les obres compartides (`aco_shared?select=*`: obra, dades i
      foto; les 12 de l'Héctor fan 3,8 MB → uns 680 MB per hora a cada aparell obert, i uns 540 MB a Brava) i tornava a baixar la darrera
      peça canviada (els 5 s de marge de `pullSince`) i la que s'acabava de pujar des del mateix aparell.
    - **Ara** (`cloudSync.js`): `pullSince` amb cursor demana primer només `key,deleted,device,updated_at` i després el contingut
      (`key=in.(…)`, `pgIn`) de les peces que no tenim; una peça «ja» (`meta.at` amb la mateixa data, i és del marge o d'aquest aparell) només
      avança el cursor (`all` / `rows` a `cycle`). `sharedCycle` demana la llista (`SH_LLISTA`, sense obra, dades ni foto) i l'obra sencera
      només si ha canviat al núvol o no la tenim (`sm.at[obra]` = data del núvol de la versió coneguda, `knowSh(id, x, h, at)`); `shCache`
      (de la sessió) evita tornar-la a baixar mentre espera per aplicar-se. `pujaMeva`: el canvi d'aquí puja igual (PATCH amb `updated_at=eq.`).
      `shareObra` desa la data que torna el núvol. La primera volta després d'actualitzar, cada aparell baixa una vegada les compartides.
    - Prova `egress4091test.mjs` (14; el Supabase de proves compta els bytes que surten, `GET`/`POST /__egress`, i no compta les consultes
      amb la capçalera `x-no-compta`): en 100 s oberta, de 7,9 MB a 14 kB; un canvi de l'Héctor fa baixar només aquella obra; el que es desa
      aquí no es torna a baixar; els canvis d'un altre aparell continuen arribant.
    - Encara gasta: la còpia diària (`tools/copies`, uns 32 MB al dia sense comprimir) i les fotos i documents en obrir obres en un aparell nou.
  - **V87.409 · Signar a distància amb un enllaç** (l'Héctor, 27/10/2026: «fes-ho… si cadascun me'l signa i me l'envia, allà surten totes les
    firmes? Perquè si som 4 agents rebré quatre PDF»: per correu, sí, 4 PDF que no es poden ajuntar; amb l'enllaç, un de sol):
    - **Núvol** (`supabase/aco_signa_v878409.sql`, **l'ha d'executar l'Héctor**; fins llavors l'app envia el PDF per correu com a la V87.408,
      `senseServidor` = 404/PGRST202): taula `aco_signa` (una petició per document: `token` de 64, `pdf` bytea, `versio`, `signades`,
      `estat`, `expira` 60 dies; RLS del propietari, `grant` a `authenticated`). Funcions del propietari (security invoker): `aco_signa_crea`,
      `_llista` (sense PDF), `_baixa`, `_puja` (amb la versió), `_tanca` (l'esborra). Sense compte (security definer, només amb la clau):
      `aco_signa_veure(token)` i `aco_signa_signa(token, versio, pdf, qui)`, que només accepta un PDF que **comenci exactament per l'anterior**
      (la signatura s'afegeix al final), més gran (com a molt +5 MB) i amb la mateixa versió. Les caducades fa més de 30 dies s'esborren soles.
    - **L'app** (`SignaturaCert878408`): «Enviar per signar» crea l'enllaç (`https://app-control-obres-hc.onrender.com/#signa=<token>`,
      `enllacSigna`; `window.__acoSignaBase878409` a les proves) i obre el correu sense adjunt amb l'enllaç; línia «Enllaç per signar a
      distància · fins al …» amb «Copiar l'enllaç» i «Tancar l'enllaç». A l'obra: `signaRemot878409[«tipus-ref»] = {id, token, versio, rols,
      estat: obert|complet|tancat…}` (`window.__acoSignaRemot878409`). L'App (`syncSigna0878409`, una sola alhora: `__acoSyncSigna878409`) mira
      cada 2 min, en tornar a l'app i en obrir la finestra si hi ha versió nova, baixa el PDF, en comprova les signatures, el desa a Documents
      (id fix per versió), aplica «Signada»/«Acceptat» i, si ja hi són tots, tanca l'enllaç. Signar a l'app primer baixa el de l'enllaç i
      després hi puja el nou (`pujaRemot`; si l'acaba, tanca l'enllaç). Un PDF pujat que no comença pel d'ara (signat en paral·lel) es desa a
      part (`linkedType:"signat878408-apart"`, «còpia a part»). «Fer un PDF nou per signar» tanca l'enllaç.
    - **La pàgina de l'enllaç** (`src/SignaRemot.jsx`; `main.jsx` la carrega amb `#signa=` sense arrencar l'app ni el núvol del compte): el
      logo i el color de qui l'envia, el títol, els requadres amb «Signar aquí amb l'AutoFirma» (al mòbil «Pendent» i «obre aquest enllaç en un
      ordinador»), el PDF dibuixat (pdf.js), «Descarregar el PDF», Català/Castellano (de sèrie, l'idioma dels documents de l'obra; si l'enllaç no
      val, el del navegador). Si algú ha signat mentrestant: «Una altra persona ha signat mentrestant. Torna a signar.» Enllaç caducat o tancat:
      «Aquest enllaç ja no és vàlid.» `alwaysCreateRevision` (`propsSig`, `src/signaComu.js`): la primera signatura també s'afegeix al final.
    - Estils `src/theme-v878409.css`. Prova: `signaremot409test.mjs` (32, la mateixa AutoFirma de prova). El Supabase de proves té les funcions
      `aco_signa_*`, `GET /__signa` i `POST /__signa {off}` / `{id, caduca}`; `SENSE_SIGNA=1` = sense l'SQL. Adaptada `signatura408test`
      (amb `SENSE_SIGNA`: el PDF per correu).
  - **V87.410 · Previst i imprevistos, i el resultat dels encàrrecs** (l'Héctor, 27/10/2026, mentre passava a Pro):
    - **Pressupost original** (uns clients: «quan a la certificació afegeixo partides noves fora de pressupost… el pressupost original va
      pujant… s'hauria de diferenciar… sinó no tenim la comparativa del previst amb els imprevistos i el realment executat»). Les partides que
      no eren al pressupost continuen a `partides` (les certificacions les fan servir) però `esFora878410` les separa: `createdFromCert`
      («Afegir feina»), `foraPressupost878349` (parte), `adminMonthlyAuto`/administració, `noPressupost` (a compte) i `extra-excel-…` (noves a
      l'Excel de certificació). Les partides del pressupost certificades no es toquen (`keepBudgetFields878253`), així que «més amidament»
      = certificat a origen (`certQtyTotal8789`) per sobre de la quantitat prevista. **Pressupost**: la capçalera diu «Pressupost original»
      i a sota «+ … fora de pressupost» (`fora878410`); cada partida nova porta l'etiqueta `fora-v878410` (`etFora878410`: «Nova · cert. 2»,
      «Nova · parte», «Per administració», «A compte»). La barra de fases, l'import original. **Certificacions › Resum** i **Rendiment**:
      `PrevistImprevist878410` (`previst878410`: pressupost original · imprevistos = noves + més amidament · previst + imprevistos ·
      executat a origen; «Veure les partides (n)»; plegada al mòbil). **Els documents (PDF) no han canviat**: les partides noves hi surten
      com abans.
    - **Encàrrecs tècnics (CEE…)** («els registres manuals o pel comptador s'han de comptar com a despesa de personal meu al meu preu/h… i les
      pestanyes no són lògiques: calcular honoraris hauria d'anar dins dels pressupostos»): `HonorarisExpedient8778` té «Pressupostos
      d'honoraris» (la calculadora a dins, `calc-dins-v878410`, amb «‹ Tornar als pressupostos»; sense pressupost, la calculadora directament)
      · «Factures honoraris» · «Hores» (el comptador i els registres, `HonorarisTemps`, prop `temps`, quan «Gestió temps» va a Honoraris) ·
      «Rendiment» (prop `rendiment`). A dalt, `ResultatEncarrec878410`: honoraris − despeses − les meves hores = resultat i €/h real
      (`rendEncarrec878410`: honoraris = el facturat o, si no n'hi ha, els pressupostos acceptats o, si cap, els no rebutjats; despeses = les
      de Despeses amb aquell expedient i les del registre —km, dietes—; hores × el preu de cada registre o el de sèrie,
      `defaultRate878255`). `RendimentHonorarisExpedient878120` amb les mateixes xifres (fora la «Lectura ràpida» i el donut «Relació»). A
      «Despeses» de l'expedient, `HoresDespesa878410` («Les meves hores · 2,00 h · 80,00 €», «Veure-les» va a Honoraris › Hores o a l'apartat
      Hores). Al perfil `tecnic` (comptes `oriol`, `marti`, `demo-tecnic`) els encàrrecs no tenen «Despeses» (`tabsPerfil878326`).
      Arribar a l'obra per «Gestió temps» o «Rendiment» (el ＋ del mòbil, l'Inici…) obre aquella pestanya (prop `inici`); tocar «Pressupostos
      d'honoraris» sempre torna a la llista (des d'on es pot fer un pressupost a mà).
    - Estils `src/theme-v878410.css`. Prova: `v410test.mjs` (25: constructora, tècnic, gestió total i mòbil). Adaptades (les hores són a
      Honoraris › Hores i la calculadora dins dels pressupostos) `honoraris332test`, `comptador382test`, `tempstest`, `clientsvirtuals` i `v366test`.
  - **V87.411 · Els dos PDF del previst i els imprevistos, el resum amb totes les partides i l'AutoFirma que tarda** (l'Héctor, 28/10/2026 a la nit):
    - **Per què no lligava Verbania** (16.000 a la capçalera i 22.500 als imprevistos): a la fase 2, 16.260,69 € de partides noves + 6.323,00 € de
      tres partides del pressupost certificades per sobre del previst (02.10, 02.14, 03.03). Ara la capçalera i la targeta diuen el mateix: a
      la targeta, «Fora de pressupost …» i «Més amidament …» a sota dels imprevistos (`desg-v878411`); la capçalera fa servir `previst878410`.
    - **Dos PDF** (a «Previst i imprevistos» —Certificacions › Resum i Rendiment— i a Pressupost › Accions): **«PDF del pressupost original»**
      (`docPresOriginal878411`, el pressupost sense les partides noves, `original878411`) i **«PDF dels imprevistos»** (`docImprevistos878411`, tipus
      `imprevistos878411`, plantilla `imprevistosPrintHtml878411`: resum, partides noves per capítol amb l'etiqueta i el certificat, i el més
      amidament amb previst, certificat i diferència). S'obren al visor de l'App per `window.__acoObreDoc878411`.
    - **Partides noves en taronja** també a Certificacions › Partides (`fora-row-v878411`) i als PDF del pressupost i de les certificacions
      (`fora-et-v878411`, amb `etFora878410(r,D)` en l'idioma del document).
    - **Resum de certificacions amb totes les partides** (`resumCert878411`, `CertResumV69`): «Capítols · Totes les partides» (de sèrie totes,
      es recorda a l'aparell, `aco_resum_vista_v878411`); les certificades en verd (`feta`), les noves en taronja (`nova`) amb «+ import» a la
      columna del pressupost i sense sumar-lo; a baix, «Pressupost original», «Fora de pressupost» i el total (amb el pressupost original).
      L'import pendent es compta partida per partida. Al mòbil, la llista de partides dins de cada capítol (`parts-m-v878411`).
    - **«Només aquesta certificació»**: l'import del capítol a la dreta (`td.num`; no era expressament).
    - **Registres d'hores**: «Presa de dades» i «Desplaçament» (temps del viatge, a part dels km) als tipus de feina i a les tasques; a
      l'ordinador «Editar» obre un formulari a sota de la fila (`edit-form-v878411`; abans els camps es tallaven dins de les columnes); al mòbil
      i l'iPad, la fitxa de sempre. La taula ja no fa 1.150 px fixos.
    - **AutoFirma que no s'obria** (registre de l'ordinador de l'Héctor: l'AutoFirma escoltava, però la primera connexió segura trigava ~30 s
      i l'app la tallava a 1,8 s; en tallar-la, l'AutoFirma es tanca sola): ara cada intent espera fins al final (`intenta(port, ms)`,
      `ESPERA_MAX` 120 s).
    - **Correu amb l'enllaç en blau** (`googleMail.js`: `multipart/alternative` amb `htmlCos`) i la frase «Us envio … per signar-lo» sense repetir.
    - **Gmail API**: a l'Héctor li sortia «falta activar la Gmail API» → console.cloud.google.com/apis/library/gmail.googleapis.com, projecte
      «Control d'obres», Habilitar.
    - Estils `src/theme-v878411.css`. Prova: `v411test.mjs` (27; `NOMES=1345`). Eina nova `repas411.mjs` (repàs exhaustiu: pantalles, camps
      tallats, PDF, Enviar i Signar de cada apartat; informe a `D:/aco-tmp/repas411`).
  - **V87.412 · El pressupost inicial i els documents amb els mateixos botons** (l'Héctor, 28/10/2026: «recuperar a Brava els pressupostos
    inicials i separar les partides noves… sense que s'esborri res de les certificacions»; «simplifica… varies de veure PDF»):
    - **Pressupost › Accions › «Pressupost inicial…»** (`PressupostInicial878412`): compara el pressupost d'ara amb l'Excel, BC3 o PDF original
      (els de Documents de l'obra o «Un altre arxiu…»; `partidesArxiu878412` amb els lectors dels Amidaments) o el fixa «Tal com és ara».
      `src/pressupostInicial.js` (`compara`, funció pura): primer pel codi si el text s'assembla (`semblanca` ≥ 0,5; a Verbania la fase principal
      es va renumerar: la 02.03 d'ara no és la de l'Excel), després pel text igual o molt semblant amb la mateixa unitat; les de l'Excel que són
      en un altre pressupost de l'obra no compten com a tretes (`window.__acoDadesObra878412`). Ensenya Iguals · Han canviat · Noves · Ja no hi
      són (amb casella per no comptar-les) i «Fixar-lo com a pressupost inicial».
    - **Res no s'esborra:** a cada partida aparellada `ini878412 = {q, pu}` (la quantitat i el preu d'aleshores), les noves `noInicial878412`
      (`esFora878410` les compta com a noves) i a la fitxa del pressupost (l'entrada de `pressupostos` amb `budgetId`; les dades del pressupost
      triat només desen partides, pressupostos, certificacions i factures) `inicial878412 = {nom, font, at, total, n, tretes}`
      (`iniPres878412`). «Treure’l» ho desfà.
    - `previst878410` amb l'inicial: previst = Σ partides al preu i la quantitat inicials + les tretes; imprevistos = fora de pressupost + més
      amidament + **canvis de quantitat o preu** (`canviada878412`) + **ja no hi són** (negatiu). Targeta, capçalera, resum (columna
      «Pressupost» amb l'import inicial, etiqueta «Canviada», fila «Eren a l’inicial i ja no hi són»), PDF del pressupost original (amb els
      valors inicials i les tretes) i PDF dels imprevistos (seccions noves).
    - **Simulació amb les dades de debò** (còpia del 27/10 i l'Excel de Verbania de `COPIES_NUVOL/arxius`, només llegint): fase principal 55
      iguals i 28 noves (les «Base» afegides a mà) → inicial 100.357,57 € (no 142.382,31); fase P1 55 iguals, 2 amb el preu canviat (02.03,
      02.17) i 3 noves. David Fuster i Cala Rovira 11 no tenen l'Excel a Documents: cal «Un altre arxiu…».
    - **Documents amb els mateixos botons** (`BotonsDoc878412`, al visor `DocViewer` i a la vista d'honoraris `QuotePreview8743`): Tancar ·
      Enviar · **Descarregar el PDF** (un PDF de debò amb `htmlAPdf`; al mòbil, «Compartir» amb el PDF) · Imprimir. Fora «Descarregar document» i
      «Compartir» (feien un HTML), «Imprimir / Guardar PDF», «Imprimir / PDF». **Acta:** un sol «PDF de l’acta» (fora «Previsualitzar acta» i
      «Obrir acta formal / imprimir»; la vista prèvia de dins de l'acta ja no hi és).
    - **Facturació de l'obra:** «PDF» de la proforma obre el document (abans «Imprimir / PDF» imprimia directament); amb factura, només «PDF
      factura» i el seu «Enviar» (la proforma era el mateix document). **Documents:** «Enviar» a cada document amb l'arxiu adjunt (fora
      l'«Enviar» general, que no adjuntava res).
    - **Repàs exhaustiu de la nit del 28/10** (`repas411.mjs` sobre la V87.411: 4 comptes —tècnic, constructora, gestió total i una còpia de
      les dades de l'Héctor—, ordinador i mòbil, 336 pantalles, i a l'ordinador tots els PDF, «Enviar» i «Signar amb certificat» de cada
      apartat i de la primera acta): **cap error de JavaScript ni res que surti per la dreta**; 62 avisos de text tallat que eren 7 coses,
      arreglades: el text de les feines pendents (ara un `textarea.txt-in-v878412` que passa de línia), l'estat a Expedients (172 px),
      Obra i logística al mòbil (una columna), el tipus de treball de la calculadora d'honoraris (dues columnes), els noms del Planning (dues
      línies), els Ajustos del pressupost (columnes de 260 px i l'adreça de l'obra en un `textarea`) i Documents › Enviar.
    - Estils `src/theme-v878412.css`. Proves: `inicial412unit.mjs` (10) i `v412test.mjs` (23). Adaptades `docmobiltest`, `documentstest`
      (l'acta es mira al visor), `assistents406test`, `enviar405test`, `enviar407test`, `factclienttest`, `vfemetretest`, `clientsvirtuals`
      (el «PDF» de la proforma), `seguiment321test` (el text de la feina és un `textarea`) i `pressupost368test` (logística en una columna).
  - **V87.413 · Partides noves i partides que pugen, en taronja; marcar-les a mà** (l'Héctor, 28/10/2026, ordenant el pressupost de Verbania
    per a una entrega: «si afegeixo una partida nova… que es vegi en taronja… si en alguna partida de la certificació s'hi han afegit més
    unitats, la descripció també en taronja… a la llista de les noves, també les que han pujat; a la baixa, mai»; «la 3.09 i la 3.10 no posa
    res de nova i ho són»):
    - **Amb el pressupost inicial fixat**, una partida que s'hi afegeix després (editant, de Preus, dictada, d'un Excel…) queda marcada sola
      com a nova (`noInicial878412`, un efecte d'`Obra` que la marca quan arriba a les dades). Sense l'inicial fixat, les partides que
      s'afegeixen al pressupost en són part (com abans).
    - **Marcar a mà** (`NovaPartida878413`, `marcaNova878413`): a la fitxa de la partida del pressupost (tocant-ne el concepte, fora d'edició es
      desa al moment amb `persistBudgetCaps878179`) i a «Fitxa / accions» de la certificació: «Marcar com a nova» (`nova878413`) o, si ho és,
      «No és nova» (`noNova878413`). La marca a mà mana sobre tot (`esFora878410`) i l'efecte no la toca. No al portal de client.
    - **Partides que pugen** (`puja878413`, `qBase878413`, `mesQ878413`): certificades a origen per sobre de la quantitat d'ara (o de la
      inicial, si era més gran) o amb més import que a l'inicial. En taronja (`taronja878413` → `nova-v878413` / `puja-v878413`) al pressupost
      (la descripció i la fila, també al mòbil, amb l'etiqueta «+N ut»), a Certificacions › Partides (al moment, mentre s'escriu la quantitat),
      al resum «Totes les partides» (abans verdes) i als PDF de les certificacions (la descripció en `#9A3412`; al PDF del pressupost, només
      les noves).
    - **Imprevistos (`previst878410`) només el que puja:** les partides noves, el més amidament (per sobre de `qBase878413`) i «Més quantitat
      o preu que a l’inicial» (abans «Canvis de quantitat o preu», també a la baixa); fora «Ja no hi són» de la targeta, el total i el PDF dels
      imprevistos (es queden al pressupost original i a la fila del resum).
    - Estils `src/theme-v878413.css` (el fons de la fila guanya `background:transparent!important` de `theme-v87257`; al mòbil, el concepte
      amb `>span:first-child strong`). Prova: `v413test.mjs` (24). Adaptada `v412test` (5 i 8: sense el que baixa).
    - Proves del 28/10 adaptades als botons de la V87.410–412: `perfils326test` (textarea de la feina), `simple354test` i `graficatest` (el
      rendiment de l'encàrrec és una pestanya d'Honoraris), `v365test` («Enviar» a cada document) i `alhorarealtest` (no compta els avisos
      `GSI_LOGGER` de la finestra de Google, que el navegador de proves bloqueja). Totes les proves de la V87.412: 119, i passades soles les
      que fallaven, totes bé (`contrasenyestest` a `wt379`: la memòria cau de la carpeta principal es fa malbé).
  - **V87.414 · Dades de l'obra amb Contactes: els camps s'omplen sols i un cercador per triar** (l'Héctor, 28/10/2026: «quan tens un client
    a Contactes i el poses a Dades… les dades que ja tenim s'han d'emplenar soles… a Verbania tinc Brava i els camps estan buits»; «han de
    sortir conforme a Contactes, perquè surten barrejats i repetits… del bloc que toca… i posant les primeres lletres he de poder filtrar»):
    - **Per què Brava sortia buida:** tenia dues fitxes. La de client (`aco_clients`, id `brava`) amb dades de farciment («Pendent», «972 XXX
      XXX», «pendent@brava.cat») i la de Contactes (l'agent `client-agent-brava` de `__global_agents_878188`) amb les de debò. Contactes les
      ensenya juntes, però Dades › Client llegia només la de client.
    - **Omplir** (`buit878413`: buit, «Pendent», «XXX», «pendent@…»; `contacteDe878413`: la fitxa de Contactes de la mateixa persona —pel
      client, el NIF o el nom— amb més dades; `omple878413`: cada camp buit o de farciment, i l'adreça si només hi havia el poble). La llista és
      la de Contactes (`lib878414` = `window.__acoContactes878406()` amb `dadesContacte878413`: l'agent i la fitxa de client ajuntats). A
      Dades: el client (`ompleClient878414`), la constructora i els tècnics (`ompleRols878414`), els industrials (`ompleInds878414`) i el promotor
      quan no és el client (un efecte que omple els camps `…Propietat` buits). En «Guardar dades», la fitxa de client queda corregida.
    - **Triar** (`TriaContacte878413`, `.tc-v878413`): un camp on s'escriuen les primeres lletres (`coincideix878315`) i, a sota, els contactes
      de Contactes (una fila per persona, `filesContactes878406`) del bloc que toca: Client tots (per blocs), Promotor `promotor`, Constructora
      `constructora`, direcció d'obra, d'execució i S+S `tecnic`; buscant algú d'un altre bloc, a «Altres contactes» (o «Veure tots els
      contactes»); «— Cap (pendent) —» i «+ Nou…». Es tanca tocant fora o amb Esc. Els industrials («Afegir industrial», `AgentPicker878301`)
      també amb la llista de Contactes sense repetits. Client d'una obra compartida: el desplegable d'abans (`__prom__`).
    - El client triat que encara no és client (`triaClient878414`): «Altres contactes» (`altresContactes878347`) ara són tots els grups.
    - Al mòbil i l'iPad, «Guardar dades» a l'esquerra (el ＋ de l'obra el tapava).
    - Estils `src/theme-v878414.css`. Prova: `v414test.mjs` (17: client amb farciment, tècnic repetit en dues obres, blocs, filtrar, triar,
      desar, mòbil). Adaptades al cercador `fitxestest`, `dadestest` i `compartides347test` (que ara també espera que el contacte que posa
      s'hagi desat abans de recarregar, `__acoStore.flush`).
  - **V87.415 · Una sola fitxa per persona: clients i Contactes al dia, i «Nova obra» amb el cercador** (repàs funcional, tanda 1, vegeu
    `docs/repas-funcional.md`):
    - **Reparació en obrir l'app** (`reparaClients878415`, un efecte de l'App, un cop per sessió i usuari, 4 s després que les dades quedin
      quietes; no al portal de client): cada fitxa de client amb camps buits o de farciment s'omple amb la seva fitxa de Contactes
      (`contacteDe878413`; l'adreça si només hi havia el poble). La llista d'abans es guarda a `aco_clients_abans_v878415`.
    - **Desar la fitxa d'un client** (`FitxaClient`, Contactes › un client) posa al dia les seves còpies de Contactes i de les obres
      (`propagaClient878415`: per `sourceClientId878192`, `client-agent-<id>` o el nom; només les que ja hi són, mai en crea; les obres
      compartides per un altre compte no es toquen).
    - **«Nova obra»** (`QuickExpedientForm878254`, `.quick-exp-client-v878415`): el client es tria amb `TriaContacte878413` (tots els
      contactes); un contacte que encara no és client omple «Dades del client nou» (nom, NIF, telèfon, correu, adreça, CP, població) i en crear
      l'obra es fa client. El valor va en un `input[name=client]` amagat (abans un `select`).
    - Prova: `v415test.mjs` (18). Adaptades `fitxestest` i `dadestest` (client de l'obra nova amb el cercador). **Les lliçons de vídeo que
      trien el client de l'obra nova** (`guia404-llicons.mjs`, `select[name=client]`) s'han de tornar a gravar.
  - **V87.416 · Triar l'obra amb el cercador i la feina de l'Inici per l'expedient** (repàs funcional, tanda 2):
    - **`TriaObra878416`** (`.tc-v878413.to-v878416`, el mateix aspecte que `TriaContacte878413`): un camp on s'escriuen lletres del nom, el
      número curt o llarg, el client, el promotor, la població o l'adreça (`coincideix878315`); «Obertes» primer i «Tancades i altres» a sota
      (20 sense buscar). Props: `buit` (p. ex. «Sense expedient»), `extra` (`[[valor, text]]`, p. ex. «+ Crear nou expedient»). Substitueix el
      desplegable de l'obra a la **cita de l'Agenda** (`AgendaEditor878256`, que ara rep `clients`), a **«+ Afegir hores»** (`ManualHours878256`)
      i a **les hores del treballador** (`HoresTreballador878327`, només les obertes). Contenidor `.tria-obra-v878416`.
    - **Inici › «+ Afegir feina»** (`Inici`): primer «Expedient o treball» amb tots els oberts (abans, primer el client —de sèrie el primer de la
      llista— i només els seus expedients); el client surt de l'expedient. Amb «+ Crear nou expedient», el client es tria de Contactes
      (`TriaContacte878413`, `.tria-cli-v878416`; un contacte que no és client o «+ Client nou…» → client nou) i el nom i el tipus de
      l'expedient nou. Sense expedient triat: «Selecciona un expedient o crea’n un de nou.» Fora el text que explicava el formulari; «Nova
      feina pendent» i «Guardar la feina» (abans «tasca»).
    - **Dates amb només la primera lletra en majúscula** (`theme-v878416.css`, `::first-letter`): `text-transform:capitalize` deia «Dimecres,
      28 D’octubre» o «Octubre De 2026» (hores del treballador, partes, Planning, Agenda › Equip).
    - Prova: `v416test.mjs` (23: tècnic a l'ordinador, treballador i mòbil). Adaptades `perfils326test` i `veutest`.
  - **V87.417 · Canviar una persona a Contactes la canvia a les obres** (repàs funcional, tanda 3):
    - **Per què:** l'obra desa el promotor en camps propis (`propietat`, `emailPropietat`, `telefonPropietat`, `mobilPropietat`,
      `nifPropietat`, `contactePropietat`, `empresaPropietat`, l'adreça) i el nom de la constructora i dels tècnics (`constructor`, `do`,
      `deo`, `css`). Canviar el contacte a Contactes posava al dia les còpies d'agents però no aquests camps, i «Enviar» i els documents
      continuaven amb el correu vell (i a «Enviar» la mateixa persona sortia dues vegades, amb el correu nou i el vell).
    - **Ara** (`obresPersona878417(obres, abans, després)`, funció pura; l'App ho aplica amb `window.__acoPersona878417` a la llista
      d'obres i a `odata[id].obra`): en desar un contacte (`Contactes878315`) o la fitxa d'un client (`FitxaClient`), les obres on és el
      promotor (pel nom, el NIF o `promotorAgentId`) reben els camps nous **que eren buits, de farciment o iguals que els d'abans** (si una
      obra en tenia de propis, es queden), i el nom nou als camps de la constructora o dels tècnics que deien el nom d'abans. Les obres que
      ens han compartit no es toquen (tampoc les seves còpies d'agents: `updateAgentLibrary878191` se les salta, com `propagaClient878415`).
    - **El mòbil** a la fitxa del contacte (`EditorContacte878315`) i a la del client (`FitxaClient`); abans només el telèfon (el WhatsApp fa
      servir el mòbil). «Nou contacte» (`clientNou878406`) el desa.
    - **Eliminar un client** també el treu de Contactes (`amagarAgent878301`, `treureDeLaLlista878303`): hi tornava com a agent. Les obres i
      les actes on surt el conserven. El missatge diu «obres» o «expedients» segons el perfil.
    - Prova: `v417test.mjs` (18: promotor amb el correu vell i una obra amb un de propi, «Enviar», nom d’un tècnic, fitxa d’un client, contacte nou
      amb el mòbil i eliminar-lo, recarregar, mòbil).
  - **V87.418 · Els noms canviats arriben a tot arreu** (repàs funcional, tanda 4: Empresa › Treballadors i Industrials):
    - **Planning:** cada assignació desa el nom de quan es va fer (`capPlans[cap].qui = [{k, nom}]`), i si es canviava el nom del
      treballador a Empresa el Planning continuava dient el vell. Ara el nom surt de la fitxa d'ara (`nomQui878418`: `t:<id>` → el
      treballador de `aco_treballadors_v878339`, amb `trebsAra878418` que només torna a llegir la llista si ha canviat; `c:<colla>` → la
      colla; la resta, el nom desat). Agenda › Equip i les coincidències ja el llegien de la fitxa.
    - **La clau d'una persona és el seu nom** (`agentPersona878301` → `nom:<nom>`): canviar el nom d'un industrial a Contactes en perdia els
      documents d'Empresa › Industrials (`aco_docs_industrials_v878339`, per persona) i l'assignació al Planning (`i:<persona>`). Ara, en
      desar un contacte amb un altre nom (Contactes o la fitxa d'un client), `window.__acoCanviPersona878418(kVell, kNou, nomNou)` de l'App
      passa els documents a la clau nova i canvia `i:<vella>` per `i:<nova>` (amb el nom nou) a les obres pròpies (no a les compartides).
    - **El nom d'un client** canviat a la seva fitxa també va a les seves còpies de Contactes i de les obres (`propagaClient878415` ara hi
      posa `nom` i `empresa`): abans Contactes ensenyava el nom de la còpia, el d'abans.
    - Prova: `v418test.mjs` (10: treballador reanomenat al Planning, industrial amb un document i al Planning reanomenat a Contactes, client
      reanomenat i la seva còpia, recarregar).
  - **V87.419 · Inici del tècnic: les feines** (repàs funcional, tanda 5, `demo-tecnic`; `v419test.mjs`, 17):
    - **Comprovat com un usuari:** els quatre requadres de l'Inici porten a la llista d'Expedients amb el mateix nombre (la fila de l'any,
      `.year-row-v8742`, no és un expedient); «Fet» treu la feina de l'Inici i la deixa feta a l'expedient; un expedient nou de cèdula, CEE,
      ITE i amiant es crea amb el seu número i el seu tipus, s'obre amb l'encàrrec al Resum i es troba al cercador.
    - **Accions de cada feina** (el desplegable de l'Inici): «Veure / editar feina» (abans «tasca»), «Entrar a l’obra» a la constructora,
      **«Apuntar hores»** (abans «Iniciar temps», que no engegava cap rellotge: obre les hores de l'expedient) i només als comptes amb hores
      pròpies (`senseHoresPropies878342`: la constructora no en té). «Feina pendent» en lloc de «Tasca pendent» i de «Tasca / feina pendent».
  - **V87.420 · Els diners del tècnic quadren a totes les pantalles** (repàs funcional, tanda 6; eina `tools/proves/mira420.mjs`: escriu el
    text de les pantalles del menú d'un compte de prova, `PANT='Facturació|Pressupostos' COMPTE=demo-tecnic`):
    - **Pressupostos d'honoraris** (`HonorarisGeneral`): una sola factura (p. ex. el 50 %) ja el marcava «Facturat», mentre Facturació ›
      Pendent de facturar en donava la resta. Ara «Facturat» només si les factures (no anul·lades) arriben a la base; si no, **«Facturat en
      part»** (`parcial420`, `fact420`), que compta a «Acceptats».
    - **Les factures anul·lades** ja no compten com a facturades al pendent de facturar (`honorarisPendents878307`).
    - **Facturació del tècnic** (`FacturesGeneral8738`): base + IVA no lligava amb el total (s'hi resta la retenció, que no sortia). Ara la
      **retenció** surt al total de baix i a cada factura, sota el total (`ret-v878420`, `src/theme-v878420.css`).
    - Comprovat amb les dades d'exemple: el facturat és el mateix a Facturació i a Rendiment; el pendent de facturar = honoraris acceptats −
      facturats + hores; anul·lar una factura torna el pressupost a «Acceptat», puja el pendent i baixa el facturat del Rendiment.
    - Prova: `v420test.mjs` (11).
  - **V87.421 · Correccions del repàs exhaustiu sobre la V87.420** (`repas411.mjs`, 336 pantalles amb els quatre comptes, ordinador i
    mòbil, PDF, «Enviar» i «Signar»: informe a `D:/aco-tmp/repas420`; cap error de l'app):
    - **Expedients a l'ordinador:** l'estat «Pendent de resposta» no hi cabia. La regla de la V87.412 (`min-width:172px`) no s'hi aplicava:
      en guanyava una de la V87.289 (`td:nth-child(8) select`, més específica). Ara la columna de l'estat fa 196 px i el desplegable n'ocupa
      tota l'amplada; la tipologia i l'adreça passen del 11-12 % al 10 % perquè el nom del treball continuï tenint més del 20 % de la taula
      (`expcolstest`) (`src/theme-v878421.css`).
    - **Google Calendar:** la reconnexió del primer toc (V87.331, només a l'ordinador) escoltava tot el document: el toc de sortir de l'Agenda
      (p. ex. «Ajustos» al menú) obria la finestra de Google. Ara només els tocs de dins de l'Agenda (`.agenda-v878256`).
  - **V87.422 · El treballador no canvia l'estat de les obres des de la llista** (repàs funcional, tanda 8): a la llista d'obres del perfil
    treballador hi havia el desplegable «Canviar estat» (i «Importar»), perquè el compte és administrador del seu espai
    (`allowAdminActions`); ara `allowAdminActions` és fals per al treballador (`esTreballador878326`). Dins de l'obra ja era només lectura.
    - **Comprovat sense canviar res** (`v422test.mjs`, 15): la cadena dels diners de la constructora (parte amb una partida i 8 h → certificació
      nova → mà d'obra a Despeses → Per facturar → «Fer factura», que demana les dades fiscals de l'empresa si falten → Facturació › Factures →
      Rendiment amb ingressos, costos i facturat que pugen el que toca → la certificació diu el número de la factura); i el repàs exhaustiu a
      l'iPad (`repas411.mjs` amb `MIDES=ipad`, nou: 820 × 1180; 168 pantalles, cap problema).
    - **Pregunta oberta per a l'Héctor:** les hores i despeses del treballador es desen al seu compte i no arriben a l'oficina (a les obres
      compartides no es comparteixen hores, agenda ni despeses): cal decidir com (núvol o fitxatge fase 2).
  - **V87.423 · Partides que no s'executaran i el resum de l'obra als PDF de les certificacions** (l'Héctor, 28/10/2026: «quan imprimim la
    certificació a origen… que es vegin totes les partides, les fetes i no fetes… marcar les que no s'acabaran d'executar tota la quantitat i
    posar-hi quina… com un envà de 7 que al final es fa de pladur… el total no pot sumar l'original amb els imprevistos… en vermell… al final un
    resum: pressupost original, que no s'executarà, imprevistos o noves i pendent segons el pressupost original… i del certificat, el que és del
    pressupost original i dels imprevistos, també al PDF «Certificació 1»… potser un gràfic»):
    - **La marca** (`qFinal878423` a la partida = la quantitat que s'executarà; 0 = gens; sense el camp, sencera): a la fitxa de la partida del
      Pressupost (`FitxaPartida878361`) i a «Fitxa / accions» de la Certificació (`CertPartidaModal87216`), sota «Marcar com a nova»:
      `NoExecPartida878423` amb la casella «No s’executarà tota la quantitat» (proposa el que ja s'ha certificat) i «Quantitat que
      s’executarà» (si és la prevista o més, es treu la marca). Fora d'edició es desa al moment (`posa878423` / `posaPartida878423`).
      Etiqueta «No s’executarà» o «Només 33,80 ml» (`etNoExec878423`). Mai compta menys del que ja s'ha certificat.
    - **Vermell** (`colorPartida878423`: vermell mana sobre el taronja): la fila del pressupost (`noexec-v878423`) i la seva etiqueta
      (`noexec-et-v878423`; **compte: la classe de la fila i la de l'etiqueta han de ser diferents**, si no la fila es torna `inline-block`),
      Certificació › Partides, el resum «Totes les partides» (amb la fila «No s’executaran») i els PDF de les certificacions.
    - **Els càlculs** a `previsio878423(items, ini)` (`previst878410` ara hi passa les partides; els PDF, les files del document amb les
      quantitats a origen d'aquella certificació): `noExec` (des de l'inicial o el d'ara, el més gran, fins a la quantitat que s'executarà) +
      les partides de l'inicial que ja no hi són = `imNoExec`; `previsio` = original − no s'executaran + imprevistos; `executat` separat en
      `exeOrig` / `exeImp` (més amidament i partides noves); `pendent` = previsió − executat (`pendOrig` / `pendImp`); i `act` = la
      certificació d'ara separada igual. Una partida nova marcada compta als imprevistos només el que s'executarà.
    - **Targeta «Previst i imprevistos»** (Certificacions › Resum i Rendiment): sis xifres (Pressupost original · No s’executaran ·
      Imprevistos i partides noves · Previsió final · Executat · Pendent d’executar) i el gràfic `GraficaFinal878423` (`barresFinal878423`: dues
      barres a la mateixa escala, pressupost original —blau el que s'executarà, vermell el que no— i previsió final —verd executat i blau clar
      pendent del pressupost, taronja i taronja clar dels imprevistos—, amb la llegenda i els imports). La capçalera del pressupost diu també
      «− … no s’executarà».
    - **PDF a origen** (`certPrintHtmlV8772`): el quadre horitzontal amb **totes** les partides (abans només les que tenien alguna quantitat);
      a la primera pàgina, l'import de la certificació separat (del pressupost original / d'imprevistos i partides noves); al final del quadre,
      **«Resum de l’obra»** (`resumFinalHtml878423`, `CSS_FIN878423`): la taula de les sis xifres, el requadre de la certificació i el gràfic
      (en HTML, no SVG, perquè surti igual al PDF de `htmlAPdf`). El document porta `fin423` (`certPdfDoc878407`). El PDF «només aquesta
      certificació» (`certCurrentPrintHtml87216`) porta el mateix resum a sota del total. El PDF dels imprevistos, «Partides que no
      s’executaran» i la previsió final. El PDF del pressupost no canvia.
    - Amb Verbania (còpia del DADES, fase P1): marcant el paviment 02.04 sencer i la 02.03 a 33,80 de 66,60 ml, no s'executaran 7.909,21 €,
      previsió final 105.697,85 € (121,54 % de l'original) i la certificació 1 (25.356,14 €) és 3.200,52 € del pressupost original i 22.155,62 €
      d'imprevistos. Estils `src/theme-v878423.css`. Prova: `v423test.mjs` (25). Eina nova `tools/proves/capturahtml.mjs` (`FILES=`, `SEL=`,
      `EXPR=`: captura d'un HTML desat, p. ex. els PDF que desa una prova amb `OUT=`; `captureBeyondViewport` treu la barra de desplaçament i
      mou uns píxels la pàgina, per això retalla amb marge).
  - **V87.424 · Compartir només el Pressupost i les Certificacions, amb una certificació pròpia per comparar** (l'Héctor, 28/10/2026, per
    treballar amb el Martí Sais: «compartir una part d'expedient com a document de treball de tècnic a tècnic… que pugui treballar amb el
    mateix pressupost on surti el pressupost original, els imprevistos i noves partides, treure els llistats en PDF… i fer-se la seva
    certificació per comparar amb la meva com a tècnic de la constructora»):
    - **Abans:** a una obra compartida, un compte de perfil tècnic no veia el Pressupost ni les Certificacions (`tabsPerfil878326` i
      `hasModule2Access8747` les amagaven) i, amb «Pot editar», hauria certificat a sobre de les certificacions de qui comparteix.
    - **Obres compartides** (`tabsCompartida878424`): el Pressupost i les Certificacions surten sempre, sigui quin sigui el perfil (no al
      treballador); `GestioObra8746` també s'obre sense el mòdul d'obra si l'obra és compartida.
    - **«Pressupost i certificacions»**, permís nou a «Compartir» (`ShareModal878259`): al núvol és un editor (perquè la seva certificació
      arribi), i a l'obra es desa `parts878424 = {[usuari]: "pressupost"}` (`window.__acoPatchObra878424` de l'App, abans de `shareObra`).
      Qui la rep (`partCompartida878424`, amb `window.__acoEmpresa.username`) només veu **Resum · Pressupost · Certificacions**, sense el ＋ i
      amb les fases de consulta.
    - **El seu Pressupost** és de consulta (`PressupostCompartit878424`): la targeta «Previst i imprevistos» (amb els PDF de l'original i dels
      imprevistos) i el pressupost per capítols plegats amb les marques (taronja, vermell) (`ClientBudgetReadOnlyV87235 marques`).
    - **La seva certificació**: `GestioObra8746` rep `contrast878424 = {me, nom}` i treballa amb `ambContrast878424` (el mateix pressupost,
      les seves quantitats i les certificacions de l'obra que encara no té, amb l'id `ct-…`; sense factures) i `desaContrast878424` (en desar,
      només les quantitats certificades —`CAMPS_CERT878424`, `cert_N`— i la llista de certificacions van a `data.contrast878424[usuari] =
      {nom, at, p:{[pid]:{certsByNum…}}, certs}`; `pidC878424` = l'id de la partida o pressupost|codi|concepte). Les de qui comparteix no es
      toquen. Títol «La meva certificació N»; sense «Fer factura», signar, «Afegir feina», «Importar Excel», eliminar ni marcar noves.
    - **«Comparar»** (botó al costat de Resum · Partides; `potComp878424`): per a qui comparteix, si algun compte hi ha fet la seva
      (`usuarisContrast878424`); per a qui la rep, sempre. `ComparaCert878424` (`comparaCert878424`): a origen fins a la certificació triada,
      el total de cadascú i la diferència, «Només les diferències» / «Totes», per capítols (al mòbil en fitxes) i **«PDF de la comparació»**
      (`compara878424`, `comparaPrintHtml878424`).
    - **Sincronitzat:** tot viu a l'obra compartida (`aco_shared`), i com que cadascú escriu la seva clau de `contrast878424`, la fusió per
      apartats ho ajunta sense preguntar.
    - Estils `src/theme-v878424.css`. Prova: `v424test.mjs` (18: demo-constructor comparteix «Reforma integral pis C/ Nou 5» amb demo-tecnic;
      pestanyes, pressupost de consulta, la seva certificació desada a part, comparar als dos comptes, PDF, «Pot editar» i mòbil).
  - **V87.425 · Documents en fulls A4 (vista prèvia i PDF) i les targetes del resum plegades** (l'Héctor, 28/10/2026: «al descarregar el PDF
    a origen el quadre surt tallat… imprimir ja surt tot… qualsevol previsualització a qualsevol dispositiu ha de ser com si fos un A4 en vertical
    o horitzontal»; «a l'ordinador també plegat com a resum total… el quadre plegat i, en obrir-lo, per capítols i per partides… net i clar»):
    - **`src/fullsA4.js`** (`prepara(doc, {pdf})`, `aPunt(doc)`), el mateix per a la vista prèvia i el PDF: fa valer els estils d'imprimir del
      document (les regles de `@media print` passen a valer sempre i les de `@media screen` es treuen), cada full (cada `.page` de primer nivell, o el
      body) fa l'amplada del paper amb els marges del seu `@page` (vertical o horitzontal pel `size`, la pàgina amb nom —`page:`— o la classe
      «landscape»; sense marges, 10 mm) i es talla en pàgines sense partir cap línia, fila, foto, requadre, contenidor flex/grid ni bloc de text
      petit; allà on acaba una pàgina hi posa l'espai fins a la següent (`tr.a4-espai` a les taules, amb la **capçalera de la taula repetida**,
      `.a4-cap`; `div.a4-espai`; un marge als elements de flex/grid; un text de més d'una pàgina es parteix entre línies). Un títol (h1–h6) no es
      queda sol a baix: passa a la pàgina següent. Torna `{fulls:[{x,y,w,h,l}], ample}` (px del document).
    - **PDF** (`src/pdfDoc.js`): un marc de 1200 px, `prepara(doc,{pdf:true})` i una imatge per full a la seva mida (A4 vertical 210 × 297 o
      horitzontal 297 × 210, `addPage("a4", "landscape")`), amb els marges del document (abans 12 mm fixos i tot a 794 px: el quadre resum de les
      certificacions, de 277 mm, sortia tallat per la meitat). Les signatures (`signes`) porten `ph` (l'alçada del full) i `propsSig`
      (`src/signaComu.js`) la fa servir. **Imprimir** no canvia (ja sortia bé: `@page` amb nom).
    - **Vista prèvia** (`ExactHtmlPreview878193`, `.a4-v878425`): fulls blancs amb ombra sobre gris (`.a4-full`, darrere del contingut). A
      l'ordinador (`FrameA4878425`) el marc es llegeix baixant i, si un full no hi cap (A4 horitzontal), s'encongeix (`zoom`); al mòbil i l'iPad
      (`FitFrame878290`), els fulls encongits a l'amplada de la pantalla. Fora la nota «Vista prèvia fidel… Aquesta és la mateixa plantilla…».
    - **Plegades a tots els aparells** (`CardOPlega878369 sempre`): «Previst i imprevistos» (línia: «Previsió final … · Executat … (… %) ·
      Pendent …»; oberta, un compte net, una línia per xifra —`.llibre-v878425`, les mateixes sis xifres— en lloc de sis requadres de colors) i
      el **quadre resum** de les certificacions (`QuadreResum878425`: «N capítols · Certificat … (… %) · Pendent …», a dins «Capítols · Totes les
      partides»).
    - «Compartir»: el desplegable del permís ja hi cap sencer («Pressupost i certificacions»).
    - Estils `src/theme-v878425.css`. Prova: `v425test.mjs` (15: plegades a l'ordinador i al mòbil, el toc les obre, vista prèvia i PDF del document a
      origen —vertical + horitzontal, res fora del full—, pressupost vertical, compartir). Eines: `fullsa4mira.mjs` (aplica `fullsA4.js` a un HTML desat
      i en fa la captura) i `imprimeixhtml.mjs`.
  - **V87.426 · L'Econòmic de l'obra en targetes plegables iguals** (Bloc 1 del full de ruta; l'Héctor, 29/10/2026 a la nit: «pantalles netes…
    targetes desplegables, inclosos els capítols i les partides del pressupost, de la mateixa mida, forma i tamany; i no posis comentaris com a
    Ajustos, que surt la línia dels %»; «la targeta d'accions és interminable… els PDF, una d'imprimir que obri una pantalla amb les opcions…
    les eines dins d'editar… canviar el nom i eliminar ja surten a les fases»):
    - **Targeta plegable comuna** (`bloc-v878426`, `src/theme-v878426.css`): una línia de 58 px amb la icona, el títol, com a molt una xifra a la
      dreta i la fletxa, sense línia de comentari; a dins, parts també plegables (`sub-v878426`). `CardOPlega878369` té el mode `bloc426`
      (`icona`, `xifra`). Les files que es despleguen (proformes, factures) són `fila-v878426`.
    - **Pressupost:** Fases · «Ajustos del pressupost» (un sol bloc, el construeix l'Obra amb `ajustos878426()` i el passa per `GestioObra8746` →
      `Pressupost`: el % del marge d'intermediari —la comissió amagada, ara una línia «Marge d'intermediari»—, «Preus i marges», «Obra i
      logística» i «Número i condicions per al client», que abans eren dos blocs a part) · «Avisos» (plegat, amb el nombre; fora el ⚠ de la
      capçalera i els de baix) · el pressupost · «Descompost del pressupost» (mà d'obra, materials…; abans «Resum del pressupost» dins de la
      targeta). Capçalera: **Editar · Imprimir · Accions**. «Imprimir» (`imprimir426`, `.imprimir-modal-v878426`): PDF del pressupost, PDF del
      pressupost original i dels imprevistos, Exportar Excel, Guardar a Documents. «Accions»: Enviar, Signar amb certificat, Afegir partides
      (llibreria, dictar, Excel, PDF, IA), Pressupost inicial. Editant: «Afegir» i **«Eines»** (renumerar, validar descompostos, tornar a llegir els
      descompostos —editant, a les partides que s'editen—, buidar). Amb la barra de fases (`ambFases878426`) ja no hi ha canviar el nom, eliminar
      ni «Un pressupost nou al costat» (són al «⋯» de les fases).
    - **Capítols i partides com a targetes:** el capítol, tota la línia es toca (`cap-carta-v878426`, la fletxa a la dreta); sense «N partides» ni
      «N capítols». Fora d'edició, cada partida és una targeta (`.cartes-v878426`: codi, concepte, import) i, en tocar-la, la **fitxa de la partida
      s'obre a sota** (`FitxaPartida878361 inline`, `fitxa426`); «Editar» de la fitxa obre l'edició i la fitxa en finestra, i «Fer un descompost
      senzill» o «Treure el mínim» l'obren amb aquell pas a punt (`budgetPartidaView87208.que` → prop `inicial`). Editant, com abans, i la
      partida nova («+ Afegir partida») s'obre sola.
    - **Certificacions:** «Avisos» (`BudgetWarnings878253`, plegat, sense els textos que expliquen) · «Certificacions» (plegada, el total certificat i
      «Nova»; oberta, **totes**, de punta a punta). Tocant-ne una (`detall426`), la seva pantalla: «‹ Certificacions», capçalera (data, factura) amb
      **Editar · Imprimir · Accions** («Imprimir»: PDF de la certificació, a origen, administració i les línies d'amidament; «Accions»: Enviar, Signar,
      Fer / Veure la factura, Afegir feina, retirades, Importar Excel, Eliminar) i les targetes **Resum** (`ResumCert878426`: tres xifres —la
      certificació, l'executat a origen amb la barra i el pendent— i el previst i imprevistos), **Partides** (la graella; s'obre en editar) i
      **Quadre resum**. `certMode8711`: "" o "emplenar" (Partides oberta). Eliminar-la torna a la llista.
    - **Previst i imprevistos** (`PrevistImprevist878410`, `nu` sense targeta pròpia): sense comptadors de partides ni comentaris («Cap», «% de…»).
    - **Facturació de l'obra** (`Fact`): les xifres (pressupost d'obra, base, **IVA**, total amb IVA i el % facturat) · «Proformes» (les que encara no
      tenen factura; cada una es desplega amb base, IVA, retenció, deducció, PDF, Enviar i Fer factura) · «Factures» (per número; PDF, Enviar,
      «Signatura del client», Eliminar; VeriFactu igual). **«Enviar» d'una factura:** «Enviar la factura» o «Enviar-la perquè la tornin signada»,
      que obre `SignaturaCert878408` amb `tipus:"factura"` i el rol «Rebut pel client» (AutoFirma, enllaç a distància o pujar el PDF signat); el
      signat es desa a Documents › 07 (certificacions i facturació) i la factura diu «Signada». La plantilla (`proformaPrintHtml8783`) porta el
      requadre del client quan es prepara per signar o ja està signada.
    - **Despeses de l'obra** (constructora i gestió total, `obra426`): el total sense IVA a dalt i un sol **«Accions»** (Fer foto, Adjuntar, Entrar a
      mà, Importar Excel, Seleccionar, Filtres); una targeta per cost amb l'import sense IVA: **Mà d'obra** (amb «Hores del personal» a dins, que
      abans era una línia a part a l'Obra; prop `personal426`), **Factures d'industrials**, **Factures de materials**, Altres (si n'hi ha) i
      **Despeses generals (DGE)** (el % de l'obra sobre els ingressos). Fora els requadres, els totals i la línia de vistes.
    - El total de Despeses i les DGE surten de `rendimentFase878342` (el mateix càlcul que el Rendiment). Com al Rendiment
      (`useDespesesObra878312`), els albarans inclosos en una factura no compten; `rendimentFase878342` i `rendimentObra878339` també els
      treuen ara (`cobertsPer878311`), per si se’ls passa la llista sencera.
    - **Rendiment de l'obra:** a dalt, quatre xifres amb color (previsió final, certificat a origen amb la barra, despeses —amb les DGE— i benefici);
      la **gràfica a la vista** (`EvolucioObra878366`, ja no plegada); i les targetes «Compte de l'obra» (el compte i els % de DGE i BI), «Previst i
      imprevistos», «Per fases» i «Per capítols».
    - Prova: `v426test.mjs` (29: pressupost, certificacions, facturació —fer factura i enviar-la per signar—, despeses, rendiment i mòbil).
      Adaptades als blocs i a «Imprimir» unes 30 proves (pressupost, certificacions, facturació, despeses, hores del personal, menús, documents,
      enviar, signar, `clientsvirtuals`…).
  - **V87.427 · El pressupost, una targeta plegable més, i les partides noves i els imprevistos a part** (l'Héctor, 29/10/2026 al matí, mirant
    la V87.426: «el pressupost és una targeta desplegable com la resta i podria haver una targeta de partides noves i imprevistos que, tot i que
    segueixin la numeració del pressupost, les puguem visualitzar i tenir l'import a part… i al pressupost, almenys al mòbil, no surt la
    numeració de les partides»):
    - **Pressupost** (`PresCard878427`, `pres-bloc-v878427`): una targeta plegada com les altres (nom del pressupost i l'import: l'original si
      hi ha partides noves o que no s'executaran; si no, el total). A dins, la capçalera de sempre (Editar · Imprimir · Accions, fixa en baixar;
      el total ja no s'hi repeteix, només el desglossament) i els capítols. Mentre s'edita no es plega. **Es recorda a l'aparell**
      (`pres-obert-v878427` al localStorage de debò, `lsVisual878400`): si es deixa obert, la propera vegada ja surt obert. Al portal de client i
      al pressupost ràpid, la targeta d'abans.
    - **«Partides noves i imprevistos»** (`ImprevistosPres878427`, sota el pressupost; amb `previst878410` del pressupost triat): l'import dels
      imprevistos a la línia; a dins, «Partides noves», «Més amidament que el previst» i «Més quantitat o preu que a l'inicial», cada partida amb el
      seu número del pressupost (ordenades pel número), l'etiqueta i l'import, i «PDF dels imprevistos». Tocant-ne una (`anarPartida427`)
      s'obre el pressupost, el capítol (i el seu grup) i la fitxa de la partida, a la vista.
    - **Mòbil:** el número de cada partida torna a sortir (la V87.426 l'amagava): a dalt el número i l'etiqueta, a sota el concepte en dues
      línies com a molt; totes les targetes de partida fan la mateixa alçada.
    - **Proves:** les ajudes comunes (`helpers` d'`alhoratest.mjs`) deixen el pressupost obert (com qui ja l'ha obert una vegada), llevat que
      la pàgina tingui `sessionStorage.__presNoTocar`. Estils `src/theme-v878427.css`. Prova: `v427test.mjs` (18). Adaptades `pressuposttest` i
      `pdfpressuposttest` (el nom del pressupost és a la línia de la targeta).
  - **V87.428 · «Tancar el pressupost», un sol nom («Fora de pressupost») i les accions a la vista a l'ordinador** (l'Héctor, 29/10/2026:
    «pressupost inicial i després pressupost amb IA… a dins del pressupost aquest no tocaré res mai… quan estigui tot fet o ens ve determinat
    per uns amidaments hauríem de poder tenir l'opció de pressupost tancat i, per si ens hem deixat alguna cosa, reobrir-lo… un cop tancat amb
    el client, el que es crea de nou ha d'anar a partides noves / fora de pressupost / imprevistos: posem un únic nom entendible i genèric…
    a l'ordinador, a fora com enviar i imprimir, que ja queden poques accions; al mòbil i l'iPad, recollit»):
    - **Accions** (`Pressupost`, `usePC878428` = més de 1100 px amb ratolí): a l'ordinador, **Editar · Imprimir · Enviar · Signar · Afegir ·
      Tancar el pressupost** a la vista (`afegir-v878428`; sense fases, un «⋯» amb canviar el nom, eliminar i un pressupost al costat); al mòbil
      i l'iPad, **Editar · Imprimir · Accions** (Enviar, Signar amb certificat…, Afegir partides, Aquest pressupost). «Afegir» (`afegir428`):
      **Des de Preus** (abans «Afegir partides de la llibreria») i Dictar; **Començar buit, Importar Excel, Llegir un PDF i Pressupost amb IA,
      només amb el pressupost buit** (per fer-ne un altre, una fase nova). Amb el pressupost buit no hi ha Enviar, Signar ni Tancar.
    - **«Tancar el pressupost» / «Reobrir el pressupost»** (`TancarPressupost878428`, en lloc de «Pressupost inicial…»): tancar
      (`tancaPressupost878428`) desa a cada partida la quantitat i el preu d'aquell moment (`ini878412`, com «Tal com és ara») i a la fitxa
      del pressupost `inicial878412 = {font:"tancat", at, primer, total, n, tretes}`; el que s'hi afegeix després queda fora de pressupost sol
      (l'efecte de la V87.413). Reobrir (`reobrePressupost878428`) posa `inicial878412.obert = {at, snap}` (com era cada partida, per
      `clauP878428`): no es marca res i el que s'hi corregeix compta com a pressupost (`obertCorregit878428` dins de `previst878410`); en
      tornar-lo a tancar, les partides noves d'aquells dies i les corregides passen al pressupost, i les de fora de pressupost i el que havia pujat
      estant tancat, no. La comparació amb l'Excel original (V87.412) és ara «Comparar-lo amb l'arxiu original…» dins de la finestra de tancar
      (sense «Tal com és ara»; «Tancar-lo així»). Tancat: cadenat a la targeta del pressupost i «Pressupost tancat el …» a la capçalera.
    - **Un sol nom: «Fora de pressupost»** per a les partides noves i els imprevistos: la targeta (abans «Partides noves i imprevistos»), la
      línia de la previsió (abans «Imprevistos i partides noves»), l'etiqueta de cada partida («Fora de pressupost · cert. 2», «· parte»; dins de
      la targeta, només d'on surt, `etOrigen878428`), «Marcar-la fora de pressupost» / «Tornar-la al pressupost», el gràfic, els PDF («PDF fora de
      pressupost», «FORA DE PRESSUPOST»). La targeta «Previst i imprevistos» es diu **«Previsió final»**. «a l'inicial» → «al pressupost».
    - **Rendiment de l'obra:** la gràfica a baix (després de les targetes) i amb la fase triada (`dadesRendEmpresa878343(obres, odata, fase)`);
      sense cap cost, només la línia d'ingressos (abans la de benefici anava a sobre de la d'ingressos i la de costos a 0).
    - Estils `src/theme-v878428.css`. Prova: `v428test.mjs` (22). Adaptades `v410test`, `v411test`, `v412test` (comparar des de «Tancar»;
      «Reobrir-lo» en lloc de «Treure'l»), `v413test`, `v423test`, `v426test`, `v427test`, `pressuposttest`, `pressupost320test`,
      `pressupost361test`, `habitualstest`, `v366test`, `whatsapp402test`, `facturacio337test`, `pdfpressuposttest` (crea abans una fase buida), `menustest`,
      `signatura403test`, `dictat401test`, `marca351test` i `grafica384test` (sense costos, una sola línia). Les 41 proves del pressupost i les certificacions, en verd.
  - **V87.429 · La fila de cada capítol de la certificació amb l'import de cada bloc** (l'Héctor, 29/10/2026, amb Verbania: «a la fila blava del
    capítol, el preu total del capítol (s/pressupost original) i, a les certificacions, l'import de cada bloc: anterior, C1 i a origen… perquè
    es vegi sempre en imprimir el quadre»): a Certificació › Partides (a partir de 761 px), la fila del capítol (`cap-fila-v878429`, una fila
    de la mateixa graella `cert-grid-v69`) porta sota cada columna «Import» el pressupost original del capítol (sense les partides de fora de
    pressupost), el d'abans, el d'aquesta certificació i l'executat a origen, i el % de cadascun sobre el pressupost del capítol; es toca per
    plegar-la i desplegar-la. Al mòbil (partides en fitxes), la línia d'abans (`cap-m-v878429`). Al PDF a origen, la fila del capítol del quadre
    (`filaCap878429`, `tr.cap-v878429`) porta el mateix (abans només l'import a origen). Estils `src/theme-v878429.css`. Prova: `v429test.mjs` (8).
  - **V87.429.1 · Els documents s'obren dins de l'app** (l'Héctor, 29/10/2026, en una visita: «no he pogut obrir un PDF de l'últim expedient…
    no obre el document»; era el PDF de Documents › 01 · Documentació prèvia de la 2026-031, pujat des d'un altre aparell i bo al núvol): en obrir
    un document, l'app esperava a llegir l'arxiu (de l'aparell o del núvol) i després obria una pestanya nova, que el Safari de l'iPhone i l'iPad
    bloqueja sense avisar (ja no és el toc); a l'acta, l'«Obrir» era un enllaç «data:», que els navegadors tampoc obren, i a les notes el document
    no tenia res per obrir-lo. Ara **un visor dins de l'app** (`VisorArxiu8784291`, muntat a l'App amb
    `VisorArxiuGlobal8784291`, event `aco-visor-arxiu`; `obreVisor8784291(nom, carrega)`, `obreDataUrl8784291(nom, url)`): s'obre al moment i el PDF
    s'hi dibuixa pàgina a pàgina (`PaginesPdf8784291`, pdf.js, cada pàgina com a imatge JPEG perquè el mòbil no es quedi sense memòria; com a molt
    120 pàgines), les imatges tal com són i la resta es descarrega; a baix (fixos), Tancar · Compartir (mòbil i iPad) o Obrir en una pestanya
    (ordinador) · Descarregar. A Documents, les actes, les notes (el nom del document), els documents de l'apartat, els de l'encàrrec tècnic, els
    d'Empresa i el PDF d'un albarà. Estils `src/theme-v8784291.css`. Prova: `v4291test.mjs` (12: el PDF es treu de l'aparell i es baixa del núvol,
    sense cap `window.open`; nota; mòbil).
  - **V87.430 · Les hores de l'expedient per dies i mesos, «Dins de la quota» i el rendiment de la quota del client** (l'Héctor, 29/10/2026:
    «si estic fent el seguiment per una empresa normalment aquí no poso honoraris… el que necessito són com la pestanya d'hores per imputar el
    temps… apunts per dia… un bloc amb desplegable per dies, per mesos o el total d'obra, i amb l'opció a facturar o no… amb Brava cobro una
    quantitat fixa al mes… hauria de poder veure si surt rendible o li he de modificar»):
    - **Hores de l'expedient** (`HonorarisTemps` reescrit, `.hores-v878430`, a Honoraris › Hores i a la pestanya «Hores» de la gestió total): a
      dalt les xifres (Hores · Import de les hores · Despeses · Dins de la quota · Per facturar) i **Apuntar hores** · **Despesa** (l'editor de
      Les meves despeses amb l'expedient, `novaDespesa878318({meva:true,obraId})`) i «Marcar tot com a facturat»; el comptador, plegat com abans;
      a sota, **cada mes plegable** (el primer obert) amb **els seus dies plegables** i els apunts (hores del registre i les meves despeses de
      l'expedient), cadascun amb l'estat i ✎. Finestra «Apuntar hores» / «Editar les hores»: dia, feina en xips (`TASQUES878430`: Visita d'obra ·
      Pressupost · Certificacions · Comptabilitat · Reunió · Desplaçament · Gestió administrativa · Altres), hores (0,5 · 1 · 2 · 4 · 8 h), €/h (el
      del client per a la quota o el de sèrie), nota i facturació. Fora la taula, «Afegir registre manual» i el resum de kpis.
    - **Estat «Dins de la quota»** (`estatFactDe878317(r, quota)`, `pendentFact878430`): amb un client de quota fixa, cada apunt és de sèrie dins de
      la quota i, si és una feina a part, «Pendent» (`foraQuota:true`) i surt a Per facturar (Hores, Facturació › Pendent de facturar i
      l'expedient). Abans, totes les hores d'un client amb quota quedaven fora del pendent. A la gestió total (`PERFIL878304==="complet"`), de sèrie
      «No es factura».
    - **Honoraris de l'expedient** (`HonorarisExpedient8778`, prop `quota`): si l'expedient no té pressupost d'honoraris (i no és un encàrrec
      tècnic com la cèdula o el CEE) o el client paga quota, **primer «Hores»** (abans s'obria la calculadora); amb quota, sense la línia del resultat
      de l'encàrrec (la quota és de totes les obres).
    - **Rendiment de la quota** (`RendimentQuota878430`, `rendQuota878430`, `anyQuota878430`; targeta plegable a la fitxa del client, Contactes ›
      client): camp nou **«Preu per hora per a la quota (€/h)»** (`client.preuHoraQuota`; buit, el de sèrie). Per a cada mes des del primer
      apunt: quota, hores dins de la quota (també les que no es facturen) × €/h, despeses (les del registre que no es facturen a part i les meves
      despeses de les seves obres no repercutides) i resultat; l'any, el preu per hora real i «Quota que ho cobriria»; «Per obra». Al
      **Rendiment** del tècnic, «Clients amb quota · any» (`QuotesClients878430`; tocant-ne un, la fitxa del client).
    - El rendiment de l'encàrrec (`timeRowsForObra878120`) compta també les hores de les dades d'exemple (`h-demo-…`; abans només `hr-…`).
    - Estils `src/theme-v878430.css`. Prova: `v430test.mjs` (22: hores per dies, apuntar, editar, despesa, quota a la fitxa, «Dins de la quota»,
      una feina a part, Rendiment, mòbil). Adaptades `tempstest`, `clientsvirtuals`, `v410test`, `v411test` (editar un apunt), `v366test` i `notestest` (V87.429.1). Les 18 proves d’hores, honoraris i facturació, en verd.
  - **V87.431 · «El meu encàrrec» amb Hores · Despeses · Factures i el cost de les hores del tècnic al Rendiment de l'obra** (l'Héctor,
    29/10/2026: «un cop ja creat l'expedient no té sentit tenir aquesta targeta… de creació de pressupost d'honoraris… un paquet que el puc
    utilitzar o no… les 3 pestanyes bàsiques: el control del temps dedicat per mi, les possibles despeses que he tingut i com a molt la relació
    de factures… cap al meu client, que s'ha de vincular amb la meva facturació»; «el cost d'hores que entri en el rendiment»):
    - **Honoraris d'una obra o d'un expedient que no és un encàrrec tècnic** (`HonorarisExpedient8778`, `.encarrec-v878431`): només **Hores ·
      Despeses · Factures** (sense «Pressupostos d'honoraris», la calculadora, «Rendiment» ni la línia del resultat). Hores = `HonorarisTemps`
      (prop `temps`); Despeses = Les meves despeses de l'expedient (prop `despeses`: `Albarans878259 meves` amb l'obra, títol «Les meves
      despeses»); Factures = `FacturesEncarrec878431`. Els pressupostos d'honoraris es fan al menú Pressupostos. **Els encàrrecs tècnics**
      (`esTecnicPur878332`: cèdula, CEE, ITE, amiant…) **continuen com abans**, amb el pressupost d'honoraris a dins. A la gestió total (Hores
      és una pestanya a part), Despeses · Factures.
    - **Factures de l'encàrrec** (`FacturesEncarrec878431`): a dalt, **«Per facturar»** (`.perfact-v878431`: les hores pendents, les meves
      despeses no repercutides —no amb un client de quota— i els pressupostos d'honoraris acceptats que falten per facturar,
      `honorarisPendents878307`) amb **«Fer factura»** (`FerFacturaEncarrec878431`: les entrades amb casella, concepte, data, base, IVA i
      retenció; en crear-la, les hores queden facturades amb `facturaId` i les despeses `facturatClient`) i, a cada pressupost, «Fer factura»
      de la resta (amb el seu concepte; si arriba a la base, el pressupost passa a «Facturat»). A sota, les factures de l'expedient
      (`FacturesTecniques8738`, sense el text «Facturació del treball professional…»), que són les de Facturació. `addFacturaTecnica8742`
      accepta `id`, `hoursRows` i `despeses`, i l'IVA 0 ja no es torna 21. Arribar-hi des de «Fer factura» (Facturació › Pendent de
      facturar, `facturarPressupostTecnic8742`) obre «Factures» (prop `inici`).
    - **Rendiment de l'obra a la gestió total** (`PERFIL878304==="complet"`; `horesTecnic878431`, `costTecnic878431`, `preuTecnic878431`):
      les hores del tècnic (Obra › Hores, sense les dels treballadors `treballador:true`) × el seu €/h (o el de sèrie) són la línia
      **«− Hores tècniques · N h»** del compte de l'obra (`rendimentFase878342` → `perTipus.Tecnic`, `horesTec`; només a tota l'obra: no tenen
      fase; a «Per fases», una fila «Hores tècniques») i compten a la gràfica i al Rendiment de l'empresa (`dadesRendEmpresa878343`, a
      `pers`). A Despeses de l'obra no hi surten (`rendimentFase878342(…, {tecnic:false})`). Des de la V87.433, també al
      compte de l'Héctor.
    - **Un pressupost facturat en diverses factures** (`uniqueFactures8743`): fins ara, de les factures d'un mateix pressupost d'honoraris
      només en sortia una a les llistes (es treien com si fossin repetides); ara només es treuen les del mateix número. A la còpia del núvol
      del 29/10 no n'hi havia cap de repetida.
    - Estils `src/theme-v878431.css`. Prova: `v431test.mjs`. Adaptada `v430test` (cas 0).
  - **V87.432 · Tres nivells de targetes i tot plegat d'entrada** (l'Héctor, 29/10/2026: «remarcar més ressaltat les targetes principals i
    vas a menys amb les secundàries… quan desplegues no es distingeix bé on està per tornar a recollir… i com sempre per defecte sempre les
    targetes plegades»; `src/theme-v878432.css`):
    - **Principals** (`details.card.bloc-v878426`, `details.card.plega-v878369`, `details.ajustos-bloc-v878366`): vora #C3CED6 i ombra,
      títol de 16 px, la icona en un requadre blau clar i la fletxa en un cercle. **Oberta:** vora blava, la capçalera en blau clar (#EFF6FF)
      amb una franja blava a l'esquerra (`inset 4px`), la icona i la fletxa en blau ple i la fletxa **apuntant amunt** (és on es recull).
      Els avisos, igual en taronja.
    - **«Recollir»** (`Recollir878432`, `button.recollir-v878432`, l'últim fill de cada targeta principal: `CardOPlega878369`,
      `PresCard878427`, les 14 escrites a mà i els blocs d'Ajustos): una barra blau clar a baix que només surt si la targeta oberta fa més
      del 70 % de la pantalla (`ResizeObserver`); la plega i, si la capçalera queda fora de la vista, hi torna.
    - **Secundàries** (`.bloc-v878426 .sub-v878426`, els mesos de les hores `mes-v878430`, `details.plegat-v878366`, els passos de
      l'encàrrec `enc-pas-v878333` i els capítols del pressupost `.budget-v25-cap`): fons gris clar (#F8FAFC), sense ombra, títol de 14,5 px;
      oberta, fons blanc i franja blau clar (`inset 3px`) a la capçalera. **Files** (dies, partides): blanques, com abans.
    - **Plegat d'entrada:** el primer mes de les hores (V87.430), el pas actual de l'encàrrec tècnic a l'ordinador, el primer capítol del
      pressupost al portal de client i els apartats de «Dades de l'empresa» a l'ordinador. Es queden: la llista de certificacions buida (hi
      surt l'avís) i el pressupost, que recorda com el va deixar l'usuari en aquell aparell.
    - **La gràfica de les factures de l'expedient** (abans a la pestanya «Rendiment» de l'encàrrec, que la V87.431 va treure) és a «Factures»,
      en una targeta plegada «Gràfica» (`graf-enc-v878432`).
    - Prova: `v432test.mjs`. Eina `visual432.mjs` (captures de Pressupost, Rendiment i Despeses a l'ordinador i al mòbil). Adaptades
      `v430test`, `v411test` (els mesos plegats), `simple354test` i `graficatest` (V87.431).
  - **V87.433 · Dades de l'expedient i Agents de l'obra plegades, i les Hores tècniques al compte de l'Héctor** (l'Héctor, 29/10/2026, amb
    captures de la V87.432: «dades de l'expedient surt la targeta oberta i els agents de l'obra a baix de tot… segueixo sense veure lo de les
    hores tècniques»):
    - **Dades** (`FitxaDadesTab8769`): la `Card` sempre oberta «Dades de l'expedient / de l'obra» és ara una targeta principal plegada
      (`details.card.bloc-v878426.dades-bloc-v878433`, icona `ClipboardList`); a dins, les pestanyes (o els apartats al mòbil) i un sol
      «Guardar dades» a baix; «Recollir» si és llarga. **Agents de l'obra** (`AgentsObraCard plegat`, `agents-plegat-v878319`): la mateixa
      targeta (icona `Users`, títol, quants a la dreta i la fletxa), sense la línia dels noms ni el botó a la capçalera; «Afegir agent» a
      dins. Les dues, una sota l'altra.
    - **Hores tècniques** (`horesTecnic878431`): ara als comptes amb el mòdul tècnic i el d'obra (`teModul878326`): la gestió total i **el compte
      de l'Héctor** (abans només la gestió total). La constructora no en fa i el perfil tècnic no té el Rendiment de l'obra.
    - Estils `src/theme-v878433.css`. Prova: `v433test.mjs` (12: compte de l'Héctor amb una còpia del DADES a «obra CALA ROVIRA 11» i
      demo-tecnic al mòbil). Adaptades `fitxa319test` (els agents sense botó a la capçalera), `encarrec333test` (els passos, tots plegats
      d'entrada des de la V87.432) i `v426test` (els capítols, targetes secundàries més baixes).
  - **V87.434 · «Acord amb el client»** (l'Héctor, 29/10/2026: «el cost o el pactat amb l'empresa amb qui treballo… hauria d'estar en alguna
    targeta meva amb el client… i que cada vegada que fes alguna obra d'ell es tingui en compte… algun altre tècnic li pot passar el mateix
    amb un o més clients»):
    - **On:** Contactes › fitxa del client, targeta principal plegada «Acord amb el client» (`AcordClient878434`, `.acord-v878434`, icona
      `Handshake`; només amb el mòdul tècnic). A la línia, «300,00 € al mes» o el preu per hora. Es desa amb «Desar l'acord», a part de la
      fitxa (desar la fitxa ja no toca la quota ni l'acord). La quota i el preu per hora ja no són a les dades de la fitxa.
    - **Què es desa al client:** `quotaFixa` i `preuHoraQuota` (els de sempre) i `acord878434 = {cobra:[quota|hores|pressupost], inclou:[feines
      de TASQUES878430 que entren a la quota], quotaDes:"AAAA-MM", kmPreu, despeses:"incloses"|"repercutir", iva, retencio}`.
      `acordClient878434(c)` ho llegeix (sense acord, com abans: amb quota, tot dins de la quota i les despeses incloses).
    - **Què fa a les obres del client:**
      - **Apuntar hores** (`HonorarisTemps`, prop `acord`; també «+ Apuntar visita o feina» de Facturació): el preu per hora de l'acord i l'estat
        segons la feina (`estatAcord878434`): dins de la quota si la feina hi entra; si no, «Pendent» si cobra per hores o «No es factura».
        Si es toca l'estat a mà, canviar de feina ja no el canvia.
      - **Les meves despeses de quilometratge:** el € per km de l'acord (`kmObra878434`; sense acord, 0,26).
      - **Factures de l'encàrrec** (`FacturesEncarrec878431`, `FerFacturaEncarrec878431`): les despeses «a repercutir» surten a «Per facturar»
        també amb quota; l'IVA i la retenció de l'acord. «Fer factura» de les hores a Facturació (`InvoiceFromHours878256`), igual.
      - **Facturació › Pendent de facturar:** la quota de cada mes des de «Es factura des de» (`quotesPendents878434`): «Quota · Octubre del
        2026 · client · 300,00 €» amb «Fer factura» (`InvoiceQuota878434`: l'expedient del client on es desa —de sèrie l'obert treballat més
        recentment—, «Quota mensual · octubre del 2026», base, IVA i retenció). La factura porta `quota878434 = {client, mes}`
        (`createFacturaGlobal8778`) i el mes deixa de ser pendent.
      - **Rendiment de la quota:** les despeses «a repercutir» ja no es resten de la quota.
    - **De passada:** a la fitxa del client, al mòbil, la llista d'expedients passava de l'amplada (`obra-row-code-v8739`).
    - Estils `src/theme-v878434.css`. Prova: `v434test.mjs` (17). Adaptada `v430test` (la quota es posa a l'acord).
  - **V87.435 · La vista prèvia sense columnes estretes, menús que no es tallen pels costats, Amidaments en targetes i el pressupost buit
    amb les seves opcions** (l'Héctor, 29/10/2026: «quan poso primer els amidaments, en obrir el pressupost no hauria de tenir l'opció que
    tingués totes les partides per posar preus? I després la de crear o importar el pressupost si l'he fet a part… en BC3»; «en adjuntar
    els amidaments surt desplegat»; «torna a sortir tallat» —el menú «Afegir»—; «mira com surt el pressupost» —text en vertical a la vista
    prèvia, imprimir sortia bé—):
    - **Vista prèvia i PDF** (`src/fullsA4.js`): la fila d'espai entre pàgines d'una taula feia `colSpan=99`, i a les taules amb
      `table-layout:fixed` això repartia l'amplada en 99 columnes: les de debò quedaven estretíssimes (text en vertical; amb 120 files, 40
      fulls en lloc de 4). Ara fa les columnes que té la taula (`colsTaula`: les `<col>` o la fila amb més cel·les, amb els colspan).
    - **Menús desplegables** (l'efecte de l'App de la V87.303/364): a més d'escurçar-los o obrir-los cap amunt, si el panell surt per un
      costat de la pantalla o d'un contenidor que el talla (`overflow-x` diferent de `visible`), s'alinea per l'altre (`left`/`right`
      amb `!important`; els fixos, respecte de la pantalla).
    - **Amidaments** (`Amidaments878328`, `.amid-v878435`): fora la targeta que ho embolcallava; a dalt, «Llegir PDF, Excel o BC3» /
      «Llegir un altre arxiu», «Passar-ho a pressupost» i «⋯» (`.amid-barra-v878435`); a sota, tres targetes principals plegades:
      **Amidaments** (`details.amid-bloc-v878435`, «N partides»: el resum i els capítols), **Preus** (`details.preus-v878368`, el total o
      «Sense preu»; els xips de d'on surten els preus, a dins) i **Obra, logística i marges** (`details.logis-v878368`; el resum, a dins,
      `p.resum-v878435`).
    - **Pressupost buit** (`PresBuit878435`, `.pres-buit-v878435`, a sobre de la targeta del pressupost, fora d'edició, no al portal ni en
      una obra compartida): si la fase té amidaments, **«Portar les N partides dels amidaments»** (porta als Amidaments i obre «Passar-ho a
      pressupost»); **«Importar un pressupost fet a part»**: Excel · **BC3** · PDF; i «Des de Preus» · «Començar pressupost buit». El menú
      «Afegir» del pressupost buit també té «Llegir un pressupost en BC3…». **El BC3** (`bc3Pres878435`) va als Amidaments de la fase
      (`window.__acoAmid878435 = {file, passar}`, `window.__acoObraTab878435` de l'Obra), es llegeix amb el lector dels amidaments (amb el
      descompost i els preus de l'arxiu) i s'obre sol «Passar-ho a pressupost» (`passarDespres878435`).
    - Estils `src/theme-v878435.css`. Prova: `v435test.mjs` (14). Adaptades `amidaments328test`, `pressupost368test` i `preus378test`.
  - **V87.436 · Triar un contacte en una finestra amb els grups de Contactes** (l'Héctor, 29/10/2026: «quan desplego les dades de l'obra i
    agents, el menú desplegable no pot tenir els grups que tenim ara de Contactes i després un submenú amb els de dins de cada? … si en
    tingués molts la llista és interminable i fins al final no hi ha crear nou… o en comptes de desplegable obrir una altra pantalla amb
    això i filtres»):
    - **`TriaContacte878413`** (client, promotor, constructora, tècnics de Dades; client de «Nova obra» i de la feina de l'Inici): el camp
      (només lectura) obre **`FinestraContactes878436`** (`.tc-fons-v878436` › `.tc-finestra-v878436`; dins del mateix `.tc-v878413`, amb
      `useHoldSync878266`): a dalt el títol i ×, el **cercador i «+ Nou…»** (`.tc-cap-v878436`; buscant, «Nou: «…»»), els **grups de
      Contactes com a filtres** amb quants n'hi ha (`.tc-xips-v878436`; «Tots» o el grup del camp —`grups`— de sèrie) i la llista: amb
      «Tots», **cada grup plegat** (`details.tc-grup-v878436`, amb el nombre; si només n'hi ha un, obert); amb un grup, els seus contactes i
      «Veure tots els contactes»; buscant, els que coincideixen de tots els grups (amb un grup triat, la resta a «Altres contactes»). El
      triat porta ✓. Es tanca amb ×, Esc, tocant fora o triant. Al mòbil, a pantalla sencera (cercador i «+ Nou» a dalt, els filtres en una
      fila que es llisca). El text de la cerca és del camp (`q`, `setQ`): escriure al camp també busca.
    - **«Afegir agents a l'obra»** (`AgentPicker878301`, també «Afegir industrial»): el cercador i **«Crear un agent nou» a dalt**
      (`.agent-picker-cap-v878436`; abans, al peu), els **grups de Contactes** (`grupContacte878315`; abans els d'agents, amb «Administració»)
      i, amb «Tots» i sense buscar, cada grup plegat (`details.ap-grup-v878436`, «triats / quants»).
    - Estils `src/theme-v878436.css`. Prova: `v436test.mjs` (14, demo-gestio, ordinador i mòbil).
  - **V87.437 · Les hores del tècnic per fase i les fases alternatives** (l'Héctor, 30/10/2026: «les hores en cadascuna de les fases i sí a
    l'alternativa»):
    - **Hores per fase:** en una obra amb diverses fases, «Apuntar hores» (`HonorarisTemps`) i «Apuntar hores o una visita» (`ManualHours878256`)
      demanen la **fase** (xips; de sèrie la triada a la barra de fases) i la desen a l'apunt (`budgetId`); el comptador, la de la barra.
      Cada apunt diu la seva fase (`em.fase-v878437`). Les d'abans (sense fase) compten a la principal (`faseHores878437`).
      `costTecnic878431(obraId, fase, d)`: el compte de cada fase porta les seves «Hores tècniques» (abans només a «Tota l'obra»), i «Per
      fases» les diu a cada fila (ja no hi ha la fila «Hores tècniques» a part). També a la gràfica i al Rendiment de l'empresa.
    - **Fase alternativa** (dues opcions d'execució en un expedient): «⋯» de la barra de fases › «Marcar «…» com a alternativa» / «… ja no és
      una alternativa» (`altDirectBudget878437`; a `budgetGroups` `alternativa878437:true`; la principal no ho pot ser). A la barra, «A» i
      l'etiqueta «Alternativa», amb la vora discontínua; a «Per fases», «Alternativa · no suma». **No suma a «Tota l'obra»**
      (`altIds878437`, `okFase878437`): pressupost i total de la barra, certificat, facturat, despeses, hores, previsió, capítols, gràfica i
      Rendiment de l'empresa (`rendimentFase878342`, `previst878410`, `CapitolsFase878342`, `dadesRendEmpresa878343`). Amb la fase triada,
      es veu sencera com abans.
    - Estils `src/theme-v878437.css`. Prova: `v437test.mjs` (16, demo-gestio).
  - **V87.438 · Les mateixes targetes a totes les pantalles del menú** (l'Héctor, 30/10/2026: «les targetes han de ser totes de la mateixa
    tipologia independentment dels colors… els contactes no són iguals que les de dins d'una obra»). Eina nova `tools/proves/targetes437.mjs`
    (inventari: per a cada pantalla del menú i cada apartat d'una obra, cada targeta amb la classe, si té icona, si té línia de comentari, la
    vora i el títol; `OUT=`, `W=`, `COMPTES=`; resultat a `signatures-<W>.txt` i captures). Totes ara són `details.card.bloc-v878426`
    (icona, títol, una xifra, la fletxa; «Recollir» si són llargues):
    - **Contactes** (`Contactes878315`, `.contactes-v878438`): a dalt el títol i «Nou contacte» (`pant-cap-v878438`, sense la targeta que ho
      embolcallava), el cercador i cada grup una targeta (`grup-v878438`, icona de `ICONA_GRUP878438`, quants n'hi ha); un d'obert alhora.
    - **`CardOPlega878369`** (Inici: Pròximes cites, Feines pendents, Obres en curs, Encàrrecs tècnics; Rendiment; Hores › Setmana) ja no és
      una targeta oberta a l'ordinador i una línia amb comentari al mòbil: sempre la targeta comuna, plegada d'entrada, amb `xifra` (o el
      `resum`, retallat) i `icona`; les gràfiques, obertes a l'ordinador (`obertPC`). Manté la classe `plega-v878369`.
    - **Ajustos:** cada bloc amb la seva icona (`IC438`, `icAj438`).
    - **Despeses del menú** (empresa i «Les meves despeses»): cada grup una targeta amb l'import (`desp-cartes-v878438`, `togGrup438`;
      tancar el grup del filtre de dalt també treu el filtre). Fora la vora de color a l'esquerra.
    - **Facturació** («Gràfics i informes»), **Hores** («Gràfica i informes»), **Pressupostos** («Informes i gràfics»), **Rendiment del
      tècnic** («Per anys», «Per expedient», «Clients amb quota») i **Resum de l'obra al mòbil** («Pes per capítol»): la targeta comuna, sense
      la línia de comentari.
    - **Dades de l'empresa** (`DadesEmpresa878337({sub})`): els apartats són targetes principals a Empresa i secundàries (`sub-v878426`) dins
      d'Ajustos; fora la targeta «Dades de l'empresa» que ho embolcallava.
    - Les dates «Pressupost tancat el …», «Reobert el …», «Fixat el …» es mostren en hora d'aquí (`diaLocal878437`; abans, entre les 00:00 i la
      1:00 o les 2:00, el dia d'abans).
    - Queden amb un altre format, a propòsit: els filtres (`expf-v878275`, `filtres-v878316`), les files que es despleguen (hores del personal,
      fitxatge) i l'encàrrec tècnic (vegeu la proposta).
    - Estils `src/theme-v878438.css`. Prova: `v438test.mjs` (17).
  - **V87.439 · L'import de cada partida a la certificació és sempre quantitat × preu** (l'Héctor, 30/10/2026, amb una captura de Verbania:
    «revisa per què no està ben feta aquesta multiplicació… això no pot passar més perquè genera dubtes»; «fent un canvi s'han d'actualitzar
    els camps i les fórmules»):
    - **Causa:** a la 03.03 del pressupost P1 la certificació 1 deia 22,38 × 85,20 = 4.003,78 €. El 28/10 a les 13:31 es va canviar la partida des
      de Certificació › «Fitxa / accions» (concepte i preu de 178,90 a 85,20 €), i `updatePartidaMeta878132` guardava a `certAmountsByNum` l'import
      de cada certificació amb el preu d'abans (22,38 × 178,90), una cosa pensada per a les partides d'administració. A més, canviar la quantitat
      d'una certificació no tocava aquest import desat.
    - **Ara:** canviar el preu des de la fitxa torna a calcular les certificacions; només les que **tenen factura** (`certFacturada878439`) guarden
      l'import d'abans. Les d'administració (`esAdminRow878439`: `adminMonthlyAuto`, tipus «administració» o línies d'hores), com sempre.
      Canviar la quantitat d'una certificació treu l'import desat d'aquella certificació (`posaQCert878439`, als tres llocs on es desa la quantitat).
    - **Dades d'abans** (`reparaImportsCert878439`, en obrir una obra pròpia): els imports desats d'una partida normal que no són quantitat × preu,
      si no venen d'un Excel de certificació (`certImportedExcelV87231`) ni la certificació té factura, es tornen a calcular; el d'abans va a
      `aco_imports_cert_abans_v878439_<obra>`. Amb la còpia del 29/10, només la 03.03 de Verbania: 4.003,78 → 1.906,78 €.
    - **Si queda algun import que no és quantitat × preu** (d'un Excel de certificació, o una certificació amb factura després de canviar el preu):
      a Certificació › Partides i al PDF a origen, sota l'import, «a X €» en taronja (`PreuCert878439`, `notaPreu878439`) i, si es pot tocar,
      «Calcular a {preu}» (`recalcImport878439`, pregunta abans). Amb la còpia del 29/10: 5 partides de Cala Rovira 11 importades d'un Excel
      (07.11 cert. 4, 07.11-02 cert. 2, 07.12 cert. 6, 12001 cert. 6, 13014 cert. 7).
    - Estils `src/theme-v878439.css`. Prova: `v439test.mjs` (21).
  - **V87.440 · De la certificació a la proforma o la factura, enviar-la perquè la tornin signada i el correu al mòbil** (l'Héctor, 30/10/2026, a
    Verbania: «com passo la certificació 1 que ja està acceptada a proforma o a factura directa per enviar? no hi ha l'opció… inclús la
    certificació que he enviat per WhatsApp he de tenir l'opció que me la retorni signada… i per mòbil no he pogut enviar-li al correu»):
    - **«Fer factura» surt sempre** (`faOk878440`: comptes d'empresa, o el compte amb el client de l'obra si no és una obra compartida): a Verbania
      no sortia perquè el client (Brava) no tenia activada «Factures d'aquest client» (`potFacturar878337` ho exigia des de la V87.297). A
      `FerFactura878297`, sense numeració (`noSerie`), la sèrie es pot escriure (de sèrie `F<any>-`) i en crear la factura queda activada a la fitxa
      del client. També a Facturació de l'obra.
    - **Accions de la certificació:** «Proforma» (`docProforma878440`, s'obre al visor: Enviar · Descarregar el PDF · Imprimir) i «Fer factura».
    - **«Enviar» de la certificació pregunta** (`enviar440`): «Enviar la certificació» (amb el PDF) o «Enviar-la perquè la tornin signada»
      (`SignaturaCert878408 autoEnvia`: quan el PDF és a punt, crea l'enllaç i obre «Enviar», amb l'enllaç al missatge: correu o WhatsApp).
    - **Finestra «Enviar»:** les adreces de farciment no es proposen (`pendent@…`, `@despatx.cat`; a Verbania, `pendent@brava.cat`); si els marcats no
      tenen correu, ho diu (`sense-correu-v878440`); si el Gmail falla al mòbil, «Enviar amb el correu del mòbil» (`correuAparell`: Compartir amb el PDF).
    - **Gmail API:** encara s'ha d'activar (console.cloud.google.com/apis/library/gmail.googleapis.com, projecte «Control d'obres», Habilitar).
    - Estils `src/theme-v878440.css`. Prova: `v440test.mjs` (23, compte de l'Héctor amb una còpia del DADES a Verbania, ordinador i mòbil). Adaptada `factclienttest`.
  - **V87.441 · Els encàrrecs tècnics amb les targetes de sempre, sense haver de marcar el que no es té** (l'Héctor, 30/10/2026, amb el CEE de
    Cornellà de Terri: «si n'hi ha algun que no el marco, em queda com a pendent, però com que deixa marcar-ho com si el tingués vaig continuant…
    és la millor manera?»; «la targeta de preparar amb IA no està com la resta… les vull totes iguals»; «en aquests treballs no calen agents…
    només el client o el representant si és una agència… en documents només documents previs, de tramitació i fotos»):
    - **Encàrrec** (`EncarrecTecnic878306` reescrit, `.encarrec-v878441`, al Resum): a dalt, `.enc-cap-v878441`: el nom, el xip, la barra, **«Ara toca»**
      (`.ara-v878441`, el primer punt que falta des de l'últim pas on s'ha marcat alguna cosa; tocant-lo s'obre la seva targeta) i **«Pendent»**
      (`.pend-v878441`, el que s'ha saltat, cada punt obre la seva targeta). A sota, **una targeta comuna per pas** (`details.card.bloc-v878426.enc-bloc-v878441`,
      plegada, amb la icona `ICONA_PAS878441` i «fets/total»), **Enllaços** i **Preparar-lo amb IA**, iguals que les altres.
    - **`resumEncarrec`, `estatPassos`, `autoPunts`** (`src/encarrecsTecnics.js`, funcions pures): un punt que no es té ja no atura res ni s'ha de
      marcar «com si el tingués». L'app marca sola (casella desactivada) el que ja sap (`AUTO_PUNTS`): les dades del client, la referència
      cadastral, el pressupost acceptat, la factura, les fotos, «presentat» i el venciment.
    - **Lliurament:** la data de venciment (`passos878305.venciment`; `VENC_ETIQ878441`: «Data de la propera inspecció» a la ITE, «…revisió» a l'amiant) i
      **«Documents finals»** (`TRAMITS.<k>.finals`: l'acusament de rebut, la cèdula, l'etiqueta registrada…; van a Tramitació, clau `f:<key>`).
    - **Documents d'un encàrrec** (`documentFolders8775` torna `encarrec878441`, `.docs-enc-v878441`): tres targetes, **Documents previs · Tramitació ·
      Fotos** (la foto és `data.fotos`, amb «Treure la foto»); si hi ha arxius pujats a una altra carpeta, aquella carpeta també surt. Cada document de
      l'encàrrec va a la seva (`carpetaDoc`, `DOCS_PREVIS`).
    - **Dades:** sense la targeta «Agents de l'obra» ni «+ Altres agents»; pestanyes Obra · Client · Promotor · **Representant** (rol nou a `ROLS878304`;
      es tria del grup «Immobiliàries / agències» de Contactes).
    - **Acta d'un encàrrec:** a dalt de la llista, **«D'aquest encàrrec»** (`AssistentsActa878406 suggerits`, `.ass-sug-v878441`): el client, el promotor i el
      representant.
    - Estils `src/theme-v878441.css`. Prova: `v441test.mjs` (19). Adaptades `encarrec333test`, `amiant324test`, `v432test`, `facturacio337test`,
      `factclienttest`, `enviar407test` i les lliçons `guia404-llicons` (**la lliçó dels encàrrecs s'ha de tornar a gravar**).
  - **V87.442 · Obrir els programes de l'ordinador des de l'encàrrec** (l'Héctor, 30/10/2026, amb el CEE de Cornellà de Terri: «al CE3X em porta a la
    pàgina del Ministeri, però si jo ja el tinc pots entrar directament al programa?… això pot estar en una targeta on un altre tècnic pugui fer el mateix?»):
    - **Per què així:** una pàgina web no pot engegar programes pel seu compte. **Ajustos › «Programes de l'ordinador»** (`ProgramesPc878442`,
      `.prog-ajustos-v878442`; només Windows amb ratolí —`pcWindows`—, mòdul tècnic, no el treballador): la llista de programes (de sèrie el CE3X a
      `C:\Program Files (x86)\CE3Xv3.2\ce3xv3.2.exe`), «Preparar aquest ordinador» baixa `control-obres-programes.reg`, l'usuari l'obre ell mateix
      (Windows pregunta) i «Ja l'he obert» el dona per preparat. «Desfer-ho en aquest ordinador» baixa `control-obres-treure-programes.reg`.
    - **`src/programesPc.js`** (funcions pures): el `.reg` (`textReg`, `blobReg`, UTF-16 amb la marca) registra a HKCU, sense administrador, el protocol
      `controlobres-<clau>:`, que obre el programa **sense passar-li res** (l'ordre no porta `%1`). `rutaOk` només accepta una ruta completa acabada en
      `.exe`; `escReg` treu salts de línia i escapa barres i cometes. La llista és **de cada aparell** (`programes-pc-v878442` al localStorage de debò,
      `lsVisual878400`): cada tècnic prepara el seu ordinador. **L'app i les proves mai obren el `.reg`.**
    - **Encàrrec › Enllaços:** el CE3X preparat surt com a **«Obrir CE3X · En aquest ordinador»** (`a.prog-v878442`, `programa:"ce3x"` a
      `ENLLACOS_TRAMIT878333`) en lloc de la pàgina del Ministeri; els altres programes preparats, a sobre. El navegador pregunta «Obrir…?» la primera vegada.
      MagicPlan també al CEE, a l'amiant i a la ITE.
    - **Falta provar-ho amb el Windows de l'Héctor** (les proves comproven el text del `.reg` i els enllaços, no el registre).
    - Estils `src/theme-v878442.css`. Prova: `v442test.mjs`.
  - **V87.443 · Fitxa de la visita i documentació que llegeix la IA** (l'Héctor, 30/10/2026: «el plànol i la documentació que em genera el MagicPlan… podria connectar-se…
    si no, com a 2a opció, un apartat per poder incorporar la documentació i després, amb la targeta de preparació amb IA, emplenar o llegir el que calgui»):
    - **Fitxa de la visita** (targeta comuna a l'encàrrec, després dels passos; `.fitxa-v878443`, xifra `n/total`): els camps de cada treball (`FITXA_VISITA` de
      `src/encarrecsTecnics.js`: CEE 14, cèdula 7, ITE 7, amiant 5). Es desa a l'obra (`data.fitxa878443 = {clau: valor}`), cada camp en sortir-ne (`CampFitxa878443`).
    - **Preparar-lo amb IA** (ara a tots els treballs amb fitxa): **Documentació de la visita** (`.vis-docs-v878443`, «Afegir plànol o dades»: PDF, CSV, TXT, Excel o imatge;
      va a Documents previs, `tramit878306:"visita"`), «Copiar i obrir ChatGPT / Claude» (`promptFitxa`: la fitxa per omplir i el text de la documentació,
      `textVisita878443`, 50.000 lletres com a molt; el que no es pot llegir, «Adjunta-ho també al xat: …») i **Resposta de la IA** amb «Omplir la fitxa» (`llegirFitxa`:
      «Camp: valor», amb guions o negretes, valors de diverses línies; s'atura a la línia ---; un buit o «—» no es posa). **Només omple els camps buits:** el que ja s'ha
      escrit no es toca. Substitueix `iaCeePrompt878333`. Gratuït (copiar i enganxar).
    - **MagicPlan:** la seva API existeix (capçaleres `customer` i `key`), però la clau no pot anar al navegador: caldria una funció del servidor, i s'ha de confirmar amb
      MagicPlan que el «Report Plan» de l'Héctor la inclou. **Falta un plànol exportat de debò (PDF i CSV)** per afinar la lectura.
    - Estils `src/theme-v878443.css`. Prova: `v443test.mjs` (18). Adaptades `v441test`, `encarrec333test` i `amiant324test` (una targeta més).
  - **V87.444 · Els altres encàrrecs tècnics: informe, plànols, render, tràmit municipal i postobra** (l'Héctor, 30/10/2026: «revisa-ho treball per treball i ves penjant version»):
    - `ENCARRECS` de `src/encarrecsTecnics.js` amb cinc treballs més (`informe`, `planols`, `render`, `tramit`, `postobra`): passos, documents finals (`TRAMITS.<k>.finals`) i, a
      l'informe, els plànols i el tràmit, la seva `FITXA_VISITA`. **Llistes proposades perquè l'Héctor les corregeixi.** Els regexp de `tipus` no agafen «Projecte / llicència d'obres».
    - `teTramit(k)`: només els que tenen pas «Tràmit» (cèdula, CEE, ITE, amiant, tràmit municipal). **Sense tràmit:** a Documents la segona carpeta es diu «Documents finals» (la
      mateixa carpeta, `01_TRAMITS_AJUNTAMENT`), i a l'Inici surten a **«En curs»** amb «N de M fets» (abans haurien dit «Falten documents»).
    - La data de venciment del Lliurament només surt als treballs que tenen el punt «Data de…» (cèdula, CEE, ITE, amiant). «Presentació a l'Ajuntament» es marca sola en presentar.
    - Prova: `v444test.mjs` (33: cada treball amb el Resum, Documents i Dades, el tràmit presentat, una cèdula igual que abans, l'Inici i el mòbil).
  - **V87.445 · Les línies de les targetes no es tallen al mòbil** (trobat revisant les pantalles per als vídeos): «Feines pendents» diu «5 · 1 vençuda» (el
    títol ja diu què són), Hores › «Setmana» diu «26/10 – 01/11 · 12,00 h» (abans «Setmana del … al …» no hi cabia) i, a la targeta Certificacions, «Nova» és només el
    + al mòbil (`tx-v878445`; a l'ordinador, amb la paraula). Estils `src/theme-v878445.css`. Prova: `v445test.mjs` (6). Adaptada `v369test`.
  - **V87.446 · Detalls trobats gravant els vídeos**: a la constructora, el cercador d'Obres diu «Buscar obra, client o població…» i el Resum «Aquesta obra encara no té pressupost.»
    (`diuObra878326`; abans, «expedient»). El menú «Accions» de la certificació, en una columna (amb dues, «Importar Excel de certificació» quedava tallat al mòbil). La casella «Treballa
    a l'empresa» de la fitxa del treballador, al costat del seu text. Estils `src/theme-v878446.css`. Prova: `v446test.mjs` (7).
  - **V87.447 · Al mòbil i a l'iPad, tocar una partida obre la seva fitxa** (trobat gravant la lliçó del pressupost): des de la V87.426 la fitxa hi era però amagada: una regla vella de
    `styles.css` (`.budget-row-collapsed-v87173>*:not(…){display:none!important}`) guanyava a la de la V87.426; ni `v426test` ni `v427test` ho veien perquè miren l'ordinador o si
    l'element existeix. Al mòbil, les xifres en dues columnes. Estils `src/theme-v878447.css`. Prova: `v447test.mjs` (12: mòbil, iPad i ordinador, mira que es vegi de debò).
  - **V87.448 · L'import de les targetes no es talla** (trobat gravant en castellà: «Presupuesto principal 13.328,0…»): la xifra no s'encongeix mai i és el títol qui passa de línia
    (`src/theme-v878448.css`). A Facturació, «Gràfics i informes» diu només l'import i el % (`resumFact878397(…, true)`; el text sencer, al `title`). El capítol nou del dictat surt en
    l'idioma de l'usuari («OTROS», no «ALTRES»: `t()` a `destDe`), i «limpieza final», «escombro», «contenedor»… van a Gestió de residus. Prova: `v448test.mjs` (4). Adaptada `fact397test`.
  - **V87.449 · La targeta del pressupost: una sola fitxa, el descompost a la vista, seleccionar amb casella i la llista per comprar** (l'Héctor, 30/10/2026, amb captures de CP Front de Mar: «és un jeroglífic… per marcar has d'entrar dins del capítol, obrir la partida i a mig de tot surt el marcar… en entrar torna a posar el mateix… saber a quin preu s'ha de comprar perquè entri en pressupost»):
    - **Fitxa de la partida** (`FitxaPartida878361`, ara sempre dins de la seva targeta, `.fitxa-v878449`; fora la finestra `budgetPartidaView87208`): les partides són la mateixa targeta (`cartes-v878426`) per llegir i per editar (la fila vella només es queda al pressupost ràpid editant). No repeteix codi, quantitat ni import; editant, els camps (`.camps-v878449`) i la descripció. **«Descompost per {ut}»** a la vista (`TaulaDescompost878449`: Concepte · Rend. · Preu · Import · Quantitat total · Total, per grups, Cost directe, %, Preu unitari; sense les dues últimes si la quantitat és 0 o 1). Sense descompost: «Sense descompost · preu a confirmar» amb «Fer el descompost» i «Fer un descompost senzill»; un descompost sense cap línia de cost no compta. Un sol «Editar el descompost» (fora «Refer-lo senzill»).
    - **Marques** (`.marques-v878449`): «Fora de pressupost» i «No s'executarà tota la quantitat», dues caselles iguals en una fila (al mòbil, una sota l'altra).
    - **Seleccionar partides** (`selecciona449`; a l'ordinador, botó a la capçalera en editar; al mòbil i l'iPad, a «Eines»): una casella a cada partida (`.sel-fila-v878449`, sense obrir res) i a cada capítol (`.cap-sel-v878449`), i una barra fixa a baix (`.sel-barra-v878449`: quantes i l'import, Totes/Cap, Moure a…, Agrupar en una partida, Eliminar, Acabar). Fora la barra de dalt `budget-bulk-toolbar-v87229` i el requadre `edita-v878320`. Mentre hi ha una fitxa oberta (mòbil i iPad) o es selecciona, no surten ni el ＋ ni «A dalt».
    - **Descompost del pressupost** (`ResumPressupost878362`, `resumPressupost878362`): els totals i, a sota, una llista plegada per tipus (`LLISTES878449`: Materials, Mà d'obra, Maquinària i altres, Industrials) amb cada recurs sumat de totes les partides (pel concepte i la unitat): quantitat, **preu màxim** (import / quantitat: comprant-ho per sota, entra en pressupost; si varia, «de X a Y»), import i de quines partides surt. Avís de les partides sense preu i «Exportar Excel» (`exportaCompra878449`).
    - **Importar un Excel:** `descompostRowsToTable878174` guarda el codi de cada recurs (columna «Codi») i `fesTaula` l'«Origen del preu: …» (`table.origen878449`, si no és «a confirmar»); la fitxa ho ensenya.
    - **Compte amb dues regles velles de `styles.css`:** `.budget-row-collapsed-v87173>*` amaga tot menys el resum (per això `display:grid!important` a `.sel-fila`) i `.budget-v25-line b{text-align:right;white-space:nowrap}`.
    - **Front de Mar** (`Pressupost_FrontDeMar_OPCIO1.xlsx`, no copiar-lo): de 21 partides, 12 són «PREU A CONFIRMAR» a 0 € a l'Excel mateix (01.001–003, 04.101–102, 05.001, 05.003, 06.002, 07.001–004; els capítols 04 i 07 fan 0 €): el total de 243.098 € està incomplet. Les altres 9 tenen descompost; per portar-hi els codis i l'origen, Editar › Eines › «Tornar a llegir els descompostos d'un Excel…» amb «Substituir».
    - Estils `src/theme-v878449.css`. Prova: `v449test.mjs` (mira que es vegi de debò a l'ordinador, l'iPad i el mòbil; `NOMES=mobil` per passar només el mòbil).
  - **V87.450 · L'editor del descompost** (l'Héctor, 30/10/2026 a la nit, amb una captura del mòbil: «la primera meitat posa 3 vegades el mateix, els avisos ocupen massa»): `EditorDescompost878450` i `LiniaDesc878450` (`.desc-nou-v878450`, `src/theme-v878450.css`). El preu surt una sola vegada, sense avisos ni textos; tira curta Descompost · Preu tancat · Per lots; línies en fitxes; al mòbil, a pantalla sencera amb el preu a dalt i Cancel·lar · Desar a baix, i camps a 16 px (l'iPhone no fa zoom). Desar ja no mostra cap finestra. Fora la franja grisa de la vora esquerra del mòbil (l'ombra de la `.sidebar` tancada). Prova: `v450test.mjs` (33).
  - **Nit del 30-31/10/2026 (l'Héctor: «millorar les vistes i funcionalitat de les pàgines més complexes i utilitzades per les constructores… sobretot en versió mòbil… remarcar targetes o títols per diferenciar més on estem… penja versions per mirar-ho demà»).** Eines noves: `nit450.mjs` (captures amb una còpia del DADES: `OBRA=`, `TRIA=pres,cert,fact,desp,rend,amid`, `W=`, `H=`, `GAPS=1`) i `nit453.mjs` (captures amb un compte de prova: `APARTATS='Despeses|Planning'`, `PANTALLA='^Inici$|^Obres$'`, `ACCIO=`, `GAPS=1`, `DUMPH=1`, `DUMPK=`).
  - **V87.451 · Saber on som** (`src/theme-v878451.css`): **al mòbil, una sola tira** Fitxa · Seguiment · [Econòmic / Pressupost ▾] (`.txt-v878451`, `gira-v878451`) i les fases en una línia; la capçalera de l'obra passa de mitja pantalla a 150 px. **Nivells:** la targeta principal oberta té la capçalera **plena de blau** (#1D4ED8; els avisos, taronja) i es queda fixa en baixar (`--cap-obra-v878451`; `overflow:clip` a la targeta, que no talla el `sticky`); el capítol o la secundària oberts, **blau clar** (#DBEAFE), i el capítol, fix a sota. Amb això canvia el «Patró de pantalla» de la V87.432. A l'ordinador i l'iPad el que es queda fix és la barra Editar · Imprimir · Accions (55 px: si canvia, s'ha de canviar el `+ 55px` del capítol). Fora el total repetit a dins del pressupost (si està tancat, es manté: `tancat-v878451`). Descompost de la fitxa al mòbil en dues línies per recurs. El ＋ de l'obra, de 48 px, s'apaga mentre es baixa (`baixa-v878451`). Prova: `v451test.mjs` (29).
  - **V87.452 · Certificacions, Facturació i Rendiment al mòbil** (`src/theme-v878452.css`): les xifres de dalt són sempre `xifres-v878426` (a Facturació, abans 5 requadres: `fact-xifres-v878452`), de dos en dos; targetes a 8 px (el marge de la V87.451 i el `gap` del contenidor se sumaven: `.stack`, `.fact-layout-v87101`). **Certificació › Partides:** el capítol (`cap-m-v878429`, `.obert` fix a sota de «Partides») com el del pressupost, i cada partida en una fitxa de 150 px (abans 300): codi amb el concepte (`cod-m-v878452`), unitat amb la quantitat (`ut-m-v878452`), tres línies amb `data-m` (Pressupost · Aquesta · A origen; `data-l` es manté) i «Fitxa / accions» és un ⋯ de 38 px. Fora «Descripció completa disponible a la fitxa». **Editant:** `edita-fix-v878452`, barra fixa a baix al mòbil i l'iPad amb el total en viu, Cancel·lar i Guardar (a l'ordinador, `display:contents`). Casella a 16 px. Prova: `v452test.mjs` (21). Adaptades `v426test` i `v413test`.
  - **V87.453 · La resta de l'obra al mòbil** (`src/theme-v878453.css`): `.card>.card-head` en una línia i sense el títol que repeteix la tira (Planning, Visites, Documents). **Planning:** dues xifres en una línia (l'import ja és a l'Econòmic) i cada capítol en dues línies amb inici → final i dies (`data-u`). **Despeses de l'obra:** el total i Accions en una línia; cada despesa (`fila-v878348`, amb `flex` i `order`): proveïdor i total a dalt, número, data, base i IVA a sota, sense la data d'entrada. **Parte:** dia i encarregat amb la vora sencera. Prova: `v453test.mjs` (15).
  - **V87.454 · L'iPad** (`src/theme-v878454.css`): Certificació › Partides en fitxes fins a **1100 px** (abans 760: a l'iPad dret la casella quedava fora de la pantalla, darrere d'una taula de lliscar). Entre 761 i 1100 px, una fitxa de 90 px amb Pressupost · Aquesta · A origen un al costat de l'altre. A partir de 1101 px, la taula. Capítols plegats d'entrada fins a 1100 px. Xifres en una fila. Prova: `v454test.mjs` (9).
  - **V87.455 · Menú principal al mòbil** (`src/theme-v878455.css`): fora el títol gros que repetia la capçalera (Facturació, Rendiment, Empresa, Hores); Inici amb el saludo en una línia i les xifres en una fila; **Obres** sense títol i amb els paquets en una línia que es llisca (és la proposta 4 del «visual nou», que encara no s'ha validat); **Despeses** sense els requadres que repetien les targetes, amb el total, Filtres i Seleccionar en una línia (grid amb `order` i `grid-row`); Rendiment més baix. **Camps:** regla d'especificitat zero (`:where(.main) :where(input…)`): qualsevol camp sense estil propi té la vora sencera (surtien amb la vora `inset` del navegador). Prova: `v455test.mjs` (20).
  - **V87.456 · Verbania al mòbil: cada descompost al seu lloc, els preus per famílies, les hores previstes i «Enviar» que pregunta** (l'Héctor, 31/10/2026 al matí, amb 7 captures de l'iPhone: «el que fa la targeta partides i quadre és el mateix»; «fa mal a la vista que no estiguin les quantitats alineades»; «ho repetim»; «la utilitat real de veure un llistat interminable de preus així no em serveix de res… com a molt un llistat ordenat com una base de preus… a mà d'obra el total d'hores per preu/h i el total, per comparar-les amb els partes»):
    - **Descompostos d'un Excel:** el −44 % d'«Altres diferències» de Verbania no era de càlcul: tot el full de cada capítol anava a la primera partida i els % eren a 0. `workbookDescompostsFromWorkbook878228` reconeix els blocs amb títol i capçalera a sota, sense «Tornar» (`mk456`, `cap878456`); el % pot ser a l'etiqueta («Costos Indirectes (3% CI)», `pctEtiqueta878456`, `deEtiq878456`, `pctsEtiq878456`); un bloc sense imports no és un descompost; a la reparació en obrir l'obra (`reparaDescompostos878384`) cada bloc només va a partides lliures de la mateixa fase, pel codi exacte i després `codeMatches878177`, i els blocs d'aquest format només si el títol s'assembla a la partida o el preu quadra (`semblantBloc878456`, `encaixaBloc878456`). Amb la còpia, fase P1: 48 de 67 partides amb descompost i 40 quadren; «Altres diferències» de −47.378 € a 540,60 €. Les 8 que no quadren són de l'Excel mateix (02.07–02.09 una línia diu 0,80 € i porta 13,50 €; 02.17 preu 322 a l'app i 122 a l'Excel) o sense preu. **La fase PB no en tenia cap:** l'ha de llegir l'Héctor amb «Tornar a llegir els descompostos d'un Excel…» (49 partides, 47 quadren).
    - **Descompost del pressupost:** els materials, per famílies com una base de preus (`src/familiesRecursos.js`: 19 famílies per regles sobre el nom, 3 de 111 a «Altres»; `LlistaPreus878456`: cercador amb més de 8 línies, famílies plegades). **Mà d'obra** (`HoresPrevistes878456`, `.cat-v878456`, `.comp-v878456`): hores, €/h i import per categoria, total, i Previstes · Apuntades (partes i hores del personal, `rendimentFase878342`) · Queden / De més, amb la marca del % certificat. Hores previstes comptades per línia (`h` i `h/m²`). Línies a 0 € fora.
    - **Certificació amb factura:** només Resum i Quadre resum (fora la targeta Partides, que només servia per editar). La nota «a X €» de la V87.439 es queda al PDF: el quadre només ensenya imports.
    - **Previsió final:** fora «Veure les partides» (ja surten a «Fora de pressupost»). **Capçalera de l'obra** (`ObraHero878252`): «Previsió final», «1 certificació», «{p} de la previsió».
    - **«Enviar» del pressupost pregunta** (`enviar456`, `enviaPres456`): «Enviar el pressupost» (amb el PDF) o «Enviar-lo perquè el tornin signat» (`SignaturaCert878408 autoEnvia`, enllaç al missatge). Al pressupost ràpid, directe.
    - **Mòbil:** tira de l'obra opaca, «A dalt» rodó de 44 px al costat del ＋ i només en tornar enrere, menús sense l'ombra 100vmax, ＋ i «A dalt» amagats amb un menú obert, quantitats alineades, hover enganxat fora (`@media (hover:none)`), «Reobrir» amb la icona al costat (`div.tancar-v878428`: la regla afectava també el botó).
    - Estils `src/theme-v878456.css`. Proves: `descomp456unit.mjs` (16, Excels inventats) i `v456test.mjs` (còpia del DADES a Verbania). Adaptades `v449test`, `resum362test`, `v410test`, `v411test`, `v413test`, `v439test`, `cert364test`, `agentstest`, `whatsapp402test`, `enviar407test` i `facturacio337test`.
  - **V87.457 · Paquets fixos, tres targetes a l'obra i els nivells ben marcats** (l'Héctor, 31/10/2026, mirant la V87.456 al mòbil: «la pantalla d'obres no pot ser que funcioni amb scroll… les targetes de fitxa, seguiment i econòmic abans eren més visibles i ara sembla que és una única targeta… el blau és molt suau… o remarcar bé els perímetres… obres Runa i el paquet es distorsiona al final amb el següent»; `src/theme-v878457.css`):
    - **Obres / Expedients:** els paquets tornen a ser quadres fixos (fora les regles de la V87.455 i del «visual nou» que els feien lliscar; mana la graella de `theme-v878314.css`).
    - **Fitxa · Seguiment · Econòmic al mòbil:** tres targetes separades (`theme-v878451.css`), de 66 px, amb vora pròpia; l'activa, plena de blau i amb l'apartat a sota (desfà la tira única de la V87.451).
    - **Nivells:** principal oberta, blau fosc ple (#1D4ED8) i perímetre de 2 px; capítol o secundària oberts, **blau mitjà ple** (#60A5FA, abans #DBEAFE) i perímetre #2563EB; partida o família oberta, blau clar (#BFDBFE) i perímetre. Tancades, vora marcada de 1,5 px. Les partides, sobre un fons gris blavós (#E8EEF5) que les separa del capítol.
    - **Llista de preus:** cada família, una caixa tancada i separada de la següent (`.fam-v878456`), amb les files alternes.
    - **Descompost de la fitxa al mòbil:** l'import no es parteix en vertical amb conceptes llargs.
    - Prova: `v457test.mjs` (10). Adaptades `v451test` i `v455test`. `v451test` va fallar un cop al mòbil i, tornada a passar sense tocar l'app, en verd (causa no aclarida; `resum362test` va fer el mateix a la V87.456).
  - **V87.458 · La IA llegeix sola albarans, factures i PDF** (l'Héctor, 31/10/2026: «mira'm doncs com està tema lectura pdf… recordo que havia de copiar text a IA i no ho feia automàtic… ha de ser automàtic, i la factura igual»). **Funció `aco-ia`, instal·lada el 2/11/2026: si no respon, l'app fa com abans.**
    - **Una sola funció del servidor** (`supabase/functions/aco-ia/index.ts`; substitueix `llegir-albara` i `pressupost-ia`, que no es van instal·lar mai i s'han esborrat): `ping`, `despesa`, `pressupost`, `partides`, `preus`. Sonnet 5.5 per llegir i Opus 5.5 per fer partides i preus (es poden canviar amb secrets). Les dues primeres, amb resposta en JSON amb esquema (`output_config.format`). La clau mai no surt del servidor. Mentre la IA treballa s'envien espais perquè Supabase no talli als 150 s (el JSON se'ls salta), i es talla als 370 s (el límit és 400). **Límit per compte i mes** (`IA_LIMIT_MES`, de sèrie 300; `supabase/aco_ia_v878458.sql`, amb `grant`; sense la taula, sense límit).
    - **`src/iaObra.js`**: `iaActiva` (una pregunta per sessió), `iaCrida`, `trossosText` (trossos que es toquen 20 línies), `partidesDeIa` (treu les repetides), `pressupostDeIa`, `despesaDeIa`, `albaransDeFactura`. `window.__acoIaOff878458` per provar el camí sense funció.
    - **Despeses:** la foto o el PDF es llegeixen sols en triar-los (un sol cop: `llegit878458`). La IA diu si és albarà o factura i, si és una factura, quins albarans inclou (`cobreix`) i si és inversió del subjecte passiu. Amb la funció, fora el botó de ChatGPT.
    - **Pressupost en PDF** (`PdfPressupost878305`, `dubtosPdf878458`): primer la lectura de l'app (gratis); si no hi troba res, si el total no quadra o si n'hi ha més d'un 20 % per revisar, la IA, sola, a trossos de 30.000 lletres (escanejat: l'arxiu, fins a 14 MB). «Tornar-lo a llegir amb la IA». **Amidaments en PDF:** si l'app no hi troba res, la IA.
    - **Preus amb IA** (`PreusIa878368`): de 15 en 15 amb la funció nova.
    - Estils `src/theme-v878458.css`. Prova: `v458test.mjs` (9). El Supabase de proves té `/functions/v1/aco-ia` i `POST /__aco-ia {limit, falla}`. Adaptades `pressupost368test` i `pdfpressuposttest` (amb `SENSE_IA`).
  - **V87.459 · Pressupost automàtic amb IA** (l'Héctor, 31/10/2026: «insisteixo en poder fer pressupost automàtic amb la IA»; un petit autònom ha de poder fer-se el pressupost sense saber-ne). **Va amb la funció `aco-ia` de la V87.458: si no respon, el botó diu «Dictar partides…» com abans.**
    - **On:** «Fer el pressupost amb IA» al pressupost buit (`PresBuit878435`; si la fase ja té amidaments, primer «Portar les N partides») i «Pressupost amb IA» a «Afegir» i «Accions», en lloc de «Dictar partides…» i del botó vell de copiar i enganxar.
    - **Com** (`DictarPartides878401`, `ambIa`): es diu o s'escriu què s'ha de fer i es poden adjuntar amidaments (BC3, Excel, PDF), plànols o fotos (com a molt 4; PDF fins a 14 MB). `iaCrida("partides")` fa les partides; els preus surten com als amidaments (`preusAmidaments878368`: Preus, banc amb l'IPC, obres anteriors) i les que queden sense preu, de `iaCrida("preus")` de 15 en 15; marges amb `margesLinia878378`. Revisió de sempre abans d'afegir-les (`tipus:"IA"`, origen «IA · …»). Capítols: el del pressupost amb el mateix nom o «Capítol nou: NOM». «Llegir-ho sense IA» si no hi ha funció o falla.
    - Estils `src/theme-v878459.css`. Prova: `v459test.mjs` (17, amb la funció simulada). Adaptades amb `SENSE_IA` `dictat401test`, `v428test`, `pressupost320test`, `pressuposttest`, `v413test`, `pestanyestest` i `v435test`.
  - **V87.460 · Banc de preus comú** (l'Héctor, 31/10/2026: «si de moment es comercialitza per Girona poden utilitzar la meva base de preus…? la base és del 2023 i s'ha de posar al dia amb l'IPC»). **Falta que l'Héctor executi `supabase/aco_banc_comu_v878460.sql`, importi la base i hi doni al botó.** La base no és ni al disc ni al núvol. Abans de compartir-la, comprovar que té permís per repartir-la (la V87.372 ho descartava per als bancs amb llicència).
    - **Núvol:** taula `aco_banc_comu` (una sola fila: `nom`, `any_preus`, `pct`, `n`, `dades`, `versio`). Tots els comptes la llegeixen; només hi escriu el compte que no és `@usuaris.controlobres.app` (l'Héctor, la mateixa regla que `aco_espai()`). `__acoCloud.bancComu` (`cap`, `baixa`, `puja`, `posa`, `treu`).
    - **Compte de l'Héctor:** no té «Preus» al menú, i el banc només era dins dels Amidaments: ara també a Ajustos › «Preus i marges». `CompartirBanc878460`: «Compartir amb tots els comptes», «Compartit…», «Actualitzar el banc comú» (si n'importa un de nou) i «Deixar de compartir». L'any i el % arriben a tothom sense tornar a pujar les partides.
    - **La resta de comptes:** `syncBancComu878460`, 6 s després d'obrir l'app (només amb el mòdul Obra): mira la capçalera i baixa les partides només si ha canviat `versio`; es guarden a l'aparell a `banc-comu-v878460` (sense `aco_`: no es pugen). `bancPreus878368()` = el banc propi o, si no n'hi ha, el comú (etiqueta «Banc comú», sense tocar-ne res).
    - **IPC:** l'enllaç «Calcular l'IPC (INE)» ja porta l'any del banc i l'últim mes publicat (`urlIpc878460`). Gener 2023 → setembre 2026: 13,4 % (INE).
    - Estils `src/theme-v878460.css`. Prova: `v460test.mjs` (18). El Supabase de proves té `/rest/v1/aco_banc_comu` i `GET /__banc`; `SENSE_BANC=1`: la taula no existeix.
  - **V87.461 · Factures i albarans en un llistat que es desplega, i les targetes de Despeses a tots els comptes** (l'Héctor, 31/10/2026: «millora tema factures i albarans perquè aquí no està desplegable, han de sortir les factures, el llistat, i després veure les factures»; sense captura: s'ha entès Despeses de l'obra; les factures d'honoraris de l'expedient, `FacturesTecniques8738`, no s'han tocat):
    - **Dins de l'obra, les targetes a tots els comptes** (`nova878348` amb `fixedObra`): el compte de l'Héctor encara tenia la llista plana. «Per repercutir» a la capçalera (`rep-v878461`) i a cada despesa (`rep-bt-v878461`). Sense mà d'obra ni hores del personal, la targeta de Mà d'obra no surt.
    - **El llistat** (`filaF`, `ob-v878461`): cada factura és una línia que es desplega (abans, tocar-la obria l'editor): a dins, «Veure la factura», «Editar», els seus albarans (`albaransDe`, `incl-v878461`, amb la suma i la diferència amb la base de la factura) i les línies. Els albarans inclosos ja no surten ratllats al llistat (només si la factura no hi és pels filtres); en seleccionar, surten tots. La resta, a «Albarans sense factura» (`factures`, `taulaF`; plegat, obert si no hi ha cap factura).
    - **Mòbil:** cada fila en dues línies (proveïdor i total; número i data); la base i l'IVA, a dins (`xif-v878461`).
    - El PDF s'obre al visor de l'app (`veure878461`): el marc no funciona a l'iPhone.
    - **Total de dalt = la suma de les targetes** (`total426`): amb una fase triada deia 0 € si les despeses no tenien fase, i les targetes les ensenyaven.
    - La llista plana vella (`fila`, `vista`) ja no es fa servir enlloc: es pot esborrar.
    - Estils `src/theme-v878461.css`. Prova: `v461test.mjs` (26: constructora, gestió total al mòbil i compte de l'Héctor amb una còpia).
  - **V87.462 · Amidaments només amb quantitats i el pressupost sempre plegat** (l'Héctor, 1/11/2026, amb una captura de CP Front de Mar: «aquesta pantalla d'amidaments pq hem de parlar de preus?»; «continua havent pantalles desplegades quan entres»):
    - **Amidaments** (`Amidaments878328`): a dalt, «Passar-ho a pressupost» i «⋯» (amb «Llegir un altre arxiu» i «Buidar els amidaments»), una sola línia; sense preus, sense «Preu a mà» ni descompost a les files (`data-pu`, `data-font` i `data-nota` només per a les proves).
    - **«Preus» i «Obra, logística i marges»** passen a la finestra de «Passar-ho a pressupost» (`eines878462`, prop `eines` de `PassarPressupost878328`), plegades. Els preus es continuen posant sols en llegir l'arxiu: només no es veuen.
    - **Pressupost:** la targeta ja no recorda si s'havia deixat oberta (V87.427): surt sempre plegada. `pres-prova-obert-v878462` només el posen les proves (`helpers` d'`alhoratest.mjs`).
    - Estils `src/theme-v878462.css`. Eina nova `plegat462.mjs` (què s'obre desplegat en entrar a cada pantalla, `W=`, `COMPTES=`, `WEBROOT=`). Adaptades `amidaments328test`, `pressupost368test`, `pressupost372test`, `preus378test`, `v435test` i `v427test`. `amidaments328test` va fallar una vegada al pas del PDF i, tornada a passar, en verd.
  - **V87.463 · Comptador de temps** (l'Héctor, 1/11/2026: «no em va funcionar bé fent una feina del CEE de Cornellà»; no va dir què va fallar). Trobat al codi: el temps només era a la memòria (qualsevol recàrrega el perdia), el rellotge d'Honoraris › Hores no corria (des de la V87.304 l'App ja no es torna a dibuixar cada segon), i aturar-lo des de la barra desava sol «Temps cronometrat» al preu de sèrie, sense l'acord del client ni la fase, i si feia menys d'un minut no desava res sense dir-ho.
    - **El temps es recorda a l'aparell** (`comptador-v878463__<usuari>` al localStorage de debò, `timerKey878463`): sobreviu a una recàrrega. No passa d'un aparell a un altre.
    - **En aturar-lo, una finestra** (`DesarTemps878463`, `aturaTemps878463`, `acabaTemps878463`): la feina (`TASQUES878430`), les hores (es poden corregir), la nota i, amb diverses fases, la fase; Descartar · Continuar comptant · Desar. El preu i l'estat de facturació surten de l'acord amb el client. El temps continua comptant fins que es desa.
    - **Honoraris › Hores:** una línia (`crono-fila-v878463`) amb el rellotge que corre i «Aturar i desar»; fora el formulari plegat. Amb el comptador en una altra obra, «Desar l'altra i començar aquí» pregunta per aquella i després engega aquí.
    - **Fora el comptador automàtic** (`autoTimerOn878254`, la casella «Automàtic» de la bombolla): l'Héctor no el vol (V87.376).
    - Estils `src/theme-v878463.css`. Prova: `comptador463test.mjs` (20; substitueix `comptador382test`). Adaptades `mobiltest`, `v366test` i `v410test`. **Compte:** una prova tallada amb `timeout` deixa el servidor i el Supabase de proves en marxa i la següent falla en entrar: `D:\aco-tmp\passa.sh prova1 prova2…` les passa d'una en una sense tallar-les.
  - **V87.464 · Resum i Agenda de l'obra plegats** (Bloc 1; l'Héctor, 1/11/2026: «continua havent pantalles desplegades quan entres»; `plegat462.mjs`: eren les dues pantalles de l'obra més llargues al mòbil):
    - **Resum** (`ObraHero878252`, `net-v878464`): primer la barra de l'executat, les xifres i `ObraFollowUp878253`; el contacte (`ContacteObra878304`), els enllaços, «Compartir» i la foto, a la targeta plegada **«Contacte i enllaços»** (`contacte-bloc-v878464`), a tots els aparells. Fora el requadre gran de dalt.
    - **Agenda de l'obra:** dues targetes plegades, **«Cites i avisos»** (`AgendaExpedient8774`, amb quantes) i **«Feines pendents»** (`TasquesTab8769`, amb quantes i les vençudes). La de cites es queda oberta després de dictar o de cancel·lar (`oberta464`).
    - Estils `src/theme-v878464.css`. Prova: `v464test.mjs` (11). Adaptades `constructor336test` (l'Agenda general en Llista: el diumenge, «demà» cau a la setmana següent; i els Documents d'un encàrrec) i `seguiment321test`.
  - **V87.465 · Preus, Agenda i Partes al mòbil** (Bloc 2): **Preus:** fora el requadre blau gros; una línia amb «Nova partida» i «⋯» («Nou capítol») i el banc en una targeta plegada (`BancBloc878465`, amb quantes partides). **Agenda:** al mòbil i l'iPad, els filtres i la llegenda plegats a «Filtres» (`ag-filtres-v878465`, `tauleta878465`); el botó de Google es queda a la vista. **Partes:** sense repetir el títol al mòbil. Estils `src/theme-v878465.css`. Adaptada `neteja353test`.
  - **V87.466–467 · Menús clars, fases sense tallar i «Visual nou», segona proposta** (l'Héctor, 1/11/2026, amb captures de CP Front de Mar: «els 3 punts no es veuen bé en obrir-se»; «queda bé els 3 punts i després a sota Accions amb tres punts més… la interfaç no pot ser més moderna?… clara i maca»):
    - **Amidaments:** «Accions» en lloc de «⋯», i el menú amb l'amplada del text (feia 110 px i «Llegir un altre arxiu» es tallava: el panell absolut d'un `details` petit s'encongeix; cal `width:max-content`). A Preus, igual.
    - **«Accions»** sense l'icona dels tres punts al davant (pressupost, certificació, despeses).
    - **Fases al mòbil:** repartides a l'amplada i sense el número (la tercera quedava tallada); si no hi caben, es llisquen.
    - **Visual nou** (`src/theme-v878467.css`, només amb Ajustos › Aspecte › «Visual nou (en proves)», al compte de l'Héctor i als `demo-*`): targetes sense vora, separades per l'ombra (a la V87.457 l'Héctor va demanar perímetres marcats: ara proposa una altra manera de separar-les), radi de 18 px, botons de 44 px, xebró sense cercle, fases com un sol control, capçalera i barra de baix translúcides, i l'apartat actiu de la barra de baix amb una píndola. Les proposicions de la V87.400 continuen sota la mateixa opció. **Si el valida, es treu la condició i es posa per a tothom.**
    - Estils `src/theme-v878466.css` i `src/theme-v878467.css`. Adaptada `v435test`.
  - **V87.468 · Bloc 2: Despeses i Rendiment a l'ordinador i l'iPad** (2/11/2026; l'Héctor: «fes el primer que tens pendent»):
    - **Despeses (menú) a partir de 768 px** com al mòbil des de la V87.455: fora els cinc requadres que repetien les targetes (continuen al codi, amagats: `desp-grups-v878338`), el total, les vistes, Filtres i Seleccionar en una línia, els filtres plegats (el botó `filtres-btn-v878349`), i a baix ja no es repeteix «Total base» (`!nova878348`).
    - **Gràfica del Rendiment** (`LiniesChart878343`): quan totes les línies acaben al mateix lloc, les etiquetes del final s'apilaven cap avall i «Benefici» quedava tallada; ara s'apilen cap amunt des de la base del gràfic.
    - **Inici:** «Revisar-la» amb una sola feina vençuda.
    - Estils `src/theme-v878468.css`. Prova: `v468test.mjs` (ordinador, iPad i mòbil).
    - Adaptades `v455test` (a l'ordinador, sense requadres) i `grafica384test` (fallava pel canvi de mes, no per la versió: l'eix arriba fins al mes d'avui). Cost de la IA per a 50 comptes: `docs/pressupost-ia.md`.
  - **V87.469 · Lectures de la IA: el paquet de cada compte i el cost de debò** (l'Héctor, 2/11/2026: «un paquet de lectures per empresa a repercutir després»):
    - **Comptador** (`supabase/functions/aco-ia/index.ts`): substitueix `IA_LIMIT_MES` (300 peticions iguals; pitjor cas 6.900 $/mes). 1 lectura = 3 cèntims (`LECTURA_USD`). Mínims `PES`: despesa 1, pressupost 6 per tros, partides 8, preus 15 (6 amb `IA_WEB=0`); si la crida ha costat més, compta el que ha costat (`lecturesDe`): així les lectures sempre cobreixen el cost. Una feina que falla no compta el mínim però sí el gastat (`fes`, amb `finally`). No es comença si no hi cap el mínim.
    - **Paquets** (`limitDe`): `aco_ia_comptes.lectures_mes` si n'hi ha; si no, pel perfil llegit d'`aco_kv` (`key=like.*__aco_empresa_v878259`; no el diu l'app): tècnic i treballador `IA_LIMIT_TECNIC` (150, 4,50 $); la resta i el compte principal `IA_LIMIT_EMPRESA` (500, 15 $). Màxim amb 30 constructores i 20 tècnics: 540 $/mes.
    - **Cost de debò** (`Gast`, `preuModel`, `costDe`): tokens (també els de memòria cau), cerques (`usage.server_tool_use.web_search_requests`) i preus oficials del 2/11/2026; un model desconegut es compta com el més car. A `aco_ia_us` per mes i a `aco_ia_crides` per crida, sense res del document. Consultes a `docs/pressupost-ia.md`.
    - **Sense l'SQL la funció no treballa** (`usat` torna `null`; abans, sense la taula no hi havia límit). L'SQL és el mateix fitxer, `supabase/aco_ia_v878458.sql` (puja bé si ja s'hagués executat l'antic). Només hi entra `service_role`: cap client pot veure el cost.
    - **App:** Ajustos › Perfil i mòduls, «Lectures amb IA aquest mes: 23 de 500» (`iaQuota`; no al treballador, ni sense límit, ni sense funció). Ajustos: fora el requadre buit de dalt de cada bloc (`src/theme-v878469.css`).
    - **Proves:** `acoiafunciotest.mjs` (40; executa l'`index.ts` de debò amb la IA i el Supabase simulats i comprova els paràmetres contra l'SQL; `ACO_IA_FN=` per provar-ne una còpia: 7 errades posades a posta, totes detectades), `acoiasqltest.mjs` (27; Postgres de debò amb PGlite a `D:/aco-tmp/pglite-469`: de zero, dues vegades, sobre l'SQL antic, permisos i les consultes de la documentació) i `v469test.mjs` (11). Passen `v458test`, `v459test`, `perfils326test`, `pressupost368test`, `simple354test`, `v438test`, `v366test` i `i18ntest`.
  - **Instal·lació de la IA** (2/11/2026, pas a pas amb l'Héctor; l'app no canvia):
    - **Saldo:** el pla Max de l'Héctor porta 100 $ al mes de crèdits d'API sense targeta, vinculats a l'organització «Control d'obres» de la Console (platform.claude.com). Si s'acaben, la IA s'atura i no es cobra res; el que no es gasta no passa al mes següent. Abans de cobrar-ho als clients, mirar si un producte de pagament els pot gastar.
    - **Al servidor:** clau `control-obres` (Default Workspace, sense caducitat) al secret `ANTHROPIC_API_KEY`, `aco_ia_v878458.sql` executat i funció `aco-ia` instal·lada des del panell (Via Editor), amb **Verify JWT apagat**: la funció comprova ella mateixa l'usuari (`/auth/v1/user`). **Per canviar-la:** Edge Functions › aco-ia › Code, enganxar `index.ts` i Deploy.
    - **`index.ts`:** llibreria fixada a `@anthropic-ai/sdk@1.3.0` i claus noves de Supabase (`SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`; una clau `sb_…` només va a `apikey`).
    - **Proves:** `acoiasdkreal.mjs` (13; executa l'`index.ts` amb la llibreria real, instal·lada a `D:/aco-tmp/sdk-469`, i una API i un Supabase simulats) i `acoiafunciotest.mjs` (40). **De debò:** 2 documents a Despeses, 2 lectures, s'omplen sols. Encara no s'han provat de debò el PDF de pressupost, les partides ni els preus.
    - **Activa per a tots els comptes** (`brava`, `socoterm`, `oriol`, `marti`, `demo-*`). Com que la funció respon, «Dictar partides…» ja diu «Pressupost amb IA» i Despeses ja no té el botó de ChatGPT: els vídeos i el manual d'aquestes pantalles han quedat enrere.
  - **V87.470 · Despeses per data d'emissió i cercador de despeses i factures** (l'Héctor, 2/11/2026: «hauran de sortir en ordre de data d'emissió i no d'entrada… un filtre per buscar per número, data o client… i el mateix amb les factures pròpies»):
    - **Ordre de Despeses:** el de la V87.360 (data d'entrada) passa a ser la data d'emissió, l'última a dalt (`rows0`; sense data, la d'entrada). La columna «Entrada» es queda. Les factures emeses ja anaven per data d'emissió; dins de l'obra, la seva llista continua per número.
    - **`src/cercaLlistes.js`** (`cercaOk`, `dataIso`, funcions pures): cada tros de la cerca ha de ser als textos (sense accents, majúscules ni puntuació) o a la data, escrita com es vulgui: 02/11/2026, 2-11-26, 2/11, 11/2026, 2026-11, 2026, novembre, noviembre.
    - **Despeses:** el cercador dels filtres (`coincideix878348`) també troba la data d'emissió i el client de l'obra. Dins de l'obra, amb 6 despeses o més, la lupa és a la vista (`buscar-v878470`, `nObra878470`: obre els filtres amb el cursor al cercador, i «Filtres» surt d'«Accions»). Buscant, només surten les targetes amb resultats i, si no n'hi ha cap, «Cap despesa amb aquests filtres.».
    - **Facturació** (`FacturacioEmpresa878337`, `FacturesGeneral8738`): amb 6 factures o més, cercador als filtres (`cerca-v878470`): número, data, client, obra i concepte. Buscant es mira a tots els anys, com a la llista d'obres: cap any marcat, sense el selector de mes, i el total i «Per a la gestoria» diuen «Cerca «…»». Tocar un any buida la cerca.
    - Estils `src/theme-v878470.css`. Proves: `cerca470unit.mjs` (35) i `v470test.mjs` (37). Adaptada `v453test` (fallava des de la V87.464: l'Agenda de l'obra és una targeta plegada).
  - **V87.471 · Facturació de l'empresa i del tècnic amb factures de debò** (l'última pantalla del Bloc 2, mirada amb dotze factures inventades de tres anys, `facturacio471.mjs`):
    - **Per facturar a l'ordinador:** l'última columna d'una fila amb `auto` feia una amplada diferent de la capçalera, que no té botons, i els títols no quedaven a sobre de les xifres. Ara és de 190 px, com a les factures.
    - **Per facturar al mòbil i l'iPad:** cada certificació en dues línies (número i data · total; obra i client · «Fer factura»); abans feia 200 px. La base i l'IVA surten a «Fer factura».
    - **Total a baix de «Per facturar»** (base, IVA, retenció si n'hi ha, i total), com a Factures.
    - **Filtres al mòbil** (≤700 px, `filtres-m-v878471`, `obert-v878471`, empresa i tècnic): els anys a la vista i la resta darrere de «Filtres», que diu quants n'hi ha d'actius («Filtres (1)»). La primera factura passa de 350 a 168 px. A l'iPad i l'ordinador, com abans.
    - **Fora el títol que repeteix la capçalera fixa també a l'iPad** (la mateixa condició que la capçalera: ≤1280 px o pantalla tàctil; Facturació, Rendiment, Empresa i Hores). «Per a la gestoria» passa a la línia de les pestanyes; al mòbil, només la icona (`tx-v878471`, amb `titol` perquè tingui nom).
    - **Menú lateral a l'ordinador:** amb un nom d'empresa llarg sortia una barra de desplaçament a baix: `.active-user-v8780` feia sempre 150 px i la columna no s'encongia. Ara l'etiqueta s'encongeix i el nom de l'app va a 17 px, en una línia.
    - **Compte:** `.action-menu-v87213>summary span` posa la lletra a 18 px: un `span` amb text dins del `label` d'un menú ha de portar `font-size:inherit`.
    - Estils `src/theme-v878471.css`. Prova: `v471test.mjs` (29).
  - **V87.472 · «Fer factura» amb els valors de sèrie, la frase legal de l'IVA 0 %, l'entitat i l'IBAN, i el dia de cobrament** (l'Héctor, 2/11/2026, provant Facturació amb Brava: «m'hauria de posar valors per defecte com el NIF… i el % de IVA»; «a 0 %, a sota la factura la coletilla de perquè està exempta»; «el número de compte i l'entitat»; «he de poder posar el dia de cobrament, no el dia que ho fiscalitzo jo»):
    - **A qui es factura** (`destFactura878472`): primer el destinatari de la darrera factura de l'obra; si no, als comptes d'empresa el client de l'obra (raó social, NIF, adreça sencera) i al compte de l'Héctor el promotor (l'emissor és el client). El que falti surt de la fitxa de Contactes de la mateixa persona (`contacteDe878413`). Una obra compartida sense client propi només té el nom del promotor: si a Contactes no hi ha el NIF, surt buit.
    - **IVA i retenció de sèrie** (`defFactura878472`, `client.fact878472 = {iva, ret, motiu0, motiu0Text}`, a la fitxa del client, bloc «Factures a aquest client»: comptes d'empresa o client amb sèrie activada). Ordre: el de la certificació (`factParams`) → la darrera factura de l'obra → el client → 21 %. Hi passen `calcPf878337(data,f,legacy,client)`, `calc` de `Fact` i Per facturar.
    - **IVA 0 %**: motiu «Inversió del subjecte passiu» (de sèrie; exigeix el NIF del client) o «Un altre motiu» amb text; es desa a la factura i a `factParams` (`motiu0`, `motiu0Text`, `motiuPf878472`) i surt sota els totals de la factura i la proforma (`fraseIva0878472`, en l'idioma del document). Les factures d'abans, sense motiu, no canvien. A la gestoria, columna «Motiu IVA 0 %» a l'Excel i «ISP» al llistat PDF. **El text l'ha de validar la gestoria**, i la inversió només val per a destinataris empresaris o professionals en obres de construcció o rehabilitació (art. 84.Uno.2.º f de la Llei 37/1992).
    - **`ivaNum878472`**: un IVA desat pot ser 0. `+x||21` el tornava 21: el PDF deia «IVA 21 %» amb la quota a zero, i a les factures d'honoraris el 0 no es podia desar.
    - **Entitat i IBAN**: `banc` a Empresa › Dades › Cobraments i a Ajustos › Documents (emissor d'honoraris); `fraseCompte878472` a la factura, amb l'IBAN de 4 en 4; si l'empresa no té IBAN, «Fer factura» demana «Compte per cobrar» (opcional). A les factures d'honoraris, les observacions ja no amaguen la forma de pagament.
    - **Dia de cobrament** (`CobramentFactura878472`, a les dues Facturacions): el botó obre una finestra amb el dia (de sèrie avui); si ja és cobrada, es pot corregir o «Tornar a pendent».
    - Estils `src/theme-v878472.css`. Prova: `v472test.mjs` (31). Adaptades `fact373test` i `facturacio337test`.
  - **V87.473 · Hores del personal per setmanes de feina** (l'Héctor, 2/11/2026, amb una captura: «he de poder veure per setmanes de feina segons calendari laboral… i no que sortir aquest desplegable només entrar… en posar emplenar hores surt això dels treballs, des d'aquí o des de la pròpia obra… més pràctic i visible… he posat igual que el 22/10 i no puc tirar enrere»):
    - **En entrar** (`PartHores878340`, `form473` fals): la setmana (‹ ›, «Setmana N», «Aquesta setmana», «Emplenar hores»), un requadre per dia laborable (`dia-t-v878473`: de dilluns a divendres, i dissabte o diumenge només si tenen hores; festius d'Empresa › Calendari, `festiusCalendari878473`) i una fila per treballador (`matriu-v878473`). Al mòbil, el nom a sobre i els dies a sota.
    - **Tocar un dia, una casella o «Emplenar hores»** obre els treballadors d'aquell dia. En desar, torna a la setmana. Sortir amb canvis pregunta (`potSortir473`).
    - **Desfer:** amb canvis, «Desfer els canvis» en lloc de «Com el…»; un dia ja desat es pot «Buidar el dia».
    - **Al mòbil i l'iPad**, les hores es posen a la mateixa línia del treballador, sense obrir-la (`input.h-v878473`); a dins, l'obra i la fase.
    - **Des de l'obra** (`PersonalObra878340`, Despeses › Mà d'obra › Hores del personal, i Hores a la gestió total): «Emplenar hores» obre la mateixa pantalla en una finestra (`obraFixa`): sense triar l'obra, només les hores d'aquella obra i sense tocar les de les altres. Substitueix «+ Afegir hores». En tornar a desar un dia, la nota de cada línia es conserva.
    - Estils `src/theme-v878473.css`. Prova: `v473test.mjs` (28). Adaptades `personal340test`, `horesunic355test`, `fases342test`, `fitxatge357test`, `equip381test` i `v445test`. **La lliçó de vídeo de les hores s'ha de tornar a gravar** (`guia404-llicons.mjs`).
  - **V87.474 · Estat «Pendent de tancar»** (l'Héctor, 2/11/2026, amb el CEE de Cornellà, 620 €: la feina és acabada, però falta l'etiqueta de Gencat, la factura i el cobrament): estat nou (`EXPEDIENT_STATUS878136`, color groc `est-ptancar`), obert a tots els efectes. `faltaTancar878474` diu el que falta: els punts de Tràmit i Lliurament de l'encàrrec, «Per facturar» (honoraris acceptats), certificacions per facturar i «Per cobrar». Surt als avisos del Resum i de l'Inici («Per tancar: …») i, en passar a Tancat amb coses pendents, l'app pregunta (`potTancar878474`, a la barra de l'obra i a la llista). Estils `src/theme-v878474.css`. Prova: `v474test.mjs` (9).
  - **V87.475 · Actes sense buides, «Eliminar» dins de l'acta i «Compartir» i la foto a la vista** (l'Héctor, 2/11/2026: «surt aquesta del 22/10 sense res i no es pot ni eliminar… quan posi acta nova, automàticament amb el dia que la faig»; «no hi ha el botó de compartir… ni a la fitxa surt a dalt la foto de l'obra»):
    - **Causa de l'acta buida:** `addActa` la desava a l'instant i «Cancel·lar» la deixava. Ara no es desa fins a «Guardar acta» (`save` l'afegeix si no hi és) i surt sempre amb el dia d'avui. Les que van quedar buides (`actaBuida878475`: mai desades, sense text, fotos, assistents, documents, croquis ni signatures) es treuen en obrir Visites.
    - **«Eliminar l'acta»** dins de la fitxa (des de la V87.309, amb la llista de Visites, ja no hi era). No en obres compartides per un altre compte; si és signada, ho diu abans.
    - **Fora el nom de l'Héctor** com a DEO de sèrie de les actes (surtia a totes les empreses): ara «Pendent».
    - **«Compartir» i la foto de l'obra**, a dalt del Resum (`cap-resum-v878475`): a la V87.464 havien quedat dins de la targeta plegada «Contacte i enllaços» i no es trobaven.
    - Estils `src/theme-v878475.css`. Prova: `v475test.mjs` (10). Adaptades `v464test` i `plustest`.
  - **V87.476 · «Pressupost amb IA»: uns amidaments es llegeixen tal com són** (l'Héctor, 2/11/2026, amb els amidaments de Llafranc —48 pàgines, 102 partides—, obra «pressupost PROVA IA» de Brava: «l'ha fet fatal», i 117 lectures per un sol pressupost):
    - **Causa:** el botó enviava l'arxiu a la IA amb l'encàrrec de fer les partides (`accio:"partides"`: concepte curt, codi buit, agrupar en capítols) i després buscava tots els preus amb la IA de 15 en 15. 7 tandes a 15 lectures com a mínim + les partides. Tot i que l'app ja sabia llegir aquests arxius: 102 partides del PDF i 104 de l'Excel, amb 99 de coincidents pel nom.
    - **Ara** (`llegeixAmid878476`): en adjuntar un PDF, Excel o BC3 es llegeix amb els lectors de la pestanya Amidaments (gratis i exacte); el xip diu «102 partides». «Fer el pressupost» porta codis, conceptes, descripcions, unitats, quantitats, capítols i mides (`midesFila878476`, també a «Passar-ho a pressupost»), posa els preus propis (Preus, banc, obres anteriors) i la IA només busca els que falten. Si en falten més de 30, abans diu quantes lectures gastarà. En afegir, fa servir `__acoImportPdf878305` i l'arxiu original va a Documents.
    - **Lector d'amidaments en PDF** (`llegirAmidamentsPdf`): amb les mides que passaven de pàgina es perdia la quantitat (8 partides de 102 a Llafranc). El títol «AMIDAMENTS» de cada pàgina tancava la partida, el peu «… Pàgina 5» comptava com una mida (`PEU_PAGINA`), una etiqueta com «Bany 01» també (ara una mida sense decimals no compta) i dues línies «1 1,00» feien de total (`fiPartida`). Ara el PDF i l'Excel de Llafranc donen les mateixes quantitats. Descripcions fins a 4.000 lletres. Prova: `amidamentsunit.mjs` (35).
    - **Si l'arxiu no es pot llegir** (un PDF escanejat, sense text a la caixa): `pressupostDeIa` (`accio:"pressupost"`, llegir, no inventar); si no hi troba partides, com abans. Plànols i fotos, com abans. Amb PDF i Excel alhora, el que té més partides, sense repetir-les. **La funció del servidor no canvia.**
    - **Mòbil** (l'Héctor a les 22:04 amb una partida dictada: «No hi ha connexió amb el núvol»): pantalla encesa mentre treballa la IA (`pantallaEncesa878476`) i missatge clar si es talla la connexió; camps de 16 px perquè l'iPhone no ampliï la pantalla. **La causa del tall no està confirmada** (cal mirar `aco_ia_crides`): si es repeteix, cal fer la crida en dos passos (encarregar i preguntar).
    - Estils `src/theme-v878476.css`. Prova: `v476test.mjs` (11, Excel inventat i PDF sense text). El PDF i l'Excel de Llafranc són d'un client: no copiar-los a les proves.
  - **V87.477 · Diversos encàrrecs en un expedient** (l'Héctor, 2/11/2026, amb el CEE de Cornellà: «sí a tot»: CEE, amiant, cèdula… en un mateix expedient, amb el que és comú compartit, i cobrar-los amb un preu conjunt o un per encàrrec):
    - **Al Resum d'un encàrrec tècnic** (`EncarrecTecnic878306`, ara amb `EncarrecUn878477` per a cada un): un botó per encàrrec amb «{n} de {m}» (`.enc-xips-v878477`), «Afegir encàrrec» (`.enc-tria-v878477`) i «Treure aquest encàrrec» (pregunta; els arxius es queden a Documents). Amb un sol encàrrec, tot com abans. Només als expedients que ja són un encàrrec tècnic. No al treballador ni al portal.
    - **Dades:** el principal es queda a `data.passos878305`, sense prefix (les dades d'abans no es toquen); els altres a `data.encarrecsExtra878477 = [{id:"enc-<k>", k, at, passos}]` (amb `id`, perquè `merge3` els ajunti element per element). Funcions pures a `src/encarrecsTecnics.js`: `encarrecsDe`, `ambPassos`, `marcaPunt`, `marcaDoc`, `afegeixEncarrec`, `treuEncarrec`, `resumDe`, `nomEncarrec`, `autoPunts(obra, data, client, e)`.
    - **El que és comú:** el client, la referència cadastral, les fotos, la fitxa de la visita (per clau; la clau del tràmit passa de `tipus` a `tipusTramit`: cap obra en tenia) i els documents de `DOCS_COMUNS` (dni, propietat, representacio, fotos). Un punt amb el mateix text es marca a tots els encàrrecs. Els altres documents d'un encàrrec afegit porten prefix (`cedula:certificat`), perquè «certificat» no és el mateix a la cèdula que al CEE. «Presentat» i el venciment són de cada encàrrec. `carpetaDoc` no depèn del prefix.
    - **Cobrar-los:** amb 2 o més encàrrecs, els pressupostos i les factures d'honoraris tenen el camp «Encàrrec» (`TriaEncarrec878477`, `encarrec878477`): «Tots (preu conjunt)» o un de sol; la calculadora també, i posa el treball. Sense encàrrec val per a tots (`autoPunts`); amb encàrrec, només per a aquell. Treure un encàrrec passa els seus pressupostos i factures a tot l'expedient.
    - **Inici** (`EncarrecsInici878305`), **«Pendent de tancar»** (`faltaTancar878474`, amb «Nom: …» i «Fer la factura: {n}») i **Documents** (`documentFolders8775`, `ambTramit`) miren tots els encàrrecs.
    - Estils `src/theme-v878477.css`. Proves: `encarrecs477unit.mjs` (28, sense navegador) i `v477test.mjs` (27).
  - **V87.478 · Pressupost amb IA: cada feina, una partida, i les de la mateixa mena al mateix capítol** (l'Héctor, 2/11/2026, dictant un forjat: 4 partides, 3 d'estructura en capítols diferents: «per què no ha fet una única partida si no li he dit de fer el ferro, cèrcol i residus a part?»):
    - **Error antic (V87.361):** `nouCap878361` comparava el nom amb número («01 ESTRUCTURA») amb el nom sense («ESTRUCTURA»): no coincidien mai i cada partida d'un «Capítol nou» n'obria un (01, 02 i 03 ESTRUCTURA), encara que la revisió digués el mateix. Passava a «Des de Preus», al dictat i a la primera prova de Llafranc (les partides soltes). Ara amb `nomSenseNum878361`.
    - **Què es demana a la IA** (`reglesPartides` de `src/iaObra.js`): una partida per feina, amb tot a dins (materials, armadures, cèrcols, mà d'obra, mitjans, runa), a la descripció; cap partida que no s'hagi dit (el que falti, a avisos); desglossar només una obra general o plànols, per feines i mai per materials; els mínims capítols; els capítols que ja té el pressupost; el text pot ser d'un dictat (una paraula sense sentit es llegeix pel context, i si es canvia es diu a avisos). **Va amb la petició, abans del text dels arxius, i no a la funció del servidor: així no cal tornar-la a instal·lar.** El `SYS_PARTIDES` d'`index.ts` continua dient que pot afegir protecció, runa i neteja; les regles diuen que hi manen a sobre.
    - **Capítols** (`ambIa`, sense arxiu llegit): el que ja té el pressupost pel nom; si no, pel capítol estàndard de la partida (`stdDe`, si no en té, el del nom del capítol de la IA): el del pressupost que hi correspon o el primer d'aquesta tanda (`vist`). El que no se sap què és es queda on l'ha posat la IA. `CAP_RULES878280` 04 també coneix biguetes, bovedilles, revoltons, ferralla, armadures, mallat i encofrat. Les partides d'un arxiu llegit continuen amb els capítols de l'arxiu (Llafranc: 27, iguals al PDF i a l'Excel).
    - **Preus:** norma nova a `promptPreusIa`: el preu ha d'incloure tot el que diu la descripció.
    - **Dictat:** és el reconeixement de veu del navegador, en un sol idioma alhora; no es pot entrenar ni afegir-hi paraules («bovedilla» és castellà; en català, «revoltó»).
    - Prova: `v478test.mjs` (16, IA simulada: el que se li envia i el que fa l'app amb la resposta; **com respon la IA de debò encara no s'ha provat**). El Supabase de proves accepta `POST /__aco-ia {partides:{…}}`.
  - **V87.479 · Ajuntar els capítols repetits** (l'Héctor, 2/11/2026, amb la captura de «pressupost PROVA IA»: 05, 06, 07 i 08 ENDERROCS, un per partida, i sense voler gastar 100 lectures més):
    - **Diagnòstic:** el recorregut sencer amb el PDF i l'Excel reals de Llafranc (`arxiu478.mjs`, `ARXIUS="ruta1;ruta2"`, mòbil i responent «no» a l'avís dels preus; l'arxiu no es copia) dona 27 capítols sense cap repetit i els noms de l'arxiu («Enderroc de paviment interior»). Les de la captura («Enderroc paviment interior») les va escriure la IA, amb la numeració de l'error de `nouCap878361` arreglat a la V87.478. **No està confirmat** com es va arribar a veure aquella pantalla a les 23:09 (el més probable: el pressupost de la primera prova, sense buidar, perquè a les 23:06 el selector de l'iPhone no obria la carpeta del Drive). **Compte: amb l'arxiu, abans només s'havia comprovat la lectura, no el pas d'afegir-ho al pressupost; l'Héctor va rebre un «sí» massa ràpid.**
    - **Línia «N capítols repetits · Ajuntar-los»** (`caps-rep-v878479`, a sobre de la targeta del pressupost; `capsRepetits` i `ajuntaCaps` de `src/capsRepetits.js`, funcions pures): compara el nom sense número i sense accents, dins del mateix capítol principal; passa les partides al primer i, si tots els capítols són «01 NOM» sense capítols principals, numera capítols i partides seguits (els codis propis, com els del BEDEC, es queden). Sense IA ni lectures. Només fora d'edició i sense certificacions.
    - **Revisió:** amb un arxiu i un pressupost que ja té partides, avís «Aquest pressupost ja té partides: les de l'arxiu s'hi afegiran.»
    - **«Contenido no disponible» en triar un arxiu del Drive a l'iPhone:** és el selector de l'iPhone, abans de tornar a l'app. Va amb el proveïdor de Google Drive de l'app Fitxers; l'app només obre el selector. Mentre no hi hagi el botó «Des de Google Drive» (Google Picker, cal una clau d'API del projecte de Google de l'Héctor), obrir abans l'app de Google Drive o desar l'arxiu a «Al meu iPhone».
    - Estils `src/theme-v878479.css`. Prova: `v479test.mjs` (19).
  - **V87.480 · «Buscar preus» a un pressupost ja fet** (l'Héctor, 3/11/2026, després d'ajuntar els capítols de «pressupost PROVA IA»: «ara si vull la resta de capítols sense preu hauria de fer llegir a la IA i gastar en lectures… el puc fer un cop he dit que no amb els que falten?»; fins ara no es podia: un «no» a l'avís de les lectures era definitiu):
    - **Línia «N partides sense preu · Buscar preus»** (`sense-preu-v878480`, a sobre de la targeta del pressupost; surt després de la de capítols repetits): no surt editant, amb el pressupost tancat, al portal ni al pressupost ràpid. `sensePreu878480(caps)`: partides amb quantitat, sense preu i sense certificar (les que no tenen codi, o el tenen repetit, porten un codi provisional per a la IA, `codiIa`).
    - **Finestra** (`BuscarPreus878480`, `.buscar-v878480`): primer els preus propis, gratis (`preusAmidaments878368`: Preus, banc, obres anteriors); caselles per capítol (Tots · Cap); el compte abans de gastar res («N amb preu propi · gratis», «N per a la IA · L lectures com a mínim», «Et queden R lectures aquest mes»). Botons: «Només els propis (n)» i «Buscar preus (n)», o «Posar preus (n)» si no cal IA.
    - **Cada tanda de 15 es desa en arribar** (`posaRef480`): un tall a mitja feina no perd el que ja s'ha pagat; la finestra diu quants preus s'han posat i quantes partides continuen sense preu, i la línia surt amb les que falten. Marges de l'obra amb `margesLinia878378`; amb comissió, el preu nou és l'original (`puOrig878346`) i a sobre, la comissió.
    - Pantalla encesa mentre treballa (`pantallaEncesa878476`). L'avís de lectures diu: «Si dius que no, els podràs buscar després des del pressupost.»
    - Estils `src/theme-v878480.css`. Prova: `v480test.mjs` (14; el Supabase de proves accepta `POST /__aco-ia {fallaDespres:N}`, que fa fallar la tanda N+1).
  - **V87.481 · Els CSV en format europeu i tres errors trobats amb un usuari fictici** (l'Héctor, 3/11/2026: «sobretot m'interessen proves amb usuaris ficticis per detectar errors»; eina nova `tools/proves/usuari480a.mjs`: una constructora de zero fa tota una obra, de les dades de l'empresa i els amidaments fins a la factura cobrada, el Rendiment, recarregar i un segon aparell, mirant que les xifres quadrin a cada pantalla, 31 proves):
    - **CSV** (`llegeixLlibre`, `textCsv` i `fullsLlibre` de `src/amidaments.js`; a tot arreu on s'accepta un CSV: amidaments, pressupost amb IA, comparar amb l'arxiu original, descompostos, importar obres, importar despeses): s'obria com un Excel i la biblioteca endevinava els números a l'americana, **sense cap avís**: «12,5» → 125, «1.234,56» → 1,23, «01.01» → 1.01, «02.10» → 2.1, els accents d'un UTF-8 sense marca malmesos. Ara s'obre com a text (UTF-8, Windows-1252 o UTF-16; «;», «,» o tabulador) i només passa a número el que no pot ser res més: els codis i les dates es queden com són.
    - **Excel de debò:** un codi 1.10 en una cel·la numèrica es llegia 1.1; als amidaments ara es queda com es veu (`textos` de `fullsLlibre`). `numCel` entén «€» i «1,234.56».
    - **Amidaments en Excel:** la columna `PrPres` del Presto ja és el preu (abans, sense `ImpPres`, es perdia); «Preu total» és l'import, no el preu.
    - **Enviar el pressupost d'una obra nova:** surt «En curs / Actiu» i no passava mai a «Pendent de resposta», i la franja «Enviat el…» amb Acceptat / No acceptat no sortia. Ara, si no té certificacions ni partes, hi passa (`nova481` d'`enviatPressupost878402`).
    - **Parte sense feina nova** (només hores o material): queda «Revisat», sense dir cap certificació ni oferir «Treure de la certificació».
    - Proves: `usuari480a.mjs` (31), `v481test.mjs` (12, tres CSV dins de l'app) i `amidamentsunit.mjs` (49). Eina nova `mico480.mjs` (toca cada botó i plegable de totes les pantalles, i omple les finestres amb dades dolentes; `COMPTES=`, `MIDES=`, `FORMS=`, `OBRES=`, `IDIOMA=es`).
  - **V87.482 · «Opcions», obres per Totes · Obertes · Tancades i el menú «Més» en llista** (l'Héctor, 3/11/2026 a la nit, mirant l'app de Brava
    al mòbil: «el constructora no distingeix entre obertes i en execució… totes, obertes i tancades»; «en comptes de la paraula accions no seria millor
    opcions, que és més entenedor»; el menú «Més» en graella, «com era abans en un llistat»):
    - **«Opcions» en lloc d'«Accions»** a tots els menús (pressupost, certificació, despeses, capítols, factures) i «Opciones» en castellà. Les proves que
      busquen el menú, adaptades (35 fitxers).
    - **Obres de la constructora** (perfils que diuen «obra», `diuObra878326`): a la llista i a l'Inici, només **Totes · Obertes · Tancades**
      (`paquets878482`, `PAQ_OBRA878482`; `paq878482` passa «En execució» i «Esperant resposta» d'abans a «Obertes»). El tècnic, com abans. Les ajudes
      de les proves que tocaven «Total d’obres» també toquen «Totes».
    - **Menú «Més» en llista** també amb el «Visual nou» (fora la graella d'icones de la V87.400). **Les captures de l'Héctor eren del «Visual nou»**:
      l'opció es desa a l'aparell, no al compte, i per això li sortia també entrant amb Brava; als mòbils de Brava es veu com sempre.
    - **Disc D: ple (3/11/2026)**: vegeu «Com arrencar i provar». El `TEMP` de l'Edge de les proves, dins del perfil; `passa.sh` amb carpeta per prova.
    - Estils `src/theme-v878482.css`. Prova: `v482test.mjs` (13). Adaptades `visual400test` (el menú no és graella) i `perfils326test`.
    - **Compte:** `i18n-afegir.mjs` vol línies `"català": "castellà",`, no un JSON amb claus (va posar «{» al diccionari i no compilava).
  - **V87.483 · Parte senzill, també sense pressupost** (l'Héctor, 3/11/2026 a la nit: «els partes haurien de ser molt més fàcils… personal amb temps
    imputat, material, i nota amb comentari i fotos»; a l'obra Gulta 1 de Brava, sense pressupost, «Partes d'obra» deia «Aquesta obra encara no té pressupost»
    i no deixava fer cap parte):
    - **L'editor** (`ParteEditor878349`): fora les pestanyes Feina · Hores · Material; tres blocs a la vista (`pe-bloc-v878483`): **Personal** (les hores amb −
      i +, `Pas878483`; dos tocs seguits compten tots dos), **Material** (amb **«Foto de l'albarà»**: la foto es desa amb la despesa del material
      —`albaraFotoKey878259("dp-"+parte+"-"+línia)`, `ambFoto` a la línia, `teFoto` a la despesa; el camp no es pot dir `foto`, que el desat buida— i,
      si hi ha IA, se n'omplen el concepte, el proveïdor, l'import, el número i el tipus amb `readAlbaraAI878259`) i **Nota i fotos** (dictat i fotos,
      `part.fotos`, que `fileStore.js` desa i puja com les de les notes). La **feina per partides**, a sota, en una línia plegable
      (`details.pe-feina-v878483`, oberta si ja n'hi ha de marcades) i **només si l'obra té pressupost**.
    - Botó principal **«Desar el parte»**; «Passar a la certificació» només surt amb partides marcades. Es pot desar amb només una nota o una foto.
    - **Partes d'obra** sense pressupost: «Parte d'avui» hi és sempre; «Preus per hora», només amb pressupost.
    - El resum del dia ensenya les fotos (s'obren al visor).
    - **Proves:** la marca `parte-feina-prova-v878483` (la posa l'harness, com `pres-prova-obert-v878462`) deixa la feina oberta per a les proves d'abans;
      `v483test.mjs` (20) la treu. Adaptades `partes350test`, `partes352test`, `partes359test`, `signatura403test` i `avisos360test` («Desar el parte»).
    - Estils `src/theme-v878483.css`.
  - **V87.484 · Constructora al mòbil i l'iPad: la barra de baix per fer coses i l'Inici com a menú** (l'Héctor, 3/11/2026 a la nit, «sí a tot»: «els
    accessos ràpids no podrien ser per fer partes, notes…»; «la pantalla d'inici i el desplegable són similars: amb la pantalla d'inici no n'hi ha prou?»;
    «més pot ser també una rajola, contactes també, sortir més petita a baix»; «preus… llibreria de preus»). Només als perfils `constructor` i
    `complet` (`modeObra878484`) i on surt la barra de baix (≤1280 px o pantalla tàctil, `useBarraBaix878484`); a l'ordinador i al tècnic, com abans.
    - **Barra de baix** (`BottomNav878268` amb `onAccio`, `.accions-v878484`): **Inici · Parte · Despesa · Nota · Més**. «Despesa» és una etiqueta amb
      un `input type=file` (foto o PDF, s'obre al moment). Dins d'una obra, l'acció es fa en aquella obra (event `aco-accio-484` que escolta l'`Obra`:
      «Partes obra», «Notes» o «Albarans» amb `start878302`); fora, primer **«De quina obra?»** (`TriaObraAccio878484`: les obres obertes, la
      treballada fa menys a dalt; a «Despesa», també **«Sense obra»** = despesa de l'empresa) i `window.__acoStart878484`, que l'`Obra` agafa en obrir-se.
      `Albarans878259` rep `start` (i, des de fora, `window.__acoStartAlb878484`) i obre la despesa nova amb la foto (`newFromPhoto(file, ov)`).
    - **Sense el ＋ dins de l'obra** (`ObraPlus878302`) per a aquests perfils: ja és a la barra.
    - **L'Inici és el menú** (`IniciMenu878484`): vuit rajoles iguals (Pendent = avisos i feines junts, que s'obre a sota; Obres obertes; Agenda amb les
      cites d'avui; Hores; Despeses; Facturació; Contactes; Més = el menú) i, a sota, «＋ Nova obra» i «Sortir» petit.
    - **Hores** (`HoresEmpresa878340`): Personal · Fitxatge · **Calendari** (el calendari laboral d'Empresa, `CalendariEmpresa878393`).
    - **«Preus» → «Llibreria de preus»** (menú, capçalera i títol).
    - Estils `src/theme-v878484.css`. Prova: `v484test.mjs` (19).
  - **V87.485 · Dins de l'obra, quatre rajoles amb la llista a sota** (constructora i gestió total, mòbil i iPad; l'Héctor, 3/11/2026: «fitxa, seguiment i
    econòmic… és liat; el desplegable pot ser lineal»; «seguiment es pot confondre amb el control de pressupost»; «a obra on posa pressupost hauria
    d'afegir certificacions»; «econòmic dir comptabilitat amb facturació i despeses»):
    - `ObraBar878269` amb `mo878485` (`modeObra878484` i `useBarraBaix878484`): **Fitxa · Dia a dia · Pressupost i certificacions · Comptabilitat**
      (`OBRA_BLOCS878485`, `obraBlocs878485`; «Dia a dia»: Partes, Visites, Agenda, Planning; «Comptabilitat»: Facturació, Despeses, Rendiment, Hores).
      Dues per fila; tocar-ne una obre a sota de la seva fila la llista dels apartats, un per línia (`.llista-v878485`, també amb la classe
      `obra-bloc-panel-v878299`); la del lloc on som, plena de blau i amb l'apartat a sota del nom. La barra ja no es queda fixa (`--obra-bar-h` = 0).
      Les claus dels apartats no canvien. A l'ordinador i al tècnic, els tres blocs de sempre.
    - **La barra de baix:** «Despesa» passa a ser un botó que obre el selector d'arxius (abans una etiqueta amb una altra lletra).
    - **Proves:** l'ajuda `apartat(b, bloc, apartat)` de 55 proves, si no troba l'apartat al bloc que diu, el busca als altres.
    - Estils `src/theme-v878485.css`. Prova: `v485test.mjs` (22, mòbil i iPad).
  - **V87.486 · El pressupost buit en rajoles i, editant al mòbil, la partida en una pantalla pròpia** (l'Héctor, 3/11/2026: «quan posem pressupost, una
    rajola com a tots i després, quan entres, altres rajoles amb els diferents tipus d'entrada: importar arxius, ja sigui PDF, Excel o BC3, amb IA, i
    manual»; «si apretes editar i toques una partida, que s'obri una nova pantalla per partida, després tornar i per la segona»):
    - **Pressupost buit** (`PresBuit878435`, `.raj-v878486`): rajoles iguals **Importar un arxiu** (un sol selector: PDF → el lector de PDF, que comença
      sol amb l'arxiu, `PdfPressupost878305 inicial`; BC3 → `bc3Pres878435`; Excel o CSV → `importExcel`), **Amb IA** i **A mà** (`startManualBudget87115`),
      i a sota «O tria-les de la Llibreria de preus». Si la fase té amidaments, primer «Des dels amidaments». Les rajoles es criden com a funció (`R486`), no
      com a component: si la pantalla es torna a dibuixar mentre el selector d'arxius és obert, l'arxiu no es perd.
    - **Editant al mòbil i l'iPad** (`pantalla878486` = `useBarraBaix878484`): tocar una partida obre la seva fitxa en una **pantalla pròpia**
      (`.partida-pantalla-v878486`, amb `createPortal` a `document.body`: dins de la llista quedava amb alçada zero) amb «‹ Tornar al pressupost» a dalt i
      «Fet» a baix. A l'ordinador, dins de la llista com abans.
    - Ajustos: la constructora ja no té «Accessos ràpids» (la seva barra és fixa des de la V87.484).
    - Estils `src/theme-v878486.css`. Prova: `v486test.mjs` (11). Adaptades `perfils326test` («Llibreria de preus»), `v366test` i `v455test` (barra i Inici de la constructora).
  - **V87.487 · El fitxatge desa on es fa** (l'Héctor, 3/11/2026: «el fitxatge ha de tenir geolocalització»):
    - **En marcar** (`FitxarKiosk878357`, `marca`): el marcatge es desa al moment amb l'hora del toc i la posició de l'aparell es demana dins del mateix toc
      (`ubicacio878487`: precisió alta, com a molt 12 s); quan arriba, s'hi afegeix `geo = {lat, lng (6 decimals), prec (m), at}` (`posaGeoFitx878487`). Sense
      permís, sense GPS o sense resposta: `geo = {err: "denegat" | "no" | "temps"}` i el marcatge val igual. L'avís diu «… · amb la ubicació» o «… · sense ubicació».
    - **Oficina** (`RegistreFitx878357`): cada marcatge porta un punt (`GeoFitx878487`): verd, obre el lloc a Google Maps (±m); gris, sense ubicació. També a «Els meus
      fitxatges del mes». L'Excel del mes, columnes «Ubicació de l'entrada» i «Ubicació de la sortida». El PDF per a la Inspecció no canvia.
    - **Es pot treure:** «Desar la ubicació en fitxar» a dalt del Registre (`aco_empresa_v878259.fitxGeo878487`; de sèrie, sí; `fitxGeoOn878487`).
    - És la ubicació de l'aparell on es fitxa (fase 1: un aparell de l'empresa a l'obra). L'empresa n'ha d'informar els treballadors (art. 90 de la LOPDGDD).
    - Estils `src/theme-v878487.css`. Prova: `v487test.mjs` (17). Adaptades `fitxatge357test` i `personal340test` (Hores té la pestanya «Calendari» des de la V87.484).
  - **V87.488 · «Següent ›» a la pantalla de la partida** (editant al mòbil i l'iPad, V87.486): al costat de «Fet», «Següent ›» obre la partida que ve
    després, en l'ordre en què es veuen (`seguent878488`, `vesSeguent878488` de `Pressupost`); a l'última d'un capítol, la primera del capítol següent (s'obre
    el capítol i el seu grup). A l'última del pressupost no surt. En passar, la pantalla torna a dalt. Estils a `src/theme-v878486.css` (`.seg-v878488`).
    Prova: el cas 6 de `v486test.mjs` (12).
    - **Proves adaptades als canvis de les V87.484–486:** les que anaven a «Preus» del menú ara hi van per «Llibreria de preus» (7 proves i el menú de
      `usuari480a` i `pol403test`); les que tocaven el bloc «Econòmic» trien el bloc per `data-apartats` (el que conté l'apartat: «Pressupost i
      certificacions» o «Comptabilitat» a la constructora al mòbil i l'iPad; 15 llocs); `v451test` mira les rajoles i que la constructora no té el ＋.
  - **V87.489 · El parte en targetes que s'obren a pantalla sencera, i la descripció de la partida amb «Veure descripció»** (l'Héctor, 4/11/2026, amb
    una captura del parte al mòbil: «fes-la amb targetes desplegables… i en entrar a alguna d'elles, pantalla sencera i botó tornar»; «la descripció
    d'una partida… una targeta amb botó veure descripció i que s'obri sencera»; «fes-me el mateix format a PC»):
    - **`PantallaSencera878489`** (`.pantalla-v878489`, portal al `body`, capa 97): a dalt «‹ Tornar» i el títol (amb una xifra), el contingut i, a
      baix, «Fet» (`senseFet` per treure'l). Al mòbil i l'iPad, tota la pantalla; a l'ordinador (≥1101 px amb ratolí), un plafó de 760 px al mig
      amb el fons enfosquit; Esc i tocar fora la tanquen (Esc no fa res si hi ha una finestra oberta). És la peça per fer el mateix a les altres pantalles.
    - **El parte** (`ParteEditor878349`): el dia i qui el fa a dalt i, a sota, quatre targetes iguals (`.pe-cartes-v878489`, una columna al mòbil i
      al costat l'una de l'altra a l'ordinador): Personal (les hores), Material, Nota i fotos i Feina feta per partides (només amb pressupost), cada
      una amb la seva xifra i plena de blau quan té alguna cosa. Tocar-ne una l'obre a pantalla sencera amb el mateix contingut d'abans
      (`secPersonal`, `secMaterial`, `secNota`, `cosFeina`, dins de `.parte-ed-v878349.dins-v878489`). «Una part» i les mesures s'obren al
      `body` (`createPortal`), per sobre de la pantalla sencera. «Desar el parte», a baix com abans.
    - **La descripció de la partida** (`DescPartida878489`, a la fitxa fora d'edició): si és llarga (més de 140 lletres o més de 3 línies), les tres
      primeres línies i «Veure descripció», que l'obre sencera (`.desc-pantalla-v878489`, lletra de 17 px). Editant, el quadre de text de sempre.
    - **Proves:** la marca `parte-blocs-prova-v878489` (la posa l'harness, com `parte-feina-prova-v878483`) deixa els blocs d'abans per a les proves
      que ja hi havia. Estils `src/theme-v878489.css`. Prova: `v489test.mjs` (29: mòbil i ordinador, desar el parte, la descripció). Passen `v483test`,
      `v486test`, `partes350test`, `v449test`, `v447test` i `i18ntest`.
  - **V87.490 · A l’ordinador, els mateixos noms i el mateix funcionament que al mòbil** (constructora i gestió total; l’Héctor, 4/11/2026: «voldran veure-ho també a l’ordinador amb l’administrativa… les pantalles no són iguals, els textos tampoc»): l’Inici en rajoles (`IniciMenu878484`, ara sense la condició de la barra de baix; a l’ordinador «Rendiment» en lloc de «Més», `pc490`) i, dins de l’obra, les quatre rajoles Fitxa · Dia a dia · Pressupost i certificacions · Comptabilitat (`mo878485 = modeObra878484()`; a l’ordinador, `pc-v878490`: quatre en una fila i la llista dels apartats a sota en columnes, `fila490`). A l’iPad i l’ordinador, «Pendent» de l’Inici s’obre a sota de la primera fila. El tècnic i el compte de l’Héctor, com abans. **Següent (l’Héctor):** a l’ordinador, on la informació no hi cap, que s’obri una pantalla pròpia com la de les partides (`PantallaSencera878489`). Estils `src/theme-v878490.css`. Adaptades `v485test` (5) i `v484test` (11); passen `v489test`.
  - **V87.491 · El logo una mica més gran** (l’Héctor, 4/11/2026): a la capçalera del mòbil i l’iPad, 44 px (abans 36) i, amb el logo de l’empresa, fins a 46 × 136 px; al menú de l’ordinador, el quadre «CO» de 38 px i el logo fins a 50 × 132 px. Estils `src/theme-v878491.css`.
  - **V87.492 · Les rajoles de l'obra també al tècnic i al compte de l'Héctor** (proposta acceptada per l'Héctor el 4/11/2026): **Fitxa · Dia a dia ·
    El meu encàrrec · Pressupost i certificacions** (`OBRA_BLOCS_TEC878492`, `obraBlocsTec878492(all,pur)`, a `ObraBar878269` amb `tec492` = no és mode
    obra ni només lectura; classe `tec-v878492`). «Pressupost i certificacions», només a les obres que en tenen (no als encàrrecs com el CEE). Als
    encàrrecs tècnics (`pur`) les despeses són les meves i van a «El meu encàrrec»; a les obres, amb el pressupost. **Una rajola amb un sol apartat
    l'obre directament** (fletxa cap a la dreta; també a la constructora). A les rajoles del tècnic, la línia de sota diu els apartats de debò
    (`sub492`: no hi ha partes). Proves: `v492test.mjs` (26, amb el compte de l'Héctor a l'ordinador i al mòbil). L'ajuda `tab()` de 79 proves accepta
    l'apartat d'una rajola d'un sol apartat (`.rajoles-v878485>button.on .t small`); `v444`–`v448test` obren les rajoles; adaptades `v485test`,
    `menutecnictest`, `obratest` (les rajoles en lloc dels tres blocs) i `honoraris332test`.
  - **Tanda 8** (l'Héctor, 4/11/2026 a la tarda, després d'una visita amb un client que «ha agradat molt»; llista a `docs/revisio-modul-constructor.md`).
  - **V87.493 · Despeses: el grup pel proveïdor i el grup a l'editor** (una factura d'un industrial llegida per la IA va anar a Materials):
    `tipusProveidor878493(prov, nif, tots)`: si el proveïdor és a Contactes com a industrial o constructora (`window.__acoContactes878406`, pel NIF o
    pel nom sense «S.L.», accents ni puntuació, `nomProv878493`), «Subcontracta»; si no, el tipus més repetit de les seves despeses d'abans (Material,
    Subcontracta o Altres): si se'n corregeix una, la següent ja va bé. S'aplica en llegir la factura amb la IA (no si és ISP). A l'editor, el **grup**
    com les targetes (`grups-v878493`: Materials · Mà d'obra · Industrials · Altres · Despeses de l'empresa) i, a sota, el tipus de dins (Albarà ·
    Factura de material; Altres despeses · Comissió). Estils `src/theme-v878493.css`. Prova: `v493test.mjs`. El Supabase de proves accepta `POST /__aco-ia
    {despesa:{…}}`. Adaptades `despesestest` i `despesesrend338test`.
  - **V87.494 · El parte: pantalles amples a l'ordinador i «Partida fora de pressupost»** (`src/theme-v878494.css`):
    - A l'ordinador, les pantalles del parte fan fins a 1.180 px (Personal en dues columnes).
    - «Feina feta»: el **Pressupost plegat** (`details.pe-pres-v878494`; obert si el parte ja té partides marcades) amb Per fer · Marcades avui · Totes,
      els capítols i les partides; a sota, **«Partida fora de pressupost»** (`.pe-nova-fp-v878494`) i les ja fetes (`FPCarta878494`). La targeta de la
      feina surt també sense pressupost («Feina fora de pressupost»).
    - **La partida fora de pressupost** s'obre a la seva pantalla (`FPPantalla878494`, a sobre de la de la feina; Esc només tanca la de dalt): el capítol
      «NN FORA DE PRESSUPOST» és automàtic (`capFP878494`: el número següent del pressupost o el que ja hi ha; `RE_CAP_FP878494`), títol, descripció
      (amb dictat), **Per quantitat** (quantitat i unitat amb desplegable, `UNITATS878494`: «m2 · metres quadrats»…) o **Per administració** (hores per
      treballador o per categoria —`cat:<categoria>`, el cost mitjà de la categoria— i material; el quadre diu les hores de cada categoria) i el preu per
      al client. Dades: `noves:[{…, desc, mode:"q"|"adm"}]` (`ambHores` = administració). En certificar, la partida va al capítol fora de pressupost
      numerada com el capítol (05.01, 05.02…) i amb la descripció (`desc`).
    - Prova: `v494test.mjs`. Adaptades `partes350test`, `partes352test` i `signatura403test`.
  - **V87.495 · Inici de la constructora i partes «per validar»:** «Pendent» s'obre sol (les altres rajoles s'amaguen) amb **«Inici»** per tornar
    (`torna-inici-v878495`) i dues targetes, **Avisos** i **Feines**, que diuen «No hi ha…» si són buides (`pend-cartes-v878495`; a l'ordinador, l'una al
    costat de l'altra). A l'ordinador, «Inici» a dalt de les pantalles (no a l'obra ni a la fitxa d'un client) per als perfils de mode obra; l'Inici
    arriba fins a 1.400 px. «Per revisar» → **«Per validar»** als partes (avisos, llista, botons). `AvisosLlista878360` amb `nu` (sense targeta).
    Estils `src/theme-v878495.css`.
  - **V87.496 · Avís de cobrament de cada factura i avisos que es canvien:** mentre una factura (de l'obra, `facturesObra878297`, o d'honoraris,
    `facturesTecnic`) no és cobrada, surt l'avís «Cobrament de la factura F…» a l'Inici i al Resum, amb la data de 10 dies després de la factura
    (`AVIS_COBR_DIES878496`) i el color: verd, taronja (3 dies o menys) o vermell (passat) (`avisosCobr878496`). Cada avís té un **llapis**
    (`ed-v878496`) que obre `AvisEditor878496`: «Recorda-m’ho el dia», «Ja està cobrada» (amb el dia) i «Treure l’avís». La data i el «tret» del
    cobrament es desen a la factura (`avisCobr878496 = {data}|{off}`, pont `window.__acoPatchFactura878496`); els altres avisos, a `aco_avisos_v878496`
    (`clauAvis878496` porta el nombre o el mes: si n'hi ha de nous, torna a sortir). Estils `src/theme-v878496.css`. Prova: `v496test.mjs` (també la V87.495).
  - **V87.497 · Llista d'obres:** paquets molt més marcats (l'actiu, ple de blau) i, a la constructora, què hi ha a dins de cada un («3 en curs / actiu ·
    1 pendent de resposta», `paqDet878497`); filtres amb **tots els estats** i el color de la llista (`estf-v878497`); a l'ordinador, el número i l'altre
    número sencers; la columna de l'altre número, a la constructora, només si hi ha obres compartides i es diu **«Compartida per»** (el número de qui la
    comparteix; el principal és sempre el del compte). Estils `src/theme-v878497.css`.
  - **V87.498 · Dades de l'obra de la constructora** (`constructoraPropia878363`): sense «Codificació de l'expedient» ni el codi llarg de carpeta;
    «Referència del client (el seu número d'obra o de comanda)» en lloc de «Núm. del client».
  - **V87.499 · Contactes i targetes obertes:** fora l'avís «Agents posats a les obres»; a les pantalles del menú, la capçalera d'una targeta oberta
    es queda a dalt en baixar (`src/theme-v878499.css`), com dins de l'obra.
  - **V87.500 · Pressupost, Planning i descompost més nets:** a la constructora, «Eines» sense Renumerar, Validar descompostos ni Tornar a llegir
    els descompostos (no els fa servir un contractista); a l'editor del descompost, «Preu tancat» → **«Preu d'industrial»** i fora «Per lots» (surt
    només si la partida ja n'era); el «⋯» de les fases és **«Opcions»** amb la fletxa (`opcions-v878500`); al Planning, l'escala del gràfic en una fila
    pròpia a sota del títol (`gt-escala-v878500`); el menú «Opcions» d'una targeta ja no queda sota la capçalera blava fixa (la targeta del menú obert
    passa per sobre, capa 70). Estils `src/theme-v878500.css`. **No fet:** treure «Afegir» de fora d'«Editar» quan el pressupost ja té partides
    (trencava 7 proves del pressupost; pendent).
  - **V87.501 · Llistats amb filtres** (l'Héctor: «en una pantalla nova, com un llibre comptable… imprimir i desar l'arxiu»): `Llistat878501({titol,
    files, cols, dates, filtres, close, nom})` a `PantallaSencera878489` (`.llistat-v878501`): data (d'emissió o d'entrada, segons `dates`), des de / fins
    a, any, els filtres de cada llistat (desplegables), número des de / fins a i cercador (`ll-filtres-v878501`); «Camps i ordre» plegat (treure o posar
    columnes, ordenar per una columna tocant-ne el títol); la taula amb els totals a baix (columnes `suma`); a baix **Excel · Desar el PDF · Imprimir**
    (`htmlAPdf`; al mòbil, «Compartir»). Llistats: **Certificacions** («Llistat» a la targeta: número, data, import, a origen, facturada, factura,
    cobrada), **Facturació** de l'empresa i del tècnic («Llistat»), **Despeses** (Opcions › «Llistat amb filtres…»: data d'emissió o d'entrada, client,
    obra, grup, proveïdor; sense els albarans inclosos en una factura) i **Rendiment** de l'empresa (per obra i any: ingressos, facturat, costos, DGE,
    benefici, %). Estils `src/theme-v878501.css`. Prova: `v501test.mjs`.
  - **V87.502 · Obra tancada** (l'Héctor, 4/11/2026: «quan una obra ja la tenim tancada no ens hauria de deixar modificar res més que llistar i
    consultar, i si volem fer algun canvi que surti un avís que està tancada… canviar-li de nou l'estat i reobrir-la»): a `Obra`, amb l'estat «Tancat»
    (`tancada502`), els canvis que fa la persona no es desen: `setData` i les funcions de l'App que canvien l'obra (certificacions, hores, pressupostos i
    factures d'honoraris, fitxa, importar) passen per `g502`, que, si el canvi ve d'un clic, un canvi o una tecla (`window.event`), obre l'avís
    («Aquesta obra està tancada» / «Aquest expedient està tancat», «Només es pot consultar i fer llistats…», **Tancar · Reobrir l'obra**) i no desa res;
    el que fa l'app sola (les dates d'obrir-la) sí. Els botons que comencen un canvi (`RE_CANVI878502`: Editar, Afegir, Nova, Importar, Apuntar, Fer
    factura, Eliminar, Guardar, «+ Nota»…, en català i castellà) ja ho diuen abans d'obrir res (un `click` en captura a `.obra-page-v87105`); consultar,
    imprimir, enviar, fer llistats i la barra de l'obra (on es canvia l'estat) no es toquen. «Reobrir» la passa a «En curs / Actiu» (constructora) o «En
    procés» (tècnic). Estils `src/theme-v878502.css`. Prova: `v502test.mjs`.
  - **V87.503 · Planning: resum, recursos i qui treballa a cada partida** (tanda 8, punt 11): a dalt, en lloc dels imports (que ja són a
    l'Econòmic), **Inici · Final · Durada prevista · Recursos** (`resum503`, `gantt-sum-v878252.resum-v878503`; al mòbil, en dues línies). A sota,
    la targeta plegada **«Recursos»** (`gt-recursos-v878503`, `recursos503`): cada colla, treballador o industrial amb les dates i els capítols (o
    partides) on treballa. **A la finestra de la partida** (`EditaPartida878377` amb `pot`, `qui`, `posaQui`), «Qui hi treballa» com al capítol:
    es desa a `partPlans[pid].qui` (`quiPartida878503`; `posaPartida878377` ja no el treu en canviar les dates) i la partida ho diu a la taula. El
    capítol obert, a dalt de les partides, el seu resum (`cap-resum-v878503`: partides planificades, pressupost, dies i qui hi treballa, del
    capítol i de les partides). **Agenda › Equip** (`equipSetmana878381`) també compta qui treballa a cada partida, els dies de la partida.
    Estils `src/theme-v878503.css`. Prova: `v503test.mjs`. Adaptada `v453test` (les quatre xifres al mòbil).
  - **Tanda 9** (l'Héctor, 4/11/2026 a la nit, amb captures del mòbil de Socoterm i d'un Android; llista a `docs/revisio-modul-constructor.md`).
  - **V87.504 · Rajoles de l'obra en una fila al mòbil i l'iPad** (`src/theme-v878504.css`): les quatre rajoles en una fila compacta (icona i nom
    curt, `BLOC_CURT878504`: Pressupost, Comptes, Encàrrec; la rajola activa diu l'apartat a sota, si no és el mateix nom); la llista d'apartats
    en dues columnes de files baixes (també amb el «Visual nou», que la feia tan alta a l'iPhone de l'Héctor), i amb la llista oberta no es veu
    res més de l'obra (`html.obra-llista-v878504`, la posa `ObraBar878269`). Editant el pressupost, la barra (Guardar canvis · Cancel·lar ·
    Afegir · Eines) passa a dues columnes al mòbil (a l'Android se sobreposaven); sense editar, una línia. L'ordinador, com abans. Prova:
    `v504test.mjs`. Adaptades `v485test`, `v492test`, `v457test`, `v484test` («Pendent» sol des de la V87.495), `menustest` (la capçalera
    fixa del pressupost amb les rajoles, i el menú «Opcions» de les fases) i `perfils326test`.
  - **V87.505 · El preu per administració, els llistats en PDF i el proveïdor:**
    - **Partida fora de pressupost per administració** (`preuFP878352`, `factorMarges878505`): si la categoria no té preu a facturar a l'obra, el
      preu és el cost de l'empresa (el del treballador o la mitjana de la categoria) × (1 + DGE) × (1 + BI) dels marges de l'obra (si van «a part,
      al resum», el cost); el material, igual si no hi ha % propi. Fora l'avís «Falta el preu per hora a facturar». A sota del preu, «Cost de
      l'empresa + DGE 13 % + BI 6 %».
    - **Llistats en PDF** (`informeHtml878505`; `window.__acoInforme878505` per a les proves): a dalt el logo, el nom i el NIF de l'empresa i el
      títol amb el seu color; la capçalera de la taula del color, files alternes, números alineats, grups amb subtotal i el total marcat; una
      cel·la buida, «—». Ho fan servir els llistats amb filtres (V87.501) i «Per a la gestoria › Llistat en PDF» de Despeses (factures rebudes per
      mesos). **Abans, sense proveïdor, aquest llistat hi posava el concepte** (probablement el «proveïdor equivocat» que va veure l'Héctor).
    - **Proveïdor** (`esMevaEmpresa878505`): si la IA llegeix com a proveïdor la mateixa empresa (el client de la factura), no es posa, la despesa
      queda «per revisar» i el missatge ho diu. Seleccionar › **«Canviar el proveïdor…»** (`prov-v878505`) per corregir-ne diverses alhora.
  - **V87.506 · Hores: la jornada, les hores extres i les hores dels partes des d'Hores** (`src/theme-v878506.css`):
    - **Jornada del dia** (`jornadaDia878506`): les hores de l'horari d'Empresa › Calendari per a aquell dia de la setmana (`diesText878506`,
      `horesText878506`: «Dilluns a dijous · 8:00-13:00 i 14:00-17:00»); si no n'hi ha, 9 h.
    - **Hores › Personal** (`PartHores878340`): les hores dels partes es poden canviar aquí (`pEd506`; es desen al parte de l'obra amb el pont
      `window.__acoSetD878506` i a la seva despesa, `sincronitzaDespesesParte878352`). Si un treballador passa de la jornada (amb les de totes les
      obres), avís (`extres-v878506`) i «Desar el dia» no deixa fins que es corregeix o es marca **«Són hores extres»** amb el preu de l'hora extra;
      les hores que passen van a les últimes línies del dia (`horesExtres`, `preuExtra` a la despesa: (h − extres) × cost + extres × preu).
    - **Parte** (`ParteEditor878349`): el mateix avís al bloc Personal (amb les hores que el treballador té en altres obres aquell dia,
      `horesDiaAltres878506`) i «Desar el parte» no deixa sense marcar-les; `h.extres878506 = {on, preu}` i `despesesParte878352` en calcula les
      hores extres.
    - Prova: `v506test.mjs` (també la V87.505).
  - **Tanda 10** (l'Héctor, 5/11/2026 al vespre: «sí a tot» a les 7 propostes i «treballa al llarg de la nit»; a la 1:44, amb dues captures del mòbil de
    Socoterm amb el «Visual nou»).
  - **V87.507 · Targetes ben marcades, el nom de la pantalla destacat i el PIN que tria el treballador** (`src/theme-v878507.css`):
    - **Visual nou:** les targetes tornen a tenir la vora marcada (la V87.467 les deixava sense vora: «remarca més les targetes, ja ho vam dir»).
    - **Despeses (menú):** el grup obert (`grup-v878348`) tenia la capçalera blau clar (una regla de la V87.438) amb el text blanc de la V87.451: no es
      llegia l'import. Ara blau ple, com les altres.
    - **El nom de la pantalla, destacat** (mòbil i iPad, `AppHead878268` amb `icona`, `iconaPantalla878507`): a la capçalera, la icona i el nom en blanc
      sobre blau (`pant-v878507`). Dins d'una obra, el seu nom com sempre.
    - **Una sola «Opcions»:** el menú de les fases es diu **«Fases»** (V87.500: «Opcions», i a sota hi havia les «Opcions» de la pantalla). Fora el rètol
      «Fases» del davant.
    - **«Comptabilitat»** sencer a la rajola de l'obra (la V87.504 deia «Comptes»), partit amb un guionet si no hi cap (`guio878507`).
    - **Pendent:** Avisos i Feines són targetes plegades d'entrada (`CardOPlega878369 bloc426`, `pend-c-v878507`), amb quants n'hi ha.
    - **Inici de la constructora:** Contactes just després de l'Agenda (era a baix de tot).
    - **Fitxatge: el PIN el tria el treballador** (`desaPinTreballador878507`): sense PIN, en tocar el seu nom, «Tria el teu PIN» (de 4 a 8 xifres, dues
      vegades); després, «Canviar el meu PIN». Es desa xifrat com abans (`pinPropi878507` = quan). Si se n'oblida, l'oficina el treu a Empresa ›
      Treballadors («Treure el PIN»). L'oficina també el pot posar, com abans.
    - Prova: `v507test.mjs` (24; mira el contrast de totes les capçaleres obertes de Despeses, Pressupost, Rendiment i Contactes). Adaptades `v484test`
      (l'ordre de les rajoles) i `v496test` (el títol de les targetes de Pendent).
  - **V87.508 · L'Inici en rajoles i la barra per fer coses també per al tècnic; la barra i les rajoles es trien a Ajustos** (`src/theme-v878508.css`;
    l'Héctor: «moltes d'aquestes noves pantalles són també equivalents per a tècnics»; «ha desaparegut posar les icones d'accés directe o inclús les
    rajoles de l'Inici a Ajustos»):
    - **Qui:** `iniciRajoles878508()` = qualsevol compte que administra, menys el treballador (la constructora i la gestió total, com fins ara, i ara també
      el tècnic i el compte de l'Héctor). El ＋ de l'obra ja no surt per a aquests comptes (les accions són a la barra). Les proves d'abans del tècnic
      porten la marca `inici-classic-prova-v878508` (la posa l'ajuda de les proves; cap usuari no la té).
    - **Barra de baix** (`BottomNav878268`, `barra878508`, clau `aco_barra_v878508`): Inici i fins a 3 més, accions (`accionsBarra878508`: Parte —amb el
      mòdul Obra—, Despesa, Nota, Foto, Acta, Apuntar hores —sense a la constructora—, Nota de veu) o pantalles; i «Més». De sèrie: constructora i
      gestió total Inici · Parte · Despesa · Nota; tècnic Inici · Nota · Despesa · Apuntar hores. Si el tècnic s'havia triat una barra a la V87.366, es queda.
    - **Accions:** fora d'una obra, «De quina obra?» / «De quin expedient?» (`TriaObraAccio878484`; al tècnic, a la despesa, «Sense expedient · Despesa
      general»); dins, a l'obra (`TAB` de l'efecte `aco-accio-484`: Foto → nota amb la foto, Acta, Apuntar hores → «Gestió temps»). La despesa del tècnic
      és de les seves: va a Despeses amb l'expedient triat (`__acoStartAlb878484.obraId`, `__exp`). La nota de veu obre l'Agenda amb el dictat.
    - **Inici** (`IniciMenu878484`): les rajoles de `iniciTriat878508()` (clau `aco_inici_v878508`, en l'ordre triat; `rajolesDisp878508`: Pendent, Obres o
      Expedients, Agenda, Contactes, Encàrrecs —tècnic—, Hores, Despeses, Facturació, Pressupostos —tècnic—, Rendiment, Llibreria de preus, Empresa,
      Ajustos, Més). De sèrie: constructora Pendent · Obres · Agenda · Contactes · Hores · Despeses · Facturació · Més; tècnic Pendent · Expedients ·
      Encàrrecs · Agenda · Contactes · Hores · Facturació · Més. A l'ordinador, «Més» és «Rendiment». **Encàrrecs** s'obre sol (com Pendent) amb els encàrrecs
      tècnics oberts (`EncarrecsInici878305 obert`).
    - **Ajustos › Accessos ràpids** (`AccessosNous878508`, a tots els comptes que administren): la barra («Per fer» · «Per anar a», 3 com a molt) i les
      rajoles de l'Inici amb ▲ ▼ ✕ i «+» per afegir-ne; «Tornar als de sèrie». El treballador, com abans (`AccessosRapids878366`).
    - Prova: `v508test.mjs` (26: tècnic al mòbil, Ajustos, constructora, tècnic a l'ordinador). Adaptada `v366test` (la constructora torna a tenir
      «Accessos ràpids»).
  - **V87.509 · «Afegir» dins d'«Editar» i les marques de la partida** (propostes 6 i 3; tanda 8, punts 14, 15 i 24):
    - **«Afegir» del pressupost** (`afegirFora509`): amb partides, fora d'«Editar» ja no hi és (ni el botó a l'ordinador ni «Afegir partides» a «Opcions» al
      mòbil); s'afegeix des d'«Editar» › «Afegir» i es desa amb «Guardar canvis». Amb el pressupost buit, com abans.
    - **Fitxa de la partida del pressupost:** «Fora de pressupost» només amb el pressupost tancat (o si la partida ja ho és, per corregir-ho); «No s'executarà
      tota la quantitat» només si ja està marcada (per treure-ho): es marca a la fitxa de la partida de la certificació (`CertPartidaModal87216`), on hi és sempre.
    - Les proves d'abans porten la marca `pressupost-prova-v878509` (la posa l'ajuda de les proves; cap usuari no la té). Prova: `v509test.mjs` (9).
  - **V87.510 · L'Agenda per a visites i reunions; els avisos automàtics, a Pendent i al Resum** (proposta 1; tanda 8, punt 9):
    - Les factures sense cobrar ja no fan una cita automàtica «Factura pendent de cobrament» (`invoiceAlerts8776`) a l'Agenda ni a les cites de l'Inici: l'avís
      de cobrament (V87.496) és a Pendent i al Resum de l'obra, com els altres avisos (certificació del mes, partes per validar, documents que caduquen).
    - **Agenda de l'obra** (`AgendaExpedient8774`): la targeta es diu **«Visites i reunions»** (abans «Cites i avisos»), amb «Feines pendents» a sota.
    - **Fora el tipus «Avís» / «Recordatori»** de les cites noves (un recordatori a mà és una feina amb data); les cites que ja ho eren es veuen igual.
    - Prova: `v510test.mjs` (8). Adaptada `v464test`.
  - **V87.511 · Uns sols «Ajustos de l'obra»** (proposta 5; tanda 8, punt 21; `src/theme-v878511.css`):
    - **`AjustosObra878511`** (dificultat, CI · DGE · BI, on van i el mínim d'hores; `MargesCamps878378` sobre `data.marges878378`): al Pressupost › Ajustos del
      pressupost › «Ajustos de l'obra» (abans «Preus i marges»), i a pantalla sencera des del Rendiment › Compte de l'obra i de Despeses › DGE (botó
      «Ajustos de l'obra», event `aco-ajustos-obra-511` que escolta l'`Obra`, `obreAjustosObra878511`).
    - **El Rendiment ja no té els seus camps de DGE i BI:** diu «DGE x % · BI y %» i el botó. `cfgRend878342` fa servir els de l'obra (els mateixos que els
      preus); si l'obra no en té, els d'Ajustos › Preus i marges o els de l'empresa; sense cap valor, el rendiment no compta DGE (com abans). Els que
      s'havien posat al Rendiment (`rendiment878342`) continuen valent i també els fan servir els preus (`margesObra878378`); en canviar-los als ajustos,
      passen a `marges878378`.
    - Prova: `v511test.mjs` (9). Adaptades `fases342test` (la DGE i el BI, als ajustos), `preus378test` i `v426test` (el nom del bloc).
  - **V87.512 · El descompost en tres targetes: Mà d'obra · Materials · Altres** (proposta 4; tanda 8, punt 16; `src/theme-v878512.css`):
    - **`EditorDescompost878450` amb `x512`** (mode «Descompost»): les línies van a la seva targeta segons el grup (`grupsDesc878512`: el nom de la secció —mà
      d'obra, materials— o, sense secció, el concepte; la resta, «Altres»); els percentatges (CI, DGE, BI…) i el preu final, a sota com abans. Cada targeta
      diu el seu import. Una línia nova va al seu grup (`afegeixDesc878512`; si el grup no hi és, es crea en l'ordre Mà d'obra · Materials · Altres).
    - **Mà d'obra** (`AfegirMO878512`): es tria la categoria (Encarregat, Oficial 1a, Oficial 2a, Peó, Aprenent i els oficis dels treballadors) amb el €/h de
      l'empresa (`costCat878352`, la mitjana dels treballadors d'aquella categoria); «Una altra», a mà.
    - **Materials** (`AfegirMat878512`, `materialsCerca878512`): «Buscar material» als materials dels descompostos d'aquesta obra, de la Llibreria de preus, del
      banc de preus i de les obres anteriors (concepte, unitat, preu i d'on surt); o «Material a mà».
    - **«Fes-ho amb IA»** (si hi ha la funció `aco-ia`; `iaDesc878512`): amb el concepte i la descripció, la IA torna el descompost i el preu (com «Buscar
      preus», 15 lectures com a mínim); s'hi posen els marges de l'obra i substitueix el descompost (pregunta si ja n'hi ha).
    - **«Adjuntar un BC3»** (mòdul tècnic; `bc3Desc878512`): llegeix el BC3 i hi posa el descompost de la partida pel codi o, si no, la més semblant.
    - Les proves d'abans porten la marca `desc-prova-v878512` (l'editor d'abans; la posa l'ajuda de les proves). Prova: `v512test.mjs` (12).
  - **V87.513 · Amidaments: llegir un plànol amb IA i, a la constructora, passar-ho a pressupost sense preus** (proposta 2; tanda 8, punt 12;
    `src/theme-v878513.css`):
    - **«Llegir un plànol amb IA»** (si hi ha la funció `aco-ia`; a la barra dels Amidaments, o a «Opcions» si ja n'hi ha): `PlanolIa878513`. S'adjunta el
      plànol acotat (PDF o foto, fins a 4) i es diu o s'escriu què s'ha d'amidar («enrajolat del bany fins al sostre»); `iaCrida("partides")` amb
      `reglesAmid878513` (amidar només el que es demana, les mides de cada parament a la descripció, cap preu). Es revisen (casella, concepte, quantitat,
      unitat i les mides) i «Afegir-ne N als amidaments» (`aplicaPlanol513`, línies `ia878513` sense preu). Gasta com a mínim 8 lectures.
    - **Constructora** (`constructoraPropia878363`): «Passar-ho a pressupost» sense preus (pu 0, ni descompost ni marges; «Passaran sense preus.»).
      Les proves d'abans porten la marca `amid-prova-v878513`.
    - Prova: `v513test.mjs` (IA simulada).
  - **V87.514 · Caixa i bancs** (proposta 7; tanda 8, punt 22; `src/bancs.js`, `src/theme-v878514.css`). Menú **«Bancs»** (comptes amb el mòdul Empresa;
    també rajola de l'Inici i opció de la barra de baix). Es desa al compte: `aco_bancs_v878514 = {comptes:[{id, nom, entitat, iban, num43, saldoIni, dataIni}],
    apunts:[{id, compte, data, valor, concepte, import, saldo, document, ref1, ref2, arxiu, aparellat?}]}`.
    - **Importar l'extracte** (`Bancs878514`): **Norma 43** de l'AEB (`esNorma43`, `llegirNorma43`: registres 11, 22, 23 i 33; un o diversos comptes, que es
      creen sols amb el saldo inicial i la data) o **CSV / Excel** (`llegirFilesBanc`: data, concepte, import —o càrrec i abonament— i saldo; números europeus o
      anglesos, dates dd/mm/aaaa o de l'Excel); amb diversos comptes, pregunta a quin. Un apunt ja importat no es torna a posar (`clauApunt`).
    - **Aparellar** (`candidats`, `aparellaSols`): un abonament amb el mateix import que una factura emesa sense cobrar (de l'obra o d'honoraris) i un càrrec amb
      el d'una despesa sense pagar (no les incloses en una factura), amb la data que hi lliga (de 5 dies abans a 180 després). Cada apunt proposa els seus
      documents («Cobrament de F2026-012», «Pagament de ALB 345»); **«Aparellar N apunts»** fa els que només tenen un document possible. Aparellar marca la
      factura com a cobrada amb la data de l'apunt (`__acoPatchFactura878496`) i la despesa com a pagada (`pagada878514`); «Desfer» ho torna enrere;
      «Sense document» (comissions, impostos…) el treu de per aparellar.
    - A dalt: **Saldo** (de tots els comptes), **Per cobrar** (factures emeses pendents), **Saldo previst** (la suma) i **Per aparellar**. Cada compte, una targeta
      amb el seu saldo, «Per aparellar · Tots» i els apunts (l'últim a dalt).
    - Proves: `bancsunit.mjs` (16, sense navegador) i `v514test.mjs`.
  - **Tanda 11 · Control horari** (l'Héctor, 6/11/2026 al matí, amb tres captures d'Hores de Brava: «fer-la més entenedora… llistat setmanal de
    tots els treballadors… una targeta per treballador… una gràfica en colors de les obres… el calendari mensual amb colors… vacances, baixes…
    Control horari potser seria el nom més adient»).
  - **V87.515 · Control horari i el calendari laboral amb colors** (`src/theme-v878515.css`):
    - **Nom:** als comptes amb el mòdul Empresa (constructora i gestió total), «Hores» es diu **«Control horari»** (`etHores878515`: menú,
      capçalera, rajola de l'Inici, barra de baix). El tècnic i el treballador continuen amb «Hores». Les proves van a `'^(Hores|Control horari)$'`.
    - **Pestanyes de dalt com a rajoles** (`ch-rajoles-v878515`): Personal · Fitxatge · Calendari (· Les meves hores), cadascuna amb la icona i
      com està (les hores d'aquesta setmana, quants treballen ara, si avui és festiu o hi ha absències); el text de sota va a `data-sub` (CSS)
      perquè el nom del botó sigui només «Personal»…
    - **Calendari** (`CalendariEmpresa878393` reescrit): a dalt l'any; la vista de colors (`cal-vis-v878515`) amb **Mes · Any** (de sèrie, l'any
      a l'ordinador i el mes al mòbil i l'iPad), «Tota l'empresa» o un treballador, i la llegenda. Laborables en blanc, caps de setmana en gris,
      **festiu oficial** vermell, **festa local** taronja, **vacances de conveni** verd, **no laborable** gris fosc; amb un treballador triat, les seves
      **vacances** (verd clar), **baixes** (lila) i **permisos** (ambre); amb tota l'empresa, unes marques amb quants. Cada dia és un botó
      (`dia-v878515`, `data-d`) i, a la dreta (ordinador) o a sota (mòbil), **el dia triat**: si és laborable, quants treballen, qui és fora i
      fins quan, les hores apuntades, «Marcar com a festiu» / «Treure el festiu» i «Vacances, baixa o permís».
    - **Dades:** cada festiu té `tipus` (oficial · local · conveni · altre; els d'abans, oficials) i les absències van a
      `calendari878393.absencies = [{id, wid, nom, tipus: vacances|baixa|permis, des, fins, nota, at}]` (una baixa sense «fins» continua oberta;
      `finsAbs878515`). Per any, `vacDies` = dies laborables de vacances de cada treballador; les vacances de conveni hi compten
      (`vacancesAny878515`). `desaCalendari878393` avisa amb l'event `aco-calendari-changed` (`useTickCal878515`).
    - **Festius oficials de Catalunya** (`FESTIUS_CAT878515`, 2026 i 2027, Ordres EMT/66/2025 i EMT/52/2026): «Posar els festius oficials de
      Catalunya (N)» posa els que falten amb el nom en l'idioma de l'usuari. Les dues festes locals, les posa cada empresa.
    - **Targetes plegades:** Vacances, baixes i permisos (per treballador, amb «Vacances {any}: N de M dies» i la barra) · Festius i dies no laborables
      (amb el tipus i «+ Uns quants dies», que fa els dies de dilluns a divendres d'un tram: `FormFest878515`) · Horari de treball · Jornada anual i
      vacances · Full per penjar. El PDF per penjar pinta cada tipus del seu color amb la llegenda; les absències de cada treballador no hi surten.
    - Prova: `v515test.mjs` (28). Adaptades `calendari393test` (targetes noves) i, pel nom, les proves que anaven a «Hores» (19) i `v484test`,
      `v507test` i `v508test` (la rajola de l'Inici).
  - **V87.516 · La fitxa de cada treballador: la setmana, cada dia amb «Corregir» i «Validar»** (`src/theme-v878516.css`):
    - **Personal** (`PartHores878340`, només sense `obraFixa`): sota els dies, **una rajola per treballador** (`treb-raj-v878516`, `raj-w-v878516`:
      inicials, nom, categoria, hores de la setmana, «N de M validats» o «Validada», i si és fora: «Vacances fins al …») i **«Setmana de tothom»**
      (la graella de sempre en una targeta plegable, oberta a l'ordinador). A la graella, el nom obre la fitxa (`nom-bt-v878516`), les caselles
      sense hores d'un dia de vacances, baixa o permís diuen V, B o P (`a-<tipus>`), i els dies validats porten una marca (`val`, CSS).
      Des de l'obra (`obraFixa`), com abans.
    - **La fitxa** (`FitxaTreballador878516`, `PantallaSencera878489`; s'obre des de Personal i des de Fitxatge › Registre): a dalt, les hores
      de la setmana, el mes i l'any (amb el cost) i les vacances de l'any; si avui és fora, ho diu. **La setmana** (‹ ›): un requadre per dia amb
      les obres i les hores, les hores fitxades, el total i si està validat (vora verda; taronja si ha canviat), i «Validar N dies».
      **Un dia**: «Hores a les obres» amb «Corregir les hores» / «Apuntar les hores» (obre `PartHores878340` amb `nomesW`, `diaInicial` i
      `onTanca`: el formulari de sempre només d'aquell treballador), «Fitxatge» amb els marcatges i «Corregir el fitxatge» (`CorregirFitx878357`),
      la diferència si el fitxat i les obres no lliguen, i **«Validar el dia»**. A sota, «Vacances, baixes i permisos» (`LlistaAbs878515` i
      «Afegir», amb el treballador ja triat) i **«Registre de jornada»** (el mes amb ‹ ›, «PDF del mes» i «PDF de l'any»).
    - **Validar**: `aco_validats_v878516` = {[treballador]: {[dia]: {at, per, h, hf}}} (`posaValidats878516`, event `aco-validats-changed`);
      `h` i `hf` són les hores a les obres i les fitxades en validar: si després canvien, «Ha canviat des que es va validar» i «Tornar a validar».
    - **Fitxatge › Registre** (`RegistreFitx878357`, ara rep `obres` i `odata`): a dalt el dia, el mes amb «Tots» (PDF i Excel del mes,
      amb la columna «Validat») i la ubicació; a sota, **una rajola per treballador** (`fitx-rw-v878516`: com està el dia triat, les hores del dia i
      del mes, el color de l'esquerra segons si treballa, és en pausa o ha sortit, vacances o baixa, i la marca si està validat) que obre la fitxa.
      Els PDF del registre són funcions comunes (`pdfMesFitx878516`, `pdfAnyFitx878516`, `resumMesFitx878516`, `docFitx878516`).
    - Certificacions al mòbil: «Llistat» (V87.501) passa a dins de la targeta (`llistat-m-v878516`); a la línia, el títol quedava a sota de l'import.
    - Prova: `v516test.mjs` (23). Adaptades `fitxatge357test` i `v487test` (el registre i les correccions, des de la fitxa).
  - **V87.517 · On van les hores i els llistats** (`src/theme-v878517.css`):
    - **Hores per obra** (`HoresPerObra878517`): a Personal, una targeta plegada a sota de «Setmana de tothom», i a la fitxa de cada treballador (només
      les seves). Setmana · Mes · Any (de la setmana triada) i, a Personal, «Tots junts» o «Per treballador». Una barra repartida per obres (cada obra el seu
      color, `SERIES878343`, per ordre alfabètic entre les que surten; de la vuitena en avall, «Altres» en gris) i la llista amb les hores i el %.
    - **Llistats** (`LlistatsCH878517`, a dalt a la dreta del Control horari, `ch-eines-v878517`): «Hores a les obres» (dia, treballador, obra, hores,
      cost, validat; categoria, origen i mes, opcionals), «Registre de jornada» (els fitxatges dels últims 24 mesos: entrada, sortida, fitxat, a les obres,
      diferència, correccions, validat) i «Vacances, baixes i permisos». Tots amb `Llistat878501` (dates, any, treballador, obra, mes… i Excel, PDF,
      imprimir). `Llistat878501` admet `tipus:"hores"` (`sumLl878517`: el total en hores).
    - Les rajoles dels treballadors fan 310 px com a mínim (el nom es tallava).
    - Prova: `v517test.mjs` (15).
  - **V87.518 · Nivells de les targetes: les llistes dins d'una targeta i les subtargetes ben clares** (l'Héctor, 5/11/2026 al migdia, amb una captura de
    Control horari › Personal: «una targeta on estiguin tots els treballadors… i després setmana i hores per obra com una targeta al mateix nivell… fes repàs a
    tota la app… amb el remarcat i les ombres de les targetes per veure les subtargetes molt clar»; `src/theme-v878518.css`):
    - **Norma:** una llista d'elements (treballadors, factures, expedients…) no va mai solta al costat de les targetes principals: va dins d'una targeta principal
      (`CartaLlista878518`: plegada al mòbil i oberta a l'ordinador, com «Setmana de tothom»; quan canvia `obrir` —un filtre, un estat tocat a dalt— s'obre).
    - **Control horari › Personal:** «Treballadors» (amb quants n'hi ha) · «Setmana de tothom» · «Hores per obra», tres targetes al mateix nivell.
    - **Facturació** de l'empresa i del tècnic: la llista i el total, dins de «Factures» (quantes · total amb IVA); tocar un estat de dalt l'obre. A l'ordinador,
      oberta i en blanc (és una taula). **Hores del tècnic:** «Per expedient», dins d'una targeta com «Gràfica i informes».
    - **Nivells:** principal (nivell 1) amb vora #8FA0B3, radi 16 px i una ombra que la separa del fons; oberta, vora blava de 2 px i, **si porta subtargetes, el fons
      de dins blavós (#E6EDF6, la «safata»)**. Subtargeta (nivell 2: `sub-v878426`, mesos de les hores, passos de l'encàrrec, capítols del pressupost, treballadors,
      fitxatge, files de factures i proformes, famílies de preus, **i ara cada contacte**): blanca, vora fina de 1 px #AEBBCA, radi 12 px i una ombra petita; oberta,
      vora blava de 2 px. Les targetes amb formularis o text (Ajustos…) es queden blanques per dins. Les regles van amb `html:root` perquè guanyin les del «Visual nou».
    - **De passada:** a la Facturació del tècnic a l'ordinador, «PDF · Enviar · ⋯» no hi cabien (130 px) i tapaven «Vençuda»: ara 220 px.
    - Eina nova `tools/proves/nivells518.mjs` (`OUT=`, `W=`, `COMPTES=`, `WEBROOT=`): a cada pantalla, amb les principals obertes, diu on hi ha elements solts al costat de
      targetes principals («BARREJA») i subtargetes que es veuen com una principal («IGUALS»). Queden, a propòsit: xifres de dalt, filtres, el resum de l'obra, i
      **Honoraris de l'expedient i les Hores del tècnic, que són pantalles velles per refer** (full de ruta).
    - Les proves d'abans porten la marca `cartes-prova-v878518` (la posa l'ajuda de les proves: les targetes de les llistes, obertes). Prova: `v518test.mjs` (19).
  - **V87.519 · Comptes de prova amb data de fi** (l'Héctor, 5/11/2026: «haurien d'estar capades a 2 setmanes o un mes màxim… i les lectures»; «sí, fes-ho
    automàtic»; guia per a ell: `GUIES_USUARIS/Guia-comptes-de-prova.pdf`):
    - **Comptes «prova-»** (`prova-garcia-constru@usuaris.controlobres.app`; els `demo-` de l'Héctor no caduquen): la primera vegada que entren, el servidor
      els posa la data de fi (de sèrie 15 dies, avui inclòs) i 100 lectures d'IA al mes. La benvinguda proposa el perfil i les dades d'exemple com als `demo-`,
      però el nom de l'empresa l'escriuen ells.
    - **SQL** `supabase/aco_proves_v878519.sql` (**l'ha d'executar l'Héctor**; sense, l'app com abans): taules `aco_proves` (`fins`, `client`) i
      `aco_proves_config` (dies, lectures, contacte); `aco_prova()` (l'estat del compte connectat, i la comença si cal), `aco_prova_activa()` i regles
      **restrictive** a `aco_kv`, `aco_shared` i `storage.objects` (`aco-fitxers`): passat el dia de fi no llegeix ni desa res, **sense esborrar res**. Funcions de
      l'Héctor (`aco_es_admin()`: el compte que no és @usuaris): `aco_proves_llista`, `aco_prova_posa`, `aco_prova_client`, `aco_prova_lectures`.
    - **App:** `cloudSync.js` (`comprovaProva`, `__acoCloud.proves`) demana l'estat en arrencar (i en tornar a l'app passada una hora) i el deixa a
      `window.__acoProva878519`; si s'ha acabat, no sincronitza i `main.jsx` ensenya `src/ProvaAcabada.jsx` («La prova s'ha acabat», el dia, el contacte i
      «Sortir») en lloc de l'app. `ProvaDies878519` («Prova gratuïta · queden N dies», taronja els tres últims) a l'Inici i a Ajustos › Perfil i mòduls.
    - **Ajustos › Comptes de prova** (només el compte de l'Héctor, `ProvesAjustos878519`): dies, lectures i el contacte de la pantalla de fi; la llista (sense
      entrar · queden N dies · acabada · client, la darrera entrada i les lectures) amb «Allargar N dies», «Començar avui», «Tancar ara», «Passar a client» i les lectures.
    - Estils `src/theme-v878519.css`. Proves: `proves519sqltest.mjs` (33, amb un Postgres de debò, PGlite) i `v519test.mjs` (23; `SENSE_PROVES=1`: sense
      l'SQL). El Supabase de proves té els comptes `prova-garcia-constru` i `prova-puig-tecnic` (`prova2026`) i `GET`/`POST /__proves`.
    - **El núvol és a Frankfurt** (`eu-central-1`, comprovat per l'Héctor el 5/11/2026). Ús el 5/11: 33 MB de dades i 80 MB d'arxius (pla Pro: 8 GB i 100 GB);
      el «límit de despesa» és activat: si es passa d'un límit, Supabase bloqueja el que passa fins al mes següent.
  - **V87.520 · L'espai del núvol a l'Inici, una tercera còpia al Google Drive i «Còpia al meu ordinador»** (l'Héctor, 5/11/2026: «si a tot»):
    - **Espai** (`espaiAvisos878520`, `PLA878520` = 100 GB d'arxius i 8 GB de base de dades del pla Pro): a l'Inici del compte de l'Héctor (Pendent ›
      Avisos), «Núvol: els arxius, al {p} %» o «…la base de dades…» a partir del 70 % (vermell al 90 %), amb els GB; tocant-lo, Ajustos. Es demana a
      `aco_espai()` com a molt cada 6 h (`sessionStorage` `espai-v878520`). Ajustos › Espai al núvol diu els límits del pla Pro (abans, el gratuït).
    - **Còpies del núvol** (`tools/copies/copia-nuvol.mjs`): una tercera carpeta, `G:\Mi unidad\COPIES_CONTROL_OBRES` (el Google Drive de l'Héctor, fora de
      l'ordinador); si el Drive no és obert, aquesta no es fa i el registre ho apunta.
    - **Ajustos › «Còpia al meu ordinador»** (`CopiaOrdinador878520`, tots els comptes menys el treballador; Chrome o Edge a l'ordinador, File System Access):
      «Triar la carpeta» (es recorda a l'aparell, IndexedDB `aco_copia_ordinador`, per usuari) i, cada dia que s'obre l'app (`CopiaAuto878520`, 20 s després),
      `ControlObres-<usuari>-<dia>.json` (el format d'«Exportar còpia JSON», es pot tornar a importar) i els arxius que encara no hi són a `arxius/<obra>/` i
      `arxius/Albarans, fotos i logos/` (`recorreArxius` de `src/fileStore.js`). Es guarden 30 dies i el dia 1 de cada mes, 12 mesos. Si el navegador ha de
      tornar a donar permís, l'Inici diu «Còpia al teu ordinador · Toca per fer la d'avui». «Fer la còpia ara», «Canviar de carpeta», «Deixar de fer-la».
    - Traduccions al castellà de la V87.519 i la V87.520 (sortien en català). Estils `src/theme-v878520.css`. Prova: `v520test.mjs` (14; la carpeta és la del
      navegador, OPFS, amb `window.__acoTriaCarpeta878520` i `__acoCopiaEspera878520`). El Supabase de proves accepta `POST /__espai`.
    - **Fitxatge a les proves** (l'Héctor, 5/11/2026: «només fitxarà el propietari de la demo»): com sempre, Control horari › Fitxatge › Fitxar, posant-se ell a
      Empresa › Treballadors. Només als comptes de constructora o gestió total (al compte de l'Héctor i als tècnics no hi és). Captures: `capfitx.mjs`.
  - **Tanda 12 · Caixa, gestoria i fitxatge** (l'Héctor, 5/11/2026 a la tarda: «d'acord a tot»; abans va preguntar si caixa i bancs no ho faria la gestoria:
    la resposta va ser no fer una segona comptabilitat, només el que la gestoria no dona —qui ens deu, a qui devem i com anirem de diners— i el paquet per
    a la gestoria; i, del fitxatge, què demana l'art. 34.9 ET i el VII Conveni de la Construcció, art. de la jornada, punts 8–11: registre diari amb
    inici i final, un mitjà que «acrediti la conformitat» del treballador, tots els dies, consulta del treballador, 4 anys; el decret del registre
    digital **no està aprovat** —Consell d'Estat en contra el 23/3/2026, aplaçat el 24/7—; l'app no pot dir «compleix la normativa»: no hi ha
    homologació). **Norma de l'Héctor: el que es canvia per a la constructora i coincideix amb el tècnic, es fa als dos a la mateixa versió.**
  - **V87.521 · Caixa i bancs** (`Caixa878521`, `src/caixa.js`, `src/theme-v878521.css`):
    - **Menú «Caixa i bancs»** (abans «Bancs», només amb el mòdul Empresa) per a tots els comptes que administren menys el treballador: la constructora, la
      gestió total, el tècnic i el compte de l'Héctor. La clau de pantalla continua sent `Bancs`; la rajola de l'Inici i l'opció de la barra, també.
    - A dalt, quatre rajoles (les de Control horari): **Per cobrar · Per pagar · Previsió · Bancs** (la pantalla de la V87.514, sense canvis).
    - **Per cobrar** (`cobrarItems878521`): les factures emeses sense cobrar (`facturesCobrar878496`). Les de l'obra (`facturesObra878297`) només als comptes
      d'empresa (`esEmpresaFactura878337`): al compte de l'Héctor les fa en nom del client. Les d'honoraris (`facturesTecnic`), amb el mòdul tècnic i només de
      les obres pròpies. La data prevista és la de l'avís de cobrament (`avisCobr878496.data`, V87.496) o la de la factura + els «Dies de cobrament de sèrie»
      (de sèrie 10; ara també fa servir aquests dies l'avís, `diesCobrar878521`). Bancs aparella amb aquestes mateixes factures (`docsBanc878514`).
    - **Per pagar** (`pagarItems878521`): les despeses sense pagar (`pagada878514`) ni incloses en una factura, que són factures (no albarans, mà d'obra, les
      dels partes ni de les hores, les meves despeses ni les importades d'un Excel), des de 60 dies abans del primer dia que s'obre la pantalla
      (`aco_caixa_v878521.inici`: les d'abans es donen per pagades). Amb data de pagament (`venciment878521`), qualsevol despesa. Data prevista = la factura
      + «Dies de pagament de sèrie» (de sèrie 30).
    - Cada llista, en targetes Vençudes / Aquesta setmana / Més endavant (`grupData`); tocar-ne una obre `MovCaixa878521`: canviar la data prevista, «Ja està
      cobrada / pagada» (amb el dia) i obrir l'obra.
    - **Previsió** (`previsio` de `src/caixa.js`: 13 setmanes de dilluns a diumenge; el que és vençut compta a la setmana d'ara): el saldo d'avui (dels
      comptes del banc o, si no n'hi ha, escrit a mà: `saldoMa`), entrades, sortides i el saldo d'aquí a 13 setmanes; la gràfica de barres
      (`GraficaCaixa878521`, vermelles en negatiu), «Setmana a setmana» i **«Pagaments fixos»** (nòmines, Seguretat Social, lloguer…: `fixos =
      [{id, concepte, import, dia, cada (1, 3, 6, 12 mesos), des, fins}]`, `datesFix`; només compten des d'avui).
    - **Avisos a l'Inici** (`avisosCaixa878521`, només quan ja s'ha obert la pantalla): pagaments vençuts, pagaments d'aquesta setmana i «La caixa queda en
      negatiu la setmana del …»; tocant-los, la pantalla a la rajola que toca (`obreCaixa878521`).
    - Es desa al compte: `aco_caixa_v878521 = {inici, cobrar, pagar, fixos, saldoMa:{import, data}}`.
    - Proves: `caixa521unit.mjs` (15, sense navegador) i `v521test.mjs` (23: constructora, tècnic i mòbil). Adaptada `v514test` (Bancs és una rajola).
  - **V87.522 · Paquet per a la gestoria** (`PaquetGestoria878522`, `src/zip.js`, `src/theme-v878522.css`):
    - **On:** Facturació › Per a la gestoria (empresa i tècnic), Despeses › Opcions (empresa) i Despeses › Per a la gestoria (tècnic): «Paquet per a la
      gestoria…» (`obrePaquetGestoria878522`, event `aco-gestoria-522`; la pantalla, `PaquetGestoriaGlobal878522`, és a l'App). No al treballador.
    - **Pantalla** (`PantallaSencera878489`): el període (trimestres i anys amb factures; de sèrie, durant el primer mes d'un trimestre el d'abans i, si
      no, el d'ara: `periodeDefecte878522`), quantes factures emeses i rebudes i el total, «El PDF de cada factura emesa», «La foto o el PDF de cada
      factura rebuda», el nom i el correu de la gestoria, «Preparar el paquet» («Preparant 3 de 12…») i, a punt: «Enviar a la gestoria» (Gmail amb el
      ZIP adjunt; si passa de 20 MB, demana descarregar-lo), «Compartir» (mòbil) i «Descarregar el ZIP». Si ja s'ha enviat: «Enviat el … a …».
    - **Factures emeses** (`emesesGestoria878522`): les de l'obra als comptes d'empresa (`facturesObraValides878347`, també les importades, sense PDF) i
      les d'honoraris de les obres pròpies (sense les anul·lades). **Rebudes** (`rebudesGestoria878522`): les despeses sense la mà d'obra, les dels partes i
      de les hores ni els albarans inclosos en una factura (com el llistat de la V87.391), amb les meves despeses.
    - **El ZIP** (`fesPaquet878522`, `fesZip` de `src/zip.js`: sense comprimir, noms en UTF-8, sense repetits): una carpeta «Gestoria {període} ·
      {empresa}» amb «Factures emeses {període}.xlsx/.pdf», «Factures rebudes {període}.xlsx/.pdf» (`informeHtml878505`), «Factures emeses/{número} ·
      {client}.pdf» (`htmlDoc878405` + `htmlAPdf`) i «Factures rebudes/{data} {proveïdor} {número}.jpg|.pdf» (la foto o el PDF desats a l'aparell). Cada
      Excel diu el nom del document dins del ZIP.
    - Es desa al compte: `aco_gestoria_v878522 = {nom, email, enviats:{[període]:{at, a, via: gmail|compartit|descarregat, n}}}`.
      `window.__acoUltimPaquet878522` (l'últim paquet) és per a les proves.
    - Prova: `v522test.mjs` (18: llegeix el ZIP i els Excel; Gmail simulat; tècnic; mòbil).
  - **V87.523 · Fitxatge: la conformitat del treballador, les correccions que veu i el full d'informació** (`src/theme-v878523.css`; l'Héctor,
    5/11/2026: «el tema del fitxatge és vàlid si hi ha una revisió? No s'ha de complir una normativa específica?»; l'art. 34.9 ET i el VII Conveni de
    la Construcció demanen el registre diari, 4 anys, consultable pel treballador i un mitjà que «acrediti la conformitat»; **l'app no diu mai
    «compleix la normativa»**: no hi ha homologació i el decret del registre digital no està aprovat):
    - **A «Fitxar», després del PIN** (`AvisosTreb878523`): les correccions de l'oficina dels dos últims mesos que el treballador encara no ha vist
      (dia, marcatge, «Afegit» o «Anul·lat» i el motiu; «Entesos», `marcaVistes878523`) i, si el mes passat té fitxatges, «El teu registre · {mes}»
      (dies i hores) amb **«Hi estic d'acord»** o **«No hi estic d'acord»** (amb el que no és correcte, «Enviar a l'oficina»).
    - **Dades:** `aco_fitx_conforme_v878523 = {[treballador]: {vist, mesos: {[AAAA-MM]: {at, ok, nota, h, dies, hash}}}}` (`posaConf878523`). El `hash`
      (`hashMesFitx878523`) diu com era el registre en confirmar-lo: si després es corregeix, `confMes878523` dona «canviat» («Ha canviat des que el va
      confirmar») i es torna a demanar. Event `aco-fitxatge-changed`.
    - **Oficina:** a la fitxa del treballador, la conformitat del mes que es mira (`conf-w-v878523`); al PDF del mes, sota «Signatura del treballador/a»
      («Conforme el …»), i al peu «Segons el VII Conveni…» (només amb el mòdul Obra) i «Les correccions queden registrades amb la data i el motiu; no
      s'esborra cap marcatge»; a l'Excel del mes, la columna «Conformitat del treballador». A l'Inici (Pendent › Avisos), «{nom} no està d'acord amb el
      seu registre · {mes}» amb el comentari (`avisosFitx878523`, `k:"fitx-no"`): tocant-lo, el Control horari s'obre al Fitxatge
      (`window.__acoCHVista878523`).
    - **Full d'informació per als treballadors** (Fitxatge › Registre › «Tots», `infoFitx878523`): una pàgina per treballador amb com es registra, què
      es desa (amb la ubicació si està activada), per a què, correccions, conformitat, conservació (4 anys) i protecció de dades (art. 90 de la
      LOPDGDD), i «Rebut i informat: signatura del treballador/a».
    - Prova: `v523test.mjs` (14). Passen `fitxatge357test`, `v516test`, `v487test`, `v507test`, `avisos360test`, `v496test`, `v515test`, `v517test` i `v521test`.
  - **V87.524 · La partida a pantalla gran a tots els aparells** (`src/theme-v878524.css`; l'Héctor, 5/11/2026, després d'entrar al descompost d'una
    partida d'una obra de prova: «vull la partida en pantalla més gran perquè vull veure la descripció completa… el més gran possible dins de tots els
    dispositius»):
    - **Consultant i editant, a l'ordinador, l'iPad i el mòbil**, tocar una partida l'obre a la pantalla pròpia de la V87.486 (`.partida-pantalla-v878486`,
      ara amb `llegeix-v878524` o `edita-v878524`): «‹ Tornar al pressupost» i el codi i el concepte a dalt (el concepte en dues línies), la fitxa al mig i
      «Següent ›» · «Fet» a baix. Abans, consultant s'obria dins de la llista, i a l'ordinador també editant. `enPantalla878524`, `tancaPartida878524`
      (consultant tanca `fitxa426`; editant, la fila); `vesSeguent878488` obre la següent en tots dos modes.
    - **Consultant, la descripció sencera** (`FitxaPartida878361 gran`, `desc-sencera-v878524`), sense «Veure descripció». **Editant, el quadre de la
      descripció creix amb el text** (`AutoArea878524`), sense barra de desplaçament a dins.
    - **A l'ordinador** (≥1101 px): tota la finestra, amb el contingut fins a 1.280 px al mig. Amb la partida oberta, la pàgina de sota no es mou i no surten
      els rètols del núvol ni de «Desat a l'ordinador» (tapaven «Següent»), ni el «Fet» de la fitxa (ja hi és a baix).
    - Les proves d'abans porten la marca `partida-inline-prova-v878524` (la posa l'ajuda de les proves si la pàgina no té `sessionStorage.__partidaNoTocar`;
      cap usuari no la té): la partida com fins ara. Prova: `partida523test.mjs` (24: ordinador, mòbil i iPad; consultant i editant).
    - **La unitat «BASE: 22,…»** que l'Héctor va veure en una partida ve de l'arxiu importat (la columna que l'app ha llegit com a unitat): per mirar-ho, cal l'arxiu.
  - **V87.525 · Hores del tècnic i Honoraris de l'expedient amb el patró de les altres pantalles** (les dues «pantalles velles per refer» de la
    V87.518; `src/theme-v878525.css`, `src/theme-v878526.css`):
    - **Hores (menú, `GestioTemps878255`)**: el període (expedients oberts o tots; tot, avui, setmana, mes, interval) a la vista; el client, l'expedient i
      «Només pendent de facturar», dins de `details.mes-v878525` («Filtres (n)», plegat al mòbil i l'iPad, a la vista a l'ordinador). Al mòbil, sense
      l'etiqueta de dalt i «+ Afegir hores» de punta a punta. L'objectiu del dia ja no és un camp dins de les xifres («objectiu 8 h»): és a la gràfica.
      Cada expedient de «Per expedient», una subtargeta (vora fina, blanca, sobre la safata blavosa). A baix, «Hores per dia» (o per mes; la gràfica
      amb «Objectiu diari» i, a la línia, la mitjana) i **«On van les hores»** (`RepartHores878525`: Per client · Per expedient · Per feina, barra de
      colors i llista amb les hores i el %, com «Hores per obra» del Control horari). **Fora el «Rendiment global d'honoraris» vell** (`TracaGeneral`,
      ja no surt enlloc): repetia Facturació i Rendiment.
    - **Honoraris de l'expedient (`HonorarisExpedient8778`)**: les pestanyes, com les rajoles del Control horari (`hon-raj-v878526`: icona, nom i com està,
      `data-sub`): Pressupostos d'honoraris («1 pressupost»), Factures (el facturat o «Cap»), Hores («2,5 h»), Despeses (les meves) i Rendiment (el resultat).
      Al mòbil, de dues en dues. Les regles d'abans de les pestanyes (V87.389, V87.431) portaven `!important`: les noves també.
    - Prova: `v525test.mjs` (15, demo-tecnic: ordinador i mòbil).
  - **V87.526 · La certificació: cada cosa a la seva targeta, els botons de dalt com al pressupost i el «⋯» de la fila amb tot** (l'Héctor,
    6/11/2026: «a banda de fer factura i eliminar pot estar també la de vista preliminar o veure PDF?»; «primer hauria d'estar Partides… una
    paraula com fer certificació… el resum i el quadre resum no han d'anar juntes?… l'editar, si és de les partides, a la targeta que li toca…
    les opcions sempre a dins de la targeta corresponent… a fora, com a pressupost, editar, imprimir, enviar, signar»; `src/theme-v878527.css`):
    - **A dins d'una certificació**, primer **«Fer la certificació»** (abans «Partides», `cert-partides-v878426`) amb, a dins (`einesCert527`),
      **Editar** (editant, Cancel·lar · Guardar canvis; al mòbil, la barra fixa a baix de la V87.452), Afegir feina, **«Omplir-la des d'un Excel»**
      (abans «Importar Excel de certificacions») i les partides retirades; després **«Resum»** amb el **Quadre resum** a dins (subtargeta
      `quadre-sub-v878527`). Tot tancat en entrar. Mentre s'edita, «Fer la certificació» no es plega.
    - **A dalt** (`botonsCap527`), sense «Editar»: a l'ordinador **Imprimir · Enviar · Signar · Fer factura** (o «Factura F…») i «⋯» (Proforma,
      Eliminar la certificació); al mòbil i l'iPad, **Imprimir · Enviar · Opcions** (Signar, Proforma, la factura, Eliminar). «Imprimir» obre les
      opcions de sempre (PDF de la certificació en A4 vertical, PDF a origen amb el quadre resum en horitzontal, administració, línies d'amidament).
    - **El «⋯» de cada fila de la llista** (`opcionsCert527(c)`), per grups: **Veure i imprimir** (`PDF · Certificació N` i `PDF · General a origen`
      «amb el quadre resum»; amb línies d'amidament, la casella «Amb les línies d'amidament») · **Editar, enviar i signar** (Editar obre la certificació
      amb «Fer la certificació» en edició) · **Factura** (Proforma, Fer factura / Veure la factura) · Eliminar. Des de la fila d'una altra certificació,
      primer es tria (`setSelected`) i l'acció es fa al dibuix següent (`pend527`, `fesCert527`): els PDF i «Enviar». La fila amb el menú obert va per
      sobre de les de sota (cada menú té capa 40).
    - **Les proves d'abans** continuen amb la certificació d'abans («Editar» a dalt, Resum · Partides · Quadre resum) amb la marca
      `cert-imprimir-prova-v878527` (`vell527`; la posa l'ajuda de les proves si la pàgina no té `sessionStorage.__certNoTocar`; cap usuari no la té).
    - Prova: `v526test.mjs` (20: menú de la fila, PDF de la certificació 1 des de la seva fila, a origen vertical + horitzontal, en entrar tot tancat i
      el quadre dins del Resum, els botons de dalt, «Imprimir», «Fer la certificació» amb Editar a dins, «Editar» des de la fila, «Enviar» des d'una
      altra fila, mòbil).
  - **V87.527 · Les rajoles de l'obra: a l'ordinador s'obren en passar-hi el ratolí, i la rajola oberta és la marcada** (l'Héctor, 6/11/2026:
    «com altres apps, que quan passes el dit o el ratolí per sobre ja es despleguen les opcions per triar… hi ha marcada la de Comptabilitat i en
    canvi he apretat Pressupost i certificacions: dona possibilitat a confusió»; `src/theme-v878528.css`):
    - **Ordinador** (`drop527` = rajoles sense la barra de baix): passar el ratolí per sobre d'una rajola amb més d'un apartat obre la seva llista
      en un menú enganxat a sota de la rajola (`.llista-v878485.drop-v878527`, posició amb `offsetLeft`/`offsetTop` de la rajola dins de la graella,
      `position:relative`); en marxar-ne es plega (320 ms; `obreHover527`, `tancaHover527`, `queda527`); d'una rajola a l'altra canvia al moment.
      Tocar-la també l'obre (si s'acaba d'obrir amb el ratolí, no la tanca); Esc o tocar fora la tanquen. La llista ja no va a sota de la fila.
    - **Tots els aparells:** mentre una rajola té la llista oberta, és ella la plena de blau i la de l'apartat on ets queda suau (blau clar).
    - Prova: `v527test.mjs` (14, amb el ratolí simulat: obrir, canviar de rajola, baixar a la llista, marxar, triar, tocar, Esc, tocar fora, mòbil).
  - **V87.528 · El pressupost: número automàtic amb versions, el nom i el número a la vista, i «Editar aquest capítol»** (l'Héctor, 6/11/2026:
    «me les vaig veure negres per canviar el nom del pressupost o posar la numeració que toca… això no hauria de ser automatitzat? … any_número amb
    quatre xifres (2026_0056) i, dins del mateix expedient, una altra fase o una altra opció de pressupost ja seran versions (2026_0056_V02, i l'altre
    la V01)… per canviar el nom està dins de Fases i em va costar trobar-ho»; «a dins de cada capítol, directe l'opció editar, però només aquell
    capítol; i a fora, editar, que seria tots els capítols»; `src/theme-v878529.css`):
    - **Número** (`numPres878528(d, bid)`): cada obra té `numPres878528` («2026_0056») i cada pressupost o fase la seva versió (`versio878528` a
      `budgetGroups`; el principal, `versioPrincipal878528`; sense, l'ordre de la barra de fases, `versioPres878528`). Un pressupost o una fase
      nova pren la versió següent (`seguentVersio878528`). L'App posa el número a les obres pròpies amb partides que no en tenen
      (`numeraPressupostos878528`: per ordre de creació, seguit per any —el de l'obra— entre totes les obres pròpies; quan el núvol és al dia).
      **El número d'abans per client** (`pressupostRapidNumero`, «2026-BRA-001») ja no es fa servir als documents si l'obra té el nou.
    - **A la targeta del pressupost**, a dins, a dalt (la línia de la targeta tancada només diu el nom i l'import), el número, el nom i **«Canviar el nom o el número»**
      (`NomNum878528`: nom, número i versió; `nomNum528` de `GestioObra8746`). La barra de fases diu la versió de cada fase.
    - **Documents** (PDF, Excel): el número nou, «2026_0056_V01».
    - **«Editar aquest capítol»** a dins de cada capítol obert (`editaCap528`, `capEdit528`): entra a editar i només es veu aquell capítol, amb
      «Edites només «…» · Veure tots els capítols» (`cap-sol-v878528`); en guardar o cancel·lar, tots. «Editar» de dalt, tots com sempre.
    - Prova: `v528test.mjs` (número sol, canviar el nom i el número, la barra de fases, el PDF, editar un capítol, recarregar, mòbil).
  - **V87.529 · Caixa i bancs, segona volta** (l'Héctor, 6/11/2026: «les coses d'informació, entre parèntesi o amb lletra menor… està molt a prop
    l'import de l'avís de 1 per cobrar»; «les dates dels venciments, on les hem posat a les factures en el moment de fer-les?»; «quan ja estan cobrades
    o pagades, on surten?»; «continuava estant targetes desplegades per defecte»; «la previsió és d'aquí a 13 setmanes, on ho canviem? potser haurien
    de ser mensuals»; «importar l'extracte només des de Banc… quin format?»; «puc tenir tants comptes com vulgui… decideixo des d'on tira?»; «a l'Inici
    posa Bancs o Caixa perquè el Més també està a baix»; `src/theme-v878530.css`):
    - **Rajoles:** a sota del nom, l'import; l'avís («1 vençuda») a part, petit, a la dreta (al mòbil, a sota de l'import; `avis-v878529`).
    - **Targetes de les llistes plegades d'entrada a tots els aparells** (`CartaLlista878518`: abans, obertes a l'ordinador; també Facturació › Factures,
      Control horari…) i els comptes de Bancs (abans, obert si n'hi havia un). Les proves d'abans continuen amb la marca `cartes-prova-v878518`.
    - **Cobrades i Pagades (últims 90 dies)** (`cobradesItems878529`, `pagadesItems878529`, `FetsCaixa878529`): una targeta plegada a Per cobrar i a Per
      pagar; tocar-ne una la torna a pendent (pregunta). **«Ajustos»** (plegat): els dies de cobrament o de pagament de sèrie (abans, solts a baix).
    - **Previsió per mesos** (`previsioMesos` de `src/caixa.js`; de sèrie 6 mesos; també 3 o 12, o «Per setmanes» 4, 8, 13 o 26): es desa a
      `aco_caixa_v878521.prev529 = {per, n}`; «D'aquí a 6 mesos», «Mes a mes» i la gràfica amb el mes. Els avisos de l'Inici continuen per setmanes.
    - **Quins comptes compten** (amb 2 o més comptes del banc): xips amb casella a la previsió (`aco_caixa_v878521.fora529`, els que no compten).
    - **Previsió sense «Importar l'extracte del banc»** (només a Bancs). A **Bancs**, la línia dels formats: Norma 43, Excel o CSV (el PDF no).
    - **Venciment a «Fer factura»** (factura de l'obra, `FerFactura878297`, i d'honoraris de l'encàrrec i des de les hores): «Venciment (cobrament
      previst)», de sèrie la data + els dies de cobrament; es desa com a `avisCobr878496.data` (l'avís de cobrament i Per cobrar el fan servir).
    - **Inici:** la rajola «Més» de sèrie passa a ser **«Caixa i bancs»** (`iniciDefecte878508`; el «Més» ja és a la barra de baix; a l'ordinador, també
      en lloc de «Rendiment»). Qui ja s'havia triat les rajoles a Ajustos, les manté.
    - Prova: `v529test.mjs` (18). Adaptades `v521test` (l'avís a part; «Per setmanes» per veure les 13 setmanes), `v484test`, `v507test` i `v508test` (la
      rajola «Caixa i bancs»; el «Més», a la barra de baix) i `v412test` (des de la V87.451 el total és a la línia de la targeta).
  - **V87.530 · La barra fixa de dalt** (l'Héctor, 6/11/2026: «quan fas scroll abaix ja no saps en quina pestanya estàs… hauria de quedar fixe
    a dalt»; `src/theme-v878531.css`): `BarraFixa878530({items:[[k, icona, nom, sub]], actiu, onTria, nom, nivell})`, just després de les rajoles
    de Caixa i bancs, Control horari, Honoraris de l'expedient i l'obra (`nivell="obra"`). Mira les rajoles (l'element d'abans) en baixar i, quan
    surten per dalt, ensenya una barra petita amb les mateixes opcions i la que és oberta, marcada; tocar-ne una la tria i torna a dalt (a l'obra, fa
    el mateix que tocar la rajola: obre els seus apartats). No ocupa lloc (`height:0`, sticky; el `gap` del contenidor es compensa amb un marge
    negatiu). Al mòbil, a 53 px; a l'ordinador, a 0. La de l'obra posa la seva alçada a `--obra-bar-h` i `--fixa-obra-v878530` (les capçaleres fixes de
    dins de l'obra queden a sota; en sortir, `--obra-bar-h` torna a 0) i les altres a `--fixa-h-v878530` (i van a sota de la de l'obra). Al mòbil, a
    la de l'obra les rajoles que no són on som només porten la icona; a les altres, la icona a sobre del nom. Prova: `v530test.mjs` (18). Adaptades `menustest` (a l'iPad, la capçalera del pressupost va a sota de la barra fixa de l'obra) i `v518test` (des de la V87.529 les targetes de les llistes surten plegades també a l'ordinador).
  - **V87.531 · Arxivar un pressupost sobrant a Documents** (l'Héctor, 6/11/2026: els pressupostos que sobren, «arxivar-los a Documents ›
    Pressupostos»; `src/theme-v878532.css`): a la barra de fases, «Fases» › **«Arxivar «{fase}» a Documents»** (no el principal; només amb més d'una
    fase). Pregunta abans; si la fase té certificacions, no es pot. El document del pressupost (`budgetPrintDoc878179`, com «Guardar a Documents»)
    va a Documents › pressupost d'obra (`carpetaDe878408(…, "03_AMIDAMENTS_PRESSUPOST_OBRA")`) amb el nom «Pressupost arxivat · número · nom»
    (`arxiu878531` = la fase), la fase porta `budgetGroups[].arxivat878531 = {at, doc}` i el pressupost actiu passa al principal. **Les partides no
    s'esborren.** Una fase arxivada no surt a la barra (`fasesObra878342`, `arxIds878531`) ni suma (`altIds878437`, com les alternatives). El document el fa
    el Pressupost (`window.__acoDocPres878531`); si s'arxiva des d'un altre apartat, l'Obra va al Pressupost i l'arxiva en obrir-se
    (`__acoArxivaPend878531`, `__acoArxivaFi878531`). A sota del menú, **«Arxivats»** amb «Recuperar «{fase}»» (la torna a les fases i la deixa triada).
    Prova: `v531test.mjs` (14).
  - **V87.532 · El pressupost es diu pel seu número** (l'Héctor, 6/11/2026, amb captures del mòbil: «el número l'has de posar directe on posa pressupost
    principal, no només en entrar a dins… és el nom del pressupost, el vull així directe, i per canviar-lo no pot estar a Fases perquè no s'entén que estigui
    allà»; `src/theme-v878533.css`):
    - **El nom que es veu** (`nomPres878532(d, bid)`, `nomPresDe878532(num, g)`): a la barra de fases i a la línia de la targeta del pressupost, el número
      (2026_0003_V01); si el pressupost té un nom propi, «2026_0003_V02 · Opció B»; sense número, el nom com abans. Els menús de «Fases» (alternativa,
      arxivar, eliminar, recuperar) també. El nom de sempre va a `data-nom` (botons de la barra i `.t` de la línia de la targeta) per a les proves.
    - **Canviar el nom**, només des del pressupost («Canviar el nom o el número», a dins de la targeta): fora «Canviar el nom de «…»» del menú «Fases». A
      dins de la targeta ja no es repeteixen el número i el nom (`id-pres-v878528.sol-v878532`).
    - **Amb el color de l'empresa** (la marca torna a escriure els blaus): el botó «Fases» obert quedava tot del color, sense text (el «:hover» que es queda
      enganxat al mòbil li posava el text del mateix color), i la fletxa i la icona de la targeta oberta no es veien (la marca torna a escriure els blaus amb «!important» al final: les regles noves hi guanyen per especificitat). Ara el text, la fletxa i la icona, sempre blancs. Eina `cap532.mjs` (captures amb el vermell i el «Visual nou»).
    - **Inici en rajoles sense «Sortir»** (l'Héctor: «la gent es confon i surt de l'app… ja hi és al menú general»): fora el botó petit de baix
      (`sortir-v878484`); per sortir, el menú.
    - Adaptades `v484test` (sense «Sortir»), `v528test`, `pressuposttest` (el nom es canvia des del pressupost), `v437test`, `v531test`, `fases342test`, `pdfpressuposttest` i `v427test` (llegeixen
      `data-nom`).
  - **V87.533 · El banc de preus: l'IPC sol, per capítols i al núvol per als comptes de demostració i de prova** (l'Héctor, 6/11/2026: la Base de preus de la
    construcció Girona 2023 v2 del CATGI —a `D:\00_CUBERO\00_FEINA\08_BANC DE PREUS`; els tres arxius són la mateixa base, 13.228 partides, 11.133 amb
    descompost, 1.899 capítols— «són del 2023 i s'han d'actualitzar automàticament a l'any vigent»; «si ocupa molt, l'app no la pot anar a buscar al
    núvol?»; per a les demos, «que vegi tothom les possibilitats»; **llicència:** l'Héctor ha escrit al CATGI el 6/11/2026 per demanar permís i preu; fins
    que respongui, la base només al seu compte i als comptes de demostració i de prova (l'Héctor: «també, que són demos… no paguen encara»; avisat que el client de prova la té ell sol) —repartir-la a les empreses, sencera, per capítols o sense dir d'on surt, no—;
    `src/theme-v878534.css`):
    - **IPC sol** (`src/ipc.js`: índex general nacional base 2021 de l'INE, sèrie IPC251852, del 2018 al 2025; el 2026 s'enllaça amb la variació anual
      oficial de la base 2025, sèrie IPC290750: índex(2026-m) = índex(2025-m) × (1 + v/100); **cada mes cal afegir la variació nova a `VAR_2026`**;
      `ipcPct(any, mes)`, `ULTIM_IPC`). Del gener de l'any del banc a l'últim mes publicat (gener 2023 → octubre 2026: +14,1 %). `pctBanc878533(b)`,
      `etBanc878533(b)` («Banc 2023 + IPC 14,1 %» a l'origen del preu), `textPctBanc878533`. Si s'escriu un % a mà (`pctMa`; els bancs d'abans amb un %
      escrit, també), mana aquest; buidar el camp torna a l'IPC. Fora l'enllaç «Calcular l'IPC (INE)».
    - **L'any del banc**, el del nom si en porta («… GIRONA 2023 v2»: les dates de l'arxiu són de quan es va editar, 2025).
    - **Per capítols** (`llegirBancBc3` torna `caps = {codi: {nom, pare}}` i cada partida porta `cap`; l'arrel «##» no compta): a la targeta del banc
      (Llibreria de preus i Ajustos › Preus i marges), «La base per capítols» (`NavegaBanc878533`, `CapBanc878533`, `PartBanc878533`): els capítols
      plegats amb quantes partides (es dibuixen en obrir-se), cada partida amb el preu posat al dia i, en tocar-la, el preu del banc i el posat al dia, la
      descripció i el descompost; cercador sense accents (les 60 primeres).
    - **Banc comú al núvol, comprimit i amb «Qui el veu»** (`supabase/aco_banc_comu_v878533.sql`, **l'ha d'executar l'Héctor**; substitueix el de la
      V87.460): `dades_gz` (gzip en base64 de `{partides, caps}`, uns 2-3 MB; `gz64`/`ungz64` de `cloudSync.js` amb CompressionStream) i `comptes`
      (patrons «like»: `DEMO878533` = `{'demo-%@…','prova-%@…'}` = els comptes de demostració i de prova; null = tots; el compte de l'Héctor el veu sempre; ho fa
      complir la regla del servidor). Cada aparell el baixa un sol cop. A la targeta del banc del compte de l'Héctor: «Compartir amb els comptes de
      demostració i de prova» i «Compartir amb tots els comptes»; un cop compartit, «Obrir-lo a tots els comptes» / «Només als comptes de demostració i de prova». La base arriba sola als comptes que comencen per «demo-» o «prova-» (els que crea l'Héctor per als clients són «demo-…»).
    - **Llista d'obres al mòbil:** la data de creació, petita i a la dreta de l'estat (`data-v878533`; l'Héctor: «per veure l'ordre lògic… que no sigui el
      més destacat»).
    - **Proves:** les d'abans porten la marca `ipc-prova-v878533` (sense l'IPC sol: els seus preus esperats són els del banc; la posa l'ajuda de les proves si
      la pàgina no té `sessionStorage.__ipcNoTocar`). `ipc533unit.mjs` (10, sense navegador) i `v533test.mjs` (15). El Supabase de proves fa complir
      `comptes`. Adaptades `v460test` i `pressupost372test` (sense l'enllaç de l'INE; el banc comú comprimit) i `v459test`, `v476test` i `v478test` (des de la V87.486 el pressupost buit té la rajola «Amb IA», no «Fer el pressupost amb IA»).
  - **V87.534 · «Des de Preus» i «A mà» amb el banc de preus, el capítol en un desplegable que es filtra, un sol «Opcions» editant, «El meu
    encàrrec» amb desplegable i el nom del menú** (l'Héctor, 6/11/2026, amb captures: «la base de preus… són preus que ha trobat d'altres partides
    més usades, però no del banc de preus»; «els capítols així no és pràctic amb el cursor… un desplegable o que pugui posar alguna lletra i filtri»;
    «simplifiquem conceptes… afegir i eines no poden estar englobats en opcions?»; «el meu encàrrec no ho fa»; «posa APP CONTROL D'OBRES i no puc
    canviar el nom al del meu despatx»; `src/theme-v878535.css`):
    - **«Des de Preus»** (`AfegirLlibreria878361`): dues fonts, **Preus** (la llibreria i els habituals del client) i **Banc de preus** (`fonts-v878534`;
      amb la llibreria buida s'obre al banc). Al banc: cercador per paraules sense accents (`nrm878533`), el capítol triat inclou els de dins, i cada
      partida amb el preu posat al dia (IPC) i els marges de l'obra (`partidaBanc878534(p, banc, mg, q)`: `margesLinia878378` amb la font «banc»; la
      crida passa `marges={margesObra878378(data)}`). Triada, si la quantitat fa saltar el mínim de mà d'obra, ho diu («Amb 1 m²: … · mínim 4 h»,
      `preu-q-v878534`). En afegir-la: descompost, `origenPreu878368` «Banc 2023 + IPC 14,1 % · codi · …», `tipus:"Banc"`, `bancCodi878534` (per a «Ja
      hi és») i sense `libraryItemId`. Buscant a Preus sense resultats: «N’hi ha N al banc de preus · Veure-les».
    - **El capítol, en un desplegable que es filtra** (`TriaCap878534`, també a Preus): un botó «Capítol: …» que obre a sota el cercador i la llista;
      sense escriure, un nivell amb › per entrar-hi i «‹» per tornar, «Tot «…»» i quantes partides; escrivint, tots els que hi coincideixen amb el camí.
      Esc o tocar fora el tanquen. L'arbre del banc, `idxBanc878534` (també el fa servir «La base per capítols»).
    - **«A mà»** del pressupost buit: comença el pressupost i obre el cercador («Busca a la base de preus o escriu-les tu mateix»).
    - **Editant el pressupost, un sol «Opcions»** (`opcions-edita-v878534`): Afegir (Des de Preus, Pressupost amb IA…) · Partides (Seleccionar partides) ·
      Eines (`eines534`). Les proves d'abans porten la marca `opcions-edita-prova-v878534` (els tres botons d'abans; la posa l'ajuda de les proves si
      la pàgina no té `sessionStorage.__opcionsNoTocar`).
    - **«El meu encàrrec» a l'ordinador** (obres que no són un encàrrec tècnic, on només té Honoraris): en passar-hi el ratolí, desplegable amb Hores ·
      Despeses · Factures (`subs534`, `pickSub534`); cadascuna obre Honoraris a la seva pestanya (`window.__acoHonSub878410` i l'event
      `aco-hon-sub-534`). Al mòbil, com abans.
    - **El banc comú també als comptes de tècnic** (`syncBancComu878460` ja no demana el mòdul d'obra).
    - **Nom del menú** (`nomMenu878534`): Ajustos › Imatge de l'empresa › «Nom que surt al menú» (`aco_marca_v878351.nom`); si és buit i hi ha logo, el
      de l'empresa o, al compte de l'Héctor, el de l'emissor dels documents (Ajustos › Documents).
    - **Pendent (V87.535, l'Héctor):** el banc de preus propi, que comença buit i s'omple amb les partides que es canvien en un pressupost (descripció,
      preu, rendiments): en desar-les, l'app pregunta si es guarden al banc propi, al capítol que tenien a la base general; a «Des de Preus», la base
      general i la pròpia.
    - Prova: `v534test.mjs`. Adaptades `v486test` («A mà» obre el cercador), `v492test` («El meu encàrrec» a l'ordinador) i `habitualstest` (el
      desplegable de capítols). Eina nova `guia534.mjs` (captures de la guia pràctica, `D:/aco-tmp/guia534`).
  - **V87.535 · El banc de preus com al Presto i el material del parte amb el preu per unitat** (l'Héctor, 7/11/2026: «el banc de preus funciona
    fatal… no surten tots els capítols, quan he triat… no puc tirar enrere… no trobava la manera de retornar a les simples… quan està creat i vull
    modificar la partida m'hauria de deixar anar a buscar el banc, i quan afegeixo capítols i noves partides igual… hi havia ancorat un text al mig de
    la pantalla»; «la idea és que funcioni com un Presto: tu crees capítol i vas escollint partides que les vas important al teu pressupost… i després
    dins cada partida l'has de poder editar»; del material del parte: «no et deixa posar tantes unitats a tant el preu ut»; `src/theme-v878536.css`):
    - **El desplegable de capítols** (`TriaCap878534`): els capítols sense cap partida no surten (a la base de Girona, 668, i tota la branca «Preus
      simples», que són recursos i no partides); en tornar-lo a obrir, a dalt el camí («‹ Tots els capítols › PARTIDES COMPLEXES › …», `cami-v878535`)
      per pujar a qualsevol nivell; una creu al botó (`treu-v878535`) per treure el capítol triat; el botó diu el camí del capítol; els noms llargs
      passen a la línia de sota (es trepitjaven amb el número); buscant, fins a 150 i «N’hi ha N més».
    - **El text enganxat al mig de la pantalla** era la barra «1 triades · … · Afegir 1 partida» de «Des de Preus»: al mòbil i l'iPad cada finestra
      deixa 110 px a baix i la barra fixa s'hi aturava, amb la llista passant-hi per sota. En aquesta finestra ja no hi ha aquell marge.
    - **Com al Presto:** editant el pressupost, cada capítol té **«Del banc o de Preus»** (`obreLib535`: la finestra s'obre amb el capítol de destí ja
      triat, `desti`, i les partides hi van sense triar-lo per partida; el títol diu «Afegir partides a «…»») i **«Partida en blanc»**; el «⋯» del capítol
      també té «Afegir del banc o de Preus». **«Nou capítol»** (`NouCapitol535`, `creaCap535`): el número següent, el nom (o el d'un capítol del banc, que
      l'omple sol) i **«Crear i afegir-hi partides»**, que obre el banc ja en aquell capítol (`capBanc0`), o «Crear-lo buit». Al portal de client, com abans.
    - **Canviar una partida per una del banc** (`canviaBanc535`, `posaCanvi535`): a la fitxa de la partida, editant, «Canviar per una del banc» (no a les
      partides certificades): la finestra en mode `una` (es tria una sola partida, «Posar aquesta partida» i el preu nou) canvia el concepte, la descripció,
      la unitat, el preu, el descompost i d'on surt el preu; la quantitat, el codi i el capítol es queden. Es desa amb «Guardar canvis».
    - **Material del parte** (`posaM`): cada línia amb Quantitat · Unitat · **Preu per unitat** · Proveïdor · Import sense IVA, amb el nom a sobre de cada
      camp; amb el preu per unitat, l'import es calcula (q × preu); si s'escriu l'import directament, el preu per unitat es treu. A Despeses, la nota diu
      «1000 Ud × 4,20 €».
    - Al nom del banc, fora el «- (Codi Estructur» que porta l'arxiu de Girona.
    - Prova: `v535test.mjs` (ordinador i mòbil: nou capítol amb el nom del banc, banc al capítol de destí, la barra arran de baix, la creu, de les complexes
      a les simples, el botó del capítol, canviar una partida i desar). Eina `cap535.mjs` (captures amb la base de Girona de debò, llegida de la seva carpeta).
      Adaptades `v534test` (el camí en lloc de «‹»), `pressupost320test` (el «⋯» del capítol) i `v489test` (el camp de l'import).
  - **V87.536 · L'Inici B a l'ordinador i l'iPad** (proposta del 6/11/2026, maquetes a `D:/aco-tmp/inici534`; l'Héctor, 7/11/2026: «fes-me la versió nova
    amb la pantalla d'inici modificada, l'opció B… a veure com queda, si no ja tirarem enrere»; `src/theme-v878537.css`):
    - **On:** als comptes amb l'Inici en rajoles (`iniciRajoles878508`), a partir de 768 px (`useAmple878536`): l'ordinador i l'iPad. Al mòbil, les rajoles de sempre.
      `IniciMenu878484` fa servir `IniciB878536`; les rajoles es fan amb `rajoles536(treu)` (les dues pantalles).
    - **A dalt:** «Bon dia, {nom} · el dia» i **el dia en una frase** («Avui tens 1 cita i 1 feina vençuda.»: les cites d'avui, els avisos urgents —`tone:"bad"`—,
      la resta d'avisos com a «coses per revisar» i les feines vençudes; sense res, «Avui no tens res pendent.»), amb «Nova obra / Nou expedient».
    - **Els avisos en targetes** (els mateixos de Pendent i les feines vençudes; com a molt 5): la icona del tipus (`ICONA_AVIS878536`), el color, el text i un botó
      (Validar, Fer-la, Revisar, Veure, Obrir) que porta a l'apartat; «Veure-ho tot (N)» obre Pendent. Sense res: «Tot al dia».
    - **Obres en curs** (constructora i gestió total: les obres en execució amb la foto o les inicials i el % certificat; tècnic: «Expedients en curs», els oberts
      treballats fa menys, amb l'estat), com a molt 4, i «Veure-les totes (N)».
    - **«Avui»** al costat (a l'iPad, just després dels avisos): les cites d'avui i les tres pròximes, i «Agenda».
    - **Les rajoles** de sempre a sota, en una línia cada una (icona · nom · número), sense «Pendent» (ja hi és a dalt). Es trien a Ajustos › Accessos ràpids.
    - **Per tornar enrere** n'hi ha prou de desfer aquesta versió. Les proves d'abans porten la marca `inici-rajoles-prova-v878536` (l'Inici en rajoles).
    - Prova: `v536test.mjs` (12: constructora a l'ordinador, iPad i mòbil, tècnic). Passen `v508test` i `v484test`.
  - **V87.537 · «La meva base»: el banc de preus propi** (l'Héctor, 6/11/2026: «la base pròpia la vull a 0 i l'aniré creant a mesura que guardi partides
    modificades… si modifico alguna cosa de la partida (descripció, preu o rendiments) que en guardar els canvis em posi un avís per desar-la al banc de
    preus propi… amb el capítol original de la base general, però només amb aquelles que jo vagi incorporant»; `src/theme-v878538.css`):
    - **On es desa:** al compte, `aco_meva_base_v878537 = {partides:[{codi, cap, concepte, desc, ut, pu, descompost, descompostTable, banc, at}], caps:{codi:{nom,
      pare}}}` (`mevaBase878537`, `desaMevaBase878537`, event `aco-meva-base`). Comença buida. Els preus són de venda, com els de Preus: no s'hi torna a posar
      ni l'IPC ni els marges.
    - **En guardar el pressupost** («Guardar canvis», `guarda537`): si hi ha partides canviades (concepte, descripció, unitat, preu o descompost) des que es
      va obrir l'edició, o noves tocades des que es van afegir (del banc, de Preus o de la meva base; `orig878537` = com eren en afegir-les, `ambOrig878537`),
      o fetes a mà amb preu, surt **«Desar a la meva base?»** (`DesarMeva878537`, `perDesar878537`) amb cada una marcada: «Desar-ne N i guardar» o «Guardar
      sense desar-les». No pregunta per les que ja són iguals a la meva base, ni al portal de client, al pressupost ràpid o al treballador.
    - **El capítol** (`desaAMeva878537`): les del banc, amb el seu codi i el capítol original del banc (i els de sobre); les fetes a mà, amb un codi P0001… i
      el nom del capítol del pressupost. La partida del pressupost queda lligada (`mevaCodi878537`): la propera vegada s'actualitza la mateixa.
    - **«Des de Preus»:** una tercera font, **«La meva base»** (amb quantes n'hi ha; només si n'hi ha alguna), amb el desplegable dels seus capítols; la
      partida entra al preu desat (`itemMeva878537`, `tipus:"La meva base"`). També per «Canviar per una del banc». Amb Preus buit, s'obre a la meva base.
    - **Preus automàtics** (`preusAmidaments878368`: amidaments, dictat, «Buscar preus»): la meva base va per davant de Preus i del banc (font «La meva base»).
    - **La targeta «La meva base»** (`MevaBaseBloc878537`) a Llibreria de preus i a Ajustos › Preus i marges: per capítols, amb un cercador i «Treure».
    - Prova: `v537test.mjs` (17: partida del banc sense tocar, canviar-ne el preu i desar-la, sense canvis, feta a mà, la font a «Des de Preus», la targeta i
      «Treure», mòbil amb «Guardar sense desar-les»).
      Les proves d'abans porten la marca `meva-base-prova-v878537` (guarden sense la pregunta).
  - **V87.538 · L'Inici B, segona volta, el temps a les obres i la partida sense lliscar** (l'Héctor, 7/11/2026, amb una captura de l'Inici B a
    l'ordinador: «val la pena tenir menú a l'esquerra i les rajoles?… donaria més rellevància a les obres en curs… avisos i feines pendents amb targetes
    desplegables, l'agenda al costat… i el temps que farà a les obres on estàs treballant»; «el desplegable de la partida pot ser més compacte per no tenir de
    fer scroll»; «i al mòbil… el temps a les obres en execució en una rajola? un enllaç podria ser Windguru»; `src/theme-v878539.css`):
    - **Inici a l'ordinador i l'iPad** (`IniciB878536`, classe `v878538`): la frase del dia; a dalt, **«Obres en curs»** (o «Expedients en curs» amb l'estat al
      tècnic; com a molt 6, la treballada fa menys primer, amb el % certificat i una xapa «N pendents»); a sota, **Avisos** i **Feines pendents** en targetes
      plegables (`CardOPlega878369 bloc426`, amb quants n'hi ha); a la dreta, **«Avui»** (les cites) i **«El temps a les obres»**. **A l'ordinador, sense
      rajoles** (el menú de l'esquerra ja hi és); a l'iPad, tot en una columna i les rajoles a baix (sense Pendent ni El temps, que ja hi són).
    - **El temps** (`tempsPoblacio878538`, `useTempsObres878538`, `TempsObres878538`, `DiesTemps878538`): les poblacions de les obres en curs
      (`obresEnCurs878538`, com a molt 4) amb 5 dies (icona del codi WMO, `iconaTemps878538`; màxima; probabilitat de pluja; els dies amb ≥50 % en blau) i
      «Dilluns plourà a Palamós (80 %)» si plou en els 3 primers dies (≥60 %). Dades d'**Open-Meteo** (cercador de poblacions + previsió, sense clau), desades
      a l'aparell 3 hores (`temps-v878538` al localStorage de debò). **Compte: Open-Meteo és gratuït per a ús no comercial;** abans de vendre l'app, el seu pla de
      pagament o l'AEMET. Cada població porta **«Windy»** (`a.windy-v878538`, `https://www.windy.com/<lat>/<lon>?<lat>,<lon>,11`, en una pestanya nova):
      Windguru no té enllaç obert per coordenades i Meteocat demana el codi de municipi, que l'app no té. Proves: `window.__acoTempsMock878538`.
    - **Al mòbil, la rajola «El temps»** (`RajolaTemps878538`, `temps` a `RAJOLES878508` i al final d'`iniciDefecte878508`; a tota l'amplada, `ample-v878538`):
      el primer poble amb els 5 dies i, si en plourà, on; en tocar-la, la pantalla «El temps a les obres» (`obert==="temps"`) amb totes les poblacions i Windy.
      Qui ja s'havia triat les rajoles a Ajustos, la pot afegir des d'Accessos ràpids.
    - **La partida a pantalla gran a l'ordinador** (≥1100 px amb ratolí): en dues columnes, els camps i la descripció a l'esquerra i el descompost a la dreta,
      sense haver de lliscar.
    - Prova: `v538test.mjs` (17; substitueix `v536test`). Adaptades `v508test`, `v484test`, `v507test` i `v455test` (la rajola «El temps» a la llista).
  - **Proposta de la constructora al mòbil, per validar** (l'Héctor, 3/11/2026 a la nit, després d'estar amb un constructor: «un que no domini les apps
    és complex fer el seu dia a dia»; maquetes enviades al xat, `scratchpad/inici482/v2`): 1) l'Inici com a menú en rajoles iguals (Pendent = avisos i
    feines junts, Obres, Agenda, Hores, Despeses, Facturació) i la barra de baix per fer coses (Inici · Parte · Foto · Nota · Més; fora de l'obra pregunta
    l'obra); 2) dins de l'obra, quatre rajoles (Fitxa · Dia a dia —en lloc de «Seguiment»— · Pressupost · Comptabilitat) amb la llista dels seus apartats a
    sota, sense el ＋; 3) pressupost buit en tres rajoles (Importar un arxiu · Amb IA · A mà); 4) **parte senzill** (personal amb hores, material, nota i
    fotos; partides opcionals) que **no depengui del pressupost** (avui, sense pressupost, «Partes d'obra» diu «Aquesta obra encara no té pressupost» i
    no es pot fer); 5) «Preus» fora del menú de la constructora (els preus surten sols de les obres anteriors) i passar a la IA els preus propis semblants.
    **Esperant el sí de l'Héctor a cada punt.**
  - **Proposta dels encàrrecs tècnics** (l'Héctor, 30/10/2026: «hem de fer un gir de volta a encàrrecs de tècnics com cèdules, energètics i
    amiants o d'altres informes… fes-me propostes en captura sense penjar-m'ho i amb un informe»): https://claude.ai/artifact/3ubYp6XdySSVzHcFWDy1ck
    (maquetes a `D:/aco-tmp/proposta-encarrecs`, `fes-informe.mjs`). A: bloc «Encàrrec» propi (on som, «Ara toca», Immoble amb el Cadastre,
    documents, tràmit, lliurament i venciment); B: fitxa de visita per a cada tipus (cèdula amb peces i superfície útil, CEE per al CE3X, amiant
    amb l'inventari, ITE amb les deficiències); C: el document final el fa l'app; D: «Informe tècnic» amb tipus i apartats; E: Inici per moments
    i venciments. L'Héctor hi va donar el sí el 30/10/2026 («revisa-ho treball per treball i ves penjant version»), començant pel CEE (V87.441). Falten les seves respostes: mínims de la cèdula, camps del CE3X, model d'amiant, tipus d'informes i terminis.
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
    - **Vídeos per a constructores** (30/10/2026, V87.448; l'Héctor: «els vídeos en la versió de la constructora», sense veu, en català i castellà): pàgina
      https://claude.ai/artifact/1kVhNCfg8JbsT7mTk5TFGy (12 lliçons: 01–03 i 21–29; botons Català / Castellano, `#es` obre el castellà; **privada fins que l'Héctor la comparteix**). `guia404.mjs` amb
      `IDIOMA=es` (textos a `guia404-es.mjs`, captures a `D:/aco-tmp/guia-es`, vídeos a `GUIES_USUARIS/VIDEOS/castella`). A `tools/proves/videos-pagina/`: `mp4-constructora/ca|es`,
      `poster-constructora/ca|es` (`portades.mjs` amb `MP4=` i `POST=`), `plantilla-constructora.html`, `urls-constructora.json`, `posters-constructora.json` i `VERSIO=V87.448 node fes-constructora.mjs`. Per
      canviar un vídeo: pujar el nou com a asset de la pàgina, posar-ne l'adreça als JSON, generar i tornar a publicar `videos-constructora.html` amb la mateixa `url`.
    - **Guia pràctica per a clients:** `GUIES_USUARIS/Guia-practica-constructores.pdf` i `Guia-practica-constructores-castella.pdf` (5 pàgines amb captures), fets amb l'Edge
      (`--print-to-pdf`, `--allow-file-access-from-files`, `--no-pdf-header-footer`) des de `D:/aco-tmp/guia-textos/guia-pdf.html` i `guia-pdf-es.html`; sense imatges a Claude Docs:
      https://claude.ai/artifact/BXGJFqiY13PomS6BK8eByB. `tools/proves/mirapdf.mjs` (`PDF=`, `OUT=`): fa imatges de les pàgines d'un PDF per mirar-lo.
    - **Paquet per als clients** (30/10/2026; l'Héctor va compartir la pàgina i demanava entrar a Claude: «i si no tenen… simplement descarregar tots junts i ja ho envio jo per WhatsApp o Gmail»):
      `GUIES_USUARIS/Control-Obres-videos-i-guia-catala.zip` i `Control-Obres-videos-y-guia-castellano.zip` (47 MB cadascun, sense comprimir: els 12 vídeos numerats de l'01 al 12 amb el seu títol i `00 Guia practica.pdf`).
      **La pàgina dels vídeos de claude.ai és només per a l'Héctor: als clients no se'ls passa** (demana compte de Claude). Les guies PDF ja no porten cap enllaç («Aquesta guia va amb 12 vídeos curts…»). `GUIES_USUARIS/ZIP_PER_PARTS/`: els mateixos en 3 ZIP per idioma (11–22 MB, per al Gmail, que admet 25 MB, i per enviar-los al mòbil de l'Héctor, on el límit és de 30 MB; la guia va a la part 1). **Per passar-ho als clients, el més fàcil:** la carpeta del Google Drive de l'Héctor `G:\Mi unidad\Control Obres - Videos i guia` (`Catala` i `Castellano`: els 12 vídeos i la guia, sense ZIP); l'enllaç de la carpeta amb «Qualsevol persona que tingui l'enllaç» s'obre sense compte. Si canvia un vídeo, refer els ZIP i la carpeta.
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

## Versions noves (des de la V87.539)
- **V87.539 · El pressupost només amb descripcions i el total** (encàrrec de l'Héctor del 6/11/2026: presentar el pressupost només
  amb les descripcions i el preu total, per a empreses petites). A «Imprimir» del pressupost, «PDF només amb descripcions i total»
  (`.pdf-desc-v878539`; no surt al portal del client): el mateix document (`budgetPrintDoc878179` amb `nomesDesc878539:true`, que
  `pressupostObraPrintHtml878153` llegeix com a `nd539`) amb una taula de dues columnes (Part. i Concepte / descripció, amb la
  descripció llarga i l'etiqueta de fora de pressupost), els capítols sense import i a l'esquerra, sense el resum per capítols i amb un
  sol «TOTAL PRESSUPOST» (amb les DG i el BI sumats si els marges van al resum). Des del visor s'envia, es descarrega i s'imprimeix com
  qualsevol PDF. Prova: `v539test.mjs` (ordinador i mòbil; el total és el mateix que el del PDF sencer).
- **V87.540 · Enviar a diversos contactes** (encàrrec de l'Héctor del 6/11/2026: «enviar qualsevol PDF per correu i WhatsApp amb un
  desplegable de Contactes per triar-ne diversos»). A la finestra «Enviar» (`EmailModal`, la de tots els documents i PDF), sota «Per a»,
  «Afegir de Contactes» (`.afegeix-ct-v878540`) obre la llista de Contactes (`FinestraContactes878436` amb `multi` i `triats`: cercador,
  grups, el correu i el mòbil de cada un). Cada contacte tocat s'afegeix a «Per a» marcat; si ja hi era (pel nom o el correu), es
  desmarca; la llista es queda oberta fins a «Fet (N)». **Arreglat:** «Enviar» des del visor d'un document obria la finestra a sota del
  visor i no es veia (`.modal-backdrop:has(.correu-v878405){z-index:110}`). Prova: `v540test.mjs` (ordinador i mòbil).
- **V87.541 · El temps amb el número del dia** (l'Héctor, 9/11/2026, amb la captura de l'Inici de Brava: «per què marca el dijous si avui
  som dilluns i per què no surt el número del dia del mes»). El dijous era el dia de pluja (fons blau `.dia.pluja`), que semblava el dia
  triat. Ara (`DiesTemps878538`, `src/theme-v878541.css`): cada dia porta el número («Avui 9», «Dt 10»…); el fons és per al dia d'avui
  (`.avui-v878541`, comparat amb la data de debò: la previsió es desa 3 h i el primer dia podia ser ahir, que ara no surt); la pluja,
  només la icona i el % en blau. Igual a l'Inici de l'ordinador i l'iPad, a la rajola del mòbil i a «El temps a les obres». Prova:
  `v541test.mjs`.
- **V87.542 · El dia de pluja sense fons, també amb el color de l'empresa** (l'Héctor, 9/11/2026, amb la captura de Brava després de la 541: el dijous
  encara tenia fons). Amb un color d'empresa (`aplicaMarca878351`), cada regla amb un blau es repeteix amb `!important` en el color de l'empresa:
  el blau clar de `.dia.pluja` (de la 539) tornava a sortir en el gris de Brava i guanyava a la regla de la 541. Ara: fora els fons de la pluja de
  `theme-v878539.css`, i `NO_MARCA878351` deixa la pluja sempre en blau (`pluja`, el % de `.temps-b-v878538 .dia em`). `v541test.mjs` té una passada
  amb el color d'empresa gris.
- **V87.543 · La base de preus del CATGI també als comptes de la prova pilot** (l'Héctor, 9/11/2026: «Brava i Socoterm així com Oriol i Martí també
  són demos… són les primeres versions que vaig ensenyar de prova… he de poder tenir-la»). `DEMO878533` ara porta `PILOT878543` (brava, socoterm,
  oriol i marti @usuaris.controlobres.app) a més de demo-% i prova-%. Si ja estava compartit amb la llista d'abans, en obrir la targeta del banc al
  compte de l'Héctor la llista passa sola a la nova (`nv.posa({comptes})`, sense tornar a pujar el banc). Els textos diuen «de demostració i de la
  prova pilot». La regla del servidor no canvia (`like any (comptes)`). Adaptada `v533test.mjs` (Brava la llegeix; el compte de còpies, no; la llista
  vella passa sola a la nova).
- **V87.544 · Import que no es factura per acord amb el client** (l'Héctor, 9/11/2026, amb la captura de «Fer factura · Certificació 2»: «una targeta
  on pugui marcar una quantitat que no sigui facturada… el client o tècnic que ho comprova ha de veure-ho tot el realitzat però després si s'arriba a un
  acord com ho fem constar»). Decidit: **a la factura, no a la certificació** (la certificació es queda amb tot el que s'ha fet). A `FerFactura878297`,
  la targeta `.acord-v878544` («Import que no es factura (acord amb el client)»: casella, import sense IVA i motiu, obligatori i menor que la base); la
  base imposable = la de la certificació − l'acord. La factura desa `baseCert544` i `acord544 = {imp, motiu}`; el PDF (`proformaPrintHtml8783`) porta
  «Import certificat», la línia del motiu en negatiu i la base. La certificació compta com a facturada (per existència), i el que s'acorda no queda
  pendent. `src/theme-v878544.css`. Prova: `v544test.mjs` (mòbil i ordinador); `facturacio337test` 32/32.
- **V87.545 · «Partides sense preu» dins d'«Avisos»** (l'Héctor, 9/11/2026, amb la captura del pressupost de David Fuster: «per què surt lo de 4
  partides sense preu aquí i no a dins d'Avisos?»). Fora la barra `.sense-preu-v878480` (V87.480); `AvisosPressupost878320` accepta `accions` (un
  element per `k` d'avís, dins del `summary`) i cada avís porta la classe `av-<k>`: l'avís «N partides sense preu» (`av-preu`) porta «Buscar preus»
  (`.buscar-av-v878545`, amb `preventDefault` perquè no plegui l'avís) quan hi ha partides per buscar (`sensePreu878480`). `src/theme-v878545.css`.
  Prova: `v545test.mjs` (ordinador i mòbil). Adaptada `v480test` (la línia és l'avís).
- **V87.546 · La factura amb acord ja no surt en vermell** (l'Héctor, 9/11/2026: «per què surt en vermell quan he posat lo de descompte acordat?»). A
  la llista de certificacions, `cert-fa-v878337 mal` («La factura no coincideix amb la certificació») comparava la base de la factura, ja rebaixada,
  amb l'import certificat; ara compara `baseCert544` quan n'hi ha. `v544test` 11/11. **No fet (i dit a l'Héctor):** amagar de la factura un import
  cobrat en efectiu i repartir-lo a les partides «sense cap rastre» — la factura ha de recollir l'import real cobrat; queda el descompte pactat visible.
- **V87.547 · «Certificar el 100 %»** (el client de Socoterm, 9/11/2026, via l'Héctor: «passar un pressupost directament a factura sense fer la
  certificació… que s'entengui que llavors s'ha executat el 100 % del pressupost»). A `Cert`, `certificaTot878547`: la certificació següent del pressupost
  actiu amb tot el que queda per certificar de cada partida amb quantitat i preu (`q − certificat/pu`, amb `posaQCert878439`; les d'administració no);
  pregunta amb l'import, la marca `tot878547`, l'obre i després «Fer factura» com sempre. Un pressupost amb només el total és una partida amb aquest preu.
  Botó «100 %» a la capçalera de Certificacions (`.tot-v878547`); al mòbil no hi cap i va a baix de la llista (`.tot-cos-v878547`, ≤700 px).
  `src/theme-v878547.css`. Prova: `v547test.mjs` (8). **Pendent de parlar** (l'Héctor amb el client): «editar una factura» (ara es canvien número,
  data, IVA i client abans de crear-la; un cop feta, eliminar-la o rectificativa) i la factura directa sense obra des de Facturació.
- **V87.548 · L'acord de la factura a la vista** (l'Héctor, 9/11/2026: «la certificació 1 de David Fuster puja un import però hem facturat un altre…
  en algun moment es perd el rastre»). `.acord-fila-v878548` («acord −X €», el motiu al `title`) al costat del número de factura a la llista de
  certificacions i a la fila de la factura de Facturació de l'obra; `.acord-barra-v878548` («Factura F… amb acord: −X € · motiu») a la barra de la
  certificació facturada. `src/theme-v878548.css`. `v544test` 14/14.
- **V87.549 · Proposta B2: el resum del pressupost a l'ordinador** (l'Héctor, 9/11/2026, triada entre les propostes A, B i B2 amb captures a
  `CAPTURES\propostes-pressupost-9-11`). `ResumPres878549` (≥1281 px), abans de la targeta del pressupost: cinc xifres de `previst878410` (preu tancat
  `previst`, partides noves i imprevistos `imprevistos`, no es faran `imNoExec`, total previst `previsio`, certificat a origen `executat` amb el % i el que
  queda) i la cascada en SVG «De pressupost a obra acabada»; «Obrir el pressupost». A l'ordinador, la targeta del pressupost oberta és **a pantalla
  sencera** (`details.pres-bloc-v878427[open]` fixa) amb «Tornar a l'obra» (`.torna-v878549`) i s'hi entra sempre tancada (`presObertInici878427`). Els
  avisos ja no són una targeta a part: dins del pressupost (`.avisos-dins-v878549`) i el número a la capçalera (`.n-av-v878549`, també al mòbil).
  «Descompost del pressupost» → **«Mà d'obra i materials»**. La foto de l'obra al costat del nom a la capçalera de l'obra (`.foto-obra-v878549`, ≥768 px).
  `src/theme-v878549.css`. Prova: `v549test.mjs` (13). Adaptades `v545test` i `v411test` (el pressupost entra tancat a l'ordinador).
  **Queda:** Ajustos com a botó petit i el mateix patró a Certificacions, Factures i Despeses.
- **V87.550 · Arreglaments per a les demos** (l'Héctor, 9/11/2026, amb captures de Socoterm: «al tanto com estan les pantalles que les targetes surten
  de l'espai… no es veuen les fletxes dels desplegables… la pantalla de la modificació de la partida és molt trista… com poso preu a una partida que no
  en tinc… buscar el preu i el seu descompost estil BC3 amb IA»; «mira quina pantalla surt des d'avisos»). `src/theme-v878550.css`:
  «Buscar preus» (`.buscar-v878480 .caps label`): la casella amb la seva mida (un estil general la feia tan ampla com la fila i el nom del capítol sortia
  lletra per lletra); els filtres de la Llibreria (`.library-primary-filters-v878240`) en columnes que s'ajusten (`auto-fit`), sense sortir de la targeta ni
  tapar fletxes; la fitxa de la partida (`.fitxa-partida-v878361.fitxa-v878449`) en un requadre amb vora, radi i ombra. `FitxaPartida878361` accepta
  `onPreuIA`: «Buscar el preu amb IA» (al costat de «Fer el descompost») obre `BuscarPreus878480` amb aquella sola partida (base pròpia, banc i IA amb
  el descompost BC3; si la partida té certificacions, avisa). Prova: `v550test.mjs` (8).
- **V87.551 · Fora el resum de la V87.549; les fases en rajoles; el banc comú arriba a Socoterm** (l'Héctor, 10/11/2026: «no m'agrada gens aquesta pàgina
  i fins i tot jo mateix em vaig liar ahir amb un client… el gràfic no m'agrada gens… les opcions de les fases a dalt podrien ser rajoles… on apreto a una
  de les fases… s'obren totes les opcions… hem de simplificar processos… hi ha obrir el pressupost i a sota torno a tenir obrir el pressupost»; «surt
  Ninguno» a la Biblioteca de Socoterm). Ja no es mostra `ResumPres878549` (el codi es queda). `FasesObra878342` amb `obre` (a la pestanya Pressupost):
  a l'ordinador, rajoles (`.rajoles-v878551`, el nom sencer, l'import i el %) i tocar-ne una obre el seu pressupost a pantalla sencera (esdeveniment
  `aco-obre-pres878551`), amb totes les opcions a dins. `syncBancComu878460`: el compte de l'Héctor (no `@usuaris.controlobres.app`) posa al dia sol
  `comptes` amb la prova pilot en obrir l'app (abans només obrint la targeta del banc). `src/theme-v878551.css`. Prova: `v551test.mjs` (9; substitueix
  v549test). **Pendent (dit el 10/11):** el mateix a Certificacions, Factures i Despeses («si vull veure o fer alguna acció he de poder clicar i entrar a
  dins»); al parte del dia, altres despeses (combustible…); fases en rajoles també al mòbil.
- **V87.552 · Un sol accés al pressupost; el nom a Ajustos; la xifra del banc** (l'Héctor, 10/11/2026: «continua sobrant-me un accés al pressupost… puc
  entrar per la rajola i per la targeta»; «el nom del pressupost no és més normal poder-lo canviar a ajustos del pressupost?»; a la Biblioteca de Socoterm,
  «posa Ninguno a dalt i a dins de la targeta surt la base»). A l'ordinador, amb les fases en rajoles, la targeta tancada del pressupost no es mostra
  (`body:has(.rajoles-v878551) details.pres-bloc-v878427:not([open])`) i cada rajola porta els seus avisos (`.av-rajola-v878552`). «Canviar el nom o el
  número» surt de la targeta i és a «Ajustos del pressupost» com a «Nom i número del pressupost» (`.nom-fila-v878552`, obre `NomNum878528`). `BancBloc878465`
  escolta `aco-banc-comu` (el banc comú arriba després d'obrir la pantalla). `src/theme-v878552.css`. `v551test` 11/11.
- **V87.553 · Importar contactes d'un Excel, un CSV o un PDF** (el client de Socoterm, via l'Héctor, 9-10/11/2026: «importar excel o pdf de llistat de
  contactes i que ho llegeixi per adjuntar-ho als contactes de l'app»). A Contactes, «Importar» (`.importa-ct-v878553`) obre `ImportaContactes878553`:
  `llegeixContactes878553` llegeix l'Excel (la fila de títols, entre les 6 primeres, pels noms en català o castellà de `CAMPS_IMP878553`; sense títols, pel
  contingut amb `filaContacte878553`), el CSV (separador «;», «,» o tabulador; UTF-8 o Windows-1252) i el PDF (línia per línia amb `liniesPdf` i
  `liniaPdf878553`: només les línies amb correu, telèfon o NIF). La llista es revisa abans: els que ja hi són (NIF, correu o nom) o repetits a l'arxiu,
  desmarcats amb «Ja hi és»; el grup dels nous (o el de la columna «Tipus»). S'afegeixen amb `clientNou878406` (`importat878553`). `src/theme-v878553.css`.
  Prova: `v553test.mjs` (9: Excel amb títols, CSV amb «;», PDF, tornar a importar sense repetir, mòbil).
- **V87.554 · El cercador de la Llibreria busca també a la base de preus** (l'Héctor, 10/11/2026: «aquí el filtre només fa referència a la base de
  Socoterm? no puc buscar a la general?»). `BaseCerca878554`: el que s'escriu a «Cercar» (2 lletres o més) es busca també a «La meva base» i al banc
  (propi o comú, `bancPreus878368`), amb el preu posat al dia (`pctBanc878533`), el codi, la unitat i d'on surt; 40 a la vista (fins a 200). Només per
  consultar: al pressupost, «Des de Preus». Els filtres surten també amb la llibreria buida si hi ha base. `src/theme-v878554.css`. Prova: `v554test.mjs` (8).
