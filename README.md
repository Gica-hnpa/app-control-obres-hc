# APP Control d'Obres · V87.171

Versió de recuperació fiable sobre la base V87.162 / V87.169 rollback.

Objectiu:
- Tornar a una base estable després que la V87.170 descol·loqués la vista d'edició de pressupost i provoqués penjaments al descomposat.
- No continuar sobre la V87.170.
- Recuperar la vista de pressupost que funcionava abans.
- Mantenir codis editables i gestió del temps manual/comptador de la V87.162.

Canvis respecte V87.170:
- Es descarta la vista nova de pressupost partida-a-partida.
- Es descarta el modal de descomposat que podia quedar penjat.
- Es recupera el comportament fiable de la base V87.162/V87.169.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
