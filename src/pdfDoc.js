// V87.405 · Un document de l'app (l'HTML de l'acta, del pressupost, de la factura…) en un PDF de debò per adjuntar-lo al correu
// o compartir-lo. L'HTML es dibuixa en un marc amagat de 794 px (un A4 a 96 ppp), es talla en pàgines sense partir cap línia,
// fila de taula, foto ni signatura, i cada pàgina va al PDF com una imatge (A4, 12 mm de marge a dalt i a baix).
// Les llibreries (html2canvas i jsPDF) només es carreguen quan es fa el primer PDF.

const AMPLE = 794;                       // px d'un A4 a 96 ppp
const MM = AMPLE / 210;                  // px per mm
const MARGE_MM = 12;                     // marge de dalt i de baix de cada pàgina
const ALT_PAG = Math.floor((297 - 2 * MARGE_MM) * MM);

const espera = ms => new Promise(r => setTimeout(r, ms));

function marc(html) {
  return new Promise((resolve, reject) => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = `position:fixed;left:-12000px;top:0;width:${AMPLE}px;height:${ALT_PAG}px;border:0;opacity:0;pointer-events:none`;
    document.body.appendChild(f);
    const doc = f.contentDocument;
    doc.open();
    // sense els marges de la impressió: al marc, la pàgina ja fa l'amplada d'un A4 i el document hi posa els seus
    doc.write(String(html || "").replace(/<head>/i, `<head><style>html,body{margin:0!important;background:#fff!important}@page{margin:0}</style>`));
    doc.close();
    const fi = async () => {
      try {
        const imgs = [...doc.images];
        await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
        try { await doc.fonts?.ready; } catch {}
        await espera(80);
        resolve(f);
      } catch (e) { reject(e); }
    };
    if (doc.readyState === "complete") fi(); else f.onload = fi;
  });
}

// on es pot tallar la pàgina: no pot partir cap element petit (línia de text, fila, foto, requadre de signatura…)
function talls(doc) {
  const total = Math.ceil(Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight));
  const sel = "p,li,tr,img,figure,h1,h2,h3,h4,h5,h6,pre,blockquote,dt,dd,.cd396,.cd396-sign,.cd396-peu,.k3box,.no-break,.sig,svg,canvas";
  const blocs = [];
  for (const el of doc.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.height < ALT_PAG * 0.85) blocs.push([r.top + doc.defaultView.scrollY, r.bottom + doc.defaultView.scrollY]);
  }
  // els que s'han de començar en una pàgina nova (page-break-before / break-before)
  const forcats = [];
  for (const el of doc.body.querySelectorAll("*")) {
    const cs = doc.defaultView.getComputedStyle(el);
    if (cs.breakBefore === "page" || cs.pageBreakBefore === "always") forcats.push(el.getBoundingClientRect().top + doc.defaultView.scrollY);
  }
  const parteix = y => blocs.some(([a, b]) => a < y - 1 && b > y + 1);
  const pags = [];
  let ini = 0;
  while (ini < total - 2) {
    let fi = Math.min(ini + ALT_PAG, total);
    const forc = forcats.filter(y => y > ini + 20 && y < fi).sort((a, b) => a - b)[0];
    if (forc) fi = forc;
    else if (fi < total) {
      // el tall més avall que no parteixi res (com a molt, mitja pàgina enrere)
      const cands = [fi, ...blocs.flatMap(([a, b]) => [a, b])].filter(y => y > ini + ALT_PAG * 0.5 && y <= fi).sort((a, b) => b - a);
      const bo = cands.find(y => !parteix(y));
      if (bo) fi = Math.floor(bo);
    }
    pags.push([ini, fi]);
    ini = fi;
  }
  return { pags, total };
}

// cada pàgina com una imatge JPEG ({src, altMm}); també la fan servir les proves per mirar com queda
export async function paginesImatge(html, { escala = 2, qualitat = 0.82 } = {}) {
  const { default: html2canvas } = await import("html2canvas");
  const f = await marc(html);
  try {
    const doc = f.contentDocument;
    const { pags, total } = talls(doc);
    // el marc fa l'alçada de tot el document: així html2canvas ho veu tot
    f.style.height = total + "px";
    await espera(30);
    const out = [];
    // V87.408 · on cau cada requadre de signatura ([data-signa]): pàgina i posició en mm des de dalt a l'esquerra del full A4
    out.signes = [];
    for (const el of doc.querySelectorAll("[data-signa]")) {
      const r = el.getBoundingClientRect(), top = r.top + doc.defaultView.scrollY;
      const i = pags.findIndex(([a, b]) => top >= a - 1 && top < b);
      if (i < 0 || !r.width || !r.height) continue;
      out.signes.push({ rol: el.getAttribute("data-signa"), pag: i + 1, x: r.left / MM, y: MARGE_MM + (top - pags[i][0]) / MM, w: r.width / MM, h: r.height / MM });
    }
    for (let i = 0; i < pags.length; i++) {
      const [a, b] = pags[i];
      const alt = Math.max(1, b - a);
      const cv = await html2canvas(doc.body, { x: 0, y: a, width: AMPLE, height: alt, windowWidth: AMPLE, windowHeight: total, scrollX: 0, scrollY: 0, scale: escala, backgroundColor: "#ffffff", useCORS: true, logging: false });
      out.push({ src: cv.toDataURL("image/jpeg", qualitat), altMm: alt / MM });
    }
    return out;
  } finally { f.remove(); }
}

async function fesPdf(html, opts = {}) {
  const [pags, { jsPDF }] = await Promise.all([paginesImatge(html, opts), import("jspdf")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pags.forEach((p, i) => { if (i) pdf.addPage("a4", "portrait"); pdf.addImage(p.src, "JPEG", 0, MARGE_MM, 210, p.altMm, undefined, "FAST"); });
  // V87.408 · la marca de l'app (a les paraules clau del PDF): diu de quin document és un PDF que torna signat
  if (opts.titol || opts.marca) pdf.setDocumentProperties({ title: opts.titol || "", keywords: opts.marca ? "aco878408:" + opts.marca : "", creator: "Control d'Obres" });
  return { pdf, signes: pags.signes || [] };
}
export async function htmlAPdf(html, opts = {}) {
  const { pdf } = await fesPdf(html, opts);
  return pdf.output("blob");
}
// V87.408 · el PDF per signar amb certificat: els bytes i on va cada signatura
export async function htmlAPdfPerSignar(html, opts = {}) {
  const { pdf, signes } = await fesPdf(html, opts);
  return { bytes: new Uint8Array(pdf.output("arraybuffer")), signes };
}

// un nom d'arxiu net: «Acta 03 · Reforma C/ Nou 5.pdf»
export function nomPdf(titol) {
  const n = String(titol || "Document").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "Document";
  return /\.pdf$/i.test(n) ? n : n + ".pdf";
}
