// Node mock of the Apps Script services (SpreadsheetApp, Charts, PropertiesService, ScriptApp, Utilities, UrlFetchApp-less).
// Unknown Sheet/Range methods throw, so a call the real API lacks fails loudly. Extend the whitelists when you use new methods.
const fs = require('fs'), vm = require('vm');
const chain = (base) => new Proxy(base, { get(t, p) { if (p in t) return t[p]; if (p === 'then') return undefined; return (...a) => chain(t); } });
function colNum(s){let n=0;for(const ch of s)n=n*26+ch.charCodeAt(0)-64;return n;}
function colLet(n){let s='';while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;}
class Sheet {
  constructor(name){this.name=name;this.cells=new Map();this.maxRows=1000;this.maxCols=26;this.charts=[];
    const OK=['clearConditionalFormatRules','setConditionalFormatRules','setHiddenGridlines','setTabColor','setRowGroupControlPosition','setFrozenColumns'];
    return new Proxy(this,{get(t,p){ if(p in t) return typeof t[p]==='function'?t[p].bind(t):t[p]; if(OK.includes(p)) return ()=>t; if(typeof p==='symbol'||p==='then'||p==='toJSON') return undefined; throw new Error('Sheet method not in whitelist: '+String(p)); }});}
  key(r,c){return r+','+c;}
  get(r,c){const v=this.cells.get(this.key(r,c));return v===undefined?'':v;}
  set(r,c,v){if(r>this.maxRows||c>this.maxCols)throw new Error(`${this.name}: write out of bounds ${r},${c}`);if(v===''||v===null||v===undefined)this.cells.delete(this.key(r,c));else this.cells.set(this.key(r,c),v);}
  getName(){return this.name;}
  getLastRow(){let m=0;for(const k of this.cells.keys()){const r=+k.split(',')[0];if(r>m)m=r;}return m;}
  getLastColumn(){let m=0;for(const k of this.cells.keys()){const c=+k.split(',')[1];if(c>m)m=c;}return m;}
  getMaxRows(){return this.maxRows;} getMaxColumns(){return this.maxCols;}
  insertRowsAfter(a,n){this.maxRows+=n;}
  insertRowsBefore(r,n){if(r<1||n<1)throw new Error('insertRowsBefore');const m=new Map();for(const [k,v] of this.cells){const [rr,cc]=k.split(',').map(Number);m.set((rr>=r?rr+n:rr)+','+cc,v);}this.cells=m;this.maxRows+=n;}
  deleteRows(r,n){if(r<1||n<1||r+n-1>this.maxRows)throw new Error('deleteRows');const m=new Map();for(const [k,v] of this.cells){const [rr,cc]=k.split(',').map(Number);if(rr>=r&&rr<r+n)continue;m.set((rr>=r+n?rr-n:rr)+','+cc,v);}this.cells=m;this.maxRows-=n;}
  hideSheet(){this.hidden=true;return this;}
  deleteColumns(c,n){if(c<1||n<1||c+n-1>this.maxCols)throw new Error(`${this.name}: bad deleteColumns ${c},${n}`);for(const k of [...this.cells.keys()]){const cc=+k.split(',')[1];if(cc>=c)this.cells.delete(k);}this.maxCols-=n;}
  getRange(a,b,c,d){
    if(typeof a==='string'){ let m;
      if((m=a.match(/^([A-Z]+)(\d+)$/)))return new Range(this,+m[2],colNum(m[1]),1,1);
      if((m=a.match(/^([A-Z]+):([A-Z]+)$/))){const c1=colNum(m[1]),c2=colNum(m[2]);return new Range(this,1,c1,this.maxRows,c2-c1+1);}
      if((m=a.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/))){const c1=colNum(m[1]),c2=colNum(m[3]);return new Range(this,+m[2],c1,+m[4]-+m[2]+1,c2-c1+1);}
      throw new Error('A1 not supported '+a);}
    return new Range(this,a,b,c===undefined?1:c,d===undefined?1:d);}
  getDataRange(){return new Range(this,1,1,Math.max(this.getLastRow(),1),this.maxCols);}
  clear(){this.cells.clear();return this;}
  getCharts(){return this.charts.slice();} removeChart(c){this.charts=this.charts.filter(x=>x!==c);}
  newChart(){const o={};let b;b=chain({setOption:(k,v)=>{o[k]=v;return b;},build:()=>({chart:1,opts:o})});return b;}
  insertChart(c){this.charts.push(c);}
  getRowGroup(){return null;}
  setFrozenRows(n){if(n>this.maxRows)throw new Error('freeze');this.frozen=n;return this;}
  setColumnWidth(c,w){if(c>this.maxCols)throw new Error(`${this.name}: column ${c} beyond max`);return this;}
  setRowHeight(){return this;} setRowHeights(r,n){if(r<1||n<1)throw new Error('rowheights');return this;}
  activate(){return this;}
}
const S = (o)=>chain(o);
class Range {
  constructor(sh,r,c,nr,nc){ if(!(r>=1&&c>=1&&nr>=1&&nc>=1)) throw new Error(`${sh.name}: bad range ${r},${c},${nr},${nc}`); if(c+nc-1>sh.maxCols) throw new Error(`${sh.name}: range beyond columns ${c}+${nc}`); if(r+nr-1>sh.maxRows) throw new Error(`${sh.name}: range beyond rows ${r}+${nr} max ${sh.maxRows}`); Object.assign(this,{sh,r,c,nr,nc}); const OKR=['setBackground','setFontColor','setFontWeight','setFontSize','setFontStyle','setWrap','setWrapStrategy','setVerticalAlignment','setHorizontalAlignment','setNumberFormat','insertCheckboxes','setDataValidation','clearDataValidations','clearNote','breakApart','merge','setBorder','shiftRowGroupDepth','setNote'];
    const px=new Proxy(this,{get(t,p){ if(p in t) return typeof t[p]==='function'?t[p].bind(px):t[p]; if(OKR.includes(p)) return ()=>px; if(typeof p==='symbol'||p==='then') return undefined; throw new Error('Range method not in whitelist: '+String(p)); }}); return px; }
  get self(){return this._self||(this._self=this);} 
  getValues(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++)row.push(this.sh.get(this.r+i,this.c+j));o.push(row);}return o;}
  getValue(){return this.sh.get(this.r,this.c);}
  getDisplayValues(){return this.getValues().map(r=>r.map(v=>String(v)));}
  setValues(v){ if(v.length!==this.nr||v.some(x=>x.length!==this.nc)) throw new Error(`${this.sh.name}: setValues dims ${v.length}x${v[0]&&v[0].length} vs ${this.nr}x${this.nc} at ${this.r},${this.c}`); v.forEach((row,i)=>row.forEach((x,j)=>{ if(x===undefined||x===null||(typeof x==='number'&&!isFinite(x))) throw new Error(`${this.sh.name}: bad value at ${this.r+i},${this.c+j}: ${x}`); this.sh.set(this.r+i,this.c+j,x);})); return this;}
  setFormulas(v){return this.setValues(v);}
  setValue(x){for(let i=0;i<this.nr;i++)for(let j=0;j<this.nc;j++)this.sh.set(this.r+i,this.c+j,x);return this;}
  setFormula(f){ if(typeof f!=='string'||f[0]!=='=') throw new Error('bad formula '+f); checkFormula(f,this); this.sh.set(this.r,this.c,f); return this;}
  setRichTextValue(rt){this.sh.set(this.r,this.c,rt.text);return this;}
  setNotes(n){ if(n.length!==this.nr||n[0].length!==this.nc) throw new Error(`${this.sh.name}: setNotes dims ${n[0].length} vs ${this.nc}`); return this;}
  clearContent(){for(let i=0;i<this.nr;i++)for(let j=0;j<this.nc;j++)this.sh.set(this.r+i,this.c+j,'');return this;}
  clear(){return this.clearContent();}
  getA1Notation(){return colLet(this.c)+this.r+(this.nr>1||this.nc>1?':'+colLet(this.c+this.nc-1)+(this.r+this.nr-1):'');}
  getSheet(){return this.sh;}
}
function checkFormula(f,rng){ let d=0; for(const ch of f){ if(ch==='(')d++; if(ch===')')d--; if(d<0) throw new Error('paren '+f);} if(d!==0) throw new Error(`unbalanced parens in ${rng.sh.name}!${rng.getA1Notation()}: ${f}`); const q=(f.match(/"/g)||[]).length; if(q%2) throw new Error(`odd quotes in ${rng.sh.name}!${rng.getA1Notation()}: ${f}`); const b=(f.match(/\{/g)||[]).length-(f.match(/\}/g)||[]).length; if(b) throw new Error('braces '+f); }
const sheets=[]; const named={}; let active=null; const toasts=[]; const alerts=[];
const ss = { getSheetByName:n=>sheets.find(s=>s.name===n)||null, insertSheet:(n,i)=>{const s=new Sheet(n); sheets.push(s); return s;}, getSheets:()=>sheets, deleteSheet:s=>{sheets.splice(sheets.indexOf(s),1);},
  setActiveSheet:s=>{active=s;return s;}, moveActiveSheet:i=>{sheets.splice(sheets.indexOf(active),1);sheets.splice(i-1,0,active);},
  setNamedRange:(n,r)=>{named[n]=r;}, getRangeByName:n=>named[n]||null, toast:(m)=>toasts.push(m) };
const ui = { alert:(a,b,c)=>{alerts.push(b||a); return 'YES';}, ButtonSet:{YES_NO:1}, Button:{YES:'YES'}, createMenu:()=>chain({}) };
const rt = () => { const o={text:''}; const p=chain({setText:t=>{o.text=t;return p;}, setTextStyle:(a,b)=>{ if(a<0||b>o.text.length||a>b) throw new Error(`rich text style out of range ${a}-${b} len ${o.text.length}`); return p;}, build:()=>o}); return p; };
const triggers=[];
const ctx = {
  SpreadsheetApp:{ getActive:()=>ss, getUi:()=>ui, newTextStyle:()=>chain({build:()=>({})}), newRichTextValue:rt, newDataValidation:()=>chain({build:()=>({})}),
    newConditionalFormatRule:()=>chain({build:()=>({})}), WrapStrategy:{OVERFLOW:1}, GroupControlTogglePosition:{BEFORE:1}, BorderStyle:{SOLID:1} },
  Charts:{ChartType:{BAR:'BAR',COLUMN:'COLUMN',PIE:'PIE',SCATTER:'SCATTER'}},
  PropertiesService:{ getDocumentProperties:()=>{ ctx._props=ctx._props||{}; const p=ctx._props; return {getProperty:k=>k in p?p[k]:null,setProperty:(k,v)=>{p[k]=String(v);},deleteProperty:k=>{delete p[k];}}; } },
  ScriptApp:{ newTrigger:fn=>{const t={fn,getHandlerFunction:()=>fn}; const b=chain({create:()=>{triggers.push(t);return t;}}); return b;}, getProjectTriggers:()=>triggers.slice(), deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1) },
  Utilities:{ formatDate:()=>'2026-09-28 12:00', sleep:()=>{} }, Session:{getScriptTimeZone:()=>'UTC'},
  console, Math, Date, JSON, Object, Array, String, Number, Infinity, isFinite,
};
vm.createContext(ctx);
// Path to the Apps Script file under test: CODE_GS env var, else ../Code.gs next to the tests folder.
const codePath = process.env.CODE_GS || require('path').join(__dirname, '..', 'Code.gs');
vm.runInContext(fs.readFileSync(codePath,'utf8'), ctx);
// Top-level const/let are not properties of the context; expose the common ones when the project defines them.
['L','TAB_HELP','ABBREVIATIONS','APP'].forEach(k=>{ try { ctx[k]=vm.runInContext(k,ctx); } catch (e) { /* not defined in this project */ } });
module.exports = { ctx, sheets, named, toasts, alerts, triggers, Sheet };
