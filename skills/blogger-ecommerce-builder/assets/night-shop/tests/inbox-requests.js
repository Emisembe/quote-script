const fs=require('fs'),vm=require('vm');
const sheets={}, mails=[];
function mkSheet(name,rows){rows=rows||[];const sh={rows,getName:()=>sh.name,name,getLastRow:()=>rows.length,getLastColumn:()=>rows.reduce((m,r)=>Math.max(m,r.length),0),
  appendRow:r=>rows.push(r.slice()),setFrozenRows(){},clear(){rows.length=0},setName(n){delete sheets[sh.name];sh.name=n;sheets[n]=sh},
  getRange:(r,c,n,w)=>{n=n||1;w=w||1;const rg={getValues:()=>{const out=[];for(let i=0;i<n;i++){const row=rows[r-1+i]||[];out.push(Array.from({length:w},(_,j)=>row[c-1+j]===undefined?'':row[c-1+j]))}return out},
    setValues:v=>{v.forEach((x,i)=>{rows[r-1+i]=rows[r-1+i]||[];x.forEach((y,j)=>rows[r-1+i][c-1+j]=y)});return rg},setValue:x=>rg.setValues([[x]]),setFontWeight(){return rg},setBackground(){return rg},setFontColor(){return rg}};return rg}};return sh;}
const home=`<div class='shop-settings'>shop_name: Kreislo<br/>currency: EUR</div>`;
let uuid=0;
const ctx={JSON,Date,Math,String,parseInt,parseFloat,isNaN,RegExp,Infinity,encodeURIComponent,Object,
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>sheets[n],insertSheet:n=>(sheets[n]=mkSheet(n)),getUrl:()=>'u'})},
 ScriptApp:{getService:()=>({getUrl:()=>'https://script.google.com/macros/s/X/exec'}),getProjectTriggers:()=>[],newTrigger:()=>({forSpreadsheet:()=>({onEdit:()=>({create(){}})})})},
 HtmlService:{createHtmlOutput:h=>({html:h,setTitle(){return this}})},
 MailApp:{sendEmail:m=>mails.push(m)}, Session:{getEffectiveUser:()=>({getEmail:()=>'owner@x'}),getScriptTimeZone:()=>'Europe/Berlin'},
 Utilities:{formatDate:()=>'x',getUuid:()=>'tok-'+String(++uuid).padStart(30,'0')}, CacheService:{getScriptCache:()=>({get:()=>null,put(){}})},
 UrlFetchApp:{fetch:()=>({getContentText:()=>home,getResponseCode:()=>200})},
 ContentService:{createTextOutput:s=>({setMimeType:()=>s}),MimeType:{JSON:1}},Logger:{log:()=>{}}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2],'utf8')+";SETTINGS.BLOG_URL='https://kreislo.blogspot.com';",ctx);
const post=o=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(o)}}));
console.log('quote:', JSON.stringify(post({type:'lead',kind:'quote',consent:true,lang:'en',page:'p',fields:{Name:'Ada',Company:'ShopX',Email:'ada@x.de',Phone:'+49 151 2',
  'Parcels per month':'50–200','What do you sell?':'=HYPERLINK("x")',Message:'Hi'}})));
console.log('no consent:', JSON.stringify(post({type:'lead',kind:'quote',fields:{Email:'a@b.de'}})));
console.log('no contact:', JSON.stringify(post({type:'lead',kind:'kenya',consent:true,fields:{Name:'Z'}})));
console.log('Requests rows:', JSON.stringify(sheets['Requests'].rows));
console.log('owner mail:', mails[0].subject, '| reply WA:', /wa\.me\/491512/.test(mails[0].htmlBody));
console.log('news:', JSON.stringify(post({type:'lead',kind:'newsletter',consent:true,fields:{Email:'nina@x.de'}})));
const tok=sheets['Newsletter'].rows[1][6];
console.log('confirm mail to:', mails[1].to, '| link:', mails[1].htmlBody.includes('?confirm='+tok), 'unsub:', mails[1].htmlBody.includes('?unsubscribe='+tok));
const pg=ctx.doGet({parameter:{confirm:tok}}); console.log('confirm page:', /now subscribed/.test(pg.html), 'status:', sheets['Newsletter'].rows[1][2]);
console.log('again:', JSON.stringify(post({type:'lead',kind:'newsletter',consent:true,fields:{Email:'NINA@x.de'}})), 'rows', sheets['Newsletter'].rows.length);
console.log('bad token:', /not valid/.test(ctx.doGet({parameter:{confirm:'nope'}}).html));
ctx.doGet({parameter:{unsubscribe:tok}}); console.log('unsub status:', sheets['Newsletter'].rows[1][2]);
console.log('plain doGet:', ctx.doGet({parameter:{}}));
