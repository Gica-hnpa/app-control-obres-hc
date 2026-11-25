# Repàs de la constructora, pantalla per pantalla (25/11/2026)

L'Héctor: «a la tarda mirarem pantalla a pantalla segons el perfil per comprovar errors que he vist». Primer perfil: **constructora**.
Cada pantalla, a l'ordinador i al mòbil. Els errors s'apunten aquí; s'arreglen per tandes i cada tanda es publica. Per a cada error, una prova
que faci el camí sencer com un usuari, perquè no torni.

Estat de cada línia: ☐ per mirar · ✎ apuntat (per arreglar) · ✔ arreglat (versió)

## Fora de l'obra (menú)

1. ☐ **Inici** — salutació, rajoles, obres en curs, avisos, el temps
2. ☐ **Contactes** — clients, industrials, fitxa
3. ☐ **Obres** — llista, filtres, obra nova, importar
4. ☐ **Control horari** — personal, fitxatge, calendari, validar
5. ☐ **Pressupostos** — llistat i estat
6. ☐ **Comptabilitat** — Facturació · Despeses · Caixa i bancs · Rendiment
7. ☐ **Agenda** — cites, equip, Google Calendar
8. ☐ **Empresa** — dades, treballadors, documentació, industrials, calendari laboral
9. ☐ **Ajustos**

## Dins de l'obra

10. ☐ **Fitxa** — Resum · Dades · Agents · Documents · Fotografies · Industrials / comparatius · Tancament
11. ☐ **Dia a dia** — Partes d'obra · Notes · Actes · Agenda · Tasques · Planning
12. ☐ **Pressupost** — Amidaments · Pressupost · Certificacions
13. ☐ **Comptabilitat de l'obra** — Facturació · Albarans i despeses · Rendiment

## Errors apuntats

| # | Pantalla | Aparell | Què passa | Estat |
|---|---|---|---|---|
| 1 | Obra › Pressupost › Ajustos | tots | L'IVA del pressupost no passava a la proforma ni a la factura (client de Socoterm) | ✔ V87.662 |
| 2 | Menú | ordinador | Amb el logo de l'empresa, G3C no sortia a dalt | ✔ V87.662 |
| 3 | Obra › capçalera | mòbil | L'estat sortia tallat («Pendent de resp…») | ✔ V87.662 |
| 4 | Barra de baix | mòbil de 360 px | «Expedie…» tallat | ✔ V87.662 |
| 5 | Obrir l'app | mòbil | A vegades triga uns segons a obrir-se. Possibles causes: just després de publicar una versió es torna a baixar l'app (~1 MB; V87.649: 7 s amb 4G lent) i, després d'«Entrar», s'esperen els canvis del núvol (`cycle({startup:true})`) abans d'ensenyar res. Per mesurar amb `v649test` | ✎ |
| 6 | Obrir l'app | mòbil | A vegades no s'obre a l'Inici sinó a la pantalla on era. La V87.635 ja posa l'Inici en obrir i recarregar; torna on eres (1) quan el mòbil no havia tancat l'app (només era al fons: tampoc demana la contrasenya) i (2) quan l'app es recarrega sola per portar canvis d'un altre aparell (`reloadSafely`, `aco-on-era`) | ✎ decidir |
| 7 | Obrir l'app | iPhone | A sovint s'ha de fer petita amb els dits. Arreglat a la V87.661 (zoom en tocar un camp de menys de 16 px); comprovar que el mòbil ja és a la V87.661 i, si torna a passar, captura abans de fer-la petita. Al meu recorregut: mirar si alguna pantalla és més ampla que el mòbil | ✎ comprovar |
