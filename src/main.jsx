import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./theme-v87249.css";
import "./theme-v87253.css";
import "./theme-v87254.css";
import "./theme-v87255.css";
import "./theme-v87256.css";
import "./theme-v87257.css";
import { startLocalDiskSync } from "./localDiskSync.js";
import { startCloudSync } from "./cloudSync.js";

// V87.252 · primer es carreguen les dades desades a l'ordinador (si l'app s'ha obert
// amb OBRIR_APP.bat) i després l'app, perquè llegeixi les dades bones des del principi.
// V87.257 · després, el núvol: baixa el que s'hagi fet des d'altres aparells.
startLocalDiskSync().catch(() => {}).then(() => startCloudSync()).catch(e => console.warn("Núvol:", e)).finally(async () => {
  const { default: App } = await import("./App.jsx");
  createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
});
