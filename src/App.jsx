
import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {Save,Printer,Mail,Plus,FolderOpen,CalendarDays,Users,Settings} from "lucide-react";
import "./styles.css";

const euro=n=>new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0)+" €";
const num=n=>new Intl.NumberFormat("ca-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const pct=n=>(Number(n)||0).toFixed(1)+"%";
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??f}catch(e){return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const groupBy=(arr,k)=>arr.reduce((a,x)=>((a[x[k]]??=[]).push(x),a),{});
const gmailSendV52=(subject,body,to="")=>window.open("https://mail.google.com/mail/?view=cm&fs=1&to="+encodeURIComponent(to)+"&su="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body),"_blank");

const demoObra={
  id:"maricel",nom:"VERTICAL TREK ESPAÑA, S.L. · MARICEL",client:"SOCOTERM",estat:"En procés",pressupost:64485.17,
  partides:[
    {cap:"02 MITJANS AUXILIARS",codi:"02.01",ut:"m²",concepte:"BASTIDA",q:519.75,pu:16.50},
    {cap:"03 TREBALLS PREVIS",codi:"03.01",ut:"m²",concepte:"NETEJAR I SANEJAT",q:756.40,pu:2.60},
    {cap:"03 TREBALLS PREVIS",codi:"03.02",ut:"m²",concepte:"REPARACIÓ ESQUERDES",q:12.00,pu:56.74},
    {cap:"04 REMAT MURETS TERRASSES I BALCONS",codi:"04.01",ut:"m²",concepte:"INTERVENCIÓ MURET PERIMETRAL",q:369.41,pu:84.52},
    {cap:"05 FAÇANES",codi:"05.01",ut:"m²",concepte:"PINTURA A FAÇANES",q:105.80,pu:17.20},
    {cap:"05 FAÇANES",codi:"05.02",ut:"h",concepte:"ANTIFISSURES A FAÇANES",q:297.21,pu:65.80},
    {cap:"10 FEINES FORA PRESSUPOST",codi:"10.01",ut:"m²",concepte:"REPICAT REVESTIMENTS MAL ADHERITS",q:25.80,pu:25.70}
  ],
  certs:[{id:"c1",numero:1,data:"2026-05-12"},{id:"c2",numero:2,data:"2026-06-18"}],
  certLines:{"1":{"02.01":103.95,"03.01":212.32,"03.02":12,"04.01":21.80,"05.01":50.60,"05.02":86.28,"10.01":0},"2":{"10.01":25.80}}
};

function certAmount(obra,n){
  const lines=obra.certLines[String(n)]||{};
  return obra.partides.reduce((s,p)=>s+(Number(lines[p.codi])||0)*p.pu,0);
}

function App(){
  const[db,setDb]=useState(()=>read("aco_v51_db",{obres:[demoObra],config:{email:"",iva:"21",retencio:"0"},clients:[{id:"socoterm",nom:"SOCOTERM",email:"info@socoterm.com"}]}));
  const[screen,setScreen]=useState("Obres");
  const[tab,setTab]=useState("Certificacions");
  useEffect(()=>write("aco_v51_db",db),[db]);
  const obra=db.obres[0];
  const updateObra=patch=>setDb(d=>({...d,obres:d.obres.map(o=>o.id===obra.id?{...o,...patch}:o)}));
  return <div className="app">
    <aside className="side"><div className="brand"><b>CONTROL D'OBRES</b><span>V52 proposta</span></div>
      <button className={screen==="Obres"?"active":""} onClick={()=>setScreen("Obres")}><FolderOpen/> Obres</button>
      <button className={screen==="Calendari"?"active":""} onClick={()=>setScreen("Calendari")}><CalendarDays/> Calendari</button>
      <button className={screen==="Clients"?"active":""} onClick={()=>setScreen("Clients")}><Users/> Clients</button>
      <button className={screen==="Configuracio"?"active":""} onClick={()=>setScreen("Configuracio")}><Settings/> Configuració</button>
    </aside>
    <main><header><h1>{screen==="Obres"?obra.nom:screen}</h1><span>{obra.client} · {obra.estat}</span></header>
      {screen==="Obres"&&<Obra obra={obra} tab={tab} setTab={setTab} updateObra={updateObra} config={db.config}/>}
      {screen==="Calendari"&&<Card title="Calendari"><p>Base estable preparada per reconnectar agenda.</p></Card>}
      {screen==="Clients"&&<Clients db={db}/>}
      {screen==="Configuracio"&&<Configuracio db={db} setDb={setDb}/>}
    </main>
  </div>
}

