// V87.405 · Enviar un correu des del Gmail de l'usuari, amb el PDF adjunt (l'Héctor, 26/10/2026: «vull que sigui per Gmail i no
// per l'Outlook, que no l'utilitzo… i no surt adjuntat el PDF de l'acta»).
// - Permís: el mateix sistema que el Google Calendar (Google Identity Services, sense cap secret a l'app), però només per enviar
//   correus («gmail.send»: l'app no pot llegir-ne cap). Dura una hora i es desa per a cada usuari de l'app en aquest aparell.
// - Cal que el projecte de Google de l'app tingui activada la «Gmail API». Si no ho està, Google respon 403 i l'app ho diu
//   (`e.noActiva`); mentrestant, la finestra «Enviar» obre el Gmail amb el correu escrit i descarrega el PDF.
import { GOOGLE_CLIENT_ID } from "./cloudConfig.js";

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const API = String(ENV.VITE_GMAIL_API || "https://gmail.googleapis.com/gmail/v1").replace(/\/$/, "");
const SCOPE = "https://www.googleapis.com/auth/gmail.send";
const usr = () => { try { return sessionStorage.getItem("aco_current_user8779") || ""; } catch { return ""; } };
const TK = () => `google-mail-token__${usr()}`;

export function configurat() { return !!(ENV.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID || window.__acoGoogleMock); }

let token = null;
function tok() {
  if (token && token.u === usr() && token.exp - 60000 > Date.now()) return token;
  token = null;
  try { const t = JSON.parse(localStorage.getItem(TK()) || "null"); if (t?.exp - 60000 > Date.now()) token = { ...t, u: usr() }; } catch {}
  return token;
}
export function connectat() { return !!tok(); }
function desa(at, exp) {
  token = { at, exp: Date.now() + (Number(exp) || 3600) * 1000, u: usr() };
  try { localStorage.setItem(TK(), JSON.stringify({ at: token.at, exp: token.exp })); } catch {}
}
export function oblida() { token = null; try { localStorage.removeItem(TK()); } catch {} }

function carregaGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = () => res(); s.onerror = () => rej(new Error("No s’ha pogut carregar Google (sense connexió?)."));
    document.head.appendChild(s);
  });
}
// es carrega Google abans del toc: així la seva finestra s'obre dins del mateix toc i el navegador no la bloqueja
export function prepara() { if (!window.__acoGoogleMock && configurat()) carregaGis().catch(() => {}); }

// S'ha de cridar des d'un toc (Google obre la seva finestra la primera vegada)
export async function connecta() {
  if (connectat()) return true;
  if (window.__acoGoogleMock) { const r = await window.__acoGoogleMock.requestToken(SCOPE); desa(r.access_token, r.expires_in); return true; }
  if (!configurat()) throw new Error("Google encara no està configurat.");
  await carregaGis();
  return new Promise((resolve, reject) => {
    const c = window.google.accounts.oauth2.initTokenClient({
      client_id: ENV.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID, scope: SCOPE, include_granted_scopes: true,
      callback: r => { if (r?.access_token && (!r.scope || String(r.scope).includes("gmail.send"))) { desa(r.access_token, r.expires_in); resolve(true); } else reject(new Error(r?.error_description || r?.error || "Google no ha donat permís per enviar correus.")); },
      error_callback: e => reject(new Error(e?.type === "popup_closed" ? "S’ha tancat la finestra de Google." : (e?.message || "Google no ha donat permís."))),
    });
    c.requestAccessToken({ prompt: "" });
  });
}

// ---------- el correu (MIME) ----------
const b64Text = s => { const b = new TextEncoder().encode(String(s ?? "")); let x = ""; for (let i = 0; i < b.length; i += 0x8000) x += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(x); };
async function b64Blob(blob) { const b = new Uint8Array(await blob.arrayBuffer()); let x = ""; for (let i = 0; i < b.length; i += 0x8000) x += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(x); }
const linies = s => s.replace(/.{1,76}/g, "$&\r\n").replace(/\r\n$/, "");
const capcalera = s => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64Text(s)}?=`;
const nomArxiu = n => `"${capcalera(String(n || "document.pdf").replace(/"/g, "'"))}"`;
// V87.411 · el text va també en HTML, amb els enllaços en blau i que es poden tocar (l'Héctor: l'enllaç per signar sortia com a text)
const escH = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function htmlCos(text) {
  const parts = String(text ?? "").split(/(https?:\/\/[^\s<>"]+)/g);
  const cos = parts.map((p, i) => i % 2 ? `<a href="${escH(p)}" style="color:#1a73e8;text-decoration:underline">${escH(p)}</a>` : escH(p)).join("").replace(/\r?\n/g, "<br>");
  return `<!doctype html><html><body><div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#202124">${cos}</div></body></html>`;
}
const alternativa = (text, fa) => [`Content-Type: multipart/alternative; boundary="${fa}"`, "", `--${fa}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", linies(b64Text(text)), `--${fa}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", linies(b64Text(htmlCos(text))), `--${fa}--`];
export async function mime({ to = [], subject = "", text = "", adjunts = [] }) {
  const fr = "aco" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), fa = "alt" + fr;
  const cap = [`To: ${to.join(", ")}`, `Subject: ${capcalera(subject)}`, "MIME-Version: 1.0"];
  if (!adjunts.length) return [...cap, ...alternativa(text, fa)].join("\r\n");
  const parts = [`--${fr}`, ...alternativa(text, fa)];
  for (const a of adjunts) {
    parts.push(`--${fr}`, `Content-Type: ${a.blob.type || "application/pdf"}; name=${nomArxiu(a.nom)}`, `Content-Disposition: attachment; filename=${nomArxiu(a.nom)}`, "Content-Transfer-Encoding: base64", "", linies(await b64Blob(a.blob)));
  }
  parts.push(`--${fr}--`);
  return [...cap, `Content-Type: multipart/mixed; boundary="${fr}"`, "", ...parts].join("\r\n");
}
const b64url = s => b64Text(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function envia(msg) {
  if (!connectat()) { const e = new Error("Cal donar permís a Google per enviar el correu."); e.relogin = true; throw e; }
  const raw = b64url(await mime(msg));
  let r;
  try { r = await fetch(API + "/users/me/messages/send", { method: "POST", headers: { Authorization: `Bearer ${tok().at}`, "Content-Type": "application/json" }, body: JSON.stringify({ raw }) }); }
  catch { const e = new Error("Sense connexió amb Google."); e.offline = true; throw e; }
  const tx = await r.text(); let j = null; try { j = tx ? JSON.parse(tx) : null; } catch {}
  if (r.status === 401) { oblida(); const e = new Error("Cal tornar a donar permís a Google."); e.relogin = true; throw e; }
  if (!r.ok) {
    const m = String(j?.error?.message || "");
    const e = new Error(m || `Google ha tornat un error (${r.status}).`); e.status = r.status;
    if (r.status === 403 && /has not been used|is disabled|accessNotConfigured|SERVICE_DISABLED/i.test(m + JSON.stringify(j?.error?.details || j?.error?.errors || ""))) e.noActiva = true;
    if (r.status === 403 && /insufficient/i.test(m)) { e.relogin = true; oblida(); }
    throw e;
  }
  return j;
}
