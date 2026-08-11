# APP Control d’Obres V87.224

## Normalització completa d’administració i canvis de partida V87.224

- Totes les partides que tenen feines per administració, tant noves com antigues, passen al mateix model: `1 p.a.` i preu igual al total calculat del llistat.
- Es reconstrueixen també els llistats del format antic d’oficials/peons i els imports fixos ja guardats per número de certificació.
- El total de les hores, jornades i materials és la font econòmica prioritària; un PU antic de 50 € ja no pot desquadrar el document.
- En canviar codi, capítol o nom es conserven primer els imports certificats i s’actualitzen els vincles dels llistats al nou codi.
- La certificació actual i el PDF mostren un `€/ut` coherent amb l’import real certificat.

## Totals per capítol, partides alçades i divisió d’administració V87.223

- Cada capítol blau de la certificació mostra el pressupost, el certificat del mes seleccionat i el total acumulat a origen, tant obert com plegat.
- Els imports d’administració es guarden també per número de certificació, perquè una modificació posterior del preu no alteri l’històric.
- Una partida nova o fora de pressupost d’administració queda com `1 p.a.` i el seu preu és el total real de les hores, feines i materials guardats.
- En reobrir una partida d’administració es poden marcar dies o feines i passar-los a una segona o tercera partida sense esborrar ni tornar a introduir les línies.
- La impressió de la certificació actual utilitza els imports fixats i incorpora el subtotal del capítol.

## Menú únic d’impressió i administració unificada V87.222

- Totes les impressions de la certificació s’agrupen en un únic desplegable `Imprimir`.
- El desplegable ofereix `Certificació actual · Cert. N` i `Certificació general · a origen`.
- També permet imprimir l’administració d’una partida concreta o totes les partides en un únic document.
- El document unificat separa les línies per partida i mostra subtotals i totals generals d’hores, materials i import.
- `Més accions` queda reservat a crear o modificar contingut i ja no conté opcions d’impressió.

## Impressió d’administració per partida V87.221

- El menú `Més accions` mostra totes les partides de la certificació que tenen línies d’administració guardades.
- Cada partida es pot previsualitzar i imprimir individualment, sense dependre del nom `Ajudes`.
- S’hi inclouen les partides originals, les noves i les marcades com a fora de pressupost.
- La fitxa de cada partida incorpora directament el botó `Imprimir administració` quan té línies a la certificació seleccionada.
- Es manté compatibilitat amb els quadres nous i amb les línies d’administració del format anterior.

## Partida d’administració sense preu previ V87.220

- El formulari de nova partida de certificació incorpora el tipus `Treballs per administració · suma de línies`.
- En aquest tipus no es demanen ni quantitat ni preu unitari abans de crear la partida.
- L’usuari passa directament al quadre de feines, hores i materials; el total de les línies és l’import certificat.
- La partida resultant es desa amb `PU 1 €` i quantitat igual a l’import, de manera que conserva el total exacte i mostra el `100%` quan és nova.
- Una partida existent sense preu també adopta automàticament aquest model d’import quan s’hi guarden feines per administració.

## Administració acumulativa i percentatges V87.219

- En tornar a obrir un quadre de feines per administració es recuperen totes les línies guardades.
- Es poden modificar línies existents i afegir-ne de noves sense substituir el contingut anterior.
- Una línia només desapareix quan l’usuari prem explícitament `Eliminar` i després guarda.
- Les partides resum d’administració utilitzen `PU 1 €` i una quantitat igual a l’import, preservant els imports de certificacions anteriors.
- Una partida creada en la certificació actual mostra el `100%` quan el certificat representa la totalitat de la partida.
- Les provisions i altres partides noves incorporen com a base la mateixa quantitat certificada.

## Dates fixes i biblioteca del client V87.218

- La data de cada certificació queda desada com una data documental fixa i no es recalcula en tornar a obrir l’app.
- Les dades antigues buides o guardades com `Avui` es consoliden una sola vegada; mai no tornen a canviar diàriament.
- Crear o editar un pressupost incorpora un botó directe `Afegir partides de la llibreria`.
- La finestra de selecció comença per les partides relacionades amb el client actual i permet passar a la biblioteca general.
- Es poden cercar, filtrar per capítol, marcar diverses partides i afegir-les juntes al capítol de destí.
- La pantalla indica sempre quantes partides hi ha, quantes se’n mostren i permet carregar-ne més sense ocultar la resta.

