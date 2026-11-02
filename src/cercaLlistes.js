// V87.470 · Cercador de les llistes de despeses i factures: paraules (número, proveïdor, client, obra…) i dates escrites com es vulgui
// (02/11/2026, 2-11-26, 2/11, 11/2026, 2026-11, 2026, novembre, noviembre). Funcions pures.
const MESOS = [["gener", "enero"], ["febrer", "febrero"], ["marc", "marzo"], ["abril"], ["maig", "mayo"], ["juny", "junio"], ["juliol", "julio"], ["agost", "agosto"], ["setembre", "septiembre"], ["octubre"], ["novembre", "noviembre"], ["desembre", "diciembre"]];
const sense = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const net = s => sense(s).replace(/[^a-z0-9]+/g, " ").trim();

// La data com a AAAA-MM-DD, o "" si no n'és una
export function dataIso(v) {
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})$/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

function esData(tros, iso) {
  if (!iso) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const sencera = dataIso(tros);
  if (sencera) return sencera === iso;
  let r;
  if ((r = tros.match(/^(\d{1,2})[/.-](\d{4})$/))) return +r[1] === m && +r[2] === y;
  if ((r = tros.match(/^(\d{4})[/.-](\d{1,2})$/))) return +r[1] === y && +r[2] === m;
  if ((r = tros.match(/^(\d{1,2})[/.-](\d{1,2})$/))) return +r[1] === d && +r[2] === m;
  if (/^(19|20)\d{2}$/.test(tros)) return +tros === y;
  return (MESOS[m - 1] || []).includes(sense(tros));
}

// Cada tros del que s'ha escrit ha de ser als textos o a la data
export function cercaOk(q, textos, iso) {
  const trossos = String(q ?? "").trim().split(/\s+/).filter(Boolean);
  if (!trossos.length) return true;
  const txt = net((textos || []).filter(Boolean).join(" "));
  return trossos.every(t => { const n = net(t); return (n && txt.includes(n)) || esData(t, iso); });
}
