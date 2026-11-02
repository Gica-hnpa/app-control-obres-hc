# Full de ruta de l’app (des del 28/10/2026)

L’Héctor, 28/10/2026: «marquem un camí a seguir amb la resta, perquè si no anem donant tombs d’una pantalla a l’altra i ja no controlo on
som ni què ens queda… ara veig una liada en algunes pantalles que hem de posar ordre».

## Com treballem a partir d’ara

1. **Un bloc alhora.** Cada bloc té una llista tancada de pantalles. No es toca cap pantalla d’un altre bloc fins tancar el que hi ha obert.
2. **Primer la regla, després les pantalles.** Abans de començar, totes les pantalles han de seguir el mateix patró (vegeu «Patró de
   pantalla»). Cada pantalla es repassa amb aquest patró i es marca com a feta.
3. **Els encàrrecs nous** (d’un client o d’una idea que surti) no s’afegeixen a mig bloc: van a **«Llista d’espera»** i l’Héctor decideix
   quan entren. Només un error que impedeix treballar es fa al moment.
4. **Cada versió diu de quin bloc és** i, en acabar un bloc, l’Héctor el prova i diu «tancat».

## Patró de pantalla (el mateix per a totes)

- **A dalt, una línia:** el títol, el botó principal (un de sol: «Nova…», «Editar»…) i un sol menú «Accions» per a la resta.
- **Després, el resum:** una línia o pocs números (el que cal saber d’un cop d’ull). Si n’hi ha més, plegat amb una línia que ho resumeixi.
- **Després, la llista o el contingut principal.**
- **Tot el que és secundari, plegat** (informes, gràfics, filtres avançats, ajudes) — a l’ordinador, a l’iPad i al mòbil igual.
- **Sense textos que expliquin l’app.** Botons amb icona i paraula. Res tallat per la dreta. Els documents, sempre en fulls A4.
- **Targetes plegables iguals** (l’Héctor, 29/10/2026): totes de la mateixa mida i forma (també capítols i partides), una línia amb la
  icona, el títol i com a molt una xifra, **sense línia de comentari**. Accions: «Editar» · «Imprimir» (una pantalla amb els PDF) · «Accions»
  curt; les eines, dins d’«Editar». Els gràfics, a la vista (donen color). Classe comuna `bloc-v878426`.
- **Nivells, des de la V87.451** (nit del 30-31/10/2026; substitueix els colors de sota): la principal oberta, capçalera **plena de blau** i fixa en baixar; el capítol o la secundària oberts, **blau clar**; les files, blanques. Al mòbil, una sola tira Fitxa · Seguiment · Econòmic amb l’apartat dins del bloc actiu, i sense títols que repeteixin la tira o la capçalera.
- **Tres nivells de targetes** (l’Héctor, 29/10/2026: «remarcar més les principals i anar a menys amb les secundàries… que es vegi on es
  torna a recollir»; V87.432): **principals** amb vora marcada i ombra (oberta: capçalera blau clar amb franja i la fletxa amunt; si és
  llarga, «Recollir» a baix); **secundàries** (dins d’una principal) amb fons gris clar i sense ombra; **files**, blanques. **Tot plegat
  d’entrada.**
- **Accions a l’ordinador, a la vista** (l’Héctor, 29/10/2026: «a l’ordinador, a fora com enviar i imprimir, que ja queden poques
  accions; al mòbil i l’iPad, recollit»): a l’ordinador (més de 1100 px i ratolí) cada acció és un botó amb icona i paraula; al mòbil i
  l’iPad, «Editar · Imprimir · Accions». Les eines per crear (Excel, PDF, IA) només quan el contingut és buit.
- **Un sol nom per a una sola cosa:** el que s’afegeix a un pressupost tancat és «Fora de pressupost» (no «partides noves», «imprevistos»…).

## On som (V87.473, 2/11/2026)

- Fet i publicat: tècnic (revisió per tandes), constructora (tandes 1–7), documents i signatures, previst i imprevistos, compartir amb
  el Martí, documents en fulls A4. Detall a `CLAUDE.md`.
- **Tancat el 28/10:** el bloc «Certificacions · previst i imprevistos · compartir · PDF» (V87.410–425).
- **Bloc 1, començat (V87.426, la nit del 29/10):** Pressupost, Certificacions, Facturació, Despeses i Rendiment de l’obra en targetes
  plegables (encàrrec de l’Héctor). Queden del bloc 1: Resum, Dades, Documents, Visites, Agenda, Partes, Planning i Amidaments.
