// V87.479 · Capítols que es diuen igual («02 ENDERROCS», «03 ENDERROCS»…): fins a la V87.477, cada partida d'un «capítol nou» n'obria un.
// Funcions pures: caps = {capítol: files}. Dins d'un capítol principal diferent, el mateix nom és un altre capítol.
const PREFIX = /^[A-Z]{0,3}\d+(\.\d+)*[\s.\-·]*/i;
const clau = k => String(k || "").replace(PREFIX, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const grup = (k, rows) => (clau(k) ? `${String(rows?.[0]?.capPrincipal || "")}|${clau(k)}` : `=${k}`);

export function capsRepetits(caps = {}) {
  const vistos = new Set(); let n = 0;
  for (const [k, rows] of Object.entries(caps || {})) { const g = grup(k, rows); if (vistos.has(g)) n++; else vistos.add(g); }
  return n;
}

// entrades = [[capítol, files]], per ordre i amb les files ordenades. Ajunta els repetits al primer; si tots els capítols són «01 NOM», sense
// capítols principals, els torna a numerar seguits. Els codis numerats segueixen el capítol; un codi propi (BEDEC…) es queda.
export function ajuntaCaps(entrades = []) {
  const grups = new Map();
  for (const [k, rows] of entrades) {
    const g = grup(k, rows);
    if (!grups.has(g)) grups.set(g, { cap: k, rows: [], n: 0 });
    const x = grups.get(g); x.rows.push(...(rows || [])); x.n++;
  }
  const llista = [...grups.values()];
  const pla = llista.every(x => /^\d+\s/.test(x.cap) && !x.rows.some(r => r.capPrincipal));
  const out = {};
  llista.forEach((x, i) => {
    if (!pla && x.n < 2) { out[x.cap] = x.rows; return; }
    const cap = pla ? `${String(i + 1).padStart(2, "0")} ${String(x.cap).replace(PREFIX, "")}` : x.cap;
    const num = (String(cap).match(/^[A-Z]{0,3}(\d+(?:\.\d+)*)/i) || [])[1] || "";
    out[cap] = x.rows.map((r, j) => {
      const vell = String(r.codi || "");
      const codi = num && (!vell || /^\d+(?:[.,]\d+)+$/.test(vell)) ? `${num}.${String(j + 1).padStart(2, "0")}` : vell;
      return { ...r, cap, subcap: cap, codi, codiPressupost: codi, capPath: [r.scopePrincipal, r.capPrincipal, cap].filter(Boolean), previousCodes87224: [...new Set([...(r.previousCodes87224 || []), vell].filter(c => c && c !== codi))] };
    });
  });
  return out;
}
