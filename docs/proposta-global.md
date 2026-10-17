# Proposta global · APP Control d’Obres

*15/10/2026 · versió de l’app: V87.266 · document de proposta: **no canvia res del codi***

**Regla principal:** l’app ha de ser pràctica, intuïtiva, moderna i fàcil per a tots els agents de l’obra (tècnic,
constructor, promotor, operari), al mòbil, a l’iPad i a l’ordinador.

**Com s’ha fet:** captures de totes les pantalles principals al mòbil (390 px), a l’iPad (820 px) i a l’ordinador
(1440 px), amb una còpia de les dades reals i el Supabase de proves. També s’han revisat el codi, les lletres, els
textos i els preus actuals de la IA. La skill oficial `frontend-design` d’Anthropic encara no està instal·lada: la
revisió segueix els seus criteris generals (una sola direcció visual, tipografia clara, coherència, res de sobrer), i
es farà servir quan es dissenyin les pantalles de debò.

---

## 0. Resum en una pàgina

| # | Què | Per què | Prioritat |
|---|-----|---------|-----------|
| A | **App al mòbil sense cobertura** (app instal·lable) | A l’obra no hi ha cobertura i avui la pàgina no carrega si no estava oberta | 🔴 Molt alta |
| B | **Navegació fixa al mòbil i l’iPad** (barra a baix + «Tornar» sempre visible) | Avui cal fer scroll amunt per trobar el menú | 🔴 Molt alta |
| C | **Idiomes: tota l’app en l’idioma de cada usuari** (català, castellà; després altres) | Hi ha usuaris castellanoparlants; fer-ho **alhora** que es modernitzen les pantalles | 🔴 Alta |
| D | **Pantalles més simples i modernes** (una sola navegació a l’obra, menys pestanyes) | Hi ha dues maneres de moure’s per l’obra, botons repetits, pantalles molt llargues | 🟠 Alta |
| E | **Codi d’expedient curt** (2026-026 · Piscina Rosello) | L’actual és massa llarg i amb lletra de màquina d’escriure | 🟠 Mitjana (va amb D) |
| F | **Ajuntar canvis per apartats** (edició alhora sense preguntar) | Dues persones a la mateixa obra en apartats diferents | 🟠 Mitjana-alta |
| G | **Albarans i factures llegits amb IA** | Estalvia teclejar; assigna la despesa a obra i partida | 🟡 Mitjana |
| H | **Pressupostos amb IA, BC3/BEDEC i fórmules** | Fer pressupostos més ràpid i importar de TCQ/Presto | 🟡 Mitjana |

Pla de versions i temps: **apartat 8**.

---

## 1. Navegació al mòbil i l’iPad

### Com està ara (vist a les captures)

- A dalt hi ha una capçalera amb el botó ☰ i «CONTROL D’OBRES», i a sota una franja blava amb «← Tornar» i el nom de
  la pantalla. **Totes dues pugen amb el scroll**: a «Treballs / Expedients», per anar a un altre lloc cal tornar a dalt
  de tot.
- Abans de veure el contingut d’una obra, el mòbil gasta **gairebé mitja pantalla** (capçalera + franja blava + fitxa de
  l’obra) i el nom de l’obra surt **dues vegades**.
- Els rètols «Núvol · al dia», «Desat a l’ordinador» i el comptador de temps **tapen el contingut** de la part de baix
  (per exemple, l’última fila de la llista o un botó).
- Hi ha títols que no coincideixen amb el menú. Per exemple, «Gestió temps» al menú es diu **«Traça»** a la franja
  blava del mòbil.
- Pantalles molt llargues al mòbil:

  | Pantalla | Llargada al mòbil |
  |---|---|
  | Configuració | 6,5 pantalles (5.400 px) |
  | Factures | 4,5 pantalles |
  | Pressupostos | 3,5 pantalles |
  | Inici | 2,5 pantalles |

- Hi ha pantalles amb molts botons a la vista: **Gestió temps 101**, **Expedients 81–89**, **Agenda 60**.

### Proposta