- **V87.427 (29/10 al matí):** el pressupost també és una targeta plegable, «Partides noves i imprevistos» a part (amb l’import i la
  numeració del pressupost) i el número de les partides al mòbil.
- **V87.428 (29/10):** «Tancar el pressupost» / «Reobrir-lo» (en lloc de «Pressupost inicial»), un sol nom («Fora de pressupost»), les
  accions del pressupost a la vista a l’ordinador, crear des d’Excel, PDF o IA només amb el pressupost buit, i la gràfica del Rendiment a baix
  amb la fase triada.
- **V87.451–455 (nit del 30-31/10):** saber on som (capçaleres plenes i fixes), Econòmic, resta de l’obra, iPad i menú principal al mòbil.
- **V87.456 (31/10):** Verbania al mòbil: descompostos al seu lloc, preus per famílies, hores previstes contra apuntades, la certificació facturada només amb el quadre resum i «Enviar» del pressupost que pregunta.
- **V87.457 (31/10):** paquets d'Obres fixos, Fitxa · Seguiment · Econòmic en tres targetes al mòbil, nivells de blau i perímetres ben marcats i les famílies de preus separades.
- **V87.458 (31/10):** la IA llegeix sola albarans, factures i PDF (funció `aco-ia`, encara sense instal·lar).
- **V87.459 (31/10):** pressupost automàtic amb IA, a partir d’un text, un dictat, amidaments, plànols o fotos (la mateixa funció, encara sense instal·lar).
- **V87.460 (31/10):** banc de preus comú: l’Héctor comparteix el seu, amb l’any i l’IPC, amb tots els comptes (falta l’SQL i importar la base).
- **V87.461 (31/10):** factures i albarans en un llistat que es desplega.
- **V87.462–468 (1–2/11):** Amidaments només amb quantitats (els preus i la logística, a «Passar-ho a pressupost»), pressupost sempre plegat, comptador de temps nou, Resum i Agenda de l'obra plegats, Preus amb una línia a dalt i els filtres de l'Agenda plegats al mòbil.
- **V87.469 (2/11):** lectures de la IA per compte (tècnic 150, constructora 500, paquets propis) i el cost de debò de cada crida. La funció `aco-ia` s'ha instal·lat el mateix dia.
- **V87.470 (2/11):** Despeses per data d'emissió i cercador per número, data o client a Despeses i Facturació.
- **V87.471 (2/11):** Facturació amb factures de debò: «Per facturar» alineat, curt al mòbil i amb el total, filtres plegats al mòbil, sense el títol repetit a l'iPad i el menú lateral sense barra. Amb això s'acaba de mirar el Bloc 2.
- **V87.472 (2/11):** «Fer factura» amb el NIF i l’IVA de sèrie, el motiu de l’IVA 0 % a la factura, l’entitat i l’IBAN, i el dia de cobrament (correccions de l’Héctor provant el Bloc 2 amb Brava).
- **V87.473 (2/11):** Hores del personal per setmanes de feina, amb el calendari laboral, «Emplenar hores», desfer i la mateixa pantalla des de l’obra (correcció de l’Héctor provant el Bloc 2).

## Blocs, per ordre

| # | Bloc | Pantalles | Estat |
|---|---|---|---|
| 1 | **Constructora · dins de l’obra** | ~~Resum · Agenda · Amidaments~~ (V87.462–464) · ~~Pressupost · Certificacions · Facturació · Despeses · Rendiment~~ (V87.426) · Dades · Documents · Visites · Partes · Planning (mirats al mòbil, sense canvis) | Falta que l’Héctor el provi i el tanqui |
| 2 | **Constructora · menú principal** | ~~Preus · Agenda~~ (V87.465) · ~~Despeses · Rendiment~~ (V87.468) · ~~Facturació~~ (V87.471) · Inici · Obres · Hores · Empresa · Contactes · Ajustos (mirats a l'ordinador amb dades d'exemple, sense canvis) | Falta que l'Héctor el provi i el tanqui |
| 3 | **Tècnic** | Inici · Expedients · encàrrec (cèdula, CEE, ITE, amiant) · Honoraris · Hores · Les meves despeses · Facturació · Rendiment · Pressupostos | Pendent |
| 4 | **Gestió total i treballador** | El que només tenen ells; decidir com arriben a l’oficina les hores i les despeses del treballador | Pendent |
| 5 | **Mòbil i iPad, repàs final** | Repàs exhaustiu de totes les pantalles; el «visual nou» que validi l’Héctor, per a tothom | Pendent |
| 6 | **El que depèn de fora** | VeriFactu (gestoria) · IA directa (clau d’Anthropic) · fitxatge des del mòbil (fase 2) · Google Drive · perfils autònom i promotor · guies PDF | Quan ho digui l’Héctor |

