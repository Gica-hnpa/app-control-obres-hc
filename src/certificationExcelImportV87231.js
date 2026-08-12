function textV87231(value){return String(value??"").replace(/\s+/g," ").trim()}
function numberV87231(value){
  if(typeof value==="number"&&Number.isFinite(value))return value;
  const raw=String(value??"").trim();
  if(!raw)return 0;
  const cleaned=raw.replace(/\s/g,"").replace(/€/g,"");
  const normalized=cleaned.includes(",")
    ? cleaned.replace(/\./g,"").replace(",",".")
    : cleaned;
  const parsed=Number(normalized.replace(/[^0-9+\-.]/g,""));
  return Number.isFinite(parsed)?parsed:0;
}
function normalizedTextV87231(value){
  return textV87231(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function normalizedCodeV87231(value){return normalizedTextV87231(value).replace(/\s+/g,"")}
function dateFromCertificationTitleV87231(value){
  const title=textV87231(value);
  const inside=(title.match(/\(([^)]+)\)/)?.[1]||title);
  const digits=inside.replace(/\D/g,"").slice(-6);
  if(digits.length!==6)return "";
  const day=Number(digits.slice(0,2)),month=Number(digits.slice(2,4)),year=2000+Number(digits.slice(4,6));
  if(day<1||day>31||month<1||month>12)return "";
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function cellFillV87231(cell={}){
  const fg=cell?.s?.fill?.fgColor||cell?.s?.fgColor||{};
  const rgb=String(fg.rgb||"").toUpperCase();
  const theme=Number(fg.theme);
  const explicitRed=rgb==="FFFF0000"||rgb==="FF0000";
  return {rgb,theme,explicitRed,extra:theme===5&&!explicitRed};
}
function sheetMatrixV87231(XLSX,worksheet){
  return XLSX.utils.sheet_to_json(worksheet,{header:1,defval:"",raw:true,blankrows:true});
}
function findMainSheetV87231(workbook,XLSX){
  const exact=(workbook.SheetNames||[]).find(name=>/^quadre$/i.test(textV87231(name)));
  if(exact)return exact;
  return (workbook.SheetNames||[]).find(name=>{
    const rows=sheetMatrixV87231(XLSX,workbook.Sheets[name]).slice(0,12);
    return rows.some(row=>normalizedTextV87231(row?.[0]).includes("codigo")||normalizedTextV87231(row?.[0]).includes("codi"))
      && rows.some(row=>row.some(value=>/certificaci[oó]n?/i.test(textV87231(value))));
  })||workbook.SheetNames?.[0]||"";
}
function chapterLabelV87231(code,concept){return [textV87231(code),textV87231(concept)].filter(Boolean).join(" ")}
function looksLikeChapterV87231(code,unit,concept,q,pu){
  if(!code||unit||!concept)return false;
  if(Math.abs(numberV87231(q))>0.000001||Math.abs(numberV87231(pu))>0.000001)return false;
  return /^[A-Za-z]?\d{1,3}(?:[.,]\d{1,3})*$/.test(code.replace(/\s/g,""));
}
function detectBlocksV87231(rows,headerIndex){
  const blocks=[];
  const from=Math.max(0,headerIndex-4),to=headerIndex;
  for(let rowIndex=from;rowIndex<to;rowIndex++){
    const row=rows[rowIndex]||[];
    row.forEach((value,start)=>{
      const match=textV87231(value).match(/CERTIFICACI[ÓO]N?\s*(\d+)/i);
      if(!match)return;
      const numero=Number(match[1]);
      if(!numero||blocks.some(block=>block.numero===numero))return;
      blocks.push({numero,start,date:dateFromCertificationTitleV87231(value),title:textV87231(value)});
    });
  }
  return blocks.sort((a,b)=>a.numero-b.numero);
}
function sameSheetFormulaRowsV87231(formula,targetColumn){
  const value=String(formula||"");
  const refs=[];
  const pattern=/(?:((?:'[^']+'|[A-Za-z0-9_ ]+))!)?\$?([A-Z]{1,3})\$?(\d+)(?:\s*:\s*\$?([A-Z]{1,3})\$?(\d+))?/g;
  let match;
  while((match=pattern.exec(value))){
    if(match[1])continue;
    const col1=match[2],row1=Number(match[3]),col2=match[4]||col1,row2=Number(match[5]||row1);
    if(col1!==targetColumn||col2!==targetColumn)continue;
    for(let row=Math.min(row1,row2);row<=Math.max(row1,row2)&&row-row1<1000;row++)refs.push(row);
  }
  return [...new Set(refs)];
}
function formulaLeafRowsV87231(worksheet,XLSX,columnIndex,totalRow){
  const column=XLSX.utils.encode_col(columnIndex);
  const leaves=new Set(),visiting=new Set();
  function visit(rowNumber){
    if(!rowNumber||visiting.has(rowNumber))return;
    visiting.add(rowNumber);
    const cell=worksheet[`${column}${rowNumber}`];
    const refs=sameSheetFormulaRowsV87231(cell?.f,column).filter(row=>row!==rowNumber);
    if(refs.length)refs.forEach(visit);
    else leaves.add(rowNumber);
    visiting.delete(rowNumber);
  }
  visit(totalRow);
  return leaves;
}
function findCertificationTotalRowV87231(worksheet,XLSX,blocks,headerIndex,rows){
  let best=null;
  for(let rowIndex=headerIndex+1;rowIndex<Math.min(rows.length,600);rowIndex++){
    const emptyIdentity=!textV87231(rows[rowIndex]?.[0])&&!textV87231(rows[rowIndex]?.[1]);
    if(!emptyIdentity)continue;
    const count=blocks.filter(block=>{
      const cell=worksheet[XLSX.utils.encode_cell({r:rowIndex,c:block.start+2})];
      return cell&&Number.isFinite(numberV87231(cell.v))&&String(cell.f||"").trim();
    }).length;
    if(count>=Math.max(2,Math.ceil(blocks.length*.6))&&(!best||count>best.count||(count===best.count&&rowIndex>best.rowIndex)))best={rowIndex,count};
  }
  return best?.rowIndex??-1;
}
function findBudgetTotalV87231(worksheet,XLSX,headerIndex,rows){
  let result=0;
  for(let rowIndex=headerIndex+1;rowIndex<Math.min(rows.length,600);rowIndex++){
    const cell=worksheet[XLSX.utils.encode_cell({r:rowIndex,c:5})];
    if(!cell||!String(cell.f||"").trim())continue;
    if(textV87231(rows[rowIndex]?.[0])||textV87231(rows[rowIndex]?.[1]))continue;
    const value=numberV87231(cell.v);
    if(value>0)result=value;
  }
  return result;
}

export function parseCertificationWorkbookV87231(workbook,XLSX){
  const sheetName=findMainSheetV87231(workbook,XLSX);
  if(!sheetName)throw new Error("No s'ha trobat cap full de certificacions.");
  const worksheet=workbook.Sheets[sheetName];
  const rows=sheetMatrixV87231(XLSX,worksheet);
  const headerIndex=rows.findIndex(row=>{
    const first=normalizedTextV87231(row?.[0]);
    return first==="codigo"||first==="codi"||first.startsWith("codigo ")||first.startsWith("codi ");
  });
  if(headerIndex<0)throw new Error("No s'ha trobat la capçalera Código/Codi del quadre principal.");
  const blocks=detectBlocksV87231(rows,headerIndex);
  if(!blocks.length)throw new Error("No s'han detectat columnes de certificació al quadre.");
  const totalRowIndex=findCertificationTotalRowV87231(worksheet,XLSX,blocks,headerIndex,rows);
  const includedRowsByCert=Object.fromEntries(blocks.map(block=>[String(block.numero),totalRowIndex>=0?formulaLeafRowsV87231(worksheet,XLSX,block.start+2,totalRowIndex+1):new Set()]));
  const items=[];
  let currentChapter="Sense capítol";
  let ignoredSummaryRows=0;
  for(let rowIndex=headerIndex+1;rowIndex<Math.min(rows.length,600);rowIndex++){
    const row=rows[rowIndex]||[];
    const code=textV87231(row[0]),unit=textV87231(row[1]),concept=textV87231(row[2]);
    if(looksLikeChapterV87231(code,unit,concept,row[3],row[4])){
      currentChapter=chapterLabelV87231(code,concept);
      continue;
    }
    if(!code||!unit||!concept){
      if(row.some(value=>textV87231(value)))ignoredSummaryRows++;
      continue;
    }
    if(/^(total|subtotal|resum|resumen)\b/i.test(normalizedTextV87231(concept))){ignoredSummaryRows++;continue;}
    const sourceCell=worksheet[XLSX.utils.encode_cell({r:rowIndex,c:0})];
    const fill=cellFillV87231(sourceCell);
    const certs={};
    blocks.forEach(block=>{
      const included=includedRowsByCert[String(block.numero)];
      const official=!included?.size||included.has(rowIndex+1);
      const quantity=official?numberV87231(row[block.start+1]):0;
      const amount=official?numberV87231(row[block.start+2]):0;
      const originQuantity=numberV87231(row[block.start+3]);
      const originAmount=numberV87231(row[block.start+5]);
      certs[String(block.numero)]={quantity,amount,originQuantity,originAmount};
    });
    items.push({
      sourceRow:rowIndex+1,
      code,unit,concept,chapter:currentChapter,
      budgetQuantity:numberV87231(row[3]),
      budgetUnitPrice:numberV87231(row[4]),
      budgetAmount:numberV87231(row[5]),
      certs,
      extraCandidate:fill.extra,
      warningRed:fill.explicitRed,
      fill
    });
  }
  const certifications=blocks.map(block=>({
    numero:block.numero,
    date:block.date,
    title:block.title,
    total:totalRowIndex>=0?numberV87231(rows[totalRowIndex]?.[block.start+2]):items.reduce((sum,item)=>sum+numberV87231(item.certs[String(block.numero)]?.amount),0),
    totalOrigin:totalRowIndex>=0?numberV87231(rows[totalRowIndex]?.[block.start+5]):items.reduce((sum,item)=>sum+numberV87231(item.certs[String(block.numero)]?.originAmount),0),
    itemCount:items.filter(item=>Math.abs(numberV87231(item.certs[String(block.numero)]?.amount))>0.000001||Math.abs(numberV87231(item.certs[String(block.numero)]?.quantity))>0.000001).length
  }));
  return {
    sheetName,
    headerRow:headerIndex+1,
    items,
    certifications,
    ignoredSummaryRows,
    budgetTotal:findBudgetTotalV87231(worksheet,XLSX,headerIndex,rows)||items.reduce((sum,item)=>sum+(item.budgetAmount||item.budgetQuantity*item.budgetUnitPrice),0),
    extraCount:items.filter(item=>item.extraCandidate).length,
    warningCount:items.filter(item=>item.warningRed).length
  };
}

function similarityV87231(a,b){
  const left=new Set(normalizedTextV87231(a).split(" ").filter(token=>token.length>2));
  const right=new Set(normalizedTextV87231(b).split(" ").filter(token=>token.length>2));
  if(!left.size||!right.size)return 0;
  const common=[...left].filter(token=>right.has(token)).length;
  return common/Math.max(left.size,right.size);
}

export function matchCertificationItemsV87231(parsed,currentRows=[]){
  const rows=(currentRows||[]).map((row,index)=>({row,index,code:normalizedCodeV87231(row.codi),concept:normalizedTextV87231(row.concepte)}));
  const used=new Set();
  const matches=[],newExtras=[],unmatched=[],warnings=[];
  parsed.items.forEach(source=>{
    if(source.warningRed){warnings.push({...source,status:"warning"});return;}
    const code=normalizedCodeV87231(source.code),concept=normalizedTextV87231(source.concept);
    let candidates=rows.filter(entry=>!used.has(entry.index)&&entry.code===code&&entry.concept===concept);
    if(candidates.length!==1)candidates=rows.filter(entry=>!used.has(entry.index)&&entry.concept===concept);
    if(candidates.length!==1){
      const sameCode=rows.filter(entry=>!used.has(entry.index)&&entry.code===code);
      if(sameCode.length===1)candidates=sameCode;
    }
    if(candidates.length!==1){
      const similar=rows.filter(entry=>!used.has(entry.index)).map(entry=>({...entry,score:similarityV87231(source.concept,entry.row.concepte)})).filter(entry=>entry.score>=0.84).sort((a,b)=>b.score-a.score);
      if(similar.length===1||(similar[0]&&similar[0].score>(similar[1]?.score||0)+0.12))candidates=[similar[0]];
    }
    if(candidates.length===1&&candidates[0]){
      used.add(candidates[0].index);
      matches.push({source,target:candidates[0].row,targetIndex:candidates[0].index,status:"matched"});
    }else if(source.extraCandidate){newExtras.push({...source,status:"extra"});}
    else unmatched.push({...source,status:"unmatched"});
  });
  return {matches,newExtras,unmatched,warnings};
}

export const certificationImportTextV87231={normalizedTextV87231,normalizedCodeV87231};
