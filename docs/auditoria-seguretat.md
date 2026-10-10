# Auditoria de seguretat i del núvol — 10/10/2026

Versió revisada: **V87.259.2** (commit `410d833`). Només és una revisió: **no s'ha canviat res**, ni
al codi ni a Supabase.

**Com s'ha fet**
- S'ha llegit el codi (`src/App.jsx`, `src/cloudSync.js`, `src/cloudConfig.js`), els fitxers SQL de
  `supabase/`, la funció `llegir-albara` i tot l'historial de Git.
- Supabase real, **sense entrar a cap compte**: s'ha mirat només el que veuria un desconegut amb la
  clau pública de l'app. S'han demanat recomptes, no dades. Tampoc s'ha llegit cap fila.
- Regles de seguretat (RLS): s'han carregat els **mateixos fitxers SQL** en una base de dades Postgres
  de proves a l'ordinador. S'hi han fet 18 proves amb tres usuaris inventats («hector», «brava»,
  «oriol»), sense dades reals.
- Espai: s'ha mirat només la **mida** del fitxer `DADES` (no se n'ha obert el contingut).

**Llegenda:** ✅ bé · ⚠️ a mitges · ❌ falta
**Urgència:** 🔴 aquesta setmana · 🟠 abans d'afegir més empreses · 🟡 abans de vendre-ho · 🟢 res a fer

---

## Resum en una taula (ordenat per urgència)

| # | Tema | Estat | Urgència |
|---|---|---|---|
| A | Correu dels comptes d'empresa: el domini `controlobres.app` no és teu | ❌ | 🔴 |
| B | Qualsevol persona es pot crear un compte al teu Supabase | ❌ | 🔴 |
| C | Còpies de seguretat del núvol (pla gratuït: cap) | ❌ | 🔴 |
| D | Contrasenyes escrites al codi (`hector`, `pol`, `socoterm`) | ❌ | 🔴 |
| E | Rols: el portal de client només amaga botons | ❌ | 🟠 |
| F | Sincronització quan dues persones editen alhora | ⚠️ | 🟠 |
| G | Espai: fotos i PDF dins la base de dades (límit 500 MB) | ⚠️ | 🟠 |
| H | Obres compartides: 3 punts febles | ⚠️ | 🟠 |
| I | Canvi de Supabase del 30/10/2026 | ⚠️ | 🟠 (té data) |
| J | Funció d'albarans amb IA (abans de posar-la en marxa) | ⚠️ | 🟠 |
| K | Arxius (Storage) i taula antiga de juliol | ⚠️ | 🟡 |
| L | Estructura de dades (`aco_kv` / `aco_shared`) | ⚠️ | 🟡 |
| M | Separació entre empreses a `aco_kv` (RLS) | ✅ | 🟢 |
| N | Clau `service_role` | ✅ | 🟢 |

---

## 🔴 A. El correu dels comptes d'empresa és d'un domini que no és teu — ❌

*(Punts 2 i 3 de la teva llista)*

**Què passa.** `brava`, `socoterm`, `oriol` i `marti` són, per dins, correus
`<usuari>@usuaris.controlobres.app`. He comprovat que el domini **`controlobres.app` no existeix**: ningú
no l'ha registrat. Qualsevol persona el pot comprar per uns 15 € l'any. A més, la pantalla «He oblidat la
contrasenya» de Supabase la pot fer servir qualsevol persona.

**Per què importa.** Qui compri aquest domini rebrà els correus de «restablir la contrasenya» de
**tots** els comptes d'empresa. Podria canviar-los la contrasenya i entrar a les seves obres. També
podria crear comptes nous amb aquest domini i fer-se passar per una empresa de la prova pilot.

**Què fer (sense programar):**
1. **Registra tu el domini `controlobres.app`**, encara que no el facis servir per a res. És el més ràpid
   i ho tanca del tot. Alternativa: canviar els comptes d'empresa a correus reals de cada empresa, o
   a un domini que ja sigui teu.
