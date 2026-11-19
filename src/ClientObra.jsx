// V87.629 · La pàgina que obre el client amb l'enllaç de la seva obra («…/#obra=<clau>»; fase 3 de compartir). No cal compte: amb la
// clau de l'enllaç i el codi de 4 xifres es veu la còpia que l'empresa hi ha publicat (supabase/aco_client_v878629.sql) i prou: només
// mirar i imprimir-la o desar-la en PDF. El codi es recorda en aquest aparell. No arrenca l'app (main.jsx la carrega a part).
import React, { useEffect, useRef, useState } from "react";
import { Lock, Printer, AlertTriangle, BadgeCheck, ChevronRight, FileText } from "lucide-react";
import { CLOUD_URL, CLOUD_KEY } from "./cloudConfig.js";
import { tl, carregaIdioma, idiomaCarregat } from "./i18n.js";

const CLAU_CODI = token => `aco_client_codi_${String(token).slice(0, 16)}`;
async function veure(token, codi) {
  let r;
  try { r = await fetch(`${CLOUD_URL}/rest/v1/rpc/aco_client_veure`, { method: "POST", headers: { apikey: CLOUD_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ p_token: token, p_codi: codi }), cache: "no-store" }); }
  catch { return { ok: false, error: "connexio" }; }
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok) return { ok: false, error: "servidor" };
  return j || { ok: false, error: "servidor" };
}

