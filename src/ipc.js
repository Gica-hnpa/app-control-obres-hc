// V87.533 · L'IPC de l'INE per posar al dia els preus d'un banc vell (l'Héctor, 6/11/2026: «són del 2023 i s'han d'actualitzar
// automàticament a l'any vigent»). Índex general nacional, base 2021 (sèrie IPC251852 de l'INE). L'INE va canviar a la base 2025 el
// gener del 2026: els mesos del 2026 s'enllacen amb la variació anual oficial (sèrie IPC290750): índex(2026-m) = índex(2025-m) × (1 + v/100).
// Cada mes l'INE publica un mes nou (cap al dia 13-15 del mes següent): s'afegeix aquí la variació anual a VAR_2026 (o a l'any que toqui).
// Funcions pures (tools/proves/ipc533unit.mjs).

const BASE2021 = {
  2018: [95.153, 95.281, 95.393, 96.181, 97.048, 97.302, 96.604, 96.742, 96.978, 97.875, 97.768, 97.329],
  2019: [96.085, 96.32, 96.669, 97.644, 97.834, 97.719, 97.113, 97.059, 97.059, 98.001, 98.167, 98.096],
  2020: [97.139, 97.024, 96.652, 96.944, 96.938, 97.385, 96.511, 96.555, 96.7, 97.208, 97.367, 97.574],
  2021: [97.583, 97.008, 97.949, 99.105, 99.572, 100.046, 99.292, 99.743, 100.575, 102.425, 102.738, 103.965],
  2022: [103.567, 104.403, 107.566, 107.375, 108.262, 110.267, 109.986, 110.265, 109.498, 109.866, 109.734, 109.899],
  2023: [109.668, 110.703, 111.111, 111.773, 111.719, 112.354, 112.544, 113.149, 113.348, 113.676, 113.28, 113.308],
  2024: [113.404, 113.807, 114.674, 115.472, 115.776, 116.212, 115.66, 115.707, 115.009, 115.726, 116.01, 116.534],
  2025: [116.733, 117.191, 117.26, 117.997, 118.077, 118.867, 118.777, 118.824, 118.485, 119.301, 119.532, 119.942],
};
// variació anual (%) del 2026, mes a mes, publicada per l'INE (base 2025)
const VAR_2026 = [2.3, 2.3, 3.4, 3.2, 3.2, 3.2, 3.6, 4.3, 4.9, 4.9];

const INDEX = (() => {
  const m = new Map();
  for (const [a, v] of Object.entries(BASE2021)) v.forEach((x, i) => m.set(`${a}-${i + 1}`, x));
  VAR_2026.forEach((v, i) => { const x = m.get(`2025-${i + 1}`); if (x) m.set(`2026-${i + 1}`, Math.round(x * (1 + v / 100) * 1000) / 1000); });
  return m;
})();
// l'últim mes publicat
export const ULTIM_IPC = (() => { let a = 0, mes = 0; for (const k of INDEX.keys()) { const [x, y] = k.split("-").map(Number); if (x > a || (x === a && y > mes)) { a = x; mes = y; } } return { any: a, mes }; })();
export const indexIpc = (any, mes) => INDEX.get(`${any}-${mes}`) ?? null;

// el % que han pujat els preus des del gener (o el mes que es digui) de l'any del banc fins a l'últim mes publicat;
// null si l'any és fora de la taula o és el mateix mes
export function ipcPct(any, mes = 1) {
  const a = parseInt(any, 10); const m = Math.min(12, Math.max(1, parseInt(mes, 10) || 1));
  const i0 = indexIpc(a, m), i1 = indexIpc(ULTIM_IPC.any, ULTIM_IPC.mes);
  if (!i0 || !i1 || (a === ULTIM_IPC.any && m >= ULTIM_IPC.mes)) return null;
  return { pct: Math.round((i1 / i0 - 1) * 1000) / 10, de: { any: a, mes: m }, fins: { ...ULTIM_IPC } };
}
