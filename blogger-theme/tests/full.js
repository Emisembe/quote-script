// Run: node blogger-theme/tests/<file>.js   (after: python3 scripts/build.py && python3 scripts/preview.py)
// Needs Playwright + Chromium. Font Awesome 4.7 is optional: set FA=/path/to/font-awesome/package for icons in screenshots.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const path=require('path');const fs=require('fs');
const FA = process.env.FA || __dirname + '/fa';
const results=[];const ok=(c,m)=>results.push((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',proxy:{server:process.env.HTTPS_PROXY}});
async function open(page,w){const c=await b.newContext({viewport:{width:w,height:800},ignoreHTTPSErrors:true});const p=await c.newPage();
 await p.route(/font-awesome\.min\.css/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'css/font-awesome.min.css'), contentType: 'text/css'}) : r.fulfill({body: ''}));
 await p.route(/\/fonts\/fontawesome-webfont/, r => fs.existsSync(FA) ? r.fulfill({path: path.join(FA, 'fonts', new URL(r.request().url()).pathname.split('/').pop())}) : r.fulfill({body: ''}));
 await p.route(/youtube\.com|google\.com\/maps|blogspot|googleusercontent/, r => r.fulfill({ body: '', contentType: 'text/html' }));
 if(page==='post') await p.route(/post\.html$/, r=>r.fulfill({contentType:'text/html', body: fs.readFileSync(require('path').join(__dirname, '..', 'preview', 'post.html'),'utf8').replace('ISO 9001 Readiness: A Practical Checklist for Kenyan SMEs</h1>','Quality &amp; Compliance: ISO 9001 #1 Checklist</h1>')}));
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://' + require('path').join(__dirname, '..', 'preview', page + '.html'),{waitUntil:'networkidle',timeout:60000});await p.waitForTimeout(400);
 return {c,p,errs};}
// widths: overflow + errors
for (const page of ['home','post']) for (const w of [320,360,390,414,768,1024,1180,1200,1366,1440,1920]){
 const {c,p,errs}=await open(page,w);
 const m=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));
 ok(m.sw<=m.iw && !errs.length, `${page}@${w}: no sideways scroll (${m.sw}/${m.iw}), JS errors: ${errs.length? errs.join('; '):'none'}`);
 const burger = w<=1180 || await p.evaluate(()=>document.documentElement.classList.contains('menu-overflow'));
 if(burger){
  const r=await p.evaluate(()=>{const btn=document.querySelector('.tm-menu .slicknav_btn');const bars=[...btn.querySelectorAll('.slicknav_icon-bar')].map(x=>x.getBoundingClientRect());const br=btn.getBoundingClientRect();const bar=document.querySelector('.tm-menu').getBoundingClientRect();
   const top=bars[0].top,bot=bars[2].bottom,left=bars[0].left,right=bars[0].right;
   return {dx:((left+right)/2-(br.left+br.right)/2).toFixed(1),dy:((top+bot)/2-(br.top+br.bottom)/2).toFixed(1),btnInBar:((br.top+br.bottom)/2-(bar.top+bar.height/2+ -1)).toFixed(1),label:btn.getAttribute('aria-label')};});
  ok(Math.abs(r.dx)<=1&&Math.abs(r.dy)<=1, `${page}@${w}: hamburger lines centred in button (dx ${r.dx}px, dy ${r.dy}px), button centred in bar (off by ${r.btnInBar}px), aria-label=${r.label}`);
  await p.locator('.tm-menu .slicknav_btn').click();await p.waitForTimeout(400);
  const opened=await p.evaluate(()=>{const n=document.querySelector('.tm-menu .slicknav_nav');const r=n.getBoundingClientRect();return {vis:getComputedStyle(n).display!=='none'&&r.height>0, top:Math.round(r.top), barBottom:Math.round(document.querySelector('.tm-menu').getBoundingClientRect().bottom)};});
  await p.locator('.tm-menu .slicknav_btn').click();await p.waitForTimeout(400);
  const closed=await p.evaluate(()=>getComputedStyle(document.querySelector('.tm-menu .slicknav_nav')).display==='none');
  ok(opened.vis&&closed&&Math.abs(opened.top-opened.barBottom)<=1, `${page}@${w}: menu opens (panel top ${opened.top}, bar bottom ${opened.barBottom}) and closes`);
  if(w===390&&page==='home') await p.screenshot({path:__dirname + '/shots/hamburger-390.png',clip:{x:250,y:0,width:140,height:80}});
 } else {
  const box=await p.locator('#nav1 > li.parent').first().boundingBox();await p.mouse.move(box.x+20,box.y+20);await p.waitForTimeout(600);
  const dd=await p.evaluate(()=>{const u=document.querySelector('#nav1 > li.parent > ul');return getComputedStyle(u).visibility==='visible'&&getComputedStyle(u).opacity==='1';});
  ok(dd, `${page}@${w}: desktop dropdown opens on hover`);
 }
 if(page==='post'&&w===1440){
  const hrefs=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.share-art a')].map(a=>[a.className,a.getAttribute('href')])));
  ok(hrefs['wat-art'].includes('Quality%20%26%20Compliance%3A%20ISO%209001%20%231%20Checklist'), `share links encode "&" and "#": ${hrefs['wat-art'].slice(0,95)}`);
  ok(hrefs['tel-art'].startsWith('https://t.me/share/url?url=file') , `telegram: ${hrefs['tel-art'].slice(0,80)}`);
 }
 if(page==='home'&&w===1440){ await p.mouse.wheel(0,600);await p.waitForTimeout(400);
  ok(await p.evaluate(()=>document.querySelector('.tm-menu').classList.contains('is-scrolled')&&document.querySelector('.tm-menu').getBoundingClientRect().top===0),'menu bar stays at top and turns solid after scrolling');}
 await c.close();}
console.log(results.join('\n'));console.log(`\n${results.filter(r=>r.startsWith('PASS')).length} passed, ${results.filter(r=>r.startsWith('FAIL')).length} failed`);
await b.close();})();
