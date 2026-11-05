const fs=require('fs'),vm=require('vm');
const sheets={}, mails=[], triggers=[];
function mkSheet(name,rows){rows=rows||[];const sh={rows,getName:()=>sh.name,name,getLastRow:()=>rows.length,getLastColumn:()=>rows.reduce((m,r)=>Math.max(m,r.length),0),
  appendRow:r=>rows.push(r.slice()),setFrozenRows(){},clear(){rows.length=0},setName(n){delete sheets[sh.name];sh.name=n;sheets[n]=sh},
  getActiveRange:()=>({getRow:()=>sh.active||2}),
  getRange:(r,c,n,w)=>{n=n||1;w=w||1;const rg={
    getValues:()=>{const out=[];for(let i=0;i<n;i++){const row=rows[r-1+i]||[];out.push(Array.from({length:w},(_,j)=>row[c-1+j]===undefined?'':row[c-1+j]))}return out},
    getValue:()=>rg.getValues()[0][0],
    setValues:v=>{v.forEach((x,i)=>{rows[r-1+i]=rows[r-1+i]||[];x.forEach((y,j)=>rows[r-1+i][c-1+j]=y)});return rg},
    setValue:x=>rg.setValues([[x]]),setFontWeight(){return rg},setBackground(){return rg},setFontColor(){return rg},
    getRow:()=>r,getColumn:()=>c,getNumRows:()=>n,getSheet:()=>sh};return rg}};return sh;}
// an Orders tab from the previous version (20 columns, one order)
const OLD=['Order ID','Received','Status','Method','Payment','Name','Phone','Email','Street','Postcode','City','Country','Note','Items','Subtotal','Shipping','Total','Currency','Language','Page'];
sheets['Orders']=mkSheet('Orders',[OLD.slice(),['OLD-1','d','New','Website','','n','p','e','s','pc','c','Germany','','i',1,0,1,'EUR','en','']]);
const home=`<div class='shop-settings'>shop_name: Night Shop<br/>currency: EUR<br/>shipping: 4,90<br/>free_shipping_over: 50<br/>bank: Demo Bank IBAN DE00</div>
<div class='shop-delivery'>DHL Parcel | 4,90 up to 2 kg; 6,99 up to 5 kg | 2–4 working days | /p/delivery.html#dhl | Germany<br/>Pickup in Berlin | 0 | By appointment | /p/delivery.html#pickup | Germany<br/>DHL International | 14,90 up to 5 kg | 4–7 working days | /p/delivery.html#dhl-international | Austria, Switzerland</div>
<div class='shop-contact'>call: +49 1 | x<br/>whatsapp: +49 170 5555 | Mon–Fri<br/>telegram: @demo_shop</div>`;
const prod=(t,attrs)=>({entry:{title:{$t:t},link:[{rel:'alternate',href:'https://x.blogspot.com/'+t+'.html'}],content:{$t:'<div class="product" '+attrs+'>x</div>'}}});
const feed={'111':prod('Tee','data-price="19,90" data-weight="400 g"'),'222':prod('Ebook','data-price="12,90" data-digital="yes"'),'333':prod('Boots','data-price="20" data-weight="1.8"')};
const cache={};
const ctx={JSON,Date,Math,String,parseInt,parseFloat,isNaN,RegExp,Infinity,encodeURIComponent,
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>sheets[n],insertSheet:n=>(sheets[n]=mkSheet(n)),getUrl:()=>'u'}),getActiveSheet:()=>sheets['Orders'],
   getUi:()=>({alert:m=>console.log('  UI alert:',m),createMenu:()=>({addItem(){return this},addToUi(){}})})},
 ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:f=>({forSpreadsheet:()=>({onEdit:()=>({create:()=>triggers.push({getHandlerFunction:()=>f})})})})},
 MailApp:{sendEmail:m=>mails.push(m)}, Session:{getEffectiveUser:()=>({getEmail:()=>'owner@x'}),getScriptTimeZone:()=>'Europe/Berlin'},
 Utilities:{formatDate:()=>'261104-171500'}, CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,put:(k,v)=>cache[k]=v})},
 UrlFetchApp:{fetch:(u)=>{ if(/feeds/.test(u)){const id=u.match(/default\/(\d+)/)[1];return {getResponseCode:()=>feed[id]?200:404,getContentText:()=>JSON.stringify(feed[id])}}
   return {getContentText:()=>home,getResponseCode:()=>200}}},
 ContentService:{createTextOutput:s=>({setMimeType:()=>s}),MimeType:{JSON:1}},Logger:{log:()=>{}}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2],'utf8')+";SETTINGS.BLOG_URL='https://x.blogspot.com';",ctx);
