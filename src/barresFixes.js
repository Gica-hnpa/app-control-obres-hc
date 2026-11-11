// V87.587 · Les barres fixes de baix al mòbil (la de navegació, la de «Guardar canvis» i el botó ＋) quan s'obre i es tanca el teclat
// (l'Héctor, 11/11/2026, omplint la certificació a l'iPhone: «queda fix però pel mig de la pantalla… en tot cas a baix»).
// A l'iPhone, en tancar el teclat, les barres de baix de vegades es queden a l'alçada on era el teclat fins que es torna a dalt de tot.
// - Mentre s'escriu (un camp de text amb el focus i el teclat obert), les barres s'amaguen (classe `teclat-v878587` a <html>): no suren pel
//   mig de la pantalla ni tapen el que s'escriu.
// - Amb el teclat tancat, es mesura on ha quedat la barra de navegació respecte de la part de baix del que es veu (`visualViewport`); si no hi
//   és, totes les barres es mouen el que falta (`--fix-dy`, CSS `translate`). Als navegadors que ho fan bé la diferència és 0 i no es mou res.
// Només als aparells tàctils; si la pantalla està ampliada amb dos dits, no es toca res.

const CAMP_NO = /^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/i;
const esCamp = e => !!e && (e.isContentEditable || e.tagName === "TEXTAREA" || e.tagName === "SELECT" || (e.tagName === "INPUT" && !CAMP_NO.test(e.type || "")));

export function startBarresFixes(win = window) {
  const doc = win.document, root = doc.documentElement;
  const tactil = () => { try { return !!win.matchMedia?.("(hover:none) and (pointer:coarse)").matches; } catch { return false; } };
  let dy = 0, teclat = false, maxH = 0, ampla = 0, pendent = 0;
  const posa = v => { if (v === dy) return; dy = v; if (v) root.style.setProperty("--fix-dy", v + "px"); else root.style.removeProperty("--fix-dy"); };
  function mesura() {
    pendent = 0;
    const vv = win.visualViewport;
    if (!vv || !tactil()) { posa(0); if (teclat) { teclat = false; root.classList.remove("teclat-v878587"); } return; }
    // en girar l'aparell, l'alçada de referència torna a començar
    if (Math.abs(win.innerWidth - ampla) > 2) { ampla = win.innerWidth; maxH = 0; }
    maxH = Math.max(maxH, vv.height);
    const obert = esCamp(doc.activeElement) && vv.height < maxH - 120;
    if (obert !== teclat) {
      teclat = obert; root.classList.toggle("teclat-v878587", obert);
      // en tancar-se el teclat, un moviment d'un píxel perquè l'iPhone torni a col·locar el que és fix
      if (!obert) { try { win.scrollBy(0, 1); win.scrollBy(0, -1); } catch {} }
    }
    if (obert || (vv.scale || 1) > 1.01) { posa(0); return; }
    const nav = doc.querySelector(".bottom-nav-v878268");
    const r = nav && win.getComputedStyle(nav).position === "fixed" ? nav.getBoundingClientRect() : null;
    if (!r || !r.height) { posa(0); return; }
    const d = Math.round(vv.offsetTop + vv.height - (r.bottom - dy));
    posa(Math.abs(d) > 2 ? d : 0);
  }
  const aviat = () => { if (!pendent) pendent = win.requestAnimationFrame(mesura); };
  const tard = () => { aviat(); for (const t of [120, 400, 900]) win.setTimeout(mesura, t); };
  const vv = win.visualViewport;
  vv?.addEventListener("resize", tard);
  vv?.addEventListener("scroll", aviat);
  win.addEventListener("scroll", aviat, { passive: true });
  win.addEventListener("resize", tard);
  win.addEventListener("orientationchange", tard);
  doc.addEventListener("focusin", tard);
  doc.addEventListener("focusout", tard);
  tard();
  // per a les proves
  win.__acoBarres878587 = { mesura, estat: () => ({ dy, teclat, maxH }) };
}
