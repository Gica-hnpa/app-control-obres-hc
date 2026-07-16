# APP Control d’Obres — V87.182

Versió de seguretat centrada en la importació profunda de JSON: fusiona `storage`, `localStorage`, claus d’usuari i còpia crítica per recuperar clients, expedients, tasques i dades d’obra sense que una còpia antiga trepitgi la recent.

- Importació JSON profunda i fusionada.
- Recuperació de clients i expedients de `localStorage` encara que `storage` contingui còpies antigues.
- Fusió reforçada de `aco_odata` i `aco_odata_core_v87104`.
- Comptador de clients, expedients i tasques importades.
- Manté la millora de V87.181 per indicar rol/tipologia del client quan es crea des d’Afegir tasca.