1. **Barra fixa a baix** (mòbil i iPad), com les apps habituals. Sempre visible, amb 4 botons i un «Més»:

   ```
   ┌───────────────────────────────────────┐
   │ ← Tornar   Projecte piscina…    ⋯     │  ← capçalera fixa i prima (1 línia)
   ├───────────────────────────────────────┤
   │                                       │
   │          (contingut de la pantalla)   │
   │                                       │
   ├───────────────────────────────────────┤
   │  🏠 Inici  📁 Obres  📅 Agenda  ⏱ Temps  ☰ Més │  ← barra fixa
   └───────────────────────────────────────┘
   ```

   - Els 4 botons canvien segons el perfil:

     | Perfil | Botons |
     |---|---|
     | Tècnic | Inici · Obres · Agenda · Temps |
     | Constructor | Inici · Obres · Albarans · Hores |
     | Promotor | Les meves obres · Documents · Avisos |

   - «Més» obre la resta: Clients, Pressupostos, Factures, Llibreria, Configuració.
2. **Capçalera fixa i prima** amb «← Tornar» **sempre visible** i el nom de la pantalla o l’obra. Una sola línia en lloc
   de les dues franges d’ara.
3. **Els rètols del núvol i el comptador** passen a ser un punt petit a la capçalera (verd = al dia, taronja = pendent,
   vermell = error) i el comptador una icona ⏱ amb els minuts. No taparan mai res.
4. **Ordinador**: es manté el menú lateral, però més estret i amb la versió i el núvol a baix de tot.
5. **«Tornar» que sap d’on vens**: torna a la llista amb el filtre i la posició on eres, no a dalt de tot.

---

## 2. Pantalles més modernes i simples

### Problemes generals

- **Dues maneres de moure’s per una obra** (és el que més confon):
  - A l’**ordinador**, la fitxa té pestanyes a dalt (Resum, Pressupost, Certificacions, Documents, Agenda, Actes,
    Tasques, Més). Però en obrir-ne una, s’obre **una altra finestra a sobre** («EDITANT L’EXPEDIENT») amb un altre
    selector «Apartat actual» i «Tancar i tornar».
  - Al **mòbil** hi ha dos botons: **«Apartats de l’obra»** (obre un quadre amb un desplegable i una explicació) i
    **«Accions»**. «Accions» només té «Tornar al llistat», que repeteix el «Tornar» de dalt, «Modificar fitxa» i
    «Eliminar expedient».
- **28 apartats possibles** dins d’una obra. Molts no es fan servir mai en un mateix tipus d’encàrrec:
  - Resum, Dades, Agents, Tasques, Agenda / Avisos, Actes, Documents, Plànols, Fotografies, Renders / Presentació…
  - Pressupost ràpid, Pressupost obra, Pressupostos, Amidaments, Industrials / Comparatius, Certificacions obra…
  - Honoraris, Factures, Facturació obra, Gestió temps, Gestió obra, Gantt, Rendiment(s)…
  - Seguretat i salut, Tràmits, Memòria / Informe / Certificat, Tancament / Entrega.
- **Botons repetits**. Per exemple, al Pressupost hi ha «Canviar nom del pressupost seleccionat», «Guardar/fixar» i
  «Renombrar amb finestra» per a la mateixa cosa. A més, cada fila de la llista d’expedients té «Eliminar» a la vista.
- **Tres lletres diferents**: «CO Sans» (bona), «CO Display» (títols) i una **lletra de màquina d’escriure** (monospace)
  per als codis d’expedient. És la «lletra antiga» que costa de llegir: surt 20 vegades a la llista d’expedients.

### Proposta per pantalla (ordenada per impacte)