## Seguiment econòmic, dates i Gantt V87.217

- Facturació mostra les dates en format `DD/MM/AAAA` i comparteix una única data amb la certificació corresponent.
- El seguiment econòmic compara el pressupost inicial amb el principal actual; mai no suma les dues versions.
- Mostra pressupost inicial, principal amb modificacions, desviació, import certificat a origen i percentatge executat.
- Afegeix comparació per capítols i detall de partides, incloent les partides identificades com a fora de pressupost.
- El Gantt permet configurar inici previst i real, industrials propis/autònoms/externalitzats, personal i hores diàries.
- La durada pot sortir dels rendiments de mà d’obra dels descompostos o introduir-se manualment.
- La planificació es veu per capítols i per partides, amb barres previstes, certificades, marques de certificació i percentatges executats.

## Certificació simple i dos formats d’impressió V87.216

- Permet escollir entre el document acumulat `A origen + deduccions` i `Només la certificació actual`.
- El segon format imprimeix exclusivament les partides amb quantitat a la certificació seleccionada, agrupades per capítol.
- El resum de l’obra mostra totes les certificacions en una llista pròpia amb desplaçament vertical.
- El quadre resum de certificacions conserva totes les columnes i incorpora desplaçament horitzontal.
- Cada partida té una única finestra `Fitxa / accions` amb codi, capítol, unitat, preu, concepte, descripció, amidaments i administració.
- Obrir les línies d’amidament activa l’edició automàticament i torna a la mateixa certificació sense obligar a tancar altres modes.
- Al mòbil, la barra d’accions i la fitxa passen a una disposició compacta.

## Certificacions recuperades V87.215

- Corregeix l’origen dels imports a zero: els preus i quantitats guardats com `4.000,00` es convertien amb JavaScript com si no fossin números.
- En carregar les dades, quantitats, preus i camps certificats es normalitzen a números reals sense substituir les línies de medició.
- Recupera automàticament les certificacions 1–8 de DAVID FUS si detecta que diverses han passat massivament a zero.
- La certificació 8 conserva totes les línies i quantitats actuals; només utilitza la base estable quan el valor existent és realment zero.
- La llista de certificacions mostra el registre guardat com a seguretat si temporalment no pot calcular el detall.
- Un nou blindatge bloqueja qualsevol guardat que intenti deixar totes les certificacions d’un pressupost a zero.
- Els pressupostos deixen de guardar `q` i `pu` com a textos amb format local: a partir d’ara es desen com a valors numèrics.

## Blindatge econòmic i recuperació automàtica V87.214

- Detecta automàticament la pèrdua massiva de quantitats o preus del pressupost de DAVID FUS i recupera només aquests camps des de la base estable.
- Conserva les línies de medició, quantitats i dades noves de la certificació 8: no cal importar cap JSON antic.
- Pressupost i certificacions treballen sempre amb el pressupost seleccionat; editar-ne un ja no pot substituir ni modificar els altres.
- Guardar un pressupost actualitza només les seves partides i conserva íntegrament el pressupost inicial i els annexos.
- Guardar una quantitat certificada ja no elimina les línies de medició que la justifiquen.
- La protecció d’integritat bloqueja qualsevol operació que intenti convertir de cop un pressupost complet a zero.

## Interfície simple i coherent V87.213

- Totes les pantalles començaran a seguir el mateix patró: una vista, una acció principal i un únic menú `Més accions`.
- Certificacions elimina els dos selectors duplicats i la filera de botons; ara mostra `Resum general` o `Partides de la certificació`.
- `Editar certificació` és l’acció principal. Guardar i cancel·lar només apareixen durant l’edició.
- Extres/provisions i administració passen a finestres superposades.
- Pressupost manté `Editar pressupost` com a única acció principal i agrupa PDF, Documents, Excel, email i llibreria.
- Els controls de suma correctes i les explicacions permanents s’amaguen; només apareix una alerta si existeix una incoherència real.
- El menú d’accions es converteix en un panell inferior al mòbil.

## Certificacions recuperades V87.212

