// V87.458 · La IA de l'app: la funció «aco-ia» de Supabase (supabase/functions/aco-ia/index.ts). Si no està instal·lada, `iaActiva` diu
// false i l'app continua com abans (el text del PDF i, si cal, copiar i enganxar). Les funcions de sota no depenen del navegador.
const FUNCIO = "aco-ia";
let activa = null; // null = encara no se sap

export const iaCridable = () => !!window.__acoCloud?.callFunction;
// una sola pregunta per sessió; sense connexió no es recorda la resposta
export async function iaActiva() {
  if (window.__acoIaOff878458) return false; // les proves del camí sense funció
  if (activa !== null) return activa;
  if (!iaCridable()) return false;
  try { const r = await window.__acoCloud.callFunction(FUNCIO, { accio: "ping" }); activa = !!r?.ok; return activa; }
  catch (e) { if (e?.status) activa = false; return false; }
}
export const iaSabuda = () => (window.__acoIaOff878458 ? false : activa);

export async function iaCrida(accio, cos = {}) {
  let r;
  try { r = await window.__acoCloud.callFunction(FUNCIO, { accio, ...cos }); }
  catch (e) { if (e?.status === 404) activa = false; throw e; }
  if (r?.error) throw Object.assign(new Error(r.error), { limit: !!r.limit });
  if (r == null) throw new Error("La IA no ha respost.");
  return r;
}

// foto o PDF d'una dataURL → {tipus, dades}
export function arxiuDeDataUrl(src) {
  const [h, b] = String(src || "").split(",");
  return b ? { tipus: (h.match(/data:([^;]+)/) || [])[1] || "image/jpeg", dades: b } : null;
}
export const arxiuDeFitxer = f => new Promise((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok({ tipus: f.type || (/\.pdf$/i.test(f.name) ? "application/pdf" : "image/jpeg"), dades: String(r.result).split(",")[1] || "", nom: f.name });
  r.onerror = ko; r.readAsDataURL(f);
});

// El text d'un pressupost llarg es llegeix a trossos (cada crida al servidor té 6 minuts). Dos trossos seguits es toquen unes línies,
// perquè una partida partida entre tots dos no es perdi; la repetida es treu a partidesDeIa.
export function trossosText(text, max = 30000, solapa = 20) {
  const ls = String(text || "").split("\n"), out = [];
  let ini = 0;
  while (ini < ls.length) {
    let mida = 0, j = ini;
    while (j < ls.length && (j === ini || mida + ls[j].length + 1 <= max)) { mida += ls[j].length + 1; j++; }
    out.push(ls.slice(ini, j).join("\n"));
    if (j >= ls.length) break;
    ini = Math.max(ini + 1, j - solapa);
  }
  return out.filter(x => x.trim());
}

const netU = u => String(u || "ut").trim().replace(/^m\.?2$/i, "m²").replace(/^m\.?3$/i, "m³") || "ut";
const nomCap = (nom, i) => { const s = String(nom || "").trim(); return /^\d{1,3}(?:\.\d+)?\s/.test(s) ? s : `${String(i + 1).padStart(2, "0")} ${s || "Partides"}`; };
// respostes de «pressupost» o «partides» (una per tros) → les files de revisió; el mateix capítol en dos trossos s'ajunta
export function partidesDeIa(respostes) {
  const llista = Array.isArray(respostes) ? respostes : [respostes];
  const ordre = [], per = {}; const avisos = []; let total = 0;
  const clauNom = n => String(n || "").toLowerCase().replace(/^\s*\d+(?:\.\d+)?[\s.\-–]*/, "").trim();
  for (const r of llista) {
    for (const c of r?.capitols || []) {
      const k = clauNom(c.nom) || `_${ordre.length}`;
      if (!per[k]) { per[k] = { nom: c.nom, partides: [] }; ordre.push(k); }
      per[k].partides.push(...(c.partides || []));
    }
    if (Number(r?.total) > total) total = Number(r.total);
    avisos.push(...(r?.avisos || []).map(String));
  }
  const vistes = new Set(), partides = [];
  ordre.forEach((k, i) => {
    const cap = nomCap(per[k].nom, i); let n = 0;
    for (const p of per[k].partides) {
      const concepte = String(p.concepte || "").trim(); if (!concepte) continue;
      const q = Number(p.q) || 0, pu = Number(p.pu) || 0;
      const clau = p.codi ? `${p.codi}|${concepte.toLowerCase()}` : `${cap}|${concepte.toLowerCase()}|${q}`;
      if (vistes.has(clau)) continue; vistes.add(clau);
      n++;
      partides.push({ codi: String(p.codi || "").trim() || `${cap.split(" ")[0]}.${String(n).padStart(2, "0")}`, cap, ut: netU(p.ut), concepte, desc: String(p.descripcio || "").trim(), q, pu, imp: Math.round(q * pu * 100) / 100, revisar: p.revisar ? "Revisa-la: la IA no n'està segura" : "" });
    }
  });
  return { partides, total, avisos };
}

// Un pressupost o uns amidaments en PDF: el text a trossos o, si és escanejat, l'arxiu sencer
const MAX_ARXIU = 14 * 1024 * 1024;
export async function pressupostDeIa(file, text, onPas) {
  const resp = [];
  if (String(text || "").trim().length > 200) {
    const trossos = trossosText(text);
    for (let i = 0; i < trossos.length; i++) {
      onPas?.(i + 1, trossos.length);
      const ultim = resp[resp.length - 1]?.capitols?.slice(-1)[0]?.nom;
      const context = trossos.length > 1 ? `Tros ${i + 1} de ${trossos.length} del document.${ultim ? ` L'últim capítol del tros anterior era «${ultim}»: si el text comença sense títol de capítol, les partides són d'aquest capítol.` : ""}` : "";
      resp.push(await iaCrida("pressupost", { text: trossos[i], context }));
    }
  } else {
    if (file.size > MAX_ARXIU) throw new Error("El PDF escanejat fa més de 14 MB: no es pot llegir amb la IA.");
    onPas?.(1, 1);
    resp.push(await iaCrida("pressupost", { arxius: [await arxiuDeFitxer(file)] }));
  }
  return partidesDeIa(resp);
}

// Resposta de «despesa» → el que espera fillAlbara878259, amb el tipus de despesa de l'app
export function despesaDeIa(r) {
  return { ...r, tipusApp: r?.tipus === "factura" ? "Material" : r?.tipus === "albara" ? "Albarà" : "" };
}
// Els albarans que una factura diu que inclou (la seva llista d'albarans de la mateixa obra sense factura): pel número, sense espais ni guions
export function albaransDeFactura(nums, candidats) {
  const net = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const llista = (nums || []).map(net).filter(x => x.length >= 2);
  return (candidats || []).filter(c => { const n = net(c.numero); return n && llista.some(x => x === n || x.endsWith(n) || n.endsWith(x)); }).map(c => c.id);
}
