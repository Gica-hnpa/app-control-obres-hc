// V87.636 · Fotos de les actes i de les notes (l'Héctor, 17/11/2026: «les fotos en vertical a notes i actes d'acord, però que adaptis espai i no
// deixis res en blanc»). Abans, cada foto anava en un requadre horitzontal (dues per fila, 62 mm d'alt) i s'omplia retallant-la: una vertical en
// perdia més de la meitat. Ara cada foto surt sencera i les fotos de cada fila tenen la mateixa alçada i omplen tota l'amplada (files
// «justificades»): les verticals fan la fila més estreta i les horitzontals més ampla, sense blanc entre elles.
// La forma de cada foto es llegeix de la capçalera de l'arxiu (JPEG o PNG en «data:»), tenint en compte el gir de l'EXIF.

function bytesBase64(b64, max) {
  const s = b64.slice(0, max);
  const net = s.slice(0, s.length - (s.length % 4));
  return atob(net);
}

// {w, h} tal com es veu la imatge (amb el gir de l'EXIF aplicat), o null si no es pot saber.
export function midesImatge878636(src) {
  const s = String(src || "");
  const m = /^data:image\/(jpeg|jpg|pjpeg|png);base64,/i.exec(s);
  if (!m) return null;
  try {
    const b64 = s.slice(m[0].length);
    if (/png/i.test(m[1])) {
      const bin = bytesBase64(b64, 64);
      if (bin.length < 24 || bin.slice(1, 4) !== "PNG") return null;
      const u = i => bin.charCodeAt(i);
      const w = ((u(16) << 24) | (u(17) << 16) | (u(18) << 8) | u(19)) >>> 0;
      const h = ((u(20) << 24) | (u(21) << 16) | (u(22) << 8) | u(23)) >>> 0;
      return w && h ? { w, h } : null;
    }
    // JPEG: es recorren els marcadors fins al SOFn (amb l'EXIF pel camí, per saber si la foto està girada)
    for (const max of [8192, 131072, 1048576]) {
      const bin = bytesBase64(b64, max);
      const u = i => bin.charCodeAt(i);
      if (u(0) !== 0xff || u(1) !== 0xd8) return null;
      let i = 2, gir = 1, falta = false;
      while (true) {
        if (i + 4 > bin.length) { falta = true; break; }
        if (u(i) !== 0xff) return null;
        const mk = u(i + 1);
        if (mk === 0xff) { i++; continue; }
        if (mk === 0xd8 || mk === 0x01 || (mk >= 0xd0 && mk <= 0xd7)) { i += 2; continue; }
        const len = (u(i + 2) << 8) | u(i + 3);
        if (mk === 0xe1 && bin.substr(i + 4, 6) === "Exif\0\0") {
          if (i + 2 + len > bin.length) { falta = true; break; }
          gir = girExif(bin, i + 10) || 1;
        }
        if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) {
          if (i + 9 > bin.length) { falta = true; break; }
          const h = (u(i + 5) << 8) | u(i + 6), w = (u(i + 7) << 8) | u(i + 8);
          if (!w || !h) return null;
          return gir >= 5 && gir <= 8 ? { w: h, h: w } : { w, h };
        }
        if (mk === 0xda || mk === 0xd9) return null;
        i += 2 + len;
      }
      if (!falta || b64.length <= max) return null;
    }
  } catch {}
  return null;
}

function girExif(bin, t) {
  const le = bin.substr(t, 2) === "II";
  const u = i => bin.charCodeAt(i);
  const r16 = p => (le ? u(p) | (u(p + 1) << 8) : (u(p) << 8) | u(p + 1));
  const r32 = p => (le ? (u(p) | (u(p + 1) << 8) | (u(p + 2) << 16) | (u(p + 3) << 24)) >>> 0 : ((u(p) << 24) | (u(p + 1) << 16) | (u(p + 2) << 8) | u(p + 3)) >>> 0);
  const ifd = t + r32(t + 4);
  if (ifd + 2 > bin.length) return 1;
  const n = r16(ifd);
  for (let k = 0; k < n; k++) {
    const e = ifd + 2 + k * 12;
    if (e + 10 > bin.length) break;
    if (r16(e) === 0x0112) return r16(e + 8);
  }
  return 1;
}

