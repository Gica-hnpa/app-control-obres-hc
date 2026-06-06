
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const fs=require('fs');
const code=fs.readFileSync('/mnt/data/v8751_rescat_funcions_bloquejades/src/App.jsx','utf8');
const out=ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.React,allowJs:true,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext},reportDiagnostics:true,fileName:'App.jsx'});
if(out.diagnostics&&out.diagnostics.length){console.error(out.diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'));process.exit(1)}
console.log('JSX OK');
