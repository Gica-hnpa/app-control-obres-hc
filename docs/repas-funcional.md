# Repàs funcional: usuari per usuari, pestanya per pestanya

L'Héctor, 28/10/2026: «ves pujant versions noves centrant-te en cada usuari i en cada pestanya de l'app i en cada subpestanya»; «coses molt
bàsiques fallen… així no podem ensenyar res al client».

**Com es prova:** com un client de debò, no només mirant la pantalla. A cada pestanya: crear, triar, omplir, desar, recarregar i comprovar que
les dades hi són i que surten bé als altres llocs (Contactes, documents PDF, llistes, Inici, Rendiment). També amb dades «brutes» com les de
debò: fitxes repetides, camps «Pendent», «972 XXX XXX», noms escrits diferent. Cada tanda té la seva prova `vNNNtest.mjs` i es publica.

Comptes de prova (Supabase de proves): `demo-tecnic`, `demo-constructor`, `demo-gestio` (gestió total), `demo-treballador`; i una còpia de les
dades de l'Héctor (`ACO_DADES_DIR`).

## Fet

| Versió | Què | Prova |
|---|---|---|
| V87.413 | Partides noves i les que pugen en taronja; «Marcar com a nova» a mà | `v413test` (24) |
| V87.414 | Dades de l'obra: els camps s'omplen amb Contactes; cercador per blocs sense repetits | `v414test` (17) |
| V87.415 | Les fitxes de client de farciment s'omplen soles amb Contactes; desar un client posa al dia les seves còpies; «Nova obra» tria el client de Contactes | `v415test` (18) |
| V87.416 | Triar l'obra amb el cercador (cita, «+ Afegir hores», hores del treballador); «+ Afegir feina» de l'Inici per l'expedient; dates «28 d’octubre» | `v416test` (23) |
| V87.417 | Canviar una persona a Contactes (o la fitxa d'un client) la canvia a les obres (promotor, constructora, tècnics); el mòbil a la fitxa del contacte i del client; un client eliminat surt de Contactes | `v417test` (18) |

## Per fer (ordre)

### 1. Contactes i persones (a tot arreu on es tria algú)
- [x] Dades de l'obra (client, promotor, constructora, tècnics, industrials).
- [x] Nova obra (client).
- [x] Contactes: crear, editar (també un contacte que és client i agent alhora), eliminar; que surti igual a Dades, a les actes i a «Enviar».
- [x] Agenda: la cita amb l'obra (cercador). Hores i feines de l'Inici, també.
- [ ] Empresa › Industrials i Treballadors: crear, editar, documents; que surtin al Planning, als partes i a Agenda › Equip.

### 2. Tècnic (`demo-tecnic`)
- [ ] Inici: requadres, cites, feines (crear, fer, vençudes), nota de veu.
- [ ] Expedients: paquets, filtres, cercador, nou expedient de cada tipus (cèdula, CEE, ITE, amiant, direcció d'obra).
- [ ] Dins d'un encàrrec: Resum (passos, documents del tràmit, enllaços), Dades, Documents (adjuntar, enviar), Visites (acta: assistents,
      fotos, dictat, PDF, signar), Agenda, Honoraris (pressupost, calculadora, factura, hores, rendiment), Despeses.
- [ ] Pressupostos, Hores, Facturació (factura, cobrament, gestoria, gràfiques), Les meves despeses, Rendiment, Ajustos.

### 3. Constructora (`demo-constructor`)
- [ ] Inici, Obres (nova, importar), Preus (llibreria, banc), Hores (personal, fitxatge), Facturació, Despeses (foto, Excel, mà d'obra),
      Rendiment, Agenda (Equip), Empresa (dades, treballadors, documentació, industrials, calendari), Ajustos.
- [ ] Dins d'una obra: Resum, Dades, Documents; Visites, Agenda, Partes (fer, revisar, certificar), Planning; Amidaments (llegir, preus,
      passar a pressupost), Pressupost (editar, afegir, dictar, inicial, PDF, enviar, signar), Certificacions (editar, PDF, factura),
      Facturació, Despeses, Rendiment.

### 4. Gestió total (`demo-gestio`) i treballador (`demo-treballador`)
- [ ] Que cada un vegi només el que li toca i que tot el que fa el treballador (hores, despeses, notes) arribi a l'oficina.

### 5. Mòbil i iPad
- [ ] Els mateixos recorreguts a 390 px i 820 px: res tallat, menús que s'obren, botons que no es tapen (com el ＋ i «Guardar dades»).
