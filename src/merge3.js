// V87.293 · Ajuntar dues versions d'una mateixa peça (una obra, la llista d'expedients, els clients…) a partir de la
// darrera versió comuna («base»: la que aquest aparell sabia que hi havia al núvol).
// - El que només ha canviat en un lloc, es queda.
// - Les llistes amb «id» (partides, certificacions, actes, notes, fotos, agents…) s'ajunten element per element:
//   un element afegit en un lloc i un altre afegit en l'altre hi són tots dos.
// - Només hi ha «conflicte» si tots dos han canviat el mateix camp del mateix element (o un l'ha esborrat i l'altre
//   l'ha canviat). Llavors, si no s'ha dit quina es prefereix, es torna la llista de conflictes per preguntar.
// - Les dates que l'app posa sola (updatedAt, lastOpenedAt, lastWorkedAt) mai no són conflicte: es queda la més nova.
// - Camps d'estat de la pantalla desats dins de les dades (p. ex. el pressupost triat) tampoc: es queda el d'aquí.

const TOUCH = new Set(["updatedAt", "lastOpenedAt", "lastWorkedAt"]);
const SOFT = new Set(["activeBudgetIdObra"]);
// Noms dels apartats d'una obra per explicar on hi ha el conflicte
const APARTATS = {
  partides: "Pressupost", pressupostos: "Pressupost", certificacions: "Certificacions", actes: "Actes", notes: "Notes",
  agents: "Agents", tasques: "Tasques", documents: "Documents", fotos: "Fotos", factures: "Facturació", factParams: "Facturació",
  facturesTecnic: "Factures", pressupostosTecnic: "Honoraris", facturesVF878285: "Facturació", temps: "Temps",
  sectionNotes: "Notes dels apartats", sectionDocs: "Documents dels apartats", budgetGroups: "Pressupostos",
};

// Noms dels camps més habituals (si no hi són, surt el nom intern)
const CAMPS = { q: "quantitat", pu: "preu", concepte: "concepte", desc: "descripció", text: "text", data: "data", estat: "estat", nom: "nom", hores: "hores", observacions: "observacions", titol: "títol", ut: "unitat", codi: "codi", import: "import", numero: "número", hora: "hora" };
const isObj = x => !!x && typeof x === "object" && !Array.isArray(x);
const hasId = x => isObj(x) && (typeof x.id === "string" || typeof x.id === "number") && x.id !== "";
function idArray(a) { if (!Array.isArray(a)) return false; const s = new Set(); for (const x of a) { if (!hasId(x) || s.has(String(x.id))) return false; s.add(String(x.id)); } return true; }
const primArray = a => Array.isArray(a) && a.every(x => x == null || typeof x !== "object");

// Igualtat de contingut sense les dates que l'app posa sola
export function same(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) { if (!Array.isArray(b) || a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!same(a[i], b[i])) return false; return true; }
  if (isObj(a)) {
    if (!isObj(b)) return false;
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of ks) { if (TOUCH.has(k)) continue; if (!same(a[k], b[k])) return false; }
    return true;
  }
  return false;
}
const maxIso = (a, b) => (a == null ? b : b == null ? a : String(a) >= String(b) ? a : b);
function etiqueta(x, id) {
  if (!isObj(x)) return String(id);
  const v = x.codi && (x.concepte || x.titol) ? `${x.codi}` : x.numero != null && x.numero !== "" ? `núm. ${x.numero}` : (x.titol || x.title || x.nom || x.concepte || x.label || "");
  return String(v || id).slice(0, 40);
}