2. Mentre no ho facis, no comparteixis enlloc que els comptes funcionen amb aquest domini.

---

## 🔴 B. Qualsevol persona es pot crear un compte al teu Supabase — ❌

*(Punts 2 i 3)*

**Què he vist.** La configuració pública del teu projecte diu `disable_signup: false`: el registre és
obert. Cal confirmar el correu, però qualsevol correu real serveix.

**Per què importa.** Un desconegut no pot veure les teves dades ni les de les empreses (les proves de
RLS ho confirmen, vegeu M). Però sí que pot:
- **Omplir la base de dades** pujant dades fins als 500 MB del pla gratuït. Quan s'omple, el projecte
  queda en «només lectura» i l'app deixa de desar per a tothom.
- **Fer-te arribar obres falses**, que surten a la teva llista com a «Compartida per Héctor Cubero» o
  com a qualsevol altre nom (vegeu H).
- Quan posis en marxa la lectura d'albarans amb IA, **fer-la servir i gastar-te crèdit d'Anthropic**
  (vegeu J).

**Què fer:** Supabase → *Authentication → Sign In / Providers* → desactivar **«Allow new users to sign
up»**. Els comptes nous els continuaràs creant tu des del panell (*Authentication → Users → Add user*),
com ja fas ara. És un sol clic i no afecta els comptes que ja existeixen.

---

## 🔴 C. Còpies de seguretat del núvol — ❌

*(Punt 8)*

**Què té el teu pla.** El pla gratuït de Supabase **no fa cap còpia automàtica**. Supabase recomana fer
les còpies tu mateix. El pla Pro (des de 25 $/mes) en fa una cada dia i les guarda 7 dies. A més, el
pla gratuït **es posa en pausa si fa 7 dies que ningú no l'usa**: les dades no es perden, però l'app no
connecta fins que el reactives des del panell.

**Com estàs ara:**

| Dades | Còpia | Estat |
|---|---|---|
| Les teves (compte `hector`) | Fitxer `DADES` a l'ordinador + còpia diària a `COPIES_AUTOMATIQUES` | ✅ |
| Les de les empreses (`brava`, `socoterm`, `oriol`, `marti`) | Només al núvol i als seus aparells | ❌ |
| Obres compartides (`aco_shared`) | Només al núvol | ❌ |

**Com restauraries avui:**
- **Les teves dades:** posa la marca `forcarNuvol: true` al fitxer `DADES` i obre l'app des de
  l'ordinador. El núvol queda igual que el fitxer (ja ho vas fer el 09/10).
- **Les dades d'una empresa:** no hi ha manera. Si un aparell seu les esborra i el fre de seguretat no
  ho atura (per exemple, una sola obra buidada), es perden.

**Què fer:**
1. Ara mateix: una **còpia setmanal** feta des del teu ordinador. Es pot fer amb
   `supabase db dump`, o amb un petit programa que guardi a `DADES` el contingut de `aco_kv` i
   `aco_shared`, compte per compte. Es pot preparar quan vulguis.
2. Quan les empreses hi treballin de debò: **passar a Pro**, per tenir còpies diàries i perquè el
   projecte no es posi en pausa.

---

## 🔴 D. Contrasenyes escrites al codi — ❌

*(Punt 1)*

**Què hi ha.** A `src/App.jsx`, línies 20–22, hi ha tres comptes interns amb la contrasenya escrita:

| Compte | Contrasenya al codi | Des de quan |
|---|---|---|
| `hector` | `0000` | És a 29 versions de l'historial de GitHub |
| `pol` | `1919` | És a 29 versions de l'historial de GitHub |
| `socoterm` (portal de client intern) | `socoterm` | És a 29 versions; també surt escrita a la pantalla de Configuració (línia 10687) i al `README.md` |

