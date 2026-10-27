// V87.408 · Les signatures amb certificat d'un PDF (PAdES / adbe.pkcs7.detached): qui ha signat (nom, NIF, entitat que ha emès el
// certificat), quan, i si la signatura és bona i el document no s'ha tocat després de signar-lo.
// Serveix per al PDF que torna l'AutoFirma i per al que algú torna signat pel seu compte (AutoFirma, Adobe Acrobat…).
// Es comprova: que el resum (hash) del document és el de la signatura i que la signatura és del certificat (WebCrypto).
// No es comprova la cadena fins a l'autoritat ni si el certificat està revocat: es diu qui l'ha emès (FNMT, AOC/idCAT, DNIe…).

const latin1 = b => { let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return s; };

// ---- DER / BER ----
function tlv(b, i) {
  const tag = b[i];
  let len = b[i + 1], p = i + 2;
  if (len === 0x80) {                         // longitud indefinida (BER): fins als dos zeros
    let q = p;
    while (q < b.length - 1 && !(b[q] === 0 && b[q + 1] === 0)) q = tlv(b, q).fi;
    return { tag, ini: p, fin: q, fi: q + 2, i };
  }
  if (len & 0x80) { const n = len & 0x7f; len = 0; for (let k = 0; k < n; k++) len = len * 256 + b[p++]; }
  return { tag, ini: p, fin: p + len, fi: p + len, i };
}
const fills = (b, n) => { const out = []; let p = n.ini; while (p < n.fin) { const k = tlv(b, p); out.push(k); p = k.fi; } return out; };
const bytes = (b, n) => b.subarray(n.ini, n.fin);
const tot = (b, n) => b.subarray(n.i, n.fi);
function oid(b, n) {
  const v = bytes(b, n); const out = [Math.floor(v[0] / 40), v[0] % 40]; let x = 0;
  for (let i = 1; i < v.length; i++) { x = x * 128 + (v[i] & 0x7f); if (!(v[i] & 0x80)) { out.push(x); x = 0; } }
  return out.join(".");
}
function text(b, n) {
  const v = bytes(b, n);
  if (n.tag === 0x1e) { let s = ""; for (let i = 0; i + 1 < v.length; i += 2) s += String.fromCharCode(v[i] * 256 + v[i + 1]); return s; }
  try { return new TextDecoder("utf-8", { fatal: true }).decode(v); } catch { return latin1(v); }
}
function hora(b, n) {
  const s = latin1(bytes(b, n));
  const m = n.tag === 0x17 ? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?/.exec(s) : /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?/.exec(s);
  if (!m) return null;
  let y = +m[1]; if (n.tag === 0x17) y += y < 50 ? 2000 : 1900;
  return new Date(Date.UTC(y, +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0))).toISOString();
}
const NOMS = { "2.5.4.3": "cn", "2.5.4.5": "serial", "2.5.4.4": "cognom", "2.5.4.42": "nom", "2.5.4.10": "org", "2.5.4.11": "ou", "2.5.4.6": "pais", "2.5.4.97": "orgId", "2.5.4.12": "titol" };
function nomX500(b, n) {
  const o = {};
  for (const set of fills(b, n)) for (const atv of fills(b, set)) {
    const [k, v] = fills(b, atv); const key = NOMS[oid(b, k)];
    if (key && !o[key]) o[key] = text(b, v).trim();
  }
  return o;
}
function certificat(b, n) {
  const [tbs] = fills(b, n);
  let f = fills(b, tbs);
  if (f[0].tag === 0xa0) f = f.slice(1);
  const [serial, , emissor, validesa, titular, spki] = f;
  const [desde, fins] = fills(b, validesa);
  return { serial: [...bytes(b, serial)].map(x => x.toString(16).padStart(2, "0")).join(""), emissor: nomX500(b, emissor), titular: nomX500(b, titular), desde: hora(b, desde), fins: hora(b, fins), spki: tot(b, spki).slice(), der: tot(b, n).slice() };
}