- Recupera les quantitats certificades tant des de `certsByNum` com dels camps històrics `cert_1`, `cert_2`, etc.
- Recalcula l’import resum de cada certificació a partir de les seves partides en carregar les dades.
- Manté les vuit certificacions de DAVID FUS amb els imports comprovats i evita que apareguin a zero.
- La còpia JSON reparada duplica de manera segura cada quantitat en els dos formats compatibles.

## Integritat de pressupostos i certificacions V87.211

- Cada expedient utilitza com a font autoritzada el pressupost guardat a la còpia principal; ja no fusiona automàticament còpies antigues o de recuperació.
- Els pressupostos inicials, principals i annexos es mantenen separats i no se sumen en un total global ambigu.
- Abans d’importar una còpia JSON, les dades principals prevalen i s’eliminen les claus antigues que podien tornar a injectar partides.
- El pressupost mostra un control visible de suma, nombre de partides, capítols i codis repetits.
- `Editar pressupost`, `+ Partida extra / provisió` i `+ Hores / administració` són accions directes i visibles.
- S’inclou una còpia reparada de les dades del 22/07/2026, sense perdre les 8 certificacions de l’expedient DAVID FUS.

## Promotor independent i accions clares V87.210

- `Client / carpeta` continua sent el client propi de l’expedient, com SOCOTERM.
- `Promotor / client final` és ara un desplegable independent amb els promotors i contactes ja existents.
- En seleccionar-ne un es recuperen DNI/NIF, adreça, email i telèfon de la seva fitxa.
- Es pot crear o editar el promotor en una finestra superposada i tornar després a la pantalla Dades.
- Les dades fiscals i de contacte del promotor es guarden separades de l’adreça de l’obra i s’utilitzen als documents.
- A les partides del pressupost, el bloc de botons queda substituït per un únic desplegable `Accions`.
- Desar una partida sempre l’envia a la llibreria general; el client actual només queda com a vinculació o filtre.
- El desplegable permet editar, amidar, veure la descripció o descompost, cercar a tota la llibreria, moure de capítol o eliminar.

## Selecció múltiple i unitats visibles V87.209

- Cada partida torna a tenir una casella de selecció directament dins del capítol.
- Es poden seleccionar o desmarcar totes les partides visibles d’un capítol amb un sol botó.
- Una barra fixa permet moure totes les partides seleccionades al mateix capítol, desmarcar-les o eliminar-les.
- Després del moviment massiu la selecció queda neta automàticament.
- La unitat de cada partida (`UT`, `ML`, `M2`, etc.) es mostra en una etiqueta gran i diferenciada.
- El ZIP conté sempre una carpeta arrel amb el nom i número de la versió.

## Finestres de treball i lectura còmoda V87.208

- Les accions del capítol són a la capçalera fixa del capítol obert; no cal arribar al final de la llista.
- Les partides es mostren en files compactes i `Obrir fitxa` obre una finestra sobre la pantalla principal.
- La fitxa permet modificar dades, descripció llarga, descompost, clients i codi sense allargar la pàgina.
- En un pressupost, `Veure desc.` obre una finestra gran i llegible amb la descripció completa.
- Si la partida té descompost, apareix al costat de la descripció; des de la mateixa finestra es pot obrir l’editor.
- En tancar qualsevol finestra es conserva la posició i la vista anterior.
- Al mòbil, aquestes finestres ocupen tota la pantalla per evitar columnes i textos minúsculs.

## Partides directament dins dels capítols V87.207

- S’elimina de la pantalla el bloc separat `Partides guardades a la llibreria`.
- En obrir un capítol es carreguen directament les partides que té assignades.
- Només es carrega el capítol o la partida oberta, per evitar alentiments amb centenars de partides.
- Les accions de renombrar, fusionar i eliminar es van agrupar per capítol; a la V87.208 passen a una finestra accessible des de la capçalera.
- Les partides es van integrar dins del capítol; a la V87.208 la seva edició passa a una finestra de treball.
- Les partides sense descripció llarga queden marcades visualment com a pendents.
- El descompost es pot escriure en text, crear amb línies manuals o importar des d’Excel.
- Les línies del descompost permeten editar concepte, unitat, rendiment, preu i total.
- El total detectat del descompost es pot aplicar directament com a preu unitari.

## Llibreria amb accions clares V87.206