**Per què importa.** El repositori de GitHub és privat, però **l'app publicada a Render no ho és**.
Qualsevol persona pot obrir l'adreça de Render i llegir aquestes contrasenyes dins el codi que rep el
navegador. Per sort, **no són les del núvol**: per entrar a les dades del núvol cal el correu i la
contrasenya de Supabase, que no són enlloc del codi. Aquestes tres contrasenyes només obren la segona
porta, la de dins l'app. Aquesta porta protegeix les dades que ja hi ha **a l'aparell**. Si algú agafa
el teu mòbil o l'ordinador amb la sessió del núvol oberta, `0000` no l'atura.

**Altres claus revisades:**
- **Clau pública de Supabase** (`sb_publishable_…`, a `cloudConfig.js`): està feta per anar al codi. ✅
  No s'ha de canviar.
- **Contrasenyes de les empreses al núvol:** no són al codi ni a GitHub ✅. Són als PDF de
  `GUIES_USUARIS`, que no es pugen. Però les empreses **no poden canviar-se-la des de l'app**: el botó
  «Canviar contrasenya» només canvia la dels comptes interns. ⚠️
- **Còpia de juliol a l'historial de GitHub:** porta dins la configuració del sistema de núvol antic
  (V87.121), amb una «clau privada de sincronització». Avui ja no obre res, perquè aquella taula està
  tancada (vegeu K). Quedarà neta quan s'esborri l'historial, que ja és a la llista de pendents.
- **Clau `service_role` i clau d'Anthropic:** no hi són ✅ (vegeu N).

**Quines s'han de canviar:** `0000`, `1919` i `socoterm`. Totes tres s'han de considerar públiques.
Si alguna d'aquestes s'assembla a la contrasenya del teu compte de Supabase o del teu correu, canvia
també aquella.

**Com treure-les del codi (quan es programi):**
1. **Treure la segona porta amb contrasenya fixa.** El teu compte del núvol ja t'identifica. Si vols
   una segona protecció a l'aparell, ha de ser un PIN que tries tu i que es guardi xifrat a l'aparell,
   mai escrit al codi.
2. **`pol`:** esborrar-lo, o fer-li un compte de núvol de proves.
3. **Portal `socoterm` intern:** substituir-lo per un compte de client al núvol (vegeu E).
4. Afegir un botó perquè cada empresa **canviï la seva contrasenya del núvol**.

---

## 🟠 E. Rols: què pot veure i fer cadascú — ❌ al portal de client

*(Punt 3)*

| Rol | Com entra | Què veu | Què pot fer | On es comprova |
|---|---|---|---|---|
| **Tu** (`hector`) | Compte de núvol + `hector`/`0000` a l'app | Tot el teu despatx | Tot, i compartir obres | ✅ **Servidor**: només les teves files |
| **`pol`** | `pol`/`1919` a l'app, **dins la teva sessió de núvol** | Un espai buit | Administrador del seu espai | ❌ Només a l'aparell: les seves dades es desen al **teu** compte del núvol |
| **Portal client intern** (`socoterm`/`socoterm`) | Dins la **teva** sessió de núvol | Només les obres del seu client i les pestanyes permeses | Llegir; editar pressupost i certificacions | ❌ **Només s'amaguen botons** (vegeu sota) |
| **Comptes d'empresa** (`brava`, `socoterm`, `oriol`, `marti`) | Compte de núvol propi | El seu espai i les obres que els comparteixen | Administrador del seu espai | ✅ **Servidor** (RLS provat) |
| Convidat a una obra **«només consulta»** | El seu compte | Fitxa, dades i foto de l'obra | No pot desar canvis | ✅ Servidor. ⚠️ La pantalla el deixa editar, però els canvis no es pugen i es perden sense avís |
| Convidat a una obra **«pot editar»** | El seu compte | Fitxa, dades i foto de l'obra | Modificar; no pot esborrar-la ni canviar amb qui es comparteix | ✅ Servidor (amb un forat, vegeu H) |

**El problema del portal de client.** El portal intern funciona dins la teva sessió del núvol. Per tant,
**a l'aparell on s'obre hi ha totes les teves dades, de tots els clients**. El portal només amaga el que
el client no ha de veure. Algú que sàpiga obrir les eines del navegador (F12) ho pot veure tot. A més,
el que el client hi canvia es desa amb el **teu** compte.

