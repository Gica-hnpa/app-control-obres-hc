# APP Control d'Obres · V87.127

Versió correctiva sobre V87.126.

Canvis principals:
- Es retira el botó `€/h` dins de cada fila de la certificació perquè deformava la graella.
- Nova opció superior **Quadre administració mensual** dins de la certificació.
- El quadre mensual funciona com l'Excel: concepte, dia, hores d'oficial, hores d'ajudant/peó, material i total per línia.
- Els costos hora d'oficial i ajudant/peó es configuren dins del quadre i es recorden per al navegador.
- El total del quadre es transforma en una única partida certificable: **1 ut × cost total**.
- Aquesta partida suma a la certificació/proforma però queda marcada com a fora de pressupost perquè no incrementi el pressupost base.
- Es manté el sistema de línies de medició per a partides normals.
- Es mantenen les correccions de proforma, resum real, importació segura, còpies locals i Supabase.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