| Pantalla | Què sobra | Què s’ajunta | Com quedaria |
|---|---|---|---|
| **Obra** (la més important) | La finestra «Editant l’expedient» a sobre; el quadre «Apartats de l’obra» amb explicació; «Tornar al llistat» dins d’Accions; el nom repetit | **«Apartats» + «Accions» en una sola barra**: els apartats com a pestanyes que es poden lliscar, i les accions (Modificar fitxa, Compartir, Eliminar) dins del menú ⋯ de la capçalera | Capçalera fixa: «← Obres · Projecte piscina · ⋯». A sota, una tira de pestanyes (Resum · Pressupost · Certificacions · Actes · Documents · Més). Un sol nivell, sense finestres a sobre |
| **Apartats de l’obra** | Els que no toquen al tipus d’encàrrec | Els 28 apartats en **6 grups**:<br>• **Resum** (resum, dades, agents, tasques i avisos)<br>• **Econòmic** (pressupostos, amidaments, certificacions, factures, honoraris)<br>• **Seguiment** (actes, agenda, Gantt, rendiments)<br>• **Documents** (documents, plànols, fotos, renders, memòries)<br>• **Temps**<br>• **Tancament** (tràmits, seguretat i salut, entrega) | Cada grup amb subpestanyes dins. Només es veuen els grups del tipus d’encàrrec; la resta, a «Més» |
| **Expedients** | La columna «Codi expedient» llarga; «Eliminar» a cada fila (passa al menú ⋯); el títol «Llistat professional d’expedients» | Número i nom curt en una sola columna; «Filtres i cerca» en una barra fixa | **Mòbil**: targetes d’1 línia + 1 línia petita («2026-026 · Piscina Rosello · Alba · En curs») i un cercador fix a dalt. **Ordinador**: la taula, amb menys columnes |
| **Inici** | Repeticions de xifres | Les 4 xifres en una franja | Avui: cites, tasques vençudes i les 5 obres en curs; botó «+» per afegir tasca/cita/hores |
| **Gestió temps** (101 botons) | Les explicacions llargues; el desplegable «Tots els expedients» que surt de la pantalla al mòbil | Filtres en un sol botó «Filtrar» | Gràfic i resum a dalt; llista per obra plegable |
| **Pressupost / Certificacions** | Botons repetits de canviar nom; «Origen, importació…» sempre a la vista | Les accions en un sol menú «Accions» | Total i capítols a dalt; importar i crear, dins d’«Accions» |
| **Factures, Pressupostos d’honoraris** | Seccions sempre obertes | Plegar per estat (pendents primer) | Llista curta de pendents i «Veure-ho tot» |
| **Configuració** (6,5 pantalles al mòbil) | Explicacions llargues sempre obertes | Separar en 4 seccions | «El meu compte», «Usuaris i portal», «Dades i còpies» (aquí hi van les versions guardades i l’espai), «Avançat» |
| **Agenda** | — | Vista setmana per defecte al mòbil | Botó «+» fix |

### Direcció visual (criteris de la skill `frontend-design`)

- **Una sola lletra per a tot** (CO Sans), amb xifres de la mateixa amplada per als imports. Res de lletra de màquina
  d’escriure, tampoc als codis.
- **Un sol color principal** (el blau actual), un color per a l’estat (verd, taronja, vermell) i grisos. Fora els
  degradats de les franges.
- **Botons de mida de dit** (mínim 44 px) al mòbil, i un sol botó principal per pantalla.
- **Textos curts**: un títol i, si cal, una frase; les explicacions llargues, dins d’un «?».
- Abans de programar res, es fa una **maqueta d’una pantalla** (l’Obra al mòbil) perquè la vegis i diguis sí o no.

---

## 3. Codi d’expedient

### Com és ara

`2026-026-ALT-ALBA-PROJECTEPISC` = any + número + tipus de treball + client + paraula clau. Pensat per a les carpetes de
l’ordinador. A l’app costa de llegir, ocupa molt i surt repetit:
- «Intern: 2026-026-ALT-…» a la fitxa;
- el mateix codi una altra vegada dins de la fitxa;
- una columna pròpia a la llista.

A més, ja hi ha casos on el codi i el nom no quadren (per exemple, «COBERTA CALONGE» té el codi `…-NOUEXPEDIENT`).

### Proposta

- **Codi visible a l’app**: `2026-026 · Piscina Rosello`, és a dir, any-número + **nom curt** de l’obra.
  - El nom curt surt sol de la paraula clau o del nom de l’obra, i es pot canviar.
  - L’any i el número ja existeixen (`expedientBase`); no canvien mai.
- **El codi antic es conserva tal com és**, com a «Codi de carpeta (arxiu)»:
  - es veu a «Dades» de l’obra, amb un botó «Copiar» per enganxar-lo a l’explorador de Windows;
  - el cercador el continua trobant;
  - **no es perd res i no es canvia cap dada**: només canvia el que es mostra.
- Per als clients (portal), es manté el seu número propi (P-001…).

---

## 4. Idiomes (prioritari)

### Com està ara

- Hi ha una opció d’idioma a la configuració del compte, però **només tradueix 9 textos del menú**.
- La resta està escrita en català dins del codi. Ara mateix hi ha, aproximadament:

  | Tipus de text | Quantitat |
  |---|---|
  | Textos de pantalla | 2.640 |
  | Avisos i preguntes | 200 |
  | Textos de camps i ajudes | 270 |
  | Textos dels documents PDF | uns 400 |
  | **Total** | **≈ 3.500** |

- L’idioma és **del compte**, no de cada persona: en una obra compartida, tothom veuria el mateix idioma.

### Proposta

1. **Idioma de cada usuari** (català / castellà; després altres). Es tria a «El meu compte» i es desa amb el seu compte
   del núvol, de manera que el veu igual al mòbil, a l’iPad i a l’ordinador. Ho canvia **tot**: menús, botons, pantalles,
   avisos i documents.
