// V87.409 · La pàgina que obre qui ha de signar a distància (l'enllaç «…/#signa=<clau>» que s'envia per correu). No cal compte:
// la clau de l'enllaç dona accés a aquell document i prou (supabase/aco_signa_v878409.sql). Es veu el PDF d'ara amb les signatures
// que ja té i cadascú signa el seu requadre amb la seva AutoFirma; la signatura s'afegeix al final del mateix PDF i es desa al núvol.
// Així tots signen el mateix document i en surt un sol PDF amb totes les signatures, que l'app de qui l'ha enviat es baixa sola.
// No arrenca l'app (ni les dades de l'aparell ni el núvol del compte): main.jsx la carrega a part.
import React, { useEffect, useRef, useState } from "react";
import { Signature, Check, AlertTriangle, Download, FileCheck } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import * as af from "./autofirma.js";
import { llegeixSignatures } from "./signaturesPdf.js";
import { propsSig, ajuntaSig, comencaAmb, rpcSigna } from "./signaComu.js";
import { tl } from "./i18n.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const nomArxiu = t => String(t || "document").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 90) + ".pdf";

function VistaPdf({ bytes, T }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let viu = true; const cont = ref.current; if (!cont || !bytes) return;
    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise; if (!viu) return;
        setN(pdf.numPages); cont.innerHTML = "";
        const w = Math.min(cont.clientWidth || 800, 900), dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= Math.min(pdf.numPages, 40) && viu; i++) {
          const pg = await pdf.getPage(i); const v1 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: (w / v1.width) * dpr });
          const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; c.style.width = "100%"; c.setAttribute("aria-label", T("Pàgina {n}", { n: i }));
          cont.appendChild(c);
          await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        }
      } catch (e) { console.warn(e); }
    })();
    return () => { viu = false; };
  }, [bytes]);
  return <div className="pdf" ref={ref} data-pagines={n} />;
}