**Quan és segur:** només si el client el fa servir en un aparell teu i al teu davant.
**No és segur** per donar accés al client des del seu propi mòbil o ordinador.

**Altres coses:**
- Hi ha dos `socoterm`: l'intern (portal) i el del núvol (constructor). Si algun dia la contrasenya del
  núvol fos també `socoterm`, l'app entraria al portal intern en lloc de fer-ho al seu compte. Convé
  canviar el nom de l'intern.
- Ara tota una empresa comparteix **un sol usuari**. No es pot saber qui ha fet cada canvi ni donar
  permisos diferents a cada treballador.

**Què fer:** el portal de client real ha de ser un compte de núvol del client. El servidor li ha de
donar només les obres compartides amb ell, com ja fan les obres compartides. Encaixa amb el pendent
«Portal de client amb compte de núvol propi».

---

## 🟠 F. Sincronització: dues persones alhora o sense cobertura — ⚠️

*(Punt 6)*

**Com funciona ara.** Les dades viatgen per **peces**. Cada obra és una peça amb tot el que porta
(pressupost, certificacions, etc.). Altres coses són una sola peça per a tot el compte: la llista
d'obres, la **llista d'albarans**, les hores, l'agenda, els clients… Cada aparell puja els seus canvis
al cap de pocs segons. Cada 20 segons, i en tornar a l'app, mira si n'hi ha d'altres aparells.

**Norma «guanya el núvol» ✅.** Si la mateixa peça ha canviat al núvol des d'un altre aparell, la versió
del núvol guanya. Això evita el que va passar el 09/10: un aparell amb dades velles ja no pot trepitjar
les bones.

**Però hi ha el preu (⚠️):**
- **Dues persones de la mateixa empresa** amb el mateix compte, en dos mòbils: si totes dues toquen la
  mateixa peça en pocs segons, **es perd la feina d'una**. Per exemple: totes dues entren un albarà a
  l'obra. Com que tots els albarans són una sola peça, un dels dos desapareix.
- La versió que perd es guarda en una llista amagada d'aquell aparell (les 20 últimes). **No hi ha cap
  pantalla per veure-la ni recuperar-la.** La persona no sap que l'ha perduda.
- Si els dos aparells pugen exactament alhora, el servidor no comprova versions: **guanya l'últim que
  arriba**, també sense avís.

**Sense cobertura a l'obra ✅/⚠️.**
- ✅ L'app continua funcionant. Els canvis queden desats a l'aparell i es pugen quan torna la connexió.
- ⚠️ Si mentrestant algú altre ha tocat la mateixa peça, **es perd tota la feina feta sense
  cobertura** en aquella peça. Com més estona sense cobertura, més risc.

**Fre de seguretat ✅/⚠️.**
- ✅ Atura la pujada si un aparell vol esborrar o buidar 3 obres o més, o si el núvol es quedaria amb
  més de 2 obres menys.
- ⚠️ No protegeix si es buida **una o dues** obres, ni si es buida una llista que no és d'obres
  (albarans, hores, agenda).

**Què fer (quan es programi), per ordre:**
1. Una pantalla «**Canvis que no s'han pogut desar**» amb la llista amagada, per recuperar-los.
2. Separar en peces petites el que més es toca alhora: un albarà, una hora o una cita per peça.
3. Que el servidor rebutgi una pujada si la peça ha canviat des de l'última vegada que l'aparell la
   va llegir.
4. A la llarga, un usuari per persona dins de cada empresa (vegeu L).

Mentrestant, digues a les empreses de la prova que **cada obra la porti una sola persona alhora**.

---

## 🟠 G. Espai: quant ocupa i quan s'acabaria — ⚠️

*(Punt 7)*