2. **Idioma de l’obra** (camp nou a la fitxa): és l’idioma dels **PDF i documents** d’aquella obra (actes, pressupostos,
   certificacions, factures). Exemple: tu treballes en català i l’obra d’un client de Madrid surt en castellà.
3. **Obres compartides**: cadascú veu la interfície en el seu idioma. Les dades (partides, observacions…) no es
   tradueixen ni es toquen, i la sincronització no se n’assabenta: l’idioma no es desa dins de l’obra, només a l’usuari.
4. **Botó «Traduir» per als textos lliures** (observacions d’una acta, descripcions). Tres opcions:
   - **Gratuïta**: el traductor que porta el mateix navegador. El Chrome de l’ordinador el té, sense enviar res a fora;
     l’Edge l’està provant. A l’iPhone i l’iPad no hi és.
   - **Amb IA** (Claude Haiku 5.5): menys de **0,2 cèntims per acta** traduïda (10 actes, uns 1,5 cèntims). Només si
     l’actives; sense IA de pagament per defecte.
   - **Sense botó**: el text es deixa com està i el document només tradueix els títols i les etiquetes.

### Com es prepara

- Un **diccionari** únic (`ca` → `es`). Cada text de l’app passa a ser `t("Guardar acta")`: el text català fa de clau,
  de manera que el codi continua sent fàcil de llegir.
- La traducció al castellà la faig jo una vegada amb el diccionari sencer (no costa res a l’ús). Tu, o algú castellà, la
  revises per pantalles.
- **Fer-ho alhora que es modernitza cada pantalla**: quan es redibuixa una pantalla, els seus textos ja es posen al
  diccionari. Així cada pantalla es toca **una sola vegada**.
- Un avís automàtic a les proves detecta qualsevol text nou que no sigui al diccionari.

### Temps

| Feina | Durada |
|---|---|
| Motor d’idiomes, idioma per usuari i idioma de l’obra | 2–3 dies |
| Traducció de pantalles | +30 % sobre cada pantalla modernitzada |
| Documents PDF en castellà | 2–3 dies |

---

## 5. Albarans i factures de proveïdor

### Com està ara

L’app prova tres camins, per ordre:
1. **IA directa** amb la funció `llegir-albara`. **No està desplegada**: falta la clau d’Anthropic. Està preparada amb
   Claude Haiku 4.5.
2. **Text del PDF**: llegeix els PDF que porten text, no les fotos.
3. **ChatGPT copiant i enganxant** a mà.

Ara no assigna l’obra ni la partida de manera automàtica.

### Opcions

| Opció | Què llegeix | Cost per albarà | Comentari |
|---|---|---|---|
| Text del PDF (ja hi és) | Només PDF amb text | 0 € | No serveix per a fotos ni escanejats |
| Lectura dins del mòbil (OCR gratuït) | Fotos, malament si estan tortes | 0 € | Llegeix lletres però no entén la taula: cal molta revisió |
| **Claude Haiku 5.5 (recomanat)** | Fotos i PDF, també tortes o amb mala llum | **≈ 0,1 cèntims** (1.000 albarans ≈ 1 €) | El més econòmic que llegeix bé. Preu: 0,10 $ / 0,50 $ per milió de tokens |
| Claude Haiku 4.5 (el que hi ha ara a la funció) | Igual | ≈ 1 cèntim | 10 vegades més car que el 5.5, sense cap avantatge aquí |
| Claude Sonnet 5.5 | Albarans a mà difícils | ≈ 2 cèntims | Només com a segona opció si el Haiku no se’n surt |
| Serveis de factures (Google, Microsoft) | Factures | 1–5 cèntims | Més configuració i més car |

*Càlcul:* una foto o 1–2 pàgines de PDF són unes 3.000–6.000 unitats de text («tokens») d’entrada i unes 800 de
sortida. Amb Haiku 5.5: 0,0006–0,001 $ per albarà. La funció de Supabase és gratuïta fins a 500.000 crides al mes.

### Proposta

1. **Adjuntar PDF o foto** (també des de la càmera del mòbil). La IA en treu: proveïdor, NIF, número, data, línies
   (material, quantitat, unitat, preu, import), base, IVA i total.
2. **Obra**: la proposa sola a partir de l’adreça, la referència o el nom de l’obra que surt a l’albarà, o de l’obra
   oberta en aquell moment.
