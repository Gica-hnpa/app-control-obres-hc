// V87.425 · Cada document de l'app en fulls A4 (vertical o horitzontal, el que digui el document), igual a la vista prèvia, al PDF
// i en imprimir-lo. L'Héctor, 28/10/2026: «al descarregar el PDF a origen el quadre surt tallat… qualsevol previsualització a
// qualsevol dispositiu ha de ser com si fos un A4 en vertical o horitzontal segons sigui el cas». Abans la vista prèvia ensenyava
// l'HTML estirat a l'amplada de la finestra i el PDF el dibuixava sempre a l'amplada d'un A4 vertical: el quadre resum de les
// certificacions (A4 horitzontal) en sortia per la meitat.
//
// prepara(doc) treballa sobre el document d'un marc (iframe) ja carregat:
//  1. fa servir els estils «per imprimir» del document: els de @media print passen a valer sempre i els de @media screen es treuen;
//  2. cada full (cada .page de primer nivell; si no n'hi ha, el body) fa l'amplada del paper amb els marges del seu @page
//     (vertical o horitzontal pel `size`, la classe «landscape» o la pàgina amb nom: `page: certLandscapeV8772`);
//  3. el talla en pàgines sense partir cap línia, fila, foto ni requadre, i allà on acaba una pàgina hi posa l'espai fins a la
//     següent (una fila buida a les taules, un marge o un bloc buit), de manera que cada pàgina queda a la seva alçada d'A4.
// Torna les pàgines (rectangles en px del document) perquè el PDF en faci una imatge per pàgina.

const PX_MM = 96 / 25.4;
const GAP = 18;                 // espai gris entre fulls a la vista prèvia
const FONS = "#C9D1DA";
const BLOCS = "p,li,tr,img,figure,h1,h2,h3,h4,h5,h6,pre,blockquote,dt,dd,.cd396,.cd396-sign,.cd396-peu,.k3box,.no-break,.sig,.sgi,svg,canvas";
const CONTENIDORS = "div,section,article,header,footer,aside,main,nav,ul,ol,dl,form,fieldset";
const INLINE = /^(B|I|U|S|EM|STRONG|SMALL|SPAN|A|BR|SUP|SUB|CODE|MARK|ABBR|Q|CITE|TIME|LABEL|WBR|FONT|IMG|SVG)$/;

function aPx(v, def) {
  const m = String(v || "").trim().match(/^(-?[\d.]+)\s*(mm|cm|in|pt|px)?$/i);
  if (!m) return def;
  const n = parseFloat(m[1]), u = (m[2] || "px").toLowerCase();
  return n * ({ mm: PX_MM, cm: PX_MM * 10, in: 96, pt: 96 / 72, px: 1 }[u] || 1);
}

// les regles @page del document, i els estils d'imprimir passen a valer a la pantalla
function estilsImprimir(doc) {
  const pags = [];
  for (const sh of [...doc.styleSheets]) {
    let rs; try { rs = sh.cssRules; } catch { continue; }
    for (let i = rs.length - 1; i >= 0; i--) {
      const r = rs[i];
      if (r.type !== 4) continue; // CSSMediaRule
      const m = String(r.media?.mediaText || "").toLowerCase();
      const print = /\bprint\b/.test(m), screen = /\bscreen\b/.test(m);
      if (print && !screen) {
        const dins = [...r.cssRules].map(x => x.cssText);
        sh.deleteRule(i);
        dins.forEach((t, k) => { try { sh.insertRule(t, i + k); } catch {} });
      } else if (screen && !print) sh.deleteRule(i);
    }
    for (const r of [...sh.cssRules]) {
      if (r.type !== 6) continue; // CSSPageRule
      const st = r.style;
      pags.push({ nom: String(r.selectorText || "").trim(), size: st.getPropertyValue("size") || "", m: [st.marginTop, st.marginRight, st.marginBottom, st.marginLeft] });
    }
  }
  return pags;
}

