// V87.268 · Idiomes. Cada usuari veu l'app en el seu idioma (català o castellà; més endavant, altres).
// Els textos s'escriuen en català dins del codi: t("Guardar acta"). El text català fa de clau i el
// diccionari de cada idioma diu com es diu en aquell idioma. Si un text no hi és, surt en català (mai buit).
// L'idioma és de cada usuari (no de l'obra ni del compte sencer): es desa a la seva clau, que viatja amb el
// seu compte del núvol, i també a l'aparell (per a les pantalles d'abans d'entrar).
import ES from "./i18n-es.js";

export const LANGS = [
  { code: "ca", nom: "Català" },
  { code: "es", nom: "Castellano" },
];
const DICTS = { es: ES };
const DEVICE_KEY = "idioma-app-control-obres";
const known = code => code === "ca" || !!DICTS[code];
let current = "ca";

function userKey(user) { return `aco_v8782__${user}__aco_idioma_v878268`; }
// Idioma d'un usuari; si no en té, el de l'aparell; si no, català.
export function readLang(user) {
  try {
    const v = (user && localStorage.getItem(userKey(user))) || localStorage.getItem(DEVICE_KEY) || "ca";
    return known(v) ? v : "ca";
  } catch { return "ca"; }
}
export function setLang(code) {
  current = known(code) ? code : "ca";
  try { document.documentElement.lang = current; } catch {}
  return current;
}
export function getLang() { return current; }
export function saveLang(user, code) {
  if (!known(code)) return;
  try { if (user) localStorage.setItem(userKey(user), code); localStorage.setItem(DEVICE_KEY, code); } catch {}
}
// Text en l'idioma actual. «vars» omple {nom}: t("Hola {nom}", {nom: "Héctor"}).
export function t(text, vars) {
  let s = current === "ca" ? text : (DICTS[current]?.[text] ?? text);
  if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}
// V87.283 · Text en un idioma concret (p. ex. l'idioma dels documents d'una obra), encara que l'app sigui en un altre.
export function tl(lang, text, vars) {
  const code = known(lang) ? lang : current;
  let s = code === "ca" ? text : (DICTS[code]?.[text] ?? text);
  if (vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}
// Per a les proves: textos que encara no són al diccionari d'un idioma.
export function missing(texts, code = "es") { return texts.filter(x => !(DICTS[code] && x in DICTS[code])); }
if (typeof window !== "undefined") window.__acoI18n = { t, tl, getLang, setLang, readLang, saveLang, LANGS, missing };
