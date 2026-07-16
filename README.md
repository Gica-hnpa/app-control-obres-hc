# APP Control d’Obres — V87.180

Versió derivada de V87.179 amb correcció de flux per reentrar pressupostos i descompostos amb seguretat.

## Canvis principals
- Importació massiva de descompostos mantinguda i consolidada dins les partides.
- Nova pestanya interna **Validar descompostos** dins Pressupost obra per validar tots els preus detectats sense obrir partida per partida.
- Acció **Aplicar tots al pressupost i guardar** per passar tots els preus validats a PU de partida en un sol clic.
- Pestanya **Exportar / còpies** amb PDF, Guardar a Documents, Exportar Excel i Consolidar dades.
- Exportació Excel estructurada amb pestanya PRESSUPOST, resum de descompostos i un full per cada partida amb descompost.
- Els totals del pressupost es consoliden també al marcador de pressupost perquè no surti 0 a la capçalera.
- Botó Exportar Excel també a Pressupost ràpid.

Build verificat amb Vite.
