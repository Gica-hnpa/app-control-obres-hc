# APP Control d'Obres · V87.68 rescat acta formal

Base de recuperació després del problema de descàrrega de V87.67.

Canvis principals:
- Recuperat el flux de `Nou expedient` amb creació robusta de client nou o client existent.
- Generació automàtica de codi d'expedient `ANY-NÚM-TIPUS-CLIENT-PARAULA`.
- Inicialització segura de dades internes de l'expedient.
- Millora del mòdul d'actes amb número d'acta, promotor, constructor, DO, DEO, CSS, agents, fotos, documents i signatures.
- Acta formal A4 amb previsualització i opció d'imprimir/exportar.

No inclou encara el bloc de plànols PDF amb llapis/colors ni la configuració avançada de pestanyes per tipologia d'expedient.

Render:
- Static Site
- Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
- Publish Directory: dist

No pujar `node_modules` ni `package-lock.json`.