- Cada capítol és una fila plegada amb un únic desplegable d’accions.
- Dins de cada capítol es pot consultar les partides, renombrar, fusionar o eliminar.
- El capítol `General` es pot eliminar quan està buit.
- Ja no es mostren els noms tècnics `PAS 1`, `PAS 2` i `PAS 3`.
- Quan no hi ha partides pendents només apareix un avís curt; les aparicions històriques no es confonen amb feina pendent.
- L’apartat de partides guardades indica clarament quantes n’hi ha i què s’hi pot fer.

## Capítols: inserir i renumerar V87.205

- Permet inserir un capítol després de qualsevol capítol numerat.
- El número nou es calcula automàticament i els capítols posteriors es desplacen una posició.
- Totes les partides continuen vinculades al capítol corresponent.
- També permet compactar buits de numeració i renombrar cada capítol manualment.
- El ZIP és per a ús local amb Vite; la carpeta `dist` no és necessària per treballar-hi.

Versió centrada a separar clarament les propostes pendents de les partides ja guardades i a fer editable el pressupost ràpid.

## Llibreria ordenada i pressupost ràpid editable V87.204

- El pas 2 indica clarament que les files són propostes detectades i que el capítol mostrat és només el d’origen.
- Les propostes pendents es poden seleccionar i incorporar al capítol final escollit o descartar-les a la paperera.
- El preu proposat de cada pendent es pot modificar abans d’incorporar-la.
- Restaurar una proposta descartada la torna al pas 2, sense incorporar-la automàticament a la llibreria.
- El pas 3 identifica les partides ja guardades i mostra una gestió ràpida amb selecció, capítol assignat, preu i eliminació.
- Les partides del pas 3 es poden reassignar de capítol directament, variar-ne el preu o eliminar-les.
- L’editor complet de codis, descripcions i clients queda plegat com a opció avançada.
- El pressupost ràpid incorpora un botó visible `Editar quantitats i preus`.
- En mode edició ràpida, codi, unitat, concepte, quantitat i preu unitari són editables directament a totes les partides.
- Al mòbil, les files també s’obren automàticament mentre el mode edició està actiu.

## Depuració i paperera recuperable V87.203

- Un capítol buit es pot eliminar directament.
- Un capítol amb partides mostra l’acció `Eliminar capítol + X partides` amb confirmació explícita.
- Les partides es poden eliminar individualment o seleccionar-ne diverses i eliminar-les de cop.
- Les eliminacions passen a una paperera recuperable, agrupades per operació.
- La paperera permet restaurar capítols complets, partides o eliminar definitivament cada còpia.
- Les partides eliminades no reapareixen automàticament a la safata de candidates encara que encara existeixin en pressupostos antics.
- La paperera i les exclusions també s’inclouen al Supabase Sync.
- Eliminar de la llibreria no modifica les partides ja utilitzades dins dels pressupostos existents.

## Capítols primer i fusió guiada V87.202

- Aquest antic flux per passos queda substituït a la V87.206 per noms directes: capítols, pendents i partides guardades.
- Nou selector clar per fusionar cada capítol amb un altre d’existent.
- Si el capítol té partides, fusionar-lo les conserva i elimina el nom repetit.
- Si és buit, apareix l’acció directa `Eliminar buit`.
- Es poden crear capítols nous des de la capçalera o des del gestor.
- Es detecten possibles capítols repetits ignorant la numeració inicial i petites diferències de plural.
- Per cada grup suggerit es pot triar amb un sol botó quin nom conservar; mai es fusiona automàticament.

## Llibreria única i capítols compartits V87.201

- Hi ha una sola llibreria de partides; ja no existeixen els àmbits separats global/client.
- El client és només un filtre i una vinculació opcional per localitzar les partides que utilitza habitualment.
- Hi ha un únic catàleg persistent de capítols compartit per tots els filtres i editors de la llibreria.
- Els capítols es poden crear, canviar de nom, fusionar i eliminar si són buits des d’un únic gestor.
- Un capítol nou apareix immediatament als desplegables de creació, edició, moviments massius i safata pendent.
- A la safata, el capítol importat es mostra com a capítol d’origen i abans de guardar cal escollir el capítol final.
- Dins dels pressupostos es consulta la mateixa llibreria única, amb un filtre opcional per veure només les partides relacionades amb aquell client.
- Afegir una partida a un pressupost la relaciona automàticament amb el client, sense copiar-la ni crear una segona llibreria.