Cada bloc es fa així: llista de les pantalles amb el que no segueix el patró → l’Héctor diu si hi està d’acord → versions → proves →
publicar → l’Héctor ho prova i el tanca.

## Coses que ha de fer l’Héctor (no depenen de l’app)

- Compartir l’obra amb `marti` («Pressupost i certificacions»).
- Verbania: «Marcar com a nova» la 3.09 i la 3.10.
- Activar la Gmail API (console.cloud.google.com › «Control d’obres» › Gmail API › Habilitar).
- Tornar a provar la signatura amb l’AutoFirma.
- Comodoro: Pressupost › Accions › Eines › «Tornar a llegir els descompostos d’un Excel…» amb l’Excel v07.
- Crear els comptes del Pol al panell de Supabase.
- Validar les propostes del «visual nou».
- Respondre: el «Conforme del client» del parte; com arriben a l’oficina les hores i despeses del treballador.

## Termini

L’Héctor (29/10/2026): llesta en una setmana com a molt; de finals de novembre a mitjan desembre, prova gratuïta per a clients potencials
(com a molt 3 accessos per client); contractes la segona quinzena de desembre; qui continuï, des de l’1/1/2027.

## Llista d’espera (encàrrecs nous que encara no tenen bloc)

- ~~**Encàrrecs tècnics, segona volta**~~ (30/10/2026, amb el sí de l’Héctor; proposta a https://claude.ai/artifact/3ubYp6XdySSVzHcFWDy1ck): fet a les V87.441–444 (targetes,
  programes de l’ordinador, fitxa de la visita amb la IA i els cinc treballs que faltaven). Falta el que depèn de l’Héctor: el document final que fa l’app (C) i els tipus d’informe (D).

- **Encàrrecs tècnics, tercera volta** (l’Héctor, 2/11/2026, amb el CEE de Cornellà; encaixa al Bloc 3): un estat per a la feina acabada que espera l’etiqueta, la factura o el cobrament (proposta: «Pendent de tancar», amb el que falta a la vista) i diversos encàrrecs dins d’un expedient (CEE, amiant, cèdula), amb el que és comú compartit. Falta el seu sí i saber si els cobra amb un preu conjunt o un per encàrrec.
- **Permís de gestió d’un compte** (l’Héctor, 2/11/2026: «si jo porto la facturació i despeses de Brava… hauria de poder veure les seves pestanyes generals… però no sempre serà així… el millor és que des del perfil de Brava em doni permís»). Proposta, per decidir:
  - **Qui dona el permís:** a Brava, Ajustos › «Qui em porta la gestió»: escriu el compte (p. ex. el de l’Héctor), marca què pot veure (Facturació · Despeses · Rendiment) i si només mira o també hi treballa. Ho pot treure quan vulgui.
  - **Qui el rep:** al menú, «Comptes que porto» › Brava: s’obren aquelles pantalles amb una franja «Estàs a Brava · Tornar al meu compte». No es barreja amb les dades pròpies.
  - **Per què no a «Compartir»:** compartir és obra per obra; això és de tot el compte.
  - **Per dins:** una taula nova al núvol (qui dona, qui rep, què pot) i una regla perquè el gestor llegeixi el compte. Cal un SQL que ha d’executar l’Héctor. **Compte:** cada obra és una sola fila al núvol, o sigui que el permís tria quines pantalles es veuen, però no pot amagar a nivell de dades la resta de l’obra.
  - **Mentrestant:** entrar amb el compte de Brava en una finestra InPrivate.
- Descompte al pressupost d’obra · obra nova en 3 passos · revisor del pressupost · parte per veu · previsió de caixa.
- **Comparador de pressupostos** (l’Héctor, 1/11/2026: per estudiar quan s’acabi el que hi ha pendent): quan hi ha diverses ofertes d’un mateix industrial, per decidir qui s’agafa (constructora i gestió total), i comparatius de preus per al tècnic.
- **Idees de Motor de Presupuestos i Pillar** (mirats l’1/11/2026, a partir de pàgines públiques): abans de generar amb IA, ensenyar com s’ha entès l’encàrrec i preguntar el que falta; canviar el pressupost amb paraules normals, veient què canvia; rapportini per WhatsApp o veu; conciliació bancària.
- Afegir una partida amb IA dins d’un capítol que ja existeix (l’Héctor, 29/10/2026: «en tot cas seria afegir partida amb IA dins d’un
  capítol ja existent»; cal la IA directa, clau d’Anthropic).
