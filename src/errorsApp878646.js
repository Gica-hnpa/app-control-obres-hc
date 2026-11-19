// V87.646 · Errors de l'app al núvol (vigilància). Fins ara, si alguna pantalla fallava, l'Héctor se n'assabentava quan l'hi deia un usuari.
// Ara cada error (el missatge tècnic, on ha passat, la versió i l'aparell; cap dada de les obres) es desa al núvol, a la taula aco_errors
// (supabase/aco_vigilancia_v878646.sql), i l'Héctor el veu a Ajustos › «Estat del núvol».
// - Només s'envien amb el núvol connectat; mentrestant esperen a l'aparell (com a molt 20).
// - El mateix error només s'envia una vegada per sessió, i com a molt 20 errors diferents per sessió (el núvol també en posa límit).
// - No compten els avisos que no són de l'app (extensions del navegador, «ResizeObserver», «Script error» d'altres webs).
const CUA = "aco_errors_cua_v878646";
const MAX = 20;
const ls = (() => { try { return window.localStorage; } catch { return null; } })(); // el de debò: després bigStore el substitueix
const vistos = new Set();
let enviant = false;

const net = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const llegeix = () => { try { const v = JSON.parse(ls?.getItem(CUA) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const desa = l => { try { if (l.length) ls?.setItem(CUA, JSON.stringify(l.slice(-MAX))); else ls?.removeItem(CUA); } catch {} };
const ignora = t => /ResizeObserver loop|^Script error\.?$|chrome-extension:|moz-extension:|safari(-web)?-extension:|^Load failed$|^Failed to fetch$|NetworkError when attempting/i.test(t);

function aparell() {
  const ua = navigator.userAgent || "";
  const so = /iPad|Macintosh.*Mobile/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "iPad" : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : "Altres";
  const nav = /Edg\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [so, nav, `${window.innerWidth || 0}px`].filter(Boolean).join(" · ");
}

export function apuntaError(err, extra = {}) {
  try {
    const e = err?.reason ?? err;
    const missatge = net(e?.message || (typeof e === "string" ? e : e?.toString?.()) || "Error", 500);
    const lloc = net([e?.stack || "", extra.lloc || ""].filter(Boolean).join(" · "), 2000);
    if (ignora(missatge) || ignora(lloc)) return;
    const clau = missatge; // el núvol també els ajunta pel missatge
    if (vistos.has(clau) || vistos.size >= MAX) return;
    vistos.add(clau);
    // la pantalla només pel nom de la peça (mai el títol, que pot portar el nom d'una obra o d'un client)
    const pantalla = net(extra.pantalla || "", 200);
    desa([...llegeix(), { missatge, lloc, pantalla, aparell: net(aparell(), 200) }]);
    setTimeout(enviaErrors, 2000);
  } catch {}
}

export async function enviaErrors() {
  const c = window.__acoCloud;
  if (enviant || !c?.desaErrors || !c.status?.().email || navigator.onLine === false) return;
  const cua = llegeix();
  if (!cua.length) return;
  enviant = true;
  try { await c.desaErrors(cua); desa([]); }
  catch (e) {
    // sense l'SQL (o amb un error que no és de connexió) no es guarden per sempre a l'aparell
    if (!e?.offline && !(e?.status >= 500)) desa([]);
  } finally { enviant = false; }
}

export function startErrors() {
  if (window.__acoErrors) return;
  window.addEventListener("error", ev => {
    if (ev?.target && ev.target !== window) return; // una imatge o un arxiu que no carrega no és un error de l'app
    apuntaError(ev?.error || ev?.message, { lloc: ev?.filename ? `${ev.filename}:${ev.lineno}:${ev.colno}` : "" });
  });
  window.addEventListener("unhandledrejection", ev => apuntaError(ev?.reason));
  // el que bloqueja la política de contingut (CSP, V87.644): si mai talla alguna cosa de l'app, que se sàpiga
  document.addEventListener("securitypolicyviolation", ev => {
    const b = String(ev?.blockedURI || "").split(/[?#]/)[0];
    apuntaError(`CSP: ${ev?.effectiveDirective || ev?.violatedDirective || ""} ${b}`.trim(), { pantalla: "Política de contingut" });
  });
  window.addEventListener("online", () => setTimeout(enviaErrors, 3000));
  setTimeout(enviaErrors, 20000);
  setInterval(enviaErrors, 120000);
  window.__acoErrors = { apunta: apuntaError, envia: enviaErrors };
}
