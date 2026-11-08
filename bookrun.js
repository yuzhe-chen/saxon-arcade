/* Book Run: a small gray-and-white pixel runner. Jump the upright books, duck or jump the flying grades
   (A up high, C at head height, F along the ground). Every 700 points the night comes and everything inverts.
   Needs nothing from the network: it draws itself, so the planner's No Internet button works offline.
   The same code sits inline in planner/index.html: after editing this file run node tools/sync-bookrun.js.

   BookRun.open({mode:'loading', label:'Subway Surfers'})  a loading screen is taking a while:
     a pixel loading bar sits on top; once loading is done the game stays until the player loses, then
     "Loading complete" takes them on. If they never started a run it closes as soon as loading is done.
   BookRun.open({mode:'free'})   the No Internet game: closes with × or Escape at any time.
   BookRun.loaded()              the thing being waited on has finished.
   BookRun.isOpen()                                                                                     */
(function(){
if(window.BookRun)return;
var CSS='.br-ov{position:fixed;inset:0;z-index:2147483000;background:#fafafa;color:#575757;display:flex;align-items:flex-start;justify-content:center;font:600 14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;transition:filter .7s,opacity .3s;outline:none}'+
'.br-ov.night{filter:invert(1)}.br-ov.gone{opacity:0;pointer-events:none}'+
'@media (prefers-color-scheme:dark){.br-ov{filter:invert(.88)}.br-ov.night{filter:none}}'+
/* no box and no words: the ground sits about a quarter of the way down the screen */
'.br-card{width:min(600px,calc(100vw - 32px));margin-top:max(16px,calc(24vh - 220px))}'+
'.br-top{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:min(600px,calc(100vw - 32px));image-rendering:pixelated;image-rendering:crisp-edges}.br-top[hidden]{display:none}'+
'.br-cv{display:block;width:100%;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;cursor:pointer}'+
'.br-foot{margin-top:6px;display:flex;gap:10px;flex-wrap:wrap}'+
'.br-btn{font:700 14px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:#fafafa;background:#575757;border:0;border-radius:6px;padding:11px 18px;cursor:pointer}.br-btn:hover{background:#3c3c3c}.br-btn[hidden]{display:none}'+
'.br-btn.ghost{background:transparent;color:#575757;border:2px solid #c4c4c4;padding:9px 16px}.br-btn.ghost:hover{background:#eee}'+
'.br-x{position:absolute;top:10px;right:12px;width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:#b0b0b0;font:400 26px/1 system-ui,sans-serif;cursor:pointer}.br-x:hover{background:#ececec;color:#575757}.br-x[hidden]{display:none}';

/* 3x5 pixel font */
var F={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',
  '0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110','4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110',
  ' ':'000000000000000','.':'000000000000010','-':'000000111000000',':':'000010000010000','!':'010010010000010'};
var INK='#575757',MID='#9a9a9a',LITE='#c9c9c9',BG='#fafafa',W=240,H=100,G=88;
var RUN=[["...kkkk...","..kkkkkkk.","..klkkl...","..kllll...","...kkkk...","..mkkkk...",".mmkkkkk..",".mmkkkk.k.",".mmkkkk...","..kkkkk...","..kk.kk...","..k...k...",".kk...kk.."],
         ["...kkkk...","..kkkkkkk.","..klkkl...","..kllll...","...kkkk...","..mkkkk...",".mmkkkkk..",".mmkkkk.k.",".mmkkkk...","..kkkkk...","...kkk....","...k.k....","...kk.k..."]];
var DUCK=["..kkkk......",".kkkkkkk....",".klkkl..mm..",".kllllmmmm..","..kkkkkkkk..","..kk..kk....",".kk....kk..."];
var PAL={k:INK,l:LITE,m:MID};
var ov,cv,c,top,tc,doneBtn,closeBtn,xBtn,opts=null,raf=0;
var st,p,obs,speed,dist,next,best=0,last=0,t=0,ground=[],clouds=[],loaded=false,openedAt=0,night=false;
try{best=+localStorage.getItem('sx-bookrun-best')||0;}catch(e){}

function txt(s,x,y,align,col){s=String(s).toUpperCase();var w=s.length*4-1;if(align==='right')x-=w;else if(align==='center')x-=Math.floor(w/2);
  c.fillStyle=col||INK;for(var i=0;i<s.length;i++){var g=F[s[i]]||F[' '];for(var k=0;k<15;k++)if(g[k]==='1')c.fillRect(x+i*4+k%3,y+Math.floor(k/3),1,1);}}
function sprite(rows,x,y){for(var r=0;r<rows.length;r++)for(var q=0;q<rows[r].length;q++){var ch=rows[r][q];if(PAL[ch]){c.fillStyle=PAL[ch];c.fillRect(x+q,y+r,1,1);}}}

function build(){
  var s=document.createElement('style');s.textContent=CSS;(document.head||document.documentElement).appendChild(s);
  ov=document.createElement('div');ov.className='br-ov';ov.tabIndex=-1;ov.setAttribute('role','dialog');
  ov.innerHTML='<canvas class="br-top" width="'+W+'" height="16" hidden></canvas><div class="br-card"><canvas class="br-cv" width="'+W+'" height="'+H+'"></canvas>'+
    '<div class="br-foot"><button class="br-btn br-done" hidden>Loading complete</button><button class="br-btn ghost br-close" hidden>Close minigame</button></div></div>'+
    '<button class="br-x" aria-label="Close" title="Close">×</button>';
  cv=ov.querySelector('.br-cv');c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  top=ov.querySelector('.br-top');tc=top.getContext('2d');tc.imageSmoothingEnabled=false;
  doneBtn=ov.querySelector('.br-done');closeBtn=ov.querySelector('.br-close');xBtn=ov.querySelector('.br-x');
  doneBtn.onclick=close;closeBtn.onclick=close;xBtn.onclick=close;
  cv.addEventListener('pointerdown',function(e){e.preventDefault();press();});
  for(var i=0;i<70;i++)ground.push({x:Math.random()*W,y:G+2+Math.floor(Math.random()*10),w:Math.random()<.3?2:1});
  for(var j=0;j<3;j++)clouds.push({x:40+j*90+Math.random()*30,y:24+Math.floor(Math.random()*20)});
  window.addEventListener('keydown',onKey,true);window.addEventListener('keyup',onKeyUp,true);
}
function onKey(e){if(!opts)return;var k=e.key,used=true;
  if(k===' '||k==='ArrowUp'||k==='w'||k==='W')press();
  else if(k==='ArrowDown'||k==='s'||k==='S')duck(true);
  else if(k==='Enter'){if(!doneBtn.hidden)close();else press();}
  else if(k==='Escape'&&opts.mode==='free')close();
  else used=false;
  if(used){e.preventDefault();e.stopImmediatePropagation();}}
function onKeyUp(e){if(!opts)return;if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){duck(false);e.stopImmediatePropagation();}}

function reset(){p={y:0,vy:0,duck:false};obs=[];speed=2.4;dist=0;next=50;setNight(false);}
function setNight(on){night=on;if(ov)ov.classList.toggle('night',on);}
function press(){if(st==='ready'||st==='dead'){reset();st='run';foot();return;}if(st==='run'&&p.y===0)p.vy=4.6;}
function duck(on){if(st!=='run'){p&&(p.duck=false);return;}p.duck=on;if(on&&p.y>0)p.vy=Math.min(p.vy,-3);}
function die(){st='dead';var s=Math.floor(dist);if(s>best){best=s;try{localStorage.setItem('sx-bookrun-best',String(best));}catch(e){}}foot();}

function spawn(){var r=Math.random(),x=W+4;
  if(dist>350&&r<0.24){var h=[1,9,19][Math.floor(Math.random()*3)];obs.push({x:x,y:h,w:9,h:9,grade:h===19?'A':h===9?'C':'F'});}
  else{var n=r<0.55?1:r<0.85?2:3,books=[],w=0,top=0;
    for(var k=0;k<n;k++){var b={h:10+Math.floor(Math.random()*9),w:4+Math.floor(Math.random()*2),c:[INK,MID,LITE][Math.floor(Math.random()*3)]};books.push(b);w+=b.w;top=Math.max(top,b.h);}
    obs.push({x:x,y:0,w:w,h:top,books:books});}
  next=Math.max(28,(58+Math.random()*58)-speed*4);}
function hit(o){var pw=p.duck?11:7,ph=p.duck?7:13,px=p.duck?16:19,py=G-p.y-ph;
  if(o.books){var x=o.x;for(var i=0;i<o.books.length;i++){var b=o.books[i],by=G-b.h;if(px<x+b.w-1&&px+pw>x+1&&py<by+b.h&&py+ph>by+1)return true;x+=b.w;}return false;}
  var oy=G-o.y-o.h;return px<o.x+o.w-1&&px+pw>o.x+1&&py<oy+o.h-1&&py+ph>oy+1;}
function step(){
  clouds.forEach(function(k){k.x-=0.25;if(k.x<-20){k.x=W+10;k.y=22+Math.floor(Math.random()*24);}});
  if(st!=='run')return;
  dist+=speed/5;speed=Math.min(6.2,2.4+dist/260);
  var n=Math.floor(dist/700),phase=dist-n*700;setNight(n>0&&phase<230);
  p.vy-=0.28;p.y=Math.max(0,p.y+p.vy);if(p.y===0)p.vy=0;
  ground.forEach(function(g){g.x-=speed;if(g.x<-2)g.x+=W+4;});
  if(--next<=0)spawn();
  for(var i=obs.length-1;i>=0;i--){var o=obs[i];o.x-=speed+(o.grade?0.5:0);if(o.x<-24)obs.splice(i,1);else if(hit(o)){die();break;}}}
function drawObs(o){var x=Math.round(o.x);
  if(o.grade){var y=G-o.y-o.h,f=(t>>3)&1;c.fillStyle=INK;c.fillRect(x,y,9,9);c.fillStyle=BG;c.fillRect(x+1,y+1,7,7);txt(o.grade,x+3,y+2);
    c.fillStyle=MID;if(f){c.fillRect(x-3,y+1,3,1);c.fillRect(x+9,y+1,3,1);c.fillRect(x-2,y+2,2,1);c.fillRect(x+9,y+2,2,1);}else{c.fillRect(x-3,y+6,3,1);c.fillRect(x+9,y+6,3,1);c.fillRect(x-2,y+5,2,1);c.fillRect(x+9,y+5,2,1);}return;}
  o.books.forEach(function(b){var y=G-b.h;c.fillStyle=INK;c.fillRect(x,y,b.w,b.h);c.fillStyle=b.c===INK?MID:b.c;c.fillRect(x+1,y+1,b.w-2,b.h-1);
    c.fillStyle=BG;c.fillRect(x+1,y+3,b.w-2,1);c.fillRect(x+1,y+b.h-4,b.w-2,1);x+=b.w;});}
function pad(n){return ('00000'+n).slice(-5);}
function draw(){
  c.fillStyle=BG;c.fillRect(0,0,W,H);
  var go=st!=='ready';
  if(go){c.fillStyle=LITE;clouds.forEach(function(k){var x=Math.round(k.x);c.fillRect(x+3,k.y,8,1);c.fillRect(x+1,k.y+1,13,1);c.fillRect(x,k.y+2,16,1);});}
  if(go)txt('HI '+pad(best)+'  '+pad(Math.floor(dist)),W-4,4,'right');
  if(opts.mode==='loading')drawTop();
  c.fillStyle=INK;c.fillRect(0,G,W,1);if(go)ground.forEach(function(g){c.fillRect(Math.round(g.x),g.y,g.w,1);});
  obs.forEach(drawObs);
  if(p.duck&&p.y===0&&st==='run')sprite(DUCK,15,G-7);else sprite(st==='run'&&p.y===0?RUN[(t>>2)&1]:RUN[0],16,G-13-Math.round(p.y));
  if(st==='dead'){txt('G A M E   O V E R',W/2,40,'center');txt('SPACE OR TAP TO RUN AGAIN',W/2,50,'center');}}
function drawTop(){var g=c;c=tc;c.fillStyle=BG;c.fillRect(0,0,W,16);
  txt(loaded?'LOADING COMPLETE':'LOADING '+(opts.label||''),0,0);txt('TEMPORARY MINIGAME',W,0,'right',MID);
  var frac=loaded?1:Math.min(.95,1-Math.exp(-(Date.now()-openedAt)/((opts.expect||12)*1000)));
  c.fillStyle=INK;c.fillRect(0,8,W,1);c.fillRect(0,14,W,1);c.fillRect(0,8,1,7);c.fillRect(W-1,8,1,7);
  var cells=Math.floor((W-4)/4),on=Math.round(cells*frac);for(var i=0;i<on;i++)c.fillRect(2+i*4,10,3,3);c=g;}
function frame(now){if(!opts){raf=0;return;}raf=requestAnimationFrame(frame);
  if(!last)last=now;var n=Math.min(4,Math.floor((now-last)/16.67));if(n>0){last+=n*16.67;while(n--){step();t++;}}draw();}

function foot(){if(!opts)return;var L=opts.mode==='loading';
  doneBtn.hidden=!(L&&loaded&&st==='dead');closeBtn.hidden=!(L&&!loaded&&st==='dead');xBtn.hidden=L;}
function open(o){
  if(!ov)build();
  opts=o||{mode:'free'};loaded=false;openedAt=Date.now();st='ready';reset();
  top.hidden=opts.mode!=='loading';foot();ov.classList.remove('gone');setNight(false);
  if(!ov.parentNode)document.body.appendChild(ov);
  try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(e){}
  try{ov.focus({preventScroll:true});}catch(e){}
  last=0;if(!raf)raf=requestAnimationFrame(frame);}
function close(){if(!opts)return;var o=opts;opts=null;ov.classList.add('gone');setTimeout(function(){if(!opts&&ov.parentNode)ov.parentNode.removeChild(ov);},320);
  if(o.onClose)try{o.onClose();}catch(e){}}
window.BookRun={
  open:open,close:close,isOpen:function(){return !!opts;},
  loaded:function(){if(!opts||opts.mode!=='loading'||loaded)return;loaded=true;if(st==='ready')close();else foot();}};
})();