**On va cada cosa.** Tot, **fotos i PDF inclosos**, va dins la base de dades (`aco_kv` i `aco_shared`)
com a text. No es fa servir l'espai d'arxius de Supabase (Storage).
- Una foto d'albarà ocupa uns 0,2–0,3 MB.
- Un PDF d'albarà pot ocupar fins a uns 5,5 MB: el límit és de 4 MB, i en passar-lo a text creix un
  terç.
- La foto d'una obra ocupa uns 0,2 MB.

**Límits del teu pla (gratuït):**

| | Gratuït | Pro (25 $/mes) |
|---|---|---|
| Base de dades | **500 MB** | 8 GB |
| Arxius (Storage) | 1 GB (no s'usa) | 100 GB |
| Trànsit de baixada | 5 GB/mes | 250 GB/mes |

Si se superen els 500 MB, la base de dades queda en **només lectura** i ningú no pot desar res.

**Quant ocupa ara.** No ho he pogut mirar sense entrar al teu panell. Les teves dades, al fitxer
`DADES`, fan **13 MB**. Per veure-ho al núvol: Supabase → *SQL Editor* → enganxar i executar (només
llegeix):

```sql
select pg_size_pretty(pg_database_size(current_database())) as base_de_dades;
select u.email, count(*) as peces, pg_size_pretty(sum(octet_length(k.value))::bigint) as mida
  from aco_kv k join auth.users u on u.id = k.user_id group by u.email order by sum(octet_length(k.value)) desc;
select pg_size_pretty(sum(octet_length(coalesce(dades,'')) + octet_length(coalesce(foto,'')))::bigint) as compartides from aco_shared;
```

**Previsió (aproximada).**
- Un **tècnic** com tu fa uns 15 MB l'any.
- Un **constructor** que entri 5 albarans per setmana fa uns 80 MB l'any.
- A tot això cal afegir-hi un 50 % més: la base de dades ocupa més que les dades, sobretot amb tants
  canvis petits.

| Usuaris | Només tècnics | Meitat tècnics, meitat constructors | Només constructors |
|---|---|---|---|
| **10** | ~2 anys | ~8 mesos | ~4 mesos |
| **50** | ~5 mesos | ~6 setmanes | ~3–4 setmanes |
| **200** | ~1 mes | ~1–2 setmanes | ~1 setmana |

Amb **Pro** (8 GB), cada xifra es multiplica per 16. Amb 200 constructors encara s'acabaria en menys
d'un any.

**Què fer:**
1. Ara: executar les consultes de dalt un cop al mes i apuntar el resultat.
2. Abans de passar de ~10 empreses: **treure fotos i PDF de la base de dades** i posar-los a Storage
   (en un espai **privat**, una carpeta per compte). Storage té 1 GB gratuït i 100 GB a Pro, i la base
   de dades queda petita i ràpida.

---

## 🟠 H. Obres compartides: 3 punts febles — ⚠️

*(Punt 2)*

La taula `aco_shared` té RLS activat ✅. Les proves confirmen que només veu una obra qui hi està
convidat, que un lector no pot modificar-la, que un editor no la pot esborrar i que ningú no pot crear
obres en nom d'un altre. Però:

1. **El remitent es pot falsificar.** Qualsevol compte pot crear una obra «compartida» amb tu i posar-hi
   com a remitent «Héctor Cubero» o el nom de qualsevol empresa. Et sortiria a la llista com a
   «Compartida per…» amb aquest nom. *(Provat: passa.)* Amb el registre obert (B), ho podria fer un
   desconegut.
2. **Un editor pot canviar l'identificador de l'obra.** Per a tu, l'obra desapareixeria del núvol
   compartit. *(Provat: passa.)*
3. **Algú pot «ocupar» l'identificador d'una obra teva** abans que la comparteixis, i llavors no la
   podries compartir. *(Provat: passa.)* Els identificadors porten la data i l'hora, i això ho fa poc
   probable.

**Què fer (quan es programi):** que el servidor posi sempre el correu i el nom del propietari a partir
del compte que crea l'obra, i que no deixi canviar l'identificador. Són unes poques línies al fitxer
SQL. Tancar el registre (B) ja treu quasi tot el risc.

---

## 🟠 I. Canvi de Supabase del 30/10/2026 — ⚠️ (té data)

Supabase ha anunciat que, **a partir del 30/10/2026**, les taules que no tinguin permisos donats
explícitament deixaran de ser accessibles des de l'app. L'anunci és poc clar sobre si afecta les taules
que ja existeixen. Els fitxers SQL de l'app (`aco_kv`, `aco_shared`) no donen aquests permisos; fins
ara els posava Supabase sol.

**Què fer abans del 30/10:**
1. Supabase → **Advisors → Security Advisor**: mirar si surten `aco_kv` o `aco_shared`.
2. Estar atent als correus de Supabase del 23/10.
3. Quan es toqui el SQL, afegir-hi els permisos explícits perquè no depengui d'això.

---

## 🟠 J. Funció d'albarans amb IA (encara no posada en marxa) — ⚠️

He comprovat que **no està en marxa** (Supabase respon «no existeix»). Abans de posar-la en marxa:
- El codi **no comprova qui la fa servir**. Només depèn de l'opció per defecte de Supabase, que demana
  estar connectat. Amb el registre obert (B), qualsevol persona registrada la podria fer servir amb la
  teva clau d'Anthropic.
- **No hi ha límit** de mida ni de nombre de lectures per usuari.
- La clau d'Anthropic es guardarà a Supabase (Secrets), no al codi ✅.

**Què fer:** tancar el registre (B), fer que la funció comprovi que l'usuari és vàlid, posar un límit
diari de lectures i un **límit de despesa mensual** al compte d'Anthropic.

---

## 🟡 K. Arxius (Storage) i taula antiga de juliol — ⚠️

*(Punt 5)*

**Storage.**
- He comprovat que **no existeix cap espai d'arxius** (*bucket*): el `app-control-obres` que creava el
  SQL antic no hi és, i un anònim no en veu cap. ✅ Avui no hi ha fotos, albarans ni plànols exposats.
  Tot va dins la base de dades (vegeu G).
- ⚠️ Les **regles antigues** del fitxer `supabase/aco_supabase_sync_schema.sql` donaven permís
  **anònim** per llegir, pujar, canviar i esborrar arxius. Ara mateix no fan res, perquè l'espai no
  existeix. Però si algun dia es crea un espai amb aquest nom, quedaria **obert a tothom**. No ho he
  pogut comprovar sense entrar al panell. Per mirar-ho (només llegeix):
  ```sql
  select policyname, roles, cmd from pg_policies where schemaname = 'storage';
  ```
  Si hi surten `ACO storage anon …`, cal esborrar-les.
- ⚠️ A `App.jsx` encara hi ha el codi antic que pujava documents a un espai **públic** amb la clau
  anònima (línies ~10140–10170). Ara no s'usa. No s'ha de tornar a activar així: l'espai ha de ser
  **privat** i amb regles per compte.

**Taula antiga `aco_user_state` (V87.121).** Un anònim hi veu **0 files** ✅: està tancada. Però hi
continuen guardades dades de clients de juliol que no serveixen per a res. **Què fer:** exportar-la
(per si de cas) i esborrar-la.

---

## 🟡 L. Estructura de dades: serveix per créixer? — ⚠️

*(Punt 9. Només és una valoració.)*

**Avui funciona bé per a la prova pilot.** Guardar-ho tot com a «calaixos» (`aco_kv`: una fila per
peça) té avantatges:
- La regla de seguretat és molt simple i difícil d'equivocar: «cadascú només els seus calaixos».
- Va bé sense cobertura.
- No ha calgut canviar el servidor cada vegada que l'app canviava.

**On es queda curt a mesura que creixi:**

| Necessitat | Amb calaixos (`aco_kv`) |
|---|---|
| Diverses persones per empresa, cadascuna amb el seu usuari i rol | ❌ Una empresa = un usuari |
| Que el client vegi només les seves obres des del seu aparell | ❌ El servidor no sap què hi ha dins de cada calaix (vegeu E) |
| Dues persones editant alhora sense perdre feina | ⚠️ El calaix és massa gran (vegeu F) |
| Hores per treballador, operaris, autònoms | ❌ Sense on posar «qui ha fet què» |
| Fotos i PDF | ⚠️ Inflen la base de dades (vegeu G) |
| Informes entre obres (p. ex. total d'albarans del mes) | ⚠️ Només a l'aparell, després de baixar-ho tot |
| Obres compartides | ⚠️ Es copien senceres a `aco_shared` |

**Recomanació.** No cal refer-ho tot de cop. Quan toqui, es pot fer **per passos**, sempre amb còpia i
amb proves:
1. **Fotos i PDF a Storage privat** (resol G; no canvia la resta).
2. Taules **`empreses`** i **`membres`** (qui és de quina empresa i amb quin rol). Les dades passen a
   ser de l'empresa i no d'un usuari. Resol «una persona = un usuari» i prepara operaris i autònoms.
3. Taula **`obres`** amb l'empresa i el client, i taules pròpies per a **`albarans`**, **`hores`** i
   **`compartits`** (qui veu quina obra). Així el servidor pot donar al client només les seves obres.
   El pressupost i les certificacions poden continuar com un bloc dins de cada obra.

Moment raonable per començar: **abans de passar d'unes 10 empreses**, o abans d'obrir el portal de
client real.

---

## 🟢 M. Separació entre empreses a `aco_kv` — ✅

*(Punt 2)*

- **RLS activat** a `aco_kv`, `aco_shared` i la taula antiga (provat al Supabase real com a anònim:
  0 files a les tres).
- **Proves amb usuaris inventats** en una base de dades local amb el mateix SQL: 8 de 8 correctes a
  `aco_kv`. Una empresa:
  - només veu les seves files;
  - no pot llegir, escriure, modificar, esborrar ni sobreescriure les teves dades;
  - tampoc no pot «regalar-te» files seves.
  
  Un anònim no veu res.
- La regla diu: «cadascú només les files amb el seu identificador». Ho comprova el **servidor**, no
  l'app.

Nota: dins de l'aparell, les empreses i els comptes interns es separen per prefix (`emp_…`). Això és
només ordre local. La seguretat real és la del servidor, i està bé.

---

## 🟢 N. Clau `service_role` — ✅

*(Punt 4)*

- **No és enlloc** del codi, ni a la carpeta `dist`, ni a cap versió de l'historial de Git.
- L'app només fa servir la clau **publicable** (`sb_publishable_…`), que és la correcta per al navegador.
- La clau d'Anthropic està pensada per anar als Secrets de Supabase, al servidor ✅.

---

## Llista de feina, per ordre

1. 🔴 Registrar el domini `controlobres.app` (A).
2. 🔴 Desactivar el registre de comptes nous a Supabase (B).
3. 🔴 Fer una còpia del núvol (totes les empreses) i decidir-ne la freqüència (C).
4. 🔴 Treure del codi `0000`, `1919` i `socoterm`, i donar a les empreses un botó per canviar la
   contrasenya del núvol (D).
5. 🟠 Abans del 30/10: mirar el Security Advisor de Supabase (I).
6. 🟠 Pantalla de «canvis no desats» i peces més petites per als albarans (F).
7. 🟠 Tancar els 3 punts febles de les obres compartides al SQL (H).
8. 🟠 Abans d'activar la IA d'albarans: control d'usuari i límits (J).
9. 🟠 Mirar l'espai un cop al mes; fotos i PDF a Storage privat abans de créixer (G).
10. 🟡 Esborrar les regles antigues de Storage i la taula `aco_user_state` (K).
11. 🟡 Portal de client amb compte propi i nova estructura per passos (E, L).
12. 🟡 Passar a Supabase Pro quan les empreses hi treballin de debò (C, G).
