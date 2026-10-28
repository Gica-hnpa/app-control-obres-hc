// V87.405 · Un document de l'app (l'HTML de l'acta, del pressupost, de la factura…) en un PDF de debò per adjuntar-lo al correu
// o compartir-lo. Les llibreries (html2canvas i jsPDF) només es carreguen quan es fa el primer PDF.
// V87.425 · Els fulls surten de src/fullsA4.js, el mateix que fa servir la vista prèvia: cada pàgina és un A4 vertical o horitzontal
// (el que digui el document) amb els marges del seu @page, sense partir cap línia, fila, foto ni signatura, i al PDF cada pàgina és una
// imatge a la seva mida. Abans tot es dibuixava a l'amplada d'un A4 vertical i el quadre resum de les certificacions sortia tallat.
import { prepara, aPunt } from "./fullsA4.js";

const MARC = 1200;                       // px del marc: hi cap un A4 horitzontal (1123 px a 96 ppp)
const PX_MM = 96 / 25.4;

const espera = ms => new Promise(r => setTimeout(r, ms));

function marc(html) {
  return new Promise((resolve, reject) => {
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.style.cssText = `position:fixed;left:-14000px;top:0;width:${MARC}px;height:1200px;border:0;opacity:0;pointer-events:none`;
    document.body.appendChild(f);
    const doc = f.contentDocument;
    doc.open();
    doc.write(String(html || ""));
    doc.close();
    const fi = async () => {
      try { await aPunt(doc); await espera(80); resolve(f); } catch (e) { reject(e); }
    };
    if (doc.readyState === "complete") fi(); else f.onload = fi;
  });
}

// cada pàgina com una imatge JPEG ({src, l, wMm, hMm}); també la fan servir les proves per mirar com queda
export async function paginesImatge(html, { escala = 2, qualitat = 0.82 } = {}) {
  const { default: html2canvas } = await import("html2canvas");
  const f = await marc(html);
  try {
    const doc = f.contentDocument, win = doc.defaultView;
    const { fulls } = prepara(doc, { pdf: true });
    const total = Math.ceil(Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight));
    // el marc fa l'alçada de tot el document: així html2canvas ho veu tot
    f.style.height = total + "px";
    await espera(30);
    const out = [];
    // V87.408 · on cau cada requadre de signatura ([data-signa]): pàgina i posició en mm des de dalt a l'esquerra del full
    out.signes = [];
    for (const el of doc.querySelectorAll("[data-signa]")) {
      const r = el.getBoundingClientRect(), top = r.top + win.scrollY, left = r.left + win.scrollX;
      const i = fulls.findIndex(p => top >= p.y - 1 && top < p.y + p.h);
      if (i < 0 || !r.width || !r.height) continue;
      const p = fulls[i];
      out.signes.push({ rol: el.getAttribute("data-signa"), pag: i + 1, x: (left - p.x) / PX_MM, y: (top - p.y) / PX_MM, w: r.width / PX_MM, h: r.height / PX_MM, ph: p.l ? 210 : 297 });
    }
    for (const p of fulls) {
      const cv = await html2canvas(doc.body, { x: Math.round(p.x), y: Math.round(p.y), width: Math.round(p.w), height: Math.round(p.h), windowWidth: MARC, windowHeight: total, scrollX: 0, scrollY: 0, scale: escala, backgroundColor: "#ffffff", useCORS: true, logging: false });
      out.push({ src: cv.toDataURL("image/jpeg", qualitat), l: p.l, wMm: p.l ? 297 : 210, hMm: p.l ? 210 : 297 });
    }
    return out;
  } finally { f.remove(); }
}

async function fesPdf(html, opts = {}) {
  const [pags, { jsPDF }] = await Promise.all([paginesImatge(html, opts), import("jspdf")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: pags[0]?.l ? "landscape" : "portrait", compress: true });
  pags.forEach((p, i) => { if (i) pdf.addPage("a4", p.l ? "landscape" : "portrait"); pdf.addImage(p.src, "JPEG", 0, 0, p.wMm, p.hMm, undefined, "FAST"); });
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
