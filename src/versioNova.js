// V87.614 · Versió nova. Una pestanya que es queda oberta (l'ordinador de l'oficina, el mòbil amb l'app en segon pla) continua amb la
// versió que tenia quan es va obrir: el 16/11/2026 l'Héctor ensenyava una demo sense el botó «Llistat», que ja era a la versió publicada.
// Cada 10 minuts, en tornar a l'app i en recuperar la connexió, es mira si la pàgina publicada carrega un altre codi. Si és així, surt un
// avís petit: «Hi ha una versió nova de l'app · Actualitzar» (no es recarrega sol: es podria perdre el que s'està escrivint).
// Només a la versió publicada (a OBRIR_APP.bat el servidor de l'ordinador ja posa al dia l'app).
import { t } from "./i18n.js";

const RE = /assets\/index-[A-Za-z0-9_-]+\.js/;
let avisat = false, darrera = 0, enMarxa = false;

function codiActual() {
  for (const s of document.querySelectorAll('script[type="module"][src]')) {
    const m = (s.getAttribute("src") || "").match(RE);
    if (m) return m[0];
  }
  return "";
}

async function comprova(forca = false) {
  if (avisat || enMarxa || (typeof navigator !== "undefined" && navigator.onLine === false)) return false;
  const ara = Date.now();
  if (!forca && ara - darrera < 60 * 1000) return false;
  darrera = ara;
  const meu = codiActual();
  if (!meu) return false;
  enMarxa = true;
  try {
    // «vn» perquè el service worker no la guardi (sw-template.js) i «no-store» perquè el navegador tampoc
    const r = await fetch(`./?vn=${ara}`, { cache: "no-store" });
    if (!r.ok) return false;
    const m = (await r.text()).match(RE);
    if (m && m[0] !== meu) { avisa(); return true; }
  } catch {} finally { enMarxa = false; }
  return false;
}

function avisa() {
  if (avisat || document.querySelector(".versio-nova-v878614")) return;
  avisat = true;
  const d = document.createElement("div");
  d.className = "versio-nova-v878614";
  d.setAttribute("role", "status");
  const sp = document.createElement("span");
  sp.textContent = t("Hi ha una versió nova de l’app.");
  const b = document.createElement("button");
  b.type = "button";
  b.className = "primary";
  b.textContent = t("Actualitzar");
  b.addEventListener("click", () => { try { location.reload(); } catch {} });
  const x = document.createElement("button");
  x.type = "button";
  x.className = "tanca";
  x.setAttribute("aria-label", t("Tancar"));
  x.textContent = "×";
  // tancat, torna a sortir a la comprovació següent (no es pot quedar amb la vella per sempre)
  x.addEventListener("click", () => { d.remove(); avisat = false; darrera = Date.now(); });
  d.append(sp, b, x);
  document.body.appendChild(d);
}

export function startVersioNova() {
  setInterval(() => { comprova(); }, 10 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") comprova(); });
  window.addEventListener("online", () => { comprova(); });
  window.__acoVersioNova = { comprova: () => comprova(true) };
}
