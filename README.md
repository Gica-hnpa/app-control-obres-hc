# APP Control d’Obres — V87.181

Versió derivada de V87.180 amb correcció de persistència de tasques i rols de client creats des de l’Inici.

## Canvis principals
- A **Afegir tasca** es pot crear un client/contacte nou indicant el rol o tipologia: Promotor, Arquitecte, Arquitecte tècnic, Immobiliària, Constructor/Constructora, Industrial, Administració, Particular, etc.
- Les tasques creades des de l’Inici consoliden immediatament clients, expedients i odata al localStorage, sense esperar al cicle de React.
- La importació JSON fusiona també dades operatives de la còpia crítica (`aco_odata_core_v87104`): tasques, agenda/events, hores, documents, fotos, actes i agents.
- Evita que una còpia completa antiga tapi tasques que sí que existien a la còpia crítica.
- Manté la V87.180 de pressupostos/descompostos/exportació com a base.

## Recomanació
Abans de continuar, importar el JSON bo i comprovar a Inici i dins cada expedient que les tasques apareixen.