3. **Partida**: per a cada línia, la IA tria la partida del pressupost de l’obra que hi encaixa més (només s’hi envien els
   noms de les partides). Tu ho confirmes amb un toc.
4. **Sempre es revisa abans de desar**: la IA proposa i tu acceptes. L’original (PDF o foto) queda adjunt i al núvol.
5. **Què cal fer per activar-ho** (passos teus):
   1. Crear el compte d’Anthropic i comprar uns pocs euros de crèdit (n’hi ha per a milers d’albarans).
   2. Posar-hi un **límit de despesa mensual**.
   3. Desar la clau a Supabase.
   4. Canviar el model a `claude-haiku-5-5`. És un sol ajust (`ALBARA_MODEL`), sense tocar codi.

   Si vols, ho fem pas a pas.
6. **Factures de proveïdor**: el mateix flux; queden com a despesa de l’obra, enllaçades als albarans.

---

## 6. Pressupostos amb IA, BEDEC / BC3 i fórmules

- **Pressupostos amb IA**. Ara es copia un text i s’enganxa a ChatGPT o Claude, que torna un Excel per importar.
  - **Proposta**: que l’app ho faci directament amb una descripció de l’obra (i fotos o croquis si n’hi ha). La IA
    proposa capítols i partides amb unitats i amidaments, i **els preus surten de la teva llibreria o del BC3**, no de
    la IA.
  - **Cost**: 0,5 cèntims (Haiku 5.5) o 5–7 cèntims (Sonnet 5.5) per pressupost de 60 partides. El camí gratuït de
    copiar i enganxar es manté.
- **Importar BC3 (FIEBDC-3)**. És el format estàndard que exporten TCQ, Presto i Arquímedes. Serveix per importar
  pressupostos sencers (capítols, partides, descompostos, amidaments) i **bases de preus**.
- **BEDEC (ITeC)**: va per llicència. Cada usuari l’ha de tenir i importar el seu BC3; l’app no el pot portar a dins per a
  tothom. Amb l’importador BC3 queda resolt.
- **Fórmules**:
  - A les línies d’amidament, escriure `2*3,5+1,2` o `L×A×H` (com a l’Excel), amb el resultat al costat.
  - A les certificacions: % a origen per partida, «certificar fins al 100 %» amb un avís si es passa (ja s’han vist
    partides per sobre del 100 %) i el resum de l’anterior, l’actual i l’acumulat.

---

## 7. App al mòbil sense cobertura

**Com està ara.** Si la pàgina ja era oberta, funciona sense cobertura (les dades són al mòbil). Si estava tancada i no
hi ha cobertura, **no carrega**.

**Proposta: app instal·lable** («Afegir a la pantalla d’inici»):
- l’app es guarda sencera al mòbil i obre sempre, amb o sense cobertura;
- les dades ja hi són, i el núvol, les fotos i els canvis alhora es posen al dia sols en tornar la connexió;
- un avís «Hi ha una versió nova · Actualitzar» quan pugem una versió.

A l’iPhone i l’iPad, instal·lada a la pantalla d’inici, Safari esborra menys les dades.

**Temps:** 1–2 dies, amb proves sense cobertura al mòbil i l’iPad.

---

## 8. Pla de fases (versions)

Cada versió és un commit que t’ensenyo abans de pujar. Temps en **dies de feina** (proves incloses). Després de cada
versió, tu la proves.

| Versió | Què | Temps |
|---|---|---|
| **V87.267** | Paperera de fotos només per al propietari a les obres compartides (si dius sí) | ½ dia |
| **V87.268** | **App instal·lable i sense cobertura** (apartat 7) | 1–2 dies |
| **V87.269** | **Base nova**: barra fixa a baix, capçalera fixa amb «Tornar», rètols petits, una sola lletra, colors i botons comuns. **Motor d’idiomes** (idioma per usuari, ca/es) | 3–4 dies |
| **V87.270** | **Pantalla d’Obra nova** (una sola navegació, Apartats + Accions junts, 6 grups) + traducció | 3–4 dies |
| **V87.271** | **Expedients i Inici** nous + **codi d’expedient curt** (el codi antic, com a codi de carpeta) + traducció | 2–3 dies |
| **V87.272** | **Ajuntar canvis per apartats** (edició alhora sense preguntar si són apartats diferents) | 3–4 dies |
| **V87.273** | **Agenda, Temps i Factures** nous + traducció | 3–4 dies |
| **V87.274** | **Pressupost i Certificacions** nous (menys botons, fórmules als amidaments, control del 100 %) + traducció | 4–5 dies |
| **V87.275** | **Configuració** separada en 4 seccions + resta de pantalles + traducció | 2–3 dies |
| **V87.276** | **Idioma de l’obra i documents PDF** en castellà + botó «Traduir» (gratuït primer) | 2–3 dies |
| **V87.277** | **Albarans i factures amb IA** (Haiku 5.5, obra i partida automàtiques) | 2–3 dies + la teva configuració |
| **V87.278** | **Importar BC3 / BEDEC** | 3–4 dies |
| **V87.279** | **Pressupostos amb IA directa** (opcional) | 2–3 dies |

