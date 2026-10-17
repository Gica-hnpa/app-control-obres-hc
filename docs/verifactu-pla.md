# VeriFactu a Control d'Obres — pla de feina (17/10/2026)

Decisions de l'Héctor (16/10/2026):
- **Qui factura amb l'app:** tothom que tingui l'opció. Ell, com a autònom, i també les constructores (S.L.).
- **Obligatori:** les **S.L. des de l'1/1/2027**, els autònoms des de l'1/7/2027. El fabricant del programa hi està obligat des del 29/07/2025.
- **Com s'envia:** amb un **intermediari** (recomanat Verifacti, uns 2,90 € al mes per NIF; alternativa fiskaly). No cal certificat digital a l'app.
- **Qui paga:** **model A**. El compte de l'intermediari és de l'Héctor i ell ho cobra dins de la quota. Hi ha un interruptor per compte.
- **On:** sobretot **dins de les obres**, a «Facturació obra», a partir de les certificacions. És el **mòdul 3**: facturació de les empreses (constructores). També a les factures d'honoraris del tècnic.
- **Fabricant:** encara pendent; ho ha de mirar amb la gestoria.

## Com està ara

- **«Facturació obra»** calcula una **proforma per certificació** (PF-001, PF-002…). Les proformes **no són factures**. Ja hi ha un bloc reservat «VERI*FACTU / factura definitiva».
- **Error trobat i arreglat (V87.284):** l'IVA, la retenció i la deducció de cada proforma es desaven per número (`pf-1`, `pf-2`…) i no per obra: l'IVA posat a la PF-001 d'una obra s'aplicava també a la PF-001 de totes les altres. Ara es desen dins de cada obra. Les proformes d'abans del 17/10/2026 es veuen igual que abans; **l'Héctor ha de revisar l'IVA de les proformes de cada obra** (ara mateix, de la PF-001 a la PF-008 de totes les obres surt un 10 %).
- **Factures d'honoraris** (tècnic): es poden editar i esborrar en qualsevol moment. El número es calcula a l'aparell.
- **Factura (V87.276):** demostració de com funcionarà, amb dades inventades.

## Fet a la V87.285 (17/10/2026, sense pujar; tot provat amb el simulador)

