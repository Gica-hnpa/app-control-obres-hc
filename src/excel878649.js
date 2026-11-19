// V87.649 · Velocitat: la llibreria de l'Excel (SheetJS, uns 480 KB) ja no va dins del codi principal de l'app. Es baixa de fons
// uns segons després d'obrir l'app (main.jsx) i, si algú llegeix o descarrega un Excel abans, s'espera allà mateix
// (`await carregaXlsx()`). «XLSX» és el mateix objecte de sempre: s'omple quan arriba la llibreria.
export const XLSX = {};
let promesa = null;
export function carregaXlsx() {
  if (XLSX.utils) return Promise.resolve(XLSX);
  return promesa || (promesa = import("xlsx").then(m => { Object.assign(XLSX, m); return XLSX; }).catch(e => { promesa = null; throw e; }));
}
export const xlsxLlest = () => !!XLSX.utils;