// el NIF del certificat: «IDCES-12345678Z», «12345678Z», el de l'entitat (2.5.4.97 «VATES-B12345678») o dins del nom («… - 12345678Z»)
function nifDe(t) {
  const net = s => String(s || "").replace(/^(IDC|PAS|VAT|NTR)[A-Z]{2}-/i, "").trim();
  const nif = net(t.serial) || "";
  if (/^[0-9XYZ][0-9]{7}[A-Z]$|^[A-Z][0-9]{7}[0-9A-J]$/i.test(nif)) return nif.toUpperCase();
  const m = /\b([0-9XYZ][0-9]{7}[A-Z]|[A-HJ-NP-SUVW][0-9]{7}[0-9A-J])\b/i.exec(t.cn || "");
  return m ? m[1].toUpperCase() : nif;
}
// el nom de la persona: «NOM COGNOMS» (el CN dels certificats de la FNMT és «COGNOM1 COGNOM2 NOM - 12345678Z»)
function nomDe(t) {
  if (t.nom || t.cognom) return [t.nom, t.cognom].filter(Boolean).join(" ").trim();
  // i el dels representants, «12345678Z NOM COGNOMS (R: B12345678)»
  return String(t.cn || "").replace(/\s*\(R:\s*[^)]*\)\s*$/i, "").replace(/\s*-\s*(NIF:?\s*)?[0-9XYZ][0-9]{7}[A-Z]\s*$/i, "").replace(/^[0-9XYZ][0-9]{7}[A-Z]\s+/i, "").trim();
}
const ESPECIALS = [[/FNMT/i, "FNMT-RCM"], [/AOC|EC-Ciutadania|EC-SectorPublic|idCAT|Consorci/i, "Consorci AOC (idCAT)"], [/DNIE|DIRECCION GENERAL DE LA POLICIA/i, "DNIe (Policia Nacional)"], [/Firmaprofesional/i, "Firmaprofesional"], [/Camerfirma/i, "Camerfirma"], [/ANCERT/i, "ANCERT"], [/Izenpe/i, "Izenpe"], [/ACCV/i, "ACCV"], [/Uanataca/i, "Uanataca"]];
function emissorDe(e) {
  const s = [e.cn, e.org, e.ou].filter(Boolean).join(" ");
  for (const [re, nom] of ESPECIALS) if (re.test(s)) return nom;
  return e.org || e.cn || "";
}

const DIGEST = { "1.3.14.3.2.26": "SHA-1", "2.16.840.1.101.3.4.2.1": "SHA-256", "2.16.840.1.101.3.4.2.2": "SHA-384", "2.16.840.1.101.3.4.2.3": "SHA-512" };
const SIG_HASH = { "1.2.840.113549.1.1.5": "SHA-1", "1.2.840.113549.1.1.11": "SHA-256", "1.2.840.113549.1.1.12": "SHA-384", "1.2.840.113549.1.1.13": "SHA-512", "1.2.840.10045.4.3.2": "SHA-256", "1.2.840.10045.4.3.3": "SHA-384", "1.2.840.10045.4.3.4": "SHA-512" };
const CORBES = { "1.2.840.10045.3.1.7": ["P-256", 32], "1.3.132.0.34": ["P-384", 48], "1.3.132.0.35": ["P-521", 66] };
const igual = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

async function verifica(spki, alg, hash, sig, dades) {
  const s = globalThis.crypto?.subtle; if (!s) return null;
  try {
    // l'algorisme de la clau
    const b = spki, top = tlv(b, 0), [ai] = fills(b, top), [kOid, kPar] = fills(b, ai);
    const tipus = oid(b, kOid);
    if (tipus === "1.2.840.113549.1.1.1") {
      if (alg === "1.2.840.113549.1.1.10") return null;          // RSA-PSS: no es comprova
      const k = await s.importKey("spki", spki, { name: "RSASSA-PKCS1-v1_5", hash: { name: hash } }, false, ["verify"]);
      return await s.verify("RSASSA-PKCS1-v1_5", k, sig, dades);
    }
    if (tipus === "1.2.840.10045.2.1") {
      const corba = kPar && kPar.tag === 6 ? CORBES[oid(b, kPar)] : null; if (!corba) return null;
      const k = await s.importKey("spki", spki, { name: "ECDSA", namedCurve: corba[0] }, false, ["verify"]);
      // la signatura DER (r, s) → r ‖ s
      const t = tlv(sig, 0), [r, ss] = fills(sig, t), n = corba[1];
      const fix = v => { let x = bytes(sig, v); while (x.length > n && x[0] === 0) x = x.subarray(1); const o = new Uint8Array(n); o.set(x, n - x.length); return o; };
      const raw = new Uint8Array(2 * n); raw.set(fix(r), 0); raw.set(fix(ss), n);
      return await s.verify({ name: "ECDSA", hash: { name: hash } }, k, raw, dades);
    }
  } catch (e) { return false; }
  return null;
}