**Total aproximat:** 30–40 dies de feina.

**Ordre recomanat:** primer el que es nota a l’obra:
1. sense cobertura;
2. navegació;
3. idiomes i pantalles juntes;
4. després la IA i el BC3.

---

## 9. Què et demano

1. Que llegeixis la proposta i em diguis què canviaries.
2. Sí o no a la **V87.267** (paperera de fotos només per al propietari).
3. Si vols, abans de la V87.269 et faig una **maqueta** de la pantalla d’Obra al mòbil (sense tocar l’app) perquè vegis
   com quedaria.
4. Instal·lar la skill `frontend-design` (targeta que t’he passat) per al disseny de les pantalles.

---

## 10. Despeses, Facturació, menús per perfil i noms (17/10/2026)

*Proposta a partir de la nota de l’Héctor del 17/10/2026. **No canvia res del codi** fins que la revisis.*
*Com és ara: V87.293 (publicada).*

### 10.1 «Albarans» passa a dir-se «Despeses»

**Per què:** la majoria seran **factures** de material o de feina d’industrials, no només albarans.

**Com és ara:** cada albarà té data, obra, proveïdor, número, base, IVA, total, línies de material (quantitat, unitat,
preu), notes, foto o PDF i «Ja facturat o repercutit al client». **No** té tipus ni partida.

**Proposta:**

1. **Tipus** de cada despesa (camp obligatori, una tria):

   | Tipus | Català (llista) | Castellà (llista) | Què és |
   |---|---|---|---|
   | Factura de proveïdor | Material | Material | Factura de material (magatzem, ferreteria…) |
   | Factura d’industrial / subcontracta | Subcontracta | Subcontrata | Feina d’un industrial (paleta, lampista, electricista…) |
   | Albarà | Albarà | Albarán | Entrega de material encara sense factura |

2. **Imputació:** cada despesa va a **una obra** (obligatori). Opcionalment, a **una partida** del pressupost d’aquella
   obra: es tria d’una llista amb codi i concepte, i es pot buscar. Més endavant, si cal, es podrà repartir per línies.
3. **Albarà i factura, sense comptar dues vegades:** quan arriba la factura del proveïdor, es marquen els albarans que
   cobreix. Aquests albarans queden «Facturats pel proveïdor» i **deixen de comptar**; compta la factura.
   - Si un albarà no té factura, compta ell.
4. **IVA (decisió de l’Héctor):**
   - **El rendiment de l’obra es calcula sempre sense IVA (base imposable)**, perquè els pressupostos són sense IVA.
   - Al llistat hi ha tres columnes: **Base**, **IVA** i **Total**. El total és només informatiu (el que s’ha pagat) i
     **mai** entra al rendiment.
   - A sota del llistat hi ha dos totals: **total base** i **total amb IVA**.
   - Subcontractes amb **inversió del subjecte passiu** (IVA 0 %): base = total, i a la columna IVA hi diu «ISP».
5. **Rendiment de l’obra** (cost real davant del pressupost, tot sense IVA):

   | | Pressupost | Cost real | Diferència | % |
   |---|---|---|---|---|
   | Per capítol | des del pressupost | despeses imputades al capítol (per les seves partides) | | |
   | Per partida | si la despesa porta partida | | | |
   | Sense partida | — | despeses només imputades a l’obra | | |
   | **Total obra** | | despeses + (amb el mòdul 3) hores × cost/hora | **marge** | |

6. **Què passa amb el que ja hi ha:** tots els albarans d’ara passen a ser despeses de tipus «Albarà», amb la mateixa
   obra i els mateixos imports. No es perd res ni canvia cap import. Les dades continuen al mateix lloc (canvia el nom,
   no la clau on es desen).
7. «Ja facturat o repercutit al client» es queda, amb el nom **«Repercutida al client»**. Serveix per al tècnic que passa
   una despesa al seu client.