export default function ClientObra({ token }) {
  const [lang, setLang] = useState(() => (/^es/i.test(navigator.language || "") ? "es" : "ca"));
  // V87.649 · el diccionari del castellà es baixa a part, només si cal
  const [, setDicc] = useState(0);
  useEffect(() => { if (!idiomaCarregat(lang)) carregaIdioma(lang).then(() => setDicc(x => x + 1)); }, [lang]);
  const T = (s, v) => tl(lang, s, v);
  const loc = lang === "es" ? "es-ES" : "ca-ES";
  const eur = n => Number(n || 0).toLocaleString(loc, { style: "currency", currency: "EUR" });
  const num = n => Number(n || 0).toLocaleString(loc, { maximumFractionDigits: 3 });
  const dia = v => { if (!v) return ""; const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleDateString(loc); };
  const [codi, setCodi] = useState("");
  const [estat, setEstat] = useState("codi");      // codi · carregant · ok
  const [err, setErr] = useState("");
  const [dades, setDades] = useState(null);
  async function entra(c) {
    setEstat("carregant"); setErr("");
    const r = await veure(token, c);
    if (r?.ok) { try { localStorage.setItem(CLAU_CODI(token), c); } catch {} if (!triat.current && ["ca", "es"].includes(r.contingut?.idioma)) setLang(r.contingut.idioma); setDades(r); setEstat("ok"); return; }
    try { if (r?.error !== "connexio") localStorage.removeItem(CLAU_CODI(token)); } catch {}
    setEstat("codi");
    setErr(r?.error === "codi" ? T("El codi no és correcte. Queden {n} intents.", { n: r.queden ?? 0 })
      : r?.error === "bloquejat" ? T("Aquest enllaç s’ha bloquejat després de massa codis equivocats. Demana’n un de nou a qui te l’ha enviat.")
      : r?.error === "enllac" ? T("Aquest enllaç ja no funciona. Demana’n un de nou a qui te l’ha enviat.")
      : r?.error === "connexio" ? T("No hi ha connexió. Torna-ho a provar quan en tinguis.")
      : T("Ara no es pot obrir. Torna-ho a provar d’aquí a una estona."));
  }
  // (una sola vegada: en desenvolupament, React munta dues vegades i es comptaria dues vegades que s'ha obert)
  const fet = useRef(false), triat = useRef(false);
  useEffect(() => { document.title = T("La teva obra"); if (fet.current) return; fet.current = true; let c = ""; try { c = localStorage.getItem(CLAU_CODI(token)) || ""; } catch {} if (/^\d{4}$/.test(c)) entra(c); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const idioma = <div className="idioma-v878629" role="group" aria-label={T("Idioma")}>{["ca", "es"].map(l => <button type="button" key={l} aria-pressed={lang === l} className={lang === l ? "on" : ""} onClick={() => { triat.current = true; setLang(l); }}>{l === "ca" ? "Català" : "Castellano"}</button>)}</div>;
  if (estat !== "ok") return <main className="client-obra-v878629 entrada">
    {idioma}
    <div className="caixa">
      <Lock size={28} aria-hidden="true" />
      <h1>{T("La teva obra")}</h1>
      <p>{T("Escriu el codi de 4 xifres que t’han donat.")}</p>
      <form onSubmit={e => { e.preventDefault(); if (/^\d{4}$/.test(codi)) entra(codi); }}>
        <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} aria-label={T("Codi de 4 xifres")} value={codi} onChange={e => setCodi(e.target.value.replace(/\D/g, "").slice(0, 4))} autoFocus />
        <button type="submit" className="primary" disabled={codi.length !== 4 || estat === "carregant"}>{estat === "carregant" ? T("Obrint…") : T("Entrar")}</button>
      </form>
      {err && <p className="err" role="alert"><AlertTriangle size={16} aria-hidden="true" /> {err}</p>}
    </div>
  </main>;
  const c = dades?.contingut || {}, ob = c.obra || {}, imp = c.imports || "finals";
  return <main className="client-obra-v878629">
    <header className="cap">
      <div className="emp">{c.empresa?.nom || ""}</div>
      {idioma}
      <h1>{ob.nom || T("La teva obra")}</h1>
      {(ob.adreca || ob.codi) && <p className="adr">{[ob.adreca, ob.codi].filter(Boolean).join(" · ")}</p>}
      <p className="pub">{T("Actualitzat el {d}", { d: dia(dades.publicat) })}</p>
      <button type="button" className="secondary imprimir" onClick={() => { document.querySelectorAll(".client-obra-v878629 .cap-p").forEach(d => { d.open = true; }); setTimeout(() => window.print(), 60); }}><Printer size={16} aria-hidden="true" /> {T("Imprimir o desar en PDF")}</button>
    </header>
    {c.exec && <section className="bloc">
      <h2>{T("Com va l’obra")}</h2>
      <div className="barra" role="img" aria-label={T("{p} % fet", { p: num(c.exec.pct) })}><i style={{ width: `${Math.max(0, Math.min(100, +c.exec.pct || 0))}%` }} /></div>
      <p className="xifres"><b>{T("{p} % fet", { p: num(Math.round((+c.exec.pct || 0) * 10) / 10) })}</b>{imp !== "cap" && c.exec.pressupost != null ? <span>{T("{c} certificat de {t}", { c: eur(c.exec.certificat), t: eur(c.exec.pressupost) })}</span> : null}</p>
    </section>}
    {Array.isArray(c.certs) && <section className="bloc">
      <h2>{c.certTipus === "totes" ? T("Certificacions") : T("Certificacions validades")}</h2>
      {c.certs.length === 0 ? <p className="buit">{T("Encara no n’hi ha cap.")}</p> : <ul className="certs">{c.certs.map(x => <li key={x.n}>
        <div><b>{T("Certificació {n}", { n: x.n })}</b><small>{dia(x.data)}</small></div>
        {imp !== "cap" && x.imp != null ? <span className="imp">{eur(x.imp)}</span> : null}
        {x.per ? <small className="val"><BadgeCheck size={14} aria-hidden="true" /> {T("Validada per {per} el {d}", { per: x.per, d: dia(x.at) })}</small> : null}
      </li>)}</ul>}
    </section>}
    {Array.isArray(c.planning) && c.planning.length > 0 && (() => {
      const ms = v => new Date(v + "T00:00:00").getTime(), ini = Math.min(...c.planning.map(x => ms(x.de))), fi = Math.max(...c.planning.map(x => ms(x.a))) + 864e5, tot = Math.max(864e5, fi - ini);
      const avui = Date.now(), pc = v => Math.max(0, Math.min(100, (v - ini) / tot * 100));
      return <section className="bloc">
        <h2>{T("Planning")}</h2>
        <p className="xifres"><span>{T("Del {a} al {b}", { a: dia(c.planning.reduce((m, x) => x.de < m ? x.de : m, c.planning[0].de)), b: dia(c.planning.reduce((m, x) => x.a > m ? x.a : m, c.planning[0].a)) })}</span></p>
        <ul className="planning-v878632">{c.planning.map((x, i) => <li key={i}>
          <div className="nom"><b>{x.cap}</b><small>{dia(x.de)} – {dia(x.a)}</small></div>
          <div className="pista">{avui > ini && avui < fi ? <i className="avui" style={{ left: pc(avui) + "%" }} aria-hidden="true" /> : null}<span className={"barra" + (ms(x.a) + 864e5 <= avui ? " feta" : ms(x.de) <= avui ? " ara" : "")} style={{ left: pc(ms(x.de)) + "%", width: Math.max(1.5, pc(ms(x.a) + 864e5) - pc(ms(x.de))) + "%" }} /></div>
        </li>)}</ul>
      </section>;
    })()}
    {Array.isArray(c.arxius) && c.arxius.some(x => x.t === "foto") && <section className="bloc">
      <h2>{T("Fotos")}</h2>
      <div className="fotos-v878631">{c.arxius.filter(x => x.t === "foto").map((x, i) => <a key={i} href={x.url} target="_blank" rel="noopener noreferrer" title={x.nom}><img src={x.url} alt={x.nom} loading="lazy" /></a>)}</div>
    </section>}
    {Array.isArray(c.arxius) && c.arxius.some(x => x.t === "doc") && <section className="bloc">
      <h2>{T("Documents")}</h2>
      <ul className="docs-v878631">{c.arxius.filter(x => x.t === "doc").map((x, i) => <li key={i}><a href={x.url} target="_blank" rel="noopener noreferrer"><FileText size={16} aria-hidden="true" /> {x.nom}</a></li>)}</ul>
    </section>}
    {c.pres && <section className="bloc">
      <h2>{T("Pressupost")}</h2>
      {imp !== "cap" && c.pres.total != null ? <p className="total">{T("Total")}: <b>{eur(c.pres.total)}</b></p> : null}
      {(c.pres.caps || []).map((k, i) => <details key={i} className="cap-p">
        <summary><span>{k.cap || T("Sense capítol")}</span>{imp !== "cap" && k.total != null ? <b>{eur(k.total)}</b> : null}<ChevronRight size={16} className="chev" aria-hidden="true" /></summary>
        {Array.isArray(k.partides) && k.partides.length > 0 && <table><thead><tr><th>{T("Codi")}</th><th>{T("Descripció")}</th><th className="n">{T("Quantitat")}</th>{imp === "finals" && <><th className="n">{T("Preu")}</th><th className="n">{T("Import")}</th></>}</tr></thead>
          <tbody>{k.partides.map((p, j) => <tr key={j}><td>{p.codi}</td><td>{p.concepte}</td><td className="n">{num(p.q)} {p.ut || ""}</td>{imp === "finals" && <><td className="n">{eur(p.pu)}</td><td className="n">{eur(p.imp)}</td></>}</tr>)}</tbody></table>}
      </details>)}
    </section>}
    <footer className="peu">{T("Només de consulta. Si hi veus res que no és correcte, digues-ho a {nom}.", { nom: c.empresa?.nom || T("qui te l’ha enviat") })}</footer>
  </main>;
}
