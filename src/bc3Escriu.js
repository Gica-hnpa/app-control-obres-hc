// V87.648 · Descarregar el pressupost o els amidaments en BC3 (FIEBDC-3/2016) per obrir-los amb el Presto, l'Arquímedes, el TCQ… (l'Héctor,
// 19/11/2026: «he de poder descarregar un pressupost o amidament en bc3 o Excel tb si vull fer-ho o algú altre fora de la app… a opcions»).
// Funció pura (es prova sense navegador: tools/proves/bc3escriuunit.mjs, que el torna a llegir amb llegirBc3 d'amidaments.js).
//   escriuBc3({ titol, codi, data, ambPreus, caps:[{ nom, pare, partides:[{ codi, ut, concepte, desc, q, pu, mides:[…], descomp:{rows} }] }] })
//   → Uint8Array en Windows-1252 («ANSI», com el Presto), amb salts de línia \r\n.
// - Capítols: el número del nom («01 Enderrocs» → 01#); `pare` (el capítol principal) en fa un nivell per sobre.
// - Partides: el seu codi (si n'hi ha de repetits o buits, «<capítol>.<n>»), la quantitat al ~D i les mides al ~M, la descripció al ~T.
// - Amb preus: el preu de cada partida i, si té descompost, els recursos (mà d'obra 1, maquinària 2, materials 3, la resta 0). Els % i el que
//   no quadri (arrodoniments) hi van com una línia més amb el seu import, perquè el programa que l'obri torni a donar el mateix preu.
// - Sense preus (amidaments): cap preu ni descompost.

