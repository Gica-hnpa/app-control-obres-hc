# APP Control d'Obres · V87.130

Versió de correcció immediata sobre V87.129.

Canvis:
- Graella de certificacions compactada perquè el codi de partida es vegi complet i les columnes A origen quedin visibles sense haver d'anar al final amb scroll horitzontal en pantalla d'escriptori.
- Recuperació de la cel·la de Q cert. actual amb el botó de línies de medició integrat sense deformar la taula.
- Quadre mensual de feines per administració: si es tria una partida existent, l'import s'aplica directament a aquella partida i a aquella certificació, sense crear una partida nova amb codi .ADM.
- Si no es tria partida existent, es crea o reutilitza una única partida resum manual pel codi indicat, de manera que no es dupliqui cada mes.
- Es mantenen Supabase, còpies locals, importació segura i resta de correccions de V87.129.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
