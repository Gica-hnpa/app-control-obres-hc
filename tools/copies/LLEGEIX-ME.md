# Còpies del núvol a l'ordinador (V87.260)

Cada dia a les 13:00, `copia-nuvol.mjs`:
1. entra al núvol amb el compte de còpies `copies@usuaris.controlobres.app`, que només pot **llegir**;
2. baixa les dades de **tots** els comptes;
3. desa una còpia a cada una d'aquestes dues carpetes:
   - `D:\00_CUBERO\00_FEINA\PROGRAMES\APP GESTIO OBRES\DADES\COPIES_NUVOL\AAAA-MM-DD\`
   - `C:\Users\Hector\Documents\COPIES_NUVOL\AAAA-MM-DD\`

Dins de cada carpeta de dia hi ha:
- un fitxer per compte: `hector.json.gz`, `brava.json.gz`, `oriol.json.gz`…;
- `_obres-compartides.json.gz`;
- `_resum.json`, amb les obres i la mida de cada compte.

Es guarden els **últims 30 dies** i el **dia 1 de cada mes** durant **12 mesos**. Cada carpeta té un
`registre.txt` amb una línia per còpia: `OK` o `ERROR`.

## Posar-ho en marxa (una sola vegada)

1. **Supabase → Authentication → Users → Add user → Create new user**
   - Email: `copies@usuaris.controlobres.app`
   - Password: una de llarga, que **no** facis servir enlloc més
   - Marcar **Auto Confirm User**
2. **Supabase → SQL Editor → New query**: enganxar el contingut de `supabase/aco_copies_v87260.sql` i clicar
   **Run**. Ha de sortir «Success. No rows returned».
3. Al terminal, a la carpeta `app-control-obres`, executar:
   `node tools/copies/copia-nuvol.mjs --configurar`
   Et demana la contrasenya del pas 1. La comprova i la desa **xifrada** a
   `C:\Users\Hector\.aco-copies\config.json`. Només la pot desxifrar el teu usuari de Windows en aquest
   ordinador.
4. Primera còpia a mà: `node tools/copies/copia-nuvol.mjs`
5. Programar-la cada dia: `powershell -ExecutionPolicy Bypass -File tools\copies\programar-copia.ps1`

**Mai** entris a l'app amb el compte de còpies: veuria les dades de tothom.

## Restaurar un compte

```
node tools/copies/restaurar-compte.mjs "C:\Users\Hector\Documents\COPIES_NUVOL\2026-10-13\brava.json.gz"
```

1. **Primer, la prova.** L'ordre anterior només ensenya què canviaria; no toca res.
2. **De debò.** Afegeix `--de-debo` al final.
   - Et demana la **clau secreta** de Supabase (Project Settings → API Keys). No es desa enlloc.
   - Per confirmar, cal escriure el nom del compte.
3. **Abans de canviar res**, desa com estava el compte a `COPIES_NUVOL\restauracions\`.
4. Només canvia aquell compte. Els seus aparells reben les dades restaurades sols.

## Proves

`node tools/proves/copiatest.mjs` fa 26 proves amb el Supabase de proves i carpetes temporals.
No toca mai dades reals.
