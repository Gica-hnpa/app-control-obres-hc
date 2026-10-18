# Proposta: perfil tècnic, encàrrecs de cèdules, certificats energètics i inspeccions (18/10/2026)

*Per a l’Héctor. **No canvia res de l’app** fins que digui sí. Les dades de normativa (terminis, validesa, organisme)
són les que conec; **s’han de confirmar** abans de posar-les a l’app.*

---

## 1. La idea

Avui, cada encàrrec petit (una cèdula, un certificat energètic, una inspecció) es fa «de memòria»:

1. demanar papers al client;
2. anar a la visita i apuntar dades;
3. passar-ho al programa (CE3X, l’informe…);
4. tramitar-ho;
5. lliurar-ho i facturar-ho.

Proposta: que **cada tipus d’encàrrec tingui la seva plantilla**. En crear l’obra, l’app ja ho porta tot preparat:

| Què | Com ajuda |
|---|---|
| **Passos de l’encàrrec** (llista de comprovació) | Res s’oblida; es veu en quin pas és cada encàrrec |
| **Correu per demanar la documentació al client** | Un clic: la llista del que necessites (referència cadastral, plànols, factures…) |
| **Fitxa de visita al mòbil** | Els camps que cal prendre per a aquell tipus; cada punt amb «Correcte · Deficiència · No aplica», foto i nota, sense cobertura i amb dictat |
| **Informe en PDF** | Amb les dades, les fotos numerades i les deficiències. Serveix de base per al certificat o l’annex |
| **Honoraris tipus** | Preu fix o per m²: el pressupost surt en un minut |
| **Hores** | El comptador ja hi és. Es veu quant et costa de debò cada tipus d’encàrrec (si és rendible) |
| **Venciments** | Quan caduca cada certificat o cèdula: avisos per tornar a trucar el client (**feina nova cada any**) |

---

## 2. Els tres encàrrecs

### 2.1 Certificat energètic (CEE)

*(Validesa: 10 anys, i 5 si la qualificació és G. Visita presencial obligatòria. Registre a l’ICAEN. Programes: CE3X,
HULC, CYPETHERM. **A confirmar**.)*

| Pas | Llista de comprovació |
|---|---|
| 1. Encàrrec | Dades del client i de l’immoble · referència cadastral · ús (habitatge, local…) · pressupost acceptat |
| 2. Documentació | Plànols o croquis · any de construcció · factures o dades de les instal·lacions · reformes fetes |
| 3. Visita | Orientació i superfícies · façanes, coberta i terra (tipus, aïllament) · finestres (vidre, marc, persianes) · calefacció, aigua calenta, refrigeració (tipus, any, potència) · fotos de cada element |
| 4. Oficina | Passar-ho a CE3X (l’app et dona la fitxa amb les dades en l’ordre del programa) · millores proposades |
| 5. Tràmit | Registre a l’ICAEN · etiqueta |
| 6. Lliurament | Certificat i etiqueta al client · factura · **venciment d’aquí a 10 anys** |

### 2.2 Cèdula d’habitabilitat (segona ocupació)

*(Validesa de la cèdula de segona ocupació: 15 anys. La dona l’Agència de l’Habitatge de Catalunya a partir del
certificat del tècnic. Condicions mínimes del Decret 141/2012. **A confirmar**.)*

| Pas | Llista de comprovació |
|---|---|
| 1. Encàrrec | Dades del propietari i de l’habitatge · referència cadastral · pressupost |
| 2. Documentació | Cèdula anterior (si n’hi ha) · escriptura o nota simple · plànol |
| 3. Visita | Superfície útil de cada peça · alçades lliures · obertures (il·luminació i ventilació) · programa mínim (estança, cuina, bany) · aigua, electricitat i desguassos · fotos |
| 4. Oficina | Croquis amb superfícies (l’app suma la superfície útil) · certificat |
| 5. Tràmit | Presentació a l’Agència de l’Habitatge |
| 6. Lliurament | Cèdula al client · factura · **venciment d’aquí a 15 anys** |

### 2.3 Inspecció tècnica de l’edifici (ITE / IITE)

*(A Catalunya, als edificis d’habitatges de més de 45 anys i després cada 10 anys. Les deficiències es classifiquen en
molt greus, greus, importants i lleus. Decret 67/2015. **A confirmar**.)*

| Pas | Llista de comprovació |
|---|---|
| 1. Encàrrec | Comunitat de propietaris · president o administrador · edifici (any, plantes, habitatges) · pressupost |
| 2. Documentació | ITE anterior · llibre de l’edifici · obres fetes · plànols |
| 3. Visita | Per elements: fonaments i estructura · façanes i balcons · coberta · instal·lacions comunes · zones comunes. Cada deficiència amb **gravetat**, foto i ubicació |
| 4. Oficina | Informe amb les deficiències ordenades per gravetat · qualificació de l’edifici · actuacions i terminis |
| 5. Tràmit | Presentació a l’Agència de l’Habitatge |
| 6. Lliurament | Informe a la comunitat · factura · **propera inspecció d’aquí a 10 anys** · seguiment de les obres (pot passar a ser una obra) |

---

## 3. Com es veuria a l’app

- En crear una obra de tipus «Certificat energètic», «Cèdula d’habitabilitat» o «ITE / IEE / inspecció d’edifici», la
  pestanya **Resum** mostra els **6 passos** i en quin és. Cada pas té la seva llista de comprovació.
- Dins del bloc **Seguiment**, un apartat nou, **«Visita»**: la fitxa de visita del tipus d’encàrrec, al mòbil i sense
  cobertura.
- A **Documents**, «Demanar documentació al client» (correu ja fet) i «Informe de la visita» (PDF).
- A **Inici**, una llista d’**encàrrecs per pas** («3 per visitar · 2 per tramitar · 1 per facturar»).
- A **Clients**, «**Venciments**»: certificats i cèdules que caduquen els propers 12 mesos (per trucar-los).

---

## 4. Ordre proposat

| Versió | Què | Per què primer |
|---|---|---|
| 1 | **Passos i llistes de comprovació** per als tres tipus, i la llista a Inici | És la base; ja ajuda des del primer dia |
| 2 | **Fitxa de visita al mòbil** per al certificat energètic, i el PDF de la visita | És el més repetitiu |
| 3 | La fitxa de visita de la cèdula (amb la suma de superfícies) i de la ITE (amb la gravetat) | |
| 4 | **Correu de documentació, honoraris tipus i venciments** | Fan guanyar temps i porten feina nova |

---

## 5. Què et demano

1. **Quants en fas al mes** de cada tipus (certificats, cèdules, inspeccions)? Quin et fa perdre més temps?
2. Quin **programa** fas servir per als certificats (CE3X, HULC, CYPETHERM)?
3. Els **passos i les llistes** de comprovació del punt 2, s’assemblen a com treballes? Què hi falta o hi sobra?
4. Vols el **PDF de la visita** amb el teu logo, com les actes?
5. Hi ha **altres encàrrecs** que facis sovint i que vulguis amb plantilla (llicències, informes, final d’obra…)?