- **App:** a «Facturació obra», si el compte té VeriFactu activat, cada proforma té **«Emetre factura»**. La finestra
  mostra qui emet (NIF del compte), demana el NIF i el nom del client (es proposa el promotor de l'obra) i la descripció
  («Certificació núm. N · obra», en l'idioma dels documents de l'obra), i avisa que després no es podrà canviar.
- **En emetre:** la funció del servidor dona el número (F2026-0001, F2026-0002…), l'envia a l'intermediari i el desa al
  registre del servidor. A l'obra queda la factura (`data.facturesVF878285`), amb l'estat: *No enviada*, *Enviada,
  pendent de resposta*, *Acceptada per Hisenda*, *Acceptada amb errors*, *Rebutjada*, *Anul·lada*.
- **Bloqueig:** l'IVA, la retenció i la deducció d'una proforma facturada ja no es poden canviar, i la certificació no
  es pot eliminar.
- **Si l'intermediari falla:** el número ja és reservat. La factura queda «No enviada» amb «Tornar a enviar», que fa
  servir el **mateix número** (sense forats).
- **Una certificació, una factura:** si dos aparells l'emeten alhora, el servidor torna la mateixa.
- **PDF de la factura:** QR tributari a dalt (`QR tributario:` + `VERI*FACTU`), emissor, client, obra, base, IVA,
  retenció i total; en l'idioma dels documents de l'obra. En l'entorn de proves hi diu «Factura de PROVA». El QR és
  l'adreça de comprovació de l'AEAT; es dibuixa en obrir el PDF (les imatges no es desen dins de les obres).
- **IVA 0 %:** es tracta com a **inversió del subjecte passiu** (S2) i el PDF ho diu.
- **Retenció (IRPF):** surt a la factura i al «A cobrar», però no s'envia a VeriFactu (VeriFactu no la demana).
- **Peces del servidor (escrites, encara NO instal·lades):**
  - `supabase/aco_verifactu_v87285.sql`: comptes activats (`aco_verifactu_comptes`), numeració
    (`aco_series` + `aco_seguent_numero`) i registre (`aco_verifactu_registres`), amb permisos i regles.
  - `supabase/functions/verifactu/index.ts`: accions `compte`, `emetre`, `reenviar`, `estat`, `anular`.
- **Proves:** `tools/proves/vfemetretest.mjs` (21 proves) amb el Supabase de proves, que simula la funció i l'intermediari.

### Què falta (per ordre)

1. **Comprovar amb el compte de proves de Verifacti** el que la documentació pública no diu (està marcat a dalt de
   `index.ts`): la capçalera d'autenticació, el nom de l'entorn a `/nifs/keys/{entorn}/{nif}`, on ve la clau a la
   resposta i el nom del camp d'estat. També si `calificacion_operacion: "S2"` amb tipus 0 és com ho vol.
2. **Anul·lar i rectificatives** a l'app: la funció ja sap anul·lar (`anular`); falta el botó i la factura rectificativa
   (R1–R5, per diferència o per substitució).
3. **Factures d'honoraris del tècnic** pel mateix camí.
4. **Configuració → «Factures amb VeriFactu»**: veure l'estat del compte (avui només es veu a Facturació obra).
5. Afegir el registre del servidor a les **còpies del núvol** (`tools/copies`; el compte de còpies ja el pot llegir).
6. **Declaració responsable** dins de l'app (quan la gestoria digui qui és el fabricant).

### Passos de l'Héctor per posar-ho en marxa (t'hi guio quan vulguis)

1. Crear el **compte de proves de Verifacti** i, a dins, l'empresa de proves. Copiar la **clau del compte** (no la de
   l'empresa).
2. **Supabase → SQL Editor:** executar `supabase/aco_verifactu_v87285.sql`.
3. **Supabase → Edge Functions:** crear la funció `verifactu` amb el codi de `supabase/functions/verifactu/index.ts`.
   A **Secrets**, afegir `VERIFACTI_API_KEY` amb la clau del pas 1 (mai al xat ni al codi).
4. **Activar un compte** (p. ex. Brava, en proves): Table Editor → `aco_verifactu_comptes` → afegir la fila amb el seu
   `user_id`, `actiu` = true, `entorn` = test, NIF, nom i adreça (hi ha l'exemple al final de l'SQL).
5. Emetre una factura de prova des d'una obra de prova i mirar-la al panell de Verifacti.

## Com quedarà

1. **De proforma a factura.** A «Facturació obra», cada proforma tindrà el botó **«Emetre factura»**.
   - Només funciona amb connexió.
   - Només si el compte té VeriFactu activat.
2. **En emetre:**
   - l'app demana el **número** al servidor (correlatiu per sèrie i any; dos aparells no poden fer el mateix número);
   - desa la factura a l'obra i l'envia a l'intermediari a través d'una funció del servidor (la clau no és mai al mòbil);
   - l'intermediari encadena l'empremta, l'envia a Hisenda i retorna l'estat i el codi QR.
3. **Factura emesa:**
   - queda **bloquejada**: no es pot editar ni esborrar;
   - el PDF porta el QR i el text «VERI*FACTU»;
   - l'estat es veu a la llista: *enviada*, *acceptada*, *amb errors*.
4. **Corregir:**
   - **factura rectificativa**, per diferència o per substitució (tipus R1–R5 de l'AEAT);
   - **anul·lació**, si escau.
5. **Sense cobertura:** no es pot emetre, però sí preparar la proforma. És més segur que numerar sense connexió.
6. **Factures d'honoraris del tècnic:** el mateix camí («Emetre» des de l'esborrany).
7. **Interruptor per compte:** «Factures amb VeriFactu» a Configuració. Només el pot activar l'Héctor.

## Peces tècniques

- **Base de dades (Supabase), un SQL nou amb `grant`:**
  - `aco_series`: comptador per compte, sèrie i any, amb una funció que dona el número següent de manera segura;
  - `aco_verifactu_comptes`: compte, NIF, activat sí/no, identificador a l'intermediari. Les claus van com a secret de la funció, no a la taula.
- **Funció del servidor `verifactu`** (Edge Function): rep la factura de l'app (amb la sessió de l'usuari), comprova que el compte la pot emetre, crida l'intermediari i retorna l'estat i el QR. També consulta l'estat més tard.
- **Proves:** un simulador de l'intermediari dins del Supabase de proves, perquè tot es pugui provar sense enviar res de debò.

## Què ha de fer l'Héctor

1. **Gestoria:** qui és el fabricant del programa (tu o una societat). Amb això s'omple la **declaració responsable**, que ha de sortir dins de l'app; Verifacti en dona la plantilla.
2. **Verifacti:** crear el compte de proves (gratis) i, quan estigui provat, el de producció. T'ho guio pas a pas.
3. **Supabase:** executar l'SQL nou i desplegar la funció. També t'ho guio.
4. **Cada empresa** (Brava, Socoterm…):
   - posar les seves dades fiscals a l'app;
   - signar l'autorització de representació que facilita l'intermediari (una sola vegada).

## Calendari proposat

| Setmana | Què |
|---|---|
| 1 | ~~Arreglar l'IVA de les proformes~~ (fet, V87.284); «Emetre factura» a Facturació obra, bloqueig, numeració al servidor, PDF amb QR. Tot amb el simulador |
| 2 | Funció del servidor i connexió amb Verifacti (entorn de proves), estat, rectificatives i anul·lacions. Factures d'honoraris |
| 3 | Proves amb dades de prova de Brava i Socoterm, declaració responsable, interruptor per compte |
| Desembre | Producció per a les S.L. que vulguin facturar amb l'app abans de l'1/1/2027 |
