# APP Control d'Obres · V87.92

Base: V87.91 – pressupostos múltiples blindats.

Correcció puntual:
- Reparat el bloqueig de la pestanya principal Pressupostos quan s'obria o es clicava el botó "Calcular amb barem d’honoraris".
- Afegit estat intern correcte per obrir/tancar la calculadora d’honoraris.
- No es modifica la separació d'usuaris ni la gestió de pressupostos múltiples/certificacions.

Render:
- Static Site
- Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
- Publish Directory: dist

No pujar node_modules ni package-lock.json.