### 10.2 On surten les Despeses

- **Sempre dins de cada obra**: pestanya «Despeses» (a l’obra hi ha d’haver el cost real).
- **Tècnic** (com l’Héctor): **no** surt al menú principal.
- **Constructora:** sí, una vista general **«Despeses»** al menú principal amb les despeses de totes les obres:
  - es pot filtrar per obra, proveïdor, tipus i mes;
  - els totals surten amb base i amb IVA;
  - hi ha «+ Nova despesa» (foto o PDF, i després triar obra i partida).
- **Treballador de la constructora:** pot fer la foto d’un albarà o d’una factura des de l’obra («+ Despesa»). No veu els
  imports dels altres, només els seus.

### 10.3 «Factures» passa a dir-se «Facturació» (menú principal)

- **Conté només les factures que emet l’usuari.** Per a l’Héctor, les factures a nom seu, que seran poques.
- **Dues parts:**
  1. **Pendent de facturar**: hores i visites encara sense facturar, el pas previ a fer una factura.
  2. **Factures emeses**: el llistat amb la gràfica d’ingressos.
- **Fora d’aquí:**
  - Les **proformes i certificacions** d’una obra continuen dins de l’obra (pestanya «Facturació»).
  - Les **despeses** (factures que rebem) van a «Despeses».
- **VeriFactu** (quan es faci, ara aturat): aquí i a la pestanya «Facturació» de l’obra.

### 10.4 Menús segons el perfil i el mòdul contractat

**Perfils:** Tècnic · Constructor · Treballador de constructora (operari / encarregat) · Autònom (industrial) ·
Promotor (client).

**Mòduls** (els de Configuració → «Pla i mòduls»):
- **M1 Tècnic**: expedients, actes, notes, documents, agenda, temps, honoraris i facturació del tècnic.
- **M2 Econòmic d’obra**: pressupost, certificacions, facturació d’obra (proformes) i seguiment.
- **M3 Empresa**: despeses, equip i hores per treballador, rendiment i marge per obra.

#### Menú principal

| Pestanya (ca · es) | Tècnic (M1) | Tècnic + M2 | Constructor (M2) | Constructor + M3 | Treballador | Autònom | Promotor |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Inici · Inicio | ✔ | ✔ | ✔ | ✔ | ✔ (la feina d’avui) | ✔ | ✔ |
| Obres · Obras | ✔ | ✔ | ✔ | ✔ | ✔ (només les assignades) | ✔ | ✔ (només les seves) |
| Agenda · Agenda | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (visites) |
| Hores · Horas | ✔ | ✔ | — | ✔ (equip) | ✔ (fitxar) | ✔ | — |
| Facturació · Facturación | ✔ | ✔ | ✔ | ✔ | — | ✔ | — |
| Despeses · Gastos | — | — | — | ✔ | — | ✔ | — |
| Pressupostos · Presupuestos | — | ✔ | ✔ | ✔ | — | ✔ | — |
| Clients · Clientes | ✔ | ✔ | ✔ | ✔ | — | ✔ | — |
| Agents · Agentes | ✔ | ✔ | ✔ | ✔ | — | — | — |
| Preus · Precios (ara «Llibreria») | — | ✔ | ✔ | ✔ | — | ✔ | — |
| Ajustos · Ajustes (ara «Configuració») | ✔ | ✔ | ✔ | ✔ | ✔ (només el seu) | ✔ | ✔ (només el seu) |

**Al mòbil i a l’iPad**, la barra de baix té les 4 primeres que facin servir més, i la resta va a «Més»:
- Tècnic: Inici · Obres · Agenda · Hores.
- Constructor: Inici · Obres · Agenda · Despeses.
- Treballador: Inici · Obres · Hores · Agenda.

#### Dins de l’obra

