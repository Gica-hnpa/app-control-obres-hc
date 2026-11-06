// V87.521 · Caixa i bancs: per cobrar, per pagar i la previsió setmana a setmana (funcions pures, sense pantalles).
// Les dates són «AAAA-MM-DD» (dia local). Un import pendent amb la data passada compta a la setmana d'ara.

const pad = n => String(n).padStart(2, "0");
export const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const dia = s => { const d = new Date(String(s || "").slice(0, 10) + "T12:00:00"); return isNaN(d) ? null : d; };
export function sumaDies(s, n) { const d = dia(s); if (!d) return ""; d.setDate(d.getDate() + n); return iso(d); }
export function dilluns(s) { const d = dia(s); if (!d) return ""; d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); }
const r2 = x => Math.round((+x || 0) * 100) / 100;

// «vencut» (la data ja ha passat), «setmana» (de dilluns a diumenge d'aquesta setmana) o «despres»
export function grupData(data, avui) {
  if (!data || data < avui) return "vencut";
  return data <= sumaDies(dilluns(avui), 6) ? "setmana" : "despres";
}

// les dates d'un pagament fix entre dues dates: {dia (1-31), cada (mesos: 1, 3, 6, 12), des ("AAAA-MM"), fins ("AAAA-MM" o "")}
export function datesFix(f = {}, ini, fi) {
  const out = [], cada = Math.max(1, Math.round(+f.cada || 1)), dd = Math.min(31, Math.max(1, Math.round(+f.dia || 1)));
  const m0 = /^\d{4}-\d{2}$/.test(String(f.des || "")) ? f.des : String(ini).slice(0, 7);
  let y = +m0.slice(0, 4), m = +m0.slice(5, 7);
  const fiM = String(fi).slice(0, 7), finsM = /^\d{4}-\d{2}$/.test(String(f.fins || "")) ? f.fins : "";
  for (let i = 0; i < 400; i++) {
    const ym = y + "-" + pad(m);
    if (ym > fiM || (finsM && ym > finsM)) break;
    const ult = new Date(y, m, 0).getDate();
    const d = ym + "-" + pad(Math.min(dd, ult));
    if (d >= ini && d <= fi) out.push(d);
    m += cada; while (m > 12) { m -= 12; y++; }
  }
  return out;
}

// V87.529 · la previsió per mesos (de sèrie, 6): el primer mes és el d'ara (des d'avui) i els altres, sencers. El vençut compta al mes d'ara.
export function previsioMesos({ saldo = 0, entrades = [], sortides = [], fixos = [], avui, mesos = 6 } = {}) {
  const y0 = +String(avui).slice(0, 4), m0 = +String(avui).slice(5, 7);
  const P = Array.from({ length: Math.max(1, mesos) }, (_, i) => { let y = y0, m = m0 + i; while (m > 12) { m -= 12; y++; } const ult = new Date(y, m, 0).getDate(); return { ini: y + "-" + pad(m) + "-01", fi: y + "-" + pad(m) + "-" + pad(ult), entrades: 0, sortides: 0, items: [] }; });
  const fi = P[P.length - 1].fi;
  const on = d => { if (!d || d < avui) return 0; if (d > fi) return -1; const i = (+d.slice(0, 4) - y0) * 12 + (+d.slice(5, 7) - m0); return i >= 0 && i < P.length ? i : -1; };
  const r = omple(P, on, { saldo, entrades, sortides, fixos, avui, fi });
  return { ...r, mesos: P };
}
function omple(W, on, { saldo, entrades, sortides, fixos, avui, fi }) {
  for (const e of entrades) { const i = on(e.data); if (i < 0) continue; W[i].entrades += +e.import || 0; W[i].items.push({ ...e, tipus: "entrada", vencut: !e.data || e.data < avui }); }
  for (const s of sortides) { const i = on(s.data); if (i < 0) continue; W[i].sortides += +s.import || 0; W[i].items.push({ ...s, tipus: "sortida", vencut: !s.data || s.data < avui }); }
  for (const f of fixos) {
    if (!(+f.import > 0)) continue;
    for (const d of datesFix(f, avui, fi)) { const i = on(d); if (i < 0) continue; W[i].sortides += +f.import; W[i].items.push({ tipus: "fix", data: d, import: +f.import, concepte: f.concepte || "", id: f.id }); }
  }
  let s = +saldo || 0, min = null;
  for (const w of W) {
    w.entrades = r2(w.entrades); w.sortides = r2(w.sortides);
    w.inicial = r2(s); s = r2(s + w.entrades - w.sortides); w.saldo = s;
    w.items.sort((a, b) => String(a.data || "").localeCompare(String(b.data || "")) || (a.tipus === "entrada" ? -1 : 1));
    if (!min || w.saldo < min.saldo) min = { saldo: w.saldo, ini: w.ini };
  }
  const negatiu = W.find(w => w.saldo < 0) || null;
  return { periodes: W, final: r2(s), min, negatiu, entrades: r2(W.reduce((x, w) => x + w.entrades, 0)), sortides: r2(W.reduce((x, w) => x + w.sortides, 0)) };
}

// La previsió: setmanes de dilluns a diumenge des d'aquesta. entrades/sortides = [{data, import, ...}] (import positiu). Els pagaments
// fixos només compten des d'avui (els dies d'abans d'aquesta setmana es donen per pagats).
export function previsio({ saldo = 0, entrades = [], sortides = [], fixos = [], avui, setmanes = 13 } = {}) {
  const l0 = dilluns(avui), fi = sumaDies(l0, setmanes * 7 - 1);
  const W = Array.from({ length: setmanes }, (_, i) => ({ ini: sumaDies(l0, i * 7), fi: sumaDies(l0, i * 7 + 6), entrades: 0, sortides: 0, items: [] }));
  const on = d => { if (!d || d < avui) return 0; if (d > fi) return -1; return Math.floor((dia(d) - dia(l0)) / (7 * 864e5)); };
  for (const e of entrades) { const i = on(e.data); if (i < 0) continue; W[i].entrades += +e.import || 0; W[i].items.push({ ...e, tipus: "entrada", vencut: !e.data || e.data < avui }); }
  for (const s of sortides) { const i = on(s.data); if (i < 0) continue; W[i].sortides += +s.import || 0; W[i].items.push({ ...s, tipus: "sortida", vencut: !s.data || s.data < avui }); }
  for (const f of fixos) {
    if (!(+f.import > 0)) continue;
    for (const d of datesFix(f, avui, fi)) { const i = on(d); if (i < 0) continue; W[i].sortides += +f.import; W[i].items.push({ tipus: "fix", data: d, import: +f.import, concepte: f.concepte || "", id: f.id }); }
  }
  let s = +saldo || 0, min = null;
  for (const w of W) {
    w.entrades = r2(w.entrades); w.sortides = r2(w.sortides);
    w.inicial = r2(s); s = r2(s + w.entrades - w.sortides); w.saldo = s;
    w.items.sort((a, b) => String(a.data || "").localeCompare(String(b.data || "")) || (a.tipus === "entrada" ? -1 : 1));
    if (!min || w.saldo < min.saldo) min = { saldo: w.saldo, ini: w.ini };
  }
  const negatiu = W.find(w => w.saldo < 0) || null;
  return { setmanes: W, final: r2(s), min, negatiu, entrades: r2(W.reduce((x, w) => x + w.entrades, 0)), sortides: r2(W.reduce((x, w) => x + w.sortides, 0)) };
}
