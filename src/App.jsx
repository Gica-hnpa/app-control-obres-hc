
import React,{useEffect,useMemo,useRef,useState} from "react";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
import {Menu,X,Search,FolderOpen,Users,Bell,Settings,Building2,ClipboardList,CalendarDays,Plus,Upload,Mail,Save,ArrowLeft,Camera,Paperclip,PenLine,ReceiptText,BookOpen} from "lucide-react";
import {ECONOMIC_RECOVERY_V87214} from "./economicRecoveryV87214.js";
import {CERTIFICATION_RECOVERY_V87215} from "./certificationRecoveryV87215.js";

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

// V87.185 · guardat segur: evita que logos/fotos/base64 i còpies antigues omplin el localStorage.
function isQuotaError878185(e){return e&&(e.name==="QuotaExceededError"||e.code===22||String(e?.message||"").toLowerCase().includes("quota"))}
function stripHeavy878185(value){
  if(Array.isArray(value))return value.map(stripHeavy878185);
  if(value&&typeof value==="object"){
    const out={};
    Object.entries(value).forEach(([k,v])=>{
      const lk=String(k||"").toLowerCase();
      if(["logo","logos","src","url","dataurl","base64","blob","raw","content","filedata","preview","imatge","image","foto","fotos","croquis"].includes(lk)){
        if(Array.isArray(v)) out[k]=v.map((x,i)=>x&&typeof x==="object"?{id:x.id||`fitxer-${i}`,nom:x.nom||x.name||"Fitxer",data:x.data||x.createdAt||"",origen:x.origen||"",_light:true}:"[fitxer eliminat per pes]");
        else out[k]="";
        return;
      }
      out[k]=stripHeavy878185(v);
    });
    return out;
  }
  if(typeof value==="string"){
    if(/^data:/i.test(value)||value.length>350000)return "";
    return value;
  }
  return value;
}
function localStorageBytes878185(){
  let total=0,keys=0;
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||"";const v=localStorage.getItem(k)||"";total+=k.length+v.length;keys++;}}catch{}
  return {keys,chars:total,mb:(total/1024/1024).toFixed(2)};
}
function cleanupLocalStorage878185(user=currentAppUser8779(),mode="safe"){
  const u=String(user||"").trim().toLowerCase();
  const pref=u?`${STORAGE_NS8782}__${u}__`:"";
  const removeMatchers=["corrupt_backup","login_recovery","backup_abans_import","aco_storage_warning_v87104"];
  let removed=0,rewritten=0,freed=0;
  const keys=[];
  try{for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));}catch{}
  keys.filter(Boolean).forEach(k=>{
    const isUserKey=!pref||k.startsWith(pref)||(u==="hector"&&/^aco_/.test(k)&&!k.startsWith(STORAGE_NS8782+"__"));
    if(!isUserKey)return;
    const old=localStorage.getItem(k)||"";
    if(removeMatchers.some(m=>k.includes(m))||(mode==="deep"&&old.length>1500000)){
      try{localStorage.removeItem(k);removed++;freed+=old.length;}catch{}
      return;
    }
    let parsed=null,ok=false;
    try{parsed=JSON.parse(old);ok=true;}catch{}
    if(ok){
      const light=JSON.stringify(stripHeavy878185(parsed));
      if(light.length<old.length){try{localStorage.setItem(k,light);rewritten++;freed+=old.length-light.length;}catch{}}
    }else if(/^data:/i.test(old)||old.length>700000){
      try{localStorage.setItem(k,"");rewritten++;freed+=old.length;}catch{}
    }
  });
  return {removed,rewritten,freed,usage:localStorageBytes878185()};
}
function safeSetLocalStorage878185(key,value,user=currentAppUser8779()){
  const str=typeof value==="string"?value:JSON.stringify(value);
  try{localStorage.setItem(key,str);return {ok:true,light:false};}
  catch(e){
    cleanupLocalStorage878185(user,"safe");
    try{localStorage.setItem(key,str);return {ok:true,light:false,cleaned:true};}
    catch(e2){
      if(isQuotaError878185(e)||isQuotaError878185(e2)){
        const light=typeof value==="string"?JSON.stringify(stripHeavy878185(safeJsonParse8784(value,value))):JSON.stringify(stripHeavy878185(value));
        try{localStorage.setItem(key,light);return {ok:true,light:true,cleaned:true};}
        catch(e3){
          cleanupLocalStorage878185(user,"deep");
          try{localStorage.setItem(key,light);return {ok:true,light:true,cleaned:true,deep:true};}
          catch(e4){
            try{sessionStorage.setItem("aco_last_storage_error_v87185",String(e4?.message||e4));}catch{}
            window.dispatchEvent?.(new CustomEvent("aco-storage-error-v87185",{detail:{key,error:String(e4?.message||e4)}}));
            console.error("No s'ha pogut guardar localment ni en mode lleuger",key,e4);
            return {ok:false,error:e4};
          }
        }
      }
      console.warn("No s'ha pogut guardar localment",key,e2);
      return {ok:false,error:e2};
    }
  }
}
function lsSet8779(key,value,user=currentAppUser8779()){
  const res=safeSetLocalStorage878185(lsKey8779(key,user),value,user);
  if(!res.ok)console.warn("No s'ha pogut guardar localment",key,res.error);
  return res.ok;
}
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
      const numeric=typeof normalizeEconomicNumbers878215==="function"?normalizeEconomicNumbers878215(base):base;
      const normalized=typeof normalizeBudgetedData8791==="function"?normalizeBudgetedData8791(numeric):numeric;
      const recovered=typeof recoverKnownEconomicZero878214==="function"?recoverKnownEconomicZero878214(normalized,k):normalized;
      const certifications=typeof recoverKnownCertificationZero878215==="function"?recoverKnownCertificationZero878215(recovered,k):recovered;
      out[k]=typeof normalizeBudgetedData8791==="function"?normalizeBudgetedData8791(certifications):certifications;
    }
  });
  return out;
}


// V87.104: persistència crítica separada. Evita perdre pressupostos annexos/fora pressupost
// quan el localStorage queda ple per fotos, croquis o documents en base64.
function stripHeavy878104(value){
  // V87.185: compatibilitat amb la neteja ampliada.
  if(typeof stripHeavy878185==="function")return stripHeavy878185(value);
  if(Array.isArray(value)) return value.map(stripHeavy878104);
  if(value && typeof value === "object"){
    const out={};
    Object.entries(value).forEach(([k,v])=>{
      const lk=String(k).toLowerCase();
      if(["logo","imatge","image","foto","fotos","croquis","src","url","dataurl","base64","blob","raw","content","filedata","preview"].includes(lk)) return;
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
function mergeArrGeneric878181(a=[],b=[],keyFn){
  const map=new Map();
  let i=0;
  [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(x=>{
    if(!x)return;
    const k=String(keyFn?keyFn(x,i):'').trim() || `row-${i}`;
    map.set(k,{...(map.get(k)||{}),...x});
    i++;
  });
  return [...map.values()];
}
function mergeOdataCore878104(full={},core={}){
  // V87.211 · integritat: la còpia completa és l'autoritat. La còpia crítica
  // només és una reserva si falta l'expedient complet; no es poden unir files
  // antigues amb les actuals perquè una baixa o un canvi de codi reapareixeria.
  const primary=full&&typeof full==="object"&&!Array.isArray(full)?full:{};
  const fallback=core&&typeof core==="object"&&!Array.isArray(core)?core:{};
  const out={};
  const ids=new Set([...Object.keys(fallback),...Object.keys(primary)]);
  ids.forEach(oid=>{
    const fd=primary[oid];
    const cv=fallback[oid];
    const chosen=fd&&typeof fd==="object"&&!Array.isArray(fd)?fd:cv;
    if(!chosen||typeof chosen!=="object"||Array.isArray(chosen))return;
    out[oid]=typeof normalizeBudgetedData8791==="function"?normalizeBudgetedData8791(chosen):chosen;
  });
  return out;
}
function saveOdata878104(odata,user=currentAppUser8779()){
  const core=stripHeavy878104(odata||{});
  const a=safeSetLocalStorage878185(lsKey8779("aco_odata_core_v87104",user),core,user);
  const b=safeSetLocalStorage878185(lsKey8779("aco_odata",user),core,user);
  if(a.ok&&b.ok){try{localStorage.removeItem(lsKey8779("aco_storage_warning_v87104",user));}catch{};return true;}
  console.warn("No s'ha pogut guardar correctament l'obra",a,b);
  try{sessionStorage.setItem("aco_last_storage_error_v87185","No s'ha pogut guardar odata. Cal exportar abans de continuar.")}catch{}
  try{localStorage.setItem(lsKey8779("aco_storage_warning_v87104",user),"ATENCIÓ: el navegador no ha pogut guardar totes les dades. Exporta JSON/Excel abans de continuar.")}catch{}
  return false;
}

function backupUserState8785(user,reason,raw){
  try{
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    // V87.185: les còpies de recuperació no poden tornar a omplir el navegador.
    safeSetLocalStorage878185(`${STORAGE_NS8782}__${user||"nouser"}__login_recovery__${reason}__${stamp}`,JSON.stringify(stripHeavy878185(raw||{})).slice(0,120000),user);
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
const EXPEDIENT_STATUS878136=["Pressupostat","En procés","Acceptat","En curs / Actiu","Tancat","Anul·lat","No acceptat","Pendent de resposta","En revisió"];
function normalizeExpedientStatus878136(v){
  const s=String(v||"").trim().toLowerCase();
  if(!s)return "Pendent de resposta";
  if(s.includes("pressupost"))return "Pressupostat";
  if(s.includes("accept")&&!s.includes("no"))return "Acceptat";
  if(s.includes("proc"))return "En procés";
  if(s.includes("actiu")||s.includes("activa")||s.includes("curs"))return "En curs / Actiu";
  if(s.includes("tanc")||s.includes("final"))return "Tancat";
  if(s.includes("anul"))return "Anul·lat";
  if(s.includes("no accept")||s.includes("descart")||s.includes("rebutj")||s.includes("no contest"))return "No acceptat";
  if(s.includes("revis"))return "En revisió";
  if(s.includes("pendent"))return "Pendent de resposta";
  return v||"Pendent de resposta";
}
function isExpedientOpen878136(v){const n=normalizeExpedientStatus878136(v);return !["Tancat","Anul·lat","No acceptat"].includes(n)}
function statusOptions878136(current){const n=normalizeExpedientStatus878136(current);return [...new Set([n,...EXPEDIENT_STATUS878136].filter(Boolean))]}
function todayStartMs878136(){const d=new Date();d.setHours(0,0,0,0);return d.getTime()}
function isFutureOrTodayEvent878136(e){const t=eventTime8783(e);return t>=todayStartMs878136()}
function fmtEventDate878136(e){
  const t=eventTime8783(e);
  if(t){const d=new Date(t);return d.toLocaleDateString('ca-ES')}
  return fmtAppDate8748(e?.data||e?.date)||"Sense data";
}

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
    current.total+=(+r.q||0)*parseNum8770(r.pu);
  });
  return out;
}

function money(n){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(parseNum8770(n))+" €"}
function parseNum8770(v){const raw=String(v??"").trim().replace(/\s/g,"").replace(/€/g,""); const normalized=raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw; const n=Number(normalized); return Number.isFinite(n)?n:0}
function normalizeEconomicNumbers878215(data={}){
  const partides=(data.partides||[]).map(row=>{
    const next={...row,q:parseNum8770(row.q),pu:parseNum8770(row.pu)};
    if(row.certAnterior!==undefined)next.certAnterior=parseNum8770(row.certAnterior);
    if(row.certActual!==undefined)next.certActual=parseNum8770(row.certActual);
    if(row.certsByNum&&typeof row.certsByNum==="object"){
      next.certsByNum=Object.fromEntries(Object.entries(row.certsByNum).map(([num,value])=>[String(num),parseNum8770(value)]));
    }
    Object.keys(row).filter(key=>/^cert_\d+$/.test(key)).forEach(key=>{next[key]=parseNum8770(row[key])});
    return next;
  });
  const certificacions=(data.certificacions||[]).map(cert=>({...cert,import:parseNum8770(cert.import)}));
  return {...data,partides,certificacions};
}
function recoveryText878214(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function recoveryRowKeys878214(r={}){
  const bid=r.budgetId||"principal";
  const id=String(r.id||"").trim();
  const cap=recoveryText878214(r.cap);
  const codi=recoveryText878214(r.codi);
  const concepte=recoveryText878214(r.concepte);
  return [id?`id:${bid}:${id}`:"",`full:${bid}:${cap}:${codi}:${concepte}`,`code:${bid}:${cap}:${codi}`].filter(Boolean);
}
function recoverKnownEconomicZero878214(data={},obraId=""){
  if(String(obraId)!==String(ECONOMIC_RECOVERY_V87214.obraId))return data;
  const currentRows=Array.isArray(data.partides)?data.partides:[];
  const baseRows=ECONOMIC_RECOVERY_V87214.rows||[];
  if(!currentRows.length||!baseRows.length)return data;
  const baseIndex=new Map();
  baseRows.forEach(r=>recoveryRowKeys878214(r).forEach(k=>{if(!baseIndex.has(k))baseIndex.set(k,r)}));
  const matched=currentRows.map(r=>{
    let base=null;
    for(const key of recoveryRowKeys878214(r)){if(baseIndex.has(key)){base=baseIndex.get(key);break}}
    return {row:r,base};
  });
  const budgetIds=[...new Set(baseRows.map(r=>r.budgetId||"principal"))];
  const recoverBudgets=new Set();
  budgetIds.forEach(bid=>{
    const base=baseRows.filter(r=>(r.budgetId||"principal")===bid);
    const now=matched.filter(x=>(x.row.budgetId||"principal")===bid);
    const found=now.filter(x=>x.base&&(x.base.budgetId||"principal")===bid);
    const basePu=base.filter(r=>Math.abs(parseNum8770(r.pu))>0.000001).length;
    const nowPu=now.filter(x=>Math.abs(parseNum8770(x.row.pu))>0.000001).length;
    const baseTotal=base.reduce((s,r)=>s+parseNum8770(r.q)*parseNum8770(r.pu),0);
    const nowTotal=now.reduce((s,x)=>s+parseNum8770(x.row.q)*parseNum8770(x.row.pu),0);
    const enoughRows=now.length>=Math.max(8,Math.floor(base.length*.65));
    const enoughMatches=found.length>=Math.max(8,Math.floor(Math.min(now.length,base.length)*.55));
    const massiveZero=(basePu>=10&&nowPu<=Math.max(2,Math.floor(basePu*.1)))||(Math.abs(baseTotal)>1000&&Math.abs(nowTotal)<1);
    if(enoughRows&&enoughMatches&&massiveZero)recoverBudgets.add(bid);
  });
  if(!recoverBudgets.size)return data;
  let restored=0;
  const partides=matched.map(({row,base})=>{
    const bid=row.budgetId||"principal";
    if(!recoverBudgets.has(bid)||!base||(base.budgetId||"principal")!==bid)return row;
    restored++;
    return {...row,q:base.q,pu:base.pu,economicRecoveryV87214:true,economicRecoverySource:"V87.213 estable",economicRecoveredAt:new Date().toISOString()};
  });
  const totals={};
  partides.forEach(r=>{const bid=r.budgetId||"principal";totals[bid]=(totals[bid]||0)+parseNum8770(r.q)*parseNum8770(r.pu)});
  const pressupostos=(data.pressupostos||[]).map(p=>{
    const bid=p.budgetId||"principal";
    const marker=String(p.id||"").startsWith("budget-marker-")||p.versio==="Annex"||p.versio==="Principal";
    return recoverBudgets.has(bid)&&marker?{...p,import:totals[bid]||0,total:totals[bid]||0,updatedAt:new Date().toISOString()}:p;
  });
  return {
    ...data,
    partides,
    pressupostos,
    pressupost:recoverBudgets.has("principal")?(totals.principal||0):(data.pressupost||0),
    economicRecoveryV87214:{applied:true,restored,budgets:[...recoverBudgets],sourceVersion:ECONOMIC_RECOVERY_V87214.sourceVersion,appliedAt:new Date().toISOString()},
    updatedAt:new Date().toISOString()
  };
}
function currentCertQuantity878215(row={},num=1){
  const key=String(num);
  const lines=(row.certMesuresByNum||{})[key];
  if(lines&&lines.length){
    const lineTotal=medicioTotal8780(lines,row.ut);
    if(Math.abs(lineTotal)>0.000001)return {value:lineTotal,source:"mesures"};
  }
  if(row.certsByNum&&row.certsByNum[key]!==undefined){
    const value=parseNum8770(row.certsByNum[key]);
    if(Math.abs(value)>0.000001)return {value,source:"certsByNum"};
  }
  if(row[`cert_${key}`]!==undefined){
    const value=parseNum8770(row[`cert_${key}`]);
    if(Math.abs(value)>0.000001)return {value,source:"legacy"};
  }
  if(num===1&&Math.abs(parseNum8770(row.certAnterior))>0.000001)return {value:parseNum8770(row.certAnterior),source:"anterior"};
  if(num===2&&Math.abs(parseNum8770(row.certActual))>0.000001)return {value:parseNum8770(row.certActual),source:"actual"};
  return {value:0,source:"zero"};
}
function recoverKnownCertificationZero878215(data={},obraId=""){
  if(String(obraId)!==String(CERTIFICATION_RECOVERY_V87215.obraId))return data;
  if(data?.certificationRecoveryV87215?.applied)return data;
  const rows=Array.isArray(data.partides)?data.partides:[];
  const baseRows=CERTIFICATION_RECOVERY_V87215.rows||[];
  if(!rows.length||!baseRows.length)return data;
  const expected=CERTIFICATION_RECOVERY_V87215.expectedTotals||{};
  const nums=Object.keys(expected).map(Number).filter(n=>n>0).sort((a,b)=>a-b);
  const totals=Object.fromEntries(nums.map(num=>[String(num),rows.reduce((sum,row)=>sum+currentCertQuantity878215(row,num).value*parseNum8770(row.pu),0)]));
  const missing=nums.filter(num=>Math.abs(parseNum8770(expected[String(num)]))>1&&Math.abs(totals[String(num)]||0)<1);
  if(missing.length<3)return data;
  const baseIndex=new Map();
  baseRows.forEach(row=>recoveryRowKeys878214(row).forEach(key=>{if(!baseIndex.has(key))baseIndex.set(key,row)}));
  let restoredValues=0;
  const partides=rows.map(row=>{
    let base=null;
    for(const key of recoveryRowKeys878214(row)){if(baseIndex.has(key)){base=baseIndex.get(key);break}}
    if(!base)return row;
    const certsByNum={...(row.certsByNum||{})};
    const patch={};
    missing.forEach(num=>{
      const key=String(num);
      const current=currentCertQuantity878215(row,num);
      if(Math.abs(current.value)>0.000001)return;
      const baseline=parseNum8770(base.certsByNum?.[key]);
      if(Math.abs(baseline)<0.000001)return;
      certsByNum[key]=baseline;
      patch[`cert_${key}`]=baseline;
      restoredValues++;
    });
    return Object.keys(patch).length?{...row,...patch,certsByNum,certificationRecoveryV87215:true,certificationRecoveredAt:new Date().toISOString()}:row;
  });
  if(!restoredValues)return data;
  const recalculated=Object.fromEntries(nums.map(num=>[String(num),partides.reduce((sum,row)=>sum+currentCertQuantity878215(row,num).value*parseNum8770(row.pu),0)]));
  const currentRecords=[...(data.certificacions||[])];
  const seen=new Set();
  const certificacions=currentRecords.filter(cert=>{
    const key=`${cert.budgetId||"principal"}:${cert.numero||""}`;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  }).map(cert=>{
    const key=String(cert.numero||"");
    if((cert.budgetId||"principal")!=="principal"||!missing.includes(Number(key)))return cert;
    const amount=recalculated[key]||parseNum8770(expected[key]);
    return {...cert,import:amount,updatedAt:new Date().toISOString()};
  });
  (CERTIFICATION_RECOVERY_V87215.records||[]).forEach(base=>{
    const key=`${base.budgetId||"principal"}:${base.numero}`;
    if(seen.has(key))return;
    seen.add(key);
    certificacions.push({...base,id:`cert-recovered-v87215-${base.numero}`,estat:base.estat||"Guardada",import:recalculated[String(base.numero)]||base.import,createdAt:new Date().toISOString()});
  });
  return {
    ...data,
    partides,
    certificacions:certificacions.sort((a,b)=>String(a.budgetId||"principal").localeCompare(String(b.budgetId||"principal"))||Number(a.numero)-Number(b.numero)),
    certificationRecoveryV87215:{applied:true,restoredValues,certifications:missing,totals:recalculated,sourceVersion:CERTIFICATION_RECOVERY_V87215.sourceVersion,appliedAt:new Date().toISOString()},
    updatedAt:new Date().toISOString()
  };
}
function moneyInput8770(v){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(parseNum8770(v))}
function qty2(n){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(parseNum8770(n))}

function clientBudgetDefaultsKey878160(client){return `aco_budget_defaults_v87160_${String(client?.id||client?.nom||client?.rao||"general").toLowerCase().replace(/[^a-z0-9_-]+/g,"_")}`}
function clientBudgetCode878194(client={}){
  const explicit=String(client.codiPressupost||client.codi||client.codigo||client.ref||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  if(explicit)return explicit;
  const words=String(client.nom||client.rao||"CLIENT").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9 ]/g," ").split(/\s+/).filter(Boolean);
  return (words.length>1?words.map(w=>w[0]).join(""):words[0]||"CLI").slice(0,6)||"CLI";
}
function clientBudgetNumbers878194(obres=[],odata={},clientId="",excludeObraId=""){
  const nums=[];
  (obres||[]).filter(o=>String(o?.client||"")===String(clientId||"")).forEach(o=>{
    const d=odata?.[o.id]||{};
    let foundNumber=false;
    if(d.pressupostRapidNumero){nums.push(String(d.pressupostRapidNumero));foundNumber=true;}
    (d.documents||[]).forEach(x=>{if(x?.docData?.type==="pressupostobra"&&x.docData.numeroPressupost){nums.push(String(x.docData.numeroPressupost));foundNumber=true;}});
    if(!foundNumber&&String(o.id)!==String(excludeObraId||"")&&(d.partides||[]).length)nums.push(`legacy:${o.id}`);
  });
  return [...new Set(nums.filter(Boolean))];
}
function nextClientBudgetNumber878194(client={},numbers=[],date=todayISO8743()){
  const year=String(date||new Date().getFullYear()).match(/\d{4}/)?.[0]||String(new Date().getFullYear());
  const code=clientBudgetCode878194(client);
  const escaped=code.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const rx=new RegExp(`^${year}-${escaped}-(\\d+)$`,"i");
  const max=(numbers||[]).reduce((m,n)=>Math.max(m,+(String(n).match(rx)?.[1]||0)),0);
  const seq=Math.max(max+1,new Set((numbers||[]).filter(Boolean)).size+1);
  return `${year}-${code}-${String(seq).padStart(3,"0")}`;
}
function descompostTotal878160(text){
  const raw=String(text||"").trim();
  if(!raw)return 0;
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  let totalLine=0;
  for(const line of lines){
    if(/\b(total|import|subtotal)\b/i.test(line)){
      const nums=line.match(/-?\d+(?:[\.,]\d+)?/g)||[];
      if(nums.length) totalLine=parseNum8770(nums[nums.length-1]);
    }
  }
  if(totalLine>0)return totalLine;
  let sum=0;
  lines.forEach(line=>{
    const nums=line.match(/-?\d+(?:[\.,]\d+)?/g)||[];
    if(nums.length){
      const n=parseNum8770(nums[nums.length-1]);
      if(Number.isFinite(n))sum+=n;
    }
  });
  return sum;
}
function readAllLibraries878160(){
  const out=[];
  try{
    Object.keys(localStorage).forEach(k=>{
      if(!k.includes("aco_partides_client_v87115_"))return;
      const rows=safeJsonParse8784(localStorage.getItem(k),[]);
      if(Array.isArray(rows)) rows.forEach(r=>out.push({...r,origenLlibreria:k}));
    });
  }catch{}
  return out;
}

// V87.196 · Llibreria central de partides.
// El codi intern identifica la partida dins l'app. El codi de pressupost es genera
// segons el capítol i no participa en la detecció de duplicats.
function libText87196(v){return String(v??"").trim().replace(/\s+/g," ")}
function libNormText87196(v){return libText87196(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function libChapterComparable87202(value=""){
  const withoutCode=libNormText87196(value).replace(/^(?:c\s*)?\d+(?:\s+\d+)*\s*/,"").trim();
  return withoutCode.split(/\s+/).filter(Boolean).map(token=>token.length>5?token.replace(/(?:es|s)$/i,""):token).join(" ");
}
function libParseNumberedChapter87205(value=""){
  const text=libText87196(value);
  const match=text.match(/^([A-Za-zÀ-ÿ]{0,4})\s*(\d{1,3})(?:(?:\s*[-–—:]\s*|\.\s+|\s+)(.*))?$/);
  if(!match)return null;
  return {original:text,prefix:String(match[1]||""),number:+match[2],width:Math.max(2,String(match[2]).length),title:libText87196(match[3]||"")};
}
function libFormatNumberedChapter87205(parsed,number,title=parsed?.title||""){
  const prefix=String(parsed?.prefix||"");
  const code=`${prefix}${String(number).padStart(Math.max(2,+parsed?.width||2),"0")}`;
  const cleanTitle=libText87196(title);
  return `${code}${cleanTitle?` ${cleanTitle}`:""}`;
}
function libLongDesc87196(row={}){
  const values=[row.desc,row.descripcio,row["descripció"],row.descripcion,row["descripción"],row.description,row.detall,row.text,row.observacions,row.notes].map(libText87196).filter(Boolean);
  return values.sort((a,b)=>b.length-a.length)[0]||"";
}
function libFingerprint87196(row={}){
  const concept=libNormText87196(row.concepte||row.resum||row.resumen||"Nova partida");
  const desc=libNormText87196(libLongDesc87196(row));
  const unit=libNormText87196(row.ut||"ut");
  return `${concept}__${desc}__${unit}`;
}
function libHash87196(text=""){
  let h=2166136261;
  for(let i=0;i<String(text).length;i++){h^=String(text).charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0).toString(36);
}
function libraryClientToken87196(v){return String(v||"general").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"_")}
function libCodeToken871200(value="",fallback="X",max=4){
  const token=String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"").slice(0,max);
  return token||fallback;
}
function libChapterInitials87199(value=""){
  const words=libNormText87196(value).replace(/^c?\s*\d+\s*/,"").split(" ").filter(Boolean).filter(w=>!["i","de","del","dels","la","les","el","els","amb","per","a"].includes(w));
  return libCodeToken871200(words.slice(0,3).map(w=>w[0]).join(""),"GEN",3);
}
function libConceptKeyword87199(value=""){
  const words=libNormText87196(value).split(" ").filter(Boolean).filter(w=>!["i","de","del","dels","la","les","el","els","amb","per","a","subministrament","treballs"].includes(w));
  return libCodeToken871200(words[0]||"PARTIDA","PART",4);
}
function assignLibraryInternalCodes87199(items=[]){
  const valid=/^([A-Z0-9]{1,4})_([A-Z0-9]{1,6})_(\d{3})$/;
  const used=new Set();
  const nextByBase=new Map();
  items.forEach(item=>{
    const match=libText87196(item.codiIntern).toUpperCase().match(valid);
    if(!match)return;
    used.add(match[0]);
    const base=`${match[1]}_${match[2]}`;
    nextByBase.set(base,Math.max(nextByBase.get(base)||1,(+match[3]||0)+1));
  });
  return items.map(item=>{
    const current=libText87196(item.codiIntern).toUpperCase();
    const match=current.match(valid);
    if(match)return {...item,codiIntern:match[0],codiPrefix:item.codiPrefix||match[1],codiParaula:item.codiParaula||match[2],codiSeq:+item.codiSeq||+match[3]};
    const prefix=libCodeToken871200(item.codiPrefix,libChapterInitials87199(item.cap),4);
    const keyword=libCodeToken871200(item.codiParaula,libConceptKeyword87199(item.concepte),6);
    const base=`${prefix}_${keyword}`;
    let seq=Math.max(1,+item.codiSeq||nextByBase.get(base)||1);
    while(used.has(`${base}_${String(seq).padStart(3,"0")}`))seq++;
    const code=`${base}_${String(seq).padStart(3,"0")}`;
    used.add(code);nextByBase.set(base,seq+1);
    return {...item,codiIntern:code,codiPrefix:prefix,codiParaula:keyword,codiSeq:seq};
  });
}
function libraryOrigin87199(item={}){
  return /hist[oò]ric|import|excel|migraci/i.test(String(item.tipus||item.origen||""))?"imported":"selected";
}
function collectLibraryCandidates871200(clients=[],obres=[],odata={},user=currentAppUser8779()){
  const raw=[];
  const marker="aco_partides_client_v87115_";
  try{
    const storageKeys=Object.keys(localStorage);
    const userPrefix=`${STORAGE_NS8782}__${String(user||"").toLowerCase()}__`;
    const hasUserLibraries=storageKeys.some(key=>key.startsWith(userPrefix)&&key.includes(marker));
    storageKeys.forEach(key=>{
      if(!key.includes(marker))return;
      const isUserKey=key.startsWith(userPrefix);
      const isLegacyHector=!hasUserLibraries&&String(user||"").toLowerCase()==="hector"&&!key.startsWith(`${STORAGE_NS8782}__`);
      if(!isUserKey&&!isLegacyHector)return;
      const parsed=safeJsonParse8784(localStorage.getItem(key),[]);
      if(!Array.isArray(parsed))return;
      const token=key.slice(key.indexOf(marker)+marker.length).split("__")[0];
      const owner=(clients||[]).find(c=>[c.id,c.nom,c.rao].some(v=>libraryClientToken87196(v)===token));
      parsed.forEach((row,index)=>raw.push({...row,_candidateSource:"legacy",_candidateClientId:owner?.id?String(owner.id):"",_candidateSourceName:`Antiga llibreria${owner?` · ${owner.nom||owner.rao}`:""}`,_candidateOrder:index}));
    });
  }catch{}
  (obres||[]).forEach(obra=>{
    const data=odata?.[obra.id]||{};
    (Array.isArray(data.partides)?data.partides:[]).forEach((row,index)=>raw.push({...row,_candidateSource:"budget",_candidateClientId:obra.client?String(obra.client):"",_candidateSourceName:`Pressupost · ${obra.nom||expedientCode8739(obra)}`,_candidateObraId:obra.id,_candidateOrder:index}));
  });
  const usable=raw.filter(row=>libText87196(row?.concepte||row?.resum||row?.resumen));
  const map=new Map();
  usable.forEach(row=>{
    const fingerprint=libFingerprint87196(row);
    const prev=map.get(fingerprint);
    const clientIds=row._candidateClientId?[String(row._candidateClientId)]:[];
    if(!prev){
      map.set(fingerprint,{...row,id:`candidate-${libHash87196(fingerprint)}`,candidateFingerprint:fingerprint,candidateSources:[row._candidateSource],candidateSourceNames:[row._candidateSourceName],candidateClientIds:clientIds,candidateOccurrences:1,desc:libLongDesc87196(row),pu:parseNum8770(row.pu)||0,cap:libText87196(row.cap||"General")||"General",ut:libText87196(row.ut||"ut")||"ut",concepte:libText87196(row.concepte||row.resum||row.resumen)});
      return;
    }
    map.set(fingerprint,{...prev,pu:parseNum8770(row.pu)||prev.pu||0,candidateOccurrences:prev.candidateOccurrences+1,candidateSources:[...new Set([...prev.candidateSources,row._candidateSource])],candidateSourceNames:[...new Set([...prev.candidateSourceNames,row._candidateSourceName])].slice(0,8),candidateClientIds:[...new Set([...prev.candidateClientIds,...clientIds])]});
  });
  return {rawCount:usable.length,legacyCount:usable.filter(x=>x._candidateSource==="legacy").length,budgetCount:usable.filter(x=>x._candidateSource==="budget").length,unique:[...map.values()]};
}
function dedupePartidaLibrary87196(rows=[]){
  const map=new Map();
  (Array.isArray(rows)?rows:[]).forEach((raw,idx)=>{
    if(!raw||!libText87196(raw.concepte||raw.resum||raw.resumen))return;
    const pu=parseNum8770(raw.pu)||0;
    const codiPressupost=libText87196(raw.codiPressupost||raw.codi||"");
    const updatedAt=raw.updatedAt||raw.modifiedAt||raw.createdAt||new Date().toISOString();
    const item={...raw,id:raw.id||`libp-${libHash87196(libFingerprint87196(raw))}`,codiIntern:libText87196(raw.codiIntern||raw.internalCode||""),codiPressupost,codi:codiPressupost,cap:libText87196(raw.cap||"General")||"General",ut:libText87196(raw.ut||"ut")||"ut",concepte:libText87196(raw.concepte||raw.resum||raw.resumen||"Nova partida"),desc:libLongDesc87196(raw),pu,global:true,clientIds:[...new Set((Array.isArray(raw.clientIds)?raw.clientIds:(raw.clientId?[raw.clientId]:[])).filter(Boolean).map(String))],priceHistory:Array.isArray(raw.priceHistory)?raw.priceHistory:[],createdAt:raw.createdAt||updatedAt,updatedAt};
    if(pu&&!item.priceHistory.some(x=>Math.abs((+x?.pu||0)-pu)<0.0001))item.priceHistory=[...item.priceHistory,{pu,data:String(updatedAt).slice(0,10),origen:raw.sourceObra||raw.origen||raw.tipus||"Llibreria"}];
    const key=libFingerprint87196(item);
    if(!map.has(key)){map.set(key,item);return;}
    const prev=map.get(key);
    const desc=item.desc.length>String(prev.desc||"").length?item.desc:prev.desc;
    const histories=[...(prev.priceHistory||[]),...(item.priceHistory||[])].filter((x,i,a)=>a.findIndex(y=>Math.abs((+y?.pu||0)-(+x?.pu||0))<0.0001&&String(y?.data||"")===String(x?.data||""))===i).slice(-20);
    map.set(key,{...prev,...item,id:prev.id||item.id,codiIntern:prev.codiIntern||item.codiIntern,codiPressupost:prev.codiPressupost||item.codiPressupost,codi:prev.codiPressupost||item.codiPressupost,desc,pu:item.pu||prev.pu||0,global:prev.global||item.global,clientIds:[...new Set([...(prev.clientIds||[]),...(item.clientIds||[])])],priceHistory:histories,createdAt:prev.createdAt||item.createdAt,updatedAt:item.updatedAt||prev.updatedAt});
  });
  const items=assignLibraryInternalCodes87199([...map.values()]);
  return items.sort((a,b)=>String(a.codiIntern).localeCompare(String(b.codiIntern),"ca",{numeric:true}));
}
function upsertPartidaLibrary87196(rows=[],patch={}){
  const current=Array.isArray(rows)?rows:[];
  const old=patch?.id?current.find(x=>String(x.id)===String(patch.id)):null;
  const rest=old?current.filter(x=>String(x.id)!==String(patch.id)):current;
  return dedupePartidaLibrary87196([...rest,{...(old||{}),...patch,updatedAt:new Date().toISOString()}]);
}
function migratePartidaLibrary87196(clients=[],user=currentAppUser8779()){
  const saved=lsJson8779("aco_partides_library_v87196",[],user);
  if(Array.isArray(saved)&&saved.length)return dedupePartidaLibrary87196(saved);
  const legacy=[];
  const marker="aco_partides_client_v87115_";
  try{
    Object.keys(localStorage).forEach(k=>{
      if(!k.includes(marker))return;
      const isUserKey=k.startsWith(`${STORAGE_NS8782}__${String(user||"").toLowerCase()}__`);
      const isLegacyHector=String(user||"").toLowerCase()==="hector"&&!k.startsWith(`${STORAGE_NS8782}__`);
      if(!isUserKey&&!isLegacyHector)return;
      const token=k.slice(k.indexOf(marker)+marker.length);
      const owner=(clients||[]).find(c=>[c.id,c.nom,c.rao].some(v=>libraryClientToken87196(v)===token));
      const parsed=safeJsonParse8784(localStorage.getItem(k),[]);
      (Array.isArray(parsed)?parsed:[]).forEach(r=>legacy.push({...r,id:undefined,codiIntern:"",clientIds:owner?.id?[String(owner.id)]:[],global:!owner,origen:"Migració llibreria anterior"}));
    });
  }catch{}
  return dedupePartidaLibrary87196(legacy);
}


function descompostTableTotal878174(table){
  const rows=Array.isArray(table?.rows)?table.rows:[];
  const final=rows.slice().reverse().find(r=>!r?.isSection && /preu\s*unitari\s*final|precio\s*unitario\s*final|preu\s*final|precio\s*final|total\s*final/i.test(String(r?.concepte||"")) && parseNum8770(r?.total)>0);
  if(final)return parseNum8770(final.total);
  const direct=rows.slice().reverse().find(r=>!r?.isSection && /total\s*descomposat|total\s*descompost|precio\s*unitario|preu\s*unitari/i.test(String(r?.concepte||"")) && parseNum8770(r?.total)>0);
  if(direct)return parseNum8770(direct.total);
  return rows.filter(r=>!r?.isSection && !/cost\s*directe|costos\s*indirectes|despeses\s*generals|benefici\s*industrial|preu\s*unitari\s*final|precio\s*unitario\s*final|total/i.test(String(r?.concepte||""))).reduce((sum,r)=>sum+(parseNum8770(r?.total)||((parseNum8770(r?.q)||0)*(parseNum8770(r?.pu)||0))),0);
}
function descompostTableToText878174(table){
  const rows=Array.isArray(table?.rows)?table.rows:[];
  const source=table?.source||"Descomposat";
  const lines=[`ORIGEN DESCOMPOSAT: ${source}`];
  rows.forEach(r=>{
    if(r?.isSection){lines.push(String(r.concepte||""));return;}
    const q=parseNum8770(r?.q), pu=parseNum8770(r?.pu), imp=parseNum8770(r?.total)||(q&&pu?q*pu:0);
    const parts=[String(r?.concepte||"").trim(),String(r?.ut||"").trim(),q?qty2(q):"",pu?money(pu):"",imp?money(imp):""].filter(Boolean);
    if(parts.length)lines.push(parts.join(" | "));
  });
  lines.push(`TOTAL DESCOMPOSAT: ${money(descompostTableTotal878174(table))}`);
  return lines.join("\n");
}
function descompostRowsToTable878174(rows=[],source="Excel descomposat"){
  const clean=v=>String(v??"").trim();
  const norm=v=>clean(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const all=(rows||[]).filter(r=>(r||[]).some(c=>clean(c)));
  if(!all.length)return {source,rows:[],total:0,title:""};
  let headerIndex=-1,map={};
  const aliases={
    concepte:["concepte","concepto","descripcio","descripcion","descripció","denominacio","denominacion","text","recurs"],
    ut:["unitat","unidad","ut","unit","u"],
    q:["rendiment","rendimiento","quantitat","cantidad","coeficient","coeficiente","q","consum","medicio","medicion"],
    pu:["preu/ut","preu ut","preu unitari","precio unitario","preu","precio","pu","cost unitari","coste unitario"],
    total:["preu total","precio total","import","importe","total","cost total","coste total"]
  };
  for(let i=0;i<Math.min(all.length,30);i++){
    const heads=(all[i]||[]).map(norm);
    const local={};
    Object.entries(aliases).forEach(([key,als])=>{
      const idx=heads.findIndex(h=>als.some(a=>h===a||h.includes(a)));
      if(idx>=0)local[key]=idx;
    });
    if(local.concepte>=0 && (local.ut>=0||local.q>=0||local.pu>=0||local.total>=0)){headerIndex=i;map=local;break;}
  }
  const title=headerIndex>0?clean((all[0]||[]).filter(c=>clean(c))[0]||""):"";
  const data=headerIndex>=0?all.slice(headerIndex+1):all;
  const parsed=[];
  data.forEach((r,idx)=>{
    const row=Array.isArray(r)?r:[];
    const textCells=row.map(clean).filter(Boolean);
    if(!textCells.length)return;
    const first=clean(row[map.concepte] ?? row[0]);
    const onlyText=textCells.length===1 && first;
    const q=parseNum8770(row[map.q]);
    const pu=parseNum8770(row[map.pu]);
    let total=parseNum8770(row[map.total]);
    if(!total && q && pu)total=q*pu;
    const ut=clean(row[map.ut]);
    const isUpper=first && first===first.toUpperCase() && first.length<80;
    const isSection=onlyText && (isUpper || /m[aà]\s*d['’]?obra|materials|recursos|maquin[aà]ria|altres|indirectes/i.test(first));
    if(isSection){parsed.push({id:`s-${idx}-${Date.now()}`,isSection:true,concepte:first,ut:"",q:"",pu:"",total:""});return;}
    let concepte=first || textCells[0] || "";
    if(headerIndex<0){
      const nums=row.map((v,i)=>({i,v:clean(v),n:parseNum8770(v)})).filter(x=>x.v&&x.n);
      const text=row.map((v,i)=>({i,v:clean(v)})).filter(x=>x.v&&!parseNum8770(x.v));
      concepte=text.map(x=>x.v).join(" ")||textCells.join(" ");
      if(nums.length>=3){parsed.push({id:`r-${idx}-${Date.now()}`,isSection:false,concepte,ut:"",q:qty2(nums[nums.length-3].n),pu:qty2(nums[nums.length-2].n),total:qty2(nums[nums.length-1].n)});return;}
    }
    if(!concepte)return;
    parsed.push({id:`r-${idx}-${Date.now()}`,isSection:false,concepte,ut:ut||"",q:q?qty2(q):"",pu:pu?qty2(pu):"",total:total?qty2(total):""});
  });
  const table={source,title,rows:parsed};
  return {...table,total:descompostTableTotal878174(table),lines:parsed.filter(r=>!r.isSection).length};
}

function descompostRowsToText878161(rows=[],source="Excel descomposat") {
  const clean=(v)=>String(v??"").trim();
  const normHead=(v)=>clean(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const all=(rows||[]).filter(r=>(r||[]).some(c=>clean(c)));
  if(!all.length)return {text:"",total:0,lines:0};
  let headerIndex=-1, map={};
  const aliases={
    codi:["codi","codigo","cod","code","partida"],
    tipus:["tipus","tipo","type","familia","naturalesa"],
    concepte:["concepte","concepto","descripcio","descripcion","resum","texto","denominacio","denominacion"],
    ut:["ut","unitat","unidad","unit","u"],
    q:["quantitat","cantidad","q","rendiment","rendimiento","coeficient","coeficiente","consum","medicio","medicion"],
    pu:["preu unitari","precio unitario","preu","precio","pu","unitari","unitario","cost unitari","coste unitario"],
    import:["import","importe","total","subtotal","cost","coste"]
  };
  for(let i=0;i<Math.min(all.length,25);i++){
    const heads=(all[i]||[]).map(normHead);
    const local={};
    Object.entries(aliases).forEach(([key,als])=>{
      const idx=heads.findIndex(h=>als.some(a=>h===a||h.includes(a)));
      if(idx>=0)local[key]=idx;
    });
    if(local.concepte>=0 && (local.q>=0||local.pu>=0||local.import>=0||local.ut>=0)){headerIndex=i;map=local;break;}
  }
  const data=headerIndex>=0?all.slice(headerIndex+1):all;
  const lines=[];
  let total=0;
  data.forEach((r,idx)=>{
    const row=Array.isArray(r)?r:[];
    const rowText=row.map(clean).filter(Boolean).join(" ");
    if(!rowText)return;
    if(/^(total|subtotal|import total|pressupost|presupuesto)$/i.test(rowText))return;
    const codi=clean(row[map.codi]);
    const tipus=clean(row[map.tipus]);
    let concepte=clean(row[map.concepte]);
    const ut=clean(row[map.ut]);
    let q=parseNum8770(row[map.q]);
    let pu=parseNum8770(row[map.pu]);
    let imp=parseNum8770(row[map.import]);
    if(headerIndex<0){
      const nums=row.map((v,i)=>({i,v:clean(v),n:parseNum8770(v)})).filter(x=>x.v&&x.n);
      const textCells=row.map((v,i)=>({i,v:clean(v)})).filter(x=>x.v && !parseNum8770(x.v));
      concepte=textCells.map(x=>x.v).join(" ").slice(0,180) || rowText;
      if(nums.length>=3){q=nums[nums.length-3].n;pu=nums[nums.length-2].n;imp=nums[nums.length-1].n;}
      else if(nums.length>=2){q=nums[nums.length-2].n;pu=nums[nums.length-1].n;imp=q*pu;}
      else if(nums.length===1){imp=nums[0].n;}
    }
    if(!imp && q && pu)imp=q*pu;
    if(!pu && q && imp)pu=imp/q;
    if(!concepte && !codi)return;
    if(!imp && !q && !pu && /^(capitol|capitulo|partida|codi|codigo|descripcio|descripcion)/i.test(rowText))return;
    total+=imp||0;
    const prefix=[codi,tipus].filter(Boolean).join(" · ");
    const calc=(q||pu||imp)?`${q?qty2(q):""}${ut?` ${ut}`:""}${pu?` × ${money(pu)}`:""}${imp?` = ${money(imp)}`:""}`:"";
    lines.push(`${prefix?prefix+" | ":""}${concepte}${calc?" | "+calc:""}`);
  });
  if(!lines.length)return {text:"",total:0,lines:0};
  const body=[`ORIGEN DESCOMPOSAT: ${source}`,...lines,`TOTAL DESCOMPOSAT: ${money(total)}`].join("\n");
  return {text:body,total,lines:lines.length};
}
function workbookDescompostFromFile878161(file){
  return file.arrayBuffer().then(ab=>{
    const wb=XLSX.read(ab,{type:"array",cellDates:false});
    let best={text:"",total:0,lines:0,sheet:""};
    wb.SheetNames.forEach(sheetName=>{
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      const table=descompostRowsToTable878174(rows,`${file.name} · ${sheetName}`);
      const parsed=descompostRowsToText878161(rows,`${file.name} · ${sheetName}`);
      const merged={...parsed,table,total:table.total||parsed.total||0,lines:table.lines||parsed.lines||0,text:(table.rows&&table.rows.length?descompostTableToText878174(table):parsed.text)};
      const sn=String(sheetName||"").toLowerCase();
      const score=(merged.lines||0)*10+(merged.total?5:0)+(sn.includes("descomp")||sn.includes("bedec")||sn.includes("tcq")?250:0)-(sn.includes("pressupost")?150:0);
      if(score>((best.score)||-999999))best={...merged,sheet:sheetName,score};
    });
    if(!best.text)throw new Error("No he trobat un descomposat vàlid. L'Excel ha de tenir concepte/descripció i imports, o columnes tipus quantitat, preu unitari i import.");
    return best;
  });
}

function normCode878176(v){return String(v||"").trim().toLowerCase().replace(/[^0-9a-z]+/g,".").replace(/^\.+|\.+$/g,"")}
function canonCode878177(v){
  const raw=normCode878176(v);
  if(!raw)return "";
  return raw.split(".").map(x=>/^\d+$/.test(x)?String(parseInt(x,10)):x).join(".");
}
function codeMatches878177(a,b){
  const na=normCode878176(a), nb=normCode878176(b), ca=canonCode878177(a), cb=canonCode878177(b);
  if(!na||!nb)return false;
  return na===nb || ca===cb || na.endsWith("."+nb) || nb.endsWith("."+na) || ca.endsWith("."+cb) || cb.endsWith("."+ca);
}
function normText878176(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function findDescompostTargetCode878176(sheetName,rows=[]){
  const candidates=[];
  const add=(v)=>{
    const str=String(v||"");
    const m=str.match(/(?:^|[^0-9A-Za-z])(\d{1,2}[\._-]\d{1,3})(?=$|[^0-9A-Za-z])/);
    if(m)candidates.push(m[1].replace(/[\._-]/g,"."));
  };
  add(sheetName);
  (rows||[]).slice(0,18).forEach(r=>(r||[]).forEach(add));
  return candidates[0]||"";
}
function findDescompostTitle878176(sheetName,rows=[]){
  const clean=v=>String(v||"").trim();
  const first=(rows||[]).slice(0,12).flat().map(clean).find(v=>v && !/^\d+(?:[\.,]\d+)?$/.test(v) && !/concepte|concepto|unitat|unidad|preu|precio|import|rendiment/i.test(v));
  return first||String(sheetName||"");
}
function workbookDescompostsMassius878176(file){
  return file.arrayBuffer().then(ab=>{
    const wb=XLSX.read(ab,{type:"array",cellDates:false});
    const items=[];
    wb.SheetNames.forEach(sheetName=>{
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      const table=descompostRowsToTable878174(rows,`${file.name} · ${sheetName}`);
      const parsed=descompostRowsToText878161(rows,`${file.name} · ${sheetName}`);
      const merged={...parsed,table,total:table.total||parsed.total||0,lines:table.lines||parsed.lines||0,text:(table.rows&&table.rows.length?descompostTableToText878174(table):parsed.text)};
      if(!merged.lines && !merged.total)return;
      items.push({sheet:sheetName,code:findDescompostTargetCode878176(sheetName,rows),title:findDescompostTitle878176(sheetName,rows),...merged});
    });
    if(!items.length)throw new Error("No he trobat cap full de descomposat vàlid. Recomanat: un full per partida, amb el codi de partida al nom del full o a les primeres files.");
    return items;
  });
}
function normalizeBudgetCaps878176(caps={}){
  const out={};
  Object.entries(caps||{}).forEach(([cap,items])=>{
    out[cap]=(items||[]).map(r=>({...r,q:qty2(parseNum8770(r.q)||0),pu:qty2(parseNum8770(r.pu)||0)}));
  });
  return out;
}
function cloneJson878176(v){try{return JSON.parse(JSON.stringify(v||{}))}catch{return v}}
function excelSheetName878180(name,used=new Set()){
  let base=String(name||"FULL").replace(/[\\/?*\[\]:]/g," ").replace(/\s+/g," ").trim().slice(0,31)||"FULL";
  let out=base, n=1;
  while(used.has(out.toLowerCase())){
    const suffix=` ${++n}`;
    out=(base.slice(0,31-suffix.length)+suffix).trim();
  }
  used.add(out.toLowerCase());
  return out;
}
function exportBudgetDocExcel878180(doc={},filePrefix="pressupost"){
  const rows=Array.isArray(doc.rows)?doc.rows:[];
  const used=new Set();
  const wb=XLSX.utils.book_new();
  const meta=[
    ["PRESSUPOST D’OBRA"],
    ["Número",doc.numeroPressupost||""],
    ["Referència",doc.referencia||""],
    ["Versió",doc.versioPressupost||""],
    ["Data",doc.dataPressupost||doc.data||""],
    ["Adreça obra",doc.obraAdreca||""],
    ["Client / promotor",doc.tercerNom||""],
    ["NIF/CIF",doc.tercerNif||""],
    ["Adreça / contacte",doc.tercerAdreca||""],
    ["Email",doc.tercerEmail||""],
    ["Client emissor",doc.realitzadorPressupost||""],
    ["Client",doc.clientFinalPressupost||doc.tercerNom||""],
    [],
    ["CODI","CAPÍTOL","CONCEPTE","DESCRIPCIÓ","UNITAT","AMIDAMENT","PREU/UT","PREU TOTAL","DESCOMPOST","PREU DESCOMPOST VALIDAT","ORIGEN DESCOMPOST"]
  ];
  const data=rows.map(r=>{
    const q=parseNum8770(r.q)||0, pu=parseNum8770(r.pu)||0;
    const det=descompostTableTotal878174(r.descompostTable)||descompostTotal878160(r.descompost||"");
    return [r.codi||"",r.cap||"",r.concepte||"",r.desc||"",r.ut||"",q,pu,q*pu,(r.descompostTable?.rows?.length||r.descompost)?"Sí":"",parseNum8770(r.descompostValidatedPu)||det||"",[r.descompostSource,r.descompostSheet].filter(Boolean).join(" · ")];
  });
  const totals=[[],["","","","","","","TOTAL PRESSUPOST",rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0)]];
  const notes=[[],["OBSERVACIONS",doc.observacions||""],["FORMA DE PAGAMENT",doc.formaPagament||""]];
  const ws=XLSX.utils.aoa_to_sheet([...meta,...data,...totals,...notes]);
  ws["!cols"]=[{wch:12},{wch:28},{wch:42},{wch:48},{wch:10},{wch:12},{wch:12},{wch:14},{wch:12},{wch:18},{wch:28}];
  XLSX.utils.book_append_sheet(wb,ws,excelSheetName878180("PRESSUPOST",used));
  const amidaments=[["PARTIDA","CAPÍTOL","CONCEPTE","LÍNIA DE MEDICIÓ","UNITATS","LLARGADA","AMPLADA","ALÇADA","TOTAL LÍNIA"]];
  rows.forEach(r=>(r.pressupostMesures||[]).forEach(l=>amidaments.push([r.codi||"",r.cap||"",r.concepte||"",l.concepte||"",parseNum8770(l.unitats)||0,parseNum8770(l.llargada)||"",parseNum8770(l.amplada)||"",parseNum8770(l.alcada)||"",medicioCalc8780(l,r.ut)])));
  if(amidaments.length>1){const wa=XLSX.utils.aoa_to_sheet(amidaments);wa["!cols"]=[{wch:12},{wch:28},{wch:38},{wch:38},{wch:12},{wch:12},{wch:12},{wch:12},{wch:14}];XLSX.utils.book_append_sheet(wb,wa,excelSheetName878180("AMIDAMENTS",used));}
  const resum=[["CODI","CAPÍTOL","CONCEPTE","PREU ACTUAL","PREU DESCOMPOST","VALIDAT","ORIGEN"]];
  rows.filter(r=>r.descompostTable?.rows?.length||r.descompost).forEach(r=>{
    const det=descompostTableTotal878174(r.descompostTable)||descompostTotal878160(r.descompost||"");
    resum.push([r.codi||"",r.cap||"",r.concepte||"",parseNum8770(r.pu)||0,parseNum8770(r.descompostValidatedPu)||det||0,r.puFromDescompost?"Sí":"Pendent",[r.descompostSource,r.descompostSheet].filter(Boolean).join(" · ")]);
  });
  const wr=XLSX.utils.aoa_to_sheet(resum);
  wr["!cols"]=[{wch:12},{wch:28},{wch:42},{wch:14},{wch:16},{wch:12},{wch:32}];
  XLSX.utils.book_append_sheet(wb,wr,excelSheetName878180("RESUM_DESCOMPOSTOS",used));
  rows.forEach(r=>{
    const hasTable=Array.isArray(r.descompostTable?.rows)&&r.descompostTable.rows.length;
    const hasText=String(r.descompost||"").trim();
    if(!hasTable&&!hasText)return;
    const sheetRows=[];
    sheetRows.push(["Partida",r.codi||"",r.concepte||""]);
    sheetRows.push(["Capítol",r.cap||""]);
    sheetRows.push(["Origen",[r.descompostSource,r.descompostSheet].filter(Boolean).join(" · ")]);
    sheetRows.push([]);
    sheetRows.push(["Concepte","Unitat","Rendiment","Preu/Ut","Preu Total"]);
    if(hasTable){
      r.descompostTable.rows.forEach(tr=>{
        if(tr?.isSection) sheetRows.push([String(tr.concepte||"").toUpperCase(),"","","",""]);
        else sheetRows.push([tr?.concepte||"",tr?.ut||"",parseNum8770(tr?.q)||"",parseNum8770(tr?.pu)||"",parseNum8770(tr?.total)||""]);
      });
    }else{
      String(r.descompost||"").split(/\r?\n/).forEach(line=>{if(line.trim())sheetRows.push([line.trim(),"","","",""])});
    }
    const det=descompostTableTotal878174(r.descompostTable)||descompostTotal878160(r.descompost||"");
    sheetRows.push([],["PREU UNITARI FINAL","","","",det||""]);
    const wsd=XLSX.utils.aoa_to_sheet(sheetRows);
    wsd["!cols"]=[{wch:52},{wch:12},{wch:14},{wch:14},{wch:14}];
    XLSX.utils.book_append_sheet(wb,wsd,excelSheetName878180(`${r.codi||"PARTIDA"} ${String(r.concepte||"").slice(0,18)}`,used));
  });
  const base=String(filePrefix||doc.numeroPressupost||"pressupost").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"")||"pressupost";
  XLSX.writeFile(wb,`${base}.xlsx`);
}

function pct(n){return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0)+"%"}
function group(arr,k){return arr.reduce((m,x)=>((m[x[k]]??=[]).push(x),m),{})}

function capOrder878132(name){const m=String(name||"").match(/(\d+)/);return m?Number(m[1]):9999}
function compareCodi878132(a,b){return String(a||"").localeCompare(String(b||""),"ca",{numeric:true,sensitivity:"base"})}
function sortPartides878132(rows=[]){return [...(rows||[])].sort((a,b)=>capOrder878132(a?.cap)-capOrder878132(b?.cap)||String(a?.cap||"").localeCompare(String(b?.cap||""),"ca",{numeric:true,sensitivity:"base"})||compareCodi878132(a?.codi,b?.codi)||String(a?.concepte||"").localeCompare(String(b?.concepte||""),"ca",{numeric:true,sensitivity:"base"}))}
function groupSorted878132(rows=[],k="cap"){return sortPartides878132(rows).reduce((m,x)=>((m[x[k]||"Sense capítol"]??=[]).push(x),m),{})}
function isCertHidden878132(r,n){return !!((r?.certHiddenByNum||{})[String(n)])}
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
  "Elaboració de pressupost per client",
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

// V87.121 · plantilles d'encàrrec editables.
// Quan es canvia la tipologia de feina, l'app pot omplir una definició base
// i una orientació de direcció/seguiment, però l'usuari sempre ho pot acabar d'editar.
const WORK_TYPE_TEMPLATES878121={
  "Projecte / llicència d’obres":{
    subtitol:"Projecte tècnic i tramitació de llicència d’obres",
    definicioFeina:"Redacció de projecte tècnic, justificació normativa, documentació gràfica i suport a la tramitació municipal de l’expedient.",
    direccioObraText:"Direcció tècnica de l’obra pendent de concretar segons abast, llicència i agents intervinents. Revisar adreça, municipi, referència cadastral i condicionants urbanístics."
  },
  "Pressupost d’obra / amidaments":{
    subtitol:"Amidaments i pressupost d’obra",
    definicioFeina:"Preparació d’amidaments, estructuració de capítols, valoració de partides, revisió de preus i emissió de pressupost d’obra.",
    direccioObraText:"No implica direcció d’obra per defecte. Es podrà activar seguiment o gestió d’obra si l’encàrrec ho requereix."
  },
  "Elaboració de pressupost per client":{
    subtitol:"Elaboració de pressupost per client",
    definicioFeina:"Encàrrec per preparar un pressupost d’obra per al client: revisió de documentació, amidaments, recerca de partides, preus, possibles variants i emissió del pressupost final.",
    direccioObraText:"No implica direcció ni gestió d’obra. Si el client accepta i posteriorment s’encarrega la direcció, seguiment o project management, l’expedient es podrà reobrir i canviar de tipus sense perdre l’històric."
  },
  "Direcció / seguiment d’obra":{
    subtitol:"Direcció i seguiment tècnic d’obra",
    definicioFeina:"Seguiment de l’execució, visites d’obra, actes, comprovació de treballs, incidències, coordinació amb agents i control documental bàsic.",
    direccioObraText:"Direcció/seguiment de l’obra a l’adreça indicada, amb visites segons necessitat i registre d’actes, fotos i acords."
  },
  "Gestió integral d’obra":{
    subtitol:"Gestió integral d’obra i control econòmic",
    definicioFeina:"Gestió global de l’obra: pressupost, comparatius, industrials, calendari, actes, certificacions, factures, incidències i tancament.",
    direccioObraText:"Coordinació operativa de l’obra completa a l’adreça indicada, amb seguiment tècnic, econòmic i documental."
  },
  "Certificat energètic":{
    subtitol:"Certificat d’eficiència energètica",
    definicioFeina:"Presa de dades, modelatge energètic, emissió del certificat energètic i tramitació del registre corresponent.",
    direccioObraText:"No hi ha direcció d’obra. Cal verificar adreça, ús, superfície, instal·lacions i documentació disponible."
  },
  "Cèdula d’habitabilitat":{
    subtitol:"Cèdula d’habitabilitat",
    definicioFeina:"Comprovació de condicions d’habitabilitat, presa de dades, preparació de documentació i tramitació de la cèdula.",
    direccioObraText:"No hi ha direcció d’obra. Cal comprovar adreça, superfície útil, peces, alçades, ventilació i estat real de l’habitatge."
  },
  "ITE / IEE / inspecció d’edifici":{
    subtitol:"Inspecció tècnica de l’edifici",
    definicioFeina:"Inspecció de l’edifici, presa de dades, identificació de deficiències, reportatge fotogràfic i redacció de l’informe tècnic.",
    direccioObraText:"No implica direcció d’obra inicial. Si es deriven reparacions, es podrà activar seguiment o gestió d’obra."
  },
  "Informe tècnic / patologies / peritatge":{
    subtitol:"Informe tècnic i anàlisi de patologies",
    definicioFeina:"Visita tècnica, anàlisi de l’estat existent, diagnosi, conclusions i redacció d’informe tècnic o pericial segons encàrrec.",
    direccioObraText:"No hi ha direcció d’obra per defecte. Si l’informe deriva en actuacions, es podrà crear pressupost o seguiment posterior."
  },
  "Plànols / aixecament":{
    subtitol:"Aixecament, plànols i documentació gràfica",
    definicioFeina:"Presa de mides, aixecament de l’estat actual, preparació de plànols i documentació gràfica en el format acordat.",
    direccioObraText:"No hi ha direcció d’obra. Cal concretar abast de plànols, format, escala i ús de la documentació."
  },
  "Render / 3D / visualització":{
    subtitol:"Visualització arquitectònica i renders",
    definicioFeina:"Preparació de model 3D, escenes, materials, il·luminació i imatges/renderitzats segons l’abast acordat.",
    direccioObraText:"No hi ha direcció d’obra. Cal concretar plànols base, estil visual, materials, punts de vista i lliurables."
  },
  "Seguretat i salut":{
    subtitol:"Seguretat i salut d’obra",
    definicioFeina:"Preparació o seguiment de documentació de seguretat i salut, coordinació preventiva i control d’incidències segons encàrrec.",
    direccioObraText:"Coordinació de seguretat i salut vinculada a l’obra indicada, amb registre de visites/incidències quan correspongui."
  },
  "Tràmit municipal / llicència / comunicació":{
    subtitol:"Tramitació municipal i documentació administrativa",
    definicioFeina:"Preparació, revisió i presentació de documentació per tràmit municipal, comunicació prèvia, llicència o requeriments.",
    direccioObraText:"No implica direcció d’obra per defecte. Cal revisar adreça, municipi, normativa i documents exigits per l’ajuntament."
  },
  "Control econòmic d’obra":{
    subtitol:"Control econòmic d’obra",
    definicioFeina:"Seguiment econòmic del pressupost, certificacions, factures, desviacions, comparatius i estat de cobrament/pagament de l’obra.",
    direccioObraText:"Control econòmic vinculat a l’obra indicada, sense assumir direcció tècnica si no queda expressament definit."
  },
  "Activitat / adequació de local":{
    subtitol:"Activitat, adequació de local i tramitació",
    definicioFeina:"Anàlisi de l’activitat, adequació del local, documentació tècnica i tramitació municipal segons normativa aplicable.",
    direccioObraText:"Direcció o seguiment de l’adequació només si l’encàrrec ho inclou. Revisar adreça, ús, superfícies i condicionants del local."
  },
  "Postobra / documentació final":{
    subtitol:"Documentació final i tancament d’obra",
    definicioFeina:"Recopilació, revisió i preparació de documentació final, certificats, garanties, as-built i arxiu de tancament.",
    direccioObraText:"Tancament documental de l’obra indicada. Revisar documentació pendent, certificats finals i lliurament al client."
  },
  "Altres":{
    subtitol:"Treball tècnic pendent de concretar",
    definicioFeina:"Encàrrec tècnic pendent de definir. Cal concretar abast, documentació necessària, lliurables i termini.",
    direccioObraText:"Direcció o seguiment pendent de concretar segons la naturalesa de l’encàrrec."
  }
};
function workTypeTemplate878121(v){return WORK_TYPE_TEMPLATES878121[canonicalWorkType8740(v)]||WORK_TYPE_TEMPLATES878121["Altres"]}

// V87.151 · configuració de formulari progressiu segons el tipus d'encàrrec.
const SIMPLE_WORK_TYPES878151=new Set([
  "Pressupost d’obra / amidaments",
  "Elaboració de pressupost per client",
  "Certificat energètic",
  "Cèdula d’habitabilitat",
  "ITE / IEE / inspecció d’edifici",
  "Informe tècnic / patologies / peritatge",
  "Plànols / aixecament",
  "Render / 3D / visualització",
  "Tràmit municipal / llicència / comunicació",
  "Control econòmic d’obra",
  "Postobra / documentació final"
]);
function isSimpleWorkType878151(t){return SIMPLE_WORK_TYPES878151.has(canonicalWorkType8740(t));}
function workNeedsAgentsByDefault878151(t){
  const c=canonicalWorkType8740(t);
  return ["Projecte / llicència d’obres","Direcció / seguiment d’obra","Gestió integral d’obra","Seguretat i salut","Activitat / adequació de local"].includes(c);
}
function workQuickHelp878151(t){
  const c=canonicalWorkType8740(t);
  if(c==="Pressupost d’obra / amidaments")return "Flux curt: client, nom, paraula clau i dades bàsiques. Agents, direcció i obra es poden afegir més tard si el pressupost acaba en encàrrec d’obra.";
  if(c==="Elaboració de pressupost per client")return "Flux curt per preparar un pressupost per encàrrec d’un client. No demana constructor ni direcció d’obra per defecte.";
  if(workNeedsAgentsByDefault878151(c))return "Flux d’obra: permet definir agents, direcció, constructor i dades tècniques des de l’inici.";
  return "Flux tècnic simplificat. Pots crear l’expedient amb les dades essencials i ampliar-lo després.";
}

// V87.150 · normalització segura de tipus seleccionat.
// Evita que un encàrrec triat al desplegable (especialment Pressupost d'obra / amidaments)
// torni erròniament a Seguretat i salut per textos de plantilles o camps antics.
function selectedWorkType878150(v){
  const raw=String(v||"").trim();
  if(WORK_TYPES8737.includes(raw)) return raw;
  const n=codeClean8739(raw);
  const exact=(WORK_TYPES8737||[]).find(t=>codeClean8739(t)===n);
  if(exact) return exact;
  // Prioritat absoluta als fluxos de pressupost: mai poden caure a Seguretat i salut
  // per paraules antigues de plantilles, descripcions o camps ocults.
  if(n.includes("PRESSUPOST") && (n.includes("AMIDAMENT")||n.includes("OBRA"))) return "Pressupost d’obra / amidaments";
  if((n.includes("ELABORACIO")||n.includes("REDACCIO")||n.includes("FER ")) && n.includes("PRESSUPOST")) return "Elaboració de pressupost per client";
  if(n.includes("PRESSUPOST CLIENT")||n.includes("PRESSUPOST PER CLIENT")) return "Elaboració de pressupost per client";
  return canonicalWorkType8740(raw);
}
function isDefaultWorkText878121(value,field){
  const v=String(value||"").trim();
  if(!v||["Treball pendent de definir","Pendent","Nou expedient"].includes(v))return true;
  return Object.values(WORK_TYPE_TEMPLATES878121).some(t=>String(t?.[field]||"").trim()===v);
}
function applyWorkTemplate878121(obj={},tipus,force=false){
  const t=canonicalWorkType8740(tipus||obj.tipusTreball||obj.tipologia||"Altres");
  const tpl=workTypeTemplate878121(t);
  const out={...obj,tipusTreball:t,tipologia:t};
  if(force||isDefaultWorkText878121(out.subtitol,"subtitol")) out.subtitol=tpl.subtitol;
  if(force||isDefaultWorkText878121(out.definicioFeina,"definicioFeina")) out.definicioFeina=tpl.definicioFeina;
  if(force||isDefaultWorkText878121(out.direccioObraText,"direccioObraText")) out.direccioObraText=tpl.direccioObraText;
  return out;
}
function canonicalWorkType8740(v){
  const raw=String(v||"").trim();
  const n=codeClean8739(raw);
  if(!n)return "Altres";
  const exact=(WORK_TYPES8737||[]).find(t=>codeClean8739(t)===n);
  if(exact)return exact;
  // Primer pressupostos, després la resta. Evita que un text antic de S+S condicioni el tipus.
  if((n.includes("ELABORACIO")||n.includes("REDACCIO")||n.includes("FER "))&&n.includes("PRESSUPOST"))return "Elaboració de pressupost per client";
  if(n.includes("PRESSUPOST CLIENT")||n.includes("PRESSUPOST PER CLIENT"))return "Elaboració de pressupost per client";
  if(n.includes("PRESSUPOST")||n.includes("AMIDAMENT"))return "Pressupost d’obra / amidaments";
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
  if((n.includes("ELABORACIO")||n.includes("REDACCIO")||n.includes("FER "))&&n.includes("PRESSUPOST"))return "Elaboració de pressupost per client";
  if(n.includes("PRESSUPOST CLIENT")||n.includes("PRESSUPOST PER CLIENT"))return "Elaboració de pressupost per client";
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
  "Pressupost d’obra / amidaments":["Resum","Dades","Documents","Pressupost ràpid","Agenda / Avisos","Gestió obra","Tasques","Gestió temps","Tancament / Entrega"],
  "Elaboració de pressupost per client":["Resum","Dades","Documents","Pressupost ràpid","Agenda / Avisos","Gestió obra","Tasques","Gestió temps","Tancament / Entrega"],
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
  const hasBudgetTrail878193=(data?.partides||[]).length||(data?.pressupostos||[]).length||(data?.documents||[]).some(d=>d?.docData?.type==="pressupostobra"||/pressupost ràpid|pressupost obra/i.test(String(d?.origen||"")));
  // Si l'encàrrec creix de pressupost a direcció/gestió integral, el pressupost original
  // continua accessible i no es perd cap dada ni cap eina de l'etapa inicial.
  if(hasBudgetTrail878193&&!tabs.includes("Pressupost ràpid")){
    const idx=Math.max(1,tabs.indexOf("Documents")+1);
    tabs.splice(idx,0,"Pressupost ràpid");
  }
  if((data?.actes||[]).length&&!tabs.includes("Actes")) tabs.splice(Math.min(5,tabs.length),0,"Actes");
  // V87.120: la gestió econòmica d'obra ha de ser disponible en qualsevol expedient,
  // encara que la feina principal no sigui una gestió integral. Això permet crear/importar
  // un pressupost d'obra quan calgui, en lloc de deixar-lo només com a PDF a Documents.
  if(!tabs.includes("Gestió obra")) tabs.splice(Math.max(tabs.length-3,1),0,"Gestió obra");
  if(!tabs.includes("Agents")){const idx=Math.max(1,tabs.indexOf("Dades")+1);tabs.splice(idx,0,"Agents");}
  if(!tabs.includes("Agenda / Avisos")){const idx=Math.max(1,(tabs.includes("Agents")?tabs.indexOf("Agents"):tabs.indexOf("Dades"))+1);tabs.splice(idx,0,"Agenda / Avisos");}
  if(!tabs.includes("Honoraris")){const idx=Math.max(1,tabs.indexOf("Agenda / Avisos")+1);tabs.splice(idx,0,"Honoraris");}
  if(!tabs.includes("Rendiment")){const idx=Math.max(1,tabs.indexOf("Honoraris")+1);tabs.splice(idx,0,"Rendiment");}
  return uniqueTabs8769(tabs);
}
function isFacturaDoc878120(x){return !!x&&(String(x?.id||"").startsWith("ft-")||String(x?.tipus||"").toLowerCase().includes("factura")||x?.pressupostId||Object.prototype.hasOwnProperty.call(x,"retencio")||Object.prototype.hasOwnProperty.call(x,"descompte")||Object.prototype.hasOwnProperty.call(x,"dataCobrament"))}
function totalIva8743(x){return isFacturaDoc878120(x)?invoiceTotal8746(x):(+x?.base||+x?.total||0)*(1+(+x?.iva||21)/100)}
function baseIva8743(x){return (+x?.base||+x?.total||0)}
function totalFactura878120(x){return invoiceTotal8746(x||{})}
function timeRowsForObra878120(obraId,data={}){
  let stored=[];
  try{stored=JSON.parse(localStorage.getItem(lsKey8779(`aco_honoraris_rows_${obraId||"default"}`))||"[]")}catch(e){stored=[]}
  const validStored=(Array.isArray(stored)?stored:[]).filter(r=>r&&(!r.obraId||String(r.obraId)===String(obraId))&&String(r.id||'').startsWith('hr-'));
  // V87.142: el rendiment ha de coincidir amb la pestanya Gestió temps.
  // No fem fallback a dades antigues `data.hores` perquè podien venir de proves/versions antigues
  // i feien aparèixer hores fantasma, com 3h en expedients sense registres visibles.
  return validStored;
}
function timeImport878120(r){const n=v=>Number(String(v??0).replace(",","."))||0;if(r?.tipusRegistre==="Kilometratge")return n(r.km)*n(r.preuKm);if(r?.tipusRegistre&&r.tipusRegistre!=="Honoraris")return n(r.quantitat)*n(r.preuUnitari);return n(r.hores)*(n(r.preuHora)||n(r.preu)||0)}
function timeHours878120(r){const n=v=>Number(String(v??0).replace(",","."))||0;return n(r?.hores)}
function honorMetrics878120(data={},obra={}){
  const pressupostos=data.pressupostosTecnic||[];
  const factures=uniqueFactures8743(data.facturesTecnic||[]);
  const timeRows=timeRowsForObra878120(obra?.id,data);
  const pressupostat=pressupostos.reduce((s,p)=>s+baseIva8743(p),0);
  const pressupostatIva=pressupostos.reduce((s,p)=>s+totalIva8743(p),0);
  const facturatBase=factures.reduce((s,f)=>s+baseIva8743(f),0);
  const facturatTotal=factures.reduce((s,f)=>s+totalFactura878120(f),0);
  const cobratTotal=factures.filter(f=>statusKeyFactura8776(f.estat)==="cobrades"||f.dataCobrament).reduce((s,f)=>s+totalFactura878120(f),0);
  const tempsCost=timeRows.reduce((s,r)=>s+timeImport878120(r),0);
  const hores=timeRows.reduce((s,r)=>s+timeHours878120(r),0);
  const pendent=facturatTotal-cobratTotal;
  const marge=facturatBase-tempsCost;
  const rendimentHora=hores?facturatBase/hores:0;
  const cobertura=pressupostat?facturatBase/pressupostat*100:0;
  return {pressupostos,factures,timeRows,pressupostat,pressupostatIva,facturatBase,facturatTotal,cobratTotal,pendent,tempsCost,hores,marge,rendimentHora,cobertura};
}
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
function quotePrintHtml8745(type,doc,obra){
  const isFactura=type==="factura", title=isFactura?"FACTURA / PROFORMA":"PRESSUPOST";
  const base=baseIva8743(doc), iva=isFactura?invoiceIvaAmount8746(doc):ivaAmount8743(doc), total=isFactura?invoiceTotal8746(doc):base;
  const desc=descompteAmount8746(doc), ret=invoiceRetencioAmount8746(doc);
  let cfg={};try{cfg=JSON.parse(lsGet8779("aco_config_v60")||"{}")}catch(e){}
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const totals=isFactura?`<div class="totals"><div><span>Base imposable</span><b>${esc(money(base))}</b></div>${desc?`<div><span>Descompte (${esc(doc.descompte)}%)</span><b>-${esc(money(desc))}</b></div>`:""}<div><span>IVA (${esc(doc.iva||21)}%)</span><b>${esc(money(iva))}</b></div>${ret?`<div><span>Retenció (${esc(doc.retencio)}%)</span><b>-${esc(money(ret))}</b></div>`:""}<div class="total"><span>Total</span><b>${esc(money(total))}</b></div></div>`:`<div class="notes"><b>Observacions</b><p>${esc(doc.observacions||pressupostFooter8746(doc))}</p></div>`;
  const foot=isFactura?`<div class="foot">${esc(doc.observacions||doc.compteBancari||cfg.compteBancari||"Forma de pagament i número de compte pendent d’indicar.")}</div>`:`<div class="foot">Document provisional pendent d’adaptar a dades fiscals definitives del tècnic/despatx.</div>`;
  const rightHead=isFactura?"Import":"Import sense IVA";
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} ${esc(doc.numero||"")}</title><style>@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:12px;margin:0;background:#fff}.top{display:flex;justify-content:space-between;border-bottom:2px solid #111827;padding-bottom:10px;margin-bottom:14px}h1{margin:0;font-size:24px}.parties{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-bottom:12px}.box{border:1px solid #cbd5e1;border-radius:6px;padding:9px;min-height:30mm}.box h3{margin:0 0 6px;font-size:11px;color:#64748b;text-transform:uppercase}.box b,.box span{display:block;margin-top:3px}.exp{border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;padding:9px;margin-bottom:12px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #cbd5e1;padding:8px;vertical-align:top}th{background:#f1f5f9;text-align:left}.c1{width:78%}.c2{width:22%}.num{text-align:right;white-space:nowrap}p{white-space:pre-wrap;line-height:1.45;color:#334155}.totals{width:82mm;margin-left:auto;margin-top:16px}.totals div{display:flex;justify-content:space-between;border-bottom:1px solid #e5e7eb;padding:6px 0}.totals .total{border-top:2px solid #111827;border-bottom:0;font-size:18px;margin-top:5px;padding-top:10px}.notes{margin-top:18px;border-top:1px solid #e5e7eb;padding-top:10px}.foot{margin-top:24px;border-top:1px solid #e5e7eb;padding-top:8px;color:#64748b;font-size:11px}@media screen{html{background:#e5e7eb;padding:16px}body{width:210mm;min-height:297mm;margin:0 auto;padding:14mm;box-shadow:0 2px 18px rgba(15,23,42,.18)}}@media print{html{background:#fff!important;padding:0!important}body{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important}}</style></head><body><div class="top"><h1>${esc(title)}</h1><b>${esc(doc.numero||"—")}</b></div><div class="parties"><div class="box"><h3>Dades del tècnic</h3><b>${esc(cfg.empresa||"Héctor Cubero / Despatx tècnic")}</b><span>${esc(cfg.email||"Email pendent")}</span><span>NIF / Col·legiat: pendent</span></div><div class="box"><h3>Client</h3><b>${esc(obra?.propietat||"Client")}</b><span>NIF: ${esc(obra?.nifPropietat||"Pendent")}</span><span>${esc(obra?.adreca||"")}</span><span>${esc(obra?.poblacio||"")}</span></div></div><div class="exp"><b>Expedient</b><br>${esc(expedientCode8739(obra))} · ${esc(obra?.nom||"")}<br><small>Data: ${esc(doc.data||"—")}</small></div><table><colgroup><col class="c1"><col class="c2"></colgroup><thead><tr><th>Concepte</th><th>${rightHead}</th></tr></thead><tbody><tr><td><b>${esc(doc.concepte||"Honoraris tècnics")}</b><p>${esc(doc.text||"—")}</p></td><td class="num"><b>${esc(money(isFactura?base:total))}</b></td></tr></tbody></table>${totals}${foot}</body></html>`;
  return html;
}
function printQuote8745(type,doc,obra){
  const isFactura=type==="factura", title=isFactura?"FACTURA / PROFORMA":"PRESSUPOST";
  const html=quotePrintHtml8745(type,doc,obra);
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

// V87.122 · còpies locals de recuperació abans d'accions de risc (import Excel, baixada núvol, etc.)
function recoverySnapshotsKey878122(user=currentAppUser8779()){return lsKey8779("aco_recovery_snapshots_v87122",user||currentAppUser8779()||"hector")}
function readRecoverySnapshots878122(user=currentAppUser8779()){
  try{const rows=JSON.parse(localStorage.getItem(recoverySnapshotsKey878122(user))||"[]");return Array.isArray(rows)?rows:[]}catch{return []}
}
function writeRecoverySnapshots878122(rows,user=currentAppUser8779()){
  try{localStorage.setItem(recoverySnapshotsKey878122(user),JSON.stringify((Array.isArray(rows)?rows:[]).slice(0,12)))}catch(e){console.warn("No s'ha pogut guardar la còpia de recuperació",e)}
}
function createLocalRecoverySnapshot878122(state={},label="Còpia de recuperació",user=currentAppUser8779()){
  const snap={
    id:"rec-"+Date.now(),
    label,
    createdAt:new Date().toISOString(),
    appVersion:"87.162.0",
    user:user||currentAppUser8779()||"hector",
    clients:stripHeavy878104(state.clients||[]),
    obres:stripHeavy878104(state.obres||[]),
    odata:stripHeavy878104(state.odata||{})
  };
  const rows=[snap,...readRecoverySnapshots878122(user)].slice(0,12);
  writeRecoverySnapshots878122(rows,user);
  return snap;
}
function downloadRecoverySnapshot878122(snap){
  if(!snap)return;
  const blob=new Blob([JSON.stringify(snap,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`app-control-obres-recuperacio-${String(snap.createdAt||new Date().toISOString()).slice(0,10)}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function fmtRecoveryDate878122(iso){try{return new Date(iso).toLocaleString("ca-ES")}catch{return iso||"—"}}

function moduleLabel8737(obra){return canonicalWorkType8740(obra?.tipusTreball||obra?.tipologia)||"Treball tècnic"}
function stripAccents8739(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function codeClean8739(s){return stripAccents8739(s).toUpperCase().replace(/[^A-Z0-9 ]+/g," ").replace(/\s+/g," ").trim()}
function workCode8739(t){
  t=canonicalWorkType8740(t);
  const n=codeClean8739(t);
  if(n.includes("CERTIFICACIO"))return "CERT";
  if(n.includes("FACTURA"))return "FAC";
  if(n.includes("ELABORACIO")&&n.includes("PRESSUPOST"))return "PRE";
  if(n.includes("PRESSUPOST"))return "PRE";
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
  const stop=new Set(["DE","DEL","LA","EL","ELS","LES","SL","S","L","SA","SCP","CB","COMUNITAT","CP","EDIFICI","EDIFICIO","CONSTRUCCIONS","CONSTRUCCIONES","PROMOCIONS","PROMOCIONES"]);
  const words=raw.split(" ").filter(w=>w&&!stop.has(w));
  if(raw.includes("BRAVA"))return "BR-BV";
  if(raw.includes("SOCOTERM"))return "SO-CT";
  if(words.length>=2)return words.slice(0,2).map(w=>w.slice(0,2)).join("-");
  if(words.length===1)return words[0].slice(0,4)||"CLI";
  return "CLI";
}
function keywordCode8739(s){
  const stop=["DE","DEL","LA","EL","ELS","LES","L","D","I","A","AL","EN","PER","CARRER","CALLE","AVINGUDA","AV","PASSEIG","CP","COMUNITAT","EDIFICI","EDIFICIO"];
  const words=codeClean8739(s).split(" ").filter(w=>w&&!stop.includes(w));
  const joined=words.join("");
  return (joined||"TREBALL").slice(0,12);
}
function padExp8739(n){return String(n||1).padStart(3,"0")}
function expedientYear878191(o={}){
  const fromCode=String(o.codiExpedient||o.codi||o.expedientBase||"").match(/^(\d{4})-/);
  return String(o.any||fromCode?.[1]||new Date().getFullYear());
}
function expedientNumber878191(o={}){
  const direct=Number(o.numExpedient);
  if(Number.isFinite(direct)&&direct>0)return direct;
  const m=String(o.codiExpedient||o.codi||o.expedientBase||"").match(/^\d{4}-(\d{3})/);
  return m?Number(m[1])||0:0;
}
function expedientCreatedTime878191(o={},fallbackIndex=0,total=0){
  const direct=Date.parse(String(o.createdAt||o.dataCreacio||o.created_at||""));
  if(Number.isFinite(direct))return direct;
  const idTimes=String(o.id||"").match(/(\d{12,})/g)||[];
  const idTime=idTimes.map(Number).filter(Number.isFinite).sort((a,b)=>b-a)[0];
  if(idTime)return idTime;
  // Les dades antigues es guardaven amb els expedients més nous al principi.
  return Math.max(1,total-fallbackIndex);
}
function sortExpedientsByCreation878191(rows=[]){
  const total=(rows||[]).length;
  return [...(rows||[])].map((o,index)=>({o,index,time:expedientCreatedTime878191(o,index,total)})).sort((a,b)=>
    b.time-a.time||
    expedientNumber878191(b.o)-expedientNumber878191(a.o)||
    String(b.o?.id||"").localeCompare(String(a.o?.id||""),"ca",{numeric:true})
  ).map(x=>x.o);
}
function nextExpNumber8739(year,all){
  const nums=(all||[]).filter(o=>expedientYear878191(o)===String(year)).map(expedientNumber878191);
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
  const rows=[...(obres||[])];
  const total=rows.length;
  const refs=rows.map((o,index)=>({o,index,year:expedientYear878191(o),number:expedientNumber878191(o),time:expedientCreatedTime878191(o,index,total)}));
  const counts={};
  refs.forEach(r=>{if(r.number>0){counts[r.year]??=new Map();counts[r.year].set(r.number,(counts[r.year].get(r.number)||0)+1)}});
  const reserved={};
  Object.entries(counts).forEach(([year,map])=>{reserved[year]=new Set([...map.entries()].filter(([,count])=>count===1).map(([number])=>number))});
  const used={};
  const cursor={};
  const repaired=new Map();
  refs.sort((a,b)=>a.time-b.time||a.index-b.index).forEach(r=>{
    used[r.year]??=new Set();
    reserved[r.year]??=new Set();
    cursor[r.year]=cursor[r.year]||0;
    let number=r.number;
    const duplicate=number>0&&used[r.year].has(number);
    if(number<=0||duplicate){
      number=Math.max(1,cursor[r.year]+1);
      while(used[r.year].has(number)||reserved[r.year].has(number))number++;
    }
    used[r.year].add(number);
    cursor[r.year]=Math.max(cursor[r.year],number);
    const base=`${r.year}-${padExp8739(number)}`;
    const currentCode=String(r.o.codiExpedient||r.o.codi||"");
    const mustRebuild=!currentCode||number!==r.number||!currentCode.startsWith(base+"-");
    if(mustRebuild){
      const suffix=currentCode.match(/^\d{4}-\d{3}(.+)$/)?.[1];
      if(suffix){
        repaired.set(r.index,{...r.o,any:r.year,expedientBase:base,codiExpedient:`${base}${suffix}`,numExpedient:number,codeRepairedAt878191:new Date().toISOString()});
      }else{
        const client=(clients||[]).find(c=>c.id===r.o.client);
        const built=buildExpedientCode8739({year:r.year,number,tipus:r.o.tipusTreball||r.o.tipologia,client,clientNom:r.o.propietat,keyword:r.o.paraulaClau,nom:r.o.nom,subtitol:r.o.subtitol,poblacio:r.o.poblacio});
        repaired.set(r.index,{...r.o,...built,any:r.year,expedientBase:built.base,codiExpedient:built.codi,numExpedient:number,codeRepairedAt878191:new Date().toISOString()});
      }
    }else if(r.o.expedientBase!==base||Number(r.o.numExpedient)!==number||String(r.o.any||"")!==r.year){
      repaired.set(r.index,{...r.o,any:r.year,expedientBase:base,codiExpedient:currentCode,numExpedient:number});
    }else repaired.set(r.index,r.o);
  });
  return rows.map((o,index)=>repaired.get(index)||o);
}
function needsExpedientCodeRepair878191(obres=[]){
  const seen=new Set();
  for(const o of (obres||[])){
    const year=expedientYear878191(o),number=expedientNumber878191(o),base=number?`${year}-${padExp8739(number)}`:"";
    if(!number||!o.codiExpedient||!o.expedientBase||String(o.expedientBase)!==base||seen.has(base))return true;
    seen.add(base);
  }
  return false;
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
  const constructor=obra.constructor||obra.empresaConstructora||client.rao||client.nom||"Constructora pendent";
  return [
    {id:"agent-hector-default",nom:"Héctor Cubero",rol:"Arquitecte tècnic / DEO",empresa:"Despatx tècnic",email:"hector@despatx.cat",telefon:""},
    {id:"agent-promotor-default",nom:promotor,rol:"Promotor / propietat",empresa:promotor,email:"",telefon:""},
    {id:"agent-constructor-default",nom:constructor,rol:"Constructora / contractista",empresa:constructor,email:"",telefon:""}
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


function normalizeAgentRole878188(v){
  return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}
function agentCategory878188(agent={}){
  const r=normalizeAgentRole878188([agent.rol,agent.tipus,agent.categoria,agent.empresa,agent.nom].filter(Boolean).join(" "));
  if(r.includes("constructora")||r.includes("contractista")||r.includes("industrial")||r.includes("subcontract"))return "constructora";
  if(r.includes("coordinacio")||r.includes("seguretat")||r.includes("css"))return "tecnic";
  if(r.includes("arquitect")||r.includes("tecnic")||r.includes("direccio")||r.includes("facultativa")||r.includes("do")||r.includes("deo")||r.includes("collegiat"))return "tecnic";
  if(r.includes("promotor")||r.includes("propiet")||r.includes("client")||r.includes("immobili"))return "promotor";
  if(r.includes("administracio")||r.includes("ajuntament"))return "administracio";
  return "altres";
}
function agentMatchesField878188(agent,field){
  const cat=agentCategory878188(agent);
  const r=normalizeAgentRole878188([agent.rol,agent.tipus,agent.categoria].filter(Boolean).join(" "));
  if(field==="constructora")return cat==="constructora";
  if(field==="css")return cat==="tecnic"&&(r.includes("css")||r.includes("seguretat")||r.includes("coordinacio")||r.includes("coordinador")||r.includes("tecnic")||r.includes("arquitect"));
  if(field==="do")return cat==="tecnic"&&(r.includes("direccio")||r.includes("do")||r.includes("arquitect")||r.includes("facultativa")||r.includes("tecnic"));
  if(field==="deo")return cat==="tecnic"&&(r.includes("execucio")||r.includes("deo")||r.includes("aparellador")||r.includes("arquitecte tecnic")||r.includes("tecnic"));
  if(field==="tecnic")return cat==="tecnic";
  if(field==="promotor")return cat==="promotor";
  return true;
}
function filteredAgentsForField878188(list=[],field){
  const arr=sortAgents878134(uniqAgents8768(list||[]));
  const filtered=arr.filter(a=>agentMatchesField878188(a,field));
  return filtered.length?filtered:arr;
}
const CLIENT_ROLE_OPTIONS878188=["Promotor","Arquitecte","Arquitecte tècnic","Immobiliària","Constructora","Industrial","Administració","Particular","Autònom","Altres"];
const AGENT_ROLE_OPTIONS878188=["Promotor / propietat","Constructora / contractista","Industrial","Arquitecte","Arquitecte tècnic","Direcció Facultativa","Direcció d’obra","Direcció d’execució","Coordinació S+S","Administració","Altres"];

function SafeFormExpedient8751({clients,onSubmit,allAgents=[]}){
  const [mode,setMode]=useState(()=>((clients&&clients.length)?clients[0].id:'__new__'));
  const [clientModeTouched,setClientModeTouched]=useState(false);
  const [tipus,setTipusState]=useState('Pressupost d’obra / amidaments');
  const [cp,setCp]=useState('');
  const [poblacio,setPoblacio]=useState('');
  const tpl=workTypeTemplate878121(tipus);
  const [nom,setNom]=useState('Nou pressupost');
  const [subtitol,setSubtitol]=useState(tpl.subtitol);
  const [definicioFeina,setDefinicioFeina]=useState(tpl.definicioFeina);
  const [direccioObraText,setDireccioObraText]=useState(tpl.direccioObraText);
  const [adreca,setAdreca]=useState('Pendent');
  const [showAgents,setShowAgents]=useState(workNeedsAgentsByDefault878151(tipus));
  const [showTec,setShowTec]=useState(!isSimpleWorkType878151(tipus));
  const [clientOpen,setClientOpen]=useState(true);
  const [detailOpen,setDetailOpen]=useState(false);
  useEffect(()=>{
    if(!clientModeTouched && (!mode||mode==='__new__') && (clients||[]).length){setMode(clients[0].id);}
    if(mode && mode!=='__new__' && (clients||[]).length && !(clients||[]).some(c=>c.id===mode)){setMode(clients[0].id);}
    if(mode && mode!=='__new__' && !(clients||[]).length){setMode('__new__');}
  },[clients,mode,clientModeTouched]);
  const selectedClient878157=(clients||[]).find(c=>c.id===mode);
  const types=(typeof WORK_TYPES8737!=='undefined'?WORK_TYPES8737:['Projecte tècnic','Project management','Informe tècnic','Certificat energètic','Cèdula d’habitabilitat','Pressupost tècnic-client','Altres']);
  const agentChoices878159=sortAgents878134(uniqAgents8768([...(allAgents||[])]));
  const [agentVals878159,setAgentVals878159]=useState({constructora:'Pendent',do:'Pendent',deo:'Pendent',css:'Pendent'});
  function setAgentVal878159(field,value){setAgentVals878159(p=>({...p,[field]:value||'Pendent'}))}
  function NewExpAgentPicker878159({field,label,roleHint}){
    const current=agentVals878159[field]||'Pendent';
    const choices=filteredAgentsForField878188(agentChoices878159,field);
    const known=choices.some(a=>String(a.nom||'')===String(current));
    const selected=known?current:(current&&current!=='Pendent'?'__custom__':'Pendent');
    return <label><span>{label}</span><select value={selected} onChange={e=>{const v=e.target.value;if(v==='__custom__')setAgentVal878159(field,'');else setAgentVal878159(field,v||'Pendent')}}><option value='Pendent'>Pendent / no cal ara</option>{choices.map(a=><option key={field+a.id} value={a.nom}>{a.nom} · {a.empresa||a.rol||'Agent'}</option>)}<option value='__custom__'>+ Crear / escriure nou</option></select>{selected==='__custom__'&&<input className='mt-6-v8773' value={current==='Pendent'?'':current} onChange={e=>setAgentVal878159(field,e.target.value)} placeholder={roleHint||'Nom del tècnic o empresa'}/>}<input type='hidden' name={field} value={current}/></label>
  }
  function setTipus(v){
    const t=selectedWorkType878150(v);
    const nt=workTypeTemplate878121(t);
    setTipusState(t);
    setSubtitol(nt.subtitol);
    setDefinicioFeina(nt.definicioFeina);
    setDireccioObraText(nt.direccioObraText);
    const needs=workNeedsAgentsByDefault878151(t);
    setShowAgents(needs);
    setShowTec(!isSimpleWorkType878151(t));
    if(isSimpleWorkType878151(t))setDetailOpen(false);
  }
  function changeCp(v){setCp(v);const pob=poblacioForCp8773(v);if(pob)setPoblacio(pob)}
  function changePoblacio(v){setPoblacio(v);const c=cpForPoblacio8773(v);if(c)setCp(c)}
  const simple=isSimpleWorkType878151(tipus);
  const needsAgents=workNeedsAgentsByDefault878151(tipus);
  return <form onSubmit={onSubmit} className="safe-form-exp-v8751 exp-form-pro-v87151"><DatalistCP8773/><datalist id="agents-base-v8773"><option>Héctor Cubero</option><option>Arquitecte tècnic pendent</option><option>Arquitecte pendent</option><option>Constructora pendent</option><option>Coordinador S+S pendent</option></datalist>
    <div className="exp-form-head-v87151">
      <div><span>Nou expedient</span><h3>{tipus}</h3><p>{workQuickHelp878151(tipus)}</p></div>
      <div className="exp-form-badge-v87151">{simple?'Flux curt':'Flux d’obra'}</div>
    </div>
    <div className="work-type-cards-v87151">
      {types.map(t=><button type="button" key={t} className={canonicalWorkType8740(t)===tipus?'active':''} onClick={()=>setTipus(t)}><b>{t}</b><small>{isSimpleWorkType878151(t)?'Dades essencials':'Dades d’obra'}</small></button>)}
    </div>
    <input type="hidden" name="tipusTreball" value={tipus}/>
    {tipus==='Altres'&&<div className="form-grid compact-v87151"><label><span>Altres *</span><input name="tipusTreballAltres" placeholder="Defineix el tipus de feina"/></label></div>}

    <details open className="form-accordion-v87151 form-accordion-main-v87152"><summary><b>1 · Dades mínimes obligatòries</b><span>Només el necessari per obrir l’expedient</span></summary>
      <div className="form-grid compact-v87151">
        <label><span>Client *</span><select name="client" value={mode} onChange={e=>{setClientModeTouched(true);setMode(e.target.value)}} required>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}<option value="__new__">+ Crear client nou</option></select></label>
        <label><span>Nom de l’obra / treball *</span><input name="nom" required value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex. Verbania, Bany, Pressupost comunitat..."/></label>
        <label><span>Any *</span><input name="any" defaultValue={String(new Date().getFullYear())}/></label>
        <label><span>Estat *</span><select name="estat" defaultValue={simple?'En procés':'En curs / Actiu'}>{EXPEDIENT_STATUS878136.map(st=><option key={st}>{st}</option>)}</select></label>
        <label><span>Paraula clau codi</span><input name="paraulaClau" placeholder="VERBANIA, BANY, COBERTA..."/></label>
        <label><span>Descripció breu</span><input name="subtitol" value={subtitol} onChange={e=>setSubtitol(e.target.value)}/></label>
      </div>
    </details>

    <details open={clientOpen} onToggle={e=>setClientOpen(e.currentTarget.open)} className="form-accordion-v87151"><summary><b>2 · Client</b><span>{mode==='__new__'?'Crear client nou':'Dades del client ja guardades'}</span></summary>
      {mode==='__new__'?<div className="form-grid compact-v87151 client-create-v87157"><label><span>Nom nou client *</span><input name="clientNouNom" required defaultValue="Nou client"/></label><label><span>Raó social</span><input name="clientNouRao" placeholder="Opcional si és igual al nom"/></label><label><span>Rol / tipologia</span><select name="clientNouTipus" defaultValue="Promotor">{CLIENT_ROLE_OPTIONS878188.map(t=><option key={t}>{t}</option>)}</select></label><label><span>NIF/CIF</span><input name="clientNouNif" placeholder="Pendent"/></label><label><span>Email</span><input name="clientNouEmail" placeholder="Pendent"/></label><label><span>Telèfon</span><input name="clientNouTelefon" placeholder="Pendent"/></label><label><span>Adreça client</span><input name="clientNouAdreca" placeholder="Pendent"/></label></div>:<div className="selected-client-v87157"><b>{selectedClient878157?.nom||'Client seleccionat'}</b><span>{selectedClient878157?.nif?`NIF/CIF: ${selectedClient878157.nif}`:'NIF/CIF pendent'}</span><span>{[selectedClient878157?.email,selectedClient878157?.telefon].filter(Boolean).join(' · ')||'Contacte pendent'}</span><small>El client es farà servir per codificar l’expedient. Per crear-ne un altre, obre el desplegable i tria “+ Crear client nou”.</small></div>}
    </details>

    <details open={detailOpen} onToggle={e=>setDetailOpen(e.currentTarget.open)} className="form-accordion-v87151"><summary><b>3 · Definició de l’encàrrec</b><span>{simple?'Opcional: ja queda definida automàticament':'Preomplert segons tipus, editable'}</span></summary>
      <div className="form-grid compact-v87151">
        <label className="span-all"><span>Definició tipus de feina</span><textarea name="definicioFeina" value={definicioFeina} onChange={e=>setDefinicioFeina(e.target.value)} placeholder="Defineix l'abast de l'encàrrec..."/></label>
        <label className="span-all"><span>Criteri / notes d’execució</span><textarea name="direccioObraText" value={direccioObraText} onChange={e=>setDireccioObraText(e.target.value)} placeholder="Direcció d’obra, seguiment o criteri aplicable..."/></label>
      </div>
    </details>

    <details open={showTec} onToggle={e=>setShowTec(e.currentTarget.open)} className="form-accordion-v87151"><summary><b>4 · Dades tècniques i ubicació</b><span>{simple?'Opcional per aquest tipus':'Recomanat per obra'}</span></summary>
      <div className="form-grid compact-v87151">
        <label><span>Client final / propietat</span><input name="propietat" placeholder="Per defecte serà el client"/></label><label><span>NIF client final</span><input name="nifPropietat" placeholder="Pendent"/></label>
        <label><span>Adreça expedient</span><input name="adreca" value={adreca} onChange={e=>setAdreca(e.target.value)} placeholder="Pendent"/></label><label><span>Codi postal</span><input name="codiPostal" list="cp-list-v8773" value={cp} onChange={e=>changeCp(e.target.value)} placeholder="17230"/></label><label><span>Població</span><input name="poblacio" list="poblacio-list-v8773" value={poblacio} onChange={e=>changePoblacio(e.target.value)} placeholder="Palamós"/></label><label><span>Referència cadastral</span><input name="rc" placeholder="Pendent"/></label>
      </div>
    </details>

    <details open={showAgents} onToggle={e=>setShowAgents(e.currentTarget.open)} className="form-accordion-v87151"><summary><b>5 · Agents d’obra</b><span>{needsAgents?'Recomanat per aquest encàrrec':'Opcional, només si cal'}</span></summary>
      <div className="form-grid compact-v87151">
        <NewExpAgentPicker878159 field="constructora" label="Constructora / contractista" roleHint="Nom de la constructora"/><NewExpAgentPicker878159 field="do" label="Direcció d’obra (DO)" roleHint="Nom del tècnic DO"/><NewExpAgentPicker878159 field="deo" label="Direcció execució (DEO)" roleHint="Nom del tècnic DEO"/><NewExpAgentPicker878159 field="css" label="Coordinació S+S (CSS)" roleHint="Nom del coordinador S+S"/>
      </div>
    </details>

    {!showTec&&<><input type="hidden" name="adreca" value="Pendent"/><input type="hidden" name="codiPostal" value=""/><input type="hidden" name="poblacio" value="Pendent"/><input type="hidden" name="rc" value="Pendent"/><input type="hidden" name="propietat" value=""/><input type="hidden" name="nifPropietat" value=""/></>}
    {!showAgents&&<><input type="hidden" name="constructora" value="Pendent"/><input type="hidden" name="constructor" value="Pendent"/><input type="hidden" name="do" value="Pendent"/><input type="hidden" name="deo" value="Pendent"/><input type="hidden" name="css" value="Pendent"/></>}
    <div className="modal-actions sticky-actions-v87151"><button className="primary">Crear expedient</button></div>
  </form>
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
      constructor:(typeof obra?.constructor==="string"?obra.constructor:"")||obra?.empresaConstructora||client?.rao||"Pendent",
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
      constructor:(typeof a?.constructor==="string"?a.constructor:"")||(typeof obra?.constructor==="string"?obra.constructor:"")||obra?.empresaConstructora||client?.rao||"Pendent",
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
            <label><span>Constructora</span><input value={draft.constructor||""} onChange={e=>upd("constructor",e.target.value)}/></label>
            <label><span>Direcció d’obra (DO)</span><input value={draft.do||""} onChange={e=>upd("do",e.target.value)}/></label>
            <label><span>Direcció execució (DEO)</span><input value={draft.deo||""} onChange={e=>upd("deo",e.target.value)}/></label>
            <label><span>Coordinació S+S (CSS)</span><input value={draft.css||""} onChange={e=>upd("css",e.target.value)}/></label>
          </div>}

          {actaPanel8799==="Agents"&&<div className="agents-box-v8764 agents-box-v87102 agents-box-v87103">
            <div className="section-head-v8764 section-head-v87103"><div><b>Agents de l’acta</b><span>Selecciona assistents, treu-los només d’aquesta acta o edita les seves dades sense sortir de la pestanya.</span></div><div className="actions-inline"><button type="button" className="secondary" onClick={()=>setShowManageAgents87103(v=>!v)}>{showManageAgents87103?"Amagar gestió":"Gestionar agents"}</button><button type="button" className="secondary" onClick={()=>setShowNewAgent87102(v=>!v)}>{showNewAgent87102?"Tancar alta":"+ Crear agent nou"}</button></div></div>
            <div className="agent-search-panel-v87103">
              <input className="agent-main-search-v87103" value={agentSearch87102} onChange={e=>setAgentSearch87102(e.target.value)} placeholder="Escriu per cercar agent: nom, empresa, rol o email..."/>
              <div className="agent-smart-results-v87103">
                {agents.filter(a=>`${a.nom||""} ${a.rol||""} ${a.empresa||""} ${a.email||""} ${a.telefon||""}`.toLowerCase().includes(agentSearch87102.toLowerCase())).slice(0,8).map(a=><button type="button" key={a.id} className={(draft.agentIds||[]).includes(a.id)?"selected":""} onClick={()=>toggleAgent(a.id)}><b>{a.nom}</b><span>{a.rol||"Rol pendent"} · {a.empresa||"Empresa/autònom pendent"}</span>{a.email&&<small>{a.email}</small>}</button>)}
                {agents.length===0&&<span className="muted">Encara no hi ha agents a la biblioteca.</span>}
              </div>
            </div>
            {showNewAgent87102&&<div className="new-agent-box-v87102 new-agent-box-v87103"><h4>Crear agent nou</h4><div className="agent-form-v8764"><input list="agent-names-v87102" placeholder="Nom agent" value={agentForm8764.nom} onChange={e=>{const val=e.target.value;const found=agents.find(a=>String(a.nom||"").toLowerCase()===val.toLowerCase());setAgentForm8764(p=>found?{...p,nom:val,rol:found.rol||p.rol,empresa:found.empresa||p.empresa,email:found.email||p.email,telefon:found.telefon||p.telefon}:{...p,nom:val})}}/><datalist id="agent-names-v87102">{agents.map(a=><option key={a.id} value={a.nom}/>)}</datalist><input list="agent-rols-v87102" placeholder="Rol / funció" value={agentForm8764.rol} onChange={e=>setAgentForm8764(p=>({...p,rol:e.target.value}))}/><datalist id="agent-rols-v87102">{[...new Set(agents.map(a=>a.rol).filter(Boolean))].map(x=><option key={x} value={x}/>)}</datalist><input list="agent-companies-v87102" placeholder="Empresa / autònom" value={agentForm8764.empresa} onChange={e=>{const val=e.target.value;const found=agents.find(a=>String(a.empresa||"").toLowerCase()===val.toLowerCase());setAgentForm8764(p=>found?{...p,empresa:val,email:p.email||found.email||"",telefon:p.telefon||found.telefon||""}:{...p,empresa:val})}}/><datalist id="agent-companies-v87102">{[...new Set(agents.map(a=>a.empresa).filter(Boolean))].map(x=><option key={x} value={x}/>)}</datalist><input placeholder="Email" value={agentForm8764.email} onChange={e=>setAgentForm8764(p=>({...p,email:e.target.value}))}/><input placeholder="Telèfon" value={agentForm8764.telefon||""} onChange={e=>setAgentForm8764(p=>({...p,telefon:e.target.value}))}/><button type="button" className="primary" onClick={addAgent8764}>Guardar agent</button></div></div>}
            <div className="selected-agent-chips-v8799 selected-agent-chips-v87102 selected-agent-edit-v87145"><b>Assistents seleccionats a aquesta acta</b>{selectedAgents.length===0?<span className="muted">Cap agent seleccionat per aquesta acta.</span>:selectedAgents.map(a=><details key={a.id} className="acta-agent-edit-drawer-v87145"><summary><span>{a.nom||"Agent"}</span><em>{a.rol||"Rol pendent"} · {a.empresa||"Empresa pendent"}</em></summary><div className="acta-agent-edit-grid-v87145"><label><small>Nom</small><input value={a.nom||""} onChange={e=>updateAgent8764(a.id,"nom",e.target.value)}/></label><label><small>Figura / rol</small><input value={a.rol||""} onChange={e=>updateAgent8764(a.id,"rol",e.target.value)} placeholder="DO, DEO, CSS, constructor..."/></label><label><small>Empresa</small><input value={a.empresa||""} onChange={e=>updateAgent8764(a.id,"empresa",e.target.value)}/></label><label><small>Email</small><input value={a.email||""} onChange={e=>updateAgent8764(a.id,"email",e.target.value)}/></label><label><small>Telèfon</small><input value={a.telefon||""} onChange={e=>updateAgent8764(a.id,"telefon",e.target.value)}/></label><label><small>NIF / CIF</small><input value={a.nif||""} onChange={e=>updateAgent8764(a.id,"nif",e.target.value)}/></label><div className="acta-agent-actions-v87145"><button type="button" className="secondary small" onClick={()=>toggleAgent(a.id)}>Treure només d’aquesta acta</button><button type="button" className="danger small" onClick={()=>deleteAgent8764(a.id)}>Eliminar de l’obra/biblioteca</button></div></div></details>)}</div>
            {(()=>{const ids=[...new Set(actes.filter(a=>a.id!==draft.id).flatMap(a=>(normalizeActa8768(a,agents).agentIds||[])))];return ids.length>0&&<div className="prev-agents-v87102 prev-agents-v87103"><h4>Agents utilitzats en actes anteriors</h4><p className="muted">Marca només els que vulguis repetir en aquesta acta.</p><div className="check-grid">{ids.map(id=>{const a=agents.find(x=>x.id===id);return a?<label className="check-row" key={id}><input type="checkbox" checked={(draft.agentIds||[]).includes(id)} onChange={()=>toggleAgent(id)}/><span>{a.nom} · {a.rol||""} · {a.empresa||""}</span></label>:null})}</div></div>})()}
            {showManageAgents87103&&<div className="agent-library-edit-v87100 agent-library-edit-v87103"><h4>Gestionar biblioteca / agents de l’obra</h4><p>Edita dades bàsiques o elimina agents. Els canvis s’apliquen també a les actes on aquest agent està seleccionat.</p>{agents.filter(a=>`${a.nom||""} ${a.rol||""} ${a.empresa||""} ${a.email||""} ${a.telefon||""} ${a.nif||""}`.toLowerCase().includes(agentSearch87102.toLowerCase())).map(ag=><div className="agent-library-row-v87100 agent-library-row-v87145" key={ag.id}><input value={ag.nom||""} onChange={e=>updateAgent8764(ag.id,"nom",e.target.value)} placeholder="Nom"/><input value={ag.rol||""} onChange={e=>updateAgent8764(ag.id,"rol",e.target.value)} placeholder="Rol"/><input value={ag.empresa||""} onChange={e=>updateAgent8764(ag.id,"empresa",e.target.value)} placeholder="Empresa"/><input value={ag.email||""} onChange={e=>updateAgent8764(ag.id,"email",e.target.value)} placeholder="Email"/><input value={ag.telefon||""} onChange={e=>updateAgent8764(ag.id,"telefon",e.target.value)} placeholder="Telèfon"/><input value={ag.nif||""} onChange={e=>updateAgent8764(ag.id,"nif",e.target.value)} placeholder="NIF/CIF"/><button type="button" className="danger small" onClick={()=>deleteAgent8764(ag.id)}>Eliminar</button></div>)}</div>}
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
      <div><b>Constructora</b><span>{(typeof acta?.constructor==="string"?acta.constructor:"")||(typeof obra?.constructor==="string"?obra.constructor:"")||client?.rao||"—"}</span></div>
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
    <div className="preview-section-v8764 acta-a4-section-v8766"><h3>Signatures electròniques</h3><div className="signature-grid-v8768"><span>Direcció facultativa / DO<br/>Nom i signatura</span><span>DEO / Arquitecte tècnic<br/>Nom i signatura</span><span>Constructora<br/>Nom i signatura</span><span>Promotor / propietat<br/>Nom i signatura</span></div></div>
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

function DataJsonTools8778({clients=[],obres=[],odata={}}={}){
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
    const cleanStoredValue878185=(v)=>{
      if(v==null)return v;
      try{return JSON.stringify(stripHeavy878185(JSON.parse(v)));}
      catch{return typeof v==="string"&&(/^data:/i.test(v)||v.length>700000)?"":v;}
    };
    const storage={};
    keys.forEach(k=>{try{storage[k]=cleanStoredValue878185(localStorage.getItem(k))}catch{}});
    const simple={};
    const pref=userPrefix878105(user);
    Object.entries(storage).forEach(([k,v])=>{if(k.startsWith(pref))simple[k.slice(pref.length)]=v});
    const data={
      version:"V87.215",
      user,
      exportedAt:new Date().toISOString(),
      mode:"FULL_USER_STORAGE_LIGHT_SAFE",
      note:"Còpia completa segura. Les imatges/logos/base64 s'han eliminat per evitar QuotaExceededError; es mantenen clients, expedients, tasques, pressupostos, partides, descompostos i la llibreria central.",
      storage,
      localStorage:simple,
      appState:stripHeavy878185({clients:clients||[],obres:obres||[],odata:odata||{}}),
      storageHealth:localStorageBytes878185()
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
        try{safeSetLocalStorage878185(`${targetPref}backup_abans_import_${Date.now()}`,JSON.stringify(stripHeavy878185({user:active,createdAt:new Date().toISOString(),storage:backup})).slice(0,180000),active)}catch{}

        // V87.182: importació profunda. Els JSON antics poden portar alhora:
        // - storage.aco_clients / aco_obres / aco_odata (còpia antiga)
        // - storage.aco_v8782__hector__aco_clients... (còpia per usuari)
        // - localStorage.aco_clients... (còpia simple més recent)
        // Abans una branca podia trepitjar l'altra i les tasques/clients nous no apareixien.
        const buckets={};
        const addBucket=(base,value,rank)=>{
          if(value===undefined||value===null||!base)return;
          if(!String(base).startsWith("aco_"))return;
          if(!buckets[base])buckets[base]=[];
          buckets[base].push({value,rank});
        };
        const normalizeBase878184=(base)=>{
          let b=String(base||"").trim();
          // Versions anteriors podien crear claus dobles: aco_v8782__hector__aco_odata__hector.
          // En treure el prefix quedava aco_odata__hector i la importació no ho reconeixia com a aco_odata.
          [sourceUser,active,"hector","pol"].filter(Boolean).forEach(u=>{
            const suf=`__${String(u).trim().toLowerCase()}`;
            if(b.toLowerCase().endsWith(suf))b=b.slice(0,-suf.length);
          });
          return b;
        };
        const normalizeStorageKey=(k)=>{
          if(!k)return null;
          if(k.startsWith(sourcePref))return {base:normalizeBase878184(k.slice(sourcePref.length)),rank:30};
          if(k.startsWith(targetPref))return {base:normalizeBase878184(k.slice(targetPref.length)),rank:30};
          if(k.startsWith(STORAGE_NS8782+"__")){
            const parts=k.split("__");
            return {base:normalizeBase878184(parts.slice(2).join("__")),rank:25};
          }
          if(/^aco_/.test(k)){
            return {base:normalizeBase878184(k),rank:10};
          }
          return null;
        };
        if(data.storage&&typeof data.storage==="object"){
          Object.entries(data.storage).forEach(([k,v])=>{
            const n=normalizeStorageKey(k);
            if(n)addBucket(n.base,v,n.rank);
          });
        }
        if(data.localStorage&&typeof data.localStorage==="object"){
          Object.entries(data.localStorage).forEach(([k,v])=>{
            const n=normalizeStorageKey(k);
            addBucket(n?.base||normalizeBase878184(k),v,40);
          });
        }
        if(data.appState&&typeof data.appState==="object"){
          if(Array.isArray(data.appState.clients))addBucket("aco_clients",data.appState.clients,60);
          if(Array.isArray(data.appState.obres))addBucket("aco_obres",data.appState.obres,60);
          if(data.appState.odata&&typeof data.appState.odata==="object")addBucket("aco_odata",data.appState.odata,60);
        }
        if(!data.storage&&!data.localStorage&&typeof data==="object"){
          Object.entries(data).forEach(([k,v])=>addBucket(k,v,40));
        }
        if(!buckets.aco_clients&&!buckets.aco_obres&&!buckets.aco_odata&&!buckets.aco_odata_core_v87104){
          throw new Error("El fitxer no sembla una còpia de l’app.");
        }
        const parseMaybe=(v,fallback)=>{
          if(v===undefined||v===null)return fallback;
          if(typeof v!=="string")return v;
          try{return JSON.parse(v)}catch{return fallback}
        };
        const latestValue=(base)=>{
          const arr=[...(buckets[base]||[])].sort((a,b)=>a.rank-b.rank);
          return arr.length?arr[arr.length-1].value:null;
        };
        const mergeListBy=(base,keyFn)=>{
          const map=new Map();
          [...(buckets[base]||[])].sort((a,b)=>a.rank-b.rank).forEach(({value})=>{
            const rows=parseMaybe(value,[]);
            if(!Array.isArray(rows))return;
            rows.forEach((x,i)=>{
              if(!x)return;
              const key=String(keyFn(x,i)||"").trim()||`row-${i}`;
              map.set(key,{...(map.get(key)||{}),...x});
            });
          });
          return [...map.values()];
        };
        const mergeOdataImport878182=(base,inc)=>{
          const out={...(base||{})};
          Object.entries(inc||{}).forEach(([oid,val])=>{
            if(!val||typeof val!=="object"||Array.isArray(val))return;
            const old=out[oid]||{};
            const next={...old,...val};
            next.budgetGroups=mergeArr878104(old.budgetGroups,val.budgetGroups,x=>x?.id||x?.nom||"");
            next.pressupostos=mergeArr878104(old.pressupostos,val.pressupostos,x=>`${x?.budgetId||"principal"}__${x?.id||x?.nom||x?.versio||""}`);
            next.partides=mergeArr878104(old.partides,val.partides,x=>`${x?.budgetId||"principal"}__${x?.codi||""}__${x?.cap||""}`);
            next.certificacions=mergeArr878104(old.certificacions,val.certificacions,x=>`${x?.budgetId||"principal"}__${x?.id||x?.numero||""}`);
            next.factures=mergeArr878104(old.factures,val.factures,x=>`${x?.budgetId||"principal"}__${x?.id||x?.numero||x?.pfId||""}`);
            next.tasques=mergeArrGeneric878181(old.tasques,val.tasques,x=>x?.id||`${x?.text||x?.titol||""}__${x?.dataMaxima||x?.data||""}`);
            next.events=mergeArrGeneric878181(old.events,val.events,x=>x?.id||`${x?.title||x?.titol||""}__${x?.day||""}-${x?.month||""}-${x?.year||""}__${x?.hora||""}`);
            next.hores=mergeArrGeneric878181(old.hores,val.hores,x=>x?.id||`${x?.data||""}__${x?.tasca||x?.etiqueta||""}`);
            next.documents=mergeArrGeneric878181(old.documents,val.documents,x=>x?.id||`${x?.nom||x?.name||""}__${x?.createdAt||x?.data||""}`);
            next.fotos=mergeArrGeneric878181(old.fotos,val.fotos,x=>x?.id||`${x?.nom||x?.name||""}__${x?.createdAt||x?.data||""}`);
            next.actes=mergeArrGeneric878181(old.actes,val.actes,x=>x?.id||`${x?.titol||""}__${x?.data||""}`);
            next.agents=mergeArrGeneric878181(old.agents,val.agents,x=>x?.id||`${x?.nom||""}__${x?.email||""}__${x?.rol||""}`);
            out[oid]=typeof normalizeBudgetedData8791==="function"?normalizeBudgetedData8791(next):next;
          });
          return out;
        };

        let clientsMerged=mergeListBy("aco_clients",x=>x?.id||`${x?.nom||x?.rao||""}__${x?.nif||""}`);
        let obresMerged=mergeListBy("aco_obres",x=>x?.id||`${x?.nom||""}__${x?.client||""}`);
        // V87.211 · una sola font d'autoritat. Un JSON complet porta appState,
        // que és la fotografia exacta que l'usuari veia en exportar. No unim
        // còpies antigues perquè això ressuscitava partides i certificacions.
        const appStateOdata878211=data.appState?.odata;
        const primaryOdata878211=parseMaybe(latestValue("aco_odata"),{});
        const coreOdata878211=parseMaybe(latestValue("aco_odata_core_v87104"),{});
        let odataMerged=(appStateOdata878211&&typeof appStateOdata878211==="object"&&!Array.isArray(appStateOdata878211)&&Object.keys(appStateOdata878211).length)
          ? appStateOdata878211
          : mergeOdataCore878104(primaryOdata878211,coreOdata878211);

        // V87.183: recuperació visible de tasques. Alguns backups tenen les tasques dins d'odata
        // però l'expedient corresponent no queda a la llista principal o bé queda sota una clau
        // interna diferent. Aleshores el JSON importa, però l'Inici no pot ensenyar la tasca.
        const taskKey878183=t=>String(t?.id||`${t?.text||t?.titol||""}__${t?.dataMaxima||t?.data||t?.limit||""}`).trim();
        const taskIsClosed878183=t=>{const st=String(t?.estat||"Pendent").toLowerCase();return st.includes("fet")||st.includes("anul")||st.includes("cancel")};
        const mergeOneList878183=(a=[],b=[],keyFn=(x,i)=>x?.id||i)=>mergeArrGeneric878181(Array.isArray(a)?a:[],Array.isArray(b)?b:[],keyFn);
        const obresFromOdata878183=[];
        const normalizedOdata878183={};
        Object.entries(odataMerged||{}).forEach(([oid,raw])=>{
          if(!raw||typeof raw!=="object"||Array.isArray(raw))return;
          const embedded=(raw.obra&&typeof raw.obra==="object"&&!Array.isArray(raw.obra))?raw.obra:null;
          const targetId=String(embedded?.id||oid||`exp-recuperat-${Date.now()}`).trim();
          const current=normalizedOdata878183[targetId]||{};
          const next={...current,...raw,obra:{...(current.obra||{}),...(embedded||{}),id:targetId}};
          next.tasques=mergeOneList878183(current.tasques,raw.tasques,taskKey878183);
          next.events=mergeOneList878183(current.events,raw.events,x=>x?.id||`${x?.title||x?.titol||""}__${x?.data||x?.day||""}__${x?.hora||""}`);
          next.hores=mergeOneList878183(current.hores,raw.hores,x=>x?.id||`${x?.data||""}__${x?.tasca||x?.etiqueta||""}`);
          next.documents=mergeOneList878183(current.documents,raw.documents,x=>x?.id||`${x?.nom||x?.name||""}__${x?.data||x?.createdAt||""}`);
          next.fotos=mergeOneList878183(current.fotos,raw.fotos,x=>x?.id||`${x?.nom||x?.name||""}__${x?.data||x?.createdAt||""}`);
          next.actes=mergeOneList878183(current.actes,raw.actes,x=>x?.id||`${x?.titol||""}__${x?.data||""}`);
          next.agents=mergeOneList878183(current.agents,raw.agents,x=>x?.id||`${x?.nom||""}__${x?.email||""}__${x?.rol||""}`);
          // El llistat de partides del registre actual és una fotografia completa.
          // No es fusiona per capítol+codi: dues descripcions diferents poden haver
          // compartit codi, i una còpia antiga no pot reaparèixer aquí.
          next.partides=Array.isArray(raw.partides)?raw.partides:(Array.isArray(current.partides)?current.partides:[]);
          next.pressupostos=mergeArr878104(current.pressupostos,raw.pressupostos,x=>`${x?.budgetId||"principal"}__${x?.id||x?.nom||x?.versio||""}`);
          next.budgetGroups=mergeArr878104(current.budgetGroups,raw.budgetGroups,x=>x?.id||x?.nom||"");
          normalizedOdata878183[targetId]=next;
          const hasUseful=(next.tasques||[]).length||(next.events||[]).length||(next.partides||[]).length||(next.pressupostos||[]).length||(next.documents||[]).length;
          if(hasUseful){
            const todayYear=String(new Date().getFullYear());
            obresFromOdata878183.push({
              id:targetId,
              client:embedded?.client||next.client||"",
              any:String(embedded?.any||todayYear),
              nom:String(embedded?.nom||embedded?.name||next.nom||next.tasques?.[0]?.obra||`Expedient recuperat ${targetId}`),
              subtitol:String(embedded?.subtitol||""),
              tipologia:canonicalWorkType8740(embedded?.tipusTreball||embedded?.tipologia||"Altres"),
              tipusTreball:canonicalWorkType8740(embedded?.tipusTreball||embedded?.tipologia||"Altres"),
              estat:String(embedded?.estat||next.estat||"En curs / Actiu"),
              pressupost:Number(embedded?.pressupost)||0,
              certificacio:Number(embedded?.certificacio)||0,
              propietat:String(embedded?.propietat||"Client pendent"),
              nifPropietat:String(embedded?.nifPropietat||""),
              adreca:String(embedded?.adreca||""),
              codiPostal:String(embedded?.codiPostal||embedded?.cp||""),
              poblacio:String(embedded?.poblacio||""),
              rc:String(embedded?.rc||""),
              ...embedded,
              id:targetId
            });
          }
        });
        odataMerged=normalizedOdata878183;
        const obraMap878183=new Map((obresMerged||[]).map((o,i)=>[String(o?.id||`obra-${i}`),{...o}]));
        obresFromOdata878183.forEach(o=>{
          const key=String(o.id||"");
          const old=obraMap878183.get(key)||{};
          // Si l'objecte d'odata és més recent o té camps útils, no el deixem enterrat només dins l'obra.
          obraMap878183.set(key,{...old,...o,tipusTreball:canonicalWorkType8740(o.tipusTreball||o.tipologia||old.tipusTreball||old.tipologia),tipologia:canonicalWorkType8740(o.tipusTreball||o.tipologia||old.tipusTreball||old.tipologia)});
        });
        obresMerged=[...obraMap878183.values()].filter(o=>o&&o.id);
        const clientsFromObres878183=new Set((obresMerged||[]).map(o=>o.client).filter(Boolean));
        const clientMap878183=new Map((clientsMerged||[]).map((c,i)=>[String(c?.id||`client-${i}`),{...c}]));
        clientsFromObres878183.forEach(cid=>{if(!clientMap878183.has(cid))clientMap878183.set(cid,{id:cid,nom:"Client recuperat",rao:"Client recuperat",tipus:"Client",nif:"",email:"",telefon:"",adreca:"",color:"blue"})});
        clientsMerged=[...clientMap878183.values()];
        Object.entries(odataMerged||{}).forEach(([oid,d])=>{
          const o=obresMerged.find(x=>String(x.id)===String(oid))||d.obra||{id:oid,nom:""};
          const manualEvents=Array.isArray(d.events)?d.events:[];
          const taskEvents=(d.tasques||[]).filter(t=>!taskIsClosed878183(t)&&(t.dataMaxima||t.data||t.limit)).map(t=>taskEvent878137({...t,data:t.dataMaxima||t.data||t.limit},o));
          const events=mergeOneList878183(manualEvents,taskEvents,x=>x?.id||`${x?.title||x?.titol||""}__${x?.data||x?.day||""}__${x?.hora||""}`);
          odataMerged[oid]=typeof normalizeBudgetedData8791==="function"?normalizeBudgetedData8791({...d,events,updatedAt:d.updatedAt||new Date().toISOString()}):{...d,events};
        });

        let count=0;
        const write=(base,value)=>{
          const safeValue=stripHeavy878185(value);
          const ok=safeSetLocalStorage878185(lsKey8779(base,active),typeof safeValue==="string"?safeValue:JSON.stringify(safeValue),active);
          if(ok.ok){count++;return true}
          console.warn("Import parcial",base,ok.error);return false;
        };
        if(clientsMerged.length)write("aco_clients",clientsMerged);
        if(obresMerged.length)write("aco_obres",obresMerged);
        if(Object.keys(odataMerged).length){
          write("aco_odata_core_v87104",stripHeavy878104(odataMerged));
          write("aco_odata",odataMerged);
          // Les claus sense espai d'usuari només es conserven als JSON de
          // seguretat; dins l'app no han de tornar a participar en la càrrega.
          if(active==="hector"){
            ["aco_odata","aco_odata_core_v87104","aco_odata__hector"].forEach(k=>{try{localStorage.removeItem(k)}catch{}});
          }
        }
        Object.keys(buckets).forEach(base=>{
          if(["aco_clients","aco_obres","aco_odata","aco_odata_core_v87104"].includes(base))return;
          const v=latestValue(base);
          if(v!==undefined&&v!==null)write(base,v);
        });

        const taskCount=Object.values(odataMerged||{}).reduce((s,d)=>s+(((d||{}).tasques||[]).length||0),0);
        const pendingTaskCount=Object.values(odataMerged||{}).reduce((s,d)=>s+(((d||{}).tasques||[]).filter(t=>!taskIsClosed878183(t)).length||0),0);
        setStatus(`Dades importades com a còpia autoritzada de l’usuari ${active}. Clients: ${clientsMerged.length}. Expedients: ${obresMerged.length}. Tasques totals: ${taskCount}. Pendents visibles a Inici: ${pendingTaskCount}. Blocs escrits: ${count}. Recarregant l’app...`);
        setTimeout(()=>window.location.reload(),900);
      }catch(err){setStatus("Error important JSON: "+String(err?.message||err))}
    };
    reader.readAsText(file);
  }
  function cleanNow878185(){
    const before=localStorageBytes878185();
    const r=cleanupLocalStorage878185(user,"deep");
    const after=localStorageBytes878185();
    setStatus(`Neteja feta. Abans: ${before.mb} MB. Ara: ${after.mb} MB. Claus eliminades: ${r.removed}. Blocs alleugerits: ${r.rewritten}.`);
  }
  const usage878185=localStorageBytes878185();
  return <Card title="Còpia de seguretat / traspàs de dades JSON" action={<div className="actions-inline"><button className="primary" onClick={exportJson}>Exportar JSON segur</button><button className="secondary" onClick={()=>fileRef.current?.click()}>Importar JSON</button><button className="secondary" onClick={cleanNow878185}>Netejar espai local</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={e=>importJson(e.target.files?.[0])}/></div>}>
    <div className="module-note-v8738"><b>V87.185 · guardat segur.</b><span>Ús local aproximat: {usage878185.mb} MB / {usage878185.keys} claus. L’exportació elimina logos/base64 però manté clients, expedients, tasques, pressupostos, partides i descompostos. Si el navegador torna a donar quota plena, l’app intenta guardar en mode lleuger i mostra avís.</span></div>
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
[odata,setOdata]=useState({}),
[partidaLibrary,setPartidaLibrary]=useState([]);
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
  setClients([]);setObres([]);setOdata({});setPartidaLibrary([]);setObraId("");setClientId("");
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
    // V87.211: no es recuperen automàticament annexos des de claus antigues.
    // Una recuperació només pot entrar mitjançant una importació JSON explícita.
  }catch(e){
    console.error("Recuperació segura de login",e);
    backupUserState8785(authUser8779,"load_error",{message:String(e?.message||e)});
    c=isHector?sanitizeClients8785(clients0,[]).map(cleanClientFiscal87102):[];
    o=isHector?sanitizeObres8785(obres0,[]):[];
    d=isHector?sanitizeOdata8785(data0,{}):{};
  }
  setClients(c);setObres(o);setOdata(d);setPartidaLibrary(migratePartidaLibrary87196(c,authUser8779));
  setClientId(c[0]?.id||"");setObraId(o[0]?.id||"");setTab("Resum");setScreen("Inici");
  setDataLoadedUser8781(authUser8779);
},[authUser8779]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779)lsSet8779("aco_clients",JSON.stringify(stripHeavy878185(clients)),authUser8779)},[clients,authUser8779,dataLoadedUser8781]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779)lsSet8779("aco_obres",JSON.stringify(stripHeavy878185(obres)),authUser8779)},[obres,authUser8779,dataLoadedUser8781]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779)saveOdata878104(odata,authUser8779)},[odata,authUser8779,dataLoadedUser8781]);
useEffect(()=>{if(authUser8779&&dataLoadedUser8781===authUser8779)lsSet8779("aco_partides_library_v87196",JSON.stringify(stripHeavy878185(dedupePartidaLibrary87196(partidaLibrary))),authUser8779)},[partidaLibrary,authUser8779,dataLoadedUser8781]);
useEffect(()=>{
  if(!authUser8779||dataLoadedUser8781!==authUser8779)return;
  const cfg=getSyncCfg878121();
  if(!isSyncReady878121(cfg)||!cfg.auto)return;
  const t=setTimeout(()=>pushStateToSupabase878121({clients,obres,odata,partidaLibrary},authUser8779).catch(e=>console.warn("Supabase sync pendent",e)),1400);
  return()=>clearTimeout(t);
},[clients,obres,odata,partidaLibrary,authUser8779,dataLoadedUser8781]);
useEffect(()=>{
  if(authUser8779&&dataLoadedUser8781===authUser8779&&needsExpedientCodeRepair878191(obres)){
    setObres(p=>assignMissingCodes8739(p,clients));
  }
},[authUser8779,dataLoadedUser8781,obres,clients]);
const obraBase=obres.find(o=>o.id===obraId)||obres[0]||{id:"",client:"",nom:"Sense expedient",propietat:"Client pendent",nifPropietat:"Pendent",adreca:"",poblacio:"",tipusTreball:"Altres",tipologia:"Altres",estat:"Pendent",any:String(new Date().getFullYear())};
const obraSnapshot=(obraBase?.id&&odata?.[obraBase.id]?.obra)?odata[obraBase.id].obra:{};
const obra=applyWorkTemplate878121({...obraBase,...obraSnapshot,id:obraBase.id||obraSnapshot.id||""},obraSnapshot.tipusTreball||obraBase.tipusTreball||obraBase.tipologia,false);
const client=clients.find(c=>c.id===obra?.client)||{id:"",nom:obra?.propietat||"Client pendent",rao:obra?.propietat||"Client pendent",nif:obra?.nifPropietat||"Pendent",email:"Pendent",telefon:"Pendent",adreca:obra?.adreca||"Pendent",logo:""}, data=obra?.id?normalizeBudgetedData8791(odata[obra.id]||empty()):empty();
const fObres=obres.filter(o=>{let c=clients.find(x=>x.id===o.client);return(!oc||o.client===oc)&&(!oy||o.any===oy)&&(!ost||normalizeExpedientStatus878136(o.estat)===normalizeExpedientStatus878136(ost))&&(!ot||canonicalWorkType8740(o.tipusTreball||o.tipologia)===ot)&&((expedientCode8739(o)+" "+o.nom+" "+o.subtitol+" "+moduleLabel8737(o)+" "+(o.adreca||"")+" "+(o.poblacio||"")+" "+(c?.nom||"")).toLowerCase().includes(os.toLowerCase()))});
const byClient=useMemo(()=>{let m={};fObres.forEach(o=>{m[o.client]??={};m[o.client][o.any]??=[];m[o.client][o.any].push(o)});return m},[fObres]);
const setD=(id,up)=>{
  const now=new Date().toISOString();
  setOdata(p=>{
    const current=normalizeBudgetedData8791(p[id]||empty());
    const rawNext=typeof up==="function"?up(current):up;
    const next=normalizeBudgetedData8791({...rawNext,updatedAt:now});
    const economicGuard878214=guardEconomicWrite878214(current,next,id);
    if(economicGuard878214.blocked){
      warnEconomicGuard878214(economicGuard878214);
      return p;
    }
    return {...p,[id]:next};
  });
  if(id)setObres(prev=>prev.map(o=>o.id===id?{...o,updatedAt:now}:o));
};
function nav(s){setScreen(s);setMenuOpen(false)}
function openObra(id){
  const now=new Date().toISOString();
  setObraId(id);setTab("Resum");setSelActa(null);
  if(id){
    setObres(prev=>prev.map(o=>o.id===id?{...o,lastOpenedAt:now,lastWorkedAt:now,updatedAt:now}:o));
    setOdata(prev=>({...prev,[id]:{...(prev[id]||empty()),lastOpenedAt:now,lastWorkedAt:now,updatedAt:now}}));
  }
  nav("Obra")
}
function openObraTab(id,t){
  const now=new Date().toISOString();
  setObraId(id);setTab(t||"Resum");setSelActa(null);
  if(id){
    setObres(prev=>prev.map(o=>o.id===id?{...o,lastOpenedAt:now,lastWorkedAt:now,updatedAt:now}:o));
    setOdata(prev=>({...prev,[id]:{...(prev[id]||empty()),lastOpenedAt:now,lastWorkedAt:now,updatedAt:now}}));
  }
  nav("Obra")
}
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
function allAgents8749(odata={},clients=[]){
  const hidden=hiddenAgentIdentities878192(odata);
  const out=[];
  try{
    for(const d of Object.values(odata||{})){
      if(!d||typeof d!=="object")continue;
      if(Array.isArray(d.agents)){
        for(const a of d.agents){
          if(a&&typeof a==="object"&&!hidden.has(agentLibraryIdentity878191(a)))out.push(a);
        }
      }
    }
  }catch{}
  for(const c of (clients||[])){
    const agent=clientAsAgent878192(c);
    if(agent&&!hidden.has(agentLibraryIdentity878191(agent)))out.push(agent);
  }
  return sortAgents878134(uniqAgents8749(out));
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
  // V87.156 · evita que OBSERVACIONS / FORMA DE PAGAMENT s'enganxin com a descripció llarga de l'última partida.
  function splitBudgetNotesFromImportedRows878156(rows=[]){
    const obsLines=[];
    const payLines=[];
    const cleanMarker=(txt,kind)=>String(txt||"")
      .replace(/^(observacions|observaciones)\s*:?\s*/i,"")
      .replace(/^(forma\s+de\s+pagament|forma\s+de\s+pago|forma\s+de\s+pagamento)\s*:?\s*/i,"")
      .trim();
    function addTail(tail){
      let mode="obs";
      String(tail||"").split(/\r?\n/).forEach(raw=>{
        let line=String(raw||"").trim();
        if(!line)return;
        const n=norm(line);
        if(n.includes("observacions")||n.includes("observaciones")){mode="obs"; line=cleanMarker(line,mode); if(!line)return;}
        if(n.includes("forma de pagament")||n.includes("forma de pago")||n.includes("forma de pagamento")){mode="pay"; line=cleanMarker(line,mode); if(!line)return;}
        if(mode==="pay")payLines.push(line); else obsLines.push(line);
      });
    }
    const cleaned=(rows||[]).map(r=>{
      const desc=String(r?.desc||"");
      const m=desc.search(/\b(OBSERVACIONS|OBSERVACIONES|FORMA\s+DE\s+PAGAMENT|FORMA\s+DE\s+PAGO|FORMA\s+DE\s+PAGAMENTO)\b/i);
      if(m<0)return r;
      addTail(desc.slice(m));
      return {...r,desc:desc.slice(0,m).trim()};
    });
    return {rows:cleaned,observacions:obsLines.join("\n").trim(),formaPagament:payLines.join("\n").trim()};
  }

  // V87.153 · lector estàndard de pressupost ràpid: partida/codi/unitat/descripció/quantitat/preu unitari/total
  function standardBudgetMap878153(row){
    const h=(row||[]).map(norm);
    function findAny(names){
      for(const name of names){const i=h.findIndex(x=>x===name);if(i>=0)return i}
      for(const name of names){const i=h.findIndex(x=>x.includes(name));if(i>=0)return i}
      return -1;
    }
    const partidaNum=findAny(["numero partida","número partida","nº partida","num partida","n partida","partida nº","partida num","nº","núm","num","numero","número","n.","partida"]);
    const codi=findAny(["codi","codigo","código","codigo partida","codi partida","cod"]);
    const ud=findAny(["unitat","unidad","ut","ud","u"]);
    const resum=findAny(["descripcio","descripción","descripcion","descripcio partida","descripcion partida","concepte","concepto","resum","resumen"]);
    const q=findAny(["quantitat","cantidad","amidament","medicion","medición","canpres","can pres","q","qty"]);
    const pu=findAny(["preu unitari","precio unitario","preu/ut","precio/ud","preu","precio","pu","prpres","pr pres"]);
    const imp=findAny(["total","import","importe","imppres","imp pres","import total"]);
    if((codi>=0||partidaNum>=0) && ud>=0 && resum>=0 && q>=0 && pu>=0 && imp>=0){
      return {codi:codi>=0?codi:partidaNum,partidaNum,ud,resum,q,pu,imp,nat:-1,hasNat:false,standard878153:true};
    }
    return null;
  }
  
function parseRows(rows,sheetName){
    const headerIndex=Math.max(0,rows.findIndex(looksHeader));
    const stdIdx878153=standardBudgetMap878153(rows[headerIndex]||[]);
    const idx=stdIdx878153||headerMap(rows[headerIndex]||[]);
    let out=[];
    let cap="PRESSUPOST IMPORTAT";
    let last=null;

    for(const row of rows.slice(headerIndex+1)){
      if(!row || !row.some(x=>clean(x)))continue;
      const cells=nonEmptyCells(row);
      if(!cells.length)continue;

      const A=clean(row[idx.codi]) || (idx.partidaNum>=0?clean(row[idx.partidaNum]):"");
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

  // V87.154 · quan un Excel té full PRESSUPOST + fulls AMIDAMENTS/DESCOMPOST,
  // no s'ha d'escollir el full amb més línies, sinó el full de pressupost real.
  function excelSheetScore878154(parsed,rows,sheetName){
    if(!parsed?.rows?.length)return -999999;
    const sn=norm(sheetName||"");
    const head=(rows||[]).slice(0,35).map(r=>(r||[]).map(norm).join(" ")).join(" | ");
    let score=0;
    if(sn.includes("pressupost")||sn.includes("presupuesto")||sn.includes("budget"))score+=1200;
    if(sn.includes("descompost")||sn.includes("descompos")||sn.includes("descompuesto")||sn.includes("descomp"))score-=900;
    if(sn.includes("amidament")||sn.includes("medicion")||sn.includes("medición"))score-=700;
    if(sn.includes("config"))score-=900;
    if(head.includes("pressupost")||head.includes("presupuesto"))score+=300;
    if((head.includes("codi")||head.includes("codigo")||head.includes("código")) && (head.includes("unitat")||head.includes("unidad")) && (head.includes("descrip")||head.includes("concepte")||head.includes("concepto")) && (head.includes("quantitat")||head.includes("cantidad")||head.includes("amidament")) && (head.includes("preu unitari")||head.includes("precio unitario")||head.includes("preu")||head.includes("precio")) && (head.includes("import")||head.includes("importe")||head.includes("total")))score+=500;
    // Es valora tenir imports reals, però sense deixar que DESCOMPOST guanyi només per tenir moltes línies.
    score+=Math.min(parsed.rows.length,10)*8;
    score+=Math.min(parsed.caps||0,5)*4;
    score+=Math.min(parsed.total||0,100000)/100000;
    return score;
  }

  try{
    const ab=await file.arrayBuffer();
    const wb=XLSX.read(ab,{type:"array",cellDates:false});
    let best={rows:[],sheet:"",caps:0,total:0};
    let bestScore=-999999;
    for(const sheetName of wb.SheetNames){
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      const parsed=parseRows(rows,sheetName);
      const score=excelSheetScore878154(parsed,rows,sheetName);
      if(score>bestScore || (score===bestScore && (parsed.rows.length>best.rows.length || (parsed.rows.length===best.rows.length && parsed.caps>best.caps)))){best=parsed;bestScore=score;}
    }
    if(!best.rows.length)throw new Error("No s'han detectat partides. Revisa que l'Excel tingui capçaleres tipus Partida/Codi, Unitat, Descripció, Quantitat, Preu unitari i Total.");
    const notes878156=splitBudgetNotesFromImportedRows878156(best.rows);
    best={...best,rows:notes878156.rows,observacions:notes878156.observacions,formaPagament:notes878156.formaPagament};

    const currentData878122=normalizeBudgetedData8791(odata?.[obraId]||data||empty());
    const originalBid878122=activeBudgetId8786;
    let targetBid878122=originalBid878122;
    let newGroup878122=null;
    const existingRows878122=(currentData878122.partides||[]).filter(r=>(r.budgetId||"principal")===originalBid878122);
    const existingCerts878122=(currentData878122.certificacions||[]).filter(c=>(c.budgetId||"principal")===originalBid878122);
    const existingFacts878122=(currentData878122.factures||[]).filter(f=>(f.budgetId||"principal")===originalBid878122);
    const currentLabel878122=budgetLabel8786(currentData878122,originalBid878122);
    createLocalRecoverySnapshot878122({clients,obres,odata},`Abans d'importar Excel "${file.name}" a ${obra?.nom||obraId}`,authUser8779);
    if(existingRows878122.length||existingCerts878122.length||existingFacts878122.length){
      const resum=`El pressupost actiu "${currentLabel878122}" ja té ${existingRows878122.length} partides, ${existingCerts878122.length} certificacions i ${existingFacts878122.length} factures.`;
      let createNew=true;
      if(existingCerts878122.length||existingFacts878122.length){
        alert(`${resum}\n\nPer seguretat, l'Excel NO substituirà aquest pressupost perquè hi ha certificacions/factures. S'importarà com a nou pressupost/annex independent.`);
      }else{
        createNew=!confirm(`${resum}\n\nVols SUBSTITUIR les partides del pressupost actiu?\n\nD'acord = substituir partides del pressupost actiu.\nCancel·lar = crear un nou pressupost/annex independent i conservar tota la feina existent.`);
      }
      if(createNew){
        targetBid878122="bg-import-"+Date.now();
        newGroup878122={id:targetBid878122,nom:`Importació segura · ${file.name}`.slice(0,90),tipus:"Importació Excel segura",createdAt:new Date().toISOString(),sourceBudgetId:originalBid878122};
      }
    }

    setD(obraId,d=>{
      const bid=targetBid878122;
      const seedGroups=newGroup878122?[...(d.budgetGroups||[]),newGroup878122]:(d.budgetGroups||[]);
      const rowsWithBudget=best.rows.map(r=>({...r,q:qty2(parseNum8770(r.q)||0),pu:qty2(parseNum8770(r.pu)||0),budgetId:bid}));
      const replacingExisting=bid===originalBid878122;
      const oldPartides=replacingExisting?(d.partides||[]).filter(r=>(r.budgetId||"principal")!==bid):(d.partides||[]);
      // V87.122: no s'esborren certificacions ni factures durant una importació Excel.
      // Si el pressupost tenia certificacions/factures, l'Excel entra com annex nou.
      const oldCerts=d.certificacions||[];
      const oldFacts=d.factures||[];
      const oldPress=(d.pressupostos||[]).filter(p=>(p.budgetId||"principal")!==bid || (!String(p.id||"").startsWith("budget-marker-")&&p.versio!=="Annex"));
      const currentGroups=ensureBudgetGroups8786({...d,budgetGroups:seedGroups,partides:[...oldPartides,...rowsWithBudget],pressupostos:[...oldPress]}).groups;
      const adjustedGroups=currentGroups.map(g=>g.id===bid&&bid!=="principal"&&(!g.tipus||g.tipus==="Nou pressupost"||g.tipus==="Fora pressupost")?{...g,tipus:newGroup878122?.tipus||"Modificat aprovat"}:g);
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
          budgetNom:groupName,
          versio:"v"+String(oldPress.filter(p=>(p.budgetId||"principal")===bid).length+1).padStart(2,"0"),
          data:new Date().toLocaleDateString("ca-ES"),
          nom:file.name,
          estat:`${groupName} · Importat · ${best.rows.length} partides · ${best.caps||1} capítols · ${best.sheet}`,
          import:best.total,
          updatedAt:new Date().toISOString()
        }],
        pressupostRapidObservacions: best.observacions || d.pressupostRapidObservacions || "",
        pressupostRapidFormaPagament: best.formaPagament || d.pressupostRapidFormaPagament || "",
        pressupostRapidData: d.pressupostRapidData || todayISO8743(),
        updatedAt:new Date().toISOString()
      };
    });
    alert(`${newGroup878122?"Importació segura creada com a nou pressupost/annex":"Pressupost importat correctament"}: ${best.rows.length} partides en ${best.caps||1} capítols. S'ha guardat una còpia local de recuperació abans d'importar.`);
  }catch(err){
    setD(obraId,d=>({...d,pressupostos:[...(d.pressupostos||[]),{id:"p"+Date.now(),budgetId:activeBudgetId8786,versio:"v"+String((d.pressupostos||[]).filter(p=>(p.budgetId||"principal")===activeBudgetId8786).length+1).padStart(2,"0"),data:new Date().toLocaleDateString("ca-ES"),nom:file.name,estat:"Error lectura Excel: "+String(err?.message||err),import:0}]}));
  }
  if(e?.target)e.target.value="";
}

function deletePressupostVersion(id){
  setD(obraId,d=>{
    const norm=normalizeBudgetedData8791(d||empty());
    const removed=(norm.pressupostos||[]).find(p=>String(p.id)===String(id));
    if(!removed){alert("No he trobat aquesta versió de pressupost.");return norm;}
    const bid=removed?.budgetId||"principal";
    const budgetName=budgetLabel8786(norm,bid);
    const rowsCount=(norm.partides||[]).filter(r=>(r.budgetId||"principal")===bid).length;
    const certCount=(norm.certificacions||[]).filter(c=>(c.budgetId||"principal")===bid).length;
    const factCount=(norm.factures||[]).filter(f=>(f.budgetId||"principal")===bid).length;

    // V87.175: si és un annex/importació, eliminar una versió ha d'eliminar TOT el pressupost associat.
    // Fins ara, si quedava un marcador o una altra versió amb el mateix budgetId, les partides no s'eliminaven.
    if(bid!=="principal"){
      const ok=confirm(`Eliminar TOT el pressupost/annex "${budgetName}"?

S'eliminaran ${rowsCount} partides, ${certCount} certificacions i ${factCount} factures vinculades a aquest pressupost.

Aquesta acció no tocarà el pressupost principal ni altres annexos.`);
      if(!ok)return norm;
      return normalizeBudgetedData8791({
        ...norm,
        budgetGroups:(norm.budgetGroups||[]).filter(g=>g.id!==bid),
        pressupostos:(norm.pressupostos||[]).filter(p=>(p.budgetId||"principal")!==bid),
        partides:(norm.partides||[]).filter(r=>(r.budgetId||"principal")!==bid),
        certificacions:(norm.certificacions||[]).filter(c=>(c.budgetId||"principal")!==bid),
        factures:(norm.factures||[]).filter(f=>(f.budgetId||"principal")!==bid),
        activeBudgetIdObra:"principal",
        updatedAt:new Date().toISOString()
      });
    }

    // Pressupost principal: per seguretat no esborrem partides/certificacions sense una confirmació específica.
    const hasWork=rowsCount||certCount||factCount;
    if(hasWork){
      const ok=confirm(`Aquesta versió pertany al pressupost principal.

D'acord = eliminar NOMÉS aquesta fitxa/registre de versió.
Cancel·lar = no fer res.

Per buidar totes les partides del pressupost principal, fes-ho des del mode edició/capítols.`);
      if(!ok)return norm;
    }else if(!confirm("Eliminar aquesta versió de pressupost?")){
      return norm;
    }
    return normalizeBudgetedData8791({
      ...norm,
      pressupostos:(norm.pressupostos||[]).filter(p=>String(p.id)!==String(id)),
      updatedAt:new Date().toISOString()
    });
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
    const activeBid=d.activeBudgetIdObra||"principal";
    const certs=(d.certificacions||[]).filter(c=>(c.budgetId||"principal")===activeBid);
    const nextNum=(certs.reduce((m,c)=>Math.max(m,+c.numero||0),0)||0)+1;
    const nova={id:"c"+Date.now(),budgetId:activeBid,numero:String(nextNum),data:todayShort8713(),estat:"Pendent",import:0};
    return {...d,certificacions:[...(d.certificacions||[]),nova]};
  });
}
function updateCert(codi,fieldOrValue,value){
let field=value===undefined?"certActual":fieldOrValue;
let raw=value===undefined?fieldOrValue:value;
let n=parseNum8770(raw);
if(!Number.isFinite(n))n=0;
setD(obraId,d=>({...d,partides:d.partides.map(r=>{
  const activeBid=d.activeBudgetIdObra||"principal";
  if((r.budgetId||"principal")!==activeBid||r.codi!==codi)return r;
  const next={...r,[field]:n};
  if(String(field).startsWith("cert_")){
    const certKey=String(field).replace("cert_","");
    next.certsByNum={...(r.certsByNum||{}),[certKey]:n};
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
  const now=new Date().toISOString();
  const cleanPatch={...patch,updatedAt:now};
  if(cleanPatch.tipusTreball||cleanPatch.tipologia){
    const tipus=canonicalWorkType8740(cleanPatch.tipusTreball||cleanPatch.tipologia);
    Object.assign(cleanPatch,applyWorkTemplate878121(cleanPatch,tipus,false));
  }
  // V87.120: guardat reforçat. La fitxa de l'expedient viu a la llista d'obres,
  // però també en deixem una còpia dins odata per evitar perdre canvis si es canvia de pestanya o es recarrega ràpid.
  setOdata(prev=>{
    const current=normalizeBudgetedData8791(prev[obraId]||empty());
    const next={...prev,[obraId]:normalizeBudgetedData8791({...current,obra:{...(current.obra||{}),...cleanPatch},updatedAt:now})};
    try{saveOdata878104(next,authUser8779)}catch(e){}
    return next;
  });
  setObres(prev=>{
    const next=prev.map(o=>o.id===obraId?{...o,...cleanPatch}:o);
    try{lsSet8779("aco_obres",JSON.stringify(next),authUser8779)}catch(e){}
    return next;
  });
}
function saveCert(){
  const n=+certInfo.num;
  setD(obraId,d=>{
    const activeBid=d.activeBudgetIdObra||"principal";
    const rows=(d.partides||[]).filter(r=>(r.budgetId||"principal")===activeBid);
    const total=rows.reduce((s,r)=>s+certQty8783(r,n)*parseNum8770(r.pu),0);
    const rest=(d.certificacions||[]).filter(c=>!((c.budgetId||"principal")===activeBid&&+c.numero===n));
    const cert={id:"c"+Date.now(),budgetId:activeBid,numero:String(n),data:certInfo.data,estat:"Guardada",import:total,updatedAt:new Date().toISOString()};
    return {...d,certificacions:[...rest,cert].sort((a,b)=>String(a.budgetId||"principal").localeCompare(String(b.budgetId||"principal"))||(+a.numero)-(+b.numero))};
  });
}
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
function addAgent(e){e.preventDefault();let f=new FormData(e.currentTarget);setD(obraId,d=>({...d,agents:[...d.agents,{id:"a"+Date.now(),nom:f.get("nom"),rol:f.get("rol"),empresa:f.get("empresa"),email:f.get("email"),telefon:f.get("telefon"),nif:f.get("nif"),adreca:f.get("adreca"),collegiat:f.get("collegiat")}]}));setModal(null)}
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
  const rawTipus=String(f.get("tipusTreball")||"").trim();
  const rawAltres=String(f.get("tipusTreballAltres")||"").trim();
  const tipus=selectedWorkType878150(rawAltres||rawTipus||"Altres");
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
    estat:String(f.get("estat")||"Pressupostat"),
    pressupost:0,
    certificacio:0,
    propietat:propietatRaw&&propietatRaw!=="Pendent"?propietatRaw:clientFinal.nom,
    nifPropietat:String(f.get("nifPropietat")||clientFinal.nif||"Pendent"),
    constructor:String(f.get("constructora")||f.get("constructor")||"Pendent"),
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
  const isBudgetFlow878152=tipus==="Pressupost d’obra / amidaments"||tipus==="Elaboració de pressupost per client";
  Object.assign(obraNew,applyWorkTemplate878121({
    ...obraNew,
    definicioFeina:String(f.get("definicioFeina")||""),
    direccioObraText:String(f.get("direccioObraText")||"")
  },tipus,isBudgetFlow878152));
  obraNew.tipusTreball=tipus;
  obraNew.tipologia=tipus;
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
function addEvent(e){e.preventDefault();let f=new FormData(e.currentTarget);
  const data=String(f.get("data")||"").trim();
  const dt=data?new Date(data):new Date(Number(f.get("year"))||calY,Number(f.get("month"))||calM,Number(f.get("day"))||selDay||1);
  const obraForm=String(f.get("obra")||"");
  const clientForm=String(f.get("client")||"");
  const obraMatch=(obres||[]).find(o=>o.id===obraForm||o.nom===obraForm);
  const title=String(f.get("title")||f.get("titol")||"Nova cita");
  const item={id:"e"+Date.now(),obraId:obraMatch?.id||obraId,data:data||todayISO8743(),day:dt.getDate(),month:dt.getMonth(),year:dt.getFullYear(),title,type:f.get("type")||"Nota",tipus:f.get("type")||"Nota",hora:f.get("hora")||"09:00",note:f.get("note")||f.get("detail")||"",detail:f.get("detail")||f.get("note")||"",color:f.get("color")||"blue",client:clientForm==="__nou__"?String(f.get("clientNou")||""):(clientForm||client?.nom||""),obra:obraForm==="__nova__"?String(f.get("obraNova")||""):(obraMatch?.nom||obraForm||obra?.nom||""),adreca:f.get("adreca")||obraMatch?.adreca||obra?.adreca||""};
  setD(item.obraId||obraId,d=>({...d,events:[...(d.events||[]),item]}));setModal(null)}
function addManualHours(e){e.preventDefault();let f=new FormData(e.currentTarget);let hi=f.get("inici"),hf=f.get("final");let h=calcHours(hi,hf);setD(obraId,d=>({...d,hores:[...d.hores,{id:"h"+Date.now(),data:f.get("data"),etiqueta:f.get("etiqueta"),tasca:f.get("tasca"),inici:hi,final:hf,hores:h,preu:+f.get("preu")||50}]}))}
function startTimer(){setTimer(t=>({...t,running:true,start:Date.now(),elapsed:0}))}
function stopTimer(){let h=Math.max(timer.elapsed/3600000,0.01);setD(obraId,d=>({...d,hores:[...d.hores,{id:"h"+Date.now(),data:new Date().toLocaleDateString("ca-ES"),etiqueta:timer.label,tasca:timer.task||"Temps cronometrat",inici:"—",final:"—",hores:h,preu:+timer.rate||50}]}));setTimer(t=>({...t,running:false,start:null,elapsed:0,task:""}))}
function deleteHour(id){setD(obraId,d=>({...d,hores:d.hores.filter(h=>h.id!==id)}))}
function calcHours(a,b){let [ah,am]=String(a).split(":").map(Number),[bh,bm]=String(b).split(":").map(Number);let mins=(bh*60+bm)-(ah*60+am);return Math.max(mins/60,0)}


if(!authOk8778)return <LoginScreen8778 onLogin={(u)=>setAuthUser8779(u)}/>;
return <><div className="user-global-badge-v8782"><span>USUARI ACTIU</span><b>{authUser8779}</b></div><div className={`app-shell ${collapsed?"nav-collapsed":""}`}>{menuOpen&&<div className="overlay" onClick={()=>setMenuOpen(false)}/>}<aside className={`sidebar ${menuOpen?"open":""}`}><div className="sidebar-head"><div className="brand">APP CONTROL D'OBRES</div><div className="active-user-v8780">Usuari: <b>{authUser8779}</b></div><button className="logout-mini-v8778" title="Sortir" onClick={()=>{sessionStorage.removeItem("aco_current_user8779");setClients([]);setObres([]);setOdata({});setPartidaLibrary([]);setAuthUser8779("")}}>Sortir</button><button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)}><Menu size={20}/></button><button className="close-menu" onClick={()=>setMenuOpen(false)}><X/></button></div><nav className="side-nav"><MB a={screen==="Inici"} i={<Building2/>} l={tt("Inici","Inicio","Home")} on={()=>nav("Inici")}/><MB a={screen==="Clients"||screen==="Fitxa client"} i={<Users/>} l={tt("Clients","Clientes","Clients")} on={()=>nav("Clients")}/><MB a={screen==="Agents"} i={<Users/>} l="Agents" on={()=>nav("Agents")}/><MB a={screen==="Treballs / Expedients"||screen==="Obra"} i={<FolderOpen/>} l={tt("Treballs / Expedients","Trabajos / Expedientes","Jobs / Files")} on={()=>nav("Treballs / Expedients")}/><MB a={screen==="Pressupostos"} i={<ClipboardList/>} l={tt("Pressupostos","Presupuestos","Quotes")} on={()=>nav("Pressupostos")}/><MB a={screen==="Llibreria"} i={<BookOpen/>} l="Llibreria" on={()=>nav("Llibreria")}/><MB a={screen==="Factures"} i={<ReceiptText/>} l={tt("Factures","Facturas","Invoices")} on={()=>nav("Factures")}/><MB a={screen==="Traça"} i={<ReceiptText/>} l={tt("Gestió temps","Gestión tiempo","Time tracking")} on={()=>nav("Traça")}/><MB a={screen==="Agenda"} i={<CalendarDays/>} l={tt("Agenda / Calendari","Agenda / Calendario","Calendar")} on={()=>nav("Agenda")}/><MB a={screen==="Configuració"} i={<Settings/>} l={tt("Configuració","Configuración","Settings")} on={()=>nav("Configuració")}/></nav></aside><main className="main"><div className="mobile-top"><button onClick={()=>setMenuOpen(true)} className="hamb"><Menu/></button><b>CONTROL D'OBRES</b></div>
{screen!=="Inici"&&<MobileBackBar878146 screen={screen} goBack={()=>{if(screen==="Obra")nav("Treballs / Expedients");else if(screen==="Fitxa client")nav("Clients");else nav("Inici")}}/>}
{screen==="Inici"&&<Inici clients={clients} setClients={setClients} obres={obres} setObres={setObres} odata={odata} setOdata={setOdata} events={[...Object.values(odata).flatMap(d=>d.events||[]),...invoiceAlerts8776(obres,odata)]} setScreen={nav} openObra={openObra} openObraTab={openObraTab} newObra={()=>setModal("obra")}/>}
{screen==="Clients"&&<SafeRenderBoundary878108><Clients clients={clients} obres={obres} odata={odata} cs={cs} setCs={setCs} ct={ct} setCt={setCt} openClient={openClient} newClient={()=>setModal("client")} setClients={setClients} setObres={setObres}/></SafeRenderBoundary878108>}
{screen==="Fitxa client"&&<FitxaClient client={clients.find(c=>c.id===clientId)} obres={obres.filter(o=>o.client===clientId)} openObra={openObra} back={()=>nav("Clients")}/>}
{screen==="Agents"&&<SafeRenderBoundary878108><AgentsGeneral878188 odata={odata} setOdata={setOdata} clients={clients}/></SafeRenderBoundary878108>}
{screen==="Treballs / Expedients"&&<Projectes byClient={byClient} clients={clients} openObra={openObra} deleteObra={deleteObra878112} f={{os,setOs,oc,setOc,oy,setOy,ost,setOst,ot,setOt}} newObra={()=>setModal("obra")} setScreen={nav}/>}
{screen==="Obra"&&<Obra obra={obra} client={client} clients={clients} setClients={setClients} allAgents={allAgents8749(odata,clients)} data={data} setData={up=>setD(obraId,up)} tab={tab} setTab={setTab} setScreen={nav} uploadImage={file=>f2u(file,u=>setObres(p=>p.map(o=>o.id===obraId?{...o,imatge:u}:o)))} importExcel={importExcel} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} updateCert={updateCert} updateObraFitxa8721={updateObraFitxa8721} deleteCertificacio8721={deleteCertificacio8721} updateCertDate8721={updateCertDate8721} addCertificacio={addCertificacio} updateCertDate={updateCertDate} certInfo={certInfo} setCertInfo={setCertInfo} saveCert={saveCert} openEmail={emailDraft} openDoc={openDocSmart87103} openAgent={()=>setModal("agent")} openActa={()=>setModal("acta")} openPartida={()=>setModal("partida")} openEvent={()=>setModal("event")} selectedActaId={selActa} setSelectedActaId={setSelActa} timer={timer} setTimer={setTimer} startTimer={startTimer} stopTimer={stopTimer} addManualHours={addManualHours} deleteHour={deleteHour} addPressupostTecnic={addPressupostTecnic8742} updatePressupostTecnic={updatePressupostTecnic8742} facturarPressupostTecnic={facturarPressupostTecnic8742} addFacturaTecnica={addFacturaTecnica8742} updateFacturaTecnica={updateFacturaTecnica8743} deletePressupostTecnic={deletePressupostTecnic8744} deleteFacturaTecnica={deleteFacturaTecnica8744} deleteObra={deleteObra878112} clientBudgetNumbers878194={clientBudgetNumbers878194(obres,odata,obra?.client,obra?.id)} clientHistoricalPartides={(obres||[]).filter(o=>o.client===obra?.client).flatMap(o=>(((odata||{})[o.id]?.partides)||[]).map(r=>({...r,sourceObra:o.nom,sourceObraId:o.id})))} partidaLibrary={partidaLibrary} setPartidaLibrary={setPartidaLibrary}/>}
{screen==="Agenda"&&<SafeRenderBoundary878108><Agenda events={[...Object.entries(odata||{}).flatMap(([oid,d])=>Array.isArray(d?.events)?d.events.map(e=>({...e,obraId:e.obraId||oid,client:e.client||clients.find(c=>c.id===obres.find(o=>o.id===oid)?.client)?.nom,obra:e.obra||obres.find(o=>o.id===oid)?.nom,adreca:e.adreca||obres.find(o=>o.id===oid)?.adreca})):[]),...invoiceAlerts8776(obres,odata)]} clients={clients} obres={obres} openObra={openObra} openEvent={()=>setModal("event")} calM={calM} setCalM={setCalM} calY={calY} setCalY={setCalY} selDay={selDay} setSelDay={setSelDay} setOdata={setOdata}/></SafeRenderBoundary878108>}
{screen==="Avisos"&&<AvisosPanel openObra={openObra}/>}
{screen==="Pressupostos"&&<SafeRenderBoundary878108><HonorarisGeneral obres={obres} odata={odata} setOdata={setOdata} openObra={openObra} openObraTab={openObraTab}/></SafeRenderBoundary878108>}
{screen==="Llibreria"&&<SafeRenderBoundary878108><PartidesLibraryGeneral87196 items={partidaLibrary} setItems={setPartidaLibrary} clients={clients} obres={obres} odata={odata}/></SafeRenderBoundary878108>}
{screen==="Factures"&&<SafeRenderBoundary878108><FacturesGeneral8738 obres={obres} odata={odata} setOdata={setOdata} openObra={openObra} openObraTab={openObraTab}/></SafeRenderBoundary878108>}
{screen==="Pressupostos honoraris"&&<HonorarisGeneral obres={obres} odata={odata} setOdata={setOdata} openObra={openObra}/>}{screen==="Configuració"&&<Configuracio clients={clients} obres={obres} odata={odata} partidaLibrary={partidaLibrary} setPartidaLibrary={setPartidaLibrary} setClients={setClients} setObres={setObres} setOdata={setOdata} authUser={authUser8779}/>} {screen==="Traça"&&<TracaGeneral obres={obres} odata={odata} openObra={openObra}/>} 
{modal==="client"&&<Modal title="Nou client" close={()=>setModal(null)}><FormClient onSubmit={addClient}/></Modal>}{modal==="obra"&&<Modal title="Nou expedient" close={()=>setModal(null)}><SafeFormExpedient8751 clients={clients} allAgents={allAgents8749(odata,clients)} onSubmit={addObra}/></Modal>}{modal==="partida"&&<Modal title="Nova partida" close={()=>setModal(null)}><FormPartida onSubmit={addPartida}/></Modal>}{modal==="agent"&&<Modal title="Nou agent de l’expedient" close={()=>setModal(null)}><FormAgent onSubmit={addAgent}/></Modal>}{modal==="acta"&&<Modal title="Nova acta d’expedient" close={()=>setModal(null)}><FormActa agents={ensureAgents8748(uniqAgents8749([...allAgents8749(odata,clients),...(data.agents||[])]))} openAgent={()=>setModal("agent")} onSubmit={addActa}/></Modal>}{modal==="event"&&<Modal title="Nova cita o nota" close={()=>setModal(null)}><FormEvent clients={clients} obres={obres} calM={calM} calY={calY} selDay={selDay} onSubmit={addEvent}/></Modal>}{email&&<EmailModal draft={email} setDraft={setEmail} close={()=>setEmail(null)}/>} {doc&&<DocViewer doc={doc} obra={obra} client={client} close={()=>setDoc(null)} email={emailDraft}/>}</main></div></>
}


function normalizeSearch878191(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function agentLibraryIdentity878191(a={}){
  const id=normalizeSearch878191(a.id);
  if(id&&!/(default|pendent|temp)/.test(id))return `id:${id}`;
  return `data:${[a.nom,a.email,a.empresa,a.rol].map(normalizeSearch878191).join("|")}`;
}
function hiddenAgentIdentities878192(odata={}){
  const d=odata?.__global_agents_878188;
  return new Set(Array.isArray(d?.hiddenAgentIdentities878192)?d.hiddenAgentIdentities878192.filter(Boolean):[]);
}
function clientAgentRole878192(client={}){
  const tipus=normalizeSearch878191(client.tipus||client.rol||"");
  if(tipus.includes("constructora")||tipus.includes("contractista"))return "Constructora / contractista";
  if(tipus.includes("industrial")||tipus.includes("subcontract"))return "Industrial";
  if(tipus.includes("arquitecte tecnic")||tipus.includes("aparellador"))return "Arquitecte tècnic";
  if(tipus.includes("arquitect"))return "Arquitecte";
  if(tipus.includes("administracio")||tipus.includes("ajuntament"))return "Administració";
  if(tipus.includes("promotor")||tipus.includes("propiet")||tipus.includes("immobili")||tipus.includes("particular")||tipus.includes("client"))return "Promotor / propietat";
  return "Altres";
}
function clientAsAgent878192(client={}){
  if(!client||typeof client!=="object"||!client.id||!String(client.nom||client.rao||"").trim())return null;
  const nom=String(client.nom||client.rao).trim();
  return {
    id:`client-agent-${client.id}`,
    nom,
    rol:clientAgentRole878192(client),
    empresa:client.rao||nom,
    email:client.email||"",
    telefon:client.telefon||"",
    nif:client.nif||"",
    adreca:[client.adreca,client.codiPostal,client.poblacio].filter(Boolean).join(" · "),
    sourceClientId878192:client.id,
    _fromClient878192:true
  };
}
function collectAgentsForGroup878191(odata={},clients=[],group="",query="",limit=120){
  if(!group)return {rows:[],total:0,limited:false};
  const q=normalizeSearch878191(query),found=new Map(),hidden=hiddenAgentIdentities878192(odata);
  const entries=Object.entries(odata||{}).sort(([a],[b])=>a==="__global_agents_878188"?-1:b==="__global_agents_878188"?1:0);
  const add=(agent,sourceKey)=>{
    if(!agent||typeof agent!=="object"||agentCategory878188(agent)!==group)return;
    const haystack=normalizeSearch878191([agent.nom,agent.rol,agent.empresa,agent.email,agent.telefon,agent.nif,agent.adreca].join(" "));
    if(q&&!haystack.includes(q))return;
    const identity=agentLibraryIdentity878191(agent);
    if(!identity||identity==="data:|||"||hidden.has(identity))return;
    const existing=found.get(identity);
    if(existing){existing._sourceKeys.push(sourceKey);return;}
    found.set(identity,{...agent,_identity878191:identity,_sourceKeys:[sourceKey]});
  };
  entries.forEach(([key,d])=>{if(d&&typeof d==="object"&&Array.isArray(d.agents))d.agents.forEach(a=>add(a,key))});
  (clients||[]).forEach(c=>add(clientAsAgent878192(c),`__client__:${c?.id||""}`));
  const all=[...found.values()].sort((a,b)=>agentRoleOrder878134(a)-agentRoleOrder878134(b)||String(a.nom||"").localeCompare(String(b.nom||""),"ca",{numeric:true,sensitivity:"base"}));
  return {rows:all.slice(0,limit),total:all.length,limited:all.length>limit};
}
function updateAgentLibrary878191(prev={},agent={},patch={},remove=false){
  const next={...(prev||{})};
  const identity=agent._identity878191||agentLibraryIdentity878191(agent);
  let changed=false;
  for(const [key,d] of Object.entries(prev||{})){
    if(!d||typeof d!=="object"||!Array.isArray(d.agents))continue;
    let touched=false;
    const agents=remove?d.agents.filter(a=>{const match=agentLibraryIdentity878191(a)===identity;if(match)touched=true;return !match;}):d.agents.map(a=>{
      if(agentLibraryIdentity878191(a)!==identity)return a;
      touched=true;
      return {...a,...patch,updatedAt:new Date().toISOString()};
    });
    if(touched){next[key]={...d,agents,updatedAt:new Date().toISOString()};changed=true;}
  }
  if(!changed&&!remove){
    const key="__global_agents_878188",d=next[key]||{},agents=Array.isArray(d.agents)?d.agents:[];
    next[key]={...d,agents:sortAgents878134([{...agent,...patch,id:agent.id||`agent-global-${Date.now()}`,createdAt:agent.createdAt||new Date().toISOString()},...agents]),updatedAt:new Date().toISOString()};
  }
  if(remove&&identity){
    const key="__global_agents_878188",d=next[key]||{},hidden=Array.isArray(d.hiddenAgentIdentities878192)?d.hiddenAgentIdentities878192:[];
    next[key]={...d,hiddenAgentIdentities878192:[...new Set([...hidden,identity])],updatedAt:new Date().toISOString()};
  }
  return next;
}
function AgentLibraryRow878191({agent,onSave,onDelete}){
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState(()=>({nom:agent.nom||"",rol:agent.rol||"Altres",empresa:agent.empresa||"",email:agent.email||"",telefon:agent.telefon||"",nif:agent.nif||""}));
  useEffect(()=>{if(!editing)setForm({nom:agent.nom||"",rol:agent.rol||"Altres",empresa:agent.empresa||"",email:agent.email||"",telefon:agent.telefon||"",nif:agent.nif||""})},[agent,editing]);
  const ch=(k,v)=>setForm(f=>({...f,[k]:v}));
  return <div className="agent-library-card-v878191">
    <div className="agent-library-summary-v878191"><div><div className="agent-name-line-v878192"><b>{agent.nom||"Agent sense nom"}</b>{agent._fromClient878192&&<em>Origen: client</em>}</div><span>{agent.rol||"Rol pendent"} · {agent.empresa||"Empresa/autònom pendent"}</span><small>{[agent.email,agent.telefon,agent.nif].filter(Boolean).join(" · ")||"Sense dades de contacte"}</small></div>{agent._fromClient878192?<button type="button" className="secondary" onClick={()=>onDelete(agent)}>Amagar d’Agents</button>:<button type="button" className="secondary" onClick={()=>setEditing(v=>!v)}>{editing?"Tancar":"Gestionar"}</button>}</div>
    {editing&&<div className="form-grid compact-v87151 agent-library-editor-v878191">
      <label><span>Nom</span><input value={form.nom} onChange={e=>ch("nom",e.target.value)}/></label>
      <label><span>Rol</span><select value={form.rol} onChange={e=>ch("rol",e.target.value)}>{AGENT_ROLE_OPTIONS878188.map(r=><option key={r}>{r}</option>)}</select></label>
      <label><span>Empresa</span><input value={form.empresa} onChange={e=>ch("empresa",e.target.value)}/></label>
      <label><span>Email</span><input value={form.email} onChange={e=>ch("email",e.target.value)}/></label>
      <label><span>Telèfon</span><input value={form.telefon} onChange={e=>ch("telefon",e.target.value)}/></label>
      <label><span>NIF/CIF</span><input value={form.nif} onChange={e=>ch("nif",e.target.value)}/></label>
      <div className="span-all actions-inline"><button type="button" className="primary" onClick={()=>{onSave(agent,form);setEditing(false)}}>Guardar canvis</button><button type="button" className="danger" onClick={()=>onDelete(agent)}>Eliminar</button></div>
    </div>}
  </div>
}
function AgentsGeneral878188({odata={},setOdata,clients=[]}){
  const [q,setQ]=useState("");
  const [openGroup,setOpenGroup]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [draft,setDraft]=useState({nom:"",rol:"Arquitecte tècnic",empresa:"",email:"",telefon:"",nif:""});
  const groups=["tecnic","constructora","promotor","administracio","altres"];
  const loaded=useMemo(()=>collectAgentsForGroup878191(odata,clients,openGroup,q,120),[odata,clients,openGroup,q]);
  function patchAgent(agent,patch){setOdata(prev=>updateAgentLibrary878191(prev,agent,patch,false))}
  function deleteAgent(agent){
    const missatge=agent._fromClient878192?"Amagar aquest client de la biblioteca d’agents? La seva fitxa continuarà intacta a Clients.":"Eliminar aquest agent de la biblioteca i dels expedients on consti?";
    if(!confirm(missatge))return;
    setOdata(prev=>updateAgentLibrary878191(prev,agent,{},true));
  }
  function addAgent(){
    const nom=String(draft.nom||"").trim();
    if(!nom){alert("Escriu el nom de l'agent.");return;}
    const ag={id:"agent-global-"+Date.now(),nom,rol:draft.rol||"Altres",empresa:draft.empresa||nom,email:draft.email||"",telefon:draft.telefon||"",nif:draft.nif||"",createdAt:new Date().toISOString()};
    setOdata(prev=>{const key="__global_agents_878188",d=prev?.[key]||{},agents=Array.isArray(d.agents)?d.agents:[];return {...(prev||{}),[key]:{...d,agents:sortAgents878134([ag,...agents]),updatedAt:new Date().toISOString()}}});
    setDraft({nom:"",rol:"Arquitecte tècnic",empresa:"",email:"",telefon:"",nif:""});
    setShowAdd(false);setOpenGroup(agentCategory878188(ag));setQ("");
  }
  const labelCat=c=>c==="tecnic"?"Tècnics":c==="constructora"?"Constructores / industrials":c==="promotor"?"Promotors / propietat":c==="administracio"?"Administració":"Altres";
  return <div className="stack agents-general-v878188 agents-general-v878189 agents-general-v878191">
    <Card title="Agents" action={<button className="primary" type="button" onClick={()=>setShowAdd(v=>!v)}>{showAdd?"Tancar alta":"+ Afegir agent"}</button>}>
      <div className="module-note-v8738"><b>Biblioteca general d’agents</b><span>Clients i agents continuen sent fitxes diferents. Tots els clients també apareixen aquí com a participants disponibles per a una obra, una visita o una acta.</span></div>
      {showAdd&&<div className="form-grid compact-v87151 agents-add-grid-v878188 agents-add-grid-v878189">
        <label><span>Nom</span><input value={draft.nom} onChange={e=>setDraft(d=>({...d,nom:e.target.value}))} placeholder="Nom de l’agent o empresa"/></label>
        <label><span>Rol</span><select value={draft.rol} onChange={e=>setDraft(d=>({...d,rol:e.target.value}))}>{AGENT_ROLE_OPTIONS878188.map(r=><option key={r}>{r}</option>)}</select></label>
        <label><span>Empresa</span><input value={draft.empresa} onChange={e=>setDraft(d=>({...d,empresa:e.target.value}))} placeholder="Empresa / autònom"/></label>
        <label><span>Email</span><input value={draft.email} onChange={e=>setDraft(d=>({...d,email:e.target.value}))}/></label>
        <label><span>Telèfon</span><input value={draft.telefon} onChange={e=>setDraft(d=>({...d,telefon:e.target.value}))}/></label>
        <label><span>NIF/CIF</span><input value={draft.nif} onChange={e=>setDraft(d=>({...d,nif:e.target.value}))}/></label>
        <div className="span-all actions-inline"><button type="button" className="primary" onClick={addAgent}>Guardar agent</button></div>
      </div>}
    </Card>
    <Card title="Llistat d’agents" action={openGroup?<div className="actions-inline agent-search-v878191"><input value={q} onChange={e=>setQ(e.target.value)} placeholder={`Buscar dins ${labelCat(openGroup).toLowerCase()}...`}/><button type="button" className="secondary" onClick={()=>setQ("")}>Netejar</button></div>:null}>
      <div className="agent-group-buttons-v878189">{groups.map(g=><button type="button" key={g} className={openGroup===g?"active":""} onClick={()=>{setOpenGroup(openGroup===g?"":g);setQ("")}}><b>{labelCat(g)}</b><span>{openGroup===g?"Tancar":"Obrir"}</span></button>)}</div>
      {!openGroup&&<Empty text="Tria un grup d’agents. No es carregarà cap llistat fins que el seleccionis."/>}
      {openGroup&&<section className="agent-group-v878188"><div className="client-type-head-v8774"><b>{labelCat(openGroup)}</b><span>{loaded.total} agent{loaded.total!==1?"s":""}</span></div><div className="agent-list-v878188 agent-list-v878189 agent-list-v878191">{loaded.rows.length?loaded.rows.map(a=><AgentLibraryRow878191 key={a._identity878191} agent={a} onSave={patchAgent} onDelete={deleteAgent}/>):<Empty text="No hi ha agents en aquest grup amb el filtre actual."/>}</div>{loaded.limited&&<div className="module-note-v8738"><b>Llistat limitat</b><span>Mostro 120 agents. Escriu al cercador per localitzar-ne un de concret.</span></div>}</section>}
    </Card>
  </div>
}

function MobileBackBar878146({screen,goBack}){return <div className="screen-return-v87146"><button type="button" onClick={goBack}>← Tornar</button><span>{screen}</span></div>}
function PartidesLibraryGeneral87196({items=[],setItems,clients=[],obres=[],odata={}}){
  const[clientFilter,setClientFilter]=useState("");
  const[search,setSearch]=useState("");
  const[capFilter,setCapFilter]=useState("");
  const[originFilter,setOriginFilter]=useState("");
  const[managerSearch,setManagerSearch]=useState("");
  const[openLibraryChapter,setOpenLibraryChapter]=useState("");
  const[openLibraryItem,setOpenLibraryItem]=useState("");
  const[chapterActionModal87208,setChapterActionModal87208]=useState("");
  const[libraryItemModal87208,setLibraryItemModal87208]=useState("");
  const[libraryItemModalView87208,setLibraryItemModalView87208]=useState("fitxa");
  const[capDrafts,setCapDrafts]=useState({});
  const[capMergeTargets,setCapMergeTargets]=useState({});
  const[chapterSavedId,setChapterSavedId]=useState("");
  const[selectedIds,setSelectedIds]=useState([]);
  const[bulkChapter,setBulkChapter]=useState("");
  const[candidateSearch,setCandidateSearch]=useState("");
  const[candidateSource,setCandidateSource]=useState("");
  const[candidateClient,setCandidateClient]=useState("");
  const[candidateCap,setCandidateCap]=useState("");
  const[candidateSelected,setCandidateSelected]=useState([]);
  const[candidateTarget,setCandidateTarget]=useState("__origin__");
  const[candidateDestinationChapter,setCandidateDestinationChapter]=useState("");
  const[candidateOverrides,setCandidateOverrides]=useState({});
  const[candidateLimit,setCandidateLimit]=useState(100);
  const[insertAfterChapter,setInsertAfterChapter]=useState("");
  const[insertChapterTitle,setInsertChapterTitle]=useState("");
  const[chapterCatalog,setChapterCatalog]=useState(()=>{
    const saved=lsJson8779("aco_library_chapters_v87201",["General"]);
    return [...new Set((Array.isArray(saved)?saved:["General"]).map(x=>libText87196(x)).filter(Boolean))];
  });
  const[draft,setDraft]=useState(null);
  const[trashBatches,setTrashBatches]=useState(()=>{
    const saved=lsJson8779("aco_library_trash_v87203",[]);
    return Array.isArray(saved)?saved:[];
  });
  const[ignoredFingerprints,setIgnoredFingerprints]=useState(()=>{
    const saved=lsJson8779("aco_library_ignored_v87203",[]);
    return Array.isArray(saved)?saved:[];
  });
  const rows=useMemo(()=>dedupePartidaLibrary87196(items||[]),[items]);
  useEffect(()=>{setChapterCatalog(prev=>[...new Set([...prev,...rows.map(x=>x.cap||"General")])].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true})))},[rows]);
  useEffect(()=>{lsSet8779("aco_library_chapters_v87201",JSON.stringify(chapterCatalog))},[chapterCatalog]);
  useEffect(()=>{lsSet8779("aco_library_trash_v87203",JSON.stringify(stripHeavy878185(trashBatches.slice(0,30))))},[trashBatches]);
  useEffect(()=>{lsSet8779("aco_library_ignored_v87203",JSON.stringify([...new Set(ignoredFingerprints)].slice(-4000)))},[ignoredFingerprints]);
  const candidateData=useMemo(()=>collectLibraryCandidates871200(clients,obres,odata),[clients,obres,odata]);
  const storedFingerprints=useMemo(()=>new Set(rows.map(libFingerprint87196)),[rows]);
  const ignoredFingerprintSet=useMemo(()=>new Set(ignoredFingerprints),[ignoredFingerprints]);
  const pendingCandidates=useMemo(()=>candidateData.unique.filter(x=>!storedFingerprints.has(x.candidateFingerprint)&&!ignoredFingerprintSet.has(x.candidateFingerprint)),[candidateData,storedFingerprints,ignoredFingerprintSet]);
  const candidateCaps=useMemo(()=>[...new Set(pendingCandidates.map(x=>x.cap||"General"))].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true})),[pendingCandidates]);
  const candidateFiltered=useMemo(()=>pendingCandidates.filter(item=>{
    const q=libNormText87196(candidateSearch);
    return (!q||libNormText87196([item.concepte,item.desc,item.cap,item.codi,item._candidateSourceName].join(" ")).includes(q))&&(!candidateSource||(item.candidateSources||[]).includes(candidateSource))&&(!candidateClient||(item.candidateClientIds||[]).some(id=>String(id)===String(candidateClient)))&&(!candidateCap||String(item.cap||"General")===candidateCap);
  }),[pendingCandidates,candidateSearch,candidateSource,candidateClient,candidateCap]);
  const caps=[...new Set([...chapterCatalog,...rows.map(x=>x.cap||"General")])].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true}));
  const filtered=rows.filter(x=>{
    const q=libNormText87196(search);
    const okQ=!q||libNormText87196([x.codiIntern,x.codiPressupost,x.concepte,x.desc,x.ut,x.cap].join(" ")).includes(q);
    const okClient=!clientFilter||(clientFilter==="__none__"?!(x.clientIds||[]).length:(x.clientIds||[]).some(id=>String(id)===String(clientFilter)));
    return okQ&&okClient&&(!capFilter||String(x.cap||"General")===capFilter)&&(!originFilter||libraryOrigin87199(x)===originFilter);
  });
  const linkedCount=rows.filter(x=>(x.clientIds||[]).length).length;
  const unlinkedCount=rows.length-linkedCount;
  const managedChapterStats=useMemo(()=>{
    const q=libNormText87196(managerSearch);
    return caps.map(cap=>{
      const chapterItems=rows.filter(item=>libText87196(item.cap||"General")===cap);
      const capMatches=!q||libNormText87196(cap).includes(q);
      const itemMatches=chapterItems.some(item=>libNormText87196([item.codiIntern,item.concepte,item.desc,item.ut,item.descompost].join(" ")).includes(q));
      const clientsSet=new Set();
      chapterItems.forEach(item=>(item.clientIds||[]).forEach(id=>clientsSet.add(String(id))));
      return {cap,total:chapterItems.length,clients:clientsSet,visible:capMatches||itemMatches};
    }).filter(entry=>entry.visible).sort((a,b)=>String(a.cap).localeCompare(String(b.cap),"ca",{numeric:true}));
  },[rows,caps.join("\u0001"),managerSearch]);
  const duplicateChapterGroups=(()=>{
    const groups=new Map();
    caps.forEach(cap=>{
      if(cap==="General")return;
      const key=libChapterComparable87202(cap);
      if(!key)return;
      groups.set(key,[...(groups.get(key)||[]),cap]);
    });
    return [...groups.values()].filter(group=>group.length>1).sort((a,b)=>String(a[0]).localeCompare(String(b[0]),"ca",{numeric:true}));
  })();
  const numberedChapters87205=useMemo(()=>caps.map(cap=>({cap,parsed:libParseNumberedChapter87205(cap)})).filter(entry=>entry.parsed).sort((a,b)=>String(a.parsed.prefix).localeCompare(String(b.parsed.prefix),"ca")||a.parsed.number-b.parsed.number||String(a.cap).localeCompare(String(b.cap),"ca",{numeric:true})),[caps.join("\u0001")]);
  function sendToLibraryTrash87203(deletedItems=[],reason="Depuració manual",chapters=[]){
    const safeItems=(deletedItems||[]).filter(Boolean);
    const safeChapters=[...new Set((chapters||[]).map(libText87196).filter(Boolean))];
    if(!safeItems.length&&!safeChapters.length)return;
    const id=globalThis.crypto?.randomUUID?.()||`trash-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const batch={id,reason,deletedAt:new Date().toISOString(),chapters:safeChapters,items:stripHeavy878185(safeItems)};
    setTrashBatches(prev=>[batch,...prev].slice(0,30));
    if(safeItems.length)setIgnoredFingerprints(prev=>[...new Set([...prev,...safeItems.map(libFingerprint87196)])]);
  }
  function restoreTrashBatch87203(batch){
    const restoreItems=Array.isArray(batch?.items)?batch.items:[];
    if(batch?.kind==="candidates"){
      const candidateFingerprints=new Set([...(batch?.fingerprints||[]),...restoreItems.map(item=>item.candidateFingerprint||libFingerprint87196(item))]);
      setIgnoredFingerprints(prev=>prev.filter(fp=>!candidateFingerprints.has(fp)));
      setTrashBatches(prev=>prev.filter(x=>x.id!==batch.id));
      return;
    }
    const restoreChapters=[...new Set([...(batch?.chapters||[]),...restoreItems.map(item=>item.cap||"General")].map(libText87196).filter(Boolean))];
    if(restoreItems.length)setItems?.(prev=>dedupePartidaLibrary87196([...(prev||[]),...restoreItems]));
    if(restoreChapters.length)setChapterCatalog(prev=>[...new Set([...prev,...restoreChapters])].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true})));
    const restoredFingerprints=new Set(restoreItems.map(libFingerprint87196));
    if(restoredFingerprints.size)setIgnoredFingerprints(prev=>prev.filter(fp=>!restoredFingerprints.has(fp)));
    setTrashBatches(prev=>prev.filter(x=>x.id!==batch.id));
  }
  function deleteTrashBatchForever87203(batch){
    if(confirm(`Eliminar definitivament aquesta còpia de la paperera? Després ja no es podrà recuperar.`))setTrashBatches(prev=>prev.filter(x=>x.id!==batch.id));
  }
  function emptyLibraryTrash87203(){
    if(!trashBatches.length)return;
    if(confirm(`Buidar definitivament les ${trashBatches.length} eliminacions de la paperera? Les partides continuaran excloses de la safata pendent.`))setTrashBatches([]);
  }
  function updateItem(id,patch){setItems?.(prev=>upsertPartidaLibrary87196(prev,{id,...patch}))}
  function registerChapter87201(value){
    const cap=libText87196(value);
    if(!cap)return "";
    setChapterCatalog(prev=>[...new Set([...prev,cap])].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true})));
    return cap;
  }
  function createStandaloneChapter87201(){
    const cap=registerChapter87201(prompt("Nom del nou capítol de la llibreria:","")||"");
    if(cap)alert(`Capítol «${cap}» creat. Ja apareix a tots els desplegables de la llibreria.`);
  }
  function updateItemCodeParts871200(item,patch={}){
    const prefix=libCodeToken871200(patch.codiPrefix??item.codiPrefix,libChapterInitials87199(item.cap),4);
    const keyword=libCodeToken871200(patch.codiParaula??item.codiParaula,libConceptKeyword87199(item.concepte),6);
    let seq=Math.max(1,Math.min(999,+(patch.codiSeq??item.codiSeq)||1));
    let code=`${prefix}_${keyword}_${String(seq).padStart(3,"0")}`;
    const used=new Set(rows.filter(x=>x.id!==item.id).map(x=>String(x.codiIntern||"").toUpperCase()));
    while(used.has(code)&&seq<999){seq++;code=`${prefix}_${keyword}_${String(seq).padStart(3,"0")}`}
    updateItem(item.id,{codiPrefix:prefix,codiParaula:keyword,codiSeq:seq,codiIntern:code});
  }
  function changeItemChapter87198(item,value){
    let nextCap=value;
    if(value==="__new__")nextCap=registerChapter87201(prompt("Nom del nou capítol de la llibreria:","")||"");
    if(!nextCap||nextCap==="__new__")return;
    registerChapter87201(nextCap);
    updateItem(item.id,{cap:nextCap,updatedAt:new Date().toISOString()});
    if(capFilter&&capFilter!==nextCap)setCapFilter("");
    setChapterSavedId(item.id);
    setTimeout(()=>setChapterSavedId(current=>current===item.id?"":current),1800);
  }
  function toggleLibrarySelection87199(id){setSelectedIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}
  function toggleChapterSelection87209(chapterItems=[]){
    const ids=chapterItems.map(item=>item.id);
    const idSet=new Set(ids);
    setSelectedIds(prev=>ids.length&&ids.every(id=>prev.includes(id))?prev.filter(id=>!idSet.has(id)):[...new Set([...prev,...ids])]);
  }
  function selectFiltered87199(){setSelectedIds(prev=>filtered.every(x=>prev.includes(x.id))?prev.filter(id=>!filtered.some(x=>x.id===id)):[...new Set([...prev,...filtered.map(x=>x.id)])])}
  function deleteSelected87199(){
    if(!selectedIds.length)return;
    if(!confirm(`Eliminar ${selectedIds.length} partida/es seleccionades de la llibreria? Es guardaran a la paperera i no s'eliminaran dels pressupostos existents.`))return;
    const ids=new Set(selectedIds);
    const deleted=rows.filter(item=>ids.has(item.id));
    sendToLibraryTrash87203(deleted,`Eliminació de ${deleted.length} partides seleccionades`,[...new Set(deleted.map(item=>item.cap||"General"))]);
    setItems?.(prev=>(prev||[]).filter(x=>!ids.has(x.id)));setSelectedIds([]);
  }
  function moveSelected87199(){
    let cap=bulkChapter;
    if(cap==="__new__")cap=registerChapter87201(prompt("Nom del nou capítol de la llibreria:","")||"");
    if(!cap||cap==="__new__")return alert("Selecciona el capítol de destí.");
    registerChapter87201(cap);
    const ids=new Set(selectedIds);setItems?.(prev=>dedupePartidaLibrary87196((prev||[]).map(x=>ids.has(x.id)?{...x,cap,updatedAt:new Date().toISOString()}:x)));setBulkChapter("");setSelectedIds([]);
  }
  function rebuildCodes87199(){
    if(!confirm("Regenerar els codis interns amb prefix del capítol, paraula clau abreujada i numeració de tres dígits? Els pressupostos existents no canviaran."))return;
    setItems?.(prev=>dedupePartidaLibrary87196((prev||[]).map(x=>({...x,codiIntern:"",codiPrefix:"",codiParaula:"",codiSeq:null}))));
  }
  function toggleCandidate871200(id){setCandidateSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}
  function selectCandidateResults871200(){setCandidateSelected(prev=>candidateFiltered.every(x=>prev.includes(x.id))?prev.filter(id=>!candidateFiltered.some(x=>x.id===id)):[...new Set([...prev,...candidateFiltered.map(x=>x.id)])])}
  function addCandidates871200(candidates){
    const selected=(candidates||[]).filter(Boolean);
    if(!selected.length)return alert("Selecciona almenys una partida pendent.");
    let destination=candidateDestinationChapter;
    if(destination==="__new__")destination=registerChapter87201(prompt("Nom del nou capítol final de la llibreria:","")||"");
    if(!destination)return alert("Selecciona primer el capítol final on vols guardar les partides.");
    if(destination!=="__origin__")registerChapter87201(destination);
    const payloads=selected.map(item=>{
      const clientIds=candidateTarget==="__origin__"?(item.candidateClientIds||[]):candidateTarget==="__none__"?[]:(candidateTarget?[String(candidateTarget)]:[]);
      const cap=destination==="__origin__"?(item.cap||"General"):destination;
      if(destination==="__origin__")registerChapter87201(cap);
      const override=candidateOverrides[item.id]||{};
      return {cap,ut:item.ut||"ut",concepte:item.concepte,desc:item.desc||"",pu:override.pu!=null?parseNum8770(override.pu):item.pu||0,codiPressupost:item.codi||"",codi:item.codi||"",codiIntern:"",codiPrefix:"",codiParaula:"",codiSeq:null,global:true,clientIds,tipus:"Selecció manual des de safata",origen:(item.candidateSourceNames||[]).join(" · "),updatedAt:new Date().toISOString()};
    });
    setItems?.(prev=>dedupePartidaLibrary87196([...(prev||[]),...payloads]));
    setCandidateSelected(prev=>prev.filter(id=>!selected.some(x=>x.id===id)));
    setCandidateOverrides(prev=>{const next={...prev};selected.forEach(item=>delete next[item.id]);return next});
    alert(`${selected.length} partida/es incorporades a la llibreria única. Les coincidències tècniques s'han unificat.`);
  }
  function discardCandidates87204(candidates){
    const selected=(candidates||[]).filter(Boolean);
    if(!selected.length)return alert("Selecciona almenys una proposta pendent.");
    if(!confirm(`Descartar ${selected.length} proposta/es pendents? Desapareixeran del pas 2 i es podran recuperar des de la paperera.`))return;
    const fingerprints=[...new Set(selected.map(item=>item.candidateFingerprint||libFingerprint87196(item)))];
    const id=globalThis.crypto?.randomUUID?.()||`trash-candidates-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    setTrashBatches(prev=>[{id,kind:"candidates",reason:`Propostes pendents descartades: ${selected.length}`,deletedAt:new Date().toISOString(),chapters:[...new Set(selected.map(item=>item.cap||"General"))],fingerprints,items:stripHeavy878185(selected)},...prev].slice(0,30));
    setIgnoredFingerprints(prev=>[...new Set([...prev,...fingerprints])]);
    setCandidateSelected(prev=>prev.filter(candidateId=>!selected.some(item=>item.id===candidateId)));
    setCandidateOverrides(prev=>{const next={...prev};selected.forEach(item=>delete next[item.id]);return next});
  }
  function removeItem(id){
    const item=rows.find(x=>String(x.id)===String(id));
    if(!item)return;
    if(!confirm(`Eliminar la partida «${item.concepte}» de la llibreria? Es guardarà a la paperera i no s'eliminarà dels pressupostos on ja s'hagi utilitzat.`))return;
    sendToLibraryTrash87203([item],`Partida eliminada: ${item.concepte}`,[item.cap||"General"]);
    setItems?.(prev=>(prev||[]).filter(x=>String(x.id)!==String(id)));
    setSelectedIds(prev=>prev.filter(x=>String(x)!==String(id)));
    if(String(libraryItemModal87208)===String(id))setLibraryItemModal87208("");
  }
  function startNew(capOverride=""){
    if(capOverride)setOpenLibraryChapter(capOverride);
    setDraft({concepte:"",desc:"",ut:"ut",pu:"0",cap:capOverride||caps[0]||"",codiPrefix:"",codiParaula:"",global:true,clientIds:[],tipus:"Alta manual"});
    setTimeout(()=>document.querySelector(".library-new-v87196")?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  }
  function changeDraftChapter87201(value){
    let cap=value;
    if(value==="__new__")cap=registerChapter87201(prompt("Nom del nou capítol de la llibreria:","")||"");
    if(cap)setDraft(prev=>({...prev,cap}));
  }
  function saveNew(){
    if(!libText87196(draft?.concepte))return alert("Escriu el concepte de la partida.");
    if(!libText87196(draft?.cap))return alert("Selecciona un capítol o crea’n un de nou abans de guardar la partida.");
    const cap=registerChapter87201(draft.cap);
    setItems?.(prev=>upsertPartidaLibrary87196(prev,{...draft,cap,global:true,id:undefined,codiIntern:"",updatedAt:new Date().toISOString()}));
    setDraft(null);
  }
  function consolidate(){const before=(items||[]).length;const next=dedupePartidaLibrary87196(items||[]);setItems?.(next);alert(before===next.length?"La llibreria ja estava consolidada.":`${before-next.length} duplicat/s unificat/s. No s'ha perdut cap vinculació de client.`)}
  function renameChapter87197(oldCap,newValue){
    const nextCap=libText87196(newValue);
    if(!nextCap)return alert("Escriu el nou nom del capítol.");
    if(nextCap===oldCap)return alert("El nom del capítol no ha canviat.");
    const willMerge=caps.includes(nextCap);
    const message=willMerge?`El capítol «${oldCap}» es fusionarà amb «${nextCap}» a tota la llibreria. Les partides es conservaran. Continuar?`:`Canviar «${oldCap}» per «${nextCap}» a tota la llibreria?`;
    if(!confirm(message))return;
    setItems?.(prev=>dedupePartidaLibrary87196((prev||[]).map(x=>libText87196(x.cap||"General")===oldCap?{...x,cap:nextCap,updatedAt:new Date().toISOString()}:x)));
    setChapterCatalog(prev=>[...new Set(prev.map(x=>x===oldCap?nextCap:x).concat(nextCap))].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true})));
    setCapDrafts(prev=>{const next={...prev};delete next[oldCap];return next});
    setCapMergeTargets(prev=>{const next={...prev};delete next[oldCap];return next});
    if(capFilter===oldCap)setCapFilter(nextCap);
    if(openLibraryChapter===oldCap)setOpenLibraryChapter(nextCap);
    if(chapterActionModal87208===oldCap)setChapterActionModal87208(nextCap);
  }
  function applyChapterRenameMap87205(renameMap,newChapter=""){
    const now=new Date().toISOString();
    setItems?.(prev=>dedupePartidaLibrary87196((prev||[]).map(item=>{
      const oldCap=libText87196(item.cap||"General")||"General";
      return renameMap.has(oldCap)?{...item,cap:renameMap.get(oldCap),updatedAt:now}:item;
    })));
    setChapterCatalog(prev=>{
      const all=[...new Set([...prev,...caps])];
      return [...new Set([...all.map(cap=>renameMap.get(cap)||cap),...(newChapter?[newChapter]:[])])].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true}));
    });
    setCapDrafts({});
    setCapMergeTargets({});
    if(renameMap.has(capFilter))setCapFilter(renameMap.get(capFilter));
    if(renameMap.has(openLibraryChapter))setOpenLibraryChapter(renameMap.get(openLibraryChapter));
    if(renameMap.has(chapterActionModal87208))setChapterActionModal87208(renameMap.get(chapterActionModal87208));
  }
  function numberedChapterGroup87205(reference){
    if(!reference?.parsed)return [];
    const prefix=String(reference.parsed.prefix||"").toLocaleUpperCase("ca");
    return numberedChapters87205.filter(entry=>String(entry.parsed.prefix||"").toLocaleUpperCase("ca")===prefix).sort((a,b)=>a.parsed.number-b.parsed.number||String(a.cap).localeCompare(String(b.cap),"ca",{numeric:true}));
  }
  function insertAndRenumberChapter87205(){
    const title=libText87196(insertChapterTitle);
    const reference=numberedChapters87205.find(entry=>entry.cap===insertAfterChapter);
    if(!reference)return alert("Selecciona el capítol numerat després del qual vols inserir el nou.");
    if(!title)return alert("Escriu el nom del nou capítol. El número el posarà l’app automàticament.");
    const group=numberedChapterGroup87205(reference);
    const targetNumber=reference.parsed.number+1;
    const width=Math.max(2,...group.map(entry=>entry.parsed.width));
    const formatBase={...reference.parsed,width};
    const renameMap=new Map();
    group.filter(entry=>entry.parsed.number>=targetNumber).sort((a,b)=>b.parsed.number-a.parsed.number).forEach(entry=>renameMap.set(entry.cap,libFormatNumberedChapter87205(formatBase,entry.parsed.number+1,entry.parsed.title)));
    const newChapter=libFormatNumberedChapter87205(formatBase,targetNumber,title);
    const changes=[...renameMap.entries()].filter(([oldCap,nextCap])=>oldCap!==nextCap);
    const preview=changes.slice().reverse().slice(0,4).map(([oldCap,nextCap])=>`${oldCap} → ${nextCap}`).join("\n");
    if(!confirm(`Crear «${newChapter}» després de «${reference.cap}»?\n\nEs renumeraran ${changes.length} capítol/s posteriors i totes les partides continuaran vinculades al seu capítol.\n${preview?`\nExemple:\n${preview}${changes.length>4?"\n…":""}`:""}`))return;
    applyChapterRenameMap87205(renameMap,newChapter);
    setInsertAfterChapter(newChapter);
    setInsertChapterTitle("");
    alert(`Capítol «${newChapter}» creat. S’han renumerat ${changes.length} capítol/s sense perdre cap partida.`);
  }
  function compactNumberedChapters87205(){
    const reference=numberedChapters87205.find(entry=>entry.cap===insertAfterChapter);
    if(!reference)return alert("Selecciona un capítol numerat del grup que vols ordenar.");
    const group=numberedChapterGroup87205(reference);
    if(group.length<2)return alert("Aquest grup només té un capítol numerat.");
    const start=Math.min(...group.map(entry=>entry.parsed.number));
    const width=Math.max(2,...group.map(entry=>entry.parsed.width));
    const formatBase={...reference.parsed,width};
    const renameMap=new Map();
    group.forEach((entry,index)=>{
      const nextCap=libFormatNumberedChapter87205(formatBase,start+index,entry.parsed.title);
      if(nextCap!==entry.cap)renameMap.set(entry.cap,nextCap);
    });
    if(!renameMap.size)return alert("La numeració d’aquest grup ja és correlativa.");
    if(!confirm(`Ordenar correlativament ${group.length} capítols, començant per ${String(start).padStart(width,"0")}? Les partides es conservaran.`))return;
    applyChapterRenameMap87205(renameMap);
    setInsertAfterChapter(renameMap.get(insertAfterChapter)||insertAfterChapter);
    alert(`Numeració compactada. S’han renombrat ${renameMap.size} capítol/s sense perdre cap partida.`);
  }
  function moveChapterToGeneral87197(cap){
    if(cap==="General")return;
    if(!confirm(`Moure totes les partides de «${cap}» al capítol «General»?`))return;
    setItems?.(prev=>dedupePartidaLibrary87196((prev||[]).map(x=>libText87196(x.cap||"General")===cap?{...x,cap:"General",updatedAt:new Date().toISOString()}:x)));
    setChapterCatalog(prev=>prev.filter(x=>x!==cap));
    setCapDrafts(prev=>{const next={...prev};delete next[cap];return next});
    if(capFilter===cap)setCapFilter("General");
  }
  function deleteEmptyChapter87201(cap){
    if(rows.some(x=>String(x.cap||"General")===cap))return alert("Aquest capítol encara té partides. Primer fusiona’l amb un altre capítol o elimina les seves partides.");
    if(confirm(`Eliminar el capítol buit «${cap}» del catàleg? Es podrà recuperar des de la paperera.`)){
      sendToLibraryTrash87203([],`Capítol buit eliminat: ${cap}`,[cap]);
      setChapterCatalog(prev=>prev.filter(x=>x!==cap));
      if(openLibraryChapter===cap)setOpenLibraryChapter("");
      if(chapterActionModal87208===cap)setChapterActionModal87208("");
    }
  }
  function deleteChapterAndItems87203(cap){
    const chapterItems=rows.filter(item=>libText87196(item.cap||"General")===cap);
    if(!chapterItems.length)return deleteEmptyChapter87201(cap);
    if(!confirm(`Eliminar el capítol «${cap}» i les seves ${chapterItems.length} partida/es? Tot quedarà guardat a la paperera i no s'esborrarà dels pressupostos existents.`))return;
    const ids=new Set(chapterItems.map(item=>String(item.id)));
    sendToLibraryTrash87203(chapterItems,`Capítol eliminat amb ${chapterItems.length} partides: ${cap}`,[cap]);
    setItems?.(prev=>(prev||[]).filter(item=>!ids.has(String(item.id))));
    setChapterCatalog(prev=>prev.filter(x=>x!==cap));
    setSelectedIds(prev=>prev.filter(id=>!ids.has(String(id))));
    setCapDrafts(prev=>{const next={...prev};delete next[cap];return next});
    setCapMergeTargets(prev=>{const next={...prev};delete next[cap];return next});
    if(capFilter===cap)setCapFilter("");
    if(openLibraryChapter===cap)setOpenLibraryChapter("");
    if(chapterActionModal87208===cap)setChapterActionModal87208("");
  }
  async function importLibraryItemDescompost87207(item,file){
    if(!file)return;
    try{
      const parsed=await workbookDescompostFromFile878161(file);
      const total=parsed.total||descompostTableTotal878174(parsed.table)||descompostTotal878160(parsed.text);
      updateItem(item.id,{descompost:parsed.text,descompostTable:parsed.table||null,descompostSource:file.name,descompostSheet:parsed.sheet,descompostImportedAt:new Date().toISOString(),descompostValidatedPu:total?qty2(total):item.descompostValidatedPu,pu:total||item.pu||0});
      alert(`Descompost incorporat: ${parsed.lines} línies · ${money(total)}.`);
    }catch(err){alert("No he pogut llegir el descompost: "+String(err?.message||err));}
  }
  function updateLibraryDescompostCell87207(item,rowIndex,key,value){
    const table=item.descompostTable||{source:item.descompostSource||"Descompost manual",title:item.concepte||"",rows:[]};
    const nextRows=[...(table.rows||[])];
    const current={...(nextRows[rowIndex]||{})};
    current[key]=value;
    if(["q","pu"].includes(key)){
      const q=parseNum8770(key==="q"?value:current.q);
      const pu=parseNum8770(key==="pu"?value:current.pu);
      current.total=qty2(q*pu);
    }
    nextRows[rowIndex]=current;
    const nextTable={...table,rows:nextRows};
    const detected=descompostTableTotal878174(nextTable);
    updateItem(item.id,{descompostTable:nextTable,descompost:descompostTableToText878174(nextTable),descompostValidatedPu:detected?qty2(detected):item.descompostValidatedPu,updatedAt:new Date().toISOString()});
  }
  function addLibraryDescompostRow87207(item){
    const table=item.descompostTable||{source:item.descompostSource||"Descompost manual",title:item.concepte||"",rows:[]};
    const nextTable={...table,rows:[...(table.rows||[]),{id:globalThis.crypto?.randomUUID?.()||`des-${Date.now()}`,concepte:"",ut:"ut",q:"1,00",pu:"0,00",total:"0,00"}]};
    updateItem(item.id,{descompostTable:nextTable,descompost:descompostTableToText878174(nextTable),updatedAt:new Date().toISOString()});
  }
  function removeLibraryDescompostRow87207(item,rowIndex){
    const table=item.descompostTable;
    if(!table?.rows?.length)return;
    const nextTable={...table,rows:table.rows.filter((_,index)=>index!==rowIndex)};
    const detected=descompostTableTotal878174(nextTable);
    updateItem(item.id,{descompostTable:nextTable,descompost:nextTable.rows.length?descompostTableToText878174(nextTable):"",descompostValidatedPu:detected?qty2(detected):"",updatedAt:new Date().toISOString()});
  }
  function mergeChapterGroup87202(group,keepCap){
    const mergeCaps=(group||[]).filter(cap=>cap!==keepCap);
    if(!mergeCaps.length)return;
    if(!confirm(`Conservar «${keepCap}» i fusionar-hi ${mergeCaps.map(cap=>`«${cap}»`).join(", ")}? Totes les partides es conservaran.`))return;
    const mergeSet=new Set(group);
    setItems?.(prev=>dedupePartidaLibrary87196((prev||[]).map(item=>mergeSet.has(libText87196(item.cap||"General"))?{...item,cap:keepCap,updatedAt:new Date().toISOString()}:item)));
    setChapterCatalog(prev=>[...new Set(prev.filter(cap=>!mergeSet.has(cap)).concat(keepCap))].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true})));
    setCapDrafts(prev=>{const next={...prev};group.forEach(cap=>delete next[cap]);return next});
    setCapMergeTargets(prev=>{const next={...prev};group.forEach(cap=>delete next[cap]);return next});
    if(mergeSet.has(capFilter))setCapFilter(keepCap);
  }
  function renderLibraryItem87207(item){
    const owners=(item.clientIds||[]).map(id=>clients.find(c=>String(c.id)===String(id))?.nom).filter(Boolean);
    const hasDescription=!!libText87196(item.desc);
    const hasBreakdown=!!(item.descompostTable?.rows?.length||libText87196(item.descompost));
    const detected=descompostTableTotal878174(item.descompostTable)||descompostTotal878160(item.descompost||"");
    const isOpen=openLibraryItem===item.id;
    return <details open={isOpen} className={`library-chapter-item-v87207 ${hasDescription?"":"missing-description"}`} key={item.id}>
      <summary onClick={event=>{event.preventDefault();setOpenLibraryItem(current=>current===item.id?"":item.id)}}><div><b>{item.concepte}</b><span>{item.codiIntern||"Sense codi"} · {item.ut||"ut"}</span></div><div><strong>{money(item.pu||0)}</strong><small className={hasDescription?"good-text":"warn-text"}>{hasDescription?"Descripció incorporada":"Falta descripció llarga"} · {hasBreakdown?"Amb descompost":"Sense descompost"}</small><em>Editar ▾</em></div></summary>
      {isOpen&&<div className="library-item-work-v87207">
        <details open className="library-item-action-v87207"><summary><div><b>Dades, descripció i preu</b><span>Modifica la informació principal de la partida</span></div><em>Obrir ▾</em></summary><div className="library-item-main-grid-v87207">
          <label className="span-all"><span>Concepte</span><input defaultValue={item.concepte||""} onBlur={e=>updateItem(item.id,{concepte:e.target.value})}/></label>
          <label><span>Unitat</span><input defaultValue={item.ut||"ut"} onBlur={e=>updateItem(item.id,{ut:e.target.value})}/></label>
          <label><span>Preu unitari</span><input inputMode="decimal" defaultValue={qty2(item.pu||0)} onBlur={e=>updateItem(item.id,{pu:parseNum8770(e.target.value)||0})}/></label>
          <label><span>Capítol assignat</span><select value={item.cap||""} onChange={e=>changeItemChapter87198(item,e.target.value)}>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option></select>{chapterSavedId===item.id&&<small>Canvi guardat</small>}</label>
          <label className="span-all"><span>Descripció llarga {hasDescription?"":"· PENDENT"}</span><textarea defaultValue={item.desc||""} onBlur={e=>updateItem(item.id,{desc:e.target.value})} placeholder="Escriu la descripció tècnica completa: materials, execució, mitjans inclosos i criteri d’amidament..."/></label>
        </div></details>
        <details className="library-item-action-v87207"><summary><div><b>Descompost de la partida</b><span>{hasBreakdown?`${item.descompostTable?.rows?.length||"Text"} línies · total detectat ${money(detected)}`:"Encara no incorporat · es pot crear manualment o importar d’Excel"}</span></div><em>Obrir ▾</em></summary><div className="library-breakdown-editor-v87207">
          <div className="library-breakdown-toolbar-v87207"><label className="secondary upload-label">Importar Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>{const file=e.target.files?.[0];importLibraryItemDescompost87207(item,file);e.target.value=""}}/></label><button type="button" className="secondary" onClick={()=>addLibraryDescompostRow87207(item)}>+ Afegir línia manual</button><div><small>Total detectat</small><b>{money(detected)}</b></div>{detected>0&&<button type="button" className="primary" onClick={()=>updateItem(item.id,{pu:detected,descompostValidatedPu:qty2(detected)})}>Aplicar total com a preu/ut</button>}</div>
          {item.descompostTable?.rows?.length?<div className="library-breakdown-table-wrap-v87207"><table className="library-breakdown-table-v87207"><thead><tr><th>Concepte</th><th>Ut.</th><th>Rendiment</th><th>Preu/ut</th><th>Total</th><th></th></tr></thead><tbody>{item.descompostTable.rows.map((row,index)=>row.isSection?<tr className="breakdown-section-v87207" key={row.id||index}><td colSpan="5"><input value={row.concepte||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"concepte",e.target.value)}/></td><td><button type="button" className="danger small" onClick={()=>removeLibraryDescompostRow87207(item,index)}>×</button></td></tr>:<tr key={row.id||index}><td><input value={row.concepte||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"concepte",e.target.value)}/></td><td><input value={row.ut||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"ut",e.target.value)}/></td><td><input inputMode="decimal" value={row.q||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"q",e.target.value)}/></td><td><input inputMode="decimal" value={row.pu||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"pu",e.target.value)}/></td><td><input inputMode="decimal" value={row.total||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"total",e.target.value)}/></td><td><button type="button" className="danger small" onClick={()=>removeLibraryDescompostRow87207(item,index)}>×</button></td></tr>)}</tbody></table></div>:<label className="library-breakdown-text-v87207"><span>Descompost en text</span><textarea defaultValue={item.descompost||""} onBlur={e=>{const value=e.target.value;updateItem(item.id,{descompost:value,descompostTable:null,descompostValidatedPu:qty2(descompostTotal878160(value)||0)})}} placeholder="Enganxa o escriu materials, mà d’obra, rendiments, preus i totals. També pots prémer «Afegir línia manual» per crear una taula."/></label>}
        </div></details>
        <details className="library-item-action-v87207"><summary><div><b>Codi, clients i historial</b><span>Dades complementàries</span></div><em>Obrir ▾</em></summary><div className="library-item-main-grid-v87207">
          <label><span>Codi intern resultant</span><input value={item.codiIntern||""} readOnly/></label><label><span>Prefix capítol</span><input maxLength="4" defaultValue={item.codiPrefix||libChapterInitials87199(item.cap)} onBlur={e=>updateItemCodeParts871200(item,{codiPrefix:e.target.value})}/></label><label><span>Paraula clau</span><input maxLength="6" defaultValue={item.codiParaula||libConceptKeyword87199(item.concepte)} onBlur={e=>updateItemCodeParts871200(item,{codiParaula:e.target.value})}/></label><label><span>Número</span><input type="number" min="1" max="999" defaultValue={item.codiSeq||1} onBlur={e=>updateItemCodeParts871200(item,{codiSeq:e.target.value})}/></label>
          {clients.length>0&&<details className="library-client-links-v87196 span-all"><summary>Clients relacionats ({owners.length})</summary>{clients.map(client=><label key={client.id}><input type="checkbox" checked={(item.clientIds||[]).some(id=>String(id)===String(client.id))} onChange={e=>updateItem(item.id,{clientIds:e.target.checked?[...new Set([...(item.clientIds||[]),String(client.id)])]:(item.clientIds||[]).filter(id=>String(id)!==String(client.id))})}/><span>{client.nom||client.rao}</span></label>)}</details>}
          {(item.priceHistory||[]).length>0&&<details className="library-price-history-v87196 span-all"><summary>Històric de preus ({item.priceHistory.length})</summary>{item.priceHistory.slice().reverse().map((price,index)=><span key={`${price.data}-${price.pu}-${index}`}>{price.data||"—"} · {money(price.pu||0)} · {price.origen||"Llibreria"}</span>)}</details>}
        </div></details>
        <div className="library-item-delete-v87207"><button type="button" className="danger" onClick={()=>removeItem(item.id)}>Eliminar partida de la llibreria</button></div>
      </div>}
    </details>;
  }
  function renderLibraryItemRow87208(item){
    const hasDescription=!!libText87196(item.desc);
    const hasBreakdown=!!(item.descompostTable?.rows?.length||libText87196(item.descompost));
    const isSelected=selectedIds.includes(item.id);
    return <div className={`library-item-row-v87208 ${hasDescription?"":"missing-description"} ${isSelected?"selected-v87209":""}`} key={item.id}><label className="library-item-check-v87209" title="Seleccionar aquesta partida"><input type="checkbox" checked={isSelected} onChange={()=>toggleLibrarySelection87199(item.id)}/><span>Seleccionar</span></label><div className="library-item-info-v87209"><b>{item.concepte}</b><span>{item.codiIntern||"Sense codi"}</span><small className={hasDescription?"good-text":"warn-text"}>{hasDescription?"Descripció incorporada":"Falta descripció llarga"} · {hasBreakdown?"Amb descompost":"Sense descompost"}</small></div><span className="library-unit-badge-v87209"><small>UNITAT</small><b>{String(item.ut||"ut").toUpperCase()}</b></span><span className="library-price-v87209"><small>PREU/UT</small><strong>{money(item.pu||0)}</strong></span><button type="button" className="primary small" onClick={()=>{setLibraryItemModalView87208("fitxa");setLibraryItemModal87208(item.id)}}>Obrir fitxa</button></div>;
  }
  function renderLibraryItemModal87208(item){
    const owners=(item.clientIds||[]).map(id=>clients.find(c=>String(c.id)===String(id))?.nom).filter(Boolean);
    const detected=descompostTableTotal878174(item.descompostTable)||descompostTotal878160(item.descompost||"");
    return <Modal title={`${item.codiIntern||"Partida"} · ${item.concepte||"Sense concepte"}`} close={()=>setLibraryItemModal87208("")}><div className="library-item-modal-v87208">
      <div className="library-modal-tabs-v87208"><button type="button" className={libraryItemModalView87208==="fitxa"?"active":""} onClick={()=>setLibraryItemModalView87208("fitxa")}>Fitxa i descompost</button><button type="button" className={libraryItemModalView87208==="meta"?"active":""} onClick={()=>setLibraryItemModalView87208("meta")}>Clients i codi</button></div>
      {libraryItemModalView87208==="fitxa"?<div className="library-modal-split-v87208"><section className="library-modal-pane-v87208"><h3>Dades i descripció</h3><div className="library-modal-fields-v87208"><label className="wide"><span>Concepte</span><input defaultValue={item.concepte||""} onBlur={e=>updateItem(item.id,{concepte:e.target.value})}/></label><label><span>Unitat</span><input defaultValue={item.ut||"ut"} onBlur={e=>updateItem(item.id,{ut:e.target.value})}/></label><label><span>Preu unitari</span><input inputMode="decimal" defaultValue={qty2(item.pu||0)} onBlur={e=>updateItem(item.id,{pu:parseNum8770(e.target.value)||0})}/></label><label className="wide"><span>Capítol assignat</span><select value={item.cap||""} onChange={e=>changeItemChapter87198(item,e.target.value)}>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option></select></label><label className="wide library-modal-description-v87208"><span>Descripció llarga</span><textarea defaultValue={item.desc||""} onBlur={e=>updateItem(item.id,{desc:e.target.value})} placeholder="Escriu la descripció tècnica completa, amb materials, execució i criteri d’amidament..."/></label></div></section><section className="library-modal-pane-v87208"><div className="library-modal-pane-head-v87208"><div><h3>Descompost</h3><span>Total detectat: <b>{money(detected)}</b></span></div><div className="actions-inline"><label className="secondary small upload-label">Importar Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>{const file=e.target.files?.[0];importLibraryItemDescompost87207(item,file);e.target.value=""}}/></label><button type="button" className="secondary small" onClick={()=>addLibraryDescompostRow87207(item)}>+ Línia</button>{detected>0&&<button type="button" className="primary small" onClick={()=>updateItem(item.id,{pu:detected,descompostValidatedPu:qty2(detected)})}>Aplicar preu</button>}</div></div>{item.descompostTable?.rows?.length?<div className="library-breakdown-table-wrap-v87207"><table className="library-breakdown-table-v87207"><thead><tr><th>Concepte</th><th>Ut.</th><th>Rend.</th><th>Preu/ut</th><th>Total</th><th></th></tr></thead><tbody>{item.descompostTable.rows.map((row,index)=>row.isSection?<tr className="breakdown-section-v87207" key={row.id||index}><td colSpan="5"><input value={row.concepte||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"concepte",e.target.value)}/></td><td><button type="button" className="danger small" onClick={()=>removeLibraryDescompostRow87207(item,index)}>×</button></td></tr>:<tr key={row.id||index}><td><input value={row.concepte||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"concepte",e.target.value)}/></td><td><input value={row.ut||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"ut",e.target.value)}/></td><td><input inputMode="decimal" value={row.q||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"q",e.target.value)}/></td><td><input inputMode="decimal" value={row.pu||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"pu",e.target.value)}/></td><td><input inputMode="decimal" value={row.total||""} onChange={e=>updateLibraryDescompostCell87207(item,index,"total",e.target.value)}/></td><td><button type="button" className="danger small" onClick={()=>removeLibraryDescompostRow87207(item,index)}>×</button></td></tr>)}</tbody></table></div>:<label className="library-breakdown-text-v87207 library-modal-breakdown-text-v87208"><span>Descompost en text</span><textarea defaultValue={item.descompost||""} onBlur={e=>{const value=e.target.value;updateItem(item.id,{descompost:value,descompostTable:null,descompostValidatedPu:qty2(descompostTotal878160(value)||0)})}} placeholder="Materials, mà d’obra, rendiments, preus i totals..."/></label>}</section></div>:<div className="library-modal-meta-v87208"><section><h3>Codi intern</h3><div className="library-modal-fields-v87208"><label className="wide"><span>Codi resultant</span><input value={item.codiIntern||""} readOnly/></label><label><span>Prefix del capítol</span><input maxLength="4" defaultValue={item.codiPrefix||libChapterInitials87199(item.cap)} onBlur={e=>updateItemCodeParts871200(item,{codiPrefix:e.target.value})}/></label><label><span>Paraula clau</span><input maxLength="6" defaultValue={item.codiParaula||libConceptKeyword87199(item.concepte)} onBlur={e=>updateItemCodeParts871200(item,{codiParaula:e.target.value})}/></label><label><span>Número</span><input type="number" min="1" max="999" defaultValue={item.codiSeq||1} onBlur={e=>updateItemCodeParts871200(item,{codiSeq:e.target.value})}/></label></div></section><section><h3>Clients relacionats ({owners.length})</h3><div className="library-modal-client-grid-v87208">{clients.length?clients.map(client=><label key={client.id}><input type="checkbox" checked={(item.clientIds||[]).some(id=>String(id)===String(client.id))} onChange={e=>updateItem(item.id,{clientIds:e.target.checked?[...new Set([...(item.clientIds||[]),String(client.id)])]:(item.clientIds||[]).filter(id=>String(id)!==String(client.id))})}/><span>{client.nom||client.rao}</span></label>):<Empty text="No hi ha clients disponibles."/>}</div></section>{(item.priceHistory||[]).length>0&&<section><h3>Històric de preus</h3><div className="library-modal-history-v87208">{item.priceHistory.slice().reverse().map((price,index)=><span key={`${price.data}-${price.pu}-${index}`}>{price.data||"—"} · <b>{money(price.pu||0)}</b> · {price.origen||"Llibreria"}</span>)}</div></section>}</div>}
      <div className="modal-actions"><button type="button" className="danger" onClick={()=>removeItem(item.id)}>Eliminar partida</button><button type="button" className="primary" onClick={()=>setLibraryItemModal87208("")}>Tancar i tornar</button></div>
    </div></Modal>;
  }
  return <div className="library-page-v87196 stack">
    {chapterActionModal87208&&(()=>{const ch=managedChapterStats.find(entry=>entry.cap===chapterActionModal87208)||{cap:chapterActionModal87208,total:rows.filter(item=>libText87196(item.cap||"General")===chapterActionModal87208).length};return <Modal title={`Accions del capítol · ${ch.cap}`} close={()=>setChapterActionModal87208("")}><div className="library-chapter-modal-v87208"><section><div><b>Renombrar el capítol</b><span>Les partides continuaran vinculades a aquest capítol.</span></div><label><span>Nom nou</span><input value={capDrafts[ch.cap]??ch.cap} onChange={e=>setCapDrafts(prev=>({...prev,[ch.cap]:e.target.value}))}/></label><button type="button" className="primary" onClick={()=>renameChapter87197(ch.cap,capDrafts[ch.cap]??ch.cap)}>Guardar nom</button></section><section><div><b>Fusionar amb un altre</b><span>Mou totes les partides al capítol que conserves.</span></div><label><span>Capítol que vols conservar</span><select value={capMergeTargets[ch.cap]||""} onChange={e=>setCapMergeTargets(prev=>({...prev,[ch.cap]:e.target.value}))}><option value="">Selecciona el destí...</option>{caps.filter(cap=>cap!==ch.cap).map(cap=><option key={cap} value={cap}>{cap}</option>)}</select></label><button type="button" className="secondary" disabled={!capMergeTargets[ch.cap]} onClick={()=>renameChapter87197(ch.cap,capMergeTargets[ch.cap])}>Fusionar</button></section><section className="library-chapter-danger-v87206"><div><b>Eliminar</b><span>{ch.total?`Envia el capítol i ${ch.total} partida/es a la paperera.`:"El capítol és buit."}</span></div><span></span><button type="button" className="danger" onClick={()=>ch.total?deleteChapterAndItems87203(ch.cap):deleteEmptyChapter87201(ch.cap)}>{ch.total?`Eliminar capítol i ${ch.total} partides`:"Eliminar capítol buit"}</button></section></div><div className="modal-actions"><button type="button" className="primary" onClick={()=>setChapterActionModal87208("")}>Tancar i tornar</button></div></Modal>})()}
    {libraryItemModal87208&&(()=>{const item=rows.find(entry=>String(entry.id)===String(libraryItemModal87208));return item?renderLibraryItemModal87208(item):null})()}
    {draft&&<Modal title={`Nova partida${draft.cap?` · ${draft.cap}`:""}`} close={()=>setDraft(null)}><div className="library-new-modal-v87208"><div className="library-new-code-note-v87199">Codi curt editable: prefix del capítol + paraula clau + número correlatiu. Exemple: <b>MA_BAST_001</b>.</div><div className="library-editor-grid-v87196"><label><span>Concepte *</span><input autoFocus value={draft.concepte} onChange={e=>setDraft({...draft,concepte:e.target.value})}/></label><label><span>Unitat</span><input value={draft.ut} onChange={e=>setDraft({...draft,ut:e.target.value})}/></label><label><span>Capítol de la llibreria</span><select value={draft.cap} onChange={e=>changeDraftChapter87201(e.target.value)}><option value="">Selecciona un capítol...</option>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option></select></label><label><span>Prefix del codi</span><input maxLength="4" value={draft.codiPrefix} onChange={e=>setDraft({...draft,codiPrefix:e.target.value})} placeholder={libChapterInitials87199(draft.cap)}/></label><label><span>Paraula clau del codi</span><input maxLength="6" value={draft.codiParaula} onChange={e=>setDraft({...draft,codiParaula:e.target.value})} placeholder={libConceptKeyword87199(draft.concepte)}/></label><label><span>Preu unitari</span><input inputMode="decimal" value={draft.pu} onChange={e=>setDraft({...draft,pu:e.target.value})}/></label><label className="span-all"><span>Descripció llarga</span><textarea value={draft.desc} onChange={e=>setDraft({...draft,desc:e.target.value})}/></label>{clients.length>0&&<label><span>Client relacionat (opcional)</span><select value={draft.clientIds?.[0]||""} onChange={e=>setDraft({...draft,clientIds:e.target.value?[e.target.value]:[]})}><option value="">Sense client concret</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom||c.rao}</option>)}</select></label>}</div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setDraft(null)}>Cancel·lar</button><button type="button" className="primary" onClick={saveNew}>Guardar a la llibreria</button></div></div></Modal>}
    <section className="library-hero-v87196"><div><small>LLIBRERIA DE PARTIDES</small><h2>Treballa directament per capítols</h2><p>Obre un capítol per veure les seves partides. Les accions del capítol i cada fitxa s’obren en una finestra de treball clara.</p></div><div className="actions-inline"><button type="button" className="secondary" onClick={()=>startNew()}><Plus/> Crear partida</button><button type="button" className="primary" onClick={createStandaloneChapter87201}><Plus/> Crear capítol</button></div></section>
    <div className="library-policy-note-v87199"><b>Model únic i clar</b><span>No hi ha una llibreria global i una altra per client. Hi ha una única llibreria, un únic catàleg de capítols i vinculacions opcionals amb clients.</span></div>
    <div className="library-stats-v87196 library-stats-v87201"><div><small>Partides de la llibreria</small><b>{rows.length}</b></div><div><small>Capítols únics</small><b>{caps.length}</b></div><div><small>Relacionades amb clients</small><b>{linkedCount}</b></div><div><small>Sense client concret</small><b>{unlinkedCount}</b></div><button type="button" className="secondary" onClick={rebuildCodes87199}>Regenerar codis</button></div>
    <details open className="library-chapters-v87197 library-chapters-step-v87202">
      <summary><div><b>Capítols i partides</b><span>{caps.length} capítol/s · {rows.length} partida/es · obre un capítol per veure-les</span></div><em>Obrir ▾</em></summary>
      <div className="library-chapter-controls-v87199 library-chapter-controls-v87201"><label><span>Cercar capítol o partida</span><input value={managerSearch} onChange={e=>setManagerSearch(e.target.value)} placeholder="Nom, descripció, codi o unitat..."/></label><button type="button" className="primary" onClick={createStandaloneChapter87201}><Plus/> Crear capítol</button></div>
      <div className="library-insert-chapter-v87205"><div><b>Afegir un capítol entremig</b><span>Tria després de quin capítol va. L’app crea el número nou i desplaça els següents, conservant totes les partides.</span></div><label><span>Inserir després de</span><select value={insertAfterChapter} onChange={e=>setInsertAfterChapter(e.target.value)}><option value="">Selecciona un capítol numerat...</option>{numberedChapters87205.map(entry=><option key={entry.cap} value={entry.cap}>{entry.cap}</option>)}</select></label><label><span>Nom del nou capítol (sense número)</span><input value={insertChapterTitle} onChange={e=>setInsertChapterTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();insertAndRenumberChapter87205()}}} placeholder="Ex.: TANCAMENTS I DIVISÒRIES"/></label><button type="button" className="primary" onClick={insertAndRenumberChapter87205}>Inserir i renumerar</button><button type="button" className="secondary" onClick={compactNumberedChapters87205}>Compactar numeració</button></div>
      <div className="library-chapters-note-v87197"><b>Com funciona?</b><span>Obre el capítol i veuràs directament les seves partides. Obre una partida per completar la descripció, modificar el preu o editar-ne el descompost.</span></div>
      {duplicateChapterGroups.length>0&&<div className="library-duplicate-groups-v87202"><div className="library-duplicate-groups-head-v87202"><b>Possibles repetits detectats ({duplicateChapterGroups.length})</b><span>He ignorat la numeració inicial i petites diferències de plural. No es canvia res fins que tu triïs quin nom conservar.</span></div>{duplicateChapterGroups.map((group,index)=><div className="library-duplicate-group-v87202" key={`${group.join("-")}-${index}`}><span>{group.join(" · ")}</span><div>{group.map(cap=><button type="button" className="secondary small" key={cap} onClick={()=>mergeChapterGroup87202(group,cap)}>Conservar «{cap}»</button>)}</div></div>)}</div>}
      <div className="library-chapters-list-v87197 library-chapters-list-v87206">{managedChapterStats.length===0?<Empty text="No hi ha capítols ni partides amb aquesta cerca."/>:managedChapterStats.map(ch=>{
        const q=libNormText87196(managerSearch);
        const capMatches=!q||libNormText87196(ch.cap).includes(q);
        const chapterItems=rows.filter(item=>libText87196(item.cap||"General")===ch.cap).filter(item=>capMatches||libNormText87196([item.codiIntern,item.concepte,item.desc,item.ut,item.descompost].join(" ")).includes(q));
        const isOpen=openLibraryChapter===ch.cap;
        return <details open={isOpen} className="library-chapter-actions-v87206 library-chapter-with-items-v87207" key={ch.cap}>
          <summary onClick={event=>{event.preventDefault();setOpenLibraryChapter(current=>current===ch.cap?"":ch.cap);setOpenLibraryItem("")}}><div><b>{ch.cap}</b><span>{ch.total} partida/es · {ch.clients.size} client/s relacionat/s</span></div><em>Veure partides ▾</em></summary>
          {isOpen&&<div className="library-chapter-content-v87207">
            <div className="library-chapter-content-head-v87207"><div className="library-chapter-head-main-v87209"><div><b>{chapterItems.length} partida/es {q&&!capMatches?"coincidents amb la cerca":"en aquest capítol"}</b><span>Marca les que vulguis moure o obre una fitxa individual.</span></div><div className="actions-inline"><button type="button" className="secondary small" disabled={!chapterItems.length} onClick={()=>toggleChapterSelection87209(chapterItems)}>{chapterItems.length&&chapterItems.every(item=>selectedIds.includes(item.id))?"Desmarcar totes":"Seleccionar totes"}</button><button type="button" className="secondary small" onClick={()=>setChapterActionModal87208(ch.cap)}>Accions del capítol</button><button type="button" className="primary small" onClick={()=>startNew(ch.cap)}><Plus/> Nova partida aquí</button></div></div>{selectedIds.length>0&&<div className="library-chapter-bulk-v87209"><b>{selectedIds.length} partida/es seleccionada/es</b><select value={bulkChapter} onChange={e=>setBulkChapter(e.target.value)}><option value="">Moure al capítol...</option>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option></select><button type="button" className="primary" onClick={moveSelected87199}>Moure seleccionades</button><button type="button" className="secondary" onClick={()=>setSelectedIds([])}>Desmarcar</button><button type="button" className="danger" onClick={deleteSelected87199}>Eliminar</button></div>}</div>
            <div className="library-chapter-items-v87207">{chapterItems.length?chapterItems.map(renderLibraryItemRow87208):<Empty text="Aquest capítol encara no té partides."/>}</div>
            {false&&<details className="library-chapter-tools-v87207"><summary><div><b>Accions del capítol</b><span>Renombrar, fusionar o eliminar</span></div><em>Obrir accions ▾</em></summary><div className="library-chapter-actions-body-v87206">
              <section><div><b>Renombrar</b><span>Canvia el nom sense perdre ni moure les partides.</span></div><label><span>Nom nou del capítol</span><input value={capDrafts[ch.cap]??ch.cap} onChange={e=>setCapDrafts(prev=>({...prev,[ch.cap]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();renameChapter87197(ch.cap,capDrafts[ch.cap]??ch.cap)}}}/></label><button type="button" className="primary" onClick={()=>renameChapter87197(ch.cap,capDrafts[ch.cap]??ch.cap)}>Guardar nom</button></section>
              <section><div><b>Fusionar</b><span>Mou totes les partides a un altre capítol i elimina aquest.</span></div><label><span>Capítol que vols conservar</span><select value={capMergeTargets[ch.cap]||""} onChange={e=>setCapMergeTargets(prev=>({...prev,[ch.cap]:e.target.value}))}><option value="">Selecciona el capítol de destí...</option>{caps.filter(cap=>cap!==ch.cap).map(cap=><option key={cap} value={cap}>{cap}</option>)}</select></label><button type="button" className="secondary" disabled={!capMergeTargets[ch.cap]} onClick={()=>renameChapter87197(ch.cap,capMergeTargets[ch.cap])}>Fusionar</button></section>
              <section className="library-chapter-danger-v87206"><div><b>Eliminar</b><span>{ch.total?`Envia el capítol i les seves ${ch.total} partides a la paperera.`:"Aquest capítol és buit i es pot eliminar directament."}</span></div><button type="button" className="danger" onClick={()=>ch.total?deleteChapterAndItems87203(ch.cap):deleteEmptyChapter87201(ch.cap)}>{ch.total?`Eliminar capítol i ${ch.total} partides`:"Eliminar capítol buit"}</button></section>
            </div></details>}
          </div>}
        </details>;
      })}</div>
    </details>
    <details className="library-trash-v87203">
      <summary><div><b>Paperera · {trashBatches.length} eliminació/ns</b><span>Elements que pots recuperar; els pressupostos existents no es modifiquen</span></div><em>Obrir paperera ▾</em></summary>
      <div className="library-trash-head-v87203"><div><b>Elements eliminats i propostes descartades</b><span>Pots restaurar capítols, partides o tornar una proposta a pendents.</span></div>{trashBatches.length>0&&<button type="button" className="danger small" onClick={emptyLibraryTrash87203}>Buidar paperera</button>}</div>
      <div className="library-trash-list-v87203">{trashBatches.length===0?<Empty text="La paperera és buida."/>:trashBatches.map(batch=><div className="library-trash-row-v87203" key={batch.id}><div><b>{batch.reason||"Eliminació de la llibreria"}</b><span>{(batch.chapters||[]).length?`Capítol/s d’origen: ${(batch.chapters||[]).join(", ")} · `:""}{(batch.items||[]).length} {batch.kind==="candidates"?"proposta/es":"partida/es"}</span><small>{batch.deletedAt?new Date(batch.deletedAt).toLocaleString("ca-ES"):""}{(batch.items||[]).length?` · ${(batch.items||[]).slice(0,3).map(item=>item.concepte).join(" · ")}${batch.items.length>3?"…":""}`:""}</small></div><div><button type="button" className="primary small" onClick={()=>restoreTrashBatch87203(batch)}>{batch.kind==="candidates"?"Tornar a pendents":"Restaurar"}</button><button type="button" className="danger small" onClick={()=>deleteTrashBatchForever87203(batch)}>Eliminar definitivament</button></div></div>)}</div>
    </details>
    {draft&&<details open className="library-new-v87196"><summary>Crear una partida de llibreria</summary><div className="library-new-code-note-v87199">Codi curt editable: prefix del capítol + paraula clau + número correlatiu. Exemple: <b>MA_BAST_001</b>.</div><div className="library-editor-grid-v87196"><label><span>Concepte *</span><input autoFocus value={draft.concepte} onChange={e=>setDraft({...draft,concepte:e.target.value})}/></label><label><span>Unitat</span><input value={draft.ut} onChange={e=>setDraft({...draft,ut:e.target.value})}/></label><label><span>Capítol de la llibreria</span><select value={draft.cap} onChange={e=>changeDraftChapter87201(e.target.value)}><option value="">Selecciona un capítol...</option>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option></select></label><label><span>Prefix del codi</span><input maxLength="4" value={draft.codiPrefix} onChange={e=>setDraft({...draft,codiPrefix:e.target.value})} placeholder={libChapterInitials87199(draft.cap)}/></label><label><span>Paraula clau del codi</span><input maxLength="6" value={draft.codiParaula} onChange={e=>setDraft({...draft,codiParaula:e.target.value})} placeholder={libConceptKeyword87199(draft.concepte)}/></label><label><span>Preu unitari</span><input inputMode="decimal" value={draft.pu} onChange={e=>setDraft({...draft,pu:e.target.value})}/></label><label className="span-all"><span>Descripció llarga</span><textarea value={draft.desc} onChange={e=>setDraft({...draft,desc:e.target.value})}/></label>{clients.length>0&&<label><span>Client relacionat (opcional)</span><select value={draft.clientIds?.[0]||""} onChange={e=>setDraft({...draft,clientIds:e.target.value?[e.target.value]:[]})}><option value="">Sense client concret</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom||c.rao}</option>)}</select></label>}</div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setDraft(null)}>Cancel·lar</button><button type="button" className="primary" onClick={saveNew}>Guardar a la llibreria</button></div></details>}
    {pendingCandidates.length===0?<div className="library-no-pending-v87206"><b>No hi ha cap partida pendent de classificar</b><span>Tot el que s’ha detectat ja està guardat a la llibreria o descartat. Aquí no has de fer res.</span></div>:<details className="library-candidate-inbox-v871200">
      <summary><div><b>Partides pendents d’incorporar ({pendingCandidates.length})</b><span>Propostes detectades que encara has de guardar en un capítol o descartar</span></div><em>Obrir pendents ▾</em></summary>
      <div className="library-candidate-stats-v871200"><div><small>Antigues llibreries de clients</small><b>{candidateData.legacyCount}</b></div><div><small>Línies de pressupostos</small><b>{candidateData.budgetCount}</b></div><div><small>Ja guardades</small><b>{rows.length}</b></div><div><small>Pendents úniques</small><b>{pendingCandidates.length}</b></div></div>
      <div className="library-candidate-note-v871200"><b>Això encara NO és la llibreria.</b><span>El capítol que veus és només el que tenia la proposta al pressupost o fitxer d’origen. Selecciona-la i decideix: incorporar-la al capítol final que vulguis o descartar-la a la paperera.</span></div>
      <div className="library-candidate-filters-v871200"><label><span>Cercar</span><input value={candidateSearch} onChange={e=>{setCandidateSearch(e.target.value);setCandidateLimit(100);setCandidateSelected([])}} placeholder="Concepte, codi, capítol o obra"/></label><label><span>Origen de les dades</span><select value={candidateSource} onChange={e=>{setCandidateSource(e.target.value);setCandidateLimit(100);setCandidateSelected([])}}><option value="">Tots els orígens</option><option value="legacy">Antigues llibreries</option><option value="budget">Pressupostos</option></select></label><label><span>Client d’origen</span><select value={candidateClient} onChange={e=>{setCandidateClient(e.target.value);setCandidateLimit(100);setCandidateSelected([])}}><option value="">Tots els clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom||c.rao}</option>)}</select></label><label><span>Capítol d’origen</span><select value={candidateCap} onChange={e=>{setCandidateCap(e.target.value);setCandidateLimit(100);setCandidateSelected([])}}><option value="">Tots els capítols d’origen ({candidateCaps.length})</option>{candidateCaps.map(cap=><option key={cap} value={cap}>{cap}</option>)}</select></label></div>
      <div className="library-candidate-head-v871200"><span><b>{candidateFiltered.length}</b> resultats pendents</span><button type="button" className="secondary small" onClick={selectCandidateResults871200}>{candidateFiltered.length&&candidateFiltered.every(x=>candidateSelected.includes(x.id))?"Desmarcar resultats":"Seleccionar resultats"}</button></div>
      {candidateSelected.length>0&&<div className="library-candidate-bulk-v871200 library-candidate-bulk-v87201 library-candidate-bulk-v87204"><b>{candidateSelected.length} seleccionada/es</b><label><span>Capítol FINAL on les vols guardar *</span><select value={candidateDestinationChapter} onChange={e=>setCandidateDestinationChapter(e.target.value)}><option value="">Selecciona el capítol final...</option>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option><option value="__origin__">Conservar els capítols d’origen</option></select></label><label><span>Client relacionat (opcional)</span><select value={candidateTarget} onChange={e=>setCandidateTarget(e.target.value)}><option value="__origin__">Mantenir client/s d’origen</option><option value="__none__">Sense client concret</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom||c.rao}</option>)}</select></label><button type="button" className="primary" onClick={()=>addCandidates871200(pendingCandidates.filter(x=>candidateSelected.includes(x.id)))}>Incorporar al capítol final</button><button type="button" className="danger" onClick={()=>discardCandidates87204(pendingCandidates.filter(x=>candidateSelected.includes(x.id)))}>Descartar a la paperera</button><button type="button" className="secondary" onClick={()=>setCandidateSelected([])}>Desmarcar</button></div>}
      <div className="library-candidate-list-v871200">{candidateFiltered.length===0?<Empty text="No hi ha partides pendents amb aquests filtres."/>:candidateFiltered.slice(0,candidateLimit).map(item=>{
        const ownerNames=(item.candidateClientIds||[]).map(id=>clients.find(c=>String(c.id)===String(id))?.nom).filter(Boolean);
        return <div className={`library-candidate-row-v871200 ${candidateSelected.includes(item.id)?"selected":""}`} key={item.id}><input type="checkbox" checked={candidateSelected.includes(item.id)} onChange={()=>toggleCandidate871200(item.id)} aria-label="Seleccionar proposta pendent"/><div><b>{item.concepte}</b><span>Proposta de capítol d’origen — encara no assignada: {item.cap||"General"} · {item.ut||"ut"}</span><small>{(item.candidateSourceNames||[]).slice(0,3).join(" · ")}{ownerNames.length?` · Client: ${ownerNames.join(", ")}`:""}{item.candidateOccurrences>1?` · ${item.candidateOccurrences} aparicions`:""}</small>{item.desc&&<details><summary>Veure descripció</summary><p>{item.desc}</p></details>}</div><div className="library-candidate-price-v87204"><label><span>Preu a guardar</span><input inputMode="decimal" value={candidateOverrides[item.id]?.pu??qty2(item.pu||0)} onChange={e=>setCandidateOverrides(prev=>({...prev,[item.id]:{...(prev[item.id]||{}),pu:e.target.value}}))}/></label><small>Marca-la i tria incorporar o descartar</small></div></div>
      })}</div>
      {candidateFiltered.length>candidateLimit&&<button type="button" className="secondary library-candidate-more-v871200" onClick={()=>setCandidateLimit(x=>x+100)}>Mostrar 100 més · en queden {candidateFiltered.length-candidateLimit}</button>}
    </details>}
    {false&&<details id="library-saved-items-v87206" className="library-items-step-v87202">
      <summary><div><b>Partides guardades a la llibreria ({rows.length})</b><span>Obre per consultar, modificar, moure o eliminar partides</span></div><em>Obrir partides ▾</em></summary>
    <Card title="Partides guardades" action={<div className="actions-inline"><button type="button" className="primary" onClick={startNew}><Plus/> Crear partida</button><button type="button" className="secondary" onClick={consolidate}>Unificar partides idèntiques</button></div>}>
      <div className="library-delete-guide-v87203"><b>Eliminar partides</b><span>Marca la casella de cada partida —o prem «Seleccionar resultats»— i apareixerà el botó vermell «Eliminar seleccionades». Cada eliminació va a la paperera recuperable.</span></div>
      <div className="library-filters-v87196 library-filters-v87201"><label><span>Filtre de client</span><select value={clientFilter} onChange={e=>{setClientFilter(e.target.value);setSelectedIds([])}}><option value="">Tots els clients / tota la llibreria</option><option value="__none__">Sense client relacionat</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom||c.rao}</option>)}</select></label><label><span>Cercar partida</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, descripció o codi intern"/></label><label><span>Capítol únic</span><select value={capFilter} onChange={e=>setCapFilter(e.target.value)}><option value="">Tots els capítols ({caps.length})</option>{caps.map(c=><option key={c}>{c}</option>)}</select></label><label><span>Origen de la partida</span><select value={originFilter} onChange={e=>setOriginFilter(e.target.value)}><option value="">Totes les partides</option><option value="selected">Afegides expressament</option><option value="imported">Recuperades anteriorment</option></select></label></div>
      <div className="library-result-head-v87196"><span><b>{filtered.length}</b> partida/es · <b>{caps.length}</b> capítol/s al catàleg únic</span><button type="button" className="secondary small" onClick={selectFiltered87199}>{filtered.length&&filtered.every(x=>selectedIds.includes(x.id))?"Desmarcar resultats":"Seleccionar resultats"}</button></div>
      {selectedIds.length>0&&<div className="library-bulk-bar-v87199"><b>{selectedIds.length} seleccionada/es</b><select value={bulkChapter} onChange={e=>setBulkChapter(e.target.value)}><option value="">Moure a un capítol...</option>{caps.map(c=><option key={c} value={c}>{c}</option>)}<option value="__new__">+ Crear capítol nou</option></select><button type="button" className="primary" onClick={moveSelected87199}>Moure</button><button type="button" className="secondary" onClick={()=>setSelectedIds([])}>Desmarcar</button><button type="button" className="danger" onClick={deleteSelected87199}>Eliminar seleccionades</button></div>}
      <div className="library-quick-list-v87204">{filtered.length===0?<Empty text="No hi ha partides ja guardades amb aquests filtres."/>:<><div className="library-quick-head-v87204"><span>Partida ja guardada</span><span>Capítol assignat</span><span>Preu unitari</span><span>Accions</span></div>{filtered.slice(0,160).map(item=><div className="library-quick-row-v87204" key={`quick-${item.id}`}><label className="library-quick-select-v87204"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={()=>toggleLibrarySelection87199(item.id)}/><span><b>{item.concepte}</b><small>{item.codiIntern} · {item.ut||"ut"}</small></span></label><select value={item.cap||"General"} onChange={e=>changeItemChapter87198(item,e.target.value)}>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option></select><input inputMode="decimal" defaultValue={qty2(item.pu||0)} onBlur={e=>updateItem(item.id,{pu:parseNum8770(e.target.value)||0})}/><div><button type="button" className="secondary small" onClick={()=>toggleLibrarySelection87199(item.id)}>{selectedIds.includes(item.id)?"Desmarcar":"Seleccionar"}</button><button type="button" className="danger small" onClick={()=>removeItem(item.id)}>Eliminar</button></div></div>)}</>}</div>
      <details className="library-detailed-editor-v87204"><summary><b>Editor detallat de codis, descripcions i clients</b><span>Opcional · obre només si necessites modificar més dades</span></summary>
      <div className="library-list-v87196">{filtered.length===0?<Empty text="No hi ha partides de la llibreria amb aquests filtres."/>:filtered.slice(0,160).map(item=>{
        const owners=(item.clientIds||[]).map(id=>clients.find(c=>String(c.id)===String(id))?.nom).filter(Boolean);
        return <details className={`library-item-v87196 ${selectedIds.includes(item.id)?"selected-v87199":""}`} key={item.id}><summary><input className="library-select-v87199" type="checkbox" checked={selectedIds.includes(item.id)} onClick={e=>e.stopPropagation()} onChange={()=>toggleLibrarySelection87199(item.id)} aria-label="Seleccionar partida"/><div><b>{item.concepte}</b><span>{item.codiIntern} · {item.cap||"General"} · {item.ut||"ut"}</span><small>{owners.length?`Clients relacionats: ${owners.join(", ")}`:"Sense client relacionat"} · {libraryOrigin87199(item)==="imported"?"Recuperada":"Afegida expressament"}</small></div><div><small>Preu unitari</small><strong>{money(item.pu||0)}</strong><em>Obrir ▾</em></div></summary><div className="library-editor-grid-v87196"><label><span>Codi intern resultant</span><input value={item.codiIntern||""} readOnly/></label><label><span>Prefix capítol</span><input maxLength="4" defaultValue={item.codiPrefix||libChapterInitials87199(item.cap)} onBlur={e=>updateItemCodeParts871200(item,{codiPrefix:e.target.value})}/></label><label><span>Paraula clau</span><input maxLength="6" defaultValue={item.codiParaula||libConceptKeyword87199(item.concepte)} onBlur={e=>updateItemCodeParts871200(item,{codiParaula:e.target.value})}/></label><label><span>Número correlatiu</span><input type="number" min="1" max="999" defaultValue={item.codiSeq||1} onBlur={e=>updateItemCodeParts871200(item,{codiSeq:e.target.value})}/></label><label><span>Unitat</span><input defaultValue={item.ut||"ut"} onBlur={e=>updateItem(item.id,{ut:e.target.value})}/></label><label><span>Preu unitari</span><input inputMode="decimal" defaultValue={qty2(item.pu||0)} onBlur={e=>updateItem(item.id,{pu:parseNum8770(e.target.value)||0})}/></label><label className="span-all"><span>Concepte</span><input defaultValue={item.concepte||""} onBlur={e=>updateItem(item.id,{concepte:e.target.value})}/></label><label className="library-chapter-select-v87198"><span>Capítol del catàleg únic</span><select value={item.cap||"General"} onChange={e=>changeItemChapter87198(item,e.target.value)}>{caps.map(cap=><option key={cap} value={cap}>{cap}</option>)}<option value="__new__">+ Crear capítol nou</option></select>{chapterSavedId===item.id&&<small>Canvi guardat</small>}</label><label className="span-all"><span>Descripció llarga</span><textarea defaultValue={item.desc||""} onBlur={e=>updateItem(item.id,{desc:e.target.value})}/></label><details className="library-client-links-v87196"><summary>Clients relacionats ({(item.clientIds||[]).length})</summary>{clients.map(c=><label key={c.id}><input type="checkbox" checked={(item.clientIds||[]).some(id=>String(id)===String(c.id))} onChange={e=>updateItem(item.id,{clientIds:e.target.checked?[...new Set([...(item.clientIds||[]),String(c.id)])]:(item.clientIds||[]).filter(id=>String(id)!==String(c.id))})}/><span>{c.nom||c.rao}</span></label>)}</details>{(item.priceHistory||[]).length>0&&<details className="library-price-history-v87196"><summary>Històric de preus ({item.priceHistory.length})</summary>{item.priceHistory.slice().reverse().map((p,i)=><span key={`${p.data}-${p.pu}-${i}`}>{p.data||"—"} · {money(p.pu||0)} · {p.origen||"Llibreria"}</span>)}</details>}</div><div className="library-item-actions-v87196"><button type="button" className="danger" onClick={()=>removeItem(item.id)}>Eliminar de la llibreria</button></div></details>
      })}</div>
      </details>
    </Card>
    </details>}
  </div>
}
function MB({a,i,l,on}){return <button className={`menu-btn ${a?"active":""}`} onClick={on}>{i}<span>{l}</span></button>}
function Card({title,children,action}){return <div className="card"><div className="card-head"><h2>{title}</h2>{action}</div>{children}</div>}
function ActionMenu87213({label="Més accions",children}){
  return <details className="action-menu-v87213"><summary>{label}<span aria-hidden="true">⌄</span></summary><div className="action-menu-panel-v87213" onClick={e=>{if(e.target.closest("button,a,label"))e.currentTarget.parentElement?.removeAttribute("open")}}>{children}</div></details>
}
function Input(p){return <label><span>{p.label}</span><input name={p.name} defaultValue={p.defaultValue} readOnly={p.readOnly} onChange={p.onChange}/></label>}
function Kpi({t,v}){return <div className="kpi"><small>{t}</small><strong>{v}</strong></div>}
function Empty({text}){return <div className="empty">{text}</div>}
function Badge({estat}){let e=normalizeExpedientStatus878136(estat);let cls=e==="Acceptat"||e==="En curs / Actiu"?"ok":e==="Pressupostat"||e==="Pendent de resposta"||e==="En revisió"?"warn":e==="Anul·lat"||e==="No acceptat"?"danger":e==="Tancat"?"dark":"info";return <span className={`badge ${cls}`}>{e}</span>}

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
function eventTime8783(e){
  if(!e)return 0;
  // V87.137: agenda robusta. Primer respectem una data explícita si existeix.
  const direct=timeValue8783(e.iso||e.data||e.date||e.fecha||e.start||e.startDate||e.limit||e.limitDate||e.dataMaxima||e.dia);
  if(direct){
    const d=new Date(direct);
    const hh=Number(String(e.hora||e.time||'0').split(':')[0])||d.getHours()||0;
    const mm=Number(String(e.hora||e.time||'0:0').split(':')[1])||d.getMinutes()||0;
    d.setHours(hh,mm,0,0);
    return d.getTime();
  }
  if(e?.year&&e?.day){
    let rawM=Number(e.month??e.mes??0);
    let m=rawM;
    // V87.141: algunes cites creades des de formularis nous venen amb data ISO,
    // però les antigues poden portar month 0-11 o mes 1-12. Si ve per `mes`, el tractem com 1-12.
    if(e.mes!==undefined && rawM>=1)m=rawM-1;
    else if(rawM>11)m=rawM-1;
    const hh=Number(String(e.hora||e.time||'0').split(':')[0])||0;
    const mm=Number(String(e.hora||e.time||'0:0').split(':')[1])||0;
    return new Date(+e.year,m,+e.day,hh,mm,0,0).getTime();
  }
  if(e?.day){
    const now=new Date();
    let m=Number(e.month??e.mes??now.getMonth());
    if(m>11)m=m-1;
    return new Date(Number(e.year)||now.getFullYear(),m,+e.day,0,0,0,0).getTime();
  }
  return timeValue8783(e?.createdAt||e?.updatedAt||e?.id);
}
function itemTime8783(x){return Math.max(timeValue8783(x?.updatedAt),timeValue8783(x?.createdAt),timeValue8783(x?.iso),timeValue8783(x?.data),timeValue8783(x?.date),eventTime8783(x),timeValue8783(x?.id))}
function obraScore8783(o,d={}){
  const vals=[timeValue8783(o?.lastWorkedAt),timeValue8783(d?.lastWorkedAt),timeValue8783(o?.lastOpenedAt),timeValue8783(d?.lastOpenedAt),timeValue8783(o?.updatedAt),timeValue8783(o?.createdAt),timeValue8783(d?.updatedAt)];
  ['documents','fotos','actes','events','hores','pressupostosTecnic','facturesTecnic','certificacions','factures'].forEach(k=>(d[k]||[]).forEach(x=>vals.push(itemTime8783(x))));
  Object.values(d.sectionDocs||{}).forEach(arr=>(arr||[]).forEach(x=>vals.push(itemTime8783(x))));
  return Math.max(0,...vals);
}
function fmtActivityDate8783(t){if(!t)return 'Sense data';const d=new Date(t);return Number.isFinite(d.getTime())?d.toLocaleDateString('ca-ES'):'Sense data'}

function clampActivityTime878134(t){
  const v=timeValue8783(t);
  if(!v)return 0;
  const now=Date.now();
  // Les dates futures de planificació/certificació no han d'ordenar "Darrers expedients".
  return v>now+60*60*1000?0:v;
}
function obraRecentScore878134(o,d={}){
  // V87.135: els "Darrers expedients" només poden ordenar-se per accés/treball real.
  // No utilitzem dates de certificació, agenda o planificació perquè poden ser futures o històriques.
  const vals=[
    clampActivityTime878134(o?.lastWorkedAt),clampActivityTime878134(d?.lastWorkedAt),
    clampActivityTime878134(o?.lastOpenedAt),clampActivityTime878134(d?.lastOpenedAt),
    clampActivityTime878134(o?.updatedAt),clampActivityTime878134(d?.updatedAt),
    clampActivityTime878134(o?.createdAt)
  ];
  return Math.max(0,...vals);
}
function fmtRecentActivity878134(t){return t?fmtActivityDate8783(t):'Sense accés registrat'}
function agentRoleOrder878134(a={}){
  const r=String(a.rol||'').toLowerCase();
  if(r.includes('promotor')||r.includes('propiet')||r.includes('client'))return 0;
  if(r.includes('constructor')||r.includes('contractista'))return 1;
  if(r.includes('direcció facultativa')||r.includes('direccio facultativa'))return 2;
  if(r.includes('arquitecte tècnic')||r.includes('arquitecte tecnic')||r.includes('deo'))return 3;
  if(r.includes('arquitecte'))return 4;
  if(r.includes('coordin'))return 5;
  return 10;
}
function sortAgents878134(list=[]){return uniqAgents8768(list).sort((a,b)=>agentRoleOrder878134(a)-agentRoleOrder878134(b)||String(a.nom||'').localeCompare(String(b.nom||''),'ca',{numeric:true}))}
function primaryPromotorAgent878134(agents=[],obra={},client={}){
  const sorted=sortAgents878134(agents||[]);
  const propRaw=String(obra?.propietat||'').trim();
  const prop=propRaw.toLowerCase();
  const linked=obra?.promotorAgentId?sorted.find(a=>String(a.id||'')===String(obra.promotorAgentId)):null;
  const exact=linked||(prop?sorted.find(a=>String(a.nom||'').trim().toLowerCase()===prop || String(a.empresa||'').trim().toLowerCase()===prop):null);
  if(exact)return {...exact,nom:propRaw||exact.nom,nif:obra?.nifPropietat||exact.nif||'',adreca:obra?.adrecaPropietat||exact.adreca||'',email:obra?.emailPropietat||exact.email||'',telefon:obra?.telefonPropietat||exact.telefon||''};
  if(propRaw){
    return {id:obra?.promotorAgentId||'',nom:propRaw,empresa:propRaw,nif:obra?.nifPropietat||'',adreca:obra?.adrecaPropietat||'',email:obra?.emailPropietat||'',telefon:obra?.telefonPropietat||'',rol:'Promotor / propietat'};
  }
  const found=sorted.find(a=>{const r=String(a.rol||'').toLowerCase();return r.includes('promotor')||r.includes('propiet')||r.includes('client')});
  if(found)return found;
  return {nom:client?.nom||'Client pendent',empresa:client?.rao||client?.nom||'',nif:client?.nif||'',adreca:client?.adreca||'',email:client?.email||'',telefon:client?.telefon||'',rol:'Promotor / propietat'};
}
function fiscalClientBlock878134(obra={},client={},agents=[]){
  const p=primaryPromotorAgent878134(agents,obra,client);
  return `<b>${escHtmlV8772(p.nom||obra?.propietat||client?.nom||'Client')}</b><br>${p.empresa&&p.empresa!==p.nom?`Empresa: ${escHtmlV8772(p.empresa)}<br>`:''}NIF/CIF: ${escHtmlV8772(p.nif||obra?.nifPropietat||'Pendent')}<br>${escHtmlV8772(p.adreca||obra?.adrecaPropietat||'Adreça pendent')}${p.email||p.telefon?`<br>${escHtmlV8772([p.email,p.telefon].filter(Boolean).join(' · '))}`:''}`;
}
function collectActivities8783(obres=[],odata={},clients=[]){
  const out=[];
  const clientName=o=>clients.find(c=>c.id===o.client)?.nom||o.propietat||'Client';
  for(const o of obres){
    const d=odata[o.id]||{};
    const push=(type,title,detail,t,tab)=>out.push({type,title,detail,time:t,obra:o,tab});
    push('Expedient','Expedient modificat',`${expedientCode8739(o)} · ${o.nom}`,obraRecentScore878134(o,d),'Resum');
    (d.events||[]).forEach(e=>{const t=eventTime8783(e);if(t&&t<=Date.now()+60*60*1000)push('Agenda',e.title||e.titol||'Cita / avís',`${clientName(o)} · ${e.hora||''} · ${e.note||e.detail||''}`,t,'Agenda / Avisos')});
    (d.actes||[]).forEach(a=>push('Acta',a.titol||'Acta',`${expedientCode8739(o)} · ${a.data||''}`,itemTime8783(a),'Actes'));
    (d.documents||[]).forEach(doc=>push('Document',doc.nom||'Document',`${doc.folder||'Documents'} · ${expedientCode8739(o)}`,itemTime8783(doc),'Documents'));
    Object.entries(d.sectionDocs||{}).forEach(([sec,arr])=>(arr||[]).forEach(doc=>push('Document',doc.nom||'Document',`${sec} · ${expedientCode8739(o)}`,itemTime8783(doc),'Documents')));
    (d.pressupostosTecnic||[]).forEach(p=>push('Pressupost',p.concepte||'Pressupost honoraris',`${money(p.base||0)} · ${p.estat||'Pendent'}`,itemTime8783(p),'Honoraris'));
    (d.facturesTecnic||[]).forEach(f=>push('Factura',f.concepte||'Factura honoraris',`${money(f.base||0)} · ${f.estat||'Pendent'}`,itemTime8783(f),'Honoraris'));
    const certMap878136=new Map();
    (d.certificacions||[]).forEach(c=>{const key=String(c.numero||c.id||'');const t=Math.max(clampActivityTime878134(c.updatedAt),clampActivityTime878134(c.createdAt),clampActivityTime878134(c.data));const prev=certMap878136.get(key);if(!prev||t>prev.t)certMap878136.set(key,{c,t});});
    [...certMap878136.values()].forEach(({c,t})=>{const n=+c.numero||0;const calc=(d.partides||[]).reduce((sum,r)=>sum+certQty8783(r,n)*parseNum8770(r.pu),0);push('Certificació',`Certificació ${c.numero||''}`,`${money(calc||c.import||0)} · ${expedientCode8739(o)}`,t||itemTime8783(c),'Gestió obra')});
    (d.hores||[]).forEach(h=>push('Temps',h.tasca||h.etiqueta||'Registre de temps',`${qty2(h.hores||0)} h · ${money((+h.hores||0)*(+h.preu||0))}`,itemTime8783(h),'Gestió temps'));
  }
  return out.filter(a=>a.time).sort((a,b)=>b.time-a.time);
}
function certQty8783(r,n){
  if(n<=0)return 0;
  if(isCertHidden878132(r,n))return 0;
  const lines=(r.certMesuresByNum||{})[String(n)];
  if(lines&&lines.length){
    const measured=medicioTotal8780(lines,r.ut);
    if(Math.abs(measured)>0.000001)return measured;
  }
  if(r.certsByNum&&r.certsByNum[String(n)]!==undefined){
    const modern=parseNum8770(r.certsByNum[String(n)]);
    if(Math.abs(modern)>0.000001)return modern;
  }
  // V87.212 · compatibilitat amb certificacions creades en versions antigues.
  // Durant anys també es van guardar com cert_1, cert_2...; si el resum
  // certsByNum no existeix, aquestes quantitats continuen sent vàlides.
  if(r[`cert_${n}`]!==undefined)return parseNum8770(r[`cert_${n}`]);
  if(n===1)return parseNum8770(r.certAnterior);
  if(n===2)return parseNum8770(r.certActual);
  return 0;
}
function certTotalsForPrint8780(rows=[],doc={}){
  const nums=new Set([...(doc.prevNum?[doc.prevNum]:[]),...(doc.certNum?[doc.certNum]:[])]);
  rows.forEach(r=>{Object.keys(r.certsByNum||{}).forEach(n=>nums.add(+n));Object.keys(r.certMesuresByNum||{}).forEach(n=>nums.add(+n));});
  return [...nums].filter(n=>Number.isFinite(+n)&&+n>0).sort((a,b)=>a-b).map(n=>({n,total:rows.reduce((s,r)=>s+certQty8783(r,+n)*parseNum8770(r.pu),0)}));
}
function certTotalsUpTo8793(rows=[],certNum=1){
  const max=Number(certNum)||1;
  const nums=new Set();
  for(let i=1;i<=max;i++)nums.add(i);
  rows.forEach(r=>{Object.keys(r.certsByNum||{}).forEach(n=>{n=+n;if(n>0&&n<=max)nums.add(n)});Object.keys(r.certMesuresByNum||{}).forEach(n=>{n=+n;if(n>0&&n<=max)nums.add(n)});});
  return [...nums].filter(n=>Number.isFinite(n)&&n>0&&n<=max).sort((a,b)=>a-b).map(n=>({n,total:rows.reduce((s,r)=>s+certQty8783(r,n)*parseNum8770(r.pu),0)}));
}
function originRowsForCert8793(rows=[],certNum=1){
  const max=Number(certNum)||1;
  return (rows||[]).map(r=>{
    let qOrigin=0;
    for(let i=1;i<=max;i++)qOrigin+=certQty8783(r,i);
    const impOrigin=qOrigin*parseNum8770(r.pu);
    return {...r,qOrigin,impOrigin,pctOrigin:(+r.q||0)?qOrigin/(+r.q)*100:0};
  }).filter(r=>(+r.qOrigin||0)>0 || (+r.impOrigin||0)>0).sort((a,b)=>capOrder878132(a.cap)-capOrder878132(b.cap)||String(a.cap||"").localeCompare(String(b.cap||""),"ca",{numeric:true})||compareCodi878132(a.codi,b.codi));
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
    const impOrigin = r.impOrigen!==undefined ? (+r.impOrigen||0) : (r.impOrigin!==undefined ? (+r.impOrigin||0) : qOrigin*parseNum8770(r.pu));
    const pctOrigin = r.pctOrigen!==undefined ? (+r.pctOrigen||0) : (r.pctOrigin!==undefined ? (+r.pctOrigin||0) : ((+r.q||0)?qOrigin/(+r.q)*100:0));
    return {...r,qOrigin,impOrigin,pctOrigin};
  }).filter(r=>(+r.qOrigin||0)>0 || (+r.impOrigin||0)>0).sort((a,b)=>capOrder878132(a.cap)-capOrder878132(b.cap)||String(a.cap||"").localeCompare(String(b.cap||""),"ca",{numeric:true})||compareCodi878132(a.codi,b.codi));
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
      return sum+q*parseNum8770(r.pu);
    },0)
  }));
  const originRows=originRowsFromDoc8794(rows,max);
  const totalOrigen = doc.totalOrigen!==undefined ? (+doc.totalOrigen||0) : originRows.reduce((s,r)=>s+(+r.impOrigin||0),0);
  const anterior = certTotals.filter(c=>+c.n<max).reduce((s,c)=>s+(+c.total||0),0);
  const actual = totalOrigen - anterior;
  return {certTotals,totalOrigen,anterior,actual,prevTotals:certTotals.filter(c=>+c.n<max)};
}

function monthName878137(d=new Date()){return d.toLocaleDateString('ca-ES',{month:'long'}).replace(/^./,c=>c.toUpperCase())}
function inMonth878137(t,ref=new Date()){if(!t)return false;const d=new Date(t);return d.getFullYear()===ref.getFullYear()&&d.getMonth()===ref.getMonth()}
function eventKey878137(e){return [e.id||'',e.title||e.titol||'',eventTime8783(e)||'',e.obraId||e.obra||''].join('|')}
function uniqueEvents878137(list=[]){const m=new Map();(list||[]).forEach(e=>{const k=eventKey878137(e);if(!m.has(k))m.set(k,e)});return [...m.values()]}
function taskStatusTone878137(st){const s=String(st||'').toLowerCase();if(s.includes('fet'))return 'ok';if(s.includes('proc')||s.includes('curs'))return 'info';if(s.includes('resposta'))return 'warn';if(s.includes('anul'))return 'danger';return 'pending'}
function taskEvent878137(t,obra={}){const iso=toInputDate8743(t.data||todayISO8743());const [yy,mm,dd]=String(iso).split('-').map(Number);return {id:'task-'+t.id,taskId:t.id,obraId:obra.id,day:dd,month:(mm||1)-1,year:yy||new Date().getFullYear(),data:iso,title:t.text||'Tasca pendent',type:'Tasca',tipus:'Tasca',hora:t.hora||'09:00',note:`${t.prioritat||'Normal'} · ${t.estat||'Pendent'}`,detail:`${t.prioritat||'Normal'} · ${t.estat||'Pendent'}`,color:t.prioritat==='Urgent'?'red':'orange',obra:obra.nom||''}}
function updateTaskHome878137(setOdata,obra,task,status){
  if(!obra?.id||!task?.id||!setOdata)return;
  setOdata(prev=>{
    const d=prev[obra.id]||empty();
    const nextTasks=(d.tasques||[]).map(t=>t.id===task.id?{...t,estat:status,updatedAt:new Date().toISOString()}:t);
    const manualEvents=(d.events||[]).filter(e=>String(e.id||'')!=='task-'+task.id);
    const nextTask=nextTasks.find(t=>t.id===task.id);
    const shouldEvent=nextTask&&nextTask.data&&!['Fet','Anul·lat'].includes(nextTask.estat);
    return {...prev,[obra.id]:{...d,tasques:nextTasks,events:shouldEvent?[...manualEvents,taskEvent878137(nextTask,obra)]:manualEvents,updatedAt:new Date().toISOString(),lastWorkedAt:new Date().toISOString()}};
  })
}
function taskDueTime878140(t={}){return timeValue8783(t.dataMaxima||t.dataEntrega||t.limit||t.data)||0}
function taskDueLabel878140(t={}){const v=t.dataMaxima||t.dataEntrega||t.limit||t.data;return v?fmtActivityDate8783(timeValue8783(v)):"Sense data màxima"}
function taskDeadlineTone878140(t={}){
  const due=taskDueTime878140(t);
  if(!due)return "neutral";
  const today=todayStartMs878136();
  const days=Math.ceil((due-today)/(24*60*60*1000));
  if(days<0)return "overdue";
  if(days<=2)return "critical";
  if(days<=7)return "soon";
  return "ok";
}
function taskDeadlinePercent878140(t={}){
  const due=taskDueTime878140(t);
  if(!due)return 25;
  const today=todayStartMs878136();
  const days=Math.ceil((due-today)/(24*60*60*1000));
  if(days<0)return 100;
  return Math.max(8,Math.min(100,100-((days/30)*92)));
}
function collectPendingTasks878137(obres=[],odata={}){
  return (obres||[]).flatMap(o=>((odata[o.id]||{}).tasques||[]).map(t=>({obra:o,task:t,time:taskDueTime878140(t)})))
    .filter(x=>!['Fet','Anul·lat'].includes(String(x.task.estat||'Pendent')))
    .sort((a,b)=>(a.time||9999999999999)-(b.time||9999999999999)||String(a.obra.nom||'').localeCompare(String(b.obra.nom||''),'ca',{numeric:true}));
}
function taskStatusCounts878140(tasks=[]){
  const base={Pendent:0,"En procés":0,"Pendent resposta":0,Urgent:0,Vencudes:0};
  (tasks||[]).forEach(({task:t})=>{
    if(taskDeadlineTone878140(t)==='overdue')base.Vencudes++;
    if(String(t.prioritat||'')==='Urgent')base.Urgent++;
    const st=String(t.estat||'Pendent');
    if(st.includes('proc')||st.includes('curs'))base['En procés']++;
    else if(st.includes('resposta'))base['Pendent resposta']++;
    else base.Pendent++;
  });
  return base;
}
function taskDonutStyle878140(counts={}){
  const vals=[counts.Pendent||0,counts['En procés']||0,counts['Pendent resposta']||0,counts.Urgent||0,counts.Vencudes||0];
  const cols=['#64748b','#2563eb','#f59e0b','#8b5cf6','#dc2626'];
  const total=vals.reduce((a,b)=>a+b,0)||1;let acc=0;const parts=[];
  vals.forEach((v,i)=>{if(!v)return;const a=acc/total*360;acc+=v;const b=acc/total*360;parts.push(`${cols[i]} ${a}deg ${b}deg`)});
  return {background:`conic-gradient(${parts.length?parts.join(','):'#e2e8f0 0deg 360deg'})`};
}
function monthActivityCount878137(o,d={},ref=new Date()){
  let n=0;
  (d.events||[]).forEach(e=>{if(inMonth878137(eventTime8783(e),ref))n++});
  (d.tasques||[]).forEach(t=>{if(inMonth878137(timeValue8783(t.data),ref)&&!['Fet','Anul·lat'].includes(String(t.estat||'')))n++});
  (d.hores||[]).forEach(h=>{if(inMonth878137(timeValue8783(h.data),ref))n++});
  (d.certificacions||[]).forEach(c=>{if(inMonth878137(Math.max(timeValue8783(c.updatedAt),timeValue8783(c.data)),ref))n++});
  return n;
}

function createHomeTask878139(setOdata,obra,taskDraft){
  if(!obra?.id||!setOdata)return false;
  const text=String(taskDraft?.text||'').trim();
  if(!text){alert('Escriu el nom de la feina pendent.');return false;}
  const nowIso=new Date().toISOString();
  const task={
    id:'tsk-home-'+Date.now(),
    text,
    estat:taskDraft.estat||'Pendent',
    prioritat:taskDraft.prioritat||'Normal',
    data:taskDraft.dataMaxima||taskDraft.data||'',
    dataMaxima:taskDraft.dataMaxima||taskDraft.data||'',
    hora:taskDraft.hora||'09:00',
    notes:taskDraft.notes||'',
    origen:'Inici',
    createdAt:nowIso,
    updatedAt:nowIso
  };
  setOdata(prev=>{
    const d=prev[obra.id]||empty();
    const tasks=[...(d.tasques||[]),task];
    const manualEvents=(d.events||[]).filter(e=>String(e.id||'')!=='task-'+task.id);
    const shouldEvent=task.data&&!['Fet','Anul·lat'].includes(task.estat);
    return {...prev,[obra.id]:{...d,tasques:tasks,events:shouldEvent?[...manualEvents,taskEvent878137(task,obra)]:manualEvents,updatedAt:nowIso,lastWorkedAt:nowIso}};
  });
  return true;
}
function clientOptionsForHome878139(clients=[],obres=[]){
  const ids=new Set((obres||[]).map(o=>o.client||'__sense__'));
  return [...ids].map(id=>({id,label:id==='__sense__'?'Sense client':clientName878138(clients,{client:id})})).sort((a,b)=>String(a.label).localeCompare(String(b.label),'ca',{numeric:true}));
}

function Inici({clients,setClients,obres,setObres,odata={},setOdata,events,setScreen,openObra,openObraTab,newObra}){
const now=new Date();
const monthName=monthName878137(now);
const todayLabel878141=now.toLocaleDateString('ca-ES',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
const agendaLocal878146=readGlobalAgenda878146();
const allEvents=uniqueEvents878137([...(events||[]),...agendaLocal878146].map((e,i)=>cleanAgendaEvent87109?cleanAgendaEvent87109(e,i):e).filter(Boolean));
const properes=allEvents.filter(e=>{const t=eventTime8783(e);return t&&t>=todayStartMs878136()}).sort((a,b)=>eventTime8783(a)-eventTime8783(b)).slice(0,8);
const tasks=collectPendingTasks878137(obres,odata);
const taskCounts=taskStatusCounts878140(tasks);
const tasksByClient=groupByClient878138(tasks,clients,x=>x.obra.client);
const obertsMes=[...obres].filter(o=>isExpedientOpen878136(o.estat)).map(o=>({o,d:odata[o.id]||{},count:monthActivityCount878137(o,odata[o.id]||{},now),recent:obraRecentScore878134(o,odata[o.id]||{})})).filter(x=>x.count>0||normalizeExpedientStatus878136(x.o.estat)==='En curs / Actiu'||normalizeExpedientStatus878136(x.o.estat)==='Acceptat').sort((a,b)=>String(clientName878138(clients,a.o)).localeCompare(String(clientName878138(clients,b.o)),'ca',{numeric:true})||b.count-a.count||b.recent-a.recent);
const worksByClient=groupByClient878138(obertsMes,clients,x=>x.o.client);
const [showNewTask,setShowNewTask]=useState(false);
const [openWorkMonth,setOpenWorkMonth]=useState(false);
const [viewTask,setViewTask]=useState(null);
const clientRoleOptions878181=['Promotor','Arquitecte','Arquitecte tècnic','Immobiliària','Constructora','Industrial','Administració','Particular','Autònom','Altres'];
const [taskDraft,setTaskDraft]=useState({clientId:(clients?.[0]?.id)||'__new__',newClientNom:'',newClientTipus:'Promotor',newClientNif:'',obraId:'__new__',newObraNom:'',newObraTipus:'Gestió integral d’obra',text:'',prioritat:'Normal',estat:'Pendent',dataMaxima:todayISO8743(),hora:'09:00',notes:''});
const selectedClient=taskDraft.clientId||'__new__';
const currentClient=clients.find(c=>c.id===selectedClient);
const taskObres=(obres||[]).filter(o=>selectedClient!=='__new__'&&(o.client||'')===selectedClient&&isExpedientOpen878136(o.estat)).sort((a,b)=>String(a.nom||'').localeCompare(String(b.nom||''),'ca',{numeric:true}));
const selectedObra=taskObres.find(o=>o.id===taskDraft.obraId);
function newSlug878140(txt,prefix){return `${prefix}-${String(txt||prefix).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,38)||Date.now()}-${Date.now().toString(36)}`}
function buildTask878140(extra={}){
  const nowIso=new Date().toISOString();
  return {id:'tsk-home-'+Date.now(),text:String(taskDraft.text||'').trim(),estat:taskDraft.estat||'Pendent',prioritat:taskDraft.prioritat||'Normal',data:taskDraft.dataMaxima||'',dataMaxima:taskDraft.dataMaxima||'',hora:taskDraft.hora||'09:00',notes:taskDraft.notes||'',origen:'Inici',createdAt:nowIso,updatedAt:nowIso,...extra};
}
function saveHomeTask878140(){
  if(!String(taskDraft.text||'').trim()){alert('Escriu la feina pendent.');return;}
  let cid=selectedClient;
  let createdClient=null;
  if(selectedClient==='__new__'){
    const nom=String(taskDraft.newClientNom||'').trim();
    if(!nom){alert('Escriu el nom del client o promotor.');return;}
    cid=newSlug878140(nom,'client');
    createdClient={id:cid,nom,rao:nom,tipus:taskDraft.newClientTipus||'Promotor',nif:taskDraft.newClientNif||'',contacte:'',telefon:'',email:'',adreca:'',color:'blue',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  }
  let oid=taskDraft.obraId;
  let createdObra=null;
  if(!oid||oid==='__new__'){
    const nom=String(taskDraft.newObraNom||'').trim();
    if(!nom){alert('Escriu el nom de l’expedient o treball.');return;}
    oid=newSlug878140(nom,'exp');
    const clientForName=createdClient||currentClient||{};
    createdObra={id:oid,client:cid,any:String(new Date().getFullYear()),nom,subtitol:'',tipologia:taskDraft.newObraTipus||'Gestió integral d’obra',tipusTreball:taskDraft.newObraTipus||'Gestió integral d’obra',estat:'En curs / Actiu',pressupost:0,certificacio:0,propietat:clientForName.nom||taskDraft.newClientNom||'Client pendent',nifPropietat:clientForName.nif||taskDraft.newClientNif||'',adreca:'',codiPostal:'',poblacio:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),lastOpenedAt:new Date().toISOString(),lastWorkedAt:new Date().toISOString()};
  } else if(!selectedObra){alert('Selecciona un expedient o crea’n un de nou.');return;}
  const task=buildTask878140();
  const activeUser878181=currentAppUser8779()||'hector';
  if(createdClient)setClients?.(prev=>{const next=[...(prev||[]),createdClient];lsSet8779('aco_clients',JSON.stringify(next),activeUser878181);return next});
  if(createdObra)setObres?.(prev=>{const next=assignMissingCodes8739([...(prev||[]),createdObra],createdClient?[...(clients||[]),createdClient]:clients);lsSet8779('aco_obres',JSON.stringify(next),activeUser878181);return next});
  setOdata?.(prev=>{
    const d=prev[oid]||empty();
    const tasks=[...(d.tasques||[]),task];
    const shouldEvent=task.dataMaxima&&!['Fet','Anul·lat'].includes(task.estat);
    const next={...prev,[oid]:{...d,tasques:tasks,events:shouldEvent?[...(d.events||[]).filter(e=>String(e.id||'')!=='task-'+task.id),taskEvent878137(task,{...(createdObra||selectedObra||{}),id:oid,nom:createdObra?.nom||selectedObra?.nom||''})]:d.events||[],updatedAt:new Date().toISOString(),lastWorkedAt:new Date().toISOString()}};
    saveOdata878104(next,activeUser878181);
    return next;
  });
  setTaskDraft({clientId:cid,obraId:oid,text:'',prioritat:'Normal',estat:'Pendent',dataMaxima:todayISO8743(),hora:'09:00',notes:'',newClientNom:'',newClientTipus:'Promotor',newClientNif:'',newObraNom:'',newObraTipus:'Gestió integral d’obra'});
  setShowNewTask(false);
}
function updateTaskField878140(obra,task,patch){
  if(!obra?.id||!task?.id)return;
  setOdata?.(prev=>{
    const d=prev[obra.id]||empty();
    const nextTasks=(d.tasques||[]).map(t=>t.id===task.id?{...t,...patch,updatedAt:new Date().toISOString()}:t);
    const updated=nextTasks.find(t=>t.id===task.id);
    const manualEvents=(d.events||[]).filter(e=>String(e.id||'')!=='task-'+task.id);
    const shouldEvent=updated&&updated.dataMaxima&&!['Fet','Anul·lat'].includes(updated.estat);
    return {...prev,[obra.id]:{...d,tasques:nextTasks,events:shouldEvent?[...manualEvents,taskEvent878137(updated,obra)]:manualEvents,updatedAt:new Date().toISOString(),lastWorkedAt:new Date().toISOString()}}
  })
}
function createLinkedVisit878186(obra,task){
  if(!obra?.id||!task?.id)return;
  const data=toInputDate8743(task.citaData||task.dataCita||task.dataMaxima||task.data||todayISO8743());
  const hora=task.citaHora||task.horaCita||'09:00';
  const raw={id:`visit-task-${task.id}-${Date.now()}`,taskId:task.id,obraId:obra.id,data,iso:data,title:task.citaTitle||`Visita / cita · ${task.text||'Tasca'}`,type:'Cita vinculada',tipus:'Visita d’obra',hora,client:clientName878138(clients,obra),obra:obra.nom||'',adreca:obra.adreca||'',detail:`Cita creada des de la tasca: ${task.text||''}`,note:`Cita creada des de tasca · ${task.prioritat||'Normal'}`,color:'blue'};
  const ev=cleanAgendaEvent87109(raw);
  if(!ev)return;
  setOdata?.(prev=>{const d=prev[obra.id]||empty();return {...prev,[obra.id]:{...d,events:[...(Array.isArray(d.events)?d.events:[]),ev],updatedAt:new Date().toISOString(),lastWorkedAt:new Date().toISOString()}}});
  alert('Cita vinculada creada dins l’agenda de l’expedient.');
}
function doTaskAction878140(obra,task,action){
  if(action==='view'){setViewTask({obra,task});return}
  if(action==='enter'){openObraTab?openObraTab(obra.id,'Tasques'):openObra(obra.id);return}
  if(action==='time'){openObraTab?openObraTab(obra.id,'Gestió temps'):openObra(obra.id);return}
  if(action==='process')updateTaskField878140(obra,task,{estat:'En procés'});
  if(action==='done')updateTaskField878140(obra,task,{estat:'Fet'});
  if(action==='cancel')updateTaskField878140(obra,task,{estat:'Anul·lat'});
}
return <>
<section className="home-pro-v878140">
  <div className="home-pro-title-v878140"><span>Panell operatiu · {monthName}</span><h1>Tasques, entregues i treball actiu</h1><p>Una pantalla d’entrada més neta: primer el que has de fer, després el calendari immediat i una lectura visual de l’estat.</p></div>
  <div className="home-pro-kpis-v878140">
    <div className="home-today-card-v878141"><small>Avui</small><b>{todayLabel878141}</b><span>{tasks.length} tasca/ques pendents · {properes.length} cita/es futures</span></div>
    <div><small>Pròximes cites</small><b>{properes.length}</b><span>només futures</span></div>
    <div><small>Treballs oberts</small><b>{obertsMes.length}</b><span>{monthName}</span></div>
  </div>
</section>
<section className="home-pro-layout-v878140">
  <div className="home-pro-main-v878140">
    <Card title="Feines pendents a fer" action={<button className="primary" onClick={()=>setShowNewTask(v=>!v)}>{showNewTask?'Tancar':' + Afegir tasca'}</button>}>
      {showNewTask&&<div className="home-task-create-v878139 home-task-create-v878140">
        <div className="home-task-create-head-v878139"><b>Nova tasca / feina pendent</b><span>La data és la data màxima d’entrega. Pots crear client i expedient des d’aquí sense anar a una altra pestanya.</span></div>
        <div className="home-task-form-v878139 home-task-form-v878140">
          <label><span>Client</span><select value={selectedClient} onChange={e=>{const cid=e.target.value;const first=(obres||[]).find(o=>o.client===cid&&isExpedientOpen878136(o.estat));setTaskDraft(d=>({...d,clientId:cid,obraId:cid==='__new__'?'__new__':(first?.id||'__new__')}))}}><option value="__new__">+ Crear nou client</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
          {selectedClient==='__new__'&&<><label><span>Nou client / contacte</span><input value={taskDraft.newClientNom||''} onChange={e=>setTaskDraft(d=>({...d,newClientNom:e.target.value}))} placeholder="Nom del client"/></label><label><span>Rol / tipologia</span><select value={taskDraft.newClientTipus||'Promotor'} onChange={e=>setTaskDraft(d=>({...d,newClientTipus:e.target.value}))}>{clientRoleOptions878181.map(t=><option key={t}>{t}</option>)}</select></label><label><span>NIF/CIF opcional</span><input value={taskDraft.newClientNif||''} onChange={e=>setTaskDraft(d=>({...d,newClientNif:e.target.value}))}/></label></>}
          <label><span>Expedient o treball</span><select value={taskDraft.obraId||'__new__'} onChange={e=>setTaskDraft(d=>({...d,obraId:e.target.value}))}><option value="__new__">+ Crear nou expedient</option>{taskObres.map(o=><option key={o.id} value={o.id}>{expedientCode8739(o)} · {o.nom}</option>)}</select></label>
          {(!taskDraft.obraId||taskDraft.obraId==='__new__')&&<><label><span>Nou expedient</span><input value={taskDraft.newObraNom||''} onChange={e=>setTaskDraft(d=>({...d,newObraNom:e.target.value}))} placeholder="Nom de l’obra o treball"/></label><label><span>Tipus feina</span><select value={taskDraft.newObraTipus||'Gestió integral d’obra'} onChange={e=>setTaskDraft(d=>({...d,newObraTipus:e.target.value}))}><option>Gestió integral d’obra</option><option>Direcció d’obra</option><option>Direcció d’execució</option><option>Seguretat i salut</option><option>Informe / certificat</option><option>Altres</option></select></label></>}
          <label className="span-2-v878139"><span>Tasca / feina pendent</span><input value={taskDraft.text||''} onChange={e=>setTaskDraft(d=>({...d,text:e.target.value}))} placeholder="Ex. Preparar certificació, revisar pressupost, enviar acta..."/></label>
          <label><span>Data màxima entrega</span><input type="date" value={taskDraft.dataMaxima||''} onChange={e=>setTaskDraft(d=>({...d,dataMaxima:e.target.value}))}/></label>
          <label><span>Prioritat</span><select value={taskDraft.prioritat||'Normal'} onChange={e=>setTaskDraft(d=>({...d,prioritat:e.target.value}))}><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgent</option></select></label>
          <label><span>Estat inicial</span><select value={taskDraft.estat||'Pendent'} onChange={e=>setTaskDraft(d=>({...d,estat:e.target.value}))}><option>Pendent</option><option>En procés</option></select></label>
          <label><span>Hora límit opcional</span><input type="time" value={taskDraft.hora||'09:00'} onChange={e=>setTaskDraft(d=>({...d,hora:e.target.value}))}/></label>
          <label className="span-2-v878139"><span>Notes internes</span><input value={taskDraft.notes||''} onChange={e=>setTaskDraft(d=>({...d,notes:e.target.value}))} placeholder="Comentari ràpid per saber què s’ha de fer"/></label>
        </div>
        <div className="home-task-actions-v878139"><button className="primary" onClick={saveHomeTask878140}>Guardar tasca</button></div>
      </div>}
      <div className="client-task-list-v878138 client-task-list-v878140">
      {tasksByClient.length===0?<Empty text="No tens tasques pendents. Afegeix-ne una amb el botó superior."/>:tasksByClient.map(g=><section key={g.key} className="client-task-group-v878138 client-task-group-v878140"><header><b>{g.label}</b><span>{g.items.length} tasca/ques</span></header>{g.items.map(({obra:o,task:t})=>{const tone=taskDeadlineTone878140(t);return <div key={`${o.id}-${t.id}`} className={`task-card-pro-v878140 ${tone}`}><div className="task-colorbar-v878140"><i style={{width:`${taskDeadlinePercent878140(t)}%`}}/></div><button className="task-main-v878137 task-main-pro-v878140" onClick={()=>setViewTask({obra:o,task:t})}><b>{t.text||'Tasca pendent'}</b><span>{o.nom} · {t.estat||'Pendent'} · màxim {taskDueLabel878140(t)} · {t.prioritat||'Normal'}</span>{t.notes&&<em>{t.notes}</em>}</button><select className="task-action-select-v878140" defaultValue="" onChange={e=>{const v=e.target.value;e.currentTarget.value='';doTaskAction878140(o,t,v)}}><option value="" disabled>Accions</option><option value="view">Veure / editar tasca</option><option value="enter">Entrar a l’expedient</option><option value="time">Iniciar temps</option><option value="process">Marcar en procés</option><option value="done">Fet</option><option value="cancel">Anul·lar</option></select></div>})}</section>)}
      </div>
    </Card>
  </div>
  <aside className="home-pro-side-v878140">
    <Card title="Pròximes cites i avisos"><div className="upcoming-list-v878138 upcoming-list-v878140">{properes.length===0?<p>No hi ha cites futures.</p>:properes.map(e=><button key={eventKey878137(e)} onClick={()=>e.obraId?openObraTab?.(e.obraId,'Agenda / Avisos'):setScreen('Agenda')}><b>{e.title||e.titol||e.tipus||'Cita'}</b><span>{fmtEventDate878136(e)} · {e.hora||'Hora pendent'}</span>{e.obra&&<em>{e.obra}</em>}</button>)}</div></Card>
    <Card title={`Treballs oberts · ${monthName}`} action={<button className="secondary small" onClick={()=>setOpenWorkMonth(v=>!v)}>{openWorkMonth?'Amagar':'Veure'}</button>}>{openWorkMonth?<div className="client-group-list-v878138 client-group-list-v878140">{worksByClient.length===0?<Empty text="No hi ha treballs oberts destacats aquest mes."/>:worksByClient.map(g=><section key={g.key} className="client-group-v878138"><header><b>{g.label}</b><span>{g.items.length}</span></header><div className="month-work-grid-v878137 grouped-v878138">{g.items.map(({o,count,recent})=><button key={o.id} onClick={()=>openObra(o.id)} className={`month-work-card-v878137 month-work-card-v878138 ${statusKeyPress8776(normalizeExpedientStatus878136(o.estat))}`}><b>{o.nom}</b><span>{expedientCode8739(o)} · {normalizeExpedientStatus878136(o.estat)}</span><em>{count?`${count} moviment(s) aquest mes`:(recent?`Darrer accés ${fmtActivityDate8783(recent)}`:'Sense moviment del mes')}</em></button>)}</div></section>)}</div>:<div className="home-collapsed-note-v878140"><b>{obertsMes.length}</b><span>treball(s) oberts aquest mes. Obre el desplegable només quan ho necessitis.</span></div>}</Card>
  </aside>
</section>
{viewTask&&<div className="modal-backdrop"><div className="modal task-modal-v878140"><div className="modal-head"><div><h2>Veure / editar tasca</h2><p>{viewTask.obra.nom} · {clientName878138(clients,viewTask.obra)}</p></div><button onClick={()=>setViewTask(null)}><X/></button></div><div className="form-grid"><label className="span-all"><span>Tasca</span><input value={viewTask.task.text||''} onChange={e=>setViewTask(v=>({...v,task:{...v.task,text:e.target.value}}))}/></label><label><span>Estat</span><select value={viewTask.task.estat||'Pendent'} onChange={e=>setViewTask(v=>({...v,task:{...v.task,estat:e.target.value}}))}><option>Pendent</option><option>En procés</option><option>Fet</option><option>Anul·lat</option></select></label><label><span>Prioritat</span><select value={viewTask.task.prioritat||'Normal'} onChange={e=>setViewTask(v=>({...v,task:{...v.task,prioritat:e.target.value}}))}><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgent</option></select></label><label><span>Data màxima entrega</span><input type="date" value={toInputDate8743(viewTask.task.dataMaxima||viewTask.task.data)||''} onChange={e=>setViewTask(v=>({...v,task:{...v.task,dataMaxima:e.target.value,data:e.target.value}}))}/></label><label><span>Hora</span><input type="time" value={viewTask.task.hora||'09:00'} onChange={e=>setViewTask(v=>({...v,task:{...v.task,hora:e.target.value}}))}/></label><label className="span-all"><span>Notes</span><textarea value={viewTask.task.notes||''} onChange={e=>setViewTask(v=>({...v,task:{...v.task,notes:e.target.value}}))}/></label><div className="span-all task-visit-box-v87186"><b>Cita addicional vinculada</b><span>La data màxima queda com entrega. Aquí pots crear una visita/reunió prèvia sense convertir la tasca en una cita.</span><div><label><span>Data cita</span><input type="date" value={viewTask.task.citaData||toInputDate8743(viewTask.task.dataMaxima||viewTask.task.data)||''} onChange={e=>setViewTask(v=>({...v,task:{...v.task,citaData:e.target.value}}))}/></label><label><span>Hora cita</span><input type="time" value={viewTask.task.citaHora||'09:00'} onChange={e=>setViewTask(v=>({...v,task:{...v.task,citaHora:e.target.value}}))}/></label></div></div></div><div className="modal-actions"><button className="secondary" onClick={()=>{openObraTab?openObraTab(viewTask.obra.id,'Tasques'):openObra(viewTask.obra.id);setViewTask(null)}}>Entrar a l’expedient</button><button className="secondary" onClick={()=>{openObraTab?openObraTab(viewTask.obra.id,'Gestió temps'):openObra(viewTask.obra.id);setViewTask(null)}}>Iniciar temps</button><button className="secondary" onClick={()=>createLinkedVisit878186(viewTask.obra,viewTask.task)}>Crear cita vinculada</button><button className="primary" onClick={()=>{updateTaskField878140(viewTask.obra,viewTask.task,viewTask.task);setViewTask(null)}}>Guardar canvis</button></div></div></div>}
</>}
function clientName878138(clients=[],obra={}){return (clients||[]).find(c=>c.id===obra.client)?.nom||obra.clientNom||obra.propietat||'Sense client'}
function groupByClient878138(items=[],clients=[],getId=x=>x?.client){const map=new Map();(items||[]).forEach(item=>{const id=getId(item)||'__sense__';const fake={client:id,clientNom:id==='__sense__'?'Sense client':''};const label=id==='__sense__'?'Sense client':clientName878138(clients,fake);if(!map.has(id))map.set(id,{key:id,label,items:[]});map.get(id).items.push(item)});return [...map.values()].sort((a,b)=>String(a.label).localeCompare(String(b.label),'ca',{numeric:true}))}
function canonicalClientType878191(v){
  const n=normalizeSearch878191(v);
  if(n.includes("construct")||n.includes("contractista"))return "Constructora";
  if(n.includes("industrial"))return "Industrial";
  if(n.includes("arquitecte tecnic")||n.includes("aparellador"))return "Arquitecte tècnic";
  if(n.includes("arquitecte"))return "Arquitecte";
  if(n.includes("direccio facultativa"))return "Direcció Facultativa";
  if(n.includes("promotor")||n.includes("propiet"))return "Promotor";
  if(n.includes("administr"))return "Administració";
  if(n.includes("particular"))return "Particular";
  if(n.includes("autonom"))return "Autònom";
  if(n.includes("subcontract"))return "Subcontractat";
  return String(v||"Altres")||"Altres";
}
function Clients({clients,obres=[],odata={},cs,setCs,ct,setCt,openClient,newClient,setClients,setObres}){
  const tipusOpts=["Promotor","Arquitecte","Arquitecte tècnic","Direcció Facultativa","Constructora","Industrial","Administració","Particular","Autònom","Subcontractat","Altres"];
  const [clientManageId878134,setClientManageId878134]=useState(null);
  const [openGroups878189,setOpenGroups878189]=useState({});
  const [compact878189,setCompact878189]=useState(true);
  const visibleClients878191=useMemo(()=>{
    const query=normalizeSearch878191(cs),type=canonicalClientType878191(ct||"");
    return (clients||[]).filter(c=>{
      const haystack=normalizeSearch878191([c.nom,c.rao,c.contacte,c.tipus,c.nif,c.email,c.telefon,c.adreca,c.codiPostal,c.poblacio,c.provincia,c.observacions].join(" "));
      return (!query||haystack.includes(query))&&(!ct||canonicalClientType878191(c.tipus)===type);
    }).sort((a,b)=>String(a.nom||"").localeCompare(String(b.nom||""),"ca",{numeric:true,sensitivity:"base"}));
  },[clients,cs,ct]);
  function saveClient878134(id,patch){
    const clean={...patch,updatedAt:new Date().toISOString()};
    setClients?.(prev=>(prev||[]).map(c=>c.id===id?{...c,...clean}:c));
    setClientManageId878134(null);
  }
  function deleteClient878134(c,rel){
    const linked=(rel?.all||[]).length;
    const msg=linked?`Aquest contacte té ${linked} expedient(s) vinculats. Si l'elimines, els expedients NO s'esborren, però quedaran sense client assignat. Continuar?`:`Eliminar definitivament aquest contacte?`;
    if(!confirm(msg))return;
    setClients?.(prev=>(prev||[]).filter(x=>x.id!==c.id));
    if(linked)setObres?.(prev=>(prev||[]).map(o=>o.client===c.id?{...o,client:"",updatedAt:new Date().toISOString()}:o));
    setClientManageId878134(null);
  }
  const docsCount=(oid)=>{
    const d=odata?.[oid]||{};
    const base=(d.documents||[]).length+(d.fotos||[]).length;
    const sections=Object.values(d.sectionDocs||{}).reduce((sum,a)=>sum+(a||[]).length,0);
    const actaDocs=(d.actes||[]).reduce((sum,a)=>sum+(a.docs||[]).length+(a.croquis||[]).length,0);
    return base+sections+actaDocs;
  };
  const relatedToClient=(c)=>{
    const cn=String(c.nom||"").toLowerCase();
    const direct=obres.filter(o=>o.client===c.id || String(o.propietat||"").toLowerCase()===cn);
    const byAgent=obres.filter(o=>{
      const d=odata?.[o.id]||{};
      return (d.agents||[]).some(a=>{const an=String(a.nom||"").toLowerCase();return an&&cn&&(an.includes(cn)||cn.includes(an));});
    }).filter(o=>!direct.some(x=>x.id===o.id));
    return {direct,byAgent,all:[...direct,...byAgent]};
  };
  const total=(clients||[]).length;
  const industrials=(clients||[]).filter(c=>["Industrial","Constructora","Subcontractat"].includes(canonicalClientType878191(c.tipus))).length;
  const grouped=tipusOpts.map(t=>[t,visibleClients878191.filter(c=>canonicalClientType878191(c.tipus)===t)]).filter(([,arr])=>arr.length);
  const altres=visibleClients878191.filter(c=>!tipusOpts.includes(canonicalClientType878191(c.tipus)));
  if(altres.length)grouped.push(["Altres",altres]);
  const hasFilter=!!(cs||ct);
  function toggleGroup878189(t){setOpenGroups878189(p=>({...p,[t]:!p[t]}));}
  return <div className="clients-page-v8774 clients-page-v878189">
    <Card title="Clients, tècnics i industrials" action={<button className="primary" onClick={newClient}><Plus/> Nou contacte</button>}>
      <div className="clients-toolbar-v8774 clients-toolbar-v878189">
        <div><h2>Directori professional</h2><p>Contactes agrupats per tipologia. Obre només el grup que necessites.</p></div>
        <div className="clients-kpis-v8774 clients-kpis-v878189"><div><span>Total</span><b>{total}</b></div><div><span>Obra</span><b>{industrials}</b></div><div><span>Tipologies</span><b>{grouped.length}</b></div></div>
      </div>
      <div className="client-filter-visible-v878191">
        <div className="client-filter-head-v878191"><b>Filtrar clients</b><span>{hasFilter?`${visibleClients878191.length} de ${total} contactes`:"Tots els contactes"}</span></div>
        <div className="filters filters-v8774"><div className="search-field"><Search size={16}/><input value={cs} onChange={e=>setCs(e.target.value)} placeholder="Nom, empresa, NIF, telèfon, email, adreça o població..."/></div><select value={ct} onChange={e=>setCt(e.target.value)}><option value="">Totes les tipologies</option>{tipusOpts.map(t=><option key={t}>{t}</option>)}</select><button type="button" className="secondary" onClick={()=>{setCs("");setCt("")}}>Netejar</button><button type="button" className="secondary" onClick={()=>setCompact878189(v=>!v)}>{compact878189?"Vista detallada":"Vista compacta"}</button></div>
      </div>
      <div className="client-list-v8774 client-list-v878189">
        {visibleClients878191.length===0?<Empty text="No hi ha contactes amb aquest filtre."/>:grouped.map(([tipus,items])=>{
          const opened=hasFilter||!!openGroups878189[tipus];
          return <section key={tipus} className="client-type-section-v8774 client-type-section-v878189"><button type="button" className="client-type-head-v8774 client-type-head-button-v878189" onClick={()=>toggleGroup878189(tipus)}><b>{opened?"▾":"▸"} {tipus}</b><span>{items.length} contacte{items.length!==1?"s":""}</span></button>{opened&&items.map(c=>{const rel=relatedToClient(c);const docs=rel.all.reduce((sum,o)=>sum+docsCount(o.id),0);return <div className="client-admin-item-v878134 client-admin-item-v878189" key={c.id}><button className={compact878189?"client-row-v8774 client-row-v878189 compact":"client-row-v8774 client-row-v878189"} onClick={()=>openClient(c.id)}><div className={`client-logo ${c.color||"blue"}`}>{c.logo?<img src={c.logo}/>:(c.nom||"CL").slice(0,2).toUpperCase()}</div><div className="client-main-v8774"><strong>{c.nom}</strong><span>{c.rao||"Raó social pendent"}</span><small>{c.contacte||"Sense contacte"} · {c.telefon||"Sense telèfon"} · {[c.codiPostal,c.poblacio].filter(Boolean).join(" ")||c.adreca||"Sense població"}</small></div>{!compact878189&&<><div className="client-metrics-v8774"><span>Exp.</span><b>{rel.all.length}</b><em>{rel.direct.length} directes · {rel.byAgent.length} agent</em></div><div className="client-metrics-v8774"><span>Docs</span><b>{docs}</b><em>vinculats</em></div></>}<div className="client-tag-v8774">{c.tipus||"Client"}</div></button><button type="button" className="secondary client-manage-toggle-v878134" onClick={()=>setClientManageId878134(clientManageId878134===c.id?null:c.id)}>{clientManageId878134===c.id?"Tancar gestió":"Gestionar"}</button>{clientManageId878134===c.id&&<ClientInlineEditor878134 client={c} tipusOpts={tipusOpts} onSave={patch=>saveClient878134(c.id,patch)} onDelete={()=>deleteClient878134(c,rel)}/>}</div>})}</section>
        })}
      </div>
    </Card>
  </div>
}

function ClientInlineEditor878134({client,tipusOpts=[],onSave,onDelete}){
  const [f,setF]=useState(()=>({...client}));
  function ch(k,v){setF(x=>({...x,[k]:v}))}
  return <div className="client-inline-editor-v878134">
    <div className="client-inline-head-v878134"><b>Editar / esborrar contacte</b><span>Aquesta pestanya manté el directori ordenat sense entrar a una altra pantalla.</span></div>
    <div className="form-grid no-pad">
      <label><span>Nom</span><input value={f.nom||""} onChange={e=>ch("nom",e.target.value)}/></label>
      <label><span>Raó social</span><input value={f.rao||""} onChange={e=>ch("rao",e.target.value)}/></label>
      <label><span>Tipologia</span><select value={f.tipus||"Altres"} onChange={e=>ch("tipus",e.target.value)}>{tipusOpts.map(t=><option key={t}>{t}</option>)}</select></label>
      <label><span>NIF / CIF</span><input value={f.nif||""} onChange={e=>ch("nif",e.target.value)}/></label>
      <label><span>Email</span><input value={f.email||""} onChange={e=>ch("email",e.target.value)}/></label>
      <label><span>Telèfon</span><input value={f.telefon||""} onChange={e=>ch("telefon",e.target.value)}/></label>
      <label className="span-all"><span>Adreça</span><input value={f.adreca||""} onChange={e=>ch("adreca",e.target.value)}/></label>
      <label><span>CP</span><input value={f.codiPostal||""} onChange={e=>ch("codiPostal",e.target.value)}/></label>
      <label><span>Població</span><input value={f.poblacio||""} onChange={e=>ch("poblacio",e.target.value)}/></label>
      <label className="span-all"><span>Contacte / observacions</span><input value={f.contacte||""} onChange={e=>ch("contacte",e.target.value)}/></label>
    </div>
    <div className="actions-inline"><button type="button" className="primary" onClick={()=>onSave?.(f)}>Guardar client</button><button type="button" className="danger" onClick={onDelete}>Eliminar client</button></div>
  </div>
}

function FitxaClient({client,obres,openObra,back}){
  const [edit,setEdit]=useState(false);
  const [showDetails,setShowDetails]=useState(false);
  const [form,setForm]=useState({...client});
  const tipus=["Promotor","Arquitecte","Arquitecte tècnic","Direcció Facultativa","Constructora","Autònom","Subcontractat","Industrial","Administració","Particular","Altres"];
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
  const rows=sortExpedientsByCreation878191([...(obres||[])].filter(Boolean).filter(o=>{
    const text=(expedientCode8739(o)+" "+(o.nom||"")+" "+(o.subtitol||"")+" "+(o.tipusTreball||o.tipologia||"")+" "+(o.poblacio||"")).toLowerCase();
    return (!q||text.includes(q.toLowerCase())) && (!estat||o.estat===estat) && (!any||String(o.any||"")===String(any));
  }));
  const anys=[...new Set((obres||[]).map(o=>o.any).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a),"ca",{numeric:true}));
  const estats=[...new Set((obres||[]).map(o=>o.estat||"Sense estat"))];
  const byYear=rows.reduce((m,o)=>{const y=o.any||"Sense any";(m[y]??=[]).push(o);return m;},{});
  return <Card title={`Expedients vinculats a ${clientName}`} action={<span className="muted">{rows.length} expedient{rows.length===1?"":"s"}</span>}>
    <div className="filters client-exp-filters-v878108"><div className="search-field"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtrar expedients del client..."/></div><select value={any} onChange={e=>setAny(e.target.value)}><option value="">Tots els anys</option>{anys.map(y=><option key={y}>{y}</option>)}</select><select value={estat} onChange={e=>setEstat(e.target.value)}><option value="">Tots els estats</option>{estats.map(e=><option key={e}>{e}</option>)}</select></div>
    <div className="list">{rows.length===0?<Empty text="Aquest client encara no té expedients amb aquest filtre."/>:Object.entries(byYear).sort((a,b)=>String(b[0]).localeCompare(String(a[0]),"ca",{numeric:true})).map(([y,items])=><section key={y} className="year-section"><div className="year-title">{y}</div>{items.map(o=><ObraRow key={o.id} o={o} open={openObra}/>)}</section>)}</div>
  </Card>
}

function Projectes({byClient,clients,openObra,deleteObra,f,newObra,setScreen}){
const [sort878192,setSort878192]=useState({key:"numero",dir:"desc"});
let flat=[];Object.entries(byClient||{}).forEach(([cid,ys])=>Object.entries(ys||{}).forEach(([y,items])=>(items||[]).forEach(o=>flat.push(o))));
let clientNom=o=>clients.find(x=>x.id===o.client)?.nom||o.propietat||"—";
const textSort878192=v=>String(v??"").trim();
const compareText878192=(a,b)=>textSort878192(a).localeCompare(textSort878192(b),"ca",{numeric:true,sensitivity:"base"});
const compareExpedients878192=(a,b)=>{
  let result=0;
  if(sort878192.key==="numero")result=compareText878192(expedientYear878191(a),expedientYear878191(b))||expedientNumber878191(a)-expedientNumber878191(b);
  else if(sort878192.key==="codi")result=compareText878192(expedientCode8739(a),expedientCode8739(b));
  else if(sort878192.key==="client")result=compareText878192(clientNom(a),clientNom(b));
  else if(sort878192.key==="nom")result=compareText878192(a.nom,b.nom)||compareText878192(a.subtitol,b.subtitol);
  else if(sort878192.key==="tipus")result=compareText878192(moduleLabel8737(a),moduleLabel8737(b));
  else if(sort878192.key==="adreca")result=compareText878192([a.adreca,a.poblacio].filter(Boolean).join(" "),[b.adreca,b.poblacio].filter(Boolean).join(" "));
  else if(sort878192.key==="estat")result=compareText878192(normalizeExpedientStatus878136(a.estat),normalizeExpedientStatus878136(b.estat));
  return (sort878192.dir==="asc"?result:-result)||compareText878192(expedientCode8739(a),expedientCode8739(b));
};
flat=[...flat].sort(compareExpedients878192);
let total=flat.length, actius=flat.filter(o=>isExpedientOpen878136(o.estat)).length;
let tipusCount=flat.reduce((m,o)=>{let t=moduleLabel8737(o);m[t]=(m[t]||0)+1;return m},{});
let estatCount=flat.reduce((m,o)=>{let t=o.estat||"Sense estat";m[t]=(m[t]||0)+1;return m},{});
const yearLabel878192=o=>o.any||String(new Date().getFullYear());
const yearDirection878192=(sort878192.key==="numero"||sort878192.key==="codi")?sort878192.dir:"desc";
let anys=[...new Set(flat.map(yearLabel878192))].sort((a,b)=>(yearDirection878192==="asc"?1:-1)*compareText878192(a,b));
let topTipus=Object.entries(tipusCount).sort((a,b)=>b[1]-a[1]);
let clearAll=()=>{f.setOs("");f.setOc("");f.setOt("");f.setOy("");f.setOst("")};
const byYearClient=flat.reduce((acc,o)=>{const y=yearLabel878192(o);const cn=clientNom(o);acc[y]??={};acc[y][cn]??=[];acc[y][cn].push(o);return acc},{});
const SORT_OPTIONS878192=[{key:"numero",label:"Número"},{key:"codi",label:"Codi expedient"},{key:"client",label:"Client"},{key:"nom",label:"Nom treball"},{key:"tipus",label:"Tipologia"},{key:"adreca",label:"Adreça / municipi"},{key:"estat",label:"Estat"}];
const chooseSort878192=key=>setSort878192(s=>s.key===key?{key,dir:s.dir==="asc"?"desc":"asc"}:{key,dir:key==="numero"?"desc":"asc"});
const sortHead878192=(key,label)=><button type="button" className={`exp-sort-head-v878192 ${sort878192.key===key?"active":""}`} onClick={()=>chooseSort878192(key)} title={`Ordenar per ${label.toLowerCase()}`}><span>{label}</span><b>{sort878192.key===key?(sort878192.dir==="asc"?"▲":"▼"):"↕"}</b></button>;
return <div className="expedients-page-v8741 expedients-page-v8742 expedients-page-v87119">
  <Card title="Llistat professional d’expedients" action={<button className="primary" onClick={newObra}><Plus/> Nou expedient</button>}>
    <details className="mobile-filter-drawer-v87119">
      <summary><span>Filtres i cerca</span><b>{f.ot||f.oc||f.oy||f.ost||f.os?"Filtres actius":"Tots"}</b></summary>
      <div className="filters filters-v8741 filters-v8742 filters-v87119">
        <div className="search-field"><Search size={16}/><input value={f.os} onChange={e=>f.setOs(e.target.value)} placeholder="Buscar expedient..."/></div>
        <select value={f.oc} onChange={e=>f.setOc(e.target.value)}><option value="">Tots els clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select>
        <select value={f.ot||""} onChange={e=>f.setOt(e.target.value)}><option value="">Tots els tipus de treball</option>{WORK_TYPES8737.map(t=><option key={t} value={t}>{t}</option>)}</select>
        <select value={f.oy} onChange={e=>f.setOy(e.target.value)}><option value="">Tots els anys</option>{[...new Set([...anys,"2026","2025"].filter(Boolean))].map(y=><option key={y}>{y}</option>)}</select>
        <select value={f.ost} onChange={e=>f.setOst(e.target.value)}><option value="">Tots els estats</option>{EXPEDIENT_STATUS878136.map(st=><option key={st}>{st}</option>)}</select>
        <button type="button" className="secondary" onClick={clearAll}>Netejar filtres</button>
      </div>
    </details>
    <div className="filters filters-v8741 filters-v8742 desktop-filters-v87119">
      <div className="search-field"><Search size={16}/><input value={f.os} onChange={e=>f.setOs(e.target.value)} placeholder="Buscar per número, codi, client, treball, adreça o municipi..."/></div>
      <select value={f.oc} onChange={e=>f.setOc(e.target.value)}><option value="">Tots els clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select>
      <select value={f.ot||""} onChange={e=>f.setOt(e.target.value)}><option value="">Tots els tipus de treball</option>{WORK_TYPES8737.map(t=><option key={t} value={t}>{t}</option>)}</select>
      <select value={f.oy} onChange={e=>f.setOy(e.target.value)}><option value="">Tots els anys</option><option>2026</option><option>2025</option></select>
      <select value={f.ost} onChange={e=>f.setOst(e.target.value)}><option value="">Tots els estats</option>{EXPEDIENT_STATUS878136.map(st=><option key={st}>{st}</option>)}</select>
    </div>
    <div className="exp-list-header-v8741"><span>{total} expedients filtrats</span><div className="actions-inline exp-sort-controls-v878192"><label><span>Ordenar per</span><select value={sort878192.key} onChange={e=>setSort878192({key:e.target.value,dir:e.target.value==="numero"?"desc":"asc"})}>{SORT_OPTIONS878192.map(o=><option key={o.key} value={o.key}>{o.label}</option>)}</select></label><button type="button" className="secondary" onClick={()=>setSort878192(s=>({...s,dir:s.dir==="asc"?"desc":"asc"}))}>{sort878192.dir==="asc"?"Ascendent ▲":"Descendent ▼"}</button><button className="secondary" onClick={clearAll}>Netejar filtres</button>{f.ot&&<button className="secondary" onClick={()=>f.setOt("")}>Tornar a tots els tipus</button>}</div></div>
    <div className="exp-mobile-tree-v87119">
      {flat.length===0?<Empty text="No hi ha expedients amb aquest filtre."/>:anys.map((any,idx)=><details key={any} open={idx===0} className="exp-year-drawer-v87119"><summary><span>{any}</span><b>{flat.filter(o=>String(yearLabel878192(o))===String(any)).length} expedients</b></summary><div>{Object.entries(byYearClient[any]||{}).sort((a,b)=>flat.indexOf(a[1][0])-flat.indexOf(b[1][0])).map(([cn,items])=><details key={cn} className="exp-client-drawer-v87119"><summary><span>{cn}</span><b>{items.length}</b></summary><div>{items.map(o=><div key={o.id} className="exp-mobile-card-v87119"><button type="button" onClick={()=>openObra(o.id)}><small>{expedientCode8739(o)}</small><strong>{o.nom}</strong><span>{moduleLabel8737(o)}</span><em>{o.adreca||"—"} · {o.poblacio||"—"}</em></button><div><Badge estat={o.estat}/><select defaultValue="" onChange={e=>{const v=e.target.value;e.currentTarget.value="";if(v==="open")openObra(o.id);if(v==="delete")deleteObra?.(o.id)}}><option value="" disabled>Accions</option><option value="open">Obrir expedient</option><option value="delete">Eliminar</option></select></div></div>)}</div></details>)}</div></details>)}
    </div>
    <div className="exp-table-wrap-v8741 exp-table-wrap-v87119">
      <table className="exp-table-v8741 exp-table-v8742">
        <thead><tr><th>{sortHead878192("numero","Número")}</th><th>{sortHead878192("codi","Codi expedient")}</th><th>{sortHead878192("client","Client")}</th><th>{sortHead878192("nom","Nom treball")}</th><th>{sortHead878192("tipus","Tipologia treball")}</th><th>{sortHead878192("adreca","Adreça / municipi")}</th><th>{sortHead878192("estat","Estat")}</th><th>Accions</th></tr></thead>
        <tbody>{flat.length===0&&<tr><td colSpan="8"><Empty text="No hi ha expedients amb aquest filtre."/></td></tr>}{anys.map(any=><React.Fragment key={any}>
          <tr className="year-row-v8742"><td colSpan="8">{any}</td></tr>
          {flat.filter(o=>String(yearLabel878192(o))===String(any)).map(o=><tr key={o.id} onClick={()=>openObra(o.id)}><td><b>{o.expedientBase||String(expedientCode8739(o)).slice(0,8)}</b></td><td><span className="exp-code-v8739">{expedientCode8739(o)}</span></td><td>{clientNom(o)}</td><td><strong>{o.nom}</strong><small>{o.subtitol}</small></td><td>{moduleLabel8737(o)}</td><td><span>{o.adreca||"—"}</span><small>{o.poblacio||"—"}</small></td><td><Badge estat={o.estat}/></td><td><button type="button" className="danger small-v8777" onClick={(e)=>{e.stopPropagation();deleteObra?.(o.id)}}>Eliminar</button></td></tr>)}
        </React.Fragment>)}</tbody>
      </table>
    </div>
  </Card>
  <details className="exp-side-drawer-v87148">
    <summary><span>Filtres avançats i resum</span><b>{total} expedients · {actius} oberts</b></summary>
    <div className="exp-side-drawer-grid-v87148">
      <Card title="Resum del filtre"><div className="exp-side-kpis-v8741"><div><span>Total filtrat</span><b>{total}</b></div><div><span>Oberts</span><b>{actius}</b></div></div><div className="active-filter-box-v8742"><b>Filtre actual</b><span>{f.ot||f.oc||f.oy||f.ost||f.os?`${f.ot||"Tots els tipus"} · ${f.ost||"Tots els estats"}`:"Sense filtres actius"}</span><button className="secondary" onClick={clearAll}>Veure tots</button></div><div className="exp-side-list-v8741"><h4>Estat dels expedients</h4>{Object.entries(estatCount).map(([t,n])=><button key={t} onClick={()=>f.setOst(t)}><span>{t}</span><b>{n}</b></button>)}</div></Card>
      <Card title="Filtrar per tipus de treball"><div className="exp-side-list-v8741 type-filter-list-v8742"><button className={!f.ot?"active":""} onClick={()=>f.setOt("")}><span>Tots els tipus</span><b>{flat.length}</b></button>{topTipus.length===0?<p>Sense dades.</p>:topTipus.map(([t,n])=><button key={t} className={f.ot===t?"active":""} onClick={()=>f.setOt(t)}><span>{t}</span><b>{n}</b></button>)}</div></Card>
      <Card title="Accions ràpides"><div className="quick-side-v8742"><button className="primary" onClick={newObra}>+ Nou expedient</button><button className="secondary" onClick={()=>setScreen?.("Agenda")}>Obrir agenda</button><button className="secondary" onClick={()=>setScreen?.("Pressupostos")}>Pressupostos</button><button className="secondary" onClick={()=>setScreen?.("Factures")}>Factures</button></div></Card>
    </div>
  </details>
</div>}function ObraRow({o,d={},open}){const last=obraRecentScore878134(o,d);return <button onClick={()=>open(o.id)} className="obra-row obra-row-code-v8739"><div className="thumb">{o.imatge?<img src={o.imatge}/> : "FOTO"}</div><div className="grow"><small className="exp-code-v8739">{expedientCode8739(o)}</small><strong>{o.nom}</strong><span>{o.subtitol}</span><em>{moduleLabel8737(o)} · {o.poblacio||"Sense municipi"}</em>{last>0&&<small className="last-worked-v878133">Darrer treball / accés: {fmtRecentActivity878134(last)}</small>}</div><Badge estat={o.estat}/></button>}

function EditObraModal8725({obra,clients=[],close,save}){
const clientNames=[...new Set((clients||[]).map(c=>c.nom).filter(Boolean))];
const serveisBase=WORK_TYPES8737;
const serveis=[...new Set([canonicalWorkType8740(obra.tipusTreball||obra.tipologia),...serveisBase].filter(Boolean))];
const estats=statusOptions878136(obra.estat);
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
    <label><span>Estat</span><select value={normalizeExpedientStatus878136(f.estat||"Pressupostat")} onChange={e=>ch("estat",e.target.value)}>
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


function PrincipalAgentsPanel878134({obra,client,agents=[]}){
  const sorted=sortAgents878134(agents);
  const prom=primaryPromotorAgent878134(sorted,obra,client);
  const main=sorted.filter(a=>{
    const r=String(a.rol||'').toLowerCase();
    if(a.id===prom.id)return false;
    if(r.includes('promotor')||r.includes('propiet')||r.includes('client'))return false;
    return agentRoleOrder878134(a)<=5;
  }).slice(0,4);
  return <Card title="Agents principals de l’obra">
    <div className="principal-agents-v878134 principal-agents-v878135">
      <div className="principal-agent-main-v878134"><small>Promotor / propietat per documents</small><b>{prom.nom||"Promotor pendent"}</b><span>{prom.nif?`NIF/CIF ${prom.nif}`:"NIF pendent"} · {prom.email||prom.telefon||"Contacte pendent"}</span></div>
      <div className="principal-agent-grid-v878134">{main.length?main.map(a=><div key={a.id||a.nom}><b>{a.rol||"Agent"}</b><span>{a.nom||"Pendent"}</span><em>{a.nif?`NIF ${a.nif}`:"NIF pendent"}</em></div>):<span className="muted">Afegeix constructor, direcció d’obra, direcció d’execució o CSS a la relació d’agents.</span>}</div>
    </div>
  </Card>
}


function recomputeExpedientCode878162(form={}, selectedClient=null){
  const year=String(form.any||new Date().getFullYear());
  const number=Number(form.numExpedient)||Number(String(form.codiExpedient||form.codi||'').match(/^\d{4}-(\d{3})/)?.[1])||1;
  const tipus=canonicalWorkType8740(form.tipusTreball||form.tipologia||'Altres');
  const clientNom=selectedClient?.nom||form.propietat||form.clientNom||'Client';
  const built=buildExpedientCode8739({year,number,tipus,client:selectedClient,clientNom,keyword:form.paraulaClau,nom:form.nom,subtitol:form.subtitol,poblacio:form.poblacio});
  return {...form,...built,any:year,tipusTreball:tipus,tipologia:tipus,codiExpedient:built.codi};
}
function FitxaDadesTab8769({obra,client,clients=[],setClients,data={},save,allAgents=[],setData,openAgent}){
  const [form,setForm]=useState(()=>({...obra,codiPostal:obra.codiPostal||""}));
  const [clientChoice,setClientChoice]=useState(()=>obra.client||client?.id||"");
  const [newClient878159,setNewClient878159]=useState({nom:"Nou client",rao:"",tipus:"Promotor",nif:"Pendent",email:"",telefon:"",adreca:"",codiPostal:"",poblacio:""});
  const [promoterModal87210,setPromoterModal87210]=useState(null);
  useEffect(()=>{setForm(applyWorkTemplate878121({...obra,codiPostal:obra.codiPostal||""},obra.tipusTreball||obra.tipologia,false));setClientChoice(obra.client||client?.id||"")},[obra.id,obra.updatedAt,obra.tipusTreball,obra.tipologia,obra.client,client?.id]);
  const obraAgents=sortAgents878134(uniqAgents8768([...(data.agents||[])]));
  const libraryAgents=sortAgents878134(uniqAgents8768([...(allAgents||[])]));
  const agents=obraAgents;
  const agentChoices=sortAgents878134(uniqAgents8768([...(obraAgents||[]),...(libraryAgents||[])]));
  const promoterChoiceMap87210=new Map();
  agentChoices.filter(agent=>agentMatchesField878188(agent,"promotor")||agent._fromClient878192).forEach(agent=>{
    const key=normalizeSearch878191(agent.nom||agent.empresa||agent.id);
    if(!key)return;
    const previous=promoterChoiceMap87210.get(key);
    if(!previous){promoterChoiceMap87210.set(key,agent);return}
    const score=item=>[item.nif,item.adreca,item.email,item.telefon,item.sourceClientId878192].filter(v=>String(v||"").trim()).length;
    const preferred=score(agent)>score(previous)?agent:previous;
    const secondary=preferred===agent?previous:agent;
    promoterChoiceMap87210.set(key,{...secondary,...preferred,nif:preferred.nif||secondary.nif||"",adreca:preferred.adreca||secondary.adreca||"",email:preferred.email||secondary.email||"",telefon:preferred.telefon||secondary.telefon||""});
  });
  const promoterChoices87210=sortAgents878134([...promoterChoiceMap87210.values()]);
  const selectedPromoter87210=promoterChoices87210.find(agent=>String(agent.id||"")===String(form.promotorAgentId||""))||promoterChoices87210.find(agent=>normalizeSearch878191(agent.nom||agent.empresa)===normalizeSearch878191(form.propietat));
  const promoterSignature87210=promoterChoices87210.map(agent=>[agent.id,agent.nom,agent.nif,agent.adreca,agent.email,agent.telefon].join("|")).join("¦");
  useEffect(()=>{
    const match=promoterChoices87210.find(agent=>String(agent.id||"")===String(obra.promotorAgentId||""))||promoterChoices87210.find(agent=>normalizeSearch878191(agent.nom||agent.empresa)===normalizeSearch878191(obra.propietat));
    if(!match)return;
    setForm(previous=>{
      const missing=value=>!String(value||"").trim()||String(value||"").trim().toLowerCase()==="pendent";
      const next={...previous,promotorAgentId:previous.promotorAgentId||match.id,propietat:previous.propietat||match.nom};
      if(missing(previous.nifPropietat)&&match.nif)next.nifPropietat=match.nif;
      if(missing(previous.adrecaPropietat)&&match.adreca)next.adrecaPropietat=match.adreca;
      if(missing(previous.emailPropietat)&&match.email)next.emailPropietat=match.email;
      if(missing(previous.telefonPropietat)&&match.telefon)next.telefonPropietat=match.telefon;
      return JSON.stringify(next)===JSON.stringify(previous)?previous:next;
    });
  },[obra.id,obra.promotorAgentId,obra.propietat,promoterSignature87210]);
  function upd(k,v){setForm(p=>({...p,[k]:v}))}
  function changeCp(v){setForm(p=>{const pob=poblacioForCp8773(v);return {...p,codiPostal:v,poblacio:pob||p.poblacio}})}
  function changePoblacio(v){setForm(p=>{const cp=cpForPoblacio8773(v);return {...p,poblacio:v,codiPostal:cp||p.codiPostal}})}
  function addAgentToObraIfNeeded878159(ag){
    if(!ag?.nom)return;
    setData?.(d=>{
      const existingIndex=(d.agents||[]).findIndex(x=>String(x.id||"")===String(ag.id||"")||normalizeSearch878191(x.nom)===normalizeSearch878191(ag.nom));
      if(existingIndex>=0){
        const next=(d.agents||[]).map((item,index)=>index===existingIndex?{...item,...ag,id:item.id||ag.id,sourceAgentId:item.sourceAgentId||ag.id,updatedAt:new Date().toISOString()}:item);
        return {...d,agents:sortAgents878134(next),updatedAt:new Date().toISOString()};
      }
      const copy={...ag,id:"agent-obra-"+Date.now()+"-"+Math.random().toString(16).slice(2),sourceAgentId:ag.id,updatedAt:new Date().toISOString()};
      return {...d,agents:sortAgents878134([...(d.agents||[]),copy]),updatedAt:new Date().toISOString()};
    });
  }
  function promoterPatch87210(agent={}){
    return {promotorAgentId:agent.id||"",propietat:agent.nom||agent.empresa||"",nifPropietat:agent.nif||"",adrecaPropietat:agent.adreca||"",emailPropietat:agent.email||"",telefonPropietat:agent.telefon||""};
  }
  function choosePromoter87210(value){
    if(value==="__new__"){setPromoterModal87210({id:"",nom:"",empresa:"",rol:"Promotor / propietat",nif:"",adreca:"",codiPostal:"",poblacio:"",email:"",telefon:""});return}
    const found=promoterChoices87210.find(agent=>String(agent.id||"")===String(value));
    if(!found){setForm(previous=>({...previous,promotorAgentId:"",propietat:"",nifPropietat:"",adrecaPropietat:"",emailPropietat:"",telefonPropietat:""}));return}
    setForm(previous=>({...previous,...promoterPatch87210(found)}));
    addAgentToObraIfNeeded878159(found);
  }
  function editPromoter87210(){
    const current=selectedPromoter87210||{id:form.promotorAgentId||"",nom:form.propietat||"",empresa:form.propietat||"",rol:"Promotor / propietat",nif:form.nifPropietat||"",adreca:form.adrecaPropietat||"",email:form.emailPropietat||"",telefon:form.telefonPropietat||""};
    setPromoterModal87210({...current,nom:form.propietat||current.nom||"",nif:form.nifPropietat||current.nif||"",adreca:form.adrecaPropietat||current.adreca||"",email:form.emailPropietat||current.email||"",telefon:form.telefonPropietat||current.telefon||""});
  }
  function savePromoterModal87210(){
    const draft=promoterModal87210||{};
    const nom=String(draft.nom||"").trim();
    if(!nom)return alert("Escriu el nom del promotor o client final.");
    const id=draft.id||`agent-obra-promotor-${Date.now()}`;
    const agent={id,nom,empresa:String(draft.empresa||nom).trim()||nom,rol:"Promotor / propietat",nif:String(draft.nif||"").trim(),adreca:String(draft.adreca||"").trim(),email:String(draft.email||"").trim(),telefon:String(draft.telefon||"").trim(),updatedAt:new Date().toISOString()};
    setData?.(current=>{
      const list=[...(current.agents||[])];
      const index=list.findIndex(item=>String(item.id||"")===String(draft.id||"")||normalizeSearch878191(item.nom)===normalizeSearch878191(nom));
      const next=index>=0?list.map((item,i)=>i===index?{...item,...agent,id:item.id||agent.id}:item):[agent,...list];
      return {...current,agents:sortAgents878134(next),updatedAt:new Date().toISOString()};
    });
    setForm(previous=>({...previous,...promoterPatch87210(agent)}));
    setPromoterModal87210(null);
  }
  function createNewClient878159(){
    const nom=String(newClient878159.nom||"Nou client").trim()||"Nou client";
    const id="client-"+safeSlug8768(nom,"client")+"-"+Date.now();
    const c={id,nom,rao:newClient878159.rao||nom,tipus:newClient878159.tipus||"Promotor",contacte:nom,nif:newClient878159.nif||"Pendent",email:newClient878159.email||"",telefon:newClient878159.telefon||"",adreca:newClient878159.adreca||"",codiPostal:newClient878159.codiPostal||"",poblacio:newClient878159.poblacio||"",provincia:provinciaForCp8773(newClient878159.codiPostal)||provinciaForPoblacio8773(newClient878159.poblacio)||"",color:"blue",logo:""};
    setClients?.(p=>[c,...(p||[])]);
    return c;
  }
  function saveAll(){
    let finalClient=(clients||[]).find(c=>c.id===clientChoice);
    if(clientChoice==="__new__")finalClient=createNewClient878159();
    const chosenTipus=canonicalWorkType8740(form.tipusTreball||form.tipologia||"Altres");
    let normalized=applyWorkTemplate878121({...form,client:finalClient?.id||form.client,tipusTreball:chosenTipus,tipologia:chosenTipus},chosenTipus,false);
    normalized.tipusTreball=chosenTipus;
    normalized.tipologia=chosenTipus;
    // V87.162: el codi ja és editable. Només el recalcularem si l'usuari ho demana amb el botó,
    // però guardem sempre els camps parcials perquè pugui corregir paraula clau, número o abreviacions.
    normalized.codiExpedient=String(form.codiExpedient||normalized.codiExpedient||expedientCode8739(obra)).trim();
    normalized.numExpedient=Number(form.numExpedient)||normalized.numExpedient;
    normalized.codiTipus=form.codiTipus||normalized.codiTipus;
    normalized.codiClient=form.codiClient||normalized.codiClient;
    normalized.paraulaClau=form.paraulaClau||normalized.paraulaClau;
    if(finalClient && (!normalized.propietat||normalized.propietat==="Pendent"||normalized.propietat===client?.nom)){
      normalized.propietat=finalClient.nom;
      normalized.nifPropietat=finalClient.nif||normalized.nifPropietat||"Pendent";
    }
    learnCpPoblacio8775(normalized.codiPostal,normalized.poblacio);
    const normalizedToSave={...normalized,provincia:provinciaForCp8773(normalized.codiPostal)||provinciaForPoblacio8773(normalized.poblacio)||normalized.provincia||""};
    // V87.187: sincronitza la targeta superior d'agents amb el promotor escrit a Dades.
    if(String(normalizedToSave.propietat||"").trim()){
      setData?.(d=>{
        const list=[...(d.agents||[])];
        const propName=String(normalizedToSave.propietat||"").trim();
        const propNif=normalizedToSave.nifPropietat||"";
        const idx=list.findIndex(a=>String(a.id||"")===String(normalizedToSave.promotorAgentId||""))>=0?list.findIndex(a=>String(a.id||"")===String(normalizedToSave.promotorAgentId||"")):list.findIndex(a=>normalizeSearch878191(a.nom)===normalizeSearch878191(propName));
        const item={id:idx>=0?(list[idx].id||("agent-promotor-"+Date.now())):(normalizedToSave.promotorAgentId||"agent-promotor-"+Date.now()),nom:propName,empresa:(idx>=0?list[idx].empresa:"")||propName,rol:"Promotor / propietat",nif:propNif,email:normalizedToSave.emailPropietat||(idx>=0?list[idx].email:"")||"",telefon:normalizedToSave.telefonPropietat||(idx>=0?list[idx].telefon:"")||"",adreca:normalizedToSave.adrecaPropietat||(idx>=0?list[idx].adreca:"")||"",updatedAt:new Date().toISOString()};
        const next=idx>=0?list.map((a,i)=>i===idx?{...a,...item}:a):[item,...list];
        return {...d,agents:sortAgents878134(next),updatedAt:new Date().toISOString()};
      });
    }
    save?.(normalizedToSave);
    setForm(normalizedToSave);
    if(finalClient)setClientChoice(finalClient.id);
  }
  function AgentPicker({field,label,roleHint,filterField}){
    const current=form[field]||"Pendent";
    const choices=filteredAgentsForField878188(agentChoices,filterField||field);
    const known=choices.find(a=>String(a.nom||"")===String(current));
    const selected=known?known.id:(current&&current!=="Pendent"?"__custom__":"Pendent");
    return <label><span>{label}</span><select value={selected} onChange={e=>{const v=e.target.value;if(v==="Pendent"){upd(field,"Pendent");return}if(v==="__custom__"){upd(field,"");return}const ag=choices.find(a=>a.id===v);if(ag){upd(field,ag.nom);addAgentToObraIfNeeded878159(ag)}}}><option value="Pendent">Pendent / no assignat</option>{choices.map(a=><option key={field+a.id} value={a.id}>{a.nom} · {a.empresa||a.rol||"Agent"}</option>)}<option value="__custom__">+ Crear / escriure nou</option></select>{(selected==="__custom__"||(!known&&current&&current!=="Pendent"))&&<div className="agent-inline-create-v87159"><input value={current==="Pendent"?"":current} onChange={e=>upd(field,e.target.value)} placeholder={filterField==="constructora"?"Nom de la constructora":"Nom del tècnic o empresa"}/><button type="button" className="secondary small" onClick={()=>{const nom=String(form[field]||"").trim();if(!nom){alert("Escriu el nom de l'agent.");return}const ag={id:"agent-"+Date.now(),nom,rol:roleHint||label,empresa:nom,email:"",telefon:"",nif:"",adreca:"",collegiat:"",updatedAt:new Date().toISOString()};addAgentToObraIfNeeded878159(ag)}}>Crear fitxa agent</button></div>}</label>
  }
  const selectedClient=(clients||[]).find(c=>c.id===clientChoice);
  return <div className="fitxa-dades-stack-v878133">{promoterModal87210&&<Modal title={`${promoterModal87210.id?"Editar":"Crear"} promotor / client final`} close={()=>setPromoterModal87210(null)}><div className="promoter-modal-v87210"><DatalistCP8773/><div className="module-note-v8738"><b>Independent del client de la carpeta</b><span>Aquesta fitxa identifica la propietat o client final que sortirà als documents de l’expedient.</span></div><div className="form-grid"><label><span>Nom complet / raó social *</span><input autoFocus value={promoterModal87210.nom||""} onChange={e=>setPromoterModal87210(previous=>({...previous,nom:e.target.value}))}/></label><label><span>Empresa o nom fiscal</span><input value={promoterModal87210.empresa||""} onChange={e=>setPromoterModal87210(previous=>({...previous,empresa:e.target.value}))}/></label><label><span>DNI / NIF / CIF</span><input value={promoterModal87210.nif||""} onChange={e=>setPromoterModal87210(previous=>({...previous,nif:e.target.value}))}/></label><label><span>Telèfon</span><input value={promoterModal87210.telefon||""} onChange={e=>setPromoterModal87210(previous=>({...previous,telefon:e.target.value}))}/></label><label className="span-all"><span>Adreça del promotor</span><input value={promoterModal87210.adreca||""} onChange={e=>setPromoterModal87210(previous=>({...previous,adreca:e.target.value}))}/></label><label><span>Email</span><input type="email" value={promoterModal87210.email||""} onChange={e=>setPromoterModal87210(previous=>({...previous,email:e.target.value}))}/></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setPromoterModal87210(null)}>Cancel·lar</button><button type="button" className="primary" onClick={savePromoterModal87210}>Guardar i seleccionar</button></div></div></Modal>}<PrincipalAgentsPanel878134 obra={form} client={selectedClient||client} agents={agents}/><Card title="Dades generals de l’expedient" action={<div className="actions-inline"><button className="primary" onClick={saveAll}>Guardar dades</button></div>}>
    <div className="form-grid fitxa-form-v8773 fitxa-form-v87159"><DatalistCP8773/>
      <details className="span-all code-editor-v87162" open><summary>Codificació de l'expedient</summary><div className="form-grid compact-v87151 no-pad"><label><span>Any</span><input value={form.any||new Date().getFullYear()} onChange={e=>upd("any",e.target.value)}/></label><label><span>Número</span><input type="number" value={form.numExpedient||String(form.codiExpedient||"").match(/^\d{4}-(\d{3})/)?.[1]||""} onChange={e=>upd("numExpedient",e.target.value)}/></label><label><span>Inicials treball</span><input value={form.codiTipus||workCode8739(form.tipusTreball||form.tipologia)} onChange={e=>upd("codiTipus",codeClean8739(e.target.value).replace(/\s+/g,"-"))}/></label><label><span>Inicials client</span><input value={form.codiClient||clientCode8739(selectedClient||client,selectedClient?.nom||client?.nom)} onChange={e=>upd("codiClient",codeClean8739(e.target.value).replace(/\s+/g,"-"))}/></label><label><span>Paraula clau</span><input value={form.paraulaClau||""} onChange={e=>upd("paraulaClau",e.target.value)} placeholder="VERBANIA, SATE, BANY..."/></label><label className="span-all"><span>Codi complet editable</span><input value={form.codiExpedient||expedientCode8739(form)||expedientCode8739(obra)} onChange={e=>upd("codiExpedient",e.target.value)}/></label><div className="span-all actions-inline"><button type="button" className="secondary" onClick={()=>setForm(p=>recomputeExpedientCode878162(p,selectedClient||client))}>Recalcular codi</button><small>Format recomanat: any-número-inicials treball-inicials client-paraula clau. També pots escriure el codi complet manualment.</small></div></div></details>
      <label><span>Client / carpeta</span><select value={clientChoice||""} onChange={e=>setClientChoice(e.target.value)}><option value="" disabled>Selecciona client...</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}<option value="__new__">+ Crear client nou</option></select></label>
      {clientChoice==="__new__"&&<div className="span-all new-client-inline-v87159"><h4>Crear client nou</h4><div className="form-grid compact-v87151 no-pad"><label><span>Nom client *</span><input value={newClient878159.nom} onChange={e=>setNewClient878159(p=>({...p,nom:e.target.value}))}/></label><label><span>Raó social</span><input value={newClient878159.rao} onChange={e=>setNewClient878159(p=>({...p,rao:e.target.value}))} placeholder="Opcional"/></label><label><span>Rol / tipologia</span><select value={newClient878159.tipus||"Promotor"} onChange={e=>setNewClient878159(p=>({...p,tipus:e.target.value}))}><option>Promotor</option><option>Arquitecte</option><option>Arquitecte tècnic</option><option>Immobiliària</option><option>Constructora</option><option>Industrial</option><option>Administració</option><option>Particular</option><option>Altres</option></select></label><label><span>NIF/CIF</span><input value={newClient878159.nif} onChange={e=>setNewClient878159(p=>({...p,nif:e.target.value}))}/></label><label><span>Email</span><input value={newClient878159.email} onChange={e=>setNewClient878159(p=>({...p,email:e.target.value}))}/></label><label><span>Telèfon</span><input value={newClient878159.telefon} onChange={e=>setNewClient878159(p=>({...p,telefon:e.target.value}))}/></label><label><span>Adreça client</span><input value={newClient878159.adreca} onChange={e=>setNewClient878159(p=>({...p,adreca:e.target.value}))}/></label></div></div>}
      {clientChoice!=="__new__"&&selectedClient&&<div className="span-all selected-client-v87157 selected-client-v87159"><b>{selectedClient.nom}</b><span>{selectedClient.nif?`NIF/CIF: ${selectedClient.nif}`:"NIF/CIF pendent"}</span><span>{[selectedClient.email,selectedClient.telefon].filter(Boolean).join(" · ")||"Contacte pendent"}</span><small>Per canviar el client de l’expedient, escull-ne un altre al desplegable i prem “Guardar dades”.</small></div>}
      <label><span>Nom de l’obra / treball</span><input value={form.nom||""} onChange={e=>upd("nom",e.target.value)}/></label>
      <label><span>Tipus de feina / encàrrec</span><select value={canonicalWorkType8740(form.tipusTreball||form.tipologia||"Altres")} onChange={e=>{const t=canonicalWorkType8740(e.target.value);setForm(p=>({...applyWorkTemplate878121({...p,tipusTreball:t,tipologia:t},t,false),tipusTreball:t,tipologia:t,codiTipus:workCode8739(t)}))}}>{WORK_TYPES8737.map(t=><option key={t}>{t}</option>)}</select></label>
      <label><span>Estat de l’expedient</span><select value={form.estat||"Pendent"} onChange={e=>upd("estat",e.target.value)}>{EXPEDIENT_STATUS878136.map(st=><option key={st}>{st}</option>)}</select></label>
      <div className="span-all promoter-picker-v87210"><label><span>Promotor / client final *</span><select value={selectedPromoter87210?.id||""} onChange={e=>choosePromoter87210(e.target.value)}><option value="">Selecciona el promotor...</option>{promoterChoices87210.map(agent=><option key={agent.id} value={agent.id}>{agent.nom}{agent.nif?` · ${agent.nif}`:""}</option>)}<option value="__new__">+ Crear promotor / client final nou</option></select></label><button type="button" className="secondary small" onClick={()=>setPromoterModal87210({id:"",nom:"",empresa:"",rol:"Promotor / propietat",nif:"",adreca:"",email:"",telefon:""})}>+ Crear nou</button>{form.propietat&&<div className="promoter-selected-v87210"><div><small>PROMOTOR SELECCIONAT</small><b>{form.propietat}</b></div><div><small>DNI / NIF / CIF</small><b>{form.nifPropietat||"Pendent"}</b></div><div><small>ADREÇA</small><b>{form.adrecaPropietat||"Pendent"}</b></div><div><small>CONTACTE</small><b>{[form.emailPropietat,form.telefonPropietat].filter(Boolean).join(" · ")||"Pendent"}</b></div><button type="button" className="secondary small" onClick={editPromoter87210}>Editar dades</button></div>}</div>
      <AgentPicker field="constructor" label="Constructora / contractista" roleHint="Constructora / contractista" filterField="constructora"/>
      <AgentPicker field="do" label="Direcció d’obra" roleHint="Direcció d’obra" filterField="do"/>
      <AgentPicker field="deo" label="Direcció d’execució" roleHint="Direcció d’execució" filterField="deo"/>
      <AgentPicker field="css" label="Coordinació seguretat i salut" roleHint="Coordinació S+S" filterField="css"/>
      <label><span>Adreça obra</span><input value={form.adreca||""} onChange={e=>upd("adreca",e.target.value)}/></label>
      <label><span>Codi postal</span><input list="cp-list-v8773" value={form.codiPostal||""} onChange={e=>changeCp(e.target.value)} placeholder="17230"/></label>
      <label><span>Població</span><input list="poblacio-list-v8773" value={form.poblacio||""} onChange={e=>changePoblacio(e.target.value)} placeholder="Palamós"/></label>
      <label><span>Província</span><input value={provinciaForCp8773(form.codiPostal)||provinciaForPoblacio8773(form.poblacio)||form.provincia||""} readOnly/></label>
      <label><span>Referència cadastral</span><input value={form.rc||""} onChange={e=>upd("rc",e.target.value)}/></label>
      <label className="span-all"><span>Definició tipus de feina</span><textarea value={form.definicioFeina||""} onChange={e=>upd("definicioFeina",e.target.value)} placeholder="Definició base de l'encàrrec, editable per cada expedient..."/></label>
      <label className="span-all"><span>Direcció / criteri de l’obra</span><textarea value={form.direccioObraText||""} onChange={e=>upd("direccioObraText",e.target.value)} placeholder="Direcció d’obra, seguiment, criteris i condicions particulars..."/></label>
      <label className="span-all"><span>Observacions internes</span><textarea value={form.observacions||""} onChange={e=>upd("observacions",e.target.value)} placeholder="Condicionants, criteris, notes de l’encàrrec..."/></label>
    </div>
  </Card>
  </div>
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
  const base={id:"principal",nom:data.principalBudgetName||"Pressupost principal",tipus:"Principal"};
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

function economicStats878214(data={},bid="principal"){
  const rows=(data.partides||[]).filter(r=>(r?.budgetId||"principal")===(bid||"principal"));
  return {
    bid:bid||"principal",
    rows:rows.length,
    qNonZero:rows.filter(r=>Math.abs(parseNum8770(r.q)||0)>0.000001).length,
    puNonZero:rows.filter(r=>Math.abs(parseNum8770(r.pu)||0)>0.000001).length,
    total:rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0)
  };
}
function certificationStats878215(data={},bid="principal"){
  const rows=(data.partides||[]).filter(row=>(row?.budgetId||"principal")===(bid||"principal"));
  const nums=new Set();
  rows.forEach(row=>{
    Object.keys(row.certsByNum||{}).forEach(num=>{if(Number(num)>0)nums.add(Number(num))});
    Object.keys(row.certMesuresByNum||{}).forEach(num=>{if(Number(num)>0)nums.add(Number(num))});
    Object.keys(row).filter(key=>/^cert_\d+$/.test(key)).forEach(key=>nums.add(Number(key.slice(5))));
  });
  (data.certificacions||[]).filter(cert=>(cert.budgetId||"principal")===(bid||"principal")).forEach(cert=>{if(Number(cert.numero)>0)nums.add(Number(cert.numero))});
  const totals=[...nums].sort((a,b)=>a-b).map(num=>({num,total:rows.reduce((sum,row)=>sum+certQty8783(row,num)*parseNum8770(row.pu),0)}));
  return {bid:bid||"principal",rowCount:rows.length,totals,nonZero:totals.filter(item=>Math.abs(item.total)>0.000001).length,totalAbs:totals.reduce((sum,item)=>sum+Math.abs(item.total),0)};
}
function saveEmergencyEconomicSnapshot878214(obraId,current,reason){
  try{
    const key=lsKey8779(`aco_economic_emergency_${obraId||"expedient"}_v87214`);
    safeSetLocalStorage878185(key,stripHeavy878185({
      version:"V87.215",createdAt:new Date().toISOString(),obraId,reason,
      data:{partides:current.partides||[],certificacions:current.certificacions||[],pressupostos:current.pressupostos||[],budgetGroups:current.budgetGroups||[],activeBudgetIdObra:current.activeBudgetIdObra||"principal"}
    }));
  }catch(e){console.warn("No s'ha pogut crear la còpia econòmica d'emergència",e)}
}
function guardEconomicWrite878214(current={},next={},obraId=""){
  const ids=new Set(["principal",...ensureBudgetGroups8786(current).groups.map(g=>g.id),...ensureBudgetGroups8786(next).groups.map(g=>g.id)]);
  for(const bid of ids){
    const before=economicStats878214(current,bid);
    const after=economicStats878214(next,bid);
    if(before.rows<8||after.rows<Math.max(5,Math.floor(before.rows*.7)))continue;
    const lostPu=before.puNonZero>=5&&after.puNonZero===0;
    const lostQ=before.qNonZero>=5&&after.qNonZero===0;
    const lostTotal=Math.abs(before.total)>1&&Math.abs(after.total)<0.000001;
    if(lostPu||lostQ||lostTotal){
      const reason=`Bloquejada una caiguda massiva a zero al pressupost ${bid}: ${before.rows} → ${after.rows} partides; total ${before.total} → ${after.total}.`;
      saveEmergencyEconomicSnapshot878214(obraId,current,reason);
      return {blocked:true,bid,before,after,reason};
    }
  }
  for(const bid of ids){
    const before=certificationStats878215(current,bid);
    const after=certificationStats878215(next,bid);
    const keepsRows=before.rowCount>=8&&after.rowCount>=Math.max(5,Math.floor(before.rowCount*.7));
    if(keepsRows&&before.nonZero>=3&&before.totalAbs>1000&&after.nonZero===0){
      const reason=`Bloquejada una caiguda massiva de certificacions a zero al pressupost ${bid}: ${before.nonZero} certificacions amb import han passat a 0.`;
      saveEmergencyEconomicSnapshot878214(obraId,current,reason);
      return {blocked:true,bid,before,after,reason};
    }
  }
  return {blocked:false};
}
function warnEconomicGuard878214(info={}){
  const now=Date.now();
  if((globalThis.__acoEconomicGuardAlert878214||0)>now-1500)return;
  globalThis.__acoEconomicGuardAlert878214=now;
  setTimeout(()=>alert(`GUARDAT BLOQUEJAT PER SEGURETAT

L'app ha detectat que una operació intentava deixar totes les quantitats, preus o certificacions a zero. No s'ha desat aquest canvi i s'ha conservat una còpia econòmica d'emergència.

Pressupost: ${info.bid||"principal"}`),0);
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
      const total=rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
      pressupostos.push({id:"budget-marker-"+g.id,budgetId:g.id,versio:"Annex",data:todayShort8713(),nom:g.nom,estat:`${g.tipus||"Pressupost"} · recuperat · ${rows.length} partides`,import:total,updatedAt:new Date().toISOString()});
    }
  });
  const validIds=new Set(["principal",...groups.map(g=>g.id)]);
  const active=validIds.has(d.activeBudgetIdObra)?d.activeBudgetIdObra:"principal";
  const certificacions=(d.certificacions||[]).map(c=>{
    const n=+c.numero||0;
    if(!n)return c;
    const bid=c.budgetId||"principal";
    const calculat=(d.partides||[])
      .filter(r=>(r.budgetId||"principal")===bid)
      .reduce((s,r)=>s+certQty8783(r,n)*parseNum8770(r.pu),0);
    return {...c,import:Math.abs(calculat)>0.000001?calculat:(+c.import||0)};
  });
  return {...d,budgetGroups:groups,pressupostos,certificacions,activeBudgetIdObra:active};
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
  const pressupost=rows.reduce((s,r)=>s+(+r.q||0)*parseNum8770(r.pu),0);
  const certificatPartides=rows.reduce((s,r)=>s+certQtyTotal8789(r)*parseNum8770(r.pu),0);
  const certificatRegistres=certRecordTotal8791(data,id);
  // V87.91: si una certificació està guardada com a registre però les partides antigues no conserven certsByNum,
  // fem servir el valor més alt per no perdre la Cert. 1 en la lectura global.
  const certificat=Math.max(certificatPartides,certificatRegistres);
  const capMap={};
  rows.forEach(r=>{const cap=r.cap||"Sense capítol";if(!capMap[cap])capMap[cap]={cap,pressupost:0,certificat:0,partides:0};capMap[cap].pressupost+=(+r.q||0)*parseNum8770(r.pu);capMap[cap].certificat+=certQtyTotal8789(r)*parseNum8770(r.pu);capMap[cap].partides+=1;});
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
    const pressup=(+r.q||0)*parseNum8770(r.pu);
    const cert=certQtyTotal8773(r)*parseNum8770(r.pu);
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
function GanttObra878149({data}){
  const parts=(data?.partides||[]).filter(r=>String(r.concepte||"").trim()).slice(0,18);
  const certs=(data?.certificacions||[]).filter(Boolean);
  const total=parts.reduce((s,r)=>s+(+r.q||0),0)||1;
  let acc=0;
  const rows=parts.map((r,i)=>{
    const q=(+r.q||1); const w=Math.max(6,Math.min(100,(q/total)*100)); const left=Math.min(88,(acc/total)*100); acc+=q;
    const certPct=Math.min(100,Math.max(0,((+r.certActual||0)+Object.values(r.certsByNum||{}).reduce((a,b)=>a+(+b||0),0))/(+r.q||1)*100));
    return {...r,left,w,certPct,i};
  });
  return <Card title="Planificació / Gantt orientatiu" action={<span className="gantt-note-v87149">Pressupost vs certificació</span>}>
    <div className="gantt-wrap-v87149">{rows.length===0?<Empty text="Encara no hi ha partides per generar diagrama."/>:rows.map(r=><div className="gantt-row-v87149" key={(r.codi||'')+r.i}><div><b>{r.codi||'—'}</b><span>{r.concepte}</span></div><div className="gantt-track-v87149"><i style={{left:r.left+'%',width:r.w+'%'}}/><em style={{left:r.left+'%',width:(r.w*r.certPct/100)+'%'}}/></div><small>{Math.round(r.certPct)}%</small></div>)}<div className="gantt-legend-v87149"><span><i/> Pressupost previst</span><span><em/> Certificat a origen</span><b>{certs.length} certificació/ns</b></div></div>
  </Card>
}

function GestioObra8746({data,setData,importExcel,deletePressupostVersion,duplicatePressupostVersion,openPartida,openEmail,openDoc,updateCert,deleteCertificacio8721,updateCertDate8721,addCertificacio,certInfo,setCertInfo,saveCert,client,obra,clientHistoricalPartides=[],partidaLibrary=[],setPartidaLibrary}){
  const[sub,setSub]=useState("Pressupost obra");
  const info=ensureBudgetGroups8786(data);
  const[activeBudgetId,setActiveBudgetId]=useState(info.active);
  useEffect(()=>{const next=ensureBudgetGroups8786(data);const desired=data.activeBudgetIdObra||next.active;if(desired&&desired!==activeBudgetId&&next.groups.some(g=>g.id===desired))setActiveBudgetId(desired);else if(!next.groups.some(g=>g.id===activeBudgetId))setActiveBudgetId(next.active)},[data.pressupostos?.length,data.partides?.length,data.budgetGroups?.length,data.activeBudgetIdObra]);
  const groups=ensureBudgetGroups8786(data).groups;
  const activeData=filterBudgetData8786(data,activeBudgetId);
  const [renameDraft878123,setRenameDraft878123]=useState(budgetLabel8786(data,activeBudgetId));
  const groupNameKey878123=groups.map(g=>`${g.id}:${g.nom||""}`).join("|")+`__${data.principalBudgetName||""}`;
  useEffect(()=>{setRenameDraft878123(budgetLabel8786(data,activeBudgetId))},[activeBudgetId,groupNameKey878123]);
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
      const total=rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
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
  function commitRenameBudget878123(id,nom,source="manual"){
    const bid=id||"principal";
    const current=ensureBudgetGroups8786(data).groups.find(x=>x.id===bid)||groups.find(x=>x.id===bid)||{id:bid,nom:"Pressupost"};
    const cleanNom=String(nom||"").trim();
    if(!cleanNom)return alert("Escriu un nom per al pressupost.");
    setRenameDraft878123(cleanNom);
    setData(d=>{
      const now=new Date().toISOString();
      const norm=normalizeBudgetedData8791(d);
      const markRow=(x={})=>{
        const xid=x.budgetId||"principal";
        if(xid!==bid)return x;
        const isMarker=String(x.id||"").startsWith("budget-marker-")||String(x.versio||"").toLowerCase()==="annex"||String(x.versio||"").toLowerCase()==="principal"||String(x.id||"")===`budget-marker-${bid}`;
        return {...x,budgetNom:cleanNom,budgetName:cleanNom,pressupostNom:cleanNom,groupName:cleanNom,nom:isMarker?cleanNom:(x.nom||cleanNom),updatedAt:now};
      };
      const renamed={
        ...norm,
        principalBudgetName:bid==="principal"?cleanNom:(norm.principalBudgetName||"Pressupost principal"),
        budgetGroups:ensureBudgetGroups8786(norm).groups
          .filter(g=>g.id!=="principal")
          .map(g=>g.id===bid?{...g,nom:cleanNom,name:cleanNom,title:cleanNom,updatedAt:now}:g)
          .concat(bid!=="principal"&&!ensureBudgetGroups8786(norm).groups.some(g=>g.id===bid)?[{...current,id:bid,nom:cleanNom,name:cleanNom,title:cleanNom,updatedAt:now}]:[]),
        pressupostos:(norm.pressupostos||[]).map(markRow),
        partides:(norm.partides||[]).map(r=>(r.budgetId||"principal")===bid?{...r,budgetNom:cleanNom,budgetName:cleanNom,pressupostNom:cleanNom}:r),
        certificacions:(norm.certificacions||[]).map(c=>(c.budgetId||"principal")===bid?{...c,budgetNom:cleanNom,budgetName:cleanNom,pressupostNom:cleanNom}:c),
        factures:(norm.factures||[]).map(f=>(f.budgetId||"principal")===bid?{...f,budgetNom:cleanNom,budgetName:cleanNom,pressupostNom:cleanNom}:f),
        activeBudgetIdObra:bid,
        updatedAt:now
      };
      return normalizeBudgetedData8791(renamed);
    });
    if(source!=="blur")setTimeout(()=>alert("Nom del pressupost actualitzat i guardat."),80);
  }
  function renameBudget(id){
    const bid=id||"principal";
    const current=ensureBudgetGroups8786(data).groups.find(x=>x.id===bid)||groups.find(x=>x.id===bid);
    const nom=prompt("Nom del pressupost:",current?.nom||renameDraft878123||"Pressupost");
    if(!nom||!String(nom).trim())return;
    commitRenameBudget878123(bid,nom,"prompt");
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
      }
      return next;
    })}));
  }
  function scopedSaveCert(){
    const n=+certInfo.num;
    setData(d=>{
      const rows=(d.partides||[]).filter(r=>(r.budgetId||"principal")===activeBudgetId);
      const total=rows.reduce((s,r)=>s+certQty8783(r,n)*parseNum8770(r.pu),0);
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
  function scopedDeleteCert(id){if(!confirm("Eliminar aquesta certificació?"))return;setData(d=>({...d,certificacions:(d.certificacions||[]).filter(c=>!((c.budgetId||"principal")===activeBudgetId&&c.id===id))}))}
  function scopedUpdateCertDate(id,value){setData(d=>({...d,certificacions:(d.certificacions||[]).map(c=>(c.budgetId||"principal")===activeBudgetId&&c.id===id?{...c,data:value}:c)}))}
  const totalGlobal=(data.partides||[]).reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  const totalActive=(activeData.partides||[]).reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  return <div className="stack gestio-obra-v8746 gestio-obra-v8786">
    <div className="budget-context-card-v87116"><Card title="Pressupostos de l’obra" action={<div className="actions-inline"><button className="secondary" onClick={()=>addBudget("Pressupost manual des de 0")}>+ Pressupost manual 0</button><button className="secondary" onClick={()=>addBudget("Imprevist / sobrecost")}>+ Imprevist</button><button className="secondary" onClick={()=>addBudget("Modificat aprovat")}>+ Modificat / annex</button></div>}>
      <div className="budget-mobile-control-v87115"><label><span>Pressupost actiu</span><select value={activeBudgetId} onChange={e=>selectBudget8788(e.target.value)}>{groups.map(g=>{const count=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).length;const total=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).reduce((sum,r)=>sum+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);return <option key={g.id} value={g.id}>{g.nom} · {count} partides · {money(total)}</option>})}</select></label></div>
      <div className="budget-selector-v8786">
        {groups.map(g=>{
          const count=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).length;
          const total=(data.partides||[]).filter(r=>(r.budgetId||"principal")===g.id).reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
          return <button key={g.id} className={activeBudgetId===g.id?"active":""} onClick={()=>selectBudget8788(g.id)}><b>{g.nom}</b><span>{g.tipus} · {count} partides</span><strong>{money(total)}</strong></button>
        })}
      </div>
      <details className="budget-rename-direct-v878124 budget-rename-collapsed-v87150">
        <summary>Canviar nom del pressupost seleccionat</summary>
        <div><b>{budgetLabel8786(data,activeBudgetId)}</b><small>Opció amagada per no ocupar espai. Obre només si cal renombrar.</small></div>
        <input aria-label="Nou nom del pressupost seleccionat" value={renameDraft878123} onChange={e=>setRenameDraft878123(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();commitRenameBudget878123(activeBudgetId,renameDraft878123,"enter");e.currentTarget.blur()} if(e.key==="Escape"){setRenameDraft878123(budgetLabel8786(data,activeBudgetId));e.currentTarget.blur()}}}/>
        <button type="button" className="primary small" onClick={()=>commitRenameBudget878123(activeBudgetId,renameDraft878123,"button")}>Guardar nom</button>
      </details>
      <div className="budget-selected-actions-v8786 budget-selected-actions-v878123"><span>Pressupost seleccionat: <b>{budgetLabel8786(data,activeBudgetId)}</b> · <strong>{money(totalActive)}</strong>. Els altres pressupostos són versions separades i no se sumen a aquest total.</span><div className="actions-inline"><button type="button" className="secondary small" onClick={fixarBudget8788}>Guardar/fixar</button><button type="button" className="secondary small" onClick={()=>renameBudget(activeBudgetId)}>Renombrar amb finestra</button>{activeBudgetId!=="principal"&&<button type="button" className="danger small" onClick={()=>deleteBudget(activeBudgetId)}>Eliminar annex</button>}</div></div>
    </Card></div>
    <div className="subtabs-v8746"><button className={sub==="Pressupost obra"?"active":""} onClick={()=>setSub("Pressupost obra")}>Pressupost obra</button><button className={sub==="Certificacions obra"?"active":""} onClick={()=>setSub("Certificacions obra")}>Certificacions obra</button><button className={sub==="Facturació obra"?"active":""} onClick={()=>setSub("Facturació obra")}>Facturació obra</button><button className={sub==="Gantt"?"active":""} onClick={()=>setSub("Gantt")}>Gantt</button><button className={sub==="Rendibilitat"?"active":""} onClick={()=>setSub("Rendibilitat")}>Rendibilitat / desviacions</button></div>
    {sub==="Pressupost obra"&&<Pressupost data={activeData} setData={setScopedData} importExcel={(e)=>importExcel?.(e,activeBudgetId)} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} openPartida={openPartida} openEmail={openEmail} openDoc={openDoc} client={client} obra={obra} clientHistoricalPartides={clientHistoricalPartides} budgetGroups={groups} activeBudgetId={activeBudgetId} selectBudget={selectBudget8788} addBudget={addBudget} totalGlobal={totalGlobal} totalActive={totalActive} partidaLibrary={partidaLibrary} setPartidaLibrary={setPartidaLibrary}/>} 
    {sub==="Certificacions obra"&&<Cert data={activeData} setData={setScopedData} updateCert={scopedUpdateCert} deleteCertificacio8721={scopedDeleteCert} updateCertDate8721={scopedUpdateCertDate} addCertificacio={scopedAddCert} ci={certInfo} setCi={setCertInfo} saveCert={scopedSaveCert} openEmail={openEmail} openDoc={openDoc}/>} 
    {sub==="Facturació obra"&&<Fact data={activeData} openEmail={openEmail} openDoc={openDoc}/>} 
    {sub==="Gantt"&&<GanttObra878149 data={activeData}/>}
    {sub==="Rendibilitat"&&<GlobalRendibilitat8789 data={data} setData={setData} activeBudgetId={activeBudgetId} setActiveBudgetId={selectBudget8788}/>}
  </div>
}

function PressupostRapid878150(props){
  const rows=props.data?.partides||[];
  const total=rows.reduce((sum,r)=>sum+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  const parts=rows.length;
  const clientDefaults=useMemo(()=>lsJson8779(clientBudgetDefaultsKey878160(props.client),{}),[props.client?.id,props.client?.nom,props.client?.rao]);
  const observacions=props.data?.pressupostRapidObservacions!=null?props.data.pressupostRapidObservacions:(clientDefaults.observacions||props.client?.pressupostObservacions||"");
  const formaPagament=props.data?.pressupostRapidFormaPagament!=null?props.data.pressupostRapidFormaPagament:(clientDefaults.formaPagament||props.client?.pressupostFormaPagament||"");
  const numeroPressupost=props.data?.pressupostRapidNumero||"";
  const referencia=props.data?.pressupostRapidReferencia||props.obra?.subtitol||props.obra?.nom||"";
  const dataPressupost=props.data?.pressupostRapidData||todayISO8743();
  const versioPressupost=props.data?.pressupostRapidVersio||"v01";
  const tercerNom=props.data?.pressupostRapidTercerNom||props.obra?.propietat||"";
  const tercerNif=props.data?.pressupostRapidTercerNif||props.obra?.nifPropietat||"";
  const tercerAdreca=props.data?.pressupostRapidTercerAdreca||props.obra?.adrecaPropietat||"";
  const tercerEmail=props.data?.pressupostRapidTercerEmail||props.obra?.emailPropietat||"";
  const obraAdrecaPressupost=props.data?.pressupostRapidObraAdreca||[props.obra?.adreca,props.obra?.codiPostal,props.obra?.poblacio].filter(Boolean).join(" · ");
  const realitzadorPressupost=issuerFiscalName87100(props.client);
  const clientFinalPressupost=tercerNom||props.obra?.propietat||"Client";
  const suggestedNumero878194=useMemo(()=>nextClientBudgetNumber878194(props.client,props.clientBudgetNumbers878194||[],dataPressupost),[props.client?.id,props.client?.nom,props.client?.rao,dataPressupost,(props.clientBudgetNumbers878194||[]).join("|")]);
  useEffect(()=>{
    if(props.data?.pressupostRapidNumero||!suggestedNumero878194)return;
    props.setData?.(d=>d.pressupostRapidNumero?d:{...d,pressupostRapidNumero:suggestedNumero878194,pressupostRapidVersio:d.pressupostRapidVersio||"v01",updatedAt:new Date().toISOString()});
  },[props.obra?.id,suggestedNumero878194]);
  function setMeta878155(k,v){props.setData?.(d=>({...d,[k]:v,updatedAt:new Date().toISOString()}))}
  function setMany878160(patch){props.setData?.(d=>({...d,...patch,updatedAt:new Date().toISOString()}))}
  function saveClientDefaults878160(){
    lsSet8779(clientBudgetDefaultsKey878160(props.client),JSON.stringify({observacions,formaPagament}));
    alert("Observacions i forma de pagament guardades com a defecte per aquest client.");
  }
  function addManual878153(){
    props.setData?.(d=>{
      const current=d.partides||[];
      const cap=current[0]?.cap||"01 PRESSUPOST";
      return {...d,partides:[...current,{id:"pr-"+Date.now(),codi:String(current.length+1).padStart(2,"0")+".01",ut:"ut",concepte:"Nova partida",desc:"",cap,q:"1,00",pu:"0,00",pressupostMesures:[],certAnterior:0,certActual:0,certsByNum:{},tipus:"Pressupost ràpid manual"}],updatedAt:new Date().toISOString()};
    });
  }
  function doc878153(){return {type:"pressupostobra",title:"PRESSUPOST D’OBRA",numeroPressupost:numeroPressupost||suggestedNumero878194,referencia,dataPressupost,versioPressupost,obraAdreca:obraAdrecaPressupost,tercerNom,tercerNif,tercerAdreca,tercerEmail,realitzadorPressupost,clientFinalPressupost,subtitle:`${parts} partides · ${money(total)}`,rows,total,data:new Date().toLocaleDateString("ca-ES"),observacions,formaPagament}}
  function saveAsDocument878153(){
    const doc=doc878153();
    props.setData?.(d=>({
      ...d,
      documents:[{id:"doc-pres-"+Date.now(),nom:`Pressupost d’obra · ${numeroPressupost||new Date().toLocaleDateString("ca-ES")}`,tipus:"PRESSUPOST",folder:"03_AMIDAMENTS_PRESSUPOST_OBRA",data:new Date().toLocaleDateString("ca-ES"),size:0,storage:"generat",hasFile:false,import:total,origen:"Pressupost ràpid",observacions,formaPagament,docData:doc},...(d.documents||[])],
      updatedAt:new Date().toISOString()
    }));
    alert("Pressupost guardat dins Documents · Amidaments / pressupost d’obra. Es podrà obrir amb el mateix format de pressupost.");
  }
  function exportRapidExcel878180(){exportBudgetDocExcel878180(doc878153(),`pressupost_rapid_${numeroPressupost||props.obra?.nom||"export"}`)}
  return <div className="pressupost-rapid-v87150 pressupost-rapid-v87153 pressupost-rapid-v87155 pressupost-rapid-v87160">
    <Card title="Pressupost ràpid" action={<div className="actions-inline compact-actions-v87160"><label className="secondary upload-label"><Upload/> Importar Excel<input type="file" accept=".xlsx,.xls" onChange={props.importExcel}/></label><button className="secondary" onClick={addManual878153}>+ Partida manual</button><button className="secondary" onClick={saveAsDocument878153}>Guardar a Documents</button><button className="primary" onClick={()=>props.openDoc?.(doc878153())}>Previsualitzar / PDF</button><button className="secondary" onClick={exportRapidExcel878180}>Exportar Excel</button></div>}>
      <div className="rapid-summary-strip-v87160"><div><span>Total pressupost</span><b>{money(total)}</b></div><div><span>Partides</span><b>{parts}</b></div><div><span>Client</span><b>{props.client?.nom||props.client?.rao||"Pendent"}</b></div><div><span>Obra</span><b>{props.obra?.nom||"Pendent"}</b></div></div>
      <details className="progressive-panel-v87160">
        <summary><b>Dades del pressupost</b><span>Número, referència, versió i dades del tercer</span></summary>
        <div className="form-grid compact-form-v87160">
          <label><span>Núm. pressupost · correlatiu per client</span><input value={numeroPressupost} onChange={e=>setMeta878155("pressupostRapidNumero",e.target.value)} placeholder={suggestedNumero878194}/><small className="field-help-v878194">Estructura: any · codi client · número correlatiu.</small></label>
          <label><span>Referència de l’obra</span><input value={referencia} onChange={e=>setMeta878155("pressupostRapidReferencia",e.target.value)} placeholder="Ex: Pressupost de SATE"/></label>
          <label><span>Data</span><input type="date" value={dataPressupost} onChange={e=>setMeta878155("pressupostRapidData",e.target.value)}/></label>
          <label><span>Versió</span><input value={versioPressupost} onChange={e=>setMeta878155("pressupostRapidVersio",e.target.value)} placeholder="v01"/></label>
          <label className="span-all"><span>Adreça de l’obra</span><input value={obraAdrecaPressupost} onChange={e=>setMeta878155("pressupostRapidObraAdreca",e.target.value)} placeholder="Ex: carrer, municipi"/></label>
          <label><span>Tercer / promotor</span><input value={tercerNom} onChange={e=>setMeta878155("pressupostRapidTercerNom",e.target.value)} placeholder="Nom del tercer o promotor"/></label>
          <label><span>NIF/CIF tercer</span><input value={tercerNif} onChange={e=>setMeta878155("pressupostRapidTercerNif",e.target.value)} placeholder="NIF/CIF"/></label>
          <label className="span-all"><span>Adreça / contacte tercer</span><input value={tercerAdreca} onChange={e=>setMeta878155("pressupostRapidTercerAdreca",e.target.value)} placeholder="Adreça del tercer/promotor"/></label>
          <label className="span-all"><span>Email tercer</span><input value={tercerEmail} onChange={e=>setMeta878155("pressupostRapidTercerEmail",e.target.value)} placeholder="Opcional"/></label>
          <button type="button" className="secondary" onClick={()=>setMany878160({pressupostRapidReferencia:props.obra?.subtitol||props.obra?.nom||referencia,pressupostRapidObraAdreca:[props.obra?.adreca,props.obra?.codiPostal,props.obra?.poblacio].filter(Boolean).join(" · "),pressupostRapidTercerNom:props.obra?.propietat||tercerNom,pressupostRapidTercerNif:props.obra?.nifPropietat||tercerNif,pressupostRapidTercerAdreca:props.obra?.adrecaPropietat||tercerAdreca,pressupostRapidTercerEmail:props.obra?.emailPropietat||tercerEmail})}>Reomplir des de dades expedient</button>
        </div>
      </details>
      <details className="progressive-panel-v87160" open>
        <summary><b>Observacions i forma de pagament</b><span>Per defecte del client, editable per aquest pressupost</span></summary>
        <div className="form-grid compact-form-v87160">
          <label className="span-all"><span>Observacions</span><textarea value={observacions} onChange={e=>setMeta878155("pressupostRapidObservacions",e.target.value)} placeholder="Condicions del pressupost, validesa, exclusions..."/></label>
          <label className="span-all"><span>Forma de pagament</span><textarea value={formaPagament} onChange={e=>setMeta878155("pressupostRapidFormaPagament",e.target.value)} placeholder="Forma de pagament habitual del client."/></label>
          <button type="button" className="secondary" onClick={saveClientDefaults878160}>Guardar com a defecte del client</button>
        </div>
      </details>
    </Card>
    <details className="progressive-panel-v87160 pressupost-editor-panel-v87160" open>
      <summary><b>Pressupost per capítols, versions i llibreria</b><span>Edita partides, afegeix des de llibreria o incorpora descomposats</span></summary>
      <Pressupost {...props} quickMode/>
    </details>
  </div>
}

function Obra({obra,client,clients,setClients,data,setData,tab,setTab,setScreen,uploadImage,importExcel,deletePressupostVersion,duplicatePressupostVersion,updateCert,addCertificacio,updateObraFitxa8721,deleteCertificacio8721,updateCertDate8721,updateCertDate,certInfo,setCertInfo,saveCert,openEmail,openDoc,openAgent,openActa,openPartida,openEvent,selectedActaId,setSelectedActaId,timer,setTimer,startTimer,stopTimer,addManualHours,deleteHour,addPressupostTecnic,updatePressupostTecnic,facturarPressupostTecnic,addFacturaTecnica,updateFacturaTecnica,deletePressupostTecnic,deleteFacturaTecnica,deleteObra,allAgents=[],clientHistoricalPartides=[],clientBudgetNumbers878194=[],partidaLibrary=[],setPartidaLibrary}){
  const[estatObra,setEstatObra]=useState(obra.estat||"Pressupostada");
  const[editObra,setEditObra]=useState(false);
  const[tabsOpen,setTabsOpen]=useState(()=>!(typeof window!=="undefined"&&(window.innerWidth||0)<951));
  const[mobileFlowOpen87119,setMobileFlowOpen87119]=useState(false);
  const[mobileActionsOpen87119,setMobileActionsOpen87119]=useState(false);
  useEffect(()=>setEstatObra(obra.estat||"Pressupostada"),[obra.id,obra.estat]);
  let tabs=tabsForWork8737(obra,data);
  const workType878193=canonicalWorkType8740(obra?.tipusTreball||obra?.tipologia||"");
  const canQuickBudget878193=["Pressupost d’obra / amidaments","Elaboració de pressupost per client"].includes(workType878193)||tabs.includes("Pressupost ràpid");
  const hasBudgetCapability878194=canQuickBudget878193||tabs.includes("Pressupost obra")||tabs.includes("Gestió obra");
  const autoBudgetNumber878194=useMemo(()=>nextClientBudgetNumber878194(client,clientBudgetNumbers878194,data?.pressupostRapidData||todayISO8743()),[client?.id,client?.nom,client?.rao,(clientBudgetNumbers878194||[]).join("|"),data?.pressupostRapidData]);
  useEffect(()=>{
    if(!hasBudgetCapability878194||data?.pressupostRapidNumero||!autoBudgetNumber878194)return;
    setData?.(d=>d.pressupostRapidNumero?d:{...d,pressupostRapidNumero:autoBudgetNumber878194,pressupostRapidVersio:d.pressupostRapidVersio||"v01",updatedAt:new Date().toISOString()});
  },[obra?.id,hasBudgetCapability878194,autoBudgetNumber878194]);
  const directBudgetInfo878214=ensureBudgetGroups8786(data);
  const directBudgetId878214=directBudgetInfo878214.active||"principal";
  const directBudgetData878214=filterBudgetData8786(data,directBudgetId878214);
  const directBudgetTotal878214=(directBudgetData878214.partides||[]).reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  function setDirectBudgetData878214(updater){
    setData?.(globalData=>{
      const bid=ensureBudgetGroups8786(globalData).active||"principal";
      const currentScope=filterBudgetData8786(globalData,bid);
      const nextScope=typeof updater==="function"?updater(currentScope):updater;
      return {...mergeBudgetData8786(globalData,bid,nextScope),activeBudgetIdObra:bid,updatedAt:new Date().toISOString()};
    });
  }
  function selectDirectBudget878214(id){setData?.(d=>({...d,activeBudgetIdObra:id||"principal",updatedAt:new Date().toISOString()}))}
  function updateDirectCert878214(codi,fieldOrValue,value){
    const field=value===undefined?"certActual":fieldOrValue;
    const raw=value===undefined?fieldOrValue:value;
    const n=parseNum8770(raw);
    setDirectBudgetData878214(scope=>({...scope,partides:(scope.partides||[]).map(r=>{
      if(String(r.codi||"")!==String(codi||""))return r;
      const next={...r,[field]:Number.isFinite(n)?n:0};
      if(String(field).startsWith("cert_")){
        const certKey=String(field).replace("cert_","");
        next.certsByNum={...(r.certsByNum||{}),[certKey]:Number.isFinite(n)?n:0};
      }
      return next;
    })}));
  }
  function addDirectCert878214(){
    setDirectBudgetData878214(scope=>{
      const certs=scope.certificacions||[];
      const nextNum=(certs.reduce((m,c)=>Math.max(m,+c.numero||0),0)||0)+1;
      return {...scope,certificacions:[...certs,{id:"c"+Date.now(),budgetId:directBudgetId878214,numero:String(nextNum),data:todayShort8713(),estat:"Pendent",import:0}]};
    });
  }
  function deleteDirectCert878214(id){
    if(!confirm("Eliminar aquesta certificació?"))return;
    setDirectBudgetData878214(scope=>({...scope,certificacions:(scope.certificacions||[]).filter(c=>c.id!==id)}));
  }
  function updateDirectCertDate878214(id,value){setDirectBudgetData878214(scope=>({...scope,certificacions:(scope.certificacions||[]).map(c=>c.id===id?{...c,data:value}:c)}))}
  let activeTab=tabs.includes(tab)?tab:"Resum";
  const renderTab=()=> <>
    {activeTab==="Resum"&&<Resum obra={obra} client={client} data={data} openAgent={openAgent}/>} 
    {activeTab==="Dades"&&<FitxaDadesTab8769 obra={obra} client={client} clients={clients} setClients={setClients} data={data} save={updateObraFitxa8721} allAgents={uniqAgents8768([...(allAgents||[]),...(data.agents||[])])} setData={setData} openAgent={openAgent}/>} 
    {activeTab==="Agents"&&<div className="fitxa-dades-stack-v878133 agents-tab-v87145"><PrincipalAgentsPanel878134 obra={obra} client={client} agents={sortAgents878134(uniqAgents8768([...(data.agents||[])]))}/><AgentsObraCard data={data&&data.agents?data:{agents:[]}} libraryAgents={sortAgents878134(uniqAgents8768([...(allAgents||[]),...(data.agents||[])]))} setData={setData} openAgent={openAgent}/></div>} 
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
    {activeTab==="Pressupost obra"&&<Pressupost data={directBudgetData878214} setData={setDirectBudgetData878214} importExcel={(e)=>importExcel?.(e,directBudgetId878214)} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} openPartida={openPartida} openEmail={openEmail} openDoc={openDoc} client={client} obra={obra} clientHistoricalPartides={clientHistoricalPartides} budgetGroups={directBudgetInfo878214.groups} activeBudgetId={directBudgetId878214} selectBudget={selectDirectBudget878214} totalActive={directBudgetTotal878214} partidaLibrary={partidaLibrary} setPartidaLibrary={setPartidaLibrary}/>} 
    {activeTab==="Pressupost ràpid"&&<PressupostRapid878150 data={data} setData={setData} importExcel={importExcel} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} openPartida={openPartida} openEmail={openEmail} openDoc={openDoc} client={client} obra={obra} clientBudgetNumbers878194={clientBudgetNumbers878194} clientHistoricalPartides={clientHistoricalPartides} partidaLibrary={partidaLibrary} setPartidaLibrary={setPartidaLibrary}/>} 
    {activeTab==="Certificacions obra"&&<Cert data={directBudgetData878214} setData={setDirectBudgetData878214} updateCert={updateDirectCert878214} deleteCertificacio8721={deleteDirectCert878214} updateCertDate8721={updateDirectCertDate878214} addCertificacio={addDirectCert878214} ci={certInfo} setCi={setCertInfo} saveCert={saveCert} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Factures"&&<FacturesTecniques8738 data={data} obra={obra} addFactura={addFacturaTecnica} updateFactura={updateFacturaTecnica} deleteFactura={deleteFacturaTecnica} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Facturació obra"&&<Fact data={data} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Gestió obra"&&(hasModule2Access8747()?<GestioObra8746 data={data} setData={setData} importExcel={importExcel} deletePressupostVersion={deletePressupostVersion} duplicatePressupostVersion={duplicatePressupostVersion} openPartida={openPartida} openEmail={openEmail} openDoc={openDoc} updateCert={updateCert} deleteCertificacio8721={deleteCertificacio8721} updateCertDate8721={updateCertDate8721} addCertificacio={addCertificacio} certInfo={certInfo} setCertInfo={setCertInfo} saveCert={saveCert} client={client} obra={obra} clientHistoricalPartides={clientHistoricalPartides} partidaLibrary={partidaLibrary} setPartidaLibrary={setPartidaLibrary}/>:<ModulLocked8747/>)} 
    {activeTab==="Agenda / Avisos"&&<AgendaExpedient8774 data={data} setData={setData} obra={obra} client={client}/>} 
    {activeTab==="Actes"&&<Actes8761 obra={obra} client={client} data={data} setData={setData} openEmail={openEmail} openDoc={openDoc} allAgents={allAgents}/>} 
    {activeTab==="Fotografies"&&<Fotografies8761 data={data} setData={setData}/>} 
    {activeTab==="Documents"&&<Documents obra={obra} data={data} setData={setData} openEmail={openEmail} openDoc={openDoc}/>} 
    {activeTab==="Gestió temps"&&<HonorarisTemps obraId={obra.id} data={data} timer={timer} setTimer={setTimer} startTimer={startTimer} stopTimer={stopTimer} addManualHours={addManualHours} deleteHour={deleteHour}/>} 
    {activeTab==="Rendiment"&&<RendimentHonorarisExpedient878120 data={data} obra={obra}/>} 
  </>;
  return <div className="obra-page obra-page-v87105">
    {editObra&&<EditObraModal8725 obra={obra} clients={clients||[]} close={()=>setEditObra(false)} save={(patch)=>{updateObraFitxa8721?.(patch);setEditObra(false)}}/>}
    {data?.economicRecoveryV87214?.applied&&<div className="economic-recovery-banner-v87214"><b>Dades econòmiques recuperades</b><span>S’han restaurat {data.economicRecoveryV87214.restored||0} preus i quantitats de la còpia estable, mantenint els amidaments i certificacions actuals.</span></div>}
    {data?.certificationRecoveryV87215?.applied&&<div className="economic-recovery-banner-v87214"><b>Certificacions recuperades</b><span>S’han reconstruït les certificacions {data.certificationRecoveryV87215.certifications?.join(", ")||"1–8"} sense substituir les línies de medició actuals de la certificació 8.</span></div>}
    <section className="obra-mini-fixed-v8776 obra-mini-fixed-single-v8777 obra-head-access-v87105">
      <button type="button" className="secondary obra-tabs-toggle-v87105" onClick={()=>setTabsOpen(v=>!v)}><Menu/> Pestanyes</button>
      <div className="obra-head-main-v87105">
        <small>{expedientCode8739(obra)}</small>
        <h2>{obra.nom}</h2>
        <p>{client.nom} · {moduleLabel8737(obra)}</p>
        <div className="obra-mobile-flow-v87119">
          <button type="button" className="primary" onClick={()=>setMobileFlowOpen87119(v=>!v)}>Obrir opcions de l’expedient</button>
          <button type="button" className="secondary" onClick={()=>setMobileActionsOpen87119(v=>!v)}>Accions</button>
          {mobileFlowOpen87119&&<div className="obra-mobile-flow-panel-v87119"><div className="flow-title-v87119"><b>Què vols obrir?</b><button type="button" onClick={()=>setMobileFlowOpen87119(false)}>Tancar</button></div>{tabs.map(t=><button type="button" key={t} onClick={()=>{setTab(t);setTabsOpen(false);setMobileFlowOpen87119(false)}} className={activeTab===t?"active":""}><span>{t}</span><small>{activeTab===t?"Oberta":"Entrar"}</small></button>)}</div>}
          {mobileActionsOpen87119&&<div className="obra-mobile-actions-panel-v87119"><button type="button" className="secondary" onClick={()=>{setMobileActionsOpen87119(false);setScreen("Treballs / Expedients")}}><ArrowLeft/> Tornar al llistat</button><button type="button" className="secondary" onClick={()=>{setMobileActionsOpen87119(false);setEditObra(true)}}>Modificar fitxa</button><button type="button" className="danger" onClick={()=>deleteObra?.(obra.id)}>Eliminar expedient</button></div>}
        </div>
      </div>
      <div className="obra-mini-actions-v8776 obra-evolution-actions-v878193"><Badge estat={estatObra}/>{canQuickBudget878193&&<button type="button" className="primary" onClick={()=>setTab("Pressupost ràpid")}>Crear / editar pressupost</button>}<button type="button" className="secondary" onClick={()=>setEditObra(true)}>Ampliar encàrrec</button><button type="button" className="secondary" onClick={()=>setScreen("Treballs / Expedients")}><ArrowLeft/> Tornar</button><button type="button" className="danger" onClick={()=>deleteObra?.(obra.id)}>Eliminar</button></div>
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
    <label><span>Estat</span><select value={normalizeExpedientStatus878136(f.estat)} onChange={e=>ch("estat",e.target.value)}>{statusOptions878136(f.estat).map(st=><option key={st}>{st}</option>)}</select></label>
    <label><span>Tipologia</span><input value={f.tipologia||""} onChange={e=>ch("tipologia",e.target.value)}/></label>
    <label className="span-all"><span>Observacions</span><textarea value={f.observacions||""} onChange={e=>ch("observacions",e.target.value)}/></label>
  </div>
  <div className="modal-actions"><button className="secondary" onClick={close}>Cancel·lar</button><button className="primary" onClick={()=>save(f)}>Guardar canvis</button></div>
</Modal>
}

function Resum({obra,client,data,openAgent}){
let events=data.events||[], actes=data.actes||[], docs=data.documents||[], fotos=data.fotos||[], hores=data.hores||[], pressupostos=data.pressupostosTecnic||[], factures=data.facturesTecnic||[], certs=data.certificacions||[], factObra=data.factures||[], tasques=data.tasques||[];
const now=Date.now();
const futureEvents=uniqueEvents878137(events).filter(e=>eventTime8783(e)>=todayStartMs878136()).sort((a,b)=>eventTime8783(a)-eventTime8783(b));
const proper=futureEvents[0]||null;
const pendingTasks=tasques.filter(t=>!['Fet','Anul·lat'].includes(String(t.estat||'Pendent'))).sort((a,b)=>(timeValue8783(a.data)||9999999999999)-(timeValue8783(b.data)||9999999999999));
let totalHores=hores.reduce((s,h)=>s+(+h.hores||0),0);
let costTemps=hores.reduce((s,h)=>s+(+h.hores||0)*(+h.preu||+h.preuHora||0)+(+h.despeses||0),0);
function certImportResum878126(c){const n=+c.numero||0;const calc=(data.partides||[]).reduce((sum,r)=>sum+certQty8783(r,n)*parseNum8770(r.pu),0);return calc||(+c.import||0)||0}
const certMapResum878137=new Map();
certs.forEach(c=>{const key=String(c.numero||c.id||'');const t=Math.max(clampActivityTime878134(c.updatedAt),clampActivityTime878134(c.createdAt),clampActivityTime878134(c.data),timeValue8783(c.id));const prev=certMapResum878137.get(key);if(!prev||t>prev.t)certMapResum878137.set(key,{c,t});});
const certsUnique=[...certMapResum878137.values()].sort((a,b)=>(b.t||0)-(a.t||0)||(+b.c.numero||0)-(+a.c.numero||0));
const lastCertByNum=[...certMapResum878137.values()].sort((a,b)=>(+b.c.numero||0)-(+a.c.numero||0))[0];
let latest=[];
const addLatest=(tipus,txt,time,detail='')=>{if(time&&time<=now+60*60*1000)latest.push({tipus,txt,time,detail})};
uniqueEvents878137(events).forEach(e=>{const t=eventTime8783(e);if(t<now)addLatest(e.type||e.tipus||'Agenda',e.title||e.titol||e.note||'Cita / avís',t,e.note||e.detail||'')});
const actKey=new Set();
actes.forEach(a=>{const k=`${a.titol||''}|${a.data||''}`;if(actKey.has(k))return;actKey.add(k);addLatest('Acta',a.titol||'Acta d’expedient',itemTime8783(a),a.data||'')});
certsUnique.forEach(({c,t})=>addLatest('Certificació',`Certificació ${c.numero||''} · ${money(certImportResum878126(c))}`,t||itemTime8783(c),c.estat||''));
pressupostos.forEach(p=>addLatest('Pressupost',p.concepte||p.nom||'Pressupost tècnic',itemTime8783(p),money(baseIva8743?p.base||0:p.import||0)));
factures.forEach(f=>addLatest('Factura honoraris',f.numero||f.concepte||'Factura / proforma',itemTime8783(f),f.estat||''));
factObra.forEach(f=>addLatest('Factura obra',f.numero||f.concepte||'Factura / proforma obra',itemTime8783(f),f.estat||''));
hores.forEach(h=>addLatest('Temps',`${h.tasca||h.etiqueta||'Temps registrat'} · ${(+h.hores||0).toFixed(2)} h`,itemTime8783(h),money((+h.hores||0)*(+h.preu||+h.preuHora||0))));
latest=latest.sort((a,b)=>b.time-a.time).slice(0,8);
const totalItems=events.length+actes.length+docs.length+fotos.length+hores.length+pressupostos.length+factures.length+certs.length+factObra.length;
const month=monthName878137(new Date());
return <div className="resum-dashboard-v8748 resum-dashboard-v878137">
  <section className="resum-main-v8748">
    <div className="resum-title-v8748 resum-title-v878137"><div><span>Fitxa resum de l’expedient</span><h2>{obra.nom}</h2><p>{client.nom} · {moduleLabel8737(obra)}</p></div><Badge estat={obra.estat}/></div>
    <div className="obra-today-grid-v878137">
      <div className="obra-today-card-v878137 blue"><small>Proper avís real</small><b>{proper?proper.title||proper.titol||'Cita':'Sense cites futures'}</b><span>{proper?`${fmtEventDate878136(proper)} · ${proper.hora||''}`:'No es mostren avisos caducats'}</span></div>
      <div className="obra-today-card-v878137 green"><small>Darrera certificació</small><b>{lastCertByNum?`Certificació ${lastCertByNum.c.numero||''}`:'Sense certificacions'}</b><span>{lastCertByNum?`${money(certImportResum878126(lastCertByNum.c))} · ${fmtActivityDate8783(lastCertByNum.t||itemTime8783(lastCertByNum.c))}`:'—'}</span></div>
      <div className="obra-today-card-v878137 amber"><small>Feines pendents</small><b>{pendingTasks.length}</b><span>{pendingTasks[0]?pendingTasks[0].text||'Tasca pendent':'Cap pendent'}</span></div>
      <div className="obra-today-card-v878137"><small>Temps</small><b>{totalHores.toFixed(2)} h</b><span>{money(costTemps)} valor intern</span></div>
    </div>
    <Card title="Darreres actuacions reals"><div className="activity-list-v8748 activity-list-v878137">{latest.length===0&&<div className="activity-empty-v8738"><b>Sense activitat recent</b><span>Les actes, certificacions, factures i temps apareixeran aquí quan siguin reals.</span></div>}{latest.map((x,i)=><div className="activity-row-v8748" key={`${x.tipus}-${x.time}-${i}`}><strong>{x.tipus}</strong><span>{x.txt}</span><em>{fmtActivityDate8783(x.time)}</em></div>)}</div></Card>
    <Card title="Feines pendents de l’expedient"><div className="task-home-list-v878137 compact">{pendingTasks.length===0?<Empty text="No hi ha tasques pendents en aquest expedient."/>:pendingTasks.slice(0,5).map(t=><div key={t.id} className={`task-home-row-v878137 ${taskStatusTone878137(t.estat)}`}><div className="task-main-v878137"><b>{t.text||'Tasca pendent'}</b><span>{t.estat||'Pendent'} · {t.data?fmtAppDate8748(t.data):'Sense data'} · {t.prioritat||'Normal'}</span></div></div>)}</div></Card>
  </section>
  <aside className="resum-side-v8748 resum-side-v878137">
    <div className="side-card-v8748 blue"><small>Tipus de treball</small><b>{moduleLabel8737(obra)}</b><span>{month} · {normalizeExpedientStatus878136(obra.estat)}</span></div>
    <div className="side-card-v8748"><small>Proper avís / cita</small><b>{proper?proper.title||proper.note:'—'}</b><span>{proper?`${fmtEventDate878136(proper)} · ${proper.hora||''}`:'Sense avisos programats futurs'}</span></div>
    <div className="side-card-v8748 green"><small>Temps registrat</small><b>{totalHores.toFixed(2)} h</b><span>{money(costTemps)} valor intern</span></div>
    <div className="side-card-v8748 amber"><small>Documents / fotos</small><b>{docs.length+fotos.length}</b><span>{docs.length} docs · {fotos.length} fotos</span></div>
    <div className="side-card-v8748"><small>Registres útils</small><b>{totalItems}</b><span>{actes.length} actes · {certsUnique.length} certificacions</span></div>
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
function ExactHtmlPreview878193({html,title="Vista prèvia exacta"}){
  return <div className="exact-print-preview-v878193"><div className="exact-print-note-v878193"><b>Vista prèvia fidel</b><span>Aquesta és la mateixa plantilla que s’utilitzarà en imprimir o guardar el PDF, inclosa l’orientació i la mida de pàgina.</span></div><iframe title={title} srcDoc={html}/></div>
}
function QuotePreview8743({type="pressupost",doc,obra,close}){
  const isFactura=type==="factura";
  const html=quotePrintHtml8745(type,doc,obra);
  return <Modal title={`Vista prèvia ${isFactura?"factura":"pressupost"}`} close={close}>
    <ExactHtmlPreview878193 html={html} title={isFactura?"Factura / proforma":"Pressupost"}/>
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
    <div className="quote-list-v8742 quote-list-v8743 quote-list-v8744">{rows.length===0&&<Empty text="Encara no hi ha pressupostos en aquest expedient."/>}{rows.map(r=><div className="quote-row-v8742 quote-row-v8743 quote-row-v8744" key={r.id}><div><strong>{r.numero||"PRE"}</strong><span>{r.concepte||"Pressupost"}</span><small>{r.data||"—"} · {r.estat||"Pendent"}</small></div><b>{money(totalIva8743(r))}<small>IVA inclòs</small></b><div className="actions-inline quote-actions-desktop-v87118"><button className="secondary" onClick={()=>setPreview(r)}>Veure PDF</button><button className="secondary" onClick={()=>reset(r)}>Editar</button><button className="secondary" onClick={()=>updatePressupost?.(r.id,{estat:"Acceptat"})}>Acceptar</button><button className="secondary" onClick={()=>facturarPressupost?.(r.id)}>Fer factura</button><button className="secondary" onClick={()=>openEmail?.("Pressupost")}>Enviar</button><button className="danger" onClick={()=>deletePressupost?.(r.id)}>Eliminar</button></div><select className="quote-mobile-action-v87118" defaultValue="" onChange={e=>{const v=e.target.value;e.currentTarget.value="";if(v==="pdf")setPreview(r);if(v==="edit")reset(r);if(v==="accept")updatePressupost?.(r.id,{estat:"Acceptat"});if(v==="invoice")facturarPressupost?.(r.id);if(v==="send")openEmail?.("Pressupost");if(v==="delete")deletePressupost?.(r.id)}}><option value="" disabled>Accions</option><option value="pdf">Veure PDF</option><option value="edit">Editar</option><option value="accept">Acceptar</option><option value="invoice">Fer factura</option><option value="send">Enviar</option><option value="delete">Eliminar</option></select></div>)}</div>
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
    <div className="quote-list-v8742 quote-list-v8743 quote-list-v8744">{rows.length===0&&<Empty text="Encara no hi ha factures en aquest expedient."/>}{rows.map(f=><div className="quote-row-v8742 quote-row-v8743 quote-row-v8744" key={f.id}><div><strong>{f.numero||"FAC"}</strong><span>{f.concepte||f.tipus||"Factura / proforma"}</span><small>{f.data||"—"} · {f.estat||"Pendent"}</small></div><b>{money(totalIva8743(f))}<small>IVA inclòs</small></b><div className="actions-inline quote-actions-desktop-v87118"><button className="secondary" onClick={()=>setPreview(f)}>Veure PDF</button><button className="secondary" onClick={()=>reset(f)}>Editar</button><button className="secondary" onClick={()=>openEmail?.("Factura")}>Enviar</button><button className="danger" onClick={()=>deleteFactura?.(f.id)}>Eliminar</button></div><select className="quote-mobile-action-v87118" defaultValue="" onChange={e=>{const v=e.target.value;e.currentTarget.value="";if(v==="pdf")setPreview(f);if(v==="edit")reset(f);if(v==="send")openEmail?.("Factura");if(v==="delete")deleteFactura?.(f.id)}}><option value="" disabled>Accions</option><option value="pdf">Veure PDF</option><option value="edit">Editar</option><option value="send">Enviar</option><option value="delete">Eliminar</option></select></div>)}</div>
  </Card></div>
}
function PartidaReadingModal87208({row={},title="Fitxa de la partida",editable=false,onChange,openBreakdown,close}){
  const table=row.descompostTable||null;
  const detected=descompostTableTotal878174(table)||descompostTotal878160(row.descompost||"");
  const hasBreakdown=!!(table?.rows?.length||libText87196(row.descompost));
  return <Modal title={title} close={close}><div className="partida-reading-modal-v87208"><div className="partida-reading-meta-v87208"><div><small>Codi</small><b>{row.codi||row.codiIntern||"—"}</b></div><div><small>Unitat</small><b>{row.ut||"ut"}</b></div><div><small>Preu unitari</small><b>{money(parseNum8770(row.pu)||0)}</b></div><div><small>Total descompost</small><b>{hasBreakdown?money(detected):"Sense descompost"}</b></div></div><div className={`partida-reading-split-v87208 ${hasBreakdown?"has-breakdown":""}`}><section><h3>Descripció completa</h3>{editable?<textarea value={row.desc||""} onChange={e=>onChange?.("desc",e.target.value)} placeholder="Escriu la descripció llarga de la partida..."/>:<div className="partida-reading-description-v87208">{libText87196(row.desc)?row.desc:<em>Aquesta partida encara no té descripció llarga.</em>}</div>}</section>{hasBreakdown&&<section><div className="partida-reading-section-head-v87208"><h3>Descompost</h3>{editable&&openBreakdown&&<button type="button" className="secondary small" onClick={openBreakdown}>Editar descompost</button>}</div>{table?.rows?.length?<div className="partida-reading-table-wrap-v87208"><table><thead><tr><th>Concepte</th><th>Ut.</th><th>Rend.</th><th>Preu/ut</th><th>Total</th></tr></thead><tbody>{table.rows.map((item,index)=>item.isSection?<tr className="breakdown-section-v87207" key={item.id||index}><td colSpan="5"><b>{item.concepte}</b></td></tr>:<tr key={item.id||index}><td>{item.concepte||"—"}</td><td>{item.ut||"—"}</td><td>{item.q||"—"}</td><td>{item.pu||"—"}</td><td>{item.total||"—"}</td></tr>)}</tbody></table></div>:<pre className="partida-reading-breakdown-text-v87208">{row.descompost}</pre>}</section>}</div><div className="modal-actions">{editable&&openBreakdown&&<button type="button" className="secondary" onClick={openBreakdown}>Editar descompost</button>}<button type="button" className="primary" onClick={close}>Tancar i tornar al pressupost</button></div></div></Modal>;
}
function Pressupost({data,setData,importExcel,deletePressupostVersion,duplicatePressupostVersion,openPartida,openEmail,openDoc,client,obra,clientHistoricalPartides=[],budgetGroups=[],activeBudgetId="principal",selectBudget,addBudget,totalGlobal=0,totalActive=0,partidaLibrary=[],setPartidaLibrary,quickMode=false}){
  const [caps,setCaps]=useState(()=>group(data.partides||[],"cap"));
  const [open,setOpen]=useState(()=>Object.fromEntries(Object.keys(group(data.partides||[],"cap")).map((k,i)=>[k,i===0])));
  const [descOpen875,setDescOpen875]=useState({});
  const [budgetPartidaView87208,setBudgetPartidaView87208]=useState(null);
  const [editBudget8760b,setEditBudget8760b]=useState(false);
  const [capNameDraft8761,setCapNameDraft8761]=useState({});
  useEffect(()=>{
    if(!editBudget8760b){setCapNameDraft8761({});setOpenBudgetRow87173(null);setDescompostModal87173(null);}
  },[editBudget8760b]);
  useEffect(()=>{
    let target=null;
    Object.entries(caps||{}).some(([cap,items])=>(items||[]).some((row,index)=>{
      if(!descOpen875[`${cap}-${index}`])return false;
      target={cap,index};return true;
    }));
    if(!target)return;
    setBudgetPartidaView87208(target);
    setDescOpen875(prev=>({...prev,[`${target.cap}-${target.index}`]:false}));
  },[descOpen875,caps]);
  const currentClientId87196=String(client?.id||"");
  const [libraryOpen87115,setLibraryOpen87115]=useState(false);
  const [librarySearch87115,setLibrarySearch87115]=useState("");
  const [libraryCap87115,setLibraryCap87115]=useState("");
  const [libraryTargetCap87115,setLibraryTargetCap87115]=useState("");
  const [openBudgetRow87173,setOpenBudgetRow87173]=useState(null);
  const [descompostModal87173,setDescompostModal87173]=useState(null);
  const [editSnapshot878176,setEditSnapshot878176]=useState(null);
  const [budgetWorkTab878180,setBudgetWorkTab878180]=useState("Pressupost");
  const [libraryScope87160,setLibraryScope87160]=useState("all");
  const [budgetMeasureTarget878194,setBudgetMeasureTarget878194]=useState(null);
  useEffect(()=>{setLibrarySearch87115("");setLibraryCap87115("");setLibraryTargetCap87115("");setLibraryScope87160("all")},[currentClientId87196]);
  // V87.199: els pressupostos i Excel importats NO alimenten la llibreria automàticament.
  // Només s'hi incorpora una partida quan l'usuari prem explícitament "Desar a la llibreria".
  function currentLibraryDestinationCap87115(){return libraryTargetCap87115||sortedCapEntries8779(caps)[0]?.[0]||"C01 NOU CAPÍTOL"}
  function libDesc87118(row={}){return libLongDesc87196(row)}
  function savePartidaToLibrary87115(row,cap){
    const item={...row,id:row.libraryItemId||undefined,codiIntern:row.codiIntern||"",codiPressupost:row.codi||row.codiPressupost||"",cap:cap||row.cap||"General",clientIds:currentClientId87196?[currentClientId87196]:[],global:true,tipus:"Alta expressa des del pressupost",updatedAt:new Date().toISOString()};
    setPartidaLibrary?.(prev=>{
      const existing=item.id?(prev||[]).find(entry=>String(entry.id)===String(item.id)):null;
      return upsertPartidaLibrary87196(prev,{...item,clientIds:[...new Set([...(existing?.clientIds||[]),...(item.clientIds||[])])]});
    });
    alert("Partida desada a la llibreria general i vinculada amb aquest client. No s'ha creat cap llibreria separada.");
  }
  function startManualBudget87115(){
    const hasRows=Object.values(caps||{}).some(arr=>(arr||[]).length);
    if(hasRows&&!confirm("Aquest pressupost ja té partides. Vols substituir la vista d'edició per un pressupost manual buit? Primer guarda o crea un annex si vols conservar l'actual."))return;
    const nom="C01 NOU CAPÍTOL";
    setCaps({[nom]:[]});setOpen({[nom]:true});setEditBudget8760b(true);setLibraryOpen87115(true);setLibraryTargetCap87115(nom);
  }
  function addLibraryPartidaToBudget87115(item){
    if(!editBudget8760b){alert("Primer activa el mode edició del pressupost.");return;}
    if(currentClientId87196&&!(item.clientIds||[]).some(cid=>String(cid)===currentClientId87196))setPartidaLibrary?.(prev=>upsertPartidaLibrary87196(prev,{...item,clientIds:[...(item.clientIds||[]),currentClientId87196]}));
    const dest=currentLibraryDestinationCap87115();
    setCaps(p=>{
      const arr=[...(p[dest]||[])];
      const base=(String(dest).match(/(\d+)/)?.[1]||"").padStart(2,"0");
      const used=new Set(arr.map(r=>String(r.codi||"")));
      let next=arr.length+1;
      let printedCode=base?`${base}.${String(next).padStart(2,"0")}`:(item.codiPressupost||item.codi||"");
      while(used.has(printedCode)&&base)printedCode=`${base}.${String(++next).padStart(2,"0")}`;
      const row={...item,id:undefined,libraryItemId:item.id,codiIntern:item.codiIntern,cap:dest,codi:printedCode,codiPressupost:printedCode,q:1,pu:parseNum8770(item.pu),descompost:item.descompost||"",tipus:item.tipus||"Llibreria única"};
      return {...p,[dest]:[...arr,row]};
    });
    setOpen(o=>({...o,[dest]:true}));
  }
  async function importLibraryDescompost878161(id,file){
    if(!file)return;
    try{
      const parsed=await workbookDescompostFromFile878161(file);
      setPartidaLibrary?.(prev=>(prev||[]).map(x=>x.id===id?{...x,descompost:parsed.text,pu:parsed.total||x.pu||0,descompostSource:file.name,descompostSheet:parsed.sheet,updatedAt:new Date().toISOString()}:x));
      alert(`Descomposat importat a la llibreria: ${parsed.lines} línies · ${money(parsed.total)}.`);
    }catch(err){alert("No he pogut llegir el descomposat: "+String(err?.message||err));}
  }
  const centralLibrary87196=useMemo(()=>dedupePartidaLibrary87196(partidaLibrary||[]),[partidaLibrary]);
  const libraryItems87115=centralLibrary87196.filter(x=>(x.clientIds||[]).some(cid=>String(cid)===currentClientId87196));
  const visibleLibraryItems87160=libraryScope87160==="client"?libraryItems87115:centralLibrary87196;
  const sharedLibraryChapters87201=[...new Set(["General",...(lsJson8779("aco_library_chapters_v87201",[])||[]),...centralLibrary87196.map(x=>x.cap||"General")].map(x=>libText87196(x)).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true}));
  function setLibraryItems87115(updater){setPartidaLibrary?.(prev=>dedupePartidaLibrary87196(typeof updater==="function"?updater(prev||[]):updater||[]))}
  const libraryCaps87115=sharedLibraryChapters87201;
  const libraryFiltered87115=(visibleLibraryItems87160||[]).filter(x=>{
    const q=librarySearch87115.trim().toLowerCase();
    const okQ=!q||[x.codiIntern,x.codiPressupost,x.codi,x.concepte,libDesc87118(x),x.ut,x.tipus].some(v=>String(v||"").toLowerCase().includes(q));
    const okCap=!libraryCap87115||String(x.cap||"")===libraryCap87115;
    return okQ&&okCap;
  });
  function beginBudgetEdit878176(){
    const syncCaps=normalizeBudgetCaps878176(group(data.partides||[],"cap"));
    setCaps(syncCaps);
    setEditSnapshot878176(cloneJson878176(syncCaps));
    setOpen(Object.fromEntries(Object.keys(syncCaps).map((k,i)=>[k,quickMode||i===0])));
    setOpenBudgetRow87173(null);
    setDescompostModal87173(null);
    setEditBudget8760b(true);
  }
  function saveBudget8760b(){
    const normalized=normalizeBudgetCaps878176(caps);
    setCaps(normalized);
    persistBudgetCaps878179(normalized);
    setEditSnapshot878176(null);
    setEditBudget8760b(false);
  }
  function cancelBudget8760b(){
    const syncCaps=editSnapshot878176?cloneJson878176(editSnapshot878176):normalizeBudgetCaps878176(group(data.partides||[],"cap"));
    setCaps(syncCaps);
    setOpen(Object.fromEntries(Object.keys(syncCaps).map((k,i)=>[k,i===0])));
    setOpenBudgetRow87173(null);
    setDescompostModal87173(null);
    setEditSnapshot878176(null);
    setEditBudget8760b(false);
  }
  async function importDescompostosMassius878176(file){
    if(!editBudget8760b){alert("Primer activa Editar pressupost.");return;}
    if(!file)return;
    try{
      const items=await workbookDescompostsMassius878176(file);
      const prevCaps=cloneJson878176(caps);
      const next=cloneJson878176(prevCaps);
      const flat=[];
      Object.entries(next||{}).forEach(([cap,rows])=>(rows||[]).forEach((r,idx)=>flat.push({cap,idx,row:r,code:normCode878176(r.codi),canon:canonCode878177(r.codi),text:normText878176(`${r.codi||""} ${r.concepte||""}`)})));
      let matched=0;
      const unmatched=[];
      const matchedRows=[];
      items.forEach(it=>{
        const rawCode=it.code || it.sheet;
        const code=normCode878176(rawCode);
        const title=normText878176(it.title||it.sheet);
        let target=code?flat.find(x=>codeMatches878177(x.row?.codi||x.code,code)):null;
        if(!target && code){
          const ccode=canonCode878177(code);
          target=flat.find(x=>x.canon===ccode || codeMatches878177(x.canon,ccode));
        }
        if(!target && title){
          target=flat.find(x=>{
            const concept=normText878176(x.row?.concepte||"");
            return concept && (x.text.includes(title)||title.includes(concept)||concept.includes(title));
          });
        }
        if(!target){unmatched.push(`${it.sheet}${it.code?` (${it.code})`:""}`);return;}
        const arr=[...(next[target.cap]||[])];
        const current={...(arr[target.idx]||{})};
        const total=it.total||descompostTableTotal878174(it.table)||descompostTotal878160(it.text);
        arr[target.idx]={...current,descompost:it.text,descompostTable:it.table||null,descompostSource:file.name,descompostSheet:it.sheet,descompostImportedAt:new Date().toISOString(),descompostValidatedPu:total?qty2(total):(current.descompostValidatedPu||current.pu||"0,00")};
        next[target.cap]=arr;
        matched++;
        matchedRows.push(`${it.sheet} → ${current.codi||target.code||target.cap}`);
      });
      setCaps(next);
      persistBudgetCaps878179(next);
      setBudgetWorkTab878180("Validar descompostos");
      const msg=[`Descomposats llegits: ${items.length}. Assignats i guardats: ${matched}.`, matchedRows.length?`Assignats: ${matchedRows.slice(0,8).join(", ")}${matchedRows.length>8?"...":""}`:"", unmatched.length?`Sense coincidència: ${unmatched.slice(0,8).join(", ")}${unmatched.length>8?"...":""}`:""].filter(Boolean).join("\n");
      alert(msg);
    }catch(err){alert("No he pogut importar descomposats massius: "+String(err?.message||err));}
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
      n[cap][i]={...n[cap][i],[k]:v,...(k==="q"?{qFromPressupostMesures:false}:{})};
      return n;
    });
  }
  function saveBudgetMeasures878194(lines,total){
    const target=budgetMeasureTarget878194;
    if(!target)return;
    setCaps(p=>{
      const arr=[...(p[target.cap]||[])];
      if(!arr[target.i])return p;
      arr[target.i]={...arr[target.i],pressupostMesures:lines,q:qty2(total),qFromPressupostMesures:true};
      return {...p,[target.cap]:arr};
    });
    setBudgetMeasureTarget878194(null);
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
    setCaps(p=>{const arr=[...(p[cap]||[])];const base=(String(cap).match(/(\d+)/)?.[1]||"").padStart(2,"0");const next=arr.length+1;return {...p,[cap]:[...arr,{codi:base?`${base}.${String(next).padStart(2,"0")}`:"",cap,concepte:"Nova partida",desc:"",ut:"ut",q:"1,00",pu:"0,00",tipus:"Base"}]}});
    setOpen(o=>({...o,[cap]:true}));
  }

  function deletePartida878125(cap,i){
    if(!editBudget8760b)return;
    const row=(caps?.[cap]||[])[i];
    if(!confirm(`Eliminar aquesta partida del pressupost?\n${row?.codi||""} ${row?.concepte||""}`))return;
    setCaps(p=>{
      const arr=[...(p[cap]||[])];
      arr.splice(i,1);
      return {...p,[cap]:arr};
    });
  }

  function movePartidaCap878128(cap,i,dest){
    if(!editBudget8760b)return;
    const newCap=String(dest||"").trim();
    if(!newCap||newCap===cap)return;
    setCaps(p=>{
      const source=[...(p[cap]||[])];
      const row=source[i];
      if(!row)return p;
      source.splice(i,1);
      const target=[...(p[newCap]||[])];
      return {...p,[cap]:source,[newCap]:[...target,{...row,cap:newCap}]};
    });
    setOpen(o=>({...o,[newCap]:true}));
  }

  function applyDescompostToPartida878160(cap,i){
    if(!editBudget8760b)return;
    const row=(caps?.[cap]||[])[i]||{};
    const detected=descompostTableTotal878174(row.descompostTable)||descompostTotal878160(row.descompost||"");
    const pu=parseNum8770(row.descompostValidatedPu)||detected;
    if(!pu){alert("No hi ha cap preu/ut validat. Importa o revisa el descomposat i escriu el preu validat.");return;}
    setCaps(p=>{const arr=[...(p[cap]||[])];arr[i]={...arr[i],pu:qty2(pu),descompostValidatedPu:qty2(pu),puFromDescompost:true};return {...p,[cap]:arr};});
    setDescompostModal87173(null);
  }
  async function importDescompostExcel878161(cap,i,file){
    if(!editBudget8760b)return;
    if(!file)return;
    try{
      const parsed=await workbookDescompostFromFile878161(file);
      setCaps(p=>{
        const arr=[...(p[cap]||[])];
        const current=arr[i]||{};
        arr[i]={...current,descompost:parsed.text,descompostTable:parsed.table||null,descompostSource:file.name,descompostSheet:parsed.sheet,descompostImportedAt:new Date().toISOString(),descompostValidatedPu:parsed.total?qty2(parsed.total):(current.descompostValidatedPu||current.pu||"0,00")};
        return {...p,[cap]:arr};
      });
      alert(`Descomposat importat: ${parsed.lines} línies · total detectat ${money(parsed.total)}. Revisa'l i aplica el preu validat si és correcte.`);
    }catch(err){
      alert("No he pogut llegir el descomposat: "+String(err?.message||err));
    }
  }
  function budgetRowKey87173(cap,i){return `${cap}__${i}`}
  function toggleBudgetRow87173(cap,i){const k=budgetRowKey87173(cap,i);setOpenBudgetRow87173(prev=>prev===k?null:k);}
  function closeBudgetRow87173(){setOpenBudgetRow87173(null)}
  function openDescompostModal87173(cap,i){
    setOpenBudgetRow87173(budgetRowKey87173(cap,i));
    setDescompostModal87173({cap,i});
  }

  const total=Object.values(caps).flat().reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  function flattenCapsForBudget878179(nextCaps=caps){
    return sortedCapEntries8779(nextCaps||{}).flatMap(([cap,items])=>sortPartides8779(items).map(r=>({...r,cap,q:parseNum8770(r.q)||0,pu:parseNum8770(r.pu)||0})));
  }
  function persistBudgetCaps878179(nextCaps=caps){
    const normalized=normalizeBudgetCaps878176(nextCaps||{});
    const flat=flattenCapsForBudget878179(normalized);
    const totalFlat=flat.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
    const bid=data?.activeBudgetIdObra||activeBudgetId||"principal";
    setData?.(d=>{
      const now=new Date().toISOString();
      const existing=Array.isArray(d.pressupostos)?d.pressupostos:[];
      const markerId=bid==="principal"?"budget-marker-principal":"budget-marker-"+bid;
      const marker={id:markerId,budgetId:bid,versio:bid==="principal"?(data?.pressupostRapidVersio||"v01"):"Annex",data:todayShort8713(),nom:budgetLabel8786(d,bid),estat:`Guardat · ${flat.length} partides`,import:totalFlat,total:totalFlat,updatedAt:now};
      const has=existing.some(p=>String(p.id||"")===markerId || ((p.budgetId||"principal")===bid && (String(p.id||"").startsWith("budget-marker-")||p.versio==="Annex")));
      const pressupostos=has?existing.map(p=>((String(p.id||"")===markerId)||((p.budgetId||"principal")===bid&&(String(p.id||"").startsWith("budget-marker-")||p.versio==="Annex")))?{...p,...marker}:p):[...existing,marker];
      const otherBudgetRows=(d.partides||[]).filter(r=>(r.budgetId||"principal")!==bid);
      const activeBudgetRows=flat.map(r=>({...r,budgetId:bid}));
      return {...d,partides:[...otherBudgetRows,...activeBudgetRows],pressupostos,pressupost:bid==="principal"?totalFlat:(d.pressupost||0),updatedAt:now};
    });
  }
  function budgetPrintDoc878179(){
    const rows=flattenCapsForBudget878179(caps);
    const docTotal=rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
    return {
      type:"pressupostobra",
      title:"PRESSUPOST D’OBRA",
      numeroPressupost:data?.pressupostRapidNumero||budgetLabel8786(data,data.activeBudgetIdObra||activeBudgetId||"principal"),
      referencia:data?.pressupostRapidReferencia||"",
      dataPressupost:data?.pressupostRapidData||todayISO8743(),
      versioPressupost:data?.pressupostRapidVersio||"v01",
      obraAdreca:data?.pressupostRapidObraAdreca||"",
      tercerNom:data?.pressupostRapidTercerNom||client?.nom||client?.rao||"",
      tercerNif:data?.pressupostRapidTercerNif||client?.nif||"",
      tercerAdreca:data?.pressupostRapidTercerAdreca||client?.adreca||"",
      tercerEmail:data?.pressupostRapidTercerEmail||client?.email||"",
      realitzadorPressupost:issuerFiscalName87100(client),
      clientFinalPressupost:data?.pressupostRapidTercerNom||obra?.propietat||"Client",
      subtitle:`${rows.length} partides · ${money(docTotal)}`,
      rows,
      total:docTotal,
      data:new Date().toLocaleDateString("ca-ES"),
      observacions:data?.pressupostRapidObservacions||"",
      formaPagament:data?.pressupostRapidFormaPagament||""
    };
  }
  function saveBudgetDocument878179(){
    const doc=budgetPrintDoc878179();
    persistBudgetCaps878179(caps);
    setData?.(d=>({...d,documents:[{id:"doc-pres-obra-"+Date.now(),nom:`Pressupost obra · ${doc.numeroPressupost||doc.versioPressupost||new Date().toLocaleDateString("ca-ES")}`,tipus:"PRESSUPOST",folder:"03_AMIDAMENTS_PRESSUPOST_OBRA",data:new Date().toLocaleDateString("ca-ES"),size:0,storage:"generat",hasFile:false,import:doc.total,origen:"Pressupost obra",observacions:doc.observacions,formaPagament:doc.formaPagament,docData:doc},...(d.documents||[])],updatedAt:new Date().toISOString()}));
    alert("Pressupost guardat a Documents amb format de pressupost.");
  }
  const descompostValidationRows878180=useMemo(()=>{
    const out=[];
    Object.entries(caps||{}).forEach(([cap,items])=>(items||[]).forEach((r,i)=>{
      const detected=descompostTableTotal878174(r.descompostTable)||descompostTotal878160(r.descompost||"");
      const has=!!(r.descompostTable?.rows?.length||String(r.descompost||"").trim());
      if(has)out.push({cap,i,row:r,detected,validated:parseNum8770(r.descompostValidatedPu)||detected||0,current:parseNum8770(r.pu)||0});
    }));
    return out.sort((a,b)=>String(a.row?.codi||"").localeCompare(String(b.row?.codi||""),"ca",{numeric:true}));
  },[caps]);
  function setValidatedPu878180(cap,i,value){upd(cap,i,"descompostValidatedPu",value)}
  function normalizeValidatedPu878180(cap,i,value){upd(cap,i,"descompostValidatedPu",qty2(parseNum8770(value)||0))}
  function fillDetectedDescompostos878180(){
    const next=cloneJson878176(caps);
    let count=0;
    Object.entries(next||{}).forEach(([cap,items])=>(items||[]).forEach((r,i)=>{
      const detected=descompostTableTotal878174(r.descompostTable)||descompostTotal878160(r.descompost||"");
      if((r.descompostTable?.rows?.length||r.descompost)&&detected){next[cap][i]={...r,descompostValidatedPu:qty2(detected)};count++;}
    }));
    setCaps(next);persistBudgetCaps878179(next);alert(`Preus detectats carregats com a validats: ${count}.`);
  }
  function applyAllValidatedDescompostos878180(){
    const next=cloneJson878176(caps);
    let count=0;
    Object.entries(next||{}).forEach(([cap,items])=>(items||[]).forEach((r,i)=>{
      const detected=descompostTableTotal878174(r.descompostTable)||descompostTotal878160(r.descompost||"");
      const pu=parseNum8770(r.descompostValidatedPu)||detected;
      if((r.descompostTable?.rows?.length||r.descompost)&&pu){next[cap][i]={...r,pu:qty2(pu),descompostValidatedPu:qty2(pu),puFromDescompost:true};count++;}
    }));
    setCaps(next);persistBudgetCaps878179(next);alert(`Descomposats aplicats i guardats: ${count}.`);
  }
  function saveOnlyDescompostos878180(){
    persistBudgetCaps878179(caps);
    alert("Descomposats i preus validats guardats dins del pressupost.");
  }
  function exportBudgetExcel878180(){
    persistBudgetCaps878179(caps);
    exportBudgetDocExcel878180(budgetPrintDoc878179(),`pressupost_obra_${data?.pressupostRapidNumero||budgetLabel8786(data,activeBudgetId)||"export"}`);
  }
  const realPressupostos=(data.pressupostos||[]).filter(p=>!String(p.id||"").startsWith("budget-marker-")&&p.versio!=="Annex");
  const visiblePressupostos=realPressupostos.length?realPressupostos:(data.pressupostos||[]).filter(p=>String(p.id||"").startsWith("budget-marker-")||p.versio==="Annex");
  const budgetRows878211=Object.values(caps||{}).flat();
  const duplicateBudgetCodes878211=Object.entries(group(budgetRows878211.map(r=>({...r,_integrityKey878211:`${r.cap||""}__${r.codi||""}`})),"_integrityKey878211")).filter(([,items])=>items.length>1);
  const savedSelectedTotal878211=Number(totalActive)||0;
  const integrityDifference878211=total-savedSelectedTotal878211;
  const integrityOk878211=editBudget8760b||(!duplicateBudgetCodes878211.length&&Math.abs(integrityDifference878211)<0.01);

  return <div className="stack">
    {budgetMeasureTarget878194&&<MedicioModal8780 row={(caps?.[budgetMeasureTarget878194.cap]||[])[budgetMeasureTarget878194.i]||{}} contextLabel="PRESSUPOST" initial={((caps?.[budgetMeasureTarget878194.cap]||[])[budgetMeasureTarget878194.i]||{}).pressupostMesures||[]} close={()=>setBudgetMeasureTarget878194(null)} save={saveBudgetMeasures878194}/>} 
    {budgetPartidaView87208&&(()=>{const cap=budgetPartidaView87208.cap;const index=budgetPartidaView87208.index;const row=(caps?.[cap]||[])[index];return row?<PartidaReadingModal87208 row={row} title={`${row.codi||"Partida"} · ${row.concepte||"Sense concepte"}`} editable={editBudget8760b} onChange={(key,value)=>upd(cap,index,key,value)} openBreakdown={()=>{setBudgetPartidaView87208(null);openDescompostModal87173(cap,index)}} close={()=>setBudgetPartidaView87208(null)}/>:null})()}
    <details className="budget-origin-drawer-v87196">
      <summary><span>Origen, importació i altres pressupostos</span><small>Obre només quan vulguis importar, començar de zero o canviar de pressupost</small></summary>
      <div className="budget-origin-content-v87196">
        {budgetGroups?.length>0&&<label><span>Pressupost actiu</span><select value={activeBudgetId} onChange={e=>selectBudget?.(e.target.value)}>{budgetGroups.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}</select><small>{money(totalActive)} · només el pressupost seleccionat</small></label>}
        <div className="budget-origin-actions-v87196"><button type="button" className="secondary" onClick={startManualBudget87115}>+ Manual des de zero</button><label className="secondary upload-label"><Upload/> Importar Excel<input type="file" onChange={importExcel}/></label>{budgetGroups?.length>0&&<><button type="button" className="secondary" onClick={()=>addBudget?.("Imprevist / sobrecost")}>+ Imprevist</button><button type="button" className="secondary" onClick={()=>addBudget?.("Modificat aprovat")}>+ Annex</button></>}</div>
        <details className="excel-help-v8746"><summary>ⓘ Guia per importar Excel correctament</summary><p>Estructura recomanada: A = codi, B = unitat, C = concepte/descripció, E = quantitat, F = preu unitari i G = total.</p></details>
      </div>
    </details>

    <Card title="Pressupost obra per capítols" action={<div className="actions-inline budget-direct-edit-v87211"><span className="budget-grand-total budget-total-right-v87196"><small>Total pressupost seleccionat</small><b>{money(total)}</b></span>{!editBudget8760b?<button type="button" className="primary" onClick={beginBudgetEdit878176}>Editar pressupost</button>:<><button type="button" className="primary" onClick={saveBudget8760b}>Guardar canvis</button><button type="button" className="secondary" onClick={cancelBudget8760b}>Cancel·lar</button></>}</div>}>
      {quickMode&&<div className={`rapid-budget-edit-toolbar-v87204 ${editBudget8760b?"editing":""}`}><div><b>{editBudget8760b?"Edició del pressupost ràpid activada":"Vols modificar quantitats, preus o conceptes?"}</b><span>{editBudget8760b?"Tots els capítols estan oberts i els camps principals són editables directament.":"Prem el botó blau. No cal buscar l’opció dins de cap desplegable."}</span></div><div>{!editBudget8760b?<button type="button" className="primary" onClick={beginBudgetEdit878176}>Editar quantitats i preus</button>:<><button type="button" className="primary" onClick={saveBudget8760b}>Guardar canvis</button><button type="button" className="secondary" onClick={cancelBudget8760b}>Cancel·lar</button></>}</div></div>}
      <div className="budget-simple-toolbar-v87213">
        <label><span>Vista</span><select value={budgetWorkTab878180} onChange={e=>setBudgetWorkTab878180(e.target.value)}><option>Pressupost</option><option>Validar descompostos</option></select></label>
        <ActionMenu87213 label="Més accions">
          {editBudget8760b&&<label className="action-upload-v87213">Importar descompostos<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>importDescompostosMassius878176(e.target.files?.[0])}/></label>}
          <button type="button" onClick={()=>setLibraryOpen87115(v=>!v)}>{libraryOpen87115?"Tancar llibreria":"Obrir llibreria"}</button>
          <button type="button" onClick={saveBudgetDocument878179}>Guardar a Documents</button>
          <button type="button" onClick={()=>openDoc?.(budgetPrintDoc878179())}>Previsualitzar / PDF</button>
          <button type="button" onClick={exportBudgetExcel878180}>Exportar Excel</button>
          <button type="button" onClick={()=>openEmail("Pressupost obra")}><Mail/> Enviar per email</button>
        </ActionMenu87213>
      </div>
      {!integrityOk878211&&<div className="module-note-v8738 budget-integrity-v87211 error"><b>Cal revisar aquest pressupost</b><span>Suma visible {money(total)} · diferència {money(integrityDifference878211)}{duplicateBudgetCodes878211.length?` · ${duplicateBudgetCodes878211.length} codi/s repetit/s`:""}.</span></div>}
      {editBudget8760b&&<div className="budget-edit-help-v87213"><b>Editant pressupost</b><span>Modifica les files. El botó ∑ de cada partida obre els amidaments detallats.</span></div>}
    {libraryOpen87115&&<div className="client-library-panel-v87115">
      <div className="client-library-head-v87115"><div><b>Llibreria única de partides</b><span>{centralLibrary87196.length} partides totals · {libraryItems87115.length} relacionades amb {client?.nom||client?.rao||"aquest client"}</span></div><div className="library-head-actions-v87149"><button type="button" className="secondary small" onClick={()=>{const q=librarySearch87115||prompt("Quina partida o descomposat vols buscar amb IA?","")||"";if(!q)return;const promptTxt=`Busca una partida d'obra o descomposat per: ${q}. Dona'm unitat, descripció curta, descripció llarga, rendiment orientatiu i preu unitari orientatiu per incorporar-ho a la llibreria.`;navigator.clipboard?.writeText(promptTxt);alert("He copiat un prompt de cerca IA al porta-retalls. Enganxa'l a ChatGPT i després incorpora la partida a la llibreria.");}}>Buscar amb IA</button></div></div>
      <div className="library-policy-note-v87199"><b>Una sola llibreria</b><span>El client només és un filtre. Quan afegeixes una partida al pressupost, queda relacionada automàticament amb aquest client.</span></div>
      <div className="client-library-filters-v87115">
        <select value={libraryScope87160} onChange={e=>{setLibraryScope87160(e.target.value);setLibraryCap87115("")}}><option value="all">Tota la llibreria</option><option value="client">Relacionades amb aquest client</option></select>
        <input value={librarySearch87115} onChange={e=>setLibrarySearch87115(e.target.value)} placeholder="Cercar per nom, codi o descripció"/>
        <select value={libraryCap87115} onChange={e=>setLibraryCap87115(e.target.value)}><option value="">Tots els capítols</option>{libraryCaps87115.map(c=><option key={c}>{c}</option>)}</select>
        <select value={libraryTargetCap87115} onChange={e=>setLibraryTargetCap87115(e.target.value)}><option value="">Capítol de destí del pressupost</option>{sortedCapEntries8779(caps).map(([cap])=><option key={cap} value={cap}>{cap}</option>)}</select>
      </div>
      <div className="client-library-list-v87115">{libraryFiltered87115.length===0?<div className="empty-mini-v87115">No hi ha partides amb aquest filtre.</div>:libraryFiltered87115.slice(0,80).map(item=><div className="client-library-row-v87115" key={item.id}>
        <div><strong>{item.concepte}</strong><span>{item.codiIntern} · {item.cap} · {item.ut} · PU {money(item.pu||0)}</span>{item.desc&&<details className="lib-desc-v87117"><summary>Veure descripció llarga</summary><small>{item.desc}</small></details>}<details className="lib-desc-v87117 lib-descompost-v878156"><summary>Descomposat Excel / IA / BEDEC</summary><div className="descompost-import-actions-v87161"><label className="secondary small upload-label">Importar Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>importLibraryDescompost878161(item.id,e.target.files?.[0])}/></label><small>{item.descompostSource?`Origen: ${item.descompostSource}`:"Excel de descomposat de IA, BEDEC, TCQ o base pròpia"}</small></div><textarea value={item.descompost||""} onChange={e=>setLibraryItems87115(prev=>(prev||[]).map(x=>x.id===item.id?{...x,descompost:e.target.value}:x))} placeholder="Materials, rendiments, mà d'obra, mitjans auxiliars..."/></details></div>
        <div className="client-library-row-actions-v87117"><select value={item.cap||"General"} title="Canviar el capítol de la llibreria" onChange={e=>setLibraryItems87115(prev=>(prev||[]).map(x=>x.id===item.id?{...x,cap:e.target.value}:x))}>{sharedLibraryChapters87201.map(c=><option key={c} value={c}>{c}</option>)}</select><button type="button" className="primary small" onClick={()=>addLibraryPartidaToBudget87115(item)}>Afegir al pressupost</button></div>
        <select className="client-library-mobile-action-v87117" defaultValue="" onChange={e=>{const v=e.target.value;e.currentTarget.value="";if(v==="add")addLibraryPartidaToBudget87115(item)}}><option value="" disabled>Accions</option><option value="add">Afegir al pressupost</option></select>
      </div>)}</div>
    </div>}
    {budgetWorkTab878180==="Validar descompostos"?<div className="descompost-validator-v878180"><div className="validator-head-v878180"><div><b>Validació de descompostos</b><span>{descompostValidationRows878180.length} partida/es amb descomposat carregat</span></div><div className="actions-inline"><button type="button" className="secondary" onClick={fillDetectedDescompostos878180}>Carregar preus detectats</button><button type="button" className="primary" onClick={applyAllValidatedDescompostos878180}>Aplicar i guardar</button></div></div>{descompostValidationRows878180.length===0?<Empty text="No hi ha descompostos carregats. En mode edició, obre Més accions i selecciona Importar descompostos."/>:<div className="descompost-validator-table-wrap-v878180"><table className="descompost-validator-table-v878180"><thead><tr><th>Capítol</th><th>Codi</th><th>Concepte</th><th>Total detectat</th><th>PU actual</th><th>PU validat</th><th>Estat</th><th>Acció</th></tr></thead><tbody>{descompostValidationRows878180.map(x=><tr key={`${x.cap}-${x.i}`}><td>{x.cap}</td><td><b>{x.row.codi||"—"}</b></td><td className="text-left"><span>{x.row.concepte}</span><small>{[x.row.descompostSource,x.row.descompostSheet].filter(Boolean).join(" · ")}</small></td><td>{money(x.detected)}</td><td>{money(x.current)}</td><td><input inputMode="decimal" value={x.row.descompostValidatedPu||qty2(x.detected||0)} onChange={e=>setValidatedPu878180(x.cap,x.i,e.target.value)} onBlur={e=>normalizeValidatedPu878180(x.cap,x.i,e.target.value)}/></td><td>{x.row.puFromDescompost?<b className="good-text">Aplicat</b>:<b className="warn-text">Pendent</b>}</td><td><button type="button" className="secondary small" onClick={()=>openDescompostModal87173(x.cap,x.i)}>Obrir</button></td></tr>)}</tbody></table></div>}</div>:<div className={editBudget8760b?"budget-v25":"budget-v25 pressupost-readonly-v8760b"}>
        {Object.entries(caps).length===0&&<Empty text="Sense capítols. Crea un capítol o importa un Excel."/>}
        {sortedCapEntries8779(caps).map(([cap,items])=>{
          const capTotal=items.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
          return <div className="budget-v25-cap" key={cap}>
            <div className="budget-v25-cap-head">
              <button onClick={()=>setOpen(o=>({...o,[cap]:!o[cap]}))}>{open[cap]?"▾":"▸"}</button>
              <input value={capNameDraft8761[cap]??cap} onChange={e=>setCapNameDraft8761(p=>({...p,[cap]:e.target.value}))} onBlur={e=>renameCap(cap,e.target.value)} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur()}}/>
              <span>{items.length} partides</span>
              <strong>{money(capTotal)}</strong>{editBudget8760b&&<button type="button" className="danger small" onClick={()=>deleteCapitol(cap)}>Eliminar capítol</button>}
            </div>

            {open[cap]&&<div className="budget-v25-lines">
              <div className="budget-v25-line head"><span>Codi</span><span>Ut</span><span>Concepte</span><span>Amid.</span><span>Preu/ut</span><span>Total</span><span>{editBudget8760b?"Acció":""}</span></div>
              {sortPartides8779(items).map((r)=>{
                const i=(items||[]).findIndex(x=>x===r);
                const t=(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0);
                const rowOpenV87173=openBudgetRow87173===budgetRowKey87173(cap,i);
                const rowEditableV87204=editBudget8760b&&(quickMode||rowOpenV87173);
                const rowDisplayOpenV87204=rowOpenV87173||(quickMode&&editBudget8760b);
                const measureCount878194=(r.pressupostMesures||[]).length;
                return <div className={`budget-v25-line ${rowDisplayOpenV87204?"budget-row-open-v87173":"budget-row-collapsed-v87173"}`} key={i}>
                  <button type="button" className="budget-partida-mobile-summary-v87196" onClick={()=>toggleBudgetRow87173(cap,i)}><span><b>{r.codi||"Sense codi"}</b><strong>{r.concepte||"Sense concepte"}</strong><small>{r.ut||"ut"} · {qty2(parseNum8770(r.q)||0)} × {money(parseNum8770(r.pu)||0)}</small></span><span><small>Total partida</small><b>{money(t)}</b><em>{rowOpenV87173?"▴":"▾"}</em></span></button>
                  <small className="budget-mobile-field-label-v87196">Codi del pressupost</small>
                  {rowEditableV87204?<input value={r.codi||""} onChange={e=>upd(cap,i,"codi",e.target.value)}/>:<span className="budget-static-cell-v87173">{r.codi||"—"}</span>}
                  <small className="budget-mobile-field-label-v87196">Unitat</small>
                  {rowEditableV87204?<input value={r.ut||""} onChange={e=>upd(cap,i,"ut",e.target.value)}/>:<span className="budget-static-cell-v87173">{r.ut||"—"}</span>}
                  <small className="budget-mobile-field-label-v87196">Concepte i descripció</small>
                  <div className="budget-concept-v877 budget-concept-v87173"><div className="concept-line-v877 concept-line-v87173">{rowEditableV87204?<input value={r.concepte||""} onChange={e=>upd(cap,i,"concepte",e.target.value)}/>:<strong className="budget-concept-summary-v87173">{r.concepte||"Sense concepte"}</strong>}{(quickMode||rowOpenV87173)&&(r.desc||editBudget8760b)&&<button type="button" className="desc-toggle-v877" onClick={()=>setDescOpen875(o=>({...o,[`${cap}-${i}`]:!o[`${cap}-${i}`]}))}>{descOpen875[`${cap}-${i}`]?"Amagar desc.":"Veure desc."}</button>}</div>{(quickMode||rowOpenV87173)&&(r.desc||editBudget8760b)&&descOpen875[`${cap}-${i}`]&&(editBudget8760b?<textarea className="budget-desc-edit-v878156" value={r.desc||""} onChange={e=>upd(cap,i,"desc",e.target.value)} placeholder="Descripció llarga de la partida"/>:<small>{r.desc}</small>)}</div>
                  <small className="budget-mobile-field-label-v87196">Quantitat</small><div className="budget-qty-cell-v878194">{rowEditableV87204?<input type="text" inputMode="decimal" value={r.q??""} onFocus={e=>e.currentTarget.select()} onChange={e=>upd(cap,i,"q",e.target.value)} onBlur={e=>upd(cap,i,"q",qty2(parseNum8770(e.target.value)||0))}/>:<span className="budget-static-cell-v87173 num">{qty2(parseNum8770(r.q)||0)}</span>}{measureCount878194>0&&<small>{r.qFromPressupostMesures?`${measureCount878194} línia${measureCount878194===1?"":"s"} ∑`:`${measureCount878194} línia${measureCount878194===1?"":"s"} guardada${measureCount878194===1?"":"s"}`}</small>}</div>
                  <small className="budget-mobile-field-label-v87196">Preu unitari</small>
                  {rowEditableV87204?<input type="text" inputMode="decimal" value={r.pu??""} onFocus={e=>e.currentTarget.select()} onChange={e=>upd(cap,i,"pu",e.target.value)} onBlur={e=>upd(cap,i,"pu",qty2(parseNum8770(e.target.value)||0))}/>:<span className="budget-static-cell-v87173 num">{qty2(parseNum8770(r.pu)||0)}</span>}
                  <small className="budget-mobile-field-label-v87196">Total de la partida</small>
                  <b>{money(t)}</b>
                  {editBudget8760b&&<select className="budget-partida-action-select-v87196" defaultValue="" onChange={e=>{const v=e.target.value;e.currentTarget.value="";if(v==="toggle")toggleBudgetRow87173(cap,i);if(v==="measure")setBudgetMeasureTarget878194({cap,i});if(v==="desc")setDescOpen875(o=>({...o,[`${cap}-${i}`]:!o[`${cap}-${i}`]}));if(v==="decomp")openDescompostModal87173(cap,i);if(v==="save-library")savePartidaToLibrary87115(r,cap);if(v==="library"){setLibraryOpen87115(true);setLibraryScope87160("all");setLibrarySearch87115("");setLibraryTargetCap87115(cap)}if(v.startsWith("move::"))movePartidaCap878128(cap,i,v.slice(6));if(v==="delete")deletePartida878125(cap,i)}}><option value="" disabled>Accions ▾</option><option value="toggle">{rowOpenV87173?"Tancar edició":"Editar partida"}</option><option value="measure">Introduir amidaments</option><option value="desc">Veure / editar descripció</option><option value="decomp">Veure / editar descompost</option><option value="save-library">Desar a la llibreria general + vincular client</option><option value="library">Buscar a tota la llibreria</option><optgroup label="Moure a un altre capítol">{sortedCapEntries8779(caps).filter(([target])=>target!==cap).map(([target])=><option key={target} value={`move::${target}`}>{target}</option>)}</optgroup><option value="delete">Eliminar del pressupost</option></select>}
                  {editBudget8760b?<div className="budget-line-actions-v878128 budget-line-actions-v87173">
                    <button type="button" className="secondary small" onClick={()=>toggleBudgetRow87173(cap,i)}>{rowOpenV87173?"Tancar partida":"Editar partida"}</button>
                    <button type="button" className="secondary small" onClick={()=>setBudgetMeasureTarget878194({cap,i})}>∑ Amidaments</button>
                    <button type="button" className="secondary small" onClick={()=>openDescompostModal87173(cap,i)}>Descomposat</button>
                    {rowOpenV87173&&<><select value={cap} title="Canviar de capítol" onChange={e=>movePartidaCap878128(cap,i,e.target.value)}>{sortedCapEntries8779(caps).map(([c])=><option key={c} value={c}>{c}</option>)}</select><button type="button" className="secondary small" onClick={()=>savePartidaToLibrary87115(r,cap)}>Desar a llibreria general</button><button type="button" className="secondary small" onClick={()=>{setLibraryOpen87115(true);setLibraryScope87160("all");setLibrarySearch87115("");setLibraryTargetCap87115(cap)}}>Buscar a tota la llibreria</button><button type="button" className="danger small budget-delete-line-v878125" onClick={()=>deletePartida878125(cap,i)}>Eliminar</button></>}
                  </div>:<span/>}
                </div>
              })}
              {editBudget8760b&&<button className="secondary add-line-btn" onClick={()=>addPartida(cap)}>+ Afegir partida</button>}
            </div>}
          </div>
        })}
        {editBudget8760b&&<button type="button" className="primary add-chapter-bottom-v8779" onClick={addCapitol}><Plus/> Nou capítol</button>}
      </div>}
      {descompostModal87173&&(()=>{
        const cap=descompostModal87173.cap;
        const i=descompostModal87173.i;
        const row=(caps?.[cap]||[])[i]||{};
        const table=row.descompostTable||null;
        const detected=descompostTableTotal878174(table)||descompostTotal878160(row.descompost||"");
        const updateTableCell=(rowIdx,key,value)=>{
          const nextRows=[...((table?.rows)||[])];
          const current={...(nextRows[rowIdx]||{})};
          current[key]=value;
          if(["q","pu"].includes(key)){
            const q=parseNum8770(key==="q"?value:current.q);
            const pu=parseNum8770(key==="pu"?value:current.pu);
            if(q&&pu)current.total=qty2(q*pu);
          }
          nextRows[rowIdx]=current;
          const nextTable={...(table||{source:row.descompostSource||"Descomposat",title:""}),rows:nextRows};
          upd(cap,i,"descompostTable",nextTable);
          upd(cap,i,"descompost",descompostTableToText878174(nextTable));
        };
        return <Modal title={`Descomposat · ${row.codi||""} ${row.concepte||""}`} close={()=>setDescompostModal87173(null)}>
          <div className="descompost-modal-v87173 descompost-modal-v87174">
            <div className="descompost-modal-head-v87173">
              <label className="secondary upload-label">Importar Excel descomposat<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>importDescompostExcel878161(cap,i,e.target.files?.[0])}/></label>
              <span>{row.descompostSource?`Origen: ${row.descompostSource}${row.descompostSheet?` · ${row.descompostSheet}`:""}`:"Excel IA / BEDEC / TCQ / base pròpia"}</span>
            </div>
            <div className="descompost-modal-grid-v87173">
              <label><span>Total detectat</span><b>{money(detected)}</b></label>
              <label><span>Preu/ut validat</span><input inputMode="decimal" value={row.descompostValidatedPu||qty2(detected||parseNum8770(row.pu)||0)} onChange={e=>upd(cap,i,"descompostValidatedPu",e.target.value)} onBlur={e=>upd(cap,i,"descompostValidatedPu",qty2(parseNum8770(e.target.value)||0))}/></label>
              <label><span>Preu actual partida</span><b>{money(parseNum8770(row.pu)||0)}</b></label>
            </div>
            {table?.rows?.length?<div className="descompost-excel-wrap-v87174">
              {table.title&&<div className="descompost-title-v87174">{table.title}</div>}
              <table className="descompost-excel-table-v87174"><thead><tr><th>Concepte</th><th>Unitat</th><th>Rendiment</th><th>Preu/Ut</th><th>Preu total</th></tr></thead><tbody>{table.rows.map((tr,idx)=>tr.isSection?<tr key={tr.id||idx} className="descompost-section-v87174"><td colSpan="5"><input value={tr.concepte||""} onChange={e=>updateTableCell(idx,"concepte",e.target.value)}/></td></tr>:<tr key={tr.id||idx}><td><input value={tr.concepte||""} onChange={e=>updateTableCell(idx,"concepte",e.target.value)}/></td><td><input value={tr.ut||""} onChange={e=>updateTableCell(idx,"ut",e.target.value)}/></td><td><input inputMode="decimal" value={tr.q||""} onChange={e=>updateTableCell(idx,"q",e.target.value)}/></td><td><input inputMode="decimal" value={tr.pu||""} onChange={e=>updateTableCell(idx,"pu",e.target.value)}/></td><td><input inputMode="decimal" value={tr.total||""} onChange={e=>updateTableCell(idx,"total",e.target.value)}/></td></tr>)}</tbody><tfoot><tr><th colSpan="4">PREU UNITARI FINAL / TOTAL DETECTAT</th><th>{money(detected)}</th></tr></tfoot></table>
            </div>:<label className="descompost-textarea-v87173"><span>Quadre editable del descomposat</span><textarea value={row.descompost||""} onChange={e=>upd(cap,i,"descompost",e.target.value)} placeholder="Importa l'Excel o enganxa aquí el descomposat. Revisa'l abans d'aplicar el preu."/></label>}
          </div>
          <div className="modal-actions"><button className="secondary" onClick={()=>setDescompostModal87173(null)}>Tancar</button><button className="secondary" onClick={()=>savePartidaToLibrary87115({...row,descompost:row.descompost||"",descompostTable:row.descompostTable||null},cap)}>Guardar a llibreria</button><button className="primary" onClick={()=>applyDescompostToPartida878160(cap,i)}>Aplicar preu validat a la partida</button></div>
        </Modal>
      })()}
    </Card>
  </div>
}










function medicioCalc8780(line,ut=""){
  const has=(k)=>line?.[k]!==undefined && String(line?.[k]??"").trim()!=="";
  const num=(k,def=0)=>{const v=parseNum8770(line?.[k]);return Number.isFinite(v)?v:def};
  const hasDimensions=has("unitats")||has("llargada")||has("amplada")||has("alcada");
  if(!hasDimensions){
    for(const key of ["total","quantitat","q","resultat","medicio","amidament"]){
      if(has(key))return num(key,0);
    }
  }
  const u=num("unitats",1)||0;
  const l=num("llargada",0), a=num("amplada",0), h=num("alcada",0);
  const unit=String(ut||"").toLowerCase();
  const lF=has("llargada")?l:1, aF=has("amplada")?a:1, hF=has("alcada")?h:1;
  if(unit.includes("m3")||unit.includes("m³"))return u*lF*aF*hF;
  if(unit.includes("m2")||unit.includes("m²"))return u*lF*aF;
  if(unit.includes("ml")||unit==="m")return u*lF;
  // Si és una partida genèrica però s'han emplenat dimensions, també multiplica els camps introduïts.
  if(has("llargada")||has("amplada")||has("alcada"))return u*lF*aF*hF;
  return has("unitats")?u:0;
}
function medicioTotal8780(lines=[],ut=""){return (lines||[]).reduce((s,l)=>s+medicioCalc8780(l,ut),0)}
function MedicioModal8780({row,certNum,contextLabel,initial=[],close,save}){
  const [lines,setLines]=useState((initial&&initial.length?initial:[{id:"m-"+Date.now(),concepte:"",unitats:"1",llargada:"",amplada:"",alcada:""}]).map(x=>({...x,id:x.id||("m-"+Date.now()+"-"+Math.random())})));
  function upd(id,k,v){setLines(p=>p.map(l=>l.id===id?{...l,[k]:v}:l))}
  function add(){setLines(p=>[...p,{id:"m-"+Date.now()+"-"+p.length,concepte:"",unitats:"1",llargada:"",amplada:"",alcada:""}])}
  function del(id){setLines(p=>p.filter(l=>l.id!==id))}
  const total=medicioTotal8780(lines,row?.ut);
  const context=contextLabel||(certNum?`CERT. ${certNum}`:"AMIDAMENT");
  return <Modal title={`Línies de medició · ${row?.codi||""} · ${context}`} close={close}>
    <div className="medicio-modal-v8780">
      <div className="module-note-v8738"><b>{row?.concepte}</b><span>Pots mantenir la quantitat directa o calcular-la amb línies tipus Presto: unitats × llargada × amplada × alçada segons la unitat o els camps emplenats.</span></div>
      <div className="table-wrap"><table className="medicio-table-v8780"><thead><tr><th>Concepte</th><th>Unitats</th><th>Llargada</th><th>Amplada</th><th>Alçada</th><th>Total línia</th><th></th></tr></thead><tbody>
        {lines.map(l=><tr key={l.id}><td><input value={l.concepte||""} onChange={e=>upd(l.id,"concepte",e.target.value)} placeholder="Ex: façana principal"/></td><td><input inputMode="decimal" value={l.unitats||""} onChange={e=>upd(l.id,"unitats",e.target.value)}/></td><td><input inputMode="decimal" value={l.llargada||""} onChange={e=>upd(l.id,"llargada",e.target.value)}/></td><td><input inputMode="decimal" value={l.amplada||""} onChange={e=>upd(l.id,"amplada",e.target.value)}/></td><td><input inputMode="decimal" value={l.alcada||""} onChange={e=>upd(l.id,"alcada",e.target.value)}/></td><td><b>{qty2(medicioCalc8780(l,row?.ut))}</b></td><td><button className="danger small" onClick={()=>del(l.id)}>Eliminar</button></td></tr>)}
      </tbody><tfoot><tr><th colSpan="5">TOTAL AMIDAMENT ({row?.ut||"ut"})</th><th>{qty2(total)}</th><th></th></tr></tfoot></table></div>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={add}>+ Afegir línia</button><button className="secondary" onClick={close}>Cancel·lar</button><button className="primary" onClick={()=>save(lines,total)}>Guardar línies i aplicar total</button></div>
  </Modal>
}

function adminLineTotal878126(l){
  const ho=parseNum8770(l.horesOficial)||0, hp=parseNum8770(l.horesPeo)||0;
  const co=parseNum8770(l.costOficial)||0, cp=parseNum8770(l.costPeo)||0, mat=parseNum8770(l.material)||0;
  return ho*co + hp*cp + mat;
}
function adminTotal878126(lines=[]){return (lines||[]).reduce((s,l)=>s+adminLineTotal878126(l),0)}
function AdminCostModal878126({row,certNum,initial=[],close,save}){
  const cfgKey=lsKey8779("aco_admin_cost_defaults_v87126");
  const defaults=(()=>{try{return JSON.parse(localStorage.getItem(cfgKey)||"{}")}catch{return {}}})();
  const defaultOficial=String(defaults.costOficial??"27");
  const defaultPeo=String(defaults.costPeo??"18");
  const [lines,setLines]=useState((initial&&initial.length?initial:[{id:"adm-"+Date.now(),concepte:"",data:todayISO8743(),horesOficial:"",horesPeo:"",costOficial:defaultOficial,costPeo:defaultPeo,material:""}]).map(x=>({...x,id:x.id||("adm-"+Date.now()+"-"+Math.random()),costOficial:x.costOficial??defaultOficial,costPeo:x.costPeo??defaultPeo})));
  function upd(id,k,v){setLines(p=>p.map(l=>l.id===id?{...l,[k]:v}:l))}
  function add(){setLines(p=>[...p,{id:"adm-"+Date.now()+"-"+p.length,concepte:"",data:todayISO8743(),horesOficial:"",horesPeo:"",costOficial:defaultOficial,costPeo:defaultPeo,material:""}])}
  function del(id){setLines(p=>p.filter(l=>l.id!==id))}
  function saveAndClose(){
    const first=lines.find(l=>String(l.costOficial||"").trim()||String(l.costPeo||"").trim());
    try{localStorage.setItem(cfgKey,JSON.stringify({costOficial:first?.costOficial||defaultOficial,costPeo:first?.costPeo||defaultPeo}))}catch{}
    save(lines,total);
  }
  const total=adminTotal878126(lines);
  return <Modal title={`Cost per administració · ${row?.codi||""} · CERT. ${certNum}`} close={close}>
    <div className="admin-modal-v878126">
      <div className="module-note-v8738"><b>{row?.concepte}</b><span>Per partides tipus ajudes a industrials o administració: concepte, dia, hores d’oficials/peons, cost hora i material. El total es passa a la certificació actual.</span></div>
      <div className="table-wrap"><table className="admin-table-v878126"><thead><tr><th>Concepte ajuda</th><th>Dia</th><th>Oficials (h)</th><th>Cost h oficial</th><th>Peons (h)</th><th>Cost h peó</th><th>Material</th><th>Total</th><th></th></tr></thead><tbody>
        {lines.map(l=><tr key={l.id}><td><input value={l.concepte||""} onChange={e=>upd(l.id,"concepte",e.target.value)} placeholder="Ex: estintolament cuina"/></td><td><input type="date" value={toInputDate8743(l.data||todayISO8743())} onChange={e=>upd(l.id,"data",e.target.value)}/></td><td><input inputMode="decimal" value={l.horesOficial||""} onChange={e=>upd(l.id,"horesOficial",e.target.value)}/></td><td><input inputMode="decimal" value={l.costOficial||""} onChange={e=>upd(l.id,"costOficial",e.target.value)}/></td><td><input inputMode="decimal" value={l.horesPeo||""} onChange={e=>upd(l.id,"horesPeo",e.target.value)}/></td><td><input inputMode="decimal" value={l.costPeo||""} onChange={e=>upd(l.id,"costPeo",e.target.value)}/></td><td><input inputMode="decimal" value={l.material||""} onChange={e=>upd(l.id,"material",e.target.value)}/></td><td><b>{money(adminLineTotal878126(l))}</b></td><td><button className="danger small" onClick={()=>del(l.id)}>Eliminar</button></td></tr>)}
      </tbody><tfoot><tr><th colSpan="7">TOTAL COST PER ADMINISTRACIÓ</th><th>{money(total)}</th><th></th></tr></tfoot></table></div>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={add}>+ Afegir línia</button><button className="secondary" onClick={close}>Cancel·lar</button><button className="primary" onClick={saveAndClose}>Guardar cost i aplicar a certificació</button></div>
  </Modal>
}


// V87.127 · Quadre mensual d'administració independent de la graella de certificació.
// No deforma la taula: es gestiona amb un botó superior i crea una sola partida certificable 1 ut × total.
function escapeHtml878131(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]||ch))}
function adminMaterialSum878131(l){
  const mats=Array.isArray(l?.materials)?l.materials:[];
  if(mats.length)return mats.reduce((s,m)=>s+(parseNum8770(m.import)||0),0);
  return parseNum8770(l?.material)||0;
}
function adminConceptKey878131(v){return String(v||"Sense concepte").trim()||"Sense concepte"}
function printAdminMonthly878131({certNum,meta,lines,totalOficial,totalAjudant,totalMaterial,total,lineTotal}){
  const rows=Array.isArray(lines)?lines:[];
  const groups={};
  rows.forEach(l=>{
    const k=adminConceptKey878131(l.concepte);
    if(!groups[k])groups[k]={concepte:k,horesOficial:0,horesAjudant:0,material:0,total:0};
    groups[k].horesOficial+=parseNum8770(l.horesOficial)||0;
    groups[k].horesAjudant+=parseNum8770(l.horesAjudant)||0;
    groups[k].material+=adminMaterialSum878131(l);
    groups[k].total+=lineTotal(l);
  });
  const materialGroups={};
  rows.forEach(l=>{
    const mats=Array.isArray(l.materials)?l.materials:[];
    mats.forEach(m=>{
      const k=adminConceptKey878131(m.concepte);
      if(!materialGroups[k])materialGroups[k]=0;
      materialGroups[k]+=parseNum8770(m.import)||0;
    });
  });
  const css=`<style>body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:28px}h1{font-size:20px;margin:0 0 6px}h2{font-size:15px;margin:22px 0 8px}.sub{color:#475569;margin-bottom:18px}.box{border:1px solid #94a3b8;padding:10px;margin:8px 0 14px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #111827;padding:5px 6px;text-align:right;vertical-align:top}th{background:#93c5fd;text-align:center;font-weight:900}.left{text-align:left}tfoot th,tfoot td{background:#eef2ff;font-weight:900}.materials{font-size:10px;color:#334155;margin-top:3px;line-height:1.25}@page{size:A4 landscape;margin:10mm}@media print{button{display:none}}</style>`;
  const detail=rows.map(l=>`<tr><td class="left">${escapeHtml878131(l.concepte)}</td><td>${escapeHtml878131(l.data)}</td><td>${qty2(parseNum8770(l.horesOficial)||0)}</td><td>${qty2(parseNum8770(l.horesAjudant)||0)}</td><td>${money(adminMaterialSum878131(l))}${(Array.isArray(l.materials)&&l.materials.length)?`<div class="materials">${l.materials.map(m=>`${escapeHtml878131(m.concepte)}: ${money(parseNum8770(m.import)||0)}`).join("<br>")}</div>`:""}</td><td>${money(lineTotal(l))}</td></tr>`).join("");
  const summary=Object.values(groups).map(g=>`<tr><td class="left">${escapeHtml878131(g.concepte)}</td><td>${qty2(g.horesOficial)}</td><td>${qty2(g.horesAjudant)}</td><td>${money(g.material)}</td><td>${money(g.total)}</td></tr>`).join("");
  const mats=Object.entries(materialGroups).map(([k,v])=>`<tr><td class="left">${escapeHtml878131(k)}</td><td>${money(v)}</td></tr>`).join("");
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Quadre administració CERT ${certNum}</title>${css}</head><body><button onclick="window.print()">Imprimir</button><h1>Quadre mensual de feines per administració · Certificació ${certNum}</h1><div class="sub">Capítol: <b>${escapeHtml878131(meta.cap)}</b> · Partida: <b>${escapeHtml878131(meta.targetPartidaCodi||meta.codi)}</b> · ${escapeHtml878131(meta.targetPartidaConcepte||meta.conceptePartida)}</div><div class="box">Cost hora oficial: <b>${money(parseNum8770(meta.costOficial)||0)}</b> · Cost hora ajudant/peó: <b>${money(parseNum8770(meta.costAjudant)||0)}</b></div><h2>Detall justificatiu</h2><table><thead><tr><th class="left">Concepte</th><th>Dia</th><th>Oficial (h)</th><th>Ajudant/peó (h)</th><th>Materials</th><th>Total línia</th></tr></thead><tbody>${detail}</tbody><tfoot><tr><td class="left">TOTAL</td><td></td><td>${qty2(totalOficial)} h</td><td>${qty2(totalAjudant)} h</td><td>${money(totalMaterial)}</td><td>${money(total)}</td></tr></tfoot></table><h2>Resum per concepte</h2><table><thead><tr><th class="left">Concepte</th><th>Oficial (h)</th><th>Ajudant/peó (h)</th><th>Materials</th><th>Total</th></tr></thead><tbody>${summary}</tbody><tfoot><tr><td class="left">TOTAL</td><td>${qty2(totalOficial)} h</td><td>${qty2(totalAjudant)} h</td><td>${money(totalMaterial)}</td><td>${money(total)}</td></tr></tfoot></table>${mats?`<h2>Resum de materials per concepte</h2><table><thead><tr><th class="left">Material</th><th>Import</th></tr></thead><tbody>${mats}</tbody><tfoot><tr><td class="left">TOTAL MATERIALS</td><td>${money(totalMaterial)}</td></tr></tfoot></table>`:""}</body></html>`;
  const w=window.open("","_blank");
  if(!w){alert("El navegador ha bloquejat la finestra d'impressió. Permet pop-ups per imprimir el quadre.");return;}
  w.document.write(html);w.document.close();setTimeout(()=>w.print(),250);
}
function AdminMonthlyCostModal878127({certNum,initial={},close,save,capOptions=[],partidaOptions=[]}){
  const cfgKey=lsKey8779("aco_admin_monthly_defaults_v87127");
  const defaults=(()=>{try{return JSON.parse(localStorage.getItem(cfgKey)||"{}")}catch{return {}}})();
  const defaultCap=initial.cap||"C98 FEINES PER ADMINISTRACIÓ";
  const [meta,setMeta]=useState({
    cap:defaultCap,
    codi:initial.codi||`ADM.${String(certNum).padStart(2,"0")}`,
    conceptePartida:initial.conceptePartida||"AJUDES A INDUSTRIALS / FEINES PER ADMINISTRACIÓ",
    unitat:initial.unitat||"ut",
    costOficial:String(initial.costOficial??defaults.costOficial??"27"),
    costAjudant:String(initial.costAjudant??defaults.costAjudant??"18"),
    targetPartidaCodi:initial.targetPartidaCodi||"",
    targetPartidaConcepte:initial.targetPartidaConcepte||""
  });
  const [lines,setLines]=useState(((initial.lines&&initial.lines.length)?initial.lines:[{id:"adm-m-"+Date.now(),concepte:"",data:todayISO8743(),horesOficial:"",horesAjudant:"",material:"",materials:[]}]).map(x=>({...x,id:x.id||("adm-m-"+Date.now()+"-"+Math.random()),materials:Array.isArray(x.materials)?x.materials:[]})));
  const histKey878131=lsKey8779("aco_admin_monthly_concepts_v87131");
  const matHistKey878131=lsKey8779("aco_admin_monthly_material_concepts_v87131");
  const [conceptHistory878131,setConceptHistory878131]=useState(()=>{try{return JSON.parse(localStorage.getItem(histKey878131)||"[]")}catch{return []}});
  const [materialConceptHistory878131,setMaterialConceptHistory878131]=useState(()=>{try{return JSON.parse(localStorage.getItem(matHistKey878131)||"[]")}catch{return []}});
  const [materialEditId878131,setMaterialEditId878131]=useState(null);
  const conceptDatalistId878131=`admin-concepts-${certNum}`;
  const materialDatalistId878131=`admin-material-concepts-${certNum}`;
  const capList=Array.from(new Set(["C98 FEINES PER ADMINISTRACIÓ",...(capOptions||[]),defaultCap].filter(Boolean)));
  const partidesCap=(partidaOptions||[]).filter(r=>String(r.cap||"").trim()===String(meta.cap||"").trim());
  function updMeta(k,v){setMeta(m=>({...m,[k]:v}))}
  function setCap879129(cap){
    const next=String(cap||"").trim()||"C98 FEINES PER ADMINISTRACIÓ";
    setMeta(m=>({...m,cap:next,targetPartidaCodi:"",targetPartidaConcepte:""}));
  }
  function setPartida879129(codi){
    const code=String(codi||"");
    if(!code){
      setMeta(m=>({...m,targetPartidaCodi:"",targetPartidaConcepte:""}));
      return;
    }
    const r=partidesCap.find(x=>String(x.codi||"")===code);
    if(!r)return;
    const baseCodi=String(r.codi||"").trim();
    // V87.130: si es tria una partida existent, NO es crea cap partida .ADM.
    // El quadre mensual s'aplica directament a aquesta partida i a aquesta certificació.
    setMeta(m=>({
      ...m,
      cap:String(r.cap||m.cap||"C98 FEINES PER ADMINISTRACIÓ"),
      codi:baseCodi || (m.codi||`ADM.${String(certNum).padStart(2,"0")}`),
      conceptePartida:String(r.concepte||"Ajudes a industrials"),
      targetPartidaCodi:baseCodi,
      targetPartidaConcepte:String(r.concepte||"")
    }));
  }
  function upd(id,k,v){setLines(p=>p.map(l=>l.id===id?{...l,[k]:v}:l))}
  function add(){setLines(p=>[...p,{id:"adm-m-"+Date.now()+"-"+p.length,concepte:"",data:todayISO8743(),horesOficial:"",horesAjudant:"",material:"",materials:[]}])}
  function del(id){setLines(p=>p.length>1?p.filter(l=>l.id!==id):p)}
  function materialRows878131(id){return (lines.find(l=>l.id===id)?.materials)||[]}
  function materialTotalLine878131(l){return adminMaterialSum878131(l)}
  function updMaterial878131(id,mid,k,v){setLines(p=>p.map(l=>{if(l.id!==id)return l;const materials=(l.materials||[]).map(m=>m.id===mid?{...m,[k]:v}:m);return {...l,materials,material:String(materials.reduce((s,m)=>s+(parseNum8770(m.import)||0),0))}}))}
  function addMaterial878131(id){setLines(p=>p.map(l=>l.id===id?{...l,materials:[...(l.materials||[]),{id:"mat-"+Date.now()+"-"+Math.random(),concepte:"",import:""}]}:l));setMaterialEditId878131(id)}
  function delMaterial878131(id,mid){setLines(p=>p.map(l=>{if(l.id!==id)return l;const materials=(l.materials||[]).filter(m=>m.id!==mid);return {...l,materials,material:String(materials.length?materials.reduce((s,m)=>s+(parseNum8770(m.import)||0),0):parseNum8770(l.material)||0)}}))}
  function storeHistories878131(nextLines){
    const concepts=Array.from(new Set([...(conceptHistory878131||[]),...(nextLines||[]).map(l=>String(l.concepte||"").trim())].filter(Boolean))).slice(-80);
    const matConcepts=Array.from(new Set([...(materialConceptHistory878131||[]),...(nextLines||[]).flatMap(l=>(l.materials||[]).map(m=>String(m.concepte||"").trim()))].filter(Boolean))).slice(-80);
    setConceptHistory878131(concepts);setMaterialConceptHistory878131(matConcepts);
    try{localStorage.setItem(histKey878131,JSON.stringify(concepts));localStorage.setItem(matHistKey878131,JSON.stringify(matConcepts));}catch{}
  }
  const costOficial=parseNum8770(meta.costOficial)||0;
  const costAjudant=parseNum8770(meta.costAjudant)||0;
  function lineTotal(l){return (parseNum8770(l.horesOficial)||0)*costOficial + (parseNum8770(l.horesAjudant)||0)*costAjudant + materialTotalLine878131(l)}
  const totalOficial=lines.reduce((s,l)=>s+(parseNum8770(l.horesOficial)||0),0);
  const totalAjudant=lines.reduce((s,l)=>s+(parseNum8770(l.horesAjudant)||0),0);
  const totalMaterial=lines.reduce((s,l)=>s+materialTotalLine878131(l),0);
  const total=lines.reduce((s,l)=>s+lineTotal(l),0);
  const materialLine878131=lines.find(l=>l.id===materialEditId878131);
  function saveAndClose(){
    const normalized=lines.map(l=>({...l,material:String(materialTotalLine878131(l))}));
    storeHistories878131(normalized);
    try{localStorage.setItem(cfgKey,JSON.stringify({costOficial:meta.costOficial,costAjudant:meta.costAjudant}))}catch{}
    save({...meta,lines:normalized,total,totalOficial,totalAjudant,totalMaterial});
  }
  function printCurrent878131(){const normalized=lines.map(l=>({...l,material:String(materialTotalLine878131(l))}));storeHistories878131(normalized);printAdminMonthly878131({certNum,meta,lines:normalized,totalOficial,totalAjudant,totalMaterial,total,lineTotal});}
  return <Modal title={`Quadre mensual d’administració · CERT. ${certNum}`} close={close}>
    <div className="admin-monthly-v878127 admin-monthly-v878129">
      <div className="module-note-v8738"><b>Funcionament correcte</b><span>Primer tries el capítol i després la partida. Si tries una partida existent, el quadre s’aplica directament a aquella partida en aquesta certificació, sense crear cap línia nova ni cap codi .ADM. Si no existeix, escrius manualment capítol/codi/nom i llavors es crea una única partida resum reutilitzable.</span></div>
      <div className="admin-target-flow-v878129">
        <label><span>1. Capítol</span><select value={capList.includes(meta.cap)?meta.cap:"__manual__"} onChange={e=>{if(e.target.value==="__manual__")return;setCap879129(e.target.value)}}>
          {capList.map(c=><option key={c} value={c}>{c}</option>)}
          <option value="__manual__">Capítol nou / escrit manualment</option>
        </select></label>
        <label><span>Nom del capítol</span><input value={meta.cap} onChange={e=>setCap879129(e.target.value)} placeholder="Ex: C98 FEINES PER ADMINISTRACIÓ"/></label>
        <label><span>2. Partida de referència dins aquest capítol</span><select value={meta.targetPartidaCodi||""} onChange={e=>setPartida879129(e.target.value)}>
          <option value="">Sense partida concreta · crear/usar partida resum manual</option>
          {partidesCap.map((r,idx)=><option key={`${r.codi||idx}-${idx}`} value={String(r.codi||"")}>{r.codi||"s/codi"} · {r.concepte}</option>)}
        </select><small>{partidesCap.length?`${partidesCap.length} partida/es disponibles en aquest capítol.`:"Aquest capítol encara no té partides; pots crear la partida resum amb els camps següents."}</small></label>
        {meta.targetPartidaCodi&&<div className="admin-existing-note-v878130">S'aplicarà directament a la partida {meta.targetPartidaCodi} · {meta.targetPartidaConcepte}. No es crearà cap partida nova ni codi ADM. L'import aplicat serà exactament el total del quadre; l'app calcula la quantitat equivalent segons el PU de la partida.</div>}
      </div>
      <div className="admin-monthly-config-v878127 admin-monthly-config-v878129">
        <label><span>Codi partida resum</span><input value={meta.codi} onChange={e=>updMeta("codi",e.target.value)} placeholder="Ex: 04.01.ADM"/></label>
        <label className="wide"><span>Nom partida resum</span><input value={meta.conceptePartida} onChange={e=>updMeta("conceptePartida",e.target.value)} placeholder="Ex: Feines per administració mensual"/></label>
        <label><span>Cost hora oficial</span><input inputMode="decimal" value={meta.costOficial} onChange={e=>updMeta("costOficial",e.target.value)}/></label>
        <label><span>Cost hora ajudant / peó</span><input inputMode="decimal" value={meta.costAjudant} onChange={e=>updMeta("costAjudant",e.target.value)}/></label>
      </div>
      <datalist id={conceptDatalistId878131}>{conceptHistory878131.map(c=><option key={c} value={c}/>)}</datalist>
      <datalist id={materialDatalistId878131}>{materialConceptHistory878131.map(c=><option key={c} value={c}/>)}</datalist>
      <div className="table-wrap"><table className="admin-monthly-table-v878127 admin-monthly-table-v878131"><thead><tr><th>Concepte feina</th><th>Dia</th><th>Oficial (h)</th><th>Ajudant / peó (h)</th><th>Materials</th><th>Total línia</th><th></th></tr></thead><tbody>
        {lines.map(l=><tr key={l.id}><td><input list={conceptDatalistId878131} value={l.concepte||""} onChange={e=>upd(l.id,"concepte",e.target.value)} placeholder="Ex: estintolament cuina - terrassa"/></td><td><input type="date" value={toInputDate8743(l.data||todayISO8743())} onChange={e=>upd(l.id,"data",e.target.value)}/></td><td><input inputMode="decimal" value={l.horesOficial||""} onChange={e=>upd(l.id,"horesOficial",e.target.value)}/></td><td><input inputMode="decimal" value={l.horesAjudant||""} onChange={e=>upd(l.id,"horesAjudant",e.target.value)}/></td><td><div className="admin-material-cell-v878131"><input inputMode="decimal" value={String(materialTotalLine878131(l)||"")} onChange={e=>upd(l.id,"material",e.target.value)} disabled={(l.materials||[]).length>0}/><button type="button" className="secondary small" onClick={()=>{setMaterialEditId878131(l.id);if(!(l.materials||[]).length)addMaterial878131(l.id)}}>{(l.materials||[]).length?`${(l.materials||[]).length} materials`:"Desglossar"}</button></div></td><td><b>{money(lineTotal(l))}</b></td><td><button type="button" className="danger small" onClick={()=>del(l.id)}>Eliminar</button></td></tr>)}
      </tbody><tfoot><tr><th colSpan="2">TOTALS</th><th>{qty2(totalOficial)} h</th><th>{qty2(totalAjudant)} h</th><th>{money(totalMaterial)}</th><th>{money(total)}</th><th></th></tr></tfoot></table></div>
      {materialLine878131&&<div className="admin-material-panel-v878131"><div className="admin-material-panel-head-v878131"><b>Materials de: {materialLine878131.concepte||"línia sense concepte"}</b><button type="button" className="secondary small" onClick={()=>setMaterialEditId878131(null)}>Tancar materials</button></div><table><thead><tr><th>Concepte material</th><th>Import</th><th></th></tr></thead><tbody>{materialRows878131(materialLine878131.id).map(m=><tr key={m.id}><td><input list={materialDatalistId878131} value={m.concepte||""} onChange={e=>updMaterial878131(materialLine878131.id,m.id,"concepte",e.target.value)} placeholder="Ex: sacs morter, lloguer, runa..."/></td><td><input inputMode="decimal" value={m.import||""} onChange={e=>updMaterial878131(materialLine878131.id,m.id,"import",e.target.value)}/></td><td><button type="button" className="danger small" onClick={()=>delMaterial878131(materialLine878131.id,m.id)}>Eliminar</button></td></tr>)}</tbody><tfoot><tr><th>Total materials</th><th>{money(materialTotalLine878131(materialLine878131))}</th><th></th></tr></tfoot></table><button type="button" className="secondary small" onClick={()=>addMaterial878131(materialLine878131.id)}>+ Afegir material</button></div>}
    </div>
    <div className="modal-actions"><button type="button" className="secondary" onClick={add}>+ Afegir línia</button><button type="button" className="secondary" onClick={printCurrent878131}>Imprimir quadre justificatiu</button><button type="button" className="secondary" onClick={close}>Cancel·lar</button><button type="button" className="primary" onClick={saveAndClose}>Guardar quadre i aplicar 1 ut × total</button></div>
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
const[adminTarget878126,setAdminTarget878126]=useState(null);
const[adminMonthlyOpen878127,setAdminMonthlyOpen878127]=useState(null);
const[certActionOpen878133,setCertActionOpen878133]=useState({});
const[certGlobalActionsOpen878134,setCertGlobalActionsOpen878134]=useState(false);
const[includeMesures8780,setIncludeMesures8780]=useState(false);
const[showHiddenCert878132,setShowHiddenCert878132]=useState(false);
const[extraOpen878125,setExtraOpen878125]=useState(false);
const[extraDraft878125,setExtraDraft878125]=useState({tipus:"modificacio",cap:"",codi:"",ut:"ut",concepte:"",q:"1",pu:"0",desc:""});
const[dateDraft8721,setDateDraft8721]=useState({});
const[dateDraftSafe8720,setDateDraftSafe8720]=useState({});
let cert=certs.find(c=>c.id===selected)||certs.find(c=>+c.numero===2)||certs[0]||null;
let certNum=cert?+cert.numero:1;
let prevNum=certNum>1?certNum-1:0;
let allRows878132=sortPartides878132(data.partides||[]);
let hiddenCount878132=allRows878132.filter(r=>isCertHidden878132(r,certNum)).length;
let rows=allRows878132.filter(r=>showHiddenCert878132||!isCertHidden878132(r,certNum));
let caps=groupSorted878132(rows,"cap");
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
function qFor(r,n){return certQty8783(r,n)}
function qDraft(r){let raw=draft[r.codi]??String(qFor(r,certNum));let q=parseNum8770(raw);return Number.isFinite(q)?q:qFor(r,certNum)}
function imp(r,n){return qFor(r,n)*parseNum8770(r.pu)}
function qOrigin(r){let total=0;for(let i=1;i<=certNum;i++)total+=i===certNum?qDraft(r):qFor(r,i);return total}
function certTotal(n){return rows.reduce((s,r)=>s+(n===certNum?qDraft(r):qFor(r,n))*parseNum8770(r.pu),0)}
function certListTotal878215(c){const calculated=rows.reduce((sum,row)=>sum+qFor(row,+c.numero)*parseNum8770(row.pu),0);return Math.abs(calculated)>0.000001?calculated:parseNum8770(c.import)}
function totalOrigin(){return rows.reduce((s,r)=>s+qOrigin(r)*parseNum8770(r.pu),0)}
function commitOne(codi,v){let val=parseNum8770(v);if(!Number.isFinite(val))val=0;updateCert?.(codi,fieldFor(certNum),val)}
function guardarAmidaments(){Object.entries(draft).forEach(([codi,v])=>commitOne(codi,v));setDraft({});setEditing(false)}
function updatePartidaMeta878132(row,patch){
  if(!row)return;
  const oldCode=String(row.codi||"").trim();
  const rowId=row.id;
  setData?.(d=>{
    const partides=(d.partides||[]).map(r=>{
      const same=rowId?(r.id===rowId):String(r.codi||"").trim()===oldCode;
      return same?{...r,...patch,updatedAt:new Date().toISOString()}:r;
    });
    return {...d,partides,updatedAt:new Date().toISOString()};
  });
  if(patch.codi && patch.codi!==oldCode){setDraft(x=>{const n={...x}; if(n[oldCode]!==undefined){n[patch.codi]=n[oldCode]; delete n[oldCode];} return n;});}
}
function printSavedAdmin878132(payload){
  if(!payload||!(payload.lines||[]).length){alert("No hi ha cap quadre d’administració guardat en aquesta certificació.");return;}
  const lines=(payload.lines||[]).map(l=>({...l,material:String(adminMaterialSum878131(l))}));
  const costOficial=parseNum8770(payload.costOficial)||0;
  const costAjudant=parseNum8770(payload.costAjudant)||0;
  const lineTotal=(l)=>(parseNum8770(l.horesOficial)||0)*costOficial+(parseNum8770(l.horesAjudant)||0)*costAjudant+adminMaterialSum878131(l);
  const totalOficial=lines.reduce((s,l)=>s+(parseNum8770(l.horesOficial)||0),0);
  const totalAjudant=lines.reduce((s,l)=>s+(parseNum8770(l.horesAjudant)||0),0);
  const totalMaterial=lines.reduce((s,l)=>s+adminMaterialSum878131(l),0);
  const total=lines.reduce((s,l)=>s+lineTotal(l),0);
  printAdminMonthly878131({certNum,meta:payload,lines,totalOficial,totalAjudant,totalMaterial,total,lineTotal});
}
const savedAdmin878132=(data.certAdminMonthlyByNum||{})[String(certNum)]||rows.map(r=>(r.certAdminMonthlyByNum||{})[String(certNum)]).find(Boolean)||null;
function pc(q,r){return (+r.q||0)?q/(+r.q)*100:0}
function saveMesures8780(target,lines,total){
  const targetId=target?.id;
  const targetCode=String(target?.codi||"");
  const targetCap=String(target?.cap||"");
  setData?.(d=>({...d,partides:(d.partides||[]).map(r=>{
    const same=targetId?r.id===targetId:(String(r.codi||"")===targetCode&&String(r.cap||"")===targetCap);
    return same?{...r,certMesuresByNum:{...(r.certMesuresByNum||{}),[String(certNum)]:lines},certsByNum:{...(r.certsByNum||{}),[String(certNum)]:total},certAnterior:certNum===1?total:r.certAnterior,certActual:certNum===2?total:r.certActual}:r;
  })}));
  setDraft(x=>({...x,[targetCode]:String(total)}));
  setMedicioTarget8780(null);
}
function saveAdminCost878126(codi,lines,total){setData?.(d=>({...d,partides:(d.partides||[]).map(r=>{if(r.codi!==codi)return r;const effectivePu=parseNum8770(r.pu)||1;const certQty=total/effectivePu;return {...r,pu:parseNum8770(r.pu)?r.pu:1,certAdminLinesByNum:{...(r.certAdminLinesByNum||{}),[String(certNum)]:lines},certsByNum:{...(r.certsByNum||{}),[String(certNum)]:certQty},certAnterior:certNum===1?certQty:r.certAnterior,certActual:certNum===2?certQty:r.certActual};})}));const current=(rows||[]).find(r=>r.codi===codi);const effectivePu=parseNum8770(current?.pu)||1;setDraft(x=>({...x,[codi]:String(total/effectivePu)}));setAdminTarget878126(null)}
function saveAdminMonthly878127(payload){
  const key=String(certNum);
  const cap=String(payload.cap||"C98 FEINES PER ADMINISTRACIÓ").trim();
  const total=Number(payload.total)||0;
  const targetCode=String(payload.targetPartidaCodi||"").trim();
  const manualCodi=String(payload.codi||`ADM.${String(certNum).padStart(2,"0")}`).trim();
  const codi=targetCode||manualCodi;
  const concepte=String(payload.conceptePartida||"AJUDES A INDUSTRIALS / FEINES PER ADMINISTRACIÓ").trim();
  const adminData={...payload,codi,cap,conceptePartida:concepte,total,targetPartidaCodi:targetCode,updatedAt:new Date().toISOString()};
  setData?.(d=>{
    const bid=d.activeBudgetIdObra||"principal";
    let found=false;
    let appliedQty=0;
    const partides=(d.partides||[]).map(r=>{
      const sameBudget=(r.budgetId||"principal")===bid;
      const sameTarget=targetCode && sameBudget && String(r.codi||"").trim()===targetCode;
      if(sameTarget){
        found=true;
        const effectivePu=parseNum8770(r.pu) || (total||1);
        appliedQty=effectivePu?total/effectivePu:0;
        return {
          ...r,
          certAdminMonthlyByNum:{...(r.certAdminMonthlyByNum||{}),[key]:adminData},
          certsByNum:{...(r.certsByNum||{}),[key]:appliedQty},
          certAnterior:certNum===1?appliedQty:r.certAnterior,
          certActual:certNum===2?appliedQty:r.certActual,
          updatedAt:new Date().toISOString()
        };
      }
      return r;
    });
    if(!targetCode){
      // Si no hi ha partida existent, es crea o reutilitza UNA partida resum per codi, no una nova cada mes.
      const markerId=`admin-monthly-${bid}-${manualCodi}`;
      for(let i=0;i<partides.length;i++){
        const r=partides[i];
        const same=(r.adminMonthlyId===markerId)||(((r.budgetId||"principal")===bid)&&String(r.codi||"").trim()===manualCodi&&r.adminMonthlyAuto);
        if(same){
          found=true;
          partides[i]={...r,budgetId:bid,adminMonthlyAuto:true,adminMonthlyId:markerId,noPressupost:true,cap,codi:manualCodi,ut:"ut",concepte,desc:`Quadre mensual d’administració. Total CERT. ${certNum}: ${money(total)}`,q:0,pu:total||r.pu||0,certAdminMonthlyByNum:{...(r.certAdminMonthlyByNum||{}),[key]:adminData},certsByNum:{...(r.certsByNum||{}),[key]:total?1:0},certAnterior:certNum===1?(total?1:0):r.certAnterior,certActual:certNum===2?(total?1:0):r.certActual,updatedAt:new Date().toISOString()};
          break;
        }
      }
      if(!found){
        partides.push({id:markerId,budgetId:bid,adminMonthlyAuto:true,adminMonthlyId:markerId,noPressupost:true,cap,codi:manualCodi,ut:"ut",concepte,desc:`Quadre mensual d’administració. Total CERT. ${certNum}: ${money(total)}`,q:0,pu:total,certAdminMonthlyByNum:{[key]:adminData},certsByNum:{[key]:total?1:0},certAnterior:certNum===1?(total?1:0):0,certActual:certNum===2?(total?1:0):0,tipus:"Administració mensual certificable",createdFromCert:certNum,createdAt:new Date().toISOString()});
      }
    }
    return {...d,certAdminMonthlyByNum:{...(d.certAdminMonthlyByNum||{}),[key]:adminData},partides,updatedAt:new Date().toISOString()};
  });
  setCertCapsOpen879(o=>({...o,[cap]:true}));
  // Si s'ha assignat a una partida existent, la quantitat visible és total/PU per no canviar el pressupost base.
  const targetRow=(rows||[]).find(r=>String(r.codi||"").trim()===(targetCode||codi));
  const effectivePu=parseNum8770(targetRow?.pu) || (targetCode ? (total||1) : total);
  setDraft(x=>({...x,[targetCode||codi]:String(targetCode?(effectivePu?total/effectivePu:0):(total?1:0))}));
  setAdminMonthlyOpen878127(null);
}

function deleteCertLine878131(row){
  if(!row)return;
  const code=String(row.codi||"").trim();
  const key=String(certNum);
  const isCertOnly=!!(row.noPressupost||row.createdFromCert||row.adminMonthlyAuto);
  const hasOtherCerts=Object.entries(row.certsByNum||{}).some(([k,v])=>k!==key && (parseNum8770(v)||0)!==0);
  const msg=isCertOnly&&!hasOtherCerts
    ? `Eliminar aquesta partida creada des de certificació?\n${code} ${row.concepte||""}`
    : `Treure aquesta partida de la certificació ${certNum}?\nEs deixarà a 0 en aquesta certificació, però no s'eliminarà del pressupost base.\n${code} ${row.concepte||""}`;
  if(!confirm(msg))return;
  setData?.(d=>{
    const partides=(d.partides||[]).flatMap(r=>{
      if(String(r.codi||"").trim()!==code)return [r];
      if(isCertOnly&&!hasOtherCerts)return [];
      const certsByNum={...(r.certsByNum||{})};delete certsByNum[key];
      const certMesuresByNum={...(r.certMesuresByNum||{})};delete certMesuresByNum[key];
      const certAdminLinesByNum={...(r.certAdminLinesByNum||{})};delete certAdminLinesByNum[key];
      const certAdminMonthlyByNum={...(r.certAdminMonthlyByNum||{})};delete certAdminMonthlyByNum[key];
      const certHiddenByNum={...(r.certHiddenByNum||{}),[key]:true};
      return [{...r,certsByNum,certMesuresByNum,certAdminLinesByNum,certAdminMonthlyByNum,certHiddenByNum,certAnterior:certNum===1?0:r.certAnterior,certActual:certNum===2?0:r.certActual,updatedAt:new Date().toISOString()}];
    });
    return {...d,partides,updatedAt:new Date().toISOString()};
  });
  setDraft(x=>({...x,[code]:"0"}));
}


function restoreCertLine878132(row){
  if(!row)return;
  const code=String(row.codi||"").trim();
  const key=String(certNum);
  setData?.(d=>({
    ...d,
    partides:(d.partides||[]).map(r=>String(r.codi||"").trim()===code?{...r,certHiddenByNum:Object.fromEntries(Object.entries(r.certHiddenByNum||{}).filter(([k])=>k!==key)),updatedAt:new Date().toISOString()}:r),
    updatedAt:new Date().toISOString()
  }));
}

function focusNextCertInput878106(e){
  if(e.key!=="Enter")return;
  e.preventDefault();
  const inputs=[...document.querySelectorAll(".cert-edit-input-v69")];
  const idx=inputs.indexOf(e.currentTarget);
  const next=inputs[idx+1];
  if(next){next.focus();next.select?.();}
}
function capNames878125(){return Object.keys(caps||{}).sort((a,b)=>String(a).localeCompare(String(b),"ca",{numeric:true}))}
function nextCertExtraCode878125(cap){
  const arr=(caps?.[cap]||[]);
  const base=(String(cap||"").match(/(\d+)/)?.[1]||"99").padStart(2,"0");
  let max=arr.reduce((m,r)=>{const mm=String(r.codi||"").match(/\.(\d+)$/);return Math.max(m,mm?+mm[1]:0)},0);
  return `${base}.${String(max+1).padStart(2,"0")}`;
}
function addExtraCertLine878125(){
  const tipus=extraDraft878125.tipus||"modificacio";
  const cap=String(extraDraft878125.cap||capNames878125()[0]||"C99 EXTRES / MODIFICACIONS").trim();
  const isProv=tipus==="provisio";
  const qRaw=parseNum8770(extraDraft878125.q);
  const puRaw=parseNum8770(extraDraft878125.pu);
  const q=Number.isFinite(qRaw)?qRaw:0;
  const pu=Number.isFinite(puRaw)?puRaw:0;
  const concepte=String(extraDraft878125.concepte||"").trim() || (isProv?"Provisió de fons":"Partida extra / modificació");
  if(!q && !isProv)return alert("Indica una quantitat certificada.");
  if(!pu)return alert("Indica el preu unitari o import de la partida.");
  const codi=String(extraDraft878125.codi||nextCertExtraCode878125(cap)).trim();
  const certQty=isProv?1:q;
  const pressQty=isProv?0:q;
  const row={
    id:"extra-cert-"+Date.now(),
    budgetId:data.activeBudgetIdObra||"principal",
    cap,
    codi,
    ut:isProv?"pa":(extraDraft878125.ut||"ut"),
    concepte,
    desc:String(extraDraft878125.desc||"").trim(),
    q:pressQty,
    pu,
    certAnterior:certNum===1?certQty:0,
    certActual:certNum===2?certQty:0,
    certsByNum:{[String(certNum)]:certQty},
    tipus:isProv?"Provisió de fons certificable":"Extra / modificació certificació",
    noPressupost:isProv,
    createdFromCert:certNum,
    createdAt:new Date().toISOString()
  };
  setData?.(d=>({...d,partides:[...(d.partides||[]),row],updatedAt:new Date().toISOString()}));
  setDraft(x=>({...x,[codi]:String(certQty)}));
  setCertCapsOpen879(o=>({...o,[cap]:true}));
  setExtraOpen878125(false);
  setExtraDraft878125({tipus:"modificacio",cap,codi:"",ut:"ut",concepte:"",q:"1",pu:"0",desc:""});
}

function openAdminMonthlyForRow878133(r){
  const saved=(r?.certAdminMonthlyByNum||{})[String(certNum)]||{};
  setAdminMonthlyOpen878127({...saved,cap:r?.cap||saved.cap||"",codi:r?.codi||saved.codi||"",conceptePartida:r?.concepte||saved.conceptePartida||"",targetPartidaCodi:r?.codi||saved.targetPartidaCodi||"",targetPartidaConcepte:r?.concepte||saved.targetPartidaConcepte||""});
}
function openAdminMonthlyNew878133(){setAdminMonthlyOpen878127((data.certAdminMonthlyByNum||{})[String(certNum)]||{});}
return <div className="stack">{adminMonthlyOpen878127&&<AdminMonthlyCostModal878127 certNum={certNum} initial={adminMonthlyOpen878127||{}} capOptions={Object.keys(caps||{})} partidaOptions={rows||[]} close={()=>setAdminMonthlyOpen878127(null)} save={saveAdminMonthly878127}/>}
{medicioTarget8780&&<MedicioModal8780 row={medicioTarget8780} certNum={certNum} initial={(medicioTarget8780.certMesuresByNum||{})[String(certNum)]||[]} close={()=>setMedicioTarget8780(null)} save={(lines,total)=>saveMesures8780(medicioTarget8780,lines,total)}/>}
<Card title={`Certificacions obra realitzades · ${budgetLabel8786(data,data.activeBudgetIdObra||"principal")}`} action={<div className="actions-inline"><button className="secondary" onClick={saveDates8721}>Guardar dates</button><button className="primary" onClick={()=>{addCertificacio?.();setCertMode8711("emplenar")}}>+ Nova certificació</button></div>}>
  <div className="version-list">{certs.length===0?<Empty text="Aquesta obra encara no té certificacions guardades."/>:certs.map(c=><div className={`version-row cert-row-v8721 ${selected===c.id?"active":""}`} key={c.id} onClick={()=>{setSelected(c.id);setCertMode8711("resum")}}><b>Certificació {c.numero}</b><input type="date" className="cert-date-input-v8721" value={toInputDate8743(dateVal8721(c))} onClick={e=>e.stopPropagation()} onFocus={e=>e.stopPropagation()} onChange={e=>setDateDraft8721(d=>({...d,[c.id]:e.target.value}))}/><strong>{money(certListTotal878215(c))}</strong><button className="danger mini-v8721" onClick={e=>{e.stopPropagation();deleteCertificacio8721?.(c.id)}}>Eliminar</button><em>{selected===c.id?"Seleccionada":"Veure"}</em></div>)}</div>
</Card>
<Card title={`Certificació ${certNum}`} action={<div className="cert-selected-total-v87213"><small>{prevNum?`Anterior: Cert. ${prevNum}`:"Primera certificació"}</small><b>{money(certTotal(certNum))}</b></div>}>
  <div className="cert-simple-toolbar-v87213">
    <label><span>Vista</span><select value={certMode8711} onChange={e=>setCertMode8711(e.target.value)}><option value="resum">Resum general</option><option value="emplenar">Partides de la Cert. {certNum}</option></select></label>
    {!editing?<button type="button" className="primary" onClick={()=>{setEditing(true);setCertMode8711("emplenar")}}>Editar certificació</button>:<><button type="button" className="primary" onClick={guardarAmidaments}><Save/> Guardar canvis</button><button type="button" className="secondary" onClick={()=>{setDraft({});setEditing(false)}}>Cancel·lar</button></>}
    <ActionMenu87213 label="Més accions">
      <button type="button" onClick={()=>{setExtraOpen878125(true);setCertMode8711("emplenar")}}>Afegir partida extra / provisió</button>
      <button type="button" onClick={()=>{openAdminMonthlyNew878133();setCertMode8711("emplenar")}}>Afegir hores / administració</button>
      <button type="button" onClick={()=>openDoc({type:"certificacio",autoPrint:true,title:`CERTIFICACIÓ ${certNum}`,subtitle:`Import: ${money(certTotal(certNum))}`,certNum,prevNum,includeMesures:includeMesures8780,agents:data.agents||[],rows:sortPartides878132(rows).map(r=>({...r,qPrev:qFor(r,prevNum),qAct:qDraft(r),qOrigen:qOrigin(r),impOrigen:qOrigin(r)*parseNum8770(r.pu),pctOrigen:pc(qOrigin(r),r),mesures:(r.certMesuresByNum||{})[String(certNum)]||[]})),totalActual:certTotal(certNum),totalOrigen:totalOrigin(),data:fmtDate8714(cert?.data)})}>Previsualitzar / PDF</button>
      <label className="action-check-v87213"><input type="checkbox" checked={includeMesures8780} onChange={e=>setIncludeMesures8780(e.target.checked)}/> Incloure línies d’amidament al PDF</label>
      {savedAdmin878132&&<button type="button" onClick={()=>printSavedAdmin878132(savedAdmin878132)}>Imprimir administració guardada</button>}
      {hiddenCount878132>0&&<button type="button" onClick={()=>setShowHiddenCert878132(v=>!v)}>{showHiddenCert878132?"Amagar partides retirades":"Mostrar partides retirades"} ({hiddenCount878132})</button>}
    </ActionMenu87213>
  </div>
  {editing&&<div className="cert-edit-step-v87213"><b>Editant la Certificació {certNum}</b><span>Introdueix les quantitats a les partides i acaba amb “Guardar canvis”.</span></div>}
  {certMode8711==="resum"&&<CertResumV69 data={data}/>} 
  {extraOpen878125&&<Modal title={`Afegir partida a la Certificació ${certNum}`} close={()=>setExtraOpen878125(false)}><div className="cert-extra-modal-v87213"><p>Escull si és una modificació del pressupost o una provisió que només afecta aquesta certificació.</p><div className="cert-extra-form-v878125"><label><span>Tipus</span><select value={extraDraft878125.tipus} onChange={e=>setExtraDraft878125(x=>({...x,tipus:e.target.value}))}><option value="modificacio">Extra / modificació incorporada al pressupost</option><option value="provisio">Provisió de fons · només certificació</option></select></label><label><span>Capítol</span><select value={extraDraft878125.cap} onChange={e=>setExtraDraft878125(x=>({...x,cap:e.target.value}))}><option value="">Primer capítol / C99</option>{capNames878125().map(c=><option key={c} value={c}>{c}</option>)}<option value="C99 EXTRES / MODIFICACIONS">C99 EXTRES / MODIFICACIONS</option></select></label><label><span>Codi</span><input value={extraDraft878125.codi} onChange={e=>setExtraDraft878125(x=>({...x,codi:e.target.value}))} placeholder="Automàtic"/></label><label><span>Unitat</span><input value={extraDraft878125.ut} onChange={e=>setExtraDraft878125(x=>({...x,ut:e.target.value}))}/></label><label className="wide"><span>Concepte</span><input value={extraDraft878125.concepte} onChange={e=>setExtraDraft878125(x=>({...x,concepte:e.target.value}))} placeholder="Ex: Reforç extra / provisió de fons"/></label><label><span>Quantitat certificada</span><input inputMode="decimal" value={extraDraft878125.q} onChange={e=>setExtraDraft878125(x=>({...x,q:e.target.value}))}/></label><label><span>Preu unitari / import</span><input inputMode="decimal" value={extraDraft878125.pu} onChange={e=>setExtraDraft878125(x=>({...x,pu:e.target.value}))}/></label><label className="wide"><span>Descripció</span><input value={extraDraft878125.desc} onChange={e=>setExtraDraft878125(x=>({...x,desc:e.target.value}))}/></label></div></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setExtraOpen878125(false)}>Cancel·lar</button><button type="button" className="primary" onClick={addExtraCertLine878125}>Afegir partida</button></div></Modal>}
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
      {isOpen&&items.map((r,rowIdx)=>{
        let qp=qFor(r,prevNum), qa=qDraft(r), ip=qp*parseNum8770(r.pu), ia=qa*parseNum8770(r.pu), qo=qOrigin(r), io=qo*parseNum8770(r.pu);
        return <div className="cert-grid-v69 row" key={r.id||`${cap}-${rowIdx}`}>
          <div>{r.codi}</div><div>{r.ut}</div><div className="concept cert-concept-v877 cert-concept-v878133"><div className="concept-line-v877"><span>{r.concepte}</span><button type="button" className="secondary small cert-actions-btn-v878133" onClick={()=>setCertActionOpen878133(o=>({...o,[r.id||r.codi]:!o[r.id||r.codi]}))}>Accions</button></div>{certActionOpen878133[r.id||r.codi]&&<div className="cert-actions-panel-v878133">{r.desc&&<button type="button" className="secondary small" onClick={()=>setCertDescOpen875(o=>({...o,[r.codi]:!o[r.codi]}))}>{certDescOpen875[r.codi]?"Amagar descripció":"Veure descripció"}</button>}{editing&&<button type="button" className="secondary small" onClick={()=>openAdminMonthlyForRow878133(r)}>Quadre administració / justificar</button>}{editing&&<button type="button" className="danger small" onClick={()=>deleteCertLine878131(r)}>{(r.noPressupost||r.createdFromCert||r.adminMonthlyAuto)?"Eliminar partida":"Treure certificació"}</button>}{editing&&isCertHidden878132(r,certNum)&&<button type="button" className="secondary small" onClick={()=>restoreCertLine878132(r)}>Recuperar a certificació</button>}{editing&&<div className="cert-reorder-controls-v878132 cert-reorder-controls-v878133"><label>Codi <input defaultValue={r.codi||""} onBlur={e=>updatePartidaMeta878132(r,{codi:e.target.value})} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur()}}/></label><label>Capítol <select value={r.cap||""} onChange={e=>updatePartidaMeta878132(r,{cap:e.target.value})}>{capNames878125().map(c=><option key={c} value={c}>{c}</option>)}</select></label></div>}</div>}{r.desc&&certDescOpen875[r.codi]&&<small>{r.desc}</small>}</div><div>{qty2(r.q)}</div><div>{money(r.pu)}</div><div>{money((+r.q||0)*parseNum8770(r.pu))}</div>
          <div className={qp>0?"prev-fill":""}>{qty2(qp)}</div><div className={qp>0?"prev-fill":""}>{pct(pc(qp,r))}</div><div className={qp>0?"prev-fill":""}>{money(ip)}</div>
          <div className={qa>0?"current-fill":""}><div className="cert-current-cell-v8780">{editing?<><input className="cert-edit-input-v69" inputMode="decimal" value={draft[r.codi]??String(qFor(r,certNum))} onKeyDown={focusNextCertInput878106} onFocus={e=>e.currentTarget.select()} onChange={e=>setDraft(d=>({...d,[r.codi]:e.target.value}))}/><button type="button" className="measure-btn-v8780" title="Línies de medició" onClick={()=>setMedicioTarget8780(r)}>∑</button></>:qty2(qFor(r,certNum))}</div></div>
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
function impFor(r,n){return qFor(r,n)*parseNum8770(r.pu)}
let capRows=Object.entries(caps).map(([cap,items])=>{
  let pressupost=items.reduce((s,r)=>s+(+r.q||0)*parseNum8770(r.pu),0);
  let vals=certs.map(c=>items.reduce((s,r)=>s+impFor(r,+c.numero),0));
  let total=vals.reduce((s,v)=>s+v,0);
  let pendent=Math.max(pressupost-total,0);
  let percent=pressupost?Math.min(total/pressupost*100,999):0;
  return{cap,pressupost,vals,total,pendent,percent}
});
let totalPres=rows.reduce((s,r)=>s+(+r.q||0)*parseNum8770(r.pu),0);
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
let proformes=(data.certificacions||[]).map(c=>{let rows=rowsForCert(c);let allRows=originRowsForProforma(c);let fin=certFinancialSummary8793(data.partides||[],+c.numero);let base=fin.actual || rows.reduce((s,r)=>s+qFor(r,{numeroCert:c.numero,numero:c.numero})*parseNum8770(r.pu),0);return{...c,pfId:"pf-"+c.numero,numeroCert:c.numero,numero:"PF-"+String(c.numero).padStart(3,"0"),base:base||c.import||0,rows,allRows,certTotals:fin.certTotals,totalOrigen:fin.totalOrigen,anterior:fin.anterior}});
let current=proformes.find(f=>f.pfId===selected)||proformes[0]||null;
function calc(f){let iva=+p(f.pfId,"iva",21),ret=+p(f.pfId,"ret",0),ded=+p(f.pfId,"ded",0),base=f.base*(1-ded/100),ivaImp=base*iva/100,retImp=base*ret/100,total=base+ivaImp-retImp;return{iva,ret,ded,base,ivaImp,retImp,total}}
const basePressupostObra=(data.partides||[]).reduce((s,r)=>s+(+r.q||0)*parseNum8770(r.pu),0);
const totalBaseProformes=proformes.reduce((s,f)=>s+(+f.base||0),0);
const totalProformes=proformes.reduce((s,f)=>s+calc(f).total,0);
const factPct=basePressupostObra?Math.min(totalBaseProformes/basePressupostObra*100,999):0;
function openPrint(f){let c=calc(f);openDoc({type:"proforma",autoPrint:true,title:`Proforma ${f.numero}`,subtitle:`Certificació ${f.numeroCert} · ${fmtDate8714(f.data)}`,proforma:f,agents:data.agents||[],iva:c.iva,ret:c.ret,ded:c.ded,total:c.total,base:c.base,ivaImp:c.ivaImp,retImp:c.retImp})}
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
  <table><thead><tr><th>Partida</th><th>Concepte</th><th>Q origen</th><th>PU</th><th>Total origen</th></tr></thead><tbody>{originRows.map(r=><tr key={r.codi}><td>{r.codi}</td><td className="concept">{r.concepte}</td><td className="num">{qty2(r.qOrigin??originRowsForCert8793([r],f.numeroCert)[0]?.qOrigin??qFor(r,f))}</td><td className="num">{money(r.pu)}</td><td className="num">{money(r.impOrigin??((r.qOrigin??qFor(r,f))*parseNum8770(r.pu)))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL A ORIGEN</th><th className="num">{money(totalOrigen)}</th></tr></tfoot></table>
  <h3>Deducció de certificacions anteriors</h3>
  <table className="totals-preview"><tbody><tr><th>Total certificat a origen</th><td className="num">{money(totalOrigen)}</td></tr>{prevTotals.length===0?<tr><th>No hi ha certificacions anteriors</th><td className="num">{money(0)}</td></tr>:prevTotals.map(c=><tr key={c.n}><th>Deducció Certificació {c.n}</th><td className="num">-{money(c.total)}</td></tr>)}<tr className="total"><th>Import sense IVA Cert. {certNum}</th><td className="num">{money(f.base)}</td></tr></tbody></table>
  <table className="totals-preview"><tbody><tr><th>Deducció ({calc.ded}%)</th><td>-{money(f.base-calc.base)}</td></tr><tr><th>Base imposable</th><td>{money(calc.base)}</td></tr><tr><th>IVA ({calc.iva}%)</th><td>{money(calc.ivaImp)}</td></tr><tr><th>Retenció ({calc.ret}%)</th><td>-{money(calc.retImp)}</td></tr><tr className="total"><th>Total proforma</th><td>{money(calc.total)}</td></tr></tbody></table>
</div></div>
}


function Actes({data,allAgents:globalAgents=[],openActa,openEmail,openDoc,selected,setSelected}){const allAgents=ensureAgents8748(uniqAgents8749([...(globalAgents||[]),...(data.agents||[])]));const[local,setLocal]=useState(data.actes||[]);const[actaDocs,setActaDocs]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_acta_docs"))||"[]"));const[actaPhotos,setActaPhotos]=useState(()=>JSON.parse(localStorage.getItem(lsKey8779("aco_acta_photos"))||"[]"));useEffect(()=>{localStorage.setItem(lsKey8779("aco_acta_docs"),JSON.stringify(actaDocs))},[actaDocs]);useEffect(()=>{localStorage.setItem(lsKey8779("aco_acta_photos"),JSON.stringify(actaPhotos))},[actaPhotos]);let a=local.find(x=>x.id===selected)||local[0];let idx=local.findIndex(x=>x.id===a?.id),prev=idx>0?local[idx-1]:null;function toggleAgent(id,on){setLocal(p=>p.map(x=>x.id===a.id?{...x,agents:on?[...new Set([...x.agents,id])]:x.agents.filter(z=>z!==id)}:x))}function updateText(v){setLocal(p=>p.map(x=>x.id===a.id?{...x,text:v}:x))}function addDocs(e){[...(e.target.files||[])].forEach(f=>setActaDocs(p=>[...p,{id:"ad-"+Date.now()+Math.random(),actaId:a?.id,nom:f.name,tipus:f.name.split(".").pop()?.toUpperCase()||"DOC"}]))}function addPhotos(e){[...(e.target.files||[])].forEach(f=>{let r=new FileReader();r.onload=()=>setActaPhotos(p=>[...p,{id:"ap-"+Date.now()+Math.random(),actaId:a?.id,nom:f.name,url:r.result}]);r.readAsDataURL(f)})}let docs=actaDocs.filter(d=>d.actaId===a?.id),photos=actaPhotos.filter(p=>p.actaId===a?.id);return <div className="actes-layout"><Card title="Actes creades" action={<button className="primary" onClick={openActa}><Plus/> Nova acta</button>}><div className="acta-list">{local.length===0?<Empty text="Encara no hi ha actes creades."/>:local.map(x=><button className={`acta-list-row ${a?.id===x.id?"active":""}`} onClick={()=>setSelected(x.id)}><strong>{x.titol}</strong><span>{x.data}</span><small>{x.agents.map(id=>allAgents.find(ag=>ag.id===id)?.nom).filter(Boolean).join(", ")}</small></button>)}</div></Card>{a&&<Card title={`Visualització / edició · ${a.titol}`} action={<div className="actions-inline"><button className="secondary" onClick={()=>openDoc({type:"acta",title:a.titol,subtitle:a.data,acta:a,agents:allAgents,actaPhotos:photos,actaDocs:docs})}>Obrir document</button><button className="secondary" onClick={()=>openEmail(a.titol)}><Mail/> Enviar Gmail</button></div>}><div className="previous-acta">{prev?<><b>Consideracions de l’acta anterior ({prev.data})</b><label><input type="checkbox"/> Validat / resolt</label><p>{prev.text}</p></>:<p>No hi ha acta anterior.</p>}</div><div className="form-grid"><Input label="Títol acta" defaultValue={a.titol}/><Input label="Data" defaultValue={a.data}/><Input label="Obra" defaultValue={a.obra}/><Input label="Signatura" defaultValue={a.signatura}/><label className="span-all"><span>Assistents / intervinents a l’acta</span><div className="check-grid">{allAgents.map(ag=><label className="check-row"><input type="checkbox" checked={a.agents.includes(ag.id)} onChange={e=>toggleAgent(ag.id,e.target.checked)}/><span>{ag.nom} · {ag.rol}</span></label>)}</div></label><label className="span-all"><span>Observacions / decisions preses</span><textarea value={a.text} onChange={e=>updateText(e.target.value)}/></label></div><div className="upload-grid"><label><Camera/> Afegir fotos<input type="file" multiple accept="image/*" onChange={addPhotos}/></label><label><Paperclip/> Afegir documents<input type="file" multiple onChange={addDocs}/></label><button><PenLine/> Signatura mòbil</button></div><div className="attached-list">{photos.map(p=><span>📷 {p.nom}</span>)}{docs.map(d=><span>📎 {d.nom}</span>)}</div><div className="card-actions"><button className="primary"><Save/> Guardar canvis</button></div></Card>}</div>}


function AgentsObraCard({data,openAgent,setData,libraryAgents=[]}){
const[q,setQ]=useState("");
const[openId,setOpenId]=useState(null);
const[libPick,setLibPick]=useState("");
const[local,setLocal]=useState(()=>sortAgents878134(data.agents||[]));
useEffect(()=>setLocal(sortAgents878134(data.agents||[])),[data.agents]);
const roles=["Promotor / propietat","Constructora / contractista","Direcció d’obra","Direcció d’execució","Direcció d’obra + direcció d’execució","Coordinació S+S","DO + DEO + CSS","Arquitecte","Arquitecte tècnic","Direcció Facultativa","Industrial","Administració","Altres"];
let filtered=sortAgents878134(local).filter(a=>([a.nom,a.rol,a.empresa,a.email,a.telefon,a.nif,a.adreca].join(" ")).toLowerCase().includes(q.toLowerCase()));
const libAvailable=sortAgents878134(libraryAgents||[]).filter(a=>a.nom&&!local.some(x=>String(x.nom||"").toLowerCase()===String(a.nom||"").toLowerCase()));
function commit(next){const sorted=sortAgents878134(next);setLocal(sorted);setData?.(d=>{const prom=primaryPromotorAgent878134(sorted,d?.obra||{},{});const obraPatch=prom?{...(d.obra||{}),promotorAgentId:prom.id||d?.obra?.promotorAgentId||"",propietat:prom.nom||d?.obra?.propietat||"",nifPropietat:prom.nif||d?.obra?.nifPropietat||"",adrecaPropietat:prom.adreca||d?.obra?.adrecaPropietat||"",emailPropietat:prom.email||d?.obra?.emailPropietat||"",telefonPropietat:prom.telefon||d?.obra?.telefonPropietat||""}:(d.obra||{});return {...d,agents:sorted,obra:obraPatch,updatedAt:new Date().toISOString()}});}
function upd(id,k,v){commit(local.map(a=>a.id===id?{...a,[k]:v,updatedAt:new Date().toISOString()}:a))}
function remove(id){if(confirm("Segur que vols eliminar aquest agent d’aquest expedient?"))commit(local.filter(a=>a.id!==id))}
function addLocal(){const ag={id:"agent-"+Date.now(),nom:"Nou agent",rol:"Altres",empresa:"",email:"",telefon:"",nif:"",adreca:"",collegiat:"",contacte:""};commit([ag,...local]);setOpenId(ag.id)}
function addFromLibrary(){const ag=libAvailable.find(a=>a.id===libPick);if(!ag)return;const copy={...ag,id:"agent-obra-"+Date.now(),sourceAgentId:ag.id,updatedAt:new Date().toISOString()};commit([copy,...local]);setLibPick("");setOpenId(copy.id)}
return <Card title="Relació d’agents de l’obra" action={<div className="actions-inline"><button className="secondary" onClick={addLocal}><Plus/> Nou agent obra</button><button className="secondary" onClick={openAgent}><Plus/> Nou agent complet</button></div>}>
<div className="agent-library-add-v878135"><label><span>Afegir agent de la biblioteca</span><select value={libPick} onChange={e=>setLibPick(e.target.value)}><option value="">Selecciona agent existent...</option>{libAvailable.map(a=><option key={a.id} value={a.id}>{a.nom} · {a.rol||"Rol pendent"}</option>)}</select></label><button type="button" className="secondary" disabled={!libPick} onClick={addFromLibrary}>Afegir a aquesta obra</button></div>
<div className="pro-search-line"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtrar agents d’aquesta obra..."/></div>
<div className="agents-accordion-v878133">
{filtered.length===0?<Empty text="No hi ha agents amb aquest filtre."/>:filtered.map(a=>{
const opened=openId===a.id;
return <div className="agent-drawer-v878133" key={a.id}>
<button type="button" className="agent-summary-v878133" onClick={()=>setOpenId(opened?null:a.id)}><b>{a.nom||"Agent sense nom"}</b><span>{a.rol||"Rol pendent"} · {a.empresa||"Empresa pendent"}</span><em>{a.nif?`NIF ${a.nif}`:"NIF pendent"} · {a.telefon||"Sense telèfon"}</em></button>
{opened&&<div className="agent-detail-v878133">
<label><span>Nom</span><input value={a.nom||""} onChange={e=>upd(a.id,"nom",e.target.value)}/></label>
<label><span>Figura / rol a l’obra</span><select value={a.rol||"Altres"} onChange={e=>upd(a.id,"rol",e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select></label>
<label><span>Empresa / autònom</span><input value={a.empresa||""} onChange={e=>upd(a.id,"empresa",e.target.value)}/></label>
<label><span>NIF / CIF</span><input value={a.nif||""} onChange={e=>upd(a.id,"nif",e.target.value)} placeholder="NIF, CIF o DNI"/></label>
<label><span>Email</span><input value={a.email||""} onChange={e=>upd(a.id,"email",e.target.value)}/></label>
<label><span>Telèfon</span><input value={a.telefon||""} onChange={e=>upd(a.id,"telefon",e.target.value)}/></label>
<label><span>Núm. col·legiat / registre</span><input value={a.collegiat||""} onChange={e=>upd(a.id,"collegiat",e.target.value)}/></label>
<label className="wide"><span>Adreça</span><input value={a.adreca||""} onChange={e=>upd(a.id,"adreca",e.target.value)}/></label>
<label className="wide"><span>Observacions / contacte</span><input value={a.contacte||""} onChange={e=>upd(a.id,"contacte",e.target.value)}/></label>
<div className="line-actions"><button type="button" className="secondary" onClick={()=>setOpenId(null)}>Tancar</button><button type="button" className="danger" onClick={()=>remove(a.id)}>Eliminar</button></div>
</div>}
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
  const hasBudgetData878193=(data.partides||[]).length>0||(data.pressupostos||[]).length>0||(data.documents||[]).some(d=>d?.docData?.type==="pressupostobra"||/pressupost d['’]obra|pressupost ràpid/i.test(`${d?.nom||""} ${d?.origin||""}`));
  const hasCertData878193=(data.certificacions||[]).length>0||(data.factures||[]).length>0||(data.documents||[]).some(d=>["certificacio","proforma"].includes(d?.docData?.type)||/certificaci[oó]|proforma|facturaci[oó] obra/i.test(d?.nom||""));
  const add=(arr,id,label,desc)=>arr.some(x=>x.id===id)?arr:[...arr,{id,label,desc}];
  let folders=[];
  folders=add(folders,"00_DESPATX_TECNIC","00 · Despatx tècnic / honoraris","Pressupostos d’honoraris, factures del tècnic i documents interns del despatx vinculats a aquest expedient. No és documentació econòmica de l’obra.");
  folders=add(folders,"01_DOCUMENTACIO_PREVIA","01 · Documentació prèvia","Encàrrec, informació rebuda, fitxa inicial, documentació del client i antecedents.");
  if(["Projecte / llicència d’obres","Tràmit municipal / llicència / comunicació","Activitat / adequació de local","Certificat energètic","Cèdula d’habitabilitat","ITE / IEE / inspecció d’edifici","Postobra / documentació final"].includes(tipus)) folders=add(folders,"01_TRAMITS_AJUNTAMENT","01 · Ajuntament / tràmits","Llicències, comunicacions, taxes, requeriments, registre i justificants.");
  if(["Projecte / llicència d’obres","Pressupost d’obra / amidaments","Direcció / seguiment d’obra","Gestió integral d’obra","Plànols / aixecament","Render / 3D / visualització","Activitat / adequació de local","Postobra / documentació final"].includes(tipus)) folders=add(folders,"02_PLANOLS","02 · Plànols","DWG, PDF, aixecaments, as-built, bases gràfiques i plànols marcats.");
  if(hasBudgetData878193||["Projecte / llicència d’obres","Pressupost d’obra / amidaments","Control econòmic d’obra","Gestió integral d’obra"].includes(tipus)) folders=add(folders,"03_AMIDAMENTS_PRESSUPOST_OBRA","03 · Amidaments / pressupost d’obra","Amidaments, pressupost base, descompostos i versions del pressupost d’obra.");
  if(["Pressupost d’obra / amidaments","Control econòmic d’obra","Gestió integral d’obra","Direcció / seguiment d’obra"].includes(tipus)) folders=add(folders,"04_PRESSUPOSTS_INDUSTRIALS","04 · Pressupostos industrials","Ofertes de paleteria, pintura, fusteria, serralleria, instal·lacions, bastida, treballs verticals i comparatius.");
  if(["Projecte / llicència d’obres","Direcció / seguiment d’obra","Gestió integral d’obra","Seguretat i salut"].includes(tipus)) folders=add(folders,"05_SEGURETAT_SALUT","05 · Seguretat i salut","EBSS, ESS, PSS, obertura centre, CSS i documentació preventiva.");
  if(["Direcció / seguiment d’obra","Gestió integral d’obra","Seguretat i salut"].includes(tipus)) folders=add(folders,"06_ACTES_SEGUIMENT","06 · Actes i seguiment","Actes, visites, incidències, ordres de la direcció facultativa i documents de seguiment d’obra.");
  if(["Direcció / seguiment d’obra","Gestió integral d’obra","Seguretat i salut","Control econòmic d’obra"].includes(tipus)) folders=add(folders,"06B_FOTOS_OBRA","06B · Fotos d’obra","Fotografies d’obra, visites, abans/després i justificació gràfica separada de les actes.");
  if(["Projecte / llicència d’obres","Direcció / seguiment d’obra","Gestió integral d’obra","Control econòmic d’obra","Postobra / documentació final"].includes(tipus)) folders=add(folders,"06C_CONTROL_QUALITAT","06C · Control de qualitat","Pla de control, assajos, certificats de materials, fitxes tècniques, garanties i comprovacions de qualitat.");
  if(hasCertData878193||["Direcció / seguiment d’obra","Gestió integral d’obra","Control econòmic d’obra"].includes(tipus)) folders=add(folders,"07_CERTIFICACIONS_FACTURACIO_OBRA","07 · Certificacions / facturació obra","Certificacions, albarans, factures d’obra i documentació econòmica de l’obra.");
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
function budgetDocFromCurrent878189(d){
  const rows=Array.isArray(data?.partides)?data.partides:[];
  const total=rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  return {type:"pressupostobra",title:"PRESSUPOST D’OBRA",numeroPressupost:data?.pressupostRapidNumero||d?.nom||"",referencia:data?.pressupostRapidReferencia||obra?.nom||"",dataPressupost:data?.pressupostRapidData||todayISO8743(),versioPressupost:data?.pressupostRapidVersio||"v01",obraAdreca:data?.pressupostRapidObraAdreca||[obra?.adreca,obra?.codiPostal,obra?.poblacio].filter(Boolean).join(" · "),tercerNom:data?.pressupostRapidTercerNom||obra?.propietat||"",tercerNif:data?.pressupostRapidTercerNif||obra?.nifPropietat||"",tercerAdreca:data?.pressupostRapidTercerAdreca||obra?.adrecaPropietat||"",tercerEmail:data?.pressupostRapidTercerEmail||obra?.emailPropietat||"",realitzadorPressupost:"",clientFinalPressupost:data?.pressupostRapidTercerNom||obra?.propietat||"Client",subtitle:`${rows.length} partides · ${money(total)}`,rows,total,data:d?.data||new Date().toLocaleDateString("ca-ES"),observacions:d?.observacions||data?.pressupostRapidObservacions||"",formaPagament:d?.formaPagament||data?.pressupostRapidFormaPagament||""};
}
function linkedDocumentData878193(d){
  const linkedId=d?.linkedId||String(d?.id||"").replace(/^doc-/,"");
  if(d?.linkedType==="pressupost"||String(d?.nom||"").toLowerCase().includes("pressupost honoraris")){
    const p=(data.pressupostosTecnic||[]).find(x=>String(x.id)===String(linkedId)||String(x.numero||"")&&String(d?.nom||"").includes(String(x.numero)));
    if(p)return {...p,type:"pressuposttecnic",title:`PRESSUPOST D’HONORARIS${p.numero?` · ${p.numero}`:""}`,subtitle:`${p.concepte||"Honoraris tècnics"} · ${money(baseIva8743(p))}`};
  }
  if(d?.linkedType==="factura"||String(d?.nom||"").toLowerCase().includes("factura honoraris")){
    const f=(data.facturesTecnic||[]).find(x=>String(x.id)===String(linkedId)||String(x.numero||"")&&String(d?.nom||"").includes(String(x.numero)));
    if(f)return {...f,type:"facturatecnica",title:`FACTURA / PROFORMA${f.numero?` · ${f.numero}`:""}`,subtitle:`${f.concepte||"Honoraris tècnics"} · ${money(invoiceTotal8746(f))}`};
  }
  return null;
}
async function openOriginal(d){const linked=linkedDocumentData878193(d);if(linked){openDoc?.(linked);return}if(d?.docData){openDoc?.(d.docData);return}if(d?.storage==="generat"&&String(d?.tipus||"").toUpperCase().includes("PRESSUPOST")){openDoc?.(budgetDocFromCurrent878189(d));return}if(d.storage==="supabase"&&d.url){window.open(d.url,"_blank");return}if(d.hasFile){let file=await getDocFile(d.id);if(file){let url=URL.createObjectURL(file);window.open(url,"_blank");return}}openDoc({type:"document",title:d.nom,subtitle:"Document registrat. L’original no està disponible."})}
async function remove(d){if(!confirm("Segur que vols eliminar aquest document d’aquest expedient?"))return;if(d.storage==="supabase"&&d.path) await deleteFromSupabaseStorage(d.path).catch(()=>{});if(d.storage==="indexeddb"||d.hasFile) await deleteDocFile(d.id).catch(()=>{});setDocs(p=>p.filter(x=>x.id!==d.id))}
function moveDoc(d,newFolder){setDocs(p=>p.map(x=>x.id===d.id?{...x,folder:newFolder}:x))}
function sizeTxt(n){return n?((n/1024/1024).toFixed(2)+" MB"):"—"}
function storageLabel(d){if(d.storage==="generat")return "Document generat dins l’app"; if(d.storage==="supabase")return "Original a Supabase Storage"; if(d.storage==="indexeddb")return "Original local IndexedDB"; if(d.hasFile)return "Original local disponible"; return "Registre sense original";}
const generatedDocs878148=[
  ...((data.certificacions||[]).map(c=>{const n=+c.numero||0,prev=Math.max(n-1,0);const rows=sortPartides878132(data.partides||[]).map(r=>{let qOrigen=0;for(let i=1;i<=n;i++)qOrigen+=certQty8783(r,i);return {...r,qPrev:prev?certQty8783(r,prev):0,qAct:certQty8783(r,n),qOrigen,impOrigen:qOrigen*parseNum8770(r.pu),mesures:(r.certMesuresByNum||{})[String(n)]||[]}});const imp=rows.reduce((sum,r)=>sum+(+r.qAct||0)*parseNum8770(r.pu),0)||(+c.import||0);const totalOrigen=rows.reduce((sum,r)=>sum+(+r.qOrigen||0)*parseNum8770(r.pu),0);return {id:`auto-cert-${c.id||c.numero||n}`,auto878148:true,folder:"07_CERTIFICACIONS_FACTURACIO_OBRA",nom:`Certificació ${c.numero||""}`,tipus:"CERTIFICACIÓ",data:c.data||c.date||c.fecha||"—",size:0,import:imp,origen:"Certificacions d’obra",docData:{type:"certificacio",title:`CERTIFICACIÓ ${n}`,subtitle:`Import: ${money(imp)}`,certNum:n,prevNum:prev,includeMesures:false,agents:data.agents||[],rows,totalActual:imp,totalOrigen,data:fmtDate8714(c.data||c.date||c.fecha)}}})),
  ...((data.factures||[]).map(f=>{const base=+f.base||+f.total||0,ded=+f.ded||+f.descompte||0,iva=+f.iva||21,ret=+f.ret||+f.retencio||0,baseImposable=base*(1-ded/100),ivaImp=baseImposable*iva/100,retImp=baseImposable*ret/100,total=+f.total||baseImposable+ivaImp-retImp;return {id:`auto-fac-obra-${f.id||f.numero||Date.now()}`,auto878148:true,folder:"07_CERTIFICACIONS_FACTURACIO_OBRA",nom:`${f.tipus||"Factura / proforma obra"} ${f.numero||""}`.trim(),tipus:String(f.tipus||"FACTURA").toUpperCase(),data:f.data||f.date||f.fecha||"—",size:0,import:total,origen:"Facturació d’obra",docData:{type:"proforma",title:`Proforma ${f.numero||""}`,subtitle:f.data||"",proforma:f,agents:data.agents||[],iva,ret,ded,total,base:baseImposable,ivaImp,retImp}}})),
  ...((data.pressupostosTecnic||[]).map(p=>({id:`auto-pres-tec-${p.id||p.numero||Date.now()}`,auto878148:true,sourceId878193:p.id,folder:"00_DESPATX_TECNIC",nom:`Pressupost honoraris ${p.numero||""}`.trim(),tipus:"PRESSUPOST HONORARIS",data:p.data||"—",size:0,import:baseIva8743(p),origen:"Honoraris tècnics",docData:{...p,type:"pressuposttecnic",title:`PRESSUPOST D’HONORARIS${p.numero?` · ${p.numero}`:""}`}}))),
  ...((data.facturesTecnic||[]).map(f=>({id:`auto-fac-tec-${f.id||f.numero||Date.now()}`,auto878148:true,sourceId878193:f.id,folder:"00_DESPATX_TECNIC",nom:`${f.tipus||"Factura / proforma honoraris"} ${f.numero||""}`.trim(),tipus:String(f.tipus||"HONORARIS").toUpperCase(),data:f.data||f.date||f.fecha||"—",size:0,import:totalFactura878120(f),origen:"Honoraris tècnics",docData:{...f,type:"facturatecnica",title:`FACTURA / PROFORMA${f.numero?` · ${f.numero}`:""}`}})))
].filter(g=>!g.sourceId878193||!docs.some(d=>String(d?.linkedId||"")===String(g.sourceId878193)));
const shown=docs.filter(d=>docFolder(d)===folder);
const shownGenerated878148=generatedDocs878148.filter(d=>docFolder(d)===folder);
const totalDocs=docs.length+generatedDocs878148.length;
return <Card title={`Documents de l’expedient${obra?.nom?` · ${obra.nom}`:""}`} action={<div className="actions-inline"><label className="primary upload-label"><Upload/> Adjuntar a carpeta actual<input type="file" onChange={add}/></label><button className="secondary" onClick={()=>openEmail("Documents expedient")}>Enviar email</button><button className="secondary" onClick={()=>setShowCfg(!showCfg)}>Config. Storage</button></div>}>
  {showCfg&&<div className="storage-config"><b>Configuració opcional Supabase Storage</b><p>Si no configures Storage, els originals es guarden en local IndexedDB d’aquest navegador. Cada document queda vinculat a l’expedient i a una carpeta documental.</p><div className="form-grid no-pad"><label><span>URL Supabase</span><input value={cfg.url} onChange={e=>setCfg({...cfg,url:e.target.value})}/></label><label><span>Anon key</span><input value={cfg.key} onChange={e=>setCfg({...cfg,key:e.target.value})}/></label><label><span>Bucket</span><input value={cfg.bucket} onChange={e=>setCfg({...cfg,bucket:e.target.value})}/></label></div><button className="primary" onClick={saveCfg}>Guardar configuració</button></div>}
  {status&&<div className="doc-status-v38">{status}</div>}
  <div className="documents-pro-v87152">
    <details className="doc-folder-picker-v87152" open>
      <summary><b>Classificació documental</b><span>{activeFolder?.label} · {shown.length+shownGenerated878148.length} docs</span></summary>
      <div className="doc-folder-grid-v87152">{folders.map(f=>{const count=docs.filter(d=>docFolder(d)===f.id).length+generatedDocs878148.filter(d=>docFolder(d)===f.id).length;return <button type="button" key={f.id} className={folder===f.id?"active":""} onClick={()=>setFolder(f.id)}><b>{f.label}</b><span>{count} document{count===1?"":"s"}</span><em>{f.desc}</em></button>})}</div>
    </details>
    <section className="doc-folder-content-v8775 doc-folder-content-pro-v87152"><div className="folder-head-v8775"><div><h3>{activeFolder?.label}</h3><p>{activeFolder?.desc}</p></div><span>{shown.length+shownGenerated878148.length} / {totalDocs} docs</span></div><div className="doc-list-v38">{shown.length+shownGenerated878148.length===0?<Empty text="Aquesta carpeta encara no té documents."/>:<>{shownGenerated878148.map(d=><div className="doc-row-v38 auto-doc-row-v87148" key={d.id}><div><b>{d.nom}</b><span>{d.tipus} · {d.data} · {d.import?money(d.import):"import pendent"} · generat automàticament des de {d.origen}</span><em>Obre el document amb el mateix format que s’utilitzarà per imprimir-lo o guardar-lo en PDF.</em></div><div className="actions-inline"><button className="secondary small" onClick={()=>d.docData?openDoc?.(d.docData):openDoc?.({type:"document",title:d.nom,subtitle:`Document generat des de ${d.origen}.`})}>{d.docData?"Obrir":"Info"}</button></div></div>)}{shown.map(d=><details className="doc-row-v38 doc-row-accordion-v87152" key={d.id}><summary><div><b>{d.nom}</b><span>{d.tipus} · {d.data} · {sizeTxt(d.size)} · {storageLabel(d)}</span>{d.error&&<em>{d.error}</em>}</div></summary><div className="doc-row-actions-v87152"><select value={docFolder(d)} onChange={e=>moveDoc(d,e.target.value)}>{folders.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select><button className="secondary small" onClick={()=>openOriginal(d)}>Obrir</button><button className="danger small" onClick={()=>remove(d)}>Eliminar</button></div></details>)}</>}</div></section>
  </div>
</Card>
}


function dateParts87109(e){
  if(!e||typeof e!="object")return null;
  if(e.iso||e.data||e.date||e.fecha){
    const raw=String(e.iso||e.data||e.date||e.fecha||"");
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

// V87.146 · agenda global sincronitzable entre PC, iPad i mòbil.
// Abans només pujaven clients/obres/odata i les cites creades sense expedient quedaven al navegador local.
function agendaGlobalKeys878146(){return ["aco_agenda_global_v87109","aco_home_notes","aco_obra_notes","aco_agenda_v86"]}
function readGlobalAgenda878146(){
  const out=[];
  agendaGlobalKeys878146().forEach(k=>{
    try{(JSON.parse(localStorage.getItem(lsKey8779(k))||"[]")||[]).forEach((e,i)=>{const c=cleanAgendaEvent87109(e,i);if(c)out.push({...c,sourceKey:k})})}catch{}
  });
  const map=new Map();
  out.forEach(e=>{const sig=String(e.id||"")+"__"+String(e.iso||"")+"__"+String(e.title||"")+"__"+String(e.hora||""); if(!map.has(sig))map.set(sig,e);});
  return [...map.values()].sort((a,b)=>(a.iso+" "+a.hora).localeCompare(b.iso+" "+b.hora));
}
function collectSyncExtras878146(partidaLibrary=null){
  const agenda=readGlobalAgenda878146().map(({sourceKey,...e})=>e).slice(-500);
  const library=dedupePartidaLibrary87196(Array.isArray(partidaLibrary)?partidaLibrary:lsJson8779("aco_partides_library_v87196",[]));
  const libraryChapters=[...new Set(["General",...(lsJson8779("aco_library_chapters_v87201",[])||[]),...library.map(x=>x.cap||"General")].map(x=>libText87196(x)).filter(Boolean))];
  const libraryTrash=(lsJson8779("aco_library_trash_v87203",[])||[]).slice(0,30);
  const libraryIgnored=[...new Set(lsJson8779("aco_library_ignored_v87203",[])||[])].slice(-4000);
  return {agendaGlobal:agenda,partidaLibrary:library,libraryChapters,libraryTrash,libraryIgnored,agendaUpdatedAt:new Date().toISOString(),libraryUpdatedAt:new Date().toISOString()};
}
function restoreSyncExtras878146(meta={}){
  const agenda=(Array.isArray(meta?.agendaGlobal)?meta.agendaGlobal:[]).map(cleanAgendaEvent87109).filter(Boolean);
  if(agenda.length){
    try{localStorage.setItem(lsKey8779("aco_agenda_global_v87109"),JSON.stringify(agenda.slice(-500)));}catch{}
    try{localStorage.setItem(lsKey8779("aco_home_notes"),JSON.stringify(agenda.slice(-500)));}catch{}
  }
  const library=dedupePartidaLibrary87196(Array.isArray(meta?.partidaLibrary)?meta.partidaLibrary:[]);
  if(library.length){try{lsSet8779("aco_partides_library_v87196",JSON.stringify(library))}catch{}}
  const libraryChapters=[...new Set(["General",...(Array.isArray(meta?.libraryChapters)?meta.libraryChapters:[]),...library.map(x=>x.cap||"General")].map(x=>libText87196(x)).filter(Boolean))];
  try{lsSet8779("aco_library_chapters_v87201",JSON.stringify(libraryChapters))}catch{}
  const libraryTrash=Array.isArray(meta?.libraryTrash)?meta.libraryTrash.slice(0,30):[];
  const libraryIgnored=[...new Set(Array.isArray(meta?.libraryIgnored)?meta.libraryIgnored:[])].slice(-4000);
  try{lsSet8779("aco_library_trash_v87203",JSON.stringify(libraryTrash))}catch{}
  try{lsSet8779("aco_library_ignored_v87203",JSON.stringify(libraryIgnored))}catch{}
  return {agenda,partidaLibrary:library,libraryChapters,libraryTrash,libraryIgnored};
}
function mergeOdataWithSyncMeta878146(odata={},partidaLibrary=null){return {...(odata||{}),__syncMeta878146:collectSyncExtras878146(partidaLibrary)}}
function splitOdataSyncMeta878146(raw={}){
  const src=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const meta=src.__syncMeta878146||{};
  const clean={...src}; delete clean.__syncMeta878146;
  return {clean,meta};
}
function Agenda({events=[],clients=[],obres=[],openObra,calM,setCalM,calY,setCalY,selDay,setSelDay,setOdata}){
  const safeClients=Array.isArray(clients)?clients:[];
  const safeObres=Array.isArray(obres)?obres:[];
  const storageKey=lsKey8779("aco_agenda_global_v87109");
  const [local,setLocal]=useState(()=>{try{return (JSON.parse(localStorage.getItem(storageKey)||"[]")||[]).map(cleanAgendaEvent87109).filter(Boolean)}catch{return []}});
  const [selectedId,setSelectedId]=useState("");
  const [formOpen,setFormOpen]=useState(false);
  const today=new Date();
  const m=Number(calM??today.getMonth()), y=Number(calY??today.getFullYear()), dsel=Number(selDay||today.getDate());
  const isoForDay=(day=dsel)=>`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const baseForm=(day=dsel)=>({id:"",data:isoForDay(day),hora:"09:00",title:"",tipus:"Visita d’obra",client:"",obraId:"",adreca:"",detail:""});
  const [form,setForm]=useState(()=>baseForm(dsel));
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(local.slice(-300)))}catch{}},[local,storageKey]);
  const incoming=(Array.isArray(events)?events:[]).map(cleanAgendaEvent87109).filter(Boolean);
  const all=[...incoming,...local].sort((a,b)=>(`${a.year}-${String(a.month).padStart(2,'0')}-${String(a.day).padStart(2,'0')} ${a.hora}`).localeCompare(`${b.year}-${String(b.month).padStart(2,'0')}-${String(b.day).padStart(2,'0')} ${b.hora}`));
  const selected=all.filter(e=>e.day===dsel&&e.month===m&&e.year===y);
  function set(k,v){
    const patch={...form,[k]:v};
    if(k==="obraId"){
      const o=safeObres.find(x=>x.id===v); if(o){const c=safeClients.find(c=>c.id===o.client);patch.client=c?.nom||o.propietat||"";patch.adreca=o.adreca||"";patch.obra=o.nom||"";}
    }
    setForm(patch);
  }
  function chooseDay(day){setSelDay(day);setSelectedId("");setFormOpen(false);setForm(baseForm(day));}
  function edit(e){setSelectedId(e.id);setForm({id:e.id,data:e.iso,hora:e.hora,title:e.title,tipus:e.tipus,client:e.client,obraId:e.obraId||"",adreca:e.adreca,detail:e.detail});setFormOpen(true)}
  function startNew(day=dsel){setSelectedId("");setForm(baseForm(day));setFormOpen(true)}
  function save(){
    const base=cleanAgendaEvent87109({...form,data:form.data,id:form.id||`ag-${Date.now()}`}); if(!base)return;
    const o=safeObres.find(x=>x.id===form.obraId);
    if(o&&setOdata){
      setOdata(prev=>{const d=prev[o.id]||empty();const current=Array.isArray(d.events)?d.events:[];const exists=current.some(x=>String(x.id)===String(base.id));const next=exists?current.map(x=>String(x.id)===String(base.id)?{...x,...base,obraId:o.id,obra:o.nom}:x):[...current,{...base,obraId:o.id,obra:o.nom}];return {...prev,[o.id]:{...d,events:next,updatedAt:new Date().toISOString()}}});
      setLocal(p=>p.filter(x=>x.id!==base.id));
    }else{
      setLocal(p=>p.some(x=>x.id===base.id)?p.map(x=>x.id===base.id?base:x):[...p,base]);
    }
    setSelectedId(base.id);setFormOpen(false);
  }
  function del(){
    if(!form.id)return; if(!confirm("Eliminar aquesta cita / avís?"))return;
    setLocal(p=>p.filter(x=>x.id!==form.id));
    if(setOdata){setOdata(prev=>{const out={...prev};Object.keys(out).forEach(oid=>{const d=out[oid]||{};if(Array.isArray(d.events))out[oid]={...d,events:d.events.filter(e=>String(e.id)!==String(form.id)),updatedAt:new Date().toISOString()};});return out})}
    setForm(baseForm(dsel));setSelectedId("");setFormOpen(false);
  }
  const blanks=first(y,m), total=days(y,m);
  const monthEvents=all.filter(e=>e.month===m&&e.year===y);
  return <div className="agenda-safe-v87109 agenda-mobile-google-v87119"><Card title="Agenda / Calendari" action={<FilterBar8776><label><span>Mes</span><select value={m} onChange={e=>{setCalM(+e.target.value);setFormOpen(false)}}>{months.map((x,i)=><option key={x} value={i}>{x}</option>)}</select></label><label><span>Any</span><select value={y} onChange={e=>{setCalY(+e.target.value);setFormOpen(false)}}>{Array.from({length:11},(_,i)=>2023+i).map(x=><option key={x}>{x}</option>)}</select></label><button type="button" className="secondary agenda-today-v87119" onClick={()=>{const t=new Date();setCalM(t.getMonth());setCalY(t.getFullYear());setSelDay(t.getDate());setFormOpen(false)}}>Avui</button></FilterBar8776>}>
    <div className="agenda-mobile-toolbar-v87119"><button type="button" className="secondary" onClick={()=>m===0?(setCalM(11),setCalY(y-1)):setCalM(m-1)}>‹</button><b>{months[m]} {y}</b><button type="button" className="secondary" onClick={()=>m===11?(setCalM(0),setCalY(y+1)):setCalM(m+1)}>›</button><button type="button" className="primary" onClick={()=>startNew(dsel)}>+ Cita</button></div>
    <div className="agenda-layout-safe-v87109 agenda-layout-v87119"><div className="calendar-grid agenda-calendar-safe-v87109 agenda-calendar-v87119">{["Dl","Dt","Dc","Dj","Dv","Ds","Dg"].map(x=><div className="week" key={x}>{x}</div>)}{Array.from({length:blanks}).map((_,i)=><div className="day blank" key={'b'+i}/>) }{Array.from({length:total}).map((_,i)=>{const day=i+1;const ev=all.filter(e=>e.day===day&&e.month===m&&e.year===y);return <button key={day} className={`day ${dsel===day?"selected":""} ${ev.length?"has-events-v87119":""}`} onClick={()=>chooseDay(day)}><b>{day}</b><em>{ev.length?ev.length:""}</em>{ev.slice(0,2).map(e=><span key={e.id} className={`cal-event ${e.color==="red"?"red":e.color==="orange"?"orange":""}`} onClick={(x)=>{x.stopPropagation();edit(e)}}>{e.hora} · {e.title}</span>)}</button>})}</div>
    <div className="agenda-panel-safe-v87109 agenda-day-panel-v87119"><div className="agenda-panel-head-v87109 agenda-panel-head-v87119"><div><h3>{`Dia ${String(dsel).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`}</h3><span>{selected.length?`${selected.length} cita${selected.length===1?"":"s"}`:"Sense cites"}</span></div><button type="button" className="primary" onClick={()=>startNew(dsel)}>+ Nova cita</button></div>
    {!formOpen&&<div className="agenda-list-safe-v87109 agenda-day-list-v87119">{selected.length===0?<div className="agenda-empty-day-v87119"><b>No hi ha res aquest dia.</b><span>Pots crear una cita, reunió, avís o entrega de documentació.</span><button type="button" className="primary" onClick={()=>startNew(dsel)}>Crear cita aquest dia</button></div>:selected.map(e=><div key={e.id} className={selectedId===e.id?"active agenda-event-card-v87119":"agenda-event-card-v87119"}><button type="button" onClick={()=>edit(e)}><b>{e.title}</b><span>{e.hora} · {e.tipus} · {e.client||"Sense client"}</span><small>{e.obra||"Sense expedient"} {e.adreca?`· ${e.adreca}`:""}</small></button><div><button type="button" className="secondary" onClick={()=>edit(e)}>Veure / editar</button>{e.obraId&&openObra&&<button type="button" className="secondary" onClick={()=>openObra(e.obraId)}>Expedient</button>}</div></div>)}</div>}
    {formOpen&&<div className="agenda-form-safe-v87109 agenda-form-v87119"><div className="agenda-form-title-v87119"><b>{form.id?"Editar cita":"Nova cita"}</b><button type="button" className="secondary" onClick={()=>{setFormOpen(false);setForm(baseForm(dsel));setSelectedId("")}}>Tancar</button></div><label>Data<input type="date" value={form.data} onChange={e=>set("data",e.target.value)}/></label><label>Hora<input type="time" value={form.hora} onChange={e=>set("hora",e.target.value)}/></label><label>Expedient<select value={form.obraId} onChange={e=>set("obraId",e.target.value)}><option value="">Sense vincular</option>{safeObres.map(o=><option key={o.id} value={o.id}>{expedientCode8739(o)} · {o.nom}</option>)}</select></label><label>Títol<input value={form.title} onChange={e=>set("title",e.target.value)}/></label><label>Tipus<select value={form.tipus} onChange={e=>set("tipus",e.target.value)}><option>Visita d’obra</option><option>Reunió</option><option>Pressupost</option><option>Certificació</option><option>Entrega documentació</option><option>Avís</option><option>Altres</option></select></label><label>Client<input list="agenda-clients-v87110" value={form.client||""} onChange={e=>set("client",e.target.value)} placeholder="Nom del client"/><datalist id="agenda-clients-v87110">{safeClients.map(c=><option key={c.id} value={c.nom}/>)}</datalist></label><label>Adreça<input value={form.adreca} onChange={e=>set("adreca",e.target.value)}/></label><label className="span-all">Observacions<textarea value={form.detail} onChange={e=>set("detail",e.target.value)}/></label><div className="agenda-actions-safe-v87109"><button type="button" className="primary" onClick={save}>Guardar cita / canvis</button>{form.id&&<button type="button" className="danger" onClick={del}>Eliminar</button>}{form.obraId&&openObra&&<button type="button" className="secondary" onClick={()=>openObra(form.obraId)}>Obrir expedient</button>}</div></div>}
    </div></div><div className="agenda-month-count-v87119">{monthEvents.length} cites/avisos en aquest mes</div>
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


// V87.121 · sincronització de dades amb Supabase sense dependències externes.
// Manté el localStorage com a base offline i permet pujar/baixar l'estat complet quan Supabase estigui configurat.
function getSyncCfg878121(){
  try{return JSON.parse(localStorage.getItem(lsKey8779("aco_supabase_sync_v87121"))||"{}")||{}}catch{return {}}
}
function saveSyncCfg878121(cfg){
  localStorage.setItem(lsKey8779("aco_supabase_sync_v87121"),JSON.stringify(cfg||{}));
}
function isSyncReady878121(cfg){return !!(cfg?.url&&cfg?.anon&&cfg?.syncKey)}
function syncHeaders878121(cfg,extra={}){
  return {apikey:cfg.anon,Authorization:`Bearer ${cfg.anon}`,"Content-Type":"application/json",...extra};
}
function syncUser878121(user){return String(user||currentAppUser8779()||"hector").trim().toLowerCase()||"hector"}
async function pushStateToSupabase878121(state,user=currentAppUser8779()){
  const cfg=getSyncCfg878121();
  if(!isSyncReady878121(cfg)) throw new Error("Supabase Sync no configurat");
  const app_user=syncUser878121(user);
  const payload={
    app_user,
    sync_key:String(cfg.syncKey),
    device_id:String(cfg.deviceId||"browser-local"),
    clients:stripHeavy878185(state.clients||[]),
    obres:stripHeavy878185(state.obres||[]),
    odata:stripHeavy878104(mergeOdataWithSyncMeta878146(state.odata||{},state.partidaLibrary)),
    app_version:"87.215.0",
    updated_at:new Date().toISOString()
  };
  const base=cfg.url.replace(/\/$/,"");
  const res=await fetch(`${base}/rest/v1/aco_user_state?on_conflict=app_user,sync_key`,{method:"POST",headers:syncHeaders878121(cfg,{Prefer:"resolution=merge-duplicates,return=representation"}),body:JSON.stringify(payload)});
  if(!res.ok) throw new Error(await res.text());
  const out=await res.json().catch(()=>[]);
  localStorage.setItem(lsKey8779("aco_supabase_last_push_v87121"),new Date().toISOString());
  return Array.isArray(out)?out[0]:out;
}
async function pullStateFromSupabase878121(user=currentAppUser8779(),opts={}){
  const cfg=getSyncCfg878121();
  if(!isSyncReady878121(cfg)) throw new Error("Supabase Sync no configurat");
  const app_user=encodeURIComponent(syncUser878121(user));
  const sync_key=encodeURIComponent(String(cfg.syncKey));
  const base=cfg.url.replace(/\/$/,"");
  const res=await fetch(`${base}/rest/v1/aco_user_state?select=*&app_user=eq.${app_user}&sync_key=eq.${sync_key}&order=updated_at.desc&limit=1`,{headers:syncHeaders878121(cfg)});
  if(!res.ok) throw new Error(await res.text());
  const rows=await res.json();
  if(!rows?.length){if(opts.allowMissing)return null;throw new Error("No hi ha cap còpia al núvol per aquest usuari i clau de sincronització.");}
  localStorage.setItem(lsKey8779("aco_supabase_last_pull_v87121"),new Date().toISOString());
  return rows[0];
}
function SupabaseSyncPanel878121({clients=[],obres=[],odata={},partidaLibrary=[],setPartidaLibrary,setClients,setObres,setOdata,authUser}){
  const [cfg,setCfg]=useState(()=>({deviceId:"browser-"+syncUser878121(authUser),...getSyncCfg878121()}));
  const [status,setStatus]=useState("");
  function upd(k,v){setCfg(p=>({...p,[k]:v}))}
  function save(){saveSyncCfg878121(cfg);setStatus("Configuració de sincronització guardada.")}
  async function push(){try{saveSyncCfg878121(cfg);setStatus("Pujant dades locals, agenda i llibreria a Supabase...");await pushStateToSupabase878121({clients,obres,odata,partidaLibrary},authUser);setStatus("Dades pujades correctament a Supabase, incloses l'agenda i la llibreria de partides.")}catch(e){setStatus("Error pujant dades: "+(e?.message||e))}}
  async function pull(){try{saveSyncCfg878121(cfg);setStatus("Carregant última còpia de Supabase...");const row=await pullStateFromSupabase878121(authUser);if(!row)throw new Error("No hi ha cap còpia al núvol amb aquesta clau privada. Primer puja dades locals amb aquesta clau o torna a posar la clau anterior.");const c=sanitizeClients8785(row.clients||[],[]);const o=sanitizeObres8785(row.obres||[],[]);const split=splitOdataSyncMeta878146(row.odata||{});const restored=restoreSyncExtras878146(split.meta);const d=sanitizeOdata8785(split.clean||{},{});setClients?.(c);setObres?.(o);setOdata?.(d);if(restored.partidaLibrary?.length)setPartidaLibrary?.(restored.partidaLibrary);setStatus("Dades carregades del núvol i guardades localment. També s'han restaurat l'agenda i la llibreria. Última còpia: "+(row.updated_at?new Date(row.updated_at).toLocaleString('ca-ES'):'sense data'))}catch(e){setStatus("Error carregant dades: "+(e?.message||e))}}
  async function testSync(){try{saveSyncCfg878121(cfg);setStatus("Comprovant connexió Supabase...");const row=await pullStateFromSupabase878121(authUser,{allowMissing:true});setStatus(row?"Connexió correcta. Còpia trobada del dispositiu "+(row.device_id||'desconegut')+" · "+(row.updated_at?new Date(row.updated_at).toLocaleString('ca-ES'):'sense data'):"Connexió correcta, però no hi ha còpia amb aquesta clau privada.")}catch(e){setStatus("Error de connexió Supabase: "+(e?.message||e))}}
  return <Card title="Supabase Sync · dades de l’app" action={<button className="primary" onClick={save}>Guardar sync</button>}>
    <div className="form-grid supabase-sync-v87121">
      <label><span>Supabase URL</span><input value={cfg.url||""} onChange={e=>upd("url",e.target.value)} placeholder="https://xxxx.supabase.co"/></label>
      <label><span>Anon public key</span><input value={cfg.anon||""} onChange={e=>upd("anon",e.target.value)} placeholder="eyJ..."/></label>
      <label><span>Clau privada de sincronització</span><input value={cfg.syncKey||""} onChange={e=>upd("syncKey",e.target.value)} placeholder="posa una clau llarga teva"/></label>
      <label><span>Dispositiu</span><input value={cfg.deviceId||""} onChange={e=>upd("deviceId",e.target.value)} placeholder="PC despatx / portàtil / iPad"/></label>
      <label><span>Sincronització automàtica</span><select value={cfg.auto?"1":"0"} onChange={e=>upd("auto",e.target.value==="1")}><option value="0">No · només manual</option><option value="1">Sí · pujar canvis automàticament</option></select></label>
      <div className="sync-actions-v87121"><button className="secondary" onClick={testSync}>Comprovar connexió</button><button className="secondary" onClick={push}>Pujar ara dades locals</button><button className="secondary" onClick={pull}>Carregar última còpia del núvol</button></div>
      <p className="span-all module-note-v8738"><b>Important</b><span>Primer executa l’arxiu SQL inclòs a la carpeta <code>supabase/aco_supabase_sync_schema.sql</code>. La sincronització desa clients, expedients i dades internes en una sola taula JSONB i manté l’app funcionant offline.</span></p>
      {status&&<p className="span-all sync-status-v87121">{status}</p>}
    </div>
  </Card>
}

function RecoverySnapshotsPanel878122({setClients,setObres,setOdata,authUser}){
  const user=authUser||currentAppUser8779()||"hector";
  const [rows,setRows]=useState(()=>readRecoverySnapshots878122(user));
  const [status,setStatus]=useState("");
  function reload(){setRows(readRecoverySnapshots878122(user))}
  function restore(snap){
    if(!snap)return;
    if(!confirm(`Restaurar aquesta còpia local?\n\n${snap.label||"Còpia"}\n${fmtRecoveryDate878122(snap.createdAt)}\n\nAbans de restaurar es guardarà una altra còpia de seguretat de l'estat actual.`))return;
    try{
      const current={
        clients:loadUserJson8784("aco_clients",[],user),
        obres:loadUserJson8784("aco_obres",[],user),
        odata:loadUserJson8784("aco_odata",{},user)
      };
      createLocalRecoverySnapshot878122(current,"Abans de restaurar una còpia local",user);
      setClients?.(sanitizeClients8785(snap.clients||[],[]));
      setObres?.(sanitizeObres8785(snap.obres||[],[]));
      setOdata?.(sanitizeOdata8785(snap.odata||{},{}));
      setStatus("Còpia restaurada. Revisa les dades abans de pujar res a Supabase.");
      reload();
    }catch(e){setStatus("Error restaurant còpia: "+String(e?.message||e))}
  }
  function makeManual(){
    const snap=createLocalRecoverySnapshot878122({clients:loadUserJson8784("aco_clients",[],user),obres:loadUserJson8784("aco_obres",[],user),odata:loadUserJson8784("aco_odata",{},user)},"Còpia manual des de Configuració",user);
    setStatus("Còpia manual creada: "+fmtRecoveryDate878122(snap.createdAt));reload();
  }
  return <Card title="Còpies locals de recuperació" action={<div className="actions-inline"><button className="secondary" onClick={makeManual}>Crear còpia ara</button><button className="secondary" onClick={reload}>Actualitzar llista</button></div>}>
    <div className="module-note-v8738"><b>Protecció abans d'importar Excel.</b><span>La V87.122 guarda una còpia local automàtica abans d'una importació Excel o restauració. Això permet tornar enrere si s'ha importat sobre una feina amb certificacions.</span></div>
    <div className="list">{rows.length===0?<Empty text="Encara no hi ha còpies locals de recuperació."/>:rows.slice(0,8).map(s=><div className="doc-row" key={s.id}><div><strong>{s.label||"Còpia local"}</strong><span>{fmtRecoveryDate878122(s.createdAt)} · clients {(s.clients||[]).length} · expedients {(s.obres||[]).length}</span></div><div className="actions-inline"><button className="secondary" onClick={()=>downloadRecoverySnapshot878122(s)}>Exportar</button><button className="primary" onClick={()=>restore(s)}>Restaurar</button></div></div>)}</div>
    {status&&<div className="doc-status-v38">{status}</div>}
  </Card>
}

function Configuracio({clients=[],obres=[],odata={},partidaLibrary=[],setPartidaLibrary,setClients,setObres,setOdata,authUser}){
const key=lsKey8779("aco_config_v60");
const[cfg,setCfg]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||"{}")}catch(e){return {}}});
function upd(k,v){setCfg(p=>({...p,[k]:v}))}
function save(){
  localStorage.setItem(key,JSON.stringify(cfg));
  saveStorageCfg({url:cfg.supabaseUrl||"",anon:cfg.supabaseKey||"",bucket:cfg.bucket||"app-control-obres"});
  alert("Configuració guardada");
}
return <div className="stack">
<PlansModuls8736/>
<DataJsonTools8778 clients={clients} obres={obres} odata={odata}/>
<RecoverySnapshotsPanel878122 setClients={setClients} setObres={setObres} setOdata={setOdata} authUser={authUser}/>
<Card title="Configuració general" action={<button className="primary" onClick={save}><Save/> Guardar configuració</button>}>
  <div className="form-grid">
    <Input label="Email emissor" value={cfg.email||""} onChange={e=>upd("email",e.target.value)} />
    <Input label="Empresa / usuari" value={cfg.empresa||""} onChange={e=>upd("empresa",e.target.value)} />
    <Input label="IVA defecte %" value={cfg.iva||"21"} onChange={e=>upd("iva",e.target.value)} />
    <Input label="Retenció defecte %" value={cfg.retencio||"0"} onChange={e=>upd("retencio",e.target.value)} />
  </div>
</Card>
<SupabaseSyncPanel878121 clients={clients} obres={obres} odata={odata} partidaLibrary={partidaLibrary} setPartidaLibrary={setPartidaLibrary} setClients={setClients} setObres={setObres} setOdata={setOdata} authUser={authUser}/>
<Card title="Supabase Storage · documents i arxius">
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
  function baseFilter(o){return (!client||(o.propietat||o.client||"")===client)&&(!obra||o.id===obra)&&(!tipus||(o.tipusTreball||moduleLabel8737(o))===tipus)}
  function rowsForObra(o){const d=odata[o.id]||empty();return timeRowsForObra878120(o.id,d)}
  const obresFiltered=(obres||[]).filter(baseFilter);
  const all=obresFiltered.flatMap(o=>rowsForObra(o).map(r=>({...r,obra:o,obraNom:o.nom,clientNom:o.propietat||o.client||"Sense client",tipologia:o.tipusTreball||moduleLabel8737(o),data:r.data||isoDate8776(now)})));
  const allPress=obresFiltered.flatMap(o=>((odata[o.id]||empty()).pressupostosTecnic||[]).map(p=>({...p,obra:o,obraNom:o.nom,clientNom:o.propietat||o.client||"Sense client",tipologia:o.tipusTreball||moduleLabel8737(o)})));
  const allFact=obresFiltered.flatMap(o=>uniqueFactures8743(((odata[o.id]||empty()).facturesTecnic||[])).map(f=>({...f,obra:o,obraNom:o.nom,clientNom:o.propietat||o.client||"Sense client",tipologia:o.tipusTreball||moduleLabel8737(o)})));
  const clients=[...new Set((obres||[]).map(o=>o.propietat||o.client).filter(Boolean))];
  const tipologies=[...new Set((obres||[]).map(o=>o.tipusTreball||moduleLabel8737(o)).filter(Boolean))];
  const rows=all.filter(r=>periodFilter8776(r,period,from,to));
  const pressRows=allPress.filter(r=>periodFilter8776(r,period,from,to));
  const factRows=allFact.filter(r=>periodFilter8776(r,period,from,to));
  const totalH=rows.reduce((s,r)=>s+timeHours878120(r),0);
  const totalC=rows.reduce((s,r)=>s+timeImport878120(r),0);
  const pressupostat=pressRows.reduce((s,p)=>s+baseIva8743(p),0);
  const facturatBase=factRows.reduce((s,f)=>s+baseIva8743(f),0);
  const facturatTotal=factRows.reduce((s,f)=>s+totalFactura878120(f),0);
  const cobrat=factRows.filter(f=>statusKeyFactura8776(f.estat)==="cobrades"||f.dataCobrament).reduce((s,f)=>s+totalFactura878120(f),0);
  const pendent=Math.max(facturatTotal-cobrat,0);
  const marge=facturatBase-totalC;
  const byClient=aggregate8776(rows,r=>r.clientNom,timeImport878120);
  const byTipus=aggregate8776(rows,r=>r.tipologia,timeImport878120);
  const byObra=obresFiltered.map(o=>{const d=odata[o.id]||empty();const m=honorMetrics878120(d,o);return {...m,obra:o,clientNom:o.propietat||o.client||"Sense client",tipologia:o.tipusTreball||moduleLabel8737(o)}}).filter(x=>x.pressupostat||x.facturatBase||x.tempsCost||x.hores);
  const max=Math.max(pressupostat,facturatBase,totalC,1);
  return <div className="stack traca-v8776 traca-v878120">
    <Card title="Rendiment global d'honoraris · pressupost, facturació i temps" action={<FilterBar8776><label><span>Període</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="month">Mes en curs</option><option value="week">Setmana actual</option><option value="year">Any actual</option><option value="all">Tot</option><option value="dates">Dates</option></select></label>{period==="dates"&&<><label><span>Des de</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label><span>Fins</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}<label><span>Client</span><select value={client} onChange={e=>setClient(e.target.value)}><option value="">Tots</option>{clients.map(c=><option key={c}>{c}</option>)}</select></label><label><span>Obra</span><select value={obra} onChange={e=>setObra(e.target.value)}><option value="">Totes</option>{(obres||[]).map(o=><option key={o.id} value={o.id}>{o.nom}</option>)}</select></label><label><span>Tipologia</span><select value={tipus} onChange={e=>setTipus(e.target.value)}><option value="">Totes</option>{tipologies.map(t=><option key={t}>{t}</option>)}</select></label></FilterBar8776>}>
      <div className="honor-kpis"><Kpi t="PRESSUPOSTAT" v={money(pressupostat)}/><Kpi t="FACTURAT BASE" v={money(facturatBase)}/><Kpi t="FACTURAT TOTAL" v={money(facturatTotal)}/><Kpi t="COBRAT" v={money(cobrat)}/><Kpi t="PENDENT" v={money(pendent)}/><Kpi t="TEMPS INTERN" v={money(totalC)}/><Kpi t="HORES" v={`${totalH.toFixed(2)} h`}/><Kpi t="MARGE INTERN" v={money(marge)}/></div>
      <div className="rend-main-grid-v878120"><div className="rend-bars-v878120"><RendimentBar878120 label="Pressupostos honoraris" value={pressupostat} max={max}/><RendimentBar878120 label="Facturació base" value={facturatBase} max={max}/><RendimentBar878120 label="Temps dedicat valorat" value={totalC} max={max} tone={marge>=0?"good":"bad"}/><RendimentBar878120 label="Cobrat sobre facturat" value={facturatTotal?cobrat/facturatTotal*100:0} max={100} kind="pct" tone={pendent>0?"warn":"good"}/></div><div className={`rend-result-v878120 ${marge>=0?"good":"bad"}`}><span>Resultat global intern</span><b>{marge>=0?"+":""}{money(marge)}</b><small>{totalH?`Rendiment real: ${money(facturatBase/totalH)}/h`:"Encara no hi ha hores registrades."}</small></div></div>
      <div className="finance-charts-v8776"><Donut8776 title="Temps per client" parts={byClient} total={totalC}/><Donut8776 title="Temps per tipologia" parts={byTipus} total={totalC}/><Donut8776 title="Factures per estat" parts={aggregate8776(factRows,f=>statusKeyFactura8776(f.estat),f=>totalFactura878120(f))} total={facturatTotal}/></div>
    </Card>
    <Card title="Rendiment per feina"><div className="finance-table-wrap-v8743"><table className="finance-table-v8743 finance-table-v8776"><thead><tr><th>Feina</th><th>Client</th><th>Pressupostat</th><th>Facturat base</th><th>Temps intern</th><th>Hores</th><th>Marge</th><th>€/h real</th></tr></thead><tbody>{byObra.length===0&&<tr><td colSpan="8"><Empty text="Encara no hi ha dades de pressupostos, factures o temps."/></td></tr>}{byObra.map(m=><tr key={m.obra.id}><td><button className="table-link-v8776" onClick={()=>openObra(m.obra.id)}>{m.obra.nom}</button><small>{m.tipologia}</small></td><td>{m.clientNom}</td><td>{money(m.pressupostat)}</td><td>{money(m.facturatBase)}</td><td>{money(m.tempsCost)}</td><td>{m.hores.toFixed(2)} h</td><td><b className={m.marge>=0?"good-text":"bad-text"}>{m.marge>=0?"+":""}{money(m.marge)}</b></td><td>{m.hores?money(m.facturatBase/m.hores):"—"}</td></tr>)}</tbody></table></div></Card>
    <Card title="Registres del període seleccionat"><div className="finance-table-wrap-v8743"><table className="finance-table-v8743 finance-table-v8776"><thead><tr><th>Obra</th><th>Client</th><th>Dia</th><th>Tipus feina</th><th>Hora / hores</th><th>Cost hora</th><th>Total</th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan="7"><Empty text="No hi ha registres en aquest període."/></td></tr>}{rows.map(r=><tr key={(r.obra.id||"")+r.id}><td><button className="table-link-v8776" onClick={()=>openObra(r.obra.id)}>{r.obraNom}</button></td><td>{r.clientNom}</td><td>{fmtAppDate8748(r.data)}</td><td>{r.tipusFeina||r.etiqueta||"Altres"}</td><td>{n(r.hores).toFixed(2)} h</td><td>{money(n(r.preuHora)||n(r.preu)||0)}</td><td><b>{money(timeImport878120(r))}</b></td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL PERÍODE</th><th>{totalH.toFixed(2)} h</th><th></th><th>{money(totalC)}</th></tr></tfoot></table></div></Card>
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


function RendimentBar878120({label,value,max,kind="money",tone=""}){
  const w=max?Math.max(4,Math.min(100,Math.abs(value)/max*100)):0;
  return <div className={`rend-row-v878120 ${tone}`}><div><span>{label}</span><b>{kind==="hours"?`${Number(value||0).toFixed(2)} h`:kind==="pct"?pct(value):money(value)}</b></div><em><i style={{width:`${w}%`}}/></em></div>
}
function RendimentHonorarisExpedient878120({data={},obra={}}){
  const m=honorMetrics878120(data,obra);
  const max=Math.max(m.pressupostat,m.facturatBase,m.tempsCost,1);
  const byType=aggregate8776(m.timeRows,r=>r.tipusFeina||r.tasca||r.etiqueta||"Altres",timeImport878120);
  const byInvoice=aggregate8776(m.factures,f=>statusKeyFactura8776(f.estat),f=>totalFactura878120(f));
  const hasTime=m.timeRows.length>0&&m.hores>0;
  const health=!hasTime?"neutral":(m.marge>=0?"good":"bad");
  return <div className="stack rendiment-exp-v878120">
    <Card title="Rendiment de la feina · honoraris, facturació i temps">
      <div className="rend-kpis-v878120">
        <Kpi t="PRESSUPOST HONORARIS" v={money(m.pressupostat)}/>
        <Kpi t="FACTURAT BASE" v={money(m.facturatBase)}/>
        <Kpi t="TEMPS INTERN" v={money(m.tempsCost)}/>
        <Kpi t="HORES" v={`${m.hores.toFixed(2)} h`}/>
        <Kpi t="RENDIMENT €/H" v={money(m.rendimentHora)}/>
        <Kpi t="MARGE INTERN" v={money(m.marge)}/>
      </div>
      <div className="rend-main-grid-v878120">
        <div className="rend-bars-v878120">
          <RendimentBar878120 label="Pressupost d'honoraris" value={m.pressupostat} max={max}/>
          <RendimentBar878120 label="Facturació base" value={m.facturatBase} max={max}/>
          <RendimentBar878120 label="Valor temps invertit" value={m.tempsCost} max={max} tone={health}/>
          <RendimentBar878120 label="Cobertura facturat / pressupostat" value={m.cobertura} max={100} kind="pct" tone={m.cobertura>=90?"good":"warn"}/>
        </div>
        {hasTime?<div className={`rend-result-v878120 ${health}`}><span>Resultat intern estimat</span><b>{m.marge>=0?"+":""}{money(m.marge)}</b><small>{`Preu real aproximat: ${money(m.rendimentHora)}/h`}</small></div>:<div className="rend-result-v878120 neutral"><span>Sense temps registrat</span><b>0,00 h</b><small>Quan entris hores a Gestió temps es calcularà el cost intern i el rendiment real.</small></div>}
      </div>
    </Card>
    <div className="finance-charts-v8776 rend-charts-v878120"><Donut8776 title="Factures per estat" parts={byInvoice} total={m.factures.length?m.facturatTotal:0}/><Donut8776 title="Temps per tipus de feina" parts={byType} total={m.tempsCost}/><Donut8776 title="Relació honoraris" parts={[{k:"Facturat base",v:m.facturatBase},{k:"Temps intern",v:m.tempsCost},{k:"Pendent pressupost",v:Math.max(m.pressupostat-m.facturatBase,0)}]} total={Math.max(m.pressupostat,m.facturatBase+m.tempsCost,1)}/></div>
    <Card title="Lectura ràpida del rendiment"><div className="rend-reading-v878120"><p><b>Pressupostat:</b> {money(m.pressupostat)} sense IVA.</p><p><b>Facturat:</b> {money(m.facturatBase)} base / {money(m.facturatTotal)} total factura.</p><p><b>Cobrat:</b> {money(m.cobratTotal)} · <b>Pendent:</b> {money(Math.max(m.pendent,0))}.</p><p><b>Temps invertit:</b> {hasTime?`${m.hores.toFixed(2)} h valorades en ${money(m.tempsCost)}`:'Sense registres a Gestió temps'}.</p></div></Card>
  </div>
}

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
function timerMs878186(){return timer?.running?Math.max(Date.now()-(timer.start||Date.now()),0):Math.max((timer?.elapsed||0),0)}
function timerHours(){return timerMs878186()/3600000}
function timerClock878186(){const sec=Math.floor(timerMs878186()/1000);const h=Math.floor(sec/3600);const m=Math.floor((sec%3600)/60);const s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function stopTimerToRows878162(){const h=Math.max(timerHours(),0.01);setRows(p=>[...p,{id:"hr-chrono-"+Date.now(),obraId,data:new Date().toISOString().slice(0,10),tipusRegistre:"Honoraris",tipusFeina:timer.label||"Treball tècnic",tasca:timer.task||"Temps cronometrat",hores:h.toFixed(2),preuHora:timer.rate||50,observacions:"Registre creat amb comptador"}]);setTimer?.(t=>({...t,running:false,start:null,elapsed:0,task:""}))}
return <div className="stack temps-validat-v8754"><Card title="Resum temps, honoraris i despeses"><div className="honor-kpis"><Kpi t="HORES" v={`${totalH.toFixed(2)} h`}/><Kpi t="HONORARIS" v={money(totalHonor)}/><Kpi t="DESPESES" v={money(totalDesp)}/><Kpi t="KM" v={`${totalKm.toFixed(2)} km`}/><Kpi t="TOTAL" v={money(totalHonor+totalDesp)}/></div></Card><Card title="Comptador de temps"><div className="time-form-v8754 timer-panel-v87162"><label><span>Tipus de feina</span><select value={timer.label||"Pressupost"} onChange={e=>setTimer?.(t=>({...t,label:e.target.value}))}>{tipusFeina.map(t=><option key={t}>{t}</option>)}</select></label><label><span>Tasca</span><input value={timer.task||""} onChange={e=>setTimer?.(t=>({...t,task:e.target.value}))} placeholder="Què estàs fent?"/></label><label><span>€/h</span><input type="number" step="0.01" value={timer.rate||50} onChange={e=>setTimer?.(t=>({...t,rate:e.target.value}))}/></label><div className={timer.running?"timer-clock-v87162 timer-live-v87186":"timer-clock-v87162"}><span>{timer.running?"Temps en marxa":"Comptador aturat"}</span><b className="timer-live-clock-v87186">{timerClock878186()}</b><em>{timerHours().toFixed(2)} h</em></div></div><div className="card-actions">{timer.running?<button className="primary" onClick={stopTimerToRows878162}>Aturar i guardar registre</button>:<button className="primary" onClick={()=>setTimer?.(t=>({...t,running:true,start:Date.now(),elapsed:0}))}>Iniciar comptador</button>}<button className="secondary" onClick={()=>setTimer?.(t=>({...t,running:false,start:null,elapsed:0,task:""}))}>Reiniciar</button></div></Card><details className="time-manual-details-v878188"><summary><b>Afegir registre manual</b><span>Obrir només quan cal introduir hores/despeses a mà</span></summary><Card title="Nou registre manual"><div className="time-form-v8754"><label><span>Data</span><input type="date" value={manual.data} onChange={e=>setManual({...manual,data:e.target.value})}/></label><label><span>Tipus de registre</span><select value={manual.tipusRegistre} onChange={e=>setManual({...manual,tipusRegistre:e.target.value})}>{tipusRegistre.map(t=><option key={t}>{t}</option>)}</select></label><label><span>Tipus de feina</span><select value={manual.tipusFeina} onChange={e=>setManual({...manual,tipusFeina:e.target.value})}>{tipusFeina.map(t=><option key={t}>{t}</option>)}</select></label><label><span>Tasca feta</span><select value={manual.tasca} onChange={e=>setManual({...manual,tasca:e.target.value})}>{tasques.map(t=><option key={t}>{t}</option>)}</select></label>{fields(manual,setManual,null)}<label className="span-all"><span>Observacions</span><input value={manual.observacions||""} onChange={e=>setManual({...manual,observacions:e.target.value})}/></label></div><div className="card-actions"><button className="primary" onClick={add}>Afegir registre manual</button></div></Card></details><Card title="Registres de temps / despeses"><div className="time-table-wrap"><table className="time-table time-table-v8754"><thead><tr><th>Data</th><th>Tipus registre</th><th>Tipus feina</th><th>Tasca</th><th>Dades</th><th>Observacions</th><th>Import</th><th>Accions</th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan="8"><Empty text="Encara no hi ha registres."/></td></tr>}{rows.map(r=>{let edit=editing===r.id;return <tr key={r.id}><td>{edit?<input type="date" value={r.data||""} onChange={e=>upd(r.id,"data",e.target.value)}/>:fmtAppDate8748(r.data)}</td><td>{edit?<select value={r.tipusRegistre||"Honoraris"} onChange={e=>upd(r.id,"tipusRegistre",e.target.value)}>{tipusRegistre.map(t=><option key={t}>{t}</option>)}</select>:r.tipusRegistre}</td><td>{edit?<select value={r.tipusFeina||"Altres"} onChange={e=>upd(r.id,"tipusFeina",e.target.value)}>{tipusFeina.map(t=><option key={t}>{t}</option>)}</select>:r.tipusFeina}</td><td>{edit?<select value={r.tasca||"Altres"} onChange={e=>upd(r.id,"tasca",e.target.value)}>{tasques.map(t=><option key={t}>{t}</option>)}</select>:r.tasca}</td><td>{edit?<div className="row-edit-fields-v8754">{fields(r,null,r.id)}</div>:r.tipusRegistre==="Honoraris"?`${n(r.hores).toFixed(2)} h × ${money(n(r.preuHora))}`:r.tipusRegistre==="Kilometratge"?`${n(r.km).toFixed(2)} km × ${money(n(r.preuKm))}`:`${n(r.quantitat).toFixed(2)} × ${money(n(r.preuUnitari))}`}</td><td>{edit?<input value={r.observacions||""} onChange={e=>upd(r.id,"observacions",e.target.value)}/>:r.observacions}</td><td><b>{money(importReg(r))}</b></td><td><div className="row-actions">{edit?<button className="secondary" onClick={()=>setEditing(null)}>Guardar</button>:<button className="secondary" onClick={()=>setEditing(r.id)}>Editar</button>}<button className="danger" onClick={()=>del(r.id)}>Eliminar</button></div></td></tr>})}</tbody></table></div></Card></div>}

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
function Modal({title,children,close}){return <div className="modal-backdrop"><div className="modal"><button type="button" className="modal-back-mobile-v87146" onClick={close}>← Tancar / tornar</button><div className="modal-head"><h2>{title}</h2><button onClick={close}><X/></button></div>{children}</div></div>}

function CertPrintV79({doc}){
  const rows=doc.rows||[];
  const current=rows.filter(r=>(+r.qAct||0)>0);
  const totalAct=current.reduce((s,r)=>s+(+r.qAct||0)*parseNum8770(r.pu),0);
  return <div className="cert-print-v79">
    <h1>{doc.title}</h1>
    <p className="doc-sub">{doc.subtitle}</p>
    <h3>Relació de partides certificades</h3>
    <table><thead><tr><th>Partida</th><th>Concepte</th><th>Q certificada</th><th>PU</th><th>Import</th></tr></thead><tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*parseNum8770(r.pu))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL CERTIFICACIÓ ACTUAL</th><th>{money(totalAct)}</th></tr></tfoot></table>
    <div className="page-break-v79"></div>
    <h2>Quadre resum de certificació</h2>
    <div className="cert-grid-print-v79">
      <div className="h">Partida</div><div className="h">Ut</div><div className="h">Resum</div><div className="h">CanPres</div><div className="h">PrPres</div><div className="h">ImpPres</div><div className="h">Q ant.</div><div className="h">% ant.</div><div className="h">Imp ant.</div><div className="h">Q act.</div><div className="h">% act.</div><div className="h">Imp act.</div><div className="h">Total origen</div>
      {rows.map(r=><React.Fragment key={r.codi}>
        <div>{r.codi}</div><div>{r.ut}</div><div className="concept">{r.concepte}</div><div>{qty2(r.q)}</div><div>{money(r.pu)}</div><div>{money((+r.q||0)*parseNum8770(r.pu))}</div>
        <div>{qty2(r.qPrev)}</div><div>{pct((+r.q||0)?(+r.qPrev||0)/(+r.q)*100:0)}</div><div>{money((+r.qPrev||0)*parseNum8770(r.pu))}</div>
        <div className={(+r.qAct||0)>0?"green":""}>{qty2(r.qAct)}</div><div className={(+r.qAct||0)>0?"green":""}>{pct((+r.q||0)?(+r.qAct||0)/(+r.q)*100:0)}</div><div className={(+r.qAct||0)>0?"green":""}>{money((+r.qAct||0)*parseNum8770(r.pu))}</div>
        <div>{money(((+r.qPrev||0)+(+r.qAct||0))*parseNum8770(r.pu))}</div>
      </React.Fragment>)}
    </div>
  </div>
}


function ProformaPrintV81({doc,pf}){
  const rows=pf.allRows||pf.rows||[];
  const sortedRows=sortPartides878132(rows);
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
  let lastCap="__none__";
  return <div className="proforma-print-v81">
    <h1>{doc.title}</h1>
    <p className="doc-sub">{doc.subtitle}</p>
    <h3>Partides certificades a origen</h3>
    <table className="proforma-lines-v87117 proforma-cap-lines-v87143"><colgroup><col className="c-code"/><col className="c-concept"/><col className="c-q"/><col className="c-price"/><col className="c-total"/></colgroup><thead><tr><th>Codi</th><th>Concepte</th><th>Q origen</th><th>Preu</th><th>Total origen</th></tr></thead><tbody>{sortedRows.length===0?<tr><td colSpan="5" className="empty">Sense partides certificades a origen.</td></tr>:sortedRows.map(r=>{const cap=r.cap||"PRESSUPOST IMPORTAT";const showCap=cap!==lastCap;lastCap=cap;return <React.Fragment key={(r.cap||"")+"-"+(r.codi||"")+"-"+(r.concepte||"")}>
      {showCap&&<tr className="cap-print-row-v8771 proforma-cap-row-v87143"><td colSpan="5">{cap}</td></tr>}
      <tr><td>{r.codi}</td><td className="concept"><b>{r.concepte}</b></td><td className="num">{qty2(r.qOrigin??0)}</td><td className="num">{money(r.pu)}</td><td className="num">{money(r.impOrigin??0)}</td></tr>
    </React.Fragment>})}</tbody><tfoot><tr><th colSpan="4">TOTAL A ORIGEN</th><th className="num">{money(totalOrigen)}</th></tr></tfoot></table>
    <h3>Deducció de certificacions anteriors</h3>
    <table className="totals-preview"><tbody><tr><th>Total certificat a origen</th><td className="num">{money(totalOrigen)}</td></tr>{prevTotals.length===0?<tr><th>No hi ha certificacions anteriors</th><td className="num">{money(0)}</td></tr>:prevTotals.map(c=><tr key={c.n}><th>Deducció Certificació {c.n}</th><td className="num">-{money(c.total)}</td></tr>)}<tr className="total"><th>Import sense IVA Cert. {certNum}</th><td className="num">{money(base)}</td></tr></tbody></table>
    <div className="doc-totals v81">
      <div><span>Base imposable</span><b>{money(baseImposable)}</b></div>
      <div><span>Deducció provisió/descompte {ded}%</span><b>-{money(base-baseImposable)}</b></div>
      <div><span>IVA {iva}%</span><b>{money(ivaImp)}</b></div>
      <div><span>Retenció {ret}%</span><b>-{money(retImp)}</b></div>
      <div className="total"><span>Total proforma</span><b>{money(total)}</b></div>
    </div>
  </div>
}
function CertPrintV81({doc}){
  const rows=doc.rows||[];
  const current=rows.filter(r=>(+r.qAct||0)>0);
  const totalAct=current.reduce((s,r)=>s+(+r.qAct||0)*parseNum8770(r.pu),0);
  return <div className="cert-print-v81">
    <h1>{doc.title}</h1><p className="doc-sub">{doc.subtitle}</p>
    <h3>Resum de partides certificades</h3>
    <table><thead><tr><th>Partida</th><th>Concepte</th><th>Q certificada</th><th>PU</th><th>Import</th></tr></thead><tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*parseNum8770(r.pu))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL CERTIFICACIÓ</th><th>{money(totalAct)}</th></tr></tfoot></table>
    <div className="page-break-v81"></div>
    <h2>Quadre resum de certificació</h2>
    <div className="cert-grid-print-v81">
      <div className="h">Partida</div><div className="h">Ut</div><div className="h">Resum</div><div className="h">CanPres</div><div className="h">PrPres</div><div className="h">ImpPres</div><div className="h">Q ant.</div><div className="h">% ant.</div><div className="h">Imp ant.</div><div className="h">Q act.</div><div className="h">% act.</div><div className="h">Imp act.</div><div className="h">Total origen</div>
      {rows.map(r=><React.Fragment key={r.codi}><div>{r.codi}</div><div>{r.ut}</div><div className="concept">{r.concepte}</div><div>{qty2(r.q)}</div><div>{money(r.pu)}</div><div>{money((+r.q||0)*parseNum8770(r.pu))}</div><div>{qty2(r.qPrev)}</div><div>{pct((+r.q||0)?(+r.qPrev||0)/(+r.q)*100:0)}</div><div>{money((+r.qPrev||0)*parseNum8770(r.pu))}</div><div className={(+r.qAct||0)>0?"green":""}>{qty2(r.qAct)}</div><div className={(+r.qAct||0)>0?"green":""}>{pct((+r.q||0)?(+r.qAct||0)/(+r.q)*100:0)}</div><div className={(+r.qAct||0)>0?"green":""}>{money((+r.qAct||0)*parseNum8770(r.pu))}</div><div>{money(((+r.qPrev||0)+(+r.qAct||0))*parseNum8770(r.pu))}</div></React.Fragment>)}
    </div>
  </div>
}


function CertPrintV82({doc}){
const rows=doc.rows||[];
const current=rows.filter(r=>(+r.qAct||0)>0);
const total=current.reduce((s,r)=>s+(+r.qAct||0)*parseNum8770(r.pu),0);
return <div className="cert-print-v82">
<h1>{doc.title}</h1><p>{doc.subtitle}</p>
<h3>Resum de partides certificades</h3>
<table><thead><tr><th>Partida</th><th>Concepte</th><th>Q certificada</th><th>PU</th><th>Import</th></tr></thead><tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*parseNum8770(r.pu))}</td></tr>)}</tbody><tfoot><tr><th colSpan="4">TOTAL</th><th>{money(total)}</th></tr></tfoot></table>
<div className="page-break-v82"></div>
<h2>Quadre resum</h2>
<table><thead><tr><th>Partida</th><th>Concepte</th><th>Q anterior</th><th>Q actual</th><th>Import actual</th><th>Total origen</th></tr></thead><tbody>{rows.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.concepte}</td><td>{qty2(r.qPrev)}</td><td className={(+r.qAct||0)>0?"green":""}>{qty2(r.qAct)}</td><td className={(+r.qAct||0)>0?"green":""}>{money((+r.qAct||0)*parseNum8770(r.pu))}</td><td>{money(((+r.qPrev||0)+(+r.qAct||0))*parseNum8770(r.pu))}</td></tr>)}</tbody></table>
</div>
}


function CertPrintV87({doc}){
const rows=doc.rows||[];
const current=rows.filter(r=>(+r.qAct||0)>0);
const total=current.reduce((s,r)=>s+(+r.qAct||0)*parseNum8770(r.pu),0);
const totalOrigen=doc.totalOrigen ?? rows.reduce((s,r)=>{
  const qOri=(+r.qOrigen||0)||((+r.qPrev||0)+(+r.qAct||0));
  return s+((+r.impOrigen||0)||qOri*parseNum8770(r.pu));
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
      <tbody>{current.map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.ut}</td><td>{r.concepte}</td><td>{qty2(r.qAct)}</td><td>{money(r.pu)}</td><td>{money((+r.qAct||0)*parseNum8770(r.pu))}</td></tr>)}</tbody>
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
        <tr><th>Partida</th><th>Ut</th><th>Concepte</th><th>Q pres.</th><th>PU pres.</th><th>Imp. pres.</th><th>Q ant.</th><th>% ant.</th><th>Imp. ant.</th><th>Q act.</th><th>% act.</th><th>Imp. act.</th><th>Q origen</th><th>% origen</th><th>Total origen</th></tr>
      </thead>
      <tbody>{rows.map(r=>{
        const pres=(+r.q||0)*parseNum8770(r.pu), ant=(+r.qPrev||0)*parseNum8770(r.pu), act=(+r.qAct||0)*parseNum8770(r.pu);
        const qOri=(+r.qOrigen||0)||((+r.qPrev||0)+(+r.qAct||0));
        const impOri=(+r.impOrigen||0)||qOri*parseNum8770(r.pu);
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
  const rows=sortPartides878132(doc.rows||[]);
  const certNum=+doc.certNum||1;
  const originRows=originRowsFromDoc8794(rows,certNum);
  const fin=certFinancialSummaryFromDoc8794(rows,certNum,doc);
  const total=fin.actual;
  const totalOrigen=fin.totalOrigen;
  const certTotals=fin.certTotals;
  const prevTotals=fin.prevTotals||[];
  const deductionRows=prevTotals.length?prevTotals.map(c=>`<tr><td>Deducció Certificació ${c.n}</td><td class="num">-${money(c.total)}</td></tr>`).join(""):`<tr><td>No hi ha certificacions anteriors</td><td class="num">${money(0)}</td></tr>`;
  const summaryTotalsRows=certTotals.map(c=>`<tr><td>CERT. ${c.n}</td><td>${money(c.total)}</td></tr>`).join("");
  let lastOriginCap878132="__none__";
  const originRowsHtml=originRows.map(r=>{const cap=r.cap||"PRESSUPOST IMPORTAT";const show=cap!==lastOriginCap878132;lastOriginCap878132=cap;return `${show?`<tr class="cap"><td colspan="6">${escHtmlV8772(cap)}</td></tr>`:""}<tr><td>${escHtmlV8772(r.codi)}</td><td>${escHtmlV8772(r.ut)}</td><td class="concept"><b>${escHtmlV8772(r.concepte)}</b></td><td class="num">${qty2(r.qOrigin)}</td><td class="num">${money(r.pu)}</td><td class="num">${money(r.impOrigin)}</td></tr>`}).join("") || `<tr><td colspan="6" class="empty">No hi ha partides certificades a origen.</td></tr>`;
  const printRows=sortPartides878132(rows).filter(r=>((+r.qOrigen||0)||(+r.qPrev||0)||(+r.qAct||0)||(+r.impOrigen||0))>0);
  let lastCap="__none__";
  const wideRows=printRows.map(r=>{
    const cap=r.cap||"PRESSUPOST IMPORTAT";
    const showCap=cap!==lastCap; lastCap=cap;
    const pres=(+r.q||0)*parseNum8770(r.pu), ant=(+r.qPrev||0)*parseNum8770(r.pu), act=(+r.qAct||0)*parseNum8770(r.pu);
    const qOri=(+r.qOrigen||0)||((+r.qPrev||0)+(+r.qAct||0));
    const impOri=(+r.impOrigen||0)||qOri*parseNum8770(r.pu);
    const pctOri=r.pctOrigen ?? ((+r.q||0)?qOri/(+r.q)*100:0);
    return `${showCap?`<tr class="cap"><td colspan="15">${escHtmlV8772(cap)}</td></tr>`:""}<tr>
      <td>${escHtmlV8772(r.codi)}</td><td>${escHtmlV8772(r.ut)}</td><td class="concept"><b>${escHtmlV8772(r.concepte)}</b></td><td>${qty2(r.q)}</td><td>${money(r.pu)}</td><td>${money(pres)}</td>
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
    table{width:100%;border-collapse:collapse;table-layout:fixed} th,td{border:1px solid #94a3b8;padding:3px 4px;text-align:right;vertical-align:top;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden} th{background:#dbeafe;color:#0f172a;font-weight:900}.concept{text-align:left!important;white-space:normal!important;overflow:hidden!important;overflow-wrap:anywhere!important;word-break:normal!important;line-height:1.16}.concept b{font-weight:700}.print-desc-static-v878126{display:block;white-space:pre-wrap;color:#475569;line-height:1.22;margin-top:2px;font-size:8px;font-weight:400}
    .summary{font-size:9.6px}.summary .part{width:13mm}.summary .ut{width:6mm}.summary .concept-col{width:auto}.summary .num{width:16mm}.summary .imp{width:22mm}.summary tfoot th{background:#b7c9dd;border-top:2px solid #0f172a}.deduction-box{width:112mm;margin:5mm 0 0 auto;border:1px solid #94a3b8;border-radius:6px;overflow:hidden}.deduction-box div{display:flex;justify-content:space-between;padding:5px 7px;border-bottom:1px solid #cbd5e1}.deduction-box div:last-child{border-bottom:0;background:#dbeafe;font-weight:900}.certs-list{width:95mm;margin:4mm 0 0 auto}.certs-list table{font-size:9px}.certs-list h3{margin-bottom:4px;text-align:left}
    .wide{font-size:6.2px;line-height:1.04}.wide col.part{width:5.0%}.wide col.ut{width:2.4%}.wide col.concept-col{width:39.0%}.wide col.q{width:3.1%}.wide col.pu{width:4.0%}.wide col.imp{width:4.8%}.wide col.pct{width:2.7%}.wide col.imp-total{width:5.0%}.wide th,.wide td{padding:1.5px 1.5px}.wide .blocks th{background:#b7c9dd;border-top:2px solid #0f172a;border-bottom:2px solid #0f172a;text-align:center}.wide .green{background:#d9ead3;font-weight:700}.wide th:nth-child(6),.wide td:nth-child(6),.wide th:nth-child(9),.wide td:nth-child(9),.wide th:nth-child(12),.wide td:nth-child(12){border-right:2px solid #0f172a}.cap td{background:#9fbad4!important;text-align:left!important;font-weight:900;border-top:2px solid #0f172a;border-bottom:1.5px solid #0f172a;white-space:normal!important;font-size:7px}.measure td{background:#fff!important;text-align:left!important;white-space:normal!important}.measure-inner{margin-top:3px;font-size:6.5px}.measure-inner th,.measure-inner td{padding:1.8px 2px}.cert-bottom-summary{margin-top:6mm;max-width:110mm;margin-left:auto}.cert-bottom-summary table{font-size:8px}.cert-bottom-summary th,.cert-bottom-summary td{text-align:right!important;padding:3px 4px}.cert-bottom-summary h3{text-align:left;margin:0 0 4px}
    thead{display:table-header-group} tfoot{display:table-footer-group}.wide th{white-space:normal!important;line-height:1.05}.empty{text-align:left;color:#64748b;padding:10px!important}
    @media screen{body{background:#e5e7eb;padding:16px}.page{box-shadow:0 2px 12px rgba(15,23,42,.15);margin:0 auto 16px;background:#fff;padding:8mm}.landscape{padding:6mm}}
    @media print{body{background:#fff!important;padding:0!important}.page{box-shadow:none!important;margin:0!important}.portrait{padding:0!important;width:182mm!important}.landscape{padding:0!important;width:277mm!important;min-height:185mm!important}.wide{table-layout:fixed!important;width:100%!important}.wide .concept{overflow:visible!important}}
  </style></head><body>
    <section class="page portrait">
      <div class="head">${issuerFiscalBlockHtml87100(client)}<div><b>Client / promotor</b><span>${fiscalClientBlock878134(obra,client,doc.agents||[])}</span></div></div>
      <h1>${escHtmlV8772(doc.title||"CERTIFICACIÓ")}</h1><p class="sub">${doc.data?`Data: ${escHtmlV8772(doc.data)} · `:""}${escHtmlV8772(doc.subtitle||"")}</p>
      <div class="cover"><b>Resum econòmic a origen</b><span>Partides amb certificació a origen: ${originRows.length}</span><span>Total certificat a origen: ${money(totalOrigen)}</span><span>Import certificació ${certNum}: ${money(total)}</span></div>
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
    <div className="cert-lite-kpis-v8783"><div><span>Partides amb certificació a origen</span><b>{originRows.length}</b></div><div><span>Total certificat a origen</span><b>{money(totalOrigen)}</b></div><div><span>Import certificació {certNum}</span><b>{money(totalActual)}</b></div></div>
    <h3>Partides certificades a origen</h3>
    {originRows.length===0?<div className="empty">No hi ha partides certificades a origen.</div>:<div className="cert-preview-table-wrap-v8772"><table className="cert-preview-summary-v8772 stable-num-table-v8783 cert-summary-cols-v87117"><colgroup><col className="c-partida"/><col className="c-ut"/><col className="c-concepte"/><col className="c-q"/><col className="c-pu"/><col className="c-total"/></colgroup><thead><tr><th>Partida</th><th>Ut</th><th>Concepte / descripció</th><th>Q origen</th><th>PU</th><th>Total origen</th></tr></thead><tbody>{originRows.slice(0,80).map(r=><tr key={r.codi}><td>{r.codi}</td><td>{r.ut}</td><td className="concept"><b>{r.concepte}</b></td><td className="num">{qty2(r.qOrigin)}</td><td className="num">{money(r.pu)}</td><td className="num">{money(r.impOrigin)}</td></tr>)}</tbody><tfoot><tr><th colSpan="5">TOTAL A ORIGEN</th><th>{money(totalOrigen)}</th></tr></tfoot></table>{originRows.length>80&&<p className="muted">Hi ha més partides. El document complet sortirà a la impressió.</p>}</div>}
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
      <label><span>Tipologia *</span><select name="tipus" required><option>Promotor / client final</option><option>Comunitat de propietaris</option><option>Particular</option><option>Constructora / contractista</option><option>Industrial</option><option>Arquitecte</option><option>Arquitecte tècnic</option><option>Direcció Facultativa</option><option>Autònom</option><option>Administració</option><option>Altres</option></select></label>
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

function FormObra({clients,onSubmit}){const[clientSel,setClientSel]=useState("__new__");const[tipus,setTipus]=useState(WORK_TYPES8737[0]);return <form onSubmit={onSubmit}><div className="form-grid"><label><span>Client</span><select name="client" value={clientSel} onChange={e=>setClientSel(e.target.value)}><option value="__new__">+ Crear client nou</option><option value="" disabled>— Clients existents —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>{clientSel==="__new__"&&<><Input name="clientNouNom" label="Nom nou client" defaultValue="Nou client"/><Input name="clientNouRao" label="Raó social nou client" defaultValue="Pendent"/><label><span>Tipologia nou client</span><select name="clientNouTipus"><option>Particular</option><option>Promotor</option><option>Arquitecte tècnic</option><option>Constructora</option><option>Industrial</option><option>Administració</option><option>Altres</option></select></label><Input name="clientNouContacte" label="Contacte nou client" defaultValue="Pendent"/><Input name="clientNouNif" label="NIF/CIF nou client" defaultValue="Pendent"/><Input name="clientNouTelefon" label="Telèfon nou client" defaultValue="Pendent"/><Input name="clientNouEmail" label="Email nou client" defaultValue="Pendent"/><Input name="clientNouAdreca" label="Adreça nou client" defaultValue="Pendent"/></>}<Input name="nom" label="Nom de l’expedient" defaultValue="Nou expedient"/><Input name="subtitol" label="Descripció breu" defaultValue="Treball pendent de definir"/><label><span>Paraula clau del codi</span><input name="paraulaClau" placeholder="Ex: FRONTMAR, GARRIGOLES, PALAMOS"/></label><Input name="any" label="Any obertura" defaultValue="2026"/><label><span>Estat</span><select name="estat"><option>Pressupostat</option><option>Acceptat</option><option>En procés</option><option>En curs / Actiu</option><option>Tancat</option><option>Anul·lat</option><option>No acceptat</option><option>Pendent de resposta</option><option>En revisió</option></select></label><label className="span-all"><span>Tipus de treball</span><select name="tipusTreball" value={tipus} onChange={e=>setTipus(e.target.value)}>{WORK_TYPES8737.map(t=><option key={t}>{t}</option>)}</select></label>{tipus==="Altres"&&<Input name="tipusTreballAltres" label="Especifica el tipus de treball" defaultValue=""/>}<div className="span-all code-help-v8739"><b>Numeració automàtica</b><span>El codi es generarà automàticament: ANY-NÚM-TIPUS-CLIENT-PARAULA. Exemple: 2026-004-PRE-BR-BV-VERBANIA.</span></div><Input name="propietat" label="Client final / propietat" defaultValue="Pendent"/><Input name="nifPropietat" label="NIF client final" defaultValue="Pendent"/><Input name="adreca" label="Adreça" defaultValue="Pendent"/><Input name="poblacio" label="Població" defaultValue="Pendent"/><Input name="rc" label="Referència cadastral" defaultValue="Pendent"/></div><div className="modal-actions"><button className="primary">Crear expedient</button></div></form>}
function FormPartida({onSubmit}){return <form onSubmit={onSubmit}><div className="form-grid"><Input name="codi" label="Codi" defaultValue="10.02"/><Input name="cap" label="Capítol" defaultValue="10 FEINES FORA PRESSUPOST"/><Input name="concepte" label="Concepte" defaultValue="Nova partida"/><Input name="ut" label="Ut" defaultValue="m²"/><Input name="q" label="Quantitat" defaultValue="1"/><Input name="pu" label="PU" defaultValue="0"/><label><span>Tipus</span><select name="tipus"><option>Base</option><option>Modificada</option><option>Fora pressupost</option></select></label></div><div className="modal-actions"><button className="primary">Afegir partida</button></div></form>}
function FormAgent({onSubmit}){return <form onSubmit={onSubmit}><div className="form-grid"><Input name="nom" label="Nom" defaultValue="Nou agent"/><label><span>Rol</span><select name="rol"><option>Promotor</option><option>Arquitecte</option><option>Arquitecte tècnic</option><option>Direcció Facultativa</option><option>Constructora</option><option>Autònom</option><option>Subcontractat</option><option>Industrial</option><option>Administració</option><option>Altres</option></select></label><Input name="empresa" label="Empresa" defaultValue="Empresa"/><Input name="email" label="Email" defaultValue="email@domini.cat"/><Input name="telefon" label="Telèfon" defaultValue=""/><Input name="nif" label="NIF / CIF" defaultValue=""/><Input name="collegiat" label="Núm. col·legiat / registre" defaultValue=""/><Input name="adreca" label="Adreça" defaultValue=""/></div><div className="modal-actions"><button className="primary">Crear agent</button></div></form>}
function FormActa({agents,onSubmit,openAgent}){
const[mode,setMode]=useState("existent");
return <form onSubmit={onSubmit} className="form-acta-v8747"><div className="form-grid"><label><span>Títol acta *</span><input name="titol" defaultValue="Nova acta d’expedient" required/></label><label><span>Data *</span><input name="data" type="date" defaultValue={todayISO8743?.()||"2026-06-06"} required/></label><label className="span-all"><span>Agents / assistents</span><div className="agent-choice-v8747"><select value={mode} onChange={e=>setMode(e.target.value)}><option value="existent">Cercar agent existent</option><option value="nou">Crear agent nou</option></select><button type="button" className="secondary" onClick={openAgent}><Plus/> Obrir fitxa completa d’agent</button></div></label>{mode==="existent"&&<label className="span-all"><span>Selecciona els agents existents</span><div className="check-grid">{agents.length===0&&<div className="empty mini">No hi ha agents creats encara.</div>}{agents.map(a=><label className="check-row" key={a.id}><input type="checkbox" name="agentsActa" value={a.id}/><span>{a.nom} · {a.rol} · {a.empresa}</span></label>)}</div></label>}{mode==="nou"&&<div className="span-all new-agent-box-v8747"><input type="hidden" name="crearAgentActa" value="1"/><h3>Crear agent nou per aquesta acta</h3><div className="form-grid no-pad"><label><span>Nom *</span><input name="agentNom" required={mode==="nou"}/></label><label><span>Rol *</span><select name="agentRol" required={mode==="nou"}><option>Promotor</option><option>Arquitecte</option><option>Arquitecte tècnic</option><option>Direcció Facultativa</option><option>Constructora</option><option>Industrial</option><option>Administració</option><option>Altres</option></select></label><label><span>Empresa / autònom *</span><input name="agentEmpresa" required={mode==="nou"}/></label><label><span>Email *</span><input name="agentEmail" type="email" required={mode==="nou"}/></label><label><span>Telèfon</span><input name="agentTelefon"/></label><label><span>NIF</span><input name="agentNif"/></label><label className="span-all"><span>Adreça</span><input name="agentAdreca"/></label></div></div>}<label className="span-all"><span>Text acta</span><textarea name="text" defaultValue="Es redacta acta de seguiment de l’expedient."/></label><div className="span-all acta-preview-mini-v8747"><b>Previsualització ràpida</b><p>L’acta es generarà amb capçalera de l’expedient, agents seleccionats, text, fotos i documents adjunts.</p></div><label><span>Fotos</span><input type="file" multiple/></label><label><span>Documents</span><input type="file" multiple/></label></div><div className="modal-actions"><button className="primary">Guardar acta</button></div></form>}

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
  const sortedRows=sortPartides878132(rows);
  let lastProformaCap878143="__none__";
  const bodyRows=sortedRows.map(r=>{const cap=r.cap||"PRESSUPOST IMPORTAT";const showCap=cap!==lastProformaCap878143;lastProformaCap878143=cap;return `${showCap?`<tr class="cap"><td colspan="5">${escHtmlV8772(cap)}</td></tr>`:""}<tr><td>${escHtmlV8772(r.codi)}</td><td class="concept"><b>${escHtmlV8772(r.concepte)}</b></td><td class="num">${qty2(r.qOrigin||0)}</td><td class="num">${money(r.pu)}</td><td class="num">${money(r.impOrigin||0)}</td></tr>`}).join("")||`<tr><td colspan="5" class="empty">Sense partides certificades a origen.</td></tr>`;
  const deductionRows=prevTotals.length?prevTotals.map(c=>`<tr><th>Deducció Certificació ${c.n}</th><td class="num">-${money(c.total)}</td></tr>`).join(""):`<tr><th>No hi ha certificacions anteriors</th><td class="num">${money(0)}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escHtmlV8772(doc.title||"Factura proforma")}</title><style>@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:11px;margin:0;background:white}.page{width:182mm;min-height:269mm;margin:0 auto;background:white}.head{display:grid;grid-template-columns:1.1fr .9fr;gap:12mm;border-bottom:2px solid #0f172a;padding-bottom:9px;margin-bottom:14px}.head h3{margin:0 0 5px;font-size:12px}.head p{margin:0;line-height:1.45;color:#475569}.issuer-v87100{display:grid;grid-template-columns:34mm 1fr;gap:6mm;align-items:start}.issuer-v87100 b,.issuer-v87100 span{display:block;line-height:1.25}.issuer-v87100 b{font-size:12px;margin-bottom:2px}.issuer-logo-box-v87100{width:34mm;min-height:18mm;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;background:#fff}.brand-logo-v87100{max-width:32mm;max-height:20mm;object-fit:contain}.brand-logo-placeholder-v87100{font-weight:900;color:#94a3b8;font-size:10px}.title{display:flex;justify-content:space-between;align-items:flex-start;margin:0 0 14px}.title h1{margin:0;font-size:22px;color:#0f2d5c}.title b{font-size:20px}table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:5mm}th,td{border:1px solid #cbd5e1;padding:6px 7px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}th{background:#dbeafe;color:#0f172a;font-weight:900}.concept{text-align:left!important;vertical-align:top!important;white-space:normal!important;overflow-wrap:anywhere;word-break:normal}.num{text-align:right!important;font-variant-numeric:tabular-nums}.print-desc-static-v878126{display:block;white-space:pre-wrap;color:#475569;line-height:1.25;margin-top:3px;font-size:9px;font-weight:400}.totals{width:86mm;margin-left:auto;margin-top:8mm}.totals div{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:6px 0}.totals .total{border-top:2px solid #0f172a;border-bottom:0;font-size:18px;margin-top:6px;padding-top:9px}.empty{text-align:left!important;color:#64748b}.cap td{background:#9fbad4!important;text-align:left!important;font-weight:900!important;border-top:2px solid #0f172a!important;border-bottom:1.5px solid #0f172a!important;white-space:normal!important;color:#0f172a!important}.cert-lines{width:92mm;margin-left:auto}.cert-lines th{text-align:left}.cert-lines td{text-align:right}.cert-lines .strong th,.cert-lines .strong td{background:#f1f5f9;font-weight:900}@media screen{body{background:#e5e7eb;padding:18px}.page{box-shadow:0 2px 18px rgba(15,23,42,.18);padding:14mm;transform-origin:top center}}@media screen and (max-width:900px){body{padding:8px}.page{width:182mm;min-height:269mm;padding:10mm;transform:scale(.54);transform-origin:top left;margin:0 auto}.head{grid-template-columns:1fr 1fr;gap:8mm}table{font-size:9.5px}th,td{padding:4px 5px}.concept{font-size:9.5px}.totals{width:74mm}}@media print{body{background:#fff!important;padding:0!important}.page{box-shadow:none!important;padding:0!important;width:182mm!important;min-height:269mm!important;transform:none!important;margin:0!important}table{table-layout:fixed!important}.concept{overflow:hidden!important;overflow-wrap:anywhere!important}}</style></head><body><section class="page"><div class="head">${issuerFiscalBlockHtml87100(client)}<div><h3>Client / promotor</h3><p>${fiscalClientBlock878134(obra,client,doc.agents||[])}<br>${escHtmlV8772(expedientCode8739(obra))} · ${escHtmlV8772(obra?.nom||"")}</p></div></div><div class="title"><div><h1>${escHtmlV8772(doc.title||"FACTURA PROFORMA")}</h1><p>${escHtmlV8772(doc.subtitle||"")}</p></div><b>${money(total)}</b></div><h3>Partides certificades a origen</h3><table><colgroup><col style="width:13mm"><col style="width:auto"><col style="width:15mm"><col style="width:18mm"><col style="width:22mm"></colgroup><thead><tr><th>Codi</th><th>Concepte</th><th>Q origen</th><th>Preu</th><th>Total origen</th></tr></thead><tbody>${bodyRows}</tbody><tfoot><tr><th colspan="4">TOTAL A ORIGEN</th><th>${money(totalOrigen)}</th></tr></tfoot></table><table class="cert-lines"><tbody><tr class="strong"><th>Total certificat a origen</th><td>${money(totalOrigen)}</td></tr>${deductionRows}</tbody></table><div class="totals"><div><span>Base imposable</span><b>${money(baseImposable)}</b></div><div><span>Deducció provisió/descompte ${ded}%</span><b>-${money(base-baseImposable)}</b></div><div><span>IVA ${iva}%</span><b>${money(ivaImp)}</b></div><div><span>Retenció ${ret}%</span><b>-${money(retImp)}</b></div><div class="total"><span>Total proforma</span><b>${money(total)}</b></div></div></section></body></html>`;
}



function pressupostObraPrintHtml878153(doc,obra,client){
  const rows=sortPartides878132(doc.rows||[]);
  const total=doc.total ?? rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  const obs=String(doc.observacions||"").trim()||"Observacions pendents d’indicar.";
  const forma=String(doc.formaPagament||"").trim()||"Forma de pagament pendent d’indicar.";
  const numPres=String(doc.numeroPressupost||"").trim();
  const ref=String(doc.referencia||obra?.nom||"").trim();
  const obraAdr=String(doc.obraAdreca||[obra?.adreca,obra?.codiPostal,obra?.poblacio].filter(Boolean).join(" · ")||"").trim();
  const dataPres=String(doc.dataPressupost||doc.data||"").trim();
  const versioPres=String(doc.versioPressupost||"").trim();
  const clientEmissor=issuerFiscalName87100(client);
  const clientPressupost=String(doc.tercerNom||doc.clientFinalPressupost||obra?.propietat||"Client").trim();
  const thirdName=String(doc.tercerNom||"").trim();
  const thirdBlock=thirdName?`<b>${escHtmlV8772(thirdName)}</b>${doc.tercerNif?`<br>NIF/CIF: ${escHtmlV8772(doc.tercerNif)}`:""}${doc.tercerAdreca?`<br>${escHtmlV8772(doc.tercerAdreca)}`:""}${doc.tercerEmail?`<br>${escHtmlV8772(doc.tercerEmail)}`:""}`:fiscalClientBlock878134(obra,client,doc.agents||[]);
  const metaLines=[
    ref?`<p><b>Referència:</b> ${escHtmlV8772(ref)}</p>`:"",
    obraAdr?`<p><b>Adreça de l’obra:</b> ${escHtmlV8772(obraAdr)}</p>`:"",
    dataPres?`<p><b>Data:</b> ${escHtmlV8772(fmtAppDate8748(dataPres)||dataPres)}</p>`:""
  ].filter(Boolean).join("") || `<p>${escHtmlV8772(doc.subtitle||"")}</p>`;
  let lastCap="__none__";
  const body=rows.map(r=>{
    const q=parseNum8770(r.q)||0, pu=parseNum8770(r.pu)||0;
    const cap=r.cap||"PRESSUPOST";
    const show=cap!==lastCap; lastCap=cap;
    return `${show?`<tr class="cap"><td colspan="6">${escHtmlV8772(cap)}</td></tr>`:""}<tr><td class="code">${escHtmlV8772(r.codi||"")}</td><td>${escHtmlV8772(r.ut||"")}</td><td class="concept"><b>${escHtmlV8772(r.concepte||"")}</b>${r.desc?`<p class="long-desc">${escHtmlV8772(r.desc)}</p>`:""}</td><td class="num">${qty2(q)}</td><td class="num">${money(pu)}</td><td class="num"><b>${money(q*pu)}</b></td></tr>`
  }).join("") || `<tr><td colspan="6" class="empty">Sense partides.</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escHtmlV8772(doc.title||"Pressupost")}</title><style>@page{size:A4 portrait;margin:9mm}*{box-sizing:border-box}html,body{margin:0}body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:10.5px;background:white}.page{width:192mm;min-height:279mm;margin:0 auto;background:white}.head{display:grid;grid-template-columns:1.2fr .8fr;gap:8mm;border-bottom:2px solid #0f172a;padding-bottom:7px;margin-bottom:10px}.head h3{margin:0 0 4px;font-size:11px}.head p{margin:0;line-height:1.35;color:#475569}.client-head{padding-left:2mm}.title{display:grid;grid-template-columns:1fr 45mm;gap:7mm;align-items:start;margin:0 0 10px}.title h1{margin:0 0 5px;font-size:21px;color:#0f2d5c}.title-meta p{margin:0 0 2px;line-height:1.3}.budget-id{border:1px solid #cbd5e1;border-radius:7px;background:#f8fafc;padding:7px 8px;text-align:right}.budget-id small{display:block;color:#64748b;font-weight:900;text-transform:uppercase;font-size:8.5px;margin-top:3px}.budget-id b{display:block;font-size:13px;color:#0f172a}table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:3mm}th,td{border:1px solid #94a3b8;padding:4px 4px;text-align:center;vertical-align:top;font-variant-numeric:tabular-nums;white-space:nowrap}th{background:#dbeafe;color:#0f172a;font-weight:900;font-size:9.5px}.code{text-align:left!important}.concept{text-align:left!important;white-space:normal!important;overflow-wrap:anywhere;word-break:normal}.long-desc{margin:2px 0 0;color:#475569;font-size:8.8px;line-height:1.22;white-space:pre-wrap}.num{text-align:right!important}.cap td{background:#9fbad4!important;text-align:left!important;font-weight:900!important;border-top:2px solid #0f172a!important;border-bottom:1.5px solid #0f172a!important;white-space:normal!important;padding:4px 5px}.totals{width:68mm;margin-left:auto;margin-top:6mm}.totals div{display:flex;justify-content:space-between;border-top:2px solid #0f172a;padding:7px 0;font-size:15px}.notes-stack{display:grid;grid-template-columns:1fr;gap:4mm;margin-top:6mm;break-inside:avoid;page-break-inside:avoid}.notes-stack div{border:1px solid #cbd5e1;border-radius:7px;padding:7px 8px;background:#f8fafc}.notes-stack h3{margin:0 0 4px;font-size:11px;color:#0f2d5c}.notes-stack p{margin:0;white-space:pre-wrap;line-height:1.3;color:#334155}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:18mm;margin-top:9mm;break-inside:avoid;page-break-inside:avoid}.signature{min-height:27mm;padding-top:3px;border-top:1px solid #64748b}.signature.right{text-align:right}.signature small{display:block;color:#64748b;font-size:9px;font-weight:900;text-transform:uppercase}.signature b{display:block;margin-top:1px;font-size:11px}.signature span{display:block;margin-top:16mm;color:#64748b;font-size:9px}.empty{text-align:left!important;color:#64748b}.issuer-v87100{display:grid;grid-template-columns:31mm 1fr;gap:5mm;align-items:start}.issuer-v87100 b,.issuer-v87100 span{display:block;line-height:1.2}.issuer-logo-box-v87100{width:31mm;min-height:17mm;border:1px solid #cbd5e1;display:flex;align-items:center;justify-content:center;background:#fff}.brand-logo-v87100{max-width:29mm;max-height:18mm;object-fit:contain}.brand-logo-placeholder-v87100{font-weight:900;color:#94a3b8;font-size:9px}@media screen{html{background:#e5e7eb;padding:12px}body{width:210mm;min-height:297mm;margin:0 auto;padding:9mm;box-shadow:0 2px 18px rgba(15,23,42,.18)}}@media screen and (max-width:900px){html{padding:5px}body{transform:scale(.54);transform-origin:top left;margin:0;width:210mm;min-height:297mm}.head{grid-template-columns:1.2fr .8fr}table{font-size:9px}}@media print{html,body{background:white!important;padding:0!important}.page{width:192mm!important;min-height:279mm!important;margin:0!important;transform:none!important}}</style></head><body><section class="page"><div class="head">${issuerFiscalBlockHtml87100(client)}<div class="client-head"><h3>Client / promotor</h3><p>${thirdBlock}</p></div></div><div class="title"><div><h1>${escHtmlV8772(doc.title||"PRESSUPOST D’OBRA")}</h1><div class="title-meta">${metaLines}</div></div><div class="budget-id">${numPres?`<small>Núm. pressupost</small><b>${escHtmlV8772(numPres)}</b>`:""}${versioPres?`<small>Versió</small><b>${escHtmlV8772(versioPres)}</b>`:""}</div></div><table><colgroup><col style="width:14mm"><col style="width:8mm"><col style="width:auto"><col style="width:14mm"><col style="width:19mm"><col style="width:23mm"></colgroup><thead><tr><th>Part.</th><th>Ut</th><th>Concepte / descripció</th><th>Quant.</th><th>€/ut</th><th>Total</th></tr></thead><tbody>${body}</tbody></table><div class="totals"><div><span>TOTAL PRESSUPOST</span><b>${money(total)}</b></div></div><div class="notes-stack"><div><h3>Observacions</h3><p>${escHtmlV8772(obs)}</p></div><div><h3>Forma de pagament</h3><p>${escHtmlV8772(forma)}</p></div></div><div class="signatures"><div class="signature"><b>${escHtmlV8772(clientEmissor)}</b><span>Signatura</span></div><div class="signature right"><small>Client</small><b>${escHtmlV8772(clientPressupost)}</b><span>Signatura / conformitat</span></div></div></section></body></html>`;
}
function PressupostObraPreview878153({doc}){
  const rows=sortPartides878132(doc.rows||[]);
  const total=doc.total ?? rows.reduce((s,r)=>s+(parseNum8770(r.q)||0)*(parseNum8770(r.pu)||0),0);
  const obs=String(doc.observacions||"").trim()||"Observacions pendents d’indicar.";
  const forma=String(doc.formaPagament||"").trim()||"Forma de pagament pendent d’indicar.";
  const numPres=String(doc.numeroPressupost||"").trim();
  const ref=String(doc.referencia||"").trim();
  const obraAdr=String(doc.obraAdreca||"").trim();
  const dataPres=String(doc.dataPressupost||doc.data||"").trim();
  const versioPres=String(doc.versioPressupost||"").trim();
  let last="__none__";
  return <div className="pressupost-print-preview-v87153 pressupost-preview-v87158">
    <div className="budget-preview-head-v87158">
      <div>
        <h1>{doc.title||"PRESSUPOST D’OBRA"}</h1>
        {ref&&<p><b>Referència:</b> {ref}</p>}
        {obraAdr&&<p><b>Adreça de l’obra:</b> {obraAdr}</p>}
        {dataPres&&<p><b>Data:</b> {fmtAppDate8748(dataPres)||dataPres}</p>}
      </div>
      <div className="budget-preview-id-v87158">
        {numPres&&<><small>Núm. pressupost</small><b>{numPres}</b></>}
        {versioPres&&<><small>Versió</small><b>{versioPres}</b></>}
      </div>
    </div>
    <table><thead><tr><th>Part.</th><th>Ut</th><th>Concepte / descripció</th><th>Quant.</th><th>€/ut</th><th>Total</th></tr></thead><tbody>{rows.map((r,i)=>{const q=parseNum8770(r.q)||0, pu=parseNum8770(r.pu)||0;const cap=r.cap||"PRESSUPOST";const show=cap!==last;last=cap;return <React.Fragment key={i}>{show&&<tr className="cap-row"><td colSpan="6">{cap}</td></tr>}<tr><td className="budget-code-v87158">{r.codi}</td><td>{r.ut}</td><td className="text-left budget-concept-v87158"><b>{r.concepte}</b>{r.desc&&<small className="budget-preview-desc-v87155">{r.desc}</small>}</td><td>{qty2(q)}</td><td>{money(pu)}</td><td><b>{money(q*pu)}</b></td></tr></React.Fragment>})}</tbody><tfoot><tr><th colSpan="5">TOTAL PRESSUPOST</th><th>{money(total)}</th></tr></tfoot></table>
    <div className="budget-final-notes-v87155"><div><b>Observacions</b><p>{obs}</p></div><div><b>Forma de pagament</b><p>{forma}</p></div></div>
    <div className="budget-signatures-v878194"><div><b>{typeof doc.realitzadorPressupost==="string"?doc.realitzadorPressupost:"Client emissor"}</b><span>Signatura</span></div><div><small>Client</small><b>{doc.tercerNom||doc.clientFinalPressupost||"Client"}</b><span>Signatura / conformitat</span></div></div>
  </div>
}


function DocViewer({doc,obra,client,close,email}){
  const pf=doc.proforma;
  const agents=doc.agents||[];
  const acta=doc.acta?normalizeActa8768(doc.acta,agents):null;
  const actaPhotos=doc.actaPhotos||[];
  const actaDocs=doc.actaDocs||[];
  const assistents=acta?(acta.agentIds||[]).map(id=>agents.find(a=>a.id===id)).filter(Boolean):[];
  const printRef=useRef(null);
  const exactHtml878193=doc.type==="certificacio"&&doc.rows?certPrintHtmlV8772(doc,obra,client):doc.type==="proforma"&&doc.proforma?proformaPrintHtml8783(doc,obra,client):doc.type==="pressupostobra"&&doc.rows?pressupostObraPrintHtml878153(doc,obra,client):doc.type==="pressuposttecnic"?quotePrintHtml8745("pressupost",doc,obra):doc.type==="facturatecnica"?quotePrintHtml8745("factura",doc,obra):null;
  function htmlForCurrentDoc(){
    if(exactHtml878193)return exactHtml878193;
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
      if(exactHtml878193){if(printHtmlInPlace878112(exactHtml878193,doc.title||"Document"))return;}
      if(doc.type==="certificacio"&&doc.rows){if(printHtmlInPlace878112(certPrintHtmlV8772(doc,obra,client),doc.title||"Certificació"))return;}
      if(doc.type==="proforma"&&doc.proforma){if(printHtmlInPlace878112(proformaPrintHtml8783(doc,obra,client),doc.title||"Factura proforma"))return;}
      if(doc.type==="pressupostobra"&&doc.rows){if(printHtmlInPlace878112(pressupostObraPrintHtml878153(doc,obra,client),doc.title||"Pressupost d’obra"))return;}
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
    if(exactHtml878193){
      win.document.open();
      win.document.write(exactHtml878193+`<script>setTimeout(()=>{window.focus();window.print();},450)<\/script>`);
      win.document.close();
      return;
    }
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
    if(doc.type==="pressupostobra"&&doc.rows){
      win.document.open();
      win.document.write(pressupostObraPrintHtml878153(doc,obra,client)+`<script>setTimeout(()=>{window.focus();window.print();},450)<\/script>`);
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
      {exactHtml878193?<ExactHtmlPreview878193 html={exactHtml878193} title={doc.title||"Document"}/>:<div className="document-page modern-acta-page">
        {doc.type!=="acta"&&doc.type!=="certificacio"&&doc.type!=="proforma"&&<div className="cert-header-pro">
          <div>{client?.logo?<img className="doc-logo" src={client.logo}/>:<div className="fake-logo">LOGO</div>}<h3>{client?.rao||client?.nom||"Despatx tècnic"}</h3><p>NIF: {client?.nif||"Pendent"}<br/>Adreça: {client?.adreca||"Pendent"}<br/>{client?.email||""}<br/>{client?.telefon||""}</p></div>
          <div><h3>{obra?.propietat||client?.nom||"Client"}</h3><p>NIF: {obra?.nifPropietat||"Pendent"}<br/>{obra?.adreca||""}<br/>{obra?.poblacio||""}</p></div>
        </div>}
        {doc.type==="certificacio"&&doc.rows?<CertPreviewV8772 doc={doc}/>:doc.type==="acta"&&acta?<ActaFormalPreview8768 obra={obra} client={client} acta={acta} agents={assistents} fotos={actaPhotos} docs={actaDocs}/>:doc.type==="proforma"&&pf?<ProformaPrintV81 doc={doc} pf={pf}/>:doc.type==="pressupostobra"&&doc.rows?<PressupostObraPreview878153 doc={doc}/>:<div className="doc-box"><strong>Vista prèvia del document</strong><span>El document original queda registrat al llistat. La previsualització real del PDF necessita Storage/backend.</span></div>}
      </div>}
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
