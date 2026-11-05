import React from "react";
import { t } from "./i18n.js";

// V87.519 · La prova d'un compte «prova-» s'ha acabat (supabase/aco_proves_v878519.sql): en lloc de l'app, aquesta pantalla.
// Les dades no s'esborren: si l'Héctor allarga la prova o el passa a client, en tornar a entrar tot hi és.
const data = d => { try { const [a, m, dd] = String(d || "").slice(0, 10).split("-"); return a && m && dd ? `${dd}/${m}/${a}` : ""; } catch { return ""; } };

export default function ProvaAcabada({ p }) {
  const fins = data(p?.fins);
  const contacte = String(p?.contacte || "").trim();
  const sortir = () => { try { window.__acoCloud?.logout?.(); } catch { location.reload(); } };
  return <main className="prova-acabada-v878519" role="main">
    <div className="caixa">
      <span className="marca" aria-hidden="true">CO</span>
      <h1>{t("La prova s’ha acabat")}</h1>
      <p>{fins ? t("La prova gratuïta de l’App Control d’Obres va acabar el {data}.", { data: fins }) : t("La prova gratuïta de l’App Control d’Obres s’ha acabat.")}</p>
      <p>{t("Les teves dades es guarden: si vols continuar, tot el que hi has posat continua al teu compte.")}</p>
      {contacte ? <div className="contacte"><small>{t("Per continuar")}</small><b>{contacte}</b></div> : null}
      <button type="button" className="primary" onClick={sortir}>{t("Sortir")}</button>
    </div>
  </main>;
}