const net = s => String(s ?? "").replace(/[|~\\]/g, m => (m === "|" ? "/" : m === "~" ? "-" : "/")).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const una = s => net(s).replace(/\s+/g, " ").trim();
const num = v => { if (typeof v === "number") return Number.isFinite(v) ? v : 0; const t = String(v ?? "").trim().replace(/\s/g, "").replace(/€/g, ""); if (!t) return 0; const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t); return Number.isFinite(n) ? n : 0; };
const fmt = (n, d = 2) => { const x = Math.round((Number(n) || 0) * 10 ** d) / 10 ** d; return String(x); };
const utBc3 = u => una(u).replace(/²/g, "2").replace(/³/g, "3").slice(0, 10);
const codiNet = c => una(c).replace(/[#\s]+/g, "").slice(0, 20);

// Windows-1252: el que no hi cap, «?»
const W1252 = { "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e,
  "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f };
export function ansi(text) {
  const s = String(text || "").normalize("NFC"), out = new Uint8Array(s.length);
  let n = 0;
  for (const ch of s) { const c = ch.codePointAt(0); out[n++] = c < 0x80 || (c >= 0xa0 && c <= 0xff) ? c : (W1252[ch] ?? 0x3f); }
  return out.slice(0, n);
}

const SECCIO = s => { const x = String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase(); return /MA D.OBRA|MANO DE OBRA/.test(x) ? 1 : /MAQUINARIA|MAQUINA/.test(x) ? 2 : /MATERIAL/.test(x) ? 3 : 0; };
const esFinal = r => /\b(preu|precio)\s+(unitari|unitario)?\s*(final|total)\b|^(preu|precio)\s+(unitari|unitario)$|\btotal\s+(descompost|descomposat|final)\b/i.test(String(r.concepte || "").trim());
const esSubtotal = r => /^\s*(sub)?total\b|^suma\b/i.test(String(r.concepte || "").trim());

export function escriuBc3({ titol = "", codi = "", data = new Date(), ambPreus = true, caps = [] } = {}) {
  const d = data instanceof Date ? data : new Date(data);
  const dia = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(2)}`;
  const arrel = (codiNet(codi) || "PRESSUPOST").slice(0, 18) + "##";
  const regs = [], usats = new Set([arrel.replace(/#+$/, "")]), recursos = new Map();
  const unic = (base, alt) => { let c = codiNet(base) || alt; if (usats.has(c)) { let i = 2; while (usats.has(`${c}.${i}`)) i++; c = `${c}.${i}`; } usats.add(c); return c; };
  const preu = v => (ambPreus ? fmt(v, 2) : "");

  // capítols (i el principal, si n'hi ha) en l'ordre en què arriben
  const nivell1 = []; const perPare = new Map();
  for (const cap of caps) {
    if (!(cap?.partides || []).length) continue;
    const pare = una(cap.pare);
    if (pare && pare !== una(cap.nom)) { if (!perPare.has(pare)) { perPare.set(pare, []); nivell1.push({ nom: pare, fills: perPare.get(pare) }); } perPare.get(pare).push(cap); }
    else nivell1.push({ nom: una(cap.nom), cap });
  }
  const codiCap = (nom, i) => { const m = /^\s*(\d+(?:[.,]\d+)*)\s*[-.·)]?\s+/.exec(nom || ""); return unic(m ? m[1].replace(",", ".") : "", `C${String(i + 1).padStart(2, "0")}`); };
  const nomCap = nom => una(String(nom || "").replace(/^\s*\d+(?:[.,]\d+)*\s*[-.·)]?\s+/, "")) || una(nom);
  const escriuCap = (cap, ccodi, pos) => {
    const fills = []; let total = 0;
    (cap.partides || []).forEach((p, j) => {
      const pc = unic(p.codi, `${ccodi}.${String(j + 1).padStart(2, "0")}`);
      const q = num(p.q), pu = ambPreus ? num(p.pu) : 0;
      total += Math.round(q * pu * 100) / 100;
      fills.push(`${pc}\\1\\${fmt(q, 3)}`);
      regs.push(`~C|${pc}|${utBc3(p.ut)}|${una(p.concepte).slice(0, 250) || pc}|${preu(pu)}|${dia}|0|`);
      const desc = net(p.desc || "").replace(/\r?\n/g, "\r\n").trim();
      if (desc) regs.push(`~T|${pc}|${desc}|`);
      // mides
      const mides = (p.mides || []).filter(m => m && (una(m.concepte) || [m.unitats, m.llargada, m.amplada, m.alcada].some(v => String(v ?? "").trim() !== "")));
      if (mides.length) {
        const linies = mides.map(m => ["", una(m.concepte), ...[m.unitats, m.llargada, m.amplada, m.alcada].map(v => (String(v ?? "").trim() === "" ? "" : fmt(num(v), 3)))].join("\\")).join("\\");
        regs.push(`~M|${ccodi}#\\${pc}|${pos}\\${j + 1}\\|${fmt(q, 3)}|${linies}\\|`);
      }
      // descompost
      const rows = ambPreus && pu > 0 && Array.isArray(p.descomp?.rows) ? p.descomp.rows : [];
      if (rows.length) {
        let sec = 0, suma = 0; const ds = [];
        rows.forEach((r, k) => {
          if (r?.isSection) { sec = SECCIO(r.concepte); return; }
          if (esFinal(r) || esSubtotal(r)) return;
          const rq = num(r.q), rpu = num(r.pu), tot = num(r.total) || Math.round(rq * rpu * 100) / 100;
          const pct = String(r.ut || "").includes("%") || r.calculatedKind878232 === "percentage";
          if (!tot && !(rq && rpu)) return;
          let rc, rend, rp, tipus = sec;
          if (pct) { rc = unic("", `${pc}.P${k + 1}`); rend = 1; rp = tot; tipus = 0; regs.push(`~C|${rc}|ut|${una(r.concepte).slice(0, 120) || "%"}|${fmt(rp)}|${dia}|0|`); }
          else {
            const clau = `${codiNet(r.codi)}|${utBc3(r.ut)}|${una(r.concepte)}|${fmt(rpu)}`;
            rc = recursos.get(clau);
            if (!rc) { rc = unic(r.codi, `${pc}.R${k + 1}`); recursos.set(clau, rc); regs.push(`~C|${rc}|${utBc3(r.ut)}|${una(r.concepte).slice(0, 120) || rc}|${fmt(rpu)}|${dia}|${tipus}|`); }
            rend = rq; rp = rpu;
          }
          suma += Math.round(rend * rp * 100000) / 100000;
          ds.push(`${rc}\\1\\${fmt(rend, 4)}`);
        });
        const resta = Math.round((pu - suma) * 100) / 100;
        if (ds.length && Math.abs(resta) >= 0.01) { const rc = unic("", `${pc}.ARR`); regs.push(`~C|${rc}|ut|Arrodoniment|${fmt(resta)}|${dia}|0|`); ds.push(`${rc}\\1\\1`); }
        if (ds.length) regs.push(`~D|${pc}|${ds.join("\\")}\\|`);
      }
    });
    return { fills, total: Math.round(total * 100) / 100 };
  };
  const arrelFills = []; let gran = 0;
  nivell1.forEach((n, i) => {
    const cc = codiCap(n.nom, i);
    if (n.cap) {
      const r = escriuCap(n.cap, cc, i + 1);
      regs.push(`~C|${cc}#||${nomCap(n.nom).slice(0, 250) || cc}|${preu(r.total)}|${dia}|0|`);
      regs.push(`~D|${cc}#|${r.fills.join("\\")}\\|`);
      arrelFills.push(`${cc}#\\1\\1`); gran += r.total;
    } else {
      const subs = []; let tot = 0;
      n.fills.forEach((cap, j) => {
        const sc = codiCap(cap.nom, j);
        const r = escriuCap(cap, sc, `${i + 1}\\${j + 1}`);
        regs.push(`~C|${sc}#||${nomCap(cap.nom).slice(0, 250) || sc}|${preu(r.total)}|${dia}|0|`);
        regs.push(`~D|${sc}#|${r.fills.join("\\")}\\|`);
        subs.push(`${sc}#\\1\\1`); tot += r.total;
      });
      regs.push(`~C|${cc}#||${nomCap(n.nom).slice(0, 250) || cc}|${preu(tot)}|${dia}|0|`);
      regs.push(`~D|${cc}#|${subs.join("\\")}\\|`);
      arrelFills.push(`${cc}#\\1\\1`); gran += tot;
    }
  });
  const cap0 = [
    `~V|APP Control d'Obres|FIEBDC-3/2016\\${dia.slice(0, 4)}20${dia.slice(4)}|APP Control d'Obres||ANSI|${una(titol).slice(0, 120)}|2|`,
    `~K|\\2\\2\\3\\2\\2\\2\\2\\EUR\\|`,
    `~C|${arrel}||${una(titol).slice(0, 250) || "Pressupost"}|${preu(gran)}|${dia}|0|`,
    `~D|${arrel}|${arrelFills.join("\\")}\\|`,
  ];
  return ansi([...cap0, ...regs].join("\r\n") + "\r\n");
}
