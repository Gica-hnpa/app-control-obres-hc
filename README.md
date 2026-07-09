# APP Control d'Obres · V87.146

Versió centrada en iPad/mòbil, retorns de pantalla i sincronització de cites.

Canvis:
- iPad amb vista més moderna i aprofitant la pantalla gran, diferent del mòbil.
- Botó de tornar/tancar visible en pantalles interiors i modals de documents/impressió.
- Capçaleres mòbils/iPad més integrades amb l'app.
- Supabase Sync inclou també cites globals locals de l'agenda, perquè PC i mòbil mostrin el mateix.
- En carregar del núvol es restauren les cites globals al localStorage del dispositiu.
- Inici també llegeix cites globals locals, no només cites vinculades a expedients.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