## Safata de partides i codis V87.200

- Nova safata `Partides detectades pendents de revisar`.
- Recupera les antigues llibreries separades per client i les línies de tots els pressupostos dels expedients.
- Mostra per separat les aparicions totals, les partides tècniques úniques, l’origen i el client.
- Permet cercar i filtrar per origen, client i capítol.
- Permet seleccionar una partida o moltes, assignar el capítol final i incorporar-les a la llibreria única.
- Les coincidències tècniques s’unifiquen quan es guarden; la safata conserva el recompte d’aparicions.
- La safata mostra 100 resultats inicials i permet carregar-ne 100 més sense bloquejar la pantalla.
- Nou format de codi curt: `PREFIX_PARAULA_001`, per exemple `MA_BAST_001`.
- El prefix, la paraula clau i el número correlatiu es poden editar individualment a cada partida.
- Les partides creades o recuperades generen el codi curt automàticament, però després es pot personalitzar.

## Llibreria controlada V87.199

- Importar un pressupost o un Excel ja no afegeix automàticament totes les partides a la llibreria.
- Cada partida només entra a la llibreria quan l’usuari prem expressament `Desar a la llibreria`.
- El filtre de capítols i el gestor de capítols treballen sobre el mateix àmbit: global, client o tota la llibreria.
- El gestor permet cercar, canviar el nom i fusionar capítols sense barrejar àmbits involuntàriament.
- Nou filtre d’origen per localitzar les partides importades per versions anteriors.
- Selecció múltiple per moure partides de capítol o eliminar les que no es vulguin conservar.
- Els codis interns segueixen l’esquema `INICIALS-CONSEPTE-0001`, per exemple `ED-BASTIDA-0001`.
- Botó per regenerar els codis antics `LIB-000001` amb el nou esquema.
- S’elimina de la pantalla el codi visible orientatiu; el pressupost continua generant la seva numeració pròpia.
- Tipografia, camps, filtres i targetes ampliats per facilitar la lectura en ordinador i mòbil.

## Canvi directe de capítol V87.198

- El selector superior passa a dir `Filtrar per capítol` i només filtra la llista.
- Dins de cada partida hi ha un desplegable real `Canviar de capítol`.
- En seleccionar un capítol, el canvi es desa immediatament.
- Es mostra el missatge verd `Capítol canviat i guardat`.
- L’opció `Crear un capítol nou` permet afegir una classificació nova.

## Gestió de capítols V87.197

- Nou desplegable `Gestionar capítols de la llibreria` al menú principal Llibreria.
- Permet canviar el nom d’un capítol a totes les seves partides de cop.
- Si el nom nou ja existeix, els dos capítols es fusionen sense perdre partides.
- Permet passar totes les partides d’un capítol a `General`.
- Mostra el nombre de partides globals i clients vinculats a cada capítol.
- Disseny plegable i adaptat a mòbil.

## Pressupost

- S’elimina de la vista principal el bloc duplicat de versions amb les accions Duplicar/Eliminar.
- El total del pressupost queda destacat a la dreta.
- Les accions es concentren en un desplegable.
- Origen, importació i annexos queden dins un segon desplegable.
- Al mòbil cada partida és plegable i disposa d’un selector únic d’accions.
- Des de la partida es pot guardar expressament a la llibreria única i relacionar-la amb el client de l’expedient.

## Llibreria central

- Nova pestanya `Llibreria` al menú principal.
- Vista completa i vista filtrada per client sobre la mateixa llibreria.
- Identificador intern descriptiu i estable separat del codi propi de cada pressupost.
- El codi, el capítol i el preu no creen duplicats.
- Les coincidències es determinen pel contingut tècnic: concepte, descripció i unitat.
- Els preus diferents queden a l’històric de la mateixa partida.
- Les antigues llibreries es conserven, però les noves importacions no hi incorporen partides automàticament.
- Dins d’un expedient es consulta tota la llibreria o només les partides relacionades amb el client.
- Una partida utilitzada en un expedient queda vinculada al client sense duplicar-se.
- La llibreria forma part del Supabase Sync i de la còpia JSON local.
