# APP Control d’Obres · V87.177

Versió derivada de V87.176 / V87.175 fiable.

Canvis:
- Correcció de la importació massiva de descomposats amb el cas real `Descompostos_Capitol_02_Paleteria.xlsx`.
- Reconeixement de fulls amb nom de codi de partida, com `02.01`, `02.02`, etc.
- Correcció de comparació de codis amb zeros inicials: `02.01`, `2.01` i variants equivalents.
- Assignació del descomposat a la partida del pressupost pel codi del full abans d’intentar coincidència per text.
- Es manté que el preu del descomposat no s’aplica automàticament: queda pendent de validació.
- Es manté la protecció de canvis: Cancel·lar edició no guarda modificacions.

Build verificat amb Vite.
