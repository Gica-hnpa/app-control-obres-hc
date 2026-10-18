# Google Calendar · passos per activar-lo (Héctor)

L’app ja sap connectar l’Agenda amb Google Calendar (V87.295), però Google demana que l’app tingui un «identificador de
client» creat amb el teu compte de Google. Es fa una sola vegada i són uns 10 minuts.

**Què farà l’app quan estigui activat:**
- A l’Agenda sortirà **«Connectar amb Google Calendar»**. Amb un toc, Google et demana quin compte i que hi donis permís.
- Les cites de l’app van a un calendari nou, **«Control d’Obres»**, dins del teu Gmail. És el teu, i el pots amagar o
  mostrar amb un clic a Google Calendar.
- El que canviïs o esborris a Google (al mòbil, per exemple) **torna a l’app**. Si una cita es canvia als dos llocs,
  guanya el canvi més nou.
- Les cites del teu **calendari principal** es veuen a l’Agenda en gris, només per consultar.
- El permís dura una hora. Després, a l’Agenda tornarà a sortir «Connectar amb Google Calendar» (un toc).

## Passos

1. Entra a **https://console.cloud.google.com** amb el teu Gmail. Si surt **«Prova gratuïta» de 90 dies** (300 $ de
   crèdit), **no l’activis**: tanca l’avís («Ignora» / «Dismiss»). No cal cap compte de pagament ni targeta per a res
   d’aquests passos. Si en algun pas et demana la targeta, para i digues-m’ho.
2. A dalt, **Selecciona un projecte → Projecte nou**. Nom: `Control d'Obres`. **Crea**.
3. Menú ☰ → **API i serveis → Biblioteca**. Busca **Google Calendar API** → **Habilita**.
4. Menú ☰ → **API i serveis → Pantalla de consentiment d’OAuth** (o «Google Auth Platform»):
   - Tipus d’usuari: **Extern** → Crea.
   - Nom de l’aplicació: `Control d'Obres`. Correu d’assistència i de contacte: el teu.
   - **Públic / Usuaris de prova**: afegeix **el teu Gmail**. Ha de quedar en mode **Prova** («Testing»).
5. Menú ☰ → **API i serveis → Credencials → Crea credencials → ID de client d’OAuth**:
   - Tipus d’aplicació: **Aplicació web**. Nom: `Control d'Obres web`.
   - **Orígens de JavaScript autoritzats** (afegeix-ne dos):
     - `https://app-control-obres-hc.onrender.com`
     - `http://localhost:5173`
   - **Crea**. Surt l’**ID de client**, que acaba en `.apps.googleusercontent.com`.
6. **Envia’m l’ID de client.** No és cap secret: és públic, com l’adreça d’una web. **No** m’enviïs el «secret de
   client»: l’app no el necessita.
7. El poso a l’app (`src/cloudConfig.js`, `GOOGLE_CLIENT_ID`), ho provem i ho pugem.

## Bo de saber

- **Mode Prova:** només els correus de la llista «Usuaris de prova» poden connectar-se. Per a tu sol ja va bé. Si més
  endavant ho han de fer altres usuaris de l’app, cal afegir-los a la llista (fins a 100) o demanar a Google que
  verifiqui l’app.
- Google pot ensenyar l’avís «Google no ha verificat aquesta aplicació». És normal en mode Prova: **Continua**.
- Treure el permís en qualsevol moment: https://myaccount.google.com/permissions → Control d’Obres → Suprimeix
  l’accés.