function reglaDe(win, root, pags) {
  let nom = "";
  try { nom = win.getComputedStyle(root).page || ""; } catch {}
  if (nom === "auto") nom = "";
  let r = nom ? pags.find(p => p.nom === nom) : null;
  if (!r && root.classList.contains("landscape")) r = pags.find(p => /landscape/i.test(p.size));
  if (!r && root.classList.contains("portrait")) r = pags.find(p => p.nom && /portrait/i.test(p.size));
  if (!r) r = pags.find(p => !p.nom) || pags.find(p => p.nom && !/^:/.test(p.nom) && !/landscape/i.test(p.size)) || null;
  return r;
}
function horitzontal(r, root) {
  const s = String(r?.size || "");
  if (/landscape/i.test(s)) return true;
  if (/portrait/i.test(s)) return false;
  const d = s.match(/([\d.]+\s*(?:mm|cm|in|pt|px))\s+([\d.]+\s*(?:mm|cm|in|pt|px))/i);
  if (d) return aPx(d[1], 0) > aPx(d[2], 0);
  return root.classList.contains("landscape");
}

function cssFulls(pdf) {
  return `html{background:${pdf ? "#fff" : FONS}!important;min-height:0!important}
html body:not([data-a4]){margin:0!important;padding:${pdf ? 0 : GAP}px 0 ${pdf ? 0 : 2}px!important;background:transparent!important;width:auto!important;min-width:0!important;max-width:none!important;min-height:0!important;box-shadow:none!important;border:0!important}
html [data-a4][data-a4]{box-sizing:border-box!important;margin:0 auto ${pdf ? 0 : GAP}px!important;background:${pdf ? "#fff" : "transparent"}!important;position:relative!important;z-index:0;isolation:isolate;max-width:none!important;min-width:0!important;min-height:0!important;height:auto!important;float:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;transform:none!important;zoom:1!important}
html body[data-a4][data-a4]{margin:${pdf ? 0 : GAP}px auto!important}
.a4-full{position:absolute;left:0;right:0;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.14),0 6px 18px rgba(15,23,42,.10);z-index:-1;pointer-events:none}
.a4-espai{display:block;margin:0!important;padding:0!important;border:0!important;background:transparent!important;break-inside:auto}
tr.a4-espai{display:table-row}
tr.a4-espai>td{padding:0!important;border:0!important;background:transparent!important}
span.a4-espai{display:block}`;
}

const absTop = (win, el) => el.getBoundingClientRect().top + win.scrollY;

// els requadres que no es poden partir (i les línies de text dels que fan més d'una pàgina)
function blocsDe(doc, root, ALT) {
  const win = doc.defaultView, sy = win.scrollY, out = [];
  const visible = (r) => r.height > 0.5;
  for (const el of root.querySelectorAll(BLOCS)) {
    if (el.closest(".a4-espai")) continue;
    const r = el.getBoundingClientRect();
    if (!visible(r)) continue;
    if (r.height < ALT * 0.85) out.push([r.top + sy, r.bottom + sy, el]);
  }
  for (const el of root.querySelectorAll(CONTENIDORS)) {
    if (el.classList.contains("a4-espai") || el.classList.contains("a4-full")) continue;
    const r = el.getBoundingClientRect();
    if (!visible(r)) continue;
    const cs = win.getComputedStyle(el);
    if (cs.display === "none" || cs.position === "absolute" || cs.position === "fixed") continue;
    const flexgrid = /flex|grid/.test(cs.display) && !(/flex/.test(cs.display) && /column/.test(cs.flexDirection));
    const fulla = ![...el.children].some(c => !INLINE.test(c.tagName));
    if (!flexgrid && !fulla) continue;
    if (r.height < ALT * 0.85) { out.push([r.top + sy, r.bottom + sy, el]); continue; }
    if (fulla) {
      // un text que fa més d'una pàgina: es pot tallar entre línies
      const tw = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const rg = doc.createRange();
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.nodeValue.trim()) continue;
        rg.selectNodeContents(n);
        for (const lr of rg.getClientRects()) if (lr.height > 0) out.push([lr.top + sy, lr.bottom + sy, null, n]);
      }
    }
  }
  return out;
}

