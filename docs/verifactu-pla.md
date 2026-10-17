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
- **Error trobat:** l'IVA, la retenció i la deducció de cada proforma es desen per número (`pf-1`, `pf-2`…) i no per obra. L'IVA posat a la PF-001 d'una obra s'aplica també a la PF-001 de totes les altres. S'ha d'arreglar abans de fer factures de debò.
- **Factures d'honoraris** (tècnic): es poden editar i esborrar en qualsevol moment. El número es calcula a l'aparell.
- **Factura (V87.276):** demostració de com funcionarà, amb dades inventades.

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
| 1 | Arreglar l'IVA de les proformes; «Emetre factura» a Facturació obra, bloqueig, numeració al servidor, PDF amb QR. Tot amb el simulador |
| 2 | Funció del servidor i connexió amb Verifacti (entorn de proves), estat, rectificatives i anul·lacions. Factures d'honoraris |
| 3 | Proves amb dades de prova de Brava i Socoterm, declaració responsable, interruptor per compte |
| Desembre | Producció per a les S.L. que vulguin facturar amb l'app abans de l'1/1/2027 |
