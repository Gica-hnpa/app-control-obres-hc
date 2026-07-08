# APP Control d'Obres · V87.141

Versió derivada de V87.140 centrada en netejar la factura proforma i el panell d'inici.

Canvis:
- La impressió de factura/proforma ja no mostra descripcions llargues de les partides.
- L'ordre de totals de proforma passa a: Base imposable, Deducció provisió/descompte, IVA i Retenció.
- Correcció del guardat de cites creades des del formulari nou perquè es guardi la data ISO completa i apareguin a pròximes cites.
- Pròximes cites de l'inici mostra fins a 6 cites futures reals.
- S'elimina el text “Radar de feines pendents” i es substitueix per una targeta “Avui” amb la data actual i resum ràpid.
- Es manté la base V87.140 de tasques per client, data màxima d'entrega, accions i adaptació mòbil/iPad.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
