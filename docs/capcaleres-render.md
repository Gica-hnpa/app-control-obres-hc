# Capçaleres de seguretat per a Render (V87.644)

La política de contingut (CSP) ja va dins de l'app des de la V87.644. Aquestes altres capçaleres només les pot posar el servidor:
cal afegir-les una vegada al panell de Render. No canvien res de com es veu ni de com funciona l'app.

**On:** https://dashboard.render.com › el servei `app-control-obres-hc` › **Settings** › **Headers** › **Add Header**.
A cada una: **Path** `/*`, **Name** i **Value** tal com surten aquí. Després, **Save Changes** (Render torna a publicar sol).

| Path | Name | Value | Per a què |
|---|---|---|---|
| `/*` | `X-Frame-Options` | `DENY` | Ningú no pot posar l'app dins d'una altra web per enganyar (fer clicar on no toca). |
| `/*` | `Content-Security-Policy` | `frame-ancestors 'none'` | El mateix, per als navegadors nous. |
| `/*` | `Referrer-Policy` | `strict-origin-when-cross-origin` | En obrir un enllaç de fora, no s'envia l'adreça sencera de la pantalla de l'app. |
| `/*` | `Permissions-Policy` | `camera=(self), microphone=(self), geolocation=(self), payment=()` | Càmera, micròfon i ubicació només per a l'app (fotos, dictat, fitxatge). |
| `/assets/*` | `Cache-Control` | `public, max-age=31536000, immutable` | Els arxius amb número de versió es guarden un any al mòbil: l'app s'obre més de pressa. |

Ja hi són (les posa Render sol): `Strict-Transport-Security` (sempre HTTPS) i `X-Content-Type-Options: nosniff`.

**Comprovar-ho** (després de desar): obrir l'app i veure que funciona igual. Des de l'ordinador, Claude ho pot comprovar amb
`curl -I https://app-control-obres-hc.onrender.com/`.
