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
  const match=text.match(/^(\d{1,3}(?:[.,]\d{1,3}){0,2})\s*(?:[-–—:·]\s*|\s{2,})(.+)$/);
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

function chapterCodeFromSubchapterV87227(code){
  return normalizedHierarchyCodeV87226(code).split(".")[0]||"";
}

function scopeInfoV87227(label){
  const heading=parseBudgetHierarchyHeadingV87226(label);
  return {code:heading?.code||"",title:heading?.title||cleanHierarchyTextV87226(label)};
}

function cleanScopeTitleV87227(title){
  return cleanHierarchyTextV87226(title).replace(/^REHABILITACI[ÓO]\s+DE\s+/i,"").trim();
}

function chapterGroupsFromHeadingsV87227(headings){
  const groups=new Map();
  headings.forEach(heading=>{
    const chapterCode=chapterCodeFromSubchapterV87227(heading.code);
    const key=`${heading.mainChapter||""}__${chapterCode}`;
    if(!groups.has(key))groups.set(key,{key,scope:heading.mainChapter||"",chapterCode,headings:[]});
    groups.get(key).headings.push(heading);
  });

  const byScope=new Map();
  groups.forEach(group=>{
    if(!byScope.has(group.scope))byScope.set(group.scope,[]);
    byScope.get(group.scope).push(group);
  });

  byScope.forEach(scopeGroups=>{
    scopeGroups.sort((a,b)=>String(a.chapterCode).localeCompare(String(b.chapterCode),"ca",{numeric:true}));
    const workGroups=scopeGroups.filter(group=>group.chapterCode!=="00");
    const info=scopeInfoV87227(scopeGroups[0]?.scope||"");
    const scopeTitle=cleanScopeTitleV87227(info.title);
    const scopeParts=scopeTitle.split(/\s+I\s+/i).map(cleanHierarchyTextV87226).filter(Boolean);
    const canAssignScopeParts=workGroups.length>1&&scopeParts.length===workGroups.length;

    scopeGroups.forEach(group=>{
      const childTitles=group.headings.map(heading=>cleanHierarchyTextV87226(heading.title)).filter(Boolean);
      let title="";
      if(group.chapterCode==="00"){
        title="TREBALLS PREVIS";
      }else if(canAssignScopeParts){
        title=scopeParts[workGroups.indexOf(group)]||"";
      }else if(childTitles.length===1){
        title=childTitles[0];
      }else if(String(info.code).padStart(2,"0")===String(group.chapterCode).padStart(2,"0")){
        title=info.title;
      }else{
        title=info.title||childTitles[0]||"CAPÍTOL";
      }
      group.title=cleanHierarchyTextV87226(title)||"CAPÍTOL";
      group.label=`${group.chapterCode} · ${group.title}`;
    });
  });
  return groups;
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

  const chapterGroups=chapterGroupsFromHeadingsV87227(headings);

  let inferredCaps=0;
  let repaired=(parsedRows||[]).map(row=>{
    const parentCode=budgetParentCodeFromItemV87226(row?.codi);
    const sourceRow=Number.isFinite(+row?.excelSourceRow)?+row.excelSourceRow:Number.MAX_SAFE_INTEGER;
    const heading=parentCode?nearestHeadingForItemV87226(headings,parentCode,sourceRow):null;
    const currentCap=cleanHierarchyTextV87226(row?.cap)||DEFAULT_IMPORTED_CHAPTER_V87226;
    const currentHeading=parseBudgetHierarchyHeadingV87226(currentCap);
    let cap=currentCap;
    let scopePrincipal=cleanHierarchyTextV87226(row?.scopePrincipal||row?.excelScope)||heading?.mainChapter||"";
    let capPrincipal=cleanHierarchyTextV87226(row?.capPrincipal)||"";
    let hierarchySource="excel";
    const chapterCode=chapterCodeFromSubchapterV87227(parentCode);
    const chapterGroup=chapterGroups.get(`${heading?.mainChapter||scopePrincipal}__${chapterCode}`);

    if(heading){
      cap=heading.label;
      scopePrincipal=heading.mainChapter||scopePrincipal;
      capPrincipal=chapterGroup?.label||`${chapterCode} · CAPÍTOL`;
      hierarchySource="encapçalament";
    }else if(parentCode&&(currentCap===DEFAULT_IMPORTED_CHAPTER_V87226||currentHeading?.depth===1)){
      cap=`${parentCode} · SUBCAPÍTOL INFERIT`;
      capPrincipal=`${chapterCode} · CAPÍTOL INFERIT`;
      hierarchySource="numeració partida";
      inferredCaps++;
    }

    const capHeading=parseBudgetHierarchyHeadingV87226(cap);
    const capCode=capHeading?.code||parentCode||"";
    const subcap=cap;
    const capPath=[scopePrincipal,capPrincipal,subcap].filter(Boolean);
    return {...row,cap,capCode,chapterCode,scopePrincipal,excelScope:scopePrincipal,capPrincipal,subcap,capPath,hierarchySource};
  });

  const parentsBySubcap=new Map();
  repaired.forEach(row=>{
    const label=cleanHierarchyTextV87226(row.subcap||row.cap);
    if(!parentsBySubcap.has(label))parentsBySubcap.set(label,new Set());
    parentsBySubcap.get(label).add(`${cleanHierarchyTextV87226(row.scopePrincipal)}__${cleanHierarchyTextV87226(row.capPrincipal)}`);
  });
  repaired=repaired.map(row=>{
    const subcap=cleanHierarchyTextV87226(row.subcap||row.cap);
    const parents=parentsBySubcap.get(subcap);
    if(!row.capPrincipal||!parents||parents.size<2)return row;
    const scopeCode=parseBudgetHierarchyHeadingV87226(row.scopePrincipal)?.code||row.scopePrincipal||row.capPrincipal;
    const cap=`${scopeCode} / ${subcap}`;
    return {...row,cap,capPath:[row.scopePrincipal,row.capPrincipal,subcap].filter(Boolean)};
  });

  const capLabels=[...new Set(repaired.map(row=>cleanHierarchyTextV87226(row.cap)).filter(Boolean))];
  const usedMainLabels=[...new Set(repaired.map(row=>`${cleanHierarchyTextV87226(row.scopePrincipal)}__${cleanHierarchyTextV87226(row.capPrincipal)}`).filter(label=>!label.endsWith("__")))];
  const usedScopes=[...new Set(repaired.map(row=>cleanHierarchyTextV87226(row.scopePrincipal)).filter(Boolean))];
  return {
    rows:repaired,
    caps:capLabels.length,
    scopes:usedScopes.length||mainLabels.size,
    mainCaps:usedMainLabels.length,
    subCaps:capLabels.length,
    inferredCaps,
    headings:headings.length,
  };
}

export function importedBudgetHierarchyLabelV87226(parsed){
  const scopes=+parsed?.scopes||0;
  const main=+parsed?.mainCaps||0;
  const sub=+parsed?.subCaps||+parsed?.caps||0;
  if(scopes&&main&&sub)return `${scopes} àmbit/s · ${main} capítol/s · ${sub} subcapítol/s`;
  if(main&&sub)return `${main} capítol/s · ${sub} subcapítol/s`;
  return `${sub||1} capítol/s`;
}
