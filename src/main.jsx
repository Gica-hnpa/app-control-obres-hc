import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./theme-v87249.css";
import "./theme-v87253.css";
import "./theme-v87254.css";
import "./theme-v87255.css";
import "./theme-v87256.css";
import "./theme-v87257.css";
import "./theme-v878268.css";
import "./theme-v878269.css";
import "./theme-v878270.css";
import "./theme-v878272.css";
import "./theme-v878273.css";
import "./theme-v878275.css";
import "./theme-v878276.css";
import "./theme-v878277.css";
import "./theme-v878278.css";
import "./theme-v878279.css";
import "./theme-v878280.css";
import "./theme-v878285.css";
import "./theme-v878289.css";
import "./theme-v878290.css";
import "./theme-v878292.css";
import "./theme-v878299.css";
import "./theme-v878301.css";
import "./theme-v878302.css";
import "./theme-v878303.css";
import "./theme-v878304.css";
import "./theme-v878305.css";
import "./theme-v878306.css";
import { startLocalDiskSync } from "./localDiskSync.js";
import { startCloudSync } from "./cloudSync.js";
import { startBigStore } from "./bigStore.js";
import { setLang, readLang } from "./i18n.js";

// V87.252 · primer es carreguen les dades desades a l'ordinador (si l'app s'ha obert
// amb OBRIR_APP.bat) i després l'app, perquè llegeixi les dades bones des del principi.
// V87.257 · després, el núvol: baixa el que s'hagi fet des d'altres aparells.
// V87.258 · abans de tot, l'espai gran (IndexedDB) en lloc dels 5 MB del navegador.
// V87.268 · i l'idioma de l'usuari (o de l'aparell), perquè les finestres del núvol ja surtin en el seu idioma.
startBigStore().catch(() => false).then(() => { try { setLang(readLang(sessionStorage.getItem("aco_current_user8779") || "")); } catch {} }).then(() => startLocalDiskSync()).catch(() => {}).then(() => startCloudSync()).catch(e => console.warn("Núvol:", e)).finally(async () => {
  const { default: App } = await import("./App.jsx");
  createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
  // V87.271 · App sense cobertura: a la versió publicada, l'app es guarda dins de l'aparell (sw.js) i s'obre encara
  // que no hi hagi cobertura. No a OBRIR_APP.bat (allà sempre hi ha el servidor de l'ordinador).
  if (import.meta.env.PROD && "serviceWorker" in navigator && !window.__acoLocalDisk) {
    navigator.serviceWorker.register("./sw.js").catch(e => console.warn("Sense cobertura: no s'ha pogut preparar", e));
  }
});