export default function SignaRemot({ token }) {
  const [lang, setLang] = useState(() => (/^es/i.test(navigator.language || "") ? "es" : "ca"));
  const T = (s, v) => tl(lang, s, v);
  const [estat, setEstat] = useState("carregant");      // carregant · ok · no · error
  const [doc, setDoc] = useState(null);                 // {info, versio, signades, expira, bytes}
  const [llegides, setLlegides] = useState([]);
  const [fase, setFase] = useState("");
  const [err, setErr] = useState("");
  const [ocupat, setOcupat] = useState(false);
  const [fet, setFet] = useState("");
  const atura = useRef(false);
  const pc = af.potSignar();

  async function carrega(primer) {
    try {
      const j = await rpcSigna("aco_signa_veure", { p_token: token });
      if (!j || !j.pdf) { setEstat("no"); return null; }
      const bytes = af.deB64(j.pdf);
      const d = { info: j.info || {}, versio: j.versio, signades: j.signades || [], expira: j.expira, bytes };
      if (primer && (d.info.idioma === "es" || d.info.idioma === "ca")) setLang(d.info.idioma);
      setLlegides(await llegeixSignatures(bytes)); setDoc(d); setEstat("ok");
      return d;
    } catch (e) { console.warn(e); setEstat("error"); return null; }
  }
  useEffect(() => { document.title = "Signatura"; document.body.classList.add("sr409-body"); carrega(true); }, []);
  useEffect(() => { if (doc?.info?.titol) document.title = doc.info.titol; }, [doc?.info?.titol]);

  const info = doc?.info || {}, rols = info.rols || [];
  const sigs = doc ? ajuntaSig(llegides, info.signatures || [], rols, null, doc.signades) : [];
  const quan = v => (v ? new Date(v).toLocaleString(lang === "es" ? "es-ES" : "ca-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
  const color = /^#[0-9a-f]{6}$/i.test(info.emissor?.color || "") ? info.emissor.color : "#1E3A8A";

  async function signa(r) {
    if (ocupat || !doc) return;
    setErr(""); setFase(""); setFet("");
    const ses = af.obre();                    // dins del toc: el navegador pregunta «Obrir Autofirma?»
    setOcupat(true); atura.current = false;
    try {
      const s = (info.signes || []).find(x => x.rol === r.k);
      const res = await af.signaPdf(doc.bytes, { ses, props: propsSig({ motiu: [info.titol, T(r.label)].filter(Boolean).join(" · "), poblacio: info.obra?.poblacio || "", s }), atura: () => atura.current, onEstat: setFase });
      setFase("desant");
      if (!comencaAmb(res.pdf, doc.bytes)) throw new Error(T("L’AutoFirma ha tornat un document diferent. Torna-ho a provar."));
      const ll = await llegeixSignatures(res.pdf);
      const nova = ll[ll.length - 1];
      if (ll.length <= llegides.length || !nova) throw new Error(T("El PDF que ha tornat l’AutoFirma no porta la signatura nova."));
      if (!nova.valida) throw new Error(T("La signatura no és vàlida."));
      const j = await rpcSigna("aco_signa_signa", { p_token: token, p_versio: doc.versio, p_pdf: af.aB64(res.pdf), p_qui: { rol: r.k, nom: nova.nom, nif: nova.nif, org: nova.org, emissor: nova.emissor } });
      if (j?.ok) {
        setDoc({ ...doc, bytes: res.pdf, versio: j.versio, signades: [...doc.signades, { rol: r.k, nom: nova.nom, nif: nova.nif }] });
        setLlegides(ll); setFase("fet"); setFet(r.k);
      } else if (j?.error === "versio") {
        await carrega(false); setFase("");
        setErr(T("Una altra persona ha signat mentrestant. Torna a signar."));
      } else if (j?.error === "enllac") { setEstat("no"); }
      else throw new Error(T("No s’ha pogut desar la signatura."));
    } catch (e) {
      console.warn(e); setFase("");
      if (e?.codi === "aturat") return;
      setErr(e?.codi === "noObre" ? "noObre" : e?.codi === "cancel" ? T("S’ha cancel·lat a l’AutoFirma.") : e?.codi === "connexio" ? T("No hi ha connexió. Torna-ho a provar.") : (e?.message || T("No s’ha pogut signar.")));
    } finally { setOcupat(false); }
  }
  function descarrega() {
    if (!doc) return;
    const u = URL.createObjectURL(new Blob([doc.bytes], { type: "application/pdf" }));
    const a = document.createElement("a"); a.href = u; a.download = nomArxiu(info.titol + (llegides.length ? ` (${T("signat")})` : "")); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }

  const textFase = { obrint: T("Obrint l’AutoFirma…"), certificat: T("Tria el certificat i signa a l’AutoFirma…"), rebut: T("Desant la signatura…"), desant: T("Desant la signatura…"), fet: T("Signat. La signatura ja és al document.") }[fase] || "";
  const idiomes = <div className="idiomes" role="group" aria-label="Idioma">{["ca", "es"].map(l => <button key={l} type="button" className={lang === l ? "on" : ""} aria-pressed={lang === l} onClick={() => setLang(l)}>{l === "ca" ? "Català" : "Castellano"}</button>)}</div>;

  if (estat !== "ok") return <div className="sr409" style={{ "--sr-acc": color }}>
    <header className="barra"><span className="marca"><FileCheck size={18} aria-hidden="true" /> {T("Signatura amb certificat")}</span>{idiomes}</header>
    <main className="cos"><div className={`targeta ${estat === "carregant" ? "" : "buida"}`} role={estat === "carregant" ? "status" : "alert"}>
      {estat === "carregant" ? T("Obrint el document…") : estat === "no" ? <><b>{T("Aquest enllaç ja no és vàlid.")}</b><span>{T("Pot ser que hagi caducat o que ja s’hagi tancat. Demana’n un de nou a qui te l’ha enviat.")}</span></> : <><b>{T("No s’ha pogut obrir el document.")}</b><span>{T("Revisa la connexió i torna a carregar la pàgina.")}</span></>}
    </div></main>
  </div>;

  const emissor = info.emissor || {};
  return <div className="sr409" style={{ "--sr-acc": color }}>
    <header className="barra">
      <span className="marca">{emissor.logo ? <img src={emissor.logo} alt={emissor.nom || ""} /> : <b>{emissor.nom || T("Signatura amb certificat")}</b>}</span>
      {idiomes}
    </header>
    <main className="cos">
      <section className="targeta cap">
        <small>{T("Document per signar")}</small>
        <h1>{info.titol}</h1>
        {(info.obra?.nom || info.obra?.adreca) && <p className="obra">{[info.obra?.nom, info.obra?.adreca].filter(Boolean).join(" · ")}</p>}
        {emissor.nom && <p className="de">{T("Enviat per {qui}", { qui: emissor.nom })}{emissor.mail ? ` · ${emissor.mail}` : ""}</p>}
      </section>
      <section className="targeta" aria-labelledby="sr409-sig">
        <h2 id="sr409-sig">{T("Signatures")}<span className="xip">{T("{n} de {m}", { n: rols.filter(r => sigs.some(s => s.rol === r.k)).length, m: rols.length })}</span></h2>
        <ul className="rols">{rols.map(r => {
          const s = sigs.find(x => x.rol === r.k);
          return <li key={r.k} className={s ? (s.valida ? "ok" : "mal") : fet === r.k ? "ok" : ""}>
            <span className="r"><b>{T(r.label)}</b>{r.nom && <small>{r.nom}</small>}</span>
            {s ? <span className="qui">{s.valida ? <Check size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}<span><b>{s.nom || s.org}{s.nif ? ` · ${s.nif}` : ""}</b><small>{[quan(s.quan), s.emissor, s.valida ? "" : T("la signatura no és vàlida")].filter(Boolean).join(" · ")}</small></span></span>
              : pc ? <button type="button" className="signa" disabled={ocupat} onClick={() => signa(r)}><Signature size={16} aria-hidden="true" /> {T("Signar aquí amb l’AutoFirma")}</button>
                : <span className="pend">{T("Pendent")}</span>}
          </li>;
        })}</ul>
        {textFase && <p className={`estat ${fase === "fet" ? "ok" : ""}`} role="status">{fase === "fet" && <Check size={16} aria-hidden="true" />}{textFase}{ocupat && ["obrint", "certificat"].includes(fase) && <button type="button" className="link" onClick={() => { atura.current = true; }}>{T("Aturar")}</button>}</p>}
        {err === "noObre" ? <p className="err" role="alert">{T("No s’ha pogut obrir l’AutoFirma.")} <a href={af.DESCARREGA} target="_blank" rel="noopener noreferrer">{T("Descarregar l’AutoFirma")}</a></p> : err ? <p className="err" role="alert">{err}</p> : null}
        {pc ? <p className="nota">{T("Cal tenir l’AutoFirma instal·lada.")} <a href={af.DESCARREGA} target="_blank" rel="noopener noreferrer">{T("Descarregar l’AutoFirma")}</a></p>
          : <p className="nota">{T("Per signar amb certificat, obre aquest enllaç en un ordinador amb l’AutoFirma.")}</p>}
      </section>
      <section className="targeta doc" aria-label={T("El document")}>
        <div className="doc-cap"><b>{T("El document")}</b><button type="button" className="sec" onClick={descarrega}><Download size={16} aria-hidden="true" /> {T("Descarregar el PDF")}</button></div>
        <VistaPdf bytes={doc.bytes} T={T} />
      </section>
      {doc.expira && <p className="peu">{T("Enllaç vàlid fins al {d}.", { d: new Date(doc.expira).toLocaleDateString(lang === "es" ? "es-ES" : "ca-ES") })}</p>}
    </main>
  </div>;
}
