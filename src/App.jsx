
import React,{useEffect,useMemo,useRef,useState} from "react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
import {Menu,X,Search,FolderOpen,Users,Bell,Settings,Building2,ClipboardList,CalendarDays,Plus,Upload,Mail,Save,ArrowLeft,Camera,Paperclip,PenLine,ReceiptText} from "lucide-react";

const APP_USERS8779={hector:"0000",pol:"1919"};
const STORAGE_NS8782="aco_v8782";
function currentAppUser8779(){return sessionStorage.getItem("aco_current_user8779")||""}
function lsKey8779(key,user=currentAppUser8779()){
  const u=String(user||"").trim().toLowerCase();
  return u?`${STORAGE_NS8782}__${u}__${key}`:`${STORAGE_NS8782}__nouser__${key}`;
}
function legacyUserKey8782(key,user){return user?`${key}__${user}`:key}
function isAppStorageKey8782(k){return /^aco_/.test(k)&&!k.startsWith(STORAGE_NS8782+"__")&&k!=="aco_current_user8779"}
function migrateStorageForUser8782(user){
  const u=String(user||"").trim().toLowerCase();
  if(!u)return;
  if(u==="pol"){
    // Usuari de prova: mai ha d'arrossegar dades antigues d'Héctor ni dades contaminades de versions anteriors.
    Object.keys(localStorage).forEach(k=>{if(k.startsWith(`${STORAGE_NS8782}__pol__`)||k.endsWith("__pol"))localStorage.removeItem(k)});
    return;
  }
  if(localStorage.getItem(`${STORAGE_NS8782}__migrated__${u}`)==="1")return;
  Object.keys(localStorage).forEach(k=>{
    if(!isAppStorageKey8782(k))return;
    let base=null;
    if(k.endsWith(`__${u}`))base=k.slice(0,-(`__${u}`).length);
    else if(!k.includes("__"))base=k;
    if(!base)return;
    const nk=lsKey8779(base,u);
    if(localStorage.getItem(nk)==null){try{localStorage.setItem(nk,localStorage.getItem(k))}catch(e){console.warn("Migració local parcial",k,e)}}
  });
  localStorage.setItem(`${STORAGE_NS8782}__migrated__${u}`,"1");
}
function lsGet8779(key,fallback="",user=currentAppUser8779()){const v=localStorage.getItem(lsKey8779(key,user));return v==null?fallback:v}
function lsSet8779(key,value,user=currentAppUser8779()){try{localStorage.setItem(lsKey8779(key,user),value)}catch(e){console.warn("No s\'ha pogut guardar localment",key,e)}}
function lsJson8779(key,fallback,user=currentAppUser8779()){try{const raw=lsGet8779(key,null,user);return raw==null?fallback:JSON.parse(raw)}catch{return fallback}}

function safeJsonParse8784(raw,fallback){
  if(raw==null||raw==="")return fallback;
  try{return JSON.parse(raw)}catch{return fallback}
}
function backupCorruptLocalStorage8784(key,raw,user){
  try{
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    localStorage.setItem(`${STORAGE_NS8782}__${user||"nouser"}__corrupt_backup__${key}__${stamp}`,raw||"");
  }catch{}
}
function loadUserJson8784(key,fallback,user=currentAppUser8779()){
  const primaryKey=lsKey8779(key,user);
  const raw=localStorage.getItem(primaryKey);
  if(raw!=null){
    try{return JSON.parse(raw)}catch(e){backupCorruptLocalStorage8784(key,raw,user);localStorage.removeItem(primaryKey)}
  }
  // Recuperació extra per a l'usuari principal: intenta claus antigues si la clau nova estava malmesa.
  const u=String(user||"").trim().toLowerCase();
  if(u==="hector"){
    const candidates=[legacyUserKey8782(key,u),key];
    for(const ck of candidates){
      const r=localStorage.getItem(ck);
      if(r!=null){
        try{return JSON.parse(r)}catch(e){backupCorruptLocalStorage8784(ck,r,user)}
      }
    }
  }
  return fallback;
}


// V87.85 · normalització defensiva: cap dada local malmesa ha de bloquejar el login.
function arrSafe8785(value,fallback=[]){
  if(Array.isArray(value))return value;
  if(value&&Array.isArray(value.items))return value.items;
  if(value&&Array.isArray(value.data))return value.data;
  return Array.isArray(fallback)?fallback:[];
}
function objSafe8785(value,fallback={}){
  if(value&&typeof value==="object"&&!Array.isArray(value))return value;
  return fallback&&typeof fallback==="object"&&!Array.isArray(fallback)?fallback:{};
}
function sanitizeClients8785(value,fallback=[]){
  return arrSafe8785(value,fallback).filter(Boolean).map((c,i)=>({
    id:String(c.id||c.slug||`client-${i+1}`),
    nom:String(c.nom||c.rao||c.name||"Client pendent"),
    rao:String(c.rao||c.nom||c.name||"Client pendent"),
    tipus:String(c.tipus||c.rol||"Client"),
    contacte:String(c.contacte||""),
    telefon:String(c.telefon||""),
    email:String(c.email||""),
    adreca:String(c.adreca||""),
    codiPostal:String(c.codiPostal||c.cp||""),
    poblacio:String(c.poblacio||""),
    nif:String(c.nif||""),
    logo:c.logo||"",
    ...c
  }));
}
function sanitizeObres8785(value,fallback=[]){
  return arrSafe8785(value,fallback).filter(Boolean).map((o,i)=>{
    const id=String(o.id||`exp-${i+1}`);
    const tipus=canonicalWorkType8740(o.tipusTreball||o.tipologia||"Altres");
    return {
      id,
      client:String(o.client||""),
      any:String(o.any||new Date().getFullYear()),
      nom:String(o.nom||o.name||"Expedient sense nom"),
      subtitol:String(o.subtitol||""),
      tipologia:tipus,
      tipusTreball:tipus,
      estat:String(o.estat||"Pendent"),
      pressupost:Number(o.pressupost)||0,
      certificacio:Number(o.certificacio)||0,
      propietat:String(o.propietat||o.clientNom||"Client pendent"),
      nifPropietat:String(o.nifPropietat||""),
      adreca:String(o.adreca||""),
      codiPostal:String(o.codiPostal||o.cp||""),
      poblacio:String(o.poblacio||""),
      rc:String(o.rc||""),
      imatge:o.imatge||"",
      ...o,
      id,
      tipusTreball:tipus,
      tipologia:tipus
    };
  });
}
function sanitizeOdata8785(value,fallback={}){
  const src=objSafe8785(value,fallback);
  const out={};
  Object.entries(src).forEach(([k,v])=>{
    if(v&&typeof v==="object"&&!Array.isArray(v)){
      const base={...empty(),...v};
      // V87.91: normalització de pressupostos múltiples en carregar l'usuari.
      // Evita perdre annexos / fora pressupost si venen de versions anteriors o d'un marcador sense partides.
      out[k]=typeof normalizeBudgetedData8791==="function"?normalizeBudgetedData8791(base):base;
    }
  });
  return out;
}


// V87.104: persistència crítica separada. Evita perdre pressupostos annexos/fora pressupost
// quan el localStorage queda ple per fotos, croquis o documents en base64.
function stripHeavy878104(value){
  if(Array.isArray(value)) return value.map(stripHeavy878104);
  if(value && typeof value === "object"){
    const out={};
    Object.entries(value).forEach(([k,v])=>{
      const lk=String(k).toLowerCase();
      if(["src","url","dataurl","base64","blob","raw","content","filedata","preview"].includes(lk)) return;
      out[k]=stripHeavy878104(v);
    });
    return out;
  }
  if(typeof value === "string" && /^data:/i.test(value)) return "";
  return value;
}
function keyBudget878104(x){return `${x?.budgetId||"principal"}__${x?.id||x?.codi||x?.numero||x?.nom||x?.versio||""}__${x?.cap||""}`}
function mergeArr878104(a=[],b=[],keyFn=keyBudget878104){
  const map=new Map();
  [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(x=>{if(!x)return;const k=keyFn(x);map.set(k,{...(map.get(k)||{}),...x});});
  return [...map.values()];
}
function mergeOdataCore878104(full={},core={}){
  const out={...(full||{})};
  Object.entries(core||{}).forEach(([oid,cv])=>{
    if(!cv || typeof cv!=="object" || Array.isArray(cv)) return;
    const fd=out[oid]||{};
    const next={...cv,...fd};
    next.budgetGroups=mergeArr878104(fd.budgetGroups,cv.budgetGroups,x=>x?.id||x?.nom||"");
    next.pressupostos=mergeArr878104(fd.pressupostos,cv.pressupostos,x=>`${x?.budgetId||"principal"}__${x?.id||x?.nom||x?.versio||""}`);
    next.partides=mergeArr878104(fd.partides,cv.partides,x=>`${x?.budgetId||"principal"}__${x?.codi||""}__${x?.cap||""}`);
    next.certificacions=mergeArr878104(fd.certificacions,cv.certificacions,x=>`${x?.budgetId||"principal"}__${x?.id||x?.numero||""}`);
    next.factures=mergeArr878104(fd.factures,cv.factures,x=>`${x?.budgetId||"principal"}__${x?.id||x?.numero||x?.pfId||""}`);
    if(cv.activeBudgetIdObra && !fd.activeBudgetIdObra) next.activeBudgetIdObra=cv.activeBudgetIdObra;
    out[oid]=typeof normalizeBudgetedData8791==="function"?normalizeBudgetedData8791(next):next;
  });
  return out;
}
function saveOdata878104(odata,user=currentAppUser8779()){
  const core=stripHeavy878104(odata||{});
  try{localStorage.setItem(lsKey8779("aco_odata_core_v87104",user),JSON.stringify(core));}catch(e){console.warn("No s'ha pogut guardar la còpia crítica d'obra",e)}
  try{
    localStorage.setItem(lsKey8779("aco_odata",user),JSON.stringify(odata||{}));
    localStorage.removeItem(lsKey8779("aco_storage_warning_v87104",user));
  }catch(e){
    console.warn("No s'ha pogut guardar la còpia completa d'obra; es manté la còpia crítica sense fotos/croquis",e);
    try{localStorage.setItem(lsKey8779("aco_storage_warning_v87104",user),"La còpia completa no s'ha pogut guardar per límit d'espai. S'ha guardat la còpia crítica de dades.")}catch{}
  }
}

function backupUserState8785(user,reason,raw){
  try{
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    localStorage.setItem(`${STORAGE_NS8782}__${user||"nouser"}__login_recovery__${reason}__${stamp}`,JSON.stringify(raw||{}).slice(0,250000));
  }catch{}
}

const SOCOTERM_LOGO="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPYAAABgCAYAAAAuLY+WAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAFcQSURBVHhe7X0JgB1Vme53q+5+e9+Szr6QEAIEwo6AgAIqmwuLgqO44Y6DM848R33qKI4zOo6zgT5cGHdBICAisho22UmAkH1Pp9NJ7913r3tvve87t0/npmmSgAlD4v2T01W36tR/lvq/fzl16lTgKzdn/a9eFEGVqlSl1y999ZYcXglOnZFtlapUpYOIqsCuUpUOQqoCu0pVOgipCuwqVekgpCqwq1Slg5CqwK5SlQ5CqgK7SlU6COmABHYJBf7LoQiP+4Dv89hIQolH/CKKfp6/PcDLAsU8U465PWTM1STzJ8fEPPzh87h42SRW5T+7ks/CSixDqVgsmt+iymPaVtLY31Wq0v6mAxLYxZFkwadt1hdgtcdEhBcJ3OFSAVscB9sJth2BAArCed6Dzx0PeZt7NO1CBrAvBWSAfES5XM6AWttCoTAKXgt0kQW6vaZKVXqt6AB1xYMIIMLKh+AQR8JNgC0pBgguAcwP8HwQnekgfvPsSqwLRjDghBFm/jovghDBVgjKUmsmT4igDnJb7gpBUHuB8eFugOt5HiKRiAHsD3/4Q3zrW99Cb2+vOe+67iiQHSoV7VeCvUpVei3ogAR2iOZaSbjzHFpLDCOKJCJ0wTNuCEmC65mhAL7ywFb857oMPvfQOvykYwjr5XkrlQRbWdwyjwCTFITDAwHyoEnnCZt2JQFVgM1kMrjuuuvw5S9/2aQLL7wQixcvHrXksuLWWit/lar0WtKBKXHyeplkGOVSu3TMAxkXTimMVTz2w61JXPHIavzej6EnPBMrt8dx/R978Ik/bsINQ4PoCNNqlxrL1l58ZOVLjMNLjMe1FbDlAgRC5fIqSO51V1cX3ve+9+Gzn/0shoaGzPGnn34a5557Lj71qU9hw4YNCAblBZSparGr9FqTe8alX/rqGfN3CuGBQHmnSKPrwfU9hHMEpRdHKhTFoq4MrlkyjFtWd6Ozth65EN1iL0qjHEcmGMe6sIP7t21Hx/YhTKmvw8SYA9cpoVTMUkkQzCW553KjGY/TPZfKULAuMCtls1k88MADeO9734tHH33UHLNut0i/ly5diptuusmAe9q0aWhtbR3NJ4BbkFdet7c0noJ4NXyqdODR4hVFvBKcHpAWe5igThLcvqqfqUG6EMQ3l/fiY8924MF+D72RdhRzYSEBebeIdLCEfDQI300gGW7HH3qj+OjdHbj2qVV4ciiHjlAc/U4MWSfCPLTSjjrQhUvMWFdagP3ABz6ASy65BKtXrzaxtEjnBVyBzgJY8fa1116LM888E1/5yleQTCbNOfFRfK79PZFVApWpSlXaWzogLba0UY7ASwbC6I4B/7wihWtXDmE40gjE62VnEfKKCPtBlAQKl1fQeqPA+JmGOeOH0BuMYkl3Do9vSyLX0ojmuAPfCSHEqwWiMEsJkIfL62R9FUPLSit2tkCzA2UCqvYFXMXVSqFQyFj4Rx55BMuWLTMgj8ViCIepcEivxtLqmrGpSn8Z9BdhsYOeA6fgoI8h8X8t68Ft63pQiDYg5MfhJFPwcym66iUUsgXESi7iRdr24STNIIEd8BFg/OsQxKlEE1alQvjFH9fi1hf70UdPvGjAQre5VIDD3Y0bN+Lyyy/Hpk2bTNmVIBa4BfSamhqzL6DpnOJr5VPSsd/97ne4+OKL8fjjjxuL/WrJKpTKVKUqjUevqcWmw8q/tDRWHrWVV1rxO0MwufAQMINYAhotKE/lzT4PMQ7eToH+1boirnvoRdzc76Mn1kArSSvL404wwpjZR8QdwMxSL66YPxWH0Uy7XRuRDKaRTbCtxSgimTAy4SIykRiG6Xqv3NGNpVu7EaxrQKwmiKhfQrjgo67BRQPj8RdeWIHeniGE6CW4PvUhFUeR8fnpbzwVX/78l1GfqMPqFSsZkhfMgJwBHv8ZRRB0sXXrVvziF78wI+f19fWYPXu2Ab0FqLW+UhQ7duzAL3/5SzMg98wzz4ymJUuWmPTUU0+Zx21tbW1Vq/0XQq/UYr+mK6jILSas+a+MZf40O9qYg6RcII+wRqR9D27JQc4fOUFwDNPB2JYp4NonduCOrhI8WsdhAjPHuNiAJJNBTT6PaMTBwlg//vr0GVgYihnXvCsDXL95M27a0IMMpsDNxJGO0oqXwgjSevu8vlRKoT7XjVmttXj/zEZcMLkOTX4/om4UqcE8fnvr7fh/P/4hnnjmcUSCYXz6qk/hi1/4AhLROl7vY/H9i/GlL30JS59bAq+QK1t1Vl+uudporbl+X3DBBbjmmmswb948A/5KcD/00EM455xzzPFKqrTQ3/nOd3D11VebMqp08NMrXUHlNbXYgVIZ1MQrXWW6sRJ67ZvfFFymGK21IlxGqRR0H0WXwu34SFKmH+1z8LX7NmHxQNgAuhQKwivmUQrGyDeKmmIOh+U24/yZNfjiybNwFC0xjS/PFVAfcXFscx2OnTYBPdu6MJzvxkA8gXAmiFg+jEhaA2cxJONRdOY9PLlxA5YNZRGpa0VDNIwGxsxHHzsbl77/IrTOmYQPX/lJfOI9H0YwHEU+ROAyjm+fPQWXXv4e1Dc3YOXyFcikUggSrA4VlUPFJGtswaoBuJ/97GfIUxEtWLAA0WjUgF7gltuvcyL9tkkglnIQjze/+c045ZRTzPEqHfz0+o6xRwyONhJvTQFVkj2Tm65/OuHTomlEukRAeASs0vLuYVx/1yN4IRPDULyZLruDJKtfCMeoHciMsWsL8virU4/Eh06chBk8VkNNIWsdJWASbOkUQvwUAvxLZ8/BCTPrqNbyKDDuDhEwkbyLaCGEUl4KowndTRNxZ08fvnf/c/jT9iwyJi6nygn7+PB734tz3nQ6nLBG0FkAkxdgSxSUhx18+uq/xuq1a3AR42q55rLQiq3j8bgBprXcg4OD+PrXv46rrroKW7ZsIaOyK64BNmPlaaErk44piTQ4VwV1lV6OXttRcSGaICjSEpcMtBl/8iBtpZncGeT5Iq11sJSF4+awjkC7bl0vLXUaP3ohg8eL7QR1E68vEEBh1j7BxHg5n8KpgQ245uQGnD+1FnXFEqIMdH02a8jJ0GJ6cLwUQlmCPeNiKrXGsRNraemBgWQfkqVh9MaCyDI+dwpBBAsEViGOEsvqLETwTFcvksUU2hlHRxFHgkogyCqkqSTkecRZ70DBK0cT5OnKwrKhb33rW9FU28y4eCnSuYyxzpUglQUWODVqvmjRIgP04447Dh0dHfjpT39q8o0lC+azzjoLJ598chXcfyH0Si32awps43YbOdQTaJ8xtGBMEOQosEXWwaMFpuudY/z6aHcGX3tkM361tRaP73CwuVSLfKKeDHII0OIJtQG/hJrBTlzSPoyvvnEWTm1wDciCAgTd9AItqBsImjLCej4tchnL8nhTyMW5sRhOO7QZzXUlrMh0UQkQeHJ1ffKhUgmnw8jWhNBPDs91DOPZ1TvQkQ2gvbUeiZhDNzuFMAHueBEzoBYk3zCTDLfLMCAcieA4gu/S97wbPT3dWLFixShYLSAtuDWDTbH1nXfeaX7r0dp4ZOJ28jj77LONK16lvwx6XQNb07Tlueq1C5fC6QrUHoWcQKY0mxh7kMD7xZo+fOmZHB7z2hi/huC5QVpXAiI3VAZE0UUDLe1c9OGLR/j41FGTMVXuq09rH6CryzJcWsRQyUW4SHATqDKlHsGcDdG95095DaH8ECZS05xYX4Oz25pQk0uhs287cqUhZEIBeHSr5UMEGIMH3Fasd2L4UzKPu7d3IcAqz4s3IkGFFFDcQMCxVCobKi16DI4BboBVdZCoTeCid74TJ5xwArZv326SBbhcbwtubbu7uw2o9fvlLHYV2H959LqOsSXqgljZC6eAEnQeAdnP+nbRoD5fzOMfnuzEN57owepAA/yIAC9znoPrDaM2kEV9MYM5qc34m8McfP+CmXjPvGmYqJF0Alm8y6wFCCkAbkRljFGdyEFWkwMmXypeQ5feRaRQwkLW558OnYQfnTAFn5kYxFQw5g1uojXOIFzykPPyKAbj8OItWINWfOOxbvzt4q24J+lhDavZQbZpsZYSkVvCsh0WojoJ7Brwkvv8hz/8Affddx/e+MY3mmOKpwVWG1PbAbbxQF2lKu0tvabAlpDrxYuR8JryH8AwBbiDFu4Pm7fgmxT4H2ybgq666XRp+2h9uwk8Ip6pyFg6X4qgPeLjH89owt8sqMcRBFQh4CCLWoKIFtrrJ/88PPLN0R8uhQq00CWkWXCOWJPbHMsACeqKRMFHgvH2EF31PvLpr2UAHkrhTW0JXLNwJm4880i8ryaCGBFaCGbhRzXXrYRQhl7GQAIDifn4GT2Kqx5ZgX9d/DAe696OAfamwg26IAQ4C2Qb1d5QMDg6aCYAK46+44478KMf/QgTJ07kBdQhzGMHxkRVYFfpz6F9B+wcUZPNIeMX0EPbOKhDOu5RQPMUWFq9kGZdSV7pctJIIkdB7yYAv7uqhL99JoQbnXOJ4RSC2UG6z3GCto7XkwtTPFbEwtQK3Hh0FO9pbUCCQK8lq2biJ0bgFuiCl4L1jI+DdMEJvqIG6PQSSAnUBXT/WQXirRRjihD0QYIsXEQdr68lyOlUIxykBedxN+rjxATwP6dMxRen+jhix1K0eVvhZ7sZbWfB8BqBVJL1SmNNfB6uHzgFVzwbwj8PlPAcXe+i3HKBtFiAT4WTpwdRKNBXyDsIMXZ3/RwVhYfzP3AZfnLXHZg6c74BtkjuuMj+ljWXQhDZ+FpW3s5gkzKw1r5KVbK0z4BdoEDnBQrfQZwyHWFyZYBkuCiXmjVW0sAUXdpSqUBQOdhE0P3k6R2479mVtMaEYWAQfj6FQDwBDxG61z4m5QZNOjLbi6svOA1tE+rgjQh/JUn4bfypbZB1kUtbBoVc4ZcKvvKJ9OhI1yn/WLpg4UR85E0nYS7B2exoiSXG327KaBMt3eCmcgjQmpfoQi+6+0X8etkAnqe17mV/JOU1SL0wxAgE88gFC3TX8+atMTcfRCLr4KS5C3DnHYvwiU98wrwNZgEqsKruArPqZdumY7aets7KIxf+z5muWqWDi/bZ4FmKQpyngEWI4EhB65f4ZnTYcxkv0h9V2FuiwHvBAAYp9E/QpH/rkQ7c3lHEcE0rcn4J8UI/FUCIFo5WjQI7v5jEVZPCOLU2hE+eMA3HxCi4IQo2GUdN4LyTJOASbktFuvcBowAsoBXHav52GeQmETwW3LreWsZKSpDnkQ1RnDCrDdHaCNKDPRhgTF+gTgx5mlBCV93NwtGovt+A5zuTeLBjEDt43mmMo4WHY1qGKZAlqFlHDRQ6YUS9EK93EKSSa2mpwVvPPQ+XXnqpeSSmx1+qTyVwRXareq5ZswZNTU2YO3euse46prbY9lTp4KL/tSmlaSYZRfPCBYVRM8aKBLRHOYvSirv5AJIRByuyPn6xzsNDKzZjTaARqWCcwkgQEiqR3DD8WCPiuR6cWB/A546bilOjI8JM4MP1MEyr5xIYNca53kmyVn/84x/NrC1RiO5qhqHBIYccYkaPn3zyKQOGSjrumKNx1FFHGTDIQgo4SgKUtZxOnkE5LWyGHkAP3fztVCq3rkxi0fIt2ObWIBmuYTupZuhqBzWHnO0ouUkkUtswMxLGpYfOwNvnADOCVCKMBZxSiErOQVhrtDEFHKkIj8ovPlqu5oL/3d/9nZkfrnbZuqietn4i7Z966qn4l3/5Fxx77LGjx6p08NH/2pRSl4AOCXwU1KJL4TaLISjKDYKQYezt4A89afzLH9djUZeDHaEmZEIEBPEZ0GIGtPSlcBPaUp24Yn49vnxsK+aHcgi7jDG1GIJ5pBREhMKtJ18OY+pKkrCvWrUKPT095QUGaZ09r4CGhgbMmTOboF5rXq6QVbeppbkJ06dPN9dbi20tnrZKaoPPAkN0OerpcbR4Pk5qi2L+tBYM5QfRM6AxgQiKjKU99jtLZV3IIFyHflrlJdtSWLEtjURNHSbGI4z36dGwm0qhDL0XhiXEoevQQ2ESKFWmXHIt5qBpo3q3W8pK9RNZUOu3ks79+te/Nu1WW1paWsx5U/eRa7RvFZeO6XeVDiz6X3vcpfXCHFqXok9QaWYYRVwTQ0p5CnzAwZNbtuEHD67G84M+sjXNjMejNOWMbfN0YymrNbEEeCkuXDgFF89rwswQ3Xo96tIUL6ZSkIJMaymL5zKNJSusEnzNuxZItXV4jbAggdZ+ZbIDVDpX6YaLl01Fus4lKhQ2gRmLCDNvLau0MBHAh06chrNmTcZUXlrjMEwoJM3jM7gx+KUY3e5a9Edr8cyQj+v/uAr3Lk9hiKc1aO7QhZcbT/XHtLNsa3FV92OOOcaAVgs8qF0aNCu3ozxn3OZNp9P47ne/i9NPPx3f//73TR659NpKyVlQa99eU6WDm/bdBBUJqQBIy8aIj/EjYZ2LIBMO4uauYXxj+To86i9EPh5HtNRHtzQFn1bV9UOozabRQuv3/sND+PtZdFvDBK98eAIyQLcWjFEplkYLBQRqYXiMfAqEerFCEzwkvIWCRophLLZekVy/fj36+vrNMZsmtLUa6yjrLaAIPFZBWBpmYXo/LKA3VuhOF8K0ySEfMXon8zwXpzUEsbAhhUJ2BzZk8sgG6hkX0K1myKGXWEqhNIacGDYFG/HYUDf+lMkhQB7TCfiafITKL2peIBkLN4FSr2aqTpqMosdizz33nFlEUXVUnSvrqgHA4eFhM7lFVl6uuRZ2sHPKxU+KzCqGKh1Y9L8WY2d8zwiQ3OoQY+AkTdy2oRJ+uaYXN2xIYkusjmBsBHIDCBVTiLi0gukcWv0C3jojhouPnYz5NOITigQf6pGTsBN8jJRHStAQu0vrz0wE21ibLaskd9RaK4dAVcwv4W5oaMTAwABBoZGAndRQV2vOS+AtSCrBIpLvQWfBKJmCq7VN6YHwaEzvfOflDTBHNIAOP4Z7Oofw0yUDWJmMYDgYQSDiIl0iEEP0RjRx3WVbGKo0p/txaXsdPjKvBXPrQvRMCMxxsCZQVybNIf+nf/on3HzzzWYKqtqs+lrAKo9Aq3255d/4xjfMfHUtBCGAK7/yWE+lSgcO/S++tll+1BUsBdFDDP5ibReufWY5buouojdMM+zVII4Xae3qGEtPYPwbwTRK9GeOTeCTCxoxx9Gssj46pq1klYdLNzxY0gwUQlhWmvs+lYXvDNC6yYIL4DtJAi2r3NnZif7+fiP4A4NDRpCbGUtrZdGOjq0E+OBoCgVdNDY2jgJCNBbYCi8QDCBL1512G6GCg1iebjCzpWl5U2EHRfrWzeSxMBbHGbMbGDYksTabIahLKDjN9FCKiBdyDDviDE3qeF0Lnk56eJhAjdNzOawujgjrUkkCp1Klwqmrq8N5552Hyy67DLW1tWbRBVluJbXBJnkf6oPf/va3uP322835ww47zLjyOje2jVV6/dN+stgUSlqpIiIEXtC4jcTeiKusB9Yed4vI0SqtTAZx3dI+3Lo9j954LU0uAZgroJ5pkIKJXB7T+9biuLY6fPqkNhxVE0Yd+Rix5jZDLEvsTBkm+iwPAJmZXHa6pk6OsXACgV6gWLduXTledkPIF0o4bN48nHHm6XjwwYexatXKkdxlOvGYo3DSSScZMOj6V2PJRow5lZp+ZFmvAAbYTytpyB9c24fbnx/EmmINUsEahOmC5Lwscgla1ygzuPRwhj0c1dqCa9o6cMiUKZgQDSOhyTwF8hJnR66/YxaZaPRrR5WQRstXrlyJr33ta7jttttGrbfaXqkQRPp99NFHG2uvqaxVV/z1RbpXGv+Q/Glsxd7jSnqlFnvvgD0ivRrBFb4kcnkDc1ovgieQK2E4EsJy4um/nunDLSu7kG+YQVc4Aq2TUKRVgpPBpEI3mnP9OGtyAheecDSOinmopatNR9IUYyBdorsumdRotIGMFVCCwIDb7O48PELqjLvvvhtr1641HeTRDw9H4pg6dSre/OYz8afHHjcxaiWdfNxC82JGJSheKSlAUAqrXvpWGH8VnAj6WEG2Go9vy+NHz67Fo2mtlNrIPoxTe8VQ62l6i4dMJIV0KIVoxsGbZrTj749ycAL1i5Zlko+u4EF9GJcipY5UO0UWuPJMvvjFL+L66683IYi1yEoCvwRE/aFzzc3No8+9q/T6IXu/3va2t+Ezn/mM2RfAK2n/AFuSS3kq0ixpcIyiax7vuH6Ye3SMCbg1lOn/92QX7u3qw47aiYyFayjndFmzWUQ119pJ4+h0J95yzGxcwNhSrmtzoED3XN4A3U4CQY/FtNgBW2Ysn3G9KxAsYI/+GgNsgfP3v/+9eeSlTmEIzOtdzJkzh8B+ExYvfhCrVq4ayV2mE449yrzTLLAU6K4qDn2lZIEdYnnmKyLGsynPOiuwvim25ckkQ5Nl2/Hw5j4MRerhuRPNwg4OvZhAOA0vkmFf1iEx1I8z6xx8+NhWHDPRRYw89KZYmBo1lGN8nCg/DpMFtqR9rYb6gx/8AD/5yU/M5Ba1p1IBWG9EfaSt2lql1w/Ze6WnH3p/QL/HGpn9E2NTjiRKRfNsukBByyOSpfl2gniOcfWPuodx3WPr8ehwHIPxNuSLrECIPIvMR7vVmuvFEbEAvnbSbJw7ox5ttD51RKax9nSvNb/bD9B+MYULGiwTShTREtgCOfcMwA2YdwpsJck6ScC1UKDi5pbWNrOdMmUymhoazDPtaCSMlpbm0TSpfaKJW0WybGN57i2ZGprqyX3iX79E41pEtJiDJsfOYFecNpl1qWlAdCiJwVQG/XTLfbPkMeN2j2EMAVyMR7CZsfjDmzvRQeDn6+Noo9UOezmE3Cz7Xqu47HTRBFAJgI4ppLjyyitNLK2JLRohV3tsm5THuuhWkKr0+iHdH02Weuc737nLfbO0T2Lsl9x4urVarK9AIZVcBfJ0K0sRPDdUxBeXbMFifUEjSDczl4BToKBRCwTdHBllUVvowwXTG/G+I9txarhEt1LTS8lfQ9YGpBQ0h9qJjPVmVL6UY+jpmAko5KTTu5Csuw6NfUAkayQajTHJz5Sguo+UM7azNOfFXmcBMzbPHslYaak9aViCh3+1AERAo+XGlutFENbFjyLHdiVLATzSX8S1y7bgmYEUUtEmstA73cwt99uJMS+9cD+NBj+Hk1qBvz6mHQtp1escvfayK+le2Tprq/boCcC3v/1t80xbrrrapuPqG9veKr2+SJ7UFVdcYT7yWHlPLe0TV3wssDWFgtJJYQ0g7+XRE4rjts4krqeV3hCaAM+h/aUgFxgXS7A1/7mmlEVzNITzjqzHW6dFUc/jrXTfje0Vf1XeQFSAE4DLwBrmJsZtglkS9KdrhL4KKr9rLRjtHoC7tmB82j2HvSQTVyvJjQ+xD3SQZCqgNrLNpq38RatMrcM+KqEzEMPNawZx48pObNNohd76IujDBfWDj3yQbg2tdcjrw6z0EN512DxcvqDBPJ7TTbf3aKwACLjW9Zbl/p//+R/85je/MQDXcaWX3F8eE0kBKI3lWaXXhj74wQ/iv//7v0fvQyXtF2Drya1DofPpdmvpoBtWd+PrL6xGZ/1UIrEO4b4Q4nUBpN0MsmGfrmgBdakkZtHNPSyqB1NDdDWHaDHyFHIKEBWEtpozLVdcW1k7iX8pFEYil8T8uiguPP4wTKyommqlQXHRKx/m2k9UCewAgc09wcT2oKqr1WIEcL0I4jNvUODzapGMRrA4rQUmqPTYID0v12C5esMjO732KmemmQf8HuDsuiQSicRugS33XMe0lXBo3ODFF180SRZbk17GCo1I/HRe+aUUxstTpf1D6neRwsjDDz/c3Iux93W/AFse4jC3cr3vXrkDN27LYGNEsWkEgZzDmDkAz88jEyoiSytD3CJKd10xdE0uw+vTKER99IYnmJiZ0Oe1zGQAToFSQ3hE0NZjngnZXpxNaf6/5x6OSbYqI3UyX+rg/9cNsCtJVVRDSNZBV3L1ZIvbTJCxNKEvkNdpwkrGhR90keVughcoFCkwjnECBQQ95ROiQ2ayTzoUQPOIO/1yoBbJYuu4kvY1Gq7n19YKjL23lkz4wmt2l6dK+4fU3+p3601pO3Yg95UCe6/Usjy1hzb24G8WL8V/dvcT1O2IDTZjYl+C7mMW21t70NeUQyYcKi/s58UJ8Dr01zdjS/skbGuehX53JsEeQ5jn3EIcgaIc7gixrbnYjIspVHKzk7Xt2FE3FX1uwlg/AxaT+Od1KHCqox7/mbqKNN5QyhDIKdrwFMJMpaBHwALxrIvGZAQN6TgRGEY27qIQphV2+jAc6kbB7WdsXWCf8iqGO92hKLaHHUSCQ2jL7XhFVtQCXAJiFYAGGMcjK1iWv1UM1fTaJXu/RNaC/zlk7qTGsWSR+ymiBQpiIOchkAogy4BxOa3xJ18cwuUvBLDSn4ZSoYUATcKP9mAg0YsgLUx0MIZgmta7FDQvauiNKEcWZzgNZzhPoBdpjXiM9c1FYyjGQ+aNKb3eGfSjVBy1KPr1hPkQUZJFktZsMBzBNKJlyBk2KRfQJBgNmWnSSp77Hq2hgoSyy6qkfasDMn4Jg2yNWlQysGMyA1oaAiyAfgR/y67qKj0kzjOfvrZdMrz0DFp9Uv5uthKPKtEzKQ8jlsxkV5+KLVoYYDvSVFIaZKSmldLKJUwKeAmzJFPIJ/zDLIumuURcazWXMK8PmRGFOra9ldtGZBwCnndFN6aGqYF2OxCoRynShkwgybqpHNWbjZQ7IEvPXdVZCsZ1BwnQYbrTeqYtze9ySx5k6GohR16rJCVqHh/yHjsMhbScVC+v38pU/uJ3lV4rEqAFZrt9JQr85chwoByglrJbTyHSoJTnFDBMqXoumcS371uMB1ZuZswWJzCbUKCg+qU6KoNdk5zNQEAvKJSTXxxGJCGhzKDE/SDj61pvI+PLDgQDXbRSHYgXN1CoKE4RCnwsj2RMkro3JM3G+NzUtzxsJSfFPEsmiwA1VYzBeH0hSCXEeDFHFMnf1ZYpxGMxT6+T6lGbVk8hxJgcxvvhUhERAjlRzKG2mMWw5r0zZZwI8kx6JKfZdxqxV5m+E6WL3UB3OU5ABJBm1QohViJCqEUIwtAQlRjR50aZN0RAlb9Fphao7lJVCknCRGWEid2AOLtDKUaFoK7ROJpDdq7WdkOc15tlLHg1iSB1qWIi/hCiGCC4mwjyeiqeONuntsm11liGStJLtJo5WL5eXkRRned6VDJZNFOdTfaTDBNYYJUOaCrH2GdTRCWlEdkr2reSiy4K1TNbOrCZ5i9TpDiU9L4w42M9PuIxd4xWkRXxhSpLzFNgHq2EovXFNJW0hXwHgnS/aflCFDs/lsDda4FH+wkIup1Bhz6D30qhL+Kc+mH84bR2DAWN3STYwgj7rKRDkBiPZWRcnJZZZZkkyGgjkufA8mXbRuybSaq1TUEzAj1Chlkl6SpaZX0XjHvKKSDS0FEBqByWy75QGSVXSqbMImCsv7yE8kM29YgAJvs8Wi6T+IxWSmTWkSrnl1+hrU7t5Fs2+NSUTORiDjKHeUVWJ5R0b2jjLU+7NST+zFtUK5j0hg01htaCEYVVK43YFXhOFVSVq/S6oVc1ePZFXlAWiwLxTXukVyZ5Z7X+9g6eaKD1SUhgJdAjccBLiJZPVm+UmDUzNIhYfT2FqWget/jFGnRlCqircZDPDKJhygR86/EB/Hh1GsPxJvhuhhZP3+HaPbA1OCfhNLCkhTUutYRYvv6IRZR/KsstITUfKuAhHTdirR0dcNI8KCnWUVmxgHlcpZF3C65ar8vw1HJG0Mf7WGrZYuoaurHMZPSZ4cl6CDBSeko6xsRoxtRBWFFpZtBCikEtsCD12L/a8qdJ2h9LBYPsMm9e5wfKi1iIk5JIk2JMe1Rn3iv1laphKxMoMszSSL7Qr7mq5Ke7br7FwkNqC3WiKaJKrx96VYNnEpfyLdYBPUrhYR2gjOhRiystbtxVMtabVvLf9ObVLol5dI1NFJJojP489zVB4ytf+jqaJtZh3qxJmDK5BWef9UYMpAYx5OeQjwZRiIXpJRux3zMZGeWf0SQcBxiHB8zqqEr9rHcPY8suHutkmzpG0mamLUzbeLyLdmoHwTFAkCTZ+JFXwA2VDPDEWABm3Sj4A4RmH6HZyV7awKNKG3nNFpa1g6mf5aWIiCR5G7stFsI6FYyWdtJjQDO4JmBRCei04nS9cd7L2KqbiqmLgOwkMLeMpM0jWx3romLpYRpmnbNsrxn0olIzH19gVQXKNK/XKHoP67WDfLcxdTBtZNrEdm/l+S4qqR0MKYbYpkyJqpz3zlp5KQLTcvK0z8THI53fm6TrxUdJvwuF8ptor4Sv5aGtTfr9cvRyPJREqoNIg4mVPMeSrbM9b3nZulTWofL6sWXavPZaS3a/8tp9RcZif/5dYXNjZYuMB2ZN3AgJs3qxardkEVFJbIjdfPbqz+Ha6/7NlBAOeJh9yHTcvWQprlmewy87QkhGm1gQNUleM8v24IqrMMWNOqGOI5Ak0ALzRtZ74/Y8nto0jM1DWQxmU0iXCvAMkLTEkYME3f54OIJwPIYJ5DeN+ueUSQ04tiVs4mvXDC7RnSYYh70Y8nS116RCWNJbwNptPdhCr6Mn7SGVp4AQTeGwiyYniGmRCGa2xnDkzFocUuuilXWpZx5HZj1EEMqim44KmFh9kG3oYa+v6vXw4KCLnv5hbOveQb5Z5Irl59H6HFGYdY2Sd32sCbOiOcwpDeLMw2djZoxOPtumPs3ynvlhB09QZ6zZmsTq7UPY0DOMvlzJrP6cp3J1XLYv4mNqSxyTm+pwaCyIEyaGMZU33Xx/TItf8N7ksyV87KNXmfe/7WMYO2JrSUK6N6RveOu74HrkpqWpPvKRj5jprlb498RXZdtR4g9/+MNmwUfxEv3ud7/Dt771rdHzlsarm57N6710PSvWohVanUafKtZvAV3P98eSpijrs0sqw75QIzBqkpDWhv/qV79qjinZdth22QEw5VfSyx16j8EeE6kd6pu9+c75q3uO/Q7eWdMXZM4C5IqWcS3Hs7zViO/uiZUlIHal8jWKyz/72atx/X/+kL/YweQ+c/YM/H7JEnz9xTx+0eFgONIA18sgp07aI7BZO5qWclcEkCWot/PHL5f14ndr+tDRn0S6YTKG5WLqJquzmVMCYG+6OtKjoNdn+9GS7cHVJ07Hu+fWoMFPs80agddMOhe3Z5pw80Nb8ey2PvRF6+mcxMxAmj5UIFZasknOjJOlM5vxEHeziAd6MD+awpvmTMdlc9rRRgsdUf+NlO3R6vazHx4b8PDTJzuwpLMf22pnmT4PBPXoj3yNppWC5VH+l4dfQBSTCj04fvBFfPGvzsF8N4cwlcYQeT3X7+OhpctwY7KZysyDF05QoVHgg3EqKN5To5k15pAnW004KqEpn8GhkQIuOqIZ75xTi5biAMJUGulcGIcf+QYDbAn9eEI3HnjGo/b29lEFIWAfeuihSKVSo1ZzLI3lq7KVdFxA0vfHta9jeulFYB9L49Wtko+SZEHvEnz+85/Hpz71KVMfAb+SpFRUhpSRrrWk6/U+vBad1GKZlix/bQVeqwj05t3f//3fG0Vh80jRaI6B+mbChAkvUU5j6VW54nlaHY0j6VGVjHWeyWPSKqMaFNPaXBS33SZZezV9lyTwKemfXvaQ/mD9c3Q58wSNQJyn+yrryFIpbHrItGfiFUxlgGvCS4aFLe0axo1PrcMKvxHdbXPQE4ySt87LTfUJNsd8ykevVyqGLLFtxehIG8lrQm3ILJKIQASeH8NQoB5Pdbv4/N0duGfQQ1dTO3ojCfTHEgwZdBO0/lkOiWIGcS9lRuH9YBN6g23oTMzBI5iC/17Sh/94ohfdegTGXtKjsBLd4BS3T/fl8N37VuHeoQi6JsyncghTSQTNMsxag13z5zVEINWq/pNm8qNy7wqY3FiHlnAJIXoJQ7T8dw0E8Zl71+AHww1Y69ehK9aG7mAtUtE6luUiS4/DZ18wWKHHwn4jLymmzpoGPOnW4NtLOnDtkm0MJerYow0sV2vFlYVSVkWC+GpIPMZzM2X9KpXs7khAEA/xsvktOCqP7Ykq66LrRZpTL2ALeGNBbUmfN7ZAVVniod/JZBL/+q//ao7rt47rfGUdRU8++ST+4R/+waxLp3OWj9qvOukLq3sC9auhMrD5twxsiivrI8ioeqqaBSxrutskofUR2yWVRpMevdSiQMvmET1agzyleJQpTRc1r7XEgrSQeq6z16QaSvGUIb52hz6kF8dQrB6ZIDWblEgoAyeSQ1NzFFOm1GNSez1a6CrHawM8zrJ4YQxZNDJ7XSRIwGsgKoRMIYpBAubOp7uwnUAapqudjJJhjElvn5XSiNGyt7K+bW4ejYUkarJJhPQ1FHoWRTeBlNeIwfg03LO8F+t62UcG2AQr42O1csn6bmwYzCKbaKEHEEMu18t7kIIbVRiQpqDQXXW0lJJStpxIdU4OM9vqESXqfSrNISqAm57ejNWhCdiamGXWLTfiK+2lWN4tIMgUdz3UBDKoKSYRZP3N03oG5im6lR3hGjy4vg9LO3k8WE/XvbxOuUhWRdZFglqZ9oYk7JoCq0UERBJo8RJZpbEnvhZIyq/XcW2+SsVgj1WmsaTrK6+xSkGWWlbZ1rGSdI19S04TfSx4dVzHFAoI4JZ0vlLZyELrVWIzcMxjOi9SHp0TH/Xv/qBxp5TuK7IN1Pbqq6/Gf133X+wtutRE1IxDp+MhxthfWZbBz7cwjiw20BrSYhciVCS7d8WNx69O0lxNehspJ4EvPNmN/94uKydVwjJzQTSF8vj8iXFc0OqgiYINP44M3QYNopcyBFUmh1WMZbMMAeZPasVUN2KWMALj8g3cP31xFp3ZEJxYiW57PV2NPhzhd+IT0x3GphPRWteEXCGPnkIW670+PPRCN27ItFOBTUXdwCByIbq8VAh/1R7DNxcCTbK+rFd3qICFj2QwuD3HWLsFudpOtqsVswe24MqZDo6dWodmKiliHAV6MUOMe920i95MP1IZF0e0NmI28+QYs9+diuD/3N+JzX592crTIwiEevDG5GZ8aGYTZlChtcTiaKB1H2Tbnh3qx6KVPVjWx9i+fjb7MIz4kD4fnMRnjgzgn9snIJdPYenaZUb4rLBKkAUCvVjyhS98YVTIlXT+m9/8Jk488URzrywpj4C9YMECA0otTzV//nyzbJMlge3iiy/Gxz72sdHflWTLUflye+XaK4+O//SnPzUvTogsoKQ4vve97+3iIosEIFnPX/3qV1i+fPkoT23lkmsRSL3yWkk695a3vAX333+/2VcaSzfeeCPe8Y53GODLKiv+Fgm0CjkWLlyIjRs1dPlSUvn6SKM+1qj6745eqSsOAXt/ETvfJDbSv+qqq+h/yMyGGZK6/txDZ/ld6SH/Y09u9xO37PAbb8r7uIOB4qK0H1g07L/lgU7f93x/0B8yKVvM+qWCeOpPgVuPobvqnuQ/37/qkW1+RNffnvQjt2f8GT8f8M/54Wr/haLvp0op5h3wc36Kf4t+moxL5FrKF/xuXru94PkZHs955Mvke3l/cWevH//1sB+5td+P3tbJumX92t90+H+9Mu1v4dX9XtEfJm+y8NMZ399GPn9KF/0Zd+3w8buSX3/jkB9d1Oc7rNOF92zze3zyLjAz824aTvo1t3f4db/p88O/prTc2eG7i7r88x7u91eqPkwD5J1V9pLPOhb9JLedTF08l+bxQinvDzNd35HzJ/5inR+6LePjpmEft6T8+B3r/W+u7/G3M/8O5h/kNs++TJLnFv6+ccD3z79tnY/bBlh2xo/9ZtgP3L7dv/Cxteosv5gvmvtGIJt7J7L7d9xxh09g+RREnyCSpJvftEyj99smutyj1ylt377dJ4jMNUr2eir90TLGEgG5Cy/9FonfDTfcYK4nQEx97PbZZ599SV1okc01ixcv9uvr601eWw8qHf++++4zfCuJis0/+eSTR8uw+SsTlZlPq23yqxyVYbfXXXfduNdUpkWLFpm8e6JXitPdq4nXKemxVIZus2ZkU5+bUCHKOD0ga0urnkcUG+tKeL4ljU3UF34uhsBALcJ9MdTTKYj6KTqigwg4Q9Dy+m30EKJ0pfWNLS1amKXWH3JCjLW1TIJHvlm4JQ9ttOxzayKoZ2xd5+TpjtNNpQsXo5c8kS77oWEHU+Vp0or7Dmum8IaVy9PSyQljf/OviJZFc7hZVkHzQbltzA1gXn0I9Z7mjhURL5bopbCuSCOBJBPoSvvQBwaj5KmJP+UVWxSOsMgC9xn7R9wcItl+HJIIMVoGAyDWz8/Q/c7QK8qimdcspPMxNx5FjZ6dM941zwtoKJOsfyrMOmncgXWVFZFVUUysrUhbnaPwjg6AaZ/Cac6NTdYCj2eRdJ1I52zfaFuZZIFVjnjZ+owlHRMvlWWvG0s6p3xabrpy/rxoPJ4i8bTLPY/HU6QBNH2BRn1k26OtXHSt9T5eu0XiqTrJqr9cnj+HDkhgq9KM+ghrTVJx6NoTnAktIUS3nfG65qFrqLo7OgGff3gT/m7FVny7azsWEYRLiYIdhXqCYgoG6V6nmdUzj/dGpntyN0vVUKSLrwGxEuP1IkGuiWHBVNZMu41I0CTIhAQv4V3iySLjV+7W6NEWry/4elzG40SM44b4mwpIcS+BqBw0oiY5QR7jtoHnolRMcZ51SlQYUujKSB6aQqI8AqgcPSOGDDkkbB7roqWW4bLi4sl/AQI2RuFy8h758LwGQAlWPfOOUAGGi/ry6TD7TZNV9Mkk9aj6gO2lopHACagSUG0tYET6rf1KYdRv5RlLymPzW6GvJB0TcPVKqQawtLyTtpVJx/RO+RNPPGHyjwdCW77Ksr/Hkq7T+bEgVR31ezy+ct8rY+jx8oiuueYas7V8xFPvwGv9vfHaXUkC9v6gnXfnACKF1ppeKYumET9NxT6irQbNpR526gDvSB+CXgTOcCuWD7Xge1sS+D8borhkyRDe8kgXLn2mH/+cDuApNn8971U3NbieK/uMNzUrJ8YULxCopSGimVbbiRHoEbhBrW5CS+QSdlICjMNLtHI0i+YjAnqSoKfK0gK+S8tB3lIIgQKtCfcFOi1lzLsvO0trLcCZJoHeL/ky/teUW8Ga8bJBMOtlBiAJ/CABGtIxyaWEjMkNUiGJgf6GXHhuDG6kDgH1ixQKQqw7ebD+ATfBXAQv66bBSr0M47Mt0hsBKrcYG1ArwSyULaUEVICRsNqtjmtrBVb7Si8HJl2nJF76XUn6LWssi/fxj3/cfHFU27FJxzUIZfmMJVu2LLH2x8tjSUpEAFc7RFa5vNxz7MpRa/G219l2q6ynn37a8NU58VbSgJzNa3nbeuk68VLSwNr+oJfvgdc76V6axCaUfMxsqsexU5vRmN6O1sIArWo/QUSLRGHXELlfUKeH0Z91sGxbCt+/ay2+dfty/OipNB7r9jEQISho0TQPXA6+cfIDGnATCMvJPDFgEjg0Gq+tWcyR+yyJv0Xliuk5tP7RUNIq2qNlsvv2t0jvmZd5MxHtO8/Z2oylcp12Hh/hKIXD/HrMqJ8GyKyj8pZz6eGe6qdyeIDlGjFgftXVMNxZ+H4lC0iBWyCw4K9MlXm0/3IWUHnlDgvcAqMAU5kY3xvl8J3vfMdYYQtuqyzGe9wlN1wDYtbSi1SH97znPeYbabpW51Snm266afQJgr5Is3Tp0tEQQiPuU6ZMMSvEWj4i8dKo+56s+quhAxbYsmAF3XhaN0oqJtMkfu6EOfjHMw7Fh2clcFqkH9O9LWjObWNMPEjrm6SVzzAGjcEr1WMoMBVPFlrwP2t68JW7n8ct6/oxxBhVgAiW9PEDamy9LsbO1+KEvqNXT7W0cBkUzEYiaAhCfZtMYNI1Bhx048tzAAgn/lYaS+aQ+IxsFQ2YiGCEtz1evkUCXnl/Jyvtl+eJl+uiM3IPqMio7Myw1Ii8lMFNoHDf1MccVd9J6VFp6BrrOuwsYL+ThFyj5RJsgUAAk7BXJuWxgq/f45HApOuVV+C+5JJLzKh4ZdJnnjR6/fDDDxt+lq/K1Eq1RxxxxAi3nSQ3WVbb1sOSPpioFUV1vcCt8woZZLV1TLG1lIK19CJ9PVXgFp/KJCVUyXtf0cjdPLBIrmSeKcPam4/g834nGDfOo4W9uMHB1Ue04PsXzMUNF8zBt0+ejL+dHcOV7QFcUOdj0nAn3WMNWBQxGKzHYH0rOhJ1uH3FavSJt2bRlKK0xEEkwzG6pXkzEcVh5O07OQNwAUhzuDTxRW9ohpkiPt05hQc6zfoUiSDNC9C3wXcBasX+6DGSvIPye9YSYgqpziqDYmBTlnKNWG7DhyAwaYSBOVNOQSoifaZXnoxrfAry42/qG/IR6B2EilREeimc7SyKDxVlXjpBh15DqZBQ65GQplx+8pOfNNvKdNVVV+HTn/403vCGN5i844FboLYAE8j17TJ97qkyWaBVKhCBcMaMGeZDCuPxlaVVXiWRtdCahqo6aWqqeIgEUM1QU1hhP+AgkhuuR2ZSBrZc2w4lKY4qsEdJLjNdKd4L476aUCaHuuIgWl0PjW4JE30PJxBp75kUxufm1+OrRzXje6c34vvvmocFExzkAnmGr9LGVA6RJmxJRTGUl6CRFf+kGZfG5K6VPAJUU1NzCEf0kqPHazWgpfXQNamBUWwxY96Z1gIJRY3VF7KMAgh0zcgh/xLrREeXPIR0vfgRQq1XQCEcppXOI84LazK0HlQMJYFRb2CRp/n8KPPrFddAYJgVFUB5nHXXCfEUiIPMZ779pXn2JdaHPFJUKMUg608lFiok4ZQyvILCxv96OcWPxFjzMm/VT5JgvlGmvtz3cjYuSbDlvp5xxhnGyv3bv/0b/v3f/32XpOP/8R//gXPPPdfkr7SCliwwtBWgLHise2+TBaHOa3KMwKmPTOg5+3gki628Im0tX3kZkyZNMvG/LUPnnn32Wbzvfe8zz+ntsZkzZ+Laa681H2uwz7gtT1Hl4Ny+pAMS2AJ1mEndpAaUQnRrIrqxBB1SyLgZgt1DmADUcFisWEIdLV9rLoWjmE9rnCe0yglddFm+vMeD7gSzwIo+wq8RryxBWJtNUsY1M05j1bQGbgFpWvCsXGwCMk+IpjzeGIJG7m9axj7sEWh5RBnPh7K0IkRRySxiqPhRJhFI+2HU0BoUHQ3AeUjkHLMohJOnMDCflmh2tNiBptoGQgZrCKTInAqNQIWJ/TV6ztrl8syfJVpZrksFVCCYWethAjvDcl16G0paR01m36ermuN1aQpegXgIFAh4KQuWHKcVL+jVUB2nAFem/UUCqgXH2DJtubKclXnGkgWdSHk04UMfI5SLrS+9WECLZEFtXPz2t7/dfLxQ14j/WBLoZOEtb1uOeOgaxdoCq/UEtK9YXrzEX3W96KKLTBig63SN5WO31cGzCvKdMK2MPtInF5hGRl5PpoYWrR2xXCvqs3W0UjHCLmKeSxeDRFyIsXU4wdiawCKmhwjMRDpBCQ6j4DJONiuo8qZ5FIIcFUKQ4IjlkQvzhheDqMnXo767BqHOAK1tDYrZet48fcVSUzCjyEWDWJ310Z2iS+vUYDgaQTJC1y3iIEz+6mgTf+vLHlQMEVljKZFAEEOhBDpCYSzPF7HFCZr13rLkmw4m0EfhGECcbZnIutRjKNhMS8tQQZgXT4010ILkg2xHIsrOiKLfj2At2fcEa5ALtcILNSLH43qlNB2Po5MuzqrhtAljCizfPA2gQgiHtOiUHvu9FDz7gwQIWWylSmtamQQOWVedt4AcS3Y+u/LqvL5ntmjRItx7771mZte73vUuk0/nBEDlU5maw63ZcOKr2Hwsyb0WVdZFM+n0AoiukTWWm619kX2WLd4i5X3/+99vzutYU1OT4SFeGuQTqYzx2vTn0gEJbEWgmtehuFEfwtMr04/1p3Ht85341eYe3D+Uxbq8hwGviCHmG2Irh4iqJEG6KZVE545ttPhbEfLqeT2FWM+Ng1lEHaJFa3/nC2iORRCPZDFhmMdo2pK1UTzS1Ibvbh3Gf67tx5JUEIP5ELYx0F/hhXFrdwbfeaYTq/v1yKpZldMkO4Tzg5jb1ICY6isBYIzeTI+hyZHLroUeqEeocIo1BbzQuRa3r96Kp3v6sHw4hdXJHNYOeljVk8Syrh78vCODX6/twurBDIFKS04LPq0lzjCAXoMeu5Fi6SAShSY88HgKdy4bwhLWZxU1WVchig4qnfu3pfBvj2zBU3qAH68zYYbWdomkBzGtzkWE8qZufS3IAkIvY2iqqkaStR2bnn/+ebPV22HjkcAqKyl+sopylfVbgJcV1fNwWXGbR+AS6Wul7373u8031S3QKkmuuK6x+QVAO79dSkll6SUSa8FtPZREGmCbNWuWAbKtiyVdLz4adbeWfF/SAQlsDSS5ere5KHc1YxYU+Fl/Fp/dUMT7V6Vx3lNbcMof1uC033birN/34i139eKtd3XjnN9uxWV37cA96dnI1s7DoB4KE1wJbxCziLzWCH9rggmVwKzaMC6Z0oD+ml6ihe6SeirUgo5AC779nIeLHujAiXevw3l3rcOHbluDTz26DbcP0EOomUr3lpnpSteUUpjj9eO8uc1an4SSITNbRA1Pn3XYRDRkyVuDcbzxvZFDsb72SHxreQzvfTSP8+8dxtvuHsJ597I992Vx/gM5fO6JPP7psU7csbLTWPIw3f/D6LKcOq2RvLrhDO+g41LA1sYIHkw04G9X8tr7t+CsuzfitDvX4uw/LMfHH9qChwZDGKxtp3WnMNNSN2SHcGyth7fMaECQVQyyPq8FWeH++c9/bj5RJNdZ27Hp+OOPN4Nn9rtWY0nHBCqR+Am8AqEGplSGPuP04x//2PASCUhKyqOZYx/96EexdauWcdyV5IpXgk68pTRaW1tHFcSRRx5p4mpZZ5sEYn0M8nOf+5zJIx7Kbz8npWMqW8dVx6rFHiFV2ilqpEmDV7TE/Luiy6fL2WpewMhFp6M31op1ND8vMmZ8IZNj8rA+H0SyFDGvb2I4h1J8AG35Tswt9OGvjpiGOrrGPl1nxMNopvx8/tCJePdkF+2DGxHOdPOOFFhGmGCfgM2JyeiomYRV3D5XPxv93JboPpc8Hw0UiJbBTiwoDuH/njobxyWo4Rk3BzQ7jJZc775dOLcdbz+kFm2Dmxhf9xNgWQToKegRWUbueEgvi4CAL6E34WAHFc1ATS22103AIxu2oocui0/TqrXGP3fMdLy7JoPT+1aibbgbjcNDiOf1GKsVA8Fp2BGYji2lGdjqzEF3ZCZdfAqYZCkziPb8MI4OpfA3b2jH4VE2OtvDLlW/7koSPiUJpXVLlUTjgW080vX2Wgss/bZAlLuq/cpkyeYVULVvj4mPjmtr6yOLKQts41/t651nKRC9cGKtqi1bA2j6vLBGtFUHHRdvxb+2LMtfW7nc4mvro0G/DRs2YNOmTeYzztrqy64qs/Jae432xUP7VWBXkGLrkmZwmfeiw2hhv8zatAGn9O3AUdt6MX9DDxr1qqTTCn1kPxudhGR0Mvr8iciina5rArKhbckVOBFduPLIiXjrpBjCJb0nTqvLJBmfRIfgukOm4x8nt+Ck3hVo7V1GwK6nhetBSzqJCf0pJHjzA4VhhFL9BNRWzEcn5uc34LIJIfyfEw/B29oTqKF8auYZ7zCT1gktYVrIwScXTMUVBPe8geVoypSQSFHQhl2k0ozZUc/4vIVufS2VQQ2vq0eDN4zGnGbVZemtUMioBBL0MOYGi/jCyfPw2fltaA1uRA3WIeJuQcndhlJkEH6Mqi+Rhc8U9YcwPb8D09ObcCjbc1KxG3/zxhk4vbGGCoagDlObyBsaQxJOK6ACioTSCqnS3pAsmSUJ895cp3xW8FWeBZ4AKaCItNVv1U+W2x6vJAFZA2Vyy88+++xdXiXVNevXrzfPmgVmHRPw7OCZ+KoO4is+Uhiqu8rUVlZao96VqaGB3g/z6lrVWfni8bj5Ldfdgryzs9PUY1/T3n1tcx+QBjGefOpJ9qRmeNOqtTTggx//OBbvKOD5IWozP4psSFZYY7o+Zkfz+Kvptcg55YGIoLmO9aQwy6pRLLgvQWN+njv8sMmY1V6HyXVBTI6FUBfKoa7Uj5ZUF5qTO9Cc6TUrhMwIZjA3ksHR9T7eurAdlxx5CI6fHEejRplZrs+Op7giJO3hU8CjDqZPa8DsaZMwq74Jkwn4ZnoB8fwQwsU+xP0UWtwi5oYKOJL4O2ZSLS44bhrOW9CEQxLEE0Gied+GHW+uBqbK4uwjHnQwc3IdplCzNxLzs+Iemvxh1BYH0eT1ojXXjXamqQKjm8Xh9OEPnxDBUfUhzG9qRIt4aeBPwhV2MXtSMw45bBpm1NahkRa9JpNGSz6NVrraLZkBtHtJzGBdD28I4thpNXjbvKm4/KSpOIR8E1R5UYYFxVKc3UoXmQqokiTYEkq5rIp59bhHg0GTJ0826fzzzzfPhHdHmmWl1yP1mqSeAe9N0muaSipPcbK+SCnAiGQlNR9b57W8kPLLBdZgmdzlSlL9BUSBUu7zihUrDAA1g0wvhsi6Ko+O6TM7Ap7iej0TF1+1UXm1AowevVXGy5UksCpZ0r76TcBeuXKlAbKeg4uf2qR669XT8ZRRJe2Tr23uK7IN1HZfvo+t6ZqaZinugklIL1wwnvU0QBYoz4/OyaKV6PJo1FhgFaiYX8++a7VUEd34QjGGREBrnJXM2FMpwJpplROTj/AupeFr4QT2pz5hVHQ1b9ulNXXMBwXozENjqVIJTQWf9cvBDdECkEEDPQKH4ApqQE5IpgLSRBDxjog3Xe8SlUmGcW6WbrrmgWsGW5J10FJP5bbJH9GzaLp8vFDXOjSoioNrGF8n2MYCG6TJOiomqkdu7B991VNglxLRCqmav15kWS77jTaEia4k9KKIj5BXwzo6CDla6MFl2Q3sPdaRqZIk9LqP2ookiLJqssLWSkqAd0fKZwW9crs7UnkCsi1L4LQksFSWLV7KJ49ibF1kNcVHW1lMm6+yTdpXHk1msXnszDhbT5Vv22zzi+x5bVUvmyxv1UfXVJLOWUDvCdivammkA42o/0zSP0PcsA8J8BIdWMe8gdXmBzCZAi0bMpt9PpPgmMX9acw3gWDX21TNFOQYOzSs58m8TvdGt0mCrTexfFpUl+5+mNfEXH2zwzGj243MOJ15DmWax99zuZ3KG97G481MLQSm9HlE98qAVN1crq3qrVvtyyLyZseZv5Fl1LO8FgJyChuiOs/gTZ/J9swi+KbxWDuPTWEZ7SyvlXWOybcnf30u2GUZIYUlVGwqV69rtpLvBJY8hdsZvGa2eHI7mb8ncl/n6phitPh6BRQBveASLQvoiCDbJLICWwkaCXWxSODpRRKSslamsaT8FkxWkMVT/MYmCwxdo/y6TkAYm1/nHd6/kp5mkOwI9SiN1MUCUEAV2XqIn+qi87ZOcplF4iWywNZXYXWdSGW6vIdWBrX6jpLymJV4eN90jco34ObW1JnnVI6Oje2LfUkHJLDVleoKdXG5m9nBjEEDgUZa6QgtGj0A3VzdTCMAFEgCQRFeOcrTcfrJute0wprGUijpHd2yEPkSIN4YxydMxIdWXC+HhlhqmKWbd6GVqDzkAUgMAhHWIUShITgovrSQ5XDBIegc8lWtDU+65rrpHq/VQoNFR89g2ZoAuTC2l0WV6EUl1MynZZXFR4scFpl8M5lcQsYN2Wo8TuJnYngqIl9A4EGTmIk5RxKFSeXQqpe/YVLHttWbPghQc+lT/Y4fQoK85a3Iupi+YJKVkvBZwGifh40QG6E0ldkpSuU+ZIaXIYHIAldky7FkAWzPq1ztG2CM7FeeM6BR/VifShLLsbWwFt/yq+TFo1QQarvKL58Tqb62zuKpIQjJlMNOL/Mvb5XMNfqvvNKXLMMoFR4z9ed9UR3KvHZa/H1Nu/bEAUxGK5LUeVYDWmHR1p6vJB0v8ibqfeTyjROf8jX6USlslnRDrEBYquSvc9pXHezN0y0vUhokDBYMQbrgBjzMO04x5lrlEz+R+NjftozxSPl25VcGjZIRRqaxJF6VbdK+FWT7eyyZd7ildNhf4q33vQ1xY4V+TyT+tj07+6qsOCzZOuyOlMXk0h+yEDiVLJn6jfCxvF+u/8qgHNkfQ/a49Idp90jbx6aCt6ti4qFdkuoga61222v2NR00wLbCYUk3znQywaNYabzOc5jf3CDuSxB0fVDut6wdD1bysyS+SvbG2XLtVjGc9kUqs3x8Jxg1GiuNnfcY29MCuyNu7Hiketu663rbHl2v/fHrV1YycpGVynUr17Uogef5sSRBs22qrLuoXP+XlpP3CgSvrt3J32RjUjmyensilVl5fyrLKtd3/JlmL6GRckWqtcIoKRaxUrL1E41tZyXpuO690njlqj+9vKZHlffVRbLKlUkUDJVdcSkAtcveC5t0zPavyrR125d0YC5maPphp1YXGevHcrZt22ZmMqmz9Fs3SNpRAx5z5swZyV0mdb5uejqdwZo1a2m9GSdP0OjqBAJcbq+EZCTzCImfBFHlaIRYQBbpkYdGOjW6am+WhEezpbZ0dKC2rt6MGouveKhsXa83j8yobKsWadpJtu7i0dfXZ5bB1TG9+qcRX3tuLC0bWahP4CrzKLJuNWhrazXvHCsWHytG4mW3qpP6T9dqtFntUd+OdRmVN5VKY2tHJzq36VsrATPaPW36NNTW1ph27klgy+WWAdjd3WPugfpTo+0zZ0w3Uzd1cg9sdpKAxqT6b9y0qbxoIn/X1ddh6tTJpt9UJ5Vb6RVYUlu2dXWZOHwGy6+p0YJUO2loaBgbN26iEeD1NADaSmlXkpTKXMpZOKIQi/3ZQXkcHBg5WyZfT1tIkhe1VQpsTy75q/tgwEEAbJUhAbzrrruwefPmUSukrTpOE/E1r7eSpD01CLJ06RI88cSTBrASpgsvvBANDfVld5NliY94SEEI0IsXLx6dhqgbousEMm3f+c53mhuma3RM7+g+8MfFmDCxHRdffBHzFKhk9JKAj9tuu93w01clTj7x+JFalUntkRCKp1bJ1GMd/dYjkgsuuMDw1m8l28+a7PCzX/zKbFU31SEWi5qpkSpvwYIjceIJx5uvioiskFseeoHhjjvuMGWKpIjUZ+rDsUrkhReW4eGHHiFuymUrj3i47E/1X9uEVl6zJ2BrgkYeQxT8O353J+rrBMCpeP6F51knBxecfz77TV/JKN8D216lShIfkbph06aNuOeee01+O3rNK+AVcuaFDD26sv1l26+2SXneeeddo8rg9DNOx1FHld/6sveia1sXfsd6Svmovcbr4lZJ5WiwLRwK4+JLLkIsGjNG4aEHHzEyUCjyfHik3xm2qFw9vtN8c3svd0d/EaPie0N65njllVfiQx/6kHlP9rTTThs5s5N0Q6Tdly59ztwYPZsUKB64/wHjMhdG3CZ1ugCsyQuPPPKIAYBuiATl8ssvN88hL7vsMpx++unGcr+EKChBrffNmxkiH8mVeIYoBLoFirfHkhU+WXzNZhJQrWJ54YUXRs+PR5IRTcL44Ac/YBSNkqzvEirSBx98yLTVkhUqKS7N1ZbQChDqGy2bq+e44wndunXrzVZAvuiid+H973+f6Y+jjj4KsfjI6PoeSHnisQi9ln5kMlnU1zfg0HnzEI/XIJfNIUVPSp2nflN9lF/1HEuqn7wrl4pk08bN5h5qMooWVvjwhz+Et7/jQjMlVZbY5CUftVt8lcw9f+ABKpghc/8i0Qieo0xIBpRXSX02gZ7c5e+9DFd+9COmb6dNnWbOHXnEkUbOPviBD+Dd77nUjKrLcpuyVH9WTvfuXeynKz5wBa644grzfrY8NZUvHvuaDlpgazKE5gFror/ekx1v0Tgd0w3VRHx18hvfeJoRKLnH69dvMDG4yHa8JmYIWHI53/zmN5vJDNLSAr3cXE18sPOBK0lX6y2exx97Co89/iQee+xJsz84UJ6yON59leBJsDQ1UXm05rUmR+i4lIsAN55AKK8ESq5wKBQ0gtrS0oozzzzDWG+59FJQ4iMSD10jD0Sejqy1VhNREh9N0hivnKkjq4HIEt1/3wPsmxeMUjjuuGMI0DoU6JnsiVQHrdI6ZcpkJOIJoyxuuWWRuQfHHXc8Jk9qZxnlsQWRwG3rPZbcoOpSRAtDGllLfTpH9/axPz1uPDO1R7PBBFDxUF0tLylKhSD6rXfDGxsaMTQ8RC9pHY/Rqsv1Ztlqb9zMOtv52EskEKtvdb3kwcbR2op0PEvFtfzF5aY/tUbasmXlddvFd3/QQQtsTTKQBRK4BcjKReotdW3bbtwr3TBpeFm1BOMq3ag1q9eYrciCRdZTN8xOlLDWwwqIhGa8GyUhkCA9x3o8/fQzePzxJww4BaayNX+pxRbJUkuR6HqtlyUvQfVQfXTOlltJUjI6LveU2YxwyfUXDwm2FJ6dTiledqt1utRniqn1RpIUnUhttq8vVpIsq+ZXywoOJ4fNKqJaU+yxPz1B5VCk1ds5ffTlSFY26GqSiUKGeBkI7A8psZNPPt6Mfdx37/1mgX/Vza4/NpbUCmFfLvchh8zGwmMWmnuhOdsvLn8Rd/z2DqPgpbTUP7qHdqt8art+S2FLycyYWZ5Bp/Ank8khpFd3ydvcc3ZqKEQFw3p7BY9hTdSAWV1prDRz2m/H2636VwOlq1avMm2RPGoWmsrXvbL3YV/SfgW2Kl5JIcbJ5WU7S4h4tChMekpScnPIRHOI5AQKdngoi5KjmVmMrXNBkzQ3OsvrzPNfPcsdh2wHqVxN2zvllFOMBtZbQ5WxlUg3aRlvejbPcqmFJxLUjhtEQ1OTsbBdO7ZjcKgc3+s6gUkWWjdC16osgcXctBE3UcIhQbHXWMqzjAQ1+qmnnISz3nwGzj7rTLztrecwXp5AftTsjP/EU9fYsiTE0uoCocCj9sj6SqkoZNDcZpVVWY6uK9GCFhj7BV1alaBDwQsZ66meSRGAsiziYcsSCTSy5GqHBufEX+VpK0UgK1NZP6UogXv4EYfhkosvxgnHH0/FOI0WKIPlK16k0K5gvcuDirsjxaBr123GXXf/AX0D/Wijq5vOpLGBIcBTzzyHJc89jxdXLDd51QdycdXHY0mPElU/NTISCeOYhUfTDX87vao3YfLkSZSjovHa7Bc5VH/dRwFd3pmdH97c0sQ+9ejhNLEcl+e6ack7zDlexWvK7rWUptZxl0eUZJ/q/o7G+SaVQwZtNXipQTTxU8x+4oknmLDg6KOPNgpBvA84YFeSKq/53gK21gNzi7QsRZf7TGHGOXG6O57mTfHGBUsoOgSxbpQXMUmTQfJOEQXz/vRLq13u/LL1lIBLEOQa65My2mpQzOaR9ZSrtrljC0GtwaU0bl20CD++4QYziJKhi5TnTX9xxQqTXwIvvnLnFLsrz5/+9CcDPpUll0oegX1nuPJG6XyYAhCPRxiLzcdh8+ZiwZGHY8GCwxGRJSX4KCqGf1loym6cBlwUy4sErp/97GdmJUwJofJpK0FVfv3WNUZIKExhuYkyh/ydJWgF9CXPPoM0Q48JbW0mbLBlaat502qT9tesWWPK+uUvf2kAr3rpmBSJHVTTdbrmscceYz/lMP/ww3DWWW+mtW8z4N6wQXn3DOxkKoNnljyDXpY977B5eMc7L8ThvFfb6ck88eQTWM1y580rhyCW7D2spPL9UR+UPZmVq1ayv2O8bi7OOedsY4VVZ3k/IvHQbykJucUW5OvWrTWfDdJgpeqvtjz//HMjTwnKfWXL4a5JQbMKbhnOArG2Oq5HZiLlL1LZ6pr58w+jDB1u5Ehz3q2C3R/0mgG7TBQM9oPWC8yHHGTYeEY6VLkEc8k1c5wdWWT+DjCTMeDsdCV1qksAUA3w4Es7Q+eV1FG60bpxYzvN/lY+uWYlalXFxG845WScdtqpxrofe+yxxmopz0oKr30nV9ZRFluDcHpEIVdKK1PqVUClW265xbijAoMt29ZJikTJ1k+kPOJrrb+S3Zfrq7hP+1JIKlNaXlt5IVJasuQCl+plrBVJ+cVTikaK59Zbb8U999xj6id+crPVRgmUrlM/SUEojtcxrf2ld59VjtxsfYvLxpJyH8XfkmJ8hTlaGF/fw1LSMVl5udL2ut1RLBqh19JuXFuNZr+4bLmxfuEwPSGez+ey9DjKg47qN9un45HtT4HwvvvuM/WSIpSS0ssiap+eVojUbpHGFGyoo3e15dlpAFRbGQOVpTy6XrztvdPW3jslla28Ntl6VsqBFIdWdLn99tvNYoc333yzUZiW576m/fp2l22USO+8Pk3BL2oOJg81NbTgio9/HE9vT2J936CZxlif8RAr0fUs9WNeKIe3z2oxSx8J+/pkjvx2l8B3xZOasJJUlpJAIZdVzyz16MR2sL2Z2tegmZbE0fPqBUcuwDzGry3NTeZZryzanDmHIENrHKc1r6urNeCy7RBvWRDFY3JXxde+VSQgKE7XTVd+1Ucg075AJcGyfHROFl8Cp2sV/1oSQKRQ5B0IbPI6tC/FosddqoOEUeVICcml0774qW3KJ/CrbipP/MVDwit3VseVVAd5BVI6estISqMcZ04x5dln8sorfmqnvVb7ivlVF5Wv+is2Fw/bB0q7I8Wkuk9TJrFf+G9waNA8Oz766AU4ZPZs08ZksjxSLf7ipzrbPrRkj+neqv5qr66VkpF3ovkLarv6X2217ry8EPW/xld0Xu21/ay8Up5S/Cq38r7asnSPVDfdE9VPfFUXS8onHrpO7dRWedSX2qrPVZZ4jW3TWHpdvd1lK6zGfvazn8UN1/0Aw9EsgnTF50w7HA89tQT/uXQ7bt20A9lwAomk3juiJgz24ZSGAP7rbccgMTK4atb0phvvFtk5MvtjpixKI6os3TgJr37bG6HyJYzWIuq4SFZLv3VOpHy6TjdbfLRVHrVDN0J5lZRHgiN+9lrti6+9sdrXMf3WtbYskbbiqWu1b/Ppt45bstfqmK2zLdMes1trgS1fbZV0vfhU1lt5ddy2sbKeIptPZPNaUj4lXWP7QMIrEInEU0DfGyIbk9Q0RQ5S+OoiebSmq0Z+2/Iq61FJUmYqv7J/RWp/5THV09bN9ontz8p26pzI9qXyiHR8vDrovHjZe659m3SNlLuuU9Jvey9t/ZT2RK+rCSqquEgVVwzqJYvIhz2UvGEkIgnU1bdiRyCCbezHItsWY/Yst8yBNlrnQ6jRtSKpSGG1Xit0fAFbTM3hKlXpL4JeVxNUKrWRXKQJE1sxua0d0+jqNTfVI0zwTqGLfTyNw0lMRwVzOJbAPzlSwNwQo28/zRoS2ExaLUS20Se7lxkUfxUkxbOnVKX9RjKMe5Oq9IppvwG70s2Q+2HcG2NqC/AIUi9I9zEoqLIKZslf+twBulslupQFglkmPBjmaV6kFGBsRzMtFlVjXaUq7Z72G7BtHCFAW4AX6VYHaKH1VDXLopNMWuHDBFkEr+fGmV/vNCte07pfjHUJZSW9l6xVPgN+jlfveVbTXpGUzZ5Slap0ANJ+A7YlC2olDUQEEEEcjK8RQwOtcFhGW+M0NM7aBLRIoXZ4XBGF5i8puZrNoHWB9MmPsun/84nl7zFVaf+RlPrepCq9YtrvwK5Slar02lMV2FWq0kFIVWBXqUoHIVWBXaUqHYRUBXaVqnQQkpl5NrJfpSpV6XVMr2hKqW9mjlSpSlU6eAj4//+oh6P8jwIbAAAAAElFTkSuQmCC";

class SafeRenderBoundary878108 extends React.Component{
  constructor(props){super(props);this.state={hasError:false,msg:""}}
  static getDerivedStateFromError(error){return {hasError:true,msg:String(error?.message||error||"Error de pantalla")}}
  componentDidCatch(error,info){console.error("Error controlat a pantalla",error,info)}
  render(){
    if(this.state.hasError){return <Card title="Mode segur"><div className="module-note-v8738"><b>He evitat que aquesta pantalla bloquegi tota l'app.</b><span>{this.state.msg}</span></div><button className="primary" onClick={()=>this.setState({hasError:false,msg:""})}>Reintentar</button></Card>}
    return this.props.children;
  }
}

const months=["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"];
const years=Array.from({length:11},(_,i)=>2023+i);
const CP_MUNICIPIS8773=[
  {cp:"17230",poblacio:"Palamós"},{cp:"17251",poblacio:"Calonge"},{cp:"17252",poblacio:"Sant Antoni de Calonge"},{cp:"17256",poblacio:"Pals"},{cp:"17255",poblacio:"Begur"},{cp:"17220",poblacio:"Sant Feliu de Guíxols"},{cp:"17248",poblacio:"S'Agaró"},{cp:"17250",poblacio:"Platja d'Aro"},{cp:"17246",poblacio:"Santa Cristina d'Aro"},{cp:"17100",poblacio:"La Bisbal d'Empordà"},{cp:"17130",poblacio:"L'Escala"},{cp:"17140",poblacio:"Ullà"},{cp:"17137",poblacio:"Garrigoles"},{cp:"17001",poblacio:"Girona"},{cp:"17002",poblacio:"Girona"},{cp:"17003",poblacio:"Girona"},{cp:"17004",poblacio:"Girona"},{cp:"17005",poblacio:"Girona"},{cp:"17006",poblacio:"Girona"},{cp:"17007",poblacio:"Girona"},{cp:"08001",poblacio:"Barcelona"},{cp:"08002",poblacio:"Barcelona"},{cp:"08003",poblacio:"Barcelona"},{cp:"08004",poblacio:"Barcelona"},{cp:"08005",poblacio:"Barcelona"},{cp:"08006",poblacio:"Barcelona"},{cp:"08007",poblacio:"Barcelona"},{cp:"08008",poblacio:"Barcelona"},{cp:"08009",poblacio:"Barcelona"},{cp:"08010",poblacio:"Barcelona"}
];
function normCity8773(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/['’]/g,"").trim()}
function cpRows8775(){
  let custom=[];
  try{custom=JSON.parse(localStorage.getItem(lsKey8779("aco_cp_custom8775"))||"[]")}catch(e){custom=[]}
  const rows=[...CP_MUNICIPIS8773,...custom].filter(x=>x&&x.cp&&x.poblacio);
  return rows.filter((x,i,a)=>a.findIndex(y=>y.cp===x.cp&&normCity8773(y.poblacio)===normCity8773(x.poblacio))===i);
}
function learnCpPoblacio8775(cp,poblacio){
  cp=String(cp||"").trim(); poblacio=String(poblacio||"").trim();
  if(!cp||!poblacio||poblacio==="Pendent")return;
  const exists=cpRows8775().some(x=>x.cp===cp&&normCity8773(x.poblacio)===normCity8773(poblacio));
  if(exists)return;
  let custom=[];try{custom=JSON.parse(localStorage.getItem(lsKey8779("aco_cp_custom8775"))||"[]")}catch(e){}
  custom=[{cp,poblacio},...custom].slice(0,300);
  localStorage.setItem(lsKey8779("aco_cp_custom8775"),JSON.stringify(custom));
}
function cpForPoblacio8773(v){const n=normCity8773(v);return (cpRows8775().find(x=>normCity8773(x.poblacio)===n)||{}).cp||""}
function poblacioForCp8773(v){const s=String(v||"").trim();return (cpRows8775().find(x=>x.cp===s)||{}).poblacio||""}
function provinciaForCp8773(v){const cp=String(v||"").trim();if(cp.startsWith("17"))return "Girona";if(cp.startsWith("08"))return "Barcelona";if(cp.startsWith("25"))return "Lleida";if(cp.startsWith("43"))return "Tarragona";return ""}
function provinciaForPoblacio8773(v){return provinciaForCp8773(cpForPoblacio8773(v))}
function displayPoblacioProvincia8799(pob,cp){const pr=provinciaForCp8773(cp)||provinciaForPoblacio8773(pob);return `${pob||""}${pr?` (${pr})`:""}`}
function DatalistCP8773(){const rows=cpRows8775();return <><datalist id="cp-list-v8773">{rows.map(x=><option key={x.cp+x.poblacio} value={x.cp}>{displayPoblacioProvincia8799(x.poblacio,x.cp)}</option>)}</datalist><datalist id="poblacio-list-v8773">{rows.map(x=><option key={x.poblacio+x.cp} value={x.poblacio}>{x.cp} {provinciaForCp8773(x.cp)?`· ${provinciaForCp8773(x.cp)}`:""}</option>)}</datalist></>}

const clients0=[
{id:"socoterm",nom:"SOCOTERM",rao:"VERTICAL TREK ESPAÑA SL",tipus:"Industrial",contacte:"Guillaume Kwiatek",nif:"B09716945",email:"info@socoterm.com",telefon:"972 XXX XXX",adreca:"Vall-llobrega",color:"blue",logo:SOCOTERM_LOGO},
{id:"brava",nom:"BRAVA CONSTRUCCIONS",rao:"BRAVA CONSTRUCCIONS CALONGE 2018, S.L.",tipus:"Constructora",contacte:"Administració",nif:"Pendent",email:"pendent@brava.cat",telefon:"972 XXX XXX",adreca:"Calonge",color:"red",logo:""},
{id:"oriol",nom:"ORIOL BORRÀS",rao:"Client particular",tipus:"Particular",contacte:"Oriol",nif:"Pendent",email:"pendent",telefon:"pendent",adreca:"Baix Empordà",color:"green",logo:""}
];
const obres0=[
{id:"maricel",client:"socoterm",any:"2026",nom:"CP EDIFICI MARICEL",subtitol:"Rehabilitació façana fase 2",tipologia:"Project Manager",estat:"Activa",pressupost:73693.37,certificacio:11338.17,propietat:"CP Edifici Maricel",nifPropietat:"E17117706",adreca:"CP Edificio Mar i Cel",poblacio:"Girona",rc:"Pendent",imatge:"",properaCert:"12/05",properaVisita:"Div. 10:30"},
{id:"aubi",client:"socoterm",any:"2026",nom:"CP Aubi 5",subtitol:"Rehabilitació façana",tipologia:"Project Manager / Direcció d’obra",estat:"Pressupostada",pressupost:0,certificacio:0,propietat:"CP Aubi 5",nifPropietat:"Pendent",adreca:"Pendent",poblacio:"Pendent",rc:"Pendent",imatge:"",properaCert:"Pendent",properaVisita:"Pendent"},
{id:"verbania",client:"brava",any:"2026",nom:"Verbania",subtitol:"Reforma interior",tipologia:"Pressupost",estat:"Acceptada",pressupost:0,certificacio:0,propietat:"Particular",nifPropietat:"Pendent",adreca:"Carrer Verbania",poblacio:"S’Agaró",rc:"Pendent",imatge:"",properaCert:"-",properaVisita:"-"}
];
const partidesMaricel=[
{codi:"02.01",cap:"02 MITJANS AUXILIARS",concepte:"BASTIDA",ut:"m²",q:519.75,pu:16.50,certAnterior:103.95,certActual:0,tipus:"Base"},
{codi:"03.01",cap:"03 TREBALLS PREVIS",concepte:"NETEJAR I SANEJAT",ut:"m²",q:756.40,pu:2.60,certAnterior:212.32,certActual:0,tipus:"Base"},
{codi:"03.02",cap:"03 TREBALLS PREVIS",concepte:"REPARACIÓ ESQUERDES",ut:"m²",q:12.00,pu:56.74,certAnterior:12.00,certActual:0,tipus:"Base"},
{codi:"04.01",cap:"04 REMAT MURETS TERRASSES I BALCONS",concepte:"INTERVENCIÓ MURET PERIMETRAL",ut:"m²",q:369.41,pu:84.52,certAnterior:21.80,certActual:0,tipus:"Base"},
{codi:"05.01",cap:"05 FAÇANES",concepte:"PINTURA A FAÇANES",ut:"m²",q:105.80,pu:17.20,certAnterior:50.60,certActual:0,tipus:"Base"},
{codi:"05.02",cap:"05 FAÇANES",concepte:"ANTIFISSURES A FAÇANES",ut:"h",q:297.21,pu:65.80,certAnterior:86.28,certActual:0,tipus:"Base"},
{codi:"10.01",cap:"10 FEINES FORA PRESSUPOST",concepte:"REPICAT REVESTIMENTS MAL ADHERITS",ut:"m²",q:25.80,pu:25.70,certAnterior:0,certActual:25.80,tipus:"Fora pressupost"}
];
const defaultAgent8748={id:"agent-hector-default",nom:"Héctor Cubero",rol:"Arquitecte tècnic",empresa:"Despatx tècnic",email:"hector@despatx.cat",telefon:""};
function ensureAgents8748(list=[]){let arr=[...(list||[])];if(!arr.some(a=>String(a.id)==="agent-hector-default"||String(a.nom||"").toLowerCase().includes("héctor")||String(a.nom||"").toLowerCase().includes("hector")))arr=[defaultAgent8748,...arr];return arr}
function fmtAppDate8748(v){if(!v)return "—";let s=String(v).trim();let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);if(m)return `${m[3].padStart(2,"0")}/${m[2].padStart(2,"0")}/${m[1]}`;m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/);if(m)return `${m[1].padStart(2,"0")}/${m[2].padStart(2,"0")}/20${m[3]}`;return s}

function parseDate8776(v){
  if(!v)return null;
  if(v instanceof Date&&!isNaN(v))return v;
  const s=String(v).trim();
  let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if(m){let y=+m[3]; if(y<100)y+=2000; return new Date(y,+m[2]-1,+m[1]);}
  const d=new Date(s); return isNaN(d)?null:d;
}
function isoDate8776(d){if(!d)return"";return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function daysBetween8776(a,b){const da=parseDate8776(a),db=parseDate8776(b||new Date());if(!da||!db)return 0;return Math.floor((db-da)/86400000)}
function addDays8776(v,n){const d=parseDate8776(v)||new Date();d.setDate(d.getDate()+n);return d}
function inCurrentMonth8776(v){const d=parseDate8776(v);const n=new Date();return !!d&&d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()}
function inCurrentYear8776(v){const d=parseDate8776(v);const n=new Date();return !!d&&d.getFullYear()===n.getFullYear()}
function inThisWeek8776(v){const d=parseDate8776(v);if(!d)return false;const n=new Date();const start=new Date(n);start.setDate(n.getDate()-((n.getDay()+6)%7));start.setHours(0,0,0,0);const end=new Date(start);end.setDate(start.getDate()+7);return d>=start&&d<end}
function periodFilter8776(row,period,from,to){const d=parseDate8776(row.data||row.limit);if(!period||period==="all")return true;if(period==="week")return inThisWeek8776(d);if(period==="month")return inCurrentMonth8776(d);if(period==="year")return inCurrentYear8776(d);if(period==="dates"){const a=from?parseDate8776(from):null,b=to?parseDate8776(to):null;if(a&&d<a)return false;if(b&&d>b)return false;return true}return true}
function statusKeyPress8776(estat){const e=String(estat||"Pendent").toLowerCase();if(e.includes("no")||e.includes("descart")||e.includes("rebutj"))return"no acceptats";if(e.includes("accept"))return"acceptats";if(e.includes("facturat")||e.includes("tancat"))return"acceptats";if(e.includes("fet")||e.includes("enviat")||e.includes("emès")||e.includes("emes"))return"fets";return"pendents"}
function statusKeyFactura8776(estat){const e=String(estat||"Pendent").toLowerCase();if(e.includes("no cob")||e.includes("pendent")||e.includes("impagat")||e.includes("venç")||e.includes("venc"))return"no cobrades";if(e.includes("cobrat")||e.includes("cobrada"))return"cobrades";return"fetes"}
function invoiceAlerts8776(obres=[],odata={}){
  const today=new Date();today.setHours(23,59,59,999);
  return obres.flatMap(o=>uniqueFactures8743(((odata[o.id]||empty()).facturesTecnic||[])).filter(f=>statusKeyFactura8776(f.estat)!=="cobrades"&&daysBetween8776(f.data,today)>7).map(f=>{const d=addDays8776(f.data,7);return {id:`av-fact-${o.id}-${f.id}`,auto:true,day:d.getDate(),month:d.getMonth(),year:d.getFullYear(),title:`Factura pendent de cobrament · ${f.numero||f.concepte||o.nom}`,client:o.propietat||"",obra:o.nom,obraId:o.id,tipus:"Avís",type:"Avís",hora:"09:00",adreca:o.adreca||"",detail:`Factura emesa el ${fmtAppDate8748(f.data)} pendent de cobrament des de fa més d'una setmana. Import: ${money(totalIva8743(f))}`,note:`Factura pendent de cobrament · ${money(totalIva8743(f))}`,color:"orange"}}));
}
function invoiceAlertsForExpedient8776(data={},obra={},client={}){
  return uniqueFactures8743(data.facturesTecnic||[]).filter(f=>statusKeyFactura8776(f.estat)!=="cobrades"&&daysBetween8776(f.data,new Date())>7).map(f=>{const d=addDays8776(f.data,7);return {id:`av-fact-${obra.id||"obra"}-${f.id}`,auto:true,day:d.getDate(),month:d.getMonth(),year:d.getFullYear(),title:`Factura pendent de cobrament`,client:client?.nom||obra.propietat||"",obra:obra.nom||"",obraId:obra.id,tipus:"Avís",type:"Avís",hora:"09:00",adreca:obra.adreca||"",detail:`Factura emesa el ${fmtAppDate8748(f.data)} pendent de cobrament. Import: ${money(totalIva8743(f))}`,note:`Factura pendent: ${money(totalIva8743(f))}`,color:"orange"}})
}
function aggregate8776(rows,keyFn,valueFn){const map={};rows.forEach(r=>{const k=keyFn(r)||"Sense classificar";map[k]=(map[k]||0)+(valueFn?valueFn(r):1)});return Object.entries(map).map(([k,v])=>({k,v,label:k,value:v})).sort((a,b)=>b.v-a.v)}
function donutStyle8776(parts,colors=["#2563eb","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4"]){const total=parts.reduce((s,p)=>s+(+p.v||0),0);if(!total)return{background:"#e5e7eb"};let acc=0;return{background:`conic-gradient(${parts.map((p,i)=>{const start=acc,deg=(p.v/total)*360;acc+=deg;return `${colors[i%colors.length]} ${start}deg ${acc}deg`}).join(",")})`}}
function Donut8776({title,parts,total,kind="money"}){const palette={"acceptats":"#22c55e","cobrades":"#22c55e","pendents":"#f59e0b","no cobrades":"#f59e0b","no acceptats":"#ef4444","fets":"#2563eb","fetes":"#2563eb","facturat":"#22c55e","no facturat":"#f59e0b"};const fallback=["#2563eb","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];const colors=(parts||[]).map((p,i)=>palette[String(p.k||"").toLowerCase()]||fallback[i%fallback.length]);return <div className="dash-donut-card-v8776"><h3>{title}</h3><div className="dash-donut-v8776" style={donutStyle8776(parts,colors)}><span>{kind==="count"?total:money(total)}</span></div><div className="dash-donut-legend-v8776">{(parts||[]).map((p,i)=><div key={p.k}><i style={{background:colors[i%colors.length]}}></i><b>{p.k}</b><span>{kind==="count"?p.v:money(p.v)}</span></div>)}</div></div>}
function countBy87109(rows,fn){return rows.reduce((a,r)=>{const k=fn(r);a[k]=(a[k]||0)+1;return a},{})}
function FinanceStatusCards87109({items=[]}){return <div className="finance-status-cards-v87109">{items.map(it=><div key={it.label} className={`finance-status-card-v87109 ${it.kind||""}`}><span>{it.label}</span><b>{it.count}</b>{it.amount!=null&&<em>{money(it.amount)}</em>}</div>)}</div>}

function FilterBar8776({children}){return <div className="filter-panel-v8776">{children}</div>}

const empty=()=>({agents:[defaultAgent8748],partides:[],pressupostos:[],pressupostosTecnic:[],certificacions:[],actes:[],factures:[],facturesTecnic:[],events:[],hores:[]});
const data0={maricel:{
agents:[{id:"a1",nom:"Héctor Cubero",rol:"Arquitecte tècnic",empresa:"Despatx tècnic",email:"hector@despatx.cat",telefon:""},{id:"a2",nom:"Guillaume Kwiatek",rol:"Contractista",empresa:"SOCOTERM",email:"info@socoterm.com",telefon:"972 XXX XXX"},{id:"a3",nom:"President comunitat",rol:"Propietat",empresa:"CP Edifici Maricel",email:"presidencia@comunitat.cat",telefon:""}],
partides:partidesMaricel,
pressupostos:[{id:"p1",versio:"v01",data:"10/05/2026",nom:"Pressupost inicial",estat:"Acceptat",import:73693.37},{id:"p2",versio:"v02",data:"18/06/2026",nom:"Pressupost amb feines fora pressupost",estat:"En revisió",import:74256.43}],
certificacions:[
{id:"c1",numero:"1",data:"12/05/26",estat:"Guardada",import:11338.17,rows:["02.01","03.01","03.02","04.01","05.01","05.02"]},
{id:"c2",numero:"2",data:"18/06/26",estat:"Guardada",import:663.06,rows:["10.01"]}
],
actes:[{id:"acta-1",data:"18/06/2026",titol:"Acta visita 01",obra:"CP EDIFICI MARICEL",agents:["a1","a2"],text:"Revisió inicial dels treballs i comprovació de criteris de certificació.",signatura:"Pendent"},{id:"acta-2",data:"25/06/2026",titol:"Acta visita 02",obra:"CP EDIFICI MARICEL",agents:["a1","a2","a3"],text:"Es revisa l’evolució dels treballs i es deixa constància de les partides pendents.",signatura:"Pendent"}],
factures:[{id:"f1",tipus:"Proforma",numero:"PF-001",data:"18/06/2026",estat:"Pendent DF",base:6888.17,iva:21,retencio:0}],
events:[{id:"e1",day:18,month:5,year:2026,title:"Certificació 1",type:"Certificació",hora:"10:30",note:"Revisar amidaments i proforma",color:"red"},{id:"e2",day:25,month:5,year:2026,title:"Acta visita 02",type:"Acta",hora:"09:30",note:"Visita de seguiment",color:"blue"}],
hores:[{id:"h1",data:"11/05/2026",etiqueta:"Pla de Seguretat",tasca:"cobrament cost pla projecte",inici:"09:00",final:"10:00",hores:1,preu:400},{id:"h2",data:"12/05/2026",etiqueta:"Certificació d'obra",tasca:"certificació 1",inici:"18:00",final:"22:00",hores:4,preu:50},{id:"h3",data:"12/05/2026",etiqueta:"Pressupost",tasca:"obertura centre de treball",inici:"20:00",final:"21:00",hores:1,preu:50}]
}};

function openGmailCompose(to, subject, body){
  const url="https://mail.google.com/mail/?view=cm&fs=1"
    +"&to="+encodeURIComponent(to||"")
    +"&su="+encodeURIComponent(subject||"")
    +"&body="+encodeURIComponent(body||"");
  window.open(url,"_blank");
}

function todayShort8713(){const d=new Date();return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;}

function groupPartidesCapitols8756(rows){
  const out=[];
  let current=null;
  (rows||[]).forEach(r=>{
    const cap=r.cap||"Sense capítol";
    if(!current||current.cap!==cap){
      current={cap,rows:[],total:0};
      out.push(current);
    }
    current.rows.push(r);
    current.total+=(+r.q||0)*(+r.pu||0);
  });
  return out;
}

function money(n){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0)+" €"}
function parseNum8770(v){const raw=String(v??"").trim().replace(/\s/g,"").replace(/€/g,""); const normalized=raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw; const n=Number(normalized); return Number.isFinite(n)?n:0}
function moneyInput8770(v){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(parseNum8770(v))}
function qty2(n){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0)}
function pct(n){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0)+"%"}
function group(arr,k){return arr.reduce((m,x)=>((m[x[k]]??=[]).push(x),m),{})}
function days(y,m){return new Date(y,m+1,0).getDate()}
function first(y,m){return (new Date(y,m,1).getDay()+6)%7}
function f2u(file,cb){if(!file)return;let r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}

function PlansModuls8736(){
  return <Card title="Pla i mòduls">
    <div className="plans-moduls-v8736">
      <div className="plan-current-v8736">
        <div><span>Pla actual</span><b>Free · Mòdul Tècnic</b><em>Mateix mòdul tècnic, limitat a 2 expedients. L’agenda queda inclosa des del primer dia.</em></div>
        <strong>2 expedients inclosos</strong>
      </div>
      <div className="plans-grid-v8736">
        <div className="module-card-v8736 active"><span>Mòdul 1</span><h3>Tècnic / Expedients professionals</h3><p>Per arquitectes tècnics, project managers i tècnics d’edificació.</p><ul><li>Clients, expedients i agenda</li><li>Actes, documents, fotos, notes i avisos</li><li>Gestió de temps, pressupostos i factures del tècnic al client</li></ul></div>
        <div className="module-card-v8736 locked"><span>Mòdul 2</span><h3>Control econòmic d’obra</h3><p>Per pressupost d’obra, certificacions i facturació d’obra.</p><ul><li>Pressupost d’obra</li><li>Certificacions d’obra</li><li>Comparativa pressupost / certificat</li></ul></div>
        <div className="module-card-v8736 locked"><span>Mòdul 3</span><h3>Control integral d’empresa</h3><p>Per constructores o despatxos que volen controlar costos i rendibilitat.</p><ul><li>Albarans, compres i proveïdors</li><li>Personal, hores i costos indirectes</li><li>Marge i resultat econòmic per expedient</li></ul></div>
      </div>
    </div>
  </Card>
}


const WORK_TYPES8737=[
  "Projecte / llicència d’obres",
  "Pressupost d’obra / amidaments",
  "Direcció / seguiment d’obra",
  "Gestió integral d’obra",
  "Certificat energètic",
  "Cèdula d’habitabilitat",
  "ITE / IEE / inspecció d’edifici",
  "Informe tècnic / patologies / peritatge",
  "Plànols / aixecament",
  "Render / 3D / visualització",
  "Seguretat i salut",
  "Tràmit municipal / llicència / comunicació",
  "Control econòmic d’obra",
  "Activitat / adequació de local",
  "Postobra / documentació final",
  "Altres"
];
function canonicalWorkType8740(v){
  const raw=String(v||"").trim();
  const n=codeClean8739(raw);
  if(!n)return "Altres";
  if(n.includes("PROJECT MANAGEMENT")||n.includes("PROJECT MANAGER")||n==="PM"||n.includes("GESTIO INTEGRAL"))return "Gestió integral d’obra";
  if(n.includes("CONTROL ECONOMIC")||n.includes("CERTIFICACIO D OBRA")||n.includes("CERTIFICACIO OBRA"))return "Control econòmic d’obra";
  if(n.includes("DIRECCIO")||n.includes("EXECUCIO D OBRA")||n.includes("SEGUIMENT D OBRA"))return "Direcció / seguiment d’obra";
  if(n.includes("CERTIFICAT ENERGETIC")||n==="CEE")return "Certificat energètic";
  if(n.includes("CEDULA")||n==="CED")return "Cèdula d’habitabilitat";
  if(n.includes("ITE")||n.includes("IEE")||n.includes("INSPECCIO"))return "ITE / IEE / inspecció d’edifici";
  if(n.includes("RENDER")||n.includes("VISUAL")||n.includes("3D")||n==="REND")return "Render / 3D / visualització";
  if(n.includes("SEGURETAT")||n.includes("SALUT")||n==="CSS"||n.includes("EBSS")||n.includes("ESS"))return "Seguretat i salut";
  if(n.includes("AIXECAMENT")||n.includes("PLANOL")||n.includes("DWG")||n==="AIX")return "Plànols / aixecament";
  if(n.includes("ACTIVITAT")||n.includes("LOCAL"))return "Activitat / adequació de local";
  if(n.includes("POSTOBRA")||n.includes("FINAL OBRA")||n.includes("LLIBRE EDIFICI")||n.includes("AS BUILT")||n.includes("ASBUILT"))return "Postobra / documentació final";
  if(n.includes("LLICENCIA")||n.includes("COMUNICACIO")||n.includes("LEGAL")||n.includes("TRAMIT")||n==="LLIC")return "Tràmit municipal / llicència / comunicació";
  if(n.includes("PRESSUPOST")||n.includes("AMIDAMENT"))return "Pressupost d’obra / amidaments";
  if(n.includes("INFORME")||n.includes("PATOLOG")||n.includes("PERIT")||n.includes("TAXACIO")||n.includes("VALORACIO")||n.includes("CONSULTA"))return "Informe tècnic / patologies / peritatge";
  if(n.includes("PROJECTE"))return "Projecte / llicència d’obres";
  return WORK_TYPES8737.includes(raw)?raw:"Altres";
}
function normalizeObraWork8740(o){
  const tipus=canonicalWorkType8740(o?.tipusTreball||o?.tipologia||o?.subtitol||"");
  return {...o,tipusTreball:tipus,tipologia:tipus};
}
function needsWorkNormalize8740(obres){return (obres||[]).some(o=>canonicalWorkType8740(o?.tipusTreball||o?.tipologia)!==(o?.tipusTreball||o?.tipologia));}

const TAB_TEMPLATES8769={
  "Projecte / llicència d’obres":["Resum","Dades","Documents","Agenda / Avisos","Actes","Tasques","Gestió temps","Tancament / Entrega"],
  "Pressupost d’obra / amidaments":["Resum","Dades","Documents","Agenda / Avisos","Gestió obra","Tasques","Gestió temps","Tancament / Entrega"],
  "Direcció / seguiment d’obra":["Resum","Dades","Documents","Agenda / Avisos","Actes","Gestió obra","Tasques","Gestió temps","Tancament / Entrega"],
  "Gestió integral d’obra":["Resum","Dades","Documents","Agenda / Avisos","Actes","Gestió obra","Tasques","Gestió temps","Tancament / Entrega"],
  "Certificat energètic":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Cèdula d’habitabilitat":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "ITE / IEE / inspecció d’edifici":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Informe tècnic / patologies / peritatge":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Plànols / aixecament":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Render / 3D / visualització":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Seguretat i salut":["Resum","Dades","Documents","Agenda / Avisos","Actes","Tasques","Gestió temps","Tancament / Entrega"],
  "Tràmit municipal / llicència / comunicació":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Control econòmic d’obra":["Resum","Dades","Documents","Agenda / Avisos","Gestió obra","Tasques","Gestió temps","Tancament / Entrega"],
  "Activitat / adequació de local":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Postobra / documentació final":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"],
  "Altres":["Resum","Dades","Documents","Agenda / Avisos","Tasques","Gestió temps","Tancament / Entrega"]
};
function uniqueTabs8769(arr){return [...new Set((arr||[]).filter(Boolean))]}
function tabsForWork8737(obra,data={}){
  const tipus=canonicalWorkType8740(obra?.tipusTreball||obra?.tipologia||"");
  let tabs=[...(TAB_TEMPLATES8769[tipus]||TAB_TEMPLATES8769["Altres"])];
  if((data?.actes||[]).length&&!tabs.includes("Actes")) tabs.splice(Math.min(5,tabs.length),0,"Actes");
  if(((data?.partides||[]).length||(data?.certificacions||[]).length||(data?.factures||[]).length)&&!tabs.includes("Gestió obra")) tabs.splice(Math.max(tabs.length-3,1),0,"Gestió obra");
  if(!tabs.includes("Agenda / Avisos")){const idx=Math.max(1,tabs.indexOf("Dades")+1);tabs.splice(idx,0,"Agenda / Avisos");}
  if(!tabs.includes("Honoraris")){const idx=Math.max(1,tabs.indexOf("Agenda / Avisos")+1);tabs.splice(idx,0,"Honoraris");}
  return uniqueTabs8769(tabs);
}
function totalIva8743(x){return (+x?.base||+x?.total||0)*(1+(+x?.iva||21)/100)}
function baseIva8743(x){return (+x?.base||+x?.total||0)}
function ivaAmount8743(x){return baseIva8743(x)*((+x?.iva||21)/100)}
function descompteAmount8746(d){return (+d?.base||0)*((+d?.descompte||0)/100)}
function invoiceNetBase8746(d){return Math.max((+d?.base||0)-descompteAmount8746(d),0)}
function invoiceIvaAmount8746(d){return invoiceNetBase8746(d)*((+d?.iva||0)/100)}
function invoiceRetencioAmount8746(d){return invoiceNetBase8746(d)*((+d?.retencio||0)/100)}
function invoiceTotal8746(d){return invoiceNetBase8746(d)+invoiceIvaAmount8746(d)-invoiceRetencioAmount8746(d)}
function pressupostFooter8746(d){const v=d?.validesa||"2 mesos";const taxes=d?.taxesIncloses==="incloses"?"Les taxes, visats o drets administratius necessaris s’inclouen en aquest pressupost, sempre que no s’indiqui el contrari.":"Les taxes, visats, drets administratius o imports d’organismes externs no estan inclosos, llevat que s’indiqui expressament.";return `IVA no inclòs. Pressupost vàlid durant ${v} des de la data d’emissió. ${taxes}`}
function todayISO8743(){return new Date().toISOString().slice(0,10)}
function toInputDate8743(v){
  if(!v)return todayISO8743();
  const s=String(v);
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m)return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
  return todayISO8743();
}
function saveTemplate8743(text){
  const clean=String(text||"").trim();
  if(!clean)return;
  try{let rows=JSON.parse(localStorage.getItem(lsKey8779("aco_press_templates"))||"[]");rows=[clean,...rows.filter(x=>x!==clean)].slice(0,8);localStorage.setItem(lsKey8779("aco_press_templates"),JSON.stringify(rows));}catch(e){}
}
function loadTemplates8743(){try{return JSON.parse(localStorage.getItem(lsKey8779("aco_press_templates"))||"[]")}catch(e){return []}}

function nextGlobalDocNumber8745(odata,type,year){
  const prefix=type==="factura"?"F":"P";
  const y=String(year||new Date().getFullYear());
  let max=0;
  Object.values(odata||{}).forEach(d=>{
    const rows=type==="factura"?(d.facturesTecnic||[]):(d.pressupostosTecnic||[]);
    rows.forEach(x=>{
      const m=String(x.numero||"").match(new RegExp("^"+prefix+y+"-(\\d{3})$"));
      if(m)max=Math.max(max,+m[1]||0);
    });
  });
  return `${prefix}${y}-${String(max+1).padStart(3,"0")}`;
}
function displayDocNumber8745(doc,type,obra,index=1){
  const prefix=type==="factura"?"F":"P";
  const y=String(obra?.any||new Date().getFullYear());
  const current=String(doc?.numero||"");
  if(current.match(new RegExp("^"+prefix+"\d{4}-\d{3}$")))return current;
  if(current && !/^PRE-|^FAC-/.test(current))return current;
  return `${prefix}${y}-${String(index||1).padStart(3,"0")}`;
}
function isMobilePrint878112(){
  if(typeof window==="undefined")return false;
  const ua=String(navigator?.userAgent||"");
  return (window.innerWidth||0)<=900 || /iPhone|iPad|iPod|Android/i.test(ua);
}
function printHtmlInPlace878112(html,title="Document"){
  try{
    const iframe=document.createElement("iframe");
    iframe.title=title;
    iframe.style.position="fixed";
    iframe.style.right="0";
    iframe.style.bottom="0";
    iframe.style.width="0";
    iframe.style.height="0";
    iframe.style.border="0";
    iframe.style.opacity="0";
    iframe.style.pointerEvents="none";
    document.body.appendChild(iframe);
    const doc=iframe.contentWindow?.document;
    if(!doc){iframe.remove();return false;}
    doc.open();doc.write(html);doc.close();
    const cleanup=()=>setTimeout(()=>{try{iframe.remove()}catch{}},1200);
    if(iframe.contentWindow)iframe.contentWindow.onafterprint=cleanup;
    setTimeout(()=>{try{iframe.contentWindow?.focus();iframe.contentWindow?.print();}catch(e){window.print()}setTimeout(cleanup,3500)},450);
    return true;
  }catch(e){
    console.warn("Impressió mòbil en iframe no disponible",e);
    return false;
  }
}
function printQuote8745(type,doc,obra){
  const isFactura=type==="factura", title=isFactura?"FACTURA / PROFORMA":"PRESSUPOST";
  const base=baseIva8743(doc), iva=isFactura?invoiceIvaAmount8746(doc):ivaAmount8743(doc), total=isFactura?invoiceTotal8746(doc):base;
  const desc=descompteAmount8746(doc), ret=invoiceRetencioAmount8746(doc);
  let cfg={};try{cfg=JSON.parse(lsGet8779("aco_config_v60")||"{}")}catch(e){}
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const totals=isFactura?`<div class="totals"><div><span>Base imposable</span><b>${esc(money(base))}</b></div>${desc?`<div><span>Descompte (${esc(doc.descompte)}%)</span><b>-${esc(money(desc))}</b></div>`:""}<div><span>IVA (${esc(doc.iva||21)}%)</span><b>${esc(money(iva))}</b></div>${ret?`<div><span>Retenció (${esc(doc.retencio)}%)</span><b>-${esc(money(ret))}</b></div>`:""}<div class="total"><span>Total</span><b>${esc(money(total))}</b></div></div>`:`<div class="notes"><b>Observacions</b><p>${esc(doc.observacions||pressupostFooter8746(doc))}</p></div>`;
  const foot=isFactura?`<div class="foot">${esc(doc.observacions||doc.compteBancari||cfg.compteBancari||"Forma de pagament i número de compte pendent d’indicar.")}</div>`:`<div class="foot">Document provisional pendent d’adaptar a dades fiscals definitives del tècnic/despatx.</div>`;
  const rightHead=isFactura?"Import":"Import sense IVA";
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} ${esc(doc.numero||"")}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:12px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #111827;padding-bottom:10px;margin-bottom:14px}h1{margin:0;font-size:24px}.parties{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-bottom:12px}.box{border:1px solid #cbd5e1;border-radius:6px;padding:9px;min-height:30mm}.box h3{margin:0 0 6px;font-size:11px;color:#64748b;text-transform:uppercase}.box b,.box span{display:block;margin-top:3px}.exp{border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;padding:9px;margin-bottom:12px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #cbd5e1;padding:8px;vertical-align:top}th{background:#f1f5f9;text-align:left}.c1{width:78%}.c2{width:22%}.num{text-align:right;white-space:nowrap}p{white-space:pre-wrap;line-height:1.45;color:#334155}.totals{width:82mm;margin-left:auto;margin-top:16px}.totals div{display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:6px 0}.totals .total{border-top:2px solid #111827;border-bottom:0;font-size:18px;margin-top:5px;padding-top:10px}.notes{margin-top:18px;border-top:1px solid #e5e7eb;padding-top:10px}.foot{margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;color:#64748b;font-size:11px}</style></head><body><div class="top"><h1>${esc(title)}</h1><b>${esc(doc.numero||"—")}</b></div><div class="parties"><div class="box"><h3>Dades del tècnic</h3><b>${esc(cfg.empresa||"Héctor Cubero / Despatx tècnic")}</b><span>${esc(cfg.email||"Email pendent")}</span><span>NIF / Col·legiat: pendent</span></div><div class="box"><h3>Client</h3><b>${esc(obra?.propietat||"Client")}</b><span>NIF: ${esc(obra?.nifPropietat||"Pendent")}</span><span>${esc(obra?.adreca||"")}</span><span>${esc(obra?.poblacio||"")}</span></div></div><div class="exp"><b>Expedient</b><br>${esc(expedientCode8739(obra))} · ${esc(obra?.nom||"")}<br><small>Data: ${esc(doc.data||"—")}</small></div><table><colgroup><col class="c1"><col class="c2"></colgroup><thead><tr><th>Concepte</th><th>${rightHead}</th></tr></thead><tbody><tr><td><b>${esc(doc.concepte||"Honoraris tècnics")}</b><p>${esc(doc.text||"—")}</p></td><td class="num"><b>${esc(money(isFactura?base:total))}</b></td></tr></tbody></table>${totals}${foot}</body></html>`;
  if(isMobilePrint878112()){
    if(printHtmlInPlace878112(html,`${title} ${doc.numero||""}`))return;
  }
  const w=window.open("","_blank","width=900,height=1100");
  if(!w){alert("El navegador ha bloquejat la finestra d’impressió. Permet finestres emergents.");return}
  w.document.open();w.document.write(html+`<script>setTimeout(()=>{window.focus();window.print();},350)<\/script>`);w.document.close();w.focus();
}
function uniqueFactures8743(rows=[]){
  const seen=new Set();
  return rows.filter(f=>{let k=f.pressupostId?`p:${f.pressupostId}`:`id:${f.id}`;if(seen.has(k))return false;seen.add(k);return true;})
}


function moduleLabel8737(obra){return canonicalWorkType8740(obra?.tipusTreball||obra?.tipologia)||"Treball tècnic"}
function stripAccents8739(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function codeClean8739(s){return stripAccents8739(s).toUpperCase().replace(/[^A-Z0-9 ]+/g," ").replace(/\s+/g," ").trim()}
function workCode8739(t){
  t=canonicalWorkType8740(t);
  const n=codeClean8739(t);
  if(n.includes("CERTIFICACIO"))return "CERT";
  if(n.includes("FACTURA"))return "FAC";
  if(n.includes("PRESSUPOST"))return "PRES";
  if(n.includes("PROJECTE"))return "PROJ";
  if(n.includes("ENERGETIC"))return "CEE";
  if(n.includes("CEDULA"))return "CED";
  if(n.includes("ITE"))return "ITE";
  if(n.includes("INFORME"))return "INF";
  if(n.includes("EXECUCIO")||n==="DO"||n.includes("DIRECCIO"))return "DO";
  if(n.includes("COORDINACIO")||n.includes("SEGURETAT"))return "CSS";
  if(n.includes("AIXECAMENT"))return "AIX";
  if(n.includes("AMIDAMENT"))return "AIX";
  if(n.includes("RENDER")||n.includes("VISUAL"))return "REND";
  if(n.includes("LEGAL"))return "LEG";
  if(n.includes("LLICENCIA")||n.includes("COMUNICACIO"))return "LLIC";
  if(n.includes("TAXACIO")||n.includes("VALORACIO"))return "TAX";
  if(n.includes("PROJECT MANAGEMENT"))return "PM";
  if(n.includes("CONSULTA"))return "CONS";
  return "ALT";
}
function clientCode8739(client,nom){
  const raw=codeClean8739(client?.nom||nom||"CLIENT");
  const map={"SOCOTERM":"SOC","BRAVA CONSTRUCCIONS":"BRAVA","ORIOL BORRAS":"ORIOL","JOSE HORTAL":"JH","JOSÉ HORTAL":"JH","ALFONSO MORA":"MORA","RICARDO CONSTRUCTORA COPROCAT":"COPROCAT"};
  for(const k in map){if(raw.includes(k))return map[k]}
  const words=raw.split(" ").filter(w=>!["DE","DEL","LA","EL","SL","S","L","S L","CONSTRUCCIONS","CONSTRUCCIONES"].includes(w));
  if(words.length===1)return words[0].slice(0,8)||"CLI";
  return words.map(w=>w[0]).join("").slice(0,6)||"CLI";
}
function keywordCode8739(s){
  const stop=["DE","DEL","LA","EL","ELS","LES","L","D","I","A","AL","EN","PER","CARRER","CALLE","AVINGUDA","AV","PASSEIG","CP","COMUNITAT","EDIFICI","EDIFICIO"];
  const words=codeClean8739(s).split(" ").filter(w=>w&&!stop.includes(w));
  const joined=words.join("");
  return (joined||"TREBALL").slice(0,12);
}
function padExp8739(n){return String(n||1).padStart(3,"0")}
function nextExpNumber8739(year,all){
  const nums=(all||[]).filter(o=>String(o.any||"")===String(year)).map(o=>{
    if(o.numExpedient)return +o.numExpedient||0;
    const m=String(o.codiExpedient||o.codi||"").match(/^\d{4}-(\d{3})/);
    return m?+m[1]:0;
  });
  const max=Math.max(0,...nums);
  return max+1;
}
function buildExpedientCode8739({year,number,tipus,client,clientNom,keyword,nom,subtitol,poblacio}){
  const base=`${year}-${padExp8739(number)}`;
  const t=workCode8739(tipus);
  const c=clientCode8739(client,clientNom);
  const k=keywordCode8739(keyword||nom||subtitol||poblacio||"TREBALL");
  return {base,codi:`${base}-${t}-${c}-${k}`,codiTipus:t,codiClient:c,paraulaClau:k,numExpedient:+number};
}
function assignMissingCodes8739(obres,clients){
  const counters={};
  return (obres||[]).map(o=>{
    if(o.codiExpedient&&o.expedientBase)return o;
    const year=String(o.any||new Date().getFullYear());
    const existing=String(o.codiExpedient||o.codi||"").match(/^\d{4}-(\d{3})/);
    if(existing){
      const base=`${year}-${existing[1]}`;
      return {...o,expedientBase:o.expedientBase||base,codiExpedient:o.codiExpedient||o.codi,numExpedient:+existing[1]};
    }
    counters[year]=(counters[year]||0)+1;
    const client=(clients||[]).find(c=>c.id===o.client);
    const built=buildExpedientCode8739({year,number:counters[year],tipus:o.tipusTreball||o.tipologia,client,clientNom:o.propietat,keyword:o.paraulaClau,nom:o.nom,subtitol:o.subtitol,poblacio:o.poblacio});
    return {...o,...built,codiExpedient:built.codi};
  });
}
function expedientCode8739(o){return o?.codiExpedient||o?.codi||o?.expedientBase||"Sense codi"}


// V87.68 - recuperació base estable: creació d'expedients i actes formals
function uniqAgents8768(list=[]){
  const out=[]; const seen=new Set();
  for(const a of (list||[]).filter(Boolean)){
    const id=a.id || (String(a.nom||"")+String(a.email||"")+String(a.empresa||""));
    const key=String(id||"").toLowerCase();
    if(!key||seen.has(key))continue;
    seen.add(key); out.push({...a,id:a.id||("ag-"+out.length)});
  }
  return out;
}
function safeSlug8768(v,prefix="id"){
  return String(v||prefix).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60)||prefix;
}
function nextActaNumber8768(actes=[]){
  const nums=(actes||[]).map(a=>+String(a.numero||a.num||"").replace(/[^0-9]/g,"")||0);
  return Math.max(0,...nums)+1;
}
function normalizeActa8768(acta={},agents=[]){
  const knownIds=new Set((agents||[]).map(a=>a.id));
  const legacyAgents=Array.isArray(acta.agents)?acta.agents:[];
  const legacyIds=legacyAgents.map(a=>typeof a==="string"?a:a?.id).filter(Boolean);
  const agentIds=[...(acta.agentIds||[]),...legacyIds].filter(Boolean);
  return {
    ...acta,
    numero:acta.numero||acta.num||"",
    data:acta.data||todayISO8743(),
    titol:acta.titol||acta.title||"Acta de visita d’obra",
    text:acta.text||acta.observacions||"",
    agentIds:[...new Set(agentIds.filter(id=>!knownIds.size||knownIds.has(id)))],
    fotoIds:acta.fotoIds||[],
    docs:acta.docs||[],
    croquis:acta.croquis||[],
    estat:acta.estat||"Esborrany"
  };
}
function baseAgentsForObra8768(obra={},client={}){
  const promotor=obra.propietat||client.nom||"Promotor pendent";
  const constructor=obra.constructor||obra.empresaConstructora||client.rao||client.nom||"Constructor pendent";
  return [
    {id:"agent-hector-default",nom:"Héctor Cubero",rol:"Arquitecte tècnic / DEO",empresa:"Despatx tècnic",email:"hector@despatx.cat",telefon:""},
    {id:"agent-promotor-default",nom:promotor,rol:"Promotor / propietat",empresa:promotor,email:"",telefon:""},
    {id:"agent-constructor-default",nom:constructor,rol:"Constructor / contractista",empresa:constructor,email:"",telefon:""}
  ];
}
function emptyExpedientData8768(obra={},client={}){
  return {
    ...empty(),
    agents:ensureAgents8748(baseAgentsForObra8768(obra,client)),
    fotos:[],
    notes:[],
    documents:[],
    pressupostos:[],
    pressupostosTecnic:[],
    certificacions:[],
    actes:[],
    factures:[],
    facturesTecnic:[],
    events:[],
    hores:[],
    tasques:[],
    sectionDocs:{},
    sectionNotes:{}
  };
}


function SafeFormExpedient8751({clients,onSubmit}){
  const [mode,setMode]=useState('__new__');
  const [tipus,setTipus]=useState('Projecte / llicència d’obres');
  const [cp,setCp]=useState('');
  const [poblacio,setPoblacio]=useState('');
  const types=(typeof WORK_TYPES8737!=='undefined'?WORK_TYPES8737:['Projecte tècnic','Project management','Informe tècnic','Certificat energètic','Cèdula d’habitabilitat','Pressupost tècnic-client','Altres']);
  function changeCp(v){setCp(v);const pob=poblacioForCp8773(v);if(pob)setPoblacio(pob)}
  function changePoblacio(v){setPoblacio(v);const c=cpForPoblacio8773(v);if(c)setCp(c)}
  return <form onSubmit={onSubmit} className="safe-form-exp-v8751"><DatalistCP8773/><datalist id="agents-base-v8773"><option>Héctor Cubero</option><option>Arquitecte tècnic pendent</option><option>Arquitecte pendent</option><option>Constructor pendent</option><option>Coordinador S+S pendent</option></datalist><div className="form-grid">
    <label><span>Client *</span><select name="client" value={mode} onChange={e=>setMode(e.target.value)} required><option value="__new__">+ Crear client nou</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
    {mode==='__new__'&&<><label><span>Nom nou client *</span><input name="clientNouNom" required defaultValue="Nou client"/></label><label><span>Raó social</span><input name="clientNouRao" defaultValue="Pendent"/></label><input type="hidden" name="clientNouTipus" value="Particular"/><label><span>NIF/CIF</span><input name="clientNouNif" defaultValue="Pendent"/></label><label><span>Email</span><input name="clientNouEmail" defaultValue="Pendent"/></label><label><span>Telèfon</span><input name="clientNouTelefon" defaultValue="Pendent"/></label><label><span>Adreça client</span><input name="clientNouAdreca" defaultValue="Pendent"/></label></>}
    <label><span>Nom expedient *</span><input name="nom" required defaultValue="Nou expedient"/></label><label><span>Descripció breu</span><input name="subtitol" defaultValue="Treball pendent de definir"/></label><label><span>Any</span><input name="any" defaultValue={String(new Date().getFullYear())}/></label><label><span>Estat</span><select name="estat"><option>Pressupostada</option><option>Acceptada</option><option>Activa</option><option>En procés</option><option>Pendent</option><option>Tancada</option></select></label>
    <label className="span-all"><span>Tipus de treball *</span><select name="tipusTreball" value={tipus} onChange={e=>setTipus(e.target.value)} required>{types.map(t=><option key={t}>{t}</option>)}</select></label>{tipus==='Altres'&&<label><span>Altres</span><input name="tipusTreballAltres"/></label>}
    <label><span>Client final / propietat</span><input name="propietat" defaultValue="Pendent"/></label><label><span>NIF client final</span><input name="nifPropietat" defaultValue="Pendent"/></label><label><span>Constructor / contractista</span><input name="constructor" list="agents-base-v8773" defaultValue="Pendent"/></label><label><span>Direcció d’obra (DO)</span><input name="do" list="agents-base-v8773" defaultValue="Pendent"/></label><label><span>Direcció execució (DEO)</span><input name="deo" list="agents-base-v8773" defaultValue="Héctor Cubero"/></label><label><span>Coordinació S+S (CSS)</span><input name="css" list="agents-base-v8773" defaultValue="Pendent"/></label><label><span>Adreça expedient *</span><input name="adreca" required defaultValue="Pendent"/></label><label><span>Codi postal</span><input name="codiPostal" list="cp-list-v8773" value={cp} onChange={e=>changeCp(e.target.value)} placeholder="17230"/></label><label><span>Població *</span><input name="poblacio" list="poblacio-list-v8773" required value={poblacio} onChange={e=>changePoblacio(e.target.value)} placeholder="Palamós"/></label><label><span>Referència cadastral</span><input name="rc" defaultValue="Pendent"/></label><label><span>Paraula clau codi</span><input name="paraulaClau" placeholder="FRONTMAR, PALAMOS..."/></label>
  </div><div className="modal-actions"><button className="primary">Crear expedient</button></div></form>
}

function SafeActes8751({obra,data,setData,openEmail,openDoc}){
  const baseAgent={id:'ag-hector',nom:'Héctor Cubero',rol:'Tècnic',empresa:'Despatx tècnic',email:'pendent'};
  const actes=data.actes||[];
  const [selected,setSelected]=useState(actes[0]?.id||null);
  const active=actes.find(a=>a.id===selected)||actes[0]||null;
  function add(){const a={id:'acta-'+Date.now(),titol:'Nova acta d’expedient',data:new Date().toISOString().slice(0,10),text:'',agents:[baseAgent],estat:'Esborrany'};setData(d=>({...d,actes:[...(d.actes||[]),a]}));setSelected(a.id)}
  function upd(id,k,v){setData(d=>({...d,actes:(d.actes||[]).map(a=>a.id===id?{...a,[k]:v}:a)}))}
  function del(id){if(confirm('Eliminar aquesta acta?')){setData(d=>({...d,actes:(d.actes||[]).filter(a=>a.id!==id)}));setSelected(null)}}
  return <div className="safe-actes-v8751"><Card title="Actes" action={<button type="button" className="primary" onClick={add}>+ Nova acta</button>}><div className="safe-actes-layout-v8751"><div className="safe-actes-list-v8751">{actes.length===0&&<div className="empty-v8751">Encara no hi ha actes. Clica “Nova acta”.</div>}{actes.map(a=><button type="button" key={a.id} onClick={()=>setSelected(a.id)} className={active?.id===a.id?'active':''}><b>{a.titol||'Acta'}</b><span>{a.data||'Sense data'}</span></button>)}</div><div className="safe-acta-editor-v8751">{!active?<p>Selecciona o crea una acta.</p>:<><div className="form-grid"><label><span>Títol</span><input value={active.titol||''} onChange={e=>upd(active.id,'titol',e.target.value)}/></label><label><span>Data</span><input type="date" value={active.data||''} onChange={e=>upd(active.id,'data',e.target.value)}/></label><label className="span-all"><span>Agents / assistents</span><div className="agent-chip-v8751">{(active.agents&&active.agents.length?active.agents:[baseAgent]).map((ag,i)=><span key={i}>{ag.nom||ag}</span>)}</div></label><label className="span-all"><span>Text acta</span><textarea value={active.text||''} onChange={e=>upd(active.id,'text',e.target.value)} placeholder="Text de l’acta..."/></label></div><div className="actions-inline"><button type="button" className="secondary" onClick={()=>openDoc?.({type:'acta',title:active.titol,subtitle:active.data,acta:active})}>Previsualitzar</button><button type="button" className="secondary" onClick={()=>openEmail?.(active.titol||'Acta')}>Enviar</button><button type="button" className="danger" onClick={()=>del(active.id)}>Eliminar</button></div><div className="acta-a4-v8751"><h3>ACTA DE VISITA / SEGUIMENT</h3><b>{active.titol}</b><p><b>Expedient:</b> {obra?.nom}</p><p><b>Data:</b> {active.data}</p><p>{active.text||'Text pendent...'}</p></div></>}</div></div></Card></div>
}
function SafeTemps8751({data,setData}){
  const rows=data.temps||data.hours||[];
  function add(){const r={id:'tm-'+Date.now(),data:new Date().toISOString().slice(0,10),feina:'Treball tècnic',hores:0,facturat:false,entregat:false,cobrat:false,observacions:''};setData(d=>({...d,temps:[...(d.temps||d.hours||[]),r]}))}
  function upd(id,k,v){setData(d=>({...d,temps:(d.temps||d.hours||[]).map(r=>r.id===id?{...r,[k]:v}:r)}))}
  function del(id){setData(d=>({...d,temps:(d.temps||d.hours||[]).filter(r=>r.id!==id)}))}
  const total=rows.reduce((s,r)=>s+(+r.hores||0),0);
  return <Card title="Gestió del temps" action={<button type="button" className="primary" onClick={add}>+ Afegir registre</button>}><div className="safe-temps-v8751"><div className="time-total-v8751">Total expedient: <b>{total.toFixed(2)} h</b></div><div className="table-scroll-v8751"><table><thead><tr><th>Data</th><th>Feina</th><th>Hores</th><th>Facturat</th><th>Entregat</th><th>Cobrat</th><th>Observacions</th><th></th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan="8">Encara no hi ha registres.</td></tr>}{rows.map(r=><tr key={r.id}><td><input type="date" value={r.data||''} onChange={e=>upd(r.id,'data',e.target.value)}/></td><td><input value={r.feina||''} onChange={e=>upd(r.id,'feina',e.target.value)}/></td><td><input type="number" step="0.25" value={r.hores||0} onChange={e=>upd(r.id,'hores',e.target.value)}/></td><td><input type="checkbox" checked={!!r.facturat} onChange={e=>upd(r.id,'facturat',e.target.checked)}/></td><td><input type="checkbox" checked={!!r.entregat} onChange={e=>upd(r.id,'entregat',e.target.checked)}/></td><td><input type="checkbox" checked={!!r.cobrat} onChange={e=>upd(r.id,'cobrat',e.target.checked)}/></td><td><input value={r.observacions||''} onChange={e=>upd(r.id,'observacions',e.target.value)}/></td><td><button type="button" className="danger" onClick={()=>del(r.id)}>Eliminar</button></td></tr>)}</tbody></table></div></div></Card>
}


function fmtDate8761(v){
  if(!v)return "—";
  const s=String(v).trim();
  const m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if(m)return `${String(m[3]).padStart(2,"0")}/${String(m[2]).padStart(2,"0")}/${m[1]}`;
  const m2=s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if(m2)return `${String(m2[1]).padStart(2,"0")}/${String(m2[2]).padStart(2,"0")}/${m2[3]}`;
  return s;
}
function todayISO8761(){return new Date().toISOString().slice(0,10)}
function resizeImageDataUrl8779(file,maxSide=1600,quality=0.82){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        try{
          const ratio=Math.min(1,maxSide/Math.max(img.width,img.height));
          const w=Math.max(1,Math.round(img.width*ratio)),h=Math.max(1,Math.round(img.height*ratio));
          const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
          const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL("image/jpeg",quality));
        }catch(e){resolve(reader.result)}
      };
      img.onerror=()=>resolve(reader.result);
      img.src=reader.result;
    };
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
}
async function addPhotoFiles8761(files,setData){
  const list=[...(files||[])];
  for(const file of list){
    try{
      const src=await resizeImageDataUrl8779(file);
      setData(d=>({...d,fotos:[...(d.fotos||[]),{
        id:"foto-"+Date.now()+"-"+Math.random().toString(16).slice(2),
        nom:file.name||"Foto",
        src,
        data:todayISO8761()
      }]}));
    }catch(e){alert("No s'ha pogut inserir la foto. Prova amb una imatge més petita.")}
  }
}

function PlanolsCroquisActa8769({draft,setDraft}){
  const canvasRef=useRef(null);
  const drawingRef=useRef(false);
  const lastRef=useRef(null);
  const pdfRef=useRef(null);
  const [meta,setMeta]=useState({nom:"Full en blanc",tipus:"blank",pagina:1,pagines:1});
  const [color,setColor]=useState("#dc2626");
  const [size,setSize]=useState(4);
  const [loading,setLoading]=useState(false);
  const [hist,setHist]=useState([]);
  useEffect(()=>{newBlank()},[]);
  function ctx(){return canvasRef.current?.getContext("2d")}
  function setCanvasSize(w,h){const c=canvasRef.current;if(!c)return;c.width=w;c.height=h;c.style.width="100%";c.style.maxHeight="70vh";}
  function snapshot(){const c=canvasRef.current;if(!c)return;try{setHist(h=>[...h.slice(-8),c.toDataURL("image/png")])}catch(e){}}
  function restore(src){const c=canvasRef.current,context=ctx();if(!c||!context)return;const img=new Image();img.onload=()=>{context.clearRect(0,0,c.width,c.height);context.drawImage(img,0,0,c.width,c.height)};img.src=src;}
  function undo(){setHist(h=>{const last=h[h.length-1];if(last)restore(last);return h.slice(0,-1)})}
  function clearDraw(){if(meta.tipus==="pdf"&&pdfRef.current)renderPdfPage(meta.pagina);else if(meta.tipus==="image"&&meta.src)renderImage(meta.src,meta.nom);else newBlank(false)}
  function newBlank(reset=true){setCanvasSize(1100,780);const c=canvasRef.current,context=ctx();if(!c||!context)return;context.fillStyle="#fff";context.fillRect(0,0,c.width,c.height);context.strokeStyle="#d1d5db";context.lineWidth=1;for(let x=55;x<c.width;x+=55){context.beginPath();context.moveTo(x,0);context.lineTo(x,c.height);context.stroke()}for(let y=55;y<c.height;y+=55){context.beginPath();context.moveTo(0,y);context.lineTo(c.width,y);context.stroke()}if(reset)setMeta({nom:"Full en blanc",tipus:"blank",pagina:1,pagines:1})}
  async function loadFile(file){if(!file)return;setLoading(true);try{if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")){const buf=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;pdfRef.current=pdf;setMeta({nom:file.name,tipus:"pdf",pagina:1,pagines:pdf.numPages});await renderPdfPage(1,pdf,file.name)}else{const reader=new FileReader();reader.onload=()=>renderImage(reader.result,file.name);reader.readAsDataURL(file)}}catch(err){alert("No s'ha pogut carregar el plànol. Pots provar exportant la pàgina del PDF com a imatge PNG/JPG.")}finally{setLoading(false)}}
  async function renderPdfPage(pageNo,pdf=pdfRef.current,nom=meta.nom){if(!pdf)return;setLoading(true);try{const page=await pdf.getPage(pageNo);const viewport=page.getViewport({scale:1.45});setCanvasSize(viewport.width,viewport.height);const c=canvasRef.current,context=ctx();context.fillStyle="#fff";context.fillRect(0,0,c.width,c.height);await page.render({canvasContext:context,viewport}).promise;setMeta(m=>({...m,nom,tipus:"pdf",pagina:pageNo,pagines:pdf.numPages}))}finally{setLoading(false)}}
  function renderImage(src,nom="Imatge"){const img=new Image();img.onload=()=>{const maxW=1200;const ratio=Math.min(maxW/img.width,1);const w=Math.round(img.width*ratio),h=Math.round(img.height*ratio);setCanvasSize(w,h);const context=ctx();context.fillStyle="#fff";context.fillRect(0,0,w,h);context.drawImage(img,0,0,w,h);setMeta({nom,tipus:"image",src,pagina:1,pagines:1})};img.src=src}
  function pos(e){const c=canvasRef.current;const r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height)}}
  function down(e){e.preventDefault();snapshot();drawingRef.current=true;const p=pos(e);lastRef.current=p;const context=ctx();context.beginPath();context.moveTo(p.x,p.y)}
  function move(e){if(!drawingRef.current)return;e.preventDefault();const p=pos(e),context=ctx();context.lineCap="round";context.lineJoin="round";context.strokeStyle=color;context.lineWidth=+size||4;context.lineTo(p.x,p.y);context.stroke();lastRef.current=p}
  function up(){drawingRef.current=false;lastRef.current=null}
  function saveCroquis(){const c=canvasRef.current;if(!c)return;const src=c.toDataURL("image/png");const item={id:"croquis-"+Date.now(),nom:`Croquis / plànol marcat ${String((draft?.croquis||[]).length+1).padStart(2,"0")}`,src,origen:meta.nom,pagina:meta.pagina,data:todayISO8761()};setDraft(d=>({...d,croquis:[...(d.croquis||[]),item]}));}
  function removeCroquis(id){setDraft(d=>({...d,croquis:(d.croquis||[]).filter(x=>x.id!==id)}))}
  return <div className="plan-acta-box-v8769">
    <div className="section-head-v8764"><div><b>Plànols marcats i croquis per inserir a l’acta</b><span>Pots carregar un PDF de plànol o una imatge, dibuixar-hi a sobre amb llapis/color, guardar el resultat i sortirà a l’acta formal. També pots començar amb un full en blanc per fer un croquis nou.</span></div></div>
    <div className="plan-toolbar-v8769">
      <label className="secondary file-btn-v8761">Carregar PDF / imatge<input type="file" accept="application/pdf,image/*" onChange={e=>loadFile(e.target.files?.[0])}/></label>
      <button type="button" className="secondary" onClick={()=>newBlank()}>Full en blanc</button>
      {meta.tipus==="pdf"&&<><button type="button" className="secondary" disabled={meta.pagina<=1} onClick={()=>renderPdfPage(meta.pagina-1)}>Pàgina anterior</button><button type="button" className="secondary" disabled={meta.pagina>=meta.pagines} onClick={()=>renderPdfPage(meta.pagina+1)}>Pàgina següent</button></>}
      <label><span>Color</span><input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>
      <label><span>Gruix</span><input type="range" min="1" max="18" value={size} onChange={e=>setSize(e.target.value)}/></label>
      <button type="button" className="secondary" onClick={()=>{setColor("#ffffff");setSize(18)}}>Goma</button>
      <button type="button" className="secondary" onClick={undo}>Desfer</button>
      <button type="button" className="secondary" onClick={clearDraw}>Netejar marques</button>
      <button type="button" className="primary" onClick={saveCroquis}>Guardar i inserir a l’acta</button>
    </div>
    <div className="plan-status-v8769">{loading?"Carregant plànol...":`${meta.nom} · pàgina ${meta.pagina}/${meta.pagines}`}</div>
    <div className="canvas-wrap-v8769"><canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}/></div>
    <div className="croquis-list-v8769">
      {(draft?.croquis||[]).length===0&&<span>Encara no hi ha plànols marcats o croquis guardats en aquesta acta.</span>}
      {(draft?.croquis||[]).map(c=><div key={c.id} className="croquis-card-v8769"><img src={c.src}/><div><b>{c.nom}</b><span>{fmtDate8761(c.data)} · {c.origen||"Full en blanc"}</span></div><button type="button" className="danger small" onClick={()=>removeCroquis(c.id)}>Eliminar</button></div>)}
    </div>
  </div>
}

function Fotografies8761({data,setData}){
  const fotos=data.fotos||[];
  return <Card title="Fotografies" action={<div className="actions-inline"><label className="secondary file-btn-v8761">Adjuntar fotos<input type="file" accept="image/*" multiple onChange={e=>addPhotoFiles8761(e.target.files,setData)}/></label><label className="primary file-btn-v8761">Fer foto<input type="file" accept="image/*" capture="environment" onChange={e=>addPhotoFiles8761(e.target.files,setData)}/></label></div>}>
    <div className="photo-grid-v8761">
      {fotos.length===0&&<div className="empty-v8761">Encara no hi ha fotografies adjuntades.</div>}
      {fotos.map(f=><div className="photo-card-v8761" key={f.id}><img src={f.src}/><div><b>{f.nom}</b><span>{fmtDate8761(f.data)}</span></div></div>)}
    </div>
  </Card>
}

function addActaDocFiles8764(files,setDraft){
  [...(files||[])].forEach(file=>{
    const reader=new FileReader();
    reader.onload=()=>setDraft(d=>({...d,docs:[...(d.docs||[]),{
      id:"doc-acta-"+Date.now()+"-"+Math.random().toString(16).slice(2),
      nom:file.name||"Document",
      type:file.type||"",
      url:reader.result,
      data:todayISO8761()
    }]}));
    reader.readAsDataURL(file);
  });
}

function Actes8761({obra,client,data,setData,openEmail,openDoc,allAgents=[]}){
  const actesRaw=data.actes||[];
  const fotos=data.fotos||[];
  const defaultAgents8768=baseAgentsForObra8768(obra,client);
  const legacyActaAgents=(actesRaw||[]).flatMap(a=>(a.agents||[]).filter(x=>typeof x==="object"));
  const [globalAgents87102,setGlobalAgents87102]=useState(()=>{try{return JSON.parse(localStorage.getItem(lsKey8779("aco_global_agents_v87102"))||"[]")}catch{return []}});
  const [deletedAgentIds87102,setDeletedAgentIds87102]=useState(()=>{try{return JSON.parse(localStorage.getItem(lsKey8779("aco_deleted_agents_v87102"))||"[]")}catch{return []}});
  const agents=ensureAgents8748(uniqAgents8768([...defaultAgents8768,...(data.agents||[]),...legacyActaAgents,...globalAgents87102,...(allAgents||[])]).filter(a=>!deletedAgentIds87102.includes(a.id)));
  const actes=actesRaw.map(a=>normalizeActa8768(a,agents));

  const [editId,setEditId]=useState(null);
  const [draft,setDraft]=useState(null);
  const [showActaPreview8763,setShowActaPreview8763]=useState(false);
  const [agentForm8764,setAgentForm8764]=useState({nom:"",rol:"",empresa:"",email:"",telefon:""});
  const [agentSearch87102,setAgentSearch87102]=useState("");
  const [showNewAgent87102,setShowNewAgent87102]=useState(false);
  const [showManageAgents87103,setShowManageAgents87103]=useState(false);
  const [actaPanel8799,setActaPanel8799]=useState("Observacions");
  useEffect(()=>{try{localStorage.setItem(lsKey8779("aco_global_agents_v87102"),JSON.stringify(globalAgents87102))}catch{}},[globalAgents87102]);
  useEffect(()=>{try{localStorage.setItem(lsKey8779("aco_deleted_agents_v87102"),JSON.stringify(deletedAgentIds87102))}catch{}},[deletedAgentIds87102]);

  function ensureAgents(){
    if(!(data.agents&&data.agents.length)){
      setData(d=>({...d,agents}));
    }
  }

  function addAgent8764(){
    const nom=String(agentForm8764.nom||"").trim();
    if(!nom){alert("Cal indicar el nom de l’agent.");return}
    const ag={id:"ag-"+Date.now(),...agentForm8764,nom};
    setGlobalAgents87102(p=>uniqAgents8768([ag,...p]));
    setData(d=>({...d,agents:uniqAgents8768([ag,...agents])}));
    setAgentForm8764({nom:"",rol:"",empresa:"",email:"",telefon:""});
    setShowNewAgent87102(false);
  }

  function updateAgent8764(id,k,v){
    const changed=(agents.find(a=>a.id===id)||{id});
    const next={...changed,[k]:v};
    setGlobalAgents87102(p=>uniqAgents8768([next,...p.filter(a=>a.id!==id)]));
    setData(d=>({...d,agents:uniqAgents8768([next,...agents.filter(a=>a.id!==id)])}));
  }

  function deleteAgent8764(id){
    if(!confirm("Eliminar aquest agent de la biblioteca? No s'incorporarà a noves actes."))return;
    setDeletedAgentIds87102(p=>[...new Set([...(p||[]),id])]);
    setGlobalAgents87102(p=>(p||[]).filter(a=>a.id!==id));
    setData(d=>({
      ...d,
      agents:(d.agents||[]).filter(a=>a.id!==id),
      actes:(d.actes||[]).map(a=>({...normalizeActa8768(a,agents),agentIds:(normalizeActa8768(a,agents).agentIds||[]).filter(x=>x!==id)}))
    }));
    setDraft(dr=>dr?{...dr,agentIds:(dr.agentIds||[]).filter(x=>x!==id)}:dr);
  }

  function addActa(){
    ensureAgents();
    const numero=nextActaNumber8768(actes);
    const baseSelected=[];
    const a={
      id:"acta-"+Date.now(),
      numero:String(numero).padStart(2,"0"),
      titol:`Acta de visita d'obra ${String(numero).padStart(2,"0")}`,
      data:todayISO8761(),
      text:"",
      fotoIds:[],
      agentIds:baseSelected,
      docs:[],
      croquis:[],
      estat:"Esborrany",
      promotor:obra?.propietat||client?.nom||"Pendent",
      constructor:obra?.constructor||obra?.empresaConstructora||client?.rao||"Pendent",
      do:obra?.do||obra?.direccioObra||"Pendent",
      deo:obra?.deo||obra?.direccioExecucio||"Héctor Cubero",
      css:obra?.css||obra?.coordinacioSS||"Pendent"
    };
    setData(d=>({...d,agents:agents,actes:[...(d.actes||[]),a]}));
    setEditId(a.id);
    setDraft(a);
    setShowActaPreview8763(false);
  }

  function startEdit(a){
    ensureAgents();
    const na={
      ...normalizeActa8768(a,agents),
      promotor:a.promotor||obra?.propietat||client?.nom||"Pendent",
      constructor:a.constructor||obra?.constructor||obra?.empresaConstructora||client?.rao||"Pendent",
      do:a.do||obra?.do||obra?.direccioObra||"Pendent",
      deo:a.deo||obra?.deo||obra?.direccioExecucio||"Héctor Cubero",
      css:a.css||obra?.css||obra?.coordinacioSS||"Pendent"
    };
    setEditId(na.id);
    setDraft(JSON.parse(JSON.stringify(na)));
    setShowActaPreview8763(false);
  }

  function save(){
    if(!draft?.titol||!draft?.data){alert("Cal indicar títol i data de l’acta.");return}
    const normalized=normalizeActa8768(draft,agents);
    setData(d=>({...d,agents,actes:(d.actes||[]).map(a=>a.id===draft.id?normalized:a)}));
    setEditId(null);
    setDraft(null);
    setShowActaPreview8763(false);
  }

  function del(id){
    if(!confirm("Eliminar aquesta acta?"))return;
    setData(d=>({...d,actes:(d.actes||[]).filter(a=>a.id!==id)}));
    if(editId===id){setEditId(null);setDraft(null);setShowActaPreview8763(false)}
  }

  function upd(k,v){setDraft(d=>({...d,[k]:v}))}

  function toggleFoto(id){
    setDraft(d=>{
      const arr=d.fotoIds||[];
      return {...d,fotoIds:arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]};
    });
  }

  function toggleAgent(id){
    setDraft(d=>{
      const arr=d.agentIds||[];
      return {...d,agentIds:arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]};
    });
  }
  function addAgentToDraft8799(id){
    if(!id)return;
    setDraft(d=>{const arr=d.agentIds||[];return {...d,agentIds:arr.includes(id)?arr:[...arr,id]}});
  }

  function removeDoc8764(id){
    setDraft(d=>({...d,docs:(d.docs||[]).filter(x=>x.id!==id)}));
  }

  const selectedAgents=(draft?.agentIds||[]).map(id=>agents.find(a=>a.id===id)).filter(Boolean);
  const selectedFotos=(draft?.fotoIds||[]).map(id=>fotos.find(f=>f.id===id)).filter(Boolean);
  const printableDoc=draft?{type:"acta",title:`Acta ${draft.numero||""} · ${obra?.nom||"Expedient"}`,subtitle:draft.data,acta:normalizeActa8768(draft,agents),agents,actaPhotos:selectedFotos,actaDocs:draft.docs||[],actaCroquis:draft.croquis||[]}:null;

  return <Card title="Actes" action={<button className="primary" type="button" onClick={addActa}>+ Nova acta</button>}>
    <div className="actes-layout-v8761">
      <div className="actes-list-v8761">
        {actes.length===0&&<div className="empty-v8761">Encara no hi ha actes.</div>}
        {actes.map(a=><div className={editId===a.id?"acta-list-row-v8761 active":"acta-list-row-v8761"} key={a.id}>
          <button type="button" onClick={()=>startEdit(a)}><b>Acta {a.numero||"—"}</b><span>{a.titol||"Acta"}</span><small>{fmtDate8761(a.data)} · {(a.agentIds||[]).length} agents · {(a.fotoIds||[]).length} fotos · {(a.docs||[]).length} docs · {(a.croquis||[]).length} croquis</small></button>
          <button type="button" className="danger small" onClick={()=>del(a.id)}>Eliminar</button>
        </div>)}
      </div>

      <div className="acta-editor-v8761">
        {!draft&&<div className="empty-v8761">Selecciona una acta per editar-la o crea’n una de nova.</div>}

        {draft&&<>
          <div className="acta-panel-tabs-v8799">{["Dades","Agents","Observacions","Fotos","Documents","Plànols"].map(p=><button type="button" key={p} className={actaPanel8799===p?"active":""} onClick={()=>setActaPanel8799(p)}>{p}</button>)}</div>
          {actaPanel8799==="Dades"&&<div className="form-grid">
            <label><span>Número acta *</span><input value={draft.numero||""} onChange={e=>upd("numero",e.target.value)}/></label>
            <label><span>Títol acta *</span><input value={draft.titol||""} onChange={e=>upd("titol",e.target.value)}/></label>
            <label><span>Data *</span><input type="date" value={draft.data||""} onChange={e=>upd("data",e.target.value)}/></label>
            <label><span>Estat</span><select value={draft.estat||"Esborrany"} onChange={e=>upd("estat",e.target.value)}><option>Esborrany</option><option>Enviada</option><option>Signada</option><option>Tancada</option></select></label>
            <label><span>Promotor</span><input value={draft.promotor||""} onChange={e=>upd("promotor",e.target.value)}/></label>
            <label><span>Constructor</span><input value={draft.constructor||""} onChange={e=>upd("constructor",e.target.value)}/></label>
            <label><span>Direcció d’obra (DO)</span><input value={draft.do||""} onChange={e=>upd("do",e.target.value)}/></label>
            <label><span>Direcció execució (DEO)</span><input value={draft.deo||""} onChange={e=>upd("deo",e.target.value)}/></label>
            <label><span>Coordinació S+S (CSS)</span><input value={draft.css||""} onChange={e=>upd("css",e.target.value)}/></label>
          </div>}

          {actaPanel8799==="Agents"&&<div className="agents-box-v8764 agents-box-v87102 agents-box-v87103">
            <div className="section-head-v8764 section-head-v87103"><div><b>Biblioteca global d’agents</b><span>Cerca per nom, empresa, rol, email o telèfon. Només s’afegeixen a l’acta els agents que selecciones.</span></div><div className="actions-inline"><button type="button" className="secondary" onClick={()=>setShowManageAgents87103(v=>!v)}>{showManageAgents87103?"Amagar gestió":"Gestionar biblioteca"}</button><button type="button" className="secondary" onClick={()=>setShowNewAgent87102(v=>!v)}>{showNewAgent87102?"Tancar alta":"+ Crear agent nou"}</button></div></div>
            <div className="agent-search-panel-v87103">
              <input className="agent-main-search-v87103" value={agentSearch87102} onChange={e=>setAgentSearch87102(e.target.value)} placeholder="Escriu per cercar agent: nom, empresa, rol o email..."/>
              <div className="agent-smart-results-v87103">
                {agents.filter(a=>`${a.nom||""} ${a.rol||""} ${a.empresa||""} ${a.email||""} ${a.telefon||""}`.toLowerCase().includes(agentSearch87102.toLowerCase())).slice(0,8).map(a=><button type="button" key={a.id} className={(draft.agentIds||[]).includes(a.id)?"selected":""} onClick={()=>toggleAgent(a.id)}><b>{a.nom}</b><span>{a.rol||"Rol pendent"} · {a.empresa||"Empresa/autònom pendent"}</span>{a.email&&<small>{a.email}</small>}</button>)}
                {agents.length===0&&<span className="muted">Encara no hi ha agents a la biblioteca.</span>}
              </div>
            </div>
            {showNewAgent87102&&<div className="new-agent-box-v87102 new-agent-box-v87103"><h4>Crear agent nou</h4><div className="agent-form-v8764"><input list="agent-names-v87102" placeholder="Nom agent" value={agentForm8764.nom} onChange={e=>{const val=e.target.value;const found=agents.find(a=>String(a.nom||"").toLowerCase()===val.toLowerCase());setAgentForm8764(p=>found?{...p,nom:val,rol:found.rol||p.rol,empresa:found.empresa||p.empresa,email:found.email||p.email,telefon:found.telefon||p.telefon}:{...p,nom:val})}}/><datalist id="agent-names-v87102">{agents.map(a=><option key={a.id} value={a.nom}/>)}</datalist><input list="agent-rols-v87102" placeholder="Rol / funció" value={agentForm8764.rol} onChange={e=>setAgentForm8764(p=>({...p,rol:e.target.value}))}/><datalist id="agent-rols-v87102">{[...new Set(agents.map(a=>a.rol).filter(Boolean))].map(x=><option key={x} value={x}/>)}</datalist><input list="agent-companies-v87102" placeholder="Empresa / autònom" value={agentForm8764.empresa} onChange={e=>{const val=e.target.value;const found=agents.find(a=>String(a.empresa||"").toLowerCase()===val.toLowerCase());setAgentForm8764(p=>found?{...p,empresa:val,email:p.email||found.email||"",telefon:p.telefon||found.telefon||""}:{...p,empresa:val})}}/><datalist id="agent-companies-v87102">{[...new Set(agents.map(a=>a.empresa).filter(Boolean))].map(x=><option key={x} value={x}/>)}</datalist><input placeholder="Email" value={agentForm8764.email} onChange={e=>setAgentForm8764(p=>({...p,email:e.target.value}))}/><input placeholder="Telèfon" value={agentForm8764.telefon||""} onChange={e=>setAgentForm8764(p=>({...p,telefon:e.target.value}))}/><button type="button" className="primary" onClick={addAgent8764}>Guardar agent</button></div></div>}
            <div className="selected-agent-chips-v8799 selected-agent-chips-v87102"><b>Assistents seleccionats:</b>{selectedAgents.length===0?<span className="muted">Cap agent seleccionat per aquesta acta.</span>:selectedAgents.map(a=><span key={a.id}>{a.nom}<button type="button" onClick={()=>toggleAgent(a.id)}>×</button></span>)}</div>
            {(()=>{const ids=[...new Set(actes.filter(a=>a.id!==draft.id).flatMap(a=>(normalizeActa8768(a,agents).agentIds||[])))];return ids.length>0&&<div className="prev-agents-v87102 prev-agents-v87103"><h4>Agents utilitzats en actes anteriors</h4><p className="muted">Marca només els que vulguis repetir en aquesta acta.</p><div className="check-grid">{ids.map(id=>{const a=agents.find(x=>x.id===id);return a?<label className="check-row" key={id}><input type="checkbox" checked={(draft.agentIds||[]).includes(id)} onChange={()=>toggleAgent(id)}/><span>{a.nom} · {a.rol||""} · {a.empresa||""}</span></label>:null})}</div></div>})()}
            {showManageAgents87103&&<div className="agent-library-edit-v87100 agent-library-edit-v87103"><h4>Gestionar biblioteca</h4><p>Edita o elimina agents. Aquest llistat només apareix quan obres “Gestionar biblioteca”.</p>{agents.filter(a=>`${a.nom||""} ${a.rol||""} ${a.empresa||""} ${a.email||""}`.toLowerCase().includes(agentSearch87102.toLowerCase())).map(ag=><div className="agent-library-row-v87100" key={ag.id}><input value={ag.nom||""} onChange={e=>updateAgent8764(ag.id,"nom",e.target.value)} placeholder="Nom"/><input value={ag.rol||""} onChange={e=>updateAgent8764(ag.id,"rol",e.target.value)} placeholder="Rol"/><input value={ag.empresa||""} onChange={e=>updateAgent8764(ag.id,"empresa",e.target.value)} placeholder="Empresa"/><input value={ag.email||""} onChange={e=>updateAgent8764(ag.id,"email",e.target.value)} placeholder="Email"/><button type="button" className="danger small" onClick={()=>deleteAgent8764(ag.id)}>Eliminar</button></div>)}</div>}
          </div>}

                    {actaPanel8799==="Observacions"&&<label className="span-all acta-textarea-v8768"><span>Text de l’acta</span><textarea value={draft.text||""} onChange={e=>upd("text",e.target.value)} placeholder="Redacta aquí les comprovacions, acords, ordres d’obra, incidències i tasques pendents..."/></label>}

          {actaPanel8799==="Fotos"&&<div className="photo-select-v8761">
            <div className="photo-select-head-v8761"><b>Fotos que sortiran a l’acta</b><label className="secondary file-btn-v8761">Adjuntar / fer foto<input type="file" accept="image/*" capture="environment" multiple onChange={e=>addPhotoFiles8761(e.target.files,setData)}/></label></div>
            <div className="photo-mini-grid-v8761">
              {fotos.length===0&&<span>No hi ha fotos a l’expedient.</span>}
              {fotos.map(f=><label key={f.id} className={(draft.fotoIds||[]).includes(f.id)?"selected":""}><input type="checkbox" checked={(draft.fotoIds||[]).includes(f.id)} onChange={()=>toggleFoto(f.id)}/><img src={f.src}/><span>{f.nom}</span></label>)}
            </div>
          </div>}

          {actaPanel8799==="Documents"&&<div className="docs-acta-box-v8764">
            <div className="section-head-v8764"><div><b>Documents adjunts a l’acta</b><span>Afegeix documents específics d’aquesta acta.</span></div><label className="secondary file-btn-v8761">Afegir documents<input type="file" multiple onChange={e=>addActaDocFiles8764(e.target.files,setDraft)}/></label></div>
            <div className="docs-acta-list-v8764">
              {(draft.docs||[]).length===0&&<span>No hi ha documents adjunts a aquesta acta.</span>}
              {(draft.docs||[]).map(d=><div className="doc-acta-row-v8764" key={d.id}><b>{d.nom}</b><span>{fmtDate8761(d.data)}</span><a className="secondary small" href={d.url} target="_blank" rel="noreferrer">Obrir</a><button type="button" className="danger small" onClick={()=>removeDoc8764(d.id)}>Eliminar</button></div>)}
            </div>
          </div>}

          {actaPanel8799==="Plànols"&&<PlanolsCroquisActa8769 draft={draft} setDraft={setDraft}/>}

          <div className="actions-inline">
            <button type="button" className="primary" onClick={save}>Guardar acta</button>
            <button type="button" className="secondary" onClick={()=>setShowActaPreview8763(v=>!v)}>{showActaPreview8763?"Amagar previsualització":"Previsualitzar acta"}</button>
            <button type="button" className="secondary" onClick={()=>printableDoc&&openDoc?.(printableDoc)}>Obrir acta formal / imprimir</button>
            <button type="button" className="secondary" onClick={()=>openEmail?.(draft.titol||"Acta")}>Enviar</button>
            <button type="button" className="secondary" onClick={()=>{setDraft(null);setEditId(null);setShowActaPreview8763(false)}}>Cancel·lar</button>
          </div>

          {showActaPreview8763&&<ActaFormalPreview8768 obra={obra} client={client} acta={draft} agents={selectedAgents} fotos={selectedFotos} docs={draft.docs||[]}/>}
        </>}
      </div>
    </div>
  </Card>
}

function ActaFormalPreview8768({obra,client,acta,agents=[],fotos=[],docs=[],croquis=[]}){
  return <div className="a4-acta-preview-v8761 acta-a4-v8766 acta-formal-v8768">
    <div className="acta-a4-header-v8766">
      <div><span>ACTA DE VISITA / SEGUIMENT D’OBRA</span><h2>Acta núm. {acta?.numero||"—"}</h2></div>
      <div className="acta-a4-date-v8766"><small>Data</small><b>{fmtDate8761(acta?.data)}</b><small>Estat</small><b>{acta?.estat||"Esborrany"}</b></div>
    </div>
    <div className="acta-a4-obra-v8766">
      <small>Expedient / obra</small>
      <h1>{obra?.nom||"Expedient"}</h1>
      <div className="acta-a4-meta-v8766">
        <span><b>Codi expedient:</b> {typeof expedientCode8739==="function"?expedientCode8739(obra):"—"}</span>
        <span><b>Tipus:</b> {obra?.tipusTreball||obra?.tipologia||"—"}</span>
        <span><b>Adreça:</b> {obra?.adreca||"—"}</span>
        <span><b>Població:</b> {obra?.poblacio||"—"}</span>
      </div>
    </div>
    <div className="acta-key-grid-v8768">
      <div><b>Promotor</b><span>{acta?.promotor||obra?.propietat||client?.nom||"—"}</span></div>
      <div><b>Constructor</b><span>{acta?.constructor||obra?.constructor||client?.rao||"—"}</span></div>
      <div><b>Direcció d’obra</b><span>{acta?.do||obra?.do||"—"}</span></div>
      <div><b>Direcció execució</b><span>{acta?.deo||obra?.deo||"—"}</span></div>
      <div><b>Coordinació S+S</b><span>{acta?.css||obra?.css||"—"}</span></div>
      <div><b>Tècnic / despatx</b><span>Héctor Cubero · Arquitecte tècnic</span></div>
    </div>
    <div className="preview-section-v8764 acta-a4-section-v8766">
      <h3>Agents intervinents / assistents</h3>
      {agents.length===0?<p>Sense agents seleccionats.</p>:<table><thead><tr><th>Nom</th><th>Rol</th><th>Empresa</th></tr></thead><tbody>{agents.map(a=><tr key={a.id}><td>{a.nom||"—"}</td><td>{a.rol||"—"}</td><td>{a.empresa||"—"}</td></tr>)}</tbody></table>}
    </div>
    <div className="preview-section-v8764 acta-a4-section-v8766">
      <h3>Contingut de l’acta</h3><p>{acta?.text||"Text pendent..."}</p>
    </div>
    <div className="preview-section-v8764 acta-a4-section-v8766">
      <h3>Documents adjunts</h3>{docs.length===0?<p>Sense documents adjunts.</p>:<ul>{docs.map(d=><li key={d.id}>{d.nom}</li>)}</ul>}
    </div>
    {(croquis.length>0||(acta?.croquis||[]).length>0)&&<div className="preview-section-v8764 acta-a4-section-v8766"><h3>Plànols marcats i croquis d’obra</h3><div className="acta-photo-preview-v8761">{[...croquis,...(acta?.croquis||[])].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).map(c=><figure key={c.id}><img src={c.src}/><figcaption>{c.nom}{c.origen?` · Base: ${c.origen}`:""}</figcaption></figure>)}</div></div>}
    {fotos.length>0&&<div className="preview-section-v8764 acta-a4-section-v8766"><h3>Reportatge fotogràfic</h3><div className="acta-photo-preview-v8761">{fotos.map(f=><figure key={f.id}><img src={f.src||f.url}/><figcaption>{f.nom}</figcaption></figure>)}</div></div>}
    <div className="preview-section-v8764 acta-a4-section-v8766"><h3>Signatures electròniques</h3><div className="signature-grid-v8768"><span>Direcció facultativa / DO<br/>Nom i signatura</span><span>DEO / Arquitecte tècnic<br/>Nom i signatura</span><span>Constructor<br/>Nom i signatura</span><span>Promotor / propietat<br/>Nom i signatura</span></div></div>
  </div>
}



function LoginScreen8778({onLogin}){
  const saved=(()=>{try{return JSON.parse(localStorage.getItem("aco_login_remember_v8798")||"{}")}catch{return {}}})();
  const[user,setUser]=useState(saved.user||"");
  const[pwd,setPwd]=useState("");
  const[remember,setRemember]=useState(!!saved.user);
  const[err,setErr]=useState("");
  function submit(e){
    e.preventDefault();
    const u=user.trim().toLowerCase();
    if(APP_USERS8779[u]&&APP_USERS8779[u]===pwd){
      try{remember?localStorage.setItem("aco_login_remember_v8798",JSON.stringify({user:u})):localStorage.removeItem("aco_login_remember_v8798")}catch{}
      try{if(window.PasswordCredential&&navigator.credentials){navigator.credentials.store(new PasswordCredential({id:u,password:pwd,name:u})).catch(()=>{})}}catch{}
      sessionStorage.setItem("aco_current_user8779",u);onLogin?.(u);return
    }
    setErr("Usuari o contrasenya incorrectes.");
  }
  return <div className="login-page-v8778"><form className="login-card-v8778" onSubmit={submit} autoComplete="on" method="post" action="/login">
    <div className="login-logo-v8778">CO</div><h1>APP Control d’Obres</h1><p>Accés privat al mòdul tècnic del despatx.</p>
    <label><span>Usuari</span><input autoFocus name="username" id="username" value={user} onChange={e=>setUser(e.target.value)} placeholder="Usuari" autoComplete="username" inputMode="text"/></label>
    <label><span>Contrasenya</span><input type="password" name="password" id="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Contrasenya" autoComplete="current-password"/></label>
    <label className="remember-login-v8798"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Recordar accés en aquest dispositiu</span></label>
    {err&&<div className="login-error-v8778">{err}</div>}
    <button className="primary" type="submit">Entrar</button><small>El navegador també pot oferir desar la contrasenya si el gestor de contrasenyes està activat. En iPad/mòbil, el clauer pot emplenar-la amb Face ID / Touch ID.</small>
    <button type="button" className="secondary login-repair-v8785" onClick={()=>{
      const u=(user||"hector").trim().toLowerCase();
      sessionStorage.removeItem("aco_current_user8779");
      localStorage.removeItem("aco_login_remember_v8798");
      Object.keys(localStorage).filter(k=>k.includes(`${STORAGE_NS8782}__${u}__corrupt_backup`)||k.includes(`${STORAGE_NS8782}__${u}__login_recovery`)).forEach(k=>{});
      setErr("Mode recuperació preparat. Torna a introduir usuari i contrasenya.");
    }}>Preparar recuperació d’accés</button>
  </form></div>
}

function DataJsonTools8778(){
  const[status,setStatus]=useState("");
  const fileRef=useRef(null);
  const user=currentAppUser8779()||"hector";
  function userPrefix878105(u=user){return `${STORAGE_NS8782}__${String(u||"").trim().toLowerCase()}__`}
  function storageKeysForUser878105(u=user){
    const pref=userPrefix878105(u);
    const legacyCore=["aco_clients","aco_obres","aco_odata","aco_odata_core_v87104","aco_cp_custom8775","aco_config","aco_config_v60","aco_agenda_v86","aco_home_notes","aco_obra_notes","aco_acta_docs","aco_acta_photos","aco_photos"];
    const keys=new Set();
    Object.keys(localStorage).forEach(k=>{
      if(k.startsWith(pref))keys.add(k);
      // Per Héctor també exportem possibles claus antigues o dinàmiques que encara no s’hagin migrat.
      if(u==="hector" && /^aco_/.test(k) && !k.startsWith(STORAGE_NS8782+"__") && k!=="aco_current_user8779")keys.add(k);
    });
    legacyCore.forEach(k=>keys.add(lsKey8779(k,u)));
    return [...keys].filter(Boolean).sort();
  }
  function exportJson(){
    const keys=storageKeysForUser878105(user);
    const storage={};
    keys.forEach(k=>{try{storage[k]=localStorage.getItem(k)}catch{}});
    const simple={};
    const pref=userPrefix878105(user);
    Object.entries(storage).forEach(([k,v])=>{if(k.startsWith(pref))simple[k.slice(pref.length)]=v});
    const data={
      version:"V87.105",
      user,
      exportedAt:new Date().toISOString(),
      mode:"FULL_USER_STORAGE",
      note:"Còpia completa de totes les claus locals de l’usuari actiu. Inclou pressupostos annexos, certificacions, factures, agenda i claus dinàmiques.",
      storage,
      localStorage:simple
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`app-control-obres-${user}-backup-complet-${new Date().toISOString().slice(0,10)}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus(`Còpia COMPLETA exportada (${keys.length} blocs locals) per l’usuari ${user}.`);
  }
  function importJson(file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result);
        const active=user;
        const targetPref=userPrefix878105(active);
        const sourceUser=String(data.user||active).trim().toLowerCase();
        const sourcePref=userPrefix878105(sourceUser);
        const backup={};
        storageKeysForUser878105(active).forEach(k=>{try{backup[k]=localStorage.getItem(k)}catch{}});
        try{localStorage.setItem(`${targetPref}backup_abans_import_${Date.now()}`,JSON.stringify({user:active,createdAt:new Date().toISOString(),storage:backup}).slice(0,1000000))}catch{}
        let count=0;
        if(data.storage && typeof data.storage==="object"){
          Object.entries(data.storage).forEach(([k,v])=>{
            if(v==null)return;
            let targetKey=k;
            if(k.startsWith(sourcePref))targetKey=targetPref+k.slice(sourcePref.length);
            else if(k.startsWith(STORAGE_NS8782+"__")){
              const parts=k.split("__");
              const base=parts.slice(2).join("__");
              targetKey=targetPref+base;
            }else if(/^aco_/.test(k))targetKey=lsKey8779(k,active);
            try{localStorage.setItem(targetKey,String(v));count++}catch(e){console.warn("Import parcial",targetKey,e)}
          });
        }else{
          const store=data.localStorage||data;
          if(!store.aco_clients&&!store.aco_obres&&!store.aco_odata&&!store.aco_odata_core_v87104)throw new Error("El fitxer no sembla una còpia de l’app.");
          Object.entries(store).forEach(([k,v])=>{if(v!==undefined&&v!==null){try{localStorage.setItem(lsKey8779(k,active),String(v));count++}catch(e){console.warn("Import parcial",k,e)}}});
        }
        setStatus(`Dades importades per l’usuari ${active}. S’han escrit ${count} blocs. Recarregant l’app...`);
        setTimeout(()=>window.location.reload(),800);
      }catch(err){setStatus("Error important JSON: "+String(err?.message||err))}
    };
    reader.readAsText(file);
  }
  return <Card title="Còpia de seguretat / traspàs de dades JSON" action={<div className="actions-inline"><button className="primary" onClick={exportJson}>Exportar JSON complet</button><button className="secondary" onClick={()=>fileRef.current?.click()}>Importar JSON</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={e=>importJson(e.target.files?.[0])}/></div>}>
    <div className="module-note-v8738"><b>Còpia completa per usuari.</b><span>Aquesta exportació inclou totes les claus locals de l’usuari actiu, també les dinàmiques i la còpia crítica d’obra. Abans d’importar, l’app guarda una còpia de seguretat interna de l’estat anterior.</span></div>
    {status&&<div className="doc-status-v38">{status}</div>}
  </Card>
}

function HonorarisExpedient8778({data,obra,addPressupost,updatePressupost,facturarPressupost,deletePressupost,addFactura,updateFactura,deleteFactura,openEmail,openDoc}){
  const[sub,setSub]=useState("Pressupostos");
  return <div className="stack honoraris-exp-v8778"><div className="subtabs-v8746"><button className={sub==="Pressupostos"?"active":""} onClick={()=>setSub("Pressupostos")}>Pressupostos honoraris</button><button className={sub==="Calculadora"?"active":""} onClick={()=>setSub("Calculadora")}>Calculadora honoraris</button><button className={sub==="Factures"?"active":""} onClick={()=>setSub("Factures")}>Factures honoraris</button></div>
    {sub==="Pressupostos"&&<PressupostTecnic8738 data={data} obra={obra} addPressupost={addPressupost} updatePressupost={updatePressupost} facturarPressupost={facturarPressupost} deletePressupost={deletePressupost} openEmail={openEmail} openDoc={openDoc}/>}
    {sub==="Calculadora"&&<HonorarisCalculator8790 obres={[obra]} defaultObraId={obra.id} onCreatePressupost={addPressupost}/>}
    {sub==="Factures"&&<FacturesTecniques8738 data={data} obra={obra} addFactura={addFactura} updateFactura={updateFactura} deleteFactura={deleteFactura} openEmail={openEmail} openDoc={openDoc}/>}
  </div>
}


function NewGlobalPressupost8778({obres=[],onSave,close}){
  const [f,setF]=useState({obraId:obres[0]?.id||"",concepte:"Honoraris tècnics",base:"0",iva:"21",data:todayISO8743(),estat:"Pendent",text:"Honoraris tècnics segons encàrrec professional."});
  const obra=obres.find(o=>o.id===f.obraId)||obres[0];
  function set(k,v){setF(x=>({...x,[k]:v}))}
  function submit(e){e.preventDefault();if(!f.obraId){alert("Selecciona un expedient.");return}onSave?.({...f,base:+f.base||0,iva:+f.iva||21});close?.()}
  return <Modal title="Nou pressupost d’honoraris" close={close}><form onSubmit={submit}>
    <div className="form-grid"><label className="span-all"><span>Expedient vinculat</span><select value={f.obraId} onChange={e=>set("obraId",e.target.value)}>{obres.map(o=><option key={o.id} value={o.id}>{expedientCode8739(o)} · {o.nom}</option>)}</select></label>
    <label><span>Data</span><input type="date" value={f.data} onChange={e=>set("data",e.target.value)}/></label><label><span>Estat</span><select value={f.estat} onChange={e=>set("estat",e.target.value)}><option>Esborrany</option><option>Pendent</option><option>Enviat</option><option>Acceptat</option><option>No acceptat</option></select></label>
    <label><span>Base sense IVA</span><input type="number" step="0.01" value={f.base} onChange={e=>set("base",e.target.value)}/></label><label><span>IVA %</span><input type="number" step="1" value={f.iva} onChange={e=>set("iva",e.target.value)}/></label>
    <label className="span-all"><span>Concepte</span><input value={f.concepte} onChange={e=>set("concepte",e.target.value)}/></label><label className="span-all"><span>Text / abast</span><textarea value={f.text} onChange={e=>set("text",e.target.value)}/></label></div>
    <div className="quote-total-v8742"><span>Total IVA inclòs</span><b>{money((+f.base||0)*(1+(+f.iva||0)/100))}</b></div>
    <div className="modal-actions"><button type="button" className="secondary" onClick={close}>Cancel·lar</button><button className="primary">Guardar pressupost</button></div>
  </form></Modal>
}



// V87.90 · Calculadora d'honoraris tècnics basada en la matriu Excel d'honoraris aportada.
function numCa8790(v){return Number(String(v??0).replace(/\./g,"").replace(",","."))||0}
function lookup8790(table,value){
  const target=Math.ceil(numCa8790(value))-1;
  let best=table[0]?.[1]||0;
  for(const [limit,coef] of table){if(target>=limit)best=coef;else break}
  return best;
}
const HON_SUP8790=[[-1,3.9],[50,3.6],[100,3.42],[200,3.3],[400,3.18],[600,3.06],[800,2.94],[1000,2.82],[2000,2.7],[3000,2.58],[4000,2.46],[6000,2.37],[8000,2.28],[10000,2.19],[12000,2.1],[14000,2.01],[16000,1.95],[18000,1.89],[20000,1.83],[25000,1.77],[30000,1.71],[35000,1.65],[40000,1.59],[50000,1.56],[65000,1.53],[80000,1.5],[100000,1.47],[120000,1.44],[140000,1.41],[180000,1.38],[200000,1.35],[999999999,1.35]];
const HON_PEMCA8790=[[-1,2.4],[24,2.25],[36,2.1],[48,2.01],[60,1.92],[90,1.87],[120,1.83],[180,1.74],[240,1.71],[300,1.65],[453,1.58],[601,1.5],[901,1.43],[1202,1.35],[1502,1.28],[2103,1.2],[2704,1.13],[3606,1.01],[4808,0.95],[6010,0.92],[9015,0.8],[12020,0.71],[18030,0.63],[30050,0.6],[999999999,0.6]];
const HON_SUP_STRUCT8790=[[-1,2.05],[50,1.95],[100,1.79],[200,1.64],[400,1.54],[600,1.48],[800,1.42],[1000,1.34],[2000,1.25],[3000,1.19],[4000,1.15],[6000,1.11],[8000,1.07],[10000,1.05],[12000,1.03],[14000,1.01],[16000,0.99],[18000,0.97],[20000,0.95],[25000,0.93],[30000,0.91],[35000,0.88],[40000,0.86],[50000,0.84],[65000,0.82],[80000,0.8],[100000,0.78],[120000,0.76],[140000,0.74],[180000,0.72],[200000,0.7],[999999999,0.7]];
const HON_ACTIVITY8790=[[-1,4.05],[100,3],[200,2.5],[300,2.2],[400,2],[500,1.85],[600,1.7],[700,1.6],[800,1.5],[1000,1.25],[1500,1.05],[2000,0.9],[3000,0.8],[4000,0.7],[5000,0.65],[6000,0.5],[999999999,0.5]];
const HON_BASTIDA8790=[[-1,150.25],[50,150.25],[100,219.35],[200,306.5],[300,387.65],[400,441.7],[500,489.8],[750,595],[1000,692.65],[999999999,692.65]];
const HON_ACT_EDIF8790={"Documentació tècnica i obres menors":{coef:1,min:450},"Projecte":{coef:1,min:450},"Direcció d'obra / direcció d'execució":{coef:1,min:450},"Projecte + DO + DEO":{coef:2,min:850},"Control de qualitat":{coef:0.3,min:225}};
const HON_ACT_URB8790={"Projecte":{coef:1,min:420.7},"Direcció d'obra":{coef:1,min:300.5},"Projecte i direcció":{coef:2,min:570.95},"Control de qualitat":{coef:0.09,min:0}};
const HON_SAFETY8790={"Redacció EBSS":0.15,"Redacció ESS":0.15,"Coordinació seguretat execució":0.25,"EBSS + coordinació execució":0.35,"ESS + coordinació execució":0.35,"Coordinació projecte + execució":0.40,"Aprovació PSS i control":0.05};
const HONOR_TREBALLS8790=[
 {id:"edificacio",grup:"Treballs d'edificació i urbanització",nom:"Treballs d'edificació",formula:"edificacio",req:"PEM, m² i Ca"},
 {id:"urbanitzacio",grup:"Treballs d'edificació i urbanització",nom:"Treballs d'urbanització",formula:"urbanitzacio",req:"PEM i Ca"},
 {id:"estructures",grup:"Treballs d'edificació i urbanització",nom:"Treballs de càlcul d’estructures",formula:"estructures",req:"PEM, m² i Ca"},
 {id:"activitat",grup:"Treballs d'edificació i urbanització",nom:"Activitat / incidència ambiental",formula:"activitat",req:"m² i Ca"},
 {id:"pla_emergencia",grup:"Treballs d'edificació i urbanització",nom:"Redacció del pla d'emergència",formula:"activitat",req:"m² i Ca"},
 {id:"bastida",grup:"Treballs d'edificació i urbanització",nom:"Treballs per a instal·lació de bastida",formula:"bastida",req:"m² i Ca"},
 {id:"seguretat",grup:"Treballs de seguretat",nom:"Seguretat i salut vinculada a obra",formula:"seguretat",req:"PEM, m² i Ca"},
 {id:"gestio_projecte",grup:"Gestió",nom:"Gestió del projecte",formula:"pemPercentCa",coef:1.2,req:"PEM i Ca"},
 {id:"control_economic",grup:"Gestió",nom:"Control econòmic de l’obra",formula:"pemDirect",coef:0.04,req:"PEM"},
 {id:"contractacio_oficis",grup:"Gestió",nom:"Contractació d'oficis",formula:"pemDirect",coef:0.03,req:"PEM"},
 {id:"control_costos",grup:"Gestió",nom:"Control de costos",formula:"pemDirect",coef:0.01,req:"PEM"},
 {id:"cedula",grup:"Altres treballs",nom:"Certificat d'habitabilitat d'habitatges usats",formula:"cedula",req:"habitatges, superfície i Ca"},
 {id:"informe",grup:"Altres treballs",nom:"Informes, dictàmens i certificats",formula:"informe",req:"Ca"},
 {id:"aixecament",grup:"Altres treballs",nom:"Aixecaments planimètrics",formula:"aixecament",req:"m² i Ca"},
 {id:"amidaments",grup:"Altres treballs",nom:"Amidaments i memòria valorada",formula:"amidaments",req:"m² o PEM i Ca"},
 {id:"minutats",grup:"Treballs minutats per hores",nom:"Treballs minutats per hores",formula:"hores",req:"hores i €/h"},

 {id:"tram_llicencia",grup:"Tramitació de documents",nom:"Tramitació de llicència d'obres",formula:"constCa",coef:72.1,req:"Ca"},
 {id:"tram_cedula1",grup:"Tramitació de documents",nom:"Tramitació de cèdula de primera ocupació",formula:"constCa",coef:120.2,req:"Ca"},
 {id:"tram_cedula2",grup:"Tramitació de documents",nom:"Tramitació de cèdula de segona ocupació",formula:"constCa",coef:60.1,req:"Ca"},
 {id:"llibre_edifici",grup:"Tramitació de documents",nom:"Llibre de l'edifici",formula:"habCa",coef:9,extra:10,req:"habitatges i Ca"},
 {id:"manual_us_manteniment",grup:"Tramitació de documents",nom:"Manual d'ús i manteniment",formula:"habCa",coef:6,extra:10,req:"habitatges i Ca"},
 {id:"manual",grup:"Altres treballs",nom:"Honoraris convinguts / manual",formula:"manual",req:"import manual"}
];
function calcHonoraris8790(f){
  const pem=numCa8790(f.pem), sup=numCa8790(f.superficie), ca=numCa8790(f.ca)||2.3, hores=numCa8790(f.hores), preuHora=numCa8790(f.preuHora)||50, habitatges=Math.max(0,numCa8790(f.habitatges)||0), manual=numCa8790(f.manual);
  const t=HONOR_TREBALLS8790.find(x=>x.id===f.treball)||HONOR_TREBALLS8790[0];
  const tipusObraCoef=f.tipusObra==="Obres d'ampliació, reforma i reparació"?1.2:1;
  let base=0,minim=0,formula="";
  if(t.formula==="edificacio"){
    const a=HON_ACT_EDIF8790[f.actuacioEdif]||HON_ACT_EDIF8790["Projecte + DO + DEO"];
    const coefSup=lookup8790(HON_SUP8790,sup);
    minim=a.min*ca;
    base=pem*a.coef*coefSup*tipusObraCoef/100;
    formula=`PEM × coef. actuació (${a.coef}) × coef. superfície (${coefSup.toFixed(2)}) × coef. tipus obra (${tipusObraCoef}) / 100`;
  }else if(t.formula==="urbanitzacio"){
    const a=HON_ACT_URB8790[f.actuacioUrb]||HON_ACT_URB8790["Projecte i direcció"];
    const coef=lookup8790(HON_PEMCA8790,pem/(ca*1000));
    minim=a.min*ca;
    base=pem*a.coef*coef/100;
    formula=`PEM × coef. actuació (${a.coef}) × coef. pressupost (${coef.toFixed(2)}) / 100`;
  }else if(t.formula==="estructures"){
    const coef=lookup8790(HON_SUP_STRUCT8790,sup);
    minim=240.4*ca;
    base=pem*coef/100;
    formula=`PEM × coef. superfície estructures (${coef.toFixed(2)}) / 100`;
  }else if(t.formula==="activitat"){
    const coef=lookup8790(HON_ACTIVITY8790,sup);
    minim=360*ca;
    base=sup*coef*ca;
    formula=`Superfície × coef. activitat (${coef.toFixed(2)}) × Ca`;
  }else if(t.formula==="bastida"){
    const coef=lookup8790(HON_BASTIDA8790,sup);
    base=coef*ca;minim=0;formula=`barem bastida segons superfície (${coef.toFixed(2)}) × Ca`;
  }else if(t.formula==="seguretat"){
    const safety=HON_SAFETY8790[f.actuacioSafety]??0.15;
    const coefSup=lookup8790(HON_SUP8790,sup);
    const principal=pem*1*coefSup*tipusObraCoef/100;
    minim=450*ca*safety;
    base=principal*safety;
    formula=`honoraris base d'obra × coef. seguretat (${safety})`;
  }else if(t.formula==="pemPercentCa"){
    base=pem*(t.coef||0)/100*ca;formula=`PEM × ${t.coef}% × Ca`;
  }else if(t.formula==="pemDirect"){
    base=pem*(t.coef||0);formula=`PEM × ${t.coef}`;
  }else if(t.formula==="cedula"){
    const h=habitatges||1;
    if(f.planoCedula==="Cal elaborar plànol")base=(65*(h+1)*ca)+((sup<70?150:200));
    else base=65*(h+1)*ca;
    formula=`certificat habitabilitat segons habitatges${f.planoCedula==="Cal elaborar plànol"?" + plànol":""}`;
  }else if(t.formula==="informe"){
    const mins={"Informe sense certificat":180,"Certificat sense informe":180,"Dictamen amb informe":240,"Certificat amb informe":331};
    base=(mins[f.tipusInforme]||180)*ca;formula=`mínim segons tipus d'informe × Ca`;
  }else if(t.formula==="aixecament"){
    minim=150.25*ca;base=Math.max(minim,sup*0.0644*ca);formula=`màxim entre mínim i superfície × coeficient orientatiu × Ca`;
  }else if(t.formula==="amidaments"){
    minim=130*ca;base=Math.max(minim,(pem?pem*0.00295:sup*4.922)*ca);formula=`màxim entre mínim i amidament segons PEM/superfície`;
  }else if(t.formula==="constCa"){
    base=(t.coef||0)*ca;formula=`coeficient fix del barem (${t.coef}) × Ca`;
  }else if(t.formula==="habCa"){
    const h=habitatges||1;base=(t.coef||0)*(h+(t.extra||0))*ca;formula=`coeficient (${t.coef}) × (habitatges + ${t.extra||0}) × Ca`;
  }else if(t.formula==="hores"){
    base=hores*preuHora;formula=`hores × €/h`;
  }else{base=manual;formula="import manual";}
  const recomanat=Math.max(minim||0,base||0);
  const ajust=numCa8790(f.ajustPercent);
  const final=recomanat*(1+ajust/100);
  return {treball:t,base,minim,recomanat,final,formula};
}
function HonorarisCalculator8790({obres=[],defaultObraId="",onCreatePressupost}){
  const firstObra=defaultObraId||obres[0]?.id||"";
  const [f,setF]=useState({obraId:firstObra,grup:"Treballs d'edificació i urbanització",treball:"edificacio",pem:"30000",superficie:"100",ca:"2,30",iva:"21",estat:"Pendent",ajustPercent:"0",actuacioEdif:"Projecte + DO + DEO",tipusObra:"Obres de nova planta",actuacioUrb:"Projecte i direcció",actuacioSafety:"Redacció EBSS",planoCedula:"No cal elaborar plànol",tipusInforme:"Certificat sense informe",habitatges:"1",hores:"1",preuHora:"50",manual:"0"});
  const groups=[...new Set(HONOR_TREBALLS8790.map(x=>x.grup))];
  const treballs=HONOR_TREBALLS8790.filter(x=>x.grup===f.grup);
  useEffect(()=>{if(!treballs.some(t=>t.id===f.treball))setF(x=>({...x,treball:treballs[0]?.id||"manual"}))},[f.grup]);
  const r=calcHonoraris8790(f);const finalEditable=numCa8790(f.finalManual)>0?numCa8790(f.finalManual):r.final;
  function set(k,v){setF(x=>({...x,[k]:v}))}
  function create(){
    if(!f.obraId){alert("Selecciona un expedient vinculat.");return}
    const concepte=`Honoraris · ${r.treball.nom}`;
    const text=`Càlcul orientatiu segons matriu d'honoraris aportada. ${r.formula}. PEM: ${money(numCa8790(f.pem))}; superfície: ${numCa8790(f.superficie).toFixed(2)} m²; Ca: ${numCa8790(f.ca).toFixed(2)}. Import recomanat: ${money(r.recomanat)}. Import final editable aplicat: ${money(finalEditable)}.`;
    onCreatePressupost?.({obraId:f.obraId,concepte,text,base:finalEditable,iva:numCa8790(f.iva)||21,estat:f.estat||"Pendent",data:todayISO8743(),honorarisCalc:{...f,resultat:r,final:finalEditable}});
  }
  return <div className="honor-calc-v8790">
    <div className="module-note-v8738"><b>Calculadora d’honoraris tècnics</b><span>Integració millorada de la matriu Excel: grups del full Honoraris, Ca i fórmules principals. El preu final continua sent editable; si algun cas concret no coincideix encara, es pot deixar com a import manual i afinar la fórmula.</span></div>
    <div className="form-grid honor-calc-grid-v8790">
      <label className="span-all"><span>Expedient vinculat</span><select value={f.obraId} onChange={e=>set("obraId",e.target.value)}>{obres.map(o=><option key={o.id} value={o.id}>{expedientCode8739(o)} · {o.nom}</option>)}</select></label>
      <label><span>Grup</span><select value={f.grup} onChange={e=>set("grup",e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select></label>
      <label><span>Tipus de feina</span><select value={f.treball} onChange={e=>set("treball",e.target.value)}>{treballs.map(t=><option key={t.id} value={t.id}>{t.nom}</option>)}</select></label>
      <label><span>PEM / pressupost base</span><input value={f.pem} onChange={e=>set("pem",e.target.value)} /></label>
      <label><span>Superfície m²</span><input value={f.superficie} onChange={e=>set("superficie",e.target.value)} /></label>
      <label><span>Coeficient actualització Ca</span><input value={f.ca} onChange={e=>set("ca",e.target.value)} /></label>
      <label><span>IVA %</span><input value={f.iva} onChange={e=>set("iva",e.target.value)} /></label>
      {f.treball==="edificacio"&&<><label><span>Actuació edificació</span><select value={f.actuacioEdif} onChange={e=>set("actuacioEdif",e.target.value)}>{Object.keys(HON_ACT_EDIF8790).map(x=><option key={x}>{x}</option>)}</select></label><label><span>Tipus d’obra</span><select value={f.tipusObra} onChange={e=>set("tipusObra",e.target.value)}><option>Obres d'ampliació, reforma i reparació</option><option>Obres de nova planta</option></select></label></>}
      {f.treball==="urbanitzacio"&&<label><span>Actuació urbanització</span><select value={f.actuacioUrb} onChange={e=>set("actuacioUrb",e.target.value)}>{Object.keys(HON_ACT_URB8790).map(x=><option key={x}>{x}</option>)}</select></label>}
      {f.treball==="seguretat"&&<><label><span>Actuació seguretat</span><select value={f.actuacioSafety} onChange={e=>set("actuacioSafety",e.target.value)}>{Object.keys(HON_SAFETY8790).map(x=><option key={x}>{x}</option>)}</select></label><label><span>Tipus d’obra</span><select value={f.tipusObra} onChange={e=>set("tipusObra",e.target.value)}><option>Obres d'ampliació, reforma i reparació</option><option>Obres de nova planta</option></select></label></>}
      {f.treball==="cedula"&&<><label><span>Núm. habitatges</span><input value={f.habitatges} onChange={e=>set("habitatges",e.target.value)} /></label><label><span>Plànol</span><select value={f.planoCedula} onChange={e=>set("planoCedula",e.target.value)}><option>No cal elaborar plànol</option><option>Cal elaborar plànol</option></select></label></>}
      {f.treball==="informe"&&<label><span>Tipus informe/certificat</span><select value={f.tipusInforme} onChange={e=>set("tipusInforme",e.target.value)}><option>Informe sense certificat</option><option>Certificat sense informe</option><option>Dictamen amb informe</option><option>Certificat amb informe</option></select></label>}
      {f.treball==="minutats"&&<><label><span>Hores</span><input value={f.hores} onChange={e=>set("hores",e.target.value)} /></label><label><span>€/h</span><input value={f.preuHora} onChange={e=>set("preuHora",e.target.value)} /></label></>}
      {f.treball==="manual"&&<label><span>Import manual</span><input value={f.manual} onChange={e=>set("manual",e.target.value)} /></label>}
      <label><span>Ajust final %</span><input value={f.ajustPercent} onChange={e=>set("ajustPercent",e.target.value)} /></label>
      <label><span>Preu final manual opcional</span><input value={f.finalManual||""} placeholder={money(r.final)} onChange={e=>set("finalManual",e.target.value)} /></label>
      <label><span>Estat pressupost</span><select value={f.estat} onChange={e=>set("estat",e.target.value)}><option>Pendent</option><option>Esborrany</option><option>Enviat</option><option>Acceptat</option><option>No acceptat</option></select></label>
    </div>
    <div className="honor-result-v8790">
      <div><small>Mínim de referència</small><b>{money(r.minim)}</b></div><div><small>Càlcul base</small><b>{money(r.base)}</b></div><div><small>Honorari recomanat</small><b>{money(r.recomanat)}</b></div><div className="final"><small>Preu final editable</small><b>{money(finalEditable)}</b></div>
    </div>
    <div className="honor-formula-v8790"><b>Fórmula aplicada:</b> {r.formula}</div>
    <div className="card-actions"><button className="primary" onClick={create}>Crear pressupost d’honoraris</button></div>
  </div>
}
function NewGlobalFactura8778({obres=[],onSave,close}){
  const [f,setF]=useState({obraId:obres[0]?.id||"",concepte:"Honoraris tècnics",base:"0",iva:"21",retencio:"0",descompte:"0",data:todayISO8743(),estat:"Pendent",text:"Factura corresponent als honoraris tècnics realitzats."});
  function set(k,v){setF(x=>({...x,[k]:v}))}
  function submit(e){e.preventDefault();if(!f.obraId){alert("Selecciona un expedient.");return}onSave?.({...f,base:+f.base||0,iva:+f.iva||21,retencio:+f.retencio||0,descompte:+f.descompte||0});close?.()}
  return <Modal title="Nova factura d’honoraris" close={close}><form onSubmit={submit}>
    <div className="form-grid"><label className="span-all"><span>Expedient vinculat</span><select value={f.obraId} onChange={e=>set("obraId",e.target.value)}>{obres.map(o=><option key={o.id} value={o.id}>{expedientCode8739(o)} · {o.nom}</option>)}</select></label>
    <label><span>Data</span><input type="date" value={f.data} onChange={e=>set("data",e.target.value)}/></label><label><span>Estat</span><select value={f.estat} onChange={e=>set("estat",e.target.value)}><option>Esborrany</option><option>Pendent</option><option>Enviada</option><option>Cobrada</option><option>Anul·lada</option></select></label>
    <label><span>Base sense IVA</span><input type="number" step="0.01" value={f.base} onChange={e=>set("base",e.target.value)}/></label><label><span>IVA %</span><input type="number" step="1" value={f.iva} onChange={e=>set("iva",e.target.value)}/></label><label><span>Retenció %</span><input type="number" step="1" value={f.retencio} onChange={e=>set("retencio",e.target.value)}/></label><label><span>Descompte %</span><input type="number" step="1" value={f.descompte} onChange={e=>set("descompte",e.target.value)}/></label>
    <label className="span-all"><span>Concepte</span><input value={f.concepte} onChange={e=>set("concepte",e.target.value)}/></label><label className="span-all"><span>Text / observacions</span><textarea value={f.text} onChange={e=>set("text",e.target.value)}/></label></div>
    <div className="quote-total-v8742"><span>Total factura</span><b>{money(invoiceTotal8746({...f,base:+f.base||0,iva:+f.iva||21,retencio:+f.retencio||0,descompte:+f.descompte||0}))}</b></div>
    <div className="modal-actions"><button type="button" className="secondary" onClick={close}>Cancel·lar</button><button className="primary">Guardar factura</button></div>
  </form></Modal>
}

function directPrintDocV87103(doc,obra,client){
  // En mòbil/iPad no obrim directament una finestra d'impressió perquè l'usuari pugui tornar enrere, compartir o descarregar.
  if((window.innerWidth||0)<=900)return false;
  const aw=window.screen?.availWidth||1400, ah=window.screen?.availHeight||900;
  const win=window.open('', '_blank', `width=${aw},height=${ah},left=0,top=0,resizable=yes,scrollbars=yes`);
  if(!win)return false;
  try{win.moveTo?.(0,0);win.resizeTo?.(aw,ah)}catch{}
  const html=doc.type==="certificacio"&&doc.rows?certPrintHtmlV8772(doc,obra,client):doc.type==="proforma"&&doc.proforma?proformaPrintHtml8783(doc,obra,client):null;
  if(!html){win.close?.();return false}
  win.document.open();
  win.document.write(html+`<script>setTimeout(()=>{window.focus();window.print();},350)<\/script>`);
  win.document.close();
  return true;
}

export default function App(){
const[screen,setScreen]=useState("Inici"),[collapsed,setCollapsed]=useState(false),[menuOpen,setMenuOpen]=useState(false);
const[authUser8779,setAuthUser8779]=useState("");
const[dataLoadedUser8781,setDataLoadedUser8781]=useState("");
const authOk8778=!!authUser8779;
const appCfg=lsJson8779("aco_config",{} ,authUser8779)||{};
const lang=appCfg.idioma||"Català";
const tt=(ca,es,en)=>lang==="Castellà"?es:(lang==="Anglès"?en:ca);
const[clients,setClients]=useState([]),
[obres,setObres]=useState([]),
[odata,setOdata]=useState({});
const[clientId,setClientId]=useState(""),[obraId,setObraId]=useState(""),[tab,setTab]=useState("Resum");
const[cs,setCs]=useState(""),[ct,setCt]=useState(""),[os,setOs]=useState(""),[oc,setOc]=useState(""),[oy,setOy]=useState(""),[ost,setOst]=useState(""),[ot,setOt]=useState("");
const[modal,setModal]=useState(null),[certInfo,setCertInfo]=useState({num:"2",data:"18/06/26",anteriorNum:"1",anteriorData:"12/05/26"});
const[calM,setCalM]=useState(new Date().getMonth()),[calY,setCalY]=useState(2026),[selDay,setSelDay]=useState(null),[email,setEmail]=useState(null),[doc,setDoc]=useState(null),[selActa,setSelActa]=useState(null);
const[timer,setTimer]=useState({running:false,start:null,elapsed:0,label:"Cèdula",task:"",rate:50});
function openDocSmart87103(d){
  if(d?.autoPrint&&(d.type==="certificacio"||d.type==="proforma")){
    if(directPrintDocV87103(d,obra,client))return;
    setDoc({...d,autoPrint:false,mobilePrint:true});
    return;
  }
  setDoc(d)
}
useEffect(()=>{let id;if(timer.running){id=setInterval(()=>setTimer(t=>({...t,elapsed:Date.now()-t.start})),500)}return()=>clearInterval(id)},[timer.running,timer.start]);
useEffect(()=>{
  if(!authUser8779)return;
  setDataLoadedUser8781("");
  setClients([]);setObres([]);setOdata({});setObraId("");setClientId("");
  sessionStorage.setItem("aco_current_user8779",authUser8779);
  migrateStorageForUser8782(authUser8779);
  const isHector=authUser8779==="hector";
  // V87.85: càrrega blindada real. Encara que hi hagi dades locals corruptes o amb format antic, l'usuari ha de poder entrar.
  let c=[],o=[],d={};
  try{
    const rawC=loadUserJson8784("aco_clients",(isHector?clients0:[]),authUser8779);
    const rawO=loadUserJson8784("aco_obres",(isHector?obres0:[]),authUser8779);
    const rawD=loadUserJson8784("aco_odata",(isHector?data0:{}),authUser8779);
    const coreD=loadUserJson8784("aco_odata_core_v87104",{},authUser8779);
    c=sanitizeClients8785(rawC,(isHector?clients0:[])).map(cleanClientFiscal87102).map(x=>x.id==="socoterm"?{...x,logo:x.logo||SOCOTERM_LOGO}:x);
    o=sanitizeObres8785(rawO,(isHector?obres0:[]));
    d=sanitizeOdata8785(mergeOdataCore878104(rawD,coreD),(isHector?data0:{}));
    if(isHector) d=recoverBudgetAnnexesLocal8795(d,o,authUser8779);
  }catch(e){
    console.error("Recuperació segura de login",e);
    backupUserState8785(authUser8779,"load_error",{message:String(e?.message||e)});
    c=isHector?sanitizeClients8785(clients0,[]).map(cleanClientFiscal87102):[];
    o=isHector?sanitizeObres8785(obres0,[]):[];
    d=isHector?sanitizeOdata8785(data0,{}):{};
  }
  setClients(c);setObres(o);setOdata(d);
  setClientId(c[0]?.id||"");setObraId(o[0]?.id||"");setTab("Resum");setScreen("Inici");
  setDataLoadedUser8781(authUser8779);
},[authUser8779]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779)lsSet8779("aco_clients",JSON.stringify(clients),authUser8779)},[clients,authUser8779,dataLoadedUser8781]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779)lsSet8779("aco_obres",JSON.stringify(obres),authUser8779)},[obres,authUser8779,dataLoadedUser8781]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779)saveOdata878104(odata,authUser8779)},[odata,authUser8779,dataLoadedUser8781]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779&&(obres||[]).some(o=>!o.codiExpedient||!o.expedientBase)){setObres(p=>assignMissingCodes8739(p,clients))}},[authUser8779,dataLoadedUser8781,obres,clients]);
const obra=obres.find(o=>o.id===obraId)||obres[0]||{id:"",client:"",nom:"Sense expedient",propietat:"Client pendent",nifPropietat:"Pendent",adreca:"",poblacio:"",tipusTreball:"Altres",tipologia:"Altres",estat:"Pendent",any:String(new Date().getFullYear())}, client=clients.find(c=>c.id===obra?.client)||{id:"",nom:obra?.propietat||"Client pendent",rao:obra?.propietat||"Client pendent",nif:obra?.nifPropietat||"Pendent",email:"Pendent",telefon:"Pendent",adreca:obra?.adreca||"Pendent",logo:""}, data=obra?.id?normalizeBudgetedData8791(odata[obra.id]||empty()):empty();
const fClients=clients.filter(c=>(!ct||c.tipus===ct)&&(c.nom+" "+c.rao+" "+c.contacte).toLowerCase().includes(cs.toLowerCase()));
const fObres=obres.filter(o=>{let c=clients.find(x=>x.id===o.client);return(!oc||o.client===oc)&&(!oy||o.any===oy)&&(!ost||o.estat===ost)&&(!ot||canonicalWorkType8740(o.tipusTreball||o.tipologia)===ot)&&((expedientCode8739(o)+" "+o.nom+" "+o.subtitol+" "+moduleLabel8737(o)+" "+(o.adreca||"")+" "+(o.poblacio||"")+" "+(c?.nom||"")).toLowerCase().includes(os.toLowerCase()))});
const byClient=useMemo(()=>{let m={};fObres.forEach(o=>{m[o.client]??={};m[o.client][o.any]??=[];m[o.client][o.any].push(o)});return m},[fObres]);
const setD=(id,up)=>{
  const now=new Date().toISOString();
  setOdata(p=>{
    const current=normalizeBudgetedData8791(p[id]||empty());
    const rawNext=typeof up==="function"?up(current):up;
    const next=normalizeBudgetedData8791({...rawNext,updatedAt:now});
    return {...p,[id]:next};
  });
  if(id)setObres(prev=>prev.map(o=>o.id===id?{...o,updatedAt:now}:o));
};
function nav(s){setScreen(s);setMenuOpen(false)}
function openObra(id){setObraId(id);setTab("Resum");setSelActa(null);nav("Obra")}
function openObraTab(id,t){setObraId(id);setTab(t||"Resum");setSelActa(null);nav("Obra")}
function openClient(id){setClientId(id);nav("Fitxa client")}
function deleteObra878112(id){
  const o=obres.find(x=>x.id===id);
  if(!o)return;
  const label=`${expedientCode8739(o)} · ${o.nom}`;
  if(!confirm(`Eliminar definitivament aquest expedient?

${label}

S'esborraran també les dades vinculades: actes, agenda, pressupostos, certificacions, factures i documents registrats dins l'app.`))return;
  const remaining=obres.filter(x=>x.id!==id);
  setObres(remaining);
  setOdata(prev=>{const n={...prev};delete n[id];return n});
  if(obraId===id){setObraId(remaining[0]?.id||"");setTab("Resum");nav("Treballs / Expedients");}
}



function uniqAgents8749(list=[]){
  const out=[]; const seen=new Set();
  for(const a of list.filter(Boolean)){
    const id=a.id || (String(a.nom||"")+String(a.email||"")+String(a.empresa||""));
    const key=String(id||"").toLowerCase();
    if(!key||seen.has(key))continue;
    seen.add(key); out.push({...a,id:a.id||("ag-"+out.length)});
  }
  return out;
}
function allAgents8749(odata={}){
  const base=[{id:"hector-tecnic",nom:"Héctor Cubero",rol:"Arquitecte tècnic",empresa:"Despatx tècnic",email:"pendent@despatx.cat",telefon:""}];
  return uniqAgents8749([...base,...Object.values(odata||{}).flatMap(d=>d.agents||[])]);
}
function fallbackExtract8749(wb){
  function clean(v){return String(v??"").trim()}
  function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function num(v){if(typeof v==="number")return v;let s=String(v??"").trim();if(!s)return 0;s=s.replace(/€/g,"").replace(/\s/g,"");if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");let n=parseFloat(s.replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0}
  function isCode(v){const s=clean(v);return /^([A-Za-z]{0,4}\d+|\d{1,2}([.,]\d{1,3})+)/.test(s)}
  let best=[];
  for(const sn of wb.SheetNames){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:""});
    let out=[], cap="PRESSUPOST IMPORTAT";
    for(const r of rows){
      const A=clean(r[0]), B=clean(r[1]), C=clean(r[2]), D=clean(r[3]);
      const E=num(r[4]), F=num(r[5]), G=num(r[6]);
      const rowText=norm([A,B,C,D].join(" "));
      if(!A&&!B&&!C&&!D&&!E&&!F&&!G)continue;
      if(rowText.includes("capitol") || rowText.includes("cap ") || /^\d+\s+/.test(A)&&!E&&!F&&!G&&C){
        cap=(A+" "+C).trim()||cap; continue;
      }
      if(!isCode(A) && C && out.length && !E&&!F&&!G){
        const last=out[out.length-1]; last.desc=(last.desc?last.desc+"\n":"")+C; continue;
      }
      if((isCode(A)||A) && C && (E || F || G)){
        let q=E||1, pu=F||0, total=G||0;
        if(!pu && total && q)pu=total/q;
        if(!total && q&&pu)total=q*pu;
        out.push({codi:A||String(out.length+1).padStart(2,"0"),ut:B||"ut",concepte:C,desc:D||"",cap,q,pu,certAnterior:0,certActual:0,certsByNum:{},tipus:"Import Excel A-G"});
      }
    }
    if(out.length>best.length)best=out;
  }
  return best;
}


function extractCodigoResumen8756(wb){
  function clean(v){return String(v??"").trim()}
  function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function num(v){
    if(typeof v==="number")return v;
    let s=String(v??"").trim();
    if(!s)return 0;
    s=s.replace(/€/g,"").replace(/\s/g,"");
    if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");
    const n=parseFloat(s.replace(/[^0-9.-]/g,""));
    return Number.isFinite(n)?n:0;
  }
  function isHeader(r){
    const t=r.map(norm).join(" ");
    return t.includes("codigo") && t.includes("resumen") && (t.includes("canpres")||t.includes("can pres")) && (t.includes("prpres")||t.includes("pr pres")) && (t.includes("imppres")||t.includes("imp pres"));
  }
  function isUnit(s){
    return /^(m2|m²|m3|m³|ml|m|ut|u|ud|kg|h|pa)$/i.test(clean(s));
  }
  function isChapterCode(s){
    s=clean(s);
    return /^\d{1,2}$/.test(s) || /^\d{1,2}[.,]0$/.test(s);
  }
  function isPartidaCode(s){
    s=clean(s);
    if(!s)return false;
    if(isChapterCode(s))return false;
    return /^[A-Za-z0-9][A-Za-z0-9.\-\/]*$/.test(s);
  }
  let best={rows:[],sheet:"",caps:0,total:0};

  for(const sn of wb.SheetNames){
    const ws=wb.Sheets[sn];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
    if(!rows?.length)continue;

    let headerIndex=rows.findIndex(isHeader);
    if(headerIndex<0){
      headerIndex=rows.findIndex(r=>{
        const A=norm(r[0]), C=norm(r[2]), E=norm(r[4]), F=norm(r[5]), G=norm(r[6]);
        return (A.includes("codigo")||A.includes("codi")) && (C.includes("resumen")||C.includes("resum")) && (E.includes("can")||F.includes("pr")||G.includes("imp"));
      });
    }
    if(headerIndex<0){
      // Permet format sense capçalera si sembla A-G
      headerIndex=0;
    }

    let out=[];
    let capActual="PRESSUPOST IMPORTAT";
    let capCount=0;
    let last=null;

    for(const r of rows.slice(headerIndex+1)){
      const A=clean(r[0]);  // Código
      const B=clean(r[1]);  // Ut
      const C=clean(r[2]);  // Resumen
      const D=clean(r[3]);  // lliure
      const E=num(r[4]);    // CanPres
      const F=num(r[5]);    // PrPres
      const G=num(r[6]);    // ImpPres
      const textAC=[A,B,C,D].map(clean).filter(Boolean).join(" ");
      const ntext=norm(textAC);

      if(!A&&!B&&!C&&!D&&!E&&!F&&!G)continue;

      // CAPÍTOL: codi curt a Código + títol a Resumen + sense imports
      const isCapitol = isChapterCode(A) && C && !E && !F && !G;
      if(isCapitol){
        capActual=`${A} ${C}`.replace(/\s+/g," ").trim();
        capCount++;
        last=null;
        continue;
      }

      // També accepta capítols escrits textualment
      if((ntext.includes("capitol")||ntext.includes("capítol")) && !E && !F && !G){
        capActual=textAC.replace(/\s+/g," ").trim() || capActual;
        capCount++;
        last=null;
        continue;
      }

      // DESCRIPCIÓ LLARGA: fila sense codi, amb text a Resumen/D, sense imports
      if(last && !A && !E && !F && !G && (C||D||B)){
        const extra=[B,C,D].map(clean).filter(Boolean).join(" ");
        if(extra && !String(last.desc||"").includes(extra)){
          last.desc=(last.desc?last.desc+"\n":"")+extra;
        }
        continue;
      }

      // Alguns Excels repeteixen línies de descripció amb codi buit però a C
      if(last && !isPartidaCode(A) && !E && !F && !G && (C||D)){
        const extra=[C,D].map(clean).filter(Boolean).join(" ");
        if(extra && !String(last.desc||"").includes(extra)){
          last.desc=(last.desc?last.desc+"\n":"")+extra;
        }
        continue;
      }

      // PARTIDA: codi real + unitat + resumen + amid/preu/import
      if(isPartidaCode(A) && (C||D) && (E||F||G)){
        let q=E||0;
        let pu=F||0;
        let total=G||0;
        if(!total && q && pu)total=q*pu;
        if(!pu && q && total)pu=total/q;

        const partida={
          codi:A,
          ut:B||"ut",
          concepte:C||D||"Partida importada",
          desc:D&&C?D:"",
          cap:capActual,
          q:q||0,
          pu:pu||0,
          certAnterior:0,
          certActual:0,
          certsByNum:{},
          tipus:"Import Excel Código-Resumen"
        };
        out.push(partida);
        last=partida;
        continue;
      }

      // PARTIDA sense unitat però amb imports
      if(isPartidaCode(A) && (C||D) && (E||F||G)){
        let q=E||0, pu=F||0, total=G||0;
        if(!total && q && pu)total=q*pu;
        if(!pu && q && total)pu=total/q;
        const partida={codi:A,ut:B||"ut",concepte:C||D||"Partida importada",desc:"",cap:capActual,q,pu,certAnterior:0,certActual:0,certsByNum:{},tipus:"Import Excel Código-Resumen"};
        out.push(partida); last=partida;
      }
    }

    const caps=new Set(out.map(x=>x.cap)).size;
    const total=out.reduce((s,x)=>s+(+x.q||0)*(+x.pu||0),0);
    if(out.length>best.rows.length || (out.length===best.rows.length && caps>best.caps)){
      best={rows:out,sheet:sn,caps,total};
    }
  }
  return best;
}

async function importExcel(e,budgetId="principal"){
  const file=e.target.files?.[0];
  const activeBudgetId8786=String(budgetId||"principal");
  if(!file)return;

  function clean(v){return String(v??"").trim()}
  function norm(v){return clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function num(v){
    if(typeof v==="number")return v;
    let s=String(v??"").trim();
    if(!s || s==="-" || s==="—")return 0;
    s=s.replace(/€/g,"").replace(/\s/g,"");
    if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");
    const n=parseFloat(s.replace(/[^0-9.-]/g,""));
    return Number.isFinite(n)?n:0;
  }
  function isEmptyNum(v){return clean(v)==="" || clean(v)==="-" || clean(v)==="—"}
  function isUnit(s){return /^(m2|m²|m3|m³|ml|m|ut|u|ud|kg|h|pa)$/i.test(clean(s))}
  function pureNumericCode(s){s=clean(s);return /^\d{1,3}$/.test(s) || /^\d{1,3}[.,]0$/.test(s)}
  function isTotalRow(s){return norm(s).startsWith("total")}
  function isPartidaCode(s){
    s=clean(s);
    if(!s || isTotalRow(s))return false;
    // codis tipus 01.01, 0102, 0204GNH, 02.035BC, FDFSDF, etc.
    return /^[A-Za-z0-9][A-Za-z0-9.\-\/]*$/.test(s);
  }
  function headerMap(row){
    const h=(row||[]).map(norm);
    function find(names){
      for(const name of names){let i=h.findIndex(x=>x===name);if(i>=0)return i}
      for(const name of names){let i=h.findIndex(x=>x.includes(name));if(i>=0)return i}
      return -1;
    }
    const codi=find(["codigo","código","codi","partida"]);
    const nat=find(["nat","naturalesa","naturaleza"]);
    const ud=find(["ud","ut","unitat","unidad"]);
    const resum=find(["resumen","resum","concepte","concepto","descripcio","descripcion"]);
    const q=find(["canpres","can pres","quantitat","cantidad","amidament","amid"]);
    const pu=find(["prpres","pr pres","pres","preu","preu/ut","precio","pu"]);
    const imp=find(["imppres","imp pres","impres","import","importe","total"]);
    return {
      codi:codi>=0?codi:0,
      nat:nat,
      ud:ud>=0?ud:(nat>=0?2:1),
      resum:resum>=0?resum:(nat>=0?3:2),
      q:q>=0?q:(nat>=0?4:4),
      pu:pu>=0?pu:(nat>=0?5:5),
      imp:imp>=0?imp:(nat>=0?6:6),
      hasNat:nat>=0
    };
  }
  function looksHeader(row){
    const t=(row||[]).map(norm).join("|");
    return (t.includes("codigo")||t.includes("codi")||t.includes("partida")) &&
           (t.includes("resumen")||t.includes("resum")||t.includes("concepte")||t.includes("descrip"));
  }
  
  // V87.70: lector més robust per Excel tipus pressupost visual (capítols C02/C 02 i partides 02.01 amb imports separats per columnes buides).
  function isCapCode(s){s=clean(s).replace(/\s+/g,"");return /^C\d{1,3}$/i.test(s) || /^C\d{1,3}[A-Z]?$/i.test(s)}
  function isItemCodeStrict(s){s=clean(s);return /^\d{1,3}[\.,]\d{1,3}[A-Za-z0-9\-\/]*$/.test(s)}
  function isMoneyLike(v){
    if(typeof v==="number")return Number.isFinite(v);
    const s=clean(v);
    if(!s || /[A-Za-zÀ-ÿ]/.test(s))return false;
    return /^-?[0-9.\s]+([,\.][0-9]+)?\s*€?$/.test(s);
  }
  function numericCellsAfter(row,from=0){
    return (row||[]).map((v,i)=>({i,v,t:clean(v),n:num(v)})).filter(c=>c.i>=from && c.t!=="" && isMoneyLike(c.v));
  }
  function getAmountTriplet(row,idx){
    const q0=idx.q>=0?num(row[idx.q]):0, pu0=idx.pu>=0?num(row[idx.pu]):0, imp0=idx.imp>=0?num(row[idx.imp]):0;
    const okMapped=(idx.q>=0&&!isEmptyNum(row[idx.q])) || (idx.pu>=0&&!isEmptyNum(row[idx.pu])) || (idx.imp>=0&&!isEmptyNum(row[idx.imp]));
    if(okMapped && (q0||pu0||imp0))return {q:q0,pu:pu0,imp:imp0,source:"mapped"};
    const nums=numericCellsAfter(row,3);
    if(nums.length>=3){const last=nums.slice(-3);return {q:last[0].n,pu:last[1].n,imp:last[2].n,source:"tail"}}
    return {q:0,pu:0,imp:0,source:"none"};
  }
  function nonEmptyCells(row){return (row||[]).map((v,i)=>({i,t:clean(v),v})).filter(c=>c.t!=="")}
  function textWithoutTrailingAmounts(row,start=0){
    return nonEmptyCells(row).filter(c=>c.i>=start && !isMoneyLike(c.v) && !isUnit(c.t) && !isItemCodeStrict(c.t) && !isCapCode(c.t)).map(c=>c.t).join(" ").replace(/\s+/g," ").trim();
  }
  function capTitleFromRow(row,code){
    const cells=nonEmptyCells(row);
    const title=cells.filter(c=>c.t!==code && !isMoneyLike(c.v) && !isUnit(c.t) && !isCapCode(c.t)).map(c=>c.t).join(" ").trim();
    return title||"CAPÍTOL";
  }
  
function parseRows(rows,sheetName){
    const headerIndex=Math.max(0,rows.findIndex(looksHeader));
    const idx=headerMap(rows[headerIndex]||[]);
    let out=[];
    let cap="PRESSUPOST IMPORTAT";
    let last=null;

    for(const row of rows.slice(headerIndex+1)){
      if(!row || !row.some(x=>clean(x)))continue;
      const cells=nonEmptyCells(row);
      if(!cells.length)continue;

      const A=clean(row[idx.codi]);
      const N=idx.nat>=0?clean(row[idx.nat]):"";
      const Uraw=clean(row[idx.ud]);
      const Rraw=clean(row[idx.resum]);
      const first=cells[0]?.t||"";
      const second=cells[1]?.t||"";
      const third=cells[2]?.t||"";
      const nN=norm(N), nR=norm(Rraw);
      const amounts=getAmountTriplet(row,idx);
      const numsEmpty=!(amounts.q||amounts.pu||amounts.imp);
      const rowText=cells.map(c=>c.t).join(" ");

      if(isTotalRow(Rraw)||isTotalRow(A)||isTotalRow(first)||/^total\b/i.test(norm(rowText)))continue;

      // CAPÍTOL explícit: C02 / C 02 + títol, o Nat=Capítol. S'admet una única xifra de subtotal al final.
      const capCode=isCapCode(A)?A:(isCapCode(first)?first:(isCapCode(second)?second:""));
      const natCap=nN.includes("capitol") || nN.includes("capítol");
      const shortCodeCap=(pureNumericCode(A||first) && !isItemCodeStrict(A||first) && !isUnit(second) && textWithoutTrailingAmounts(row,1) && (numsEmpty || numericCellsAfter(row,3).length<=1));
      const textCap=(nR.includes("capitol")||nR.includes("capítol")) && (numsEmpty || numericCellsAfter(row,3).length<=1);
      if(capCode || natCap || shortCodeCap || textCap){
        const code=capCode || A || first || "";
        const title=capTitleFromRow(row,code) || Rraw || Uraw || N || "CAPÍTOL";
        cap=`${code} ${title}`.replace(/\s+/g," ").trim();
        last=null;
        continue;
      }

      // DESCRIPCIÓ LLARGA: files sense codi de partida i sense tripleta d'import.
      const maybeCode=A||first;
      if(last && !isItemCodeStrict(maybeCode) && !isCapCode(maybeCode) && (Rraw||Uraw||textWithoutTrailingAmounts(row,0)) && (numsEmpty || numericCellsAfter(row,3).length<3)){
        const extra=(Rraw||Uraw)?[Uraw,Rraw].map(clean).filter(Boolean).join(" "):textWithoutTrailingAmounts(row,0);
        if(extra && !String(last.desc||"").includes(extra))last.desc=(last.desc?last.desc+"\n":"")+extra;
        continue;
      }

      // PARTIDA: prioritat a codis tipus 02.01 / 03.02. Funciona encara que hi hagi columnes buides abans dels imports.
      let code=isItemCodeStrict(A)?A:(isItemCodeStrict(first)?first:"");
      const natPart=nN.includes("partida") || nN.includes("part");
      if(!code && natPart)code=A||first||String(out.length+1).padStart(2,"0");
      if(code){
        let unit=isUnit(Uraw)?Uraw:(isUnit(second)?second:(isUnit(third)?third:(Uraw||"ut")));
        let concept=Rraw;
        if(!concept){
          const codeIdx=cells.find(c=>c.t===code)?.i ?? 0;
          const unitIdx=cells.find(c=>isUnit(c.t) && c.i>codeIdx)?.i ?? -1;
          concept=textWithoutTrailingAmounts(row,unitIdx>=0?unitIdx+1:codeIdx+1) || third || second || "Partida importada";
        }
        let q=amounts.q||0, pu=amounts.pu||0, imp=amounts.imp||0;
        if(!imp && q && pu)imp=q*pu;
        if(!pu && q && imp)pu=imp/q;
        const partida={
          codi:code,
          cap,
          ut:unit,
          concepte:concept||"Partida importada",
          desc:"",
          q:q||0,
          pu:pu||0,
          certAnterior:0,
          certActual:0,
          certsByNum:{},
          tipus:"Import Excel"
        };
        out.push(partida);
        last=partida;
        continue;
      }

      // Fallback: codi alfanumèric + imports, però evitant confondre capítols C02 amb partides.
      const fallback=A||first;
      if(isPartidaCode(fallback) && !isCapCode(fallback) && (Rraw||Uraw||textWithoutTrailingAmounts(row,1)) && !numsEmpty){
        let q=amounts.q||0, pu=amounts.pu||0, imp=amounts.imp||0;
        if(!imp && q && pu)imp=q*pu;
        if(!pu && q && imp)pu=imp/q;
        const partida={codi:fallback,cap,ut:isUnit(Uraw)?Uraw:(isUnit(second)?second:(Uraw||"ut")),concepte:Rraw||textWithoutTrailingAmounts(row,1)||"Partida importada",desc:"",q:q||0,pu:pu||0,certAnterior:0,certActual:0,certsByNum:{},tipus:"Import Excel"};
        out.push(partida);last=partida;
      }
    }

    const realCaps=[...new Set(out.map(x=>x.cap).filter(c=>c && c!=="PRESSUPOST IMPORTAT"))];
    if(realCaps.length===1){out=out.map(x=>x.cap==="PRESSUPOST IMPORTAT"?{...x,cap:realCaps[0]}:x)}
    return {rows:out,sheet:sheetName,caps:new Set(out.map(x=>x.cap)).size,total:out.reduce((s,x)=>s+(+x.q||0)*(+x.pu||0),0)};
  }

  try{
    const ab=await file.arrayBuffer();
    const wb=XLSX.read(ab,{type:"array",cellDates:false});
    let best={rows:[],sheet:"",caps:0,total:0};
    for(const sheetName of wb.SheetNames){
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      const parsed=parseRows(rows,sheetName);
      if(parsed.rows.length>best.rows.length || (parsed.rows.length===best.rows.length && parsed.caps>best.caps))best=parsed;
    }
    if(!best.rows.length)throw new Error("No s'han detectat partides. Revisa que l'Excel tingui columnas Código / Ut o Nat / Resumen / CanPres / PrPres / ImpPres.");

    setD(obraId,d=>{
      const bid=activeBudgetId8786;
      const rowsWithBudget=best.rows.map(r=>({...r,budgetId:bid}));
      const oldPartides=(d.partides||[]).filter(r=>(r.budgetId||"principal")!==bid);
      const oldCerts=(d.certificacions||[]).filter(c=>(c.budgetId||"principal")!==bid);
      const oldFacts=(d.factures||[]).filter(f=>(f.budgetId||"principal")!==bid);
      const oldPress=(d.pressupostos||[]).filter(p=>(p.budgetId||"principal")!==bid || (!String(p.id||"").startsWith("budget-marker-")&&p.versio!=="Annex"));
      const currentGroups=ensureBudgetGroups8786({...d,partides:[...oldPartides,...rowsWithBudget],pressupostos:[...oldPress]}).groups;
      const adjustedGroups=currentGroups.map(g=>g.id===bid&&bid!=="principal"&&(!g.tipus||g.tipus==="Nou pressupost"||g.tipus==="Fora pressupost")?{...g,tipus:"Modificat aprovat"}:g);
      const groupName=(adjustedGroups.find(g=>g.id===bid)?.nom)||"Pressupost principal";
      return {
        ...d,
        budgetGroups:adjustedGroups.filter(g=>g.id!=="principal"),
        activeBudgetIdObra:bid,
        partides:[...oldPartides,...rowsWithBudget],
        certificacions:oldCerts,
        factures:oldFacts,
        pressupostos:[...oldPress,{
          id:"px-"+Date.now(),
          budgetId:bid,
          versio:"v"+String(oldPress.filter(p=>(p.budgetId||"principal")===bid).length+1).padStart(2,"0"),
          data:new Date().toLocaleDateString("ca-ES"),
          nom:file.name,
          estat:`${groupName} · Importat · ${best.rows.length} partides · ${best.caps||1} capítols · ${best.sheet}`,
          import:best.total
        }]
      };
    });
    alert(`Pressupost importat correctament: ${best.rows.length} partides en ${best.caps||1} capítols.`);
  }catch(err){
    setD(obraId,d=>({...d,pressupostos:[...(d.pressupostos||[]),{id:"p"+Date.now(),budgetId:activeBudgetId8786,versio:"v"+String((d.pressupostos||[]).filter(p=>(p.budgetId||"principal")===activeBudgetId8786).length+1).padStart(2,"0"),data:new Date().toLocaleDateString("ca-ES"),nom:file.name,estat:"Error lectura Excel: "+String(err?.message||err),import:0}]}));
  }
  if(e?.target)e.target.value="";
}

function deletePressupostVersion(id){
  if(!confirm("Eliminar aquesta versió de pressupost?")) return;
  setD(obraId,d=>{
    const removed=(d.pressupostos||[]).find(p=>p.id===id);
    const bid=removed?.budgetId||"principal";
    const next=(d.pressupostos||[]).filter(p=>p.id!==id);
    const hasSame=next.some(p=>(p.budgetId||"principal")===bid);
    return {
      ...d,
      pressupostos:next,
      partides:hasSame?(d.partides||[]):(d.partides||[]).filter(r=>(r.budgetId||"principal")!==bid),
      certificacions:hasSame?(d.certificacions||[]):(d.certificacions||[]).filter(c=>(c.budgetId||"principal")!==bid),
      factures:hasSame?(d.factures||[]):(d.factures||[]).filter(f=>(f.budgetId||"principal")!==bid)
    };
  });
}
function duplicatePressupostVersion(id){
  setD(obraId,d=>{
    const p=(d.pressupostos||[]).find(x=>x.id===id);
    if(!p)return d;
    return {...d,pressupostos:[...d.pressupostos,{...p,id:"p"+Date.now(),versio:p.versio+" copia",data:"Avui",estat:"Còpia"}]};
  });
}

function addCertificacio(){
  setD(obraId,d=>{
    const certs=d.certificacions||[];
    const nextNum=(certs.reduce((m,c)=>Math.max(m,+c.numero||0),0)||0)+1;
    const nova={id:"c"+Date.now(),numero:String(nextNum),data:todayShort8713(),estat:"Pendent",import:0};
    return {...d,certificacions:[...certs,nova]};
  });
}
function updateCert(codi,fieldOrValue,value){
let field=value===undefined?"certActual":fieldOrValue;
let raw=value===undefined?fieldOrValue:value;
let n=parseNum8770(raw);
if(!Number.isFinite(n))n=0;
setD(obraId,d=>({...d,partides:d.partides.map(r=>{
  if(r.codi!==codi)return r;
  const next={...r,[field]:n};
  if(String(field).startsWith("cert_")){
    const certKey=String(field).replace("cert_","");
    next.certsByNum={...(r.certsByNum||{}),[certKey]:n};
    if(next.certMesuresByNum&&next.certMesuresByNum[certKey]){next.certMesuresByNum={...next.certMesuresByNum};delete next.certMesuresByNum[certKey];}
  }
  return next;
})}))
}
function updateCertDate(id,value){setD(obraId,d=>({...d,certificacions:(d.certificacions||[]).map(c=>c.id===id?{...c,data:value}:c)}))}

function updateCertDateSafe8720(id,value){
  setD(obraId,d=>({...d,certificacions:(d.certificacions||[]).map(c=>c.id===id?{...c,data:value}:c)}))
}
function deleteCertificacioSafe8720(id){
  if(!confirm("Eliminar aquesta certificació?"))return;
  setD(obraId,d=>({...d,certificacions:(d.certificacions||[]).filter(c=>c.id!==id)}))
}

function updateCertDate8721(id,value){
  setD(obraId,d=>({...d,certificacions:(d.certificacions||[]).map(c=>c.id===id?{...c,data:value}:c)}))
}
function deleteCertificacio8721(id){
  if(!confirm("Eliminar aquesta certificació?"))return;
  setD(obraId,d=>({...d,certificacions:(d.certificacions||[]).filter(c=>c.id!==id)}))
}
function updateObraFitxa8721(patch){
  const cleanPatch={...patch};
  if(cleanPatch.tipusTreball||cleanPatch.tipologia){
    const tipus=canonicalWorkType8740(cleanPatch.tipusTreball||cleanPatch.tipologia);
    cleanPatch.tipusTreball=tipus;
    cleanPatch.tipologia=tipus;
  }
  setD(obraId,d=>({...d,obra:{...(d.obra||{}),...cleanPatch}}));
  setObres(p=>p.map(o=>o.id===obraId?{...o,...cleanPatch}:o));
  setTab("Resum");
}
function saveCert(){let n=+certInfo.num;let total=data.partides.reduce((s,r)=>s+certQty8783(r,n)*(+r.pu||0),0);setD(obraId,d=>({...d,certificacions:[...d.certificacions.filter(c=>+c.numero!==n),{id:"c"+Date.now(),numero:String(n),data:certInfo.data,estat:"Guardada",import:total,updatedAt:new Date().toISOString()}].sort((a,b)=>(+a.numero)-(+b.numero))}))}
function emailDraft(title){setEmail({title,agents:data.agents||[],selected:(data.agents||[]).map(a=>a.id),message:"Bon dia,\n\nAdjunto document de l'obra per a la seva revisió.\n\nSalutacions,\nHéctor"})}
function addPressupostTecnic8742(p){
  const year=String(obra?.any||new Date().getFullYear());
  const numero=p.numero||nextGlobalDocNumber8745(odata,"pressupost",year);
  setD(obraId,d=>{let rows=d.pressupostosTecnic||[];const id="pt-"+Date.now();const doc={id,numero,data:p.data||todayISO8743(),concepte:p.concepte||"Pressupost tècnic",text:p.text||"",base:+p.base||0,iva:+p.iva||21,estat:p.estat||"Esborrany",validesa:p.validesa,taxesIncloses:p.taxesIncloses,observacions:p.observacions};return {...d,pressupostosTecnic:[...rows,doc],documents:[...(d.documents||[]),{id:"doc-"+id,nom:`Pressupost honoraris ${numero}`,tipus:"PRESSUPOST",folder:"00_DESPATX_TECNIC",data:fmtAppDate8748(doc.data),storage:"registre",hasFile:false,linkedType:"pressupost",linkedId:id}]}});
}
function updatePressupostTecnic8742(id,patch){setD(obraId,d=>({...d,pressupostosTecnic:(d.pressupostosTecnic||[]).map(p=>p.id===id?{...p,...patch}:p)}))}
function facturarPressupostTecnic8742(id){
  setD(obraId,d=>{
    let p=(d.pressupostosTecnic||[]).find(x=>x.id===id);if(!p)return d;
    let factures=d.facturesTecnic||[];
    let existing=factures.find(x=>x.pressupostId===id);
    if(existing){return {...d,pressupostosTecnic:(d.pressupostosTecnic||[]).map(x=>x.id===id?{...x,estat:"Facturat"}:x),facturesTecnic:uniqueFactures8743(factures)}};
    let f={id:"ft-"+Date.now(),numero:nextGlobalDocNumber8745(odata,"factura",obra?.any),data:todayISO8743(),concepte:p.concepte||"Factura del pressupost acceptat",text:p.text||"",base:+p.base||0,iva:+p.iva||21,estat:"Esborrany",pressupostId:p.id};
    return {...d,pressupostosTecnic:(d.pressupostosTecnic||[]).map(x=>x.id===id?{...x,estat:"Facturat",facturat:true}:x),facturesTecnic:[...uniqueFactures8743(factures),f],documents:[...(d.documents||[]),{id:"doc-"+f.id,nom:`Factura honoraris ${f.numero}`,tipus:"FACTURA",folder:"00_DESPATX_TECNIC",data:fmtAppDate8748(f.data),storage:"registre",hasFile:false,linkedType:"factura",linkedId:f.id}]}
  });
  setTab("Factures");
}
function updateFacturaTecnica8743(id,patch){setD(obraId,d=>({...d,facturesTecnic:(d.facturesTecnic||[]).map(f=>f.id===id?{...f,...patch}:f)}))}
function deletePressupostTecnic8744(id){if(confirm("Eliminar aquest pressupost?"))setD(obraId,d=>({...d,pressupostosTecnic:(d.pressupostosTecnic||[]).filter(p=>p.id!==id),facturesTecnic:(d.facturesTecnic||[]).filter(f=>f.pressupostId!==id)}))}
function deleteFacturaTecnica8744(id){if(confirm("Eliminar aquesta factura?"))setD(obraId,d=>({...d,facturesTecnic:(d.facturesTecnic||[]).filter(f=>f.id!==id)}))}

function addFacturaTecnica8742(f){const numero=f.numero||nextGlobalDocNumber8745(odata,"factura",obra?.any);setD(obraId,d=>{let rows=d.facturesTecnic||[];const id="ft-"+Date.now();const doc={id,numero,data:f.data||todayISO8743(),concepte:f.concepte||"Factura tècnica",text:f.text||"",base:+f.base||0,iva:+f.iva||21,retencio:+f.retencio||0,descompte:+f.descompte||0,estat:f.estat||"Esborrany",pressupostId:f.pressupostId||""};return {...d,facturesTecnic:[...rows,doc],documents:[...(d.documents||[]),{id:"doc-"+id,nom:`Factura honoraris ${numero}`,tipus:"FACTURA",folder:"00_DESPATX_TECNIC",data:fmtAppDate8748(doc.data),storage:"registre",hasFile:false,linkedType:"factura",linkedId:id}]}})}
function addAgent(e){e.preventDefault();let f=new FormData(e.currentTarget);setD(obraId,d=>({...d,agents:[...d.agents,{id:"a"+Date.now(),nom:f.get("nom"),rol:f.get("rol"),empresa:f.get("empresa"),email:f.get("email"),telefon:f.get("telefon")}]}));setModal(null)}
function addActa(e){e.preventDefault();let f=new FormData(e.currentTarget);
let titol=String(f.get("titol")||"").trim(), dataActa=String(f.get("data")||"").trim(), text=String(f.get("text")||"").trim();
if(!titol||!dataActa){alert("Cal indicar com a mínim títol i data de l’acta.");return}
let ag=[...e.currentTarget.querySelectorAll('input[name="agentsActa"]:checked')].map(x=>x.value);
let newAgent=null;
if(f.get("crearAgentActa")==="1"){
  let nom=String(f.get("agentNom")||"").trim(), rol=String(f.get("agentRol")||"").trim(), empresa=String(f.get("agentEmpresa")||"").trim(), email=String(f.get("agentEmail")||"").trim();
  if(!nom||!rol||!empresa||!email){alert("Per crear un agent nou cal omplir nom, rol, empresa/autònom i email.");return}
  newAgent={id:"ag"+Date.now(),nom,rol,empresa,email,telefon:f.get("agentTelefon")||"",nif:f.get("agentNif")||"",adreca:f.get("agentAdreca")||""};
  ag=[...ag,newAgent.id];
}
let a={id:"acta-"+Date.now(),data:dataActa,titol,obra:obra.nom,agents:ag,text:text||"Es redacta acta de seguiment de l’expedient.",signatura:"Pendent"};
setD(obraId,d=>({...d,agents:newAgent?[...(d.agents||[]),newAgent]:(d.agents||[]),actes:[...(d.actes||[]),a]}));setSelActa(a.id);setModal(null);setTab("Actes")}
function addClient(e){e.preventDefault();let f=new FormData(e.currentTarget),id="client-"+Date.now();let nom=String(f.get("nom")||"").trim(),rao=String(f.get("rao")||"").trim(),nif=String(f.get("nif")||"").trim(),adreca=String(f.get("adreca")||"").trim(),cp=String(f.get("codiPostal")||"").trim(),pob=String(f.get("poblacio")||"").trim();if(!nom||!nif||!adreca||!cp||!pob){alert("Cal emplenar els camps obligatoris: nom/raó social, NIF/CIF, adreça, codi postal i població.");return}if(!rao||sameFiscalValue87101(rao,nif))rao=nom;let c={id,nom,rao,tipus:f.get("tipus"),contacte:f.get("contacte")||"",nif,email:f.get("email")||"",telefon:f.get("telefon")||"",adreca,codiPostal:cp,poblacio:pob,provincia:f.get("provincia")||provinciaForCp8773(cp)||provinciaForPoblacio8773(pob)||"",color:"blue",logo:f.get("logoPreview")||""};learnCpPoblacio8775(c.codiPostal,c.poblacio);setClients(p=>[c,...p]);setModal(null);openClient(id)}
function addObra(e){
  e.preventDefault();
  const f=new FormData(e.currentTarget);
  const year=String(f.get("any")||new Date().getFullYear()).trim()||String(new Date().getFullYear());
  const selectedClient=String(f.get("client")||"");
  const createClient=selectedClient==="__new__"||!selectedClient;
  let clientFinal=createClient?null:clients.find(c=>c.id===selectedClient);
  if(createClient){
    const clientNom=String(f.get("clientNouNom")||"Nou client").trim()||"Nou client";
    const idBase="client-"+safeSlug8768(clientNom,"client")+"-"+Date.now();
    clientFinal={
      id:idBase,
      nom:clientNom,
      rao:String(f.get("clientNouRao")||clientNom||"Pendent"),
      tipus:String(f.get("clientNouTipus")||"Particular"),
      contacte:String(f.get("clientNouContacte")||clientNom||"Pendent"),
      nif:String(f.get("clientNouNif")||"Pendent"),
      email:String(f.get("clientNouEmail")||"Pendent"),
      telefon:String(f.get("clientNouTelefon")||"Pendent"),
      adreca:String(f.get("clientNouAdreca")||"Pendent"),
      color:"blue",
      logo:""
    };
  }
  if(!clientFinal){alert("No s'ha pogut identificar el client de l'expedient.");return;}
  const tipus=canonicalWorkType8740(f.get("tipusTreballAltres")||f.get("tipusTreball")||"Altres");
  const keyword=String(f.get("paraulaClau")||"").trim();
  const number=nextExpNumber8739(year,obres);
  const built=buildExpedientCode8739({
    year,
    number,
    tipus,
    client:clientFinal,
    clientNom:clientFinal.nom,
    keyword,
    nom:f.get("nom"),
    subtitol:f.get("subtitol"),
    poblacio:f.get("poblacio")
  });
  const id=`obra-${year}-${padExp8739(number)}-${Date.now()}`;
  const propietatRaw=String(f.get("propietat")||"").trim();
  const obraNew={
    id,
    client:clientFinal.id,
    any:year,
    nom:String(f.get("nom")||"Nou expedient").trim()||"Nou expedient",
    subtitol:String(f.get("subtitol")||"Treball pendent de definir"),
    tipologia:tipus,
    tipusTreball:tipus,
    estat:String(f.get("estat")||"Pressupostada"),
    pressupost:0,
    certificacio:0,
    propietat:propietatRaw&&propietatRaw!=="Pendent"?propietatRaw:clientFinal.nom,
    nifPropietat:String(f.get("nifPropietat")||clientFinal.nif||"Pendent"),
    constructor:String(f.get("constructor")||"Pendent"),
    do:String(f.get("do")||"Pendent"),
    deo:String(f.get("deo")||"Héctor Cubero"),
    css:String(f.get("css")||"Pendent"),
    adreca:String(f.get("adreca")||"Pendent"),
    codiPostal:String(f.get("codiPostal")||cpForPoblacio8773(f.get("poblacio"))||""),
    poblacio:String(f.get("poblacio")||poblacioForCp8773(f.get("codiPostal"))||"Pendent"),
    rc:String(f.get("rc")||"Pendent"),
    paraulaClau:keyword,
    ...built,
    codiExpedient:built.codi,
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  learnCpPoblacio8775(obraNew.codiPostal,obraNew.poblacio);
  if(createClient){learnCpPoblacio8775(clientFinal.codiPostal,clientFinal.poblacio);setClients(p=>[clientFinal,...p]);}
  setObres(p=>[obraNew,...p]);
  setOdata(p=>({...p,[id]:emptyExpedientData8768(obraNew,clientFinal)}));
  setModal(null);
  setObraId(id);
  setClientId(clientFinal.id);
  setTab("Resum");
  nav("Obra");
}
function addEvent(e){e.preventDefault();let f=new FormData(e.currentTarget);setD(obraId,d=>({...d,events:[...d.events,{id:"e"+Date.now(),obraId,title:f.get("title"),day:+f.get("day"),month:+f.get("month"),year:+f.get("year"),type:f.get("type"),hora:f.get("hora"),note:f.get("note"),color:f.get("color"),client:client?.nom||"",obra:obra?.nom||"",adreca:obra?.adreca||""}]}));setModal(null)}
function addManualHours(e){e.preventDefault();let f=new FormData(e.currentTarget);let hi=f.get("inici"),hf=f.get("final");let h=calcHours(hi,hf);setD(obraId,d=>({...d,hores:[...d.hores,{id:"h"+Date.now(),data:f.get("data"),etiqueta:f.get("etiqueta"),tasca:f.get("tasca"),inici:hi,final:hf,hores:h,preu:+f.get("preu")||50}]}))}
function startTimer(){setTimer(t=>({...t,running:true,start:Date.now(),elapsed:0}))}
function stopTimer(){let h=Math.max(timer.elapsed/3600000,0.01);setD(obraId,d=>({...d,hores:[...d.hores,{id:"h"+Date.now(),data:new Date().toLocaleDateString("ca-ES"),etiqueta:timer.label,tasca:timer.task||"Temps cronometrat",inici:"—",final:"—",hores:h,preu:+timer.rate||50}]}));setTimer(t=>({...t,running:false,start:null,elapsed:0,task:""}))}
function deleteHour(id){setD(obraId,d=>({...d,hores:d.hores.filter(h=>h.id!==id)}))}
function calcHours(a,b){let [ah,am]=String(a).split(":").map(Number),[bh,bm]=String(b).split(":").map(Number);let mins=(bh*60+bm)-(ah*60+am);return Math.max(mins/60,0)}


if(!authOk8778)return <LoginScreen8778 onLogin={(u)=>setAuthUser8779(u)}/>;
return <><div className="user-global-badge-v8782"><span>USUARI ACTIU</span><b>{authUser8779}</b></div><div className={`app-shell ${collapsed?"nav-collapsed":""}`}>{menuOpen&&<div className="overlay" onClick={()=>setMenuOpen(false)}/>}<aside className={`sidebar ${menuOpen?"open":""}`}><div className="sidebar-head"><div className="brand">APP CONTROL D'OBRES</div><div className="active-user-v8780">Usuari: <b>{authUser8779}</b></div><button className="logout-mini-v8778" title="Sortir" onClick={()=>{sessionStorage.removeItem("aco_current_user8779");setClients([]);setObres([]);setOdata({});setAuthUser8779("")}}>Sortir</button><button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)}><Menu size={20}/></button><button className="close-menu" onClick={()=>setMenuOpen(false)}><X/></button></div><nav className="side-nav"><MB a={screen==="Inici"} i={<Building2/>} l={tt("Inici","Inicio","Home")} on={()=>nav("Inici")}/><MB a={screen==="Clients"||screen==="Fitxa client"} i={<Users/>} l={tt("Clients","Clientes","Clients")} on={()=>nav("Clients")}/><MB a={screen==="Treballs / Expedients"||screen==="Obra"} i={<FolderOpen/>} l={tt("Treballs / Expedients","Trabajos / Expedientes","Jobs / Files")} on={()=>nav("Treballs / Expedients")}/><MB a={screen==="Pressupostos"} i={<ClipboardList/>} l={tt("Pressupostos","Presupuestos","Quotes")} on={()=>nav("Pressupostos")}/><MB a={screen==="Factures"} i={<ReceiptText/>} l={tt("Factures","Facturas","Invoices")} on={()=>nav("Factures")}/><MB a={screen==="Traça"} i={<ReceiptText/>} l={tt("Gestió temps","Gestión tiempo","Time tracking")} on={()=>nav("Traça")}/><MB a={screen==="Agenda"} i={<CalendarDays/>} l={tt("Agenda / Calendari","Agenda / Calendario","Calendar")} on={()=>nav("Agenda")}/><MB a={screen==="Configuració"} i={<Settings/>} l={tt("Configuració","Configuración","Settings")} on={()=>nav("Configuració")}/></nav></aside><main className="main"><div className="mobile-top"><button onClick={()=>setMenuOpen(true)} className="hamb"><Menu/></button><b>CONTROL D'OBRES</b></div>
{screen==="Inici"&&<Inici clients={clients} obres={obres} odata={odata} events={[...Object.values(odata).flatMap(d=>d.events||[]),...invoiceAlerts8776(obres,odata)]} setScreen={nav} openObra={openObra} newObra={()=>setModal("obra")}/>}
{screen==="Clients"&&<Clients clients={fClients} obres={obres} odata={odata} cs={cs} setCs={setCs} ct={ct} setCt={setCt} openClient={openClient} newClient={()=>setModal("client")}/>}
{screen==="Fitxa client"&&<FitxaClient client={clients.find(c=>c.id===clientId)} obres={obres.filter(o=>o.client===clientId)} openObra={openObra} back={()=>nav("Clients")}/>}
{screen==="Treballs / Expedients"&&<Projectes byClient={byClient} clients={clients} openObra={openObra} deleteObra={deleteObra878112} f={{os,setOs,oc,setOc,oy,setOy,ost,setOst,ot,setOt}} newObra={()=>setModal("obra")} setScreen={nav}/>}
{screen==="Obra"&&<Obra obra={obra} client={client} clients={clients} allAgents={allAgents8749(odata)} data={data} setData={up=>setD(obraId,up)} tab={tab} setTab={setTab} setScreen={nav} uploadImage={file=>f2u(file,u=>setObres(p=>p.map(o=>o.id===obraId?{...o,imatge:u}:o)))} importExcel={importExcel} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} updateCert={updateCert} updateObraFitxa8721={updateObraFitxa8721} deleteCertificacio8721={deleteCertificacio8721} updateCertDate8721={updateCertDate8721} addCertificacio={addCertificacio} updateCertDate={updateCertDate} certInfo={certInfo} setCertInfo={setCertInfo} saveCert={saveCert} openEmail={emailDraft} openDoc={openDocSmart87103} openAgent={()=>setModal("agent")} openActa={()=>setModal("acta")} openPartida={()=>setModal("partida")} openEvent={()=>setModal("event")} selectedActaId={selActa} setSelectedActaId={setSelActa} timer={timer} setTimer={setTimer} startTimer={startTimer} stopTimer={stopTimer} addManualHours={addManualHours} deleteHour={deleteHour} addPressupostTecnic={addPressupostTecnic8742} updatePressupostTecnic={updatePressupostTecnic8742} facturarPressupostTecnic={facturarPressupostTecnic8742} addFacturaTecnica={addFacturaTecnica8742} updateFacturaTecnica={updateFacturaTecnica8743} deletePressupostTecnic={deletePressupostTecnic8744} deleteFacturaTecnica={deleteFacturaTecnica8744} deleteObra={deleteObra878112} clientHistoricalPartides={(obres||[]).filter(o=>o.client===obra?.client).flatMap(o=>(((odata||{})[o.id]?.partides)||[]).map(r=>({...r,sourceObra:o.nom,sourceObraId:o.id})))} />}
{screen==="Agenda"&&<SafeRenderBoundary878108><Agenda events={[...Object.entries(odata||{}).flatMap(([oid,d])=>Array.isArray(d?.events)?d.events.map(e=>({...e,obraId:e.obraId||oid,client:e.client||clients.find(c=>c.id===obres.find(o=>o.id===oid)?.client)?.nom,obra:e.obra||obres.find(o=>o.id===oid)?.nom,adreca:e.adreca||obres.find(o=>o.id===oid)?.adreca})):[]),...invoiceAlerts8776(obres,odata)]} clients={clients} obres={obres} openObra={openObra} openEvent={()=>setModal("event")} calM={calM} setCalM={setCalM} calY={calY} setCalY={setCalY} selDay={selDay} setSelDay={setSelDay} setOdata={setOdata}/></SafeRenderBoundary878108>}
{screen==="Avisos"&&<AvisosPanel openObra={openObra}/>}
{screen==="Pressupostos"&&<SafeRenderBoundary878108><HonorarisGeneral obres={obres} odata={odata} setOdata={setOdata} openObra={openObra} openObraTab={openObraTab}/></SafeRenderBoundary878108>}
{screen==="Factures"&&<SafeRenderBoundary878108><FacturesGeneral8738 obres={obres} odata={odata} setOdata={setOdata} openObra={openObra} openObraTab={openObraTab}/></SafeRenderBoundary878108>}
{screen==="Pressupostos honoraris"&&<HonorarisGeneral obres={obres} odata={odata} setOdata={setOdata} openObra={openObra}/>}{screen==="Configuració"&&<Configuracio/>}{screen==="Traça"&&<TracaGeneral obres={obres} odata={odata} openObra={openObra}/>}
{modal==="client"&&<Modal title="Nou client" close={()=>setModal(null)}><FormClient onSubmit={addClient}/></Modal>}{modal==="obra"&&<Modal title="Nou expedient" close={()=>setModal(null)}><SafeFormExpedient8751 clients={clients} onSubmit={addObra}/></Modal>}{modal==="partida"&&<Modal title="Nova partida" close={()=>setModal(null)}><FormPartida onSubmit={addPartida}/></Modal>}{modal==="agent"&&<Modal title="Nou agent de l’expedient" close={()=>setModal(null)}><FormAgent onSubmit={addAgent}/></Modal>}{modal==="acta"&&<Modal title="Nova acta d’expedient" close={()=>setModal(null)}><FormActa agents={ensureAgents8748(uniqAgents8749([...allAgents8749(odata),...(data.agents||[])]))} openAgent={()=>setModal("agent")} onSubmit={addActa}/></Modal>}{modal==="event"&&<Modal title="Nova cita o nota" close={()=>setModal(null)}><FormEvent clients={clients} obres={obres} calM={calM} calY={calY} selDay={selDay} onSubmit={addEvent}/></Modal>}{email&&<EmailModal draft={email} setDraft={setEmail} close={()=>setEmail(null)}/>} {doc&&<DocViewer doc={doc} obra={obra} client={client} close={()=>setDoc(null)} email={emailDraft}/>}</main></div></>
}

function MB({a,i,l,on}){return <button className={`menu-btn ${a?"active":""}`} onClick={on}>{i}<span>{l}</span></button>}
function Card({title,children,action}){return <div className="card"><div className="card-head"><h2>{title}</h2>{action}</div>{children}</div>}
function Input(p){return <label><span>{p.label}</span><input name={p.name} defaultValue={p.defaultValue} readOnly={p.readOnly} onChange={p.onChange}/></label>}
function Kpi({t,v}){return <div className="kpi"><small>{t}</small><strong>{v}</strong></div>}
function Empty({text}){return <div className="empty">{text}</div>}
function Badge({estat}){let e=String(estat||"");let cls=e==="Activa"||e==="Acceptada"?"ok":e==="Pressupostada"||e==="En procés"||e==="Pendent"?"warn":e==="Aturada"||e==="Descartada"||e==="No contestat"?"danger":e==="Tancada"?"dark":"info";return <span className={`badge ${cls}`}>{estat}</span>}

function timeValue8783(v){
  if(!v)return 0;
  if(typeof v==='number')return v;
  const s=String(v||'').trim();
  const iso=Date.parse(s);
  if(Number.isFinite(iso))return iso;
  const m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m){const y=(+m[3]<100?2000+(+m[3]):+m[3]);return new Date(y,+m[2]-1,+m[1]).getTime()}
  const n=s.match(/(\d{12,})/); if(n)return +n[1];
  return 0;
}
function eventTime8783(e){if(e?.year&&e?.day)return new Date(+e.year,+e.month||0,+e.day,+String(e.hora||'0').split(':')[0]||0,+String(e.hora||'0:0').split(':')[1]||0).getTime();return timeValue8783(e?.data||e?.createdAt||e?.updatedAt||e?.id)}
function itemTime8783(x){return Math.max(timeValue8783(x?.updatedAt),timeValue8783(x?.createdAt),timeValue8783(x?.data),eventTime8783(x),timeValue8783(x?.id))}
function obraScore8783(o,d={}){
  const vals=[timeValue8783(o?.updatedAt),timeValue8783(o?.createdAt),timeValue8783(d?.updatedAt)];
  ['documents','fotos','actes','events','hores','pressupostosTecnic','facturesTecnic','certificacions','factures'].forEach(k=>(d[k]||[]).forEach(x=>vals.push(itemTime8783(x))));
  Object.values(d.sectionDocs||{}).forEach(arr=>(arr||[]).forEach(x=>vals.push(itemTime8783(x))));
  return Math.max(0,...vals);
}
function fmtActivityDate8783(t){if(!t)return 'Sense data';const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleDateString('ca-ES'):'Sense data'}
function collectActivities8783(obres=[],odata={},clients=[]){
  const out=[];
  const clientName=o=>clients.find(c=>c.id===o.client)?.nom||o.propietat||'Client';
  for(const o of obres){
    const d=odata[o.id]||{};
    const push=(type,title,detail,t,tab)=>out.push({type,title,detail,time:t,obra:o,tab});
    push('Expedient','Expedient modificat',`${expedientCode8739(o)} · ${o.nom}`,obraScore8783(o,d),'Resum');
    (d.events||[]).forEach(e=>push('Agenda',e.title||e.titol||'Cita / avís',`${clientName(o)} · ${e.hora||''} · ${e.note||e.detail||''}`,eventTime8783(e),'Agenda / Avisos'));
    (d.actes||[]).forEach(a=>push('Acta',a.titol||'Acta',`${expedientCode8739(o)} · ${a.data||''}`,itemTime8783(a),'Actes'));
    (d.documents||[]).forEach(doc=>push('Document',doc.nom||'Document',`${doc.folder||'Documents'} · ${expedientCode8739(o)}`,itemTime8783(doc),'Documents'));
    Object.entries(d.sectionDocs||{}).forEach(([sec,arr])=>(arr||[]).forEach(doc=>push('Document',doc.nom||'Document',`${sec} · ${expedientCode8739(o)}`,itemTime8783(doc),'Documents')));
    (d.pressupostosTecnic||[]).forEach(p=>push('Pressupost',p.concepte||'Pressupost honoraris',`${money(p.base||0)} · ${p.estat||'Pendent'}`,itemTime8783(p),'Honoraris'));
    (d.facturesTecnic||[]).forEach(f=>push('Factura',f.concepte||'Factura honoraris',`${money(f.base||0)} · ${f.estat||'Pendent'}`,itemTime8783(f),'Honoraris'));
    (d.certificacions||[]).forEach(c=>push('Certificació',`Certificació ${c.numero||''}`,`${money(c.import||0)} · ${expedientCode8739(o)}`,itemTime8783(c),'Gestió obra'));
    (d.hores||[]).forEach(h=>push('Temps',h.tasca||h.etiqueta||'Registre de temps',`${qty2(h.hores||0)} h · ${money((+h.hores||0)*(+h.preu||0))}`,itemTime8783(h),'Gestió temps'));
  }
  return out.filter(a=>a.time).sort((a,b)=>b.time-a.time);
}
function certQty8783(r,n){
  if(n<=0)return 0;
  const lines=(r.certMesuresByNum||{})[String(n)];
  if(lines&&lines.length)return medicioTotal8780(lines,r.ut);
  if(r.certsByNum&&r.certsByNum[String(n)]!==undefined)return +r.certsByNum[String(n)]||0;
  if(n===1)return +r.certAnterior||0;
  if(n===2)return +r.certActual||0;
  return 0;
}
function certTotalsForPrint8780(rows=[],doc={}){
  const nums=new Set([...(doc.prevNum?[doc.prevNum]:[]),...(doc.certNum?[doc.certNum]:[])]);
  rows.forEach(r=>{Object.keys(r.certsByNum||{}).forEach(n=>nums.add(+n));Object.keys(r.certMesuresByNum||{}).forEach(n=>nums.add(+n));});
  return [...nums].filter(n=>Number.isFinite(+n)&&+n>0).sort((a,b)=>a-b).map(n=>({n,total:rows.reduce((s,r)=>s+certQty8783(r,+n)*(+r.pu||0),0)}));
}
function certTotalsUpTo8793(rows=[],certNum=1){
  const max=Number(certNum)||1;
  const nums=new Set();
  for(let i=1;i<=max;i++)nums.add(i);
  rows.forEach(r=>{Object.keys(r.certsByNum||{}).forEach(n=>{n=+n;if(n>0&&n<=max)nums.add(n)});Object.keys(r.certMesuresByNum||{}).forEach(n=>{n=+n;if(n>0&&n<=max)nums.add(n)});});
  return [...nums].filter(n=>Number.isFinite(n)&&n>0&&n<=max).sort((a,b)=>a-b).map(n=>({n,total:rows.reduce((s,r)=>s+certQty8783(r,n)*(+r.pu||0),0)}));
}
function originRowsForCert8793(rows=[],certNum=1){
  const max=Number(certNum)||1;
  return (rows||[]).map(r=>{
    let qOrigin=0;
    for(let i=1;i<=max;i++)qOrigin+=certQty8783(r,i);
    const impOrigin=qOrigin*(+r.pu||0);
    return {...r,qOrigin,impOrigin,pctOrigin:(+r.q||0)?qOrigin/(+r.q)*100:0};
  }).filter(r=>(+r.qOrigin||0)>0 || (+r.impOrigin||0)>0);
}
function certFinancialSummary8793(rows=[],certNum=1){
  const certTotals=certTotalsUpTo8793(rows,certNum);
  const totalOrigen=certTotals.reduce((s,c)=>s+(+c.total||0),0);
  const anterior=certTotals.filter(c=>+c.n<+certNum).reduce((s,c)=>s+(+c.total||0),0);
  const actual=totalOrigen-anterior;
  return {certTotals,totalOrigen,anterior,actual};
}


function originRowsFromDoc8794(rows=[],certNum=1){
  const max=Number(certNum)||1;
  return (rows||[]).map(r=>{
    const qOrigin = r.qOrigen!==undefined ? (+r.qOrigen||0) : (r.qOrigin!==undefined ? (+r.qOrigin||0) : (()=>{let t=0;for(let i=1;i<=max;i++)t+=certQty8783(r,i);return t;})());
    const impOrigin = r.impOrigen!==undefined ? (+r.impOrigen||0) : (r.impOrigin!==undefined ? (+r.impOrigin||0) : qOrigin*(+r.pu||0));
    const pctOrigin = r.pctOrigen!==undefined ? (+r.pctOrigen||0) : (r.pctOrigin!==undefined ? (+r.pctOrigin||0) : ((+r.q||0)?qOrigin/(+r.q)*100:0));
    return {...r,qOrigin,impOrigin,pctOrigin};
  }).filter(r=>(+r.qOrigin||0)>0 || (+r.impOrigin||0)>0);
}
function certFinancialSummaryFromDoc8794(rows=[],certNum=1,doc={}){
  const max=Number(certNum)||1;
  const nums=new Set();
  for(let i=1;i<=max;i++)nums.add(i);
  (rows||[]).forEach(r=>{
    Object.keys(r.certsByNum||{}).forEach(n=>{n=+n;if(n>0&&n<=max)nums.add(n)});
    Object.keys(r.certMesuresByNum||{}).forEach(n=>{n=+n;if(n>0&&n<=max)nums.add(n)});
  });
  const certTotals=[...nums].filter(n=>Number.isFinite(n)&&n>0&&n<=max).sort((a,b)=>a-b).map(n=>({
    n,
    total:(rows||[]).reduce((sum,r)=>{
      let q=certQty8783(r,n);
      if(n===max && r.qAct!==undefined) q=+r.qAct||0;
      return sum+q*(+r.pu||0);
    },0)
  }));
  const originRows=originRowsFromDoc8794(rows,max);
  const totalOrigen = doc.totalOrigen!==undefined ? (+doc.totalOrigen||0) : originRows.reduce((s,r)=>s+(+r.impOrigin||0),0);
  const anterior = certTotals.filter(c=>+c.n<max).reduce((s,c)=>s+(+c.total||0),0);
  const actual = totalOrigen - anterior;
  return {certTotals,totalOrigen,anterior,actual,prevTotals:certTotals.filter(c=>+c.n<max)};
}

function Inici({clients,obres,odata={},events,setScreen,openObra,newObra}){
const actius=obres.filter(o=>o.estat!=="Tancada").length;
const activities=collectActivities8783(obres,odata,clients);
const recents=[...obres].sort((a,b)=>obraScore8783(b,odata[b.id]||{})-obraScore8783(a,odata[a.id]||{})).slice(0,4);
const pendents=[...obres].filter(o=>["Pressupostada","En procés","Pendent"].includes(o.estat)).sort((a,b)=>obraScore8783(b,odata[b.id]||{})-obraScore8783(a,odata[a.id]||{})).slice(0,4);
const autoFacturesPendents=(events||[]).filter(e=>e.auto&&String(e.id||"").startsWith("av-fact-"));
const properes=[...(events||[])].sort((a,b)=>eventTime8783(a)-eventTime8783(b)).slice(0,4);
return <>
<section className="hero hero-v8737"><div className="app-logo">CO</div><div><h1>Control d'Expedients</h1><p>Mòdul Tècnic per arquitectes tècnics: expedients, agenda, actes, documents, gestió del temps, pressupostos i factures del tècnic al client.</p><span className="version-badge soft">Versió 87.111 finances i agenda refinades</span></div><div className="user-card"><strong>Free · Mòdul Tècnic</strong><span>2 expedients inclosos</span><span>Agenda inclosa des del primer dia</span></div></section>
<section className="home-actions-v8737"><button className="primary" onClick={newObra}><Plus/> Nou expedient</button><button className="secondary" onClick={()=>setScreen("Treballs / Expedients")}><FolderOpen/> Veure expedients</button><button className="secondary" onClick={()=>setScreen("Agenda")}><CalendarDays/> Obrir agenda</button><button className="secondary" onClick={()=>setScreen("Configuració")}><Settings/> Pla i mòduls</button></section>
<section className="kpi-grid"><button className="kpi" onClick={()=>setScreen("Clients")}><small>CLIENTS</small><strong>{clients.length}</strong></button><button className="kpi" onClick={()=>setScreen("Treballs / Expedients")}><small>EXPEDIENTS OBERTS</small><strong>{actius}</strong></button><button className="kpi" onClick={()=>setScreen("Agenda")}><small>AGENDA / AVISOS</small><strong>{events.length||0}</strong></button></section>{autoFacturesPendents.length>0&&<section className="home-alerts-v8776">{autoFacturesPendents.slice(0,4).map(a=><button key={a.id} onClick={()=>a.obraId?openObra(a.obraId):setScreen("Factures")}><b>Factura pendent de cobrament</b><span>{a.obra} · {a.detail}</span></button>)}</section>}
<section className="dashboard-grid dashboard-grid-v8741">
  <div className="stack">
    <Card title="Expedients recents"><div className="list compact-list-v8741">{recents.length?recents.map(o=><ObraRow key={o.id} o={o} open={openObra}/>):<Empty text="Encara no hi ha expedients."/>}</div></Card>
    <Card title="Darreres actuacions i avisos"><div className="activity-panel-v8741">
      {activities.length?activities.slice(0,6).map(a=><button key={`${a.type}-${a.time}-${a.title}`} className="activity-row-v8741" onClick={()=>openObra(a.obra.id)}><b>{a.type} · {a.title}</b><span>{fmtActivityDate8783(a.time)} · {a.detail}</span></button>):<Empty text="Encara no hi ha moviments registrats."/>}
      <button className="activity-row-v8741" onClick={()=>setScreen("Treballs / Expedients")}><b>Revisar llistat general</b><span>Veure tots els expedients ordenats i filtrar per tipus de treball.</span></button>
    </div></Card>
  </div>
  <Card title="Panell de treball del dia"><div className="home-work-panel-v8741 home-work-panel-v8742">
    <div className="home-panel-section-v8741"><h3>Pròximes cites / avisos</h3>{properes.length===0?<p>No hi ha cites registrades. Crea visites, entregues o recordatoris des de l’agenda.</p>:properes.map(e=><button key={e.id} onClick={()=>setScreen("Agenda")}><b>{e.title||e.titol||"Cita"}</b><span>{e.day?`${String(e.day).padStart(2,'0')}/${String((+e.month||0)+1).padStart(2,'0')}/${e.year}`:(fmtAppDate8748(e.data)||"Sense data")} · {e.hora||""}</span></button>)}</div>
    <div className="home-panel-section-v8741"><h3>Seguiment pendent</h3>{pendents.length===0?<p>No tens expedients pendents destacats.</p>:pendents.slice(0,3).map(o=><button key={o.id} onClick={()=>openObra(o.id)}><b>{o.estat}</b><span>{expedientCode8739(o)} · {o.nom}</span></button>)}</div>
    <div className="home-panel-section-v8741"><h3>Últims moviments tècnics</h3>{activities.length===0?<p>Sense moviments tècnics encara.</p>:activities.slice(0,5).map(a=><button key={`mov-${a.type}-${a.time}-${a.title}`} onClick={()=>openObra(a.obra.id)}><b>{a.title}</b><span>{a.type} · {expedientCode8739(a.obra)} · {fmtActivityDate8783(a.time)}</span></button>)}</div>
    <div className="home-quick-v8741"><button className="primary" onClick={newObra}>+ Nou expedient</button><button className="secondary" onClick={()=>setScreen("Treballs / Expedients")}>Llistat expedients</button><button className="secondary" onClick={()=>setScreen("Pressupostos")}>Pressupostos</button><button className="secondary" onClick={()=>setScreen("Factures")}>Factures</button></div>
  </div></Card>
</section>
</>}
function Clients({clients,obres=[],odata={},cs,setCs,ct,setCt,openClient,newClient}){
  const tipusOpts=["Promotor","Arquitecte","Arquitecte tècnic","Direcció Facultativa","Constructor","Constructora","Industrial","Administració","Particular","Autònom","Subcontractat","Altres"];
  const docsCount=(oid)=>{
    const d=odata?.[oid]||{};
    const base=(d.documents||[]).length+(d.fotos||[]).length;
    const sections=Object.values(d.sectionDocs||{}).reduce((sum,a)=>sum+(a||[]).length,0);
    const actaDocs=(d.actes||[]).reduce((sum,a)=>sum+(a.docs||[]).length+(a.croquis||[]).length,0);
    return base+sections+actaDocs;
  };
  const relatedToClient=(c)=>{
    const direct=obres.filter(o=>o.client===c.id || (o.propietat||"").toLowerCase()===(c.nom||"").toLowerCase());
    const byAgent=obres.filter(o=>{
      const d=odata?.[o.id]||{};
      return (d.agents||[]).some(a=>String(a.nom||"").toLowerCase().includes(String(c.nom||"").toLowerCase()) || String(c.nom||"").toLowerCase().includes(String(a.nom||"").toLowerCase()));
    }).filter(o=>!direct.some(x=>x.id===o.id));
    return {direct,byAgent,all:[...direct,...byAgent]};
  };
  const total=clients.length;
  const industrials=clients.filter(c=>["Industrial","Constructor","Constructora","Subcontractat"].includes(c.tipus)).length;
  const grouped=tipusOpts.map(t=>[t,clients.filter(c=>(c.tipus||"Altres")===t)]).filter(([,arr])=>arr.length);
  const altres=clients.filter(c=>!tipusOpts.includes(c.tipus||"Altres"));
  if(altres.length)grouped.push(["Altres",altres]);
  return <div className="clients-page-v8774">
    <Card title="Clients, tècnics i industrials" action={<button className="primary" onClick={newClient}><Plus/> Nou contacte</button>}>
      <div className="clients-toolbar-v8774">
        <div><h2>Directori professional del despatx</h2><p>Llista única de clients contractants, promotors, constructors, industrials i tècnics. Cada contacte pot quedar vinculat a expedients, documents, actes o gestió integral d’obra.</p></div>
        <div className="clients-kpis-v8774"><div><span>Total contactes</span><b>{total}</b></div><div><span>Industrials / obra</span><b>{industrials}</b></div><div><span>Tipologies</span><b>{grouped.length}</b></div></div>
      </div>
      <div className="filters filters-v8774"><div className="search-field"><Search size={16}/><input value={cs} onChange={e=>setCs(e.target.value)} placeholder="Buscar client, industrial, tècnic, telèfon, població..."/></div><select value={ct} onChange={e=>setCt(e.target.value)}><option value="">Totes les tipologies</option>{tipusOpts.map(t=><option key={t}>{t}</option>)}</select></div>
      <div className="client-list-v8774">
        {clients.length===0?<Empty text="No hi ha contactes amb aquest filtre."/>:grouped.map(([tipus,items])=><section key={tipus} className="client-type-section-v8774"><div className="client-type-head-v8774"><b>{tipus}</b><span>{items.length} contacte{items.length!==1?"s":""}</span></div>{items.map(c=>{const rel=relatedToClient(c);const docs=rel.all.reduce((sum,o)=>sum+docsCount(o.id),0);return <button className="client-row-v8774" key={c.id} onClick={()=>openClient(c.id)}><div className={`client-logo ${c.color||"blue"}`}>{c.logo?<img src={c.logo}/>:(c.nom||"CL").slice(0,2).toUpperCase()}</div><div className="client-main-v8774"><strong>{c.nom}</strong><span>{c.rao||"Raó social pendent"}</span><small>{c.contacte||"Sense contacte"} · {c.telefon||"Sense telèfon"} · {[c.codiPostal,c.poblacio].filter(Boolean).join(" ")||c.adreca||"Sense població"}</small></div><div className="client-metrics-v8774"><span>Expedients</span><b>{rel.all.length}</b><em>{rel.direct.length} directes · {rel.byAgent.length} com agent</em></div><div className="client-metrics-v8774"><span>Documents</span><b>{docs}</b><em>vinculats</em></div><div className="client-tag-v8774">{c.tipus||"Client"}</div></button>})}</section>)}
      </div>
    </Card>
  </div>
}

function FitxaClient({client,obres,openObra,back}){
  const [edit,setEdit]=useState(false);
  const [showDetails,setShowDetails]=useState(false);
  const [form,setForm]=useState({...client});
  const tipus=["Promotor","Arquitecte","Arquitecte tècnic","Direcció Facultativa","Constructor","Constructora","Autònom","Subcontractat","Industrial","Administració","Particular","Altres"];
  const treball=WORK_TYPES8737;
  function set(k,v){setForm(f=>({...f,[k]:v}))}
  function changeCp(v){setForm(f=>{const pob=poblacioForCp8773(v);return {...f,codiPostal:v,poblacio:pob||f.poblacio,provincia:provinciaForCp8773(v)||f.provincia}})}
  function changePoblacio(v){setForm(f=>{const cp=cpForPoblacio8773(v);return {...f,poblacio:v,codiPostal:cp||f.codiPostal,provincia:provinciaForCp8773(cp)||provinciaForPoblacio8773(v)||f.provincia}})}
  function save(){
    const fixed={...form};
    if(fixed.rao && fixed.nif && sameFiscalValue87101(fixed.rao,fixed.nif)) fixed.rao=fixed.nom||fixed.rao;
    if(!fixed.nom||!fixed.rao||!fixed.nif||!fixed.adreca||!fixed.codiPostal||!fixed.poblacio){alert("Cal emplenar els camps obligatoris: nom/raó social, NIF/CIF, adreça, codi postal i població.");return}
    learnCpPoblacio8775(fixed.codiPostal,fixed.poblacio);
    try{let k=lsKey8779("aco_clients");let all=JSON.parse(localStorage.getItem(k)||"[]");all=all.map(c=>c.id===client.id?{...c,...fixed}:c);localStorage.setItem(k,JSON.stringify(all));}catch(e){}
    Object.assign(client,fixed);
    setForm(fixed);
    setEdit(false);
    alert("Client guardat.");
  }
  return <div className="stack client-fitxa-v8773"><button className="secondary" onClick={back}>← Tornar</button><Card title={form.nom||client.nom} action={<div className="actions-inline"><button className="secondary" onClick={()=>setShowDetails(v=>!v)}>{showDetails?"Amagar dades":"Veure dades"}</button><button className="secondary" onClick={()=>{setShowDetails(true);setEdit(!edit)}}>{edit?"Tancar edició":"Editar client"}</button>{edit&&<button className="primary" onClick={save}>Guardar client</button>}</div>}>
    <DatalistCP8773/>
    <div className="client-profile-v8773"><div className="client-logo big">{form.logo?<img src={form.logo}/>:(form.nom||"CL").slice(0,2).toUpperCase()}</div><div><h2>{form.nom||"Client"}</h2><p>{form.rao||"Raó social pendent"}</p><span>{form.tipus||"Client"} · {form.contacte||"Sense contacte"}</span></div>{edit&&<label className="upload-label secondary">Canviar logo<input type="file" accept="image/*" onChange={e=>f2u(e.target.files[0],u=>set("logo",u))}/></label>}</div>
    {showDetails&&<div className="form-grid client-details-collapsible-v87106">
      <label><span>Nom visible / raó social *</span><input list="clients-mem" value={form.nom||""} onChange={e=>set("nom",e.target.value)} disabled={!edit}/><datalist id="clients-mem"><option>SOCOTERM</option><option>BRAVA CONSTRUCCIONS</option><option>RICARDO · COPROCAT</option></datalist></label>
      <label><span>Nom fiscal alternatiu</span><input value={form.rao||""} onChange={e=>set("rao",e.target.value)} disabled={!edit} placeholder="Nom fiscal si és diferent del nom visible"/></label>
      <label><span>Tipologia de client</span><select value={form.tipus||""} onChange={e=>set("tipus",e.target.value)} disabled={!edit}>{tipus.map(t=><option key={t}>{t}</option>)}</select></label>
      <label><span>Tipologia habitual de treball</span><select value={form.treball||"Pressupost d’obra / amidaments"} onChange={e=>set("treball",e.target.value)} disabled={!edit}>{treball.map(t=><option key={t}>{t}</option>)}</select></label>
      <label><span>NIF/CIF fiscal *</span><input value={form.nif||""} onChange={e=>set("nif",e.target.value)} disabled={!edit}/></label>
      <label><span>Contacte</span><input value={form.contacte||""} onChange={e=>set("contacte",e.target.value)} disabled={!edit}/></label>
      <label><span>Email</span><input value={form.email||""} onChange={e=>set("email",e.target.value)} disabled={!edit}/></label>
      <label><span>Telèfon</span><input value={form.telefon||""} onChange={e=>set("telefon",e.target.value)} disabled={!edit}/></label>
      <label className="span-all"><span>Adreça</span><input value={form.adreca||""} onChange={e=>set("adreca",e.target.value)} disabled={!edit}/></label>
      <label><span>Codi postal</span><input list="cp-list-v8773" value={form.codiPostal||""} onChange={e=>changeCp(e.target.value)} disabled={!edit}/></label>
      <label><span>Població</span><input list="poblacio-list-v8773" value={form.poblacio||""} onChange={e=>changePoblacio(e.target.value)} disabled={!edit}/></label>
      <label><span>Província</span><input value={form.provincia||provinciaForCp8773(form.codiPostal)||provinciaForPoblacio8773(form.poblacio)||""} onChange={e=>set("provincia",e.target.value)} disabled={!edit}/></label>
      <label className="span-all"><span>Observacions / criteris client</span><textarea value={form.observacions||""} onChange={e=>set("observacions",e.target.value)} disabled={!edit}/></label>
    </div>}
  </Card><ClientExpedientsList878108 obres={obres} openObra={openObra} clientName={form.nom||client.nom}/></div>
}

function ClientExpedientsList878108({obres=[],openObra,clientName="client"}){
  const [q,setQ]=useState("");
  const [estat,setEstat]=useState("");
  const [any,setAny]=useState("");
  const rows=[...(obres||[])].filter(Boolean).filter(o=>{
    const text=(expedientCode8739(o)+" "+(o.nom||"")+" "+(o.subtitol||"")+" "+(o.tipusTreball||o.tipologia||"")+" "+(o.poblacio||"")).toLowerCase();
    return (!q||text.includes(q.toLowerCase())) && (!estat||o.estat===estat) && (!any||String(o.any||"")===String(any));
  }).sort((a,b)=>String(expedientCode8739(a)).localeCompare(String(expedientCode8739(b)),"ca",{numeric:true}));
  const anys=[...new Set((obres||[]).map(o=>o.any).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a),"ca",{numeric:true}));
  const estats=[...new Set((obres||[]).map(o=>o.estat||"Sense estat"))];
  const byYear=rows.reduce((m,o)=>{const y=o.any||"Sense any";(m[y]??=[]).push(o);return m;},{});
  return <Card title={`Expedients vinculats a ${clientName}`} action={<span className="muted">{rows.length} expedient{rows.length===1?"":"s"}</span>}>
    <div className="filters client-exp-filters-v878108"><div className="search-field"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtrar expedients del client..."/></div><select value={any} onChange={e=>setAny(e.target.value)}><option value="">Tots els anys</option>{anys.map(y=><option key={y}>{y}</option>)}</select><select value={estat} onChange={e=>setEstat(e.target.value)}><option value="">Tots els estats</option>{estats.map(e=><option key={e}>{e}</option>)}</select></div>
    <div className="list">{rows.length===0?<Empty text="Aquest client encara no té expedients amb aquest filtre."/>:Object.entries(byYear).sort((a,b)=>String(b[0]).localeCompare(String(a[0]),"ca",{numeric:true})).map(([y,items])=><section key={y} className="year-section"><div className="year-title">{y}</div>{items.map(o=><ObraRow key={o.id} o={o} open={openObra}/>)}</section>)}</div>
  </Card>
}

function Projectes({byClient,clients,openObra,deleteObra,f,newObra,setScreen}){
let flat=[];Object.entries(byClient||{}).forEach(([cid,ys])=>Object.entries(ys||{}).forEach(([y,items])=>(items||[]).forEach(o=>flat.push(o))));
flat.sort((a,b)=>String(expedientCode8739(b)).localeCompare(String(expedientCode8739(a))));
let total=flat.length, actius=flat.filter(o=>o.estat!=="Tancada").length;
let tipusCount=flat.reduce((m,o)=>{let t=moduleLabel8737(o);m[t]=(m[t]||0)+1;return m},{});
let estatCount=flat.reduce((m,o)=>{let t=o.estat||"Sense estat";m[t]=(m[t]||0)+1;return m},{});
let anys=[...new Set(flat.map(o=>o.any||String(new Date().getFullYear())))].sort((a,b)=>String(b).localeCompare(String(a)));
let topTipus=Object.entries(tipusCount).sort((a,b)=>b[1]-a[1]);
let clientNom=o=>clients.find(x=>x.id===o.client)?.nom||o.propietat||"—";
let clearAll=()=>{f.setOs("");f.setOc("");f.setOt("");f.setOy("");f.setOst("")};
return <div className="expedients-page-v8741 expedients-page-v8742">
  <Card title="Llistat professional d’expedients" action={<button className="primary" onClick={newObra}><Plus/> Nou expedient</button>}>
    <div className="filters filters-v8741 filters-v8742">
      <div className="search-field"><Search size={16}/><input value={f.os} onChange={e=>f.setOs(e.target.value)} placeholder="Buscar per número, codi, client, treball, adreça o municipi..."/></div>
      <select value={f.oc} onChange={e=>f.setOc(e.target.value)}><option value="">Tots els clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select>
      <select value={f.ot||""} onChange={e=>f.setOt(e.target.value)}><option value="">Tots els tipus de treball</option>{WORK_TYPES8737.map(t=><option key={t} value={t}>{t}</option>)}</select>
      <select value={f.oy} onChange={e=>f.setOy(e.target.value)}><option value="">Tots els anys</option><option>2026</option><option>2025</option></select>
      <select value={f.ost} onChange={e=>f.setOst(e.target.value)}><option value="">Tots els estats</option><option>Activa</option><option>En procés</option><option>Pressupostada</option><option>Acceptada</option><option>Tancada</option></select>
    </div>
    <div className="exp-list-header-v8741"><span>{total} expedients filtrats</span><div className="actions-inline"><button className="secondary" onClick={clearAll}>Netejar filtres</button>{f.ot&&<button className="secondary" onClick={()=>f.setOt("")}>Tornar a tots els tipus</button>}</div></div>
    <div className="exp-table-wrap-v8741">
      <table className="exp-table-v8741 exp-table-v8742">
        <thead><tr><th>Número</th><th>Codi expedient</th><th>Client</th><th>Nom treball</th><th>Tipologia treball</th><th>Adreça / municipi</th><th>Estat</th><th>Accions</th></tr></thead>
        <tbody>{flat.length===0&&<tr><td colSpan="8"><Empty text="No hi ha expedients amb aquest filtre."/></td></tr>}{anys.map(any=><>
          <tr className="year-row-v8742"><td colSpan="8">{any}</td></tr>
          {flat.filter(o=>String(o.any||"")===String(any)).map(o=><tr key={o.id} onClick={()=>openObra(o.id)}><td><b>{o.expedientBase||String(expedientCode8739(o)).slice(0,8)}</b></td><td><span className="exp-code-v8739">{expedientCode8739(o)}</span></td><td>{clientNom(o)}</td><td><strong>{o.nom}</strong><small>{o.subtitol}</small></td><td>{moduleLabel8737(o)}</td><td><span>{o.adreca||"—"}</span><small>{o.poblacio||"—"}</small></td><td><Badge estat={o.estat}/></td><td><button type="button" className="danger small-v8777" onClick={(e)=>{e.stopPropagation();deleteObra?.(o.id)}}>Eliminar</button></td></tr>)}
        </>)}</tbody>
      </table>
    </div>
  </Card>
  <aside className="exp-side-v8741 exp-side-v8742">
    <Card title="Filtres i resum"><div className="exp-side-kpis-v8741"><div><span>Total filtrat</span><b>{total}</b></div><div><span>Oberts</span><b>{actius}</b></div></div><div className="active-filter-box-v8742"><b>Filtre actual</b><span>{f.ot||f.oc||f.oy||f.ost||f.os?`${f.ot||"Tots els tipus"} · ${f.ost||"Tots els estats"}`:"Sense filtres actius"}</span><button className="secondary" onClick={clearAll}>Veure tots</button></div><div className="exp-side-list-v8741"><h4>Estat dels expedients</h4>{Object.entries(estatCount).map(([t,n])=><button key={t} onClick={()=>f.setOst(t)}><span>{t}</span><b>{n}</b></button>)}</div></Card>
    <Card title="Filtrar per tipus de treball"><div className="exp-side-list-v8741 type-filter-list-v8742"><button className={!f.ot?"active":""} onClick={()=>f.setOt("")}><span>Tots els tipus</span><b>{flat.length}</b></button>{topTipus.length===0?<p>Sense dades.</p>:topTipus.map(([t,n])=><button key={t} className={f.ot===t?"active":""} onClick={()=>f.setOt(t)}><span>{t}</span><b>{n}</b></button>)}</div></Card>
    <Card title="Accions ràpides"><div className="quick-side-v8742"><button className="primary" onClick={newObra}>+ Nou expedient</button><button className="secondary" onClick={()=>setScreen?.("Agenda")}>Obrir agenda</button><button className="secondary" onClick={()=>setScreen?.("Pressupostos")}>Pressupostos</button><button className="secondary" onClick={()=>setScreen?.("Factures")}>Factures</button></div></Card>
  </aside>
</div>}function ObraRow({o,open}){return <button onClick={()=>open(o.id)} className="obra-row obra-row-code-v8739"><div className="thumb">{o.imatge?<img src={o.imatge}/> : "FOTO"}</div><div className="grow"><small className="exp-code-v8739">{expedientCode8739(o)}</small><strong>{o.nom}</strong><span>{o.subtitol}</span><em>{moduleLabel8737(o)} · {o.poblacio||"Sense municipi"}</em></div><Badge estat={o.estat}/></button>}

function EditObraModal8725({obra,clients=[],close,save}){
const clientNames=[...new Set((clients||[]).map(c=>c.nom).filter(Boolean))];
const serveisBase=WORK_TYPES8737;
const serveis=[...new Set([canonicalWorkType8740(obra.tipusTreball||obra.tipologia),...serveisBase].filter(Boolean))];
const estats=["Acceptada","Pressupostada","En procés","No contestat","Pendent","Activa","Aturada","Tancada","Descartada"];
const[f,setF]=useState(()=>({...obra}));
function ch(k,v){setF(x=>({...x,[k]:v}))}
function selectClient(nom){
  const c=(clients||[]).find(x=>x.nom===nom);
  setF(x=>({
    ...x,
    propietat:nom,
    nifPropietat:x.nifPropietat||c?.nif||c?.nifPropietat||"",
  }));
}
return <Modal title="Modificar fitxa de l’obra" close={close}>
  <div className="form-grid fitxa-form-v8727"><DatalistCP8773/><label><span>Codi expedient</span><input value={expedientCode8739(f)} readOnly /></label>
    <label><span>Client</span><select value={clientNames.includes(f.propietat)?f.propietat:"__nou__"} onChange={e=>e.target.value==="__nou__"?ch("propietat",""):selectClient(e.target.value)}>
      <option value="__nou__">Escriure client nou</option>
      {clientNames.map(n=><option key={n} value={n}>{n}</option>)}
    </select></label>
    <label><span>Client nou / promotor</span><input value={f.propietat||""} onChange={e=>ch("propietat",e.target.value)} /></label>
    <label><span>NIF client</span><input value={f.nifPropietat||""} onChange={e=>ch("nifPropietat",e.target.value)} /></label>
    <label><span>Adreça</span><input value={f.adreca||""} onChange={e=>ch("adreca",e.target.value)} /></label>
    <label><span>Codi postal</span><input list="cp-list-v8773" value={f.codiPostal||""} onChange={e=>{const v=e.target.value;const pob=poblacioForCp8773(v);setF(x=>({...x,codiPostal:v,poblacio:pob||x.poblacio}))}} /></label><label><span>Població</span><input list="poblacio-list-v8773" value={f.poblacio||""} onChange={e=>{const v=e.target.value;const cp=cpForPoblacio8773(v);setF(x=>({...x,poblacio:v,codiPostal:cp||x.codiPostal}))}} /></label>
    <label><span>Referència cadastral</span><input value={f.rc||""} onChange={e=>ch("rc",e.target.value)} /></label>
    <label><span>Tipus de treball</span><select value={canonicalWorkType8740(f.tipusTreball||f.tipologia||"")} onChange={e=>{const t=canonicalWorkType8740(e.target.value);ch("tipusTreball",t);ch("tipologia",t)}}>
      {serveis.map(t=><option key={t} value={t}>{t}</option>)}
    </select></label>
    <label><span>Estat</span><select value={f.estat||"Pressupostada"} onChange={e=>ch("estat",e.target.value)}>
      {estats.map(e=><option key={e} value={e}>{e}</option>)}
    </select></label>
    <label><span>Subtítol</span><input value={f.subtitol||""} onChange={e=>ch("subtitol",e.target.value)} /></label>
    <label><span>Nom obra</span><input value={f.nom||""} onChange={e=>ch("nom",e.target.value)} /></label>
  </div>
  <div className="modal-actions">
    <button className="secondary" onClick={close}>Cancel·lar</button>
    <button className="primary" onClick={()=>save(f)}>Guardar canvis</button>
  </div>
</Modal>
}



function hasModule2Access8747(){
  try{
    const cfg=JSON.parse(lsGet8779("aco_config_v60")||"{}");
    if(cfg.modul2Actiu!==undefined)return !!cfg.modul2Actiu;
  }catch(e){}
  return lsGet8779("aco_modul2_actiu")==="1";
}
function ModulLocked8747(){return <Card title="Mòdul 2 · Control econòmic d’obra"><div className="locked-module-v8747"><div><b>Aquesta funcionalitat forma part del Mòdul 2</b><p>Inclou pressupost d’obra, certificacions, facturació d’obra i seguiment econòmic bàsic. El Mòdul 1 Tècnic manté els pressupostos i factures del tècnic al client.</p></div><button className="primary" onClick={()=>{lsSet8779("aco_modul2_actiu","1");location.reload()}}>Activar Mòdul 2 en mode prova</button></div></Card>}


function FitxaDadesTab8769({obra,client,save,allAgents=[],setData,openAgent}){
  const [form,setForm]=useState(()=>({...obra,codiPostal:obra.codiPostal||""}));
  useEffect(()=>setForm({...obra,codiPostal:obra.codiPostal||""}),[obra.id]);
  const agents=uniqAgents8768([...(allAgents||[])]);
  const agentNames=[...new Set(agents.map(a=>a.nom).filter(Boolean))];
  function upd(k,v){setForm(p=>({...p,[k]:v}))}
  function changeCp(v){setForm(p=>{const pob=poblacioForCp8773(v);return {...p,codiPostal:v,poblacio:pob||p.poblacio}})}
  function changePoblacio(v){setForm(p=>{const cp=cpForPoblacio8773(v);return {...p,poblacio:v,codiPostal:cp||p.codiPostal}})}
  function saveAll(){learnCpPoblacio8775(form.codiPostal,form.poblacio);save?.({...form,provincia:provinciaForCp8773(form.codiPostal)||provinciaForPoblacio8773(form.poblacio)||form.provincia||""})}
  function AgentPicker({field,label}){
    const current=form[field]||"";
    const selected=agentNames.includes(current)?current:(current&&current!=="Pendent"?"__custom__":"");
    return <label><span>{label}</span><select value={selected} onChange={e=>e.target.value==="__custom__"?upd(field,""):upd(field,e.target.value||"Pendent")}><option value="">Pendent</option>{agentNames.map(n=><option key={field+n} value={n}>{n}</option>)}<option value="__custom__">+ Escriure / crear nou</option></select>{(selected==="__custom__"||(!agentNames.includes(current)&&current&&current!=="Pendent"))&&<input className="mt-6-v8773" value={current} onChange={e=>upd(field,e.target.value)} placeholder="Nom del tècnic, empresa o agent"/>}</label>
  }
  return <Card title="Dades generals de l’expedient" action={<div className="actions-inline"><button className="primary" onClick={saveAll}>Guardar dades</button></div>}>
    <div className="form-grid fitxa-form-v8773"><DatalistCP8773/>
      <label><span>Codi expedient</span><input value={expedientCode8739(obra)} readOnly/></label>
      <label><span>Client / carpeta</span><input value={client?.nom||""} readOnly/></label>
      <label><span>Nom de l’obra / treball</span><input value={form.nom||""} onChange={e=>upd("nom",e.target.value)}/></label>
      <label><span>Tipus de feina</span><select value={form.tipusTreball||form.tipologia||"Altres"} onChange={e=>{upd("tipusTreball",e.target.value);upd("tipologia",e.target.value)}}>{WORK_TYPES8737.map(t=><option key={t}>{t}</option>)}</select></label>
      <label><span>Estat de l’expedient</span><select value={form.estat||"Pendent"} onChange={e=>upd("estat",e.target.value)}><option>Acceptada</option><option>Pressupostada</option><option>En procés</option><option>No contestat</option><option>Pendent</option><option>Activa</option><option>Aturada</option><option>Tancada</option><option>Descartada</option></select></label>
      <label><span>Promotor / propietat</span><input value={form.propietat||""} onChange={e=>upd("propietat",e.target.value)}/></label>
      <AgentPicker field="constructor" label="Constructor / contractista"/>
      <AgentPicker field="do" label="Direcció d’obra (DO)"/>
      <AgentPicker field="deo" label="Direcció d’execució (DEO)"/>
      <AgentPicker field="css" label="Coordinació S+S (CSS)"/>
      <label><span>Adreça</span><input value={form.adreca||""} onChange={e=>upd("adreca",e.target.value)}/></label>
      <label><span>Codi postal</span><input list="cp-list-v8773" value={form.codiPostal||""} onChange={e=>changeCp(e.target.value)} placeholder="17230"/></label>
      <label><span>Població</span><input list="poblacio-list-v8773" value={form.poblacio||""} onChange={e=>changePoblacio(e.target.value)} placeholder="Palamós"/></label>
      <label><span>Província</span><input value={provinciaForCp8773(form.codiPostal)||provinciaForPoblacio8773(form.poblacio)||form.provincia||""} readOnly/></label>
      <label><span>Referència cadastral</span><input value={form.rc||""} onChange={e=>upd("rc",e.target.value)}/></label>
      <label className="span-all"><span>Observacions internes</span><textarea value={form.observacions||""} onChange={e=>upd("observacions",e.target.value)} placeholder="Condicionants, criteris, notes de l’encàrrec..."/></label>
    </div>
  </Card>
}

function sectionConfig8769(label){
  const map={
    "Plànols":{key:"planols",title:"Plànols",desc:"DWG, PDF, aixecaments, plànols rebuts, plànols generats i as-built."},
    "Memòria / Informe / Certificat":{key:"memoria",title:"Memòria / informe / certificat",desc:"Redacció tècnica, conclusions, comprovacions normatives, certificat o document final segons l’encàrrec."},
    "Renders / Presentació":{key:"renders",title:"Renders / presentació",desc:"Models 3D, renders, panells, fotomuntatges i documents visuals d’entrega."},
    "Amidaments":{key:"amidaments",title:"Amidaments",desc:"Amidaments de projecte o obra, quadres de superfícies i criteris de mesurament."},
    "Industrials / Comparatius":{key:"industrials",title:"Industrials / comparatius",desc:"Pressupostos rebuts d’industrials, comparatives i criteris de selecció."},
    "Tràmits":{key:"tramits",title:"Tràmits",desc:"Llicències, comunicacions, taxes, requeriments, registres i documentació administrativa."},
    "Seguretat i salut":{key:"seguretat",title:"Seguretat i salut",desc:"EBSS, ESS, PSS, coordinació, incidències preventives i documentació PRL."},
    "Tancament / Entrega":{key:"tancament",title:"Tancament / entrega",desc:"Documents finals, entrega al client, CFO, as-built, llibre de l’edifici, garanties i arxiu final."}
  };
  return map[label]||{key:codeClean8739(label).toLowerCase().replaceAll(" ","_"),title:label,desc:"Documentació i notes de treball de l’expedient."}
}
function addSectionFiles8769(files,key,setData){[...(files||[])].forEach(file=>{const reader=new FileReader();reader.onload=()=>setData(d=>{const docs=d.sectionDocs||{};return {...d,sectionDocs:{...docs,[key]:[...(docs[key]||[]),{id:key+"-"+Date.now()+"-"+Math.random().toString(16).slice(2),nom:file.name,type:file.type,url:reader.result,data:todayISO8761()}]}}});reader.readAsDataURL(file)})}
function ExpedientSection8769({label,data,setData}){
  const cfg=sectionConfig8769(label);const docs=(data.sectionDocs||{})[cfg.key]||[];const note=(data.sectionNotes||{})[cfg.key]||"";
  function setNote(v){setData(d=>({...d,sectionNotes:{...(d.sectionNotes||{}),[cfg.key]:v}}))}
  function remove(id){setData(d=>{const sd=d.sectionDocs||{};return {...d,sectionDocs:{...sd,[cfg.key]:(sd[cfg.key]||[]).filter(x=>x.id!==id)}}})}
  return <Card title={cfg.title} action={<label className="primary file-btn-v8761">Afegir arxius<input type="file" multiple onChange={e=>addSectionFiles8769(e.target.files,cfg.key,setData)}/></label>}>
    <div className="exp-section-v8769"><p>{cfg.desc}</p><label><span>Notes internes / criteri tècnic</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Escriu aquí criteris, comprovacions, pendents o conclusions..."/></label></div>
    <div className="section-doc-list-v8769">{docs.length===0&&<Empty text="Encara no hi ha arxius en aquesta pestanya."/>}{docs.map(d=><div key={d.id} className="doc-acta-row-v8764"><b>{d.nom}</b><span>{fmtDate8761(d.data)}</span><a className="secondary small" href={d.url} target="_blank" rel="noreferrer">Obrir</a><button className="danger small" onClick={()=>remove(d.id)}>Eliminar</button></div>)}</div>
  </Card>
}
function TasquesTab8769({data,setData}){
  const rows=data.tasques||[];
  function taskEvent(t){
    const iso=toInputDate8743(t.data||todayISO8743());
    const [yy,mm,dd]=iso.split("-").map(Number);
    return {id:"task-"+t.id,taskId:t.id,day:dd,month:(mm||1)-1,year:yy||new Date().getFullYear(),title:t.text||"Tasca pendent",type:"Tasca",tipus:"Tasca",hora:t.hora||"09:00",note:`${t.prioritat||"Normal"} · ${t.estat||"Pendent"}`,detail:`${t.prioritat||"Normal"} · ${t.estat||"Pendent"}`,color:t.estat==="Fet"?"blue":(t.prioritat==="Urgent"?"red":"orange")};
  }
  function syncEvents(list,events){
    const ids=new Set(list.map(t=>"task-"+t.id));
    const manual=(events||[]).filter(e=>!String(e.id||"").startsWith("task-"));
    return [...manual,...list.filter(t=>t.data&&t.estat!=="Fet").map(taskEvent)];
  }
  function commit(next){setData(d=>({...d,tasques:next,events:syncEvents(next,d.events||[])}))}
  function add(){const next=[...rows,{id:"tsk-"+Date.now(),text:"Nova tasca",estat:"Pendent",data:todayISO8743(),hora:"09:00",prioritat:"Normal"}];commit(next)}
  function upd(id,k,v){const next=rows.map(t=>t.id===id?{...t,[k]:v}:t);commit(next)}
  function del(id){const next=rows.filter(t=>t.id!==id);commit(next)}
  return <Card title="Tasques de l’expedient" action={<button className="primary" onClick={add}>+ Nova tasca</button>}><div className="task-list-v8769">{rows.length===0&&<Empty text="Encara no hi ha tasques."/>}{rows.map(t=><div className="task-row-v8769" key={t.id}><input value={t.text||""} onChange={e=>upd(t.id,"text",e.target.value)}/><select value={t.prioritat||"Normal"} onChange={e=>upd(t.id,"prioritat",e.target.value)}><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgent</option></select><input type="date" value={toInputDate8743(t.data)||""} onChange={e=>upd(t.id,"data",e.target.value)}/><input type="time" value={t.hora||"09:00"} onChange={e=>upd(t.id,"hora",e.target.value)}/><select value={t.estat||"Pendent"} onChange={e=>upd(t.id,"estat",e.target.value)}><option>Pendent</option><option>En curs</option><option>Fet</option></select><button className="danger" onClick={()=>del(t.id)}>Eliminar</button></div>)}</div><div className="module-note-v8738"><b>Agenda sincronitzada</b><span>Les tasques amb data i estat pendent/en curs apareixen automàticament a l’Agenda general i a l’Agenda de l’expedient.</span></div></Card>
}

function certQtyTotal8773(r){
  const vals=Object.values(r.certsByNum||{}).map(Number).filter(v=>!Number.isNaN(v));
  if(vals.length)return vals.reduce((s,v)=>s+(+v||0),0);
  return (+r.certAnterior||0)+(+r.certActual||0);
}

function ensureBudgetGroups8786(data={}){
  const explicit=(data.budgetGroups||[]).filter(Boolean);
  const ids=new Set(["principal"]);
  const inferred=[];
  (data.pressupostos||[]).forEach(p=>{const id=p.budgetId||"principal";if(!ids.has(id)){ids.add(id);inferred.push({id,nom:p.budgetNom||p.nom||id,tipus:p.tipus||"Fora pressupost"})}});
  (data.partides||[]).forEach(r=>{const id=r.budgetId||"principal";if(!ids.has(id)){ids.add(id);inferred.push({id,nom:id,tipus:"Fora pressupost"})}});
  const base={id:"principal",nom:"Pressupost principal",tipus:"Principal"};
  const all=[base,...explicit,...inferred].reduce((acc,g)=>{const id=g.id||("bg-"+acc.length);if(!acc.some(x=>x.id===id))acc.push({...g,id,nom:g.nom||g.name||id,tipus:g.tipus||"Fora pressupost"});return acc},[]);
  return {groups:all,active:(data.activeBudgetIdObra&&all.some(g=>g.id===data.activeBudgetIdObra)?data.activeBudgetIdObra:"principal")};
}
function budgetLabel8786(data,bid){return ensureBudgetGroups8786(data).groups.find(g=>g.id===(bid||"principal"))?.nom||"Pressupost principal"}
function filterBudgetData8786(data,bid){
  const id=bid||"principal";
  const is=(x)=>(x?.budgetId||"principal")===id;
  return {...data,activeBudgetIdObra:id,partides:(data.partides||[]).filter(is),pressupostos:(data.pressupostos||[]).filter(is),certificacions:(data.certificacions||[]).filter(is),factures:(data.factures||[]).filter(is)};
}
function mergeBudgetData8786(globalData,bid,nextScope){
  const id=bid||"principal";
  const not=(x)=>(x?.budgetId||"principal")!==id;
  return normalizeBudgetedData8791({
    ...globalData,
    activeBudgetIdObra:id,
    budgetGroups:ensureBudgetGroups8786(globalData).groups.filter(g=>g.id!=="principal"),
    partides:[...(globalData.partides||[]).filter(not),...(nextScope.partides||[]).map(r=>({...r,budgetId:id}))],
    pressupostos:[...(globalData.pressupostos||[]).filter(not),...(nextScope.pressupostos||[]).map(p=>({...p,budgetId:id}))],
    certificacions:[...(globalData.certificacions||[]).filter(not),...(nextScope.certificacions||[]).map(c=>({...c,budgetId:id}))],
    factures:[...(globalData.factures||[]).filter(not),...(nextScope.factures||[]).map(f=>({...f,budgetId:id}))]
  });
}

function normalizeBudgetedData8791(data={}){
  const d={...empty(),...(data||{})};
  const groupsById={};
  function addGroup(g){
    if(!g)return;
    const id=String(g.id||g.budgetId||"").trim();
    if(!id||id==="principal")return;
    const prev=groupsById[id]||{};
    groupsById[id]={...prev,...g,id,nom:g.nom||g.name||g.budgetNom||prev.nom||id,tipus:g.tipus||prev.tipus||"Fora pressupost"};
  }
  (d.budgetGroups||[]).forEach(addGroup);
  (d.pressupostos||[]).forEach(p=>{
    const id=p?.budgetId||"principal";
    if(id!=="principal") addGroup({id,nom:p.budgetNom||p.nom||groupsById[id]?.nom||id,tipus:p.tipus||groupsById[id]?.tipus||(/imprevist|sobrecost/i.test(String(p.nom||p.estat||""))?"Imprevist / sobrecost":"Fora pressupost")});
  });
  (d.partides||[]).forEach(r=>{
    const id=r?.budgetId||"principal";
    if(id!=="principal") addGroup({id,nom:groupsById[id]?.nom||id,tipus:groupsById[id]?.tipus||"Fora pressupost"});
  });
  (d.certificacions||[]).forEach(c=>{
    const id=c?.budgetId||"principal";
    if(id!=="principal") addGroup({id,nom:c.budgetNom||groupsById[id]?.nom||id,tipus:groupsById[id]?.tipus||"Fora pressupost"});
  });
  (d.factures||[]).forEach(f=>{
    const id=f?.budgetId||"principal";
    if(id!=="principal") addGroup({id,nom:f.budgetNom||groupsById[id]?.nom||id,tipus:groupsById[id]?.tipus||"Fora pressupost"});
  });
  const groups=Object.values(groupsById).filter(g=>g.id!=="principal");
  let pressupostos=Array.isArray(d.pressupostos)?[...d.pressupostos]:[];
  groups.forEach(g=>{
    const hasMarker=pressupostos.some(p=>(p.budgetId||"principal")===g.id && (String(p.id||"").startsWith("budget-marker-")||p.versio==="Annex"));
    if(!hasMarker){
      const rows=(d.partides||[]).filter(r=>(r.budgetId||"principal")===g.id);
      const total=rows.reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
      pressupostos.push({id:"budget-marker-"+g.id,budgetId:g.id,versio:"Annex",data:todayShort8713(),nom:g.nom,estat:`${g.tipus||"Pressupost"} · recuperat · ${rows.length} partides`,import:total,updatedAt:new Date().toISOString()});
    }
  });
  const validIds=new Set(["principal",...groups.map(g=>g.id)]);
  const active=validIds.has(d.activeBudgetIdObra)?d.activeBudgetIdObra:"principal";
  return {...d,budgetGroups:groups,pressupostos,activeBudgetIdObra:active};
}


function recoverBudgetAnnexesLocal8795(currentOdata={},obres=[],user=currentAppUser8779()) {
  // Recuperació prudent: només per a l'usuari actiu, i especialment útil si un annex va quedar en una clau antiga/local abans de canviar de versió.
  // No pot recuperar allò que mai no es va escriure al navegador, però sí marcadors, partides, certificacions i factures que quedin en còpies locals.
  const u=String(user||"").toLowerCase();
  if(!u || u==="pol") return currentOdata||{};
  const obraIndex={};
  (obres||[]).forEach(o=>{ if(o?.id) obraIndex[o.id]=o; });
  const out={...(currentOdata||{})};
  const targetKeys=Object.keys(localStorage).filter(k=>{
    const lk=k.toLowerCase();
    if(!lk.includes("odata")) return false;
    if(lk.includes("__pol__")) return false;
    return lk.includes(u) || !lk.includes("__");
  });
  function mergeOne(oid,src){
    if(!src || typeof src!=="object" || Array.isArray(src)) return;
    const dst=normalizeBudgetedData8791(out[oid]||empty());
    const beforeGroups=new Set(["principal",...(dst.budgetGroups||[]).map(g=>g.id)]);
    const addBy=(arr,keyFn,mergeFn)=>{
      const base=Array.isArray(arr)?arr:[];
      return base;
    };
    let changed=false;
    const next={...dst};
    const srcNorm=normalizeBudgetedData8791(src);
    const groupMap=new Map((next.budgetGroups||[]).map(g=>[g.id,g]));
    (srcNorm.budgetGroups||[]).forEach(g=>{
      if(!g?.id || g.id==="principal") return;
      if(!groupMap.has(g.id)){groupMap.set(g.id,g); changed=true;}
    });
    next.budgetGroups=[...groupMap.values()];
    const partKey=r=>`${r?.budgetId||"principal"}__${r?.codi||""}__${r?.cap||""}`;
    const partKeys=new Set((next.partides||[]).map(partKey));
    (srcNorm.partides||[]).forEach(r=>{ if((r?.budgetId||"principal")!=="principal" && !partKeys.has(partKey(r))){ next.partides=[...(next.partides||[]),r]; partKeys.add(partKey(r)); changed=true; }});
    const certKey=c=>`${c?.budgetId||"principal"}__${c?.numero||""}`;
    const certKeys=new Set((next.certificacions||[]).map(certKey));
    (srcNorm.certificacions||[]).forEach(c=>{ if((c?.budgetId||"principal")!=="principal" && !certKeys.has(certKey(c))){ next.certificacions=[...(next.certificacions||[]),c]; certKeys.add(certKey(c)); changed=true; }});
    const factKey=f=>`${f?.budgetId||"principal"}__${f?.id||f?.numero||f?.pfId||""}`;
    const factKeys=new Set((next.factures||[]).map(factKey));
    (srcNorm.factures||[]).forEach(f=>{ if((f?.budgetId||"principal")!=="principal" && !factKeys.has(factKey(f))){ next.factures=[...(next.factures||[]),f]; factKeys.add(factKey(f)); changed=true; }});
    const presKey=p=>`${p?.budgetId||"principal"}__${p?.id||p?.nom||p?.versio||""}`;
    const presKeys=new Set((next.pressupostos||[]).map(presKey));
    (srcNorm.pressupostos||[]).forEach(pr=>{ if((pr?.budgetId||"principal")!=="principal" && !presKeys.has(presKey(pr))){ next.pressupostos=[...(next.pressupostos||[]),pr]; presKeys.add(presKey(pr)); changed=true; }});
    if(changed){
      out[oid]=normalizeBudgetedData8791({...next, updatedAt:new Date().toISOString()});
    }
  }
  targetKeys.forEach(k=>{
    try{
      const raw=localStorage.getItem(k);
      if(!raw) return;
      const parsed=JSON.parse(raw);
      if(!parsed || typeof parsed!=="object" || Array.isArray(parsed)) return;
      Object.entries(parsed).forEach(([oid,val])=>{
        if(val && typeof val==="object" && (val.partides||val.budgetGroups||val.certificacions||val.pressupostos||val.factures)){
          if(out[oid] || obraIndex[oid]) mergeOne(oid,val);
        }
      });
    }catch{}
  });
  return out;
}

function certRecordTotal8791(data={},bid="principal"){
  return (data.certificacions||[]).filter(c=>(c.budgetId||"principal")===(bid||"principal")).reduce((s,c)=>s+(Number(c.import)||0),0);
}

function certQtyTotal8789(r){
  const nums=new Set();
  Object.keys(r.certsByNum||{}).forEach(n=>nums.add(+n));
  Object.keys(r.certMesuresByNum||{}).forEach(n=>nums.add(+n));
  if(nums.size){return [...nums].filter(n=>Number.isFinite(n)&&n>0).reduce((s,n)=>s+certQty8783(r,n),0)}
  return certQtyTotal8773(r);
}
function budgetImpact8789(g){
  const txt=String((g?.tipus||"")+" "+(g?.nom||"")).toLowerCase();
  if(txt.includes("principal"))return {key:"base",label:"Pressupost principal",tone:"neutral",sign:0};
  if(txt.includes("estalvi")||txt.includes("no executada"))return {key:"estalvi",label:"Estalvi / partida no executada",tone:"good",sign:-1};
  if(txt.includes("imprevist")||txt.includes("sobrecost")||txt.includes("risc"))return {key:"imprevist",label:"Imprevist / sobrecost",tone:"bad",sign:1};
  if(txt.includes("pendent"))return {key:"pendent",label:"Extra pendent d’aprovació",tone:"warn",sign:1};
  if(txt.includes("modificat")||txt.includes("aprovat")||txt.includes("nou pressupost"))return {key:"aprovat",label:"Modificat / extra aprovat",tone:"info",sign:1};
  if(txt.includes("fora"))return {key:"fora",label:"Fora pressupost",tone:"warn",sign:1};
  return {key:"altres",label:g?.tipus||"Altres",tone:"info",sign:1};
}
function budgetMetric8789(data,g){
  const id=g.id||"principal";
  const rows=(data.partides||[]).filter(r=>(r.budgetId||"principal")===id);
  const pressupost=rows.reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
  const certificatPartides=rows.reduce((s,r)=>s+certQtyTotal8789(r)*(+r.pu||0),0);
  const certificatRegistres=certRecordTotal8791(data,id);
  // V87.91: si una certificació està guardada com a registre però les partides antigues no conserven certsByNum,
  // fem servir el valor més alt per no perdre la Cert. 1 en la lectura global.
  const certificat=Math.max(certificatPartides,certificatRegistres);
  const capMap={};
  rows.forEach(r=>{const cap=r.cap||"Sense capítol";if(!capMap[cap])capMap[cap]={cap,pressupost:0,certificat:0,partides:0};capMap[cap].pressupost+=(+r.q||0)*(+r.pu||0);capMap[cap].certificat+=certQtyTotal8789(r)*(+r.pu||0);capMap[cap].partides+=1;});
  const impact=budgetImpact8789(g);
  return {...g,rows,pressupost,certificat,certificatPartides,certificatRegistres,capitols:Object.values(capMap),impact};
}
function GlobalRendibilitat8789({data,setData,activeBudgetId,setActiveBudgetId}){
  const groups=ensureBudgetGroups8786(data).groups;
  const metricsRaw=groups.map(g=>budgetMetric8789(data,g));
  const seenMetrics878108=new Set();
  const metrics=metricsRaw.filter(m=>{const sig=m.rows.map(r=>`${r.codi||""}:${r.cap||""}`).sort().join("|")+`__${Math.round((m.pressupost||0)*100)}`; if(m.id!=="principal"&&sig&&seenMetrics878108.has(sig))return false; seenMetrics878108.add(sig); return true;});
  const principal=metrics.find(m=>m.id==="principal")||metrics[0]||{pressupost:0,certificat:0};
  const base=principal.pressupost||0;
  const afegits=metrics.filter(m=>m.id!=="principal"&&!["estalvi","imprevist","pendent"].includes(m.impact.key)).reduce((s,m)=>s+m.pressupost,0);
  const imprevistos=metrics.filter(m=>m.impact.key==="imprevist").reduce((s,m)=>s+m.pressupost,0);
  const pendents=metrics.filter(m=>m.impact.key==="pendent"||m.impact.key==="fora").reduce((s,m)=>s+m.pressupost,0);
  const estalvis=metrics.filter(m=>m.impact.key==="estalvi").reduce((s,m)=>s+m.pressupost,0);
  const totalActual=base+afegits+imprevistos+pendents-estalvis;
  const totalCert=metrics.reduce((s,m)=>s+m.certificat,0);
  const desviacioActual=totalActual-base;
  const pctActual=base?desviacioActual/base*100:0;
  const pctCert=base?totalCert/base*100:0;
  const byImpact={base,afegits,imprevistos,pendents,estalvis};
  function updateGroup(id,patch){
    if(id==="principal")return;
    setData?.(d=>{const groups=ensureBudgetGroups8786(d).groups.filter(g=>g.id!=="principal").map(g=>g.id===id?{...g,...patch}:g);return {...d,budgetGroups:groups,updatedAt:new Date().toISOString()}})
  }
  const allCaps={};
  metrics.forEach(m=>m.capitols.forEach(c=>{if(!allCaps[c.cap])allCaps[c.cap]={cap:c.cap,pressupost:0,certificat:0};allCaps[c.cap].pressupost+=c.pressupost;allCaps[c.cap].certificat+=c.certificat;}));
  const caps=Object.values(allCaps).sort((a,b)=>String(a.cap).localeCompare(String(b.cap),"ca",{numeric:true}));
  return <div className="stack rend-global-v8789">
    <Card title="Rendibilitat i desviacions · visió global de l’obra">
      <div className="rend-dashboard-v8789">
        <div className={`rend-main-kpi-v8789 ${desviacioActual>0?"bad":"good"}`}><span>Desviació prevista sobre pressupost inicial</span><b>{desviacioActual>0?"+":""}{money(desviacioActual)}</b><small>{pct(pctActual)} respecte del pressupost principal</small></div>
        <div className="rend-ring-card-v8789"><div className="ring-v8774" style={{background:`conic-gradient(#2563eb 0 ${Math.min(140,pctCert)*3.6}deg,#e5e7eb ${Math.min(140,pctCert)*3.6}deg 360deg)`}}><b>{new Intl.NumberFormat("ca-ES",{minimumFractionDigits:1,maximumFractionDigits:1}).format(pctCert)}%</b><span>certificat</span></div><em>Certificat total a origen: {money(totalCert)}</em></div>
        <div className="rend-metric-grid-v8789">
          <div><span>Pressupost inicial</span><b>{money(base)}</b></div>
          <div className="info"><span>Modificats / extres aprovats</span><b>{money(afegits)}</b></div>
          <div className="bad"><span>Imprevistos / sobrecostos</span><b>{money(imprevistos)}</b></div>
          <div className="warn"><span>Fora pressupost / pendents</span><b>{money(pendents)}</b></div>
          <div className="good"><span>Estalvis</span><b>-{money(estalvis)}</b></div>
          <div><span>Total actual previst</span><b>{money(totalActual)}</b></div>
        </div>
      </div>
      <div className="rend-stack-bars-v8789">
        <div><span>Base</span><b style={{width:`${totalActual?Math.max(8,base/totalActual*100):0}%`}}/></div>
        <div><span>Aprovats</span><b className="info" style={{width:`${totalActual?Math.max(4,afegits/totalActual*100):0}%`}}/></div>
        <div><span>Imprevistos</span><b className="bad" style={{width:`${totalActual?Math.max(4,imprevistos/totalActual*100):0}%`}}/></div>
        <div><span>Pendents</span><b className="warn" style={{width:`${totalActual?Math.max(4,pendents/totalActual*100):0}%`}}/></div>
      </div>
    </Card>
    <Card title="Paquets econòmics de l’obra" action={<span className="muted">Classifica cada pressupost perquè la desviació surti amb el color correcte.</span>}>
      <div className="budget-analysis-grid-v8789">{metrics.map(m=>{const selected=(activeBudgetId||"principal")===m.id;return <button key={m.id} className={`budget-analysis-card-v8789 ${m.impact.tone} ${selected?"active":""}`} onClick={()=>setActiveBudgetId?.(m.id)}><div><b>{m.nom}</b><small>{m.impact.label}</small></div><strong>{money(m.pressupost)}</strong><em>Certificat: {money(m.certificat)}</em><span>{m.rows.length} partides</span>{m.id!=="principal"&&<select value={m.tipus||"Fora pressupost"} onClick={e=>e.stopPropagation()} onChange={e=>updateGroup(m.id,{tipus:e.target.value})}><option>Fora pressupost</option><option>Imprevist / sobrecost</option><option>Modificat aprovat</option><option>Extra aprovat pel client</option><option>Extra pendent d’aprovació</option><option>Estalvi / partida no executada</option><option>Altres</option></select>}</button>})}</div>
    </Card>
    <Card title="Desviació global per capítols">
      <div className="rent-table-wrap-v8774"><table className="rent-table-v8774"><thead><tr><th>Capítol</th><th>Pressupost actual</th><th>Certificat a origen</th><th>Desviació certificada</th><th>% certificat</th><th>Visual</th></tr></thead><tbody>{caps.length===0?<tr><td colSpan="6"><Empty text="Encara no hi ha pressupost."/></td></tr>:caps.map(c=>{const dif=c.certificat-c.pressupost;const pc=c.pressupost?c.certificat/c.pressupost*100:0;return <tr key={c.cap}><td className="text-left"><b>{c.cap}</b></td><td>{money(c.pressupost)}</td><td>{money(c.certificat)}</td><td><b className={dif>0?"bad-text":"good-text"}>{dif>0?"+":""}{money(dif)}</b></td><td>{pct(pc)}</td><td><div className="cap-bar-v8774"><span className={dif>0?"bad":"good"} style={{width:`${Math.min(100,Math.abs(pc))}%`}}/></div></td></tr>})}</tbody></table></div>
    </Card>
  </div>
}

function RentabilitatObra8773({data,setData}){
  const rows=data.partides||[];
  const tancats=data.capitolsTancats||{};
  const caps=Object.values(rows.reduce((m,r)=>{
    const k=r.cap||"Sense capítol";
    if(!m[k])m[k]={cap:k,pressupost:0,certificat:0,partides:0};
    const pressup=(+r.q||0)*(+r.pu||0);
    const cert=certQtyTotal8773(r)*(+r.pu||0);
    m[k].pressupost+=pressup;
    m[k].certificat+=cert;
    m[k].partides+=1;
    return m;
  },{}));
  const pressupost=caps.reduce((s,c)=>s+c.pressupost,0);
  const certCalc=caps.reduce((s,c)=>s+c.certificat,0);
  const certificat=certCalc;
  const desviacio=certificat-pressupost;
  const estalvi=Math.max(pressupost-certificat,0);
  const sobrecost=Math.max(certificat-pressupost,0);
  const pctCert=pressupost?Math.min(160,certificat/pressupost*100):0;
  const pctDesv=pressupost?desviacio/pressupost*100:0;
  function toggleCap(cap){setData?.(d=>({...d,capitolsTancats:{...(d.capitolsTancats||{}),[cap]:!(d.capitolsTancats||{})[cap]}}))}
  const closed=caps.filter(c=>tancats[c.cap]);
  const positive=closed.filter(c=>c.pressupost>=c.certificat).reduce((s,c)=>s+(c.pressupost-c.certificat),0);
  const negative=closed.filter(c=>c.certificat>c.pressupost).reduce((s,c)=>s+(c.certificat-c.pressupost),0);
  return <div className="stack rentabilitat-v8774">
    <Card title="Rendibilitat i desviacions · lectura econòmica de l’obra">
      <div className="rent-hero-v8774">
        <div className="rent-big-kpi-v8774"><span>Resultat global estimat</span><b className={desviacio>0?"bad":"good"}>{desviacio>0?`-${money(sobrecost)}`:`+${money(estalvi)}`}</b><small>{desviacio>0?"Sobrecost respecte pressupost":"Estalvi respecte pressupost"} · {pct(pctDesv)}</small></div>
        <div className="rent-ring-wrap-v8774"><div className="ring-v8774" style={{background:`conic-gradient(#2563eb 0 ${pctCert*3.6}deg,#e5e7eb ${pctCert*3.6}deg 360deg)`}}><b>{new Intl.NumberFormat("ca-ES",{minimumFractionDigits:1,maximumFractionDigits:1}).format(pctCert)}%</b><span>certificat</span></div></div>
        <div className="rent-kpis-v8774"><div><span>Pressupost obra</span><b>{money(pressupost)}</b></div><div><span>Certificat / final previst</span><b>{money(certificat)}</b></div><div className="good"><span>Estalvi capítols tancats</span><b>{money(positive)}</b></div><div className="bad"><span>Sobrecost capítols tancats</span><b>{money(negative)}</b></div></div>
      </div>
      <div className="rent-summary-bars-v8774"><div><span>Pressupost</span><b>{money(pressupost)}</b><em style={{width:"100%"}}/></div><div><span>Certificat</span><b>{money(certificat)}</b><em className={certificat>pressupost?"bad":"good"} style={{width:`${pressupost?Math.min(140,certificat/pressupost*100):0}%`}}/></div></div>
    </Card>
    <Card title="Desviacions per capítol" action={<span className="muted">Marca “Tancat” quan el capítol ja estigui finalitzat</span>}>
      <div className="rent-table-wrap-v8774"><table className="rent-table-v8774"><thead><tr><th>Capítol</th><th>Estat</th><th>Pressupost</th><th>Certificat / final</th><th>Desviació</th><th>%</th><th>Visual</th></tr></thead><tbody>{caps.length===0?<tr><td colSpan="7"><Empty text="Encara no hi ha pressupost importat."/></td></tr>:caps.map(c=>{const dif=c.certificat-c.pressupost;const pctVal=c.pressupost?dif/c.pressupost*100:0;const closed=!!tancats[c.cap];const good=closed?c.pressupost>=c.certificat:dif<=0;return <tr key={c.cap} className={closed?(good?"cap-ok-v8774":"cap-bad-v8774"):""}><td className="text-left"><b>{c.cap}</b><small>{c.partides} partides</small></td><td><button className={closed?"primary small":"secondary small"} onClick={()=>toggleCap(c.cap)}>{closed?"Tancat":"Obert"}</button></td><td>{money(c.pressupost)}</td><td>{money(c.certificat)}</td><td><b className={good?"good-text":"bad-text"}>{dif>0?"+":""}{money(dif)}</b></td><td>{pct(pctVal)}</td><td><div className="cap-bar-v8774"><span className={good?"good":"bad"} style={{width:`${Math.min(100,Math.abs(pctVal))}%`}}/></div></td></tr>})}</tbody></table></div>
    </Card>
    <div className="rent-two-v8774"><Card title="Capítols amb estalvi"><div className="chapter-bars-v8774 good">{caps.filter(c=>c.pressupost>=c.certificat).slice(0,8).map(c=><div key={c.cap}><span>{c.cap}</span><em>{money(c.pressupost-c.certificat)}</em><b style={{width:`${pressupost?Math.max(4,(c.pressupost-c.certificat)/pressupost*100):0}%`}}/></div>)}</div></Card><Card title="Capítols amb sobrecost"><div className="chapter-bars-v8774 bad">{caps.filter(c=>c.certificat>c.pressupost).slice(0,8).map(c=><div key={c.cap}><span>{c.cap}</span><em>{money(c.certificat-c.pressupost)}</em><b style={{width:`${pressupost?Math.max(4,(c.certificat-c.pressupost)/pressupost*100):0}%`}}/></div>)}</div></Card></div>
  </div>
}
function GestioObra8746({data,setData,importExcel,deletePressupostVersion,duplicatePressupostVersion,openPartida,openEmail,openDoc,updateCert,deleteCertificacio8721,updateCertDate8721,addCertificacio,certInfo,setCertInfo,saveCert,client,clientHistoricalPartides=[]}){
  const[sub,setSub]=useState("Pressupost obra");
  const info=ensureBudgetGroups8786(data);
  const[activeBudgetId,setActiveBudgetId]=useState(info.active);
  useEffect(()=>{const next=ensureBudgetGroups8786(data);if(!next.groups.some(g=>g.id===activeBudgetId))setActiveBudgetId(next.active)},[data.pressupostos?.length,data.partides?.length,data.budgetGroups?.length]);
  const groups=ensureBudgetGroups8786(data).groups;
  const activeData=filterBudgetData8786(data,activeBudgetId);
  function setScopedData(updater){
    setData(d=>{
      const current=filterBudgetData8786(d,activeBudgetId);
      const nextScope=typeof updater==="function"?updater(current):updater;
      const merged=mergeBudgetData8786(d,activeBudgetId,nextScope);
      const baseGroups=ensureBudgetGroups8786(d).groups.filter(g=>g.id!=="principal");
      const scopeGroups=(nextScope.budgetGroups||[]).filter(g=>g.id!=="principal");
      const allGroups=[...baseGroups,...scopeGroups].reduce((acc,g)=>acc.some(x=>x.id===g.id)?acc:[...acc,g],[]);
      return {...merged,budgetGroups:allGroups,activeBudgetIdObra:activeBudgetId,updatedAt:new Date().toISOString()};
    });
  }
  function selectBudget8788(id){
    const bid=id||"principal";
    setActiveBudgetId(bid);
    setData(d=>({...d,activeBudgetIdObra:bid,updatedAt:new Date().toISOString()}));
  }
  function fixarBudget8788(){
    setData(d=>{
      const bid=activeBudgetId||"principal";
      const groups=ensureBudgetGroups8786(d).groups;
      const g=groups.find(x=>x.id===bid)||{id:bid,nom:"Pressupost",tipus:"Annex"};
      const rows=(d.partides||[]).filter(r=>(r.budgetId||"principal")===bid);
      const total=rows.reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
      const old=(d.pressupostos||[]).filter(p=>(p.budgetId||"principal")!==bid || !String(p.id||"").startsWith("budget-marker-"));
      const marker={id:"budget-marker-"+bid,budgetId:bid,versio:bid==="principal"?"Principal":"Annex",data:todayShort8713(),nom:g.nom,estat:`${g.tipus||"Pressupost"} · ${rows.length} partides · guardat`,import:total,updatedAt:new Date().toISOString()};
      return {...d,activeBudgetIdObra:bid,pressupostos:[...old,marker],updatedAt:new Date().toISOString()};
    });
    alert("Pressupost seleccionat fixat/guardat dins aquesta obra.");
  }
  function addBudget(tipus="Nou pressupost"){
    const nom=prompt("Nom del nou pressupost:", tipus.includes("Imprevist")?"Imprevistos 01":(tipus.includes("Modificat")?"Nou pressupost 01":"Nou pressupost 01"));
    if(!nom)return;
    const id="bg-"+Date.now();
    const now=new Date().toISOString();
    setData(d=>({...d,activeBudgetIdObra:id,updatedAt:now,budgetGroups:[...(d.budgetGroups||[]),{id,nom,tipus,createdAt:now}],pressupostos:[...(d.pressupostos||[]),{id:"budget-marker-"+id,budgetId:id,versio:"Annex",data:todayShort8713(),nom,estat:`${tipus} · creat · 0 partides`,import:0,updatedAt:now}]}));
    setActiveBudgetId(id);
    setSub("Pressupost obra");
  }
  function renameBudget(id){
    const g=groups.find(x=>x.id===id); if(!g)return;
    const nom=prompt("Nom del pressupost:",g.nom); if(!nom)return;
    setData(d=>({...d,budgetGroups:[...(d.budgetGroups||[]).filter(x=>x.id!==id),{...g,nom}].filter(x=>x.id!=="principal")}));
  }
  function deleteBudget(id){
    if(id==="principal")return alert("El pressupost principal no es pot eliminar.");
    if(!confirm("Eliminar aquest pressupost annex i totes les seves partides/certificacions/factures?"))return;
    setData(d=>({...d,budgetGroups:(d.budgetGroups||[]).filter(g=>g.id!==id),partides:(d.partides||[]).filter(r=>(r.budgetId||"principal")!==id),pressupostos:(d.pressupostos||[]).filter(p=>(p.budgetId||"principal")!==id),certificacions:(d.certificacions||[]).filter(c=>(c.budgetId||"principal")!==id),factures:(d.factures||[]).filter(f=>(f.budgetId||"principal")!==id),activeBudgetIdObra:"principal"}));
    setActiveBudgetId("principal");
  }
  function scopedUpdateCert(codi,fieldOrValue,value){
    let field=value===undefined?"certActual":fieldOrValue;
    let raw=value===undefined?fieldOrValue:value;
    let n=parseNum8770(raw); if(!Number.isFinite(n))n=0;
    setData(d=>({...d,partides:(d.partides||[]).map(r=>{
      if((r.budgetId||"principal")!==activeBudgetId||r.codi!==codi)return r;
      const next={...r,[field]:n};
      if(String(field).startsWith("cert_")){
        const certKey=String(field).replace("cert_","");
        next.certsByNum={...(r.certsByNum||{}),[certKey]:n};
        if(next.certMesuresByNum&&next.certMesuresByNum[certKey]){next.certMesuresByNum={...next.certMesuresByNum};delete next.certMesuresByNum[certKey];}
      }
      return next;
    })}));
  }
  function scopedSaveCert(){
    const n=+certInfo.num;
    setData(d=>{
      const rows=(d.partides||[]).filter(r=>(r.budgetId||"principal")===activeBudgetId);
      const total=rows.reduce((s,r)=>s+certQty8783(r,n)*(+r.pu||0),0);
      const rest=(d.certificacions||[]).filter(c=>!(((c.budgetId||"principal")===activeBudgetId)&&(+c.numero===n)));
      const cert={id:"c"+Date.now(),budgetId:activeBudgetId,numero:String(n),data:certInfo.data,estat:"Guardada",import:total,updatedAt:new Date().toISOString()};
      return {...d,activeBudgetIdObra:activeBudgetId,certificacions:[...rest,cert].sort((a,b)=>(+a.numero)-(+b.numero)),updatedAt:new Date().toISOString()};
    });
  }
  function scopedAddCert(){
    setData(d=>{
      const certs=(d.certificacions||[]).filter(c=>(c.budgetId||"principal")===activeBudgetId);
      const nextNum=(certs.reduce((m,c)=>Math.max(m,+c.numero||0),0)||0)+1;
      const nova={id:"c"+Date.now(),budgetId:activeBudgetId,numero:String(nextNum),data:todayShort8713(),estat:"Pendent",import:0};
      return {...d,certificacions:[...(d.certificacions||[]),nova],activeBudgetIdObra:activeBudgetId};
    });
  }
  function scopedDeleteCert(id){if(!confirm("Eliminar aquesta certificació?"))return;setData(d=>({...d,certificacions:(d.certificacions||[]).filter(c=>c.id!==id)}))}
  function scopedUpdateCertDate(id,value){setData(d=>({...d,certificacions:(d.certificacions||[]).map(c=>c.id===id?{...c,data:value}:c)}))}
  const totalGlobal=(data.partides||[]).reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
  const totalActive=(activeData.partides||[]).reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
  return <div className="stack gestio-obra-v8746 gestio-obra-v8786">
    <div className="budget-context-card-v87116"><Card title="Pressupostos de l’obra" action={<div className="actions-inline"><button className="secondary" onClick={()=>addBudget("Pressupost manual des de 0")}>+ Pressupost manual 0</button><button className="secondary" onClick={()=>addBudget("Imprevist / sobrecost")}>+ Imprevist</button><button className="secondary" onClick={()=>addBudget("Modificat aprovat")}>+ Modificat / annex</button></div>}>
      <div className="budget-mobile-control-v87115"><label><span>Pressupost actiu</span><select value={activeBudgetId} onChange={e=>selectBudget8788(e.target.value)}>{groups.map(g=>{const count=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).length;const total=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).reduce((sum,r)=>sum+(+r.q||0)*(+r.pu||0),0);return <option key={g.id} value={g.id}>{g.nom} · {count} partides · {money(total)}</option>})}</select></label></div>
      <div className="budget-selector-v8786">
        {groups.map(g=>{
          const count=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).length;
          const total=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
          return <button key={g.id} className={activeBudgetId===g.id?"active":""} onClick={()=>selectBudget8788(g.id)}><b>{g.nom}</b><span>{g.tipus} · {count} partides</span><strong>{money(total)}</strong></button>
        })}
      </div>
      <div className="budget-selected-actions-v8786"><span>Seleccionat: <b>{budgetLabel8786(data,activeBudgetId)}</b> · {money(totalActive)} / global obra {money(totalGlobal)} · pressupost, certificacions, factures i desviacions filtrades per aquest grup</span><div className="actions-inline"><button className="secondary small" onClick={fixarBudget8788}>Guardar/fixar</button><button className="secondary small" onClick={()=>renameBudget(activeBudgetId)}>Renombrar</button>{activeBudgetId!=="principal"&&<button className="danger small" onClick={()=>deleteBudget(activeBudgetId)}>Eliminar annex</button>}</div></div>
    </Card></div>
    <div className="subtabs-v8746"><button className={sub==="Pressupost obra"?"active":""} onClick={()=>setSub("Pressupost obra")}>Pressupost obra</button><button className={sub==="Certificacions obra"?"active":""} onClick={()=>setSub("Certificacions obra")}>Certificacions obra</button><button className={sub==="Facturació obra"?"active":""} onClick={()=>setSub("Facturació obra")}>Facturació obra</button><button className={sub==="Rendibilitat"?"active":""} onClick={()=>setSub("Rendibilitat")}>Rendibilitat / desviacions</button></div>
    {sub==="Pressupost obra"&&<Pressupost data={activeData} setData={setScopedData} importExcel={(e)=>importExcel?.(e,activeBudgetId)} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} openPartida={openPartida} openEmail={openEmail} openDoc={openDoc} client={client} clientHistoricalPartides={clientHistoricalPartides} budgetGroups={groups} activeBudgetId={activeBudgetId} selectBudget={selectBudget8788} addBudget={addBudget} totalGlobal={totalGlobal} totalActive={totalActive}/>} 
    {sub==="Certificacions obra"&&<Cert data={activeData} setData={setScopedData} updateCert={scopedUpdateCert} deleteCertificacio8721={scopedDeleteCert} updateCertDate8721={scopedUpdateCertDate} addCertificacio={scopedAddCert} ci={certInfo} setCi={setCertInfo} saveCert={scopedSaveCert} openEmail={openEmail} openDoc={openDoc}/>} 
    {sub==="Facturació obra"&&<Fact data={activeData} openEmail={openEmail} openDoc={openDoc}/>} 
    {sub==="Rendibilitat"&&<GlobalRendibilitat8789 data={data} setData={setData} activeBudgetId={activeBudgetId} setActiveBudgetId={selectBudget8788}/>}
  </div>
}
function Obra({obra,client,clients,data,setData,tab,setTab,setScreen,uploadImage,importExcel,deletePressupostVersion,duplicatePressupostVersion,updateCert,addCertificacio,updateObraFitxa8721,deleteCertificacio8721,updateCertDate8721,updateCertDate,certInfo,setCertInfo,saveCert,openEmail,openDoc,openAgent,openActa,openPartida,openEvent,selectedActaId,setSelectedActaId,timer,setTimer,startTimer,stopTimer,addManualHours,deleteHour,addPressupostTecnic,updatePressupostTecnic,facturarPressupostTecnic,addFacturaTecnica,updateFacturaTecnica,deletePressupostTecnic,deleteFacturaTecnica,deleteObra,allAgents=[],clientHistoricalPartides=[]}){
  const[estatObra,setEstatObra]=useState(obra.estat||"Pressupostada");
  const[editObra,setEditObra]=useState(false);
  const[tabsOpen,setTabsOpen]=useState(()=>!(typeof window!=="undefined"&&(window.innerWidth||0)<951));
  useEffect(()=>setEstatObra(obra.estat||"Pressupostada"),[obra.id,obra.estat]);
  let tabs=tabsForWork8737(obra,data);
  let activeTab=tabs.includes(tab)?tab:"Resum";
  const renderTab=()=> <>
    {activeTab==="Resum"&&<Resum obra={obra} client={client} data={data} openAgent={openAgent}/>} 
    {activeTab==="Dades"&&<FitxaDadesTab8769 obra={obra} client={client} save={updateObraFitxa8721} allAgents={uniqAgents8768([...(allAgents||[]),...(data.agents||[])])} setData={setData} openAgent={openAgent}/>} 
    {activeTab==="Plànols"&&<ExpedientSection8769 label="Plànols" data={data} setData={setData}/>} 
    {activeTab==="Memòria / Informe / Certificat"&&<ExpedientSection8769 label="Memòria / Informe / Certificat" data={data} setData={setData}/>} 
    {activeTab==="Renders / Presentació"&&<ExpedientSection8769 label="Renders / Presentació" data={data} setData={setData}/>} 
    {activeTab==="Amidaments"&&<ExpedientSection8769 label="Amidaments" data={data} setData={setData}/>} 
    {activeTab==="Industrials / Comparatius"&&<ExpedientSection8769 label="Industrials / Comparatius" data={data} setData={setData}/>} 
    {activeTab==="Tràmits"&&<ExpedientSection8769 label="Tràmits" data={data} setData={setData}/>} 
    {activeTab==="Seguretat i salut"&&<ExpedientSection8769 label="Seguretat i salut" data={data} setData={setData}/>} 
    {activeTab==="Tancament / Entrega"&&<ExpedientSection8769 label="Tancament / Entrega" data={data} setData={setData}/>} 
    {activeTab==="Tasques"&&<TasquesTab8769 data={data} setData={setData}/>} 
    {activeTab==="Honoraris"&&<HonorarisExpedient8778 data={data} obra={obra} addPressupost={addPressupostTecnic} updatePressupost={updatePressupostTecnic} facturarPressupost={facturarPressupostTecnic} deletePressupost={deletePressupostTecnic} addFactura={addFacturaTecnica} updateFactura={updateFacturaTecnica} deleteFactura={deleteFacturaTecnica} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Pressupostos"&&<PressupostTecnic8738 data={data} obra={obra} addPressupost={addPressupostTecnic} updatePressupost={updatePressupostTecnic} facturarPressupost={facturarPressupostTecnic} deletePressupost={deletePressupostTecnic} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Pressupost obra"&&<Pressupost data={data} setData={setData} importExcel={importExcel} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} openPartida={openPartida} openEmail={openEmail} openDoc={openDoc} client={client} clientHistoricalPartides={clientHistoricalPartides}/>} 
    {activeTab==="Certificacions obra"&&<Cert data={data} setData={setData} updateCert={updateCert} deleteCertificacio8721={deleteCertificacio8721} updateCertDate8721={updateCertDate8721} addCertificacio={addCertificacio} ci={certInfo} setCi={setCertInfo} saveCert={saveCert} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Factures"&&<FacturesTecniques8738 data={data} obra={obra} addFactura={addFacturaTecnica} updateFactura={updateFacturaTecnica} deleteFactura={deleteFacturaTecnica} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Facturació obra"&&<Fact data={data} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Gestió obra"&&(hasModule2Access8747()?<GestioObra8746 data={data} setData={setData} importExcel={importExcel} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} openPartida={openPartida} openEmail={openEmail} openDoc={openDoc} updateCert={updateCert} deleteCertificacio8721={deleteCertificacio8721} updateCertDate8721={updateCertDate8721} addCertificacio={addCertificacio} certInfo={certInfo} setCertInfo={setCertInfo} saveCert={saveCert} client={client} clientHistoricalPartides={clientHistoricalPartides}/>:<ModulLocked8747/>)} 
    {activeTab==="Agenda / Avisos"&&<AgendaExpedient8774 data={data} setData={setData} obra={obra} client={client}/>} 
    {activeTab==="Actes"&&<Actes8761 obra={obra} client={client} data={data} setData={setData} openEmail={openEmail} openDoc={openDoc} allAgents={allAgents}/>} 
    {activeTab==="Fotografies"&&<Fotografies8761 data={data} setData={setData}/>} 
    {activeTab==="Documents"&&<Documents obra={obra} data={data} setData={setData} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Gestió temps"&&<HonorarisTemps obraId={obra.id} data={data} timer={timer} setTimer={setTimer} startTimer={startTimer} stopTimer={stopTimer} addManualHours={addManualHours} deleteHour={deleteHour}/>} 
  </>;
  return <div className="obra-page obra-page-v87105">
    {editObra&&<EditObraModal8725 obra={obra} clients={clients||[]} close={()=>setEditObra(false)} save={(patch)=>{updateObraFitxa8721?.(patch);setEditObra(false)}}/>}
    <section className="obra-mini-fixed-v8776 obra-mini-fixed-single-v8777 obra-head-access-v87105">
      <button type="button" className="secondary obra-tabs-toggle-v87105" onClick={()=>setTabsOpen(v=>!v)}><Menu/> Pestanyes</button>
      <div className="obra-head-main-v87105"><small>{expedientCode8739(obra)}</small><h2>{obra.nom}</h2><p>{client.nom} · {moduleLabel8737(obra)} · <b>{activeTab}</b></p><select className="obra-mobile-tab-select-v878112" value={activeTab} onChange={e=>{setTab(e.target.value);setTabsOpen(false)}}>{tabs.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div className="obra-mini-actions-v8776"><Badge estat={estatObra}/><button type="button" className="secondary" onClick={()=>setScreen("Treballs / Expedients")}><ArrowLeft/> Tornar</button><button type="button" className="danger" onClick={()=>deleteObra?.(obra.id)}>Eliminar</button></div>
    </section>
    <section className={`obra-layout obra-layout-v87105 ${tabsOpen?"tabs-open":"tabs-closed"}`}>
      <aside className="obra-side-tabs obra-side-tabs-v87105">
        <div className="obra-tabs-title-v87105"><b>{obra.nom}</b><button type="button" onClick={()=>setTabsOpen(false)}>×</button></div>
        {tabs.map(t=><button key={t} onClick={()=>{setTab(t); if(window.innerWidth<950)setTabsOpen(false)}} className={activeTab===t?"active":""}>{t}</button>)}
      </aside>
      <div className="obra-content">{renderTab()}</div>
    </section>
  </div>
}
function ObraAgentsResum({data,openAgent}){
const[q,setQ]=useState("");
const[editing,setEditing]=useState(null);
const[local,setLocal]=useState(data.agents||[]);
let filtered=local.filter(a=>(a.nom+" "+a.rol+" "+a.empresa+" "+a.email).toLowerCase().includes(q.toLowerCase()));
function upd(id,k,v){setLocal(p=>p.map(a=>a.id===id?{...a,[k]:v}:a))}
return <AgentsObraCard data={data} openAgent={openAgent}/>
}

function ObraNotesAvisos({obraId,data}){
const storageKey=lsKey8779("aco_obra_notes_avisos_"+obraId);
const[items,setItems]=useState(()=>JSON.parse(localStorage.getItem(storageKey)||"null")||[
  {id:"oa1",tipus:"Avís",prioritat:"Urgent",titol:"Revisar proforma certificació",text:"Comprovar imports abans d’enviar a DF.",limit:"2026-06-18",fet:false},
  {id:"oa2",tipus:"Nota",prioritat:"Normal",titol:"Seguiment obra",text:"Preparar punts pendents per propera visita.",limit:"",fet:false}
]);
const[editing,setEditing]=useState(null);
useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify(items))},[items,storageKey]);
function add(tipus="Avís"){let n={id:"oa"+Date.now(),tipus,prioritat:"Normal",titol:tipus==="Avís"?"Nou avís":"Nova nota",text:"",limit:"",fet:false};setItems(p=>[n,...p]);setEditing(n.id)}
function upd(id,k,v){setItems(p=>p.map(x=>x.id===id?{...x,[k]:v}:x))}
function remove(id){if(confirm("Segur que vols eliminar aquest registre?"))setItems(p=>p.filter(x=>x.id!==id))}
let pending=items.filter(x=>!x.fet), done=items.filter(x=>x.fet);
return <Card title="Avisos i notes de l’obra" action={<div className="actions-inline"><button className="primary" onClick={()=>add("Avís")}><Plus/> Nou avís</button><button className="secondary" onClick={()=>add("Nota")}><Plus/> Nova nota</button></div>}>
  <div className="obra-alerts-note">
    <strong>Registre intern de l’obra</strong>
    <span>Aquí es mostren només avisos i notes d’aquesta obra. El calendari general queda a l’agenda principal.</span>
  </div>
  <div className="obra-alerts-list">
    {items.length===0&&<Empty text="No hi ha avisos ni notes en aquesta obra."/>}
    {items.map(x=>{
      let edit=editing===x.id;
      return <div className={`obra-alert-row ${x.fet?"done":""} ${x.prioritat==="Urgent"?"urgent":""}`} key={x.id}>
        <input type="checkbox" checked={x.fet} onChange={e=>upd(x.id,"fet",e.target.checked)}/>
        {edit?<select value={x.tipus} onChange={e=>upd(x.id,"tipus",e.target.value)}><option>Avís</option><option>Nota</option><option>Recordatori</option></select>:<span className="pill">{x.tipus}</span>}
        {edit?<select value={x.prioritat} onChange={e=>upd(x.id,"prioritat",e.target.value)}><option>Urgent</option><option>Normal</option><option>Baixa</option></select>:<span>{x.prioritat}</span>}
        {edit?<input value={x.titol} onChange={e=>upd(x.id,"titol",e.target.value)}/>:<strong>{x.titol}</strong>}
        {edit?<input value={x.text} onChange={e=>upd(x.id,"text",e.target.value)}/>:<span>{x.text||"—"}</span>}
        {edit?<input type="date" value={x.limit} onChange={e=>upd(x.id,"limit",e.target.value)}/>:<small>{x.limit||"Sense data"}</small>}
        <div className="row-actions"><button className="secondary" onClick={()=>setEditing(edit?null:x.id)}>{edit?"Guardar":"Editar"}</button><button className="danger" onClick={()=>remove(x.id)}>Eliminar</button></div>
      </div>
    })}
  </div>
  <div className="obra-alerts-summary"><span>Pendents: <b>{pending.length}</b></span><span>Fets: <b>{done.length}</b></span></div>{editObra8721&&<EditObraModal8721 obra={data.obra||obra} close={()=>setEditObra8721(false)} save={(patch)=>{updateObraFitxa8721?.(patch);setEditObra8721(false)}}/>}
</Card>
}




function EditObraModal8721({obra,close,save}){
const[f,setF]=useState(()=>({...obra}));
function ch(k,v){setF(x=>({...x,[k]:v}))}
return <Modal title="Modificar fitxa de l’obra" close={close}>
  <div className="form-grid">
    <label><span>Nom obra</span><input value={f.nom||""} onChange={e=>ch("nom",e.target.value)}/></label>
    <label><span>Subtítol / resum</span><input value={f.subtitol||""} onChange={e=>ch("subtitol",e.target.value)}/></label>
    <label><span>Promotor / propietat</span><input value={f.propietat||""} onChange={e=>ch("propietat",e.target.value)}/></label>
    <label><span>NIF propietat</span><input value={f.nifPropietat||""} onChange={e=>ch("nifPropietat",e.target.value)}/></label>
    <label><span>Adreça</span><input value={f.adreca||""} onChange={e=>ch("adreca",e.target.value)}/></label>
    <label><span>Població</span><input value={f.poblacio||""} onChange={e=>ch("poblacio",e.target.value)}/></label>
    <label><span>Estat</span><select value={f.estat||"Activa"} onChange={e=>ch("estat",e.target.value)}><option>Activa</option><option>Pendent</option><option>En curs</option><option>Finalitzada</option><option>Tancada</option></select></label>
    <label><span>Tipologia</span><input value={f.tipologia||""} onChange={e=>ch("tipologia",e.target.value)}/></label>
    <label className="span-all"><span>Observacions</span><textarea value={f.observacions||""} onChange={e=>ch("observacions",e.target.value)}/></label>
  </div>
  <div className="modal-actions"><button className="secondary" onClick={close}>Cancel·lar</button><button className="primary" onClick={()=>save(f)}>Guardar canvis</button></div>
</Modal>
}

function Resum({obra,client,data,openAgent}){
let events=data.events||[], actes=data.actes||[], docs=data.documents||[], fotos=data.fotos||[], hores=data.hores||[], pressupostos=data.pressupostosTecnic||[], factures=data.facturesTecnic||[], certs=data.certificacions||[], factObra=data.factures||[];
function evDate(e){return new Date(e.year||0,e.month||0,e.day||1,Number(String(e.hora||"09:00").slice(0,2))||9,Number(String(e.hora||"09:00").slice(3,5))||0)}
let proper=[...events].filter(e=>evDate(e)>=new Date(new Date().toDateString())).sort((a,b)=>evDate(a)-evDate(b))[0]||[...events].sort((a,b)=>evDate(b)-evDate(a))[0];
let totalHores=hores.reduce((s,h)=>s+(+h.hores||0),0);
let costTemps=hores.reduce((s,h)=>s+(+h.hores||0)*(+h.preu||0)+(+h.despeses||0),0);
function itemDateIso(x){return toInputDate8743(x.updatedAt||x.data||x.createdAt||todayISO8743())}
let latest=[];
latest.push(...events.map(e=>({tipus:e.type||"Agenda",data:`${String(e.day||"--").padStart(2,"0")}/${String((e.month??0)+1).padStart(2,"0")}/${e.year||""}`,iso:`${e.year||"0000"}-${String((e.month??0)+1).padStart(2,"0")}-${String(e.day||1).padStart(2,"0")}`,txt:e.title||e.note||"Cita / avís"})));
latest.push(...actes.map(a=>({tipus:"Acta",data:fmtAppDate8748(a.data),iso:itemDateIso(a),txt:a.titol||"Acta d’expedient"})));
latest.push(...certs.map(c=>({tipus:"Certificació",data:fmtAppDate8748(c.data),iso:itemDateIso(c),txt:`Certificació ${c.numero||""} · ${money(c.import||0)}`})));
latest.push(...pressupostos.map(p=>({tipus:"Pressupost",data:fmtAppDate8748(p.data),iso:itemDateIso(p),txt:p.concepte||p.nom||"Pressupost tècnic"})));
latest.push(...factures.map(f=>({tipus:"Factura honoraris",data:fmtAppDate8748(f.data),iso:itemDateIso(f),txt:f.numero||f.concepte||"Factura / proforma"})));
latest.push(...factObra.map(f=>({tipus:"Factura obra",data:fmtAppDate8748(f.data),iso:itemDateIso(f),txt:f.numero||f.concepte||"Factura / proforma obra"})));
latest.push(...hores.map(h=>({tipus:"Temps",data:fmtAppDate8748(h.data),iso:itemDateIso(h),txt:`${h.tasca||h.etiqueta||"Temps registrat"} · ${(+h.hores||0).toFixed(2)} h`})));
latest=latest.sort((a,b)=>String(b.iso||"").localeCompare(String(a.iso||""))).slice(0,8);
const totalItems=events.length+actes.length+docs.length+fotos.length+hores.length+pressupostos.length+factures.length+certs.length+factObra.length;
const pctDocs=Math.min(100,Math.round(((docs.length+fotos.length)+(actes.length?1:0)+(pressupostos.length?1:0)+(factures.length?1:0)+(certs.length?1:0))/7*100));
const donutStyle={background:`conic-gradient(#2563eb 0 ${pctDocs*3.6}deg,#e5e7eb ${pctDocs*3.6}deg 360deg)`};
return <div className="resum-dashboard-v8748">
  <section className="resum-main-v8748">
    <div className="resum-title-v8748"><div><span>Fitxa resum de l’expedient</span><h2>{obra.nom}</h2><p>{client.nom} · {moduleLabel8737(obra)}</p></div><Badge estat={obra.estat}/></div>
    <Card title="Darreres actuacions i avisos"><div className="activity-list-v8748">{latest.length===0&&<div className="activity-empty-v8738"><b>Sense activitat recent</b><span>Les actes, cites, pressupostos, factures i hores apareixeran aquí.</span></div>}{latest.map((x,i)=><div className="activity-row-v8748" key={i}><strong>{x.tipus}</strong><span>{x.txt}</span><em>{x.data}</em></div>)}</div></Card>
    <div className="resum-quick-grid-v8748">
      <div><b>{pressupostos.length}</b><span>Pressupostos</span></div><div><b>{factures.length}</b><span>Factures</span></div><div><b>{actes.length}</b><span>Actes</span></div><div><b>{events.length}</b><span>Avisos</span></div>
    </div>
  </section>
  <aside className="resum-side-v8748">
    <div className="side-card-v8748 blue"><small>Tipus de treball</small><b>{moduleLabel8737(obra)}</b><span>Mòdul 1 · Tècnic</span></div>
    <div className="side-card-v8748"><small>Proper avís / cita</small><b>{proper?proper.title||proper.note:"—"}</b><span>{proper?`${String(proper.day||"").padStart(2,"0")}/${String((+proper.month||0)+1).padStart(2,"0")}/${proper.year||""} · ${proper.hora||""}`:"Sense avisos programats"}</span></div>
    <div className="side-card-v8748 green"><small>Temps registrat</small><b>{totalHores.toFixed(2)} h</b><span>{money(costTemps)} valor intern</span></div>
    <div className="side-card-v8748 amber"><small>Documents / fotos</small><b>{docs.length+fotos.length}</b><span>{docs.length} docs · {fotos.length} fotos</span></div>

  </aside>
</div>
}

function TextAssistitPress8742({setText,existing=[]}){
const baseTemplates=[
  {t:"Projecte tècnic + direcció",v:"Honoraris tècnics per a la redacció del projecte tècnic, documentació gràfica, tramitació administrativa i direcció d’obra del treball encarregat, incloent visites, seguiment, coordinació amb el client i tancament de l’expedient."},
  {t:"Informe tècnic",v:"Honoraris per a visita d’inspecció, presa de dades, anàlisi tècnica, reportatge fotogràfic i redacció d’informe tècnic amb conclusions, recomanacions d’actuació i lliurament en format PDF."},
  {t:"Cèdula / CEE",v:"Honoraris per a visita a l’immoble, presa de dades, comprovació de documentació, elaboració de la cèdula o certificat energètic corresponent i tramitació administrativa davant l’organisme competent."},
  {t:"Direcció / PM",v:"Honoraris per al seguiment tècnic de l’obra, coordinació amb agents intervinents, visites periòdiques, revisió de documentació, control d’incidències, actes de visita i assistència tècnica al client."},
  {t:"Pressupost / amidaments",v:"Honoraris per a l’anàlisi de documentació, presa d’amidaments, elaboració de pressupost detallat, revisió de partides i preparació de documentació per al client."}
];
const learned=[...new Set([...(existing||[]).map(x=>x.text).filter(Boolean),...loadTemplates8743()])].slice(0,5).map((v,i)=>({t:`Text reutilitzat ${i+1}`,v}));
const templates=[...baseTemplates,...learned];
const[prompt,setPrompt]=useState("");
function generate(){
  const p=prompt.trim();
  if(!p)return;
  setText(`Honoraris tècnics per a ${p}, incloent presa de dades, visites necessàries, gestió documental, coordinació amb el client, redacció/preparació de la documentació tècnica corresponent i lliurament final segons l’abast acordat.`);
}
return <div className="text-assist-v8744"><div className="assist-head-v8744"><b>Textos tipus i ajuda ràpida</b><span>Tria un text sencer o escriu una idea i genera una base editable. Més endavant això es podrà connectar amb IA real.</span></div><div className="ai-mini-v8743"><input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ex: informe d’humitats, cèdula, direcció d’obra, amidaments..."/><button type="button" className="secondary" onClick={generate}>Generar text base</button></div><div className="template-cards-v8744">{templates.map(x=><div className="template-card-v8744" key={x.t}><h4>{x.t}</h4><p>{x.v}</p><button type="button" className="secondary" onClick={()=>setText(x.v)}>Aplicar aquest text</button></div>)}</div></div>
}
function QuotePreview8743({type="pressupost",doc,obra,close}){
  const isFactura=type==="factura";
  const title=isFactura?"FACTURA / PROFORMA":"PRESSUPOST";
  const base=baseIva8743(doc), desc=descompteAmount8746(doc), net=invoiceNetBase8746(doc), iva=isFactura?invoiceIvaAmount8746(doc):ivaAmount8743(doc), ret=invoiceRetencioAmount8746(doc), total=isFactura?invoiceTotal8746(doc):base;
  const cfg=(()=>{try{return JSON.parse(lsGet8779("aco_config_v60")||"{}")}catch(e){return {}}})();
  return <Modal title={`Vista prèvia ${isFactura?"factura":"pressupost"}`} close={close}>
    <div className="a4-preview-wrap-v8743 a4-preview-wrap-v8746">
      <div className="quote-a4-v8743 quote-a4-v8744 quote-a4-v8746 print-area">
        <div className="quote-doc-title-v8744"><h1>{title}</h1><b>{doc.numero||"—"}</b></div>
        <div className="quote-parties-v8744"><div><h3>Dades del tècnic</h3><b>{cfg.empresa||"Héctor Cubero / Despatx tècnic"}</b><span>{cfg.email||"Email pendent"}</span><span>NIF / Col·legiat: pendent</span></div><div><h3>Client</h3><b>{obra?.propietat||"Client"}</b><span>NIF: {obra?.nifPropietat||"Pendent"}</span><span>{obra?.adreca||""}</span><span>{obra?.poblacio||""}</span></div></div>
        <div className="quote-exp-box-v8744"><b>Expedient</b><span>{expedientCode8739(obra)} · {obra?.nom}</span><small>Data: {doc.data||"—"}</small></div>
        <table className="quote-a4-table-v8743 quote-a4-table-v8746"><colgroup><col className="col-concepte"/><col className="col-import"/></colgroup><thead><tr><th>Concepte</th><th>{isFactura?"Import":"Import sense IVA"}</th></tr></thead><tbody><tr><td><b>{doc.concepte||"Honoraris tècnics"}</b><p>{doc.text||"—"}</p></td><td className="numcell"><b>{money(isFactura?base:total)}</b></td></tr></tbody></table>
        {isFactura?<div className="quote-a4-totals-v8743 quote-a4-totals-v8746"><div><span>Base imposable</span><b>{money(base)}</b></div>{desc>0&&<div><span>Descompte ({doc.descompte||0}%)</span><b>-{money(desc)}</b></div>}<div><span>IVA ({doc.iva||21}%)</span><b>{money(iva)}</b></div>{ret>0&&<div><span>Retenció ({doc.retencio||0}%)</span><b>-{money(ret)}</b></div>}<div className="total"><span>Total</span><b>{money(total)}</b></div></div>:<div className="quote-notes-v8746"><b>Observacions</b><p>{doc.observacions||pressupostFooter8746(doc)}</p></div>}
        <div className="quote-a4-footer-v8734">{isFactura?(doc.observacions||doc.compteBancari||cfg.compteBancari||"Forma de pagament i número de compte pendent d’indicar."):"Document provisional pendent d’adaptar a dades fiscals definitives del tècnic/despatx."}</div>
      </div>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={()=>printQuote8745(type,doc,obra)}>Imprimir / PDF</button><button className="primary" onClick={close}>Tancar</button></div>
  </Modal>
}
function InlineQuotePreview8744({type="pressupost",doc,obra}){
  const isFactura=type==="factura";
  const total=isFactura?invoiceTotal8746(doc):baseIva8743(doc);
  return <div className="inline-preview-v8744"><div className="inline-a4-v8744"><div><b>{isFactura?"Factura / proforma":"Pressupost"}</b><span>{doc.concepte||"Honoraris tècnics"}</span></div><p>{doc.text||"Text pendent"}</p><strong>{isFactura?"Total factura":"Import sense IVA"}: {money(total)}</strong><small>{expedientCode8739(obra)} · {obra?.propietat||"Client"}</small></div></div>
}
function PressupostTecnic8738({data,obra,addPressupost,updatePressupost,facturarPressupost,deletePressupost,openEmail,openDoc}){
  const rows=data.pressupostosTecnic||[];
  const[open,setOpen]=useState(false);
  const[editing,setEditing]=useState(null);
  const[preview,setPreview]=useState(null);
  const[text,setText]=useState("Honoraris tècnics per als treballs professionals indicats, incloent gestió, documentació i seguiment de l’expedient segons l’abast acordat amb el client.");
  const[form,setForm]=useState({concepte:"Honoraris tècnics",base:"0",iva:"21",data:todayISO8743(),estat:"Esborrany",validesa:"2 mesos",taxesIncloses:"no_incloses",observacions:""});
  function reset(p=null){if(p){setEditing(p.id);setForm({concepte:p.concepte||"Honoraris tècnics",base:String(p.base||0),iva:String(p.iva||21),data:toInputDate8743(p.data),estat:p.estat||"Esborrany",validesa:p.validesa||"2 mesos",taxesIncloses:p.taxesIncloses||"no_incloses",observacions:p.observacions||""});setText(p.text||"");setOpen(true)}else{setEditing(null);setForm({concepte:"Honoraris tècnics",base:"0",iva:"21",data:todayISO8743(),estat:"Esborrany",validesa:"2 mesos",taxesIncloses:"no_incloses",observacions:""});setText("Honoraris tècnics per als treballs professionals indicats, incloent gestió, documentació i seguiment de l’expedient segons l’abast acordat amb el client.");setOpen(false)}}
  function submit(e){e.preventDefault();const payload={...form,text,base:+form.base||0,iva:+form.iva||21,estat:form.estat||"Esborrany"};saveTemplate8743(text);if(editing)updatePressupost?.(editing,payload);else addPressupost?.(payload);reset(null)}
  const liveDoc={...form,text,base:+form.base||0,iva:+form.iva||21};
  return <div className="stack quote-module-v8742 quote-module-v8743 quote-module-v8744">{preview&&<QuotePreview8743 type="pressupost" doc={preview} obra={obra} close={()=>setPreview(null)}/>}<Card title="Pressupostos" action={<button className="primary" onClick={()=>{setOpen(true);setEditing(null)}}><Plus/> Nou pressupost</button>}>
    <div className="module-note-v8738"><b>Pressupost professional del tècnic.</b><span>Per honoraris, informes, cèdules, CEE, direccions, project management o altres treballs tècnics. No és el pressupost econòmic d’obra.</span></div>
    {open&&<form className="quote-form-v8742 quote-form-v8744" onSubmit={submit}>
      <div className="quote-form-main-v8744"><div><div className="form-grid"><label><span>Concepte</span><input value={form.concepte} onChange={e=>setForm({...form,concepte:e.target.value})}/></label><label><span>Base imposable</span><input type="number" step="0.01" value={form.base} onChange={e=>setForm({...form,base:e.target.value})}/></label><label><span>IVA %</span><input type="number" step="1" value={form.iva} onChange={e=>setForm({...form,iva:e.target.value})}/></label><label><span>Data</span><input type="date" value={form.data||todayISO8743()} onChange={e=>setForm({...form,data:e.target.value})}/></label><label><span>Estat</span><select value={form.estat||"Esborrany"} onChange={e=>setForm({...form,estat:e.target.value})}><option>Esborrany</option><option>Enviat</option><option>Acceptat</option><option>Facturat</option><option>Descartat</option></select></label></div>
      <TextAssistitPress8742 setText={setText} existing={rows}/>
      <label className="span-all quote-text-v8742 quote-text-v8744"><span>Text del pressupost</span><textarea value={text} onChange={e=>setText(e.target.value)}/></label><div className="form-grid small-options-v8746"><label><span>Validesa pressupost</span><select value={form.validesa||"2 mesos"} onChange={e=>setForm({...form,validesa:e.target.value})}><option>1 mes</option><option>2 mesos</option><option>3 mesos</option></select></label><label><span>Taxes / visats</span><select value={form.taxesIncloses||"no_incloses"} onChange={e=>setForm({...form,taxesIncloses:e.target.value})}><option value="no_incloses">No incloses</option><option value="incloses">Incloses</option></select></label></div><label className="span-all quote-text-v8742 quote-text-v8744"><span>Notes / observacions del pressupost</span><textarea value={form.observacions||""} onChange={e=>setForm({...form,observacions:e.target.value})} placeholder="Si ho deixes buit, s’afegirà la nota habitual d’IVA no inclòs, validesa i taxes."/></label>
      <div className="quote-total-v8742"><span>Total amb IVA</span><b>{money((+form.base||0)*(1+(+form.iva||0)/100))}</b></div>
      <div className="modal-actions"><button type="button" className="secondary" onClick={()=>reset(null)}>Cancel·lar</button><button className="primary">{editing?"Guardar canvis":"Guardar pressupost"}</button></div></div><InlineQuotePreview8744 type="pressupost" doc={liveDoc} obra={obra}/></div>
    </form>}
    <div className="quote-list-v8742 quote-list-v8743 quote-list-v8744">{rows.length===0&&<Empty text="Encara no hi ha pressupostos en aquest expedient."/>}{rows.map(r=><div className="quote-row-v8742 quote-row-v8743 quote-row-v8744" key={r.id}><div><strong>{r.numero||"PRE"}</strong><span>{r.concepte||"Pressupost"}</span><small>{r.data||"—"} · {r.estat||"Pendent"}</small></div><b>{money(totalIva8743(r))}<small>IVA inclòs</small></b><div className="actions-inline"><button className="secondary" onClick={()=>setPreview(r)}>Veure PDF</button><button className="secondary" onClick={()=>reset(r)}>Editar</button><button className="secondary" onClick={()=>updatePressupost?.(r.id,{estat:"Acceptat"})}>Acceptar</button><button className="secondary" onClick={()=>facturarPressupost?.(r.id)}>Fer factura</button><button className="secondary" onClick={()=>openEmail?.("Pressupost")}>Enviar</button><button className="danger" onClick={()=>deletePressupost?.(r.id)}>Eliminar</button></div></div>)}</div>
  </Card></div>
}
function FacturesTecniques8738({data,obra,addFactura,updateFactura,deleteFactura,openEmail,openDoc}){
  const rows=uniqueFactures8743(data.facturesTecnic||[]);
  const[open,setOpen]=useState(false);
  const[editing,setEditing]=useState(null);
  const[preview,setPreview]=useState(null);
  const[text,setText]=useState("Factura corresponent als honoraris tècnics dels treballs professionals realitzats segons pressupost acceptat.");
  const[form,setForm]=useState({concepte:"Honoraris tècnics",base:"0",iva:"21",retencio:"0",descompte:"0",compteBancari:"",observacions:"",data:todayISO8743(),estat:"Esborrany"});
  function reset(f=null){if(f){setEditing(f.id);setForm({concepte:f.concepte||"Honoraris tècnics",base:String(f.base||0),iva:String(f.iva||21),retencio:String(f.retencio||0),descompte:String(f.descompte||0),compteBancari:f.compteBancari||"",observacions:f.observacions||"",data:toInputDate8743(f.data),estat:f.estat||"Esborrany"});setText(f.text||"");setOpen(true)}else{setEditing(null);setForm({concepte:"Honoraris tècnics",base:"0",iva:"21",retencio:"0",descompte:"0",compteBancari:"",observacions:"",data:todayISO8743(),estat:"Esborrany"});setText("Factura corresponent als honoraris tècnics dels treballs professionals realitzats segons pressupost acceptat.");setOpen(false)}}
  function submit(e){e.preventDefault();const payload={...form,text,base:+form.base||0,iva:+form.iva||21,retencio:+form.retencio||0,descompte:+form.descompte||0,estat:form.estat||"Esborrany"};if(editing)updateFactura?.(editing,payload);else addFactura?.(payload);reset(null)}
  const liveDoc={...form,text,base:+form.base||0,iva:+form.iva||21};
  return <div className="stack quote-module-v8743 quote-module-v8744">{preview&&<QuotePreview8743 type="factura" doc={preview} obra={obra} close={()=>setPreview(null)}/>}<Card title="Factures" action={<button className="primary" onClick={()=>setOpen(!open)}><Plus/> Nova factura</button>}>
    <div className="module-note-v8738"><b>Facturació del treball professional.</b><span>Pot sortir d’un pressupost acceptat o crear-se manualment amb conceptes afegits.</span></div>
    {open&&<form className="quote-form-v8742 quote-form-v8744" onSubmit={submit}><div className="quote-form-main-v8744"><div><div className="form-grid"><label><span>Concepte</span><input value={form.concepte} onChange={e=>setForm({...form,concepte:e.target.value})}/></label><label><span>Base imposable</span><input type="number" step="0.01" value={form.base} onChange={e=>setForm({...form,base:e.target.value})}/></label><label><span>IVA %</span><input type="number" step="1" value={form.iva} onChange={e=>setForm({...form,iva:e.target.value})}/></label><label><span>Descompte %</span><input type="number" step="1" value={form.descompte||"0"} onChange={e=>setForm({...form,descompte:e.target.value})}/></label><label><span>Retenció %</span><select value={form.retencio||"0"} onChange={e=>setForm({...form,retencio:e.target.value})}><option value="0">0%</option><option value="7">7%</option><option value="15">15%</option></select></label><label><span>Data</span><input type="date" value={form.data||todayISO8743()} onChange={e=>setForm({...form,data:e.target.value})}/></label><label><span>Estat</span><select value={form.estat||"Esborrany"} onChange={e=>setForm({...form,estat:e.target.value})}><option>Esborrany</option><option>Enviada</option><option>Cobrada</option><option>Anul·lada</option></select></label></div><label className="span-all quote-text-v8742 quote-text-v8744"><span>Text factura</span><textarea value={text} onChange={e=>setText(e.target.value)}/></label><label className="span-all quote-text-v8742 quote-text-v8744"><span>Compte bancari / observacions de pagament</span><textarea value={form.compteBancari||""} onChange={e=>setForm({...form,compteBancari:e.target.value})} placeholder="Ex: Pagament per transferència al compte ES..."/></label><label className="span-all quote-text-v8742 quote-text-v8744"><span>Observacions factura</span><textarea value={form.observacions||""} onChange={e=>setForm({...form,observacions:e.target.value})}/></label><div className="quote-total-v8742"><span>Total amb IVA</span><b>{money(invoiceTotal8746({...form,base:+form.base||0,iva:+form.iva||21,retencio:+form.retencio||0,descompte:+form.descompte||0}))}</b></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>reset(null)}>Cancel·lar</button><button className="primary">{editing?"Guardar canvis":"Guardar factura"}</button></div></div><InlineQuotePreview8744 type="factura" doc={liveDoc} obra={obra}/></div></form>}
    <div className="quote-list-v8742 quote-list-v8743 quote-list-v8744">{rows.length===0&&<Empty text="Encara no hi ha factures en aquest expedient."/>}{rows.map(f=><div className="quote-row-v8742 quote-row-v8743 quote-row-v8744" key={f.id}><div><strong>{f.numero||"FAC"}</strong><span>{f.concepte||f.tipus||"Factura / proforma"}</span><small>{f.data||"—"} · {f.estat||"Pendent"}</small></div><b>{money(totalIva8743(f))}<small>IVA inclòs</small></b><div className="actions-inline"><button className="secondary" onClick={()=>setPreview(f)}>Veure PDF</button><button className="secondary" onClick={()=>reset(f)}>Editar</button><button className="secondary" onClick={()=>openEmail?.("Factura")}>Enviar</button><button className="danger" onClick={()=>deleteFactura?.(f.id)}>Eliminar</button></div></div>)}</div>
  </Card></div>
}
function Pressupost({data,setData,importExcel,deletePressupostVersion,duplicatePressupostVersion,openPartida,openEmail,openDoc,client,clientHistoricalPartides=[],budgetGroups=[],activeBudgetId="principal",selectBudget,addBudget,totalGlobal=0,totalActive=0}){
  const [caps,setCaps]=useState(()=>group(data.partides||[],"cap"));
  const [open,setOpen]=useState(()=>Object.fromEntries(Object.keys(group(data.partides||[],"cap")).map((k,i)=>[k,i===0])));
  const [descOpen875,setDescOpen875]=useState({});
  const [editBudget8760b,setEditBudget8760b]=useState(false);
  const [capNameDraft8761,setCapNameDraft8761]=useState({});
  useEffect(()=>{
    if(!editBudget8760b)setCapNameDraft8761({});
  },[editBudget8760b]);
  const clientLibraryKey87115=`aco_partides_client_v87115_${String(client?.id||client?.nom||client?.rao||"general").toLowerCase().replace(/[^a-z0-9_-]+/g,"_")}`;
  const [libraryOpen87115,setLibraryOpen87115]=useState(false);
  const [librarySearch87115,setLibrarySearch87115]=useState("");
  const [libraryCap87115,setLibraryCap87115]=useState("");
  const [libraryTargetCap87115,setLibraryTargetCap87115]=useState("");
  const [libraryItems87115,setLibraryItems87115]=useState(()=>lsJson8779(clientLibraryKey87115,[]));
  useEffect(()=>{setLibraryItems87115(lsJson8779(clientLibraryKey87115,[]));setLibrarySearch87115("");setLibraryCap87115("");setLibraryTargetCap87115("")},[clientLibraryKey87115]);
  const historicalSeedSig87116=useMemo(()=>{
    const rows=(clientHistoricalPartides||[]).filter(r=>r&&String(r.concepte||"").trim());
    return rows.map(r=>`${r.sourceObraId||"obra"}:${r.codi||""}:${r.cap||""}:${r.concepte||""}:${r.ut||""}:${r.pu||0}`).join("|");
  },[clientHistoricalPartides]);
  useEffect(()=>{
    if(!historicalSeedSig87116)return;
    const seedKey=`${clientLibraryKey87115}__history_seed_v87116`;
    if(lsGet8779(seedKey,"")===historicalSeedSig87116)return;
    const rows=(clientHistoricalPartides||[]).filter(r=>r&&String(r.concepte||"").trim()).map(r=>normalizeLibPartida87115({...r,tipus:`Històric ${r.sourceObra||"client"}`},r.cap||"General"));
    if(!rows.length)return;
    setLibraryItems87115(prev=>{
      const map=new Map();
      [...(prev||[]),...rows].forEach(x=>map.set(`${String(x.cap||"").toLowerCase()}__${String(x.concepte||"").toLowerCase()}__${String(x.ut||"").toLowerCase()}`,x));
      return [...map.values()].sort((a,b)=>String(a.cap||"").localeCompare(String(b.cap||""),"ca",{numeric:true})||String(a.concepte||"").localeCompare(String(b.concepte||""),"ca",{numeric:true}));
    });
    lsSet8779(seedKey,historicalSeedSig87116);
  },[historicalSeedSig87116,clientLibraryKey87115]);
  useEffect(()=>{lsSet8779(clientLibraryKey87115,JSON.stringify(libraryItems87115||[]))},[clientLibraryKey87115,libraryItems87115]);
  function currentLibraryDestinationCap87115(){return libraryTargetCap87115||sortedCapEntries8779(caps)[0]?.[0]||"C01 NOU CAPÍTOL"}
  function normalizeLibPartida87115(row={},cap=""){
    return {id:row.id&&String(row.id).startsWith("lib-")?row.id:`lib-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,cap:String(row.cap||cap||"General"),codi:String(row.codi||""),ut:String(row.ut||"ut"),concepte:String(row.concepte||"Nova partida"),desc:String(row.desc||""),pu:+row.pu||0,tipus:String(row.tipus||"Llibreria client")};
  }
  function savePartidaToLibrary87115(row,cap){
    const item=normalizeLibPartida87115(row,cap);
    setLibraryItems87115(prev=>{
      const key=(x)=>`${String(x.cap||"").toLowerCase()}__${String(x.concepte||"").toLowerCase()}__${String(x.ut||"").toLowerCase()}`;
      const rest=(prev||[]).filter(x=>key(x)!==key(item));
      return [...rest,item].sort((a,b)=>String(a.cap||"").localeCompare(String(b.cap||""),"ca",{numeric:true})||String(a.concepte||"").localeCompare(String(b.concepte||""),"ca",{numeric:true}));
    });
    setLibraryOpen87115(true);
  }
  function seedLibraryFromBudget87115(){
    const flat=Object.entries(caps||{}).flatMap(([cap,items])=>(items||[]).map(r=>normalizeLibPartida87115(r,cap)));
    if(!flat.length)return alert("No hi ha partides per guardar a la llibreria.");
    setLibraryItems87115(prev=>{
      const map=new Map();
      [...(prev||[]),...flat].forEach(x=>map.set(`${String(x.cap||"").toLowerCase()}__${String(x.concepte||"").toLowerCase()}__${String(x.ut||"").toLowerCase()}`,x));
      return [...map.values()].sort((a,b)=>String(a.cap||"").localeCompare(String(b.cap||""),"ca",{numeric:true})||String(a.concepte||"").localeCompare(String(b.concepte||""),"ca",{numeric:true}));
    });
    setLibraryOpen87115(true);
  }
  function startManualBudget87115(){
    const hasRows=Object.values(caps||{}).some(arr=>(arr||[]).length);
    if(hasRows&&!confirm("Aquest pressupost ja té partides. Vols substituir la vista d'edició per un pressupost manual buit? Primer guarda o crea un annex si vols conservar l'actual."))return;
    const nom="C01 NOU CAPÍTOL";
    setCaps({[nom]:[]});setOpen({[nom]:true});setEditBudget8760b(true);setLibraryOpen87115(true);setLibraryTargetCap87115(nom);
  }
  function addLibraryPartidaToBudget87115(item){
    if(!editBudget8760b){alert("Primer activa el mode edició del pressupost.");return;}
    const dest=currentLibraryDestinationCap87115();
    setCaps(p=>{
      const arr=[...(p[dest]||[])];
      const base=(String(dest).match(/(\d+)/)?.[1]||"").padStart(2,"0");
      const next=arr.length+1;
      const row={...item,id:undefined,cap:dest,codi:item.codi|| (base?`${base}.${String(next).padStart(2,"0")}`:""),q:1,pu:+item.pu||0,tipus:item.tipus||"Llibreria client"};
      return {...p,[dest]:[...arr,row]};
    });
    setOpen(o=>({...o,[dest]:true}));
  }
  function deleteLibraryItem87115(id){if(confirm("Eliminar aquesta partida de la llibreria del client?"))setLibraryItems87115(prev=>(prev||[]).filter(x=>x.id!==id))}
  const libraryCaps87115=[...new Set((libraryItems87115||[]).map(x=>x.cap||"General"))].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true}));
  const libraryFiltered87115=(libraryItems87115||[]).filter(x=>{
    const q=librarySearch87115.trim().toLowerCase();
    const okQ=!q||[x.codi,x.concepte,x.desc,x.ut].some(v=>String(v||"").toLowerCase().includes(q));
    const okCap=!libraryCap87115||String(x.cap||"")===libraryCap87115;
    return okQ&&okCap;
  });
  function saveBudget8760b(){
    const flat=sortedCapEntries8779(caps).flatMap(([cap,items])=>sortPartides8779(items).map(r=>({...r,cap})));
    setData?.(d=>({...d,partides:flat}));
    setEditBudget8760b(false);
  }
  function cancelBudget8760b(){
    const syncCaps=group(data.partides||[],"cap");
    setCaps(syncCaps);
    setOpen(Object.fromEntries(Object.keys(syncCaps).map((k,i)=>[k,i===0])));
    setEditBudget8760b(false);
  }
  function capOrder8779(name){const m=String(name||"").match(/(\d+)/);return m?Number(m[1]):9999}
  function sortedCapEntries8779(obj){return Object.entries(obj||{}).sort((a,b)=>capOrder8779(a[0])-capOrder8779(b[0])||String(a[0]).localeCompare(String(b[0]),"ca",{numeric:true}))}
  function sortPartides8779(items){return [...(items||[])].sort((a,b)=>String(a.codi||"").localeCompare(String(b.codi||""),"ca",{numeric:true}))}

  useEffect(()=>{if(editBudget8760b)return;const syncCapsV874=group(data.partides||[],"cap");setCaps(syncCapsV874);setOpen(Object.fromEntries(Object.keys(syncCapsV874).map((k,i)=>[k,i===0])));},[data.partides,editBudget8760b]);


  function upd(cap,i,k,v){
    if(!editBudget8760b)return;
    setCaps(p=>{
      const n={...p};
      n[cap]=[...(n[cap]||[])];
      n[cap][i]={...n[cap][i],[k]:v};
      return n;
    });
  }

  function renameCap(oldName,v){
    if(!editBudget8760b)return;
    const nv=String(v||"").trim();
    if(!nv || nv===oldName)return;
    setCaps(p=>{
      const n={};
      Object.entries(p).forEach(([k,items])=>{
        n[k===oldName?nv:k]=items;
      });
      return n;
    });
    setOpen(o=>{
      const n={};
      Object.entries(o).forEach(([k,val])=>{
        n[k===oldName?nv:k]=val;
      });
      return n;
    });
  }

  function addCapitol(){
    if(!editBudget8760b)return;
    const nums=Object.keys(caps).map(capOrder8779).filter(n=>n<9999);
    const next=(nums.length?Math.max(...nums)+1:1);
    const nom=`C${String(next).padStart(2,"0")} NOU CAPÍTOL`;
    setCaps(p=>({...p,[nom]:[]}));
    setOpen(o=>({...o,[nom]:true}));
  }

  function deleteCapitol(cap){
    if(!editBudget8760b)return;
    const nPart=(caps[cap]||[]).length;
    if(!confirm(`Eliminar el capítol "${cap}" i ${nPart} partida/es?`))return;
    setCaps(p=>{const n={...p};delete n[cap];return n});
    setOpen(o=>{const n={...o};delete n[cap];return n});
  }

  function addPartida(cap){
    if(!editBudget8760b)return;
    setCaps(p=>{const arr=[...(p[cap]||[])];const base=(String(cap).match(/(\d+)/)?.[1]||"").padStart(2,"0");const next=arr.length+1;return {...p,[cap]:[...arr,{codi:base?`${base}.${String(next).padStart(2,"0")}`:"",cap,concepte:"Nova partida",ut:"ut",q:1,pu:0,tipus:"Base"}]}});
    setOpen(o=>({...o,[cap]:true}));
  }

  const total=Object.values(caps).flat().reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
  const realPressupostos=(data.pressupostos||[]).filter(p=>!String(p.id||"").startsWith("budget-marker-")&&p.versio!=="Annex");
  const visiblePressupostos=realPressupostos.length?realPressupostos:(data.pressupostos||[]).filter(p=>String(p.id||"").startsWith("budget-marker-")||p.versio==="Annex");

  return <div className="stack">
    <Card title={`Versions de pressupost · ${budgetLabel8786(data,data.activeBudgetIdObra||"principal")}`} action={<div className="actions-inline"><button type="button" className="secondary" onClick={startManualBudget87115}>+ Manual des de 0</button><label className="secondary upload-label"><Upload/> Importar Excel<input type="file" onChange={importExcel}/></label></div>}>
      {budgetGroups?.length>0&&<div className="budget-mobile-inline-v87116"><label><span>Pressupost actiu</span><select value={activeBudgetId} onChange={e=>selectBudget?.(e.target.value)}>{budgetGroups.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select></label><div className="budget-mobile-inline-actions-v87116"><button type="button" className="secondary small" onClick={()=>addBudget?.("Pressupost manual des de 0")}>+ Manual</button><button type="button" className="secondary small" onClick={()=>addBudget?.("Imprevist / sobrecost")}>+ Imprevist</button><button type="button" className="secondary small" onClick={()=>addBudget?.("Modificat aprovat")}>+ Annex</button></div><small>Pressupost seleccionat: <b>{budgetLabel8786(data,activeBudgetId)}</b> · {money(totalActive)} / global {money(totalGlobal)}</small></div>}
      <details className="excel-help-v8746"><summary>ⓘ Guia per importar Excel correctament</summary><p>Estructura recomanada: columna A = codi o número de partida, B = unitat, C = concepte/descripció, D = columna lliure, E = amidament/quantitat, F = preu unitari, G = total.</p></details><div className="version-list">
        {visiblePressupostos.length===0?<Empty text="Aquesta obra encara no té cap pressupost. Importa un Excel o crea partides manualment."/>:visiblePressupostos.map(p=><div className="version-card-v872" key={p.id}>
          <button className="version-main-v872" onClick={()=>openDoc({type:"pressupost",title:p.nom+" · "+p.versio,subtitle:p.data+" · "+p.estat})}>
            <strong>{p.versio}</strong><span>{p.nom}</span><span>{p.data}</span><b>{money(p.import)}</b><em>{p.estat}</em>
          </button>
          <div className="version-actions-v872">
            <button className="secondary small" onClick={()=>duplicatePressupostVersion?.(p.id)}>Duplicar</button>
            <button className="danger small" onClick={()=>deletePressupostVersion?.(p.id)}>Eliminar</button>
          </div>
        </div>)}
      </div>
    </Card>

    <Card title="Pressupost obra per capítols" action={<div className="actions-inline"><span className="budget-grand-total">Total: <b>{money(total)}</b></span>{!editBudget8760b&&<button type="button" className="primary" onClick={()=>setEditBudget8760b(true)}>Editar</button>}{editBudget8760b&&<><button type="button" className="primary" onClick={saveBudget8760b}>Guardar canvis</button><button type="button" className="secondary" onClick={cancelBudget8760b}>Cancel·lar</button></>}<button type="button" className="secondary" onClick={()=>setLibraryOpen87115(v=>!v)}>Llibreria client</button><button className="secondary" onClick={()=>openEmail("Pressupost obra")}><Mail/> Enviar email</button></div>}>
      <div className={editBudget8760b?"edit-warning-v8760b":"view-warning-v8760b"}>{editBudget8760b?"Mode edició actiu. Guarda els canvis quan acabis.":"Mode consulta. Clica Editar per modificar capítols o partides."}</div>{libraryOpen87115&&<div className="client-library-panel-v87115"><div className="client-library-head-v87115"><div><b>Llibreria de partides del client</b><span>{client?.nom||client?.rao||"Client general"} · {libraryItems87115.length} partides guardades</span></div><button type="button" className="secondary small" onClick={seedLibraryFromBudget87115}>Guardar pressupost actual a llibreria</button></div><div className="client-library-filters-v87115"><input value={librarySearch87115} onChange={e=>setLibrarySearch87115(e.target.value)} placeholder="Filtrar per nom, codi o descripció"/><select value={libraryCap87115} onChange={e=>setLibraryCap87115(e.target.value)}><option value="">Tots els capítols</option>{libraryCaps87115.map(c=><option key={c}>{c}</option>)}</select><select value={libraryTargetCap87115} onChange={e=>setLibraryTargetCap87115(e.target.value)}><option value="">Afegir al primer capítol</option>{sortedCapEntries8779(caps).map(([cap])=><option key={cap} value={cap}>{cap}</option>)}</select></div><div className="client-library-list-v87115">{libraryFiltered87115.length===0?<div className="empty-mini-v87115">No hi ha partides a la llibreria amb aquest filtre. Pots guardar partides del pressupost actual o crear-les manualment.</div>:libraryFiltered87115.slice(0,80).map(item=><div className="client-library-row-v87115" key={item.id}><div><strong>{item.concepte}</strong><span>{item.cap} · {item.codi||"sense codi"} · {item.ut} · PU {money(item.pu||0)}</span>{item.desc&&<small>{item.desc}</small>}</div><button type="button" className="primary small" onClick={()=>addLibraryPartidaToBudget87115(item)}>Afegir</button><button type="button" className="danger small" onClick={()=>deleteLibraryItem87115(item.id)}>Eliminar</button></div>)}</div></div>}<div className={editBudget8760b?"budget-v25":"budget-v25 pressupost-readonly-v8760b"}>
        {Object.entries(caps).length===0&&<Empty text="Sense capítols. Crea un capítol o importa un Excel."/>}
        {sortedCapEntries8779(caps).map(([cap,items])=>{
          const capTotal=items.reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
          return <div className="budget-v25-cap" key={cap}>
            <div className="budget-v25-cap-head">
              <button onClick={()=>setOpen(o=>({...o,[cap]:!o[cap]}))}>{open[cap]?"▾":"▸"}</button>
              <input value={capNameDraft8761[cap]??cap} onChange={e=>setCapNameDraft8761(p=>({...p,[cap]:e.target.value}))} onBlur={e=>renameCap(cap,e.target.value)} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur()}}/>
              <span>{items.length} partides</span>
              <strong>{money(capTotal)}</strong>{editBudget8760b&&<button type="button" className="danger small" onClick={()=>deleteCapitol(cap)}>Eliminar capítol</button>}
            </div>

            {open[cap]&&<div className="budget-v25-lines">
              <div className="budget-v25-line head"><span>Codi</span><span>Ut</span><span>Concepte</span><span>Amid.</span><span>Preu/ut</span><span>Total</span></div>
              {sortPartides8779(items).map((r)=>{
                const i=(items||[]).findIndex(x=>x===r);
                const t=(+r.q||0)*(+r.pu||0);
                return <div className="budget-v25-line" key={i}>
                  <input value={r.codi||""} onChange={e=>upd(cap,i,"codi",e.target.value)}/>
                  <input value={r.ut||""} onChange={e=>upd(cap,i,"ut",e.target.value)}/>
                  <div className="budget-concept-v877"><div className="concept-line-v877"><input value={r.concepte||""} onChange={e=>upd(cap,i,"concepte",e.target.value)}/>{r.desc&&<button type="button" className="desc-toggle-v877" onClick={()=>setDescOpen875(o=>({...o,[`${cap}-${i}`]:!o[`${cap}-${i}`]}))}>{descOpen875[`${cap}-${i}`]?"Amagar":"Veure desc."}</button>}{editBudget8760b&&<button type="button" className="lib-save-btn-v87115" onClick={()=>savePartidaToLibrary87115(r,cap)}>Guardar llibreria</button>}</div>{r.desc&&descOpen875[`${cap}-${i}`]&&<small>{r.desc}</small>}</div>
                  <input type="number" step="0.01" value={Number(r.q||0).toFixed(2)} onChange={e=>upd(cap,i,"q",e.target.value)} onBlur={e=>upd(cap,i,"q",Number(e.target.value||0).toFixed(2))}/>
                  <input type="number" step="0.01" value={Number(r.pu||0).toFixed(2)} onChange={e=>upd(cap,i,"pu",e.target.value)} onBlur={e=>upd(cap,i,"pu",Number(e.target.value||0).toFixed(2))}/>
                  <b>{money(t)}</b>
                </div>
              })}
              {editBudget8760b&&<button className="secondary add-line-btn" onClick={()=>addPartida(cap)}>+ Afegir partida</button>}
            </div>}
          </div>
        })}
        {editBudget8760b&&<button type="button" className="primary add-chapter-bottom-v8779" onClick={addCapitol}><Plus/> Nou capítol</button>}
      </div>
    </Card>
  </div>
}










function medicioCalc8780(line,ut=""){
  const u=parseNum8770(line.unitats||1)||0;
  const l=parseNum8770(line.llargada||0), a=parseNum8770(line.amplada||0), h=parseNum8770(line.alcada||0);
  const unit=String(ut||"").toLowerCase();
  if(unit.includes("m3")||unit.includes("m³"))return u*(l||1)*(a||1)*(h||1);
  if(unit.includes("m2")||unit.includes("m²"))return u*(l||1)*(a||1);
  if(unit.includes("ml")||unit==="m")return u*(l||1);
  return u || l || 0;
}
function medicioTotal8780(lines=[],ut=""){return (lines||[]).reduce((s,l)=>s+medicioCalc8780(l,ut),0)}
function MedicioModal8780({row,certNum,initial=[],close,save}){
  const [lines,setLines]=useState((initial&&initial.length?initial:[{id:"m-"+Date.now(),concepte:"",unitats:"1",llargada:"",amplada:"",alcada:""}]).map(x=>({...x})));
  function upd(id,k,v){setLines(p=>p.map(l=>l.id===id?{...l,[k]:v}:l))}
  function add(){setLines(p=>[...p,{id:"m-"+Date.now()+"-"+p.length,concepte:"",unitats:"1",llargada:"",amplada:"",alcada:""}])}
  function del(id){setLines(p=>p.filter(l=>l.id!==id))}
  const total=medicioTotal8780(lines,row?.ut);
  return <Modal title={`Línies de medició · ${row?.codi||""} · CERT. ${certNum}`} close={close}>
    <div className="medicio-modal-v8780">
      <div className="module-note-v8738"><b>{row?.concepte}</b><span>Introdueix línies tipus Presto. El total s’aplica automàticament com a amidament de la certificació actual.</span></div>
      <div className="table-wrap"><table className="medicio-table-v8780"><thead><tr><th>Concepte</th><th>Unitats</th><th>Llargada</th><th>Amplada</th><th>Alçada</th><th>Total línia</th><th></th></tr></thead><tbody>
        {lines.map(l=><tr key={l.id}><td><input value={l.concepte||""} onChange={e=>upd(l.id,"concepte",e.target.value)} placeholder="Ex: façana principal"/></td><td><input inputMode="decimal" value={l.unitats||""} onChange={e=>upd(l.id,"unitats",e.target.value)}/></td><td><input inputMode="decimal" value={l.llargada||""} onChange={e=>upd(l.id,"llargada",e.target.value)}/></td><td><input inputMode="decimal" value={l.amplada||""} onChange={e=>upd(l.id,"amplada",e.target.value)}/></td><td><input inputMode="decimal" value={l.alcada||""} onChange={e=>upd(l.id,"alcada",e.target.value)}/></td><td><b>{qty2(medicioCalc8780(l,row?.ut))}</b></td><td><button className="danger small" onClick={()=>del(l.id)}>Eliminar</button></td></tr>)}
      </tbody><tfoot><tr><th colSpan="5">TOTAL AMIDAMENT ({row?.ut||"ut"})</th><th>{qty2(total)}</th><th></th></tr></tfoot></table></div>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={add}>+ Afegir línia</button><button className="secondary" onClick={close}>Cancel·lar</button><button className="primary" onClick={()=>save(lines,total)}>Guardar línies i aplicar total</button></div>
  </Modal>
}

function Cert({data,setData,updateCert,addCertificacio,deleteCertificacio8721,updateCertDate8721,updateCertDate,ci,setCi,saveCert,openEmail,openDoc}){
const certs=data.certificacions||[];
const[selected,setSelected]=useState(certs.find(c=>+c.numero===2)?.id||certs[0]?.id||null);
const[editing,setEditing]=useState(false);
const[draft,setDraft]=useState({});
const[certDescOpen875,setCertDescOpen875]=useState({});
const[certCapsOpen879,setCertCapsOpen879]=useState({});
const[certMode8711,setCertMode8711]=useState("resum");
const[medicioTarget8780,setMedicioTarget8780]=useState(null);
const[includeMesures8780,setIncludeMesures8780]=useState(false);
const[dateDraft8721,setDateDraft8721]=useState({});
const[dateDraftSafe8720,setDateDraftSafe8720]=useState({});
let rows=data.partides||[], caps=group(rows,"cap");
let cert=certs.find(c=>c.id===selected)||certs.find(c=>+c.numero===2)||certs[0]||null;
let certNum=cert?+cert.numero:1;
let prevNum=certNum>1?certNum-1:0;
useEffect(()=>{setDraft({})},[selected]);
useEffect(()=>{if(certs.length){setSelected(certs[certs.length-1].id)}},[certs.length]);
function dateVal8721(c){return dateDraft8721[c.id]??fmtDate8714(c.data)}
function saveDates8721(){
  certs.forEach(c=>{
    if(dateDraft8721[c.id]!==undefined)updateCertDate8721?.(c.id,dateDraft8721[c.id])
  });
  setDateDraft8721({});
}

function dateValSafe8720(c){return dateDraftSafe8720[c.id]??fmtDate8714(c.data)}
function saveDatesSafe8720(){
  certs.forEach(c=>{if(dateDraftSafe8720[c.id]!==undefined)updateCertDateSafe8720?.(c.id,dateDraftSafe8720[c.id])});
  setDateDraftSafe8720({});
}


function fieldFor(n){return "cert_"+n}
function qFor(r,n){if(n<=0)return 0;const lines=(r.certMesuresByNum||{})[String(n)];if(lines&&lines.length)return medicioTotal8780(lines,r.ut);if(r.certsByNum&&r.certsByNum[String(n)]!==undefined)return +r.certsByNum[String(n)]||0;if(n===1)return +r.certAnterior||0;if(n===2)return +r.certActual||0;return 0}
function qDraft(r){let raw=draft[r.codi]??String(qFor(r,certNum));let q=parseNum8770(raw);return Number.isFinite(q)?q:qFor(r,certNum)}
function imp(r,n){return qFor(r,n)*(+r.pu||0)}
function qOrigin(r){let total=0;for(let i=1;i<=certNum;i++)total+=i===certNum?qDraft(r):qFor(r,i);return total}
function certTotal(n){return rows.reduce((s,r)=>s+(n===certNum?qDraft(r):qFor(r,n))*(+r.pu||0),0)}
function totalOrigin(){return rows.reduce((s,r)=>s+qOrigin(r)*(+r.pu||0),0)}
function commitOne(codi,v){let val=parseNum8770(v);if(!Number.isFinite(val))val=0;updateCert?.(codi,fieldFor(certNum),val)}
function guardarAmidaments(){Object.entries(draft).forEach(([codi,v])=>commitOne(codi,v));setDraft({});setEditing(false)}
function pc(q,r){return (+r.q||0)?q/(+r.q)*100:0}
function saveMesures8780(codi,lines,total){setData?.(d=>({...d,partides:(d.partides||[]).map(r=>r.codi===codi?{...r,certMesuresByNum:{...(r.certMesuresByNum||{}),[String(certNum)]:lines},certsByNum:{...(r.certsByNum||{}),[String(certNum)]:total},certAnterior:certNum===1?total:r.certAnterior,certActual:certNum===2?total:r.certActual}:r)}));setDraft(x=>({...x,[codi]:String(total)}));setMedicioTarget8780(null)}
function focusNextCertInput878106(e){
  if(e.key!=="Enter")return;
  e.preventDefault();
  const inputs=[...document.querySelectorAll(".cert-edit-input-v69")];
  const idx=inputs.indexOf(e.currentTarget);
  const next=inputs[idx+1];
  if(next){next.focus();next.select?.();}
}

return <div className="stack">{medicioTarget8780&&<MedicioModal8780 row={medicioTarget8780} certNum={certNum} initial={(medicioTarget8780.certMesuresByNum||{})[String(certNum)]||[]} close={()=>setMedicioTarget8780(null)} save={(lines,total)=>saveMesures8780(medicioTarget8780.codi,lines,total)}/>}
<Card title={`Certificacions obra realitzades · ${budgetLabel8786(data,data.activeBudgetIdObra||"principal")}`} action={<div className="actions-inline"><button className="secondary" onClick={saveDates8721}>Guardar dates</button><button className="primary" onClick={()=>{addCertificacio?.();setCertMode8711("emplenar")}}>+ Nova certificació</button></div>}>
  <div className="version-list">{certs.length===0?<Empty text="Aquesta obra encara no té certificacions guardades."/>:certs.map(c=><div className={`version-row cert-row-v8721 ${selected===c.id?"active":""}`} key={c.id} onClick={()=>{setSelected(c.id);setCertMode8711("resum")}}><b>Certificació {c.numero}</b><input type="date" className="cert-date-input-v8721" value={toInputDate8743(dateVal8721(c))} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>setDateDraft8721(d=>({...d,[c.id]:e.target.value}))}/><strong>{money(rows.reduce((s,r)=>s+qFor(r,+c.numero)*(+r.pu||0),0))}</strong><button className="danger mini-v8721" onClick={e=>{e.stopPropagation();deleteCertificacio8721?.(c.id)}}>Eliminar</button><em>{selected===c.id?"Seleccionada":"Veure"}</em></div>)}</div>
</Card>
<Card title={`CERTIFICACIÓ ${certNum} ACTUAL · ${prevNum?`Cert. ${prevNum} anterior + `:"sense anterior + "}Cert. ${certNum}`}>
  <div className="cert-mode-tabs-v8711">
    <button className={certMode8711==="resum"?"active":""} onClick={()=>setCertMode8711("resum")}>Vista resum</button>
    <button className={certMode8711==="emplenar"?"active":""} onClick={()=>setCertMode8711("emplenar")}>Emplenar certificació</button>
  </div>
  <div className="cert-toolbar-v69">
    <div><b>{editing?`Editant CERT. ${certNum}`:"Consulta bloquejada"}</b><span>La certificació anterior és només consulta. La certificació actual és l’única editable i l’única que passa a la seva proforma.</span></div>
    <div className="actions-inline">
      <button className="secondary" onClick={()=>{setEditing(!editing);setCertMode8711("emplenar")}}>{editing?"Tancar edició":`Editar amidaments CERT. ${certNum}`}</button>
      <button className="primary" onClick={guardarAmidaments}><Save/> Guardar amidaments</button>
      <label className="check-print-v8780"><input type="checkbox" checked={includeMesures8780} onChange={e=>setIncludeMesures8780(e.target.checked)}/> Imprimir línies de medició</label>
      <button className="primary" onClick={()=>openDoc({type:"certificacio",autoPrint:true,title:`CERTIFICACIÓ ${certNum}`,subtitle:`Import: ${money(certTotal(certNum))}`,certNum,prevNum,includeMesures:includeMesures8780,rows:rows.map(r=>({...r,qPrev:qFor(r,prevNum),qAct:qDraft(r),qOrigen:qOrigin(r),impOrigen:qOrigin(r)*(+r.pu||0),pctOrigen:pc(qOrigin(r),r),mesures:(r.certMesuresByNum||{})[String(certNum)]||[]})),totalActual:certTotal(certNum),totalOrigen:totalOrigin(),data:fmtDate8714(cert?.data)})}>Imprimir / PDF</button>
    </div>
  </div>
  {certMode8711==="resum"&&<CertResumV69 data={data}/>} 
  {certMode8711==="emplenar"&&<div className="cert-grid-wrap-v69">
    <div className="cert-grid-v69 group">
      <div className="g pressupost">PRESSUPOST</div>
      <div className="g anterior">{prevNum?`CERTIFICACIÓ ${prevNum} · ANTERIOR`:"SENSE CERT. ANTERIOR"}</div>
      <div className="g actual">CERTIFICACIÓ {certNum} · ACTUAL</div>
      <div className="g origen">A ORIGEN</div>
    </div>
    <div className="cert-grid-v69 header">
      <div>Partida</div><div>Ut</div><div>Resum</div><div>CanPres</div><div>PrPres</div><div>ImpPres</div>
      <div>Q cert. {prevNum||"ant."}</div><div>% cert. {prevNum||"ant."}</div><div>Imp cert. {prevNum||"ant."}</div>
      <div>Q cert. {certNum}</div><div>% cert. {certNum}</div><div>Imp cert. {certNum}</div>
      <div>Q origen</div><div>% origen</div><div>Total origen</div>
    </div>
    {Object.entries(caps).map(([cap,items],capIdx)=>{
      const isOpen=certCapsOpen879[cap]??(capIdx===0);
      return <div key={cap}>
      <button type="button" className="cert-cap-v69 cert-cap-toggle-v879" onClick={()=>setCertCapsOpen879(o=>({...o,[cap]:!isOpen}))}><span>{isOpen?"▾":"▸"} {cap}</span><b>{items.length} partides</b></button>
      {isOpen&&items.map(r=>{
        let qp=qFor(r,prevNum), qa=qDraft(r), ip=qp*(+r.pu||0), ia=qa*(+r.pu||0), qo=qOrigin(r), io=qo*(+r.pu||0);
        return <div className="cert-grid-v69 row" key={r.codi}>
          <div>{r.codi}</div><div>{r.ut}</div><div className="concept cert-concept-v877"><div className="concept-line-v877"><span>{r.concepte}</span>{r.desc&&<button type="button" className="desc-toggle-v877" onClick={()=>setCertDescOpen875(o=>({...o,[r.codi]:!o[r.codi]}))}>{certDescOpen875[r.codi]?"Amagar":"Veure desc."}</button>}</div>{r.desc&&certDescOpen875[r.codi]&&<small>{r.desc}</small>}</div><div>{qty2(r.q)}</div><div>{money(r.pu)}</div><div>{money((+r.q||0)*(+r.pu||0))}</div>
          <div className={qp>0?"prev-fill":""}>{qty2(qp)}</div><div className={qp>0?"prev-fill":""}>{pct(pc(qp,r))}</div><div className={qp>0?"prev-fill":""}>{money(ip)}</div>
          <div className={qa>0?"current-fill":""}><div className="cert-current-cell-v8780">{editing?<><input className="cert-edit-input-v69" inputMode="decimal" value={draft[r.codi]??String(qFor(r,certNum))} onKeyDown={focusNextCertInput878106} onChange={e=>setDraft(d=>({...d,[r.codi]:e.target.value}))} onBlur={e=>commitOne(r.codi,e.target.value)}/><button type="button" className="measure-btn-v8780" title="Línies de medició" onClick={()=>setMedicioTarget8780(r)}>∑</button></>:qty2(qFor(r,certNum))}</div></div>
          <div className={qa>0?"current-fill":""}>{pct(pc(qa,r))}</div><div className={qa>0?"current-fill":""}>{money(ia)}</div>
          <div className={qo>0?"origin-fill":""}>{qty2(qo)}</div><div className={qo>0?"origin-fill":""}>{pct(pc(qo,r))}</div><div className={qo>0?"origin-fill":""}>{money(io)}</div>
        </div>
      })}
    </div>})}
    <div className="cert-grid-v69 total">
      <div className="total-label">TOTAL CERTIFICACIÓ {prevNum||"ANTERIOR"}</div><div>{money(certTotal(prevNum))}</div>
      <div className="total-label2">TOTAL CERTIFICACIÓ {certNum}</div><div>{money(certTotal(certNum))}</div>
      <div className="total-label3">TOTAL A ORIGEN</div><div>{money(totalOrigin())}</div>
    </div>
  </div>}
</Card>
</div>
}

function CertResumV69({data}){
let rows=data.partides||[], caps=group(rows,"cap"), certs=data.certificacions||[];
function qFor(r,n){return certQty8783(r,n)}
function impFor(r,n){return qFor(r,n)*(+r.pu||0)}
let capRows=Object.entries(caps).map(([cap,items])=>{
  let pressupost=items.reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
  let vals=certs.map(c=>items.reduce((s,r)=>s+impFor(r,+c.numero),0));
  let total=vals.reduce((s,v)=>s+v,0);
  let pendent=Math.max(pressupost-total,0);
  let percent=pressupost?Math.min(total/pressupost*100,999):0;
  return{cap,pressupost,vals,total,pendent,percent}
});
let totalPres=rows.reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
let totalCerts=certs.map(c=>Math.max(rows.reduce((s,r)=>s+impFor(r,+c.numero),0),Number(c.import)||0));
let totalExec=totalCerts.reduce((s,v)=>s+v,0);
return <div className="cert-resum-v8717">
  <div className="cert-resum-row-v8717 head">
    <span className="cap">CAPÍTOL</span><span className="pres">PRESSUPOST</span>{certs.map(c=><span className="cert" key={c.id}>CERT. {c.numero}</span>)}<span className="total">TOTAL CERT.</span><span className="pct">% EXECUTAT</span><span className="pendent">IMPORT PENDENT</span>
  </div>
  {capRows.map(r=><div className="cert-resum-row-v8717" key={r.cap}>
    <b className="cap">{r.cap}</b><span className="pres">{money(r.pressupost)}</span>{r.vals.map((v,i)=><span className="cert" key={i}>{money(v)}</span>)}<strong className="total">{money(r.total)}</strong><ProgressV69 v={r.percent}/><span className="pendent">{money(r.pendent)}</span>
  </div>)}
  <div className="cert-resum-row-v8717 total-row">
    <b className="cap">TOTAL</b><span className="pres">{money(totalPres)}</span>{totalCerts.map((v,i)=><span className="cert" key={i}>{money(v)}</span>)}<strong className="total">{money(totalExec)}</strong><ProgressV69 v={totalPres?totalExec/totalPres*100:0}/><span className="pendent">{money(Math.max(totalPres-totalExec,0))}</span>
  </div>
</div>
}
function ProgressV69({v}){return <div className="progress-v69"><div><i style={{width:`${Math.min(v,100)}%`}}/></div><em>{pct(v)}</em></div>}


function fmtDate8714(v){
  if(!v || String(v).toLowerCase()==="avui") return todayShort8713();
  return String(v);
}
function Fact({data,openEmail,openDoc}){
const key=lsKey8779("aco_fact_params_v61");
const[params,setParams]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||"{}")}catch(e){return {}}});
const[selected,setSelected]=useState(null);
useEffect(()=>{localStorage.setItem(key,JSON.stringify(params))},[params,key]);
function p(id,k,def){return params[id]?.[k]??def}
function setp(id,k,v){setParams(x=>({...x,[id]:{...(x[id]||{}),[k]:v}}))}
function qFor(r,c){let n=+c.numeroCert||+c.numero;return certQty8783(r,n)}
function rowsForCert(c){return (data.partides||[]).filter(r=>qFor(r,{numeroCert:c.numero,numero:c.numero})>0)}
function originRowsForProforma(c){return originRowsForCert8793(data.partides||[],+c.numero)}
let proformes=(data.certificacions||[]).map(c=>{let rows=rowsForCert(c);let allRows=originRowsForProforma(c);let fin=certFinancialSummary8793(data.partides||[],+c.numero);let base=fin.actual || rows.reduce((s,r)=>s+qFor(r,{numeroCert:c.numero,numero:c.numero})*(+r.pu||0),0);return{...c,pfId:"pf-"+c.numero,numeroCert:c.numero,numero:"PF-"+String(c.numero).padStart(3,"0"),base:base||c.import||0,rows,allRows,certTotals:fin.certTotals,totalOrigen:fin.totalOrigen,anterior:fin.anterior}});
let current=proformes.find(f=>f.pfId===selected)||proformes[0]||null;
function calc(f){let iva=+p(f.pfId,"iva",21),ret=+p(f.pfId,"ret",0),ded=+p(f.pfId,"ded",0),base=f.base*(1-ded/100),ivaImp=base*iva/100,retImp=base*ret/100,total=base+ivaImp-retImp;return{iva,ret,ded,base,ivaImp,retImp,total}}
const basePressupostObra=(data.partides||[]).reduce((s,r)=>s+(+r.q||0)*(+r.pu||0),0);
const totalBaseProformes=proformes.reduce((s,f)=>s+(+f.base||0),0);
const totalProformes=proformes.reduce((s,f)=>s+calc(f).total,0);
const factPct=basePressupostObra?Math.min(totalBaseProformes/basePressupostObra*100,999):0;
function openPrint(f){let c=calc(f);openDoc({type:"proforma",autoPrint:true,title:`Proforma ${f.numero}`,subtitle:`Certificació ${f.numeroCert} · ${fmtDate8714(f.data)}`,proforma:f,iva:c.iva,ret:c.ret,ded:c.ded,total:c.total,base:c.base,ivaImp:c.ivaImp,retImp:c.retImp})}
return <div className="fact-layout-v61 fact-layout-v87101">
<Card title={`Factures proforma de certificacions · ${budgetLabel8786(data,data.activeBudgetIdObra||"principal")}`}>
  <div className="fact-summary-v87101"><div><span>Pressupost obra</span><b>{money(basePressupostObra)}</b></div><div><span>Base facturada/proforma</span><b>{money(totalBaseProformes)}</b></div><div><span>Total IVA inclòs</span><b>{money(totalProformes)}</b></div><div className="ring-mini-v87101"><i style={{background:`conic-gradient(#2563eb 0 ${Math.min(factPct,100)}%, #e5e7eb ${Math.min(factPct,100)}% 100%)`}}/><b>{pct(factPct)}</b><span>Facturat sobre pressupost</span></div></div>
  <div className="verifactu-note-v87101"><b>VERI*FACTU / factura definitiva</b><span>Bloc reservat per la futura emissió de factura definitiva verificable: QR, registre d’alta, empremta/hash i enviament a AEAT quan s’integri el servei. Les proformes actuals no són factura definitiva.</span></div>
  <div className="table-wrap fact-compact-wrap-v70"><table className="invoice-table fact-compact-v70 fact-table-v87101"><thead><tr><th>Proforma</th><th>Cert.</th><th>Data</th><th>Base</th><th>IVA</th><th>Retenció</th><th>Deducció</th><th>Total</th><th>Accions</th></tr></thead><tbody>
  {proformes.length===0&&<tr><td colSpan="9"><Empty text="Encara no hi ha proformes. Guarda una certificació per generar-ne l’esborrany."/></td></tr>}
  {proformes.map(f=>{let c=calc(f);return <tr key={f.pfId} className={current?.pfId===f.pfId?"selected-row":""}><td><b>{f.numero}</b></td><td>{f.numeroCert}</td><td>{fmtDate8714(f.data)}</td><td>{money(f.base)}</td><td><select value={c.iva} onChange={e=>setp(f.pfId,"iva",+e.target.value)}><option value="21">21%</option><option value="10">10%</option><option value="0">0%</option></select></td><td><select value={c.ret} onChange={e=>setp(f.pfId,"ret",+e.target.value)}><option value="0">0%</option><option value="7">7%</option><option value="15">15%</option><option value="19">19%</option></select></td><td><select value={c.ded} onChange={e=>setp(f.pfId,"ded",+e.target.value)}>{Array.from({length:11}).map((_,i)=><option value={i*5}>{i*5}%</option>)}</select></td><td><b>{money(c.total)}</b></td><td className="row-actions"><button className="primary small" onClick={()=>openPrint(f)}>Imprimir / PDF</button></td></tr>})}
  </tbody></table></div>
</Card>

</div>}
function ProformaPreviewV61({f,calc,qFor}){
const originRows=f.allRows||f.rows||[];
const certNum=+f.numeroCert||+f.numero||1;
const certTotals=f.certTotals||[];
const prevTotals=certTotals.filter(c=>+c.n<certNum);
const totalOrigen=f.totalOrigen||originRows.reduce((s,r)=>s+(+r.impOrigin||0),0);
return <div className="proforma-a4-wrap-v8748"><div className="proforma-preview-doc-v61 proforma-a4-v8748">
  <div className="doc-title-row"><div><h2>FACTURA PROFORMA</h2><p>{f.numero} · Certificació {f.numeroCert} · {fmtDate8714(f.data)}</p></div><b>{money(calc.total)}</b></div>
  <h3>Partides certificades a origen</h3>
  <table><thead><tr><th>Partida</th><th>Concepte</th><th>Q origen</th><th>PU</th><th>Total origen</th></tr></thead><tbody>{originRows.map(r=><tr key={r.codi}><td>{r.codi}</td><td className="concept">{r.concepte}</td><td className="num">{qty2(r.qOrigin??originRowsForCert8793([r],f.numeroCert)[0]?.qOrigin??qFor(r,f))}</td><td className="num">{money(r.pu)}</td><td className="num">{money(r.impOrigin??((r.qOrigin??qFor(r,f))*(+r.pu||0)))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL A ORIGEN</th><th className="num">{money(totalOrigen)}</th></tr></tfoot></table>
  <h3>Deducció de certificacions anteriors</h3>
  <table className="totals-preview"><tbody><tr><th>Total certificat a origen</th><td className="num">{money(totalOrigen)}</td></tr>{prevTotals.length===0?<tr><th>No hi ha certificacions anteriors</th><td className="num">{money(0)}</td></tr>:prevTotals.map(c=><tr key={c.n}><th>Deducció Certificació {c.n}</th><td className="num">-{money(c.total)}</td></tr>)}<tr className="total"><th>Import sense IVA Cert. {certNum}</th><td className="num">{money(f.base)}</td></tr></tbody></table>
  <table className="totals-preview"><tbody><tr><th>Deducció ({calc.ded}%)</th><td>-{money(f.base-calc.base)}</td></tr><tr><th>Base imposable</th><td>{money(calc.base)}</td></tr><tr><th>IVA ({calc.iva}%)</th><td>{money(calc.ivaImp)}</td></tr><tr><th>Retenció ({calc.ret}%)</th><td>-{money(calc.retImp)}</td></tr><tr className="total"><th>Total proforma</th><td>{money(calc.total)}</td></tr></tbody></table>
</div></div>
}


function Actes({data,allAgents:globalAgents=[],openActa,openEmail,openDoc,selected,setSelected}){const allAgents=ensureAgents8748(uniqAgents8749([...(globalAgents||[]),...(data.agents||[])]));const[local,setLocal]=useState(data.actes||[]);const[actaDocs,setActaDocs]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_acta_docs"))||"[]"));const[actaPhotos,setActaPhotos]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_acta_photos"))||"[]"));useEffect(()=>{localStorage.setItem(lsKey8779("aco_acta_docs"),JSON.stringify(actaDocs))},[actaDocs]);useEffect(()=>{localStorage.setItem(lsKey8779("aco_acta_photos"),JSON.stringify(actaPhotos))},[actaPhotos]);let a=local.find(x=>x.id===selected)||local[0];let idx=local.findIndex(x=>x.id===a?.id),prev=idx>0?local[idx-1]:null;function toggleAgent(id,on){setLocal(p=>p.map(x=>x.id===a.id?{...x,agents:on?[...new Set([...x.agents,id])]:x.agents.filter(z=>z!==id)}:x))}function updateText(v){setLocal(p=>p.map(x=>x.id===a.id?{...x,text:v}:x))}function addDocs(e){[...(e.target.files||[])].forEach(f=>setActaDocs(p=>[...p,{id:"ad-"+Date.now()+Math.random(),actaId:a?.id,nom:f.name,tipus:f.name.split(".").pop()?.toUpperCase()||"DOC"}]))}function addPhotos(e){[...(e.target.files||[])].forEach(f=>{let r=new FileReader();r.onload=()=>setActaPhotos(p=>[...p,{id:"ap-"+Date.now()+Math.random(),actaId:a?.id,nom:f.name,url:r.result}]);r.readAsDataURL(f)})}let docs=actaDocs.filter(d=>d.actaId===a?.id),photos=actaPhotos.filter(p=>p.actaId===a?.id);return <div className="actes-layout"><Card title="Actes creades" action={<button className="primary" onClick={openActa}><Plus/> Nova acta</button>}><div className="acta-list">{local.length===0?<Empty text="Encara no hi ha actes creades."/>:local.map(x=><button className={`acta-list-row ${a?.id===x.id?"active":""}`} onClick={()=>setSelected(x.id)}><strong>{x.titol}</strong><span>{x.data}</span><small>{x.agents.map(id=>allAgents.find(ag=>ag.id===id)?.nom).filter(Boolean).join(", ")}</small></button>)}</div></Card>{a&&<Card title={`Visualització / edició · ${a.titol}`} action={<div className="actions-inline"><button className="secondary" onClick={()=>openDoc({type:"acta",title:a.titol,subtitle:a.data,acta:a,agents:allAgents,actaPhotos:photos,actaDocs:docs})}>Obrir document</button><button className="secondary" onClick={()=>openEmail(a.titol)}><Mail/> Enviar Gmail</button></div>}><div className="previous-acta">{prev?<><b>Consideracions de l’acta anterior ({prev.data})</b><label><input type="checkbox"/> Validat / resolt</label><p>{prev.text}</p></>:<p>No hi ha acta anterior.</p>}</div><div className="form-grid"><Input label="Títol acta" defaultValue={a.titol}/><Input label="Data" defaultValue={a.data}/><Input label="Obra" defaultValue={a.obra}/><Input label="Signatura" defaultValue={a.signatura}/><label className="span-all"><span>Assistents / intervinents a l’acta</span><div className="check-grid">{allAgents.map(ag=><label className="check-row"><input type="checkbox" checked={a.agents.includes(ag.id)} onChange={e=>toggleAgent(ag.id,e.target.checked)}/><span>{ag.nom} · {ag.rol}</span></label>)}</div></label><label className="span-all"><span>Observacions / decisions preses</span><textarea value={a.text} onChange={e=>updateText(e.target.value)}/></label></div><div className="upload-grid"><label><Camera/> Afegir fotos<input type="file" multiple accept="image/*" onChange={addPhotos}/></label><label><Paperclip/> Afegir documents<input type="file" multiple onChange={addDocs}/></label><button><PenLine/> Signatura mòbil</button></div><div className="attached-list">{photos.map(p=><span>📷 {p.nom}</span>)}{docs.map(d=><span>📎 {d.nom}</span>)}</div><div className="card-actions"><button className="primary"><Save/> Guardar canvis</button></div></Card>}</div>}


function AgentsObraCard({data,openAgent}){
const[q,setQ]=useState("");
const[editing,setEditing]=useState(null);
const[local,setLocal]=useState(data.agents||[]);
const roles=["Promotor","Arquitecte","Arquitecte tècnic","Direcció Facultativa","Constructor","Autònom","Subcontractat","Industrial","Administració","Altres"];
let filtered=local.filter(a=>(a.nom+" "+a.rol+" "+a.empresa+" "+a.email).toLowerCase().includes(q.toLowerCase()));
function upd(id,k,v){setLocal(p=>p.map(a=>a.id===id?{...a,[k]:v}:a))}
function remove(id){if(confirm("Segur que vols eliminar aquest agent?"))setLocal(p=>p.filter(a=>a.id!==id))}
return <Card title="Agents de l’obra" action={<button className="secondary" onClick={openAgent}><Plus/> Nou agent</button>}>
<div className="pro-search-line"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtrar per nom, rol, empresa o email..."/></div>
<div className="agents-pro-table">
<div className="agents-pro-head"><span>Nom</span><span>Rol</span><span>Empresa</span><span>Email</span><span>Telèfon</span><span>Accions</span></div>
{filtered.length===0?<Empty text="No hi ha agents amb aquest filtre."/>:filtered.map(a=>{
let edit=editing===a.id;
return <div className="agents-pro-row" key={a.id}>
{edit?<>
<input value={a.nom||""} onChange={e=>upd(a.id,"nom",e.target.value)}/>
<select value={a.rol||"Altres"} onChange={e=>upd(a.id,"rol",e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select>
<input value={a.empresa||""} onChange={e=>upd(a.id,"empresa",e.target.value)}/>
<input value={a.email||""} onChange={e=>upd(a.id,"email",e.target.value)}/>
<input value={a.telefon||""} onChange={e=>upd(a.id,"telefon",e.target.value)}/>
<div className="line-actions"><button className="secondary" onClick={()=>setEditing(null)}>Guardar</button><button className="danger" onClick={()=>remove(a.id)}>Eliminar</button></div>
</>:<>
<strong>{a.nom}</strong>
<span>{a.rol}</span>
<span>{a.empresa}</span>
<span>{a.email}</span>
<span>{a.telefon||"—"}</span>
<div className="line-actions"><button className="secondary" onClick={()=>setEditing(a.id)}>Editar</button><button className="danger" onClick={()=>remove(a.id)}>Eliminar</button></div>
</>}
</div>})}
</div>
</Card>}

function SeguimentFotos(){const[photos,setPhotos]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_photos"))||"[]"));useEffect(()=>{localStorage.setItem(lsKey8779("aco_photos"),JSON.stringify(photos))},[photos]);function add(e){let files=[...(e.target.files||[])];files.forEach(f=>{let r=new FileReader();r.onload=()=>setPhotos(p=>[...p,{id:"ph-"+Date.now()+Math.random(),name:f.name,url:r.result}]);r.readAsDataURL(f)})}return <Card title="Fotografies" action={<label className="primary upload-label"><Plus/> Afegir fotografies<input type="file" multiple accept="image/*" onChange={add}/></label>}><div className="real-photo-grid">{photos.length===0?<Empty text="Encara no hi ha fotografies. També les podràs incorporar directament dins les actes."/>:photos.map(p=><div><img src={p.url}/><span>{p.name}</span></div>)}</div></Card>}

function openDocsDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open("aco_documents_db",1);req.onupgradeneeded=()=>{req.result.createObjectStore("files")};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function saveDocFile(id,file){const db=await openDocsDB();return new Promise((resolve,reject)=>{const tx=db.transaction("files","readwrite");tx.objectStore("files").put(file,id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
async function getDocFile(id){const db=await openDocsDB();return new Promise((resolve,reject)=>{const tx=db.transaction("files","readonly");const req=tx.objectStore("files").get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function deleteDocFile(id){const db=await openDocsDB();return new Promise((resolve,reject)=>{const tx=db.transaction("files","readwrite");tx.objectStore("files").delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}


function getStorageCfg(){
  try{return JSON.parse(localStorage.getItem(lsKey8779("aco_supabase_storage"))||"{}")}catch{return {}}
}
function saveStorageCfg(cfg){
  localStorage.setItem(lsKey8779("aco_supabase_storage"),JSON.stringify(cfg||{}));
}
function isStorageReady(cfg){
  return !!(cfg?.url && cfg?.anon && cfg?.bucket);
}
function cleanStoragePath(s){
  return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._/-]+/g,"-").replace(/-+/g,"-");
}
async function uploadToSupabaseStorage(file,meta={}){
  const cfg=getStorageCfg();
  if(!isStorageReady(cfg)) throw new Error("Supabase Storage no configurat");
  const obraId=cleanStoragePath(meta.obraId||"obra");
  const id=meta.id||("d"+Date.now());
  const name=cleanStoragePath(file.name||"document");
  const path=`${obraId}/${id}-${name}`;
  const url=`${cfg.url.replace(/\/$/,"")}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${path}`;
  const res=await fetch(url,{method:"POST",headers:{apikey:cfg.anon,Authorization:`Bearer ${cfg.anon}`,"Content-Type":file.type||"application/octet-stream","x-upsert":"true"},body:file});
  if(!res.ok){throw new Error(await res.text())}
  return {path,publicUrl:`${cfg.url.replace(/\/$/,"")}/storage/v1/object/public/${encodeURIComponent(cfg.bucket)}/${path}`};
}
async function deleteFromSupabaseStorage(path){
  const cfg=getStorageCfg();
  if(!isStorageReady(cfg)||!path) return false;
  const res=await fetch(`${cfg.url.replace(/\/$/,"")}/storage/v1/object/${encodeURIComponent(cfg.bucket)}`,{method:"DELETE",headers:{apikey:cfg.anon,Authorization:`Bearer ${cfg.anon}`,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[path]})});
  return res.ok;
}

function documentFolders8775(obra,data={}){
  const tipus=canonicalWorkType8740(obra?.tipusTreball||obra?.tipologia||"");
  const add=(arr,id,label,desc)=>arr.some(x=>x.id===id)?arr:[...arr,{id,label,desc}];
  let folders=[];
  folders=add(folders,"00_DESPATX_TECNIC","00 · Despatx tècnic / honoraris","Pressupostos d’honoraris, factures del tècnic i documents interns del despatx vinculats a aquest expedient. No és documentació econòmica de l’obra.");
  folders=add(folders,"01_DOCUMENTACIO_PREVIA","01 · Documentació prèvia","Encàrrec, informació rebuda, fitxa inicial, documentació del client i antecedents.");
  if(["Projecte / llicència d’obres","Tràmit municipal / llicència / comunicació","Activitat / adequació de local","Certificat energètic","Cèdula d’habitabilitat","ITE / IEE / inspecció d’edifici","Postobra / documentació final"].includes(tipus)) folders=add(folders,"01_TRAMITS_AJUNTAMENT","01 · Ajuntament / tràmits","Llicències, comunicacions, taxes, requeriments, registre i justificants.");
  if(["Projecte / llicència d’obres","Pressupost d’obra / amidaments","Direcció / seguiment d’obra","Gestió integral d’obra","Plànols / aixecament","Render / 3D / visualització","Activitat / adequació de local","Postobra / documentació final"].includes(tipus)) folders=add(folders,"02_PLANOLS","02 · Plànols","DWG, PDF, aixecaments, as-built, bases gràfiques i plànols marcats.");
  if(["Projecte / llicència d’obres","Pressupost d’obra / amidaments","Control econòmic d’obra","Gestió integral d’obra"].includes(tipus)) folders=add(folders,"03_AMIDAMENTS_PRESSUPOST_OBRA","03 · Amidaments / pressupost d’obra","Amidaments, pressupost base, descompostos i versions del pressupost d’obra.");
  if(["Pressupost d’obra / amidaments","Control econòmic d’obra","Gestió integral d’obra","Direcció / seguiment d’obra"].includes(tipus)) folders=add(folders,"04_PRESSUPOSTS_INDUSTRIALS","04 · Pressupostos industrials","Ofertes de paleteria, pintura, fusteria, serralleria, instal·lacions, bastida, treballs verticals i comparatius.");
  if(["Projecte / llicència d’obres","Direcció / seguiment d’obra","Gestió integral d’obra","Seguretat i salut"].includes(tipus)) folders=add(folders,"05_SEGURETAT_SALUT","05 · Seguretat i salut","EBSS, ESS, PSS, obertura centre, CSS i documentació preventiva.");
  if(["Direcció / seguiment d’obra","Gestió integral d’obra","Seguretat i salut"].includes(tipus)) folders=add(folders,"06_ACTES_SEGUIMENT_FOTOS","06 · Actes / seguiment / fotos","Actes, visites, incidències, fotografies d’obra i documents de seguiment.");
  if(["Direcció / seguiment d’obra","Gestió integral d’obra","Control econòmic d’obra"].includes(tipus)) folders=add(folders,"07_CERTIFICACIONS_FACTURACIO_OBRA","07 · Certificacions / facturació obra","Certificacions, albarans, factures d’obra i documentació econòmica de l’obra.");
  folders=add(folders,"08_DOCUMENTACIO_FINAL","08 · Documentació final / entrega","CFO, llibre de l’edifici, manuals, garanties, as-built final i lliurament al client.");
  folders=add(folders,"99_ALTRES","99 · Altres","Documents puntuals pendents d’ordenar o que no encaixen en cap carpeta.");
  return folders;
}

function Documents({obra,data,setData,openEmail,openDoc}){
const docs=data.documents||[];
const folders=documentFolders8775(obra,data);
const[folder,setFolder]=useState(folders[0]?.id||"00_DESPATX_TECNIC");
const[cfg,setCfg]=useState(()=>getStorageCfg());
const[showCfg,setShowCfg]=useState(!isStorageReady(getStorageCfg()));
const[status,setStatus]=useState("");
const activeFolder=folders.find(f=>f.id===folder)||folders[0];
function setDocs(updater){setData(d=>{const current=d.documents||[];const next=typeof updater==="function"?updater(current):updater;return {...d,documents:next};});}
function docFolder(d){return d.folder||"01_DOCUMENTACIO_PREVIA"}
function saveCfg(){saveStorageCfg(cfg);setStatus(isStorageReady(cfg)?"Storage configurat. Prova pujar un document.":"Falten dades de configuració.")}
async function add(e){let f=e.target.files?.[0];if(!f)return;let id=`doc-${obra?.id||"exp"}-${Date.now()}`,tipus=f.name.split(".").pop()?.toUpperCase()||"DOC";let baseMeta={id,obraId:obra?.id,nom:f.name,tipus,folder,data:new Date().toLocaleDateString("ca-ES"),size:f.size};try{if(isStorageReady(cfg)){setStatus("Pujant document a Supabase Storage...");let up=await uploadToSupabaseStorage(f,{id,obraId:obra?.id||"expedient",folder});setDocs(p=>[{...baseMeta,storage:"supabase",path:up.path,url:up.publicUrl,hasFile:true},...p]);setStatus("Document pujat a Supabase Storage.");return;}await saveDocFile(id,f);setDocs(p=>[{...baseMeta,storage:"indexeddb",hasFile:true},...p]);setStatus(`Document guardat a ${activeFolder?.label||"Documents"}.`);}catch(err){try{await saveDocFile(id,f);setDocs(p=>[{...baseMeta,storage:"indexeddb",hasFile:true,error:String(err?.message||err)},...p]);setStatus("No s’ha pogut pujar a Supabase. S’ha guardat localment en aquest navegador.");}catch(e2){setDocs(p=>[{...baseMeta,storage:"registre",hasFile:false,error:String(err?.message||err)},...p]);setStatus("No s’ha pogut guardar l’original. Revisa Storage o mida del fitxer.")}}finally{if(e?.target)e.target.value=""}}
async function openOriginal(d){if(d.storage==="supabase"&&d.url){window.open(d.url,"_blank");return}if(d.hasFile){let file=await getDocFile(d.id);if(file){let url=URL.createObjectURL(file);window.open(url,"_blank");return}}openDoc({type:"document",title:d.nom,subtitle:"Document registrat. L’original no està disponible."})}
async function remove(d){if(!confirm("Segur que vols eliminar aquest document d’aquest expedient?"))return;if(d.storage==="supabase"&&d.path) await deleteFromSupabaseStorage(d.path).catch(()=>{});if(d.storage==="indexeddb"||d.hasFile) await deleteDocFile(d.id).catch(()=>{});setDocs(p=>p.filter(x=>x.id!==d.id))}
function moveDoc(d,newFolder){setDocs(p=>p.map(x=>x.id===d.id?{...x,folder:newFolder}:x))}
function sizeTxt(n){return n?((n/1024/1024).toFixed(2)+" MB"):"—"}
function storageLabel(d){if(d.storage==="supabase")return "Original a Supabase Storage"; if(d.storage==="indexeddb")return "Original local IndexedDB"; if(d.hasFile)return "Original local disponible"; return "Registre sense original";}
const shown=docs.filter(d=>docFolder(d)===folder);const totalDocs=docs.length;
return <Card title={`Documents de l’expedient${obra?.nom?` · ${obra.nom}`:""}`} action={<div className="actions-inline"><label className="primary upload-label"><Upload/> Adjuntar a carpeta actual<input type="file" onChange={add}/></label><button className="secondary" onClick={()=>openEmail("Documents expedient")}>Enviar email</button><button className="secondary" onClick={()=>setShowCfg(!showCfg)}>Config. Storage</button></div>}>
  {showCfg&&<div className="storage-config"><b>Configuració opcional Supabase Storage</b><p>Si no configures Storage, els originals es guarden en local IndexedDB d’aquest navegador. Cada document queda vinculat a l’expedient i a una carpeta documental.</p><div className="form-grid no-pad"><label><span>URL Supabase</span><input value={cfg.url} onChange={e=>setCfg({...cfg,url:e.target.value})}/></label><label><span>Anon key</span><input value={cfg.key} onChange={e=>setCfg({...cfg,key:e.target.value})}/></label><label><span>Bucket</span><input value={cfg.bucket} onChange={e=>setCfg({...cfg,bucket:e.target.value})}/></label></div><button className="primary" onClick={saveCfg}>Guardar configuració</button></div>}
  {status&&<div className="doc-status-v38">{status}</div>}
  <div className="documents-layout-v8775"><aside className="doc-folders-v8775">{folders.map(f=>{const count=docs.filter(d=>docFolder(d)===f.id).length;return <button key={f.id} className={folder===f.id?"active":""} onClick={()=>setFolder(f.id)}><b>{f.label}</b><span>{count} document{count===1?"":"s"}</span></button>})}</aside><section className="doc-folder-content-v8775"><div className="folder-head-v8775"><div><h3>{activeFolder?.label}</h3><p>{activeFolder?.desc}</p></div><span>{shown.length} / {totalDocs} docs</span></div><div className="doc-list-v38">{shown.length===0?<Empty text="Aquesta carpeta encara no té documents."/>:shown.map(d=><div className="doc-row-v38" key={d.id}><div><b>{d.nom}</b><span>{d.tipus} · {d.data} · {sizeTxt(d.size)} · {storageLabel(d)}</span>{d.error&&<em>{d.error}</em>}</div><div className="actions-inline"><select value={docFolder(d)} onChange={e=>moveDoc(d,e.target.value)}>{folders.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select><button className="secondary small" onClick={()=>openOriginal(d)}>Obrir</button><button className="danger small" onClick={()=>remove(d)}>Eliminar</button></div></div>)}</div></section></div>
</Card>
}


function dateParts87109(e){
  if(!e||typeof e!="object")return null;
  if(e.data||e.date){
    const raw=String(e.data||e.date||"");
    const d=raw.includes("/")?(()=>{const parts=raw.split("/").map(Number);return new Date(parts[2]||new Date().getFullYear(),(parts[1]||1)-1,parts[0]||1)})():new Date(raw);
    if(!isNaN(d))return {day:d.getDate(),month:d.getMonth(),year:d.getFullYear(),iso:d.toISOString().slice(0,10)};
  }
  const y=Number(e.year)||new Date().getFullYear(),m=Number(e.month??new Date().getMonth()),d=Number(e.day)||1;
  const dt=new Date(y,m,d);
  if(isNaN(dt))return null;
  return {day:d,month:m,year:y,iso:`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`};
}
function cleanAgendaEvent87109(e,i=0){
  const dp=dateParts87109(e); if(!dp)return null;
  return {id:String(e.id||`ag-${Date.now()}-${i}`),title:String(e.title||e.titol||e.resum||e.note||"Cita / avís"),tipus:String(e.tipus||e.type||"Avís"),hora:String(e.hora||"09:00"),client:String(e.client||""),obra:String(e.obra||""),obraId:e.obraId||"",adreca:String(e.adreca||""),detail:String(e.detail||e.note||e.observacions||""),color:e.color||"blue",...dp};
}
function Agenda({events=[],clients=[],obres=[],openObra,calM,setCalM,calY,setCalY,selDay,setSelDay,setOdata}){
  const safeClients=Array.isArray(clients)?clients:[];
  const safeObres=Array.isArray(obres)?obres:[];
  const storageKey=lsKey8779("aco_agenda_global_v87109");
  const [local,setLocal]=useState(()=>{try{return (JSON.parse(localStorage.getItem(storageKey)||"[]")||[]).map(cleanAgendaEvent87109).filter(Boolean)}catch{return []}});
  const [selectedId,setSelectedId]=useState("");
  const today=new Date();
  const [form,setForm]=useState({id:"",data:today.toISOString().slice(0,10),hora:"09:00",title:"",tipus:"Visita d’obra",client:"",obraId:"",adreca:"",detail:""});
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(local.slice(-300)))}catch{}},[local,storageKey]);
  const incoming=(Array.isArray(events)?events:[]).map(cleanAgendaEvent87109).filter(Boolean);
  const all=[...incoming,...local].sort((a,b)=>(`${a.year}-${a.month}-${a.day} ${a.hora}`).localeCompare(`${b.year}-${b.month}-${b.day} ${b.hora}`));
  const m=Number(calM??today.getMonth()), y=Number(calY??today.getFullYear()), dsel=Number(selDay||today.getDate());
  const selected=all.filter(e=>e.day===dsel&&e.month===m&&e.year===y);
  function set(k,v){
    const patch={...form,[k]:v};
    if(k==="obraId"){
      const o=safeObres.find(x=>x.id===v); if(o){const c=safeClients.find(c=>c.id===o.client);patch.client=c?.nom||o.propietat||"";patch.adreca=o.adreca||"";patch.obra=o.nom||"";}
    }
    setForm(patch);
  }
  function edit(e){setSelectedId(e.id);setForm({id:e.id,data:e.iso,hora:e.hora,title:e.title,tipus:e.tipus,client:e.client,obraId:e.obraId||"",adreca:e.adreca,detail:e.detail})}
  function save(){
    const base=cleanAgendaEvent87109({...form,data:form.data,id:form.id||`ag-${Date.now()}`}); if(!base)return;
    const o=safeObres.find(x=>x.id===form.obraId);
    if(o&&setOdata){
      setOdata(prev=>{const d=prev[o.id]||empty();const current=Array.isArray(d.events)?d.events:[];const exists=current.some(x=>String(x.id)===String(base.id));const next=exists?current.map(x=>String(x.id)===String(base.id)?{...x,...base,obraId:o.id,obra:o.nom}:x):[...current,{...base,obraId:o.id,obra:o.nom}];return {...prev,[o.id]:{...d,events:next,updatedAt:new Date().toISOString()}}});
      setLocal(p=>p.filter(x=>x.id!==base.id));
    }else{
      setLocal(p=>p.some(x=>x.id===base.id)?p.map(x=>x.id===base.id?base:x):[...p,base]);
    }
    setSelectedId(base.id);
  }
  function del(){
    if(!form.id)return; if(!confirm("Eliminar aquesta cita / avís?"))return;
    setLocal(p=>p.filter(x=>x.id!==form.id));
    if(setOdata){setOdata(prev=>{const out={...prev};Object.keys(out).forEach(oid=>{const d=out[oid]||{};if(Array.isArray(d.events))out[oid]={...d,events:d.events.filter(e=>String(e.id)!==String(form.id)),updatedAt:new Date().toISOString()};});return out})}
    setForm({id:"",data:today.toISOString().slice(0,10),hora:"09:00",title:"",tipus:"Visita d’obra",client:"",obraId:"",adreca:"",detail:""});setSelectedId("");
  }
  const blanks=first(y,m), total=days(y,m);
  return <div className="agenda-safe-v87109"><Card title="Agenda / Calendari" action={<FilterBar8776><label><span>Mes</span><select value={m} onChange={e=>setCalM(+e.target.value)}>{months.map((x,i)=><option key={x} value={i}>{x}</option>)}</select></label><label><span>Any</span><select value={y} onChange={e=>setCalY(+e.target.value)}>{Array.from({length:11},(_,i)=>2023+i).map(x=><option key={x}>{x}</option>)}</select></label></FilterBar8776>}>
    <div className="agenda-layout-safe-v87109"><div className="calendar-grid agenda-calendar-safe-v87109">{["Dl","Dt","Dc","Dj","Dv","Ds","Dg"].map(x=><div className="week" key={x}>{x}</div>)}{Array.from({length:blanks}).map((_,i)=><div className="day blank" key={'b'+i}/>) }{Array.from({length:total}).map((_,i)=>{const day=i+1;const ev=all.filter(e=>e.day===day&&e.month===m&&e.year===y);return <button key={day} className={`day ${dsel===day?"selected":""}`} onClick={()=>setSelDay(day)}><b>{day}</b>{ev.slice(0,3).map(e=><span key={e.id} className="cal-event" onClick={(x)=>{x.stopPropagation();edit(e)}}>{e.hora} · {e.title}</span>)}</button>})}</div>
    <div className="agenda-panel-safe-v87109"><div className="agenda-panel-head-v87109"><h3>{`Dia ${String(dsel).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`}</h3><button className="primary" onClick={()=>setForm({id:"",data:`${y}-${String(m+1).padStart(2,'0')}-${String(dsel).padStart(2,'0')}`,hora:"09:00",title:"",tipus:"Visita d’obra",client:"",obraId:"",adreca:"",detail:""})}>+ Nova cita</button></div>
    <div className="agenda-list-safe-v87109">{selected.length===0?<p className="muted">No hi ha cites aquest dia.</p>:selected.map(e=><button key={e.id} className={selectedId===e.id?"active":""} onClick={()=>edit(e)}><b>{e.title}</b><span>{e.hora} · {e.client||"Sense client"}</span><small>{e.obra||"Sense expedient"} {e.adreca?`· ${e.adreca}`:""}</small></button>)}</div>
    <div className="agenda-form-safe-v87109"><label>Data<input type="date" value={form.data} onChange={e=>set("data",e.target.value)}/></label><label>Hora<input type="time" value={form.hora} onChange={e=>set("hora",e.target.value)}/></label><label>Expedient<select value={form.obraId} onChange={e=>set("obraId",e.target.value)}><option value="">Sense vincular</option>{safeObres.map(o=><option key={o.id} value={o.id}>{expedientCode8739(o)} · {o.nom}</option>)}</select></label><label>Títol<input value={form.title} onChange={e=>set("title",e.target.value)}/></label><label>Tipus<select value={form.tipus} onChange={e=>set("tipus",e.target.value)}><option>Visita d’obra</option><option>Reunió</option><option>Pressupost</option><option>Certificació</option><option>Entrega documentació</option><option>Avís</option><option>Altres</option></select></label><label>Client<input list="agenda-clients-v87110" value={form.client||""} onChange={e=>set("client",e.target.value)} placeholder="Nom del client"/><datalist id="agenda-clients-v87110">{safeClients.map(c=><option key={c.id} value={c.nom}/>)}</datalist></label><label>Adreça<input value={form.adreca} onChange={e=>set("adreca",e.target.value)}/></label><label className="span-all">Observacions<textarea value={form.detail} onChange={e=>set("detail",e.target.value)}/></label><div className="agenda-actions-safe-v87109"><button className="primary" onClick={save}>Guardar cita / canvis</button>{form.id&&<button className="danger" onClick={del}>Eliminar</button>}{form.obraId&&openObra&&<button className="secondary" onClick={()=>openObra(form.obraId)}>Obrir expedient</button>}</div></div></div></div>
  </Card></div>
}
function AgendaExpedient8774({data,setData,obra,client}){
  const today=new Date();
  const events=(Array.isArray(data?.events)?data.events:[]).map(cleanAgendaEvent87109).filter(Boolean);
  const [form,setForm]=useState({id:"",data:today.toISOString().slice(0,10),hora:"09:00",title:"",tipus:"Visita d’obra",adreca:obra?.adreca||"",detail:""});
  function save(){const ev=cleanAgendaEvent87109({...form,id:form.id||`ev-${Date.now()}`,obraId:obra?.id,obra:obra?.nom,client:form.client||client?.nom||obra?.propietat||"",data:form.data});if(!ev)return;setData(d=>({...d,events:(Array.isArray(d.events)?d.events:[]).some(x=>String(x.id)===String(ev.id))?d.events.map(x=>String(x.id)===String(ev.id)?ev:x):[...(Array.isArray(d.events)?d.events:[]),ev],updatedAt:new Date().toISOString()}));setForm({id:"",data:today.toISOString().slice(0,10),hora:"09:00",title:"",tipus:"Visita d’obra",adreca:obra?.adreca||"",detail:""})}
  function edit(e){setForm({id:e.id,data:e.iso,hora:e.hora,title:e.title,tipus:e.tipus,adreca:e.adreca||obra?.adreca||"",detail:e.detail||""})}
  function del(id){if(!confirm("Eliminar cita / avís?"))return;setData(d=>({...d,events:(Array.isArray(d.events)?d.events:[]).filter(e=>String(e.id)!==String(id)),updatedAt:new Date().toISOString()}));}
  const sameDay=events.filter(e=>e.iso===form.data);
  return <div className="stack agenda-exp-safe-v87109"><Card title="Agenda / avisos de l’expedient"><div className="agenda-sameday-v87110"><b>Agenda del dia seleccionat</b>{sameDay.length===0?<span>No hi ha cap altra nota/cita aquest dia.</span>:sameDay.map(e=><button key={e.id} onClick={()=>edit(e)}>{e.hora} · {e.client?`${e.client} · `:""}{e.title}</button>)}</div><div className="agenda-exp-grid-v87109"><div className="agenda-form-safe-v87109"><label>Data<input type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/></label><label>Hora<input type="time" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})}/></label><label>Tipus<select value={form.tipus} onChange={e=>setForm({...form,tipus:e.target.value})}><option>Visita d’obra</option><option>Reunió</option><option>Pressupost</option><option>Certificació</option><option>Entrega documentació</option><option>Avís</option><option>Altres</option></select></label><label>Client<input value={form.client||client?.nom||obra?.propietat||""} onChange={e=>setForm({...form,client:e.target.value})} placeholder="Client"/></label><label>Títol<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="span-all">Adreça<input value={form.adreca} onChange={e=>setForm({...form,adreca:e.target.value})}/></label><label className="span-all">Observacions<textarea value={form.detail} onChange={e=>setForm({...form,detail:e.target.value})}/></label><button className="primary" onClick={save}>Guardar cita / canvis</button></div><div className="agenda-list-safe-v87109">{events.length===0?<Empty text="No hi ha cites o avisos."/>:events.sort((a,b)=>a.iso.localeCompare(b.iso)).map(e=><button key={e.id} onClick={()=>edit(e)}><b>{e.title}</b><span>{fmtAppDate8748(e.iso)} · {e.hora} · {e.client||client?.nom||"Sense client"}</span><small>{e.tipus} · {e.adreca||""}</small><em onClick={(x)=>{x.stopPropagation();del(e.id)}}>Eliminar</em></button>)}</div></div></Card></div>
}

function ObraMiniCalendar({events=[]}){const[m,setM]=useState(5),[y,setY]=useState(2026),[d,setD]=useState(null),[note,setNote]=useState(null);const[local,setLocal]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_obra_notes"))||"[]"));useEffect(()=>{localStorage.setItem(lsKey8779("aco_obra_notes"),JSON.stringify(local));localStorage.setItem(lsKey8779("aco_home_notes"),JSON.stringify(local))},[local]);let all=[...events,...local],blanks=first(y,m),total=days(y,m),sel=d?all.filter(e=>e.day===d&&e.month===m&&e.year===y):[];function save(n){if(n.id==="new")setLocal(p=>[...p,{...n,id:"local-"+Date.now(),month:m,year:y}]);else setLocal(p=>p.map(x=>x.id===n.id?n:x));setNote(null)}function newNote(){setNote({id:"new",day:d||1,title:"Nova nota",type:"Nota",hora:"09:00",note:"",color:"blue"})}return <div className="home-calendar obra-calendar"><div className="calendar-head compact"><button className="secondary" onClick={()=>m===0?(setM(11),setY(y-1)):setM(m-1)}>‹</button><button className="secondary" onClick={()=>{setM(5);setY(2026)}}>Avui</button><button className="secondary" onClick={()=>m===11?(setM(0),setY(y+1)):setM(m+1)}>›</button><select value={m} onChange={e=>setM(+e.target.value)}>{months.map((x,i)=><option value={i}>{x}</option>)}</select><select value={y} onChange={e=>setY(+e.target.value)}>{Array.from({length:11},(_,i)=>2023+i).map(x=><option>{x}</option>)}</select><button className="primary" onClick={newNote}>+ Nota nova</button></div><div className="home-calendar-layout"><div className="calendar-grid small">{["Dl","Dt","Dc","Dj","Dv","Ds","Dg"].map(x=><div className="week">{x}</div>)}{Array.from({length:blanks}).map((_,i)=><div className="day blank" key={"b"+i}/>) }{Array.from({length:total}).map((_,i)=>{let day=i+1,ev=all.filter(e=>e.day===day&&e.month===m&&e.year===y);return <button className={`day ${d===day?"selected":""}`} onClick={()=>setD(day)}><b>{day}</b>{ev.slice(0,2).map(e=><span className={`cal-event ${e.color==="red"?"red":""}`} onClick={(evn)=>{evn.stopPropagation();setNote(e)}}>{e.hora} · {e.title}</span>)}</button>})}</div><div className="day-detail side"><h3>{d?`Dia ${d}`:"Selecciona un dia"}</h3>{d&&sel.length===0&&<p>Sense notes.</p>}{sel.map(e=><button className="note-card" onClick={()=>setNote(e)}><strong>{e.title}</strong><span>{e.hora} · {e.type}</span><p>{e.note||"Sense observacions."}</p></button>)}</div></div>{note&&<div className="note-pop"><div><h3>{note.id==="new"?"Nova nota":"Editar nota"}</h3><label><span>Dia</span><input value={note.day} onChange={e=>setNote({...note,day:+e.target.value})}/></label><label><span>Títol</span><input value={note.title} onChange={e=>setNote({...note,title:e.target.value})}/></label><label><span>Hora</span><input value={note.hora} onChange={e=>setNote({...note,hora:e.target.value})}/></label><label><span>Observacions</span><textarea value={note.note} onChange={e=>setNote({...note,note:e.target.value})}/></label><button className="primary" onClick={()=>save(note)}>Guardar / Tancar</button></div></div>}</div>}
function HomeCalendar({events=[]}){const[m,setM]=useState(5),[y,setY]=useState(2026),[d,setD]=useState(null),[note,setNote]=useState(null);const[local,setLocal]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_home_notes"))||"[]"));useEffect(()=>{localStorage.setItem(lsKey8779("aco_home_notes"),JSON.stringify(local))},[local]);let all=[...events,...local],blanks=first(y,m),total=days(y,m),sel=d?all.filter(e=>e.day===d&&e.month===m&&e.year===y):[];function save(n){if(n.id==="new")setLocal(p=>[...p,{...n,id:"home-"+Date.now(),month:m,year:y}]);else setLocal(p=>p.map(x=>x.id===n.id?n:x));setNote(null)}function newNote(){setNote({id:"new",day:d||1,title:"Nova nota",type:"Nota",hora:"09:00",note:"",color:"blue"})}return <div className="home-calendar"><div className="calendar-head compact"><button className="secondary" onClick={()=>m===0?(setM(11),setY(y-1)):setM(m-1)}>‹</button><button className="secondary" onClick={()=>{setM(5);setY(2026)}}>Avui</button><button className="secondary" onClick={()=>m===11?(setM(0),setY(y+1)):setM(m+1)}>›</button><select value={m} onChange={e=>setM(+e.target.value)}>{months.map((x,i)=><option value={i}>{x}</option>)}</select><select value={y} onChange={e=>setY(+e.target.value)}>{Array.from({length:11},(_,i)=>2023+i).map(x=><option>{x}</option>)}</select><button className="primary" onClick={newNote}>+ Nota nova</button></div><div className="home-calendar-layout"><div className="calendar-grid small">{["Dl","Dt","Dc","Dj","Dv","Ds","Dg"].map(x=><div className="week">{x}</div>)}{Array.from({length:blanks}).map((_,i)=><div className="day blank" key={"b"+i}/>) }{Array.from({length:total}).map((_,i)=>{let day=i+1,ev=all.filter(e=>e.day===day&&e.month===m&&e.year===y);return <button className={`day ${d===day?"selected":""}`} onClick={()=>setD(day)}><b>{day}</b>{ev.slice(0,2).map(e=><span className={`cal-event ${e.color==="red"?"red":""}`} onClick={(evn)=>{evn.stopPropagation();setNote(e)}}>{e.hora} · {e.title}</span>)}</button>})}</div><div className="day-detail side"><h3>{d?`Dia ${d}`:"Selecciona un dia"}</h3>{d&&sel.length===0&&<p>Sense notes.</p>}{sel.map(e=><button className="note-card" onClick={()=>setNote(e)}><strong>{e.title}</strong><span>{e.hora} · {e.type}</span><p>{e.note||"Sense observacions."}</p></button>)}</div></div>{note&&<div className="note-pop"><div><h3>{note.id==="new"?"Nova nota":"Editar nota"}</h3><label><span>Dia</span><input value={note.day} onChange={e=>setNote({...note,day:+e.target.value})}/></label><label><span>Títol</span><input value={note.title} onChange={e=>setNote({...note,title:e.target.value})}/></label><label><span>Hora</span><input value={note.hora} onChange={e=>setNote({...note,hora:e.target.value})}/></label><label><span>Observacions</span><textarea value={note.note} onChange={e=>setNote({...note,note:e.target.value})}/></label><button className="primary" onClick={()=>save(note)}>Guardar / Tancar</button></div></div>}</div>}

function Configuracio(){
const key=lsKey8779("aco_config_v60");
const[cfg,setCfg]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||"{}")}catch(e){return {}}});
function upd(k,v){setCfg(p=>({...p,[k]:v}))}
function save(){localStorage.setItem(key,JSON.stringify(cfg));alert("Configuració guardada")}
return <div className="stack">
<PlansModuls8736/>
<DataJsonTools8778/>
<Card title="Configuració general" action={<button className="primary" onClick={save}><Save/> Guardar configuració</button>}>
  <div className="form-grid">
    <Input label="Email emissor" value={cfg.email||""} onChange={e=>upd("email",e.target.value)} />
    <Input label="Empresa / usuari" value={cfg.empresa||""} onChange={e=>upd("empresa",e.target.value)} />
    <Input label="IVA defecte %" value={cfg.iva||"21"} onChange={e=>upd("iva",e.target.value)} />
    <Input label="Retenció defecte %" value={cfg.retencio||"0"} onChange={e=>upd("retencio",e.target.value)} />
  </div>
</Card>
<Card title="Supabase Storage">
  <div className="form-grid">
    <Input label="Supabase URL" value={cfg.supabaseUrl||""} onChange={e=>upd("supabaseUrl",e.target.value)} />
    <Input label="Anon key" value={cfg.supabaseKey||""} onChange={e=>upd("supabaseKey",e.target.value)} />
    <Input label="Bucket" value={cfg.bucket||"app-control-obres"} onChange={e=>upd("bucket",e.target.value)} />
  </div>
</Card>
</div>
}


function TracaGeneral({obres,odata,openObra}){
  const now=new Date();
  const[period,setPeriod]=useState("month");
  const[from,setFrom]=useState("");
  const[to,setTo]=useState("");
  const[client,setClient]=useState("");
  const[obra,setObra]=useState("");
  const[tipus,setTipus]=useState("");
  function n(v){return Number(String(v??0).replace(",","."))||0}
  function importReg(r){if(r.tipusRegistre==="Honoraris"||r.hores)return n(r.hores)*(n(r.preuHora)||n(r.preu)||0);if(r.tipusRegistre==="Kilometratge")return n(r.km)*n(r.preuKm);return n(r.quantitat)*n(r.preuUnitari)}
  function rowsForObra(o){let stored=[];try{stored=JSON.parse(localStorage.getItem(lsKey8779(`aco_honoraris_rows_${o.id}`))||"[]")}catch(e){stored=[]}let d=odata[o.id]||empty();return stored.length?stored:(d.hores||[])}
  const all=obres.flatMap(o=>rowsForObra(o).map(r=>({...r,obra:o,obraNom:o.nom,clientNom:o.propietat||o.client||"Sense client",tipologia:o.tipusTreball||moduleLabel8737(o),data:r.data||isoDate8776(now)})));
  const clients=[...new Set(all.map(r=>r.clientNom).filter(Boolean))];
  const tipologies=[...new Set(all.map(r=>r.tipologia).filter(Boolean))];
  const rows=all.filter(r=>(!client||r.clientNom===client)&&(!obra||r.obra.id===obra)&&(!tipus||r.tipologia===tipus)&&periodFilter8776(r,period,from,to));
  const totalH=rows.reduce((s,r)=>s+n(r.hores),0);
  const totalC=rows.reduce((s,r)=>s+importReg(r),0);
  const byClient=aggregate8776(rows,r=>r.clientNom,importReg);
  const byTipus=aggregate8776(rows,r=>r.tipologia,importReg);
  return <div className="stack traca-v8776">
    <Card title="Gestió del temps · mes en curs per defecte" action={<FilterBar8776><label><span>Període</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="month">Mes en curs</option><option value="week">Setmana actual</option><option value="year">Any actual</option><option value="all">Tot</option><option value="dates">Dates</option></select></label>{period==="dates"&&<><label><span>Des de</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label><span>Fins</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}<label><span>Client</span><select value={client} onChange={e=>setClient(e.target.value)}><option value="">Tots</option>{clients.map(c=><option key={c}>{c}</option>)}</select></label><label><span>Obra</span><select value={obra} onChange={e=>setObra(e.target.value)}><option value="">Totes</option>{obres.map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select></label><label><span>Tipologia</span><select value={tipus} onChange={e=>setTipus(e.target.value)}><option value="">Totes</option>{tipologies.map(t=><option key={t}>{t}</option>)}</select></label></FilterBar8776>}>
      <div className="honor-kpis"><Kpi t="REGISTRES" v={rows.length}/><Kpi t="HORES" v={`${totalH.toFixed(2)} h`}/><Kpi t="TOTAL" v={money(totalC)}/></div>
      <div className="finance-charts-v8776"><Donut8776 title="Per client" parts={byClient} total={totalC}/><Donut8776 title="Per tipologia de feina" parts={byTipus} total={totalC}/></div>
    </Card>
    <Card title="Registres del període seleccionat"><div className="finance-table-wrap-v8743"><table className="finance-table-v8743 finance-table-v8776"><thead><tr><th>Obra</th><th>Client</th><th>Dia</th><th>Tipus feina</th><th>Hora / hores</th><th>Cost hora</th><th>Total</th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan="7"><Empty text="No hi ha registres en aquest període."/></td></tr>}{rows.map(r=><tr key={(r.obra.id||"")+r.id}><td><button className="table-link-v8776" onClick={()=>openObra(r.obra.id)}>{r.obraNom}</button></td><td>{r.clientNom}</td><td>{fmtAppDate8748(r.data)}</td><td>{r.tipusFeina||r.etiqueta||"Altres"}</td><td>{n(r.hores).toFixed(2)} h</td><td>{money(n(r.preuHora)||n(r.preu)||0)}</td><td><b>{money(importReg(r))}</b></td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL PERÍODE</th><th>{totalH.toFixed(2)} h</th><th></th><th>{money(totalC)}</th></tr></tfoot></table></div></Card>
  </div>
}
function MiniCal({events}){return <div className="calendar-mini">{Array.from({length:21}).map((_,i)=>{let d=i+1,ev=events.filter(e=>e.day===d&&e.month===5&&e.year===2026);return <button className="mini-day"><b>{d}</b>{ev[0]&&<span className="cal-event">{ev[0].type}</span>}</button>})}</div>}
function FinanceFilters8776({rows,children}){return children}
function FacturesGeneral8738({obres,odata,setOdata,openObra,openObraTab}){
  const[preview,setPreview]=useState(null);const[newOpen,setNewOpen]=useState(false);
  const[calcOpen,setCalcOpen]=useState(false);const[period,setPeriod]=useState("all"),[from,setFrom]=useState(""),[to,setTo]=useState(""),[client,setClient]=useState(""),[obra,setObra]=useState(""),[tipus,setTipus]=useState("");
  let all=obres.flatMap(o=>uniqueFactures8743(((odata[o.id]||empty()).facturesTecnic||[])).map((f,i)=>({...f,displayNumero:displayDocNumber8745(f,"factura",o,i+1),obra:o,clientNom:o.propietat||o.client||"Sense client",tipologia:o.tipusTreball||moduleLabel8737(o)})));
  const clients=[...new Set(all.map(r=>r.clientNom).filter(Boolean))],tipologies=[...new Set(all.map(r=>r.tipologia).filter(Boolean))];
  let rows=all.filter(f=>(!client||f.clientNom===client)&&(!obra||f.obra.id===obra)&&(!tipus||f.tipologia===tipus)&&periodFilter8776(f,period,from,to));
  let total=rows.reduce((s,f)=>s+totalIva8743(f),0), base=rows.reduce((s,f)=>s+baseIva8743(f),0);
  const parts=aggregate8776(rows,f=>statusKeyFactura8776(f.estat),()=>1);
  const pendents=rows.filter(f=>statusKeyFactura8776(f.estat)!=="cobrades"&&daysBetween8776(f.data,new Date())>7);
  function createFacturaGlobal8778(payload){
    if(!setOdata)return;
    const o=obres.find(x=>x.id===payload.obraId);if(!o)return;
    setOdata(prev=>{const d=prev[o.id]||empty();const id="ft-"+Date.now();const numero=nextGlobalDocNumber8745(prev,"factura",o.any);const doc={id,numero,data:payload.data||todayISO8743(),concepte:payload.concepte||"Factura tècnica",text:payload.text||"",base:+payload.base||0,iva:+payload.iva||21,retencio:+payload.retencio||0,descompte:+payload.descompte||0,estat:payload.estat||"Pendent"};return {...prev,[o.id]:{...d,facturesTecnic:[...(d.facturesTecnic||[]),doc],documents:[...(d.documents||[]),{id:"doc-"+id,nom:`Factura honoraris ${numero}`,tipus:"FACTURA",folder:"00_DESPATX_TECNIC",data:fmtAppDate8748(doc.data),storage:"registre",hasFile:false,linkedType:"factura",linkedId:id}]}}});
  }
  function updateFacturaGlobal87109(row,patch){
    if(!setOdata||!row?.obra?.id)return;
    setOdata(prev=>{const d=prev[row.obra.id]||empty();return {...prev,[row.obra.id]:{...d,facturesTecnic:(d.facturesTecnic||[]).map(f=>f.id===row.id?{...f,...patch}:f),updatedAt:new Date().toISOString()}}});
  }
  const fc=countBy87109(rows,f=>statusKeyFactura8776(f.estat));
  return <div className="stack finance-general-v8743 finance-general-v8745 finance-v8776 finance-v87109">{preview&&<QuotePreview8743 type="factura" doc={preview.doc} obra={preview.obra} close={()=>setPreview(null)}/>} {newOpen&&<NewGlobalFactura8778 obres={obres} onSave={createFacturaGlobal8778} close={()=>setNewOpen(false)}/>}<Card title="Factures del tècnic / despatx" action={<FilterBar8776><label><span>Període</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">Tot</option><option value="week">Setmana actual</option><option value="month">Mes en curs</option><option value="year">Any actual</option><option value="dates">Dates</option></select></label>{period==="dates"&&<><label><span>Des de</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label><span>Fins</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}<label><span>Client</span><select value={client} onChange={e=>setClient(e.target.value)}><option value="">Tots</option>{clients.map(c=><option key={c}>{c}</option>)}</select></label><label><span>Obra</span><select value={obra} onChange={e=>setObra(e.target.value)}><option value="">Totes</option>{obres.map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select></label><label><span>Tipologia</span><select value={tipus} onChange={e=>setTipus(e.target.value)}><option value="">Totes</option>{tipologies.map(t=><option key={t}>{t}</option>)}</select></label></FilterBar8776>}><div className="card-actions"><button className="primary" onClick={()=>setNewOpen(true)}>+ Nova factura</button></div><div className="honor-kpis"><Kpi t="FACTURES" v={rows.length}/><Kpi t="BASE SENSE IVA" v={money(base)}/><Kpi t="TOTAL IVA INC." v={money(total)}/><Kpi t="PENDENTS +7 DIES" v={pendents.length}/></div><FinanceStatusCards87109 items={[{label:"Fetes",count:fc.fetes||0,kind:"info"},{label:"Cobrades",count:fc.cobrades||0,kind:"ok"},{label:"Pendents de cobrar",count:fc["no cobrades"]||0,kind:"warn"},{label:"Vençudes +7 dies",count:pendents.length,kind:"bad"}]}/>{pendents.length>0&&<div className="finance-alert-v8776">{pendents.map(f=><button key={f.obra.id+f.id} onClick={()=>openObraTab?openObraTab(f.obra.id,"Factures"):openObra(f.obra.id)}><b>Factura pendent</b><span>{f.displayNumero} · {f.obra.nom} · {fmtAppDate8748(f.data)} · {money(totalIva8743(f))}</span></button>)}</div>}<div className="finance-charts-v8776"><Donut8776 title="Estat de facturació" parts={parts} total={rows.length} kind="count"/><Donut8776 title="Per client" parts={aggregate8776(rows,f=>f.clientNom||"Sense client",()=>1)} total={rows.length} kind="count"/><Donut8776 title="Per tipologia" parts={aggregate8776(rows,f=>f.tipologia||"Sense tipologia",()=>1)} total={rows.length} kind="count"/></div><div className="finance-table-wrap-v8743"><table className="finance-table-v8743 finance-table-v8745 finance-invoice-table-v87114"><colgroup><col className="c-num"/><col className="c-exp"/><col className="c-client"/><col className="c-tipus"/><col className="c-concepte"/><col className="c-data"/><col className="c-money"/><col className="c-money"/><col className="c-estat"/><col className="c-cobrament"/><col className="c-actions"/></colgroup><thead><tr><th>Factura</th><th>Expedient</th><th>Client</th><th>Tipologia</th><th>Concepte</th><th>Data</th><th>Base</th><th>Total IVA inclòs</th><th>Estat</th><th>Data cobrament</th><th>Accions</th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan="11"><Empty text="Encara no hi ha factures."/></td></tr>}{rows.map(f=><tr key={f.obra.id+f.id}><td><b>{f.displayNumero}</b></td><td><span className="exp-code-v8739">{expedientCode8739(f.obra)}</span><small>{f.obra.nom}</small></td><td>{f.clientNom}</td><td>{f.tipologia}</td><td>{f.concepte||"Factura"}</td><td>{fmtAppDate8748(f.data)||"—"}</td><td><b>{money(baseIva8743(f))}</b></td><td><strong>{money(totalIva8743(f))}</strong></td><td><select className={`finance-state-select-v87110 ${statusKeyFactura8776(f.estat)}`} value={f.estat||"Pendent"} onChange={e=>updateFacturaGlobal87109(f,{estat:e.target.value})}><option>Esborrany</option><option>Emesa</option><option>Pendent</option><option>Cobrada</option><option>Anul·lada</option></select></td><td><input className="date-cell-v87109" type="date" value={toInputDate8743(f.dataCobrament)||""} onChange={e=>updateFacturaGlobal87109(f,{dataCobrament:e.target.value,estat:e.target.value?"Cobrada":"Pendent"})}/></td><td><div className="actions-inline row-actions-desktop-v87114"><button className="primary small-v8777" onClick={()=>openObraTab?openObraTab(f.obra.id,"Factures"):openObra(f.obra.id)}>Gestionar</button><button className="secondary" onClick={()=>setPreview({doc:{...f,numero:f.displayNumero},obra:f.obra})}>PDF</button><button className="secondary" onClick={()=>printQuote8745("factura",{...f,numero:f.displayNumero},f.obra)}>Imprimir</button></div><select className="mobile-row-action-v87114" defaultValue="" aria-label="Accions factura" onChange={e=>{const v=e.target.value;e.target.value="";if(v==="gestionar"){openObraTab?openObraTab(f.obra.id,"Factures"):openObra(f.obra.id)}if(v==="pdf"){setPreview({doc:{...f,numero:f.displayNumero},obra:f.obra})}if(v==="imprimir"){printQuote8745("factura",{...f,numero:f.displayNumero},f.obra)}}}><option value="">Accions</option><option value="gestionar">Gestionar factura</option><option value="pdf">Veure PDF</option><option value="imprimir">Imprimir / PDF</option></select></td></tr>)}</tbody></table></div></Card><FinanceReports87110 title="Resum / informes de factures" rows={rows} type="factures"/></div>
}
function HonorarisGeneral({obres,odata,setOdata,openObra,openObraTab}){
  const[preview,setPreview]=useState(null);
  const[editDoc,setEditDoc]=useState(null);
  const[newOpen,setNewOpen]=useState(false);
  const[calcOpen,setCalcOpen]=useState(false);
  const[period,setPeriod]=useState("all"),[from,setFrom]=useState(""),[to,setTo]=useState(""),[client,setClient]=useState(""),[obra,setObra]=useState(""),[tipus,setTipus]=useState("");
  const estatsPress=["Fet","Pendent","Acceptat","No acceptat","Tancat","Facturat"];
  let all=obres.flatMap(o=>{
    const d=odata[o.id]||empty();
    const factures=uniqueFactures8743(d.facturesTecnic||[]);
    return (d.pressupostosTecnic||[]).map((p,i)=>{
      const facturat=!!p.facturat||factures.some(f=>f.pressupostId===p.id);
      return {...p,displayNumero:displayDocNumber8745(p,"pressupost",o,i+1),obra:o,clientNom:o.propietat||o.client||"Sense client",tipologia:o.tipusTreball||moduleLabel8737(o),facturat};
    });
  });
  const clients=[...new Set(all.map(r=>r.clientNom).filter(Boolean))],tipologies=[...new Set(all.map(r=>r.tipologia).filter(Boolean))];
  let rows=all.filter(p=>(!client||p.clientNom===client)&&(!obra||p.obra.id===obra)&&(!tipus||p.tipologia===tipus)&&periodFilter8776(p,period,from,to));
  let total=rows.reduce((s,p)=>s+totalIva8743(p),0), base=rows.reduce((s,p)=>s+baseIva8743(p),0);
  const parts=aggregate8776(rows,p=>statusKeyPress8776(p.estat),()=>1);
  function updatePressupostGlobal(row,patch){
    if(!setOdata)return;
    setOdata(prev=>{
      const d=prev[row.obra.id]||empty();
      return {...prev,[row.obra.id]:{...d,pressupostosTecnic:(d.pressupostosTecnic||[]).map(p=>p.id===row.id?{...p,...patch}:p),updatedAt:new Date().toISOString()}};
    });
    setEditDoc(ed=>ed&&ed.id===row.id?{...ed,...patch}:ed);
  }
  function facturarPressupostGlobal(row){
    if(!setOdata)return;
    setOdata(prev=>{
      const d=prev[row.obra.id]||empty();
      const factures=uniqueFactures8743(d.facturesTecnic||[]);
      const exists=factures.some(f=>f.pressupostId===row.id);
      const nova=exists?[]:[{id:"ft-"+Date.now(),numero:nextGlobalDocNumber8745(prev,"factura",row.obra?.any),data:todayISO8743(),concepte:row.concepte||"Factura del pressupost acceptat",text:row.text||"",base:+row.base||0,iva:+row.iva||21,descompte:row.descompte||0,retencio:row.retencio||0,estat:"Pendent",pressupostId:row.id}];
      const docs=nova.length?[{id:"doc-"+nova[0].id,nom:`Factura honoraris ${nova[0].numero}`,tipus:"FACTURA",folder:"00_DESPATX_TECNIC",data:fmtAppDate8748(nova[0].data),storage:"registre",hasFile:false,linkedType:"factura",linkedId:nova[0].id}]:[];
      return {...prev,[row.obra.id]:{...d,pressupostosTecnic:(d.pressupostosTecnic||[]).map(p=>p.id===row.id?{...p,estat:"Tancat",facturat:true}:p),facturesTecnic:[...factures,...nova],documents:[...(d.documents||[]),...docs]}};
    });
    setEditDoc(null);
  }
  function createPressupostGlobal8778(payload){
    if(!setOdata)return;
    const o=obres.find(x=>x.id===payload.obraId);if(!o)return;
    setOdata(prev=>{const d=prev[o.id]||empty();const id="pt-"+Date.now();const numero=nextGlobalDocNumber8745(prev,"pressupost",o.any);const doc={id,numero,data:payload.data||todayISO8743(),concepte:payload.concepte||"Pressupost tècnic",text:payload.text||"",base:+payload.base||0,iva:+payload.iva||21,estat:payload.estat||"Pendent",honorarisCalc:payload.honorarisCalc||null};return {...prev,[o.id]:{...d,pressupostosTecnic:[...(d.pressupostosTecnic||[]),doc],documents:[...(d.documents||[]),{id:"doc-"+id,nom:`Pressupost honoraris ${numero}`,tipus:"PRESSUPOST",folder:"00_DESPATX_TECNIC",data:fmtAppDate8748(doc.data),storage:"registre",hasFile:false,linkedType:"pressupost",linkedId:id}]}}});
  }
  return <div className="stack finance-general-v8743 finance-general-v8745 finance-v8776 finance-v8777">
    {preview&&<QuotePreview8743 type="pressupost" doc={preview.doc} obra={preview.obra} close={()=>setPreview(null)}/>}
    {newOpen&&<NewGlobalPressupost8778 obres={obres} onSave={createPressupostGlobal8778} close={()=>setNewOpen(false)}/>}
    {calcOpen&&<Modal title="Calculadora d’honoraris tècnics" close={()=>setCalcOpen(false)}><HonorarisCalculator8790 obres={obres} onCreatePressupost={(payload)=>{createPressupostGlobal8778(payload);setCalcOpen(false)}}/></Modal>}
    {editDoc&&<Modal title="Gestionar pressupost" close={()=>setEditDoc(null)}>
      <div className="budget-manage-v8777">
        <div className="budget-manage-head-v8777"><span className="exp-code-v8739">{expedientCode8739(editDoc.obra)}</span><h3>{editDoc.displayNumero} · {editDoc.concepte||"Pressupost"}</h3><p>{editDoc.clientNom} · {editDoc.obra.nom}</p></div>
        <div className="form-grid">
          <label><span>Estat pressupost</span><select value={editDoc.estat||"Pendent"} onChange={e=>updatePressupostGlobal(editDoc,{estat:e.target.value})}>{estatsPress.map(x=><option key={x}>{x}</option>)}</select></label>
          <label><span>Facturat</span><select value={editDoc.facturat?"Sí":"No"} onChange={e=>updatePressupostGlobal(editDoc,{facturat:e.target.value==="Sí"})}><option>No</option><option>Sí</option></select></label>
          <label><span>Data</span><input type="date" value={editDoc.data||""} onChange={e=>updatePressupostGlobal(editDoc,{data:e.target.value})}/></label>
          <label><span>Base sense IVA</span><input type="number" step="0.01" value={editDoc.base||0} onChange={e=>updatePressupostGlobal(editDoc,{base:+e.target.value||0})}/></label>
          <label className="span-all"><span>Concepte</span><input value={editDoc.concepte||""} onChange={e=>updatePressupostGlobal(editDoc,{concepte:e.target.value})}/></label>
        </div>
        <div className="budget-manage-summary-v8777"><div><small>Total IVA inclòs</small><b>{money(totalIva8743(editDoc))}</b></div><div><small>Estat</small><b>{editDoc.estat||"Pendent"}</b></div><div><small>Facturat</small><b>{editDoc.facturat?"Sí":"No"}</b></div></div>{editDoc.honorarisCalc&&<div className="honor-trace-v878112"><b>Traça de càlcul d’honoraris</b><span>{editDoc.honorarisCalc?.resultat?.formula||"Fórmula guardada"}</span><span>Import recomanat: {money(editDoc.honorarisCalc?.resultat?.recomanat||0)} · Import final: {money(editDoc.honorarisCalc?.final||editDoc.base||0)}</span></div>}
      </div>
      <div className="modal-actions"><button className="secondary" onClick={()=>setPreview({doc:{...editDoc,numero:editDoc.displayNumero},obra:editDoc.obra})}>Veure PDF</button><button className="secondary" onClick={()=>printQuote8745("pressupost",{...editDoc,numero:editDoc.displayNumero},editDoc.obra)}>Imprimir</button><button className="primary" onClick={()=>facturarPressupostGlobal(editDoc)}>Crear factura i tancar</button><button className="secondary" onClick={()=>setEditDoc(null)}>Tancar</button></div>
    </Modal>}
    <Card title="Calculadora d'honoraris per feines meves" action={<button className="primary" onClick={()=>setCalcOpen(true)}>Obrir calculadora</button>}>
      <div className="module-note-v8738"><b>Càlcul visible des de Pressupostos meus.</b><span>Ara la calculadora no queda només dins d'un expedient: pots calcular honoraris, seleccionar l'expedient vinculat i crear directament el pressupost amb la fórmula guardada.</span></div>
    </Card>
    <Card title="Pressupostos / honoraris del tècnic" action={<FilterBar8776><label><span>Període</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">Tot</option><option value="week">Setmana actual</option><option value="month">Mes en curs</option><option value="year">Any actual</option><option value="dates">Dates</option></select></label>{period==="dates"&&<><label><span>Des de</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label><span>Fins</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}<label><span>Client</span><select value={client} onChange={e=>setClient(e.target.value)}><option value="">Tots</option>{clients.map(c=><option key={c}>{c}</option>)}</select></label><label><span>Obra</span><select value={obra} onChange={e=>setObra(e.target.value)}><option value="">Totes</option>{obres.map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select></label><label><span>Tipologia</span><select value={tipus} onChange={e=>setTipus(e.target.value)}><option value="">Totes</option>{tipologies.map(t=><option key={t}>{t}</option>)}</select></label></FilterBar8776>}>
      <div className="card-actions"><button className="primary" onClick={()=>setNewOpen(true)}>+ Nou pressupost</button><button className="secondary" onClick={()=>setCalcOpen(true)}>Calcular amb barem d’honoraris</button></div><div className="honor-kpis"><Kpi t="PRESSUPOSTOS" v={rows.length}/><Kpi t="BASE SENSE IVA" v={money(base)}/><Kpi t="TOTAL IVA INC." v={money(total)}/></div>
      {(()=>{const pc=countBy87109(rows,p=>statusKeyPress8776(p.estat));return <FinanceStatusCards87109 items={[{label:"Fets / enviats",count:pc.fets||0,kind:"info"},{label:"Acceptats",count:pc.acceptats||0,kind:"ok"},{label:"Pendents",count:pc.pendents||0,kind:"warn"},{label:"No acceptats",count:pc["no acceptats"]||0,kind:"bad"}]}/>})()}
      <div className="finance-charts-v8776"><Donut8776 title="Estat dels pressupostos" parts={parts} total={rows.length} kind="count"/><Donut8776 title="Facturació dels pressupostos" parts={aggregate8776(rows,p=>p.facturat?"facturat":"no facturat",()=>1)} total={rows.length} kind="count"/><Donut8776 title="Per tipologia" parts={aggregate8776(rows,p=>p.tipologia||"Sense tipologia",()=>1)} total={rows.length} kind="count"/></div>
      <div className="finance-table-wrap-v8743"><table className="finance-table-v8743 finance-table-v8745 finance-budget-table-v8777"><colgroup><col className="c-num"/><col className="c-exp"/><col className="c-client"/><col className="c-tipus"/><col className="c-concepte"/><col className="c-data"/><col className="c-money"/><col className="c-money"/><col className="c-estat"/><col className="c-fact"/><col className="c-actions"/></colgroup><thead><tr><th>Pressupost</th><th>Expedient</th><th>Client</th><th>Tipologia</th><th>Concepte</th><th>Data</th><th>Base</th><th>Total IVA inclòs</th><th>Estat</th><th>Facturat</th><th>Accions</th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan="11"><Empty text="Encara no hi ha pressupostos."/></td></tr>}{rows.map(p=><tr key={p.obra.id+p.id}><td><b>{p.displayNumero}</b></td><td><span className="exp-code-v8739">{expedientCode8739(p.obra)}</span><small>{p.obra.nom}</small></td><td>{p.clientNom}</td><td>{p.tipologia}</td><td className="concept-cell-v8777">{p.concepte||"Pressupost"}</td><td>{fmtAppDate8748(p.data)||"—"}</td><td><b>{money(baseIva8743(p))}</b></td><td><strong>{money(totalIva8743(p))}</strong></td><td><select className={`finance-state-select-v87110 ${statusKeyPress8776(p.estat)}`} value={p.estat||"Pendent"} onChange={e=>updatePressupostGlobal(p,{estat:e.target.value})}>{estatsPress.map(x=><option key={x}>{x}</option>)}</select></td><td><select className="finance-mini-select-v87110" value={p.facturat?"Sí":"No"} onChange={e=>updatePressupostGlobal(p,{facturat:e.target.value==="Sí"})}><option>No</option><option>Sí</option></select></td><td><div className="actions-inline row-actions-desktop-v87114"><button className="primary small-v8777" onClick={()=>setEditDoc(p)}>Gestionar</button><button className="secondary" onClick={()=>setPreview({doc:{...p,numero:p.displayNumero},obra:p.obra})}>PDF</button><button className="secondary" onClick={()=>openObraTab?openObraTab(p.obra.id,"Pressupostos"):openObra(p.obra.id)}>Obrir</button></div><select className="mobile-row-action-v87114" defaultValue="" aria-label="Accions pressupost" onChange={e=>{const v=e.target.value;e.target.value="";if(v==="gestionar"){setEditDoc(p)}if(v==="pdf"){setPreview({doc:{...p,numero:p.displayNumero},obra:p.obra})}if(v==="obrir"){openObraTab?openObraTab(p.obra.id,"Pressupostos"):openObra(p.obra.id)}}}><option value="">Accions</option><option value="gestionar">Gestionar pressupost</option><option value="pdf">Veure PDF</option><option value="obrir">Obrir expedient</option></select></td></tr>)}</tbody></table></div>
    </Card>
    <FinanceReports87110 title="Resum / informes de pressupostos" rows={rows} type="pressupostos"/>
  </div>
}

function FinanceReports87110({title,rows,type}){
  const byYear=aggregate8776(rows,r=>String((toInputDate8743(r.data)||'0000').slice(0,4)||'Sense any'),r=>totalIva8743(r));
  const byMonth=aggregate8776(rows,r=>{const d=toInputDate8743(r.data)||'';return d?d.slice(0,7):'Sense data'},r=>totalIva8743(r));
  const total=rows.reduce((s,r)=>s+totalIva8743(r),0);
  const lastYear=[...byYear].sort((a,b)=>String(b.label).localeCompare(String(a.label))).slice(0,5);
  const lastMonth=[...byMonth].sort((a,b)=>String(b.label).localeCompare(String(a.label))).slice(0,6);
  return <Card title={title||'Resum / informes'}><div className="finance-report-v87110"><div><h4>Comparatiu per anys</h4>{lastYear.map(x=><div className="report-line-v87110" key={x.label}><span>{x.label}</span><b>{money(x.value)}</b></div>)}</div><div><h4>Últims mesos</h4>{lastMonth.map(x=><div className="report-line-v87110" key={x.label}><span>{x.label.split('-').reverse().join('/')}</span><b>{money(x.value)}</b></div>)}</div><div><h4>Lectura ràpida</h4><p>Total filtrat: <b>{money(total)}</b></p><p>Registres: <b>{rows.length}</b></p><p className="muted">Aquest bloc servirà com a base dels informes comparatius mensuals i anuals.</p></div></div></Card>
}

function DespesesMultiples({items,setItems}){
const tipus=["Kilometratge","Fotocòpies / impressions","Consultes telefòniques","Aparcament","Peatges","Dietes","Taxes / gestions","Missatgeria","Material auxiliar","Altres"];
function add(){setItems([...(items||[]),{id:"d"+Date.now(),tipus:"Altres",km:"0",preuKm:"0.30",quantitat:"1",preu:"0"}])}
function upd(id,k,v){setItems((items||[]).map(x=>x.id===id?{...x,[k]:v}:x))}
function del(id){setItems((items||[]).filter(x=>x.id!==id))}
function total(x){return x.tipus==="Kilometratge"?(+x.km||0)*(+x.preuKm||0):(+x.quantitat||0)*(+x.preu||0)}
return <div className="despeses-multi">
  <div className="despeses-head"><span>Concepte</span><span>Detall</span><span>Import</span><span></span></div>
  {(items||[]).map(x=><div className="despesa-row" key={x.id}>
    <select value={x.tipus} onChange={e=>upd(x.id,"tipus",e.target.value)}>{tipus.map(t=><option key={t}>{t}</option>)}</select>
    {x.tipus==="Kilometratge"
      ? <div className="km-fields"><label>Km<input type="number" step="0.01" value={x.km} onChange={e=>upd(x.id,"km",e.target.value)}/></label><label>€/km<input type="number" step="0.01" value={x.preuKm} onChange={e=>upd(x.id,"preuKm",e.target.value)}/></label></div>
      : <div className="km-fields"><label>Quant.<input type="number" step="0.01" value={x.quantitat} onChange={e=>upd(x.id,"quantitat",e.target.value)}/></label><label>Preu<input type="number" step="0.01" value={x.preu} onChange={e=>upd(x.id,"preu",e.target.value)}/></label></div>}
    <b>{money(total(x))}</b>
    <button className="danger" onClick={()=>del(x.id)}>Eliminar</button>
  </div>)}
  <button className="secondary add-line-btn" onClick={add}>+ Afegir despesa</button>
</div>}
function calcDespesaTotal(items=[]){return items.reduce((s,x)=>s+(x.tipus==="Kilometratge"?(+x.km||0)*(+x.preuKm||0):(+x.quantitat||0)*(+x.preu||0)),0)}
function calcKmTotal(items=[]){return items.reduce((s,x)=>s+(x.tipus==="Kilometratge"?(+x.km||0):0),0)}

function HonorarisTemps({obraId,data,timer,setTimer,startTimer,stopTimer,addManualHours,deleteHour}){
const key=lsKey8779(`aco_honoraris_rows_${obraId||"default"}`);
const tipusRegistre=["Honoraris","Kilometratge","Fotocòpies / impressions","Gasolina / desplaçament","Aparcament","Peatges","Dietes","Taxes / gestions","Altres"];
const tipusFeina=["Pressupost","Certificació d'obra","Acta d'obra","Memòria tècnica","Project management","Direcció d’obra","Direcció d’execució","Visita obra","Reunió","Trucades / emails","Gestió administrativa","Altres"];
const tasques=["Redacció","Revisió","Visita a obra","Reunió amb client","Reunió amb industrials","Trucades / emails","Preparació documentació","Gestió administrativa","Impressió / preparació entrega","Altres"];
const[rows,setRows]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||"[]")}catch(e){return []}});
const[editing,setEditing]=useState(null);
const[manual,setManual]=useState({data:new Date().toISOString().slice(0,10),tipusRegistre:"Honoraris",tipusFeina:"Pressupost",tasca:"Redacció",hores:"1.00",preuHora:"50.00",km:"0",preuKm:"0.30",quantitat:"1",preuUnitari:"0",observacions:""});
useEffect(()=>{localStorage.setItem(key,JSON.stringify(rows));localStorage.setItem(lsKey8779("aco_honoraris_sync_tick"),String(Date.now()))},[rows,key]);
function n(v){return Number(String(v??0).replace(",","."))||0}
function importReg(r){if(r.tipusRegistre==="Honoraris")return n(r.hores)*n(r.preuHora);if(r.tipusRegistre==="Kilometratge")return n(r.km)*n(r.preuKm);return n(r.quantitat)*n(r.preuUnitari)}
function totalKmRow(r){return r.tipusRegistre==="Kilometratge"?n(r.km):0}
let totalH=rows.reduce((s,r)=>s+(r.tipusRegistre==="Honoraris"?n(r.hores):0),0);
let totalHonor=rows.reduce((s,r)=>s+(r.tipusRegistre==="Honoraris"?importReg(r):0),0);
let totalDesp=rows.reduce((s,r)=>s+(r.tipusRegistre!=="Honoraris"?importReg(r):0),0);
let totalKm=rows.reduce((s,r)=>s+totalKmRow(r),0);
function add(){setRows(p=>[...p,{...manual,id:"hr-"+Date.now(),obraId}]);setManual(m=>({...m,tipusRegistre:"Honoraris",tipusFeina:"Pressupost",tasca:"Redacció",hores:"1.00",preuHora:"50.00",km:"0",preuKm:"0.30",quantitat:"1",preuUnitari:"0",observacions:""}))}
function upd(id,k,v){setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r))}
function del(id){if(confirm("Segur que vols eliminar aquest registre?"))setRows(p=>p.filter(r=>r.id!==id))}
function fields(r,setter,editingId){const set=(k,v)=>editingId?upd(editingId,k,v):setter({...r,[k]:v});if(r.tipusRegistre==="Honoraris")return <><label><span>Hores</span><input type="number" step="0.25" value={r.hores||0} onChange={e=>set("hores",e.target.value)}/></label><label><span>€/h</span><input type="number" step="0.01" value={r.preuHora||0} onChange={e=>set("preuHora",e.target.value)}/></label></>;if(r.tipusRegistre==="Kilometratge")return <><label><span>Kilòmetres</span><input type="number" step="0.01" value={r.km||0} onChange={e=>set("km",e.target.value)}/></label><label><span>€/km</span><input type="number" step="0.01" value={r.preuKm||0} onChange={e=>set("preuKm",e.target.value)}/></label></>;return <><label><span>Quantitat</span><input type="number" step="0.01" value={r.quantitat||0} onChange={e=>set("quantitat",e.target.value)}/></label><label><span>Preu unitari</span><input type="number" step="0.01" value={r.preuUnitari||0} onChange={e=>set("preuUnitari",e.target.value)}/></label></>}
return <div className="stack temps-validat-v8754"><Card title="Resum temps, honoraris i despeses"><div className="honor-kpis"><Kpi t="HORES" v={`${totalH.toFixed(2)} h`}/><Kpi t="HONORARIS" v={money(totalHonor)}/><Kpi t="DESPESES" v={money(totalDesp)}/><Kpi t="KM" v={`${totalKm.toFixed(2)} km`}/><Kpi t="TOTAL" v={money(totalHonor+totalDesp)}/></div></Card><Card title="Nou registre"><div className="time-form-v8754"><label><span>Data</span><input type="date" value={manual.data} onChange={e=>setManual({...manual,data:e.target.value})}/></label><label><span>Tipus de registre</span><select value={manual.tipusRegistre} onChange={e=>setManual({...manual,tipusRegistre:e.target.value})}>{tipusRegistre.map(t=><option key={t}>{t}</option>)}</select></label><label><span>Tipus de feina</span><select value={manual.tipusFeina} onChange={e=>setManual({...manual,tipusFeina:e.target.value})}>{tipusFeina.map(t=><option key={t}>{t}</option>)}</select></label><label><span>Tasca feta</span><select value={manual.tasca} onChange={e=>setManual({...manual,tasca:e.target.value})}>{tasques.map(t=><option key={t}>{t}</option>)}</select></label>{fields(manual,setManual,null)}<label className="span-all"><span>Observacions</span><input value={manual.observacions||""} onChange={e=>setManual({...manual,observacions:e.target.value})}/></label></div><div className="card-actions"><button className="primary" onClick={add}>Afegir registre</button></div></Card><Card title="Registres de temps / despeses"><div className="time-table-wrap"><table className="time-table time-table-v8754"><thead><tr><th>Data</th><th>Tipus registre</th><th>Tipus feina</th><th>Tasca</th><th>Dades</th><th>Observacions</th><th>Import</th><th>Accions</th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan="8"><Empty text="Encara no hi ha registres."/></td></tr>}{rows.map(r=>{let edit=editing===r.id;return <tr key={r.id}><td>{edit?<input type="date" value={r.data||""} onChange={e=>upd(r.id,"data",e.target.value)}/>:fmtAppDate8748(r.data)}</td><td>{edit?<select value={r.tipusRegistre||"Honoraris"} onChange={e=>upd(r.id,"tipusRegistre",e.target.value)}>{tipusRegistre.map(t=><option key={t}>{t}</option>)}</select>:r.tipusRegistre}</td><td>{edit?<select value={r.tipusFeina||"Altres"} onChange={e=>upd(r.id,"tipusFeina",e.target.value)}>{tipusFeina.map(t=><option key={t}>{t}</option>)}</select>:r.tipusFeina}</td><td>{edit?<select value={r.tasca||"Altres"} onChange={e=>upd(r.id,"tasca",e.target.value)}>{tasques.map(t=><option key={t}>{t}</option>)}</select>:r.tasca}</td><td>{edit?<div className="row-edit-fields-v8754">{fields(r,null,r.id)}</div>:r.tipusRegistre==="Honoraris"?`${n(r.hores).toFixed(2)} h × ${money(n(r.preuHora))}`:r.tipusRegistre==="Kilometratge"?`${n(r.km).toFixed(2)} km × ${money(n(r.preuKm))}`:`${n(r.quantitat).toFixed(2)} × ${money(n(r.preuUnitari))}`}</td><td>{edit?<input value={r.observacions||""} onChange={e=>upd(r.id,"observacions",e.target.value)}/>:r.observacions}</td><td><b>{money(importReg(r))}</b></td><td><div className="row-actions">{edit?<button className="secondary" onClick={()=>setEditing(null)}>Guardar</button>:<button className="secondary" onClick={()=>setEditing(r.id)}>Editar</button>}<button className="danger" onClick={()=>del(r.id)}>Eliminar</button></div></td></tr>})}</tbody></table></div></Card></div>}

function AvisosPanel({openObra}){
const[items,setItems]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_avisos_generals_v36"))||"null")||[
{id:"av1",estat:"Pendent",prioritat:"Urgent",client:"SOCOTERM",obra:"CP EDIFICI MARICEL",obraId:"maricel",limit:"2026-06-18",hora:"09:00",ubicacio:"Obra Maricel",titol:"Revisar proforma certificació",observacions:"Revisar la proforma abans d’enviar a DF."},
{id:"av2",estat:"Pendent",prioritat:"Mitjana",client:"SOCOTERM",obra:"CP EDIFICI MARICEL",obraId:"maricel",limit:"2026-06-25",hora:"10:00",ubicacio:"Obra Maricel",titol:"Validar acta visita 02",observacions:"Falta repassar assistents i signatura."}
]);
const[editing,setEditing]=useState(null);
useEffect(()=>localStorage.setItem(lsKey8779("aco_avisos_generals_v36"),JSON.stringify(items)),[items]);
function add(){setItems(p=>[{id:"av"+Date.now(),estat:"Pendent",prioritat:"Mitjana",client:"",obra:"Altres / possible client",obraId:"altres",limit:new Date().toISOString().slice(0,10),hora:"09:00",ubicacio:"",titol:"Nou avís",observacions:""},...p])}
function upd(id,k,v){setItems(p=>p.map(x=>x.id===id?{...x,[k]:v}:x))}
function del(id){if(confirm("Segur que vols eliminar aquest avís?"))setItems(p=>p.filter(x=>x.id!==id))}
return <div className="stack">
<Card title="Avisos generals" action={<button className="primary" onClick={add}><Plus/> Nou avís</button>}>
<div className="avisos-main-table">
<div className="avisos-main-head"><span>Prioritat</span><span>Data</span><span>Hora</span><span>Client</span><span>Obra</span><span>Avís</span><span>Estat</span><span>Accions</span></div>
{items.map(x=>{let edit=editing===x.id;return <div className="avisos-main-row" key={x.id}>
{edit?<>
<select value={x.prioritat} onChange={e=>upd(x.id,"prioritat",e.target.value)}><option>Urgent</option><option>Mitjana</option><option>Baixa</option></select>
<input type="date" value={x.limit} onChange={e=>upd(x.id,"limit",e.target.value)}/>
<input type="time" value={x.hora} onChange={e=>upd(x.id,"hora",e.target.value)}/>
<input value={x.client} onChange={e=>upd(x.id,"client",e.target.value)} placeholder="Client"/>
<input value={x.obra} onChange={e=>upd(x.id,"obra",e.target.value)} placeholder="Obra"/>
<input value={x.titol} onChange={e=>upd(x.id,"titol",e.target.value)} placeholder="Títol avís"/>
<select value={x.estat} onChange={e=>upd(x.id,"estat",e.target.value)}><option>Pendent</option><option>Fet</option><option>Rebutjat</option></select>
<div className="row-actions"><button className="secondary" onClick={()=>setEditing(null)}>Guardar</button><button className="danger" onClick={()=>del(x.id)}>Eliminar</button></div>
<textarea className="avisos-obs" value={x.observacions} onChange={e=>upd(x.id,"observacions",e.target.value)} placeholder="Observacions completes"/>
<input className="avisos-ubicacio" value={x.ubicacio} onChange={e=>upd(x.id,"ubicacio",e.target.value)} placeholder="Adreça / ubicació"/>
</>:<>
<span className={`priority-dot ${x.prioritat?.toLowerCase()}`}>{x.prioritat}</span><span>{fmtAppDate8748(x.limit)}</span><span>{x.hora}</span><span>{x.client}</span><span>{x.obra}</span><strong onClick={()=>setEditing(x.id)}>{x.titol}</strong><span>{x.estat}</span><div className="row-actions"><button className="secondary" onClick={()=>setEditing(x.id)}>Veure / editar</button>{x.obraId&&x.obraId!=="altres"&&<button className="secondary" onClick={()=>openObra(x.obraId)}>Obra</button>}</div>
</>}
</div>})}
</div></Card></div>}

function AvisosObraCard({obra,client,data}){
const[items,setItems]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779(`aco_avisos_obra_${obra.id}_v36`))||"null")||[]);
const[editing,setEditing]=useState(null);
useEffect(()=>localStorage.setItem(lsKey8779(`aco_avisos_obra_${obra.id}_v36`),JSON.stringify(items)),[items,obra.id]);
function add(){setItems(p=>[{id:"av"+Date.now(),estat:"Pendent",prioritat:"Mitjana",client:client?.nom||"",obra:obra.nom||"",limit:new Date().toISOString().slice(0,10),hora:"09:00",ubicacio:obra.adreca||"",titol:"Nou avís",observacions:""},...p])}
function upd(id,k,v){setItems(p=>p.map(x=>x.id===id?{...x,[k]:v}:x))}
function del(id){if(confirm("Segur que vols eliminar aquest avís?"))setItems(p=>p.filter(x=>x.id!==id))}
return <Card title="Avisos i notes de l’obra" action={<button className="primary" onClick={add}><Plus/> Nou avís</button>}>
{items.length===0?<Empty text="No hi ha avisos actius en aquesta obra."/>:<div className="avisos-obra-table">{items.map(x=>{let edit=editing===x.id;return <div className={`avisos-obra-row ${edit?"editing":""}`} key={x.id}>{edit?<>
<select value={x.prioritat} onChange={e=>upd(x.id,"prioritat",e.target.value)}><option>Urgent</option><option>Mitjana</option><option>Baixa</option></select>
<input type="date" value={x.limit} onChange={e=>upd(x.id,"limit",e.target.value)}/>
<input type="time" value={x.hora} onChange={e=>upd(x.id,"hora",e.target.value)}/>
<input value={x.client} onChange={e=>upd(x.id,"client",e.target.value)} placeholder="Client"/>
<input value={x.obra} onChange={e=>upd(x.id,"obra",e.target.value)} placeholder="Obra"/>
<input value={x.ubicacio} onChange={e=>upd(x.id,"ubicacio",e.target.value)} placeholder="Adreça / ubicació"/>
<input value={x.titol} onChange={e=>upd(x.id,"titol",e.target.value)} placeholder="Títol"/>
<select value={x.estat} onChange={e=>upd(x.id,"estat",e.target.value)}><option>Pendent</option><option>Fet</option><option>Rebutjat</option></select>
<textarea value={x.observacions} onChange={e=>upd(x.id,"observacions",e.target.value)} placeholder="Observacions completes"/>
<div className="row-actions"><button className="secondary" onClick={()=>setEditing(null)}>Guardar</button><button className="danger" onClick={()=>del(x.id)}>Eliminar</button></div>
</>:<>
<span className={`priority-dot ${x.prioritat?.toLowerCase()}`}>{x.prioritat}</span><strong onClick={()=>setEditing(x.id)}>{x.titol}</strong><span>{x.client}</span><span>{x.obra}</span><span>{fmtAppDate8748(x.limit)}</span><span>{x.hora}</span><span>{x.estat}</span><button className="secondary" onClick={()=>setEditing(x.id)}>Veure / editar</button>
</>}</div>})}</div>}
</Card>}
function Modal({title,children,close}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={close}><X/></button></div>{children}</div></div>}

function CertPrintV79({doc}){
  const rows=doc.rows||[];
  const current=rows.filter(r=>(+r.qAct||0)>0);
  const totalAct=current.reduce((s,r)=>s+(+r.qAct||0)*(+r.pu||0),0);
  return <div className="cert-print-v79">
    <h1>{doc.title}</h1>
    <p className="doc-sub">{doc.subtitle}</p>
    <h3>Relació de partides certificades</h3>
    <table><thead><tr><th>Partida</th><th>Concepte</th><th>Q certificada</th><th>PU</th><th>Import</th></tr></thead><tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*(+r.pu||0))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL CERTIFICACIÓ ACTUAL</th><th>{money(totalAct)}</th></tr></tfoot></table>
    <div className="page-break-v79"></div>
    <h2>Quadre resum de certificació</h2>
    <div className="cert-grid-print-v79">
      <div className="h">Partida</div><div className="h">Ut</div><div className="h">Resum</div><div className="h">CanPres</div><div className="h">PrPres</div><div className="h">ImpPres</div><div className="h">Q ant.</div><div className="h">% ant.</div><div className="h">Imp ant.</div><div className="h">Q act.</div><div className="h">% act.</div><div className="h">Imp act.</div><div className="h">Total origen</div>
      {rows.map(r=><React.Fragment key={r.codi}>
        <div>{r.codi}</div><div>{r.ut}</div><div className="concept">{r.concepte}</div><div>{qty2(r.q)}</div><div>{money(r.pu)}</div><div>{money((+r.q||0)*(+r.pu||0))}</div>
        <div>{qty2(r.qPrev)}</div><div>{pct((+r.q||0)?(+r.qPrev||0)/(+r.q)*100:0)}</div><div>{money((+r.qPrev||0)*(+r.pu||0))}</div>
        <div className={(+r.qAct||0)>0?"green":""}>{qty2(r.qAct)}</div><div className={(+r.qAct||0)>0?"green":""}>{pct((+r.q||0)?(+r.qAct||0)/(+r.q)*100:0)}</div><div className={(+r.qAct||0)>0?"green":""}>{money((+r.qAct||0)*(+r.pu||0))}</div>
        <div>{money(((+r.qPrev||0)+(+r.qAct||0))*(+r.pu||0))}</div>
      </React.Fragment>)}
    </div>
  </div>
}


function ProformaPrintV81({doc,pf}){
  const rows=pf.allRows||pf.rows||[];
  const certNum=+pf.numeroCert||+pf.numero||1;
  const certTotals=pf.certTotals||[];
  const prevTotals=certTotals.filter(c=>+c.n<certNum);
  const base=doc.base ?? pf.base ?? 0;
  const ded=doc.ded||0;
  const iva=doc.iva||21;
  const ret=doc.ret||0;
  const baseImposable=doc.base ?? base*(1-ded/100);
  const ivaImp=doc.ivaImp ?? baseImposable*iva/100;
  const retImp=doc.retImp ?? baseImposable*ret/100;
  const total=doc.total ?? baseImposable+ivaImp-retImp;
  const totalOrigen=pf.totalOrigen||rows.reduce((s,r)=>s+(+r.impOrigin||0),0);
  return <div className="proforma-print-v81">
    <h1>{doc.title}</h1>
    <p className="doc-sub">{doc.subtitle}</p>
    <h3>Partides certificades a origen</h3>
    <table><thead><tr><th>Codi</th><th>Concepte / descripció</th><th>Q origen</th><th>Preu</th><th>Total origen</th></tr></thead><tbody>{rows.map(r=><tr key={r.codi}><td>{r.codi}</td><td className="concept">{r.concepte}</td><td className="num">{qty2(r.qOrigin??0)}</td><td className="num">{money(r.pu)}</td><td className="num">{money(r.impOrigin??0)}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL A ORIGEN</th><th className="num">{money(totalOrigen)}</th></tr></tfoot></table>
    <h3>Deducció de certificacions anteriors</h3>
    <table className="totals-preview"><tbody><tr><th>Total certificat a origen</th><td className="num">{money(totalOrigen)}</td></tr>{prevTotals.length===0?<tr><th>No hi ha certificacions anteriors</th><td className="num">{money(0)}</td></tr>:prevTotals.map(c=><tr key={c.n}><th>Deducció Certificació {c.n}</th><td className="num">-{money(c.total)}</td></tr>)}<tr className="total"><th>Import sense IVA Cert. {certNum}</th><td className="num">{money(base)}</td></tr></tbody></table>
    <div className="doc-totals v81">
      <div><span>Deducció {ded}%</span><b>-{money(base-baseImposable)}</b></div>
      <div><span>Base imposable</span><b>{money(baseImposable)}</b></div>
      <div><span>IVA {iva}%</span><b>{money(ivaImp)}</b></div>
      <div><span>Retenció {ret}%</span><b>-{money(retImp)}</b></div>
      <div className="total"><span>Total proforma</span><b>{money(total)}</b></div>
    </div>
  </div>
}
function CertPrintV81({doc}){
  const rows=doc.rows||[];
  const current=rows.filter(r=>(+r.qAct||0)>0);
  const totalAct=current.reduce((s,r)=>s+(+r.qAct||0)*(+r.pu||0),0);
  return <div className="cert-print-v81">
    <h1>{doc.title}</h1><p className="doc-sub">{doc.subtitle}</p>
    <h3>Resum de partides certificades</h3>
    <table><thead><tr><th>Partida</th><th>Concepte</th><th>Q certificada</th><th>PU</th><th>Import</th></tr></thead><tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*(+r.pu||0))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL CERTIFICACIÓ</th><th>{money(totalAct)}</th></tr></tfoot></table>
    <div className="page-break-v81"></div>
    <h2>Quadre resum de certificació</h2>
    <div className="cert-grid-print-v81">
      <div className="h">Partida</div><div className="h">Ut</div><div className="h">Resum</div><div className="h">CanPres</div><div className="h">PrPres</div><div className="h">ImpPres</div><div className="h">Q ant.</div><div className="h">% ant.</div><div className="h">Imp ant.</div><div className="h">Q act.</div><div className="h">% act.</div><div className="h">Imp act.</div><div className="h">Total origen</div>
      {rows.map(r=><React.Fragment key={r.codi}><div>{r.codi}</div><div>{r.ut}</div><div className="concept">{r.concepte}</div><div>{qty2(r.q)}</div><div>{money(r.pu)}</div><div>{money((+r.q||0)*(+r.pu||0))}</div><div>{qty2(r.qPrev)}</div><div>{pct((+r.q||0)?(+r.qPrev||0)/(+r.q)*100:0)}</div><div>{money((+r.qPrev||0)*(+r.pu||0))}</div><div className={(+r.qAct||0)>0?"green":""}>{qty2(r.qAct)}</div><div className={(+r.qAct||0)>0?"green":""}>{pct((+r.q||0)?(+r.qAct||0)/(+r.q)*100:0)}</div><div className={(+r.qAct||0)>0?"green":""}>{money((+r.qAct||0)*(+r.pu||0))}</div><div>{money(((+r.qPrev||0)+(+r.qAct||0))*(+r.pu||0))}</div></React.Fragment>)}
    </div>
  </div>
}


function CertPrintV82({doc}){
const rows=doc.rows||[];
const current=rows.filter(r=>(+r.qAct||0)>0);
const total=current.reduce((s,r)=>s+(+r.qAct||0)*(+r.pu||0),0);
return <div className="cert-print-v82">
<h1>{doc.title}</h1><p>{doc.subtitle}</p>
<h3>Resum de partides certificades</h3>
<table><thead><tr><th>Partida</th><th>Concepte</th><th>Q certificada</th><th>PU</th><th>Import</th></tr></thead><tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*(+r.pu||0))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL</th><th>{money(total)}</th></tr></tfoot></table>
<div className="page-break-v82"></div>
<h2>Quadre resum</h2>
<table><thead><tr><th>Partida</th><th>Concepte</th><th>Q anterior</th><th>Q actual</th><th>Import actual</th><th>Total origen</th></tr></thead><tbody>{rows.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qPrev)}</td><td className={(+r.qAct||0)>0?"green":""}>{qty2(r.qAct)}</td><td className={(+r.qAct||0)>0?"green":""}>{money((+r.qAct||0)*(+r.pu||0))}</td><td>{money(((+r.qPrev||0)+(+r.qAct||0))*(+r.pu||0))}</td></tr>)}</tbody></table>
</div>
}


function CertPrintV87({doc}){
const rows=doc.rows||[];
const current=rows.filter(r=>(+r.qAct||0)>0);
const total=current.reduce((s,r)=>s+(+r.qAct||0)*(+r.pu||0),0);
const totalOrigen=doc.totalOrigen ?? rows.reduce((s,r)=>{
  const qOri=(+r.qOrigen||0)||((+r.qPrev||0)+(+r.qAct||0));
  return s+((+r.impOrigen||0)||qOri*(+r.pu||0));
},0);
let lastCap="__none__";
return <div className="cert-print-v8718 cert-print-v8771">
  <section className="cert-page-v8718 cert-page-v8771 portrait">
    <h1>{doc.title}</h1>
    <p className="doc-sub">{doc.data?`Data: ${doc.data} · `:""}{doc.subtitle}</p>
    <div className="cert-cover-box-v87 cert-cover-box-v8771">
      <b>Resum de partides modificades en la certificació en curs</b>
      <span>Partides amb amidament/import introduït en aquesta certificació: {current.length}</span>
      <span>Total certificació actual: {money(total)}</span>
      <span>Total acumulat a origen: {money(totalOrigen)}</span>
    </div>
    <h3>Resum de partides modificades en aquesta certificació</h3>
    {current.length===0?<div className="empty-print-v8718">No hi ha partides amb amidament certificat en aquesta certificació.</div>:<table className="cert-table-print-v8718 cert-summary-table-v8771">
      <colgroup><col className="c-partida"/><col className="c-ut"/><col className="c-concepte"/><col className="c-qty"/><col className="c-pu"/><col className="c-import"/></colgroup>
      <thead><tr><th>Partida</th><th>Ut</th><th>Concepte</th><th>Q certificada</th><th>PU</th><th>Import</th></tr></thead>
      <tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.ut}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*(+r.pu||0))}</td></tr>)}</tbody>
      <tfoot><tr><th colSpan="5">TOTAL CERTIFICACIÓ ACTUAL</th><th>{money(total)}</th></tr></tfoot>
    </table>}
  </section>

  <section className="cert-page-v8718 cert-page-v8771 landscape">
    <h2>Quadre resum general de certificació</h2>
    <table className="cert-wide-table-v8718 cert-wide-table-v8771">
      <colgroup>
        <col className="c-partida"/><col className="c-ut"/><col className="c-concepte"/>
        <col className="c-q"/><col className="c-pu"/><col className="c-imp"/>
        <col className="c-q"/><col className="c-pct"/><col className="c-imp"/>
        <col className="c-q"/><col className="c-pct"/><col className="c-imp"/>
        <col className="c-q"/><col className="c-pct"/><col className="c-imp-total"/>
      </colgroup>
      <thead>
        <tr className="blocks"><th colSpan="6">PRESSUPOST</th><th colSpan="3">CERT. {doc.prevNum} ANTERIOR</th><th colSpan="3">CERT. {doc.certNum} ACTUAL</th><th colSpan="3">A ORIGEN</th></tr>
        <tr><th>Partida</th><th>Ut</th><th>Concepte / descripció</th><th>Q pres.</th><th>PU pres.</th><th>Imp. pres.</th><th>Q ant.</th><th>% ant.</th><th>Imp. ant.</th><th>Q act.</th><th>% act.</th><th>Imp. act.</th><th>Q origen</th><th>% origen</th><th>Total origen</th></tr>
      </thead>
      <tbody>{rows.map(r=>{
        const pres=(+r.q||0)*(+r.pu||0), ant=(+r.qPrev||0)*(+r.pu||0), act=(+r.qAct||0)*(+r.pu||0);
        const qOri=(+r.qOrigen||0)||((+r.qPrev||0)+(+r.qAct||0));
        const impOri=(+r.impOrigen||0)||qOri*(+r.pu||0);
        const pctOri=r.pctOrigen ?? ((+r.q||0)?qOri/(+r.q)*100:0);
        const showCap=(r.cap||"")!==lastCap;
        if(showCap) lastCap=r.cap||"";
        return <React.Fragment key={(r.cap||"")+"-"+r.codi}>
          {showCap&&<tr className="cap-print-row-v8771"><td colSpan="15">{r.cap||"PRESSUPOST IMPORTAT"}</td></tr>}
          <tr>
            <td>{r.codi}</td><td>{r.ut}</td><td className="concept">{r.concepte}</td><td>{qty2(r.q)}</td><td>{money(r.pu)}</td><td>{money(pres)}</td>
            <td className={(+r.qPrev||0)>0?"green":""}>{qty2(r.qPrev)}</td><td className={(+r.qPrev||0)>0?"green":""}>{pct((+r.q||0)?(+r.qPrev||0)/(+r.q)*100:0)}</td><td className={(+r.qPrev||0)>0?"green":""}>{money(ant)}</td>
            <td className={(+r.qAct||0)>0?"green":""}>{qty2(r.qAct)}</td><td className={(+r.qAct||0)>0?"green":""}>{pct((+r.q||0)?(+r.qAct||0)/(+r.q)*100:0)}</td><td className={(+r.qAct||0)>0?"green":""}>{money(act)}</td>
            <td className={qOri>0?"green":""}>{qty2(qOri)}</td><td className={qOri>0?"green":""}>{pct(pctOri)}</td><td className={qOri>0?"green":""}>{money(impOri)}</td>
          </tr>
        </React.Fragment>
      })}</tbody>
    </table>
  </section>
</div>
}


function escHtmlV8772(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function normalizeText87101(v){return String(v||"").trim().toUpperCase().replace(/[\s.-]/g,"")}
function taxIdLike87101(v){const x=normalizeText87101(v);return /^[A-Z]?[0-9]{7,8}[A-Z0-9]$/.test(x)||/^[A-Z][0-9]{8}$/.test(x)}
function sameFiscalValue87101(a,b){return normalizeText87101(a)&&normalizeText87101(a)===normalizeText87101(b)}
function cleanClientFiscal87102(c={}){const out={...c};if(out.nif&&out.rao&&(sameFiscalValue87101(out.rao,out.nif)||taxIdLike87101(out.rao))){out.rao=out.nom||out.name||out.rao}if(!out.rao)out.rao=out.nom||out.name||"";return out}
function cleanFiscalName87101(client){const r=client?.rao||client?.nomFiscal||"";const n=client?.nom||"";if(r&& !taxIdLike87101(r) && !sameFiscalValue87101(r,client?.nif))return r;return n||r||"Nom fiscal pendent"}
function issuerFiscalName87100(client){return cleanFiscalName87101(client)}
function issuerLogoHtml87100(client){const src=client?.logo||"";return src?`<img class="brand-logo-v87100" src="${escHtmlV8772(src)}"/>`:`<div class="brand-logo-placeholder-v87100">LOGO</div>`}
function issuerFiscalBlockHtml87100(client){const name=issuerFiscalName87100(client);const nif=(client?.nif||"").trim();const nifLine=nif&&!sameFiscalValue87101(nif,name)?`<span>NIF/CIF: ${escHtmlV8772(nif)}</span>`:"";return `<div class="issuer-v87100"><div class="issuer-logo-box-v87100">${issuerLogoHtml87100(client)}</div><div><b>${escHtmlV8772(name)}</b>${nifLine}<span>${escHtmlV8772(client?.adreca||"")}</span><span>${escHtmlV8772([client?.codiPostal,client?.poblacio,client?.provincia?`(${client.provincia})`:""].filter(Boolean).join(" "))}</span><span>${escHtmlV8772(client?.email||"")}${client?.telefon?` · ${escHtmlV8772(client.telefon)}`:""}</span></div></div>`}

function certPrintHtmlV8772(doc,obra,client){
  const rows=doc.rows||[];
  const certNum=+doc.certNum||1;
  const originRows=originRowsFromDoc8794(rows,certNum);
  const fin=certFinancialSummaryFromDoc8794(rows,certNum,doc);
  const total=fin.actual;
  const totalOrigen=fin.totalOrigen;
  const certTotals=fin.certTotals;
  const prevTotals=fin.prevTotals||[];
  const deductionRows=prevTotals.length?prevTotals.map(c=>`<tr><td>Deducció Certificació ${c.n}</td><td class="num">-${money(c.total)}</td></tr>`).join(""):`<tr><td>No hi ha certificacions anteriors</td><td class="num">${money(0)}</td></tr>`;
  const summaryTotalsRows=certTotals.map(c=>`<tr><td>CERT. ${c.n}</td><td>${money(c.total)}</td></tr>`).join("");
  const originRowsHtml=originRows.map(r=>`<tr><td>${escHtmlV8772(r.codi)}</td><td>${escHtmlV8772(r.ut)}</td><td class="concept">${escHtmlV8772(r.concepte)}</td><td class="num">${qty2(r.qOrigin)}</td><td class="num">${money(r.pu)}</td><td class="num">${money(r.impOrigin)}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">No hi ha partides certificades a origen.</td></tr>`;
  let lastCap="__none__";
  const wideRows=rows.map(r=>{
    const cap=r.cap||"PRESSUPOST IMPORTAT";
    const showCap=cap!==lastCap; lastCap=cap;
    const pres=(+r.q||0)*(+r.pu||0), ant=(+r.qPrev||0)*(+r.pu||0), act=(+r.qAct||0)*(+r.pu||0);
    const qOri=(+r.qOrigen||0)||((+r.qPrev||0)+(+r.qAct||0));
    const impOri=(+r.impOrigen||0)||qOri*(+r.pu||0);
    const pctOri=r.pctOrigen ?? ((+r.q||0)?qOri/(+r.q)*100:0);
    return `${showCap?`<tr class="cap"><td colspan="15">${escHtmlV8772(cap)}</td></tr>`:""}<tr>
      <td>${escHtmlV8772(r.codi)}</td><td>${escHtmlV8772(r.ut)}</td><td class="concept">${escHtmlV8772(r.concepte)}</td><td>${qty2(r.q)}</td><td>${money(r.pu)}</td><td>${money(pres)}</td>
      <td class="${(+r.qPrev||0)>0?'green':''}">${qty2(r.qPrev)}</td><td class="${(+r.qPrev||0)>0?'green':''}">${pct((+r.q||0)?(+r.qPrev||0)/(+r.q)*100:0)}</td><td class="${(+r.qPrev||0)>0?'green':''}">${money(ant)}</td>
      <td class="${(+r.qAct||0)>0?'green':''}">${qty2(r.qAct)}</td><td class="${(+r.qAct||0)>0?'green':''}">${pct((+r.q||0)?(+r.qAct||0)/(+r.q)*100:0)}</td><td class="${(+r.qAct||0)>0?'green':''}">${money(act)}</td>
      <td class="${qOri>0?'green':''}">${qty2(qOri)}</td><td class="${qOri>0?'green':''}">${pct(pctOri)}</td><td class="${qOri>0?'green':''}">${money(impOri)}</td>
    </tr>${doc.includeMesures&&r.mesures&&r.mesures.length?`<tr class="measure"><td></td><td colspan="14"><b>Línies de medició:</b><table class="measure-inner"><thead><tr><th>Concepte</th><th>Unitats</th><th>Llargada</th><th>Amplada</th><th>Alçada</th><th>Total</th></tr></thead><tbody>${r.mesures.map(m=>`<tr><td>${escHtmlV8772(m.concepte||"")}</td><td>${escHtmlV8772(m.unitats||"")}</td><td>${escHtmlV8772(m.llargada||"")}</td><td>${escHtmlV8772(m.amplada||"")}</td><td>${escHtmlV8772(m.alcada||"")}</td><td>${qty2(medicioCalc8780(m,r.ut))}</td></tr>`).join("")}</tbody></table></td></tr>`:""}`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escHtmlV8772(doc.title||"Certificació")}</title><style>
    *{box-sizing:border-box} body{margin:0;background:white;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:10px}
    @page certPortraitV8772{size:A4 portrait;margin:18mm 14mm 14mm 14mm} @page certLandscapeV8772{size:A4 landscape;margin:12mm 10mm 10mm 10mm}
    .page{background:#fff;break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}
    .portrait{page:certPortraitV8772;width:182mm;min-height:258mm;padding:0}.landscape{page:certLandscapeV8772;width:277mm;min-height:185mm;padding:0}
    h1{font-size:18px;margin:0 0 6px;color:#0f2d5c} h2{font-size:16px;margin:0 0 8px;color:#0f2d5c} h3{font-size:13px;margin:12px 0 8px;color:#0f2d5c}.sub{color:#475569;margin:0 0 10px}
    .head{display:grid;grid-template-columns:1.1fr .9fr;gap:12px;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:10px}.head b{display:block;font-size:12px}.head span{display:block;color:#475569;margin-top:2px}.issuer-v87100{display:grid;grid-template-columns:34mm 1fr;gap:6mm;align-items:start}.issuer-logo-box-v87100{width:34mm;min-height:18mm;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;background:#fff}.brand-logo-v87100{max-width:32mm;max-height:20mm;object-fit:contain}.brand-logo-placeholder-v87100{font-weight:900;color:#94a3b8;font-size:10px}
    .cover{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:8px;margin:8px 0 10px}.cover b{grid-column:1/-1;font-size:13px}.cover span{background:#fff;border:1px solid #e2e8f0;border-radius:7px;padding:7px;font-weight:700;color:#334155}
    table{width:100%;border-collapse:collapse;table-layout:fixed} th,td{border:1px solid #94a3b8;padding:3px 4px;text-align:right;vertical-align:middle;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden} th{background:#dbeafe;color:#0f172a;font-weight:900}.concept{text-align:left!important;white-space:normal!important;overflow:visible!important;line-height:1.15}
    .summary{font-size:10px}.summary .part{width:14mm}.summary .ut{width:8mm}.summary .concept-col{width:auto}.summary .num{width:22mm}.summary .imp{width:26mm}.summary tfoot th{background:#b7c9dd;border-top:2px solid #0f172a}.deduction-box{width:112mm;margin:5mm 0 0 auto;border:1px solid #94a3b8;border-radius:6px;overflow:hidden}.deduction-box div{display:flex;justify-content:space-between;padding:5px 7px;border-bottom:1px solid #cbd5e1}.deduction-box div:last-child{border-bottom:0;background:#dbeafe;font-weight:900}.certs-list{width:95mm;margin:4mm 0 0 auto}.certs-list table{font-size:9px}.certs-list h3{margin-bottom:4px;text-align:left}
    .wide{font-size:6.4px;line-height:1.04}.wide col.part{width:5.6%}.wide col.ut{width:3.0%}.wide col.concept-col{width:31.0%}.wide col.q{width:3.7%}.wide col.pu{width:4.8%}.wide col.imp{width:5.5%}.wide col.pct{width:3.3%}.wide col.imp-total{width:5.8%}.wide th,.wide td{padding:1.7px 1.8px}.wide .blocks th{background:#b7c9dd;border-top:2px solid #0f172a;border-bottom:2px solid #0f172a;text-align:center}.wide .green{background:#d9ead3;font-weight:700}.wide th:nth-child(6),.wide td:nth-child(6),.wide th:nth-child(9),.wide td:nth-child(9),.wide th:nth-child(12),.wide td:nth-child(12){border-right:2px solid #0f172a}.cap td{background:#9fbad4!important;text-align:left!important;font-weight:900;border-top:2px solid #0f172a;border-bottom:1.5px solid #0f172a;white-space:normal!important;font-size:7px}.measure td{background:#fff!important;text-align:left!important;white-space:normal!important}.measure-inner{margin-top:3px;font-size:6.5px}.measure-inner th,.measure-inner td{padding:1.8px 2px}.cert-bottom-summary{margin-top:6mm;max-width:110mm;margin-left:auto}.cert-bottom-summary table{font-size:8px}.cert-bottom-summary th,.cert-bottom-summary td{text-align:right!important;padding:3px 4px}.cert-bottom-summary h3{text-align:left;margin:0 0 4px}
    thead{display:table-header-group} tfoot{display:table-footer-group}.wide th{white-space:normal!important;line-height:1.05}.empty{text-align:left;color:#64748b;padding:10px!important}
    @media screen{body{background:#e5e7eb;padding:16px}.page{box-shadow:0 2px 12px rgba(15,23,42,.15);margin:0 auto 16px;background:#fff;padding:8mm}.landscape{padding:6mm}}
    @media print{body{background:#fff!important;padding:0!important}.page{box-shadow:none!important;margin:0!important}.portrait{padding:0!important;width:182mm!important}.landscape{padding:0!important;width:277mm!important;min-height:185mm!important}.wide{table-layout:fixed!important;width:100%!important}.wide .concept{overflow:visible!important}}
  </style></head><body>
    <section class="page portrait">
      <div class="head">${issuerFiscalBlockHtml87100(client)}<div><b>${escHtmlV8772(obra?.propietat||client?.nom||"Client")}</b><span>NIF: ${escHtmlV8772(obra?.nifPropietat||"Pendent")}</span><span>${escHtmlV8772(obra?.adreca||"")} ${escHtmlV8772(obra?.poblacio||"")}</span></div></div>
      <h1>${escHtmlV8772(doc.title||"CERTIFICACIÓ")}</h1><p class="sub">${doc.data?`Data: ${escHtmlV8772(doc.data)} · `:""}${escHtmlV8772(doc.subtitle||"")}</p>
      <div class="cover"><b>Resum econòmic a origen</b><span>Partides amb certificació a origen: ${originRows.length}</span><span>Total certificat a origen: ${money(totalOrigen)}</span><span>Import cert. ${certNum} després deducció: ${money(total)}</span></div>
      <h3>Partides certificades a origen</h3>
      <table class="summary"><colgroup><col class="part"><col class="ut"><col class="concept-col"><col class="num"><col class="num"><col class="imp"></colgroup><thead><tr><th>Partida</th><th>Ut</th><th>Concepte</th><th>Q origen</th><th>PU</th><th>Total origen</th></tr></thead><tbody>${originRowsHtml}</tbody><tfoot><tr><th colspan="5">TOTAL A ORIGEN</th><th>${money(totalOrigen)}</th></tr></tfoot></table>
      <div class="certs-list"><h3>Deducció de certificacions anteriors</h3><table><thead><tr><th>Concepte</th><th>Import</th></tr></thead><tbody><tr><td><b>Total certificat a origen</b></td><td><b>${money(totalOrigen)}</b></td></tr>${deductionRows}<tr><td><b>Import sense IVA certificació ${certNum}</b></td><td><b>${money(total)}</b></td></tr></tbody></table></div>
    </section>
    <section class="page landscape">
      <h2>Quadre resum general de certificació</h2>
      <table class="wide"><colgroup><col class="part"><col class="ut"><col class="concept-col"><col class="q"><col class="pu"><col class="imp"><col class="q"><col class="pct"><col class="imp"><col class="q"><col class="pct"><col class="imp"><col class="q"><col class="pct"><col class="imp-total"></colgroup>
      <thead><tr class="blocks"><th colspan="6">PRESSUPOST</th><th colspan="3">CERT. ${escHtmlV8772(doc.prevNum)} ANTERIOR</th><th colspan="3">CERT. ${escHtmlV8772(doc.certNum)} ACTUAL</th><th colspan="3">A ORIGEN</th></tr><tr><th>Partida</th><th>Ut</th><th>Concepte / descripció</th><th>Q pres.</th><th>PU pres.</th><th>Imp. pres.</th><th>Q ant.</th><th>% ant.</th><th>Imp. ant.</th><th>Q act.</th><th>% act.</th><th>Imp. act.</th><th>Q origen</th><th>% origen</th><th>Total origen</th></tr></thead><tbody>${wideRows}</tbody></table>
      <div class="cert-bottom-summary"><h3>Resum total de certificacions</h3><table><thead><tr><th>Certificació</th><th>Total</th></tr></thead><tbody>${summaryTotalsRows}</tbody><tfoot><tr><th>Total a origen</th><th>${money(totalOrigen)}</th></tr></tfoot></table></div>
    </section>
  </body></html>`;
}

function CertPreviewV8772({doc}){
  const rows=doc.rows||[];
  const certNum=+doc.certNum||1;
  const fin=certFinancialSummaryFromDoc8794(rows,certNum,doc);
  const originRows=originRowsFromDoc8794(rows,certNum);
  const totalOrigen=fin.totalOrigen;
  const totalActual=fin.actual;
  const prevTotals=fin.prevTotals||[];
  return <div className="cert-preview-v8772 cert-preview-lite-v8783">
    <div className="cert-preview-head-v8772"><h1>{doc.title}</h1><p>{doc.data?`Data: ${doc.data} · `:""}{doc.subtitle}</p><b>{money(totalOrigen)}</b><small>Total certificat a origen</small></div>
    <div className="cert-preview-note-v8772"><b>Previsualització a origen.</b><span>La certificació en curs es presenta a origen; a sota es dedueixen les certificacions anteriors per obtenir l'import d'aquesta certificació. El quadre horitzontal no es modifica.</span></div>
    <div className="cert-lite-kpis-v8783"><div><span>Partides amb certificació a origen</span><b>{originRows.length}</b></div><div><span>Total certificat a origen</span><b>{money(totalOrigen)}</b></div><div><span>Import cert. {certNum} després deduccions</span><b>{money(totalActual)}</b></div></div>
    <h3>Partides certificades a origen</h3>
    {originRows.length===0?<div className="empty">No hi ha partides certificades a origen.</div>:<div className="cert-preview-table-wrap-v8772"><table className="cert-preview-summary-v8772 stable-num-table-v8783"><thead><tr><th>Partida</th><th>Ut</th><th>Concepte</th><th>Q origen</th><th>PU</th><th>Total origen</th></tr></thead><tbody>{originRows.slice(0,80).map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.ut}</td><td className="concept">{r.concepte}</td><td className="num">{qty2(r.qOrigin)}</td><td className="num">{money(r.pu)}</td><td className="num">{money(r.impOrigin)}</td></tr>)}</tbody><tfoot><tr><th colSpan="5">TOTAL A ORIGEN</th><th>{money(totalOrigen)}</th></tr></tfoot></table>{originRows.length>80&&<p className="muted">Hi ha més partides. El document complet sortirà a la impressió.</p>}</div>}
    <div className="cert-preview-totals-v8780"><h3>Deducció de certificacions anteriors</h3><table className="stable-num-table-v8783"><thead><tr><th>Concepte</th><th>Import</th></tr></thead><tbody><tr><td><b>Total certificat a origen</b></td><td><b>{money(totalOrigen)}</b></td></tr>{prevTotals.length===0?<tr><td>No hi ha certificacions anteriors</td><td>{money(0)}</td></tr>:prevTotals.map(c=><tr key={c.n}><td>Deducció Certificació {c.n}</td><td>-{money(c.total)}</td></tr>)}</tbody><tfoot><tr><th>Import sense IVA certificació {certNum}</th><th>{money(totalActual)}</th></tr></tfoot></table></div>
  </div>
}
function FormClient({onSubmit}){
  let[logo,setLogo]=useState("");
  const[cp,setCp]=useState("");
  const[pob,setPob]=useState("");
  function chCp(v){setCp(v);const p=poblacioForCp8773(v);if(p)setPob(p)}
  function chPob(v){setPob(v);const c=cpForPoblacio8773(v);if(c)setCp(c)}
  const provincia=provinciaForCp8773(cp)||provinciaForPoblacio8773(pob);
  return <form onSubmit={onSubmit} className="client-form-v8799"><DatalistCP8773/>
    <div className="module-note-v8738"><b>Alta de client / agent de biblioteca</b><span>Els camps amb * són obligatoris. Aquesta fitxa pot servir per clients teus, promotors, constructors, tècnics, autònoms o industrials que intervenen en obres.</span></div>
    <div className="form-grid client-form-grid-v8799">
      <label><span>Logo / foto empresa</span><input type="file" onChange={e=>f2u(e.target.files[0],setLogo)}/><input type="hidden" name="logoPreview" value={logo}/>{logo&&<img className="logo-preview" src={logo}/>}</label>
      <label><span>Nom visible / raó social *</span><input name="nom" required placeholder="Ex. SOCOTERM, BRAVA, Joan Puig..."/></label>
      <label><span>Nom fiscal alternatiu</span><input name="rao" placeholder="Nom fiscal si és diferent del nom visible"/></label>
      <label><span>NIF/CIF fiscal *</span><input name="nif" required placeholder="NIF/CIF fiscal"/></label>
      <label><span>Tipologia *</span><select name="tipus" required><option>Promotor / client final</option><option>Comunitat de propietaris</option><option>Particular</option><option>Constructor / contractista</option><option>Industrial</option><option>Arquitecte</option><option>Arquitecte tècnic</option><option>Direcció Facultativa</option><option>Autònom</option><option>Administració</option><option>Altres</option></select></label>
      <label><span>Persona de contacte</span><input name="contacte" placeholder="Nom de contacte, si és diferent"/></label>
      <label><span>Telèfon</span><input name="telefon" placeholder="Telèfon"/></label>
      <label><span>Email</span><input name="email" type="email" placeholder="Email"/></label>
      <label className="span-all"><span>Adreça *</span><input name="adreca" required placeholder="Carrer, número, localitat..."/></label>
      <label><span>Codi postal *</span><input name="codiPostal" required list="cp-list-v8773" value={cp} onChange={e=>chCp(e.target.value)} placeholder="17230"/></label>
      <label><span>Població *</span><input name="poblacio" required list="poblacio-list-v8773" value={pob} onChange={e=>chPob(e.target.value)} placeholder="Palamós"/></label>
      <label><span>Província</span><input name="provincia" value={provincia||""} readOnly placeholder="Automàtica pel CP"/></label>
    </div>
    <div className="modal-actions"><button type="button" className="secondary" onClick={()=>history.back?.()}>Cancel·lar</button><button className="primary">Crear client</button></div>
  </form>
}

function FormObra({clients,onSubmit}){const[clientSel,setClientSel]=useState("__new__");const[tipus,setTipus]=useState(WORK_TYPES8737[0]);return <form onSubmit={onSubmit}><div className="form-grid"><label><span>Client</span><select name="client" value={clientSel} onChange={e=>setClientSel(e.target.value)}><option value="__new__">+ Crear client nou</option><option value="" disabled>— Clients existents —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>{clientSel==="__new__"&&<><Input name="clientNouNom" label="Nom nou client" defaultValue="Nou client"/><Input name="clientNouRao" label="Raó social nou client" defaultValue="Pendent"/><label><span>Tipologia nou client</span><select name="clientNouTipus"><option>Particular</option><option>Promotor</option><option>Arquitecte tècnic</option><option>Constructor</option><option>Industrial</option><option>Administració</option><option>Altres</option></select></label><Input name="clientNouContacte" label="Contacte nou client" defaultValue="Pendent"/><Input name="clientNouNif" label="NIF/CIF nou client" defaultValue="Pendent"/><Input name="clientNouTelefon" label="Telèfon nou client" defaultValue="Pendent"/><Input name="clientNouEmail" label="Email nou client" defaultValue="Pendent"/><Input name="clientNouAdreca" label="Adreça nou client" defaultValue="Pendent"/></>}<Input name="nom" label="Nom de l’expedient" defaultValue="Nou expedient"/><Input name="subtitol" label="Descripció breu" defaultValue="Treball pendent de definir"/><label><span>Paraula clau del codi</span><input name="paraulaClau" placeholder="Ex: FRONTMAR, GARRIGOLES, PALAMOS"/></label><Input name="any" label="Any obertura" defaultValue="2026"/><label><span>Estat</span><select name="estat"><option>Pressupostada</option><option>Acceptada</option><option>Activa</option><option>En procés</option><option>Tancada</option></select></label><label className="span-all"><span>Tipus de treball</span><select name="tipusTreball" value={tipus} onChange={e=>setTipus(e.target.value)}>{WORK_TYPES8737.map(t=><option key={t}>{t}</option>)}</select></label>{tipus==="Altres"&&<Input name="tipusTreballAltres" label="Especifica el tipus de treball" defaultValue=""/>}<div className="span-all code-help-v8739"><b>Numeració automàtica</b><span>El codi es generarà com: ANY-NÚM-TIPUS-CLIENT-PARAULA CLAU. Exemple: 2026-001-PRES-SOC-FRONTMAR.</span></div><Input name="propietat" label="Client final / propietat" defaultValue="Pendent"/><Input name="nifPropietat" label="NIF client final" defaultValue="Pendent"/><Input name="adreca" label="Adreça" defaultValue="Pendent"/><Input name="poblacio" label="Població" defaultValue="Pendent"/><Input name="rc" label="Referència cadastral" defaultValue="Pendent"/></div><div className="modal-actions"><button className="primary">Crear expedient</button></div></form>}
function FormPartida({onSubmit}){return <form onSubmit={onSubmit}><div className="form-grid"><Input name="codi" label="Codi" defaultValue="10.02"/><Input name="cap" label="Capítol" defaultValue="10 FEINES FORA PRESSUPOST"/><Input name="concepte" label="Concepte" defaultValue="Nova partida"/><Input name="ut" label="Ut" defaultValue="m²"/><Input name="q" label="Quantitat" defaultValue="1"/><Input name="pu" label="PU" defaultValue="0"/><label><span>Tipus</span><select name="tipus"><option>Base</option><option>Modificada</option><option>Fora pressupost</option></select></label></div><div className="modal-actions"><button className="primary">Afegir partida</button></div></form>}
function FormAgent({onSubmit}){return <form onSubmit={onSubmit}><div className="form-grid"><Input name="nom" label="Nom" defaultValue="Nou agent"/><label><span>Rol</span><select name="rol"><option>Promotor</option><option>Arquitecte</option><option>Arquitecte tècnic</option><option>Direcció Facultativa</option><option>Constructor</option><option>Autònom</option><option>Subcontractat</option><option>Industrial</option><option>Administració</option><option>Altres</option></select></label><Input name="empresa" label="Empresa" defaultValue="Empresa"/><Input name="email" label="Email" defaultValue="email@domini.cat"/><Input name="telefon" label="Telèfon" defaultValue=""/></div><div className="modal-actions"><button className="primary">Crear agent</button></div></form>}
function FormActa({agents,onSubmit,openAgent}){
const[mode,setMode]=useState("existent");
return <form onSubmit={onSubmit} className="form-acta-v8747"><div className="form-grid"><label><span>Títol acta *</span><input name="titol" defaultValue="Nova acta d’expedient" required/></label><label><span>Data *</span><input name="data" type="date" defaultValue={todayISO8743?.()||"2026-06-06"} required/></label><label className="span-all"><span>Agents / assistents</span><div className="agent-choice-v8747"><select value={mode} onChange={e=>setMode(e.target.value)}><option value="existent">Cercar agent existent</option><option value="nou">Crear agent nou</option></select><button type="button" className="secondary" onClick={openAgent}><Plus/> Obrir fitxa completa d’agent</button></div></label>{mode==="existent"&&<label className="span-all"><span>Selecciona els agents existents</span><div className="check-grid">{agents.length===0&&<div className="empty mini">No hi ha agents creats encara.</div>}{agents.map(a=><label className="check-row" key={a.id}><input type="checkbox" name="agentsActa" value={a.id}/><span>{a.nom} · {a.rol} · {a.empresa}</span></label>)}</div></label>}{mode==="nou"&&<div className="span-all new-agent-box-v8747"><input type="hidden" name="crearAgentActa" value="1"/><h3>Crear agent nou per aquesta acta</h3><div className="form-grid no-pad"><label><span>Nom *</span><input name="agentNom" required={mode==="nou"}/></label><label><span>Rol *</span><select name="agentRol" required={mode==="nou"}><option>Promotor</option><option>Arquitecte</option><option>Arquitecte tècnic</option><option>Direcció Facultativa</option><option>Constructor</option><option>Industrial</option><option>Administració</option><option>Altres</option></select></label><label><span>Empresa / autònom *</span><input name="agentEmpresa" required={mode==="nou"}/></label><label><span>Email *</span><input name="agentEmail" type="email" required={mode==="nou"}/></label><label><span>Telèfon</span><input name="agentTelefon"/></label><label><span>NIF</span><input name="agentNif"/></label><label className="span-all"><span>Adreça</span><input name="agentAdreca"/></label></div></div>}<label className="span-all"><span>Text acta</span><textarea name="text" defaultValue="Es redacta acta de seguiment de l’expedient."/></label><div className="span-all acta-preview-mini-v8747"><b>Previsualització ràpida</b><p>L’acta es generarà amb capçalera de l’expedient, agents seleccionats, text, fotos i documents adjunts.</p></div><label><span>Fotos</span><input type="file" multiple/></label><label><span>Documents</span><input type="file" multiple/></label></div><div className="modal-actions"><button className="primary">Guardar acta</button></div></form>}

function FormEvent({clients=[],obres=[],calM,calY,selDay,onSubmit}){
const [clientSel,setClientSel]=useState("");
const [obraSel,setObraSel]=useState("");
const defaultDate=`${calY}-${String(calM+1).padStart(2,"0")}-${String(selDay||1).padStart(2,"0")}`;
return <form onSubmit={onSubmit} className="form-event-v78">
  <div className="form-grid">
    <label><span>Data completa</span><input type="date" name="data" defaultValue={defaultDate}/></label>
    <label><span>Hora</span><input name="hora" defaultValue="09:00"/></label>
    <label><span>Tipus</span><select name="type"><option>Nota</option><option>Visita d’obra</option><option>Reunió</option><option>Entrega documentació</option><option>Avís</option></select></label>
    <label><span>Client</span><select name="client" value={clientSel} onChange={e=>setClientSel(e.target.value)}><option value="">Selecciona client</option>{clients.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}<option value="__nou__">+ Crear client nou</option></select></label>
    {clientSel==="__nou__"&&<label><span>Nom nou client</span><input name="clientNou" placeholder="Nom del client"/></label>}
    <label><span>Obra / projecte</span><select name="obra" value={obraSel} onChange={e=>setObraSel(e.target.value)}><option value="">Selecciona obra</option>{obres.map(o=><option key={o.id} value={o.nom}>{o.nom}</option>)}<option value="__nova__">+ Crear obra/adreça nova</option></select></label>
    {obraSel==="__nova__"&&<label><span>Nou expedient / adreça</span><input name="obraNova" placeholder="Nom obra o adreça"/></label>}
    <label><span>Adreça visita</span><input name="adreca" placeholder="Adreça concreta si cal"/></label>
    <label><span>Resum / títol</span><input name="title" defaultValue="Nova nota"/></label>
    <label className="wide"><span>Observacions</span><textarea name="detail" placeholder="Observacions, tasques pendents, acords..."/></label>
  </div>
  <div className="modal-actions"><button className="primary">Guardar / Tancar</button></div>
</form>
}

function EmailModal({draft,setDraft,close}){let sel=draft.agents.filter(a=>draft.selected.includes(a.id));return <Modal title="Enviar per email" close={close}><div className="form-grid"><label className="span-all"><span>Destinataris</span><div className="check-grid">{draft.agents.length===0?<Empty text="Aquesta obra no té agents amb email assignats."/>:draft.agents.map(a=><label className="check-row"><input type="checkbox" checked={draft.selected.includes(a.id)} onChange={e=>setDraft({...draft,selected:e.target.checked?[...draft.selected,a.id]:draft.selected.filter(id=>id!==a.id)})}/><span>{a.nom} · {a.email}</span></label>)}</div></label><Input label="Assumpte" defaultValue={draft.title}/><label className="span-all"><span>Missatge</span><textarea value={draft.message} onChange={e=>setDraft({...draft,message:e.target.value})}/></label></div><div className="modal-actions"><button className="secondary" onClick={close}>Cancel·lar</button><button className="primary" onClick={()=>{let tos=sel.map(a=>a.email).join(",");openGmailCompose(tos,draft.title,draft.message)}}>Obrir correu</button></div></Modal>}
function proformaPrintHtml8783(doc,obra,client){
  const pf=doc.proforma||{};
  const rows=pf.allRows||pf.rows||[];
  const certNum=+pf.numeroCert||+pf.numero||1;
  const certTotals=pf.certTotals||[];
  const prevTotals=certTotals.filter(c=>+c.n<certNum);
  const base=doc.base ?? pf.base ?? 0;
  const ded=+doc.ded||0, iva=+doc.iva||21, ret=+doc.ret||0;
  const baseImposable=doc.base ?? base*(1-ded/100);
  const ivaImp=doc.ivaImp ?? baseImposable*iva/100;
  const retImp=doc.retImp ?? baseImposable*ret/100;
  const total=doc.total ?? baseImposable+ivaImp-retImp;
  const totalOrigen=pf.totalOrigen||rows.reduce((s,r)=>s+(+r.impOrigin||0),0);
  const bodyRows=rows.map(r=>`<tr><td>${escHtmlV8772(r.codi)}</td><td class="concept">${escHtmlV8772(r.concepte)}</td><td class="num">${qty2(r.qOrigin||0)}</td><td class="num">${money(r.pu)}</td><td class="num">${money(r.impOrigin||0)}</td></tr>`).join("")||`<tr><td colspan="5" class="empty">Sense partides certificades a origen.</td></tr>`;
  const deductionRows=prevTotals.length?prevTotals.map(c=>`<tr><th>Deducció Certificació ${c.n}</th><td class="num">-${money(c.total)}</td></tr>`).join(""):`<tr><th>No hi ha certificacions anteriors</th><td class="num">${money(0)}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escHtmlV8772(doc.title||"Factura proforma")}</title><style>@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:11px;margin:0;background:white}.page{width:182mm;min-height:269mm;margin:0 auto;background:white}.head{display:grid;grid-template-columns:1.1fr .9fr;gap:12mm;border-bottom:2px solid #0f172a;padding-bottom:9px;margin-bottom:14px}.head h3{margin:0 0 5px;font-size:12px}.head p{margin:0;line-height:1.45;color:#475569}.issuer-v87100{display:grid;grid-template-columns:34mm 1fr;gap:6mm;align-items:start}.issuer-v87100 b,.issuer-v87100 span{display:block;line-height:1.25}.issuer-v87100 b{font-size:12px;margin-bottom:2px}.issuer-logo-box-v87100{width:34mm;min-height:18mm;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;background:#fff}.brand-logo-v87100{max-width:32mm;max-height:20mm;object-fit:contain}.brand-logo-placeholder-v87100{font-weight:900;color:#94a3b8;font-size:10px}.title{display:flex;justify-content:space-between;align-items:flex-start;margin:0 0 14px}.title h1{margin:0;font-size:22px;color:#0f2d5c}.title b{font-size:20px}table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:5mm}th,td{border:1px solid #cbd5e1;padding:6px 7px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}th{background:#dbeafe;color:#0f172a;font-weight:900}.concept{text-align:left!important;white-space:normal!important}.num{text-align:right!important;font-variant-numeric:tabular-nums}.totals{width:86mm;margin-left:auto;margin-top:8mm}.totals div{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:6px 0}.totals .total{border-top:2px solid #0f172a;border-bottom:0;font-size:18px;margin-top:6px;padding-top:9px}.empty{text-align:left!important;color:#64748b}.cert-lines{width:92mm;margin-left:auto}.cert-lines th{text-align:left}.cert-lines td{text-align:right}.cert-lines .strong th,.cert-lines .strong td{background:#f1f5f9;font-weight:900}@media screen{body{background:#e5e7eb;padding:18px}.page{box-shadow:0 2px 18px rgba(15,23,42,.18);padding:14mm;transform-origin:top center}}@media(max-width:900px){body{padding:8px}.page{width:182mm;min-height:269mm;padding:10mm;transform:scale(.54);transform-origin:top left;margin:0 auto}.head{grid-template-columns:1fr 1fr;gap:8mm}table{font-size:9.5px}th,td{padding:4px 5px}.concept{font-size:9.5px}.totals{width:74mm}}@media print{body{background:#fff!important;padding:0!important}.page{box-shadow:none!important;padding:0!important;width:182mm!important;min-height:269mm!important}table{table-layout:fixed!important}.concept{overflow:visible!important}}</style></head><body><section class="page"><div class="head">${issuerFiscalBlockHtml87100(client)}<div><h3>Client / expedient</h3><p><b>${escHtmlV8772(obra?.propietat||client?.nom||"Client")}</b><br>${escHtmlV8772(expedientCode8739(obra))} · ${escHtmlV8772(obra?.nom||"")}<br>${escHtmlV8772(obra?.adreca||"")} ${escHtmlV8772(obra?.poblacio||"")}</p></div></div><div class="title"><div><h1>${escHtmlV8772(doc.title||"FACTURA PROFORMA")}</h1><p>${escHtmlV8772(doc.subtitle||"")}</p></div><b>${money(total)}</b></div><h3>Partides certificades a origen</h3><table><colgroup><col style="width:15mm"><col style="width:auto"><col style="width:18mm"><col style="width:20mm"><col style="width:24mm"></colgroup><thead><tr><th>Codi</th><th>Concepte / descripció</th><th>Q origen</th><th>Preu</th><th>Total origen</th></tr></thead><tbody>${bodyRows}</tbody><tfoot><tr><th colspan="4">TOTAL A ORIGEN</th><th>${money(totalOrigen)}</th></tr></tfoot></table><table class="cert-lines"><tbody><tr class="strong"><th>Total certificat a origen</th><td>${money(totalOrigen)}</td></tr>${deductionRows}</tbody></table><div class="totals"><div><span>Deducció ${ded}%</span><b>-${money(base-baseImposable)}</b></div><div><span>Base imposable</span><b>${money(baseImposable)}</b></div><div><span>IVA ${iva}%</span><b>${money(ivaImp)}</b></div><div><span>Retenció ${ret}%</span><b>-${money(retImp)}</b></div><div class="total"><span>Total proforma</span><b>${money(total)}</b></div></div></section></body></html>`;
}


function DocViewer({doc,obra,client,close,email}){
  const pf=doc.proforma;
  const agents=doc.agents||[];
  const acta=doc.acta?normalizeActa8768(doc.acta,agents):null;
  const actaPhotos=doc.actaPhotos||[];
  const actaDocs=doc.actaDocs||[];
  const assistents=acta?(acta.agentIds||[]).map(id=>agents.find(a=>a.id===id)).filter(Boolean):[];
  const printRef=useRef(null);
  function htmlForCurrentDoc(){
    if(doc.type==="certificacio"&&doc.rows)return certPrintHtmlV8772(doc,obra,client);
    if(doc.type==="proforma"&&doc.proforma)return proformaPrintHtml8783(doc,obra,client);
    const node=printRef.current;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${doc.title||'Document'}</title></head><body>${node?node.innerHTML:''}</body></html>`;
  }
  function downloadHtmlDoc(){
    const html=htmlForCurrentDoc();
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=((doc.title||"document").replace(/[^a-z0-9_\-]+/gi,"_")||"document")+".html";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  async function shareHtmlDoc(){
    const html=htmlForCurrentDoc();
    const name=((doc.title||"document").replace(/[^a-z0-9_\-]+/gi,"_")||"document")+".html";
    const file=new File([html],name,{type:"text/html"});
    try{
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:doc.title||"Document",text:"Document de l'APP Control d'Obres",files:[file]});return;}
      if(navigator.share){await navigator.share({title:doc.title||"Document",text:"Obre l'app i utilitza Imprimir/PDF per generar el document."});return;}
    }catch(e){return}
    alert("Aquest navegador no permet compartir directament. Pots descarregar el document o fer Imprimir > Guardar PDF.");
  }
  function printIsolated(){
    if(isMobilePrint878112()){
      if(doc.type==="certificacio"&&doc.rows){if(printHtmlInPlace878112(certPrintHtmlV8772(doc,obra,client),doc.title||"Certificació"))return;}
      if(doc.type==="proforma"&&doc.proforma){if(printHtmlInPlace878112(proformaPrintHtml8783(doc,obra,client),doc.title||"Factura proforma"))return;}
      document.body.classList.add("aco-mobile-printing-v878112");
      const cleanup=()=>{document.body.classList.remove("aco-mobile-printing-v878112");window.removeEventListener("afterprint",cleanup)};
      window.addEventListener("afterprint",cleanup);
      setTimeout(()=>{try{window.focus();window.print();}catch(e){cleanup()}setTimeout(cleanup,2500)},120);
      return;
    }
    const aw=window.screen?.availWidth||1400, ah=window.screen?.availHeight||900;
    const win=window.open('', '_blank', `width=${aw},height=${ah},left=0,top=0,resizable=yes,scrollbars=yes`);
    try{win?.moveTo?.(0,0);win?.resizeTo?.(aw,ah)}catch{}
    if(!win){setTimeout(()=>window.print(),100);return}
    if(doc.type==="certificacio"&&doc.rows){
      win.document.open();
      win.document.write(certPrintHtmlV8772(doc,obra,client)+`<script>setTimeout(()=>{window.focus();window.print();},450)<\/script>`);
      win.document.close();
      return;
    }
    if(doc.type==="proforma"&&doc.proforma){
      win.document.open();
      win.document.write(proformaPrintHtml8783(doc,obra,client)+`<script>setTimeout(()=>{window.focus();window.print();},450)<\/script>`);
      win.document.close();
      return;
    }
    const node=printRef.current;
    if(!node){window.print();return}
    const css=[...document.querySelectorAll('style')].map(x=>x.innerHTML).join('\n')+"\n"+[...document.styleSheets].map(ss=>{try{return [...(ss.cssRules||[])].map(r=>r.cssText).join('\n')}catch(e){return ''}}).join('\n');
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${doc.title||'Document'}</title><style>${css}\nbody{background:white!important;margin:0!important}.document-preview{background:white!important;padding:0!important}.document-page{box-shadow:none!important;border:0!important;margin:0 auto!important}.modal-actions,.modal-head,.no-print{display:none!important}</style></head><body>${node.innerHTML}<script>setTimeout(()=>{window.focus();window.print();},350)<\/script></body></html>`);
    win.document.close();
  }
  useEffect(()=>{if(doc?.autoPrint){const t=setTimeout(()=>{printIsolated();close?.();},120);return()=>clearTimeout(t)}},[doc?.autoPrint]);
  if(doc?.autoPrint)return null;
  return <Modal title={doc.title} close={close}>
    <div ref={printRef} className={`document-preview print-area clean-doc-preview-v8799 ${doc.type==="certificacio"?"cert-doc-v8718":"portrait-doc"}`}>
      <div className="document-page modern-acta-page">
        {doc.type!=="acta"&&doc.type!=="certificacio"&&doc.type!=="proforma"&&<div className="cert-header-pro">
          <div>{client?.logo?<img className="doc-logo" src={client.logo}/>:<div className="fake-logo">LOGO</div>}<h3>{client?.rao||client?.nom||"Despatx tècnic"}</h3><p>NIF: {client?.nif||"Pendent"}<br/>Adreça: {client?.adreca||"Pendent"}<br/>{client?.email||""}<br/>{client?.telefon||""}</p></div>
          <div><h3>{obra?.propietat||client?.nom||"Client"}</h3><p>NIF: {obra?.nifPropietat||"Pendent"}<br/>{obra?.adreca||""}<br/>{obra?.poblacio||""}</p></div>
        </div>}
        {doc.type==="certificacio"&&doc.rows?<CertPreviewV8772 doc={doc}/>:doc.type==="acta"&&acta?<ActaFormalPreview8768 obra={obra} client={client} acta={acta} agents={assistents} fotos={actaPhotos} docs={actaDocs}/>:doc.type==="proforma"&&pf?<ProformaPrintV81 doc={doc} pf={pf}/>:<div className="doc-box"><strong>Vista prèvia del document</strong><span>El document original queda registrat al llistat. La previsualització real del PDF necessita Storage/backend.</span></div>}
      </div>
    </div>
    <div className="modal-actions doc-mobile-actions-v87107">
      <button className="secondary" onClick={close}>Tancar / tornar</button>
      <button className="secondary" onClick={()=>email(doc.title)}>Enviar per Gmail</button>
      <button className="secondary" onClick={downloadHtmlDoc}>Descarregar document</button>
      <button className="secondary" onClick={shareHtmlDoc}>Compartir</button>
      <button className="primary" onClick={printIsolated}>Imprimir / Guardar PDF</button>
    </div>
  </Modal>
}
