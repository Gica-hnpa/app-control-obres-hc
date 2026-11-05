// V87.522 · Un ZIP sense comprimir (els PDF i les fotos ja ho estan), amb els noms en UTF-8. Sense llibreries.
//   fesZip([{nom:"carpeta/arxiu.pdf", dades: Blob | Uint8Array | ArrayBuffer | string}]) → Blob (application/zip)

const T = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
export function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

async function bytes(d) {
  if (d instanceof Uint8Array) return d;
  if (d instanceof ArrayBuffer) return new Uint8Array(d);
  if (typeof d === "string") return new TextEncoder().encode(d);
  if (d && typeof d.arrayBuffer === "function") return new Uint8Array(await d.arrayBuffer());
  return new Uint8Array(0);
}

// noms sense caràcters que Windows no accepta i sense repetir-ne cap (si n'hi ha dos d'iguals, «nom (2).pdf»)
export function nomNet(n) { return String(n || "arxiu").replace(/[\\:*?"<>|]+/g, " ").replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").trim().slice(0, 180) || "arxiu"; }
function unics(llista) {
  const vist = new Set();
  return llista.map(f => {
    let nom = nomNet(f.nom), i = 2;
    const m = /^(.*?)(\.[a-z0-9]{1,5})?$/i.exec(nom), base = m[1], ext = m[2] || "";
    while (vist.has(nom.toLowerCase())) nom = `${base} (${i++})${ext}`;
    vist.add(nom.toLowerCase());
    return { ...f, nom };
  });
}

export async function fesZip(fitxers = []) {
  const enc = new TextEncoder(), parts = [], cent = [];
  const ara = new Date();
  const hora = ((ara.getHours() << 11) | (ara.getMinutes() << 5) | (ara.getSeconds() >> 1)) & 0xFFFF;
  const dia = (((ara.getFullYear() - 1980) << 9) | ((ara.getMonth() + 1) << 5) | ara.getDate()) & 0xFFFF;
  let off = 0, n = 0;
  for (const f of unics(fitxers)) {
    const nom = enc.encode(f.nom), d = await bytes(f.dades), crc = crc32(d);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, hora, true); h.setUint16(12, dia, true); h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true);
    h.setUint16(26, nom.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nom, d);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, hora, true); c.setUint16(14, dia, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true);
    c.setUint16(28, nom.length, true); c.setUint32(42, off, true);
    cent.push(new Uint8Array(c.buffer), nom);
    off += 30 + nom.length + d.length; n++;
  }
  const mida = cent.reduce((x, y) => x + y.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, n, true); e.setUint16(10, n, true); e.setUint32(12, mida, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cent, new Uint8Array(e.buffer)], { type: "application/zip" });
}