// on s'acaba la pàgina que comença a `ini`: el tall més avall que no parteix res i l'element que comença just després
function tall(doc, root, ini, ALT, forcats) {
  const win = doc.defaultView, sy = win.scrollY, fi0 = ini + ALT;
  const blocs = blocsDe(doc, root, ALT);
  const parteix = y => blocs.some(([a, b]) => a < y - 1 && b > y + 1);
  for (const el of forcats) {
    const y = el.getBoundingClientRect().top + sy;
    if (y > ini + 20 && y < fi0) return { fi: y, el };
  }
  const cands = [fi0, ...blocs.flatMap(([a, b]) => [a, b])].filter(y => y > ini + ALT * 0.45 && y <= fi0).sort((a, b) => b - a);
  let fi = cands.find(y => !parteix(y));
  if (fi === undefined) return { fi: fi0, el: null };
  // un títol no es queda sol a baix de la pàgina: passa a la següent amb el que el segueix
  const titol = blocs.filter(b => b[2] && /^H[1-6]$/.test(b[2].tagName) && b[1] <= fi + 1 && b[1] > fi - 48).sort((a, b) => b[1] - a[1])[0];
  if (titol && titol[0] > ini + ALT * 0.3 && !parteix(titol[0])) fi = titol[0];
  // el primer que comença al tall o després: aquest és el que passa a la pàgina següent
  let best = null;
  for (const bl of blocs) {
    if (bl[0] < fi - 1) continue;
    if (!best || bl[0] < best[0] - 0.5) best = bl;
  }
  if (!best) return { fi, el: null };
  if (best[3]) return { fi, text: best[3], y: best[0] };
  let el = best[2];
  // si un pare comença al mateix lloc, s'empeny el pare (la taula sencera, el bloc sencer)
  while (el.parentElement && el.parentElement !== root && el.parentElement !== doc.body && Math.abs(absTop(win, el.parentElement) - best[0]) < 1.5) el = el.parentElement;
  if (/^(TBODY|THEAD|TFOOT)$/.test(el.tagName) && el.rows?.length) el = el.rows[0];
  return { fi, el };
}

// quantes columnes té una taula (les <col> o la fila amb més cel·les, comptant els colspan)
function colsTaula(t) {
  if (!t) return 1;
  let n = [...t.querySelectorAll(":scope>colgroup>col")].reduce((s, c) => s + (c.span || 1), 0);
  for (const r of [...t.rows].slice(0, 12)) { if (r.classList.contains("a4-espai")) continue; n = Math.max(n, [...r.cells].reduce((s, c) => s + (c.colSpan || 1), 0)); }
  return Math.max(1, n);
}
// porta l'element (o la línia de text) a `y`
function empeny(doc, t, y) {
  const win = doc.defaultView;
  if (t.text) {
    const n = t.text, rg = doc.createRange();
    let lo = 0, hi = n.nodeValue.length - 1, off = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      rg.setStart(n, mid); rg.setEnd(n, mid + 1);
      const r = rg.getClientRects()[0] || rg.getBoundingClientRect();
      if (r.top + win.scrollY >= t.y - 1) { off = mid; hi = mid - 1; } else lo = mid + 1;
    }
    if (off <= 0) return false;
    const resta = n.splitText(off);
    const sp = doc.createElement("span"); sp.className = "a4-espai"; sp.setAttribute("aria-hidden", "true");
    resta.parentNode.insertBefore(sp, resta);
    const h = y - (sp.getBoundingClientRect().top + win.scrollY);
    sp.style.setProperty("height", Math.max(0, h) + "px", "important");
    return true;
  }
  const el = t.el;
  let mira = el; // el que ha de quedar a dalt de la pàgina nova
  const d0 = y - absTop(win, el);
  if (d0 <= 0.5) return true;
  const pare = el.parentElement, pd = win.getComputedStyle(pare).display;
  let posa;
  if (el.tagName === "TR") {
    const tr = doc.createElement("tr"); tr.className = "a4-espai"; tr.setAttribute("aria-hidden", "true");
    // V87.435 · la fila d'espai ocupa just les columnes de la taula: amb «colspan 99», a les taules d'amplada fixa (el pressupost) el
    // navegador hi feia 93 columnes buides i la de la descripció quedava sense amplada (la lletra sortia en vertical a la vista i al PDF)
    const taula = el.closest("table"), cap = taula?.tHead;
    const td = doc.createElement("td"); td.colSpan = colsTaula(taula); tr.appendChild(td);
    el.parentNode.insertBefore(tr, el);
    // com en imprimir: la capçalera de la taula torna a sortir a dalt de la pàgina nova
    if (cap && el.parentElement !== cap && win.getComputedStyle(cap).display !== "none") {
      const files = [...cap.rows].map(r => { const c = r.cloneNode(true); c.classList.add("a4-cap"); c.setAttribute("aria-hidden", "true"); return c; });
      files.forEach(c => el.parentNode.insertBefore(c, el));
      if (files.length) mira = files[0];
    }
    posa = h => td.style.setProperty("height", Math.max(0, h) + "px", "important");
  } else if (/flex|grid/.test(pd) || el.tagName === "LI" || /table/.test(pd)) {
    const m = parseFloat(win.getComputedStyle(el).marginTop) || 0;
    posa = h => el.style.setProperty("margin-top", (m + Math.max(0, h)) + "px", "important");
  } else {
    const sp = doc.createElement("div"); sp.className = "a4-espai"; sp.setAttribute("aria-hidden", "true");
    el.parentNode.insertBefore(sp, el);
    posa = h => sp.style.setProperty("height", Math.max(0, h) + "px", "important");
  }
  let d = y - absTop(win, mira);
  posa(d);
  for (let i = 0; i < 3; i++) {
    const e = y - absTop(win, mira);
    if (Math.abs(e) < 0.5) break;
    d += e; posa(d);
  }
  return true;
}