// Una signatura CMS (PKCS#7 SignedData) sobre «contingut» (els bytes de la ByteRange)
async function llegeixCms(der, contingut) {
  const b = der, ci = tlv(b, 0), [tipus, ex] = fills(b, ci);
  if (oid(b, tipus) !== "1.2.840.113549.1.7.2") throw new Error("no és SignedData");
  const [sd] = fills(b, ex), f = fills(b, sd);
  const certs = f.find(x => x.tag === 0xa0), infos = f[f.length - 1];
  const llista = certs ? fills(b, certs).filter(x => x.tag === 0x30).map(x => certificat(b, x)) : [];
  const [si] = fills(b, infos), g = fills(b, si);
  let i = 1;
  const sid = g[i++];
  const dAlg = DIGEST[oid(b, fills(b, g[i++])[0])] || "SHA-256";
  let atrs = null; if (g[i].tag === 0xa0) atrs = g[i++];
  const sAlgOid = oid(b, fills(b, g[i++])[0]);
  const sig = bytes(b, g[i++]).slice();
  // el certificat de qui signa: per número de sèrie (IssuerAndSerialNumber) o el primer
  let cert = llista[0] || null;
  if (sid.tag === 0x30) { const [, sn] = fills(b, sid); const hex = [...bytes(b, sn)].map(x => x.toString(16).padStart(2, "0")).join(""); cert = llista.find(c => c.serial === hex) || cert; }
  const s = globalThis.crypto.subtle;
  const resum = new Uint8Array(await s.digest(dAlg, contingut));
  let md = null, quan = null;
  if (atrs) for (const a of fills(b, atrs)) {
    const [t, vals] = fills(b, a), o = oid(b, t), [v] = fills(b, vals);
    if (o === "1.2.840.113549.1.9.4") md = bytes(b, v).slice();
    if (o === "1.2.840.113549.1.9.5") quan = hora(b, v);
  }
  const integre = atrs ? !!md && igual([...md], [...resum]) : null;
  let dades = contingut;
  if (atrs) { dades = tot(b, atrs).slice(); dades[0] = 0x31; }   // els atributs signats es resumeixen com a SET
  const hash = SIG_HASH[sAlgOid] || dAlg;
  const bona = cert ? await verifica(cert.spki, sAlgOid, hash, sig, dades) : null;
  return { cert, quan, integre, bona };
}

const decStr = s => {
  if (!s) return "";
  let x = s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (m, c) => ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" })[c] ?? String.fromCharCode(parseInt(c, 8)));
  if (x.charCodeAt(0) === 0xfe && x.charCodeAt(1) === 0xff) { let o = ""; for (let i = 2; i + 1 < x.length; i += 2) o += String.fromCharCode(x.charCodeAt(i) * 256 + x.charCodeAt(i + 1)); return o; }
  try { return decodeURIComponent(escape(x)); } catch { return x; }
};
const dataPdf = s => { const m = /D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?([Z+-])?(\d{2})?'?(\d{2})?/.exec(s || ""); if (!m) return null; const sg = m[7] === "-" ? -1 : 1; const off = m[7] && m[7] !== "Z" ? sg * ((+m[8] || 0) * 60 + (+m[9] || 0)) : 0; return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) - off * 60000).toISOString(); };

// Totes les signatures d'un PDF, en l'ordre en què es van fer
export async function llegeixSignatures(pdf) {
  const b = pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf);
  const s = latin1(b), out = [], vistes = new Set();
  const re = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;
  let m;
  while ((m = re.exec(s))) {
    const [a, la, c, lc] = m.slice(1, 5).map(Number), k = m.slice(1, 5).join(" ");
    if (vistes.has(k) || a !== 0 || c < la || c + lc > b.length) continue;
    vistes.add(k);
    const hex = s.slice(la, c).replace(/[<>\s]/g, "");     // amb els zeros de reserva del final: la longitud és la del DER
    const der = new Uint8Array(hex.length / 2 | 0); for (let i = 0; i < der.length; i++) der[i] = parseInt(hex.substr(i * 2, 2), 16);
    const contingut = new Uint8Array(la + lc); contingut.set(b.subarray(0, la), 0); contingut.set(b.subarray(c, c + lc), la);
    // el diccionari de la signatura: el que hi ha al voltant de /Contents
    const dic = s.slice(Math.max(0, la - 4000), Math.min(s.length, c + 4000));
    const camp = n => { const r = new RegExp("\\/" + n + "\\s*\\(((?:\\\\.|[^\\\\)])*)\\)").exec(dic); return r ? decStr(r[1]) : ""; };
    let info = { cert: null, quan: null, integre: null, bona: null };
    try { info = await llegeixCms(der, contingut); } catch (e) { info.error = String(e?.message || e); }
    const t = info.cert?.titular || {}, e = info.cert?.emissor || {};
    out.push({
      nom: nomDe(t), nif: nifDe(t), org: t.org || "", cn: t.cn || "",
      emissor: emissorDe(e), emissorCn: e.cn || "",
      quan: info.quan || dataPdf(camp("M")) || null,
      motiu: camp("Reason"), lloc: camp("Location"),
      valida: info.integre !== false && info.bona === true,
      integre: info.integre, bona: info.bona,
      certValid: info.cert ? { desde: info.cert.desde, fins: info.cert.fins } : null,
      cobreix: c + lc,                          // fins on arriba (la darrera ha d'arribar al final del document)
      error: info.error || "",
    });
  }
  const fi = b.length;
  out.sort((x, y) => x.cobreix - y.cobreix);
  out.forEach((x, i) => { x.darrera = i === out.length - 1; x.finsAlFinal = fi - x.cobreix <= 2; });
  return out;
}

// La marca que l'app posa als seus PDF per signar («aco878408:<document>:<resum>»), per saber si un PDF tornat és el mateix document
export function marcaDe(pdf) {
  const s = latin1(pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf));
  const m = /aco878408:([A-Za-z0-9_.:-]+)/.exec(s);
  return m ? m[1] : "";
}
