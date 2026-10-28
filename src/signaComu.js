// V87.409 · El que fan servir igual l'app (SignaturaCert878408) i la pàgina per signar a distància (SignaRemot.jsx).
// Signar a distància (l'Héctor, 27/10/2026: «el mateix document: si cadascun d'ells me'l signa i me l'envia, allà surten totes
// les firmes? Perquè si som 4 agents rebré quatre PDF»): un enllaç per document. Qui l'obre veu el PDF d'ara, amb les signatures
// que ja té, i el signa amb la seva AutoFirma; la signatura nova s'afegeix al final del mateix PDF i es desa al núvol
// (supabase/aco_signa_v878409.sql). Així tothom signa el mateix document i en surt un sol PDF amb totes les signatures.
import { CLOUD_URL, CLOUD_KEY } from "./cloudConfig.js";

// L'adreça pública de l'app: l'enllaç ha de funcionar fora d'aquest ordinador (no «localhost»). Les proves la canvien.
export const APP_PUBLICA = "https://app-control-obres-hc.onrender.com/";
export function enllacSigna(token) {
  let base = APP_PUBLICA;
  try {
    if (typeof window !== "undefined" && window.__acoSignaBase878409) base = window.__acoSignaBase878409;
    else if (typeof location !== "undefined" && /\.onrender\.com$/.test(location.hostname)) base = location.origin + location.pathname;
  } catch {}
  return `${base}#signa=${token}`;
}

// El requadre (mm des de dalt a l'esquerra) en punts del PDF (des de baix a l'esquerra), una mica més petit perquè no toqui la vora.
// «alwaysCreateRevision»: la primera signatura també s'afegeix al final del PDF (sense, l'AutoFirma el torna a escriure sencer), i
// així el núvol pot comprovar que qui signa no ha canviat res del document (el PDF nou comença exactament com l'anterior).
export function propsSig({ motiu, obra, poblacio, s }) {
  const p = { signReason: motiu, signatureProductionCity: poblacio ?? obra?.poblacio ?? "", layer2Text: "Signat digitalment per\n$$SUBJECTCN$$\n$$SIGNDATE=dd/MM/yyyy HH:mm$$", layer2FontSize: "7", layer2FontFamily: "1", alwaysCreateRevision: "true" };
  if (s) {
    // V87.425 · `ph`: l'alçada del full (297 mm vertical, 210 mm horitzontal)
    const k = 72 / 25.4, m = 1.2, ph = +s.ph || 297;
    Object.assign(p, {
      signaturePage: String(s.pag),
      signaturePositionOnPageLowerLeftX: String(Math.round((s.x + m) * k)), signaturePositionOnPageLowerLeftY: String(Math.round((ph - s.y - s.h + m) * k)),
      signaturePositionOnPageUpperRightX: String(Math.round((s.x + s.w - m) * k)), signaturePositionOnPageUpperRightY: String(Math.round((ph - s.y - m) * k)),
    });
  }
  return p;
}

export const paraules = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").split(" ").filter(w => w.length > 2);

// A qui (rol) correspon una signatura: pel NIF o pel nom de qui ha de signar cada requadre
export function rolDe(sg, rols, usats) {
  const n = new Set(paraules(sg.nom + " " + sg.org)); let best = null, bs = 0;
  for (const r of rols) {
    if (usats.has(r.k)) continue;
    if (r.nif && sg.nif && String(r.nif).toUpperCase() === sg.nif) return r.k;
    const w = paraules(r.nom); const sc = w.length ? w.filter(x => n.has(x)).length / w.length : 0;
    if (sc > bs) { bs = sc; best = r.k; }
  }
  return bs >= 0.5 ? best : null;
}

// La llista de signatures d'un PDF signat: les d'abans conserven el seu rol; la nova, el triat (o el que li toqui pel nom).
// `pistes`: el que diuen els que han signat a distància ({rol, nif}): cada signatura nova amb aquell NIF va al seu requadre.
export function ajuntaSig(llegides, abans, rols, nouRol, pistes = []) {
  const usats = new Set((abans || []).map(x => x.rol).filter(Boolean));
  const pend = (pistes || []).filter(x => x && x.rol);
  return llegides.map((p, i) => {
    const o = (abans || [])[i] && ((abans[i].nif || "") === (p.nif || "")) ? abans[i] : null;
    let rol = o?.rol || "", via = o?.via || "";
    if (!o && nouRol && i === llegides.length - 1) { via = "autofirma"; if (!rol && !usats.has(nouRol)) rol = nouRol; }
    if (!rol) { const j = pend.findIndex(x => !usats.has(x.rol) && (x.nif || "") === (p.nif || "")); if (j >= 0) { rol = pend[j].rol; via = "enllac"; pend.splice(j, 1); } }
    if (!rol) rol = rolDe(p, rols, usats) || "";
    if (rol) usats.add(rol);
    return { rol, nom: p.nom, nif: p.nif, org: p.org, emissor: p.emissor, quan: p.quan, valida: !!p.valida, integre: p.integre, via: via || "pujat" };
  });
}

// El PDF `nou` és l'`antic` amb alguna cosa afegida al final (una signatura més): no s'hi ha canviat res
export function comencaAmb(nou, antic) {
  if (!nou || !antic || nou.length < antic.length) return false;
  for (let i = 0; i < antic.length; i++) if (nou[i] !== antic[i]) return false;
  return true;
}

// Les crides al núvol de qui obre l'enllaç (sense compte): només les dues funcions de la petició de signatura
export async function rpcSigna(nom, cos) {
  let r;
  try { r = await fetch(`${CLOUD_URL}/rest/v1/rpc/${nom}`, { method: "POST", headers: { apikey: CLOUD_KEY, "Content-Type": "application/json" }, body: JSON.stringify(cos || {}), cache: "no-store" }); }
  catch { const e = new Error("connexio"); e.codi = "connexio"; throw e; }
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch {}
  if (!r.ok) { const e = new Error(j?.message || txt || `Error ${r.status}`); e.status = r.status; e.codi = "servidor"; throw e; }
  return j;
}

// No hi ha la part del núvol (encara no s'ha executat l'SQL): l'app envia el PDF per correu com abans
export const senseServidor = e => e?.status === 404 || /PGRST202|Could not find the function|does not exist/i.test(String(e?.message || "") + JSON.stringify(e?.body || ""));
