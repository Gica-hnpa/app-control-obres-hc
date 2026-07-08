# APP Control d'Obres · V87.125

Versió de correcció sobre V87.124.

Canvis:
- Millora d'edició de quantitats i preus del pressupost: camps decimals més estables, selecció del valor en focus i sense bloqueig en fer doble clic.
- Possibilitat d'eliminar partides del pressupost en mode edició.
- Certificacions: els amidaments ja no es guarden automàticament en sortir del camp; només es consoliden amb el botó Guardar amidaments.
- Certificacions: columnes i inputs més amples perquè no es tallin quantitats de tres xifres.
- Certificacions: nova opció per crear una partida extra/modificació directament des de la certificació.
- Certificacions: nova opció de provisió de fons que suma a la certificació/proforma però no incrementa el pressupost.
- Impressió de factura proforma corregida perquè no surti escalada en format petit i mantingui mida A4 com la previsualització.
- Es manté la base V87.124 amb Supabase, importació segura i renombrat visible.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