const post=o=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(o)}}));
const cust={name:'Ana',phone:'+49 157 1',email:'ana@example.com',street:'Weg 1',postcode:'10115',city:'Berlin',country:'Germany'};
ctx.setup(); console.log('trigger made:', triggers.length, '| tabs:', Object.keys(sheets).join(', '));
console.log('Orders header extended, old row kept:', sheets['Orders'].rows[0].length, sheets['Orders'].rows[1][0], '| no "(old" tab:', !Object.keys(sheets).some(k=>/old/.test(k)));
// physical: 3 tees (1.2 kg) DHL; tampered price
let r=post({orderId:'TEE-261104-171500',method:'order',customer:{...cust,delivery:'DHL Parcel',payment:'Bank transfer'},items:[{id:'111',qty:3,price:1}]});
console.log('A physical DHL 1.2kg:', JSON.stringify(r), '(expect 59,70+0 free over 50 => 59.7)');
r=post({orderId:'BOO-261104-171501',method:'order',customer:{...cust,delivery:'DHL Parcel'},items:[{id:'333',qty:2}]});
console.log('B boots 3.6kg DHL tier 6,99 => total 46.99:', r.total);
r=post({orderId:'BOO-261104-171502',method:'whatsapp',customer:{...cust,delivery:'Pickup in Berlin'},items:[{id:'333',qty:1}]});
console.log('C pickup => 20:', r.total);
r=post({orderId:'BOO-261104-171503',method:'order',customer:{...cust,country:'Austria',delivery:'Pickup in Berlin'},items:[{id:'333',qty:2}]});
console.log('D Austria (picks pickup by name – lenient):', r.total);
r=post({orderId:'BOO-261104-171504',method:'order',customer:{...cust,country:'Austria',delivery:'DHL International'},items:[{id:'333',qty:3}]});
console.log('E 5.4kg over all AT tiers => error:', JSON.stringify(r));
// digital only, no address
r=post({orderId:'EBO-261104-171505',method:'order',customer:{name:'Dee',phone:'+49 1',email:'dee@example.com',payment:'PayPal',country:'',street:''},items:[{id:'222',qty:1}]});
console.log('F digital only:', JSON.stringify(r));
r=post({orderId:'EBO-261104-171506',method:'order',customer:{name:'Dee',phone:'+49 1',email:'',country:''},items:[{id:'222',qty:1}]});
console.log('G digital no email:', JSON.stringify(r));
r=post({orderId:'X',method:'order',customer:{name:'Dee',phone:'+49 1',email:'x@y.de'},items:[{id:'111',qty:1}]});
console.log('H physical no address:', JSON.stringify(r));
const O=sheets['Orders'].rows, H=O[0];
const col=n=>H.indexOf(n);
console.log('rows:', O.slice(1).map(x=>[x[0],x[col('Delivery')],x[col('Weight (kg)')],x[col('Shipping')],x[col('Downloads sent')]].join('/')).join('  '));
console.log('lines Type:', sheets['Order lines'].rows.map(x=>x[9]).join(','));
console.log('Downloads tab:', JSON.stringify(sheets['Downloads'].rows));
const buyerF=mails.filter(m=>/EBO/.test(m.subject)&&m.to==='dee@example.com')[0];
console.log('buyer email F: no "Delivery to":', !/Delivery to/.test(buyerF.htmlBody), '| download note:', /Your download/.test(buyerF.htmlBody), '| no Shipping row:', !/>Shipping/.test(buyerF.htmlBody));
const ownerF=mails.filter(m=>/EBO/.test(m.subject)&&m.to==='owner@x')[0];
console.log('owner email F: Paid hint:', /set the Status/.test(ownerF.htmlBody));
const buyerA=mails.filter(m=>/TEE/.test(m.subject)&&m.to==='ana@example.com')[0];
console.log('buyer email A: DHL + time:', /DHL Parcel/.test(buyerA.htmlBody) && /2–4 working days/.test(buyerA.htmlBody), '| whatsapp fallback link:', /wa\.me\/491705555/.test(buyerA.htmlBody), /t\.me\/demo_shop/.test(buyerA.htmlBody));
fs.writeFileSync(process.argv[3]+'/r4-buyer-digital.html', buyerF.htmlBody);
// mark Paid without link
const rowF = O.findIndex(x=>x[0]==='EBO-261104-171505')+1;
const before=mails.length;
O[rowF-1][col('Status')]='Paid';
ctx.onOrderEdit({range:sheets['Orders'].getRange(rowF,col('Status')+1)});
console.log('Paid w/o link -> cell:', O[rowF-1][col('Downloads sent')], '| mails sent:', mails.length-before);
sheets['Downloads'].rows[1][2]='https://drive.google.com/file/d/abc/view'; sheets['Downloads'].rows[1][3]='Password: capsule';
ctx.onOrderEdit({range:sheets['Orders'].getRange(rowF,col('Status')+1)});
const dl=mails[mails.length-1];
console.log('Paid with link -> to:', dl.to, '|', dl.subject, '| has link:', /drive\.google\.com\/file\/d\/abc/.test(dl.htmlBody), '| sent cell is date:', O[rowF-1][col('Downloads sent')] instanceof Date);
ctx.onOrderEdit({range:sheets['Orders'].getRange(rowF,col('Status')+1)});
console.log('edit again -> no duplicate mail:', mails[mails.length-1]===dl);
sheets['Orders'].active=rowF; ctx.menuSendDownloads();
console.log('menu resend sends:', mails[mails.length-1]!==dl);
// physical order marked paid
const rowA=O.findIndex(x=>x[0]==='TEE-261104-171500')+1; const n0=mails.length; O[rowA-1][col('Status')]='Paid';
ctx.onOrderEdit({range:sheets['Orders'].getRange(rowA,col('Status')+1)}); console.log('physical Paid -> no mail:', mails.length===n0);
fs.writeFileSync(process.argv[3]+'/r4-download-mail.html', dl.htmlBody);
// cached product second order (stock null bug)
r=post({orderId:'TEE-261104-171510',method:'order',customer:{...cust,delivery:'DHL Parcel'},items:[{id:'111',qty:1}]});
console.log('cached product reorder ok:', r.ok, r.total, '(19,90+4,90=24.8)');
