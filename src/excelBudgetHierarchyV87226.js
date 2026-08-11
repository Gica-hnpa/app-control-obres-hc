const DEFAULT_IMPORTED_CHAPTER_V87226="PRESSUPOST IMPORTAT";

function cleanHierarchyTextV87226(value){
  return String(value??"").replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
}

function normalizedHierarchyCodeV87226(value){
  return cleanHierarchyTextV87226(value).replace(/,/g,".").split(".").map(part=>part.trim()).filter(Boolean).join(".");
}

export function parseBudgetHierarchyHeadingV87226(value){
  const text=cleanHierarchyTextV87226(value);
  if(!text)return null;
  const match=text.match(/^(\d{1,3}(?:[.,]\d{1,3}){0,2})\s*(?:[-–—:]\s*|\s{2,})(.+)$/);
  if(!match)return null;
  const code=normalizedHierarchyCodeV87226(match[1]);
  const title=cleanHierarchyTextV87226(match[2]);
  const depth=code.split(".").length;
  if(!title||depth>2)return null;
  return {code,title,depth,label:`${code} · ${title}`};
}

export function budgetParentCodeFromItemV87226(value){
  const text=cleanHierarchyTextV87226(value).replace(/,/g,".");
  const match=text.match(/\d{1,3}(?:\.\d{1,3}){1,5}/);
  if(!match)return "";
  const parts=match[0].split(".").filter(Boolean);
  if(parts.length<2)return "";
  return parts.slice(0,-1).join(".");
}

function firstHierarchyHeadingInRowV87226(row){
  for(const value of (row||[])){
    const heading=parseBudgetHierarchyHeadingV87226(value);
    if(heading)return heading;
  }
  return null;
}

function nearestHeadingForItemV87226(headings,code,sourceRow){
  const candidates=headings.filter(entry=>entry.code===code);
  if(!candidates.length)return null;
  const before=candidates.filter(entry=>entry.rowIndex<=sourceRow);
  if(before.length)return before.reduce((best,entry)=>entry.rowIndex>best.rowIndex?entry:best);
  return candidates[0];
}

export function repairImportedBudgetHierarchyV87226(rawRows=[],parsedRows=[]){
  const headings=[];
  const mainLabels=new Set();
  let currentMain="";

  (rawRows||[]).forEach((row,rowIndex)=>{
    const heading=firstHierarchyHeadingInRowV87226(row);
    if(!heading)return;
    if(heading.depth===1){
      currentMain=heading.label;
      mainLabels.add(currentMain);
      return;
    }
    headings.push({...heading,rowIndex,mainChapter:currentMain});
  });

  let inferredCaps=0;
  let repaired=(parsedRows||[]).map(row=>{
    const parentCode=budgetParentCodeFromItemV87226(row?.codi);
    const sourceRow=Number.isFinite(+row?.excelSourceRow)?+row.excelSourceRow:Number.MAX_SAFE_INTEGER;
    const heading=parentCode?nearestHeadingForItemV87226(headings,parentCode,sourceRow):null;
    const currentCap=cleanHierarchyTextV87226(row?.cap)||DEFAULT_IMPORTED_CHAPTER_V87226;
    const currentHeading=parseBudgetHierarchyHeadingV87226(currentCap);
    let cap=currentCap;
    let capPrincipal=cleanHierarchyTextV87226(row?.capPrincipal)||heading?.mainChapter||"";
    let hierarchySource="excel";

    if(heading){
      cap=heading.label;
      capPrincipal=heading.mainChapter||capPrincipal;
      hierarchySource="encapçalament";
    }else if(parentCode&&(currentCap===DEFAULT_IMPORTED_CHAPTER_V87226||currentHeading?.depth===1)){
      cap=`${parentCode} · CAPÍTOL INFERIT`;
      hierarchySource="numeració partida";
      inferredCaps++;
    }

    const capHeading=parseBudgetHierarchyHeadingV87226(cap);
    const capCode=capHeading?.code||parentCode||"";
    const capPath=[capPrincipal,cap].filter(Boolean);
    return {...row,cap,capCode,capPrincipal,subcap:cap,capPath,hierarchySource};
  });

  const parentsBySubcap=new Map();
  repaired.forEach(row=>{
    const label=cleanHierarchyTextV87226(row.subcap||row.cap);
    if(!parentsBySubcap.has(label))parentsBySubcap.set(label,new Set());
    parentsBySubcap.get(label).add(cleanHierarchyTextV87226(row.capPrincipal));
  });
  repaired=repaired.map(row=>{
    const subcap=cleanHierarchyTextV87226(row.subcap||row.cap);
    const parents=parentsBySubcap.get(subcap);
    if(!row.capPrincipal||!parents||parents.size<2)return row;
    const mainCode=parseBudgetHierarchyHeadingV87226(row.capPrincipal)?.code||row.capPrincipal;
    const cap=`${mainCode} / ${subcap}`;
    return {...row,cap,capPath:[row.capPrincipal,subcap]};
  });

  const capLabels=[...new Set(repaired.map(row=>cleanHierarchyTextV87226(row.cap)).filter(Boolean))];
  const usedMainLabels=[...new Set(repaired.map(row=>cleanHierarchyTextV87226(row.capPrincipal)).filter(Boolean))];
  return {
    rows:repaired,
    caps:capLabels.length,
    mainCaps:usedMainLabels.length||mainLabels.size,
    subCaps:capLabels.length,
    inferredCaps,
    headings:headings.length,
  };
}

export function importedBudgetHierarchyLabelV87226(parsed){
  const main=+parsed?.mainCaps||0;
  const sub=+parsed?.subCaps||+parsed?.caps||0;
  if(main&&sub)return `${main} capítol/s principal/s · ${sub} subcapítol/s`;
  return `${sub||1} capítol/s`;
}
