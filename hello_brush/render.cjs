// usage: node render.cjs paint | snap t1 t2 ... | frames [workers] | audio
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT='/home/user/Tracker',HERE=__dirname,PORT=+(process.env.PORT||8902);
const MT={'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.woff2':'font/woff2','.png':'image/png','.json':'application/json'};
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const ARGS=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
async function open(b,q=''){const p=await b.newPage({viewport:{width:1440,height:1080}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await p.goto(`http://127.0.0.1:${PORT}/hello_brush/index.html${q}`);await p.waitForFunction(()=>window.READY||window.DONE,null,{timeout:300000});
  const err=await p.evaluate(()=>window.ERR);if(err){console.log('ERR',err);process.exit(1);}return p;}
(async()=>{const mode=process.argv[2];const b=await chromium.launch({args:ARGS});
 try{
  if(mode==='paint'){const p=await open(b,'?paint=1');const {L,M}=await p.evaluate(()=>({L:window.LAYERS,M:window.META}));fs.mkdirSync(path.join(HERE,'layers'),{recursive:true});
    for(const [k,v] of Object.entries(L))fs.writeFileSync(path.join(HERE,'layers',k+'.png'),Buffer.from(v.split(',')[1],'base64'));
    fs.writeFileSync(path.join(HERE,'layers','meta.json'),JSON.stringify(M));console.log('layers',Object.keys(L).join(' '));}
  else if(mode==='snap'){const p=await open(b);fs.mkdirSync(path.join(HERE,'snaps'),{recursive:true});
    for(const ts of process.argv.slice(3)){const d=await p.evaluate(t=>window.snap(+t),ts);fs.writeFileSync(path.join(HERE,'snaps',`s_${(+ts).toFixed(2).padStart(5,'0')}.jpg`),Buffer.from(d.split(',')[1],'base64'));}}
  else if(mode==='frames'){const NW=+(process.argv[3]||4);const out=path.join(HERE,'frames');fs.mkdirSync(out,{recursive:true});
    const pages=[await open(b)];const extra=[];for(let i=1;i<NW;i++){const b2=await chromium.launch({args:ARGS});extra.push(b2);pages.push(await open(b2));}
    const DUR=await pages[0].evaluate(()=>window.NEWDUR);const N=Math.round(DUR*30);let next=0,done=0;const t0=Date.now();
    await Promise.all(pages.map(async pg=>{while(true){const f=next++;if(f>=N)break;const fn=path.join(out,`f${String(f).padStart(5,'0')}.jpg`);if(fs.existsSync(fn)){done++;continue;}
      const d=await pg.evaluate(f=>window.renderFrame(f),f);fs.writeFileSync(fn,Buffer.from(d.split(',')[1],'base64'));if(++done%60===0)console.log(`${done}/${N} ${((Date.now()-t0)/1000).toFixed(0)}s`);}}));
    console.log('frames done',N);for(const b2 of extra)await b2.close();}
  else if(mode==='audio'){const p=await open(b);const len=await p.evaluate(()=>window.renderAudio());const CH=1<<20,ch=[];
    for(let c=0;c<2;c++){const parts=[];for(let s=0;s<len;s+=CH)parts.push(Buffer.from(await p.evaluate(([c,s,n])=>window.audChunk(c,s,n),[c,s,Math.min(CH,len-s)]),'base64'));ch.push(new Float32Array(Buffer.concat(parts).buffer.slice(0)));}
    const data=Buffer.alloc(len*8);for(let i=0;i<len;i++){data.writeFloatLE(ch[0][i],i*8);data.writeFloatLE(ch[1][i],i*8+4);}
    const h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+data.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(3,20);h.writeUInt16LE(2,22);h.writeUInt32LE(48000,24);h.writeUInt32LE(48000*8,28);h.writeUInt16LE(8,32);h.writeUInt16LE(32,34);h.write('data',36);h.writeUInt32LE(data.length,40);
    fs.writeFileSync(path.join(HERE,'sfx_raw.wav'),Buffer.concat([h,data]));console.log('audio samples',len);}
 }finally{await b.close();srv.close();}})();