function Card({title,children,action}){return <section className="card"><div className="card-head"><h2>{title}</h2>{action}</div><div className="card-body">{children}</div></section>}

function Obra({obra,tab,setTab,updateObra,config}){
  const tabs=["Resum","Certificacions","Honoraris / Temps","Facturació","Documents"];
  return <div><div className="tabs">{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</div>
    {tab==="Resum"&&<Resum obra={obra}/>}
    {tab==="Certificacions"&&<Certificacions obra={obra} updateObra={updateObra}/>}
    {tab==="Honoraris / Temps"&&<Honoraris obra={obra}/>}
    {tab==="Facturació"&&<Facturacio obra={obra} config={config}/>}
    {tab==="Documents"&&<Card title="Documents"><p>Documents estable. Després reconnectarem Supabase/Gmail API.</p></Card>}
  </div>
}

function Resum({obra}){return <div className="grid3"><Card title="Pressupost"><h3>{euro(obra.pressupost)}</h3></Card><Card title="Client"><h3>{obra.client}</h3></Card><Card title="Estat"><h3>{obra.estat}</h3></Card></div>}

function Certificacions({obra,updateObra}){
  const[selected,setSelected]=useState(String(obra.certs[0]?.numero||1));
  const[mode,setMode]=useState("resum");
  const lines=obra.certLines[selected]||{};
  const setLine=(codi,v)=>updateObra({certLines:{...obra.certLines,[selected]:{...lines,[codi]:v}}});
  const total=certAmount(obra,selected);
  return <div className="stack">
    <Card title="Certificacions guardades" action={<button className="primary" onClick={()=>alert("Certificació guardada")}><Save/> Guardar certificació</button>}>
      <div className="cert-cards">{obra.certs.map(c=><button key={c.id} className={String(c.numero)===selected?"active":""} onClick={()=>setSelected(String(c.numero))}><b>Certificació {c.numero}</b><span>{new Date(c.data).toLocaleDateString("ca-ES")}</span><strong>{euro(certAmount(obra,c.numero))}</strong></button>)}</div>
    </Card>
    <Card title="Certificacions · Resum i quadre">
      <div className="subtabs"><button className={mode==="resum"?"active":""} onClick={()=>setMode("resum")}>Resum per capítols</button><button className={mode==="quadre"?"active":""} onClick={()=>setMode("quadre")}>Quadre detallat Cert. {selected}</button></div>
      {mode==="resum"?<CertResum obra={obra}/>:<CertQuadre obra={obra} selected={selected} lines={lines} setLine={setLine} total={total}/>}
    </Card>
  </div>
}

function CertResum({obra}){
  const caps=groupBy(obra.partides,"cap");
  const rows=Object.entries(caps).map(([cap,items])=>{
    const pressupost=items.reduce((s,p)=>s+p.q*p.pu,0);
    const vals=obra.certs.map(c=>items.reduce((s,p)=>s+(Number(obra.certLines[String(c.numero)]?.[p.codi])||0)*p.pu,0));
    const total=vals.reduce((s,x)=>s+x,0), pendent=Math.max(pressupost-total,0), perc=pressupost?Math.min(total/pressupost*100,100):0;
    return {cap,pressupost,vals,total,pendent,perc};
  });
  return <div className="cert-summary"><div className="cert-head"><span>CAPÍTOL</span><span>PRESSUPOST</span>{obra.certs.map(c=><span key={c.id}>CERT. {c.numero}</span>)}<span>TOTAL CERT.</span><span>PENDENT</span><span>% EXECUTAT</span></div>{rows.map(r=><div className="cert-row" key={r.cap}><b>{r.cap}</b><strong>{euro(r.pressupost)}</strong>{r.vals.map((v,i)=><span key={i}>{euro(v)}</span>)}<strong>{euro(r.total)}</strong><span>{euro(r.pendent)}</span><div className="progress"><div><i style={{width:`${r.perc}%`}}/></div><em>{pct(r.perc)}</em></div></div>)}</div>
}

function CertQuadre({obra,selected,lines,setLine,total}){
  const caps=groupBy(obra.partides,"cap");
  return <div className="excel-wrap"><table className="excel-cert"><thead><tr><th>Partida</th><th>Ut</th><th>Resum</th><th>CanPres</th><th>PrPres</th><th>ImpPres</th><th>Q act.</th><th>% act.</th><th>Imp act.</th></tr></thead><tbody>{Object.entries(caps).map(([cap,items])=><React.Fragment key={cap}><tr className="cap"><td colSpan="9">{cap}</td></tr>{items.map(p=>{const q=Number(lines[p.codi])||0, im=q*p.pu, pc=p.q?q/p.q*100:0;return <tr key={p.codi}><td>{p.codi}</td><td>{p.ut}</td><td className="concept">{p.concepte}</td><td>{num(p.q)}</td><td>{euro(p.pu)}</td><td>{euro(p.q*p.pu)}</td><td className={q>0?"green":""}><input value={q} type="number" step="0.01" onChange={e=>setLine(p.codi,e.target.value)}/></td><td className={q>0?"green":""}>{pc.toFixed(2)}%</td><td className={q>0?"green":""}>{euro(im)}</td></tr>})}</React.Fragment>)}</tbody><tfoot><tr><th colSpan="8">TOTAL CERTIFICACIÓ {selected}</th><th>{euro(total)}</th></tr></tfoot></table></div>
}

function Honoraris({obra}){
  const key=`aco_v51_honoraris_${obra.id}`;
  const[rows,setRows]=useState(()=>read(key,[]));
  const[form,setForm]=useState({data:today(),tipus:"Pressupost",tasca:"",hores:"1.00",preuHora:"50.00",km:"0",preuKm:"0.30",altres:"0"});
  const[edit,setEdit]=useState(null);
  useEffect(()=>write(key,rows),[rows,key]);
  const n=v=>Number(String(v??0).replace(",","."))||0;
  const totalRow=r=>n(r.hores)*n(r.preuHora)+n(r.km)*n(r.preuKm)+n(r.altres);
  const add=()=>{setRows([{id:uid(),...form},...rows]);setForm({...form,tasca:"",hores:"1.00",km:"0",altres:"0"})};
  const upd=(id,k,v)=>setRows(rows.map(r=>r.id===id?{...r,[k]:v}:r));
  const total=rows.reduce((s,r)=>s+totalRow(r),0);
  return <div className="stack"><Card title="Temps invertit / honoraris"><div className="kpis"><div><small>HORES</small><b>{num(rows.reduce((s,r)=>s+n(r.hores),0))} h</b></div><div><small>KM</small><b>{num(rows.reduce((s,r)=>s+n(r.km),0))} km</b></div><div><small>TOTAL</small><b>{euro(total)}</b></div></div></Card>
    <Card title="Nou registre"><div className="honor-form">{["data","tipus","tasca","hores","preuHora","km","preuKm","altres"].map(k=><label key={k}>{k}<input type={k==="data"?"date":k==="tasca"||k==="tipus"?"text":"number"} step="0.01" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><button className="primary" onClick={add}><Plus/> Afegir registre</button></Card>
    <Card title="Registres"><table className="simple-table"><thead><tr><th>Data</th><th>Tipus</th><th>Tasca</th><th>Hores</th><th>€/h</th><th>Km</th><th>Altres</th><th>Total</th><th></th></tr></thead><tbody>{rows.map(r=>{let e=edit===r.id;return <tr key={r.id}><td>{e?<input type="date" value={r.data} onChange={x=>upd(r.id,"data",x.target.value)}/>:r.data}</td><td>{e?<input value={r.tipus} onChange={x=>upd(r.id,"tipus",x.target.value)}/>:r.tipus}</td><td>{e?<input value={r.tasca} onChange={x=>upd(r.id,"tasca",x.target.value)}/>:r.tasca}</td><td>{e?<input type="number" value={r.hores} onChange={x=>upd(r.id,"hores",x.target.value)}/>:num(r.hores)}</td><td>{e?<input type="number" value={r.preuHora} onChange={x=>upd(r.id,"preuHora",x.target.value)}/>:euro(r.preuHora)}</td><td>{e?<input type="number" value={r.km} onChange={x=>upd(r.id,"km",x.target.value)}/>:num(r.km)}</td><td>{e?<input type="number" value={r.altres} onChange={x=>upd(r.id,"altres",x.target.value)}/>:euro(r.altres)}</td><td><b>{euro(totalRow(r))}</b></td><td>{e?<button onClick={()=>setEdit(null)}>Guardar</button>:<button onClick={()=>setEdit(r.id)}>Editar</button>}</td></tr>})}</tbody></table></Card></div>
}

function Facturacio({obra,config}){
  const key=`aco_v51_fact_${obra.id}`;
  const[params,setParams]=useState(()=>read(key,{}));
  const[print,setPrint]=useState(null);
  useEffect(()=>write(key,params),[params,key]);
  const pFor=id=>params[id]||{iva:config.iva||"21",retencio:config.retencio||"0",deduccio:"0"};
  const upd=(id,k,v)=>setParams({...params,[id]:{...pFor(id),[k]:v}});
  function calc(c){const p=pFor(c.id), b=certAmount(obra,c.numero), d=b*(+p.deduccio||0)/100, sub=b-d, iva=sub*(+p.iva||0)/100, ret=sub*(+p.retencio||0)/100;return {p,b,d,sub,iva,ret,total:sub+iva-ret}}
  function printOne(id){setPrint(id);setTimeout(()=>{window.print();setTimeout(()=>setPrint(null),500)},100)}
  return <Card title="Factures proforma de certificacions"><div className="proformas">{obra.certs.map(c=>{const x=calc(c),p=x.p;return <div className={`proforma ${print===c.id?"print-target":""}`} key={c.id}><div className="pro-head"><div><b>Proforma certificació {c.numero}</b><span>{new Date(c.data).toLocaleDateString("ca-ES")}</span></div><div className="actions no-print"><button onClick={()=>printOne(c.id)}><Printer/> Imprimir / PDF</button><button onClick={()=>gmailSendV52(`Proforma certificació ${c.numero}`,`Base: ${euro(x.b)}\nIVA: ${euro(x.iva)}\nRetenció: -${euro(x.ret)}\nTotal: ${euro(x.total)}`)}><Mail/> Gmail</button></div></div><div className="pro-params no-print"><label>IVA<select value={p.iva} onChange={e=>upd(c.id,"iva",e.target.value)}><option value="0">0%</option><option value="10">10%</option><option value="21">21%</option></select></label><label>Retenció<select value={p.retencio} onChange={e=>upd(c.id,"retencio",e.target.value)}><option value="0">0%</option><option value="7">7%</option><option value="15">15%</option><option value="19">19%</option></select></label><label>Deducció<select value={p.deduccio} onChange={e=>upd(c.id,"deduccio",e.target.value)}><option value="0">0%</option><option value="5">5%</option><option value="10">10%</option></select></label></div><table className="pro-table"><tbody><tr><th>Base certificada</th><td>{euro(x.b)}</td></tr><tr><th>Deducció ({p.deduccio}%)</th><td>- {euro(x.d)}</td></tr><tr><th>Subtotal</th><td>{euro(x.sub)}</td></tr><tr><th>IVA ({p.iva}%)</th><td>{euro(x.iva)}</td></tr><tr><th>Retenció ({p.retencio}%)</th><td>- {euro(x.ret)}</td></tr><tr className="total"><th>Total</th><td>{euro(x.total)}</td></tr></tbody></table></div>})}</div></Card>
}

function Clients({db}){return <Card title="Clients"><div>{db.clients.map(c=><p key={c.id}>{c.nom} · {c.email}</p>)}</div></Card>}
function Configuracio({db,setDb}){const cfg=db.config;const upd=(k,v)=>setDb({...db,config:{...cfg,[k]:v}});return <Card title="Configuració"><div className="config-grid"><label>Email<input value={cfg.email} onChange={e=>upd("email",e.target.value)}/></label><label>IVA defecte<input value={cfg.iva} onChange={e=>upd("iva",e.target.value)}/></label><label>Retenció defecte<input value={cfg.retencio} onChange={e=>upd("retencio",e.target.value)}/></label></div></Card>}
createRoot(document.getElementById("root")).render(<App/>);