function paginaFull(doc, root, { H, mt, mb, gap }) {
  const win = doc.defaultView, ALT = H - mt - mb, tops = [];
  const rootTop = absTop(win, root);
  // els que han de començar en una pàgina nova (break-before / page-break-before)
  const forcats = [...root.querySelectorAll("*")].filter(el => { const cs = win.getComputedStyle(el); return cs.breakBefore === "page" || cs.pageBreakBefore === "always"; });
  let ini = rootTop + mt;
  for (let g = 0; g < 500; g++) {
    const r = root.getBoundingClientRect();
    const fiCont = r.bottom + win.scrollY - (parseFloat(root.style.getPropertyValue("padding-bottom")) || mb);
    tops.push(ini - mt);
    if (fiCont <= ini + ALT + 1) {
      root.style.setProperty("padding-bottom", (mb + Math.max(0, ini + ALT - fiCont)) + "px", "important");
      break;
    }
    const t = tall(doc, root, ini, ALT, forcats);
    const seg = ini + ALT + mb + gap + mt;
    if ((t.el || t.text) && empeny(doc, t, seg)) ini = seg;
    else ini = Math.max(t.fi, ini + 40); // no hi ha res per empènyer: la pàgina següent continua al tall
  }
  return tops.map(y => y - rootTop);
}

// prepara el document (una sola vegada) i torna les pàgines
export function prepara(doc, { pdf = false } = {}) {
  const html = doc.documentElement;
  if (html.__a4) return html.__a4;
  const win = doc.defaultView;
  const pags = estilsImprimir(doc);
  let roots = [...doc.querySelectorAll(".page")].filter(e => !e.parentElement?.closest(".page") && win.getComputedStyle(e).display !== "none");
  if (!roots.length) roots = [doc.body];
  const st = doc.createElement("style"); st.setAttribute("data-a4-css", ""); st.textContent = cssFulls(pdf);
  (doc.head || html).appendChild(st);
  const fulls = [];
  const conf = roots.map(root => {
    const r = reglaDe(win, root, pags), l = horitzontal(r, root);
    const [W, H] = l ? [297, 210] : [210, 297];
    const m = (r?.m || []).map(v => aPx(v, NaN));
    const def = 10 * PX_MM;
    const [mt, mr, mb, ml] = [0, 1, 2, 3].map(i => Number.isFinite(m[i]) ? m[i] : def);
    root.setAttribute("data-a4", l ? "l" : "p");
    for (const [k, v] of [["width", W + "mm"], ["padding-top", mt + "px"], ["padding-right", mr + "px"], ["padding-bottom", mb + "px"], ["padding-left", ml + "px"]]) root.style.setProperty(k, v, "important");
    return { root, l, W: W * PX_MM, H: H * PX_MM, mt, mb };
  });
  for (const c of conf) {
    const tops = paginaFull(doc, c.root, { H: c.H, mt: c.mt, mb: c.mb, gap: pdf ? 0 : GAP });
    if (!pdf) for (const y of tops) {
      const f = doc.createElement("div"); f.className = "a4-full"; f.setAttribute("aria-hidden", "true");
      f.style.top = y + "px"; f.style.height = c.H + "px";
      c.root.appendChild(f);
    }
    c.tops = tops;
  }
  for (const c of conf) {
    const r = c.root.getBoundingClientRect();
    const x = r.left + win.scrollX, y0 = r.top + win.scrollY;
    for (const y of c.tops) fulls.push({ x, y: y0 + y, w: c.W, h: c.H, l: c.l });
  }
  html.__a4 = { fulls, ample: Math.max(...fulls.map(f => f.w), 0) };
  return html.__a4;
}

// espera que el document del marc tingui les imatges i les lletres a punt
export async function aPunt(doc) {
  const imgs = [...doc.images];
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  try { await doc.fonts?.ready; } catch {}
}
