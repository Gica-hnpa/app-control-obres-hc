# APP Control d’Obres · V87.166

Versió centrada en criteri global d'ús pràctic: pantalles més netes, desplegables persistents, agents sense duplicats i comptador visible.

Canvis:
- Comptador de Gestió del temps més visible, numèric i amb format HH:MM:SS.
- En aturar el comptador, es manté l'arrodoniment facturable a fraccions de 15 minuts.
- Desplegables d'agents substituïts per panells persistents perquè no es tanquin de cop.
- Agents deduplicats per nom/email, evitant que el mateix tècnic aparegui diverses vegades.
- Filtres d'agents més estrictes: DO/DEO/CSS només tècnics; constructor només constructores/contractistes/industrials.
- Menú i pantalles reforçats cap al criteri general: menys pantalla ocupada i més contingut plegable.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