// merge3(base, mine, theirs, { prefer }) → { ok, value, conflicts:[{path:[…], label}] }
// prefer: "mine" | "theirs" → els conflictes es resolen així (i ok és true); sense prefer, ok és false si n'hi ha.
export function merge3(base, mine, theirs, { prefer } = {}) {
  const conflicts = [];
  const value = m3(base, mine, theirs, [], [], conflicts, prefer);
  return { ok: !conflicts.length || !!prefer, value, conflicts };
}
function conflicte(m, t, path, labels, conflicts, prefer) {
  conflicts.push({ path, label: labels.join(" › ") });
  return prefer === "theirs" ? t : m;
}
function m3(b, m, t, path, labels, conflicts, prefer) {
  if (same(m, t)) return isObj(m) && isObj(t) ? touchMerge(m, t) : m;
  if (same(m, b)) return t;
  if (same(t, b)) return m;
  // Tots dos han canviat
  if (isObj(m) && isObj(t) && (b == null || isObj(b))) {
    const out = {};
    const keys = [...Object.keys(m), ...Object.keys(t).filter(k => !(k in m))];
    for (const k of keys) {
      if (TOUCH.has(k)) { out[k] = maxIso(m[k], t[k]); continue; }
      if (SOFT.has(k)) { out[k] = k in m ? m[k] : t[k]; continue; }
      const nomK = CAMPS[k] || k;
      const lab = path.length === 0 && APARTATS[k] ? [APARTATS[k]] : (path.length === 0 ? [nomK] : labels.length ? [...labels, nomK] : [nomK]);
      const v = m3(b?.[k], m[k], t[k], [...path, k], lab, conflicts, prefer);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  if (Array.isArray(m) && Array.isArray(t) && (b == null || Array.isArray(b))) {
    const bb = b || [];
    if (idArray(m) && idArray(t) && idArray(bb)) return byId(bb, m, t, path, labels, conflicts, prefer);
    if (primArray(m) && primArray(t) && primArray(bb)) {
      const inB = new Set(bb.map(String)), inM = new Set(m.map(String)), inT = new Set(t.map(String));
      return [...m.filter(x => !(inB.has(String(x)) && !inT.has(String(x)))), ...t.filter(x => !inB.has(String(x)) && !inM.has(String(x)))];
    }
  }
  return conflicte(m, t, path, labels, conflicts, prefer);
}
function touchMerge(m, t) {
  let out = m;
  for (const k of TOUCH) if (k in t && maxIso(m[k], t[k]) !== m[k]) { if (out === m) out = { ...m }; out[k] = t[k]; }
  return out;
}
function byId(b, m, t, path, labels, conflicts, prefer) {
  const key = x => String(x.id);
  const bm = new Map(b.map(x => [key(x), x])), mm = new Map(m.map(x => [key(x), x])), tm = new Map(t.map(x => [key(x), x]));
  const out = [];
  for (const x of m) {
    const id = key(x), lab = [...labels, etiqueta(x, id)];
    if (tm.has(id)) { const v = m3(bm.get(id), x, tm.get(id), [...path, id], lab, conflicts, prefer); if (v !== undefined) out.push(v); continue; }
    if (bm.has(id)) {
      // L'altre l'ha esborrat: si aquí no s'ha tocat, fora; si aquí s'ha canviat, és un conflicte
      if (same(x, bm.get(id))) continue;
      const v = conflicte(x, undefined, [...path, id], [...lab, "esborrat a l’altre lloc"], conflicts, prefer);
      if (v !== undefined) out.push(v);
      continue;
    }
    out.push(x); // afegit aquí
  }
  t.forEach((y, i) => {
    const id = key(y);
    if (mm.has(id)) return;
    if (bm.has(id)) {
      // Esborrat aquí: si l'altre no l'ha tocat, fora; si l'ha canviat, conflicte
      if (same(y, bm.get(id))) return;
      const v = conflicte(undefined, y, [...path, id], [...labels, etiqueta(y, id), "esborrat aquí"], conflicts, prefer);
      if (v === undefined) return;
    }
    // Afegit a l'altre lloc: al costat de l'element que el precedeix allà
    let at = out.length;
    for (let j = i - 1; j >= 0; j--) { const p = out.findIndex(z => key(z) === key(t[j])); if (p >= 0) { at = p + 1; break; } }
    out.splice(at, 0, y);
  });
  return out;
}

// Text curt per a la pregunta: «Pressupost › 01.02 › q», sense repetir i com a molt n
export function conflictLabels(conflicts, n = 4) {
  const seen = []; for (const c of conflicts) { const l = c.label || c.path.join(" › "); if (!seen.includes(l)) seen.push(l); }
  return seen.length > n ? [...seen.slice(0, n), `+${seen.length - n}`] : seen;
}
