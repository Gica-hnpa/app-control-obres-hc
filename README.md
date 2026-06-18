# APP Control d'Obres · V87.120

Versió quirúrgica sobre V87.119.

Canvis principals:
- Correcció del càlcul de totals de factures d'honoraris quan es modifiquen IVA, retenció o descompte.
- Els llistats i gràfiques globals de factures fan servir el mateix càlcul net que la previsualització/PDF.
- Guardat reforçat de les dades de l'expedient: es persisteixen tant a la llista d'obres com a la còpia de dades de l'expedient.
- Nova pestanya Rendiment dins de cada expedient, amb gràfiques de pressupost d'honoraris, facturació d'honoraris i temps invertit.
- Millora del menú global Gestió del temps amb gràfiques globals de pressupostat, facturat, cobrat, pendent i temps dedicat.
- La pestanya Gestió obra queda disponible en qualsevol expedient per poder crear/importar pressupost d'obra quan calgui, encara que la feina principal no sigui gestió integral.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
