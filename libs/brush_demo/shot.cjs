const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:1080}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('file://'+__dirname+'/test.html');await p.waitForFunction(()=>window.DONE===true,null,{timeout:60000}).catch(e=>errs.push('timeout'));
await p.waitForTimeout(500);await p.screenshot({path:process.argv[2]});console.log('errors:',errs.length?errs:'none');await b.close();})();
