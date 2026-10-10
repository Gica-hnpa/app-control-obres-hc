# Estat actual — 10/10/2026 (abans de l’auditoria)

Última versió: **V87.259.2** (carpeta `app-control-obres-v87-259-compartits`). Render publicava la
V87.259 l’última vegada que es va comprovar; cal pujar la V87.259.2.

## Què s’ha fet en aquesta conversa (V87.249 → V87.259.2)

**Disseny i pressupost**
- Disseny modern (tipus Inter, Inici sense dades econòmiques, gràfics, fitxa d’obra amb foto, Gantt).
- Pressupost i certificacions depurats: avisos de >100 % i codis repetits, «+ Afegir feina» amb tres tipus,
  capítols que ja no es tanquen sols (el comptador refrescava la pantalla), pressupost llegible al mòbil.
- Pressupost amb IA (ChatGPT/Claude/Gemini): l’app prepara les instruccions i importa la taula.

**Temps, agenda i factures**
- Gestió del temps nova (per període, client i expedient; comptador automàtic; entrades manuals; CSV).
- Agenda tipus Google Calendar (dia/setmana/mes/llista, avisos, arrossegar, cites que compten com a hores).
- Factures a partir de les hores pendents de facturar.

**Dades, núvol i espai**
- Desat a l’ordinador (`DADES\app-control-obres-DADES-LOCALS.json`) i sincronització per wifi.
- Núvol Supabase amb usuari i contrasenya (`aco_kv`, una fila per obra).
- Incident 09/10: aparells amb dades velles van contaminar el núvol i el fitxer DADES. Recuperat amb
  `DADES\COPIA-SEGURA-ABANS-NUVOL-2026-10-09.json` + l’obra «prova movil». Proteccions afegides: guanya el
  núvol, fre de seguretat, primera connexió atòmica, restauració forçada.
- Espai gran amb IndexedDB (el navegador era al 85 % dels 5 MB i els pressupostos no es desaven).

**Prova pilot amb empreses**
- Comptes al núvol creats i verificats: `brava`, `socoterm` (constructors), `oriol`, `marti` (tècnics).
  Espais separats al mateix navegador; benvinguda amb nom i perfil; «Canviar de compte».
- Guies d’inici en PDF a `GUIES_USUARIS\` (adreça, usuari, contrasenya, QR, primers passos).
- Obres compartides (`aco_shared`, SQL executat): COMODORO compartida amb socoterm (pot editar).
- Fotos d’obra sincronitzades i miniatura a la llista d’expedients.
- Albarans: foto o PDF, imputació a obra, filtre per client, «Facturat al client», lectura automàtica
  del PDF amb text i lector de respostes de ChatGPT (taules amb tabuladors).

## Pendent

1. Pujar la **V87.259.2** a GitHub (contingut de `PER_PUJAR_A_GITHUB`).
2. **Lectura d’albarans amb IA directa**: clau d’Anthropic + funció `llegir-albara` a Supabase.
3. Tornar a posar la **foto de COMODORO**.
4. Provar els 4 comptes d’empresa al mòbil i donar-los els PDF de benvinguda.
5. **Hores per treballador** (constructors) i rols d’autònoms / operaris / promotors.
6. Portal de client amb compte de núvol propi.
7. Seguretat: treure contrasenyes del codi, polítiques de Supabase Storage, Supabase Pro en comercialitzar.
8. Revisar dades amb l’Héctor (partides >100 %, codis repetits, dates desordenades).
9. Lligar amb l’altra app d’hores de l’Héctor.
10. **Auditoria del codi**: `src/App.jsx` acumula moltes versions (funcions amb sufixos 87xxx) i
    estils en capes (`theme-v87249…257.css`, molts `!important`).

## On són les coses importants

- Dades bones de l’Héctor: `DADES\app-control-obres-DADES-LOCALS.json` (+ `COPIES_AUTOMATIQUES`).
- Còpies de seguretat d’aquest dia: `DADES\COPIA-SEGURA-ABANS-NUVOL-2026-10-09.json`,
  `DADES\DADES-ABANS-RESTAURAR-2026-10-09-1300.json`, `DADES\DADES-VELLES-CONTAMINADES-2026-10-09-0234.json`.
- SQL de Supabase: `supabase\aco_nuvol_v87257.sql`, `supabase\aco_compartits_v87259.sql`.
- Proves automàtiques: `tools\proves\` (no es pugen a GitHub).
