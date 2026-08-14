// V87.232 · Recalcula els descompostos com una cadena de càlcul real.
// Les files de recurs actualitzen rendiment × preu, les files percentuals
// s'apliquen sobre la base acumulada i els subtotals/finals deixen de conservar
// imports antics procedents de l'Excel.

export function parseBreakdownNumberV87232(value){
  const raw=String(value??"").trim().replace(/\s/g,"").replace(/€/g,"");
  if(!raw)return 0;
  const normalized=raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw;
  const number=Number(normalized);
  return Number.isFinite(number)?number:0;
}

export function formatBreakdownNumberV87232(value){
  return new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(parseBreakdownNumberV87232(value));
}

function normalizedLabelV87232(value){
  return String(value??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
}

function isFinalRowV87232(row={}){
  const label=normalizedLabelV87232(row.concepte);
  return /\b(preu|precio)\s+(unitari|unitario)\s+(final|total)\b/.test(label)
    || /\b(preu|precio)\s+final\b/.test(label)
    || /\btotal\s+(descompost|descomposat|final)\b/.test(label);
}

function isPercentageRowV87232(row={}){
  const label=normalizedLabelV87232(row.concepte);
  const unit=normalizedLabelV87232(row.ut);
  return unit.includes("%")
    || /\b(costos?|costes?)\s+indirect/.test(label)
    || /\bdespeses?\s+generals?\b/.test(label)
    || /\bbenefici\s+industrial\b/.test(label)
    || /\bmarge\b/.test(label)
    || /\bimprevist/.test(label)
    || /\bcomplementari/.test(label) && /\bcost/.test(label);
}

function isSubtotalRowV87232(row={}){
  const label=normalizedLabelV87232(row.concepte);
  return /^(subtotal|costos?\s+directes?|costes?\s+directos?|cost\s+directe|coste\s+directo)\b/.test(label)
    || /\bsubtotal\s+(descompost|descomposat|recursos?|materials?|ma d obra)\b/.test(label);
}

function percentageFactorV87232(row,base){
  const q=parseBreakdownNumberV87232(row.q);
  const unit=normalizedLabelV87232(row.ut);
  if(unit.includes("%"))return q/100;

  // Alguns Excels guarden 3 % com a 0,03 i d'altres com a 3. Si la fila
  // anterior ja tenia import, en conservem la convenció que encaixa millor.
  const oldTotal=parseBreakdownNumberV87232(row.total);
  const oldBase=parseBreakdownNumberV87232(row.pu)||base;
  if(oldTotal&&oldBase&&q){
    const asCoefficient=Math.abs(oldTotal-oldBase*q);
    const asPercent=Math.abs(oldTotal-oldBase*q/100);
    if(asPercent+0.000001<asCoefficient)return q/100;
    if(asCoefficient+0.000001<asPercent)return q;
  }
  return Math.abs(q)>1?q/100:q;
}

export function recalculateBreakdownTableV87232(table={}){
  const sourceRows=Array.isArray(table?.rows)?table.rows:[];
  let runningTotal=0;
  let finalTotal=0;

  const rows=sourceRows.map((original,index)=>{
    const row={...(original||{})};
    if(row.isSection)return row;

    const finalRow=isFinalRowV87232(row);
    const percentageRow=!finalRow&&isPercentageRowV87232(row);
    const subtotalRow=!finalRow&&!percentageRow&&isSubtotalRowV87232(row);
    const q=parseBreakdownNumberV87232(row.q);
    const pu=parseBreakdownNumberV87232(row.pu);
    const hasQ=String(row.q??"").trim()!=="";
    const hasPu=String(row.pu??"").trim()!=="";
    let lineTotal=parseBreakdownNumberV87232(row.total);

    if(finalRow){
      lineTotal=runningTotal;
      row.q=row.q||"1,00";
      row.pu=formatBreakdownNumberV87232(lineTotal);
      row.total=formatBreakdownNumberV87232(lineTotal);
      row.calculatedKind878232="final";
      finalTotal=lineTotal;
      return row;
    }

    if(percentageRow){
      const base=runningTotal;
      const factor=percentageFactorV87232(row,base);
      lineTotal=base*factor;
      row.pu=formatBreakdownNumberV87232(base);
      row.total=formatBreakdownNumberV87232(lineTotal);
      row.calculatedKind878232="percentage";
      row.percentFactor878232=factor;
      runningTotal+=lineTotal;
      finalTotal=runningTotal;
      return row;
    }

    if(subtotalRow){
      lineTotal=runningTotal;
      row.total=formatBreakdownNumberV87232(lineTotal);
      row.calculatedKind878232="subtotal";
      finalTotal=runningTotal;
      return row;
    }

    if(!row.manualTotal878232&&hasQ&&hasPu)lineTotal=q*pu;
    row.total=formatBreakdownNumberV87232(lineTotal);
    row.calculatedKind878232="resource";
    runningTotal+=lineTotal;
    finalTotal=runningTotal;
    return row;
  });

  return {
    table:{...table,rows,recalculatedAt878232:new Date().toISOString()},
    total:finalTotal,
    lines:rows.filter(row=>!row?.isSection&&!isFinalRowV87232(row)&&!isSubtotalRowV87232(row)).length
  };
}

