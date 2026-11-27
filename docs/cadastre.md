# Cadastre i cèdules a Dades (V87.670)

L’Héctor, 27/11/2026: «a veure si posant l’adreça la pugues buscar [la referència cadastral]»; «en cèdules… que em digui si existeix
cèdula anterior caducada o vigent»; «un botó… descarregar la fitxa de la finca treta del cadastre i que després automàticament
s’adjunti a documents en documentació prèvia».

## Què fa l’app

A **Dades › Obra**, al costat de la referència cadastral:

- **Buscar per l’adreça:** amb el municipi, el carrer i el número (els de Dades; es poden canviar a la finestra) busca als serveis
  públics del Cadastre (`ovc.catastro.meh.es`, JSON, sense clau, oberts a les webs): el municipi (`ObtenerMunicipios`), el carrer
  (`ObtenerCallejero`; si no el troba sencer, amb la paraula més llarga del nom) i els immobles d’aquell número (`Consulta_DNPLOC`).
  En un edifici amb pisos surt la llista (escala, planta, porta, ús i m²) per triar-ne un, o «Tota la finca» (14 caràcters).
  La referència triada es desa sola. La província surt del codi postal (08, 17, 25, 43; si no, Girona).
- **Fitxa del Cadastre:** baixa la «Consulta descriptiva i gràfica» (PDF) de l’immoble (20 caràcters; si només hi ha la de la finca
  i té més d’un immoble, demana quin) i la desa a **Documents › 01 · Documentació prèvia** («Fitxa cadastral <referència>.pdf»).
  La Seu del Cadastre no deixa que el navegador la baixi directament (CORS), per això cal la funció del núvol `aco-cadastre`.
  **Sense la funció** surt «L’app encara no la pot desar sola. Obrir-la al Cadastre» (l’enllaç de la Seu: el navegador la baixa i
  s’afegeix a mà a Documents).
- **Cèdules anteriors** (només als encàrrecs de cèdula): les dades obertes de la Generalitat «Cèdules d’habitabilitat»
  (`analisi.transparenciacatalunya.cat/resource/3pqu-s3ga.json`, unes 3,6 milions, posades al dia cada dia, obertes a les webs).
  Busca per la referència de 20 caràcters; si només hi ha la de la finca, totes les de l’edifici; sense referència, per l’adreça.
  - **Vigent** = «Atorgada» i la data de fi de vigència no ha passat (n’hi ha d’«Atorgada» que ja han caducat).
  - El tipus (primera o segona ocupació) no hi surt: es veu la durada («15 anys», «25 anys»…).
  - Al 13 % de les cèdules els falta la referència cadastral: que no en surti cap no vol dir que no n’hi hagi.

A la **capçalera de l’obra** surt l’adreça de Dades (carrer i població).

## Instal·lar la funció `aco-cadastre` (l’Héctor, una vegada)

No cal cap secret ni cap SQL. És com la de la IA:

1. Supabase › projecte «app control de obras» › **Edge Functions › Deploy a new function › Via Editor**.
2. Nom: `aco-cadastre`. Enganxar tot el contingut de `supabase/functions/aco-cadastre/index.ts` › **Deploy**.
3. A la pestanya **Settings** de la funció, apagar **Verify JWT with legacy secret** i **Save changes** (la funció comprova ella
   mateixa que qui la crida és un compte connectat de l’app, i només des de l’app).
4. Provar-ho: una obra amb referència cadastral › Dades › «Fitxa del Cadastre» › ha de sortir «✓ Desada a Documents › 01 ·
   Documentació prèvia».

La funció només baixa el PDF públic de la Seu del Cadastre per a la referència que se li passa (20 caràcters); no desa res. Com a molt 10
fitxes per minut i compte.
