# Comptes del núvol des de l’app (V87.613)

L’Héctor (15/11/2026): si un client oblida la contrasenya, fins ara només es podia canviar amb SQL (va passar amb el compte de Teimor), i
els comptes nous es feien al panell de Supabase. Ara es fa a l’app: **Ajustos › Comptes del núvol** (només el veu l’Héctor).

- **Compte nou:** l’usuari (p. ex. `garcia-constru`; entra amb `garcia-constru@usuaris.controlobres.app`) i una contrasenya que l’app
  proposa (es pot canviar o generar-ne una altra). «Compte de prova» hi posa `prova-` al davant: té data de fi (Ajustos › Comptes de prova).
- **Contrasenya nova** a qualsevol compte d’empresa de la llista (quan l’ha oblidada).
- En acabar, l’app ensenya **usuari, contrasenya i l’enllaç per entrar** (`…/?entra=usuari`, que ja posa l’usuari) per copiar-ho o
  compartir-ho. **L’app no guarda mai cap contrasenya:** es veu aquell sol cop.
- La llista diu l’últim accés de cada compte (o «Encara no ha entrat»).
- **No esborra mai cap compte** (s’esborrarien totes les seves dades) i no toca el compte de les còpies (`copies`) ni el de l’Héctor.

## Per dins

- Funció del servidor `aco-comptes` (`supabase/functions/aco-comptes/index.ts`): fa servir la clau secreta de Supabase, que mai surt del
  servidor (a l’app no hi pot anar: qui la tingués podria fer qualsevol cosa).
- Només la poden fer servir els correus del secret **`ACO_ADMINS`**. Sense aquest secret, no fa res (encara que la funció hi sigui).
- Cada compte creat i cada contrasenya canviada queda als registres de la funció (Edge Functions › aco-comptes › Logs): qui, què i quan,
  mai la contrasenya.
- Al Supabase de proves (`tools/proves/mocksupabase.mjs`) l’administrador és `hector@prova.cat`; prova `v613test`.

## Instal·lar-la (l’Héctor, una sola vegada; uns 5 minuts)

1. **Instal·lar la funció:** panell de Supabase › projecte «app control de obras» › **Edge Functions › Deploy a new function › Via
   Editor** › nom **`aco-comptes`** › enganxar tot el contingut de `supabase/functions/aco-comptes/index.ts` › **Deploy**.
2. **Apagar la comprovació antiga:** a la pestanya **Settings** de la funció, apagar **Verify JWT with legacy secret** › Save changes
   (com a `aco-ia`). No és cap risc: la funció comprova ella mateixa qui la crida i que sigui l’administrador.
3. **Dir qui és l’administrador:** Edge Functions › **Secrets** › Add new secret › nom **`ACO_ADMINS`**, valor: **el correu amb què
   entres a l’app** (si algun dia n’hi ha més d’un, separats per comes) › Save.
4. **Provar-ho:** a l’app, Ajustos › Comptes del núvol: ha de sortir la llista dels comptes (brava, socoterm, oriol, marti…).

Si surt «Falta instal·lar la funció…», falta el pas 1. Si surt «falta el secret ACO_ADMINS…», el pas 3 (o el correu no és el mateix
amb què has entrat).

## Si un compte oblida la contrasenya

Ajustos › Comptes del núvol › el compte › **Contrasenya nova** › Canviar › Copiar (o Compartir…) i enviar-la a la persona. Pot entrar
amb l’enllaç i, si vol, canviar-la després a Ajustos › Usuaris i contrasenyes.