| Pestanya (ca · es) | Tècnic (M1) | Tècnic + M2 | Constructor (M2) | Constructor + M3 | Treballador | Autònom | Promotor |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Resum · Resumen | ✔ | ✔ | ✔ | ✔ | ✔ (què cal fer) | ✔ | ✔ |
| Pressupost · Presupuesto | — | ✔ | ✔ | ✔ | — | ✔ | ✔ (consulta) |
| Certificacions · Certificaciones | — | ✔ | ✔ | ✔ | — | ✔ | ✔ (consulta) |
| Facturació · Facturación (proformes) | — | ✔ | ✔ | ✔ | — | ✔ | — |
| Despeses · Gastos | — | ✔ | — | ✔ | ✔ (fer foto) | ✔ | — |
| Rendiment · Rendimiento | — | ✔ | ✔ | ✔ | — | ✔ | — |
| Actes · Actas | ✔ | ✔ | ✔ | ✔ | — | — | ✔ (consulta) |
| Notes · Notas | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (consulta) |
| Documents · Documentos | ✔ | ✔ | ✔ | ✔ | ✔ (plànols) | ✔ | ✔ |
| Agenda · Agenda | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Tasques · Tareas | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Planning · Planning (ara «Gantt») | — | ✔ | ✔ | ✔ | ✔ (consulta) | — | ✔ (consulta) |
| Hores · Horas | ✔ | ✔ | — | ✔ (equip) | ✔ (les seves) | ✔ | — |
| Honoraris · Honorarios | ✔ | ✔ | — | — | — | — | — |
| Agents · Agentes | ✔ | ✔ | ✔ | ✔ | — | — | — |
| Fitxa · Ficha (ara «Dades») | ✔ | ✔ | ✔ | ✔ | — | ✔ | — |
| Entrega · Entrega (ara «Tancament / Entrega») | ✔ | ✔ | ✔ | ✔ | — | — | ✔ (consulta) |

*El tipus de treball continua decidint quines tenen sentit.* Per exemple, un certificat energètic no té Pressupost ni
Certificacions encara que el compte tingui el mòdul 2.

### 10.5 Noms de les pestanyes: curts, clars i d’obra

| Ara | Proposta (ca) | Proposta (es) | Per què |
|---|---|---|---|
| Treballs / Expedients | **Obres** | **Obras** | Curt; per a tothom és «l’obra» (el tècnic hi veu també el codi d’expedient) |
| Gestió temps · Traça | **Hores** | **Horas** | El que s’hi fa: apuntar hores |
| Factures | **Facturació** | **Facturación** | Factures emeses i pendent de facturar |
| Albarans | **Despeses** | **Gastos** | Factures de material, d’industrials i albarans |
| Llibreria | **Preus** | **Precios** | És el banc de preus (partides i preus propis) |
| Configuració | **Ajustos** | **Ajustes** | Més curt (al mòbil cap a la barra) |
| Agenda / Calendari · Agenda / Avisos | **Agenda** | **Agenda** | Una sola paraula |
| Dades (de l’obra) | **Fitxa** | **Ficha** | És la fitxa de l’obra |
| Gantt | **Planning** | **Planning** | Paraula d’obra; «Gantt» no l’entén tothom |
| Seguiment econòmic + Rendiment | **Rendiment** | **Rendimiento** | N’hi ha dues que fan el mateix: s’ajunten |
| Tancament / Entrega | **Entrega** | **Entrega** | Més curt |
| Pressupost ràpid | (dins de Pressupost: «Pressupost per al client») | «Presupuesto para el cliente» | Ja fet a la V87.277 |
| Gestió obra · Certificacions obra · Pressupost obra | (desapareixen: són les velles) | — | Ja substituïdes per Pressupost i Certificacions |

**Es queden igual:** Inici · Clients · Agents · Pressupost · Certificacions · Actes · Notes · Documents · Tasques ·
Honoraris · Resum.

### 10.6 Ordre de feina proposat (quan diguis sí)

| Versió | Què | Temps |
|---|---|---|
| 1 | **Noms nous** (10.5) i **Facturació** (10.3). Només canvia el que es veu, no les dades | ½–1 dia |
| 2 | **Despeses**: tipus, base/IVA/total, totals, partida, albarà ↔ factura (10.1), dins de l’obra (10.2) | 2 dies |
| 3 | **Rendiment de l’obra** amb el cost real per capítol i partida (10.1.5) | 1–2 dies |
| 4 | **Menús segons perfil i mòdul** (10.4): perfil i mòduls a la fitxa del compte, menú i pestanyes segons la taula | 2–3 dies |
| 5 | Perfils nous **Treballador** i **Autònom** (comptes i què poden fer) | 3–4 dies |

### 10.7 Què et demano

1. Que revisis les dues taules del 10.4, sobretot el que veu el **treballador** i el **promotor**.
2. Noms del 10.5: «**Preus**» per a Llibreria, «**Hores**» per a Gestió temps, «**Ajustos**» per a Configuració i
   «**Planning**» per a Gantt. Et semblen bé?
3. A «Facturació», hi deixem també **Pendent de facturar** (hores encara sense factura) o ho vols separat?
4. Albarà i factura (10.1.3): et va bé marcar quins albarans cobreix cada factura?
