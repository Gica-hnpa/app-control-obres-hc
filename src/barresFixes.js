// V87.587 · Les barres fixes de baix al mòbil (la de navegació, la de «Guardar canvis» i el botó ＋) quan s'obre i es tanca el teclat
// (l'Héctor, 11/11/2026, omplint la certificació a l'iPhone: «queda fix però pel mig de la pantalla… en tot cas a baix»).
// A l'iPhone, en tancar el teclat, les barres de baix de vegades es queden a l'alçada on era el teclat fins que es torna a dalt de tot.
// - Mentre s'escriu (un camp de text amb el focus i el teclat obert), les barres s'amaguen (classe `teclat-v878587` a <html>): no suren pel
//   mig de la pantalla ni tapen el que s'escriu.
// - Amb el teclat tancat, es mesura on ha quedat la barra de navegació respecte de la part de baix del que es veu (`visualViewport`); si no hi
//   és, totes les barres es mouen el que falta (`--fix-dy`, CSS `translate`). Als navegadors que ho fan bé la diferència és 0 i no es mou res.
// Només als aparells tàctils; si la pantalla està ampliada amb dos dits, no es toca res.
// V87.588 · (l'Héctor, 11/11/2026: «es queda clavat en moltes pantalles», a l'Inici, sense escriure res) És l'error de l'iOS 26 (WebKit 297779):
// després del teclat, l'iPhone es queda amb la pantalla «més baixa» (`innerHeight` i `visualViewport` petits) fins que es tanca l'app, i el
// que és fix a baix queda enlairat a totes les pantalles. Com que també el `visualViewport` diu la mida dolenta, es recorda l'alçada bona
// (la més gran vista amb aquella amplada) i, si sense teclat la pantalla queda més baixa una estona:
//   1. es «cura»: s'amaga i es torna a mostrar l'app (#root) en el mateix instant, sense pintar res entremig, i l'iPhone torna a mesurar
//      (el truc que funciona a les apps instal·lades a la pantalla d'inici); es manté on s'era de la pàgina;
//   2. si no se cura, a l'app instal·lada les barres es mouen fins a l'alçada bona.
// A Safari (no instal·lada) l'alçada canvia de debò quan surt o s'amaga la barra de l'adreça: allà només es mira el `visualViewport`.

const CAMP_NO = /^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/i;
const esCamp = e => !!e && (e.isContentEditable || e.tagName === "TEXTAREA" || e.tagName === "SELECT" || (e.tagName === "INPUT" && !CAMP_NO.test(e.type || "")));

export function startBarresFixes(win = window) {
  const doc = win.document, root = doc.documentElement;
  const tactil = () => { try { return !!win.matchMedia?.("(hover:none) and (pointer:coarse)").matches; } catch { return false; } };
  const instal = () => { try { return win.navigator.standalone === true || !!win.matchMedia?.("(display-mode: standalone)").matches; } catch { return false; } };
  let dy = 0, teclat = false, maxH = 0, maxIH = 0, ampla = 0, pendent = 0;
  let encallatDes = 0, cures = 0, ultimaCura = 0;
  const posa = v => { if (v === dy) return; dy = v; if (v) root.style.setProperty("--fix-dy", v + "px"); else root.style.removeProperty("--fix-dy"); };
  function cura() {
    const app = doc.getElementById("root");
    if (!app) return;
    const x = win.scrollX, y = win.scrollY;
    try {
      app.style.display = "none"; void app.offsetHeight;
      app.style.display = ""; void app.offsetHeight;
      win.scrollTo(x, y);
    } catch {}
    cures++; ultimaCura = Date.now();
  }
  function mesura() {
    pendent = 0;
    const vv = win.visualViewport;
    if (!vv || !tactil()) { posa(0); if (teclat) { teclat = false; root.classList.remove("teclat-v878587"); } return; }
    // en girar l'aparell, l'alçada de referència torna a començar
    if (Math.abs(win.innerWidth - ampla) > 2) { ampla = win.innerWidth; maxH = 0; maxIH = 0; }
    maxH = Math.max(maxH, vv.height);
    maxIH = Math.max(maxIH, win.innerHeight);
    const obert = esCamp(doc.activeElement) && vv.height < maxH - 120;
    if (obert !== teclat) {
      teclat = obert; root.classList.toggle("teclat-v878587", obert);
      // en tancar-se el teclat, un moviment d'un píxel perquè l'iPhone torni a col·locar el que és fix
      if (!obert) { try { win.scrollBy(0, 1); win.scrollBy(0, -1); } catch {} }
    }
    if (obert || (vv.scale || 1) > 1.01) { posa(0); encallatDes = 0; return; }
    const sa = instal();
    // V87.588 · la pantalla encallada més baixa (sense teclat): a l'app instal·lada, més baixa que l'alçada bona; a Safari, el
    // visualViewport més baix que la finestra
    const encallat = sa ? (win.innerHeight < maxIH - 4 || vv.height < maxIH - 4) : (vv.height < win.innerHeight - 4);
    if (encallat) {
      const ara = Date.now();
      if (!encallatDes) { encallatDes = ara; win.setTimeout(mesura, 520); }
      // una estona (que no sigui el teclat tancant-se) i no més d'una cura cada 2 s ni més de 3 seguides
      else if (ara - encallatDes >= 450 && ara - ultimaCura > 2000 && cures < 3) { cura(); win.setTimeout(mesura, 60); win.setTimeout(mesura, 400); }
    } else { encallatDes = 0; cures = 0; }
    const nav = doc.querySelector(".bottom-nav-v878268");
    const r = nav && win.getComputedStyle(nav).position === "fixed" ? nav.getBoundingClientRect() : null;
    if (!r || !r.height) { posa(0); return; }
    const baix = sa ? Math.max(maxIH, vv.offsetTop + vv.height) : vv.offsetTop + vv.height;
    const d = Math.round(baix - (r.bottom - dy));
    posa(Math.abs(d) > 2 ? d : 0);
  }
  const aviat = () => { if (!pendent) pendent = win.requestAnimationFrame(mesura); };
  const tard = () => { aviat(); for (const t of [120, 400, 900, 1600]) win.setTimeout(mesura, t); };
  const vv = win.visualViewport;
  vv?.addEventListener("resize", tard);
  vv?.addEventListener("scroll", aviat);
  win.addEventListener("scroll", aviat, { passive: true });
  win.addEventListener("resize", tard);
  win.addEventListener("orientationchange", tard);
  win.addEventListener("pageshow", tard);
  doc.addEventListener("visibilitychange", () => { if (doc.visibilityState === "visible") tard(); });
  doc.addEventListener("focusin", tard);
  doc.addEventListener("focusout", tard);
  // en canviar de pantalla (un clic a la barra o a un botó), es torna a mirar
  doc.addEventListener("click", () => win.setTimeout(mesura, 250), true);
  tard();
  // per a les proves
  win.__acoBarres878587 = { mesura, cura, estat: () => ({ dy, teclat, maxH, maxIH, cures, sa: instal() }) };
}