// Reparteix les fotos (ràtios amplada/alçada) en files que omplen l'amplada W (mm), amb l'alçada de cada fila tan a prop de H0 com es pugui.
// Programació dinàmica: es tria la manera de tallar les files que s'allunya menys de H0 (i mai més de 5 fotos per fila).
// Torna [{i, j, h, w}]: les fotos i..j-1, l'alçada de la fila i l'amplada que ocupa (W, o menys si la fila hauria de fer més de Hmax d'alt:
// una sola foto vertical, per exemple, no fa tota la pàgina d'alt: va al mig).
export function filesFotos878636(rs, { W = 182, g = 4, H0 = 66, Hmin = 40, Hmax = 125, HmaxSola = 140, maxFila = 5 } = {}) {
  const n = rs.length;
  if (!n) return [];
  const cost = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(-1);
  cost[0] = 0;
  for (let j = 1; j <= n; j++) {
    let sum = 0;
    for (let i = j - 1; i >= 0 && j - i <= maxFila; i--) {
      sum += rs[i];
      const k = j - i, h = (W - (k - 1) * g) / sum;
      let c = h < H0 ? 2 * (H0 - h) * (H0 - h) : (h - H0) * (h - H0); // més petites que H0 compten el doble: millor fotos grans
      const hm = k === 1 ? HmaxSola : Hmax; // una foto sola a la fila pot ser més alta (una horitzontal ocupa tota l'amplada)
      if (h > hm) c += (h - hm) * (h - hm) * 30;
      if (h < Hmin) c += (Hmin - h) * (Hmin - h) * 30;
      if (cost[i] + c < cost[j]) { cost[j] = cost[i] + c; prev[j] = i; }
    }
  }
  const files = [];
  for (let j = n; j > 0; j = prev[j]) files.unshift([prev[j], j]);
  return files.map(([i, j]) => {
    const k = j - i, sum = rs.slice(i, j).reduce((a, b) => a + b, 0);
    let h = (W - (k - 1) * g) / sum, w = W;
    const hm = k === 1 ? HmaxSola : Hmax;
    if (h > hm) { h = hm; w = sum * h + (k - 1) * g; }
    return { i, j, h, w };
  });
}

// L'HTML de les fotos: [{src, peu}] → files amb les fotos senceres. `esc` escapa el text.
export function fotosHtml878636(fotos, esc, opc = {}) {
  const l = (fotos || []).filter(f => f && f.src);
  if (!l.length) return "";
  const rs = l.map(f => { const m = midesImatge878636(f.src); const r = m ? m.w / m.h : 4 / 3; return Math.min(4, Math.max(0.25, r)); });
  const g = opc.g ?? 4;
  const mm = x => (Math.round(x * 100) / 100) + "mm";
  return `<div class="fotos-j878636">${filesFotos878636(rs, opc).map(f => `<div class="fr" style="width:${mm(f.w)}">${l.slice(f.i, f.j).map((x, k) => {
    const w = rs[f.i + k] * f.h;
    return `<figure style="width:${mm(w)}"><img src="${esc(x.src)}" alt="" style="height:${mm(f.h)}">${x.peu != null ? `<figcaption>${esc(x.peu || "")}</figcaption>` : ""}</figure>`;
  }).join("")}</div>`).join("")}</div>`;
}

// Els estils (es posen al full de cada document): la fila no es parteix entre pàgines; si l'arrodoniment passa d'una dècima, la foto
// s'encongeix (i es retalla una dècima de mil·límetre), no salta de línia.
export const CSS_FOTOS878636 = `.fotos-j878636{display:flex;flex-direction:column;gap:4mm}.fotos-j878636 .fr{display:flex;flex-wrap:nowrap;gap:4mm;margin:0 auto;max-width:100%;break-inside:avoid;page-break-inside:avoid}.fotos-j878636 figure{flex:0 1 auto;min-width:0;margin:0}.fotos-j878636 figure img{display:block;width:100%;object-fit:cover;border-radius:4px;border:1px solid #e2e8f0}.fotos-j878636 figcaption{font-size:9px;color:#64748b;margin-top:1mm;overflow-wrap:anywhere}`;
